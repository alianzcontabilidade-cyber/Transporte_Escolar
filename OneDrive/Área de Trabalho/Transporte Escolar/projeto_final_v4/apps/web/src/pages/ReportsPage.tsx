import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const { data: history } = useQuery(() => api.trips.history({ municipalityId, limit: 50 }), [municipalityId]);
  const sl = (s: string) => ({ started:'Em andamento', completed:'Concluída', cancelled:'Cancelada', scheduled:'Agendada' }[s]||s);
  const sc = (s: string) => ({ completed:'badge-green', cancelled:'badge-red', started:'badge-yellow' }[s]||'badge-gray');

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-2xl font-bold text-gray-900">Relatórios</h1><p className="text-gray-500">Histórico de viagens</p></div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center"><CheckCircle size={28} className="text-green-500 mx-auto mb-2"/><p className="text-2xl font-bold">{(history as any)?.filter((h: any) => h.trip.status === 'completed').length ?? 0}</p><p className="text-sm text-gray-500">Concluídas</p></div>
        <div className="card text-center"><XCircle size={28} className="text-red-400 mx-auto mb-2"/><p className="text-2xl font-bold">{(history as any)?.filter((h: any) => h.trip.status === 'cancelled').length ?? 0}</p><p className="text-sm text-gray-500">Canceladas</p></div>
        <div className="card text-center"><Calendar size={28} className="text-blue-500 mx-auto mb-2"/><p className="text-2xl font-bold">{(history as any)?.length ?? 0}</p><p className="text-sm text-gray-500">Total</p></div>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-2"><FileText size={18} className="text-gray-500"/><h3 className="font-semibold">Histórico</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rota</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Início</th><th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {(history as any)?.map((item: any) => (
                <tr key={item.trip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.route?.name}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(item.trip.tripDate).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-gray-500">{item.trip.startedAt ? new Date(item.trip.startedAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : '–'}</td>
                  <td className="px-6 py-4"><span className={sc(item.trip.status)}>{sl(item.trip.status)}</span></td>
                </tr>
              ))}
              {!(history as any)?.length && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Nenhuma viagem registrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
