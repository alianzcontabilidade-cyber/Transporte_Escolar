import { initTRPC, TRPCError } from '@trpc/server';

// ============================================
// VALIDAÇÃO DE CPF E CNPJ
// ============================================
export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11; if (r === 10) r = 0;
  if (parseInt(d[9]) !== r) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11; if (r === 10) r = 0;
  if (parseInt(d[10]) !== r) return false;
  return true;
}

export function validateCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  let sum = 0;
  let w = [5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 12; i++) sum += parseInt(d[i]) * w[i];
  let r = sum % 11;
  if (parseInt(d[12]) !== (r < 2 ? 0 : 11 - r)) return false;
  sum = 0;
  w = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  for (let i = 0; i < 13; i++) sum += parseInt(d[i]) * w[i];
  r = sum % 11;
  if (parseInt(d[13]) !== (r < 2 ? 0 : 11 - r)) return false;
  return true;
}

export function validateOptionalCPF(cpf?: string): void {
  if (!cpf) return;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length > 0 && digits.length !== 11) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF incompleto.' });
  }
  if (digits.length === 11 && !validateCPF(digits)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido.' });
  }
}

export function validateOptionalCNPJ(cnpj?: string): void {
  if (!cnpj) return;
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length > 0 && digits.length !== 14) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CNPJ incompleto.' });
  }
  if (digits.length === 14 && !validateCNPJ(digits)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CNPJ inválido.' });
  }
}

// JWT Secret
export const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'transescolar-dev-secret-2024');
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET must be set in production');
  process.exit(1);
}

// tRPC init
export const t = initTRPC.context<{ userId?: number; municipalityId?: number; role?: string }>().create();

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Não autenticado' });
  }
  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['super_admin', 'municipal_admin', 'secretary'].includes(ctx.role || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão de administrador' });
  }
  return next({ ctx });
});

export const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor'].includes(ctx.role || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão' });
  }
  return next({ ctx });
});

// Academic roles (Phase 2)
export const academicProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['super_admin', 'municipal_admin', 'secretary', 'school_admin', 'teacher', 'coordinator'].includes(ctx.role || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão acadêmica' });
  }
  return next({ ctx });
});
