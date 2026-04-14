-- ==========================================
-- SCHEMA V2 per Neon Serverless Postgres
-- Adattato da Supabase → Neon
-- NESSUNA dipendenza da auth.*, auth.uid(), auth.role()
-- La sicurezza è gestita lato API (Vercel Functions)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. ANNI SCOLASTICI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.anni_scolastici (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anno TEXT NOT NULL UNIQUE,
    attivo BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. UTENTI (con autenticazione propria)
-- ==========================================
-- Questa tabella sostituisce auth.users di Supabase
-- Le password sono hashate con bcrypt (gestito dalle API Vercel)
CREATE TABLE IF NOT EXISTS public.utenti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nome_completo TEXT,
    ruolo TEXT NOT NULL DEFAULT 'Docente',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ,
    CONSTRAINT utenti_ruolo_check CHECK (ruolo IN ('Admin', 'Docente', 'Tutor', 'Studente'))
);

-- Index per login rapido
CREATE INDEX IF NOT EXISTS idx_utenti_email ON public.utenti(email);

-- ==========================================
-- 3. DOCENTI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.docenti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    codice_fiscale TEXT UNIQUE,
    email TEXT,
    utente_id UUID REFERENCES public.utenti(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docenti_utente ON public.docenti(utente_id);

-- ==========================================
-- 4. CLASSI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.classi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anno_corso INTEGER NOT NULL,
    sezione TEXT NOT NULL,
    periodo TEXT,
    anno_scolastico_id UUID REFERENCES public.anni_scolastici(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. MATERIE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.materie (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codice TEXT UNIQUE,
    descrizione TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 6. ASSEGNAZIONI CATTEDRE (docente-classe-materia)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.assegnazioni_cattedre (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
    materia_id UUID NOT NULL REFERENCES public.materie(id) ON DELETE CASCADE,
    ore_settimanali INTEGER DEFAULT 0,
    anno_scolastico_id UUID REFERENCES public.anni_scolastici(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(docente_id, classe_id, materia_id)
);

CREATE INDEX IF NOT EXISTS idx_cattedre_docente ON public.assegnazioni_cattedre(docente_id);
CREATE INDEX IF NOT EXISTS idx_cattedre_classe ON public.assegnazioni_cattedre(classe_id);

-- ==========================================
-- 7. COMPETENZE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.competenze (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codice TEXT UNIQUE,
    descrizione TEXT NOT NULL,
    asse TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 8. CURRICOLO (piano formativo)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.curricolo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    materia_id UUID NOT NULL REFERENCES public.materie(id) ON DELETE CASCADE,
    competenza_id UUID NOT NULL REFERENCES public.competenze(id) ON DELETE CASCADE,
    classe_id UUID REFERENCES public.classi(id) ON DELETE CASCADE,
    ore_totali INTEGER DEFAULT 0,
    ore_orientamento INTEGER DEFAULT 0,
    ore_presenza INTEGER DEFAULT 0,
    ore_distanza INTEGER DEFAULT 0,
    modalita_verifica TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(materia_id, competenza_id, classe_id)
);

-- ==========================================
-- 9. STUDENTI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.studenti (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    codice_fiscale TEXT UNIQUE,
    matricola TEXT UNIQUE,
    data_nascita DATE,
    luogo_nascita TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 10. ISCRIZIONI (studente-classe)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.studenti_classi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studente_id UUID NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
    anno_scolastico_id UUID REFERENCES public.anni_scolastici(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(studente_id, classe_id)
);

CREATE INDEX IF NOT EXISTS idx_studenti_classi_classe ON public.studenti_classi(classe_id);
CREATE INDEX IF NOT EXISTS idx_studenti_classi_studente ON public.studenti_classi(studente_id);

-- ==========================================
-- 11. PFI (Patto Formativo Individuale)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pfi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    studente_id UUID NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
    competenza_id UUID NOT NULL REFERENCES public.competenze(id) ON DELETE CASCADE,
    ore_previste INTEGER DEFAULT 0,
    crediti_riconosciuti INTEGER DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(studente_id, competenza_id)
);

CREATE INDEX IF NOT EXISTS idx_pfi_studente ON public.pfi(studente_id);

-- ==========================================
-- 12. PROVE DI REALTÀ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.prove_di_realta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assegnazione_id UUID NOT NULL REFERENCES public.assegnazioni_cattedre(id) ON DELETE CASCADE,
    competenza_id UUID NOT NULL REFERENCES public.competenze(id) ON DELETE CASCADE,
    descrizione TEXT NOT NULL,
    data_prova DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 13. VALUTAZIONI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.valutazioni (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prova_id UUID NOT NULL REFERENCES public.prove_di_realta(id) ON DELETE CASCADE,
    studente_id UUID NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
    voto_numerico NUMERIC(4,2),
    livello TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(prova_id, studente_id)
);

CREATE INDEX IF NOT EXISTS idx_valutazioni_prova ON public.valutazioni(prova_id);
CREATE INDEX IF NOT EXISTS idx_valutazioni_studente ON public.valutazioni(studente_id);

-- ==========================================
-- DATI INIZIALI — Anno scolastico corrente
-- ==========================================
INSERT INTO public.anni_scolastici (anno, attivo)
VALUES ('2024/2025', true)
ON CONFLICT (anno) DO NOTHING;

-- ==========================================
-- NOTA: Per la tabella "curriculo" (vecchio nome con typo),
-- è un alias della tabella curricolo.
-- Se il codice usa 'curriculo', eseguire:
-- CREATE VIEW public.curriculo AS SELECT * FROM public.curricolo;
-- ==========================================
CREATE OR REPLACE VIEW public.curriculo AS SELECT * FROM public.curricolo;
