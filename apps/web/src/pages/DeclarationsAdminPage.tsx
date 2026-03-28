import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { FileText, Plus, Pencil, Search, CheckCircle, Clock, X, Loader2, Eye, Code, Zap, Lock } from 'lucide-react';

const DEFAULT_TEMPLATES: Record<string, string> = {
  'Declaração de Matrícula': '<p>Declaramos, para os devidos fins, que <strong>{aluno}</strong>, portador(a) do CPF nº <strong>{cpf}</strong>, nascido(a) em <strong>{nascimento}</strong>, encontra-se devidamente matriculado(a) nesta unidade escolar, sob o nº de matrícula <strong>{matricula}</strong>, cursando o <strong>{serie}</strong>, turma <strong>{turma}</strong>, no turno <strong>{turno}</strong>, no ano letivo de <strong>{ano_letivo}</strong>.</p><p>Declaramos, ainda, que o(a) referido(a) aluno(a) frequenta regularmente as aulas.</p><p>Por ser verdade, firmamos a presente declaração.</p>',
  'Declaração de Frequência': '<p>Declaramos, para os devidos fins, que <strong>{aluno}</strong>, matriculado(a) sob o nº <strong>{matricula}</strong>, no <strong>{serie}</strong>, turma <strong>{turma}</strong>, turno <strong>{turno}</strong>, é aluno(a) regularmente frequente nesta unidade escolar no ano letivo de <strong>{ano_letivo}</strong>.</p><p>Por ser verdade, firmamos a presente declaração.</p>',
  'Declaração de Transferência': '<p>Declaramos, para os devidos fins, que <strong>{aluno}</strong>, portador(a) do CPF nº <strong>{cpf}</strong>, RG nº <strong>{rg}</strong>, nascido(a) em <strong>{nascimento}</strong>, esteve matriculado(a) nesta unidade escolar sob o nº <strong>{matricula}</strong>, no <strong>{serie}</strong>, turma <strong>{turma}</strong>, turno <strong>{turno}</strong>, no ano letivo de <strong>{ano_letivo}</strong>, sendo transferido(a) a pedido do responsável.</p><p>Nada mais havendo a declarar, firmamos a presente.</p>',
  'Atestado de Escolaridade': '<p>Atestamos, para os devidos fins, que <strong>{aluno}</strong>, portador(a) do CPF nº <strong>{cpf}</strong>, nascido(a) em <strong>{nascimento}</strong>, é aluno(a) desta unidade escolar, estando matriculado(a) no <strong>{serie}</strong>, turma <strong>{turma}</strong>, turno <strong>{turno}</strong>, no ano letivo de <strong>{ano_letivo}</strong>.</p><p>O presente atestado é expedido para fins de comprovação escolar.</p>',
  'Declaração de Transporte Escolar': '<p>Declaramos, para os devidos fins, que <strong>{aluno}</strong>, matriculado(a) sob o nº <strong>{matricula}</strong>, no <strong>{serie}</strong>, turma <strong>{turma}</strong>, turno <strong>{turno}</strong>, da <strong>{escola}</strong>, residente no endereço <strong>{endereco}</strong>, utiliza o transporte escolar oferecido pelo Município de <strong>{municipio}</strong> no ano letivo de <strong>{ano_letivo}</strong>.</p><p>Por ser verdade, firmamos a presente declaração.</p>',
};

export default function DeclarationsAdminPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState<'tipos' | 'solicitacoes'>('solicitacoes');
  const [types, setTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editType, setEditType] = useState<any>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', template: '', autoGenerate: false, signerName: '', signerRole: '', signerId: '' });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [respondModal, setRespondModal] = useState<any>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responding, setResponding] = useState(false);
  const [templateVars, setTemplateVars] = useState<any[]>([]);
  const [showVars, setShowVars] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState('');
  const templateRef = useRef<HTMLTextAreaElement>(null);

  function insertVar(v: string) {
    const ta = templateRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = typeForm.template.substring(0, start);
      const after = typeForm.template.substring(end);
      setTypeForm(f => ({ ...f, template: before + v + after }));
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + v.length; ta.focus(); }, 0);
    } else {
      setTypeForm(f => ({ ...f, template: f.template + v }));
    }
  }
  const [users_, setUsers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [mid]);

  async function loadData() {
    setLoading(true);
    try {
      const [t, r, vars] = await Promise.all([
        api.declarations.types({ municipalityId: mid }),
        api.declarations.listRequests({ municipalityId: mid }),
        api.declarations.templateVariables(),
      ]);
      setTypes(t || []);
      setRequests(r || []);
      setTemplateVars(vars || []);
      try { const u = await api.users.list({ municipalityId: mid }); setUsers(u || []); } catch {}
    } catch {}
    finally { setLoading(false); }
  }

  function openNewType(templateName?: string) {
    setEditType(null);
    const tpl = templateName && DEFAULT_TEMPLATES[templateName] ? DEFAULT_TEMPLATES[templateName] : '';
    setTypeForm({ name: templateName || '', description: '', template: tpl, autoGenerate: true, signerName: '', signerRole: '', signerId: '' });
    setShowTypeModal(true);
  }

  function openEditType(t: any) {
    setEditType(t);
    setTypeForm({ name: t.name, description: t.description || '', template: t.template || '', autoGenerate: t.autoGenerate || false, signerName: t.signerName || '', signerRole: t.signerRole || '', signerId: t.signerId ? String(t.signerId) : '' });
    setShowTypeModal(true);
  }

  async function saveType() {
    if (!typeForm.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...typeForm, signerId: typeForm.signerId ? parseInt(typeForm.signerId) : undefined };
      if (editType) {
        await api.declarations.updateType({ id: editType.id, ...payload });
      } else {
        await api.declarations.createType({ municipalityId: mid, ...payload });
      }
      setShowTypeModal(false);
      loadData();
    } catch {}
    finally { setSaving(false); }
  }

  async function toggleTypeActive(t: any) {
    await api.declarations.updateType({ id: t.id, isActive: !t.isActive });
    loadData();
  }

  async function respondRequest(status: 'processing' | 'ready' | 'rejected') {
    if (!respondModal) return;
    setResponding(true);
    try {
      await api.declarations.respond({ id: respondModal.id, status, responseNotes: responseNotes || undefined });
      setRespondModal(null);
      setResponseNotes('');
      loadData();
    } catch {}
    finally { setResponding(false); }
  }

  function previewTemplateHTML(template: string) {
    let preview = template
      .replace(/\{aluno\}/gi, 'JOÃO SILVA SANTOS')
      .replace(/\{nome\}/gi, 'JOÃO SILVA SANTOS')
      .replace(/\{matricula\}/gi, '2026001')
      .replace(/\{serie\}/gi, '5º Ano')
      .replace(/\{turma\}/gi, 'A')
      .replace(/\{turno\}/gi, 'Manhã')
      .replace(/\{escola\}/gi, 'Escola Municipal Exemplo')
      .replace(/\{cpf\}/gi, '123.456.789-00')
      .replace(/\{rg\}/gi, '1234567')
      .replace(/\{nascimento\}/gi, '15/03/2015')
      .replace(/\{endereco\}/gi, 'Rua Principal, 123')
      .replace(/\{cidade\}/gi, 'Fátima')
      .replace(/\{estado\}/gi, 'Tocantins')
      .replace(/\{municipio\}/gi, 'Fátima')
      .replace(/\{ano_letivo\}/gi, String(new Date().getFullYear()))
      .replace(/\{data_atual\}/gi, new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }))
      .replace(/\{data\}/gi, new Date().toLocaleDateString('pt-BR'))
      .replace(/\{assinante_nome\}/gi, typeForm.signerName || 'Nome do Assinante')
      .replace(/\{assinante_cargo\}/gi, typeForm.signerRole || 'Cargo');
    setPreviewTemplate(preview);
  }

  const statusLabel: any = { pending: 'Pendente', processing: 'Em Processamento', ready: 'Pronta', rejected: 'Recusada', cancelled: 'Cancelada' };
  const statusColor: any = { pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700', ready: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' };
  const filteredRequests = filterStatus ? requests.filter((r: any) => r.status === filterStatus) : requests;
  const adminUsers = users_.filter((u: any) => ['super_admin', 'municipal_admin', 'secretary', 'school_admin'].includes(u.role));

  if (loading) return <div className="p-6 flex justify-center"><Loader2 size={32} className="animate-spin text-gray-400" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><FileText size={20} className="text-gray-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Declarações e Documentos</h1>
            <p className="text-gray-500">{requests.length} solicitação(ões) • {types.length} tipo(s) configurado(s)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTab('solicitacoes')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'solicitacoes' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Solicitações {requests.filter(r => r.status === 'pending').length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>}
        </button>
        <button onClick={() => setTab('tipos')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'tipos' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Tipos e Templates
        </button>
      </div>

      {/* ====== TIPOS ====== */}
      {tab === 'tipos' && (
        <>
          {/* Modelos pré-definidos */}
          {types.length === 0 && (
            <div className="card mb-6 p-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Modelos Prontos</h3>
              <p className="text-sm text-gray-500 mb-3">Clique para criar com template pré-preenchido:</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(DEFAULT_TEMPLATES).map(name => (
                  <button key={name} onClick={() => openNewType(name)} className="text-sm px-3 py-2 rounded-lg border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors">
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{types.length} tipo(s)</p>
            <div className="flex gap-2">
              {types.length > 0 && Object.keys(DEFAULT_TEMPLATES).filter(n => !types.find((t: any) => t.name === n)).length > 0 && (
                <div className="relative group">
                  <button className="btn-secondary text-sm flex items-center gap-1"><Zap size={14} /> Modelo Pronto</button>
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border p-2 hidden group-hover:block z-10 w-64">
                    {Object.keys(DEFAULT_TEMPLATES).filter(n => !types.find((t: any) => t.name === n)).map(name => (
                      <button key={name} onClick={() => openNewType(name)} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-gray-50">{name}</button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => openNewType()} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14} /> Novo Tipo</button>
            </div>
          </div>

          <div className="grid gap-3">
            {types.map((t: any) => (
              <div key={t.id} className={`card ${!t.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.autoGenerate ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {t.autoGenerate ? <Zap size={18} className="text-green-600" /> : <FileText size={18} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      {t.autoGenerate && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Auto PDF</span>}
                    </div>
                    {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                    {t.signerName && <p className="text-[10px] text-gray-400 mt-1">Assinante: {t.signerName} - {t.signerRole}</p>}
                    {t.template && <p className="text-[10px] text-primary-500 mt-1">Template configurado ({t.template.length} caracteres)</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditType(t)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={14} className="text-gray-500" /></button>
                    <button onClick={() => toggleTypeActive(t)} className={`p-2 hover:bg-gray-100 rounded-lg ${t.isActive ? 'text-green-500' : 'text-red-500'}`}>
                      {t.isActive ? <CheckCircle size={14} /> : <X size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {types.length === 0 && <div className="card text-center py-12 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhum tipo cadastrado</p></div>}
          </div>
        </>
      )}

      {/* ====== SOLICITAÇÕES ====== */}
      {tab === 'solicitacoes' && (
        <>
          <div className="flex gap-3 mb-4">
            <select className="input w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="processing">Em Processamento</option>
              <option value="ready">Prontas</option>
              <option value="rejected">Recusadas</option>
            </select>
            <p className="text-sm text-gray-500 flex items-center">{filteredRequests.length} solicitação(ões)</p>
          </div>
          <div className="grid gap-3">
            {filteredRequests.map((r: any) => (
              <div key={r.id} className="card">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${r.status === 'pending' ? 'bg-amber-100' : r.status === 'ready' ? 'bg-green-100' : r.status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {r.status === 'pending' ? <Clock size={18} className="text-amber-600" /> : r.status === 'ready' ? <CheckCircle size={18} className="text-green-600" /> : r.status === 'rejected' ? <X size={18} className="text-red-600" /> : <Loader2 size={18} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800 text-sm">{r.typeName}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor[r.status]}`}>{statusLabel[r.status]}</span>
                    </div>
                    <p className="text-xs text-gray-600">Aluno: <strong>{r.studentName}</strong> {r.studentEnrollment ? '(Mat. ' + r.studentEnrollment + ')' : ''}</p>
                    <p className="text-xs text-gray-500">Solicitante: {r.requestedByName}</p>
                    <p className="text-xs text-gray-400">Código: <strong>{r.requestCode}</strong> • {r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    {r.notes && <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2">Obs: {r.notes}</p>}
                    {r.responseNotes && <p className="text-xs text-green-700 mt-1 bg-green-50 rounded p-2">Resposta: {r.responseNotes}</p>}
                  </div>
                  {(r.status === 'pending' || r.status === 'processing') && (
                    <button onClick={() => { setRespondModal(r); setResponseNotes(''); }} className="btn-primary text-xs px-3 py-1.5">Responder</button>
                  )}
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && <div className="card text-center py-12 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhuma solicitação</p></div>}
          </div>
        </>
      )}

      {/* Modal Tipo com Template */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editType ? 'Editar Tipo' : 'Novo Tipo de Declaração'}</h3>
              <button onClick={() => setShowTypeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Declaração de Matrícula" /></div>
                <div className="col-span-2"><label className="label">Descrição</label><input className="input" value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição" /></div>
              </div>

              {/* Auto-geração */}
              <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50">
                <input type="checkbox" id="autoGen" checked={typeForm.autoGenerate} onChange={e => setTypeForm(f => ({ ...f, autoGenerate: e.target.checked }))} className="w-4 h-4 rounded" />
                <label htmlFor="autoGen" className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Geração automática de PDF</p>
                  <p className="text-xs text-gray-500">Quando ativo, o pai recebe o documento na hora ao solicitar</p>
                </label>
                <Zap size={18} className={typeForm.autoGenerate ? 'text-green-500' : 'text-gray-300'} />
              </div>

              {/* Assinante */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Assinante responsável</label>
                  <select className="input" value={typeForm.signerId} onChange={e => {
                    const u = adminUsers.find((u: any) => String(u.id) === e.target.value);
                    setTypeForm(f => ({ ...f, signerId: e.target.value, signerName: u?.name || f.signerName, signerRole: u?.jobTitle || f.signerRole }));
                  }}>
                    <option value="">Selecione (opcional)</option>
                    {adminUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div><label className="label">Nome do assinante</label><input className="input" value={typeForm.signerName} onChange={e => setTypeForm(f => ({ ...f, signerName: e.target.value }))} /></div>
                <div className="col-span-2"><label className="label">Cargo do assinante</label><input className="input" value={typeForm.signerRole} onChange={e => setTypeForm(f => ({ ...f, signerRole: e.target.value }))} placeholder="Ex: Secretário(a) de Educação" /></div>
              </div>

              {/* Template */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label flex items-center gap-1"><Code size={12} /> Modelo do documento (HTML)</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowVars(!showVars)} className="text-[10px] text-primary-600 hover:underline">{showVars ? 'Ocultar variáveis' : 'Ver variáveis'}</button>
                    {typeForm.template && <button type="button" onClick={() => previewTemplateHTML(typeForm.template)} className="text-[10px] text-accent-600 hover:underline flex items-center gap-1"><Eye size={10} /> Pré-visualizar</button>}
                  </div>
                </div>
                {showVars && (
                  <div className="mb-2 p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                    <p className="font-semibold text-blue-700 mb-1">Variáveis disponíveis (clique para inserir):</p>
                    <div className="flex flex-wrap gap-1">
                      {templateVars.map((v: any) => (
                        <button key={v.var} type="button" onClick={() => insertVar(v.var)}
                          className="px-2 py-0.5 bg-white border border-blue-200 rounded text-blue-700 hover:bg-blue-100" title={v.desc}>
                          {v.var}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <textarea ref={templateRef} className="input font-mono text-xs" rows={8} value={typeForm.template} onChange={e => setTypeForm(f => ({ ...f, template: e.target.value }))}
                  placeholder="<p>Declaramos que {aluno}, matrícula {matricula}, está matriculado no {serie}...</p>" />
              </div>

              {/* Preview */}
              {previewTemplate && (
                <div className="border rounded-xl p-4 bg-white">
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Pré-visualização</p>
                  <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: previewTemplate }} />
                  <button onClick={() => setPreviewTemplate('')} className="text-xs text-gray-400 mt-2 hover:underline">Fechar preview</button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowTypeModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveType} disabled={saving || !typeForm.name.trim()} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Salvando...' : editType ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Responder */}
      {respondModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold">Responder Solicitação</h3>
              <p className="text-sm text-gray-500">{respondModal.typeName} — {respondModal.studentName}</p>
              <p className="text-xs text-gray-400">Código: {respondModal.requestCode}</p>
            </div>
            <div className="p-5 space-y-4">
              {respondModal.notes && <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">Observação do solicitante: {respondModal.notes}</div>}
              <div><label className="label">Resposta / Observações</label><textarea className="input" rows={3} value={responseNotes} onChange={e => setResponseNotes(e.target.value)} placeholder="Informações sobre a declaração..." /></div>
              <div className="flex gap-2">
                <button onClick={() => setRespondModal(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button onClick={() => respondRequest('processing')} disabled={responding} className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50">Em Processamento</button>
                <button onClick={() => respondRequest('ready')} disabled={responding} className="flex-1 py-2 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 disabled:opacity-50">Pronta</button>
                <button onClick={() => respondRequest('rejected')} disabled={responding} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 disabled:opacity-50">Recusar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
