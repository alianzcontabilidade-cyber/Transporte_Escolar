import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { lookupCNPJ, lookupCEP, maskCEP } from '../lib/cnpjCep';
import { maskCNPJ, validateCNPJ, maskPhone, maskCPF } from '../lib/utils';
import { Building2, Search, Save, Upload, Plus, Trash2, Loader2, CheckCircle, AlertTriangle, Image } from 'lucide-react';

interface Responsible {
  id: number;
  name: string;
  role: string;
  cpf: string;
}

export default function MunicipalitySettingsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const logoRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState('');
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    name: '', cnpj: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cep: '', cidade: '', estado: '', phone: '', fax: '',
    email: '', website: '', logoUrl: '',
    secretariaName: '', secretariaPhone: '', secretariaEmail: '',
    secretarioName: '', secretarioCpf: '',
  });

  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [newResp, setNewResp] = useState({ name: '', role: 'Gestor', cpf: '' });

  const sf = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!mid) return;
    setLoading(true);
    api.municipalities.getById({ id: mid }).then((m: any) => {
      if (m) {
        const addr = m.address || '';
        setForm(f => ({
          ...f,
          name: m.name || '',
          cnpj: m.cnpj || '',
          email: m.email || '',
          phone: m.phone || '',
          cidade: m.city || '',
          estado: m.state || '',
          logoUrl: m.logoUrl || '',
          logradouro: addr,
        }));
      }
      // Load responsibles from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('netescol_responsibles_' + mid) || '[]');
        setResponsibles(saved);
      } catch {}
      // Load extra fields from localStorage
      try {
        const extra = JSON.parse(localStorage.getItem('netescol_mun_extra_' + mid) || '{}');
        if (extra) setForm(f => ({ ...f, ...extra }));
      } catch {}
    }).catch(() => {}).finally(() => setLoading(false));
  }, [mid]);

  const handleCNPJLookup = async () => {
    const digits = form.cnpj.replace(/\D/g, '');
    if (digits.length !== 14) { setMsg('CNPJ incompleto'); return; }
    if (!validateCNPJ(digits)) { setMsg('CNPJ invalido'); return; }
    setLookingUp('cnpj');
    setMsg('');
    try {
      const data = await lookupCNPJ(digits);
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
      setMsg('Dados carregados da Receita Federal!');
    } catch (e: any) { setMsg('Erro: ' + e.message); }
    finally { setLookingUp(''); }
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

  const addResponsible = () => {
    if (!newResp.name) return;
    const r: Responsible = { id: Date.now(), ...newResp };
    const next = [...responsibles, r];
    setResponsibles(next);
    localStorage.setItem('netescol_responsibles_' + mid, JSON.stringify(next));
    setNewResp({ name: '', role: 'Gestor', cpf: '' });
  };

  const removeResponsible = (id: number) => {
    const next = responsibles.filter(r => r.id !== id);
    setResponsibles(next);
    localStorage.setItem('netescol_responsibles_' + mid, JSON.stringify(next));
  };

  const saveAll = async () => {
    setSaving(true);
    setMsg('');
    try {
      const fullAddress = [form.logradouro, form.numero, form.complemento, form.bairro].filter(Boolean).join(', ');
      await api.municipalities.update({
        id: mid, name: form.name || undefined, email: form.email || undefined,
        phone: form.phone || undefined, address: fullAddress || undefined,
        logoUrl: form.logoUrl || undefined,
      });
      // Save extra fields in localStorage
      localStorage.setItem('netescol_mun_extra_' + mid, JSON.stringify({
        cnpj: form.cnpj, logradouro: form.logradouro, numero: form.numero,
        complemento: form.complemento, bairro: form.bairro, cep: form.cep,
        cidade: form.cidade, estado: form.estado, fax: form.fax, website: form.website,
        secretariaName: form.secretariaName, secretariaPhone: form.secretariaPhone,
        secretariaEmail: form.secretariaEmail, secretarioName: form.secretarioName,
        secretarioCpf: form.secretarioCpf,
      }));
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
            <h1 className="text-2xl font-bold text-gray-900">Cadastro da Prefeitura</h1>
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
        {/* Main form - 2 columns */}
        <div className="lg:col-span-2 space-y-5">
          {/* CNPJ + Auto lookup */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Identificacao</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Nome / Razao Social *</label>
                <input className="input" value={form.name} onChange={sf('name')} />
              </div>
              <div>
                <label className="label">CNPJ *</label>
                <div className="flex gap-2">
                  <input className="input flex-1" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: maskCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" maxLength={18} />
                  <button onClick={handleCNPJLookup} disabled={!!lookingUp} className="px-3 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-1 text-sm disabled:opacity-50" title="Buscar na Receita Federal">
                    {lookingUp === 'cnpj' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Buscar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Endereco</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">CEP *</label>
                <div className="flex gap-2">
                  <input className="input flex-1" value={form.cep} onChange={e => setForm(f => ({ ...f, cep: maskCEP(e.target.value) }))} placeholder="00000-000" maxLength={9} />
                  <button onClick={handleCEPLookup} disabled={!!lookingUp} className="px-3 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-1 text-sm disabled:opacity-50">
                    {lookingUp === 'cep' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="label">Logradouro *</label>
                <input className="input" value={form.logradouro} onChange={sf('logradouro')} />
              </div>
              <div>
                <label className="label">Numero</label>
                <input className="input" value={form.numero} onChange={sf('numero')} />
              </div>
              <div>
                <label className="label">Complemento</label>
                <input className="input" value={form.complemento} onChange={sf('complemento')} />
              </div>
              <div>
                <label className="label">Bairro *</label>
                <input className="input" value={form.bairro} onChange={sf('bairro')} />
              </div>
              <div>
                <label className="label">Municipio *</label>
                <input className="input" value={form.cidade} onChange={sf('cidade')} />
              </div>
              <div>
                <label className="label">UF *</label>
                <input className="input" value={form.estado} onChange={sf('estado')} maxLength={2} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Telefone</label>
                <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} placeholder="(00) 0000-0000" />
              </div>
              <div>
                <label className="label">Fax</label>
                <input className="input" value={form.fax} onChange={e => setForm(f => ({ ...f, fax: maskPhone(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={sf('email')} />
              </div>
              <div>
                <label className="label">Website</label>
                <input className="input" value={form.website} onChange={sf('website')} placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* Secretaria */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Secretaria de Educacao</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Nome da Secretaria</label>
                <input className="input" value={form.secretariaName} onChange={sf('secretariaName')} placeholder="Secretaria Municipal de Educacao" />
              </div>
              <div>
                <label className="label">Secretario(a) de Educacao</label>
                <input className="input" value={form.secretarioName} onChange={sf('secretarioName')} />
              </div>
              <div>
                <label className="label">CPF do Secretario(a)</label>
                <input className="input" value={form.secretarioCpf} onChange={e => setForm(f => ({ ...f, secretarioCpf: maskCPF(e.target.value) }))} placeholder="000.000.000-00" maxLength={14} />
              </div>
              <div>
                <label className="label">Telefone da Secretaria</label>
                <input className="input" value={form.secretariaPhone} onChange={e => setForm(f => ({ ...f, secretariaPhone: maskPhone(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Email da Secretaria</label>
                <input className="input" type="email" value={form.secretariaEmail} onChange={sf('secretariaEmail')} />
              </div>
            </div>
          </div>

          {/* Responsaveis */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Responsaveis</h3>
            {responsibles.length > 0 && (
              <div className="mb-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Funcao</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">CPF</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {responsibles.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{r.name}</td>
                        <td className="px-3 py-2 text-gray-600">{r.role}</td>
                        <td className="px-3 py-2 text-gray-500">{r.cpf}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeResponsible(r.id)} className="p-1 text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <input className="input flex-1 min-w-[150px]" value={newResp.name} onChange={e => setNewResp(f => ({ ...f, name: e.target.value }))} placeholder="Nome do responsavel" />
              <select className="input w-48" value={newResp.role} onChange={e => setNewResp(f => ({ ...f, role: e.target.value }))}>
                <option>Gestor</option>
                <option>Prefeito(a)</option>
                <option>Secretario(a)</option>
                <option>Contador</option>
                <option>Controle Interno</option>
                <option>Ordenador de Despesa</option>
                <option>Resp. Setor de Compras</option>
                <option>Outro</option>
              </select>
              <input className="input w-40" value={newResp.cpf} onChange={e => setNewResp(f => ({ ...f, cpf: maskCPF(e.target.value) }))} placeholder="CPF" maxLength={14} />
              <button onClick={addResponsible} className="btn-primary px-3"><Plus size={16} /></button>
            </div>
          </div>
        </div>

        {/* Right column - Logo */}
        <div>
          <div className="card text-center">
            <h3 className="font-semibold text-gray-800 mb-3">Logotipo</h3>
            <p className="text-xs text-gray-400 mb-3">Ideal: 120x120px</p>
            <div className="w-32 h-32 mx-auto mb-4 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-accent-400 transition-colors" onClick={() => logoRef.current?.click()}>
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
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Dica</h3>
            <p className="text-xs text-gray-500">Digite o CNPJ e clique em "Buscar" para carregar os dados automaticamente da Receita Federal. O mesmo para o CEP.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
