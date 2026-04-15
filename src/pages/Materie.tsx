import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Materia { id: string; codice: string; descrizione: string; }
interface Docente { id: string; nome: string; cognome: string; utente_id?: string; }
interface Classe { id: string; anno_corso: number; sezione: string; indirizzo_id: string; indirizzi?: { nome: string } }
interface Assegnazione { 
  id: string; 
  classe_id: string; 
  materia_id: string; 
  docente_id: string; 
  classi?: { anno_corso: number; sezione: string; indirizzi?: { nome: string } };
  materie?: { descrizione: string; codice: string; nome?: string };
  docenti?: { nome: string; cognome: string };

}

type Tab = 'materie' | 'docenti' | 'cattedre'

export default function Materie({ session }: { session: any }) {
  const role = (session?.user?.user_metadata?.role || 'studente').toLowerCase()
  const isDocente = role === 'docente'
  const [activeTab, setActiveTab] = useState<Tab>('materie')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Data
  const [materie, setMaterie] = useState<Materia[]>([])
  const [docenti, setDocenti] = useState<Docente[]>([])
  const [classi, setClassi] = useState<Classe[]>([])
  const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>([])

  // Search
  const [search, setSearch] = useState('')

  // Editing
  const [editingMateria, setEditingMateria] = useState<Partial<Materia> | null>(null)
  const [editingDocente, setEditingDocente] = useState<Partial<Docente> | null>(null)
  const [newAssegnazione, setNewAssegnazione] = useState({ classe_id: '', materia_id: '', docente_id: '' })

  // Filters for Cattedre
  const [cattedreFilters, setCattedreFilters] = useState({ classe: '', materia: '', docente: '' })

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [mRes, dRes, cRes, aRes] = await Promise.all([
        supabase.from('materie').select('*').order('descrizione'),
        supabase.from('docenti').select('*').order('cognome'),
        supabase.from('classi').select('*, indirizzi(nome)').order('anno_corso'),
        supabase.from('assegnazioni_cattedre').select(`
          *,
          classi:classe_id (anno_corso, sezione, indirizzi:indirizzo_id(nome)),
          materie:materia_id (descrizione, codice),
          docenti:docente_id (nome, cognome)
        `)
      ])

      if (mRes.error) throw new Error("Materie: " + mRes.error.message);
      if (dRes.error) throw new Error("Docenti: " + dRes.error.message);
      if (cRes.error) throw Error("Classi: " + cRes.error.message);
      if (aRes.error) throw Error("Cattedre: " + aRes.error.message);

      setMaterie(mRes.data || [])
      setDocenti(dRes.data || [])
      setClassi(cRes.data || [])
      setAssegnazioni(aRes.data || [])
    } catch (err: any) {
      console.error("Fetch error:", err)
      setError(err.message || "Errore durante il caricamento dei dati")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- Actions for Materie ---
  const handleSaveMateria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMateria?.descrizione) return
    setSaving(true)
    setError(null)
    const { error } = editingMateria.id 
      ? await supabase.from('materie').update({ codice: editingMateria.codice, descrizione: editingMateria.descrizione }).eq('id', editingMateria.id)
      : await supabase.from('materie').insert([editingMateria])
    
    if (error) setError(error.message)
    else {
      setSuccess("Materia salvata!")
      setEditingMateria(null)
      fetchData()
    }
    setSaving(false)
  }

  const handleDeleteMateria = async (id: string) => {
    if (!id) return
    if (!confirm("Eliminare questa materia?")) return
    const { error } = await supabase.from('materie').delete().eq('id', id)
    if (error) setError(error.message)
    else fetchData()
  }

  // --- Actions for Docenti ---
  const handleSaveDocente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDocente?.cognome) return
    setSaving(true)
    setError(null)
    const { error } = editingDocente.id 
      ? await supabase.from('docenti').update({ nome: editingDocente.nome, cognome: editingDocente.cognome }).eq('id', editingDocente.id)
      : await supabase.from('docenti').insert([editingDocente])
    
    if (error) setError(error.message)
    else {
      setSuccess("Docente salvato!")
      setEditingDocente(null)
      fetchData()
    }
    setSaving(false)
  }

  const handleDeleteDocente = async (id: string) => {
    if (!id) return
    if (!confirm("Eliminare questo docente?")) return
    const { error } = await supabase.from('docenti').delete().eq('id', id)
    if (error) setError(error.message)
    else fetchData()
  }

  // --- Actions for Cattedre ---
  const handleSaveAssegnazione = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssegnazione.classe_id || !newAssegnazione.materia_id || !newAssegnazione.docente_id) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('assegnazioni_cattedre').insert([newAssegnazione])
    if (error) setError("Errore: Impossibile creare l'assegnazione. Controlla che non esista già.")
    else {
      setSuccess("Assegnazione creata!")
      setNewAssegnazione({ classe_id: '', materia_id: '', docente_id: '' })
      fetchData()
    }
    setSaving(false)
  }

  const handleDeleteAssegnazione = async (id: string) => {
    if (!id) return
    if (!confirm("Rimuovere questa assegnazione?")) return
    const { error } = await supabase.from('assegnazioni_cattedre').delete().eq('id', id)
    if (error) setError(error.message)
    else fetchData()
  }

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => { setSuccess(null); setError(null) }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const filteredMaterie = materie.filter(m => 
    m.descrizione.toLowerCase().includes(search.toLowerCase()) || 
    m.codice.toLowerCase().includes(search.toLowerCase())
  )

  const filteredDocenti = docenti.filter(d => 
    (d.nome + ' ' + d.cognome).toLowerCase().includes(search.toLowerCase())
  )

  const filteredAssegnazioni = assegnazioni.filter(a => {
    return (
      (!cattedreFilters.classe || a.classe_id === cattedreFilters.classe) &&
      (!cattedreFilters.materia || a.materia_id === cattedreFilters.materia) &&
      (!cattedreFilters.docente || a.docente_id === cattedreFilters.docente)
    )
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface font-headline italic tracking-tight">Materie e Discipline</h1>
          <p className="text-slate-500 mt-1">Gestisci l'organico, le materie e le cattedre assegnate</p>
        </div>
        <div className="flex gap-2">
          {!isDocente && activeTab === 'materie' && (
            <button onClick={() => setEditingMateria({})} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-primary-container transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">add_box</span> Nuova Materia
            </button>
          )}
          {!isDocente && activeTab === 'docenti' && (
            <button onClick={() => setEditingDocente({})} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow hover:bg-primary-container transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">person_add</span> Nuovo Docente
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-surface-variant w-fit shadow-sm">
        {(['materie', 'docenti', 'cattedre'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearch('') }}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Search Bar for Materie/Docenti */}
      {activeTab !== 'cattedre' && (
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder={`Cerca ${activeTab === 'materie' ? 'materia o codice...' : 'nome docente...'}`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-surface-variant rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
          />
        </div>
      )}

      {/* Feedback Notifications */}
      <div className="fixed top-24 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        {success && <div className="bg-primary-container text-primary px-6 py-4 rounded-2xl font-bold shadow-xl border border-primary/20 animate-in slide-in-from-right-full flex items-center gap-3 pointer-events-auto"><span className="material-symbols-outlined italic">check_circle</span> {success}</div>}
        {error && <div className="bg-error-container text-error px-6 py-4 rounded-2xl font-bold shadow-xl border border-error/20 animate-in slide-in-from-right-full flex items-center gap-3 pointer-events-auto"><span className="material-symbols-outlined italic">error</span> {error}</div>}
      </div>

      {loading ? (
        <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-primary font-bold animate-pulse">Sincronizzazione dati in corso...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* MATERIE LIST */}
          {activeTab === 'materie' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterie.map(m => (
                <div key={m.id} className="bg-white p-5 rounded-2xl border border-surface-variant shadow-sm hover:shadow-md transition-all flex items-center justify-between group hover:border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-high text-primary rounded-xl flex items-center justify-center font-black font-headline text-lg group-hover:bg-primary-container transition-all">{m.codice || '??'}</div>
                    <div>
                      <h3 className="font-bold text-lg text-on-surface">{m.descrizione}</h3>
                      <p className="text-xs text-slate-500 line-clamp-1">{m.codice}</p>
                    </div>
                  </div>
                  {!isDocente && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingMateria(m)} className="p-2.5 hover:bg-surface-container-high rounded-xl text-primary transition-colors" title="Modifica"><span className="material-symbols-outlined text-[1.2rem]">edit</span></button>
                      <button onClick={() => handleDeleteMateria(m.id)} className="p-2.5 hover:bg-error-container rounded-xl text-error transition-colors" title="Elimina"><span className="material-symbols-outlined text-[1.2rem]">delete_forever</span></button>
                    </div>
                  )}
                </div>
              ))}
              {filteredMaterie.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 bg-surface-container-lowest rounded-3xl border-2 border-dashed border-surface-variant">Nessuna materia trovata.</div>}
            </div>
          )}

          {/* DOCENTI LIST */}
          {activeTab === 'docenti' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocenti.map(d => (
                <div key={d.id} className="bg-white p-5 rounded-2xl border border-surface-variant shadow-sm hover:shadow-md transition-all flex items-center justify-between group hover:border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-fixed text-primary rounded-full flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined">account_circle</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-on-surface">{d.cognome} {d.nome}</h3>
                      <p className="text-xs text-slate-400 font-mono tracking-tighter uppercase">Docente</p>
                    </div>
                  </div>
                  {!isDocente && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingDocente(d)} className="p-2 hover:bg-surface-container-high rounded-xl text-primary transition-colors"><span className="material-symbols-outlined text-[1.2rem]">edit</span></button>
                      <button onClick={() => handleDeleteDocente(d.id)} className="p-2 hover:bg-error-container rounded-xl text-error transition-colors"><span className="material-symbols-outlined text-[1.2rem]">delete</span></button>
                    </div>
                  )}
                </div>
              ))}
              {filteredDocenti.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 bg-surface-container-lowest rounded-3xl border-2 border-dashed border-surface-variant">Nessun docente in elenco.</div>}
            </div>
          )}

          {/* CATTEDRE (ASSEGNAZIONI) */}
          {activeTab === 'cattedre' && (
            <div className="space-y-6">
              {/* Box Nuova Assegnazione */}
              {!isDocente && (
                <div className="bg-white p-6 rounded-3xl border border-surface-variant shadow-sm ring-4 ring-slate-50">
                  <h3 className="text-lg font-black text-on-surface mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <span className="material-symbols-outlined text-primary">add_link</span> Nuova Assegnazione
                  </h3>
                  <form onSubmit={handleSaveAssegnazione} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">CLASSE</label>
                      <select value={newAssegnazione.classe_id} onChange={e => setNewAssegnazione({...newAssegnazione, classe_id: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm">
                        <option value="">Seleziona Classe...</option>
                        {classi.map(c => <option key={c.id} value={c.id}>{c.anno_corso}{c.sezione} - {c.indirizzi?.nome}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">MATERIA</label>
                      <select value={newAssegnazione.materia_id} onChange={e => setNewAssegnazione({...newAssegnazione, materia_id: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm">
                        <option value="">Seleziona Materia...</option>
                        {materie.map(m => <option key={m.id} value={m.id}>{m.descrizione} ({m.codice})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-400 ml-1 uppercase tracking-widest">DOCENTE</label>
                      <select value={newAssegnazione.docente_id} onChange={e => setNewAssegnazione({...newAssegnazione, docente_id: e.target.value})} className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-sm">
                        <option value="">Seleziona Docente...</option>
                        {docenti.map(d => <option key={d.id} value={d.id}>{d.cognome} {d.nome}</option>)}
                      </select>
                    </div>
                    <button type="submit" disabled={saving || !newAssegnazione.classe_id || !newAssegnazione.materia_id || !newAssegnazione.docente_id} className="bg-primary text-white py-3.5 rounded-2xl font-black shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0">
                      <span className="material-symbols-outlined font-black">add</span> ASSEGNA
                    </button>
                  </form>
                </div>
              )}

              {/* FILTRI ASSEGNAZIONI */}
              <div className="bg-surface-container-lowest border border-surface-variant p-4 rounded-2xl flex flex-wrap items-center gap-4">
                  <span className="material-symbols-outlined text-slate-400">filter_list</span>
                  <select 
                    value={cattedreFilters.classe} 
                    onChange={e => setCattedreFilters({...cattedreFilters, classe: e.target.value})}
                    className="flex-1 min-w-[150px] px-3 py-2 bg-white border border-surface-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                  >
                      <option value="">Tutte le Classi</option>
                      {classi.map(c => <option key={c.id} value={c.id}>{c.anno_corso}{c.sezione}</option>)}
                  </select>
                  <select 
                    value={cattedreFilters.materia} 
                    onChange={e => setCattedreFilters({...cattedreFilters, materia: e.target.value})}
                    className="flex-1 min-w-[150px] px-3 py-2 bg-white border border-surface-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                  >
                      <option value="">Tutte le Materie</option>
                      {materie.map(m => <option key={m.id} value={m.id}>{m.descrizione}</option>)}
                  </select>
                  <select 
                    value={cattedreFilters.docente} 
                    onChange={e => setCattedreFilters({...cattedreFilters, docente: e.target.value})}
                    className="flex-1 min-w-[150px] px-3 py-2 bg-white border border-surface-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                  >
                      <option value="">Tutti i Docenti</option>
                      {docenti.map(d => <option key={d.id} value={d.id}>{d.cognome} {d.nome}</option>)}
                  </select>
                  <button 
                    onClick={() => setCattedreFilters({ classe: '', materia: '', docente: '' })}
                    className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                    title="Azzera filtri"
                  >
                    <span className="material-symbols-outlined text-[1.2rem]">filter_alt_off</span>
                  </button>
              </div>

              {/* LISTA ASSEGNAZIONI (Cattedre) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssegnazioni.map(a => (
                    <div key={a.id} className="bg-white p-5 rounded-3xl border border-surface-variant shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed/30 rounded-bl-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                       <div className="flex flex-col h-full justify-between">
                          <div className="space-y-4">
                             <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-black italic rounded-full uppercase tracking-tighter">
                                {a.classi?.anno_corso}{a.classi?.sezione}
                             </span>
                             <div>
                                <h4 className="font-bold text-on-surface line-clamp-1">{(a.materie as any)?.descrizione || (a.materie as any)?.nome}</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase">{a.docenti?.cognome} {a.docenti?.nome}</p>
                             </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{a.classi?.indirizzi?.nome || 'Base'}</span>
                             {!isDocente && (
                               <button onClick={() => handleDeleteAssegnazione(a.id)} className="w-8 h-8 flex items-center justify-center bg-error-container text-error rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                  <span className="material-symbols-outlined text-[1rem]">close</span>
                               </button>
                             )}
                          </div>
                       </div>
                    </div>
                  ))}
                  {filteredAssegnazioni.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-surface-variant">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
                        <p className="font-bold italic">Nessuna assegnazione corrispondente ai filtri.</p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal for Materie */}
      {editingMateria && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-4 ring-white/20">
            <div className="px-8 py-6 border-b border-surface-variant bg-surface-container-lowest flex justify-between items-center">
              <h2 className="text-2xl font-black font-headline text-on-surface italic">{editingMateria.id ? 'Modifica Materia' : 'Nuova Materia'}</h2>
              <button onClick={() => setEditingMateria(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSaveMateria} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Codice (es. AB24)</label>
                <input value={editingMateria.codice || ''} onChange={e => setEditingMateria({...editingMateria, codice: e.target.value})} required className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-black text-lg" placeholder="Codice..." />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Nome Disciplina (Descrizione)</label>
                <input value={editingMateria.descrizione || ''} onChange={e => setEditingMateria({...editingMateria, descrizione: e.target.value})} required className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-bold" placeholder="Nome..." />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg ring-offset-2 hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50">
                   {saving ? 'Attendere...' : (editingMateria.id ? 'SALVA MODIFICHE' : 'CREA MATERIA')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editor Modal for Docenti */}
      {editingDocente && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-4 ring-white/20">
            <div className="px-8 py-6 border-b border-surface-variant bg-surface-container-lowest flex justify-between items-center">
              <h2 className="text-2xl font-black font-headline text-on-surface italic">{editingDocente.id ? 'Modifica Docente' : 'Nuovo Docente'}</h2>
              <button onClick={() => setEditingDocente(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSaveDocente} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Cognome</label>
                  <input value={editingDocente.cognome || ''} onChange={e => setEditingDocente({...editingDocente, cognome: e.target.value})} required className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-black text-lg" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-widest ml-1">Nome</label>
                  <input value={editingDocente.nome || ''} onChange={e => setEditingDocente({...editingDocente, nome: e.target.value})} required className="w-full px-5 py-4 bg-surface-container-low border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-black text-lg" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic px-2">Assicurati che i dati siano corretti per le stampe ufficiali del registro e dei Patti Formativi (PFI).</p>
              <div className="pt-4">
                <button type="submit" disabled={saving} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg ring-offset-2 hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50">
                    {saving ? 'Salvataggio...' : (editingDocente.id ? 'AGGIORNA ANAGRAFICA' : 'REGISTRA DOCENTE')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
