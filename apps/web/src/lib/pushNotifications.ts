// Push Notifications - Capacitor + FCM + Web
import { api } from './api';

// Solicitar permissão de notificação web
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Mostrar notificação local (web)
export function showLocalNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/bus.svg' }); } catch {}
  }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

let initialized = false;

export async function initPushNotifications() {
  if (initialized) return;
  initialized = true;

  const authToken = localStorage.getItem('token');
  if (!authToken) {
    console.log('[PUSH] Sem token de auth, pulando');
    return;
  }

  console.log('[PUSH] Iniciando registro...');

  // Tentar Capacitor PushNotifications
  try {
    const mod = await import('@capacitor/push-notifications');
    const PushNotifications = mod.PushNotifications;
    console.log('[PUSH] Plugin carregado');

    // Solicitar permissão
    let perm;
    try {
      perm = await PushNotifications.checkPermissions();
      console.log('[PUSH] Permissão atual:', perm.receive);
      if (perm.receive !== 'granted') {
        perm = await PushNotifications.requestPermissions();
        console.log('[PUSH] Permissão solicitada:', perm.receive);
      }
    } catch (e: any) {
      console.log('[PUSH] Erro permissão:', e?.message);
      return;
    }

    if (perm.receive !== 'granted') {
      console.log('[PUSH] Permissão negada');
      return;
    }

    // Registrar listeners ANTES de chamar register()
    PushNotifications.addListener('registration', async (token) => {
      console.log('[PUSH] TOKEN RECEBIDO:', token.value);
      try {
        await api.push.registerToken({ token: token.value, platform: 'android' });
        console.log('[PUSH] Token salvo no servidor!');
      } catch (e: any) {
        console.error('[PUSH] Erro ao salvar token:', e?.message);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[PUSH] ERRO DE REGISTRO:', JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PUSH] Notificação recebida (foreground):', JSON.stringify(notification));
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[PUSH] Ação na notificação:', JSON.stringify(action));
      window.location.href = '/';
    });

    // Agora registrar
    try {
      await PushNotifications.register();
      console.log('[PUSH] register() chamado com sucesso');
    } catch (e: any) {
      console.error('[PUSH] Erro no register():', e?.message);
    }

  } catch (e: any) {
    console.log('[PUSH] Plugin não disponível (web browser):', e?.message);
    // No navegador web, usar Web Push API se disponível
    requestNotificationPermission();
  }
}
