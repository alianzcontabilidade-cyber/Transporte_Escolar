import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { MapPin, Plus, X, Clock, Trash2, Navigation, Info, List, Map as MapIcon } from 'lucide-react';

const SHIFTS = [{ v: 'morning', l: 'Manhã' }, { v: 'afternoon', l: 'Tarde' }, { v: 'evening', l: 'Noite' }];
const TYPES = [{ v: 'pickup', l: 'Ida' }, { v: 'dropoff', l: 'Volta' }, { v: 'both', l: 'Ida e Volta' }];

function LeafletMap({ stops, onAddStop }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      const L = (window as any).L;
      const map = L.map(mapRef.current).setView([-15.78, -47.93], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
      map.on('click', (e: any) => { const name = prompt('Nome da parada:'); if (name) onAddStop({ name, lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) }); });
      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    const coords: [number, number][] = [];
    stops?.forEach((stop: any, i: number) => {
      if (!stop.lat || !stop.lng) return;
      const lat = parseFloat(stop.lat), lng = parseFloat(stop.lng);
      const icon = L.divIcon({ html: `<div style="background:#f97316;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${i+1}</div>`, className:'', iconSize:[28,28], iconAnchor:[14,14] });
      const marker = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current).bindPopup(`<b>${i+1}. ${stop.name}</b>`);
      markersRef.current.push(marker); coords.push([lat, lng]);
    });
    if (coords.length > 1) { const poly = L.polyline(coords, { color:'#f97316', weight:3, dashArray:'6 4' }).addTo(mapInstanceRef.current); markersRef.current.push(poly); mapInstanceRef.current.fitBounds(poly.getBounds(), { padding:[30,30] }); }
    else if (coords.length === 1) { mapInstanceRef.current.setView(coords[0], 15); }
  }, [stops]);
  return (
    <div className="relative w-full h-72 rounded-xl overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/> Clique no mapa para adicionar paradas</div>
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
  const { data: routes, refetch } = useQuery(() => api.routes.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.routes.create);
  const { mutate: remove } = useMutation(api.routes.delete);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const tl = (t: string) => TYPES.find(x => x.v===t)?.l||t;
  const sl = (s: string) => SHIFTS.find(x => x.v===s)?.l||s;
  const addStop = (stop = newStop) => { if (!stop.name) return; setStops(s => [...s, stop]); setNewStop({ name:'', lat:'', lng:'' }); };
  const removeStop = (i: number) => setStops(s => s.filter((_,idx) => idx!==i));
  const openNew = () => { setForm({ name:'',code:'',description:'',type:'both',shift:'morning',scheduledStartTime:'06:30',scheduledEndTime:'07:30' }); setStops([]); setShow(true); };
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Rotas</h1><p className="text-gray-500">{(routes as any)?.length ?? 0} rota(s)</p></div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode==='list'?'bg-white shadow text-primary-600':'text-gray-400'}`}><List size={16}/></button>
            <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-md transition-all ${viewMode==='map'?'bg-white shadow text-primary-600':'text-gray-400'}`}><MapIcon size={16}/></button>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={openNew}><Plus size={16}/> Nova Rota</button>
        </div>
      </div>
      {viewMode==='list' ? (
        <div className="grid gap-3">
          {(routes as any)?.map((r: any) => (
            <div key={r.route.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors cursor-pointer" onClick={() => setViewRoute(r)}>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0"><MapPin size={20} className="text-primary-600"/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{r.route.name}</p>{r.route.code && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{r.route.code}</span>}</div>
                <div className="flex gap-3 mt-0.5"><span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> {r.route.scheduledStartTime} – {r.route.scheduledEndTime}</span><span className="text-xs text-gray-500">{sl(r.route.shift)}</span><span className="text-xs text-gray-500">{tl(r.route.type)}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Navigation size={10}/> {r.stops?.length||0} paradas</span>
                <button onClick={e => { e.stopPropagation(); if(confirm('Excluir rota?')) remove({ id:r.route.id },{ onSuccess:refetch }); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
          {!(routes as any)?.length && <div className="card text-center py-16"><MapPin size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhuma rota cadastrada</p><button className="btn-primary" onClick={openNew}>Criar primeira rota</button></div>}
        </div>
      ) : (
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2"><Info size={14}/> Selecione uma rota para visualizar no mapa</p>
          <div className="flex gap-2 mb-4 flex-wrap">{(routes as any)?.map((r: any) => (<button key={r.route.id} onClick={() => setViewRoute(r)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${viewRoute?.route.id===r.route.id?'bg-primary-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r.route.name}</button>))}</div>
          <LeafletMap stops={viewRoute?.stops||[]} onAddStop={() => {}} />
        </div>
      )}
      {viewRoute && viewMode==='list' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><div><h3 className="text-lg font-semibold">{viewRoute.route.name}</h3><p className="text-sm text-gray-500">{tl(viewRoute.route.type)} · {sl(viewRoute.route.shift)}</p></div><button onClick={() => setViewRoute(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="overflow-y-auto flex-1 p-5"><LeafletMap stops={viewRoute.stops||[]} onAddStop={() => {}} /><div className="mt-4"><h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><Navigation size={16}/> Paradas ({viewRoute.stops?.length||0})</h4>{viewRoute.stops?.length?viewRoute.stops.map((s: any, i: number) => (<div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-1"><div className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</div><p className="text-sm font-medium text-gray-700">{s.name}</p>{s.lat && <p className="text-xs text-gray-400 ml-auto">{s.lat}, {s.lng}</p>}</div>)):<p className="text-sm text-gray-400">Nenhuma parada</p>}</div></div>
          </div>
        </div>
      )}
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">Nova Rota</h3><button onClick={() => setShow(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Nome da rota *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Ex: Rota Centro – Escola Municipal" /></div>
                <div><label className="label">Código</label><input className="input" value={form.code} onChange={set('code')} placeholder="R01" /></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={set('type')}>{TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
                <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={set('shift')}>{SHIFTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
                <div><label className="label">Horário início</label><input className="input" type="time" value={form.scheduledStartTime} onChange={set('scheduledStartTime')} /></div>
                <div><label className="label">Horário fim</label><input className="input" type="time" value={form.scheduledEndTime} onChange={set('scheduledEndTime')} /></div>
                <div className="col-span-2"><label className="label">Descrição</label><textarea className="input" rows={2} value={form.description} onChange={set('description')} /></div>
              </div>
              <div><h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><Navigation size={16}/> Paradas da rota</h4>
                <LeafletMap stops={stops} onAddStop={addStop} />
                <div className="mt-3 space-y-2">{stops.map((s,i) => (<div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"><div className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i+1}</div><p className="text-sm flex-1">{s.name}</p>{s.lat && <p className="text-xs text-gray-400">{s.lat}, {s.lng}</p>}<button onClick={() => removeStop(i)} className="p-1 text-gray-400 hover:text-red-500"><X size={14}/></button></div>))}</div>
                <div className="flex gap-2 mt-2"><input className="input flex-1" placeholder="Nome da parada" value={newStop.name} onChange={e => setNewStop(s => ({...s,name:e.target.value}))} /><input className="input w-24" placeholder="Lat" value={newStop.lat} onChange={e => setNewStop(s => ({...s,lat:e.target.value}))} /><input className="input w-24" placeholder="Lng" value={newStop.lng} onChange={e => setNewStop(s => ({...s,lng:e.target.value}))} /><button onClick={() => addStop()} className="btn-secondary px-3">+</button></div>
                <p className="text-xs text-gray-400 mt-1">Ou clique no mapa para adicionar paradas</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={() => setShow(false)} className="btn-secondary flex-1">Cancelar</button><button disabled={loading} onClick={() => create({ municipalityId, ...form, stops },{ onSuccess:() => { refetch(); setShow(false); } })} className="btn-primary flex-1">{loading?'Salvando...':'Salvar Rota'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
    }
