import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Settings, Shield, Building, User, Plus, X, Pencil, Trash2, Eye, EyeOff, CheckCircle, Phone, Mail, FileText, Calendar, Hash, Bell } from 'lucide-react';
import { maskCPF, validateCPF, maskCNPJ, validateCNPJ, maskPhone } from '../lib/utils';
const TABS=[{id:'users',label:'Usuários',icon:User},{id:'security',label:'Segurança',icon:Shield},{id:'notifications',label:'Notificações',icon:Bell}];
const ROLES=[{value:'super_admin',label:'Super Admin'},{value:'municipal_admin',label:'Admin Municipal'},{value:'secretary',label:'Secretário'},{value:'school_admin',label:'Admin Escola'},{value:'driver',label:'Motorista'},{value:'monitor',label:'Monitor'},{value:'parent',label:'Responsável'}];
const RC:Record<string,string>={super_admin:'bg-purple-100 text-purple-700',municipal_admin:'bg-primary-100 text-primary-700',secretary:'bg-blue-100 text-blue-700',school_admin:'bg-indigo-100 text-indigo-700',driver:'bg-orange-100 text-orange-700',monitor:'bg-teal-100 text-teal-700',parent:'bg-green-100 text-green-700'};
const E0={name:'',cpf:'',birthDate:'',phone:'',email:'',username:'',role:'secretary',password:'',cp:''};
export default function SettingsPage(){
  const {user}=useAuth();
  const mid=user?.municipalityId||0;
  const [tab,setTab]=useState('users');
  const [modal,setModal]=useState(false);
  const [eid,setEid]=useState<number|null>(null);
  const [uf,setUf]=useState({...E0});
  const [sp,setSp]=useState(false);
  const [uerr,setUerr]=useState('');
  const [del,setDel]=useState<any>(null);
  const [mun,setMun]=useState({name:'',cnpj:'',address:'',phone:'',email:''});
  const [ms,setMs]=useState(false);
  const [sec,setSec]=useState({cur:'',nw:'',cf:''});
  const [sm,setSm]=useState('');
  const [cpfError,setCpfError]=useState('');
  const [cnpjError,setCnpjError]=useState('');
  const {data:users,refetch}=useQuery(()=>api.users.list({municipalityId:mid}),[mid]);
  const {mutate:cu,loading:cr}=useMutation(api.users.create);
  const {mutate:uu,loading:up}=useMutation(api.users.update);
  const {mutate:du}=useMutation(api.users.delete);
  useEffect(()=>{if(mid)api.municipalities.getById({id:mid}).then((m:any)=>{if(m)setMun({name:m.name||'',cnpj:m.cnpj||'',address:m.address||'',phone:m.phone||'',email:m.email||''});}).catch(()=>{});},[mid]);
  const sf=(k:string)=>(e:any)=>setUf(f=>({...f,[k]:e.target.value}));
  const all:any[]=(users as any)||[];
  const openN=()=>{setUf({...E0});setEid(null);setUerr('');setCpfError('');setModal(true);};
  const openE=(u:any)=>{setUf({name:u.name||'',cpf:u.cpf||'',birthDate:u.birthDate||'',phone:u.phone||'',email:u.email||'',username:u.username||'',role:u.role||'secretary',password:'',cp:''});setEid(u.id);setUerr('');setCpfError('');setModal(true);};
  const save=()=>{
    if(!uf.name||!uf.email){setUerr('Nome e e-mail obrigatorios.');return;}
    if(!eid&&!uf.password){setUerr('Senha obrigatoria.');return;}
    if(uf.password&&uf.password!==uf.cp){setUerr('Senhas nao coincidem.');return;}
    if(cpfError){setUerr('Corrija o CPF antes de salvar.');return;}
    const cpfDigits=(uf.cpf||'').replace(/\D/g,'');
    if(cpfDigits.length>0&&cpfDigits.length!==11){setUerr('CPF incompleto.');return;}
    if(cpfDigits.length===11&&!validateCPF(cpfDigits)){setUerr('CPF inválido.');return;}
    const p:any={municipalityId:mid,name:uf.name,email:uf.email,role:uf.role};
    if(uf.cpf)p.cpf=uf.cpf;if(uf.birthDate)p.birthDate=uf.birthDate;if(uf.phone)p.phone=uf.phone;if(uf.username)p.username=uf.username;if(uf.password)p.password=uf.password;
    const ok=()=>{refetch();setModal(false);setUerr('');};
    const err=(e:any)=>setUerr((typeof e==='string'?e:e?.message)||'Erro ao salvar.');
    if(eid!==null)uu({id:eid,...p},{onSuccess:ok,onError:err});else cu(p,{onSuccess:ok,onError:err});
  };
  return(
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Settings size={20} className="text-gray-600"/></div><div><h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1><p className="text-gray-500 text-sm">Gerencie usuarios, prefeitura e seguranca</p></div></div>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">{TABS.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all '+(tab===t.id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700')}><t.icon size={15}/>{t.label}</button>))}</div>
      {tab==='users'&&(<div>
        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Usuarios do Sistema</h2><p className="text-sm text-gray-500">{all.length} usuario(s)</p></div><button onClick={openN} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Usuario</button></div>
        <div className="grid gap-3">
          {all.map((u:any)=>(<div key={u.id} className="card flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600 flex-shrink-0">{(u.name||'?').charAt(0).toUpperCase()}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-gray-800">{u.name}</p>{u.id===user?.id&&<span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10}/>Voce</span>}{u.username&&<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">@{u.username}</span>}</div><div className="flex gap-3 mt-0.5 flex-wrap text-xs text-gray-500"><span className="flex items-center gap-1"><Mail size={10}/>{u.email}</span>{u.phone&&<span className="flex items-center gap-1"><Phone size={10}/>{u.phone}</span>}{u.cpf&&<span className="flex items-center gap-1"><FileText size={10}/>{u.cpf}</span>}</div></div><span className={'text-xs px-2 py-0.5 rounded-full font-medium '+(RC[u.role]||'bg-gray-100 text-gray-600')}>{ROLES.find(r=>r.value===u.role)?.label||u.role}</span><div className="flex items-center gap-1"><button onClick={()=>openE(u)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={14}/></button>{u.id!==user?.id&&<button onClick={()=>setDel(u)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>}</div></div>))}
          {!all.length&&<div className="card text-center py-12"><User size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-400 font-medium">Nenhum usuario cadastrado</p><p className="text-gray-300 text-sm mt-1">Clique em Novo Usuario para adicionar</p></div>}
        </div>
      </div>)}
      {tab==='security'&&(<div className="card max-w-md space-y-4"><h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Shield size={18} className="text-primary-500"/>Alterar Senha</h2>{sm&&<div className={'p-3 rounded-lg text-sm '+(sm.includes('sucesso')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-600 border border-red-200')}>{sm}</div>}<div><label className="label">Senha atual</label><div className="relative"><input type={sp?'text':'password'} className="input pr-10" value={sec.cur} onChange={e=>setSec(f=>({...f,cur:e.target.value}))}/><button type="button" onClick={()=>setSp(v=>!v)} className="absolute right-3 top-2.5 text-gray-400">{sp?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div><div><label className="label">Nova senha</label><input type="password" className="input" value={sec.nw} onChange={e=>setSec(f=>({...f,nw:e.target.value}))}/></div><div><label className="label">Confirmar nova senha</label><input type="password" className="input" value={sec.cf} onChange={e=>setSec(f=>({...f,cf:e.target.value}))}/></div><button onClick={()=>{if(!sec.cur||!sec.nw){setSm('Preencha todos os campos.');return;}if(sec.nw!==sec.cf){setSm('Senhas nao coincidem.');return;}if(sec.nw.length<6){setSm('Minimo 6 caracteres.');return;}api.auth.changePassword({currentPassword:sec.cur,newPassword:sec.nw}).then(()=>{setSm('Senha alterada com sucesso!');setSec({cur:'',nw:'',cf:''});}).catch((e:any)=>setSm(e.message||'Erro ao alterar senha')); }} className="btn-primary w-full">Alterar Senha</button></div>)}
      {tab==='notifications'&&(<div className="card max-w-2xl">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell size={18}/>Notificacoes</h2>
        <div className="p-6 bg-blue-50 rounded-xl text-center">
          <Bell size={40} className="text-blue-300 mx-auto mb-3"/>
          <p className="text-blue-800 font-medium mb-2">As configurações de notificacao sao gerenciadas automaticamente pelo sistema.</p>
          <p className="text-sm text-blue-600">As notificações de viagem, embarque, desembarque e avisos escolares sao enviadas automaticamente conforme as configurações do município. Para alterações, entre em contato com o administrador do sistema.</p>
        </div>
      </div>)}
      {del&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={24} className="text-red-500"/></div><h3 className="font-bold text-gray-900 mb-2">Excluir {del.name}?</h3><p className="text-sm text-gray-500 mb-5">Esta acao nao pode ser desfeita.</p><div className="flex gap-3"><button onClick={()=>setDel(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={()=>du({id:del.id},{onSuccess:()=>{refetch();setDel(null);}})} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}
      {modal&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]"><div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{eid?'Editar Usuario':'Novo Usuario'}</h3><button onClick={()=>setModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div><div className="overflow-y-auto flex-1 p-5"><div className="grid grid-cols-2 gap-3">{uerr&&<div className="col-span-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{uerr}</div>}<div className="col-span-2"><label className="label flex items-center gap-1"><User size={12}/> Nome Completo *</label><input className="input" value={uf.name} onChange={sf('name')} placeholder="Nome completo"/></div><div><label className="label flex items-center gap-1"><FileText size={12}/> CPF</label><input className="input" value={uf.cpf} onChange={e=>{const masked=maskCPF(e.target.value);setUf(f=>({...f,cpf:masked}));const digits=e.target.value.replace(/\D/g,'');if(digits.length===11){setCpfError(validateCPF(digits)?'':'CPF inválido');}else{setCpfError('');}}} placeholder="000.000.000-00" maxLength={14}/>{cpfError&&<p className="text-xs text-red-500 mt-1">{cpfError}</p>}</div><div><label className="label flex items-center gap-1"><Calendar size={12}/> Data de Nascimento</label><input className="input" type="date" value={uf.birthDate} onChange={sf('birthDate')}/></div><div><label className="label flex items-center gap-1"><Phone size={12}/> Telefone</label><input className="input" value={uf.phone} onChange={e=>setUf(f=>({...f,phone:maskPhone(e.target.value)}))} placeholder="(00) 00000-0000" maxLength={16}/></div><div><label className="label flex items-center gap-1"><Mail size={12}/> E-mail *</label><input className="input" type="email" value={uf.email} onChange={sf('email')} placeholder="email@exemplo.com"/></div><div><label className="label flex items-center gap-1"><Hash size={12}/> Login</label><input className="input" value={uf.username} onChange={sf('username')} placeholder="nome_usuario"/></div><div><label className="label">Perfil de Acesso</label><select className="input" value={uf.role} onChange={sf('role')}>{ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></div><div className="col-span-2"><label className="label flex items-center gap-1"><Shield size={12}/> {eid?'Nova Senha (em branco = manter)':'Senha *'}</label><div className="relative"><input type={sp?'text':'password'} className="input pr-10" value={uf.password} onChange={sf('password')} placeholder="Minimo 6 caracteres"/><button type="button" onClick={()=>setSp(v=>!v)} className="absolute right-3 top-2.5 text-gray-400">{sp?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>{uf.password&&<div className="col-span-2"><label className="label">Confirmar Senha</label><input type="password" className="input" value={uf.cp} onChange={sf('cp')} placeholder="Repita a senha"/></div>}</div></div><div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={cr||up} className="btn-primary flex-1">{cr||up?'Salvando...':eid?'Salvar Alterações':'Criar Usuario'}</button></div></div></div>)}
    </div>
  );
          }
