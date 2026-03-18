import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Calendar, Plus, X, Pencil, Trash2, CheckCircle, Clock, Play } from 'lucide-react';

const STATUS_LABELS: any = { planning: 'Planejamento', active: 'Ativo', finished: 'Encerrado' };
const STATUS_COLORS: any = { planning: 'bg-yellow-100 text-yellow-700', active: 'bg-green-100 text-green-700', finished: 'bg-gray-100 text-gray-600' };
const emptyForm = { year: new Date().getFullYear(), name: '', startDate: '', endDate: '', status: 'planning' };

export default function AcademicYearsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [formErr, setFormErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const { data: years, refetch } = useQuery(() => api.academicYears.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.academicYears.create);
  const { mutate: update, loading: updating } = useMutation(api.academicYears.update);
  const { mutate: remove } = useMutation(api.academicYears.delete);

  const all = (years as any) || [];
  const setField = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const fmtDate = (d: any) => { if (!d) return ''; try { return typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]; } catch { return ''; } };

  const openNew = () => { setForm({ ...emptyForm, name: `Ano Letivo ${new Date().getFullYear()}` }); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEdit = (y: any) => { setForm({ ...y, startDate: fmtDate(y.startDate), endDate: fmtDate(y.endDate) }); setEditId(y.id); setFormErr(''); setShowModal(true); };

  const save = () => {
    if (!form.name || !form.startDate || !form.endDate) { setFormErr('Preencha todos os campos obrigatórios.'); return; }
    const payload = { municipalityId, year: parseInt(form.year), name: form.name, startDate: form.startDate, endDate: form.endDate, status: form.status };
    if (editId !== null) { update({ id: editId, ...payload }, { onSuccess: () => { refetch(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') }); }
    else { create(payload, { onSuccess: () => { refetch(); setShowModal(false); }, onError: (e: any) => setFormErr(e || 'Erro') }); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><Calendar size={20} className="text-indigo-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Anos Letivos</h1><p className="text-gray-500">{all.length} ano(s) letivo(s)</p></div>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Ano Letivo</button>
      </div>

      <div className="grid gap-4">
        {all.map((y: any) => (
          <div key={y.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-600">{y.year}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-800 text-lg">{y.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[y.status] || ''}`}>{STATUS_LABELS[y.status] || y.status}</span>
              </div>
              <p className="text-sm text-gray-500">
                {y.startDate ? new Date(y.startDate).toLocaleDateString('pt-BR') : '—'} a {y.endDate ? new Date(y.endDate).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(y)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={15} /></button>
              <button onClick={() => setConfirmDelete(y)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {!all.length && <div className="card text-center py-16"><Calendar size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhum ano letivo cadastrado</p><button className="btn-primary" onClick={openNew}>Criar primeiro ano letivo</button></div>}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={28} className="text-red-400 mx-auto mb-3" />
            <h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { remove({ id: confirmDelete.id }, { onSuccess: () => { refetch(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar Ano Letivo' : 'Novo Ano Letivo'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
            <div className="p-5 space-y-4">
              {formErr && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Ano Letivo 2025" /></div>
                <div><label className="label">Ano *</label><input className="input" type="number" value={form.year} onChange={setField('year')} /></div>
                <div><label className="label">Status</label><select className="input" value={form.status} onChange={setField('status')}><option value="planning">Planejamento</option><option value="active">Ativo</option><option value="finished">Encerrado</option></select></div>
                <div><label className="label">Início *</label><input className="input" type="date" value={form.startDate} onChange={setField('startDate')} /></div>
                <div><label className="label">Término *</label><input className="input" type="date" value={form.endDate} onChange={setField('endDate')} /></div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating || updating} className="btn-primary flex-1">{creating || updating ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
