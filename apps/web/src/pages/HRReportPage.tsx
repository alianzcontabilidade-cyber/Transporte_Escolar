import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Briefcase, Download, Printer, Users } from 'lucide-react';
import { loadMunicipalityData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function HRReportPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selDept, setSelDept] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);

  const { data: staffData } = useQuery(() => api.staffAllocations.list({ municipalityId: mid }), [mid]);
  const { data: positionsData } = useQuery(() => api.positions.list({ municipalityId: mid }), [mid]);
  const { data: deptsData } = useQuery(() => api.departments.list({ municipalityId: mid }), [mid]);

  const allStaff = (staffData as any) || [];
  const allPositions = (positionsData as any) || [];
  const allDepts = (deptsData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  let filtered = allStaff;
  if (selDept !== 'all') filtered = filtered.filter((s: any) => String(s.departmentId) === selDept);

  const buildReportHTML = () => {
    if (!munReport || !filtered.length) return '';
    const rows = filtered.map((s: any, i: number) => {
      const pos = allPositions.find((p: any) => p.id === s.positionId);
      const dept = allDepts.find((d: any) => d.id === s.departmentId);
      return {
        'Nº': i + 1,
        'Nome': s.employeeName || s.name || '--',
        'CPF': s.cpf || '--',
        'Cargo': pos?.name || s.positionName || '--',
        'Departamento': dept?.name || s.departmentName || '--',
        'Vínculo': s.contractType || s.bondType || '--',
        'Admissão': s.startDate ? new Date(s.startDate).toLocaleDateString('pt-BR') : '--',
        'Status': s.status === 'active' ? 'Ativo' : s.status || '--',
      };
    });

    return buildTableReportHTML('RELATÓRIO DE RECURSOS HUMANOS', rows,
      ['Nº', 'Nome', 'CPF', 'Cargo', 'Departamento', 'Vínculo', 'Admissão', 'Status'],
      munReport, {
        subtitle: `Quadro de Pessoal - ${new Date().getFullYear()}`,
        signatories: selectedSigs, orientation: 'landscape', fontSize: 10,
        summary: `Total: ${filtered.length} servidor(es)${selDept !== 'all' ? ' | Departamento: ' + (allDepts.find((d: any) => String(d.id) === selDept)?.name || '') : ''}`,
      });
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => { if (!filtered.length) return; const html = buildReportHTML(); if (html) setPgExportModal({ html, filename: 'Relatorio_RH' }); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center"><Briefcase size={20} className="text-sky-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Relatório de RH</h1><p className="text-gray-500">Quadro de pessoal por cargo e departamento</p></div>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6 items-end">
        <div><label className="label">Departamento</label>
          <select className="input w-56" value={selDept} onChange={e => setSelDept(e.target.value)}>
            <option value="all">Todos</option>
            {allDepts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select></div>
      </div>

      {filtered.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {filtered.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              {['Nome','CPF','Cargo','Departamento','Vínculo','Admissão','Status'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {filtered.map((s: any, i: number) => {
                const pos = allPositions.find((p: any) => p.id === s.positionId);
                const dept = allDepts.find((d: any) => d.id === s.departmentId);
                return (
                  <tr key={s.id || i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{s.employeeName || s.name || '--'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.cpf || '--'}</td>
                    <td className="px-4 py-3 text-xs">{pos?.name || s.positionName || '--'}</td>
                    <td className="px-4 py-3 text-xs">{dept?.name || s.departmentName || '--'}</td>
                    <td className="px-4 py-3 text-xs">{s.contractType || s.bondType || '--'}</td>
                    <td className="px-4 py-3 text-xs">{s.startDate ? new Date(s.startDate).toLocaleDateString('pt-BR') : '--'}</td>
                    <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s.status === 'active' ? 'Ativo' : s.status || '--'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum servidor cadastrado</p></div>
      )}

      <ExportModal allowSign={true} open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any, opts?: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename, opts); } setPgExportModal(null); }} title="Exportar Relatório de RH" />
    </div>
  );
}
