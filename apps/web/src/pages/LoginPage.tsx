import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Bus, Eye, EyeOff, Mail, User, Hash, FileText, ChevronDown, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';

const ID_TYPES = [
  { value: 'email', label: 'E-mail', icon: Mail, placeholder: 'seu@email.com' },
  { value: 'username', label: 'Login', icon: Hash, placeholder: 'seu_login' },
  { value: 'name', label: 'Nome', icon: User, placeholder: 'Seu Nome Completo' },
  { value: 'cpf', label: 'CPF', icon: FileText, placeholder: '000.000.000-00' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [idType, setIdType] = useState('email');
  const [idValue, setIdValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState<'login'|'recover'|'recover_sent'>('login');
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);

  const currentType = ID_TYPES.find(t => t.value === idType) || ID_TYPES[0];

  const handleLogin = async function() {
    if (!idValue || !password) { setError('Preencha todos os campos.'); return; }
    setLoading(true); setError('');
    try {
      await login({ email: idValue, password });
      navigate('/');
    } catch (e: any) {
      setError(e?.message || 'Credenciais invalidas. Verifique e tente novamente.');
    }
    setLoading(false);
  };

  const handleRecover = async function() {
    if (!recoverEmail) { setError('Informe o e-mail cadastrado.'); return; }
    setRecoverLoading(true); setError('');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRecoverLoading(false);
    setScreen('recover_sent');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bus size={32} className="text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TransEscolar</h1>
          <p className="text-gray-500 mt-1">Sistema de Transporte Escolar Municipal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* TELA LOGIN */}
          {screen === 'login' && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Entrar no sistema</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>
              )}

              {/* Seletor de tipo de identificacao */}
              <div className="mb-4">
                <label className="label">Identificar por</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={function(){setShowDropdown(function(v){return !v;});}}
                    className="input flex items-center justify-between w-full text-left"
                  >
                    <span className="flex items-center gap-2">
                      <currentType.icon size={15} className="text-primary-500"/>
                      {currentType.label}
                    </span>
                    <ChevronDown size={15} className={'text-gray-400 transition-transform '+(showDropdown?'rotate-180':'')}/>
                  </button>
                  {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {ID_TYPES.map(function(t) {
                        return (
                          <button key={t.value} type="button"
                            onClick={function(){setIdType(t.value);setIdValue('');setShowDropdown(false);}}
                            className={'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors '+(idType===t.value?'bg-primary-50 text-primary-600 font-medium':'text-gray-700')}
                          >
                            <t.icon size={15}/>{t.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Campo de identificacao */}
              <div className="mb-4">
                <label className="label">{currentType.label}</label>
                <div className="relative">
                  <currentType.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    className="input pl-9"
                    placeholder={currentType.placeholder}
                    value={idValue}
                    onChange={function(e){setIdValue(e.target.value);}}
                    onKeyDown={function(e){if(e.key==='Enter')handleLogin();}}
                    autoComplete={idType === 'email' ? 'email' : 'off'}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="mb-2">
                <label className="label">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Sua senha"
                    value={password}
                    onChange={function(e){setPassword(e.target.value);}}
                    onKeyDown={function(e){if(e.key==='Enter')handleLogin();}}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={function(){setShowPass(function(v){return !v;});}} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              {/* Recuperar senha */}
              <div className="text-right mb-6">
                <button type="button" onClick={function(){setScreen('recover');setError('');}} className="text-sm text-primary-500 hover:text-primary-600 hover:underline">
                  Esqueci minha senha
                </button>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </>
          )}

          {/* TELA RECUPERAR SENHA */}
          {screen === 'recover' && (
            <>
              <button type="button" onClick={function(){setScreen('login');setError('');}} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft size={16}/> Voltar ao login
              </button>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={22} className="text-primary-600"/>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Recuperar Senha</h2>
                <p className="text-sm text-gray-500 mt-1">Informe o e-mail cadastrado e enviaremos as instrucoes de recuperacao.</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}
              <div className="mb-6">
                <label className="label flex items-center gap-1"><Mail size={12}/> E-mail cadastrado</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input
                    className="input pl-9"
                    type="email"
                    placeholder="seu@email.com"
                    value={recoverEmail}
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Bus, Eye, EyeOff, Mail, User, Hash, FileText, ChevronDown, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
const ID_TYPES=[{value:'email',label:'E-mail',icon:Mail,placeholder:'seu@email.com'},{value:'username',label:'Login',icon:Hash,placeholder:'seu_login'},{value:'name',label:'Nome',icon:User,placeholder:'Seu Nome Completo'},{value:'cpf',label:'CPF',icon:FileText,placeholder:'000.000.000-00'}];
export default function LoginPage(){
  const navigate=useNavigate(); const {login}=useAuth();
  const [idType,setIdType]=useState('email'); const [idValue,setIdValue]=useState('');
  const [password,setPassword]=useState(''); const [showPass,setShowPass]=useState(false);
  const [showDrop,setShowDrop]=useState(false); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(''); const [screen,setScreen]=useState<'login'|'recover'|'sent'>('login');
  const [recoverEmail,setRecoverEmail]=useState(''); const [recoverLoading,setRecoverLoading]=useState(false);
  const cur=ID_TYPES.find(t=>t.value===idType)||ID_TYPES[0];
  const handleLogin=async function(){
    if(!idValue||!password){setError('Preencha todos os campos.');return;}
    setLoading(true);setError('');
    try{await login({email:idValue,password});navigate('/');}
    catch(e:any){setError(e?.message||'Credenciais invalidas. Verifique e tente novamente.');}
    setLoading(false);
  };
  const handleRecover=async function(){
    if(!recoverEmail){setError('Informe o e-mail cadastrado.');return;}
    setRecoverLoading(true);setError('');
    await new Promise(res=>setTimeout(res,1500));
    setRecoverLoading(false);setScreen('sent');
  };
  return(
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Bus size={32} className="text-white"/></div>
          <h1 className="text-3xl font-bold text-gray-900">TransEscolar</h1>
          <p className="text-gray-500 mt-1">Sistema de Transporte Escolar Municipal</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {screen==='login'&&(<>
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Entrar no sistema</h2>
            {error&&<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}
            <div className="mb-4">
              <label className="label">Identificar por</label>
              <div className="relative">
                <button type="button" onClick={function(){setShowDrop(function(v){return !v;});}} className="input flex items-center justify-between w-full text-left">
                  <span className="flex items-center gap-2"><cur.icon size={15} className="text-primary-500"/>{cur.label}</span>
                  <ChevronDown size={15} className={'text-gray-400 transition-transform '+(showDrop?'rotate-180':'')}/>
                </button>
                {showDrop&&(<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {ID_TYPES.map(function(t){return(<button key={t.value} type="button" onClick={function(){setIdType(t.value);setIdValue('');setShowDrop(false);}} className={'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors '+(idType===t.value?'bg-primary-50 text-primary-600 font-medium':'text-gray-700')}><t.icon size={15}/>{t.label}</button>);})}
                </div>)}
              </div>
            </div>
            <div className="mb-4">
              <label className="label">{cur.label}</label>
              <div className="relative">
                <cur.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input className="input pl-9" placeholder={cur.placeholder} value={idValue} onChange={function(e){setIdValue(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')handleLogin();}} autoComplete={idType==='email'?'email':'off'}/>
              </div>
            </div>
            <div className="mb-2">
              <label className="label">Senha</label>
              <div className="relative">
                <input type={showPass?'text':'password'} className="input pr-10" placeholder="Sua senha" value={password} onChange={function(e){setPassword(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')handleLogin();}} autoComplete="current-password"/>
                <button type="button" onClick={function(){setShowPass(function(v){return !v;});}} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">{showPass?<EyeOff size={18}/>:<Eye size={18}/>}</button>
              </div>
            </div>
            <div className="text-right mb-6">
              <button type="button" onClick={function(){setScreen('recover');setError('');}} className="text-sm text-primary-500 hover:text-primary-600 hover:underline">Esqueci minha senha</button>
            </div>
            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50">{loading?'Entrando...':'Entrar'}</button>
          </>)}
          {screen==='recover'&&(<>
            <button type="button" onClick={function(){setScreen('login');setError('');}} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft size={16}/> Voltar ao login</button>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3"><KeyRound size={22} className="text-primary-600"/></div>
              <h2 className="text-xl font-bold text-gray-800">Recuperar Senha</h2>
              <p className="text-sm text-gray-500 mt-1">Informe o e-mail cadastrado e enviaremos as instrucoes de recuperacao.</p>
            </div>
            {error&&<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}
            <div className="mb-6">
              <label className="label flex items-center gap-1"><Mail size={12}/> E-mail cadastrado</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input className="input pl-9" type="email" placeholder="seu@email.com" value={recoverEmail} onChange={function(e){setRecoverEmail(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')handleRecover();}}/>
              </div>
            </div>
            <button onClick={handleRecover} disabled={recoverLoading} className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50">{recoverLoading?'Enviando...':'Enviar instrucoes'}</button>
          </>)}
          {screen==='sent'&&(
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-green-500"/></div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">E-mail enviado!</h2>
              <p className="text-gray-500 text-sm mb-2">Enviamos as instrucoes de recuperacao para:</p>
              <p className="font-semibold text-primary-600 mb-6">{recoverEmail}</p>
              <p className="text-xs text-gray-400 mb-6">Verifique tambem a caixa de spam. O link expira em 30 minutos.</p>
              <button type="button" onClick={function(){setScreen('login');setRecoverEmail('');setError('');}} className="btn-primary w-full py-3">Voltar ao login</button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">TransEscolar &copy; {new Date().getFullYear()} &middot; Sistema Municipal de Transporte Escolar</p>
      </div>
    </div>
  );
      }
