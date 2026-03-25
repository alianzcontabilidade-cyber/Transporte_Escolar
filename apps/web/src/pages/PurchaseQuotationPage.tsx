import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { ShoppingCart, Plus, X, Trash2, Printer, Download, Upload, FileSpreadsheet, Send, Save, FolderOpen, ChevronDown } from 'lucide-react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

interface QuotationItem {
  id: number;
  description: string;
  unit: string;
  quantity: number;
  supplier1Price: number;
  supplier2Price: number;
  supplier3Price: number;
}

export default function PurchaseQuotationPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [suppliers, setSuppliers] = useState(['Fornecedor 1', 'Fornecedor 2', 'Fornecedor 3']);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => { if (mid) getMunicipalityReport(mid, api).then(setMunReport).catch(() => {}); }, [mid]);
  const [title, setTitle] = useState('Cotação de Preços - ' + new Date().toLocaleDateString('pt-BR'));
  const [newItem, setNewItem] = useState({ description: '', unit: 'un', quantity: 1 });
  const [importMsg, setImportMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  // --- API state ---
  const [quotationId, setQuotationId] = useState<number | null>(null);
  const [showSavedList, setShowSavedList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const { data: savedQuotations, refetch: refetchQuotations } = useQuery(
    () => mid ? api.quotations.list({ municipalityId: mid }) : Promise.resolve([]),
    [mid]
  );
  const allSavedQuotations = (savedQuotations as any[]) || [];

  const createQuotationMut = useMutation(api.quotations.create);
  const updateQuotationMut = useMutation(api.quotations.update);
  const createItemMut = useMutation(api.quotationItems.create);
  const deleteQuotationMut = useMutation(api.quotations.delete);

  // Save quotation to API
  const saveQuotation = async () => {
    if (!mid || items.length === 0) return;
    setSaving(true);
    setSaveMsg('');
    try {
      let qId = quotationId;
      if (qId) {
        // Update existing quotation header
        await updateQuotationMut.mutate({ id: qId, title, supplier1Name: suppliers[0], supplier2Name: suppliers[1], supplier3Name: suppliers[2] });
        // Delete old items and re-create (simplest approach)
        const existingItems: any[] = await api.quotationItems.list({ quotationId: qId });
        for (const ei of existingItems) {
          await api.quotationItems.delete({ id: ei.id });
        }
      } else {
        // Create new quotation
        const created: any = await createQuotationMut.mutate({
          municipalityId: mid,
          title,
          supplier1Name: suppliers[0],
          supplier2Name: suppliers[1],
          supplier3Name: suppliers[2],
        });
        qId = created?.id;
        if (!qId) throw new Error('Falha ao criar cotação');
        setQuotationId(qId);
      }

      // Save each item
      for (const item of items) {
        await createItemMut.mutate({
          quotationId: qId,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          supplier1Price: item.supplier1Price,
          supplier2Price: item.supplier2Price,
          supplier3Price: item.supplier3Price,
        });
      }

      setSaveMsg('Cotação salva com sucesso!');
      refetchQuotations();
    } catch (err: any) {
      setSaveMsg('Erro ao salvar: ' + (err?.message || 'Falha desconhecida'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  // Load a saved quotation
  const loadSavedQuotation = async (id: number) => {
    try {
      const q: any = await api.quotations.getById({ id });
      if (!q) return;
      setQuotationId(q.id);
      setTitle(q.title || '');
      setSuppliers([q.supplier1Name || 'Fornecedor 1', q.supplier2Name || 'Fornecedor 2', q.supplier3Name || 'Fornecedor 3']);

      const loadedItems: any[] = await api.quotationItems.list({ quotationId: q.id });
      setItems(
        (loadedItems || []).map((it: any, idx: number) => ({
          id: it.id || Date.now() + idx,
          description: it.description || '',
          unit: it.unit || 'un',
          quantity: it.quantity || 1,
          supplier1Price: parseFloat(it.supplier1Price) || 0,
          supplier2Price: parseFloat(it.supplier2Price) || 0,
          supplier3Price: parseFloat(it.supplier3Price) || 0,
        }))
      );
      setShowSavedList(false);
    } catch (err: any) {
      setSaveMsg('Erro ao carregar cotação: ' + (err?.message || ''));
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  // Delete a saved quotation
  const deleteSavedQuotation = async (id: number) => {
    if (!confirm('Excluir esta cotação salva?')) return;
    try {
      await deleteQuotationMut.mutate({ id });
      if (quotationId === id) {
        setQuotationId(null);
      }
      refetchQuotations();
    } catch {}
  };

  // New blank quotation
  const newQuotation = () => {
    setQuotationId(null);
    setItems([]);
    setTitle('Cotação de Preços - ' + new Date().toLocaleDateString('pt-BR'));
    setSuppliers(['Fornecedor 1', 'Fornecedor 2', 'Fornecedor 3']);
  };

  // Exportar planilha modelo para enviar ao fornecedor
  const exportModelSheet = (supplierIndex: number) => {
    const supplierName = suppliers[supplierIndex] || 'Fornecedor';
    const header = 'Item;Descricao;Unidade;Quantidade;Preco Unitario (R$)';
    const rows = items.map((item, i) => `${i + 1};"${item.description}";${item.unit};${item.quantity};`);
    const csv = header + '\n' + rows.join('\n') + '\n\n;;;;;TOTAL:\n\nINSTRUCOES:\n- Preencha a coluna "Preco Unitario" com o valor unitario de cada item\n- Nao altere as colunas Item, Descricao, Unidade e Quantidade\n- Salve o arquivo e devolva para a prefeitura\n- Cotacao: ' + title + '\n- Fornecedor: ' + supplierName;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cotacao_' + supplierName.replace(/\s/g, '_') + '.csv';
    a.click();
  };

  // Importar planilha preenchida pelo fornecedor
  const importFilledSheet = (e: any, supplierIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      let imported = 0;
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 5) continue;
        const itemNum = parseInt(cols[0]);
        const price = parseFloat(cols[4]?.replace(',', '.') || '0');
        if (isNaN(itemNum) || itemNum < 1 || itemNum > items.length) continue;
        if (isNaN(price) || price <= 0) continue;
        const supplierKey = 'supplier' + (supplierIndex + 1) + 'Price';
        const targetItem = items[itemNum - 1];
        if (targetItem) {
          updatePrice(targetItem.id, supplierKey, price);
          imported++;
        }
      }
      setImportMsg(imported > 0 ? `${imported} preço(s) importado(s) para ${suppliers[supplierIndex]}!` : 'Nenhum preço encontrado no arquivo. Verifique o formato.');
      setTimeout(() => setImportMsg(''), 5000);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const addItem = () => {
    if (!newItem.description) return;
    setItems(prev => [...prev, { id: Date.now(), description: newItem.description, unit: newItem.unit, quantity: newItem.quantity, supplier1Price: 0, supplier2Price: 0, supplier3Price: 0 }]);
    setNewItem({ description: '', unit: 'un', quantity: 1 });
  };

  const updatePrice = (itemId: number, supplier: string, price: number) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, [supplier]: price } : item));
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const getTotal = (supplier: string) => items.reduce((sum, item) => sum + (item as any)[supplier] * item.quantity, 0);
  const getWinner = () => {
    const totals = [getTotal('supplier1Price'), getTotal('supplier2Price'), getTotal('supplier3Price')];
    const min = Math.min(...totals.filter(t => t > 0));
    return totals.indexOf(min);
  };

  const printQuotation = () => {
    const winner = getWinner();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px;font-size:18px}
    table{width:100%;border-collapse:collapse;margin-top:15px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px;text-align:center}
    td{padding:6px 8px;border:1px solid #ddd;text-align:center}tr:nth-child(even){background:#f8f9fa}
    .winner{background:#d1fae5!important;font-weight:bold}.total{font-weight:bold;background:#f0f9ff}
    .footer{margin-top:30px;text-align:center;font-size:10px;color:#999}
    .signatures{display:flex;justify-content:space-between;margin-top:60px}
    .sig{text-align:center;width:180px;border-top:1px solid #333;padding-top:5px;font-size:11px}
    @media print{body{padding:15px}}</style></head><body>
    <h1>${title}</h1><p style="font-size:12px;color:#666">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
    <table><thead><tr><th>Item</th><th>Descrição</th><th>Unid.</th><th>Qtd.</th><th>${suppliers[0]}</th><th>${suppliers[1]}</th><th>${suppliers[2]}</th></tr></thead>
    <tbody>${items.map((item, i) => {
      const prices = [item.supplier1Price, item.supplier2Price, item.supplier3Price];
      const minPrice = Math.min(...prices.filter(p => p > 0));
      return `<tr><td>${i+1}</td><td style="text-align:left">${item.description}</td><td>${item.unit}</td><td>${item.quantity}</td>${prices.map((p, j) => `<td class="${p === minPrice && p > 0 ? 'winner' : ''}">R$ ${(p * item.quantity).toFixed(2)}</td>`).join('')}</tr>`;
    }).join('')}
    <tr class="total"><td colspan="4" style="text-align:right"><b>TOTAL</b></td><td class="${winner === 0 ? 'winner' : ''}">R$ ${getTotal('supplier1Price').toFixed(2)}</td><td class="${winner === 1 ? 'winner' : ''}">R$ ${getTotal('supplier2Price').toFixed(2)}</td><td class="${winner === 2 ? 'winner' : ''}">R$ ${getTotal('supplier3Price').toFixed(2)}</td></tr>
    </tbody></table>
    <p style="margin-top:15px;font-size:12px"><b>Menor preço global:</b> ${suppliers[winner]} - R$ ${[getTotal('supplier1Price'), getTotal('supplier2Price'), getTotal('supplier3Price')][winner]?.toFixed(2)}</p>
    <div class="signatures"><div class="sig">Responsável pela Cotação</div><div class="sig">Ordenador de Despesa</div><div class="sig">Prefeito(a)</div></div>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const handleExportClick = () => {
    const winner = getWinner();
    const rows = items.map((item: any, i: number) => ({
      num: i + 1,
      descricao: item.description || '--',
      unidade: item.unit || 'un',
      quantidade: item.quantity,
      forn1: 'R$ ' + (item.supplier1Price * item.quantity).toFixed(2),
      forn2: 'R$ ' + (item.supplier2Price * item.quantity).toFixed(2),
      forn3: 'R$ ' + (item.supplier3Price * item.quantity).toFixed(2),
    }));
    const cols = ['#', 'Descricao', 'Unid.', 'Qtd.', suppliers[0], suppliers[1], suppliers[2]];
    const html = buildTableReportHTML(title, rows, cols, munReport, {
      summary: `Menor preco global: ${suppliers[winner]} - R$ ${[getTotal('supplier1Price'), getTotal('supplier2Price'), getTotal('supplier3Price')][winner]?.toFixed(2)}`,
      orientation: 'landscape',
      signatories: selectedSigs,
    });
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'cotacao_compras' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><ShoppingCart size={20} className="text-sky-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Cotação de Compras</h1><p className="text-gray-500">Compare preços de até 3 fornecedores{quotationId ? ` (ID: ${quotationId})` : ''}</p></div></div>
        <div className="flex gap-2">
          <button onClick={newQuotation} className="btn-secondary flex items-center gap-2 text-sm"><Plus size={16} /> Nova Cotação</button>
          <button onClick={() => setShowSavedList(!showSavedList)} className="btn-secondary flex items-center gap-2 text-sm"><FolderOpen size={16} /> Cotações Salvas <ChevronDown size={14} /></button>
          {items.length > 0 && (
            <>
              <button onClick={saveQuotation} disabled={saving} className="btn-primary flex items-center gap-2 text-sm"><Save size={16} /> {saving ? 'Salvando...' : 'Salvar Cotação'}</button>
              <button onClick={printQuotation} className="btn-primary flex items-center gap-2 text-sm"><Printer size={16} /> Imprimir</button>
              <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2 text-sm"><Download size={16} /> Exportar</button>
            </>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${saveMsg.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{saveMsg}</div>
      )}

      {/* Saved quotations list */}
      {showSavedList && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FolderOpen size={16} /> Cotações Salvas ({allSavedQuotations.length})</h3>
          {allSavedQuotations.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma cotação salva ainda.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allSavedQuotations.map((q: any) => (
                <div key={q.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${quotationId === q.id ? 'border-sky-300 bg-sky-50' : 'border-gray-200'}`}>
                  <div className="flex-1" onClick={() => loadSavedQuotation(q.id)}>
                    <p className="font-medium text-gray-800 text-sm">{q.title}</p>
                    <p className="text-xs text-gray-500">
                      {q.supplier1Name} / {q.supplier2Name} / {q.supplier3Name}
                      {q.createdAt ? ` - ${new Date(q.createdAt).toLocaleDateString('pt-BR')}` : ''}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteSavedQuotation(q.id); }} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      {/* Title and Suppliers */}
      <div className="card mb-4">
        <div className="grid grid-cols-4 gap-3">
          <div><label className="label">Título da cotação</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></div>
          {suppliers.map((s, i) => (
            <div key={i}><label className="label">Fornecedor {i + 1}</label><input className="input" value={s} onChange={e => { const n = [...suppliers]; n[i] = e.target.value; setSuppliers(n); }} /></div>
          ))}
        </div>
      </div>

      {/* Add item */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Plus size={16} /> Adicionar Item</h3>
        <div className="flex gap-3">
          <input className="input flex-1" placeholder="Descrição do item" value={newItem.description} onChange={e => setNewItem(f => ({ ...f, description: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addItem()} />
          <select className="input w-24" value={newItem.unit} onChange={e => setNewItem(f => ({ ...f, unit: e.target.value }))}><option>un</option><option>kg</option><option>l</option><option>m</option><option>cx</option><option>pct</option><option>rl</option></select>
          <input className="input w-24" type="number" min="1" value={newItem.quantity} onChange={e => setNewItem(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
          <button onClick={addItem} className="btn-primary px-4"><Plus size={16} /></button>
        </div>
      </div>

      {/* Exportar/Importar planilhas para fornecedores */}
      {items.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FileSpreadsheet size={16} /> Planilhas para Fornecedores</h3>
          <p className="text-sm text-gray-500 mb-4">Exporte a planilha modelo, envie ao fornecedor para preencher os preços, e depois importe a planilha preenchida de volta.</p>
          <div className="grid grid-cols-3 gap-4">
            {suppliers.map((s, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">{s}</p>
                <div className="space-y-2">
                  <button onClick={() => exportModelSheet(i)} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm transition-colors">
                    <Send size={14} /> Gerar Planilha para Enviar
                  </button>
                  <label className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm transition-colors cursor-pointer">
                    <Upload size={14} /> Importar Planilha Preenchida
                    <input type="file" accept=".csv,.txt" onChange={e => importFilledSheet(e, i)} className="hidden" />
                  </label>
                </div>
              </div>
            ))}
          </div>
          {importMsg && <div className={`mt-3 p-3 rounded-lg text-sm ${importMsg.includes('Nenhum') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>{importMsg}</div>}
        </div>
      )}

      {/* Quotation table */}
      {items.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
              <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase w-16">Unid</th>
              <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase w-16">Qtd</th>
              {suppliers.map((s, i) => <th key={i} className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase w-32">{s}</th>)}
              <th className="w-10"></th>
            </tr></thead>
            <tbody className="divide-y">{items.map((item, idx) => {
              const prices = [item.supplier1Price, item.supplier2Price, item.supplier3Price];
              const minPrice = Math.min(...prices.filter(p => p > 0));
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{item.description}</td>
                  <td className="px-2 py-2 text-center text-gray-500">{item.unit}</td>
                  <td className="px-2 py-2 text-center text-gray-600 font-medium">{item.quantity}</td>
                  {['supplier1Price', 'supplier2Price', 'supplier3Price'].map((key, i) => (
                    <td key={i} className={`px-2 py-2 ${(item as any)[key] === minPrice && (item as any)[key] > 0 ? 'bg-green-50' : ''}`}>
                      <input type="number" step="0.01" min="0" value={(item as any)[key] || ''} onChange={e => updatePrice(item.id, key, parseFloat(e.target.value) || 0)}
                        className={`w-full text-center px-2 py-1 border rounded text-sm outline-none focus:ring-1 focus:ring-accent-400 ${(item as any)[key] === minPrice && (item as any)[key] > 0 ? 'border-green-300 bg-green-50 font-semibold text-green-700' : 'border-gray-200'}`} placeholder="0,00" />
                    </td>
                  ))}
                  <td className="px-2 py-2"><button onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></td>
                </tr>
              );
            })}</tbody>
            <tfoot className="bg-gray-50 border-t font-bold">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-gray-700">TOTAL</td>
                {[getTotal('supplier1Price'), getTotal('supplier2Price'), getTotal('supplier3Price')].map((total, i) => (
                  <td key={i} className={`px-2 py-3 text-center ${i === getWinner() && total > 0 ? 'text-green-700 bg-green-50' : 'text-gray-700'}`}>R$ {fmt(total)}</td>
                ))}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <div className="card text-center py-16"><ShoppingCart size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Adicione itens para começar a cotação</p></div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatório" : undefined} />
    </div>
  );
}