import { useState, useRef } from 'react';
import { api } from '../lib/api';
import { useQuery, useMutation } from '../lib/hooks';
import { FileText, Upload, Trash2, X, Image, File, Download } from 'lucide-react';

const DOC_TYPES: any = { certidao_nascimento:'Certidão de Nascimento', rg:'RG', cpf:'CPF', comprovante_residencia:'Comprovante de Residência', historico_escolar:'Histórico Escolar', laudo_medico:'Laudo Médico', foto:'Foto', outro:'Outro' };

export default function StudentDocumentsModal({ studentId, studentName, onClose }: { studentId: number; studentName: string; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'outro', fileUrl: '' });
  const [showAdd, setShowAdd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: docs, refetch } = useQuery(() => api.studentDocuments.list({ studentId }), [studentId]);
  const { mutate: create } = useMutation(api.studentDocuments.create);
  const { mutate: remove } = useMutation(api.studentDocuments.delete);

  const allDocs = (docs as any) || [];

  const handleFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, fileUrl: ev.target?.result as string, name: f.name || file.name }));
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name) return;
    create({ studentId, name: form.name, type: form.type as any, fileUrl: form.fileUrl || undefined },
      { onSuccess: () => { refetch(); setShowAdd(false); setForm({ name: '', type: 'outro', fileUrl: '' }); } });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div><h3 className="text-lg font-semibold flex items-center gap-2"><FileText size={18} className="text-blue-500" /> Documentos</h3><p className="text-sm text-gray-500">{studentName}</p></div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm flex items-center gap-1"><Upload size={14} /> Anexar</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"><X size={20} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {showAdd && (
            <div className="card mb-4 bg-blue-50 border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-3">Novo Documento</p>
              <div className="space-y-3">
                <div><label className="label">Nome do documento *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Certidão de nascimento" /></div>
                <div><label className="label">Tipo</label><select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></div>
                <div>
                  <label className="label">Arquivo (imagem ou PDF)</label>
                  <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="input" />
                </div>
                {form.fileUrl && form.fileUrl.startsWith('data:image') && (
                  <img src={form.fileUrl} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
                )}
                <div className="flex gap-2"><button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 text-sm">Cancelar</button><button onClick={save} className="btn-primary flex-1 text-sm">Salvar</button></div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {allDocs.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  {doc.fileUrl && doc.fileUrl.startsWith('data:image') ? <Image size={18} className="text-blue-600" /> : <File size={18} className="text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">{DOC_TYPES[doc.type] || doc.type} • {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-1">
                  {doc.fileUrl && <button onClick={() => { const w = window.open(); if(w) { w.document.write('<img src="'+doc.fileUrl+'" style="max-width:100%"/>'); } }} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg" title="Ver"><Download size={14} /></button>}
                  <button onClick={() => remove({ id: doc.id }, { onSuccess: refetch })} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg" title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {!allDocs.length && !showAdd && (
              <div className="text-center py-8"><FileText size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500 text-sm">Nenhum documento anexado</p><button onClick={() => setShowAdd(true)} className="text-accent-500 text-sm hover:underline mt-2">Anexar primeiro documento</button></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
