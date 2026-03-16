import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Bus, Eye, EyeOff, Heart, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ identifier, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <Bus size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TransEscolar</h1>
          <p className="text-gray-500 mt-1">Sistema de Transporte Escolar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Entrar</h2>
          <p className="text-gray-500 text-sm mb-6">Acesse sua conta para continuar</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email, CPF ou Login</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="email@exemplo.com, 000.000.000-00 ou login"
              />
            </div>
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-gray-700">Senha</label>
                <Link to="/recuperar-senha" className="text-xs text-primary-500 hover:underline font-medium">
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none pr-10"
                placeholder="Sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-3">Não tem uma conta?</p>
            <div className="space-y-2">
              <Link
                to="/cadastro"
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-primary-200 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition"
              >
                <Heart size={16} />
                Sou Pai/Responsável
              </Link>
              <Link
                to="/cadastro"
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cadastrar Prefeitura
              </Link>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">TransEscolar © 2026 · Transporte escolar seguro e monitorado</p>
      </div>
    </div>
  );
}
