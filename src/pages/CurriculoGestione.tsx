import { useEffect, useState } from 'react';
import type { Session } from '../lib/api';
import { supabase } from '../lib/supabase_api';
import type { Indirizzo, Classe } from '../types';
import ImportCurriculoModal from '../components/ImportCurriculoModal';

export default function CurriculoGestione({ session }: { session?: Session | null }) {

  const role = (session?.user?.ruolo || (session?.user as any)?.user_metadata?.role || 'studente').toLowerCase()
  const isDocente = role === 'docente'
  // Filters
  const [indirizzi, setIndirizzi] = useState<Indirizzo[]>([]);
  const [classi, setClassi] = useState<Classe[]>([]);
  const [selectedIndirizzo, setSelectedIndirizzo] = useState<string>('');
  const [selectedClasse, setSelectedClasse] = useState<string>('');

  // Data
  const [curriculoCompleto, setCurriculoCompleto] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // --- Data Fetching ---
  const fetchIndirizzi = async () => {
    const { data } = await supabase.from('indirizzi').select('*').order('nome');
    setIndirizzi(data || []);
  };

  const fetchCurriculo = async (classeId: string) => {
    setLoading(true);
    try {
      // Fetch directly from curricolo table for this class
      const { data: curriculoData, error: currError } = await supabase
        .from('curricolo')
        .select('*, materia:materie(*), competenza:competenze(*)')
        .eq('classe_id', classeId);

      if (currError) throw currError;

      if (!curriculoData || curriculoData.length === 0) {
        setCurriculoCompleto([]);
        return;
      }

      // Group by subject (using the materia object fetched in the join)
      const grouped = curriculoData.reduce((acc: any, entry: any) => {
        const mId = entry.materia_id;
        if (!acc[mId]) acc[mId] = { materia: entry.materia, entries: [] };
        acc[mId].entries.push(entry);
        return acc;
      }, {});

      // Sort by subject name
      const sorted = Object.values(grouped).sort((a: any, b: any) => 
        a.materia.descrizione.localeCompare(b.materia.descrizione)
      );

      setCurriculoCompleto(sorted);
    } catch (e) {
      console.error(e);
      setCurriculoCompleto([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => { fetchIndirizzi(); }, []);

  useEffect(() => {
    if (selectedIndirizzo) {
      supabase.from('classi')
        .select('*')
        .eq('indirizzo_id', selectedIndirizzo)
        .order('anno_corso')
        .then(({ data }) => setClassi(data || []));
    } else {
      setClassi([]);
    }
    setSelectedClasse('');
    setCurriculoCompleto([]);
  }, [selectedIndirizzo]);

  useEffect(() => {
    if (selectedClasse) fetchCurriculo(selectedClasse);
    else setCurriculoCompleto([]);
  }, [selectedClasse]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-surface-variant pb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">Gestione Curricolo</h1>
          <p className="text-slate-500 mt-2 text-lg">Esplora le competenze per indirizzo e classe, oppure carica il curricolo ministeriale</p>
        </div>
        {!isDocente && (
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 shrink-0"
          >
            <span className="material-symbols-outlined">upload_file</span>
            Importa da File
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">1. Seleziona Indirizzo</label>
          <div className="relative">
            <select
              value={selectedIndirizzo}
              onChange={e => setSelectedIndirizzo(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-surface-variant rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-base appearance-none cursor-pointer"
            >
              <option value="">-- Scegli Indirizzo --</option>
              {indirizzi.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">expand_more</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">2. Seleziona Classe</label>
          <div className="relative">
            <select
              disabled={!selectedIndirizzo}
              value={selectedClasse}
              onChange={e => setSelectedClasse(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-surface-variant rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-base appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Scegli Classe --</option>
              {classi.map(c => <option key={c.id} value={c.id}>{c.anno_corso}{c.sezione} — {c.periodo}</option>)}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">expand_more</span>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-primary">
          <span className="material-symbols-outlined animate-spin text-5xl mb-4">progress_activity</span>
          <p className="font-black uppercase tracking-widest text-sm">Caricamento piano studi...</p>
        </div>

      ) : curriculoCompleto.length > 0 ? (
        <div className="space-y-10">
          {curriculoCompleto.map((group: any) => (
            <div key={group.materia.id} className="bg-white rounded-[3rem] border border-surface-variant shadow-sm overflow-hidden">
              {/* Subject Header */}
              <div className="bg-slate-50 px-10 py-8 border-b border-surface-variant flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-3xl">menu_book</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-on-surface font-headline">{group.materia.descrizione}</h2>
                    <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">{group.materia.codice}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ore Totali</p>
                  <p className="text-3xl font-black text-primary font-headline">
                    {group.entries.reduce((s: number, e: any) => s + (e.ore_totali || 0), 0)}h
                  </p>
                </div>
              </div>

              {/* Competencies list */}
              <div className="p-10 grid grid-cols-1 gap-5">
                {group.entries.map((entry: any) => (
                  <div key={entry.competenza_id} className="group bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-transparent hover:border-primary/20 rounded-[2rem] p-8 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-black uppercase tracking-tight">
                            {entry.competenza.codice}
                          </span>
                          {entry.competenza.asse && (
                            <span className="text-slate-400 font-medium tracking-widest text-[10px] uppercase italic">
                              {entry.competenza.asse}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-on-surface leading-snug">{entry.competenza.descrizione}</p>
                      </div>

                      {/* Hours breakdown */}
                      <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-surface-variant group-hover:border-primary/10 transition-colors shrink-0">
                        <div className="text-center min-w-[56px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Totali</p>
                          <p className="font-black text-primary">{entry.ore_totali}h</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="text-center min-w-[56px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Presenza</p>
                          <p className="font-bold text-on-surface">{entry.ore_presenza}h</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="text-center min-w-[56px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Distanza</p>
                          <p className="font-bold text-on-surface">{entry.ore_distanza}h</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="text-center min-w-[56px]">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Orient.</p>
                          <p className="font-bold text-secondary">{entry.ore_orientamento}h</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      ) : selectedClasse ? (
        <div className="bg-slate-50 p-24 text-center rounded-[3rem] border-4 border-dashed border-slate-200">
          <span className="material-symbols-outlined text-7xl text-slate-200 mb-6">layers_clear</span>
          <p className="text-slate-500 font-black text-2xl font-headline italic">Nessun curricolo trovato per questa classe.</p>
          <p className="text-slate-400 mt-4 max-w-md mx-auto leading-relaxed">
            Verifica che siano state create le <b>assegnazioni cattedre</b> e che le materie abbiano un curricolo caricato.<br/>
            Puoi importarlo tramite il pulsante <b>"Importa da File"</b> in alto.
          </p>
        </div>

      ) : (
        <div className="bg-primary/5 p-24 text-center rounded-[3rem] border-4 border-dashed border-primary/10">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-4xl text-primary">filter_list</span>
          </div>
          <h3 className="text-3xl font-black text-on-surface font-headline mb-4">Esplora il Curricolo</h3>
          <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
            Seleziona un <b>indirizzo</b> e una <b>classe</b> per visualizzare il curricolo completo con competenze e carichi orari{!isDocente && ' — oppure carica un nuovo file'}.
          </p>
        </div>
      )}

      <ImportCurriculoModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          if (selectedClasse) fetchCurriculo(selectedClasse);
        }}
      />
    </div>
  );
}
