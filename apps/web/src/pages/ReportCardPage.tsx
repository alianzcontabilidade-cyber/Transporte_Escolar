import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Printer, Search, Download, Users } from 'lucide-react';

export default function ReportCardPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [selStudent, setSelStudent] = useState('');

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: reportData } = useQuery(() => selClass && selStudent ? api.studentGrades.reportCard({ classId: parseInt(selClass), studentId: parseInt(selStudent) }) : Promise.resolve([]), [selClass, selStudent]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const report = (reportData as any) || [];

  const printReport = () => {
    const student = allEnrollments.find((e: any) => String(e.studentId) === selStudent);
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Boletim - ${student?.studentName || ''}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333;max-width:800px;margin:0 auto}
    h1{color:#1B3A5C;text-align:center;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    .info{display:flex;justify-content:space-between;margin:15px 0;font-size:14px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th{background:#1B3A5C;color:white;padding:10px;text-align:center;font-size:13px}
    td{padding:8px 10px;border:1px solid #ddd;text-align:center;font-size:13px}
    tr:nth-child(even){background:#f8f9fa}
    .subject{text-align:left;font-weight:600}
    .footer{margin-top:30px;text-align:center;font-size:11px;color:#999}
    .avg{font-weight:bold;color:#1B3A5C}
    @media print{body{padding:15px}}</style></head><body>
    <h1>BOLETIM ESCOLAR</h1>
    <div class="info"><span><b>Aluno:</b> ${student?.studentName || '—'}</span><span><b>Turma:</b> ${cls?.fullName || cls?.name || '—'}</span></div>
    <div class="info"><span><b>Escola:</b> ${cls?.schoolName || '—'}</span><span><b>Ano Letivo:</b> ${new Date().getFullYear()}</span></div>
    <table><thead><tr><th>Disciplina</th><th>1° Bim</th><th>2° Bim</th><th>3° Bim</th><th>4° Bim</th><th>Média</th></tr></thead>
    <tbody>${report.map((r: any) => {
      const avg = (bim: string) => {
        const grades = r.bimesters[bim] || [];
        if (!grades.length) return '—';
        const scores = grades.filter((g: any) => g.score !== null).map((g: any) => g.score);
        return scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : '—';
      };
      const allAvgs = ['1','2','3','4'].map(b => parseFloat(avg(b))).filter(n => !isNaN(n));
      const finalAvg = allAvgs.length ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(1) : '—';
      return '<tr><td class="subject">' + r.subjectName + '</td><td>' + avg('1') + '</td><td>' + avg('2') + '</td><td>' + avg('3') + '</td><td>' + avg('4') + '</td><td class="avg">' + finalAvg + '</td></tr>';
    }).join('')}</tbody></table>
    <div class="footer"><p>Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</p></div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
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
        {report.length > 0 && <button onClick={printReport} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir Boletim</button>}
      </div>

      <div className="flex gap-3 mb-6">
        <select className="input w-64" value={selClass} onChange={e => { setSelClass(e.target.value); setSelStudent(''); }}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>
        <select className="input w-64" value={selStudent} onChange={e => setSelStudent(e.target.value)} disabled={!selClass}><option value="">Selecione o aluno</option>{allEnrollments.map((e: any) => <option key={e.studentId} value={e.studentId}>{e.studentName}</option>)}</select>
      </div>

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
