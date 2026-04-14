import { useEffect, useState } from 'react'
import { supabase } from '../lib/api'
import type { Session } from '../lib/api'
import type { Scuola, Indirizzo, AnnoScolastico } from '../types'
import { 
  GraduationCap, 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2
} from 'lucide-react'

type Tab = 'istituto' | 'indirizzi' | 'anni'

export default function Configurazioni({ session }: { session?: Session | null }) {
  const role = (session?.user?.ruolo || (session?.user as any)?.user_metadata?.role || 'studente').toLowerCase()
  const isDocente = role === 'docente'
  const [activeTab, setActiveTab] = useState<Tab>('istituto')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Data states
  const [scuola, setScuola] = useState<Scuola | null>(null)
  const [indirizzi, setIndirizzi] = useState<Indirizzo[]>([])
  const [anni, setAnni] = useState<AnnoScolastico[]>([])

  // Modal/Edit states
  const [editingIndirizzo, setEditingIndirizzo] = useState<Partial<Indirizzo> | null>(null)
  const [editingAnno, setEditingAnno] = useState<Partial<AnnoScolastico> | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
    const scResult = supabase.from('scuole').select('*').limit(1);
    const indResult = supabase.from('indirizzi').select('*').order('nome');
    const anniResult = supabase.from('anni_scolastici').select('*').order('anno', { ascending: false });

    const [scData, indData, anniData] = await Promise.all([
      scResult,
      indResult,
      anniResult,
    ]);

    const scErr = (scData as any)?.error;
    const indErr = (indData as any)?.error;
    const anniErr = (anniData as any)?.error;

      if (scErr) console.error("Errore fetch scuole:", scErr)
      if (indErr) console.error("Errore fetch indirizzi:", indErr)
      if (anniErr) console.error("Errore fetch anni:", anniErr)

      // Se non c'è una scuola, creiamo un oggetto locale vuoto per l'input
      setScuola((scData as any)?.data?.[0] || { id: '', nome: '' })
      setIndirizzi((indData as any)?.data || [])
      setAnni((anniData as any)?.data || [])

      if (scErr || indErr || anniErr) {
        setError("Si è verificato un errore nel recupero di alcuni dati. Controlla la console.")
      }
    } catch (err: any) {
      setError("Errore nel caricamento delle configurazioni: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- Istituto ---
  const handleSaveScuola = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scuola || !scuola.nome.trim()) {
      setError("Inserisci un nome per l'istituto.")
      return
    }
    setSaving(true)
    setError(null)

    const token = localStorage.getItem('neon_auth_token');
    const isNew = !scuola.id;
    let savedFirstRecord: any = null;
    if (isNew) {
      const res = await fetch('/api/data/scuole', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: scuola.nome }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); setSaving(false); return; }
      savedFirstRecord = d;
    } else {
      const res = await fetch(`/api/data/scuole?id=${scuola.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nome: scuola.nome }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); setSaving(false); return; }
    }
    setSuccess(isNew ? "Istituto creato con successo!" : "Nome istituto aggiornato!")
    if (savedFirstRecord) setScuola(savedFirstRecord)
    setSaving(false)
    setTimeout(() => setSuccess(null), 3000)
  }

  // --- Indirizzi ---
  const handleSaveIndirizzo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIndirizzo || !editingIndirizzo.nome?.trim()) return
    
    // Per salvare un indirizzo serve una scuola esistente
    if (!scuola || !scuola.id) {
        setError("Salva prima il nome dell'istituto per poter aggiungere indirizzi.")
        return
    }
    setSaving(true)
    setError(null)
    
    const token = localStorage.getItem('neon_auth_token');
    const payload = { nome: editingIndirizzo.nome, scuola_id: scuola.id };
    let res: Response;
    if (editingIndirizzo.id) {
      res = await fetch(`/api/data/indirizzi?id=${editingIndirizzo.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/data/indirizzi', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    }
    const d = await res.json();
    if (!res.ok) setError(d.error || 'Errore salvataggio')
    else { setEditingIndirizzo(null); fetchData(); setSuccess("Indirizzo salvato!") }
    setSaving(false)
    setTimeout(() => setSuccess(null), 2000)
  }

  const handleDeleteIndirizzo = async (id: string) => {
    if (!id) return
    if (!confirm("Sei sicuro? Se ci sono classi associate a questo indirizzo, l'operazione fallirà.")) return
    const token = localStorage.getItem('neon_auth_token');
    const res = await fetch(`/api/data/indirizzi?id=${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { const d = await res.json(); setError("Errore eliminazione: " + d.error); }
    else fetchData();
  }

  // --- Anni Scolastici ---
  const handleSaveAnno = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAnno || !editingAnno.anno?.trim()) return
    setSaving(true)
    setError(null)


    const token = localStorage.getItem('neon_auth_token');
    const annoPayload: any = { anno: editingAnno.anno, attivo: editingAnno.is_corrente || false };
    let annoRes: Response;
    if (editingAnno.id) {
      annoRes = await fetch(`/api/data/anni_scolastici?id=${editingAnno.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(annoPayload),
      });
    } else {
      annoRes = await fetch('/api/data/anni_scolastici', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(annoPayload),
      });
    }
    const annoData = await annoRes.json();
    if (!annoRes.ok) setError(annoData.error || 'Errore salvataggio')
    else { setEditingAnno(null); fetchData(); setSuccess("Anno scolastico salvato!") }
    setSaving(false)
    setTimeout(() => setSuccess(null), 2000)
  }

  const handleToggleCurrent = async (anno: AnnoScolastico) => {
    if (!anno.id) return
    setSaving(true)
    setError(null)
    // Imposta tutti gli altri anni come non correnti, poi imposta quello selezionato
    const token = localStorage.getItem('neon_auth_token');
    // Usa SQL diretto via endpoint dedicato
    const res = await fetch(`/api/data/anni_scolastici?id=${anno.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ attivo: true }),
    });
    const d = await res.json();
    if (!res.ok) setError(d.error)
    else fetchData();
    setSaving(false)
  }

  const handleDeleteAnno = async (id: string) => {
    if (!id) return
    if (!confirm("Sei sicuro? Se ci sono classi associate a questo anno, l'operazione fallirà.")) return
    const token = localStorage.getItem('neon_auth_token');
    const res = await fetch(`/api/data/anni_scolastici?id=${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { const d = await res.json(); setError("Errore eliminazione: " + d.error); }
    else fetchData();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] text-primary">
       <Clock className="animate-spin mr-2" /> Caricamento impostazioni...
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 text-on-surface">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-variant pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">Configurazioni</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestisci la struttura scolastica e i parametri globali</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-error-container border border-error/20 text-error px-6 py-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('istituto')}
          className={`px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'istituto' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
        >
          Istituto
        </button>
        <button 
          onClick={() => setActiveTab('indirizzi')}
          className={`px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'indirizzi' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
        >
          Indirizzi
        </button>
        <button 
          onClick={() => setActiveTab('anni')}
          className={`px-6 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'anni' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
        >
          Anni Scolastici
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-surface-variant shadow-sm p-8 min-h-[400px]">
        {activeTab === 'istituto' && (
          <div className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-4 text-primary">
              <Building2 size={32} />
              <h2 className="text-2xl font-black font-headline text-on-surface">Dati dell'Istituto</h2>
            </div>
            
            <form onSubmit={handleSaveScuola} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome della Scuola</label>
                <input 
                  required
                  value={scuola?.nome || ''}
                  onChange={e => setScuola(prev => ({ ...prev!, nome: e.target.value }))}
                  className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-6 py-4 font-bold text-xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="Inserisci il nome ufficiale..."
                />
              </div>
              {!isDocente && (
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  <Save size={18} />
                  {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              )}
            </form>
          </div>
        )}

        {activeTab === 'indirizzi' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-primary">
                <GraduationCap size={32} />
                <h2 className="text-2xl font-black font-headline text-on-surface">Indirizzi di Studio</h2>
              </div>
              {!isDocente && !editingIndirizzo && (
                <button 
                  onClick={() => setEditingIndirizzo({ nome: '' })}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:scale-105 transition-all"
                >
                  <Plus size={18} /> Nuovo Indirizzo
                </button>
              )}
            </div>

            {editingIndirizzo && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-primary/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <h3 className="font-black text-primary uppercase text-xs tracking-widest">
                  {editingIndirizzo.id ? 'Modifica Indirizzo' : 'Nuovo Indirizzo'}
                </h3>
                <form onSubmit={handleSaveIndirizzo} className="flex gap-4">
                  <input 
                    autoFocus
                    required
                    value={editingIndirizzo.nome || ''}
                    onChange={e => setEditingIndirizzo(prev => ({ ...prev!, nome: e.target.value }))}
                    className="flex-1 bg-white border border-surface-variant rounded-xl px-5 py-3 font-bold outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="es. Informatica e Telecomunicazioni"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingIndirizzo(null)} className="px-5 py-3 bg-white text-slate-500 rounded-xl font-bold border border-surface-variant hover:bg-slate-100">Annulla</button>
                    <button type="submit" disabled={saving} className="px-5 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20">Salva</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indirizzi.map(ind => (
                <div key={ind.id} className="flex items-center justify-between p-5 bg-white border border-surface-variant rounded-2xl group hover:border-primary/30 transition-all shadow-sm">
                  <span className="font-bold text-on-surface">{ind.nome}</span>
                   {!isDocente && (
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setEditingIndirizzo({ ...ind })} className="p-2 text-slate-400 hover:text-primary rounded-lg transition-colors"><Edit2 size={18} /></button>
                       <button onClick={() => handleDeleteIndirizzo(ind.id)} className="p-2 text-slate-400 hover:text-error rounded-lg transition-colors"><Trash2 size={18} /></button>
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'anni' && (
          <div className="space-y-8">
             <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-primary">
                <Calendar size={32} />
                <h2 className="text-2xl font-black font-headline text-on-surface">Anni Scolastici</h2>
              </div>
              {!isDocente && !editingAnno && (
                <button 
                  onClick={() => setEditingAnno({ anno: '', is_corrente: false })}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:scale-105 transition-all"
                >
                  <Plus size={18} /> Nuovo Anno
                </button>
              )}
            </div>

            {editingAnno && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-primary/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <h3 className="font-black text-primary uppercase text-xs tracking-widest">
                  {editingAnno.id ? 'Modifica Anno' : 'Nuovo Anno Scolastico'}
                </h3>
                <form onSubmit={handleSaveAnno} className="flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <input 
                      autoFocus
                      required
                      value={editingAnno.anno || ''}
                      onChange={e => setEditingAnno(prev => ({ ...prev!, anno: e.target.value }))}
                      className="flex-1 bg-white border border-surface-variant rounded-xl px-5 py-3 font-bold outline-none focus:ring-4 focus:ring-primary/10"
                      placeholder="es. 2024/2025"
                    />
                    <label className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 bg-white rounded-xl border border-surface-variant">
                      <input 
                        type="checkbox"
                        checked={editingAnno.is_corrente || false}
                        onChange={e => setEditingAnno(prev => ({ ...prev!, is_corrente: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm font-bold text-slate-600">Anno Corrente</span>
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setEditingAnno(null)} className="px-5 py-3 bg-white text-slate-500 rounded-xl font-bold border border-surface-variant hover:bg-slate-100">Annulla</button>
                    <button type="submit" disabled={saving} className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 text-sm uppercase tracking-widest">Salva Anno</button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {anni.map(a => (
                <div key={a.id} className={`flex items-center justify-between p-5 rounded-2xl group transition-all border-2 shadow-sm ${a.is_corrente ? 'bg-primary/5 border-primary/20' : 'bg-white border-surface-variant'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-on-surface">{a.anno}</span>
                    {a.is_corrente && (
                      <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ring-4 ring-primary/10">CORRENTE</span>
                    )}
                  </div>
                   <div className="flex items-center gap-2">
                     {!isDocente && !a.is_corrente && (
                       <button 
                         onClick={() => handleToggleCurrent(a)}
                         className="px-4 py-2 bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-surface-variant hover:text-primary hover:border-primary transition-all opacity-0 group-hover:opacity-100"
                       >
                         Imposta corrente
                       </button>
                     )}
                     {!isDocente && (
                       <>
                         <button onClick={() => setEditingAnno({ ...a })} className="p-2 text-slate-400 hover:text-primary rounded-lg transition-colors"><Edit2 size={18} /></button>
                         <button onClick={() => handleDeleteAnno(a.id)} className="p-2 text-slate-400 hover:text-error rounded-lg transition-colors"><Trash2 size={18} /></button>
                       </>
                     )}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
