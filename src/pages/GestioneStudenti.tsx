import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase_api';
import type { Studente } from '../types';
import ImportStudentiModal from '../components/ImportStudentiModal';

export default function GestioneStudenti({ session }: { session?: Session | null }) {

  const role = (session?.user?.user_metadata?.role || 'studente').toLowerCase()
  const isDocente = role === 'docente'
  const [studenti, setStudenti] = useState<Studente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Studente> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudenti = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('studenti')
      .select(`
        *,
        studenti_classi(
          classi(
            id,
            periodo,
            sezione
          )
        )
      `)
      .order('cognome', { ascending: true });
    
    if (error) console.error(error);
    else setStudenti(data || []);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classi')
      .select('id, periodo, sezione')
      .order('anno_corso');
    if (data) setClasses(data);
  };

  useEffect(() => {
    fetchStudenti();
    fetchClasses();
  }, []);

  const handleOpenAdd = () => {
    setEditingStudent({ nome: '', cognome: '', matricola: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Studente) => {
    setEditingStudent({ ...student });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare definitivamente questo studente dal sistema?')) return;
    const { error } = await supabase.from('studenti').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchStudenti();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);

    // Sanitize data: remove virtual joined column before upsert
    const { studenti_classi, ...dataToSave } = editingStudent as any;

    const { error } = await supabase
      .from('studenti')
      .upsert(dataToSave);

    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      fetchStudenti();
    }
    setIsSubmitting(false);
  };

  const filteredStudenti = studenti.filter(s => {
    const matchesSearch = `${s.nome} ${s.cognome} ${s.matricola}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassId === 'all' || s.studenti_classi?.some((sc: any) => sc.classi?.id === selectedClassId);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-variant pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">Anagrafe Studenti</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestisci il database globale degli iscritti all'istituto</p>
        </div>
        {!isDocente && (
          <div className="flex gap-4">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">upload_file</span>
              Importa Alunni
            </button>
            <button 
              onClick={handleOpenAdd}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">person_add</span>
              Nuovo Studente
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full bg-white p-6 rounded-3xl shadow-sm border border-surface-variant flex items-center gap-4">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input 
            type="text" 
            placeholder="Cerca per nome, cognome o matricola..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium placeholder:text-slate-300"
          />
        </div>
        
        <div className="w-full md:w-72 bg-white p-4 rounded-3xl shadow-sm border border-surface-variant flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400">filter_list</span>
          <select 
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-bold text-slate-600 appearance-none cursor-pointer"
          >
            <option value="all">Tutte le classi</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.periodo?.split(' ')[0]} {c.sezione}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-primary">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
          <p className="font-bold">Caricamento anagrafe...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-surface-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-surface-variant text-sm text-slate-500">
                <th className="py-5 px-8 font-bold uppercase tracking-wider">Studente</th>
                <th className="py-5 px-8 font-bold uppercase tracking-wider">Classe/Periodo</th>
                <th className="py-5 px-8 font-bold uppercase tracking-wider">Matricola</th>
                {!isDocente && <th className="py-5 px-8 font-bold uppercase tracking-wider text-right">Azioni</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredStudenti.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {student.cognome[0]}{student.nome[0]}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-on-surface">{student.cognome} {student.nome}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    {student.studenti_classi?.[0]?.classi ? (
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
                        {student.studenti_classi[0].classi.periodo?.split(' ')[0]} {student.studenti_classi[0].classi.sezione}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic text-sm">Nessuna classe</span>
                    )}
                  </td>
                  <td className="py-5 px-8">
                    <span className="font-mono bg-slate-100 px-3 py-1 rounded-lg text-sm text-slate-600">
                      {student.matricola}
                    </span>
                  </td>
                  {!isDocente && (
                    <td className="py-5 px-8 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenEdit(student)} className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-3 text-slate-400 hover:text-error hover:bg-error/5 rounded-xl transition-all">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudenti.length === 0 && (
            <div className="p-20 text-center text-slate-400">
               <span className="material-symbols-outlined text-6xl mb-4 opacity-20">person_search</span>
               <p className="text-lg font-medium">Nessun risultato trovato per "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-surface-variant animate-in zoom-in-95 duration-200">
             <h2 className="text-2xl font-black mb-6 font-headline">Scheda Studente</h2>
             <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome</label>
                  <input 
                    required
                    value={editingStudent?.nome}
                    onChange={e => setEditingStudent(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-5 py-4 font-bold text-lg focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cognome</label>
                  <input 
                    required
                    value={editingStudent?.cognome}
                    onChange={e => setEditingStudent(prev => ({ ...prev, cognome: e.target.value }))}
                    className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-5 py-4 font-bold text-lg focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Matricola</label>
                  <input 
                    required
                    value={editingStudent?.matricola}
                    onChange={e => setEditingStudent(prev => ({ ...prev, matricola: e.target.value }))}
                    className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-5 py-4 font-bold font-mono focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all text-primary" 
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Annulla</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {isSubmitting ? 'Salvataggio...' : 'Salva Profilo'}
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportStudentiModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportComplete={fetchStudenti} 
      />
    </div>
  );
}
