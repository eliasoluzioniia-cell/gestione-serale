import os

def parse_tab_file(path, force_header=None):
    if not os.path.exists(path):
        return []
    # Try utf-8 first, fallback to latin-1
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lines = [l for l in f.readlines() if l.strip()]
    except UnicodeDecodeError:
        with open(path, 'r', encoding='latin-1') as f:
            lines = [l for l in f.readlines() if l.strip()]
    if not lines:
        return []
    header = force_header if force_header else lines[0].strip().split('\t')
    start_idx = 0 if force_header else 1
    data = []
    for line in lines[start_idx:]:
        parts = line.strip().split('\t')
        row = dict(zip(header, parts))
        # Handle extra columns like in ore.txt
        if len(parts) > len(header) and 'orainizio' in header:
            row['orafine'] = parts[len(header)]
        data.append(row)
    return data

base_path = r"c:\Users\fabio\Documents\Progetto corso serale\frontend\File orario corso serale"

# Load mapping files with forced headers where needed
materie_map = {m['idmateria']: m['nomemateria'] for m in parse_tab_file(os.path.join(base_path, "materie.txt"))}
classi_map = {c['idclasse']: c['nomeclasse'] for c in parse_tab_file(os.path.join(base_path, "classi.txt"))}
# Docenti file seems to have tab issues or encoding
docenti_data = parse_tab_file(os.path.join(base_path, "docenti.txt"), force_header=['iddocente', 'nomedocente'])
docenti_map = {d['iddocente']: d['nomedocente'].strip() for d in docenti_data if d.get('iddocente')}

ore_map = {}
for o in parse_tab_file(os.path.join(base_path, "ore.txt")):
    key = (o['idgiorno'], o['idora'])
    ore_map[key] = (o['orainizio'], o.get('orafine', ''))

lezioni = parse_tab_file(os.path.join(base_path, "lezioni.txt"))
classilezioni = parse_tab_file(os.path.join(base_path, "classilezioni.txt"))
docentilezioni = parse_tab_file(os.path.join(base_path, "docentilezioni.txt"))

# Build indexed maps for fast lookup
class_lesson_map = {}
for cl in classilezioni:
    lid = cl['idlezione']
    if lid not in class_lesson_map: class_lesson_map[lid] = []
    class_lesson_map[lid].append(cl['idclasse'])

docent_lesson_map = {}
for dl in docentilezioni:
    docent_lesson_map[dl['idlezione']] = dl['iddocente']

# Generate SQL
sql_lines = [
    """-- Creazione Tabella (se non esiste)
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
""",
    "DO $$",
    "DECLARE v_record RECORD;",
    "BEGIN"
]

for l in lezioni:
    id_lezione = l['idlezione']
    id_materia = l['idmateria']
    id_giorno = l['idgiorno']
    id_ora = l['idora']
    
    materia_nome = materie_map.get(id_materia, "").replace("'", "''")
    giorno = int(id_giorno)
    ora_index = int(id_ora)
    times = ore_map.get((id_giorno, id_ora), ("", ""))
    ora_inizio = times[0].replace(".", ":")
    ora_fine = times[1].replace(".", ":")
    
    classes = class_lesson_map.get(id_lezione, [])
    iddocente = docent_lesson_map.get(id_lezione)
    docente_nome = docenti_map.get(iddocente, "").replace("'", "''")
    
    for id_classe in classes:
        classe_nome = classi_map.get(id_classe, "").replace("'", "''")
        if not classe_nome: continue
        
        sql = f"""
    -- Lezione {id_lezione}: {materia_nome} in {classe_nome} ({docente_nome})
    INSERT INTO public.orario_lezioni (classe_id, materia_id, docente_id, giorno, ora_index, ora_inizio, ora_fine)
    SELECT 
        (SELECT id FROM public.classi WHERE periodo = '{classe_nome}' LIMIT 1),
        (SELECT id FROM public.materie WHERE descrizione = '{materia_nome}' OR codice = '{materia_nome.split()[-1]}' OR codice = '{materia_nome}' LIMIT 1),
        (SELECT id FROM public.docenti WHERE (cognome || ' ' || nome) ILIKE '%{docente_nome}%' OR (nome || ' ' || cognome) ILIKE '%{docente_nome}%' LIMIT 1),
        {giorno}, {ora_index}, '{ora_inizio}', '{ora_fine}'
    ON CONFLICT (classe_id, giorno, ora_index) DO NOTHING;"""
        sql_lines.append(sql)

sql_lines.append("END $$;")

with open(r"c:\Users\fabio\Documents\Progetto corso serale\frontend\import_orario.sql", 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print("SQL Script generated at import_orario.sql")
