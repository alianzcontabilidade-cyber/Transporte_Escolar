import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { Bus, Building2, Heart, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11; if (r === 10) r = 0;
  if (parseInt(d[9]) !== r) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11; if (r === 10) r = 0;
  if (parseInt(d[10]) !== r) return false;
  return true;
}

function maskCNPJ(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  let sum = 0;
  let w = [5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 12; i++) sum += parseInt(d[i]) * w[i];
  let r = sum % 11;
  if (parseInt(d[12]) !== (r < 2 ? 0 : 11 - r)) return false;
  sum = 0;
  w = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 13; i++) sum += parseInt(d[i]) * w[i];
  r = sum % 11;
  if (parseInt(d[13]) !== (r < 2 ? 0 : 11 - r)) return false;
  return true;
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function RegisterPage() {
  const [mode, setMode] = useState<'choose' | 'municipality' | 'guardian'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Municipal form
  const [mForm, setMForm] = useState({ municipalityName: '', state: '', city: '', cnpj: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });
  const { municipios: munList, loading: munLoading } = useMunicipios(mForm.state);

  // Guardian form
  const [gForm, setGForm] = useState({ name: '', email: '', password: '', phone: '', cpf: '', studentEnrollment: '', relationship: 'father' });

  async function handleMunicipalityRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const cnpjDigits = mForm.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length > 0 && cnpjDigits.length !== 14) { setError('CNPJ incompleto.'); setLoading(false); return; }
    if (cnpjDigits.length === 14 && !validateCNPJ(cnpjDigits)) { setError('CNPJ inválido.'); setLoading(false); return; }
    try {
      await api.auth.registerMunicipality(mForm);
      await login({ email: mForm.adminEmail, password: mForm.adminPassword });
      navigate('/');
    } catch (err: any) { setError(err.message || 'Erro ao cadastrar'); }
    finally { setLoading(false); }
  }

  async function handleGuardianRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const cpfDigits = gForm.cpf.replace(/\D/g, '');
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) { setError('CPF incompleto.'); setLoading(false); return; }
    if (cpfDigits.length === 11 && !validateCPF(cpfDigits)) { setError('CPF inválido.'); setLoading(false); return; }
    try {
      const result = await api.auth.registerGuardian(gForm);
      setSuccess(result.message || 'Cadastro realizado!');
      setTimeout(async () => {
        await login({ email: gForm.email, password: gForm.password });
        navigate('/');
      }, 1500);
    } catch (err: any) { setError(err.message || 'Erro ao cadastrar'); }
    finally { setLoading(false); }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

  if (mode === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-4"><Bus size={28} className="text-white" /></div>
            <h1 className="text-2xl font-bold text-gray-900">TransEscolar</h1>
            <p className="text-gray-500 mt-1">Escolha o tipo de cadastro</p>
          </div>
          <div className="space-y-4">
            <button onClick={() => setMode('guardian')}
              className="w-full p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all text-left flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0"><Heart size={22} className="text-pink-500" /></div>
              <div>
                <h3 className="font-bold text-gray-900">Sou Pai/Responsável</h3>
                <p className="text-sm text-gray-500 mt-1">Quero acompanhar o transporte escolar do meu filho(a)</p>
              </div>
            </button>
            <button onClick={() => setMode('municipality')}
              className="w-full p-5 bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all text-left flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0"><Building2 size={22} className="text-blue-500" /></div>
              <div>
                <h3 className="font-bold text-gray-900">Sou Prefeitura/Secretaria</h3>
                <p className="text-sm text-gray-500 mt-1">Quero gerenciar o transporte escolar do município</p>
              </div>
            </button>
          </div>
          <p className="text-center mt-6 text-sm text-gray-500">
            Já tem conta? <Link to="/login" className="text-primary-500 font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'guardian') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={16} /> Voltar</button>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-3"><Heart size={22} className="text-pink-500" /></div>
            <h2 className="text-xl font-bold text-gray-900">Cadastro de Responsável</h2>
            <p className="text-gray-500 text-sm mt-1">Vincule-se ao aluno usando a matrícula escolar</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}
          <form onSubmit={handleGuardianRegister} className="space-y-3">
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Nome completo</label><input type="text" required value={gForm.name} onChange={e => setGForm(p => ({...p, name: e.target.value}))} className={inputClass} placeholder="João da Silva" /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Email</label><input type="email" required value={gForm.email} onChange={e => setGForm(p => ({...p, email: e.target.value}))} className={inputClass} placeholder="joao@email.com" /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">CPF</label><input type="text" value={gForm.cpf} onChange={e => { const masked = maskCPF(e.target.value); setGForm(p => ({...p, cpf: masked})); const digits = e.target.value.replace(/\D/g, ''); if (digits.length === 11) { setCpfError(validateCPF(digits) ? '' : 'CPF inválido'); } else { setCpfError(''); } }} className={inputClass} placeholder="000.000.000-00" maxLength={14} />{cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}</div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Telefone</label><input type="tel" value={gForm.phone} onChange={e => setGForm(p => ({...p, phone: maskPhone(e.target.value)}))} className={inputClass} placeholder="(63) 99999-0000" maxLength={15} /></div>
            <div className="relative"><label className="text-sm font-medium text-gray-700 block mb-1">Senha</label><input type={showPassword ? 'text' : 'password'} required minLength={6} value={gForm.password} onChange={e => setGForm(p => ({...p, password: e.target.value}))} className={inputClass} placeholder="Mínimo 6 caracteres" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
            <hr className="my-2" />
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Matrícula do Aluno *</label><input type="text" required value={gForm.studentEnrollment} onChange={e => setGForm(p => ({...p, studentEnrollment: e.target.value}))} className={inputClass} placeholder="Ex: 2024001" /><p className="text-xs text-gray-400 mt-1">Informe a matrícula escolar do seu filho(a)</p></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Parentesco</label><select value={gForm.relationship} onChange={e => setGForm(p => ({...p, relationship: e.target.value}))} className={inputClass}><option value="father">Pai</option><option value="mother">Mãe</option><option value="grandparent">Avô/Avó</option><option value="uncle">Tio/Tia</option><option value="other">Outro</option></select></div>
            <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50">{loading ? 'Cadastrando...' : 'Criar minha conta'}</button>
          </form>
          <p className="text-center mt-4 text-sm text-gray-500">Já tem conta? <Link to="/login" className="text-primary-500 font-medium hover:underline">Entrar</Link></p>
        </div>
      </div>
    );
  }

  // Municipality registration
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <button onClick={() => setMode('choose')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={16} /> Voltar</button>
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3"><Building2 size={22} className="text-blue-500" /></div>
          <h2 className="text-xl font-bold text-gray-900">Cadastro de Prefeitura</h2>
          <p className="text-gray-500 text-sm mt-1">Registre seu município para gerenciar o transporte escolar</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleMunicipalityRegister} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium text-gray-700 block mb-1">Nome da Prefeitura</label><input type="text" required value={mForm.municipalityName} onChange={e => setMForm(p => ({...p, municipalityName: e.target.value}))} className={inputClass} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Estado (UF)</label><select required value={mForm.state} onChange={e => setMForm(p => ({...p, state: e.target.value, city: ''}))} className={inputClass}><option value="">Selecione o estado</option>{ESTADOS_BR.map(e => <option key={e.uf} value={e.uf}>{e.uf} - {e.nome}</option>)}</select></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Cidade {munLoading && <Loader2 size={12} className="inline animate-spin ml-1" />}</label><select required value={mForm.city} onChange={e => setMForm(p => ({...p, city: e.target.value}))} className={inputClass} disabled={!mForm.state || munLoading}><option value="">Selecione a cidade</option>{munList.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>
            <div className="col-span-2"><label className="text-sm font-medium text-gray-700 block mb-1">CNPJ (opcional)</label><input type="text" value={mForm.cnpj} onChange={e => { const masked = maskCNPJ(e.target.value); setMForm(p => ({...p, cnpj: masked})); const digits = e.target.value.replace(/\D/g, ''); if (digits.length === 14) { setCnpjError(validateCNPJ(digits) ? '' : 'CNPJ inválido'); } else { setCnpjError(''); } }} className={inputClass} placeholder="00.000.000/0000-00" maxLength={18} />{cnpjError && <p className="text-xs text-red-500 mt-1">{cnpjError}</p>}</div>
          </div>
          <hr className="my-2" />
          <p className="text-sm font-semibold text-gray-700">Dados do Administrador</p>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Nome</label><input type="text" required value={mForm.adminName} onChange={e => setMForm(p => ({...p, adminName: e.target.value}))} className={inputClass} /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Email</label><input type="email" required value={mForm.adminEmail} onChange={e => setMForm(p => ({...p, adminEmail: e.target.value}))} className={inputClass} /></div>
          <div className="relative"><label className="text-sm font-medium text-gray-700 block mb-1">Senha</label><input type={showPassword ? 'text' : 'password'} required minLength={8} value={mForm.adminPassword} onChange={e => setMForm(p => ({...p, adminPassword: e.target.value}))} className={inputClass} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
          <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50">{loading ? 'Cadastrando...' : 'Cadastrar Prefeitura'}</button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">Já tem conta? <Link to="/login" className="text-primary-500 font-medium hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}
