import { useState, useEffect } from 'react';
import { FileText, Plus, X, Building, CheckCircle, AlertTriangle, Clock, Download, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const STATUS_COLORS: any = { active:'bg-green-100 text-green-700', expired:'bg-red-100 text-red-700', pending:'bg-yellow-100 text-yellow-700', cancelled:'bg-gray-100 text-gray-600' };
const STATUS_LABELS: any = { active:'Vigente', expired:'Vencido', pending:'A vencer', cancelled:'Cancelado' };
const CONTRACT_TYPES = ['Transporte Escolar','Manutenção de Veículos','Combustível','Seguro','Locação','Serviços Gerais'];
const emptyForm = { number:'', type:'Transporte Escolar', supplier:'', cnpj:'', object:'', value:'', startDate:'', endDate:'', responsibleName:'', responsiblePhone:'', notes:'' };

// ===================== MÁSCARAS E VALIDAÇÕES =====================

function maskPhone(v: string): string {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function maskCNPJ(v: string): string {
    const d = v.replace(/\D/g, '').slice(0, 14);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

function validateCNPJ(cnpj: string): boolean {
    const d = cnpj.replace(/\D/g, '');
    if (d.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(d)) return false;
    let sum = 0;
    let w = [5,4,3,2,9,8,7,6,5,4,3,2];
    for (let i = 0; i < 12; i++) sum += parseInt(d[i]) * w[i];
    let r = sum % 11;
    if (parseInt(d[12]) !== (r < 2 ? 0 : 11 - r)) return false;
    sum = 0;
    w = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    for (let i = 0; i < 13; i++) sum += parseInt(d[i]) * w[i];
    r = sum % 11;
    if (parseInt(d[13]) !== (r < 2 ? 0 : 11 - r)) return false;
    return true;
}

function maskMoney(v: string): string {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    const n = parseInt(d) / 100;
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function unMaskMoney(v: string): number {
    const clean = v.replace(/\./g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

// ===================== COMPONENTES =====================

function DaysAlert({ endDate }: { endDate: string }) {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime()-Date.now())/86400000);
    if (days<0) return <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={10}/> Vencido há {Math.abs(days)}d</span>span>;
    if (days<60) return <span className="text-xs text-yellow-600 flex items-center gap-1"><Clock size={10}/> Vence em {days}d</span>span>;
    return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10}/> {days}d restantes</span>span>;
}

export default function ContractsPage() {
    const { user } = useAuth();
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<number|null>(null);
    const [detail, setDetail] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [form, setForm] = useState<any>(emptyForm);
    const [confirmDelete, setConfirmDelete] = useState<any>(null);
    const [cnpjError, setCnpjError] = useState('');
    const municipalityId = user?.municipalityId;
  
    const loadContracts = async () => {
          if (!municipalityId) return;
          try {
                  setLoading(true);
                  const data = await api.contracts.list({ municipalityId });
                  setContracts(Array.isArray(data) ? data : []);
          } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    useEffect(() => { loadContracts(); }, [municipalityId]);
  
    const setField = (k: string) => (e: any) => setForm((f: any) => ({...f,[k]:e.target.value}));
  
    const handlePhoneChange = (e: any) => {
          setForm((f: any) => ({...f, responsiblePhone: maskPhone(e.target.value)}));
    };
  
    const handleCnpjChange = (e: any) => {
          const masked = maskCNPJ(e.target.value);
          setForm((f: any) => ({...f, cnpj: masked}));
          const digits = e.target.value.replace(/\D/g, '');
          if (digits.length === 14) {
                  setCnpjError(validateCNPJ(digits) ? '' : 'CNPJ inválido');
          } else {
                  setCnpjError('');
          }
    };
  
    const handleValueChange = (e: any) => {
          setForm((f: any) => ({...f, value: maskMoney(e.target.value)}));
    };
  
    const getStatus = (c: any) => {
          if (c.status==='cancelled') return 'cancelled';
          if (!c.endDate) return 'active';
          const days = Math.ceil((new Date(c.endDate).getTime()-Date.now())/86400000);
          if (days<0) return 'expired';
          if (days<30) return 'pending';
          return 'active';
    };
  
    const filtered = contracts.filter(c => {
          const q = search.toLowerCase();
          const ms = (c.number||'').includes(q)||(c.supplier||'').toLowerCase().includes(q)||(c.type||'').toLowerCase().includes(q);
          return ms&&(filterStatus==='all'||getStatus(c)===filterStatus);
    });
  
    const counts = { all:contracts.length, active:contracts.filter(c => getStatus(c)==='active').length, pending:contracts.filter(c => getStatus(c)==='pending').length, expired:contracts.filter(c => getStatus(c)==='expired').length };
    const fmt = (v: number) => v?.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  
    const openNew = () => { setForm(emptyForm); setEditId(null); setCnpjError(''); setShowModal(true); };
    const openEdit = (c: any) => {
          const val = parseFloat(c.value) || 0;
          const formattedValue = val > 0 ? val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
          setForm({...c, value: formattedValue, startDate: c.startDate ? c.startDate.split('T')[0] : '', endDate: c.endDate ? c.endDate.split('T')[0] : '', responsiblePhone: c.responsiblePhone || '', cnpj: c.cnpj || ''});
          setEditId(c.id); setDetail(null); setCnpjError(''); setShowModal(true);
    };
  
    const save = async () => {
          if (!form.number||!form.supplier||!form.startDate||!form.endDate) { alert('Preencha os campos obrigatórios'); return; }
          if (!municipalityId) { alert('Erro: município não identificado. Faça login novamente.'); return; }
          if (cnpjError) { alert('Corrija o CNPJ antes de salvar.'); return; }
          const cnpjDigits = (form.cnpj || '').replace(/\D/g, '');
          if (cnpjDigits.length > 0 && cnpjDigits.length !== 14) { alert('CNPJ incompleto. Preencha todos os 14 dígitos.'); return; }
          if (cnpjDigits.length === 14 && !validateCNPJ(cnpjDigits)) { alert('CNPJ inválido.'); return; }
      
          setSaving(true);
          try {
                  const numericValue = unMaskMoney(form.value);
                  if (editId!==null) {
                            await api.contracts.update({ id: editId, number: form.number, type: form.type, supplier: form.supplier, cnpj: form.cnpj, object: form.object, value: numericValue, startDate: form.startDate, endDate: form.endDate, responsibleName: form.responsibleName, responsiblePhone: form.responsiblePhone, notes: form.notes });
                  } else {
                            await api.contracts.create({ municipalityId, number: form.number, type: form.type, supplier: form.supplier, cnpj: form.cnpj, object: form.object, value: numericValue, startDate: form.startDate, endDate: form.endDate, responsibleName: form.responsibleName, responsiblePhone: form.responsiblePhone, notes: form.notes });
                  }
                  setShowModal(false); setForm(emptyForm); setEditId(null); setCnpjError(''); await loadContracts();
          } catch (err: any) { alert(err.message || 'Erro ao salvar'); } finally { setSaving(false); }
    };
  
    const doDelete = async (id: number) => {
          try { await api.contracts.delete({ id }); setConfirmDelete(null); setDetail(null); await loadContracts(); } catch (err) { console.error(err); }
    };
  
    const exportCSV = () => {
          if(!contracts.length) return;
          const rows = contracts.map(c => ({numero:c.number,tipo:c.type,fornecedor:c.supplier,cnpj:c.cnpj,objeto:c.object,valor:c.value,inicio:c.startDate?.split('T')[0],fim:c.endDate?.split('T')[0],status:STATUS_LABELS[getStatus(c)]}));
          const keys = Object.keys(rows[0]);
          const csv = [keys.join(','),...rows.map(r => Object.values(r).map(v => '"'+v+'"').join(','))].join('\n');
          const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'})); a.download='contratos.csv'; a.click();
    };
  
    if (loading) return <div className="p-6 flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-500" size={32}/></div>div>;
  
    return (
          <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                        <div><h1 className="text-2xl font-bold text-gray-900">Contratos</h1>h1><p className="text-gray-500">Gestão de contratos e fornecedores</p>p></div>div>
                        <div className="flex gap-2">
                                  <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14}/> Exportar CSV</button>button>
                                  <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Contrato</button>button>
                        </div>div>
                </div>div>
          
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[['all','Total','bg-gray-50',counts.all],['active','Vigentes','bg-green-50',counts.active],['pending','A vencer','bg-yellow-50',counts.pending],['expired','Vencidos','bg-red-50',counts.expired]].map(([s,l,cls,v]: any) => (
                      <button key={s} onClick={() => setFilterStatus(s)} className={"card " + cls + " p-3 text-center border transition-all " + (filterStatus===s?'ring-2 ring-primary-400':'')}><p className="text-xl font-bold text-gray-800">{v}</p>p><p className="text-xs text-gray-500">{l}</p>p></button>button>
                    ))}
                </div>div>
          
                <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por nº, fornecedor ou tipo..." value={search} onChange={e => setSearch(e.target.value)}/></div>div>
          
                <div className="card p-0 overflow-hidden">
                        <table className="w-full text-sm">
                                  <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Nº / Tipo','Fornecedor','Objeto','Valor','Vigência','Status','Ações'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>th>)}</tr>tr></thead>thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {filtered.map(c => { const status = getStatus(c); return (
                          <tr key={c.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 cursor-pointer" onClick={() => setDetail(c)}><p className="font-semibold text-gray-800">{c.number}</p>p><p className="text-xs text-gray-400">{c.type}</p>p></td>td>
                                          <td className="px-4 py-3 cursor-pointer" onClick={() => setDetail(c)}><p className="font-medium text-gray-700">{c.supplier}</p>p><p className="text-xs text-gray-400">{c.cnpj}</p>p></td>td>
                                          <td className="px-4 py-3 max-w-xs cursor-pointer" onClick={() => setDetail(c)}><p className="text-gray-600 text-xs truncate">{c.object}</p>p></td>td>
                                          <td className="px-4 py-3 font-semibold text-gray-800">{fmt(parseFloat(c.value)||0)}</td>td>
                                          <td className="px-4 py-3">{c.startDate && <p className="text-xs text-gray-500">{new Date(c.startDate).toLocaleDateString('pt-BR')} –</p>p>}{c.endDate && <><p className="text-xs text-gray-500">{new Date(c.endDate).toLocaleDateString('pt-BR')}</p>p><DaysAlert endDate={c.endDate}/></>>}</td>
                                          <td className="px-4 py-3"><span className={"text-xs px-2 py-1 rounded-full font-medium " + (STATUS_COLORS[status]||'')}>{STATUS_LABELS[status]||status}</span>span></td>td>
                                          <td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={14}/></button>button><button onClick={() => setConfirmDelete(c)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={14}/></button>button></div>div></td>td>
                          </tr>tr>
                        ); })}
                                    {!filtered.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{contracts.length===0?'Nenhum contrato cadastrado':'Nenhum contrato encontrado'}</td>td></tr>tr>}
                                  </tbody>tbody>
                        </table>table>
                </div>div>
          
            {confirmDelete && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>div>
                                          <h3 className="font-bold text-gray-800 mb-2">Excluir contrato {confirmDelete.number}?</h3>h3>
                                          <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>p>
                                          <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>button><button onClick={() => doDelete(confirmDelete.id)} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button>button></div>div>
                              </div>div>
                    </div>div>
                )}
          
            {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                                          <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId?'Editar Contrato':'Novo Contrato'}</h3>h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>button></div>div>
                                          <div className="overflow-y-auto flex-1 p-5 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                                        <div><label className="label">Número *</label>label><input className="input" placeholder="001/2024" value={form.number} onChange={setField('number')}/></div>div>
                                                                        <div><label className="label">Tipo</label>label><select className="input" value={form.type} onChange={setField('type')}>{CONTRACT_TYPES.map(t => <option key={t}>{t}</option>option>)}</select>select></div>div>
                                                                        <div className="col-span-2"><label className="label">Objeto</label>label><textarea className="input" rows={2} value={form.object} onChange={setField('object')}/></div>div>
                                                        </div>div>
                                                        <div className="p-4 bg-gray-50 rounded-xl">
                                                                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Building size={14}/> Fornecedor</p>p>
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                                          <div className="col-span-2"><label className="label">Razão social *</label>label><input className="input" value={form.supplier} onChange={setField('supplier')}/></div>div>
                                                                                          <div>
                                                                                                              <label className="label">CNPJ</label>label>
                                                                                                              <input className="input" value={form.cnpj} onChange={handleCnpjChange} placeholder="00.000.000/0000-00" maxLength={18}/>
                                                                                            {cnpjError && <p className="text-xs text-red-500 mt-1">{cnpjError}</p>p>}
                                                                                            </div>div>
                                                                                          <div>
                                                                                                              <label className="label">Valor (R$)</label>label>
                                                                                                              <input className="input" value={form.value} onChange={handleValueChange} placeholder="0,00"/>
                                                                                            </div>div>
                                                                                          <div><label className="label">Responsável</label>label><input className="input" value={form.responsibleName} onChange={setField('responsibleName')}/></div>div>
                                                                                          <div><label className="label">Telefone</label>label><input className="input" value={form.responsiblePhone} onChange={handlePhoneChange} placeholder="(63) 00000-0000" maxLength={15}/></div>div>
                                                                        </div>div>
                                                        </div>div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                                        <div><label className="label">Data início *</label>label><input className="input" type="date" value={form.startDate} onChange={setField('startDate')}/></div>div>
                                                                        <div><label className="label">Data término *</label>label><input className="input" type="date" value={form.endDate} onChange={setField('endDate')}/></div>div>
                                                        </div>div>
                                                        <div><label className="label">Observações</label>label><textarea className="input" rows={2} value={form.notes} onChange={setField('notes')}/></div>div>
                                          </div>div>
                                          <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>button><button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">{saving && <Loader2 size={16} className="animate-spin"/>}{editId?'Salvar':'Criar Contrato'}</button>button></div>div>
                              </div>div>
                    </div>div>
                )}
          </div>div>
        );
}</></span>
