import { useState, useEffect } from 'react';
import { Wrench, Plus, X, Pencil, Trash2, AlertTriangle, CheckCircle, Clock, Bus, Calendar, Loader2, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const STATUS_LABELS: any = { scheduled:'Agendada', in_progress:'Em andamento', completed:'Concluída', cancelled:'Cancelada' };
const STATUS_COLORS: any = { scheduled:'bg-yellow-100 text-yellow-700', in_progress:'bg-blue-100 text-blue-700', completed:'bg-green-100 text-green-700', cancelled:'bg-gray-100 text-gray-600' };
const TYPE_LABELS: any = { preventive:'Preventiva', corrective:'Corretiva', predictive:'Preditiva' };
const emptyForm = { vehicleId:'', componentName:'', type:'preventive', description:'', cost:'', kmAtMaintenance:'', intervalKm:'', performedAt:'', nextDueAt:'', nextDueKm:'', supplier:'', notes:'', status:'scheduled' };

export default function PredictivePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const municipalityId = user?.municipalityId;

  const loadData = async () => {
    if (!municipalityId) return;
    try {
      setLoading(true);
      const [mData, vData] = await Promise.all([
        api.maintenance.list({ municipalityId }),
        api.vehicles.list({ municipalityId })
      ]);
      setRecords(Array.isArray(mData) ? mData : []);
      setVehicles(Array.isArray(vData) ? vData : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, [municipalityId]);

  const setField = (k: string) => (e: any) => setForm((f: any) => ({...f,[k]:e.target.value}));
  const getVehicle = (id: number) => vehicles.find(v => v.id === id);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const v = getVehicle(r.vehicleId);
    const matchSearch = r.componentName.toLowerCase().includes(q) || (v?.plate||'').toLowerCase().includes(q) || (v?.model||'').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = { all: records.length, scheduled: records.filter(r => r.status==='scheduled').length, completed: records.filter(r => r.status==='completed').length, in_progress: records.filter(r => r.status==='in_progress').length };

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (r: any) => {
    setForm({ ...r, vehicleId: String(r.vehicleId), cost: String(r.cost||''), kmAtMaintenance: String(r.kmAtMaintenance||''), intervalKm: String(r.intervalKm||''), nextDueKm: String(r.nextDueKm||''), performedAt: r.performedAt ? r.performedAt.split('T')[0] : '', nextDueAt: r.nextDueAt ? r.nextDueAt.split('T')[0] : '' });
    setEditId(r.id); setShowModal(true);
  };

  const save = async () => {
    if (!form.vehicleId || !form.componentName) { alert('Veículo e componente são obrigatórios'); return; }
    setSaving(true);
    try {
      const payload: any = { componentName: form.componentName, type: form.type, description: form.description, supplier: form.supplier, notes: form.notes, status: form.status };
      if (form.cost) payload.cost = parseFloat(form.cost);
      if (form.kmAtMaintenance) payload.kmAtMaintenance = parseInt(form.kmAtMaintenance);
      if (form.intervalKm) payload.intervalKm = parseInt(form.intervalKm);
      if (form.nextDueKm) payload.nextDueKm = parseInt(form.nextDueKm);
      if (form.performedAt) payload.performedAt = form.performedAt;
      if (form.nextDueAt) payload.nextDueAt = form.nextDueAt;

      if (editId !== null) {
        await api.maintenance.update({ id: editId, ...payload });
      } else {
        await api.maintenance.create({ municipalityId, vehicleId: parseInt(form.vehicleId), ...payload });
      }
      setShowModal(false); setForm(emptyForm); setEditId(null); await loadData();
    } catch (err: any) { alert(err.message || 'Erro ao salvar'); } finally { setSaving(false); }
  };

  const doDelete = async (id: number) => { try { await api.maintenance.delete({ id }); setConfirmDelete(null); await loadData(); } catch (err) { console.error(err); } };

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-500" size={32}/></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Wrench size={20} className="text-orange-600"/></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Manutenção de Veículos</h1><p className="text-gray-500">Cadastro, acompanhamento e histórico de manutenções</p></div>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Nova Manutenção</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[['all','Total',counts.all,'bg-gray-50'],['scheduled','Agendadas',counts.scheduled,'bg-yellow-50'],['in_progress','Em andamento',counts.in_progress,'bg-blue-50'],['completed','Concluídas',counts.completed,'bg-green-50']].map(([s,l,v,cls]: any) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={"card " + cls + " p-3 text-center border transition-all " + (filterStatus===s?'ring-2 ring-primary-400':'')}><p className="text-xl font-bold text-gray-800">{v}</p><p className="text-xs text-gray-500">{l}</p></button>
        ))}
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por componente, placa ou modelo..." value={search} onChange={e => setSearch(e.target.value)}/></div>

      <div className="grid gap-3">
        {filtered.map(r => { const v = getVehicle(r.vehicleId); return (
          <div key={r.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0"><Wrench size={16} className="text-orange-500"/></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-800">{r.componentName}</p>
                <span className={"text-xs px-2 py-0.5 rounded-full " + (STATUS_COLORS[r.status]||'')}>{STATUS_LABELS[r.status]||r.status}</span>
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{TYPE_LABELS[r.type]||r.type}</span>
              </div>
              <div className="flex gap-4 flex-wrap text-xs text-gray-500">
                {v && <span className="flex items-center gap-1"><Bus size={10}/> {v.plate} - {v.model || v.nickname}</span>}
                {r.kmAtMaintenance && <span>Km: {Number(r.kmAtMaintenance).toLocaleString()}</span>}
                {r.intervalKm && <span>Intervalo: {Number(r.intervalKm).toLocaleString()}km</span>}
                {r.cost && <span className="text-green-600 font-medium">R$ {parseFloat(r.cost).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>}
              </div>
              {r.performedAt && <p className="text-xs text-gray-400 mt-0.5">Realizada: {new Date(r.performedAt).toLocaleDateString('pt-BR')}</p>}
              {r.nextDueAt && <p className="text-xs text-yellow-600 mt-0.5">Próxima: {new Date(r.nextDueAt).toLocaleDateString('pt-BR')}</p>}
              {r.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.description}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(r)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={15}/></button>
              <button onClick={() => setConfirmDelete(r)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={15}/></button>
            </div>
          </div>
        ); })}
        {!filtered.length && <div className="card text-center py-12"><Wrench size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500">{records.length===0?'Nenhuma manutenção cadastrada. Clique em + Nova Manutenção.':'Nenhum registro encontrado'}</p></div>}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir manutenção?</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmDelete.componentName}</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => doDelete(confirmDelete.id)} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Wrench size={18} className="text-orange-600"/>{editId?'Editar Manutenção':'Nova Manutenção'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Veículo *</label><select className="input" value={form.vehicleId} onChange={setField('vehicleId')} disabled={!!editId}><option value="">Selecione...</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model || v.nickname}</option>)}</select></div>
                <div><label className="label">Componente *</label><input className="input" value={form.componentName} onChange={setField('componentName')} placeholder="Ex: Freios dianteiros"/></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={setField('type')}><option value="preventive">Preventiva</option><option value="corrective">Corretiva</option><option value="predictive">Preditiva</option></select></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={setField('status')}><option value="scheduled">Agendada</option><option value="in_progress">Em andamento</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option></select></div>
                <div><label className="label">Custo (R$)</label><input className="input" type="number" step="0.01" value={form.cost} onChange={setField('cost')}/></div>
                <div><label className="label">Km na manutenção</label><input className="input" type="number" value={form.kmAtMaintenance} onChange={setField('kmAtMaintenance')}/></div>
                <div><label className="label">Intervalo (km)</label><input className="input" type="number" value={form.intervalKm} onChange={setField('intervalKm')}/></div>
                <div><label className="label">Próxima (km)</label><input className="input" type="number" value={form.nextDueKm} onChange={setField('nextDueKm')}/></div>
                <div><label className="label">Data realizada</label><input className="input" type="date" value={form.performedAt} onChange={setField('performedAt')}/></div>
                <div><label className="label">Próxima data</label><input className="input" type="date" value={form.nextDueAt} onChange={setField('nextDueAt')}/></div>
                <div><label className="label">Fornecedor</label><input className="input" value={form.supplier} onChange={setField('supplier')}/></div>
              </div>
              <div><label className="label">Descrição</label><textarea className="input" rows={2} value={form.description} onChange={setField('description')}/></div>
              <div><label className="label">Observações</label><textarea className="input" rows={2} value={form.notes} onChange={setField('notes')}/></div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">{saving && <Loader2 size={16} className="animate-spin"/>}{editId?'Salvar':'Criar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
