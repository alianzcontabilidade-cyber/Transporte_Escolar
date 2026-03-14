import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Bus, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-amber-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4"><Bus size={32} className="text-white" /></div>
          <h1 className="text-3xl font-bold text-gray-900">TransEscolar</h1>
          <p className="text-gray-500 mt-1">Sistema de Transporte Escolar</p>
        </div>
        <div className="card shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Entrar na plataforma</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Entrando...' : 'Entrar'}</button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">Não tem conta?{' '}<Link to="/cadastro" className="text-primary-600 font-medium hover:underline">Cadastrar prefeitura</Link></p>
        </div>
      </div>
    </div>
  );
}
