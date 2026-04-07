import { useEffect, useState } from 'react';
import { getDocenteClassi, getCompetenzeByMateria, getStudentiPFI, saveProvaDiRealta, saveValutazioni } from '../lib/supabase_api';
import type { Competenza } from '../types';

export default function RegistroVoti() {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssegnazione, setSelectedAssegnazione] = useState<string>('');
  
  const [competenze, setCompetenze] = useState<Competenza[]>([]);
  const [selectedCompetenza, setSelectedCompetenza] = useState<string>('');
  
  const [studenti, setStudenti] = useState<any[]>([]);
  
  // Form Prova
  const [descrizioneProva, setDescrizioneProva] = useState('');
  const [dataProva, setDataProva] = useState(new Date().toISOString().split('T')[0]);
  
  // Voti grid (studente_id -> { voto_numerico, livello })
  const [votiInput, setVotiInput] = useState<Record<string, { voto_numerico: string, livello: string }>>({});

  useEffect(() => {
    // Carica cattedre del docente finto in questo mock (visto che l'auth non e' ancora attivo al 100%)
    // Nella realtà `getDocenteClassi` userà l'SDK. Simuliamo il caricamento:
    const fetchAssegnazioni = async () => {
      try {
        const data = await getDocenteClassi();
        setAssignments(data || []);
      } catch (err) {
        console.warn("API non connessa o RLS mancante, uso dati mock visuali.");
        setAssignments([
          { id: 'asseg1', classe: { id: 'c1', anno_corso: '1', sezione: 'A', periodo: 'Primo Periodo'}, materia: { id: 'm1', codice: 'MAT', descrizione: 'Matematica' } },
          { id: 'asseg2', classe: { id: 'c2', anno_corso: '2', sezione: 'B', periodo: 'Secondo Periodo'}, materia: { id: 'm2', codice: 'ITA', descrizione: 'Italiano' } }
        ]);
      }
    };
    fetchAssegnazioni();
  }, []);

  useEffect(() => {
    if (!selectedAssegnazione) { setCompetenze([]); setSelectedCompetenza(''); return; }
    const assign = assignments.find(a => a.id === selectedAssegnazione);
    if (!assign) return;

    const fetchComps = async () => {
      try {
        const comps = await getCompetenzeByMateria(assign.materia.id, assign.classe.id);
        setCompetenze(comps || []);
      } catch (e) {
        setCompetenze([
          { id: 'comp1', codice: 'C1', descrizione: 'Risolvere problemi matematici', asse: 'Matematico' },
          { id: 'comp2', codice: 'C2', descrizione: 'Comprendere testi complessi', asse: 'Linguaggi' }
        ]);
      }
    };
    fetchComps();
  }, [selectedAssegnazione, assignments]);

  useEffect(() => {
    if (!selectedAssegnazione || !selectedCompetenza) { setStudenti([]); return; }
    const assign = assignments.find(a => a.id === selectedAssegnazione);
    
    // Fetch Studenti PFI
    const fetchSt = async () => {
      setLoading(true);
      try {
        const st = await getStudentiPFI(assign.classe.id, selectedCompetenza);
        setStudenti(st || []);
      } catch (e) {
        // Mock fallback
        setStudenti([
          { studente: { id: 's1', nome: 'Mario', cognome: 'Rossi', matricola: 'MAT01' }, pfi: { ore_previste: 40, crediti_riconosciuti: false } },
          { studente: { id: 's2', nome: 'Luigi', cognome: 'Verdi', matricola: 'MAT02' }, pfi: { ore_previste: 20, crediti_riconosciuti: true } }
        ]);
      }
      setLoading(false);
    };
    fetchSt();
  }, [selectedAssegnazione, selectedCompetenza, assignments]);

  const handleSave = async () => {
    if (!selectedAssegnazione || !selectedCompetenza || !descrizioneProva) return alert("Compila tutti i campi della prova.");
    
    try {
      setLoading(true);
      
      // 1. Salva la Prova di Realtà
      const prova = await saveProvaDiRealta(
        selectedAssegnazione,
        selectedCompetenza,
        descrizioneProva,
        dataProva
      );

      // 2. Prepara le Valutazioni
      const valutazioniPayload = studenti
        .filter(s => !s.pfi?.crediti_riconosciuti && (votiInput[s.studente.id]?.voto_numerico || votiInput[s.studente.id]?.livello))
        .map(s => ({
          prova_id: prova.id,
          studente_id: s.studente.id,
          voto_numerico: votiInput[s.studente.id]?.voto_numerico ? Number(votiInput[s.studente.id].voto_numerico) : undefined,
          livello: votiInput[s.studente.id]?.livello as any
        }));

      if (valutazioniPayload.length > 0) {
        await saveValutazioni(valutazioniPayload);
      }

      alert("Prova di Realtà e Valutazioni salvate con successo!");
      setDescrizioneProva('');
      setVotiInput({});
    } catch (e: any) {
      console.error(e);
      alert("Errore nel salvataggio: " + (e.message || "Errore sconosciuto"));
    } finally {
      setLoading(false);
    }
  };

  const handleGradesChange = (studentId: string, field: 'voto_numerico' | 'livello', value: string) => {
    setVotiInput(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-surface-variant pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-xs font-bold tracking-widest uppercase mb-3">
            <span className="material-symbols-outlined text-[14px]">edit_document</span>
            Valutazioni PFI V2
          </div>
          <h1 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">Registro Prove di Realtà</h1>
          <p className="text-slate-500 mt-2 text-lg">Seleziona la materia e compila il livello di acquisizione per studente</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={!selectedCompetenza || loading || studenti.length === 0}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
        >
          {loading ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : <span className="material-symbols-outlined text-xl">save</span>}
          {loading ? 'Salvataggio...' : 'Registra Valutazioni'}
        </button>
      </div>

      {/* Controller Top */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform group-hover:scale-110"></div>
        
        <div className="space-y-2 relative z-10">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">La tua Classe / Materia</label>
          <select 
            value={selectedAssegnazione} 
            onChange={e => { setSelectedAssegnazione(e.target.value); setSelectedCompetenza(''); }}
            className="w-full px-5 py-4 bg-surface-container border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/20 appearance-none font-medium text-lg outline-none transition-all cursor-pointer"
          >
            <option value="">-- Seleziona Assegnazione --</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>
                {a.classe.anno_corso} {a.classe.sezione} - {a.materia.codice} ({a.materia.descrizione})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 relative z-10">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Competenza da valutare</label>
          <select 
            value={selectedCompetenza} 
            onChange={e => setSelectedCompetenza(e.target.value)}
            disabled={competenze.length === 0}
            className="w-full px-5 py-4 bg-surface-container border border-outline-variant rounded-2xl focus:ring-4 focus:ring-primary/20 appearance-none font-medium text-lg outline-none transition-all cursor-pointer disabled:opacity-50"
          >
            <option value="">-- Seleziona Competenza --</option>
            {competenze.map(c => (
              <option key={c.id} value={c.id}>
                {c.codice} - {c.descrizione} {c.asse ? `(${c.asse})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prova Details & Grid */}
      {selectedCompetenza && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant flex flex-col md:flex-row gap-6 shadow-sm">
             <div className="flex-1 space-y-2">
               <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Descrizione Prova di Realtà</label>
               <input 
                 type="text" 
                 placeholder="Es. Verifica scritta sulle equazioni di 2° grado..." 
                 value={descrizioneProva}
                 onChange={e => setDescrizioneProva(e.target.value)}
                 className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
               />
             </div>
             <div className="w-full md:w-64 space-y-2">
               <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Data di Esecuzione</label>
               <input 
                 type="date" 
                 value={dataProva}
                 onChange={e => setDataProva(e.target.value)}
                 className="w-full px-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
               />
             </div>
          </div>

          <div className="bg-white rounded-3xl border border-surface-variant overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-surface-variant text-sm text-slate-500">
                    <th className="py-5 px-6 font-bold uppercase tracking-wider">Studente</th>
                    <th className="py-5 px-6 font-bold uppercase tracking-wider text-center">Stato PFI</th>
                    <th className="py-5 px-6 font-bold uppercase tracking-wider text-center">Voto Numerico</th>
                    <th className="py-5 px-6 font-bold uppercase tracking-wider text-center">Livello</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {studenti.map(({ studente, pfi }) => {
                    const hasCredit = pfi?.crediti_riconosciuti;
                    return (
                      <tr key={studente.id} className={`transition-colors hover:bg-slate-50/50 ${hasCredit ? 'bg-surface-variant/30 opacity-70' : ''}`}>
                        <td className="py-4 px-6">
                           <div className="font-bold text-lg text-on-surface">{studente.cognome} {studente.nome}</div>
                           <div className="text-sm text-slate-500 font-medium">Mat: {studente.matricola}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {hasCredit ? (
                            <span className="inline-flex items-center gap-1.5 bg-secondary-container text-secondary px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              Credito Riconosciuto
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-500">
                              {pfi?.ore_previste != null ? `${pfi.ore_previste} ore previste` : 'Ore non definite'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <input 
                            type="number"
                            disabled={hasCredit}
                            value={votiInput[studente.id]?.voto_numerico || ''}
                            onChange={(e) => handleGradesChange(studente.id, 'voto_numerico', e.target.value)}
                            placeholder="-"
                            className="w-20 text-center font-bold text-lg py-2.5 bg-surface-container border border-outline-variant rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="py-4 px-6 text-center">
                           <select
                              disabled={hasCredit}
                              value={votiInput[studente.id]?.livello || ''}
                              onChange={(e) => handleGradesChange(studente.id, 'livello', e.target.value)}
                              className="font-bold text-base py-3 px-4 bg-surface-container border border-outline-variant rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <option value="">- N/A -</option>
                              <option value="A">A - Avanzato</option>
                              <option value="B">B - Intermedio</option>
                              <option value="C">C - Base</option>
                              <option value="D">D - Iniziale</option>

                           </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {studenti.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-500">Nessuno studente iscritto a questa classe.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
