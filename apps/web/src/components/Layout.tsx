import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { Bus, LayoutDashboard, MapPin, Users, Truck, UserCheck, School, FileText, LogOut, Radio, Wifi, WifiOff, Settings, ClipboardList, QrCode, Heart, Shield, Brain, Wrench, X, Mail, Phone, Key, User } from 'lucide-react';

type Role = 'super_admin' | 'municipal_admin' | 'operator' | 'driver' | 'guardian' | string;

const NAV_ITEMS = [
  { section:'Principal', to:'/', icon:LayoutDashboard, label:'Dashboard', end:true, roles:['super_admin','municipal_admin','operator'] },
  { section:'Principal', to:'/monitor', icon:Radio, label:'Monitoramento', roles:['super_admin','municipal_admin','operator','driver'] },
  { section:'Principal', to:'/rotas', icon:MapPin, label:'Rotas', roles:['super_admin','municipal_admin','operator','driver'] },
  { section:'Principal', to:'/alunos', icon:Users, label:'Alunos', roles:['super_admin','municipal_admin','operator'] },
  { section:'Principal', to:'/motoristas', icon:Truck, label:'Motoristas', roles:['super_admin','municipal_admin','operator'] },
  { section:'Principal', to:'/monitores', icon:UserCheck, label:'Monitores', roles:['super_admin','municipal_admin','operator'] },
  { section:'Principal', to:'/veiculos', icon:Bus, label:'Veículos', roles:['super_admin','municipal_admin'] },
  { section:'Principal', to:'/escolas', icon:School, label:'Escolas', roles:['super_admin','municipal_admin','operator'] },
  { section:'Principal', to:'/frequencia', icon:QrCode, label:'Frequência', roles:['super_admin','municipal_admin','operator','driver'] },
  { section:'Gestão', to:'/relatorios', icon:FileText, label:'Relatórios', roles:['super_admin','municipal_admin','operator'] },
  { section:'Gestão', to:'/contratos', icon:ClipboardList, label:'Contratos', roles:['super_admin','municipal_admin'] },
  { section:'Gestão', to:'/portal-responsavel', icon:Heart, label:'Portal Responsável', roles:['super_admin','municipal_admin','guardian'] },
  { section:'Gestão', to:'/super-admin', icon:Shield, label:'Super Admin', roles:['super_admin'] },
  { section:'IA', to:'/ia-rotas', icon:Brain, label:'IA — Rotas', roles:['super_admin','municipal_admin'], highlight:true },
  { section:'IA', to:'/manutencao-preditiva', icon:Wrench, label:'Manutenção IA', roles:['super_admin','municipal_admin'], highlight:true },
  { section:'Sistema', to:'/configuracoes', icon:Settings, label:'Configurações', roles:['super_admin','municipal_admin'] },
];

const SECTION_ORDER = ['Principal','Gestão','IA','Sistema'];

const ROLE_CFG: Record<string,{label:string;color:string;dot:string}> = {
  super_admin:     { label:'Super Admin',     color:'bg-purple-100 text-purple-700', dot:'bg-purple-500' },
  municipal_admin: { label:'Admin Municipal', color:'bg-primary-100 text-primary-700', dot:'bg-primary-500' },
  operator:        { label:'Operador',        color:'bg-blue-100 text-blue-700', dot:'bg-blue-500' },
  driver:          { label:'Motorista',       color:'bg-orange-100 text-orange-700', dot:'bg-orange-500' },
  guardian:        { label:'Responsável',     color:'bg-green-100 text-green-700', dot:'bg-green-500' },
};

function NavItem({ to, icon:Icon, label, end, highlight }: any) {
  return (
    <NavLink to={to} end={end} className={function({isActive}:any){
      return 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors '+(isActive?(highlight?'bg-purple-50 text-purple-700':'bg-primary-50 text-primary-700'):'text-gray-600 hover:bg-gray-50 hover:text-gray-900');
    }}>
      <Icon size={16}/>{label}
    </NavLink>
  );
}

function ProfileModal({ user, onClose }: { user: any; onClose: () => void }) {
  const cfg = ROLE_CFG[user?.role] || ROLE_CFG['operator'];
  const initials = (user?.name||'?').split(' ').slice(0,2).map((n:string)=>n[0]).join('').toUpperCase();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header colorido */}
        <div className={'rounded-t-2xl p-6 text-center relative ' + (user?.role==='super_admin'?'bg-gradient-to-br from-purple-500 to-purple-700':'bg-gradient-to-br from-primary-500 to-orange-500')}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white"><X size={16}/></button>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 border-2 border-white/40">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
          <h3 className="font-bold text-white text-lg leading-tight">{user?.name}</h3>
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/20 text-white text-xs rounded-full font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-white"/>
            {cfg.label}
          </span>
        </div>
        {/* Detalhes */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0"><Mail size={14} className="text-primary-600"/></div>
            <div className="min-w-0"><p className="text-xs text-gray-500">E-mail</p><p className="text-sm font-medium text-gray-800 truncate">{user?.email||'—'}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0"><User size={14} className="text-primary-600"/></div>
            <div><p className="text-xs text-gray-500">ID do usuário</p><p className="text-sm font-medium text-gray-800">#{user?.id}</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0"><Shield size={14} className="text-primary-600"/></div>
            <div><p className="text-xs text-gray-500">Perfil de acesso</p><span className={'text-xs px-2 py-0.5 rounded-full font-medium '+cfg.color}>{cfg.label}</span></div>
          </div>
          <p className="text-xs text-gray-400 text-center pt-1">Para alterar dados ou senha, acesse <span className="text-primary-500 font-medium">Configurações → Usuários</span></p>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const role: Role = user?.role || 'operator';
  const cfg = ROLE_CFG[role] || ROLE_CFG['operator'];

  const visible = NAV_ITEMS.filter(function(item){ return item.roles.includes(role); });
  const sections = SECTION_ORDER.filter(function(sec){ return visible.some(function(i){ return i.section===sec; }); });

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center"><Bus size={18} className="text-white"/></div>
            <span className="font-bold text-gray-900 text-lg">TransEscolar</span>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {sections.map(function(sec){
            const items = visible.filter(function(i){ return i.section===sec; });
            return (
              <div key={sec}>
                <div className={'text-xs font-semibold text-gray-400 uppercase px-3 pb-1 tracking-wide flex items-center gap-1 '+(sec==='Principal'?'pt-2':'pt-3')}>
                  {sec==='IA'&&<Brain size={10}/>}{sec==='IA'?'Inteligência IA':sec}
                </div>
                {items.map(function(item){ return <NavItem key={item.to} {...item}/>; })}
              </div>
            );
          })}
        </nav>
        {/* Footer */}
        <div className="p-3 border-t border-gray-200 flex-shrink-0 space-y-2">
          {/* Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-xs">
            {connected?<><Wifi size={13} className="text-green-500"/><span className="text-green-600">Tempo real ativo</span></>:<><WifiOff size={13} className="text-red-500"/><span className="text-red-500">Desconectado</span></>}
          </div>
          {/* Card do usuário — clicável abre perfil */}
          <button
            onClick={function(){ setShowProfile(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group text-left"
            title="Ver meu perfil"
          >
            <div className={'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white '+cfg.dot}>
              {(user?.name||'?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-700 truncate text-xs leading-tight">{user?.name}</p>
              <span className={'text-xs px-1.5 py-0.5 rounded-full font-medium '+cfg.color}>{cfg.label}</span>
            </div>
            <LogOut
              size={14}
              className="text-gray-400 hover:text-red-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={function(e){ e.stopPropagation(); logout(); navigate('/login'); }}
              title="Sair"
            />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><Outlet/></main>
      {showProfile && <ProfileModal user={user} onClose={function(){ setShowProfile(false); }}/>}
    </div>
  );
   }
