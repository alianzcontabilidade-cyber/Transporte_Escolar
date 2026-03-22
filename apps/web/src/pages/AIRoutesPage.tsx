import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Brain, MapPin, Route, TrendingUp, TrendingDown, Loader2, Check, AlertTriangle, Users, Play, ChevronDown, ChevronRight, Lightbulb, RefreshCw } from 'lucide-react';

interface RouteStop {
  id: number;
  name: string;
  currentOrder: number;
  suggestedOrder: number;
  lat: number;
  lng: number;
}

interface RouteAnalysis {
  routeId: number;
  routeName: string;
  currentDistance: number;
  optimizedDistance: number;
  savingsKm: number;
  savingsPercent: number;
  optimizedOrder: number[];
  suggestions: string[];
  score: number;
  stops: RouteStop[];
}

interface StopCluster {
  centerId: number;
  centerLat: number;
  centerLng: number;
  students: { id: number; name: string; address: string }[];
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600 bg-green-100' : score >= 50 ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100';
  const barColor = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}</span>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function AIRoutesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId;
  const [tab, setTab] = useState<'routes' | 'stops'>('routes');
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [numClusters, setNumClusters] = useState(5);
  const [analyzed, setAnalyzed] = useState(false);

  // Analysis query - only runs when triggered
  const { data: routeAnalysis, loading: analyzing, error: analyzeError, refetch: runAnalysis } = useQuery<RouteAnalysis[]>(
    () => api.ai.analyzeRoutes({ municipalityId }),
    [municipalityId]
  );

  // Suggest stops query - for the second tab
  const { data: clusters, loading: loadingClusters, error: clustersError, refetch: loadClusters } = useQuery<StopCluster[]>(
    () => api.ai.suggestStops({ municipalityId, numClusters }),
    [municipalityId, numClusters]
  );

  // Optimize route mutation
  const { mutate: optimizeRoute, loading: optimizing } = useMutation(api.ai.optimizeRoute);

  const routes = routeAnalysis || [];

  // Stats
  const totalRoutes = routes.length;
  const totalCurrentKm = routes.reduce((s, r) => s + r.currentDistance, 0);
  const totalSavingsKm = routes.reduce((s, r) => s + r.savingsKm, 0);
  const avgScore = totalRoutes > 0 ? Math.round(routes.reduce((s, r) => s + r.score, 0) / totalRoutes) : 0;

  const handleOptimize = (routeId: number) => {
    optimizeRoute({ routeId }, {
      onSuccess: () => {
        runAnalysis();
      },
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Brain size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Otimizacao Inteligente de Rotas</h1>
            <p className="text-gray-500 text-sm">Analise e otimize rotas com inteligencia artificial</p>
          </div>
        </div>
        <button
          onClick={() => { runAnalysis(); setAnalyzed(true); }}
          disabled={analyzing}
          className="btn-primary flex items-center gap-2"
        >
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {analyzing ? 'Analisando...' : 'Analisar Rotas'}
        </button>
      </div>

      {/* Error */}
      {analyzeError && (
        <div className="card mb-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={16} />
            <p className="text-sm">{analyzeError}</p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      {routes.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 border-0">
            <Route size={20} className="text-blue-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{totalRoutes}</p>
            <p className="text-xs text-gray-500">Total rotas</p>
          </div>
          <div className="card bg-gray-50 border-0">
            <MapPin size={20} className="text-gray-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{totalCurrentKm.toFixed(1)} km</p>
            <p className="text-xs text-gray-500">Distancia total atual</p>
          </div>
          <div className="card bg-green-50 border-0">
            <TrendingDown size={20} className="text-green-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">-{totalSavingsKm.toFixed(1)} km</p>
            <p className="text-xs text-gray-500">Economia potencial</p>
          </div>
          <div className="card bg-purple-50 border-0">
            <Brain size={20} className="text-purple-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{avgScore}/100</p>
            <p className="text-xs text-gray-500">Score medio</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('routes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'routes' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Route size={14} /> Analise de Rotas
        </button>
        <button
          onClick={() => setTab('stops')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'stops' ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <MapPin size={14} /> Sugestao de Paradas
        </button>
      </div>

      {/* Tab: Analise de Rotas */}
      {tab === 'routes' && (
        <>
          {analyzing && (
            <div className="card border-purple-200 bg-purple-50/30 mb-4">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-500 animate-pulse" />
                <p className="font-semibold text-purple-700">IA processando rotas...</p>
                <Loader2 size={16} className="animate-spin text-purple-500 ml-auto" />
              </div>
            </div>
          )}

          {!analyzing && routes.length === 0 && (
            <div className="card text-center py-16 border-dashed border-2 border-gray-200">
              <Brain size={56} className="text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Analise IA ainda nao executada</h3>
              <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                Clique em "Analisar Rotas" para que a IA calcule a melhor sequencia de paradas e sugira otimizacoes.
              </p>
              <button onClick={() => { runAnalysis(); setAnalyzed(true); }} className="btn-primary flex items-center gap-2 mx-auto">
                <Play size={16} /> Iniciar Analise IA
              </button>
            </div>
          )}

          {routes.length > 0 && (
            <div className="space-y-3">
              {routes.map((route) => {
                const isExpanded = expandedRoute === route.routeId;
                const scoreColor = route.score >= 80 ? 'text-green-600' : route.score >= 50 ? 'text-yellow-600' : 'text-red-600';
                return (
                  <div key={route.routeId} className="card">
                    {/* Route header */}
                    <div
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedRoute(isExpanded ? null : route.routeId)}
                    >
                      <div className="flex items-center gap-2 text-gray-400">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Route size={18} className="text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">{route.routeName}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                          <span>{route.currentDistance.toFixed(1)} km atual</span>
                          <span className="text-green-600 font-medium">{route.optimizedDistance.toFixed(1)} km otimizado</span>
                          <span className={`font-medium ${scoreColor}`}>-{route.savingsPercent.toFixed(0)}%</span>
                        </div>
                      </div>
                      <ScoreGauge score={route.score} />
                      <div className="text-right">
                        <p className="text-green-600 font-bold text-sm">-{route.savingsKm.toFixed(1)} km</p>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        {/* Stops comparison */}
                        {route.stops && route.stops.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Paradas - Ordem atual vs sugerida</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-1 font-medium">Ordem atual</p>
                                {[...route.stops].sort((a, b) => a.currentOrder - b.currentOrder).map((stop, i) => (
                                  <div key={stop.id} className="flex items-center gap-2 py-1 text-sm text-gray-600">
                                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                    {stop.name}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1 font-medium">Ordem sugerida pela IA</p>
                                {[...route.stops].sort((a, b) => a.suggestedOrder - b.suggestedOrder).map((stop, i) => (
                                  <div key={stop.id} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                                    <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                                    {stop.name}
                                    {stop.currentOrder !== stop.suggestedOrder && (
                                      <span className="text-xs text-orange-500 font-medium">(era {stop.currentOrder})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Suggestions */}
                        {route.suggestions && route.suggestions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <Lightbulb size={14} className="text-yellow-500" /> Sugestoes da IA
                            </h4>
                            <div className="space-y-2">
                              {route.suggestions.map((s, i) => (
                                <div key={i} className="flex items-start gap-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                  <div className="w-5 h-5 rounded-full bg-yellow-400 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                                  <p className="text-sm text-yellow-800">{s}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Apply button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOptimize(route.routeId); }}
                          disabled={optimizing}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          {optimizing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Aplicar Otimizacao
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Sugestao de Paradas */}
      {tab === 'stops' && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-600">Numero de clusters:</label>
            <select
              value={numClusters}
              onChange={(e) => setNumClusters(Number(e.target.value))}
              className="input w-24"
            >
              {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={loadClusters} disabled={loadingClusters} className="btn-primary text-sm flex items-center gap-2">
              {loadingClusters ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Calcular
            </button>
          </div>

          {clustersError && (
            <div className="card mb-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={16} />
                <p className="text-sm">{clustersError}</p>
              </div>
            </div>
          )}

          {loadingClusters && (
            <div className="card border-purple-200 bg-purple-50/30">
              <div className="flex items-center gap-3">
                <Brain size={18} className="text-purple-500 animate-pulse" />
                <p className="font-semibold text-purple-700">Agrupando alunos nao atribuidos...</p>
                <Loader2 size={16} className="animate-spin text-purple-500 ml-auto" />
              </div>
            </div>
          )}

          {!loadingClusters && clusters && clusters.length === 0 && (
            <div className="card text-center py-12 border-dashed border-2 border-gray-200">
              <Users size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum aluno sem rota encontrado</p>
            </div>
          )}

          {clusters && clusters.length > 0 && (
            <div className="space-y-3">
              {clusters.map((cluster, idx) => {
                const isExpanded = expandedCluster === idx;
                return (
                  <div key={idx} className="card">
                    <div
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedCluster(isExpanded ? null : idx)}
                    >
                      <div className="flex items-center gap-2 text-gray-400">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MapPin size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Cluster {idx + 1}</p>
                        <p className="text-xs text-gray-500">
                          Lat: {cluster.centerLat.toFixed(4)}, Lng: {cluster.centerLng.toFixed(4)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{cluster.students.length} alunos</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="space-y-2">
                          {cluster.students.map((student) => (
                            <div key={student.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <Users size={14} className="text-gray-400 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">{student.name}</p>
                                <p className="text-xs text-gray-400">{student.address}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
