import { useState } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp, Brain, Bus, Zap, Calendar, Shield, BarChart2, Activity } from 'lucide-react';

const RISK = { high:{label:'Alto Risco',color:'text-red-700',bg:'bg-red-100',border:'border-red-200',dot:'bg-red-500'}, medium:{label:'Risco Médio',color:'text-yellow-700',bg:'bg-yellow-100',border:'border-yellow-200',dot:'bg-yellow-500'}, low:{label:'Baixo Risco',color:'text-green-700',bg:'bg-green-100',border:'border-green-200',dot:'bg-green-500'} };

const VEHICLES = [
  { id:1, plate:'ABC-1234', model:'Mercedes-Benz OF-1721', year:2018, km:148500, risk:'high', score:78,
    components:[{name:'Freios dianteiros',risk:'high',lastKm:120000,intervalKm:30000,predDays:8,confidence:94},{name:'Correia dentada',risk:'high',lastKm:100000,intervalKm:60000,predDays:12,confidence:91},{name:'Filtro de óleo',risk:'medium',lastKm:140000,intervalKm:10000,predDays:21,confidence:87},{name:'Amortecedores',risk:'medium',lastKm:80000,intervalKm:80000,predDays:35,confidence:82},{name:'Pneus dianteiros',risk:'low',lastKm:110000,intervalKm:50000,predDays:62,confidence:76}],
    history:[{date:'15/01/2025',type:'Troca de óleo',km:140000},{date:'10/11/2024',type:'Revisão geral',km:130000},{date:'05/08/2024',type:'Freios traseiros',km:118000}] },
  { id:2, plate:'DEF-5678', model:'Volkswagen 17.230', year:2019, km:112000, risk:'medium', score:52,
    components:[{name:'Filtro de ar',risk:'medium',lastKm:100000,intervalKm:15000,predDays:18,confidence:89},{name:'Velas de ignição',risk:'medium',lastKm:90000,intervalKm:30000,predDays:28,confidence:84},{name:'Transmissão',risk:'low',lastKm:112000,intervalKm:50000,predDays:55,confidence:71},{name:'Freios traseiros',risk:'low',lastKm:95000,intervalKm:40000,predDays:78,confidence:68}],
    history:[{date:'20/12/2024',type:'Troca correia',km:108000},{date:'15/09/2024',type:'Troca de óleo',km:98000}] },
  { id:3, plate:'GHI-9012', model:'Mercedes-Benz OF-1418', year:2020, km:78000, risk:'low', score:23,
    components:[{name:'Óleo do motor',risk:'low',lastKm:73000,intervalKm:10000,predDays:45,confidence:95},{name:'Bateria',risk:'low',lastKm:0,intervalKm:50000,predDays:92,confidence:72},{name:'Filtro de combustível',risk:'low',lastKm:50000,intervalKm:40000,predDays:110,confidence:69}],
    history:[{date:'10/02/2025',type:'Revisão 72.000km',km:72000},{date:'08/10/2024',type:'Troca de óleo',km:62000}] },
];

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full transition-all`} style={{width:`${score}%`}}/></div>
      <span className={`text-xs font-bold ${score>=70?'text-red-600':score>=40?'text-yellow-600':'text-green-600'}`}>{score}%</span>
    </div>
  );
}

export default function PredictivePage() {
  const [selected, setSelected] = useState(VEHICLES[0]);
  const [tab, setTab] = useState<'alerts'|'vehicles'|'history'|'insights'>('alerts');
  const highRisk = VEHICLES.filter(v => v.risk==='high').length;
  const medRisk = VEHICLES.filter(v => v.risk==='medium').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Brain size={20} className="text-orange-600"/></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Manutenção Preditiva IA</h1><p className="text-gray-500">Alertas inteligentes antes da falha — evite paradas não planejadas</p></div>
        </div>
        <div className="flex gap-2">
          {highRisk>0 && <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><AlertTriangle size={14}/>{highRisk} veículo(s) em risco alto</div>}
          <button className="btn-primary flex items-center gap-2 text-sm"><Brain size={14}/> Atualizar Análise IA</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[[AlertTriangle,highRisk,'Risco Alto','bg-red-50 text-red-500'],[Clock,medRisk,'Risco Médio','bg-yellow-50 text-yellow-500'],[CheckCircle,VEHICLES.filter(v=>v.risk==='low').length,'Saudáveis','bg-green-50 text-green-500'],[Shield,VEHICLES.length,'Total Monitorados','bg-blue-50 text-blue-500']].map(([Icon,v,l,cls]: any) => (
          <div key={l} className={`card ${cls.split(' ')[0]} border-0`}><Icon size={20} className={`${cls.split(' ')[1]} mb-2`}/><p className="text-2xl font-bold text-gray-900">{v}</p><p className="text-xs text-gray-500">{l}</p></div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[['alerts','Alertas Críticos',AlertTriangle],['vehicles','Frota Completa',Bus],['history','Histórico',Calendar],['insights','Insights IA',Brain]].map(([id,label,Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}><Icon size={14}/>{label}</button>
        ))}
      </div>

      {tab==='alerts' && (
        <div className="space-y-3">
          {VEHICLES.flatMap(v => v.components.filter(c => c.risk==='high' || c.risk==='medium').map(c => ({...c, vehicle:v}))).sort((a,b) => a.predDays-b.predDays).map((item,i) => {
            const rk = RISK[item.risk as keyof typeof RISK];
            return (
              <div key={i} className={`card border ${rk.border} ${rk.bg}/30 flex items-center gap-4`}>
                <div className={`w-2 h-12 rounded-full ${rk.dot} flex-shrink-0`}/>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 border border-gray-100"><Wrench size={16} className="text-gray-500"/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rk.bg} ${rk.color}`}>{rk.label}</span>
                  </div>
                  <p className="text-sm text-gray-500">{item.vehicle.model} · <span className="font-medium">{item.vehicle.plate}</span></p>
                  <p className="text-xs text-gray-400">Km atual: {item.vehicle.km.toLocaleString()} · Intervalo: {item.intervalKm.toLocaleString()}km</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-lg ${item.predDays<=14?'text-red-600':item.predDays<=30?'text-yellow-600':'text-green-600'}`}>{item.predDays} dias</p>
                  <p className="text-xs text-gray-500">para manutenção</p>
                  <p className="text-xs text-gray-400">Confiança: {item.confidence}%</p>
                </div>
                <button className="btn-primary text-xs px-3 py-1.5 flex-shrink-0">Agendar</button>
              </div>
            );
          })}
          {VEHICLES.flatMap(v => v.components.filter(c => c.risk==='high' || c.risk==='medium')).length === 0 && (
            <div className="card text-center py-12"><CheckCircle size={40} className="text-green-300 mx-auto mb-3"/><p className="text-gray-500">Nenhum alerta crítico no momento</p></div>
          )}
        </div>
      )}

      {tab==='vehicles' && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1 space-y-3">
            {VEHICLES.map(v => {
              const rk = RISK[v.risk as keyof typeof RISK];
              return (
                <div key={v.id} onClick={() => setSelected(v)} className={`card cursor-pointer transition-all ${selected.id===v.id?'border-primary-300 bg-primary-50/20':'hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2 h-2 rounded-full ${rk.dot}`}/>
                    <p className="font-bold text-gray-800">{v.plate}</p>
                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-medium ${rk.bg} ${rk.color}`}>{rk.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{v.model} · {v.year}</p>
                  <p className="text-xs text-gray-400 mb-2">{v.km.toLocaleString()} km rodados</p>
                  <RiskBar score={v.score}/>
                </div>
              );
            })}
          </div>
          <div className="col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-semibold text-gray-800">{selected.plate} — {selected.model}</h3><p className="text-sm text-gray-500">{selected.year} · {selected.km.toLocaleString()} km</p></div>
                <div className="text-right"><p className="text-xs text-gray-500 mb-1">Índice de risco IA</p><RiskBar score={selected.score}/></div>
              </div>
              <div className="space-y-3">
                {selected.components.map((c,i) => {
                  const rk = RISK[c.risk as keyof typeof RISK];
                  const kmLeft = c.intervalKm-(selected.km-c.lastKm);
                  const pct = Math.min(100, Math.round(((selected.km-c.lastKm)/c.intervalKm)*100));
                  return (
                    <div key={i} className={`p-3 rounded-xl border ${rk.border} ${rk.bg}/20`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${rk.dot}`}/><span className="text-sm font-medium text-gray-700">{c.name}</span><span className={`text-xs ${rk.color}`}>— {rk.label}</span></div>
                        <div className="text-right"><span className={`text-sm font-bold ${c.predDays<=14?'text-red-600':c.predDays<=30?'text-yellow-600':'text-green-600'}`}>{c.predDays}d</span><span className="text-xs text-gray-400 ml-1">até manutenção</span></div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1"><div className={`h-full rounded-full transition-all ${pct>=90?'bg-red-500':pct>=70?'bg-yellow-500':'bg-green-400'}`} style={{width:`${pct}%`}}/></div>
                      <div className="flex justify-between text-xs text-gray-400"><span>Desgaste: {pct}%</span><span>Km restante: ~{kmLeft > 0 ? kmLeft.toLocaleString() : 0}km</span><span>Confiança IA: {c.confidence}%</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='history' && (
        <div className="grid gap-4">
          {VEHICLES.map(v => (
            <div key={v.id} className="card">
              <div className="flex items-center gap-3 mb-3"><Bus size={16} className="text-gray-500"/><h3 className="font-semibold text-gray-800">{v.plate} — {v.model}</h3></div>
              <div className="space-y-2">
                {v.history.map((h,i) => (
                  <div key={i} className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><Wrench size={14} className="text-blue-600"/></div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-700">{h.type}</p><p className="text-xs text-gray-400">{h.date} · {h.km.toLocaleString()} km</p></div>
                    <CheckCircle size={14} className="text-green-500"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='insights' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Brain size={16} className="text-purple-500"/> Análise IA da Frota</h3>
            <div className="space-y-3">
              {[{icon:AlertTriangle,color:'text-red-500',bg:'bg-red-50',title:'Atenção Urgente',desc:'ABC-1234 com freios e correia dentada próximos do limite. Agendar manutenção nos próximos 8 dias evita risco de acidente.'},
                {icon:TrendingUp,color:'text-yellow-500',bg:'bg-yellow-50',title:'Padrão Identificado',desc:'Veículos com mais de 100.000 km apresentam 3x mais falhas nos freios. Recomendar revisão preventiva semestral.'},
                {icon:Activity,color:'text-blue-500',bg:'bg-blue-50',title:'Otimização de Custos',desc:'Centralizar manutenções preventivas mensalmente pode reduzir o custo total em 23% comparado a manutenções emergenciais.'},
                {icon:Shield,color:'text-green-500',bg:'bg-green-50',title:'Boa Prática',desc:'GHI-9012 (2020) mantém excelente histórico de manutenção. Usar como referência para gestão da frota mais antiga.'}
              ].map((item,i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`p-3 ${item.bg} rounded-xl flex items-start gap-3`}>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5"><Icon size={15} className={item.color}/></div>
                    <div><p className={`text-sm font-semibold mb-0.5 ${item.color}`}>{item.title}</p><p className="text-xs text-gray-600">{item.desc}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={16} className="text-primary-500"/> Calendário de Manutenções</h3>
            <div className="space-y-2">
              {VEHICLES.flatMap(v => v.components.filter(c => c.predDays<=60).map(c => ({...c,vehicle:v}))).sort((a,b)=>a.predDays-b.predDays).map((item,i) => {
                const rk = RISK[item.risk as keyof typeof RISK];
                const date = new Date(); date.setDate(date.getDate()+item.predDays);
                return (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-lg ${rk.bg} flex flex-col items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-bold ${rk.color}`}>{date.getDate()}</span>
                      <span className={`text-xs ${rk.color}`}>{date.toLocaleString('pt-BR',{month:'short'})}</span>
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-700 truncate">{item.name}</p><p className="text-xs text-gray-400">{item.vehicle.plate}</p></div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${rk.bg} ${rk.color}`}>{item.predDays}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
