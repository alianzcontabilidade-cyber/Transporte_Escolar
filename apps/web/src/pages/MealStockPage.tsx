import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Package, Plus, X, ArrowDown, ArrowUp, AlertTriangle, Printer, Search , Download } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

export default function MealStockPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: 'Alimento', unit: 'kg', currentStock: '0', minStock: '10', location: '' });
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);
  const [search, setSearch] = useState('');

  const { data: itemsData, refetch } = useQuery(() => api.inventory.list({ municipalityId: mid }), [mid]);
  const { mutate: createItem } = useMutation(api.inventory.create);
  const { mutate: addMovement } = useMutation(api.inventory.addMovement);
  const { mutate: deleteItem } = useMutation(api.inventory.delete);

  const allItems = ((itemsData as any) || []).filter((i: any) => !search || i.name?.toLowerCase().includes(search.toLowerCase()));
  const lowStock = allItems.filter((i: any) => (i.currentStock || 0) <= (i.minStock || 5));
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    if (!form.name) return;
    createItem({ municipalityId: mid, name: form.name, category: form.category || 'Alimento', unit: form.unit || 'kg', currentStock: parseInt(form.currentStock) || 0, minStock: parseInt(form.minStock) || 10, location: form.location || undefined },
      { onSuccess: () => { refetch(); setShowModal(false); setForm({ name: '', category: 'Alimento', unit: 'kg', currentStock: '0', minStock: '10', location: '' }); } });
  };

  const doMovement = (itemId: number, type: 'entrada' | 'saida') => {
    const qty = prompt(type === 'entrada' ? 'Quantidade a dar entrada:' : 'Quantidade a dar saída:');
    if (!qty || isNaN(parseInt(qty)) || parseInt(qty) <= 0) return;
    const notes = prompt('Observação (opcional):') || '';
    addMovement({ itemId, type, quantity: parseInt(qty), notes: notes || undefined },
      { onSuccess: () => refetch() });
  };

  const printStock = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Controle de Estoque - Merenda</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:15px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px;text-align:center}
    td{padding:6px 8px;border:1px solid #ddd;text-align:center}tr:nth-child(even){background:#f8f9fa}
    .low{color:#dc2626;font-weight:bold}.ok{color:#16a34a}
    .footer{margin-top:20px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>Controle de Estoque - Merenda Escolar</h1>
    <p style="font-size:12px;color:#666">Data: ${new Date().toLocaleDateString('pt-BR')} | ${allItems.length} item(ns)</p>
    <table><thead><tr><th>Item</th><th>Categoria</th><th>Unidade</th><th>Estoque Atual</th><th>Mínimo</th><th>Status</th></tr></thead>
    <tbody>${allItems.map((i: any) => {
      const isLow = (i.currentStock || 0) <= (i.minStock || 5);
      return `<tr><td style="text-align:left">${i.name}</td><td>${i.category || '--'}</td><td>${i.unit || 'un'}</td><td class="${isLow ? 'low' : 'ok'}">${i.currentStock || 0}</td><td>${i.minStock || 5}</td><td class="${isLow ? 'low' : 'ok'}">${isLow ? 'BAIXO' : 'OK'}</td></tr>`;
    }).join('')}</tbody></table>
    <p style="margin-top:15px;font-size:12px"><b>${lowStock.length}</b> item(ns) com estoque baixo</p>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const handleExportClick = () => {
    const rows = allItems.map((i: any) => ({
      item: i.name || '--',
      categoria: i.category || '--',
      unidade: i.unit || 'un',
      estoque: i.currentStock || 0,
      minimo: i.minStock || 5,
      status: (i.currentStock || 0) <= (i.minStock || 5) ? 'BAIXO' : 'OK',
    }));
    const cols = ['Item', 'Categoria', 'Unidade', 'Estoque Atual', 'Minimo', 'Status'];
    const html = buildTableReportHTML('CONTROLE DE ESTOQUE - MERENDA ESCOLAR', rows, cols, munReport, {
      summary: lowStock.length + ' item(ns) com estoque baixo',
      orientation: 'portrait',
      signatories: selectedSigs,
    });
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'estoque_merenda' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Package size={20} className="text-amber-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Estoque da Merenda</h1><p className="text-gray-500">{allItems.length} item(ns) cadastrado(s)</p></div></div>
        <div className="flex gap-2">
          {allItems.length > 0 && <><button onClick={printStock} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button></>}
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Item</button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card mb-4 bg-red-50 border-red-200 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600" />
          <div><p className="font-semibold text-red-800">{lowStock.length} item(ns) com estoque baixo!</p><p className="text-xs text-red-600">{lowStock.map((i: any) => i.name).join(', ')}</p></div>
        </div>
      )}

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid gap-3">
        {allItems.map((i: any) => {
          const isLow = (i.currentStock || 0) <= (i.minStock || 5);
          return (
            <div key={i.id} className={`card flex items-center gap-4 ${isLow ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><p className="font-semibold text-gray-800">{i.name}</p>{i.category && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{i.category}</span>}{isLow && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Baixo</span>}</div>
                <p className="text-xs text-gray-500">{i.unit || 'un'} · Mínimo: {i.minStock || 5}{i.location ? ' · Local: ' + i.location : ''}</p>
              </div>
              <div className="text-center px-4">
                <p className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{i.currentStock || 0}</p>
                <p className="text-[10px] text-gray-400">{i.unit || 'un'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => doMovement(i.id, 'entrada')} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors" title="Entrada"><ArrowDown size={18} /></button>
                <button onClick={() => doMovement(i.id, 'saida')} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors" title="Saída"><ArrowUp size={18} /></button>
              </div>
            </div>
          );
        })}
        {!allItems.length && <div className="card text-center py-16"><Package size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum item cadastrado</p></div>}
      </div>

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">Novo Item de Estoque</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Nome do item *</label><input className="input" value={form.name} onChange={sf('name')} placeholder="Ex: Arroz, Feijão, Óleo" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Categoria</label><select className="input" value={form.category} onChange={sf('category')}><option>Alimento</option><option>Bebida</option><option>Tempero</option><option>Limpeza</option><option>Descartável</option><option>Outro</option></select></div>
            <div><label className="label">Unidade</label><select className="input" value={form.unit} onChange={sf('unit')}><option>kg</option><option>un</option><option>l</option><option>pct</option><option>cx</option><option>lata</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Estoque inicial</label><input className="input" type="number" value={form.currentStock} onChange={sf('currentStock')} /></div>
            <div><label className="label">Estoque mínimo</label><input className="input" type="number" value={form.minStock} onChange={sf('minStock')} /></div>
          </div>
          <div><label className="label">Localização</label><input className="input" value={form.location} onChange={sf('location')} placeholder="Ex: Despensa A, Prateleira 2" /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    
      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
