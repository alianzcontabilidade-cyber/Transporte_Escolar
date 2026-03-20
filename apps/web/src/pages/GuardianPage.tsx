import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { api } from '../lib/api';
import { Bus, Clock, CheckCircle, Bell, Phone, AlertTriangle, Navigation, MapPin, User, Plus, History, RefreshCw, ChevronRight, Shield, X, Download, MessageCircle } from 'lucide-react';
import { notifyUser, usePWAInstall } from '../lib/pwa';

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
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO &copy; OSM', maxZoom: 20 }).addTo(map);
      mapInstanceRef.current = map;

      // Adicionar paradas ao mapa
      if (stops) {
        stops.forEach((stop: any, i: number) => {
          const color = stop.arrived ? '#22c55e' : stop.isStudentStop ? '#f97316' : '#9ca3af';
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
          <div className="text-center"><Navigation size={32} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">Aguardando GPS do ônibus...</p></div>
        </div>
      )}
    </div>
  );
}

export default function GuardianPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [tab, setTab] = useState<'track' | 'notif' | 'history' | 'add'>('track');
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState<any>(null);
  const [addEnrollment, setAddEnrollment] = useState('');
  const [addRelationship, setAddRelationship] = useState('other');
  const [addMsg, setAddMsg] = useState('');
  const { canInstall, isInstalled, install } = usePWAInstall();

  // Carregar dados iniciais
  useEffect(() => {
    loadStudents();
    loadNotifications();
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

  // Carregar viagem ativa quando selecionar um aluno
  useEffect(() => {
    if (!selectedStudent) return;
    loadActiveTrip(selectedStudent.id);
    loadHistory(selectedStudent.id);
  }, [selectedStudent?.id]);

  async function loadActiveTrip(studentId: number) {
    try {
      const data = await api.guardians.getStudentActiveTrip({ studentId });
      setActiveTrip(data);
      if (data?.driverLocation) setBusLocation(data.driverLocation);
    } catch (e) { setActiveTrip(null); }
  }

  async function loadHistory(studentId: number) {
    try {
      const data = await api.guardians.studentTripHistory({ studentId, limit: 20 });
      setTripHistory(data || []);
    } catch (e) { console.error(e); }
  }

  // Entrar na sala do município para receber eventos Socket.IO
  useEffect(() => {
    if (!socket || !user?.municipalityId) return;
    socket.emit('join:municipality', user.municipalityId);
  }, [socket, user?.municipalityId]);

  // Socket.IO para localização em tempo real
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

  // Auto-refresh a cada 30s
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

  async function handleMarkAllRead() {
    await api.notifications.markAllAsRead();
    setUnreadCount(0);
    setNotifs(n => n.map(x => ({ ...x, isRead: true })));
  }

  const currentStudent = selectedStudent || myStudents[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center"><RefreshCw size={32} className="text-primary-500 animate-spin mx-auto mb-3" /><p className="text-gray-500">Carregando...</p></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Portal do Responsável</h1>
        <p className="text-gray-500 text-sm">Acompanhe o transporte escolar</p>
      </div>

      {/* Seleção de Aluno */}
      {myStudents.length > 0 && (
        <div className="card mb-4 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {currentStudent?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">{currentStudent?.name}</p>
              <p className="text-white/80 text-sm truncate">{currentStudent?.grade} · {currentStudent?.schoolName}</p>
              {currentStudent?.enrollment && <p className="text-white/60 text-xs">Mat. {currentStudent.enrollment}</p>}
            </div>
            <div>
              {currentStudent?.activeTrip ? (
                <span className="bg-green-400/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><Bus size={10} /> Em rota</span>
              ) : (
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">Sem viagem ativa</span>
              )}
            </div>
          </div>
          {myStudents.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {myStudents.map(s => (
                <button key={s.id} onClick={() => setSelectedStudent(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${s.id === currentStudent?.id ? 'bg-white text-primary-600' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                  {s.name?.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {myStudents.length === 0 && (
        <div className="card p-8 text-center mb-4">
          <Shield size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-2">Nenhum aluno vinculado</h3>
          <p className="text-gray-500 text-sm mb-4">Vincule um aluno usando a matrícula escolar para começar a acompanhar o transporte.</p>
          <button onClick={() => setTab('add')} className="btn-primary px-4 py-2 rounded-lg text-sm"><Plus size={14} className="inline mr-1" /> Vincular Aluno</button>
        </div>
      )}

      {/* PWA Install para pais */}
      {canInstall && !isInstalled && (
        <div className="card mb-4 p-3 bg-blue-50 border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Download size={16} />
            <span>Instale o app para receber alertas em tempo real!</span>
          </div>
          <button onClick={install} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-600">Instalar</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {([
          ['track', 'Rastreio', Navigation],
          ['notif', unreadCount > 0 ? `Alertas (${unreadCount})` : 'Alertas', Bell],
          ['history', 'Histórico', History],
          ['add', 'Vincular', Plus],
        ] as any[]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setTab(id); if (id === 'notif') handleMarkAllRead(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === id ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab: Rastreamento */}
      {tab === 'track' && currentStudent && (
        <div className="space-y-4">
          {/* Resumo de todos os alunos */}
          {myStudents.length > 1 && (
            <div className="card p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Status dos alunos</p>
              <div className="grid grid-cols-2 gap-2">
                {myStudents.map((s: any) => (
                  <button key={s.id} onClick={() => setSelectedStudent(s)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${s.id === currentStudent?.id ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s.activeTrip ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {s.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.name?.split(' ')[0]}</p>
                      <p className={`text-[10px] ${s.activeTrip ? 'text-green-600' : 'text-gray-400'}`}>
                        {s.activeTrip ? 'Em rota' : 'Sem viagem'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {activeTrip ? (
            <>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center"><Bus size={16} className="text-green-600" /></div>
                    <div>
                      <p className="font-semibold text-sm">{activeTrip.route?.name}</p>
                      <p className="text-xs text-gray-500">{activeTrip.vehicle?.plate} · {activeTrip.driverName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {connected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ao vivo</span>
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
                          {s.name} {s.isStudentStop && <span className="text-xs text-primary-500 ml-1">★ parada do aluno</span>}
                        </p>
                      </div>
                      {s.arrivedAt && <span className="text-xs text-green-600">{new Date(s.arrivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}
                      {!s.arrived && s.estimatedArrivalMinutes != null && (
                        <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
                          <Clock size={10} />
                          ~{s.estimatedArrivalMinutes}min
                          {s.isStudentStop && busLocation?.lat && ' restantes'}
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
              <p className="text-gray-400 text-sm">O ônibus de {currentStudent.name?.split(' ')[0]} não está em rota no momento.</p>
              <button onClick={() => loadActiveTrip(currentStudent.id)} className="mt-4 text-primary-500 text-sm flex items-center gap-1 mx-auto"><RefreshCw size={14} /> Atualizar</button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Notificações */}
      {tab === 'notif' && (
        <div className="space-y-2">
          {notifs.length === 0 ? (
            <div className="card text-center py-10"><Bell size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma notificação</p></div>
          ) : notifs.map(n => (
            <div key={n.id} className={`card flex items-start gap-3 ${!n.isRead ? 'border-primary-200 bg-primary-50/30' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                n.type === 'student_boarded' ? 'bg-green-100' :
                n.type === 'student_dropped' ? 'bg-blue-100' :
                n.type === 'delay' ? 'bg-yellow-100' :
                n.type === 'arrived' ? 'bg-orange-100' :
                n.type === 'trip_started' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                {n.type === 'student_boarded' ? <CheckCircle size={14} className="text-green-600" /> :
                 n.type === 'delay' ? <AlertTriangle size={14} className="text-yellow-600" /> :
                 n.type === 'arrived' ? <MapPin size={14} className="text-orange-600" /> :
                 n.type === 'trip_started' ? <Bus size={14} className="text-purple-600" /> :
                 <Bell size={14} className="text-gray-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} />{new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                <button onClick={(e) => { e.stopPropagation(); window.open('https://wa.me/?text=' + encodeURIComponent(n.title + ': ' + n.body), '_blank'); }} className="text-xs text-green-500 hover:underline mt-1 flex items-center gap-1"><MessageCircle size={10} /> Compartilhar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Histórico */}
      {tab === 'history' && (
        <div className="space-y-2">
          {tripHistory.length === 0 ? (
            <div className="card text-center py-10"><History size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma viagem registrada</p></div>
          ) : tripHistory.map((item: any) => (
            <div key={item.trip?.id} className="card flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.trip?.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {item.trip?.status === 'completed' ? <CheckCircle size={16} className="text-green-600" /> : <Bus size={16} className="text-gray-400" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.route?.name}</p>
                <p className="text-xs text-gray-500">{new Date(item.trip?.tripDate).toLocaleDateString('pt-BR')} · {item.trip?.status === 'completed' ? 'Concluída' : item.trip?.status}</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          ))}
        </div>
      )}

      {/* Tab: Vincular Aluno */}
      {tab === 'add' && (
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Vincular Novo Aluno</h3>
          <p className="text-sm text-gray-500 mb-4">Informe a matrícula escolar do aluno para vinculá-lo ao seu perfil.</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Matrícula do Aluno</label>
              <input type="text" value={addEnrollment} onChange={e => setAddEnrollment(e.target.value)}
                placeholder="Ex: 2024001" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Parentesco</label>
              <select value={addRelationship} onChange={e => setAddRelationship(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="father">Pai</option>
                <option value="mother">Mãe</option>
                <option value="grandparent">Avô/Avó</option>
                <option value="uncle">Tio/Tia</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <button onClick={handleAddStudent} className="w-full bg-primary-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition">Vincular Aluno</button>
            {addMsg && <p className={`text-sm text-center ${addMsg.startsWith('OK:') ? 'text-green-600' : 'text-red-600'}`}>{addMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
