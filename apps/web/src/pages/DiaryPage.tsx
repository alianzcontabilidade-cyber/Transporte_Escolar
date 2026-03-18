import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { BookOpen, CheckCircle, XCircle, Clock, AlertTriangle, Users, Save, Search, Calendar } from 'lucide-react';

const STATUS_ICONS: any = { present: CheckCircle, absent: XCircle, justified: AlertTriangle, late: Clock };
const STATUS_LABELS: any = { present: 'Presente', absent: 'Ausente', justified: 'Justificado', late: 'Atrasado' };
const STATUS_COLORS: any = { present: 'text-green-600 bg-green-50', absent: 'text-red-600 bg-red-50', justified: 'text-yellow-600 bg-yellow-50', late: 'text-orange-600 bg-orange-50' };

export default function DiaryPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState<'attendance'|'grades'|'plans'>('attendance');
  const [selClass, setSelClass] = useState('');
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selSubject, setSelSubject] = useState('');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: subjectsData } = useQuery(() => api.subjects.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: existingAttendance } = useQuery(() => selClass && selDate ? api.diaryAttendance.listByClassDate({ classId: parseInt(selClass), date: selDate, subjectId: selSubject ? parseInt(selSubject) : undefined }) : Promise.resolve([]), [selClass, selDate, selSubject]);

  const allClasses = (classesData as any) || [];
  const allSubjects = (subjectsData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const existing = (existingAttendance as any) || [];

  // Initialize attendance from enrollments + existing records
  const getStudentStatus = (studentId: number) => {
    const ex = existing.find((e: any) => e.studentId === studentId);
    const local = attendance.find((a: any) => a.studentId === studentId);
    return local?.status || ex?.status || 'present';
  };

  const setStudentStatus = (studentId: number, status: string) => {
    setAttendance(prev => {
      const filtered = prev.filter(a => a.studentId !== studentId);
      return [...filtered, { studentId, status }];
    });
    setSaveMsg('');
  };

  const saveAttendance = async () => {
    if (!selClass) return;
    setSaving(true);
    const records = allEnrollments.map((e: any) => ({
      studentId: e.studentId,
      status: getStudentStatus(e.studentId),
    }));
    try {
      await api.diaryAttendance.register({ classId: parseInt(selClass), subjectId: selSubject ? parseInt(selSubject) : undefined, date: selDate, records });
      setSaveMsg('Frequencia salva com sucesso!');
    } catch (e: any) { setSaveMsg('Erro: ' + (e.message || 'Falha')); }
    finally { setSaving(false); }
  };

  const presentCount = allEnrollments.filter((e: any) => getStudentStatus(e.studentId) === 'present').length;
  const absentCount = allEnrollments.filter((e: any) => getStudentStatus(e.studentId) === 'absent').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><BookOpen size={20} className="text-emerald-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Diario Escolar</h1><p className="text-gray-500">Frequencia, notas e planejamento</p></div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['attendance', 'Frequencia', CheckCircle], ['grades', 'Notas', BookOpen], ['plans', 'Planejamento', Calendar]].map(([id, label, Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}><Icon size={14} /> {label}</button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="input w-56" value={selClass} onChange={e => { setSelClass(e.target.value); setAttendance([]); setSaveMsg(''); }}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>
        {tab === 'attendance' && <input type="date" className="input w-44" value={selDate} onChange={e => { setSelDate(e.target.value); setAttendance([]); setSaveMsg(''); }} />}
        <select className="input w-48" value={selSubject} onChange={e => setSelSubject(e.target.value)}><option value="">Todas disciplinas</option>{allSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>

      {tab === 'attendance' && (
        <div>
          {selClass ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="card text-center bg-green-50 border-0"><p className="text-2xl font-bold text-green-600">{presentCount}</p><p className="text-xs text-gray-500">Presentes</p></div>
                <div className="card text-center bg-red-50 border-0"><p className="text-2xl font-bold text-red-600">{absentCount}</p><p className="text-xs text-gray-500">Ausentes</p></div>
                <div className="card text-center bg-blue-50 border-0"><p className="text-2xl font-bold text-blue-600">{allEnrollments.length > 0 ? Math.round((presentCount / allEnrollments.length) * 100) : 0}%</p><p className="text-xs text-gray-500">Presenca</p></div>
              </div>

              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aluno</th><th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Status</th></tr></thead>
                  <tbody className="divide-y">
                    {allEnrollments.map((e: any) => {
                      const status = getStudentStatus(e.studentId);
                      return (
                        <tr key={e.studentId} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800">{e.studentName}</td>
                          <td className="px-2 py-2.5">
                            <div className="flex gap-1 justify-center">
                              {['present', 'absent', 'justified', 'late'].map(s => {
                                const Icon = STATUS_ICONS[s];
                                return <button key={s} onClick={() => setStudentStatus(e.studentId, s)} className={`p-1.5 rounded-lg transition-all ${status === s ? STATUS_COLORS[s] + ' ring-2 ring-offset-1' : 'text-gray-300 hover:text-gray-500'}`} title={STATUS_LABELS[s]}><Icon size={16} /></button>;
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!allEnrollments.length && <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">Nenhum aluno matriculado nesta turma</td></tr>}
                  </tbody>
                </table>
              </div>
              {allEnrollments.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  {saveMsg && <p className={`text-sm ${saveMsg.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>{saveMsg}</p>}
                  <button onClick={saveAttendance} disabled={saving} className="btn-primary flex items-center gap-2 ml-auto"><Save size={16} />{saving ? 'Salvando...' : 'Salvar Frequencia'}</button>
                </div>
              )}
            </>
          ) : (
            <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para registrar frequencia</p></div>
          )}
        </div>
      )}

      {tab === 'grades' && (
        <div className="card text-center py-16">
          <BookOpen size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Selecione uma turma e disciplina para lancar notas</p>
          <p className="text-xs text-gray-400">Use a pagina de Avaliacoes para criar provas e lancar notas</p>
        </div>
      )}

      {tab === 'plans' && (
        <div className="card text-center py-16">
          <Calendar size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Planejamento de aulas</p>
          <p className="text-xs text-gray-400">Selecione uma turma e disciplina para ver/criar planejamentos</p>
        </div>
      )}
    </div>
  );
}
