import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ClipboardEdit, Plus, X, Save, Search, Loader2 } from 'lucide-react';

const BIMESTERS = [{ v:'1', l:'1° Bimestre' },{ v:'2', l:'2° Bimestre' },{ v:'3', l:'3° Bimestre' },{ v:'4', l:'4° Bimestre' }];
const TYPES: any = { prova:'Prova', trabalho:'Trabalho', seminario:'Seminário', participacao:'Participação', recuperacao:'Recuperação' };

export default function GradeEntryPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [selBimester, setSelBimester] = useState('1');
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [assessForm, setAssessForm] = useState({ name: '', type: 'prova', maxScore: '10', date: '' });
  const [selAssessment, setSelAssessment] = useState('');
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: subjectsData } = useQuery(() => api.subjects.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: assessmentsData, refetch: refetchAssessments } = useQuery(() => selClass && selSubject ? api.assessments.list({ municipalityId: mid, classId: parseInt(selClass), subjectId: parseInt(selSubject), bimester: selBimester }) : Promise.resolve([]), [mid, selClass, selSubject, selBimester]);
  const { data: existingGrades, refetch: refetchGrades } = useQuery(() => selAssessment ? api.studentGrades.listByAssessment({ assessmentId: parseInt(selAssessment) }) : Promise.resolve([]), [selAssessment]);

  const allClasses = (classesData as any) || [];
  const allSubjects = (subjectsData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const allAssessments = (assessmentsData as any) || [];
  const allGrades = (existingGrades as any) || [];
  const { mutate: createAssessment } = useMutation(api.assessments.create);

  // Load existing grades into state
  const getGrade = (studentId: number) => {
    if (grades[studentId] !== undefined) return grades[studentId];
    const existing = allGrades.find((g: any) => g.studentId === studentId);
    return existing?.score !== null && existing?.score !== undefined ? String(parseFloat(existing.score)) : '';
  };

  const saveGrades = async () => {
    if (!selAssessment) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const gradeList = allEnrollments
        .filter((e: any) => {
          // Only include students who have a grade typed by the user OR already have an existing grade
          const hasUserInput = grades[e.studentId] !== undefined && grades[e.studentId] !== '';
          const hasExistingGrade = allGrades.some((g: any) => g.studentId === e.studentId && g.score !== null && g.score !== undefined);
          return hasUserInput || hasExistingGrade;
        })
        .map((e: any) => ({
          studentId: e.studentId,
          score: grades[e.studentId] !== undefined && grades[e.studentId] !== '' ? parseFloat(grades[e.studentId]) : parseFloat(allGrades.find((g: any) => g.studentId === e.studentId)?.score || '0'),
        }));
      await api.studentGrades.registerBatch({ assessmentId: parseInt(selAssessment), grades: gradeList });
      setSaveMsg('Notas salvas com sucesso!');
      refetchGrades();
      setGrades({});
    } catch (e: any) { setSaveMsg('Erro: ' + e.message); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
  };

  const createNewAssessment = () => {
    if (!assessForm.name || !selClass || !selSubject) return;
    createAssessment({ municipalityId: mid, classId: parseInt(selClass), subjectId: parseInt(selSubject), name: assessForm.name, type: assessForm.type as any, maxScore: parseFloat(assessForm.maxScore) || 10, bimester: selBimester as any, date: assessForm.date || undefined },
      { onSuccess: (r: any) => { refetchAssessments(); setShowNewAssessment(false); setAssessForm({ name: '', type: 'prova', maxScore: '10', date: '' }); if (r?.id) setSelAssessment(String(r.id)); } });
  };

  const selectedAssessmentData = allAssessments.find((a: any) => String(a.id) === selAssessment);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><ClipboardEdit size={20} className="text-blue-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Lançamento de Notas</h1><p className="text-gray-500">Registre as notas dos alunos por avaliação</p></div></div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="input w-56" value={selClass} onChange={e => { setSelClass(e.target.value); setSelAssessment(''); setGrades({}); }}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>
        <select className="input w-48" value={selSubject} onChange={e => { setSelSubject(e.target.value); setSelAssessment(''); setGrades({}); }}><option value="">Disciplina</option>{allSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">{BIMESTERS.map(b => (
          <button key={b.v} onClick={() => { setSelBimester(b.v); setSelAssessment(''); setGrades({}); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selBimester === b.v ? 'bg-white shadow text-accent-600' : 'text-gray-500'}`}>{b.l.replace(' Bimestre', '° Bim')}</button>
        ))}</div>
      </div>

      {selClass && selSubject ? (
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Assessments list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Avaliações</h3>
              <button onClick={() => setShowNewAssessment(true)} className="text-xs text-accent-500 hover:underline flex items-center gap-1"><Plus size={12} /> Nova</button>
            </div>
            <div className="space-y-2">
              {allAssessments.map((a: any) => (
                <button key={a.id} onClick={() => { setSelAssessment(String(a.id)); setGrades({}); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${String(a.id) === selAssessment ? 'border-accent-500 bg-accent-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-medium text-sm">{a.name}</p>
                  <div className="flex gap-2 mt-1"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{TYPES[a.type] || a.type}</span><span className="text-xs text-gray-400">Nota max: {parseFloat(a.maxScore)}</span></div>
                </button>
              ))}
              {!allAssessments.length && <p className="text-sm text-gray-400 text-center py-4">Nenhuma avaliação. Crie uma primeiro.</p>}
            </div>
          </div>

          {/* Right: Grade entry */}
          <div className="col-span-2">
            {selAssessment && selectedAssessmentData ? (
              <div className="card p-0 overflow-hidden">
                <div className="bg-accent-50 px-5 py-3 border-b border-accent-100 flex items-center justify-between">
                  <div><p className="font-semibold text-accent-700">{selectedAssessmentData.name}</p><p className="text-xs text-accent-600">{TYPES[selectedAssessmentData.type]} · Nota máxima: {parseFloat(selectedAssessmentData.maxScore)}</p></div>
                  <button onClick={saveGrades} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? 'Salvando...' : 'Salvar Notas'}</button>
                </div>
                {saveMsg && <div className={`px-5 py-2 text-sm ${saveMsg.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{saveMsg}</div>}
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-8">Nº</th><th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Aluno</th><th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Nota</th></tr></thead>
                  <tbody className="divide-y">{allEnrollments.map((e: any, i: number) => {
                    const gradeValue = getGrade(e.studentId);
                    const maxScore = parseFloat(selectedAssessmentData.maxScore);
                    const numValue = parseFloat(gradeValue);
                    const isLow = !isNaN(numValue) && numValue < maxScore * 0.6;
                    return (
                      <tr key={e.studentId} className="hover:bg-gray-50">
                        <td className="px-5 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-800">{e.studentName}</td>
                        <td className="px-3 py-2.5 text-center">
                          <input type="number" step="0.1" min="0" max={maxScore}
                            value={grades[e.studentId] !== undefined ? grades[e.studentId] : gradeValue}
                            onChange={ev => setGrades(prev => ({ ...prev, [e.studentId]: ev.target.value }))}
                            className={`w-24 text-center px-3 py-1.5 border rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent-400 ${isLow ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-300'}`}
                            placeholder="—" />
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : (
              <div className="card text-center py-16"><ClipboardEdit size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma avaliação para lançar notas</p></div>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-16"><ClipboardEdit size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione turma e disciplina para começar</p></div>
      )}

      {/* Modal nova avaliação */}
      {showNewAssessment && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">Nova Avaliação</h3><button onClick={() => setShowNewAssessment(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Nome da avaliação *</label><input className="input" value={assessForm.name} onChange={e => setAssessForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Prova 1, Trabalho de Grupo..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tipo</label><select className="input" value={assessForm.type} onChange={e => setAssessForm(f => ({ ...f, type: e.target.value }))}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
            <div><label className="label">Nota máxima</label><input className="input" type="number" value={assessForm.maxScore} onChange={e => setAssessForm(f => ({ ...f, maxScore: e.target.value }))} /></div>
          </div>
          <div><label className="label">Data</label><input className="input" type="date" value={assessForm.date} onChange={e => setAssessForm(f => ({ ...f, date: e.target.value }))} /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowNewAssessment(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={createNewAssessment} className="btn-primary flex-1">Criar Avaliação</button></div>
      </div></div>)}
    </div>
  );
}
