import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { BookOpen, Plus, X, Pencil, Trash2 } from 'lucide-react';

const LEVELS: any = { creche: 'Creche', pre_escola: 'Pré-Escola', fundamental_1: 'Fund. I (1º-5º)', fundamental_2: 'Fund. II (6º-9º)', medio: 'Médio', eja: 'EJA', tecnico: 'Técnico' };
const LEVEL_COLORS: any = { creche: 'bg-pink-100 text-pink-700', pre_escola: 'bg-purple-100 text-purple-700', fundamental_1: 'bg-blue-100 text-blue-700', fundamental_2: 'bg-indigo-100 text-indigo-700', medio: 'bg-teal-100 text-teal-700', eja: 'bg-orange-100 text-orange-700', tecnico: 'bg-gray-100 text-gray-700' };
const emptyForm = { name: '', level: 'fundamental_1', orderIndex: 0 };

export default function ClassGradesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const { data: grades, refetch } = useQuery(() => api.classGrades.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.classGrades.create);
  const { mutate: update, loading: updating } = useMutation(api.classGrades.update);
  const { mutate: remove } = useMutation(api.classGrades.delete);

  const all = (grades as any) || [];
  const setField = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (g: any) => { setForm({ ...g }); setEditId(g.id); setShowModal(true); };

  const save = () => {
    if (!form.name || !form.level) return;
    const payload = { municipalityId, name: form.name, level: form.level, orderIndex: form.orderIndex ? parseInt(form.orderIndex) : undefined };
    if (editId) { update({ id: editId, ...payload }, { onSuccess: () => { refetch(); setShowModal(false); } }); }
    else { create(payload, { onSuccess: () => { refetch(); setShowModal(false); } }); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><BookOpen size={20} className="text-blue-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Séries / Etapas</h1><p className="text-gray-500">{all.length} série(s) cadastrada(s)</p></div>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nova Série</button>
      </div>

      <div className="grid gap-3">
        {all.map((g: any, i: number) => (
          <div key={g.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600">{i + 1}</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{g.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLORS[g.level] || 'bg-gray-100'}`}>{LEVELS[g.level] || g.level}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(g)} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg"><Pencil size={15} /></button>
              <button onClick={() => setConfirmDelete(g)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {!all.length && <div className="card text-center py-16"><BookOpen size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhuma série cadastrada</p><button className="btn-primary" onClick={openNew}>Adicionar série</button></div>}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { remove({ id: confirmDelete.id }, { onSuccess: () => { refetch(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar Série' : 'Nova Série'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
          <div className="p-5 space-y-4">
            <div><label className="label">Nome da série *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Ex: 1º Ano, Berçário I" /></div>
            <div><label className="label">Etapa/Nível *</label><select className="input" value={form.level} onChange={setField('level')}>{Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
            <div><label className="label">Ordem de exibição</label><input className="input" type="number" value={form.orderIndex} onChange={setField('orderIndex')} /></div>
          </div>
          <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating || updating} className="btn-primary flex-1">{creating || updating ? 'Salvando...' : 'Salvar'}</button></div>
        </div></div>
      )}
    </div>
  );
}
