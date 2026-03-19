import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Printer, Download, MapPin, Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import ReportExportBar from '../components/ReportExportBar';

export default function TransportReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;

  const { data: routesData } = useQuery(() => api.routes.list({ municipalityId: mid }), [mid]);
  const { data: vehiclesData } = useQuery(() => api.vehicles.list({ municipalityId: mid }), [mid]);
  const { data: driversData } = useQuery(() => api.drivers.list({ municipalityId: mid }), [mid]);
  const { data: tripHistory } = useQuery(() => api.trips.history({ municipalityId: mid, limit: 100 }), [mid]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);

  const allRoutes = (routesData as any) || [];
  const allVehicles = (vehiclesData as any) || [];
  const rawDrivers = (driversData as any) || [];
  const allDrivers = rawDrivers.map((d: any) => d.driver && d.user ? { id: d.driver.id, name: d.user.name, ...d.driver } : d);
  const allTrips = (tripHistory as any) || [];
  const allStudents = (studentsData as any) || [];

  const completed = allTrips.filter((t: any) => t.trip?.status === 'completed');
  const activeVehicles = allVehicles.filter((v: any) => v.status === 'active');
  const totalStudentsTransported = allStudents.length;

  const exportCSV = () => {
    const rows = allTrips.map((t: any) => ({ rota: t.route?.name || '', data: t.trip?.tripDate ? new Date(t.trip.tripDate).toLocaleDateString('pt-BR') : '', status: t.trip?.status === 'completed' ? 'Concluida' : t.trip?.status || '', inicio: t.trip?.startedAt ? new Date(t.trip.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '', fim: t.trip?.completedAt ? new Date(t.trip.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '' }));
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(';'), ...rows.map((r: any) => keys.map(k => '"' + (r[k] || '') + '"').join(';'))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); a.download = 'transporte_netescol.csv'; a.click();
  };

  const printReport = () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatorio de Transporte - NetEscol</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0}.kpi{padding:15px;background:#f8f9fa;border-radius:8px;text-align:center}
    .kpi-value{font-size:24px;font-weight:bold;color:#1B3A5C}.kpi-label{font-size:12px;color:#666;margin-top:4px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px}td{padding:6px 8px;border:1px solid #ddd}
    tr:nth-child(even){background:#f8f9fa}.footer{margin-top:30px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>RELATORIO DE TRANSPORTE ESCOLAR</h1>
    <div class="kpis"><div class="kpi"><div class="kpi-value">${allRoutes.length}</div><div class="kpi-label">Rotas</div></div><div class="kpi"><div class="kpi-value">${activeVehicles.length}</div><div class="kpi-label">Veiculos</div></div><div class="kpi"><div class="kpi-value">${allDrivers.length}</div><div class="kpi-label">Motoristas</div></div><div class="kpi"><div class="kpi-value">${completed.length}</div><div class="kpi-label">Viagens concluidas</div></div></div>
    <table><thead><tr><th>Rota</th><th>Data</th><th>Inicio</th><th>Fim</th><th>Status</th></tr></thead>
    <tbody>${allTrips.slice(0, 50).map((t: any) => '<tr><td>'+(t.route?.name||'')+'</td><td>'+(t.trip?.tripDate?new Date(t.trip.tripDate).toLocaleDateString('pt-BR'):'')+'</td><td>'+(t.trip?.startedAt?new Date(t.trip.startedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'')+'</td><td>'+(t.trip?.completedAt?new Date(t.trip.completedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'')+'</td><td>'+(t.trip?.status==='completed'?'Concluida':t.trip?.status||'')+'</td></tr>').join('')}</tbody></table>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Bus size={20} className="text-orange-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Relatorio de Transporte</h1><p className="text-gray-500">Visao geral do transporte escolar</p></div></div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} /> CSV</button>
          <button onClick={printReport} className="btn-primary flex items-center gap-2 text-sm"><Printer size={14} /> Imprimir</button>
        </div>
      </div>

      <ReportExportBar title="Relatório de Transporte" subtitle={`${allRoutes.length} rotas · ${completed.length} viagens concluídas`}
        fullData={allTrips.map((t: any) => ({ rota: t.route?.name||'', data: t.trip?.tripDate?new Date(t.trip.tripDate).toLocaleDateString('pt-BR'):'', status: t.trip?.status==='completed'?'Concluída':t.trip?.status||'', inicio: t.trip?.startedAt?new Date(t.trip.startedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'', fim: t.trip?.completedAt?new Date(t.trip.completedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'' }))}
        fullDataColumns={[{key:'rota',label:'Rota'},{key:'data',label:'Data'},{key:'status',label:'Status'},{key:'inicio',label:'Início'},{key:'fim',label:'Fim'}]}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center bg-blue-50 border-0"><MapPin size={22} className="text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold">{allRoutes.length}</p><p className="text-xs text-gray-500">Rotas</p></div>
        <div className="card text-center bg-orange-50 border-0"><Bus size={22} className="text-orange-500 mx-auto mb-1" /><p className="text-2xl font-bold">{activeVehicles.length}</p><p className="text-xs text-gray-500">Veiculos ativos</p></div>
        <div className="card text-center bg-green-50 border-0"><Users size={22} className="text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">{allDrivers.length}</p><p className="text-xs text-gray-500">Motoristas</p></div>
        <div className="card text-center bg-purple-50 border-0"><CheckCircle size={22} className="text-purple-500 mx-auto mb-1" /><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-gray-500">Viagens concluidas</p></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={16} /> Rotas cadastradas</h3>
          <div className="space-y-2">{allRoutes.slice(0, 10).map((r: any) => {
            const route = r.route || r;
            return (<div key={route.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"><span className="text-sm font-medium">{route.name}</span><span className="text-xs text-gray-400">{route.code || ''}</span></div>);
          })}{!allRoutes.length && <p className="text-gray-400 text-sm text-center py-4">Nenhuma rota</p>}</div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Clock size={16} /> Ultimas viagens</h3>
          <div className="space-y-2">{allTrips.slice(0, 8).map((t: any) => (
            <div key={t.trip?.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div><p className="text-sm font-medium">{t.route?.name || '--'}</p><p className="text-xs text-gray-400">{t.trip?.tripDate ? new Date(t.trip.tripDate).toLocaleDateString('pt-BR') : ''}</p></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.trip?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{t.trip?.status === 'completed' ? 'Concluida' : t.trip?.status || ''}</span>
            </div>
          ))}{!allTrips.length && <p className="text-gray-400 text-sm text-center py-4">Nenhuma viagem</p>}</div>
        </div>
      </div>
      </ReportExportBar>
    </div>
  );
}
