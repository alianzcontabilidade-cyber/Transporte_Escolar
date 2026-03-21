import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { BarChart3, Users, Printer, Download, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

import { loadMunicipalityData } from '../lib/reportTemplate';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

export default function AttendanceReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [municipalityName, setMunicipalityName] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [selClass, setSelClass] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(({ municipality }) => {
      setMunicipalityName(municipality.name || '');
    });
    getMunicipalityReport(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: summaryData } = useQuery(() => selClass ? api.diaryAttendance.studentSummary({ classId: parseInt(selClass), startDate, endDate }) : Promise.resolve([]), [selClass, startDate, endDate]);

  const allClasses = (classesData as any) || [];
  const summary = (summaryData as any) || [];

  const totalDays = summary.length > 0 ? (summary[0]?.total || 0) : 0;

  const printReport = () => {
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório de Frequência - NetEscol</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}th{background:#1B3A5C;color:white;padding:8px;text-align:center}
    td{padding:6px 8px;border:1px solid #ddd;text-align:center}tr:nth-child(even){background:#f8f9fa}
    .low{color:#dc2626;font-weight:bold}.ok{color:#16a34a}
    .footer{margin-top:30px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>Relatório de Frequência</h1>
    <p><b>Turma:</b> ${cls?.fullName || ''} | <b>Escola:</b> ${cls?.schoolName || ''}</p>
    <p><b>Período:</b> ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}</p>
    <table><thead><tr><th>Nº</th><th>Aluno</th><th>Presenças</th><th>Faltas</th><th>Justificadas</th><th>Atrasos</th><th>Total</th><th>% Presença</th></tr></thead>
    <tbody>${summary.map((s: any, i: number) => {
      const pct = s.total > 0 ? Math.round(((s.present + s.justified) / s.total) * 100) : 0;
      return '<tr><td>'+(i+1)+'</td><td style="text-align:left">'+s.studentName+'</td><td>'+s.present+'</td><td>'+(s.absent||0)+'</td><td>'+(s.justified||0)+'</td><td>'+(s.late||0)+'</td><td>'+s.total+'</td><td class="'+(pct<75?'low':'ok')+'">'+pct+'%</td></tr>';
    }).join('')}</tbody></table>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const exportCSV = () => {
    if (!summary.length) return;
    const rows = summary.map((s: any) => ({ aluno: s.studentName, presencas: s.present, faltas: s.absent||0, justificadas: s.justified||0, atrasos: s.late||0, total: s.total, percentual: s.total > 0 ? Math.round(((s.present+(s.justified||0))/s.total)*100) + '%' : '0%' }));
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(';'), ...rows.map((r: any) => keys.map(k => '"'+(r[k]||'')+'"').join(';'))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'})); a.download = 'frequencia_netescol.csv'; a.click();
  };

  const handleExportClick = () => {
    const rows = summary.map((s: any, i: number) => ({
      num: i + 1,
      aluno: s.studentName || '--',
      presencas: s.present || 0,
      faltas: s.absent || 0,
      justificadas: s.justified || 0,
      atrasos: s.late || 0,
      total: s.total || 0,
      percentual: s.total > 0 ? Math.round(((s.present + (s.justified || 0)) / s.total) * 100) + '%' : '0%',
    }));
    const cols = ['N', 'Aluno', 'Presencas', 'Faltas', 'Justificadas', 'Atrasos', 'Total', '% Presenca'];
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const html = buildTableReportHTML('RELATORIO DE FREQUENCIA', rows, cols, munReport, {
      subtitle: `Turma: ${cls?.fullName || ''} | ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      orientation: 'landscape',
      signatories: selectedSigs,
    });
    if (!html) { alert('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'relatorio_frequencia' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><BarChart3 size={20} className="text-violet-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Relatório de Frequência</h1><p className="text-gray-500">Presença por aluno e período</p></div></div>
        {summary.length > 0 && (
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} /> CSV</button>
            <button onClick={printReport} className="btn-primary flex items-center gap-2 text-sm"><Printer size={14} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="input w-64" value={selClass} onChange={e => setSelClass(e.target.value)}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>
        <input type="date" className="input w-44" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span className="self-center text-gray-400">a</span>
        <input type="date" className="input w-44" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {summary.length > 0 ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="card text-center bg-blue-50 border-0"><Users size={20} className="text-blue-500 mx-auto mb-1" /><p className="text-xl font-bold">{summary.length}</p><p className="text-xs text-gray-500">Alunos</p></div>
            <div className="card text-center bg-green-50 border-0"><CheckCircle size={20} className="text-green-500 mx-auto mb-1" /><p className="text-xl font-bold text-green-600">{summary.reduce((s: number, a: any) => s + (a.present||0), 0)}</p><p className="text-xs text-gray-500">Presenças</p></div>
            <div className="card text-center bg-red-50 border-0"><XCircle size={20} className="text-red-400 mx-auto mb-1" /><p className="text-xl font-bold text-red-600">{summary.reduce((s: number, a: any) => s + (a.absent||0), 0)}</p><p className="text-xs text-gray-500">Faltas</p></div>
            <div className="card text-center bg-yellow-50 border-0"><AlertTriangle size={20} className="text-yellow-500 mx-auto mb-1" /><p className="text-xl font-bold text-yellow-600">{summary.filter((s: any) => { const pct = s.total > 0 ? ((s.present+(s.justified||0))/s.total)*100 : 100; return pct < 75; }).length}</p><p className="text-xs text-gray-500">Abaixo de 75%</p></div>
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['Nº','Aluno','Presenças','Faltas','Justif.','Atrasos','Total','% Presença'].map(h => <th key={h} className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y">{summary.map((s: any, i: number) => {
              const pct = s.total > 0 ? Math.round(((s.present + (s.justified||0)) / s.total) * 100) : 0;
              return (
                <tr key={s.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-center text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-left">{s.studentName}</td>
                  <td className="px-4 py-2.5 text-center text-green-600 font-medium">{s.present}</td>
                  <td className="px-4 py-2.5 text-center text-red-600 font-medium">{s.absent || 0}</td>
                  <td className="px-4 py-2.5 text-center text-yellow-600">{s.justified || 0}</td>
                  <td className="px-4 py-2.5 text-center text-orange-600">{s.late || 0}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{s.total}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</span>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1"><div className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: pct + '%' }} /></div>
                  </td>
                </tr>
              );
            })}</tbody></table>
          </div>
        </>
      ) : selClass ? (
        <div className="card text-center py-16"><BarChart3 size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum registro de frequência encontrado para este período</p></div>
      ) : (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para ver o relatório</p></div>
      )}
    
      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
