import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { History, Search, Printer, Download, Users, BookOpen, CheckCircle } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML } from '../lib/reportTemplate';
import { generateHistoricoEscolar } from '../lib/reportGenerators';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';

export default function StudentHistoryPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [selStudent, setSelStudent] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [gradesMap, setGradesMap] = useState<Record<string, any[]>>({});

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selStudent ? api.enrollments.list({ municipalityId: mid, studentId: parseInt(selStudent) }) : Promise.resolve([]), [mid, selStudent]);
  const { data: yearsData } = useQuery(() => api.academicYears.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: historyData } = useQuery(() => selStudent ? api.studentHistory.list({ municipalityId: mid, studentId: parseInt(selStudent) }) : Promise.resolve([]), [selStudent]);

  const allSchools = (schoolsData as any) || [];

  // Load municipality data for report header
  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const allStudents = (studentsData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const allYears = (yearsData as any) || [];

  // Carregar notas por turma quando as matrículas mudarem
  useEffect(() => {
    if (!selStudent || !allEnrollments.length) { setGradesMap({}); return; }
    const loadGrades = async () => {
      const map: Record<string, any[]> = {};
      for (const enr of allEnrollments) {
        if (!enr.classId) continue;
        try {
          const reportCard = await api.studentGrades.reportCard({ classId: enr.classId, studentId: parseInt(selStudent) });
          const subjects = (reportCard as any) || [];
          const grades = subjects.map((s: any) => {
            const bimAvg = (bim: string) => {
              const gs = s.bimesters[bim] || [];
              if (!gs.length) return null;
              const scores = gs.filter((g: any) => g.score !== null).map((g: any) => g.score);
              return scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;
            };
            return { subject: s.subjectName, b1: bimAvg('1'), b2: bimAvg('2'), b3: bimAvg('3'), b4: bimAvg('4') };
          });
          map[String(enr.classId)] = grades;
        } catch {}
      }
      setGradesMap(map);
    };
    loadGrades();
  }, [selStudent, allEnrollments.length]);

  const filtered = allStudents.filter((s: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || (s.enrollment || '').includes(q);
  });

  const student = allStudents.find((s: any) => String(s.id) === selStudent);

  const STATUS_LABELS: any = { active: 'Cursando', graduated: 'Aprovado', retained: 'Retido', transferred: 'Transferido', evaded: 'Evadido', cancelled: 'Cancelado' };
  const STATUS_COLORS: any = { active: 'bg-blue-100 text-blue-700', graduated: 'bg-green-100 text-green-700', retained: 'bg-red-100 text-red-700', transferred: 'bg-yellow-100 text-yellow-700', evaded: 'bg-orange-100 text-orange-700', cancelled: 'bg-gray-100 text-gray-600' };

  const buildHistoricoHTML = (): string => {
    if (!student || !munReport) return '';
    const school = loadSchoolData(student.schoolId, allSchools);
    const { municipality, secretaria } = munReport;

    // Histórico anterior (anos anteriores em outras escolas)
    const previousHistory = ((historyData as any) || []).map((h: any) => ({
      year: h.year,
      grade: h.grade,
      school: h.schoolName + (h.schoolCity ? ' – ' + h.schoolCity + '/' + (h.schoolState || '') : ''),
      result: h.result,
    }));

    // Matrículas atuais no sistema
    const currentHistory = allEnrollments.map((e: any) => {
      const year = allYears.find((y: any) => y.id === e.academicYearId);
      const classGrades = gradesMap[String(e.classId)] || [];
      return {
        year: year?.year || 0,
        grade: e.classFullName || e.className || e.studentGrade || year?.name || '--',
        school: e.schoolId ? (allSchools.find((s: any) => s.id === e.schoolId)?.name || student.school || school?.name || '--') : (student.school || school?.name || '--'),
        result: STATUS_LABELS[e.status] || e.status || '--',
        grades: classGrades,
      };
    });

    // Combinar e ordenar por ano
    const history = [...previousHistory, ...currentHistory].sort((a: any, b: any) => a.year - b.year);

    return generateHistoricoEscolar(student, history, school, municipality, secretaria, selectedSigs);
  };

  const handlePrint = () => {
    const html = buildHistoricoHTML();
    if (!html) return;
    printReportHTML(html);
  };

  const handleExportClick = () => {
    const html = buildHistoricoHTML();
    if (!html) { alert('Selecione um aluno com matriculas para exportar'); return; }
    setPgExportModal({ html, filename: 'Historico_' + (student?.name || 'aluno') });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><History size={20} className="text-indigo-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Histórico Escolar</h1><p className="text-gray-500">Trajetória acadêmica do aluno</p></div></div>
        {selStudent && allEnrollments.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Student selector */}
        <div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.slice(0, 50).map((s: any) => (
              <button key={s.id} onClick={() => setSelStudent(String(s.id))}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${String(s.id) === selStudent ? 'bg-accent-50 border border-accent-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">{s.name?.[0]}</div>
                <div className="min-w-0"><p className="text-sm font-medium truncate">{s.name}</p>{s.enrollment && <p className="text-xs text-gray-400">Mat. {s.enrollment}</p>}</div>
              </button>
            ))}
            {!filtered.length && <p className="text-center text-gray-400 py-8 text-sm">Nenhum aluno encontrado</p>}
          </div>
        </div>

        {/* Right: History */}
        <div className="col-span-2">
          {student ? (
            <div>
              <div className="card mb-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">{student.name?.[0]}</div>
                  <div><h2 className="text-lg font-bold">{student.name}</h2><p className="text-indigo-200">{student.enrollment ? 'Mat. ' + student.enrollment : ''} {student.grade ? '· ' + student.grade : ''}</p><p className="text-indigo-300 text-sm">{student.school || ''}</p></div>
                </div>
              </div>

              <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

              {allEnrollments.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2"><BookOpen size={16} /> Trajetoria Academica</h3>
                  {allEnrollments.map((e: any) => {
                    const year = allYears.find((y: any) => y.id === e.academicYearId);
                    return (
                      <div key={e.id} className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-sm">{year?.year || '?'}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{year?.name || 'Ano letivo'}</p>
                          <p className="text-sm text-gray-500">{e.enrollmentDate ? 'Matriculado em ' + new Date(e.enrollmentDate).toLocaleDateString('pt-BR') : ''}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100'}`}>{STATUS_LABELS[e.status] || e.status}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card text-center py-12"><History size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma matricula registrada</p></div>
              )}
            </div>
          ) : (
            <div className="card text-center py-20"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione um aluno para ver o historico</p></div>
          )}
        </div>
      </div>
    
      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
