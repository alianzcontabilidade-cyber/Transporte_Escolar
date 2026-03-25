import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { showSuccessToast, showErrorToast } from '../lib/hooks';
import { Plus, Search, Edit2, Trash2, Star, Truck, Fuel, Shield, Wrench, X, Building2, Phone, Mail, MapPin } from 'lucide-react';
import ExportModal, { ExportFormat, handleExport } from '../components/ExportModal';
import { buildTableReportHTML } from '../lib/reportUtils';

import { useQuery, useMutation } from '../lib/hooks';

const SUPPLIER_TYPES: Record<string, string> = {
  mecanica: 'Mecanica',
  posto_combustivel: 'Posto de Combustivel',
  seguradora: 'Seguradora',
  autopecas: 'Auto Pecas',
  borracharia: 'Borracharia',
  eletrica: 'Eletrica Auto',
  funilaria: 'Funilaria',
  outro: 'Outro',
};

const TYPE_KEYS = Object.keys(SUPPLIER_TYPES);

const emptyForm = {
  name: '',
  type: 'mecanica',
  cnpj: '',
  cpf: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  cep: '',
  rating: 0,
  notes: '',
};

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(function (s) {
        return (
          <button
            key={s}
            type="button"
            disabled={readonly}
            onClick={function () { if (onChange) onChange(s); }}
            className={readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
          >
            <Star
              size={readonly ? 14 : 18}
              className={s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const munId = user?.municipalityId || 1;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const { data: suppliers, refetch } = useQuery(function () { return api.suppliers.list({ municipalityId: munId }); }, [munId]);
  const { mutate: create, loading: creating } = useMutation(api.suppliers.create);
  const { mutate: update, loading: updating } = useMutation(api.suppliers.update);
  const { mutate: remove } = useMutation(api.suppliers.delete);

  const setField = function (k: string) {
    return function (e: any) {
      setForm(function (f: any) { return { ...f, [k]: e.target.value }; });
    };
  };

  const all = (suppliers as any) || [];
  const filtered = all.filter(function (s: any) {
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.contactName || '').toLowerCase().includes(q) || (s.city || '').toLowerCase().includes(q) || (s.phone || '').includes(q);
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    total: all.length,
    mecanica: all.filter(function (s: any) { return s.type === 'mecanica'; }).length,
    posto_combustivel: all.filter(function (s: any) { return s.type === 'posto_combustivel'; }).length,
    seguradora: all.filter(function (s: any) { return s.type === 'seguradora'; }).length,
  };

  const openNew = function () {
    setForm(emptyForm);
    setEditId(null);
    setErr('');
    setShowModal(true);
  };

  const openEdit = function (s: any) {
    setForm({
      ...emptyForm,
      ...s,
      rating: s.rating ? Number(s.rating) : 0,
    });
    setEditId(s.id);
    setErr('');
    setShowModal(true);
  };

  const save = function () {
    if (!form.name) {
      setErr('Nome do fornecedor e obrigatorio.');
      return;
    }
    const payload: any = {
      municipalityId: munId,
      name: form.name,
      type: form.type || 'outro',
      cnpj: form.cnpj || undefined,
      cpf: form.cpf || undefined,
      contactName: form.contactName || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      cep: form.cep || undefined,
      rating: form.rating ? Number(form.rating) : undefined,
      notes: form.notes || undefined,
    };
    if (editId !== null) {
      update({ id: editId, ...payload }, {
        onSuccess: function () {
          refetch();
          setShowModal(false);
          showSuccessToast('Fornecedor atualizado com sucesso!');
        },
        onError: function (e: any) {
          setErr(e?.message || e || 'Erro ao atualizar');
        },
      });
    } else {
      create(payload, {
        onSuccess: function () {
          refetch();
          setShowModal(false);
          showSuccessToast('Fornecedor cadastrado com sucesso!');
        },
        onError: function (e: any) {
          setErr(e?.message || e || 'Erro ao cadastrar');
        },
      });
    }
  };

  const [exportModal, setExportModal] = useState<{ title: string; data: any[]; cols: string[]; filename: string } | null>(null);
  const exportRows = all.map(function (s: any) {
    return {
      nome: s.name || '',
      tipo: SUPPLIER_TYPES[s.type] || s.type || '',
      cnpj: s.cnpj || '',
      cpf: s.cpf || '',
      contato: s.contactName || '',
      telefone: s.phone || '',
      email: s.email || '',
      cidade: s.city || '',
      uf: s.state || '',
      avaliacao: s.rating ? s.rating + '/5' : '',
    };
  });
  const exportCols = ['Nome', 'Tipo', 'CNPJ', 'CPF', 'Contato', 'Telefone', 'Email', 'Cidade', 'UF', 'Avaliacao'];

  const doExport = function (format: ExportFormat) {
    if (!exportModal) return;
    const html = buildTableReportHTML(exportModal.title, exportModal.data, exportModal.cols);
    handleExport(format, exportModal.data, html, exportModal.filename);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-500">{all.length} fornecedor(es) cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={function () {
              setExportModal({ title: 'Lista de Fornecedores', data: exportRows, cols: exportCols, filename: 'fornecedores_netescol' });
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <Building2 size={16} /> Exportar
          </button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Novo Fornecedor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="card bg-gray-50 border p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Building2 size={16} className="text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">{counts.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="card bg-blue-50 border p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Wrench size={16} className="text-blue-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">{counts.mecanica}</p>
          <p className="text-xs text-gray-500">Mecanicas</p>
        </div>
        <div className="card bg-orange-50 border p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Fuel size={16} className="text-orange-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">{counts.posto_combustivel}</p>
          <p className="text-xs text-gray-500">Postos</p>
        </div>
        <div className="card bg-green-50 border p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Shield size={16} className="text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">{counts.seguradora}</p>
          <p className="text-xs text-gray-500">Seguradoras</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome, contato, cidade ou telefone..."
          value={search}
          onChange={function (e) { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Contato</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Telefone</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Cidade</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Avaliacao</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(function (s: any) {
              return (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{s.name}</p>
                        {s.cnpj && <p className="text-xs text-gray-400">{s.cnpj}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {SUPPLIER_TYPES[s.type] || s.type || 'Outro'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{s.contactName || '--'}</td>
                  <td className="py-3 px-3">
                    {s.phone ? (
                      <span className="flex items-center gap-1 text-gray-600">
                        <Phone size={12} className="text-gray-400" />
                        {s.phone}
                      </span>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-3">
                    {s.city ? (
                      <span className="flex items-center gap-1 text-gray-600">
                        <MapPin size={12} className="text-gray-400" />
                        {s.city}{s.state ? '/' + s.state : ''}
                      </span>
                    ) : '--'}
                  </td>
                  <td className="py-3 px-3">
                    <StarRating value={s.rating || 0} readonly />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={function () { openEdit(s); }}
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={function () { setConfirmDelete(s); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="card text-center py-16 mt-4">
            <Truck size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Nenhum fornecedor encontrado</p>
            {!search && (
              <button className="btn-primary" onClick={openNew}>
                Cadastrar primeiro fornecedor
              </button>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <button onClick={function () { setPage(1); }} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<<'}</button>
            <button onClick={function () { setPage(function (p) { return Math.max(1, p - 1); }); }} disabled={page === 1} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'<'}</button>
            <span className="px-3 py-1.5 text-sm font-medium">{page}/{totalPages}</span>
            <button onClick={function () { setPage(function (p) { return Math.min(totalPages, p + 1); }); }} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>'}</button>
            <button onClick={function () { setPage(totalPages); }} disabled={page === totalPages} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40">{'>>'}</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir {confirmDelete.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acao nao pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={function () { setConfirmDelete(null); }} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={function () {
                  remove({ id: confirmDelete.id }, {
                    onSuccess: function () {
                      refetch();
                      setConfirmDelete(null);
                      showSuccessToast('Fornecedor excluido com sucesso!');
                    },
                    onError: function (e: any) {
                      showErrorToast(e?.message || e || 'Erro ao excluir');
                      setConfirmDelete(null);
                    },
                  });
                }}
                className="btn-primary flex-1 bg-red-500 hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold">{editId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
              <button onClick={function () { setShowModal(false); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {err && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nome *</label>
                  <input className="input" value={form.name} onChange={setField('name')} placeholder="Nome do fornecedor" />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={setField('type')}>
                    {TYPE_KEYS.map(function (k) {
                      return <option key={k} value={k}>{SUPPLIER_TYPES[k]}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="label">CNPJ</label>
                  <input className="input" value={form.cnpj} onChange={setField('cnpj')} placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <label className="label">CPF</label>
                  <input className="input" value={form.cpf} onChange={setField('cpf')} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="label">Contato</label>
                  <input className="input" value={form.contactName} onChange={setField('contactName')} placeholder="Nome do contato" />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="input pl-9" value={form.phone} onChange={setField('phone')} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="input pl-9" type="email" value={form.email} onChange={setField('email')} placeholder="email@exemplo.com" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label">Endereco</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="input pl-9" value={form.address} onChange={setField('address')} placeholder="Rua, numero, bairro" />
                  </div>
                </div>
                <div>
                  <label className="label">Cidade</label>
                  <input className="input" value={form.city} onChange={setField('city')} placeholder="Cidade" />
                </div>
                <div>
                  <label className="label">UF</label>
                  <input className="input" value={form.state} onChange={setField('state')} placeholder="TO" maxLength={2} />
                </div>
                <div>
                  <label className="label">CEP</label>
                  <input className="input" value={form.cep} onChange={setField('cep')} placeholder="00000-000" />
                </div>
                <div>
                  <label className="label">Avaliacao</label>
                  <div className="mt-1">
                    <StarRating
                      value={form.rating || 0}
                      onChange={function (v) {
                        setForm(function (f: any) { return { ...f, rating: v }; });
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="label">Observacoes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={form.notes}
                    onChange={setField('notes')}
                    placeholder="Observacoes sobre o fornecedor..."
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={function () { setShowModal(false); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={creating || updating} className="btn-primary flex-1">
                {creating || updating ? 'Salvando...' : editId ? 'Salvar alteracoes' : 'Salvar Fornecedor'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal
        open={!!exportModal}
        onClose={function () { setExportModal(null); }}
        onExport={doExport}
        title={exportModal ? 'Exportar: ' + exportModal.title : undefined}
      />
    </div>
  );
}
