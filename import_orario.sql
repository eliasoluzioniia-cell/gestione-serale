-- Creazione Tabella (se non esiste)
CREATE TABLE IF NOT EXISTS public.orario_lezioni (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classe_id UUID NOT NULL REFERENCES public.classi(id) ON DELETE CASCADE,
    materia_id UUID NOT NULL REFERENCES public.materie(id) ON DELETE CASCADE,
    docente_id UUID REFERENCES public.docenti(id) ON DELETE SET NULL,
    giorno INTEGER NOT NULL CHECK (giorno >= 0 AND giorno <= 4),
    ora_index INTEGER NOT NULL CHECK (ora_index >= 0 AND ora_index <= 5),
    ora_inizio TEXT NOT NULL,
    ora_fine TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(classe_id, giorno, ora_index)
);

-- Configurazione Sicurezza
ALTER TABLE public.orario_lezioni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tutti possono vedere l'orario" ON public.orario_lezioni;
CREATE POLICY "Tutti possono vedere l'orario" ON public.orario_lezioni FOR SELECT USING (true);
DROP POLICY IF EXISTS "Solo Amministratori e Tutor possono modificare l'orario" ON public.orario_lezioni;
CREATE POLICY "Solo Amministratori e Tutor possono modificare l'orario" 
    ON public.orario_lezioni FOR ALL 
    USING ( (auth.jwt() -> 'user_metadata' ->> 'role')::text IN ('amministratore', 'tutor') );

-- Inserimento Dati
TRUNCATE TABLE public.orario_lezioni CASCADE;

DO $$
DECLARE v_record RECORD;
BEGIN

    -- Lezione L0000000: A026 Matematica in I periodo (Forte Sabrina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A026 Matematica' OR codice = 'Matematica' OR codice = 'A026 Matematica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Forte Sabrina%' OR (nome || ' ' || cognome) ILIKE '%Forte Sabrina%' LIMIT 1),
        0, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000001: A012 Storia in II periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Storia' OR codice = 'Storia' OR codice = 'A012 Storia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        0, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000002: A026 Matematica in III periodo (Forte Sabrina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A026 Matematica' OR codice = 'Matematica' OR codice = 'A026 Matematica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Forte Sabrina%' OR (nome || ' ' || cognome) ILIKE '%Forte Sabrina%' LIMIT 1),
        0, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000003: A050 Scienze della terra biologia chimica in I periodo (Luca Randazzo)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A050 Scienze della terra biologia chimica' OR codice = 'chimica' OR codice = 'A050 Scienze della terra biologia chimica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Luca Randazzo%' OR (nome || ' ' || cognome) ILIKE '%Luca Randazzo%' LIMIT 1),
        0, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000004: A026 Matematica in II periodo (Forte Sabrina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A026 Matematica' OR codice = 'Matematica' OR codice = 'A026 Matematica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Forte Sabrina%' OR (nome || ' ' || cognome) ILIKE '%Forte Sabrina%' LIMIT 1),
        0, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000005: A24 Francese in I periodo (Caprì Maria)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A24 Francese' OR codice = 'Francese' OR codice = 'A24 Francese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Caprì Maria%' OR (nome || ' ' || cognome) ILIKE '%Caprì Maria%' LIMIT 1),
        0, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000006: A012 Italiano in III periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        0, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000007: A24 Francese in III periodo (Caprì Maria)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A24 Francese' OR codice = 'Francese' OR codice = 'A24 Francese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Caprì Maria%' OR (nome || ' ' || cognome) ILIKE '%Caprì Maria%' LIMIT 1),
        0, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000008: A012 Italiano in I periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        0, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000009: A24 Francese in II periodo (Caprì Maria)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A24 Francese' OR codice = 'Francese' OR codice = 'A24 Francese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Caprì Maria%' OR (nome || ' ' || cognome) ILIKE '%Caprì Maria%' LIMIT 1),
        0, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000010: A015 Igiene e cultura sanitaria in III periodo (Casalotto Daniela)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A015 Igiene e cultura sanitaria' OR codice = 'sanitaria' OR codice = 'A015 Igiene e cultura sanitaria' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Casalotto Daniela%' OR (nome || ' ' || cognome) ILIKE '%Casalotto Daniela%' LIMIT 1),
        0, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000011: A034 Chimica in I periodo (Calcagno Giuseppe Gaetano)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A034 Chimica' OR codice = 'Chimica' OR codice = 'A034 Chimica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Giuseppe Gaetano%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Giuseppe Gaetano%' LIMIT 1),
        0, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000012: A015 Igiene e cultura sanitaria in II periodo (Casalotto Daniela)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A015 Igiene e cultura sanitaria' OR codice = 'sanitaria' OR codice = 'A015 Igiene e cultura sanitaria' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Casalotto Daniela%' OR (nome || ' ' || cognome) ILIKE '%Casalotto Daniela%' LIMIT 1),
        0, 5, '19:45', '20:35'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000013: A034 Chimica in I periodo (Calcagno Giuseppe Gaetano)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A034 Chimica' OR codice = 'Chimica' OR codice = 'A034 Chimica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Giuseppe Gaetano%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Giuseppe Gaetano%' LIMIT 1),
        0, 5, '19:45', '20:35'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000014: A046 Diritto e legislazione in III periodo (Calcagno Francesca)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A046 Diritto e legislazione' OR codice = 'legislazione' OR codice = 'A046 Diritto e legislazione' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Francesca%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Francesca%' LIMIT 1),
        1, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000015: A045 Tecnica Amministrativa  Economia in II periodo (Cancaro Fabio)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A045 Tecnica Amministrativa  Economia' OR codice = 'Economia' OR codice = 'A045 Tecnica Amministrativa  Economia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cancaro Fabio%' OR (nome || ' ' || cognome) ILIKE '%Cancaro Fabio%' LIMIT 1),
        1, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000016: A012 Storia in II periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Storia' OR codice = 'Storia' OR codice = 'A012 Storia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        1, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000017: A046 Diritto e legislazione in I periodo (Calcagno Francesca)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A046 Diritto e legislazione' OR codice = 'legislazione' OR codice = 'A046 Diritto e legislazione' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Francesca%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Francesca%' LIMIT 1),
        1, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000018: A045 Tecnica Amministrativa  Economia in III periodo (Cancaro Fabio)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A045 Tecnica Amministrativa  Economia' OR codice = 'Economia' OR codice = 'A045 Tecnica Amministrativa  Economia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cancaro Fabio%' OR (nome || ' ' || cognome) ILIKE '%Cancaro Fabio%' LIMIT 1),
        1, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000019: AB24 Inglese in III periodo (Mancuso Luana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'AB24 Inglese' OR codice = 'Inglese' OR codice = 'AB24 Inglese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Mancuso Luana%' OR (nome || ' ' || cognome) ILIKE '%Mancuso Luana%' LIMIT 1),
        1, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000020: A012 Italiano in I periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        1, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000021: A046 Diritto e legislazione in II periodo (Calcagno Francesca)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A046 Diritto e legislazione' OR codice = 'legislazione' OR codice = 'A046 Diritto e legislazione' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Francesca%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Francesca%' LIMIT 1),
        1, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000022: A012 Storia in I periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Storia' OR codice = 'Storia' OR codice = 'A012 Storia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        1, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000023: A026 Matematica in III periodo (Forte Sabrina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A026 Matematica' OR codice = 'Matematica' OR codice = 'A026 Matematica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Forte Sabrina%' OR (nome || ' ' || cognome) ILIKE '%Forte Sabrina%' LIMIT 1),
        1, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000024: AB24 Inglese in II periodo (Mancuso Luana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'AB24 Inglese' OR codice = 'Inglese' OR codice = 'AB24 Inglese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Mancuso Luana%' OR (nome || ' ' || cognome) ILIKE '%Mancuso Luana%' LIMIT 1),
        1, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000025: A012 Italiano in II periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        1, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000026: AB24 Inglese in I periodo (Mancuso Luana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'AB24 Inglese' OR codice = 'Inglese' OR codice = 'AB24 Inglese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Mancuso Luana%' OR (nome || ' ' || cognome) ILIKE '%Mancuso Luana%' LIMIT 1),
        1, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000027: AB24 Inglese in I periodo (Mancuso Luana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'AB24 Inglese' OR codice = 'Inglese' OR codice = 'AB24 Inglese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Mancuso Luana%' OR (nome || ' ' || cognome) ILIKE '%Mancuso Luana%' LIMIT 1),
        1, 5, '19:45', '20:35'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000028: A018 Psicologia generale in II periodo (Manno Giuseppina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Psicologia generale' OR codice = 'generale' OR codice = 'A018 Psicologia generale' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Manno Giuseppina%' OR (nome || ' ' || cognome) ILIKE '%Manno Giuseppina%' LIMIT 1),
        2, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000029: A017 Elementi storia arte espressioni grafiche in I periodo (La Porta Rosa Maria)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A017 Elementi storia arte espressioni grafiche' OR codice = 'grafiche' OR codice = 'A017 Elementi storia arte espressioni grafiche' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%La Porta Rosa Maria%' OR (nome || ' ' || cognome) ILIKE '%La Porta Rosa Maria%' LIMIT 1),
        2, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000030: A018 Psicologia generale in III periodo (Cristina Fabiana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Psicologia generale' OR codice = 'generale' OR codice = 'A018 Psicologia generale' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cristina Fabiana%' OR (nome || ' ' || cognome) ILIKE '%Cristina Fabiana%' LIMIT 1),
        2, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000031: A018 Psicologia generale in III periodo (Cristina Fabiana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Psicologia generale' OR codice = 'generale' OR codice = 'A018 Psicologia generale' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cristina Fabiana%' OR (nome || ' ' || cognome) ILIKE '%Cristina Fabiana%' LIMIT 1),
        2, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000032: A017 Elementi storia arte espressioni grafiche in I periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A017 Elementi storia arte espressioni grafiche' OR codice = 'grafiche' OR codice = 'A017 Elementi storia arte espressioni grafiche' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        2, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000033: A012 Italiano in II periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        2, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000034: A018 Scienze Umane in I periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Scienze Umane' OR codice = 'Umane' OR codice = 'A018 Scienze Umane' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        2, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000035: A046 Diritto e legislazione in III periodo (Calcagno Francesca)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A046 Diritto e legislazione' OR codice = 'legislazione' OR codice = 'A046 Diritto e legislazione' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Francesca%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Francesca%' LIMIT 1),
        2, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000036: A046 Diritto e legislazione in II periodo (Calcagno Francesca)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A046 Diritto e legislazione' OR codice = 'legislazione' OR codice = 'A046 Diritto e legislazione' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Francesca%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Francesca%' LIMIT 1),
        2, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000037: A029 Musica in I periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A029 Musica' OR codice = 'Musica' OR codice = 'A029 Musica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        2, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000038: A012 Storia in III periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Storia' OR codice = 'Storia' OR codice = 'A012 Storia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        2, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000039: A012 Italiano in III periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        2, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000040: A029 Musica in I periodo (Bongiovanni Franca)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A029 Musica' OR codice = 'Musica' OR codice = 'A029 Musica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Bongiovanni Franca%' OR (nome || ' ' || cognome) ILIKE '%Bongiovanni Franca%' LIMIT 1),
        2, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000041: B023 Metologie Operative in II periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'B023 Metologie Operative' OR codice = 'Operative' OR codice = 'B023 Metologie Operative' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        2, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000042: A046 Diritto e legislazione in I periodo (Calcagno Francesca)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A046 Diritto e legislazione' OR codice = 'legislazione' OR codice = 'A046 Diritto e legislazione' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Calcagno Francesca%' OR (nome || ' ' || cognome) ILIKE '%Calcagno Francesca%' LIMIT 1),
        2, 5, '19:45', '20:35'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000043: A050 Scienze della terra biologia chimica in I periodo (Luca Randazzo)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A050 Scienze della terra biologia chimica' OR codice = 'chimica' OR codice = 'A050 Scienze della terra biologia chimica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Luca Randazzo%' OR (nome || ' ' || cognome) ILIKE '%Luca Randazzo%' LIMIT 1),
        3, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000044: A018 Psicologia generale in III periodo (Cristina Fabiana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Psicologia generale' OR codice = 'generale' OR codice = 'A018 Psicologia generale' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cristina Fabiana%' OR (nome || ' ' || cognome) ILIKE '%Cristina Fabiana%' LIMIT 1),
        3, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000045: A026 Matematica in II periodo (Forte Sabrina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A026 Matematica' OR codice = 'Matematica' OR codice = 'A026 Matematica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Forte Sabrina%' OR (nome || ' ' || cognome) ILIKE '%Forte Sabrina%' LIMIT 1),
        3, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000046: A018 Psicologia generale in III periodo (Cristina Fabiana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Psicologia generale' OR codice = 'generale' OR codice = 'A018 Psicologia generale' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cristina Fabiana%' OR (nome || ' ' || cognome) ILIKE '%Cristina Fabiana%' LIMIT 1),
        3, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000047: A026 Matematica in I periodo (Forte Sabrina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A026 Matematica' OR codice = 'Matematica' OR codice = 'A026 Matematica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Forte Sabrina%' OR (nome || ' ' || cognome) ILIKE '%Forte Sabrina%' LIMIT 1),
        3, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000048: A015 Igiene e cultura sanitaria in II periodo (Casalotto Daniela)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A015 Igiene e cultura sanitaria' OR codice = 'sanitaria' OR codice = 'A015 Igiene e cultura sanitaria' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Casalotto Daniela%' OR (nome || ' ' || cognome) ILIKE '%Casalotto Daniela%' LIMIT 1),
        3, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000049: A24 Francese in III periodo (Caprì Maria)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A24 Francese' OR codice = 'Francese' OR codice = 'A24 Francese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Caprì Maria%' OR (nome || ' ' || cognome) ILIKE '%Caprì Maria%' LIMIT 1),
        3, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000050: A24 Francese in I periodo (Caprì Maria)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A24 Francese' OR codice = 'Francese' OR codice = 'A24 Francese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Caprì Maria%' OR (nome || ' ' || cognome) ILIKE '%Caprì Maria%' LIMIT 1),
        3, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000051: A015 Igiene e cultura sanitaria in III periodo (Casalotto Daniela)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A015 Igiene e cultura sanitaria' OR codice = 'sanitaria' OR codice = 'A015 Igiene e cultura sanitaria' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Casalotto Daniela%' OR (nome || ' ' || cognome) ILIKE '%Casalotto Daniela%' LIMIT 1),
        3, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000052: A012 Italiano in II periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        3, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000053: A24 Francese in II periodo (Caprì Maria)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A24 Francese' OR codice = 'Francese' OR codice = 'A24 Francese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Caprì Maria%' OR (nome || ' ' || cognome) ILIKE '%Caprì Maria%' LIMIT 1),
        3, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000054: A012 Italiano in I periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        3, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000055: A012 Storia in I periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Storia' OR codice = 'Storia' OR codice = 'A012 Storia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        3, 5, '19:45', '20:35'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000056: A012 Storia in III periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Storia' OR codice = 'Storia' OR codice = 'A012 Storia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        4, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000057: A018 Scienze Umane in I periodo (Manno Giuseppina)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Scienze Umane' OR codice = 'Umane' OR codice = 'A018 Scienze Umane' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Manno Giuseppina%' OR (nome || ' ' || cognome) ILIKE '%Manno Giuseppina%' LIMIT 1),
        4, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000058: B023 Metologie Operative in II periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'B023 Metologie Operative' OR codice = 'Operative' OR codice = 'B023 Metologie Operative' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        4, 0, '15:25', '16:15'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000059: A012 Italiano in III periodo (Zanghì Giuseppe)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A012 Italiano' OR codice = 'Italiano' OR codice = 'A012 Italiano' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Zanghì Giuseppe%' OR (nome || ' ' || cognome) ILIKE '%Zanghì Giuseppe%' LIMIT 1),
        4, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000060: B023 Metologie Operative in II periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'B023 Metologie Operative' OR codice = 'Operative' OR codice = 'B023 Metologie Operative' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        4, 1, '16:15', '17:05'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000061: A045 Tecnica Amministrativa  Economia in III periodo (Cancaro Fabio)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A045 Tecnica Amministrativa  Economia' OR codice = 'Economia' OR codice = 'A045 Tecnica Amministrativa  Economia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cancaro Fabio%' OR (nome || ' ' || cognome) ILIKE '%Cancaro Fabio%' LIMIT 1),
        4, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000062: A050 Scienze della terra biologia chimica in I periodo (Luca Randazzo)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A050 Scienze della terra biologia chimica' OR codice = 'chimica' OR codice = 'A050 Scienze della terra biologia chimica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Luca Randazzo%' OR (nome || ' ' || cognome) ILIKE '%Luca Randazzo%' LIMIT 1),
        4, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000063: A018 Psicologia generale in II periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A018 Psicologia generale' OR codice = 'generale' OR codice = 'A018 Psicologia generale' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        4, 2, '17:05', '17:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000064: A045 Tecnica Amministrativa  Economia in II periodo (Cancaro Fabio)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A045 Tecnica Amministrativa  Economia' OR codice = 'Economia' OR codice = 'A045 Tecnica Amministrativa  Economia' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Cancaro Fabio%' OR (nome || ' ' || cognome) ILIKE '%Cancaro Fabio%' LIMIT 1),
        4, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000065: B023 Metologie Operative in I periodo (D''Auria Santina Elisa)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'B023 Metologie Operative' OR codice = 'Operative' OR codice = 'B023 Metologie Operative' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%D''Auria Santina Elisa%' OR (nome || ' ' || cognome) ILIKE '%D''Auria Santina Elisa%' LIMIT 1),
        4, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000066: AB24 Inglese in III periodo (Mancuso Luana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'III periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'AB24 Inglese' OR codice = 'Inglese' OR codice = 'AB24 Inglese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Mancuso Luana%' OR (nome || ' ' || cognome) ILIKE '%Mancuso Luana%' LIMIT 1),
        4, 3, '18:05', '18:55'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000067: A020 Fisica in I periodo (Giunta Mario)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A020 Fisica' OR codice = 'Fisica' OR codice = 'A020 Fisica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Giunta Mario%' OR (nome || ' ' || cognome) ILIKE '%Giunta Mario%' LIMIT 1),
        4, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000068: AB24 Inglese in II periodo (Mancuso Luana)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'II periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'AB24 Inglese' OR codice = 'Inglese' OR codice = 'AB24 Inglese' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Mancuso Luana%' OR (nome || ' ' || cognome) ILIKE '%Mancuso Luana%' LIMIT 1),
        4, 4, '18:55', '19:45'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;

    -- Lezione L0000069: A020 Fisica in I periodo (Giunta Mario)
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = 'I periodo' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = 'A020 Fisica' OR codice = 'Fisica' OR codice = 'A020 Fisica' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%Giunta Mario%' OR (nome || ' ' || cognome) ILIKE '%Giunta Mario%' LIMIT 1),
        4, 5, '19:45', '20:35'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;
END $$;