import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { Users, Plus, X, Camera, Pencil, Trash2, Search, Phone, MapPin, BookOpen, Navigation } from 'lucide-react';

function PhotoUpload({ value, onChange }: any) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors" onClick={() => ref.current?.click()}>
        {value ? <img src={value} alt="foto" className="w-full h-full object-cover"/> : <Camera size={20} className="text-gray-400"/>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={function(e) { const f = e.target.files?.[0]; if (f) { const rd = new FileReader(); rd.onload = function(ev) { onChange(ev.target?.result); }; rd.readAsDataURL(f); } }}/>
    </div>
  );
}

const SHIFTS = [{ v:'morning', l:'Manhã' },{ v:'afternoon', l:'Tarde' },{ v:'evening', l:'Noite' }];
const emptyForm = { name:'', enrollment:'', grade:'', className:'', shift:'morning', birthDate:'', school:'', routeId:'', photo:'', guardian1Name:'', guardian1Phone:'', guardian1Relation:'', guardian2Name:'', guardian2Phone:'', guardian2Relation:'', address:'', city:'', observations:'' };

export default function StudentsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [tab, setTab] = useState<'dados'|'endereco'|'responsaveis'>('dados');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const { data: students, refetch } = useQuery(function() { return api.students.list({ municipalityId }); }, [municipalityId]);
  const { data: routes } = useQuery(function() { return api.routes.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.students.create);
  const { mutate: update, loading: updating } = useMutation(api.students.update);
  const { mutate: remove } = useMutation(api.students.delete);

  const setField = function(k: string) { return function(e: any) { const v = e.target.type==='checkbox'?e.target.checked:e.target.value; setForm(function(f: any) { return {...f,[k]:v}; }); }; };
  const allStudents = (students as any)||[];
  const allRoutes = (routes as any)||[];
  const filtered = allStudents.filter(function(s: any) { const q = search.toLowerCase(); return s.name?.toLowerCase().includes(q)||(s.enrollment||'').includes(q)||(s.grade||'').toLowerCase().includes(q); });
  const shiftLabel = function(v: string) { return SHIFTS.find(function(s) { return s.v===v; })?.l||v; };
  const routeName = function(id: string) { const r = allRoutes.find(function(x:any){return String(x.route.id)===String(id);}); return r?.route?.name||''; };

  const openNew = function() { setForm(emptyForm); setEditId(null); setTab('dados'); setFormErr(''); setShowModal(true); };
  const openEdit = function(s: any) { setForm({...emptyForm,...s}); setEditId(s.id); setTab('dados'); setFormErr(''); setShowModal(true); };

  const save = function() {
    if (!form.name) { setFormErr('Nome é obrigatório.'); return; }
    const payload = { municipalityId, name:form.name, enrollment:form.enrollment||undefined, grade:form.grade||undefined, className:form.className||undefined, shift:form.shift||undefined, birthDate:form.birthDate||undefined, school:form.school||undefined, routeId:form.routeId?parseInt(form.routeId):undefined, photo:form.photo||undefined, guardian1Name:form.guardian1Name||undefined, guardian1Phone:form.guardian1Phone||undefined, guardian1Relation:form.guardian1Relation||undefined, guardian2Name:form.guardian2Name||undefined, guardian2Phone:form.guardian2Phone||undefined, guardian2Relation:form.guardian2Relation||undefined, address:form.address||undefined, city:form.city||undefined, observations:form.observations||undefined };
    if (editId!==null) {
      update({id:editId,...payload},{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    } else {
      create(payload,{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Alunos</h1><p className="text-gray-500">{allStudents.length} aluno(s)</p></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Novo Aluno</button>
      </div>
      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por nome, matrícula ou turma..." value={search} onChange={function(e){setSearch(e.target.value);}}/></div>
      <div className="grid gap-3">
        {filtered.map(function(s: any) { return (
          <div key={s.id} className="card flex items-center gap-4 hover:border-primary-200 transition-colors">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
              {s.photo?<img src={s.photo} alt={s.name} className="w-full h-full object-cover"/>:<span className="font-bold text-indigo-700">{s.name?.[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-800">{s.name}</p>
                {s.grade&&<span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s.grade}</span>}
                {s.shift&&<span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{shiftLabel(s.shift)}</span>}
              </div>
              <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                {s.enrollment&&<span className="flex items-center gap-1"><BookOpen size={10}/>Mat. {s.enrollment}</span>}
                {s.school&&<span>{s.school}</span>}
                {s.guardian1Phone&&<span className="flex items-center gap-1"><Phone size={10}/>{s.guardian1Phone}</span>}
                {s.city&&<span className="flex items-center gap-1"><MapPin size={10}/>{s.city}</span>}
                {s.routeId&&<span className="flex items-center gap-1 bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium"><Navigation size={10}/>{routeName(s.routeId)}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={function(){openEdit(s);}} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={15}/></button>
              <button onClick={function(){setConfirmDelete(s);}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={15}/></button>
            </div>
          </div>
        );})}
        {!filtered.length&&!search&&<div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhum aluno</p><button className="btn-primary" onClick={openNew}>Adicionar aluno</button></div>}
        {!filtered.length&&search&&<div className="card text-center py-8"><p className="text-gray-500">Nenhum resultado para "{search}"</p></div>}
      </div>

      {confirmDelete&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div><h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3><p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p><div className="flex gap-3"><button onClick={function(){setConfirmDelete(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){remove({id:confirmDelete.id},{onSuccess:function(){refetch();setConfirmDelete(null);}});}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId?'Editar Aluno':'Novo Aluno'}</h3><button onClick={function(){setShowModal(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="flex gap-1 px-5 pt-3">
          {([['dados','Dados'],['endereco','Endereço'],['responsaveis','Responsáveis']] as const).map(function(t){return(<button key={t[0]} onClick={function(){setTab(t[0]);}} className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-all '+(tab===t[0]?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700')}>{t[1]}</button>);})}
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {formErr&&<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
          {tab==='dados'&&(<><div className="flex justify-center"><PhotoUpload value={form.photo} onChange={function(v:string){setForm(function(f:any){return{...f,photo:v};});}}/></div><div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Nome completo *</label><input className="input" value={form.name} onChange={setField('name')}/></div>
            <div><label className="label">Matrícula</label><input className="input" value={form.enrollment} onChange={setField('enrollment')}/></div>
            <div><label className="label">Nascimento</label><input className="input" type="date" value={form.birthDate} onChange={setField('birthDate')}/></div>
            <div><label className="label">Série/Ano</label><input className="input" value={form.grade} onChange={setField('grade')} placeholder="5º Ano"/></div>
            <div><label className="label">Turma</label><input className="input" value={form.className} onChange={setField('className')} placeholder="A"/></div>
            <div><label className="label">Turno</label><select className="input" value={form.shift} onChange={setField('shift')}>{SHIFTS.map(function(s){return <option key={s.v} value={s.v}>{s.l}</option>;})}</select></div>
            <div><label className="label">Escola</label><input className="input" value={form.school} onChange={setField('school')}/></div>
            <div className="col-span-2"><label className="label flex items-center gap-1"><Navigation size={13} className="text-primary-500"/> Rota de transporte</label>
              <select className="input" value={form.routeId} onChange={setField('routeId')}>
                <option value="">— Sem rota vinculada —</option>
                {allRoutes.map(function(rt:any){return <option key={rt.route.id} value={rt.route.id}>{rt.route.name}{rt.route.code?' ('+rt.route.code+')':''}</option>;})}
              </select>
            </div>
            <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={2} value={form.observations} onChange={setField('observations')}/></div>
          </div></>)}
          {tab==='endereco'&&(<div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={setField('address')}/></div><div><label className="label">Cidade</label><input className="input" value={form.city} onChange={setField('city')}/></div></div>)}
          {tab==='responsaveis'&&(<div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Responsável 1</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.guardian1Name} onChange={setField('guardian1Name')}/></div><div><label className="label">Telefone</label><input className="input" value={form.guardian1Phone} onChange={setField('guardian1Phone')} placeholder="(00) 00000-0000"/></div><div><label className="label">Parentesco</label><input className="input" value={form.guardian1Relation} onChange={setField('guardian1Relation')} placeholder="Mãe"/></div></div></div>
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Responsável 2</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.guardian2Name} onChange={setField('guardian2Name')}/></div><div><label className="label">Telefone</label><input className="input" value={form.guardian2Phone} onChange={setField('guardian2Phone')} placeholder="(00) 00000-0000"/></div><div><label className="label">Parentesco</label><input className="input" value={form.guardian2Relation} onChange={setField('guardian2Relation')} placeholder="Pai"/></div></div></div>
          </div>)}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Aluno'}</button></div>
      </div></div>)}
    </div>
  );
}
