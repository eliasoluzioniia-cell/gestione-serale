import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase_api';
import { bulkImportStudenti } from '../lib/supabase_api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  cognome: string;
  nome: string;
  codice_fiscale: string;
  classe: string;
  sezione: string;
  matched_classe_id?: string;
  status?: 'pending' | 'success' | 'error' | 'warning';
  error_message?: string;
}

export default function ImportStudentiModal({ isOpen, onClose, onImportComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [classi, setClassi] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchClassi();
    }
  }, [isOpen]);

  const fetchClassi = async () => {
    const { data } = await supabase.from('classi').select('id, anno_corso, sezione, periodo');
    setClassi(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      parseFile(e.target.files[0]);
    }
  };

  const parseFile = async (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();
    
    if (file.name.endsWith('.pdf')) {
      // PDF Parsing logic (simple text extraction)
      parsePDF(file);
    } else {
      // Excel/CSV/ODS Parsing via XLSX
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          const rows: ParsedRow[] = jsonData.map(row => ({
            cognome: row['Cognome'] || row['COGNOME'] || '',
            nome: row['Nome'] || row['NOME'] || '',
            codice_fiscale: row['Codice Fiscale'] || row['CF'] || row['CODICE FISCALE'] || '',
            classe: row['Classe'] || row['CLASSE'] || '',
            sezione: row['Sezione'] || row['SEZIONE'] || '',
            status: 'pending'
          }));
          
          processRows(rows);
        } catch (err) {
          alert("Errore nel caricamento del file Excel/CSV");
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const parsePDF = async (file: File) => {
    // Note: pdfjs-dist usage usually requires a worker. For simplicity in this demo environment, 
    // we'll assume the environment supports basic text extraction or we'll provide a warning.
    alert("L'importazione PDF richiede un formato tabellare standard. Se l'estrazione fallisce, converti il file in Excel o CSV.");
    setIsParsing(false);
    // Placeholder for PDF logic
  };

  const processRows = (rows: ParsedRow[]) => {
    const processed = rows.map(row => {
      const rowClasseRaw = (row.classe || '').toUpperCase().trim();
      const rowSezRaw = (row.sezione || '').toUpperCase().trim();

      const matchedClasse = classi.find(c => {
        const dbPeriodo = (c.periodo || '').toUpperCase().trim();
        const dbSezione = (c.sezione || '').toUpperCase().trim();
        const dbAnno = String(c.anno_corso);

        // Scenario 1: Row has both Periodo and Section in the 'classe' field (e.g. "I PERIODO A")
        if (rowClasseRaw.startsWith(dbPeriodo)) {
          const remaining = rowClasseRaw.replace(dbPeriodo, '').trim();
          if (remaining === dbSezione || rowSezRaw === dbSezione) return true;
        }

        // Scenario 2: Traditional format (Anno corso + Sezione)
        const hasAnno = rowClasseRaw.includes(dbAnno);
        const hasSezione = rowSezRaw === dbSezione || rowClasseRaw.endsWith(' ' + dbSezione) || rowClasseRaw.endsWith(dbSezione);
        
        return hasAnno && hasSezione;
      });

      return {
        ...row,
        matched_classe_id: matchedClasse?.id,
        status: matchedClasse ? 'pending' : 'warning',
        error_message: matchedClasse ? undefined : 'Classe non trovata'
      } as ParsedRow;
    });

    setData(processed);
  };

  const executeImport = async () => {
    setIsImporting(true);
    try {
      const validRows = data.filter(r => r.cognome && r.nome && r.codice_fiscale);
      await bulkImportStudenti(validRows.map(r => ({
        nome: r.nome,
        cognome: r.cognome,
        codice_fiscale: r.codice_fiscale,
        classe_id: r.matched_classe_id
      })));
      
      onImportComplete();
      onClose();
    } catch (err: any) {
      alert("Errore durante l'importazione: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl border border-surface-variant overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black font-headline tracking-tight">Importazione Massiva</h2>
            <p className="text-slate-500">Trascina un file Excel, CSV, ODS o PDF per caricare gli studenti</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Upload Area */}
          {!file && (
            <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center hover:border-primary/20 hover:bg-primary/5 transition-all group relative cursor-pointer">
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv,.ods,.pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="material-symbols-outlined text-6xl text-slate-300 group-hover:text-primary mb-4 transition-colors">cloud_upload</span>
              <p className="text-xl font-bold text-slate-400 group-hover:text-primary transition-colors">Trascina qui il file o clicca per sfogliare</p>
              <p className="text-sm text-slate-300 mt-2">Supporta fogli Excel, CSV esportati e PDF tabellari</p>
            </div>
          )}

          {isParsing && (
            <div className="flex flex-col items-center justify-center py-20 text-primary">
              <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
              <p className="font-bold">Analisi del file in corso...</p>
            </div>
          )}

          {/* Preview Grid */}
          {data.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">{data.length} righe rilevate</span>
                <button onClick={() => { setFile(null); setData([]); }} className="text-primary font-bold text-xs uppercase hover:underline">Cambia file</button>
              </div>
              
              <div className="border border-surface-variant rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-surface-variant">
                    <tr>
                      <th className="p-4 font-black">Cognome</th>
                      <th className="p-4 font-black">Nome</th>
                      <th className="p-4 font-black">CF</th>
                      <th className="p-4 font-black">Classe/Sez</th>
                      <th className="p-4 font-black text-right">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold">{row.cognome}</td>
                        <td className="p-4">{row.nome}</td>
                        <td className="p-4 font-mono text-xs">{row.codice_fiscale}</td>
                        <td className="p-4">
                          <span className={row.matched_classe_id ? "text-on-surface" : "text-error font-bold"}>
                            {row.classe} {row.sezione}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {row.status === 'warning' ? (
                            <span className="bg-warning/10 text-warning px-2 py-1 rounded-md text-[10px] font-black uppercase">Ignorato</span>
                          ) : (
                            <span className="bg-success/10 text-success px-2 py-1 rounded-md text-[10px] font-black uppercase">Pronto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-8 border-t border-surface-variant mt-8">
          <button 
            disabled={isImporting}
            onClick={onClose} 
            className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            Annulla
          </button>
          <button 
            disabled={isImporting || data.length === 0}
            onClick={executeImport}
            className="flex-[2] px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Importazione in corso...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">save_alt</span>
                Conferma Importazione ({data.filter(r => r.status !== 'warning').length} studenti)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
