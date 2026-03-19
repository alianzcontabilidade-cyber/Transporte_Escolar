import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Clock, Printer, Save } from 'lucide-react';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const PERIODS = ['1º Horário', '2º Horário', '3º Horário', '4º Horário', '5º Horário', '6º Horário'];

export default function ClassSchedulePage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selClass, setSelClass] = useState('');
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: subjectsData } = useQuery(() => api.subjects.list({ municipalityId: mid }), [mid]);

  const allClasses = (classesData as any) || [];
  const allSubjects = (subjectsData as any) || [];

  const getKey = (day: number, period: number) => `${day}-${period}`;
  const getSubject = (day: number, period: number) => schedule[getKey(day, period)] || '';

  const setSubject = (day: number, period: number, subjectId: string) => {
    setSchedule(prev => ({ ...prev, [getKey(day, period)]: subjectId }));
    setSaved(false);
  };

  const saveSchedule = () => {
    localStorage.setItem('netescol_schedule_' + selClass, JSON.stringify(schedule));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const loadSchedule = (classId: string) => {
    setSelClass(classId);
    try {
      const saved = localStorage.getItem('netescol_schedule_' + classId);
      setSchedule(saved ? JSON.parse(saved) : {});
    } catch { setSchedule({}); }
  };

  const printSchedule = () => {
    const cls = allClasses.find((c: any) => String(c.id) === selClass);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Grade Horária - ${cls?.fullName || ''}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;text-align:center;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    h2{text-align:center;color:#666;font-size:14px}
    table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#1B3A5C;color:white;padding:10px;text-align:center;font-size:12px}
    td{padding:8px;border:1px solid #ddd;text-align:center;font-size:12px;min-height:30px}
    .period{background:#f0f4f8;font-weight:bold;color:#1B3A5C;width:100px}
    .footer{margin-top:20px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>GRADE HORÁRIA</h1>
    <h2>${cls?.fullName || ''} - ${cls?.schoolName || ''} | ${cls?.shift === 'afternoon' ? 'Tarde' : cls?.shift === 'evening' ? 'Noite' : 'Manhã'}</h2>
    <table><thead><tr><th></th>${DAYS.map(d => '<th>' + d + '</th>').join('')}</tr></thead>
    <tbody>${PERIODS.map((p, pi) => '<tr><td class="period">' + p + '</td>' + DAYS.map((_, di) => {
      const subId = getSubject(di, pi);
      const sub = allSubjects.find((s: any) => String(s.id) === subId);
      return '<td>' + (sub?.name || '') + '</td>';
    }).join('') + '</tr>').join('')}</tbody></table>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><Clock size={20} className="text-violet-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Grade Horária</h1><p className="text-gray-500">Configure o horário de aulas por turma</p></div></div>
        {selClass && (
          <div className="flex gap-2">
            <button onClick={saveSchedule} className="btn-secondary flex items-center gap-2"><Save size={16} /> Salvar</button>
            <button onClick={printSchedule} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir</button>
          </div>
        )}
      </div>

      {saved && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">Grade horária salva com sucesso!</div>}

      <select className="input w-72 mb-5" value={selClass} onChange={e => loadSchedule(e.target.value)}>
        <option value="">Selecione a turma</option>
        {allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}
      </select>

      {selClass ? (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Horário</th>
                {DAYS.map(d => <th key={d} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{d}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERIODS.map((period, pi) => (
                <tr key={pi} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700 bg-gray-50">{period}</td>
                  {DAYS.map((_, di) => (
                    <td key={di} className="px-2 py-2">
                      <select className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent-400 bg-white"
                        value={getSubject(di, pi)} onChange={e => setSubject(di, pi, e.target.value)}>
                        <option value="">—</option>
                        {allSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16"><Clock size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione uma turma para configurar a grade horária</p></div>
      )}
    </div>
  );
}
