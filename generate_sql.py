import csv
import os

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
        idl = row[0]
        idclasse = row[2]
        lezione_classi.setdefault(idl, set()).add(idclasse)

lezione_docenti = {}
for row in docentilezioni:
    if len(row) > 2:
        idl = row[0]
        iddoc = row[2]
        lezione_docenti.setdefault(idl, set()).add(iddoc)

assignments = set()
for l_id in lezione_materia:
    m_id = lezione_materia[l_id]
    cs = lezione_classi.get(l_id, [])
    ds = lezione_docenti.get(l_id, [])
    for c_id in cs:
        for d_id in ds:
            assignments.add((d_id, m_id, c_id))

sql = """-- Supabase SQL Schema for School Evening Courses

-- 1. Create Tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.school_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT
);

CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    external_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    UNIQUE(teacher_id, class_id, subject_id)
);

-- Delete old data securely to prepare for mass insert
TRUNCATE TABLE public.teacher_assignments CASCADE;
TRUNCATE TABLE public.school_classes CASCADE;
TRUNCATE TABLE public.subjects CASCADE;
TRUNCATE TABLE public.teachers CASCADE;

-- 2. Insert Classes
"""

for c in classi:
    if len(c) >= 3:
        sql += f"INSERT INTO public.school_classes (id, name, short_name) VALUES ('{c[0]}', '{c[1].replace(chr(39), chr(39)*2)}', '{c[2].replace(chr(39), chr(39)*2)}') ON CONFLICT (id) DO NOTHING;\n"

sql += "\n-- 3. Insert Subjects\n"
for m in materie:
    if len(m) >= 3:
        sql += f"INSERT INTO public.subjects (id, name, short_name) VALUES ('{m[0]}', '{m[1].replace(chr(39), chr(39)*2)}', '{m[2].replace(chr(39), chr(39)*2)}') ON CONFLICT (id) DO NOTHING;\n"

sql += "\n-- 4. Insert Teachers\n"
for d in docenti:
    if len(d) >= 2:
        ext_id = d[0]
        name = d[1].replace(chr(39), chr(39)*2)
        sql += f"INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), '{name}', '{ext_id}') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;\n"

sql += "\n-- 5. Insert Assignments\n"
sql += """
DO $$
DECLARE
  prof_id UUID;
BEGIN
"""

for d_id, m_id, c_id in assignments:
    sql += f"""
    SELECT id INTO prof_id FROM public.teachers WHERE external_id = '{d_id}';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, '{c_id}', '{m_id}') ON CONFLICT DO NOTHING;
    END IF;
"""

sql += "END $$;\n\n"

sql += """
-- Enable RLS
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON public.school_classes FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read access to authenticated users" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read access to authenticated users" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read access to authenticated users" ON public.teacher_assignments FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
"""

with open('setup_database.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
