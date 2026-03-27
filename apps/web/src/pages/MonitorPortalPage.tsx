import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { useSocket } from '../lib/socket';
import jsQR from 'jsqr';
import {
  ClipboardCheck, QrCode, Users, MessageCircle, ArrowLeft,
  CheckCircle, XCircle, User, Phone, Timer, Bus, MapPin,
  Camera, Loader2, ChevronRight, Circle, LogOut
} from 'lucide-react';

type View = 'home' | 'checklist' | 'scanner' | 'contacts' | 'chat' | 'route' | 'students';

export default function MonitorPortalPage() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [view, setView] = useState<View>('home');
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (socket && user?.municipalityId) {
      socket.emit('join:municipality', user.municipalityId);
    }
  }, [socket, user?.municipalityId]);

  useEffect(() => { loadData(); }, []);

  // Elapsed timer (com proteção contra negativos)
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
      console.log('[Monitor] Carregando dados...');

      // 1. Verificar viagem ativa
      let trip: any = null;
      try {
        trip = await api.monitors.myActiveTrip();
        console.log('[Monitor] myActiveTrip:', trip ? `tripId=${trip.trip?.id}, stops=${trip.stops?.length}` : 'null');
      } catch (err: any) {
        console.error('[Monitor] Erro myActiveTrip:', err?.message);
      }

      if (trip && trip.stops?.length > 0) {
        setActiveTrip(trip);
        if (trip.trip?.startedAt) setTripStartTime(new Date(trip.trip.startedAt));
        console.log('[Monitor] Viagem ativa carregada. Alunos:', trip.stops.reduce((t: number, s: any) => t + (s.students?.length || 0), 0));
        return;
      }

      // 2. Buscar rotas disponíveis
      console.log('[Monitor] Sem viagem ativa, buscando rotas...');
      let available: any = null;
      try {
        available = await api.monitors.availableTrips();
        console.log('[Monitor] availableTrips:', available?.routes?.length || 0, 'rotas');
      } catch (err: any) {
        console.error('[Monitor] Erro availableTrips:', err?.message);
      }

      if (available?.routes?.length > 0) {
        const route = available.routes[0];
        console.log('[Monitor] Rota:', route.name, 'id:', route.id);

        // 3. Buscar paradas e alunos da rota
        let routeStops: any[] = [];
        try {
          const stopsData = await api.ai.routeStudents({ routeId: route.id });
          console.log('[Monitor] routeStudents:', stopsData?.stops?.length || 0, 'paradas,', stopsData?.students?.length || 0, 'alunos');
          if (stopsData?.stops) {
            routeStops = stopsData.stops.map((s: any) => ({
              ...s,
              students: (stopsData.students || []).filter((st: any) => st.stopId === s.id).map((st: any) => ({ ...st, status: 'pending' })),
            }));
          }
        } catch (err: any) {
          console.error('[Monitor] Erro routeStudents:', err?.message);
        }
        setActiveTrip({ route, vehicle: available.vehicle, stops: routeStops });
        console.log('[Monitor] Dados carregados. Paradas:', routeStops.length, 'Alunos:', routeStops.reduce((t: number, s: any) => t + (s.students?.length || 0), 0));
      } else {
        console.log('[Monitor] Nenhuma rota disponível');
        setActiveTrip(null);
      }
    } catch (err: any) {
      console.error('[Monitor] Erro geral loadData:', err?.message);
    } finally {
      setLoading(false);
    }
  }

  // Navegação Google Maps com GPS atual
  function openRouteNavigation() {
    const validStops = stops.filter((s: any) => s.latitude && s.longitude && parseFloat(String(s.latitude)) !== 0);
    if (validStops.length === 0) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origin = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
          const dest = validStops[validStops.length - 1];
          const destStr = `${parseFloat(String(dest.latitude)).toFixed(6)},${parseFloat(String(dest.longitude)).toFixed(6)}`;
          const waypoints = validStops.slice(0, -1).map((s: any) => `${parseFloat(String(s.latitude)).toFixed(6)},${parseFloat(String(s.longitude)).toFixed(6)}`).join('|');
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destStr}${waypoints ? '&waypoints=' + waypoints : ''}&travelmode=driving`, '_blank');
        },
        () => {
          const origin = validStops[0]; const dest = validStops[validStops.length - 1];
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${parseFloat(String(origin.latitude)).toFixed(6)},${parseFloat(String(origin.longitude)).toFixed(6)}&destination=${parseFloat(String(dest.latitude)).toFixed(6)},${parseFloat(String(dest.longitude)).toFixed(6)}&travelmode=driving`, '_blank');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }

  // Board / drop / absent mutations
  const boardMut = useMutation(api.monitors.boardStudent);
  const dropMut = useMutation(api.monitors.dropStudent);
  const absentMut = useMutation(api.monitors.markAbsent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={40} className="animate-spin text-accent-500" />
      </div>
    );
  }

  const routeName = activeTrip?.route?.name || activeTrip?.routeName || 'Sem rota';
  const driverName = activeTrip?.driver?.name || activeTrip?.driverName || '---';
  const stops = activeTrip?.stops || [];
  const hasTripActive = !!activeTrip?.trip?.id;
  const tripId = activeTrip?.trip?.id || activeTrip?.id;

  // All students flat list
  const allStudents = stops.flatMap((s: any) =>
    (s.students || []).map((st: any) => ({ ...st, stopName: s.name }))
  );

  if (view !== 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setView('home')} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {view === 'checklist' && 'Lista de Chamada'}
            {view === 'scanner' && 'Escanear QR Code'}
            {view === 'contacts' && 'Contatos dos Responsáveis'}
            {view === 'chat' && 'Mensagens'}
            {view === 'route' && 'Paradas da Rota'}
            {view === 'students' && 'Alunos da Rota'}
          </h2>
        </div>

        <div className="p-4 pb-24">
          {view === 'checklist' && (
            <ChecklistView
              stops={stops}
              tripId={tripId}
              onBoard={(sId: number) => boardMut.mutate({ studentId: sId, tripId }, { onSuccess: loadData })}
              onDrop={(sId: number) => dropMut.mutate({ studentId: sId, tripId }, { onSuccess: loadData })}
              onAbsent={(sId: number) => absentMut.mutate({ studentId: sId, tripId }, { onSuccess: loadData })}
            />
          )}
          {view === 'scanner' && (
            <ScannerView
              tripId={tripId}
              allStudents={allStudents}
              onBoard={(sId: number) => boardMut.mutate({ studentId: sId, tripId }, { onSuccess: loadData })}
              onRefresh={loadData}
            />
          )}
          {view === 'contacts' && <ContactsView students={allStudents} />}
          {view === 'chat' && <ChatView />}
          {view === 'route' && <MonitorRouteView stops={stops} />}
          {view === 'students' && <MonitorStudentsView stops={stops} />}
        </div>
      </div>
    );
  }

  // ==================== HOME ====================
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-5 pt-8 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-indigo-200 text-sm">Portal do Monitor</p>
            <h1 className="text-2xl font-bold">Ola, {user?.name?.split(' ')[0]}!</h1>
          </div>
          <div className="flex items-center gap-2">
            {hasTripActive && (
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Viagem Ativa
              </div>
            )}
            <button onClick={() => { logout(); window.location.href = '/login'; }} className="p-2 text-white/60 hover:text-red-300 hover:bg-white/10 rounded-lg" title="Sair">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Trip status card */}
        {hasTripActive ? (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Bus size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{routeName}</p>
                <p className="text-sm text-indigo-200">Motorista: {driverName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Timer size={16} className="text-indigo-300" />
              <span className="text-lg font-mono font-bold text-white">{elapsed}</span>
            </div>
          </div>
        ) : activeTrip?.route ? (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Bus size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{routeName}</p>
                <p className="text-sm text-indigo-200">{stops.length} parada(s) • {allStudents.length} aluno(s)</p>
              </div>
            </div>
            <p className="text-xs text-indigo-300 mt-2 text-center">Aguardando o motorista iniciar a viagem</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <Bus size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-indigo-200">Nenhuma rota atribuída</p>
            <p className="text-xs text-indigo-300 mt-1">Entre em contato com o administrador</p>
          </div>
        )}
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {/* Module Grid */}
        {/* Botão Navegar */}
        {stops.length > 0 && (
          <button onClick={openRouteNavigation}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base py-4 rounded-2xl shadow-md flex items-center justify-center gap-3 transition-all">
            <MapPin size={22} />
            NAVEGAR PELA ROTA
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'route' as View, icon: MapPin, label: 'Rota', desc: 'Mapa e paradas', color: 'bg-sky-500' },
            { key: 'students' as View, icon: Users, label: 'Alunos', desc: 'Alunos por parada', color: 'bg-amber-500' },
            { key: 'checklist' as View, icon: ClipboardCheck, label: 'Checklist', desc: 'Lista de chamada', color: 'bg-green-500' },
            { key: 'scanner' as View, icon: QrCode, label: 'QR Scanner', desc: 'Escanear carteirinha', color: 'bg-blue-500' },
            { key: 'contacts' as View, icon: Users, label: 'Contatos', desc: 'Pais e responsáveis', color: 'bg-purple-500' },
            { key: 'chat' as View, icon: MessageCircle, label: 'Chat', desc: 'Mensagens', color: 'bg-indigo-500' },
          ].map(mod => (
            <button
              key={mod.key}
              onClick={() => setView(mod.key)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-3 active:scale-95 transition-transform text-left"
            >
              <div className={`w-12 h-12 ${mod.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <mod.icon size={22} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{mod.label}</p>
                <p className="text-xs text-gray-400">{mod.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick stats */}
        {hasTripActive ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
              <p className="text-2xl font-bold text-green-600">{allStudents.filter((s: any) => s.status === 'boarded').length}</p>
              <p className="text-xs text-gray-500">Embarcados</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
              <p className="text-2xl font-bold text-red-600">{allStudents.filter((s: any) => s.status === 'absent').length}</p>
              <p className="text-xs text-gray-500">Ausentes</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
              <p className="text-2xl font-bold text-gray-600">{allStudents.filter((s: any) => !s.status || s.status === 'pending').length}</p>
              <p className="text-xs text-gray-500">Pendentes</p>
            </div>
          </div>
        ) : allStudents.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
              <p className="text-2xl font-bold text-primary-600">{stops.length}</p>
              <p className="text-xs text-gray-500">Paradas</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
              <p className="text-2xl font-bold text-primary-600">{allStudents.length}</p>
              <p className="text-xs text-gray-500">Alunos</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== SUB-VIEWS ====================

function ChecklistView({ stops, tripId, onBoard, onDrop, onAbsent }: any) {
  return (
    <div className="space-y-4">
      {stops.map((stop: any, idx: number) => (
        <div key={idx} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
            <div className="w-6 h-6 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</div>
            <p className="font-semibold text-gray-700 flex-1">{stop.name}</p>
            <span className="text-xs text-gray-400">{stop.students?.length || 0}</span>
          </div>
          {stop.students?.length > 0 ? (
            <div className="divide-y">
              {stop.students.map((st: any) => {
                const statusColor = st.status === 'boarded' ? 'bg-green-50 border-l-4 border-l-green-500'
                  : st.status === 'absent' ? 'bg-red-50 border-l-4 border-l-red-500'
                  : 'border-l-4 border-l-gray-200';
                return (
                  <div key={st.id} className={`px-4 py-3 flex items-center gap-3 ${statusColor}`}>
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {st.photoUrl ? <img src={st.photoUrl} className="w-10 h-10 rounded-full object-cover" /> : <User size={18} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{st.name}</p>
                      <p className="text-xs text-gray-500">
                        {st.status === 'boarded' ? 'Embarcou' : st.status === 'absent' ? 'Ausente' : 'Pendente'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => onBoard(st.id)} title="Embarcar"
                        className={`w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform ${st.status === 'boarded' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'}`}>
                        <CheckCircle size={20} />
                      </button>
                      <button onClick={() => onAbsent(st.id)} title="Ausente"
                        className={`w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform ${st.status === 'absent' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                        <XCircle size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-center text-sm text-gray-400">Nenhum aluno nesta parada</div>
          )}
        </div>
      ))}
      {stops.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardCheck size={40} className="mx-auto mb-3 opacity-50" />
          <p>Nenhuma viagem ativa para fazer chamada</p>
        </div>
      )}
    </div>
  );
}

function ScannerView({ tripId, allStudents, onBoard, onRefresh }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ student: any; status: string; message: string } | null>(null);
  const [scanMode, setScanMode] = useState<'embarque' | 'desembarque'>('embarque');
  const [scanCount, setScanCount] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  const dropMut = useMutation(api.monitors.dropStudent);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.onloadeddata = () => { setScanning(true); requestAnimationFrame(scanFrame); };
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  function playBeep(success: boolean) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = success ? 1000 : 400;
      osc.type = success ? 'sine' : 'square';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  function scanFrame() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) { requestAnimationFrame(scanFrame); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data && code.data !== lastScanned) {
      handleQRCode(code.data);
      setLastScanned(code.data);
    }
    requestAnimationFrame(scanFrame);
  }

  async function handleQRCode(data: string) {
    let enrollment = data;
    try { const parsed = JSON.parse(data); enrollment = parsed.enrollment || parsed.id?.toString() || parsed.name || data; } catch {}

    console.log('[QR] Lido:', enrollment, '| Alunos disponíveis:', allStudents.length, '| TripId:', tripId);
    if (allStudents.length > 0) {
      console.log('[QR] Primeiro aluno:', JSON.stringify({ id: allStudents[0].id, name: allStudents[0].name, enrollment: allStudents[0].enrollment }));
    }

    // Buscar aluno por: matrícula, ID, nome parcial, ou CPF
    const cleanEnrollment = enrollment.trim();
    const student = allStudents.find((s: any) =>
      s.enrollment === cleanEnrollment ||
      s.id?.toString() === cleanEnrollment ||
      String(s.id) === cleanEnrollment ||
      (s.enrollment && cleanEnrollment.includes(s.enrollment)) ||
      (s.enrollment && s.enrollment.includes(cleanEnrollment)) ||
      (cleanEnrollment.length > 3 && s.name && s.name.toLowerCase().includes(cleanEnrollment.toLowerCase())) ||
      (s.cpf && s.cpf.replace(/\D/g, '') === cleanEnrollment.replace(/\D/g, ''))
    );

    if (!student) {
      console.log('[QR] Não encontrou. Dados lidos:', cleanEnrollment, '| Matrículas:', allStudents.map((s: any) => s.enrollment).join(', '));
    }

    if (student) {
      if (tripId) {
        try {
          if (scanMode === 'embarque') {
            await onBoard(student.id);
            setScanResult({ student, status: 'boarded', message: `${student.name} embarcou!` });
          } else {
            await dropMut.mutate({ studentId: student.id, tripId });
            setScanResult({ student, status: 'dropped', message: `${student.name} desembarcou!` });
          }
          playBeep(true);
          if (navigator.vibrate) navigator.vibrate(200);
          setScanCount(c => c + 1);
          onRefresh();
        } catch {
          setScanResult({ student, status: 'error', message: `Erro ao registrar ${student.name}` });
          playBeep(false);
        }
      } else {
        // Sem viagem ativa - apenas identificar o aluno
        setScanResult({ student, status: 'identified', message: `${student.name} - ${student.grade || ''} ${student.stopName || ''}` });
        playBeep(true);
        if (navigator.vibrate) navigator.vibrate(200);
      }
    } else {
      setScanResult({ student: null, status: 'not_found', message: `Aluno não encontrado (código: ${cleanEnrollment})` });
      playBeep(false);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => { setScanResult(null); setLastScanned(null); }, 3000);
  }

  return (
    <div className="space-y-4">
      {/* Modo: Embarque / Desembarque */}
      <div className="flex rounded-2xl border-2 border-gray-200 overflow-hidden">
        <button onClick={() => setScanMode('embarque')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${scanMode === 'embarque' ? 'bg-green-500 text-white' : 'bg-white text-gray-500'}`}>
          <CheckCircle size={16} /> Embarque
        </button>
        <button onClick={() => setScanMode('desembarque')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${scanMode === 'desembarque' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}`}>
          <MapPin size={16} /> Desembarque
        </button>
      </div>

      {/* Camera */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-gray-300">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {/* Scan guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-56 h-56 border-3 rounded-2xl ${scanMode === 'embarque' ? 'border-green-400' : 'border-blue-400'}`} style={{ borderWidth: 3 }}>
            <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl ${scanMode === 'embarque' ? 'border-green-400' : 'border-blue-400'}`} />
            <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl ${scanMode === 'embarque' ? 'border-green-400' : 'border-blue-400'}`} />
            <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl ${scanMode === 'embarque' ? 'border-green-400' : 'border-blue-400'}`} />
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl ${scanMode === 'embarque' ? 'border-green-400' : 'border-blue-400'}`} />
          </div>
        </div>
        {/* Contador */}
        <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold">
          {scanCount} lido(s)
        </div>
        {/* Modo label */}
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white ${scanMode === 'embarque' ? 'bg-green-500' : 'bg-blue-500'}`}>
          {scanMode === 'embarque' ? '↑ EMBARQUE' : '↓ DESEMBARQUE'}
        </div>
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Resultado do scan */}
      {scanResult && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 border-2 ${
          scanResult.status === 'boarded' ? 'bg-green-50 border-green-300' :
          scanResult.status === 'dropped' ? 'bg-blue-50 border-blue-300' :
          scanResult.status === 'identified' ? 'bg-indigo-50 border-indigo-300' :
          'bg-red-50 border-red-300'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            scanResult.status === 'boarded' ? 'bg-green-100' :
            scanResult.status === 'dropped' ? 'bg-blue-100' :
            scanResult.status === 'identified' ? 'bg-indigo-100' :
            'bg-red-100'
          }`}>
            {scanResult.student?.photoUrl ? (
              <img src={scanResult.student.photoUrl} className="w-12 h-12 rounded-full object-cover" />
            ) : scanResult.status === 'not_found' ? (
              <XCircle size={24} className="text-red-500" />
            ) : (
              <CheckCircle size={24} className={scanResult.status === 'boarded' ? 'text-green-500' : scanResult.status === 'identified' ? 'text-indigo-500' : 'text-blue-500'} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">{scanResult.message}</p>
            {scanResult.student?.grade && <p className="text-xs text-gray-500">{scanResult.student.grade} • {scanResult.student.stopName || ''}</p>}
          </div>
        </div>
      )}

      {/* Instrução */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border text-center">
        <p className="text-sm text-gray-600">
          {scanning ? `Aponte a câmera para o QR Code • Modo: ${scanMode === 'embarque' ? 'Embarque' : 'Desembarque'}` : 'Iniciando câmera...'}
        </p>
      </div>
    </div>
  );
}

function ContactsView({ students }: { students: any[] }) {
  return (
    <div className="space-y-2">
      {students.map((st: any, idx: number) => (
        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              {st.photoUrl ? <img src={st.photoUrl} className="w-10 h-10 rounded-full object-cover" /> : <User size={18} className="text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{st.name}</p>
              <p className="text-xs text-gray-500">Parada: {st.stopName}</p>
            </div>
          </div>
          {(st.guardianPhone || st.parentPhone || st.phone) && (
            <div className="flex gap-2 mt-2">
              <a href={`tel:${st.guardianPhone || st.parentPhone || st.phone}`}
                className="flex-1 bg-blue-50 text-blue-600 rounded-xl py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 active:bg-blue-100">
                <Phone size={16} /> Ligar
              </a>
              <a href={`https://wa.me/55${(st.guardianPhone || st.parentPhone || st.phone || '').replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-green-50 text-green-600 rounded-xl py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 active:bg-green-100">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          )}
        </div>
      ))}
      {students.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>Nenhum aluno na rota</p>
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

// ==================== ROTA COM MAPA ====================
function MonitorRouteView({ stops }: { stops: any[] }) {
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
        const icon = L.divIcon({ html: '<div style="background:#059669;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)">' + (i + 1) + '</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        L.marker([la, ln], { icon }).addTo(map).bindPopup('<b>' + (i + 1) + '. ' + s.name + '</b><br><span style="font-size:11px">' + (s.students?.length || 0) + ' aluno(s)</span>');
        pts.push([la, ln]);
      });
      if (pts.length > 1) { L.polyline(pts, { color: '#059669', weight: 4, opacity: 0.8 }).addTo(map); map.fitBounds(pts, { padding: [30, 30] }); }
      else if (pts.length === 1) map.setView(pts[0], 15);
      mapInstRef.current = map;
      setTimeout(() => map.invalidateSize(), 200);
    };
    if ((window as any).L) setTimeout(initMap, 100);
    else {
      if (!document.getElementById('leaflet-css-mon')) { const lk = document.createElement('link'); lk.id = 'leaflet-css-mon'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk); }
      if (!document.getElementById('leaflet-js-mon')) { const sc = document.createElement('script'); sc.id = 'leaflet-js-mon'; sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; sc.onload = () => setTimeout(initMap, 200); document.head.appendChild(sc); }
      else { const p = setInterval(() => { if ((window as any).L) { clearInterval(p); initMap(); } }, 200); setTimeout(() => clearInterval(p), 5000); }
    }
    return () => { if (mapInstRef.current) { mapInstRef.current.remove(); mapInstRef.current = null; } };
  }, [stops]);

  return (
    <div className="space-y-3">
      {stops.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b flex items-center gap-2">
            <MapPin size={14} className="text-accent-600" />
            <span className="text-sm font-semibold text-gray-700">Mapa da Rota</span>
            <span className="ml-auto text-xs text-gray-400">{stops.length} parada(s)</span>
          </div>
          <div ref={mapRef} style={{ height: 300 }} />
        </div>
      )}
      {stops.map((stop: any, idx: number) => (
        <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-accent-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</div>
            {idx < stops.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{stop.name}</p>
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
                }
              }} className="mt-2 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium active:bg-blue-100">
                <MapPin size={12} /> Navegar até aqui
              </button>
            )}
          </div>
          {stop.arrived && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Visitada</span>}
        </div>
      ))}
      {stops.length === 0 && <div className="text-center py-12 text-gray-400"><MapPin size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhuma parada cadastrada</p></div>}
    </div>
  );
}

// ==================== ALUNOS POR PARADA ====================
function MonitorStudentsView({ stops }: { stops: any[] }) {
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
      {stops.length === 0 && <div className="text-center py-12 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhuma rota atribuída</p></div>}
    </div>
  );
}
