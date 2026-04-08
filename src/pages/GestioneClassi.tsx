import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Classe, Docente, Materia, AssegnazioneCattedra, Indirizzo, AnnoScolastico, Studente } from '../types'
import { Modal } from '../components/Modal'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  Users, 
  ChevronRight,
  GraduationCap,
  School,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ClassView extends Classe {
  indirizzo: { nome: string };
  anno_scolastico: { anno: string };
}

interface AssignmentView extends AssegnazioneCattedra {
  materia: Materia;
  docente: Docente;
}

export default function GestioneClassi({ session }: { session: any }) {
  const role = (session?.user?.user_metadata?.role || 'studente').toLowerCase()
  const isDocente = role === 'docente'
  const [classes, setClasses] = useState<ClassView[]>([])
  const [indirizzi, setIndirizzi] = useState<Indirizzo[]>([])
  const [anniScolastici, setAnniScolastici] = useState<AnnoScolastico[]>([])
  const [assignments, setAssignments] = useState<Record<string, AssignmentView[]>>({})
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [allTeachers, setAllTeachers] = useState<any[]>([])
  const [allSubjects, setAllSubjects] = useState<any[]>([])
  const [classCompetenze, setClassCompetenze] = useState<any[]>([])
  const [studentPFI, setStudentPFI] = useState<Record<string, any>>({})
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [isPFIModalOpen, setIsPFIModalOpen] = useState(false)
  
  const [editingClass, setEditingClass] = useState<Partial<Classe> | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [editingStudent, setEditingStudent] = useState<Partial<Studente> | null>(null)
  
  const [newStudentId, setNewStudentId] = useState('')
  const [newAssignment, setNewAssignment] = useState({ docente_id: '', materia_id: '' })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch classes
    const { data: classData, error: errC } = await supabase
      .from('classi')
      .select(`
        *,
        indirizzo:indirizzi(nome),
        anno_scolastico:anni_scolastici(anno)
      `)
      .order('anno_corso', { ascending: true })

    if (!errC && classData) setClasses(classData as any[])
    
    // Fetch metadata for forms
    const { data: indData } = await supabase.from('indirizzi').select('*')
    const { data: annData } = await supabase.from('anni_scolastici').select('*')
    
    if (indData) setIndirizzi(indData)
    if (annData) setAnniScolastici(annData)

    // Fetch all students (master)
    const { data: allSt } = await supabase.from('studenti').select('*').order('cognome')
    if (allSt) setAllStudents(allSt)

    // Fetch all docenti (master)
    const { data: allDoc } = await supabase.from('docenti').select('*').order('cognome')
    if (allDoc) setAllTeachers(allDoc)

    // Fetch all materie (master)
    const { data: allMat } = await supabase.from('materie').select('*').order('descrizione')
    if (allMat) setAllSubjects(allMat)

    // Fetch student counts per class
    const { data: countData } = await supabase.from('studenti_classi').select('classe_id')
    const counts: Record<string, number> = {}
    if (countData) {
      countData.forEach(cd => {
        counts[cd.classe_id] = (counts[cd.classe_id] || 0) + 1
      })
    }
    setStudentCounts(counts)

    // Fetch assignments
    const { data: assignData, error: errA } = await supabase
      .from('assegnazioni_cattedre')
      .select(`
        *,
        materia:materie(*),
        docente:docenti(*)
      `)
    
    const grouped: Record<string, AssignmentView[]> = {}
    if (!errA && assignData) {
      assignData.forEach((a: any) => {
        if (!grouped[a.classe_id]) grouped[a.classe_id] = []
        grouped[a.classe_id].push(a)
      })
    }
    setAssignments(grouped)
    setLoading(false)
  }

  const handleManageStudents = async (classId: string) => {
    setSelectedClassId(classId)
    setIsStudentModalOpen(true)
    setLoading(true)
    const { data } = await supabase
      .from('studenti_classi')
      .select('studenti(*)')
      .eq('classe_id', classId)
    
    if (data) {
      const sorted = data.map((d: any) => d.studenti).sort((a: any, b: any) => 
        (a.cognome || '').localeCompare(b.cognome || '')
      );
      setEnrolledStudents(sorted);
    }
    setLoading(false)
  }

  const handleManageAssignments = (classId: string) => {
    setSelectedClassId(classId)
    setIsAssignmentModalOpen(true)
    setNewAssignment({ docente_id: allTeachers[0]?.id || '', materia_id: allSubjects[0]?.id || '' })
  }

  const handleAddStudent = async () => {
    if (!newStudentId || !selectedClassId) return
    const { error } = await supabase.from('studenti_classi').insert({
      studente_id: newStudentId,
      classe_id: selectedClassId
    })
    if (error) alert(error.message)
    else {
      handleManageStudents(selectedClassId)
      fetchData()
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClassId) return
    const reallyRemove = confirm('Rimuovere lo studente da questa classe?')
    if (!reallyRemove) return

    const { error: errRem } = await supabase.from('studenti_classi').delete().match({
      studente_id: studentId,
      classe_id: selectedClassId
    })
    
    if (errRem) {
      alert(errRem.message)
      return
    }

    // Ask if delete from system too
    const deleteGlobal = confirm('Vuoi anche eliminare definitivamente lo studente dall\'anagrafe globale?')
    if (deleteGlobal) {
      const { error: errGlob } = await supabase.from('studenti').delete().eq('id', studentId)
      if (errGlob) alert("Errore durante l'eliminazione globale: " + errGlob.message)
    }

    handleManageStudents(selectedClassId)
    fetchData()
  }

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent || !selectedClassId) return
    setIsStudentSubmitting(true)

    try {
      // 1. Upsert student details
      const { data: stData, error: stErr } = await supabase
        .from('studenti')
        .upsert({
          id: editingStudent.id,
          nome: editingStudent.nome,
          cognome: editingStudent.cognome,
          matricola: editingStudent.matricola || `MAT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        })
        .select()
        .single()

      if (stErr) throw stErr

      // 2. If new student, link to current class
      if (!editingStudent.id) {
        const { error: linkErr } = await supabase.from('studenti_classi').insert({
          studente_id: stData.id,
          classe_id: selectedClassId
        })
        if (linkErr) throw linkErr
      }

      setEditingStudent(null)
      handleManageStudents(selectedClassId)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsStudentSubmitting(false)
    }
  }

  const handleAddAssignment = async () => {
    if (!newAssignment.docente_id || !newAssignment.materia_id || !selectedClassId) return
    const { error } = await supabase.from('assegnazioni_cattedre').insert({
      ...newAssignment,
      classe_id: selectedClassId
    })
    if (error) alert(error.message)
    else fetchData()
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Rimuovere questa cattedra?')) return
    const { error } = await supabase.from('assegnazioni_cattedre').delete().eq('id', assignmentId)
    if (error) alert(error.message)
    else fetchData()
  }

  const handleManagePFI = async (student: any) => {
    if (!selectedClassId) return
    setSelectedStudent(student)
    setIsPFIModalOpen(true)
    setLoading(true)

    try {
      // 1. Fetch competencies for all subjects in this class
      const classSubjects = assignments[selectedClassId]?.map(a => a.materia_id) || []
      const { data: compData } = await supabase
        .from('curricolo')
        .select(`
          materia_id,
          competenza:competenze(*)
        `)
        .in('materia_id', classSubjects)
      
      const uniqueComps = Array.from(new Map((compData as any[])?.map(d => [d.competenza.id || (d.competenza as any)[0]?.id, d.competenza])).values())
      setClassCompetenze(uniqueComps)

      // 2. Fetch current PFI for this student and class
      const { data: pfiData } = await supabase
        .from('pfi')
        .select('*')
        .match({ studente_id: student.id, classe_id: selectedClassId })
      
      const pfiMap: Record<string, any> = {}
      pfiData?.forEach(p => { pfiMap[p.competenza_id] = p })
      setStudentPFI(pfiMap)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePFIEntry = (compId: string, field: string, value: any) => {
    setStudentPFI(prev => ({
      ...prev,
      [compId]: {
        ...(prev[compId] || { 
          studente_id: selectedStudent.id, 
          classe_id: selectedClassId, 
          competenza_id: compId,
          ore_previste: 0,
          crediti_riconosciuti: false
        }),
        [field]: value
      }
    }))
  }

  const handleSavePFI = async () => {
    setIsSubmitting(true)
    const entries = Object.values(studentPFI)
    const { error } = await supabase.from('pfi').upsert(entries)
    if (error) alert(error.message)
    else setIsPFIModalOpen(false)
    setIsSubmitting(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleOpenAdd = () => {
    setEditingClass({
      periodo: 'I periodo',
      indirizzo_id: (indirizzi as any)?.[0]?.id,
      anno_scolastico_id: anniScolastici.find(a => a.is_corrente)?.id || (anniScolastici as any)?.[0]?.id
    })
    setError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (c: ClassView) => {
    setEditingClass({ ...c })
    setError(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa classe?')) return
    
    const { error } = await supabase.from('classi').delete().eq('id', id)
    if (error) {
      alert('Errore durante l\'eliminazione: ' + error.message)
    } else {
      fetchData()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClass) return
    
    setIsSubmitting(true)
    setError(null)

    const periodMap: Record<string, string> = {
      'I periodo': '1',
      'II periodo': '2',
      'III periodo': '3'
    }

    const payload = {
      anno_corso: periodMap[editingClass.periodo || 'I periodo'] || '1',
      sezione: editingClass.sezione,
      periodo: editingClass.periodo,
      indirizzo_id: editingClass.indirizzo_id,
      anno_scolastico_id: editingClass.anno_scolastico_id
    }

    let res;
    if (editingClass.id) {
      res = await supabase.from('classi').update(payload).eq('id', editingClass.id)
    } else {
      res = await supabase.from('classi').insert([payload])
    }

    if (res.error) {
      setError(res.error.message)
      setIsSubmitting(false)
    } else {
      setIsModalOpen(false)
      fetchData()
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 border border-primary/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-lg shadow-primary/20">
              <School size={14} className="fill-current" />
              Gestione Classi
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-on-surface font-headline tracking-tight leading-none">
              Assetto <span className="text-primary italic">Classi</span>
            </h1>
            <p className="text-slate-500 text-xl max-w-xl font-medium leading-relaxed">
              Organizzazione degli elenchi, cattedre e percorsi formativi individualizzati.
            </p>
          </div>
          
          {!isDocente && (
            <button 
              onClick={handleOpenAdd}
              className="group relative flex items-center gap-3 bg-on-surface text-white px-8 py-5 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-on-surface/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-container opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
              <Plus size={24} className="relative z-10" />
              <span className="relative z-10 text-lg">Nuova Classe</span>
            </button>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 anim-float"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl opacity-50 anim-float-delayed"></div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-32 space-y-6">
          <div className="relative">
            <Loader2 size={64} className="text-primary animate-spin" />
            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse"></div>
          </div>
          <p className="text-slate-400 font-bold animate-pulse tracking-widest uppercase text-sm">Caricamento struttura...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {classes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 bg-white/50 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-surface-variant flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center text-slate-400">
                <Users size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-on-surface">Nessuna classe configurata</h3>
                <p className="text-slate-500">Inizia creando la prima classe per questo anno scolastico.</p>
              </div>
              <button 
                onClick={handleOpenAdd}
                className="mt-4 text-primary font-bold hover:underline flex items-center gap-2"
              >
                Configura ora <ChevronRight size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-8"
            >
              {classes.map((c, idx) => (
                <motion.div 
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[2.5rem] border border-surface-variant shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden flex flex-col"
                >
                  <div className="p-10 space-y-8 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                            {c.indirizzo?.nome}
                          </span>
                          <span className="px-4 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {c.anno_scolastico?.anno}
                          </span>
                        </div>
                        <h3 className="text-6xl font-black font-headline text-on-surface tracking-tighter leading-none">
                          {c.periodo?.split(' ')[0]}<span className="text-primary italic">{c.sezione}</span>
                        </h3>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isDocente && (
                          <>
                            <button 
                              onClick={() => handleOpenEdit(c)}
                              className="p-3 bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button 
                              onClick={() => handleDelete(c.id)}
                              className="p-3 bg-slate-50 text-slate-400 hover:bg-error/10 hover:text-error rounded-2xl transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between text-sm">
                        <h4 className="flex items-center gap-2 font-bold text-slate-400 uppercase tracking-widest">
                          <BookOpen size={16} /> Cattedre Assegnate
                        </h4>
                        <span className="text-primary font-black">{(assignments[c.id] || []).length} Materie</span>
                      </div>
                      
                      <div className="grid gap-3">
                        {(assignments[c.id] || []).length === 0 ? (
                          <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 italic font-medium">
                            Nessuna materia assegnata
                          </div>
                        ) : (
                          assignments[c.id].map(a => (
                            <div key={a.id} className="flex items-center justify-between p-4 bg-white border border-surface-variant rounded-2xl group/item hover:border-primary/30 transition-colors shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                  <GraduationCap size={20} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-on-surface line-clamp-1">{(a.materia as any)?.descrizione || (a.materia as any)?.nome}</h4>

                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{a.materia?.codice}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-600">{a.docente?.cognome} {a.docente?.nome[0]}.</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  
                    <div className="px-10 py-6 bg-slate-50/50 border-t border-surface-variant flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs mt-1">
                          <Users size={14} />
                          {studentCounts[c.id] || 0} Studenti
                        </div>
                      </div>
                     <div className="flex gap-4">
                        <button 
                          onClick={() => handleManageStudents(c.id)}
                          className="flex items-center gap-1 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-primary transition-all"
                        >
                          {isDocente ? 'Elenco Studenti' : 'Studenti'} <Plus size={14} />
                        </button>
                        {!isDocente && (
                          <button 
                            onClick={() => handleManageAssignments(c.id)}
                            className="flex items-center gap-1 text-primary font-black text-xs uppercase tracking-widest hover:gap-2 transition-all"
                          >
                            Cattedre <Plus size={14} />
                          </button>
                        )}
                     </div>
                    </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingClass?.id ? 'Modifica Classe' : 'Nuova Classe'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-error/10 text-error rounded-2xl flex items-center gap-3 text-sm font-bold animate-shake">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Periodo Didattico</label>
              <select 
                value={editingClass?.periodo}
                onChange={e => setEditingClass(prev => ({ ...prev, periodo: e.target.value }))}
                className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              >
                <option value="I periodo">I periodo</option>
                <option value="II periodo">II periodo</option>
                <option value="III periodo">III periodo</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sezione</label>
              <input 
                type="text"
                maxLength={1}
                value={editingClass?.sezione}
                onChange={e => setEditingClass(prev => ({ ...prev, sezione: e.target.value.toUpperCase() }))}
                className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                placeholder="es. A"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Indirizzo di Studio</label>
            <select 
              value={editingClass?.indirizzo_id}
              onChange={e => setEditingClass(prev => ({ ...prev, indirizzo_id: e.target.value }))}
              className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            >
              {indirizzi.map(i => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Anno Scolastico</label>
            <select 
              value={editingClass?.anno_scolastico_id}
              onChange={e => setEditingClass(prev => ({ ...prev, anno_scolastico_id: e.target.value }))}
              className="w-full bg-slate-50 border border-surface-variant rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
            >
              {anniScolastici.map(a => (
                <option key={a.id} value={a.id}>{a.anno}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
            {editingClass?.id ? 'Salva Modifiche' : 'Crea Classe'}
          </button>
        </form>
      </Modal>

      {/* Manage Students Modal */}
      <Modal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)}
        title="Elenco Studenti"
      >
        <div className="space-y-6">
          {editingStudent && !isDocente ? (
            <div className="bg-slate-50 p-6 rounded-3xl border border-primary/20 space-y-4 animate-in slide-in-from-top duration-300">
               <h4 className="text-sm font-black text-primary uppercase tracking-widest pl-1">
                 {editingStudent.id ? 'Modifica Profilo' : 'Nuovo Studente'}
               </h4>
               <form onSubmit={handleSaveStudent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome</label>
                      <input 
                        required
                        value={editingStudent.nome}
                        onChange={e => setEditingStudent((prev: any) => ({ ...prev!, nome: e.target.value }))}
                        className="w-full bg-white border border-surface-variant rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="es. Mario"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cognome</label>
                      <input 
                        required
                        value={editingStudent.cognome}
                        onChange={e => setEditingStudent((prev: any) => ({ ...prev!, cognome: e.target.value }))}
                        className="w-full bg-white border border-surface-variant rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="es. Rossi"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Matricola (opzionale)</label>
                    <input 
                      value={editingStudent.matricola || ''}
                      onChange={e => setEditingStudent((prev: any) => ({ ...prev!, matricola: e.target.value }))}
                      className="w-full bg-white border border-surface-variant rounded-xl px-4 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Autogenerata se vuoto"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 py-3 bg-slate-200 text-slate-500 rounded-xl font-bold text-sm">Annulla</button>
                    <button type="submit" disabled={isStudentSubmitting} className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-primary/20">
                      {isStudentSubmitting ? 'Salvataggio...' : 'Salva Profilo'}
                    </button>
                  </div>
               </form>
            </div>
          ) : !isDocente && (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <select 
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  className="w-full bg-white border border-surface-variant rounded-xl px-4 py-3.5 font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Iscrivi studente esistente...</option>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.cognome} {s.nome} ({s.matricola})</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Users size={18} />
                </div>
              </div>
              <button 
                onClick={handleAddStudent}
                className="px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shrink-0"
              >
                Iscrivi
              </button>
              <button 
                onClick={() => setEditingStudent({ nome: '', cognome: '' })}
                className="p-3 bg-primary text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                title="Nuovo Studente"
              >
                <Plus size={24} />
              </button>
            </div>
          )}
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {enrolledStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-100 rounded-[2rem]">
                 <Users size={40} className="mx-auto mb-4 opacity-10" />
                 Nessuno studente iscritto
              </div>
            ) : (
              enrolledStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white border border-surface-variant rounded-2xl shadow-sm hover:border-primary/30 transition-all group/st">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">
                      {s.cognome[0]}{s.nome[0]}
                    </div>
                    <div>
                      <div className="font-bold text-on-surface leading-tight">{s.cognome} {s.nome}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.matricola}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleManagePFI(s)}
                      className="px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-white transition-all mr-2"
                    >
                      PFI
                    </button>
                    {!isDocente && (
                      <>
                        <button 
                          onClick={() => setEditingStudent({ ...s })}
                          className="p-2 text-slate-300 hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleRemoveStudent(s.id)}
                          className="p-2 text-slate-300 hover:text-error transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {!isDocente && (
            <button 
              onClick={handleSavePFI}
              disabled={isSubmitting}
              className="w-full bg-on-surface text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva Percorso Formativo'}
            </button>
          )}
        </div>
      </Modal>

      {/* PFI Management Modal */}
      <Modal 
        isOpen={isPFIModalOpen} 
        onClose={() => setIsPFIModalOpen(false)}
        title={`Percorso Formativo: ${selectedStudent?.cognome} ${selectedStudent?.nome}`}
      >
        <div className="space-y-6">
          <p className="text-xs text-slate-500 font-medium">Personalizza il monte ore e riconosci i crediti per le competenze dello studente.</p>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {classCompetenze.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic">Nessuna competenza trovata. Verifica l'assegnazione delle cattedre.</div>
            ) : (
              classCompetenze.map(c => {
                const entry = studentPFI[c.id] || { ore_previste: 0, crediti_riconosciuti: false };
                return (
                  <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-surface-variant space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{c.codice}</span>
                        <p className="text-sm font-bold text-on-surface leading-tight">{c.descrizione.substring(0, 80)}...</p>
                      </div>
                      <label className="flex flex-col items-center gap-1 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={entry.crediti_riconosciuti}
                          onChange={e => handleUpdatePFIEntry(c.id, 'crediti_riconosciuti', e.target.checked)}
                        />
                        <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${entry.crediti_riconosciuti ? 'bg-primary' : 'bg-slate-300'} group-hover:opacity-80`}>
                           <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${entry.crediti_riconosciuti ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-[8px] font-black uppercase text-slate-400">Credito</span>
                      </label>
                    </div>

                    {!entry.crediti_riconosciuti && (
                      <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                        <div className="flex-1 space-y-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ore Previste Personalizzate</label>
                           <input 
                             type="number" 
                             value={entry.ore_previste}
                             onChange={e => handleUpdatePFIEntry(c.id, 'ore_previste', Number(e.target.value))}
                             className="w-full bg-white border border-surface-variant rounded-xl px-3 py-2 font-bold text-sm"
                           />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <button onClick={() => setIsPFIModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Chiudi</button>
            <button 
              onClick={handleSavePFI}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20"
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva PFI'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Assignments Modal */}
      <Modal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Gestione Cattedre Classe"
      >
        <div className="space-y-6">
          <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-surface-variant">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</label>
              <select 
                value={newAssignment.docente_id}
                onChange={e => setNewAssignment(prev => ({ ...prev, docente_id: e.target.value }))}
                className="w-full bg-white border border-surface-variant rounded-xl px-4 py-3 font-bold"
              >
                {allTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.cognome} {t.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materia</label>
              <select 
                value={newAssignment.materia_id}
                onChange={e => setNewAssignment(prev => ({ ...prev, materia_id: e.target.value }))}
                className="w-full bg-white border border-surface-variant rounded-xl px-4 py-3 font-bold"
              >
                {allSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.descrizione}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleAddAssignment}
              className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest"
            >
              Assegna Cattedra
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cattedre</h4>
            <div className="grid gap-2">
              {(assignments[selectedClassId || ''] || []).map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 bg-white border border-surface-variant rounded-xl shadow-sm">
                  <div>
                    <div className="font-bold text-on-surface">{a.materia?.descrizione}</div>
                    <div className="text-[10px] font-medium text-slate-500">{a.docente?.cognome} {a.docente?.nome}</div>
                  </div>
                  <button 
                    onClick={() => handleRemoveAssignment(a.id)}
                    className="p-2 text-slate-300 hover:text-error transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes shadow-pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 44, 152, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(0, 44, 152, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 44, 152, 0); }
        }
        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-float-delayed { animation: float 8s ease-in-out infinite 1s; }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  )
}
