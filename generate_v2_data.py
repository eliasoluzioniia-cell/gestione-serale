import csv
import os
import pandas as pd
import json

base_path = r"C:\Users\fabio\Documents\Progetto corso serale\frontend\File orario corso serale"

def parse(name):
    path = os.path.join(base_path, name)
    try:
        with open(path, 'r', encoding='windows-1252', errors='replace') as f:
            reader = csv.reader(f, delimiter='\t')
            return list(reader)
    except Exception as e:
        return []

classi = parse('classi.txt')[1:]
materie = parse('materie.txt')[1:]
docenti = parse('docenti.txt')[1:]
lezioni = parse('lezioni.txt')[1:]
classilezioni = parse('classilezioni.txt')[1:]
docentilezioni = parse('docentilezioni.txt')[1:]

lezione_materia = { row[0]: row[5] for row in lezioni if len(row) > 5 }

lezione_classi = {}
for row in classilezioni:
    if len(row) > 2:
        lezione_classi.setdefault(row[0], set()).add(row[2])

lezione_docenti = {}
for row in docentilezioni:
    if len(row) > 2:
        lezione_docenti.setdefault(row[0], set()).add(row[2])

assignments = set()
for l_id in lezione_materia:
    m_id = lezione_materia[l_id]
    cs = lezione_classi.get(l_id, [])
    ds = lezione_docenti.get(l_id, [])
    for c_id in cs:
        for d_id in ds:
            assignments.add((d_id, m_id, c_id))

# --- CURRICOLO ODS PARSING ---
ods_path = os.path.join(base_path, 'curriculo.ods')
df_curriculo = pd.read_excel(ods_path, engine='odf')

# Forward fill the 'Assi' column because it's merged in the spreadsheet
df_curriculo['Assi'] = df_curriculo['Assi'].ffill()

# Subject mapping (ODS Code -> materie.txt full name)
# This maps the simplified codes to the full descriptions in materie.txt
SUBJECT_MAP = {
    'ITA': 'A012 Italiano',
    'STO': 'A012 Storia',
    'ING': 'AB24 Inglese',
    'FRA': 'A24 Francese',
    'MUS': 'A029 Musica',
    'MAT': 'A026 Matematica',
    'DIR': 'A046 Diritto ed economia',
    'ART': 'A017 Elementi storia arte espressioni grafiche',
    'SC.UM.': 'A018 Scienze Umane',
    'PSI': 'A018 Psicologia generale',
    'TEC': 'A045 Tecnica Amministrativa  Economia',
    'IGI': 'A015 Igiene e cultura sanitaria',
    'FIS': 'A020 Fisica',
    'CHI': 'A034 Chimica',
    'MET.OP.': 'B023 Metologie Operative'
}

# ----------------------------

sql_v2 = """-- Ingestion script per V2 (Generato automaticamente)
DO $$
DECLARE
    v_scuola_id UUID := uuid_generate_v4();
    v_indirizzo_id UUID := uuid_generate_v4();
    v_anno_id UUID := uuid_generate_v4();
    
    id_stud1 UUID; id_stud2 UUID; id_stud3 UUID;
    c_rec RECORD;
    competenza_rec RECORD;
BEGIN
    -- Svuotamento tabelle (CASCADE gestisce le dipendenze)
    TRUNCATE TABLE public.prove_di_realta CASCADE;
    TRUNCATE TABLE public.valutazioni CASCADE;
    TRUNCATE TABLE public.pfi CASCADE;
    TRUNCATE TABLE public.curricolo CASCADE;
    TRUNCATE TABLE public.competenze CASCADE;
    TRUNCATE TABLE public.assegnazioni_cattedre CASCADE;
    TRUNCATE TABLE public.studenti_classi CASCADE;
    TRUNCATE TABLE public.studenti CASCADE;
    TRUNCATE TABLE public.classi CASCADE;
    TRUNCATE TABLE public.anni_scolastici CASCADE;
    TRUNCATE TABLE public.indirizzi CASCADE;
    TRUNCATE TABLE public.scuole CASCADE;
    TRUNCATE TABLE public.materie CASCADE;
    TRUNCATE TABLE public.docenti CASCADE;

    INSERT INTO public.scuole (id, nome) VALUES (v_scuola_id, 'CPIA / ITIS Serale - Manzoni');
    INSERT INTO public.indirizzi (id, scuola_id, nome) VALUES (v_indirizzo_id, v_scuola_id, 'Informatica 2° Livello');
    INSERT INTO public.anni_scolastici (id, anno, is_corrente) VALUES (v_anno_id, '2023/2024', true);
    
    -- Temp tables per mapping
    CREATE TEMP TABLE tmp_materie ( legacy_id TEXT, uuid UUID, nome_completo TEXT );
    CREATE TEMP TABLE tmp_classi ( legacy_id TEXT, uuid UUID );
    CREATE TEMP TABLE tmp_docenti ( legacy_id TEXT, uuid UUID );
"""

# Classi
for c in classi:
    if len(c) >= 3:
        num = "1"
        if "II" in c[1]: num = "2"
        elif "III" in c[1]: num = "3"
        elif "I " in c[1]: num = "1"
        sez = 'A'
        sql_v2 += f"""
    DECLARE v_cls_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.classi (id, indirizzo_id, anno_scolastico_id, anno_corso, periodo, sezione) 
        VALUES (v_cls_uuid, v_indirizzo_id, v_anno_id, '{num}', '{c[1].replace("'", "''")}', '{sez}');
        INSERT INTO tmp_classi VALUES ('{c[0]}', v_cls_uuid);
    END;
"""

# Materie Base
for m in materie:
    if len(m) >= 3:
        sql_v2 += f"""
    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, '{m[2].replace("'", "''")}', '{m[1].replace("'", "''")}');
        INSERT INTO tmp_materie VALUES ('{m[0]}', v_mat_uuid, '{m[1].replace("'", "''")}');
    END;
"""

sql_v2 += "\n    -- Inserimento Competenze e Curricolo (da ODS)\n"
# Competenze (Unique Identificativo)
unique_comps = df_curriculo.drop_duplicates(subset=['Identificativo'])
for _, row in unique_comps.iterrows():
    ident = str(row['Identificativo']).replace("'", "''")
    desc = str(row['COMPETENZE']).replace("'", "''")
    asse = str(row['Assi']).replace("'", "''") if pd.notna(row['Assi']) else ""
    sql_v2 += f"""
    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), '{ident}', '{desc}', '{asse}') ON CONFLICT (codice) DO NOTHING;
"""

# Curricolo (Mapping Materia -> Competenza with details)
for _, row in df_curriculo.iterrows():
    short_code = row['Disciplina (3)']
    full_name = SUBJECT_MAP.get(short_code)
    if full_name:
        ident = str(row['Identificativo']).replace("'", "''")
        tot = int(row['TOT']) if pd.notna(row['TOT']) else 0
        orient = int(row['Orientamento']) if pd.notna(row['Orientamento']) else 0
        pres = int(row['In presenza']) if pd.notna(row['In presenza']) else 0
        dist = int(row['A distanza']) if pd.notna(row['A distanza']) else 0
        mod = str(row['Modalità di verifica (1)']).replace("'", "''") if pd.notna(row['Modalità di verifica (1)']) else ""
        
        sql_v2 += f"""
    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, {tot}, {orient}, {pres}, {dist}, '{mod}'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = '{full_name.replace("'", "''")}' AND c.codice = '{ident}'
    ON CONFLICT DO NOTHING;
"""

# Docenti
for d in docenti:
    if len(d) >= 2:
        ext_id = d[0]
        name_parts = d[1].replace("'", "''").split(" ")
        cognome = name_parts[0]
        nome = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        sql_v2 += f"""
    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, '{nome}', '{cognome}');
        INSERT INTO tmp_docenti VALUES ('{ext_id}', v_doc_uuid);
    END;
"""

sql_v2 += "\n    -- Inserimento Assegnazioni Cattedre\n"
for d_id, m_id, c_id in assignments:
    sql_v2 += f"""
    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = '{d_id}' AND m.legacy_id = '{m_id}' AND c.legacy_id = '{c_id}'
    ON CONFLICT DO NOTHING;
"""

sql_v2 += """
    -- Generazione Dati Studenti e PFI Fittizi per ogni classe
    FOR c_rec IN SELECT uuid FROM tmp_classi LOOP
        id_stud1 := uuid_generate_v4(); id_stud2 := uuid_generate_v4(); id_stud3 := uuid_generate_v4();
        
        INSERT INTO public.studenti (id, nome, cognome, matricola) VALUES 
        (id_stud1, 'Mario', 'Rossi', 'MAT-' || left(id_stud1::text, 5)),
        (id_stud2, 'Luigi', 'Verdi', 'MAT-' || left(id_stud2::text, 5)),
        (id_stud3, 'Giulia', 'Bianchi', 'MAT-' || left(id_stud3::text, 5));
        
        INSERT INTO public.studenti_classi (studente_id, classe_id) VALUES 
        (id_stud1, c_rec.uuid), (id_stud2, c_rec.uuid), (id_stud3, c_rec.uuid);
        
        -- Per ogni studente, crea un PFI per ogni competenza di ogni materia della classe
        FOR competenza_rec IN 
            SELECT DISTINCT cur.competenza_id, cur.ore_totali FROM public.curricolo cur 
            JOIN public.assegnazioni_cattedre ac ON ac.materia_id = cur.materia_id
            WHERE ac.classe_id = c_rec.uuid
        LOOP
            INSERT INTO public.pfi (studente_id, classe_id, competenza_id, ore_previste, crediti_riconosciuti)
            VALUES 
            (id_stud1, c_rec.uuid, competenza_rec.competenza_id, competenza_rec.ore_totali, false),
            (id_stud2, c_rec.uuid, competenza_rec.competenza_id, competenza_rec.ore_totali / 2, true),
            (id_stud3, c_rec.uuid, competenza_rec.competenza_id, competenza_rec.ore_totali, false)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
    END LOOP;

    DROP TABLE tmp_materie;
    DROP TABLE tmp_classi;
    DROP TABLE tmp_docenti;
END $$;
"""

with open('v2_insert_data.sql', 'w', encoding='utf-8') as f:
    f.write(sql_v2)

print("File v2_insert_data.sql generato con successo includendo il curricolo da ODS.")
