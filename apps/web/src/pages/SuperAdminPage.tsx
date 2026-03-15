import { useState } from 'react';
import { Building2, Users, Bus, MapPin, TrendingUp, BarChart2, Shield, Plus, ChevronRight, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

const MOCK_MUNICIPALITIES = [
  { id:1, name:'Palmas', state:'TO', students:1240, routes:18, vehicles:22, drivers:20, status:'active', activeTrips:4, plan:'Premium' },
  { id:2, name:'Araguaína', state:'TO', students:890, routes:12, vehicles:15, drivers:14, status:'active', activeTrips:2, plan:'Standard' },
  { id:3, name:'Paraíso do Tocantins', state:'TO', students:420, routes:7, vehicles:8, drivers:8, status:'active', activeTrips:1, plan:'Basic' },
  { id:4, name:'Gurupi', state:'TO', students:310, routes:5, vehicles:6, drivers:6, status:'inactive', activeTrips:0, plan:'Basic' },
];

const PLANS = [
  { name:'Basic', color:'bg-gray-100 text-gray-700', max:'até 500 alunos' },
  { name:'Standard', color:'bg-blue-100 text-blue-700', max:'até 1.000 alunos' },
  { name:'Premium', color:'bg-purple-100 text-purple-700', max:'alunos ilimitados' },
];

export default function SuperAdminPage() {
  const [tab, setTab] = useState<'overview'|'municipalities'|'reports'>('overview');
  const [selected, setSelected] = useState<any>(null);
  const total = { students: MOCK_MUNICIPALITIES.reduce((s,m) => s+m.students,0), routes: MOCK_MUNICIPALITIES.reduce((s,m) => s+m.routes,0), vehicles: MOCK_MUNICIPALITIES.reduce((s,m) => s+m.vehicles,0), active: MOCK_MUNICIPALITIES.filter(m => m.status==='active').length, trips: MOCK_MUNICIPALITIES.reduce((s,m) => s+m.activeTrips,0) };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Shield size={20} className="text-purple-600"/></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1><p className="text-gray-500">Gestão multi-prefeitura consolidada</p></div>
        </div>
        <button className="btn-primary flex items-center gap-2"><Plus size={16}/> Nova Prefeitura</button>
      </div>

      {/* KPIs consolidados */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[['Prefeituras',total.active,'bg-purple-50','text-purple-600',Building2],['Alunos',total.students.toLocaleString(),'bg-indigo-50','text-indigo-600',Users],['Rotas',total.routes,'bg-primary-50','text-primary-600',MapPin],['Veículos',total.vehicles,'bg-orange-50','text-orange-600',Bus],['Viagens agora',total.trips,'bg-green-50','text-green-600',Activity]].map(([label,value,bg,tc,Icon]: any) => (
          <div key={label} className={`card ${bg} border-0`}>
            <Icon size={20} className={`${tc} mb-2`}/>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['overview','Visão Geral',BarChart2],['municipalities','Prefeituras',Building2],['reports','Relatórios',TrendingUp]].map(([id,label,Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}><Icon size={14}/> {label}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Activity size={16}/> Atividade em tempo real</h3>
            <div className="space-y-3">
              {MOCK_MUNICIPALITIES.filter(m => m.status==='active').map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${m.activeTrips>0?'bg-green-500':'bg-gray-300'}`}/>
                  <div className="flex-1"><p className="font-medium text-sm text-gray-800">{m.name}/{m.state}</p><p className="text-xs text-gray-500">{m.students} alunos · {m.routes} rotas</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-green-600">{m.activeTrips} em rota</p><span className={`text-xs px-2 py-0.5 rounded-full ${PLANS.find(p=>p.name===m.plan)?.color}`}>{m.plan}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Distribuição por plano</h3>
            <div className="space-y-3">
              {PLANS.map(plan => {
                const count = MOCK_MUNICIPALITIES.filter(m => m.plan===plan.name).length;
                const pct = Math.round((count/MOCK_MUNICIPALITIES.length)*100);
                return (
                  <div key={plan.name}>
                    <div className="flex justify-between text-sm mb-1"><span className="font-medium text-gray-700">{plan.name}</span><span className="text-gray-500">{count} prefeitura(s) · {plan.max}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary-400 rounded-full transition-all" style={{width:`${pct}%`}}/></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-1">Total consolidado</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                <span>👨‍🎓 {total.students.toLocaleString()} alunos</span>
                <span>🚌 {total.vehicles} veículos</span>
                <span>🗺️ {total.routes} rotas</span>
                <span>👨‍✈️ {MOCK_MUNICIPALITIES.reduce((s,m)=>s+m.drivers,0)} motoristas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='municipalities' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Prefeitura','Plano','Alunos','Rotas','Veículos','Status','Viagens',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_MUNICIPALITIES.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(selected?.id===m.id?null:m)}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"><Building2 size={14} className="text-purple-600"/></div><div><p className="font-semibold text-gray-800">{m.name}</p><p className="text-xs text-gray-400">{m.state}</p></div></div></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${PLANS.find(p=>p.name===m.plan)?.color}`}>{m.plan}</span></td>
                  <td className="px-4 py-3 font-medium text-gray-700">{m.students.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{m.routes}</td>
                  <td className="px-4 py-3 text-gray-600">{m.vehicles}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${m.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{m.status==='active'?'Ativa':'Inativa'}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold ${m.activeTrips>0?'text-green-600':'text-gray-400'}`}>{m.activeTrips} ativas</span></td>
                  <td className="px-4 py-3 text-gray-400"><ChevronRight size={14}/></td>
                </tr>
              ))}
            </tbody>
          </table>
          {selected && (
            <div className="border-t border-gray-100 p-5 bg-purple-50/30">
              <div className="flex items-center justify-between mb-3"><h4 className="font-semibold text-gray-800">{selected.name} — Detalhes</h4><button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Fechar</button></div>
              <div className="grid grid-cols-4 gap-3">
                {[['Alunos',selected.students.toLocaleString(),Users,'bg-indigo-50 text-indigo-600'],['Rotas',selected.routes,MapPin,'bg-primary-50 text-primary-600'],['Veículos',selected.vehicles,Bus,'bg-orange-50 text-orange-600'],['Motoristas',selected.drivers,Users,'bg-teal-50 text-teal-600']].map(([l,v,Icon,cls]: any) => (
                  <div key={l} className="card text-center p-3"><Icon size={16} className={`mx-auto mb-1 ${cls.split(' ')[1]}`}/><p className="font-bold text-gray-800">{v}</p><p className="text-xs text-gray-500">{l}</p></div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='reports' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card"><h3 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Relatório de Conformidade</h3>
            <div className="space-y-2">{MOCK_MUNICIPALITIES.map(m => (<div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"><span className="text-sm text-gray-700">{m.name}/{m.state}</span><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-400 rounded-full" style={{width:`${m.status==='active'?'85':'40'}%`}}/></div><span className="text-xs text-gray-500">{m.status==='active'?'85':'40'}%</span></div></div>))}</div>
          </div>
          <div className="card"><h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-500"/> Alertas do Sistema</h3>
            <div className="space-y-2">
              {[{msg:'Gurupi: prefeitura inativa há 15 dias',type:'warn'},{msg:'Paraíso: 2 veículos com CRLV vencido',type:'warn'},{msg:'Araguaína: 1 motorista sem CNH válida',type:'error'},{msg:'Palmas: sistema operando normalmente',type:'ok'}].map((a,i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${a.type==='error'?'bg-red-50':a.type==='warn'?'bg-yellow-50':'bg-green-50'}`}>
                  {a.type==='ok'?<CheckCircle size={14} className="text-green-500 mt-0.5"/>:<AlertTriangle size={14} className={`mt-0.5 ${a.type==='error'?'text-red-500':'text-yellow-500'}`}/>}
                  <p className={`text-xs ${a.type==='error'?'text-red-700':a.type==='warn'?'text-yellow-700':'text-green-700'}`}>{a.msg}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
