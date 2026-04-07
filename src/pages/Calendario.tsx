import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'


interface OrarioLezione {
  id: string;
  giorno: number;
  ora_index: number;
  ora_inizio: string;
  ora_fine: string;
  materia: { codice: string; descrizione: string };
  docente?: { nome: string; cognome: string };
}

interface Event { id: string; title: string; date: string; type: string; }
interface Classe { id: string; periodo: string; sezione: string; anno_corso: string; }

const GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
const ORE_SLOTS = [
  { index: 0, label: '1ª Ora', range: '15:25 - 16:15' },
  { index: 1, label: '2ª Ora', range: '16:15 - 17:05' },
  { index: 2, label: '3ª Ora', range: '17:05 - 17:55' },
  { index: 3, label: '4ª Ora', range: '18:05 - 18:55' },
  { index: 4, label: '5ª Ora', range: '18:55 - 19:45' },
  { index: 5, label: '6ª Ora', range: '19:45 - 20:35' },
];

export default function Calendario() {
  const [classes, setClasses] = useState<Classe[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [orario, setOrario] = useState<OrarioLezione[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orario' | 'eventi'>('orario')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedClass) fetchOrario()
  }, [selectedClass])

  const fetchInitialData = async () => {
    const { data: cls } = await supabase.from('classi').select('*').order('periodo')
    setClasses(cls || [])
    if (cls && cls.length > 0) setSelectedClass(cls[0].id)
    
    const { data: evs } = await supabase.from('calendar_events').select('*').order('date')
    setEvents(evs || [])
    setLoading(false)
  }

  const fetchOrario = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orario_lezioni')
      .select(`
        *,
        materia:materie(codice, descrizione),
        docente:docenti(nome, cognome)
      `)
      .eq('classe_id', selectedClass)
    
    setOrario(data || [])
    setLoading(false)
  }

  const getLezione = (giornoIdx: number, oraIdx: number) => {
    return orario.find(l => l.giorno === giornoIdx && l.ora_index === oraIdx)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 font-headline tracking-tight">Calendario Scolastico</h1>
          <p className="text-slate-500 font-medium">Gestione orari settimanali e scadenze didattiche</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex">
            <button 
              onClick={() => setActiveTab('orario')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'orario' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Orario Lezioni
            </button>
            <button 
              onClick={() => setActiveTab('eventi')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'eventi' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Eventi & Verifiche
            </button>
          </div>

          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-sm"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.periodo} - Sez. {c.sezione}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-200">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse">Caricamento in corso...</p>
        </div>
      ) : activeTab === 'orario' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-5 bg-slate-50/50 border-b border-slate-100 w-32"></th>
                  {GIORNI.map((g) => (
                    <th key={g} className="p-5 bg-slate-50/50 border-b border-slate-100 text-center">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 block mb-1">Giorno</span>
                      <span className="text-lg font-black text-slate-800 font-headline">{g}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ORE_SLOTS.map((slot) => (
                  <tr key={slot.index} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-5 bg-slate-50/30 border-r border-slate-100 group-hover:bg-slate-50">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-primary uppercase tracking-tighter">{slot.label}</span>
                        <span className="text-[11px] font-bold text-slate-400 mt-0.5">{slot.range}</span>
                      </div>
                    </td>
                    {GIORNI.map((_, gIdx) => {
                      const lez = getLezione(gIdx, slot.index)
                      return (
                        <td key={gIdx} className="p-3 align-top border-r border-slate-50 last:border-r-0 min-w-[180px]">
                          {lez ? (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 h-full group/card hover:bg-primary/10 hover:scale-[1.02] transition-all duration-300">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-sm shadow-primary/20">
                                  {lez.materia.codice}
                                </span>
                                <span className="material-symbols-outlined text-primary/30 group-hover/card:text-primary transition-colors text-[1.2rem]">school</span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-800 leading-tight mb-3 line-clamp-2">
                                {lez.materia.descrizione}
                              </h4>
                              {lez.docente && (
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-white/60 p-2 rounded-xl">
                                  <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">
                                    {lez.docente.cognome[0]}
                                  </div>
                                  <span className="truncate">{lez.docente.cognome} {lez.docente.nome[0]}.</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full min-h-[100px] border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">Libero</span>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Orario Standard In Vigore</span>
             </div>
             <div className="h-4 w-[1px] bg-slate-200"></div>
             <p className="text-xs text-slate-400 font-medium italic">L''orario potrebbe subire variazioni in base alle disposizioni scolastiche.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center bg-white rounded-3xl border border-slate-200">
              <span className="material-symbols-outlined text-4xl mb-4 opacity-50">event_busy</span>
              <p>Nessun evento pianificato.</p>
            </div>
          ) : (
            events.map(ev => (
              <div key={ev.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    ev.type === 'verifica' ? 'bg-error-container text-error' : 'bg-primary-container text-primary'
                  }`}>
                    {ev.type}
                  </div>
                  <span className="text-xs font-bold text-slate-400">{new Date(ev.date).toLocaleDateString('it-IT')}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 font-headline mb-4 group-hover:text-primary transition-colors">{ev.title}</h3>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <span className="material-symbols-outlined text-[1.2rem] text-slate-300">event</span>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">Pianificato</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
