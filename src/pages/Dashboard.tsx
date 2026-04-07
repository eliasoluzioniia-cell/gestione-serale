import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({ classi: 0, materiali: 0, voti: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const { count: classiCount } = await supabase.from('classi').select('*', { count: 'exact', head: true })
      const { count: materieCount } = await supabase.from('materie').select('*', { count: 'exact', head: true })
      const { count: valutazioniCount } = await supabase.from('valutazioni').select('*', { count: 'exact', head: true })
      
      setStats({
        classi: classiCount || 0,
        materiali: materieCount || 0,
        voti: valutazioniCount || 0
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-on-surface font-headline tracking-tight">Panoramica Generale</h2>
        <p className="text-on-surface-variant mt-2 text-sm max-w-2xl">Visualizza un riepilogo in tempo reale dell'attività scolastica, inclusi i nuovi materiali caricati, le valutazioni e la gestione delle classi serali.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-primary font-medium animate-pulse">Analisi dei dati in corso...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 editorial-shadow border border-surface-variant relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container rounded-bl-full opacity-10 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface">Classi Attive</h3>
            </div>
            <p className="text-5xl font-black text-primary font-headline mb-4">{stats.classi}</p>
            <Link to="/classi" className="text-sm font-semibold text-primary hover:text-primary-container flex items-center gap-1 transition-colors">
              Gestisci <span className="material-symbols-outlined text-[1rem]">arrow_forward</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 editorial-shadow border border-surface-variant relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container rounded-bl-full opacity-30 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface">Materie</h3>
            </div>
            <p className="text-5xl font-black text-secondary font-headline mb-4">{stats.materiali}</p>
            <Link to="/materie" className="text-sm font-semibold text-secondary hover:text-secondary-fixed-dim flex items-center gap-1 transition-colors">
              Gestisci Discipline <span className="material-symbols-outlined text-[1rem]">arrow_forward</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 editorial-shadow border border-surface-variant relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed rounded-bl-full opacity-30 group-hover:scale-110 transition-transform"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined">grading</span>
              </div>
              <h3 className="font-bold text-lg text-on-surface">Voti Registrati</h3>
            </div>
            <p className="text-5xl font-black text-tertiary font-headline mb-4">{stats.voti}</p>
            <Link to="/voti" className="text-sm font-semibold text-tertiary hover:text-tertiary-container flex items-center gap-1 transition-colors">
              Apri Tabellone <span className="material-symbols-outlined text-[1rem]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 bg-surface-container-low rounded-2xl p-8 border border-surface-container-high editorial-shadow flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Pianifica le prossime lezioni</h3>
          <p className="text-on-surface-variant text-sm">Aggiungi eventi, appelli e verifiche al calendario condiviso.</p>
        </div>
        <Link to="/calendario" className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold shadow-md hover:shadow-lg hover:bg-primary-container transition-all flex items-center gap-2">
          <span className="material-symbols-outlined">add_circle</span>
          Nuovo Evento
        </Link>
      </div>
    </div>
  )
}
