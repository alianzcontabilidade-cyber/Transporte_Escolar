import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { PartyPopper, Plus, X, Pencil, Trash2, Calendar, Users, MapPin, Printer, Search } from 'lucide-react';

interface SchoolEvent {
  id: number;
  title: string;
  date: string;
  endDate: string;
  type: string;
  location: string;
  description: string;
  responsible: string;
  estimatedParticipants: number;
  budget: number;
  status: string;
}

const EVENT_TYPES = ['Festa Junina', 'Feira de Ciências', 'Formatura', 'Reunião de Pais', 'Excursão', 'Semana Cultural', 'Jogos Escolares', 'Palestra', 'Workshop', 'Outro'];
const STATUS_MAP: any = { planejado: { l: 'Planejado', c: 'bg-blue-100 text-blue-700' }, confirmado: { l: 'Confirmado', c: 'bg-green-100 text-green-700' }, cancelado: { l: 'Cancelado', c: 'bg-red-100 text-red-700' }, concluido: { l: 'Concluído', c: 'bg-gray-100 text-gray-600' } };

export default function EventManagementPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<any>({ title: '', date: '', endDate: '', type: 'Outro', location: '', description: '', responsible: '', estimatedParticipants: '', budget: '', status: 'planejado' });
  const [events, setEvents] = useState<SchoolEvent[]>(() => { try { return JSON.parse(localStorage.getItem('netescol_events_' + mid) || '[]'); } catch { return []; } });

  const saveEvents = (e: SchoolEvent[]) => { setEvents(e); localStorage.setItem('netescol_events_' + mid, JSON.stringify(e)); };
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    if (!form.title || !form.date) return;
    const ev: SchoolEvent = { id: editId || Date.now(), title: form.title, date: form.date, endDate: form.endDate, type: form.type, location: form.location, description: form.description, responsible: form.responsible, estimatedParticipants: parseInt(form.estimatedParticipants) || 0, budget: parseFloat(form.budget) || 0, status: form.status };
    if (editId) saveEvents(events.map(e => e.id === editId ? ev : e));
    else saveEvents([ev, ...events]);
    setShowModal(false); setEditId(null); setForm({ title: '', date: '', endDate: '', type: 'Outro', location: '', description: '', responsible: '', estimatedParticipants: '', budget: '', status: 'planejado' });
  };

  const openEdit = (ev: SchoolEvent) => { setForm({ ...ev, estimatedParticipants: String(ev.estimatedParticipants || ''), budget: String(ev.budget || '') }); setEditId(ev.id); setShowModal(true); };
  const remove = (id: number) => saveEvents(events.filter(e => e.id !== id));
  const filtered = events.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.type.toLowerCase().includes(search.toLowerCase()));
  const upcoming = events.filter(e => e.status !== 'concluido' && e.status !== 'cancelado' && new Date(e.date) >= new Date()).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center"><PartyPopper size={20} className="text-pink-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Gestão de Eventos</h1><p className="text-gray-500">{events.length} evento(s) · {upcoming} próximo(s)</p></div></div>
        <button onClick={() => { setForm({ title: '', date: '', endDate: '', type: 'Outro', location: '', description: '', responsible: '', estimatedParticipants: '', budget: '', status: 'planejado' }); setEditId(null); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Evento</button>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar evento..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(ev => (
          <div key={ev.id} className="card hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[ev.status]?.c || ''}`}>{STATUS_MAP[ev.status]?.l || ev.status}</span><span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">{ev.type}</span></div>
              <div className="flex gap-1"><button onClick={() => openEdit(ev)} className="p-1 text-gray-400 hover:text-primary-500 rounded"><Pencil size={14} /></button><button onClick={() => remove(ev.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button></div>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{ev.title}</h3>
            <div className="space-y-1 text-xs text-gray-500">
              <p className="flex items-center gap-1"><Calendar size={10} />{new Date(ev.date).toLocaleDateString('pt-BR')}{ev.endDate ? ' a ' + new Date(ev.endDate).toLocaleDateString('pt-BR') : ''}</p>
              {ev.location && <p className="flex items-center gap-1"><MapPin size={10} />{ev.location}</p>}
              {ev.responsible && <p className="flex items-center gap-1"><Users size={10} />{ev.responsible}</p>}
              {ev.estimatedParticipants > 0 && <p>{ev.estimatedParticipants} participantes</p>}
              {ev.budget > 0 && <p>Orçamento: R$ {ev.budget.toFixed(2)}</p>}
            </div>
          </div>
        ))}
        {!filtered.length && <div className="col-span-3 card text-center py-16"><PartyPopper size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum evento cadastrado</p></div>}
      </div>

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar' : 'Novo'} Evento</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div><label className="label">Título *</label><input className="input" value={form.title} onChange={sf('title')} placeholder="Ex: Festa Junina 2026" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Data início *</label><input className="input" type="date" value={form.date} onChange={sf('date')} /></div>
            <div><label className="label">Data fim</label><input className="input" type="date" value={form.endDate} onChange={sf('endDate')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={sf('type')}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label">Status</label><select className="input" value={form.status} onChange={sf('status')}>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{(v as any).l}</option>)}</select></div>
          </div>
          <div><label className="label">Local</label><input className="input" value={form.location} onChange={sf('location')} placeholder="Pátio da escola, auditório..." /></div>
          <div><label className="label">Responsável</label><input className="input" value={form.responsible} onChange={sf('responsible')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Participantes estimados</label><input className="input" type="number" value={form.estimatedParticipants} onChange={sf('estimatedParticipants')} /></div>
            <div><label className="label">Orçamento (R$)</label><input className="input" type="number" step="0.01" value={form.budget} onChange={sf('budget')} /></div>
          </div>
          <div><label className="label">Descrição</label><textarea className="input" rows={3} value={form.description} onChange={sf('description')} /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    </div>
  );
}
