import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { api } from '../lib/api';
import { notifyUser, usePWAInstall } from '../lib/pwa';
import { requestNotificationPermission } from '../lib/pushNotifications';
import ChatWidget from '../components/ChatWidget';
import { generateDeclaracaoEscolaridade, generateDeclaracaoFrequencia, generateDeclaracaoTransferencia, generateFichaMatricula, generateBoletimEscolar, generateHistoricoEscolar } from '../lib/reportGenerators';
import { getMunicipalityReport } from '../lib/reportUtils';
import { loadSchoolData } from '../lib/reportTemplate';
import {
  GraduationCap, Calendar, ClipboardList, AlertTriangle,
  UtensilsCrossed, MessageCircle, FileText, Bus, User,
  ChevronLeft, BookOpen, BarChart3, Clock, Loader2,
  Plus, Shield, Download, Navigation, MapPin, Phone,
  RefreshCw, CheckCircle, Bell, History, ChevronRight, X, LogOut
} from 'lucide-react';

type PortalView = 'home' | 'boletim' | 'frequência' | 'parecer' | 'ocorrências' | 'calendario' | 'merenda' | 'mensagens' | 'declarações' | 'transporte' | 'vincular' | 'notificacoes';

// =============================================
// LIVE MAP (from GuardianPage)
// =============================================
function LiveMap({ driverLocation, stops }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const L = (window as any).L;
      const defaultCenter = driverLocation?.lat && driverLocation?.lng
        ? [driverLocation.lat, driverLocation.lng] : [-15.78, -47.93];
      const map = L.map(mapRef.current!).setView(defaultCenter, 14);
      const streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
      const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 });
      const terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const hybridLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const hybrid = L.layerGroup([L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 }), hybridLabels]);
      streets.addTo(map);
      L.control.layers({ 'Ruas': streets, 'Satélite': satellite, 'Híbrido': hybrid, 'Escuro': dark, 'Terreno': terrain }, {}, { position: 'topright', collapsed: true }).addTo(map);
      mapInstanceRef.current = map;
      if (stops) {
        stops.forEach((stop: any, i: number) => {
          const color = stop.arrived ? '#22c55e' : stop.isStudentStop ? '#0369A1' : '#9ca3af';
          const icon = L.divIcon({
            html: `<div style="background:${color};color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">${stop.arrived ? '✓' : i + 1}</div>`,
            className: '', iconSize: [24, 24], iconAnchor: [12, 12]
          });
          if (parseFloat(stop.latitude) && parseFloat(stop.longitude)) {
            L.marker([parseFloat(stop.latitude), parseFloat(stop.longitude)], { icon })
              .addTo(map).bindPopup(`<b>${stop.name}</b>${stop.isStudentStop ? '<br><span style="color:#f97316">Parada do seu filho</span>' : ''}`);
          }
        });
      }
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [stops]);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L || !driverLocation?.lat) return;
    const icon = L.icon({ iconUrl: '/bus-marker.svg', iconSize: [48, 48], iconAnchor: [24, 44], popupAnchor: [0, -44] });
    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng]);
    } else {
      busMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon }).addTo(mapInstanceRef.current);
      mapInstanceRef.current.setView([driverLocation.lat, driverLocation.lng], 15);
    }
  }, [driverLocation]);

  return (
    <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full" />
      {!driverLocation?.lat && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90">
          <div className="text-center"><Navigation size={32} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">Aguardando GPS do onibus...</p></div>
        </div>
      )}
    </div>
  );
}

// =============================================
// BACK BUTTON COMPONENT
// =============================================
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 mb-4 text-sm font-medium">
      <ChevronLeft size={18} /> Voltar
    </button>
  );
}

// =============================================
// LOADING COMPONENT
// =============================================
function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 size={32} className="text-primary-500 animate-spin mb-3" />
      <p className="text-gray-500 text-sm">{text || 'Carregando...'}</p>
    </div>
  );
}

// =============================================
// EMPTY STATE COMPONENT
// =============================================
function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="card text-center py-12">
      <Icon size={48} className="text-gray-200 mx-auto mb-3" />
      <h3 className="font-semibold text-gray-600 mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

// =============================================
// MAIN PORTAL COMPONENT
// =============================================
export default function GuardianPortalPage() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [view, setView] = useState<PortalView>('home');
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const { canInstall, isInstalled, install } = usePWAInstall();

  // Transport state
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [busLocation, setBusLocation] = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Notification permission banner
  const [notifBannerVisible, setNotifBannerVisible] = useState(() => {
    if (!('Notification' in window)) return false;
    return Notification.permission === 'default';
  });

  // Vincular aluno state
  const [addEnrollment, setAddEnrollment] = useState('');
  const [addRelationship, setAddRelationship] = useState('other');
  const [addMsg, setAddMsg] = useState('');

  // Load students
  useEffect(() => {
    loadStudents();
    loadNotifications();
    loadUnreadMessages();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      const data = await api.guardians.myStudents();
      setMyStudents(data || []);
      if (data?.length > 0 && !selectedStudent) {
        setSelectedStudent(data[0]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadNotifications() {
    try {
      const data = await api.notifications.list({ limit: 30 });
      setNotifs(data || []);
      const unread = await api.notifications.unreadCount();
      setUnreadCount(unread?.count || 0);
    } catch (e) { console.error(e); }
  }

  async function loadUnreadMessages() {
    try {
      const msgs = await api.guardians.myMessages();
      setUnreadMsgCount(msgs?.length || 0);
    } catch { /* ignore */ }
  }

  // Transport: load active trip
  useEffect(() => {
    if (!selectedStudent) return;
    loadActiveTrip(selectedStudent.id);
  }, [selectedStudent?.id]);

  async function loadActiveTrip(studentId: number) {
    try {
      const data = await api.guardians.getStudentActiveTrip({ studentId });
      setActiveTrip(data);
      if (data?.driverLocation) setBusLocation(data.driverLocation);
    } catch { setActiveTrip(null); }
  }

  // Socket.IO
  useEffect(() => {
    if (!socket || !user?.municipalityId) return;
    socket.emit('join:municipality', user.municipalityId);
  }, [socket, user?.municipalityId]);

  useEffect(() => {
    if (!socket) return;
    const onBusLocation = (data: any) => {
      if (activeTrip && data.tripId === activeTrip.trip?.id) {
        setBusLocation({ lat: data.latitude || data.lat, lng: data.longitude || data.lng, updatedAt: new Date() });
      }
    };
    const onStopArrived = () => { if (selectedStudent) loadActiveTrip(selectedStudent.id); };
    const onStudentBoarded = () => { notifyUser(); loadNotifications(); };
    const onStudentDropped = () => { notifyUser(); loadNotifications(); };
    const onTripCompleted = () => {
      if (selectedStudent) loadActiveTrip(selectedStudent.id);
      loadNotifications();
    };
    socket.on('bus:location', onBusLocation);
    socket.on('stop:arrived', onStopArrived);
    socket.on('student:boarded', onStudentBoarded);
    socket.on('student:dropped', onStudentDropped);
    socket.on('trip:completed', onTripCompleted);
    return () => {
      socket.off('bus:location', onBusLocation);
      socket.off('stop:arrived', onStopArrived);
      socket.off('student:boarded', onStudentBoarded);
      socket.off('student:dropped', onStudentDropped);
      socket.off('trip:completed', onTripCompleted);
    };
  }, [socket, activeTrip?.trip?.id, selectedStudent?.id]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedStudent) loadActiveTrip(selectedStudent.id);
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedStudent?.id]);

  async function handleAddStudent() {
    if (!addEnrollment.trim()) return;
    try {
      const result = await api.guardians.addStudent({ studentEnrollment: addEnrollment, relationship: addRelationship as any });
      setAddMsg('OK: ' + result.studentName + ' vinculado(a) com sucesso!');
      setAddEnrollment('');
      loadStudents();
    } catch (e: any) { setAddMsg('ERRO: ' + (e.message || 'Erro ao vincular')); }
  }

  const currentStudent = selectedStudent || myStudents[0];
  const goHome = () => setView('home');

  if (loading) return <LoadingSpinner text="Carregando portal..." />;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-20">
      {/* Child Selector (persists across views) */}
      {myStudents.length > 0 && view !== 'mensagens' && view !== 'vincular' && (
        <div className="mb-4">
          {myStudents.length > 1 && view === 'home' && (
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1"><User size={12} /> Selecione o aluno para ver as informações:</p>
          )}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {myStudents.map(s => (
              <button key={s.id} onClick={() => setSelectedStudent(s)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all flex-shrink-0 ${
                  s.id === currentStudent?.id
                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  s.id === currentStudent?.id ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {(s.photoUrl || s.photo) ? <img src={s.photoUrl || s.photo} alt="" className="w-full h-full rounded-full object-cover" /> : s.name?.charAt(0)}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium leading-tight ${s.id === currentStudent?.id ? 'text-primary-700' : 'text-gray-700'}`}>
                    {s.name?.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <p className="text-[11px] text-gray-400 leading-tight">{s.grade || 'Sem serie'} - {s.schoolName?.split(' ').slice(0, 3).join(' ')}</p>
                </div>
                {s.activeTrip && (
                  <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">ROTA</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No students linked */}
      {myStudents.length === 0 && view === 'home' && (
        <div className="card p-8 text-center mb-4">
          <Shield size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-2">Nenhum aluno vinculado</h3>
          <p className="text-gray-500 text-sm mb-4">Vincule um aluno usando a matricula escolar para comecar a usar o portal.</p>
          <button onClick={() => setView('vincular')} className="btn-primary px-4 py-2 rounded-lg text-sm">
            <Plus size={14} className="inline mr-1" /> Vincular Aluno
          </button>
        </div>
      )}

      {/* PWA Install */}
      {canInstall && !isInstalled && view === 'home' && (
        <div className="card mb-4 p-3 bg-blue-50 border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Download size={16} />
            <span>Instale o app para receber alertas!</span>
          </div>
          <button onClick={install} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-600">Instalar</button>
        </div>
      )}

      {/* ========== HOME VIEW ========== */}
      {view === 'home' && myStudents.length > 0 && (
        <>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Ola, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-500 text-sm">Portal do Responsável - NetEscol</p>
            </div>
          </div>

          {/* Notification permission banner */}
          {notifBannerVisible && (
            <div className="card mb-4 p-3 bg-amber-50 border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Bell size={16} />
                <span>Ative as notificações para receber alertas</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => { const ok = await requestNotificationPermission(); setNotifBannerVisible(!ok && Notification.permission === 'default'); }} className="bg-amber-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-amber-600">Ativar</button>
                <button onClick={() => setNotifBannerVisible(false)} className="text-amber-400 hover:text-amber-600"><X size={16} /></button>
              </div>
            </div>
          )}

          {/* Active trip alert */}
          {activeTrip && (
            <button onClick={() => setView('transporte')}
              className="w-full card mb-4 p-3 bg-green-50 border-green-200 flex items-center gap-3 hover:bg-green-100 transition-all">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                <Bus size={20} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-green-800 text-sm">{currentStudent?.name?.split(' ')[0]} esta em rota!</p>
                <p className="text-green-600 text-xs">{activeTrip.route?.name} - Toque para rastrear</p>
              </div>
              <ChevronRight size={16} className="text-green-400" />
            </button>
          )}

          {/* Unread notifications alert */}
          {unreadCount > 0 && (
            <button onClick={() => setView('notificacoes')} className="w-full card mb-4 p-3 bg-orange-50 border-orange-200 flex items-center gap-3 hover:bg-orange-100 transition-colors text-left">
              <Bell size={18} className="text-orange-500" />
              <p className="text-orange-700 text-sm flex-1">Voce tem <strong>{unreadCount}</strong> notificacao(oes) nao lida(s)</p>
              <ChevronRight size={16} className="text-orange-400" />
            </button>
          )}

          {/* Module Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              { id: 'boletim' as PortalView, label: 'Boletim', icon: GraduationCap, color: 'bg-blue-500', badge: null },
              { id: 'frequência' as PortalView, label: 'Frequência', icon: Clock, color: 'bg-green-500', badge: null },
              { id: 'parecer' as PortalView, label: 'Parecer', icon: ClipboardList, color: 'bg-purple-500', badge: null },
              { id: 'ocorrências' as PortalView, label: 'Ocorrências', icon: AlertTriangle, color: 'bg-orange-500', badge: null },
              { id: 'calendario' as PortalView, label: 'Calendário', icon: Calendar, color: 'bg-teal-500', badge: null },
              { id: 'merenda' as PortalView, label: 'Merenda', icon: UtensilsCrossed, color: 'bg-pink-500', badge: null },
              { id: 'mensagens' as PortalView, label: 'Chat', icon: MessageCircle, color: 'bg-indigo-500', badge: unreadMsgCount > 0 ? unreadMsgCount : null },
              { id: 'declarações' as PortalView, label: 'Declarações', icon: FileText, color: 'bg-gray-500', badge: null },
              { id: 'transporte' as PortalView, label: 'Transporte', icon: Bus, color: 'bg-primary-500', badge: activeTrip ? 'AO VIVO' : null },
            ].map(mod => (
              <button key={mod.id} onClick={() => setView(mod.id)}
                className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all relative group">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${mod.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <mod.icon size={22} className="text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 leading-tight text-center">{mod.label}</span>
                {mod.badge && (
                  <span className={`absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    mod.badge === 'AO VIVO' ? 'bg-green-500 text-white animate-pulse' : 'bg-red-500 text-white'
                  }`}>
                    {mod.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Card do aluno selecionado */}
          {currentStudent && (
            <div className="mt-4 card p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {currentStudent.photoUrl ? <img src={currentStudent.photoUrl} className="w-14 h-14 rounded-full object-cover" /> : <User size={24} className="text-primary-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{currentStudent.name}</p>
                  <p className="text-xs text-gray-500">{currentStudent.grade || ''} {currentStudent.shift === 'morning' ? '• Manhã' : currentStudent.shift === 'afternoon' ? '• Tarde' : ''}</p>
                  <p className="text-xs text-primary-600">{currentStudent.school || currentStudent.schoolName || ''}</p>
                </div>
                {currentStudent.routeName && (
                  <div className="bg-primary-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Bus size={10} /> {currentStudent.routeName.length > 15 ? currentStudent.routeName.substring(0, 15) + '...' : currentStudent.routeName}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Últimas notificações */}
          {notifs.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setView('notificacoes')} className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                <History size={14} /> Ultimas Atividades <ChevronRight size={12} className="ml-auto text-gray-400" />
              </button>
              <div className="space-y-2">
                {notifs.slice(0, 5).map((n: any) => (
                  <div key={n.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-sm ${n.isRead ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.type === 'student_boarded' ? 'bg-green-100 text-green-600' :
                      n.type === 'student_dropped' ? 'bg-blue-100 text-blue-600' :
                      n.type === 'student_absent' ? 'bg-red-100 text-red-600' :
                      n.type === 'trip_started' ? 'bg-amber-100 text-amber-600' :
                      n.type === 'trip_completed' ? 'bg-green-100 text-green-600' :
                      n.type === 'trip_cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {n.type === 'student_boarded' ? <CheckCircle size={14} /> :
                       n.type === 'student_dropped' ? <MapPin size={14} /> :
                       n.type === 'student_absent' ? <AlertTriangle size={14} /> :
                       n.type === 'trip_started' ? <Bus size={14} /> :
                       <Bell size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{n.title}</p>
                      <p className="text-[11px] text-gray-500 truncate">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vincular aluno button */}
          <button onClick={() => setView('vincular')}
            className="w-full mt-4 card p-3 flex items-center gap-3 text-gray-500 hover:text-primary-600 hover:border-primary-200 transition-all">
            <Plus size={18} /> <span className="text-sm font-medium">Vincular outro aluno</span>
          </button>
        </>
      )}

      {/* ========== BOLETIM VIEW ========== */}
      {view === 'boletim' && currentStudent && <BoletimView key={currentStudent.id} student={currentStudent} onBack={goHome} />}

      {/* ========== FREQUENCIA VIEW ========== */}
      {view === 'frequência' && currentStudent && <FrequenciaView key={currentStudent.id} student={currentStudent} onBack={goHome} />}

      {/* ========== PARECER VIEW ========== */}
      {view === 'parecer' && currentStudent && <ParecerView key={currentStudent.id} student={currentStudent} onBack={goHome} />}

      {/* ========== OCORRENCIAS VIEW ========== */}
      {view === 'ocorrências' && currentStudent && <OcorrenciasView key={currentStudent.id} student={currentStudent} onBack={goHome} />}

      {/* ========== CALENDARIO VIEW ========== */}
      {view === 'calendario' && currentStudent && <CalendarioView student={currentStudent} onBack={goHome} />}

      {/* ========== MERENDA VIEW ========== */}
      {view === 'merenda' && currentStudent && <MerendaView student={currentStudent} onBack={goHome} />}

      {/* ========== MENSAGENS VIEW ========== */}
      {view === 'mensagens' && (
        <div>
          <BackButton onClick={goHome} />
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4"><MessageCircle size={20} className="text-indigo-500" /> Chat</h2>
          <ChatWidget embedded />
        </div>
      )}

      {/* ========== DECLARACOES VIEW ========== */}
      {view === 'declarações' && currentStudent && <DeclaracoesView key={currentStudent.id} student={currentStudent} onBack={goHome} />}

      {/* ========== TRANSPORTE VIEW ========== */}
      {view === 'transporte' && currentStudent && (
        <TransporteView
          student={currentStudent}
          activeTrip={activeTrip}
          busLocation={busLocation}
          connected={connected}
          notifs={notifs}
          onRefresh={() => loadActiveTrip(currentStudent.id)}
          onBack={goHome}
        />
      )}

      {/* ========== NOTIFICACOES VIEW ========== */}
      {view === 'notificacoes' && (
        <div>
          <BackButton onClick={goHome} />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Bell size={20} /> Notificacoes</h2>
            {unreadCount > 0 && (
              <button onClick={async () => { await api.notifications.markAllAsRead(); loadNotifications(); }}
                className="text-xs text-primary-600 hover:underline font-medium">Marcar todas como lidas</button>
            )}
          </div>
          <div className="space-y-2">
            {notifs.map((n: any) => (
              <button key={n.id} onClick={async () => { if (!n.isRead) { await api.notifications.markAsRead({ id: n.id }); loadNotifications(); } }}
                className={`w-full flex items-start gap-2.5 p-3 rounded-xl border text-sm text-left transition-colors ${n.isRead ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.type === 'student_boarded' ? 'bg-green-100 text-green-600' :
                  n.type === 'student_dropped' ? 'bg-blue-100 text-blue-600' :
                  n.type === 'student_absent' ? 'bg-red-100 text-red-600' :
                  n.type === 'trip_started' ? 'bg-amber-100 text-amber-600' :
                  n.type === 'trip_completed' ? 'bg-green-100 text-green-600' :
                  n.type === 'trip_cancelled' ? 'bg-red-100 text-red-600' :
                  n.type?.includes('chat') ? 'bg-indigo-100 text-indigo-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {n.type === 'student_boarded' ? <CheckCircle size={15} /> :
                   n.type === 'student_dropped' ? <MapPin size={15} /> :
                   n.type === 'student_absent' ? <AlertTriangle size={15} /> :
                   n.type === 'trip_started' ? <Bus size={15} /> :
                   n.type === 'trip_completed' ? <CheckCircle size={15} /> :
                   n.type === 'trip_cancelled' ? <X size={15} /> :
                   n.type?.includes('chat') ? <MessageCircle size={15} /> :
                   <Bell size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{n.title}</p>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
              </button>
            ))}
            {notifs.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Bell size={40} className="mx-auto mb-3 opacity-50" />
                <p>Nenhuma notificacao</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== VINCULAR VIEW ========== */}
      {view === 'vincular' && (
        <div>
          <BackButton onClick={goHome} />
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg"><Plus size={18} /> Vincular Aluno</h3>
            <p className="text-sm text-gray-500 mb-4">Informe a matricula escolar do aluno para vincula-lo ao seu perfil.</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Matrícula do Aluno</label>
                <input type="text" value={addEnrollment} onChange={e => setAddEnrollment(e.target.value)}
                  placeholder="Ex: 2024001" className="w-full border rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Parentesco</label>
                <select value={addRelationship} onChange={e => setAddRelationship(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm">
                  <option value="father">Pai</option>
                  <option value="mother">Mae</option>
                  <option value="grandparent">Avo/Avo</option>
                  <option value="uncle">Tio/Tia</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <button onClick={handleAddStudent} className="w-full bg-primary-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition">
                Vincular Aluno
              </button>
              {addMsg && <p className={`text-sm text-center ${addMsg.startsWith('OK:') ? 'text-green-600' : 'text-red-600'}`}>{addMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// BOLETIM VIEW
// =============================================
function BoletimView({ student, onBack }: { student: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [reportCard, setReportCard] = useState<any>(null);
  const [enrollmentInfo, setEnrollmentInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [student.id]);

  async function loadData() {
    setLoading(true);
    try {
      const info = await api.guardians.studentEnrollmentInfo({ studentId: student.id });
      setEnrollmentInfo(info);
      if (info?.classId) {
        const rc = await api.guardians.studentReportCard({ studentId: student.id, classId: info.classId });
        setReportCard(rc);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <><BackButton onClick={onBack} /><LoadingSpinner text="Carregando boletim..." /></>;

  if (!enrollmentInfo) {
    return (
      <>
        <BackButton onClick={onBack} />
        <EmptyState icon={GraduationCap} title="Sem matricula ativa" description="O aluno não possui matricula ativa no momento." />
      </>
    );
  }

  const bimesters = ['1', '2', '3', '4'];

  function getScoreColor(score: number | null) {
    if (score === null) return 'text-gray-400';
    if (score >= 7) return 'text-green-600 font-semibold';
    if (score >= 5) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  }

  function getScoreBg(score: number | null) {
    if (score === null) return '';
    if (score >= 7) return 'bg-green-50';
    if (score >= 5) return 'bg-yellow-50';
    return 'bg-red-50';
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap size={20} className="text-blue-500" /> Boletim Escolar
        </h2>
        <p className="text-xs text-gray-500 mt-1">{enrollmentInfo.className} - {enrollmentInfo.academicYearName || enrollmentInfo.academicYear}</p>
      </div>

      {reportCard?.subjects?.length > 0 ? (
        <div className="space-y-3">
          {/* Summary */}
          {reportCard.summary?.average > 0 && (
            <div className="card p-3 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Media Geral</span>
                <span className={`text-2xl font-bold ${getScoreColor(reportCard.summary.average)}`}>
                  {reportCard.summary.average.toFixed(1)}
                </span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">Disciplina</th>
                    {bimesters.map(b => (
                      <th key={b} className="text-center py-2.5 px-2 font-semibold text-gray-700 w-14">B{b}</th>
                    ))}
                    <th className="text-center py-2.5 px-2 font-semibold text-gray-700 w-16">Media</th>
                    <th className="text-center py-2.5 px-2 font-semibold text-gray-700 w-14">Sit.</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCard.subjects.map((subj: any) => {
                    const averages = bimesters.map(b => subj.bimesters[b]?.average || null);
                    const validAverages = averages.filter((a: any) => a !== null && a > 0);
                    const finalAvg = validAverages.length > 0
                      ? Math.round((validAverages.reduce((s: number, a: number) => s + a, 0) / validAverages.length) * 100) / 100
                      : null;
                    const situation = finalAvg === null ? '-' : finalAvg >= 7 ? 'AP' : finalAvg >= 5 ? 'REC' : 'RP';
                    const sitColor = situation === 'AP' ? 'text-green-600' : situation === 'REC' ? 'text-yellow-600' : situation === 'RP' ? 'text-red-600' : 'text-gray-400';

                    return (
                      <tr key={subj.subjectId} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-700 whitespace-nowrap">{subj.subjectName}</td>
                        {bimesters.map(b => {
                          const avg = subj.bimesters[b]?.average || null;
                          return (
                            <td key={b} className={`text-center py-2.5 px-2 ${getScoreColor(avg)} ${getScoreBg(avg)}`}>
                              {avg !== null ? avg.toFixed(1) : '-'}
                            </td>
                          );
                        })}
                        <td className={`text-center py-2.5 px-2 font-bold ${getScoreColor(finalAvg)}`}>
                          {finalAvg !== null ? finalAvg.toFixed(1) : '-'}
                        </td>
                        <td className={`text-center py-2.5 px-2 font-bold text-xs ${sitColor}`}>{situation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-gray-400 px-1">
            <span className="text-green-600">AP</span> = Aprovado |{' '}
            <span className="text-yellow-600">REC</span> = Recuperacao |{' '}
            <span className="text-red-600">RP</span> = Reprovado
          </div>
        </div>
      ) : (
        <EmptyState icon={GraduationCap} title="Sem notas lancadas" description="Ainda não há notas lancadas para este aluno." />
      )}
    </>
  );
}

// =============================================
// FREQUENCIA VIEW
// =============================================
function FrequenciaView({ student, onBack }: { student: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [student.id]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.guardians.studentAttendance({ studentId: student.id });
      setAttendance(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <><BackButton onClick={onBack} /><LoadingSpinner text="Carregando frequência..." /></>;

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Clock size={20} className="text-green-500" /> Frequência Escolar
      </h2>

      {attendance && attendance.totalDays > 0 ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{attendance.totalDays}</p>
              <p className="text-xs text-gray-500">Dias letivos</p>
            </div>
            <div className="card p-3 text-center">
              <p className={`text-2xl font-bold ${attendance.percentPresent >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {attendance.percentPresent}%
              </p>
              <p className="text-xs text-gray-500">Presenca</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{attendance.absent}</p>
              <p className="text-xs text-gray-500">Faltas</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-bold text-yellow-500">{attendance.justified}</p>
              <p className="text-xs text-gray-500">Justificadas</p>
            </div>
          </div>

          {/* Percentage bar */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Taxa de presenca</span>
              <span className={`text-sm font-bold ${attendance.percentPresent >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {attendance.percentPresent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${attendance.percentPresent >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(attendance.percentPresent, 100)}%` }}
              />
            </div>
            {attendance.percentPresent < 75 && (
              <p className="text-xs text-red-500 mt-2">Atenção: frequência abaixo do mínimo de 75%</p>
            )}
          </div>

          {/* Monthly breakdown */}
          {attendance.monthly?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Frequência mensal</h3>
              <div className="space-y-2">
                {attendance.monthly.map((m: any) => {
                  const monthNames: Record<string, string> = {
                    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
                    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
                  };
                  const monthNum = m.month.split('-')[1];
                  const pct = m.total > 0 ? Math.round(((m.present + m.late + m.justified) / m.total) * 100) : 0;
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 w-8">{monthNames[monthNum] || monthNum}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                        <div className={`h-5 rounded-full ${pct >= 75 ? 'bg-green-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">{pct}%</span>
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">{m.absent}f</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={Clock} title="Sem registros de frequência" description="Ainda não há registros de frequência para este aluno." />
      )}
    </>
  );
}

// =============================================
// PARECER VIEW
// =============================================
function ParecerView({ student, onBack }: { student: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [pareceres, setPareceres] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [student.id]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.guardians.studentParecer({ studentId: student.id });
      setPareceres(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <><BackButton onClick={onBack} /><LoadingSpinner text="Carregando pareceres..." /></>;

  const bimesterNames: Record<string, string> = { '1': '1o Bimestre', '2': '2o Bimestre', '3': '3o Bimestre', '4': '4o Bimestre' };

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <ClipboardList size={20} className="text-purple-500" /> Parecer Descritivo
      </h2>

      {pareceres.length > 0 ? (
        <div className="space-y-3">
          {pareceres.map((p: any) => (
            <div key={p.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                  {bimesterNames[p.bimester] || `Bimestre ${p.bimester}`}
                </span>
                {p.className && <span className="text-xs text-gray-400">{p.className}</span>}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{p.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(p.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardList} title="Sem pareceres publicados" description="Nenhum parecer descritivo foi publicado para este aluno ainda." />
      )}
    </>
  );
}

// =============================================
// OCORRENCIAS VIEW
// =============================================
function OcorrenciasView({ student, onBack }: { student: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [occurrences, setOccurrences] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [student.id]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.guardians.studentOccurrences({ studentId: student.id });
      setOccurrences(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <><BackButton onClick={onBack} /><LoadingSpinner text="Carregando ocorrências..." /></>;

  const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
    indisciplina: { label: 'Indisciplina', color: 'text-red-700', bg: 'bg-red-100' },
    elogio: { label: 'Elogio', color: 'text-green-700', bg: 'bg-green-100' },
    advertencia: { label: 'Advertencia', color: 'text-orange-700', bg: 'bg-orange-100' },
    suspensao: { label: 'Suspensao', color: 'text-red-700', bg: 'bg-red-100' },
    atraso: { label: 'Atraso', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    saude: { label: 'Saude', color: 'text-blue-700', bg: 'bg-blue-100' },
    outro: { label: 'Outro', color: 'text-gray-700', bg: 'bg-gray-100' },
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <AlertTriangle size={20} className="text-orange-500" /> Ocorrências
      </h2>

      {occurrences.length > 0 ? (
        <div className="space-y-3">
          {occurrences.map((occ: any) => {
            const cfg = typeConfig[occ.type] || typeConfig.outro;
            return (
              <div key={occ.id} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(occ.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{occ.description}</p>
                {occ.action && (
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Providencia:</strong> {occ.action}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={AlertTriangle} title="Nenhuma ocorrência" description="Não há ocorrências registradas para este aluno." />
      )}
    </>
  );
}

// =============================================
// CALENDARIO VIEW
// =============================================
function CalendarioView({ student, onBack }: { student: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [student.id]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.guardians.schoolCalendar({ studentId: student.id });
      setEvents(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <><BackButton onClick={onBack} /><LoadingSpinner text="Carregando calendario..." /></>;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Events in current month
  const monthEvents = events.filter(e => {
    const d = new Date(e.startDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Event type colors
  const typeColors: Record<string, string> = {
    aula: 'bg-blue-400', feriado: 'bg-red-400', recesso: 'bg-orange-400',
    reuniao: 'bg-purple-400', conselho: 'bg-indigo-400', prova: 'bg-yellow-400',
    evento: 'bg-green-400', outro: 'bg-gray-400',
  };

  function getDayEvents(day: number) {
    return events.filter(e => {
      const start = new Date(e.startDate);
      const end = e.endDate ? new Date(e.endDate) : start;
      const check = new Date(year, month, day);
      return check >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
             check <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
    });
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Calendar size={20} className="text-teal-500" /> Calendário Escolar
      </h2>

      {/* Month navigation */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <h3 className="font-semibold text-gray-700">{monthNames[month]} {year}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getDayEvents(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            return (
              <div key={day} className={`py-1.5 text-xs rounded-lg relative ${isToday ? 'bg-primary-100 font-bold text-primary-700' : 'text-gray-700'}`}>
                {day}
                {dayEvents.length > 0 && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e: any, idx: number) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${typeColors[e.eventType] || 'bg-gray-400'}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      {monthEvents.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600">Eventos do mes</h3>
          {monthEvents.map((e: any) => (
            <div key={e.id} className="card flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${typeColors[e.eventType] || 'bg-gray-400'}`} />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-700">{e.title}</p>
                <p className="text-xs text-gray-400">
                  {new Date(e.startDate).toLocaleDateString('pt-BR')}
                  {e.endDate && ` - ${new Date(e.endDate).toLocaleDateString('pt-BR')}`}
                </p>
                {e.description && <p className="text-xs text-gray-500 mt-1">{e.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum evento neste mes</p>
      )}
    </>
  );
}

// =============================================
// MERENDA VIEW
// =============================================
function MerendaView({ student, onBack }: { student: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [student.id]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.guardians.schoolMenu({ studentId: student.id });
      setMenus(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <><BackButton onClick={onBack} /><LoadingSpinner text="Carregando cardapio..." /></>;

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Cafe da manha',
    lunch: 'Almoco',
    snack: 'Lanche',
    dinner: 'Jantar',
  };

  const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <UtensilsCrossed size={20} className="text-pink-500" /> Cardapio da Merenda
      </h2>

      {menus.length > 0 ? (
        <div className="space-y-3">
          {menus.map((menu: any) => {
            const date = new Date(menu.date);
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <div key={menu.id} className={`card ${isToday ? 'border-pink-300 bg-pink-50/30' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-gray-700">
                      {dayNames[date.getDay()]} - {date.toLocaleDateString('pt-BR')}
                    </p>
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                      {mealTypeLabels[menu.mealType] || menu.mealType}
                    </span>
                  </div>
                  {isToday && (
                    <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">HOJE</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{menu.description}</p>
                {menu.calories && (
                  <p className="text-xs text-gray-400 mt-1">{menu.calories} kcal</p>
                )}
                {menu.notes && (
                  <p className="text-xs text-gray-400 mt-1 italic">{menu.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={UtensilsCrossed} title="Sem cardapio disponivel" description="Nenhum cardapio foi publicado para a escola do aluno." />
      )}
    </>
  );
}

// =============================================
// MENSAGENS VIEW
// =============================================
function MensagensView({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.guardians.myMessages();
      setMessages(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <><BackButton onClick={onBack} /><LoadingSpinner text="Carregando mensagens..." /></>;

  const priorityConfig: Record<string, { label: string; color: string }> = {
    urgent: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
    important: { label: 'Importante', color: 'bg-orange-100 text-orange-700' },
    normal: { label: '', color: '' },
  };

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <MessageCircle size={20} className="text-indigo-500" /> Mensagens
      </h2>

      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg: any) => {
            const pCfg = priorityConfig[msg.priority] || priorityConfig.normal;
            return (
              <div key={msg.id} className="card">
                <div className="flex items-center gap-2 mb-1.5">
                  {pCfg.label && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pCfg.color}`}>{pCfg.label}</span>
                  )}
                  <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <h3 className="font-semibold text-sm text-gray-800 mb-1">{msg.title}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-2">De: {msg.senderName}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={MessageCircle} title="Nenhuma mensagem" description="Você não possui mensagens no momento." />
      )}
    </>
  );
}

// =============================================
// DECLARACOES VIEW
// =============================================
// Mapeamento de generatorKey → função geradora
const GENERATORS: Record<string, (student: any, school: any, mun: any, sec: any, sigs: any[]) => string> = {
  declaracaoEscolaridade: generateDeclaracaoEscolaridade,
  declaracaoFrequencia: (s, sch, m, sec, sigs) => generateDeclaracaoFrequencia(s, sch, m, sec, sigs),
  declaracaoTransferencia: generateDeclaracaoTransferencia,
  fichaMatricula: generateFichaMatricula,
};

function DeclaracoesView({ student, onBack }: { student: any; onBack: () => void }) {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [types, setTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [successCode, setSuccessCode] = useState('');
  const [munReport, setMunReport] = useState<any>(null);
  const [schoolsData, setSchoolsData] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, r, mr, sch] = await Promise.all([
        api.declarations.types({ municipalityId: mid, onlyParent: true }),
        api.declarations.listRequests({ municipalityId: mid }),
        getMunicipalityReport(mid, api),
        api.schools.list({ municipalityId: mid }),
      ]);
      setTypes(t || []);
      setRequests((r || []).filter((req: any) => req.studentName === student.name));
      setMunReport(mr);
      setSchoolsData(sch || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleRequest() {
    if (!selectedType) return;
    setSubmitting(true);
    try {
      // Para "outro", usar primeiro tipo manual como base ou criar nota descritiva
      const typeId = selectedType === 'outro' ? (manualTypes[0]?.id || types[0]?.id) : parseInt(selectedType);
      if (!typeId) { setSuccessCode('Erro: nenhum tipo disponível'); return; }
      const finalNotes = selectedType === 'outro' ? `[OUTRO DOCUMENTO] ${notes}` : (notes || undefined);
      const result = await api.declarations.request({
        municipalityId: mid,
        declarationTypeId: typeId,
        studentId: student.id,
        notes: finalNotes,
      });
      setSuccessCode(result.requestCode);
      setSelectedType('');
      setNotes('');
      loadData();
    } catch {}
    finally { setSubmitting(false); }
  }

  const autoTypes = types.filter((t: any) => t.autoGenerate);
  const manualTypes = types.filter((t: any) => !t.autoGenerate);

  async function generateAutoDoc(t: any) {
    setGeneratingId(t.id);
    try {
      let html = '';
      const school = loadSchoolData(student.schoolId, schoolsData);
      const mun = munReport?.municipality;
      const sec = munReport?.secretaria;
      // No portal do pai, nunca incluir assinatura manual - o bloco eletrônico é injetado pelo backend
      const sigs: any[] = [];

      const genKey = t.documentKey;
      if (genKey === 'decl_escolaridade') html = generateDeclaracaoEscolaridade(student, school, mun, sec, sigs);
      else if (genKey === 'decl_frequencia') html = generateDeclaracaoFrequencia(student, school, mun, sec, sigs);
      else if (genKey === 'decl_transferencia') html = generateDeclaracaoTransferencia(student, school, mun, sec, sigs);
      else if (genKey === 'ficha_matricula') html = generateFichaMatricula(student, school, mun, sec, sigs);
      else if (genKey === 'boletim') {
        try {
          const rc = await api.guardians.studentReportCard({ studentId: student.id });
          // Transformar formato do studentReportCard para o formato do generateBoletimEscolar
          const grades = (rc?.subjects || []).map((s: any) => {
            const bims = s.bimesters || {};
            return {
              subject: s.subjectName,
              b1: bims['1']?.average || null,
              b2: bims['2']?.average || null,
              b3: bims['3']?.average || null,
              b4: bims['4']?.average || null,
              faltas: 0,
            };
          });
          html = generateBoletimEscolar(student, grades, school, mun, sec, sigs);
        } catch {}
      } else if (genKey === 'historico') {
        try {
          const [history, rc] = await Promise.all([
            api.studentHistory.list({ studentId: student.id, municipalityId: mid }),
            api.guardians.studentReportCard({ studentId: student.id }).catch(() => null),
          ]);
          // Anos anteriores
          const histFormatted = (history || []).map((h: any) => ({
            year: h.year, grade: h.grade, school: h.schoolName,
            result: h.result || 'Aprovado',
          }));
          // Ano atual com notas do boletim
          if (rc?.subjects?.length > 0) {
            const currentGrades = rc.subjects.map((s: any) => {
              const bims = s.bimesters || {};
              return { subject: s.subjectName, b1: bims['1']?.average || null, b2: bims['2']?.average || null, b3: bims['3']?.average || null, b4: bims['4']?.average || null, faltas: 0 };
            });
            histFormatted.push({
              year: new Date().getFullYear(), grade: student.grade || 'A',
              school: school?.name || student.schoolName || '', result: 'Cursando',
              grades: currentGrades,
            });
          }
          html = generateHistoricoEscolar(student, histFormatted, school, mun, sec, sigs);
        } catch {}
      }
      // Fallback: tentar gerar via backend (template do banco)
      if (!html) {
        try {
          const result = await api.declarations.generatePdf({ declarationTypeId: t.id, studentId: student.id, municipalityId: mid });
          html = result?.html || '';
        } catch {}
      }
      if (!html) {
        setSuccessCode('Erro: documento sem modelo configurado. Solicite ao administrador.');
        return;
      }
      if (html) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${window.location.origin}/api/pdf/generate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ html, orientation: 'portrait', docType: 'declaracao', docTitle: `${t.name} - ${student.name}`, systemAutoSignerId: t.systemAutoSign && t.signerId ? t.signerId : undefined, studentId: student.id }),
        });
        if (res.ok) {
          const blob = await res.blob(); const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `${t.name.replace(/\s/g, '_')}_${student.name.split(' ')[0]}.pdf`; a.click(); URL.revokeObjectURL(url);
          setSuccessCode('PDF gerado com sucesso!');
        } else { const err = await res.json().catch(() => ({})); setSuccessCode('Erro: ' + (err.error || 'falha')); }
      } else { setSuccessCode('Erro: não foi possível gerar'); }
    } catch (err: any) { setSuccessCode('Erro: ' + (err.message || 'falha')); }
    finally { setGeneratingId(null); }
  }

  const statusLabel: any = { pending: 'Pendente', processing: 'Em Processamento', ready: 'Pronta', rejected: 'Recusada', cancelled: 'Cancelada' };
  const statusColor: any = { pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700', ready: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' };

  if (loading) return <><BackButton onClick={onBack} /><div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div></>;

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <FileText size={20} className="text-gray-500" /> Declarações
      </h2>

      {/* Sucesso */}
      {successCode && (
        <div className="card mb-4 p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Solicitação enviada!</p>
              <p className="text-xs text-green-600">Código: <strong>{successCode}</strong> — Acompanhe o status abaixo.</p>
            </div>
          </div>
          <button onClick={() => setSuccessCode('')} className="text-xs text-green-500 mt-2 hover:underline">Fechar</button>
        </div>
      )}

      {/* Dados do aluno */}
      <div className="card mb-4 p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
            <p className="text-xs text-gray-500">{student.enrollment ? 'Mat. ' + student.enrollment + ' • ' : ''}{student.grade || ''} • {student.schoolName || ''}</p>
          </div>
        </div>
      </div>

      {/* ═══════ SEÇÃO 1: GERAR DOCUMENTO AUTOMÁTICO ═══════ */}
      {autoTypes.length > 0 && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center"><Download size={12} className="text-green-600" /></div>
            Gerar Documento Automático
          </h3>
          <p className="text-xs text-gray-400 mb-3">Clique para baixar o PDF na hora</p>
          <div className="space-y-2">
            {autoTypes.map((t: any) => (
              <button key={t.id} disabled={generatingId !== null} onClick={() => generateAutoDoc(t)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-green-300 hover:bg-green-50 transition-colors text-left disabled:opacity-50">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{t.name}</p>
                  {t.description && <p className="text-[10px] text-gray-400">{t.description}</p>}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1.5 rounded-lg flex-shrink-0">
                  {generatingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} {generatingId === t.id ? 'Gerando...' : 'PDF'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ SEÇÃO 2: SOLICITAR DOCUMENTO ═══════ */}
      <div className="card mb-4 p-4">
        <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center"><FileText size={12} className="text-primary-600" /></div>
          Solicitar Documento
        </h3>
        <p className="text-xs text-gray-400 mb-3">Selecione o documento que precisa e envie sua solicitação</p>

        {/* Opções com radio buttons */}
        <div className="space-y-1.5 mb-3">
          {manualTypes.map((t: any) => (
            <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedType === String(t.id) ? 'border-primary-300 bg-primary-50' : 'hover:bg-gray-50'}`}>
              <input type="radio" name="docType" checked={selectedType === String(t.id)} onChange={() => setSelectedType(String(t.id))} className="w-4 h-4 text-primary-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{t.name}</p>
                {t.description && <p className="text-[10px] text-gray-400">{t.description}</p>}
              </div>
            </label>
          ))}

          {/* Opção "Outro" sempre disponível */}
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedType === 'outro' ? 'border-primary-300 bg-primary-50' : 'hover:bg-gray-50'}`}>
            <input type="radio" name="docType" checked={selectedType === 'outro'} onChange={() => setSelectedType('outro')} className="w-4 h-4 text-primary-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Outro documento</p>
              <p className="text-[10px] text-gray-400">Especifique nas observações</p>
            </div>
          </label>
        </div>

        {/* Observações + botão enviar */}
        {selectedType && (
          <div className="border-t pt-3 space-y-3">
            <textarea className="input" rows={2} placeholder={selectedType === 'outro' ? 'Descreva o documento que precisa...' : 'Observações (opcional)'} value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => { setSelectedType(''); setNotes(''); }} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={() => {
                if (selectedType === 'outro' && !notes.trim()) return;
                handleRequest();
              }} disabled={submitting || (selectedType === 'outro' && !notes.trim())} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><FileText size={14} /> Enviar Solicitação</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ SEÇÃO 3: MINHAS SOLICITAÇÕES ═══════ */}
      {requests.length > 0 && (
        <div className="card mb-4 p-4">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center"><History size={12} className="text-amber-600" /></div>
            Minhas Solicitações
          </h3>
          <div className="space-y-2">
            {requests.map((r: any) => (
              <div key={r.id} className={`p-3 rounded-xl border ${r.status === 'ready' ? 'border-green-200 bg-green-50' : r.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-800 text-sm">{r.typeName}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-500'}`}>
                    {statusLabel[r.status] || r.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Código: <strong>{r.requestCode}</strong> • {r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                {r.responseNotes && <p className="text-xs mt-1 p-2 rounded bg-white border text-gray-600">{r.responseNotes}</p>}
                {r.status === 'ready' && <p className="text-xs text-green-700 mt-1 font-semibold flex items-center gap-1"><CheckCircle size={12} /> Documento disponível</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// =============================================
// TRANSPORTE VIEW (from GuardianPage)
// =============================================
function TransporteView({ student, activeTrip, busLocation, connected, notifs, onRefresh, onBack }: {
  student: any; activeTrip: any; busLocation: any; connected: boolean;
  notifs: any[]; onRefresh: () => void; onBack: () => void;
}) {
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const data = await api.guardians.studentTripHistory({ studentId: student.id, limit: 20 });
      setTripHistory(data || []);
    } catch (e) { console.error(e); }
    finally { setHistoryLoading(false); }
  }

  return (
    <>
      <BackButton onClick={onBack} />
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Bus size={20} className="text-primary-500" /> Transporte Escolar
      </h2>

      <div className="space-y-4">
        {activeTrip ? (
          <>
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                    <Bus size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activeTrip.route?.name}</p>
                    <p className="text-xs text-gray-500">{activeTrip.vehicle?.plate} - {activeTrip.driverName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Ao vivo</span>
                </div>
              </div>
              <LiveMap driverLocation={busLocation} stops={activeTrip.stops} />
            </div>

            <div className="card">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><MapPin size={14} /> Paradas da rota</p>
              <div className="space-y-2">
                {activeTrip.stops?.map((s: any, i: number) => (
                  <div key={s.id} className={`flex items-center gap-3 p-2 rounded-lg ${s.isStudentStop ? 'bg-primary-50 border border-primary-200' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.arrived ? 'bg-green-500 text-white' : s.isStudentStop ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {s.arrived ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${s.isStudentStop ? 'font-semibold text-primary-700' : s.arrived ? 'text-gray-400 line-through' : ''}`}>
                        {s.name} {s.isStudentStop && <span className="text-xs text-primary-500 ml-1">parada do aluno</span>}
                      </p>
                    </div>
                    {s.arrivedAt && <span className="text-xs text-green-600">{new Date(s.arrivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    {!s.arrived && s.estimatedArrivalMinutes != null && (
                      <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
                        <Clock size={10} /> ~{s.estimatedArrivalMinutes}min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {activeTrip.driverPhone && (
              <div className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-700">{activeTrip.driverName?.charAt(0)}</div>
                  <div><p className="font-medium text-sm">{activeTrip.driverName}</p><p className="text-xs text-gray-500">Motorista</p></div>
                </div>
                <a href={`tel:${activeTrip.driverPhone}`} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm"><Phone size={14} /> Ligar</a>
              </div>
            )}
          </>
        ) : (
          <div className="card text-center py-10">
            <Bus size={48} className="text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600 mb-1">Nenhuma viagem ativa</h3>
            <p className="text-gray-400 text-sm">O onibus de {student.name?.split(' ')[0]} nao esta em rota no momento.</p>
            <button onClick={onRefresh} className="mt-4 text-primary-500 text-sm flex items-center gap-1 mx-auto"><RefreshCw size={14} /> Atualizar</button>
          </div>
        )}

        {/* History toggle */}
        <button onClick={() => { setShowHistory(!showHistory); if (!showHistory && tripHistory.length === 0) loadHistory(); }}
          className="w-full card p-3 flex items-center justify-between text-sm text-gray-600 hover:text-primary-600 transition-all">
          <span className="flex items-center gap-2"><History size={16} /> Historico de viagens</span>
          <ChevronRight size={16} className={`transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>

        {showHistory && (
          <div className="space-y-2">
            {historyLoading ? (
              <LoadingSpinner text="Carregando historico..." />
            ) : tripHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma viagem registrada</p>
            ) : (
              tripHistory.map((item: any) => (
                <div key={item.trip?.id} className="card flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.trip?.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {item.trip?.status === 'completed' ? <CheckCircle size={16} className="text-green-600" /> : <Bus size={16} className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.route?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.trip?.tripDate).toLocaleDateString('pt-BR')} - {item.trip?.status === 'completed' ? 'Concluida' : item.trip?.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* Chat Widget - comunicacao direta com a escola */}
      <ChatWidget />
    </>
  );
}
