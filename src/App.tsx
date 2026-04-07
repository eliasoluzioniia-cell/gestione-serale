import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import GestioneClassi from './pages/GestioneClassi'
import RegistroVoti from './pages/RegistroVoti'
import Calendario from './pages/Calendario'
import Materie from './pages/Materie'
import Tabellone from './pages/Tabellone'
import PianoFormativo from './pages/PianoFormativo'
import CurriculoGestione from './pages/CurriculoGestione'
import GestioneStudenti from './pages/GestioneStudenti'
import Configurazioni from './pages/Configurazioni'
import UtentiGestione from './pages/UtentiGestione'
import Layout from './components/Layout'
import './index.css'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('App: mounting and fetching session');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: session retrieved', !!session);
      setSession(session)
      setLoading(false)
    }).catch(err => {
      console.error('App: session error', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App: auth state changed', _event, !!session);
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/" element={session ? <Layout session={session} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="classi" element={<GestioneClassi session={session} />} />
          <Route path="studenti" element={<GestioneStudenti session={session} />} />
          <Route path="materie" element={<Materie session={session} />} />
          <Route path="voti" element={<RegistroVoti />} />
          <Route path="curriculo" element={<PianoFormativo />} />
          <Route path="curriculo-gestione" element={<CurriculoGestione session={session} />} />
          <Route path="tabellone" element={<Tabellone session={session} />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="utenti" element={<UtentiGestione />} />
          <Route path="configurazioni" element={<Configurazioni session={session} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
