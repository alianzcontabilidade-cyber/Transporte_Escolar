import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { FileSpreadsheet, Printer, Users, Download } from 'lucide-react';
import { loadMunicipalityData, printReportHTML, generateReportHTML, ReportMunicipality, ReportSecretaria } from '../lib/reportTemplate';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';

export default function ATAResultsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<{ municipality: ReportMunicipality; secretaria: ReportSecretaria } | null>(null);

  useEffect(() => { if (mid) loadMunicipalityData(mid, api).then(setMunReport); }, [mid]);

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass) }) : Promise.resolve([]), [mid, selClass]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];

  const STATUS_LABELS: any = { active:'Cursando', graduated:'Aprovado', retained:'Retido', transferred:'Transferido', evaded:'Evadido', cancelled:'Cancelado' };

  const buildATAHtml = () => {
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const contentHTML = `
    <h3 style="text-align:center;font-size:14px;color:#666;margin:5px 0">${cls?.fullName || cls?.name || ''} - ${cls?.schoolName || ''}</h3>
    <p style="text-align:center;font-size:12px;color:#888;margin-bottom:10px">Ano Letivo: ${new Date().getFullYear()}</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr>
    <th style="background:#1B3A5C;color:white;padding:8px;text-align:left">N\u00ba</th>
    <th style="background:#1B3A5C;color:white;padding:8px;text-align:left">Nome do Aluno</th>
    <th style="background:#1B3A5C;color:white;padding:8px;text-align:left">Matr\u00edcula</th>
    <th style="background:#1B3A5C;color:white;padding:8px;text-align:left">Situa\u00e7\u00e3o</th>
    </tr></thead><tbody>${allEnrollments.map((e: any, i: number) => {
      const isApproved = e.status === 'graduated';
      const isRetained = e.status === 'retained';
      return '<tr style="' + (i % 2 === 0 ? '' : 'background:#f8f9fa') + '"><td style="padding:6px 8px;border:1px solid #ddd">' + (i+1) + '</td><td style="padding:6px 8px;border:1px solid #ddd">' + e.studentName + '</td><td style="padding:6px 8px;border:1px solid #ddd">' + (e.studentEnrollment || e.enrollmentNumber || '\u2014') + '</td><td style="padding:6px 8px;border:1px solid #ddd;' + (isApproved ? 'color:#16a34a;font-weight:bold' : isRetained ? 'color:#dc2626;font-weight:bold' : '') + '">' + (STATUS_LABELS[e.status] || e.status) + '</td></tr>';
    }).join('')}</tbody></table>
    <p style="margin-top:15px;font-size:12px"><b>Total de alunos:</b> ${allEnrollments.length} | <b>Aprovados:</b> ${allEnrollments.filter((e: any) => e.status === 'graduated').length} | <b>Retidos:</b> ${allEnrollments.filter((e: any) => e.status === 'retained').length} | <b>Transferidos:</b> ${allEnrollments.filter((e: any) => e.status === 'transferred').length}</p>`;
    return generateReportHTML({
      municipality: munReport?.municipality || { name: '' },
      secretaria: munReport?.secretaria,
      title: 'ATA DE RESULTADOS FINAIS',
      content: contentHTML,
      signatories: selectedSigs.length > 0 ? selectedSigs : undefined,
      showDate: true,
    });
  };

  const handlePrint = () => { printReportHTML(buildATAHtml()); };

  const counts = { total: allEnrollments.length, approved: allEnrollments.filter((e: any) => e.status === 'graduated').length, retained: allEnrollments.filter((e: any) => e.status === 'retained').length, active: allEnrollments.filter((e: any) => e.status === 'active').length };

  const handleExportClick = () => {
    const html = buildATAHtml();
    if (!html) { showInfoToast('Selecione uma turma e bimestre para exportar'); return; }
    setPgExportModal({ html, filename: 'ATA_Resultados' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><FileSpreadsheet size={20} className="text-emerald-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">ATA de Resultados Finais</h1><p className="text-gray-500">Documento oficial de resultados</p></div></div>
        {allEnrollments.length > 0 && <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
        </div>}
      </div>

      <select className="input w-72 mb-5" value={selClass} onChange={e => setSelClass(e.target.value)}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>

      {selClass && allEnrollments.length > 0 && (
        <>
          <div className="mb-5">
            <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />
          </div>
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="card text-center bg-blue-50 border-0"><p className="text-2xl font-bold text-blue-600">{counts.total}</p><p className="text-xs text-gray-500">Total</p></div>
            <div className="card text-center bg-green-50 border-0"><p className="text-2xl font-bold text-green-600">{counts.approved}</p><p className="text-xs text-gray-500">Aprovados</p></div>
            <div className="card text-center bg-red-50 border-0"><p className="text-2xl font-bold text-red-600">{counts.retained}</p><p className="text-xs text-gray-500">Retidos</p></div>
            <div className="card text-center bg-yellow-50 border-0"><p className="text-2xl font-bold text-yellow-600">{counts.active}</p><p className="text-xs text-gray-500">Cursando</p></div>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['N\u00ba','Aluno','Matr\u00edcula','Situa\u00e7\u00e3o'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y">{allEnrollments.map((e: any, i: number) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{e.studentName}</td>
                <td className="px-5 py-3 text-gray-500">{e.studentEnrollment || e.enrollmentNumber || '\u2014'}</td>
                <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${e.status === 'graduated' ? 'bg-green-100 text-green-700' : e.status === 'retained' ? 'bg-red-100 text-red-700' : e.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[e.status] || e.status}</span></td>
              </tr>
            ))}</tbody></table>
          </div>
        </>
      )}
      {selClass && !allEnrollments.length && <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma matr\u00edcula encontrada</p></div>}
      {!selClass && <div className="card text-center py-16"><FileSpreadsheet size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para gerar a ATA</p></div>}
    
      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
