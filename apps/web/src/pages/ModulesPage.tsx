import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import DashboardWidget from '../components/DashboardWidget';
import {
  LayoutDashboard, School, GraduationCap, Bus, Briefcase, Settings,
  Users, MapPin, BarChart3, ArrowRight, ArrowLeft, Grid3X3, List,
  Route, BookOpen, FileText, ClipboardList, Calendar, Database,
  Navigation, Locate, MapPinned, Heart, UserCheck, Bell, DollarSign,
  Package, Wrench, Brain, Shield, AlertTriangle, FileCheck, Building2,
  Warehouse, Fuel
} from 'lucide-react';

// Ícones por rota para o submódulo
const ICON_MAP: Record<string, any> = {
  '/escolas': School, '/alunos': Users, '/matriculas': FileText, '/turmas': GraduationCap,
  '/series': GraduationCap, '/professores': UserCheck, '/ficha-matricula': FileText,
  '/anos-letivos': Calendar, '/lista-espera': ClipboardList, '/carteirinha': FileText,
  '/remanejamento': Users, '/relatorios': BarChart3, '/declaracoes': FileText,
  '/ocorrencias': AlertTriangle, '/ficha-aluno': FileText, '/relatorio-escola': School,
  '/relacao-alunos-turma': Users, '/historico-escolar': BookOpen,
  '/disciplinas': BookOpen, '/diario-escolar': BookOpen, '/lancamento-notas': FileText,
  '/boletim': FileText, '/parecer-descritivo': BookOpen, '/ata-resultados': FileText,
  '/calendario': Calendar, '/educacenso': Database, '/grade-horaria': Calendar,
  '/conselho-classe': Users, '/relatorio-individual': BookOpen,
  '/quadro-rendimento': BarChart3, '/ata-resultados-finais': FileText,
  '/baixo-rendimento': AlertTriangle, '/diario-classe': BookOpen,
  '/quadro-curricular': BookOpen, '/desempenho-disciplina': BarChart3,
  '/rotas': Route, '/veiculos': Bus, '/motoristas': UserCheck, '/monitores': UserCheck,
  '/monitor': Navigation, '/mapa-tempo-real': MapPinned, '/rastreamento': Locate,
  '/portal-responsavel': Heart, '/relatorio-transporte': BarChart3,
  '/vistoria-veiculos': ClipboardList, '/alunos-transportados': Users,
  '/quilometragem': BarChart3, '/abastecimento': Fuel, '/relatorio-manutencoes': Wrench,
  '/fornecedores': Building2, '/ordens-servico': ClipboardList, '/garagens': Warehouse,
  '/coleta-gps': MapPinned, '/ia-rotas': Brain, '/frequencia': ClipboardList,
  '/recursos-humanos': Briefcase, '/financeiro': DollarSign, '/contratos': FileText,
  '/merenda': ClipboardList, '/biblioteca': BookOpen, '/patrimonio': Package,
  '/manutencao-preditiva': Wrench, '/central-relatorios': BarChart3,
  '/comunicacao': Bell, '/envio-massa': Bell, '/cotacao-compras': DollarSign,
  '/estoque-merenda': Package, '/protocolo': ClipboardList, '/eventos': Calendar,
  '/mural': Bell, '/relatorio-rh': Briefcase, '/relatorio-patrimonio': Package,
  '/relatorio-educacenso': Database,
  '/cadastro-prefeitura': School, '/configuracoes': Settings,
  '/risco-evasao': AlertTriangle, '/atividade-usuarios': Users,
  '/sobre': Settings, '/gestao-documentos': FileCheck, '/backup': Database,
  '/super-admin': Shield, '/config-formularios': Settings, '/perfil': Users,
};

const MODULE_DATA: Record<string, { title: string; desc: string; color: string; gradient: string; icon: any; items: { to: string; text: string; desc: string }[] }> = {
  secretaria: {
    title: 'Gestão Escolar', desc: 'Escolas, alunos, matrículas, turmas e professores',
    color: '#1E40AF', gradient: 'from-[#1E40AF] to-[#1a389d]', icon: School,
    items: [
      { to: '/escolas', text: 'Escolas', desc: 'Cadastro e gestão de escolas' },
      { to: '/alunos', text: 'Alunos', desc: 'Cadastro completo de alunos' },
      { to: '/matriculas', text: 'Matrículas', desc: 'Matrículas por turma e ano' },
      { to: '/turmas', text: 'Turmas', desc: 'Gestão de turmas e séries' },
      { to: '/series', text: 'Séries', desc: 'Etapas e séries escolares' },
      { to: '/professores', text: 'Professores', desc: 'Cadastro de docentes' },
      { to: '/anos-letivos', text: 'Anos Letivos', desc: 'Períodos acadêmicos' },
      { to: '/ficha-matricula', text: 'Ficha de Matrícula', desc: 'Formulário oficial' },
      { to: '/lista-espera', text: 'Lista de Espera', desc: 'Fila de vagas' },
      { to: '/carteirinha', text: 'Carteirinha', desc: 'Carteira estudantil com QR' },
      { to: '/remanejamento', text: 'Remanejamento', desc: 'Transferência entre turmas' },
      { to: '/declaracoes', text: 'Declarações', desc: 'Documentos e certidões' },
      { to: '/ocorrencias', text: 'Ocorrências', desc: 'Registros disciplinares' },
      { to: '/historico-escolar', text: 'Histórico Escolar', desc: 'Anos anteriores' },
    ],
  },
  pedagogico: {
    title: 'Ensino e Aprendizagem', desc: 'Diário escolar, notas, boletim e calendário',
    color: '#7C3AED', gradient: 'from-[#7C3AED] to-[#6D28D9]', icon: GraduationCap,
    items: [
      { to: '/diario-escolar', text: 'Diário Escolar', desc: 'Registro diário de aulas' },
      { to: '/lancamento-notas', text: 'Lançar Notas', desc: 'Notas e avaliações' },
      { to: '/boletim', text: 'Boletim Escolar', desc: 'Boletim do aluno' },
      { to: '/parecer-descritivo', text: 'Parecer Descritivo', desc: 'Avaliação qualitativa' },
      { to: '/disciplinas', text: 'Disciplinas', desc: 'Componentes curriculares' },
      { to: '/grade-horaria', text: 'Grade Horária', desc: 'Horários das turmas' },
      { to: '/calendario', text: 'Calendário Escolar', desc: 'Eventos e feriados' },
      { to: '/conselho-classe', text: 'Conselho de Classe', desc: 'Decisões pedagógicas' },
      { to: '/ata-resultados', text: 'ATA Resultados', desc: 'Atas de resultados' },
      { to: '/ata-resultados-finais', text: 'Resultados Finais', desc: 'Ata final do ano' },
      { to: '/relatorio-individual', text: 'Relatório Individual', desc: 'Relatório BNCC' },
      { to: '/quadro-rendimento', text: 'Quadro de Rendimento', desc: 'Aprovação por turma' },
      { to: '/diario-classe', text: 'Diário de Classe', desc: 'Frequência mensal' },
      { to: '/educacenso', text: 'EDUCACENSO', desc: 'Censo Escolar INEP' },
    ],
  },
  transporte: {
    title: 'Frota e Rotas', desc: 'Rotas, veículos, motoristas e monitoramento GPS',
    color: '#D97706', gradient: 'from-[#D97706] to-[#B45309]', icon: Bus,
    items: [
      { to: '/rotas', text: 'Rotas', desc: 'Gestão de rotas de transporte' },
      { to: '/veiculos', text: 'Veículos', desc: 'Frota de ônibus e vans' },
      { to: '/motoristas', text: 'Motoristas', desc: 'Cadastro de motoristas' },
      { to: '/monitores', text: 'Monitores', desc: 'Monitores de ônibus' },
      { to: '/monitor', text: 'Monitoramento', desc: 'Acompanhar viagens ativas' },
      { to: '/mapa-tempo-real', text: 'Mapa GPS', desc: 'Veículos em tempo real' },
      { to: '/ia-rotas', text: 'IA Rotas', desc: 'Geração inteligente de rotas' },
      { to: '/coleta-gps', text: 'Coleta GPS', desc: 'Marcar pontos dos alunos' },
      { to: '/fornecedores', text: 'Fornecedores', desc: 'Mecânicas e postos' },
      { to: '/ordens-servico', text: 'Ordens de Serviço', desc: 'OS de manutenção' },
      { to: '/garagens', text: 'Garagens', desc: 'Locais de guarda da frota' },
      { to: '/vistoria-veiculos', text: 'Vistoria', desc: 'Checklist de inspeção' },
      { to: '/abastecimento', text: 'Abastecimento', desc: 'Controle de combustível' },
      { to: '/quilometragem', text: 'Quilometragem', desc: 'Km por veículo e rota' },
      { to: '/alunos-transportados', text: 'Alunos Transportados', desc: 'Relatório FNDE' },
      { to: '/portal-responsavel', text: 'Portal Pais', desc: 'Portal do responsável' },
    ],
  },
  administrativo: {
    title: 'Gestão e Recursos', desc: 'RH, financeiro, contratos, merenda e patrimônio',
    color: '#0F766E', gradient: 'from-[#0F766E] to-[#0D6460]', icon: Briefcase,
    items: [
      { to: '/recursos-humanos', text: 'RH', desc: 'Quadro de pessoal' },
      { to: '/financeiro', text: 'Financeiro', desc: 'Receitas e despesas' },
      { to: '/contratos', text: 'Contratos', desc: 'Contratos e fornecedores' },
      { to: '/merenda', text: 'Merenda', desc: 'Cardápios escolares' },
      { to: '/estoque-merenda', text: 'Estoque Merenda', desc: 'Entrada e saída' },
      { to: '/biblioteca', text: 'Biblioteca', desc: 'Acervo e empréstimos' },
      { to: '/patrimonio', text: 'Patrimônio', desc: 'Bens patrimoniais' },
      { to: '/comunicacao', text: 'Comunicação', desc: 'Mensagens e recados' },
      { to: '/eventos', text: 'Eventos', desc: 'Festas e formaturas' },
      { to: '/protocolo', text: 'Protocolo', desc: 'Requerimentos oficiais' },
      { to: '/mural', text: 'Mural', desc: 'Avisos e comunicados' },
      { to: '/cotacao-compras', text: 'Cotações', desc: 'Pesquisa de preços' },
      { to: '/central-relatorios', text: 'Central Relatórios', desc: 'Todos os relatórios' },
    ],
  },
  controle: {
    title: 'Central de Controle', desc: 'Configurações, segurança e administração',
    color: '#475569', gradient: 'from-[#475569] to-[#334155]', icon: Settings,
    items: [
      { to: '/cadastro-prefeitura', text: 'Prefeitura', desc: 'Dados do município' },
      { to: '/configuracoes', text: 'Configurações', desc: 'Preferências do sistema' },
      { to: '/ia-rotas', text: 'IA Rotas', desc: 'Geração inteligente de rotas' },
      { to: '/gestao-documentos', text: 'Documentos', desc: 'Assinaturas eletrônicas' },
      { to: '/atividade-usuarios', text: 'Atividade', desc: 'Log de usuários' },
      { to: '/backup', text: 'Backup', desc: 'Backup de dados' },
      { to: '/risco-evasao', text: 'Risco Evasão', desc: 'Análise preditiva' },
      { to: '/manutencao-preditiva', text: 'Manutenção Preditiva', desc: 'Previsão de manutenções' },
      { to: '/relatorios', text: 'Relatórios', desc: 'Relatórios gerais do sistema' },
      { to: '/super-admin', text: 'Super Admin', desc: 'Gestão de prefeituras' },
      { to: '/config-formularios', text: 'Config. Formulários', desc: 'Campos obrigatórios' },
      { to: '/perfil', text: 'Meu Perfil', desc: 'Dados profissionais' },
      { to: '/sobre', text: 'Sobre', desc: 'Informações do sistema' },
    ],
  },
};

const MAIN_MODULES = [
  { key: 'dashboard', to: '/dashboard', icon: LayoutDashboard, title: 'Painel Central', desc: 'Indicadores e gráficos', color: '#059669', gradient: 'from-[#059669] to-[#047857]' },
  { key: 'secretaria', to: '/modulos?m=secretaria', icon: School, title: 'Gestão Escolar', desc: 'Escolas, alunos e matrículas', color: '#1E40AF', gradient: 'from-[#1E40AF] to-[#1a389d]' },
  { key: 'pedagogico', to: '/modulos?m=pedagogico', icon: GraduationCap, title: 'Ensino e Aprendizagem', desc: 'Notas, boletim e calendário', color: '#7C3AED', gradient: 'from-[#7C3AED] to-[#6D28D9]' },
  { key: 'transporte', to: '/modulos?m=transporte', icon: Bus, title: 'Frota e Rotas', desc: 'Transporte e GPS', color: '#D97706', gradient: 'from-[#D97706] to-[#B45309]' },
  { key: 'administrativo', to: '/modulos?m=administrativo', icon: Briefcase, title: 'Gestão e Recursos', desc: 'RH, financeiro e mais', color: '#0F766E', gradient: 'from-[#0F766E] to-[#0D6460]' },
  { key: 'controle', to: '/modulos?m=controle', icon: Settings, title: 'Central de Controle', desc: 'Configurações e segurança', color: '#475569', gradient: 'from-[#475569] to-[#334155]' },
];

export default function ModulesPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [searchParams] = useSearchParams();
  const moduleKey = searchParams.get('m');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: routesData } = useQuery(() => api.routes.list({ municipalityId: mid }), [mid]);
  const { data: activeTrips } = useQuery(() => api.trips.listActive({ municipalityId: mid }), [mid]);

  const stats = {
    students: ((studentsData as any) || []).length,
    schools: ((schoolsData as any) || []).length,
    routes: ((routesData as any) || []).length,
    activeTrips: ((activeTrips as any) || []).length,
  };

  // Se tem módulo selecionado (?m=transporte), mostra os itens do módulo
  const mod = moduleKey ? MODULE_DATA[moduleKey] : null;
  if (mod) {
    const ModIcon = mod.icon;
    return (
      <div className="p-6 lg:p-8">
        {/* Header do módulo */}
        <div className="mb-6">
          <Link to="/modulos" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-3 transition-colors">
            <ArrowLeft size={14} /> Voltar aos Módulos
          </Link>
          <div className={`bg-gradient-to-r ${mod.gradient} rounded-2xl p-6 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ModIcon size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{mod.title}</h1>
                <p className="text-white/70 mt-0.5">{mod.desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle view */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{mod.items.length} funcionalidades</p>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}><Grid3X3 size={16} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}><List size={16} /></button>
          </div>
        </div>

        {/* Grid view */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mod.items.map(item => {
              const ItemIcon = ICON_MAP[item.to] || FileText;
              return (
                <Link key={item.to} to={item.to}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: mod.color + '15' }}>
                    <ItemIcon size={26} style={{ color: mod.color }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.text}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{item.desc}</p>
                </Link>
              );
            })}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {mod.items.map(item => {
              const ItemIcon = ICON_MAP[item.to] || FileText;
              return (
                <Link key={item.to} to={item.to}
                  className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-gray-300 transition-all group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: mod.color + '15' }}>
                    <ItemIcon size={20} style={{ color: mod.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.text}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Tela principal (sem módulo selecionado)
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bem-vindo ao NetEscol</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Selecione um módulo para começar</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center"><Users size={20} className="text-indigo-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.students}</p><p className="text-xs text-gray-500">Alunos</p></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><School size={20} className="text-blue-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.schools}</p><p className="text-xs text-gray-500">Escolas</p></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><MapPin size={20} className="text-orange-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.routes}</p><p className="text-xs text-gray-500">Rotas</p></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Bus size={20} className="text-green-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeTrips}</p><p className="text-xs text-gray-500">Viagens Ativas</p></div></div>
        </div>
      </div>

      <DashboardWidget />

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MAIN_MODULES.map(mod => (
          <Link key={mod.key} to={mod.to}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className={`bg-gradient-to-r ${mod.gradient} p-5 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <mod.icon size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{mod.title}</h3>
                  <p className="text-white/70 text-sm mt-0.5">{mod.desc}</p>
                </div>
                <ArrowRight size={20} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
