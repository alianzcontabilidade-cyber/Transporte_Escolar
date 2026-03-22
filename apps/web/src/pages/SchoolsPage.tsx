import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { lookupCEP, maskCEP } from '../lib/cnpjCep';
import { maskPhone } from '../lib/utils';
import { searchSchoolsByMunicipality } from '../lib/inepData';
import CNPJField from '../components/CNPJField';
import SchoolINEPAutocomplete from '../components/SchoolINEPAutocomplete';
import { School, Plus, X, Phone, Mail, MapPin, Pencil, Trash2, Search, Users, Clock, Loader2, Eye, Download, Upload, Image, CheckCircle, AlertTriangle, DatabaseZap, BookOpen, GraduationCap, Bus, FileText, Printer } from 'lucide-react';
import { CrossNavPanel, QuickNavButton } from '../components/CrossNavPanel';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';
import ReportSignatureSelector, { Signatory } from '../components/ReportSignatureSelector';
import { StudentMiniCard, ClassMiniCard, QuickActionButton } from '../components/EntitySummaries';

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
  const [showImportINEP, setShowImportINEP] = useState(false);
  const [inepResults, setInepResults] = useState<any[]>([]);
  const [inepLoading, setInepLoading] = useState(false);
  const [inepMsg, setInepMsg] = useState('');
  const [inepCityCode, setInepCityCode] = useState('');
  const [inepSelected, setInepSelected] = useState<Set<string>>(new Set());
  const [munCityName, setMunCityName] = useState('');
  const logoRef = useRef<HTMLInputElement>(null);
  const { data: schools, refetch } = useQuery(() => api.schools.list({ municipalityId }), [municipalityId]);
  const { data: allStudents } = useQuery(() => api.students.list({ municipalityId }), [municipalityId]);
  const { data: allClasses } = useQuery(() => api.classes?.list?.({ municipalityId }) || Promise.resolve([]), [municipalityId]);
  const { data: allRoutes } = useQuery(() => api.routes.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.schools.create);
  const { mutate: update, loading: updating } = useMutation(api.schools.update);
  const { mutate: remove } = useMutation(api.schools.delete);

  // Cross-navigation panel
  const [panelSchool, setPanelSchool] = useState<any>(null);
  const [panelType, setPanelType] = useState<'students' | 'classes' | 'routes' | null>(null);

  const getStudentsBySchool = (schoolId: number) => ((allStudents as any) || []).filter((s: any) => s.schoolId === schoolId);
  const getClassesBySchool = (schoolId: number) => ((allClasses as any) || []).filter((c: any) => c.schoolId === schoolId);
  const getRoutesBySchool = (schoolId: number) => ((allRoutes as any) || []).filter((r: any) => (r.route?.schoolId || r.schoolId) === schoolId);

  const openPanel = (school: any, type: 'students' | 'classes' | 'routes') => {
    setPanelSchool(school);
    setPanelType(type);
  };

  // Auto-detect municipality name for INEP school search
  useEffect(() => {
    if (!municipalityId) return;
    api.municipalities.getById({ id: municipalityId }).then((m: any) => {
      if (m?.city) {
        setMunCityName(m.city);
      }
    }).catch(() => {});
  }, [municipalityId]);

  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const all = (schools as any) || [];
  const filtered = all.filter((s: any) => {
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q) || (s.directorName || '').toLowerCase().includes(q);
  });

  const openNew = () => { setForm(emptyForm); setEditId(null); setFormErr(''); setFormMsg(''); setShowModal(true); };

  const openEdit = (s: any) => {
    // Load data from API response (DB columns) with fallback to localStorage for migration
    const extra = getSchoolExtra(s.id);
    setForm({
      ...emptyForm, ...s,
      phone: s.phone || '', latitude: s.latitude ? String(s.latitude) : '', longitude: s.longitude ? String(s.longitude) : '',
      cnpj: s.cnpj || extra.cnpj || '', cep: s.cep || extra.cep || '',
      logradouro: s.logradouro || extra.logradouro || '',
      numero: s.numero || extra.numero || '', complemento: s.complemento || extra.complemento || '',
      bairro: s.bairro || extra.bairro || '',
      city: s.city || extra.city || '', state: s.state || extra.state || '',
      logoUrl: s.logoUrl || extra.logoUrl || '',
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

  const handleCNPJDataLoaded = (data: any) => {
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
  };

  const handleSearchSchoolsByCity = async () => {
    if (!inepCityCode) { setInepMsg('Informe o nome do município'); return; }
    setInepLoading(true);
    setInepMsg('');
    setInepResults([]);
    setInepSelected(new Set());
    try {
      const results = await searchSchoolsByMunicipality(inepCityCode);
      if (results.length === 0) { setInepMsg('Nenhuma escola encontrada para "' + inepCityCode + '"'); }
      else {
        const existingCodes = new Set(all.map((s: any) => s.code).filter(Boolean));
        const newResults = results.map(r => ({ ...r, alreadyExists: existingCodes.has(r.inepCode) }));
        setInepResults(newResults);
        setInepMsg(results.length + ' escola(s) encontrada(s) na base do INEP');
      }
    } catch (e: any) { setInepMsg('Erro: ' + e.message); }
    finally { setInepLoading(false); }
  };

  const toggleInepSelect = (code: string) => {
    setInepSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const selectAllInep = () => {
    const available = inepResults.filter(r => !r.alreadyExists);
    if (inepSelected.size === available.length) setInepSelected(new Set());
    else setInepSelected(new Set(available.map(r => r.inepCode)));
  };

  const importSelectedSchools = async () => {
    if (inepSelected.size === 0) { setInepMsg('Selecione pelo menos uma escola'); return; }
    setInepLoading(true);
    let imported = 0;
    for (const code of inepSelected) {
      const school = inepResults.find(r => r.inepCode === code);
      if (!school || school.alreadyExists) continue;
      try {
        await api.schools.create({
          municipalityId, name: school.name, code: school.inepCode, type: 'fundamental',
        });
        imported++;
      } catch {}
    }
    setInepMsg(imported + ' escola(s) importada(s) com sucesso!');
    setInepSelected(new Set());
    refetch();
    if (imported > 0) {
      // Mark imported ones
      setInepResults(prev => prev.map(r => inepSelected.has(r.inepCode) ? { ...r, alreadyExists: true } : r));
    }
    setInepLoading(false);
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
      cnpj: form.cnpj || undefined, cep: form.cep || undefined,
      logradouro: form.logradouro || undefined, numero: form.numero || undefined,
      complemento: form.complemento || undefined, bairro: form.bairro || undefined,
      city: form.city || undefined, state: form.state || undefined,
      address: fullAddress || undefined, phone: form.phone || undefined, email: form.email || undefined,
      directorName: form.directorName || undefined, logoUrl: form.logoUrl || undefined,
      morningStart: form.morningStart || undefined,
      morningEnd: form.morningEnd || undefined, afternoonStart: form.afternoonStart || undefined,
      afternoonEnd: form.afternoonEnd || undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    };

    if (editId !== null) {
      update({ id: editId, ...payload }, {
        onSuccess: () => { refetch(); setShowModal(false); },
        onError: (e: any) => { setFormErr(e?.message || 'Erro'); },
      });
    } else {
      create(payload, {
        onSuccess: () => { refetch(); setShowModal(false); },
        onError: (e: any) => { setFormErr(e?.message || 'Erro'); },
      });
    }
  };

  const [munReport, setMunReport] = useState<any>(null);
  const [selectedSigs, setSelectedSigs] = useState<Signatory[]>([]);
  useEffect(() => { if (municipalityId) getMunicipalityReport(municipalityId, api).then(setMunReport).catch(() => {}); }, [municipalityId]);
  const [schExportModal, setSchExportModal] = useState<{title:string;data:any[];cols:string[];filename:string}|null>(null);
  const schExportRows = all.map((s: any) => ({ nome: s.name||'', tipo: s.type||'', codigo_inep: s.code||'', diretor: s.directorName||'', telefone: s.phone||'', email: s.email||'', endereco: s.address||'' }));
  const schExportCols = ['Nome','Tipo','Codigo INEP','Diretor(a)','Telefone','Email','Endereco'];
  const doSchExport = (format: ExportFormat) => {
    if (!schExportModal) return;
    handleExport(format, schExportModal.data, buildTableReportHTML(schExportModal.title, schExportModal.data, schExportModal.cols, munReport, { orientation: "landscape", signatories: selectedSigs }), schExportModal.filename);
  };

  const getSchoolLogo = (s: any) => getSchoolExtra(s.id)?.logoUrl;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Escolas</h1><p className="text-gray-500">{all.length} escola(s) cadastrada(s)</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImportINEP(true); setInepResults([]); setInepMsg(''); setInepCityCode(munCityName); }} className="btn-secondary flex items-center gap-2"><DatabaseZap size={16} /> Importar do INEP</button>
          <button onClick={() => setSchExportModal({title:'Lista de Escolas',data:schExportRows,cols:schExportCols,filename:'escolas_netescol'})} className="btn-secondary flex items-center gap-2"><Download size={16} /> Exportar</button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nova Escola</button>
        </div>
      </div>

      <ReportSignatureSelector selected={selectedSigs} onChange={setSelectedSigs} />
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
            <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
            {s.code && <p className="text-xs text-accent-600 font-medium">INEP: {s.code}</p>}
            <div className="mt-2 space-y-1">
              {s.address && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{s.address}</p>}
              {s.directorName && <p className="text-xs text-gray-500">Diretor(a): {s.directorName}</p>}
              {s.type && <p className="text-xs text-gray-500 flex items-center gap-1"><Users size={10} />{s.type === 'infantil' ? 'Ed. Infantil' : s.type === 'fundamental' ? 'Ens. Fundamental' : s.type === 'medio' ? 'Ens. Médio' : s.type === 'tecnico' ? 'Ens. Técnico' : s.type === 'especial' ? 'Ed. Especial' : s.type}</p>}
            </div>
            {/* Quick navigation badges */}
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
              <QuickNavButton icon={Users} label="Alunos" count={getStudentsBySchool(s.id).length} onClick={() => openPanel(s, 'students')} color="#3b82f6" />
              <QuickNavButton icon={GraduationCap} label="Turmas" count={getClassesBySchool(s.id).length} onClick={() => openPanel(s, 'classes')} color="#8b5cf6" />
              <QuickNavButton icon={Bus} label="Rotas" count={getRoutesBySchool(s.id).length} onClick={() => openPanel(s, 'routes')} color="#f59e0b" />
            </div>
          </div>
        ))}
        {!filtered.length && !search && <div className="col-span-3 card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhuma escola cadastrada</p><button className="btn-primary" onClick={openNew}>Adicionar escola</button></div>}
        {!filtered.length && search && <div className="col-span-3 card text-center py-8"><p className="text-gray-500">Nenhum resultado para "{search}"</p></div>}
      </div>

      <ExportModal open={!!schExportModal} onClose={() => setSchExportModal(null)} onExport={doSchExport} title={schExportModal?'Exportar: '+schExportModal.title:undefined}/>

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
                const s = viewSchool;
                const rows = [{ nome: s.name||'--', tipo: s.type||'--', inep: s.code||'--', diretor: s.directorName||'--', telefone: s.phone||'--', email: s.email||'--', endereco: s.address||'--', manha: (s.morningStart||'--')+' - '+(s.morningEnd||'--'), tarde: (s.afternoonStart||'--')+' - '+(s.afternoonEnd||'--') }];
                const html = buildTableReportHTML('FICHA DA ESCOLA', rows, ['Nome','Tipo','INEP','Diretor(a)','Telefone','Email','Endereco','Manha','Tarde'], munReport, { orientation: 'landscape', signatories: selectedSigs });
                if (html) { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.print(); } }
              }} className="btn-secondary flex-1 flex items-center justify-center gap-1"><Printer size={14} /> Imprimir</button>
              <button onClick={() => {
                const s = viewSchool;
                const rows = [{ nome: s.name||'--', tipo: s.type||'--', inep: s.code||'--', diretor: s.directorName||'--', telefone: s.phone||'--', email: s.email||'--', endereco: s.address||'--', manha: (s.morningStart||'--')+' - '+(s.morningEnd||'--'), tarde: (s.afternoonStart||'--')+' - '+(s.afternoonEnd||'--') }];
                setViewSchool(null);
                setTimeout(() => { setSchExportModal({ title: 'Ficha da Escola', data: rows, cols: ['Nome','Tipo','INEP','Diretor(a)','Telefone','Email','Endereco','Manha','Tarde'], filename: 'Ficha_Escola_' + (s.name || '') }); }, 100);
              }} className="btn-secondary flex-1 flex items-center justify-center gap-1"><Download size={14} /> Exportar</button>
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
                      <div className="col-span-2">
                        <label className="label">Nome da escola * {munCityName && <span className="text-[10px] text-emerald-500 font-normal ml-1">(INEP ativo - digite para buscar)</span>}</label>
                        <SchoolINEPAutocomplete
                          value={form.name}
                          onChange={(v) => setForm((f: any) => ({ ...f, name: v }))}
                          onSelect={(s) => setForm((f: any) => ({ ...f, name: s.name, code: s.inepCode }))}
                          municipalityName={munCityName}
                          placeholder="Digite o nome da escola..."
                        />
                      </div>
                      <CNPJField
                        value={form.cnpj}
                        onChange={(v) => setForm((f: any) => ({ ...f, cnpj: v }))}
                        onDataLoaded={handleCNPJDataLoaded}
                        label="CNPJ"
                      />
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

      {/* Import from INEP modal */}
      {showImportINEP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2"><DatabaseZap size={18} className="text-emerald-500" /> Importar Escolas do INEP</h3>
              <button onClick={() => setShowImportINEP(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">Busque todas as escolas do seu município na base do INEP (Censo Escolar). Digite o <b>nome do município</b>.</p>
                <div className="flex gap-2">
                  <input className="input flex-1" value={inepCityCode} onChange={e => setInepCityCode(e.target.value)} placeholder="Nome do município (ex: Fátima)" onKeyDown={e => e.key === 'Enter' && handleSearchSchoolsByCity()} />
                  <button onClick={handleSearchSchoolsByCity} disabled={inepLoading} className="btn-primary flex items-center gap-2 px-4">
                    {inepLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Buscar Escolas
                  </button>
                </div>
                <p className="text-xs text-blue-500 mt-2">Base de dados: Catálogo de Escolas INEP/MEC - Censo Escolar (1.588 escolas do Tocantins)</p>
              </div>

              {inepMsg && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${inepMsg.includes('Erro') || inepMsg.includes('Nenhuma') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                  {inepMsg.includes('Erro') ? <AlertTriangle size={16} /> : <CheckCircle size={16} />} {inepMsg}
                </div>
              )}

              {inepResults.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <button onClick={selectAllInep} className="text-sm text-accent-600 hover:underline">
                      {inepSelected.size === inepResults.filter(r => !r.alreadyExists).length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                    <span className="text-sm text-gray-500">{inepSelected.size} selecionada(s)</span>
                  </div>
                  <div className="border rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="w-10 px-3 py-2"></th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Codigo INEP</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Nome da Escola</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Ano</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {inepResults.map(r => (
                          <tr key={r.inepCode} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${r.alreadyExists ? 'opacity-50' : ''}`}>
                            <td className="px-3 py-2 text-center">
                              {r.alreadyExists ? (
                                <CheckCircle size={16} className="text-green-500 mx-auto" />
                              ) : (
                                <input type="checkbox" checked={inepSelected.has(r.inepCode)} onChange={() => toggleInepSelect(r.inepCode)} className="rounded" />
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.inepCode}</td>
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{r.name}</td>
                            <td className="px-3 py-2 text-center text-gray-500">{r.year || '--'}</td>
                            <td className="px-3 py-2 text-center">
                              {r.alreadyExists ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ja cadastrada</span>
                              ) : (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Nova</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowImportINEP(false)} className="btn-secondary flex-1">Fechar</button>
              {inepResults.length > 0 && (
                <button onClick={importSelectedSchools} disabled={inepLoading || inepSelected.size === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {inepLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Importar {inepSelected.size} Escola(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cross-navigation panel */}
      <CrossNavPanel
        open={!!panelSchool && !!panelType}
        onClose={() => { setPanelSchool(null); setPanelType(null); }}
        title={panelType === 'students' ? `Alunos - ${panelSchool?.name || ''}` : panelType === 'classes' ? `Turmas - ${panelSchool?.name || ''}` : `Rotas - ${panelSchool?.name || ''}`}
        icon={panelType === 'students' ? Users : panelType === 'classes' ? GraduationCap : Bus}
      >
        {panelSchool && panelType === 'students' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{getStudentsBySchool(panelSchool.id).length} aluno(s)</span>
              <QuickActionButton icon={Users} label="Ver todos" to="/alunos" />
            </div>
            <div className="space-y-1">
              {getStudentsBySchool(panelSchool.id).map((s: any) => (
                <StudentMiniCard key={s.id} student={s} />
              ))}
              {getStudentsBySchool(panelSchool.id).length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhum aluno nesta escola</p>}
            </div>
          </div>
        )}
        {panelSchool && panelType === 'classes' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{getClassesBySchool(panelSchool.id).length} turma(s)</span>
              <QuickActionButton icon={GraduationCap} label="Ver turmas" to="/turmas" />
            </div>
            <div className="space-y-1">
              {getClassesBySchool(panelSchool.id).map((c: any) => (
                <ClassMiniCard key={c.id} cls={c} />
              ))}
              {getClassesBySchool(panelSchool.id).length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhuma turma nesta escola</p>}
            </div>
          </div>
        )}
        {panelSchool && panelType === 'routes' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{getRoutesBySchool(panelSchool.id).length} rota(s)</span>
              <QuickActionButton icon={Bus} label="Ver rotas" to="/rotas" />
            </div>
            <div className="space-y-1">
              {getRoutesBySchool(panelSchool.id).map((r: any) => {
                const rt = r.route || r;
                return (
                  <div key={rt.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{rt.name}</p>
                    <p className="text-xs text-gray-500">{rt.code ? 'Código: ' + rt.code : ''}</p>
                  </div>
                );
              })}
              {getRoutesBySchool(panelSchool.id).length === 0 && <p className="text-sm text-gray-400 text-center py-6">Nenhuma rota para esta escola</p>}
            </div>
          </div>
        )}
      </CrossNavPanel>
    </div>
  );
}
