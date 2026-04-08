import { useEffect, useState } from 'react';
import { getDocenteClassi, getCompetenzeByMateria, getStudentiPFIMulticompetenza, saveProvaDiRealta, saveValutazioni } from '../lib/supabase_api';
import type { Competenza } from '../types';

export default function RegistroVoti() {

  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssegnazione, setSelectedAssegnazione] = useState<string>('');
  
  const [competenze, setCompetenze] = useState<Competenza[]>([]);
  const [selectedCompetenze, setSelectedCompetenze] = useState<string[]>([]);
  
  const [studenti, setStudenti] = useState<any[]>([]);
  
  // Form Prova
  const [descrizioneProva, setDescrizioneProva] = useState('');
  const [dataProva, setDataProva] = useState(new Date().toISOString().split('T')[0]);
  
  // Voti grid (studente_id -> competenza_id -> { voto_numerico, livello })
  const [votiInput, setVotiInput] = useState<Record<string, Record<string, { voto_numerico: string, livello: string }>>>({});

  useEffect(() => {
    const fetchAssegnazioni = async () => {
      try {
        const data = await getDocenteClassi();
        setAssignments(data || []);
      } catch (err) {
        console.warn("API non connessa, uso dati mock.");
        setAssignments([
          { id: 'asseg1', classe: { id: 'c1', anno_corso: '1', sezione: 'A', periodo: 'Primo Periodo'}, materia: { id: 'm1', codice: 'MAT', descrizione: 'Matematica' } },
          { id: 'asseg2', classe: { id: 'c2', anno_corso: '2', sezione: 'B', periodo: 'Secondo Periodo'}, materia: { id: 'm2', codice: 'ITA', descrizione: 'Italiano' } }
        ]);
      }
    };
    fetchAssegnazioni();
  }, []);

  useEffect(() => {
    if (!selectedAssegnazione) { setCompetenze([]); setSelectedCompetenze([]); return; }
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
    if (!selectedAssegnazione || selectedCompetenze.length === 0) { setStudenti([]); return; }
    const assign = assignments.find(a => a.id === selectedAssegnazione);
    
    const fetchSt = async () => {
      setLoading(true);
      try {
        const st = await getStudentiPFIMulticompetenza(assign.classe.id, selectedCompetenze);
        setStudenti(st || []);
      } catch (e) {
        console.error("Error fetching multi PFI", e);
      }
      setLoading(false);
    };
    fetchSt();
  }, [selectedAssegnazione, selectedCompetenze, assignments]);

  const handleSave = async () => {
    if (!selectedAssegnazione || selectedCompetenze.length === 0 || !descrizioneProva) return alert("Compila tutti i campi della prova.");
    
    try {
      setLoading(true);
      
      for (const compId of selectedCompetenze) {
        const prova = await saveProvaDiRealta(
          selectedAssegnazione,
          compId,
          descrizioneProva,
          dataProva
        );

        const valutazioniPayload = studenti
          .filter(s => {
            const pfiForComp = s.pfis?.find((p: any) => p.competenza_id === compId);
            const hasCredit = pfiForComp?.crediti_riconosciuti;
            const inputs = votiInput[s.studente.id]?.[compId];
            return !hasCredit && (inputs?.voto_numerico || inputs?.livello);
          })
          .map(s => {
            const inputs = votiInput[s.studente.id][compId];
            return {
              prova_id: prova.id,
              studente_id: s.studente.id,
              voto_numerico: inputs.voto_numerico ? Number(inputs.voto_numerico) : undefined,
              livello: inputs.livello as any
            };
          });

        if (valutazioniPayload.length > 0) {
          await saveValutazioni(valutazioniPayload);
        }
      }

      alert("Tutte le Prove di Realtà e Valutazioni sono state salvate con successo!");
      setDescrizioneProva('');
      setVotiInput({});
      setSelectedCompetenze([]);
    } catch (e: any) {
      console.error(e);
      alert("Errore nel salvataggio: " + (e.message || "Errore sconosciuto"));
    } finally {
      setLoading(false);
    }
  };

  const handleGradesChange = (studentId: string, compId: string, field: 'voto_numerico' | 'livello', value: string) => {
    setVotiInput(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [compId]: {
          ...(prev[studentId]?.[compId] || { voto_numerico: '', livello: '' }),
          [field]: value
        }
      }
    }));
  };

  const toggleCompetenza = (compId: string) => {
    setSelectedCompetenze(prev => 
      prev.includes(compId) ? prev.filter(id => id !== compId) : [...prev, compId]
    );
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
          disabled={selectedCompetenze.length === 0 || loading || studenti.length === 0}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
        >
          {loading ? <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span> : <span className="material-symbols-outlined text-xl">save</span>}
          {loading ? 'Salvataggio...' : 'Registra Valutazioni'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform group-hover:scale-110"></div>
        
        <div className="space-y-2 relative z-10">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">La tua Classe / Materia</label>
          <select 
            value={selectedAssegnazione} 
            onChange={e => { setSelectedAssegnazione(e.target.value); setSelectedCompetenze([]); }}
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

        <div className="space-y-4 relative z-10">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Competenze da valutare (Selezione Multipla)</label>
          <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] items-center p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            {selectedCompetenze.length === 0 && <span className="text-xs text-slate-400 font-medium px-2">Nessuna competenza selezionata</span>}
            {selectedCompetenze.map(id => {
              const comp = competenze.find(c => c.id === id);
              return (
                <div key={id} className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-2 border border-primary/20">
                  <span className="text-xs font-black">{comp?.codice}</span>
                  <button onClick={() => toggleCompetenza(id)} className="hover:text-primary-container flex items-center">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[150px] overflow-y-auto p-1 custom-scrollbar">
            {competenze.map(c => (
              <label 
                key={c.id} 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedCompetenze.includes(c.id) 
                    ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/30' 
                    : 'bg-white border-slate-100 hover:border-primary/20 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300" 
                  checked={selectedCompetenze.includes(c.id)}
                  onChange={() => toggleCompetenza(c.id)}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-on-surface leading-none">{c.codice}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{c.descrizione}</span>
                </div>
              </label>
            ))}
            {competenze.length === 0 && <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">Seleziona prima una materia</div>}
          </div>
        </div>
      </div>

      {selectedCompetenze.length > 0 && (
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
                    <th className="py-5 px-6 font-bold uppercase tracking-wider sticky left-0 bg-slate-50 z-10">Studente</th>
                    {selectedCompetenze.map(id => {
                       const comp = competenze.find(c => c.id === id);
                       return (
                         <th key={id} className="py-5 px-6 font-black uppercase tracking-widest text-center border-l border-slate-200 min-w-[200px] bg-slate-100/50">
                           <div className="text-primary mb-1">{comp?.codice}</div>
                           <div className="flex justify-around text-[10px] text-slate-400">
                             <span>Voto Num.</span>
                             <span>Livello</span>
                           </div>
                         </th>
                       )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {studenti.map(({ studente, pfis }) => (
                    <tr key={studente.id} className="transition-colors hover:bg-slate-50/50 group">
                      <td className="py-4 px-6 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                         <div className="font-bold text-on-surface">{studente.cognome} {studente.nome}</div>
                         <div className="text-[11px] text-slate-400 font-medium">Mat: {studente.matricola}</div>
                      </td>
                      
                      {selectedCompetenze.map(compId => {
                        const pfiForComp = pfis?.find((p: any) => p.competenza_id === compId);
                        const hasCredit = pfiForComp?.crediti_riconosciuti;
                        
                        return (
                          <td key={compId} className={`py-4 px-6 text-center border-l border-slate-50 ${hasCredit ? 'bg-secondary/5 opacity-80' : ''}`}>
                            {hasCredit ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter border border-secondary/20">
                                  Credito Riconosciuto
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold italic">Cattedra salta</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <input 
                                  type="number"
                                  value={votiInput[studente.id]?.[compId]?.voto_numerico || ''}
                                  onChange={(e) => handleGradesChange(studente.id, compId, 'voto_numerico', e.target.value)}
                                  placeholder="Voto"
                                  className="w-14 text-center font-bold text-sm py-2 bg-surface-container border border-outline-variant rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                                <select
                                  value={votiInput[studente.id]?.[compId]?.livello || ''}
                                  onChange={(e) => handleGradesChange(studente.id, compId, 'livello', e.target.value)}
                                  className="font-bold text-xs py-2 px-2 bg-surface-container border border-outline-variant rounded-lg focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                >
                                  <option value="">-</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </select>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
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
