import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Database, Download, Printer, School, Users } from 'lucide-react';
import { loadMunicipalityData, printReportHTML, openReportAsPDF } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function EducacensoReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => api.enrollments.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allStudents = (studentsData as any) || [];
  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const filteredSchools = selSchool === 'all' ? allSchools : allSchools.filter((s: any) => String(s.id) === selSchool);

  // Build EDUCACENSO summary per school
  const censusData = filteredSchools.map((school: any) => {
    const schoolStudents = allStudents.filter((s: any) => s.schoolId === school.id);
    const schoolClasses = allClasses.filter((c: any) => c.schoolId === school.id);
    const schoolEnrollments = allEnrollments.filter((e: any) => schoolClasses.some((c: any) => c.id === e.classId));
    const male = schoolStudents.filter((s: any) => s.sex === 'M').length;
    const female = schoolStudents.filter((s: any) => s.sex === 'F').length;
    const rural = schoolStudents.filter((s: any) => s.zone === 'rural').length;
    const transport = schoolStudents.filter((s: any) => s.needsTransport).length;
    const specialNeeds = schoolStudents.filter((s: any) => s.hasSpecialNeeds).length;
    const bolsa = schoolStudents.filter((s: any) => s.bolsaFamilia).length;

    return {
      schoolName: school.name,
      inep: school.code || '--',
      totalStudents: schoolStudents.length,
      totalClasses: schoolClasses.length,
      totalEnrollments: schoolEnrollments.length,
      male, female, rural, transport, specialNeeds, bolsa,
    };
  }).filter((d: any) => d.totalStudents > 0 || d.totalClasses > 0);

  const totals = censusData.reduce((acc: any, d: any) => ({
    students: acc.students + d.totalStudents,
    classes: acc.classes + d.totalClasses,
    male: acc.male + d.male,
    female: acc.female + d.female,
    rural: acc.rural + d.rural,
    transport: acc.transport + d.transport,
    specialNeeds: acc.specialNeeds + d.specialNeeds,
    bolsa: acc.bolsa + d.bolsa,
  }), { students: 0, classes: 0, male: 0, female: 0, rural: 0, transport: 0, specialNeeds: 0, bolsa: 0 });

  const buildReportHTML = () => {
    if (!munReport || !censusData.length) return '';
    const rows = censusData.map((d: any) => ({
      'Escola': d.schoolName,
      'INEP': d.inep,
      'Turmas': d.totalClasses,
      'Alunos': d.totalStudents,
      'Masc.': d.male,
      'Fem.': d.female,
      'Rural': d.rural,
      'Transp.': d.transport,
      'PcD': d.specialNeeds,
      'Bolsa F.': d.bolsa,
    }));

    return buildTableReportHTML('RELATÓRIO EDUCACENSO', rows,
      ['Escola', 'INEP', 'Turmas', 'Alunos', 'Masc.', 'Fem.', 'Rural', 'Transp.', 'PcD', 'Bolsa F.'],
      munReport, {
        subtitle: `Dados para Censo Escolar - ${new Date().getFullYear()}`,
        signatories: selectedSigs, orientation: 'landscape', fontSize: 10,
        summary: `Total: ${censusData.length} escola(s) | ${totals.students} alunos | ${totals.classes} turmas | ${totals.rural} zona rural | ${totals.transport} com transporte | ${totals.specialNeeds} PcD | ${totals.bolsa} Bolsa Família`,
      });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handlePDF = async () => { const html = buildReportHTML(); if (html) await openReportAsPDF(html, 'Relatorio_EDUCACENSO'); };
  const handleExportClick = () => { if (!censusData.length) return; const html = buildReportHTML(); if (html) setPgExportModal({ html, filename: 'Relatorio_EDUCACENSO' }); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center"><Database size={20} className="text-rose-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Relatório EDUCACENSO</h1><p className="text-gray-500">Dados consolidados para o Censo Escolar</p></div>
        </div>
        {censusData.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePDF} className="btn-primary flex items-center gap-2"><Download size={16} /> PDF</button>
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 items-end">
        <div><label className="label">Escola</label>
          <select className="input w-64" value={selSchool} onChange={e => setSelSchool(e.target.value)}>
            <option value="all">Todas</option>
            {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
      </div>

      {censusData.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {censusData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="card text-center p-4"><School size={24} className="text-rose-500 mx-auto mb-1" /><p className="text-2xl font-bold">{censusData.length}</p><p className="text-xs text-gray-500">Escolas</p></div>
          <div className="card text-center p-4"><Users size={24} className="text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold text-blue-600">{totals.students}</p><p className="text-xs text-gray-500">Alunos</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-green-600">{totals.classes}</p><p className="text-xs text-gray-500">Turmas</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-purple-600">{totals.transport}</p><p className="text-xs text-gray-500">Com Transporte</p></div>
        </div>
      )}

      {censusData.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['Escola','INEP','Turmas','Alunos','Masc.','Fem.','Rural','Transp.','PcD','Bolsa F.'].map(h =>
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {censusData.map((d: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-xs font-semibold text-gray-800">{d.schoolName}</td>
                  <td className="px-3 py-3 text-xs font-mono">{d.inep}</td>
                  <td className="px-3 py-3 text-xs font-bold">{d.totalClasses}</td>
                  <td className="px-3 py-3 text-xs font-bold text-blue-600">{d.totalStudents}</td>
                  <td className="px-3 py-3 text-xs">{d.male}</td>
                  <td className="px-3 py-3 text-xs">{d.female}</td>
                  <td className="px-3 py-3 text-xs">{d.rural}</td>
                  <td className="px-3 py-3 text-xs">{d.transport}</td>
                  <td className="px-3 py-3 text-xs">{d.specialNeeds}</td>
                  <td className="px-3 py-3 text-xs">{d.bolsa}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold text-xs">
                <td className="px-3 py-3" colSpan={2}>TOTAL</td>
                <td className="px-3 py-3">{totals.classes}</td>
                <td className="px-3 py-3 text-blue-600">{totals.students}</td>
                <td className="px-3 py-3">{totals.male}</td>
                <td className="px-3 py-3">{totals.female}</td>
                <td className="px-3 py-3">{totals.rural}</td>
                <td className="px-3 py-3">{totals.transport}</td>
                <td className="px-3 py-3">{totals.specialNeeds}</td>
                <td className="px-3 py-3">{totals.bolsa}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16"><Database size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum dado disponível</p></div>
      )}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Relatório EDUCACENSO" />
    </div>
  );
}
