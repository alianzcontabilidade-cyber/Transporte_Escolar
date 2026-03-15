import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Plus, X, Wrench, FileText, AlertTriangle, CheckCircle, Clock, Fuel, ChevronRight } from 'lucide-react';

const STATUS_COLORS: any = { active:'bg-green-100 text-green-700', maintenance:'bg-yellow-100 text-yellow-700', inactive:'bg-red-100 text-red-700' };
const STATUS_LABELS: any = { active:'Ativo', maintenance:'Manutenção', inactive:'Inativo' };
const FUEL_TYPES = ['Diesel','Gasolina','Etanol','GNV','Elétrico','Híbrido'];
const emptyForm = { plate:'', nickname:'', brand:'', model:'', year:'', capacity:'40', color:'', fuel:'Diesel', chassis:'', renavam:'', crlvExpiry:'', ipvaExpiry:'', lastRevision:'', nextRevision:'', observations:'' };

function StatusBadge({ status }: any) {
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status]||'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[status]||status}</span>;
}
function DocAlert({ label, date }: { label: string; date: string }) {
  if (!date) return null;
  const days = Math.ceil((new Date(date).getTime()-Date.now())/86400000);
  const color = days<0?'text-red-600 bg-red-50':days<30?'text-yellow-600 bg-yellow-50':'text-green-600 bg-green-50';
  const icon = days<0?<AlertTriangle size={12}/>:days<30?<Clock size={12}/>:<CheckCircle size={12}/>;
  return <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${color}`}>{icon} {label}: {days<0?`Vencido há ${Math.abs(days)}d`:`${days}d`}</div>;
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [tab, setTab] = useState<'dados'|'docs'|'manut'>('dados');
  const [form, setForm] = useState<any>(emptyForm);
  const [filter, setFilter] = useState<'all'|'active'|'maintenance'|'inactive'>('all');
  const { data: vehicles, refetch } = useQuery(() => api.vehicles.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.vehicles.create);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const allVehicles = (vehicles as any)||[];
  const filtered = filter==='all' ? allVehicles : allVehicles.filter((v: any) => v.status===filter);
  const counts = { all:allVehicles.length, active:allVehicles.filter((v: any) => v.status==='active').length, maintenance:allVehicles.filter((v: any) => v.status==='maintenance').length, inactive:allVehicles.filter((v: any) => v.status==='inactive').length };
  const openNew = () => { setForm(emptyForm); setTab('dados'); setShow(true); };
  const handleSave = () => { create({ municipalityId, plate:form.plate, nickname:form.nickname||undefined, brand:form.brand||undefined, model:form.model||undefined, year:form.year?parseInt(form.year):undefined, capacity:form.capacity?parseInt(form.capacity):undefined }, { onSuccess:() => { refetch(); setShow(false); }, onError:(e: any) => alert(e?.message||'Erro') }); };
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold text-gray-900">Veículos</h1><p className="text-gray-500">{allVehicles.length} veículo(s) na frota</p></div><button className="btn-primary flex items-center gap-2" onClick={openNew}><Plus size={16}/> Novo Veículo</button></div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[['all','Total','bg-gray-50 border-gray-200'],['active','Ativos','bg-green-50 border-green-200'],['maintenance','Manutenção','bg-yellow-50 border-yellow-200'],['inactive','Inativos','bg-red-50 border-red-200']].map(([s,l,cls]: any) => (
          <button key={s} onClick={() => setFilter(s)} className={`card border p-3 text-center transition-all ${cls} ${filter===s?'ring-2 ring-primary-400':''}`}><p className="text-xl font-bold text-gray-800">{counts[s as keyof typeof counts]}</p><p className="text-xs text-gray-500">{l}</p></button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((v: any) => (
          <div key={v.id} className="card hover:border-primary-200 transition-colors cursor-pointer" onClick={() => setDetail(v)}>
            <div className="flex items-start justify-between mb-3"><div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center"><Bus size={20} className="text-primary-600"/></div><StatusBadge status={v.status}/></div>
            <p className="font-bold text-gray-900 text-lg tracking-wide">{v.plate}</p>
            {v.nickname && <p className="text-primary-600 text-sm font-medium">{v.nickname}</p>}
            <p className="text-sm text-gray-500 mt-0.5">{[v.brand,v.model,v.year].filter(Boolean).join(' · ')}</p>
            <div className="flex flex-wrap gap-2 mt-3">{v.capacity && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Bus size={10}/> {v.capacity} lugares</span>}{v.fuel && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Fuel size={10}/> {v.fuel}</span>}</div>
            {(v.crlvExpiry||v.ipvaExpiry) && <div className="flex flex-col gap-1 mt-2"><DocAlert label="CRLV" date={v.crlvExpiry}/><DocAlert label="IPVA" date={v.ipvaExpiry}/></div>}
            {v.nextRevision && <div className="mt-2 flex items-center gap-1 text-xs text-gray-400"><Wrench size={10}/> Próxima revisão: {new Date(v.nextRevision).toLocaleDateString('pt-BR')}</div>}
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between"><span className="text-xs text-gray-400">Ver detalhes</span><ChevronRight size={14} className="text-gray-400"/></div>
          </div>
        ))}
        {!filtered.length && <div className="col-span-3 card text-center py-16"><Bus size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">{filter==='all'?'Nenhum veículo cadastrado':`Nenhum veículo ${STATUS_LABELS[filter]?.toLowerCase()}`}</p>{filter==='all' && <button className="btn-primary" onClick={openNew}>Cadastrar primeiro veículo</button>}</div>}
      </div>
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><Bus size={18} className="text-primary-600"/></div><div><p className="font-bold text-gray-900">{detail.plate}</p><p className="text-sm text-gray-500">{[detail.brand,detail.model,detail.year].filter(Boolean).join(' · ')}</p></div></div><div className="flex items-center gap-2"><StatusBadge status={detail.status}/><button onClick={() => setDetail(null)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18}/></button></div></div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {detail.nickname && <div className="col-span-2 p-3 bg-primary-50 rounded-xl"><p className="text-xs text-primary-500 font-medium">Apelido</p><p className="font-semibold text-primary-700">{detail.nickname}</p></div>}
                {detail.capacity && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Capacidade</p><p className="font-semibold">{detail.capacity} lugares</p></div>}
                {detail.fuel && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Combustível</p><p className="font-semibold flex items-center gap-1"><Fuel size={14}/> {detail.fuel}</p></div>}
              </div>
              <div><p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><FileText size={14}/> Documentação</p><div className="space-y-2">{detail.crlvExpiry?<DocAlert label="CRLV" date={detail.crlvExpiry}/>:<p className="text-xs text-gray-400 px-2">CRLV não informado</p>}{detail.ipvaExpiry?<DocAlert label="IPVA" date={detail.ipvaExpiry}/>:<p className="text-xs text-gray-400 px-2">IPVA não informado</p>}</div></div>
              <div><p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Wrench size={14}/> Manutenção</p><div className="grid grid-cols-2 gap-2">{detail.lastRevision && <div className="p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Última revisão</p><p className="text-sm font-medium">{new Date(detail.lastRevision).toLocaleDateString('pt-BR')}</p></div>}{detail.nextRevision && <div className="p-2 bg-yellow-50 rounded-lg"><p className="text-xs text-yellow-600">Próxima revisão</p><p className="text-sm font-semibold text-yellow-700">{new Date(detail.nextRevision).toLocaleDateString('pt-BR')}</p></div>}</div></div>
              {detail.observations && <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Observações</p><p className="text-sm text-gray-700">{detail.observations}</p></div>}
            </div>
          </div>
        </div>
      )}
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">Novo Veículo</h3><button onClick={() => setShow(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="flex gap-1 px-5 pt-4">{(['dados','docs','manut'] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700'}`}>{t==='dados'?'Dados':t==='docs'?'Documentos':'Manutenção'}</button>))}</div>
            <div className="overflow-y-auto flex-1 p-5">
              {tab==='dados' && (<div className="grid grid-cols-2 gap-4"><div><label className="label">Placa *</label><input className="input" placeholder="ABC-1234" value={form.plate} onChange={set('plate')}/></div><div><label className="label">Apelido</label><input className="input" value={form.nickname} onChange={set('nickname')}/></div><div><label className="label">Marca</label><input className="input" value={form.brand} onChange={set('brand')}/></div><div><label className="label">Modelo</label><input className="input" value={form.model} onChange={set('model')}/></div><div><label className="label">Ano</label><input className="input" type="number" value={form.year} onChange={set('year')}/></div><div><label className="label">Capacidade</label><input className="input" type="number" value={form.capacity} onChange={set('capacity')}/></div><div><label className="label">Cor</label><input className="input" value={form.color} onChange={set('color')}/></div><div><label className="label">Combustível</label><select className="input" value={form.fuel} onChange={set('fuel')}>{FUEL_TYPES.map(f => <option key={f}>{f}</option>)}</select></div><div><label className="label">Chassi</label><input className="input" value={form.chassis} onChange={set('chassis')}/></div><div><label className="label">RENAVAM</label><input className="input" value={form.renavam} onChange={set('renavam')}/></div></div>)}
              {tab==='docs' && (<div className="space-y-4"><div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><FileText size={14}/> Documentos</p><div className="grid grid-cols-2 gap-4"><div><label className="label">Vencimento CRLV</label><input className="input" type="date" value={form.crlvExpiry} onChange={set('crlvExpiry')}/></div><div><label className="label">Vencimento IPVA</label><input className="input" type="date" value={form.ipvaExpiry} onChange={set('ipvaExpiry')}/></div></div></div><div className="p-3 bg-yellow-50 rounded-xl text-xs text-yellow-700"><p className="font-medium mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Alertas automáticos</p><p>Alertas serão exibidos 30 dias antes do vencimento.</p></div></div>)}
              {tab==='manut' && (<div className="space-y-4"><div className="p-4 bg-orange-50 rounded-xl"><p className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2"><Wrench size={14}/> Manutenção</p><div className="grid grid-cols-2 gap-4"><div><label className="label">Última revisão</label><input className="input" type="date" value={form.lastRevision} onChange={set('lastRevision')}/></div><div><label className="label">Próxima revisão</label><input className="input" type="date" value={form.nextRevision} onChange={set('nextRevision')}/></div></div></div><div><label className="label">Observações</label><textarea className="input" rows={3} value={form.observations} onChange={set('observations')} placeholder="Histórico de revisões..."/></div></div>)}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={() => setShow(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleSave} disabled={loading} className="btn-primary flex-1">{loading?'Salvando...':'Salvar Veículo'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
                                   }
