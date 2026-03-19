import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { ESTADOS_BR, useMunicipios } from '../lib/ibge';
import { School, Plus, X, Phone, Mail, MapPin, Pencil, Trash2, Search, Users, Clock, Loader2, Eye, Download } from 'lucide-react';
import { maskPhone } from '../lib/utils';

const emptyForm = { name:'', code:'', type:'fundamental', address:'', state:'', city:'', phone:'', email:'', directorName:'', morningStart:'07:00', morningEnd:'12:00', afternoonStart:'13:00', afternoonEnd:'17:00', latitude:'', longitude:'' };

export default function SchoolsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const [viewSchool, setViewSchool] = useState<any>(null);
  const { data: schools, refetch } = useQuery(function() { return api.schools.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.schools.create);
  const { mutate: update, loading: updating } = useMutation(api.schools.update);
  const { mutate: remove } = useMutation(api.schools.delete);

  const { municipios: schMunicipios, loading: schMunLoading } = useMunicipios(form.state);
  const setField = function(k: string) { return function(e: any) { setForm(function(f: any) { return {...f,[k]:e.target.value}; }); }; };
  const all = (schools as any)||[];
  const filtered = all.filter(function(s: any) { const q = search.toLowerCase(); return s.name?.toLowerCase().includes(q)||(s.address||'').toLowerCase().includes(q)||(s.directorName||'').toLowerCase().includes(q); });

  const openNew = function() { setForm(emptyForm); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEdit = function(s: any) { setForm({...emptyForm,...s, phone: s.phone || '', latitude: s.latitude ? String(s.latitude) : '', longitude: s.longitude ? String(s.longitude) : ''}); setEditId(s.id); setFormErr(''); setShowModal(true); };

  const save = function() {
    if (!form.name) { setFormErr('Nome e obrigatorio.'); return; }
    const fullAddress = [form.address, form.city, form.state].filter(Boolean).join(', ');
    const payload: any = { municipalityId, name:form.name, code:form.code||undefined, type:form.type||undefined, address:fullAddress||undefined, phone:form.phone||undefined, email:form.email||undefined, directorName:form.directorName||undefined, morningStart:form.morningStart||undefined, morningEnd:form.morningEnd||undefined, afternoonStart:form.afternoonStart||undefined, afternoonEnd:form.afternoonEnd||undefined, latitude:form.latitude?parseFloat(form.latitude):undefined, longitude:form.longitude?parseFloat(form.longitude):undefined };
    if (editId!==null) {
      update({id:editId, ...payload},{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    } else {
      create(payload,{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    }
  };

  const exportSchoolsCSV = function() {
    if (!all.length) return;
    const rows = all.map(function(s: any) { return { nome: s.name||'', tipo: s.type||'', codigo_inep: s.code||'', diretor: s.directorName||'', telefone: s.phone||'', email: s.email||'', endereco: s.address||'' }; });
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(';'), ...rows.map(function(r: any) { return keys.map(function(k) { return '"'+(r[k]||'')+'"'; }).join(';'); })].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'})); a.download = 'escolas_netescol.csv'; a.click();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Escolas</h1><p className="text-gray-500">{all.length} escola(s) cadastrada(s)</p></div>
        <div className="flex gap-2"><button onClick={exportSchoolsCSV} className="btn-secondary flex items-center gap-2"><Download size={16}/> Exportar</button><button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Nova Escola</button></div>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por nome, endereço ou diretor..." value={search} onChange={function(e){setSearch(e.target.value);}}/></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(function(s: any){ return (
          <div key={s.id} className="card hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><School size={20} className="text-emerald-600"/></div>
              <div className="flex items-center gap-1">
                <button onClick={function(){setViewSchool(s);}} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Detalhes"><Eye size={14}/></button>
                <button onClick={function(){openEdit(s);}} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors" title="Editar"><Pencil size={14}/></button>
                <button onClick={function(){setConfirmDelete(s);}} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={14}/></button>
              </div>
            </div>
            <p className="font-bold text-gray-900">{s.name}</p>
            <div className="mt-2 space-y-1">
              {s.address&&<p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10}/>{s.address}</p>}
              {s.phone&&<p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/>{s.phone}</p>}
              {s.email&&<p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10}/>{s.email}</p>}
              {s.directorName&&<p className="text-xs text-gray-500">Diretor(a): {s.directorName}</p>}
              {s.type&&<p className="text-xs text-gray-500 flex items-center gap-1"><Users size={10}/>{s.type}</p>}
            </div>
          </div>
        );})}
        {!filtered.length&&!search&&<div className="col-span-3 card text-center py-16"><School size={48} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500 mb-4">Nenhuma escola cadastrada</p><button className="btn-primary" onClick={openNew}>Adicionar escola</button></div>}
        {!filtered.length&&search&&<div className="col-span-3 card text-center py-8"><p className="text-gray-500">Nenhum resultado para "{search}"</p></div>}
      </div>

      {viewSchool&&(<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-blue-500"/> Detalhes da Escola</h3><button onClick={function(){setViewSchool(null);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
        <div className="overflow-y-auto flex-1 p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{viewSchool.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Tipo</p><p className="text-sm font-medium">{viewSchool.type||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Codigo INEP</p><p className="text-sm font-medium">{viewSchool.code||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Diretor(a)</p><p className="text-sm font-medium">{viewSchool.directorName||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Telefone</p><p className="text-sm font-medium">{viewSchool.phone||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium">{viewSchool.email||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Endereco</p><p className="text-sm font-medium">{viewSchool.address||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Manha</p><p className="text-sm font-medium">{viewSchool.morningStart||'--'} - {viewSchool.morningEnd||'--'}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400">Tarde</p><p className="text-sm font-medium">{viewSchool.afternoonStart||'--'} - {viewSchool.afternoonEnd||'--'}</p></div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t"><button onClick={function(){setViewSchool(null);}} className="btn-secondary flex-1">Fechar</button><button onClick={function(){const s=viewSchool;const html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+s.name+' - NetEscol</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}.field{padding:10px;background:#f8f9fa;border-radius:8px}.field-label{font-size:11px;color:#999;margin-bottom:3px}.field-value{font-size:14px;font-weight:500}.footer{margin-top:30px;text-align:center;font-size:11px;color:#999}@media print{body{padding:15px}}</style></head><body><h1>'+s.name+'</h1><div class="grid"><div class="field"><div class="field-label">Tipo</div><div class="field-value">'+(s.type||'--')+'</div></div><div class="field"><div class="field-label">Codigo INEP</div><div class="field-value">'+(s.code||'--')+'</div></div><div class="field"><div class="field-label">Diretor(a)</div><div class="field-value">'+(s.directorName||'--')+'</div></div><div class="field"><div class="field-label">Telefone</div><div class="field-value">'+(s.phone||'--')+'</div></div><div class="field"><div class="field-label">Email</div><div class="field-value">'+(s.email||'--')+'</div></div><div class="field"><div class="field-label">Endereco</div><div class="field-value">'+(s.address||'--')+'</div></div><div class="field"><div class="field-label">Manha</div><div class="field-value">'+(s.morningStart||'--')+' - '+(s.morningEnd||'--')+'</div></div><div class="field"><div class="field-label">Tarde</div><div class="field-value">'+(s.afternoonStart||'--')+' - '+(s.afternoonEnd||'--')+'</div></div></div><div class="footer">Gerado por NetEscol em '+new Date().toLocaleDateString('pt-BR')+'</div></body></html>';const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.print();}}} className="btn-secondary flex-1 flex items-center justify-center gap-1"><Download size={14}/> Imprimir</button><button onClick={function(){setViewSchool(null);openEdit(viewSchool);}} className="btn-primary flex-1">Editar</button></div>
      </div></div>)}

      {confirmDelete&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500"/></div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir {confirmDelete.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3"><button onClick={function(){setConfirmDelete(null);}} className="btn-secondary flex-1">Cancelar</button><button onClick={function(){remove({id:confirmDelete.id},{onSuccess:function(){refetch();setConfirmDelete(null);}});}} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">Excluir</button></div>
          </div>
        </div>
      )}

      {showModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100"><h3 className="text-lg font-semibold">{editId?'Editar Escola':'Nova Escola'}</h3><button onClick={function(){setShowModal(false);}} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20}/></button></div>
            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {formErr&&<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{formErr}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Nome da escola *</label><input className="input" value={form.name} onChange={setField('name')} placeholder="Ex: Escola Municipal Centro"/></div>
                <div><label className="label">Codigo (INEP)</label><input className="input" value={form.code} onChange={setField('code')} placeholder="Ex: 12345678"/></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={setField('type')}><option value="infantil">Infantil</option><option value="fundamental">Fundamental</option><option value="medio">Medio</option><option value="tecnico">Tecnico</option><option value="especial">Especial</option></select></div>
                <div className="col-span-2"><label className="label">Endereco</label><input className="input" value={form.address} onChange={setField('address')}/></div>
                <div><label className="label">Estado</label><select className="input" value={form.state} onChange={function(e: any){setForm(function(f:any){return{...f,state:e.target.value,city:''};});}}><option value="">Selecione</option>{ESTADOS_BR.map(function(es){return <option key={es.uf} value={es.uf}>{es.uf} - {es.nome}</option>;})}</select></div>
                <div><label className="label">Cidade {schMunLoading && <Loader2 size={12} className="inline animate-spin"/>}</label><select className="input" value={form.city} onChange={setField('city')} disabled={!form.state||schMunLoading}><option value="">Selecione</option>{schMunicipios.map(function(m:any){return <option key={m.id} value={m.nome}>{m.nome}</option>;})}</select></div>
                <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={function(e:any){setForm(function(f:any){return{...f,phone:maskPhone(e.target.value)};});}} placeholder="(00) 00000-0000" maxLength={15}/></div>
                <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={setField('email')}/></div>
                <div className="col-span-2"><label className="label">Diretor(a)</label><input className="input" value={form.directorName} onChange={setField('directorName')}/></div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl mt-2">
                <p className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><Clock size={14}/> Horarios de Funcionamento</p>
                <div className="grid grid-cols-4 gap-3">
                  <div><label className="label text-xs">Manha inicio</label><input className="input" type="time" value={form.morningStart} onChange={setField('morningStart')}/></div>
                  <div><label className="label text-xs">Manha fim</label><input className="input" type="time" value={form.morningEnd} onChange={setField('morningEnd')}/></div>
                  <div><label className="label text-xs">Tarde inicio</label><input className="input" type="time" value={form.afternoonStart} onChange={setField('afternoonStart')}/></div>
                  <div><label className="label text-xs">Tarde fim</label><input className="input" type="time" value={form.afternoonEnd} onChange={setField('afternoonEnd')}/></div>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2"><MapPin size={14}/> Coordenadas (para o mapa)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label text-xs">Latitude</label><input className="input" value={form.latitude} onChange={setField('latitude')} placeholder="-10.1234"/></div>
                  <div><label className="label text-xs">Longitude</label><input className="input" value={form.longitude} onChange={setField('longitude')} placeholder="-48.5678"/></div>
                </div>
                <p className="text-xs text-green-600 mt-2">Dica: Abra o Google Maps, clique com botao direito no local e copie as coordenadas.</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Escola'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
        }
