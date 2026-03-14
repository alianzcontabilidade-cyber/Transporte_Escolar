import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Truck, Plus, X } from 'lucide-react';

function Modal({ title, onClose, children }: any) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-md"><div className="flex items-center justify-between p-6 border-b"><h3 className="font-semibold">{title}</h3><button onClick={onClose}><X size={20} /></button></div><div className="p-6">{children}</div></div></div>;
}

export default function DriversPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', cnhNumber: '', cnhCategory: 'D' });
  const { data: drivers, refetch } = useQuery(() => api.drivers.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.drivers.create);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Motoristas</h1><p className="text-gray-500">{(drivers as any)?.length ?? 0} motorista(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShow(true)}><Plus size={16} /> Novo Motorista</button>
      </div>
      <div className="grid gap-4">
        {(drivers as any)?.map((item: any) => (
          <div key={item.driver.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-700">{item.user.name?.[0]?.toUpperCase()}</div>
            <div className="flex-1"><p className="font-semibold">{item.user.name}</p><p className="text-sm text-gray-500">{item.user.email}</p></div>
            <span className={item.driver.isAvailable ? 'badge-green' : 'badge-yellow'}>{item.driver.isAvailable ? 'Disponível' : 'Em rota'}</span>
          </div>
        ))}
        {!(drivers as any)?.length && <div className="card text-center py-12"><Truck size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhum motorista</p><button className="btn-primary mt-4" onClick={() => setShow(true)}>Adicionar</button></div>}
      </div>
      {show && <Modal title="Novo Motorista" onClose={() => setShow(false)}>
        <div className="space-y-3">
          <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={set('name')} /></div>
          <div><label className="label">E-mail *</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
          <div><label className="label">Senha *</label><input className="input" type="password" value={form.password} onChange={set('password')} /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">CNH</label><input className="input" value={form.cnhNumber} onChange={set('cnhNumber')} /></div><div><label className="label">Categoria</label><select className="input" value={form.cnhCategory} onChange={set('cnhCategory')}><option>D</option><option>E</option></select></div></div>
          {err && <div className="bg-red-50 text-red-700 text-sm p-2 rounded">{err}</div>}
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setShow(false)}>Cancelar</button>
            <button className="btn-primary flex-1" disabled={loading} onClick={() => { setErr(''); create({ municipalityId, ...form }, { onSuccess: () => { refetch(); setShow(false); }, onError: setErr }); }}>{loading ? 'Criando...' : 'Criar'}</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
