import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase, bulkImportCurriculo } from '../lib/supabase_api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Disciplina short code (from ODS) → exactly match 'codice' in materie table
const DISCIPLINA_MAP: Record<string, string> = {
  'ITA': 'Italiano', 
  'STO': 'Storia',
  'ING': 'Inglese', 
  'FRA': 'Francese',
  'MAT': 'Matematica', 
  'SC.UM.': 'Scienze Umane',
  'TEC. AMM.': 'Tecnica Amm',
  'TEC.  AMM.': 'Tecnica Amm',
  'MET.OP.': 'Met Op',
  'MET.\nOP.': 'Met Op',
  'MET.\\nOP.': 'Met Op',
  'DIR.LEG.SOC': 'Diritto e leg',
  'DIR. LEG.SOC': 'Diritto e leg',
  'DIR.LEG.SOC.': 'Diritto e leg',
  'CHI': 'Chimica',
  'FIS': 'Fisica',
  'SCI': 'Scienze terra -bio',
  'MUS': 'Musica',
  'PSIC': 'Psicologia',
  'PSIC.': 'Psicologia',
  'ST.ART.': 'Arte',
  'ED. CIV.': 'ED. CIV.',
  'IRC': 'IRC',
  'AA': 'AA'
};

interface SheetData {
  name: string;
  rows: any[];
  classeId: string;
}

export default function ImportCurriculoModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [classi, setClassi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isOpen) {
      supabase.from('classi').select('id, anno_corso, sezione, periodo').order('anno_corso')
        .then(({ data }) => setClassi(data || []));
    }
  }, [isOpen]);

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: 'binary' });
      const parsed: SheetData[] = workbook.SheetNames.map(sheetName => {
        const ws = workbook.Sheets[sheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        let currentAsse = '';
        const rows: any[] = [];

        rawRows.forEach((row, idx) => {
          if (idx === 0) return; // skip header
          
          // Exact column mapping from verified ODS structure:
          // [0]Assi [1]Identificativo [2]COMPETENZE [3]Disciplina [4]TOT
          // [5]Orientamento [6]In presenza [7]A distanza [8]Crediti [9]Ore fruite [10]Verifica
          const asse        = row[0]?.toString().trim();
          const compCodice  = row[1]?.toString().trim();
          const compDesc    = row[2]?.toString().trim();
          const discCodice  = row[3]?.toString().trim().toUpperCase();
          const oreTotali   = Number(row[4]) || 0;
          const oreOrient   = Number(row[5]) || 0;
          const orePresenza = Number(row[6]) || 0;
          const oreDistanza = Number(row[7]) || 0;
          const verifica    = row[10]?.toString().trim() || '';

          if (asse) currentAsse = asse;
          if (!compCodice || !discCodice || !compDesc) return;

          rows.push({
            materia_nome: DISCIPLINA_MAP[discCodice] || discCodice,
            materia_codice: discCodice,
            comp_codice: compCodice,
            comp_desc: compDesc,
            comp_asse: currentAsse,
            ore_totali: oreTotali,
            ore_presenza: orePresenza,
            ore_distanza: oreDistanza,
            ore_orientamento: oreOrient,
            verifica,
          });
        });

        return { name: sheetName, rows, classeId: '' };
      });

      setSheets(parsed);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); parseFile(f); setError(null); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) { setFile(f); parseFile(f); setError(null); }
  };

  const updateSheetClasse = (sheetName: string, classeId: string) => {
    setSheets(prev => prev.map(s => s.name === sheetName ? { ...s, classeId } : s));
  };

  const totalVoci = sheets.reduce((s, sh) => s + sh.rows.length, 0);
  const allMapped = sheets.length > 0 && sheets.every(s => s.classeId !== '');

  const handleImport = async () => {
    if (!allMapped) { setError('Associa ogni foglio a una classe prima di procedere.'); return; }
    setLoading(true); setError(null);
    try {
      const allData = sheets.flatMap(sh =>
        sh.rows.map(r => ({ ...r, classe_id: sh.classeId }))
      );
      const result = await bulkImportCurriculo(allData);
      alert(`✅ Importazione completata: ${result.count} voci inserite.`);
      onSuccess(); onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'importazione.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setFile(null); setSheets([]); setError(null); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-900 font-headline">Importa Curricolo</h2>
            <p className="text-slate-500 mt-1">
              Carica <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-sm">curriculo.ods</code> — ogni foglio verrà associato a una classe
            </p>
          </div>
          <button onClick={handleClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8">

          {!file ? (
            <label
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-64 border-4 border-dashed rounded-[2.5rem] cursor-pointer transition-all ${isDragOver ? 'border-primary bg-primary/10' : 'border-slate-200 hover:bg-primary/5 hover:border-primary/30'}`}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDragOver ? 'bg-primary/20' : 'bg-slate-100'}`}>
                <span className={`material-symbols-outlined text-5xl ${isDragOver ? 'text-primary' : 'text-slate-400'}`}>upload_file</span>
              </div>
              <p className="text-lg font-bold text-slate-700">Trascina <code className="font-mono text-primary">curriculo.ods</code> o clicca per sfogliare</p>
              <p className="text-sm text-slate-400 uppercase font-black tracking-widest mt-2">ODS · XLSX · CSV</p>
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv,.ods" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="space-y-6">
              {/* File bar */}
              <div className="flex items-center justify-between bg-green-50 p-5 rounded-3xl border border-green-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-green-100">
                    <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-green-600 font-black uppercase tracking-widest">
                      {sheets.length} fogli · {totalVoci} competenze totali
                    </p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setSheets([]); }} className="text-slate-400 hover:text-primary text-sm font-bold transition-colors">Cambia</button>
              </div>

              {/* Sheet → Class mapping */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Associa ogni foglio alla classe corrispondente</h3>
                {sheets.map(sheet => (
                  <div key={sheet.name} className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary">table_view</span>
                        </div>
                        <div>
                          <p className="font-black text-slate-800 capitalize">{sheet.name}</p>
                          <p className="text-xs text-slate-400">{sheet.rows.length} competenze</p>
                          {/* Quick preview */}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {[...new Set(sheet.rows.slice(0, 6).map(r => r.materia_nome))].map((m: any) => (
                              <span key={m} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{m}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="relative md:w-64 shrink-0">
                        <select
                          value={sheet.classeId}
                          onChange={e => updateSheetClasse(sheet.name, e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl border font-bold text-sm appearance-none outline-none transition-all ${sheet.classeId ? 'bg-white border-primary/30 text-primary' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                          <option value="">-- Scegli Classe --</option>
                          {classi.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.anno_corso}{c.sezione} — {c.periodo}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">expand_more</span>
                      </div>
                    </div>

                    {/* Hour preview per sheet */}
                    {sheet.classeId && sheet.rows.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-4 gap-3">
                        {(['ore_totali', 'ore_presenza', 'ore_distanza', 'ore_orientamento'] as const).map(field => {
                          const labels: Record<string, string> = { ore_totali: 'Totali', ore_presenza: 'Presenza', ore_distanza: 'Distanza', ore_orientamento: 'Orient.' };
                          const total = sheet.rows.reduce((s, r) => s + (r[field] || 0), 0);
                          return (
                            <div key={field} className="bg-white rounded-2xl p-3 text-center border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase">{labels[field]}</p>
                              <p className="font-black text-primary text-lg">{total}h</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100">
              <span className="material-symbols-outlined">error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50/30 shrink-0">
          <button onClick={handleClose} className="flex-none px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Annulla</button>
          <button
            disabled={!file || !allMapped || loading}
            onClick={handleImport}
            className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin">progress_activity</span><span>Importazione in corso...</span></>
            ) : (
              <><span className="material-symbols-outlined">save</span><span>Conferma Importazione ({totalVoci} competenze)</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
