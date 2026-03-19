import { useState, useRef, useEffect } from 'react';
import { UserCheck, Plus, X, Phone, Mail, MapPin, Eye, EyeOff, Camera, Pencil, Trash2, AlertTriangle, Search, Users, CheckCircle, Loader2, Navigation, Download } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { maskCPF, validateCPF, maskPhone } from '../lib/utils';
function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover"/> : <Camera size={24} className="text-gray-400"/>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e) { const f = e.target.files?.[0]; if (f) { const rd = new FileReader(); rd.onload = function(ev) { onChange(ev.target?.result as string); }; rd.readAsDataURL(f); } }}/>
    </div>
  );
}

const emptyForm = { name:'', cpf:'', birthDate:'', phone:'', email:'', address:'', state:'', city:'', routeName:'', shift:'morning', observations:'', password:'', confirmPassword:'', photo:'' };
const SHIFTS = [{ v:'morning', l:'Manhã' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' },{ v:'full', l:'Integral' }];

export default function MonitoresPage() {
  const { user } = useAuth();
  const [monitores, setMonitores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [viewMonitor, setViewMonitor] = useState<any>(null);
  const [cpfError, setCpfError] = useState('');
  const municipalityId = user?.municipalityId;
  const { municipios: monMunicipios, loading: monMunLoading } = useMunicipios(form.state);
  const { data: routesData } = useQuery(() => api.routes.list({ municipalityId: municipalityId || 0 }), [municipalityId]);
  const allRoutes: any[] = (routesData as any) || [];

  const loadMonitores = async () => {
    if (!municipalityId) return;
    try { setLoading(true); const data = await api.monitorStaff.list({ municipalityId }); setMonitores(Array.isArray(data) ? data : []); } catch (err) { console.error('Erro ao carregar monitores:', err); } finally { setLoading(false); }
  };
  useEffect(() => { loadMonitores(); }, [municipalityId]);

  const setField = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const handlePhoneChange = (e: any) => { setForm((f: any) => ({ ...f, phone: maskPhone(e.target.value) })); };
  const handleCpfChange = (e: any) => { const masked = maskCPF(e.target.value); setForm((f: any) => ({ ...f, cpf: masked })); const digits = e.target.value.replace(/\D/g, ''); if (digits.length === 11) { setCpfError(validateCPF(digits) ? '' : 'CPF inválido'); } else { setCpfError(''); } };
  const shiftLabel = (v: string) => SHIFTS.find(s => s.v === v)?.l || v;
  const filtered = monitores.filter(m => { const q = search.toLowerCase(); return m.name.toLowerCase().includes(q) || (m.phone||'').includes(q) || (m.routeName||'').toLowerCase().includes(q); });

  const openNew = () => { setForm(emptyForm); setEditId(null); setFormErr(''); setCpfError(''); setShowModal(true); };
  const openEdit = (m: any) => { setForm({ ...emptyForm, ...m, password:'', confirmPassword:'', photo: m.photoUrl || '', birthDate: m.birthDate ? (typeof m.birthDate === 'string' ? m.birthDate.split('T')[0] : new Date(m.birthDate).toISOString().split('T')[0]) : '' }); setEditId(m.id); setFormErr(''); setCpfError(''); setShowModal(true); };

  const save = async () => {
    if (!form.name || !form.phone) { setFormErr('Nome e telefone são obrigatórios.'); return; }
    if (cpfError) { setFormErr('Corrija o CPF antes de salvar.'); return; }
    const cpfDigits = (form.cpf || '').replace(/\D/g, '');
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) { setFormErr('CPF incompleto.'); return; }
    if (cpfDigits.length === 11 && !validateCPF(cpfDigits)) { setFormErr('CPF inválido.'); return; }
    if (form.password && form.password !== form.confirmPassword) { setFormErr('Senhas não coincidem.'); return; }
    setSaving(true);
    try {
      if (editId !== null) {
        await api.monitorStaff.update({ id: editId, name: form.name, cpf: form.cpf, phone: form.phone, email: form.email, address: form.address, city: form.city, shift: form.shift, routeName: form.routeName, observations: form.observations, photoUrl: form.photo, status: form.status });
      } else {
        await api.monitorStaff.create({ municipalityId, name: form.name, cpf: form.cpf, phone: form.phone, email: form.email, birthDate: form.birthDate || undefined, address: form.address, city: form.city, shift: form.shift, routeName: form.routeName, observations: form.observations, photoUrl: form.photo, password: form.password || undefined });
      }
      setShowModal(false); setForm(emptyForm); setEditId(null); setFormErr(''); await loadMonitores();
    } catch (err: any) { setFormErr(err.message || 'Erro ao salvar'); } finally { setSaving(false); }
  };

  const toggleStatus = async (m: any) => { try { await api.monitorStaff.update({ id: m.id, status: m.status === 'active' ? 'inactive' : 'active' }); await loadMonitores(); } catch (err) { console.error(err); } };
  const doDelete = async (id: number) => { try { await api.monitorStaff.delete({ id }); setConfirmDelete(null); await loadMonitores(); } catch (err) { console.error(err); } };

  const exportMonitoresCSV = () => {
    if (!monitores.length) return;
    const rows = monitores.map((m: any) => ({ nome: m.name||'', cpf: m.cpf||'', telefone: m.phone||'', email: m.email||'', turno: shiftLabel(m.shift), rota: m.routeName||'', cidade: m.city||'', status: m.status==='active'?'Ativo':'Inativo' }));
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(';'), ...rows.map((r: any) => keys.map(k => '"'+(r[k]||'')+'"').join(';'))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'})); a.download = 'monitores_netescol.csv'; a.click();
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-500" size={32}/></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><UserCheck size={20} className="text-teal-600"/></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Monitores</h1><p className="text-gray-500">Auxiliares que acompanham o motorista no transporte dos alunos</p></div>
        </div>
        <div className="flex gap-2"><button onClick={exportMonitoresCSV} className="btn-secondary flex items-center gap-2"><Download size={16}/> Exportar</button><button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Monitor</button></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center bg-teal-50 border-0"><Users size={22} className="text-teal-500 mx-auto mb-1"/><p className="text-2xl font-bold">{monitores.length}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="card text-center bg-green-50 border-0"><CheckCircle size={22} className="text-green-500 mx-auto mb-1"/><p className="text-2xl font-bold">{monitores.filter(m => m.status==='active').length}</p><p className="text-xs text-gray-500">Ativos</p></div>
        <div className="card text-center bg-red-50 border-0"><AlertTriangle size={22} className="text-red-400 mx-auto mb-1"/><p className="text-2xl font-bold">{monitores.filter(m => m.status!=='active').length}</p><p className="text-xs text-gray-500">Inativos</p></div>
      </div>
      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por nome, telefone ou rota..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      <div className="grid gap-3">
        {filtered.map(m => (
          <div key={m.id} className={"card flex items-center gap-4 transition-colors " + (m.status!=='active'?'opacity-60 bg-gray-50':'')}>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center flex-shrink-0">
              {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover"/> : <span className="font-bold text-teal-700 text-lg">{m.name[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-800">{m.name}</p>
                <span className={'text-xs px-2 py-0.5 rounded-full ' + (m.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500')}>{m.status==='active'?'Ativo':'Inativo'}</span>
                {m.shift && <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">{shiftLabel(m.shift)}</span>}
              </div>
              <div className="flex gap-4 flex-wrap text-xs text-gray-500">
                {m.phone && <span className="flex items-center gap-1"><Phone size={10}/> {m.phone}</span>}
                {m.email && <span className="flex items-center gap-1"><Mail size={10}/> {m.email}</span>}
                {m.city && <span className="flex items-center gap-1"><MapPin size={10}/> {m.city}</span>}
                {m.routeName && <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{m.routeName}</span>}
              </div>
              {m.observations && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.observations}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setViewMonitor(m)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Detalhes"><Eye size={15}/></button>
              <button onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><Pencil size={15}/></button>
              <button onClick={() => toggleStatus(m)} className={'p-2 rounded-lg transition-colors ' + (m.status==='active'?'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50':'text-gray-400 hover:text-green-500 hover:bg-green-50')} title={m.status==='active'?'Desativar':'Ativar'}>{m.status==='active'?<AlertTriangle size={15}/>:<CheckCircle size={15}/>}</button>
              <button onClick={() => setConfirmDelete(m.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={15}/></button>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="card text-center py-12"><UserCheck size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500">{monitores.length === 0 ? 'Nenhum monitor cadastrado' : 'Nenhum monitor encontrado'}</p></div>}
      </div>

      {viewMonitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-blue-500"/> Detalhes do Monitor</h3><button onClick={() => setViewMonitor(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="overflow-y-auto flex-1 p-5">
              <div className="flex items-center gap-4 mb-5"><div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-700">{viewMonitor.name?.[0]}</div><div><h2 className="text-xl font-bold text-gray-900">{viewMonitor.name}</h2><p className="text-sm text-gray-500">{shiftLabel(viewMonitor.shift)}{viewMonitor.routeName ? ' - ' + viewMonitor.routeName : ''}</p></div></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">CPF</p><p className="text-sm font-medium">{viewMonitor.cpf||'--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Telefone</p><p className="text-sm font-medium">{viewMonitor.phone||'--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium">{viewMonitor.email||'--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Cidade</p><p className="text-sm font-medium">{viewMonitor.city||'--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Endereço</p><p className="text-sm font-medium">{viewMonitor.address||'--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Status</p><p className="text-sm font-medium">{viewMonitor.status==='active'?'Ativo':'Inativo'}</p></div>
                {viewMonitor.observations && <div className="p-3 bg-gray-50 rounded-lg col-span-3"><p className="text-xs text-gray-400">Observações</p><p className="text-sm">{viewMonitor.observations}</p></div>}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t"><button onClick={() => setViewMonitor(null)} className="btn-secondary flex-1">Fechar</button><button onClick={() => { setViewMonitor(null); openEdit(viewMonitor); }} className="btn-primary flex-1">Editar</button></div>
          </div>
        </div>
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir monitor?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => doDelete(confirmDelete!)} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck size={18} className="text-teal-600"/>{editId ? 'Editar Monitor' : 'Novo Monitor'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{formErr}</div>}
              <div className="p-4 bg-teal-50 rounded-xl">
                <p className="text-xs font-semibold text-teal-700 mb-3 uppercase tracking-wide">Dados Pessoais</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Nome do monitor"/></div>
                  <div><label className="label">CPF</label><input className="input" value={form.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" maxLength={14}/>{cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}</div>
                  <div><label className="label">Telefone *</label><input className="input" value={form.phone} onChange={handlePhoneChange} placeholder="(63) 00000-0000" maxLength={15}/></div>
                  <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={setField('email')}/></div>
                  <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={setField('shift')}>{SHIFTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
                  <div><label className="label">Estado</label><select className="input" value={form.state} onChange={e => setForm((f: any) => ({...f, state: e.target.value, city: ''}))}><option value="">Selecione</option>{ESTADOS_BR.map(es => <option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div>
                  <div><label className="label">Cidade {monMunLoading && <Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.city} onChange={setField('city')} disabled={!form.state || monMunLoading}><option value="">Selecione</option>{monMunicipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>
                  <div><label className="label flex items-center gap-1"><Navigation size={12}/> Rota</label><select className="input" value={form.routeName} onChange={setField('routeName')}><option value="">-- Selecione a rota --</option>{allRoutes.map((r: any) => <option key={r.route?.id || r.id} value={r.route?.name || r.name}>{r.route?.name || r.name}{r.route?.code ? ' (' + r.route.code + ')' : ''}</option>)}</select></div>
                  <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={setField('address')}/></div>
                  <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={2} value={form.observations} onChange={setField('observations')}/></div>
                </div>
              </div>
              {!editId && <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Acesso ao sistema (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Senha</label><div className="relative"><input type={showPass?'text':'password'} className="input pr-10" value={form.password} onChange={setField('password')}/><button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPass(p => !p)}>{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
                  <div><label className="label">Confirmar Senha</label><input type="password" className="input" value={form.confirmPassword} onChange={setField('confirmPassword')}/></div>
                </div>
              </div>}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">{saving && <Loader2 size={16} className="animate-spin"/>}{editId ? 'Salvar' : 'Criar Monitor'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                                                                                       }
