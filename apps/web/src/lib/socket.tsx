import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { showLocalNotification, requestNotificationPermission } from './pushNotifications';

interface SocketContextType { socket: Socket | null; connected: boolean; }
const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Use same origin in production (empty string), or VITE_API_URL for development
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const token = localStorage.getItem('token');
    const s = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      auth: { token: token || '' },
    });
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    // =============================================
    // BROWSER PUSH NOTIFICATIONS ON STUDENT EVENTS
    // =============================================
    // Solicitar permissao assim que conectar
    s.on('connect', () => {
      requestNotificationPermission();
    });

    // Embarque de aluno
    s.on('student:boarded', (data: any) => {
      if (document.visibilityState !== 'visible' || document.hidden) {
        showLocalNotification(
          'Aluno embarcou!',
          `${data.studentName || 'Seu filho(a)'} embarcou no onibus escolar.`,
          { tag: `boarded-${data.studentId}`, url: '/portal-responsavel' }
        );
      }
    });

    // Desembarque de aluno
    s.on('student:dropped', (data: any) => {
      if (document.visibilityState !== 'visible' || document.hidden) {
        showLocalNotification(
          'Aluno desembarcou!',
          `${data.studentName || 'Seu filho(a)'} desembarcou com seguranca.`,
          { tag: `dropped-${data.studentId}`, url: '/portal-responsavel' }
        );
      }
    });

    // Aluno ausente
    s.on('student:absent', (data: any) => {
      if (document.visibilityState !== 'visible' || document.hidden) {
        showLocalNotification(
          'Aluno ausente',
          `${data.studentName || 'Seu filho(a)'} foi registrado como ausente.`,
          { tag: `absent-${data.studentId}`, url: '/portal-responsavel' }
        );
      }
    });

    // Viagem iniciada
    s.on('trip:started', (data: any) => {
      if (document.visibilityState !== 'visible' || document.hidden) {
        showLocalNotification(
          'Viagem iniciada!',
          `O onibus da rota ${data.routeName || ''} iniciou a viagem.`,
          { tag: `trip-${data.tripId}`, url: '/portal-responsavel' }
        );
      }
    });

    // Viagem concluida
    s.on('trip:completed', (data: any) => {
      if (document.visibilityState !== 'visible' || document.hidden) {
        showLocalNotification(
          'Viagem concluida',
          `A viagem da rota ${data.routeName || ''} foi concluida.`,
          { tag: `trip-complete-${data.tripId}`, url: '/portal-responsavel' }
        );
      }
    });

    // Chat message received
    s.on('chat:message', (data: any) => {
      if (document.visibilityState !== 'visible' || document.hidden) {
        showLocalNotification(
          `Mensagem de ${data.senderName || 'NetEscol'}`,
          data.content || 'Nova mensagem no chat',
          { tag: `chat-${data.conversationId}`, url: '/portal-responsavel' }
        );
      }
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export function useSocket() { return useContext(SocketContext); }
