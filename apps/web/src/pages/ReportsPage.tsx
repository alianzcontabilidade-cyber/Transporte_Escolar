import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Calendar, CheckCircle, XCircle, Download, BarChart2, TrendingUp, Users, MapPin, Bus, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { loadMunicipalityData } from '../lib/reportTemplate';
import { buildTableReportHTML } from '../lib/reportUtils';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';

const COLORS = ['#10b981','#ef4444','#0369A1','#3b82f6','#7C3AED'];

export default function ReportsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [tab, setTab] = useState<'overview'|'trips'|'students'|'vehicles'>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [munReport, setMunReport] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  const { data: history } = useQuery(() => api.trips.history({ municipalityId, limit:200 }), [municipalityId]);
  const { data: students } = useQuery(() => api.students.list({ municipalityId }), [municipalityId]);
  const { data: vehiclesData } = useQuery(() => api.vehicles.list({ municipalityId }), [municipalityId]);
  const { data: driversData } = useQuery(() => api.drivers.list({ municipalityId }), [municipalityId]);

  useEffect(() => { if (municipalityId) loadMunicipalityData(municipalityId, api).then(setMunReport).catch(() => {}); }, [municipalityId]);

  const allTrips = (history as any)||[];

  // Filtro de data funcional
  const trips = allTrips.filter((h: any) => {
    const d = h.trip?.tripDate ? new Date(h.trip.tripDate) : null;
    if (!d) return true;
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const completed = trips.filter((h: any) => h.trip?.status==='completed');
  const cancelled = trips.filter((h: any) => h.trip?.status==='cancelled');
  const rate = trips.length ? Math.round((completed.length/trips.length)*100) : 0;
  const pieData = [{ name:'Concluidas', value:completed.length },{ name:'Canceladas', value:cancelled.length },{ name:'Em andamento', value:trips.filter((h: any) => h.trip?.status==='started').length }].filter(d => d.value>0);
  const byRoute: any = {};
  trips.forEach((h: any) => { const name=h.route?.name||'Sem rota'; if(!byRoute[name]) byRoute[name]={name,total:0,completed:0}; byRoute[name].total++; if(h.trip?.status==='completed') byRoute[name].completed++; });
  const routeData = Object.values(byRoute).slice(0,8);

  // Tendencia semanal com dados REAIS (ultimas 4 semanas)
  const weekData = (function() {
    const weeks: any[] = [];
    const now = new Date();
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now.getTime() - (w * 7 + now.getDay()) * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
      const weekTrips = allTrips.filter((h: any) => {
        const d = h.trip?.tripDate ? new Date(h.trip.tripDate) : null;
        return d && d >= weekStart && d <= weekEnd;
      });
      weeks.push({ week: 'Sem ' + (4 - w), viagens: weekTrips.length, concluidas: weekTrips.filter((h: any) => h.trip?.status === 'completed').length });
    }
    return weeks;
  })();

  const sl = (s: string) => ({ started:'Em andamento', completed:'Concluida', cancelled:'Cancelada', scheduled:'Agendada' }[s]||s);
  const tripRows = trips.map((h: any) => ({ rota:h.route?.name||'--', data:h.trip?.tripDate?new Date(h.trip.tripDate).toLocaleDateString('pt-BR'):'--', inicio:h.trip?.startedAt?new Date(h.trip.startedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'--', fim:h.trip?.completedAt?new Date(h.trip.completedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'--', status:sl(h.trip?.status) }));
  const studentRows = ((students as any)||[]).map((s: any) => ({ nome:s.name, matrícula:s.enrollment||'--', serie:s.grade||'--', turma:s.classRoom||s.className||'--', turno:{ morning:'Manhã', afternoon:'Tarde', evening:'Noite', full_time:'Integral' }[s.shift as string]||'--', escola:s.school||'--' }));
  const statusLabel = (s: string) => ({ active:'Ativo', maintenance:'Manutenção', inactive:'Inativo' }[s]||s);
  const vehicleRows = ((vehiclesData as any)||[]).map((v: any) => ({ placa:v.plate||'--', apelido:v.nickname||'--', marca_modelo:[v.brand,v.model,v.year].filter(Boolean).join(' ')||'--', capacidade:v.capacity?`${v.capacity} lugares`:'--', km_atual:v.currentKm?Number(v.currentKm).toLocaleString('pt-BR')+' km':'--', status:statusLabel(v.status) }));
  const clearFilter = () => { setDateFrom(''); setDateTo(''); };
  const [exportModal, setExportModal] = useState<{ title: string; data: any[]; cols: string[]; filename: string } | null>(null);

  const doExport = (format: ExportFormat) => {
    if (!exportModal) return;
    const html = buildTableReportHTML(exportModal.title.toUpperCase(), exportModal.data, exportModal.cols, munReport, { signatories: selectedSigs });
    if (!html && format !== 'csv') { showInfoToast('Sem dados para exportar'); return; }
    handleExport(format, exportModal.data, html, exportModal.filename);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Relatorios</h1><p className="text-gray-500">Analise e exportacao de dados {dateFrom || dateTo ? '(filtrado)' : ''}</p></div>
        <div className="flex gap-2 items-center">
          <input type="date" className="input text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Data inicial" />
          <span className="text-gray-400">a</span>
          <input type="date" className="input text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Data final" />
          {(dateFrom || dateTo) && <button onClick={clearFilter} className="text-xs text-red-500 hover:underline">Limpar</button>}
        </div>
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center"><CheckCircle size={28} className="text-green-500 mx-auto mb-2"/><p className="text-2xl font-bold">{completed.length}</p><p className="text-sm text-gray-500">Concluídas</p></div>
        <div className="card text-center"><XCircle size={28} className="text-red-400 mx-auto mb-2"/><p className="text-2xl font-bold">{cancelled.length}</p><p className="text-sm text-gray-500">Canceladas</p></div>
        <div className="card text-center"><TrendingUp size={28} className="text-blue-500 mx-auto mb-2"/><p className="text-2xl font-bold">{rate}%</p><p className="text-sm text-gray-500">Taxa de conclusão</p></div>
        <div className="card text-center"><Calendar size={28} className="text-primary-500 mx-auto mb-2"/><p className="text-2xl font-bold">{trips.length}</p><p className="text-sm text-gray-500">Total de viagens</p></div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[['overview','Visão Geral',BarChart2],['trips','Viagens',Calendar],['students','Alunos',Users],['vehicles','Frota',MapPin]].map(([id,label,Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}><Icon size={15}/> {label}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-800">Viagens por rota</h3></div>{routeData.length?(<ResponsiveContainer width="100%" height={220}><BarChart data={routeData}><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="total" fill="#f97316" radius={[4,4,0,0]} name="Total"/><Bar dataKey="completed" fill="#10b981" radius={[4,4,0,0]} name="Concluídas"/></BarChart></ResponsiveContainer>):<div className="h-52 flex items-center justify-center text-gray-400 text-sm">Sem dados de viagens ainda</div>}</div>
          <div className="card"><h3 className="font-semibold text-gray-800 mb-4">Status das viagens</h3>{pieData.length?(<ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>{pieData.map((_,i) => <Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>):<div className="h-52 flex items-center justify-center text-gray-400 text-sm">Sem dados de viagens ainda</div>}</div>
          <div className="card col-span-2"><h3 className="font-semibold text-gray-800 mb-4">Tendencia semanal (ultimas 4 semanas)</h3>{weekData.some((w: any) => w.viagens > 0) ? (<ResponsiveContainer width="100%" height={180}><BarChart data={weekData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week"/><YAxis/><Tooltip/><Legend/><Bar dataKey="viagens" fill="#f97316" radius={[4,4,0,0]} name="Total"/><Bar dataKey="concluidas" fill="#10b981" radius={[4,4,0,0]} name="Concluidas"/></BarChart></ResponsiveContainer>) : <div className="h-44 flex items-center justify-center text-gray-400 text-sm">Sem viagens nas ultimas 4 semanas</div>}</div>
        </div>
      )}

      {tab==='trips' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2"><FileText size={18} className="text-gray-500"/><h3 className="font-semibold">Histórico de Viagens</h3><span className="text-sm text-gray-400">({tripRows.length} registros)</span></div>
            <div className="flex gap-2">
              
              <button onClick={() => setExportModal({ title:'Relatorio de Viagens', data:tripRows, cols:['Rota','Data','Inicio','Fim','Status'], filename:'viagens_netescol' })} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg"><Download size={14}/> Exportar</button>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Rota','Data','Início','Fim','Status'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{tripRows.map((r: any,i: number) => (<tr key={i} className="hover:bg-gray-50"><td className="px-5 py-3 font-medium text-gray-800">{r.rota}</td><td className="px-5 py-3 text-gray-500">{r.data}</td><td className="px-5 py-3 text-gray-500">{r.inicio}</td><td className="px-5 py-3 text-gray-500">{r.fim}</td><td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status==='Concluída'?'bg-green-100 text-green-700':r.status==='Cancelada'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td></tr>))}{!tripRows.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Nenhuma viagem registrada</td></tr>}</tbody></table></div>
        </div>
      )}

      {tab==='students' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2"><Users size={18} className="text-gray-500"/><h3 className="font-semibold">Lista de Alunos</h3><span className="text-sm text-gray-400">({studentRows.length} alunos)</span></div>
            <div className="flex gap-2">
              
              <button onClick={() => setExportModal({ title:'Lista de Alunos', data:studentRows, cols:['Nome','Matricula','Serie','Turma','Turno','Escola'], filename:'alunos_netescol' })} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg"><Download size={14}/> Exportar</button>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Nome','Matricula','Serie','Turma','Turno','Escola'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{studentRows.map((s: any,i: number) => (<tr key={i} className="hover:bg-gray-50"><td className="px-5 py-3 font-medium">{s.nome}</td><td className="px-5 py-3 text-gray-500">{s.matricula}</td><td className="px-5 py-3 text-gray-500">{s.serie}</td><td className="px-5 py-3 text-gray-500">{s.turma}</td><td className="px-5 py-3 text-gray-500">{s.turno}</td><td className="px-5 py-3 text-gray-500">{s.escola}</td></tr>))}{!studentRows.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Nenhum aluno cadastrado</td></tr>}</tbody></table></div>
        </div>
      )}

      {tab==='vehicles' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2"><MapPin size={18} className="text-gray-500"/><h3 className="font-semibold">Relatório de Frota</h3><span className="text-sm text-gray-400">({vehicleRows.length} veículos)</span></div>
            <div className="flex gap-2">
              
              <button onClick={() => setExportModal({ title:'Relatorio de Frota', data:vehicleRows, cols:['Placa','Apelido','Marca/Modelo','Capacidade','Km Atual','Status'], filename:'frota_netescol' })} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg"><Download size={14}/> Exportar</button>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Placa','Apelido','Marca/Modelo','Capacidade','Km Atual','Status'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{vehicleRows.map((v: any,i: number) => (<tr key={i} className="hover:bg-gray-50"><td className="px-5 py-3 font-medium text-gray-800">{v.placa}</td><td className="px-5 py-3 text-gray-500">{v.apelido}</td><td className="px-5 py-3 text-gray-500">{v.marca_modelo}</td><td className="px-5 py-3 text-gray-500">{v.capacidade}</td><td className="px-5 py-3 text-gray-500">{v.km_atual}</td><td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${v.status==='Ativo'?'bg-green-100 text-green-700':v.status==='Manutenção'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{v.status}</span></td></tr>))}{!vehicleRows.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Nenhum veículo cadastrado</td></tr>}</tbody></table></div>
        </div>
      )}
      {/* Modal de Exportacao - estilo Megasoft */}
      <ExportModal
        open={!!exportModal}
        onClose={() => setExportModal(null)}
        onExport={doExport}
        title={exportModal ? 'Exportar: ' + exportModal.title : undefined}
      />
    </div>
  );
}
