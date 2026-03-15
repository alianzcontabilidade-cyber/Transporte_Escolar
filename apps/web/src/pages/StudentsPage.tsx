import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Users, Plus, X, Search, Camera, Phone, MapPin, Heart } from 'lucide-react';

const SHIFTS = [{ v: 'morning', l: 'Manhã' }, { v: 'afternoon', l: 'Tarde' }, { v: 'evening', l: 'Noite' }];
const GRADES = ['1º Ano','2º Ano','3º Ano','4º Ano','5º Ano','6º Ano','7º Ano','8º Ano','9º Ano','1º EM','2º EM','3º EM'];

function PhotoUpload({ value, onChange, label }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover" /> : <Camera size={28} className="text-gray-400" />}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => onChange(ev.target?.result as string); r.readAsDataURL(f); } }} />
    </div>
  );
}

const emptyForm = { name:'',schoolId:'',grade:'',classRoom:'',enrollment:'',shift:'morning',address:'',neighborhood:'',city:'',zipCode:'',hasSpecialNeeds:false,specialNeedsDesc:'',photo:'',birthDate:'',guardianName:'',guardianCPF:'',guardianPhone:'',guardianEmail:'',guardianRelation:'Pai/Mãe',guardian2Name:'',guardian2Phone:'',guardian2Relation:'' };

export default function StudentsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'dados'|'endereco'|'responsaveis'>('dados');
  const [form, setForm] = useState<any>(emptyForm);
  const [err, setErr] = useState('');
  const { data: students, refetch } = useQuery(() => api.students.list({ municipalityId }), [municipalityId]);
  const { data: schools } = useQuery(() => api.schools.list({ municipalityId }), [municipalityId]);
  const { mutate: create, loading } = useMutation(api.students.create);
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.type==='checkbox'?e.target.checked:e.target.value }));
  const filtered = (students as any)?.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment||'').includes(search));
  const sl = (s: string) => SHIFTS.find(x => x.v===s)?.l || s;
  const openNew = () => { setForm(emptyForm); setErr(''); setTab('dados'); setShow(true); };
  const handleSave = () => { setErr(''); create({ municipalityId, ...form }, { onSuccess: () => { refetch(); setShow(false); }, onError: (e: any) => setErr(e?.message||'Erro') }); };
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Alunos</h1><p className="text-gray-500">{(students as any)?.length ?? 0} aluno(s)</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={openNew}><Plus size={16} /> Novo Aluno</button>
      </div>
      <div className="relative mb-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Buscar por nome ou matrícula..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="grid gap-3">
        {filtered?.map((s: any) => (
          <div key={s.id} className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">{s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : <span className="font-bold text-indigo-700 text-lg">{s.name?.[0]?.toUpperCase()}</span>}</div>
            <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800">{s.name}</p><div className="flex gap-3 flex-wrap">{s.grade && <span className="text-xs text-gray-500">{s.grade}</span>}{s.classRoom && <span className="text-xs text-gray-500">Turma {s.classRoom}</span>}{s.enrollment && <span className="text-xs text-gray-500">Mat. {s.enrollment}</span>}</div></div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{sl(s.shift||'morning')}</span>
            {s.hasSpecialNeeds && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Heart size={10} /> NEE</span>}
          </div>
        ))}
        {!filtered?.length && <div className="card text-center py-12"><Users size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{search?'Não encontrado':'Nenhum aluno'}</p>{!search && <button className="btn-primary mt-4" onClick={openNew}>Adicionar</button>}</div>}
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">Novo Aluno</h3><button onClick={() => setShow(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button></div>
            <div className="flex gap-1 px-5 pt-4">{(['dados','endereco','responsaveis'] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab===t?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700'}`}>{t==='dados'?'Dados':t==='endereco'?'Endereço':'Responsáveis'}</button>))}</div>
            <div className="overflow-y-auto flex-1 p-5">
              {err && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{err}</div>}
              {tab==='dados' && (<div className="space-y-4"><div className="flex justify-center mb-4"><PhotoUpload value={form.photo} onChange={(v: string) => setForm((f: any) => ({...f,photo:v}))} label="Foto do aluno (clique para importar)" /></div><div className="grid grid-cols-2 gap-4"><div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={set('name')} /></div><div><label className="label">Data de Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} /></div><div><label className="label">Matrícula</label><input className="input" value={form.enrollment} onChange={set('enrollment')} /></div><div><label className="label">Escola</label><select className="input" value={form.schoolId} onChange={set('schoolId')}><option value="">Selecionar...</option>{(schools as any)?.map((sc: any) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}</select></div><div><label className="label">Série/Ano</label><select className="input" value={form.grade} onChange={set('grade')}><option value="">Selecionar...</option>{GRADES.map(g => <option key={g}>{g}</option>)}</select></div><div><label className="label">Turma</label><input className="input" value={form.classRoom} onChange={set('classRoom')} placeholder="A, B, 01..." /></div><div><label className="label">Turno</label><select className="input" value={form.shift} onChange={set('shift')}>{SHIFTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div></div><div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg"><input type="checkbox" id="nee" checked={form.hasSpecialNeeds} onChange={set('hasSpecialNeeds')} className="w-4 h-4 accent-purple-500" /><label htmlFor="nee" className="text-sm font-medium">Necessidades Educacionais Especiais (NEE)</label></div>{form.hasSpecialNeeds && <div><label className="label">Descrição</label><textarea className="input" rows={2} value={form.specialNeedsDesc} onChange={set('specialNeedsDesc')} /></div>}</div>)}
              {tab==='endereco' && (<div className="grid grid-cols-2 gap-4"><div className="col-span-2 flex items-center gap-2 text-gray-500 mb-2"><MapPin size={16} /><span className="text-sm">Endereço do aluno</span></div><div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={set('address')} /></div><div><label className="label">Bairro</label><input className="input" value={form.neighborhood} onChange={set('neighborhood')} /></div><div><label className="label">Cidade</label><input className="input" value={form.city} onChange={set('city')} /></div><div><label className="label">CEP</label><input className="input" value={form.zipCode} onChange={set('zipCode')} placeholder="00000-000" /></div></div>)}
              {tab==='responsaveis' && (<div className="space-y-4"><div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Phone size={14} /> Responsável Principal</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Nome *</label><input className="input" value={form.guardianName} onChange={set('guardianName')} /></div><div><label className="label">CPF</label><input className="input" value={form.guardianCPF} onChange={set('guardianCPF')} /></div><div><label className="label">Parentesco</label><select className="input" value={form.guardianRelation} onChange={set('guardianRelation')}>{['Pai/Mãe','Pai','Mãe','Avó/Avô','Tio(a)','Outro'].map(r => <option key={r}>{r}</option>)}</select></div><div><label className="label">Telefone *</label><input className="input" value={form.guardianPhone} onChange={set('guardianPhone')} /></div><div><label className="label">E-mail</label><input className="input" type="email" value={form.guardianEmail} onChange={set('guardianEmail')} /></div></div></div><div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Phone size={14} /> Responsável Secundário (opcional)</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.guardian2Name} onChange={set('guardian2Name')} /></div><div><label className="label">Telefone</label><input className="input" value={form.guardian2Phone} onChange={set('guardian2Phone')} /></div><div><label className="label">Parentesco</label><select className="input" value={form.guardian2Relation} onChange={set('guardian2Relation')}><option value="">Selecionar...</option>{['Pai','Mãe','Avó/Avô','Tio(a)','Outro'].map(r => <option key={r}>{r}</option>)}</select></div></div></div></div>)}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={() => setShow(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleSave} disabled={loading} className="btn-primary flex-1">{loading?'Salvando...':'Salvar Aluno'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
      }
