import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { maskPhone, maskCPF } from '../lib/utils';
import { ListOrdered, Plus, X, Trash2, Search, UserPlus, CheckCircle, XCircle, Phone } from 'lucide-react';

const STATUS_LABELS: any = { waiting:'Aguardando', called:'Convocado', enrolled:'Matriculado', cancelled:'Cancelado' };
const STATUS_COLORS: any = { waiting:'bg-yellow-100 text-yellow-700', called:'bg-blue-100 text-blue-700', enrolled:'bg-green-100 text-green-700', cancelled:'bg-gray-100 text-gray-600' };
const SHIFTS: any = { morning:'Manhã', afternoon:'Tarde', evening:'Noite', full_time:'Integral' };

export default function WaitingListPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ studentName:'', guardianName:'', guardianPhone:'', guardianCpf:'', gradeRequested:'', shift:'morning', schoolId:'', notes:'' });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: list, refetch } = useQuery(() => api.waitingList.list({ municipalityId: mid, status: filterStatus || undefined }), [mid, filterStatus]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { mutate: create, loading } = useMutation(api.waitingList.create);
  const { mutate: updateStatus } = useMutation(api.waitingList.updateStatus);
  const { mutate: remove } = useMutation(api.waitingList.delete);

  const all = (list as any) || [];
  const allSchools = (schoolsData as any) || [];
  const filtered = all.filter((w: any) => w.studentName?.toLowerCase().includes(search.toLowerCase()) || (w.guardianName || '').toLowerCase().includes(search.toLowerCase()));
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const counts = { waiting: all.filter((w: any) => w.status === 'waiting').length, called: all.filter((w: any) => w.status === 'called').length, enrolled: all.filter((w: any) => w.status === 'enrolled').length };

  const save = () => {
    if (!form.studentName || !form.schoolId) return;
    create({ municipalityId: mid, schoolId: parseInt(form.schoolId), studentName: form.studentName, guardianName: form.guardianName || undefined, guardianPhone: form.guardianPhone || undefined, guardianCpf: form.guardianCpf || undefined, gradeRequested: form.gradeRequested || undefined, shift: form.shift, notes: form.notes || undefined },
      { onSuccess: () => { refetch(); setShowModal(false); setForm({ studentName:'', guardianName:'', guardianPhone:'', guardianCpf:'', gradeRequested:'', shift:'morning', schoolId:'', notes:'' }); } });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><ListOrdered size={20} className="text-amber-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Lista de Espera</h1><p className="text-gray-500">{counts.waiting} aguardando vaga</p></div></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Adicionar</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center bg-yellow-50 border-0 cursor-pointer" onClick={() => setFilterStatus(filterStatus === 'waiting' ? '' : 'waiting')}><p className="text-2xl font-bold text-yellow-600">{counts.waiting}</p><p className="text-xs text-gray-500">Aguardando</p></div>
        <div className="card text-center bg-blue-50 border-0 cursor-pointer" onClick={() => setFilterStatus(filterStatus === 'called' ? '' : 'called')}><p className="text-2xl font-bold text-blue-600">{counts.called}</p><p className="text-xs text-gray-500">Convocados</p></div>
        <div className="card text-center bg-green-50 border-0 cursor-pointer" onClick={() => setFilterStatus(filterStatus === 'enrolled' ? '' : 'enrolled')}><p className="text-2xl font-bold text-green-600">{counts.enrolled}</p><p className="text-xs text-gray-500">Matriculados</p></div>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por nome do aluno ou responsável..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['#','Aluno','Responsável','Telefone','Série','Turno','Status','Ações'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{filtered.map((w: any) => (
          <tr key={w.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-bold text-gray-400">{w.position || '—'}</td>
            <td className="px-4 py-3 font-medium text-gray-800">{w.studentName}</td>
            <td className="px-4 py-3 text-gray-600">{w.guardianName || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{w.guardianPhone || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{w.gradeRequested || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{SHIFTS[w.shift] || w.shift}</td>
            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[w.status]}`}>{STATUS_LABELS[w.status]}</span></td>
            <td className="px-4 py-3">
              <div className="flex gap-1">
                {w.status === 'waiting' && <button onClick={() => updateStatus({ id: w.id, status: 'called' }, { onSuccess: refetch })} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Convocar"><UserPlus size={14} /></button>}
                {w.status === 'called' && <button onClick={() => updateStatus({ id: w.id, status: 'enrolled' }, { onSuccess: refetch })} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Matricular"><CheckCircle size={14} /></button>}
                {(w.status === 'waiting' || w.status === 'called') && <button onClick={() => updateStatus({ id: w.id, status: 'cancelled' }, { onSuccess: refetch })} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancelar"><XCircle size={14} /></button>}
                <button onClick={() => remove({ id: w.id }, { onSuccess: refetch })} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}{!filtered.length && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Lista vazia</td></tr>}</tbody></table>
      </div>

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">Adicionar à Lista de Espera</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Nome do Aluno *</label><input className="input" value={form.studentName} onChange={sf('studentName')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Escola *</label><select className="input" value={form.schoolId} onChange={sf('schoolId')}><option value="">Selecione</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label">Série pretendida</label><input className="input" value={form.gradeRequested} onChange={sf('gradeRequested')} placeholder="1o Ano" /></div>
          </div>
          <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={sf('shift')}>{Object.entries(SHIFTS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Responsável</label><input className="input" value={form.guardianName} onChange={sf('guardianName')} /></div>
            <div><label className="label">Telefone</label><input className="input" value={form.guardianPhone} onChange={e => setForm((f: any) => ({ ...f, guardianPhone: maskPhone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} /></div>
          </div>
          <div><label className="label">CPF do Responsável</label><input className="input" value={form.guardianCpf} onChange={e => setForm((f: any) => ({ ...f, guardianCpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" maxLength={14} /></div>
          <div><label className="label">Observações</label><textarea className="input" rows={2} value={form.notes} onChange={sf('notes')} /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={loading} className="btn-primary flex-1">{loading ? 'Salvando...' : 'Adicionar'}</button></div>
      </div></div>)}
    </div>
  );
}
