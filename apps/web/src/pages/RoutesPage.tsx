import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { MapPin, Plus, X, Clock, Trash2, Navigation, Info, LayoutList, Search, Play, Square, Bus, User, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

const SHIFTS = [{ v:'morning', l:'Manhã' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' }];
const TYPES = [{ v:'pickup', l:'Ida' },{ v:'dropoff', l:'Volta' },{ v:'both', l:'Ida e Volta' }];

function LeafletMap({ stops, onAddStop, readonly }: { stops: any[]; onAddStop: (s: any) => void; readonly?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [srch, setSrch] = useState('');
  const [busy, setBusy] = useState(false);
  const [sugg, setSugg] = useState<any[]>([]);
  useEffect(() => {
    if (!mapRef.current||mapInst.current) return;
    const sc = document.createElement('script'); sc.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    sc.onload = () => { const lk=document.createElement('link');lk.rel='stylesheet';lk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(lk); const L=(window as any).L; const map=L.map(mapRef.current!).setView([-15.78,-47.93],13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map); if(!readonly)map.on('click',(e:any)=>{const n=prompt('Nome da parada:');if(n)onAddStop({name:n,lat:String(e.latlng.lat.toFixed(6)),lng:String(e.latlng.lng.toFixed(6))});}); mapInst.current=map; };
    document.head.appendChild(sc);
    return () => { if(mapInst.current){mapInst.current.remove();mapInst.current=null;} };
  }, [readonly]);
  useEffect(() => {
    const L=(window as any).L; if(!mapInst.current||!L) return;
    markers.current.forEach(m=>{try{m.remove();}catch(_){}});markers.current=[];
    const pts: number[][]=[];
    (stops||[]).forEach((st:any,i:number)=>{ if(!st.lat||!st.lng)return; const la=parseFloat(st.lat),ln=parseFloat(st.lng); if(isNaN(la)||isNaN(ln))return; const icon=L.divIcon({html:`<div style="background:#f97316;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.25)">${i+1}</div>`,className:'',iconSize:[26,26],iconAnchor:[13,13]}); markers.current.push(L.marker([la,ln],{icon}).addTo(mapInst.current).bindPopup(`<b>${i+1}. ${st.name}</b>`)); pts.push([la,ln]); });
    if(pts.length>1){const pl=L.polyline(pts,{color:'#f97316',weight:3,dashArray:'6 4'}).addTo(mapInst.current);markers.current.push(pl);mapInst.current.fitBounds(pl.getBounds(),{padding:[30,30]});}
    else if(pts.length===1)mapInst.current.setView(pts[0] as any,15);
  }, [stops]);
  const doSearch = (q:string) => { setSrch(q); if(q.length<3){setSugg([]);return;} setBusy(true); fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q)+'&countrycodes=br&limit=6',{headers:{'Accept-Language':'pt-BR','User-Agent':'TransEscolar/1.0'}}).then(r=>r.json()).then(d=>{setSugg(d);setBusy(false);}).catch(()=>{setSugg([]);setBusy(false);}); };
  const goTo = (pl:any) => { const L=(window as any).L; if(!mapInst.current||!L)return; const la=parseFloat(pl.lat),ln=parseFloat(pl.lon); mapInst.current.setView([la,ln],16); const icon=L.divIcon({html:'<div style="background:#3b82f6;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:14px;font-weight:bold">P</div>',className:'',iconSize:[28,28],iconAnchor:[14,14]}); markers.current.push(L.marker([la,ln],{icon}).addTo(mapInst.current).bindPopup('<b>'+pl.display_name.split(',').slice(0,3).join(', ')+'</b>').openPopup()); setSrch(pl.display_name.split(',').slice(0,3).join(', ')); setSugg([]); };
  return (
    <div className="space-y-2">
      <div className="relative"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9 text-sm" placeholder="Buscar rua, bairro, cidade, estado..." value={srch} onChange={e=>doSearch(e.target.value)}/>{busy&&<div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"/>}</div>
        {sugg.length>0&&(<div className="absolute z-[9999] w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 overflow-hidden">{sugg.map((s:any,i:number)=>(<button key={i} onClick={()=>goTo(s)} className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b last:border-0 border-gray-100"><p className="text-sm font-medium text-gray-800 truncate">{s.display_name.split(',').slice(0,3).join(', ')}</p><p className="text-xs text-gray-400 truncate mt-0.5">{s.display_name.split(',').slice(3,6).join(', ')}</p></button>))}</div>)}
      </div>
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200" style={{height:'280px'}}><div ref={mapRef} className="w-full h-full"/>{!readonly&&<div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-gray-500 flex items-center gap-1 shadow"><MapPin size={10}/> Clique no mapa para adicionar paradas</div>}</div>
    </div>
  );
}

export default function RoutesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [viewRoute, setViewRoute] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list'|'map'>('list');
  const [form, setForm] = useState({ name:'', code:'', description:'', type:'both', shift:'morning', scheduledStartTime:'06:30', scheduledEndTime:'07:30' });
  const [stops, setStops] = useState<{name:string;lat:string;lng:string}[]>([]);
  const [newStop, setNewStop] = useState({ name:'', lat:'', lng:'' });
  const [tripModal, setTripModal] = useState<any>(null);
  const [tripForm, setTripForm] = useState({ driverId:'', vehicleId:'' });
  const { data: routes, refetch } = useQuery(function(){return api.routes.list({municipalityId});}, [municipalityId]);
  const { data: activeTrips, refetch: refetchTrips } = useQuery(function(){return api.trips.listActive({municipalityId});}, [municipalityId]);
  const { data: drivers } = useQuery(function(){return api.drivers.list({municipalityId});}, [municipalityId]);
  const { data: vehicles } = useQuery(function(){return api.vehicles.list({municipalityId});}, [municipalityId]);
  const { mutate: create, loading } = useMutation(api.routes.create);
  const { mutate: removeRoute } = useMutation(api.routes.delete);
  const { mutate: startTrip, loading: starting } = useMutation(api.trips.start);
  const { mutate: endTrip } = useMutation(api.trips.complete);

  const allRoutes = (routes as any)||[];
  const allTrips = (activeTrips as any)||[];
  const allDrivers = (drivers as any)||[];
  const allVehicles = (vehicles as any)||[];

  const setField = function(k:string){return function(e:any){setForm(function(f:any){return{...f,[k]:e.target.value};});};};
  const tl = (t:string) => TYPES.find(x=>x.v===t)?.l||t;
  const sl = (s:string) => SHIFTS.find(x=>x.v===s)?.l||s;
  const addStop = (stop?:{name:string;lat:string;lng:string}) => { const s=stop||newStop; if(!s.name)return; setStops(prev=>[...prev,s]); if(!stop)setNewStop({name:'',lat:'',lng:''}) };
  const removeStop = (i:number) => setStops(prev=>prev.filter((_,idx)=>idx!==i));
  const generateCode = () => {
    const existing = allRoutes.map((r:any) => r.route?.code || '').filter((c:string) => /^R\d+$/.test(c));
    const nums = existing.map((c:string) => parseInt(c.replace('R', '')));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return 'R' + String(next).padStart(3, '0');
  };
  const openNew = () => { setForm({name:'',code:generateCode(),description:'',type:'both',shift:'morning',scheduledStartTime:'06:30',scheduledEndTime:'07:30'}); setStops([]); setShow(true); };

  const getActiveTrip = (routeId:number) => allTrips.find((t:any)=>t.trip?.routeId===routeId&&t.trip?.status==='started');

  const openTripModal = (rt:any) => {
    const activeDriver = allDrivers.find((d:any)=>String(d.routeId)===String(rt.route.id));
    const activeVehicle = allVehicles.find((v:any)=>String(v.id)===String(activeDriver?.vehicleId));
    setTripForm({ driverId: activeDriver ? String(activeDriver.id) : '', vehicleId: activeVehicle ? String(activeVehicle.id) : '' });
    setTripModal(rt);
  };

  const handleStartTrip = () => {
    if(!tripForm.driverId||!tripForm.vehicleId){ alert('Selecione motorista e veículo'); return; }
    startTrip({ routeId: tripModal.route.id, driverId: parseInt(tripForm.driverId), vehicleId: parseInt(tripForm.vehicleId), municipalityId }, { onSuccess: function(){ refetchTrips(); setTripModal(null); } });
  };

  const handleEndTrip = (tripId:number) => {
    if(confirm('Encerrar esta viagem?')) endTrip({ tripId }, { onSuccess: function(){ refetchTrips(); } });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Rotas</h1><p className="text-gray-500">{allRoutes.length} rota(s) · {allTrips.filter((t:any)=>t.trip?.status==='started').length} em andamento</p></div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1"><button onClick={()=>setViewMode('list')} className={'p-1.5 rounded-md transition-all '+(viewMode==='list'?'bg-white shadow text-primary-600':'text-gray-400')}><LayoutList size={16}/></button><button onClick={()=>setViewMode('map')} className={'p-1.5 rounded-md transition-all '+(viewMode==='map'?'bg-white shadow text-primary-600':'text-gray-400')}><MapPin size={16}/></button></div>
          <button className="btn-primary flex items-center gap-2" onClick={openNew}><Plus size={16}/> Nova Rota</button>
        </div>
      </div>

      {viewMode==='list' ? (
        <div className="grid gap-3">
          {allRoutes.map(function(r:any){
            const activeTrip = getActiveTrip(r.route.id);
            const isActive = !!activeTrip;
            return (
              <div key={r.route.id} className={'card transition-all '+(isActive?'border-green-300 bg-green-50/30':'hover:border-primary-200')}>
                <div className="flex items-center gap-4">
                  <div className={'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 '+(isActive?'bg-green-100':'bg-primary-100')}>
                    <MapPin size={20} className={isActive?'text-green-600':'text-primary-600'}/>
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setViewRoute(viewRoute?.route.id===r.route.id?null:r)}>
                    <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{r.route.name}</p>{r.route.code&&<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{r.route.code}</span>}{isActive&&<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"/>Em andamento</span>}</div>
                    <div className="flex gap-3 mt-0.5"><span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/>{r.route.scheduledStartTime} – {r.route.scheduledEndTime}</span><span className="text-xs text-gray-500">{sl(r.route.shift)}</span><span className="text-xs text-gray-500">{tl(r.route.type)}</span><span className="text-xs text-gray-500 flex items-center gap-1"><Navigation size={10}/>{r.stops?.length||0} paradas</span></div>
                    {isActive&&activeTrip.driver&&<p className="text-xs text-green-700 mt-0.5 flex items-center gap-1"><User size={10}/>{activeTrip.driver.name} · <Bus size={10}/>{activeTrip.vehicle?.plate}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive ? (
                      <button onClick={()=>handleEndTrip(activeTrip.trip.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors font-medium"><Square size={13}/> Encerrar</button>
                    ) : (
                      <button onClick={()=>openTripModal(r)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors font-medium"><Play size={13}/> Iniciar</button>
                    )}
                    <button onClick={e=>{e.stopPropagation();if(confirm('Excluir rota?'))removeRoute({id:r.route.id},{onSuccess:refetch});}} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button>
                  </div>
                </div>
                {viewRoute?.route.id===r.route.id&&(
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <LeafletMap stops={r.stops||[]} onAddStop={()=>{}} readonly={true}/>
                    <div className="mt-3"><h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-sm"><Navigation size={14}/> Paradas ({r.stops?.length||0})</h4>{(r.stops||[]).map((s:any,i:number)=>(<div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg mb-1"><div className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</div><p className="text-sm">{s.name}</p>{s.lat&&<p className="text-xs text-gray-400 ml-auto">{s.lat}, {s.lng}</p>}</div>))}</div>
                  </div>
                )}
              </div>
            );
          })}
          {!allRoutes.length&&<div className="card text-center py-16"><MapPin size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhuma rota cadastrada</p><button className="btn-primary" onClick={openNew}>Criar primeira rota</button></div>}
        </div>
      ) : (
        <div className="card p-4"><p className="text-sm text-gray-500 mb-3 flex items-center gap-2"><Info size={14}/> Busque um endereço ou selecione uma rota</p><div className="flex gap-2 mb-4 flex-wrap">{allRoutes.map((r:any)=>(<button key={r.route.id} onClick={()=>setViewRoute(r)} className={'px-3 py-1.5 rounded-lg text-sm transition-all '+(viewRoute?.route.id===r.route.id?'bg-primary-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{r.route.name}</button>))}</div><LeafletMap stops={viewRoute?.stops||[]} onAddStop={()=>{}} readonly={true}/></div>
      )}

      {/* Modal Iniciar Viagem */}
      {tripModal&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><div><h3 className="text-lg font-semibold flex items-center gap-2"><Play size={18} className="text-green-500"/> Iniciar Viagem</h3><p className="text-sm text-gray-500 mt-0.5">{tripModal.route.name}</p></div><button onClick={()=>setTripModal(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-center gap-3"><Clock size={16} className="text-primary-500"/><span>{sl(tripModal.route.shift)} · {tripModal.route.scheduledStartTime} – {tripModal.route.scheduledEndTime} · {tripModal.stops?.length||0} paradas</span></div>
          <div><label className="label flex items-center gap-1"><User size={13}/> Motorista *</label><select className="input" value={tripForm.driverId} onChange={e=>setTripForm(f=>({...f,driverId:e.target.value}))}><option value="">— Selecione o motorista —</option>{allDrivers.map((d:any)=><option key={d.id} value={d.id}>{d.name}{d.cnhCategory?' (CNH '+d.cnhCategory+')':''}</option>)}</select></div>
          <div><label className="label flex items-center gap-1"><Bus size={13}/> Veículo *</label><select className="input" value={tripForm.vehicleId} onChange={e=>setTripForm(f=>({...f,vehicleId:e.target.value}))}><option value="">— Selecione o veículo —</option>{allVehicles.map((v:any)=><option key={v.id} value={v.id}>{v.plate}{v.nickname?' — '+v.nickname:''}{v.brand?' ('+v.brand+(v.model?' '+v.model:'')+(v.year?' '+v.year:'')+')':''}</option>)}</select></div>
          <div className="p-3 bg-green-50 rounded-xl text-xs text-green-700 flex items-center gap-2"><CheckCircle size={14}/> A viagem será visível no monitoramento em tempo real após iniciada.</div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={()=>setTripModal(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleStartTrip} disabled={starting} className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2.5 rounded-xl transition-colors">{starting?'Iniciando...':<><Play size={15}/> Iniciar Viagem</>}</button></div>
      </div></div>)}

      {/* Modal Nova Rota */}
      {show&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">Nova Rota</h3><button onClick={()=>setShow(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome da rota *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Ex: Rota Centro – Escola Municipal"/></div>
            <div><label className="label">Codigo (automatico)</label><input className="input bg-gray-50 text-gray-600" value={form.code} readOnly/></div>
            <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={setField('type')}>{TYPES.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
            <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={setField('shift')}>{SHIFTS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
            <div><label className="label">Horário início</label><input className="input" type="time" value={form.scheduledStartTime} onChange={setField('scheduledStartTime')}/></div>
            <div><label className="label">Horário fim</label><input className="input" type="time" value={form.scheduledEndTime} onChange={setField('scheduledEndTime')}/></div>
            <div className="col-span-2"><label className="label">Descrição</label><textarea className="input" rows={2} value={form.description} onChange={setField('description')}/></div>
          </div>
          <div><h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm"><Navigation size={15}/> Paradas</h4><LeafletMap stops={stops} onAddStop={addStop}/>
            <div className="mt-2 space-y-1">{stops.map((s,i)=>(<div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"><div className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">{i+1}</div><p className="text-sm flex-1">{s.name}</p>{s.lat&&<p className="text-xs text-gray-400">{s.lat},{s.lng}</p>}<button onClick={()=>removeStop(i)} className="text-gray-400 hover:text-red-500"><X size={14}/></button></div>))}</div>
            <div className="flex gap-2 mt-2"><input className="input flex-1" placeholder="Nome da parada" value={newStop.name} onChange={e=>setNewStop(s=>({...s,name:e.target.value}))}/><input className="input w-24" placeholder="Lat" value={newStop.lat} onChange={e=>setNewStop(s=>({...s,lat:e.target.value}))}/><input className="input w-24" placeholder="Lng" value={newStop.lng} onChange={e=>setNewStop(s=>({...s,lng:e.target.value}))}/><button onClick={()=>addStop()} className="btn-secondary px-3">+</button></div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={()=>setShow(false)} className="btn-secondary flex-1">Cancelar</button><button disabled={loading} onClick={()=>create({municipalityId,...form,stops},{onSuccess:()=>{refetch();setShow(false);}})} className="btn-primary flex-1">{loading?'Salvando...':'Salvar Rota'}</button></div>
      </div></div>)}
    </div>
  );
            }
