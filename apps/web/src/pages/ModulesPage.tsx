import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  School, Users, GraduationCap, Bus, Briefcase, Settings,
  BookOpen, ClipboardList, Calendar, FileText, MapPin, Heart,
  BarChart3, CreditCard, MessageSquare, ListOrdered, ArrowRightLeft,
  ArrowUpCircle, History, Navigation, Locate, MapPinned, Wrench,
  DollarSign, Package, BookMarked, Database, Brain, Shield
} from 'lucide-react';

interface ModuleCard {
  to: string;
  icon: any;
  title: string;
  desc: string;
  color: string;
  bgColor: string;
}

const MODULES: { section: string; sectionColor: string; sectionIcon: any; cards: ModuleCard[] }[] = [
  {
    section: 'Secretaria', sectionColor: '#6366f1', sectionIcon: School,
    cards: [
      { to: '/escolas', icon: School, title: 'Escolas', desc: 'Cadastro de unidades escolares', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/alunos', icon: Users, title: 'Alunos', desc: 'Cadastro e gestao de alunos', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/matriculas', icon: ClipboardList, title: 'Matriculas', desc: 'Matriculas e enturmacao', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/turmas', icon: Users, title: 'Turmas', desc: 'Gestao de turmas por escola', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/series', icon: BookOpen, title: 'Series', desc: 'Niveis e etapas de ensino', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/anos-letivos', icon: Calendar, title: 'Anos Letivos', desc: 'Periodos letivos', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/professores', icon: GraduationCap, title: 'Professores', desc: 'Corpo docente', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/lista-espera', icon: ListOrdered, title: 'Lista de Espera', desc: 'Fila de vagas', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/remanejamento', icon: ArrowRightLeft, title: 'Remanejamento', desc: 'Transferir entre turmas', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/carteirinha', icon: CreditCard, title: 'Carteirinha', desc: 'Carteira estudantil', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/promocao', icon: ArrowUpCircle, title: 'Promocao', desc: 'Promover aprovados', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
      { to: '/historico-escolar', icon: History, title: 'Historico', desc: 'Historico escolar', color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    ]
  },
  {
    section: 'Pedagogico', sectionColor: '#8b5cf6', sectionIcon: GraduationCap,
    cards: [
      { to: '/disciplinas', icon: FileText, title: 'Disciplinas', desc: 'Componentes curriculares', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/diario-escolar', icon: BookOpen, title: 'Diario Escolar', desc: 'Frequencia e conteudo', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/lancamento-notas', icon: ClipboardList, title: 'Lancar Notas', desc: 'Notas por avaliacao', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/boletim', icon: FileText, title: 'Boletim', desc: 'Boletim escolar', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/parecer-descritivo', icon: BookOpen, title: 'Parecer', desc: 'Parecer descritivo', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/ata-resultados', icon: FileText, title: 'ATA Resultados', desc: 'Resultados finais', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/relatorio-frequencia', icon: BarChart3, title: 'Rel. Frequencia', desc: 'Presenca por aluno', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/calendario', icon: Calendar, title: 'Calendario', desc: 'Calendario escolar', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
      { to: '/educacenso', icon: Database, title: 'EDUCACENSO', desc: 'Censo escolar', color: 'text-violet-600', bgColor: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
    ]
  },
  {
    section: 'Transporte', sectionColor: '#f97316', sectionIcon: Bus,
    cards: [
      { to: '/rotas', icon: MapPin, title: 'Rotas', desc: 'Rotas e paradas', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/veiculos', icon: Bus, title: 'Veiculos', desc: 'Frota escolar', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/motoristas', icon: Users, title: 'Motoristas', desc: 'Motoristas e CNH', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/monitores', icon: Users, title: 'Monitores', desc: 'Auxiliares de transporte', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/monitor', icon: Navigation, title: 'Monitoramento', desc: 'Viagens em tempo real', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/mapa-tempo-real', icon: MapPinned, title: 'Mapa Tempo Real', desc: 'GPS dos onibus', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/rastreamento', icon: Locate, title: 'Rastreamento', desc: 'GPS do motorista', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/frequencia', icon: ClipboardList, title: 'Frequencia', desc: 'Embarque e desembarque', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/portal-responsavel', icon: Heart, title: 'Portal Responsavel', desc: 'Acompanhamento dos pais', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
      { to: '/relatorio-transporte', icon: BarChart3, title: 'Relatorio', desc: 'Relatorio de transporte', color: 'text-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
    ]
  },
  {
    section: 'Administrativo', sectionColor: '#0ea5e9', sectionIcon: Briefcase,
    cards: [
      { to: '/recursos-humanos', icon: Briefcase, title: 'RH', desc: 'Recursos Humanos', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/financeiro', icon: DollarSign, title: 'Financeiro', desc: 'Contas e movimentacoes', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/contratos', icon: FileText, title: 'Contratos', desc: 'Gestao de contratos', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/merenda', icon: ClipboardList, title: 'Merenda', desc: 'Merenda escolar', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/biblioteca', icon: BookMarked, title: 'Biblioteca', desc: 'Acervo e emprestimos', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/patrimonio', icon: Package, title: 'Patrimonio', desc: 'Bens e estoque', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/manutencao-preditiva', icon: Wrench, title: 'Manutencao', desc: 'Manutencao de veiculos', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/relatorios', icon: BarChart3, title: 'Relatorios', desc: 'Relatorios gerais', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
      { to: '/comunicacao', icon: MessageSquare, title: 'Comunicacao', desc: 'Recados e avisos', color: 'text-sky-600', bgColor: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
    ]
  },
  {
    section: 'Configuracoes', sectionColor: '#64748b', sectionIcon: Settings,
    cards: [
      { to: '/configuracoes', icon: Settings, title: 'Configuracoes', desc: 'Usuarios e sistema', color: 'text-slate-600', bgColor: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
      { to: '/ia-rotas', icon: Brain, title: 'IA Rotas', desc: 'Otimizacao por IA', color: 'text-slate-600', bgColor: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
      { to: '/transparencia', icon: Database, title: 'Transparencia', desc: 'Portal publico', color: 'text-slate-600', bgColor: 'bg-slate-50 hover:bg-slate-100 border-slate-200' },
    ]
  },
];

export default function ModulesPage() {
  const { user } = useAuth();
  const isAdmin = ['super_admin', 'municipal_admin', 'secretary'].includes(user?.role || '');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modulos do Sistema</h1>
        <p className="text-gray-500">Acesso rapido a todas as funcionalidades</p>
      </div>

      <div className="space-y-8">
        {MODULES.map(mod => (
          <div key={mod.section}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: mod.sectionColor + '20' }}>
                <mod.sectionIcon size={18} style={{ color: mod.sectionColor }} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: mod.sectionColor }}>{mod.section}</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {mod.cards.map(card => (
                <Link key={card.to} to={card.to}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${card.bgColor} group`}>
                  <div className={`w-11 h-11 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    <card.icon size={22} className={card.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-gray-900">{card.title}</p>
                    <p className="text-xs text-gray-500 truncate">{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
