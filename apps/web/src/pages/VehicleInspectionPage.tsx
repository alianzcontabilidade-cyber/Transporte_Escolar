import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { ClipboardCheck, Printer, CheckCircle, XCircle, AlertTriangle, Bus } from 'lucide-react';

const CHECKLIST = [
  { id: 'pneus', label: 'Pneus em bom estado', category: 'Segurança' },
  { id: 'freios', label: 'Freios funcionando', category: 'Segurança' },
  { id: 'luzes', label: 'Luzes e faróis', category: 'Segurança' },
  { id: 'extintor', label: 'Extintor de incêndio', category: 'Segurança' },
  { id: 'cinto', label: 'Cintos de segurança', category: 'Segurança' },
  { id: 'saida', label: 'Saída de emergência', category: 'Segurança' },
  { id: 'espelhos', label: 'Espelhos retrovisores', category: 'Segurança' },
  { id: 'bancos', label: 'Bancos e estofados', category: 'Conforto' },
  { id: 'janelas', label: 'Janelas e vidros', category: 'Conforto' },
  { id: 'limpeza', label: 'Limpeza interna', category: 'Conforto' },
  { id: 'ar', label: 'Ar condicionado/ventilação', category: 'Conforto' },
  { id: 'motor', label: 'Motor sem vazamentos', category: 'Mecânica' },
  { id: 'oleo', label: 'Nível de óleo', category: 'Mecânica' },
  { id: 'agua', label: 'Nível de água/radiador', category: 'Mecânica' },
  { id: 'bateria', label: 'Bateria', category: 'Mecânica' },
  { id: 'documentos', label: 'Documentação em dia', category: 'Documentação' },
  { id: 'crlv', label: 'CRLV válido', category: 'Documentação' },
  { id: 'seguro', label: 'Seguro em dia', category: 'Documentação' },
];

export default function VehicleInspectionPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [selVehicle, setSelVehicle] = useState('');
  const [checks, setChecks] = useState<Record<string, 'ok' | 'nok' | ''>>({});
  const [observations, setObservations] = useState('');
  const [inspector, setInspector] = useState(user?.name || '');

  const { data: vehiclesData } = useQuery(() => api.vehicles.list({ municipalityId: mid }), [mid]);
  const allVehicles = (vehiclesData as any) || [];
  const vehicle = allVehicles.find((v: any) => String(v.id) === selVehicle);

  const toggle = (id: string) => setChecks(prev => ({ ...prev, [id]: prev[id] === 'ok' ? 'nok' : 'ok' }));
  const total = CHECKLIST.length;
  const okCount = Object.values(checks).filter(v => v === 'ok').length;
  const nokCount = Object.values(checks).filter(v => v === 'nok').length;
  const pct = total > 0 ? Math.round((okCount / total) * 100) : 0;

  const printInspection = () => {
    if (!vehicle) return;
    const categories = [...new Set(CHECKLIST.map(c => c.category))];
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Vistoria - ${vehicle.plate}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px}
    h2{color:#1B3A5C;font-size:14px;margin-top:20px}
    .info{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:15px 0;font-size:13px}
    .info div{padding:8px;background:#f8f9fa;border-radius:6px}
    .check{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;font-size:13px}
    .ok{color:#16a34a}.nok{color:#dc2626}.pending{color:#999}
    .summary{margin-top:20px;padding:15px;background:#f0f9ff;border-radius:8px;font-size:13px}
    .signatures{display:flex;justify-content:space-between;margin-top:60px}
    .sig{text-align:center;width:200px;border-top:1px solid #333;padding-top:5px;font-size:11px}
    .footer{margin-top:30px;text-align:center;font-size:10px;color:#999}
    @media print{body{padding:15px}}</style></head><body>
    <h1>RELATÓRIO DE VISTORIA VEICULAR</h1>
    <div class="info"><div><b>Placa:</b> ${vehicle.plate}</div><div><b>Veículo:</b> ${vehicle.brand || ''} ${vehicle.model || ''}</div><div><b>Ano:</b> ${vehicle.year || '--'}</div><div><b>Data:</b> ${new Date().toLocaleDateString('pt-BR')}</div><div><b>Inspetor:</b> ${inspector}</div><div><b>Resultado:</b> ${pct}% aprovado</div></div>
    ${categories.map(cat => `<h2>${cat}</h2>${CHECKLIST.filter(c => c.category === cat).map(c => {
      const status = checks[c.id];
      return `<div class="check"><span class="${status === 'ok' ? 'ok' : status === 'nok' ? 'nok' : 'pending'}">${status === 'ok' ? '✓' : status === 'nok' ? '✗' : '○'}</span> ${c.label}</div>`;
    }).join('')}`).join('')}
    ${observations ? '<div class="summary"><b>Observações:</b><br>'+observations+'</div>' : ''}
    <div class="summary"><b>Resumo:</b> ${okCount} aprovado(s), ${nokCount} reprovado(s), ${total - okCount - nokCount} pendente(s) — <b>${pct}%</b></div>
    <div class="signatures"><div class="sig">Inspetor / Vistoriador</div><div class="sig">Responsável pela Frota</div></div>
    <div class="footer">Gerado por NetEscol em ${new Date().toLocaleString('pt-BR')}</div></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const categories = [...new Set(CHECKLIST.map(c => c.category))];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><ClipboardCheck size={20} className="text-orange-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Vistoria de Veículos</h1><p className="text-gray-500">Checklist de inspeção veicular</p></div></div>
        {vehicle && okCount + nokCount > 0 && <button onClick={printInspection} className="btn-primary flex items-center gap-2"><Printer size={16} /> Imprimir Relatório</button>}
      </div>

      <div className="flex gap-3 mb-5">
        <select className="input w-72" value={selVehicle} onChange={e => { setSelVehicle(e.target.value); setChecks({}); setObservations(''); }}><option value="">Selecione o veículo</option>{allVehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plate} {v.nickname ? '- ' + v.nickname : ''} {v.brand ? '(' + v.brand + ')' : ''}</option>)}</select>
        <input className="input w-48" value={inspector} onChange={e => setInspector(e.target.value)} placeholder="Nome do inspetor" />
      </div>

      {vehicle ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {categories.map(cat => (
              <div key={cat} className="card">
                <h3 className="font-semibold text-gray-800 mb-3">{cat}</h3>
                <div className="space-y-1">{CHECKLIST.filter(c => c.category === cat).map(c => {
                  const status = checks[c.id] || '';
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <button onClick={() => toggle(c.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status === 'ok' ? 'bg-green-500 text-white' : status === 'nok' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                        {status === 'ok' ? <CheckCircle size={16} /> : status === 'nok' ? <XCircle size={16} /> : '○'}
                      </button>
                      <span className={`text-sm ${status === 'nok' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{c.label}</span>
                    </div>
                  );
                })}</div>
              </div>
            ))}
            <div className="card"><label className="label">Observações</label><textarea className="input" rows={3} value={observations} onChange={e => setObservations(e.target.value)} placeholder="Observações adicionais da vistoria..." /></div>
          </div>

          <div>
            <div className="card mb-4 text-center">
              <Bus size={32} className="text-orange-500 mx-auto mb-2" />
              <p className="text-xl font-bold">{vehicle.plate}</p>
              <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
              {vehicle.nickname && <p className="text-sm text-orange-600 font-medium">{vehicle.nickname}</p>}
            </div>
            <div className="card text-center">
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 -rotate-90"><circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" /><circle cx="48" cy="48" r="40" fill="none" stroke={pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" /></svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{pct}%</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-green-600 flex items-center justify-center gap-1"><CheckCircle size={14} /> {okCount} aprovado(s)</p>
                <p className="text-red-600 flex items-center justify-center gap-1"><XCircle size={14} /> {nokCount} reprovado(s)</p>
                <p className="text-gray-400">{total - okCount - nokCount} pendente(s)</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-16"><ClipboardCheck size={48} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-500">Selecione um veículo para realizar a vistoria</p></div>
      )}
    </div>
  );
}
