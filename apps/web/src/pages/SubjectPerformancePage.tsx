import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { BarChart3, Download, Printer, Users, GraduationCap } from 'lucide-react';
import { loadMunicipalityData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function SubjectPerformancePage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [perfData, setPerfData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const cls = allClasses.find((c: any) => String(c.id) === selClass);

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  // Load grades and aggregate by subject
  useEffect(() => {
    if (!selClass || !allEnrollments.length) { setPerfData([]); return; }
    setLoading(true);

    const loadAll = async () => {
      const subjectStats: Record<string, { name: string; totalAvg: number; count: number; approved: number; failed: number; scores: number[] }> = {};

      for (const enr of allEnrollments) {
        try {
          const reportCard = await api.studentGrades.reportCard({ classId: parseInt(selClass), studentId: enr.studentId });
          for (const s of (reportCard as any) || []) {
            if (!subjectStats[s.subjectId]) subjectStats[s.subjectId] = { name: s.subjectName, totalAvg: 0, count: 0, approved: 0, failed: 0, scores: [] };
            const avgs = ['1','2','3','4'].map((b: string) => {
              const grades = s.bimesters[b] || [];
              if (!grades.length) return null;
              const scores = grades.filter((g: any) => g.score !== null).map((g: any) => g.score);
              return scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;
            });
            const valid = avgs.filter((a): a is number => a !== null);
            if (valid.length > 0) {
              const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
              subjectStats[s.subjectId].totalAvg += avg;
              subjectStats[s.subjectId].count++;
              subjectStats[s.subjectId].scores.push(avg);
              if (avg >= 6) subjectStats[s.subjectId].approved++;
              else subjectStats[s.subjectId].failed++;
            }
          }
        } catch { /* skip */ }
      }

      const results = Object.values(subjectStats).map(s => ({
        name: s.name,
        avgGrade: s.count > 0 ? (s.totalAvg / s.count) : null,
        students: s.count,
        approved: s.approved,
        failed: s.failed,
        approvalRate: s.count > 0 ? ((s.approved / s.count) * 100).toFixed(1) : '--',
        highest: s.scores.length > 0 ? Math.max(...s.scores) : null,
        lowest: s.scores.length > 0 ? Math.min(...s.scores) : null,
      })).sort((a, b) => (a.avgGrade || 0) - (b.avgGrade || 0));

      setPerfData(results);
      setLoading(false);
    };

    loadAll();
  }, [selClass, allEnrollments.length]);

  const buildReportHTML = () => {
    if (!munReport || !perfData.length) return '';
    const rows = perfData.map((d, i) => ({
      'Nº': i + 1,
      'Disciplina': d.name,
      'Alunos': d.students,
      'Média Geral': d.avgGrade !== null ? d.avgGrade.toFixed(1) : '--',
      'Maior Nota': d.highest !== null ? d.highest.toFixed(1) : '--',
      'Menor Nota': d.lowest !== null ? d.lowest.toFixed(1) : '--',
      'Aprovados': d.approved,
      'Reprovados': d.failed,
      '% Aprovação': d.approvalRate + '%',
    }));

    return buildTableReportHTML('DESEMPENHO POR DISCIPLINA', rows,
      ['Nº', 'Disciplina', 'Alunos', 'Média Geral', 'Maior Nota', 'Menor Nota', 'Aprovados', 'Reprovados', '% Aprovação'],
      munReport, {
        subtitle: `${cls?.fullName || cls?.name || ''} - Ano Letivo ${new Date().getFullYear()}`,
        signatories: selectedSigs, orientation: 'landscape', fontSize: 10,
      });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!perfData.length) { showInfoToast('Nenhum dado'); return; }
    const html = buildReportHTML(); if (!html) return;
    setPgExportModal({ html, filename: 'Desempenho_Disciplina' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center"><BarChart3 size={20} className="text-fuchsia-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Desempenho por Disciplina</h1><p className="text-gray-500">Média, aprovação e reprovação por componente curricular</p></div>
        </div>
        {perfData.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select className="input w-80" value={selClass} onChange={e => setSelClass(e.target.value)}>
          <option value="">Selecione a turma</option>
          {allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}
        </select>
      </div>

      {perfData.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {loading && <div className="card text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fuchsia-500 mx-auto mb-3" /><p className="text-gray-500">Analisando desempenho...</p></div>}

      {!loading && perfData.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['Disciplina','Alunos','Média','Maior','Menor','Aprov.','Reprov.','% Aprov.'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {perfData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800 text-xs">{d.name}</td>
                  <td className="px-4 py-3 text-xs">{d.students}</td>
                  <td className={`px-4 py-3 text-xs font-bold ${d.avgGrade !== null && d.avgGrade >= 6 ? 'text-green-600' : 'text-red-600'}`}>{d.avgGrade !== null ? d.avgGrade.toFixed(1) : '--'}</td>
                  <td className="px-4 py-3 text-xs text-green-600">{d.highest !== null ? d.highest.toFixed(1) : '--'}</td>
                  <td className="px-4 py-3 text-xs text-red-600">{d.lowest !== null ? d.lowest.toFixed(1) : '--'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-green-600">{d.approved}</td>
                  <td className="px-4 py-3 text-xs font-bold text-red-600">{d.failed}</td>
                  <td className="px-4 py-3 text-xs font-bold">{d.approvalRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && selClass ? (
        <div className="card text-center py-16"><GraduationCap size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma nota lançada nesta turma</p></div>
      ) : !selClass ? (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para analisar o desempenho</p></div>
      ) : null}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Desempenho por Disciplina" />
    </div>
  );
}
