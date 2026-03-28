import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, Briefcase, Hash, FileText, Building2, GraduationCap, Phone, Save, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrador',
  municipal_admin: 'Administrador Municipal',
  secretary: 'Secretário(a)',
  school_admin: 'Diretor(a)',
  teacher: 'Professor(a)',
  driver: 'Motorista',
  monitor: 'Monitor(a)',
  parent: 'Responsável',
};

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? '(' + digits : '';
  if (digits.length <= 7) return '(' + digits.substring(0, 2) + ') ' + digits.substring(2);
  return '(' + digits.substring(0, 2) + ') ' + digits.substring(2, 7) + '-' + digits.substring(7);
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.substring(0, 3) + '.' + digits.substring(3);
  if (digits.length <= 9) return digits.substring(0, 3) + '.' + digits.substring(3, 6) + '.' + digits.substring(6);
  return digits.substring(0, 3) + '.' + digits.substring(3, 6) + '.' + digits.substring(6, 9) + '-' + digits.substring(9);
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    username: '',
    jobTitle: '',
    registrationNumber: '',
    decree: '',
    department: '',
    qualification: '',
    phone: '',
  });

  // Alterar senha
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  async function loadProfile() {
    try {
      const data = await api.users.getProfile();
      setProfile(data);
      setForm({
        username: data?.username || '',
        jobTitle: data?.jobTitle || '',
        registrationNumber: data?.registrationNumber || '',
        decree: data?.decree || '',
        department: data?.department || '',
        qualification: data?.qualification || '',
        phone: data?.phone || '',
      });
    } catch {} finally { setLoading(false); }
  }

  async function handleSave() {
    if (form.phone && !isValidPhone(form.phone)) {
      setToast({ type: 'error', message: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX' });
      return;
    }
    setSaving(true);
    try {
      await api.users.updateProfile(form);
      setToast({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } catch (e: any) { setToast({ type: 'error', message: e.message || 'Erro ao salvar' }); }
    finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) { setToast({ type: 'error', message: 'Preencha todos os campos' }); return; }
    if (newPwd !== confirmPwd) { setToast({ type: 'error', message: 'As senhas não conferem' }); return; }
    if (newPwd.length < 8) { setToast({ type: 'error', message: 'A senha deve ter no mínimo 8 caracteres' }); return; }
    if (!/[a-zA-Z]/.test(newPwd)) { setToast({ type: 'error', message: 'A senha deve conter pelo menos uma letra' }); return; }
    if (!/[0-9]/.test(newPwd)) { setToast({ type: 'error', message: 'A senha deve conter pelo menos um número' }); return; }
    if (!/[^a-zA-Z0-9]/.test(newPwd)) { setToast({ type: 'error', message: 'A senha deve conter pelo menos um caractere especial (@, #, $, !)' }); return; }
    setChangingPwd(true);
    try {
      await api.auth.changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setToast({ type: 'success', message: 'Senha alterada com sucesso!' });
      setShowPwdForm(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) { setToast({ type: 'error', message: e.message || 'Erro ao alterar senha' }); }
    finally { setChangingPwd(false); }
  }

  const isParent = profile?.role === 'parent';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {toast && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {toast.message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">{profile?.name?.charAt(0) || '?'}</div>
            <div>
              <h1 className="text-xl font-bold">{profile?.name}</h1>
              <p className="text-primary-200 text-sm">{ROLE_LABELS[profile?.role] || profile?.role}</p>
              <p className="text-primary-300 text-xs">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-400 mb-1">Nome</label><div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">{profile?.name || '-'}</div></div>
            <div><label className="block text-xs text-gray-400 mb-1">E-mail</label><div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">{profile?.email || '-'}</div></div>
            <div><label className="block text-xs text-gray-400 mb-1">CPF</label><div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">{profile?.cpf ? maskCPF(profile.cpf) : '-'}</div></div>
            <div><label className="block text-xs text-gray-400 mb-1">Perfil</label><div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">{ROLE_LABELS[profile?.role] || profile?.role || '-'}</div></div>
          </div>
        </div>

        {/* Configurações editáveis */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {isParent ? 'Configurações da Conta' : 'Dados Profissionais'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><User size={13} /> Nome de Login</label>
              <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }))} placeholder="Ex: jose.pai" className="input" />
              <p className="text-[10px] text-gray-400 mt-1">Use para fazer login sem precisar digitar o email completo</p>
            </div>

            <div className={isParent ? 'sm:col-span-2' : ''}>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><Phone size={13} /> Telefone</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} placeholder="(63) 99999-9999" className="input" maxLength={15} />
              {form.phone && !isValidPhone(form.phone) && <p className="text-[10px] text-red-500 mt-1">Formato inválido. Use (XX) XXXXX-XXXX</p>}
            </div>

            {!isParent && (<>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><Briefcase size={13} /> Cargo / Função</label>
                <input type="text" value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="Ex: Secretário(a) de Educação" className="input" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><Hash size={13} /> Matrícula Funcional</label>
                <input type="text" value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} placeholder="Ex: 12345" className="input" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><FileText size={13} /> Decreto de Nomeação</label>
                <input type="text" value={form.decree} onChange={e => setForm(f => ({ ...f, decree: e.target.value }))} placeholder="Ex: Decreto nº 123/2024" className="input" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><Building2 size={13} /> Lotação / Setor</label>
                <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Ex: Secretaria Municipal de Educação" className="input" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1"><GraduationCap size={13} /> Formação Acadêmica</label>
                <input type="text" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} placeholder="Ex: Pedagogia" className="input" />
              </div>
            </>)}
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Segurança</h2>

          {!showPwdForm ? (
            <button onClick={() => setShowPwdForm(true)} className="btn-secondary flex items-center gap-2">
              <Lock size={16} /> Alterar Senha
            </button>
          ) : (
            <div className="space-y-3 max-w-md">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Senha Atual</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="Digite sua senha atual" className="input pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Nova Senha</label>
                <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mínimo 8 chars + letra + número + especial" className="input" />
                {newPwd && (
                  <div className="mt-1 space-y-0.5">
                    <p className={`text-[10px] ${newPwd.length >= 8 ? 'text-green-500' : 'text-red-500'}`}>{newPwd.length >= 8 ? '✓' : '✗'} Mínimo 8 caracteres</p>
                    <p className={`text-[10px] ${/[a-zA-Z]/.test(newPwd) ? 'text-green-500' : 'text-red-500'}`}>{/[a-zA-Z]/.test(newPwd) ? '✓' : '✗'} Pelo menos uma letra</p>
                    <p className={`text-[10px] ${/[0-9]/.test(newPwd) ? 'text-green-500' : 'text-red-500'}`}>{/[0-9]/.test(newPwd) ? '✓' : '✗'} Pelo menos um número</p>
                    <p className={`text-[10px] ${/[^a-zA-Z0-9]/.test(newPwd) ? 'text-green-500' : 'text-red-500'}`}>{/[^a-zA-Z0-9]/.test(newPwd) ? '✓' : '✗'} Pelo menos um caractere especial (@, #, $, !)</p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Confirmar Nova Senha</label>
                <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repita a nova senha" className="input" />
                {confirmPwd && newPwd !== confirmPwd && <p className="text-[10px] text-red-500 mt-1">As senhas não conferem</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowPwdForm(false); setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); }} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={handleChangePassword} disabled={changingPwd} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  <Lock size={14} /> {changingPwd ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
