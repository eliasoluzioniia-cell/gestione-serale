import { createClient } from '@supabase/supabase-js';
import type { ProvaDiRealta, Valutazione, Competenza, CurriculoEntry } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 1. Caricamento Classi del Docente
 * Recupera le classi (e materie) assegnate al docente attualmente autenticato.
 */
export async function getDocenteClassi() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Utente non autenticato");

  // In un'architettura completa con RLS, il backend filtra automaticamente
  // per docente_id leggendo auth.uid(), quindi basterebbe querare assegnazioni_cattedre.
  const { data, error } = await supabase
    .from('assegnazioni_cattedre')
    .select(`
      id,
      classe:classi(id, anno_corso, sezione, periodo, anno_scolastico_id),
      materia:materie(id, codice, descrizione)
    `)
    // Filtro esplicito (se necessario, in caso la policy RLS non lo faccia in base all'UUID Auth)
    // .eq('docente_id', DOCENTE_UUID) 
    ;

  if (error) throw error;
  return data;
}

/**
 * 2. Validazione Competenze Curricolo
 * Recupera le competenze associate ad una specifica materia e classe (dal curricolo importato).
 */
export async function getCompetenzeByMateria(materiaId: string, classeId?: string) {
  // 1. Try exact ID match
  let query = supabase
    .from('curricolo')
    .select(`
      competenza:competenze(id, codice, descrizione, asse)
    `)
    .eq('materia_id', materiaId);

  if (classeId) {
    query = query.eq('classe_id', classeId);
  }

  const { data, error } = await query;
  if (error) throw error;

  // 2. FALLBACK: If no competencies found, try to find by description/code similarity
  // This helps if the assignment ID points to a master subject but the curriculum 
  // was imported with a slightly different record that was later merged.
  if (!data || data.length === 0) {
    const { data: currentMateria } = await supabase.from('materie').select('codice, descrizione').eq('id', materiaId).single();
    if (currentMateria) {
      const { data: fallbackData } = await supabase
        .from('curricolo')
        .select(`
          competenza:competenze(id, codice, descrizione, asse)
        `)
        .filter('materia_id', 'in', `(SELECT id FROM materie WHERE codice = '${currentMateria.codice}' OR descrizione = '${currentMateria.descrizione}')`)
        .eq('classe_id', classeId || '') // filter needs string or handling null
        ;
      
      if (fallbackData && fallbackData.length > 0) {
        return (fallbackData || []).map((d: any) => d.competenza as Competenza);
      }
    }
  }

  return (data || []).map((d: any) => d.competenza as Competenza);
}

/**
 * 2b. Caricamento Curricolo Completo
 * Recupera l'intero piano formativo di una materia con ore e dettagli.
 */
export async function getCurriculoByMateria(materiaId: string): Promise<CurriculoEntry[]> {
  const { data, error } = await supabase
    .from('curriculo')
    .select(`
      materia_id,
      competenza_id,
      ore_totali,
      ore_orientamento,
      ore_presenza,
      ore_distanza,
      modalita_verifica,
      competenza:competenze(id, codice, descrizione, asse)
    `)
    .eq('materia_id', materiaId);

  if (error) throw error;
  return data as any[];
}

/**
 * 3. Caricamento Studenti PFI e Ore previste
 * Recupera gli studenti di una classe estraendo le ore previste per una competenza dal PFI.
 */
export async function getStudentiPFI(classeId: string, competenzaId: string) {
  // 1. Recupera TUTTI gli studenti della classe
  const { data: students, error: stError } = await supabase
    .from('studenti_classi')
    .select(`
      studente:studenti(id, nome, cognome, matricola)
    `)
    .eq('classe_id', classeId);

  if (stError) throw stError;
  if (!students || students.length === 0) return [];

  // 2. Recupera i dati PFI (se esistono) per la competenza selezionata
  const studentIds = students.map(s => {
    const obj = Array.isArray(s.studente) ? s.studente[0] : s.studente;
    return obj?.id;
  }).filter(Boolean);
  const { data: pfiData, error: pfiError } = await supabase
    .from('pfi')
    .select('studente_id, ore_previste, crediti_riconosciuti')
    .in('studente_id', studentIds)
    .eq('competenza_id', competenzaId);

  if (pfiError) return students.map(s => ({ ...s, pfi: null }));

  // 3. Unione dei dati
  return students.map(s => {
    const studentObj = Array.isArray(s.studente) ? s.studente[0] : s.studente;
    return {
      ...s,
      studente: studentObj,
      pfi: pfiData?.find(p => p.studente_id === studentObj?.id) || null
    };
  });
}

/**
 * 3b. Caricamento Studenti PFI per multiple competenze
 * Recupera gli studenti di una classe e tutti i loro record PFI per un set di competenze.
 */
export async function getStudentiPFIMulticompetenza(classeId: string, competenzeIds: string[]) {
  // 1. Recupera TUTTI gli studenti della classe
  const { data: students, error: stError } = await supabase
    .from('studenti_classi')
    .select(`
      studente:studenti(id, nome, cognome, matricola)
    `)
    .eq('classe_id', classeId);

  if (stError) throw stError;
  if (!students || students.length === 0) return [];

  const studentIds = students.map(s => {
    const obj = Array.isArray(s.studente) ? s.studente[0] : s.studente;
    return obj?.id;
  }).filter(Boolean);

  // 2. Recupera TUTTI i dati PFI per queste competenze
  const { data: pfiData } = await supabase
    .from('pfi')
    .select('studente_id, competenza_id, ore_previste, crediti_riconosciuti')
    .in('studente_id', studentIds)
    .in('competenza_id', competenzeIds);

  // 3. Restituisce gli studenti con la mappa dei loro PFI
  return students.map(s => {
    const studentObj = Array.isArray(s.studente) ? s.studente[0] : s.studente;
    const studentPfis = pfiData?.filter(p => p.studente_id === studentObj?.id) || [];
    return {
      studente: studentObj,
      pfis: studentPfis // Array di record PFI per questo studente
    };
  });
}

/**
 * 4. Caricamento/Salvataggio Prova di Realtà
 */
export async function saveProvaDiRealta(
  assegnazioneId: string,
  competenzaId: string,
  descrizione: string,
  dataProva: string
) {
  const { data, error } = await supabase
    .from('prove_di_realta')
    .insert([
      { assegnazione_id: assegnazioneId, competenza_id: competenzaId, descrizione, data_prova: dataProva }
    ])
    .select()
    .single();

  if (error) throw error;
  return data as ProvaDiRealta;
}

/**
 * 4b. Salvataggio Valutazioni
 */
export async function saveValutazioni(valutazioni: Omit<Valutazione, 'id'>[]) {
  const { data, error } = await supabase
    .from('valutazioni')
    .insert(valutazioni)
    .select();

  if (error) throw error;
  return data;
}

/**
 * 5. Report Competenze (Stub per la Logica)
 * Ritorna le valutazioni aggregate per la classe diviso per competenze/studenti.
 */
export async function getReportCompetenzeClasse(classeId: string) {
  // Esempio logico, spetta al DTO frontend ricostruirla in una matrice NxM (Studenti x Competenze)
  const { data, error } = await supabase
    .from('valutazioni')
    .select(`
      voto_numerico, 
      livello,
      studente:studenti(id, nome, cognome),
      prova_di_realta:prove_di_realta(
        competenza:competenze(id, codice, descrizione),
        assegnazioni_cattedre(classe_id)
      )
    `)
    .eq('prova_di_realta.assegnazioni_cattedre.classe_id', classeId);

  if (error) throw error;
  return data;
}

/**
 * 6. Bulk Import Studenti
 * Carica una lista di studenti e li associa alle rispettive classi.
 * Supporta l'upsert basato su codice_fiscale.
 */
export async function bulkImportStudenti(studentiData: {
  nome: string;
  cognome: string;
  codice_fiscale: string;
  matricola?: string;
  classe_id?: string;
}[]) {
  if (!studentiData || studentiData.length === 0) return { success: true, count: 0 };

  // --- DEDUPLICAZIONE ---
  // Rimuove duplicati locali nel file (Postgres non accetta update multipli sulla stessa riga in un unico statement)
  const uniqueDataMap = new Map();
  studentiData.forEach(item => {
    if (item.codice_fiscale) {
      uniqueDataMap.set(item.codice_fiscale.trim().toUpperCase(), item);
    }
  });
  const uniqueStudentiData = Array.from(uniqueDataMap.values());

  // 1. Upsert studenti
  const studentsToUpsert = uniqueStudentiData.map(s => ({
    nome: s.nome,
    cognome: s.cognome,
    codice_fiscale: s.codice_fiscale,
    matricola: s.matricola || `MAT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  }));

  const { data: upsertedStudents, error: upsertError } = await supabase
    .from('studenti')
    .upsert(studentsToUpsert, { onConflict: 'codice_fiscale' })
    .select();

  if (upsertError) throw upsertError;

  // 2. Associazione alle classi
  const associations = uniqueStudentiData
    .filter(s => s.classe_id)
    .map(s => {
      const studentMatch = upsertedStudents?.find(us => us.codice_fiscale === s.codice_fiscale);
      return {
        studente_id: studentMatch?.id,
        classe_id: s.classe_id
      };
    })
    .filter(a => a.studente_id && a.classe_id);

  if (associations && associations.length > 0) {
    const { error: assocError } = await supabase
      .from('studenti_classi')
      .upsert(associations, { onConflict: 'studente_id,classe_id' });

    if (assocError) throw assocError;
  }

  return { success: true, count: uniqueStudentiData.length };
}

export async function bulkImportCurriculo(data: {
  materia_nome: string;
  materia_codice: string;
  comp_codice: string;
  comp_desc: string;
  comp_asse?: string;
  ore_totali: number;
  ore_presenza: number;
  ore_distanza: number;
  ore_orientamento: number;
  verifica?: string;
  classe_id: string;
}[]) {
  if (!data || data.length === 0) return { success: true, count: 0 };

  // 1. Fetch current subjects to avoid duplicates
  const { data: existingMaterie, error: matFetchError } = await supabase
    .from('materie')
    .select('id, codice, descrizione');
  if (matFetchError) throw matFetchError;

  // 2. Fetch current competencies
  const { data: existingComp, error: compFetchError } = await supabase
    .from('competenze')
    .select('id, codice');
  if (compFetchError) throw compFetchError;

  // 3. Prepare Materie and Competenze to upsert
  const uniqueMaterieData = Array.from(new Map(data.map(d => [d.materia_codice, { codice: d.materia_codice, descrizione: d.materia_nome }])).values());
  const uniqueCompData = Array.from(new Map(data.map(d => [d.comp_codice, { codice: d.comp_codice, descrizione: d.comp_desc, asse: d.comp_asse }])).values());

  // Only upsert subjects that DON'T match existing ones (to preserve Master IDs)
  const materieToUpsert = uniqueMaterieData.filter(um => 
    !existingMaterie?.some(em => em.codice === um.codice || em.descrizione === um.descrizione)
  );

  if (materieToUpsert.length > 0) {
    const { error: matUpsertError } = await supabase
      .from('materie')
      .upsert(materieToUpsert, { onConflict: 'codice' });
    if (matUpsertError) throw matUpsertError;
  }

  // Upsert Competenze (standard)
  const { data: upsertedComp, error: compUpsertError } = await supabase
    .from('competenze')
    .upsert(uniqueCompData, { onConflict: 'codice' })
    .select();
  if (compUpsertError) throw compUpsertError;

  // Re-fetch all materie to get current IDs
  const { data: allMaterie } = await supabase.from('materie').select('id, codice, descrizione');

  // 4. Build entries
  const rawEntries = data.map(d => {
    // Priority: search by exact code, then by description
    const materia = allMaterie?.find(m => m.codice === d.materia_codice) || 
                    allMaterie?.find(m => m.descrizione === d.materia_nome);
    const competenza = upsertedComp?.find(c => c.codice === d.comp_codice) || 
                       existingComp?.find(c => c.codice === d.comp_codice);
    
    return {
      materia_id: materia?.id,
      competenza_id: competenza?.id,
      classe_id: d.classe_id,
      ore_totali: d.ore_totali,
      ore_presenza: d.ore_presenza,
      ore_distanza: d.ore_distanza,
      ore_orientamento: d.ore_orientamento,
      modalita_verifica: d.verifica || ''
    };
  }).filter(e => e.materia_id && e.competenza_id && e.classe_id);

  // 5. Deduplicate
  const dedupeMap = new Map<string, typeof rawEntries[0]>();
  rawEntries.forEach(e => {
    const key = `${e.materia_id}__${e.competenza_id}__${e.classe_id}`;
    dedupeMap.set(key, e);
  });
  const curriculoEntries = Array.from(dedupeMap.values());

  // 6. Final Upsert
  const BATCH_SIZE = 50;
  for (let i = 0; i < curriculoEntries.length; i += BATCH_SIZE) {
    const batch = curriculoEntries.slice(i, i + BATCH_SIZE);
    const { error: currError } = await supabase
      .from('curricolo')
      .upsert(batch, { onConflict: 'materia_id,competenza_id,classe_id' });
    if (currError) throw currError;
  }

  return { success: true, count: curriculoEntries.length };
}

/**
 * 7. Gestione Utenti (Admin/Tutor)
 */
export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateProfile(id: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProfile(id: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * 8. Gestione Approfondita Valutazioni/Prove
 */
export async function getProveDiRealtaConValutazioni(classeId: string, docenteId?: string) {
  let query = supabase
    .from('prove_di_realta')
    .select(`
      *,
      competenza:competenze(id, codice, descrizione),
      materia:assegnazioni_cattedre!inner(
        materia:materie(id, codice, descrizione)
      ),
      valutazioni(
        id,
        studente_id,
        voto_numerico,
        livello,
        studente:studenti(id, nome, cognome)
      )
    `)
    .eq('assegnazioni_cattedre.classe_id', classeId);

  if (docenteId) {
    query = query.eq('assegnazioni_cattedre.docente_id', docenteId);
  }

  const { data, error } = await query.order('data_prova', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateProvaDiRealta(id: string, updates: any) {
  const { data, error } = await supabase
    .from('prove_di_realta')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateValutazioniBulk(valutazioni: any[]) {
  const { data, error } = await supabase
    .from('valutazioni')
    .upsert(valutazioni, { onConflict: 'prova_id,studente_id' })
    .select();

  if (error) throw error;
  return data;
}

export async function deleteProvaDiRealta(id: string) {
  const { error } = await supabase
    .from('prove_di_realta')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
