import { useState } from 'react';
import { FileText, FileSpreadsheet, Download, Loader2, Printer } from 'lucide-react';
import ReportSignatureSelector, { generateSignaturesHTML, Signatory } from './ReportSignatureSelector';

interface ReportExportBarProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  fullData?: any[];
  fullDataColumns?: { key: string; label: string }[];
  municipality?: string;
  school?: string;
  hideSignatures?: boolean;
}

function buildReportHTML(title: string, subtitle: string | undefined, content: string, opts?: { municipality?: string; school?: string; signaturesHTML?: string }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} - NetEscol</title>
  <style>
    *{box-sizing:border-box}
    @page{size:A4;margin:15mm}
    body{font-family:'Segoe UI',Arial,sans-serif;padding:25px 30px;color:#333;max-width:1000px;margin:0 auto;font-size:13px;line-height:1.5}
    .report-header{text-align:center;margin-bottom:25px;padding-bottom:15px;border-bottom:3px solid #2DB5B0}
    .report-header .logo{font-size:22px;font-weight:bold;color:#1B3A5C;letter-spacing:1px}
    .report-header .logo span{color:#2DB5B0}
    .report-header h1{color:#1B3A5C;font-size:18px;margin:8px 0 0;text-transform:uppercase;letter-spacing:0.5px}
    .report-header .subtitle{color:#666;font-size:12px;margin:4px 0 0}
    .report-header .meta{color:#999;font-size:10px;margin:8px 0 0}
    table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;page-break-inside:auto}
    thead{display:table-header-group}
    tr{page-break-inside:avoid}
    th{background:#1B3A5C;color:white;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap}
    td{padding:7px 10px;border:1px solid #e5e7eb}
    tr:nth-child(even){background:#f8fafb}
    .card,.rounded-xl,.rounded-2xl,.rounded-lg{border:1px solid #eee;padding:10px;margin:8px 0;border-radius:6px}
    h2,h3{color:#1B3A5C;margin-top:20px}
    .grid{display:grid;gap:8px}
    .grid-cols-2{grid-template-columns:1fr 1fr}
    .grid-cols-3{grid-template-columns:1fr 1fr 1fr}
    .grid-cols-4{grid-template-columns:1fr 1fr 1fr 1fr}
    button,input[type=file],input[type=checkbox],select,.btn-primary,.btn-secondary,.btn-danger,
    .fixed,.sticky,[class*="hover:"],[class*="cursor-"],.animate-pulse,.animate-spin,.animate-bounce,
    [class*="z-50"],[class*="z-40"]{display:none!important}
    .report-footer{margin-top:30px;padding-top:10px;border-top:2px solid #eee;text-align:center;font-size:9px;color:#999}
    .report-footer p{margin:2px 0}
    @media print{
      body{padding:10px 15px;font-size:12px}
      .report-header{margin-bottom:15px;padding-bottom:10px}
      table{font-size:11px}
      th{padding:6px 8px}td{padding:5px 8px}
    }
  </style></head><body>
  <div class="report-header">
    <div class="logo">Net<span>Escol</span></div>
    ${opts?.municipality ? '<div class="subtitle">' + opts.municipality + '</div>' : ''}
    ${opts?.school ? '<div class="subtitle">' + opts.school + '</div>' : ''}
    <h1>${title}</h1>
    ${subtitle ? '<div class="subtitle">' + subtitle + '</div>' : ''}
    <div class="meta">Emitido em ${new Date().toLocaleString('pt-BR')} | Sistema NetEscol v3.0</div>
  </div>
  ${content}
  ${opts?.signaturesHTML || ''}
  <div class="report-footer">
    <p><b>NetEscol</b> - Sistema de Gestao Escolar Municipal Inteligente</p>
    <p>Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  </body></html>`;
}

export default function ReportExportBar({ title, subtitle, children, fullData, fullDataColumns, municipality, school, hideSignatures }: ReportExportBarProps) {
  const [exporting, setExporting] = useState('');
  const [selectedSignatories, setSelectedSignatories] = useState<Signatory[]>([]);

  const exportReport = (format: string) => {
    setExporting(format);
    const signaturesHTML = generateSignaturesHTML(selectedSignatories);

    setTimeout(() => {
      try {
        if (format === 'pdf' || format === 'print') {
          const content = document.getElementById('report-content')?.innerHTML || '';
          const html = buildReportHTML(title, subtitle, content, { municipality, school, signaturesHTML });
          const w = window.open('', '_blank');
          if (w) {
            w.document.write(html);
            w.document.close();
            setTimeout(() => { w.print(); setExporting(''); }, 700);
          } else setExporting('');
        }

        else if (format === 'excel') {
          let csv = '';
          if (fullData && fullDataColumns) {
            csv = fullDataColumns.map(c => '"' + c.label + '"').join(';') + '\n';
            fullData.forEach(row => {
              csv += fullDataColumns.map(c => {
                let val = row[c.key];
                if (val === null || val === undefined) val = '';
                if (typeof val === 'object') val = JSON.stringify(val);
                return '"' + String(val).replace(/"/g, '""') + '"';
              }).join(';') + '\n';
            });
          } else {
            const el = document.getElementById('report-content');
            const tables = el?.querySelectorAll('table');
            if (tables && tables.length > 0) {
              tables.forEach(table => {
                table.querySelectorAll('tr').forEach(row => {
                  const cells = row.querySelectorAll('th, td');
                  csv += Array.from(cells).map(c => '"' + (c.textContent || '').replace(/"/g, '""').trim() + '"').join(';') + '\n';
                });
                csv += '\n';
              });
            } else {
              csv = title + '\n' + (subtitle || '') + '\nSem dados tabulares para exportar\n';
            }
          }
          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = title.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.csv';
          a.click();
          setExporting('');
        }

        else if (format === 'html') {
          const content = document.getElementById('report-content')?.innerHTML || '';
          const html = buildReportHTML(title, subtitle, content, { municipality, school, signaturesHTML });
          const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = title.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.html';
          a.click();
          setExporting('');
        }
      } catch (e) { console.error(e); setExporting(''); }
    }, 100);
  };

  return (
    <div>
      {/* Export bar */}
      <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500 mr-1">Gerar relatorio:</span>
          <button onClick={() => exportReport('pdf')} disabled={!!exporting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 font-medium shadow-sm">
            {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
          </button>
          <button onClick={() => exportReport('excel')} disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
            {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
          </button>
          <button onClick={() => exportReport('print')} disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50">
            {exporting === 'print' ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} Imprimir
          </button>
          <button onClick={() => exportReport('html')} disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            {exporting === 'html' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} HTML
          </button>
        </div>

        {/* Signature selector */}
        {!hideSignatures && (
          <ReportSignatureSelector
            selected={selectedSignatories}
            onChange={setSelectedSignatories}
          />
        )}
      </div>

      {/* Report content */}
      <div id="report-content">
        {children}
      </div>
    </div>
  );
}

export { buildReportHTML, generateSignaturesHTML };
