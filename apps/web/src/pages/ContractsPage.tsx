import { useState } from 'react';
import { FileText, Plus, X, Building, CheckCircle, AlertTriangle, Clock, Download, Search, Pencil, Trash2 } from 'lucide-react';

const STATUS_COLORS: any = { active:'bg-green-100 text-green-700', expired:'bg-red-100 text-red-700', pending:'bg-yellow-100 text-yellow-700', cancelled:'bg-gray-100 text-gray-600' };
const STATUS_LABELS: any = { active:'Vigente', expired:'Vencido', pending:'A vencer', cancelled:'Cancelado' };
const CONTRACT_TYPES = ['Transporte Escolar','Manutenção de Veículos','Combustível','Seguro','Locação','Serviços Gerais'];

const emptyForm = { number:'', type:'Transporte Escolar', supplier:'', cnpj:'', object:'', value:'', startDate:'', endDate:'', responsibleName:'', responsiblePhone:'', notes:'' };

function DaysAlert({ endDate }: { endDate: string }) {
  if (!endDate) return null;
  const days = Math.ceil((new Date(endDate).getTime()-Date.now())/86400000);
  if (days<0) return <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={10}/> Vencido há {Math.abs(days)}d</span>;
  if (days<60) return <span className="text-xs text-yellow-600 flex items-center gap-1"><Clock size={10}/> Vence em {days}d</span>;
  return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10}/> {days}d restantes</span>;
}

export default function ContractsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState<any>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([
    { id:1, number:'001/2024', type:'Transporte Escolar', supplier:'Transportes Silva Ltda', cnpj:'12.345.678/0001-90', object:'Prestação de serviços de transporte escolar municipal', value:150000, startDate:'2024-01-01', endDate:'2024-12-31', responsibleName:'João Silva', responsiblePhone:'(63) 99999-0001', notes:'Contrato anual renovável' },
  ]);

  const setField = function(k: string) { return function(e: any) { setForm(function(f: any) { return {...f,[k]:e.target.value}; }); }; };

  const getStatus = function(c: any) {
    if (c.status==='cancelled') return 'cancelled';
    const days = Math.ceil((new Date(c.endDate).getTime()-Date.now())/86400000);
    if (days<0) return 'expired'; if (days<30) return 'pending'; return 'active';
  };

  const filtered = contracts.filter(function(c) {
    const q = search.toLowerCase();
    const ms = c.number.includes(q)||c.supplier.toLowerCase().includes(q)||c.type.toLowerCase().includes(q);
    return ms&&(filterStatus==='all'||getStatus(c)===filterStatus);
  });

  const counts = { all:contracts.length, active:contracts.filter(function(c){return getStatus(c)==='active';}).length, pending:contracts.filter(function(c){return getStatus(c)==='pending';}).length, expired:contracts.filter(function(c){return getStatus(c)==='expired';}).length };
  const fmt = function(v: number) { return v?.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); };

  const openNew = function() { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = function(c: any) { setForm({...c, value: String(c.value)}); setEditId(c.id); setDetail(null); setShowModal(true); };

  const save = function() {
    if (!form.number||!form.supplier||!form.startDate||!form.endDate) { alert('Preencha os campos obrigatórios'); return; }
    if (editId!==null) {
      setContracts(function(cs) { return cs.map(function(c) { return c.id===editId?{...form,id:editId,value:parseFloat(form.value)||0}:c; }); });
    } else {
      const newId = Math.max(0,...contracts.map(function(c){return c.id;}))+1;
      setContracts(function(cs) { return [...cs,{...form,id:newId,value:parseFloat(form.value)||0}]; });
    }
    setShowModal(false); setForm(emptyForm); setEditId(null);
  };

  const doDelete = function(id: number) {
    setContracts(function(cs){return cs.filter(function(c){return c.id!==id;});});
    setConfirmDelete(null); setDetail(null);
  };

  const exportCSV = function() {
    const rows = contracts.map(function(c){return{numero:c.number,tipo:c.type,fornecedor:c.supplier,cnpj:c.cnpj,objeto:c.object,valor:c.value,inicio:c.startDate,fim:c.endDate,status:STATUS_LABELS[getStatus(c)]};});
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','),...rows.map(function(r){return Object.values(r).map(function(v){return '"'+v+'"';}).join(',');})].join('\n');
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'})); a.download='contratos.csv'; a.click();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Contratos</h1><p className="text-gray-500">Gestão de contratos e fornecedores</p></div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14}/> Exportar CSV</button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Contrato</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[['all','Total','bg-gray-50',counts.all],['active','Vigentes','bg-green-50',counts.active],['pending','A vencer','bg-yellow-50',counts.pending],['expired','Vencidos','bg-red-50',counts.expired]].map(function([s,l,cls,v]:any){return(
          <button key={s} onClick={function(){setFilterStatus(s);}} className={`card ${cls} p-3 text-center border transition-all ${filterStatus===s?'ring-2 ring-primary-400':''}`}><p className="text-xl font-bold text-gray-800">{v}</p><p className="text-xs text-gray-500">{l}</p></button>
        );}) }
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por nº, fornecedor ou tipo..." value={search} onChange={function(e){setSearch(e.target.value);}}/></div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Nº / Tipo','Fornecedor','Objeto','Valor','Vigência','Status','Ações'].map(function(h){return <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>;})}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(function(c){
              const status = getStatus(c);
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 cursor-pointer" onClick={function(){setDetail(c);}}><p className="font-semibold text-gray-800">{c.number}</p><p className="text-xs text-gray-400">{c.type}</p></td>
                  <td className="px-4 py-3 cursor-pointer" onClick={function(){setDetail(c);}}><p className="font-medium text-gray-700">{c.supplier}</p><p className="text-xs text-gray-400">{c.cnpj}</p></td>
                  <td className="px-4 py-3 max-w-xs cursor-pointer" onClick={function(){setDetail(c);}}><p className="text-gray-600 text-xs truncate">{c.object}</p></td>
                  <td className="px-4 py-3 font-semibold text-gray-800 cursor-pointer" onClick={function(){setDetail(c);}}>{fmt(c.value)}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={function(){setDetail(c);}}><p className="text-xs text-gray-500">{new Date(c.startDate).toLocaleDateString('pt-BR')} –</p><p className="text-xs text-gray-500">{new Date(c.endDate).toLocaleDateString('pt-BR')}</p><DaysAlert endDate={c.endDate}/></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={function(){openEdit(c);}} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><Pencil size={14}/></button>
                      <button onClick={function(){setConfirmDelete(c);}} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length&&<tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Nenhum contrato encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detalhe */}
      {detail&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div><p className="font-bold text-gray-900">Contrato {detail.number}</p><p className="text-sm text-gray-500">{detail.type}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={function(){openEdit(detail);}} className="p-2 hover:bg-primary-50 rounded-lg text-gray-400 hover:text-primary-500" title="Editar"><Pencil size={16}/></button>
                <button onClick={function(){setConfirmDelete(detail);}} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500" title="Excluir"><Trash2 size={16}/></button>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[getStatus(detail)]}`}>{STATUS_LABELS[getStatus(detail)]}</span>
                <button onClick={function(){setDetail(null);}} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18}/></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Building size={12}/> Fornecedor</p><p className="font-semibold text-gray-800">{detail.supplier}</p><p className="text-sm text-gray-500">{detail.cnpj}</p>{detail.responsibleName&&<p className="text-sm text-gray-500 mt-1">{detail.responsibleName} · {detail.responsiblePhone}</p>}</div>
              <div><p className="text-xs text-gray-500 font-medium mb-1">Objeto</p><p className="text-sm text-gray-700">{detail.object}</p></div>
              <div className="grid grid-cols-2 gap-3"><div className="p-3 bg-green-50 rounded-xl"><p className="text-xs text-green-600">Valor total</p><p className="font-bold text-green-700">{fmt(detail.value)}</p></div><div className="p-3 bg-blue-50 rounded-xl"><p className="text-xs text-blue-600">Vigência</p><p className="text-sm font-semibold text-blue-700">{new Date(detail.startDate).toLocaleDateString('pt-BR')} a {new Date(detail.endDate).toLocaleDateString('pt-BR')}</p></div></div>
              {detail.notes&&<div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Observações</p><p className="text-sm">{detail.notes}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Confirmação exclusão */}
      {confirmDelete&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir contrato {confirmDelete.number}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={function(){setConfirmDelete(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){doDelete(confirmDelete.id);}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {/* Modal novo/editar */}
      {showModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId?'Editar Contrato':'Novo Contrato'}</h3><button onClick={function(){setShowModal(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Número *</label><input className="input" placeholder="001/2024" value={form.number} onChange={setField('number')}/></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={setField('type')}>{CONTRACT_TYPES.map(function(t){return <option key={t}>{t}</option>;})}</select></div>
                <div className="col-span-2"><label className="label">Objeto *</label><textarea className="input" rows={2} value={form.object} onChange={setField('object')} placeholder="Descrição do serviço..."/></div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Building size={14}/> Fornecedor</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="label">Razão social *</label><input className="input" value={form.supplier} onChange={setField('supplier')}/></div>
                  <div><label className="label">CNPJ</label><input className="input" value={form.cnpj} onChange={setField('cnpj')} placeholder="00.000.000/0000-00"/></div>
                  <div><label className="label">Valor total (R$)</label><input className="input" type="number" step="0.01" value={form.value} onChange={setField('value')}/></div>
                  <div><label className="label">Responsável</label><input className="input" value={form.responsibleName} onChange={setField('responsibleName')}/></div>
                  <div><label className="label">Telefone</label><input className="input" value={form.responsiblePhone} onChange={setField('responsiblePhone')} placeholder="(00) 00000-0000"/></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Data início *</label><input className="input" type="date" value={form.startDate} onChange={setField('startDate')}/></div>
                <div><label className="label">Data término *</label><input className="input" type="date" value={form.endDate} onChange={setField('endDate')}/></div>
              </div>
              <div><label className="label">Observações</label><textarea className="input" rows={2} value={form.notes} onChange={setField('notes')}/></div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">{editId?'Salvar alterações':'Salvar Contrato'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
