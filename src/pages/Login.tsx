import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<'Docente' | 'Studente' | 'Tutor'>('Docente')
  
  // Registration extras
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  useEffect(() => {
    if (mode === 'register' && role === 'Docente') {
      fetchTeachers()
    }
  }, [mode, role])

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('docenti')
      .select('id, nome, cognome')
      .is('utente_id', null)
      .order('cognome')
    
    if (!error) setAvailableTeachers(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    } else {
      // Validation for Docente
      if (role === 'Docente' && !selectedTeacherId) {
        setError('Per favore seleziona il tuo nome dalla lista docenti.')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { role },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (signUpError) {
        setError(signUpError.message)
      } else if (data.user) {
        // Link teacher if Docente
        if (role === 'Docente' && selectedTeacherId) {
          // The trigger on auth.users created public.utenti. 
          // We need to wait a moment or just use the ID.
          // Since it's a fresh signup, we update the docenti table.
          
          // Note: In a real world app, this should be a single transaction or managed by a more secure flow.
          // Here, we try to update based on the newly created user's profile.
          
          const { data: profile } = await supabase
            .from('utenti')
            .select('id')
            .eq('auth_id', data.user.id)
            .single()

          if (profile) {
            const { error: updateError } = await supabase
              .from('docenti')
              .update({ utente_id: profile.id })
              .eq('id', selectedTeacherId)
            
            if (updateError) console.error("Errore collegamento docente:", updateError)
          }
        }
        setError('Registrazione completata! Controlla la tua email per confermare l\'account.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-6 shadow-sm">
           <span className="material-symbols-outlined text-3xl">school</span>
        </div>
        <h1 className="text-4xl font-extrabold text-primary font-headline tracking-tight mb-2">Gestione Corsi Serali</h1>
        <h2 className="text-xl font-bold text-on-surface">
          {mode === 'login' ? 'Accedi al tuo account' : 'Crea un nuovo account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-surface-variant relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          
          <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="nome@esempio.it"
                className="appearance-none block w-full px-4 py-3.5 border border-outline-variant rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all sm:text-sm bg-surface-container-lowest"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="appearance-none block w-full px-4 py-3.5 border border-outline-variant rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all sm:text-sm bg-surface-container-lowest"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Il tuo Ruolo</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value as any)} 
                    className="block w-full px-4 py-3.5 border border-outline-variant rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all sm:text-sm bg-surface-container-lowest font-medium"
                  >
                    <option value="Docente">Docente</option>
                    <option value="Tutor">Tutor / Amministratore</option>
                    <option value="Studente">Studente</option>
                  </select>
                </div>

                {role === 'Docente' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Cerca il tuo Nome</label>
                    <select 
                      value={selectedTeacherId} 
                      onChange={e => setSelectedTeacherId(e.target.value)} 
                      required
                      className="block w-full px-4 py-3.5 border border-outline-variant rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all sm:text-sm bg-surface-container-lowest font-bold text-primary"
                    >
                      <option value="">-- Seleziona dalla lista --</option>
                      {availableTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.cognome} {t.nome}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-[11px] text-slate-400 leading-relaxed italic px-1">
                      * Se il tuo nome non appare, significa che l'account è già stato creato o devi contattare la segreteria.
                    </p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-start gap-3 ${error.includes('completata') ? 'bg-primary/10 text-primary' : 'bg-error-container text-error'}`}>
                <span className="material-symbols-outlined text-[18px]">info</span>
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl text-md font-black text-on-primary bg-primary hover:bg-primary-container hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
                {loading ? 'Attendere...' : mode === 'login' ? 'ACCEDI ALLA PIATTAFORMA' : 'CREA ACCOUNT'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-surface-variant">
            <p className="text-sm text-slate-500 mb-2 font-medium">
              {mode === 'login' ? 'Non hai ancora un account?' : 'Hai già una registrazione?'}
            </p>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
              className="text-primary font-black hover:text-primary-container transition-colors underline decoration-2 underline-offset-4 decoration-primary/30"
            >
              {mode === 'login' ? 'REGISTRATI ORA' : 'TORNA AL LOGIN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

