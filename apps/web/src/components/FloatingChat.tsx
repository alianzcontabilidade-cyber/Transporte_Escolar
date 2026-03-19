import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2 } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  time: Date;
}

const SUGGESTIONS = [
  'Como cadastrar um aluno?',
  'Como gerar o boletim escolar?',
  'Como fazer a matrícula em lote?',
  'O que é o EDUCACENSO?',
  'Como usar o rastreamento GPS?',
  'Como funciona a lista de espera?',
];

// Simple AI responses based on keywords
function generateResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('cadastrar aluno') || q.includes('novo aluno'))
    return 'Para cadastrar um aluno:\n1. Acesse o módulo **Gestão Escolar > Alunos**\n2. Clique em **+ Novo Aluno**\n3. Preencha os dados nas abas: Dados, Saúde, Endereço e Responsáveis\n4. Clique em **Salvar**\n\nVocê também pode importar alunos em lote via CSV clicando em **Importar**.';

  if (q.includes('boletim'))
    return 'Para gerar o boletim escolar:\n1. Acesse **Ensino e Aprendizagem > Boletim Escolar**\n2. Selecione a **turma**\n3. Selecione o **aluno**\n4. O boletim será exibido com notas por bimestre e média final\n5. Clique em **Imprimir** para gerar o documento';

  if (q.includes('matrícula') || q.includes('matricula'))
    return 'Para matricular alunos:\n1. Acesse **Gestão Escolar > Matrículas**\n2. Clique em **Matricular Alunos**\n3. Selecione o **Ano Letivo** e a **Turma**\n4. Marque os alunos desejados\n5. Clique em **Matricular**\n\nPara matrícula individual, use o botão na lista de matrículas.';

  if (q.includes('educacenso') || q.includes('censo'))
    return 'O EDUCACENSO é o Censo Escolar da Educação Básica:\n1. Acesse **Ensino e Aprendizagem > EDUCACENSO**\n2. Verifique o **checklist de prontidão** (escolas, alunos, professores, turmas)\n3. Use os botões **Exportar CSV** para gerar os arquivos\n4. Importe os CSVs no sistema do INEP';

  if (q.includes('gps') || q.includes('rastreamento') || q.includes('transporte'))
    return 'O rastreamento GPS funciona assim:\n1. O **motorista** acessa **Rastreamento GPS** e inicia o tracking\n2. A posição é enviada a cada 10 segundos via Socket.IO\n3. Os **pais** acompanham em tempo real no **Portal do Responsável**\n4. O **admin** vê todos os ônibus no **Mapa Tempo Real**';

  if (q.includes('lista de espera') || q.includes('espera') || q.includes('vaga'))
    return 'Para gerenciar a lista de espera:\n1. Acesse **Gestão Escolar > Lista de Espera**\n2. Clique em **Adicionar** para incluir um aluno\n3. O sistema atribui a posição automaticamente\n4. Use os botões para **Convocar** ou **Matricular**\n5. Filtre por status: Aguardando, Convocado, Matriculado';

  if (q.includes('calendário') || q.includes('calendario') || q.includes('feriado'))
    return 'Para gerenciar o calendário escolar:\n1. Acesse **Ensino e Aprendizagem > Calendário Escolar**\n2. Clique em um dia ou em **+ Novo Evento**\n3. Escolha o tipo: Dia Letivo, Feriado, Recesso, Reunião, etc.\n4. Cada tipo tem uma cor diferente no calendário\n5. Navegue entre os meses com as setas';

  if (q.includes('parecer') || q.includes('descritivo'))
    return 'Para registrar pareceres descritivos:\n1. Acesse **Ensino e Aprendizagem > Parecer Descritivo**\n2. Selecione a **turma** e o **bimestre**\n3. Clique em **Escrever** ao lado de cada aluno\n4. Digite o parecer e clique em **Salvar**\n5. Use **Publicar Todos** quando finalizar';

  if (q.includes('remanejamento') || q.includes('transferir') || q.includes('transferência'))
    return 'Para remanejar alunos entre turmas:\n1. Acesse **Gestão Escolar > Remanejamento**\n2. Selecione a **turma de origem**\n3. Marque os alunos que deseja transferir\n4. Selecione a **turma de destino**\n5. Clique em **Confirmar Transferência**';

  if (q.includes('carteirinha') || q.includes('carteira'))
    return 'Para gerar carteirinhas estudantis:\n1. Acesse **Gestão Escolar > Carteirinha**\n2. Filtre por escola se desejar\n3. Clique em **Imprimir Carteirinhas** para todas\n4. Ou clique em um card individual para imprimir uma só';

  if (q.includes('financeiro') || q.includes('receita') || q.includes('despesa'))
    return 'Para gerenciar o financeiro:\n1. Acesse **Gestão e Recursos > Financeiro**\n2. Na aba **Contas**, cadastre contas bancárias (PDDE, próprio, etc.)\n3. Na aba **Movimentações**, registre receitas e despesas\n4. Os KPIs mostram saldo total, receitas e despesas';

  if (q.includes('merenda') || q.includes('cardápio') || q.includes('cardapio'))
    return 'Para gerenciar a merenda escolar:\n1. Acesse **Gestão e Recursos > Merenda Escolar**\n2. Clique em **Novo Cardápio**\n3. Informe data, refeição, descrição, calorias e custo\n4. Os cardápios ficam listados por data';

  if (q.includes('oi') || q.includes('olá') || q.includes('ola') || q.includes('ajuda') || q.includes('help'))
    return 'Olá! Sou o assistente do **NetEscol**. Posso ajudar com:\n\n- Cadastro de alunos e matrículas\n- Boletim escolar e notas\n- Transporte e rastreamento GPS\n- Calendário escolar\n- Financeiro e contratos\n- E muito mais!\n\nDigite sua dúvida que eu respondo!';

  return 'Desculpe, não encontrei uma resposta específica para essa pergunta. Tente perguntar sobre:\n\n- Cadastro de alunos\n- Matrículas\n- Boletim escolar\n- Rastreamento GPS\n- Calendário escolar\n- Lista de espera\n- Financeiro\n- Merenda escolar\n\nOu acesse o módulo desejado pelo menu lateral.';
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: 'Olá! Sou o assistente do **NetEscol**. Como posso ajudar?', time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response = generateResponse(msg);
      const botMsg: Message = { id: Date.now() + 1, role: 'assistant', content: response, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
    }, 600 + Math.random() * 800);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent-500 hover:bg-accent-600 text-white rounded-full shadow-lg shadow-accent-500/30 flex items-center justify-center transition-all hover:scale-110 z-50">
        <MessageSquare size={24} />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-accent-500 hover:bg-accent-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all relative">
          <MessageSquare size={24} />
          {messages.length > 1 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{messages.filter(m => m.role === 'assistant').length}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-accent-500 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <div><p className="font-semibold text-sm">Assistente NetEscol</p><p className="text-[10px] text-white/70">Online - Pronto para ajudar</p></div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-lg"><Minimize2 size={16} /></button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg"><X size={16} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-accent-600" />
              </div>
            )}
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-accent-500 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
            }`}>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                {msg.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center"><Bot size={14} className="text-accent-600" /></div>
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (show only at start) */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, 4).map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-3 py-1.5 rounded-full hover:bg-accent-100 dark:hover:bg-accent-900/40 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua dúvida..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm outline-none focus:ring-2 focus:ring-accent-400 text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
          />
          <button onClick={() => sendMessage()} disabled={!input.trim()}
            className="w-10 h-10 bg-accent-500 hover:bg-accent-600 text-white rounded-full flex items-center justify-center disabled:opacity-40 transition-colors">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
