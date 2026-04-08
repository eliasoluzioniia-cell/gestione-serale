-- Script per sincronizzare le assegnazioni cattedre partendo dall'orario caricato
-- Questo script estrae le coppie univoche (Docente, Materia, Classe) dall'orario
-- e le inserisce nella tabella assegnazioni_cattedre se non sono già presenti.

INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
SELECT DISTINCT docente_id, materia_id, classe_id
FROM public.orario_lezioni
WHERE docente_id IS NOT NULL 
  AND materia_id IS NOT NULL 
  AND classe_id IS NOT NULL
ON CONFLICT (docente_id, materia_id, classe_id) DO NOTHING;

-- Verifica l'inserimento
SELECT 
    d.cognome, 
    d.nome, 
    m.codice as materia, 
    c.anno_corso || c.sezione as classe
FROM public.assegnazioni_cattedre a
JOIN public.docenti d ON a.docente_id = d.id
JOIN public.materie m ON a.materia_id = m.id
JOIN public.classi c ON a.classe_id = c.id
ORDER BY d.cognome, d.nome;
