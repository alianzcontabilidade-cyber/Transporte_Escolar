import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForceChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasMinLength = newPwd.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPwd);
  const hasNumber = /[0-9]/.test(newPwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPwd);
  const passwordsMatch = newPwd === confirmPwd && confirmPwd.length > 0;
  const allValid = hasMinLength && hasLetter && hasNumber && hasSpecial && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allValid) return;
    setLoading(true);
    setError('');
    try {
      await api.auth.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      // Redirecionar para o portal correto
      const role = user?.role;
      if (role === 'parent') navigate('/portal-responsavel');
      else if (role === 'driver') navigate('/portal-motorista');
      else if (role === 'monitor') navigate('/portal-monitor');
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-amber-500 p-6 text-center text-white">
          <Shield size={40} className="mx-auto mb-3" />
          <h1 className="text-xl font-bold">Troca de Senha Obrigatória</h1>
          <p className="text-amber-100 text-sm mt-1">Sua senha é temporária. Por segurança, crie uma nova senha para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual (temporária)</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Digite a senha temporária recebida" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
            <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Crie sua nova senha" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
            {newPwd && (
              <div className="mt-2 space-y-1">
                <p className={`text-xs flex items-center gap-1 ${hasMinLength ? 'text-green-600' : 'text-red-500'}`}>{hasMinLength ? <CheckCircle size={12} /> : <AlertCircle size={12} />} Mínimo 8 caracteres</p>
                <p className={`text-xs flex items-center gap-1 ${hasLetter ? 'text-green-600' : 'text-red-500'}`}>{hasLetter ? <CheckCircle size={12} /> : <AlertCircle size={12} />} Pelo menos uma letra</p>
                <p className={`text-xs flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-red-500'}`}>{hasNumber ? <CheckCircle size={12} /> : <AlertCircle size={12} />} Pelo menos um número</p>
                <p className={`text-xs flex items-center gap-1 ${hasSpecial ? 'text-green-600' : 'text-red-500'}`}>{hasSpecial ? <CheckCircle size={12} /> : <AlertCircle size={12} />} Pelo menos um caractere especial (@, #, $, !)</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
            <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repita a nova senha" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" required />
            {confirmPwd && !passwordsMatch && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> As senhas não conferem</p>}
            {passwordsMatch && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={12} /> Senhas conferem</p>}
          </div>

          <button type="submit" disabled={!allValid || loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Lock size={18} /> {loading ? 'Alterando...' : 'Alterar Senha e Continuar'}
          </button>

          <button type="button" onClick={logout} className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
            Sair do sistema
          </button>
        </form>
      </div>
    </div>
  );
}
