-- Supabase SQL Schema for School Evening Courses

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
INSERT INTO public.school_classes (id, name, short_name) VALUES ('C0000', 'I periodo', 'I per') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.school_classes (id, name, short_name) VALUES ('C0001', 'II periodo', 'II Per') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.school_classes (id, name, short_name) VALUES ('C0002', 'III periodo', 'III per') ON CONFLICT (id) DO NOTHING;

-- 3. Insert Subjects
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0000', 'A012 Italiano', 'Italiano') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0001', 'A012 Storia', 'Storia') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0002', 'A015 Igiene e cultura sanitaria', 'Igiene') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0003', 'A017 Elementi storia arte espressioni grafiche', 'Arte') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0004', 'A018 Psicologia generale', 'Psicologia') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0005', 'A018 Scienze Umane', 'Scienze Umane') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0006', 'A020 Fisica', 'Fisica') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0007', 'A026 Matematica', 'Matematica') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0008', 'A029 Musica', 'Musica') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0009', 'A034 Chimica', 'Chimica') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0010', 'A045 Tecnica Amministrativa  Economia', 'Tecnica Amm') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0011', 'A046 Diritto e legislazione', 'Diritto e leg') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0012', 'A046 Diritto ed economia', 'Diritto econ') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0013', 'A050 Scienze della terra biologia chimica', 'Scienze terra -bio') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0014', 'A24 Francese', 'Francese') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0015', 'AB24 Inglese', 'Inglese') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0016', 'B023 Metologie Operative', 'Met Op') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0017', 'Disp IDA', 'Disp IDA') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0018', 'Rec 1/2', 'Rec 1/2') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0019', 'REC 1/3', 'REC 1/3') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.subjects (id, name, short_name) VALUES ('M0020', 'Recup', 'Recup') ON CONFLICT (id) DO NOTHING;

-- 4. Insert Teachers
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Bongiovanni Franca', 'P0000') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Calcagno Francesca', 'P0001') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Calcagno Giuseppe Gaetano', 'P0002') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Cancaro Fabio', 'P0003') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Caprì Maria', 'P0004') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Casalotto Daniela', 'P0005') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Cristina Fabiana', 'P0006') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'D''Auria Santina Elisa', 'P0007') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Forte Sabrina', 'P0008') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Giunta Mario', 'P0009') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'La Porta Rosa Maria', 'P0010') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Luca Randazzo', 'P0011') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Mancuso Luana', 'P0012') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Manno Giuseppina', 'P0013') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO public.teachers (id, name, external_id) VALUES (uuid_generate_v4(), 'Zanghì Giuseppe', 'P0014') ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name;

-- 5. Insert Assignments

DO $$
DECLARE
  prof_id UUID;
BEGIN

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0013';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0004') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0000';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0008') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0007';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0016') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0008';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0007') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0013';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0005') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0007';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0016') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0003';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0010') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0009';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0006') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0004';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0014') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0014';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0001') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0007';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0004') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0012';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0015') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0014';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0001') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0014';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0000') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0007';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0005') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0001';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0011') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0012';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0015') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0005';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0002') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0003';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0010') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0007';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0008') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0014';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0000') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0007';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0003') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0001';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0011') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0008';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0007') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0014';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0001') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0011';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0013') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0008';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0007') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0005';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0002') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0004';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0014') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0012';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0015') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0002';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0009') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0010';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0000', 'M0003') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0014';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0000') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0006';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0004') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0004';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0001', 'M0014') ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO prof_id FROM public.teachers WHERE external_id = 'P0001';
    IF prof_id IS NOT NULL THEN
        INSERT INTO public.teacher_assignments (teacher_id, class_id, subject_id) VALUES (prof_id, 'C0002', 'M0011') ON CONFLICT DO NOTHING;
    END IF;
END $$;


-- Enable RLS
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to authenticated users" ON public.school_classes FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read access to authenticated users" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read access to authenticated users" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY "Allow read access to authenticated users" ON public.teacher_assignments FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
