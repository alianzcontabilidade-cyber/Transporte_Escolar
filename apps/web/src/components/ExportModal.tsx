import { useState } from 'react';
import { X, Printer, Download, FileText, FileSpreadsheet, Globe, Check } from 'lucide-react';

export type ExportFormat = 'print' | 'pdf' | 'pdf-download' | 'excel' | 'csv' | 'html' | 'html-download';

interface ExportOption {
  value: ExportFormat;
  label: string;
  icon: any;
  desc: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  { value: 'print', label: 'Impressao Direta', icon: Printer, desc: 'Envia direto para a impressora' },
  { value: 'pdf', label: 'PDF (.pdf)', icon: FileText, desc: 'Abre o PDF no navegador' },
  { value: 'pdf-download', label: 'PDF (.pdf) - Download', icon: Download, desc: 'Baixa o arquivo PDF' },
  { value: 'csv', label: 'CSV (.csv)', icon: FileSpreadsheet, desc: 'Planilha compativel com Excel' },
  { value: 'html', label: 'HTML (.html)', icon: Globe, desc: 'Abre em nova aba no navegador' },
  { value: 'html-download', label: 'HTML (.html) - Download', icon: Download, desc: 'Baixa o arquivo HTML' },
];

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  title?: string;
}

export default function ExportModal({ open, onClose, onExport, title }: ExportModalProps) {
  const [selected, setSelected] = useState<ExportFormat>('pdf');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download size={18} className="text-accent-500" />
            {title || 'Exportar Documento'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 mb-4">Para qual formato deseja exportar o documento?</p>

          <div className="space-y-2">
            {EXPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelected(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-accent-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isSelected ? 'text-accent-700 dark:text-accent-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button
            onClick={() => { onExport(selected); onClose(); }}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Check size={16} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FUNCOES UTILITARIAS DE EXPORTACAO
// ============================================

export function exportToCSV(data: any[], filename: string) {
  if (!data?.length) { alert('Sem dados para exportar'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(';'), ...data.map(row => keys.map(k => '"' + (row[k] ?? '') + '"').join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  a.click();
}

export function exportToHTML(html: string, filename: string, download: boolean = false) {
  if (download) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith('.html') ? filename : filename + '.html';
    a.click();
  } else {
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }
}

export function printHTML(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  }
}

export function exportToPDF(html: string, filename: string, download: boolean = false) {
  // Abrir HTML em nova aba com iframe oculto para gerar PDF via print
  const pdfHTML = html.replace('</head>', '<style>@media print{@page{margin:10mm;size:A4}body{margin:0;padding:15px}.no-print{display:none!important}}</style></head>');

  if (download) {
    // Abrir em nova aba e disparar dialogo de impressao (usuario salva como PDF)
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(pdfHTML);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  } else {
    // Abrir HTML formatado em nova aba para visualizacao e impressao
    const blob = new Blob([pdfHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}

// Handler unificado que processa o formato selecionado
export async function handleExport(
  format: ExportFormat,
  data: any[],
  html: string,
  filename: string
) {
  switch (format) {
    case 'print':
      printHTML(html);
      break;
    case 'pdf':
      await exportToPDF(html, filename, false);
      break;
    case 'pdf-download':
      await exportToPDF(html, filename, true);
      break;
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'html':
      exportToHTML(html, filename, false);
      break;
    case 'html-download':
      exportToHTML(html, filename, true);
      break;
  }
}
