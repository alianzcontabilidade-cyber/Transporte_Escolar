import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Star, Printer, Download, FileText, FileSpreadsheet, Search, Clock, X, ArrowLeft } from 'lucide-react';

const PAGE_CODES: Record<string, { code: string; title: string; module: string; color: string }> = {
  '/dashboard': { code: '001', title: 'Dashboard', module: 'Painel Central', color: '#2DB5B0' },
  '/escolas': { code: '101', title: 'Escolas', module: 'Gestão Escolar', color: '#6366f1' },
  '/alunos': { code: '102', title: 'Alunos', module: 'Gestão Escolar', color: '#6366f1' },
  '/matriculas': { code: '103', title: 'Matrículas', module: 'Gestão Escolar', color: '#6366f1' },
  '/turmas': { code: '104', title: 'Turmas', module: 'Gestão Escolar', color: '#6366f1' },
  '/series': { code: '105', title: 'Séries', module: 'Gestão Escolar', color: '#6366f1' },
  '/anos-letivos': { code: '106', title: 'Anos Letivos', module: 'Gestão Escolar', color: '#6366f1' },
  '/professores': { code: '107', title: 'Professores', module: 'Gestão Escolar', color: '#6366f1' },
  '/lista-espera': { code: '108', title: 'Lista de Espera', module: 'Gestão Escolar', color: '#6366f1' },
  '/remanejamento': { code: '109', title: 'Remanejamento', module: 'Gestão Escolar', color: '#6366f1' },
  '/carteirinha': { code: '110', title: 'Carteirinha', module: 'Gestão Escolar', color: '#6366f1' },
  '/promocao': { code: '111', title: 'Promoção', module: 'Gestão Escolar', color: '#6366f1' },
  '/historico-escolar': { code: '112', title: 'Histórico Escolar', module: 'Gestão Escolar', color: '#6366f1' },
  '/disciplinas': { code: '201', title: 'Disciplinas', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/diario-escolar': { code: '202', title: 'Diário Escolar', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/lancamento-notas': { code: '203', title: 'Lançar Notas', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/boletim': { code: '204', title: 'Boletim Escolar', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/parecer-descritivo': { code: '205', title: 'Parecer Descritivo', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/ata-resultados': { code: '206', title: 'ATA de Resultados', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/relatorio-frequencia': { code: '207', title: 'Relatório Frequência', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/calendario': { code: '208', title: 'Calendário Escolar', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/educacenso': { code: '209', title: 'EDUCACENSO', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/rotas': { code: '301', title: 'Rotas', module: 'Frota e Rotas', color: '#f97316' },
  '/veiculos': { code: '302', title: 'Veículos', module: 'Frota e Rotas', color: '#f97316' },
  '/motoristas': { code: '303', title: 'Motoristas', module: 'Frota e Rotas', color: '#f97316' },
  '/monitores': { code: '304', title: 'Monitores', module: 'Frota e Rotas', color: '#f97316' },
  '/monitor': { code: '305', title: 'Monitoramento', module: 'Frota e Rotas', color: '#f97316' },
  '/mapa-tempo-real': { code: '306', title: 'Mapa Tempo Real', module: 'Frota e Rotas', color: '#f97316' },
  '/rastreamento': { code: '307', title: 'Rastreamento GPS', module: 'Frota e Rotas', color: '#f97316' },
  '/frequencia': { code: '308', title: 'Frequência Transporte', module: 'Frota e Rotas', color: '#f97316' },
  '/portal-responsavel': { code: '309', title: 'Portal Responsável', module: 'Frota e Rotas', color: '#f97316' },
  '/relatorio-transporte': { code: '310', title: 'Relatório Transporte', module: 'Frota e Rotas', color: '#f97316' },
  '/recursos-humanos': { code: '401', title: 'Recursos Humanos', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/financeiro': { code: '402', title: 'Financeiro', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/contratos': { code: '403', title: 'Contratos', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/merenda': { code: '404', title: 'Merenda Escolar', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/biblioteca': { code: '405', title: 'Biblioteca', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/patrimonio': { code: '406', title: 'Patrimônio e Estoque', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/manutencao-preditiva': { code: '407', title: 'Manutenção', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/relatorios': { code: '408', title: 'Relatórios', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/comunicacao': { code: '409', title: 'Comunicação', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/envio-massa': { code: '410', title: 'Envio em Massa', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/cotacao-compras': { code: '411', title: 'Cotação de Compras', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/configuracoes': { code: '501', title: 'Usuários e Segurança', module: 'Central de Controle', color: '#64748b' },
  '/ia-rotas': { code: '502', title: 'IA Rotas', module: 'Central de Controle', color: '#64748b' },
  '/super-admin': { code: '503', title: 'Super Admin', module: 'Central de Controle', color: '#64748b' },
  '/declaracoes': { code: '113', title: 'Declarações', module: 'Gestão Escolar', color: '#6366f1' },
  '/atividade-usuarios': { code: '504', title: 'Atividade Usuários', module: 'Central de Controle', color: '#64748b' },
  '/grade-horaria': { code: '210', title: 'Grade Horária', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/sobre': { code: '505', title: 'Sobre o Sistema', module: 'Central de Controle', color: '#64748b' },
  '/ficha-aluno': { code: '114', title: 'Ficha do Aluno', module: 'Gest\u00e3o Escolar', color: '#6366f1' },
  '/relatorio-escola': { code: '115', title: 'Relatório por Escola', module: 'Gestão Escolar', color: '#6366f1' },
  '/backup': { code: '506', title: 'Backup de Dados', module: 'Central de Controle', color: '#64748b' },
  '/conselho-classe': { code: '211', title: 'Conselho de Classe', module: 'Ensino e Aprendizagem', color: '#8b5cf6' },
  '/ocorrencias': { code: '116', title: 'Ocorrências', module: 'Gestão Escolar', color: '#6366f1' },
  '/estoque-merenda': { code: '412', title: 'Estoque Merenda', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/vistoria-veiculos': { code: '311', title: 'Vistoria Veículos', module: 'Frota e Rotas', color: '#f97316' },
  '/protocolo': { code: '413', title: 'Protocolo', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/eventos': { code: '414', title: 'Gestão de Eventos', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/mural': { code: '415', title: 'Mural Informativo', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/central-relatorios': { code: '416', title: 'Central de Relatórios', module: 'Gestão e Recursos', color: '#0ea5e9' },
  '/ficha-matricula': { code: '117', title: 'Ficha de Matrícula', module: 'Gestão Escolar', color: '#6366f1' },
  '/cadastro-prefeitura': { code: '507', title: 'Cadastro da Prefeitura', module: 'Central de Controle', color: '#64748b' },
  '/relacao-alunos-turma': { code: '118', title: 'Relação de Alunos por Turma', module: 'Gestão Escolar', color: '#6366f1' },
};

// Favorites management
function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem('netescol_favorites') || '[]'); } catch { return []; }
}
function saveFavorites(favs: string[]) {
  localStorage.setItem('netescol_favorites', JSON.stringify(favs));
}
function toggleFavorite(path: string): string[] {
  const favs = getFavorites();
  const idx = favs.indexOf(path);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(path);
  saveFavorites(favs);
  return favs;
}

// History management
function getHistory(): { path: string; time: string }[] {
  try { return JSON.parse(localStorage.getItem('netescol_history') || '[]'); } catch { return []; }
}
function addToHistory(path: string) {
  const hist = getHistory().filter(h => h.path !== path);
  hist.unshift({ path, time: new Date().toISOString() });
  localStorage.setItem('netescol_history', JSON.stringify(hist.slice(0, 20)));
}

// Export function
function exportPage(format: string, title: string) {
  const content = document.querySelector('main')?.innerHTML || '';
  const pageTitle = title + ' - NetEscol';

  if (format === 'print') {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${pageTitle}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{color:#1B3A5C;border-bottom:2px solid #2DB5B0;padding-bottom:8px}
      table{width:100%;border-collapse:collapse}th{background:#1B3A5C;color:white;padding:8px;text-align:left}td{padding:6px 8px;border:1px solid #ddd}
      .footer{margin-top:20px;text-align:center;font-size:10px;color:#999}
      button,input[type=file],select,.btn-primary,.btn-secondary{display:none!important}
      @media print{body{padding:0}}</style></head><body>
      <h1>${pageTitle}</h1>${content}
      <div class="footer">Gerado por NetEscol em ${new Date().toLocaleString('pt-BR')}</div></body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
    return;
  }

  if (format === 'pdf') {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${pageTitle}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px;font-size:20px}
      table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1B3A5C;color:white;padding:8px;text-align:left}
      td{padding:6px 8px;border:1px solid #ddd}tr:nth-child(even){background:#f8f9fa}
      .card,.rounded-xl,.rounded-2xl{border:1px solid #eee;padding:10px;margin:5px 0;border-radius:8px}
      button,input[type=file],select,.btn-primary,.btn-secondary,.fixed{display:none!important}
      .footer{margin-top:30px;text-align:center;font-size:10px;color:#999}
      @media print{body{padding:15px}}</style></head><body>
      <h1>${pageTitle}</h1>${content}
      <div class="footer">Gerado por NetEscol em ${new Date().toLocaleString('pt-BR')} | Salve como PDF na janela de impressao</div></body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
    return;
  }

  if (format === 'excel') {
    // Extract tables from the page
    const tables = document.querySelectorAll('main table');
    if (tables.length === 0) { alert('Nenhuma tabela encontrada nesta página para exportar'); return; }
    let csv = '';
    tables.forEach(table => {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = Array.from(cells).map(cell => '"' + (cell.textContent || '').replace(/"/g, '""').trim() + '"');
        csv += rowData.join(';') + '\n';
      });
      csv += '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/\s/g, '_') + '_netescol.csv';
    a.click();
    return;
  }

  if (format === 'html') {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${pageTitle}</title></head><body>
    <h1>${pageTitle}</h1>${content}
    <p style="margin-top:20px;font-size:10px;color:#999">Gerado por NetEscol em ${new Date().toLocaleString('pt-BR')}</p></body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/\s/g, '_') + '_netescol.html';
    a.click();
  }
}

export { PAGE_CODES, getFavorites, getHistory };

export default function PageHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const page = PAGE_CODES[path];
  const [isFavorite, setIsFavorite] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (page) {
      setIsFavorite(getFavorites().includes(path));
      addToHistory(path);
    }
  }, [path]);

  if (!page || path === '/' || path === '/modulos') return null;

  const handleFavorite = () => {
    const newFavs = toggleFavorite(path);
    setIsFavorite(newFavs.includes(path));
  };

  return (
    <>
      <div className="flex items-center" style={{ backgroundColor: page.color }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-11 hover:bg-white/20 transition-colors" title="Voltar à tela anterior">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <Link to="/" className="flex items-center justify-center w-10 h-11 hover:bg-white/20 transition-colors border-l border-white/20" title="Tela inicial">
          <Home size={16} className="text-white/80" />
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 flex-1 min-w-0">
          <span className="bg-white/20 text-white font-bold text-sm px-2.5 py-0.5 rounded flex-shrink-0">{page.code}</span>
          <span className="text-white font-semibold text-[0.9375rem] truncate">{page.title}</span>
          <span className="text-white/50 text-xs hidden md:inline flex-shrink-0">• {page.module}</span>
        </div>
        <div className="flex items-center gap-1 pr-2">
          <button onClick={handleFavorite} className={`p-2 rounded-lg transition-all ${isFavorite ? 'text-yellow-300 bg-white/10' : 'text-white/50 hover:text-yellow-300 hover:bg-white/10'}`} title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
            <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => setShowExport(!showExport)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Exportar / Imprimir">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Export dropdown */}
      {showExport && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 mr-2">Exportar como:</span>
          <button onClick={() => { exportPage('print', page.title); setShowExport(false); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"><Printer size={14} /> Impressão Direta</button>
          <button onClick={() => { exportPage('pdf', page.title); setShowExport(false); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"><FileText size={14} /> PDF (Salvar)</button>
          <button onClick={() => { exportPage('excel', page.title); setShowExport(false); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"><FileSpreadsheet size={14} /> Excel (CSV)</button>
          <button onClick={() => { exportPage('html', page.title); setShowExport(false); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors"><Download size={14} /> HTML</button>
          <button onClick={() => setShowExport(false)} className="ml-auto p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
        </div>
      )}
    </>
  );
}
