import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Truck, Plus, X, Phone, Mail, Camera, Pencil, Trash2, AlertTriangle, Search, CheckCircle, Eye, EyeOff, FileText } from 'lucide-react';

function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover"/> : <Camera size={24} className="text-gray-400"/>}
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white"><Camera size={10} className="text-white"/></div>
      </div>
      <span className="text-xs text-gray-500">Foto do motorista</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e) { const f = e.target.files?.[0]; if (f) { const rd = new FileReader(); rd.onload = function(ev) { onChange(ev.target?.result as string); }; rd.readAsDataURL(f); } }}/>
    </div>
  );
}

const CNH_CATS = ['B','C','D','E'];
const emptyForm = { name:'', cpf:'', phone:'', email:'', birthDate:'', address:'', city:'', cnhNumber:'', cnhCategory:'D', cnhExpiry:'', experience:'', photo:'', observations:'' };

export default function DriversPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [formTab, setFormTab] = useState<'dados'|'cnh'>('dados');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const { data: drivers, refetch } = useQuery(function() { return api.drivers.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.drivers.create);
  const { mutate: update, loading: updating } = useMutation(api.drivers.update);
  const { mutate: remove } = useMutation(api.drivers.delete);

  const setField = function(k: string) { return function(e: any) { setForm(function(f: any) { return { ...f, [k]: e.target.value }; }); }; };
  const allDrivers = (drivers as any) || [];
  const filtered = allDrivers.filter(function(d: any) {
    const q = search.toLowerCase();
    return d.name?.toLowerCase().includes(q) || d.phone?.includes(q) || d.cnhNumber?.includes(q);
  });

  const openNew = function() { setForm(emptyForm); setEditId(null); setFormTab('dados'); setFormErr(''); setShowModal(true); };
  const openEdit = function(d: any) { setForm({ ...emptyForm, ...d }); setEditId(d.id); setFormTab('dados'); setFormErr(''); setShowModal(true); };

  const save = function() {
    if (!form.name || !form.phone) { setFormErr('Nome e telefone obrigatórios.'); return; }
    const payload = { municipalityId, name: form.name, cpf: form.cpf||undefined, phone: form.phone, email: form.email||undefined, birthDate: form.birthDate||undefined, address: form.address||undefined, city: form.city||undefined, cnhNumber: form.cnhNumber||undefined, cnhCategory: form.cnhCategory||undefined, cnhExpiry: form.cnhExpiry||undefined, experience: form.experience?parseInt(form.experience):undefined, photo: form.photo||undefined, observations: form.observations||undefined };
    if (editId !== null) {
      update({ id: editId, ...payload }, { onSuccess: function() { refetch(); setShowModal(false); }, onError: function(e: any) { setFormErr(e?.message||'Erro'); } });
    } else {
      create(payload, { onSuccess: function() { refetch(); setShowModal(false); }, onError: function(e: any) { setFormErr(e?.message||'Erro'); } });
    }
  };

  const doDelete = function(id: number) {
    remove({ id }, { onSuccess: function() { refetch(); setConfirmDelete(null); } });
  };

  const cnhAlert = function(expiry: string) {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry).getTime()-Date.now())/86400000);
    if (days < 0) return <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={10}/> CNH vencida</span>;
    if (days < 60) return <span className="text-xs text-yellow-500 flex items-center gap-1"><AlertTriangle size={10}/> CNH vence em {days}d</span>;
    return null;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Motoristas</h1><p className="text-gray-500">{allDrivers.length} motorista(s)</p></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Motorista</button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input className="input pl-9" placeholder="Buscar por nome, telefone ou CNH..." value={search} onChange={function(e) { setSearch(e.target.value); }}/>
      </div>

      <div className="grid gap-3">
        {filtered.map(function(d: any) { return (
          <div key={d.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center flex-shrink-0">
              {d.photo ? <img src={d.photo} alt={d.name} className="w-full h-full object-cover"/> : <span className="font-bold text-orange-700 text-lg">{d.name?.[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-800">{d.name}</p>
                {d.cnhCategory && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">CNH {d.cnhCategory}</span>}
              </div>
              <div className="flex gap-3 flex-wrap text-xs text-gray-500">
                {d.phone && <span className="flex items-center gap-1"><Phone size={10}/> {d.phone}</span>}
                {d.email && <span className="flex items-center gap-1"><Mail size={10}/> {d.email}</span>}
                {d.cnhNumber && <span className="flex items-center gap-1"><FileText size={10}/> {d.cnhNumber}</span>}
                {cnhAlert(d.cnhExpiry)}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={function() { openEdit(d); }} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><Pencil size={15}/></button>
              <button onClick={function() { setConfirmDelete(d); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={15}/></button>
            </div>
          </div>
        ); })}
        {!filtered.length && !search && <div className="card text-center py-16"><Truck size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhum motorista cadastrado</p><button className="btn-primary" onClick={openNew}>Adicionar motorista</button></div>}
        {!filtered.length && search && <div className="card text-center py-8"><p className="text-gray-500">Nenhum resultado para "{search}"</p></div>}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir {confirmDelete.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={function() { setConfirmDelete(null); }} className="btn-secondary flex-1">Cancelar</button><button onClick={function() { doDelete(confirmDelete.id); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">{editId ? 'Editar Motorista' : 'Novo Motorista'}</h3>
              <button onClick={function() { setShowModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            <div className="flex gap-1 px-5 pt-4">
              {([['dados','Dados Pessoais'],['cnh','CNH']] as const).map(function(t) { return (
                <button key={t[0]} onClick={function() { setFormTab(t[0]); }} className={'px-4 py-1.5 rounded-lg text-sm font-medium transition-all ' + (formTab===t[0]?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700')}>{t[1]}</button>
              ); })}
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
              {formTab==='dados' && (
                <>
                  <div className="flex justify-center"><PhotoUpload value={form.photo} onChange={function(v: string) { setForm(function(f: any) { return { ...f, photo: v }; }); }}/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={setField('name')}/></div>
                    <div><label className="label">CPF</label><input className="input" value={form.cpf} onChange={setField('cpf')} placeholder="000.000.000-00"/></div>
                    <div><label className="label">Data de Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={setField('birthDate')}/></div>
                    <div><label className="label">Telefone *</label><input className="input" value={form.phone} onChange={setField('phone')} placeholder="(00) 00000-0000"/></div>
                    <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={setField('email')}/></div>
                    <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={setField('address')}/></div>
                    <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={setField('city')}/></div>
                    <div><label className="label">Observações</label><input className="input" value={form.observations} onChange={setField('observations')}/></div>
                  </div>
                </>
              )}
              {formTab==='cnh' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Número da CNH</label><input className="input" value={form.cnhNumber} onChange={setField('cnhNumber')}/></div>
                  <div><label className="label">Categoria</label><select className="input" value={form.cnhCategory} onChange={setField('cnhCategory')}>{CNH_CATS.map(function(c) { return <option key={c}>{c}</option>; })}</select></div>
                  <div><label className="label">Validade da CNH</label><input className="input" type="date" value={form.cnhExpiry} onChange={setField('cnhExpiry')}/></div>
                  <div><label className="label">Anos de experiência</label><input className="input" type="number" min="0" value={form.experience} onChange={setField('experience')}/></div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={function() { setShowModal(false); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Motorista'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
