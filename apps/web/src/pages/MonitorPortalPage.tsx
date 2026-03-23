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

type View = 'home' | 'checklist' | 'scanner' | 'contacts' | 'chat';

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

  // Elapsed timer
  useEffect(() => {
    if (!tripStartTime) return;
    const iv = setInterval(() => {
      const diff = Math.floor((Date.now() - tripStartTime.getTime()) / 1000);
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
      const trip = await api.monitors.myActiveTrip();
      if (trip) {
        setActiveTrip(trip);
        if (trip.trip?.startedAt) setTripStartTime(new Date(trip.trip.startedAt));
      }
    } catch { }
    finally { setLoading(false); }
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
            {view === 'contacts' && 'Contatos dos Responsaveis'}
            {view === 'chat' && 'Mensagens'}
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
        ) : (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <Bus size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-indigo-200">Nenhuma viagem ativa no momento</p>
            <p className="text-xs text-indigo-300 mt-1">Aguardando o motorista iniciar a viagem</p>
          </div>
        )}
      </div>

      <div className="px-5 -mt-4 space-y-4">
        {/* Module Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'checklist' as View, icon: ClipboardCheck, label: 'Checklist', desc: 'Lista de chamada', color: 'bg-green-500' },
            { key: 'scanner' as View, icon: QrCode, label: 'QR Scanner', desc: 'Escanear carteirinha', color: 'bg-blue-500' },
            { key: 'contacts' as View, icon: Users, label: 'Contatos', desc: 'Pais e responsaveis', color: 'bg-purple-500' },
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
        {hasTripActive && (
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
              <p className="text-2xl font-bold text-gray-600">{allStudents.filter((s: any) => !s.status).length}</p>
              <p className="text-xs text-gray-500">Pendentes</p>
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
  const [scanResult, setScanResult] = useState<{ name: string; status: string } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    // Parse: plain enrollment string or JSON {id, name, enrollment}
    let enrollment = data;
    try {
      const parsed = JSON.parse(data);
      enrollment = parsed.enrollment || parsed.id?.toString() || data;
    } catch { }

    // Find student
    const student = allStudents.find((s: any) =>
      s.enrollment === enrollment || s.id?.toString() === enrollment
    );

    if (student && tripId) {
      await onBoard(student.id);
      setScanResult({ name: student.name, status: 'success' });
      onRefresh();
    } else {
      setScanResult({ name: enrollment, status: 'not_found' });
    }

    // Clear result after 3 seconds
    setTimeout(() => { setScanResult(null); setLastScanned(null); }, 3000);
  }

  return (
    <div className="space-y-4">
      {/* Camera */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {/* Scan guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-56 h-56 border-2 border-white/50 rounded-2xl" />
        </div>
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Scan result */}
      {scanResult && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${scanResult.status === 'success' ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'}`}>
          {scanResult.status === 'success' ? (
            <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
          ) : (
            <XCircle size={24} className="text-red-600 flex-shrink-0" />
          )}
          <div>
            <p className="font-semibold">{scanResult.status === 'success' ? 'Embarque registrado!' : 'Aluno nao encontrado'}</p>
            <p className="text-sm opacity-75">{scanResult.name}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 shadow-sm border">
        <p className="text-sm text-gray-600 text-center">
          {scanning ? 'Aponte a camera para o QR Code da carteirinha do aluno' : 'Iniciando camera...'}
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
