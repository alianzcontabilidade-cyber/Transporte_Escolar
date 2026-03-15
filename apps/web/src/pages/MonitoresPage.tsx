import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { UserCheck, Plus, X, Phone, FileText, Eye, EyeOff, Camera, Star, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover"/> : <Camera size={24} className="text-gray-400"/>}
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white"><Camera size={10} className="text-white"/></div>
      </div>
      <span className="text-xs text-gray-500">Foto do monitor</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e) { const f = e.target.files?.[0]; if (f) { const rd = new FileReader(); rd.onload = function(ev) { onChange(ev.target?.result as string); }; rd.readAsDataURL(f); } }}/>
    </div>
  );
}

const emptyForm = { name:'', cpf:'', birthDate:'', phone:'', email:'', address:'', city:'', certNumber:'', certExpiry:'', experience:'0', routeName:'', shift:'morning', observations:'', password:'', confirmPassword:'', photo:'' };
const SHIFTS = [{ v:'morning', l:'Manhã' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' },{ v:'full', l:'Integral' }];

function CertAlert({ expiry }: { expiry: string }) {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={10}/> Cert. vencida</span>;
  if (days < 60) return <span className="text-xs text-yellow-600 flex items-center gap-1"><Clock size={10}/> Cert. vence em {days}d</span>;
  return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10}/> Cert. válida</span>;
}

export default function MonitoresPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [search, setSearch] = useState('');
  const [monitores, setMonitores] = useState([
    { id:1, name:'Maria Santos', cpf:'111.222.333-44', phone:'(63) 98888-1111', email:'maria@escola.gov.br', certNumber:'MON-2024-001', certExpiry:'2026-12-31', experience:'3', shift:'morning', status:'active', photo:'', routeName:'Rota Centro', observations:'Especializada em alunos com NEE' },
    { id:2, name:'Carlos Oliveira', cpf:'555.666.777-88', phone:'(63) 97777-2222', email:'carlos@escola.gov.br', certNumber:'MON-2024-002', certExpiry:'2025-06-30', experience:'1', shift:'afternoon', status:'active', photo:'', routeName:'Rota Norte', observations:'' },
  ]);

  const setField = function(k: string) { return function(e: any) { setForm(function(f: any) { return { ...f, [k]: e.target.value }; }); }; };

  const filtered = monitores.filter(function(m) {
    return m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search) || (m.routeName || '').toLowerCase().includes(search.toLowerCase());
  });

  const shiftLabel = function(v: string) { return SHIFTS.find(function(s) { return s.v === v; })?.l || v; };

  const save = function() {
    if (!form.name || !form.phone) { setFormErr('Nome e telefone são obrigatórios.'); return; }
    if (form.password && form.password !== form.confirmPassword) { setFormErr('Senhas não coincidem.'); return; }
    const newId = Math.max(0, ...monitores.map(function(m) { return m.id; })) + 1;
    setMonitores(function(prev) { return [...prev, { ...form, id: newId, status: 'active' }]; });
    setShowModal(false); setForm(emptyForm); setFormErr('');
  };

  const active = monitores.filter(function(m) { return m.status === 'active'; }).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><UserCheck size={20} className="text-teal-600"/></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitores</h1>
            <p className="text-gray-500">Auxiliares que acompanham o motorista no transporte dos alunos</p>
          </div>
        </div>
        <button onClick={function() { setForm(emptyForm); setFormErr(''); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Monitor</button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center bg-teal-50 border-0"><UserCheck size={22} className="text-teal-500 mx-auto mb-1"/><p className="text-2xl font-bold text-gray-800">{monitores.length}</p><p className="text-xs text-gray-500">Total cadastrados</p></div>
        <div className="card text-center bg-green-50 border-0"><CheckCircle size={22} className="text-green-500 mx-auto mb-1"/><p className="text-2xl font-bold text-gray-800">{active}</p><p className="text-xs text-gray-500">Ativos</p></div>
        <div className="card text-center bg-yellow-50 border-0"><AlertTriangle size={22} className="text-yellow-500 mx-auto mb-1"/><p className="text-2xl font-bold text-gray-800">{monitores.filter(function(m) { const d = Math.ceil((new Date(m.certExpiry).getTime()-Date.now())/86400000); return d<60; }).length}</p><p className="text-xs text-gray-500">Cert. a vencer</p></div>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <input className="input pl-4" placeholder="Buscar por nome, telefone ou rota..." value={search} onChange={function(e) { setSearch(e.target.value); }}/>
      </div>

      {/* Lista */}
      <div className="grid gap-3">
        {filtered.map(function(m) { return (
          <div key={m.id} className="card flex items-center gap-4 hover:border-teal-200 transition-colors">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center flex-shrink-0">
              {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover"/> : <span className="font-bold text-teal-700 text-lg">{m.name[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">{m.name}</p>
                <span className={'text-xs px-2 py-0.5 rounded-full ' + (m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>{m.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full">{shiftLabel(m.shift)}</span>
              </div>
              <div className="flex gap-3 flex-wrap mt-0.5">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {m.phone}</span>
                {m.cpf && <span className="text-xs text-gray-400">{m.cpf}</span>}
                {m.certNumber && <span className="text-xs text-gray-400 flex items-center gap-1"><FileText size={10}/> {m.certNumber}</span>}
                {m.routeName && <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">{m.routeName}</span>}
                <CertAlert expiry={m.certExpiry}/>
              </div>
              {m.observations && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.observations}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              {m.experience && <p className="text-xs font-medium text-gray-600">{m.experience} ano(s) exp.</p>}
              {m.certExpiry && <p className="text-xs text-gray-400">Cert. até {new Date(m.certExpiry).toLocaleDateString('pt-BR')}</p>}
            </div>
          </div>
        ); })}
        {!filtered.length && (
          <div className="card text-center py-12">
            <UserCheck size={40} className="text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-500">Nenhum monitor encontrado</p>
          </div>
        )}
      </div>

      {/* Modal cadastro */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck size={18} className="text-teal-600"/> Novo Monitor</h3>
              <button onClick={function() { setShowModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{formErr}</div>}

              <div className="flex justify-center">
                <PhotoUpload value={form.photo} onChange={function(v: string) { setForm(function(f: any) { return { ...f, photo: v }; }); }}/>
              </div>

              {/* Dados pessoais */}
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
                </div>
              </div>

              {/* Atuação */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">Certificação e Atuação</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Nº Certificação</label><input className="input" value={form.certNumber} onChange={setField('certNumber')} placeholder="MON-2024-001"/></div>
                  <div><label className="label">Validade da Certif.</label><input className="input" type="date" value={form.certExpiry} onChange={setField('certExpiry')}/></div>
                  <div><label className="label">Anos de experiência</label><input className="input" type="number" min="0" value={form.experience} onChange={setField('experience')}/></div>
                  <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={setField('shift')}>{SHIFTS.map(function(s) { return <option key={s.v} value={s.v}>{s.l}</option>; })}</select></div>
                  <div className="col-span-2"><label className="label">Rota vinculada</label><input className="input" value={form.routeName} onChange={setField('routeName')} placeholder="Ex: Rota Centro – Escola Municipal"/></div>
                  <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={2} value={form.observations} onChange={setField('observations')} placeholder="Especializações (NEE, primeiros socorros, etc.)..."/></div>
                </div>
              </div>

              {/* Acesso */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Acesso ao sistema <span className="font-normal text-gray-400">(opcional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Senha</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} className="input pr-10" value={form.password} onChange={setField('password')} placeholder="Mínimo 8 caracteres"/>
                      <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={function() { setShowPass(function(p) { return !p; }); }}>{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                    </div>
                  </div>
                  <div><label className="label">Confirmar Senha</label><input type="password" className="input" value={form.confirmPassword} onChange={setField('confirmPassword')}/></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={function() { setShowModal(false); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} className="btn-primary flex-1">Salvar Monitor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
