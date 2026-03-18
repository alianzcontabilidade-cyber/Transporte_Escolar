import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { useSocket } from '../lib/socket';
import { School, Users, MapPin, Truck, Bus, Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, UserCheck } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const WEEK = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { connected } = useSocket();
  const municipalityId = user?.municipalityId || 0;

  const { data: schools } = useQuery(function() { return api.schools.list({ municipalityId }); }, [municipalityId]);
  const { data: students } = useQuery(function() { return api.students.list({ municipalityId }); }, [municipalityId]);
  const { data: routes } = useQuery(function() { return api.routes.list({ municipalityId }); }, [municipalityId]);
  const { data: drivers } = useQuery(function() { return api.drivers.list({ municipalityId }); }, [municipalityId]);
  const { data: vehicles } = useQuery(function() { return api.vehicles.list({ municipalityId }); }, [municipalityId]);
  const { data: activeTrips } = useQuery(function() { return api.trips.listActive({ municipalityId }); }, [municipalityId]);
  const { data: tripHistory } = useQuery(function() { return api.trips.history({ municipalityId }); }, [municipalityId]);

  const nSchools = (schools as any)?.length || 0;
  const nStudents = (students as any)?.length || 0;
  const nRoutes = (routes as any)?.length || 0;
  const nDrivers = (drivers as any)?.length || 0;
  const nVehicles = (vehicles as any)?.length || 0;
  const nTrips = (activeTrips as any)?.filter(function(t: any) { return t.trip?.status === 'started'; }).length || 0;
  const nActive = (activeTrips as any)?.length || 0;

  const weekData = (function() {
    var counts = [0, 0, 0, 0, 0, 0, 0];
    var now = new Date();
    var sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    if (tripHistory && Array.isArray(tripHistory)) {
      tripHistory.forEach(function(item: any) {
        var d = new Date(item.trip?.tripDate);
        if (d >= sevenDaysAgo && d <= now) {
          counts[d.getDay()] = counts[d.getDay()] + 1;
        }
      });
    }
    return WEEK.map(function(label, i) { return { day: label, viagens: counts[i] }; });
  })();
  const punctualityData = (function() {
    var total = [0, 0, 0, 0, 0, 0, 0];
    var completed = [0, 0, 0, 0, 0, 0, 0];
    var now = new Date();
    var sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    if (tripHistory && Array.isArray(tripHistory)) {
      tripHistory.forEach(function(item: any) {
        var d = new Date(item.trip?.tripDate);
        if (d >= sevenDaysAgo && d <= now) {
          var dow = d.getDay();
          total[dow] = total[dow] + 1;
          if (item.trip?.status === 'completed') {
            completed[dow] = completed[dow] + 1;
          }
        }
      });
    }
    return WEEK.map(function(label, i) {
      var pct = total[i] > 0 ? Math.round((completed[i] / total[i]) * 100) : 100;
      return { day: label, pct: pct };
    });
  })();

  const alerts: { type: string; msg: string; icon: any; color: string }[] = [];
  (vehicles as any)?.forEach(function(v: any) {
    if (v.crlvExpiry) {
      const d = Math.ceil((new Date(v.crlvExpiry).getTime() - Date.now()) / 86400000);
      if (d < 30) alerts.push({ type: 'warn', msg: `CRLV do veículo ${v.plate} ${d < 0 ? 'vencido há ' + Math.abs(d) + 'd' : 'vence em ' + d + 'd'}`, icon: AlertTriangle, color: d < 0 ? 'text-red-500' : 'text-yellow-500' });
    }
    if (v.ipvaExpiry) {
      const d = Math.ceil((new Date(v.ipvaExpiry).getTime() - Date.now()) / 86400000);
      if (d < 30) alerts.push({ type: 'warn', msg: `IPVA do veículo ${v.plate} ${d < 0 ? 'vencido há ' + Math.abs(d) + 'd' : 'vence em ' + d + 'd'}`, icon: AlertTriangle, color: d < 0 ? 'text-red-500' : 'text-yellow-500' });
    }
    if (v.inspectionExpiry) {
      const d = Math.ceil((new Date(v.inspectionExpiry).getTime() - Date.now()) / 86400000);
      if (d < 30) alerts.push({ type: 'warn', msg: `Vistoria do veículo ${v.plate} ${d < 0 ? 'vencida há ' + Math.abs(d) + 'd' : 'vence em ' + d + 'd'}`, icon: AlertTriangle, color: d < 0 ? 'text-red-500' : 'text-yellow-500' });
    }
    if (v.insuranceExpiry) {
      const d = Math.ceil((new Date(v.insuranceExpiry).getTime() - Date.now()) / 86400000);
      if (d < 30) alerts.push({ type: 'warn', msg: `Seguro do veículo ${v.plate} ${d < 0 ? 'vencido há ' + Math.abs(d) + 'd' : 'vence em ' + d + 'd'}`, icon: AlertTriangle, color: d < 0 ? 'text-red-500' : 'text-yellow-500' });
    }
    if (v.fireExtinguisherExpiry) {
      const d = Math.ceil((new Date(v.fireExtinguisherExpiry).getTime() - Date.now()) / 86400000);
      if (d < 30) alerts.push({ type: 'warn', msg: `Extintor do veículo ${v.plate} ${d < 0 ? 'vencido há ' + Math.abs(d) + 'd' : 'vence em ' + d + 'd'}`, icon: AlertTriangle, color: d < 0 ? 'text-red-500' : 'text-yellow-500' });
    }
  });
  (drivers as any)?.forEach(function(d: any) {
    const cnhDate = d.driver?.cnhExpiresAt || d.cnhExpiresAt || d.cnhExpiry;
    if (cnhDate) {
      const days = Math.ceil((new Date(cnhDate).getTime() - Date.now()) / 86400000);
      if (days < 30) alerts.push({ type: 'warn', msg: `CNH de ${d.user?.name || d.name} ${days < 0 ? 'vencida há ' + Math.abs(days) + 'd' : 'vence em ' + days + 'd'}`, icon: AlertTriangle, color: days < 0 ? 'text-red-500' : 'text-orange-500' });
    }
  });

  // Alertas detalhados de documentos
  const vehicleAlerts: any[] = [];
  const driverAlerts: any[] = [];

  if (vehicles && Array.isArray(vehicles)) {
    const allVehicles = vehicles as any[];
    allVehicles.forEach(function(v: any) {
      const checkDoc = function(date: any, docName: string) {
        if (!date) return;
        const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
        if (days <= 30) vehicleAlerts.push({ plate: v.plate, nickname: v.nickname, doc: docName, days: days });
      };
      checkDoc(v.crlvExpiry, 'CRLV');
      checkDoc(v.ipvaExpiry, 'IPVA');
      checkDoc(v.inspectionExpiry, 'Vistoria');
      checkDoc(v.insuranceExpiry, 'Seguro');
      checkDoc(v.fireExtinguisherExpiry, 'Extintor');
    });
  }

  if (drivers && Array.isArray(drivers)) {
    const allDrivers = drivers as any[];
    allDrivers.forEach(function(d: any) {
      const cnhDate = d.driver?.cnhExpiresAt || d.cnhExpiresAt || d.cnhExpiry;
      if (!cnhDate) return;
      const days = Math.ceil((new Date(cnhDate).getTime() - Date.now()) / 86400000);
      if (days <= 30) driverAlerts.push({ name: d.user?.name || d.name, category: d.driver?.cnhCategory || d.cnhCategory, days: days });
    });
  }

  vehicleAlerts.sort(function(a: any, b: any) { return a.days - b.days; });
  driverAlerts.sort(function(a: any, b: any) { return a.days - b.days; });

  const kpis = [
    { label: 'Escolas', value: nSchools, icon: School, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Alunos', value: nStudents, icon: Users, color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Rotas', value: nRoutes, icon: MapPin, color: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600' },
    { label: 'Motoristas', value: nDrivers, icon: Truck, color: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600' },
    { label: 'Veículos', value: nVehicles, icon: Bus, color: 'bg-yellow-500', light: 'bg-yellow-50', text: 'text-yellow-600' },
    { label: 'Viagens hoje', value: nTrips, icon: Activity, color: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Bem-vindo, {user?.name?.split(' ')[0]}. {new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}/>
          {connected ? 'Tempo real ativo' : 'Desconectado'}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(function(k) { return (
          <div key={k.label} className="card text-center p-4">
            <div className={`w-10 h-10 ${k.light} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <k.icon size={20} className={k.text}/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ); })}
      </div>

      {/* Status operacional */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4 bg-gradient-to-br from-primary-50 to-orange-50 border-orange-200">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0"><Activity size={22} className="text-white"/></div>
          <div><p className="text-sm text-gray-500">Em rota agora</p><p className="text-3xl font-bold text-gray-900">{nTrips}</p></div>
        </div>
        <div className="card flex items-center gap-4 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle size={22} className="text-white"/></div>
          <div><p className="text-sm text-gray-500">Viagens agendadas</p><p className="text-3xl font-bold text-gray-900">{nActive}</p></div>
        </div>
        <div className="card flex items-center gap-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0"><AlertTriangle size={22} className="text-white"/></div>
          <div><p className="text-sm text-gray-500">Alertas ativos</p><p className="text-3xl font-bold text-gray-900">{alerts.length}</p></div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Activity size={16}/> Viagens esta semana</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }}/>
              <YAxis tick={{ fontSize: 12 }}/>
              <Tooltip/>
              <Bar dataKey="viagens" fill="#f97316" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Pontualidade (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={punctualityData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }}/>
              <YAxis domain={[70,100]} tick={{ fontSize: 12 }}/>
              <Tooltip/>
              <Line type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas + Resumo frota */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-500"/> Alertas e Vencimentos</h3>
          {alerts.length === 0 ? (
            <div className="text-center py-6"><CheckCircle size={32} className="text-green-400 mx-auto mb-2"/><p className="text-sm text-gray-500">Nenhum alerta no momento</p></div>
          ) : (
            <div className="space-y-2">
              {alerts.map(function(a, i) { return (
                <div key={i} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                  <a.icon size={16} className={a.color}/>
                  <p className="text-sm text-gray-700">{a.msg}</p>
                </div>
              ); })}
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Bus size={16}/> Resumo da frota</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"/>Ativos</span><span className="font-semibold">{(vehicles as any)?.filter(function(v:any){return v.status==='active';}).length || 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"/>Manutenção</span><span className="font-semibold">{(vehicles as any)?.filter(function(v:any){return v.status==='maintenance';}).length || 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"/>Inativos</span><span className="font-semibold">{(vehicles as any)?.filter(function(v:any){return v.status==='inactive';}).length || 0}</span></div>
            <div className="border-t pt-2 flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Total</span><span className="font-bold text-primary-600">{nVehicles}</span></div>
          </div>
        </div>
      </div>

      {/* Alertas de Documentos */}
      {(vehicleAlerts.length > 0 || driverAlerts.length > 0) && (
        <div className="card mt-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            Alertas de Documentos ({vehicleAlerts.length + driverAlerts.length})
          </h3>
          <div className="space-y-2">
            {vehicleAlerts.map(function(a: any, i: number) { return (
              <div key={'v'+i} className={`flex items-center gap-3 p-3 rounded-xl ${a.days < 0 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <Bus size={16} className={a.days < 0 ? 'text-red-500' : 'text-yellow-500'} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${a.days < 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                    {a.plate} — {a.doc}
                  </p>
                  <p className="text-xs text-gray-500">{a.nickname || ''}</p>
                </div>
                <span className={`text-xs font-bold ${a.days < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {a.days < 0 ? `Vencido há ${Math.abs(a.days)}d` : `Vence em ${a.days}d`}
                </span>
              </div>
            ); })}
            {driverAlerts.map(function(a: any, i: number) { return (
              <div key={'d'+i} className={`flex items-center gap-3 p-3 rounded-xl ${a.days < 0 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <UserCheck size={16} className={a.days < 0 ? 'text-red-500' : 'text-yellow-500'} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${a.days < 0 ? 'text-red-700' : 'text-yellow-700'}`}>
                    {a.name} — CNH
                  </p>
                  <p className="text-xs text-gray-500">Categoria {a.category || '—'}</p>
                </div>
                <span className={`text-xs font-bold ${a.days < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {a.days < 0 ? `Vencida há ${Math.abs(a.days)}d` : `Vence em ${a.days}d`}
                </span>
              </div>
            ); })}
          </div>
        </div>
      )}
    </div>
  );
                                      }
