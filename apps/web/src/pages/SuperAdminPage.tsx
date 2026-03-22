import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Building2, Users, Bus, Truck, MapPin, Plus, X, Search, Eye, ChevronDown, ChevronUp, Shield, Activity, BarChart3, Check, Loader2 } from 'lucide-react';

type Municipality = {
  id: number;
  name: string;
  state: string;
  city: string;
  cnpj: string;
  email: string;
  phone: string;
  isActive: boolean;
  subscriptionPlan: string;
  schoolCount: number;
  studentCount: number;
  routeCount: number;
  vehicleCount: number;
  driverCount: number;
  activeTrips: number;
  createdAt: string;
};

type GlobalStats = {
  municipalities: number;
  students: number;
  routes: number;
  vehicles: number;
  activeTrips: number;
  documents: number;
};

const PLAN_MAP: Record<string, { label: string; color: string }> = {
  free: { label: 'Gratuito', color: 'bg-gray-100 text-gray-700' },
  basic: { label: 'Basico', color: 'bg-blue-100 text-blue-700' },
  premium: { label: 'Premium', color: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', color: 'bg-yellow-100 text-yellow-700' },
};

const PLAN_OPTIONS = [
  { value: 'free', label: 'Gratuito' },
  { value: 'basic', label: 'Basico' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
];

function getPlanBadge(plan: string) {
  const p = PLAN_MAP[plan] || PLAN_MAP.free;
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.color}`}>{p.label}</span>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function SuperAdminPage() {
  const [tab, setTab] = useState<'overview' | 'municipalities' | 'reports'>('overview');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load real data
  const { data: municipalities, loading: loadingMunicipalities, refetch: refetchList } = useQuery<Municipality[]>(
    () => api.municipalities.list() as Promise<Municipality[]>,
    []
  );

  const { data: globalStats, loading: loadingStats } = useQuery<GlobalStats>(
    () => api.municipalities.globalStats() as Promise<GlobalStats>,
    []
  );

  const toggleActiveMutation = useMutation((input: any) => api.municipalities.toggleActive(input));

  const list = municipalities || [];
  const stats = globalStats || { municipalities: 0, students: 0, routes: 0, vehicles: 0, activeTrips: 0, documents: 0 };

  // Filter list by search
  const filteredList = searchTerm
    ? list.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : list;

  // Plan distribution computed from real data
  const planDistribution = PLAN_OPTIONS.map(plan => {
    const count = list.filter(m => m.subscriptionPlan === plan.value).length;
    const pct = list.length > 0 ? Math.round((count / list.length) * 100) : 0;
    return { ...plan, count, pct };
  });

  // Handle toggle active
  const handleToggleActive = async (mun: Municipality) => {
    await toggleActiveMutation.mutate(
      { id: mun.id, isActive: !mun.isActive },
      { onSuccess: () => refetchList() }
    );
  };

  const isLoading = loadingMunicipalities || loadingStats;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Shield size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1>
            <p className="text-gray-500">Gestao multi-prefeitura consolidada</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Nova Prefeitura
        </button>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="card bg-gray-50 border-0 animate-pulse">
              <div className="h-5 w-5 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {([
            ['Prefeituras', stats.municipalities, 'bg-purple-50', 'text-purple-600', Building2],
            ['Alunos', stats.students.toLocaleString(), 'bg-indigo-50', 'text-indigo-600', Users],
            ['Rotas', stats.routes, 'bg-primary-50', 'text-primary-600', MapPin],
            ['Veiculos', stats.vehicles, 'bg-orange-50', 'text-orange-600', Bus],
            ['Viagens agora', stats.activeTrips, 'bg-green-50', 'text-green-600', Activity],
          ] as [string, any, string, string, any][]).map(([label, value, bg, tc, Icon]) => (
            <div key={label} className={`card ${bg} border-0`}>
              <Icon size={20} className={`${tc} mb-2`} />
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          ['overview', 'Visao Geral', BarChart3],
          ['municipalities', 'Prefeituras', Building2],
          ['reports', 'Relatorios', BarChart3],
        ] as [string, string, any][]).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ======================= TAB: VISAO GERAL ======================= */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-5">
          {/* Atividade em tempo real */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={16} /> Atividade em tempo real
            </h3>
            {loadingMunicipalities ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
              </div>
            ) : list.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhuma prefeitura cadastrada</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {list.filter(m => m.isActive).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full ${m.activeTrips > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">{m.name}/{m.state}</p>
                      <p className="text-xs text-gray-500">{m.studentCount} alunos - {m.routeCount} rotas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{m.activeTrips} em rota</p>
                      {getPlanBadge(m.subscriptionPlan)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Distribuicao por plano */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={16} /> Distribuicao por plano
            </h3>
            {loadingMunicipalities ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {planDistribution.map(plan => (
                    <div key={plan.value}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{plan.label}</span>
                        <span className="text-gray-500">{plan.count} prefeitura(s)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full transition-all" style={{ width: `${plan.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Total consolidado</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
                    <span>{list.reduce((s, m) => s + m.studentCount, 0).toLocaleString()} alunos</span>
                    <span>{list.reduce((s, m) => s + m.vehicleCount, 0)} veiculos</span>
                    <span>{list.reduce((s, m) => s + m.routeCount, 0)} rotas</span>
                    <span>{list.reduce((s, m) => s + m.driverCount, 0)} motoristas</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB: PREFEITURAS ======================= */}
      {tab === 'municipalities' && (
        <div>
          {/* Search bar */}
          <div className="mb-4 relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar prefeitura..."
              className="input pl-9 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="card p-0 overflow-hidden">
            {loadingMunicipalities ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Carregando prefeituras...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                <p>{searchTerm ? 'Nenhuma prefeitura encontrada' : 'Nenhuma prefeitura cadastrada'}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Prefeitura', 'Plano', 'Alunos', 'Rotas', 'Veiculos', 'Status', 'Viagens', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredList.map(m => (
                    <>
                      <tr
                        key={m.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Building2 size={14} className="text-purple-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{m.name}</p>
                              <p className="text-xs text-gray-400">{m.city ? `${m.city} - ` : ''}{m.state}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getPlanBadge(m.subscriptionPlan)}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">{m.studentCount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{m.routeCount}</td>
                        <td className="px-4 py-3 text-gray-600">{m.vehicleCount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {m.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${m.activeTrips > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {m.activeTrips} ativas
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {expandedId === m.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                      </tr>
                      {/* Expanded detail row */}
                      {expandedId === m.id && (
                        <tr key={`detail-${m.id}`}>
                          <td colSpan={8} className="px-0 py-0">
                            <div className="border-t border-gray-100 p-5 bg-purple-50/30">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-800">{m.name} — Detalhes</h4>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleActive(m); }}
                                    disabled={toggleActiveMutation.loading}
                                    className={`btn-secondary text-xs flex items-center gap-1 ${
                                      toggleActiveMutation.loading ? 'opacity-50' : ''
                                    }`}
                                  >
                                    {toggleActiveMutation.loading ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : m.isActive ? (
                                      <X size={12} />
                                    ) : (
                                      <Check size={12} />
                                    )}
                                    {m.isActive ? 'Desativar' : 'Ativar'}
                                  </button>
                                  <button
                                    onClick={() => setExpandedId(null)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                  >
                                    Fechar
                                  </button>
                                </div>
                              </div>

                              {/* Info grid */}
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="text-xs"><span className="text-gray-500">CNPJ:</span> <span className="text-gray-700 font-medium">{m.cnpj || '-'}</span></div>
                                <div className="text-xs"><span className="text-gray-500">Email:</span> <span className="text-gray-700 font-medium">{m.email || '-'}</span></div>
                                <div className="text-xs"><span className="text-gray-500">Telefone:</span> <span className="text-gray-700 font-medium">{m.phone || '-'}</span></div>
                                <div className="text-xs"><span className="text-gray-500">Criada em:</span> <span className="text-gray-700 font-medium">{formatDate(m.createdAt)}</span></div>
                              </div>

                              {/* Stats cards */}
                              <div className="grid grid-cols-5 gap-3">
                                {([
                                  ['Escolas', m.schoolCount, Building2, 'bg-purple-50 text-purple-600'],
                                  ['Alunos', m.studentCount.toLocaleString(), Users, 'bg-indigo-50 text-indigo-600'],
                                  ['Rotas', m.routeCount, MapPin, 'bg-primary-50 text-primary-600'],
                                  ['Veiculos', m.vehicleCount, Bus, 'bg-orange-50 text-orange-600'],
                                  ['Motoristas', m.driverCount, Truck, 'bg-teal-50 text-teal-600'],
                                ] as [string, any, any, string][]).map(([l, v, Icon, cls]) => (
                                  <div key={l} className="card text-center p-3">
                                    <Icon size={16} className={`mx-auto mb-1 ${cls.split(' ')[1]}`} />
                                    <p className="font-bold text-gray-800">{v}</p>
                                    <p className="text-xs text-gray-500">{l}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB: RELATORIOS ======================= */}
      {tab === 'reports' && (
        <div className="grid grid-cols-2 gap-5">
          {/* Resumo geral */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-500" /> Resumo do Sistema
            </h3>
            {loadingMunicipalities ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
              </div>
            ) : (
              <div className="space-y-3">
                {([
                  ['Total de prefeituras', list.length],
                  ['Prefeituras ativas', list.filter(m => m.isActive).length],
                  ['Prefeituras inativas', list.filter(m => !m.isActive).length],
                  ['Total de alunos', list.reduce((s, m) => s + m.studentCount, 0).toLocaleString()],
                  ['Total de rotas', list.reduce((s, m) => s + m.routeCount, 0)],
                  ['Total de veiculos', list.reduce((s, m) => s + m.vehicleCount, 0)],
                  ['Total de motoristas', list.reduce((s, m) => s + m.driverCount, 0)],
                  ['Viagens ativas agora', list.reduce((s, m) => s + m.activeTrips, 0)],
                ] as [string, any][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{label}</span>
                    <span className="text-sm font-bold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking de prefeituras */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" /> Ranking por Alunos
            </h3>
            {loadingMunicipalities ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
              </div>
            ) : list.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Nenhuma prefeitura cadastrada</p>
            ) : (
              <div className="space-y-2">
                {[...list]
                  .sort((a, b) => b.studentCount - a.studentCount)
                  .slice(0, 10)
                  .map((m, i) => {
                    const maxStudents = Math.max(...list.map(x => x.studentCount), 1);
                    const pct = Math.round((m.studentCount / maxStudents) * 100);
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs font-bold text-gray-400 w-5 text-right">{i + 1}.</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{m.name}/{m.state}</span>
                            <span className="text-gray-500">{m.studentCount.toLocaleString()} alunos</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= MODAL: NOVA PREFEITURA ======================= */}
      {showCreateModal && (
        <CreateMunicipalityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetchList();
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   MODAL: CRIAR NOVA PREFEITURA (wizard 2 etapas)
   ============================================================ */
function CreateMunicipalityModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);

  // Step 1 - Municipality data
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('basic');

  // Step 2 - Admin user
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const createMutation = useMutation((input: any) => api.municipalities.create(input));

  const handleSubmit = async () => {
    await createMutation.mutate(
      {
        name,
        state,
        city,
        cnpj,
        email,
        phone,
        subscriptionPlan: plan,
        adminName,
        adminEmail,
        adminPassword,
      },
      { onSuccess: () => onSuccess() }
    );
  };

  const canGoStep2 = name.trim() && state.trim() && city.trim() && email.trim();
  const canSubmit = adminName.trim() && adminEmail.trim() && adminPassword.trim() && adminPassword.length >= 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 size={16} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Nova Prefeitura</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>1</div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>2</div>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            {step === 1 ? 'Etapa 1: Dados da prefeitura' : 'Etapa 2: Administrador'}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              <div>
                <label className="label">Nome da prefeitura *</label>
                <input className="input w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Prefeitura de..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Estado *</label>
                  <input className="input w-full" value={state} onChange={e => setState(e.target.value)} placeholder="TO" maxLength={2} />
                </div>
                <div>
                  <label className="label">Cidade *</label>
                  <input className="input w-full" value={city} onChange={e => setCity(e.target.value)} placeholder="Palmas" />
                </div>
              </div>
              <div>
                <label className="label">CNPJ</label>
                <input className="input w-full" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email *</label>
                  <input className="input w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@prefeitura.gov.br" />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input className="input w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(63) 3333-0000" />
                </div>
              </div>
              <div>
                <label className="label">Plano</label>
                <select className="input w-full" value={plan} onChange={e => setPlan(e.target.value)}>
                  {PLAN_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="p-3 bg-blue-50 rounded-xl mb-2">
                <p className="text-xs text-blue-700">Este usuario sera o administrador principal da prefeitura e podera gerenciar todos os dados.</p>
              </div>
              <div>
                <label className="label">Nome completo *</label>
                <input className="input w-full" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Nome do administrador" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input w-full" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@prefeitura.gov.br" />
              </div>
              <div>
                <label className="label">Senha * (minimo 6 caracteres)</label>
                <input className="input w-full" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Senha segura" />
              </div>
            </>
          )}

          {createMutation.error && (
            <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700">{createMutation.error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className="btn-primary flex items-center gap-2"
              >
                Proximo <ChevronDown size={14} className="rotate-[-90deg]" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="btn-secondary">Voltar</button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || createMutation.loading}
                className="btn-primary flex items-center gap-2"
              >
                {createMutation.loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Criando...</>
                ) : (
                  <><Check size={14} /> Criar Prefeitura</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
