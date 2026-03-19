import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Users, School, Bus, MapPin, BookOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function DashboardWidget() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;

  const { data: activeTrips } = useQuery(() => api.trips.listActive({ municipalityId: mid }), [mid]);
  const { data: calendarStatus } = useQuery(() => api.schoolCalendar.trackingStatus({ municipalityId: mid }), [mid]);

  const nTrips = ((activeTrips as any) || []).length;
  const calSt = calendarStatus as any;

  if (nTrips === 0 && !calSt) return null;

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Active trips */}
      {nTrips > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Bus size={20} className="text-green-600" /></div>
          <div><p className="font-semibold text-green-800 dark:text-green-400">{nTrips} viagem(ns) ativa(s)</p><p className="text-xs text-green-600 dark:text-green-500">Ônibus em rota agora</p></div>
        </div>
      )}
      {/* Calendar status */}
      {calSt && (
        <div className={`${calSt.trackingActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'} border rounded-xl p-4 flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${calSt.trackingActive ? 'bg-blue-100' : 'bg-yellow-100'}`}>
            {calSt.trackingActive ? <CheckCircle size={20} className="text-blue-600" /> : <AlertTriangle size={20} className="text-yellow-600" />}
          </div>
          <div>
            <p className={`font-semibold ${calSt.trackingActive ? 'text-blue-800 dark:text-blue-400' : 'text-yellow-800 dark:text-yellow-400'}`}>
              {calSt.trackingActive ? 'Transporte ativo' : calSt.reason}
            </p>
            {calSt.academicYear && <p className="text-xs text-gray-500">{calSt.academicYear}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
