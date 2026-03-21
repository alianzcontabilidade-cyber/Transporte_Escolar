import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Users, Search, Printer, GraduationCap, School, Download } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML } from '../lib/reportTemplate';
import { generateRelacaoAlunosTurma } from '../lib/reportGenerators';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';

const SHIFTS: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' };

export default function ClassRosterPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [selClass, setSelClass] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: classesData } = useQuery(() => api.classes?.list?.({ municipalityId: mid, schoolId: selSchool ? parseInt(selSchool) : undefined }) || Promise.resolve([]), [mid, selSchool]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => api.enrollments?.list?.({ municipalityId: mid }) || Promise.resolve([]), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allClasses = (classesData as any) || [];
  const allStudents = (studentsData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  // Get students for selected class
  const getClassStudents = () => {
    if (!selClass) return [];
    const classId = parseInt(selClass);
    // Try from enrollments first
    const enrolledStudentIds = allEnrollments
      .filter((e: any) => e.classId === classId)
      .map((e: any) => e.studentId);

    if (enrolledStudentIds.length > 0) {
      return allStudents.filter((s: any) => enrolledStudentIds.includes(s.id));
    }

    // Fallback: filter by school + grade/className matching
    const cls = allClasses.find((c: any) => c.id === classId);
    if (!cls) return [];
    return allStudents.filter((s: any) => {
      if (cls.schoolId && s.schoolId !== cls.schoolId) return false;
      return true;
    });
  };

  const selectedClass = allClasses.find((c: any) => c.id === parseInt(selClass));
  const classStudents = getClassStudents();

  const buildHTML = () => {
    if (!selectedClass || !munReport) return '';
    const school = loadSchoolData(selectedClass.schoolId, allSchools);
    const classInfo = {
      grade: selectedClass.gradeName || selectedClass.classGradeName || selectedClass.fullName || selectedClass.name || '--',
      className: selectedClass.name || '--',
      shift: selectedClass.shift || 'morning',
      year: new Date().getFullYear(),
    };
    return generateRelacaoAlunosTurma(classStudents, classInfo, school, munReport.municipality, munReport.secretaria, selectedSigs);
  };

  const handlePrint = () => {
    const html = buildHTML();
    if (html) printReportHTML(html);
  };

  const handleExportClick = () => {
    const html = buildHTML(); if (!html) { alert("Selecione um registro para exportar"); return; }
    setPgExportModal({ html, filename: "ClassRoster" });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Users size={20} className="text-blue-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relação de Alunos por Turma</h1><p className="text-gray-500">Lista completa de alunos matriculados</p></div>
        </div>
        {selectedClass && classStudents.length > 0 && (
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-1"><School size={14} /> Escola</label>
            <select className="input" value={selSchool} onChange={e => { setSelSchool(e.target.value); setSelClass(''); }}>
              <option value="">Todas as escolas</option>
              {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-1"><GraduationCap size={14} /> Turma</label>
            <select className="input" value={selClass} onChange={e => setSelClass(e.target.value)}>
              <option value="">Selecione a turma</option>
              {allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {SHIFTS[c.shift] || c.shift}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Signature selector */}
      {selectedClass && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* Student list */}
      {selectedClass ? (
        <div className="card p-0 overflow-hidden">
          <div className="bg-primary-500 text-white px-5 py-3">
            <h3 className="font-bold">{selectedClass.fullName || selectedClass.name}</h3>
            <p className="text-sm text-primary-200">
              {selectedClass.schoolName || allSchools.find((s: any) => s.id === selectedClass.schoolId)?.name || ''} | {SHIFTS[selectedClass.shift] || ''} | {classStudents.length} aluno(s)
            </p>
          </div>
          {classStudents.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-10">Nº</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Nome do Aluno</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-24">Matrícula</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-28">Nascimento</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-16">Sexo</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase w-24">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {classStudents
                  .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                  .map((s: any, i: number) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="text-center px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{s.name}</td>
                    <td className="text-center px-3 py-2 text-gray-500 font-mono text-xs">{s.enrollment || '--'}</td>
                    <td className="text-center px-3 py-2 text-gray-500">{s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : '--'}</td>
                    <td className="text-center px-3 py-2 text-gray-500">{s.sex || '--'}</td>
                    <td className="text-center px-3 py-2">
                      {s.studentStatus ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.studentStatus === 'aprovado' ? 'bg-green-100 text-green-700' : s.studentStatus === 'reprovado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.studentStatus}
                        </span>
                      ) : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Users size={32} className="mx-auto mb-2 text-gray-300" />
              <p>Nenhum aluno encontrado nesta turma</p>
            </div>
          )}
          {classStudents.length > 0 && (
            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-t flex gap-6 text-sm">
              <span><b>Total:</b> {classStudents.length} aluno(s)</span>
              <span><b>Masculino:</b> {classStudents.filter((s: any) => s.sex === 'M').length}</span>
              <span><b>Feminino:</b> {classStudents.filter((s: any) => s.sex === 'F').length}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-16">
          <GraduationCap size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Selecione uma turma para ver a relação de alunos</p>
        </div>
      )}
    
      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
