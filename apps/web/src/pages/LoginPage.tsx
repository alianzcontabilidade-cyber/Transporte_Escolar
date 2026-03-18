import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Eye, EyeOff, Heart, GraduationCap, MapPin, BarChart3, Users, Shield, Wifi, BookOpen, Bus, CheckCircle, Loader2 } from 'lucide-react';

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

  const features = [
    { icon: GraduationCap, title: 'Gestão Acadêmica', desc: 'Matrículas, turmas, notas e boletins' },
    { icon: Bus, title: 'Transporte Escolar', desc: 'Rastreamento GPS em tempo real' },
    { icon: Users, title: 'Portal do Responsável', desc: 'Acompanhamento pelo celular' },
    { icon: BarChart3, title: 'Relatórios e Dados', desc: 'Exportação CSV/PDF e EDUCACENSO' },
    { icon: BookOpen, title: 'Diário Escolar', desc: 'Frequência e planejamento digital' },
    { icon: Shield, title: 'Portal de Transparência', desc: 'Dados públicos conforme a lei' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">NetEscol</h1>
              </div>
            </div>
            <p className="text-primary-200 text-lg mt-1 ml-1">Gestão Escolar Municipal Inteligente</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 my-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all duration-300">
                <f.icon size={22} className="text-primary-200 mb-2" />
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-primary-300 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary-200">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm">Sistema online</span>
            </div>
            <div className="text-primary-300 text-sm">
              Seguro e criptografado
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Mobile header */}
        <div className="lg:hidden bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">NetEscol</h1>
          <p className="text-primary-200 text-sm mt-1">Gestão Escolar Municipal Inteligente</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
              <p className="text-gray-500 mt-1">Acesse sua conta para continuar</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-start gap-2">
                <Shield size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Email, CPF ou Login</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Senha</label>
                  <Link to="/recuperar-senha" className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white pr-11 transition-all"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3.5 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : 'Entrar'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500 mb-4">Ainda não tem conta?</p>
              <div className="space-y-2.5">
                <Link
                  to="/cadastro"
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-primary-200 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-all"
                >
                  <Heart size={16} />
                  Sou Pai/Responsável
                </Link>
                <Link
                  to="/cadastro"
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all"
                >
                  Cadastrar Prefeitura
                </Link>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-8">
              NetEscol &copy; 2026 &middot; Gestão Escolar Municipal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
