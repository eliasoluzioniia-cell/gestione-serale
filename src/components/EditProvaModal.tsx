import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { updateProvaDiRealta, updateValutazioniBulk } from '../lib/supabase_api';

interface EditProvaModalProps {
  isOpen: boolean;
  onClose: () => void;
  prova: any;
  onSave: () => void;
}

export default function EditProvaModal({ isOpen, onClose, prova, onSave }: EditProvaModalProps) {
  const [descrizione, setDescrizione] = useState('');
  const [dataProva, setDataProva] = useState('');
  const [valutazioni, setValutazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prova) {
      setDescrizione(prova.descrizione || '');
      setDataProva(prova.data_prova || '');
      setValutazioni(prova.valutazioni || []);
    }
  }, [prova, isOpen]);

  const handleGradeChange = (valId: string, studenteId: string, field: string, value: any) => {
    setValutazioni(prev => prev.map(v => {
      if (v.id === valId || v.studente_id === studenteId) {
        return { ...v, [field]: value };
      }
      return v;
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // 1. Update Prova
      await updateProvaDiRealta(prova.id, { 
        descrizione, 
        data_prova: dataProva 
      });

      // 2. Update Valutazioni
      const payload = valutazioni.map(v => ({
        id: v.id, // Mandatory for upsert match
        prova_id: prova.id,
        studente_id: v.studente_id,
        voto_numerico: v.voto_numerico === '' ? null : Number(v.voto_numerico),
        livello: v.livello
      }));
      
      await updateValutazioniBulk(payload);
      
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  if (!prova) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifica Prova di Realtà">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Descrizione Prova</label>
            <input 
              type="text" 
              value={descrizione} 
              onChange={e => setDescrizione(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Data Esecuzione</label>
            <input 
              type="date" 
              value={dataProva} 
              onChange={e => setDataProva(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Studente</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-center">Voto</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-center">Livello</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {valutazioni.map((v) => (
                <tr key={v.id || v.studente_id}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">
                    {v.studente?.cognome} {v.studente?.nome}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="number" 
                      value={v.voto_numerico ?? ''} 
                      onChange={e => handleGradeChange(v.id, v.studente_id, 'voto_numerico', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select 
                      value={v.livello || ''} 
                      onChange={e => handleGradeChange(v.id, v.studente_id, 'livello', e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                    >
                      <option value="">-</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            Annulla
          </button>
          <button 
            disabled={loading}
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Conferma Modifiche'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
