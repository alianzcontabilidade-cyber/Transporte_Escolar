import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ArrowUpCircle, CheckCircle, Users, AlertTriangle, Loader2 } from 'lucide-react';

export default function PromotionPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [sourceClass, setSourceClass] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState('');

  const { data: classesData } = useQuery(() => api.classes.list({ municipalityId: mid }), [mid]);
  const { data: enrollmentsData } = useQuery(() => sourceClass ? api.enrollments.list({ municipalityId: mid, classId: parseInt(sourceClass), status: 'graduated' }) : Promise.resolve([]), [mid, sourceClass]);
  const { data: yearsData } = useQuery(() => api.academicYears.list({ municipalityId: mid }), [mid]);

  const allClasses = (classesData as any) || [];
  const graduated = (enrollmentsData as any) || [];
  const allYears = (yearsData as any) || [];
  const activeYear = allYears.find((y: any) => y.status === 'active');

  const doPromotion = async () => {
    if (!targetClass || !graduated.length || !activeYear) return;
    setPromoting(true);
    setResult('');
    let ok = 0, fail = 0;
    for (const e of graduated) {
      try {
        await api.enrollments.create({ municipalityId: mid, studentId: e.studentId, classId: parseInt(targetClass), academicYearId: activeYear.id });
        ok++;
      } catch { fail++; }
    }
    setPromoting(false);
    setResult(`Promovidos: ${ok}${fail > 0 ? ` | J\u00e1 matriculados: ${fail}` : ''}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><ArrowUpCircle size={20} className="text-green-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Promo\u00e7\u00e3o de Alunos</h1><p className="text-gray-500">Importar alunos aprovados para a pr\u00f3xima s\u00e9rie</p></div></div>
      </div>

      {!activeYear && (
        <div className="card bg-yellow-50 border-yellow-200 mb-4 flex items-center gap-3"><AlertTriangle size={18} className="text-yellow-600" /><p className="text-sm text-yellow-700">Nenhum ano letivo ativo. Ative um ano letivo primeiro.</p></div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Turma de Origem (aprovados)</h3>
          <select className="input mb-3" value={sourceClass} onChange={e => { setSourceClass(e.target.value); setResult(''); }}><option value="">Selecione a turma</option>{allClasses.map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>

          {graduated.length > 0 ? (
            <div className="card">
              <p className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2"><CheckCircle size={16} /> {graduated.length} aluno(s) aprovado(s)</p>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {graduated.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold text-green-800">{e.studentName?.[0]}</div>
                    <div><p className="text-sm font-medium">{e.studentName}</p>{e.studentEnrollment && <p className="text-xs text-gray-400">Mat. {e.studentEnrollment}</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : sourceClass ? (
            <div className="card text-center py-8"><p className="text-gray-400 text-sm">Nenhum aluno aprovado nesta turma</p><p className="text-xs text-gray-300 mt-1">Altere o status das matr\u00edculas para 'Aprovado' primeiro</p></div>
          ) : null}
        </div>

        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Turma de Destino (pr\u00f3xima s\u00e9rie)</h3>
          <select className="input mb-3" value={targetClass} onChange={e => setTargetClass(e.target.value)}><option value="">Selecione a turma destino</option>{allClasses.filter((c: any) => String(c.id) !== sourceClass).map((c: any) => <option key={c.id} value={c.id}>{c.fullName || c.name} - {c.schoolName}</option>)}</select>

          {graduated.length > 0 && targetClass && (
            <div className="card bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2"><ArrowUpCircle size={16} /> Confirmar Promo\u00e7\u00e3o</h4>
              <p className="text-sm text-green-700 mb-4"><b>{graduated.length}</b> aluno(s) aprovado(s) ser\u00e3o matriculados na turma <b>{allClasses.find((c: any) => String(c.id) === targetClass)?.fullName || '\u2014'}</b></p>
              <button onClick={doPromotion} disabled={promoting || !activeYear} className="btn-primary w-full flex items-center justify-center gap-2">
                {promoting ? <><Loader2 size={16} className="animate-spin" /> Promovendo...</> : <><ArrowUpCircle size={16} /> Promover Alunos</>}
              </button>
            </div>
          )}

          {result && <div className={`mt-3 p-3 rounded-lg text-sm ${result.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}><CheckCircle size={14} className="inline mr-1" />{result}</div>}
        </div>
      </div>
    </div>
  );
}
