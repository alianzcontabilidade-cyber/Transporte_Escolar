import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Brain, MapPin, TrendingDown, Zap, Play, RefreshCw, CheckCircle, Clock, Navigation, BarChart2, Lightbulb, ArrowRight, Users } from 'lucide-react';

function RouteMap({ routes, selected }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const link = document.createElement('link'); link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      const L = (window as any).L;
      const map = L.map(mapRef.current).setView([-10.18, -48.33], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L || !selected) return;
    mapInstanceRef.current.eachLayer((l: any) => { if (l instanceof L.Polyline || l instanceof L.Marker) l.remove(); });
    const colors = { original:'#94a3b8', optimized:'#f97316' };
    selected.originalPath?.forEach((coord: [number,number], i: number) => {
      if (i > 0) { const prev = selected.originalPath[i-1]; L.polyline([prev, coord],{color:colors.original,weight:3,dashArray:'6 4'}).addTo(mapInstanceRef.current); }
    });
    selected.optimizedPath?.forEach((coord: [number,number], i: number) => {
      if (i > 0) { const prev = selected.optimizedPath[i-1]; L.polyline([prev, coord],{color:colors.optimized,weight:4}).addTo(mapInstanceRef.current); }
      const icon = L.divIcon({html:`<div style="background:${i===0?'#22c55e':i===selected.optimizedPath.length-1?'#ef4444':'#f97316'};color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${i+1}</div>`,className:'',iconSize:[24,24],iconAnchor:[12,12]});
      L.marker(coord,{icon}).addTo(mapInstanceRef.current).bindPopup(`Parada ${i+1}`);
    });
    if (selected.optimizedPath?.length) { mapInstanceRef.current.fitBounds(selected.optimizedPath,{padding:[30,30]}); }
  }, [selected]);
  return (
    <div className="relative w-full h-72 rounded-xl overflow-hidden border border-gray-200">
      <div ref={mapRef} className="w-full h-full"/>
      <div className="absolute top-2 left-2 bg-white/95 rounded-lg p-2 text-xs space-y-1 shadow">
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-gray-400" style={{borderTop:'2px dashed #94a3b8'}}/><span className="text-gray-500">Rota original</span></div>
        <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-primary-500" style={{borderTop:'3px solid #f97316'}}/><span className="text-gray-700 font-medium">Rota otimizada por IA</span></div>
      </div>
    </div>
  );
}

const MOCK_ROUTES = [
  { id:1, name:'Rota Centro – Escola Municipal', students:32, stops:8, originalKm:18.4, originalTime:45, optimizedKm:14.2, optimizedTime:32, fuelSaving:12.5, costSaving:8.90, score:94,
    originalPath:[[-10.184,-48.334],[-10.189,-48.328],[-10.195,-48.321],[-10.201,-48.315],[-10.208,-48.308],[-10.213,-48.302],[-10.219,-48.297],[-10.224,-48.291]],
    optimizedPath:[[-10.184,-48.334],[-10.190,-48.325],[-10.198,-48.317],[-10.205,-48.308],[-10.212,-48.299],[-10.219,-48.291]],
    suggestions:['Remover parada 3 (200m da parada 2)','Reagrupar paradas 5 e 6','Inverter sentido no trecho Av. Brasil'] },
  { id:2, name:'Rota Norte – Escola Estadual', students:28, stops:10, originalKm:22.1, originalTime:58, optimizedKm:16.8, optimizedTime:41, fuelSaving:18.2, costSaving:13.20, score:88,
    originalPath:[[-10.164,-48.354],[-10.170,-48.347],[-10.176,-48.341],[-10.182,-48.334],[-10.188,-48.328],[-10.194,-48.321],[-10.200,-48.315],[-10.206,-48.308],[-10.212,-48.302],[-10.218,-48.296]],
    optimizedPath:[[-10.164,-48.354],[-10.172,-48.344],[-10.180,-48.334],[-10.188,-48.325],[-10.196,-48.315],[-10.204,-48.306],[-10.212,-48.296]],
    suggestions:['Consolidar 3 paradas próximas','Usar Av. Teotônio Segurado (menos semáforos)','Reduzir tempo de espera nas paradas'] },
  { id:3, name:'Rota Sul – Escola Municipal II', students:24, stops:7, originalKm:15.6, originalTime:38, optimizedKm:13.1, optimizedTime:28, fuelSaving:9.8, costSaving:6.40, score:91,
    originalPath:[[-10.204,-48.314],[-10.210,-48.307],[-10.216,-48.301],[-10.222,-48.294],[-10.228,-48.288],[-10.234,-48.281],[-10.240,-48.275]],
    optimizedPath:[[-10.204,-48.314],[-10.211,-48.305],[-10.218,-48.296],[-10.225,-48.287],[-10.232,-48.278],[-10.240,-48.275]],
    suggestions:['Eliminar retorno desnecessário na Rua 7','Otimizar horário de saída (06:45 → 06:30)'] },
];

export default function AIRoutesPage() {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState<'overview'|'detail'|'savings'>('overview');

  const totalSavings = MOCK_ROUTES.reduce((s,r) => s + r.costSaving, 0);
  const totalKmSaved = MOCK_ROUTES.reduce((s,r) => s + (r.originalKm - r.optimizedKm), 0);
  const totalMinSaved = MOCK_ROUTES.reduce((s,r) => s + (r.originalTime - r.optimizedTime), 0);

  const runAnalysis = () => {
    setAnalyzing(true); setProgress(0); setAnalyzed(false);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setAnalyzing(false); setAnalyzed(true); setSelected(MOCK_ROUTES[0]); return 100; }
        return p + Math.random() * 12 + 3;
      });
    }, 200);
  };

  const STEPS = ['Coletando dados das rotas...','Analisando padrões de tráfego...','Calculando distâncias e tempos...','Aplicando algoritmo de otimização...','Gerando relatório de economia...'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Brain size={20} className="text-purple-600"/></div>
          <div><h1 className="text-2xl font-bold text-gray-900">IA — Otimização de Rotas</h1><p className="text-gray-500">Menor custo e distância com inteligência artificial</p></div>
        </div>
        <button onClick={runAnalysis} disabled={analyzing} className="btn-primary flex items-center gap-2">
          {analyzing ? <RefreshCw size={16} className="animate-spin"/> : <Play size={16}/>}
          {analyzing ? 'Analisando...' : analyzed ? 'Reanalisar Rotas' : 'Iniciar Análise IA'}
        </button>
      </div>

      {/* Progresso da análise */}
      {analyzing && (
        <div className="card mb-5 border-purple-200 bg-purple-50/30">
          <div className="flex items-center gap-3 mb-3"><Brain size={18} className="text-purple-500 animate-pulse"/><p className="font-semibold text-purple-700">IA processando rotas...</p><span className="text-sm text-purple-500 ml-auto">{Math.round(progress)}%</span></div>
          <div className="h-2 bg-purple-100 rounded-full overflow-hidden mb-3"><div className="h-full bg-gradient-to-r from-purple-500 to-primary-500 rounded-full transition-all duration-200" style={{width:`${progress}%`}}/></div>
          <p className="text-sm text-purple-600 flex items-center gap-2"><Zap size={13}/>{STEPS[Math.floor((progress/100)*STEPS.length)] || STEPS[STEPS.length-1]}</p>
        </div>
      )}

      {/* KPIs de economia */}
      {analyzed && (
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[[TrendingDown,'Economia total',`R$ ${(totalSavings*30).toFixed(0)}/mês`,'bg-green-50 text-green-600'],[MapPin,'Km economizados',`${totalKmSaved.toFixed(1)} km/dia`,'bg-blue-50 text-blue-600'],[Clock,'Tempo poupado',`${totalMinSaved} min/dia`,'bg-primary-50 text-primary-600'],[BarChart2,'Rotas otimizadas',`${MOCK_ROUTES.length} rotas`,'bg-purple-50 text-purple-600']].map(([Icon,label,value,cls]: any) => (
            <div key={label} className={`card ${cls.split(' ')[0]} border-0`}><Icon size={20} className={`${cls.split(' ')[1]} mb-2`}/><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          ))}
        </div>
      )}

      {!analyzed && !analyzing && (
        <div className="card text-center py-16 border-dashed border-2 border-gray-200">
          <Brain size={56} className="text-gray-200 mx-auto mb-4"/>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Análise IA ainda não executada</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">A IA analisa todas as rotas, calcula a sequência ótima de paradas e sugere ajustes para reduzir distância, tempo e custo de combustível.</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-400 mb-6">
            {['Algoritmo de roteamento (TSP)','Dados de tráfego em tempo real','Histórico de viagens','Agrupamento de paradas próximas'].map(f => <span key={f} className="flex items-center gap-1"><CheckCircle size={12} className="text-green-400"/>{f}</span>)}
          </div>
          <button onClick={runAnalysis} className="btn-primary flex items-center gap-2 mx-auto"><Play size={16}/> Iniciar Análise IA</button>
        </div>
      )}

      {analyzed && (
        <>
          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
            {[['overview','Visão Geral',BarChart2],['detail','Detalhe por Rota',MapPin],['savings','Economia Projetada',TrendingDown]].map(([id,label,Icon]: any) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}><Icon size={14}/>{label}</button>
            ))}
          </div>

          {tab==='overview' && (
            <div className="grid gap-3">
              {MOCK_ROUTES.map(route => (
                <div key={route.id} onClick={() => { setSelected(route); setTab('detail'); }} className={`card cursor-pointer hover:border-primary-200 transition-all ${selected?.id===route.id?'border-primary-300 bg-primary-50/20':''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0"><Navigation size={18} className="text-primary-600"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><p className="font-semibold text-gray-800">{route.name}</p><span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Brain size={9}/> Score IA: {route.score}</span></div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users size={10}/>{route.students} alunos</span>
                        <span className="line-through text-gray-400">{route.originalKm}km · {route.originalTime}min</span>
                        <ArrowRight size={10} className="text-green-500"/>
                        <span className="text-green-600 font-medium">{route.optimizedKm}km · {route.optimizedTime}min</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold">-{(route.originalKm-route.optimizedKm).toFixed(1)}km</p>
                      <p className="text-xs text-gray-500">R$ {route.costSaving.toFixed(2)}/viagem</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab==='detail' && selected && (
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 space-y-4">
                <RouteMap routes={MOCK_ROUTES} selected={selected} />
                <div className="card">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-yellow-500"/> Sugestões da IA</h4>
                  <div className="space-y-2">
                    {selected.suggestions.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="w-5 h-5 rounded-full bg-yellow-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                        <p className="text-sm text-yellow-800">{s}</p>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary mt-4 text-sm flex items-center gap-2"><CheckCircle size={14}/> Aplicar otimizações sugeridas</button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">{MOCK_ROUTES.map(r => <button key={r.id} onClick={() => setSelected(r)} className={`flex-1 py-2 text-xs rounded-lg font-medium transition-all ${selected.id===r.id?'bg-primary-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>R{r.id}</button>)}</div>
                {[['Rota original',`${selected.originalKm}km · ${selected.originalTime}min`,'text-gray-500 line-through',null],['Rota otimizada',`${selected.optimizedKm}km · ${selected.optimizedTime}min`,'text-green-600 font-bold','bg-green-50'],['Redução distância',`-${(selected.originalKm-selected.optimizedKm).toFixed(1)}km (${Math.round(((selected.originalKm-selected.optimizedKm)/selected.originalKm)*100)}%)`,'text-primary-600',null],['Economia tempo',`-${selected.originalTime-selected.optimizedTime} min/viagem`,'text-blue-600',null],['Economia combustível',`-${selected.fuelSaving}% de consumo`,'text-teal-600',null],['Economia R$/viagem',`R$ ${selected.costSaving.toFixed(2)}`,'text-green-700 font-bold',null],['Economia R$/mês',`R$ ${(selected.costSaving*22).toFixed(0)}`,'text-green-700 font-bold text-lg','bg-green-50']].map(([l,v,cls,bg]: any) => (
                  <div key={l} className={`flex justify-between items-center p-2 rounded-lg ${bg||''}`}><span className="text-xs text-gray-600">{l}</span><span className={`text-sm ${cls}`}>{v}</span></div>
                ))}
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1"><Brain size={11}/> Score IA: {selected.score}/100</p>
                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{width:`${selected.score}%`}}/></div>
                  <p className="text-xs text-purple-500 mt-1">Excelente oportunidade de otimização</p>
                </div>
              </div>
            </div>
          )}

          {tab==='savings' && (
            <div className="grid grid-cols-2 gap-5">
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><TrendingDown size={16} className="text-green-500"/> Projeção de Economia</h3>
                <div className="space-y-3">
                  {[['Diária',totalSavings,'22 viagens/dia'],['Mensal',totalSavings*22,'~480 viagens/mês'],['Anual',totalSavings*264,'~5.760 viagens/ano']].map(([p,v,sub]: any) => (
                    <div key={p} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div><p className="font-medium text-gray-700">{p}</p><p className="text-xs text-gray-400">{sub}</p></div>
                      <p className="text-lg font-bold text-green-600">R$ {Number(v).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-700">💰 Economia total projetada</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">R$ {(totalSavings*264).toFixed(0)}<span className="text-sm text-green-500">/ano</span></p>
                  <p className="text-xs text-green-500 mt-1">Baseado em {MOCK_ROUTES.length} rotas otimizadas pela IA</p>
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-blue-500"/> Comparativo por Rota</h3>
                <div className="space-y-3">
                  {MOCK_ROUTES.map(r => {
                    const pct = Math.round(((r.originalKm-r.optimizedKm)/r.originalKm)*100);
                    return (
                      <div key={r.id}>
                        <div className="flex justify-between text-sm mb-1"><span className="text-gray-700 truncate pr-2">{r.name.split('–')[0].trim()}</span><span className="text-green-600 font-medium flex-shrink-0">-{pct}% km</span></div>
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="absolute left-0 h-full bg-gray-300 rounded-full" style={{width:`${(r.originalKm/25)*100}%`}}/>
                          <div className="absolute left-0 h-full bg-green-400 rounded-full transition-all" style={{width:`${(r.optimizedKm/25)*100}%`}}/>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>{r.originalKm}km → {r.optimizedKm}km</span><span>R$ {r.costSaving.toFixed(2)}/viagem</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
