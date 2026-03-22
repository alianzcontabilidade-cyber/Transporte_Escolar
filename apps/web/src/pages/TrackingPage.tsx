import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useGPSTracking, isGPSSupported, requestGPSPermission } from '../lib/gps';
import { useSocket } from '../lib/socket';
import { useWakeLock } from '../lib/pwa';
import { MapPin, CheckCircle, XCircle, AlertTriangle, Smartphone, Plug, Navigation, RefreshCw, Play, Square, Bus, Maximize2, Minimize2, Zap } from 'lucide-react';
import { isNative, platform } from '../lib/native';

function TrackingMap({ position, stops, fullscreen }: { position: any; stops?: any[]; fullscreen?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const L = (window as any).L;
      const center = position ? [position.latitude, position.longitude] : [-14.235, -51.925];
      const map = L.map(mapRef.current!).setView(center, position ? 15 : 5);
      const streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
      const terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      streets.addTo(map);
      L.control.layers({ 'Ruas': streets, 'Satélite': satellite, 'Escuro': dark, 'Terreno': terrain }, {}, { position: 'topright', collapsed: true }).addTo(map);
      mapInstanceRef.current = map;

      // Add stop markers if available
      if (stops) {
        stops.forEach((s: any, i: number) => {
          if (s.latitude && s.longitude) {
            const icon = L.divIcon({
              html: `<div style="background:#6366f1;color:white;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${i + 1}</div>`,
              className: '', iconSize: [22, 22], iconAnchor: [11, 11]
            });
            L.marker([parseFloat(s.latitude), parseFloat(s.longitude)], { icon })
              .addTo(map).bindPopup(`<b>${s.name}</b>`);
          }
        });
      }
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  // Update bus marker when position changes
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L || !position) return;

    const icon = L.icon({ iconUrl: '/bus-marker.svg', iconSize: [48, 48], iconAnchor: [24, 44], popupAnchor: [0, -44] });

    if (markerRef.current) {
      markerRef.current.setLatLng([position.latitude, position.longitude]);
    } else {
      markerRef.current = L.marker([position.latitude, position.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>Minha posição</b><br>Velocidade: ${position.speed ? (position.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}`);
      mapInstanceRef.current.setView([position.latitude, position.longitude], 15);
    }
  }, [position]);

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-gray-200 ${fullscreen ? 'h-[calc(100vh-200px)]' : 'h-80'}`}>
      <div ref={mapRef} className="w-full h-full" />
      {!position && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90">
          <div className="text-center">
            <Navigation size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Aguardando posição GPS...</p>
            <p className="text-xs text-gray-400 mt-1">Ative o rastreamento para ver sua posição no mapa</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [sendCount, setSendCount] = useState(0);
  const { isActive: wakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  const { position, error: gpsError, isTracking, startTracking, stopTracking } = useGPSTracking({
    tripId: activeTrip?.trip?.id || activeTrip?.id,
    driverId: driverId || undefined,
    municipalityId: user?.municipalityId || undefined,
    intervalMs: 10000,
    enabled: !!activeTrip && !!driverId,
  });

  // Join municipality room for real-time updates
  useEffect(() => {
    if (socket && user?.municipalityId) {
      socket.emit('join:municipality', user.municipalityId);
    }
  }, [socket, user?.municipalityId]);

  useEffect(() => {
    checkGPSPermission();
    loadActiveTrip();
  }, []);

  async function checkGPSPermission() {
    if (!isGPSSupported()) { setPermissionStatus('unsupported'); return; }
    const status = await requestGPSPermission();
    setPermissionStatus(status);
  }

  async function loadActiveTrip() {
    try {
      setLoading(true);
      // Try as driver first
      const trip = await api.monitors.myActiveTrip();
      if (trip) {
        setActiveTrip(trip);
        if (trip.driverId) setDriverId(trip.driverId);
        return;
      }
      // Fallback for admins: get first active trip
      if (user?.municipalityId) {
        const activeTrips = await api.trips.listActive({ municipalityId: user.municipalityId });
        if (activeTrips && activeTrips.length > 0) {
          const first = activeTrips[0];
          // Load full trip data
          try {
            const fullTrip = await api.trips.getById({ id: first.trip?.id });
            setActiveTrip(fullTrip);
            if (fullTrip?.driver?.id) setDriverId(fullTrip.driver.id);
          } catch {
            setActiveTrip({ trip: first.trip, route: first.route, stops: [], driverId: first.driver?.id });
          }
        }
      }
    } catch (err) {  }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (isTracking) requestWakeLock();
    else releaseWakeLock();
    return () => releaseWakeLock();
  }, [isTracking]);

  useEffect(() => {
    if (position && isTracking) setSendCount(c => c + 1);
  }, [position, isTracking]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500" /></div>;
  }

  const routeName = activeTrip?.route?.name || activeTrip?.routeName || '';
  const tripStops = activeTrip?.stops || [];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Navigation size={20} className="text-blue-600" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Rastreamento GPS</h1>
              {isNative && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full">
                  <Zap size={10} /> {platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : 'Nativo'}
                </span>
              )}
            </div>
            <p className="text-gray-500">Compartilhe sua localização em tempo real</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isTracking ? (
            <button onClick={startTracking} disabled={!isGPSSupported() || permissionStatus === 'denied'}
              className="btn-primary flex items-center gap-2"><Play size={16} /> Iniciar</button>
          ) : (
            <button onClick={stopTracking} className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2"><Square size={16} /> Parar</button>
          )}
          <button onClick={loadActiveTrip} className="btn-secondary flex items-center gap-2"><RefreshCw size={16} /> Atualizar</button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="btn-secondary flex items-center gap-2">{isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />} {isFullscreen ? 'Sair' : 'Ampliar'}</button>
        </div>
      </div>

      {/* Trip Info */}
      {activeTrip && (
        <div className="card bg-blue-50 border-blue-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Bus size={22} className="text-blue-600" /></div>
          <div className="flex-1">
            <p className="font-semibold text-blue-800">{routeName || 'Viagem ativa'}</p>
            <p className="text-sm text-blue-600">{tripStops.length} parada(s) na rota</p>
          </div>
          {isTracking && <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" /><span className="text-sm text-green-700 font-medium">Transmitindo</span></div>}
        </div>
      )}

      {!activeTrip && (
        <div className="card bg-yellow-50 border-yellow-200 flex items-center gap-3">
          <AlertTriangle size={20} className="text-yellow-600" />
          <div><p className="font-medium text-yellow-800">Nenhuma viagem ativa</p><p className="text-sm text-yellow-600">Inicie uma viagem na página de Rotas para ativar o rastreamento automático.</p></div>
        </div>
      )}

      {/* Map */}
      <TrackingMap position={position} stops={tripStops} fullscreen={isFullscreen} />

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`card p-4 text-center ${isGPSSupported() ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {isGPSSupported() ? <CheckCircle size={20} className="text-green-500 mx-auto mb-1" /> : <XCircle size={20} className="text-red-500 mx-auto mb-1" />}
          <p className="text-xs font-medium">GPS</p>
          <p className="text-[10px] text-gray-500">{isGPSSupported() ? 'Disponível' : 'Indisponível'}</p>
        </div>
        <div className={`card p-4 text-center ${permissionStatus === 'granted' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          {permissionStatus === 'granted' ? <CheckCircle size={20} className="text-green-500 mx-auto mb-1" /> : <AlertTriangle size={20} className="text-yellow-500 mx-auto mb-1" />}
          <p className="text-xs font-medium">Permissão</p>
          <p className="text-[10px] text-gray-500">{permissionStatus === 'granted' ? 'Concedida' : 'Pendente'}</p>
        </div>
        <div className={`card p-4 text-center ${isTracking ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
          <Navigation size={20} className={`mx-auto mb-1 ${isTracking ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
          <p className="text-xs font-medium">Tracking</p>
          <p className="text-[10px] text-gray-500">{isTracking ? 'Ativo' : 'Inativo'}</p>
        </div>
        <div className={`card p-4 text-center ${wakeLockActive ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
          <Smartphone size={20} className={`mx-auto mb-1 ${wakeLockActive ? 'text-green-500' : 'text-gray-400'}`} />
          <p className="text-xs font-medium">Tela</p>
          <p className="text-[10px] text-gray-500">{wakeLockActive ? 'Ativa' : 'Normal'}</p>
        </div>
        <div className="card p-4 text-center bg-blue-50 border-blue-200">
          <p className="text-xl font-bold text-blue-600">{sendCount}</p>
          <p className="text-xs font-medium">Envios</p>
          <p className="text-[10px] text-gray-500">posições GPS</p>
        </div>
      </div>

      {/* Position Details */}
      {position && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={16} /> Posição Atual</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Latitude</p><p className="font-mono text-sm font-semibold">{position.latitude.toFixed(6)}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Longitude</p><p className="font-mono text-sm font-semibold">{position.longitude.toFixed(6)}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Velocidade</p><p className="font-mono text-sm font-semibold">{position.speed ? (position.speed * 3.6).toFixed(1) + ' km/h' : '0 km/h'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Precisão</p><p className="font-mono text-sm font-semibold">{position.accuracy ? position.accuracy.toFixed(0) + ' m' : 'N/A'}</p></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Última atualização: {new Date(position.timestamp).toLocaleTimeString('pt-BR')}</p>
        </div>
      )}

      {gpsError && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700 text-sm flex items-center gap-2"><XCircle size={16} /> {gpsError}</p>
        </div>
      )}
    </div>
  );
}
