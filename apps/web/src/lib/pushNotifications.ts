// Push Notifications - Capacitor + FCM + Web
import { api } from './api';

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function showLocalNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/bus.svg' }); } catch {}
  }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

// Registrar listeners IMEDIATAMENTE (antes do React montar)
// O token FCM chega muito rápido, antes do useEffect
let pendingToken: string | null = null;

try {
  import('@capacitor/push-notifications').then(({ PushNotifications }) => {
    console.log('[PUSH] Registrando listeners...');

    PushNotifications.addListener('registration', (token) => {
      console.log('[PUSH] TOKEN:', token.value.substring(0, 30) + '...');
      // Tentar salvar imediatamente
      const authToken = localStorage.getItem('token');
      if (authToken) {
        api.push.registerToken({ token: token.value, platform: 'android' })
          .then(() => console.log('[PUSH] Token salvo!'))
          .catch((e: any) => console.error('[PUSH] Erro save:', e?.message));
      } else {
        // Guardar para enviar depois do login
        pendingToken = token.value;
        console.log('[PUSH] Token guardado (aguardando login)');
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[PUSH] Erro registro:', JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PUSH] Notificação foreground:', notification.title);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action?.notification?.data || {};
      if (data.type === 'chat') window.location.href = '/';
      else if (['student_boarded','student_dropped','student_absent','trip_started','trip_completed','trip_cancelled','trip_interrupted'].includes(data.type)) window.location.href = '/portal-responsavel';
      else window.location.href = '/';
    });

    console.log('[PUSH] Listeners registrados');

    // Solicitar permissão e registrar IMEDIATAMENTE
    PushNotifications.checkPermissions().then(perm => {
      if (perm.receive === 'granted') {
        PushNotifications.register().then(() => console.log('[PUSH] register() OK'));
      } else {
        PushNotifications.requestPermissions().then(req => {
          if (req.receive === 'granted') {
            PushNotifications.register().then(() => console.log('[PUSH] register() OK após permissão'));
          }
        });
      }
    });
  }).catch(() => {
    // Não está no Capacitor
  });
} catch {
  // Web browser
}

// Chamado após o login para enviar token pendente e solicitar permissão
export async function initPushNotifications() {
  // Enviar token pendente se existir
  if (pendingToken) {
    try {
      await api.push.registerToken({ token: pendingToken, platform: 'android' });
      console.log('[PUSH] Token pendente salvo!');
      pendingToken = null;
    } catch (e: any) {
      console.error('[PUSH] Erro token pendente:', e?.message);
    }
  }

  // Solicitar permissão e registrar (se ainda não feito)
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive !== 'granted') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') return;
    }
    await PushNotifications.register();
    console.log('[PUSH] register() chamado');
  } catch {
    // Web browser - usar notificações web
    requestNotificationPermission();
  }
}
