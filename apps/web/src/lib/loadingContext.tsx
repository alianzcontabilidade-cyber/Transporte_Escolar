import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  visible: boolean;
  message: string;
  progress?: number; // 0-100, undefined = indeterminate
}

interface LoadingContextType {
  loading: LoadingState;
  showLoading: (message?: string) => void;
  showProgress: (message: string, progress: number) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<LoadingState>({ visible: false, message: '' });

  const showLoading = useCallback((message = 'Processando...') => {
    setLoading({ visible: true, message, progress: undefined });
  }, []);

  const showProgress = useCallback((message: string, progress: number) => {
    setLoading({ visible: true, message, progress: Math.min(100, Math.max(0, progress)) });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading({ visible: false, message: '' });
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, showLoading, showProgress, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

const noop = () => {};
const fallback: LoadingContextType = { loading: { visible: false, message: '' }, showLoading: noop, showProgress: noop, hideLoading: noop };

export function useLoading() {
  const ctx = useContext(LoadingContext);
  return ctx || fallback;
}
