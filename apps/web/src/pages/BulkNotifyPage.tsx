import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Send, Users, MessageCircle, School, CheckCircle, Filter } from 'lucide-react';

export default function BulkNotifyPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [filterSchool, setFilterSchool] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [message, setMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);

  const allStudents = ((studentsData as any) || []).filter((s: any) => {
    if (filterSchool && String(s.schoolId) !== filterSchool) return false;
    if (filterGrade && s.grade !== filterGrade) return false;
    return true;
  });
  const allSchools = (schoolsData as any) || [];
  const grades = [...new Set(((studentsData as any) || []).map((s: any) => s.grade).filter(Boolean))];

  const studentsWithPhone = allStudents.filter((s: any) => s.emergencyContact1Phone || s.guardian1Phone);

  const toggleAll = () => {
    if (selectedStudents.length === studentsWithPhone.length) setSelectedStudents([]);
    else setSelectedStudents(studentsWithPhone.map((s: any) => s.id));
  };

  const sendMessages = () => {
    if (!message.trim() || selectedStudents.length === 0) return;
    setSending(true);
    setSent(0);

    const students = studentsWithPhone.filter((s: any) => selectedStudents.includes(s.id));
    let count = 0;

    students.forEach((s: any, i: number) => {
      setTimeout(() => {
        const phone = (s.emergencyContact1Phone || s.guardian1Phone || '').replace(/\D/g, '');
        const whatsPhone = phone.length === 11 ? '55' + phone : phone;
        const msg = message.replace('{aluno}', s.name).replace('{escola}', s.school || '').replace('{serie}', s.grade || '');
        window.open('https://wa.me/' + whatsPhone + '?text=' + encodeURIComponent(msg), '_blank');
        count++;
        setSent(count);
        if (count === students.length) setSending(false);
      }, i * 1500);
    });
  };

  const templates = [
    { label: 'Reunião de Pais', text: 'Prezado(a) responsável de {aluno}, convidamos para a reunião de pais e mestres que será realizada na escola. Contamos com sua presença! - NetEscol' },
    { label: 'Aviso Geral', text: 'Prezado(a) responsável de {aluno}, informamos que não haverá aula amanhã. Atenciosamente, {escola} - NetEscol' },
    { label: 'Transporte', text: 'Prezado(a) responsável de {aluno}, informamos alteração na rota do transporte escolar. Em caso de dúvidas, entre em contato com a escola. - NetEscol' },
    { label: 'Lembrete', text: 'Prezado(a) responsável de {aluno}, lembramos que a entrega dos documentos deve ser realizada até sexta-feira. - NetEscol' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><MessageCircle size={20} className="text-green-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Envio em Massa (WhatsApp)</h1><p className="text-gray-500">Enviar mensagem para responsáveis dos alunos</p></div></div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Filters + Student list */}
        <div>
          <div className="flex gap-2 mb-3">
            <select className="input text-sm" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}><option value="">Todas escolas</option>{allSchools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <select className="input text-sm" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}><option value="">Todas séries</option>{grades.map((g: any) => <option key={g} value={g}>{g}</option>)}</select>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{studentsWithPhone.length} com telefone</span>
            <button onClick={toggleAll} className="text-xs text-accent-500 hover:underline">{selectedStudents.length === studentsWithPhone.length ? 'Desmarcar todos' : 'Selecionar todos'}</button>
          </div>
          <div className="max-h-[55vh] overflow-y-auto space-y-1 border rounded-xl p-2">
            {studentsWithPhone.map((s: any) => (
              <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} className="rounded" />
                <div className="min-w-0"><p className="text-sm font-medium truncate">{s.name}</p><p className="text-[10px] text-gray-400">{s.emergencyContact1Phone || s.guardian1Phone}</p></div>
              </label>
            ))}
            {!studentsWithPhone.length && <p className="text-center py-8 text-sm text-gray-400">Nenhum aluno com telefone cadastrado</p>}
          </div>
        </div>

        {/* Right: Message */}
        <div className="col-span-2">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Mensagem</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {templates.map(t => (
                <button key={t.label} onClick={() => setMessage(t.text)} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors">{t.label}</button>
              ))}
            </div>
            <textarea className="input" rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="Digite a mensagem... Use {aluno} para inserir o nome do aluno, {escola} para a escola." />
            <p className="text-xs text-gray-400 mt-2">Variáveis: {'{aluno}'} = nome do aluno, {'{escola}'} = nome da escola, {'{serie}'} = série</p>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-gray-700">{selectedStudents.length} destinatário(s)</p>
                {sending && <p className="text-xs text-green-600">{sent} de {selectedStudents.length} enviado(s)...</p>}
              </div>
              <button onClick={sendMessages} disabled={sending || !message.trim() || selectedStudents.length === 0} className="btn-primary flex items-center gap-2">
                <Send size={16} /> {sending ? 'Enviando...' : 'Enviar via WhatsApp'}
              </button>
            </div>
          </div>

          <div className="card mt-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">Como funciona?</p>
            <p className="text-xs text-yellow-700 mt-1">O sistema abrirá uma aba do WhatsApp para cada destinatário com a mensagem pré-preenchida. Você precisará confirmar o envio em cada aba. Para envio automático, é necessário integrar com a API Business do WhatsApp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}