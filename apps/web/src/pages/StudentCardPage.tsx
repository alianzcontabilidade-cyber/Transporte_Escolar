import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { CreditCard, Printer, Search, Users , Download } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import { getQRCodeURL } from '../lib/qrcode';

export default function StudentCardPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allStudents = ((studentsData as any) || []).filter((s: any) => {
    const matchSchool = !selSchool || String(s.schoolId) === selSchool;
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search);
    return matchSchool && matchSearch;
  });

  const printCards = (students: any[]) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carteirinhas - NetEscol</title>
    <style>
      body{font-family:Arial,sans-serif;padding:10px;margin:0}
      .cards{display:flex;flex-wrap:wrap;gap:15px;justify-content:center}
      .card{width:380px;height:220px;border:2px solid #1B3A5C;border-radius:12px;padding:15px;position:relative;page-break-inside:avoid;background:linear-gradient(135deg,#f0f4f8 0%,#e6f7f6 100%)}
      .card-header{display:flex;align-items:center;gap:10px;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #2DB5B0}
      .card-header h3{color:#1B3A5C;font-size:13px;margin:0}
      .card-header .school{font-size:9px;color:#666;margin:0}
      .card-body{display:flex;gap:10px}
      .photo{width:65px;height:80px;background:#ddd;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#999;border:1px solid #ccc;flex-shrink:0}
      .photo img{width:100%;height:100%;object-fit:cover;border-radius:8px}
      .info{flex:1;font-size:10px;line-height:1.5}
      .info b{color:#1B3A5C}
      .qr{width:75px;height:75px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
      .qr img{width:70px;height:70px}
      .card-footer{position:absolute;bottom:6px;left:15px;right:15px;display:flex;justify-content:space-between;align-items:center;font-size:8px;color:#999}
      .logo{font-weight:bold;color:#2DB5B0;font-size:11px}
      @media print{body{padding:0}.cards{gap:10px}}
    </style></head><body>
    <div class="cards">${students.map(s => {
      const school = allSchools.find((sc: any) => sc.id === s.schoolId);
      return `<div class="card">
        <div class="card-header"><div><h3>CARTEIRA ESTUDANTIL</h3><p class="school">${school?.name || ''}</p></div><span class="logo">NetEscol</span></div>
        <div class="card-body">
          <div class="photo">${s.photoUrl ? '<img src="' + s.photoUrl + '"/>' : s.name?.[0] || '?'}</div>
          <div class="info">
            <p><b>Nome:</b> ${s.name}</p>
            <p><b>Matr\u00edcula:</b> ${s.enrollment || '\u2014'}</p>
            <p><b>S\u00e9rie:</b> ${s.grade || '\u2014'} | <b>Turma:</b> ${s.classRoom || '\u2014'}</p>
            <p><b>Turno:</b> ${s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manh\u00e3'}</p>
            <p><b>Nascimento:</b> ${s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : '\u2014'}</p>
          </div>
          <div class="qr"><img src="${getQRCodeURL(s.enrollment || String(s.id), 70)}" alt="QR"/></div>
        </div>
        <div class="card-footer"><span>Validade: ${new Date().getFullYear()}</span><span>Mat: ${s.enrollment || s.id}</span></div>
      </div>`;
    }).join('')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const handleExportClick = () => {
    const rows = allStudents.map((s: any) => ({
      nome: s.name || '--',
      matricula: s.enrollment || '--',
      serie: s.grade || '--',
      turma: s.classRoom || '--',
      turno: s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manha',
      nascimento: s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : '--',
    }));
    const cols = ['Nome', 'Matricula', 'Serie', 'Turma', 'Turno', 'Nascimento'];
    const html = buildTableReportHTML('LISTA DE ALUNOS - CARTEIRINHA ESTUDANTIL', rows, cols, munReport, { orientation: 'landscape', signatories: selectedSigs });
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'carteirinha_estudantil' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><CreditCard size={20} className="text-teal-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Carteirinha Estudantil</h1><p className="text-gray-500">{allStudents.length} aluno(s)</p></div></div>
        {allStudents.length > 0 && <><button onClick={() => printCards(allStudents)} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir Carteirinhas</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button></>}
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="flex gap-3 mb-5">
        <select className="input w-56" value={selSchool} onChange={e => setSelSchool(e.target.value)}><option value="">Todas as escolas</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por nome ou matr\u00edcula..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allStudents.map((s: any) => {
          const school = allSchools.find((sc: any) => sc.id === s.schoolId);
          return (
            <div key={s.id} className="rounded-xl border-2 border-primary-500 p-4 bg-gradient-to-br from-[#f0f4f8] to-[#e6f7f6] relative cursor-pointer hover:shadow-lg transition-shadow" onClick={() => printCards([s])}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-accent-500">
                <div><p className="text-xs font-bold text-primary-500 uppercase">Carteira Estudantil</p><p className="text-[10px] text-gray-500">{school?.name || ''}</p></div>
                <span className="text-xs font-bold text-accent-500">NetEscol</span>
              </div>
              <div className="flex gap-3">
                <div className="w-16 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 flex-shrink-0 overflow-hidden">
                  {s.photoUrl ? <img src={s.photoUrl} className="w-full h-full object-cover" /> : s.name?.[0]}
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                  <p className="text-gray-600"><b>Mat:</b> {s.enrollment || '\u2014'}</p>
                  <p className="text-gray-600"><b>S\u00e9rie:</b> {s.grade || '\u2014'} | <b>Turma:</b> {s.classRoom || '\u2014'}</p>
                  <p className="text-gray-600"><b>Turno:</b> {s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manh\u00e3'}</p>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>Validade: {new Date().getFullYear()}</span>
                <span>ID: {s.id}</span>
              </div>
            </div>
          );
        })}
        {!allStudents.length && <div className="col-span-3 card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum aluno encontrado</p></div>}
      </div>
    
      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
