import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { MapPin, Plus, X, Clock, Trash2, Navigation, Info, LayoutList, Search, Play, Square, Bus, User, ChevronDown, ChevronRight, CheckCircle, Pencil, Eye, DollarSign, AlertTriangle, Mountain } from 'lucide-react';
import QuickAddModal from '../components/QuickAddModal';

const SHIFTS = [{ v:'morning', l:'Manhã' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' },{ v:'full_time', l:'Integral' }];
const TYPES = [{ v:'pickup', l:'Ida' },{ v:'dropoff', l:'Volta' },{ v:'both', l:'Ida e Volta' }];

function LeafletMap({ stops, onAddStop, readonly, students }: { stops: any[]; onAddStop: (s: any) => void; readonly?: boolean; students?: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [srch, setSrch] = useState('');
  const [busy, setBusy] = useState(false);
  const [sugg, setSugg] = useState<any[]>([]);
  useEffect(() => {
    if (!mapRef.current||mapInst.current) return;
    const sc = document.createElement('script'); sc.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    sc.onload = () => { const lk=document.createElement('link');lk.rel='stylesheet';lk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(lk); const L=(window as any).L; const map=L.map(mapRef.current!).setView([-15.78,-47.93],13); const st=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{attribution:'&copy; CARTO &copy; OSM',maxZoom:20}); const sa=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'&copy; Esri',maxZoom:19}); const dk=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; CARTO &copy; OSM',maxZoom:20}); const te=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{attribution:'&copy; Esri',maxZoom:19}); const hl=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{attribution:'&copy; Esri',maxZoom:19}); const hy=L.layerGroup([L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'&copy; Esri',maxZoom:19}),hl]); st.addTo(map); L.control.layers({'Ruas':st,'Satélite':sa,'Híbrido':hy,'Escuro':dk,'Terreno':te},{},{position:'topright',collapsed:true}).addTo(map); if(!readonly)map.on('click',(e:any)=>{const n=prompt('Nome da parada:');if(n)onAddStop({name:n,lat:String(e.latlng.lat.toFixed(6)),lng:String(e.latlng.lng.toFixed(6))});}); mapInst.current=map; };
    document.head.appendChild(sc);
    return () => { if(mapInst.current){mapInst.current.remove();mapInst.current=null;} };
  }, [readonly]);
  useEffect(() => {
    const L=(window as any).L; if(!mapInst.current||!L) return;
    markers.current.forEach(m=>{try{m.remove();}catch(_){}});markers.current=[];
    const pts: number[][]=[];
    // Paradas (marcadores numerados âmbar)
    (stops||[]).forEach((st:any,i:number)=>{ if(!st.lat||!st.lng)return; const la=parseFloat(st.lat),ln=parseFloat(st.lng); if(isNaN(la)||isNaN(ln))return; const icon=L.divIcon({html:`<div style="background:#D97706;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.25)">${i+1}</div>`,className:'',iconSize:[26,26],iconAnchor:[13,13]}); markers.current.push(L.marker([la,ln],{icon}).addTo(mapInst.current).bindPopup(`<b>${i+1}. ${st.name}</b>`)); pts.push([la,ln]); });
    // Alunos (marcadores verdes com nome)
    (students||[]).forEach((s:any)=>{ const la=parseFloat(String(s.latitude||0)),ln=parseFloat(String(s.longitude||0)); if(!la||!ln||isNaN(la))return; const icon=L.divIcon({html:`<div style="background:#059669;color:#fff;padding:1px 5px;border-radius:10px;font-size:9px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);white-space:nowrap">${(s.name||'').split(' ')[0]}</div>`,className:'',iconAnchor:[15,8]}); markers.current.push(L.marker([la,ln],{icon}).addTo(mapInst.current).bindPopup(`<b>${s.name}</b><br><span style="font-size:11px">${s.address||''} ${s.grade||''}</span>`)); pts.push([la,ln]); });
    if(pts.length>1){const pl=L.polyline(pts.slice(0,(stops||[]).filter((s:any)=>s.lat&&s.lng).length),{color:'#D97706',weight:3,dashArray:'6 4'}).addTo(mapInst.current);markers.current.push(pl);mapInst.current.fitBounds(L.latLngBounds(pts),{padding:[30,30]});}
    else if(pts.length===1)mapInst.current.setView(pts[0] as any,15);
  }, [stops, students]);
  const doSearch = (q:string) => { setSrch(q); if(q.length<3){setSugg([]);return;} setBusy(true); fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q)+'&countrycodes=br&limit=6',{headers:{'Accept-Language':'pt-BR','User-Agent':'NetEscol/1.0'}}).then(r=>r.json()).then(d=>{setSugg(d);setBusy(false);}).catch(()=>{setSugg([]);setBusy(false);}); };
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
  const [form, setForm] = useState({ name:'', code:'', description:'', type:'both', shift:'morning', scheduledStartTime:'06:30', scheduledEndTime:'07:30', hasGate:false, hasCattleGuard:false, hasLatch:false, hasMudhole:false, hasRusticBridge:false, roadSurface:'paved', monthlyCostFuel:'', monthlyCostMaintenance:'', monthlyCostDriver:'', monthlyCostMonitor:'', monthlyCostInsurance:'' });
  const [stops, setStops] = useState<{name:string;lat:string;lng:string}[]>([]);
  const [newStop, setNewStop] = useState({ name:'', lat:'', lng:'' });
  const [tripModal, setTripModal] = useState<any>(null);
  const [tripForm, setTripForm] = useState({ driverId:'', vehicleId:'' });
  const [quickAdd, setQuickAdd] = useState<string | null>(null);
  const { data: routes, refetch } = useQuery(function(){return api.routes.list({municipalityId});}, [municipalityId]);
  const { data: activeTrips, refetch: refetchTrips } = useQuery(function(){return api.trips.listActive({municipalityId});}, [municipalityId]);
  const { data: drivers, refetch: refetchDrivers } = useQuery(function(){return api.drivers.list({municipalityId});}, [municipalityId]);
  const { data: vehicles, refetch: refetchVehicles } = useQuery(function(){return api.vehicles.list({municipalityId});}, [municipalityId]);
  const [editId, setEditId] = useState<number|null>(null);
  const { mutate: create, loading } = useMutation(api.routes.create);
  const { mutate: updateRoute, loading: updating } = useMutation(api.routes.update);
  const { mutate: removeRoute } = useMutation(api.routes.delete);
  const { mutate: startTrip, loading: starting } = useMutation(api.trips.start);
  const { mutate: endTrip } = useMutation(api.trips.complete);
  const [search,setSearch]=useState('');
  const [routeStudents, setRouteStudents] = useState<any[]>([]);

  // Carregar alunos quando uma rota é selecionada
  useEffect(() => {
    if (!viewRoute) { setRouteStudents([]); return; }
    const routeId = viewRoute.route?.id || viewRoute.id;
    if (!routeId) return;
    api.ai.routeStudents({ routeId }).then((r: any) => setRouteStudents(r?.students || [])).catch(() => setRouteStudents([]));
  }, [viewRoute]);
  const [page,setPage]=useState(1);
  const PER_PAGE=20;

  const allRoutes = (routes as any)||[];
  const allTrips = (activeTrips as any)||[];
  const rawDrivers = (drivers as any)||[];
  const allDrivers = rawDrivers.map(function(d:any){ if(d.driver&&d.user) return { id:d.driver.id, name:d.user.name, cnhCategory:d.driver.cnhCategory, vehicleId:d.driver.vehicleId, routeId:d.linkedRoute?.id||null }; return d; });
  const allVehicles = (vehicles as any)||[];

  const filtered=allRoutes.filter(function(r:any){const route=r.route||r;const q=search.toLowerCase();return route.name?.toLowerCase().includes(q)||(route.code||'').toLowerCase().includes(q);});
  const totalPages=Math.ceil(filtered.length/PER_PAGE);
  const paginated=filtered.slice((page-1)*PER_PAGE,page*PER_PAGE);

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
  const openNew = () => { setForm({name:'',code:generateCode(),description:'',type:'both',shift:'morning',scheduledStartTime:'06:30',scheduledEndTime:'07:30',hasGate:false,hasCattleGuard:false,hasLatch:false,hasMudhole:false,hasRusticBridge:false,roadSurface:'paved',monthlyCostFuel:'',monthlyCostMaintenance:'',monthlyCostDriver:'',monthlyCostMonitor:'',monthlyCostInsurance:''}); setStops([]); setEditId(null); setShow(true); };
  const openEdit = (r:any) => {
    const route = r.route || r;
    setForm({ name:route.name||'', code:route.code||'', description:route.description||'', type:route.type||'both', shift:route.shift||'morning', scheduledStartTime:route.scheduledStartTime||'06:30', scheduledEndTime:route.scheduledEndTime||'07:30', hasGate:!!route.hasGate, hasCattleGuard:!!route.hasCattleGuard, hasLatch:!!route.hasLatch, hasMudhole:!!route.hasMudhole, hasRusticBridge:!!route.hasRusticBridge, roadSurface:route.roadSurface||'paved', monthlyCostFuel:route.monthlyCostFuel||'', monthlyCostMaintenance:route.monthlyCostMaintenance||'', monthlyCostDriver:route.monthlyCostDriver||'', monthlyCostMonitor:route.monthlyCostMonitor||'', monthlyCostInsurance:route.monthlyCostInsurance||'' });
    setStops((r.stops||[]).map((s:any)=>({name:s.name,lat:s.latitude||'',lng:s.longitude||''})));
    setEditId(route.id);
    setShow(true);
  };

  const getActiveTrip = (routeId:number) => allTrips.find((t:any)=>t.trip?.routeId===routeId&&t.trip?.status==='started');

  const openTripModal = (rt:any) => {
    const rtId = rt.route?.id || rt.id;
    const activeDriver = allDrivers.find((d:any)=>String(d.routeId)===String(rtId));
    const activeVehicle = allVehicles.find((v:any)=>String(v.id)===String(activeDriver?.vehicleId));
    setTripForm({ driverId: activeDriver ? String(activeDriver.id) : '', vehicleId: activeVehicle ? String(activeVehicle.id) : '' });
    setTripModal(rt);
  };

  const handleStartTrip = () => {
    if(!tripForm.driverId||!tripForm.vehicleId){ showInfoToast('Selecione motorista e veiculo'); return; }
    const rId = tripModal.route?.id || tripModal.id;
    startTrip({ routeId: rId, driverId: parseInt(tripForm.driverId), vehicleId: parseInt(tripForm.vehicleId), municipalityId }, { onSuccess: function(){ refetchTrips(); setTripModal(null); } });
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

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar rota por nome ou código..." value={search} onChange={function(e:any){setSearch(e.target.value);setPage(1);}}/></div>

      {viewMode==='list' ? (<>
        <div className="grid gap-3">
          {paginated.map(function(r:any){
            const route = r.route || r;
            const routeId = route.id;
            if (!routeId) return null;
            const routeStops = r.stops || [];
            const activeTrip = getActiveTrip(routeId);
            const isActive = !!activeTrip;
            return (
              <div key={routeId} className={'card transition-all '+(isActive?'border-green-300 bg-green-50/30':'hover:border-primary-200')}>
                <div className="flex items-center gap-4">
                  <div className={'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 '+(isActive?'bg-green-100':'bg-primary-100')}>
                    <MapPin size={20} className={isActive?'text-green-600':'text-primary-600'}/>
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setViewRoute(viewRoute?.route?.id===routeId||viewRoute?.id===routeId?null:r)}>
                    <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{route.name}</p>{route.code&&<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{route.code}</span>}{isActive&&<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"/>Em andamento</span>}</div>
                    <div className="flex gap-3 mt-0.5"><span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/>{route.scheduledStartTime} - {route.scheduledEndTime}</span><span className="text-xs text-gray-500">{sl(route.shift)}</span><span className="text-xs text-gray-500">{tl(route.type)}</span><span className="text-xs text-gray-500 flex items-center gap-1"><Navigation size={10}/>{routeStops.length} paradas</span></div>
                    {isActive&&activeTrip?.driverName&&<p className="text-xs text-green-700 mt-0.5 flex items-center gap-1"><User size={10}/>{activeTrip.driverName} · <Bus size={10}/>{activeTrip.vehicle?.plate}</p>}
                    {(route.hasGate||route.hasCattleGuard||route.hasLatch||route.hasMudhole||route.hasRusticBridge||route.roadSurface==='unpaved'||route.roadSurface==='mixed')&&(
                      <div className="flex gap-1 mt-1 flex-wrap">{route.hasGate&&<span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Porteira</span>}{route.hasCattleGuard&&<span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Mata-burro</span>}{route.hasLatch&&<span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Colchete</span>}{route.hasMudhole&&<span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Atoleiro</span>}{route.hasRusticBridge&&<span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Ponte Rustica</span>}{route.roadSurface==='unpaved'&&<span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Nao pavimentada</span>}{route.roadSurface==='mixed'&&<span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Mista</span>}</div>
                    )}
                    {(parseFloat(route.monthlyCostFuel||'0')+parseFloat(route.monthlyCostMaintenance||'0')+parseFloat(route.monthlyCostDriver||'0')+parseFloat(route.monthlyCostMonitor||'0')+parseFloat(route.monthlyCostInsurance||'0'))>0&&(
                      <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1"><DollarSign size={10}/>Custo mensal: R$ {(parseFloat(route.monthlyCostFuel||'0')+parseFloat(route.monthlyCostMaintenance||'0')+parseFloat(route.monthlyCostDriver||'0')+parseFloat(route.monthlyCostMonitor||'0')+parseFloat(route.monthlyCostInsurance||'0')).toFixed(2)}{routeStops.length>0&&' · Por aluno: R$ '+((parseFloat(route.monthlyCostFuel||'0')+parseFloat(route.monthlyCostMaintenance||'0')+parseFloat(route.monthlyCostDriver||'0')+parseFloat(route.monthlyCostMonitor||'0')+parseFloat(route.monthlyCostInsurance||'0'))/Math.max(routeStops.length,1)).toFixed(2)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isActive ? (
                      <button onClick={()=>handleEndTrip(activeTrip.trip.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors font-medium"><Square size={13}/> Encerrar</button>
                    ) : (
                      <button onClick={()=>openTripModal(r)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors font-medium"><Play size={13}/> Iniciar</button>
                    )}
                    <button onClick={e=>{e.stopPropagation();setViewRoute(viewRoute?.route?.id===routeId||viewRoute?.id===routeId?null:r);}} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Visualizar"><Eye size={15}/></button>
                    <button onClick={e=>{e.stopPropagation();openEdit(r);}} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={15}/></button>
                    <button onClick={e=>{e.stopPropagation();if(confirm('Excluir rota '+route.name+'?'))removeRoute({id:routeId},{onSuccess:refetch});}} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={15}/></button>
                  </div>
                </div>
                {(viewRoute?.route?.id===routeId||viewRoute?.id===routeId)&&(
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <LeafletMap stops={routeStops} onAddStop={()=>{}} readonly={true} students={routeStudents}/>
                    <div className="mt-3"><h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-sm"><Navigation size={14}/> Paradas ({routeStops.length})</h4>{routeStops.map((s:any,i:number)=>(<div key={i} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg mb-1"><div className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</div><p className="text-sm">{s.name}</p>{s.latitude&&<p className="text-xs text-gray-400 ml-auto">{s.latitude}, {s.longitude}</p>}</div>))}</div>
                  </div>
                )}
              </div>
            );
          })}
          {!filtered.length&&<div className="card text-center py-16"><MapPin size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhuma rota cadastrada</p><button className="btn-primary" onClick={openNew}>Criar primeira rota</button></div>}
        </div>
        {totalPages>1&&(<div className="flex items-center justify-between mt-4"><p className="text-sm text-gray-500">Mostrando {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE,filtered.length)} de {filtered.length}</p><div className="flex gap-1"><button onClick={function(){setPage(1);}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<<'}</button><button onClick={function(){setPage(function(p){return Math.max(1,p-1);});}} disabled={page===1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<'}</button><span className="px-3 py-1.5 text-sm font-medium">{page}/{totalPages}</span><button onClick={function(){setPage(function(p){return Math.min(totalPages,p+1);});}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>'}</button><button onClick={function(){setPage(totalPages);}} disabled={page===totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>>'}</button></div></div>)}
      </>) : (
        <div className="card p-4"><p className="text-sm text-gray-500 mb-3 flex items-center gap-2"><Info size={14}/> Busque um endereco ou selecione uma rota</p><div className="flex gap-2 mb-4 flex-wrap">{allRoutes.map((r:any)=>{const rt=r.route||r;return(<button key={rt.id} onClick={()=>setViewRoute(r)} className={'px-3 py-1.5 rounded-lg text-sm transition-all '+((viewRoute?.route?.id||viewRoute?.id)===rt.id?'bg-primary-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{rt.name}</button>);})}</div><LeafletMap stops={viewRoute?.stops||[]} onAddStop={()=>{}} readonly={true} students={routeStudents}/></div>
      )}

      {/* Modal Iniciar Viagem */}
      {tripModal&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">{(function(){const tRoute=tripModal.route||tripModal;return(<>
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><div><h3 className="text-lg font-semibold flex items-center gap-2"><Play size={18} className="text-green-500"/> Iniciar Viagem</h3><p className="text-sm text-gray-500 mt-0.5">{tRoute.name}</p></div><button onClick={()=>setTripModal(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 flex items-center gap-3"><Clock size={16} className="text-primary-500"/><span>{sl(tRoute.shift)} - {tRoute.scheduledStartTime} - {tRoute.scheduledEndTime} - {tripModal.stops?.length||0} paradas</span></div>
          <div><label className="label flex items-center gap-1"><User size={13}/> Motorista *</label><div className="flex gap-1"><select className="input" value={tripForm.driverId} onChange={e=>setTripForm(f=>({...f,driverId:e.target.value}))}><option value="">— Selecione o motorista —</option>{allDrivers.map((d:any)=><option key={d.id} value={d.id}>{d.name}{d.cnhCategory?' (CNH '+d.cnhCategory+')':''}</option>)}</select><button type="button" onClick={()=>setQuickAdd('driver')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar motorista"><Plus size={16}/></button></div></div>
          <div><label className="label flex items-center gap-1"><Bus size={13}/> Veículo *</label><div className="flex gap-1"><select className="input" value={tripForm.vehicleId} onChange={e=>setTripForm(f=>({...f,vehicleId:e.target.value}))}><option value="">— Selecione o veículo —</option>{allVehicles.map((v:any)=><option key={v.id} value={v.id}>{v.plate}{v.nickname?' — '+v.nickname:''}{v.brand?' ('+v.brand+(v.model?' '+v.model:'')+(v.year?' '+v.year:'')+')':''}</option>)}</select><button type="button" onClick={()=>setQuickAdd('vehicle')} className="px-2 py-1 bg-accent-500 text-white rounded-lg hover:bg-accent-600 text-sm" title="Cadastrar veículo"><Plus size={16}/></button></div></div>
          <div className="p-3 bg-green-50 rounded-xl text-xs text-green-700 flex items-center gap-2"><CheckCircle size={14}/> A viagem será visível no monitoramento em tempo real após iniciada.</div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={()=>setTripModal(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleStartTrip} disabled={starting} className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2.5 rounded-xl transition-colors">{starting?'Iniciando...':<><Play size={15}/> Iniciar Viagem</>}</button></div>
      </>);})()}</div></div>)}

      {/* Modal Nova Rota */}
      {show&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId ? 'Editar Rota' : 'Nova Rota'}</h3><button onClick={()=>setShow(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
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

          {/* Condições da Estrada (SETE) */}
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/30">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm"><Mountain size={15} className="text-amber-600"/> Condições da Estrada</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo de pavimento</label><select className="input" value={form.roadSurface} onChange={setField('roadSurface')}><option value="paved">Pavimentada</option><option value="unpaved">Não pavimentada</option><option value="mixed">Mista</option></select></div>
              <div className="flex flex-col gap-2 mt-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasGate} onChange={e=>setForm(f=>({...f,hasGate:e.target.checked}))} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/> Porteira</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasCattleGuard} onChange={e=>setForm(f=>({...f,hasCattleGuard:e.target.checked}))} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/> Mata-burro</label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasLatch} onChange={e=>setForm(f=>({...f,hasLatch:e.target.checked}))} className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/> Colchete</label>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasMudhole} onChange={e=>setForm(f=>({...f,hasMudhole:e.target.checked}))} className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"/> Atoleiro</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasRusticBridge} onChange={e=>setForm(f=>({...f,hasRusticBridge:e.target.checked}))} className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"/> Ponte Rústica</label>
            </div>
          </div>

          {/* Custos Mensais */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm"><DollarSign size={15} className="text-emerald-600"/> Custos Mensais</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Combustível (R$)</label><input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.monthlyCostFuel} onChange={setField('monthlyCostFuel')}/></div>
              <div><label className="label">Manutenção (R$)</label><input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.monthlyCostMaintenance} onChange={setField('monthlyCostMaintenance')}/></div>
              <div><label className="label">Motorista (R$)</label><input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.monthlyCostDriver} onChange={setField('monthlyCostDriver')}/></div>
              <div><label className="label">Monitor (R$)</label><input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.monthlyCostMonitor} onChange={setField('monthlyCostMonitor')}/></div>
              <div><label className="label">Seguro (R$)</label><input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.monthlyCostInsurance} onChange={setField('monthlyCostInsurance')}/></div>
              <div className="bg-emerald-100 rounded-lg p-3 flex flex-col justify-center">
                <p className="text-xs text-emerald-700 font-medium">Custo Total Mensal</p>
                <p className="text-lg font-bold text-emerald-800">R$ {(parseFloat(form.monthlyCostFuel||'0')+parseFloat(form.monthlyCostMaintenance||'0')+parseFloat(form.monthlyCostDriver||'0')+parseFloat(form.monthlyCostMonitor||'0')+parseFloat(form.monthlyCostInsurance||'0')).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div><h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm"><Navigation size={15}/> Paradas</h4><LeafletMap stops={stops} onAddStop={addStop}/>
            <div className="mt-2 space-y-1">{stops.map((s,i)=>(<div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"><div className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">{i+1}</div><p className="text-sm flex-1">{s.name}</p>{s.lat&&<p className="text-xs text-gray-400">{s.lat},{s.lng}</p>}<button onClick={()=>removeStop(i)} className="text-gray-400 hover:text-red-500"><X size={14}/></button></div>))}</div>
            <div className="flex gap-2 mt-2"><input className="input flex-1" placeholder="Nome da parada" value={newStop.name} onChange={e=>setNewStop(s=>({...s,name:e.target.value}))}/><input className="input w-24" placeholder="Lat" value={newStop.lat} onChange={e=>setNewStop(s=>({...s,lat:e.target.value}))}/><input className="input w-24" placeholder="Lng" value={newStop.lng} onChange={e=>setNewStop(s=>({...s,lng:e.target.value}))}/><button onClick={()=>addStop()} className="btn-secondary px-3">+</button></div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={()=>setShow(false)} className="btn-secondary flex-1">Cancelar</button><button disabled={loading||updating} onClick={()=>{
          if(editId) {
            updateRoute({id:editId, name:form.name, code:form.code, description:form.description, type:form.type, shift:form.shift, scheduledStartTime:form.scheduledStartTime, scheduledEndTime:form.scheduledEndTime, hasGate:form.hasGate, hasCattleGuard:form.hasCattleGuard, hasLatch:form.hasLatch, hasMudhole:form.hasMudhole, hasRusticBridge:form.hasRusticBridge, roadSurface:form.roadSurface, monthlyCostFuel:form.monthlyCostFuel||'0', monthlyCostMaintenance:form.monthlyCostMaintenance||'0', monthlyCostDriver:form.monthlyCostDriver||'0', monthlyCostMonitor:form.monthlyCostMonitor||'0', monthlyCostInsurance:form.monthlyCostInsurance||'0'},{onSuccess:()=>{refetch();setShow(false);}});
          } else {
            create({municipalityId,...form,stops,monthlyCostFuel:form.monthlyCostFuel||'0',monthlyCostMaintenance:form.monthlyCostMaintenance||'0',monthlyCostDriver:form.monthlyCostDriver||'0',monthlyCostMonitor:form.monthlyCostMonitor||'0',monthlyCostInsurance:form.monthlyCostInsurance||'0'},{onSuccess:()=>{refetch();setShow(false);}});
          }
        }} className="btn-primary flex-1">{loading||updating?'Salvando...':editId?'Salvar Alterações':'Salvar Rota'}</button></div>
      </div></div>)}

      {/* QuickAddModal */}
      {quickAdd&&<QuickAddModal entityType={quickAdd as any} municipalityId={municipalityId} onClose={()=>setQuickAdd(null)} onSuccess={(newEntity:any)=>{if(quickAdd==='driver'){refetchDrivers();setTripForm(f=>({...f,driverId:String(newEntity.id)}));}if(quickAdd==='vehicle'){refetchVehicles();setTripForm(f=>({...f,vehicleId:String(newEntity.id)}));}}}/>}
    </div>
  );
            }
