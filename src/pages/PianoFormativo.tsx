import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase_api';
import type { CurriculoEntry, Indirizzo, Classe, Materia } from '../types';

export default function CurricoloIndirizzo() {
  const [indirizzi, setIndirizzi] = useState<Indirizzo[]>([]);
  const [classi, setClassi] = useState<Classe[]>([]);
  const [selectedIndirizzo, setSelectedIndirizzo] = useState<string>('');
  const [selectedClasse, setSelectedClasse] = useState<string>('');
  
  const [curriculoCompleto, setCurriculoCompleto] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carica Indirizzi all'avvio
  useEffect(() => {
    supabase.from('indirizzi').select('*').order('nome').then(({ data }) => setIndirizzi(data || []));
  }, []);

  // Carica Classi quando cambia l'indirizzo
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

  // Carica il Curricolo quando cambia la classe
  const fetchCurriculo = async () => {
    if (!selectedClasse) return;
    setLoading(true);
    try {
      // 1. Trova le materie assegnate a questa classe
      const { data: assignments, error: assignError } = await supabase
        .from('assegnazioni_cattedre')
        .select('materia:materie(*)')
        .eq('classe_id', selectedClasse);

      if (assignError) throw assignError;

      const materiaIds = [...new Set(assignments.map(a => a.materia.id))];

      if (materiaIds.length === 0) {
        setCurriculoCompleto([]);
        return;
      }

      // 2. Recupera tutto il curriculo per queste materie
      const { data: curriculoData, error: currError } = await supabase
        .from('curricolo')
        .select(`
          *,
          materia:materie(*),
          competenza:competenze(*)
        `)
        .in('materia_id', materiaIds);

      if (currError) throw currError;

      // Raggruppa per materia per la visualizzazione
      const grouped = (curriculoData || []).reduce((acc: any, entry: any) => {
        const mId = entry.materia_id;
        if (!acc[mId]) {
          acc[mId] = {
            materia: entry.materia,
            entries: []
          };
        }
        acc[mId].entries.push(entry);
        return acc;
      }, {});

      setCurriculoCompleto(Object.values(grouped));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculo();
  }, [selectedClasse]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-surface-variant pb-6">
        <h1 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight">Curricolo Indirizzo</h1>
        <p className="text-slate-500 mt-2 text-lg">Visualizza il framework delle competenze e il monte ore per indirizzo e classe</p>
      </div>

      {/* Filtri */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">1. Seleziona Indirizzo</label>
          <select 
            value={selectedIndirizzo} 
            onChange={e => setSelectedIndirizzo(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-surface-variant rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-lg appearance-none cursor-pointer"
          >
            <option value="">-- Scegli Indirizzo --</option>
            {indirizzi.map(i => (
              <option key={i.id} value={i.id}>{i.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">2. Seleziona Classe</label>
          <select 
            disabled={!selectedIndirizzo}
            value={selectedClasse} 
            onChange={e => setSelectedClasse(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-surface-variant rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-lg appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">-- Scegli Classe --</option>
            {classi.map(c => (
              <option key={c.id} value={c.id}>{c.anno_corso}{c.sezione} - {c.periodo}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-primary">
          <span className="material-symbols-outlined animate-spin text-5xl mb-4">progress_activity</span>
          <p className="font-black uppercase tracking-widest text-sm">Caricamento piano studi...</p>
        </div>
      ) : curriculoCompleto.length > 0 ? (
        <div className="space-y-12">
          {curriculoCompleto.map((group: any) => (
            <div key={group.materia.id} className="bg-white rounded-[3rem] border border-surface-variant shadow-sm overflow-hidden">
              {/* Header Materia */}
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ore Totali Materia</p>
                  <p className="text-3xl font-black text-primary font-headline">
                    {group.entries.reduce((sum: number, e: any) => sum + (e.ore_totali || 0), 0)}h
                  </p>
                </div>
              </div>

              {/* Lista Competenze */}
              <div className="p-10">
                <div className="grid grid-cols-1 gap-6">
                  {group.entries.map((entry: any) => (
                    <div key={entry.competenza_id} className="group bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 border border-transparent hover:border-primary/20 rounded-[2rem] p-8 transition-all duration-300">
                      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-black tracking-tighter uppercase">
                              {entry.competenza.codice}
                            </span>
                            <span className="text-slate-300 font-medium tracking-widest text-[10px] uppercase italic">
                              {entry.competenza.asse || 'Area Generale'}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-on-surface leading-snug">
                            {entry.competenza.descrizione}
                          </p>
                        </div>

                        {/* Hourly Breakdown Chips */}
                        <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-surface-variant group-hover:border-primary/10 transition-colors">
                          <div className="text-center min-w-[60px]">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Presenza</p>
                            <p className="font-bold text-on-surface">{entry.ore_presenza}h</p>
                          </div>
                          <div className="w-px h-8 bg-slate-100"></div>
                          <div className="text-center min-w-[60px]">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Distanza</p>
                            <p className="font-bold text-on-surface">{entry.ore_distanza}h</p>
                          </div>
                          <div className="w-px h-8 bg-slate-100"></div>
                          <div className="text-center min-w-[60px]">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Orient.</p>
                            <p className="font-bold text-secondary">{entry.ore_orientamento}h</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : selectedClasse ? (
        <div className="bg-slate-50 p-24 text-center rounded-[3rem] border-4 border-dashed border-slate-200">
           <span className="material-symbols-outlined text-7xl text-slate-200 mb-6">layers_clear</span>
           <p className="text-slate-500 font-black text-2xl font-headline italic">Nessun curricolo trovato per questa classe.</p>
           <p className="text-slate-400 mt-4 max-w-md mx-auto">Verifica che siano state create le <b>assegnazioni cattedre</b> e che le materie associate abbiano un profilo di competenze caricato.</p>
        </div>
      ) : (
        <div className="bg-primary/5 p-24 text-center rounded-[3rem] border-4 border-dashed border-primary/10">
           <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
             <span className="material-symbols-outlined text-4xl text-primary">filter_list</span>
           </div>
           <h3 className="text-3xl font-black text-on-surface font-headline mb-4">Esplora il Framework</h3>
           <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
             Seleziona un <b>indirizzo</b> di studio e una <b>classe</b> per visualizzare il piano formativo completo, inclusi carichi orari e competenze ministeriali.
           </p>
        </div>
      )}
    </div>
  );
}
