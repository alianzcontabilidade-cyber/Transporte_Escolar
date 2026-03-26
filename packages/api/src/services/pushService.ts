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

// ============================================
// HELPERS: Notificações de Transporte
// ============================================

// Buscar pais (guardians) dos alunos de uma rota
export async function getParentUserIdsByRoute(routeId: number): Promise<number[]> {
  try {
    const rows = await db.select({ userId: sql<number>`g.userId` })
      .from(sql`guardians g`)
      .innerJoin(sql`stop_students ss`, sql`ss.studentId = g.studentId`)
      .innerJoin(sql`stops s`, sql`s.id = ss.stopId`)
      .where(sql`s.routeId = ${routeId}`);
    return [...new Set(rows.map(r => r.userId))];
  } catch { return []; }
}

// Buscar pais de um aluno específico
export async function getParentUserIdsByStudent(studentId: number): Promise<number[]> {
  try {
    const rows = await db.select({ userId: sql<number>`userId` })
      .from(sql`guardians`).where(sql`studentId = ${studentId}`);
    return rows.map(r => r.userId);
  } catch { return []; }
}

// Enviar push para múltiplos usuários
export async function sendPushToUsers(userIds: number[], payload: PushPayload) {
  for (const uid of userIds) {
    await sendPushToUser(uid, payload);
  }
}

// Notificação: Viagem iniciada
export async function notifyTripStarted(routeId: number, routeName: string) {
  const parentIds = await getParentUserIdsByRoute(routeId);
  await sendPushToUsers(parentIds, {
    title: '🚌 Ônibus saiu!',
    body: `Rota ${routeName} iniciou a viagem`,
    data: { type: 'trip_started', routeId: String(routeId) },
  });
}

// Notificação: Aluno embarcou
export async function notifyStudentBoarded(studentId: number, studentName: string) {
  const parentIds = await getParentUserIdsByStudent(studentId);
  await sendPushToUsers(parentIds, {
    title: '✅ Aluno embarcou',
    body: `${studentName} embarcou no ônibus`,
    data: { type: 'student_boarded', studentId: String(studentId) },
  });
}

// Notificação: Aluno desembarcou
export async function notifyStudentDropped(studentId: number, studentName: string) {
  const parentIds = await getParentUserIdsByStudent(studentId);
  await sendPushToUsers(parentIds, {
    title: '🏠 Aluno desembarcou',
    body: `${studentName} desembarcou com segurança`,
    data: { type: 'student_dropped', studentId: String(studentId) },
  });
}

// Notificação: Aluno ausente
export async function notifyStudentAbsent(studentId: number, studentName: string) {
  const parentIds = await getParentUserIdsByStudent(studentId);
  await sendPushToUsers(parentIds, {
    title: '⚠️ Aluno ausente',
    body: `${studentName} não estava no ponto de parada`,
    data: { type: 'student_absent', studentId: String(studentId) },
  });
}

// Notificação: Viagem concluída
export async function notifyTripCompleted(routeId: number, routeName: string) {
  const parentIds = await getParentUserIdsByRoute(routeId);
  await sendPushToUsers(parentIds, {
    title: '✅ Viagem concluída',
    body: `Rota ${routeName} - todos os alunos entregues`,
    data: { type: 'trip_completed', routeId: String(routeId) },
  });
}

// Notificação: Viagem cancelada
export async function notifyTripCancelled(routeId: number, routeName: string, reason: string, driverUserId?: number, monitorUserId?: number) {
  const parentIds = await getParentUserIdsByRoute(routeId);
  const allIds = [...parentIds];
  if (driverUserId) allIds.push(driverUserId);
  if (monitorUserId) allIds.push(monitorUserId);
  await sendPushToUsers([...new Set(allIds)], {
    title: '🚫 Viagem CANCELADA',
    body: `Rota ${routeName}. Motivo: ${reason}`,
    data: { type: 'trip_cancelled', routeId: String(routeId) },
  });
}

// Notificação: Viagem interrompida
export async function notifyTripInterrupted(routeId: number, routeName: string, reason: string) {
  const parentIds = await getParentUserIdsByRoute(routeId);
  await sendPushToUsers(parentIds, {
    title: '⛔ Viagem INTERROMPIDA',
    body: `Rota ${routeName}. Motivo: ${reason}`,
    data: { type: 'trip_interrupted', routeId: String(routeId) },
  });
}

// Notificação: Problema com veículo
export async function notifyVehicleProblem(routeId: number, routeName: string, plate: string) {
  const parentIds = await getParentUserIdsByRoute(routeId);
  await sendPushToUsers(parentIds, {
    title: '🔧 Problema mecânico',
    body: `Veículo ${plate} com problema na rota ${routeName}`,
    data: { type: 'vehicle_problem', routeId: String(routeId) },
  });
}
