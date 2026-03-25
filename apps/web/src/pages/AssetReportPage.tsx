import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Package, Download, Printer, Building } from 'lucide-react';
import { loadMunicipalityData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function AssetReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selCategory, setSelCategory] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);

  const { data: assetsData } = useQuery(() => api.assets.list({ municipalityId: mid }), [mid]);

  const allAssets = (assetsData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  const categories = [...new Set(allAssets.map((a: any) => a.category || 'Sem categoria'))].sort();
  let filtered = allAssets;
  if (selCategory !== 'all') filtered = filtered.filter((a: any) => (a.category || 'Sem categoria') === selCategory);

  const totalValue = filtered.reduce((a: number, item: any) => a + parseFloat(item.value || item.acquisitionValue || '0'), 0);

  const buildReportHTML = () => {
    if (!munReport || !filtered.length) return '';
    const rows = filtered.map((a: any, i: number) => ({
      'Nº': i + 1,
      'Código': a.code || a.tombamento || '--',
      'Descrição': a.name || a.description || '--',
      'Categoria': a.category || '--',
      'Localização': a.location || a.department || '--',
      'Estado': a.condition === 'good' ? 'Bom' : a.condition === 'regular' ? 'Regular' : a.condition === 'bad' ? 'Ruim' : a.condition || '--',
      'Aquisição': a.acquisitionDate ? new Date(a.acquisitionDate).toLocaleDateString('pt-BR') : '--',
      'Valor': a.value || a.acquisitionValue ? 'R$ ' + parseFloat(a.value || a.acquisitionValue || '0').toFixed(2) : '--',
    }));

    return buildTableReportHTML('RELATÓRIO DE PATRIMÔNIO', rows,
      ['Nº', 'Código', 'Descrição', 'Categoria', 'Localização', 'Estado', 'Aquisição', 'Valor'],
      munReport, {
        subtitle: `Inventário Patrimonial - ${new Date().getFullYear()}`,
        signatories: selectedSigs, orientation: 'landscape', fontSize: 10,
        summary: `Total: ${filtered.length} bem(ns) | Valor total: R$ ${totalValue.toFixed(2)}`,
      });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => { if (!filtered.length) return; const html = buildReportHTML(); if (html) setPgExportModal({ html, filename: 'Relatorio_Patrimonio' }); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center"><Package size={20} className="text-teal-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Relatório de Patrimônio</h1><p className="text-gray-500">Inventário de bens patrimoniais</p></div>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 items-end">
        <div><label className="label">Categoria</label>
          <select className="input w-56" value={selCategory} onChange={e => setSelCategory(e.target.value)}>
            <option value="all">Todas</option>
            {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select></div>
      </div>

      {filtered.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          <div className="card text-center p-4"><Package size={24} className="text-teal-500 mx-auto mb-1" /><p className="text-2xl font-bold text-gray-800">{filtered.length}</p><p className="text-xs text-gray-500">Bens</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-green-600">R$ {totalValue.toFixed(2)}</p><p className="text-xs text-gray-500">Valor Total</p></div>
          <div className="card text-center p-4"><p className="text-2xl font-bold text-blue-600">{categories.length}</p><p className="text-xs text-gray-500">Categorias</p></div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['Código','Descrição','Categoria','Localização','Estado','Aquisição','Valor'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((a: any, i: number) => (
                <tr key={a.id || i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs font-mono">{a.code || a.tombamento || '--'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">{a.name || a.description || '--'}</td>
                  <td className="px-4 py-3 text-xs">{a.category || '--'}</td>
                  <td className="px-4 py-3 text-xs">{a.location || a.department || '--'}</td>
                  <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${a.condition === 'good' ? 'bg-green-100 text-green-700' : a.condition === 'regular' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{a.condition === 'good' ? 'Bom' : a.condition === 'regular' ? 'Regular' : a.condition === 'bad' ? 'Ruim' : a.condition || '--'}</span></td>
                  <td className="px-4 py-3 text-xs">{a.acquisitionDate ? new Date(a.acquisitionDate).toLocaleDateString('pt-BR') : '--'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-green-600">{a.value || a.acquisitionValue ? 'R$ ' + parseFloat(a.value || a.acquisitionValue).toFixed(2) : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16"><Building size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum bem patrimonial cadastrado</p></div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Relatório de Patrimônio" />
    </div>
  );
}
