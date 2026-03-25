import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Search, Printer, Users , Download } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

export default function EnrollmentFormPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [selStudent, setSelStudent] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: munData } = useQuery(() => api.municipalities.getById({ id: mid }), [mid]);

  const allStudents = ((studentsData as any) || []).filter((s: any) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search));
  const allSchools = (schoolsData as any) || [];
  const mun = munData as any;
  const getSchool = (id: number) => allSchools.find((s: any) => s.id === id);

  const printForm = (student?: any) => {
    const s = student || {};
    const school = getSchool(s.schoolId);
    const shift = s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : s.shift ? 'Manh\u00e3' : '________';
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '____/____/________';
    const line = (label: string, value: string, width?: string) => `<div class="field" style="${width ? 'width:'+width : ''}"><div class="field-label">${label}</div><div class="field-value">${value || '_'.repeat(40)}</div></div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha de Matr\u00edcula - NetEscol</title>
    <style>
      @page{size:A4;margin:12mm}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:20px 25px;color:#333;font-size:12px;line-height:1.4}
      .header{text-align:center;border-bottom:3px solid #2DB5B0;padding-bottom:12px;margin-bottom:15px}
      .header h1{color:#1B3A5C;font-size:14px;margin:0}
      .header h2{font-size:11px;color:#666;margin:3px 0 0}
      .header .logo{font-size:18px;font-weight:bold;color:#1B3A5C;margin-bottom:3px}
      .header .logo span{color:#2DB5B0}
      .title{background:#1B3A5C;color:white;padding:5px 12px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:15px 0 8px;border-radius:3px}
      .grid{display:grid;gap:6px}
      .grid-2{grid-template-columns:1fr 1fr}
      .grid-3{grid-template-columns:1fr 1fr 1fr}
      .grid-4{grid-template-columns:1fr 1fr 1fr 1fr}
      .field{padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;min-height:32px}
      .field-label{font-size:8px;color:#999;text-transform:uppercase;letter-spacing:0.5px}
      .field-value{font-size:11px;font-weight:500;margin-top:1px;min-height:14px}
      .checkbox{display:inline-flex;align-items:center;gap:4px;font-size:10px;margin-right:12px}
      .checkbox-box{width:12px;height:12px;border:1px solid #999;display:inline-block;text-align:center;font-size:9px;line-height:12px}
      .section-note{font-size:9px;color:#999;font-style:italic;margin:4px 0}
      .signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:40px}
      .sig{text-align:center;border-top:1px solid #333;padding-top:4px;font-size:10px;color:#666}
      .footer{margin-top:20px;text-align:center;font-size:8px;color:#bbb;border-top:1px solid #eee;padding-top:5px}
      @media print{body{padding:10px 15px}}
    </style></head><body>
    <div class="header">
      <div class="logo">Net<span>Escol</span></div>
      <h1>${school?.name || mun?.name || 'UNIDADE ESCOLAR'}</h1>
      <h2>${mun?.name || ''} - ${mun?.city || ''}/${mun?.state || ''}</h2>
    </div>

    <div style="text-align:center;font-size:14px;font-weight:bold;color:#1B3A5C;margin:10px 0;text-transform:uppercase;letter-spacing:2px">FICHA DE MATR\u00cdCULA</div>
    <div style="text-align:center;font-size:10px;color:#666;margin-bottom:15px">Ano Letivo: ${new Date().getFullYear()}</div>

    <div class="title">1. DADOS DO ALUNO</div>
    <div class="grid grid-2">
      ${line('Nome completo', s.name)}
      ${line('Data de nascimento', fmtDate(s.birthDate))}
    </div>
    <div class="grid grid-4" style="margin-top:6px">
      ${line('Matr\u00edcula', s.enrollment)}
      ${line('S\u00e9rie/Ano', s.grade)}
      ${line('Turma', s.classRoom || s.className)}
      ${line('Turno', shift)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${line('Naturalidade', '')}
      ${line('Nacionalidade', 'Brasileira')}
    </div>
    <div style="margin-top:6px;font-size:10px">
      <b>Sexo:</b> <span class="checkbox"><span class="checkbox-box"></span> Masculino</span> <span class="checkbox"><span class="checkbox-box"></span> Feminino</span>
      &nbsp;&nbsp;<b>Cor/Ra\u00e7a:</b> <span class="checkbox"><span class="checkbox-box"></span> Branca</span> <span class="checkbox"><span class="checkbox-box"></span> Parda</span> <span class="checkbox"><span class="checkbox-box"></span> Preta</span> <span class="checkbox"><span class="checkbox-box"></span> Amarela</span> <span class="checkbox"><span class="checkbox-box"></span> Ind\u00edgena</span>
    </div>

    <div class="title">2. ENDERE\u00c7O</div>
    <div class="grid grid-2">
      ${line('Endere\u00e7o completo', s.address)}
      ${line('Bairro', '')}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${line('Cidade', mun?.city || '')}
      ${line('Estado', mun?.state || '')}
      ${line('CEP', '')}
    </div>

    <div class="title">3. FILIA\u00c7\u00c3O</div>
    <div class="grid grid-2">
      ${line('Nome da m\u00e3e', '')}
      ${line('Nome do pai', '')}
    </div>

    <div class="title">4. RESPONS\u00c1VEL</div>
    <div class="grid grid-3">
      ${line('Nome', s.emergencyContact1Name)}
      ${line('Telefone', s.emergencyContact1Phone)}
      ${line('Parentesco', s.emergencyContact1Relation)}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${line('Nome (2\u00ba respons\u00e1vel)', s.emergencyContact2Name)}
      ${line('Telefone', s.emergencyContact2Phone)}
      ${line('Parentesco', s.emergencyContact2Relation)}
    </div>

    <div class="title">5. SA\u00daDE</div>
    <div class="grid grid-3">
      ${line('Tipo sangu\u00edneo', s.bloodType)}
      ${line('Alergias', s.allergies)}
      ${line('Medicamentos', s.medications)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${line('Necessidades especiais', s.hasSpecialNeeds ? 'Sim - ' + (s.specialNeedsNotes || '') : 'N\u00e3o')}
      ${line('Observa\u00e7\u00f5es de sa\u00fade', s.healthNotes)}
    </div>

    <div class="title">6. TRANSPORTE ESCOLAR</div>
    <div style="font-size:10px;margin:6px 0">
      <b>Utiliza transporte escolar?</b> <span class="checkbox"><span class="checkbox-box"></span> Sim</span> <span class="checkbox"><span class="checkbox-box"></span> N\u00e3o</span>
    </div>

    <div class="title">7. DECLARA\u00c7\u00c3O</div>
    <div style="font-size:10px;text-align:justify;margin:6px 0;line-height:1.5">
      Declaro que as informa\u00e7\u00f5es prestadas s\u00e3o verdadeiras e me responsabilizo por qualquer informa\u00e7\u00e3o incorreta. Comprometo-me a comunicar \u00e0 escola qualquer altera\u00e7\u00e3o nos dados acima. Autorizo a escola a utilizar a imagem do(a) aluno(a) em atividades pedag\u00f3gicas e eventos escolares.
    </div>

    <div style="text-align:right;font-size:11px;margin:20px 0">${mun?.city || '_________'}, ______ de _________________ de ${new Date().getFullYear()}</div>

    <div class="signatures">
      <div class="sig">Respons\u00e1vel Legal</div>
      <div class="sig">Secret\u00e1rio(a) Escolar</div>
      <div class="sig">Diretor(a)</div>
    </div>

    <div class="footer">NetEscol - Sistema de Gest\u00e3o Escolar Municipal | Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const handleExportClick = () => {
    const rows = allStudents.map((s: any) => ({
      nome: s.name || '--',
      matricula: s.enrollment || '--',
      serie: s.grade || '--',
      turma: s.classRoom || '--',
      turno: s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manha',
      escola: getSchool(s.schoolId)?.name || '--',
    }));
    const cols = ['Nome', 'Matricula', 'Serie', 'Turma', 'Turno', 'Escola'];
    const html = buildTableReportHTML('LISTA DE ALUNOS MATRICULADOS', rows, cols, munReport, { orientation: 'landscape', signatories: selectedSigs });
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'ficha_matricula' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><FileText size={20} className="text-indigo-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Ficha de Matr\u00edcula</h1><p className="text-gray-500">Formul\u00e1rio oficial para impress\u00e3o</p></div></div>
        <div className="flex gap-2">
          <button onClick={() => printForm()} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir em Branco</button>
          {selStudent && <button onClick={() => printForm(selStudent)} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir Preenchida</button>}
          <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
        </div>
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="space-y-1 max-h-[65vh] overflow-y-auto">
            {allStudents.slice(0, 50).map((s: any) => (
              <button key={s.id} onClick={() => setSelStudent(s)} className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selStudent?.id === s.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">{s.name?.[0]}</div>
                <div className="min-w-0"><p className="text-sm font-medium truncate">{s.name}</p>{s.enrollment && <p className="text-xs text-gray-400">Mat. {s.enrollment}</p>}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          {selStudent ? (
            <div className="card">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">{selStudent.name?.[0]}</div>
                <div><h2 className="text-lg font-bold text-gray-900">{selStudent.name}</h2><p className="text-sm text-gray-500">{selStudent.enrollment ? 'Mat. ' + selStudent.enrollment : ''} · {selStudent.grade || ''} · {getSchool(selStudent.schoolId)?.name || ''}</p></div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Clique em <b>"Imprimir Preenchida"</b> para imprimir a ficha com os dados deste aluno, ou <b>"Imprimir em Branco"</b> para um formul\u00e1rio vazio. Use <b>"Exportar"</b> para outros formatos.</p>
              <div className="grid grid-cols-2 gap-3">
                {[['Nome', selStudent.name],['Matr\u00edcula', selStudent.enrollment||'--'],['S\u00e9rie', selStudent.grade||'--'],['Turma', selStudent.classRoom||'--'],['Nascimento', selStudent.birthDate ? new Date(selStudent.birthDate).toLocaleDateString('pt-BR') : '--'],['Escola', getSchool(selStudent.schoolId)?.name||'--'],['Contato 1', (selStudent.emergencyContact1Name||'--')+' - '+(selStudent.emergencyContact1Phone||'')],['Tipo Sangu\u00edneo', selStudent.bloodType||'--']].map(([l,v]) => (
                  <div key={l as string} className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">{l}</p><p className="text-sm font-medium">{v}</p></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-20"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione um aluno ou imprima em branco</p></div>
          )}
        </div>
      </div>
    
      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
