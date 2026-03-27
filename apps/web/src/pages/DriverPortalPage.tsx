import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { useGPSTracking, isGPSSupported } from '../lib/gps';
import { useSocket } from '../lib/socket';
import {
  Navigation, Play, Square, Users, Route, Clock, Bus, Fuel,
  MessageCircle, MapPin, CheckCircle, XCircle, ChevronRight,
  AlertTriangle, User, Phone, ArrowLeft, Calendar, Gauge,
  FileText, Timer, Circle, Loader2, LogOut
} from 'lucide-react';

type View = 'home' | 'trip' | 'students' | 'route' | 'history' | 'vehicle' | 'fuel' | 'chat';

export default function DriverPortalPage() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [view, setView] = useState<View>('home');
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');
  const [loading, setLoading] = useState(true);
  const [gpsActive, setGpsActive] = useState(false);

  // GPS tracking
  const { position, isTracking, startTracking, stopTracking } = useGPSTracking({
    tripId: activeTrip?.trip?.id || activeTrip?.id,
    driverId: driverId || undefined,
    municipalityId: user?.municipalityId || undefined,
    intervalMs: 10000,
    enabled: !!activeTrip && !!driverId,
  });

  useEffect(() => {
    if (socket && user?.municipalityId) {
      socket.emit('join:municipality', user.municipalityId);
    }
  }, [socket, user?.municipalityId]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    setGpsActive(isTracking && !!position);
  }, [isTracking, position]);

  // Elapsed timer
  useEffect(() => {
    if (!tripStartTime || isNaN(tripStartTime.getTime())) return;
    const iv = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - tripStartTime.getTime()) / 1000));
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [tripStartTime]);

  async function loadData() {
    try {
      setLoading(true);
      // Verificar se tem viagem ativa
      const trip = await api.monitors.myActiveTrip();
      if (trip) {
        setActiveTrip(trip);
        if (trip.driverId) setDriverId(trip.driverId);
        if (trip.trip?.startedAt) setTripStartTime(new Date(trip.trip.startedAt));
      } else {
        // Sem viagem ativa - buscar rotas disponíveis do motorista
        try {
          const available = await api.monitors.availableTrips();
          if (available?.driver?.id) setDriverId(available.driver.id);
          if (available?.routes?.length > 0) {
            const route = available.routes[0];
            // Carregar paradas e alunos da rota
            let routeStops: any[] = [];
            try {
              const stopsData = await api.ai.routeStudents({ routeId: route.id });
              if (stopsData?.stops) {
                routeStops = stopsData.stops.map((s: any) => ({
                  ...s,
                  students: (stopsData.students || []).filter((st: any) => st.stopId === s.id).map((st: any) => ({ ...st, status: 'pending' })),
                }));
              }
            } catch {}
            setActiveTrip({
              route,
              vehicle: available.vehicle,
              driverId: available.driver.id,
              stops: routeStops,
            });
          }
        } catch {}
      }
    } catch { }
    finally { setLoading(false); }
  }

  // Abrir navegação Google Maps com GPS atual como origem
  function openRouteNavigation(currentStops?: any[]) {
    const stopsToUse = currentStops || stops;
    const validStops = stopsToUse.filter((s: any) => s.latitude && s.longitude && parseFloat(String(s.latitude)) !== 0);
    if (validStops.length === 0) return;

    // Capturar GPS atual do motorista
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
          const dest = validStops[validStops.length - 1];
          const destStr = `${parseFloat(String(dest.latitude)).toFixed(6)},${parseFloat(String(dest.longitude)).toFixed(6)}`;
          const waypoints = validStops.slice(0, -1).map((s: any) => `${parseFloat(String(s.latitude)).toFixed(6)},${parseFloat(String(s.longitude)).toFixed(6)}`).join('|');
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destStr}${waypoints ? '&waypoints=' + waypoints : ''}&travelmode=driving`;
          window.open(url, '_blank');
        },
        () => {
          // GPS falhou - usar primeira parada como origem
          const origin = validStops[0];
          const dest = validStops[validStops.length - 1];
          const originStr = `${parseFloat(String(origin.latitude)).toFixed(6)},${parseFloat(String(origin.longitude)).toFixed(6)}`;
          const destStr = `${parseFloat(String(dest.latitude)).toFixed(6)},${parseFloat(String(dest.longitude)).toFixed(6)}`;
          const waypoints = validStops.slice(1, -1).map((s: any) => `${parseFloat(String(s.latitude)).toFixed(6)},${parseFloat(String(s.longitude)).toFixed(6)}`).join('|');
          const url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}${waypoints ? '&waypoints=' + waypoints : ''}&travelmode=driving`;
          window.open(url, '_blank');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }

  // Start trip
  const startTripMut = useMutation(api.trips.start);
  async function handleStartTrip() {
    if (!activeTrip?.route?.id) return;
    const vId = activeTrip.vehicle?.id || activeTrip.vehicleId;
    const currentStops = activeTrip?.stops || stops;
    await startTripMut.mutate(
      { routeId: activeTrip.route.id, driverId: driverId || 0, vehicleId: vId || 0, municipalityId: user?.municipalityId || 1 },
      {
        onSuccess: () => {
          setTripStartTime(new Date());
          startTracking();
          loadData();
          // Abrir navegação automaticamente ao iniciar viagem
          if (currentStops.length > 0) {
            setTimeout(() => openRouteNavigation(currentStops), 1500);
          }
        }
      }
    );
  }

  // Cancel trip
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const cancelTripMut = useMutation(api.trips.cancelTrip);
  async function handleCancelTrip() {
    const tripId = activeTrip?.trip?.id || activeTrip?.id;
    if (!tripId || !cancelReason) return;
    await cancelTripMut.mutate(
      { tripId, reason: cancelReason, status: 'cancelled' as any },
      {
        onSuccess: () => {
          try { stopTracking(); } catch {}
          setActiveTrip(null); setTripStartTime(null); setElapsed('00:00:00'); setGpsActive(false);
          setShowCancelModal(false); setCancelReason('');
          loadData();
        },
        onError: (err: string) => { console.error('Erro ao cancelar:', err); }
      }
    );
  }

  // Complete trip
  const completeTripMut = useMutation(api.trips.complete);
  async function handleCompleteTrip() {
    const tripId = activeTrip?.trip?.id || activeTrip?.id;
    if (!tripId) return;
    try {
      await api.trips.complete({ tripId });
      try { stopTracking(); } catch {}
      setTripStartTime(null);
      setElapsed('00:00:00');
      setGpsActive(false);
      // Aguardar antes de recarregar para evitar problemas de timing
      setTimeout(() => {
        setActiveTrip(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao finalizar:', err?.message);
    }
  }

  // Board student
  const boardMut = useMutation(api.monitors.boardStudent);
  // Drop student
  const dropMut = useMutation(api.monitors.dropStudent);
  // Mark absent
  const absentMut = useMutation(api.monitors.markAbsent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={40} className="animate-spin text-accent-500" />
      </div>
    );
  }

  const routeName = activeTrip?.route?.name || activeTrip?.routeName || 'Sem rota';
  const vehiclePlate = activeTrip?.vehicle?.plate || '---';
  const stops = activeTrip?.stops || [];
  const hasTripActive = !!activeTrip?.trip?.id;

  // ==================== VIEWS ====================

  if (view !== 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setView('home')} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {view === 'trip' && 'Viagem Ativa'}
            {view === 'students' && 'Alunos da Rota'}
            {view === 'route' && 'Paradas da Rota'}
            {view === 'history' && 'Historico de Viagens'}
            {view === 'vehicle' && 'Meu Veículo'}
            {view === 'fuel' && 'Abastecimento'}
            {view === 'chat' && 'Mensagens'}
          </h2>
        </div>

        <div className="p-4 pb-24">
          {view === 'trip' && <TripView activeTrip={activeTrip} stops={stops} elapsed={elapsed} position={position}
            onBoard={(sId: number, tId: number) => boardMut.mutate({ studentId: sId, tripId: tId }, { onSuccess: loadData })}
            onDrop={(sId: number, tId: number) => dropMut.mutate({ studentId: sId, tripId: tId }, { onSuccess: loadData })}
            onAbsent={(sId: number, tId: number) => absentMut.mutate({ studentId: sId, tripId: tId }, { onSuccess: loadData })}
          />}
          {view === 'students' && <StudentsView stops={stops} />}
          {view === 'route' && <RouteView stops={stops} />}
          {view === 'history' && <HistoryView municipalityId={user?.municipalityId} />}
          {view === 'vehicle' && <VehicleView vehicle={activeTrip?.vehicle} />}
          {view === 'fuel' && <FuelView municipalityId={user?.municipalityId} vehicleId={activeTrip?.vehicle?.id} onRefresh={loadData} />}
          {view === 'chat' && <ChatView />}
        </div>
      </div>
    );
  }

  // ==================== HOME ====================
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-5 pt-8 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-200 text-sm">Bem-vindo de volta</p>
            <h1 className="text-2xl font-bold">Ola, {user?.name?.split(' ')[0]}!</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${gpsActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
              <div className={`w-2 h-2 rounded-full ${gpsActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              GPS {gpsActive ? 'Ativo' : 'Inativo'}
            </div>
            <button onClick={() => { logout(); window.location.href = '/login'; }} className="p-2 text-white/60 hover:text-red-300 hover:bg-white/10 rounded-lg" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Route + Vehicle card */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Bus size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{routeName}</p>
              <p className="text-sm text-primary-200">Placa: {vehiclePlate} | {stops.length} parada(s)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {/* Start/Stop Trip Button */}
        {!hasTripActive ? (
          <button
            onClick={handleStartTrip}
            disabled={startTripMut.loading || !activeTrip?.route?.id}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {startTripMut.loading ? <Loader2 size={24} className="animate-spin" /> : <Play size={24} />}
            INICIAR VIAGEM
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Timer size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tempo de viagem</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono">{elapsed}</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCompleteTrip}
                disabled={completeTripMut.loading}
                className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {completeTripMut.loading ? <Loader2 size={20} className="animate-spin" /> : <Square size={20} />}
                FINALIZAR
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm px-4 py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <AlertTriangle size={18} />
                CANCELAR
              </button>
            </div>
          </div>
        )}

        {/* Botão Navegar - abre Google Maps com GPS atual como origem */}
        {stops.length > 0 && (
          <button onClick={() => openRouteNavigation()}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base py-4 rounded-2xl shadow-md flex items-center justify-center gap-3 transition-all">
            <Navigation size={22} />
            NAVEGAR PELA ROTA
          </button>
        )}

        {/* Module Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'students' as View, icon: Users, label: 'Alunos', color: 'bg-blue-500' },
            { key: 'route' as View, icon: Route, label: 'Rota', color: 'bg-purple-500' },
            { key: 'history' as View, icon: Clock, label: 'Historico', color: 'bg-amber-500' },
            { key: 'vehicle' as View, icon: Bus, label: 'Veículo', color: 'bg-teal-500' },
            { key: 'fuel' as View, icon: Fuel, label: 'Abastecimento', color: 'bg-orange-500' },
            { key: 'chat' as View, icon: MessageCircle, label: 'Chat', color: 'bg-indigo-500' },
          ].map(mod => (
            <button
              key={mod.key}
              onClick={() => setView(mod.key)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 ${mod.color} rounded-xl flex items-center justify-center`}>
                <mod.icon size={22} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{mod.label}</span>
            </button>
          ))}
        </div>

        {/* Active trip quick access */}
        {hasTripActive && (
          <button onClick={() => setView('trip')} className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-center gap-3 active:bg-blue-100 transition-colors">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Navigation size={22} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-blue-800">Viagem em Andamento</p>
              <p className="text-sm text-blue-600">Toque para ver detalhes e registrar embarques</p>
            </div>
            <ChevronRight size={20} className="text-blue-400" />
          </button>
        )}
      </div>

      {/* Modal Cancelar Viagem */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-8 animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancelar Viagem</h3>
                <p className="text-sm text-gray-500">Os pais serão notificados</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">Selecione o motivo do cancelamento:</p>

            <div className="space-y-2 mb-4">
              {[
                'Problema mecânico no veículo',
                'Falta de combustível',
                'Condições climáticas adversas',
                'Problema na via/estrada',
                'Motorista indisponível',
                'Veículo em manutenção',
                'Outros',
              ].map(reason => (
                <button key={reason} onClick={() => setCancelReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${cancelReason === reason ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {reason}
                </button>
              ))}
            </div>

            {cancelReason === 'Outros' && (
              <input
                type="text"
                placeholder="Descreva o motivo..."
                value={cancelReason === 'Outros' ? '' : cancelReason}
                onChange={e => setCancelReason(e.target.value || 'Outros')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm mb-4 focus:border-amber-500 outline-none"
              />
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 text-sm">
                Voltar
              </button>
              <button onClick={handleCancelTrip}
                disabled={!cancelReason || cancelTripMut.loading}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {cancelTripMut.loading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SUB-VIEWS ====================

function TripView({ activeTrip, stops, elapsed, position, onBoard, onDrop, onAbsent }: any) {
  const tripId = activeTrip?.trip?.id || activeTrip?.id;
  const currentStopIdx = activeTrip?.trip?.currentStopIndex || 0;
  const totalStops = stops.length;
  const progress = totalStops > 0 ? ((currentStopIdx + 1) / totalStops) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Progresso da Viagem</p>
          <p className="text-sm font-bold text-accent-600">{currentStopIdx + 1}/{totalStops} paradas</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-accent-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-gray-400" />
            <span className="text-sm font-mono font-bold">{elapsed}</span>
          </div>
          {position && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              GPS Ativo
            </div>
          )}
        </div>
      </div>

      {/* Current / Next Stop */}
      {stops.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Parada Atual</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
              <MapPin size={20} className="text-accent-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{stops[currentStopIdx]?.name || 'Parada'}</p>
              <p className="text-sm text-gray-500">{stops[currentStopIdx]?.address || ''}</p>
            </div>
          </div>
          {currentStopIdx + 1 < totalStops && (
            <div className="mt-3 pt-3 border-t flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <ChevronRight size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Proxima parada</p>
                <p className="text-sm font-medium text-gray-700">{stops[currentStopIdx + 1]?.name}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Students at current stop */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="font-semibold text-gray-700">Alunos nesta parada</p>
        </div>
        {stops[currentStopIdx]?.students?.length > 0 ? (
          <div className="divide-y">
            {stops[currentStopIdx].students.map((st: any) => (
              <div key={st.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {st.photoUrl ? <img src={st.photoUrl} className="w-10 h-10 rounded-full object-cover" /> : <User size={18} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{st.name}</p>
                  <p className="text-xs text-gray-500">{st.enrollment || ''}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => onBoard(st.id, tripId)} className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center active:bg-green-200">
                    <CheckCircle size={18} className="text-green-600" />
                  </button>
                  <button onClick={() => onAbsent(st.id, tripId)} className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center active:bg-red-200">
                    <XCircle size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum aluno nesta parada</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentsView({ stops }: { stops: any[] }) {
  return (
    <div className="space-y-4">
      {stops.map((stop: any, idx: number) => (
        <div key={idx} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</div>
            <p className="font-semibold text-gray-700">{stop.name}</p>
            <span className="ml-auto text-xs text-gray-400">{stop.students?.length || 0} aluno(s)</span>
          </div>
          {stop.students?.length > 0 ? (
            <div className="divide-y">
              {stop.students.map((st: any) => (
                <div key={st.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {st.photoUrl ? <img src={st.photoUrl} className="w-10 h-10 rounded-full object-cover" /> : <User size={18} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{st.name}</p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {st.grade && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{st.grade}</span>}
                      {st.hasSpecialNeeds && <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">PCD</span>}
                    </div>
                  </div>
                  {st.status === 'boarded' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Embarcou</span>}
                  {st.status === 'dropped' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Desembarcou</span>}
                  {st.status === 'absent' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Ausente</span>}
                  {(st.status === 'pending' || !st.status) && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Pendente</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-center text-sm text-gray-400">Nenhum aluno nesta parada</div>
          )}
        </div>
      ))}
      {stops.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Route size={40} className="mx-auto mb-3 opacity-50" />
          <p>Nenhuma rota atribuida</p>
        </div>
      )}
    </div>
  );
}

function RouteView({ stops }: { stops: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || stops.length === 0) return;
    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;
      if (mapInstRef.current) { mapInstRef.current.remove(); mapInstRef.current = null; }
      const map = L.map(mapRef.current, { zoomControl: true }).setView([-10.76, -48.90], 13);
      const sa = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
      const hl = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
      const st = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
      sa.addTo(map); hl.addTo(map);
      L.control.layers({ 'Ruas': st, 'Satélite': sa }, {}, { position: 'topright', collapsed: true }).addTo(map);
      const pts: any[] = [];
      stops.forEach((s: any, i: number) => {
        const la = parseFloat(String(s.latitude || 0)), ln = parseFloat(String(s.longitude || 0));
        if (!la || !ln) return;
        const icon = L.divIcon({ html: '<div style="background:#059669;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)">' + (i+1) + '</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        L.marker([la, ln], { icon }).addTo(map).bindPopup('<b>' + (i+1) + '. ' + s.name + '</b><br><span style="font-size:11px">' + (s.students?.length || 0) + ' aluno(s)</span>');
        pts.push([la, ln]);
      });
      if (pts.length > 1) {
        L.polyline(pts, { color: '#059669', weight: 4, opacity: 0.8 }).addTo(map);
        map.fitBounds(pts, { padding: [30, 30] });
      } else if (pts.length === 1) map.setView(pts[0], 15);
      mapInstRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    };
    if ((window as any).L) { setTimeout(initMap, 100); }
    else {
      if (!document.getElementById('leaflet-css-drv')) { const lk = document.createElement('link'); lk.id = 'leaflet-css-drv'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk); }
      if (!document.getElementById('leaflet-js-drv')) { const sc = document.createElement('script'); sc.id = 'leaflet-js-drv'; sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.onload = () => setTimeout(initMap, 200); document.head.appendChild(sc); }
      else { const p = setInterval(() => { if ((window as any).L) { clearInterval(p); initMap(); } }, 200); setTimeout(() => clearInterval(p), 5000); }
    }
    return () => { if (mapInstRef.current) { mapInstRef.current.remove(); mapInstRef.current = null; } };
  }, [stops]);

  return (
    <div className="space-y-3">
      {/* Mapa da rota */}
      {stops.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center gap-2">
            <Navigation size={14} className="text-accent-600" />
            <span className="text-sm font-semibold text-gray-700">Mapa da Rota</span>
            <span className="ml-auto text-xs text-gray-400">{stops.length} parada(s)</span>
          </div>
          <div ref={mapRef} style={{ height: 300 }} />
        </div>
      )}
      {/* Lista de paradas */}
      {stops.map((stop: any, idx: number) => (
        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</div>
            {idx < stops.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{stop.name}</p>
            {stop.address && <p className="text-sm text-gray-500 mt-0.5">{stop.address}</p>}
            {stop.latitude && <p className="text-xs text-gray-400 mt-0.5">{parseFloat(String(stop.latitude)).toFixed(5)}, {parseFloat(String(stop.longitude)).toFixed(5)}</p>}
            <p className="text-xs text-gray-400 mt-1">{stop.students?.length || 0} aluno(s)</p>
            {stop.latitude && (
              <button onClick={() => {
                const destLat = parseFloat(String(stop.latitude)).toFixed(6);
                const destLng = parseFloat(String(stop.longitude)).toFixed(6);
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => window.open(`https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}&destination=${destLat},${destLng}&travelmode=driving`, '_blank'),
                    () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`, '_blank'),
                    { enableHighAccuracy: true, timeout: 8000 }
                  );
                } else {
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
                }
              }}
                className="mt-2 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium active:bg-blue-100">
                <Navigation size={12} /> Navegar até aqui
              </button>
            )}
          </div>
          {stop.arrived && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Visitada</span>}
        </div>
      ))}
      {stops.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MapPin size={40} className="mx-auto mb-3 opacity-50" />
          <p>Nenhuma parada cadastrada</p>
        </div>
      )}
    </div>
  );
}

function HistoryView({ municipalityId }: { municipalityId: number | null | undefined }) {
  const { data, loading } = useQuery(() => api.trips.history({ municipalityId, limit: 30 }), [municipalityId]);
  const trips = (data as any[]) || [];

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={30} className="animate-spin text-accent-500" /></div>;

  return (
    <div className="space-y-2">
      {trips.map((t: any, idx: number) => (
        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Calendar size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t.routeName || t.route?.name || 'Viagem'}</p>
                <p className="text-xs text-gray-500">
                  {t.startedAt ? new Date(t.startedAt).toLocaleDateString('pt-BR') : '---'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {t.totalKm && <p className="text-sm font-semibold text-gray-700">{t.totalKm} km</p>}
              {t.duration && <p className="text-xs text-gray-400">{t.duration}</p>}
            </div>
          </div>
        </div>
      ))}
      {trips.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Clock size={40} className="mx-auto mb-3 opacity-50" />
          <p>Nenhuma viagem nos ultimos 30 dias</p>
        </div>
      )}
    </div>
  );
}

function VehicleView({ vehicle }: { vehicle: any }) {
  if (!vehicle) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Bus size={40} className="mx-auto mb-3 opacity-50" />
        <p>Nenhum veiculo atribuido</p>
      </div>
    );
  }

  function docStatus(expiryDate: string | null) {
    if (!expiryDate) return { label: 'Sem data', color: 'bg-gray-100 text-gray-500' };
    const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return { label: 'Vencido', color: 'bg-red-100 text-red-700' };
    if (diff < 30) return { label: 'Vence em breve', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Valido', color: 'bg-green-100 text-green-700' };
  }

  const docs = [
    { name: 'CRLV', date: vehicle.crlvExpiry || vehicle.licensingExpiry },
    { name: 'Seguro', date: vehicle.insuranceExpiry },
    { name: 'Vistoria', date: vehicle.inspectionExpiry },
  ].filter(d => d.date);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center">
            <Bus size={32} className="text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{vehicle.plate}</p>
            <p className="text-gray-500">{vehicle.brand} {vehicle.model}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Ano</p>
            <p className="font-semibold text-gray-800">{vehicle.year || '---'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Capacidade</p>
            <p className="font-semibold text-gray-800">{vehicle.capacity || '---'} lugares</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Tipo</p>
            <p className="font-semibold text-gray-800">{vehicle.type || '---'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Km Atual</p>
            <p className="font-semibold text-gray-800">{vehicle.currentKm ? `${vehicle.currentKm} km` : '---'}</p>
          </div>
        </div>
      </div>

      {docs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="font-semibold text-gray-700">Documentos</p>
          </div>
          <div className="divide-y">
            {docs.map((doc, idx) => {
              const st = docStatus(doc.date);
              return (
                <div key={idx} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">Venc.: {new Date(doc.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FuelView({ municipalityId, vehicleId, onRefresh }: { municipalityId: any; vehicleId: any; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [km, setKm] = useState('');
  const [fuelType, setFuelType] = useState('diesel');

  const { data, loading, refetch } = useQuery(() => api.fuel.list({ municipalityId, vehicleId, limit: 20 }), [municipalityId, vehicleId]);
  const createFuel = useMutation(api.fuel.create);
  const records = (data as any[]) || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createFuel.mutate({
      vehicleId,
      municipalityId,
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      km: km ? parseInt(km) : undefined,
      fuelType,
    }, {
      onSuccess: () => { setShowForm(false); setLiters(''); setCost(''); setKm(''); refetch(); onRefresh(); }
    });
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:bg-orange-600">
          <Fuel size={20} /> Registrar Abastecimento
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm border space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Litros</label>
            <input type="number" step="0.01" required value={liters} onChange={e => setLiters(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-lg" placeholder="Ex: 50.00" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Valor Total (R$)</label>
            <input type="number" step="0.01" required value={cost} onChange={e => setCost(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-lg" placeholder="Ex: 350.00" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Km Atual</label>
            <input type="number" value={km} onChange={e => setKm(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-lg" placeholder="Km do odometro" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Combustivel</label>
            <select value={fuelType} onChange={e => setFuelType(e.target.value)}
              className="w-full border rounded-xl px-4 py-3">
              <option value="diesel">Diesel</option>
              <option value="gasolina">Gasolina</option>
              <option value="etanol">Etanol</option>
              <option value="gnv">GNV</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-xl py-3 font-semibold text-gray-600">Cancelar</button>
            <button type="submit" disabled={createFuel.loading} className="flex-1 bg-orange-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50">
              {createFuel.loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-accent-500" /></div>
      ) : (
        <div className="space-y-2">
          {records.map((r: any, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Fuel size={18} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{r.liters}L - R$ {r.cost?.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : ''} {r.fuelType ? `| ${r.fuelType}` : ''}</p>
              </div>
              {r.km && <span className="text-xs text-gray-400">{r.km} km</span>}
            </div>
          ))}
          {records.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Nenhum abastecimento registrado</p>}
        </div>
      )}
    </div>
  );
}

function ChatView() {
  return (
    <div className="text-center py-12 text-gray-400">
      <MessageCircle size={40} className="mx-auto mb-3 opacity-50" />
      <p className="font-medium">Chat</p>
      <p className="text-sm mt-1">Utilize o chat flutuante no canto inferior direito da tela.</p>
    </div>
  );
}
