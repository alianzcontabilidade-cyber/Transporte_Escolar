import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { AlertTriangle, Download, Printer, Users, School } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function LowPerformancePage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('all');
  const [selClass, setSelClass] = useState('all');
  const [threshold, setThreshold] = useState(6);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [lowStudents, setLowStudents] = useState<any[]>([]);
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

  // Filter classes by school
  const filteredClasses = selSchool === 'all' ? allClasses : allClasses.filter((c: any) => String(c.schoolId) === selSchool);

  // Load grades for students and find low performers
  useEffect(() => {
    if (!allEnrollments.length || !filteredClasses.length) { setLowStudents([]); return; }

    const targetClasses = selClass === 'all' ? filteredClasses : filteredClasses.filter((c: any) => String(c.id) === selClass);
    if (!targetClasses.length) { setLowStudents([]); return; }

    setLoading(true);
    const loadAll = async () => {
      const results: any[] = [];

      for (const cls of targetClasses) {
        const classEnrollments = allEnrollments.filter((e: any) => e.classId === cls.id && (e.status === 'active' || e.status === 'ativo'));

        for (const enr of classEnrollments) {
          try {
            const reportCard = await api.studentGrades.reportCard({ classId: cls.id, studentId: enr.studentId });
            const subjects = (reportCard as any) || [];
            const lowSubjects: string[] = [];
            let totalAvg = 0, countAvg = 0;

            for (const s of subjects) {
              const avgs = ['1','2','3','4'].map(b => {
                const grades = s.bimesters[b] || [];
                if (!grades.length) return null;
                const scores = grades.filter((g: any) => g.score !== null).map((g: any) => g.score);
                return scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;
              });
              const validAvgs = avgs.filter((a): a is number => a !== null);
              const finalAvg = validAvgs.length ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : null;

              if (finalAvg !== null) {
                totalAvg += finalAvg;
                countAvg++;
                if (finalAvg < threshold) {
                  lowSubjects.push(`${s.subjectName} (${finalAvg.toFixed(1)})`);
                }
              }
            }

            const mediaGeral = countAvg > 0 ? totalAvg / countAvg : null;

            if (lowSubjects.length > 0) {
              results.push({
                studentName: enr.studentName,
                enrollment: enr.enrollment,
                className: cls.fullName || cls.name,
                schoolName: cls.schoolName || '--',
                shift: cls.shift === 'morning' ? 'Mat.' : cls.shift === 'afternoon' ? 'Vesp.' : 'Not.',
                mediaGeral,
                lowSubjects,
                lowCount: lowSubjects.length,
              });
            }
          } catch { /* skip */ }
        }
      }

      results.sort((a, b) => (a.mediaGeral || 99) - (b.mediaGeral || 99));
      setLowStudents(results);
      setLoading(false);
    };

    loadAll();
  }, [filteredClasses.length, allEnrollments.length, selClass, threshold]);

  const buildReportHTML = () => {
    if (!munReport || !lowStudents.length) return '';

    const rows = lowStudents.map((d, i) => ({
      'Nº': i + 1,
      'Aluno': d.studentName,
      'Matrícula': d.enrollment || '--',
      'Turma': d.className,
      'Escola': d.schoolName,
      'Média': d.mediaGeral !== null ? d.mediaGeral.toFixed(1) : '--',
      'Disciplinas Abaixo': d.lowSubjects.join(', '),
    }));

    return buildTableReportHTML(
      'ALUNOS COM BAIXO RENDIMENTO',
      rows,
      ['Nº', 'Aluno', 'Matrícula', 'Turma', 'Escola', 'Média', 'Disciplinas Abaixo'],
      munReport,
      {
        subtitle: `Nota mínima: ${threshold.toFixed(1)} - Ano Letivo ${new Date().getFullYear()}`,
        signatories: selectedSigs,
        orientation: 'landscape',
        fontSize: 10,
        summary: `Total: ${lowStudents.length} aluno(s) com rendimento abaixo de ${threshold.toFixed(1)}`,
      }
    );
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!lowStudents.length) { showInfoToast('Nenhum dado disponível'); return; }
    if (!munReport) { showInfoToast('Aguarde o carregamento'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: 'Alunos_Baixo_Rendimento' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle size={20} className="text-red-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Alunos com Baixo Rendimento</h1><p className="text-gray-500">Alunos com média abaixo do mínimo por disciplina</p></div>
        </div>
        {lowStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="label">Escola</label>
          <select className="input w-56" value={selSchool} onChange={e => { setSelSchool(e.target.value); setSelClass('all'); }}>
            <option value="all">Todas</option>
            {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Turma</label>
          <select className="input w-56" value={selClass} onChange={e => setSelClass(e.target.value)}>
            <option value="all">Todas</option>
            {filteredClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nota Mínima</label>
          <input type="number" className="input w-24" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value) || 6)} min={0} max={10} step={0.5} />
        </div>
      </div>

      {lowStudents.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* KPI */}
      {lowStudents.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <div className="card text-center p-4"><AlertTriangle size={24} className="text-red-500 mx-auto mb-1" /><p className="text-2xl font-bold text-red-600">{lowStudents.length}</p><p className="text-xs text-gray-500">Alunos abaixo da média</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-gray-800">{lowStudents.reduce((a, s) => a + s.lowCount, 0)}</p><p className="text-xs text-gray-500">Disciplinas em recuperação</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-orange-600">{lowStudents[0]?.mediaGeral !== null ? lowStudents[0].mediaGeral.toFixed(1) : '--'}</p><p className="text-xs text-gray-500">Menor média</p></div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto mb-3" /><p className="text-gray-500">Analisando desempenho dos alunos...</p></div>
      )}

      {/* Table */}
      {!loading && lowStudents.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nº','Aluno','Matrícula','Turma','Escola','Média','Disciplinas Abaixo'].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {lowStudents.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{d.studentName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{d.enrollment || '--'}</td>
                  <td className="px-4 py-3 text-xs">{d.className}</td>
                  <td className="px-4 py-3 text-xs">{d.schoolName}</td>
                  <td className={`px-4 py-3 text-xs font-bold ${d.mediaGeral !== null && d.mediaGeral < threshold ? 'text-red-600' : 'text-gray-600'}`}>{d.mediaGeral !== null ? d.mediaGeral.toFixed(1) : '--'}</td>
                  <td className="px-4 py-3 text-xs text-red-600">{d.lowSubjects.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && !lowStudents.length && allEnrollments.length > 0 ? (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum aluno com rendimento abaixo de {threshold.toFixed(1)}</p></div>
      ) : !loading ? (
        <div className="card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Carregando dados...</p></div>
      ) : null}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title="Exportar Relatório de Baixo Rendimento" />
    </div>
  );
}
