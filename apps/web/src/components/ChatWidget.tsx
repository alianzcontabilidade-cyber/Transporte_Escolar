import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, ArrowLeft, User, Loader2, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useSocket } from '../lib/socket';

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  isRead: boolean;
  readAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

interface Conversation {
  id: number;
  otherUser: { id: number; name: string; role: string; avatarUrl: string | null };
  lastMessage: { content: string; senderId: number; createdAt: string } | null;
  unreadCount: number;
  lastMessageAt: string;
}

interface Contact {
  id: number;
  name: string;
  role: string;
  avatarUrl: string | null;
}

type ChatView = 'closed' | 'list' | 'conversation' | 'contacts';

const roleLabels: Record<string, string> = {
  parent: 'Responsável',
  secretary: 'Secretaria',
  school_admin: 'Gestao Escolar',
  municipal_admin: 'Administrador',
  super_admin: 'Super Admin',
  driver: 'Motorista',
  monitor: 'Monitor',
};

export default function ChatWidget({ embedded }: { embedded?: boolean } = {}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [view, setView] = useState<ChatView>(embedded ? 'list' : 'closed');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvo, setCurrentConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar contagem de não lidas
  const loadUnread = useCallback(async () => {
    try {
      const data = await api.chat.unreadTotal();
      setUnreadTotal(data?.count || 0);
    } catch (e) { /* ignore */ }
  }, []);

  // Carregar conversas
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.chat.conversations();
      setConversations(data || []);
    } catch (e) { console.error('Erro ao carregar conversas:', e); }
    finally { setLoading(false); }
  }, []);

  // Carregar historico de mensagens
  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setLoading(true);
      const data = await api.chat.history({ conversationId, limit: 50 });
      setMessages(data || []);
      // Marcar como lidas
      await api.chat.markRead({ conversationId });
      loadUnread();
    } catch (e) { console.error('Erro ao carregar mensagens:', e); }
    finally { setLoading(false); }
  }, [loadUnread]);

  // Carregar contatos disponiveis
  const loadContacts = useCallback(async () => {
    if (!user?.municipalityId) return;
    try {
      setLoading(true);
      const data = await api.chat.availableContacts({ municipalityId: user.municipalityId });
      setContacts(data || []);
    } catch (e) { console.error('Erro ao carregar contatos:', e); }
    finally { setLoading(false); }
  }, [user?.municipalityId]);

  // Poll unread count
  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [loadUnread]);

  // Socket: join user room para receber mensagens em tempo real
  useEffect(() => {
    if (!socket || !user?.id) return;
    socket.emit('join:user', user.id);
  }, [socket, user?.id]);

  // Socket: receber mensagens em tempo real
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (data: any) => {
      // Se a conversa atual e a mesma, adicionar mensagem
      if (currentConvo && data.conversationId === currentConvo.id) {
        setMessages(prev => [...prev, {
          id: data.messageId,
          content: data.content,
          senderId: data.senderId,
          isRead: true,
          createdAt: data.createdAt,
        }]);
        // Marcar como lida imediatamente
        api.chat.markRead({ conversationId: data.conversationId }).catch(() => {});
      } else {
        // Atualizar contagem de não lidas
        loadUnread();
      }
      // Atualizar lista de conversas se aberta
      if (view === 'list') {
        loadConversations();
      }
    };
    socket.on('chat:message', handleMessage);

    // Listener para check marks de leitura em tempo real
    const handleRead = (data: any) => {
      if (data.conversationId === currentConvo) {
        setMessages(prev => prev.map(m => m.senderId === user?.id ? { ...m, isRead: true, readAt: data.readAt } : m));
      }
    };
    socket.on('chat:messagesRead', handleRead);

    return () => { socket.off('chat:message', handleMessage); socket.off('chat:messagesRead', handleRead); };
  }, [socket, currentConvo, view, loadConversations, loadUnread]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening conversation
  useEffect(() => {
    if (view === 'conversation') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [view]);

  // Enviar mensagem
  async function handleSend() {
    if (!newMessage.trim() || !currentConvo || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
    try {
      const result = await api.chat.send({
        recipientId: currentConvo.otherUser.id,
        content,
      });
      // Adicionar mensagem localmente
      setMessages(prev => [...prev, {
        id: result.messageId || Date.now(),
        content,
        senderId: user!.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      }]);
      // Atualizar conversationId se era nova conversa
      if (result.conversationId && (!currentConvo.id || currentConvo.id !== result.conversationId)) {
        setCurrentConvo(prev => prev ? { ...prev, id: result.conversationId } : prev);
      }
    } catch (e: any) {
      console.error('Erro ao enviar:', e);
      setNewMessage(content); // Restaurar mensagem em caso de erro
    }
    finally { setSending(false); }
  }

  // Abrir conversa
  function openConversation(convo: Conversation) {
    setCurrentConvo(convo);
    setView('conversation');
    loadMessages(convo.id);
  }

  // Iniciar nova conversa com contato
  function startConversation(contact: Contact) {
    // Verificar se ja existe conversa com esse contato
    const existing = conversations.find(c => c.otherUser.id === contact.id);
    if (existing) {
      openConversation(existing);
      return;
    }
    // Criar conversa "virtual" (sera criada no backend ao enviar a primeira mensagem)
    const newConvo: Conversation = {
      id: 0,
      otherUser: contact,
      lastMessage: null,
      unreadCount: 0,
      lastMessageAt: new Date().toISOString(),
    };
    setCurrentConvo(newConvo);
    setMessages([]);
    setView('conversation');
  }

  // Abrir lista
  function openChat() {
    setView('list');
    loadConversations();
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' });
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function getInitial(name: string) {
    return name?.charAt(0)?.toUpperCase() || '?';
  }

  const filteredContacts = searchTerm
    ? contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : contacts;

  if (!user) return null;

  return (
    <>
      {/* FAB Button (hidden in embedded mode) */}
      {view === 'closed' && !embedded && (
        <button
          onClick={openChat}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-all hover:scale-105 active:scale-95"
          title="Chat"
        >
          <MessageCircle size={24} />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {view !== 'closed' && (
        <div className={embedded ? 'w-full h-[60vh] bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden' : 'fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-50 w-full sm:w-96 h-[85vh] sm:h-[520px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden'}>
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            {view === 'conversation' && (
              <button onClick={() => { setView('list'); loadConversations(); }} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            {view === 'contacts' && (
              <button onClick={() => setView('list')} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}

            <div className="flex-1 min-w-0">
              {view === 'list' && <h3 className="font-semibold text-sm">Conversas</h3>}
              {view === 'contacts' && <h3 className="font-semibold text-sm">Novo Chat</h3>}
              {view === 'conversation' && currentConvo && (
                <div>
                  <h3 className="font-semibold text-sm truncate">{currentConvo.otherUser.name}</h3>
                  <p className="text-[11px] text-white/70">{roleLabels[currentConvo.otherUser.role] || currentConvo.otherUser.role}</p>
                </div>
              )}
            </div>

            {view === 'list' && (
              <button onClick={() => { setView('contacts'); loadContacts(); setSearchTerm(''); }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Nova conversa">
                <Plus size={18} />
              </button>
            )}

            {!embedded && (
              <button onClick={() => setView('closed')} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary-500" />
              </div>
            )}

            {/* Conversations List */}
            {view === 'list' && !loading && (
              <div>
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageCircle size={40} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma conversa</p>
                    <button onClick={() => { setView('contacts'); loadContacts(); setSearchTerm(''); }}
                      className="mt-3 text-primary-600 text-sm font-medium hover:underline">
                      Iniciar novo chat
                    </button>
                  </div>
                ) : (
                  conversations.map(c => (
                    <button key={c.id} onClick={() => openConversation(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {c.otherUser.avatarUrl
                          ? <img src={c.otherUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          : getInitial(c.otherUser.name)
                        }
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate text-gray-800">{c.otherUser.name}</p>
                          {c.lastMessage && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(c.lastMessage.createdAt)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-gray-500 truncate">
                            {c.lastMessage
                              ? (c.lastMessage.senderId === user!.id ? 'Você: ' : '') + c.lastMessage.content
                              : roleLabels[c.otherUser.role] || c.otherUser.role
                            }
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                              {c.unreadCount > 9 ? '9+' : c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Contacts List */}
            {view === 'contacts' && !loading && (
              <div>
                <div className="px-4 py-2 sticky top-0 bg-white border-b border-gray-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Buscar contato..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                    />
                  </div>
                </div>
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <User size={40} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nenhum contato encontrado</p>
                  </div>
                ) : (
                  filteredContacts.map(c => (
                    <button key={c.id} onClick={() => startConversation(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {c.avatarUrl
                          ? <img src={c.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          : getInitial(c.name)
                        }
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm text-gray-800">{c.name}</p>
                        <p className="text-[11px] text-gray-500">{roleLabels[c.role] || c.role}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Messages */}
            {view === 'conversation' && !loading && (
              <div className="px-3 py-3 space-y-2 min-h-full flex flex-col justify-end">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Envie a primeira mensagem</p>
                  </div>
                )}
                {messages.map(msg => {
                  const isMine = msg.senderId === user!.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? 'bg-primary-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}>
                        <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'} text-right flex items-center justify-end gap-1`}>
                          {formatTime(msg.createdAt)}
                          {isMine && (
                            <span className={msg.isRead ? 'text-blue-300' : 'opacity-70'}>
                              {msg.isRead ? '✓✓' : msg.deliveredAt ? '✓✓' : '✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          {view === 'conversation' && (
            <div className="px-3 py-2 border-t border-gray-100 bg-white flex-shrink-0">
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50"
                  maxLength={2000}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
