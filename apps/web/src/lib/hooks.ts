import { useState, useEffect, useCallback, useRef } from 'react';

// Toast visual (substitui alert nativo)
export function showToast(message: string, type: 'error' | 'success' | 'info' = 'info') {
  const colors = { error: '#dc2626', success: '#16a34a', info: '#2563eb' };
  const titles = { error: 'Operação não permitida', success: 'Sucesso', info: 'Aviso' };
  const icons: Record<string, string> = {
    error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    success: '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  };
  const id = 'netescol-toast-' + type;
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = id;
  toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:99999;max-width:420px;padding:14px 20px;background:${colors[type]};color:white;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.3);font-family:Arial,sans-serif;font-size:14px;line-height:1.5;display:flex;align-items:flex-start;gap:10px;animation:slideIn 0.3s ease`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px">${icons[type]}</svg>
    <div style="flex:1"><b style="display:block;margin-bottom:2px">${titles[type]}</b><span style="opacity:0.9;font-size:13px">${message}</span></div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;opacity:0.7;font-size:18px;padding:0 4px">&times;</button>
  `;
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{opacity:1}to{opacity:0;transform:translateY(-10px)}}';
    document.head.appendChild(style);
  }
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) { toast.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); } }, type === 'error' ? 6000 : 4000);
}

export function showSuccessToast(message: string) { showToast(message, 'success'); }
export function showInfoToast(message: string) { showToast(message, 'info'); }

export function showErrorToast(message: string) { showToast(message, 'error'); }

export function useQuery<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (mountedRef.current) setData(result);
    } catch (e: any) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => { mountedRef.current = false; };
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useMutation<T>(fn: (input: any) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (input: any, callbacks?: { onSuccess?: (data: T) => void; onError?: (err: string) => void }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(input);
      callbacks?.onSuccess?.(result);
      return result;
    } catch (e: any) {
      const msg = e.message || 'Erro desconhecido';
      setError(msg);
      if (callbacks?.onError) {
        callbacks.onError(msg);
      } else {
        // Mostrar toast de erro para o usuário
        showErrorToast(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
