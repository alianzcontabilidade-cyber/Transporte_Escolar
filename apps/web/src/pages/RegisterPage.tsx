import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Bus, CheckCircle } from 'lucide-react';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ municipalityName: '', state: 'SP', city: '', cnpj: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await api.auth.registerMunicipality(form); setSuccess(true); }
    catch (err: any) { setError(err.message || 'Erro ao cadastrar'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-amber-100 p-4">
      <div className="card text-center max-w-md w-full shadow-lg">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Prefeitura cadastrada!</h2>
        <p className="text-gray-500 mb-6">Faça login para começar.</p>
        <button className="btn-primary w-full" onClick={() => navigate('/login')}>Ir para o login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-amber-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4"><Bus size={32} className="text-white" /></div>
          <h1 className="text-3xl font-bold text-gray-900">TransEscolar</h1>
          <p className="text-gray-500 mt-1">Cadastro de Prefeitura</p>
        </div>
        <div className="card shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Dados da Prefeitura</h3>
            <div><label className="label">Nome da Prefeitura *</label><input className="input" value={form.municipalityName} onChange={set('municipalityName')} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Estado *</label><select className="input" value={form.state} onChange={set('state')}>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="label">Cidade *</label><input className="input" value={form.city} onChange={set('city')} required /></div>
            </div>
            <div><label className="label">CNPJ</label><input className="input" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={set('cnpj')} /></div>
            <hr />
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Administrador</h3>
            <div><label className="label">Nome completo *</label><input className="input" value={form.adminName} onChange={set('adminName')} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">E-mail *</label><input className="input" type="email" value={form.adminEmail} onChange={set('adminEmail')} required /></div>
              <div><label className="label">Telefone</label><input className="input" value={form.adminPhone} onChange={set('adminPhone')} /></div>
            </div>
            <div><label className="label">Senha *</label><input className="input" type="password" minLength={8} value={form.adminPassword} onChange={set('adminPassword')} required /></div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Cadastrando...' : 'Cadastrar Prefeitura'}</button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">Já tem conta? <Link to="/login" className="text-primary-600 font-medium hover:underline">Entrar</Link></p>
        </div>
      </div>
    </div>
  );
}
