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
  GraduationCap, DollarSign, Package, Database, Moon, Sun, AlertTriangle,
  Search, PanelLeftClose, PanelLeft
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('netescol_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
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

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('netescol_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Search index with codes, module, and description
  const allPages = [
    { code: '001', to: '/', text: 'Painel Inicial', module: 'Painel', desc: 'Tela inicial com módulos do sistema', tags: 'home modulos painel inicio', color: '#2DB5B0' },
    { code: '002', to: '/dashboard', text: 'Dashboard', module: 'Painel', desc: 'KPIs, gráficos e alertas do município', tags: 'painel kpi grafico estatistica', color: '#2DB5B0' },
    // Secretaria
    { code: '101', to: '/escolas', text: 'Escolas', module: 'Secretaria', desc: 'Cadastro de unidades escolares, INEP, horários', tags: 'escola unidade inep cadastro horario', color: '#6366f1' },
    { code: '102', to: '/alunos', text: 'Alunos', module: 'Secretaria', desc: 'Cadastro, saúde, responsáveis, documentos', tags: 'aluno estudante cadastro saude responsavel', color: '#6366f1' },
    { code: '103', to: '/matriculas', text: 'Matrículas', module: 'Secretaria', desc: 'Matrícula individual e em lote', tags: 'matricula enturmacao lote vaga', color: '#6366f1' },
    { code: '104', to: '/turmas', text: 'Turmas', module: 'Secretaria', desc: 'Gestão de turmas por escola e ano', tags: 'turma classe sala serie', color: '#6366f1' },
    { code: '105', to: '/series', text: 'Séries', module: 'Secretaria', desc: 'Níveis e etapas de ensino', tags: 'serie etapa nivel fundamental medio', color: '#6366f1' },
    { code: '106', to: '/anos-letivos', text: 'Anos Letivos', module: 'Secretaria', desc: 'Períodos letivos e status', tags: 'ano letivo periodo planejamento', color: '#6366f1' },
    { code: '107', to: '/professores', text: 'Professores', module: 'Secretaria', desc: 'Corpo docente, formação, contrato', tags: 'professor docente formacao cnh contrato', color: '#6366f1' },
    { code: '108', to: '/lista-espera', text: 'Lista de Espera', module: 'Secretaria', desc: 'Fila de vagas com convocação', tags: 'espera fila vaga convocacao', color: '#6366f1' },
    { code: '109', to: '/remanejamento', text: 'Remanejamento', module: 'Secretaria', desc: 'Transferir alunos entre turmas', tags: 'transferir turma remanejamento mover', color: '#6366f1' },
    { code: '110', to: '/carteirinha', text: 'Carteirinha', module: 'Secretaria', desc: 'Carteira estudantil com QR Code', tags: 'carteira estudantil impressao qr', color: '#6366f1' },
    { code: '111', to: '/promocao', text: 'Promoção de Alunos', module: 'Secretaria', desc: 'Promover aprovados para próxima série', tags: 'promover aprovado serie proxima', color: '#6366f1' },
    { code: '112', to: '/historico-escolar', text: 'Histórico Escolar', module: 'Secretaria', desc: 'Trajetória acadêmica do aluno', tags: 'historico trajetoria academica', color: '#6366f1' },
    // Pedagógico
    { code: '201', to: '/disciplinas', text: 'Disciplinas', module: 'Pedagógico', desc: 'Componentes curriculares BNCC', tags: 'materia componente bncc curricular disciplina', color: '#8b5cf6' },
    { code: '202', to: '/diario-escolar', text: 'Diário Escolar', module: 'Pedagógico', desc: 'Frequência e conteúdo das aulas', tags: 'frequencia conteudo aula diario presenca', color: '#8b5cf6' },
    { code: '203', to: '/lancamento-notas', text: 'Lançar Notas', module: 'Pedagógico', desc: 'Notas por avaliação e bimestre', tags: 'nota avaliacao prova trabalho bimestre lancar', color: '#8b5cf6' },
    { code: '204', to: '/boletim', text: 'Boletim Escolar', module: 'Pedagógico', desc: 'Consulta e impressão de boletins', tags: 'boletim nota media impressao resultado', color: '#8b5cf6' },
    { code: '205', to: '/parecer-descritivo', text: 'Parecer Descritivo', module: 'Pedagógico', desc: 'Avaliação qualitativa por aluno', tags: 'parecer qualitativo descritivo texto', color: '#8b5cf6' },
    { code: '206', to: '/ata-resultados', text: 'ATA de Resultados', module: 'Pedagógico', desc: 'Documento oficial de resultados finais', tags: 'ata resultado final aprovado retido', color: '#8b5cf6' },
    { code: '207', to: '/relatorio-frequencia', text: 'Relatório Frequência', module: 'Pedagógico', desc: 'Presença por aluno e período', tags: 'presenca falta relatorio frequencia percentual', color: '#8b5cf6' },
    { code: '208', to: '/calendario', text: 'Calendário Escolar', module: 'Pedagógico', desc: 'Eventos, feriados e datas importantes', tags: 'calendario feriado evento recesso reuniao', color: '#8b5cf6' },
    { code: '209', to: '/educacenso', text: 'EDUCACENSO', module: 'Pedagógico', desc: 'Exportação para o Censo Escolar', tags: 'censo escolar inep exportar educacenso', color: '#8b5cf6' },
    // Transporte
    { code: '301', to: '/rotas', text: 'Rotas', module: 'Transporte', desc: 'Rotas, paradas e itinerários', tags: 'rota parada itinerario trajeto viagem', color: '#f97316' },
    { code: '302', to: '/veiculos', text: 'Veículos', module: 'Transporte', desc: 'Frota, documentos e manutenção', tags: 'veiculo onibus frota placa documento', color: '#f97316' },
    { code: '303', to: '/motoristas', text: 'Motoristas', module: 'Transporte', desc: 'Motoristas, CNH e vinculação', tags: 'motorista cnh habilitacao condutor', color: '#f97316' },
    { code: '304', to: '/monitores', text: 'Monitores', module: 'Transporte', desc: 'Auxiliares do transporte escolar', tags: 'monitor auxiliar acompanhante', color: '#f97316' },
    { code: '305', to: '/monitor', text: 'Monitoramento', module: 'Transporte', desc: 'Viagens em tempo real no mapa', tags: 'monitorar viagem tempo real mapa ao vivo', color: '#f97316' },
    { code: '306', to: '/mapa-tempo-real', text: 'Mapa Tempo Real', module: 'Transporte', desc: 'GPS de todos os ônibus no mapa', tags: 'mapa gps localizar onibus posicao', color: '#f97316' },
    { code: '307', to: '/rastreamento', text: 'Rastreamento GPS', module: 'Transporte', desc: 'Transmissão de posição do motorista', tags: 'gps rastrear posicao transmitir motorista', color: '#f97316' },
    { code: '308', to: '/frequencia', text: 'Frequência Transporte', module: 'Transporte', desc: 'Embarque e desembarque de alunos', tags: 'embarque desembarque qr code presenca', color: '#f97316' },
    { code: '309', to: '/portal-responsavel', text: 'Portal Responsável', module: 'Transporte', desc: 'Acompanhamento pelos pais', tags: 'pai mae responsavel filho acompanhar', color: '#f97316' },
    { code: '310', to: '/relatorio-transporte', text: 'Relatório Transporte', module: 'Transporte', desc: 'Relatório de viagens e frota', tags: 'relatorio viagem frota transporte', color: '#f97316' },
    // Administrativo
    { code: '401', to: '/recursos-humanos', text: 'Recursos Humanos', module: 'Administrativo', desc: 'Cargos, lotações e avaliações', tags: 'rh cargo lotacao avaliacao servidor funcionario', color: '#0ea5e9' },
    { code: '402', to: '/financeiro', text: 'Financeiro', module: 'Administrativo', desc: 'Contas, receitas e despesas', tags: 'financeiro conta receita despesa pdde banco', color: '#0ea5e9' },
    { code: '403', to: '/contratos', text: 'Contratos', module: 'Administrativo', desc: 'Gestão de contratos e fornecedores', tags: 'contrato fornecedor licitacao vigencia', color: '#0ea5e9' },
    { code: '404', to: '/merenda', text: 'Merenda Escolar', module: 'Administrativo', desc: 'Cardápios, calorias e porções', tags: 'merenda cardapio alimentacao refeicao caloria', color: '#0ea5e9' },
    { code: '405', to: '/biblioteca', text: 'Biblioteca', module: 'Administrativo', desc: 'Acervo, empréstimos e devoluções', tags: 'livro acervo emprestimo biblioteca devolucao', color: '#0ea5e9' },
    { code: '406', to: '/patrimonio', text: 'Patrimônio e Estoque', module: 'Administrativo', desc: 'Bens, equipamentos e controle de estoque', tags: 'patrimonio bem estoque equipamento material', color: '#0ea5e9' },
    { code: '407', to: '/manutencao-preditiva', text: 'Manutenção', module: 'Administrativo', desc: 'Manutenção preventiva de veículos', tags: 'manutencao veiculo preventiva corretiva', color: '#0ea5e9' },
    { code: '408', to: '/relatorios', text: 'Relatórios', module: 'Administrativo', desc: 'Relatórios gerais com exportação', tags: 'relatorio exportar csv pdf geral', color: '#0ea5e9' },
    { code: '409', to: '/comunicacao', text: 'Comunicação', module: 'Administrativo', desc: 'Recados e avisos para a comunidade', tags: 'recado mensagem aviso comunicacao whatsapp', color: '#0ea5e9' },
    // Configurações
    { code: '501', to: '/configuracoes', text: 'Configurações', module: 'Config', desc: 'Usuários, prefeitura e segurança', tags: 'configuracao usuario senha prefeitura perfil', color: '#64748b' },
    { code: '502', to: '/ia-rotas', text: 'IA Rotas', module: 'Config', desc: 'Otimização de rotas por IA', tags: 'inteligencia artificial otimizar rota ia', color: '#64748b' },
    { code: '503', to: '/transparencia', text: 'Transparência', module: 'Config', desc: 'Portal público de transparência', tags: 'transparencia publico portal lei', color: '#64748b' },
  ];

  const searchResults = searchQuery.length >= 1
    ? allPages.filter(p => {
        const q = searchQuery.toLowerCase().trim();
        // Search by code number
        if (/^\d+$/.test(q)) return p.code.includes(q);
        // Search by text, module, desc, or tags
        return p.text.toLowerCase().includes(q) || p.module.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.tags.includes(q);
      })
    : [];

  // ============================================
  // PAINEL COM BLOCOS DE MÓDULOS
  // ============================================
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const moduleBlocks = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#2DB5B0', to: '/' },
    { key: 'secretaria', label: 'Secretaria', icon: School, color: '#6366f1', items: [
      { to: '/escolas', icon: School, text: 'Escolas' }, { to: '/alunos', icon: Users, text: 'Alunos' },
      { to: '/matriculas', icon: ClipboardList, text: 'Matrículas' }, { to: '/turmas', icon: Users, text: 'Turmas' },
      { to: '/series', icon: BookOpen, text: 'Séries' }, { to: '/anos-letivos', icon: Calendar, text: 'Anos Letivos' },
      { to: '/professores', icon: UserCheck, text: 'Professores' }, { to: '/lista-espera', icon: ClipboardList, text: 'Lista de Espera' },
      { to: '/remanejamento', icon: Users, text: 'Remanejamento' }, { to: '/carteirinha', icon: Users, text: 'Carteirinha' },
      { to: '/promocao', icon: Users, text: 'Promoção' }, { to: '/historico-escolar', icon: BookOpen, text: 'Histórico' },
    ]},
    { key: 'pedagogico', label: 'Pedagógico', icon: GraduationCap, color: '#8b5cf6', items: [
      { to: '/disciplinas', icon: FileText, text: 'Disciplinas' }, { to: '/diario-escolar', icon: BookOpen, text: 'Diário Escolar' },
      { to: '/lancamento-notas', icon: FileText, text: 'Lançar Notas' }, { to: '/boletim', icon: FileText, text: 'Boletim' },
      { to: '/parecer-descritivo', icon: BookOpen, text: 'Parecer' }, { to: '/ata-resultados', icon: FileText, text: 'ATA Resultados' },
      { to: '/relatorio-frequencia', icon: BarChart3, text: 'Rel. Frequência' }, { to: '/calendario', icon: Calendar, text: 'Calendário' },
      { to: '/educacenso', icon: Database, text: 'EDUCACENSO' },
    ]},
    { key: 'transporte', label: 'Transporte', icon: Bus, color: '#f97316', items: [
      { to: '/rotas', icon: Route, text: 'Rotas' }, { to: '/veiculos', icon: Bus, text: 'Veículos' },
      { to: '/motoristas', icon: UserCheck, text: 'Motoristas' }, { to: '/monitores', icon: UserCheck, text: 'Monitores' },
      { to: '/monitor', icon: Navigation, text: 'Monitoramento' }, { to: '/mapa-tempo-real', icon: MapPinned, text: 'Mapa Tempo Real' },
      { to: '/rastreamento', icon: Locate, text: 'Rastreamento GPS' }, { to: '/frequencia', icon: ClipboardList, text: 'Frequência' },
      { to: '/portal-responsavel', icon: Heart, text: 'Portal Responsável' }, { to: '/relatorio-transporte', icon: BarChart3, text: 'Relatório' },
    ]},
    { key: 'administrativo', label: 'Administrativo', icon: Briefcase, color: '#0ea5e9', items: [
      { to: '/recursos-humanos', icon: Briefcase, text: 'RH' }, { to: '/financeiro', icon: DollarSign, text: 'Financeiro' },
      { to: '/contratos', icon: FileText, text: 'Contratos' }, { to: '/merenda', icon: ClipboardList, text: 'Merenda' },
      { to: '/biblioteca', icon: BookOpen, text: 'Biblioteca' }, { to: '/patrimonio', icon: Package, text: 'Patrimônio' },
      { to: '/manutencao-preditiva', icon: Wrench, text: 'Manutenção' }, { to: '/relatorios', icon: BarChart3, text: 'Relatórios' },
      { to: '/comunicacao', icon: Bell, text: 'Comunicação' },
    ]},
    { key: 'configuracoes', label: 'Configurações', icon: Settings, color: '#64748b', items: [
      { to: '/configuracoes', icon: Settings, text: 'Configurações' }, { to: '/ia-rotas', icon: Brain, text: 'IA Rotas' },
      ...(role === 'super_admin' ? [{ to: '/super-admin', icon: Shield, text: 'Super Admin' }] : []),
    ]},
  ];

  // Auto-detect active module from current path
  useEffect(() => {
    const path = location.pathname;
    for (const mod of moduleBlocks) {
      if (mod.to && path === mod.to) { setActiveModule(null); return; }
      if (mod.items?.some(item => path === item.to || (item.to !== '/' && path.startsWith(item.to)))) {
        setActiveModule(mod.key);
        return;
      }
    }
  }, [location.pathname]);

  // Compatibility: keep adminMenu for the old rendering fallback
  const adminMenu = moduleBlocks.filter(m => m.items).map(m => ({ label: m.label.toUpperCase(), items: m.items! }));

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
      <nav className="flex-1 overflow-y-auto p-3">
        {/* PAINEL - Grid de módulos */}
        {isAdmin && !activeModule && (
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-2 mb-2">PAINEL</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {moduleBlocks.map(mod => {
                const ModIcon = mod.icon;
                const isActive = activeModule === mod.key || (mod.to && location.pathname === mod.to);
                return (
                  <button key={mod.key}
                    onClick={() => { if (mod.to) { window.location.href = mod.to; } else { setActiveModule(mod.key); } setSidebarOpen(false); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all ${isActive ? 'ring-2 ring-white/40' : 'hover:bg-white/10'}`}
                    style={{ backgroundColor: (mod.color || '#64748b') + '30' }}>
                    <ModIcon size={20} style={{ color: mod.color }} />
                    <span className="text-[11px] font-semibold text-white mt-1.5 leading-tight">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Subitens do módulo ativo */}
        {isAdmin && activeModule && (
          <div>
            <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 px-2 py-1.5 mb-2 text-xs text-white/50 hover:text-white/80 transition-all w-full">
              <ChevronRight size={12} className="rotate-180" /> Voltar ao Painel
            </button>
            {moduleBlocks.filter(m => m.key === activeModule).map(mod => (
              <div key={mod.key}>
                <div className="flex items-center gap-2 px-2 mb-3">
                  <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: mod.color + '40' }}>
                    <mod.icon size={14} style={{ color: mod.color }} />
                  </div>
                  <span className="text-xs font-bold text-white uppercase">{mod.label}</span>
                </div>
                <div className="space-y-0.5" style={{ borderLeft: `2px solid ${mod.color}40` }}>
                  {mod.items?.map(item => <NavLink key={item.to} {...item} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menus para motorista/monitor/pai (sem blocos) */}
        {!isAdmin && menuSections.map((section) => (
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
      <aside className={`hidden lg:flex flex-col bg-primary-500 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : isParent ? 'w-52' : 'w-60'}`}>
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          {!sidebarCollapsed && <img src="/logo.png" alt="NetEscol" className="h-7 w-auto" />}
          <button onClick={toggleSidebarCollapse} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all" title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}>
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        {sidebarCollapsed ? (
          <div className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-2">
            {moduleBlocks.map(mod => (
              <button key={mod.key} onClick={() => { if (mod.to) window.location.href = mod.to; else setActiveModule(mod.key); setSidebarCollapsed(false); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all" title={mod.label}
                style={{ backgroundColor: (mod.color || '#64748b') + '20' }}>
                <mod.icon size={18} style={{ color: mod.color }} />
              </button>
            ))}
          </div>
        ) : (
          <SidebarContent />
        )}
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

        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Buscar por nome, código ou palavra-chave... (ex: 102, alunos, nota)"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent-400 text-gray-800 dark:text-gray-200 placeholder:text-gray-400" />
            {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.length >= 1 && (
            <div className="absolute top-full left-6 mt-1 w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              {searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500">{searchResults.length} resultado(s) encontrado(s)</p>
                  </div>
                  {searchResults.slice(0, 10).map(r => (
                    <Link key={r.to} to={r.to} onClick={() => { setSearchQuery(''); setSearchOpen(false); setSidebarOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: r.color }}>
                        {r.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.text}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: r.color + '20', color: r.color }}>{r.module}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.desc}</p>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <div className="px-4 py-6 text-center">
                  <Search size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum resultado para "{searchQuery}"</p>
                  <p className="text-xs text-gray-400 mt-1">Tente buscar por nome, código ou palavra-chave</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-900' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
