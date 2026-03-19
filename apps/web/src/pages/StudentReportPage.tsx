import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Search, Printer, Users } from 'lucide-react';

export default function StudentReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [selStudent, setSelStudent] = useState<any>(null);

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: munData } = useQuery(() => api.municipalities.getById({ id: mid }), [mid]);

  const allStudents = ((studentsData as any) || []).filter((s: any) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search));
  const allSchools = (schoolsData as any) || [];
  const getSchool = (id: number) => allSchools.find((s: any) => s.id === id);
  const mun = munData as any;

  const printReport = () => {
    if (!selStudent) return;
    const s = selStudent;
    const school = getSchool(s.schoolId);
    const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '--';
    const shift = s.shift === 'afternoon' ? 'Tarde' : s.shift === 'evening' ? 'Noite' : 'Manh\u00e3';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha do Aluno - ${s.name}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:30px;color:#333;max-width:800px;margin:0 auto}
      .header{text-align:center;border-bottom:3px solid #2DB5B0;padding-bottom:15px;margin-bottom:20px}
      .header h1{color:#1B3A5C;font-size:16px;margin:0}
      .header h2{font-size:13px;color:#666;margin:5px 0 0}
      .title{background:#1B3A5C;color:white;padding:8px 15px;font-size:14px;font-weight:bold;margin:20px 0 10px;border-radius:4px}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .field{padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:12px}
      .field-label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px}
      .field-value{font-size:13px;font-weight:500;margin-top:2px}
      .photo-area{width:100px;height:120px;border:2px dashed #ddd;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:30px;color:#ccc;float:right;margin-left:15px}
      .photo-area img{width:100%;height:100%;object-fit:cover;border-radius:6px}
      .footer{margin-top:30px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:10px}
      .signatures{display:flex;justify-content:space-between;margin-top:50px}
      .sig{text-align:center;width:180px;border-top:1px solid #333;padding-top:5px;font-size:11px}
      @media print{body{padding:15px}}
    </style></head><body>
    <div class="header">
      <h1>${school?.name || 'ESCOLA'}</h1>
      <h2>${mun?.name || 'Prefeitura Municipal'} - ${mun?.city || ''}/${mun?.state || ''}</h2>
    </div>

    <div class="photo-area">${s.photoUrl ? '<img src="'+s.photoUrl+'"/>' : s.name?.[0] || '?'}</div>

    <div class="title">DADOS PESSOAIS</div>
    <div class="grid">
      <div class="field"><div class="field-label">Nome completo</div><div class="field-value">${s.name}</div></div>
      <div class="field"><div class="field-label">Matr\u00edcula</div><div class="field-value">${s.enrollment || '--'}</div></div>
      <div class="field"><div class="field-label">Data de Nascimento</div><div class="field-value">${fmtDate(s.birthDate)}</div></div>
      <div class="field"><div class="field-label">S\u00e9rie/Ano</div><div class="field-value">${s.grade || '--'}</div></div>
      <div class="field"><div class="field-label">Turma</div><div class="field-value">${s.classRoom || '--'}</div></div>
      <div class="field"><div class="field-label">Turno</div><div class="field-value">${shift}</div></div>
    </div>

    <div class="title">ESCOLA</div>
    <div class="grid">
      <div class="field"><div class="field-label">Escola</div><div class="field-value">${school?.name || '--'}</div></div>
      <div class="field"><div class="field-label">C\u00f3digo INEP</div><div class="field-value">${school?.code || '--'}</div></div>
      <div class="field"><div class="field-label">Endere\u00e7o</div><div class="field-value">${s.address || '--'}</div></div>
    </div>

    <div class="title">SA\u00daDE</div>
    <div class="grid">
      <div class="field"><div class="field-label">Tipo Sangu\u00edneo</div><div class="field-value">${s.bloodType || '--'}</div></div>
      <div class="field"><div class="field-label">Necessidades Especiais</div><div class="field-value">${s.hasSpecialNeeds ? 'Sim' : 'N\u00e3o'}</div></div>
      <div class="field"><div class="field-label">Alergias</div><div class="field-value">${s.allergies || '--'}</div></div>
      <div class="field"><div class="field-label">Medicamentos</div><div class="field-value">${s.medications || '--'}</div></div>
      <div class="field"><div class="field-label">Observa\u00e7\u00f5es de Sa\u00fade</div><div class="field-value">${s.healthNotes || '--'}</div></div>
      ${s.hasSpecialNeeds && s.specialNeedsNotes ? '<div class="field"><div class="field-label">Detalhes Nec. Especiais</div><div class="field-value">'+s.specialNeedsNotes+'</div></div>' : ''}
    </div>

    <div class="title">CONTATOS DE EMERG\u00caNCIA</div>
    <div class="grid2">
      <div class="field"><div class="field-label">Contato 1 - Nome</div><div class="field-value">${s.emergencyContact1Name || '--'}</div></div>
      <div class="field"><div class="field-label">Contato 1 - Telefone</div><div class="field-value">${s.emergencyContact1Phone || '--'}</div></div>
      <div class="field"><div class="field-label">Contato 1 - Parentesco</div><div class="field-value">${s.emergencyContact1Relation || '--'}</div></div>
      <div class="field"><div class="field-label">Contato 2 - Nome</div><div class="field-value">${s.emergencyContact2Name || '--'}</div></div>
      <div class="field"><div class="field-label">Contato 2 - Telefone</div><div class="field-value">${s.emergencyContact2Phone || '--'}</div></div>
      <div class="field"><div class="field-label">Contato 2 - Parentesco</div><div class="field-value">${s.emergencyContact2Relation || '--'}</div></div>
    </div>

    <div class="signatures">
      <div class="sig">Respons\u00e1vel</div>
      <div class="sig">Secret\u00e1rio(a)</div>
      <div class="sig">Diretor(a)</div>
    </div>

    <div class="footer">Ficha gerada pelo NetEscol em ${new Date().toLocaleString('pt-BR')} | ${school?.name || ''}</div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><FileText size={20} className="text-indigo-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Ficha do Aluno</h1><p className="text-gray-500">Ficha completa para impress\u00e3o</p></div></div>
        {selStudent && <button onClick={printReport} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir Ficha</button>}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="space-y-1 max-h-[65vh] overflow-y-auto">{allStudents.slice(0, 50).map((s: any) => (
            <button key={s.id} onClick={() => setSelStudent(s)} className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selStudent?.id === s.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">{s.name?.[0]}</div>
              <div className="min-w-0"><p className="text-sm font-medium truncate">{s.name}</p>{s.enrollment && <p className="text-xs text-gray-400">Mat. {s.enrollment}</p>}</div>
            </button>
          ))}</div>
        </div>
        <div className="col-span-2">
          {selStudent ? (
            <div>
              <div className="card mb-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">{selStudent.photoUrl ? <img src={selStudent.photoUrl} className="w-full h-full rounded-full object-cover" /> : selStudent.name?.[0]}</div><div><h2 className="text-lg font-bold">{selStudent.name}</h2><p className="text-indigo-200">{selStudent.enrollment ? 'Mat. ' + selStudent.enrollment : ''} · {selStudent.grade || ''} · {selStudent.shift === 'afternoon' ? 'Tarde' : selStudent.shift === 'evening' ? 'Noite' : 'Manh\u00e3'}</p></div></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[['Escola', getSchool(selStudent.schoolId)?.name || selStudent.school || '--'],['Matr\u00edcula', selStudent.enrollment || '--'],['S\u00e9rie', selStudent.grade || '--'],['Turma', selStudent.classRoom || '--'],['Nascimento', selStudent.birthDate ? new Date(selStudent.birthDate).toLocaleDateString('pt-BR') : '--'],['Endere\u00e7o', selStudent.address || '--'],['Tipo Sangu\u00edneo', selStudent.bloodType || '--'],['Nec. Especiais', selStudent.hasSpecialNeeds ? 'Sim' : 'N\u00e3o'],['Alergias', selStudent.allergies || '--'],['Contato 1', (selStudent.emergencyContact1Name || '--') + ' - ' + (selStudent.emergencyContact1Phone || '')],['Contato 2', (selStudent.emergencyContact2Name || '--') + ' - ' + (selStudent.emergencyContact2Phone || '')]].map(([label, value]) => (
                  <div key={label as string} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-20"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione um aluno para ver a ficha</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
