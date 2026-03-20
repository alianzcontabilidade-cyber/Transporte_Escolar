import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { GraduationCap, Plus, X, Pencil, Trash2, Search, Users, School } from 'lucide-react';
import QuickAddModal from '../components/QuickAddModal';

const SHIFTS: any = { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite', full_time: 'Integral' };
const emptyForm = { schoolId: '', academicYearId: '', classGradeId: '', name: '', shift: 'morning', maxStudents: '30', roomNumber: '', teacherUserId: '' };

export default function ClassesPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  const { data: classList, refetch } = useQuery(() => api.classes.list({ municipalityId: mid, schoolId: filterSchool ? parseInt(filterSchool) : undefined, academicYearId: filterYear ? parseInt(filterYear) : undefined }), [mid, filterSchool, filterYear]);
  const { data: schoolsData, refetch: refetchSchools } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: yearsData, refetch: refetchYears } = useQuery(() => api.academicYears.list({ municipalityId: mid }), [mid]);
  const { data: gradesData, refetch: refetchGrades } = useQuery(() => api.classGrades.list({ municipalityId: mid }), [mid]);
  const { data: teachersData, refetch: refetchTeachers } = useQuery(() => api.teachers.list({ municipalityId: mid }), [mid]);
  const { mutate: create, loading: creating } = useMutation(api.classes.create);
  const { mutate: update, loading: updating } = useMutation(api.classes.update);
  const { mutate: remove } = useMutation(api.classes.delete);

  const all = (classList as any) || [];
  const allSchools = (schoolsData as any) || [];
  const allYears = (yearsData as any) || [];
  const allGrades = (gradesData as any) || [];
  const allTeachers = ((teachersData as any) || []).map((t: any) => t.user ? { id: t.teacher?.userId || t.user.id, name: t.user.name, teacherId: t.teacher?.id } : t);
  const filtered = all.filter((c: any) => { const q = search.toLowerCase(); return (c.fullName || c.name || '').toLowerCase().includes(q) || (c.schoolName || '').toLowerCase().includes(q); });

  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const openNew = () => { setForm({ ...emptyForm, academicYearId: allYears.find((y: any) => y.status === 'active')?.id || '' }); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEdit = (c: any) => { setForm({ ...c, schoolId: String(c.schoolId || ''), academicYearId: String(c.academicYearId || ''), classGradeId: String(c.classGradeId || ''), teacherUserId: String(c.teacherUserId || ''), maxStudents: String(c.maxStudents || 30) }); setEditId(c.id); setFormErr(''); setShowModal(true); };

  const save = () => {
    if (!form.schoolId || !form.academicYearId || !form.classGradeId || !form.name) { setFormErr('Preencha escola, ano letivo, série e nome.'); return; }
    const payload = { municipalityId: mid, schoolId: parseInt(form.schoolId), academicYearId: parseInt(form.academicYearId), classGradeId: parseInt(form.classGradeId), name: form.name, shift: form.shift, maxStudents: parseInt(form.maxStudents) || 30, roomNumber: form.roomNumber || undefined, teacherUserId: form.teacherUserId ? parseInt(form.teacherUserId) : undefined };
    if (editId) { update({ id: editId, name: form.name, shift: form.shift, maxStudents: parseInt(form.maxStudents), roomNumber: form.roomNumber || undefined, teacherUserId: form.teacherUserId ? parseInt(form.teacherUserId) : undefined }, { onSuccess: () => { refetch(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') }); }
    else { create(payload, { onSuccess: () => { refetch(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') }); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><GraduationCap size={20} className="text-violet-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Turmas</h1><p className="text-gray-500">{all.length} turma(s)</p></div>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nova Turma</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="input w-48" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}><option value="">Todas as escolas</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select className="input w-48" value={filterYear} onChange={e => setFilterYear(e.target.value)}><option value="">Todos os anos</option>{allYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar turma..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c: any) => (
          <div key={c.id} className="card hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center"><GraduationCap size={18} className="text-violet-600" /></div>
              <div className="flex gap-1"><button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={14} /></button><button onClick={() => setConfirmDelete(c)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button></div>
            </div>
            <p className="font-bold text-gray-900">{c.fullName || `${c.gradeName || ''} ${c.name}`}</p>
            <div className="mt-1 space-y-0.5 text-xs text-gray-500">
              {c.schoolName && <p className="flex items-center gap-1"><School size={10} />{c.schoolName}</p>}
              <p>{SHIFTS[c.shift] || c.shift}{c.roomNumber ? ` · Sala ${c.roomNumber}` : ''}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Users size={10} />{c.enrolledStudents || 0}/{c.maxStudents || 30}</span>
              {c.gradeLevel && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.gradeName}</span>}
            </div>
          </div>
        ))}
        {!filtered.length && <div className="col-span-3 card text-center py-16"><GraduationCap size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhuma turma encontrada</p><button className="btn-primary" onClick={openNew}>Criar turma</button></div>}
      </div>

      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir turma {confirmDelete.fullName || confirmDelete.name}?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { remove({ id: confirmDelete.id }, { onSuccess: () => { refetch(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar Turma' : 'Nova Turma'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Escola *</label>
              <div className="flex gap-1"><select className="input flex-1" value={form.schoolId} onChange={sf('schoolId')} disabled={!!editId}><option value="">Selecione</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              {!editId && <button type="button" onClick={() => setQuickAdd('school')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar escola"><Plus size={16}/></button>}</div>
            </div>
            <div><label className="label">Ano Letivo *</label>
              <div className="flex gap-1"><select className="input flex-1" value={form.academicYearId} onChange={sf('academicYearId')} disabled={!!editId}><option value="">Selecione</option>{allYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              {!editId && <button type="button" onClick={() => setQuickAdd('academicYear')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar ano letivo"><Plus size={16}/></button>}</div>
            </div>
            <div><label className="label">Série *</label>
              <div className="flex gap-1"><select className="input flex-1" value={form.classGradeId} onChange={sf('classGradeId')} disabled={!!editId}><option value="">Selecione</option>{allGrades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
              {!editId && <button type="button" onClick={() => setQuickAdd('classGrade')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar série"><Plus size={16}/></button>}</div>
            </div>
            <div><label className="label">Nome da turma *</label><input className="input" value={form.name} onChange={sf('name')} placeholder="A, B, C..." /></div>
            <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={sf('shift')}>{Object.entries(SHIFTS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
            <div><label className="label">Max. alunos</label><input className="input" type="number" value={form.maxStudents} onChange={sf('maxStudents')} /></div>
            <div><label className="label">Sala</label><input className="input" value={form.roomNumber} onChange={sf('roomNumber')} placeholder="Sala 05" /></div>
            <div><label className="label">Professor regente</label>
              <div className="flex gap-1"><select className="input flex-1" value={form.teacherUserId} onChange={sf('teacherUserId')}><option value="">Selecione</option>{allTeachers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <button type="button" onClick={() => setQuickAdd('teacher')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar professor"><Plus size={16}/></button></div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating || updating} className="btn-primary flex-1">{creating || updating ? 'Salvando...' : 'Salvar'}</button></div>
      </div></div>)}

      {/* Quick Add Modal */}
      {quickAdd && (
        <QuickAddModal
          entityType={quickAdd as any}
          municipalityId={mid}
          onClose={() => setQuickAdd(null)}
          onSuccess={(entity) => {
            if (quickAdd === 'school') { refetchSchools(); setForm((f: any) => ({ ...f, schoolId: String(entity.id) })); }
            else if (quickAdd === 'academicYear') { refetchYears(); setForm((f: any) => ({ ...f, academicYearId: String(entity.id) })); }
            else if (quickAdd === 'classGrade') { refetchGrades(); setForm((f: any) => ({ ...f, classGradeId: String(entity.id) })); }
            else if (quickAdd === 'teacher') { refetchTeachers(); setForm((f: any) => ({ ...f, teacherUserId: String(entity.id) })); }
            setQuickAdd(null);
          }}
        />
      )}
    </div>
  );
}