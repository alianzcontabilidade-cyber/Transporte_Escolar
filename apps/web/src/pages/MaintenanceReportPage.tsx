import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Wrench, Download, Printer, Truck } from 'lucide-react';
import { loadMunicipalityData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function MaintenanceReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selVehicle, setSelVehicle] = useState('all');
  const [selStatus, setSelStatus] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);

  const { data: vehiclesData } = useQuery(() => api.vehicles.list({ municipalityId: mid }), [mid]);
  const { data: maintenanceData } = useQuery(() => api.maintenance.list({ municipalityId: mid }), [mid]);

  const allVehicles = (vehiclesData as any) || [];
  const allMaintenance = (maintenanceData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  let filtered = allMaintenance;
  if (selVehicle !== 'all') filtered = filtered.filter((m: any) => String(m.vehicleId) === selVehicle);
  if (selStatus !== 'all') filtered = filtered.filter((m: any) => m.status === selStatus || m.maintenanceStatus === selStatus);

  const totalCost = filtered.reduce((a: number, m: any) => a + parseFloat(m.cost || '0'), 0);
  const completed = filtered.filter((m: any) => m.status === 'completed' || m.maintenanceStatus === 'completed').length;
  const scheduled = filtered.filter((m: any) => m.status === 'scheduled' || m.maintenanceStatus === 'scheduled').length;

  const statusLabel = (s: string) => s === 'completed' ? 'Concluída' : s === 'scheduled' ? 'Agendada' : s === 'in_progress' ? 'Em andamento' : s === 'cancelled' ? 'Cancelada' : s || '--';
  const typeLabel = (t: string) => t === 'preventive' ? 'Preventiva' : t === 'corrective' ? 'Corretiva' : t === 'predictive' ? 'Preditiva' : t || '--';

  const buildReportHTML = () => {
    if (!munReport || !filtered.length) return '';
    const rows = filtered.map((m: any, i: number) => {
      const vehicle = allVehicles.find((v: any) => v.id === m.vehicleId);
      return {
        'Nº': i + 1,
        'Veículo': vehicle ? `${vehicle.plate} (${vehicle.nickname || vehicle.model || ''})` : '--',
        'Componente': m.componentName || '--',
        'Tipo': typeLabel(m.type || m.maintenanceType),
        'Status': statusLabel(m.status || m.maintenanceStatus),
        'Data': m.performedAt ? new Date(m.performedAt).toLocaleDateString('pt-BR') : '--',
        'Custo': m.cost ? 'R$ ' + parseFloat(m.cost).toFixed(2) : '--',
        'Km': m.kmAtMaintenance || '--',
        'Fornecedor': m.supplier || '--',
      };
    });

    return buildTableReportHTML('RELATÓRIO DE MANUTENÇÕES', rows,
      ['Nº', 'Veículo', 'Componente', 'Tipo', 'Status', 'Data', 'Custo', 'Km', 'Fornecedor'],
      munReport, {
        subtitle: `Frota Municipal - ${new Date().getFullYear()}`,
        signatories: selectedSigs, orientation: 'landscape', fontSize: 10,
        summary: `Total: ${filtered.length} manutenção(ões) | Custo total: R$ ${totalCost.toFixed(2)} | Concluídas: ${completed} | Agendadas: ${scheduled}`,
      });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!filtered.length) { showInfoToast('Nenhum dado'); return; }
    const html = buildReportHTML(); if (!html) return;
    setPgExportModal({ html, filename: 'Relatorio_Manutencoes' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Wrench size={20} className="text-slate-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Relatório de Manutenções</h1><p className="text-gray-500">Histórico de manutenções da frota</p></div>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 items-end">
        <div><label className="label">Veículo</label>
          <select className="input w-56" value={selVehicle} onChange={e => setSelVehicle(e.target.value)}>
            <option value="all">Todos</option>
            {allVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plate} - {v.nickname || v.model}</option>)}
          </select></div>
        <div><label className="label">Status</label>
          <select className="input w-40" value={selStatus} onChange={e => setSelStatus(e.target.value)}>
            <option value="all">Todos</option>
            <option value="scheduled">Agendada</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select></div>
      </div>

      {filtered.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="card text-center p-4"><Wrench size={24} className="text-slate-500 mx-auto mb-1" /><p className="text-2xl font-bold text-gray-800">{filtered.length}</p><p className="text-xs text-gray-500">Manutenções</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-green-600">R$ {totalCost.toFixed(2)}</p><p className="text-xs text-gray-500">Custo Total</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-blue-600">{completed}</p><p className="text-xs text-gray-500">Concluídas</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-yellow-600">{scheduled}</p><p className="text-xs text-gray-500">Agendadas</p></div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['Veículo','Componente','Tipo','Status','Data','Custo','Km','Fornecedor'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((m: any, i: number) => {
                const vehicle = allVehicles.find((v: any) => v.id === m.vehicleId);
                return (
                  <tr key={m.id || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-semibold">{vehicle?.plate || '--'} <span className="text-gray-400 font-normal">{vehicle?.nickname || ''}</span></td>
                    <td className="px-4 py-3 text-xs">{m.componentName || '--'}</td>
                    <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.type === 'preventive' || m.maintenanceType === 'preventive' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{typeLabel(m.type || m.maintenanceType)}</span></td>
                    <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${(m.status || m.maintenanceStatus) === 'completed' ? 'bg-green-100 text-green-700' : (m.status || m.maintenanceStatus) === 'scheduled' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{statusLabel(m.status || m.maintenanceStatus)}</span></td>
                    <td className="px-4 py-3 text-xs">{m.performedAt ? new Date(m.performedAt).toLocaleDateString('pt-BR') : '--'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-green-600">{m.cost ? 'R$ ' + parseFloat(m.cost).toFixed(2) : '--'}</td>
                    <td className="px-4 py-3 text-xs">{m.kmAtMaintenance || '--'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.supplier || '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16"><Truck size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma manutenção registrada</p></div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Relatório de Manutenções" />
    </div>
  );
}
