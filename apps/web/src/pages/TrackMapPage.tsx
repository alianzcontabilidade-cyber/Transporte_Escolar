import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useVehicleLocations } from '../lib/gps';
import { Bus, MapPin, RefreshCw, Smartphone, Clock, Wifi, Maximize2, Minimize2 } from 'lucide-react';

export default function TrackMapPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || null;
  const { vehicles, loading, refresh } = useVehicleLocations(municipalityId, true, 10000);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    if (document.getElementById('leaflet-css')) {
      setMapLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([-14.235, -51.9253], 5); // Brazil center
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapInstanceRef.current = map;
  }, [mapLoaded]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const L = (window as any).L;
    if (!L) return;
    const map = mapInstanceRef.current;

    // Update or create markers
    vehicles.forEach((vehicle: any) => {
      const lat = parseFloat(vehicle.latitude);
      const lng = parseFloat(vehicle.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const busIcon = L.icon({ iconUrl: '/bus-marker.svg', iconSize: [48, 48], iconAnchor: [24, 44], popupAnchor: [0, -44] });

      if (markersRef.current.has(vehicle.vehicleId)) {
        // Update position
        const marker = markersRef.current.get(vehicle.vehicleId);
        marker.setLatLng([lat, lng]);
      } else {
        // Create new marker
        const marker = L.marker([lat, lng], { icon: busIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:200px">
              <b>${vehicle.plate || 'Veiculo #' + vehicle.vehicleId}</b><br>
              <small>Motorista: ${vehicle.driverName || 'N/A'}</small><br>
              <small>Rota: ${vehicle.routeName || 'N/A'}</small><br>
              <small>Velocidade: ${vehicle.speed ? (vehicle.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}</small><br>
              <small>Atualizado: ${vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleTimeString() : 'N/A'}</small>
            </div>
          `);
        marker.on('click', () => setSelectedVehicle(vehicle));
        markersRef.current.set(vehicle.vehicleId, marker);
      }
    });

    // Fit bounds if we have vehicles
    if (vehicles.length > 0) {
      const validVehicles = vehicles.filter((v: any) => !isNaN(parseFloat(v.latitude)) && !isNaN(parseFloat(v.longitude)));
      if (validVehicles.length > 0) {
        const bounds = validVehicles.map((v: any) => [parseFloat(v.latitude), parseFloat(v.longitude)]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [vehicles, mapLoaded]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <MapPin size={24} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa em Tempo Real</h1>
            <p className="text-gray-500">Acompanhe a localiza&ccedil;&atilde;o dos &ocirc;nibus escolares</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />} {isFullscreen ? 'Sair' : 'Tela cheia'}
          </button>
          <button onClick={refresh} className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors flex items-center gap-2">
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Bus size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{vehicles.length}</p>
              <p className="text-xs text-gray-500">Veiculos em rota</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wifi size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">GPS</p>
              <p className="text-xs text-gray-500">Rastreamento ativo</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">10s</p>
              <p className="text-xs text-gray-500">Intervalo de atualizacao</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div ref={mapRef} style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '500px', width: '100%' }} className="z-0" />
        {loading && !vehicles.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}
        {!loading && vehicles.length === 0 && (
          <div className="p-8 text-center">
            <Bus size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mt-2">Nenhum veiculo em rota no momento.</p>
            <p className="text-gray-400 text-sm">Quando os motoristas iniciarem viagens, os onibus aparecerao no mapa.</p>
          </div>
        )}
      </div>

      {/* Vehicle List */}
      {vehicles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Veiculos em Rota</h2>
          <div className="space-y-3">
            {vehicles.map((v: any) => (
              <div key={v.vehicleId}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedVehicle?.vehicleId === v.vehicleId ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => {
                  setSelectedVehicle(v);
                  const lat = parseFloat(v.latitude);
                  const lng = parseFloat(v.longitude);
                  if (mapInstanceRef.current && !isNaN(lat) && !isNaN(lng)) {
                    mapInstanceRef.current.setView([lat, lng], 16);
                    const marker = markersRef.current.get(v.vehicleId);
                    if (marker) marker.openPopup();
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bus size={24} className="text-orange-500" />
                    <div>
                      <p className="font-semibold">{v.plate || 'Veiculo #' + v.vehicleId}</p>
                      <p className="text-sm text-gray-500">Motorista: {v.driverName || 'N/A'} | Rota: {v.routeName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-green-600">
                      {v.speed ? (v.speed * 3.6).toFixed(1) + ' km/h' : 'Parado'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {v.updatedAt ? new Date(v.updatedAt).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
