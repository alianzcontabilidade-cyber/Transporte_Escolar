import { useAuth } from '../lib/auth';
import { Info, Server, Database, Globe, Shield, Code, Users } from 'lucide-react';

export default function SystemInfoPage() {
  const { user } = useAuth();

  const systemInfo = [
    { label: 'Sistema', value: 'NetEscol - Gestão Escolar Municipal', icon: Globe },
    { label: 'Versão', value: '3.0.0', icon: Code },
    { label: 'Módulos', value: '6 (Painel Central, Gestão Escolar, Ensino e Aprendizagem, Frota e Rotas, Gestão e Recursos, Central de Controle)', icon: Server },
    { label: 'Páginas', value: '53+ funcionalidades', icon: Database },
    { label: 'Banco de Dados', value: '48 tabelas MySQL', icon: Database },
    { label: 'Tecnologia', value: 'React 18 + TypeScript + Tailwind CSS + tRPC + Drizzle ORM', icon: Code },
    { label: 'Servidor', value: 'Express.js + Socket.IO (tempo real)', icon: Server },
    { label: 'Hospedagem', value: 'Railway.app', icon: Globe },
    { label: 'Segurança', value: 'JWT + bcrypt + CORS + HTTPS', icon: Shield },
    { label: 'PWA', value: 'Instalável no celular com Service Worker', icon: Globe },
  ];

  const features = [
    'Gestão de escolas, alunos, professores e turmas',
    'Matrículas individuais e em lote',
    'Diário escolar com frequência e notas',
    'Boletim escolar e parecer descritivo',
    'Transporte escolar com GPS em tempo real',
    'Portal do responsável (pais)',
    'Calendário escolar com integração ao transporte',
    'EDUCACENSO - exportação para o censo',
    'RH, financeiro, contratos e patrimônio',
    'Merenda escolar e biblioteca',
    'Comunicação e envio em massa via WhatsApp',
    'Cotação de compras com 3 fornecedores',
    'Declarações e certidões automáticas',
    'Relatórios com exportação CSV/PDF/HTML',
    'QR Codes para alunos',
    'Tema claro/escuro',
    'Chat assistente com IA',
    'Busca por código de tela',
    'Sistema de favoritos e histórico',
    'Portal de Transparência público',
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <img src="/logo.png" alt="NetEscol" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">NetEscol</h1>
        <p className="text-gray-500 mt-1">Sistema de Gestão Escolar Municipal Inteligente</p>
        <p className="text-sm text-accent-600 font-medium mt-2">Versão 3.0.0</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Info size={18} /> Informações do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {systemInfo.map((info, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0"><info.icon size={16} className="text-accent-600" /></div>
              <div><p className="text-xs text-gray-400">{info.label}</p><p className="text-sm font-medium text-gray-800 dark:text-gray-200">{info.value}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Funcionalidades Principais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-accent-500 rounded-full flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-primary-500 text-white">
        <div className="flex items-center gap-3">
          <Users size={24} />
          <div>
            <p className="font-semibold">Logado como: {user?.name}</p>
            <p className="text-white/70 text-sm">{user?.email} · {user?.role}</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">NetEscol © 2026 · Todos os direitos reservados</p>
    </div>
  );
}
