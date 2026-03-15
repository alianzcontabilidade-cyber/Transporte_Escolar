import { useState, useRef } from 'react';
import { UserCheck, Plus, X, Phone, Mail, MapPin, Eye, EyeOff, Camera, Pencil, Trash2, AlertTriangle, Search, Users, CheckCircle } from 'lucide-react';

function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover"/> : <Camera size={24} className="text-gray-400"/>}
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white"><Camera size={10} className="text-white"/></div>
      </div>
      <span className="text-xs text-gray-500">Clique para adicionar foto</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e) { const f = e.target.files?.[0]; if (f) { const rd = new FileReader(); rd.onload = function(ev) { onChange(ev.target?.result as string); }; rd.readAsDataURL(f); } }}/>
    </div>
  );
}

const emptyForm = { name:'', cpf:'', birthDate:'', phone:'', email:'', address:'', city:'', routeName:'', shift:'morning', observations:'', password:'', confirmPassword:'', photo:'' };
const SHIFTS = [{ v:'morning', l:'Manhã' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' },{ v:'full', l:'Integral' }];

const INIT = [
  { id:1, name:'Maria Santos', cpf:'111.222.333-44', phone:'(63) 98888-1111', email:'maria@escola.gov.br', address:'Rua das Flores, 123', city:'Palmas', shift:'morning', status:'active', photo:'', routeName:'Rota Centro', observations:'Especializada em alunos com NEE' },
  { id:2, name:'Carlos Oliveira', cpf:'555.666.777-88', phone:'(63) 97777-2222', email:'carlos@escola.gov.br', address:'Av. Palmas, 456', city:'Palmas', shift:'afternoon', status:'active', photo:'', routeName:'Rota Norte', observations:'' },
];

export default function MonitoresPage() {
  const [monitores, setMonitores] = useState(INIT);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const setField = function(k: string) { return function(e: any) { setForm(function(f: any) { return { ...f, [k]: e.target.value }; }); }; };
  const shiftLabel = function(v: string) { return SHIFTS.find(function(s) { return s.v === v; })?.l || v; };

  const filtered = monitores.filter(function(m) {
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.phone.includes(q) || (m.routeName||'').toLowerCase().includes(q);
  });

  const openNew = function() { setForm(emptyForm); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEdit = function(m: any) { setForm({ ...m, password:'', confirmPassword:'' }); setEditId(m.id); setFormErr(''); setShowModal(true); };

  const save = function() {
    if (!form.name || !form.phone) { setFormErr('Nome e telefone são obrigatórios.'); return; }
    if (form.password && form.password !== form.confirmPassword) { setFormErr('Senhas não coincidem.'); return; }
    if (editId !== null) {
      setMonitores(function(prev) { return prev.map(function(m) { return m.id === editId ? { ...form, id: editId, status: m.status } : m; }); });
    } else {
      const newId = Math.max(0, ...monitores.map(function(m) { return m.id; })) + 1;
      setMonitores(function(prev) { return [...prev, { ...form, id: newId, status: 'active' }]; });
    }
    setShowModal(false); setForm(emptyForm); setEditId(null); setFormErr('');
  };

  const toggleStatus = function(id: number) {
    setMonitores(function(prev) { return prev.map(function(m) { return m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m; }); });
  };

  const doDelete = function(id: number) {
    setMonitores(function(prev) { return prev.filter(function(m) { return m.id !== id; }); });
    setConfirmDelete(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><UserCheck size={20} className="text-teal-600"/></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Monitores</h1><p className="text-gray-500">Auxiliares que acompanham o motorista no transporte dos alunos</p></div>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Monitor</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center bg-teal-50 border-0"><Users size={22} className="text-teal-500 mx-auto mb-1"/><p className="text-2xl font-bold">{monitores.length}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="card text-center bg-green-50 border-0"><CheckCircle size={22} className="text-green-500 mx-auto mb-1"/><p className="text-2xl font-bold">{monitores.filter(m => m.status==='active').length}</p><p className="text-xs text-gray-500">Ativos</p></div>
        <div className="card text-center bg-red-50 border-0"><AlertTriangle size={22} className="text-red-400 mx-auto mb-1"/><p className="text-2xl font-bold">{monitores.filter(m => m.status!=='active').length}</p><p className="text-xs text-gray-500">Inativos</p></div>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input className="input pl-9" placeholder="Buscar por nome, telefone ou rota..." value={search} onChange={function(e) { setSearch(e.target.value); }}/>
      </div>

      <div className="grid gap-3">
        {filtered.map(function(m) { return (
          <div key={m.id} className={`card flex items-center gap-4 transition-colors ${m.status!=='active'?'opacity-60 bg-gray-50':''}`}>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center flex-shrink-0">
              {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover"/> : <span className="font-bold text-teal-700 text-lg">{m.name[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-800">{m.name}</p>
                <span className={'text-xs px-2 py-0.5 rounded-full ' + (m.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500')}>{m.status==='active'?'Ativo':'Inativo'}</span>
                <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">{shiftLabel(m.shift)}</span>
              </div>
              <div className="flex gap-4 flex-wrap text-xs text-gray-500">
                <span className="flex items-center gap-1"><Phone size={10}/> {m.phone}</span>
                {m.email && <span className="flex items-center gap-1"><Mail size={10}/> {m.email}</span>}
                {m.city && <span className="flex items-center gap-1"><MapPin size={10}/> {m.city}</span>}
                {m.routeName && <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{m.routeName}</span>}
              </div>
              {m.observations && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.observations}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={function() { openEdit(m); }} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><Pencil size={15}/></button>
              <button onClick={function() { toggleStatus(m.id); }} className={'p-2 rounded-lg transition-colors ' + (m.status==='active'?'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50':'text-gray-400 hover:text-green-500 hover:bg-green-50')} title={m.status==='active'?'Desativar':'Ativar'}>{m.status==='active'?<AlertTriangle size={15}/>:<CheckCircle size={15}/>}</button>
              <button onClick={function() { setConfirmDelete(m.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={15}/></button>
            </div>
          </div>
        ); })}
        {!filtered.length && <div className="card text-center py-12"><UserCheck size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500">Nenhum monitor encontrado</p></div>}
      </div>

      {/* Confirmação exclusão */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir monitor?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={function() { setConfirmDelete(null); }} className="btn-secondary flex-1">Cancelar</button><button onClick={function() { doDelete(confirmDelete!); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {/* Modal cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck size={18} className="text-teal-600"/>{editId ? 'Editar Monitor' : 'Novo Monitor'}</h3>
              <button onClick={function() { setShowModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{formErr}</div>}
              <div className="flex justify-center">
                <PhotoUpload value={form.photo} onChange={function(v: string) { setForm(function(f: any) { return { ...f, photo: v }; }); }}/>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl">
                <p className="text-xs font-semibold text-teal-700 mb-3 uppercase tracking-wide">Dados Pessoais</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Nome do monitor"/></div>
                  <div><label className="label">CPF</label><input className="input" value={form.cpf} onChange={setField('cpf')} placeholder="000.000.000-00"/></div>
                  <div><label className="label">Data de Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={setField('birthDate')}/></div>
                  <div><label className="label">Telefone *</label><input className="input" value={form.phone} onChange={setField('phone')} placeholder="(00) 00000-0000"/></div>
                  <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={setField('email')}/></div>
                  <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={setField('address')}/></div>
                  <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={setField('city')}/></div>
                  <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={setField('shift')}>{SHIFTS.map(function(s) { return <option key={s.v} value={s.v}>{s.l}</option>; })}</select></div>
                  <div className="col-span-2"><label className="label">Rota vinculada</label><input className="input" value={form.routeName} onChange={setField('routeName')} placeholder="Ex: Rota Centro"/></div>
                  <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={2} value={form.observations} onChange={setField('observations')} placeholder="Informações adicionais..."/></div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Acesso ao sistema <span className="font-normal text-gray-400">(opcional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Senha</label>
                    <div className="relative">
                      <input type={showPass?'text':'password'} className="input pr-10" value={form.password} onChange={setField('password')} placeholder="Mínimo 8 caracteres"/>
                      <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={function() { setShowPass(function(p) { return !p; }); }}>{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button>
                    </div>
                  </div>
                  <div><label className="label">Confirmar Senha</label><input type="password" className="input" value={form.confirmPassword} onChange={setField('confirmPassword')}/></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={function() { setShowModal(false); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} className="btn-primary flex-1">{editId ? 'Salvar alterações' : 'Salvar Monitor'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                         }
