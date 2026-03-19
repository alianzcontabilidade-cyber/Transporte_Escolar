import { Link, useLocation } from 'react-router-dom';
import { Home, Star } from 'lucide-react';

// Page code registry
const PAGE_CODES: Record<string, { code: string; title: string; module: string; color: string }> = {
  '/dashboard': { code: '001', title: 'Dashboard', module: 'Painel', color: '#2DB5B0' },
  '/escolas': { code: '101', title: 'Escolas', module: 'Secretaria', color: '#6366f1' },
  '/alunos': { code: '102', title: 'Alunos', module: 'Secretaria', color: '#6366f1' },
  '/matriculas': { code: '103', title: 'Matrículas', module: 'Secretaria', color: '#6366f1' },
  '/turmas': { code: '104', title: 'Turmas', module: 'Secretaria', color: '#6366f1' },
  '/series': { code: '105', title: 'Séries', module: 'Secretaria', color: '#6366f1' },
  '/anos-letivos': { code: '106', title: 'Anos Letivos', module: 'Secretaria', color: '#6366f1' },
  '/professores': { code: '107', title: 'Professores', module: 'Secretaria', color: '#6366f1' },
  '/lista-espera': { code: '108', title: 'Lista de Espera', module: 'Secretaria', color: '#6366f1' },
  '/remanejamento': { code: '109', title: 'Remanejamento', module: 'Secretaria', color: '#6366f1' },
  '/carteirinha': { code: '110', title: 'Carteirinha', module: 'Secretaria', color: '#6366f1' },
  '/promocao': { code: '111', title: 'Promoção', module: 'Secretaria', color: '#6366f1' },
  '/historico-escolar': { code: '112', title: 'Histórico Escolar', module: 'Secretaria', color: '#6366f1' },
  '/disciplinas': { code: '201', title: 'Disciplinas', module: 'Pedagógico', color: '#8b5cf6' },
  '/diario-escolar': { code: '202', title: 'Diário Escolar', module: 'Pedagógico', color: '#8b5cf6' },
  '/lancamento-notas': { code: '203', title: 'Lançar Notas', module: 'Pedagógico', color: '#8b5cf6' },
  '/boletim': { code: '204', title: 'Boletim Escolar', module: 'Pedagógico', color: '#8b5cf6' },
  '/parecer-descritivo': { code: '205', title: 'Parecer Descritivo', module: 'Pedagógico', color: '#8b5cf6' },
  '/ata-resultados': { code: '206', title: 'ATA de Resultados', module: 'Pedagógico', color: '#8b5cf6' },
  '/relatorio-frequencia': { code: '207', title: 'Relatório Frequência', module: 'Pedagógico', color: '#8b5cf6' },
  '/calendario': { code: '208', title: 'Calendário Escolar', module: 'Pedagógico', color: '#8b5cf6' },
  '/educacenso': { code: '209', title: 'EDUCACENSO', module: 'Pedagógico', color: '#8b5cf6' },
  '/rotas': { code: '301', title: 'Rotas', module: 'Transporte', color: '#f97316' },
  '/veiculos': { code: '302', title: 'Veículos', module: 'Transporte', color: '#f97316' },
  '/motoristas': { code: '303', title: 'Motoristas', module: 'Transporte', color: '#f97316' },
  '/monitores': { code: '304', title: 'Monitores', module: 'Transporte', color: '#f97316' },
  '/monitor': { code: '305', title: 'Monitoramento', module: 'Transporte', color: '#f97316' },
  '/mapa-tempo-real': { code: '306', title: 'Mapa Tempo Real', module: 'Transporte', color: '#f97316' },
  '/rastreamento': { code: '307', title: 'Rastreamento GPS', module: 'Transporte', color: '#f97316' },
  '/frequencia': { code: '308', title: 'Frequência Transporte', module: 'Transporte', color: '#f97316' },
  '/portal-responsavel': { code: '309', title: 'Portal Responsável', module: 'Transporte', color: '#f97316' },
  '/relatorio-transporte': { code: '310', title: 'Relatório Transporte', module: 'Transporte', color: '#f97316' },
  '/recursos-humanos': { code: '401', title: 'Recursos Humanos', module: 'Administrativo', color: '#0ea5e9' },
  '/financeiro': { code: '402', title: 'Financeiro', module: 'Administrativo', color: '#0ea5e9' },
  '/contratos': { code: '403', title: 'Contratos', module: 'Administrativo', color: '#0ea5e9' },
  '/merenda': { code: '404', title: 'Merenda Escolar', module: 'Administrativo', color: '#0ea5e9' },
  '/biblioteca': { code: '405', title: 'Biblioteca', module: 'Administrativo', color: '#0ea5e9' },
  '/patrimonio': { code: '406', title: 'Patrimônio e Estoque', module: 'Administrativo', color: '#0ea5e9' },
  '/manutencao-preditiva': { code: '407', title: 'Manutenção', module: 'Administrativo', color: '#0ea5e9' },
  '/relatorios': { code: '408', title: 'Relatórios', module: 'Administrativo', color: '#0ea5e9' },
  '/comunicacao': { code: '409', title: 'Comunicação', module: 'Administrativo', color: '#0ea5e9' },
  '/configuracoes': { code: '501', title: 'Configurações', module: 'Config', color: '#64748b' },
  '/ia-rotas': { code: '502', title: 'IA Rotas', module: 'Config', color: '#64748b' },
  '/super-admin': { code: '503', title: 'Super Admin', module: 'Config', color: '#64748b' },
  '/transparencia': { code: '504', title: 'Transparência', module: 'Config', color: '#64748b' },
  '/modulos': { code: '000', title: 'Módulos', module: 'Painel', color: '#2DB5B0' },
};

export default function PageHeader() {
  const location = useLocation();
  const path = location.pathname;
  const page = PAGE_CODES[path];

  // Don't show on home/modules page
  if (!page || path === '/' || path === '/modulos') return null;

  return (
    <div className="flex items-center gap-0" style={{ backgroundColor: page.color }}>
      <Link to="/" className="flex items-center justify-center w-11 h-11 hover:bg-white/20 transition-colors" title="Voltar ao início">
        <Home size={18} className="text-white" />
      </Link>
      <div className="flex items-center gap-3 px-4 py-2.5 flex-1">
        <span className="bg-white/20 text-white font-bold text-sm px-2.5 py-0.5 rounded">{page.code}</span>
        <span className="text-white font-semibold text-[0.9375rem]">{page.title}</span>
        <span className="text-white/50 text-xs hidden sm:inline">• {page.module}</span>
      </div>
      <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs transition-colors">
        <Star size={12} /> Início
      </Link>
    </div>
  );
}
