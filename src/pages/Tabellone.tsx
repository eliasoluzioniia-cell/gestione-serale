import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { getProveDiRealtaConValutazioni, deleteProvaDiRealta } from '../lib/supabase_api';
import EditProvaModal from '../components/EditProvaModal';

interface TabelloneProps {
  session?: Session | null;
}


export default function Tabellone({ session }: TabelloneProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [view, setView] = useState<'quadro' | 'archivio'>('quadro');
  
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [prove, setProve] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [docenteId, setDocenteId] = useState<string | null>(null);
  const [selectedProva, setSelectedProva] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const role = (session?.user?.user_metadata?.role || 'studente').toLowerCase();
  const isAdminOrTutor = role === 'admin' || role === 'tutor';

  useEffect(() => {
    // Carica classi e, se docente, recupera l'ID docente interno
    const init = async () => {
      const { data: cls } = await supabase.from('classi').select('*, indirizzi(nome)');
      setClasses(cls || []);

      if (role === 'docente') {
        const { data: doc } = await supabase
          .from('docenti')
          .select('id')
          .eq('utente_id', session?.user?.id)
          .single();
        if (doc) setDocenteId(doc.id);
      }
    };
    init();
  }, [role, session?.user?.id]);


  const fetchData = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      // 1. Studenti
      const { data: stData } = await supabase
        .from('studenti_classi')
        .select('studenti:studenti(*)')
        .eq('classe_id', selectedClass);
      setStudents(stData?.map((d: any) => d.studenti) || []);

      // 2. Materie (filtra se docente)
      let subQuery = supabase.from('assegnazioni_cattedre').select('materie(*)').eq('classe_id', selectedClass);
      if (role === 'docente' && docenteId) {
        subQuery = subQuery.eq('docente_id', docenteId);
      }
      const { data: subData } = await subQuery;
      const uniqueSubjects = Array.from(new Set((subData || []).map(s => JSON.stringify(s.materie)))).map(s => JSON.parse(s));
      setSubjects(uniqueSubjects);

      // 3. Archivio Prove (Gestione)
      const proveData = await getProveDiRealtaConValutazioni(selectedClass, (role === 'docente' && docenteId) ? docenteId : undefined);
      setProve(proveData || []);

      // 4. Tutte le Valutazioni (per il Quadro) con dettagli competenza e materia
      let grQuery = supabase
        .from('valutazioni')
        .select(`
          *, 
          prova:prove_di_realta!inner(
            competenza:competenze(*), 
            assegnazione:assegnazioni_cattedre!inner(
              classe_id, 
              docente_id,
              materia:materie(*)
            )
          )
        `)
        .eq('prova.assegnazione.classe_id', selectedClass);

      // Filtro per docente se il ruolo lo richiede
      if (role === 'docente' && docenteId) {
        grQuery = grQuery.eq('prova.assegnazione.docente_id', docenteId);
      }

      const { data: grData } = await grQuery;
      
      const assessments = grData || [];
      setGrades(assessments);

      // Genera Colonne: Coppie (Materia, Competenza) uniche che hanno valutazioni
      const colMap = new Map();
      assessments.forEach((g: any) => {
        const m = g.prova.assegnazione.materia;
        const c = g.prova.competenza;
        const key = `${m.id}-${c.id}`;
        if (!colMap.has(key)) {
          colMap.set(key, { 
            id: key, 
            materia_id: m.id, 
            materia_codice: m.codice, 
            competenza_id: c.id, 
            competenza_codice: c.codice 
          });
        }
      });

      // Ordina per codice materia e poi codice competenza
      const sortedCols = Array.from(colMap.values()).sort((a, b) => {
        if (a.materia_codice !== b.materia_codice) return a.materia_codice.localeCompare(b.materia_codice);
        return a.competenza_codice.localeCompare(b.competenza_codice);
      });
      
      setSubjects(sortedCols);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, docenteId]);

  const handleDeleteProva = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa prova? Verranno eliminati anche tutti i voti associati.")) return;
    try {
      await deleteProvaDiRealta(id);
      setProve(prev => prev.filter(p => p.id !== id));
      fetchData(); // Refresh quadro
    } catch (err) {
      alert("Errore nell'eliminazione.");
    }
  };

  const getGradesBySubComp = (studentId: string, subjectId: string, compId: string) => {
    const studentGrades = grades.filter(g => 
      g.studente_id === studentId && 
      g.prova.assegnazione.materia.id === subjectId &&
      g.prova.competenza.id === compId
    );
    if (studentGrades.length === 0) return null;
    return studentGrades[studentGrades.length - 1];
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight">Tabellone Valutazioni</h1>
          <p className="text-slate-500">Gestione archivio prove e quadro riassuntivo</p>
        </div>
        <div className="bg-slate-100 p-1 rounded-2xl flex">
          <button 
            onClick={() => setView('quadro')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'quadro' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
          >
            Quadro Generale
          </button>
          <button 
            onClick={() => setView('archivio')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'archivio' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
          >
            Gestione Archivio
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-surface-variant shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Seleziona Classe</label>
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)} 
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-lg outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
          >
            <option value="">-- Scegli la classe per visualizzare i dati --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.anno_corso} {c.sezione} - {c.indirizzi?.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedClass ? (
        <div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 italic">school</span>
          <p className="text-slate-400 font-medium tracking-tight">Seleziona una classe per iniziare la gestione</p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center animate-pulse">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">progress_activity</span>
          <p className="font-black text-primary uppercase text-xs tracking-widest">Caricamento in corso...</p>
        </div>
      ) : view === 'quadro' ? (
        <div className="bg-white rounded-[2.5rem] border border-surface-variant overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-surface-variant">
                  <th className="py-5 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Alunno</th>
                  {subjects.map(col => (
                    <th key={col.id} className="py-3 px-4 text-center border-r border-slate-100 min-w-[110px] bg-white group/col">
                      <div className="text-[11px] font-black text-on-surface uppercase tracking-tight truncate mb-0.5" title={col.materia_codice}>
                        {col.materia_codice}
                      </div>
                      <div className="text-[10px] font-bold text-primary bg-primary/5 rounded-md px-1.5 py-0.5 inline-block border border-primary/10 tracking-tighter">
                        {col.competenza_codice}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant text-sm font-medium">
                {students.map(st => {
                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-5 px-8 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0,02)]">
                        {st.cognome} {st.nome}
                      </td>
                      {subjects.map(col => {
                        const assessment = getGradesBySubComp(st.id, col.materia_id, col.competenza_id);
                        return (
                          <td key={col.id} className="py-5 px-6 text-center text-slate-600 border-r border-slate-50">
                            {assessment ? (
                              <div className="flex flex-col items-center gap-0.5">
                                {assessment.voto_numerico && (
                                  <span className="font-headline font-bold text-lg text-slate-900 leading-none">
                                    {assessment.voto_numerico}
                                  </span>
                                )}
                                {assessment.livello && (
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                    assessment.voto_numerico ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary text-base px-2 py-1'
                                  }`}>
                                    {assessment.livello}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {students.length === 0 && <div className="p-20 text-center text-slate-400">Nessuno studente iscritto.</div>}
        </div>
      ) : (
        <div className="space-y-4">
          {prove.map(p => (
            <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-surface-variant shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex flex-col items-center justify-center border border-primary/10">
                  <span className="text-xs font-black uppercase leading-none mb-1">{new Date(p.data_prova).toLocaleString('it-IT', { month: 'short' })}</span>
                  <span className="text-2xl font-black leading-none">{new Date(p.data_prova).getDate()}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-tighter">
                      {p.materia?.materia?.codice || 'N/A'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {p.competenza?.codice}
                    </span>
                    {isAdminOrTutor && p.materia?.docente && (
                      <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md">
                        {p.materia.docente.cognome}
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-xl text-slate-800 leading-tight">{p.descrizione}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">group</span>
                    {p.valutazioni?.length || 0} studenti valutati
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setSelectedProva(p); setIsEditModalOpen(true); }}
                  className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-bold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  Modifica
                </button>
                <button 
                  onClick={() => handleDeleteProva(p.id)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-error/10 hover:text-error transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))}
          {prove.length === 0 && (
            <div className="p-20 text-center bg-white rounded-[3rem] border border-surface-variant">
              <span className="material-symbols-outlined text-6xl text-slate-100 mb-4">history_edu</span>
              <p className="text-slate-400 font-medium">Nessuna prova inserita in archivio per questa classe</p>
            </div>
          )}
        </div>
      )}

      <EditProvaModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        prova={selectedProva}
        onSave={fetchData}
      />
    </div>
  );
}
