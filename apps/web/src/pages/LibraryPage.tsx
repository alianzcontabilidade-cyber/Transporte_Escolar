import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { BookMarked, Plus, X, Pencil, Trash2, Search, RotateCcw } from 'lucide-react';

const emptyForm = { title: '', author: '', isbn: '', category: '', publisher: '', year: '', quantity: '1', location: '' };

export default function LibraryPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [tab, setTab] = useState<'books'|'loans'>('books');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const { data: booksData, refetch: rBooks } = useQuery(() => api.libraryBooks.list({ municipalityId: mid, search: search || undefined }), [mid, search]);
  const { data: loansData, refetch: rLoans } = useQuery(() => api.libraryLoans.list({}), []);
  const { mutate: createBook } = useMutation(api.libraryBooks.create);
  const { mutate: updateBook } = useMutation(api.libraryBooks.update);
  const { mutate: deleteBook } = useMutation(api.libraryBooks.delete);
  const { mutate: returnBook } = useMutation(api.libraryLoans.returnBook);

  const allBooks = (booksData as any) || [];
  const allLoans = (loansData as any) || [];
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (b: any) => { setForm({ ...b, year: b.year ? String(b.year) : '', quantity: String(b.quantity || 1) }); setEditId(b.id); setShowModal(true); };

  const save = () => {
    if (!form.title) return;
    const p = { municipalityId: mid, title: form.title, author: form.author || undefined, isbn: form.isbn || undefined, category: form.category || undefined, publisher: form.publisher || undefined, year: form.year ? parseInt(form.year) : undefined, quantity: parseInt(form.quantity) || 1, location: form.location || undefined };
    const cb = { onSuccess: () => { rBooks(); setShowModal(false); } };
    editId ? updateBook({ id: editId, ...p }, cb) : createBook(p, cb);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><BookMarked size={20} className="text-amber-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Biblioteca</h1><p className="text-gray-500">{allBooks.length} titulo(s)</p></div></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Livro</button>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {[['books', 'Acervo'], ['loans', 'Emprestimos']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>{label}</button>
        ))}
      </div>

      {tab === 'books' && (<>
        <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por titulo ou autor..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{allBooks.map((b: any) => (
          <div key={b.id} className="card hover:border-primary-200">
            <div className="flex justify-between mb-2"><p className="font-semibold text-gray-800">{b.title}</p><div className="flex gap-1"><button onClick={() => openEdit(b)} className="p-1 text-gray-400 hover:text-primary-500 rounded"><Pencil size={14} /></button><button onClick={() => setConfirmDelete(b)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button></div></div>
            {b.author && <p className="text-sm text-gray-500">{b.author}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">{b.category && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{b.category}</span>}<span className={`text-xs px-2 py-0.5 rounded-full ${b.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.available}/{b.quantity} disp.</span>{b.isbn && <span className="text-xs text-gray-400">ISBN: {b.isbn}</span>}</div>
          </div>
        ))}{!allBooks.length && <div className="col-span-3 card text-center py-16"><BookMarked size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum livro cadastrado</p></div>}</div>
      </>)}

      {tab === 'loans' && (
        <div className="card p-0 overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr>{['Livro', 'Usuario', 'Emprestimo', 'Devolucao', 'Status', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead><tbody className="divide-y">{allLoans.map((l: any) => (
          <tr key={l.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 font-medium">{l.bookTitle}</td>
            <td className="px-4 py-3 text-gray-500">{l.userName}</td>
            <td className="px-4 py-3 text-gray-500">{l.loanDate ? new Date(l.loanDate).toLocaleDateString('pt-BR') : '—'}</td>
            <td className="px-4 py-3 text-gray-500">{l.dueDate ? new Date(l.dueDate).toLocaleDateString('pt-BR') : '—'}</td>
            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${l.status === 'active' ? 'bg-blue-100 text-blue-700' : l.status === 'returned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{l.status === 'active' ? 'Ativo' : l.status === 'returned' ? 'Devolvido' : l.status}</span></td>
            <td className="px-4 py-3">{l.status === 'active' && <button onClick={() => returnBook({ id: l.id }, { onSuccess: () => { rLoans(); rBooks(); } })} className="text-xs text-primary-500 hover:underline flex items-center gap-1"><RotateCcw size={12} /> Devolver</button>}</td>
          </tr>
        ))}{!allLoans.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Nenhum emprestimo</td></tr>}</tbody></table></div>
      )}

      {confirmDelete && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><Trash2 size={28} className="text-red-400 mx-auto mb-3" /><h3 className="font-bold mb-2">Excluir {confirmDelete.title}?</h3><div className="flex gap-3 mt-5"><button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={() => { deleteBook({ id: confirmDelete.id }, { onSuccess: () => { rBooks(); setConfirmDelete(null); } }); }} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar' : 'Novo'} Livro</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4"><div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Titulo *</label><input className="input" value={form.title} onChange={sf('title')} /></div>
          <div><label className="label">Autor</label><input className="input" value={form.author} onChange={sf('author')} /></div>
          <div><label className="label">ISBN</label><input className="input" value={form.isbn} onChange={sf('isbn')} /></div>
          <div><label className="label">Categoria</label><input className="input" value={form.category} onChange={sf('category')} placeholder="Didatico, Literatura..." /></div>
          <div><label className="label">Editora</label><input className="input" value={form.publisher} onChange={sf('publisher')} /></div>
          <div><label className="label">Ano</label><input className="input" type="number" value={form.year} onChange={sf('year')} /></div>
          <div><label className="label">Quantidade</label><input className="input" type="number" value={form.quantity} onChange={sf('quantity')} /></div>
          <div className="col-span-2"><label className="label">Localizacao</label><input className="input" value={form.location} onChange={sf('location')} placeholder="Estante A, Prateleira 3" /></div>
        </div></div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    </div>
  );
}
