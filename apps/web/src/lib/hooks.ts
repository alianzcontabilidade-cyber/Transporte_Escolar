import { useState, useEffect, useCallback } from 'react';

export function useQuery<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
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
      callbacks?.onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
