import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useGPSTracking, isGPSSupported, requestGPSPermission } from '../lib/gps';
import { useWakeLock } from '../lib/pwa';
import { MapPin, CheckCircle, XCircle, AlertTriangle, Smartphone, Plug, Navigation, RefreshCw, Play, Square, Bus } from 'lucide-react';

function TrackingMap({ position, stops }: { position: any; stops?: any[] }) {
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
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
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

    const icon = L.divIcon({
      html: `<div style="background:#f97316;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);animation:pulse 2s infinite">BUS</div>
      <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style>`,
      className: '', iconSize: [40, 40], iconAnchor: [20, 20]
    });

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
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-gray-200">
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
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [sendCount, setSendCount] = useState(0);
  const { isActive: wakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  const { position, error: gpsError, isTracking, startTracking, stopTracking } = useGPSTracking({
    tripId: activeTrip?.trip?.id || activeTrip?.id,
    driverId: driverId || undefined,
    intervalMs: 10000,
    enabled: !!activeTrip && !!driverId,
  });

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
      const trip = await api.monitors.myActiveTrip();
      setActiveTrip(trip);
      if (trip?.driverId) setDriverId(trip.driverId);
    } catch (err) { console.log('Nenhuma viagem ativa'); }
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
            <h1 className="text-2xl font-bold text-gray-900">Rastreamento GPS</h1>
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
      <TrackingMap position={position} stops={tripStops} />

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
