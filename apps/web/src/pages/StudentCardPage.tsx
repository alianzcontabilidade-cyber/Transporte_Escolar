import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { CreditCard, Printer, Search, Users, Download, Lock, Loader2, PenTool, X } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import { getQRCodeURL } from '../lib/qrcode';

function buildCardHTML(students: any[], allSchools: any[], mun: any, sec: any, signatories?: Signatory[], signatureType?: 'manual' | 'electronic') {
  const year = new Date().getFullYear();
  // Assinatura manual: linha com nome/cargo. Eletrônica: bloco injetado pelo backend.
  const hasSigs = signatories && signatories.length > 0;
  const sigHTML = hasSigs && signatureType === 'manual' ?
    `<div style="display:flex;justify-content:center;gap:20px;margin-top:6px;padding-top:4px">
      ${signatories.map(sig =>
        `<div style="text-align:center;flex:1;max-width:45%">
          <div style="border-top:1px solid #666;padding-top:3px;font-size:7px;color:#333">
            <span style="font-weight:bold">${sig.name}</span><br/>
            <span style="color:#777;font-size:6.5px">${sig.role}${sig.decree ? ' - ' + sig.decree : ''}</span>
          </div>
        </div>`
      ).join('')}
    </div>` : '';

  const sigCount = hasSigs ? signatories.length : 0;
  const cardHeight = sigCount > 0 && signatureType === 'manual' ? (sigCount > 1 ? '285px' : '275px') : '255px';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Carteirinhas - NetEscol</title>
  <style>
    body{font-family:Arial,sans-serif;padding:10px;margin:0}
    .cards{display:flex;flex-wrap:wrap;gap:15px;justify-content:center}
    .card{width:400px;height:${cardHeight};border:2px solid #1B3A5C;border-radius:12px;padding:12px;position:relative;page-break-inside:avoid;background:linear-gradient(135deg,#f0f4f8 0%,#e6f7f6 100%)}
    .card-inst{display:flex;align-items:center;gap:6px;margin-bottom:4px;padding-bottom:4px;border-bottom:1.5px solid #ccc}
    .card-inst img{width:32px;height:32px;object-fit:contain}
    .card-inst .inst-text{flex:1;text-align:center;line-height:1.15}
    .card-inst .inst-text p{margin:0;font-size:7.5px;color:#444}
    .card-inst .inst-text .mun{font-size:8px;font-weight:bold;color:#1B3A5C;text-transform:uppercase}
    .card-inst .inst-text .sec{font-size:7px;color:#555}
    .card-inst .inst-text .sch{font-size:7.5px;color:#333;font-weight:600}
    .card-title{text-align:center;font-size:11px;font-weight:bold;color:#1B3A5C;margin:3px 0;padding-bottom:3px;border-bottom:2px solid #2DB5B0;letter-spacing:1px}
    .card-body{display:flex;gap:8px;margin-top:5px}
    .photo{width:60px;height:75px;background:#ddd;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#999;border:1px solid #ccc;flex-shrink:0}
    .photo img{width:100%;height:100%;object-fit:cover;border-radius:6px}
    .info{flex:1;font-size:9.5px;line-height:1.55}
    .info b{color:#1B3A5C}
    .qr{width:65px;height:65px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
    .qr img{width:60px;height:60px}
    .card-footer{position:absolute;bottom:5px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;font-size:7.5px;color:#999}
    @media print{body{padding:0}.cards{gap:10px}}
  </style></head><body>
  <div class="cards">${students.map(s => {
    const school = allSchools.find((sc: any) => sc.id === s.schoolId);
    return `<div class="card">
      <div class="card-inst">
        ${mun?.logoUrl ? '<img src="' + mun.logoUrl + '" alt="Brasao"/>' : ''}
        <div class="inst-text">
          ${mun?.state ? '<p>ESTADO DO ' + mun.state.toUpperCase() + '</p>' : ''}
          <p class="mun">${mun?.name || 'Prefeitura Municipal'}</p>
          ${sec?.name ? '<p class="sec">' + sec.name + '</p>' : ''}
          <p class="sch">${school?.name || ''}</p>
        </div>
      </div>
      <div class="card-title">CARTEIRA ESTUDANTIL</div>
      <div class="card-body">
        <div class="photo">${s.photoUrl ? '<img src="' + s.photoUrl + '"/>' : s.name?.[0] || '?'}</div>
        <div class="info">
          <p><b>Nome:</b> ${s.name}</p>
          <p><b>Matr\u00edcula:</b> ${s.enrollment || '\u2014'}</p>
          <p><b>S\u00e9rie:</b> ${s.grade || '\u2014'} | <b>Turma:</b> ${s.classRoom || '\u2014'}</p>
          <p><b>Turno:</b> ${s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : s.shift === 'full_time' ? 'Integral' : 'Manh\u00e3'}</p>
          <p><b>Nascimento:</b> ${s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : '\u2014'}</p>
        </div>
        <div class="qr"><img src="${getQRCodeURL(s.enrollment || String(s.id), 60)}" alt="QR"/></div>
      </div>
      ${sigHTML}
      <div class="card-footer"><span>Validade: ${year}</span></div>
    </div>`;
  }).join('')}</div></body></html>`;
}

export default function StudentCardPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [signPassword, setSignPassword] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signTarget, setSignTarget] = useState<any[]>([]);
  const [signing, setSigning] = useState(false);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allStudents = ((studentsData as any) || []).filter((s: any) => {
    const matchSchool = !selSchool || String(s.schoolId) === selSchool;
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search);
    return matchSchool && matchSearch;
  });

  // Imprimir com assinatura manual (linha impressa)
  const printManual = (students: any[]) => {
    const html = buildCardHTML(students, allSchools, munReport?.municipality, munReport?.secretaria,
      selectedSigs.length > 0 ? selectedSigs : undefined, 'manual');
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  // Gerar PDF com assinatura eletrônica (via /api/pdf/generate)
  const openSignModal = (students: any[]) => {
    if (selectedSigs.length === 0) { showInfoToast('Selecione ao menos um assinante'); return; }
    setSignTarget(students);
    setSignPassword('');
    setShowSignModal(true);
  };

  const generateSignedPDF = async () => {
    if (!signPassword.trim()) return;
    setSigning(true);
    try {
      const html = buildCardHTML(signTarget, allSchools, munReport?.municipality, munReport?.secretaria, selectedSigs, 'electronic');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          html,
          orientation: 'portrait',
          filename: `carteirinhas_${signTarget.length}_alunos`,
          docType: 'carteirinha',
          docTitle: `Carteirinha Estudantil - ${signTarget.length} aluno(s)`,
          signAfterGenerate: true,
          signerPassword: signPassword,
          signatures: selectedSigs.map(s => ({ signerName: s.name, signerRole: s.role, signerCpf: s.cpf, signerDecree: s.decree })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || 'Erro ao gerar PDF');
      }

      const verificationCode = res.headers.get('X-Verification-Code') || '';
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carteirinha_${verificationCode || 'assinada'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      showSuccessToast(`Carteirinha(s) assinada(s) eletronicamente! Codigo: ${verificationCode}`);
      setShowSignModal(false);
    } catch (err: any) {
      showErrorToast(err.message || 'Erro ao assinar');
    } finally {
      setSigning(false);
    }
  };

  const handleExportClick = () => {
    const rows = allStudents.map((s: any) => ({
      nome: s.name || '--',
      matricula: s.enrollment || '--',
      serie: s.grade || '--',
      turma: s.classRoom || '--',
      turno: s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manhã',
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><CreditCard size={20} className="text-teal-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Carteirinha Estudantil</h1><p className="text-gray-500">{allStudents.length} aluno(s)</p></div>
        </div>
        {allStudents.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => printManual(allStudents)} className="btn-secondary flex items-center gap-2 text-sm"><PenTool size={14} /> Assinatura Manual</button>
            <button onClick={() => openSignModal(allStudents)} className="btn-primary flex items-center gap-2 text-sm"><Lock size={14} /> Assinatura Eletronica</button>
            <button onClick={() => printManual(allStudents)} className="btn-secondary flex items-center gap-2 text-sm"><Printer size={14} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} /> Exportar</button>
          </div>
        )}
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="flex gap-3 mb-5">
        <select className="input w-56" value={selSchool} onChange={e => setSelSchool(e.target.value)}>
          <option value="">Todas as escolas</option>
          {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por nome ou matricula..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allStudents.map((s: any) => {
          const school = allSchools.find((sc: any) => sc.id === s.schoolId);
          return (
            <div key={s.id} className="rounded-xl border-2 border-primary-500 p-4 bg-gradient-to-br from-[#f0f4f8] to-[#e6f7f6] relative group">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
                {munReport?.municipality?.logoUrl && <img src={munReport.municipality.logoUrl} className="w-7 h-7 object-contain" alt="" />}
                <div className="flex-1 text-center leading-tight">
                  {munReport?.municipality?.state && <p className="text-[7px] text-gray-500">ESTADO DO {munReport.municipality.state.toUpperCase()}</p>}
                  <p className="text-[8px] font-bold text-primary-700 uppercase">{munReport?.municipality?.name || 'Prefeitura'}</p>
                  {munReport?.secretaria?.name && <p className="text-[7px] text-gray-500">{munReport.secretaria.name}</p>}
                  <p className="text-[8px] font-semibold text-gray-700">{school?.name || ''}</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-primary-600 uppercase text-center mb-2 pb-1 border-b-2 border-accent-500 tracking-wider">Carteira Estudantil</p>
              <div className="flex gap-3">
                <div className="w-16 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400 flex-shrink-0 overflow-hidden">
                  {s.photoUrl ? <img src={s.photoUrl} className="w-full h-full object-cover" /> : s.name?.[0]}
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                  <p className="text-gray-600"><b>Mat:</b> {s.enrollment || '\u2014'}</p>
                  <p className="text-gray-600"><b>Serie:</b> {s.grade || '\u2014'} | <b>Turma:</b> {s.classRoom || '\u2014'}</p>
                  <p className="text-gray-600"><b>Turno:</b> {s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manha'}</p>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>Ano Letivo {new Date().getFullYear()}</span>
                <span>Mat: {s.enrollment || s.id}</span>
              </div>
              {/* Botões individuais */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); printManual([s]); }} className="w-7 h-7 rounded-lg bg-white/90 border border-gray-300 flex items-center justify-center hover:bg-gray-100" title="Imprimir individual">
                  <Printer size={12} className="text-gray-600" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); openSignModal([s]); }} className="w-7 h-7 rounded-lg bg-white/90 border border-primary-300 flex items-center justify-center hover:bg-primary-50" title="Assinar eletronicamente">
                  <Lock size={12} className="text-primary-600" />
                </button>
              </div>
            </div>
          );
        })}
        {!allStudents.length && <div className="col-span-3 card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum aluno encontrado</p></div>}
      </div>

      {/* Modal de assinatura eletrônica */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSignModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2"><Lock size={18} className="text-accent-500" /> Assinatura Eletronica</h3>
                <p className="text-sm text-gray-500 mt-1">{signTarget.length === 1 ? signTarget[0].name : `${signTarget.length} carteirinha(s)`}</p>
              </div>
              <button onClick={() => setShowSignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); generateSignedPDF(); }} className="p-5 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200">
                <p className="text-xs text-blue-700"><strong>Assinante:</strong> {user?.name} ({user?.email})</p>
                {selectedSigs.map((sig, i) => (
                  <p key={i} className="text-xs text-blue-600 mt-1">{sig.name} - {sig.role}{sig.decree ? ` (${sig.decree})` : ''}</p>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha de Confirmacao <span className="text-red-500">*</span></label>
                <input type="password" id="signPasswordInput" value={signPassword} onChange={e => setSignPassword(e.target.value)} placeholder="Digite sua senha para assinar" className="input w-full" autoComplete="off" ref={el => { if (el) setTimeout(() => el.focus(), 100); }} />
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border border-yellow-200">
                <p className="text-xs text-yellow-800 leading-relaxed"><strong>Aviso Legal:</strong> Ao assinar, voce confirma a autenticidade das carteirinhas conforme MP 2.200-2/2001 e Lei 14.063/2020. O documento tera codigo de verificacao unico e QR Code para validacao publica.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSignModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={signing || !signPassword.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  {signing ? <><Loader2 size={16} className="animate-spin" /> Assinando...</> : <><Lock size={16} /> Assinar {signTarget.length > 1 ? `(${signTarget.length})` : ''}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
