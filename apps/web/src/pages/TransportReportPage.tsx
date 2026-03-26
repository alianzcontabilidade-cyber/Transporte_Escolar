import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Printer, Download, MapPin, Users, Clock, CheckCircle, TrendingUp, DollarSign, Route, Fuel } from 'lucide-react';

import { loadMunicipalityData } from '../lib/reportTemplate';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

export default function TransportReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [municipalityName, setMunicipalityName] = useState('');
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [munReport, setMunReport] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(({ municipality }) => {
      setMunicipalityName(municipality.name || '');
    });
    getMunicipalityReport(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

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
  const studentsWithTransport = allStudents.filter((s: any) => s.needsTransport);
  const totalKm = allRoutes.reduce((s: number, r: any) => s + parseFloat(String((r.route || r).totalDistanceKm || 0)), 0);
  const totalMonthlyCost = allRoutes.reduce((s: number, r: any) => {
    const rt = r.route || r;
    return s + parseFloat(String(rt.monthlyCostFuel || 0)) + parseFloat(String(rt.monthlyCostDriver || 0)) + parseFloat(String(rt.monthlyCostMaintenance || 0)) + parseFloat(String(rt.monthlyCostMonitor || 0)) + parseFloat(String(rt.monthlyCostInsurance || 0));
  }, 0);
  const avgCostPerStudent = studentsWithTransport.length > 0 ? totalMonthlyCost / studentsWithTransport.length : 0;

  const exportCSV = () => {
    const rows = allTrips.map((t: any) => ({ rota: t.route?.name || '', data: t.trip?.tripDate ? new Date(t.trip.tripDate).toLocaleDateString('pt-BR') : '', status: t.trip?.status === 'completed' ? 'Concluida' : t.trip?.status || '', inicio: t.trip?.startedAt ? new Date(t.trip.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '', fim: t.trip?.completedAt ? new Date(t.trip.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '' }));
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(';'), ...rows.map((r: any) => keys.map(k => '"' + (r[k] || '') + '"').join(';'))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); a.download = 'transporte_netescol.csv'; a.click();
  };

  const printReport = () => {
    const html = buildExportHTML();
    if (!html) { showInfoToast('Nenhum dado para imprimir'); return; }
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const buildExportHTML = (): string => {
    const rows = allRoutes.map((r: any) => {
      const rt = r.route || r;
      const fuel = parseFloat(String(rt.monthlyCostFuel || 0));
      const driver = parseFloat(String(rt.monthlyCostDriver || 0));
      const maint = parseFloat(String(rt.monthlyCostMaintenance || 0));
      const monitor = parseFloat(String(rt.monthlyCostMonitor || 0));
      const insurance = parseFloat(String(rt.monthlyCostInsurance || 0));
      const total = fuel + driver + maint + monitor + insurance;
      const stops = (r.stops || []).length;
      return {
        rota: rt.name || '--', codigo: rt.code || '--',
        km: parseFloat(String(rt.totalDistanceKm || 0)).toFixed(1),
        paradas: stops, tempo: rt.estimatedDuration ? rt.estimatedDuration + ' min' : '--',
        combustivel: 'R$ ' + fuel.toLocaleString('pt-BR', { minimumFractionDigits: 0 }),
        motorista: 'R$ ' + driver.toLocaleString('pt-BR', { minimumFractionDigits: 0 }),
        total_mensal: 'R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 0 }),
        custo_aluno: 'R$ ' + parseFloat(String(rt.costPerStudent || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 0 }),
      };
    });
    const cols = ['Rota', 'Código', 'Km', 'Paradas', 'Tempo', 'Combustível', 'Motorista', 'Total Mensal', 'Custo/Aluno'];
    return buildTableReportHTML('RELATÓRIO DE CUSTOS DO TRANSPORTE ESCOLAR', rows, cols, munReport, { orientation: 'landscape', signatories: selectedSigs });
  };

  const handleExportClick = () => {
    const html = buildExportHTML();
    if (!html) { showInfoToast('Nenhum dado para exportar'); return; }
    setPgExportModal({ html, filename: 'relatorio_transporte' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Bus size={20} className="text-orange-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Relatorio de Transporte</h1><p className="text-gray-500">Visao geral do transporte escolar</p></div></div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} /> CSV</button>
          <button onClick={printReport} className="btn-primary flex items-center gap-2 text-sm"><Printer size={14} /> Imprimir</button><button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
        </div>
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <div className="card text-center bg-blue-50 dark:bg-blue-900/20 border-0 p-3"><Route size={20} className="text-blue-500 mx-auto mb-1" /><p className="text-xl font-bold">{allRoutes.length}</p><p className="text-[10px] text-gray-500 uppercase">Rotas</p></div>
        <div className="card text-center bg-sky-50 dark:bg-sky-900/20 border-0 p-3"><Bus size={20} className="text-sky-500 mx-auto mb-1" /><p className="text-xl font-bold">{activeVehicles.length}</p><p className="text-[10px] text-gray-500 uppercase">Veículos</p></div>
        <div className="card text-center bg-green-50 dark:bg-green-900/20 border-0 p-3"><Users size={20} className="text-green-500 mx-auto mb-1" /><p className="text-xl font-bold">{studentsWithTransport.length}</p><p className="text-[10px] text-gray-500 uppercase">Alunos Transp.</p></div>
        <div className="card text-center bg-amber-50 dark:bg-amber-900/20 border-0 p-3"><MapPin size={20} className="text-amber-500 mx-auto mb-1" /><p className="text-xl font-bold">{totalKm.toFixed(0)}<span className="text-sm font-normal"> km</span></p><p className="text-[10px] text-gray-500 uppercase">Distância Total</p></div>
        <div className="card text-center bg-red-50 dark:bg-red-900/20 border-0 p-3"><DollarSign size={20} className="text-red-500 mx-auto mb-1" /><p className="text-xl font-bold">R$ {totalMonthlyCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-[10px] text-gray-500 uppercase">Custo/Mês</p></div>
        <div className="card text-center bg-purple-50 dark:bg-purple-900/20 border-0 p-3"><Users size={20} className="text-purple-500 mx-auto mb-1" /><p className="text-xl font-bold">R$ {avgCostPerStudent.toFixed(0)}</p><p className="text-[10px] text-gray-500 uppercase">Custo/Aluno</p></div>
      </div>

      {/* Tabela de rotas com custos */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><Route size={16} /> Rotas e Custos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-700">
              <th className="text-left p-2.5 font-semibold text-gray-600 dark:text-gray-300">Rota</th>
              <th className="text-center p-2.5 font-semibold text-gray-600 dark:text-gray-300">Km</th>
              <th className="text-center p-2.5 font-semibold text-gray-600 dark:text-gray-300">Paradas</th>
              <th className="text-center p-2.5 font-semibold text-gray-600 dark:text-gray-300">Tempo</th>
              <th className="text-right p-2.5 font-semibold text-gray-600 dark:text-gray-300">Combustível</th>
              <th className="text-right p-2.5 font-semibold text-gray-600 dark:text-gray-300">Motorista</th>
              <th className="text-right p-2.5 font-semibold text-gray-600 dark:text-gray-300">Total/Mês</th>
              <th className="text-right p-2.5 font-semibold text-gray-600 dark:text-gray-300">$/Aluno</th>
            </tr></thead>
            <tbody>{allRoutes.map((r: any) => {
              const rt = r.route || r;
              const fuel = parseFloat(String(rt.monthlyCostFuel || 0));
              const drv = parseFloat(String(rt.monthlyCostDriver || 0));
              const total = fuel + drv + parseFloat(String(rt.monthlyCostMaintenance || 0)) + parseFloat(String(rt.monthlyCostMonitor || 0)) + parseFloat(String(rt.monthlyCostInsurance || 0));
              return (
                <tr key={rt.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2.5"><p className="font-medium text-gray-800 dark:text-gray-200">{rt.name}</p><p className="text-[10px] text-gray-400">{rt.code || ''}</p></td>
                  <td className="text-center p-2.5 text-gray-600 dark:text-gray-400">{parseFloat(String(rt.totalDistanceKm || 0)).toFixed(1)}</td>
                  <td className="text-center p-2.5 text-gray-600 dark:text-gray-400">{(r.stops || []).length}</td>
                  <td className="text-center p-2.5 text-gray-600 dark:text-gray-400">{rt.estimatedDuration ? rt.estimatedDuration + ' min' : '--'}</td>
                  <td className="text-right p-2.5 text-blue-600">R$ {fuel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-right p-2.5 text-amber-600">R$ {drv.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-right p-2.5 font-bold text-gray-800 dark:text-gray-200">R$ {total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                  <td className="text-right p-2.5 text-green-600">R$ {parseFloat(String(rt.costPerStudent || 0)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                </tr>
              );
            })}</tbody>
            {allRoutes.length > 0 && <tfoot><tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 font-bold">
              <td className="p-2.5">TOTAL</td>
              <td className="text-center p-2.5">{totalKm.toFixed(1)} km</td>
              <td className="text-center p-2.5">{allRoutes.reduce((s: number, r: any) => s + (r.stops || []).length, 0)}</td>
              <td className="text-center p-2.5">--</td>
              <td className="text-right p-2.5 text-blue-600">R$ {allRoutes.reduce((s: number, r: any) => s + parseFloat(String((r.route || r).monthlyCostFuel || 0)), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              <td className="text-right p-2.5 text-amber-600">R$ {allRoutes.reduce((s: number, r: any) => s + parseFloat(String((r.route || r).monthlyCostDriver || 0)), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              <td className="text-right p-2.5">R$ {totalMonthlyCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
              <td className="text-right p-2.5 text-green-600">R$ {avgCostPerStudent.toFixed(0)}</td>
            </tr></tfoot>}
          </table>
          {!allRoutes.length && <p className="text-gray-400 text-sm text-center py-8">Nenhuma rota cadastrada</p>}
        </div>
      </div>

      {/* Últimas viagens */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2"><Clock size={16} /> Últimas Viagens</h3>
        <div className="space-y-2">{allTrips.slice(0, 10).map((t: any) => (
          <div key={t.trip?.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.route?.name || '--'}</p><p className="text-xs text-gray-400">{t.trip?.tripDate ? new Date(t.trip.tripDate).toLocaleDateString('pt-BR') : ''}</p></div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${t.trip?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{t.trip?.status === 'completed' ? 'Concluída' : t.trip?.status || ''}</span>
          </div>
        ))}{!allTrips.length && <p className="text-gray-400 text-sm text-center py-4">Nenhuma viagem registrada</p>}</div>
      </div>
      </>
    
      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatório" : undefined} />
    </div>
  );
}
