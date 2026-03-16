import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Settings, Shield, Building, User, Plus, X, Pencil, Trash2, Eye, EyeOff, CheckCircle, Phone, Mail, FileText, Calendar, Hash } from 'lucide-react';

const TABS = [
  { id: 'users', label: 'Usuarios', icon: User },
  { id: 'municipality', label: 'Prefeitura', icon: Building },
  { id: 'security', label: 'Seguranca', icon: Shield },
];
const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'municipal_admin', label: 'Admin Municipal' },
  { value: 'operator', label: 'Operador' },
  { value: 'driver', label: 'Motorista' },
  { value: 'guardian', label: 'Responsavel' },
];
const RC: any = {
  super_admin: 'bg-purple-100 text-purple-700',
  municipal_admin: 'bg-primary-100 text-primary-700',
  operator: 'bg-blue-100 text-blue-700',
  driver: 'bg-orange-100 text-orange-700',
  guardian: 'bg-green-100 text-green-700',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState('users');
  const [modal, setModal] = useState(false);
  const [eid, setEid] = useState<number | null>(null);
  const [uf, setUf] = useState({ name: '', cpf: '', birthDate: '', phone: '', email: '', username: '', role: 'operator', password: '', cp: '' });
  const [sp, setSp] = useState(false);
  const [uerr, setUerr] = useState('');
  const [del, setDel] = useState<any>(null);
  const [mun, setMun] = useState({ name: '', cnpj: '', address: '', phone: '', email: '' });
  const [ms, setMs] = useState(false);
  const [sec, setSec] = useState({ cur: '', nw: '', cf: '' });
  const [sm, setSm] = useState('');

  const { data: users, refetch } = useQuery(() => api.users.list({ municipalityId: mid }), [mid]);
  const { mutate: cu, loading: cr } = useMutation(api.users.create);
  const { mutate: uu, loading: up } = useMutation(api.users.update);
  const { mutate: du } = useMutation(api.users.delete);

  const sf = (k: string, s: any) => (e: any) => s((f: any) => ({ ...f, [k]: e.target.value }));
  const all = (users as any) || [];

  const openN = () => { setUf({ name: '', cpf: '', birthDate: '', phone: '', email: '', username: '', role: 'operator', password: '', cp: '' }); setEid(null); setUerr(''); setModal(true); };
  const openE = (u: any) => { setUf({ name: u.name || '', cpf: u.cpf || '', birthDate: u.birthDate || '', phone: u.phone || '', email: u.email || '', username: u.username || '', role: u.role || 'operator', password: '', cp: '' }); setEid(u.id); setUerr(''); setModal(true); };

  const save = () => {
    if (!uf.name || !uf.email) { setUerr('Nome e e-mail obrigatorios.'); return; }
    if (!eid && !uf.password) { setUerr('Senha obrigatoria.'); return; }
    if (uf.password && uf.password !== uf.cp) { setUerr('Senhas nao coincidem.'); return; }
    const p = { municipalityId: mid, name: uf.name, cpf: uf.cpf || undefined, birthDate: uf.birthDate || undefined, phone: uf.phone || undefined, email: uf.email, username: uf.username || undefined, role: uf.role, ...(uf.password ? { password: uf.password } : {}) };
    if (eid !== null) { uu({ id: eid, ...p }, { onSuccess: () => { refetch(); setModal(false); }, onError: (e: any) => setUerr(e?.message || 'Erro') }); }
    else { cu(p, { onSuccess: () => { refetch(); setModal(false); }, onError: (e: any) => setUerr(e?.message || 'Erro') }); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Settings size={20} className="text-gray-600" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1><p className="text-gray-500">Gerencie usuarios, prefeitura e seguranca</p></div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ' + (tab === t.id ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700')}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Usuarios do Sistema</h2>
            <button onClick={openN} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Usuario</button>
          </div>
          <div className="grid gap-3">
            {all.map((u: any) => (
              <div key={u.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0">{u.name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    {u.id === user?.id && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} />Voce</span>}
                    {u.username && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">@{u.username}</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5 flex-wrap text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Mail size={10} />{u.email}</span>
                    {u.phone && <span className="flex items-center gap-1"><Phone size={10} />{u.phone}</span>}
                    {u.cpf && <span className="flex items-center gap-1"><FileText size={10} />{u.cpf}</span>}
                  </div>
                </div>
                <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (RC[u.role] || 'bg-gray-100 text-gray-600')}>{ROLES.find(r => r.value === u.role)?.label || u.role}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openE(u)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={14} /></button>
                  {u.id !== user?.id && <button onClick={() => setDel(u)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>}
                </div>
              </div>
            ))}
            {!all.length && <div className="card text-center py-10"><User size={36} className="text-gray-200 mx-auto mb-2" /><p className="text-gray-400">Nenhum usuario</p></div>}
          </div>
        </div>
      )}

      {tab === 'municipality' && (
        <div className="card max-w-2xl space-y-4">
          <h2 className="text-lg font-semibold mb-4">Dados da Prefeitura</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome da Prefeitura</label><input className="input" value={mun.name} onChange={sf('name', setMun)} placeholder="Ex: Prefeitura Municipal de Palmas" /></div>
            <div><label className="label">CNPJ</label><input className="input" value={mun.cnpj} onChange={sf('cnpj', setMun)} placeholder="00.000.000/0000-00" /></div>
            <div><label className="label">Telefone</label><input className="input" value={mun.phone} onChange={sf('phone', setMun)} /></div>
            <div className="col-span-2"><label className="label">Endereco</label><input className="input" value={mun.address} onChange={sf('address', setMun)} /></div>
            <div className="col-span-2"><label className="label">E-mail institucional</label><input className="input" type="email" value={mun.email} onChange={sf('email', setMun)} /></div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => { setMs(true); setTimeout(() => setMs(false), 3000); }} className="btn-primary flex items-center gap-2">{ms ? <><CheckCircle size={15} /> Salvo!</> : 'Salvar'}</button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card max-w-md space-y-4">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Shield size={18} className="text-primary-500" />Alterar Senha</h2>
          {sm && <div className={'p-3 rounded-lg text-sm ' + (sm.includes('sucesso') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200')}>{sm}</div>}
          <div><label className="label">Senha atual</label><div className="relative"><input type={sp ? 'text' : 'password'} className="input pr-10" value={sec.cur} onChange={sf('cur', setSec)} /><button type="button" onClick={() => setSp(v => !v)} className="absolute right-3 top-2.5 text-gray-400">{sp ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
          <div><label className="label">Nova senha</label><input type="password" className="input" value={sec.nw} onChange={sf('nw', setSec)} /></div>
          <div><label className="label">Confirmar nova senha</label><input type="password" className="input" value={sec.cf} onChange={sf('cf', setSec)} /></div>
          <button onClick={() => {
            if (!sec.cur || !sec.nw) { setSm('Preencha todos os campos.'); return; }
            if (sec.nw !== sec.cf) { setSm('Senhas nao coincidem.'); return; }
            if (sec.nw.length < 6) { setSm('Minimo 6 caracteres.'); return; }
            setSm('Senha alterada com sucesso!'); setSec({ cur: '', nw: '', cf: '' });
          }} className="btn-primary w-full">Alterar Senha</button>
        </div>
      )}

      {del && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={28} className="text-red-400 mx-auto mb-3" />
            <h3 className="font-bold mb-2">Excluir {del.name}?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acao nao pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDel(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => du({ id: del.id }, { onSuccess: () => { refetch(); setDel(null); } })} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">{eid ? 'Editar Usuario' : 'Novo Usuario'}</h3>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <div className="grid grid-cols-2 gap-3">
                {uerr && <div className="col-span-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{uerr}</div>}
                <div className="col-span-2">
                  <label className="label flex items-center gap-1"><User size={12} /> Nome Completo *</label>
                  <input className="input" value={uf.name} onChange={sf('name', setUf)} placeholder="Nome completo do usuario" />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><FileText size={12} /> CPF</label>
                  <input className="input" value={uf.cpf} onChange={sf('cpf', setUf)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Calendar size={12} /> Data de Nascimento</label>
                  <input className="input" type="date" value={uf.birthDate} onChange={sf('birthDate', setUf)} />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Phone size={12} /> Telefone</label>
                  <input className="input" value={uf.phone} onChange={sf('phone', setUf)} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Mail size={12} /> E-mail *</label>
                  <input className="input" type="email" value={uf.email} onChange={sf('email', setUf)} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Hash size={12} /> Login</label>
                  <input className="input" value={uf.username} onChange={sf('username', setUf)} placeholder="nome_usuario" />
                </div>
                <div>
                  <label className="label">Perfil de Acesso</label>
                  <select className="input" value={uf.role} onChange={sf('role', setUf)}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label flex items-center gap-1"><Shield size={12} /> {eid ? 'Nova Senha (em branco = manter)' : 'Senha *'}</label>
                  <div className="relative">
                    <input type={sp ? 'text' : 'password'} className="input pr-10" value={uf.password} onChange={sf('password', setUf)} placeholder="Minimo 6 caracteres" />
                    <button type="button" onClick={() => setSp(v => !v)} className="absolute right-3 top-2.5 text-gray-400">{sp ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                {uf.password && (
                  <div className="col-span-2">
                    <label className="label">Confirmar Senha</label>
                    <input type="password" className="input" value={uf.cp} onChange={sf('cp', setUf)} placeholder="Repita a senha" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={cr || up} className="btn-primary flex-1">{cr || up ? 'Salvando...' : eid ? 'Salvar Alteracoes' : 'Criar Usuario'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
    }
