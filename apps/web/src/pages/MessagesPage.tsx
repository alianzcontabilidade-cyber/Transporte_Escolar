import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { MessageSquare, Plus, X, Trash2, Send, AlertCircle, Bell, Search } from 'lucide-react';

const PRIORITIES: any = { normal:'Normal', important:'Importante', urgent:'Urgente' };
const PRIORITY_COLORS: any = { normal:'bg-gray-100 text-gray-700', important:'bg-yellow-100 text-yellow-700', urgent:'bg-red-100 text-red-700' };
const TARGETS: any = { all:'Todos', school:'Escola', class:'Turma', student:'Aluno', staff:'Servidores' };

export default function MessagesPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>({ title:'', content:'', targetType:'all', priority:'normal', schoolId:'', classId:'', studentId:'' });
  const [studentSearch, setStudentSearch] = useState('');
  const { data: msgs, refetch } = useQuery(() => api.messages.list({ municipalityId: mid }), [mid]);
  const { mutate: create, loading } = useMutation(api.messages.create);
  const { mutate: remove } = useMutation(api.messages.delete);

  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid, search: studentSearch || undefined }), [mid, studentSearch]);

  const allSchools = (schoolsData as any) || [];
  const allClasses = (classesData as any) || [];
  const allStudents = (studentsData as any) || [];
  const all = (msgs as any) || [];
  const sf = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const resetTarget = () => setForm((f: any) => ({ ...f, schoolId: '', classId: '', studentId: '' }));

  const save = () => {
    if (!form.title || !form.content) return;
    const payload: any = { municipalityId: mid, title: form.title, content: form.content, targetType: form.targetType, priority: form.priority };
    if (form.targetType === 'school' && form.schoolId) payload.schoolId = parseInt(form.schoolId);
    if (form.targetType === 'class' && form.classId) payload.targetClassId = parseInt(form.classId);
    if (form.targetType === 'student' && form.studentId) payload.targetStudentId = parseInt(form.studentId);
    create(payload,
      { onSuccess: () => { refetch(); setShowModal(false); setForm({ title:'', content:'', targetType:'all', priority:'normal', schoolId:'', classId:'', studentId:'' }); setStudentSearch(''); } });
  };

  const targetLabel = (m: any) => {
    if (m.targetType === 'school' && m.schoolName) return `Escola: ${m.schoolName}`;
    return TARGETS[m.targetType] || m.targetType;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><MessageSquare size={20} className="text-blue-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Comunicacao</h1><p className="text-gray-500">{all.length} recado(s)</p></div></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Novo Recado</button>
      </div>

      <div className="space-y-3">
        {all.map((m: any) => (
          <div key={m.id} className={`card ${m.priority === 'urgent' ? 'border-red-200 bg-red-50/30' : m.priority === 'important' ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {m.priority === 'urgent' && <AlertCircle size={16} className="text-red-500" />}
                {m.priority === 'important' && <Bell size={16} className="text-yellow-500" />}
                <h3 className="font-semibold text-gray-800">{m.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[m.priority]}`}>{PRIORITIES[m.priority]}</span>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{targetLabel(m)}</span>
              </div>
              <button onClick={() => remove({ id: m.id }, { onSuccess: refetch })} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-2">{m.content}</p>
            <p className="text-xs text-gray-400">Por {m.senderName} em {new Date(m.createdAt).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        ))}
        {!all.length && <div className="card text-center py-16"><MessageSquare size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Nenhum recado enviado</p></div>}
      </div>

      {showModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold flex items-center gap-2"><Send size={18} className="text-blue-500" /> Novo Recado</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
        <div className="p-5 space-y-4">
          <div><label className="label">Titulo *</label><input className="input" value={form.title} onChange={sf('title')} placeholder="Assunto do recado" /></div>
          <div><label className="label">Mensagem *</label><textarea className="input" rows={4} value={form.content} onChange={sf('content')} placeholder="Digite o conteudo do recado..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Destinatario</label><select className="input" value={form.targetType} onChange={(e) => { sf('targetType')(e); resetTarget(); }}>{Object.entries(TARGETS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
            <div><label className="label">Prioridade</label><select className="input" value={form.priority} onChange={sf('priority')}>{Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
          </div>

          {form.targetType === 'school' && (
            <div><label className="label">Selecione a escola</label><select className="input" value={form.schoolId} onChange={sf('schoolId')}><option value="">Todas as escolas</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          )}

          {form.targetType === 'class' && (
            <div><label className="label">Selecione a turma</label><select className="input" value={form.classId} onChange={sf('classId')}><option value="">Selecione uma turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.schoolName ? ` - ${c.schoolName}` : ''}</option>)}</select></div>
          )}

          {form.targetType === 'student' && (
            <div>
              <label className="label">Selecione o aluno</label>
              <div className="relative mb-2"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno pelo nome..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} /></div>
              <select className="input" value={form.studentId} onChange={sf('studentId')}><option value="">Selecione um aluno</option>{allStudents.slice(0, 50).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2"><Send size={14} />{loading ? 'Enviando...' : 'Enviar Recado'}</button></div>
      </div></div>)}
    </div>
  );
}
