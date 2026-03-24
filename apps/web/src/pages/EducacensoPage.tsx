import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, showInfoToast, showErrorToast, showSuccessToast } from '../lib/hooks';
import { api } from '../lib/api';
import { Database, Download, School, Users, GraduationCap, BookOpen, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

function exportCSV(data: any[], filename: string, headers?: string[]) {
  if (!data?.length) return;
  const keys = headers || Object.keys(data[0]);
  const csv = [keys.join(';'), ...data.map(r => keys.map(k => '"' + ((r as any)[k] ?? '') + '"').join(';'))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); a.download = filename; a.click();
}

export default function EducacensoPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [exporting, setExporting] = useState('');

  const { data: summary } = useQuery(() => api.educacenso.summary({ municipalityId: mid }), [mid]);
  const s = summary as any;

  const doExport = async (type: string) => {
    setExporting(type);
    try {
      let data: any[];
      let filename: string;
      if (type === 'schools') { data = await api.educacenso.exportSchools({ municipalityId: mid }); filename = 'educacenso_escolas.csv'; }
      else if (type === 'students') { data = await api.educacenso.exportStudents({ municipalityId: mid }); filename = 'educacenso_alunos.csv'; }
      else if (type === 'teachers') { data = await api.educacenso.exportTeachers({ municipalityId: mid }); filename = 'educacenso_docentes.csv'; }
      else { data = await api.educacenso.exportClasses({ municipalityId: mid }); filename = 'educacenso_turmas.csv'; }
      exportCSV(data, filename);
    } catch (e: any) { showErrorToast(e.message); }
    finally { setExporting(''); }
  };

  const checks = [
    { label: 'Escolas cadastradas', value: s?.totals?.schools || 0, ok: (s?.totals?.schools || 0) > 0 },
    { label: 'Alunos matriculados', value: s?.totals?.students || 0, ok: (s?.totals?.students || 0) > 0 },
    { label: 'Professores cadastrados', value: s?.totals?.teachers || 0, ok: (s?.totals?.teachers || 0) > 0 },
    { label: 'Turmas criadas', value: s?.totals?.classes || 0, ok: (s?.totals?.classes || 0) > 0 },
    { label: 'Matriculas ativas', value: s?.totals?.enrollments || 0, ok: (s?.totals?.enrollments || 0) > 0 },
  ];

  const allOk = checks.every(c => c.ok);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><Database size={20} className="text-indigo-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">EDUCACENSO</h1><p className="text-gray-500">Exportação de dados para o Censo Escolar</p></div></div>
      </div>

      {/* Status de prontidão */}
      <div className={`card mb-6 ${allOk ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          {allOk ? <CheckCircle size={22} className="text-green-600" /> : <AlertTriangle size={22} className="text-yellow-600" />}
          <div><p className={`font-semibold ${allOk ? 'text-green-700' : 'text-yellow-700'}`}>{allOk ? 'Dados prontos para exportacao!' : 'Dados incompletos - preencha todos os campos'}</p><p className="text-xs text-gray-500">Verifique os itens abaixo antes de exportar</p></div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {checks.map((c, i) => (
            <div key={i} className={`p-3 rounded-xl text-center ${c.ok ? 'bg-white' : 'bg-yellow-100'}`}>
              {c.ok ? <CheckCircle size={16} className="text-green-500 mx-auto mb-1" /> : <AlertTriangle size={16} className="text-yellow-500 mx-auto mb-1" />}
              <p className="text-lg font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detalhes por escola */}
      {s?.schools?.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><School size={16} /> Dados por Escola</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['Escola', 'Codigo INEP', 'Tipo', 'Alunos', 'Turmas'].map(h => <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{s.schools.map((sc: any) => (
            <tr key={sc.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-medium">{sc.name}</td>
              <td className="px-4 py-2 text-gray-500">{sc.code || '—'}</td>
              <td className="px-4 py-2 text-gray-500">{sc.type || '—'}</td>
              <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.students > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{sc.students}</span></td>
              <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.classes > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{sc.classes}</span></td>
            </tr>
          ))}</tbody></table></div>
        </div>
      )}

      {/* Exportações */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: 'schools', icon: School, title: 'Escolas', desc: 'Dados das unidades escolares', color: 'bg-blue-50 text-blue-600' },
          { key: 'students', icon: Users, title: 'Alunos', desc: 'Dados dos alunos matriculados', color: 'bg-green-50 text-green-600' },
          { key: 'teachers', icon: GraduationCap, title: 'Docentes', desc: 'Dados dos professores', color: 'bg-purple-50 text-purple-600' },
          { key: 'classes', icon: BookOpen, title: 'Turmas', desc: 'Dados das turmas e series', color: 'bg-orange-50 text-orange-600' },
        ].map(item => (
          <div key={item.key} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${item.color.split(' ')[0]} flex items-center justify-center`}><item.icon size={22} className={item.color.split(' ')[1]} /></div>
            <div className="flex-1"><p className="font-semibold text-gray-800">{item.title}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
            <button onClick={() => doExport(item.key)} disabled={!!exporting} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} />{exporting === item.key ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
