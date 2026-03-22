// Offline queue - stores failed API mutations and replays when online
const QUEUE_KEY = 'netescol_offline_queue';

interface QueuedAction {
  id: string;
  endpoint: string;
  input: any;
  timestamp: number;
}

export function getQueue(): QueuedAction[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}

export function addToQueue(endpoint: string, input: any): void {
  const queue = getQueue();
  queue.push({ id: Date.now().toString(), endpoint, input, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter(q => q.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function getQueueCount(): number {
  return getQueue().length;
}
