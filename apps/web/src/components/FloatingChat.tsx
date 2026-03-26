import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, MessageCircle, Minimize2, ArrowLeft, Search, Plus, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';

// ============================================
// ASSISTENTE IA - Respostas por palavras-chave
// ============================================
const SUGGESTIONS = [
  'Como cadastrar um aluno?',
  'Como gerar o boletim escolar?',
  'Como usar o rastreamento GPS?',
  'Como funciona a lista de espera?',
];

function generateResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('cadastrar aluno') || q.includes('novo aluno'))
    return 'Para cadastrar um aluno:\n1. Acesse **Gestão Escolar > Alunos**\n2. Clique em **+ Novo Aluno**\n3. Preencha os dados nas abas\n4. Clique em **Salvar**\n\nVocê também pode importar via CSV.';
  if (q.includes('boletim'))
    return 'Para gerar o boletim:\n1. Acesse **Ensino > Boletim Escolar**\n2. Selecione turma e aluno\n3. Clique em **Imprimir**';
  if (q.includes('matrícula') || q.includes('matricula'))
    return 'Para matricular:\n1. Acesse **Gestão Escolar > Matrículas**\n2. Selecione Ano Letivo e Turma\n3. Marque os alunos e clique **Matricular**';
  if (q.includes('gps') || q.includes('rastreamento') || q.includes('transporte'))
    return 'O rastreamento GPS:\n1. Motorista inicia tracking em **Rastreamento GPS**\n2. Posição enviada a cada 10s\n3. Pais acompanham no **Portal do Responsável**\n4. Admin vê tudo em **Mapa Tempo Real**';
  if (q.includes('lista de espera') || q.includes('espera'))
    return 'Lista de espera:\n1. Acesse **Gestão Escolar > Lista de Espera**\n2. Adicione alunos\n3. Use **Convocar** ou **Matricular**';
  if (q.includes('rota') || q.includes('gerar rota'))
    return 'Para gerar rotas automaticamente:\n1. Acesse **IA Rotas > Gerar Rotas**\n2. Selecione escola e garagem\n3. Configure capacidade e custos\n4. Clique **Gerar Rotas**\n\nO sistema usa Clarke-Wright + 2-opt.';
  if (q.includes('coleta') || q.includes('gps aluno'))
    return 'Para coletar GPS dos alunos:\n1. Acesse **Coleta GPS Alunos**\n2. Vá até a casa do aluno\n3. Clique **Marcar Ponto**\n4. Confirme no mapa e salve';
  if (q.includes('oi') || q.includes('olá') || q.includes('ajuda'))
    return 'Olá! Sou o assistente do **NetEscol**. Posso ajudar com cadastros, matrículas, transporte, relatórios e mais. Digite sua dúvida!';
  return 'Tente perguntar sobre: cadastro de alunos, matrículas, boletim, GPS, rotas, lista de espera, financeiro, ou merenda.';
}

// ============================================
// TIPOS
// ============================================
interface AIMessage { id: number; role: 'user' | 'assistant'; content: string; time: Date; }
interface Conversation { id: number; otherUser: { id: number; name: string; role: string }; lastMessage: any; unreadCount: number; }
interface ChatMsg { id: number; content: string; senderId: number; createdAt: string; }

const roleLabels: Record<string, string> = {
  parent: 'Responsável', secretary: 'Secretaria', school_admin: 'Gestão', municipal_admin: 'Admin',
  super_admin: 'Super Admin', driver: 'Motorista', monitor: 'Monitor', teacher: 'Professor',
};

// ============================================
// COMPONENTE UNIFICADO
// ============================================
export default function FloatingChat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [panel, setPanel] = useState<'closed' | 'menu' | 'assistant' | 'chat-list' | 'chat-conv' | 'chat-contacts'>('closed');
  const [unreadChat, setUnreadChat] = useState(0);

  // AI Assistant state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    { id: 0, role: 'assistant', content: 'Olá! Como posso ajudar?', time: new Date() }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load unread count
  useEffect(() => {
    if (!user) return;
    api.chat.unreadTotal().then((r: any) => setUnreadChat(r?.total || 0)).catch(() => {});
  }, [user]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const handler = () => setUnreadChat(p => p + 1);
    socket.on('chat:newMessage', handler);
    return () => { socket.off('chat:newMessage', handler); };
  }, [socket]);

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // AI send
  const sendAI = (text?: string) => {
    const msg = text || aiInput.trim();
    if (!msg) return;
    setAiMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg, time: new Date() }]);
    setAiInput(''); setAiTyping(true);
    setTimeout(() => {
      setAiMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: generateResponse(msg), time: new Date() }]);
      setAiTyping(false);
    }, 500 + Math.random() * 500);
  };

  // Chat functions
  const loadConversations = async () => {
    setLoadingChat(true);
    try { const r = await api.chat.conversations(); setConversations(r || []); } catch {}
    setLoadingChat(false);
  };
  const loadHistory = async (conv: Conversation) => {
    setActiveConv(conv); setPanel('chat-conv'); setLoadingChat(true);
    try {
      const msgs = await api.chat.history({ conversationId: conv.id });
      setChatMessages(msgs || []);
      if (conv.unreadCount > 0) { api.chat.markRead({ conversationId: conv.id }).catch(() => {}); setUnreadChat(p => Math.max(0, p - conv.unreadCount)); }
    } catch {}
    setLoadingChat(false);
  };
  const sendChat = async () => {
    if (!chatInput.trim() || !activeConv) return;
    const content = chatInput.trim(); setChatInput('');
    try {
      await api.chat.send({ conversationId: activeConv.id, content });
      const msgs = await api.chat.history({ conversationId: activeConv.id });
      setChatMessages(msgs || []);
    } catch {}
  };
  const loadContacts = async () => {
    setPanel('chat-contacts'); setLoadingChat(true);
    try { const r = await api.chat.availableContacts({ municipalityId: user?.municipalityId }); setContacts(r || []); } catch {}
    setLoadingChat(false);
  };
  const startConversation = async (contactId: number) => {
    try {
      await api.chat.send({ recipientId: contactId, content: 'Olá!' });
      await loadConversations(); setPanel('chat-list');
    } catch {}
  };

  const renderMarkdown = (t: string) => t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  // ====== CLOSED: Single floating button ======
  if (panel === 'closed') {
    return (
      <button onClick={() => setPanel('menu')}
        className="fixed bottom-5 right-5 w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 hover:from-accent-600 hover:to-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50">
        <MessageSquare size={20} />
        {unreadChat > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadChat}</span>}
      </button>
    );
  }

  // ====== MENU: Choose Assistant or Chat ======
  if (panel === 'menu') {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 w-56">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-gray-500 uppercase">Central de Ajuda</span>
            <button onClick={() => setPanel('closed')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={14} className="text-gray-400" /></button>
          </div>
          <button onClick={() => setPanel('assistant')}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors text-left">
            <div className="w-9 h-9 rounded-full bg-accent-100 flex items-center justify-center"><Bot size={18} className="text-accent-600" /></div>
            <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">Assistente IA</p><p className="text-[10px] text-gray-400">Tire dúvidas sobre o sistema</p></div>
          </button>
          <button onClick={() => { setPanel('chat-list'); loadConversations(); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left relative">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center"><MessageCircle size={18} className="text-blue-600" /></div>
            <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">Chat</p><p className="text-[10px] text-gray-400">Mensagens entre usuários</p></div>
            {unreadChat > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unreadChat}</span>}
          </button>
        </div>
      </div>
    );
  }

  // ====== ASSISTANT ======
  if (panel === 'assistant') {
    return (
      <div className="fixed bottom-5 right-5 w-80 h-[480px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
        <div className="bg-accent-500 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setPanel('menu')} className="p-1 hover:bg-white/20 rounded-lg"><ArrowLeft size={16} /></button>
            <Bot size={18} /><div><p className="font-semibold text-sm">Assistente NetEscol</p><p className="text-[10px] text-white/70">Online</p></div>
          </div>
          <button onClick={() => setPanel('closed')} className="p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {aiMessages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-1"><Bot size={12} className="text-accent-600" /></div>}
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${msg.role === 'user' ? 'bg-accent-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              </div>
            </div>
          ))}
          {aiTyping && <div className="flex gap-2"><div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center"><Bot size={12} className="text-accent-600" /></div><div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-2xl rounded-bl-sm"><div className="flex gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div></div></div>}
          <div ref={aiEndRef} />
        </div>
        {aiMessages.length <= 1 && <div className="px-3 pb-2 flex flex-wrap gap-1">{SUGGESTIONS.map(s => (<button key={s} onClick={() => sendAI(s)} className="text-[10px] bg-accent-50 text-accent-700 px-2 py-1 rounded-full hover:bg-accent-100">{s}</button>))}</div>}
        <div className="p-2.5 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
          <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} placeholder="Digite sua dúvida..." className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-xs outline-none focus:ring-2 focus:ring-accent-400" />
          <button onClick={() => sendAI()} disabled={!aiInput.trim()} className="w-8 h-8 bg-accent-500 hover:bg-accent-600 text-white rounded-full flex items-center justify-center disabled:opacity-40"><Send size={14} /></button>
        </div>
      </div>
    );
  }

  // ====== CHAT LIST ======
  if (panel === 'chat-list') {
    return (
      <div className="fixed bottom-5 right-5 w-80 h-[480px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setPanel('menu')} className="p-1 hover:bg-white/20 rounded-lg"><ArrowLeft size={16} /></button>
            <MessageCircle size={18} /><p className="font-semibold text-sm">Chat</p>
          </div>
          <div className="flex gap-1">
            <button onClick={loadContacts} className="p-1 hover:bg-white/20 rounded-lg" title="Nova conversa"><Plus size={16} /></button>
            <button onClick={() => setPanel('closed')} className="p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChat && <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>}
          {!loadingChat && conversations.length === 0 && (
            <div className="text-center py-12 px-4"><MessageCircle size={32} className="text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">Nenhuma conversa</p><button onClick={loadContacts} className="text-xs text-blue-500 mt-2 hover:underline">Iniciar nova conversa</button></div>
          )}
          {conversations.map(c => (
            <button key={c.id} onClick={() => loadHistory(c)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-left">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">{c.otherUser.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.otherUser.name}</p>{c.unreadCount > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{c.unreadCount}</span>}</div>
                <p className="text-[10px] text-gray-400 truncate">{c.lastMessage?.content || 'Sem mensagens'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ====== CHAT CONVERSATION ======
  if (panel === 'chat-conv' && activeConv) {
    return (
      <div className="fixed bottom-5 right-5 w-80 h-[480px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => { setPanel('chat-list'); loadConversations(); }} className="p-1 hover:bg-white/20 rounded-lg"><ArrowLeft size={16} /></button>
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{activeConv.otherUser.name.charAt(0)}</div>
            <div><p className="text-sm font-semibold truncate max-w-[140px]">{activeConv.otherUser.name}</p><p className="text-[10px] text-white/70">{roleLabels[activeConv.otherUser.role] || activeConv.otherUser.role}</p></div>
          </div>
          <button onClick={() => setPanel('closed')} className="p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : ''}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${msg.senderId === user?.id ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${msg.senderId === user?.id ? 'text-white/60' : 'text-gray-400'}`}>{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-2.5 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Digite uma mensagem..." className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-xs outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={sendChat} disabled={!chatInput.trim()} className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-40"><Send size={14} /></button>
        </div>
      </div>
    );
  }

  // ====== CONTACTS ======
  if (panel === 'chat-contacts') {
    return (
      <div className="fixed bottom-5 right-5 w-80 h-[480px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => { setPanel('chat-list'); loadConversations(); }} className="p-1 hover:bg-white/20 rounded-lg"><ArrowLeft size={16} /></button>
            <p className="font-semibold text-sm">Nova Conversa</p>
          </div>
          <button onClick={() => setPanel('closed')} className="p-1 hover:bg-white/20 rounded-lg"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChat && <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>}
          {contacts.map((c: any) => (
            <button key={c.id} onClick={() => startConversation(c.id)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-left">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-green-600">{c.name.charAt(0)}</div>
              <div><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.name}</p><p className="text-[10px] text-gray-400">{roleLabels[c.role] || c.role}</p></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
