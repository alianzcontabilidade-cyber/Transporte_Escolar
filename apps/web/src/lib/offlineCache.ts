// Offline Cache - salva dados da rota no localStorage
// Permite que motorista/monitor vejam rota e alunos sem internet

const CACHE_KEY = 'netescol_offline_data';
const CACHE_EMBARQUES_KEY = 'netescol_offline_embarques';

interface CachedData {
  activeTrip: any;
  driverId: number | null;
  timestamp: number;
}

// Salvar dados no cache
export function saveOfflineData(activeTrip: any, driverId: number | null) {
  try {
    const data: CachedData = { activeTrip, driverId, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

// Carregar dados do cache (válido por 24h)
export function loadOfflineData(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CachedData = JSON.parse(raw);
    // Válido por 24 horas
    if (Date.now() - data.timestamp > 86400000) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

// Limpar cache
export function clearOfflineData() {
  localStorage.removeItem(CACHE_KEY);
}

// ============================================
// Embarques offline (quando sem internet)
// ============================================

interface OfflineEmbarque {
  id: string;
  tripId: number;
  studentId: number;
  stopId: number;
  eventType: 'boarded' | 'dropped' | 'absent';
  timestamp: number;
  synced: boolean;
}

// Salvar embarque offline
export function saveOfflineEmbarque(embarque: Omit<OfflineEmbarque, 'id' | 'timestamp' | 'synced'>) {
  try {
    const list = getOfflineEmbarques();
    list.push({
      ...embarque,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      synced: false,
    });
    localStorage.setItem(CACHE_EMBARQUES_KEY, JSON.stringify(list));
  } catch {}
}

// Listar embarques pendentes
export function getOfflineEmbarques(): OfflineEmbarque[] {
  try {
    const raw = localStorage.getItem(CACHE_EMBARQUES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Obter embarques não sincronizados
export function getPendingEmbarques(): OfflineEmbarque[] {
  return getOfflineEmbarques().filter(e => !e.synced);
}

// Marcar embarque como sincronizado
export function markEmbarqueSynced(id: string) {
  try {
    const list = getOfflineEmbarques();
    const idx = list.findIndex(e => e.id === id);
    if (idx >= 0) list[idx].synced = true;
    localStorage.setItem(CACHE_EMBARQUES_KEY, JSON.stringify(list));
  } catch {}
}

// Sincronizar embarques pendentes com o servidor
export async function syncPendingEmbarques(api: any): Promise<number> {
  const pending = getPendingEmbarques();
  if (pending.length === 0) return 0;

  let synced = 0;
  for (const e of pending) {
    try {
      if (e.eventType === 'boarded') {
        await api.monitors.boardStudent({ studentId: e.studentId, tripId: e.tripId, stopId: e.stopId });
      } else if (e.eventType === 'dropped') {
        await api.monitors.dropStudent({ studentId: e.studentId, tripId: e.tripId, stopId: e.stopId });
      } else if (e.eventType === 'absent') {
        await api.monitors.markAbsent({ studentId: e.studentId, tripId: e.tripId, stopId: e.stopId });
      }
      markEmbarqueSynced(e.id);
      synced++;
    } catch {
      // Sem internet ainda - manter pendente
      break;
    }
  }
  return synced;
}

// Verificar se está online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Limpar embarques já sincronizados (mais de 7 dias)
export function cleanupOldEmbarques() {
  try {
    const list = getOfflineEmbarques();
    const cutoff = Date.now() - 7 * 86400000;
    const filtered = list.filter(e => e.timestamp > cutoff || !e.synced);
    localStorage.setItem(CACHE_EMBARQUES_KEY, JSON.stringify(filtered));
  } catch {}
}
