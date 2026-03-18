import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Calendar, CheckCircle, XCircle, Download, Filter, BarChart2, TrendingUp, Users, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#f97316','#3b82f6','#10b981','#ef4444','#8b5cf6'];

function exportCSV(data: any[], filename: string) {
  if (!data?.length) { alert('Sem dados para exportar'); return; }
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${row[k]??''}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
}

function exportPDF(title: string, data: any[], cols: string[]) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{color:#f97316;border-bottom:2px solid #f97316;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th{background:#f97316;color:white;padding:10px;text-align:left}td{padding:8px 10px;border-bottom:1px solid #eee}tr:nth-child(even){background:#fafafa}.header{display:flex;justify-content:space-between}.date{color:#666;font-size:14px}</style>
  </head><body><div class="header"><h1>${title}</h1><span class="date">Gerado em ${new Date().toLocaleDateString('pt-BR')}</span></div>
  <table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v??''}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <p style="margin-top:20px;color:#999;font-size:12px">Total: ${data.length} registros</p></body></html>`;
  const blob = new Blob([html], { type:'text/html' });
  const win = window.open(URL.createObjectURL(blob), '_blank');
  setTimeout(() => win?.print(), 500);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [tab, setTab] = useState<'overview'|'trips'|'students'|'vehicles'>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: history } = useQuery(() => api.trips.history({ municipalityId, limit:100 }), [municipalityId]);
  const { data: students } = useQuery(() => api.students.list({ municipalityId }), [municipalityId]);
  const trips = (history as any)||[];
  const completed = trips.filter((h: any) => h.trip?.status==='completed');
  const cancelled = trips.filter((h: any) => h.trip?.status==='cancelled');
  const rate = trips.length ? Math.round((completed.length/trips.length)*100) : 0;
  const pieData = [{ name:'Concluídas', value:completed.length },{ name:'Canceladas', value:cancelled.length },{ name:'Em andamento', value:trips.filter((h: any) => h.trip?.status==='started').length }].filter(d => d.value>0);
  const byRoute: any = {};
  trips.forEach((h: any) => { const name=h.route?.name||'Sem rota'; if(!byRoute[name]) byRoute[name]={name,total:0,completed:0}; byRoute[name].total++; if(h.trip?.status==='completed') byRoute[name].completed++; });
  const routeData = Object.values(byRoute).slice(0,8);
  const weekData = [{ week:'Sem 1', viagens:12, km:180 },{ week:'Sem 2', viagens:15, km:220 },{ week:'Sem 3', viagens:11, km:165 },{ week:'Sem 4', viagens:14, km:210 }];
  const sl = (s: string) => ({ started:'Em andamento', completed:'Concluída', cancelled:'Cancelada', scheduled:'Agendada' }[s]||s);
  const tripRows = trips.map((h: any) => ({ rota:h.route?.name||'—', data:new Date(h.trip?.tripDate).toLocaleDateString('pt-BR'), inicio:h.trip?.startedAt?new Date(h.trip?.startedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—', fim:h.trip?.endedAt?new Date(h.trip?.endedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'—', status:sl(h.trip?.status) }));
  const studentRows = ((students as any)||[]).map((s: any) => ({ nome:s.name, matricula:s.enrollment||'—', serie:s.grade||'—', turma:s.classRoom||'—', turno:{ morning:'Manhã', afternoon:'Tarde', evening:'Noite' }[s.shift as string]||'—' }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Relatórios</h1><p className="text-gray-500">Análise e exportação de dados</p></div>
        <div className="flex gap-2">
          <input type="date" className="input text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <input type="date" className="input text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button className="btn-secondary flex items-center gap-2 text-sm"><Filter size={14}/> Filtrar</button>
        </div>
      </div>

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
          <div className="card col-span-2"><h3 className="font-semibold text-gray-800 mb-4">Tendência semanal</h3><ResponsiveContainer width="100%" height={180}><LineChart data={weekData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="week"/><YAxis yAxisId="left"/><YAxis yAxisId="right" orientation="right"/><Tooltip/><Legend/><Line yAxisId="left" type="monotone" dataKey="viagens" stroke="#f97316" strokeWidth={2} name="Viagens"/><Line yAxisId="right" type="monotone" dataKey="km" stroke="#3b82f6" strokeWidth={2} name="Km rodados"/></LineChart></ResponsiveContainer></div>
        </div>
      )}

      {tab==='trips' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2"><FileText size={18} className="text-gray-500"/><h3 className="font-semibold">Histórico de Viagens</h3><span className="text-sm text-gray-400">({tripRows.length} registros)</span></div>
            <div className="flex gap-2">
              <button onClick={() => exportCSV(tripRows,'viagens_transescolar.csv')} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg"><Download size={14}/> CSV</button>
              <button onClick={() => exportPDF('Relatório de Viagens',tripRows,['Rota','Data','Início','Fim','Status'])} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg"><Download size={14}/> PDF</button>
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
              <button onClick={() => exportCSV(studentRows,'alunos_transescolar.csv')} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg"><Download size={14}/> CSV</button>
              <button onClick={() => exportPDF('Lista de Alunos',studentRows,['Nome','Matrícula','Série','Turma','Turno'])} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg"><Download size={14}/> PDF</button>
            </div>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Nome','Matrícula','Série','Turma','Turno'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{studentRows.map((s: any,i: number) => (<tr key={i} className="hover:bg-gray-50"><td className="px-5 py-3 font-medium">{s.nome}</td><td className="px-5 py-3 text-gray-500">{s.matricula}</td><td className="px-5 py-3 text-gray-500">{s.serie}</td><td className="px-5 py-3 text-gray-500">{s.turma}</td><td className="px-5 py-3 text-gray-500">{s.turno}</td></tr>))}{!studentRows.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Nenhum aluno cadastrado</td></tr>}</tbody></table></div>
        </div>
      )}

      {tab==='vehicles' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-800">Relatório de Frota</h3><div className="flex gap-2"><button onClick={() => exportCSV([{veiculo:'Sem dados'}],'frota_transescolar.csv')} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg"><Download size={14}/> CSV</button><button onClick={() => exportPDF('Relatório de Frota',[{veiculo:'Sem dados'}],['Veículo','Km','Status'])} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg"><Download size={14}/> PDF</button></div></div>
          <div className="text-center py-12 text-gray-400"><MapPin size={48} className="mx-auto mb-3 text-gray-200"/><p>Cadastre veículos para ver o relatório de frota</p></div>
        </div>
      )}
    </div>
  );
}
