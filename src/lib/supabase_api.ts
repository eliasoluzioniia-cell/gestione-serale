/**
 * supabase_api.ts → db_api.ts (Neon edition)
 * Tutte le funzioni sono identiche nell'interfaccia ma usano il nuovo client Neon via API Routes.
 * Import: 'import { supabase } from './api'' invece di '@supabase/supabase-js'
 */
import { supabase } from './supabase';
export { supabase };
import type { ProvaDiRealta, Valutazione, Competenza, CurriculoEntry } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Helper per chiamate dirette alle API Routes dedicate (per query complesse)
/*
async function apiCall(path: string, method = 'GET', body?: any) {
  const token = localStorage.getItem('neon_auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Errore API');
  return data;
}
*/

/**
 * 0. Recupera l'ID interno del docente per l'utente loggato
 */
export async function getCurrentDocenteId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const authUserId = session.user.id;

  // Collega l'utente loggato (auth_id) al docente tramite la tabella utenti
  const { data, error } = await supabase
    .from('docenti')
    .select('id, utenti!inner(auth_id)')
    .eq('utenti.auth_id', authUserId)
    .maybeSingle();

  if (error || !data) {
    console.warn("Nessun docente trovato per l'utente loggato:", authUserId);
    return null;
  }
  return (data as any)?.id || null;
}

/**
 * 1. Caricamento Classi del Docente
 */
export async function getDocenteClassi() {
  const docenteId = await getCurrentDocenteId();
  if (!docenteId) return [];

  const { data, error } = await supabase
    .from('assegnazioni_cattedre')
    .select('id,classe_id,materia_id,docente_id')
    .eq('docente_id', docenteId);

  if (error) throw error;

  // Arricchisci con dati di classi e materie
  if (!data || !Array.isArray(data)) return [];

  const enriched = await Promise.all(
    (data as any[]).map(async (row: any) => {
      const [classeRes, materiaRes, docenteRes] = await Promise.all([
        supabase.from('classi').select('id,anno_corso,sezione,periodo,anno_scolastico_id').eq('id', row.classe_id).maybeSingle(),
        supabase.from('materie').select('id,codice,descrizione').eq('id', row.materia_id).maybeSingle(),
        supabase.from('docenti').select('id,nome,cognome').eq('id', row.docente_id).maybeSingle(),
      ]);
      return {
        id: row.id,
        classe: classeRes.data || null,
        materia: materiaRes.data || null,
        docente: docenteRes.data || null,
      };
    })
  );

  return enriched.filter(a => a.classe && a.materia);
}

/**
 * 2. Validazione Competenze Curricolo
 */
export async function getCompetenzeByMateria(materiaId: string, classeId?: string) {
  let query = supabase
    .from('curricolo')
    .select('competenza_id')
    .eq('materia_id', materiaId);

  if (classeId) {
    query = query.eq('classe_id', classeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data || !Array.isArray(data) || (data as any[]).length === 0) return [];

  const compIds = (data as any[]).map((d: any) => d.competenza_id);

  // Fetch competenze per gli ID trovati
  const competenze: Competenza[] = [];
  for (const compId of compIds) {
    const { data: comp } = await supabase
      .from('competenze')
      .select('id,codice,descrizione,asse')
      .eq('id', compId)
      .single();
    if (comp) competenze.push(comp as any as Competenza);
  }

  return competenze;
}

/**
 * 2b. Caricamento Curricolo Completo
 */
export async function getCurriculoByMateria(materiaId: string): Promise<CurriculoEntry[]> {
  const { data, error } = await supabase
    .from('curricolo')
    .select('materia_id,competenza_id,ore_totali,ore_orientamento,ore_presenza,ore_distanza,modalita_verifica')
    .eq('materia_id', materiaId);

  if (error) throw error;
  return (data || []) as any[];
}

/**
 * 3. Caricamento Studenti PFI
 */
export async function getStudentiPFI(classeId: string, competenzaId: string) {
  const { data: students, error: stError } = await supabase
    .from('studenti_classi')
    .select('studente_id')
    .eq('classe_id', classeId);

  if (stError) throw stError;
  if (!students || !Array.isArray(students) || (students as any[]).length === 0) return [];

  const studentIds = (students as any[]).map((s: any) => s.studente_id).filter(Boolean);

  // Fetch studenti
  const studentiData = await Promise.all(
    studentIds.map(async (id: string) => {
      const { data } = await supabase.from('studenti').select('id,nome,cognome,matricola').eq('id', id).single();
      return data;
    })
  );

  // Fetch PFI
  const pfiList: any[] = [];
  for (const sid of studentIds) {
    const { data: pfi } = await supabase
      .from('pfi')
      .select('studente_id,ore_previste,crediti_riconosciuti')
      .eq('studente_id', sid)
      .eq('competenza_id', competenzaId)
      .single();
    if (pfi) pfiList.push(pfi);
  }

  return studentiData.filter(Boolean).map((s: any) => ({
    studente: s,
    pfi: pfiList.find((p) => p.studente_id === s?.id) || null,
  }));
}

/**
 * 3b. Caricamento Studenti PFI per multiple competenze
 */
export async function getStudentiPFIMulticompetenza(classeId: string, _competenzeIds: string[]) {
  const { data: students, error: stError } = await supabase
    .from('studenti_classi')
    .select('studente_id')
    .eq('classe_id', classeId);

  if (stError) throw stError;
  if (!students || !Array.isArray(students) || (students as any[]).length === 0) return [];

  const studentIds = (students as any[]).map((s: any) => s.studente_id).filter(Boolean);

  const studentiData = await Promise.all(
    studentIds.map(async (id: string) => {
      const { data } = await supabase.from('studenti').select('id,nome,cognome,matricola').eq('id', id).single();
      return data;
    })
  );

  return studentiData.filter(Boolean).map((s: any) => ({
    studente: s,
    pfis: [] as any[], // Caricato separatamente se necessario
  }));
}

/**
 * 4. Salvataggio Prova di Realtà
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
    .select();

  if (error) {
    console.error("Errore in saveProvaDiRealta:", error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    throw new Error("Il database non ha restituito la riga inserita (controlla le policy RLS).");
  }

  return data[0] as ProvaDiRealta;
}

/**
 * 4b. Salvataggio Valutazioni
 */
export async function saveValutazioni(valutazioni: Omit<Valutazione, 'id'>[]) {
  const results = [];
  for (const val of valutazioni) {
    const { data, error } = await supabase
      .from('valutazioni')
      .insert([val])
      .select();

    if (error) {
      console.error("Errore in saveValutazioni:", error);
      throw error;
    }
    
    if (data && data.length > 0) {
      results.push(data[0]);
    }
  }
  return results;
}

/**
 * 5. Report Competenze
 */
export async function getReportCompetenzeClasse(_classeId: string) {
  const { data, error } = await supabase
    .from('valutazioni')
    .select('voto_numerico,livello,studente_id,prova_id');

  if (error) throw error;
  return data;
}

/**
 * 6. Bulk Import Studenti
 */
export async function bulkImportStudenti(studentiData: {
  nome: string;
  cognome: string;
  codice_fiscale: string;
  matricola?: string;
  classe_id?: string;
}[]) {
  if (!studentiData || studentiData.length === 0) return { success: true, count: 0 };

  const uniqueDataMap = new Map();
  studentiData.forEach((item) => {
    if (item.codice_fiscale) {
      uniqueDataMap.set(item.codice_fiscale.trim().toUpperCase(), item);
    }
  });
  const uniqueStudentiData = Array.from(uniqueDataMap.values());

  const upsertedStudents: any[] = [];
  for (const s of uniqueStudentiData) {
    try {
      const { data, error } = await supabase
        .from('studenti')
        .insert({
          nome: s.nome,
          cognome: s.cognome,
          codice_fiscale: s.codice_fiscale,
          matricola: s.matricola || `MAT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        })
        .select()
        .single();
      if (error) console.warn("Notice: could not upsert student:", error);
      if (data) upsertedStudents.push(data);
    } catch {
      // Studente già esistente — salta
    }
  }

  // Associazioni classi
  for (const s of uniqueStudentiData.filter((d) => d.classe_id)) {
    const studentMatch = upsertedStudents.find((us) => us.codice_fiscale === s.codice_fiscale);
    if (studentMatch) {
      try {
        await supabase.from('studenti_classi').insert({
          studente_id: studentMatch.id,
          classe_id: s.classe_id,
        });
      } catch {
        // Associazione già esistente — salta
      }
    }
  }

  return { success: true, count: uniqueStudentiData.length };
}

/**
 * 7. Gestione Utenti (Admin)
 */
export async function getProfiles() {
  const token = localStorage.getItem('neon_auth_token');
  const res = await fetch(`${API_BASE}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Errore caricamento utenti');
  return res.json();
}

export async function adminCreateUser(userData: {
  email: string;
  password?: string;
  role: string;
  fullName: string;
}) {
  const token = localStorage.getItem('neon_auth_token');
  const res = await fetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Errore creazione utente');
  return data;
}

export async function updateProfile(id: string, updates: any) {
  const token = localStorage.getItem('neon_auth_token');
  const res = await fetch(`${API_BASE}/auth/users`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, ...updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Errore aggiornamento profilo');
  return data;
}

export async function deleteProfile(id: string) {
  const token = localStorage.getItem('neon_auth_token');
  const res = await fetch(`${API_BASE}/auth/users?id=${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore eliminazione profilo');
  }
  return true;
}

/**
 * 8. Prove di Realtà con Valutazioni
 */
export async function getProveDiRealtaConValutazioni(classeId: string, _docenteId?: string) {
  const { data, error } = await supabase
    .from('prove_di_realta')
    .select('*')
    .eq('assegnazione_id', classeId);

  if (error) throw error;
  return data || [];
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
  const results = [];
  for (const val of valutazioni) {
    const { data, error } = await supabase
      .from('valutazioni')
      .upsert(val)
      .select()
      .single();

    if (error) throw error;
    results.push(data);
  }
  return results;
}

export async function deleteProvaDiRealta(id: string) {
  const result = await supabase.from('prove_di_realta').delete().eq('id', id);
  const r = await (result as any);
  if (r.error) throw r.error;
  return true;
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

  let insertedCount = 0;

  for (const entry of data) {
    // Upsert materia
    let materiaId: string | null = null;
    try {
      const { data, error } = await supabase
        .from('materie')
        .insert({ codice: entry.materia_codice, descrizione: entry.materia_nome })
        .select()
        .single();
      if (error) throw error;
      materiaId = data?.id;
    } catch {
      const { data: existing } = await supabase.from('materie').select('id').eq('codice', entry.materia_codice).single();
      materiaId = (existing as any)?.id;
    }

    // Upsert competenza
    let compId: string | null = null;
    try {
      const { data, error } = await supabase
        .from('competenze')
        .insert({ codice: entry.comp_codice, descrizione: entry.comp_desc, asse: entry.comp_asse })
        .select()
        .single();
      if (error) throw error;
      compId = data?.id;
    } catch {
      const { data: existing } = await supabase.from('competenze').select('id').eq('codice', entry.comp_codice).single();
      compId = (existing as any)?.id;
    }

    if (materiaId && compId && entry.classe_id) {
      try {
        await supabase.from('curricolo').insert({
          materia_id: materiaId,
          competenza_id: compId,
          classe_id: entry.classe_id,
          ore_totali: entry.ore_totali,
          ore_presenza: entry.ore_presenza,
          ore_distanza: entry.ore_distanza,
          ore_orientamento: entry.ore_orientamento,
          modalita_verifica: entry.verifica || '',
        });
        insertedCount++;
      } catch {
        // Duplicato — salta
      }
    }
  }

  return { success: true, count: insertedCount };
}