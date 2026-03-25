import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Users, Save, Printer, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

const BIMESTERS = [{ v: '1', l: '1° Bimestre' }, { v: '2', l: '2° Bimestre' }, { v: '3', l: '3° Bimestre' }, { v: '4', l: '4° Bimestre' }];

export default function ClassCouncilPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [selBimester, setSelBimester] = useState('1');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);
  const [notes, setNotes] = useState<Record<number, { decision: string; observations: string }>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [savingDb, setSavingDb] = useState(false);
  const [dbMsg, setDbMsg] = useState('');

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => selClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(selClass), status: 'active' }) : Promise.resolve([]), [mid, selClass]);

  const allClasses = (classesData as any) || [];
  const allEnrollments = (enrollmentsData as any) || [];

  const saveCouncilMut = useMutation(api.classCouncil.save);

  // Load council data from API
  const loadCouncil = async (classId: string, bim: string) => {
    if (!classId) { setNotes({}); setGeneralNotes(''); return; }
    try {
      const records: any[] = await api.classCouncil.list({ municipalityId: mid, classId: parseInt(classId), bimester: parseInt(bim) });
      const loaded: Record<number, { decision: string; observations: string }> = {};
      if (records && records.length > 0) {
        for (const r of records) {
          loaded[r.studentId] = {
            decision: r.decision || 'aprovado',
            observations: r.observations || '',
          };
        }
        // generalNotes comes from the first record (router returns it)
        setGeneralNotes(records[0]?.generalNotes || '');
      } else {
        setGeneralNotes('');
      }
      setNotes(loaded);
    } catch {
      setNotes({});
      setGeneralNotes('');
    }
  };

  const updateNote = (studentId: number, field: string, value: string) => {
    setNotes(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || { decision: 'aprovado', observations: '' }), [field]: value } }));
    setSaved(false);
  };

  const getNote = (studentId: number) => notes[studentId] || { decision: 'aprovado', observations: '' };

  const saveCouncil = async () => {
    setSaved(false);
    setDbMsg('');
    setSavingDb(true);

    try {
      const records = allEnrollments.map((e: any) => {
        const n = getNote(e.studentId);
        return {
          studentId: e.studentId,
          enrollmentId: e.id,
          decision: n.decision,
          observations: n.observations || '',
        };
      });

      await saveCouncilMut.mutate({
        municipalityId: mid,
        classId: parseInt(selClass),
        bimester: parseInt(selBimester),
        records,
        generalNotes,
      });

      setSaved(true);
      setDbMsg('Conselho de classe salvo com sucesso!');
    } catch (err: any) {
      setDbMsg('Erro ao salvar conselho: ' + (err?.message || 'Falha desconhecida'));
    } finally {
      setSavingDb(false);
      setTimeout(() => { setSaved(false); setDbMsg(''); }, 5000);
    }
  };

  const printCouncil = () => {
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const bimLabel = BIMESTERS.find(b => b.v === selBimester)?.l || '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Conselho de Classe</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;text-align:center;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    h2{text-align:center;color:#666;font-size:14px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px}
    td{padding:6px 8px;border:1px solid #ddd}tr:nth-child(even){background:#f8f9fa}
    .approved{color:#16a34a}.retained{color:#dc2626}.recovery{color:#d97706}
    .general{margin-top:20px;padding:15px;background:#f8f9fa;border-radius:8px;font-size:13px}
    .signatures{display:flex;justify-content:space-between;margin-top:60px}
    .sig{text-align:center;width:180px;border-top:1px solid #333;padding-top:5px;font-size:11px}
    .footer{margin-top:30px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>ATA DO CONSELHO DE CLASSE</h1>
    <h2>${cls?.fullName || ''} - ${cls?.schoolName || ''} | ${bimLabel}</h2>
    <p style="text-align:center;font-size:12px;color:#888">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
    <table><thead><tr><th>Nº</th><th>Aluno</th><th>Decisão</th><th>Observações</th></tr></thead>
    <tbody>${allEnrollments.map((e: any, i: number) => {
      const n = getNote(e.studentId);
      const cls2 = n.decision === 'aprovado' ? 'approved' : n.decision === 'retido' ? 'retained' : 'recovery';
      return '<tr><td>'+(i+1)+'</td><td>'+e.studentName+'</td><td class="'+cls2+'">'+(n.decision === 'aprovado' ? 'Aprovado' : n.decision === 'retido' ? 'Retido' : 'Recuperação')+'</td><td>'+(n.observations||'—')+'</td></tr>';
    }).join('')}</tbody></table>
    ${generalNotes ? '<div class="general"><b>Observações gerais:</b><br>'+generalNotes+'</div>' : ''}
    <div class="signatures"><div class="sig">Diretor(a)</div><div class="sig">Coordenador(a)</div><div class="sig">Secretário(a)</div></div>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const handleExportClick = () => {
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const bimLabel = BIMESTERS.find(b => b.v === selBimester)?.l || '';
    const rows = allEnrollments.map((e: any, i: number) => {
      const n = getNote(e.studentId);
      return {
        num: i + 1,
        aluno: e.studentName || '--',
        decisao: n.decision === 'aprovado' ? 'Aprovado' : n.decision === 'retido' ? 'Retido' : 'Recuperacao',
        observacoes: n.observations || '--',
      };
    });
    const cols = ['N', 'Aluno', 'Decisao', 'Observacoes'];
    const html = buildTableReportHTML('ATA DO CONSELHO DE CLASSE', rows, cols, munReport, {
      subtitle: `${cls?.fullName || ''} - ${cls?.schoolName || ''} | ${bimLabel}`,
      orientation: 'landscape',
      signatories: selectedSigs,
    });
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'conselho_classe' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Users size={20} className="text-purple-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Conselho de Classe</h1><p className="text-gray-500">Registro de decisões por aluno</p></div></div>
        {selClass && allEnrollments.length > 0 && (
          <div className="flex gap-2">
            <button onClick={saveCouncil} disabled={savingDb} className="btn-secondary flex items-center gap-2"><Save size={16} /> {savingDb ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={printCouncil} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir ATA</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {saved && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2"><CheckCircle size={16} /> Conselho de classe salvo!</div>}
      {dbMsg && <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${dbMsg.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{dbMsg.includes('Erro') ? <AlertTriangle size={16} /> : <CheckCircle size={16} />} {dbMsg}</div>}

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="flex gap-3 mb-5">
        <select className="input w-64" value={selClass} onChange={e => { setSelClass(e.target.value); loadCouncil(e.target.value, selBimester); }}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">{BIMESTERS.map(b => (
          <button key={b.v} onClick={() => { setSelBimester(b.v); if (selClass) loadCouncil(selClass, b.v); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selBimester === b.v ? 'bg-white shadow text-accent-600' : 'text-gray-500'}`}>{b.l}</button>
        ))}</div>
      </div>

      {selClass && allEnrollments.length > 0 ? (
        <div>
          <div className="card p-0 overflow-hidden mb-4">
            <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">Nº</th><th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Aluno</th><th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase w-40">Decisão</th><th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Observações</th></tr></thead>
            <tbody className="divide-y">{allEnrollments.map((e: any, i: number) => {
              const note = getNote(e.studentId);
              return (
                <tr key={e.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{e.studentName}</td>
                  <td className="px-3 py-2">
                    <select className={`w-full px-2 py-1.5 border rounded-lg text-sm font-medium outline-none ${note.decision === 'aprovado' ? 'border-green-300 text-green-700 bg-green-50' : note.decision === 'retido' ? 'border-red-300 text-red-700 bg-red-50' : 'border-yellow-300 text-yellow-700 bg-yellow-50'}`}
                      value={note.decision} onChange={ev => updateNote(e.studentId, 'decision', ev.target.value)}>
                      <option value="aprovado">Aprovado</option>
                      <option value="recuperacao">Recuperação</option>
                      <option value="retido">Retido</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent-400" value={note.observations} onChange={ev => updateNote(e.studentId, 'observations', ev.target.value)} placeholder="Observações..." />
                  </td>
                </tr>
              );
            })}</tbody></table>
          </div>
          <div className="card">
            <label className="label">Observações gerais do conselho</label>
            <textarea className="input" rows={4} value={generalNotes} onChange={e => { setGeneralNotes(e.target.value); setSaved(false); }} placeholder="Registre as observações gerais discutidas no conselho de classe..." />
          </div>
        </div>
      ) : selClass ? (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum aluno matriculado nesta turma</p></div>
      ) : (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para registrar o conselho de classe</p></div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}