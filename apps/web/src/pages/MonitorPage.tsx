import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, MapPin, Clock, User, Wifi, WifiOff, Navigation, AlertCircle, CheckCircle, Activity, ChevronRight } from 'lucide-react';

function LiveMap({ trips, locations }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      const L = (window as any).L;
      const map = L.map(mapRef.current).setView([-15.78, -47.93], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L) return;
    locations.forEach((loc: any, tripId: number) => {
      const busIcon = L.divIcon({
        html: `<div style="background:#f97316;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🚌</div>`,
        className: '', iconSize: [36, 36], iconAnchor: [18, 18]
      });
      if (markersRef.current.has(tripId)) {
        markersRef.current.get(tripId).setLatLng([loc.lat, loc.lng]);
      } else {
        const trip = trips?.find((t: any) => t.trip.id === tripId);
        const marker = L.marker([loc.lat, loc.lng], { icon: busIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>🚌 ${trip?.route?.name || 'Ônibus'}</b><br>Vel: ${loc.speed || 0} km/h<br>${new Date(loc.updatedAt).toLocaleTimeString('pt-BR')}`);
        markersRef.current.set(tripId, marker);
        mapInstanceRef.current.setView([loc.lat, loc.lng], 14);
      }
    });
  }, [locations, trips]);

  return (
    <div className="relative w-full h-96 rounded-xl overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full" />
      {locations.size === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90">
          <div className="text-center">
            <Navigation size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aguardando posições GPS dos ônibus...</p>
            <p className="text-xs text-gray-400 mt-1">Os ônibus aparecerão no mapa quando iniciarem viagem</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MonitorPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [busLocations, setBusLocations] = useState<Map<number, any>>(new Map());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const municipalityId = user?.municipalityId || 0;
  const { data: activeTrips, refetch } = useQuery(() => api.trips.listActive({ municipalityId }), [municipalityId]);

  useEffect(() => {
    if (socket && municipalityId) socket.emit('join:municipality', municipalityId);
  }, [socket, municipalityId]);

  useEffect(() => {
    if (!socket) return;
    socket.on('bus:location', (data: any) => {
      setBusLocations(prev => { const n = new Map(prev); n.set(data.tripId, { ...data, updatedAt: new Date() }); return n; });
    });
    socket.on('stop:arrived', (data: any) => {
      setEvents(prev => [{ ...data, type: 'stop', time: new Date() }, ...prev.slice(0, 19)]);
      refetch();
    });
    socket.on('student:boarded', (data: any) => {
      setEvents(prev => [{ ...data, type: 'board', time: new Date() }, ...prev.slice(0, 19)]);
    });
    return () => { socket.off('bus:location'); socket.off('stop:arrived'); socket.off('student:boarded'); };
  }, [socket, refetch]);

  const sl = (s: string) => ({ started:'Em rota', completed:'Concluída', cancelled:'Cancelada', scheduled:'Agendada' }[s]||s);
  const trips = (activeTrips as any) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-gray-900">Monitoramento em Tempo Real</h1><p className="text-gray-500">GPS e viagens ativas agora</p></div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${connected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {connected ? <><Wifi size={15}/> Conectado</> : <><WifiOff size={15}/> Desconectado</>}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
            <Activity size={15}/> {trips.filter((t: any) => t.trip.status === 'started').length} em rota
          </div>
        </div>
      </div>

      {/* Mapa GPS ao vivo */}
      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Navigation size={16} className="text-primary-500"/> Mapa ao Vivo</h2>
          <span className="text-xs text-gray-400">{busLocations.size} ônibus com GPS ativo</span>
        </div>
        <LiveMap trips={trips} locations={busLocations} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Lista de viagens */}
        <div className="col-span-2">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Bus size={16}/> Viagens ativas ({trips.length})</h2>
          {!trips.length ? (
            <div className="card text-center py-12"><Bus size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500">Nenhuma viagem ativa no momento</p></div>
          ) : (
            <div className="space-y-3">
              {trips.map((item: any) => {
                const loc = busLocations.get(item.trip.id);
                const isSelected = selectedTrip?.trip.id === item.trip.id;
                return (
                  <div key={item.trip.id} onClick={() => setSelectedTrip(isSelected ? null : item)}
                    className={`card cursor-pointer transition-all ${isSelected ? 'border-primary-300 bg-primary-50/30' : 'hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.trip.status === 'started' ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Bus size={18} className={item.trip.status === 'started' ? 'text-green-600' : 'text-gray-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">{item.route?.name || 'Sem rota'}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {item.driver && <span className="text-xs text-gray-500 flex items-center gap-1"><User size={10}/> {item.driver.name}</span>}
                          {item.vehicle && <span className="text-xs text-gray-500 flex items-center gap-1"><Bus size={10}/> {item.vehicle.plate}</span>}
                          {item.trip.startedAt && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> {new Date(item.trip.startedAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {loc ? (
                          <div className="text-right">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Navigation size={10}/> GPS ativo</span>
                            {loc.speed !== undefined && <p className="text-xs text-gray-400 mt-0.5">{loc.speed} km/h</p>}
                          </div>
                        ) : (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${item.trip.status === 'started' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{sl(item.trip.status)}</span>
                        )}
                        <ChevronRight size={14} className={isSelected ? 'text-primary-500 rotate-90' : 'text-gray-300'} />
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Alunos</p><p className="font-bold text-gray-800">{item.students?.length || 0}</p></div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Paradas</p><p className="font-bold text-gray-800">{item.stops?.length || 0}</p></div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Status</p><p className="font-bold text-gray-800 text-xs">{sl(item.trip.status)}</p></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feed de eventos */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Activity size={16}/> Eventos ao vivo</h2>
          <div className="card p-0 overflow-hidden">
            {!events.length ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <Activity size={28} className="mx-auto mb-2 text-gray-200"/>
                <p>Sem eventos recentes</p>
                <p className="text-xs mt-1">Embarques e paradas aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.type === 'board' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {ev.type === 'board' ? <CheckCircle size={14} className="text-green-600"/> : <MapPin size={14} className="text-blue-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">{ev.type === 'board' ? 'Aluno embarcou' : 'Parada chegou'}</p>
                      <p className="text-xs text-gray-500 truncate">{ev.studentName || ev.stopName || '—'}</p>
                      <p className="text-xs text-gray-400">{new Date(ev.time).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 flex items-center gap-1"><AlertCircle size={10}/> Atualização em tempo real via Socket.IO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
