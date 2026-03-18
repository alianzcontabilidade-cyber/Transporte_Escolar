import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Building2, Users, GraduationCap, Bus, MapPin, FileText, DollarSign, TrendingUp, TrendingDown, School, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TransparencyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [munId, setMunId] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.transparency.publicData({ municipalityId: munId })
      .then((d: any) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [munId]);

  const fmtMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="text-primary-500 animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Dados nao encontrados</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Building2 size={28} /></div>
              <div><h1 className="text-2xl font-bold">Portal de Transparencia</h1><p className="text-white/80">{data.municipality?.name} - {data.municipality?.city}/{data.municipality?.state}</p></div>
            </div>
            <Link to="/login" className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">Acessar sistema</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            [School, 'Escolas', data.stats.schools, 'bg-blue-50 text-blue-600'],
            [Users, 'Alunos', data.stats.students.toLocaleString(), 'bg-green-50 text-green-600'],
            [GraduationCap, 'Professores', data.stats.teachers, 'bg-purple-50 text-purple-600'],
            [Bus, 'Veiculos', data.stats.vehicles, 'bg-orange-50 text-orange-600'],
            [MapPin, 'Rotas', data.stats.routes, 'bg-teal-50 text-teal-600'],
            [FileText, 'Contratos', data.stats.contracts, 'bg-indigo-50 text-indigo-600'],
          ].map(([Icon, label, value, cls]: any) => (
            <div key={label} className={`rounded-2xl p-4 text-center ${cls.split(' ')[0]}`}>
              <Icon size={24} className={`mx-auto mb-2 ${cls.split(' ')[1]}`} />
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Financeiro */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-green-500" /><p className="text-sm font-semibold text-gray-500">Receitas</p></div>
            <p className="text-2xl font-bold text-green-600">{fmtMoney(data.financial.receita)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-2"><TrendingDown size={18} className="text-red-400" /><p className="text-sm font-semibold text-gray-500">Despesas</p></div>
            <p className="text-2xl font-bold text-red-600">{fmtMoney(data.financial.despesa)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-2"><DollarSign size={18} className="text-blue-500" /><p className="text-sm font-semibold text-gray-500">Saldo</p></div>
            <p className={`text-2xl font-bold ${data.financial.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmtMoney(data.financial.saldo)}</p>
          </div>
        </div>

        {/* Escolas */}
        {data.schools?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border mb-8">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-800 flex items-center gap-2"><School size={18} /> Escolas da Rede Municipal</h2></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.schools.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><School size={16} className="text-blue-600" /></div>
                  <div><p className="font-medium text-gray-800 text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.type || 'Fundamental'}{s.address ? ' - ' + s.address : ''}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contratos */}
        {data.contracts?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-800 flex items-center gap-2"><FileText size={18} /> Contratos Vigentes</h2></div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Numero', 'Tipo', 'Fornecedor', 'Valor', 'Vigencia'].map(h => <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y">{data.contracts.map((c: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{c.number}</td>
                <td className="px-6 py-3 text-gray-500">{c.type}</td>
                <td className="px-6 py-3 text-gray-700">{c.supplier}</td>
                <td className="px-6 py-3 font-semibold">{fmtMoney(parseFloat(c.value) || 0)}</td>
                <td className="px-6 py-3 text-gray-500">{c.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : '—'} a {c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            ))}</tbody></table></div>
          </div>
        )}

        <div className="text-center mt-8 py-4 text-xs text-gray-400">
          <p>NetEscol - Sistema de Gestao Escolar Municipal</p>
          <p>Dados atualizados automaticamente | Acesso publico conforme Lei de Transparencia</p>
        </div>
      </div>
    </div>
  );
}
