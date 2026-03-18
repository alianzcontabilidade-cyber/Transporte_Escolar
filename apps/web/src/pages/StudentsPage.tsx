import { useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { Users, Plus, X, Camera, Pencil, Trash2, Search, Phone, MapPin, BookOpen, Navigation, Loader2, MessageCircle, Share2, CheckCircle, Eye, Heart, AlertTriangle } from 'lucide-react';

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
const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
import { maskPhone } from '../lib/utils';

const emptyForm = { name:'', enrollment:'', grade:'', className:'', shift:'morning', birthDate:'', school:'', routeId:'', photo:'', guardian1Name:'', guardian1Phone:'', guardian1Relation:'', guardian2Name:'', guardian2Phone:'', guardian2Relation:'', address:'', state:'', city:'', observations:'', bloodType:'', allergies:'', medications:'', healthNotes:'', hasSpecialNeeds:false, specialNeedsNotes:'', emergencyContact1Name:'', emergencyContact1Phone:'', emergencyContact1Relation:'', emergencyContact2Name:'', emergencyContact2Phone:'', emergencyContact2Relation:'' };
export default function StudentsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [tab, setTab] = useState<'dados'|'saude'|'endereco'|'responsaveis'>('dados');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const [inviteStudent, setInviteStudent] = useState<any>(null);
  const [inviteSent, setInviteSent] = useState(false);
  const { municipios: stdMunicipios, loading: stdMunLoading } = useMunicipios(form.state);
  const { data: students, refetch } = useQuery(function() { return api.students.list({ municipalityId }); }, [municipalityId]);
  const { data: routes } = useQuery(function() { return api.routes.list({ municipalityId }); }, [municipalityId]);
  const { data: schoolsData } = useQuery(function() { return api.schools.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.students.create);
  const { mutate: update, loading: updating } = useMutation(api.students.update);
  const { mutate: remove } = useMutation(api.students.delete);

  const setField = function(k: string) { return function(e: any) { const v = e.target.type==='checkbox'?e.target.checked:e.target.value; setForm(function(f: any) { return {...f,[k]:v}; }); }; };
  const allStudents = (students as any)||[];
  const allRoutes = (routes as any)||[];
  const allSchools = (schoolsData as any)||[];
  const filtered = allStudents.filter(function(s: any) { const q = search.toLowerCase(); return s.name?.toLowerCase().includes(q)||(s.enrollment||'').includes(q)||(s.grade||'').toLowerCase().includes(q); });
  const shiftLabel = function(v: string) { return SHIFTS.find(function(s) { return s.v===v; })?.l||v; };
  const routeName = function(id: string) { const r = allRoutes.find(function(x:any){return String(x.route?.id || x.id)===String(id);}); return r?.route?.name||''; };

  const appUrl = window.location.origin;

  const generateWhatsAppLink = function(student: any, phone?: string) {
    const enrollment = student.enrollment || '';
    const studentName = student.name || 'seu filho(a)';
    const msg = `Ola! Voce foi convidado(a) para acompanhar o transporte escolar de *${studentName}* pelo aplicativo *TransEscolar*.

Para instalar:
1. Acesse: ${appUrl}/cadastro
2. Escolha "Sou Pai/Responsavel"
3. Use a matricula: *${enrollment}*
4. Crie sua conta e acompanhe em tempo real!

Apos abrir o link, adicione o app na tela inicial do celular para acesso rapido.`;

    const cleanPhone = (phone || '').replace(/\D/g, '');
    const whatsPhone = cleanPhone.length === 11 ? '55' + cleanPhone : cleanPhone.length === 13 ? cleanPhone : '';
    const url = whatsPhone
      ? `https://wa.me/${whatsPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    return url;
  };

  const sendWhatsAppInvite = function(student: any, phone?: string) {
    const url = generateWhatsAppLink(student, phone);
    window.open(url, '_blank');
    setInviteSent(true);
    setTimeout(function() { setInviteSent(false); }, 3000);
  };

  const openNew = function() { setForm(emptyForm); setEditId(null); setTab('dados'); setFormErr(''); setShowModal(true); };
  const openEdit = function(s: any) { setForm({...emptyForm,...s}); setEditId(s.id); setTab('dados'); setFormErr(''); setShowModal(true); };

  const [viewStudent, setViewStudent] = useState<any>(null);

  const save = function() {
    if (!form.name) { setFormErr('Nome e obrigatorio.'); return; }
    if (!form.school && !editId) { setFormErr('Escola e obrigatoria.'); return; }
    const payload: any = {
      municipalityId, name:form.name,
      schoolId:form.school?parseInt(form.school):undefined,
      enrollment:form.enrollment||undefined,
      grade:form.grade||undefined,
      classRoom:form.className||undefined,
      shift:form.shift||undefined,
      birthDate:form.birthDate||undefined,
      address:form.address||undefined,
      city:form.city||undefined,
      state:form.state||undefined,
      photoUrl:form.photo||undefined,
      routeId:form.routeId?parseInt(form.routeId):undefined,
      // Saude
      hasSpecialNeeds:form.hasSpecialNeeds||false,
      specialNeedsNotes:form.specialNeedsNotes||undefined,
      bloodType:form.bloodType||undefined,
      allergies:form.allergies||undefined,
      medications:form.medications||undefined,
      healthNotes:form.healthNotes||undefined,
      // Contatos emergencia
      emergencyContact1Name:form.emergencyContact1Name||undefined,
      emergencyContact1Phone:form.emergencyContact1Phone||undefined,
      emergencyContact1Relation:form.emergencyContact1Relation||undefined,
      emergencyContact2Name:form.emergencyContact2Name||undefined,
      emergencyContact2Phone:form.emergencyContact2Phone||undefined,
      emergencyContact2Relation:form.emergencyContact2Relation||undefined,
      // Responsaveis
      guardian1Name:form.guardian1Name||undefined,
      guardian1Phone:form.guardian1Phone||undefined,
      guardian1Relation:form.guardian1Relation||undefined,
      guardian2Name:form.guardian2Name||undefined,
      guardian2Phone:form.guardian2Phone||undefined,
      guardian2Relation:form.guardian2Relation||undefined,
      observations:form.observations||undefined,
    };
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
              <button onClick={function(){setViewStudent(s);}} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Ver detalhes"><Eye size={15}/></button>
              <button onClick={function(){setInviteStudent(s);}} className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg" title="Convidar responsavel via WhatsApp"><MessageCircle size={15}/></button>
              <button onClick={function(){openEdit(s);}} className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg" title="Editar"><Pencil size={15}/></button>
              <button onClick={function(){setConfirmDelete(s);}} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={15}/></button>
            </div>
          </div>
        );})}
        {!filtered.length&&!search&&<div className="card text-center py-16"><Users size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhum aluno</p><button className="btn-primary" onClick={openNew}>Adicionar aluno</button></div>}
        {!filtered.length&&search&&<div className="card text-center py-8"><p className="text-gray-500">Nenhum resultado para "{search}"</p></div>}
      </div>

      {/* Modal Visualizar Aluno */}
      {viewStudent&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-blue-500"/> Detalhes do Aluno</h3>
              <button onClick={function(){setViewStudent(null);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700">{viewStudent.name?.[0]}</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewStudent.name}</h2>
                  <p className="text-sm text-gray-500">{viewStudent.enrollment ? 'Mat. ' + viewStudent.enrollment : ''} {viewStudent.grade ? ' - ' + viewStudent.grade : ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Escola</p><p className="text-sm font-medium">{allSchools.find(function(sc:any){return sc.id===viewStudent.schoolId;})?.name || viewStudent.school || '--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Turno</p><p className="text-sm font-medium">{shiftLabel(viewStudent.shift)}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Turma</p><p className="text-sm font-medium">{viewStudent.classRoom || viewStudent.className || '--'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Nascimento</p><p className="text-sm font-medium">{viewStudent.birthDate ? new Date(viewStudent.birthDate).toLocaleDateString('pt-BR') : '--'}</p></div>
                <div className="col-span-2 p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Endereco</p><p className="text-sm font-medium">{viewStudent.address || '--'}</p></div>
              </div>
              {(viewStudent.bloodType || viewStudent.allergies || viewStudent.medications || viewStudent.healthNotes || viewStudent.hasSpecialNeeds) && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1"><Heart size={12}/> SAUDE</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewStudent.bloodType && <div><span className="text-gray-400">Tipo Sanguineo:</span> <strong>{viewStudent.bloodType}</strong></div>}
                    {viewStudent.hasSpecialNeeds && <div><span className="text-gray-400">Necessidades Especiais:</span> <strong>Sim</strong></div>}
                    {viewStudent.allergies && <div className="col-span-2"><span className="text-gray-400">Alergias:</span> <strong>{viewStudent.allergies}</strong></div>}
                    {viewStudent.medications && <div className="col-span-2"><span className="text-gray-400">Medicamentos:</span> <strong>{viewStudent.medications}</strong></div>}
                    {viewStudent.healthNotes && <div className="col-span-2"><span className="text-gray-400">Obs. saude:</span> <strong>{viewStudent.healthNotes}</strong></div>}
                    {viewStudent.specialNeedsNotes && <div className="col-span-2"><span className="text-gray-400">Detalhes:</span> <strong>{viewStudent.specialNeedsNotes}</strong></div>}
                  </div>
                </div>
              )}
              {(viewStudent.emergencyContact1Name || viewStudent.emergencyContact2Name) && (
                <div className="p-4 bg-orange-50 rounded-xl">
                  <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1"><AlertTriangle size={12}/> CONTATOS DE EMERGENCIA</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewStudent.emergencyContact1Name && <div><p className="text-gray-400">Contato 1</p><p className="font-medium">{viewStudent.emergencyContact1Name}</p><p className="text-gray-500">{viewStudent.emergencyContact1Phone} - {viewStudent.emergencyContact1Relation}</p></div>}
                    {viewStudent.emergencyContact2Name && <div><p className="text-gray-400">Contato 2</p><p className="font-medium">{viewStudent.emergencyContact2Name}</p><p className="text-gray-500">{viewStudent.emergencyContact2Phone} - {viewStudent.emergencyContact2Relation}</p></div>}
                  </div>
                </div>
              )}
              {(viewStudent.guardian1Name || viewStudent.guardian2Name) && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1"><Users size={12}/> RESPONSAVEIS</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewStudent.guardian1Name && <div><p className="font-medium">{viewStudent.guardian1Name}</p><p className="text-gray-500">{viewStudent.guardian1Phone} - {viewStudent.guardian1Relation}</p></div>}
                    {viewStudent.guardian2Name && <div><p className="font-medium">{viewStudent.guardian2Name}</p><p className="text-gray-500">{viewStudent.guardian2Phone} - {viewStudent.guardian2Relation}</p></div>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={function(){setViewStudent(null);}} className="btn-secondary flex-1">Fechar</button>
              <button onClick={function(){setViewStudent(null);openEdit(viewStudent);}} className="btn-primary flex-1">Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de convite enviado */}
      {inviteSent && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={18}/> Convite enviado via WhatsApp!
        </div>
      )}

      {/* Modal Convidar Responsavel */}
      {inviteStudent&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><MessageCircle size={20} className="text-green-500"/> Convidar Responsavel</h3>
              <button onClick={function(){setInviteStudent(null);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18}/></button>
            </div>

            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-green-800 mb-1">Aluno(a): {inviteStudent.name}</p>
              {inviteStudent.enrollment && <p className="text-xs text-green-600">Matricula: {inviteStudent.enrollment}</p>}
              {inviteStudent.grade && <p className="text-xs text-green-600">Turma: {inviteStudent.grade}</p>}
            </div>

            <p className="text-sm text-gray-600 mb-4">Envie o convite para o responsavel instalar o app e acompanhar o transporte escolar em tempo real.</p>

            <div className="space-y-2">
              {inviteStudent.guardian1Phone && (
                <button onClick={function(){sendWhatsAppInvite(inviteStudent, inviteStudent.guardian1Phone);}}
                  className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                  <MessageCircle size={20}/>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">{inviteStudent.guardian1Name || 'Responsavel 1'}</p>
                    <p className="text-xs text-green-100">{inviteStudent.guardian1Phone}</p>
                  </div>
                  <Share2 size={16}/>
                </button>
              )}

              {inviteStudent.guardian2Phone && (
                <button onClick={function(){sendWhatsAppInvite(inviteStudent, inviteStudent.guardian2Phone);}}
                  className="w-full flex items-center gap-3 p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                  <MessageCircle size={20}/>
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">{inviteStudent.guardian2Name || 'Responsavel 2'}</p>
                    <p className="text-xs text-green-100">{inviteStudent.guardian2Phone}</p>
                  </div>
                  <Share2 size={16}/>
                </button>
              )}

              <button onClick={function(){sendWhatsAppInvite(inviteStudent);}}
                className="w-full flex items-center gap-3 p-3 border-2 border-green-200 hover:bg-green-50 text-green-700 rounded-xl transition-colors">
                <MessageCircle size={20}/>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">Enviar para outro numero</p>
                  <p className="text-xs text-green-500">Abre o WhatsApp para escolher o contato</p>
                </div>
                <Share2 size={16}/>
              </button>
            </div>

            {!inviteStudent.enrollment && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700">Este aluno nao tem matricula cadastrada. O responsavel precisara informar o nome do aluno no cadastro.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDelete&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div><h3 className="font-bold mb-2">Excluir {confirmDelete.name}?</h3><p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p><div className="flex gap-3"><button onClick={function(){setConfirmDelete(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){remove({id:confirmDelete.id},{onSuccess:function(){refetch();setConfirmDelete(null);}});}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div></div></div>)}

      {showModal&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId?'Editar Aluno':'Novo Aluno'}</h3><button onClick={function(){setShowModal(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="flex gap-1 px-5 pt-3">
          {([['dados','Dados'],['saude','Saude'],['endereco','Endereco'],['responsaveis','Responsaveis']] as any[]).map(function(t: any){return(<button key={t[0]} onClick={function(){setTab(t[0]);}} className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-all '+(tab===t[0]?'bg-primary-50 text-primary-600':'text-gray-500 hover:text-gray-700')}>{t[1]}</button>);})}
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
            <div><label className="label">Escola</label><select className="input" value={form.school} onChange={setField('school')}><option value="">Selecione a escola</option>{allSchools.map(function(s:any){return <option key={s.id} value={s.id}>{s.name}</option>;})}</select></div>
            <div className="col-span-2"><label className="label flex items-center gap-1"><Navigation size={13} className="text-primary-500"/> Rota de transporte</label>
              <select className="input" value={form.routeId} onChange={setField('routeId')}>
                <option value="">— Sem rota vinculada —</option>
                {allRoutes.map(function(rt:any){return <option key={(rt.route?.id || rt.id)} value={(rt.route?.id || rt.id)}>{(rt.route?.name || rt.name)}{(rt.route?.code || rt.code)?' ('+(rt.route?.code || rt.code)+')':''}</option>;})}
              </select>
            </div>
            <div className="col-span-2"><label className="label">Observações</label><textarea className="input" rows={2} value={form.observations} onChange={setField('observations')}/></div>
          </div></>)}
          {tab==='saude'&&(<div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-xl"><p className="text-xs font-semibold text-red-700 mb-3 uppercase">Informacoes de Saude</p><div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo Sanguineo</label><select className="input" value={form.bloodType} onChange={setField('bloodType')}><option value="">Selecione</option>{BLOOD_TYPES.map(function(bt){return <option key={bt} value={bt}>{bt}</option>;})}</select></div>
              <div><label className="label">Necessidades Especiais</label><select className="input" value={form.hasSpecialNeeds?'sim':'nao'} onChange={function(e:any){setForm(function(f:any){return{...f,hasSpecialNeeds:e.target.value==='sim'};});}}><option value="nao">Nao</option><option value="sim">Sim</option></select></div>
              {form.hasSpecialNeeds&&<div className="col-span-2"><label className="label">Detalhes das necessidades especiais</label><textarea className="input" rows={2} value={form.specialNeedsNotes} onChange={setField('specialNeedsNotes')}/></div>}
              <div className="col-span-2"><label className="label">Alergias</label><input className="input" value={form.allergies} onChange={setField('allergies')} placeholder="Ex: Amendoim, Lactose, Poeira"/></div>
              <div className="col-span-2"><label className="label">Medicamentos em uso</label><input className="input" value={form.medications} onChange={setField('medications')} placeholder="Ex: Ritalina 10mg"/></div>
              <div className="col-span-2"><label className="label">Observacoes de saude</label><textarea className="input" rows={2} value={form.healthNotes} onChange={setField('healthNotes')} placeholder="Ex: Asmatico, usa bombinha"/></div>
            </div></div>
            <div className="p-4 bg-orange-50 rounded-xl"><p className="text-xs font-semibold text-orange-700 mb-3 uppercase">Contatos de Emergencia</p><div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Contato 1 - Nome</label><input className="input" value={form.emergencyContact1Name} onChange={setField('emergencyContact1Name')} placeholder="Nome completo"/></div>
              <div><label className="label">Telefone</label><input className="input" value={form.emergencyContact1Phone} onChange={function(e:any){setForm(function(f:any){return{...f,emergencyContact1Phone:maskPhone(e.target.value)};});}} placeholder="(63) 00000-0000" maxLength={15}/></div>
              <div><label className="label">Parentesco</label><select className="input" value={form.emergencyContact1Relation} onChange={setField('emergencyContact1Relation')}><option value="">Selecione</option><option value="Pai">Pai</option><option value="Mae">Mae</option><option value="Avo/Avo">Avo/Avo</option><option value="Tio/Tia">Tio/Tia</option><option value="Irmao/Irma">Irmao/Irma</option><option value="Padrasto/Madrasta">Padrasto/Madrasta</option><option value="Outro">Outro</option></select></div>
              <div className="col-span-2"><label className="label">Contato 2 - Nome</label><input className="input" value={form.emergencyContact2Name} onChange={setField('emergencyContact2Name')} placeholder="Nome completo"/></div>
              <div><label className="label">Telefone</label><input className="input" value={form.emergencyContact2Phone} onChange={function(e:any){setForm(function(f:any){return{...f,emergencyContact2Phone:maskPhone(e.target.value)};});}} placeholder="(63) 00000-0000" maxLength={15}/></div>
              <div><label className="label">Parentesco</label><select className="input" value={form.emergencyContact2Relation} onChange={setField('emergencyContact2Relation')}><option value="">Selecione</option><option value="Pai">Pai</option><option value="Mae">Mae</option><option value="Avo/Avo">Avo/Avo</option><option value="Tio/Tia">Tio/Tia</option><option value="Irmao/Irma">Irmao/Irma</option><option value="Padrasto/Madrasta">Padrasto/Madrasta</option><option value="Outro">Outro</option></select></div>
            </div></div>
          </div>)}
          {tab==='endereco'&&(<div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Endereco</label><input className="input" value={form.address} onChange={setField('address')}/></div><div><label className="label">Estado</label><select className="input" value={form.state} onChange={e => setForm((f: any) => ({...f, state: e.target.value, city: ''}))}><option value="">Selecione</option>{ESTADOS_BR.map(es => <option key={es.uf} value={es.uf}>{es.uf}</option>)}</select></div><div><label className="label">Cidade {stdMunLoading && <Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.city} onChange={setField('city')} disabled={!form.state || stdMunLoading}><option value="">Selecione</option>{stdMunicipios.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}</select></div></div>)}
          {tab==='responsaveis'&&(<div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Responsavel 1</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.guardian1Name} onChange={setField('guardian1Name')}/></div><div><label className="label">Telefone</label><input className="input" value={form.guardian1Phone} onChange={function(e:any){setForm(function(f:any){return{...f,guardian1Phone:maskPhone(e.target.value)};});}} placeholder="(63) 00000-0000" maxLength={15}/></div><div><label className="label">Parentesco</label><select className="input" value={form.guardian1Relation} onChange={setField('guardian1Relation')}><option value="">Selecione</option><option value="Pai">Pai</option><option value="Mae">Mae</option><option value="Avo/Avo">Avo/Avo</option><option value="Tio/Tia">Tio/Tia</option><option value="Irmao/Irma">Irmao/Irma</option><option value="Padrasto/Madrasta">Padrasto/Madrasta</option><option value="Outro">Outro</option></select></div></div></div>
            <div className="p-3 bg-gray-50 rounded-xl"><p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Responsavel 2</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><label className="label">Nome</label><input className="input" value={form.guardian2Name} onChange={setField('guardian2Name')}/></div><div><label className="label">Telefone</label><input className="input" value={form.guardian2Phone} onChange={function(e:any){setForm(function(f:any){return{...f,guardian2Phone:maskPhone(e.target.value)};});}} placeholder="(63) 00000-0000" maxLength={15}/></div><div><label className="label">Parentesco</label><select className="input" value={form.guardian2Relation} onChange={setField('guardian2Relation')}><option value="">Selecione</option><option value="Pai">Pai</option><option value="Mae">Mae</option><option value="Avo/Avo">Avo/Avo</option><option value="Tio/Tia">Tio/Tia</option><option value="Irmao/Irma">Irmao/Irma</option><option value="Padrasto/Madrasta">Padrasto/Madrasta</option><option value="Outro">Outro</option></select></div></div></div>
          </div>)}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Aluno'}</button></div>
      </div></div>)}
    </div>
  );
}
