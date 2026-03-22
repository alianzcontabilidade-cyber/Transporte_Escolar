import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Download, Printer, Users, BookOpen } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, generateReportHTML } from '../lib/reportTemplate';
import { Signatory } from '../components/ReportSignatureSelector';
import ReportSignatureSelector from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function formatDate(d: string | Date | undefined): string {
  if (!d) return '--';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
}

function shiftLabel(s: string): string {
  return s === 'morning' ? 'Matutino' : s === 'afternoon' ? 'Vespertino' : s === 'evening' ? 'Noturno' : (s || '--');
}

// BNCC Competências Gerais
const BNCC_COMPETENCIAS = [
  { code: 'CG1', name: 'Conhecimento', desc: 'Valorizar e utilizar os conhecimentos historicamente construídos' },
  { code: 'CG2', name: 'Pensamento Científico', desc: 'Exercitar a curiosidade intelectual e utilizar ciências com criticidade' },
  { code: 'CG3', name: 'Repertório Cultural', desc: 'Valorizar as diversas manifestações artísticas e culturais' },
  { code: 'CG4', name: 'Comunicação', desc: 'Utilizar diferentes linguagens para se expressar e partilhar informações' },
  { code: 'CG5', name: 'Cultura Digital', desc: 'Compreender, utilizar e criar tecnologias digitais de forma crítica' },
  { code: 'CG6', name: 'Trabalho e Projeto de Vida', desc: 'Valorizar a diversidade de saberes e vivências culturais' },
  { code: 'CG7', name: 'Argumentação', desc: 'Argumentar com base em fatos, dados e informações confiáveis' },
  { code: 'CG8', name: 'Autoconhecimento', desc: 'Conhecer-se, apreciar-se e cuidar de sua saúde física e emocional' },
  { code: 'CG9', name: 'Empatia e Cooperação', desc: 'Exercitar a empatia, o diálogo, a resolução de conflitos' },
  { code: 'CG10', name: 'Responsabilidade e Cidadania', desc: 'Agir pessoal e coletivamente com autonomia e responsabilidade' },
];

export default function IndividualReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [selBimester, setSelBimester] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [competencias, setCompetencias] = useState<Record<string, string>>({});

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: reportData } = useQuery(() => selClass && selStudent ? api.studentGrades.reportCard({ classId: parseInt(selClass), studentId: parseInt(selStudent) }) : Promise.resolve([]), [selClass, selStudent]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: descriptiveData } = useQuery(() => selClass && selStudent ? api.descriptiveReports.list({ classId: parseInt(selClass), studentId: parseInt(selStudent) }) : Promise.resolve([]), [selClass, selStudent]);
  const { data: attendanceRaw } = useQuery(() => selClass && selStudent ? api.diaryAttendance.studentSummary({ classId: parseInt(selClass), startDate: `${new Date().getFullYear()}-01-01`, endDate: `${new Date().getFullYear()}-12-31` }) : Promise.resolve(null), [selClass, selStudent]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const report = (reportData as any) || [];
  const allSchools = (schoolsData as any) || [];
  const descriptives = (descriptiveData as any) || [];
  const attendance = Array.isArray(attendanceRaw) ? (attendanceRaw as any[]).find((a: any) => String(a.studentId) === selStudent) || null : attendanceRaw as any;

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const student = allEnrollments.find((e: any) => String(e.studentId) === selStudent);
  const cls = allClasses.find((c: any) => String(c.id) === selClass);

  const calcAvg = (bimesters: any, bim: string) => {
    const grades = bimesters[bim] || [];
    if (!grades.length) return null;
    const scores = grades.filter((g: any) => g.score !== null).map((g: any) => g.score);
    return scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null;
  };

  const buildReportHTML = () => {
    if (!student || !munReport) return '';
    const school = loadSchoolData(cls?.schoolId, allSchools);
    const { municipality, secretaria } = munReport;
    const year = new Date().getFullYear();

    // Student info
    const studentInfo = `
      <div class="section-title">IDENTIFICAÇÃO DO ALUNO</div>
      <div class="field-grid">
        <div class="field-row"><span class="field-label">Nome</span><span class="field-value">${student.studentName || '--'}</span></div>
        <div class="field-row"><span class="field-label">Matrícula</span><span class="field-value">${student.enrollment || '--'}</span></div>
        <div class="field-row"><span class="field-label">Nascimento</span><span class="field-value">${formatDate(student.birthDate)}</span></div>
        <div class="field-row"><span class="field-label">Série/Ano</span><span class="field-value">${cls?.fullName || cls?.grade || '--'}</span></div>
        <div class="field-row"><span class="field-label">Turma</span><span class="field-value">${cls?.name || '--'}</span></div>
        <div class="field-row"><span class="field-label">Turno</span><span class="field-value">${shiftLabel(cls?.shift)}</span></div>
        <div class="field-row"><span class="field-label">Escola</span><span class="field-value">${school?.name || cls?.schoolName || '--'}</span></div>
        <div class="field-row"><span class="field-label">Ano Letivo</span><span class="field-value">${year}</span></div>
      </div>
    `;

    // Grades table
    let gradesRows = '';
    let sumMD = 0, countMD = 0;
    for (const r of report) {
      const avgs = ['1','2','3','4'].map(b => calcAvg(r.bimesters, b));
      const validAvgs = avgs.filter((a): a is number => a !== null);
      const finalAvg = validAvgs.length ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : null;
      if (finalAvg !== null) { sumMD += finalAvg; countMD++; }
      const situacao = finalAvg !== null ? (finalAvg >= 6 ? 'Aprovado' : 'Reprovado') : '--';

      gradesRows += `<tr>
        <td style="text-align:left;font-weight:500">${r.subjectName}</td>
        ${avgs.map(a => `<td>${a !== null ? a.toFixed(1) : '--'}</td>`).join('')}
        <td style="font-weight:bold;background:#f0f4f8">${finalAvg !== null ? finalAvg.toFixed(1) : '--'}</td>
        <td class="${situacao === 'Aprovado' ? 'approved' : situacao === 'Reprovado' ? 'failed' : ''}">${situacao}</td>
      </tr>`;
    }

    const mediaGeral = countMD > 0 ? (sumMD / countMD).toFixed(1) : '--';

    const gradesTable = report.length > 0 ? `
      <div class="section-title">DESEMPENHO ACADÊMICO</div>
      <table class="grade-table">
        <thead><tr>
          <th style="text-align:left;min-width:150px">COMPONENTE CURRICULAR</th>
          <th>1º BIM</th><th>2º BIM</th><th>3º BIM</th><th>4º BIM</th>
          <th style="background:#15304d">MÉDIA</th>
          <th>SITUAÇÃO</th>
        </tr></thead>
        <tbody>${gradesRows}</tbody>
        <tfoot><tr class="total-row">
          <td style="text-align:right" colspan="5"><b>MÉDIA GERAL</b></td>
          <td style="font-weight:bold;background:#e0f2fe">${mediaGeral}</td>
          <td></td>
        </tr></tfoot>
      </table>
    ` : '';

    // Attendance
    const attendanceSection = attendance ? `
      <div class="section-title">FREQUÊNCIA ESCOLAR</div>
      <table>
        <thead><tr><th>Total de Aulas</th><th>Presenças</th><th>Faltas</th><th>Frequência (%)</th></tr></thead>
        <tbody><tr>
          <td>${attendance.totalDays || attendance.total || '--'}</td>
          <td style="color:#16a34a;font-weight:bold">${attendance.presentDays || attendance.present || '--'}</td>
          <td style="color:#dc2626;font-weight:bold">${attendance.absentDays || attendance.absent || '--'}</td>
          <td style="font-weight:bold">${attendance.percentage !== undefined ? attendance.percentage.toFixed(1) + '%' : (attendance.totalDays ? ((attendance.presentDays / attendance.totalDays) * 100).toFixed(1) + '%' : '--')}</td>
        </tr></tbody>
      </table>
    ` : '';

    // Descriptive assessments
    const bimesters = selBimester === 'all' ? ['1','2','3','4'] : [selBimester];
    let descriptiveSection = '';
    const relevantDescriptives = descriptives.filter((d: any) =>
      selBimester === 'all' || String(d.bimester) === selBimester
    );
    if (relevantDescriptives.length > 0) {
      descriptiveSection = `<div class="section-title">PARECER DESCRITIVO</div>`;
      for (const d of relevantDescriptives) {
        descriptiveSection += `
          <div style="margin-bottom:12px;padding:10px;background:#f8fafc;border-left:3px solid #6366f1;border-radius:4px">
            <p style="font-weight:bold;color:#4f46e5;margin-bottom:4px;font-size:11px">${d.bimester}º Bimestre${d.teacherName ? ' - Prof(a). ' + d.teacherName : ''}</p>
            <p style="font-size:11px;line-height:1.6;color:#374151">${d.content || 'Sem parecer registrado.'}</p>
          </div>`;
      }
    }

    // BNCC Competencies
    let competenciasSection = `
      <div class="section-title">COMPETÊNCIAS GERAIS DA BNCC</div>
      <table>
        <thead><tr><th style="width:40px">Nº</th><th style="text-align:left">COMPETÊNCIA</th><th style="width:100px">AVALIAÇÃO</th></tr></thead>
        <tbody>
    `;
    for (const comp of BNCC_COMPETENCIAS) {
      const avaliacao = competencias[comp.code] || 'S';
      const label = avaliacao === 'PS' ? 'Plenamente Satisfatório' :
                    avaliacao === 'S' ? 'Satisfatório' :
                    avaliacao === 'EP' ? 'Em Progresso' :
                    avaliacao === 'NS' ? 'Não Satisfatório' : avaliacao;
      const color = avaliacao === 'PS' ? '#16a34a' : avaliacao === 'S' ? '#2563eb' : avaliacao === 'EP' ? '#d97706' : '#dc2626';
      competenciasSection += `<tr>
        <td style="font-weight:bold">${comp.code.replace('CG','')}</td>
        <td style="text-align:left"><b>${comp.name}</b><br><span style="font-size:9px;color:#666">${comp.desc}</span></td>
        <td style="color:${color};font-weight:bold;font-size:10px">${label}</td>
      </tr>`;
    }
    competenciasSection += `</tbody></table>
      <div style="margin-top:8px;font-size:9px;color:#888">
        <b>Legenda:</b> PS = Plenamente Satisfatório | S = Satisfatório | EP = Em Progresso | NS = Não Satisfatório
      </div>`;

    // Observations
    const observations = `
      <div class="section-title">OBSERVAÇÕES</div>
      <div style="min-height:60px;border:1px solid #e5e7eb;border-radius:6px;padding:12px;font-size:11px;color:#666">
        ${report.length === 0 ? 'Nenhuma nota lançada para este aluno no período selecionado.' : ''}
      </div>
    `;

    const content = studentInfo + gradesTable + attendanceSection + descriptiveSection + competenciasSection + observations;

    return generateReportHTML({
      municipality, secretaria, school,
      title: 'RELATÓRIO INDIVIDUAL DO ALUNO',
      subtitle: `Conforme Base Nacional Comum Curricular (BNCC) - Ano Letivo ${year}`,
      content,
      signatories: selectedSigs,
      fontFamily: 'sans-serif',
      fontSize: 11,
    });
  };

  const handlePrint = () => {
    const html = buildReportHTML();
    if (html) printReportHTML(html);
  };

  const handleExportClick = () => {
    if (!selStudent) { alert('Selecione um aluno para gerar o relatório'); return; }
    if (!munReport) { alert('Aguarde o carregamento dos dados do município'); return; }
    const html = buildReportHTML();
    if (!html) { alert('Erro ao gerar o relatório.'); return; }
    setPgExportModal({ html, filename: 'Relatorio_Individual_' + (student?.studentName || 'aluno') });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><BookOpen size={20} className="text-purple-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Relatório Individual do Aluno</h1><p className="text-gray-500">Conforme BNCC - Base Nacional Comum Curricular</p></div>
        </div>
        {selStudent && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select className="input w-64" value={selClass} onChange={e => { setSelClass(e.target.value); setSelStudent(''); }}>
          <option value="">Selecione a turma</option>
          {allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}
        </select>
        <select className="input w-64" value={selStudent} onChange={e => setSelStudent(e.target.value)} disabled={!selClass}>
          <option value="">Selecione o aluno</option>
          {allEnrollments.map((e: any) => <option key={e.studentId} value={e.studentId}>{e.studentName}</option>)}
        </select>
        <select className="input w-48" value={selBimester} onChange={e => setSelBimester(e.target.value)}>
          <option value="all">Todos os Bimestres</option>
          <option value="1">1º Bimestre</option>
          <option value="2">2º Bimestre</option>
          <option value="3">3º Bimestre</option>
          <option value="4">4º Bimestre</option>
        </select>
      </div>

      {selStudent && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* BNCC Competencies Editor */}
      {selStudent && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><BookOpen size={16} /> Competências BNCC (avaliação)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {BNCC_COMPETENCIAS.map(comp => (
              <div key={comp.code} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-bold text-purple-600 w-8">{comp.code.replace('CG','')}</span>
                <span className="text-xs text-gray-700 flex-1">{comp.name}</span>
                <select className="input text-xs py-1 px-2 w-28" value={competencias[comp.code] || 'S'}
                  onChange={e => setCompetencias(prev => ({ ...prev, [comp.code]: e.target.value }))}>
                  <option value="PS">Plen. Satisf.</option>
                  <option value="S">Satisfatório</option>
                  <option value="EP">Em Progresso</option>
                  <option value="NS">Não Satisf.</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {selStudent && report.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="bg-purple-600 text-white p-4">
            <h2 className="text-lg font-bold">Relatório Individual - {student?.studentName}</h2>
            <p className="text-sm text-white/70">{cls?.fullName || cls?.name} - {cls?.schoolName}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Componente Curricular</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">1º Bim</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">2º Bim</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">3º Bim</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">4º Bim</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Média</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.map((r: any) => {
                const avgs = ['1','2','3','4'].map(b => calcAvg(r.bimesters, b));
                const validAvgs = avgs.filter((a): a is number => a !== null);
                const finalAvg = validAvgs.length ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : null;
                return (
                  <tr key={r.subjectId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-800">{r.subjectName}</td>
                    {avgs.map((avg, i) => (
                      <td key={i} className={`px-3 py-3 text-center font-medium ${avg !== null ? (avg >= 6 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                        {avg !== null ? avg.toFixed(1) : '--'}
                      </td>
                    ))}
                    <td className={`px-3 py-3 text-center font-bold text-lg ${finalAvg !== null ? (finalAvg >= 6 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                      {finalAvg !== null ? finalAvg.toFixed(1) : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Attendance summary */}
          {attendance && (
            <div className="px-5 py-3 border-t bg-gray-50">
              <div className="flex gap-6 text-sm">
                <span className="text-gray-600">Presenças: <b className="text-green-600">{attendance.presentDays || attendance.present || 0}</b></span>
                <span className="text-gray-600">Faltas: <b className="text-red-600">{attendance.absentDays || attendance.absent || 0}</b></span>
                <span className="text-gray-600">Frequência: <b>{attendance.percentage !== undefined ? attendance.percentage.toFixed(1) + '%' : '--'}</b></span>
              </div>
            </div>
          )}

          {/* Descriptive reports */}
          {descriptives.length > 0 && (
            <div className="px-5 py-4 border-t">
              <h3 className="font-semibold text-gray-800 mb-2">Parecer Descritivo</h3>
              {descriptives.filter((d: any) => selBimester === 'all' || String(d.bimester) === selBimester).map((d: any, i: number) => (
                <div key={i} className="mb-2 p-3 bg-purple-50 rounded-lg border-l-3 border-purple-400">
                  <p className="text-xs font-bold text-purple-700 mb-1">{d.bimester}º Bimestre{d.teacherName ? ` - Prof(a). ${d.teacherName}` : ''}</p>
                  <p className="text-sm text-gray-700">{d.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : selStudent ? (
        <div className="card text-center py-16"><FileText size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma nota lançada para este aluno</p></div>
      ) : (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma e um aluno para gerar o relatório individual</p></div>
      )}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Relatório Individual" />
    </div>
  );
}
