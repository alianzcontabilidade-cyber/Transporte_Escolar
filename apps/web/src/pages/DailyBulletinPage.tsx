import { useState, useEffect } from 'react';
import { showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Newspaper, Plus, X, Trash2, Pin, Printer , Download } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

interface Bulletin {
  id: number;
  date: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  author: string;
}

const CATEGORIES = [
  { v: 'aviso', l: 'Aviso', c: 'bg-blue-100 text-blue-700' },
  { v: 'comunicado', l: 'Comunicado', c: 'bg-green-100 text-green-700' },
  { v: 'urgente', l: 'Urgente', c: 'bg-red-100 text-red-700' },
  { v: 'lembrete', l: 'Lembrete', c: 'bg-yellow-100 text-yellow-700' },
  { v: 'informativo', l: 'Informativo', c: 'bg-purple-100 text-purple-700' },
];

export default function DailyBulletinPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'aviso' });
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);
  const [bulletins, setBulletins] = useState<Bulletin[]>(() => { try { return JSON.parse(localStorage.getItem('netescol_bulletins_' + mid) || '[]'); } catch { return []; } });

  const saveBulletins = (b: Bulletin[]) => { setBulletins(b); localStorage.setItem('netescol_bulletins_' + mid, JSON.stringify(b)); };
  const sf = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const add = () => {
    if (!form.title || !form.content) return;
    const b: Bulletin = { id: Date.now(), date: new Date().toISOString(), title: form.title, content: form.content, category: form.category, pinned: false, author: user?.name || '' };
    saveBulletins([b, ...bulletins]);
    setShowModal(false); setForm({ title: '', content: '', category: 'aviso' });
  };

  const togglePin = (id: number) => saveBulletins(bulletins.map(b => b.id === id ? { ...b, pinned: !b.pinned } : b));
  const remove = (id: number) => saveBulletins(bulletins.filter(b => b.id !== id));

  const sorted = [...bulletins].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date).getTime() - new Date(a.date).getTime());

  const printBulletin = () => {
    const today = bulletins.filter(b => new Date(b.date).toDateString() === new Date().toDateString() || b.pinned);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Mural do Dia - NetEscol</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;text-align:center;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    .item{margin:15px 0;padding:15px;border:1px solid #ddd;border-radius:8px;page-break-inside:avoid}
    .item h3{color:#1B3A5C;margin:0 0 5px}.item p{font-size:13px;line-height:1.6;margin:5px 0}
    .meta{font-size:11px;color:#999}.pinned{border-left:4px solid #2DB5B0}
    .footer{margin-top:20px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>MURAL INFORMATIVO</h1><p style="text-align:center;color:#666">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
    ${today.map(b => '<div class="item'+(b.pinned?' pinned':'')+'"><h3>'+(b.pinned?'📌 ':'')+b.title+'</h3><p>'+b.content+'</p><p class="meta">'+b.author+' · '+(CATEGORIES.find(c=>c.v===b.category)?.l||b.category)+'</p></div>').join('')}
    <div class="footer">NetEscol - ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const handleExportClick = () => {
    const rows = sorted.map((b: any) => ({
      data: new Date(b.date).toLocaleDateString('pt-BR'),
      titulo: b.title || '--',
      categoria: CATEGORIES.find(c => c.v === b.category)?.l || b.category,
      conteudo: b.content || '--',
      autor: b.author || '--',
      fixado: b.pinned ? 'Sim' : 'Nao',
    }));
    const cols = ['Data', 'Titulo', 'Categoria', 'Conteudo', 'Autor', 'Fixado'];
    const html = buildTableReportHTML('MURAL INFORMATIVO', rows, cols, munReport, { orientation: 'landscape', signatories: selectedSigs });
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'mural_informativo' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Newspaper size={20} className="text-emerald-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Mural Informativo</h1><p className="text-gray-500">{bulletins.length} publicação(ões)</p></div></div>
        <div className="flex gap-2">
          {bulletins.length > 0 && <><button onClick={printBulletin} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir Mural</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button></>}
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Publicar</button>
        </div>
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="space-y-3">
        {sorted.map(b => {
          const cat = CATEGORIES.find(c => c.v === b.category);
          return (
            <div key={b.id} className={`card ${b.pinned ? 'border-accent-300 bg-accent-50/20' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">{b.pinned && <Pin size={14} className="text-accent-500" />}<h3 className="font-bold text-gray-800">{b.title}</h3><span className={`text-xs px-2 py-0.5 rounded-full ${cat?.c || ''}`}>{cat?.l || b.category}</span></div>
                <div className="flex gap-1"><button onClick={() => togglePin(b.id)} className={`p-1.5 rounded-lg transition-colors ${b.pinned ? 'text-accent-500 bg-accent-50' : 'text-gray-400 hover:text-accent-500'}`} title={b.pinned ? 'Desafixar' : 'Fixar'}><Pin size={14} /></button><button onClick={() => remove(b.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button></div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">{b.content}</p>
              <p className="text-xs text-gray-400 mt-2">{b.author} · {new Date(b.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          );
        })}
        {!bulletins.length && <div className="card text-center py-16"><Newspaper size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma publicação no mural</p></div>}
      </div>

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">Nova Publicação</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Título *</label><input className="input" value={form.title} onChange={sf('title')} placeholder="Título da publicação" /></div>
          <div><label className="label">Categoria</label><select className="input" value={form.category} onChange={sf('category')}>{CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}</select></div>
          <div><label className="label">Conteúdo *</label><textarea className="input" rows={5} value={form.content} onChange={sf('content')} placeholder="Digite o conteúdo da publicação..." /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={add} className="btn-primary flex-1">Publicar</button></div>
      </div></div>)}
    
      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
