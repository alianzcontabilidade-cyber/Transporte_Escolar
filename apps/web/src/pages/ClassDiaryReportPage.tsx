import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { BookOpen, Download, Printer, Users, Calendar } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, generateReportHTML } from '../lib/reportTemplate';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

function shiftLabel(s: string): string {
  return s === 'morning' ? 'Matutino' : s === 'afternoon' ? 'Vespertino' : s === 'evening' ? 'Noturno' : s === 'full_time' ? 'Integral' : (s || '--');
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function ClassDiaryReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [selMonth, setSelMonth] = useState(String(new Date().getMonth()));
  const [selYear, setSelYear] = useState(String(new Date().getFullYear()));
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [diaryData, setDiaryData] = useState<any[]>([]);
  const [loadingDiary, setLoadingDiary] = useState(false);

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

  // Get days in the selected month
  const month = parseInt(selMonth);
  const year = parseInt(selYear);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const schoolDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month, d).getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) schoolDays.push(d); // Mon-Fri
  }

  // Load attendance for all students in the month
  useEffect(() => {
    if (!selClass || !allEnrollments.length) { setDiaryData([]); return; }
    setLoadingDiary(true);

    const loadAll = async () => {
      const results: any[] = [];
      const sorted = [...allEnrollments].sort((a: any, b: any) => (a.studentName || '').localeCompare(b.studentName || ''));

      for (const enr of sorted) {
        const attendance: Record<number, boolean | null> = {};
        let present = 0, absent = 0;

        // Try to load attendance for each school day
        for (const day of schoolDays) {
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          try {
            const data = await api.diaryAttendance.listByClassDate({ classId: parseInt(selClass), date: dateStr });
            const records = (data as any) || [];
            const studentRecord = records.find((r: any) => r.studentId === enr.studentId);
            if (studentRecord) {
              attendance[day] = studentRecord.present;
              if (studentRecord.present) present++; else absent++;
            } else {
              attendance[day] = null; // no record
            }
          } catch {
            attendance[day] = null;
          }
        }

        results.push({
          studentName: enr.studentName,
          enrollment: enr.enrollment,
          attendance,
          present,
          absent,
          percentage: (present + absent) > 0 ? ((present / (present + absent)) * 100).toFixed(1) : '--',
        });
      }

      setDiaryData(results);
      setLoadingDiary(false);
    };

    loadAll();
  }, [selClass, selMonth, selYear, allEnrollments.length]);

  const buildReportHTML = () => {
    if (!munReport || !cls || !diaryData.length) return '';
    const school = loadSchoolData(cls.schoolId, allSchools);
    const { municipality, secretaria } = munReport;

    const classInfo = `
      <div style="margin-bottom:12px;padding:8px;background:#f0f4f8;border-radius:6px;font-size:10px">
        <b>Turma:</b> ${cls.fullName || cls.name} | <b>Turno:</b> ${shiftLabel(cls.shift)} | <b>Escola:</b> ${school?.name || cls.schoolName || '--'} | <b>Mês:</b> ${MONTH_NAMES[month]}/${year}
      </div>
    `;

    // Build day headers
    const dayHeaders = schoolDays.map(d => `<th style="width:22px;font-size:8px;padding:2px">${d}</th>`).join('');

    let rows = '';
    diaryData.forEach((s, i) => {
      const dayCells = schoolDays.map(d => {
        const val = s.attendance[d];
        if (val === true) return `<td style="text-align:center;font-size:9px;color:#16a34a;padding:2px">P</td>`;
        if (val === false) return `<td style="text-align:center;font-size:9px;color:#dc2626;font-weight:bold;padding:2px">F</td>`;
        return `<td style="text-align:center;font-size:9px;color:#ccc;padding:2px">-</td>`;
      }).join('');

      rows += `<tr>
        <td style="font-size:9px;padding:3px">${i + 1}</td>
        <td style="text-align:left;font-size:9px;font-weight:500;padding:3px;white-space:nowrap">${s.studentName}</td>
        ${dayCells}
        <td style="text-align:center;font-size:9px;color:#16a34a;font-weight:bold;padding:2px">${s.present}</td>
        <td style="text-align:center;font-size:9px;color:#dc2626;font-weight:bold;padding:2px">${s.absent}</td>
        <td style="text-align:center;font-size:9px;font-weight:bold;padding:2px">${s.percentage}%</td>
      </tr>`;
    });

    const table = `
      <table style="width:100%;font-size:9px">
        <thead><tr>
          <th style="width:25px;font-size:8px">Nº</th>
          <th style="text-align:left;min-width:120px;font-size:8px">ALUNO</th>
          ${dayHeaders}
          <th style="width:25px;font-size:8px;background:#dcfce7">P</th>
          <th style="width:25px;font-size:8px;background:#fee2e2">F</th>
          <th style="width:30px;font-size:8px">%</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:10px;font-size:9px;color:#888">
        <b>Legenda:</b> P = Presente | F = Falta | - = Sem registro &nbsp;&nbsp;
        <b>Total de dias letivos:</b> ${schoolDays.length} &nbsp;&nbsp;
        <b>Total de alunos:</b> ${diaryData.length}
      </div>
    `;

    return generateReportHTML({
      municipality, secretaria, school,
      title: 'DIÁRIO DE CLASSE - FREQUÊNCIA',
      subtitle: `${cls.fullName || cls.name} - ${MONTH_NAMES[month]}/${year}`,
      content: classInfo + table,
      signatories: selectedSigs,
      fontFamily: 'sans-serif',
      fontSize: 9,
      orientation: 'landscape',
    });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!selClass) { alert('Selecione uma turma'); return; }
    if (!diaryData.length) { alert('Nenhum dado disponível'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: `Diario_Classe_${MONTH_NAMES[month]}_${year}` });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><BookOpen size={20} className="text-indigo-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Diário de Classe</h1><p className="text-gray-500">Frequência diária por turma e mês</p></div>
        </div>
        {diaryData.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="label">Turma</label>
          <select className="input w-72" value={selClass} onChange={e => setSelClass(e.target.value)}>
            <option value="">Selecione a turma</option>
            {allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Mês</label>
          <select className="input w-40" value={selMonth} onChange={e => setSelMonth(e.target.value)}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ano</label>
          <select className="input w-24" value={selYear} onChange={e => setSelYear(e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {selClass && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* Loading */}
      {loadingDiary && selClass && (
        <div className="card text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-3" /><p className="text-gray-500">Carregando frequência do mês...</p></div>
      )}

      {/* Table */}
      {!loadingDiary && diaryData.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <div className="bg-indigo-600 text-white p-4">
            <h2 className="text-lg font-bold">Diário de Classe - {cls?.fullName || cls?.name}</h2>
            <p className="text-sm text-white/70">{cls?.schoolName} | {MONTH_NAMES[month]}/{year} | {schoolDays.length} dias letivos</p>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-2 py-2 text-[10px] font-semibold text-gray-500 w-8">Nº</th>
                <th className="px-2 py-2 text-[10px] font-semibold text-gray-500 text-left min-w-[140px]">Aluno</th>
                {schoolDays.map(d => (
                  <th key={d} className="px-1 py-2 text-[10px] font-semibold text-gray-400 w-6">{d}</th>
                ))}
                <th className="px-2 py-2 text-[10px] font-semibold text-green-600 bg-green-50">P</th>
                <th className="px-2 py-2 text-[10px] font-semibold text-red-600 bg-red-50">F</th>
                <th className="px-2 py-2 text-[10px] font-semibold text-gray-600">%</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {diaryData.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 text-center text-gray-400">{i + 1}</td>
                  <td className="px-2 py-1.5 font-medium text-gray-800 whitespace-nowrap">{s.studentName}</td>
                  {schoolDays.map(d => {
                    const val = s.attendance[d];
                    return (
                      <td key={d} className="px-1 py-1.5 text-center">
                        {val === true ? <span className="text-green-600 font-bold">P</span> :
                         val === false ? <span className="text-red-600 font-bold">F</span> :
                         <span className="text-gray-300">-</span>}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-center font-bold text-green-600 bg-green-50/50">{s.present}</td>
                  <td className="px-2 py-1.5 text-center font-bold text-red-600 bg-red-50/50">{s.absent}</td>
                  <td className="px-2 py-1.5 text-center font-bold">{s.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loadingDiary && selClass ? (
        <div className="card text-center py-16"><Calendar size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum registro de frequência para este mês</p></div>
      ) : !selClass ? (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para ver o diário de classe</p></div>
      ) : null}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Diário de Classe" />
    </div>
  );
}
