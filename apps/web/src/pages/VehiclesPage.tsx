import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Plus, X, Wrench, FileText, AlertTriangle, CheckCircle, Clock, Fuel, Pencil, Trash2, Search, Eye, Download, Printer } from 'lucide-react';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import { useState as useState2, useEffect as useEffect2 } from 'react';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

const STATUS_COLORS: any = { active:'bg-green-100 text-green-700', maintenance:'bg-yellow-100 text-yellow-700', inactive:'bg-red-100 text-red-700' };
const STATUS_LABELS: any = { active:'Ativo', maintenance:'Manutenção', inactive:'Inativo' };
const FUEL_TYPES = ['Diesel','Gasolina','Etanol','GNV','Elétrico','Híbrido'];
const emptyForm = { plate:'', nickname:'', brand:'', model:'', year:'', capacity:'40', color:'', fuel:'Diesel', chassis:'', renavam:'', crlvExpiry:'', ipvaExpiry:'', inspectionExpiry:'', insuranceCompany:'', insurancePolicy:'', insuranceExpiry:'', fireExtinguisherExpiry:'', currentKm:'', lastRevision:'', nextRevision:'', observations:'' };

function DocAlert({ label, date }: { label: string; date: string }) {
  if (!date) return null;
  const days = Math.ceil((new Date(date).getTime()-Date.now())/86400000);
  const color = days<0?'text-red-600 bg-red-50':days<30?'text-yellow-600 bg-yellow-50':'text-green-600 bg-green-50';
  const icon = days<0?<AlertTriangle size={12}/>:days<30?<Clock size={12}/>:<CheckCircle size={12}/>;
  return <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${color}`}>{icon} {label}: {days<0?`Vencido há ${Math.abs(days)}d`:`${days}d`}</div>;
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [tab, setTab] = useState<'dados'|'docs'|'manut'>('dados');
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [viewVehicle, setViewVehicle] = useState<any>(null);
  const [page,setPage]=useState(1);
  const PER_PAGE=20;
  const { data: vehicles, refetch } = useQuery(function() { return api.vehicles.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.vehicles.create);
  const { mutate: update, loading: updating } = useMutation(api.vehicles.update);
  const { mutate: remove } = useMutation(api.vehicles.delete);

  const setField = function(k: string) { return function(e: any) { setForm(function(f: any) { return {...f,[k]:e.target.value}; }); }; };
  const all = (vehicles as any)||[];
  const filtered = all.filter(function(v: any) {
    const q = search.toLowerCase();
    const matchSearch = v.plate?.toLowerCase().includes(q)||(v.nickname||'').toLowerCase().includes(q)||(v.brand||'').toLowerCase().includes(q)||(v.model||'').toLowerCase().includes(q);
    const matchFilter = filter==='all'||v.status===filter;
    return matchSearch&&matchFilter;
  });
  const totalPages=Math.ceil(filtered.length/PER_PAGE);
  const paginated=filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);
  const counts = { all:all.length, active:all.filter(function(v:any){return v.status==='active';}).length, maintenance:all.filter(function(v:any){return v.status==='maintenance';}).length, inactive:all.filter(function(v:any){return v.status==='inactive';}).length };

  const openNew = function() { setForm(emptyForm); setEditId(null); setTab('dados'); setShowModal(true); };
  const openEdit = function(v: any) {
    const formatDate = function(d: any) { if (!d) return ''; try { return typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]; } catch { return ''; } };
    setForm({
      ...emptyForm,...v,
      fuel: v.fuelType || v.fuel || 'Diesel',
      chassis: v.chassi || v.chassis || '',
      crlvExpiry: formatDate(v.crlvExpiry),
      ipvaExpiry: formatDate(v.ipvaExpiry),
      inspectionExpiry: formatDate(v.inspectionExpiry),
      insuranceExpiry: formatDate(v.insuranceExpiry),
      fireExtinguisherExpiry: formatDate(v.fireExtinguisherExpiry),
      year: v.year ? String(v.year) : '',
      capacity: v.capacity ? String(v.capacity) : '40',
      currentKm: v.currentKm ? String(v.currentKm) : '',
      lastRevision: formatDate(v.lastMaintenanceAt),
      nextRevision: formatDate(v.nextMaintenanceAt),
      observations: v.observations || '',
    });
    setEditId(v.id); setTab('dados'); setShowModal(true);
  };

  const save = function() {
    if (!form.plate) return;
    const payload: any = { municipalityId, plate:form.plate, nickname:form.nickname||undefined, brand:form.brand||undefined, model:form.model||undefined, year:form.year?parseInt(form.year):undefined, capacity:form.capacity?parseInt(form.capacity):undefined, color:form.color||undefined, fuel:form.fuel||undefined, chassis:form.chassis||undefined, renavam:form.renavam||undefined, crlvExpiry:form.crlvExpiry||undefined, ipvaExpiry:form.ipvaExpiry||undefined, inspectionExpiry:form.inspectionExpiry||undefined, insuranceCompany:form.insuranceCompany||undefined, insurancePolicy:form.insurancePolicy||undefined, insuranceExpiry:form.insuranceExpiry||undefined, fireExtinguisherExpiry:form.fireExtinguisherExpiry||undefined, currentKm:form.currentKm?parseInt(form.currentKm):undefined, lastMaintenanceAt:form.lastRevision||undefined, nextMaintenanceAt:form.nextRevision||undefined, observations:form.observations||undefined };
    if (editId!==null) {
      update({id:editId,...payload},{onSuccess:function(){refetch();setShowModal(false);}});
    } else {
      create(payload,{onSuccess:function(){refetch();setShowModal(false);}});
    }
  };

  const [munReport, setMunReport] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  (typeof useEffect2 === "function" ? useEffect2 : require("react").useEffect)(function() { if (municipalityId) getMunicipalityReport(municipalityId, api).then(setMunReport).catch(function(){}); }, [municipalityId]);
  const [vehExportModal, setVehExportModal] = useState<{title:string;data:any[];cols:string[];filename:string}|null>(null);
  const vehExportRows = all.map(function(v: any) { return { placa: v.plate||'', apelido: v.nickname||'', marca_modelo: [v.brand,v.model,v.year].filter(Boolean).join(' ')||'', capacidade: v.capacity?v.capacity+' lugares':'', combustivel: v.fuelType||v.fuel||'', km: v.currentKm?Number(v.currentKm).toLocaleString('pt-BR')+' km':'', status: v.status==='active'?'Ativo':v.status==='maintenance'?'Manutenção':'Inativo' }; });
  const vehExportCols = ['Placa','Apelido','Marca/Modelo','Capacidade','Combustível','Km Atual','Status'];
  const doVehExport = function(format: ExportFormat) {
    if (!vehExportModal) return;
    handleExport(format, vehExportModal.data, buildTableReportHTML(vehExportModal.title, vehExportModal.data, vehExportModal.cols, munReport, { orientation: "landscape", signatories: selectedSigs }), vehExportModal.filename);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Veículos</h1><p className="text-gray-500">{all.length} veículo(s) na frota</p></div>
        <div className="flex gap-2"><button onClick={function(){setVehExportModal({title:'Relatorio de Frota',data:vehExportRows,cols:vehExportCols,filename:'veiculos_netescol'})}} className="btn-secondary flex items-center gap-2"><Download size={16}/> Exportar</button><button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Veículo</button></div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[['all','Total','bg-gray-50'],['active','Ativos','bg-green-50'],['maintenance','Manutenção','bg-yellow-50'],['inactive','Inativos','bg-red-50']].map(function([s,l,cls]:any){return(
          <button key={s} onClick={function(){setFilter(s);setPage(1);}} className={`card ${cls} border p-3 text-center transition-all ${filter===s?'ring-2 ring-primary-400':''}`}>
            <p className="text-xl font-bold text-gray-800">{counts[s as keyof typeof counts]}</p><p className="text-xs text-gray-500">{l}</p>
          </button>
        );}) }
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />
      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por placa, apelido, marca ou modelo..." value={search} onChange={function(e){setSearch(e.target.value);setPage(1);}}/></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.map(function(v: any){ return (
          <div key={v.id} className="card hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center"><Bus size={20} className="text-primary-600"/></div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[v.status]||'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[v.status]||v.status}</span>
                <button onClick={function(){setViewVehicle(v);}} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Detalhes"><Eye size={14}/></button>
                <button onClick={function(){openEdit(v);}} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><Pencil size={14}/></button>
                <button onClick={function(){setConfirmDelete(v);}} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={14}/></button>
              </div>
            </div>
            <p className="font-bold text-gray-900 text-lg tracking-wide">{v.plate}</p>
            {v.nickname&&<p className="text-primary-600 text-sm font-medium">{v.nickname}</p>}
            <p className="text-sm text-gray-500 mt-0.5">{[v.brand,v.model,v.year].filter(Boolean).join(' · ')}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {v.capacity&&<span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{v.capacity} lugares</span>}
              {v.fuel&&<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Fuel size={10}/>{v.fuel}</span>}
            </div>
            {(v.crlvExpiry||v.ipvaExpiry||v.inspectionExpiry||v.insuranceExpiry||v.fireExtinguisherExpiry)&&<div className="flex flex-col gap-1 mt-2"><DocAlert label="CRLV" date={v.crlvExpiry}/><DocAlert label="IPVA" date={v.ipvaExpiry}/><DocAlert label="Vistoria" date={v.inspectionExpiry}/><DocAlert label="Seguro" date={v.insuranceExpiry}/><DocAlert label="Extintor" date={v.fireExtinguisherExpiry}/></div>}
            {v.currentKm&&<p className="text-xs text-gray-400 mt-1">{parseInt(v.currentKm).toLocaleString('pt-BR')} km</p>}
          </div>
        );})}
        {!filtered.length&&<div className="col-span-3 card text-center py-16"><Bus size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhum veículo encontrado</p>{!search&&filter==='all'&&<button className="btn-primary" onClick={openNew}>Cadastrar primeiro veículo</button>}</div>}
      </div>
      {totalPages>1&&(<div className="flex items-center justify-between mt-4"><p className="text-sm text-gray-500">Mostrando {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE,filtered.length)} de {filtered.length}</p><div className="flex gap-1"><button onClick={function(){setPage(1);}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<<'}</button><button onClick={function(){setPage(function(p){return Math.max(1,p-1);});}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<'}</button><span className="px-3 py-1.5 text-sm font-medium">{page}/{totalPages}</span><button onClick={function(){setPage(function(p){return Math.min(totalPages,p+1);});}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>'}</button><button onClick={function(){setPage(totalPages);}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>>'}</button></div></div>)}

      {viewVehicle&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-blue-500"/> Detalhes do Veículo</h3><div className="flex gap-2"><button onClick={function(){const v=viewVehicle;const html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+v.plate+' - NetEscol</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:15px}.field{padding:10px;background:#f8f9fa;border-radius:8px}.field-label{font-size:11px;color:#999;margin-bottom:3px}.field-value{font-size:14px;font-weight:500}.footer{margin-top:30px;text-align:center;font-size:11px;color:#999}</style></head><body><h1>Ficha do Veiculo - '+v.plate+'</h1><div class="grid"><div class="field"><div class="field-label">Placa</div><div class="field-value">'+v.plate+'</div></div><div class="field"><div class="field-label">Apelido</div><div class="field-value">'+(v.nickname||'--')+'</div></div><div class="field"><div class="field-label">Marca/Modelo</div><div class="field-value">'+(v.brand||'')+' '+(v.model||'')+'</div></div><div class="field"><div class="field-label">Ano</div><div class="field-value">'+(v.year||'--')+'</div></div><div class="field"><div class="field-label">Capacidade</div><div class="field-value">'+(v.capacity||'--')+' lugares</div></div><div class="field"><div class="field-label">Cor</div><div class="field-value">'+(v.color||'--')+'</div></div><div class="field"><div class="field-label">Combustivel</div><div class="field-value">'+(v.fuelType||v.fuel||'--')+'</div></div><div class="field"><div class="field-label">Chassi</div><div class="field-value">'+(v.chassi||v.chassis||'--')+'</div></div><div class="field"><div class="field-label">RENAVAM</div><div class="field-value">'+(v.renavam||'--')+'</div></div><div class="field"><div class="field-label">Km Atual</div><div class="field-value">'+(v.currentKm?Number(v.currentKm).toLocaleString('pt-BR')+' km':'--')+'</div></div><div class="field"><div class="field-label">Status</div><div class="field-value">'+(v.status==='active'?'Ativo':v.status==='maintenance'?'Manutenção':'Inativo')+'</div></div></div><div class="footer">Gerado por NetEscol em '+new Date().toLocaleDateString('pt-BR')+'</div></body></html>';const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.print();}}} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14}/> Imprimir</button><button onClick={function(){setViewVehicle(null);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div></div>
        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-center gap-4 mb-5"><div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center"><Bus size={24} className="text-primary-600"/></div><div><h2 className="text-xl font-bold text-gray-900">{viewVehicle.plate}</h2>{viewVehicle.nickname&&<p className="text-sm text-primary-600 font-medium">{viewVehicle.nickname}</p>}<p className="text-sm text-gray-500">{[viewVehicle.brand,viewVehicle.model,viewVehicle.year].filter(Boolean).join(' · ')}</p></div></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Capacidade</p><p className="text-sm font-medium">{viewVehicle.capacity||'--'} lugares</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Cor</p><p className="text-sm font-medium">{viewVehicle.color||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Combustivel</p><p className="text-sm font-medium">{viewVehicle.fuelType||viewVehicle.fuel||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Chassi</p><p className="text-sm font-medium">{viewVehicle.chassi||viewVehicle.chassis||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">RENAVAM</p><p className="text-sm font-medium">{viewVehicle.renavam||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Km Atual</p><p className="text-sm font-medium">{viewVehicle.currentKm?Number(viewVehicle.currentKm).toLocaleString('pt-BR')+' km':'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Status</p><p className="text-sm font-medium">{viewVehicle.status==='active'?'Ativo':viewVehicle.status==='maintenance'?'Manutenção':'Inativo'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Seguradora</p><p className="text-sm font-medium">{viewVehicle.insuranceCompany||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Apolice</p><p className="text-sm font-medium">{viewVehicle.insurancePolicy||'--'}</p></div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setViewVehicle(null);}} className="btn-secondary flex-1">Fechar</button><button onClick={function(){setViewVehicle(null);openEdit(viewVehicle);}} className="btn-primary flex-1">Editar</button></div>
      </div></div>)}

      <ExportModal allowSign={true} open={!!vehExportModal} onClose={function(){setVehExportModal(null)}} onExport={doVehExport} title={vehExportModal?'Exportar: '+vehExportModal.title:undefined}/>

      {confirmDelete&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir veículo {confirmDelete.plate}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={function(){setConfirmDelete(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){remove({id:confirmDelete.id},{onSuccess:function(){refetch();setConfirmDelete(null);}});}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {showModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId?'Editar Veículo':'Novo Veículo'}</h3><button onClick={function(){setShowModal(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="flex gap-1 px-5 pt-4">{(['dados','docs','manut'] as const).map(function(t){return(<button key={t} onClick={function(){setTab(t);}} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700'}`}>{t==='dados'?'Dados':t==='docs'?'Documentos':'Manutenção'}</button>);})}</div>
            <div className="overflow-y-auto flex-1 p-5">
              {tab==='dados'&&(<div className="grid grid-cols-2 gap-4">
                <div><label className="label">Placa *</label><input className="input" placeholder="ABC-1234" value={form.plate} onChange={setField('plate')}/></div>
                <div><label className="label">Apelido</label><input className="input" value={form.nickname} onChange={setField('nickname')}/></div>
                <div><label className="label">Marca</label><input className="input" value={form.brand} onChange={setField('brand')}/></div>
                <div><label className="label">Modelo</label><input className="input" value={form.model} onChange={setField('model')}/></div>
                <div><label className="label">Ano</label><input className="input" type="number" value={form.year} onChange={setField('year')}/></div>
                <div><label className="label">Capacidade</label><input className="input" type="number" value={form.capacity} onChange={setField('capacity')}/></div>
                <div><label className="label">Cor</label><input className="input" value={form.color} onChange={setField('color')}/></div>
                <div><label className="label">Combustível</label><select className="input" value={form.fuel} onChange={setField('fuel')}>{FUEL_TYPES.map(function(f){return <option key={f}>{f}</option>;})}</select></div>
                <div><label className="label">Chassi</label><input className="input" value={form.chassis} onChange={setField('chassis')}/></div>
                <div><label className="label">RENAVAM</label><input className="input" value={form.renavam} onChange={setField('renavam')}/></div>
              </div>)}
              {tab==='docs'&&(<div className="space-y-4"><div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><FileText size={14}/> Documentos do Veiculo</p><div className="grid grid-cols-2 gap-4"><div><label className="label">Vencimento CRLV</label><input className="input" type="date" value={form.crlvExpiry} onChange={setField('crlvExpiry')}/></div><div><label className="label">Vencimento IPVA</label><input className="input" type="date" value={form.ipvaExpiry} onChange={setField('ipvaExpiry')}/></div><div><label className="label">Vencimento Vistoria</label><input className="input" type="date" value={form.inspectionExpiry} onChange={setField('inspectionExpiry')}/></div><div><label className="label">Vencimento Extintor</label><input className="input" type="date" value={form.fireExtinguisherExpiry} onChange={setField('fireExtinguisherExpiry')}/></div></div></div><div className="p-4 bg-purple-50 rounded-xl"><p className="text-sm font-semibold text-purple-700 mb-3">Seguro</p><div className="grid grid-cols-2 gap-4"><div><label className="label">Seguradora</label><input className="input" value={form.insuranceCompany} onChange={setField('insuranceCompany')} placeholder="Ex: Porto Seguro"/></div><div><label className="label">N. da Apolice</label><input className="input" value={form.insurancePolicy} onChange={setField('insurancePolicy')}/></div><div><label className="label">Vencimento Seguro</label><input className="input" type="date" value={form.insuranceExpiry} onChange={setField('insuranceExpiry')}/></div><div><label className="label">Km Atual</label><input className="input" type="number" value={form.currentKm} onChange={setField('currentKm')} placeholder="0"/></div></div></div></div>)}
              {tab==='manut'&&(<div className="space-y-4"><div className="p-4 bg-orange-50 rounded-xl"><p className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2"><Wrench size={14}/> Manutenção</p><div className="grid grid-cols-2 gap-4"><div><label className="label">Última revisão</label><input className="input" type="date" value={form.lastRevision} onChange={setField('lastRevision')}/></div><div><label className="label">Próxima revisão</label><input className="input" type="date" value={form.nextRevision} onChange={setField('nextRevision')}/></div></div></div><div><label className="label">Observações</label><textarea className="input" rows={3} value={form.observations} onChange={setField('observations')}/></div></div>)}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Veículo'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
    }
