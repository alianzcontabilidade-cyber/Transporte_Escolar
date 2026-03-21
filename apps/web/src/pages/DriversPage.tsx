import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { Truck, Plus, X, Phone, Mail, Camera, Pencil, Trash2, AlertTriangle, Search, FileText, Navigation, Bus, Loader2, Eye, Download, Printer } from 'lucide-react';
import { maskCPF, validateCPF, maskPhone } from '../lib/utils';
import QuickAddModal from '../components/QuickAddModal';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';

function PhotoUpload({ value, onChange }: any) {
    const ref = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    return (<div className="flex flex-col items-center gap-2"><div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => ref.current?.click()}>{value?<img src={value} className="w-full h-full object-cover"/>:<Camera size={24} className="text-gray-400"/>}</div><div className="flex gap-2"><button type="button" onClick={() => ref.current?.click()} className="text-xs text-accent-500 hover:underline">Arquivo</button><span className="text-gray-300">|</span><button type="button" onClick={() => cameraRef.current?.click()} className="text-xs text-accent-500 hover:underline">Câmera</button></div><input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e){const f=e.target.files?.[0];if(f){const rd=new FileReader();rd.onload=function(ev){onChange(ev.target?.result);};rd.readAsDataURL(f);}}}/><input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={function(e){const f=e.target.files?.[0];if(f){const rd=new FileReader();rd.onload=function(ev){onChange(ev.target?.result);};rd.readAsDataURL(f);}}}/></div>);
}

const CNH_CATS=['B','C','D','E'];
const EF={name:'',cpf:'',phone:'',email:'',birthDate:'',address:'',state:'',city:'',cnhNumber:'',cnhCategory:'D',cnhExpiry:'',experience:'',routeId:'',vehicleId:'',photo:'',observations:''};

export default function DriversPage() {
    const {user}=useAuth();
    const municipalityId=user?.municipalityId||0;
    const [show,setShow]=useState(false);
    const [editId,setEditId]=useState<number|null>(null);
    const [form,setForm]=useState<any>(EF);
    const [tab,setTab]=useState<'dados'|'cnh'|'vinculo'>('dados');
    const [search,setSearch]=useState('');
    const [del,setDel]=useState<any>(null);
    const [viewDriver,setViewDriver]=useState<any>(null);
    const [err,setErr]=useState('');
    const [quickAdd, setQuickAdd] = useState<string | null>(null);
    const [cpfError,setCpfError]=useState('');
    const [page,setPage]=useState(1);
    const PER_PAGE=20;
    const { municipios: drvMunicipios, loading: drvMunLoading } = useMunicipios(form.state);
  
    const {data:drivers,refetch}=useQuery(function(){return api.drivers.list({municipalityId});}, [municipalityId]);
    const {data:routes, refetch:refetchRoutes}=useQuery(function(){return api.routes.list({municipalityId});}, [municipalityId]);
    const {data:vehicles, refetch:refetchVehicles}=useQuery(function(){return api.vehicles.list({municipalityId});}, [municipalityId]);
    const {mutate:create,loading:creating}=useMutation(api.drivers.create);
    const {mutate:update,loading:updating}=useMutation(api.drivers.update);
    const {mutate:remove}=useMutation(api.drivers.delete);
  
    const sf=function(k:string){return function(e:any){setForm(function(f:any){return{...f,[k]:e.target.value};});};};
  
    const handlePhoneChange = function(e: any) {
          setForm(function(f: any) { return {...f, phone: maskPhone(e.target.value)}; });
    };
  
    const handleCpfChange = function(e: any) {
          const masked = maskCPF(e.target.value);
          setForm(function(f: any) { return {...f, cpf: masked}; });
          const digits = e.target.value.replace(/\D/g, '');
          if (digits.length === 11) {
                  setCpfError(validateCPF(digits) ? '' : 'CPF inválido');
          } else {
                  setCpfError('');
          }
    };
  
    const rawDrivers=(drivers as any)||[];
    const allR=(routes as any)||[];
    const allV=(vehicles as any)||[];
    // Normalizar dados: a API retorna { driver: {...}, user: {...} }
    const all=rawDrivers.map(function(d:any){
      if(d.driver&&d.user) return { id:d.driver.id, name:d.user.name, email:d.user.email, phone:d.user.phone, cpf:d.user.cpf, cnhNumber:d.driver.cnhNumber, cnhCategory:d.driver.cnhCategory, cnhExpiry:d.driver.cnhExpiresAt, vehicleId:d.driver.vehicleId, userId:d.driver.userId, routeId: d.linkedRoute?.id || null, routeName: d.linkedRoute?.name || '', ...d.driver };
      return d;
    });
    const filtered=all.filter(function(d:any){const q=search.toLowerCase();return d.name?.toLowerCase().includes(q)||d.phone?.includes(q)||(d.cnhNumber||'').includes(q);});
    const totalPages=Math.ceil(filtered.length/PER_PAGE);
    const paginated=filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);
    const rn=function(id:string){return allR.find(function(r:any){return String(r.route?.id || r.id)===String(id);})?.route?.name||'';};
    const vp=function(id:string){const v=allV.find(function(v:any){return String(v.id)===String(id);});return v?v.plate+(v.nickname?' ('+v.nickname+')':''):'';};

    const openNew=function(){setForm(EF);setEditId(null);setTab('dados');setErr('');setCpfError('');setShow(true);};
    const openEdit=function(d:any){setForm({...EF,...d, cnhExpiry: d.cnhExpiry || d.cnhExpiresAt ? (typeof (d.cnhExpiry || d.cnhExpiresAt) === 'string' ? (d.cnhExpiry || d.cnhExpiresAt).split('T')[0] : new Date(d.cnhExpiry || d.cnhExpiresAt).toISOString().split('T')[0]) : '', birthDate: d.birthDate ? (typeof d.birthDate === 'string' ? d.birthDate.split('T')[0] : new Date(d.birthDate).toISOString().split('T')[0]) : '', vehicleId: d.vehicleId ? String(d.vehicleId) : '', routeId: d.routeId ? String(d.routeId) : ''});setEditId(d.id);setTab('dados');setErr('');setCpfError('');setShow(true);};
  
    const save=function(){
          if(!form.name||!form.phone){setErr('Nome e telefone obrigatórios.');return;}
          if(cpfError){setErr('Corrija o CPF antes de salvar.');return;}
          const cpfDigits = (form.cpf || '').replace(/\D/g, '');
          if(cpfDigits.length > 0 && cpfDigits.length !== 11){setErr('CPF incompleto.');return;}
          if(cpfDigits.length === 11 && !validateCPF(cpfDigits)){setErr('CPF inválido.');return;}
      
          const p={municipalityId,name:form.name,cpf:form.cpf||undefined,phone:form.phone,email:form.email||undefined,birthDate:form.birthDate||undefined,address:form.address||undefined,city:form.city||undefined,cnhNumber:form.cnhNumber||undefined,cnhCategory:form.cnhCategory||undefined,cnhExpiry:form.cnhExpiry||undefined,experience:form.experience?parseInt(form.experience):undefined,routeId:form.routeId?parseInt(form.routeId):undefined,vehicleId:form.vehicleId?parseInt(form.vehicleId):undefined,photo:form.photo||undefined,observations:form.observations||undefined};
          if(editId!==null){update({id:editId,...p},{onSuccess:function(){refetch();setShow(false);},onError:function(e:any){setErr(e?.message||'Erro');}});}
          else{create(p,{onSuccess:function(){refetch();setShow(false);},onError:function(e:any){setErr(e?.message||'Erro');}});}
    };
  
    const [drvExportModal, setDrvExportModal] = useState<{title:string;data:any[];cols:string[];filename:string}|null>(null);
    const drvExportRows = all.map(function(d: any) { return { nome: d.name||'', cpf: d.cpf||'', telefone: d.phone||'', email: d.email||'', cnh: d.cnhNumber||'', categoria: d.cnhCategory||'', validade_cnh: d.cnhExpiry ? new Date(d.cnhExpiry).toLocaleDateString('pt-BR') : '', rota: d.routeName||'' }; });
    const drvExportCols = ['Nome','CPF','Telefone','Email','CNH','Categoria','Validade CNH','Rota'];
    function buildDriversHTML(title: string, data: any[], cols: string[]) {
      const rows = data.map(function(r: any) { return '<tr>' + Object.values(r).map(function(v: any) { return '<td>'+(v||'')+'</td>'; }).join('') + '</tr>'; }).join('');
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+title+'</title><style>body{font-family:Arial,sans-serif;padding:30px}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px;font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f8f9fa}@media print{@page{margin:10mm;size:A4 landscape}}</style></head><body><h1>'+title+'</h1><table><thead><tr>'+cols.map(function(c) { return '<th>'+c+'</th>'; }).join('')+'</tr></thead><tbody>'+rows+'</tbody></table><p style="margin-top:15px;font-size:11px;color:#666">Total: '+data.length+' registro(s) | NetEscol '+new Date().toLocaleDateString('pt-BR')+'</p></body></html>';
    }
    const doDrvExport = function(format: ExportFormat) {
      if (!drvExportModal) return;
      const html = buildDriversHTML(drvExportModal.title, drvExportModal.data, drvExportModal.cols);
      handleExport(format, drvExportModal.data, html, drvExportModal.filename);
    };

    const printDriver = function(d: any) {
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+d.name+' - NetEscol</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}.field{padding:10px;background:#f8f9fa;border-radius:8px}.field-label{font-size:11px;color:#999;margin-bottom:3px}.field-value{font-size:14px;font-weight:500}.footer{margin-top:30px;text-align:center;font-size:11px;color:#999}@media print{body{padding:15px}}</style></head><body><h1>Ficha do Motorista</h1><div class="grid"><div class="field"><div class="field-label">Nome</div><div class="field-value">'+d.name+'</div></div><div class="field"><div class="field-label">CPF</div><div class="field-value">'+(d.cpf||'--')+'</div></div><div class="field"><div class="field-label">Telefone</div><div class="field-value">'+(d.phone||'--')+'</div></div><div class="field"><div class="field-label">Email</div><div class="field-value">'+(d.email||'--')+'</div></div><div class="field"><div class="field-label">CNH Numero</div><div class="field-value">'+(d.cnhNumber||'--')+'</div></div><div class="field"><div class="field-label">CNH Categoria</div><div class="field-value">'+(d.cnhCategory||'--')+'</div></div><div class="field"><div class="field-label">Validade CNH</div><div class="field-value">'+(d.cnhExpiry?new Date(d.cnhExpiry).toLocaleDateString('pt-BR'):'--')+'</div></div><div class="field"><div class="field-label">Rota Vinculada</div><div class="field-value">'+(d.routeName||'--')+'</div></div></div><div class="footer">Gerado por NetEscol em '+new Date().toLocaleDateString('pt-BR')+'</div></body></html>';
      const w = window.open('','_blank'); if(w){w.document.write(html);w.document.close();w.print();}
    };

    const ca=function(exp:string){
          if(!exp)return null;
          const d=Math.ceil((new Date(exp).getTime()-Date.now())/86400000);
          if(d<0)return <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={10}/>CNH vencida</span>;
          if(d<60)return <span className="text-xs text-yellow-500 flex items-center gap-1"><AlertTriangle size={10}/>Vence em {d}d</span>;
          return null;
    };
  
    return (
          <div className="p-6">
                <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold text-gray-900">Motoristas</h1><p className="text-gray-500">{all.length} motorista(s)</p></div><div className="flex gap-2"><button onClick={function(){setDrvExportModal({title:'Lista de Motoristas',data:drvExportRows,cols:drvExportCols,filename:'motoristas_netescol'})}} className="btn-secondary flex items-center gap-2"><Download size={16}/> Exportar</button><button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Motorista</button></div></div>
                <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar nome, telefone ou CNH..." value={search} onChange={function(e){setSearch(e.target.value);setPage(1);}}/></div>
                <div className="grid gap-3">
                  {paginated.map(function(d:any){return(
                      <div key={d.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center flex-shrink-0">{d.photo?<img src={d.photo} className="w-full h-full object-cover"/>:<span className="font-bold text-orange-700 text-lg">{d.name?.[0]}</span>}</div>
                                  <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5"><p className="font-semibold text-gray-800">{d.name}</p>{d.cnhCategory&&<span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">CNH {d.cnhCategory}</span>}</div>
                                                <div className="flex gap-3 flex-wrap text-xs text-gray-500">{d.phone&&<span className="flex items-center gap-1"><Phone size={10}/>{d.phone}</span>}{d.email&&<span className="flex items-center gap-1"><Mail size={10}/>{d.email}</span>}{d.cnhNumber&&<span className="flex items-center gap-1"><FileText size={10}/>{d.cnhNumber}</span>}{ca(d.cnhExpiry)}</div>
                                                <div className="flex gap-2 mt-1">{(d.routeId||d.routeName)&&<span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Navigation size={10}/>{d.routeName || rn(d.routeId)}</span>}{d.vehicleId&&<span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Bus size={10}/>{vp(d.vehicleId)}</span>}</div>
                                  </div>
                                  <div className="flex items-center gap-1"><button onClick={function(){setViewDriver(d);}} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Ver detalhes"><Eye size={15}/></button><button onClick={function(){openEdit(d);}} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={15}/></button><button onClick={function(){setDel(d);}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button></div>
                      </div>
                    );})}
                  {!filtered.length&&!search&&<div className="card text-center py-16"><Truck size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhum motorista</p><button className="btn-primary" onClick={openNew}>Adicionar motorista</button></div>}
                </div>
                {totalPages>1&&(<div className="flex items-center justify-between mt-4"><p className="text-sm text-gray-500">Mostrando {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE,filtered.length)} de {filtered.length}</p><div className="flex gap-1"><button onClick={function(){setPage(1);}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<<'}</button><button onClick={function(){setPage(function(p){return Math.max(1,p-1);});}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<'}</button><span className="px-3 py-1.5 text-sm font-medium">{page}/{totalPages}</span><button onClick={function(){setPage(function(p){return Math.min(totalPages,p+1);});}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>'}</button><button onClick={function(){setPage(totalPages);}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>>'}</button></div></div>)}
          
            {viewDriver&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-blue-500"/> Detalhes do Motorista</h3><div className="flex gap-2"><button onClick={function(){printDriver(viewDriver);}} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14}/> Imprimir</button><button onClick={function(){setViewDriver(null);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div></div>
      <div className="overflow-y-auto flex-1 p-5">
        <div className="flex items-center gap-4 mb-5"><div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-700">{viewDriver.name?.[0]}</div><div><h2 className="text-xl font-bold text-gray-900">{viewDriver.name}</h2>{viewDriver.cnhCategory&&<p className="text-sm text-gray-500">CNH {viewDriver.cnhCategory}</p>}</div></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Telefone</p><p className="text-sm font-medium">{viewDriver.phone||'--'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium">{viewDriver.email||'--'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">CPF</p><p className="text-sm font-medium">{viewDriver.cpf||'--'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">CNH Numero</p><p className="text-sm font-medium">{viewDriver.cnhNumber||'--'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Categoria</p><p className="text-sm font-medium">{viewDriver.cnhCategory||'--'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Validade CNH</p><p className="text-sm font-medium">{viewDriver.cnhExpiry?new Date(viewDriver.cnhExpiry).toLocaleDateString('pt-BR'):'--'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Rota</p><p className="text-sm font-medium">{viewDriver.routeName||'Sem rota vinculada'}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Veiculo</p><p className="text-sm font-medium">{viewDriver.vehicleId?vp(viewDriver.vehicleId):'Sem veiculo'}</p></div>
        </div>
      </div>
      <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setViewDriver(null);}} className="btn-secondary flex-1">Fechar</button><button onClick={function(){setViewDriver(null);openEdit(viewDriver);}} className="btn-primary flex-1">Editar</button></div>
    </div></div>)}

          {del&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3"/><h3 className="font-bold mb-2">Excluir {del.name}?</h3><p className="text-sm text-gray-500 mb-5">Esta ação não pode ser desfeita.</p><div className="flex gap-3"><button onClick={function(){setDel(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){remove({id:del.id},{onSuccess:function(){refetch();setDel(null);}});}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}
          
            {show&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId?'Editar Motorista':'Novo Motorista'}</h3><button onClick={function(){setShow(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
                    <div className="flex gap-1 px-5 pt-4">{(['dados','cnh','vinculo'] as const).map(function(t){return(<button key={t} onClick={function(){setTab(t);}} className={'px-4 py-1.5 rounded-lg text-sm font-medium transition-all '+(tab===t?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700')}>{t==='dados'?'Dados Pessoais':t==='cnh'?'CNH':'Vínculo'}</button>);})}</div>
                    <div className="overflow-y-auto flex-1 p-5 space-y-3">
                      {err&&<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
                      {tab==='dados'&&(<>
                                  <div className="flex justify-center mb-2"><PhotoUpload value={form.photo} onChange={function(v:string){setForm(function(f:any){return{...f,photo:v};});}}/></div>
                                  <div className="grid grid-cols-2 gap-3">
                                                <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={form.name} onChange={sf('name')}/></div>
                                                <div>
                                                                <label className="label">CPF</label>
                                                                <input className="input" value={form.cpf} onChange={handleCpfChange} placeholder="000.000.000-00" maxLength={14}/>
                                                  {cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}
                                                </div>
                                                <div><label className="label">Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={sf('birthDate')}/></div>
                                                <div><label className="label">Telefone *</label><input className="input" value={form.phone} onChange={handlePhoneChange} placeholder="(63) 00000-0000" maxLength={15}/></div>
                                                <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={sf('email')}/></div>
                                                <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={sf('address')}/></div>
                                                <div><label className="label">Estado</label><select className="input" value={form.state} onChange={function(e:any){setForm(function(f:any){return{...f,state:e.target.value,city:''};});}}><option value="">Selecione</option>{ESTADOS_BR.map(function(es){return <option key={es.uf} value={es.uf}>{es.uf}</option>;})}</select></div>
                                                <div><label className="label">Cidade {drvMunLoading && <Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.city} onChange={sf('city')} disabled={!form.state||drvMunLoading}><option value="">Selecione</option>{drvMunicipios.map(function(m:any){return <option key={m.id} value={m.nome}>{m.nome}</option>;})}</select></div>
                                                <div><label className="label">Observações</label><input className="input" value={form.observations} onChange={sf('observations')}/></div>
                                  </div>
                      </>)}
                      {tab==='cnh'&&(<div className="grid grid-cols-2 gap-3"><div><label className="label">Número CNH</label><input className="input" value={form.cnhNumber} onChange={sf('cnhNumber')}/></div><div><label className="label">Categoria</label><select className="input" value={form.cnhCategory} onChange={sf('cnhCategory')}>{CNH_CATS.map(function(c){return <option key={c}>{c}</option>;})}</select></div><div><label className="label">Validade CNH</label><input className="input" type="date" value={form.cnhExpiry} onChange={sf('cnhExpiry')}/></div><div><label className="label">Experiência (anos)</label><input className="input" type="number" min="0" value={form.experience} onChange={sf('experience')}/></div></div>)}
                      {tab==='vinculo'&&(<div className="space-y-4"><div className="p-4 bg-primary-50 rounded-xl"><p className="text-sm font-semibold text-primary-700 mb-2 flex items-center gap-2"><Navigation size={14}/> Rota vinculada</p><div className="flex gap-1"><select className="input flex-1" value={form.routeId} onChange={sf('routeId')}><option value="">— Nenhuma rota —</option>{allR.map(function(rt:any){return <option key={(rt.route?.id || rt.id)} value={(rt.route?.id || rt.id)}>{(rt.route?.name || rt.name)}{(rt.route?.code || rt.code)?' ('+(rt.route?.code || rt.code)+')':''}</option>;})}</select><button type="button" onClick={() => setQuickAdd('route')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar rota"><Plus size={16}/></button></div></div><div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2"><Bus size={14}/> Veículo vinculado</p><div className="flex gap-1"><select className="input flex-1" value={form.vehicleId} onChange={sf('vehicleId')}><option value="">— Nenhum veículo —</option>{allV.map(function(v:any){return <option key={v.id} value={v.id}>{v.plate}{v.nickname?' — '+v.nickname:''}{v.brand?' ('+v.brand+(v.model?' '+v.model:'')+(v.year?' '+v.year:'')+')':''}</option>;})}</select><button type="button" onClick={() => setQuickAdd('vehicle')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar veículo"><Plus size={16}/></button></div></div><p className="text-xs text-gray-400">Vincular motorista à rota e veículo habilita rastreamento em tempo real.</p></div>)}
                    </div>
                    <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShow(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Motorista'}</button></div>
            </div></div>)}

          <ExportModal open={!!drvExportModal} onClose={function(){setDrvExportModal(null)}} onExport={doDrvExport} title={drvExportModal?'Exportar: '+drvExportModal.title:undefined}/>

          {/* Quick Add Modal */}
          {quickAdd && (
            <QuickAddModal
              entityType={quickAdd as any}
              municipalityId={municipalityId}
              onClose={() => setQuickAdd(null)}
              onSuccess={(entity) => {
                if (quickAdd === 'vehicle') { refetchVehicles(); setForm((f: any) => ({ ...f, vehicleId: String(entity.id) })); }
                else if (quickAdd === 'route') { refetchRoutes(); setForm((f: any) => ({ ...f, routeId: String(entity.id) })); }
                setQuickAdd(null);
              }}
            />
          )}
          </div>
        );
}
