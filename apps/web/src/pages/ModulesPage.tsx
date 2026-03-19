import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import {
  LayoutDashboard, School, GraduationCap, Bus, Briefcase, Settings,
  Users, MapPin, BarChart3, ArrowRight
} from 'lucide-react';

const MODULES = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    desc: 'Visão geral, KPIs, alertas e gráficos do município',
    color: '#2DB5B0',
    gradient: 'from-[#2DB5B0] to-[#249a96]',
  },
  {
    to: '/modulos?m=secretaria',
    icon: School,
    title: 'Secretaria',
    desc: 'Escolas, alunos, matrículas, turmas, séries e professores',
    color: '#6366f1',
    gradient: 'from-[#6366f1] to-[#4f46e5]',
    links: [
      { to: '/escolas', text: 'Escolas' }, { to: '/alunos', text: 'Alunos' },
      { to: '/matriculas', text: 'Matrículas' }, { to: '/turmas', text: 'Turmas' },
      { to: '/professores', text: 'Professores' }, { to: '/historico-escolar', text: 'Histórico' },
    ],
  },
  {
    to: '/modulos?m=pedagogico',
    icon: GraduationCap,
    title: 'Pedagógico',
    desc: 'Diário escolar, notas, boletim, frequência e calendário',
    color: '#8b5cf6',
    gradient: 'from-[#8b5cf6] to-[#7c3aed]',
    links: [
      { to: '/diario-escolar', text: 'Diário' }, { to: '/lancamento-notas', text: 'Notas' },
      { to: '/boletim', text: 'Boletim' }, { to: '/calendario', text: 'Calendário' },
      { to: '/relatorio-frequencia', text: 'Frequência' }, { to: '/educacenso', text: 'EDUCACENSO' },
    ],
  },
  {
    to: '/modulos?m=transporte',
    icon: Bus,
    title: 'Transporte',
    desc: 'Rotas, veículos, motoristas, GPS e monitoramento em tempo real',
    color: '#f97316',
    gradient: 'from-[#f97316] to-[#ea580c]',
    links: [
      { to: '/rotas', text: 'Rotas' }, { to: '/veiculos', text: 'Veículos' },
      { to: '/monitor', text: 'Monitoramento' }, { to: '/mapa-tempo-real', text: 'Mapa GPS' },
      { to: '/motoristas', text: 'Motoristas' }, { to: '/portal-responsavel', text: 'Portal Pais' },
    ],
  },
  {
    to: '/modulos?m=administrativo',
    icon: Briefcase,
    title: 'Administrativo',
    desc: 'RH, financeiro, contratos, merenda, biblioteca e patrimônio',
    color: '#0ea5e9',
    gradient: 'from-[#0ea5e9] to-[#0284c7]',
    links: [
      { to: '/recursos-humanos', text: 'RH' }, { to: '/financeiro', text: 'Financeiro' },
      { to: '/contratos', text: 'Contratos' }, { to: '/merenda', text: 'Merenda' },
      { to: '/biblioteca', text: 'Biblioteca' }, { to: '/relatorios', text: 'Relatórios' },
    ],
  },
  {
    to: '/configuracoes',
    icon: Settings,
    title: 'Configurações',
    desc: 'Usuários, perfis de acesso, segurança e preferências',
    color: '#64748b',
    gradient: 'from-[#64748b] to-[#475569]',
  },
];

export default function ModulesPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;

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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
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

      {/* Module Banners - Grid 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULES.map(mod => (
          <div key={mod.title} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            {/* Banner header with gradient */}
            <Link to={mod.to.startsWith('/modulos') ? (mod.links?.[0]?.to || '/') : mod.to}
              className={`block bg-gradient-to-r ${mod.gradient} p-5 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <mod.icon size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{mod.title}</h3>
                  <p className="text-white/70 text-sm mt-0.5">{mod.desc}</p>
                </div>
              </div>
            </Link>

            {/* Quick links */}
            {mod.links && (
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {mod.links.map(link => (
                    <Link key={link.to} to={link.to}
                      className="text-center py-2.5 px-2 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {link.text}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* For modules without links (Dashboard, Config) */}
            {!mod.links && (
              <div className="p-4">
                <Link to={mod.to} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                  Acessar <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
