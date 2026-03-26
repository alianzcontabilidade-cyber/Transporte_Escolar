// Firebase Cloud Messaging v2 - Push Notification Service
// Uses Service Account for authentication
import { db } from '../db/index';
import { sql } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';

const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || 'netescol';
const FCM_CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL || '';
const FCM_PRIVATE_KEY = (process.env.FCM_PRIVATE_KEY || '').replace(/\\n/g, '\n');

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Cache do access token (válido por 1 hora)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
    throw new Error('FCM credentials not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const jwt = sign(
    {
      iss: FCM_CLIENT_EMAIL,
      sub: FCM_CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    },
    FCM_PRIVATE_KEY,
    { algorithm: 'RS256' }
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    console.log('[PUSH] OAuth error:', err);
    throw new Error('Failed to get access token');
  }

  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + 3500000 };
  return data.access_token;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
    console.log('[PUSH] FCM not configured, skipping');
    return;
  }

  try {
    // Buscar tokens do usuário
    const rows = await db.select({ id: sql<number>`id`, token: sql<string>`token` })
      .from(sql`push_tokens`).where(sql`userId = ${userId}`);
    const tokens = rows.filter(r => r.token);

    if (tokens.length === 0) {
      console.log(`[PUSH] No tokens for user ${userId}`);
      return;
    }

    const accessToken = await getAccessToken();
    const url = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

    for (const { id, token } of tokens) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: payload.title,
                body: payload.body,
              },
              data: payload.data || {},
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  click_action: 'FLUTTER_NOTIFICATION_CLICK',
                  channel_id: 'netescol_chat',
                },
              },
            },
          }),
        });

        if (res.ok) {
          console.log(`[PUSH] Sent to user ${userId}`);
        } else {
          const errData = await res.json().catch(() => ({}));
          const errCode = (errData as any)?.error?.details?.[0]?.errorCode || (errData as any)?.error?.status || '';
          console.log(`[PUSH] Error: ${errCode}`);
          // Token inválido - remover
          if (errCode === 'UNREGISTERED' || errCode === 'INVALID_ARGUMENT') {
            await db.execute(sql`DELETE FROM push_tokens WHERE id = ${id}`);
            console.log(`[PUSH] Removed invalid token`);
          }
        }
      } catch (e) {
        console.log(`[PUSH] Send error: ${(e as any).message}`);
      }
    }
  } catch (e) {
    console.log(`[PUSH] Error: ${(e as any).message}`);
  }
}
