import { useState } from 'react';
import { Printer, FileText, FileSpreadsheet, Download, X, Loader2 } from 'lucide-react';

interface ReportExportBarProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tableSelector?: string;
}

export default function ReportExportBar({ title, subtitle, children, tableSelector }: ReportExportBarProps) {
  const [exporting, setExporting] = useState('');

  const getReportHTML = (forPDF = false) => {
    const content = document.getElementById('report-content')?.innerHTML || '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} - NetEscol</title>
    <style>
      body{font-family:Arial,sans-serif;padding:${forPDF ? '30px' : '20px'};color:#333;max-width:1000px;margin:0 auto}
      .report-header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:3px solid #2DB5B0}
      .report-header h1{color:#1B3A5C;font-size:${forPDF ? '20px' : '18px'};margin:0}
      .report-header p{color:#666;font-size:12px;margin:5px 0 0}
      .report-header .logo{font-size:24px;font-weight:bold;color:#2DB5B0;margin-bottom:5px}
      table{width:100%;border-collapse:collapse;margin:15px 0;font-size:${forPDF ? '11px' : '12px'}}
      th{background:#1B3A5C;color:white;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase}
      td{padding:6px 10px;border:1px solid #e5e7eb}
      tr:nth-child(even){background:#f8f9fa}
      .card,.rounded-xl,.rounded-2xl{border:1px solid #eee;padding:10px;margin:8px 0;border-radius:8px}
      .text-2xl,.text-xl{font-size:18px!important}.text-lg{font-size:16px!important}
      .grid{display:grid;gap:10px}.grid-cols-2{grid-template-columns:1fr 1fr}
      .grid-cols-3{grid-template-columns:1fr 1fr 1fr}.grid-cols-4{grid-template-columns:1fr 1fr 1fr 1fr}
      button,input[type=file],select,.btn-primary,.btn-secondary,.fixed,.sticky,
      [class*="hover:"],.animate-pulse,.animate-spin{display:none!important}
      .report-footer{margin-top:30px;padding-top:10px;border-top:1px solid #eee;text-align:center;font-size:9px;color:#999}
      @media print{body{padding:15px}.report-footer{position:fixed;bottom:10px;left:0;right:0}}
    </style></head><body>
    <div class="report-header">
      <div class="logo">NetEscol</div>
      <h1>${title}</h1>
      ${subtitle ? '<p>' + subtitle + '</p>' : ''}
      <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
    </div>
    ${content}
    <div class="report-footer">NetEscol - Sistema de Gestão Escolar Municipal | ${new Date().toLocaleDateString('pt-BR')}</div>
    </body></html>`;
  };

  const exportReport = (format: string) => {
    setExporting(format);
    setTimeout(() => {
      try {
        if (format === 'print' || format === 'pdf') {
          const w = window.open('', '_blank');
          if (w) {
            w.document.write(getReportHTML(format === 'pdf'));
            w.document.close();
            setTimeout(() => { w.print(); setExporting(''); }, 600);
          } else setExporting('');
        } else if (format === 'excel') {
          const el = document.getElementById('report-content');
          const tables = el?.querySelectorAll('table');
          if (!tables || tables.length === 0) {
            // No tables - export all text content as CSV
            const rows = el?.querySelectorAll('tr, [class*="card"], [class*="rounded"]');
            let csv = title + '\n' + (subtitle || '') + '\n\n';
            if (rows) rows.forEach(r => { csv += (r.textContent || '').replace(/\s+/g, ' ').trim() + '\n'; });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = title.replace(/\s/g, '_') + '.csv'; a.click();
          } else {
            let csv = '';
            tables.forEach(table => {
              table.querySelectorAll('tr').forEach(row => {
                const cells = row.querySelectorAll('th, td');
                csv += Array.from(cells).map(c => '"' + (c.textContent || '').replace(/"/g, '""').trim() + '"').join(';') + '\n';
              });
              csv += '\n';
            });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = title.replace(/\s/g, '_') + '.csv'; a.click();
          }
          setExporting('');
        } else if (format === 'html') {
          const blob = new Blob([getReportHTML()], { type: 'text/html;charset=utf-8;' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = title.replace(/\s/g, '_') + '.html'; a.click();
          setExporting('');
        }
      } catch { setExporting(''); }
    }, 100);
  };

  return (
    <div>
      {/* Export bar */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex-wrap">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Exportar:</span>
        <button onClick={() => exportReport('print')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50">
          {exporting === 'print' ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} Imprimir
        </button>
        <button onClick={() => exportReport('pdf')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
          {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
        </button>
        <button onClick={() => exportReport('excel')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
          {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
        </button>
        <button onClick={() => exportReport('html')} disabled={!!exporting} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50">
          {exporting === 'html' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} HTML
        </button>
      </div>
      {/* Report content */}
      <div id="report-content">
        {children}
      </div>
    </div>
  );
}
