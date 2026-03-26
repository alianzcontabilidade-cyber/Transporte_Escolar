import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showSuccessToast, showErrorToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Brain, MapPin, Route, TrendingDown, Loader2, Check, CheckCircle, AlertTriangle, Users, Play, ChevronDown, ChevronRight, Lightbulb, RefreshCw, Truck, Warehouse, Target, Layers, Settings, DollarSign, Clock, Fuel } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface RouteStop {
  id: number; name: string; currentOrder: number; suggestedOrder: number; lat: number; lng: number;
}
interface RouteAnalysis {
  routeId: number; routeName: string; currentDistance: number; optimizedDistance: number;
  savingsKm: number; savingsPercent: number; optimizedOrder: number[];
  suggestions: string[]; score: number; stops: RouteStop[];
}
interface StopCluster {
  clusterIndex: number; suggestedName: string; center: { latitude: number; longitude: number };
  studentCount: number; avgDistanceM?: number;
  students: { id: number; name: string; address: string | null; neighborhood: string | null; distanceToCenter: number }[];
}
interface CWRoute {
  routeIndex: number; suggestedName: string;
  stops: { id: number; name: string; lat: number; lng: number; order: number }[];
  totalPassengers: number; totalDistanceKm: number; stopCount: number;
}
interface NoiseStudent { id: number; name: string; address: string | null; }

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600 bg-green-100' : score >= 50 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100';
  const barColor = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}</span>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function AIRoutesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId;
  const [tab, setTab] = useState<'routes' | 'clarke' | 'stops' | 'generate'>('routes');
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [expandedCW, setExpandedCW] = useState<number | null>(null);

  // Stops config
  const [stopMethod, setStopMethod] = useState<'kmeans' | 'dbscan'>('dbscan');
  const [numClusters, setNumClusters] = useState(5);
  const [epsilon, setEpsilon] = useState(1.5);
  const [minPoints, setMinPoints] = useState(2);

  // Clarke-Wright config
  const [cwConfig, setCwConfig] = useState({ depotLat: '', depotLng: '', destLat: '', destLng: '', maxCapacity: 40, maxDistanceKm: 100 });

  // Generate routes config
  const [genConfig, setGenConfig] = useState({
    schoolId: '', depotLat: '', depotLng: '', maxCapacity: 40, maxDistanceKm: 80,
    avgSpeedKmh: 40, costPerKm: 3.5, driverCostPerHour: 25, prefix: 'AUTO',
  });
  const [genResult, setGenResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedRouteMap, setSelectedRouteMap] = useState<number | 'all'>('all');
  const routeMapRef = useRef<HTMLDivElement>(null);
  const routeMapInstanceRef = useRef<any>(null);

  // Route colors for different routes
  const ROUTE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#7C3AED', '#ec4899', '#06b6d4', '#84cc16'];

  // Render route map when genResult changes
  useEffect(() => {
    if (!genResult?.success || !genResult?.routes?.length || !routeMapRef.current) return;
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !routeMapRef.current) return;
      if (routeMapInstanceRef.current) { routeMapInstanceRef.current.remove(); routeMapInstanceRef.current = null; }
      const map = L.map(routeMapRef.current, { zoomControl: true }).setView([-10.76, -48.90], 13);
      const sa = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const hl = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
      const st = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 20 });
      sa.addTo(map); hl.addTo(map);
      L.control.layers({ 'Ruas': st, 'Satélite': sa }, {}, { position: 'topright', collapsed: true }).addTo(map);

      const allBounds = L.latLngBounds([]);
      const routesToShow = selectedRouteMap === 'all' ? genResult.routes : [genResult.routes[selectedRouteMap]];

      routesToShow.forEach((r: any, rIdx: number) => {
        const color = ROUTE_COLORS[selectedRouteMap === 'all' ? rIdx : (selectedRouteMap as number)] || '#333';
        const points: any[] = [];

        // Depot marker (garagem)
        if (r.depotLat && r.depotLng) {
          const depotIcon = L.divIcon({ html: '<div style="background:#374151;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:14px">🏠</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
          L.marker([r.depotLat, r.depotLng], { icon: depotIcon }).addTo(map).bindPopup('<b>Garagem</b>');
          points.push([r.depotLat, r.depotLng]);
          allBounds.extend([r.depotLat, r.depotLng]);
        }

        // Stop markers
        if (r.stopPoints) {
          r.stopPoints.forEach((s: any) => {
            const stopIcon = L.divIcon({ html: '<div style="background:' + color + ';color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.25)">' + s.order + '</div>', className: '', iconSize: [26, 26], iconAnchor: [13, 13] });
            L.marker([s.lat, s.lng], { icon: stopIcon }).addTo(map).bindPopup('<b>' + s.order + '. ' + s.name + '</b><br><span style="font-size:11px;color:#666">' + r.code + '</span>');
            points.push([s.lat, s.lng]);
            allBounds.extend([s.lat, s.lng]);
          });
        }

        // School marker
        if (r.schoolLat && r.schoolLng) {
          const schoolIcon = L.divIcon({ html: '<div style="background:#dc2626;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:16px">🏫</div>', className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
          L.marker([r.schoolLat, r.schoolLng], { icon: schoolIcon }).addTo(map).bindPopup('<b>Escola</b>');
          points.push([r.schoolLat, r.schoolLng]);
          allBounds.extend([r.schoolLat, r.schoolLng]);
        }

        // Route line
        if (points.length > 1) {
          L.polyline(points, { color, weight: 4, opacity: 0.8, dashArray: selectedRouteMap === 'all' ? '8 4' : undefined }).addTo(map);
        }
      });

      if (allBounds.isValid()) map.fitBounds(allBounds, { padding: [40, 40] });
      routeMapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    };
    // Load Leaflet if needed
    if ((window as any).L) {
      setTimeout(initMap, 200);
    } else {
      if (!document.getElementById('leaflet-css-rt')) {
        const lk = document.createElement('link'); lk.id = 'leaflet-css-rt'; lk.rel = 'stylesheet';
        lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk);
      }
      if (!document.getElementById('leaflet-js-rt')) {
        const sc = document.createElement('script'); sc.id = 'leaflet-js-rt';
        sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        sc.onload = () => setTimeout(initMap, 300);
        document.head.appendChild(sc);
      } else {
        // Script exists but L not ready yet, poll
        const poll = setInterval(() => { if ((window as any).L) { clearInterval(poll); initMap(); } }, 200);
        setTimeout(() => clearInterval(poll), 5000);
      }
    }
    return () => { if (routeMapInstanceRef.current) { routeMapInstanceRef.current.remove(); routeMapInstanceRef.current = null; } };
  }, [genResult, selectedRouteMap]);

  // Queries - lazy (only run when user clicks)
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const runAnalysis = async () => {
    setAnalyzing(true); setAnalyzeError('');
    try { const r = await api.ai.analyzeRoutes({ municipalityId }); setRouteAnalysis(r || []); }
    catch (e: any) { setAnalyzeError(e.message || 'Erro'); }
    setAnalyzing(false);
  };

  const [kmeansData, setKmeansData] = useState<any>(null);
  const [loadingKmeans, setLoadingKmeans] = useState(false);
  const loadKmeans = async () => {
    setLoadingKmeans(true);
    try { const r = await api.ai.suggestStops({ municipalityId, numClusters }); setKmeansData(r); }
    catch {}
    setLoadingKmeans(false);
  };

  const [dbscanData, setDbscanData] = useState<any>(null);
  const [loadingDbscan, setLoadingDbscan] = useState(false);
  const loadDbscan = async () => {
    setLoadingDbscan(true);
    try { const r = await api.ai.suggestStopsDbscan({ municipalityId, epsilonKm: epsilon, minPoints }); setDbscanData(r); }
    catch {}
    setLoadingDbscan(false);
  };

  const [cwData, setCwData] = useState<any>(null);
  const [loadingCW, setLoadingCW] = useState(false);
  const loadCW = async () => {
    if (!cwConfig.depotLat || !cwConfig.destLat) return;
    setLoadingCW(true);
    try {
      const r = await api.ai.clarkeWright({
        municipalityId, depotLat: parseFloat(cwConfig.depotLat), depotLng: parseFloat(cwConfig.depotLng),
        destinationLat: parseFloat(cwConfig.destLat), destinationLng: parseFloat(cwConfig.destLng),
        maxCapacity: cwConfig.maxCapacity, maxDistanceKm: cwConfig.maxDistanceKm,
      });
      setCwData(r);
    } catch {}
    setLoadingCW(false);
  };

  // Garages/Schools - these are lightweight, load on mount
  const { data: garagesList } = useQuery<any[]>(() => api.garages?.list ? api.garages.list({ municipalityId }) : Promise.resolve([]), [municipalityId]);
  const { data: schoolsList } = useQuery<any[]>(() => api.schools?.list ? api.schools.list({ municipalityId }) : Promise.resolve([]), [municipalityId]);

  const { mutate: optimizeRoute, loading: optimizing } = useMutation(api.ai.optimizeRoute);

  const routes = routeAnalysis;
  const totalRoutes = routes.length;
  const totalCurrentKm = routes.reduce((s, r) => s + r.currentDistance, 0);
  const totalSavingsKm = routes.reduce((s, r) => s + r.savingsKm, 0);
  const avgScore = totalRoutes > 0 ? Math.round(routes.reduce((s, r) => s + r.score, 0) / totalRoutes) : 0;

  const handleOptimize = (routeId: number) => {
    optimizeRoute({ routeId }, { onSuccess: () => { showSuccessToast('Rota otimizada com sucesso'); runAnalysis(); } });
  };

  const clusters = stopMethod === 'dbscan' ? (dbscanData?.clusters || []) : (kmeansData?.clusters || (kmeansData as any) || []);
  const noise = stopMethod === 'dbscan' ? (dbscanData?.noise || []) : [];
  const loadingStops = stopMethod === 'dbscan' ? loadingDbscan : loadingKmeans;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Brain size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Otimizacao Inteligente de Rotas</h1>
            <p className="text-gray-500 text-sm">Algoritmos Clarke-Wright, 2-opt, K-means e DBSCAN</p>
          </div>
        </div>
        {tab === 'routes' && (
          <button onClick={() => runAnalysis()} disabled={analyzing} className="btn-primary flex items-center gap-2">
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {analyzing ? 'Analisando...' : 'Analisar Rotas'}
          </button>
        )}
      </div>

      {/* Stats cards */}
      {routes.length > 0 && tab === 'routes' && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 border-0">
            <Route size={20} className="text-blue-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{totalRoutes}</p>
            <p className="text-xs text-gray-500">Total rotas</p>
          </div>
          <div className="card bg-gray-50 border-0">
            <MapPin size={20} className="text-gray-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{totalCurrentKm.toFixed(1)} km</p>
            <p className="text-xs text-gray-500">Distancia total atual</p>
          </div>
          <div className="card bg-green-50 border-0">
            <TrendingDown size={20} className="text-green-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">-{totalSavingsKm.toFixed(1)} km</p>
            <p className="text-xs text-gray-500">Economia potencial</p>
          </div>
          <div className="card bg-purple-50 border-0">
            <Brain size={20} className="text-purple-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{avgScore}/100</p>
            <p className="text-xs text-gray-500">Score medio (NN + 2-opt)</p>
          </div>
        </div>
      )}

      {/* Tabs - 3 abas */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'routes' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
          <Route size={14} /> Análise de Rotas
        </button>
        <button onClick={() => setTab('clarke')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'clarke' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
          <Layers size={14} /> Clarke-Wright
        </button>
        <button onClick={() => setTab('stops')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'stops' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
          <Target size={14} /> Pontos de Parada
        </button>
        <button onClick={() => setTab('generate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'generate' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
          <Truck size={14} /> Gerar Rotas
        </button>
      </div>

      {/* ====== TAB: Análise de Rotas (NN + 2-opt) ====== */}
      {tab === 'routes' && (
        <>
          {analyzing && (
            <div className="card border-purple-200 bg-purple-50/30 mb-4">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-500 animate-pulse" />
                <p className="font-semibold text-purple-700">IA processando rotas (Nearest-Neighbor + 2-opt)...</p>
                <Loader2 size={16} className="animate-spin text-purple-500 ml-auto" />
              </div>
            </div>
          )}
          {analyzeError && <div className="card mb-4 bg-red-50 border-red-200"><div className="flex items-center gap-2 text-red-700"><AlertTriangle size={16} /><p className="text-sm">{analyzeError}</p></div></div>}

          {!analyzing && routes.length === 0 && (
            <div className="card text-center py-16 border-dashed border-2 border-gray-200">
              <Brain size={56} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Análise IA nao executada</h3>
              <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">Clique em "Analisar Rotas" para calcular a melhor sequencia de paradas usando Nearest-Neighbor + 2-opt local search.</p>
              <button onClick={() => runAnalysis()} className="btn-primary flex items-center gap-2 mx-auto"><Play size={16} /> Iniciar Análise</button>
            </div>
          )}

          {routes.length > 0 && (
            <div className="space-y-3">
              {routes.map((route) => {
                const isExpanded = expandedRoute === route.routeId;
                const scoreColor = route.score >= 80 ? 'text-green-600' : route.score >= 50 ? 'text-yellow-600' : 'text-red-600';
                return (
                  <div key={route.routeId} className="card">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedRoute(isExpanded ? null : route.routeId)}>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0"><Route size={18} className="text-primary-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">{route.routeName}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                          <span>{route.currentDistance.toFixed(1)} km atual</span>
                          <span className="text-green-600 font-medium">{route.optimizedDistance.toFixed(1)} km otimizado</span>
                          <span className={`font-medium ${scoreColor}`}>-{route.savingsPercent.toFixed(0)}%</span>
                        </div>
                      </div>
                      <ScoreGauge score={route.score} />
                      <p className="text-green-600 font-bold text-sm">-{route.savingsKm.toFixed(1)} km</p>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        {route.stops?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Paradas - Ordem atual vs sugerida (2-opt)</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-1 font-medium">Ordem atual</p>
                                {[...route.stops].sort((a, b) => a.currentOrder - b.currentOrder).map((stop, i) => (
                                  <div key={stop.id} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                    {stop.name}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1 font-medium">Ordem otimizada (NN + 2-opt)</p>
                                {[...route.stops].sort((a, b) => a.suggestedOrder - b.suggestedOrder).map((stop, i) => (
                                  <div key={stop.id} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                                    <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                    {stop.name}
                                    {stop.currentOrder !== stop.suggestedOrder && <span className="text-xs text-orange-500 font-medium">(era {stop.currentOrder})</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {route.suggestions?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Lightbulb size={14} className="text-yellow-500" /> Sugestoes</h4>
                            <div className="space-y-2">
                              {route.suggestions.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                  <div className="w-5 h-5 rounded-full bg-yellow-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                                  <p className="text-sm text-yellow-800">{s}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleOptimize(route.routeId); }} disabled={optimizing}
                          className="btn-primary text-sm flex items-center gap-2">
                          {optimizing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Aplicar Otimizacao
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ====== TAB: Clarke-Wright ====== */}
      {tab === 'clarke' && (
        <>
          <div className="card mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Settings size={14} /> Parametros Clarke-Wright</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="label">Garagem (ponto de partida)</label>
                <select className="input" onChange={(e) => {
                  const g = (garagesList || []).find((g: any) => g.id === Number(e.target.value));
                  if (g) setCwConfig(c => ({ ...c, depotLat: String(g.latitude || ''), depotLng: String(g.longitude || '') }));
                }}>
                  <option value="">Selecione</option>
                  {(garagesList || []).filter((g: any) => g.latitude).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                {!garagesList?.length && <p className="text-xs text-gray-400 mt-1">Cadastre garagens com GPS</p>}
                <div className="flex gap-2 mt-1">
                  <input type="text" placeholder="Lat" value={cwConfig.depotLat} onChange={e => setCwConfig(c => ({ ...c, depotLat: e.target.value }))} className="input text-xs flex-1" />
                  <input type="text" placeholder="Lng" value={cwConfig.depotLng} onChange={e => setCwConfig(c => ({ ...c, depotLng: e.target.value }))} className="input text-xs flex-1" />
                </div>
              </div>
              <div>
                <label className="label">Escola (destino)</label>
                <select className="input" onChange={(e) => {
                  const s = (schoolsList || []).find((s: any) => s.id === Number(e.target.value));
                  if (s) setCwConfig(c => ({ ...c, destLat: String(s.latitude || ''), destLng: String(s.longitude || '') }));
                }}>
                  <option value="">Selecione</option>
                  {(schoolsList || []).filter((s: any) => s.latitude).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <div className="flex gap-2 mt-1">
                  <input type="text" placeholder="Lat" value={cwConfig.destLat} onChange={e => setCwConfig(c => ({ ...c, destLat: e.target.value }))} className="input text-xs flex-1" />
                  <input type="text" placeholder="Lng" value={cwConfig.destLng} onChange={e => setCwConfig(c => ({ ...c, destLng: e.target.value }))} className="input text-xs flex-1" />
                </div>
              </div>
              <div>
                <label className="label">Capacidade max. veiculo</label>
                <input type="number" value={cwConfig.maxCapacity} onChange={e => setCwConfig(c => ({ ...c, maxCapacity: Number(e.target.value) }))} className="input" />
              </div>
              <div>
                <label className="label">Distancia max. rota (km)</label>
                <input type="number" value={cwConfig.maxDistanceKm} onChange={e => setCwConfig(c => ({ ...c, maxDistanceKm: Number(e.target.value) }))} className="input" />
              </div>
            </div>
            <button onClick={loadCW} disabled={loadingCW || !cwConfig.depotLat || !cwConfig.destLat}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              {loadingCW ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
              Gerar Rotas Clarke-Wright + 2-opt
            </button>
          </div>

          {loadingCW && (
            <div className="card border-purple-200 bg-purple-50/30 mb-4">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-500 animate-pulse" />
                <p className="font-semibold text-purple-700">Calculando savings e agrupando paradas...</p>
                <Loader2 size={16} className="animate-spin text-purple-500 ml-auto" />
              </div>
            </div>
          )}

          {cwData && cwData.routes.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="card bg-blue-50 border-0">
                  <Truck size={20} className="text-blue-600 mb-2" />
                  <p className="text-xl font-bold text-gray-900">{cwData.routes.length}</p>
                  <p className="text-xs text-gray-500">Rotas geradas</p>
                </div>
                <div className="card bg-green-50 border-0">
                  <MapPin size={20} className="text-green-600 mb-2" />
                  <p className="text-xl font-bold text-gray-900">{cwData.totalStops}</p>
                  <p className="text-xs text-gray-500">Paradas distribuidas</p>
                </div>
                <div className="card bg-amber-50 border-0">
                  <Route size={20} className="text-amber-600 mb-2" />
                  <p className="text-xl font-bold text-gray-900">{cwData.routes.reduce((s, r) => s + r.totalDistanceKm, 0).toFixed(1)} km</p>
                  <p className="text-xs text-gray-500">Distancia total</p>
                </div>
              </div>

              <div className="space-y-3">
                {cwData.routes.map((r) => {
                  const isExpanded = expandedCW === r.routeIndex;
                  return (
                    <div key={r.routeIndex} className="card">
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedCW(isExpanded ? null : r.routeIndex)}>
                        {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Truck size={18} className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{r.suggestedName}</p>
                          <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                            <span>{r.stopCount} paradas</span>
                            <span>{r.totalDistanceKm} km</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{r.totalPassengers} alunos</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="space-y-1">
                            {r.stops.map(s => (
                              <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{s.order}</span>
                                <MapPin size={14} className="text-gray-400" />
                                <p className="text-sm text-gray-700">{s.name}</p>
                                <p className="text-xs text-gray-400 ml-auto">{s.lat.toFixed(4)}, {s.lng.toFixed(4)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {cwData && cwData.routes.length === 0 && !loadingCW && cwConfig.depotLat && (
            <div className="card text-center py-12 border-dashed border-2 border-gray-200">
              <Warehouse size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma parada com GPS encontrada para agrupar</p>
            </div>
          )}
        </>
      )}

      {/* ====== TAB: Pontos de Parada (DBSCAN + K-means) ====== */}
      {tab === 'stops' && (
        <>
          <div className="card mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Settings size={14} /> Metodo de Agrupamento</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={stopMethod === 'dbscan'} onChange={() => setStopMethod('dbscan')} className="text-primary-600" />
                <span className="text-sm"><strong>DBSCAN</strong> - Detecta clusters automaticamente por densidade</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={stopMethod === 'kmeans'} onChange={() => setStopMethod('kmeans')} className="text-primary-600" />
                <span className="text-sm"><strong>K-Means</strong> - Agrupa em K clusters fixos</span>
              </label>
            </div>

            {stopMethod === 'dbscan' ? (
              <div className="flex items-center gap-4">
                <div>
                  <label className="label">Raio maximo (km)</label>
                  <input type="number" step="0.1" value={epsilon} onChange={e => setEpsilon(Number(e.target.value))} className="input w-28" />
                </div>
                <div>
                  <label className="label">Min. alunos por ponto</label>
                  <input type="number" value={minPoints} onChange={e => setMinPoints(Number(e.target.value))} className="input w-28" />
                </div>
                <div className="pt-5">
                  <button onClick={loadDbscan} disabled={loadingDbscan} className="btn-primary text-sm flex items-center gap-2">
                    {loadingDbscan ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />} Calcular DBSCAN
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div>
                  <label className="label">Número de clusters</label>
                  <select value={numClusters} onChange={e => setNumClusters(Number(e.target.value))} className="input w-24">
                    {[3, 5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="pt-5">
                  <button onClick={loadKmeans} disabled={loadingKmeans} className="btn-primary text-sm flex items-center gap-2">
                    {loadingKmeans ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Calcular K-Means
                  </button>
                </div>
              </div>
            )}
          </div>

          {loadingStops && (
            <div className="card border-purple-200 bg-purple-50/30 mb-4">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-500 animate-pulse" />
                <p className="font-semibold text-purple-700">Agrupando alunos ({stopMethod === 'dbscan' ? 'DBSCAN' : 'K-Means'})...</p>
                <Loader2 size={16} className="animate-spin text-purple-500 ml-auto" />
              </div>
            </div>
          )}

          {/* Stats DBSCAN */}
          {stopMethod === 'dbscan' && dbscanData && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="card bg-blue-50 border-0">
                <Users size={20} className="text-blue-600 mb-2" />
                <p className="text-xl font-bold text-gray-900">{dbscanData.totalUnassigned}</p>
                <p className="text-xs text-gray-500">Alunos sem parada</p>
              </div>
              <div className="card bg-green-50 border-0">
                <MapPin size={20} className="text-green-600 mb-2" />
                <p className="text-xl font-bold text-gray-900">{dbscanData.withCoordinates}</p>
                <p className="text-xs text-gray-500">Com GPS</p>
              </div>
              <div className="card bg-purple-50 border-0">
                <Target size={20} className="text-purple-600 mb-2" />
                <p className="text-xl font-bold text-gray-900">{clusters.length}</p>
                <p className="text-xs text-gray-500">Pontos sugeridos</p>
              </div>
              <div className="card bg-orange-50 border-0">
                <AlertTriangle size={20} className="text-orange-600 mb-2" />
                <p className="text-xl font-bold text-gray-900">{noise.length}</p>
                <p className="text-xs text-gray-500">Alunos isolados</p>
              </div>
            </div>
          )}

          {!loadingStops && clusters.length === 0 && (
            <div className="card text-center py-12 border-dashed border-2 border-gray-200">
              <Users size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum aluno sem rota encontrado</p>
            </div>
          )}

          {clusters.length > 0 && (
            <div className="space-y-3">
              {clusters.map((cluster: any, idx: number) => {
                const isExpanded = expandedCluster === idx;
                const studs = cluster.students || [];
                return (
                  <div key={idx} className="card">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedCluster(isExpanded ? null : idx)}>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0"><Target size={18} className="text-blue-600" /></div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{cluster.suggestedName || `Cluster ${idx + 1}`}</p>
                        <p className="text-xs text-gray-500">
                          Centro: {(cluster.center?.latitude || cluster.centerLat || 0).toFixed(4)}, {(cluster.center?.longitude || cluster.centerLng || 0).toFixed(4)}
                          {cluster.avgDistanceM ? ` | Raio medio: ${cluster.avgDistanceM}m` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{cluster.studentCount || studs.length} alunos</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                        {studs.map((s: any) => (
                          <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <Users size={14} className="text-gray-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">{s.name}</p>
                              <p className="text-xs text-gray-400">{s.address || s.neighborhood || 'Sem endereco'}</p>
                            </div>
                            {s.distanceToCenter != null && (
                              <span className="text-xs text-gray-400">{s.distanceToCenter}m</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Noise (alunos isolados - so DBSCAN) */}
          {noise.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500" /> Alunos Isolados ({noise.length}) - Necessitam parada individual
              </h3>
              <div className="card bg-orange-50/50">
                <div className="space-y-1">
                  {noise.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <Users size={14} className="text-orange-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.address || 'Sem endereco'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ====== TAB: Gerar Rotas Automaticamente ====== */}
      {tab === 'generate' && (
        <>
          <div className="card mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2"><Truck size={14} /> Simular Rotas</h3>
            <p className="text-xs text-gray-500 mb-4">Simule rotas otimizadas sem salvar. Após revisar, clique em "Aprovar" para criar as rotas no sistema.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="label">Escola</label>
                <select className="input" value={genConfig.schoolId} onChange={e => setGenConfig(c => ({ ...c, schoolId: e.target.value }))}>
                  <option value="">Selecione a escola</option>
                  {(schoolsList || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Garagem (partida)</label>
                <select className="input" onChange={(e) => { const g = (garagesList || []).find((g: any) => g.id === Number(e.target.value)); if (g) setGenConfig(c => ({ ...c, depotLat: String(g.latitude || ''), depotLng: String(g.longitude || '') })); }}>
                  <option value="">Selecione</option>
                  {(garagesList || []).filter((g: any) => g.latitude).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <div className="flex gap-2 mt-1">
                  <input type="text" placeholder="Lat" value={genConfig.depotLat} onChange={e => setGenConfig(c => ({ ...c, depotLat: e.target.value }))} className="input text-xs flex-1" />
                  <input type="text" placeholder="Lng" value={genConfig.depotLng} onChange={e => setGenConfig(c => ({ ...c, depotLng: e.target.value }))} className="input text-xs flex-1" />
                </div>
              </div>
              <div><label className="label">Capacidade veículo</label><input type="number" value={genConfig.maxCapacity} onChange={e => setGenConfig(c => ({ ...c, maxCapacity: Number(e.target.value) }))} className="input" /></div>
              <div><label className="label">Dist. máx. rota (km)</label><input type="number" value={genConfig.maxDistanceKm} onChange={e => setGenConfig(c => ({ ...c, maxDistanceKm: Number(e.target.value) }))} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div><label className="label">Velocidade média (km/h)</label><input type="number" value={genConfig.avgSpeedKmh} onChange={e => setGenConfig(c => ({ ...c, avgSpeedKmh: Number(e.target.value) }))} className="input" /></div>
              <div><label className="label">Custo por km (R$)</label><input type="number" step="0.1" value={genConfig.costPerKm} onChange={e => setGenConfig(c => ({ ...c, costPerKm: Number(e.target.value) }))} className="input" /></div>
              <div><label className="label">Custo motorista/hora (R$)</label><input type="number" value={genConfig.driverCostPerHour} onChange={e => setGenConfig(c => ({ ...c, driverCostPerHour: Number(e.target.value) }))} className="input" /></div>
              <div><label className="label">Prefixo das rotas</label><input type="text" value={genConfig.prefix} onChange={e => setGenConfig(c => ({ ...c, prefix: e.target.value }))} className="input" /></div>
            </div>
            <button onClick={async () => {
              if (!genConfig.schoolId || !genConfig.depotLat) { showErrorToast('Selecione a escola e a garagem'); return; }
              setGenerating(true); setGenResult(null);
              try {
                const result = await api.ai.simulateRoutes({
                  municipalityId, schoolId: Number(genConfig.schoolId),
                  depotLat: parseFloat(genConfig.depotLat), depotLng: parseFloat(genConfig.depotLng),
                  maxCapacity: genConfig.maxCapacity, maxDistanceKm: genConfig.maxDistanceKm,
                  avgSpeedKmh: genConfig.avgSpeedKmh, costPerKm: genConfig.costPerKm,
                  driverCostPerHour: genConfig.driverCostPerHour, prefix: genConfig.prefix,
                });
                setGenResult(result);
              } catch (e: any) { showErrorToast(e.message || 'Erro ao simular rotas'); }
              setGenerating(false);
            }} disabled={generating || !genConfig.schoolId || !genConfig.depotLat}
              className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {generating ? 'Simulando...' : 'Simular Rotas'}
            </button>
          </div>

          {generating && (
            <div className="card border-green-200 bg-green-50/30 mb-4">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-green-500 animate-pulse" />
                <p className="font-semibold text-green-700">Clarke-Wright + 2-opt processando alunos...</p>
                <Loader2 size={16} className="animate-spin text-green-500 ml-auto" />
              </div>
            </div>
          )}

          {genResult && genResult.success && (
            <>
              {/* Status: SIMULAÇÃO */}
              <div className="card mb-4 bg-amber-50 border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-800">Simulação - Nada foi salvo ainda</p>
                      <p className="text-xs text-amber-600">Revise as rotas abaixo. Clique em "Aprovar e Criar Rotas" para salvar no sistema.</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    setGenerating(true);
                    try {
                      const result = await api.ai.approveRoutes({
                        municipalityId, schoolId: Number(genConfig.schoolId),
                        routes: genResult.routes.map((r: any) => ({
                          name: r.name, code: r.code, distanceKm: r.distanceKm, timeMinutes: r.timeMinutes,
                          monthlyCostFuel: r.monthlyCostFuel, monthlyCostDriver: r.monthlyCostDriver, costPerStudent: r.costPerStudent,
                          stopPoints: r.stopPoints,
                        })),
                      });
                      showSuccessToast(result.message);
                      setGenResult({ ...genResult, approved: true });
                    } catch (e: any) { showErrorToast(e.message || 'Erro ao aprovar'); }
                    setGenerating(false);
                  }} disabled={generating || genResult.approved}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${genResult.approved ? 'bg-green-500 text-white cursor-default' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                    {genResult.approved ? <><CheckCircle size={16} /> Rotas Aprovadas</> : generating ? <><Loader2 size={16} className="animate-spin" /> Aprovando...</> : <><Check size={16} /> Aprovar e Criar Rotas</>}
                  </button>
                </div>
              </div>

              {/* Dashboard resumo */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="card bg-blue-50 border-0 p-4"><Truck size={18} className="text-blue-600 mb-1" /><p className="text-2xl font-bold">{genResult.routes.length}</p><p className="text-[10px] text-gray-500 uppercase">Rotas</p></div>
                <div className="card bg-green-50 border-0 p-4"><Users size={18} className="text-green-600 mb-1" /><p className="text-2xl font-bold">{genResult.totalStudents}</p><p className="text-[10px] text-gray-500 uppercase">Alunos</p></div>
                <div className="card bg-amber-50 border-0 p-4"><Route size={18} className="text-amber-600 mb-1" /><p className="text-2xl font-bold">{genResult.routes.reduce((s: number, r: any) => s + r.distanceKm, 0).toFixed(1)} <span className="text-sm font-normal">km</span></p><p className="text-[10px] text-gray-500 uppercase">Distância</p></div>
                <div className="card bg-purple-50 border-0 p-4"><Clock size={18} className="text-purple-600 mb-1" /><p className="text-2xl font-bold">{genResult.routes.reduce((s: number, r: any) => s + r.timeMinutes, 0)} <span className="text-sm font-normal">min</span></p><p className="text-[10px] text-gray-500 uppercase">Tempo</p></div>
                <div className="card bg-red-50 border-0 p-4"><DollarSign size={18} className="text-red-600 mb-1" /><p className="text-2xl font-bold">R$ {genResult.routes.reduce((s: number, r: any) => s + r.monthlyCostTotal, 0).toLocaleString('pt-BR')}</p><p className="text-[10px] text-gray-500 uppercase">Custo/Mês</p></div>
              </div>

              {/* Mapa */}
              <div className="card mb-4 p-0 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><MapPin size={14} /> Mapa das Rotas</span>
                  <select className="input text-xs py-1 w-44" value={selectedRouteMap} onChange={e => setSelectedRouteMap(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                    <option value="all">Todas as rotas</option>
                    {genResult.routes.map((r: any, i: number) => <option key={i} value={i}>{r.code} - {r.stopCount} paradas</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 px-3 py-2 bg-white border-b">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-gray-700 inline-block" /> Garagem</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Escola</span>
                  {genResult.routes.map((r: any, i: number) => (
                    <span key={i} className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded-full inline-block" style={{ background: ROUTE_COLORS[i] }} /> {r.code}</span>
                  ))}
                </div>
                <div ref={routeMapRef} style={{ height: 420 }} />
              </div>

              {/* Cards rotas */}
              <div className="space-y-3">
                {genResult.routes.map((r: any, idx: number) => (
                  <div key={idx} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ROUTE_COLORS[idx] + '20' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: ROUTE_COLORS[idx] }}>{idx + 1}</div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{r.name}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                          <span>{r.stopCount} paradas</span><span>{r.passengers} alunos</span><span>{r.distanceKm.toFixed(1)} km</span><span>{r.timeMinutes} min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">R$ {r.monthlyCostTotal.toLocaleString('pt-BR')}/mês</p>
                        <p className="text-xs text-gray-400">R$ {r.costPerStudent}/aluno</p>
                      </div>
                      <button onClick={() => setSelectedRouteMap(idx)} className="btn-secondary text-xs px-3 py-1.5">Ver no mapa</button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-3">
                      <div className="bg-blue-50 rounded-lg p-2 text-center"><Fuel size={14} className="text-blue-600 mx-auto mb-1" /><p className="text-xs text-blue-800 font-bold">R$ {r.monthlyCostFuel.toLocaleString('pt-BR')}</p><p className="text-[10px] text-blue-500">Combustível</p></div>
                      <div className="bg-amber-50 rounded-lg p-2 text-center"><Users size={14} className="text-amber-600 mx-auto mb-1" /><p className="text-xs text-amber-800 font-bold">R$ {r.monthlyCostDriver.toLocaleString('pt-BR')}</p><p className="text-[10px] text-amber-500">Motorista</p></div>
                      <div className="bg-green-50 rounded-lg p-2 text-center"><DollarSign size={14} className="text-green-600 mx-auto mb-1" /><p className="text-xs text-green-800 font-bold">R$ {r.costPerStudent}</p><p className="text-[10px] text-green-500">Por aluno</p></div>
                      <div className="bg-purple-50 rounded-lg p-2 text-center"><Clock size={14} className="text-purple-600 mx-auto mb-1" /><p className="text-xs text-purple-800 font-bold">{r.timeMinutes} min</p><p className="text-[10px] text-purple-500">Percurso</p></div>
                    </div>
                    {r.stopPoints && <div className="mt-3 pt-3 border-t border-gray-100"><p className="text-xs font-semibold text-gray-500 mb-2">Sequência:</p><div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">🏠 Garagem</span>
                      {r.stopPoints.map((s: any) => <span key={s.order} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: ROUTE_COLORS[idx] }}>{s.order}. {s.name.split(' ')[0]}</span>)}
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">🏫 Escola</span>
                    </div></div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {genResult && !genResult.success && (
            <div className="card bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-700"><AlertTriangle size={16} /><p className="text-sm">{genResult.message}</p></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
