import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { api } from '../lib/api';
import { usePWAInstall, notifyUser } from '../lib/pwa';
import {
  LayoutDashboard, Map, Route, Users, Bus, School, ClipboardList,
  BarChart3, FileText, Heart, Settings, LogOut, Menu, X, Wifi, WifiOff,
  Bell, Shield, Brain, Wrench, UserCheck, ChevronDown, Navigation,
  Locate, MapPinned, Download, Volume2, Calendar, BookOpen, Briefcase
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  municipal_admin: 'Administrador',
  secretary: 'Secretário',
  school_admin: 'Diretor Escolar',
  driver: 'Motorista',
  monitor: 'Monitor',
  parent: 'Responsável',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [installBanner, setInstallBanner] = useState(true);
  const { canInstall, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    api.notifications.unreadCount().then(d => setUnreadNotifs(d?.count || 0)).catch(() => {});
    const interval = setInterval(() => {
      api.notifications.unreadCount().then(d => setUnreadNotifs(d?.count || 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Entrar na sala do município para receber eventos em tempo real
  useEffect(() => {
    if (socket && user?.municipalityId) {
      socket.emit('join:municipality', user.municipalityId);
    }
  }, [socket, user?.municipalityId]);

  // Tocar som/vibrar ao receber eventos importantes
  useEffect(() => {
    if (!socket) return;
    const onStudentBoarded = () => { notifyUser(); setUnreadNotifs(n => n + 1); };
    const onStudentDropped = () => { notifyUser(); setUnreadNotifs(n => n + 1); };
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

  const role = user?.role || 'parent';
  const isAdmin = ['super_admin', 'municipal_admin', 'secretary'].includes(role);
  const isDriver = role === 'driver' || role === 'monitor';
  const isParent = role === 'parent';

  // Menus por perfil
  const adminMenu = [
    { label: 'PRINCIPAL', items: [
      { to: '/', icon: LayoutDashboard, text: 'Dashboard' },
      { to: '/monitor', icon: Navigation, text: 'Monitoramento' },
      { to: '/rotas', icon: Route, text: 'Rotas' },
      { to: '/alunos', icon: Users, text: 'Alunos' },
      { to: '/motoristas', icon: UserCheck, text: 'Motoristas' },
      { to: '/monitores', icon: UserCheck, text: 'Monitores' },
      { to: '/veiculos', icon: Bus, text: 'Veículos' },
      { to: '/escolas', icon: School, text: 'Escolas' },
      { to: '/frequencia', icon: ClipboardList, text: 'Frequência' },
    ]},
    { label: 'ACADÊMICO', items: [
      { to: '/anos-letivos', icon: Calendar, text: 'Anos Letivos' },
      { to: '/series', icon: BookOpen, text: 'Séries' },
      { to: '/disciplinas', icon: FileText, text: 'Disciplinas' },
      { to: '/turmas', icon: Users, text: 'Turmas' },
      { to: '/professores', icon: UserCheck, text: 'Professores' },
      { to: '/matriculas', icon: ClipboardList, text: 'Matrículas' },
    ]},
    { label: 'DIÁRIO ESCOLAR', items: [
      { to: '/diario-escolar', icon: BookOpen, text: 'Frequência e Notas' },
    ]},
    { label: 'RH', items: [
      { to: '/recursos-humanos', icon: Briefcase, text: 'Recursos Humanos' },
    ]},
    { label: 'FINANCEIRO', items: [
      { to: '/financeiro', icon: BarChart3, text: 'Contas e Movimentações' },
    ]},
    { label: 'OPERACIONAL', items: [
      { to: '/merenda', icon: ClipboardList, text: 'Merenda Escolar' },
      { to: '/biblioteca', icon: BookOpen, text: 'Biblioteca' },
      { to: '/patrimonio', icon: FileText, text: 'Patrimônio e Estoque' },
    ]},
    { label: 'GESTÃO', items: [
      { to: '/relatorios', icon: BarChart3, text: 'Relatórios' },
      { to: '/contratos', icon: FileText, text: 'Contratos' },
      { to: '/portal-responsavel', icon: Heart, text: 'Portal Responsável' },
    ]},
    { label: 'GPS & RASTREAMENTO', items: [
      { to: '/rastreamento', icon: Locate, text: 'Rastreamento GPS' },
      { to: '/mapa-tempo-real', icon: MapPinned, text: 'Mapa Tempo Real' },
    ]},
    { label: 'AVANÇADO', items: [
      ...(role === 'super_admin' ? [{ to: '/super-admin', icon: Shield, text: 'Super Admin' }] : []),
      { to: '/educacenso', icon: FileText, text: 'EDUCACENSO' },
      { to: '/ia-rotas', icon: Brain, text: 'IA Rotas' },
      { to: '/manutencao-preditiva', icon: Wrench, text: 'Manutenção Preditiva' },
      { to: '/configuracoes', icon: Settings, text: 'Configurações' },
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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive ? 'bg-accent-500 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}>
        <Icon size={18} className={isActive ? 'text-white' : 'text-white/50'} />
        {text}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className={`hidden lg:flex flex-col w-64 bg-primary-500 ${isParent ? 'lg:w-56' : ''}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NetEscol" className="h-8 w-auto" />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {menuSections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => <NavLink key={item.to} {...item} />)}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs mb-3 ${connected ? 'text-green-300 bg-green-500/20' : 'text-red-300 bg-red-500/20'}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Conectado' : 'Desconectado'}
          </div>
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-accent-400">{ROLE_LABELS[role]}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/20" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-72 bg-primary-500 shadow-xl z-50 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="NetEscol" className="h-7 w-auto" />
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white"><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
              {menuSections.map((section) => (
                <div key={section.label}>
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => <NavLink key={item.to} {...item} />)}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-3 p-2">
                <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-accent-400">{ROLE_LABELS[role]}</p>
                </div>
                <button onClick={logout} className="p-1.5 rounded-lg text-white/50 hover:text-red-400"><LogOut size={16} /></button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-primary-500 border-b border-primary-600">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/10 text-white"><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="NetEscol" className="h-6 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            {unreadNotifs > 0 && (
              <span className="relative">
                <Bell size={18} className="text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unreadNotifs}</span>
              </span>
            )}
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
              <span className="font-medium">Instale o NetEscol no seu celular para acesso rápido!</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { install(); }} className="bg-white text-accent-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100">Instalar</button>
              <button onClick={() => setInstallBanner(false)} className="text-white/70 hover:text-white"><X size={16} /></button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
