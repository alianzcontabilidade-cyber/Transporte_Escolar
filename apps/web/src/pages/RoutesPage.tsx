import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { MapPin, Plus, X, Clock, Trash2, Navigation, Info, LayoutList, Search } from 'lucide-react';

const SHIFTS = [{ v:'morning', l:'Manhã' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' }];
const TYPES = [{ v:'pickup', l:'Ida' },{ v:'dropoff', l:'Volta' },{ v:'both', l:'Ida e Volta' }];

function LeafletMap({ stops, onAddStop, readonly }: { stops: any[]; onAddStop: (s: any) => void; readonly?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const markerArr = useRef<any[]>([]);
  const [srch, setSrch] = useState('');
  const [busy, setBusy] = useState(false);
  const [sugg, setSugg] = useState<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const sc = document.createElement('script');
    sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    sc.onload = () => {
      const lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk);
      const L = (window as any).L;
      const map = L.map(mapRef.current!).setView([-15.78, -47.93], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
      if (!readonly) map.on('click', (e: any) => { const n = prompt('Nome da parada:'); if (n) onAddStop({ name: n, lat: String(e.latlng.lat.toFixed(6)), lng: String(e.latlng.lng.toFixed(6)) }); });
      mapInst.current = map;
    };
    document.head.appendChild(sc);
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [readonly]);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapInst.current || !L) return;
    markerArr.current.forEach(m => { try { m.remove(); } catch (_) {} });
    markerArr.current = [];
    const pts: number[][] = [];
    (stops || []).forEach((st: any, i: number) => {
      if (!st.lat || !st.lng) return;
      const la = parseFloat(st.lat); const ln = parseFloat(st.lng);
      if (isNaN(la) || isNaN(ln)) return;
      const icon = L.divIcon({ html: `<div style="background:#f97316;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.25)">${i + 1}</div>`, className: '', iconSize: [26, 26], iconAnchor: [13, 13] });
      markerArr.current.push(L.marker([la, ln], { icon }).addTo(mapInst.current).bindPopup(`<b>${i + 1}. ${st.name}</b>`));
      pts.push([la, ln]);
    });
    if (pts.length > 1) { const pl = L.polyline(pts, { color: '#f97316', weight: 3, dashArray: '6 4' }).addTo(mapInst.current); markerArr.current.push(pl); mapInst.current.fitBounds(pl.getBounds(), { padding: [30, 30] }); }
    else if (pts.length === 1) mapInst.current.setView(pts[0] as any, 15);
  }, [stops]);

  const onSearch = (q: string) => {
    setSrch(q);
    if (q.length < 3) { setSugg([]); return; }
    setBusy(true);
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&countrycodes=br&limit=6', { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'TransEscolar/1.0' } })
      .then(function(res) { return res.json(); })
      .then(function(data) { setSugg(data); setBusy(false); })
      .catch(function() { setSugg([]); setBusy(false); });
  };

  const goTo = (pl: any) => {
    const L = (window as any).L;
    if (!mapInst.current || !L) return;
    const la = parseFloat(pl.lat); const ln = parseFloat(pl.lon);
    mapInst.current.setView([la, ln], 16);
    const icon = L.divIcon({ html: '<div style="background:#3b82f6;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:14px">📍</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
    markerArr.current.push(L.marker([la, ln], { icon }).addTo(mapInst.current).bindPopup('<b>' + pl.display_name.split(',').slice(0, 3).join(', ') + '</b>').openPopup());
    setSrch(pl.display_name.split(',').slice(0, 3).join(', ')); setSugg([]);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input pl-9 text-sm" placeholder="Buscar rua, bairro, cidade, estado..." value={srch} onChange={function(e) { onSearch(e.target.value); }} />
          {busy && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />}
        </div>
        {sugg.length > 0 && (
          <div className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 overflow-hidden" style={{ zIndex: 10000 }}>
            {sugg.map(function(s: any, i: number) { return (
              <button key={i} onClick={function() { goTo(s); }} className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors border-b last:border-0 border-gray-100">
                <p className="text-sm font-medium text-gray-800 truncate">{s.display_name.split(',').slice(0, 3).join(', ')}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{s.display_name.split(',').slice(3, 6).join(', ')}</p>
              </button>
            ); })}
          </div>
        )}
      </div>
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: '280px' }}>
        <div ref={mapRef} className="w-full h-full" />
        {!readonly && <div className="absolute bottom-2 left-2 bg-white/90 rounded-lg px-2 py-1 text-xs text-gray-500 flex items-center gap-1 shadow"><MapPin size={10} /> Clique no mapa para adicionar paradas</div>}
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [viewRoute, setViewRoute] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [form, setForm] = useState({ name: '', code: '', description: '', type: 'both', shift: 'morning', scheduledStartTime: '06:30', scheduledEndTime: '07:30' });
  const [stops, setStops] = useState<Array<{ name: string; lat: string; lng: string }>>([]);
  const [newStop, setNewStop] = useState({ name: '', lat: '', lng: '' });
  const { data: routes, refetch } = useQuery(function() { return api.routes.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading } = useMutation(api.routes.create);
  const { mutate: remove } = useMutation(api.routes.delete);
  const setField = function(k: string) { return function(e: any) { setForm(function(f) { return { ...f, [k]: e.target.value }; }); }; };
  const tl = function(t: string) { return TYPES.find(function(x) { return x.v === t; })?.l || t; };
  const sl = function(s: string) { return SHIFTS.find(function(x) { return x.v === s; })?.l || s; };
  const addStop = function(st?: { name: string; lat: string; lng: string }) {
    const item = st || newStop;
    if (!item.name) return;
    setStops(function(prev) { return [...prev, item]; });
    if (!st) setNewStop({ name: '', lat: '', lng: '' });
  };
  const removeStop = function(i: number) { setStops(function(prev) { return prev.filter(function(_, idx) { return idx !== i; }); }); };
  const openNew = function() { setForm({ name: '', code: '', description: '', type: 'both', shift: 'morning', scheduledStartTime: '06:30', scheduledEndTime: '07:30' }); setStops([]); setShow(true); };

  const allRoutes = (routes as any) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Rotas</h1><p className="text-gray-500">{allRoutes.length} rota(s)</p></div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={function() { setViewMode('list'); }} className={'p-1.5 rounded-md transition-all ' + (viewMode === 'list' ? 'bg-white shadow text-primary-600' : 'text-gray-400')}><LayoutList size={16} /></button>
            <button onClick={function() { setViewMode('map'); }} className={'p-1.5 rounded-md transition-all ' + (viewMode === 'map' ? 'bg-white shadow text-primary-600' : 'text-gray-400')}><MapPin size={16} /></button>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={openNew}><Plus size={16} /> Nova Rota</button>
        </div>
      </div>
      {viewMode === 'list' ? (
        <div className="grid gap-3">
          {allRoutes.map(function(rt: any) { return (
            <div key={rt.route.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors cursor-pointer" onClick={function() { setViewRoute(rt); }}>
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0"><MapPin size={20} className="text-primary-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{rt.route.name}</p>{rt.route.code && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{rt.route.code}</span>}</div>
                <div className="flex gap-3 mt-0.5"><span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} />{rt.route.scheduledStartTime} – {rt.route.scheduledEndTime}</span><span className="text-xs text-gray-500">{sl(rt.route.shift)}</span><span className="text-xs text-gray-500">{tl(rt.route.type)}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Navigation size={10} />{(rt.stops || []).length} paradas</span>
                <button onClick={function(e) { e.stopPropagation(); if (confirm('Excluir rota?')) remove({ id: rt.route.id }, { onSuccess: refetch }); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
              </div>
            </div>
          ); })}
          {!allRoutes.length && <div className="card text-center py-16"><MapPin size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhuma rota cadastrada</p><button className="btn-primary" onClick={openNew}>Criar primeira rota</button></div>}
        </div>
      ) : (
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2"><Info size={14} /> Busque um endereço ou selecione uma rota para visualizar</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {allRoutes.map(function(rt: any) { return (<button key={rt.route.id} onClick={function() { setViewRoute(rt); }} className={'px-3 py-1.5 rounded-lg text-sm transition-all ' + (viewRoute?.route.id === rt.route.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{rt.route.name}</button>); })}
          </div>
          <LeafletMap stops={viewRoute?.stops || []} onAddStop={function() {}} readonly={true} />
        </div>
      )}
      {viewRoute && viewMode === 'list' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><div><h3 className="text-lg font-semibold">{viewRoute.route.name}</h3><p className="text-sm text-gray-500">{tl(viewRoute.route.type)} · {sl(viewRoute.route.shift)}</p></div><button onClick={function() { setViewRoute(null); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
            <div className="overflow-y-auto flex-1 p-5">
              <LeafletMap stops={viewRoute.stops || []} onAddStop={function() {}} readonly={true} />
              <div className="mt-4"><h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2"><Navigation size={16} /> Paradas ({(viewRoute.stops || []).length})</h4>
                {(viewRoute.stops || []).map(function(s: any, i: number) { return (<div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg mb-1"><div className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div><p className="text-sm font-medium flex-1">{s.name}</p>{s.lat && <p className="text-xs text-gray-400">{s.lat}, {s.lng}</p>}</div>); })}
                {!(viewRoute.stops || []).length && <p className="text-sm text-gray-400">Sem paradas</p>}
              </div>
            </div>
          </div>
        </div>
      )}
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">Nova Rota</h3><button onClick={function() { setShow(false); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Nome da rota *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Ex: Rota Centro – Escola Municipal" /></div>
                <div><label className="label">Código</label><input className="input" value={form.code} onChange={setField('code')} placeholder="R01" /></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={setField('type')}>{TYPES.map(function(t) { return <option key={t.v} value={t.v}>{t.l}</option>; })}</select></div>
                <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={setField('shift')}>{SHIFTS.map(function(s) { return <option key={s.v} value={s.v}>{s.l}</option>; })}</select></div>
                <div><label className="label">Horário início</label><input className="input" type="time" value={form.scheduledStartTime} onChange={setField('scheduledStartTime')} /></div>
                <div><label className="label">Horário fim</label><input className="input" type="time" value={form.scheduledEndTime} onChange={setField('scheduledEndTime')} /></div>
                <div className="col-span-2"><label className="label">Descrição</label><textarea className="input" rows={2} value={form.description} onChange={setField('description')} /></div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><Navigation size={16} /> Paradas</h4>
                <LeafletMap stops={stops} onAddStop={addStop} />
                <div className="mt-3 space-y-2">
                  {stops.map(function(s, i) { return (<div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"><div className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div><p className="text-sm flex-1">{s.name}</p>{s.lat && <p className="text-xs text-gray-400">{s.lat}, {s.lng}</p>}<button onClick={function() { removeStop(i); }} className="p-1 text-gray-400 hover:text-red-500"><X size={14} /></button></div>); })}
                </div>
                <div className="flex gap-2 mt-2">
                  <input className="input flex-1" placeholder="Nome da parada" value={newStop.name} onChange={function(e) { setNewStop(function(s) { return { ...s, name: e.target.value }; }); }} />
                  <input className="input w-28" placeholder="Lat" value={newStop.lat} onChange={function(e) { setNewStop(function(s) { return { ...s, lat: e.target.value }; }); }} />
                  <input className="input w-28" placeholder="Lng" value={newStop.lng} onChange={function(e) { setNewStop(function(s) { return { ...s, lng: e.target.value }; }); }} />
                  <button onClick={function() { addStop(); }} className="btn-secondary px-3">+</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Busque um endereço acima ou clique no mapa para adicionar paradas</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={function() { setShow(false); }} className="btn-secondary flex-1">Cancelar</button>
              <button disabled={loading} onClick={function() { create({ municipalityId, ...form, stops }, { onSuccess: function() { refetch(); setShow(false); } }); }} className="btn-primary flex-1">{loading ? 'Salvando...' : 'Salvar Rota'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
      }
