import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  BarChart3, Search, FileText, School, GraduationCap, Bus, Briefcase,
  Star, ExternalLink, Clock, Filter, ChevronRight,
  TrendingUp, Users, Truck, BookOpen, Hash, X
} from 'lucide-react';

// ============================================
// CATALOGO DE RELATORIOS
// ============================================
interface Report {
  code: string;
  title: string;
  desc: string;
  module: string;
  color: string;
  to: string;
  icon: any;
  tags?: string[];
}

const MODULES = [
  { key: 'Gestão Escolar', label: 'Gestão Escolar', color: '#1E40AF', icon: School, desc: 'Alunos, matrículas e documentos' },
  { key: 'Ensino e Aprendizagem', label: 'Ensino e Aprendizagem', color: '#7C3AED', icon: GraduationCap, desc: 'Notas, frequência e avaliações' },
  { key: 'Frota e Rotas', label: 'Frota e Rotas', color: '#0369A1', icon: Bus, desc: 'Transporte, veículos e motoristas' },
  { key: 'Gestão e Recursos', label: 'Gestão e Recursos', color: '#0F766E', icon: Briefcase, desc: 'Financeiro, contratos e operacional' },
];

const REPORTS: Report[] = [
  // Gestão Escolar (12)
  { code: 'R101', title: 'Ficha de Matrícula', desc: 'Formulário oficial de matrícula para impressão', module: 'Gestão Escolar', color: '#1E40AF', to: '/ficha-matricula', icon: FileText, tags: ['aluno', 'matricula', 'formulario'] },
  { code: 'R102', title: 'Requerimento de Matrícula', desc: 'Renovação ou nova matrícula', module: 'Gestão Escolar', color: '#1E40AF', to: '/matriculas', icon: FileText, tags: ['aluno', 'matricula'] },
  { code: 'R103', title: 'Ficha Completa do Aluno', desc: 'Todos os dados do aluno para impressão', module: 'Gestão Escolar', color: '#1E40AF', to: '/ficha-aluno', icon: Users, tags: ['aluno', 'ficha', 'dados'] },
  { code: 'R104', title: 'Declaração de Matrícula', desc: 'Comprova matrícula ativa', module: 'Gestão Escolar', color: '#1E40AF', to: '/declarações', icon: FileText, tags: ['declaracao', 'matricula'] },
  { code: 'R105', title: 'Declaração de Transferência', desc: 'Para transferência entre escolas', module: 'Gestão Escolar', color: '#1E40AF', to: '/declarações', icon: FileText, tags: ['declaracao', 'transferência'] },
  { code: 'R106', title: 'Declaração de Frequência', desc: 'Comprova frequência escolar', module: 'Gestão Escolar', color: '#1E40AF', to: '/declarações', icon: FileText, tags: ['declaracao', 'frequência'] },
  { code: 'R107', title: 'Histórico Escolar', desc: 'Trajetória acadêmica completa', module: 'Gestão Escolar', color: '#1E40AF', to: '/historico-escolar', icon: BookOpen, tags: ['aluno', 'historico', 'academico'] },
  { code: 'R108', title: 'Relação de Alunos por Turma', desc: 'Lista de alunos filtrada por turma', module: 'Gestão Escolar', color: '#1E40AF', to: '/relacao-alunos-turma', icon: Users, tags: ['aluno', 'turma', 'lista'] },
  { code: 'R109', title: 'Relatório por Escola', desc: 'Visão completa de uma escola', module: 'Gestão Escolar', color: '#1E40AF', to: '/relatorio-escola', icon: School, tags: ['escola', 'relatorio'] },
  { code: 'R110', title: 'Carteirinha Estudantil', desc: 'Carteira do aluno com QR Code', module: 'Gestão Escolar', color: '#1E40AF', to: '/carteirinha', icon: Users, tags: ['aluno', 'carteirinha', 'qrcode'] },
  { code: 'R111', title: 'Registro de Ocorrências', desc: 'Ocorrências disciplinares', module: 'Gestão Escolar', color: '#1E40AF', to: '/ocorrências', icon: FileText, tags: ['ocorrência', 'disciplinar'] },
  { code: 'R112', title: 'Lista de Escolas', desc: 'Todas as escolas do município', module: 'Gestão Escolar', color: '#1E40AF', to: '/escolas', icon: School, tags: ['escola', 'lista'] },
  // Ensino e Aprendizagem
  { code: 'R201', title: 'Lista de Notas Bimestral', desc: 'Notas por turma/disciplina/bimestre', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/lancamento-notas', icon: GraduationCap, tags: ['notas', 'bimestre'] },
  { code: 'R202', title: 'Mapa de Resultados Final', desc: 'Aprovados, retidos, transferidos', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/ata-resultados', icon: TrendingUp, tags: ['resultados', 'ata', 'aprovacao'] },
  { code: 'R203', title: 'Boletim Escolar', desc: 'Notas por bimestre e média final', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/boletim', icon: FileText, tags: ['boletim', 'notas', 'aluno'] },
  { code: 'R204', title: 'Parecer Descritivo', desc: 'Avaliação qualitativa por aluno', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/parecer-descritivo', icon: BookOpen, tags: ['parecer', 'avaliacao'] },
  { code: 'R205', title: 'Relatório de Frequência', desc: 'Presença por aluno e período', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/relatorio-frequência', icon: Users, tags: ['frequência', 'presenca'] },
  { code: 'R206', title: 'ATA do Conselho de Classe', desc: 'Decisões por aluno e bimestre', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/conselho-classe', icon: FileText, tags: ['conselho', 'ata'] },
  { code: 'R207', title: 'Grade Horária', desc: 'Horário de aulas por turma', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/grade-horaria', icon: Clock, tags: ['horario', 'grade', 'turma'] },
  { code: 'R208', title: 'Relatório Individual do Aluno', desc: 'Relatório BNCC com competências e desempenho', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/relatorio-individual', icon: BookOpen, tags: ['individual', 'bncc', 'competencia', 'aluno'] },
  { code: 'R209', title: 'Quadro de Rendimento Escolar', desc: 'Aprovados, retidos e transferidos por turma', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/quadro-rendimento', icon: TrendingUp, tags: ['rendimento', 'aprovado', 'retido', 'escola'] },
  { code: 'R210', title: 'Ata de Resultados Finais', desc: 'Documento oficial de resultados do ano letivo', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/ata-resultados-finais', icon: FileText, tags: ['ata', 'resultado', 'final', 'oficial'] },
  { code: 'R211', title: 'Alunos com Baixo Rendimento', desc: 'Alunos com média abaixo do mínimo', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/baixo-rendimento', icon: TrendingUp, tags: ['baixo', 'rendimento', 'recuperacao', 'nota'] },
  { code: 'R212', title: 'Diário de Classe', desc: 'Frequência diária por turma e mês', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/diario-classe', icon: BookOpen, tags: ['diario', 'classe', 'frequência', 'presenca'] },
  { code: 'R213', title: 'Quadro Curricular', desc: 'Disciplinas e carga horária por turma', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/quadro-curricular', icon: BookOpen, tags: ['quadro', 'curricular', 'disciplina', 'horaria'] },
  { code: 'R214', title: 'Desempenho por Disciplina', desc: 'Média e aprovação por componente curricular', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/desempenho-disciplina', icon: TrendingUp, tags: ['desempenho', 'disciplina', 'media', 'aprovacao'] },
  // Frota e Rotas
  { code: 'R301', title: 'Relatório de Viagens', desc: 'Histórico de viagens concluídas', module: 'Frota e Rotas', color: '#0369A1', to: '/relatorio-transporte', icon: Bus, tags: ['viagem', 'transporte'] },
  { code: 'R302', title: 'Relatório da Frota', desc: 'Veículos, status e documentos', module: 'Frota e Rotas', color: '#0369A1', to: '/relatorios', icon: Truck, tags: ['veiculo', 'frota', 'documento'] },
  { code: 'R303', title: 'Vistoria de Veículos', desc: 'Checklist de inspeção veicular', module: 'Frota e Rotas', color: '#0369A1', to: '/vistoria-veiculos', icon: FileText, tags: ['vistoria', 'inspecao'] },
  { code: 'R304', title: 'Ficha do Motorista', desc: 'Dados completos do motorista', module: 'Frota e Rotas', color: '#0369A1', to: '/motoristas', icon: Users, tags: ['motorista', 'ficha'] },
  { code: 'R305', title: 'Lista de Monitores', desc: 'Monitores do transporte escolar', module: 'Frota e Rotas', color: '#0369A1', to: '/monitores', icon: Users, tags: ['monitor', 'lista'] },
  { code: 'R308', title: 'Alunos Transportados (FNDE)', desc: 'Relatório FNDE com todos os alunos do transporte', module: 'Frota e Rotas', color: '#0369A1', to: '/alunos-transportados', icon: Bus, tags: ['aluno', 'transportado', 'fnde', 'rota', 'rural'] },
  { code: 'R309', title: 'Quilometragem', desc: 'Km percorridos por veículo e rota', module: 'Frota e Rotas', color: '#0369A1', to: '/quilometragem', icon: Truck, tags: ['quilometragem', 'km', 'veiculo', 'distancia'] },
  { code: 'R310', title: 'Abastecimento', desc: 'Controle de combustível da frota', module: 'Frota e Rotas', color: '#0369A1', to: '/abastecimento', icon: Truck, tags: ['abastecimento', 'combustivel', 'diesel', 'litro'] },
  { code: 'R311', title: 'Manutenções', desc: 'Histórico de manutenções da frota', module: 'Frota e Rotas', color: '#0369A1', to: '/relatorio-manutencoes', icon: Truck, tags: ['manutencao', 'preventiva', 'corretiva', 'custo'] },
  // Gestão e Recursos
  { code: 'R401', title: 'Relatório Financeiro', desc: 'Receitas, despesas e saldo', module: 'Gestão e Recursos', color: '#0F766E', to: '/financeiro', icon: TrendingUp, tags: ['financeiro', 'receita', 'despesa'] },
  { code: 'R402', title: 'Relatório de Contratos', desc: 'Contratos vigentes e vencidos', module: 'Gestão e Recursos', color: '#0F766E', to: '/contratos', icon: FileText, tags: ['contrato', 'fornecedor'] },
  { code: 'R403', title: 'Estoque da Merenda', desc: 'Itens, entradas e saídas', module: 'Gestão e Recursos', color: '#0F766E', to: '/estoque-merenda', icon: Briefcase, tags: ['merenda', 'estoque'] },
  { code: 'R404', title: 'Cotação de Compras', desc: 'Comparativo de fornecedores', module: 'Gestão e Recursos', color: '#0F766E', to: '/cotacao-compras', icon: Briefcase, tags: ['cotacao', 'compra'] },
  { code: 'R405', title: 'Protocolo', desc: 'Requerimentos e solicitações', module: 'Gestão e Recursos', color: '#0F766E', to: '/protocolo', icon: FileText, tags: ['protocolo', 'requerimento'] },
  { code: 'R406', title: 'Mural Informativo', desc: 'Comunicados e avisos', module: 'Gestão e Recursos', color: '#0F766E', to: '/mural', icon: FileText, tags: ['mural', 'comunicado'] },
  { code: 'R407', title: 'Relatório de RH', desc: 'Quadro de pessoal por cargo e departamento', module: 'Gestão e Recursos', color: '#0F766E', to: '/relatorio-rh', icon: Users, tags: ['rh', 'pessoal', 'servidor', 'cargo'] },
  { code: 'R408', title: 'Relatório de Patrimônio', desc: 'Inventário de bens patrimoniais', module: 'Gestão e Recursos', color: '#0F766E', to: '/relatorio-patrimonio', icon: Briefcase, tags: ['patrimonio', 'bem', 'inventario', 'tombamento'] },
  { code: 'R409', title: 'Relatório EDUCACENSO', desc: 'Dados consolidados para o Censo Escolar', module: 'Gestão e Recursos', color: '#0F766E', to: '/relatorio-educacenso', icon: TrendingUp, tags: ['educacenso', 'censo', 'inep', 'escolar'] },
  { code: 'R410', title: 'Risco de Evasão Escolar', desc: 'Análise de risco de abandono por aluno via IA', module: 'Ensino e Aprendizagem', color: '#7C3AED', to: '/risco-evasao', icon: TrendingUp, tags: ['risco', 'evasao', 'abandono', 'ia', 'frequência'] },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function ReportCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Favoritos
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('netescol_report_favorites') || '[]'); } catch { return []; }
  });

  // Ultimos acessados
  const [recentReports, setRecentReports] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('netescol_report_recent') || '[]'); } catch { return []; }
  });

  const toggleFav = (code: string) => {
    const next = favorites.includes(code) ? favorites.filter(f => f !== code) : [...favorites, code];
    setFavorites(next);
    localStorage.setItem('netescol_report_favorites', JSON.stringify(next));
  };

  const trackAccess = (code: string) => {
    const next = [code, ...recentReports.filter(c => c !== code)].slice(0, 5);
    setRecentReports(next);
    localStorage.setItem('netescol_report_recent', JSON.stringify(next));
  };

  const openReport = (r: Report) => {
    trackAccess(r.code);
    navigate(r.to);
  };

  // Filtros
  const filtered = REPORTS.filter(r => {
    if (filterModule && r.module !== filterModule) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || (r.tags || []).some(t => t.includes(q));
    }
    return true;
  });

  const favReports = REPORTS.filter(r => favorites.includes(r.code));
  const recentList = recentReports.map(code => REPORTS.find(r => r.code === code)).filter(Boolean) as Report[];

  // KPIs por modulo
  const moduleCounts = MODULES.map(m => ({
    ...m,
    count: REPORTS.filter(r => r.module === m.key).length,
  }));

  // Atalho de teclado: / para buscar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement)?.closest('input,textarea,select')) {
        e.preventDefault();
        document.getElementById('report-search')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="p-6">
      {/* HEADER com KPIs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Central de Relatorios</h1>
              <p className="text-gray-500 text-sm">{REPORTS.length} relatorios disponiveis em {MODULES.length} modulos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent-100 text-accent-600' : 'text-gray-400 hover:text-gray-600'}`} title="Grade">
              <Hash size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent-100 text-accent-600' : 'text-gray-400 hover:text-gray-600'}`} title="Lista">
              <FileText size={18} />
            </button>
          </div>
        </div>

        {/* KPI Cards por modulo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {moduleCounts.map(m => {
            const Icon = m.icon;
            const isActive = filterModule === m.key;
            return (
              <button key={m.key} onClick={() => setFilterModule(isActive ? '' : m.key)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${isActive ? 'border-current shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:shadow-sm'}`}
                style={isActive ? { borderColor: m.color, backgroundColor: m.color + '10' } : {}}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: m.color + '20' }}>
                    <Icon size={18} style={{ color: m.color }} />
                  </div>
                  <span className="text-2xl font-bold" style={{ color: m.color }}>{m.count}</span>
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{m.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Busca + Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="report-search" className="input pl-9 pr-16" placeholder="Buscar relatorio... (pressione /)" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
          {filterModule && (
            <button onClick={() => setFilterModule('')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: MODULES.find(m => m.key === filterModule)?.color, color: MODULES.find(m => m.key === filterModule)?.color, backgroundColor: (MODULES.find(m => m.key === filterModule)?.color || '') + '10' }}>
              <Filter size={14} /> {filterModule} <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* SECAO: Favoritos */}
      {favReports.length > 0 && !search && !filterModule && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-yellow-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Star size={14} fill="currentColor" /> Meus Favoritos ({favReports.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {favReports.map(r => (
              <button key={r.code} onClick={() => openReport(r)}
                className="flex items-center gap-3 p-3 rounded-xl border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-800 transition-all text-left group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: r.color }}>{r.code}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{r.desc}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-yellow-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECAO: Ultimos Acessados */}
      {recentList.length > 0 && !search && !filterModule && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock size={14} /> Ultimos Acessados
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentList.map(r => (
              <button key={r.code} onClick={() => openReport(r)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-all text-left flex-shrink-0">
                <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: r.color }}>{r.code}</div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{r.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECAO: Relatorios por Modulo */}
      {(filterModule ? [filterModule] : MODULES.map(m => m.key)).map(modKey => {
        const mod = MODULES.find(m => m.key === modKey);
        const modReports = filtered.filter(r => r.module === modKey);
        if (modReports.length === 0 || !mod) return null;

        return (
          <div key={modKey} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-7 rounded-full" style={{ backgroundColor: mod.color }} />
              <mod.icon size={18} style={{ color: mod.color }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: mod.color }}>{mod.label}</h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{modReports.length}</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800 ml-2" />
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {modReports.map(r => {
                  const Icon = r.icon;
                  return (
                    <div key={r.code} className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: r.color + '15' }}>
                            <Icon size={20} style={{ color: r.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: r.color }}>{r.code}</span>
                              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{r.title}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.desc}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleFav(r.code); }}
                            className={`p-1 rounded transition-all flex-shrink-0 ${favorites.includes(r.code) ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}>
                            <Star size={14} fill={favorites.includes(r.code) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        {r.tags && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {r.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <button onClick={() => openReport(r)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors">
                          <ExternalLink size={13} /> Abrir Relatório
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MODO LISTA */
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Codigo</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Relatorio</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Descrição</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {modReports.map(r => {
                      const Icon = r.icon;
                      return (
                        <tr key={r.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-1 rounded text-white" style={{ backgroundColor: r.color }}>{r.code}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon size={16} style={{ color: r.color }} />
                              <span className="font-medium text-gray-800 dark:text-gray-200">{r.title}</span>
                              {favorites.includes(r.code) && <Star size={12} className="text-yellow-400" fill="currentColor" />}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{r.desc}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openReport(r)} className="px-2.5 py-1 text-xs font-medium text-accent-600 hover:bg-accent-50 rounded-lg transition-colors">Abrir</button>
                              <button onClick={() => toggleFav(r.code)} className={`p-1 rounded-lg transition-colors ${favorites.includes(r.code) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                                <Star size={14} fill={favorites.includes(r.code) ? 'currentColor' : 'none'} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* VAZIO */}
      {filtered.length === 0 && (
        <div className="card text-center py-16">
          <Search size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum relatorio encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Tente outra busca ou limpe os filtros</p>
          {(search || filterModule) && (
            <button onClick={() => { setSearch(''); setFilterModule(''); }} className="btn-secondary mt-4">Limpar filtros</button>
          )}
        </div>
      )}
    </div>
  );
}
