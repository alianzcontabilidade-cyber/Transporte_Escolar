import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { FileText, Search, Printer } from 'lucide-react';

const CERT_TYPES = [
  { id: 'matricula', label: 'Declaração de Matrícula', desc: 'Comprova que o aluno está matriculado' },
  { id: 'frequencia', label: 'Declaração de Frequência', desc: 'Comprova frequência escolar do aluno' },
  { id: 'transferencia', label: 'Declaração de Transferência', desc: 'Para transferência entre escolas' },
  { id: 'escolaridade', label: 'Declaração de Escolaridade', desc: 'Comprova o nível de escolaridade' },
];

function generateCertificate(type: string, student: any, school: any, municipality: any) {
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const city = municipality?.city || 'Cidade';
  const state = municipality?.state || 'UF';

  const titles: any = {
    matricula: 'DECLARAÇÃO DE MATRÍCULA',
    frequencia: 'DECLARAÇÃO DE FREQUÊNCIA ESCOLAR',
    transferencia: 'DECLARAÇÃO DE TRANSFERÊNCIA',
    escolaridade: 'DECLARAÇÃO DE ESCOLARIDADE',
  };

  const bodies: any = {
    matricula: `Declaramos, para os devidos fins, que <b>${student.name}</b>, nascido(a) em <b>${student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : '___/___/______'}</b>, matrícula nº <b>${student.enrollment || '______'}</b>, encontra-se devidamente matriculado(a) nesta unidade de ensino, cursando o(a) <b>${student.grade || '______'}</b>, no turno da <b>${student.shift === 'afternoon' ? 'Tarde' : student.shift === 'evening' ? 'Noite' : 'Manhã'}</b>, no ano letivo de <b>${new Date().getFullYear()}</b>.`,
    frequencia: `Declaramos, para os devidos fins, que <b>${student.name}</b>, matrícula nº <b>${student.enrollment || '______'}</b>, é aluno(a) regularmente matriculado(a) nesta unidade de ensino, cursando o(a) <b>${student.grade || '______'}</b>, e que possui frequência regular às aulas no presente ano letivo de <b>${new Date().getFullYear()}</b>.`,
    transferencia: `Declaramos, para os devidos fins, que <b>${student.name}</b>, matrícula nº <b>${student.enrollment || '______'}</b>, esteve matriculado(a) nesta unidade de ensino, cursando o(a) <b>${student.grade || '______'}</b>, e que está sendo transferido(a) a pedido do responsável, nada constando que o(a) desabone.`,
    escolaridade: `Declaramos, para os devidos fins, que <b>${student.name}</b>, matrícula nº <b>${student.enrollment || '______'}</b>, concluiu / está cursando o(a) <b>${student.grade || '______'}</b> nesta unidade de ensino, no ano letivo de <b>${new Date().getFullYear()}</b>.`,
  };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titles[type]}</title>
  <style>
    body{font-family:'Times New Roman',serif;padding:60px 80px;color:#333;max-width:800px;margin:0 auto}
    .header{text-align:center;margin-bottom:40px}
    .header h1{font-size:14px;color:#1B3A5C;margin:0}
    .header h2{font-size:12px;color:#666;margin:5px 0}
    .title{text-align:center;font-size:18px;font-weight:bold;color:#1B3A5C;margin:40px 0 30px;text-decoration:underline;letter-spacing:2px}
    .body{font-size:14px;line-height:2;text-align:justify;margin:30px 0}
    .body b{color:#1B3A5C}
    .purpose{font-size:13px;text-align:justify;margin:30px 0}
    .date{text-align:right;margin:40px 0;font-size:13px}
    .signatures{display:flex;justify-content:space-between;margin-top:80px}
    .sig{text-align:center;width:200px}
    .sig-line{border-top:1px solid #333;padding-top:5px;font-size:12px}
    .footer{text-align:center;margin-top:40px;font-size:9px;color:#999}
    @media print{body{padding:40px 60px}}
  </style></head><body>
  <div class="header">
    <h1>${school?.name || 'ESCOLA'}</h1>
    <h2>${municipality?.name || 'Prefeitura Municipal'} - ${city}/${state}</h2>
  </div>
  <div class="title">${titles[type]}</div>
  <div class="body">${bodies[type]}</div>
  <div class="purpose">A presente declaração é expedida a pedido do(a) interessado(a), para os fins que se fizerem necessários.</div>
  <div class="date">${city}/${state}, ${today}.</div>
  <div class="signatures">
    <div class="sig"><div class="sig-line">Diretor(a)</div></div>
    <div class="sig"><div class="sig-line">Secretário(a) Escolar</div></div>
  </div>
  <div class="footer">Documento gerado pelo sistema NetEscol em ${new Date().toLocaleString('pt-BR')}</div>
  </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
}

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [search, setSearch] = useState('');
  const [selStudent, setSelStudent] = useState<any>(null);

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: munData } = useQuery(() => api.municipalities.getById({ id: mid }), [mid]);

  const allStudents = ((studentsData as any) || []).filter((s: any) => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search));
  const allSchools = (schoolsData as any) || [];

  const getSchool = (id: number) => allSchools.find((s: any) => s.id === id);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><FileText size={20} className="text-indigo-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Declarações e Certidões</h1><p className="text-gray-500">Gere documentos oficiais para alunos</p></div></div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Student selector */}
        <div>
          <div className="relative mb-3"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="space-y-1 max-h-[65vh] overflow-y-auto">
            {allStudents.slice(0, 50).map((s: any) => (
              <button key={s.id} onClick={() => setSelStudent(s)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${selStudent?.id === s.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0">{s.name?.[0]}</div>
                <div className="min-w-0"><p className="text-sm font-medium truncate">{s.name}</p>{s.enrollment && <p className="text-xs text-gray-400">Mat. {s.enrollment}</p>}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Certificate options */}
        <div className="col-span-2">
          {selStudent ? (
            <div>
              <div className="card mb-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">{selStudent.name?.[0]}</div>
                  <div><h2 className="text-lg font-bold">{selStudent.name}</h2><p className="text-indigo-200">{selStudent.enrollment ? 'Mat. ' + selStudent.enrollment : ''} {selStudent.grade ? '· ' + selStudent.grade : ''}</p><p className="text-indigo-300 text-sm">{selStudent.school || getSchool(selStudent.schoolId)?.name || ''}</p></div>
                </div>
              </div>

              <h3 className="font-semibold text-gray-800 mb-3">Selecione o tipo de documento:</h3>
              <div className="grid grid-cols-2 gap-3">
                {CERT_TYPES.map(cert => (
                  <button key={cert.id} onClick={() => generateCertificate(cert.id, selStudent, getSchool(selStudent.schoolId), munData)}
                    className="card hover:shadow-lg hover:border-indigo-300 transition-all text-left group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                        <Printer size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{cert.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cert.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-20"><FileText size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione um aluno para gerar declarações</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
