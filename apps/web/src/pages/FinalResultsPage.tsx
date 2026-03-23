import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Download, Printer, Users, Award } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, generateReportHTML } from '../lib/reportTemplate';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

function shiftLabel(s: string): string {
  return s === 'morning' ? 'Matutino' : s === 'afternoon' ? 'Vespertino' : s === 'evening' ? 'Noturno' : s === 'full_time' ? 'Integral' : (s || '--');
}

export default function FinalResultsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [gradesByStudent, setGradesByStudent] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const allSchools = (schoolsData as any) || [];
  const cls = allClasses.find((c: any) => String(c.id) === selClass);

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  // Load grades for all students in class
  useEffect(() => {
    if (!selClass || !allEnrollments.length) { setGradesByStudent([]); return; }
    setLoadingGrades(true);

    const loadAll = async () => {
      const results: any[] = [];
      for (const enr of allEnrollments) {
        try {
          const reportCard = await api.studentGrades.reportCard({ classId: parseInt(selClass), studentId: enr.studentId });
          const subjects = (reportCard as any) || [];
          let sumMD = 0, countMD = 0;
          const subjectResults: any[] = [];

          for (const s of subjects) {
            const avgs = ['1','2','3','4'].map(b => {
              const grades = s.bimesters[b] || [];
              if (!grades.length) return null;
              const scores = grades.filter((g: any) => g.score !== null).map((g: any) => g.score);
              return scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;
            });
            const validAvgs = avgs.filter((a): a is number => a !== null);
            const finalAvg = validAvgs.length ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : null;
            if (finalAvg !== null) { sumMD += finalAvg; countMD++; }
            subjectResults.push({ subject: s.subjectName, avg: finalAvg });
          }

          const mediaGeral = countMD > 0 ? sumMD / countMD : null;
          const resultado = mediaGeral !== null ? (mediaGeral >= 6 ? 'APROVADO(A)' : 'RETIDO(A)') :
                           (enr.status === 'approved' ? 'APROVADO(A)' : enr.status === 'retained' ? 'RETIDO(A)' : enr.status === 'transferred' ? 'TRANSFERIDO(A)' : 'CURSANDO');

          results.push({
            studentName: enr.studentName,
            enrollment: enr.enrollment,
            mediaGeral,
            resultado,
            subjects: subjectResults,
            status: enr.status,
          });
        } catch {
          results.push({
            studentName: enr.studentName,
            enrollment: enr.enrollment,
            mediaGeral: null,
            resultado: enr.status === 'approved' ? 'APROVADO(A)' : enr.status === 'retained' ? 'RETIDO(A)' : enr.status === 'transferred' ? 'TRANSFERIDO(A)' : 'CURSANDO',
            subjects: [],
            status: enr.status,
          });
        }
      }
      results.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
      setGradesByStudent(results);
      setLoadingGrades(false);
    };

    loadAll();
  }, [selClass, allEnrollments.length]);

  const approved = gradesByStudent.filter(s => s.resultado.includes('APROVADO')).length;
  const retained = gradesByStudent.filter(s => s.resultado.includes('RETIDO')).length;
  const transferred = gradesByStudent.filter(s => s.resultado.includes('TRANSFERIDO')).length;
  const cursando = gradesByStudent.filter(s => s.resultado.includes('CURSANDO')).length;

  const buildReportHTML = () => {
    if (!munReport || !cls || !gradesByStudent.length) return '';
    const school = loadSchoolData(cls.schoolId, allSchools);
    const { municipality, secretaria } = munReport;
    const year = new Date().getFullYear();

    const classInfo = `
      <div style="margin-bottom:15px;padding:10px;background:#f0f4f8;border-radius:6px;font-size:11px">
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <span><b>Turma:</b> ${cls.fullName || cls.name}</span>
          <span><b>Turno:</b> ${shiftLabel(cls.shift)}</span>
          <span><b>Escola:</b> ${school?.name || cls.schoolName || '--'}</span>
          <span><b>Ano Letivo:</b> ${year}</span>
          <span><b>Total de Alunos:</b> ${gradesByStudent.length}</span>
        </div>
      </div>
    `;

    let rows = '';
    gradesByStudent.forEach((s, i) => {
      const resClass = s.resultado.includes('APROVADO') ? 'approved' : s.resultado.includes('RETIDO') ? 'failed' : '';
      rows += `<tr>
        <td>${i + 1}</td>
        <td style="text-align:left;font-weight:500">${s.studentName || '--'}</td>
        <td>${s.enrollment || '--'}</td>
        <td style="font-weight:bold">${s.mediaGeral !== null ? s.mediaGeral.toFixed(1) : '--'}</td>
        <td class="${resClass}" style="font-weight:bold">${s.resultado}</td>
      </tr>`;
    });

    const table = `
      <table>
        <thead><tr>
          <th style="width:40px">Nº</th>
          <th style="text-align:left">NOME DO ALUNO</th>
          <th>MATRÍCULA</th>
          <th>MÉDIA GERAL</th>
          <th>RESULTADO FINAL</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:15px;font-size:11px;display:flex;gap:20px;flex-wrap:wrap">
        <span><b>Total:</b> ${gradesByStudent.length} aluno(s)</span>
        <span style="color:#16a34a"><b>Aprovados:</b> ${approved}</span>
        <span style="color:#dc2626"><b>Retidos:</b> ${retained}</span>
        <span style="color:#d97706"><b>Transferidos:</b> ${transferred}</span>
        <span style="color:#6b7280"><b>Cursando:</b> ${cursando}</span>
        <span><b>Taxa de Aprovação:</b> ${gradesByStudent.length > 0 ? ((approved / gradesByStudent.length) * 100).toFixed(1) : 0}%</span>
      </div>
    `;

    const ataText = `
      <div style="margin-top:20px;font-size:11px;line-height:1.8;text-align:justify">
        <p>Aos ______ dias do mês de ________________ de ${year}, reuniram-se nesta Unidade Escolar
        <b>${school?.name || cls.schoolName || '________________________'}</b>, os membros do corpo docente e equipe pedagógica,
        para análise e registro dos resultados finais do ano letivo de <b>${year}</b>, referente à turma
        <b>${cls.fullName || cls.name}</b>, turno <b>${shiftLabel(cls.shift)}</b>.</p>
        <p>Após análise do aproveitamento escolar dos alunos acima relacionados, foram considerados:
        <b>${approved}</b> APROVADO(S), <b>${retained}</b> RETIDO(S), <b>${transferred}</b> TRANSFERIDO(S)
        e <b>${cursando}</b> em situação de CURSANDO.</p>
        <p>Nada mais havendo a tratar, eu, _________________________________, Secretário(a) Escolar,
        lavrei a presente ata que vai assinada por mim e pelos demais presentes.</p>
      </div>
    `;

    return generateReportHTML({
      municipality, secretaria, school,
      title: 'ATA DE RESULTADOS FINAIS',
      subtitle: `${cls.fullName || cls.name} - ${shiftLabel(cls.shift)} - Ano Letivo ${year}`,
      content: classInfo + table + ataText,
      signatories: selectedSigs,
      fontFamily: 'serif',
      fontSize: 11,
    });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!selClass) { alert('Selecione uma turma'); return; }
    if (!gradesByStudent.length) { alert('Nenhum aluno encontrado nesta turma'); return; }
    if (!munReport) { alert('Aguarde o carregamento dos dados'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: 'Ata_Resultados_Finais_' + (cls?.name || '') });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Award size={20} className="text-amber-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Ata de Resultados Finais</h1><p className="text-gray-500">Documento oficial de resultados do ano letivo</p></div>
        </div>
        {gradesByStudent.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select className="input w-80" value={selClass} onChange={e => { setSelClass(e.target.value); }}>
          <option value="">Selecione a turma</option>
          {allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}
        </select>
      </div>

      {selClass && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* KPI Cards */}
      {gradesByStudent.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <div className="card text-center p-4"><p className="text-2xl font-bold text-gray-800">{gradesByStudent.length}</p><p className="text-xs text-gray-500">Total</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-green-600">{approved}</p><p className="text-xs text-gray-500">Aprovados</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-red-600">{retained}</p><p className="text-xs text-gray-500">Retidos</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-yellow-600">{transferred}</p><p className="text-xs text-gray-500">Transferidos</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-emerald-600">{gradesByStudent.length > 0 ? ((approved / gradesByStudent.length) * 100).toFixed(1) : 0}%</p><p className="text-xs text-gray-500">Taxa Aprovação</p></div>
        </div>
      )}

      {/* Loading */}
      {loadingGrades && selClass && (
        <div className="card text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3" /><p className="text-gray-500">Carregando notas dos alunos...</p></div>
      )}

      {/* Table */}
      {!loadingGrades && gradesByStudent.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="bg-amber-600 text-white p-4">
            <h2 className="text-lg font-bold">Ata de Resultados - {cls?.fullName || cls?.name}</h2>
            <p className="text-sm text-white/70">{cls?.schoolName} - {shiftLabel(cls?.shift)}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-12">Nº</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Nome do Aluno</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Matrícula</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Média Geral</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Resultado Final</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gradesByStudent.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-center text-gray-500">{i + 1}</td>
                  <td className="px-5 py-3 font-semibold text-gray-800">{s.studentName}</td>
                  <td className="px-3 py-3 text-center text-gray-500">{s.enrollment || '--'}</td>
                  <td className={`px-3 py-3 text-center font-bold ${s.mediaGeral !== null ? (s.mediaGeral >= 6 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                    {s.mediaGeral !== null ? s.mediaGeral.toFixed(1) : '--'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      s.resultado.includes('APROVADO') ? 'bg-green-100 text-green-700' :
                      s.resultado.includes('RETIDO') ? 'bg-red-100 text-red-700' :
                      s.resultado.includes('TRANSFERIDO') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{s.resultado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loadingGrades && selClass ? (
        <div className="card text-center py-16"><FileText size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum aluno matriculado nesta turma</p></div>
      ) : !selClass ? (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para gerar a Ata de Resultados Finais</p></div>
      ) : null}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Ata de Resultados Finais" />
    </div>
  );
}
