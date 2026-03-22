import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Briefcase, Plus, X, Pencil, Trash2, Search, Users, Building, Star, MapPin } from 'lucide-react';

const POS_CATS: any = { docente: 'Docente', administrativo: 'Administrativo', operacional: 'Operacional', gestao: 'Gestão' };
const POS_COLORS: any = { docente: 'bg-blue-100 text-blue-700', administrativo: 'bg-purple-100 text-purple-700', operacional: 'bg-orange-100 text-orange-700', gestao: 'bg-green-100 text-green-700' };
const ALLOC_STATUS: any = { active: 'Ativa', transferred: 'Transferida', ended: 'Encerrada' };

export default function HRPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState<'positions'|'departments'|'allocations'|'evaluations'>('positions');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [formErr, setFormErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data: posData, refetch: refetchPos } = useQuery(() => api.positions.list({ municipalityId: mid }), [mid]);
  const { data: deptData, refetch: refetchDept } = useQuery(() => api.departments.list({ municipalityId: mid }), [mid]);
  const { data: allocData, refetch: refetchAlloc } = useQuery(() => api.staffAllocations.list({ municipalityId: mid }), [mid]);
  const { data: evalData, refetch: refetchEval } = useQuery(() => api.staffEvaluations.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: usersData } = useQuery(() => api.users.list({ municipalityId: mid }), [mid]);
  const { mutate: createPos } = useMutation(api.positions.create);
  const { mutate: updatePos } = useMutation(api.positions.update);
  const { mutate: deletePos } = useMutation(api.positions.delete);
  const { mutate: createDept } = useMutation(api.departments.create);
  const { mutate: updateDept } = useMutation(api.departments.update);
  const { mutate: deleteDept } = useMutation(api.departments.delete);
  const { mutate: createAlloc } = useMutation(api.staffAllocations.create);
  const { mutate: updateAlloc } = useMutation(api.staffAllocations.update);
  const { mutate: deleteAlloc } = useMutation(api.staffAllocations.delete);
  const { mutate: createEval } = useMutation(api.staffEvaluations.create);
  const { mutate: updateEval } = useMutation(api.staffEvaluations.update);
  const { mutate: deleteEval } = useMutation(api.staffEvaluations.delete);

  const allPos = (posData as any) || [];
  const allDept = (deptData as any) || [];
  const allAlloc = (allocData as any) || [];
  const allEval = (evalData as any) || [];
  const allSchools = (schoolsData as any) || [];
  const allUsers = (usersData as any) || [];

  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const fmtDate = (d: any) => { if (!d) return ''; try { return typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]; } catch { return ''; } };

  const openNewPos = () => { setForm({ name: '', category: 'administrativo', baseSalary: '', description: '' }); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEditPos = (p: any) => { setForm({ ...p, baseSalary: p.baseSalary ? String(parseFloat(p.baseSalary)) : '' }); setEditId(p.id); setFormErr(''); setShowModal(true); };
  const savePos = () => {
    if (!form.name) { setFormErr('Nome obrigatório'); return; }
    const payload = { municipalityId: mid, name: form.name, category: form.category, baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : undefined, description: form.description || undefined };
    const cb = { onSuccess: () => { refetchPos(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') };
    editId ? updatePos({ id: editId, ...payload }, cb) : createPos(payload, cb);
  };

  const openNewDept = () => { setForm({ name: '', headUserId: '', description: '' }); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEditDept = (d: any) => { setForm({ ...d, headUserId: d.headUserId ? String(d.headUserId) : '' }); setEditId(d.id); setFormErr(''); setShowModal(true); };
  const saveDept = () => {
    if (!form.name) { setFormErr('Nome obrigatório'); return; }
    const payload = { municipalityId: mid, name: form.name, headUserId: form.headUserId ? parseInt(form.headUserId) : undefined, description: form.description || undefined };
    const cb = { onSuccess: () => { refetchDept(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') };
    editId ? updateDept({ id: editId, ...payload }, cb) : createDept(payload, cb);
  };

  const openNewAlloc = () => { setForm({ userId: '', schoolId: '', positionId: '', startDate: new Date().toISOString().split('T')[0], workload: '40' }); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEditAlloc = (a: any) => { setForm({ userId: String(a.userId || ''), schoolId: a.schoolId ? String(a.schoolId) : '', positionId: a.positionId ? String(a.positionId) : '', startDate: fmtDate(a.startDate), endDate: fmtDate(a.endDate), workload: String(a.workload || 40), status: a.status || 'active', notes: a.notes || '' }); setEditId(a.id); setFormErr(''); setShowModal(true); };
  const saveAlloc = () => {
    if (!form.userId || !form.startDate) { setFormErr('Servidor e data obrigatórios'); return; }
    const cb = { onSuccess: () => { refetchAlloc(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') };
    if (editId) {
      updateAlloc({ id: editId, schoolId: form.schoolId ? parseInt(form.schoolId) : undefined, positionId: form.positionId ? parseInt(form.positionId) : undefined, startDate: form.startDate, endDate: form.endDate || undefined, workload: parseInt(form.workload) || 40, status: form.status || undefined, notes: form.notes || undefined }, cb);
    } else {
      createAlloc({ municipalityId: mid, userId: parseInt(form.userId), schoolId: form.schoolId ? parseInt(form.schoolId) : undefined, positionId: form.positionId ? parseInt(form.positionId) : undefined, startDate: form.startDate, workload: parseInt(form.workload) || 40 }, cb);
    }
  };

  const openNewEval = () => { setForm({ userId: '', period: new Date().getFullYear().toString(), punctuality: '', productivity: '', teamwork: '', initiative: '', communication: '', strengths: '', improvements: '', goals: '' }); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEditEval = (e: any) => { setForm({ userId: String(e.userId || ''), period: e.period || '', punctuality: e.punctuality != null ? String(e.punctuality) : '', productivity: e.productivity != null ? String(e.productivity) : '', teamwork: e.teamwork != null ? String(e.teamwork) : '', initiative: e.initiative != null ? String(e.initiative) : '', communication: e.communication != null ? String(e.communication) : '', strengths: e.strengths || '', improvements: e.improvements || '', goals: e.goals || '' }); setEditId(e.id); setFormErr(''); setShowModal(true); };
  const saveEval = () => {
    if (!form.userId || !form.period) { setFormErr('Servidor e período obrigatórios'); return; }
    const evalPayload = { period: form.period, punctuality: form.punctuality ? parseInt(form.punctuality) : undefined, productivity: form.productivity ? parseInt(form.productivity) : undefined, teamwork: form.teamwork ? parseInt(form.teamwork) : undefined, initiative: form.initiative ? parseInt(form.initiative) : undefined, communication: form.communication ? parseInt(form.communication) : undefined, strengths: form.strengths || undefined, improvements: form.improvements || undefined, goals: form.goals || undefined };
    const cb = { onSuccess: () => { refetchEval(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') };
    if (editId) {
      updateEval({ id: editId, ...evalPayload }, cb);
    } else {
      createEval({ municipalityId: mid, userId: parseInt(form.userId), ...evalPayload }, cb);
    }
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    const cb = { onSuccess: () => { setConfirmDelete(null); if (tab === 'positions') refetchPos(); else if (tab === 'departments') refetchDept(); else if (tab === 'allocations') refetchAlloc(); else refetchEval(); } };
    if (tab === 'positions') deletePos({ id: confirmDelete.id }, cb);
    else if (tab === 'departments') deleteDept({ id: confirmDelete.id }, cb);
    else if (tab === 'allocations') deleteAlloc({ id: confirmDelete.id }, cb);
    else deleteEval({ id: confirmDelete.id }, cb);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Briefcase size={20} className="text-amber-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Recursos Humanos</h1><p className="text-gray-500">Cargos, departamentos, lotacoes e avaliacoes</p></div>
        </div>
        <button onClick={() => { if (tab === 'positions') openNewPos(); else if (tab === 'departments') openNewDept(); else if (tab === 'allocations') openNewAlloc(); else openNewEval(); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo</button>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['positions', 'Cargos', Briefcase], ['departments', 'Departamentos', Building], ['allocations', 'Lotacoes', MapPin], ['evaluations', 'Avaliacoes', Star]].map(([id, label, Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}><Icon size={14} /> {label}</button>
        ))}
      </div>

      {/* Tab Cargos */}
      {tab === 'positions' && (
        <div className="grid gap-3">{allPos.map((p: any) => (
          <div key={p.id} className="card flex items-center gap-4">
            <div className="flex-1"><p className="font-semibold text-gray-800">{p.name}</p><div className="flex gap-2 mt-1"><span className={`text-xs px-2 py-0.5 rounded-full ${POS_COLORS[p.category] || ''}`}>{POS_CATS[p.category]}</span>{p.baseSalary && <span className="text-xs text-gray-500">R$ {parseFloat(p.baseSalary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}</div></div>
            <div className="flex gap-1"><button onClick={() => { setTab('positions'); openEditPos(p); }} className="p-2 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={15} /></button><button onClick={() => setConfirmDelete(p)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={15} /></button></div>
          </div>
        ))}{!allPos.length && <div className="card text-center py-12"><Briefcase size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum cargo cadastrado</p></div>}</div>
      )}

      {/* Tab Departamentos */}
      {tab === 'departments' && (
        <div className="grid gap-3">{allDept.map((d: any) => (
          <div key={d.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Building size={16} className="text-purple-600" /></div>
            <div className="flex-1"><p className="font-semibold text-gray-800">{d.name}</p>{d.headName && <p className="text-xs text-gray-500">Responsavel: {d.headName}</p>}{d.description && <p className="text-xs text-gray-400 mt-0.5">{d.description}</p>}</div>
            <div className="flex gap-1"><button onClick={() => { setTab('departments'); openEditDept(d); }} className="p-2 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={15} /></button><button onClick={() => setConfirmDelete(d)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={15} /></button></div>
          </div>
        ))}{!allDept.length && <div className="card text-center py-12"><Building size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum departamento</p></div>}</div>
      )}

      {/* Tab Lotações */}
      {tab === 'allocations' && (
        <div className="card p-0 overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['Servidor', 'Escola/Local', 'Carga Horaria', 'Inicio', 'Status', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y">{allAlloc.map((a: any) => (
          <tr key={a.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{a.userName}</td>
            <td className="px-4 py-3 text-gray-500">{a.schoolName || '—'}</td>
            <td className="px-4 py-3 text-gray-500">{a.workload}h/sem</td>
            <td className="px-4 py-3 text-gray-500">{a.startDate ? new Date(a.startDate).toLocaleDateString('pt-BR') : '—'}</td>
            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ALLOC_STATUS[a.status] || a.status}</span></td>
            <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => { setTab('allocations'); openEditAlloc(a); }} className="p-1.5 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={14} /></button><button onClick={() => setConfirmDelete(a)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button></div></td>
          </tr>
        ))}{!allAlloc.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhuma lotacao</td></tr>}</tbody></table></div>
      )}

      {/* Tab Avaliações */}
      {tab === 'evaluations' && (
        <div className="grid gap-3">{allEval.map((e: any) => (
          <div key={e.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <div><p className="font-semibold text-gray-800">{e.userName}</p><p className="text-xs text-gray-500">Periodo: {e.period} | Avaliador: {e.evaluatorName || '—'}</p></div>
              <div className="flex items-center gap-2">{e.overallScore && <span className="text-lg font-bold text-primary-600">{parseFloat(e.overallScore).toFixed(1)}</span>}<button onClick={() => { setTab('evaluations'); openEditEval(e); }} className="p-1.5 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={14} /></button><button onClick={() => setConfirmDelete(e)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button></div>
            </div>
            <div className="grid grid-cols-5 gap-2 mt-2">{['punctuality','productivity','teamwork','initiative','communication'].map(k => (
              <div key={k} className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 capitalize">{k === 'punctuality' ? 'Pontualidade' : k === 'productivity' ? 'Produtividade' : k === 'teamwork' ? 'Trabalho em equipe' : k === 'initiative' ? 'Iniciativa' : 'Comunicacao'}</p><p className="font-bold text-gray-700">{(e as any)[k] || '—'}</p></div>
            ))}</div>
          </div>
        ))}{!allEval.length && <div className="card text-center py-12"><Star size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma avaliacao</p></div>}</div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir {confirmDelete.name || confirmDelete.userName || 'registro'}?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={doDelete} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {/* Modal for create/edit */}
      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar' : 'Novo'} {tab === 'positions' ? 'Cargo' : tab === 'departments' ? 'Departamento' : tab === 'allocations' ? 'Lotacao' : 'Avaliacao'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
          {tab === 'positions' && (<div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome do cargo *</label><input className="input" value={form.name || ''} onChange={sf('name')} /></div>
            <div><label className="label">Categoria</label><select className="input" value={form.category || ''} onChange={sf('category')}>{Object.entries(POS_CATS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
            <div><label className="label">Salario base (R$)</label><input className="input" type="number" step="0.01" value={form.baseSalary || ''} onChange={sf('baseSalary')} /></div>
            <div className="col-span-2"><label className="label">Descricao</label><textarea className="input" rows={2} value={form.description || ''} onChange={sf('description')} /></div>
          </div>)}
          {tab === 'departments' && (<div className="space-y-4">
            <div><label className="label">Nome *</label><input className="input" value={form.name || ''} onChange={sf('name')} /></div>
            <div><label className="label">Responsavel</label><select className="input" value={form.headUserId || ''} onChange={sf('headUserId')}><option value="">Selecione</option>{allUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
            <div><label className="label">Descricao</label><textarea className="input" rows={2} value={form.description || ''} onChange={sf('description')} /></div>
          </div>)}
          {tab === 'allocations' && (<div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Servidor *</label><select className="input" value={form.userId || ''} onChange={sf('userId')} disabled={!!editId}><option value="">Selecione</option>{allUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}</select></div>
            <div><label className="label">Escola/Local</label><select className="input" value={form.schoolId || ''} onChange={sf('schoolId')}><option value="">Selecione</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label">Cargo</label><select className="input" value={form.positionId || ''} onChange={sf('positionId')}><option value="">Selecione</option>{allPos.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="label">Data inicio *</label><input className="input" type="date" value={form.startDate || ''} onChange={sf('startDate')} /></div>
            <div><label className="label">Carga horaria (h/sem)</label><input className="input" type="number" value={form.workload || '40'} onChange={sf('workload')} /></div>
            {editId && <div><label className="label">Data fim</label><input className="input" type="date" value={form.endDate || ''} onChange={sf('endDate')} /></div>}
            {editId && <div><label className="label">Status</label><select className="input" value={form.status || 'active'} onChange={sf('status')}>{Object.entries(ALLOC_STATUS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>}
          </div>)}
          {tab === 'evaluations' && (<div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Servidor *</label><select className="input" value={form.userId || ''} onChange={sf('userId')}><option value="">Selecione</option>{allUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div><label className="label">Periodo *</label><input className="input" value={form.period || ''} onChange={sf('period')} placeholder="2025" /></div>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Notas (0-10)</p>
            <div className="grid grid-cols-5 gap-3">{[['punctuality','Pontualidade'],['productivity','Produtividade'],['teamwork','Equipe'],['initiative','Iniciativa'],['communication','Comunicacao']].map(([k,l]) => (
              <div key={k}><label className="label text-xs">{l}</label><input className="input text-center" type="number" min="0" max="10" value={form[k] || ''} onChange={sf(k)} /></div>
            ))}</div>
            <div><label className="label">Pontos fortes</label><textarea className="input" rows={2} value={form.strengths || ''} onChange={sf('strengths')} /></div>
            <div><label className="label">Pontos a melhorar</label><textarea className="input" rows={2} value={form.improvements || ''} onChange={sf('improvements')} /></div>
            <div><label className="label">Metas</label><textarea className="input" rows={2} value={form.goals || ''} onChange={sf('goals')} /></div>
          </div>)}
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { if (tab === 'positions') savePos(); else if (tab === 'departments') saveDept(); else if (tab === 'allocations') saveAlloc(); else saveEval(); }} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    </div>
  );
}
