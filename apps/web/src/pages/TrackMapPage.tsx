import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { useVehicleLocations } from '../lib/gps';
import { useSocket } from '../lib/socket';
import { Bus, MapPin, RefreshCw, Smartphone, Clock, Wifi, Maximize2, Minimize2, Navigation } from 'lucide-react';

export default function TrackMapPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || null;
  const { vehicles, loading, refresh } = useVehicleLocations(municipalityId, true, 15000);
  const { socket, connected: socketConnected } = useSocket();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Join municipality room and listen for real-time bus:location events
  useEffect(() => {
    if (!socket || !municipalityId) return;

    socket.emit('join:municipality', municipalityId);

    const handleBusLocation = (data: any) => {
      if (!mapInstanceRef.current || !mapLoaded) return;
      const L = (window as any).L;
      if (!L) return;

      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      // Update existing marker or create a temporary one
      // Try to find by tripId in the current markers (vehicleId may differ)
      // For now, update position if marker exists, it will be reconciled on next REST poll
      const existingMarkers = markersRef.current;
      let found = false;
      existingMarkers.forEach((marker, vehicleId) => {
        // Update closest marker within ~500m or matching tripId
        const markerLatLng = marker.getLatLng();
        const dist = Math.abs(markerLatLng.lat - lat) + Math.abs(markerLatLng.lng - lng);
        if (dist < 0.05) { // roughly within range
          marker.setLatLng([lat, lng]);
          found = true;
        }
      });

      // If data has vehicleId directly, use that
      if (data.vehicleId && existingMarkers.has(data.vehicleId)) {
        existingMarkers.get(data.vehicleId).setLatLng([lat, lng]);
        found = true;
      }

      // If no existing marker matched, create a temporary one (will be reconciled on next poll)
      if (!found && data.tripId) {
        const busIcon = L.icon({ iconUrl: '/bus-marker.svg', iconSize: [48, 48], iconAnchor: [24, 44], popupAnchor: [0, -44] });
        const marker = L.marker([lat, lng], { icon: busIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<div><b>Viagem #${data.tripId}</b><br><small>Velocidade: ${data.speed ? (data.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}</small></div>`);
        // Use negative tripId as temp key so it doesn't collide with vehicleId keys
        markersRef.current.set(-data.tripId, marker);
      }
    };

    socket.on('bus:location', handleBusLocation);

    return () => {
      socket.off('bus:location', handleBusLocation);
    };
  }, [socket, municipalityId, mapLoaded]);

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
    // CartoDB Voyager (modern, clean) as default + layer control
    const streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
    const terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
    const hybridLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
    const hybrid = L.layerGroup([L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 }), hybridLabels]);
    streets.addTo(map);
    L.control.layers({ 'Ruas': streets, 'Satélite': satellite, 'Híbrido': hybrid, 'Escuro': dark, 'Terreno': terrain }, {}, { position: 'topright', collapsed: true }).addTo(map);
    mapInstanceRef.current = map;
  }, [mapLoaded]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;
    const L = (window as any).L;
    if (!L) return;
    const map = mapInstanceRef.current;

    // Remove stale markers (vehicles that no longer exist)
    const currentIds = new Set(vehicles.map((v: any) => Number(v.vehicleId || v.id || 0)));
    markersRef.current.forEach((marker: any, key: number) => {
      if (!currentIds.has(key)) { map.removeLayer(marker); markersRef.current.delete(key); }
    });

    // Update or create markers
    const busIcon = L.icon({ iconUrl: '/bus-marker.svg', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36] });

    vehicles.forEach((vehicle: any) => {
      const lat = parseFloat(vehicle.latitude);
      const lng = parseFloat(vehicle.longitude);
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

      const key = Number(vehicle.vehicleId || vehicle.id || 0);

      if (markersRef.current.has(key)) {
        const marker = markersRef.current.get(key);
        marker.setLatLng([lat, lng]);
        marker.setPopupContent(`
          <div style="min-width:180px;font-family:Arial,sans-serif">
            <b style="color:#1B3A5C">${vehicle.plate || 'Veículo'}</b><br>
            <small>Motorista: ${vehicle.driverName || 'N/A'}</small><br>
            <small>Rota: ${vehicle.routeName || 'N/A'}</small><br>
            <small>Velocidade: ${vehicle.speed ? (vehicle.speed * 3.6).toFixed(0) + ' km/h' : 'N/A'}</small><br>
            <small>Atualizado: ${vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleTimeString('pt-BR') : 'agora'}</small>
          </div>
        `);
      } else {
        const marker = L.marker([lat, lng], { icon: busIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px;font-family:Arial,sans-serif">
              <b style="color:#1B3A5C">${vehicle.plate || 'Veículo'}</b><br>
              <small>Motorista: ${vehicle.driverName || 'N/A'}</small><br>
              <small>Rota: ${vehicle.routeName || 'N/A'}</small><br>
              <small>Velocidade: ${vehicle.speed ? (vehicle.speed * 3.6).toFixed(0) + ' km/h' : 'N/A'}</small><br>
              <small>Atualizado: ${vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleTimeString('pt-BR') : 'agora'}</small>
            </div>
          `);
        marker.on('click', () => setSelectedVehicle(vehicle));
        markersRef.current.set(key, marker);
      }
    });

    // Fit bounds only on FIRST load (not every update)
    if (vehicles.length > 0 && markersRef.current.size <= vehicles.length) {
      const validVehicles = vehicles.filter((v: any) => {
        const la = parseFloat(v.latitude), lo = parseFloat(v.longitude);
        return !isNaN(la) && !isNaN(lo) && la !== 0 && lo !== 0;
      });
      if (validVehicles.length > 0 && !map._hasFitBounds) {
        const bounds = validVehicles.map((v: any) => [parseFloat(v.latitude), parseFloat(v.longitude)]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        map._hasFitBounds = true;
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
          <button onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              const map = mapInstanceRef.current;
              if (map) {
                const L = (window as any).L;
                map.setView([pos.coords.latitude, pos.coords.longitude], 15);
                // Add/update my location marker
                if ((map as any)._myMarker) { (map as any)._myMarker.setLatLng([pos.coords.latitude, pos.coords.longitude]); }
                else {
                  const myIcon = L.divIcon({ html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.5)"></div>', iconSize: [16, 16], iconAnchor: [8, 8], className: '' });
                  (map as any)._myMarker = L.marker([pos.coords.latitude, pos.coords.longitude], { icon: myIcon }).addTo(map).bindPopup('Minha localização');
                }
              }
            }, () => {}, { enableHighAccuracy: true });
          }} className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Navigation size={16} /> Minha Localização
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
              <p className="text-2xl font-bold text-blue-600">{socketConnected ? 'WS' : 'GPS'}</p>
              <p className="text-xs text-gray-500">{socketConnected ? 'Tempo real ativo' : 'Rastreamento ativo'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{socketConnected ? '~1s' : '15s'}</p>
              <p className="text-xs text-gray-500">{socketConnected ? 'Tempo real (Socket.IO)' : 'Intervalo de atualizacao'}</p>
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
