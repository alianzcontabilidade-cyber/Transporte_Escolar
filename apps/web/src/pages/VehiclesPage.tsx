import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Bus, Plus, X } from 'lucide-react';

function Modal({ title, onClose, children }: any) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md"><div className="flex items-center justify-between p-6 border-b"><h3 className="font-semibold">{title}</h3><button onClick={onClose}><X size={20}/></button></div><div className="p-6">{children}</div></div></div>;
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ plate: '', nickname: '', brand: '', model: '', year: '', capacity: '40' });
  const { data: vehicles, refetch } = useQuery(() => api.vehicles.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.vehicles.create);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const sc = (s: string) => ({ active:'badge-green',maintenance:'badge-yellow',inactive:'badge-red' }[s]||'badge-gray');
  const sl = (s: string) => ({ active:'Ativo',maintenance:'Manutenção',inactive:'Inativo' }[s]||s);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Veículos</h1><p className="text-gray-500">{(vehicles as any)?.length ?? 0} veículo(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShow(true)}><Plus size={16}/> Novo Veículo</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(vehicles as any)?.map((v: any) => (
          <div key={v.id} className="card">
            <div className="flex items-start justify-between mb-3"><div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><Bus size={18} className="text-primary-600"/></div><span className={sc(v.status)}>{sl(v.status)}</span></div>
            <p className="font-bold text-gray-900 text-lg">{v.plate}</p>
            {v.nickname && <p className="text-primary-600 text-sm">{v.nickname}</p>}
            <p className="text-sm text-gray-500">{[v.brand,v.model,v.year].filter(Boolean).join(' ')}</p>
            {v.capacity && <p className="text-xs text-gray-400 mt-1">Capacidade: {v.capacity}</p>}
          </div>
        ))}
        {!(vehicles as any)?.length && <div className="col-span-3 card text-center py-12"><Bus size={40} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">Nenhum veículo</p><button className="btn-primary mt-4" onClick={() => setShow(true)}>Adicionar</button></div>}
      </div>
      {show && <Modal title="Novo Veículo" onClose={() => setShow(false)}>
        <div className="space-y-3">
          <div><label className="label">Placa *</label><input className="input" placeholder="ABC-1234" value={form.plate} onChange={set('plate')}/></div>
          <div><label className="label">Apelido</label><input className="input" value={form.nickname} onChange={set('nickname')}/></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Marca</label><input className="input" value={form.brand} onChange={set('brand')}/></div><div><label className="label">Modelo</label><input className="input" value={form.model} onChange={set('model')}/></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Ano</label><input className="input" type="number" value={form.year} onChange={set('year')}/></div><div><label className="label">Capacidade</label><input className="input" type="number" value={form.capacity} onChange={set('capacity')}/></div></div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setShow(false)}>Cancelar</button>
            <button className="btn-primary flex-1" disabled={loading} onClick={() => create({ municipalityId, plate: form.plate, nickname: form.nickname||undefined, brand: form.brand||undefined, model: form.model||undefined, year: form.year ? parseInt(form.year) : undefined, capacity: form.capacity ? parseInt(form.capacity) : undefined }, { onSuccess: () => { refetch(); setShow(false); } })}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
