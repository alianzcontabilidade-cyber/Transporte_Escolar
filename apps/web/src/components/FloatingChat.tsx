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

// Verifica se TODAS as palavras-chave estão na frase (em qualquer ordem)
function matchAll(q: string, ...words: string[]) { return words.every(w => q.includes(w)); }
// Verifica se ALGUMA palavra-chave está na frase
function matchAny(q: string, ...words: string[]) { return words.some(w => q.includes(w)); }

function generateResponse(question: string): string {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos

  // Alunos
  if (matchAny(q, 'aluno', 'aluna', 'estudante') && matchAny(q, 'cadastr', 'novo', 'adicionar', 'incluir', 'inserir', 'registrar', 'como'))
    return 'Para cadastrar um aluno:\n1. Acesse **Gestão Escolar > Alunos**\n2. Clique em **+ Novo Aluno**\n3. Preencha os dados pessoais, endereço, transporte e saúde\n4. Marque a localização no mapa (Google Maps)\n5. Clique em **Salvar**\n\n💡 Você também pode importar alunos via **planilha CSV/Excel**.';
  if (matchAny(q, 'aluno', 'aluna', 'estudante'))
    return 'Sobre **Alunos**:\n• **Cadastro**: Gestão Escolar > Alunos > + Novo\n• **Importar**: Botão importar CSV/Excel na lista\n• **Ficha**: Clique no aluno > Exportar > Ficha de Matrícula\n• **Carteirinha**: Gestão Escolar > Carteirinha\n• **GPS**: A localização do aluno é cadastrada no mapa\n• **Distância**: Calculada automaticamente até a escola';

  // Escola
  if (matchAny(q, 'escola') && matchAny(q, 'cadastr', 'nova', 'adicionar', 'como', 'registrar'))
    return 'Para cadastrar uma escola:\n1. Acesse **Gestão Escolar > Escolas**\n2. Clique em **+ Nova Escola**\n3. Preencha nome, CNPJ, endereço, horários\n4. Marque a localização no **mapa Google**\n5. Clique em **Salvar**';
  if (matchAny(q, 'escola'))
    return 'Sobre **Escolas**:\n• **Cadastro**: Gestão Escolar > Escolas\n• **GPS**: Localização no mapa Google no formulário\n• **Relatórios**: Gestão Escolar > Relatório Escola\n• **EDUCACENSO**: Ensino > EDUCACENSO';

  // Matrícula
  if (matchAny(q, 'matricul'))
    return 'Sobre **Matrículas**:\n1. Acesse **Gestão Escolar > Matrículas**\n2. Selecione o **Ano Letivo** e a **Turma**\n3. Marque os alunos e clique **Matricular**\n\n• **Ficha**: Gestão Escolar > Ficha de Matrícula\n• **Remanejamento**: Para transferir entre turmas\n• **Lista de Espera**: Alunos aguardando vaga';

  // Boletim / Notas
  if (matchAny(q, 'boletim', 'nota', 'avaliacao', 'prova'))
    return 'Sobre **Notas e Boletim**:\n1. **Lançar notas**: Ensino > Lançar Notas\n2. **Boletim**: Ensino > Boletim Escolar > Selecione turma e aluno\n3. **Parecer**: Ensino > Parecer Descritivo\n4. **ATA**: Ensino > ATA Resultados\n\nO boletim pode ser exportado em **PDF** com assinatura digital.';

  // Diário / Frequência
  if (matchAny(q, 'diario', 'frequencia', 'falta', 'presenca', 'chamada'))
    return 'Sobre **Diário e Frequência**:\n1. Acesse **Ensino > Diário Escolar**\n2. Selecione turma e data\n3. Marque presença/falta de cada aluno\n\n• **Diário de Classe**: Relatório mensal de frequência\n• **Relatório**: Ensino > Rel. Frequência';

  // Rotas / IA
  if (matchAny(q, 'rota') && matchAny(q, 'gerar', 'criar', 'automatica', 'ia', 'otimiz'))
    return 'Para **gerar rotas automaticamente**:\n1. Acesse **Central de Controle > IA Rotas**\n2. Aba **Gerar Rotas**\n3. Selecione **escola** e **garagem**\n4. Configure capacidade e custos\n5. Clique **Simular Rotas** (preview)\n6. Revise no mapa e clique **Aprovar**\n\nUsa algoritmo **Clarke-Wright + 2-opt** para otimização.';
  if (matchAny(q, 'rota'))
    return 'Sobre **Rotas**:\n• **Cadastro**: Frota e Rotas > Rotas\n• **Gerar pela IA**: Central de Controle > IA Rotas > Gerar Rotas\n• **Monitorar**: Frota > Monitoramento / Mapa GPS\n• **Custos**: Relatório de Transporte mostra custo por rota\n• **Paradas**: Cada rota tem paradas com alunos vinculados';

  // GPS / Coleta / Mapa
  if (matchAny(q, 'gps', 'localiza', 'mapa', 'ponto', 'coleta', 'coordenada'))
    return 'Sobre **GPS e Localização**:\n• **Coleta GPS**: Frota > Coleta GPS Alunos\n  1. Vá até a casa do aluno\n  2. Clique **Marcar Ponto** > Confirme\n• **Rastreamento**: Frota > Rastreamento GPS (motorista)\n• **Mapa Tempo Real**: Frota > Mapa GPS\n• **Escola/Aluno**: No cadastro, use o Google Maps\n• **Distância**: Calculada automaticamente aluno↔escola';

  // Transporte
  if (matchAny(q, 'transport', 'onibus', 'veiculo', 'motorista', 'monitor'))
    return 'Sobre **Transporte Escolar**:\n• **Veículos**: Frota > Veículos (cadastro da frota)\n• **Motoristas**: Frota > Motoristas\n• **Monitores**: Frota > Monitores\n• **Rotas**: Frota > Rotas\n• **Garagens**: Frota > Garagens\n• **Fornecedores**: Frota > Fornecedores\n• **OS**: Frota > Ordens de Serviço\n• **Vistoria**: Frota > Vistoria Veículos';

  // Relatório
  if (matchAny(q, 'relatorio', 'exportar', 'imprimir', 'pdf', 'excel'))
    return 'Sobre **Relatórios e Exportação**:\n• **Central**: Gestão > Central de Relatórios\n• **Transporte**: Frota > Relatório (custos por rota)\n• **Alunos**: Abra o cadastro > botão Exportar\n• **Formatos**: PDF, Word, CSV, HTML, Impressão\n• **Assinatura**: Marque "Assinar ao gerar" no PDF\n\nTodo relatório pode ter **assinatura eletrônica** e **QR Code**.';

  // Financeiro / Custo
  if (matchAny(q, 'financ', 'custo', 'despesa', 'receita', 'orcamento', 'gasto'))
    return 'Sobre **Financeiro**:\n• **Contas**: Gestão e Recursos > Financeiro\n• **Contratos**: Gestão > Contratos\n• **Custos de Rota**: Frota > Relatório de Transporte\n• **Cotações**: Gestão > Cotação de Compras';

  // Merenda
  if (matchAny(q, 'merenda', 'alimenta', 'cardapio', 'refeic'))
    return 'Sobre **Merenda Escolar**:\n• **Cardápio**: Gestão > Merenda (criar cardápios semanais)\n• **Estoque**: Gestão > Estoque Merenda\n• **Relatório**: Gestão > Central Relatórios > Merenda';

  // Lista de espera
  if (matchAny(q, 'espera', 'fila', 'vaga'))
    return 'Sobre **Lista de Espera**:\n1. Acesse **Gestão Escolar > Lista de Espera**\n2. Adicione alunos com **+ Adicionar**\n3. Quando surgir vaga: **Convocar** ou **Matricular**\n4. O aluno é movido automaticamente para a turma';

  // RH
  if (matchAny(q, 'funcionario', 'servidor', 'rh', 'recurso humano', 'pessoal', 'cargo'))
    return 'Sobre **Recursos Humanos**:\n• **Quadro**: Gestão > RH (cargos, departamentos)\n• **Motoristas**: Frota > Motoristas\n• **Monitores**: Frota > Monitores\n• **Professores**: Gestão Escolar > Professores\n• **Relatório**: Gestão > Relatório RH';

  // Backup
  if (matchAny(q, 'backup', 'copia', 'seguranca dos dados', 'restaur'))
    return 'Sobre **Backup**:\n1. Acesse **Central de Controle > Backup**\n2. Clique **Criar Backup** (exporta JSON)\n3. Para restaurar: **Importar Backup**\n\nRecomendação: faça backup **semanalmente**.';

  // Configurações
  if (matchAny(q, 'config', 'tema', 'escuro', 'claro', 'aparencia'))
    return 'Sobre **Configurações**:\n• Acesse **Central de Controle > Configurações**\n• **Tema**: Claro ou Escuro\n• **Notificações**: Ativar/desativar alertas\n• **Formulários**: Central > Config. Formulários';

  // Perfil
  if (matchAny(q, 'perfil', 'senha', 'minha conta', 'meus dados'))
    return 'Sobre **Meu Perfil**:\n• Acesse **Central de Controle > Meu Perfil**\n• Atualize: cargo, decreto, matrícula, departamento\n• Esses dados aparecem na **assinatura digital** dos relatórios';

  // Assinatura
  if (matchAny(q, 'assinatura', 'assinar', 'certificado', 'digital'))
    return 'Sobre **Assinatura Eletrônica**:\n• Ao exportar PDF, marque **"Assinar ao gerar"**\n• Informe sua **senha** para validar\n• O documento recebe **QR Code** de verificação\n• Baseado na **Lei 14.063/2020**\n• Configure seus dados em **Meu Perfil**';

  // Saudação
  if (matchAny(q, 'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'ajuda', 'help'))
    return 'Olá! 👋 Sou o assistente do **NetEscol**.\n\nPosso ajudar com:\n• 📋 **Cadastros** (alunos, escolas, motoristas)\n• 📝 **Matrículas** e lista de espera\n• 🚌 **Transporte** e rotas\n• 📊 **Relatórios** e exportações\n• 🗺️ **GPS** e mapas\n• 💰 **Financeiro** e custos\n• ⚙️ **Configurações** do sistema\n\nDigite sua dúvida!';

  // Fallback inteligente - tenta identificar o assunto
  const topics = [
    { keys: ['turma', 'classe'], resp: 'Sobre **Turmas**: Gestão Escolar > Turmas. Crie turmas, vincule à série e ao ano letivo.' },
    { keys: ['professor', 'docente'], resp: 'Sobre **Professores**: Gestão Escolar > Professores. Cadastre docentes e vincule às disciplinas.' },
    { keys: ['disciplina', 'materia'], resp: 'Sobre **Disciplinas**: Ensino > Disciplinas. Cadastre componentes curriculares.' },
    { keys: ['calendario', 'feriado', 'evento'], resp: 'Sobre **Calendário**: Ensino > Calendário Escolar. Registre feriados, eventos e dias letivos.' },
    { keys: ['patrimonio', 'bem', 'equipamento'], resp: 'Sobre **Patrimônio**: Gestão > Patrimônio. Controle bens patrimoniais da escola.' },
    { keys: ['biblioteca', 'livro', 'emprestimo'], resp: 'Sobre **Biblioteca**: Gestão > Biblioteca. Gerencie acervo e empréstimos.' },
    { keys: ['documento', 'declaracao', 'certidao'], resp: 'Sobre **Documentos**: Gestão Escolar > Declarações ou Central > Gestão de Documentos.' },
    { keys: ['comunicacao', 'mensagem', 'aviso', 'chat'], resp: 'Sobre **Comunicação**: Use o **Chat** (botão no canto) para enviar mensagens. Para avisos gerais: Gestão > Comunicação ou Mural.' },
    { keys: ['fornecedor', 'mecanica', 'posto'], resp: 'Sobre **Fornecedores**: Frota > Fornecedores. Cadastre mecânicas, postos, seguradoras.' },
    { keys: ['ordem', 'servico', 'os', 'manutencao'], resp: 'Sobre **Ordens de Serviço**: Frota > Ordens de Serviço. Registre manutenções preventivas e corretivas.' },
    { keys: ['garagem'], resp: 'Sobre **Garagens**: Frota > Garagens. Cadastre locais de guarda dos veículos com GPS.' },
    { keys: ['vistoria', 'inspecao'], resp: 'Sobre **Vistoria**: Frota > Vistoria Veículos. Checklist de inspeção antes das viagens.' },
  ];
  for (const t of topics) {
    if (t.keys.some(k => q.includes(k))) return t.resp;
  }

  return 'Não encontrei uma resposta específica para sua pergunta. 🤔\n\nTente perguntar sobre:\n• **Alunos** - cadastro, matrícula, ficha\n• **Escolas** - cadastro, GPS\n• **Rotas** - geração automática, custos\n• **GPS** - coleta, rastreamento\n• **Relatórios** - exportar, imprimir\n• **Notas** - boletim, diário\n• **Financeiro** - custos, contratos\n\nOu digite **ajuda** para ver todas as opções.';
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
    api.chat.unreadTotal().then((r: any) => setUnreadChat(r?.count || r?.total || 0)).catch(() => {});
  }, [user]);

  // Som de notificação
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 800; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      // Segundo tom (mais agudo)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.frequency.value = 1200; osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Notificação nativa do navegador
  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/bus.svg', badge: '/bus.svg', tag: 'netescol-chat' });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  // Pedir permissão de notificação web
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Socket listeners - notificação de nova mensagem
  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      setUnreadChat(p => p + 1);

      // Som de notificação
      playNotificationSound();

      // Vibrar no celular
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

      // Se está na conversa aberta, recarregar mensagens
      if (panel === 'chat-conv' && activeConv && data?.conversationId === activeConv.id) {
        api.chat.history({ conversationId: activeConv.id }).then((msgs: any) => setChatMessages(msgs || [])).catch(() => {});
      }

      // Notificação nativa do navegador/celular
      if (data?.senderName && data?.content) {
        showBrowserNotification('💬 ' + data.senderName, data.content);
      }

      // Toast visual na tela
      if (data?.senderName && data?.content) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;max-width:350px;padding:14px 18px;background:#1E40AF;color:white;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.3);font-family:Arial,sans-serif;font-size:13px;cursor:pointer;transform:translateX(120%);transition:transform 0.3s ease';
        toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:15px">' + (data.senderName?.charAt(0) || '?') + '</div><div><b style="display:block;margin-bottom:2px">' + data.senderName + '</b><span style="opacity:0.85;font-size:12px">' + (data.content.length > 60 ? data.content.substring(0, 60) + '...' : data.content) + '</span></div></div>';
        toast.onclick = () => { toast.remove(); setPanel('chat-list'); loadConversations(); };
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
        setTimeout(() => { if (toast.parentElement) { toast.style.transform = 'translateX(120%)'; setTimeout(() => toast.remove(), 300); } }, 6000);
      }
    };
    socket.on('chat:newMessage', handler);
    return () => { socket.off('chat:newMessage', handler); };
  }, [socket, panel, activeConv]);

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Auto-refresh: polling a cada 3s quando conversa está aberta
  useEffect(() => {
    if (panel !== 'chat-conv' || !activeConv) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await api.chat.history({ conversationId: activeConv.id });
        if (msgs && msgs.length !== chatMessages.length) {
          setChatMessages(msgs);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [panel, activeConv, chatMessages.length]);

  // Auto-refresh lista de conversas quando está na lista
  useEffect(() => {
    if (panel !== 'chat-list') return;
    const interval = setInterval(() => { loadConversations(); }, 5000);
    return () => clearInterval(interval);
  }, [panel]);

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
      const contact = contacts.find((c: any) => c.id === contactId);
      const greeting = `Olá${contact ? ', ' + contact.name.split(' ')[0] : ''}! Estou entrando em contato pelo sistema NetEscol.`;
      await api.chat.send({ recipientId: contactId, content: greeting });
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
          <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} placeholder="Digite sua dúvida..." autoCapitalize="sentences" className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-xs outline-none focus:ring-2 focus:ring-accent-400" />
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
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Digite uma mensagem..." autoCapitalize="sentences" className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-xs outline-none focus:ring-2 focus:ring-blue-400" />
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
