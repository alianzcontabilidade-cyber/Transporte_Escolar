import { useState } from 'react';
import { Download } from 'lucide-react';
import ExportModal, { handleExport, ExportFormat } from './ExportModal';

interface ReportActionsProps {
  /** Funcao que retorna o HTML do relatorio */
  buildHTML: () => string;
  /** Dados tabulares para exportacao CSV (opcional) */
  csvData?: any[];
  /** Nome do arquivo para download */
  filename: string;
  /** Titulo exibido no modal */
  title?: string;
  /** Texto do botao (padrao: "Exportar") */
  buttonText?: string;
  /** Classe CSS extra para o botao */
  className?: string;
  /** Desabilitar o botao */
  disabled?: boolean;
}

/**
 * Componente reutilizavel que adiciona o botao "Exportar" padronizado
 * com modal de selecao de formato (Imprimir, PDF, Word, CSV, HTML)
 *
 * Uso:
 * <ReportActions buildHTML={() => gerarHTML()} csvData={rows} filename="relatorio" title="Meu Relatorio" />
 */
export default function ReportActions({ buildHTML, csvData, filename, title, buttonText, className, disabled }: ReportActionsProps) {
  const [showModal, setShowModal] = useState(false);

  const doExport = (format: ExportFormat) => {
    const html = buildHTML();
    if (!html && format !== 'csv') {
      alert('Nenhum dado disponivel para exportar. Verifique os filtros ou selecione um registro.');
      return;
    }
    handleExport(format, csvData || [], html, filename);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className={className || 'btn-secondary flex items-center gap-2'}
      >
        <Download size={16} /> {buttonText || 'Exportar'}
      </button>

      <ExportModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onExport={doExport}
        title={title ? 'Exportar: ' + title : undefined}
      />
    </>
  );
}
