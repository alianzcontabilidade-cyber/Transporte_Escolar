import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Download, Printer, Users, MapPin, School } from 'lucide-react';
import { loadMunicipalityData, printReportHTML } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import ExportModal, { handleExport } from '../components/ExportModal';

export default function TransportedStudentsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selSchool, setSelSchool] = useState('all');
  const [selRoute, setSelRoute] = useState('all');
  const [selZone, setSelZone] = useState('all');
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const [munReport, setMunReport] = useState<any>(null);
  const [pgExportModal, setPgExportModal] = useState<{html:string;filename:string}|null>(null);
  const [transportData, setTransportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: routesData } = useQuery(() => api.routes.list({ municipalityId: mid }), [mid]);

  const allSchools = (schoolsData as any) || [];
  const allStudents = (studentsData as any) || [];
  const allRoutes = (routesData as any) || [];

  useEffect(() => {
    if (!mid) return;
    loadMunicipalityData(mid, api).then(setMunReport).catch(() => {});
  }, [mid]);

  // Build transport data from students who need transport
  useEffect(() => {
    if (!allStudents.length) return;

    let filtered = allStudents.filter((s: any) => s.needsTransport);

    if (selSchool !== 'all') {
      filtered = filtered.filter((s: any) => String(s.schoolId) === selSchool);
    }
    if (selZone !== 'all') {
      filtered = filtered.filter((s: any) => s.zone === selZone);
    }
    if (selRoute !== 'all') {
      filtered = filtered.filter((s: any) => String(s.routeId) === selRoute || String(s.stopRouteId) === selRoute);
    }

    const data = filtered.map((s: any) => {
      const school = allSchools.find((sc: any) => sc.id === s.schoolId);
      const route = allRoutes.find((r: any) => r.id === s.routeId || r.id === s.stopRouteId);
      return {
        name: s.name || '--',
        enrollment: s.enrollment || '--',
        school: school?.name || '--',
        grade: s.grade || '--',
        shift: s.shift === 'morning' ? 'Mat.' : s.shift === 'afternoon' ? 'Vesp.' : s.shift === 'evening' ? 'Not.' : '--',
        zone: s.zone === 'rural' ? 'Rural' : s.zone === 'urban' ? 'Urbana' : '--',
        transportType: s.transportType || '--',
        distance: s.transportDistance ? s.transportDistance + ' km' : '--',
        route: route?.name || '--',
        address: s.address ? (s.address + (s.neighborhood ? ', ' + s.neighborhood : '')) : '--',
        cpf: s.cpf || '--',
        birthDate: s.birthDate ? new Date(s.birthDate).toLocaleDateString('pt-BR') : '--',
      };
    });

    data.sort((a: any, b: any) => a.school.localeCompare(b.school) || a.name.localeCompare(b.name));
    setTransportData(data);
  }, [allStudents, allSchools, allRoutes, selSchool, selRoute, selZone]);

  // Stats
  const totalRural = transportData.filter(d => d.zone === 'Rural').length;
  const totalUrbana = transportData.filter(d => d.zone === 'Urbana').length;
  const bySchool = transportData.reduce((acc: any, d) => { acc[d.school] = (acc[d.school] || 0) + 1; return acc; }, {});

  const buildReportHTML = () => {
    if (!munReport || !transportData.length) return '';

    const rows = transportData.map((d, i) => ({
      'Nº': i + 1,
      'Nome do Aluno': d.name,
      'Matrícula': d.enrollment,
      'Escola': d.school,
      'Série': d.grade,
      'Turno': d.shift,
      'Zona': d.zone,
      'Tipo Transp.': d.transportType,
      'Distância': d.distance,
      'Rota': d.route,
    }));

    const filters = [];
    if (selSchool !== 'all') filters.push('Escola: ' + (allSchools.find((s: any) => String(s.id) === selSchool)?.name || ''));
    if (selRoute !== 'all') filters.push('Rota: ' + (allRoutes.find((r: any) => String(r.id) === selRoute)?.name || ''));
    if (selZone !== 'all') filters.push('Zona: ' + (selZone === 'rural' ? 'Rural' : 'Urbana'));

    return buildTableReportHTML(
      'RELATÓRIO DE ALUNOS TRANSPORTADOS',
      rows,
      ['Nº', 'Nome do Aluno', 'Matrícula', 'Escola', 'Série', 'Turno', 'Zona', 'Tipo Transp.', 'Distância', 'Rota'],
      munReport,
      {
        subtitle: `FNDE - Programa Nacional de Transporte Escolar${filters.length ? ' | ' + filters.join(' | ') : ''} - ${new Date().getFullYear()}`,
        signatories: selectedSigs,
        orientation: 'landscape',
        fontSize: 9,
        summary: `Total: ${transportData.length} aluno(s) transportado(s) | Zona Rural: ${totalRural} | Zona Urbana: ${totalUrbana} | Escolas atendidas: ${Object.keys(bySchool).length}`,
      }
    );
  };

  const handlePrint = () => { const html = buildReportHTML(); if (html) printReportHTML(html); };
  const handleExportClick = () => {
    if (!transportData.length) { showInfoToast('Nenhum dado disponível'); return; }
    if (!munReport) { showInfoToast('Aguarde o carregamento dos dados'); return; }
    const html = buildReportHTML();
    if (!html) return;
    setPgExportModal({ html, filename: 'Alunos_Transportados_FNDE' });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Bus size={20} className="text-orange-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Alunos Transportados</h1><p className="text-gray-500">Relatório FNDE - Programa Nacional de Transporte Escolar</p></div>
        </div>
        {transportData.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
            <button onClick={handleExportClick} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="label">Escola</label>
          <select className="input w-56" value={selSchool} onChange={e => setSelSchool(e.target.value)}>
            <option value="all">Todas</option>
            {allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Rota</label>
          <select className="input w-56" value={selRoute} onChange={e => setSelRoute(e.target.value)}>
            <option value="all">Todas</option>
            {allRoutes.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Zona</label>
          <select className="input w-40" value={selZone} onChange={e => setSelZone(e.target.value)}>
            <option value="all">Todas</option>
            <option value="rural">Rural</option>
            <option value="urban">Urbana</option>
          </select>
        </div>
      </div>

      {transportData.length > 0 && <div className="mb-4"><ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} /></div>}

      {/* KPI Cards */}
      {transportData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="card text-center p-4"><Bus size={24} className="text-orange-500 mx-auto mb-1" /><p className="text-2xl font-bold text-gray-800">{transportData.length}</p><p className="text-xs text-gray-500">Alunos Transportados</p></div>
          <div className="card text-center p-4"><MapPin size={24} className="text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold text-green-600">{totalRural}</p><p className="text-xs text-gray-500">Zona Rural</p></div>
          <div className="card text-center p-4"><MapPin size={24} className="text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold text-blue-600">{totalUrbana}</p><p className="text-xs text-gray-500">Zona Urbana</p></div>
          <div className="card text-center p-4"><School size={24} className="text-purple-500 mx-auto mb-1" /><p className="text-2xl font-bold text-purple-600">{Object.keys(bySchool).length}</p><p className="text-xs text-gray-500">Escolas Atendidas</p></div>
        </div>
      )}

      {/* Table */}
      {transportData.length > 0 ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nº','Nome','Matrícula','Escola','Série','Turno','Zona','Tipo','Dist.','Rota'].map(h =>
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {transportData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-xs text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-gray-800">{d.name}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{d.enrollment}</td>
                  <td className="px-3 py-2.5 text-xs">{d.school}</td>
                  <td className="px-3 py-2.5 text-xs">{d.grade}</td>
                  <td className="px-3 py-2.5 text-xs">{d.shift}</td>
                  <td className="px-3 py-2.5 text-xs"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${d.zone === 'Rural' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{d.zone}</span></td>
                  <td className="px-3 py-2.5 text-xs">{d.transportType}</td>
                  <td className="px-3 py-2.5 text-xs">{d.distance}</td>
                  <td className="px-3 py-2.5 text-xs">{d.route}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold text-xs">
                <td className="px-3 py-3" colSpan={6}>TOTAL: {transportData.length} aluno(s)</td>
                <td className="px-3 py-3" colSpan={4}>Rural: {totalRural} | Urbana: {totalUrbana}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : allStudents.length > 0 ? (
        <div className="card text-center py-16"><Bus size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum aluno com transporte escolar cadastrado</p><p className="text-xs text-gray-400 mt-1">Cadastre alunos com a opção "Necessita Transporte" marcada</p></div>
      ) : (
        <div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Carregando dados dos alunos...</p></div>
      )}

      <ExportModal open={!!pgExportModal} onClose={() => setPgExportModal(null)} onExport={(fmt: any) => { if (pgExportModal?.html) { handleExport(fmt, [], pgExportModal.html, pgExportModal.filename); } setPgExportModal(null); }} title="Exportar Relatório de Alunos Transportados" />
    </div>
  );
}
