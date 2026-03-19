import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Bell, CheckCheck, Clock, Bus, Users, AlertTriangle, MessageSquare, X } from 'lucide-react';

const TYPE_ICONS: any = {
  trip_started: Bus,
  student_boarded: Users,
  student_dropped: Users,
  arrived: Bus,
  trip_completed: Bus,
  delay: AlertTriangle,
  alert: AlertTriangle,
  system: MessageSquare,
};

const TYPE_COLORS: any = {
  trip_started: 'text-purple-500 bg-purple-100',
  student_boarded: 'text-green-500 bg-green-100',
  student_dropped: 'text-blue-500 bg-blue-100',
  arrived: 'text-orange-500 bg-orange-100',
  trip_completed: 'text-green-600 bg-green-100',
  delay: 'text-yellow-500 bg-yellow-100',
  alert: 'text-red-500 bg-red-100',
  system: 'text-gray-500 bg-gray-100',
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadUnreadCount() {
    try {
      const data = await api.notifications.unreadCount();
      setUnreadCount(data?.count || 0);
    } catch {}
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await api.notifications.list({ limit: 20 });
      setNotifications(data || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function markAllRead() {
    try {
      await api.notifications.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }

  function toggle() {
    if (!isOpen) loadNotifications();
    setIsOpen(!isOpen);
  }

  // Allow external increment (e.g. from socket events)
  // exported via window for Layout to call
  useEffect(() => {
    (window as any).__notifDropdownIncrement = () => setUnreadCount(n => n + 1);
    return () => { delete (window as any).__notifDropdownIncrement; };
  }, []);

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'Agora';
    if (diff < 60) return `${diff}min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggle} className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
        <Bell size={20} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notificacoes</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent-500 hover:underline flex items-center gap-1">
                  <CheckCheck size={12} /> Marcar todas como lidas
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X size={14} /></button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : notifications.length > 0 ? (
              notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                const colorClass = TYPE_COLORS[n.type] || 'text-gray-500 bg-gray-100';
                return (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/50 transition-colors ${!n.isRead ? 'bg-accent-50/30 dark:bg-accent-900/10' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock size={10} />{timeAgo(n.createdAt)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center"><Bell size={32} className="text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">Nenhuma notificacao</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
