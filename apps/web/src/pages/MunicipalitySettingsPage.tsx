import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { lookupCEP, maskCEP } from '../lib/cnpjCep';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { maskPhone, maskCPF } from '../lib/utils';
import { Building2, Save, Upload, Plus, Trash2, Loader2, CheckCircle, AlertTriangle, Image, User, GraduationCap, Users, Pencil } from 'lucide-react';
import CNPJField from '../components/CNPJField';

interface Responsible {
  id: number;
  name: string;
  role: string;
  cpf: string;
  decree: string;
}

export default function MunicipalitySettingsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const logoRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState('');
  const [msg, setMsg] = useState('');
  const [editingResp, setEditingResp] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '', cnpj: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cep: '', cidade: '', estado: '', phone: '', fax: '',
    email: '', website: '', logoUrl: '',
    // Prefeito
    prefeitoName: '', prefeitoCpf: '', prefeitoCargo: 'Prefeito(a) Municipal',
    // Secretaria
    secretariaName: '', secretariaCnpj: '', secretariaPhone: '', secretariaEmail: '',
    secretariaLogradouro: '', secretariaCep: '',
    // Secretario
    secretarioName: '', secretarioCpf: '', secretarioCargo: 'Secretario(a) de Educacao',
    secretarioDecreto: '',
  });

  const { municipios: munCidades, loading: munCidadesLoading } = useMunicipios(form.estado);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [newResp, setNewResp] = useState({ name: '', role: '', cpf: '', decree: '' });
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');

  const DEFAULT_ROLES = ['Contador(a)', 'Controle Interno', 'Ordenador de Despesa', 'Tesoureiro(a)', 'Chefe de Gabinete', 'Assessor Juridico', 'Resp. Setor de Compras', 'Resp. Licitacoes', 'Coordenador(a) Pedagogico', 'Diretor(a) Administrativo'];

  const allRoles = [...DEFAULT_ROLES, ...customRoles];

  const sf = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!mid) return;
    setLoading(true);
    api.municipalities.getById({ id: mid }).then((m: any) => {
      if (m) {
        setForm(f => ({
          ...f,
          name: m.name || '',
          cnpj: m.cnpj || '',
          email: m.email || '',
          phone: m.phone || '',
          cidade: m.city || '',
          estado: m.state || '',
          logoUrl: m.logoUrl || '',
          logradouro: m.logradouro || m.address || '',
          numero: m.numero || '',
          complemento: m.complemento || '',
          bairro: m.bairro || '',
          cep: m.cep || '',
          fax: m.fax || '',
          website: m.website || '',
          prefeitoName: m.prefeitoName || '',
          prefeitoCpf: m.prefeitoCpf || '',
          prefeitoCargo: m.prefeitoCargo || 'Prefeito(a) Municipal',
          secretariaName: m.secretariaName || '',
          secretariaCnpj: m.secretariaCnpj || '',
          secretariaPhone: m.secretariaPhone || '',
          secretariaEmail: m.secretariaEmail || '',
          secretariaLogradouro: m.secretariaLogradouro || '',
          secretarioName: m.secretarioName || '',
          secretarioCpf: m.secretarioCpf || '',
          secretarioCargo: m.secretarioCargo || 'Secretário(a) de Educação',
          secretarioDecreto: m.secretarioDecreto || '',
        }));
      }
      // Load responsibles from database
      api.municipalities.listResponsibles({ municipalityId: mid }).then((r: any) => {
        if (Array.isArray(r)) setResponsibles(r);
      }).catch(() => {});
      // Load custom roles from localStorage (small data, ok to keep here)
      try {
        const roles = JSON.parse(localStorage.getItem('netescol_custom_roles_' + mid) || '[]');
        setCustomRoles(roles);
      } catch {}
    }).catch(() => {}).finally(() => setLoading(false));
  }, [mid]);

  const handleCNPJPrefeituraLoaded = (data: any) => {
    setForm(f => ({
      ...f,
      name: data.razaoSocial || f.name,
      logradouro: data.logradouro || f.logradouro,
      numero: data.numero || f.numero,
      complemento: data.complemento || f.complemento,
      bairro: data.bairro || f.bairro,
      cep: data.cep ? maskCEP(data.cep) : f.cep,
      cidade: data.cidade || f.cidade,
      estado: data.estado || f.estado,
      phone: data.telefone || f.phone,
      email: data.email || f.email,
    }));
  };

  const handleCNPJSecretariaLoaded = (data: any) => {
    setForm(f => ({
      ...f,
      secretariaName: data.nomeFantasia || data.razaoSocial || f.secretariaName,
      secretariaPhone: data.telefone || f.secretariaPhone,
      secretariaEmail: data.email || f.secretariaEmail,
      secretariaLogradouro: [data.logradouro, data.numero, data.bairro, data.cidade, data.estado].filter(Boolean).join(', ') || f.secretariaLogradouro,
    }));
  };

  const handleCEPLookup = async () => {
    const digits = form.cep.replace(/\D/g, '');
    if (digits.length !== 8) { setMsg('CEP incompleto'); return; }
    setLookingUp('cep');
    try {
      const data = await lookupCEP(digits);
      setForm(f => ({
        ...f,
        logradouro: data.logradouro || f.logradouro,
        bairro: data.bairro || f.bairro,
        cidade: data.cidade || f.cidade,
        estado: data.estado || f.estado,
        complemento: data.complemento || f.complemento,
      }));
      setMsg('Endereco carregado pelo CEP!');
    } catch (e: any) { setMsg('Erro: ' + e.message); }
    finally { setLookingUp(''); }
  };

  const handleLogoUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const addResponsible = async () => {
    if (!newResp.name || !newResp.role) return;
    try {
      const result = await api.municipalities.addResponsible({ municipalityId: mid, ...newResp });
      setResponsibles(prev => [...prev, { id: result.id, ...newResp }]);
      setNewResp({ name: '', role: '', cpf: '', decree: '' });
    } catch (e: any) { setMsg('Erro ao adicionar: ' + (e.message || '')); }
  };

  const updateResponsible = async (id: number, data: Partial<Responsible>) => {
    setResponsibles(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    try { await api.municipalities.updateResponsible({ id, ...data }); }
    catch {}
  };

  const removeResponsible = async (id: number) => {
    setResponsibles(prev => prev.filter(r => r.id !== id));
    try { await api.municipalities.removeResponsible({ id }); }
    catch {}
  };

  const addCustomRole = () => {
    if (!newRole.trim() || allRoles.includes(newRole.trim())) return;
    const next = [...customRoles, newRole.trim()];
    setCustomRoles(next);
    localStorage.setItem('netescol_custom_roles_' + mid, JSON.stringify(next));
    setNewRole('');
  };

  const saveAll = async () => {
    setSaving(true);
    setMsg('');
    try {
      const fullAddress = [form.logradouro, form.numero, form.complemento, form.bairro].filter(Boolean).join(', ');
      await api.municipalities.update({
        id: mid,
        name: form.name || undefined,
        city: form.cidade || undefined,
        state: form.estado || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: fullAddress || undefined,
        logoUrl: form.logoUrl || undefined,
        cnpj: form.cnpj || undefined,
        cep: form.cep || undefined,
        logradouro: form.logradouro || undefined,
        numero: form.numero || undefined,
        complemento: form.complemento || undefined,
        bairro: form.bairro || undefined,
        fax: form.fax || undefined,
        website: form.website || undefined,
        prefeitoName: form.prefeitoName || undefined,
        prefeitoCpf: form.prefeitoCpf || undefined,
        prefeitoCargo: form.prefeitoCargo || undefined,
        secretariaName: form.secretariaName || undefined,
        secretariaCnpj: form.secretariaCnpj || undefined,
        secretariaPhone: form.secretariaPhone || undefined,
        secretariaEmail: form.secretariaEmail || undefined,
        secretariaLogradouro: form.secretariaLogradouro || undefined,
        secretarioName: form.secretarioName || undefined,
        secretarioCpf: form.secretarioCpf || undefined,
        secretarioCargo: form.secretarioCargo || undefined,
        secretarioDecreto: form.secretarioDecreto || undefined,
      });
      setMsg('Dados salvos com sucesso!');
    } catch (e: any) { setMsg('Erro: ' + (e.message || 'Falha ao salvar')); }
    finally { setSaving(false); setTimeout(() => setMsg(''), 5000); }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-64"><Loader2 className="animate-spin text-accent-500" size={32} /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro da Prefeitura</h1>
            <p className="text-gray-500">Dados completos do orgao municipal</p>
          </div>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Tudo
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${msg.includes('Erro') || msg.includes('invalido') || msg.includes('incompleto') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg.includes('Erro') ? <AlertTriangle size={16} /> : <CheckCircle size={16} />} {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">

          {/* === PREFEITURA === */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" /> Dados da Prefeitura
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Nome / Razao Social *</label>
                <input className="input" value={form.name} onChange={sf('name')} />
              </div>
              <CNPJField
                value={form.cnpj}
                onChange={v => setForm(f => ({ ...f, cnpj: v }))}
                onDataLoaded={handleCNPJPrefeituraLoaded}
                label="CNPJ da Prefeitura *"
              />
            </div>
          </div>

          {/* === ENDERECO === */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Endereco</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">CEP *</label>
                <div className="flex gap-2">
                  <input className="input flex-1" value={form.cep} onChange={e => setForm(f => ({ ...f, cep: maskCEP(e.target.value) }))} placeholder="00000-000" maxLength={9} />
                  <button onClick={handleCEPLookup} disabled={!!lookingUp} className="px-3 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-1 text-sm disabled:opacity-50">
                    {lookingUp === 'cep' ? <Loader2 size={14} className="animate-spin" /> : '🔍'}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2"><label className="label">Logradouro *</label><input className="input" value={form.logradouro} onChange={sf('logradouro')} /></div>
              <div><label className="label">Numero</label><input className="input" value={form.numero} onChange={sf('numero')} /></div>
              <div><label className="label">Complemento</label><input className="input" value={form.complemento} onChange={sf('complemento')} /></div>
              <div><label className="label">Bairro *</label><input className="input" value={form.bairro} onChange={sf('bairro')} /></div>
              <div><label className="label">UF *</label><select className="input" value={form.estado} onChange={(e) => setForm(f => ({...f, estado: e.target.value, cidade: ''}))}><option value="">Selecione</option>{ESTADOS_BR.map(es => <option key={es.uf} value={es.uf}>{es.uf} - {es.nome}</option>)}</select></div>
              <div><label className="label">Municipio * {munCidadesLoading && <span className="text-xs text-gray-400">carregando...</span>}</label><select className="input" value={form.cidade} onChange={sf('cidade')} disabled={!form.estado || munCidadesLoading}><option value="">Selecione</option>{munCidades.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div>
            </div>
          </div>

          {/* === CONTATO === */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} placeholder="(00) 0000-0000" /></div>
              <div><label className="label">Fax</label><input className="input" value={form.fax} onChange={e => setForm(f => ({ ...f, fax: maskPhone(e.target.value) }))} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={sf('email')} /></div>
              <div><label className="label">Website</label><input className="input" value={form.website} onChange={sf('website')} placeholder="https://..." /></div>
            </div>
          </div>

          {/* === PREFEITO === */}
          <div className="card border-l-4 border-l-blue-500">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <User size={16} className="text-blue-500" /> Prefeito(a)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Nome completo *</label>
                <input className="input" value={form.prefeitoName} onChange={sf('prefeitoName')} placeholder="Nome do(a) prefeito(a)" />
              </div>
              <div>
                <label className="label">CPF *</label>
                <input className="input" value={form.prefeitoCpf} onChange={e => setForm(f => ({ ...f, prefeitoCpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input className="input" value={form.prefeitoCargo} onChange={sf('prefeitoCargo')} />
              </div>
            </div>
          </div>

          {/* === SECRETARIA DE EDUCACAO === */}
          <div className="card border-l-4 border-l-emerald-500">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-500" /> Secretaria de Educacao
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Nome da Secretaria</label>
                <input className="input" value={form.secretariaName} onChange={sf('secretariaName')} placeholder="Secretaria Municipal de Educacao" />
              </div>
              <CNPJField
                value={form.secretariaCnpj}
                onChange={v => setForm(f => ({ ...f, secretariaCnpj: v }))}
                onDataLoaded={handleCNPJSecretariaLoaded}
                label="CNPJ da Secretaria"
              />
              <div>
                <label className="label">Telefone</label>
                <input className="input" value={form.secretariaPhone} onChange={e => setForm(f => ({ ...f, secretariaPhone: maskPhone(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.secretariaEmail} onChange={sf('secretariaEmail')} />
              </div>
              <div>
                <label className="label">Endereco</label>
                <input className="input" value={form.secretariaLogradouro} onChange={sf('secretariaLogradouro')} placeholder="Endereco da secretaria (se diferente)" />
              </div>
            </div>

            {/* Secretario(a) */}
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <User size={14} /> Secretario(a) de Educacao
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Nome completo *</label>
                  <input className="input" value={form.secretarioName} onChange={sf('secretarioName')} />
                </div>
                <div>
                  <label className="label text-xs">CPF *</label>
                  <input className="input" value={form.secretarioCpf} onChange={e => setForm(f => ({ ...f, secretarioCpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div>
                  <label className="label text-xs">Cargo</label>
                  <input className="input" value={form.secretarioCargo} onChange={sf('secretarioCargo')} />
                </div>
                <div>
                  <label className="label text-xs">Decreto de Nomeacao</label>
                  <input className="input" value={form.secretarioDecreto} onChange={sf('secretarioDecreto')} placeholder="Ex: Decreto n 001/2025" />
                </div>
              </div>
            </div>
          </div>

          {/* === DEMAIS RESPONSAVEIS === */}
          <div className="card border-l-4 border-l-purple-500">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Users size={16} className="text-purple-500" /> Demais Responsaveis
            </h3>
            <p className="text-xs text-gray-500 mb-4">Cadastre os responsaveis adicionais do municipio. Cada municipio pode ter cargos diferentes.</p>

            {/* Custom roles management */}
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">Cargos disponiveis</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allRoles.map(r => (
                  <span key={r} className="text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600">{r}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1 text-sm" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Adicionar novo cargo..." onKeyDown={e => e.key === 'Enter' && addCustomRole()} />
                <button onClick={addCustomRole} className="btn-secondary px-3 text-sm"><Plus size={14} /></button>
              </div>
            </div>

            {/* Responsibles table */}
            {responsibles.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Cargo / Funcao</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">CPF</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Decreto</th>
                      <th className="w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {responsibles.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {editingResp === r.id ? (
                          <>
                            <td className="px-2 py-1.5"><input className="input text-sm py-1" value={r.name} onChange={e => updateResponsible(r.id, { name: e.target.value })} /></td>
                            <td className="px-2 py-1.5"><input className="input text-sm py-1" value={r.role} onChange={e => updateResponsible(r.id, { role: e.target.value })} /></td>
                            <td className="px-2 py-1.5"><input className="input text-sm py-1" value={r.cpf} onChange={e => updateResponsible(r.id, { cpf: maskCPF(e.target.value) })} maxLength={14} /></td>
                            <td className="px-2 py-1.5"><input className="input text-sm py-1" value={r.decree} onChange={e => updateResponsible(r.id, { decree: e.target.value })} /></td>
                            <td className="px-2 py-1.5"><button onClick={() => setEditingResp(null)} className="text-xs text-accent-600 hover:underline">OK</button></td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{r.name}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{r.role}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono text-xs">{r.cpf || '--'}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{r.decree || '--'}</td>
                            <td className="px-3 py-2 flex gap-1">
                              <button onClick={() => setEditingResp(r.id)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil size={13} /></button>
                              <button onClick={() => removeResponsible(r.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add new responsible */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Adicionar responsavel</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input className="input text-sm" value={newResp.name} onChange={e => setNewResp(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
                <select className="input text-sm" value={newResp.role} onChange={e => setNewResp(f => ({ ...f, role: e.target.value }))}>
                  <option value="">Selecione o cargo</option>
                  {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input className="input text-sm" value={newResp.cpf} onChange={e => setNewResp(f => ({ ...f, cpf: maskCPF(e.target.value) }))} placeholder="CPF" maxLength={14} />
                <div className="flex gap-2">
                  <input className="input text-sm flex-1" value={newResp.decree} onChange={e => setNewResp(f => ({ ...f, decree: e.target.value }))} placeholder="Decreto nomeacao" />
                  <button onClick={addResponsible} disabled={!newResp.name || !newResp.role} className="btn-primary px-3 disabled:opacity-40"><Plus size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Logo */}
        <div>
          <div className="card text-center">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Logotipo da Prefeitura</h3>
            <p className="text-xs text-gray-400 mb-3">Ideal: 120x120px</p>
            <div className="w-32 h-32 mx-auto mb-4 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700 cursor-pointer hover:border-accent-400 transition-colors" onClick={() => logoRef.current?.click()}>
              {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Image size={32} className="text-gray-300" />}
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <button onClick={() => logoRef.current?.click()} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <Upload size={14} /> Carregar Logo
            </button>
            {form.logoUrl && (
              <button onClick={() => setForm(f => ({ ...f, logoUrl: '' }))} className="text-xs text-red-500 hover:underline mt-2">
                Remover logo
              </button>
            )}
          </div>

          <div className="card mt-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">Resumo</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <p><b className="text-gray-700 dark:text-gray-300">Prefeito(a):</b> {form.prefeitoName || 'Nao informado'}</p>
              <p><b className="text-gray-700 dark:text-gray-300">Secretario(a):</b> {form.secretarioName || 'Nao informado'}</p>
              <p><b className="text-gray-700 dark:text-gray-300">Responsaveis:</b> {responsibles.length} cadastrado(s)</p>
            </div>
          </div>

          <div className="card mt-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">Dica</h3>
            <p className="text-xs text-gray-500">Clique no botao <b>Receita Federal</b> ao lado do CNPJ para carregar os dados automaticamente. O mesmo vale para o CEP.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
