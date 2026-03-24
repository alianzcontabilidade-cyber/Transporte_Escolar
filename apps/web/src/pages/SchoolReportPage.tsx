import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { School, Printer, Users, GraduationCap, Bus, Download } from 'lucide-react';

import { loadMunicipalityData } from '../lib/reportTemplate';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

export default function SchoolReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [municipalityName, setMunicipalityName] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(({ municipality }) => {
      setMunicipalityName(municipality.name || '');
    }).catch(() => {});
    getMunicipalityReport(mid, api).then(setMunReport).catch(() => {});
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
  const shiftLabel = (s: string) => s === 'afternoon' ? 'Tarde' : s === 'evening' ? 'Noite' : s === 'full_time' ? 'Integral' : 'Manhã';

  const buildExportHTML = (): string => {
    const schoolName = school?.name || 'Escola';
    const rows = allStudents.map((s: any, i: number) => ({
      num: i + 1,
      nome: s.name || '--',
      matricula: s.enrollment || '--',
      serie: s.grade || '--',
      turma: s.classRoom || '--',
      turno: s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manha',
    }));
    const cols = ['N', 'Nome', 'Matricula', 'Serie', 'Turma', 'Turno'];
    return buildTableReportHTML('RELATORIO POR ESCOLA - ' + schoolName, rows, cols, munReport, {
      subtitle: schoolName,
      orientation: 'landscape',
      signatories: selectedSigs,
    });
  };

  const printReport = () => {
    const html = buildExportHTML();
    if (!html) { showInfoToast('Nenhum dado para imprimir'); return; }
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const handleExportClick = () => {
    const html = buildExportHTML();
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'relatorio_escola' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><School size={20} className="text-blue-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Relatório por Escola</h1><p className="text-gray-500">Visão completa de uma unidade escolar</p></div></div>
        {school && <><button onClick={printReport} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button></>}
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <select className="input w-72 mb-5" value={selSchool} onChange={e => setSelSchool(e.target.value)}><option value="">Selecione a escola</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>

      {school ? (
        <div>
          <div className="card mb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h2 className="text-xl font-bold">{school.name}</h2>
            <p className="text-blue-200 mt-1">{school.address || ''} {school.directorName ? '· Diretor(a): ' + school.directorName : ''}</p>
          </div>

          <>
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
          </>
        </div>
      ) : (
        <div className="card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma escola para ver o relatório</p></div>
      )}
    
      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
