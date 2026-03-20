import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { History, Search, Printer, Download, Users, BookOpen, CheckCircle, FileDown } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, openReportAsPDF } from '../lib/reportTemplate';
import { generateHistoricoEscolar } from '../lib/reportGenerators';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

export default function StudentHistoryPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selStudent ? api.enrollments.list({ municipalityId: mid, studentId: parseInt(selStudent) }) : Promise.resolve([]), [mid, selStudent]);
  const { data: yearsData } = useQuery(() => api.academicYears.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];

  // Load municipality data for report header
  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const allStudents = (studentsData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const allYears = (yearsData as any) || [];

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

    const history = allEnrollments.map((e: any) => {
      const year = allYears.find((y: any) => y.id === e.academicYearId);
      return {
        year: year?.year || 0,
        grade: e.className || year?.name || '--',
        school: student.school || school?.name || '--',
        result: STATUS_LABELS[e.status] || e.status || '--',
      };
    });

    return generateHistoricoEscolar(student, history, school, municipality, secretaria, selectedSigs);
  };

  const handlePDF = async () => {
    const html = buildHistoricoHTML();
    if (!html) return;
    try {
      await openReportAsPDF(html, 'Historico_' + (student?.name || 'aluno'));
    } catch { printReportHTML(html); }
  };

  const handlePrint = () => {
    const html = buildHistoricoHTML();
    if (!html) return;
    printReportHTML(html);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><History size={20} className="text-indigo-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Historico Escolar</h1><p className="text-gray-500">Trajetoria academica do aluno</p></div></div>
        {selStudent && allEnrollments.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePDF} className="btn-primary flex items-center gap-2"><FileDown size={16} /> PDF</button>
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
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
    </div>
  );
}
