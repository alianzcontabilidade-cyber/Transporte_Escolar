import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Calendar, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const EVENT_TYPES: any = { aula:'Dia Letivo', feriado:'Feriado', recesso:'Recesso', reuniao:'Reunião', conselho:'Conselho', prova:'Avaliação', evento:'Evento', outro:'Outro' };
const EVENT_COLORS: any = { aula:'#22c55e', feriado:'#ef4444', recesso:'#f97316', reuniao:'#6366f1', conselho:'#8b5cf6', prova:'#0ea5e9', evento:'#2DB5B0', outro:'#64748b' };
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function CalendarPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ title:'', startDate:'', endDate:'', eventType:'evento', color:'#2DB5B0', description:'' });
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const { data: events, refetch } = useQuery(() => api.schoolCalendar.list({ municipalityId: mid }), [mid]);
  const { mutate: create } = useMutation(api.schoolCalendar.create);
  const { mutate: remove } = useMutation(api.schoolCalendar.delete);

  const allEvents = (events as any) || [];
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEvents.filter((e: any) => {
      const start = e.startDate ? e.startDate.split('T')[0] : '';
      const end = e.endDate ? e.endDate.split('T')[0] : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); };

  const save = () => {
    if (!form.title || !form.startDate) return;
    create({ municipalityId: mid, title: form.title, description: form.description || undefined, startDate: form.startDate, endDate: form.endDate || undefined, eventType: form.eventType, color: EVENT_COLORS[form.eventType] || form.color },
      { onSuccess: () => { refetch(); setShowModal(false); } });
  };

  const openNew = (day?: number) => {
    const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
    setForm({ title:'', startDate: dateStr, endDate:'', eventType:'evento', color:'#2DB5B0', description:'' });
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><Calendar size={20} className="text-violet-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Calendário Escolar</h1><p className="text-gray-500">Eventos, feriados e datas importantes</p></div></div>
        <button onClick={() => openNew()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Evento</button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(EVENT_TYPES).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: EVENT_COLORS[k] }} /><span className="text-gray-600">{v as string}</span></div>
        ))}
      </div>

      {/* Navegação do mês */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-bold text-gray-800">{MONTHS[currentMonth]} {currentYear}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={'empty-' + i} />)}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
            return (
              <div key={day} onClick={() => { setSelectedDay({ day, events: dayEvents }); if (dayEvents.length === 0) openNew(day); }}
                className={`min-h-[70px] p-1.5 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${isToday ? 'border-accent-500 bg-accent-50' : 'border-gray-100'}`}>
                <p className={`text-sm font-medium ${isToday ? 'text-accent-600' : 'text-gray-700'}`}>{day}</p>
                <div className="space-y-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map((e: any) => (
                    <div key={e.id} className="text-[10px] px-1 py-0.5 rounded truncate text-white" style={{ backgroundColor: EVENT_COLORS[e.eventType] || e.color || '#64748b' }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <p className="text-[10px] text-gray-400">+{dayEvents.length - 2} mais</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de eventos do mês */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Eventos de {MONTHS[currentMonth]}</h3>
        <div className="space-y-2">
          {allEvents.filter((e: any) => { const d = new Date(e.startDate); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; }).map((e: any) => (
            <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_COLORS[e.eventType] || e.color }} />
              <div className="flex-1"><p className="text-sm font-medium text-gray-800">{e.title}</p><p className="text-xs text-gray-500">{new Date(e.startDate).toLocaleDateString('pt-BR')} {e.description ? '- ' + e.description : ''}</p></div>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{EVENT_TYPES[e.eventType] || e.eventType}</span>
              <button onClick={() => remove({ id: e.id }, { onSuccess: () => refetch() })} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
          {!allEvents.filter((e: any) => { const d = new Date(e.startDate); return d.getMonth() === currentMonth; }).length && <p className="text-gray-400 text-sm text-center py-4">Nenhum evento neste mês</p>}
        </div>
      </div>

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">Novo Evento</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Título *</label><input className="input" value={form.title} onChange={sf('title')} placeholder="Ex: Feriado Municipal" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Data início *</label><input className="input" type="date" value={form.startDate} onChange={sf('startDate')} /></div>
            <div><label className="label">Data fim</label><input className="input" type="date" value={form.endDate} onChange={sf('endDate')} /></div>
          </div>
          <div><label className="label">Tipo</label><select className="input" value={form.eventType} onChange={sf('eventType')}>{Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
          <div><label className="label">Descrição</label><textarea className="input" rows={2} value={form.description} onChange={sf('description')} /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">Salvar</button></div>
      </div></div>)}
    </div>
  );
}
