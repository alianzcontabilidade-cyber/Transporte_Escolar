import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { FileText, Plus, Pencil, Trash2, Search, CheckCircle, Clock, X, MessageCircle, Loader2, ChevronDown } from 'lucide-react';

export default function DeclarationsAdminPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState<'tipos' | 'solicitacoes'>('solicitacoes');
  const [types, setTypes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editType, setEditType] = useState<any>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', template: '', autoGenerate: false, signerName: '', signerRole: '' });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [respondModal, setRespondModal] = useState<any>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => { loadData(); }, [mid]);

  async function loadData() {
    setLoading(true);
    try {
      const [t, r] = await Promise.all([
        api.declarations.types({ municipalityId: mid }),
        api.declarations.listRequests({ municipalityId: mid }),
      ]);
      setTypes(t || []);
      setRequests(r || []);
    } catch {}
    finally { setLoading(false); }
  }

  function openNewType() {
    setEditType(null);
    setTypeForm({ name: '', description: '', template: '', autoGenerate: false, signerName: '', signerRole: '' });
    setShowTypeModal(true);
  }

  function openEditType(t: any) {
    setEditType(t);
    setTypeForm({ name: t.name, description: t.description || '', template: t.template || '', autoGenerate: t.autoGenerate || false, signerName: t.signerName || '', signerRole: t.signerRole || '' });
    setShowTypeModal(true);
  }

  async function saveType() {
    if (!typeForm.name.trim()) return;
    setSaving(true);
    try {
      if (editType) {
        await api.declarations.updateType({ id: editType.id, ...typeForm });
      } else {
        await api.declarations.createType({ municipalityId: mid, ...typeForm });
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

  const statusLabel: any = { pending: 'Pendente', processing: 'Em Processamento', ready: 'Pronta', rejected: 'Recusada', cancelled: 'Cancelada' };
  const statusColor: any = { pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700', ready: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' };
  const filteredRequests = filterStatus ? requests.filter((r: any) => r.status === filterStatus) : requests;

  if (loading) return <div className="p-6 flex justify-center"><Loader2 size={32} className="animate-spin text-gray-400" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><FileText size={20} className="text-gray-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Declarações</h1>
            <p className="text-gray-500">{requests.length} solicitação(ões) • {types.length} tipo(s)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setTab('solicitacoes')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'solicitacoes' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Solicitações {requests.filter(r => r.status === 'pending').length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.filter(r => r.status === 'pending').length}</span>}
        </button>
        <button onClick={() => setTab('tipos')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === 'tipos' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Tipos de Declaração
        </button>
      </div>

      {/* ====== TIPOS ====== */}
      {tab === 'tipos' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openNewType} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14} /> Novo Tipo</button>
          </div>
          <div className="grid gap-3">
            {types.map((t: any) => (
              <div key={t.id} className={`card flex items-center gap-4 ${!t.isActive ? 'opacity-50' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{t.name}</p>
                  {t.description && <p className="text-xs text-gray-500 truncate">{t.description}</p>}
                  {t.signerName && <p className="text-[10px] text-gray-400">Assinante: {t.signerName} - {t.signerRole}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditType(t)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil size={14} className="text-gray-500" /></button>
                  <button onClick={() => toggleTypeActive(t)} className={`p-2 hover:bg-gray-100 rounded-lg ${t.isActive ? 'text-green-500' : 'text-red-500'}`}>
                    {t.isActive ? <CheckCircle size={14} /> : <X size={14} />}
                  </button>
                </div>
              </div>
            ))}
            {types.length === 0 && <div className="card text-center py-12 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhum tipo cadastrado</p><p className="text-xs mt-1">Cadastre tipos como: Declaração de Matrícula, Frequência, Transferência</p></div>}
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.status === 'pending' ? 'bg-amber-100' : r.status === 'ready' ? 'bg-green-100' : r.status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {r.status === 'pending' ? <Clock size={18} className="text-amber-600" /> :
                     r.status === 'ready' ? <CheckCircle size={18} className="text-green-600" /> :
                     r.status === 'rejected' ? <X size={18} className="text-red-600" /> :
                     <Loader2 size={18} className="text-blue-600" />}
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
                  {r.status === 'pending' && (
                    <button onClick={() => { setRespondModal(r); setResponseNotes(''); }} className="btn-primary text-xs px-3 py-1.5">Responder</button>
                  )}
                  {r.status === 'processing' && (
                    <button onClick={() => { setRespondModal(r); setResponseNotes(''); }} className="btn-secondary text-xs px-3 py-1.5">Atualizar</button>
                  )}
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && <div className="card text-center py-12 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-50" /><p>Nenhuma solicitação {filterStatus ? 'com este status' : ''}</p></div>}
          </div>
        </>
      )}

      {/* Modal Tipo */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-5 border-b"><h3 className="text-lg font-semibold">{editType ? 'Editar Tipo' : 'Novo Tipo de Declaração'}</h3></div>
            <div className="p-5 space-y-4">
              <div><label className="label">Nome *</label><input className="input" value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Declaração de Matrícula" /></div>
              <div><label className="label">Descrição</label><input className="input" value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição" /></div>
              <div><label className="label">Nome do Assinante</label><input className="input" value={typeForm.signerName} onChange={e => setTypeForm(f => ({ ...f, signerName: e.target.value }))} placeholder="Ex: Maria Silva" /></div>
              <div><label className="label">Cargo do Assinante</label><input className="input" value={typeForm.signerRole} onChange={e => setTypeForm(f => ({ ...f, signerRole: e.target.value }))} placeholder="Ex: Secretária de Educação" /></div>
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
                <button onClick={() => respondRequest('processing')} disabled={responding} className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 disabled:opacity-50">
                  {responding ? '...' : 'Em Processamento'}
                </button>
                <button onClick={() => respondRequest('ready')} disabled={responding} className="flex-1 py-2 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 disabled:opacity-50">
                  {responding ? '...' : 'Pronta'}
                </button>
                <button onClick={() => respondRequest('rejected')} disabled={responding} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 disabled:opacity-50">
                  {responding ? '...' : 'Recusar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
