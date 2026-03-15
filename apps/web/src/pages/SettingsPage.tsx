import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { User, Settings, Shield, Building, Key, Plus, Edit2, Trash2, Eye, EyeOff, X, Save, Camera } from 'lucide-react';

const ROLES = [
  { value: 'municipal_admin', label: 'Administrador Municipal', color: 'bg-purple-100 text-purple-700' },
  { value: 'secretary', label: 'Secretário de Educação', color: 'bg-blue-100 text-blue-700' },
  { value: 'operator', label: 'Operador', color: 'bg-green-100 text-green-700' },
  { value: 'driver', label: 'Motorista', color: 'bg-orange-100 text-orange-700' },
  { value: 'monitor', label: 'Monitor', color: 'bg-yellow-100 text-yellow-700' },
];
const TABS = [
  { id: 'users', label: 'Usuários', icon: User },
  { id: 'profile', label: 'Meu Perfil', icon: Settings },
  { id: 'municipality', label: 'Prefeitura', icon: Building },
  { id: 'security', label: 'Segurança', icon: Shield },
];
const fmt = (v: string, type: string) => {
  if (type==='cpf') return v.replace(/\D/g,'').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/,'$1.$2.$3-$4').substring(0,14);
  if (type==='phone') return v.replace(/\D/g,'').replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3').substring(0,15);
  if (type==='cnpj') return v.replace(/\D/g,'').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5').substring(0,18);
  return v;
};

function PhotoUpload({ value, onChange, label, rounded=true, size='md' }: any) {
  const ref = useRef<HTMLInputElement>(null);
  const dim = size==='lg'?'w-32 h-32':'w-20 h-20';
  const rx = rounded?'rounded-full':'rounded-xl';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${dim} ${rx} bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors`} onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-400" />}
      </div>
      <span className="text-xs text-gray-500 text-center">{label}</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => onChange(ev.target?.result as string); r.readAsDataURL(f); } }} />
    </div>
  );
}

interface UserForm { id?: number; fullName: string; cpf: string; birthDate: string; email: string; phone: string; role: string; login: string; password: string; confirmPassword: string; active: boolean; }
const emptyUser: UserForm = { fullName:'',cpf:'',birthDate:'',email:'',phone:'',role:'operator',login:'',password:'',confirmPassword:'',active:true };

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserForm>(emptyUser);
  const [showPass, setShowPass] = useState(false);
  const [users, setUsers] = useState([{ id:1, fullName:user?.name||'', cpf:'000.000.000-00', birthDate:'', email:user?.email||'', phone:'(63) 99206-7951', role:'municipal_admin', login:user?.email||'', active:true }]);
  const [formErr, setFormErr] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [profile, setProfile] = useState({ fullName:user?.name||'', email:user?.email||'', phone:'', cpf:'', birthDate:'', photo:'' });
  const [mun, setMun] = useState({ name:'', cnpj:'', state:'', city:'', address:'', phone:'', email:'', responsible:'', logo:'' });
  const [pwd, setPwd] = useState({ current:'', novo:'', confirm:'' });
  const [showPwds, setShowPwds] = useState({ current:false, novo:false, confirm:false });

  const showSuccess = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000); };
  const openNew = () => { setEditingUser(emptyUser); setFormErr(''); setShowModal(true); };
  const openEdit = (u: any) => { setEditingUser({...u,password:'',confirmPassword:''}); setFormErr(''); setShowModal(true); };
  const deleteUser = (id: number) => { if (confirm('Excluir usuário?')) setUsers(u => u.filter(x => x.id!==id)); };
  const saveUser = () => {
    if (!editingUser.fullName||!editingUser.email||!editingUser.login) { setFormErr('Preencha os campos obrigatórios.'); return; }
    if (!editingUser.id&&!editingUser.password) { setFormErr('Informe uma senha.'); return; }
    if (editingUser.password&&editingUser.password!==editingUser.confirmPassword) { setFormErr('Senhas não coincidem.'); return; }
    if (!editingUser.id) setUsers(u => [...u,{...editingUser,id:Math.max(0,...u.map(x=>x.id||0))+1}]);
    else setUsers(u => u.map(x => x.id===editingUser.id?{...x,...editingUser}:x));
    setShowModal(false); showSuccess('Usuário salvo!');
  };
  const roleInfo = (r: string) => ROLES.find(x => x.value===r)||ROLES[2];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Configurações</h1><p className="text-gray-500 mt-1">Gerencie usuários, perfis e dados do sistema</p></div>
      {saveMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"><Shield size={16}/> {saveMsg}</div>}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => { const Icon=t.icon; return (<button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}><Icon size={16}/> {t.label}</button>); })}
      </div>

      {tab==='users' && (
        <div>
          <div className="flex justify-between items-center mb-4"><div><h2 className="text-lg font-semibold text-gray-800">Usuários do Sistema</h2><p className="text-sm text-gray-500">{users.length} usuário(s)</p></div><button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Usuário</button></div>
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200"><tr>{['Usuário','CPF','Contato','Perfil','Status','Ações'].map(h => <th key={h} className={`text-${h==='Ações'?'right':'left'} px-4 py-3 text-xs font-semibold text-gray-500 uppercase`}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => { const role=roleInfo(u.role); return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">{u.fullName.charAt(0)}</div><div><p className="font-medium text-gray-800 text-sm">{u.fullName}</p><p className="text-xs text-gray-400">{u.login}</p></div></div></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.cpf||'—'}</td>
                    <td className="px-4 py-3"><p className="text-sm text-gray-600">{u.email}</p><p className="text-xs text-gray-400">{u.phone}</p></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>{role.label}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${u.active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{u.active?'Ativo':'Inativo'}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg mr-1"><Edit2 size={15}/></button>{u.id!==1&&<button onClick={() => deleteUser(u.id!)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button>}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='profile' && (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Meu Perfil</h2>
          <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
            <PhotoUpload value={profile.photo} onChange={(v: string) => setProfile(p => ({...p,photo:v}))} label="Alterar foto" />
            <div><p className="font-semibold text-gray-800">{user?.name}</p><p className="text-sm text-gray-500">{roleInfo(user?.role||'').label}</p><p className="text-sm text-gray-400">{user?.email}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome Completo *</label><input className="input" value={profile.fullName} onChange={e => setProfile(p => ({...p,fullName:e.target.value}))} /></div>
            <div><label className="label">CPF</label><input className="input" value={profile.cpf} onChange={e => setProfile(p => ({...p,cpf:fmt(e.target.value,'cpf')}))} placeholder="000.000.000-00" /></div>
            <div><label className="label">Data de Nascimento</label><input className="input" type="date" value={profile.birthDate} onChange={e => setProfile(p => ({...p,birthDate:e.target.value}))} /></div>
            <div><label className="label">Telefone</label><input className="input" value={profile.phone} onChange={e => setProfile(p => ({...p,phone:fmt(e.target.value,'phone')}))} /></div>
            <div><label className="label">E-mail *</label><input className="input" type="email" value={profile.email} onChange={e => setProfile(p => ({...p,email:e.target.value}))} /></div>
          </div>
          <button onClick={() => showSuccess('Perfil atualizado!')} className="btn-primary mt-4 flex items-center gap-2"><Save size={16}/> Salvar Perfil</button>
        </div>
      )}

      {tab==='municipality' && (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados da Prefeitura</h2>
          <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
            <PhotoUpload value={mun.logo} onChange={(v: string) => setMun(m => ({...m,logo:v}))} label="Logo da prefeitura" rounded={false} size="lg" />
            <div>
              <p className="font-medium text-gray-700 text-sm">Importe o brasão ou logo da prefeitura</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG. Recomendado 200×200px</p>
              {mun.logo && <button onClick={() => setMun(m => ({...m,logo:''}))} className="text-xs text-red-500 hover:underline mt-2 block">Remover logo</button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome da Prefeitura *</label><input className="input" value={mun.name} onChange={e => setMun(m => ({...m,name:e.target.value}))} /></div>
            <div><label className="label">CNPJ</label><input className="input" value={mun.cnpj} onChange={e => setMun(m => ({...m,cnpj:fmt(e.target.value,'cnpj')}))} placeholder="00.000.000/0000-00" /></div>
            <div><label className="label">Responsável</label><input className="input" value={mun.responsible} onChange={e => setMun(m => ({...m,responsible:e.target.value}))} /></div>
            <div><label className="label">Estado</label><input className="input" value={mun.state} onChange={e => setMun(m => ({...m,state:e.target.value}))} /></div>
            <div><label className="label">Cidade</label><input className="input" value={mun.city} onChange={e => setMun(m => ({...m,city:e.target.value}))} /></div>
            <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={mun.address} onChange={e => setMun(m => ({...m,address:e.target.value}))} /></div>
            <div><label className="label">Telefone</label><input className="input" value={mun.phone} onChange={e => setMun(m => ({...m,phone:fmt(e.target.value,'phone')}))} /></div>
            <div><label className="label">E-mail</label><input className="input" type="email" value={mun.email} onChange={e => setMun(m => ({...m,email:e.target.value}))} /></div>
          </div>
          <button onClick={() => showSuccess('Dados salvos!')} className="btn-primary mt-4 flex items-center gap-2"><Save size={16}/> Salvar</button>
        </div>
      )}

      {tab==='security' && (
        <div className="card max-w-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Alterar Senha</h2>
          <div className="space-y-4">
            {(['current','novo','confirm'] as const).map((f,i) => (
              <div key={f}><label className="label">{['Senha atual','Nova senha','Confirmar nova senha'][i]}</label>
                <div className="relative"><input type={showPwds[f]?'text':'password'} className="input pr-10" value={pwd[f]} onChange={e => setPwd(p => ({...p,[f]:e.target.value}))} />
                  <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPwds(p => ({...p,[f]:!p[f]}))}>
                    {showPwds[f]?<EyeOff size={18}/>:<Eye size={18}/>}
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-600"><p className="font-medium mb-1">Requisitos:</p><ul className="list-disc list-inside space-y-0.5"><li>Mínimo 8 caracteres</li><li>Maiúscula e minúscula</li><li>Número e caractere especial</li></ul></div>
            <button onClick={() => { showSuccess('Senha alterada!'); setPwd({current:'',novo:'',confirm:''}); }} className="btn-primary w-full flex items-center justify-center gap-2"><Key size={16}/> Alterar Senha</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editingUser.id?'Editar Usuário':'Novo Usuário'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Nome Completo *</label><input className="input" value={editingUser.fullName} onChange={e => setEditingUser(u => ({...u,fullName:e.target.value}))} /></div>
                <div><label className="label">CPF</label><input className="input" value={editingUser.cpf} onChange={e => setEditingUser(u => ({...u,cpf:fmt(e.target.value,'cpf')}))} placeholder="000.000.000-00" /></div>
                <div><label className="label">Data de Nascimento</label><input className="input" type="date" value={editingUser.birthDate} onChange={e => setEditingUser(u => ({...u,birthDate:e.target.value}))} /></div>
                <div><label className="label">E-mail *</label><input className="input" type="email" value={editingUser.email} onChange={e => setEditingUser(u => ({...u,email:e.target.value}))} /></div>
                <div><label className="label">Telefone</label><input className="input" value={editingUser.phone} onChange={e => setEditingUser(u => ({...u,phone:fmt(e.target.value,'phone')}))} /></div>
                <div><label className="label">Login *</label><input className="input" value={editingUser.login} onChange={e => setEditingUser(u => ({...u,login:e.target.value}))} /></div>
                <div><label className="label">Perfil *</label><select className="input" value={editingUser.role} onChange={e => setEditingUser(u => ({...u,role:e.target.value}))}>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                <div><label className="label">{editingUser.id?'Nova Senha (opcional)':'Senha *'}</label>
                  <div className="relative"><input type={showPass?'text':'password'} className="input pr-10" value={editingUser.password} onChange={e => setEditingUser(u => ({...u,password:e.target.value}))} /><button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPass(p=>!p)}>{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
                </div>
                <div><label className="label">Confirmar Senha</label><input type="password" className="input" value={editingUser.confirmPassword} onChange={e => setEditingUser(u => ({...u,confirmPassword:e.target.value}))} /></div>
                <div className="col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><input type="checkbox" id="active" checked={editingUser.active} onChange={e => setEditingUser(u => ({...u,active:e.target.checked}))} className="w-4 h-4 accent-primary-500" /><label htmlFor="active" className="text-sm">Usuário ativo — pode acessar o sistema</label></div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={saveUser} className="btn-primary flex-1 flex items-center justify-center gap-2"><Save size={16}/> Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
