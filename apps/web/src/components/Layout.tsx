import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { Bus, LayoutDashboard, MapPin, Users, Truck, School, FileText, LogOut, Radio, Wifi, WifiOff } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/monitor', icon: Radio, label: 'Monitoramento' },
  { to: '/rotas', icon: MapPin, label: 'Rotas' },
  { to: '/alunos', icon: Users, label: 'Alunos' },
  { to: '/motoristas', icon: Truck, label: 'Motoristas' },
  { to: '/veiculos', icon: Bus, label: 'Veículos' },
  { to: '/escolas', icon: School, label: 'Escolas' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Bus size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">TransEscolar</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-gray-50 text-xs">
            {connected ? <><Wifi size={14} className="text-green-500" /><span className="text-green-700">Tempo real ativo</span></> : <><WifiOff size={14} className="text-red-500" /><span className="text-red-700">Sem conexão</span></>}
          </div>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}
