import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, MapPin, Clock, User, Wifi, WifiOff, Navigation, AlertCircle, CheckCircle, Activity, ChevronRight, Plus, X, Eye, EyeOff, Camera, Phone, FileText, Users } from 'lucide-react';

function PhotoUpload({ value, onChange, label }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-400" />}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r2 = new FileReader(); r2.onload = ev => onChange(ev.target?.result as string); r2.readAsDataURL(f); } }} />
    </div>
  );
}

const emptyForm = { name:'', email:'', phone:'', cpf:'', birthDate:'', address:'', city:'', password:'', confirmPassword:'', photo:'', certificationNumber:'', certificationExpiry:'', experience:'', observations:'' };

function LiveMap({ trips, locations }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link'); link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      const L = (window as any).L;
      const map = L.map(mapRef.current).setView([-15.78,-47.93],12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L) return;
    locations.forEach((loc: any, tripId: number) => {
      const icon = L.divIcon({ html:`<div style="background:#f97316;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🚌</div>`, className:'', iconSize:[36,36], iconAnchor:[18,18] });
      const trip = trips?.find((t: any) => t.trip.id === tripId);
      if (markersRef.current.has(tripId)) markersRef.current.get(tripId).setLatLng([loc.lat,loc.lng]);
      else { const m = L.marker([loc.lat,loc.lng],{icon}).addTo(mapInstanceRef.current).bindPopup(`<b>🚌 ${trip?.route?.name||'Ônibus'}</b><br>${new Date(loc.updatedAt).toLocaleTimeString('pt-BR')}`); markersRef.current.set(tripId,m); mapInstanceRef.current.setView([loc.lat,loc.lng],14); }
    });
  }, [locations,trips]);
  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full"/>
      {locations.size===0 && <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90"><div className="text-center"><Navigation size={40} className="text-gray-300 mx-auto mb-2"/><p className="text-gray-500 text-sm">Aguardando posições GPS...</p></div></div>}
    </div>
  );
}

export default function MonitorPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const municipalityId = user?.municipalityId || 0;
  const [tab, setTab] = useState<'live'|'monitors'>('live');
  const [busLocations, setBusLocations] = useState<Map<number,any>>(new Map());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [monitors, setMonitors] = useState([
    { id:1, name:'Maria Santos', cpf:'111.222.333-44', phone:'(63) 98888-1111', email:'maria@escola.gov.br', certificationNumber:'MON-2024-001', certificationExpiry:'2026-12-31', experience:'3', status:'active', photo:'', routeName:'Rota Centro', observations:'Especializada em alunos com NEE' },
    { id:2, name:'Carlos Oliveira', cpf:'555.666.777-88', phone:'(63) 97777-2222', email:'carlos@escola.gov.br', certificationNumber:'MON-2024-002', certificationExpiry:'2025-06-30', experience:'1', status:'active', photo:'', routeName:'Rota Norte', observations:'' },
  ]);
  const { data: activeTrips, refetch } = useQuery(() => api.trips.listActive({ municipalityId }), [municipalityId]);

  useEffect(() => {
    if (socket && municipalityId) socket.emit('join:municipality', municipalityId);
  }, [socket, municipalityId]);
  useEffect(() => {
    if (!socket) return;
    socket.on('bus:location', (data: any) => setBusLocations(prev => { const n = new Map(prev); n.set(data.tripId,{...data,updatedAt:new Date()}); return n; }));
    socket.on('stop:arrived', (data: any) => { setEvents(prev => [{...data,type:'stop',time:new Date()},...prev.slice(0,19)]); refetch(); });
    socket.on('student:boarded', (data: any) => setEvents(prev => [{...data,type:'board',time:new Date()},...prev.slice(0,19)]));
    return () => { socket.off('bus:location'); socket.off('stop:arrived'); socket.off('student:boarded'); };
  }, [socket, refetch]);

  const set = (k: string) => (e: any) => setForm((f: any) => ({...f,[k]:e.target.value}));
  const trips = (activeTrips as any)||[];
  const sl = (s: string) => ({ started:'Em rota', completed:'Concluída', cancelled:'Cancelada', scheduled:'Agendada' }[s]||s);

  const saveMonitor = () => {
    if (!form.name || !form.phone) { setFormErr('Nome e telefone são obrigatórios.'); return; }
    if (form.password && form.password !== form.confirmPassword) { setFormErr('Senhas não coincidem.'); return; }
    const newId = Math.max(0,...monitors.map(m => m.id))+1;
    setMonitors(ms => [...ms, {...form, id:newId, status:'active'}]);
    setShowModal(false); setForm(emptyForm); setFormErr('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-gray-900">Monitoramento e Monitores</h1><p className="text-gray-500">GPS em tempo real e gestão de monitores</p></div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${connected?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>{connected?<><Wifi size={15}/> Conectado</>:<><WifiOff size={15}/> Desconectado</>}</div>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700"><Activity size={15}/> {trips.filter((t: any) => t.trip.status==='started').length} em rota</div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['live','Monitoramento ao Vivo',Navigation],['monitors','Monitores Cadastrados',Users]].map(([id,label,Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}><Icon size={14}/> {label}</button>
        ))}
      </div>

      {tab==='live' && (
        <>
          <div className="card p-4 mb-5">
            <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-gray-800 flex items-center gap-2"><Navigation size={16} className="text-primary-500"/> Mapa ao Vivo</h2><span className="text-xs text-gray-400">{busLocations.size} ônibus com GPS</span></div>
            <LiveMap trips={trips} locations={busLocations}/>
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Bus size={16}/> Viagens ativas ({trips.length})</h2>
              {!trips.length ? (<div className="card text-center py-12"><Bus size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500">Nenhuma viagem ativa</p></div>) : (
                <div className="space-y-3">
                  {trips.map((item: any) => {
                    const loc = busLocations.get(item.trip.id);
                    const isSelected = selectedTrip?.trip.id===item.trip.id;
                    return (
                      <div key={item.trip.id} onClick={() => setSelectedTrip(isSelected?null:item)} className={`card cursor-pointer transition-all ${isSelected?'border-primary-300 bg-primary-50/30':'hover:border-gray-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.trip.status==='started'?'bg-green-100':'bg-gray-100'}`}><Bus size={18} className={item.trip.status==='started'?'text-green-600':'text-gray-400'}/></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800">{item.route?.name||'Sem rota'}</p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              {item.driver && <span className="text-xs text-gray-500 flex items-center gap-1"><User size={10}/> {item.driver.name}</span>}
                              {item.trip.startedAt && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10}/> {new Date(item.trip.startedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {loc ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Navigation size={10}/> GPS ativo</span> : <span className={`text-xs px-2 py-0.5 rounded-full ${item.trip.status==='started'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-500'}`}>{sl(item.trip.status)}</span>}
                            <ChevronRight size={14} className={isSelected?'text-primary-500 rotate-90':'text-gray-300'}/>
                          </div>
                        </div>
                        {isSelected && <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2"><div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Alunos</p><p className="font-bold">{item.students?.length||0}</p></div><div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Paradas</p><p className="font-bold">{item.stops?.length||0}</p></div><div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Status</p><p className="font-bold text-xs">{sl(item.trip.status)}</p></div></div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Activity size={16}/> Eventos ao vivo</h2>
              <div className="card p-0 overflow-hidden">
                {!events.length ? (<div className="p-6 text-center text-gray-400 text-sm"><Activity size={28} className="mx-auto mb-2 text-gray-200"/><p>Sem eventos recentes</p></div>) : (
                  <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {events.map((ev,i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.type==='board'?'bg-green-100':'bg-blue-100'}`}>{ev.type==='board'?<CheckCircle size={14} className="text-green-600"/>:<MapPin size={14} className="text-blue-600"/>}</div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-700">{ev.type==='board'?'Aluno embarcou':'Parada chegou'}</p><p className="text-xs text-gray-500 truncate">{ev.studentName||ev.stopName||'—'}</p><p className="text-xs text-gray-400">{new Date(ev.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</p></div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50"><p className="text-xs text-gray-400 flex items-center gap-1"><AlertCircle size={10}/> Socket.IO em tempo real</p></div>
              </div>
            </div>
          </div>
        </>
      )}

      {tab==='monitors' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="text-lg font-semibold text-gray-800">Monitores Cadastrados</h2><p className="text-sm text-gray-500">{monitors.length} monitor(es) — auxiliam o motorista na supervisão dos alunos</p></div>
            <button onClick={() => { setForm(emptyForm); setFormErr(''); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Monitor</button>
          </div>
          <div className="grid gap-3">
            {monitors.map(m => (
              <div key={m.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center flex-shrink-0">
                  {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover"/> : <span className="font-bold text-teal-700 text-lg">{m.name[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-semibold text-gray-800">{m.name}</p><span className={`text-xs px-2 py-0.5 rounded-full ${m.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{m.status==='active'?'Ativo':'Inativo'}</span></div>
                  <div className="flex gap-3 flex-wrap mt-0.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {m.phone}</span>
                    {m.cpf && <span className="text-xs text-gray-500">{m.cpf}</span>}
                    {m.certificationNumber && <span className="text-xs text-gray-500 flex items-center gap-1"><FileText size={10}/> {m.certificationNumber}</span>}
                    {m.routeName && <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{m.routeName}</span>}
                  </div>
                  {m.observations && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.observations}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  {m.experience && <p className="text-xs text-gray-500">{m.experience} ano(s) exp.</p>}
                  {m.certificationExpiry && <p className="text-xs text-gray-400">Cert. até {new Date(m.certificationExpiry).toLocaleDateString('pt-BR')}</p>}
                </div>
              </div>
            ))}
            {!monitors.length && <div className="card text-center py-12"><Users size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500">Nenhum monitor cadastrado</p></div>}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold flex items-center gap-2"><Users size={18} className="text-teal-600"/> Novo Monitor</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
              <div className="flex justify-center">
                <PhotoUpload value={form.photo} onChange={(v: string) => setForm((f: any) => ({...f,photo:v}))} label="Foto do monitor (clique para importar)"/>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl">
                <p className="text-xs font-semibold text-teal-700 mb-3 flex items-center gap-2"><User size={13}/> Dados Pessoais</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Nome do monitor"/></div>
                  <div><label className="label">CPF</label><input className="input" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00"/></div>
                  <div><label className="label">Data de Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={set('birthDate')}/></div>
                  <div><label className="label">Telefone *</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="(00) 00000-0000"/></div>
                  <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={set('email')}/></div>
                  <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={set('address')}/></div>
                  <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={set('city')}/></div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-2"><FileText size={13}/> Certificação e Experiência</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Nº da Certificação</label><input className="input" value={form.certificationNumber} onChange={set('certificationNumber')} placeholder="MON-2024-001"/></div>
                  <div><label className="label">Validade da Certificação</label><input className="input" type="date" value={form.certificationExpiry} onChange={set('certificationExpiry')}/></div>
                  <div><label className="label">Anos de experiência</label><input className="input" type="number" min="0" value={form.experience} onChange={set('experience')} placeholder="Ex: 2"/></div>
                  <div><label className="label">Rota vinculada</label><input className="input" value={form.routeName} onChange={set('routeName')} placeholder="Ex: Rota Centro"/></div>
                  <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={2} value={form.observations} onChange={set('observations')} placeholder="Especializações, anotações importantes..."/></div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-700 mb-3">Acesso ao sistema (opcional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Senha</label>
                    <div className="relative"><input type={showPass?'text':'password'} className="input pr-10" value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres"/>
                      <button type="button" className="absolute right-3 top-2.5 text-gray-400" onClick={() => setShowPass(p => !p)}>{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button>
                    </div>
                  </div>
                  <div><label className="label">Confirmar Senha</label><input type="password" className="input" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repita a senha"/></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={saveMonitor} className="btn-primary flex-1">Salvar Monitor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                                                 }
