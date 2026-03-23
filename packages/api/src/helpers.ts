import { db } from './db/index';
import { guardians } from './db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Verifica se um usuário (responsável) tem acesso a um aluno específico.
 * Retorna true se existe vínculo na tabela guardians.
 */
export async function verifyGuardianAccess(userId: number, studentId: number): Promise<boolean> {
  const [link] = await db.select().from(guardians)
    .where(and(eq(guardians.userId, userId), eq(guardians.studentId, studentId)))
    .limit(1);
  return !!link;
}
