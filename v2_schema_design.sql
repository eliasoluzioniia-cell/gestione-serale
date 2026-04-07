-- Supabase SQL Schema for School Evening Courses (V2 Architecture)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ANAGRAFICA STRUTTURALE
CREATE TABLE IF NOT EXISTS public.scuole (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.indirizzi (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scuola_id UUID NOT NULL REFERENCES public.scuole(id) ON DELETE CASCADE,
    nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.anni_scolastici (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    anno TEXT NOT NULL UNIQUE, -- es. '2023/2024'
    is_corrente BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.classi (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    indirizzo_id UUID NOT NULL REFERENCES public.indirizzi(id) ON DELETE CASCADE,
    anno_scolastico_id UUID NOT NULL REFERENCES public.anni_scolastici(id) ON DELETE RESTRICT,
    anno_corso TEXT NOT NULL, -- es. '1', '2', '3'
    periodo TEXT, -- es. 'Primo Periodo' o 'Secondo Periodo'
    sezione TEXT NOT NULL -- es. 'A', 'B'
);

-- 2. GESTIONE PERSONALE E AUTH
CREATE TABLE IF NOT EXISTS public.utenti (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID UNIQUE NOT NULL, -- Riferimento a auth.users di Supabase
    ruolo TEXT NOT NULL CHECK (ruolo IN ('Admin', 'Docente', 'Tutor'))
);

CREATE TABLE IF NOT EXISTS public.docenti (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    utente_id UUID REFERENCES public.utenti(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.studenti (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    matricola TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.studenti_classi (
    studente_id UUID NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
    PRIMARY KEY (studente_id, classe_id)
);

-- 3. DIDATTICA
CREATE TABLE IF NOT EXISTS public.materie (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codice TEXT UNIQUE NOT NULL,
    descrizione TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.competenze (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    codice TEXT UNIQUE NOT NULL, -- Identificativo es. 'C01.A'
    descrizione TEXT NOT NULL,
    asse TEXT -- Es. 'Asse Linguistico'
);

CREATE TABLE IF NOT EXISTS public.curricolo (
    materia_id UUID NOT NULL REFERENCES public.materie(id) ON DELETE CASCADE,
    competenza_id UUID NOT NULL REFERENCES public.competenze(id) ON DELETE CASCADE,
    ore_totali INTEGER DEFAULT 0,
    ore_orientamento INTEGER DEFAULT 0,
    ore_presenza INTEGER DEFAULT 0,
    ore_distanza INTEGER DEFAULT 0,
    modalita_verifica TEXT,
    PRIMARY KEY (materia_id, competenza_id)
);

-- 4. ASSEGNAZIONI CATTEDRE
CREATE TABLE IF NOT EXISTS public.assegnazioni_cattedre (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    docente_id UUID NOT NULL REFERENCES public.docenti(id) ON DELETE CASCADE,
    materia_id UUID NOT NULL REFERENCES public.materie(id) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
    UNIQUE (docente_id, materia_id, classe_id)
);

-- 5. PATTO FORMATIVO INDIVIDUALE (PFI)
CREATE TABLE IF NOT EXISTS public.pfi (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studente_id UUID NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
    competenza_id UUID NOT NULL REFERENCES public.competenze(id) ON DELETE CASCADE,
    ore_previste INTEGER DEFAULT 0,
    crediti_riconosciuti BOOLEAN DEFAULT false,
    UNIQUE(studente_id, classe_id, competenza_id)
);

-- 6. VALUTAZIONI / PROVE DI REALTA'
CREATE TABLE IF NOT EXISTS public.prove_di_realta (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assegnazione_id UUID NOT NULL REFERENCES public.assegnazioni_cattedre(id) ON DELETE CASCADE,
    competenza_id UUID NOT NULL REFERENCES public.competenze(id) ON DELETE CASCADE,
    data_prova DATE NOT NULL DEFAULT CURRENT_DATE,
    descrizione TEXT
);

CREATE TABLE IF NOT EXISTS public.valutazioni (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prova_id UUID NOT NULL REFERENCES public.prove_di_realta(id) ON DELETE CASCADE,
    studente_id UUID NOT NULL REFERENCES public.studenti(id) ON DELETE CASCADE,
    voto_numerico DECIMAL(4,2), -- Es: 7.5
    livello TEXT CHECK (livello IN ('A', 'B', 'C', 'N/A')),
    UNIQUE(prova_id, studente_id)
);

-- 7. ENABLE RLS & CREATE BASIC POLICIES
-- In this setup, we enable RLS on all primary tables.
ALTER TABLE public.scuole ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indirizzi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anni_scolastici ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studenti_classi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curricolo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assegnazioni_cattedre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pfi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prove_di_realta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valutazioni ENABLE ROW LEVEL SECURITY;

-- Note: The specific policies will depend on the final auth setup, but typically
-- you link the Supabase auth.uid() to public.utenti.auth_id, and then
-- allow SELECT/INSERT/UPDATE on assignments, PFI, and Valutazioni based on roles.
