import { useState, useEffect } from 'react';
import { getProfiles, updateProfile, deleteProfile } from '../lib/supabase_api';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';

interface Profile {
  id: string;
  nome_completo: string | null;
  email: string | null;
  ruolo: 'Docente' | 'Studente' | 'Admin' | 'Tutor';
  created_at?: string;
}

export default function UtentiGestione() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form stato per nuovo utente
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'Docente'
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error("Errore nel caricamento profili:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.fullName) return alert("Compila i campi obbligatori");
    
    setIsCreating(true);
    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: newUser,
      });

      if (error) {
        // Se l'errore è 404, la funzione non è stata deployata
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          throw new Error("LA FUNZIONE NON È STATA TROVATA. Devi lanciare 'npx supabase functions deploy create-user' nel terminale.");
        }
        throw error;
      }

      setIsCreateModalOpen(false);
      setNewUser({ email: '', fullName: '', password: '', role: 'Docente' });
      fetchProfiles();
      alert("Utente creato con successo!");
    } catch (err: any) {
      console.error("Dettaglio errore:", err);
      alert("ERRORE: " + (err.message || "Errore sconosciuto nella comunicazione con Supabase. Verifica che la funzione sia online."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (ruolo: Profile['ruolo']) => {
    if (!selectedProfile) return;
    try {
      await updateProfile(selectedProfile.id, { ruolo });
      setProfiles((prev: Profile[]) => prev.map((p: Profile) => p.id === selectedProfile.id ? { ...p, ruolo } : p));
      setIsModalOpen(false);
    } catch (err) {
      alert("Errore nell'aggiornamento ruolo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro? L'utente perderà l'accesso.")) return;
    setIsDeleting(true);
    try {
      await deleteProfile(id);
      setProfiles((prev: Profile[]) => prev.filter((p: Profile) => p.id !== id));
    } catch (err) {
      alert("Errore nell'eliminazione");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = (role || 'Docente').toLowerCase();
    const styles: Record<string, string> = {
      admin: "bg-red-50 text-red-600 border-red-100",
      tutor: "bg-blue-50 text-blue-600 border-blue-100",
      docente: "bg-emerald-50 text-emerald-600 border-emerald-100",
      studente: "bg-slate-50 text-slate-500 border-slate-100"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest ${styles[r] || styles.docente}`}>
        {role}
      </span>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-primary">
      <span className="material-symbols-outlined animate-spin text-5xl mb-4 italic">progress_activity</span>
      <p className="font-black uppercase text-xs tracking-[0.2em] animate-pulse">Inizializzazione Sistema...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-2">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-primary rounded-full hidden md:block" />
          <h1 className="text-5xl font-black font-headline tracking-tighter text-slate-900 mb-2">
            Gestione <span className="text-primary italic">Personale</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-md leading-relaxed">
            Pannello amministrativo per la configurazione dei profili e dei permessi di accesso.
          </p>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="group relative px-8 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:bg-primary active:scale-95 shadow-2xl shadow-slate-200"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-90">add</span>
            Nuovo Account
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>
      </div>

      {/* Grid delle Statistiche Rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Totale', value: profiles.length, icon: 'group' },
          { label: 'Docenti', value: profiles.filter(p => p.ruolo === 'Docente').length, icon: 'school' },
          { label: 'Tutor', value: profiles.filter(p => p.ruolo === 'Tutor').length, icon: 'support_agent' },
          { label: 'Admin', value: profiles.filter(p => p.ruolo === 'Admin').length, icon: 'admin_panel_settings' },
        ].map((stat, i) => (
          <div key={i} className="bg-white/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm transition-all hover:shadow-md hover:border-primary/20">
            <span className="material-symbols-outlined text-primary/40 text-2xl mb-2">{stat.icon}</span>
            <div className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.value}</div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabella Utenti Reimagined */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identità Digitale</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Livello Accesso</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amministrazione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profiles.map((profile: Profile) => (
                <tr key={profile.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:rotate-3 transition-all duration-500 shadow-inner">
                        {(profile.nome_completo || profile.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-lg text-slate-800 tracking-tight group-hover:text-primary transition-colors">
                          {profile.nome_completo || 'Profilo da configurare'}
                        </p>
                        <p className="text-sm font-mono text-slate-400 group-hover:text-slate-600">
                          {profile.email || 'Email non disponibile'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    {getRoleBadge(profile.ruolo)}
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <button 
                        onClick={() => { setSelectedProfile(profile); setIsModalOpen(true); }}
                        className="h-11 px-4 text-slate-400 hover:text-primary hover:bg-white rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border border-transparent hover:border-slate-100 shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">settings</span>
                          Ruolo
                        </span>
                      </button>
                      <button 
                        onClick={() => handleDelete(profile.id)}
                        disabled={isDeleting}
                        className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {profiles.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-slate-200">person_off</span>
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nessun utente caricato nel sistema</p>
          </div>
        )}
      </div>

      {/* Modal Creazione Nuovo Utente */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Inizializza Nuovo Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Nominativo Completo</label>
              <input 
                type="text"
                placeholder="es. Mario Rossi"
                required
                value={newUser.fullName}
                onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Email Istituzionale</label>
              <input 
                type="email"
                placeholder="nome@scuola.it"
                required
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Password Iniziale</label>
              <input 
                type="text"
                placeholder="Lascia vuoto per default: Password123!"
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold placeholder:text-slate-300 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['Docente', 'Studente', 'Tutor', 'Admin'] as Profile['ruolo'][]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setNewUser({...newUser, role: r})}
                  className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                    newUser.role === r ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isCreating}
            className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {isCreating ? 'Elaborazione in corso...' : 'Conferma Creazione'}
          </button>
        </form>
      </Modal>

      {/* Modal Cambio Ruolo (Esistente) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Configurazione Livello Accesso"
      >
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 gap-3">
            {(['Admin', 'Tutor', 'Docente', 'Studente'] as Profile['ruolo'][]).map((r) => (
              <button
                key={r}
                onClick={() => handleUpdateRole(r)}
                className={`flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all group ${
                  selectedProfile?.ruolo === r 
                    ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedProfile?.ruolo === r ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                  }`}>
                    <span className="material-symbols-outlined text-2xl">
                      {r === 'Admin' ? 'admin_panel_settings' : 
                       r === 'Tutor' ? 'support_agent' : 
                       r === 'Docente' ? 'school' : 'person'}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className={`block font-black uppercase text-xs tracking-widest ${
                      selectedProfile?.ruolo === r ? 'text-primary' : 'text-slate-500'
                    }`}>{r}</span>
                  </div>
                </div>
                {selectedProfile?.ruolo === r && (
                  <span className="material-symbols-outlined text-primary scale-125">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

