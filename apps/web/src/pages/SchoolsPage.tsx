import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { lookupCNPJ, lookupCEP, maskCEP } from '../lib/cnpjCep';
import { maskCNPJ, validateCNPJ, maskPhone } from '../lib/utils';
import { School, Plus, X, Phone, Mail, MapPin, Pencil, Trash2, Search, Users, Clock, Loader2, Eye, Download, Upload, Image, CheckCircle, AlertTriangle } from 'lucide-react';

const emptyForm = {
  name: '', code: '', type: 'fundamental', cnpj: '', cep: '',
  logradouro: '', numero: '', complemento: '', bairro: '', city: '', state: '',
  phone: '', email: '', directorName: '', logoUrl: '',
  morningStart: '07:00', morningEnd: '12:00', afternoonStart: '13:00', afternoonEnd: '17:00',
  latitude: '', longitude: '',
};

export default function SchoolsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [viewSchool, setViewSchool] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState('');
  const logoRef = useRef<HTMLInputElement>(null);
  const { data: schools, refetch } = useQuery(() => api.schools.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.schools.create);
  const { mutate: update, loading: updating } = useMutation(api.schools.update);
  const { mutate: remove } = useMutation(api.schools.delete);

  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const all = (schools as any) || [];
  const filtered = all.filter((s: any) => {
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q) || (s.directorName || '').toLowerCase().includes(q);
  });

  const openNew = () => { setForm(emptyForm); setEditId(null); setFormErr(''); setFormMsg(''); setShowModal(true); };

  const openEdit = (s: any) => {
    // Parse address back into parts
    const extra = getSchoolExtra(s.id);
    setForm({
      ...emptyForm, ...s,
      phone: s.phone || '', latitude: s.latitude ? String(s.latitude) : '', longitude: s.longitude ? String(s.longitude) : '',
      cnpj: extra.cnpj || '', cep: extra.cep || '', logradouro: extra.logradouro || s.address || '',
      numero: extra.numero || '', complemento: extra.complemento || '', bairro: extra.bairro || '',
      city: extra.city || '', state: extra.state || '', logoUrl: extra.logoUrl || '',
    });
    setEditId(s.id);
    setFormErr('');
    setFormMsg('');
    setShowModal(true);
  };

  // Store extra fields in localStorage (CNPJ, CEP, logo, address parts)
  const getSchoolExtra = (id: number) => {
    try { return JSON.parse(localStorage.getItem('netescol_school_extra_' + id) || '{}'); } catch { return {}; }
  };
  const saveSchoolExtra = (id: number, data: any) => {
    localStorage.setItem('netescol_school_extra_' + id, JSON.stringify(data));
  };

  const handleCNPJLookup = async () => {
    const digits = form.cnpj.replace(/\D/g, '');
    if (digits.length !== 14) { setFormMsg('CNPJ incompleto'); return; }
    if (!validateCNPJ(digits)) { setFormMsg('CNPJ invalido'); return; }
    setLookingUp('cnpj');
    setFormMsg('');
    try {
      const data = await lookupCNPJ(digits);
      setForm((f: any) => ({
        ...f,
        name: data.nomeFantasia || data.razaoSocial || f.name,
        logradouro: data.logradouro || f.logradouro,
        numero: data.numero || f.numero,
        complemento: data.complemento || f.complemento,
        bairro: data.bairro || f.bairro,
        cep: data.cep ? maskCEP(data.cep) : f.cep,
        city: data.cidade || f.city,
        state: data.estado || f.state,
        phone: data.telefone || f.phone,
        email: data.email || f.email,
      }));
      setFormMsg('Dados carregados da Receita Federal!');
    } catch (e: any) { setFormMsg('Erro: ' + e.message); }
    finally { setLookingUp(''); }
  };

  const handleCEPLookup = async () => {
    const digits = form.cep.replace(/\D/g, '');
    if (digits.length !== 8) { setFormMsg('CEP incompleto'); return; }
    setLookingUp('cep');
    try {
      const data = await lookupCEP(digits);
      setForm((f: any) => ({
        ...f,
        logradouro: data.logradouro || f.logradouro,
        bairro: data.bairro || f.bairro,
        city: data.cidade || f.city,
        state: data.estado || f.state,
        complemento: data.complemento || f.complemento,
      }));
      setFormMsg('Endereco carregado pelo CEP!');
    } catch (e: any) { setFormMsg('Erro: ' + e.message); }
    finally { setLookingUp(''); }
  };

  const handleLogoUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f: any) => ({ ...f, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name) { setFormErr('Nome e obrigatorio.'); return; }
    const fullAddress = [form.logradouro, form.numero, form.complemento, form.bairro, form.city, form.state].filter(Boolean).join(', ');
    const payload: any = {
      municipalityId, name: form.name, code: form.code || undefined, type: form.type || undefined,
      address: fullAddress || undefined, phone: form.phone || undefined, email: form.email || undefined,
      directorName: form.directorName || undefined, morningStart: form.morningStart || undefined,
      morningEnd: form.morningEnd || undefined, afternoonStart: form.afternoonStart || undefined,
      afternoonEnd: form.afternoonEnd || undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    };

    const saveExtra = (id: number) => {
      saveSchoolExtra(id, {
        cnpj: form.cnpj, cep: form.cep, logradouro: form.logradouro, numero: form.numero,
        complemento: form.complemento, bairro: form.bairro, city: form.city, state: form.state,
        logoUrl: form.logoUrl,
      });
    };

    if (editId !== null) {
      update({ id: editId, ...payload }, {
        onSuccess: () => { saveExtra(editId); refetch(); setShowModal(false); },
        onError: (e: any) => { setFormErr(e?.message || 'Erro'); },
      });
    } else {
      create(payload, {
        onSuccess: (res: any) => { const newId = res?.id || Date.now(); saveExtra(newId); refetch(); setShowModal(false); },
        onError: (e: any) => { setFormErr(e?.message || 'Erro'); },
      });
    }
  };

  const exportSchoolsCSV = () => {
    if (!all.length) return;
    const rows = all.map((s: any) => ({
      nome: s.name || '', tipo: s.type || '', codigo_inep: s.code || '',
      diretor: s.directorName || '', telefone: s.phone || '', email: s.email || '', endereco: s.address || '',
    }));
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(';'), ...rows.map((r: any) => keys.map(k => '"' + (r[k] || '') + '"').join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'escolas_netescol.csv';
    a.click();
  };

  const getSchoolLogo = (s: any) => getSchoolExtra(s.id)?.logoUrl;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Escolas</h1><p className="text-gray-500">{all.length} escola(s) cadastrada(s)</p></div>
        <div className="flex gap-2">
          <button onClick={exportSchoolsCSV} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nova Escola</button>
        </div>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por nome, endereco ou diretor..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s: any) => (
          <div key={s.id} className="card hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {getSchoolLogo(s) ? <img src={getSchoolLogo(s)} alt="" className="w-full h-full object-contain" /> : <School size={20} className="text-emerald-600" />}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setViewSchool(s)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Detalhes"><Eye size={14} /></button>
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><Pencil size={14} /></button>
                <button onClick={() => setConfirmDelete(s)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="font-bold text-gray-900">{s.name}</p>
            {s.code && <p className="text-xs text-accent-600 font-medium">INEP: {s.code}</p>}
            <div className="mt-2 space-y-1">
              {s.address && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{s.address}</p>}
              {s.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} />{s.phone}</p>}
              {s.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} />{s.email}</p>}
              {s.directorName && <p className="text-xs text-gray-500">Diretor(a): {s.directorName}</p>}
              {s.type && <p className="text-xs text-gray-500 flex items-center gap-1"><Users size={10} />{s.type === 'infantil' ? 'Educacao Infantil' : s.type === 'fundamental' ? 'Ensino Fundamental' : s.type === 'medio' ? 'Ensino Medio' : s.type === 'tecnico' ? 'Ensino Tecnico' : s.type === 'especial' ? 'Educacao Especial' : s.type}</p>}
            </div>
          </div>
        ))}
        {!filtered.length && !search && <div className="col-span-3 card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhuma escola cadastrada</p><button className="btn-primary" onClick={openNew}>Adicionar escola</button></div>}
        {!filtered.length && search && <div className="col-span-3 card text-center py-8"><p className="text-gray-500">Nenhum resultado para "{search}"</p></div>}
      </div>

      {/* View details modal */}
      {viewSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-blue-500" /> Detalhes da Escola</h3><button onClick={() => setViewSchool(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
            <div className="overflow-y-auto flex-1 p-5">
              <div className="flex items-center gap-4 mb-4">
                {getSchoolLogo(viewSchool) && <img src={getSchoolLogo(viewSchool)} alt="" className="w-16 h-16 rounded-xl object-contain border" />}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewSchool.name}</h2>
                  {getSchoolExtra(viewSchool.id)?.cnpj && <p className="text-sm text-gray-500">CNPJ: {getSchoolExtra(viewSchool.id).cnpj}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Tipo</p><p className="text-sm font-medium">{viewSchool.type || '--'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Codigo INEP</p><p className="text-sm font-medium">{viewSchool.code || '--'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Diretor(a)</p><p className="text-sm font-medium">{viewSchool.directorName || '--'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Telefone</p><p className="text-sm font-medium">{viewSchool.phone || '--'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium">{viewSchool.email || '--'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Endereco</p><p className="text-sm font-medium">{viewSchool.address || '--'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Manha</p><p className="text-sm font-medium">{viewSchool.morningStart || '--'} - {viewSchool.morningEnd || '--'}</p></div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"><p className="text-xs text-gray-400">Tarde</p><p className="text-sm font-medium">{viewSchool.afternoonStart || '--'} - {viewSchool.afternoonEnd || '--'}</p></div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setViewSchool(null)} className="btn-secondary flex-1">Fechar</button>
              <button onClick={() => {
                const s = viewSchool; const logo = getSchoolLogo(s);
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${s.name} - NetEscol</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}.header{display:flex;align-items:center;gap:15px;margin-bottom:20px}.logo{width:60px;height:60px;object-fit:contain}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}.field{padding:10px;background:#f8f9fa;border-radius:8px}.field-label{font-size:11px;color:#999;margin-bottom:3px}.field-value{font-size:14px;font-weight:500}.footer{margin-top:30px;text-align:center;font-size:11px;color:#999}@media print{body{padding:15px}}</style></head><body><div class="header">${logo ? '<img src="' + logo + '" class="logo"/>' : ''}<h1>${s.name}</h1></div><div class="grid"><div class="field"><div class="field-label">Tipo</div><div class="field-value">${s.type || '--'}</div></div><div class="field"><div class="field-label">Codigo INEP</div><div class="field-value">${s.code || '--'}</div></div><div class="field"><div class="field-label">Diretor(a)</div><div class="field-value">${s.directorName || '--'}</div></div><div class="field"><div class="field-label">Telefone</div><div class="field-value">${s.phone || '--'}</div></div><div class="field"><div class="field-label">Email</div><div class="field-value">${s.email || '--'}</div></div><div class="field"><div class="field-label">Endereco</div><div class="field-value">${s.address || '--'}</div></div><div class="field"><div class="field-label">Manha</div><div class="field-value">${s.morningStart || '--'} - ${s.morningEnd || '--'}</div></div><div class="field"><div class="field-label">Tarde</div><div class="field-value">${s.afternoonStart || '--'} - ${s.afternoonEnd || '--'}</div></div></div><div class="footer">Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
                const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); }
              }} className="btn-secondary flex-1 flex items-center justify-center gap-1"><Download size={14} /> Imprimir</button>
              <button onClick={() => { setViewSchool(null); openEdit(viewSchool); }} className="btn-primary flex-1">Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir {confirmDelete.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acao nao pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { remove({ id: confirmDelete.id }, { onSuccess: () => { refetch(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {/* Create/Edit modal - enhanced */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">{editId ? 'Editar Escola' : 'Nova Escola'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><AlertTriangle size={16} />{formErr}</div>}
              {formMsg && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${formMsg.includes('Erro') || formMsg.includes('invalido') || formMsg.includes('incompleto') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {formMsg.includes('Erro') ? <AlertTriangle size={16} /> : <CheckCircle size={16} />} {formMsg}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main fields */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Identificacao */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><School size={14} /> Identificacao</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><label className="label">Nome da escola *</label><input className="input" value={form.name} onChange={sf('name')} placeholder="Ex: Escola Municipal Centro" /></div>
                      <div>
                        <label className="label">CNPJ</label>
                        <div className="flex gap-2">
                          <input className="input flex-1" value={form.cnpj} onChange={e => setForm((f: any) => ({ ...f, cnpj: maskCNPJ(e.target.value) }))} placeholder="00.000.000/0000-00" maxLength={18} />
                          <button onClick={handleCNPJLookup} disabled={!!lookingUp} className="px-3 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-1 text-sm disabled:opacity-50" title="Buscar na Receita Federal">
                            {lookingUp === 'cnpj' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Buscar
                          </button>
                        </div>
                      </div>
                      <div><label className="label">Codigo INEP</label><input className="input" value={form.code} onChange={sf('code')} placeholder="Ex: 12345678" /></div>
                      <div><label className="label">Tipo</label>
                        <select className="input" value={form.type} onChange={sf('type')}>
                          <option value="infantil">Educacao Infantil</option>
                          <option value="fundamental">Ensino Fundamental</option>
                          <option value="medio">Ensino Medio</option>
                          <option value="tecnico">Ensino Tecnico</option>
                          <option value="especial">Educacao Especial</option>
                        </select>
                      </div>
                      <div><label className="label">Diretor(a)</label><input className="input" value={form.directorName} onChange={sf('directorName')} /></div>
                    </div>
                  </div>

                  {/* Endereco */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2"><MapPin size={14} /> Endereco</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="label">CEP</label>
                        <div className="flex gap-2">
                          <input className="input flex-1" value={form.cep} onChange={e => setForm((f: any) => ({ ...f, cep: maskCEP(e.target.value) }))} placeholder="00000-000" maxLength={9} />
                          <button onClick={handleCEPLookup} disabled={!!lookingUp} className="px-3 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-1 text-sm disabled:opacity-50">
                            {lookingUp === 'cep' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2"><label className="label">Logradouro</label><input className="input" value={form.logradouro} onChange={sf('logradouro')} placeholder="Rua, Avenida..." /></div>
                      <div><label className="label">Numero</label><input className="input" value={form.numero} onChange={sf('numero')} /></div>
                      <div><label className="label">Complemento</label><input className="input" value={form.complemento} onChange={sf('complemento')} /></div>
                      <div><label className="label">Bairro</label><input className="input" value={form.bairro} onChange={sf('bairro')} /></div>
                      <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={sf('city')} /></div>
                      <div><label className="label">UF</label><input className="input" value={form.state} onChange={sf('state')} maxLength={2} placeholder="TO" /></div>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2"><Phone size={14} /> Contato</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: maskPhone(e.target.value) }))} placeholder="(00) 00000-0000" maxLength={15} /></div>
                      <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={sf('email')} /></div>
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2"><Clock size={14} /> Horarios de Funcionamento</p>
                    <div className="grid grid-cols-4 gap-3">
                      <div><label className="label text-xs">Manha inicio</label><input className="input" type="time" value={form.morningStart} onChange={sf('morningStart')} /></div>
                      <div><label className="label text-xs">Manha fim</label><input className="input" type="time" value={form.morningEnd} onChange={sf('morningEnd')} /></div>
                      <div><label className="label text-xs">Tarde inicio</label><input className="input" type="time" value={form.afternoonStart} onChange={sf('afternoonStart')} /></div>
                      <div><label className="label text-xs">Tarde fim</label><input className="input" type="time" value={form.afternoonEnd} onChange={sf('afternoonEnd')} /></div>
                    </div>
                  </div>

                  {/* Coordenadas */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2"><MapPin size={14} /> Coordenadas (para o mapa)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label text-xs">Latitude</label><input className="input" value={form.latitude} onChange={sf('latitude')} placeholder="-10.1234" /></div>
                      <div><label className="label text-xs">Longitude</label><input className="input" value={form.longitude} onChange={sf('longitude')} placeholder="-48.5678" /></div>
                    </div>
                    <p className="text-xs text-green-600 mt-2">Dica: Abra o Google Maps, clique com botao direito no local e copie as coordenadas.</p>
                  </div>
                </div>

                {/* Right column - Logo */}
                <div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Logotipo da Escola</p>
                    <p className="text-xs text-gray-400 mb-3">Ideal: 120x120px</p>
                    <div className="w-28 h-28 mx-auto mb-4 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-white dark:bg-gray-600 cursor-pointer hover:border-accent-400 transition-colors" onClick={() => logoRef.current?.click()}>
                      {form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Image size={28} className="text-gray-300" />}
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <button onClick={() => logoRef.current?.click()} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                      <Upload size={14} /> Carregar Logo
                    </button>
                    {form.logoUrl && (
                      <button onClick={() => setForm((f: any) => ({ ...f, logoUrl: '' }))} className="text-xs text-red-500 hover:underline mt-2">Remover logo</button>
                    )}
                  </div>

                  <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-xl mt-4">
                    <p className="text-sm font-semibold text-accent-700 dark:text-accent-400 mb-2">Dica</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Digite o CNPJ e clique em "Buscar" para carregar os dados automaticamente da Receita Federal. O mesmo para o CEP.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={creating || updating} className="btn-primary flex-1">
                {creating || updating ? 'Salvando...' : editId ? 'Salvar Alteracoes' : 'Salvar Escola'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
