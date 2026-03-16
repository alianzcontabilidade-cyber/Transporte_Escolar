import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Bus, ArrowLeft, KeyRound, ShieldCheck, Mail } from 'lucide-react';

export default function RecoverPasswordPage() {
  const [step, setStep] = useState<'request' | 'code' | 'done'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [userHint, setUserHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const navigate = useNavigate();

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.auth.requestPasswordReset({ identifier });
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setUserHint(result.userHint || '');
        setGeneratedCode(result.code || '');
        setStep('code');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.auth.resetPassword({ resetToken, code, newPassword });
      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Senha redefinida!</h2>
          <p className="text-gray-500 text-sm mb-6">Sua senha foi alterada com sucesso. Faça login com a nova senha.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <button onClick={() => setStep('request')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
              <KeyRound size={24} className="text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Redefinir senha</h2>
            {userHint && (
              <p className="text-gray-500 text-sm mt-1">Código enviado para {userHint}</p>
            )}
          </div>

          {generatedCode && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm mb-4">
              <p className="font-medium">Código de recuperação:</p>
              <p className="text-2xl font-bold tracking-widest text-center my-2">{generatedCode}</p>
              <p className="text-xs text-blue-600">Em produção, este código será enviado por email/SMS.</p>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Código de 6 dígitos</label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                className={inputClass + ' text-center text-xl tracking-widest font-mono'}
                placeholder="000000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Nova senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirmar nova senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Repita a nova senha"
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50"
            >
              {loading ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step: request
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <Link to="/login" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
            <Mail size={24} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Recuperar senha</h2>
          <p className="text-gray-500 text-sm mt-1">Informe seu email ou CPF para receber o código de recuperação</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Email ou CPF</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className={inputClass}
              placeholder="email@exemplo.com ou 000.000.000-00"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !identifier.trim()}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar código de recuperação'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Lembrou a senha? <Link to="/login" className="text-primary-500 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
