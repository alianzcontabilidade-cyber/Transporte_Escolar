import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Mapeia cada rota para seu módulo pai
const ROUTE_TO_MODULE: Record<string, { module: string; moduleLabel: string; label: string }> = {
  // Gestão Escolar
  '/escolas': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Escolas' },
  '/alunos': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Alunos' },
  '/matriculas': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Matrículas' },
  '/turmas': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Turmas' },
  '/series': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Séries' },
  '/professores': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Professores' },
  '/anos-letivos': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Anos Letivos' },
  '/ficha-matricula': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Ficha de Matrícula' },
  '/lista-espera': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Lista de Espera' },
  '/carteirinha': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Carteirinha' },
  '/remanejamento': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Remanejamento' },
  '/declaracoes': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Declarações' },
  '/ocorrencias': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Ocorrências' },
  '/historico-escolar': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Histórico Escolar' },
  '/ficha-aluno': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Ficha do Aluno' },
  '/relatorio-escola': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Relatório Escola' },
  '/relacao-alunos-turma': { module: 'secretaria', moduleLabel: 'Gestão Escolar', label: 'Alunos por Turma' },
  // Ensino e Aprendizagem
  '/diario-escolar': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Diário Escolar' },
  '/lancamento-notas': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Lançar Notas' },
  '/boletim': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Boletim' },
  '/parecer-descritivo': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Parecer' },
  '/disciplinas': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Disciplinas' },
  '/grade-horaria': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Grade Horária' },
  '/calendario': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Calendário' },
  '/conselho-classe': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Conselho de Classe' },
  '/ata-resultados': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'ATA Resultados' },
  '/ata-resultados-finais': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Resultados Finais' },
  '/relatorio-individual': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Relatório Individual' },
  '/quadro-rendimento': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Quadro Rendimento' },
  '/diario-classe': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Diário de Classe' },
  '/educacenso': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'EDUCACENSO' },
  '/quadro-curricular': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Quadro Curricular' },
  '/desempenho-disciplina': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Desempenho por Disciplina' },
  '/baixo-rendimento': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Baixo Rendimento' },
  '/promocao': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Promoção' },
  '/relatorio-frequencia': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Relatório Frequência' },
  // Frota e Rotas
  '/rotas': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Rotas' },
  '/veiculos': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Veículos' },
  '/motoristas': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Motoristas' },
  '/monitores': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Monitores' },
  '/monitor': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Monitoramento' },
  '/mapa-tempo-real': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Mapa GPS' },
  '/ia-rotas': { module: 'controle', moduleLabel: 'Controle', label: 'IA Rotas' },
  '/coleta-gps': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Coleta GPS' },
  '/fornecedores': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Fornecedores' },
  '/ordens-servico': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Ordens de Serviço' },
  '/garagens': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Garagens' },
  '/vistoria-veiculos': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Vistoria' },
  '/abastecimento': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Abastecimento' },
  '/quilometragem': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Quilometragem' },
  '/alunos-transportados': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Alunos Transportados' },
  '/relatorio-transporte': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Relatório Transporte' },
  '/relatorio-manutencoes': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Manutenções' },
  '/frequencia': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Frequência' },
  '/rastreamento': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Rastreamento' },
  '/portal-responsavel': { module: 'transporte', moduleLabel: 'Frota e Rotas', label: 'Portal Pais' },
  // Gestão e Recursos
  '/recursos-humanos': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'RH' },
  '/financeiro': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Financeiro' },
  '/contratos': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Contratos' },
  '/merenda': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Merenda' },
  '/estoque-merenda': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Estoque Merenda' },
  '/biblioteca': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Biblioteca' },
  '/patrimonio': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Patrimônio' },
  '/comunicacao': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Comunicação' },
  '/eventos': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Eventos' },
  '/protocolo': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Protocolo' },
  '/mural': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Mural' },
  '/cotacao-compras': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Cotações' },
  '/envio-massa': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Envio em Massa' },
  '/central-relatorios': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Central Relatórios' },
  '/relatorio-rh': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Relatório RH' },
  '/relatorio-patrimonio': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Relatório Patrimônio' },
  '/relatorio-educacenso': { module: 'administrativo', moduleLabel: 'Gestão e Recursos', label: 'Relatório EDUCACENSO' },
  // Central de Controle
  '/cadastro-prefeitura': { module: 'controle', moduleLabel: 'Controle', label: 'Prefeitura' },
  '/configuracoes': { module: 'controle', moduleLabel: 'Controle', label: 'Configurações' },
  '/gestao-documentos': { module: 'controle', moduleLabel: 'Controle', label: 'Gestão de Documentos' },
  '/atividade-usuarios': { module: 'controle', moduleLabel: 'Controle', label: 'Atividade Usuários' },
  '/backup': { module: 'controle', moduleLabel: 'Controle', label: 'Backup' },
  '/risco-evasao': { module: 'controle', moduleLabel: 'Controle', label: 'Risco de Evasão' },
  '/perfil': { module: 'controle', moduleLabel: 'Controle', label: 'Meu Perfil' },
  '/sobre': { module: 'controle', moduleLabel: 'Controle', label: 'Sobre o Sistema' },
  '/manutencao-preditiva': { module: 'controle', moduleLabel: 'Controle', label: 'Manutenção Preditiva' },
  '/relatorios': { module: 'controle', moduleLabel: 'Controle', label: 'Relatórios' },
  '/super-admin': { module: 'controle', moduleLabel: 'Controle', label: 'Super Admin' },
  '/config-formularios': { module: 'controle', moduleLabel: 'Controle', label: 'Config. Formulários' },
  '/promocao': { module: 'pedagogico', moduleLabel: 'Ensino', label: 'Promoção' },
  '/dashboard': { module: 'controle', moduleLabel: 'Controle', label: 'Painel Central' },
};

export default function ModuleBreadcrumb() {
  const location = useLocation();
  const info = ROUTE_TO_MODULE[location.pathname];
  if (!info) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-3 px-1">
      <Link to="/modulos" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Módulos</Link>
      <ChevronRight size={10} />
      <Link to={`/modulos?m=${info.module}`} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{info.moduleLabel}</Link>
      <ChevronRight size={10} />
      <span className="text-gray-600 dark:text-gray-300 font-medium">{info.label}</span>
    </div>
  );
}
