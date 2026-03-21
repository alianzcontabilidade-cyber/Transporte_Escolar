import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { BarChart3, Search, FileText, School, GraduationCap, Bus, Briefcase, Star, Download, ExternalLink, Printer } from 'lucide-react';
import ExportModal, { handleExport, ExportFormat, exportToCSV, exportToPDF, printHTML } from '../components/ExportModal';

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
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [exportReport, setExportReport] = useState<any>(null);
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
              <div key={r.code} className="rounded-xl border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-all group">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: r.color }}>{r.code}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-sm truncate">{r.title}</p><p className="text-xs text-gray-500 truncate">{r.desc}</p></div>
                  <button onClick={() => toggleFav(r.code)} className="text-yellow-400"><Star size={16} fill="currentColor" /></button>
                </div>
                <div className="flex border-t border-yellow-200">
                  <Link to={r.to} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-accent-600 hover:bg-yellow-100 rounded-bl-xl"><ExternalLink size={12} /> Abrir</Link>
                  <div className="w-px bg-yellow-200" />
                  <button onClick={() => setExportReport(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-600 hover:bg-yellow-100 rounded-br-xl"><Download size={12} /> Exportar</button>
                </div>
              </div>
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
                <div key={r.code} className="relative group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 transition-all">
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: r.color }}>{r.code}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{r.title}</p>
                      <p className="text-xs text-gray-500 truncate">{r.desc}</p>
                    </div>
                    <button onClick={() => toggleFav(r.code)} className={`p-1 rounded transition-colors flex-shrink-0 ${favorites.includes(r.code) ? 'text-yellow-400' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-yellow-400'}`}>
                      <Star size={14} fill={favorites.includes(r.code) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="flex border-t border-gray-100 dark:border-gray-700">
                    <Link to={r.to} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors rounded-bl-xl">
                      <ExternalLink size={13} /> Abrir
                    </Link>
                    <div className="w-px bg-gray-100 dark:bg-gray-700" />
                    <button onClick={() => setExportReport(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                      <Download size={13} /> Exportar
                    </button>
                    <div className="w-px bg-gray-100 dark:bg-gray-700" />
                    <button onClick={() => navigate(r.to)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-br-xl">
                      <Printer size={13} /> Imprimir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="card text-center py-16"><Search size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum relatório encontrado para "{search}"</p></div>
      )}

      {/* Modal de Exportacao */}
      <ExportModal
        open={!!exportReport}
        onClose={() => setExportReport(null)}
        onExport={(format: ExportFormat) => {
          if (!exportReport) return;
          // Para o export da Central, redireciona para a pagina do relatorio
          // pois os dados sao gerados na pagina especifica
          if (format === 'print') {
            navigate(exportReport.to);
          } else {
            // Gerar HTML basico com titulo do relatorio
            const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + exportReport.title + '</title><style>body{font-family:Arial,sans-serif;padding:40px;text-align:center;color:#333}h1{color:#1B3A5C;margin-bottom:10px}p{color:#666;font-size:14px}.info{margin-top:30px;padding:20px;background:#f0f4f8;border-radius:12px;display:inline-block}@media print{@page{margin:10mm;size:A4}}</style></head><body><h1>' + exportReport.title + '</h1><p>' + exportReport.desc + '</p><p style="margin-top:10px;font-size:12px;color:#999">Codigo: ' + exportReport.code + ' | Modulo: ' + exportReport.module + '</p><div class="info"><p>Para gerar este relatorio com dados completos,<br>acesse a pagina do relatorio e utilize o botao Exportar.</p><p style="margin-top:10px"><a href="' + window.location.origin + exportReport.to + '" style="color:#2DB5B0;font-weight:bold">Acessar ' + exportReport.title + '</a></p></div><p style="margin-top:40px;font-size:11px;color:#ccc">NetEscol - ' + new Date().toLocaleDateString('pt-BR') + '</p></body></html>';
            handleExport(format, [], html, exportReport.code + '_' + exportReport.title.replace(/\s+/g, '_'));
          }
          setExportReport(null);
        }}
        title={exportReport ? 'Exportar: ' + exportReport.title : undefined}
      />
    </div>
  );
}
