import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Activity, Users, Clock, Search, Shield } from 'lucide-react';

export default function UserActivityPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');

  const { data: usersData } = useQuery(() => api.users.list({ municipalityId: mid }), [mid]);
  const allUsers = ((usersData as any) || []).filter((u: any) => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()));

  const ROLE_LABELS: any = { super_admin:'Super Admin', municipal_admin:'Administrador', secretary:'Secretário', school_admin:'Diretor', driver:'Motorista', monitor:'Monitor', parent:'Responsável', teacher:'Professor', coordinator:'Coordenador' };
  const ROLE_COLORS: any = { super_admin:'bg-purple-100 text-purple-700', municipal_admin:'bg-blue-100 text-blue-700', secretary:'bg-indigo-100 text-indigo-700', driver:'bg-orange-100 text-orange-700', monitor:'bg-teal-100 text-teal-700', parent:'bg-green-100 text-green-700', teacher:'bg-cyan-100 text-cyan-700' };

  const timeAgo = (date: any) => {
    if (!date) return 'Nunca';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'Agora';
    if (diff < 60) return diff + ' min atrás';
    if (diff < 1440) return Math.floor(diff / 60) + 'h atrás';
    return Math.floor(diff / 1440) + 'd atrás';
  };

  const onlineRecent = allUsers.filter((u: any) => { if (!u.lastLoginAt) return false; const diff = (Date.now() - new Date(u.lastLoginAt).getTime()) / 60000; return diff < 30; });
  const onlineToday = allUsers.filter((u: any) => { if (!u.lastLoginAt) return false; return new Date(u.lastLoginAt).toDateString() === new Date().toDateString(); });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Activity size={20} className="text-emerald-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Atividade dos Usuários</h1><p className="text-gray-500">{allUsers.length} usuário(s) cadastrado(s)</p></div></div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center bg-green-50 border-0"><div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse" /><p className="text-2xl font-bold text-green-600">{onlineRecent.length}</p><p className="text-xs text-gray-500">Online agora</p></div>
        <div className="card text-center bg-blue-50 border-0"><Clock size={20} className="text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold text-blue-600">{onlineToday.length}</p><p className="text-xs text-gray-500">Acessaram hoje</p></div>
        <div className="card text-center bg-purple-50 border-0"><Users size={20} className="text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold text-purple-600">{allUsers.length}</p><p className="text-xs text-gray-500">Total de usuários</p></div>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['','Usuário','Perfil','Email','Último acesso','Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{allUsers.map((u: any) => {
          const lastLogin = u.lastLoginAt;
          const isOnline = lastLogin && (Date.now() - new Date(lastLogin).getTime()) < 30 * 60000;
          const isToday = lastLogin && new Date(lastLogin).toDateString() === new Date().toDateString();
          return (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 w-10"><div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : isToday ? 'bg-yellow-400' : 'bg-gray-300'}`} /></td>
              <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">{u.name?.[0]}</div><div><p className="font-medium text-gray-800">{u.name}</p>{u.cpf && <p className="text-xs text-gray-400">{u.cpf}</p>}</div></div></td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
              <td className="px-4 py-3 text-gray-500">{u.email}</td>
              <td className="px-4 py-3 text-gray-500">{lastLogin ? new Date(lastLogin).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : 'Nunca'}</td>
              <td className="px-4 py-3"><span className={`text-xs font-medium ${isOnline ? 'text-green-600' : isToday ? 'text-yellow-600' : 'text-gray-400'}`}>{isOnline ? 'Online' : timeAgo(lastLogin)}</span></td>
            </tr>
          );
        })}</tbody></table>
      </div>
    </div>
  );
}
