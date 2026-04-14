/**
 * supabase.ts — Shim di compatibilità
 * Re-esporta il client Neon come "supabase" per compatibilità con il codice esistente.
 * Tutti i file che importano da './lib/supabase' o '../lib/supabase' continuano a funzionare.
 */
export { supabase, api, type Session, type UserProfile } from './api';
