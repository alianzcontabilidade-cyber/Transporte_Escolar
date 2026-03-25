import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showSuccessToast, showErrorToast } from '../lib/hooks';
import { Plus, Search, Edit2, Trash2, X, Warehouse, MapPin, Phone, Truck, Users } from 'lucide-react';
import ExportModal, { ExportFormat, handleExport } from '../components/ExportModal';
import { getMunicipalityReport, buildTableReportHTML } from '../lib/reportUtils';

const TYPE_LABELS: any = { propria: 'Própria', alugada: 'Alugada', cedida: 'Cedida', conveniada: 'Conveniada' };
const TYPE_COLORS: any = { propria: 'bg-blue-100 text-blue-700', alugada: 'bg-yellow-100 text-yellow-700', cedida: 'bg-purple-100 text-purple-700', conveniada: 'bg-green-100 text-green-700' };

const emptyForm = {
  name: '', type: 'propria', address: '', city: '', state: '', cep: '',
  latitude: '', longitude: '', capacity: '10', contactName: '', phone: '', notes: '',
};

export default function GaragesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data: garages, refetch } = useQuery(function () { return api.garages.list({ municipalityId }); }, [municipalityId]);
  const { data: vehicles } = useQuery(function () { return api.vehicles.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.garages.create);
  const { mutate: update, loading: updating } = useMutation(api.garages.update);
  const { mutate: remove } = useMutation(api.garages.delete);

  const sf = function (k: string) { return function (e: any) { setForm(function (f: any) { return { ...f, [k]: e.target.value }; }); }; };

  const all = (garages as any) || [];
  const allVehicles = (vehicles as any) || [];
  const filtered = all.filter(function (g: any) {
    const q = search.toLowerCase();
    return g.name?.toLowerCase().includes(q) || (g.address || '').toLowerCase().includes(q) || (g.contactName || '').toLowerCase().includes(q) || (g.city || '').toLowerCase().includes(q);
  });

  const getVehicleCount = function (garageId: number) {
    return allVehicles.filter(function (v: any) { return v.garageId === garageId; }).length;
  };

  const totalCapacity = all.reduce(function (sum: number, g: any) { return sum + (g.capacity || 0); }, 0);
  const totalVehiclesAllocated = all.reduce(function (sum: number, g: any) { return sum + getVehicleCount(g.id); }, 0);

  const openNew = function () { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = function (g: any) {
    setForm({
      ...emptyForm, ...g,
      capacity: g.capacity ? String(g.capacity) : '10',
      latitude: g.latitude ? String(g.latitude) : '',
      longitude: g.longitude ? String(g.longitude) : '',
    });
    setEditId(g.id);
    setShowModal(true);
  };

  const save = function () {
    if (!form.name) { showErrorToast('Nome da garagem é obrigatório.'); return; }
    const payload: any = {
      municipalityId,
      name: form.name,
      type: form.type || 'propria',
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      cep: form.cep || undefined,
      latitude: form.latitude || undefined,
      longitude: form.longitude || undefined,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      contactName: form.contactName || undefined,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
    };
    if (editId !== null) {
      update({ id: editId, ...payload }, {
        onSuccess: function () { refetch(); setShowModal(false); showSuccessToast('Garagem atualizada com sucesso!'); },
        onError: function (e: any) { showErrorToast(e?.message || 'Erro ao atualizar garagem.'); },
      });
    } else {
      create(payload, {
        onSuccess: function () { refetch(); setShowModal(false); showSuccessToast('Garagem criada com sucesso!'); },
        onError: function (e: any) { showErrorToast(e?.message || 'Erro ao criar garagem.'); },
      });
    }
  };

  const doDelete = function () {
    if (!confirmDelete) return;
    remove({ id: confirmDelete.id }, {
      onSuccess: function () { refetch(); setConfirmDelete(null); showSuccessToast('Garagem removida com sucesso!'); },
      onError: function (e: any) { showErrorToast(e?.message || 'Erro ao remover garagem.'); },
    });
  };

  // Export
  const [munReport, setMunReport] = useState<any>(null);
  const [exportModal, setExportModal] = useState<{ title: string; data: any[]; cols: string[]; filename: string } | null>(null);
  useEffect(function () { if (municipalityId) getMunicipalityReport(municipalityId, api).then(setMunReport).catch(function () { }); }, [municipalityId]);

  const exportRows = all.map(function (g: any) {
    return {
      nome: g.name || '',
      tipo: TYPE_LABELS[g.type] || g.type || '',
      endereco: g.address || '',
      cidade: g.city || '',
      uf: g.state || '',
      capacidade: g.capacity ? String(g.capacity) : '',
      veiculos: String(getVehicleCount(g.id)),
      responsavel: g.contactName || '',
      telefone: g.phone || '',
    };
  });
  const exportCols = ['Nome', 'Tipo', 'Endereço', 'Cidade', 'UF', 'Capacidade', 'Veículos', 'Responsável', 'Telefone'];
  const doExport = function (format: ExportFormat) {
    if (!exportModal) return;
    handleExport(format, exportModal.data, buildTableReportHTML(exportModal.title, exportModal.data, exportModal.cols, munReport, { orientation: 'landscape' }), exportModal.filename);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Garagens</h1>
          <p className="text-gray-500">Gestão de locais de guarda dos veículos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={function () { setExportModal({ title: 'Relatório de Garagens', data: exportRows, cols: exportCols, filename: 'garagens' }); }} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
            Exportar
          </button>
          <button onClick={openNew} className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 flex items-center gap-2 text-sm font-medium">
            <Plus size={16} /> Nova Garagem
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Warehouse size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Garagens</p>
              <p className="text-xl font-bold text-gray-900">{all.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Truck size={20} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Capacidade Total</p>
              <p className="text-xl font-bold text-gray-900">{totalCapacity}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Truck size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Veículos Alocados</p>
              <p className="text-xl font-bold text-gray-900">{totalVehiclesAllocated}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Warehouse size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Vagas Disponíveis</p>
              <p className="text-xl font-bold text-gray-900">{totalCapacity - totalVehiclesAllocated >= 0 ? totalCapacity - totalVehiclesAllocated : 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar garagem por nome, endereço, responsável ou cidade..." value={search} onChange={function (e) { setSearch(e.target.value); }} className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" />
        </div>
      </div>

      {/* Garage Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
          <Warehouse size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Nenhuma garagem encontrada</p>
          <p className="text-gray-400 text-sm mt-1">Cadastre uma nova garagem para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(function (g: any) {
            const vehicleCount = getVehicleCount(g.id);
            const capacity = g.capacity || 0;
            const usagePercent = capacity > 0 ? Math.min((vehicleCount / capacity) * 100, 100) : 0;
            const usageColor = usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

            return (
              <div key={g.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                      <Warehouse size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{g.name}</h3>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${TYPE_COLORS[g.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[g.type] || g.type || 'Própria'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={function () { openEdit(g); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={function () { setConfirmDelete(g); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Address */}
                {(g.address || g.city) && (
                  <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{[g.address, g.city, g.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {/* Capacity Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><Truck size={12} /> Ocupação</span>
                    <span className="font-medium">{vehicleCount} / {capacity} veículos</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${usageColor}`} style={{ width: capacity > 0 ? usagePercent + '%' : '0%' }}></div>
                  </div>
                </div>

                {/* Contact */}
                {(g.contactName || g.phone) && (
                  <div className="border-t pt-3 mt-3 space-y-1">
                    {g.contactName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={13} className="text-gray-400" />
                        <span className="truncate">{g.contactName}</span>
                      </div>
                    )}
                    {g.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={13} className="text-gray-400" />
                        <span>{g.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-4">Deseja realmente excluir a garagem <strong>{confirmDelete.name}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={function () { setConfirmDelete(null); }} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={doDelete} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg font-bold text-gray-900">{editId !== null ? 'Editar Garagem' : 'Nova Garagem'}</h2>
              <button onClick={function () { setShowModal(false); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Garagem *</label>
                  <input type="text" value={form.name} onChange={sf('name')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Ex: Garagem Central" />
                </div>
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={sf('type')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
                    <option value="propria">Própria</option>
                    <option value="alugada">Alugada</option>
                    <option value="cedida">Cedida</option>
                    <option value="conveniada">Conveniada</option>
                  </select>
                </div>
                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input type="text" value={form.address} onChange={sf('address')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Rua, número, bairro" />
                </div>
                {/* Cidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" value={form.city} onChange={sf('city')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Cidade" />
                </div>
                {/* UF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input type="text" value={form.state} onChange={sf('state')} maxLength={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 uppercase" placeholder="TO" />
                </div>
                {/* CEP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input type="text" value={form.cep} onChange={sf('cep')} maxLength={9} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="00000-000" />
                </div>
                {/* Capacidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade (veículos)</label>
                  <input type="number" value={form.capacity} onChange={sf('capacity')} min="0" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="10" />
                </div>
                {/* Latitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="text" value={form.latitude} onChange={sf('latitude')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="-10.1234567" />
                </div>
                {/* Longitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="text" value={form.longitude} onChange={sf('longitude')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="-48.1234567" />
                </div>
                {/* Responsável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                  <input type="text" value={form.contactName} onChange={sf('contactName')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Nome do responsável" />
                </div>
                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={sf('phone')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="(63) 99999-9999" />
                </div>
                {/* Observações */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea value={form.notes} onChange={sf('notes')} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none" placeholder="Informações adicionais sobre a garagem..." />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
              <button onClick={function () { setShowModal(false); }} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={save} disabled={creating || updating} className="px-6 py-2 text-sm text-white bg-accent-600 rounded-lg hover:bg-accent-700 disabled:opacity-50 font-medium">
                {creating || updating ? 'Salvando...' : editId !== null ? 'Atualizar' : 'Criar Garagem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal && (
        <ExportModal
          title={exportModal.title}
          onClose={function () { setExportModal(null); }}
          onExport={doExport}
        />
      )}
    </div>
  );
}
