import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation } from '../lib/hooks';
import { api } from '../lib/api';
import { School, Plus, X, Phone, Mail, MapPin, Pencil, Trash2, Search, Users } from 'lucide-react';

const emptyForm = { name:'', code:'', type:'fundamental', address:'', phone:'', email:'', directorName:'' };

export default function SchoolsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [formErr, setFormErr] = useState('');
  const { data: schools, refetch } = useQuery(function() { return api.schools.list({ municipalityId }); }, [municipalityId]);
  const { mutate: create, loading: creating } = useMutation(api.schools.create);
  const { mutate: update, loading: updating } = useMutation(api.schools.update);
  const { mutate: remove } = useMutation(api.schools.delete);

  const setField = function(k: string) { return function(e: any) { setForm(function(f: any) { return {...f,[k]:e.target.value}; }); }; };
  const all = (schools as any)||[];
  const filtered = all.filter(function(s: any) { const q = search.toLowerCase(); return s.name?.toLowerCase().includes(q)||(s.address||'').toLowerCase().includes(q)||(s.directorName||'').toLowerCase().includes(q); });

  const openNew = function() { setForm(emptyForm); setEditId(null); setFormErr(''); setShowModal(true); };
  const openEdit = function(s: any) { setForm({...emptyForm,...s}); setEditId(s.id); setFormErr(''); setShowModal(true); };

  const save = function() {
    if (!form.name) { setFormErr('Nome é obrigatório.'); return; }
    const payload = { municipalityId, name:form.name, code:form.code||undefined, type:form.type||undefined, address:form.address||undefined, phone:form.phone||undefined, email:form.email||undefined, directorName:form.directorName||undefined };
    if (editId!==null) {
      update({id:editId, name:form.name, code:form.code||undefined, type:form.type||undefined, address:form.address||undefined, phone:form.phone||undefined, email:form.email||undefined, directorName:form.directorName||undefined},{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    } else {
      create(payload,{onSuccess:function(){refetch();setShowModal(false);},onError:function(e:any){setFormErr(e?.message||'Erro');}});
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Escolas</h1><p className="text-gray-500">{all.length} escola(s) cadastrada(s)</p></div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={16}/> Nova Escola</button>
      </div>

      <div className="relative mb-4"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar por nome, endereço ou diretor..." value={search} onChange={function(e){setSearch(e.target.value);}}/></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(function(s: any){ return (
          <div key={s.id} className="card hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0"><School size={20} className="text-emerald-600"/></div>
              <div className="flex items-center gap-1">
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
                <div><label className="label">Código (INEP)</label><input className="input" value={form.code} onChange={setField('code')} placeholder="Ex: 12345678"/></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={setField('type')}><option value="infantil">Infantil</option><option value="fundamental">Fundamental</option><option value="medio">Médio</option><option value="tecnico">Técnico</option><option value="especial">Especial</option></select></div>
                <div className="col-span-2"><label className="label">Endereço</label><input className="input" value={form.address} onChange={setField('address')}/></div>
                <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={setField('phone')} placeholder="(00) 0000-0000"/></div>
                <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={setField('email')}/></div>
                <div className="col-span-2"><label className="label">Diretor(a)</label><input className="input" value={form.directorName} onChange={setField('directorName')}/></div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100"><button onClick={function(){setShowModal(false);}} className="btn-secondary flex-1">Cancelar</button><button onClick={save} disabled={creating||updating} className="btn-primary flex-1">{creating||updating?'Salvando...':editId?'Salvar alterações':'Salvar Escola'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
        }
