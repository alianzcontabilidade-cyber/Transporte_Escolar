import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { DollarSign, Plus, X, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Search, Download, FileDown, Printer } from 'lucide-react';
import { loadMunicipalityData, openReportAsPDF, printReportHTML, generateReportHTML } from '../lib/reportTemplate';
import ExportModal, { handleExport as _handleExport, ExportFormat as _ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import { getBanks } from '../lib/cnpjCep';

const TYPES: any = { pdde: 'PDDE', proprio: 'Próprio', estadual: 'Estadual', federal: 'Federal', outro: 'Outro' };

export default function FinancialPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState<'accounts'|'transactions'>('accounts');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [formErr, setFormErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data: accts, refetch: rAccts } = useQuery(() => api.financialAccounts.list({ municipalityId: mid }), [mid]);
  const { data: txns, refetch: rTxns } = useQuery(() => api.financialTransactions.list({ municipalityId: mid }), [mid]);
  const { mutate: createAcct } = useMutation(api.financialAccounts.create);
  const { mutate: updateAcct } = useMutation(api.financialAccounts.update);
  const { mutate: deleteAcct } = useMutation(api.financialAccounts.delete);
  const { mutate: createTxn } = useMutation(api.financialTransactions.create);
  const { mutate: deleteTxn } = useMutation(api.financialTransactions.delete);

  const [banks, setBanks] = useState<any[]>([]);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  useEffect(() => { getBanks().then(b => setBanks(b)).catch(() => {}); }, []);
  useEffect(() => { if (mid) loadMunicipalityData(mid, api).then(setMunReport).catch(() => {}); }, [mid]);

  const allAccts = (accts as any) || [];
  const allTxns = (txns as any) || [];
  const totalBalance = allAccts.reduce((s: number, a: any) => s + (parseFloat(a.balance) || 0), 0);
  const totalReceita = allTxns.filter((t: any) => t.type === 'receita').reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);
  const totalDespesa = allTxns.filter((t: any) => t.type === 'despesa').reduce((s: number, t: any) => s + (parseFloat(t.value) || 0), 0);

  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const generateFinancialReport = () => {
    if (!munReport) return '';
    const acctRows = allAccts.map((a: any) => `<tr><td style="text-align:left">${a.name}</td><td>${a.type || '--'}</td><td>${a.bankName || '--'}</td><td style="text-align:right;font-weight:bold">${fmtMoney(parseFloat(a.balance) || 0)}</td></tr>`).join('');
    const txnRows = allTxns.slice(0, 50).map((t: any) => `<tr><td>${t.date ? new Date(t.date).toLocaleDateString('pt-BR') : '--'}</td><td style="text-align:left">${t.description || '--'}</td><td>${t.category || '--'}</td><td>${t.supplier || '--'}</td><td style="text-align:right;color:${t.type === 'receita' ? '#059669' : '#dc2626'};font-weight:bold">${t.type === 'receita' ? '+' : '-'}${fmtMoney(parseFloat(t.value) || 0)}</td></tr>`).join('');
    const content = `
      <div class="section-title">RESUMO FINANCEIRO</div>
      <div style="display:flex;gap:20px;margin:15px 0">
        <div style="flex:1;text-align:center;padding:15px;background:#f0f9ff;border-radius:8px"><p style="font-size:10px;color:#888">SALDO TOTAL</p><p style="font-size:18px;font-weight:bold;color:#1B3A5C">${fmtMoney(totalBalance)}</p></div>
        <div style="flex:1;text-align:center;padding:15px;background:#f0fdf4;border-radius:8px"><p style="font-size:10px;color:#888">RECEITAS</p><p style="font-size:18px;font-weight:bold;color:#059669">${fmtMoney(totalReceita)}</p></div>
        <div style="flex:1;text-align:center;padding:15px;background:#fef2f2;border-radius:8px"><p style="font-size:10px;color:#888">DESPESAS</p><p style="font-size:18px;font-weight:bold;color:#dc2626">${fmtMoney(totalDespesa)}</p></div>
      </div>
      <div class="section-title">CONTAS BANCÁRIAS</div>
      <table><thead><tr><th style="text-align:left">CONTA</th><th>TIPO</th><th>BANCO</th><th style="text-align:right">SALDO</th></tr></thead><tbody>${acctRows || '<tr><td colspan="4" style="color:#999;text-align:center">Nenhuma conta cadastrada</td></tr>'}</tbody></table>
      <div class="section-title">MOVIMENTAÇÕES</div>
      <table><thead><tr><th>DATA</th><th style="text-align:left">DESCRIÇÃO</th><th>CATEGORIA</th><th>FORNECEDOR</th><th style="text-align:right">VALOR</th></tr></thead><tbody>${txnRows || '<tr><td colspan="5" style="color:#999;text-align:center">Nenhuma movimentação</td></tr>'}</tbody></table>
    `;
    return generateReportHTML({ municipality: munReport.municipality, secretaria: munReport.secretaria, title: 'RELATÓRIO FINANCEIRO', subtitle: 'Período: ' + new Date().getFullYear(), content, signatories: selectedSigs, fontFamily: 'sans-serif', fontSize: 11 });
  };

  const openNewAcct = () => { setForm({ name: '', type: 'proprio', bankName: '', agency: '', accountNumber: '', balance: '' }); setEditId(null); setFormErr(''); setShowModal(true); };
  const openNewTxn = () => { setForm({ accountId: '', type: 'despesa', category: '', description: '', value: '', date: new Date().toISOString().split('T')[0], documentNumber: '', supplier: '' }); setEditId(null); setFormErr(''); setShowModal(true); };

  const save = () => {
    if (tab === 'accounts') {
      if (!form.name) { setFormErr('Nome obrigatorio'); return; }
      const p = { municipalityId: mid, name: form.name, type: form.type, bankName: form.bankName || undefined, agency: form.agency || undefined, accountNumber: form.accountNumber || undefined, balance: form.balance ? parseFloat(form.balance) : undefined };
      const cb = { onSuccess: () => { rAccts(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') };
      editId ? updateAcct({ id: editId, ...p }, cb) : createAcct(p, cb);
    } else {
      if (!form.accountId || !form.value || !form.category) { setFormErr('Conta, valor e categoria obrigatorios'); return; }
      createTxn({ municipalityId: mid, accountId: parseInt(form.accountId), type: form.type, category: form.category, description: form.description || undefined, value: parseFloat(form.value), date: form.date, documentNumber: form.documentNumber || undefined, supplier: form.supplier || undefined },
        { onSuccess: () => { rTxns(); rAccts(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') });
    }
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    const cb = { onSuccess: () => { setConfirmDelete(null); if (tab === 'accounts') rAccts(); else { rTxns(); rAccts(); } } };
    tab === 'accounts' ? deleteAcct({ id: confirmDelete.id }, cb) : deleteTxn({ id: confirmDelete.id }, cb);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><DollarSign size={20} className="text-green-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Financeiro</h1><p className="text-gray-500">Contas e movimentacoes</p></div></div>
        <div className="flex gap-2">
          <button onClick={async () => { const h = generateFinancialReport(); if (h) { const w = window.open('', '_blank'); if (w) { w.document.write(h); w.document.close(); w.onload = () => w.print(); } } }} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
          <button onClick={async () => { const h = generateFinancialReport(); if (h) await openReportAsPDF(h, 'Relatorio_Financeiro'); }} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          <button onClick={() => tab === 'accounts' ? openNewAcct() : openNewTxn()} className="btn-primary flex items-center gap-2"><Plus size={16} /> {tab === 'accounts' ? 'Nova Conta' : 'Nova Transação'}</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center bg-blue-50 border-0"><Wallet size={22} className="text-blue-500 mx-auto mb-1" /><p className="text-xl font-bold">{fmtMoney(totalBalance)}</p><p className="text-xs text-gray-500">Saldo total</p></div>
        <div className="card text-center bg-green-50 border-0"><TrendingUp size={22} className="text-green-500 mx-auto mb-1" /><p className="text-xl font-bold text-green-600">{fmtMoney(totalReceita)}</p><p className="text-xs text-gray-500">Receitas</p></div>
        <div className="card text-center bg-red-50 border-0"><TrendingDown size={22} className="text-red-400 mx-auto mb-1" /><p className="text-xl font-bold text-red-600">{fmtMoney(totalDespesa)}</p><p className="text-xs text-gray-500">Despesas</p></div>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['accounts', 'Contas', Wallet], ['transactions', 'Movimentacoes', DollarSign]].map(([id, label, Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}><Icon size={14} /> {label}</button>
        ))}
      </div>

      {tab === 'accounts' && (
        <div className="grid gap-3">{allAccts.map((a: any) => (
          <div key={a.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Wallet size={16} className="text-blue-600" /></div>
            <div className="flex-1"><p className="font-semibold text-gray-800">{a.name}</p><div className="flex gap-2 text-xs text-gray-500">{a.bankName && <span>{a.bankName}</span>}{a.agency && <span>Ag. {a.agency}</span>}{a.accountNumber && <span>CC. {a.accountNumber}</span>}<span className={`px-2 py-0.5 rounded-full ${a.type === 'pdde' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{TYPES[a.type]}</span></div></div>
            <p className="text-lg font-bold text-gray-800">{fmtMoney(parseFloat(a.balance) || 0)}</p>
            <div className="flex gap-1"><button onClick={() => { setForm({ ...a, balance: String(parseFloat(a.balance) || 0) }); setEditId(a.id); setFormErr(''); setShowModal(true); }} className="p-2 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={15} /></button><button onClick={() => setConfirmDelete(a)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={15} /></button></div>
          </div>
        ))}{!allAccts.length && <div className="card text-center py-12"><Wallet size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma conta cadastrada</p></div>}</div>
      )}

      {tab === 'transactions' && (
        <div className="card p-0 overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['Data', 'Tipo', 'Categoria', 'Descricao', 'Valor', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y">{allTxns.map((t: any) => (
          <tr key={t.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-gray-500">{t.date ? new Date(t.date).toLocaleDateString('pt-BR') : '—'}</td>
            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.type === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type === 'receita' ? 'Receita' : 'Despesa'}</span></td>
            <td className="px-4 py-3 text-gray-700">{t.category}</td>
            <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.description || '—'}</td>
            <td className={`px-4 py-3 font-bold ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'receita' ? '+' : '-'}{fmtMoney(parseFloat(t.value) || 0)}</td>
            <td className="px-4 py-3"><button onClick={() => setConfirmDelete(t)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button></td>
          </tr>
        ))}{!allTxns.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhuma transacao</td></tr>}</tbody></table></div>
      )}

      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={doDelete} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{tab === 'accounts' ? (editId ? 'Editar Conta' : 'Nova Conta') : 'Nova Transacao'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
          {tab === 'accounts' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={form.name || ''} onChange={sf('name')} /></div>
              <div><label className="label">Tipo</label><select className="input" value={form.type || ''} onChange={sf('type')}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
              <div><label className="label">Saldo inicial</label><input className="input" type="number" step="0.01" value={form.balance || ''} onChange={sf('balance')} /></div>
              <div><label className="label">Banco</label><input className="input" list="bank-list" value={form.bankName || ''} onChange={sf('bankName')} placeholder="Digite ou selecione" /><datalist id="bank-list">{banks.map(b => <option key={b.code} value={b.code + ' - ' + b.name} />)}</datalist></div>
              <div><label className="label">Agencia</label><input className="input" value={form.agency || ''} onChange={sf('agency')} /></div>
              <div className="col-span-2"><label className="label">Conta</label><input className="input" value={form.accountNumber || ''} onChange={sf('accountNumber')} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Conta *</label><select className="input" value={form.accountId || ''} onChange={sf('accountId')}><option value="">Selecione</option>{allAccts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div><label className="label">Tipo *</label><select className="input" value={form.type || ''} onChange={sf('type')}><option value="despesa">Despesa</option><option value="receita">Receita</option></select></div>
              <div><label className="label">Categoria *</label><input className="input" value={form.category || ''} onChange={sf('category')} placeholder="Material, Servico..." /></div>
              <div><label className="label">Valor *</label><input className="input" type="number" step="0.01" value={form.value || ''} onChange={sf('value')} /></div>
              <div><label className="label">Data *</label><input className="input" type="date" value={form.date || ''} onChange={sf('date')} /></div>
              <div><label className="label">Nº Documento</label><input className="input" value={form.documentNumber || ''} onChange={sf('documentNumber')} /></div>
              <div className="col-span-2"><label className="label">Descricao</label><input className="input" value={form.description || ''} onChange={sf('description')} /></div>
              <div className="col-span-2"><label className="label">Fornecedor</label><input className="input" value={form.supplier || ''} onChange={sf('supplier')} /></div>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    </div>
  );
}
