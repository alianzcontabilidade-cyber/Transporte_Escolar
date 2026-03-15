import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Settings, Shield, Building, User, Plus, X, Camera, Pencil, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';

const TABS = [
  { id: 'users', label: 'Usuários', icon: User },
  { id: 'municipality', label: 'Prefeitura', icon: Building },
  { id: 'security', label: 'Segurança', icon: Shield },
];

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'municipal_admin', label: 'Admin Municipal' },
  { value: 'operator', label: 'Operador' },
  { value: 'driver', label: 'Motorista' },
  { value: 'guardian', label: 'Responsável' },
];

const ROLE_COLORS: any = {
  super_admin: 'bg-purple-100 text-purple-700',
  municipal_admin: 'bg-primary-100 text-primary-700',
  operator: 'bg-blue-100 text-blue-700',
  driver: 'bg-orange-100 text-orange-700',
  guardian: 'bg-green-100 text-green-700',
};

function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="logo" className="w-full h-full object-cover"/> : <Camera size={24} className="text-gray-400"/>}
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white"><Camera size={10} className="text-white"/></div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e){const f=e.target.files?.[0];if(f){const rd=new FileReader();rd.onload=function(ev){onChange(ev.target?.result);};rd.readAsDataURL(f);}}}/>
    </div>
  );
}

const emptyUser = { name:'', email:'', role:'operator', password:'', confirmPassword:'' };

export default function SettingsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState<number|null>(null);
  const [userForm, setUserForm] = useState<any>(emptyUser);
  const [showPass, setShowPass] = useState(false);
  const [userErr, setUserErr] = useState('');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<any>(null);
  const [munForm, setMunForm] = useState({ name:'', cnpj:'', address:'', phone:'', email:'', logo:'' });
  const [munSaved, setMunSaved] = useState(false);
  const [secForm, setSecForm] = useState({ currentPassword:'', newPassword:'', confirmNewPassword:'' });
  const [secMsg, setSecMsg] = useState('');

  const { data: users, refetch: refetchUsers } = useQuery(function(){ return api.users.list({ municipalityId }); }, [municipalityId]);
  const { mutate: createUser, loading: creatingUser } = useMutation(api.users.create);
  const { mutate: updateUser, loading: updatingUser } = useMutation(api.users.update);
  const { mutate: deleteUser } = useMutation(api.users.delete);

  const sf = function(k: string, setter: any){ return function(e: any){ setter((f: any) => ({...f, [k]: e.target.value})); }; };
  const allUsers = (users as any)||[];

  const openNewUser = function(){ setUserForm(emptyUser); setEditUserId(null); setUserErr(''); setShowUserModal(true); };
  const openEditUser = function(u: any){ setUserForm({...emptyUser, name:u.name, email:u.email, role:u.role}); setEditUserId(u.id); setUserErr(''); setShowUserModal(true); };

  const saveUser = function(){
    if (!userForm.name||!userForm.email){ setUserErr('Nome e e-mail obrigatórios.'); return; }
    if (!editUserId && !userForm.password){ setUserErr('Senha obrigatória para novo usuário.'); return; }
    if (userForm.password && userForm.password !== userForm.confirmPassword){ setUserErr('Senhas não coincidem.'); return; }
    const payload = { municipalityId, name:userForm.name, email:userForm.email, role:userForm.role, ...(userForm.password?{password:userForm.password}:{}) };
    if (editUserId!==null){
      updateUser({id:editUserId,...payload},{onSuccess:function(){refetchUsers();setShowUserModal(false);},onError:function(e:any){setUserErr(e?.message||'Erro');}});
    } else {
      createUser(payload,{onSuccess:function(){refetchUsers();setShowUserModal(false);},onError:function(e:any){setUserErr(e?.message||'Erro');}});
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Settings size={20} className="text-gray-600"/></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Configurações</h1><p className="text-gray-500">Gerencie usuários, prefeitura e segurança</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(function(tab){return(
          <button key={tab.id} onClick={function(){setActiveTab(tab.id);}} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all '+(activeTab===tab.id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700')}>
            <tab.icon size={15}/>{tab.label}
          </button>
        );})}
      </div>

      {/* ABA: Usuários */}
      {activeTab==='users'&&(
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Usuários do Sistema</h2>
            <button onClick={openNewUser} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Usuário</button>
          </div>
          <div className="grid gap-3">
            {allUsers.map(function(u: any){ return(
              <div key={u.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0">{u.name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{u.name}</p>{u.id===user?.id&&<span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/>Você</span>}</div>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <span className={'text-xs px-2 py-0.5 rounded-full font-medium '+(ROLE_COLORS[u.role]||'bg-gray-100 text-gray-600')}>{ROLES.find(r=>r.value===u.role)?.label||u.role}</span>
                <div className="flex items-center gap-1">
                  <button onClick={function(){openEditUser(u);}} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={14}/></button>
                  {u.id!==user?.id&&<button onClick={function(){setConfirmDeleteUser(u);}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>}
                </div>
              </div>
            );})}
            {!allUsers.length&&<div className="card text-center py-10"><User size={36} className="text-gray-200 mx-auto mb-2"/><p className="text-gray-400">Nenhum usuário cadastrado</p></div>}
          </div>
        </div>
      )}

      {/* ABA: Prefeitura */}
      {activeTab==='municipality'&&(
        <div className="card max-w-2xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados da Prefeitura</h2>
          <div className="flex justify-center mb-4">
            <PhotoUpload value={munForm.logo} onChange={function(v:string){setMunForm(f=>({...f,logo:v}));}}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome da Prefeitura</label><input className="input" value={munForm.name} onChange={sf('name',setMunForm)} placeholder="Ex: Prefeitura Municipal de Palmas"/></div>
            <div><label className="label">CNPJ</label><input className="input" value={munForm.cnpj} onChange={sf('cnpj',setMunForm)} placeholder="00.000.000/0000-00"/></div>
            <div><label className="label">Telefone</label><input className="input" value={munForm.phone} onChange={sf('phone',setMunForm)} placeholder="(00) 0000-0000"/></div>
            <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={munForm.address} onChange={sf('address',setMunForm)}/></div>
            <div className="col-span-2"><label className="label">E-mail institucional</label><input className="input" type="email" value={munForm.email} onChange={sf('email',setMunForm)}/></div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={function(){setMunSaved(true);setTimeout(function(){setMunSaved(false);},3000);}} className="btn-primary flex items-center gap-2">{munSaved?<><CheckCircle size={15}/> Salvo!</>:'Salvar'}</button>
          </div>
        </div>
      )}

      {/* ABA: Segurança */}
      {activeTab==='security'&&(
        <div className="card max-w-md space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2"><Shield size={18} className="text-primary-500"/>Alterar Senha</h2>
          {secMsg&&<div className={'p-3 rounded-lg text-sm '+(secMsg.includes('sucesso')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-600 border border-red-200')}>{secMsg}</div>}
          <div><label className="label">Senha atual</label>
            <div className="relative"><input type={showPass?'text':'password'} className="input pr-10" value={secForm.currentPassword} onChange={sf('currentPassword',setSecForm)}/><button type="button" onClick={function(){setShowPass(p=>!p);}} className="absolute right-3 top-2.5 text-gray-400">{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
          </div>
          <div><label className="label">Nova senha</label><input type="password" className="input" value={secForm.newPassword} onChange={sf('newPassword',setSecForm)}/></div>
          <div><label className="label">Confirmar nova senha</label><input type="password" className="input" value={secForm.confirmNewPassword} onChange={sf('confirmNewPassword',setSecForm)}/></div>
          <button onClick={function(){
            if(!secForm.currentPassword||!secForm.newPassword){setSecMsg('Preencha todos os campos.');return;}
            if(secForm.newPassword!==secForm.confirmNewPassword){setSecMsg('Novas senhas não coincidem.');return;}
            if(secForm.newPassword.length<6){setSecMsg('Senha deve ter pelo menos 6 caracteres.');return;}
            setSecMsg('Senha alterada com sucesso!');
            setSecForm({currentPassword:'',newPassword:'',confirmNewPassword:''});
          }} className="btn-primary w-full">Alterar Senha</button>
        </div>
      )}

      {/* Modal Confirmar Exclusão Usuário */}
      {confirmDeleteUser&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={28} className="text-red-400 mx-auto mb-3"/>
            <h3 className="font-bold mb-2">Excluir {confirmDeleteUser.name}?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Settings, Shield, Building, User, Plus, X, Camera, Pencil, Trash2, Eye, EyeOff, CheckCircle } from 'lucide-react';

const TABS = [
  { id: 'users', label: 'Usuários', icon: User },
  { id: 'municipality', label: 'Prefeitura', icon: Building },
  { id: 'security', label: 'Segurança', icon: Shield },
];

const ROLES = [
  { value:'super_admin', label:'Super Admin' },
  { value:'municipal_admin', label:'Admin Municipal' },
  { value:'operator', label:'Operador' },
  { value:'driver', label:'Motorista' },
  { value:'guardian', label:'Responsável' },
];

const ROLE_COLORS: any = {
  super_admin:'bg-purple-100 text-purple-700',
  municipal_admin:'bg-primary-100 text-primary-700',
  operator:'bg-blue-100 text-blue-700',
  driver:'bg-orange-100 text-orange-700',
  guardian:'bg-green-100 text-green-700',
};

function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400" onClick={() => ref.current?.click()}>
        {value?<img src={value} alt="logo" className="w-full h-full object-cover"/>:<Camera size={24} className="text-gray-400"/>}
        <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white"><Camera size={10} className="text-white"/></div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e){const f=e.target.files?.[0];if(f){const rd=new FileReader();rd.onload=function(ev){onChange(ev.target?.result);};rd.readAsDataURL(f);}}}/>
    </div>
  );
}

const emptyUser = { name:'', email:'', role:'operator', password:'', confirmPassword:'' };

export default function SettingsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUserId, setEditUserId] = useState<number|null>(null);
  const [userForm, setUserForm] = useState<any>(emptyUser);
  const [showPass, setShowPass] = useState(false);
  const [userErr, setUserErr] = useState('');
  const [confirmDelUser, setConfirmDelUser] = useState<any>(null);
  const [munForm, setMunForm] = useState({ name:'', cnpj:'', address:'', phone:'', email:'', logo:'' });
  const [munSaved, setMunSaved] = useState(false);
  const [secForm, setSecForm] = useState({ cur:'', nw:'', conf:'' });
  const [secMsg, setSecMsg] = useState('');

  const { data: users, refetch } = useQuery(function(){ return api.users.list({ municipalityId }); }, [municipalityId]);
  const { mutate: createUser, loading: creating } = useMutation(api.users.create);
  const { mutate: updateUser, loading: updating } = useMutation(api.users.update);
  const { mutate: deleteUser } = useMutation(api.users.delete);

  const sf = function(k:string, set:any){ return function(e:any){ set((f:any)=>({...f,[k]:e.target.value})); }; };
  const allUsers = (users as any)||[];

  const openNew = function(){ setUserForm(emptyUser); setEditUserId(null); setUserErr(''); setShowUserModal(true); };
  const openEdit = function(u:any){ setUserForm({...emptyUser,name:u.name,email:u.email,role:u.role}); setEditUserId(u.id); setUserErr(''); setShowUserModal(true); };

  const saveUser = function(){
    if(!userForm.name||!userForm.email){ setUserErr('Nome e e-mail obrigatórios.'); return; }
    if(!editUserId&&!userForm.password){ setUserErr('Senha obrigatória para novo usuário.'); return; }
    if(userForm.password&&userForm.password!==userForm.confirmPassword){ setUserErr('Senhas não coincidem.'); return; }
    const p = { municipalityId, name:userForm.name, email:userForm.email, role:userForm.role, ...(userForm.password?{password:userForm.password}:{}) };
    if(editUserId!==null){ updateUser({id:editUserId,...p},{onSuccess:function(){refetch();setShowUserModal(false);},onError:function(e:any){setUserErr(e?.message||'Erro');}}); }
    else { createUser(p,{onSuccess:function(){refetch();setShowUserModal(false);},onError:function(e:any){setUserErr(e?.message||'Erro');}}); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Settings size={20} className="text-gray-600"/></div>
        <div><h1 className="text-2xl font-bold text-gray-900">Configurações</h1><p className="text-gray-500">Gerencie usuários, prefeitura e segurança</p></div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(function(tab){return(
          <button key={tab.id} onClick={function(){setActiveTab(tab.id);}} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all '+(activeTab===tab.id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700')}>
            <tab.icon size={15}/>{tab.label}
          </button>
        );})}
      </div>

      {activeTab==='users'&&(
        <div>
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-800">Usuários do Sistema</h2><button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Usuário</button></div>
          <div className="grid gap-3">
            {allUsers.map(function(u:any){return(
              <div key={u.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0">{u.name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{u.name}</p>{u.id===user?.id&&<span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/>Você</span>}</div>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <span className={'text-xs px-2 py-0.5 rounded-full font-medium '+(ROLE_COLORS[u.role]||'bg-gray-100 text-gray-600')}>{ROLES.find(r=>r.value===u.role)?.label||u.role}</span>
                <div className="flex items-center gap-1">
                  <button onClick={function(){openEdit(u);}} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={14}/></button>
                  {u.id!==user?.id&&<button onClick={function(){setConfirmDelUser(u);}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>}
                </div>
              </div>
            );})}
            {!allUsers.length&&<div className="card text-center py-10"><User size={36} className="text-gray-200 mx-auto mb-2"/><p className="text-gray-400">Nenhum usuário cadastrado</p></div>}
          </div>
        </div>
      )}

      {activeTab==='municipality'&&(
        <div className="card max-w-2xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados da Prefeitura</h2>
          <div className="flex justify-center mb-4"><PhotoUpload value={munForm.logo} onChange={function(v:string){setMunForm(f=>({...f,logo:v}));}}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome da Prefeitura</label><input className="input" value={munForm.name} onChange={sf('name',setMunForm)} placeholder="Ex: Prefeitura Municipal de Palmas"/></div>
            <div><label className="label">CNPJ</label><input className="input" value={munForm.cnpj} onChange={sf('cnpj',setMunForm)} placeholder="00.000.000/0000-00"/></div>
            <div><label className="label">Telefone</label><input className="input" value={munForm.phone} onChange={sf('phone',setMunForm)} placeholder="(00) 0000-0000"/></div>
            <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={munForm.address} onChange={sf('address',setMunForm)}/></div>
            <div className="col-span-2"><label className="label">E-mail institucional</label><input className="input" type="email" value={munForm.email} onChange={sf('email',setMunForm)}/></div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={function(){setMunSaved(true);setTimeout(function(){setMunSaved(false);},3000);}} className="btn-primary flex items-center gap-2">{munSaved?<><CheckCircle size={15}/> Salvo!</>:'Salvar'}</button>
          </div>
        </div>
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Settings, Shield, Building, User, Plus, X, Pencil, Trash2, Eye, EyeOff, CheckCircle, Camera } from 'lucide-react';

const TABS = [
  { id: 'users', label: 'Usuários', icon: User },
  { id: 'municipality', label: 'Prefeitura', icon: Building },
  { id: 'security', label: 'Segurança', icon: Shield },
];
const ROLES = [
  { value:'super_admin', label:'Super Admin' },
  { value:'municipal_admin', label:'Admin Municipal' },
  { value:'operator', label:'Operador' },
  { value:'driver', label:'Motorista' },
  { value:'guardian', label:'Responsável' },
];
const RC: any = { super_admin:'bg-purple-100 text-purple-700', municipal_admin:'bg-primary-100 text-primary-700', operator:'bg-blue-100 text-blue-700', driver:'bg-orange-100 text-orange-700', guardian:'bg-green-100 text-green-700' };

export default function SettingsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState('users');
  const [modal, setModal] = useState(false);
  const [eid, setEid] = useState<number|null>(null);
  const [uf, setUf] = useState<any>({ name:'', email:'', role:'operator', password:'', cp:'' });
  const [sp, setSp] = useState(false);
  const [uerr, setUerr] = useState('');
  const [del, setDel] = useState<any>(null);
  const [mun, setMun] = useState({ name:'', cnpj:'', address:'', phone:'', email:'' });
  const [ms, setMs] = useState(false);
  const [sec, setSec] = useState({ cur:'', nw:'', cf:'' });
  const [sm, setSm] = useState('');
  const { data: users, refetch } = useQuery(function(){ return api.users.list({ municipalityId: mid }); }, [mid]);
  const { mutate: cu, loading: cr } = useMutation(api.users.create);
  const { mutate: uu, loading: up } = useMutation(api.users.update);
  const { mutate: du } = useMutation(api.users.delete);
  const sf = function(k:string, s:any){ return function(e:any){ s((f:any)=>({...f,[k]:e.target.value})); }; };
  const all = (users as any)||[];
  const openN = function(){ setUf({name:'',email:'',role:'operator',password:'',cp:''});setEid(null);setUerr('');setModal(true); };
  const openE = function(u:any){ setUf({name:u.name,email:u.email,role:u.role,password:'',cp:''});setEid(u.id);setUerr('');setModal(true); };
  const save = function(){
    if(!uf.name||!uf.email){setUerr('Nome e e-mail obrigatórios.');return;}
    if(!eid&&!uf.password){setUerr('Senha obrigatória.');return;}
    if(uf.password&&uf.password!==uf.cp){setUerr('Senhas não coincidem.');return;}
    const p={municipalityId:mid,name:uf.name,email:uf.email,role:uf.role,...(uf.password?{password:uf.password}:{})};
    if(eid!==null){uu({id:eid,...p},{onSuccess:function(){refetch();setModal(false);},onError:function(e:any){setUerr(e?.message||'Erro');}});}
    else{cu(p,{onSuccess:function(){refetch();setModal(false);},onError:function(e:any){setUerr(e?.message||'Erro');}});}
  };
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Settings size={20} className="text-gray-600"/></div><div><h1 className="text-2xl font-bold text-gray-900">Configurações</h1><p className="text-gray-500">Gerencie usuários, prefeitura e segurança</p></div></div>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(function(t){return(<button key={t.id} onClick={function(){setTab(t.id);}} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all '+(tab===t.id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700')}><t.icon size={15}/>{t.label}</button>);})}
      </div>
      {tab==='users'&&(<div><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Usuários do Sistema</h2><button onClick={openN} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Usuário</button></div><div className="grid gap-3">{all.map(function(u:any){return(<div key={u.id} className="card flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0">{u.name?.charAt(0)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{u.name}</p>{u.id===user?.id&&<span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/>Você</span>}</div><p className="text-sm text-gray-500">{u.email}</p></div><span className={'text-xs px-2 py-0.5 rounded-full font-medium '+(RC[u.role]||'bg-gray-100 text-gray-600')}>{ROLES.find(r=>r.value===u.role)?.label||u.role}</span><div className="flex items-center gap-1"><button onClick={function(){openE(u);}} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={14}/></button>{u.id!==user?.id&&<button onClick={function(){setDel(u);}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>}</div></div>);})}{!all.length&&<div className="card text-center py-10"><User size={36} className="text-gray-200 mx-auto mb-2"/><p className="text-gray-400">Nenhum usuário</p></div>}</div></div>)}
      {tab==='municipality'&&(<div className="card max-w-2xl space-y-4"><h2 className="text-lg font-semibold mb-4">Dados da Prefeitura</h2><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="label">Nome da Prefeitura</label><input className="input" value={mun.name} onChange={sf('name',setMun)} placeholder="Ex: Prefeitura Municipal de Palmas"/></div><div><label className="label">CNPJ</label><input className="input" value={mun.cnpj} onChange={sf('cnpj',setMun)} placeholder="00.000.000/0000-00"/></div><div><label className="label">Telefone</label><input className="input" value={mun.phone} onChange={sf('phone',setMun)}/></div><div className="col-span-2"><label className="label">Endereço</label><input className="input" value={mun.address} onChange={sf('address',setMun)}/></div><div className="col-span-2"><label className="label">E-mail institucional</label><input className="input" type="email" value={mun.email} onChange={sf('email',setMun)}/></div></div><div className="flex justify-end"><button onClick={function(){setMs(true);setTimeout(function(){setMs(false);},3000);}} className="btn-primary flex items-center gap-2">{ms?<><CheckCircle size={15}/> Salvo!</>:'Salvar'}</button></div></div>)}
      {tab==='security'&&(<div className="card max-w-md space-y-4"><h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Shield size={18} className="text-primary-500"/>Alterar Senha</h2>{sm&&<div className={'p-3 rounded-lg text-sm '+(sm.includes('sucesso')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-600 border border-red-200')}>{sm}</div>}<div><label className="label">Senha atual</label><div className="relative"><input type={sp?'text':'password'} className="input pr-10" value={sec.cur} onChange={sf('cur',setSec)}/><button type="button" onClick={function(){setSp(p=>!p);}} className="absolute right-3 top-2.5 text-gray-400">{sp?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div><div><label className="label">Nova senha</label><input type="password" className="input" value={sec.nw} onChange={sf('nw',setSec)}/></div><div><label className="label">Confirmar nova senha</label><input type="password" className="input" value={sec.cf} onChange={sf('cf',setSec)}/></div><button onClick={function(){if(!sec.cur||!sec.nw){setSm('Preencha todos os campos.');return;}if(sec.nw!==sec.cf){setSm('Senhas não coincidem.');return;}if(sec.nw.length<6){setSm('Mínimo 6 caracteres.');return;}setSm('Senha alterada com sucesso!');setSec({cur:'',nw:'',cf:''}); }} className="btn-primary w-full">Alterar Senha</button></div>)}
      {del&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3"/><h3 className="font-bold mb-2">Excluir {del.name}?</h3><p className="text-sm text-gray-500 mb-5">Esta ação não pode ser desfeita.</p><div className="flex gap-3"><button onClick={function(){setDel(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){du({id:del.id},{onSuccess:function(){refetch();setDel(null);}});}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}
      {modal&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]"><div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{eid?'Editar Usuário':'Novo Usuário'}</h3><button onClick={function(){setModal(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div><div className="overflow-y-auto flex-1 p-5 space-y-3">{uerr&&<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{uerr}</div>}<div><label className="label">Nome *</label><input className="input" value={uf.name} onChange={sf('name',setUf)}/></div><div><label className="label">E-mail *</label><input className="input" type="email" value={uf.email} onChange={sf('email',setUf)}/></div><div><label className="label">Perfil</label><select className="input" value={uf.role} onChange={sf('role',setUf)}>{ROLES.map(function(r){return <option key={r.value} value={r.value}>{r.label}</option>;})}</select></div><div><label className="label">{eid?'Nova senha (em branco = manter)':'Senha *'}</label><div className="relative"><input type={sp?'text':'password'} className="input pr-10" value={uf.password} onChange={sf('password',setUf)} placeholder="Mínimo 6 caracteres"/><button type="button" onClick={function(){setSp(p=>!p);}} className="absolute right-3 top-2.5 text-gray-400">{sp?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>{uf.password&&<div><label className="label">Confirmar senha</label><input type="password" className="input" value={uf.cp} onChange={sf('cp',setUf)}/></div>}</div><div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={cr||up} className="btn-primary flex-1">{cr||up?'Salvando...':eid?'Salvar alterações':'Criar Usuário'}</button></div></div></div>)}
    </div>
  );
      }
