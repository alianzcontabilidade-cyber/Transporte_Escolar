import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Search, Printer, GraduationCap, ArrowRightLeft, CalendarCheck, ClipboardList, FileDown, Loader2 } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, printReportHTML, openReportAsPDF } from '../lib/reportTemplate';
import { generateDeclaracaoEscolaridade, generateDeclaracaoTransferencia, generateDeclaracaoFrequencia, generateFichaMatricula } from '../lib/reportGenerators';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

const CERT_TYPES = [
  { id: 'escolaridade', label: 'Declaracao de Escolaridade', desc: 'Comprova que o aluno esta matriculado e cursando', icon: GraduationCap, color: 'indigo' },
  { id: 'frequencia', label: 'Declaracao de Frequencia', desc: 'Comprova frequencia escolar regular', icon: CalendarCheck, color: 'emerald' },
  { id: 'transferencia', label: 'Declaracao de Transferencia', desc: 'Para transferencia entre escolas', icon: ArrowRightLeft, color: 'amber' },
  { id: 'matricula', label: 'Ficha de Matricula', desc: 'Ficha completa com todos os dados do aluno', icon: ClipboardList, color: 'blue' },
];

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [selStudent, setSelStudent] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);

  const allStudents = ((studentsData as any) || []).filter((s: any) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search));
  const allSchools = (schoolsData as any) || [];

  // Load municipality data for report header
  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const [generating, setGenerating] = useState('');

  const buildHTML = (type: string): string => {
    if (!selStudent || !munReport) return '';
    const school = loadSchoolData(selStudent.schoolId, allSchools);
    const { municipality, secretaria } = munReport;

    switch (type) {
      case 'escolaridade': return generateDeclaracaoEscolaridade(selStudent, school, municipality, secretaria, selectedSigs);
      case 'transferencia': return generateDeclaracaoTransferencia(selStudent, school, municipality, secretaria, selectedSigs);
      case 'frequencia': return generateDeclaracaoFrequencia(selStudent, school, municipality, secretaria, selectedSigs);
      case 'matricula': return generateFichaMatricula(selStudent, school, municipality, secretaria, selectedSigs);
      default: return '';
    }
  };

  const handlePDF = async (type: string) => {
    const html = buildHTML(type);
    if (!html) return;
    setGenerating(type);
    try {
      await openReportAsPDF(html, CERT_TYPES.find(c => c.id === type)?.label || 'relatorio');
    } catch { printReportHTML(html); }
    finally { setGenerating(''); }
  };

  const handlePrint = (type: string) => {
    const html = buildHTML(type);
    if (html) printReportHTML(html);
  };

  const handleWord = (type: string) => {
    const html = buildHTML(type);
    if (!html) return;
    const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
    const rawCSS = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
    const cleanCSS = rawCSS
      .replace(/@media\s+screen\{[^}]+\}/g, '').replace(/@media\s+print\{[^}]+\}/g, '')
      .replace(/display:\s*flex[^;}]*/g, '').replace(/flex[^:]*:[^;}]*/g, '')
      .replace(/gap:[^;}]*/g, '').replace(/border-radius:[^;}]*/g, '')
      .replace(/background:\s*linear-gradient[^;}]*/g, 'background:#1B3A5C');
    const wordHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><meta name="ProgId" content="Word.Document">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page{size:A4;margin:2cm 2cm 2.5cm 2cm}
body{font-family:'Calibri',Arial,sans-serif;font-size:12pt;color:#333}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:5px 8px}
th{background-color:#1B3A5C;color:white;font-size:9pt}
.header-line{height:3px;background:#1B3A5C;margin-top:10px}
.mun-name{font-size:14pt;font-weight:bold;color:#1B3A5C;text-align:center}
.sec-name{font-size:11pt;font-weight:bold;color:#2DB5B0;text-align:center}
.report-footer-bar{text-align:center;font-size:7pt;color:#999;border-top:2px solid #ddd;padding-top:8px;margin-top:30px}
.footer-brand{color:#2DB5B0;font-weight:bold}
${cleanCSS}
</style>
</head><body>${bodyContent}</body></html>`;
    const blob = new Blob(['\uFEFF' + wordHTML], { type: 'application/msword;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (CERT_TYPES.find(c => c.id === type)?.label || 'documento').replace(/[^a-zA-Z0-9]/g, '_') + '.doc';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const iconColors: any = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><FileText size={20} className="text-indigo-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Declaracoes e Certidoes</h1><p className="text-gray-500">Gere documentos oficiais para alunos</p></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Student selector */}
        <div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="space-y-1 max-h-[65vh] overflow-y-auto">
            {allStudents.slice(0, 50).map((s: any) => (
              <button key={s.id} onClick={() => setSelStudent(s)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selStudent?.id === s.id ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}>
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-400 flex-shrink-0">{s.name?.[0]}</div>
                <div className="min-w-0"><p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{s.name}</p>{s.enrollment && <p className="text-xs text-gray-400">Mat. {s.enrollment}</p>}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Certificate options + Signature selector */}
        <div className="col-span-2 space-y-4">
          {selStudent ? (
            <>
              <div className="card mb-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">{selStudent.name?.[0]}</div>
                  <div>
                    <h2 className="text-lg font-bold">{selStudent.name}</h2>
                    <p className="text-indigo-200">{selStudent.enrollment ? 'Mat. ' + selStudent.enrollment : ''} {selStudent.grade ? ' | ' + selStudent.grade : ''} {selStudent.shift ? ' | ' + (selStudent.shift === 'morning' ? 'Manha' : selStudent.shift === 'afternoon' ? 'Tarde' : 'Noite') : ''}</p>
                    <p className="text-indigo-300 text-sm">{allSchools.find((sc: any) => sc.id === selStudent.schoolId)?.name || ''}</p>
                  </div>
                </div>
              </div>

              {/* Signature selector */}
              <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Selecione o tipo de documento:</h3>
              <div className="grid grid-cols-2 gap-3">
                {CERT_TYPES.map(cert => {
                  const Icon = cert.icon;
                  const isGenerating = generating === cert.id;
                  return (
                    <div key={cert.id} className="card hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${iconColors[cert.color]}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{cert.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{cert.desc}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handlePDF(cert.id)} disabled={isGenerating}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 font-medium">
                          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF
                        </button>
                        <button onClick={() => handleWord(cert.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm bg-[#2B579A]/10 text-[#2B579A] hover:bg-[#2B579A]/20 rounded-lg transition-colors">
                          <FileText size={14} /> Word
                        </button>
                        <button onClick={() => handlePrint(cert.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors">
                          <Printer size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="card text-center py-20">
              <FileText size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Selecione um aluno para gerar declaracoes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
