import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Calendar, Plus, X, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react';
import { getHolidays } from '../lib/cnpjCep';

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
  const [editId, setEditId] = useState<number|null>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const { data: events, refetch } = useQuery(() => api.schoolCalendar.list({ municipalityId: mid }), [mid]);
  const { mutate: create } = useMutation(api.schoolCalendar.create);
  const { mutate: update } = useMutation(api.schoolCalendar.update);
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
    const payload = { municipalityId: mid, title: form.title, description: form.description || undefined, startDate: form.startDate, endDate: form.endDate || undefined, eventType: form.eventType, color: EVENT_COLORS[form.eventType] || form.color };
    const onSuccess = () => { refetch(); setShowModal(false); setEditId(null); setSelectedDay(null); };
    if (editId) {
      update({ id: editId, ...payload }, { onSuccess });
    } else {
      create(payload, { onSuccess });
    }
  };

  const importHolidays = async () => {
    setImporting(true);
    setImportMsg('');
    try {
      const holidays = await getHolidays(currentYear);
      let added = 0;
      for (const h of holidays) {
        // Check if already exists
        const exists = allEvents.some((e: any) => {
          const eDate = e.startDate ? e.startDate.split('T')[0] : '';
          return eDate === h.date;
        });
        if (exists) continue;
        await api.schoolCalendar.create({
          municipalityId: mid,
          title: h.name,
          startDate: h.date,
          eventType: 'feriado' as any,
          color: '#ef4444',
        });
        added++;
      }
      setImportMsg(added > 0 ? `${added} feriado(s) importado(s) com sucesso!` : 'Todos os feriados já estão cadastrados.');
      refetch();
    } catch (e: any) { setImportMsg('Erro: ' + e.message); }
    finally { setImporting(false); setTimeout(() => setImportMsg(''), 5000); }
  };

  const openNew = (day?: number) => {
    const dateStr = day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
    setForm({ title:'', startDate: dateStr, endDate:'', eventType:'evento', color:'#2DB5B0', description:'' });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (event: any) => {
    setForm({
      title: event.title || '',
      startDate: event.startDate ? event.startDate.split('T')[0] : '',
      endDate: event.endDate ? event.endDate.split('T')[0] : '',
      eventType: event.eventType || 'evento',
      color: event.color || '#2DB5B0',
      description: event.description || '',
    });
    setEditId(event.id);
    setShowModal(true);
  };

  const confirmDelete = (event: any) => {
    setDeleteConfirm(event);
  };

  const executeDelete = () => {
    if (!deleteConfirm) return;
    remove({ id: deleteConfirm.id }, { onSuccess: () => { refetch(); setDeleteConfirm(null); setSelectedDay(null); } });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><Calendar size={20} className="text-violet-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Calendário Escolar</h1><p className="text-gray-500">Eventos, feriados e datas importantes</p></div></div>
        <div className="flex gap-2"><button onClick={importHolidays} disabled={importing} className="btn-secondary flex items-center gap-2">{importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Importar Feriados {currentYear}</button><button onClick={() => openNew()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Evento</button></div>
      </div>

      {importMsg && <div className={`mb-4 p-3 rounded-lg text-sm ${importMsg.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{importMsg}</div>}

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
              <div key={day} onClick={() => { if (dayEvents.length === 0) { openNew(day); } else { setSelectedDay({ day, events: dayEvents }); } }}
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
              <button onClick={() => openEdit(e)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil size={14} /></button>
              <button onClick={() => confirmDelete(e)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
          {!allEvents.filter((e: any) => { const d = new Date(e.startDate); return d.getMonth() === currentMonth; }).length && <p className="text-gray-400 text-sm text-center py-4">Nenhum evento neste mês</p>}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDay && selectedDay.events.length > 0 && (
        <div className="card mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Eventos do dia {selectedDay.day} de {MONTHS[currentMonth]}</h3>
            <div className="flex gap-2">
              <button onClick={() => openNew(selectedDay.day)} className="btn-secondary text-xs flex items-center gap-1"><Plus size={14} /> Novo evento neste dia</button>
              <button onClick={() => setSelectedDay(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
          </div>
          <div className="space-y-2">
            {selectedDay.events.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: EVENT_COLORS[e.eventType] || e.color }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{e.title}</p>
                  <p className="text-xs text-gray-500">{EVENT_TYPES[e.eventType] || e.eventType} {e.description ? '- ' + e.description : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(e.startDate).toLocaleDateString('pt-BR')}{e.endDate ? ' ate ' + new Date(e.endDate).toLocaleDateString('pt-BR') : ''}</p>
                </div>
                <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Pencil size={14} /></button>
                <button onClick={() => confirmDelete(e)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">{editId ? 'Editar Evento' : 'Novo Evento'}</h3><button onClick={() => { setShowModal(false); setEditId(null); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Titulo *</label><input className="input" value={form.title} onChange={sf('title')} placeholder="Ex: Feriado Municipal" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Data inicio *</label><input className="input" type="date" value={form.startDate} onChange={sf('startDate')} /></div>
            <div><label className="label">Data fim</label><input className="input" type="date" value={form.endDate} onChange={sf('endDate')} /></div>
          </div>
          <div><label className="label">Tipo</label><select className="input" value={form.eventType} onChange={sf('eventType')}>{Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
          <div><label className="label">Descricao</label><textarea className="input" rows={2} value={form.description} onChange={sf('description')} /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => { setShowModal(false); setEditId(null); }} className="btn-secondary flex-1">Cancelar</button><button onClick={save} className="btn-primary flex-1">{editId ? 'Atualizar' : 'Salvar'}</button></div>
      </div></div>)}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3"><Trash2 size={24} className="text-red-500" /></div>
        <h3 className="font-bold text-gray-900 mb-2">Excluir evento?</h3>
        <p className="text-sm text-gray-500 mb-1 font-medium">{deleteConfirm.title}</p>
        <p className="text-xs text-gray-400 mb-5">Esta acao nao pode ser desfeita.</p>
        <div className="flex gap-3"><button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button><button onClick={executeDelete} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
      </div></div>)}
    </div>
  );
}
