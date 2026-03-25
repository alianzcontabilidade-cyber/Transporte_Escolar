import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Gauge, Download, Printer, Bus, Truck, MapPin } from 'lucide-react';
import { loadMunicipalityData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function MileageReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selVehicle, setSelVehicle] = useState('all');
  const [selRoute, setSelRoute] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);

  const { data: vehiclesData } = useQuery(() => api.vehicles.list({ municipalityId: mid }), [mid]);
  const { data: routesData } = useQuery(() => api.routes.list({ municipalityId: mid }), [mid]);
  const { data: tripsData } = useQuery(() => api.trips.history({ municipalityId: mid, limit: 500 }), [mid]);
  const { data: driversData } = useQuery(() => api.drivers.list({ municipalityId: mid }), [mid]);

  const allVehicles = (vehiclesData as any) || [];
  const allRoutes = (routesData as any) || [];
  const allTrips = (tripsData as any) || [];
  const allDrivers = (driversData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  // Build mileage data from trips
  const mileageData = (() => {
    let filtered = allTrips;
    if (selVehicle !== 'all') filtered = filtered.filter((t: any) => String(t.trip?.vehicleId) === selVehicle);
    if (selRoute !== 'all') filtered = filtered.filter((t: any) => String(t.route?.id) === selRoute);

    // Group by vehicle
    const byVehicle: Record<string, { vehicle: any; trips: number; totalKm: number; routes: Set<string>; lastTrip: string }> = {};

    for (const t of filtered) {
      const vId = String(t.trip?.vehicleId || 'unknown');
      const vehicle = allVehicles.find((v: any) => v.id === t.trip?.vehicleId);
      if (!byVehicle[vId]) {
        byVehicle[vId] = { vehicle, trips: 0, totalKm: 0, routes: new Set(), lastTrip: '' };
      }
      byVehicle[vId].trips++;
      byVehicle[vId].totalKm += parseFloat(t.trip?.totalDistanceKm || '0') || (t.route?.totalDistanceKm ? parseFloat(t.route.totalDistanceKm) : 0);
      if (t.route?.name) byVehicle[vId].routes.add(t.route.name);
      const tripDate = t.trip?.tripDate ? new Date(t.trip.tripDate).toLocaleDateString('pt-BR') : '';
      if (!byVehicle[vId].lastTrip || tripDate > byVehicle[vId].lastTrip) byVehicle[vId].lastTrip = tripDate;
    }

    return Object.values(byVehicle).map(d => ({
      plate: d.vehicle?.plate || '--',
      nickname: d.vehicle?.nickname || d.vehicle?.model || '--',
      currentKm: d.vehicle?.currentKm || '--',
      trips: d.trips,
      totalKm: d.totalKm,
      avgKmPerTrip: d.trips > 0 ? (d.totalKm / d.trips).toFixed(1) : '--',
      routes: Array.from(d.routes).join(', ') || '--',
      lastTrip: d.lastTrip || '--',
    })).sort((a, b) => (b.totalKm || 0) - (a.totalKm || 0));
  })();

  // Also build per-route summary
  const routeData = (() => {
    let filtered = allTrips;
    if (selVehicle !== 'all') filtered = filtered.filter((t: any) => String(t.trip?.vehicleId) === selVehicle);

    const byRoute: Record<string, { name: string; trips: number; totalKm: number; routeKm: number }> = {};
    for (const t of filtered) {
      const rId = String(t.route?.id || 'unknown');
      if (!byRoute[rId]) {
        byRoute[rId] = { name: t.route?.name || '--', trips: 0, totalKm: 0, routeKm: parseFloat(t.route?.totalDistanceKm || '0') };
      }
      byRoute[rId].trips++;
      byRoute[rId].totalKm += parseFloat(t.trip?.totalDistanceKm || '0') || byRoute[rId].routeKm;
    }

    return Object.values(byRoute).sort((a, b) => b.totalKm - a.totalKm);
  })();

  const totalKm = mileageData.reduce((a, d) => a + (d.totalKm || 0), 0);
  const totalTrips = mileageData.reduce((a, d) => a + d.trips, 0);

  const buildReportHTML = () => {
    if (!munReport || !mileageData.length) return '';

    const rows = mileageData.map((d, i) => ({
      'Nº': i + 1,
      'Placa': d.plate,
      'Veículo': d.nickname,
      'Km Atual': d.currentKm,
      'Viagens': d.trips,
      'Km Total': d.totalKm > 0 ? d.totalKm.toFixed(1) + ' km' : '--',
      'Km/Viagem': d.avgKmPerTrip,
      'Rotas': d.routes,
      'Última Viagem': d.lastTrip,
    }));

    return buildTableReportHTML(
      'RELATÓRIO DE QUILOMETRAGEM',
      rows,
      ['Nº', 'Placa', 'Veículo', 'Km Atual', 'Viagens', 'Km Total', 'Km/Viagem', 'Rotas', 'Última Viagem'],
      munReport,
      {
        subtitle: `Frota Municipal - ${new Date().getFullYear()}`,
        signatories: selectedSigs,
        orientation: 'landscape',
        fontSize: 10,
        summary: `Total: ${mileageData.length} veículo(s) | ${totalTrips} viagem(ns) | ${totalKm.toFixed(1)} km percorridos`,
      }
    );
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!mileageData.length) { showInfoToast('Nenhum dado disponível'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: 'Relatorio_Quilometragem' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center"><Gauge size={20} className="text-cyan-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Relatório de Quilometragem</h1><p className="text-gray-500">Km percorridos por veículo e rota</p></div>
        </div>
        {mileageData.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="label">Veículo</label>
          <select className="input w-56" value={selVehicle} onChange={e => setSelVehicle(e.target.value)}>
            <option value="all">Todos</option>
            {allVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plate} - {v.nickname || v.model || ''}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Rota</label>
          <select className="input w-56" value={selRoute} onChange={e => setSelRoute(e.target.value)}>
            <option value="all">Todas</option>
            {allRoutes.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {mileageData.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* KPI */}
      {mileageData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="card text-center p-4"><Truck size={24} className="text-cyan-500 mx-auto mb-1" /><p className="text-2xl font-bold text-gray-800">{mileageData.length}</p><p className="text-xs text-gray-500">Veículos</p></div>
          <div className="card text-center p-4"><Bus size={24} className="text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold text-blue-600">{totalTrips}</p><p className="text-xs text-gray-500">Viagens</p></div>
          <div className="card text-center p-4"><Gauge size={24} className="text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold text-green-600">{totalKm.toFixed(0)}</p><p className="text-xs text-gray-500">Km Percorridos</p></div>
          <div className="card text-center p-4"><MapPin size={24} className="text-purple-500 mx-auto mb-1" /><p className="text-2xl font-bold text-purple-600">{routeData.length}</p><p className="text-xs text-gray-500">Rotas Ativas</p></div>
        </div>
      )}

      {/* Vehicle table */}
      {mileageData.length > 0 ? (
        <>
          <h3 className="font-semibold text-gray-800 mb-3">Por Veículo</h3>
          <div className="card p-0 overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Placa','Veículo','Km Atual','Viagens','Km Total','Km/Viagem','Rotas','Última Viagem'].map(h =>
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {mileageData.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">{d.plate}</td>
                    <td className="px-4 py-3 text-xs">{d.nickname}</td>
                    <td className="px-4 py-3 text-xs">{d.currentKm}</td>
                    <td className="px-4 py-3 text-xs font-bold text-blue-600">{d.trips}</td>
                    <td className="px-4 py-3 text-xs font-bold text-green-600">{d.totalKm > 0 ? d.totalKm.toFixed(1) + ' km' : '--'}</td>
                    <td className="px-4 py-3 text-xs">{d.avgKmPerTrip}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{d.routes}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.lastTrip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Route summary */}
          {routeData.length > 0 && (
            <>
              <h3 className="font-semibold text-gray-800 mb-3">Por Rota</h3>
              <div className="card p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Rota','Km da Rota','Viagens','Km Total Percorrido'].map(h =>
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {routeData.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-semibold text-gray-800">{d.name}</td>
                        <td className="px-4 py-3 text-xs">{d.routeKm > 0 ? d.routeKm.toFixed(1) + ' km' : '--'}</td>
                        <td className="px-4 py-3 text-xs font-bold text-blue-600">{d.trips}</td>
                        <td className="px-4 py-3 text-xs font-bold text-green-600">{d.totalKm > 0 ? d.totalKm.toFixed(1) + ' km' : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : allTrips.length === 0 ? (
        <div className="card text-center py-16"><Truck size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma viagem registrada</p><p className="text-xs text-gray-400 mt-1">Complete viagens para gerar dados de quilometragem</p></div>
      ) : (
        <div className="card text-center py-16"><Gauge size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum dado para os filtros selecionados</p></div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Relatório de Quilometragem" />
    </div>
  );
}
