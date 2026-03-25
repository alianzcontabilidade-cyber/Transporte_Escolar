import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { BookOpen, Download, Printer, School } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, generateReportHTML } from '../lib/reportTemplate';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

function shiftLabel(s: string): string {
  return s === 'morning' ? 'Matutino' : s === 'afternoon' ? 'Vespertino' : s === 'evening' ? 'Noturno' : s === 'full_time' ? 'Integral' : (s || '--');
}

export default function CurriculumReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: subjectsData } = useQuery(() => api.subjects.list({ municipalityId: mid }), [mid]);
  const { data: classSubjectsData } = useQuery(() => api.classSubjects.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allClasses = (classesData as any) || [];
  const allSubjects = (subjectsData as any) || [];
  const allClassSubjects = (classSubjectsData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const filteredClasses = selSchool === 'all' ? allClasses : allClasses.filter((c: any) => String(c.schoolId) === selSchool);

  // Build curriculum grid: for each class, list assigned subjects with weekly hours
  const curriculumData = filteredClasses.map((cls: any) => {
    const assigned = allClassSubjects.filter((cs: any) => cs.classId === cls.id);
    const subjects = assigned.map((cs: any) => {
      const subject = allSubjects.find((s: any) => s.id === cs.subjectId);
      return {
        name: subject?.name || cs.subjectName || '--',
        weeklyHours: cs.weeklyHours || cs.hoursPerWeek || 0,
        teacherName: cs.teacherName || '--',
      };
    }).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const totalHours = subjects.reduce((a: number, s: any) => a + (s.weeklyHours || 0), 0);

    return {
      className: cls.fullName || cls.name || '--',
      schoolName: cls.schoolName || '--',
      shift: shiftLabel(cls.shift),
      subjects,
      totalHours,
      schoolId: cls.schoolId,
    };
  }).filter((c: any) => c.subjects.length > 0);

  const buildReportHTML = () => {
    if (!munReport || !curriculumData.length) return '';
    const { municipality, secretaria } = munReport;
    const school = selSchool !== 'all' ? loadSchoolData(parseInt(selSchool), allSchools) : undefined;

    let content = '';
    for (const cls of curriculumData) {
      let rows = '';
      cls.subjects.forEach((s: any, i: number) => {
        rows += `<tr>
          <td>${i + 1}</td>
          <td style="text-align:left;font-weight:500">${s.name}</td>
          <td>${s.weeklyHours || '--'}</td>
          <td style="text-align:left">${s.teacherName}</td>
        </tr>`;
      });

      content += `
        <div style="margin-bottom:20px">
          <div style="background:#f0f4f8;padding:8px 12px;border-radius:6px;margin-bottom:8px;font-size:11px">
            <b>${cls.className}</b> | ${cls.shift} | ${cls.schoolName} | Total: ${cls.totalHours}h/semana
          </div>
          <table>
            <thead><tr><th style="width:35px">Nº</th><th style="text-align:left">COMPONENTE CURRICULAR</th><th style="width:80px">H/SEMANA</th><th style="text-align:left">PROFESSOR(A)</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr class="total-row"><td colspan="2" style="text-align:right"><b>CARGA HORÁRIA SEMANAL</b></td><td style="font-weight:bold">${cls.totalHours}h</td><td></td></tr></tfoot>
          </table>
        </div>
      `;
    }

    return generateReportHTML({
      municipality, secretaria, school,
      title: 'QUADRO CURRICULAR',
      subtitle: `${selSchool === 'all' ? 'Todas as Escolas' : school?.name || ''} - Ano Letivo ${new Date().getFullYear()}`,
      content,
      signatories: selectedSigs,
      fontFamily: 'sans-serif',
      fontSize: 11,
    });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!curriculumData.length) { showInfoToast('Nenhum dado disponível'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: 'Quadro_Curricular' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><BookOpen size={20} className="text-violet-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Quadro Curricular</h1><p className="text-gray-500">Disciplinas, carga horária e professores por turma</p></div>
        </div>
        {curriculumData.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 items-end">
        <div><label className="label">Escola</label>
          <select className="input w-64" value={selSchool} onChange={e => setSelSchool(e.target.value)}>
            <option value="all">Todas as Escolas</option>
            {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {curriculumData.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {curriculumData.length > 0 ? (
        <div className="space-y-4">
          {curriculumData.map((cls: any, ci: number) => (
            <div key={ci} className="card p-0 overflow-hidden">
              <div className="bg-violet-600 text-white px-4 py-3">
                <h3 className="font-bold">{cls.className}</h3>
                <p className="text-xs text-white/70">{cls.schoolName} | {cls.shift} | {cls.totalHours}h/semana</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-2 text-xs text-gray-500 w-10">Nº</th><th className="text-left px-4 py-2 text-xs text-gray-500">Disciplina</th><th className="px-4 py-2 text-xs text-gray-500 w-20">H/Sem</th><th className="text-left px-4 py-2 text-xs text-gray-500">Professor(a)</th></tr></thead>
                <tbody className="divide-y">
                  {cls.subjects.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-center text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800 text-xs">{s.name}</td>
                      <td className="px-4 py-2 text-center font-bold text-violet-600 text-xs">{s.weeklyHours || '--'}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{s.teacherName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma disciplina vinculada às turmas</p><p className="text-xs text-gray-400 mt-1">Vincule disciplinas às turmas na página de Disciplinas</p></div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title="Exportar Quadro Curricular" />
    </div>
  );
}
