import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, Briefcase, Hash, FileText, Building2, GraduationCap, Phone, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    jobTitle: '',
    registrationNumber: '',
    decree: '',
    department: '',
    qualification: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadProfile() {
    try {
      const data = await api.users.getProfile();
      setProfile(data);
      setForm({
        jobTitle: data?.jobTitle || '',
        registrationNumber: data?.registrationNumber || '',
        decree: data?.decree || '',
        department: data?.department || '',
        qualification: data?.qualification || '',
        phone: data?.phone || '',
      });
    } catch (err: any) {
      setToast({ type: 'error', message: 'Erro ao carregar perfil: ' + err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.users.updateProfile(form);
      setToast({ type: 'success', message: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      setToast({ type: 'error', message: 'Erro ao salvar: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-fade-in ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full bg-accent-500 flex items-center justify-center text-2xl font-bold text-white">
          {profile?.name?.charAt(0) || '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Meu Perfil</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Dados profissionais para assinatura eletronica</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Dados pessoais (somente leitura) */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Dados Pessoais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome</label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {profile?.name || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">E-mail</label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {profile?.email || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CPF</label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {profile?.cpf || '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Perfil</label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {profile?.role || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Dados profissionais (editaveis) */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Dados Profissionais / Assinatura Eletronica
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Briefcase size={13} /> Cargo / Funcao
              </label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                placeholder="Ex: Secretario(a) de Educacao"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Hash size={13} /> Matricula Funcional
              </label>
              <input
                type="text"
                value={form.registrationNumber}
                onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))}
                placeholder="Ex: 12345"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <FileText size={13} /> Decreto de Nomeacao
              </label>
              <input
                type="text"
                value={form.decree}
                onChange={e => setForm(f => ({ ...f, decree: e.target.value }))}
                placeholder="Ex: Decreto n 123/2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Building2 size={13} /> Lotacao / Setor
              </label>
              <input
                type="text"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="Ex: Secretaria Municipal de Educacao"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <GraduationCap size={13} /> Formacao Academica
              </label>
              <input
                type="text"
                value={form.qualification}
                onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                placeholder="Ex: Pedagogia, Pos-graduacao em Gestao Escolar"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Phone size={13} /> Telefone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(63) 99999-9999"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Estes dados serao utilizados na assinatura eletronica de documentos oficiais gerados pelo sistema, conforme Art. 4 da Lei n 14.063/2020.
            </p>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
