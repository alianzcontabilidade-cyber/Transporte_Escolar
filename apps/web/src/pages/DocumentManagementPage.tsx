import { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, ChevronDown, ChevronUp, Shield, Lock,
  XCircle, CheckCircle, Clock, Eye, Loader2, AlertTriangle, Copy,
  Check, Download, Hash, Calendar, User, FileCheck
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useQuery, useMutation } from '../lib/hooks';
import SignatureModal from '../components/SignatureModal';
import ExportModal, { handleExport, ExportFormat } from '../components/ExportModal';
import { loadMunicipalityData, generateReportHTML } from '../lib/reportTemplate';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  revoked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};
const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  revoked: 'Revogado',
  pending: 'Pendente',
};

const TYPE_LABELS: Record<string, string> = {
  report: 'Relatório',
  certificate: 'Certidao',
  declaration: 'Declaracao',
  report_card: 'Boletim',
  enrollment: 'Matricula',
  attendance: 'Frequência',
  other: 'Outro',
};

export default function DocumentManagementPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId;

  // State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Signature modal
  const [signModal, setSignModal] = useState<{ documentId: number; title: string; code?: string } | null>(null);

  // Revoke modal
  const [revokeModal, setRevokeModal] = useState<{ id: number; title: string } | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Export
  const [exportModal, setExportModal] = useState(false);
  const [munReport, setMunReport] = useState<any>(null);

  // Signatures cache per document
  const [signaturesMap, setSignaturesMap] = useState<Record<number, any[]>>({});

  // Load municipality data for reports
  useEffect(() => {
    if (municipalityId) loadMunicipalityData(municipalityId, api).then(setMunReport).catch(() => {});
  }, [municipalityId]);

  // Load documents
  const { data: documents, loading, refetch } = useQuery(
    () => api.documents.list({ municipalityId }),
    [municipalityId]
  );

  // Revoke mutation
  const { mutate: revokeDoc, loading: revoking } = useMutation((input: any) =>
    api.documents.revoke(input)
  );

  // Load signatures for expanded document
  const loadSignatures = async (docId: number) => {
    if (signaturesMap[docId]) return;
    try {
      const sigs = await api.documentSignatures.listByDocument({ documentId: docId });
      setSignaturesMap(prev => ({ ...prev, [docId]: Array.isArray(sigs) ? sigs : [] }));
    } catch {
      setSignaturesMap(prev => ({ ...prev, [docId]: [] }));
    }
  };

  const handleExpand = (docId: number) => {
    if (expandedId === docId) {
      setExpandedId(null);
    } else {
      setExpandedId(docId);
      loadSignatures(docId);
    }
  };

  const handleRevoke = async () => {
    if (!revokeModal || !revokeReason.trim()) return;
    await revokeDoc(
      { id: revokeModal.id, reason: revokeReason.trim() },
      {
        onSuccess: () => {
          setRevokeModal(null);
          setRevokeReason('');
          refetch();
        },
      }
    );
  };

  const handleSigned = () => {
    setSignModal(null);
    refetch();
    // Refresh signatures for the signed document
    if (signModal) {
      setSignaturesMap(prev => {
        const copy = { ...prev };
        delete copy[signModal.documentId];
        return copy;
      });
      if (expandedId === signModal.documentId) {
        loadSignatures(signModal.documentId);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Filter documents
  const docs = Array.isArray(documents) ? documents : [];
  const filtered = docs.filter((d: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(d.title || '').toLowerCase().includes(q) &&
          !(d.verificationCode || '').toLowerCase().includes(q) &&
          !(d.type || '').toLowerCase().includes(q)) return false;
    }
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (dateFrom && d.createdAt && new Date(d.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && d.createdAt && new Date(d.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  // Stats
  const stats = {
    total: docs.length,
    active: docs.filter((d: any) => d.status === 'active').length,
    revoked: docs.filter((d: any) => d.status === 'revoked').length,
    signed: docs.filter((d: any) => (d.signatureCount || 0) > 0).length,
  };

  // Unique types from data
  const docTypes = [...new Set(docs.map((d: any) => d.type).filter(Boolean))];

  // Export handler
  const doExport = async (format: ExportFormat) => {
    const data = filtered.map((d: any) => ({
      Titulo: d.title || '',
      Tipo: TYPE_LABELS[d.type] || d.type || '',
      Codigo: d.verificationCode || '',
      Status: STATUS_LABELS[d.status] || d.status || '',
      Assinaturas: d.signatureCount || 0,
      Data: d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : '',
    }));

    const { buildTableReportHTML, getMunicipalityReport } = await import('../lib/reportUtils');
    const mr = municipalityId ? await getMunicipalityReport(municipalityId, api) : null;
    const html = buildTableReportHTML(
      'GESTAO DE DOCUMENTOS',
      data,
      ['Titulo', 'Tipo', 'Codigo', 'Status', 'Assinaturas', 'Data'],
      mr
    );
    handleExport(format, data, html, 'gestao_documentos');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center">
              <FileCheck size={20} className="text-white" />
            </div>
            Gestão de Documentos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Documentos gerados, assinaturas eletronicas e verificacao
          </p>
        </div>
        <button onClick={() => setExportModal(true)} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Exportar
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-green-500 uppercase">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-blue-500 uppercase">Assinados</p>
          <p className="text-2xl font-bold text-blue-600">{stats.signed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-red-500 uppercase">Revogados</p>
          <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
        </div>
      </div>

      {/* Search & filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por titulo ou código de verificação..."
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-accent-50 border-accent-500' : ''}`}
          >
            <Filter size={16} /> Filtros
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input text-sm">
                <option value="all">Todos</option>
                {docTypes.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input text-sm">
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="revoked">Revogado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Data Inicio</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Data Fim</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-accent-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum documento encontrado</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Documentos gerados pelo sistema aparecerao aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc: any) => {
            const isExpanded = expandedId === doc.id;
            const sigs = signaturesMap[doc.id] || [];

            return (
              <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Document row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  onClick={() => handleExpand(doc.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-gray-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {doc.title || 'Documento sem titulo'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {TYPE_LABELS[doc.type] || doc.type || 'Documento'}
                      </span>
                      {doc.verificationCode && (
                        <span className="text-xs font-mono text-accent-600 dark:text-accent-400">
                          {doc.verificationCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Signature count */}
                    <div className="flex items-center gap-1 text-xs text-gray-500" title="Assinaturas">
                      <Lock size={12} />
                      <span>{doc.signatureCount || 0}</span>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status] || STATUS_COLORS.active}`}>
                      {STATUS_LABELS[doc.status] || doc.status || 'Ativo'}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('pt-BR') : ''}
                    </span>

                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-750/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Info */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Codigo de Verificacao</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-sm font-mono text-accent-600 dark:text-accent-400">
                              {doc.verificationCode || 'N/A'}
                            </code>
                            {doc.verificationCode && (
                              <button onClick={(e) => { e.stopPropagation(); copyToClipboard(doc.verificationCode); }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Copiar">
                                <Copy size={12} className="text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Hash SHA-256</p>
                          <code className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all block mt-0.5">
                            {doc.hash || 'N/A'}
                          </code>
                        </div>
                        {doc.fileSize && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Tamanho</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase">Gerado em</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                        {doc.generatedBy && (
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Gerado por</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{doc.generatedByName || `Usuario #${doc.generatedBy}`}</p>
                          </div>
                        )}
                      </div>

                      {/* Signatures */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                          Assinaturas ({sigs.length})
                        </p>
                        {sigs.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">Nenhuma assinatura registrada</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {sigs.map((sig: any, i: number) => (
                              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2">
                                  <Shield size={14} className="text-green-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                      {sig.signerName || `Usuario #${sig.signedBy}`}
                                    </p>
                                    {sig.signerRole && (
                                      <p className="text-xs text-gray-500">{sig.signerRole}</p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                      {sig.signedAt ? new Date(sig.signedAt).toLocaleString('pt-BR') : ''}
                                    </p>
                                  </div>
                                </div>
                                <code className="text-[10px] font-mono text-gray-400 break-all block mt-1">
                                  {sig.signatureHash || sig.hash}
                                </code>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                      {doc.status === 'active' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSignModal({
                                documentId: doc.id,
                                title: doc.title || 'Documento',
                                code: doc.verificationCode,
                              });
                            }}
                            className="btn-primary text-sm flex items-center gap-2"
                          >
                            <Lock size={14} /> Assinar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRevokeModal({ id: doc.id, title: doc.title || 'Documento' });
                            }}
                            className="btn-secondary text-sm flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle size={14} /> Revogar
                          </button>
                        </>
                      )}
                      {doc.verificationCode && (
                        <a
                          href={`/verificar/${doc.verificationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          <Eye size={14} /> Verificar
                        </a>
                      )}
                    </div>

                    {/* Revoke reason if revoked */}
                    {doc.status === 'revoked' && doc.revokedReason && (
                      <div className="mt-3 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">Motivo da Revogacao</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{doc.revokedReason}</p>
                        {doc.revokedAt && (
                          <p className="text-xs text-red-400 mt-1">
                            Revogado em: {new Date(doc.revokedAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Results count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Exibindo {filtered.length} de {docs.length} documento(s)
        </p>
      )}

      {/* Signature Modal */}
      {signModal && (
        <SignatureModal
          open={true}
          onClose={() => setSignModal(null)}
          documentId={signModal.documentId}
          documentTitle={signModal.title}
          verificationCode={signModal.code}
          onSigned={handleSigned}
        />
      )}

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} />
                Revogar Documento
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Você está prestes a revogar o documento:
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {revokeModal.title}
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-700 dark:text-red-300">
                  <strong>Atenção:</strong> Esta acao e irreversivel. O documento sera marcado como revogado e
                  nao podera mais ser utilizado como prova valida.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivo da Revogacao <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Informe o motivo da revogacao..."
                  className="input min-h-[80px]"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => { setRevokeModal(null); setRevokeReason(''); }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking || !revokeReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {revoking ? (
                  <><Loader2 size={16} className="animate-spin" /> Revogando...</>
                ) : (
                  <><XCircle size={16} /> Revogar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        open={exportModal}
        onClose={() => setExportModal(false)}
        onExport={doExport}
        title="Exportar Documentos"
      />
    </div>
  );
}
