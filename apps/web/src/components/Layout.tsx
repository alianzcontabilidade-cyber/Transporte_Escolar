import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { Bus, LayoutDashboard, MapPin, Users, Truck, School, FileText, LogOut, Radio, Wifi, WifiOff, Settings, ClipboardList, QrCode, Heart, Shield } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/monitor', icon: Radio, label: 'Monitoramento' },
  { to: '/rotas', icon: MapPin, label: 'Rotas' },
  { to: '/alunos', icon: Users, label: 'Alunos' },
  { to: '/motoristas', icon: Truck, label: 'Motoristas' },
  { to: '/veiculos', icon: Bus, label: 'Veículos' },
  { to: '/escolas', icon: School, label: 'Escolas' },
  { to: '/frequencia', icon: QrCode, label: 'Frequência' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/contratos', icon: ClipboardList, label: 'Contratos' },
  { to: '/portal-responsavel', icon: Heart, label: 'Portal Responsável' },
  { to: '/super-admin', icon: Shield, label: 'Super Admin' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
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
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-xs">
            {connected
              ? <><Wifi size={13} className="text-green-500" /><span className="text-green-600">Tempo real ativo</span></>
              : <><WifiOff size={13} className="text-red-500" /><span className="text-red-500">Desconectado</span></>}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-700 truncate text-xs">{user?.name}</p>
              <p className="text-gray-400 truncate text-xs">{user?.role}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
    }
