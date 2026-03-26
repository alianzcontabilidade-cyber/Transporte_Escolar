// Firebase Cloud Messaging - Push Notification Service
import { db } from '../db/index';
import { eq } from 'drizzle-orm';

// Tabela push_tokens referenciada diretamente via SQL para evitar import circular
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!FCM_SERVER_KEY) {
    console.log('[PUSH] FCM_SERVER_KEY not configured, skipping push');
    return;
  }

  try {
    // Buscar tokens do usuário
    const [rows] = await (db as any).execute(
      `SELECT token FROM push_tokens WHERE userId = ?`, [userId]
    );
    const tokens = (rows as any[]).map((r: any) => r.token).filter(Boolean);

    if (tokens.length === 0) {
      console.log(`[PUSH] No tokens for user ${userId}`);
      return;
    }

    // Enviar para cada token via FCM HTTP Legacy API
    for (const token of tokens) {
      try {
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${FCM_SERVER_KEY}`,
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title: payload.title,
              body: payload.body,
              icon: '/bus.svg',
              click_action: 'https://transporteescolar-production.up.railway.app',
              sound: 'default',
            },
            data: payload.data || {},
            priority: 'high',
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.log(`[PUSH] FCM error for token ${token.substring(0, 20)}...: ${errText}`);
          // Se token inválido, remover
          if (errText.includes('NotRegistered') || errText.includes('InvalidRegistration')) {
            await (db as any).execute(`DELETE FROM push_tokens WHERE token = ?`, [token]);
            console.log(`[PUSH] Removed invalid token`);
          }
        } else {
          console.log(`[PUSH] Sent to user ${userId}`);
        }
      } catch (e) {
        console.log(`[PUSH] Error sending to token: ${(e as any).message}`);
      }
    }
  } catch (e) {
    console.log(`[PUSH] Error: ${(e as any).message}`);
  }
}
