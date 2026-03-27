import { useState } from 'react';
import { Bus, MapPin, Users, Bell, GraduationCap, Route, Navigation, MessageCircle, ChevronRight, X, CheckCircle } from 'lucide-react';

interface OnboardingProps {
  role: string;
  userName: string;
  onComplete: () => void;
}

const SLIDES: Record<string, { icon: any; title: string; desc: string; color: string }[]> = {
  municipal_admin: [
    { icon: Bus, title: 'Gestão Completa', desc: 'Gerencie escolas, alunos, rotas, veículos, motoristas e monitores em um único sistema.', color: '#1E40AF' },
    { icon: Route, title: 'Rotas Inteligentes', desc: 'Gere rotas automaticamente com IA (Clarke-Wright + 2-opt). Calcule custos por rota e aluno.', color: '#059669' },
    { icon: MapPin, title: 'GPS e Mapas', desc: 'Colete GPS dos alunos, acompanhe ônibus em tempo real e navegue pelo Google Maps.', color: '#0369A1' },
    { icon: Bell, title: 'Notificações Push', desc: 'Pais recebem alertas quando o aluno embarca, desembarca ou o ônibus cancela a viagem.', color: '#7C3AED' },
  ],
  secretary: [
    { icon: GraduationCap, title: 'Gestão Escolar', desc: 'Matrículas, turmas, notas, boletins, frequência e calendário escolar.', color: '#1E40AF' },
    { icon: Users, title: 'Alunos e Professores', desc: 'Cadastro completo com 72 campos, importação via Excel, ficha de matrícula.', color: '#059669' },
    { icon: Bus, title: 'Transporte', desc: 'Acompanhe rotas, veículos e custos do transporte escolar.', color: '#0369A1' },
    { icon: Bell, title: 'Relatórios', desc: 'Exporte relatórios em PDF, Word, CSV com assinatura eletrônica.', color: '#7C3AED' },
  ],
  driver: [
    { icon: Bus, title: 'Sua Rota', desc: 'Veja sua rota, paradas e alunos. Inicie a viagem com um toque.', color: '#1E40AF' },
    { icon: Navigation, title: 'Navegação GPS', desc: 'O Google Maps abre automaticamente com a rota traçada e navegação por voz.', color: '#059669' },
    { icon: Users, title: 'Embarque', desc: 'Registre embarque e desembarque dos alunos. Os pais são notificados automaticamente.', color: '#0369A1' },
    { icon: MessageCircle, title: 'Chat', desc: 'Comunique-se com a secretaria e monitores pelo chat integrado.', color: '#7C3AED' },
  ],
  monitor: [
    { icon: Users, title: 'Lista de Chamada', desc: 'Confira os alunos da rota, faça a chamada e registre embarques/desembarques.', color: '#1E40AF' },
    { icon: MapPin, title: 'Mapa da Rota', desc: 'Veja o mapa com todas as paradas e navegue até cada uma.', color: '#059669' },
    { icon: Bell, title: 'QR Scanner', desc: 'Escaneie a carteirinha do aluno para registro rápido de embarque.', color: '#0369A1' },
    { icon: MessageCircle, title: 'Contatos', desc: 'Acesse telefones dos pais e comunique-se pelo chat.', color: '#7C3AED' },
  ],
  parent: [
    { icon: Bus, title: 'Acompanhe em Tempo Real', desc: 'Veja onde o ônibus está no mapa e receba alertas quando seu filho embarcar.', color: '#1E40AF' },
    { icon: Bell, title: 'Notificações', desc: 'Receba push quando o aluno embarcar, desembarcar, estiver ausente ou a viagem cancelar.', color: '#059669' },
    { icon: GraduationCap, title: 'Boletim e Frequência', desc: 'Acompanhe notas, faltas, parecer descritivo e calendário escolar.', color: '#0369A1' },
    { icon: MessageCircle, title: 'Chat', desc: 'Comunique-se com a escola e motoristas pelo chat do sistema.', color: '#7C3AED' },
  ],
};

export default function Onboarding({ role, userName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const slides = SLIDES[role] || SLIDES['parent'];
  const isLast = step === slides.length - 1;
  const Slide = slides[step];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-accent-500' : i < step ? 'w-4 bg-accent-300' : 'w-4 bg-gray-200'}`} />
            ))}
          </div>
          <button onClick={onComplete} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="px-8 py-8 text-center">
          {step === 0 && (
            <p className="text-sm text-gray-500 mb-4">Olá, <strong>{userName}</strong>! Bem-vindo ao NetEscol</p>
          )}
          <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: Slide.color + '15' }}>
            <Slide.icon size={36} style={{ color: Slide.color }} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{Slide.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{Slide.desc}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-semibold text-gray-600 text-sm">
              Voltar
            </button>
          )}
          <button onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="flex-1 py-3 rounded-2xl bg-accent-500 hover:bg-accent-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            {isLast ? <><CheckCircle size={16} /> Começar a usar</> : <>Próximo <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
