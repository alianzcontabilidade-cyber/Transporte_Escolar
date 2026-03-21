import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { TrendingUp, Download, Printer, School, Filter } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, openReportAsPDF } from '../lib/reportTemplate';
import { buildTableReportHTML, getMunicipalityReport } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function SchoolPerformancePage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => api.enrollments.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  // Build performance data from enrollments
  useEffect(() => {
    if (!allClasses.length || !allEnrollments.length) return;

    const filteredClasses = selSchool === 'all' ? allClasses : allClasses.filter((c: any) => String(c.schoolId) === selSchool);
    const data: any[] = [];

    for (const cls of filteredClasses) {
      const classEnrollments = allEnrollments.filter((e: any) => e.classId === cls.id);
      const total = classEnrollments.length;
      if (total === 0) continue;

      const approved = classEnrollments.filter((e: any) => e.status === 'approved' || e.finalResult === 'approved').length;
      const retained = classEnrollments.filter((e: any) => e.status === 'retained' || e.finalResult === 'retained' || e.status === 'reprovado').length;
      const transferred = classEnrollments.filter((e: any) => e.status === 'transferred' || e.status === 'transferido').length;
      const dropped = classEnrollments.filter((e: any) => e.status === 'dropped' || e.status === 'desistente' || e.status === 'evadido').length;
      const active = classEnrollments.filter((e: any) => e.status === 'active' || e.status === 'ativo').length;

      data.push({
        schoolName: cls.schoolName || '--',
        className: cls.fullName || cls.name || '--',
        shift: cls.shift === 'morning' ? 'Mat.' : cls.shift === 'afternoon' ? 'Vesp.' : cls.shift === 'evening' ? 'Not.' : '--',
        total,
        active,
        approved,
        retained,
        transferred,
        dropped,
        approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) + '%' : '--',
      });
    }

    data.sort((a, b) => a.schoolName.localeCompare(b.schoolName) || a.className.localeCompare(b.className));
    setPerformanceData(data);
  }, [allClasses, allEnrollments, selSchool]);

  // Totals
  const totals = performanceData.reduce((acc, d) => ({
    total: acc.total + d.total,
    active: acc.active + d.active,
    approved: acc.approved + d.approved,
    retained: acc.retained + d.retained,
    transferred: acc.transferred + d.transferred,
    dropped: acc.dropped + d.dropped,
  }), { total: 0, active: 0, approved: 0, retained: 0, transferred: 0, dropped: 0 });

  const buildReportHTML = () => {
    if (!munReport || !performanceData.length) return '';
    const rows = performanceData.map(d => ({
      'Escola': d.schoolName,
      'Turma': d.className,
      'Turno': d.shift,
      'Matric.': d.total,
      'Ativos': d.active,
      'Aprov.': d.approved,
      'Retidos': d.retained,
      'Transf.': d.transferred,
      'Evadidos': d.dropped,
      '% Aprov.': d.approvalRate,
    }));

    const schoolLabel = selSchool === 'all' ? 'Todas as Escolas' : allSchools.find((s: any) => String(s.id) === selSchool)?.name || '';

    return buildTableReportHTML(
      'QUADRO DE RENDIMENTO ESCOLAR',
      rows,
      ['Escola', 'Turma', 'Turno', 'Matric.', 'Ativos', 'Aprov.', 'Retidos', 'Transf.', 'Evadidos', '% Aprov.'],
      munReport,
      {
        subtitle: `${schoolLabel} - Ano Letivo ${new Date().getFullYear()}`,
        signatories: selectedSigs,
        orientation: 'landscape',
        fontSize: 10,
        summary: `Totais: ${totals.total} matriculados | ${totals.active} ativos | ${totals.approved} aprovados | ${totals.retained} retidos | ${totals.transferred} transferidos | ${totals.dropped} evadidos | Taxa de Aprovação: ${totals.total > 0 ? ((totals.approved / totals.total) * 100).toFixed(1) : 0}%`,
      }
    );
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handlePDF = async () => { const html = buildReportHTML(); if (html) await openReportAsPDF(html, 'Quadro_Rendimento_Escolar'); };
  const handleExportClick = () => {
    if (!performanceData.length) { alert('Nenhum dado disponível para exportar'); return; }
    if (!munReport) { alert('Aguarde o carregamento dos dados'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: 'Quadro_Rendimento_Escolar' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp size={20} className="text-emerald-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Quadro de Rendimento Escolar</h1><p className="text-gray-500">Aprovados, retidos, transferidos e evadidos por turma</p></div>
        </div>
        {performanceData.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePDF} className="btn-primary flex items-center gap-2"><Download size={16} /> Gerar PDF</button>
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="label">Escola</label>
          <select className="input w-64" value={selSchool} onChange={e => setSelSchool(e.target.value)}>
            <option value="all">Todas as Escolas</option>
            {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {performanceData.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* KPI Cards */}
      {performanceData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          <div className="card text-center p-4"><p className="text-2xl font-bold text-gray-800">{totals.total}</p><p className="text-xs text-gray-500">Matriculados</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-blue-600">{totals.active}</p><p className="text-xs text-gray-500">Ativos</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-green-600">{totals.approved}</p><p className="text-xs text-gray-500">Aprovados</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-red-600">{totals.retained}</p><p className="text-xs text-gray-500">Retidos</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-yellow-600">{totals.transferred}</p><p className="text-xs text-gray-500">Transferidos</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-emerald-600">{totals.total > 0 ? ((totals.approved / totals.total) * 100).toFixed(1) : 0}%</p><p className="text-xs text-gray-500">Taxa Aprovação</p></div>
        </div>
      )}

      {/* Table */}
      {performanceData.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Escola','Turma','Turno','Matric.','Ativos','Aprovados','Retidos','Transf.','Evadidos','% Aprov.'].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {performanceData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 text-xs">{d.schoolName}</td>
                  <td className="px-4 py-3 text-xs">{d.className}</td>
                  <td className="px-4 py-3 text-xs">{d.shift}</td>
                  <td className="px-4 py-3 font-bold text-xs">{d.total}</td>
                  <td className="px-4 py-3 text-blue-600 font-bold text-xs">{d.active}</td>
                  <td className="px-4 py-3 text-green-600 font-bold text-xs">{d.approved}</td>
                  <td className="px-4 py-3 text-red-600 font-bold text-xs">{d.retained}</td>
                  <td className="px-4 py-3 text-yellow-600 font-bold text-xs">{d.transferred}</td>
                  <td className="px-4 py-3 text-orange-600 font-bold text-xs">{d.dropped}</td>
                  <td className="px-4 py-3 font-bold text-xs">{d.approvalRate}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold text-xs">
                <td className="px-4 py-3" colSpan={3}>TOTAL GERAL</td>
                <td className="px-4 py-3">{totals.total}</td>
                <td className="px-4 py-3 text-blue-600">{totals.active}</td>
                <td className="px-4 py-3 text-green-600">{totals.approved}</td>
                <td className="px-4 py-3 text-red-600">{totals.retained}</td>
                <td className="px-4 py-3 text-yellow-600">{totals.transferred}</td>
                <td className="px-4 py-3 text-orange-600">{totals.dropped}</td>
                <td className="px-4 py-3">{totals.total > 0 ? ((totals.approved / totals.total) * 100).toFixed(1) : 0}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum dado de rendimento disponível</p><p className="text-xs text-gray-400 mt-1">Verifique se há matrículas e turmas cadastradas</p></div>
      )}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Quadro de Rendimento" />
    </div>
  );
}
