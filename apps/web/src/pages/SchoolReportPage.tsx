import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { School, Printer, Users, GraduationCap, Bus, Download } from 'lucide-react';
import ReportExportBar from '../components/ReportExportBar';
import { loadMunicipalityData } from '../lib/reportTemplate';

export default function SchoolReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('');
  const [municipalityName, setMunicipalityName] = useState('');

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(({ municipality }) => {
      setMunicipalityName(municipality.name || '');
    }).catch(() => {});
  }, [mid]);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid, schoolId: selSchool ? parseInt(selSchool) : undefined }), [mid, selSchool]);
  const { data: teachersData } = useQuery(() => api.teachers.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allStudents = ((studentsData as any) || []).filter((s: any) => !selSchool || String(s.schoolId) === selSchool);
  const allClasses = (classesData as any) || [];
  const allTeachers = ((teachersData as any) || []).map((t: any) => t.user ? { name: t.user.name, ...t.teacher } : t);

  const school = allSchools.find((s: any) => String(s.id) === selSchool);
  const shiftLabel = (s: string) => s === 'afternoon' ? 'Tarde' : s === 'evening' ? 'Noite' : 'Manhã';

  const printReport = () => {
    if (!school) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório - ${school.name}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    h2{color:#1B3A5C;font-size:16px;margin-top:25px;border-bottom:1px solid #ddd;padding-bottom:5px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:15px 0}
    .stat{padding:15px;background:#f8f9fa;border-radius:8px;text-align:center}
    .stat-value{font-size:24px;font-weight:bold;color:#1B3A5C}
    .stat-label{font-size:11px;color:#666;margin-top:4px}
    table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
    th{background:#1B3A5C;color:white;padding:8px;text-align:left}td{padding:6px 8px;border:1px solid #ddd}
    tr:nth-child(even){background:#f8f9fa}
    .footer{margin-top:30px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>${school.name}</h1>
    <p style="color:#666;font-size:13px">${school.address || ''} | ${school.phone || ''} | ${school.email || ''}</p>
    <p style="color:#666;font-size:13px">Diretor(a): ${school.directorName || '--'} | Código INEP: ${school.code || '--'} | Tipo: ${school.type || '--'}</p>
    <div class="stats">
      <div class="stat"><div class="stat-value">${allStudents.length}</div><div class="stat-label">Alunos</div></div>
      <div class="stat"><div class="stat-value">${allClasses.length}</div><div class="stat-label">Turmas</div></div>
      <div class="stat"><div class="stat-value">${allTeachers.length}</div><div class="stat-label">Professores</div></div>
      <div class="stat"><div class="stat-value">${school.morningStart || '--'} - ${school.morningEnd || '--'}</div><div class="stat-label">Horário Manhã</div></div>
    </div>
    <h2>Alunos Matriculados (${allStudents.length})</h2>
    <table><thead><tr><th>Nº</th><th>Nome</th><th>Matrícula</th><th>Série</th><th>Turma</th><th>Turno</th></tr></thead>
    <tbody>${allStudents.map((s: any, i: number) => '<tr><td>'+(i+1)+'</td><td>'+s.name+'</td><td>'+(s.enrollment||'--')+'</td><td>'+(s.grade||'--')+'</td><td>'+(s.classRoom||'--')+'</td><td>'+(s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manhã')+'</td></tr>').join('')}</tbody></table>
    ${allClasses.length > 0 ? '<h2>Turmas ('+allClasses.length+')</h2><table><thead><tr><th>Turma</th><th>Série</th><th>Turno</th><th>Alunos</th><th>Máximo</th></tr></thead><tbody>'+allClasses.map((c: any) => '<tr><td>'+(c.fullName||c.name)+'</td><td>'+(c.gradeName||'--')+'</td><td>'+(c.shift === 'afternoon' ? 'Tarde' : c.shift === 'evening' ? 'Noite' : 'Manhã')+'</td><td>'+(c.enrolledStudents||0)+'</td><td>'+(c.maxStudents||30)+'</td></tr>').join('')+'</tbody></table>' : ''}
    <div class="footer">Relatório gerado por NetEscol em ${new Date().toLocaleString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><School size={20} className="text-blue-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Relatório por Escola</h1><p className="text-gray-500">Visão completa de uma unidade escolar</p></div></div>
        {school && <button onClick={printReport} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir Relatório</button>}
      </div>

      <select className="input w-72 mb-5" value={selSchool} onChange={e => setSelSchool(e.target.value)}><option value="">Selecione a escola</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>

      {school ? (
        <div>
          <div className="card mb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h2 className="text-xl font-bold">{school.name}</h2>
            <p className="text-blue-200 mt-1">{school.address || ''} {school.directorName ? '· Diretor(a): ' + school.directorName : ''}</p>
          </div>

          <ReportExportBar title={`Relatório - ${school.name}`} subtitle={school.address || ''} municipality={municipalityName} school={school.name}
            fullData={allStudents.map((s: any) => ({ nome: s.name, matricula: s.enrollment||'', serie: s.grade||'', turma: s.classRoom||'', turno: s.shift==='afternoon'?'Tarde':s.shift==='evening'?'Noite':'Manhã' }))}
            fullDataColumns={[{key:'nome',label:'Nome'},{key:'matricula',label:'Matrícula'},{key:'serie',label:'Série'},{key:'turma',label:'Turma'},{key:'turno',label:'Turno'}]}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center bg-indigo-50 border-0"><Users size={22} className="text-indigo-500 mx-auto mb-1" /><p className="text-2xl font-bold">{allStudents.length}</p><p className="text-xs text-gray-500">Alunos</p></div>
            <div className="card text-center bg-violet-50 border-0"><GraduationCap size={22} className="text-violet-500 mx-auto mb-1" /><p className="text-2xl font-bold">{allClasses.length}</p><p className="text-xs text-gray-500">Turmas</p></div>
            <div className="card text-center bg-cyan-50 border-0"><Users size={22} className="text-cyan-500 mx-auto mb-1" /><p className="text-2xl font-bold">{allTeachers.length}</p><p className="text-xs text-gray-500">Professores</p></div>
            <div className="card text-center bg-orange-50 border-0"><Bus size={22} className="text-orange-500 mx-auto mb-1" /><p className="text-2xl font-bold">{school.morningStart || '--'}</p><p className="text-xs text-gray-500">Início manhã</p></div>
          </div>

          {allClasses.length > 0 && (
            <div className="card mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Turmas ({allClasses.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{allClasses.map((c: any) => (
                <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="font-medium text-sm">{c.fullName || c.name}</p><p className="text-xs text-gray-500">{shiftLabel(c.shift)} · {c.enrolledStudents || 0}/{c.maxStudents || 30} alunos</p></div>
              ))}</div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Alunos ({allStudents.length})</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm"><thead className="bg-gray-50 sticky top-0"><tr>{['Nome','Matrícula','Série','Turno'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y">{allStudents.slice(0, 100).map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">{s.name}</td><td className="px-4 py-2 text-gray-500">{s.enrollment || '--'}</td><td className="px-4 py-2 text-gray-500">{s.grade || '--'}</td><td className="px-4 py-2 text-gray-500">{shiftLabel(s.shift)}</td></tr>
              ))}</tbody></table>
            </div>
          </div>
          </ReportExportBar>
        </div>
      ) : (
        <div className="card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma escola para ver o relatório</p></div>
      )}
    </div>
  );
}
