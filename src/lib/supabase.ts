import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Mancano le variabili d\'ambiente di Supabase! Assicurati che VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano configurate.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Esportiamo i tipi per compatibilità con il resto dell'app
export type Session = any
export type UserProfile = any
