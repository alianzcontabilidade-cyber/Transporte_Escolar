import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { MapPin, Plus, X, Clock } from 'lucide-react';

function Modal({ title, onClose, children }: any) {
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl w-full max-w-lg"><div className="flex items-center justify-between p-6 border-b"><h3 className="font-semibold">{title}</h3><button onClick={onClose}><X size={20}/></button></div><div className="p-6">{children}</div></div></div>;
}

export default function RoutesPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', type: 'both', shift: 'morning', scheduledStartTime: '06:30', scheduledEndTime: '07:30' });
  const { data: routes, refetch } = useQuery(() => api.routes.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.routes.create);
  const { mutate: remove } = useMutation(api.routes.delete);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const tl = (t: string) => ({ pickup:'Ida', dropoff:'Volta', both:'Ida e Volta' }[t]||t);
  const sl = (s: string) => ({ morning:'Manhã', afternoon:'Tarde', evening:'Noite' }[s]||s);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">Rotas</h1><p className="text-gray-500">{(routes as any)?.length ?? 0} rota(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShow(true)}><Plus size={16}/> Nova Rota</button>
      </div>
      <div className="grid gap-4">
        {(routes as any)?.map((r: any) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><MapPin size={18} className="text-purple-600"/></div>
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{sl(r.shift)}</span>
                    <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">{tl(r.type)}</span>
                    {r.scheduledStartTime && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={11}/>{r.scheduledStartTime}–{r.scheduledEndTime}</span>}
                  </div>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-red-500 rounded-lg" onClick={() => { if(confirm('Remover rota?')) remove({ id: r.id }, { onSuccess: refetch }); }}><X size={16}/></button>
            </div>
          </div>
        ))}
        {!(routes as any)?.length && <div className="card text-center py-12"><MapPin size={40} className="text-gray-300 mx-auto mb-3"/><p className="text-gray-500">Nenhuma rota</p><button className="btn-primary mt-4" onClick={() => setShow(true)}>Criar</button></div>}
      </div>
      {show && <Modal title="Nova Rota" onClose={() => setShow(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Nome *</label><input className="input" value={form.name} onChange={set('name')}/></div><div><label className="label">Código</label><input className="input" value={form.code} onChange={set('code')}/></div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={set('type')}><option value="pickup">Ida</option><option value="dropoff">Volta</option><option value="both">Ida e Volta</option></select></div>
            <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={set('shift')}><option value="morning">Manhã</option><option value="afternoon">Tarde</option><option value="evening">Noite</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Início</label><input className="input" type="time" value={form.scheduledStartTime} onChange={set('scheduledStartTime')}/></div><div><label className="label">Fim</label><input className="input" type="time" value={form.scheduledEndTime} onChange={set('scheduledEndTime')}/></div></div>
          <div><label className="label">Descrição</label><textarea className="input h-20 resize-none" value={form.description} onChange={set('description')}/></div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1" onClick={() => setShow(false)}>Cancelar</button>
            <button className="btn-primary flex-1" disabled={loading} onClick={() => create({ municipalityId, ...form }, { onSuccess: () => { refetch(); setShow(false); } })}>{loading ? 'Salvando...' : 'Criar'}</button>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
