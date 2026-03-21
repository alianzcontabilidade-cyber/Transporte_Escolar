import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Ticket, Plus, X, Search, Clock, CheckCircle, AlertTriangle, Printer , Download } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';

interface Protocol {
  id: number;
  number: string;
  date: string;
  requester: string;
  type: string;
  subject: string;
  description: string;
  status: string;
  response: string;
}

const TYPES = ['Requerimento', 'Reclamação', 'Solicitação', 'Denúncia', 'Informação', 'Documento', 'Outro'];
const STATUS_MAP: any = { aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700' }, andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700' }, concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700' }, cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600' } };

export default function ProtocolPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ requester: '', type: 'Requerimento', subject: '', description: '' });
  const [protocols, setProtocols] = useState<Protocol[]>(() => {
    try { return JSON.parse(localStorage.getItem('netescol_protocols_' + mid) || '[]'); } catch { return []; }
  });
  const [viewProtocol, setViewProtocol] = useState<Protocol | null>(null);
  const [responseText, setResponseText] = useState('');
  const [protoExportModal, setProtoExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);

  const saveProtocols = (p: Protocol[]) => { setProtocols(p); localStorage.setItem('netescol_protocols_' + mid, JSON.stringify(p)); };
  const sf = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const generateNumber = () => {
    const year = new Date().getFullYear();
    const seq = protocols.filter(p => p.number.includes(String(year))).length + 1;
    return String(seq).padStart(4, '0') + '/' + year;
  };

  const addProtocol = () => {
    if (!form.requester || !form.subject) return;
    const p: Protocol = { id: Date.now(), number: generateNumber(), date: new Date().toISOString(), requester: form.requester, type: form.type, subject: form.subject, description: form.description, status: 'aberto', response: '' };
    saveProtocols([p, ...protocols]);
    setShowModal(false);
    setForm({ requester: '', type: 'Requerimento', subject: '', description: '' });
  };

  const updateStatus = (id: number, status: string) => saveProtocols(protocols.map(p => p.id === id ? { ...p, status } : p));
  const addResponse = (id: number) => { saveProtocols(protocols.map(p => p.id === id ? { ...p, response: responseText, status: 'concluido' } : p)); setViewProtocol(null); setResponseText(''); };

  const filtered = protocols.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (search) { const q = search.toLowerCase(); return p.number.includes(q) || p.requester.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q); }
    return true;
  });

  const counts = { aberto: protocols.filter(p => p.status === 'aberto').length, andamento: protocols.filter(p => p.status === 'andamento').length, concluido: protocols.filter(p => p.status === 'concluido').length };

  const printProtocol = (p: Protocol) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Protocolo ${p.number}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:15px 0}.field{padding:10px;background:#f8f9fa;border-radius:6px;font-size:13px}.field-label{font-size:10px;color:#999}.field-value{font-weight:500;margin-top:3px}.desc{padding:15px;background:#f8f9fa;border-radius:8px;margin:15px 0;font-size:13px;line-height:1.6}.signatures{display:flex;justify-content:space-between;margin-top:60px}.sig{text-align:center;width:200px;border-top:1px solid #333;padding-top:5px;font-size:11px}.footer{margin-top:30px;text-align:center;font-size:10px;color:#999}@media print{body{padding:15px}}</style></head><body><h1>PROTOCOLO N\u00BA ${p.number}</h1><div class="grid"><div class="field"><div class="field-label">Data</div><div class="field-value">${new Date(p.date).toLocaleDateString('pt-BR')}</div></div><div class="field"><div class="field-label">Tipo</div><div class="field-value">${p.type}</div></div><div class="field"><div class="field-label">Requerente</div><div class="field-value">${p.requester}</div></div><div class="field"><div class="field-label">Status</div><div class="field-value">${STATUS_MAP[p.status]?.label || p.status}</div></div></div><div class="field"><div class="field-label">Assunto</div><div class="field-value">${p.subject}</div></div><div class="desc"><b>Descri\u00E7\u00E3o:</b><br>${p.description || '--'}</div>${p.response ? '<div class="desc"><b>Resposta/Parecer:</b><br>'+p.response+'</div>' : ''}<div class="signatures"><div class="sig">Requerente</div><div class="sig">Respons\u00E1vel</div></div><div class="footer">NetEscol - ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Ticket size={20} className="text-purple-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Protocolo</h1><p className="text-gray-500">{protocols.length} registro(s)</p></div></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Protocolo</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center bg-blue-50 border-0 cursor-pointer" onClick={() => setFilterStatus(filterStatus === 'aberto' ? '' : 'aberto')}><p className="text-2xl font-bold text-blue-600">{counts.aberto}</p><p className="text-xs text-gray-500">Abertos</p></div>
        <div className="card text-center bg-yellow-50 border-0 cursor-pointer" onClick={() => setFilterStatus(filterStatus === 'andamento' ? '' : 'andamento')}><p className="text-2xl font-bold text-yellow-600">{counts.andamento}</p><p className="text-xs text-gray-500">Em Andamento</p></div>
        <div className="card text-center bg-green-50 border-0 cursor-pointer" onClick={() => setFilterStatus(filterStatus === 'concluido' ? '' : 'concluido')}><p className="text-2xl font-bold text-green-600">{counts.concluido}</p><p className="text-xs text-gray-500">Conclu\u00EDdos</p></div>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por n\u00FAmero, requerente ou assunto..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id} className="card flex items-center gap-4 hover:border-primary-200 cursor-pointer" onClick={() => { setViewProtocol(p); setResponseText(p.response); }}>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0"><Ticket size={18} className="text-purple-600" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5"><span className="font-bold text-gray-800">#{p.number}</span><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[p.status]?.color || ''}`}>{STATUS_MAP[p.status]?.label || p.status}</span><span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{p.type}</span></div>
              <p className="text-sm text-gray-700 font-medium truncate">{p.subject}</p>
              <p className="text-xs text-gray-500">{p.requester} \u00B7 {new Date(p.date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="card text-center py-16"><Ticket size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum protocolo encontrado</p></div>}
      </div>

      {/* View/Respond Modal */}
      {viewProtocol && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b"><div><h3 className="text-lg font-semibold">Protocolo #{viewProtocol.number}</h3><p className="text-sm text-gray-500">{viewProtocol.type} \u00B7 {new Date(viewProtocol.date).toLocaleDateString('pt-BR')}</p></div><div className="flex gap-2"><button onClick={() => printProtocol(viewProtocol)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="Imprimir"><Printer size={18} /></button><button onClick={() => { const rows = [{ numero: viewProtocol.number, data: new Date(viewProtocol.date).toLocaleDateString('pt-BR'), tipo: viewProtocol.type, requerente: viewProtocol.requester, assunto: viewProtocol.subject, status: STATUS_MAP[viewProtocol.status]?.label || viewProtocol.status, descricao: viewProtocol.description || '--', resposta: viewProtocol.response || '--' }]; const cols = ['Numero', 'Data', 'Tipo', 'Requerente', 'Assunto', 'Status', 'Descricao', 'Resposta']; const html = buildTableReportHTML('PROTOCOLO N ' + viewProtocol.number, rows, cols, munReport, { orientation: 'portrait' }); if (html) setProtoExportModal({ html, filename: 'Protocolo_' + viewProtocol.number.replace('/', '-') }); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400" title="Exportar"><Download size={18} /></button><button onClick={() => setViewProtocol(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div></div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3"><div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Requerente</p><p className="text-sm font-medium">{viewProtocol.requester}</p></div><div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Status</p><p className="text-sm font-medium">{STATUS_MAP[viewProtocol.status]?.label}</p></div></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Assunto</p><p className="text-sm font-medium">{viewProtocol.subject}</p></div>
          {viewProtocol.description && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Descri\u00E7\u00E3o</p><p className="text-sm">{viewProtocol.description}</p></div>}
          <div>
            <label className="label">Resposta / Parecer</label>
            <textarea className="input" rows={4} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Digite a resposta ou parecer..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => updateStatus(viewProtocol.id, 'andamento')} className="flex-1 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-sm font-medium">Em Andamento</button>
            <button onClick={() => addResponse(viewProtocol.id)} className="flex-1 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium">Concluir</button>
          </div>
        </div>
      </div></div>)}

      {/* New Protocol Modal */}
      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">Novo Protocolo</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Requerente *</label><input className="input" value={form.requester} onChange={sf('requester')} placeholder="Nome do requerente" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={sf('type')}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label">N\u00FAmero</label><input className="input bg-gray-50" value={generateNumber()} readOnly /></div>
          </div>
          <div><label className="label">Assunto *</label><input className="input" value={form.subject} onChange={sf('subject')} placeholder="Assunto do protocolo" /></div>
          <div><label className="label">Descri\u00E7\u00E3o</label><textarea className="input" rows={4} value={form.description} onChange={sf('description')} placeholder="Descri\u00E7\u00E3o detalhada..." /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={addProtocol} className="btn-primary flex-1">Registrar</button></div>
      </div></div>)}

      <ExportModal open={!!protoExportModal} onClose={() => setProtoExportModal(null)} onExport={(fmt: ExportFormat) => { if (protoExportModal?.html) { handleExport(fmt, [], protoExportModal.html, protoExportModal.filename); } setProtoExportModal(null); }} title="Exportar Protocolo" />
    </div>
  );
}
