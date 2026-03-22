import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Brain, AlertTriangle, Users, Search, Filter, ShieldAlert, TrendingDown, CheckCircle, Loader2 } from 'lucide-react';

interface StudentRisk {
  studentId: number;
  studentName: string;
  grade: string;
  className: string;
  schoolName: string;
  riskScore: number;
  absences: number;
  avgGrade: number;
  occurrences: number;
  factors: string[];
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 60) {
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Alto ({score})</span>;
  }
  if (score >= 30) {
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Medio ({score})</span>;
  }
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Baixo ({score})</span>;
}

export default function StudentRiskPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId;
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'alto' | 'medio' | 'baixo'>('all');
  const [schoolFilter, setSchoolFilter] = useState('');

  const { data, loading, error } = useQuery<StudentRisk[]>(
    () => api.ai.studentRiskAnalysis({ municipalityId }),
    [municipalityId]
  );

  const students = data || [];

  // Get unique schools
  const schools = [...new Set(students.map(s => s.schoolName))].sort();

  // Filter and sort
  const filtered = students
    .filter(s => {
      if (search && !s.studentName.toLowerCase().includes(search.toLowerCase())) return false;
      if (schoolFilter && s.schoolName !== schoolFilter) return false;
      if (riskFilter === 'alto' && s.riskScore < 60) return false;
      if (riskFilter === 'medio' && (s.riskScore < 30 || s.riskScore >= 60)) return false;
      if (riskFilter === 'baixo' && s.riskScore >= 30) return false;
      return true;
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  // Stats
  const totalAlunos = students.length;
  const altoRisco = students.filter(s => s.riskScore >= 60).length;
  const medioRisco = students.filter(s => s.riskScore >= 30 && s.riskScore < 60).length;
  const baixoRisco = students.filter(s => s.riskScore < 30).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <ShieldAlert size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analise de Risco de Evasao</h1>
          <p className="text-gray-500 text-sm">Identificacao de alunos com risco de abandono escolar via IA</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card mb-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle size={16} />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card border-purple-200 bg-purple-50/30 mb-4">
          <div className="flex items-center gap-3">
            <Brain size={18} className="text-purple-500 animate-pulse" />
            <p className="font-semibold text-purple-700">IA analisando risco de evasao...</p>
            <Loader2 size={16} className="animate-spin text-purple-500 ml-auto" />
          </div>
        </div>
      )}

      {/* Stats cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 border-0">
            <Users size={20} className="text-blue-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{totalAlunos}</p>
            <p className="text-xs text-gray-500">Total alunos</p>
          </div>
          <div className="card bg-red-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRiskFilter(riskFilter === 'alto' ? 'all' : 'alto')}>
            <AlertTriangle size={20} className="text-red-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{altoRisco}</p>
            <p className="text-xs text-gray-500">Alto risco</p>
          </div>
          <div className="card bg-yellow-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRiskFilter(riskFilter === 'medio' ? 'all' : 'medio')}>
            <TrendingDown size={20} className="text-yellow-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{medioRisco}</p>
            <p className="text-xs text-gray-500">Medio risco</p>
          </div>
          <div className="card bg-green-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRiskFilter(riskFilter === 'baixo' ? 'all' : 'baixo')}>
            <CheckCircle size={20} className="text-green-600 mb-2" />
            <p className="text-xl font-bold text-gray-900">{baixoRisco}</p>
            <p className="text-xs text-gray-500">Baixo risco</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {students.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="input w-56"
          >
            <option value="">Todas as escolas</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="input w-40"
          >
            <option value="all">Todos</option>
            <option value="alto">Alto risco</option>
            <option value="medio">Medio risco</option>
            <option value="baixo">Baixo risco</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {!loading && students.length === 0 && (
        <div className="card text-center py-16 border-dashed border-2 border-gray-200">
          <ShieldAlert size={56} className="text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum dado de risco disponivel</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            A analise de risco requer dados de frequencia, notas e ocorrencias dos alunos.
          </p>
        </div>
      )}

      {/* Student list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{filtered.length} aluno{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.map((student) => {
            const borderColor = student.riskScore >= 60 ? 'border-l-red-500' : student.riskScore >= 30 ? 'border-l-yellow-500' : 'border-l-green-500';
            return (
              <div key={student.studentId} className={`card border-l-4 ${borderColor}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-gray-800">{student.studentName}</p>
                      <RiskBadge score={student.riskScore} />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      <span>{student.schoolName}</span>
                      <span>{student.grade} - {student.className}</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-gray-600"><strong>{student.absences}</strong> faltas</span>
                      <span className="text-gray-600">Media: <strong>{student.avgGrade.toFixed(1)}</strong></span>
                      <span className="text-gray-600"><strong>{student.occurrences}</strong> ocorrencias</span>
                    </div>
                    {student.factors && student.factors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.factors.map((f, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        background: student.riskScore >= 60 ? '#fef2f2' : student.riskScore >= 30 ? '#fefce8' : '#f0fdf4',
                        color: student.riskScore >= 60 ? '#dc2626' : student.riskScore >= 30 ? '#ca8a04' : '#16a34a'
                      }}
                    >
                      {student.riskScore}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && students.length > 0 && filtered.length === 0 && (
        <div className="card text-center py-8">
          <Filter size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Nenhum aluno encontrado com os filtros atuais</p>
        </div>
      )}
    </div>
  );
}
