// ============================================
// WEB PUSH NOTIFICATIONS HELPER
// ============================================

/**
 * Solicita permissao para notificacoes do navegador.
 * Retorna true se foi concedida.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Navegador nao suporta notificacoes');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Mostra uma notificacao local do navegador (quando a aba esta aberta mas sem foco).
 */
export function showLocalNotification(title: string, body: string, options?: {
  url?: string;
  tag?: string;
  icon?: string;
}) {
  if (Notification.permission !== 'granted') return;

  // Se o service worker esta ativo, usar ele para mostrar a notificacao (funciona em background)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: options?.icon || '/bus.svg',
        badge: '/bus.svg',
        tag: options?.tag || 'netescol-' + Date.now(),
        data: { url: options?.url || '/' },
        requireInteraction: false,
      } as NotificationOptions);
    });
    return;
  }

  // Fallback: notificacao direta
  try {
    new Notification(title, {
      body,
      icon: options?.icon || '/bus.svg',
      tag: options?.tag || 'netescol-' + Date.now(),
    });
  } catch (e) {
    // Alguns navegadores nao suportam new Notification() diretamente
    console.warn('Erro ao criar notificacao:', e);
  }
}

/**
 * Verifica se o navegador suporta notificacoes push e se ja foram permitidas.
 */
export function getNotificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Solicita permissao e mostra uma notificacao de teste.
 */
export async function testNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (granted) {
    showLocalNotification('NetEscol', 'Notificacoes ativadas com sucesso!', {
      tag: 'test-notification',
    });
  }
  return granted;
}
