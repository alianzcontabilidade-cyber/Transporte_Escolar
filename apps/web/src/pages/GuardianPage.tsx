import { useState } from 'react';
import { Bus, Clock, CheckCircle, Bell, Phone, AlertTriangle, Navigation, Heart, MapPin } from 'lucide-react';
const NOTIFS = [{ id:1, type:'board', msg:'João Pedro embarcou', time:'07:15', read:false },{ id:2, type:'delay', msg:'Atraso de 10 min na parada 3', time:'07:08', read:false },{ id:3, type:'arrive', msg:'Ônibus chegou à escola', time:'07:45', read:true }];
export default function GuardianPage() {
  const [tab, setTab] = useState<'track'|'notif'|'contact'>('track');
  const [notifs, setNotifs] = useState(NOTIFS);
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Portal do Responsável</h1><p className="text-gray-500">Acompanhe o transporte escolar do seu filho</p></div>
      <div className="card mb-5 p-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">J</div>
          <div><p className="font-bold text-lg">João Pedro Silva</p><p className="text-white/80 text-sm">5º Ano A · Escola Municipal Centro</p><p className="text-white/70 text-xs mt-0.5">Mat. 2024001</p></div>
          <div className="ml-auto"><span className="bg-green-400/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10}/> Em rota</span></div>
        </div>
      </div>
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        {[['track','Rastreamento',Navigation],['notif',unread>0?`Notif. (${unread})`:'Notificações',Bell],['contact','Contato',Phone]].map(([id,label,Icon]: any) => (
          <button key={id} onClick={() => { setTab(id); if(id==='notif') setNotifs(n => n.map(x => ({...x,read:true}))); }} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={14}/> {label}{id==='notif'&&unread>0&&tab!=='notif'&&<span className="w-2 h-2 bg-red-500 rounded-full ml-1"/>}
          </button>
        ))}
      </div>
      {tab==='track' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><Bus size={18} className="text-green-600"/></div><div><p className="font-semibold">Rota Centro – Escola Municipal</p><p className="text-sm text-gray-500">ABC-1234 · João Silva</p></div></div><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><Navigation size={10}/> Ao vivo</span></div>
          <div className="bg-gray-100 rounded-xl h-40 flex items-center justify-center mb-4 overflow-hidden relative"><div className="text-center"><div className="text-4xl mb-2">🚌</div><p className="text-sm font-medium text-gray-600">GPS em tempo real</p><p className="text-xs text-gray-400">Atualizado há 30s</p></div></div>
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><MapPin size={14}/> Paradas</p>
          <div className="space-y-2">{[{n:'Ponto 1 – Praça Central',t:'07:00',d:true},{n:'Ponto 2 – Av. Brasil',t:'07:15',d:true},{n:'Ponto 3 – Rua das Flores',t:'07:25',d:false,c:true},{n:'Escola Municipal Centro',t:'07:45',d:false}].map((s,i) => (<div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${s.c?'bg-primary-50 border border-primary-200':''}`}><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${s.d?'bg-green-500 text-white':s.c?'bg-primary-500 text-white':'bg-gray-200 text-gray-500'}`}>{s.d?'✓':i+1}</div><p className={`text-sm flex-1 ${s.c?'font-semibold text-primary-700':s.d?'text-gray-400 line-through':''}`}>{s.n}</p><span className="text-xs text-gray-400"><Clock size={10} className="inline mr-1"/>{s.t}</span></div>))}</div>
        </div>
      )}
      {tab==='notif' && (<div className="space-y-3">{notifs.map(n => (<div key={n.id} className={`card flex items-start gap-3 ${!n.read?'border-primary-200 bg-primary-50/30':''}`}><div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${n.type==='board'?'bg-green-100':n.type==='delay'?'bg-yellow-100':'bg-blue-100'}`}>{n.type==='board'?<CheckCircle size={16} className="text-green-600"/>:n.type==='delay'?<AlertTriangle size={16} className="text-yellow-600"/>:<MapPin size={16} className="text-blue-600"/>}</div><div className="flex-1"><p className={`text-sm ${!n.read?'font-semibold text-gray-800':'text-gray-600'}`}>{n.msg}</p><p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={10}/>{n.time}</p></div>{!n.read&&<div className="w-2 h-2 bg-primary-500 rounded-full mt-2"/>}</div>))}</div>)}
      {tab==='contact' && (<div className="space-y-4"><div className="card"><h3 className="font-semibold mb-3">Motorista</h3><div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-700">J</div><div><p className="font-medium">João Silva</p><p className="text-sm text-gray-500">ABC-1234</p></div></div><a href="tel:(63)99999-0001" className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm"><Phone size={14}/> Ligar</a></div></div><div className="card"><h3 className="font-semibold mb-3 flex items-center gap-2"><Heart size={16}/> Secretaria de Educação</h3><div className="space-y-2">{[['📞','(63) 3300-0000'],['📧','secretaria@municipio.gov.br'],['⏰','Seg–Sex, 8h–17h']].map(([l,v]) => <div key={l} className="flex justify-between text-sm py-1"><span className="text-gray-600">{l}</span><span className="font-medium">{v}</span></div>)}</div></div></div>)}
    </div>
  );
}
