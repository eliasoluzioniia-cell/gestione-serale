-- ==========================================
-- V2 SECURITY & AUTH TRIGGERS
-- Eseguire questo script nel SQL Editor di Supabase
-- ==========================================

-- 1. AGGIORNAMENTO VINCOLI RUOLI (Per includere 'Studente')
ALTER TABLE public.utenti DROP CONSTRAINT IF EXISTS utenti_ruolo_check;
ALTER TABLE public.utenti ADD CONSTRAINT utenti_ruolo_check 
    CHECK (ruolo IN ('Admin', 'Docente', 'Tutor', 'Studente'));

-- Aggiunta colonne per gestione semplificata (Cache dei dati di Auth)
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS nome_completo TEXT;


-- 2. FUNZIONE TRIGGER PER NUOVI UTENTI
-- Questa funzione sincronizza auth.users con la nostra tabella public.utenti
-- Se il ruolo è Docente e viene fornito un docente_id nei metadati, lo collega automaticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_utente_uuid UUID;
    v_docente_id UUID;
BEGIN
    -- 1. Crea il record in public.utenti
    INSERT INTO public.utenti (auth_id, ruolo, email, nome_completo)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'role', 'Docente'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'nome_completo')
    )
    RETURNING id INTO v_utente_uuid;

    -- 2. Se è Docente ed è stato fornito un docente_id, aggiorna la tabella docenti
    v_docente_id := (NEW.raw_user_meta_data->>'docente_id')::UUID;
    IF v_docente_id IS NOT NULL THEN
        UPDATE public.docenti 
        SET utente_id = v_utente_uuid
        WHERE id = v_docente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Creazione del trigger sull'inserimento in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ABILITAZIONE RLS E POLITICHE ACCESSO
-- Docenti: Permettiamo a tutti di vederli (selezione in fase di registrazione)
-- ma limitiamo chi non è loggato a vedere solo ID, Nome e Cognome.
ALTER TABLE public.docenti ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Docenti visibili per registrazione" ON public.docenti;
CREATE POLICY "Docenti visibili per registrazione" 
ON public.docenti FOR SELECT 
USING (true); -- Semplice per ora, permette il fetch iniziale

-- Utenti/Profili: Ogni utente vede solo se stesso
ALTER TABLE public.utenti ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Utenti vedono proprio profilo" ON public.utenti;
CREATE POLICY "Utenti vedono proprio profilo" 
ON public.utenti FOR SELECT 
USING (auth.uid() = auth_id);

-- Cattedre: i docenti loggati vedono le proprie
ALTER TABLE public.assegnazioni_cattedre ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Docenti vedono proprie cattedre" ON public.assegnazioni_cattedre;
CREATE POLICY "Docenti vedono proprie cattedre" 
ON public.assegnazioni_cattedre FOR SELECT 
USING (auth.role() = 'authenticated'); -- Per ora permettiamo a tutti i loggati di leggere

-- Materie/Classi/Competenze: Accesso in lettura per tutti i loggati
ALTER TABLE public.materie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lettura materie" ON public.materie FOR SELECT USING (true);

ALTER TABLE public.classi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lettura classi" ON public.classi FOR SELECT USING (true);

ALTER TABLE public.competenze ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lettura competenze" ON public.competenze FOR SELECT USING (true);

ALTER TABLE public.curricolo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lettura curricolo" ON public.curricolo FOR SELECT USING (true);
