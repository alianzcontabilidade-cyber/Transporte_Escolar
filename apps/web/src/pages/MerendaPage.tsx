import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { UtensilsCrossed, Plus, X, Pencil, Trash2, Calendar } from 'lucide-react';

const MEALS: any = { breakfast: 'Cafe da manha', lunch: 'Almoco', snack: 'Lanche', dinner: 'Jantar' };
const emptyForm = { date: new Date().toISOString().split('T')[0], mealType: 'lunch', description: '', calories: '', servings: '', cost: '', notes: '' };

export default function MerendaPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const { data: menus, refetch } = useQuery(() => api.mealMenus.list({ municipalityId: mid }), [mid]);
  const { mutate: create } = useMutation(api.mealMenus.create);
  const { mutate: update } = useMutation(api.mealMenus.update);
  const { mutate: remove } = useMutation(api.mealMenus.delete);

  const all = (menus as any) || [];
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const fmtDate = (d: any) => { if (!d) return ''; try { return typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]; } catch { return ''; } };

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (m: any) => { setForm({ ...m, date: fmtDate(m.date), calories: m.calories ? String(m.calories) : '', servings: m.servings ? String(m.servings) : '', cost: m.cost ? String(parseFloat(m.cost)) : '' }); setEditId(m.id); setShowModal(true); };

  const save = () => {
    if (!form.description || !form.date) return;
    const p = { municipalityId: mid, date: form.date, mealType: form.mealType, description: form.description, calories: form.calories ? parseInt(form.calories) : undefined, servings: form.servings ? parseInt(form.servings) : undefined, cost: form.cost ? parseFloat(form.cost) : undefined, notes: form.notes || undefined };
    const cb = { onSuccess: () => { refetch(); setShowModal(false); } };
    editId ? update({ id: editId, ...p }, cb) : create(p, cb);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><UtensilsCrossed size={20} className="text-orange-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Merenda Escolar</h1><p className="text-gray-500">{all.length} cardapio(s)</p></div></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Cardapio</button>
      </div>
      <div className="grid gap-3">{all.map((m: any) => (
        <div key={m.id} className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center"><UtensilsCrossed size={16} className="text-orange-500" /></div>
          <div className="flex-1"><p className="font-semibold text-gray-800">{m.description}</p><div className="flex gap-2 text-xs text-gray-500"><span><Calendar size={10} className="inline mr-1" />{m.date ? new Date(m.date).toLocaleDateString('pt-BR') : '—'}</span><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{MEALS[m.mealType]}</span>{m.calories && <span>{m.calories} kcal</span>}{m.servings && <span>{m.servings} porcoes</span>}{m.cost && <span>R$ {parseFloat(m.cost).toFixed(2)}</span>}</div></div>
          <div className="flex gap-1"><button onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={15} /></button><button onClick={() => setConfirmDelete(m)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={15} /></button></div>
        </div>
      ))}{!all.length && <div className="card text-center py-16"><UtensilsCrossed size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum cardapio cadastrado</p></div>}</div>

      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir cardapio?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { remove({ id: confirmDelete.id }, { onSuccess: () => { refetch(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar' : 'Novo'} Cardapio</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4"><div className="grid grid-cols-2 gap-4">
          <div><label className="label">Data *</label><input className="input" type="date" value={form.date} onChange={sf('date')} /></div>
          <div><label className="label">Refeicao</label><select className="input" value={form.mealType} onChange={sf('mealType')}>{Object.entries(MEALS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
          <div className="col-span-2"><label className="label">Descricao do cardapio *</label><textarea className="input" rows={3} value={form.description} onChange={sf('description')} placeholder="Arroz, feijao, frango grelhado, salada..." /></div>
          <div><label className="label">Calorias (kcal)</label><input className="input" type="number" value={form.calories} onChange={sf('calories')} /></div>
          <div><label className="label">Porcoes</label><input className="input" type="number" value={form.servings} onChange={sf('servings')} /></div>
          <div><label className="label">Custo (R$)</label><input className="input" type="number" step="0.01" value={form.cost} onChange={sf('cost')} /></div>
        </div><div><label className="label">Observacoes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={sf('notes')} /></div></div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    </div>
  );
}
