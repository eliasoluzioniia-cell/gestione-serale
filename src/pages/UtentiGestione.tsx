import { useState, useEffect } from 'react';
import { getProfiles, updateProfile, deleteProfile } from '../lib/supabase_api';
import { Modal } from '../components/Modal';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'docente' | 'studente' | 'segreteria' | 'admin' | 'tutor';
  created_at: string;
}

export default function UtentiGestione() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleUpdateRole = async (role: Profile['role']) => {
    if (!selectedProfile) return;
    try {
      await updateProfile(selectedProfile.id, { role });
      setProfiles((prev: Profile[]) => prev.map((p: Profile) => p.id === selectedProfile.id ? { ...p, role } : p));
      setIsModalOpen(false);
    } catch (err) {
      alert("Errore nell'aggiornamento ruolo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo profilo? L'utente non potrà più accedere al sistema.")) return;
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

  const getRoleBadge = (role: Profile['role']) => {
    const styles = {
      admin: "bg-error-container text-error border-error/20",
      tutor: "bg-primary-container text-primary border-primary/20",
      docente: "bg-success/10 text-success border-success/20",
      segreteria: "bg-warning/10 text-warning border-warning/20",
      studente: "bg-slate-100 text-slate-500 border-slate-200"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[role] || styles.studente}`}>
        {role}
      </span>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-primary">
      <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
      <p className="font-bold">Caricamento utenti...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Gestione Utenti</h1>
          <p className="text-slate-500">Amministrazione accessi e permessi di sistema</p>
        </div>
        <button 
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          onClick={() => alert("Per creare un nuovo utente, chiedi all'amministratore di sistema di registrare l'email tramite Supabase Auth.")}
        >
          <span className="material-symbols-outlined">person_add</span>
          Nuovo Utente
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-surface-variant overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#f7f9fb] border-b border-surface-variant">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Utente</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ruolo</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {profiles.map((profile: Profile) => (
              <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{profile.full_name || 'N/A'}</p>
                      <p className="text-xs text-slate-500 font-mono">{profile.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  {getRoleBadge(profile.role)}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setSelectedProfile(profile); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                      title="Modifica Ruolo"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(profile.id)}
                      disabled={isDeleting}
                      className="p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-xl transition-all"
                      title="Elimina Utente"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {profiles.length === 0 && (
          <div className="p-20 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">group_off</span>
            <p className="text-slate-400 font-medium">Nessun utente trovato</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Modifica Ruolo Utente"
      >
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-6">
            <p className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-tight">Stai modificando:</p>
            <p className="font-black text-lg">{selectedProfile?.full_name || selectedProfile?.email}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(['admin', 'tutor', 'docente', 'segreteria', 'studente'] as Profile['role'][]).map((r) => (
              <button
                key={r}
                onClick={() => handleUpdateRole(r)}
                className={`flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all group ${
                  selectedProfile?.role === r 
                    ? 'border-primary bg-primary/5' 
                    : 'border-slate-100 hover:border-primary/20 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedProfile?.role === r ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <span className="material-symbols-outlined">
                      {r === 'admin' ? 'admin_panel_settings' : 
                       r === 'tutor' ? 'support_agent' : 
                       r === 'docente' ? 'school' : 
                       r === 'segreteria' ? 'business_center' : 'person'}
                    </span>
                  </div>
                  <span className={`font-black uppercase text-xs tracking-widest ${
                    selectedProfile?.role === r ? 'text-primary' : 'text-slate-500'
                  }`}>{r}</span>
                </div>
                {selectedProfile?.role === r && (
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
