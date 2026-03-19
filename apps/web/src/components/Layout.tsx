import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { api } from '../lib/api';
import { usePWAInstall, notifyUser } from '../lib/pwa';
import {
  LayoutDashboard, Route, Users, Bus, School, ClipboardList,
  BarChart3, FileText, Heart, Settings, LogOut, Menu, X, Wifi, WifiOff,
  Bell, Shield, Brain, Wrench, UserCheck, ChevronRight, Navigation,
  Locate, MapPinned, Download, Calendar, BookOpen, Briefcase,
  GraduationCap, DollarSign, Package, Database, Moon, Sun, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import NotificationDropdown from './NotificationDropdown';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  municipal_admin: 'Administrador',
  secretary: 'Secretário',
  school_admin: 'Diretor Escolar',
  driver: 'Motorista',
  monitor: 'Monitor',
  parent: 'Responsável',
  teacher: 'Professor',
  coordinator: 'Coordenador',
};

// Module icon components for the collapsible headers
const MODULE_ICONS: Record<string, any> = {
  'PAINEL': LayoutDashboard,
  'SECRETARIA': School,
  'PEDAGÓGICO': GraduationCap,
  'TRANSPORTE': Bus,
  'ADMINISTRATIVO': Briefcase,
  'CONFIGURAÇÕES': Settings,
  'MOTORISTA': Navigation,
  'MEU PAINEL': Heart,
};

const MODULE_COLORS: Record<string, string> = {
  'PAINEL': '#2DB5B0',
  'SECRETARIA': '#6366f1',
  'PEDAGÓGICO': '#8b5cf6',
  'TRANSPORTE': '#f97316',
  'ADMINISTRATIVO': '#0ea5e9',
  'CONFIGURAÇÕES': '#64748b',
  'MOTORISTA': '#f97316',
  'MEU PAINEL': '#2DB5B0',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // unreadNotifs handled by NotificationDropdown
  const [installBanner, setInstallBanner] = useState(true);
  const { canInstall, isInstalled, install } = usePWAInstall();
  const { theme, toggle: toggleTheme, isDark } = useTheme();

  // Collapsible modules - load from localStorage
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('netescol_menu_state');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const toggleModule = (label: string) => {
    setOpenModules(prev => {
      const next = { ...prev, [label]: !prev[label] };
      localStorage.setItem('netescol_menu_state', JSON.stringify(next));
      return next;
    });
  };

  // Auto-open the module that contains the current page
  useEffect(() => {
    const currentPath = location.pathname;
    menuSections.forEach(section => {
      const hasActive = section.items.some(item =>
        currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))
      );
      if (hasActive && !openModules[section.label]) {
        setOpenModules(prev => ({ ...prev, [section.label]: true }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Notification polling moved to NotificationDropdown component

  useEffect(() => {
    if (socket && user?.municipalityId) {
      socket.emit('join:municipality', user.municipalityId);
    }
  }, [socket, user?.municipalityId]);

  useEffect(() => {
    if (!socket) return;
    const onStudentBoarded = () => { notifyUser(); (window as any).__notifDropdownIncrement?.(); };
    const onStudentDropped = () => { notifyUser(); (window as any).__notifDropdownIncrement?.(); };
    const onStopArrived = () => { notifyUser(); };
    socket.on('student:boarded', onStudentBoarded);
    socket.on('student:dropped', onStudentDropped);
    socket.on('stop:arrived', onStopArrived);
    return () => {
      socket.off('student:boarded', onStudentBoarded);
      socket.off('student:dropped', onStudentDropped);
      socket.off('stop:arrived', onStopArrived);
    };
  }, [socket]);

  const [transportPaused, setTransportPaused] = useState<any>(null);
  useEffect(() => {
    if (!user?.municipalityId) return;
    api.schoolCalendar.trackingStatus({ municipalityId: user.municipalityId })
      .then((data: any) => { if (data && !data.trackingActive) setTransportPaused(data); else setTransportPaused(null); })
      .catch(() => setTransportPaused(null));
  }, [user?.municipalityId]);

  const role = user?.role || 'parent';
  const isAdmin = ['super_admin', 'municipal_admin', 'secretary'].includes(role);
  const isDriver = role === 'driver' || role === 'monitor';
  const isParent = role === 'parent';

  // ============================================
  // MENUS ORGANIZADOS POR MÓDULO
  // ============================================
  const adminMenu = [
    { label: 'PAINEL', items: [
      { to: '/', icon: LayoutDashboard, text: 'Dashboard' },
      { to: '/modulos', icon: LayoutDashboard, text: 'Todos os Módulos' },
      { to: '/monitor', icon: Navigation, text: 'Monitoramento' },
      { to: '/mapa-tempo-real', icon: MapPinned, text: 'Mapa Tempo Real' },
    ]},
    { label: 'SECRETARIA', items: [
      { to: '/escolas', icon: School, text: 'Escolas' },
      { to: '/alunos', icon: Users, text: 'Alunos' },
      { to: '/matriculas', icon: ClipboardList, text: 'Matrículas' },
      { to: '/turmas', icon: Users, text: 'Turmas' },
      { to: '/series', icon: BookOpen, text: 'Séries' },
      { to: '/anos-letivos', icon: Calendar, text: 'Anos Letivos' },
      { to: '/professores', icon: UserCheck, text: 'Professores' },
      { to: '/lista-espera', icon: ClipboardList, text: 'Lista de Espera' },
      { to: '/remanejamento', icon: Users, text: 'Remanejamento' },
      { to: '/carteirinha', icon: Users, text: 'Carteirinha' },
      { to: '/promocao', icon: Users, text: 'Promo\u00e7\u00e3o Alunos' },
      { to: '/historico-escolar', icon: BookOpen, text: 'Histórico Escolar' },
    ]},
    { label: 'PEDAGÓGICO', items: [
      { to: '/disciplinas', icon: FileText, text: 'Disciplinas' },
      { to: '/diario-escolar', icon: BookOpen, text: 'Diário Escolar' },
      { to: '/educacenso', icon: Database, text: 'EDUCACENSO' },
      { to: '/calendario', icon: Calendar, text: 'Calendário Escolar' },
      { to: '/boletim', icon: FileText, text: 'Boletim Escolar' },
      { to: '/parecer-descritivo', icon: BookOpen, text: 'Parecer Descritivo' },
      { to: '/ata-resultados', icon: FileText, text: 'ATA de Resultados' },
      { to: '/lancamento-notas', icon: FileText, text: 'Lançar Notas' },
      { to: '/relatorio-frequencia', icon: BarChart3, text: 'Relatório Frequência' },
    ]},
    { label: 'TRANSPORTE', items: [
      { to: '/rotas', icon: Route, text: 'Rotas' },
      { to: '/veiculos', icon: Bus, text: 'Veículos' },
      { to: '/motoristas', icon: UserCheck, text: 'Motoristas' },
      { to: '/monitores', icon: UserCheck, text: 'Monitores' },
      { to: '/rastreamento', icon: Locate, text: 'Rastreamento GPS' },
      { to: '/frequencia', icon: ClipboardList, text: 'Frequência' },
      { to: '/portal-responsavel', icon: Heart, text: 'Portal Responsável' },
      { to: '/relatorio-transporte', icon: BarChart3, text: 'Relatório Transporte' },
    ]},
    { label: 'ADMINISTRATIVO', items: [
      { to: '/recursos-humanos', icon: Briefcase, text: 'Recursos Humanos' },
      { to: '/financeiro', icon: DollarSign, text: 'Financeiro' },
      { to: '/contratos', icon: FileText, text: 'Contratos' },
      { to: '/merenda', icon: ClipboardList, text: 'Merenda Escolar' },
      { to: '/biblioteca', icon: BookOpen, text: 'Biblioteca' },
      { to: '/patrimonio', icon: Package, text: 'Patrimônio e Estoque' },
      { to: '/manutencao-preditiva', icon: Wrench, text: 'Manutenção' },
      { to: '/relatorios', icon: BarChart3, text: 'Relatórios' },
      { to: '/comunicacao', icon: Bell, text: 'Comunicação' },
    ]},
    { label: 'CONFIGURAÇÕES', items: [
      { to: '/configuracoes', icon: Settings, text: 'Configurações' },
      { to: '/ia-rotas', icon: Brain, text: 'IA Rotas' },
      ...(role === 'super_admin' ? [{ to: '/super-admin', icon: Shield, text: 'Super Admin' }] : []),
    ]},
  ];

  const driverMenu = [
    { label: 'MOTORISTA', items: [
      { to: '/monitor', icon: Navigation, text: 'Minha Viagem' },
      { to: '/rastreamento', icon: Locate, text: 'Rastreamento GPS' },
      { to: '/rotas', icon: Route, text: 'Rotas' },
      { to: '/frequencia', icon: ClipboardList, text: 'Frequência' },
      { to: '/mapa-tempo-real', icon: MapPinned, text: 'Mapa Tempo Real' },
      { to: '/portal-responsavel', icon: Heart, text: 'Portal Responsável' },
    ]},
  ];

  const parentMenu = [
    { label: 'MEU PAINEL', items: [
      { to: '/portal-responsavel', icon: Heart, text: 'Acompanhar Transporte' },
      { to: '/mapa-tempo-real', icon: MapPinned, text: 'Mapa Tempo Real' },
    ]},
  ];

  const menuSections = isParent ? parentMenu : isDriver ? driverMenu : adminMenu;

  const NavLink = ({ to, icon: Icon, text }: { to: string; icon: any; text: string }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link to={to} onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[0.875rem] font-medium transition-all ${
          isActive ? 'bg-accent-500 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}>
        <Icon size={17} className={isActive ? 'text-white' : 'text-white/50'} />
        {text}
      </Link>
    );
  };

  const ModuleSection = ({ section }: { section: typeof menuSections[0] }) => {
    const isOpen = openModules[section.label] !== false; // default open
    const hasActive = section.items.some(item =>
      location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
    );
    const ModIcon = MODULE_ICONS[section.label] || FileText;
    const moduleColor = MODULE_COLORS[section.label] || '#64748b';

    return (
      <div>
        <button
          onClick={() => toggleModule(section.label)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            hasActive ? 'text-white' : 'text-white/50 hover:text-white/70'
          }`}
        >
          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hasActive ? moduleColor : 'rgba(255,255,255,0.15)' }}>
            <ModIcon size={11} className="text-white" />
          </div>
          <span className="flex-1 text-left">{section.label}</span>
          <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} style={{ color: hasActive ? moduleColor : 'rgba(255,255,255,0.3)' }} />
        </button>
        {isOpen && (
          <div className="ml-2 mt-0.5 space-y-0.5 pl-2" style={{ borderLeft: `2px solid ${moduleColor}30` }}>
            {section.items.map((item) => <NavLink key={item.to} {...item} />)}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuSections.map((section) => (
          <ModuleSection key={section.label} section={section} />
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs mb-2 text-white/50 hover:text-white/80 hover:bg-white/10 w-full transition-all">
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs mb-3 ${connected ? 'text-green-300 bg-green-500/20' : 'text-red-300 bg-red-500/20'}`}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'Conectado' : 'Desconectado'}
        </div>
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.875rem] font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-accent-400">{ROLE_LABELS[role] || role}</p>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/20" title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-[#f8f9fa]'}`}>
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col w-60 bg-primary-500 ${isParent ? 'lg:w-52' : ''}`}>
        <div className="p-4 border-b border-white/10">
          <img src="/logo.png" alt="NetEscol" className="h-8 w-auto" />
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-primary-500 shadow-xl z-50 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <img src="/logo.png" alt="NetEscol" className="h-7 w-auto" />
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white"><X size={20} /></button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-primary-500 border-b border-primary-600">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10 text-white"><Menu size={20} /></button>
          <img src="/logo.png" alt="NetEscol" className="h-6 w-auto" />
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <div className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* PWA Install Banner */}
        {canInstall && !isInstalled && installBanner && (
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Download size={16} />
              <span className="font-medium">Instale o NetEscol no seu celular!</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { install(); }} className="bg-white text-accent-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100">Instalar</button>
              <button onClick={() => setInstallBanner(false)} className="text-white/70 hover:text-white"><X size={16} /></button>
            </div>
          </div>
        )}

        {/* Calendar Transport Status Banner */}
        {transportPaused && isAdmin && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 flex items-center gap-3">
            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Transporte pausado: {transportPaused.reason}</p>
              {transportPaused.events?.length > 0 && (
                <div className="flex gap-1.5 mt-1">{transportPaused.events.map((e: any, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{backgroundColor: e.color || '#64748b'}}>{e.title} ({e.type})</span>
                ))}</div>
              )}
            </div>
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-900' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
