import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  municipalityId: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { identifier: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
        // Verificar com o servidor se o token ainda é válido e atualizar dados do usuário
        api.auth.me().then((serverUser: any) => {
          if (serverUser) {
            const updatedUser = { id: serverUser.id, name: serverUser.name, email: serverUser.email, role: serverUser.role, municipalityId: serverUser.municipalityId };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }).catch((err: any) => {
          // Só fazer logout se for erro de autenticação (401/403), não erro de rede
          const msg = err?.message || '';
          if (msg.includes('não autorizado') || msg.includes('UNAUTHORIZED') || msg.includes('401') || msg.includes('Token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
          // Erros de rede/timeout: manter sessão local (usuário continua logado)
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (credentials: { identifier: string; password: string }) => {
    const result = await api.auth.login(credentials);
    const newToken = result.token;
    const newUser = result.user;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
