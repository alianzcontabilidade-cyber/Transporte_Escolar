import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { maskCPF, validateCPF, maskPhone } from '../lib/utils';
import { UserCheck, Plus, X, Pencil, Trash2, Search, Phone, Mail, FileText, GraduationCap, KeyRound } from 'lucide-react';

const CONTRACT_TYPES: any = { effective: 'Efetivo', temporary: 'Temporario', substitute: 'Substituto' };
const CONTRACT_COLORS: any = { effective: 'bg-green-100 text-green-700', temporary: 'bg-yellow-100 text-yellow-700', substitute: 'bg-orange-100 text-orange-700' };
const emptyForm = { name: '', cpf: '', phone: '', email: '', password: '', registrationNumber: '', degree: '', specialization: '', hireDate: '', contractType: 'effective', weeklyWorkload: '40' };

export default function TeachersPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const [cpfError, setCpfError] = useState('');

  const { data: teachersList, refetch } = useQuery(() => api.teachers.list({ municipalityId: mid }), [mid]);
  const { mutate: create, loading: creating } = useMutation(api.teachers.create);
  const { mutate: update, loading: updating } = useMutation(api.teachers.update);
  const { mutate: remove } = useMutation(api.teachers.delete);
  const { mutate: resetPwd, loading: resetting } = useMutation(api.auth.adminResetPassword);

  const raw = (teachersList as any) || [];
  const all = raw.map((t: any) => t.teacher && t.user ? { id: t.teacher.id, name: t.user.name, email: t.user.email, phone: t.user.phone, cpf: t.user.cpf, ...t.teacher } : t);
  const filtered = all.filter((t: any) => { const q = search.toLowerCase(); return t.name?.toLowerCase().includes(q) || (t.registrationNumber || '').includes(q) || (t.email || '').toLowerCase().includes(q); });

  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const handleCpf = (e: any) => { const v = maskCPF(e.target.value); setForm((f: any) => ({ ...f, cpf: v })); const d = e.target.value.replace(/\D/g, ''); setCpfError(d.length === 11 ? (validateCPF(d) ? '' : 'CPF invalido') : ''); };
  const handlePhone = (e: any) => setForm((f: any) => ({ ...f, phone: maskPhone(e.target.value) }));

  const openNew = () => { setForm(emptyForm); setEditId(null); setFormErr(''); setCpfError(''); setShowModal(true); };
  const openEdit = (t: any) => { setForm({ ...emptyForm, ...t, hireDate: t.hireDate ? (typeof t.hireDate === 'string' ? t.hireDate.split('T')[0] : '') : '', weeklyWorkload: String(t.weeklyWorkload || 40), password: '' }); setEditId(t.id); setFormErr(''); setCpfError(''); setShowModal(true); };

  const save = () => {
    if (!form.name) { setFormErr('Nome e obrigatorio.'); return; }
    if (cpfError) { setFormErr('Corrija o CPF.'); return; }
    const payload: any = { municipalityId: mid, name: form.name, cpf: form.cpf || undefined, phone: form.phone || undefined, email: form.email || undefined, registrationNumber: form.registrationNumber || undefined, degree: form.degree || undefined, specialization: form.specialization || undefined, hireDate: form.hireDate || undefined, contractType: form.contractType, weeklyWorkload: parseInt(form.weeklyWorkload) || 40 };
    if (!editId && form.password) payload.password = form.password;
    if (editId) { update({ id: editId, ...payload }, { onSuccess: () => { refetch(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') }); }
    else { create(payload, { onSuccess: (r: any) => { refetch(); setShowModal(false); if (r?.generatedPassword) showSuccessToast('Senha gerada: ' + r.generatedPassword); }, onError: (e: any) => setFormErr(e || 'Erro') }); }
  };

  const handleResetPassword = (teacher: any) => {
    if (!teacher.userId) { showInfoToast('Professor sem usuario vinculado'); return; }
    if (!confirm(`Resetar a senha de ${teacher.name}? Uma nova senha sera gerada.`)) return;
    resetPwd({ userId: teacher.userId }, {
      onSuccess: (r: any) => { showSuccessToast('Nova senha gerada: ' + r.generatedPassword + ' - Anote esta senha, ela nao sera exibida novamente.'); },
      onError: (e: any) => showErrorToast('Erro ao resetar senha: ' + (e || 'Erro desconhecido')),
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center"><GraduationCap size={20} className="text-cyan-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Professores</h1><p className="text-gray-500">{all.length} professor(es)</p></div>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Professor</button>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por nome, matricula ou email..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid gap-3">
        {filtered.map((t: any) => (
          <div key={t.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors">
            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center font-bold text-cyan-700 text-lg flex-shrink-0">{t.name?.[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5"><p className="font-semibold text-gray-800">{t.name}</p>{t.contractType && <span className={`text-xs px-2 py-0.5 rounded-full ${CONTRACT_COLORS[t.contractType] || ''}`}>{CONTRACT_TYPES[t.contractType] || t.contractType}</span>}</div>
              <div className="flex gap-3 flex-wrap text-xs text-gray-500">
                {t.email && <span className="flex items-center gap-1"><Mail size={10} />{t.email}</span>}
                {t.phone && <span className="flex items-center gap-1"><Phone size={10} />{t.phone}</span>}
                {t.registrationNumber && <span className="flex items-center gap-1"><FileText size={10} />Mat. {t.registrationNumber}</span>}
                {t.degree && <span>{t.degree}</span>}
                {t.weeklyWorkload && <span>{t.weeklyWorkload}h/sem</span>}
              </div>
            </div>
            <div className="flex gap-1"><button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={15} /></button><button onClick={() => handleResetPassword(t)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg" title="Resetar Senha"><KeyRound size={15} /></button><button onClick={() => setConfirmDelete(t)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={15} /></button></div>
          </div>
        ))}
        {!filtered.length && <div className="card text-center py-16"><GraduationCap size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhum professor</p><button className="btn-primary" onClick={openNew}>Adicionar professor</button></div>}
      </div>

      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { remove({ id: confirmDelete.id }, { onSuccess: () => { refetch(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar Professor' : 'Novo Professor'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
          <div className="p-4 bg-cyan-50 rounded-xl">
            <p className="text-xs font-semibold text-cyan-700 mb-3 uppercase">Dados Pessoais</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={sf('name')} /></div>
              <div><label className="label">CPF</label><input className="input" value={form.cpf} onChange={handleCpf} placeholder="000.000.000-00" maxLength={14} />{cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}</div>
              <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={handlePhone} placeholder="(00) 00000-0000" maxLength={15} /></div>
              <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={sf('email')} /></div>
              {!editId && <div><label className="label">Senha (opcional)</label><input className="input" type="password" value={form.password} onChange={sf('password')} placeholder="Gerada automaticamente" /></div>}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">Dados Profissionais</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Matricula funcional</label><input className="input" value={form.registrationNumber} onChange={sf('registrationNumber')} /></div>
              <div><label className="label">Tipo de contrato</label><select className="input" value={form.contractType} onChange={sf('contractType')}>{Object.entries(CONTRACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
              <div><label className="label">Formacao</label><input className="input" value={form.degree} onChange={sf('degree')} placeholder="Pedagogia, Matematica..." /></div>
              <div><label className="label">Especializacao</label><input className="input" value={form.specialization} onChange={sf('specialization')} /></div>
              <div><label className="label">Data de admissao</label><input className="input" type="date" value={form.hireDate} onChange={sf('hireDate')} /></div>
              <div><label className="label">Carga horaria semanal</label><input className="input" type="number" value={form.weeklyWorkload} onChange={sf('weeklyWorkload')} /></div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating || updating} className="btn-primary flex-1">{creating || updating ? 'Salvando...' : 'Salvar'}</button></div>
      </div></div>)}
    </div>
  );
}