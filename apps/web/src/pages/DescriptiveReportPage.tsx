import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { FileEdit, Save, CheckCircle, Users, BookOpen, FileDown, Printer , Download } from 'lucide-react';
import { loadMunicipalityData, loadSchoolData, generateReportHTML, openReportAsPDF, printReportHTML } from '../lib/reportTemplate';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';

const BIMESTERS = [{ v:'1', l:'1° Bimestre' },{ v:'2', l:'2° Bimestre' },{ v:'3', l:'3° Bimestre' },{ v:'4', l:'4° Bimestre' }];

export default function DescriptiveReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [selBimester, setSelBimester] = useState('1');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);

  useEffect(() => {
    if (mid) loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);
  const { data: reportsData, refetch } = useQuery(() => selClass ? api.descriptiveReports.list({ classId: parseInt(selClass), bimester: selBimester }) : Promise.resolve([]), [selClass, selBimester]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];
  const allReports = (reportsData as any) || [];

  const getReport = (studentId: number) => allReports.find((r: any) => r.studentId === studentId);

  const saveReport = async (studentId: number) => {
    setSaving(true);
    setSaveMsg('');
    try {
      await api.descriptiveReports.save({ municipalityId: mid, studentId, classId: parseInt(selClass), bimester: selBimester, content: editContent, status: 'draft' });
      setSaveMsg('Salvo!');
      setEditingId(null);
      refetch();
    } catch (e: any) { setSaveMsg('Erro: ' + e.message); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(''), 3000); }
  };

  const publishAll = async () => {
    for (const r of allReports) {
      if (r.status === 'draft') {
        await api.descriptiveReports.save({ municipalityId: mid, studentId: r.studentId, classId: parseInt(selClass), bimester: selBimester, content: r.content, status: 'published' });
      }
    }
    refetch();
  };

  const printAll = () => {
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const bimLabel = BIMESTERS.find(b => b.v === selBimester)?.l || '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pareceres - ${cls?.fullName || ''}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    .student{margin:20px 0;padding:15px;border:1px solid #ddd;border-radius:8px;page-break-inside:avoid}
    .student h3{color:#1B3A5C;margin:0 0 8px}.student p{font-size:14px;line-height:1.6}
    .footer{margin-top:30px;text-align:center;font-size:11px;color:#999}
    @media print{.student{border:1px solid #ccc}}</style></head><body>
    <h1>Parecer Descritivo - ${bimLabel}</h1>
    <p><b>Turma:</b> ${cls?.fullName || ''} | <b>Escola:</b> ${cls?.schoolName || ''}</p>
    ${allEnrollments.map((e: any) => {
      const report = getReport(e.studentId);
      return '<div class="student"><h3>' + e.studentName + '</h3><p>' + (report?.content || 'Sem parecer registrado.') + '</p></div>';
    }).join('')}
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const generateStudentReport = (enrollment: any) => {
    if (!munReport) return '';
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const school = cls ? loadSchoolData(cls.schoolId, allClasses.map((c: any) => ({ id: c.schoolId, name: c.schoolName }))) : undefined;
    const studentReports = BIMESTERS.map(b => {
      const r = allReports.find((rep: any) => rep.studentId === enrollment.studentId && rep.bimester === b.v)
        || (b.v === selBimester ? getReport(enrollment.studentId) : null);
      return { label: b.l, content: r?.content || '' };
    });
    const content = `
      <div class="student-info">
        <div class="si-name">${enrollment.studentName}</div>
        ${enrollment.studentEnrollment ? `<div class="si-detail">Matrícula: ${enrollment.studentEnrollment}</div>` : ''}
        <div class="si-detail">Turma: ${cls?.fullName || cls?.name || ''} | Escola: ${cls?.schoolName || ''}</div>
      </div>
      ${studentReports.map(sr => `
        <div class="section-title">${sr.label}</div>
        <p>${sr.content || '<em style="color:#999">Sem parecer registrado.</em>'}</p>
      `).join('')}
    `;
    return generateReportHTML({
      municipality: munReport.municipality,
      secretaria: munReport.secretaria,
      school,
      title: 'PARECER DESCRITIVO',
      subtitle: cls?.fullName || '',
      content,
      signatories: selectedSigs,
    });
  };

  const handleStudentPDF = async (enrollment: any) => {
    const html = generateStudentReport(enrollment);
    if (html) await openReportAsPDF(html, 'Parecer_' + (enrollment.studentName || 'Aluno'));
  };

  const handleStudentPrint = (enrollment: any) => {
    const html = generateStudentReport(enrollment);
    if (html) printReportHTML(html);
  };

  const handleExportClick = () => {
    alert("Use o botao Imprimir para gerar o documento"); return;
    setPgExportModal({ html, filename: "DescriptiveReport" });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><FileEdit size={20} className="text-purple-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Parecer Descritivo</h1><p className="text-gray-500">Avaliação qualitativa por aluno</p></div></div>
        <div className="flex gap-2">
          {allReports.length > 0 && <><button onClick={printAll} className="btn-secondary flex items-center gap-2 text-sm"><BookOpen size={14} /> Imprimir Todos</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button></>}
          {allReports.some((r: any) => r.status === 'draft') && <button onClick={publishAll} className="btn-primary flex items-center gap-2 text-sm"><CheckCircle size={14} /> Publicar Todos</button>}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <select className="input w-64" value={selClass} onChange={e => setSelClass(e.target.value)}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">{BIMESTERS.map(b => (
          <button key={b.v} onClick={() => setSelBimester(b.v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selBimester === b.v ? 'bg-white shadow text-accent-600' : 'text-gray-500'}`}>{b.l}</button>
        ))}</div>
      </div>

      {saveMsg && <div className={`mb-4 p-3 rounded-lg text-sm ${saveMsg.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{saveMsg}</div>}

      {selClass ? (
        <div className="space-y-3">
          {allEnrollments.map((e: any) => {
            const report = getReport(e.studentId);
            const isEditing = editingId === e.studentId;
            return (
              <div key={e.studentId} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">{e.studentName?.[0]}</div>
                    <div><p className="font-semibold text-gray-800">{e.studentName}</p>{e.studentEnrollment && <p className="text-xs text-gray-400">Mat. {e.studentEnrollment}</p>}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report?.status === 'published' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Publicado</span>}
                    {report?.status === 'draft' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Rascunho</span>}
                    {report?.content && munReport && <>
                      <button onClick={() => handleStudentPDF(e)} className="text-xs text-red-500 hover:underline flex items-center gap-1" title="Gerar PDF"><FileDown size={12} /> PDF</button>
                      <button onClick={() => handleStudentPrint(e)} className="text-xs text-blue-500 hover:underline flex items-center gap-1" title="Imprimir"><Printer size={12} /> Imprimir</button>
                    </>}
                    {!isEditing && <button onClick={() => { setEditingId(e.studentId); setEditContent(report?.content || ''); }} className="text-xs text-accent-500 hover:underline">{report ? 'Editar' : 'Escrever'}</button>}
                  </div>
                </div>
                {isEditing ? (
                  <div>
                    <textarea className="input" rows={4} value={editContent} onChange={ev => setEditContent(ev.target.value)} placeholder="Digite o parecer descritivo do aluno..." />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-sm">Cancelar</button>
                      <button onClick={() => saveReport(e.studentId)} disabled={saving} className="btn-primary text-sm flex items-center gap-1"><Save size={14} />{saving ? 'Salvando...' : 'Salvar'}</button>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${report?.content ? 'text-gray-600' : 'text-gray-400 italic'}`}>{report?.content || 'Nenhum parecer registrado para este bimestre.'}</p>
                )}
              </div>
            );
          })}
          {!allEnrollments.length && <div className="card text-center py-12"><Users size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum aluno matriculado nesta turma</p></div>}
        </div>
      ) : (
        <div className="card text-center py-16"><FileEdit size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para registrar pareceres</p></div>
      )}

      {selClass && <div className="mt-6"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}
    
      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
