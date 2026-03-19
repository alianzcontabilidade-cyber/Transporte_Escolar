import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { BarChart3, Search, FileText, School, GraduationCap, Bus, Briefcase, Star } from 'lucide-react';

const REPORTS = [
  // Gestão Escolar
  { code: 'R101', title: 'Ficha de Matrícula', desc: 'Formulário oficial de matrícula para impressão', module: 'Gestão Escolar', color: '#6366f1', to: '/matriculas', icon: FileText },
  { code: 'R102', title: 'Requerimento de Matrícula', desc: 'Renovação ou nova matrícula', module: 'Gestão Escolar', color: '#6366f1', to: '/matriculas', icon: FileText },
  { code: 'R103', title: 'Ficha Completa do Aluno', desc: 'Todos os dados do aluno para impressão', module: 'Gestão Escolar', color: '#6366f1', to: '/ficha-aluno', icon: FileText },
  { code: 'R104', title: 'Declaração de Matrícula', desc: 'Comprova matrícula ativa', module: 'Gestão Escolar', color: '#6366f1', to: '/declaracoes', icon: FileText },
  { code: 'R105', title: 'Declaração de Transferência', desc: 'Para transferência entre escolas', module: 'Gestão Escolar', color: '#6366f1', to: '/declaracoes', icon: FileText },
  { code: 'R106', title: 'Declaração de Frequência', desc: 'Comprova frequência escolar', module: 'Gestão Escolar', color: '#6366f1', to: '/declaracoes', icon: FileText },
  { code: 'R107', title: 'Histórico Escolar', desc: 'Trajetória acadêmica completa', module: 'Gestão Escolar', color: '#6366f1', to: '/historico-escolar', icon: FileText },
  { code: 'R108', title: 'Relatório de Alunos por Turma', desc: 'Lista de alunos filtrada por turma', module: 'Gestão Escolar', color: '#6366f1', to: '/alunos', icon: FileText },
  { code: 'R109', title: 'Relatório por Escola', desc: 'Visão completa de uma escola', module: 'Gestão Escolar', color: '#6366f1', to: '/relatorio-escola', icon: School },
  { code: 'R110', title: 'Carteirinha Estudantil', desc: 'Carteira do aluno com QR Code', module: 'Gestão Escolar', color: '#6366f1', to: '/carteirinha', icon: FileText },
  { code: 'R111', title: 'QR Codes dos Alunos', desc: 'QR Codes para frequência/embarque', module: 'Gestão Escolar', color: '#6366f1', to: '/alunos', icon: FileText },
  { code: 'R112', title: 'Registro de Ocorrências', desc: 'Ocorrências disciplinares', module: 'Gestão Escolar', color: '#6366f1', to: '/ocorrencias', icon: FileText },
  // Ensino e Aprendizagem
  { code: 'R201', title: 'Lista de Notas Bimestral', desc: 'Notas por turma/disciplina/bimestre', module: 'Ensino e Aprendizagem', color: '#8b5cf6', to: '/lancamento-notas', icon: GraduationCap },
  { code: 'R202', title: 'Mapa de Resultados Final', desc: 'Aprovados, retidos, transferidos', module: 'Ensino e Aprendizagem', color: '#8b5cf6', to: '/ata-resultados', icon: GraduationCap },
  { code: 'R203', title: 'Boletim Escolar', desc: 'Notas por bimestre e média final', module: 'Ensino e Aprendizagem', color: '#8b5cf6', to: '/boletim', icon: GraduationCap },
  { code: 'R204', title: 'Parecer Descritivo', desc: 'Avaliação qualitativa por aluno', module: 'Ensino e Aprendizagem', color: '#8b5cf6', to: '/parecer-descritivo', icon: GraduationCap },
  { code: 'R205', title: 'Relatório de Frequência', desc: 'Presença por aluno e período', module: 'Ensino e Aprendizagem', color: '#8b5cf6', to: '/relatorio-frequencia', icon: GraduationCap },
  { code: 'R206', title: 'ATA do Conselho de Classe', desc: 'Decisões por aluno e bimestre', module: 'Ensino e Aprendizagem', color: '#8b5cf6', to: '/conselho-classe', icon: GraduationCap },
  { code: 'R207', title: 'Grade Horária', desc: 'Horário de aulas por turma', module: 'Ensino e Aprendizagem', color: '#8b5cf6', to: '/grade-horaria', icon: GraduationCap },
  // Frota e Rotas
  { code: 'R301', title: 'Relatório de Viagens', desc: 'Histórico de viagens concluídas', module: 'Frota e Rotas', color: '#f97316', to: '/relatorio-transporte', icon: Bus },
  { code: 'R302', title: 'Relatório da Frota', desc: 'Veículos, status e documentos', module: 'Frota e Rotas', color: '#f97316', to: '/relatorios', icon: Bus },
  { code: 'R303', title: 'Vistoria de Veículos', desc: 'Checklist de inspeção veicular', module: 'Frota e Rotas', color: '#f97316', to: '/vistoria-veiculos', icon: Bus },
  { code: 'R304', title: 'Ficha do Motorista', desc: 'Dados completos do motorista', module: 'Frota e Rotas', color: '#f97316', to: '/motoristas', icon: Bus },
  // Gestão e Recursos
  { code: 'R401', title: 'Relatório Financeiro', desc: 'Receitas, despesas e saldo', module: 'Gestão e Recursos', color: '#0ea5e9', to: '/financeiro', icon: Briefcase },
  { code: 'R402', title: 'Relatório de Contratos', desc: 'Contratos vigentes e vencidos', module: 'Gestão e Recursos', color: '#0ea5e9', to: '/contratos', icon: Briefcase },
  { code: 'R403', title: 'Estoque da Merenda', desc: 'Itens, entradas e saídas', module: 'Gestão e Recursos', color: '#0ea5e9', to: '/estoque-merenda', icon: Briefcase },
  { code: 'R404', title: 'Cotação de Compras', desc: 'Comparativo de fornecedores', module: 'Gestão e Recursos', color: '#0ea5e9', to: '/cotacao-compras', icon: Briefcase },
  { code: 'R405', title: 'Protocolo', desc: 'Requerimentos e solicitações', module: 'Gestão e Recursos', color: '#0ea5e9', to: '/protocolo', icon: Briefcase },
];

export default function ReportCenterPage() {
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('netescol_report_favorites') || '[]'); } catch { return []; }
  });

  const toggleFav = (code: string) => {
    const next = favorites.includes(code) ? favorites.filter(f => f !== code) : [...favorites, code];
    setFavorites(next);
    localStorage.setItem('netescol_report_favorites', JSON.stringify(next));
  };

  const filtered = REPORTS.filter(r => {
    if (filterModule && r.module !== filterModule) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.module.toLowerCase().includes(q);
    }
    return true;
  });

  const modules = [...new Set(REPORTS.map(r => r.module))];
  const favReports = REPORTS.filter(r => favorites.includes(r.code));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center"><BarChart3 size={20} className="text-accent-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Central de Relatórios</h1><p className="text-gray-500">{REPORTS.length} relatório(s) disponível(is)</p></div></div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por código, nome ou módulo..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="input w-56" value={filterModule} onChange={e => setFilterModule(e.target.value)}><option value="">Todos os módulos</option>{modules.map(m => <option key={m} value={m}>{m}</option>)}</select>
      </div>

      {/* Favorites */}
      {favReports.length > 0 && !search && !filterModule && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-yellow-600 uppercase tracking-wide mb-3 flex items-center gap-1"><Star size={14} fill="currentColor" /> Favoritos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {favReports.map(r => (
              <Link key={r.code} to={r.to} className="flex items-center gap-3 p-4 rounded-xl border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-all group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: r.color }}>{r.code}</div>
                <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-sm truncate">{r.title}</p><p className="text-xs text-gray-500 truncate">{r.desc}</p></div>
                <button onClick={e => { e.preventDefault(); toggleFav(r.code); }} className="text-yellow-400"><Star size={16} fill="currentColor" /></button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reports by module */}
      {(filterModule ? [filterModule] : modules).map(mod => {
        const modReports = filtered.filter(r => r.module === mod);
        if (modReports.length === 0) return null;
        const modColor = modReports[0]?.color || '#64748b';
        return (
          <div key={mod} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-6 rounded-full" style={{ backgroundColor: modColor }} />
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: modColor }}>{mod}</h2>
              <span className="text-xs text-gray-400">({modReports.length})</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {modReports.map(r => (
                <div key={r.code} className="relative group">
                  <Link to={r.to} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 transition-all">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: r.color }}>{r.code}</div>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{r.title}</p><p className="text-xs text-gray-500 truncate">{r.desc}</p></div>
                  </Link>
                  <button onClick={() => toggleFav(r.code)} className={`absolute top-3 right-3 p-1 rounded transition-colors ${favorites.includes(r.code) ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}>
                    <Star size={14} fill={favorites.includes(r.code) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="card text-center py-16"><Search size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum relatório encontrado para "{search}"</p></div>
      )}
    </div>
  );
}
