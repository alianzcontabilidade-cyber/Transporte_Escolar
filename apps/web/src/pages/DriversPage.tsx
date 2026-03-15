import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Truck, Plus, X, Camera, FileText, Star } from 'lucide-react';

function PhotoUpload({ value, onChange, label }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover" /> : <Camera size={28} className="text-gray-400" />}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => onChange(ev.target?.result as string); r.readAsDataURL(f); } }} />
    </div>
  );
}

const emptyForm = { name:'',email:'',phone:'',password:'',photo:'',cpf:'',birthDate:'',address:'',city:'',cnhNumber:'',cnhCategory:'D',cnhExpiry:'',experience:'',observations:'' };

export default function DriversPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [tab, setTab] = useState<'dados'|'cnh'|'outros'>('dados');
  const [err, setErr] = useState('');
  const [form, setForm] = useState<any>(emptyForm);
  const { data: drivers, refetch } = useQuery(() => api.drivers.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.drivers.create);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));
  const openNew = () => { setForm(emptyForm); setErr(''); setTab('dados'); setShow(true); };
  const handleSave = () => { setErr(''); create({ municipalityId, ...form }, { onSuccess: () => { refetch(); setShow(false); }, onError: (e: any) => setErr(e?.message||'Erro') }); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Motoristas</h1><p className="text-gray-500">{(drivers as any)?.length ?? 0} motorista(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}><Plus size={16} /> Novo Motorista</button>
      </div>
      <div className="grid gap-3">
        {(drivers as any)?.map((item: any) => (
          <div key={item.driver.id} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center flex-shrink-0">
              {item.driver.photo ? <img src={item.driver.photo} alt={item.user.name} className="w-full h-full object-cover" /> : <span className="font-bold text-orange-700 text-lg">{item.user.name?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{item.user.name}</p>
              <p className="text-sm text-gray-500">{item.user.email}</p>
              {item.driver.cnhNumber && <p className="text-xs text-gray-400 flex items-center gap-1"><FileText size={10} /> CNH {item.driver.cnhNumber} — Cat. {item.driver.cnhCategory}</p>}
            </div>
            <div className="flex items-center gap-2">
              {item.driver.experience && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={10} /> {item.driver.experience} anos</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.driver.isAvailable?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{item.driver.isAvailable?'Disponível':'Em rota'}</span>
            </div>
          </div>
        ))}
        {!(drivers as any)?.length && <div className="card text-center py-12"><Truck size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Nenhum motorista</p><button className="btn-primary mt-4" onClick={openNew}>Adicionar</button></div>}
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">Novo Motorista</h3><button onClick={() => setShow(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
            <div className="flex gap-1 px-5 pt-4">{(['dados','cnh','outros'] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700'}`}>{t==='dados'?'Dados Pessoais':t==='cnh'?'CNH':'Outros'}</button>))}</div>
            <div className="overflow-y-auto flex-1 p-5">
              {err && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
              {tab==='dados' && (
                <div className="space-y-4">
                  <div className="flex justify-center mb-4"><PhotoUpload value={form.photo} onChange={(v: string) => setForm((f: any) => ({...f,photo:v}))} label="Foto do motorista (clique para importar)" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={set('name')} /></div>
                    <div><label className="label">CPF</label><input className="input" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" /></div>
                    <div><label className="label">Data de Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} /></div>
                    <div><label className="label">E-mail *</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
                    <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="(00) 00000-0000" /></div>
                    <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={set('address')} /></div>
                    <div><label className="label">Cidade</label><input className="input" value={form.city} onChange={set('city')} /></div>
                    <div><label className="label">Senha *</label><input className="input" type="password" value={form.password} onChange={set('password')} /></div>
                  </div>
                </div>
              )}
              {tab==='cnh' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><FileText size={14} /> Carteira Nacional de Habilitação</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="label">Número da CNH *</label><input className="input" value={form.cnhNumber} onChange={set('cnhNumber')} /></div>
                      <div><label className="label">Categoria</label><select className="input" value={form.cnhCategory} onChange={set('cnhCategory')}>{['D','E','C','B'].map(c => <option key={c}>{c}</option>)}</select></div>
                      <div><label className="label">Validade da CNH</label><input className="input" type="date" value={form.cnhExpiry} onChange={set('cnhExpiry')} /></div>
                      <div><label className="label">Anos de experiência</label><input className="input" type="number" min="0" value={form.experience} onChange={set('experience')} placeholder="Ex: 5" /></div>
                    </div>
                  </div>
                </div>
              )}
              {tab==='outros' && (<div className="space-y-4"><div><label className="label">Observações</label><textarea className="input" rows={4} value={form.observations} onChange={set('observations')} placeholder="Informações adicionais..." /></div></div>)}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={() => setShow(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleSave} disabled={loading} className="btn-primary flex-1">{loading?'Salvando...':'Salvar Motorista'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
                }
