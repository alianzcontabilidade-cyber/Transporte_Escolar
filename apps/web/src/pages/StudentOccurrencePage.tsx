import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { AlertTriangle, Plus, Search, Printer, Trash2, X } from 'lucide-react';

interface Occurrence {
  id: number;
  studentId: number;
  studentName: string;
  date: string;
  type: string;
  description: string;
  action: string;
}

const OCC_TYPES = [
  { v: 'indisciplina', l: 'Indisciplina', color: 'bg-yellow-100 text-yellow-700' },
  { v: 'atraso', l: 'Atraso', color: 'bg-orange-100 text-orange-700' },
  { v: 'falta', l: 'Falta Injustificada', color: 'bg-red-100 text-red-700' },
  { v: 'elogio', l: 'Elogio/Destaque', color: 'bg-green-100 text-green-700' },
  { v: 'saude', l: 'Problema de Saúde', color: 'bg-blue-100 text-blue-700' },
  { v: 'outro', l: 'Outro', color: 'bg-gray-100 text-gray-700' },
];

export default function StudentOccurrencePage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: '', date: new Date().toISOString().split('T')[0], type: 'indisciplina', description: '', action: '' });
  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => {
    try { return JSON.parse(localStorage.getItem('netescol_occurrences_' + mid) || '[]'); } catch { return []; }
  });

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const allStudents = (studentsData as any) || [];

  const saveOccurrences = (occs: Occurrence[]) => {
    setOccurrences(occs);
    localStorage.setItem('netescol_occurrences_' + mid, JSON.stringify(occs));
  };

  const addOccurrence = () => {
    if (!form.studentId || !form.description) return;
    const student = allStudents.find((s: any) => String(s.id) === form.studentId);
    const occ: Occurrence = { id: Date.now(), studentId: parseInt(form.studentId), studentName: student?.name || '', date: form.date, type: form.type, description: form.description, action: form.action };
    saveOccurrences([occ, ...occurrences]);
    setShowModal(false);
    setForm({ studentId: '', date: new Date().toISOString().split('T')[0], type: 'indisciplina', description: '', action: '' });
  };

  const removeOccurrence = (id: number) => saveOccurrences(occurrences.filter(o => o.id !== id));

  const filtered = occurrences.filter(o => !search || o.studentName.toLowerCase().includes(search.toLowerCase()) || o.description.toLowerCase().includes(search.toLowerCase()));

  const printOccurrences = (studentId?: number) => {
    const list = studentId ? occurrences.filter(o => o.studentId === studentId) : filtered;
    const studentName = studentId ? allStudents.find((s: any) => s.id === studentId)?.name || '' : 'Todos os Alunos';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ocorrências - ${studentName}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:15px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px;text-align:left}
    td{padding:6px 8px;border:1px solid #ddd}tr:nth-child(even){background:#f8f9fa}
    .footer{margin-top:20px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>Registro de Ocorrências - ${studentName}</h1>
    <table><thead><tr><th>Data</th><th>Aluno</th><th>Tipo</th><th>Descrição</th><th>Providência</th></tr></thead>
    <tbody>${list.map(o => '<tr><td>'+new Date(o.date).toLocaleDateString('pt-BR')+'</td><td>'+o.studentName+'</td><td>'+(OCC_TYPES.find(t => t.v === o.type)?.l || o.type)+'</td><td>'+o.description+'</td><td>'+(o.action||'--')+'</td></tr>').join('')}</tbody></table>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertTriangle size={20} className="text-red-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1><p className="text-gray-500">{occurrences.length} registro(s)</p></div></div>
        <div className="flex gap-2">
          {filtered.length > 0 && <button onClick={() => printOccurrences()} className="btn-secondary flex items-center gap-2"><Printer size={16} /> Imprimir</button>}
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Nova Ocorrência</button>
        </div>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por aluno ou descrição..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <div className="space-y-3">
        {filtered.map(o => {
          const typeInfo = OCC_TYPES.find(t => t.v === o.type);
          return (
            <div key={o.id} className="card flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0"><AlertTriangle size={16} className="text-red-500" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{o.studentName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo?.color || 'bg-gray-100'}`}>{typeInfo?.l || o.type}</span>
                  <span className="text-xs text-gray-400">{new Date(o.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <p className="text-sm text-gray-600">{o.description}</p>
                {o.action && <p className="text-xs text-gray-500 mt-1"><b>Providência:</b> {o.action}</p>}
              </div>
              <button onClick={() => removeOccurrence(o.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button>
            </div>
          );
        })}
        {!filtered.length && <div className="card text-center py-16"><AlertTriangle size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhuma ocorrência registrada</p></div>}
      </div>

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold">Nova Ocorrência</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Aluno *</label><select className="input" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}><option value="">Selecione</option>{allStudents.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Data</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{OCC_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
          </div>
          <div><label className="label">Descrição *</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva a ocorrência..." /></div>
          <div><label className="label">Providência tomada</label><textarea className="input" rows={2} value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} placeholder="Descreva as providências..." /></div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={addOccurrence} className="btn-primary flex-1">Registrar</button></div>
      </div></div>)}
    </div>
  );
}
