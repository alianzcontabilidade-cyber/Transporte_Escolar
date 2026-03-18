import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ArrowRightLeft, Search, CheckCircle, AlertTriangle, Users } from 'lucide-react';

export default function StudentTransferPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState('');

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData, refetch } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: yearsData } = useQuery(() => api.academicYears.list({ municipalityId: mid }), [mid]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const allYears = (yearsData as any) || [];
  const activeYear = allYears.find((y: any) => y.status === 'active');

  const filtered = allEnrollments.filter((e: any) => e.studentName?.toLowerCase().includes(search.toLowerCase()));
  const toggleStudent = (id: number) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedStudents(filtered.map((e: any) => e.studentId));
  const deselectAll = () => setSelectedStudents([]);

  const doTransfer = async () => {
    if (!targetClass || !selectedStudents.length || !activeYear) return;
    setTransferring(true);
    setResult('');
    let ok = 0, fail = 0;
    for (const studentId of selectedStudents) {
      try {
        // 1. Update old enrollment status to 'transferred'
        const enrollment = allEnrollments.find((e: any) => e.studentId === studentId);
        if (enrollment) {
          await api.enrollments.updateStatus({ id: enrollment.id, status: 'transferred', statusNotes: 'Remanejado para outra turma' });
        }
        // 2. Create new enrollment in target class
        await api.enrollments.create({ municipalityId: mid, studentId, classId: parseInt(targetClass), academicYearId: activeYear.id });
        ok++;
      } catch { fail++; }
    }
    setTransferring(false);
    setResult(`Transferidos: ${ok}${fail > 0 ? ` | Erros: ${fail}` : ''}`);
    setSelectedStudents([]);
    refetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><ArrowRightLeft size={20} className="text-blue-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Remanejamento de Alunos</h1><p className="text-gray-500">Transferir alunos entre turmas</p></div></div>
      </div>

      {!activeYear && (
        <div className="card bg-yellow-50 border-yellow-200 mb-4 flex items-center gap-3"><AlertTriangle size={18} className="text-yellow-600" /><p className="text-sm text-yellow-700">Nenhum ano letivo ativo. Ative um ano letivo para realizar remanejamentos.</p></div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Origem */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Turma de Origem</h3>
          <select className="input mb-3" value={selClass} onChange={e => { setSelClass(e.target.value); setSelectedStudents([]); setResult(''); }}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>

          {selClass && (
            <div className="card p-0">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="relative flex-1 mr-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9 py-2 text-sm" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="flex gap-1"><button onClick={selectAll} className="text-xs text-accent-500 hover:underline">Todos</button><span className="text-gray-300">|</span><button onClick={deselectAll} className="text-xs text-gray-500 hover:underline">Nenhum</button></div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y">
                {filtered.map((e: any) => (
                  <label key={e.studentId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedStudents.includes(e.studentId)} onChange={() => toggleStudent(e.studentId)} className="rounded" />
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{e.studentName?.[0]}</div>
                    <div><p className="text-sm font-medium">{e.studentName}</p>{e.studentEnrollment && <p className="text-xs text-gray-400">Mat. {e.studentEnrollment}</p>}</div>
                  </label>
                ))}
                {!filtered.length && <p className="p-4 text-center text-gray-400 text-sm">Nenhum aluno</p>}
              </div>
              {selectedStudents.length > 0 && <div className="p-3 border-t bg-accent-50 text-accent-700 text-sm font-medium">{selectedStudents.length} aluno(s) selecionado(s)</div>}
            </div>
          )}
        </div>

        {/* Destino */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Turma de Destino</h3>
          <select className="input mb-3" value={targetClass} onChange={e => setTargetClass(e.target.value)}><option value="">Selecione a turma destino</option>{allClasses.filter((c: any) => String(c.id) !== selClass).map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>

          {selectedStudents.length > 0 && targetClass && (
            <div className="card bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2"><ArrowRightLeft size={16} /> Confirmar Remanejamento</h4>
              <p className="text-sm text-blue-700 mb-2"><b>{selectedStudents.length}</b> aluno(s) serão transferidos de:</p>
              <p className="text-sm text-gray-600 mb-1"><b>De:</b> {allClasses.find((c: any) => String(c.id) === selClass)?.fullName || '—'}</p>
              <p className="text-sm text-gray-600 mb-4"><b>Para:</b> {allClasses.find((c: any) => String(c.id) === targetClass)?.fullName || '—'}</p>
              <button onClick={doTransfer} disabled={transferring} className="btn-primary w-full flex items-center justify-center gap-2">
                <ArrowRightLeft size={16} />{transferring ? 'Transferindo...' : 'Confirmar Transferência'}
              </button>
            </div>
          )}

          {result && <div className={`mt-3 p-3 rounded-lg text-sm ${result.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}><CheckCircle size={14} className="inline mr-1" />{result}</div>}

          {!selectedStudents.length && !targetClass && (
            <div className="card text-center py-12 border-dashed"><ArrowRightLeft size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm">Selecione alunos na turma de origem e escolha a turma de destino</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
