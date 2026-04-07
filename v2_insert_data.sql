-- Ingestion script per V2 (Generato automaticamente)
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

    DECLARE v_cls_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.classi (id, indirizzo_id, anno_scolastico_id, anno_corso, periodo, sezione) 
        VALUES (v_cls_uuid, v_indirizzo_id, v_anno_id, '1', 'I periodo', 'A');
        INSERT INTO tmp_classi VALUES ('C0000', v_cls_uuid);
    END;

    DECLARE v_cls_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.classi (id, indirizzo_id, anno_scolastico_id, anno_corso, periodo, sezione) 
        VALUES (v_cls_uuid, v_indirizzo_id, v_anno_id, '2', 'II periodo', 'A');
        INSERT INTO tmp_classi VALUES ('C0001', v_cls_uuid);
    END;

    DECLARE v_cls_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.classi (id, indirizzo_id, anno_scolastico_id, anno_corso, periodo, sezione) 
        VALUES (v_cls_uuid, v_indirizzo_id, v_anno_id, '2', 'III periodo', 'A');
        INSERT INTO tmp_classi VALUES ('C0002', v_cls_uuid);
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Italiano', 'A012 Italiano');
        INSERT INTO tmp_materie VALUES ('M0000', v_mat_uuid, 'A012 Italiano');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Storia', 'A012 Storia');
        INSERT INTO tmp_materie VALUES ('M0001', v_mat_uuid, 'A012 Storia');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Igiene', 'A015 Igiene e cultura sanitaria');
        INSERT INTO tmp_materie VALUES ('M0002', v_mat_uuid, 'A015 Igiene e cultura sanitaria');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Arte', 'A017 Elementi storia arte espressioni grafiche');
        INSERT INTO tmp_materie VALUES ('M0003', v_mat_uuid, 'A017 Elementi storia arte espressioni grafiche');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Psicologia', 'A018 Psicologia generale');
        INSERT INTO tmp_materie VALUES ('M0004', v_mat_uuid, 'A018 Psicologia generale');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Scienze Umane', 'A018 Scienze Umane');
        INSERT INTO tmp_materie VALUES ('M0005', v_mat_uuid, 'A018 Scienze Umane');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Fisica', 'A020 Fisica');
        INSERT INTO tmp_materie VALUES ('M0006', v_mat_uuid, 'A020 Fisica');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Matematica', 'A026 Matematica');
        INSERT INTO tmp_materie VALUES ('M0007', v_mat_uuid, 'A026 Matematica');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Musica', 'A029 Musica');
        INSERT INTO tmp_materie VALUES ('M0008', v_mat_uuid, 'A029 Musica');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Chimica', 'A034 Chimica');
        INSERT INTO tmp_materie VALUES ('M0009', v_mat_uuid, 'A034 Chimica');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Tecnica Amm', 'A045 Tecnica Amministrativa  Economia');
        INSERT INTO tmp_materie VALUES ('M0010', v_mat_uuid, 'A045 Tecnica Amministrativa  Economia');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Diritto e leg', 'A046 Diritto e legislazione');
        INSERT INTO tmp_materie VALUES ('M0011', v_mat_uuid, 'A046 Diritto e legislazione');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Diritto econ', 'A046 Diritto ed economia');
        INSERT INTO tmp_materie VALUES ('M0012', v_mat_uuid, 'A046 Diritto ed economia');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Scienze terra -bio', 'A050 Scienze della terra biologia chimica');
        INSERT INTO tmp_materie VALUES ('M0013', v_mat_uuid, 'A050 Scienze della terra biologia chimica');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Francese', 'A24 Francese');
        INSERT INTO tmp_materie VALUES ('M0014', v_mat_uuid, 'A24 Francese');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Inglese', 'AB24 Inglese');
        INSERT INTO tmp_materie VALUES ('M0015', v_mat_uuid, 'AB24 Inglese');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Met Op', 'B023 Metologie Operative');
        INSERT INTO tmp_materie VALUES ('M0016', v_mat_uuid, 'B023 Metologie Operative');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Disp IDA', 'Disp IDA');
        INSERT INTO tmp_materie VALUES ('M0017', v_mat_uuid, 'Disp IDA');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Rec 1/2', 'Rec 1/2');
        INSERT INTO tmp_materie VALUES ('M0018', v_mat_uuid, 'Rec 1/2');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'REC 1/3', 'REC 1/3');
        INSERT INTO tmp_materie VALUES ('M0019', v_mat_uuid, 'REC 1/3');
    END;

    DECLARE v_mat_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.materie (id, codice, descrizione) VALUES (v_mat_uuid, 'Recup', 'Recup');
        INSERT INTO tmp_materie VALUES ('M0020', v_mat_uuid, 'Recup');
    END;

    -- Inserimento Competenze e Curricolo (da ODS)

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C01.A', 'Padroneggiare gli strumenti espressivi ed argomentativi indispensabili per gestire l’interazione comunicativa verbale in vari contesti.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C01.B', 'Padroneggiare gli strumenti espressivi ed argomentativi indispensabili per gestire l’interazione comunicativa verbale in vari contesti.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C01.C', 'Padroneggiare gli strumenti espressivi ed argomentativi indispensabili per gestire l’interazione comunicativa verbale in vari contesti.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C02.A', 'Leggere, comprendere ed interpretare testi scritti di vario tipo.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C02.B', 'Leggere, comprendere ed interpretare testi scritti di vario tipo.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C02.C', 'Leggere, comprendere ed interpretare testi scritti di vario tipo.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C03', 'Produrre testi di vario tipo in relazione ai differenti scopi comunicativi.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C04', 'Utilizzare gli strumenti fondamentali per una fruizione consapevole del patrimonio artistico e letterario.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C05.A', 'Produrre testi di vario tipo in lingua in relazione ai differenti scopi comunicativi', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C05.B', 'Produrre testi di vario tipo in lingua in relazione ai differenti scopi comunicativi', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C06.A', 'Utilizzare una lingua straniera per i principali scopi comunicativi ed operativi', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C06.B', 'Utilizzare una lingua straniera per i principali scopi comunicativi ed operativi', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C07', 'Partecipare in modo attivo alla realizzazione di esperienze musicali.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C08', 'Facilitare la comunicazione tra persone e gruppi, anche di culture e contesti diversi, attraverso linguaggi e sistemi di relazione adeguati.', 'Asse Linguistico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C09.A', 'Comprendere il cambiamento e la diversità dei tempi storici in una dimensione diacronica attraverso il confronto fra epoche e in una dimensione sincronica attraverso il confronto fra aree geografiche e culturali.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C09.B', 'Comprendere il cambiamento e la diversità dei tempi storici in una dimensione diacronica attraverso il confronto fra epoche e in una dimensione sincronica attraverso il confronto fra aree geografiche e culturali', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C10.A', 'Riconoscere le connessioni con le strutture demografiche, economiche, sociali, culturali e le trasformazioni avvenute nel corso del tempo.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C10.B', 'Riconoscere le connessioni con le strutture demografiche, economiche, sociali, culturali e le trasformazioni avvenute nel corso del tempo.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C10.C', 'Riconoscere le connessioni con le strutture demografiche, economiche, sociali, culturali e le trasformazioni avvenute nel corso del tempo.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C11.A', 'Collocare l’esperienza personale in un sistema di regole fondato sul reciproco riconoscimento dei diritti garantiti dalla Costituzione, a tutela della persona, della collettività e dell’ambiente.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C11.B', 'Collocare l’esperienza personale in un sistema di regole fondato sul reciproco riconoscimento dei diritti garantiti dalla Costituzione, a tutela della persona, della collettività e dell’ambiente.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C12.A', 'Riconoscere le caratteristiche essenziali del sistema socio economico per orientarsi nel tessuto produttivo ed economico del proprio territorio.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C12.B', 'Riconoscere le caratteristiche essenziali del sistema socio economico per orientarsi nel tessuto produttivo ed economico del proprio territorio.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C13.A', 'Esercitare la cittadinanza attività come espressione dei principi di legalità, solidarietà e partecipazione democratica.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C13.B', 'Esercitare la cittadinanza attività come espressione dei principi di legalità, solidarietà e partecipazione democratica.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C14', 'Sviluppare ed esprimere le proprie qualità di relazione, comunicazione, ascolto, cooperazione e senso di responsabilità nell’esercizio del proprio ruolo.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C15', 'Leggere ed interpretare le trasformazioni del mondo contemporaneo.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C16', 'Riconoscere le caratteristiche essenziali del patrimonio artistico e storico-culturale del territorio a livello locale, nazionale ed internazionale.', 'Asse Storico - Sociale') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C17', 'Utilizzare le tecniche e le procedure del calcolo aritmetico ed algebrico rappresentandole anche sotto forma grafica.', 'Asse Matematico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C18', 'Confrontare ed analizzare figure geometriche, individuando invarianti e relazioni', 'Asse Matematico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C19', 'Analizzare dati e interpretarli sviluppando deduzioni e ragionamenti sugli stessi anche con l’ausilio di rappresentazioni grafiche, usando consapevolmente gli strumenti di calcolo e le potenzialità offerte da applicazioni specifiche di tipo informatico', 'Asse Matematico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C20', 'Individuare le strategie appropriate per la soluzione di problemi.', 'Asse Matematico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C21.A', 'Osservare, descrivere ed analizzare fenomeni appartenenti alla realtà naturale e artificiale e riconoscere nelle varie forme i concetti di sistema e di complessità.', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C21.B', 'Osservare, descrivere ed analizzare fenomeni appartenenti alla realtà naturale e artificiale e riconoscere nelle varie forme i concetti di sistema e di complessità.', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C21.C', 'Osservare, descrivere ed analizzare fenomeni appartenenti alla realtà naturale e artificiale e riconoscere nelle varie forme i concetti di sistema e di complessità.', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C22.A', 'Analizzare qualitativamente e quantitativamente fenomeni legati alle trasformazioni di energia a partire dall’esperienza', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C22.B', 'Analizzare qualitativamente e quantitativamente fenomeni legati alle trasformazioni di energia a partire dall’esperienza', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C22.C', 'Analizzare qualitativamente e quantitativamente fenomeni legati alle trasformazioni di energia a partire dall’esperienza', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C23', 'Comprendere l’importanza della crescita economica. Sviluppare atteggiamenti e comportamenti responsabili volti alla tutela dell’ambiente, degli ecosistemi e delle risorse naturali per uno sviluppo economico rispettoso dell’ambiente.', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'C24', 'Gestire l''identità digitale e i dati della rete, salvaguardando la propria e altrui sicurezza negli ambienti digitali, evitando minacce per la salute e il benessere fisico e psicologico di sé e degli altri.', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'CA1', 'Riflettere sulla dimensione religiosa della vita a partire dalla conoscenza della Bibbia e della persona di Gesù Cristo, scoprendo il senso del linguaggio religioso cristiano.', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'CA2', 'Riflettere sulla dimensione religiosa della vita a partire dalla conoscenza dei principi delle religioni e dei principali profeti, scoprendo il senso del linguaggio religioso.', 'Asse Scientifico-Tecnologico') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.competenze (id, codice, descrizione, asse) 
    VALUES (uuid_generate_v4(), 'nan', 'nan', 'Monte ore totale del PSP (2)    ') ON CONFLICT (codice) DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 48, 4, 36, 8, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Italiano' AND c.codice = 'C01.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 30, 3, 22, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'AB24 Inglese' AND c.codice = 'C01.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 30, 3, 22, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A24 Francese' AND c.codice = 'C01.C'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 50, 5, 35, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Italiano' AND c.codice = 'C02.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'AB24 Inglese' AND c.codice = 'C02.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A24 Francese' AND c.codice = 'C02.C'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 49, 5, 34, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Italiano' AND c.codice = 'C03'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 49, 5, 34, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Italiano' AND c.codice = 'C04'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'AB24 Inglese' AND c.codice = 'C05.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A24 Francese' AND c.codice = 'C05.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'AB24 Inglese' AND c.codice = 'C06.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A24 Francese' AND c.codice = 'C06.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 30, 3, 22, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A029 Musica' AND c.codice = 'C07'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A029 Musica' AND c.codice = 'C08'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 23, 3, 16, 4, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Storia' AND c.codice = 'C09.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 48, 4, 36, 8, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A018 Scienze Umane' AND c.codice = 'C09.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 25, 3, 17, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Storia' AND c.codice = 'C10.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 50, 5, 35, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A018 Scienze Umane' AND c.codice = 'C10.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 48, 4, 36, 8, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'B023 Metologie Operative' AND c.codice = 'C10.C'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 25, 3, 17, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Storia' AND c.codice = 'C11.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 30, 3, 22, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A046 Diritto ed economia' AND c.codice = 'C11.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 24, 3, 16, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A012 Storia' AND c.codice = 'C12.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A046 Diritto ed economia' AND c.codice = 'C12.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 49, 5, 34, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A018 Scienze Umane' AND c.codice = 'C13.A'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 49, 5, 34, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'B023 Metologie Operative' AND c.codice = 'C13.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 49, 5, 34, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A018 Scienze Umane' AND c.codice = 'C14'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 50, 5, 35, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A026 Matematica' AND c.codice = 'C17'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 48, 4, 36, 8, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A026 Matematica' AND c.codice = 'C18'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 49, 5, 34, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A026 Matematica' AND c.codice = 'C19'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 49, 5, 34, 10, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A026 Matematica' AND c.codice = 'C20'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 30, 3, 22, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A020 Fisica' AND c.codice = 'C21.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 30, 3, 22, 5, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A034 Chimica' AND c.codice = 'C21.C'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A020 Fisica' AND c.codice = 'C22.B'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.curricolo (materia_id, competenza_id, ore_totali, ore_orientamento, ore_presenza, ore_distanza, modalita_verifica)
    SELECT m.uuid, c.id, 33, 3, 23, 7, 'PS PO'
    FROM tmp_materie m, public.competenze c
    WHERE m.nome_completo = 'A034 Chimica' AND c.codice = 'C22.C'
    ON CONFLICT DO NOTHING;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Franca', 'Bongiovanni');
        INSERT INTO tmp_docenti VALUES ('P0000', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Francesca', 'Calcagno');
        INSERT INTO tmp_docenti VALUES ('P0001', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Giuseppe Gaetano', 'Calcagno');
        INSERT INTO tmp_docenti VALUES ('P0002', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Fabio', 'Cancaro');
        INSERT INTO tmp_docenti VALUES ('P0003', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Maria', 'Caprì');
        INSERT INTO tmp_docenti VALUES ('P0004', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Daniela', 'Casalotto');
        INSERT INTO tmp_docenti VALUES ('P0005', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Fabiana', 'Cristina');
        INSERT INTO tmp_docenti VALUES ('P0006', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Santina Elisa', 'D''Auria');
        INSERT INTO tmp_docenti VALUES ('P0007', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Sabrina', 'Forte');
        INSERT INTO tmp_docenti VALUES ('P0008', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Mario', 'Giunta');
        INSERT INTO tmp_docenti VALUES ('P0009', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Porta Rosa Maria', 'La');
        INSERT INTO tmp_docenti VALUES ('P0010', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Randazzo', 'Luca');
        INSERT INTO tmp_docenti VALUES ('P0011', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Luana', 'Mancuso');
        INSERT INTO tmp_docenti VALUES ('P0012', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Giuseppina', 'Manno');
        INSERT INTO tmp_docenti VALUES ('P0013', v_doc_uuid);
    END;

    DECLARE v_doc_uuid UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.docenti (id, nome, cognome) VALUES (v_doc_uuid, 'Giuseppe', 'Zanghì');
        INSERT INTO tmp_docenti VALUES ('P0014', v_doc_uuid);
    END;

    -- Inserimento Assegnazioni Cattedre

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0008' AND m.legacy_id = 'M0007' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0006' AND m.legacy_id = 'M0004' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0012' AND m.legacy_id = 'M0015' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0004' AND m.legacy_id = 'M0014' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0000' AND m.legacy_id = 'M0008' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0003' AND m.legacy_id = 'M0010' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0007' AND m.legacy_id = 'M0008' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0014' AND m.legacy_id = 'M0000' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0007' AND m.legacy_id = 'M0005' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0001' AND m.legacy_id = 'M0011' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0013' AND m.legacy_id = 'M0005' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0005' AND m.legacy_id = 'M0002' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0014' AND m.legacy_id = 'M0001' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0007' AND m.legacy_id = 'M0016' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0008' AND m.legacy_id = 'M0007' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0004' AND m.legacy_id = 'M0014' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0012' AND m.legacy_id = 'M0015' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0014' AND m.legacy_id = 'M0001' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0009' AND m.legacy_id = 'M0006' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0010' AND m.legacy_id = 'M0003' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0001' AND m.legacy_id = 'M0011' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0014' AND m.legacy_id = 'M0000' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0007' AND m.legacy_id = 'M0016' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0007' AND m.legacy_id = 'M0003' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0003' AND m.legacy_id = 'M0010' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0011' AND m.legacy_id = 'M0013' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0008' AND m.legacy_id = 'M0007' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0007' AND m.legacy_id = 'M0004' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0004' AND m.legacy_id = 'M0014' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0001' AND m.legacy_id = 'M0011' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0012' AND m.legacy_id = 'M0015' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0002' AND m.legacy_id = 'M0009' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0005' AND m.legacy_id = 'M0002' AND c.legacy_id = 'C0002'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0013' AND m.legacy_id = 'M0004' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0014' AND m.legacy_id = 'M0000' AND c.legacy_id = 'C0000'
    ON CONFLICT DO NOTHING;

    INSERT INTO public.assegnazioni_cattedre (docente_id, materia_id, classe_id)
    SELECT d.uuid, m.uuid, c.uuid 
    FROM tmp_docenti d, tmp_materie m, tmp_classi c 
    WHERE d.legacy_id = 'P0014' AND m.legacy_id = 'M0001' AND c.legacy_id = 'C0001'
    ON CONFLICT DO NOTHING;

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
