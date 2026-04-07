export interface Scuola {
  id: string;
  nome: string;
}

export interface Indirizzo {
  id: string;
  scuola_id: string;
  nome: string;
}

export interface AnnoScolastico {
  id: string;
  anno: string;
  is_corrente: boolean;
}

export interface Classe {
  id: string;
  indirizzo_id: string;
  anno_scolastico_id: string;
  anno_corso: string;
  periodo?: string;
  sezione: string;
}

export interface Utente {
  id: string;
  auth_id: string;
  ruolo: 'Admin' | 'Docente' | 'Tutor';
}

export interface Docente {
  id: string;
  utente_id: string;
  nome: string;
  cognome: string;
}

export interface Studente {
  id: string;
  nome: string;
  cognome: string;
  matricola: string;
  studenti_classi?: {
    classi: {
      periodo: string;
      sezione: string;
    }
  }[];
}

export interface Materia {
  id: string;
  codice: string;
  descrizione: string;
}

export interface Competenza {
  id: string;
  codice: string;
  descrizione: string;
  asse?: string;
}

export interface CurriculoEntry {
  materia_id: string;
  competenza_id: string;
  competenza: Competenza;
  ore_totali: number;
  ore_orientamento: number;
  ore_presenza: number;
  ore_distanza: number;
  modalita_verifica: string;
}

export interface AssegnazioneCattedra {
  id: string;
  docente_id: string;
  materia_id: string;
  classe_id: string;
}

export interface PFI {
  id: string;
  studente_id: string;
  classe_id: string;
  competenza_id: string;
  ore_previste: number;
  crediti_riconosciuti: boolean;
}

export interface ProvaDiRealta {
  id: string;
  assegnazione_id: string;
  competenza_id: string;
  data_prova: string; // ISO String mapping from Date
  descrizione: string;
}

export interface Valutazione {
  id: string;
  prova_id: string;
  studente_id: string;
  voto_numerico?: number;
  livello?: 'A' | 'B' | 'C' | 'D' | 'N/A';
}

