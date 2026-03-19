import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { ShoppingCart, Plus, X, Trash2, Printer, Download } from 'lucide-react';

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
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [suppliers, setSuppliers] = useState(['Fornecedor 1', 'Fornecedor 2', 'Fornecedor 3']);
  const [title, setTitle] = useState('Cotação de Preços - ' + new Date().toLocaleDateString('pt-BR'));
  const [newItem, setNewItem] = useState({ description: '', unit: 'un', quantity: 1 });

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><ShoppingCart size={20} className="text-sky-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Cotação de Compras</h1><p className="text-gray-500">Compare preços de até 3 fornecedores</p></div></div>
        {items.length > 0 && <button onClick={printQuotation} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir Cotação</button>}
      </div>

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
    </div>
  );
}