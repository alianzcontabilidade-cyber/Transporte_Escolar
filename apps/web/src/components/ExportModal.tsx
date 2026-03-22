import { useState } from 'react';
import { X, Printer, Download, FileText, FileSpreadsheet, Globe, Check, FileDown } from 'lucide-react';

export type ExportFormat = 'print' | 'pdf' | 'pdf-download' | 'docx' | 'csv' | 'html' | 'html-download';

interface ExportOption {
  value: ExportFormat;
  label: string;
  icon: any;
  desc: string;
  group: 'visualizar' | 'download';
}

const EXPORT_OPTIONS: ExportOption[] = [
  { value: 'print', label: 'Impressão Direta', icon: Printer, desc: 'Envia direto para a impressora', group: 'visualizar' },
  { value: 'pdf', label: 'Abrir em PDF', icon: FileText, desc: 'Abre o documento para visualização', group: 'visualizar' },
  { value: 'html', label: 'Abrir em HTML', icon: Globe, desc: 'Abre em nova aba no navegador', group: 'visualizar' },
  { value: 'pdf-download', label: 'Download PDF (.pdf)', icon: FileDown, desc: 'Salvar arquivo PDF no computador', group: 'download' },
  { value: 'docx', label: 'Download Word (.docx)', icon: FileDown, desc: 'Salvar como documento Word', group: 'download' },
  { value: 'csv', label: 'Download CSV (.csv)', icon: FileSpreadsheet, desc: 'Planilha compatível com Excel', group: 'download' },
  { value: 'html-download', label: 'Download HTML (.html)', icon: Download, desc: 'Salvar página HTML', group: 'download' },
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

  const vizOpts = EXPORT_OPTIONS.filter(o => o.group === 'visualizar');
  const dlOpts = EXPORT_OPTIONS.filter(o => o.group === 'download');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download size={18} className="text-accent-500" />
            {title || 'Exportar Relatorio'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Visualizar</p>
          <div className="space-y-1.5 mb-4">
            {vizOpts.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selected === opt.value;
              return (
                <button key={opt.value} onClick={() => setSelected(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50'
                  }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isSelected ? 'text-accent-700' : 'text-gray-800'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  {isSelected && <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0"><Check size={12} className="text-white" /></div>}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Baixar Arquivo</p>
          <div className="space-y-1.5">
            {dlOpts.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selected === opt.value;
              return (
                <button key={opt.value} onClick={() => setSelected(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50'
                  }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isSelected ? 'text-accent-700' : 'text-gray-800'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  {isSelected && <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0"><Check size={12} className="text-white" /></div>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={() => { onExport(selected); onClose(); }}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
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

export async function exportToPDF(html: string, filename: string, download: boolean = false) {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const safeName = (filename || 'documento').replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g, '_');

  // Tentar gerar PDF via servidor (Puppeteer)
  if (token) {
    try {
      const res = await fetch(`${API_URL}/api/pdf/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ html, orientation: 'portrait', filename: safeName }),
      });

      if (res.ok) {
        const blob = await res.blob();
        if (download) {
          // Download direto
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = safeName + '.pdf';
          a.click();
          URL.revokeObjectURL(a.href);
        } else {
          // Abrir em nova aba para visualização
          window.open(URL.createObjectURL(blob), '_blank');
        }
        return;
      }
      // Se o servidor retornou erro, cair no fallback
      console.warn('PDF server indisponível, usando fallback');
    } catch {
      console.warn('PDF server não acessível, usando fallback');
    }
  }

  // Fallback: abrir HTML com toolbar para imprimir
  import('../lib/reportTemplate').then(({ openReportAsPDF }) => {
    openReportAsPDF(html, filename);
  });
}

export function exportToWord(html: string, filename: string) {
  const wordHTML = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:15mm 20mm}body{font-family:Arial,sans-serif;font-size:12pt}table{border-collapse:collapse;width:100%}th{background-color:#1B3A5C;color:white;padding:8px;text-align:left;font-size:10pt}td{border:1px solid #ddd;padding:6px;font-size:10pt}tr:nth-child(even){background-color:#f8f9fa}h1{color:#1B3A5C;font-size:16pt;border-bottom:2px solid #2DB5B0;padding-bottom:5px}</style></head><body>' + html.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '').replace(/<head>[\s\S]*?<\/head>/i, '').replace(/<\/?body[^>]*>/gi, '') + '</body></html>';
  const blob = new Blob(['\uFEFF' + wordHTML], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.doc') ? filename : filename + '.doc';
  a.click();
}

// Handler unificado
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
      exportToPDF(html, filename, false);
      break;
    case 'pdf-download':
      exportToPDF(html, filename, true);
      break;
    case 'docx':
      exportToWord(html, filename);
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
