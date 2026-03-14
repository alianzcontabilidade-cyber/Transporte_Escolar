import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Users, Plus, X, Search } from 'lucide-react';

function Modal({ title, onClose, children }: any) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white"><h3 className="font-semibold">{title}</h3><button onClick={onClose}><X size={20}/></button></div><div className="p-6">{children}</div></div></div>;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', schoolId: '', grade: '', classRoom: '', enrollment: '', shift: 'morning', address: '', hasSpecialNeeds: false });
  const { data: students, refetch } = useQuery(() => api.students.list({ municipalityId }), [municipalityId]);
  const { data: schools } = useQuery(() => api.schools.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.students.create);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const sl = (s: string) => ({ morning:'Manhã', afternoon:'Tarde', evening:'Noite' }[s]||s);
  const filtered = (students as any)?.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.enrollment||'').includes(search));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Alunos</h1><p className="text-gray-500">{(students as any)?.length ?? 0} aluno(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShow(true)}><Plus size={16}/> Novo Aluno</button>
      </div>
      <div className="relative mb-6"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      <div className="grid gap-3">
        {filtered?.map((s: any) => (
          <div key={s.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">{s.name[0].toUpperCase()}</div>
            <div className="flex-1"><p className="font-semibold">{s.name}</p><div className="flex gap-3">{s.grade && <span className="text-xs text-gray-500">{s.grade}</span>}{s.classRoom && <span className="text-xs text-gray-500">Turma {s.classRoom}</span>}</div></div>
            <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{sl(s.shift||'morning')}</span>
          </div>
        ))}
        {!filtered?.length && <div className="card text-center py-12"><Users size={40} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">{search ? 'Não encontrado' : 'Nenhum aluno'}</p>{!search && <button className="btn-primary mt-4" onClick={() => setShow(true)}>Adicionar</button>}</div>}
      </div>
      {show && <Modal title="Novo Aluno" onClose={() => setShow(false)}>
        <div className="space-y-3">
          <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={set('name')}/></div>
          <div><label className="label">Escola *</label><select className="input" value={form.schoolId} onChange={set('schoolId')}><option value="">Selecione</option>{(schools as any)?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-3"><div><label className="label">Série</label><input className="input" value={form.grade} onChange={set('grade')}/></div><div><label className="label">Turma</label><input className="input" value={form.classRoom} onChange={set('classRoom')}/></div><div><label className="label">Turno</label><select className="input" value={form.shift} onChange={set('shift')}><option value="morning">Manhã</option><option value="afternoon">Tarde</option><option value="evening">Noite</option></select></div></div>
          <div><label className="label">Matrícula</label><input className="input" value={form.enrollment} onChange={set('enrollment')}/></div>
          <div><label className="label">Endereço</label><input className="input" value={form.address} onChange={set('address')}/></div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setShow(false)}>Cancelar</button>
            <button className="btn-primary flex-1" disabled={loading} onClick={() => create({ municipalityId, schoolId: parseInt(form.schoolId), name: form.name, grade: form.grade||undefined, classRoom: form.classRoom||undefined, enrollment: form.enrollment||undefined, shift: form.shift as any, address: form.address||undefined }, { onSuccess: () => { refetch(); setShow(false); } })}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
