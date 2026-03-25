import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Printer, Download, MapPin, Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';

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
  const totalStudentsTransported = allStudents.length;

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
    const rows = allTrips.map((t: any) => ({
      rota: t.route?.name || '--',
      data: t.trip?.tripDate ? new Date(t.trip.tripDate).toLocaleDateString('pt-BR') : '--',
      inicio: t.trip?.startedAt ? new Date(t.trip.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--',
      fim: t.trip?.completedAt ? new Date(t.trip.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--',
      status: t.trip?.status === 'completed' ? 'Concluida' : t.trip?.status || '--',
    }));
    const cols = ['Rota', 'Data', 'Inicio', 'Fim', 'Status'];
    return buildTableReportHTML('RELATORIO DE TRANSPORTE ESCOLAR', rows, cols, munReport, { orientation: 'landscape', signatories: selectedSigs });
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
      </>
    
      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title={pgExportModal ? "Exportar Relatorio" : undefined} />
    </div>
  );
}
