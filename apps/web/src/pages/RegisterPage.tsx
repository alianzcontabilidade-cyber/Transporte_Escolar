import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { Bus, Building2, Heart, ArrowLeft, Eye, EyeOff, Loader2, Search, CheckCircle2, AlertTriangle, Users, GraduationCap } from 'lucide-react';
import { maskCPF, validateCPF, maskCNPJ, validateCNPJ, maskPhone } from '../lib/utils';
import CNPJField from '../components/CNPJField';

export default function RegisterPage() {
  const [mode, setMode] = useState<'choose' | 'municipality' | 'guardian'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cnpjError, setCnpjError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  // Municipal form
  const [mForm, setMForm] = useState({ municipalityName: '', state: '', city: '', cnpj: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });
  const { municipios: munList, loading: munLoading } = useMunicipios(mForm.state);

  // Guardian form - 2 step flow
  const [guardianStep, setGuardianStep] = useState<1 | 2>(1);
  const [cpfInput, setCpfInput] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [gForm, setGForm] = useState({ name: '', email: '', password: '', phone: '', cpf: '', studentEnrollment: '', relationship: 'father' });
  const [fallbackMode, setFallbackMode] = useState(false);

  // Auto-lookup when CPF reaches 11 digits
  const doLookup = useCallback(async (cpf: string) => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return;
    if (!validateCPF(digits)) {
      setCpfError('CPF inválido');
      return;
    }
    setCpfError('');
    setLookupLoading(true);
    setError('');
    try {
      const result = await api.auth.lookupGuardianByCpf({ cpf: digits });
      setLookupResult(result);
      if (result.found) {
        setGForm(prev => ({
          ...prev,
          cpf: cpf,
          name: result.guardianName || '',
          phone: result.guardianPhone || '',
          relationship: result.relationship || 'father',
          studentEnrollment: result.students[0]?.enrollment || '',
        }));
        setFallbackMode(false);
      } else {
        setFallbackMode(true);
        setGForm(prev => ({ ...prev, cpf: cpf }));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar CPF');
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    const digits = cpfInput.replace(/\D/g, '');
    if (digits.length === 11) {
      doLookup(cpfInput);
    } else {
      setLookupResult(null);
      setFallbackMode(false);
    }
  }, [cpfInput, doLookup]);

  async function handleMunicipalityRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const cnpjDigits = mForm.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length > 0 && cnpjDigits.length !== 14) { setError('CNPJ incompleto.'); setLoading(false); return; }
    if (cnpjDigits.length === 14 && !validateCNPJ(cnpjDigits)) { setError('CNPJ inválido.'); setLoading(false); return; }
    try {
      await api.auth.registerMunicipality(mForm);
      await login({ identifier: mForm.adminEmail, password: mForm.adminPassword });
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
      if (result.isExistingUser) {
        setTimeout(() => { navigate('/login'); }, 3000);
      } else {
        setTimeout(async () => {
          try {
            await login({ identifier: gForm.email, password: gForm.password });
            navigate('/');
          } catch { navigate('/login'); }
        }, 1500);
      }
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
            <h1 className="text-2xl font-bold text-gray-900">NetEscol</h1>
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
                <p className="text-sm text-gray-500 mt-1">Quero gerenciar o transporte escolar do municipio</p>
              </div>
            </button>
          </div>
          <p className="text-center mt-6 text-sm text-gray-500">
            Ja tem conta? <Link to="/login" className="text-primary-500 font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'guardian') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <button onClick={() => {
            if (guardianStep === 2 && lookupResult?.found) {
              setGuardianStep(1);
            } else {
              setMode('choose');
              setGuardianStep(1);
              setLookupResult(null);
              setCpfInput('');
              setFallbackMode(false);
              setError('');
              setSuccess('');
            }
          }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft size={16} /> {guardianStep === 2 ? 'Voltar' : 'Voltar'}
          </button>

          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-3">
              <Heart size={22} className="text-pink-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Cadastro de Responsável</h2>
            <p className="text-gray-500 text-sm mt-1">
              {guardianStep === 1 ? 'Informe seu CPF para localizar seus filhos' : 'Finalize seu cadastro'}
            </p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">{success}</div>}

          {/* STEP 1: CPF Lookup */}
          {guardianStep === 1 && (
            <div className="space-y-4">
              {/* CPF Input */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Seu CPF</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cpfInput}
                    onChange={e => {
                      const masked = maskCPF(e.target.value);
                      setCpfInput(masked);
                      const digits = e.target.value.replace(/\D/g, '');
                      if (digits.length === 11) {
                        setCpfError(validateCPF(digits) ? '' : 'CPF inválido');
                      } else {
                        setCpfError('');
                      }
                    }}
                    className={inputClass}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    autoFocus
                  />
                  {lookupLoading && (
                    <div className="absolute right-3 top-2.5">
                      <Loader2 size={18} className="animate-spin text-primary-500" />
                    </div>
                  )}
                </div>
                {cpfError && <p className="text-xs text-red-500 mt-1">{cpfError}</p>}
              </div>

              {/* Found result - green card */}
              {lookupResult?.found && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-semibold text-green-800">
                      Ola, {lookupResult.guardianName}!
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Encontramos {lookupResult.students.length} aluno(s) vinculado(s) ao seu CPF:
                  </p>
                  <div className="space-y-2">
                    {lookupResult.students.map((s: any) => (
                      <div key={s.id} className="bg-white rounded-lg p-3 flex items-center gap-3 border border-green-100">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <GraduationCap size={18} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-500">Mat: {s.enrollment}{s.grade ? ` - ${s.grade}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {lookupResult.guardianPhone && (
                    <p className="text-xs text-green-600">Tel: {lookupResult.guardianPhone}</p>
                  )}
                  <button
                    onClick={() => setGuardianStep(2)}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition mt-2 flex items-center justify-center gap-2"
                  >
                    Continuar <ArrowLeft size={16} className="rotate-180" />
                  </button>
                </div>
              )}

              {/* Not found - yellow card with fallback form */}
              {fallbackMode && !lookupResult?.found && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={18} className="text-amber-600" />
                      <span className="font-medium text-amber-800 text-sm">CPF nao encontrado</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      Seu CPF não foi localizado no cadastro de alunos. Você pode se cadastrar informando a matricula do aluno.
                    </p>
                  </div>

                  <form onSubmit={handleGuardianRegister} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Nome completo</label>
                      <input type="text" required value={gForm.name} onChange={e => setGForm(p => ({...p, name: e.target.value}))} className={inputClass} placeholder="Joao da Silva" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Telefone</label>
                      <input type="tel" value={gForm.phone} onChange={e => setGForm(p => ({...p, phone: maskPhone(e.target.value)}))} className={inputClass} placeholder="(63) 99999-0000" maxLength={15} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                      <input type="email" required value={gForm.email} onChange={e => setGForm(p => ({...p, email: e.target.value}))} className={inputClass} placeholder="joao@email.com" />
                    </div>
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 block mb-1">Senha</label>
                      <input type={showPassword ? 'text' : 'password'} required minLength={6} value={gForm.password} onChange={e => setGForm(p => ({...p, password: e.target.value}))} className={inputClass} placeholder="Minimo 6 caracteres" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                    </div>
                    <hr className="my-2" />
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Matricula do Aluno *</label>
                      <input type="text" required value={gForm.studentEnrollment} onChange={e => setGForm(p => ({...p, studentEnrollment: e.target.value}))} className={inputClass} placeholder="Ex: 2024001" />
                      <p className="text-xs text-gray-400 mt-1">Informe a matricula escolar do seu filho(a)</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Parentesco</label>
                      <select value={gForm.relationship} onChange={e => setGForm(p => ({...p, relationship: e.target.value}))} className={inputClass}>
                        <option value="father">Pai</option>
                        <option value="mother">Mae</option>
                        <option value="grandparent">Avo/Avo</option>
                        <option value="uncle">Tio/Tia</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50">
                      {loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Cadastrando...</span> : 'Criar minha conta'}
                    </button>
                  </form>
                </div>
              )}

              {/* Empty state - show hint */}
              {!lookupResult && !lookupLoading && cpfInput.replace(/\D/g, '').length < 11 && (
                <div className="text-center py-6">
                  <Search size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">
                    Digite seu CPF completo para<br/>buscarmos seus filhos automaticamente
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Create Account (CPF found path) */}
          {guardianStep === 2 && lookupResult?.found && (
            <form onSubmit={handleGuardianRegister} className="space-y-4">
              {/* Guardian info (read-only) */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Responsável</span>
                </div>
                <p className="font-semibold text-gray-900">{gForm.name}</p>
                <p className="text-xs text-gray-500">CPF: {cpfInput} {gForm.phone ? `| Tel: ${gForm.phone}` : ''}</p>
              </div>

              {/* Students cards (read-only) */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Alunos que serao vinculados:</p>
                {lookupResult.students.map((s: any) => (
                  <div key={s.id} className="bg-primary-50 rounded-lg p-3 flex items-center gap-3 border border-primary-100">
                    <div className="w-8 h-8 rounded-lg bg-primary-200 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={16} className="text-primary-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500">Mat: {s.enrollment}{s.grade ? ` - ${s.grade}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>

              <hr />

              {/* Only email + password */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input type="email" required value={gForm.email} onChange={e => setGForm(p => ({...p, email: e.target.value}))} className={inputClass} placeholder="seu@email.com" autoFocus />
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 block mb-1">Senha</label>
                <input type={showPassword ? 'text' : 'password'} required minLength={6} value={gForm.password} onChange={e => setGForm(p => ({...p, password: e.target.value}))} className={inputClass} placeholder="Minimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Criando conta...</span> : 'Criar minha conta'}
              </button>
            </form>
          )}

          <p className="text-center mt-4 text-sm text-gray-500">Ja tem conta? <Link to="/login" className="text-primary-500 font-medium hover:underline">Entrar</Link></p>
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
          <p className="text-gray-500 text-sm mt-1">Registre seu municipio para gerenciar o transporte escolar</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleMunicipalityRegister} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="text-sm font-medium text-gray-700 block mb-1">Nome da Prefeitura</label><input type="text" required value={mForm.municipalityName} onChange={e => setMForm(p => ({...p, municipalityName: e.target.value}))} className={inputClass} /></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Estado (UF)</label><select required value={mForm.state} onChange={e => setMForm(p => ({...p, state: e.target.value, city: ''}))} className={inputClass}><option value="">Selecione o estado</option>{ESTADOS_BR.map(e => <option key={e.uf} value={e.uf}>{e.uf} - {e.nome}</option>)}</select></div>
            <div><label className="text-sm font-medium text-gray-700 block mb-1">Cidade {munLoading && <Loader2 size={12} className="inline animate-spin ml-1" />}</label><select required value={mForm.city} onChange={e => setMForm(p => ({...p, city: e.target.value}))} className={inputClass} disabled={!mForm.state || munLoading}><option value="">Selecione a cidade</option>{munList.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>
            <div className="col-span-2">
              <CNPJField
                value={mForm.cnpj}
                onChange={(v) => setMForm(p => ({...p, cnpj: v}))}
                onDataLoaded={(data) => setMForm(p => ({
                  ...p,
                  municipalityName: data.razaoSocial || data.nomeFantasia || p.municipalityName,
                  adminPhone: data.telefone || p.adminPhone,
                }))}
                label="CNPJ (opcional)"
              />
            </div>
          </div>
          <hr className="my-2" />
          <p className="text-sm font-semibold text-gray-700">Dados do Administrador</p>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Nome</label><input type="text" required value={mForm.adminName} onChange={e => setMForm(p => ({...p, adminName: e.target.value}))} className={inputClass} /></div>
          <div><label className="text-sm font-medium text-gray-700 block mb-1">Email</label><input type="email" required value={mForm.adminEmail} onChange={e => setMForm(p => ({...p, adminEmail: e.target.value}))} className={inputClass} /></div>
          <div className="relative"><label className="text-sm font-medium text-gray-700 block mb-1">Senha</label><input type={showPassword ? 'text' : 'password'} required minLength={8} value={mForm.adminPassword} onChange={e => setMForm(p => ({...p, adminPassword: e.target.value}))} className={inputClass} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
          <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50">{loading ? 'Cadastrando...' : 'Cadastrar Prefeitura'}</button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">Ja tem conta? <Link to="/login" className="text-primary-500 font-medium hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}
