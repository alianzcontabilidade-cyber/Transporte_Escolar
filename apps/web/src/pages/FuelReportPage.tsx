import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Fuel, Download, Printer, Truck, Plus, Trash2, X } from 'lucide-react';
import { loadMunicipalityData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function FuelReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selVehicle, setSelVehicle] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [form, setForm] = useState({ vehicleId: '', fuelDate: new Date().toISOString().split('T')[0], fuelType: 'Diesel', liters: '', pricePerLiter: '', totalCost: '', kmAtFueling: '', gasStation: '', invoiceNumber: '', notes: '' });

  const { data: vehiclesData } = useQuery(() => api.vehicles.list({ municipalityId: mid }), [mid]);
  const { data: fuelData } = useQuery(() => api.fuel.list({ municipalityId: mid, ...(selVehicle !== 'all' ? { vehicleId: parseInt(selVehicle) } : {}) }), [mid, selVehicle, refreshKey]);

  const allVehicles = (vehiclesData as any) || [];
  const allFuel = (fuelData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const handleSubmit = async () => {
    if (!form.vehicleId || !form.liters || !form.totalCost) { alert('Preencha veículo, litros e valor total'); return; }
    try {
      await api.fuel.create({
        municipalityId: mid, vehicleId: parseInt(form.vehicleId),
        fuelDate: form.fuelDate, fuelType: form.fuelType,
        liters: parseFloat(form.liters), pricePerLiter: form.pricePerLiter ? parseFloat(form.pricePerLiter) : undefined,
        totalCost: parseFloat(form.totalCost), kmAtFueling: form.kmAtFueling ? parseInt(form.kmAtFueling) : undefined,
        gasStation: form.gasStation || undefined, invoiceNumber: form.invoiceNumber || undefined, notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm({ vehicleId: '', fuelDate: new Date().toISOString().split('T')[0], fuelType: 'Diesel', liters: '', pricePerLiter: '', totalCost: '', kmAtFueling: '', gasStation: '', invoiceNumber: '', notes: '' });
      setRefreshKey(k => k + 1);
    } catch (e) { alert('Erro ao registrar: ' + (e as any)?.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este registro?')) return;
    try { await api.fuel.delete({ id }); setRefreshKey(k => k + 1); } catch (e) { alert('Erro: ' + (e as any)?.message); }
  };

  // Auto-calc totalCost
  useEffect(() => {
    if (form.liters && form.pricePerLiter) {
      setForm(f => ({ ...f, totalCost: (parseFloat(f.liters) * parseFloat(f.pricePerLiter)).toFixed(2) }));
    }
  }, [form.liters, form.pricePerLiter]);

  // Stats
  const totalLiters = allFuel.reduce((a: number, r: any) => a + parseFloat(r.fuel?.liters || '0'), 0);
  const totalCost = allFuel.reduce((a: number, r: any) => a + parseFloat(r.fuel?.totalCost || '0'), 0);
  const avgPrice = allFuel.length > 0 ? totalCost / totalLiters : 0;

  // Calc km/l efficiency
  const fuelByVehicle: Record<string, { records: any[]; plate: string; nickname: string }> = {};
  for (const r of allFuel) {
    const vId = String(r.vehicle?.id);
    if (!fuelByVehicle[vId]) fuelByVehicle[vId] = { records: [], plate: r.vehicle?.plate, nickname: r.vehicle?.nickname };
    fuelByVehicle[vId].records.push(r.fuel);
  }

  const buildReportHTML = () => {
    if (!munReport || !allFuel.length) return '';

    const rows = allFuel.map((r: any, i: number) => ({
      'Nº': i + 1,
      'Data': r.fuel?.fuelDate ? new Date(r.fuel.fuelDate).toLocaleDateString('pt-BR') : '--',
      'Veículo': `${r.vehicle?.plate || '--'} ${r.vehicle?.nickname ? '(' + r.vehicle.nickname + ')' : ''}`,
      'Combustível': r.fuel?.fuelType || '--',
      'Litros': parseFloat(r.fuel?.liters || '0').toFixed(1),
      'R$/L': r.fuel?.pricePerLiter ? 'R$ ' + parseFloat(r.fuel.pricePerLiter).toFixed(3) : '--',
      'Total': 'R$ ' + parseFloat(r.fuel?.totalCost || '0').toFixed(2),
      'Km': r.fuel?.kmAtFueling || '--',
      'Posto': r.fuel?.gasStation || '--',
      'NF': r.fuel?.invoiceNumber || '--',
    }));

    return buildTableReportHTML(
      'RELATÓRIO DE ABASTECIMENTO',
      rows,
      ['Nº', 'Data', 'Veículo', 'Combustível', 'Litros', 'R$/L', 'Total', 'Km', 'Posto', 'NF'],
      munReport,
      {
        subtitle: `Frota Municipal - ${new Date().getFullYear()}`,
        signatories: selectedSigs,
        orientation: 'landscape',
        fontSize: 9,
        summary: `Total: ${allFuel.length} abastecimento(s) | ${totalLiters.toFixed(1)} litros | R$ ${totalCost.toFixed(2)} | Preço médio: R$ ${avgPrice.toFixed(3)}/L`,
      }
    );
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!allFuel.length) { alert('Nenhum dado disponível'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: 'Relatorio_Abastecimento' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Fuel size={20} className="text-amber-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Relatório de Abastecimento</h1><p className="text-gray-500">Controle de combustível da frota</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Registrar</button>
          {allFuel.length > 0 && (
            <>
              <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
              <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
            </>
          )}
        </div>
      </div>

      {/* New Fuel Form */}
      {showForm && (
        <div className="card mb-5 border-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Novo Abastecimento</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-200 rounded"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className="label">Veículo *</label><select className="input" value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}><option value="">Selecione</option>{allVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plate} - {v.nickname || v.model}</option>)}</select></div>
            <div><label className="label">Data *</label><input type="date" className="input" value={form.fuelDate} onChange={e => setForm(f => ({ ...f, fuelDate: e.target.value }))} /></div>
            <div><label className="label">Combustível</label><select className="input" value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}><option>Diesel</option><option>Diesel S10</option><option>Gasolina</option><option>Etanol</option><option>GNV</option></select></div>
            <div><label className="label">Litros *</label><input type="number" className="input" placeholder="0.0" value={form.liters} onChange={e => setForm(f => ({ ...f, liters: e.target.value }))} step="0.1" /></div>
            <div><label className="label">R$/Litro</label><input type="number" className="input" placeholder="0.000" value={form.pricePerLiter} onChange={e => setForm(f => ({ ...f, pricePerLiter: e.target.value }))} step="0.001" /></div>
            <div><label className="label">Valor Total *</label><input type="number" className="input" placeholder="0.00" value={form.totalCost} onChange={e => setForm(f => ({ ...f, totalCost: e.target.value }))} step="0.01" /></div>
            <div><label className="label">Km Atual</label><input type="number" className="input" placeholder="0" value={form.kmAtFueling} onChange={e => setForm(f => ({ ...f, kmAtFueling: e.target.value }))} /></div>
            <div><label className="label">Posto</label><input className="input" placeholder="Nome do posto" value={form.gasStation} onChange={e => setForm(f => ({ ...f, gasStation: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="label">Nota Fiscal</label><input className="input" placeholder="Número NF" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} /></div>
            <div><label className="label">Observações</label><input className="input" placeholder="Obs." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <button onClick={handleSubmit} className="btn-primary">Salvar Abastecimento</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="label">Veículo</label>
          <select className="input w-56" value={selVehicle} onChange={e => setSelVehicle(e.target.value)}>
            <option value="all">Todos</option>
            {allVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plate} - {v.nickname || v.model}</option>)}
          </select>
        </div>
      </div>

      {allFuel.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* KPI */}
      {allFuel.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="card text-center p-4"><Fuel size={24} className="text-amber-500 mx-auto mb-1" /><p className="text-2xl font-bold text-gray-800">{allFuel.length}</p><p className="text-xs text-gray-500">Abastecimentos</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-blue-600">{totalLiters.toFixed(0)}</p><p className="text-xs text-gray-500">Litros</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-green-600">R$ {totalCost.toFixed(2)}</p><p className="text-xs text-gray-500">Custo Total</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-purple-600">R$ {avgPrice.toFixed(3)}</p><p className="text-xs text-gray-500">Preço Médio/L</p></div>
        </div>
      )}

      {/* Table */}
      {allFuel.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Data','Veículo','Combustível','Litros','R$/L','Total','Km','Posto','NF',''].map(h =>
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {allFuel.map((r: any, i: number) => (
                <tr key={r.fuel?.id || i} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-xs">{r.fuel?.fuelDate ? new Date(r.fuel.fuelDate).toLocaleDateString('pt-BR') : '--'}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold">{r.vehicle?.plate} <span className="text-gray-400 font-normal">{r.vehicle?.nickname}</span></td>
                  <td className="px-3 py-2.5 text-xs">{r.fuel?.fuelType || '--'}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-blue-600">{parseFloat(r.fuel?.liters || '0').toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-xs">{r.fuel?.pricePerLiter ? 'R$ ' + parseFloat(r.fuel.pricePerLiter).toFixed(3) : '--'}</td>
                  <td className="px-3 py-2.5 text-xs font-bold text-green-600">R$ {parseFloat(r.fuel?.totalCost || '0').toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-xs">{r.fuel?.kmAtFueling || '--'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{r.fuel?.gasStation || '--'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{r.fuel?.invoiceNumber || '--'}</td>
                  <td className="px-3 py-2.5"><button onClick={() => handleDelete(r.fuel?.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold text-xs">
                <td className="px-3 py-3" colSpan={3}>TOTAL</td>
                <td className="px-3 py-3 text-blue-600">{totalLiters.toFixed(1)} L</td>
                <td className="px-3 py-3">R$ {avgPrice.toFixed(3)}</td>
                <td className="px-3 py-3 text-green-600">R$ {totalCost.toFixed(2)}</td>
                <td className="px-3 py-3" colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16"><Fuel size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum abastecimento registrado</p><p className="text-xs text-gray-400 mt-1">Clique em "Registrar" para adicionar</p></div>
      )}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Relatório de Abastecimento" />
    </div>
  );
}
