import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Search, Users, Printer, Download } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML } from '../lib/reportTemplate';
import { generateFichaMatricula } from '../lib/reportGenerators';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';

export default function StudentReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [selStudent, setSelStudent] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);

  const allStudents = ((studentsData as any) || []).filter((s: any) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search));
  const allSchools = (schoolsData as any) || [];
  const getSchool = (id: number) => allSchools.find((s: any) => s.id === id);

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const buildHTML = () => {
    if (!selStudent || !munReport) return '';
    const school = loadSchoolData(selStudent.schoolId, allSchools);
    return generateFichaMatricula(selStudent, school, munReport.municipality, munReport.secretaria, selectedSigs);
  };

  const handlePrint = () => {
    const html = buildHTML();
    if (html) printReportHTML(html);
  };

  const handleExportClick = () => {
    const html = buildHTML(); if (!html) { showInfoToast("Selecione um registro para exportar"); return; }
    setPgExportModal({ html, filename: "StudentReport" });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><FileText size={20} className="text-indigo-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha do Aluno</h1><p className="text-gray-500">Ficha completa com todos os dados cadastrais</p></div>
        </div>
        {selStudent && (
          <div className="flex gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Student selector */}
        <div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="space-y-1 max-h-[65vh] overflow-y-auto">{allStudents.slice(0, 50).map((s: any) => (
            <button key={s.id} onClick={() => setSelStudent(s)} className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selStudent?.id === s.id ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-400 flex-shrink-0">{s.name?.[0]}</div>
              <div className="min-w-0"><p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{s.name}</p>{s.enrollment && <p className="text-xs text-gray-400">Mat. {s.enrollment}</p>}</div>
            </button>
          ))}</div>
        </div>

        {/* Right */}
        <div className="col-span-2 space-y-4">
          {selStudent ? (
            <>
              <div className="card mb-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold overflow-hidden">
                    {selStudent.photoUrl ? <img src={selStudent.photoUrl} className="w-full h-full rounded-full object-cover" alt="" /> : selStudent.name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selStudent.name}</h2>
                    <p className="text-indigo-200">{selStudent.enrollment ? 'Mat. ' + selStudent.enrollment : 'Sem matrícula'} {selStudent.grade ? '| ' + selStudent.grade : ''}</p>
                    <p className="text-indigo-300 text-sm">{getSchool(selStudent.schoolId)?.name || ''}</p>
                  </div>
                </div>
              </div>

              {/* Signature selector */}
              <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

              {/* Preview fields */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  ['Escola', getSchool(selStudent.schoolId)?.name || '--'],
                  ['Matrícula', selStudent.enrollment || '--'],
                  ['Nascimento', selStudent.birthDate ? new Date(selStudent.birthDate).toLocaleDateString('pt-BR') : '--'],
                  ['Sexo', selStudent.sex === 'M' ? 'Masculino' : selStudent.sex === 'F' ? 'Feminino' : '--'],
                  ['CPF', selStudent.cpf || '--'],
                  ['Naturalidade', (selStudent.naturalness || '--') + (selStudent.naturalnessUf ? '/' + selStudent.naturalnessUf : '')],
                  ['Pai', selStudent.fatherName || '--'],
                  ['Mãe', selStudent.motherName || '--'],
                  ['Endereço', selStudent.address || '--'],
                  ['Tipo Sanguíneo', selStudent.bloodType || '--'],
                  ['Deficiência', selStudent.hasSpecialNeeds ? (selStudent.deficiencyType || 'Sim') : 'Não'],
                  ['Bolsa Família', selStudent.bolsaFamilia ? 'Sim' : 'Não'],
                ].map(([label, value]) => (
                  <div key={label as string} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center mt-2">Clique em "PDF" ou "Imprimir" para gerar a ficha completa com todos os campos</p>
            </>
          ) : (
            <div className="card text-center py-20"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione um aluno para ver a ficha</p></div>
          )}
        </div>
      </div>
    
      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatório" : undefined} />
    </div>
  );
}
