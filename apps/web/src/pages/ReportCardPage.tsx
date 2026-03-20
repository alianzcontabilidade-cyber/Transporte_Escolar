import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Printer, Search, Download, Users } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, openReportAsPDF } from '../lib/reportTemplate';
import { generateBoletimEscolar } from '../lib/reportGenerators';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

export default function ReportCardPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: reportData } = useQuery(() => selClass && selStudent ? api.studentGrades.reportCard({ classId: parseInt(selClass), studentId: parseInt(selStudent) }) : Promise.resolve([]), [selClass, selStudent]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const report = (reportData as any) || [];
  const allSchools = (schoolsData as any) || [];

  // Load municipality data for report header
  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const buildReportHTML = () => {
    const student = allEnrollments.find((e: any) => String(e.studentId) === selStudent);
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    if (!student || !munReport) return '';
    const school = loadSchoolData(cls?.schoolId, allSchools);
    const { municipality, secretaria } = munReport;

    // Transform report data into the format expected by generateBoletimEscolar
    const grades = report.map((r: any) => {
      const bimAvg = (bim: string) => {
        const gs = r.bimesters[bim] || [];
        if (!gs.length) return null;
        const scores = gs.filter((g: any) => g.score !== null).map((g: any) => g.score);
        return scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;
      };
      return {
        subject: r.subjectName,
        b1: bimAvg('1'),
        b2: bimAvg('2'),
        b3: bimAvg('3'),
        b4: bimAvg('4'),
      };
    });

    const studentData = {
      name: student.studentName,
      enrollment: student.enrollment,
      grade: cls?.fullName || cls?.name,
      classRoom: cls?.name,
      shift: cls?.shift,
      birthDate: student.birthDate,
    };

    return generateBoletimEscolar(studentData, grades, school, municipality, secretaria, selectedSigs, new Date().getFullYear());
  };

  const printReport = async () => {
    const html = buildReportHTML();
    if (!html) return;
    const student = allEnrollments.find((e: any) => String(e.studentId) === selStudent);
    await openReportAsPDF(html, 'Boletim_' + (student?.studentName || 'aluno'));
  };

  const printReportDirect = () => {
    const html = buildReportHTML();
    if (html) printReportHTML(html);
  };

  const calcAvg = (bimesters: any, bim: string) => {
    const grades = bimesters[bim] || [];
    if (!grades.length) return null;
    const scores = grades.filter((g: any) => g.score !== null).map((g: any) => g.score);
    return scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><FileText size={20} className="text-indigo-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Boletim Escolar</h1><p className="text-gray-500">Consulta e impressão de boletins</p></div></div>
        {report.length > 0 && <div className="flex items-center gap-2"><button onClick={printReport} className="btn-primary flex items-center gap-2"><Download size={16} /> Gerar PDF</button><button onClick={printReportDirect} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button></div>}
      </div>

      <div className="flex gap-3 mb-6">
        <select className="input w-64" value={selClass} onChange={e => { setSelClass(e.target.value); setSelStudent(''); }}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>
        <select className="input w-64" value={selStudent} onChange={e => setSelStudent(e.target.value)} disabled={!selClass}><option value="">Selecione o aluno</option>{allEnrollments.map((e: any) => <option key={e.studentId} value={e.studentId}>{e.studentName}</option>)}</select>
      </div>

      {report.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {report.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <div className="bg-primary-500 text-white p-4">
            <h2 className="text-lg font-bold">Boletim - {allEnrollments.find((e: any) => String(e.studentId) === selStudent)?.studentName}</h2>
            <p className="text-sm text-white/70">{allClasses.find((c: any) => String(c.id) === selClass)?.fullName} - {allClasses.find((c: any) => String(c.id) === selClass)?.schoolName}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Disciplina</th><th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">1° Bim</th><th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">2° Bim</th><th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">3° Bim</th><th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">4° Bim</th><th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Média Final</th></tr></thead>
            <tbody className="divide-y">{report.map((r: any) => {
              const avgs = ['1','2','3','4'].map(b => calcAvg(r.bimesters, b));
              const validAvgs = avgs.filter((a): a is number => a !== null);
              const finalAvg = validAvgs.length ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : null;
              return (
                <tr key={r.subjectId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-gray-800">{r.subjectName}</td>
                  {avgs.map((avg, i) => (
                    <td key={i} className={`px-3 py-3 text-center font-medium ${avg !== null ? (avg >= 6 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>{avg !== null ? avg.toFixed(1) : '—'}</td>
                  ))}
                  <td className={`px-3 py-3 text-center font-bold text-lg ${finalAvg !== null ? (finalAvg >= 6 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>{finalAvg !== null ? finalAvg.toFixed(1) : '—'}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ) : selStudent ? (
        <div className="card text-center py-16"><FileText size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma nota lançada para este aluno</p></div>
      ) : (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma e um aluno para ver o boletim</p></div>
      )}
    </div>
  );
}
