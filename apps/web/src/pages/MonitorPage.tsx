import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, MapPin, Clock, User, Wifi, WifiOff } from 'lucide-react';

export default function MonitorPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [busLocations, setBusLocations] = useState<Map<number, any>>(new Map());
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
    socket.on('stop:arrived', () => refetch());
    return () => { socket.off('bus:location'); socket.off('stop:arrived'); };
  }, [socket, refetch]);

  const sl = (s: string) => ({ started:'Em rota', completed:'Concluída', cancelled:'Cancelada', scheduled:'Agendada' }[s]||s);
  const sc = (s: string) => ({ started:'badge-green', cancelled:'badge-red', scheduled:'badge-gray' }[s]||'badge-yellow');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Monitoramento em Tempo Real</h1><p className="text-gray-500">Viagens ativas agora</p></div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
          {connected ? <><Wifi size={16} className="text-green-500"/><span className="text-green-700">Conectado</span></> : <><WifiOff size={16} className="text-red-500"/><span className="text-red-700">Desconectado</span></>}
        </div>
      </div>
      <div className="card mb-6 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-green-100 to-teal-100 h-48 flex items-center justify-center border-b border-gray-200">
          <div className="text-center"><MapPin size={36} className="text-teal-500 mx-auto mb-2"/><p className="text-gray-600 font-medium">Mapa em tempo real</p><p className="text-sm text-gray-500">Configure VITE_GOOGLE_MAPS_KEY para ativar</p></div>
        </div>
      </div>
      <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Bus size={18}/> Viagens ativas ({(activeTrips as any)?.length ?? 0})</h2>
      {!(activeTrips as any)?.length ? (
        <div className="card text-center py-12"><Bus size={40} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">Nenhuma viagem ativa</p></div>
      ) : (
        <div className="grid gap-4">
          {(activeTrips as any)?.map((item: any) => {
            const loc = busLocations.get(item.trip.id);
            return (
              <div key={item.trip.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"><Bus size={18} className="text-primary-600"/></div>
                    <div><p className="font-semibold">{item.route?.name}</p><p className="text-sm text-gray-500 flex items-center gap-1"><User size={13}/>{item.driverName} · {item.vehicle?.plate}</p></div>
                  </div>
                  <span className={sc(item.trip.status)}>{sl(item.trip.status)}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center"><p className="text-xs text-gray-500">Parada</p><p className="font-semibold">{(item.trip.currentStopIndex||0)+1}ª</p></div>
                  <div className="text-center"><p className="text-xs text-gray-500">Alunos</p><p className="font-semibold">{item.trip.totalStudentsBoarded}/{item.trip.totalStudentsExpected}</p></div>
                  <div className="text-center"><p className="text-xs text-gray-500">GPS</p>{loc ? <p className="text-xs text-green-600 font-semibold">{Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}</p> : <p className="text-xs text-gray-400">Aguardando...</p>}</div>
                </div>
                {loc && <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Clock size={12}/>Atualizado {(loc.updatedAt as Date).toLocaleTimeString('pt-BR')}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
