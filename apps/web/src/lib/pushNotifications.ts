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
  // Notificação nativa do navegador
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/bus.svg' }); } catch {}
  }
  // Vibrar
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

let initialized = false;

export async function initPushNotifications() {
  if (initialized) return;
  initialized = true;

  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.register();

    await PushNotifications.addListener('registration', async (tokenData) => {
      console.log('[PUSH] Token:', tokenData.value.substring(0, 20) + '...');
      try {
        await api.push.registerToken({ token: tokenData.value, platform: 'android' });
        console.log('[PUSH] Token saved');
      } catch (e: any) {
        console.error('[PUSH] Save error:', e?.message);
      }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[PUSH] Reg error:', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notif) => {
      console.log('[PUSH] Foreground:', notif);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', () => {
      window.location.href = '/';
    });

  } catch (e: any) {
    // Not on native platform
  }
}
