import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ClipboardList, Plus, X, Search, UserPlus, Users, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import QuickAddModal from '../components/QuickAddModal';

const STATUS_LABELS: any = { active: 'Ativo', transferred: 'Transferido', cancelled: 'Cancelado', graduated: 'Aprovado', retained: 'Retido', evaded: 'Evadido' };
const STATUS_COLORS: any = { active: 'bg-green-100 text-green-700', transferred: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-600', graduated: 'bg-emerald-100 text-emerald-700', retained: 'bg-red-100 text-red-700', evaded: 'bg-yellow-100 text-yellow-700' };

export default function EnrollmentsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [filterClass, setFilterClass] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [bulkClassId, setBulkClassId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [statusModal, setStatusModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  const { data: enrollmentsList, refetch } = useQuery(() => api.enrollments.list({ municipalityId: mid, classId: filterClass ? parseInt(filterClass) : undefined, academicYearId: filterYear ? parseInt(filterYear) : undefined, status: filterStatus || undefined }), [mid, filterClass, filterYear, filterStatus]);
  const { data: classesData, refetch: refetchClasses } = useQuery(() => api.classes.list({ municipalityId: mid, academicYearId: filterYear ? parseInt(filterYear) : undefined }), [mid, filterYear]);
  const { data: yearsData, refetch: refetchYears } = useQuery(() => api.academicYears.list({ municipalityId: mid }), [mid]);
  const { data: studentsData, refetch: refetchStudents } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { mutate: updateStatus } = useMutation(api.enrollments.updateStatus);

  const all = (enrollmentsList as any) || [];
  const allClasses = (classesData as any) || [];
  const allYears = (yearsData as any) || [];
  const allStudents = (studentsData as any) || [];
  const filtered = all.filter((e: any) => { const q = search.toLowerCase(); return (e.studentName || '').toLowerCase().includes(q) || (e.studentEnrollment || '').includes(q); });

  // Students not enrolled in selected year/class for bulk enrollment
  const enrolledStudentIds = new Set(all.map((e: any) => e.studentId));
  const availableStudents = allStudents.filter((s: any) => !enrolledStudentIds.has(s.id));

  const toggleStudent = (id: number) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const doBulkEnroll = async () => {
    if (!bulkClassId || !filterYear || !selectedStudents.length) return;
    setImporting(true);
    try {
      const result = await api.enrollments.bulkCreate({ municipalityId: mid, classId: parseInt(bulkClassId), academicYearId: parseInt(filterYear), studentIds: selectedStudents });
      setImportResult(`Matriculados: ${result.created} | Ja matriculados: ${result.skipped}`);
      setSelectedStudents([]);
      refetch();
    } catch (e: any) { setImportResult('Erro: ' + (e.message || 'Falha')); }
    finally { setImporting(false); }
  };

  const handleStatusChange = () => {
    if (!statusModal || !newStatus) return;
    updateStatus({ id: statusModal.id, status: newStatus as any, statusNotes: statusNotes || undefined }, { onSuccess: () => { refetch(); setStatusModal(null); setNewStatus(''); setStatusNotes(''); } });
  };

  const activeYear = allYears.find((y: any) => y.status === 'active');
  const counts = { active: all.filter((e: any) => e.status === 'active').length, total: all.length };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><ClipboardList size={20} className="text-teal-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Matrículas</h1><p className="text-gray-500">{counts.active} ativa(s) de {counts.total} total</p></div>
        </div>
        <button onClick={() => { setShowBulk(true); setImportResult(''); setSelectedStudents([]); setBulkClassId(''); }} className="btn-primary flex items-center gap-2"><UserPlus size={16} /> Matricular Alunos</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex gap-1"><select className="input w-48" value={filterYear} onChange={e => { setFilterYear(e.target.value); setFilterClass(''); }}><option value="">Todos os anos</option>{allYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}</select><button type="button" onClick={() => setQuickAdd('academicYear')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm"><Plus size={16}/></button></div>
        <div className="flex gap-1"><select className="input w-56" value={filterClass} onChange={e => setFilterClass(e.target.value)}><option value="">Todas as turmas</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select><button type="button" onClick={() => setQuickAdd('class')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm"><Plus size={16}/></button></div>
        <select className="input w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select>
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>{['Aluno', 'Matricula', 'Data', 'Status', 'Acoes'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((e: any) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{e.studentName}</td>
                <td className="px-4 py-3 text-gray-500">{e.studentEnrollment || e.enrollmentNumber || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-500">{e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('pt-BR') : '\u2014'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[e.status] || ''}`}>{STATUS_LABELS[e.status] || e.status}</span></td>
                <td className="px-4 py-3"><button onClick={() => { setStatusModal(e); setNewStatus(e.status); setStatusNotes(''); }} className="text-xs text-primary-500 hover:underline">Alterar status</button></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">Nenhuma matricula encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal alterar status */}
      {statusModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b"><h3 className="font-semibold">Alterar Status da Matricula</h3><p className="text-sm text-gray-500 mt-1">{statusModal.studentName}</p></div>
        <div className="p-5 space-y-3">
          <div><label className="label">Novo status</label><select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
          <div><label className="label">Observacoes</label><textarea className="input" rows={2} value={statusNotes} onChange={e => setStatusNotes(e.target.value)} placeholder="Motivo da alteracao..." /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setStatusModal(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleStatusChange} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}

      {/* Modal matricula em lote */}
      {showBulk && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold flex items-center gap-2"><UserPlus size={18} className="text-teal-500" /> Matricular Alunos em Lote</h3><button onClick={() => setShowBulk(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Ano Letivo *</label><div className="flex gap-1"><select className="input" value={filterYear} onChange={e => setFilterYear(e.target.value)}><option value="">Selecione</option>{allYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}</select><button type="button" onClick={() => setQuickAdd('academicYear')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm"><Plus size={16}/></button></div></div>
            <div><label className="label">Turma *</label><div className="flex gap-1"><select className="input" value={bulkClassId} onChange={e => setBulkClassId(e.target.value)}><option value="">Selecione</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select><button type="button" onClick={() => setQuickAdd('class')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm"><Plus size={16}/></button></div></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-gray-700">Selecione os alunos ({selectedStudents.length} selecionados)</p><button type="button" onClick={() => setQuickAdd('student')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm flex items-center gap-1"><Plus size={16}/> Novo Aluno</button></div>
            <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
              {availableStudents.map((s: any) => (
                <label key={s.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} className="rounded" />
                  <span className="text-sm font-medium">{s.name}</span>
                  {s.enrollment && <span className="text-xs text-gray-400">Mat. {s.enrollment}</span>}
                  {s.grade && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{s.grade}</span>}
                </label>
              ))}
              {!availableStudents.length && <p className="p-4 text-center text-gray-400 text-sm">Todos os alunos ja estao matriculados</p>}
            </div>
          </div>
          {importResult && <div className={`p-3 rounded-lg text-sm ${importResult.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{importResult}</div>}
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowBulk(false)} className="btn-secondary flex-1">Fechar</button><button onClick={doBulkEnroll} disabled={!bulkClassId || !filterYear || !selectedStudents.length || importing} className="btn-primary flex-1 flex items-center justify-center gap-2">{importing && <Loader2 size={16} className="animate-spin" />}{importing ? 'Matriculando...' : `Matricular ${selectedStudents.length} aluno(s)`}</button></div>
      </div></div>)}

      {/* QuickAddModal */}
      {quickAdd && (
        <QuickAddModal
          entityType={quickAdd as any}
          municipalityId={mid}
          onClose={() => setQuickAdd(null)}
          onSuccess={(newEntity: any) => {
            if (quickAdd === 'academicYear') { refetchYears(); setFilterYear(String(newEntity.id)); }
            if (quickAdd === 'class') { refetchClasses(); setBulkClassId(String(newEntity.id)); setFilterClass(String(newEntity.id)); }
            if (quickAdd === 'student') { refetchStudents(); if (newEntity.id) setSelectedStudents(prev => [...prev, newEntity.id]); }
            setQuickAdd(null);
          }}
        />
      )}
    </div>
  );
}