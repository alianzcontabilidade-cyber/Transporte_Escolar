import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Package, Plus, X, Pencil, Trash2, Search, Box, ArrowDown, ArrowUp } from 'lucide-react';

const CATS: any = { movel: 'Movel', imovel: 'Imovel', equipamento: 'Equipamento', veiculo: 'Veiculo', tecnologia: 'Tecnologia', outro: 'Outro' };
const CONDS: any = { otimo: 'Otimo', bom: 'Bom', regular: 'Regular', ruim: 'Ruim', inservivel: 'Inservivel' };
const COND_COLORS: any = { otimo: 'bg-green-100 text-green-700', bom: 'bg-blue-100 text-blue-700', regular: 'bg-yellow-100 text-yellow-700', ruim: 'bg-orange-100 text-orange-700', inservivel: 'bg-red-100 text-red-700' };

export default function AssetsPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState<'assets'|'inventory'>('assets');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data: assetsData, refetch: rAssets } = useQuery(() => api.assets.list({ municipalityId: mid }), [mid]);
  const { data: invData, refetch: rInv } = useQuery(() => api.inventory.list({ municipalityId: mid }), [mid]);
  const { mutate: createAsset } = useMutation(api.assets.create);
  const { mutate: updateAsset } = useMutation(api.assets.update);
  const { mutate: deleteAsset } = useMutation(api.assets.delete);
  const { mutate: createItem } = useMutation(api.inventory.create);
  const { mutate: deleteItem } = useMutation(api.inventory.delete);
  const { mutate: addMovement } = useMutation(api.inventory.addMovement);

  const allAssets = (assetsData as any) || [];
  const allInv = (invData as any) || [];
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const filteredAssets = allAssets.filter((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()) || (a.code || '').toLowerCase().includes(search.toLowerCase()));
  const filteredInv = allInv.filter((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()));

  const openNewAsset = () => { setForm({ name: '', code: '', category: 'equipamento', location: '', condition: 'bom', notes: '' }); setEditId(null); setShowModal(true); };
  const openNewItem = () => { setForm({ name: '', category: '', unit: 'un', currentStock: '0', minStock: '5', location: '' }); setEditId(null); setShowModal(true); };

  const save = () => {
    if (!form.name) return;
    if (tab === 'assets') {
      const p = { municipalityId: mid, name: form.name, code: form.code || undefined, category: form.category, location: form.location || undefined, condition: form.condition, notes: form.notes || undefined };
      const cb = { onSuccess: () => { rAssets(); setShowModal(false); } };
      editId ? updateAsset({ id: editId, ...p }, cb) : createAsset(p, cb);
    } else {
      createItem({ municipalityId: mid, name: form.name, category: form.category || undefined, unit: form.unit || 'un', currentStock: parseInt(form.currentStock) || 0, minStock: parseInt(form.minStock) || 5, location: form.location || undefined },
        { onSuccess: () => { rInv(); setShowModal(false); } });
    }
  };

  const doMove = (itemId: number, type: 'entrada' | 'saida') => {
    const qty = prompt(`Quantidade para ${type}:`);
    if (!qty || isNaN(parseInt(qty))) return;
    addMovement({ itemId, type, quantity: parseInt(qty) }, { onSuccess: () => rInv() });
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    const cb = { onSuccess: () => { setConfirmDelete(null); tab === 'assets' ? rAssets() : rInv(); } };
    tab === 'assets' ? deleteAsset({ id: confirmDelete.id }, cb) : deleteItem({ id: confirmDelete.id }, cb);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Package size={20} className="text-slate-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Patrimonio e Estoque</h1><p className="text-gray-500">{allAssets.length} bens · {allInv.length} itens em estoque</p></div></div>
        <button onClick={() => tab === 'assets' ? openNewAsset() : openNewItem()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo</button>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {[['assets', 'Patrimonio', Package], ['inventory', 'Estoque', Box]].map(([id, label, Icon]: any) => (
          <button key={id} onClick={() => { setTab(id); setSearch(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}><Icon size={14} /> {label}</button>
        ))}
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      {tab === 'assets' && (
        <div className="grid gap-3">{filteredAssets.map((a: any) => (
          <div key={a.id} className="card flex items-center gap-4">
            <div className="flex-1"><div className="flex items-center gap-2 mb-1"><p className="font-semibold text-gray-800">{a.name}</p>{a.code && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{a.code}</span>}{a.condition && <span className={`text-xs px-2 py-0.5 rounded-full ${COND_COLORS[a.condition] || ''}`}>{CONDS[a.condition]}</span>}</div><div className="flex gap-2 text-xs text-gray-500"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{CATS[a.category]}</span>{a.location && <span>{a.location}</span>}</div></div>
            <div className="flex gap-1"><button onClick={() => { setForm({ ...a }); setEditId(a.id); setShowModal(true); }} className="p-2 text-gray-400 hover:text-primary-500 rounded-lg"><Pencil size={15} /></button><button onClick={() => setConfirmDelete(a)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={15} /></button></div>
          </div>
        ))}{!filteredAssets.length && <div className="card text-center py-12"><Package size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum bem</p></div>}</div>
      )}

      {tab === 'inventory' && (
        <div className="grid gap-3">{filteredInv.map((i: any) => (
          <div key={i.id} className="card flex items-center gap-4">
            <div className="flex-1"><p className="font-semibold text-gray-800">{i.name}</p><div className="flex gap-2 text-xs text-gray-500">{i.category && <span>{i.category}</span>}<span>Unidade: {i.unit}</span>{i.location && <span>{i.location}</span>}</div></div>
            <div className="flex items-center gap-3">
              <div className="text-center"><p className={`text-lg font-bold ${(i.currentStock || 0) <= (i.minStock || 5) ? 'text-red-600' : 'text-gray-800'}`}>{i.currentStock || 0}</p><p className="text-xs text-gray-400">{i.unit}</p></div>
              <button onClick={() => doMove(i.id, 'entrada')} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg" title="Entrada"><ArrowDown size={16} /></button>
              <button onClick={() => doMove(i.id, 'saida')} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg" title="Saida"><ArrowUp size={16} /></button>
              <button onClick={() => setConfirmDelete(i)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}{!filteredInv.length && <div className="card text-center py-12"><Box size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum item</p></div>}</div>
      )}

      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={doDelete} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar' : 'Novo'} {tab === 'assets' ? 'Bem' : 'Item de Estoque'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          {tab === 'assets' ? (<div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={form.name || ''} onChange={sf('name')} /></div>
            <div><label className="label">Codigo</label><input className="input" value={form.code || ''} onChange={sf('code')} /></div>
            <div><label className="label">Categoria</label><select className="input" value={form.category || ''} onChange={sf('category')}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
            <div><label className="label">Condicao</label><select className="input" value={form.condition || ''} onChange={sf('condition')}>{Object.entries(CONDS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
            <div><label className="label">Localizacao</label><input className="input" value={form.location || ''} onChange={sf('location')} /></div>
            <div className="col-span-2"><label className="label">Observacoes</label><textarea className="input" rows={2} value={form.notes || ''} onChange={sf('notes')} /></div>
          </div>) : (<div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Nome *</label><input className="input" value={form.name || ''} onChange={sf('name')} /></div>
            <div><label className="label">Categoria</label><input className="input" value={form.category || ''} onChange={sf('category')} /></div>
            <div><label className="label">Unidade</label><input className="input" value={form.unit || 'un'} onChange={sf('unit')} placeholder="un, kg, l..." /></div>
            <div><label className="label">Estoque atual</label><input className="input" type="number" value={form.currentStock || ''} onChange={sf('currentStock')} /></div>
            <div><label className="label">Estoque minimo</label><input className="input" type="number" value={form.minStock || ''} onChange={sf('minStock')} /></div>
            <div className="col-span-2"><label className="label">Localizacao</label><input className="input" value={form.location || ''} onChange={sf('location')} /></div>
          </div>)}
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    </div>
  );
}
