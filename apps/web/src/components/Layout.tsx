import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { Bus, LayoutDashboard, MapPin, Users, Truck, UserCheck, School, FileText, LogOut, Radio, Wifi, WifiOff, Settings, ClipboardList, QrCode, Heart, Shield, Brain, Wrench } from 'lucide-react';

// Permissões por perfil
// super_admin    = acesso total
// municipal_admin = admin da prefeitura
// operator       = operador/funcionário
// driver         = motorista
// guardian       = responsável de aluno

type Role = 'super_admin' | 'municipal_admin' | 'operator' | 'driver' | 'guardian' | string;

const NAV_ITEMS = [
  // PRINCIPAL
  { section: 'Principal', to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true, roles: ['super_admin', 'municipal_admin', 'operator'] },
  { section: 'Principal', to: '/monitor', icon: Radio, label: 'Monitoramento', roles: ['super_admin', 'municipal_admin', 'operator', 'driver'] },
  { section: 'Principal', to: '/rotas', icon: MapPin, label: 'Rotas', roles: ['super_admin', 'municipal_admin', 'operator', 'driver'] },
  { section: 'Principal', to: '/alunos', icon: Users, label: 'Alunos', roles: ['super_admin', 'municipal_admin', 'operator'] },
  { section: 'Principal', to: '/motoristas', icon: Truck, label: 'Motoristas', roles: ['super_admin', 'municipal_admin', 'operator'] },
  { section: 'Principal', to: '/monitores', icon: UserCheck, label: 'Monitores', roles: ['super_admin', 'municipal_admin', 'operator'] },
  { section: 'Principal', to: '/veiculos', icon: Bus, label: 'Veículos', roles: ['super_admin', 'municipal_admin'] },
  { section: 'Principal', to: '/escolas', icon: School, label: 'Escolas', roles: ['super_admin', 'municipal_admin', 'operator'] },
  { section: 'Principal', to: '/frequencia', icon: QrCode, label: 'Frequência', roles: ['super_admin', 'municipal_admin', 'operator', 'driver'] },
  // GESTÃO
  { section: 'Gestão', to: '/relatorios', icon: FileText, label: 'Relatórios', roles: ['super_admin', 'municipal_admin', 'operator'] },
  { section: 'Gestão', to: '/contratos', icon: ClipboardList, label: 'Contratos', roles: ['super_admin', 'municipal_admin'] },
  { section: 'Gestão', to: '/portal-responsavel', icon: Heart, label: 'Portal Responsável', roles: ['super_admin', 'municipal_admin', 'guardian'] },
  { section: 'Gestão', to: '/super-admin', icon: Shield, label: 'Super Admin', roles: ['super_admin'] },
  // IA
  { section: 'IA', to: '/ia-rotas', icon: Brain, label: 'IA — Rotas', roles: ['super_admin', 'municipal_admin'], highlight: true },
  { section: 'IA', to: '/manutencao-preditiva', icon: Wrench, label: 'Manutenção IA', roles: ['super_admin', 'municipal_admin'], highlight: true },
  // SISTEMA
  { section: 'Sistema', to: '/configuracoes', icon: Settings, label: 'Configurações', roles: ['super_admin', 'municipal_admin'] },
];

const SECTION_ORDER = ['Principal', 'Gestão', 'IA', 'Sistema'];

function canAccess(role: Role, allowedRoles: string[]) {
  return allowedRoles.includes(role);
}

function NavItem({ to, icon: Icon, label, end, highlight }: any) {
  return (
    <NavLink
      to={to}
      end={end}
      className={function({ isActive }: any) {
        return 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
          (isActive
            ? (highlight ? 'bg-purple-50 text-purple-700' : 'bg-primary-50 text-primary-700')
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900');
      }}
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const labels: Record<string, { label: string; color: string }> = {
    super_admin:     { label: 'Super Admin',   color: 'bg-purple-100 text-purple-700' },
    municipal_admin: { label: 'Admin Municipal', color: 'bg-primary-100 text-primary-700' },
    operator:        { label: 'Operador',       color: 'bg-blue-100 text-blue-700' },
    driver:          { label: 'Motorista',      color: 'bg-orange-100 text-orange-700' },
    guardian:        { label: 'Responsável',    color: 'bg-green-100 text-green-700' },
  };
  const cfg = labels[role] || { label: role, color: 'bg-gray-100 text-gray-600' };
  return <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + cfg.color}>{cfg.label}</span>;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const role: Role = user?.role || 'operator';

  const visibleItems = NAV_ITEMS.filter(function(item) {
    return canAccess(role, item.roles);
  });

  const sections = SECTION_ORDER.filter(function(sec) {
    return visibleItems.some(function(item) { return item.section === sec; });
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Bus size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">TransEscolar</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {sections.map(function(sec) {
            const items = visibleItems.filter(function(i) { return i.section === sec; });
            return (
              <div key={sec}>
                <div className={'text-xs font-semibold text-gray-400 uppercase px-3 pb-1 tracking-wide flex items-center gap-1 ' + (sec === 'Principal' ? 'pt-2' : 'pt-3')}>
                  {sec === 'IA' && <Brain size={10} />}
                  {sec === 'IA' ? 'Inteligência IA' : sec}
                </div>
                {items.map(function(item) {
                  return <NavItem key={item.to} {...item} />;
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 space-y-2 flex-shrink-0">
          {/* Status conexão */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-xs">
            {connected
              ? <><Wifi size={13} className="text-green-500" /><span className="text-green-600">Tempo real ativo</span></>
              : <><WifiOff size={13} className="text-red-500" /><span className="text-red-500">Desconectado</span></>}
          </div>
          {/* Usuário */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm flex-shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-700 truncate text-xs">{user?.name}</p>
              <RoleBadge role={role} />
            </div>
            <button
              onClick={function() { logout(); navigate('/login'); }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Sair"
            >
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
