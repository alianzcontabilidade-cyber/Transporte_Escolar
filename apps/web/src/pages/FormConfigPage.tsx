import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Settings, Save, ToggleLeft, ToggleRight, CheckCircle, AlertCircle, FileText, Plus, Pencil, X, Loader2, Zap, Eye, Code, Users } from 'lucide-react';

// ============ CAMPOS OBRIGATÓRIOS (existente) ============
const FORM_TYPES = [
  { key: 'student', label: 'Aluno' },
  { key: 'school', label: 'Escola' },
  { key: 'driver', label: 'Motorista' },
  { key: 'vehicle', label: 'Veículo' },
  { key: 'route', label: 'Rota' },
  { key: 'teacher', label: 'Professor' },
];

const FIELD_LABELS: Record<string, Record<string, string>> = {
  student: { name:'Nome', cpf:'CPF', rg:'RG', sex:'Sexo', race:'Raça/Cor', birthDate:'Data de Nascimento', nationality:'Nacionalidade', naturalness:'Naturalidade', nis:'NIS', cartaoSus:'Cartão SUS', certidaoNumero:'Número da Certidão', address:'Endereço', cep:'CEP', neighborhood:'Bairro', city:'Cidade', state:'Estado', phone:'Telefone', fatherName:'Nome do Pai', fatherCpf:'CPF do Pai', motherName:'Nome da Mãe', motherCpf:'CPF da Mãe', bloodType:'Tipo Sanguíneo' },
  school: { name:'Nome', code:'Código INEP', type:'Tipo', cnpj:'CNPJ', address:'Endereço', phone:'Telefone', email:'E-mail', directorName:'Nome do Diretor' },
  driver: { name:'Nome', cpf:'CPF', phone:'Telefone', cnhNumber:'Número da CNH', cnhCategory:'Categoria da CNH', cnhExpiry:'Validade da CNH' },
  vehicle: { plate:'Placa', model:'Modelo', year:'Ano', capacity:'Capacidade', type:'Tipo' },
  route: { name:'Nome', code:'Código' },
  teacher: { name:'Nome', email:'E-mail', phone:'Telefone' },
};

// ============ DOCUMENTOS POR MÓDULO ============
const MODULES = [
  { key: 'gestao_escolar', label: 'Gestão Escolar' },
  { key: 'transporte', label: 'Transporte' },
];

// Relatórios do sistema que podem ser disponibilizados para o pai
// generatorKey mapeia para a função em reportGenerators.ts
const SYSTEM_REPORTS: { key: string; name: string; module: string; generatorKey: string; needsGrades?: boolean; needsHistory?: boolean; needsFrequency?: boolean }[] = [
  { key: 'decl_escolaridade', name: 'Declaração de Escolaridade', module: 'gestao_escolar', generatorKey: 'declaracaoEscolaridade' },
  { key: 'decl_frequencia', name: 'Declaração de Frequência', module: 'gestao_escolar', generatorKey: 'declaracaoFrequencia', needsFrequency: true },
  { key: 'decl_transferencia', name: 'Declaração de Transferência', module: 'gestao_escolar', generatorKey: 'declaracaoTransferencia' },
  { key: 'ficha_matricula', name: 'Ficha de Matrícula', module: 'gestao_escolar', generatorKey: 'fichaMatricula' },
  { key: 'boletim', name: 'Boletim Escolar', module: 'gestao_escolar', generatorKey: 'boletim', needsGrades: true },
  { key: 'historico', name: 'Histórico Escolar', module: 'gestao_escolar', generatorKey: 'historico', needsHistory: true },
  { key: 'decl_transporte', name: 'Declaração de Transporte Escolar', module: 'transporte', generatorKey: 'declaracaoTransporte' },
];

type FieldState = Record<string, boolean>;
type MainTab = 'documentos' | 'campos';

export default function FormConfigPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;

  // Main tab
  const [mainTab, setMainTab] = useState<MainTab>('documentos');

  // === Campos obrigatórios ===
  const [activeFormTab, setActiveFormTab] = useState('student');
  const [configs, setConfigs] = useState<Record<string, FieldState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // === Documentos ===
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState('gestao_escolar');
  const [showDocModal, setShowDocModal] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [docForm, setDocForm] = useState<any>({ name: '', description: '', template: '', autoGenerate: false, availableToParents: false, systemAutoSign: false, signerName: '', signerRole: '', signerId: '', module: 'gestao_escolar', documentKey: '' });
  const [docSaving, setDocSaving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [templateVars, setTemplateVars] = useState<any[]>([]);
  const [showVars, setShowVars] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => { loadAll(); }, [mid]);

  async function loadAll() {
    if (!mid) return;
    setLoading(true);
    try {
      const [cfgData, dtData, vars] = await Promise.all([
        api.formConfig.list({ municipalityId: mid }),
        api.declarations.listAll({ municipalityId: mid }),
        api.declarations.templateVariables(),
      ]);
      // Campos obrigatórios
      const grouped: Record<string, FieldState> = {};
      for (const ft of FORM_TYPES) { grouped[ft.key] = {}; for (const fn of Object.keys(FIELD_LABELS[ft.key])) grouped[ft.key][fn] = false; }
      for (const item of (cfgData as any[]) || []) { if (grouped[item.formType]) grouped[item.formType][item.fieldName] = item.isRequired; }
      setConfigs(grouped);
      // Documentos
      setDocTypes(dtData || []);
      setTemplateVars(vars || []);
      try { const u = await api.users.list({ municipalityId: mid }); setAdminUsers((u || []).filter((u: any) => ['super_admin', 'municipal_admin', 'secretary', 'school_admin'].includes(u.role))); } catch {}
    } catch {}
    finally { setLoading(false); }
  }

  // === Campos obrigatórios ===
  function toggleField(ft: string, fn: string) { setConfigs(p => ({ ...p, [ft]: { ...p[ft], [fn]: !p[ft]?.[fn] } })); }
  function toggleAll(ft: string, v: boolean) { const ns: FieldState = {}; for (const fn of Object.keys(FIELD_LABELS[ft])) ns[fn] = v; setConfigs(p => ({ ...p, [ft]: ns })); }
  async function saveFields() {
    if (!mid) return; setSaving(true); setMessage(null);
    try {
      const ft = activeFormTab; const fs = configs[ft] || {};
      await api.formConfig.save({ municipalityId: mid, formType: ft, fields: Object.entries(fs).map(([fn, r]) => ({ fieldName: fn, isRequired: r })) });
      setMessage({ type: 'success', text: 'Salvo!' }); setTimeout(() => setMessage(null), 3000);
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); } finally { setSaving(false); }
  }

  // === Documentos ===
  const moduleDocTypes = docTypes.filter(d => (d.module || 'gestao_escolar') === activeModule);

  function openNewDoc(key?: string) {
    const sysReport = key ? SYSTEM_REPORTS.find(r => r.key === key) : null;
    setEditDoc(null);
    setDocForm({ name: sysReport?.name || '', description: '', template: '', autoGenerate: true, availableToParents: true, systemAutoSign: true, signerName: '', signerRole: '', signerId: '', module: sysReport?.module || activeModule, documentKey: key || '', generatorKey: sysReport?.generatorKey || '' });
    setShowDocModal(true);
  }

  function openEditDoc(d: any) {
    setEditDoc(d);
    setDocForm({ name: d.name, description: d.description || '', template: d.template || '', autoGenerate: d.autoGenerate || false, availableToParents: d.availableToParents || false, systemAutoSign: d.systemAutoSign || false, signerName: d.signerName || '', signerRole: d.signerRole || '', signerId: d.signerId ? String(d.signerId) : '', module: d.module || 'gestao_escolar', documentKey: d.documentKey || '' });
    setShowDocModal(true);
  }

  async function saveDoc() {
    if (!docForm.name.trim()) return; setDocSaving(true);
    try {
      const payload = { ...docForm, signerId: docForm.signerId ? parseInt(docForm.signerId) : undefined };
      if (editDoc) await api.declarations.updateType({ id: editDoc.id, ...payload });
      else await api.declarations.createType({ municipalityId: mid, ...payload });
      setShowDocModal(false); loadAll();
    } catch {} finally { setDocSaving(false); }
  }

  async function toggleDocField(id: number, field: string, value: boolean) {
    await api.declarations.updateType({ id, [field]: value });
    loadAll();
  }

  function preview(tpl: string) {
    setPreviewHtml(tpl.replace(/\{aluno\}/gi, 'JOÃO SILVA').replace(/\{matricula\}/gi, '2026001').replace(/\{serie\}/gi, '5º Ano').replace(/\{turma\}/gi, 'A').replace(/\{turno\}/gi, 'Manhã').replace(/\{escola\}/gi, 'Escola Exemplo').replace(/\{cpf\}/gi, '123.456.789-00').replace(/\{nascimento\}/gi, '15/03/2015').replace(/\{endereco\}/gi, 'Rua Principal, 123').replace(/\{municipio\}/gi, 'Fátima').replace(/\{ano_letivo\}/gi, String(new Date().getFullYear())).replace(/\{data_atual\}/gi, new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })).replace(/\{data\}/gi, new Date().toLocaleDateString('pt-BR')).replace(/\{assinante_nome\}/gi, docForm.signerName || 'Assinante').replace(/\{assinante_cargo\}/gi, docForm.signerRole || 'Cargo'));
  }

  // Relatórios do sistema não cadastrados ainda
  const missingReports = SYSTEM_REPORTS.filter(r => r.module === activeModule && !docTypes.find((d: any) => d.documentKey === r.key));

  const curFields = FIELD_LABELS[activeFormTab] || {};
  const curState = configs[activeFormTab] || {};
  const reqCount = Object.values(curState).filter(Boolean).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-gray-400" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center"><Settings size={20} className="text-white" /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Configurações de Formulários e Documentos</h1>
          <p className="text-sm text-gray-500">Campos obrigatórios e documentos disponíveis para os pais</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {message.text}
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        <button onClick={() => setMainTab('documentos')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mainTab === 'documentos' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <FileText size={16} /> Documentos para Pais
        </button>
        <button onClick={() => setMainTab('campos')} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mainTab === 'campos' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <Settings size={16} /> Campos Obrigatórios
        </button>
      </div>

      {/* ==================== DOCUMENTOS PARA PAIS ==================== */}
      {mainTab === 'documentos' && (
        <>
          {/* Module tabs */}
          <div className="flex gap-2 mb-4">
            {MODULES.map(m => (
              <button key={m.key} onClick={() => setActiveModule(m.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeModule === m.key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m.label}</button>
            ))}
          </div>

          {/* Relatórios do sistema não cadastrados */}
          {missingReports.length > 0 && (
            <div className="card mb-4 p-4">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1"><Zap size={14} className="text-amber-500" /> Relatórios disponíveis para ativar:</p>
              <div className="flex flex-wrap gap-2">
                {missingReports.map(r => (
                  <button key={r.key} onClick={() => openNewDoc(r.key)} className="text-xs px-3 py-1.5 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100">{r.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* Document cards */}
          <div className="space-y-3">
            {moduleDocTypes.map(d => (
              <div key={d.id} className={`card ${!d.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.systemAutoSign ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {d.systemAutoSign ? <Zap size={18} className="text-green-600" /> : <FileText size={18} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                    {d.description && <p className="text-xs text-gray-500">{d.description}</p>}
                    {d.signerName && <p className="text-[10px] text-gray-400 mt-0.5">Assinante: {d.signerName} - {d.signerRole}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={d.availableToParents || false} onChange={e => toggleDocField(d.id, 'availableToParents', e.target.checked)} className="w-3.5 h-3.5 rounded" />
                        <span className="text-gray-600">Disponível para pais</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={d.autoGenerate || false} onChange={e => toggleDocField(d.id, 'autoGenerate', e.target.checked)} className="w-3.5 h-3.5 rounded" />
                        <span className="text-gray-600">Auto PDF</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={d.systemAutoSign || false} onChange={e => toggleDocField(d.id, 'systemAutoSign', e.target.checked)} className="w-3.5 h-3.5 rounded" />
                        <span className="text-gray-600">Assinatura automática</span>
                      </label>
                    </div>
                  </div>
                  <button onClick={() => openEditDoc(d)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={14} className="text-gray-500" /></button>
                </div>
              </div>
            ))}
            {moduleDocTypes.length === 0 && <div className="card text-center py-12 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhum documento configurado neste módulo</p></div>}
          </div>

          <button onClick={() => openNewDoc()} className="btn-secondary flex items-center gap-2 mt-4 text-sm"><Plus size={14} /> Novo Documento</button>
        </>
      )}

      {/* ==================== CAMPOS OBRIGATÓRIOS ==================== */}
      {mainTab === 'campos' && (
        <>
          <div className="flex flex-wrap gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {FORM_TYPES.map(ft => (
              <button key={ft.key} onClick={() => setActiveFormTab(ft.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFormTab === ft.key ? 'bg-white dark:bg-gray-700 text-gray-900 shadow-sm' : 'text-gray-500'}`}>{ft.label}</button>
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500"><span className="font-semibold text-accent-500">{reqCount}</span> de {Object.keys(curFields).length} obrigatórios</p>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(activeFormTab, true)} className="text-xs px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-500 font-medium">Marcar Todos</button>
              <button onClick={() => toggleAll(activeFormTab, false)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-medium">Desmarcar</button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            {Object.entries(curFields).map(([fn, label]) => {
              const req = curState[fn] || false;
              return (
                <div key={fn} className={`flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${req ? 'bg-accent-500/5' : ''}`} onClick={() => toggleField(activeFormTab, fn)}>
                  <div className="flex items-center gap-3"><span className="text-sm font-medium text-gray-700">{label}</span><span className="text-xs text-gray-400 font-mono">{fn}</span></div>
                  {req ? <ToggleRight size={28} className="text-accent-500" /> : <ToggleLeft size={28} className="text-gray-300" />}
                </div>
              );
            })}
          </div>
          <button onClick={saveFields} disabled={saving} className="btn-primary flex items-center gap-2 mt-4"><Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}</button>
        </>
      )}

      {/* ==================== MODAL DOCUMENTO ==================== */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editDoc ? 'Editar Documento' : 'Novo Documento'}</h3>
              <button onClick={() => { setShowDocModal(false); setPreviewHtml(''); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={docForm.name} onChange={e => setDocForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                <div className="col-span-2"><label className="label">Descrição</label><input className="input" value={docForm.description} onChange={e => setDocForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'availableToParents', label: 'Disponível para pais', desc: 'Aparece no portal do responsável' },
                  { key: 'autoGenerate', label: 'Auto PDF', desc: 'Gera PDF automaticamente' },
                  { key: 'systemAutoSign', label: 'Assinatura automática', desc: 'Assina sem pedir senha' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-start gap-2 p-3 rounded-xl border bg-gray-50 cursor-pointer hover:bg-gray-100">
                    <input type="checkbox" checked={docForm[opt.key]} onChange={e => setDocForm((f: any) => ({ ...f, [opt.key]: e.target.checked }))} className="w-4 h-4 rounded mt-0.5" />
                    <div><p className="text-xs font-medium text-gray-700">{opt.label}</p><p className="text-[10px] text-gray-400">{opt.desc}</p></div>
                  </label>
                ))}
              </div>

              {/* Assinante */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Quem assina</label>
                  <select className="input" value={docForm.signerId} onChange={e => { const u = adminUsers.find((u: any) => String(u.id) === e.target.value); setDocForm((f: any) => ({ ...f, signerId: e.target.value, signerName: u?.name || f.signerName, signerRole: u?.jobTitle || f.signerRole })); }}>
                    <option value="">Selecione</option>
                    {adminUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || u.role})</option>)}
                  </select>
                </div>
                <div><label className="label">Nome do assinante</label><input className="input" value={docForm.signerName} onChange={e => setDocForm((f: any) => ({ ...f, signerName: e.target.value }))} /></div>
                <div className="col-span-2"><label className="label">Cargo do assinante</label><input className="input" value={docForm.signerRole} onChange={e => setDocForm((f: any) => ({ ...f, signerRole: e.target.value }))} placeholder="Ex: Secretário(a) de Educação" /></div>
              </div>

              {/* Template */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label flex items-center gap-1"><Code size={12} /> Modelo do documento</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowVars(!showVars)} className="text-[10px] text-primary-600 hover:underline">{showVars ? 'Ocultar' : 'Variáveis'}</button>
                    {docForm.template && <button type="button" onClick={() => preview(docForm.template)} className="text-[10px] text-accent-600 hover:underline flex items-center gap-1"><Eye size={10} /> Preview</button>}
                  </div>
                </div>
                {showVars && (
                  <div className="mb-2 p-2 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {templateVars.map((v: any) => (
                        <button key={v.var} type="button" onClick={() => setDocForm((f: any) => ({ ...f, template: f.template + v.var }))} className="px-2 py-0.5 bg-white border border-blue-200 rounded text-blue-700 hover:bg-blue-100" title={v.desc}>{v.var}</button>
                      ))}
                    </div>
                  </div>
                )}
                <textarea className="input font-mono text-xs" rows={6} value={docForm.template} onChange={e => setDocForm((f: any) => ({ ...f, template: e.target.value }))} placeholder="<p>Declaramos que {aluno}...</p>" />
              </div>

              {previewHtml && (
                <div className="border rounded-xl p-4 bg-white">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Pré-visualização</p>
                  <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  <button onClick={() => setPreviewHtml('')} className="text-xs text-gray-400 mt-2 hover:underline">Fechar</button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowDocModal(false); setPreviewHtml(''); }} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveDoc} disabled={docSaving || !docForm.name.trim()} className="btn-primary flex-1 disabled:opacity-50">{docSaving ? 'Salvando...' : editDoc ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
