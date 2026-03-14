import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Users, MapPin, School, Truck, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const weekData = [{ day: 'Seg', v: 12 }, { day: 'Ter', v: 14 }, { day: 'Qua', v: 11 }, { day: 'Qui', v: 15 }, { day: 'Sex', v: 13 }];
const pontData = [{ day: 'Seg', p: 94 }, { day: 'Ter', p: 91 }, { day: 'Qua', p: 97 }, { day: 'Qui', p: 88 }, { day: 'Sex', p: 95 }];

function Card({ label, value, icon: Icon, color }: any) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon size={22} className="text-white" /></div>
      <div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const { data: stats, loading } = useQuery(() => api.municipalities.getDashboardStats({ municipalityId }), [municipalityId]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Bem-vindo, {user?.name}.</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(7)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card label="Escolas" value={stats?.schools ?? 0} icon={School} color="bg-blue-500" />
            <Card label="Alunos" value={stats?.students ?? 0} icon={Users} color="bg-indigo-500" />
            <Card label="Rotas" value={stats?.routes ?? 0} icon={MapPin} color="bg-purple-500" />
            <Card label="Motoristas" value={stats?.drivers ?? 0} icon={Truck} color="bg-orange-500" />
            <Card label="Veículos" value={stats?.vehicles ?? 0} icon={Bus} color="bg-primary-500" />
            <Card label="Viagens hoje" value={stats?.todayTrips ?? 0} icon={Activity} color="bg-teal-500" />
            <Card label="Ativas agora" value={stats?.activeTrips ?? 0} icon={TrendingUp} color={stats?.activeTrips ? 'bg-green-500' : 'bg-gray-400'} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Viagens esta semana</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weekData}><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="v" fill="#f59e0b" radius={[6,6,0,0]} /></BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Pontualidade (%)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={pontData}><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis domain={[80,100]} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="p" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
