"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicProcedure = exports.staffProcedure = exports.adminProcedure = exports.protectedProcedure = exports.publicProcedure = exports.t = exports.JWT_SECRET = void 0;
exports.validateCPF = validateCPF;
exports.validateCNPJ = validateCNPJ;
exports.validateOptionalCPF = validateOptionalCPF;
exports.validateOptionalCNPJ = validateOptionalCNPJ;
const server_1 = require("@trpc/server");
// ============================================
// VALIDAÇÃO DE CPF E CNPJ
// ============================================
function validateCPF(cpf) {
    const d = cpf.replace(/\D/g, '');
    if (d.length !== 11)
        return false;
    if (/^(\d)\1{10}$/.test(d))
        return false;
    let sum = 0;
    for (let i = 0; i < 9; i++)
        sum += parseInt(d[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10)
        r = 0;
    if (parseInt(d[9]) !== r)
        return false;
    sum = 0;
    for (let i = 0; i < 10; i++)
        sum += parseInt(d[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10)
        r = 0;
    if (parseInt(d[10]) !== r)
        return false;
    return true;
}
function validateCNPJ(cnpj) {
    const d = cnpj.replace(/\D/g, '');
    if (d.length !== 14)
        return false;
    if (/^(\d)\1{13}$/.test(d))
        return false;
    let sum = 0;
    let w = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++)
        sum += parseInt(d[i]) * w[i];
    let r = sum % 11;
    if (parseInt(d[12]) !== (r < 2 ? 0 : 11 - r))
        return false;
    sum = 0;
    w = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++)
        sum += parseInt(d[i]) * w[i];
    r = sum % 11;
    if (parseInt(d[13]) !== (r < 2 ? 0 : 11 - r))
        return false;
    return true;
}
function validateOptionalCPF(cpf) {
    if (!cpf)
        return;
    const digits = cpf.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 11) {
        throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'CPF incompleto.' });
    }
    if (digits.length === 11 && !validateCPF(digits)) {
        throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido.' });
    }
}
function validateOptionalCNPJ(cnpj) {
    if (!cnpj)
        return;
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 14) {
        throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'CNPJ incompleto.' });
    }
    if (digits.length === 14 && !validateCNPJ(digits)) {
        throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'CNPJ inválido.' });
    }
}
// JWT Secret
exports.JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'netescol-dev-secret-2024');
if (!exports.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET must be set in production');
    process.exit(1);
}
// tRPC init
exports.t = server_1.initTRPC.context().create();
exports.publicProcedure = exports.t.procedure;
exports.protectedProcedure = exports.t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.userId) {
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Não autenticado' });
    }
    return next({ ctx });
});
exports.adminProcedure = exports.protectedProcedure.use(async ({ ctx, next }) => {
    if (!['super_admin', 'municipal_admin', 'secretary'].includes(ctx.role || '')) {
        throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão de administrador' });
    }
    return next({ ctx });
});
exports.staffProcedure = exports.protectedProcedure.use(async ({ ctx, next }) => {
    if (!['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor'].includes(ctx.role || '')) {
        throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão' });
    }
    return next({ ctx });
});
// Academic roles (Phase 2)
exports.academicProcedure = exports.protectedProcedure.use(async ({ ctx, next }) => {
    if (!['super_admin', 'municipal_admin', 'secretary', 'school_admin', 'teacher', 'coordinator'].includes(ctx.role || '')) {
        throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão acadêmica' });
    }
    return next({ ctx });
});
