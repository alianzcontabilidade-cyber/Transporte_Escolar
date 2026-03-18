import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Book, Plus, X, Pencil, Trash2, Search } from 'lucide-react';

const CATEGORIES: any = { base_nacional: 'Base Nacional (BNCC)', parte_diversificada: 'Parte Diversificada', eletiva: 'Eletiva' };
const CAT_COLORS: any = { base_nacional: 'bg-blue-100 text-blue-700', parte_diversificada: 'bg-purple-100 text-purple-700', eletiva: 'bg-green-100 text-green-700' };
const emptyForm = { name: '', code: '', category: 'base_nacional', workloadHours: '' };

export default function SubjectsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const { data: subjectsList, refetch } = useQuery(() => api.subjects.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.subjects.create);
  const { mutate: update, loading: updating } = useMutation(api.subjects.update);
  const { mutate: remove } = useMutation(api.subjects.delete);

  const all = (subjectsList as any) || [];
  const filtered = all.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()) || (s.code || '').toLowerCase().includes(search.toLowerCase()));
  const setField = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (s: any) => { setForm({ ...s, workloadHours: s.workloadHours ? String(s.workloadHours) : '' }); setEditId(s.id); setShowModal(true); };

  const save = () => {
    if (!form.name) return;
    const payload = { municipalityId, name: form.name, code: form.code || undefined, category: form.category, workloadHours: form.workloadHours ? parseInt(form.workloadHours) : undefined };
    if (editId) { update({ id: editId, ...payload }, { onSuccess: () => { refetch(); setShowModal(false); } }); }
    else { create(payload, { onSuccess: () => { refetch(); setShowModal(false); } }); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Book size={20} className="text-emerald-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Disciplinas</h1><p className="text-gray-500">{all.length} disciplina(s)</p></div>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nova Disciplina</button>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar disciplina..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((s: any) => (
          <div key={s.id} className="card hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div><p className="font-semibold text-gray-800">{s.name}</p>{s.code && <p className="text-xs text-gray-400">Código: {s.code}</p>}</div>
              <div className="flex gap-1"><button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={14} /></button><button onClick={() => setConfirmDelete(s)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button></div>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[s.category] || ''}`}>{CATEGORIES[s.category] || s.category}</span>
              {s.workloadHours && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.workloadHours}h/ano</span>}
            </div>
          </div>
        ))}
        {!filtered.length && <div className="col-span-3 card text-center py-16"><Book size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 mb-4">Nenhuma disciplina</p><button className="btn-primary" onClick={openNew}>Adicionar disciplina</button></div>}
      </div>

      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { remove({ id: confirmDelete.id }, { onSuccess: () => { refetch(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar Disciplina' : 'Nova Disciplina'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Ex: Matemática" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Código</label><input className="input" value={form.code} onChange={setField('code')} placeholder="MAT" /></div>
            <div><label className="label">Carga horária (h/ano)</label><input className="input" type="number" value={form.workloadHours} onChange={setField('workloadHours')} /></div>
          </div>
          <div><label className="label">Categoria</label><select className="input" value={form.category} onChange={setField('category')}>{Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating || updating} className="btn-primary flex-1">{creating || updating ? 'Salvando...' : 'Salvar'}</button></div>
      </div></div>)}
    </div>
  );
}
