import { useEffect, useState, useRef } from 'react';
import { showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { api } from '../lib/api';
import { useWakeLock } from '../lib/pwa';
import { Bus, MapPin, Clock, User, Wifi, WifiOff, Navigation, CheckCircle, XCircle, AlertCircle, Activity, ChevronRight, Play, Square, UserCheck, UserX, Users, BarChart3, RefreshCw, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

// Calcular distância em metros entre duas coordenadas (fórmula de Haversine)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // raio da Terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LiveMap({ trips, locations, selectedTrip, fullscreen }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const L = (window as any).L;
      const map = L.map(mapRef.current!).setView([-15.78, -47.93], 12);
      const streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
      const terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      streets.addTo(map);
      L.control.layers({ 'Ruas': streets, 'Satélite': satellite, 'Escuro': dark, 'Terreno': terrain }, {}, { position: 'topright', collapsed: true }).addTo(map);
      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L) return;
    locations.forEach((loc: any, tripId: number) => {
      const icon = L.icon({ iconUrl: '/bus-marker.svg', iconSize: [48, 48], iconAnchor: [24, 44], popupAnchor: [0, -44] });
      const trip = trips?.find((t: any) => t.trip?.id === tripId);
      if (markersRef.current.has(tripId)) { markersRef.current.get(tripId).setLatLng([loc.lat, loc.lng]); }
      else {
        const m = L.marker([loc.lat, loc.lng], { icon }).addTo(mapInstanceRef.current)
          .bindPopup(`<b>${trip?.route?.name || 'Onibus'}</b><br>${new Date(loc.updatedAt).toLocaleTimeString('pt-BR')}`);
        markersRef.current.set(tripId, m);
        mapInstanceRef.current.setView([loc.lat, loc.lng], 14);
      }
    });
  }, [locations, trips]);

  // Show stops for selected trip
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L) return;
    // Remove old stop markers (tagged with className 'stop-marker')
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer._icon && layer._icon.classList?.contains('stop-marker-layer')) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    // Remove previous polylines
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.Rectangle)) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    if (!selectedTrip) return;

    // Get stops from selected trip route
    const tripId = selectedTrip.trip?.id;
    const tripRoute = selectedTrip.route || selectedTrip;

    // Try to load stops via API
    if (tripRoute?.id) {
      fetch('/api/trpc/stops.listByRoute?input=' + encodeURIComponent(JSON.stringify({ routeId: tripRoute.id })))
        .then(r => r.json()).then(data => {
          const stops = data?.result?.data || data?.[0]?.result?.data || [];
          if (!stops.length) return;

          const coords: [number, number][] = [];
          stops.forEach((stop: any, i: number) => {
            const lat = parseFloat(stop.latitude);
            const lng = parseFloat(stop.longitude);
            if (isNaN(lat) || isNaN(lng)) return;
            coords.push([lat, lng]);
            const icon = L.divIcon({
              html: '<div style="background:#6366f1;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">' + (i + 1) + '</div>',
              className: 'stop-marker-layer', iconSize: [24, 24], iconAnchor: [12, 12]
            });
            L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current)
              .bindPopup('<b>' + stop.name + '</b><br><small>Parada ' + (i + 1) + '</small>');
          });

          // Draw route line
          if (coords.length >= 2) {
            L.polyline(coords, { color: '#6366f1', weight: 3, opacity: 0.7, dashArray: '8 4' }).addTo(mapInstanceRef.current);
            mapInstanceRef.current.fitBounds(coords, { padding: [50, 50] });
          }
        }).catch(() => {});
    }
  }, [selectedTrip?.trip?.id]);

  // Auto-load stops for all trips when map first loads
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L || !trips || trips.length === 0) return;

    // If we already have bus markers, don't auto-load all stops
    if (locations.size > 0) return;

    // Show stops for each active trip
    const allCoords: [number, number][] = [];
    trips.forEach((t: any) => {
      const routeId = t.trip?.routeId || t.route?.id;
      if (!routeId) return;
      fetch('/api/trpc/stops.listByRoute?input=' + encodeURIComponent(JSON.stringify({ routeId })))
        .then(r => r.json()).then(data => {
          const stops = data?.result?.data || data?.[0]?.result?.data || [];
          stops.forEach((stop: any, i: number) => {
            const lat = parseFloat(stop.latitude);
            const lng = parseFloat(stop.longitude);
            if (isNaN(lat) || isNaN(lng)) return;
            allCoords.push([lat, lng]);
            const icon = L.divIcon({
              html: '<div style="background:#2DB5B0;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)">' + (i + 1) + '</div>',
              className: 'auto-stop-marker', iconSize: [20, 20], iconAnchor: [10, 10]
            });
            L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current)
              .bindPopup('<b>' + stop.name + '</b><br><small>' + (t.route?.name || '') + '</small>');
          });
          // Fit map to show all stops
          if (allCoords.length > 0) {
            mapInstanceRef.current.fitBounds(allCoords, { padding: [30, 30], maxZoom: 14 });
          }
        }).catch(() => {});
    });
  }, [trips?.length, locations.size]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-gray-200 ${fullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px]'}`}>
      <div ref={mapRef} className="w-full h-full" />
      {locations.size === 0 && <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90"><div className="text-center"><Navigation size={48} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-medium">Aguardando posições GPS</p><p className="text-gray-400 text-sm mt-1">Os ônibus aparecerão aqui quando as viagens forem iniciadas</p></div></div>}
    </div>
  );
}

// Componente de checklist de alunos para monitor/motorista
function StudentChecklist({ tripData, onRefresh }: { tripData: any, onRefresh: () => void }) {
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (tripData?.trip?.id) loadSummary();
  }, [tripData?.trip?.id]);

  async function loadSummary() {
    try {
      const data = await api.monitors.tripSummary({ tripId: tripData.trip?.id });
      setSummary(data);
    } catch (e) { console.error(e); }
  }

  async function handleBoard(studentId: number, stopId: number) {
    setProcessingId(studentId);
    try {
      await api.monitors.boardStudent({ tripId: tripData.trip?.id, studentId, stopId });
      onRefresh();
      loadSummary();
    } catch (e: any) { showErrorToast(e.message); }
    finally { setProcessingId(null); }
  }

  async function handleDrop(studentId: number, stopId: number) {
    setProcessingId(studentId);
    try {
      await api.monitors.dropStudent({ tripId: tripData.trip?.id, studentId, stopId });
      onRefresh();
      loadSummary();
    } catch (e: any) { showErrorToast(e.message); }
    finally { setProcessingId(null); }
  }

  async function handleAbsent(studentId: number, stopId: number) {
    setProcessingId(studentId);
    try {
      await api.monitors.markAbsent({ tripId: tripData.trip?.id, studentId, stopId });
      onRefresh();
      loadSummary();
    } catch (e: any) { showErrorToast(e.message); }
    finally { setProcessingId(null); }
  }

  async function handleArriveAtStop(stopId: number) {
    try {
      // Tentar obter localização real
      let lat = -15.78, lng = -47.93;
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      }
      await api.trips.arriveAtStop({ tripId: tripData.trip?.id, stopId, latitude: lat, longitude: lng });
      onRefresh();
    } catch (e: any) { console.error(e); }
  }

  async function handleCompleteTrip() {
    if (!confirm('Finalizar esta viagem?')) return;
    const tid = tripData.trip?.id || tripData.id;
    if (!tid) { showInfoToast('ID da viagem não encontrado. Tente recarregar a página.'); return; }
    try {
      await api.trips.complete({ tripId: tid });
      showSuccessToast('Viagem finalizada com sucesso!');
      onRefresh();
    } catch (e: any) { showErrorToast(e.message || 'Erro ao finalizar. Tente novamente'); }
  }

  const stopsData = tripData?.stops || [];
  const currentStop = stopsData[currentStopIdx];

  return (
    <div className="space-y-4">
      {/* Resumo */}
      {summary && (
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg"><p className="text-xs text-blue-600">Esperados</p><p className="text-lg font-bold text-blue-700">{summary.totalExpected}</p></div>
          <div className="text-center p-2 bg-green-50 rounded-lg"><p className="text-xs text-green-600">Embarcados</p><p className="text-lg font-bold text-green-700">{summary.boarded}</p></div>
          <div className="text-center p-2 bg-orange-50 rounded-lg"><p className="text-xs text-orange-600">Desembarcados</p><p className="text-lg font-bold text-orange-700">{summary.dropped}</p></div>
          <div className="text-center p-2 bg-red-50 rounded-lg"><p className="text-xs text-red-600">Ausentes</p><p className="text-lg font-bold text-red-700">{summary.absent}</p></div>
        </div>
      )}

      {/* Navegação por paradas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stopsData.map((stop: any, idx: number) => (
          <button key={stop.id} onClick={() => setCurrentStopIdx(idx)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              idx === currentStopIdx ? 'bg-primary-500 text-white border-primary-500' :
              stop.arrived ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200'
            }`}>
            {stop.arrived && '✓ '}{stop.name?.substring(0, 15)}
          </button>
        ))}
      </div>

      {/* Parada atual */}
      {currentStop && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">{currentStop.name}</h3>
              <p className="text-xs text-gray-500">Parada {currentStopIdx + 1} de {stopsData.length}</p>
            </div>
            {!currentStop.arrived ? (
              <button onClick={() => handleArriveAtStop(currentStop.id)}
                className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg flex items-center gap-1.5 hover:bg-primary-600">
                <MapPin size={14} /> Cheguei aqui
              </button>
            ) : (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={12} /> Chegou {currentStop.arrivedAt && new Date(currentStop.arrivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Lista de alunos na parada */}
          <div className="space-y-2">
            {(currentStop.students || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum aluno nesta parada</p>
            ) : (currentStop.students || []).map((student: any) => (
              <div key={student.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                student.status === 'boarded' ? 'bg-green-50 border-green-200' :
                student.status === 'dropped' ? 'bg-blue-50 border-blue-200' :
                student.status === 'absent' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  student.status === 'boarded' ? 'bg-green-500 text-white' :
                  student.status === 'dropped' ? 'bg-blue-500 text-white' :
                  student.status === 'absent' ? 'bg-red-400 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {student.status === 'boarded' ? '✓' : student.status === 'dropped' ? '↓' : student.status === 'absent' ? '✗' : student.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.grade || ''} {student.hasSpecialNeeds && 'Necessidades especiais'}</p>
                </div>
                {student.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button onClick={() => handleBoard(student.id, currentStop.id)} disabled={processingId === student.id}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50" title="Embarcar">
                      <UserCheck size={16} />
                    </button>
                    <button onClick={() => handleAbsent(student.id, currentStop.id)} disabled={processingId === student.id}
                      className="p-2 bg-red-400 text-white rounded-lg hover:bg-red-500 disabled:opacity-50" title="Ausente">
                      <UserX size={16} />
                    </button>
                  </div>
                )}
                {student.status === 'boarded' && (
                  <button onClick={() => handleDrop(student.id, currentStop.id)} disabled={processingId === student.id}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50" title="Desembarcar">
                    <UserX size={16} />
                  </button>
                )}
                {(student.status === 'dropped' || student.status === 'absent') && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${student.status === 'dropped' ? 'text-blue-600' : 'text-red-600'}`}>
                    {student.status === 'dropped' ? 'Desembarcou' : 'Ausente'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão finalizar */}
      <button onClick={handleCompleteTrip}
        className="w-full py-3 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-600">
        <Square size={16} /> Finalizar Viagem
      </button>
    </div>
  );
}

export default function MonitorPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [busLocations, setBusLocations] = useState<Map<number, any>>(new Map());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [view, setView] = useState<'overview' | 'checklist'>('overview');
  const [myTrip, setMyTrip] = useState<any>(null);
  const [availableRoutes, setAvailableRoutes] = useState<any>(null);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const municipalityId = user?.municipalityId || 0;
  const isDriverOrMonitor = user?.role === 'driver' || user?.role === 'monitor';
  const { isActive: wakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  useEffect(() => {
    loadData();
  }, []);

  // Ativar Wake Lock quando motorista tem viagem ativa (manter tela ligada)
  useEffect(() => {
    if (isDriverOrMonitor && myTrip) {
      requestWakeLock();
    }
    return () => { if (isDriverOrMonitor) releaseWakeLock(); };
  }, [myTrip?.trip?.id]);

  async function loadData() {
    setLoading(true);
    try {
      if (isDriverOrMonitor) {
        const trip = await api.monitors.myActiveTrip();
        setMyTrip(trip);
        if (trip && trip.trip) {
          setView('checklist');
        } else {
          setMyTrip(null);
          setView('overview');
          const routes = await api.monitors.availableTrips();
          setAvailableRoutes(routes);
        }
      }
      const trips = await api.trips.listActive({ municipalityId });
      setActiveTrips(trips || []);
      // Pre-populate bus locations from API data
      if (trips && trips.length > 0) {
        for (const t of trips) {
          const tripId = t.trip?.id;
          if (!tripId) continue;
          // Try driver position first
          const lat = t.driver?.currentLatitude ? parseFloat(t.driver.currentLatitude) : null;
          const lng = t.driver?.currentLongitude ? parseFloat(t.driver.currentLongitude) : null;
          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            setBusLocations(p => { const m = new Map(p); m.set(tripId, { lat, lng, updatedAt: new Date() }); return m; });
            continue;
          }
          // Fallback: fetch first stop of the route
          const routeId = t.trip?.routeId || t.route?.id;
          if (routeId) {
            api.stops.listByRoute({ routeId }).then((stopsData: any) => {
              const stopsList = Array.isArray(stopsData) ? stopsData : [];
              if (stopsList.length > 0) {
                const sLat = parseFloat(stopsList[0].latitude);
                const sLng = parseFloat(stopsList[0].longitude);
                if (!isNaN(sLat) && !isNaN(sLng)) {
                  setBusLocations(p => { const m = new Map(p); m.set(tripId, { lat: sLat, lng: sLng, updatedAt: new Date() }); return m; });
                }
              }
            }).catch(() => {});
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (socket && municipalityId) socket.emit('join:municipality', municipalityId);
  }, [socket, municipalityId]);

  useEffect(() => {
    if (!socket) return;
    socket.on('bus:location', (data: any) => setBusLocations(prev => { const n = new Map(prev); n.set(data.tripId, { ...data, updatedAt: new Date() }); return n; }));
    socket.on('stop:arrived', (data: any) => { setEvents(prev => [{ ...data, type: 'stop', time: new Date() }, ...prev.slice(0, 19)]); loadData(); });
    socket.on('student:boarded', (data: any) => setEvents(prev => [{ ...data, type: 'board', time: new Date() }, ...prev.slice(0, 19)]));
    socket.on('student:dropped', (data: any) => setEvents(prev => [{ ...data, type: 'drop', time: new Date() }, ...prev.slice(0, 19)]));
    socket.on('trip:started', () => loadData());
    socket.on('trip:completed', () => loadData());
    return () => { socket.off('bus:location'); socket.off('stop:arrived'); socket.off('student:boarded'); socket.off('student:dropped'); socket.off('trip:started'); socket.off('trip:completed'); };
  }, [socket]);

  // GPS contínuo para motoristas + detecção automática de chegada na parada (geocerca)
  const lastAutoArrivalRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!isDriverOrMonitor || !myTrip) return;
    lastAutoArrivalRef.current = new Set();

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Enviar posição ao servidor
        api.trips.updateLocation({
          tripId: myTrip.trip?.id, driverId: myTrip.driverId,
          latitude: lat, longitude: lng,
          speed: pos.coords.speed ? pos.coords.speed * 3.6 : undefined,
          heading: pos.coords.heading || undefined,
        }).catch(console.error);

        // Geocerca: verificar se está próximo de alguma parada não visitada
        if (myTrip.stops) {
          for (const stop of myTrip.stops) {
            if (stop.arrived || lastAutoArrivalRef.current.has(stop.id)) continue;
            const stopLat = parseFloat(stop.latitude);
            const stopLng = parseFloat(stop.longitude);
            if (isNaN(stopLat) || isNaN(stopLng)) continue;
            const radius = stop.arrivalRadiusMeters || 50;
            const distance = haversineDistance(lat, lng, stopLat, stopLng);
            if (distance <= radius) {
              lastAutoArrivalRef.current.add(stop.id);
              api.trips.arriveAtStop({
                tripId: myTrip.trip?.id, stopId: stop.id,
                latitude: lat, longitude: lng,
              }).then(() => loadData()).catch(console.error);
            }
          }
        }
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => { if (watchId !== undefined) navigator.geolocation.clearWatch(watchId); };
  }, [myTrip?.trip?.id]);

  async function handleStartTrip(routeId: number) {
    if (!availableRoutes?.driver?.id || !availableRoutes?.vehicle?.id) {
      showInfoToast('Nenhum veículo atribuído. Contate o administrador.');
      return;
    }
    try {
      await api.trips.start({ routeId, driverId: availableRoutes.driver.id, vehicleId: availableRoutes.vehicle.id });
      loadData();
    } catch (e: any) { showErrorToast(e.message); }
  }

  const sl = (s: string) => ({ started: 'Em rota', completed: 'Concluída', cancelled: 'Cancelada', scheduled: 'Agendada' }[s] || s);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw size={32} className="text-primary-500 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isDriverOrMonitor ? 'Painel do Motorista/Monitor' : 'Monitoramento em Tempo Real'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isDriverOrMonitor ? 'Gerencie embarques e desembarques' : 'GPS e viagens ativas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border ${connected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {connected ? <><Wifi size={12} /> Online</> : <><WifiOff size={12} /> Offline</>}
          </div>
          <button onClick={loadData} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><RefreshCw size={14} /></button>
          {!isDriverOrMonitor && activeTrips.length > 0 && (
            <button onClick={async () => {
              if (!confirm('Finalizar TODAS as viagens ativas? (' + activeTrips.length + ' viagem(ns))')) return;
              try {
                const result = await api.trips.completeAll({ municipalityId });
                showSuccessToast('Finalizadas ' + (result as any).finalized + ' viagem(ns)');
                loadData();
              } catch (e: any) { showErrorToast(e.message); }
            }} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
              Finalizar Todas ({activeTrips.length})
            </button>
          )}
        </div>
      </div>

      {/* Motorista/Monitor com viagem ativa - Modo Checklist */}
      {isDriverOrMonitor && myTrip && view === 'checklist' && (
        <div>
          <div className="card mb-4 p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-3">
              <Bus size={24} />
              <div>
                <p className="font-bold">{myTrip.route?.name}</p>
                <p className="text-white/80 text-sm">{myTrip.vehicle?.plate} · {myTrip.completedStops}/{myTrip.totalStops} paradas</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                {wakeLockActive && <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1"><Smartphone size={10} /> Tela ativa</span>}
                <div className="w-12 h-12 rounded-full border-4 border-white/30 flex items-center justify-center">
                  <span className="text-lg font-bold">{Math.round((myTrip.completedStops / Math.max(myTrip.totalStops, 1)) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
          <StudentChecklist tripData={myTrip} onRefresh={loadData} />
        </div>
      )}

      {/* Motorista sem viagem ativa - Iniciar viagem */}
      {isDriverOrMonitor && !myTrip && (
        <div className="card p-6 text-center">
          <Bus size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-2">Nenhuma viagem ativa</h3>
          {availableRoutes?.routes?.length > 0 ? (
            <>
              <p className="text-gray-500 text-sm mb-4">Selecione uma rota para iniciar:</p>
              <div className="space-y-2 max-w-md mx-auto">
                {availableRoutes.routes.map((route: any) => (
                  <button key={route.id} onClick={() => handleStartTrip(route.id)}
                    className="w-full flex items-center gap-3 p-3 border rounded-xl hover:border-green-300 hover:bg-green-50 transition-all">
                    <Play size={18} className="text-green-500" />
                    <div className="text-left"><p className="font-medium">{route.name}</p><p className="text-xs text-gray-500">{route.shift === 'morning' ? 'Manhã' : route.shift === 'afternoon' ? 'Tarde' : route.shift === 'full_time' ? 'Integral' : 'Noite'} · {route.scheduledStartTime || ''}</p></div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma rota atribuída a você. Contate o administrador.</p>
          )}
        </div>
      )}

      {/* Visão de administrador */}
      {!isDriverOrMonitor && (
        <>
          <div className={`card p-4 ${isFullscreen ? 'fixed inset-0 z-40 rounded-none m-0' : 'mb-5'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Navigation size={16} className="text-primary-500" /> Mapa ao Vivo</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{busLocations.size > 0 ? busLocations.size + ' ônibus' : activeTrips.length + ' viagem(ns) ativa(s)'}</span>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg border hover:bg-gray-50 text-gray-500" title="Tela cheia">{isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
              </div>
            </div>
            <LiveMap trips={activeTrips} locations={busLocations} selectedTrip={selectedTrip} fullscreen={isFullscreen} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Bus size={16} /> Viagens ativas ({activeTrips.length})</h2>
              {!activeTrips.length ? (
                <div className="card text-center py-12"><Bus size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma viagem ativa</p></div>
              ) : (
                <div className="space-y-3">
                  {activeTrips.map((item: any) => {
                    const loc = busLocations.get(item.trip?.id);
                    return (
                      <div key={item.trip?.id} className="card cursor-pointer hover:border-gray-300 transition-all"
                        onClick={() => setSelectedTrip(selectedTrip?.trip?.id === item.trip?.id ? null : item)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100"><Bus size={18} className="text-green-600" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800">{item.route?.name || 'Sem rota'}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              {item.driverName && <span className="text-xs text-gray-500 flex items-center gap-1"><User size={10} />{item.driverName}</span>}
                              {item.trip?.startedAt && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} />{new Date(item.trip?.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                            </div>
                          </div>
                          {loc ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Navigation size={10} /> GPS ativo</span>
                            : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{sl(item.trip?.status)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Activity size={16} /> Eventos ao vivo</h2>
              <div className="card p-0 overflow-hidden">
                {!events.length ? (
                  <div className="p-6 text-center text-gray-400 text-sm"><Activity size={28} className="mx-auto mb-2 text-gray-200" /><p>Sem eventos recentes</p></div>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                    {events.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.type === 'board' ? 'bg-green-100' : ev.type === 'drop' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                          {ev.type === 'board' ? <CheckCircle size={14} className="text-green-600" /> : ev.type === 'drop' ? <UserX size={14} className="text-orange-600" /> : <MapPin size={14} className="text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700">{ev.type === 'board' ? 'Aluno embarcou' : ev.type === 'drop' ? 'Aluno desembarcou' : 'Chegou na parada'}</p>
                          <p className="text-xs text-gray-500 truncate">{ev.studentName || ev.stopName || '—'}</p>
                          <p className="text-xs text-gray-400">{new Date(ev.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
