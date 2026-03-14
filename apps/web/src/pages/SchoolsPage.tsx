import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { School, Plus, Trash2, X } from 'lucide-react';

function Modal({ title, onClose, children }: any) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md"><div className="flex items-center justify-between p-6 border-b border-gray-200"><h3 className="font-semibold text-gray-900">{title}</h3><button onClick={onClose}><X size={20} /></button></div><div className="p-6">{children}</div></div></div>;
}

export default function SchoolsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'fundamental', address: '', phone: '', email: '', directorName: '' });
  const { data: schools, refetch } = useQuery(() => api.schools.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.schools.create);
  const { mutate: remove } = useMutation(api.schools.delete);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const typeLabel = (t: string) => ({ infantil:'Infantil',fundamental:'Fundamental',medio:'Médio',tecnico:'Técnico',especial:'Especial' }[t]||t);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Escolas</h1><p className="text-gray-500 mt-1">{(schools as any)?.length ?? 0} escola(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShow(true)}><Plus size={16} /> Nova Escola</button>
      </div>
      <div className="grid gap-4">
        {(schools as any)?.map((s: any) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><School size={18} className="text-blue-600" /></div>
              <div><p className="font-semibold text-gray-900">{s.name}</p><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{typeLabel(s.type||'fundamental')}</span>{s.address && <span className="text-xs text-gray-500 ml-2">{s.address}</span>}</div>
            </div>
            <button className="p-2 text-gray-400 hover:text-red-500 rounded-lg" onClick={() => { if(confirm('Remover?')) remove({ id: s.id }, { onSuccess: refetch }); }}><Trash2 size={16} /></button>
          </div>
        ))}
        {!(schools as any)?.length && <div className="card text-center py-12"><School size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhuma escola</p><button className="btn-primary mt-4" onClick={() => setShow(true)}>Adicionar</button></div>}
      </div>
      {show && <Modal title="Nova Escola" onClose={() => setShow(false)}>
        <div className="space-y-3">
          <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={set('name')} /></div>
          <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={set('type')}><option value="infantil">Infantil</option><option value="fundamental">Fundamental</option><option value="medio">Médio</option><option value="tecnico">Técnico</option><option value="especial">Especial</option></select></div>
          <div><label className="label">Endereço</label><input className="input" value={form.address} onChange={set('address')} /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={set('phone')} /></div><div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div></div>
          <div><label className="label">Diretor</label><input className="input" value={form.directorName} onChange={set('directorName')} /></div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setShow(false)}>Cancelar</button>
            <button className="btn-primary flex-1" disabled={loading} onClick={() => create({ municipalityId, ...form }, { onSuccess: () => { refetch(); setShow(false); } })}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
