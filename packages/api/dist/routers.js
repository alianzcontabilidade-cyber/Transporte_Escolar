"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = exports.maintenanceRouter = exports.contractsRouter = exports.monitorStaffRouter = exports.monitorsRouter = exports.guardiansRouter = exports.usersRouter = exports.notificationsRouter = exports.driversRouter = exports.vehiclesRouter = exports.tripsRouter = exports.studentsRouter = exports.stopsRouter = exports.routesRouter = exports.schoolsRouter = exports.municipalitiesRouter = exports.authRouter = void 0;
const server_1 = require("@trpc/server");
const zod_1 = require("zod");
const index_1 = require("./db/index");
const schema_1 = require("./db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const socketInstance_1 = require("./socketInstance");
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
const t = server_1.initTRPC.context().create();
const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.userId) {
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Não autenticado' });
    }
    return next({ ctx });
});
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (!['super_admin', 'municipal_admin', 'secretary'].includes(ctx.role || '')) {
        throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão de administrador' });
    }
    return next({ ctx });
});
const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
    if (!['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor'].includes(ctx.role || '')) {
        throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão' });
    }
    return next({ ctx });
});
// ============================================
// AUTH ROUTER
// ============================================
exports.authRouter = t.router({
    registerMunicipality: publicProcedure
        .input(zod_1.z.object({
        municipalityName: zod_1.z.string().min(3),
        state: zod_1.z.string().length(2),
        city: zod_1.z.string().min(2),
        cnpj: zod_1.z.string().optional(),
        adminName: zod_1.z.string().min(3),
        adminEmail: zod_1.z.string().email(),
        adminPassword: zod_1.z.string().min(8),
        adminPhone: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        validateOptionalCNPJ(input.cnpj);
        const existingUser = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, input.adminEmail)).limit(1);
        if (existingUser.length > 0) {
            throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado' });
        }
        const [municipality] = await index_1.db.insert(schema_1.municipalities).values({
            name: input.municipalityName,
            state: input.state,
            city: input.city,
            cnpj: input.cnpj,
            email: input.adminEmail,
        }).$returningId();
        const passwordHash = await (0, bcryptjs_1.hash)(input.adminPassword, 12);
        const [user] = await index_1.db.insert(schema_1.users).values({
            municipalityId: municipality.id,
            email: input.adminEmail,
            passwordHash,
            name: input.adminName,
            phone: input.adminPhone,
            role: 'municipal_admin',
        }).$returningId();
        return { success: true, municipalityId: municipality.id, userId: user.id, message: 'Prefeitura cadastrada com sucesso!' };
    }),
    registerGuardian: publicProcedure
        .input(zod_1.z.object({
        name: zod_1.z.string().min(3),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        phone: zod_1.z.string().optional(),
        cpf: zod_1.z.string().optional(),
        studentEnrollment: zod_1.z.string().min(1),
        relationship: zod_1.z.enum(['father', 'mother', 'grandparent', 'uncle', 'other']).optional(),
    }))
        .mutation(async ({ input }) => {
        validateOptionalCPF(input.cpf);
        const existingUser = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, input.email)).limit(1);
        if (existingUser.length > 0) {
            throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado' });
        }
        const [student] = await index_1.db.select().from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.enrollment, input.studentEnrollment)).limit(1);
        if (!student) {
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Matrícula do aluno não encontrada. Verifique com a escola.' });
        }
        const passwordHash = await (0, bcryptjs_1.hash)(input.password, 12);
        const [user] = await index_1.db.insert(schema_1.users).values({
            municipalityId: student.municipalityId,
            email: input.email,
            passwordHash,
            name: input.name,
            phone: input.phone,
            cpf: input.cpf,
            role: 'parent',
        }).$returningId();
        await index_1.db.insert(schema_1.guardians).values({
            userId: user.id,
            studentId: student.id,
            relationship: input.relationship || 'other',
            isPrimary: true,
            canPickup: true,
        });
        return { success: true, userId: user.id, studentName: student.name, message: 'Cadastro realizado! Você já pode acompanhar o transporte.' };
    }),
    // Login flexível: email, CPF ou nome
    login: publicProcedure
        .input(zod_1.z.object({
        identifier: zod_1.z.string().min(1),
        password: zod_1.z.string(),
    }))
        .mutation(async ({ input }) => {
        const id = input.identifier.trim();
        let userList = [];
        // Detectar formato do identificador
        const isEmail = id.includes('@');
        const isCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(id);
        if (isEmail) {
            userList = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, id)).limit(1);
        }
        else if (isCpf) {
            // Buscar tanto com formatação quanto sem
            const cpfClean = id.replace(/[^\d]/g, '');
            const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            userList = await index_1.db.select().from(schema_1.users)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.cpf, cpfClean), (0, drizzle_orm_1.eq)(schema_1.users.cpf, cpfFormatted), (0, drizzle_orm_1.eq)(schema_1.users.cpf, id)))
                .limit(1);
        }
        else {
            // Buscar por email (caso não tenha @, pode ser username-style)
            userList = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, id)).limit(1);
            // Se não achou por email, tenta por nome exato
            if (userList.length === 0) {
                userList = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.name, id)).limit(1);
            }
        }
        const user = userList[0];
        if (!user || !user.passwordHash) {
            throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas. Verifique seu email, CPF ou senha.' });
        }
        const validPassword = await (0, bcryptjs_1.compare)(input.password, user.passwordHash);
        if (!validPassword) {
            throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas. Verifique seu email, CPF ou senha.' });
        }
        await index_1.db.update(schema_1.users).set({ lastLoginAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id, municipalityId: user.municipalityId, role: user.role }, process.env.JWT_SECRET || 'transescolar-secret-2024', { expiresIn: '7d' });
        return {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, municipalityId: user.municipalityId }
        };
    }),
    // Solicitar recuperação de senha
    requestPasswordReset: publicProcedure
        .input(zod_1.z.object({
        identifier: zod_1.z.string().min(1),
    }))
        .mutation(async ({ input }) => {
        const id = input.identifier.trim();
        let userList = [];
        const isEmail = id.includes('@');
        const isCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(id);
        if (isEmail) {
            userList = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, id)).limit(1);
        }
        else if (isCpf) {
            const cpfClean = id.replace(/[^\d]/g, '');
            const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            userList = await index_1.db.select().from(schema_1.users)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.cpf, cpfClean), (0, drizzle_orm_1.eq)(schema_1.users.cpf, cpfFormatted), (0, drizzle_orm_1.eq)(schema_1.users.cpf, id)))
                .limit(1);
        }
        else {
            userList = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, id)).limit(1);
        }
        const user = userList[0];
        if (!user) {
            // Não revelar se o usuário existe ou não (segurança)
            return { success: true, message: 'Se o usuário existir, um código de recuperação será gerado.' };
        }
        // Gerar código de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Gerar token JWT de curta duração (15 min) contendo userId e code
        const resetToken = (0, jsonwebtoken_1.sign)({ userId: user.id, code, purpose: 'password_reset' }, process.env.JWT_SECRET || 'transescolar-secret-2024', { expiresIn: '15m' });
        // Salvar notificação com o código (o admin pode ver)
        await index_1.db.insert(schema_1.notifications).values({
            userId: user.id,
            title: 'Código de recuperação de senha',
            body: 'Seu código de recuperação é: ' + code + '. Válido por 15 minutos.',
            type: 'system',
        });
        // Em produção, aqui enviaria email/SMS com o código
        // Por enquanto, retorna o token para uso direto
        return {
            success: true,
            resetToken,
            code, // Em produção, remover este campo e enviar por email/SMS
            message: 'Código de recuperação gerado. Verifique suas notificações ou email.',
            userHint: user.email ? user.email.replace(/(.)(.*)(@.*)/, '$1***$3') : undefined,
        };
    }),
    // Redefinir senha com código
    resetPassword: publicProcedure
        .input(zod_1.z.object({
        resetToken: zod_1.z.string(),
        code: zod_1.z.string().length(6),
        newPassword: zod_1.z.string().min(6),
    }))
        .mutation(async ({ input }) => {
        let decoded;
        try {
            decoded = (0, jsonwebtoken_1.verify)(input.resetToken, process.env.JWT_SECRET || 'transescolar-secret-2024');
        }
        catch {
            throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'Token expirado ou inválido. Solicite um novo código.' });
        }
        if (decoded.purpose !== 'password_reset') {
            throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'Token inválido.' });
        }
        if (decoded.code !== input.code) {
            throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'Código incorreto.' });
        }
        const passwordHash = await (0, bcryptjs_1.hash)(input.newPassword, 12);
        await index_1.db.update(schema_1.users).set({ passwordHash }).where((0, drizzle_orm_1.eq)(schema_1.users.id, decoded.userId));
        return { success: true, message: 'Senha redefinida com sucesso! Faça login com a nova senha.' };
    }),
    // Alterar senha (logado)
    changePassword: protectedProcedure
        .input(zod_1.z.object({
        currentPassword: zod_1.z.string(),
        newPassword: zod_1.z.string().min(6),
    }))
        .mutation(async ({ ctx, input }) => {
        const [user] = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, ctx.userId)).limit(1);
        if (!user || !user.passwordHash) {
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        }
        const validPassword = await (0, bcryptjs_1.compare)(input.currentPassword, user.passwordHash);
        if (!validPassword) {
            throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Senha atual incorreta' });
        }
        const passwordHash = await (0, bcryptjs_1.hash)(input.newPassword, 12);
        await index_1.db.update(schema_1.users).set({ passwordHash }).where((0, drizzle_orm_1.eq)(schema_1.users.id, ctx.userId));
        return { success: true, message: 'Senha alterada com sucesso!' };
    }),
    me: protectedProcedure.query(async ({ ctx }) => {
        const [user] = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, ctx.userId)).limit(1);
        if (!user)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        return { id: user.id, name: user.name, email: user.email, role: user.role, municipalityId: user.municipalityId };
    }),
});
// ============================================
// MUNICIPALITIES ROUTER
// ============================================
exports.municipalitiesRouter = t.router({
    getById: protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [municipality] = await index_1.db.select().from(schema_1.municipalities).where((0, drizzle_orm_1.eq)(schema_1.municipalities.id, input.id)).limit(1);
        return municipality;
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        primaryColor: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.municipalities).set(data).where((0, drizzle_orm_1.eq)(schema_1.municipalities.id, id));
        return { success: true };
    }),
    getDashboardStats: adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [schoolCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.schools).where((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, input.municipalityId));
        const [studentCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId));
        const [routeCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId));
        const [vehicleCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.municipalityId, input.municipalityId));
        const [driverCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.municipalityId, input.municipalityId));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [todayTrips] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId), (0, drizzle_orm_1.gte)(schema_1.trips.tripDate, today)));
        const [activeTrips] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'started')));
        return {
            schools: schoolCount?.count || 0,
            students: studentCount?.count || 0,
            routes: routeCount?.count || 0,
            vehicles: vehicleCount?.count || 0,
            drivers: driverCount?.count || 0,
            todayTrips: todayTrips?.count || 0,
            activeTrips: activeTrips?.count || 0,
        };
    }),
});
// ============================================
// SCHOOLS ROUTER
// ============================================
exports.schoolsRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.schools)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true)))
            .orderBy(schema_1.schools.name);
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string().min(3),
        code: zod_1.z.string().optional(),
        type: zod_1.z.enum(['infantil', 'fundamental', 'medio', 'tecnico', 'especial']).optional(),
        address: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        directorName: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [school] = await index_1.db.insert(schema_1.schools).values({
            ...input,
            latitude: input.latitude?.toString(),
            longitude: input.longitude?.toString(),
        }).$returningId();
        return { success: true, id: school.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        code: zod_1.z.string().optional(),
        type: zod_1.z.enum(['infantil', 'fundamental', 'medio', 'tecnico', 'especial']).optional(),
        address: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        directorName: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.schools).set(data).where((0, drizzle_orm_1.eq)(schema_1.schools.id, id));
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.schools).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.schools.id, input.id));
        return { success: true };
    }),
});
// ============================================
// ROUTES ROUTER
// ============================================
exports.routesRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.routes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true)))
            .orderBy(schema_1.routes.name);
    }),
    getById: protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [route] = await index_1.db.select().from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, input.id)).limit(1);
        if (!route)
            throw new server_1.TRPCError({ code: 'NOT_FOUND' });
        const routeStops = await index_1.db.select().from(schema_1.stops)
            .where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, input.id)).orderBy(schema_1.stops.orderIndex);
        return { ...route, stops: routeStops };
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        schoolId: zod_1.z.number().optional(),
        name: zod_1.z.string().min(3),
        code: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        type: zod_1.z.enum(['pickup', 'dropoff', 'both']).optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        scheduledStartTime: zod_1.z.string().optional(),
        scheduledEndTime: zod_1.z.string().optional(),
        defaultVehicleId: zod_1.z.number().optional(),
        defaultDriverId: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const [route] = await index_1.db.insert(schema_1.routes).values(input).$returningId();
        return { success: true, id: route.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        type: zod_1.z.enum(['pickup', 'dropoff', 'both']).optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        scheduledStartTime: zod_1.z.string().optional(),
        scheduledEndTime: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.routes).set(data).where((0, drizzle_orm_1.eq)(schema_1.routes.id, id));
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.routes).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.routes.id, input.id));
        return { success: true };
    }),
});
// ============================================
// STOPS ROUTER
// ============================================
exports.stopsRouter = t.router({
    listByRoute: protectedProcedure
        .input(zod_1.z.object({ routeId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const routeStops = await index_1.db.select().from(schema_1.stops)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stops.routeId, input.routeId), (0, drizzle_orm_1.eq)(schema_1.stops.isActive, true)))
            .orderBy(schema_1.stops.orderIndex);
        const stopsWithStudents = await Promise.all(routeStops.map(async (stop) => {
            const stopStudentList = await index_1.db.select({
                id: schema_1.students.id, name: schema_1.students.name, photoUrl: schema_1.students.photoUrl,
            })
                .from(schema_1.stopStudents)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, stop.id));
            return { ...stop, students: stopStudentList };
        }));
        return stopsWithStudents;
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        routeId: zod_1.z.number(),
        name: zod_1.z.string().min(2),
        address: zod_1.z.string().optional(),
        reference: zod_1.z.string().optional(),
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        orderIndex: zod_1.z.number(),
        estimatedArrivalMinutes: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const [stop] = await index_1.db.insert(schema_1.stops).values({
            ...input,
            latitude: input.latitude.toString(),
            longitude: input.longitude.toString(),
        }).$returningId();
        return { success: true, id: stop.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        orderIndex: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, latitude, longitude, ...rest } = input;
        await index_1.db.update(schema_1.stops).set({
            ...rest,
            ...(latitude !== undefined && { latitude: latitude.toString() }),
            ...(longitude !== undefined && { longitude: longitude.toString() }),
        }).where((0, drizzle_orm_1.eq)(schema_1.stops.id, id));
        return { success: true };
    }),
    reorder: adminProcedure
        .input(zod_1.z.object({ routeId: zod_1.z.number(), stopIds: zod_1.z.array(zod_1.z.number()) }))
        .mutation(async ({ input }) => {
        for (let i = 0; i < input.stopIds.length; i++) {
            await index_1.db.update(schema_1.stops).set({ orderIndex: i + 1 }).where((0, drizzle_orm_1.eq)(schema_1.stops.id, input.stopIds[i]));
        }
        return { success: true };
    }),
});
// ============================================
// STUDENTS ROUTER
// ============================================
exports.studentsRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId),
            (0, drizzle_orm_1.eq)(schema_1.students.isActive, true),
            ...(input.schoolId ? [(0, drizzle_orm_1.eq)(schema_1.students.schoolId, input.schoolId)] : []),
        ];
        return index_1.db.select().from(schema_1.students).where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.students.name);
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        schoolId: zod_1.z.number(),
        name: zod_1.z.string().min(2),
        birthDate: zod_1.z.string().optional(),
        grade: zod_1.z.string().optional(),
        classRoom: zod_1.z.string().optional(),
        enrollment: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        address: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        hasSpecialNeeds: zod_1.z.boolean().optional(),
        specialNeedsNotes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { latitude, longitude, birthDate, ...rest } = input;
        const [student] = await index_1.db.insert(schema_1.students).values({
            ...rest,
            birthDate: birthDate ? new Date(birthDate) : undefined,
            ...(latitude !== undefined && { latitude: latitude.toString() }),
            ...(longitude !== undefined && { longitude: longitude.toString() }),
        }).$returningId();
        return { success: true, id: student.id };
    }),
    assignToStop: adminProcedure
        .input(zod_1.z.object({
        studentId: zod_1.z.number(),
        stopId: zod_1.z.number(),
        boardingType: zod_1.z.enum(['pickup', 'dropoff', 'both']).optional(),
    }))
        .mutation(async ({ input }) => {
        await index_1.db.insert(schema_1.stopStudents).values(input);
        return { success: true };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        grade: zod_1.z.string().optional(),
        classRoom: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        address: zod_1.z.string().optional(),
        hasSpecialNeeds: zod_1.z.boolean().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const ud = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            ud[k] = v; });
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.students).set(ud).where((0, drizzle_orm_1.eq)(schema_1.students.id, id));
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.students).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.id));
        return { success: true };
    }),
});
// ============================================
// TRIPS ROUTER
// ============================================
exports.tripsRouter = t.router({
    listActive: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const activeTrips = await index_1.db.select({
            trip: schema_1.trips, route: schema_1.routes,
            driver: { id: schema_1.drivers.id, userId: schema_1.drivers.userId, currentLatitude: schema_1.drivers.currentLatitude, currentLongitude: schema_1.drivers.currentLongitude },
            vehicle: schema_1.vehicles,
        })
            .from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .innerJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.trips.driverId, schema_1.drivers.id))
            .innerJoin(schema_1.vehicles, (0, drizzle_orm_1.eq)(schema_1.trips.vehicleId, schema_1.vehicles.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'started')))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trips.startedAt));
        const tripsWithDriverName = await Promise.all(activeTrips.map(async (t) => {
            const [user] = await index_1.db.select({ name: schema_1.users.name }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, t.driver.userId)).limit(1);
            return { ...t, driverName: user?.name };
        }));
        return tripsWithDriverName;
    }),
    getById: protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [trip] = await index_1.db.select({
            trip: schema_1.trips, route: schema_1.routes,
            driver: { id: schema_1.drivers.id, userId: schema_1.drivers.userId, currentLatitude: schema_1.drivers.currentLatitude, currentLongitude: schema_1.drivers.currentLongitude },
            vehicle: schema_1.vehicles,
        })
            .from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .innerJoin(schema_1.drivers, (0, drizzle_orm_1.eq)(schema_1.trips.driverId, schema_1.drivers.id))
            .innerJoin(schema_1.vehicles, (0, drizzle_orm_1.eq)(schema_1.trips.vehicleId, schema_1.vehicles.id))
            .where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.id))
            .limit(1);
        if (!trip)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Viagem não encontrada' });
        const [driverUser] = await index_1.db.select({ name: schema_1.users.name }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, trip.driver.userId)).limit(1);
        const tripStops = await index_1.db.select().from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, trip.route.id)).orderBy(schema_1.stops.orderIndex);
        const stopLogs = await index_1.db.select().from(schema_1.tripStopLogs).where((0, drizzle_orm_1.eq)(schema_1.tripStopLogs.tripId, input.id));
        return { ...trip, driverName: driverUser?.name, stops: tripStops, stopLogs };
    }),
    start: protectedProcedure
        .input(zod_1.z.object({ routeId: zod_1.z.number(), driverId: zod_1.z.number(), vehicleId: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [route] = await index_1.db.select().from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, input.routeId)).limit(1);
        if (!route)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Rota não encontrada' });
        const stopList = await index_1.db.select().from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, input.routeId));
        let totalStudents = 0;
        for (const stop of stopList) {
            const [count] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.stopStudents).where((0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, stop.id));
            totalStudents += count?.count || 0;
        }
        const [trip] = await index_1.db.insert(schema_1.trips).values({
            routeId: input.routeId,
            driverId: input.driverId,
            vehicleId: input.vehicleId,
            tripDate: new Date(),
            startedAt: new Date(),
            status: 'started',
            currentStopIndex: 0,
            totalStudentsExpected: totalStudents,
        }).$returningId();
        // Notificar responsáveis que a viagem iniciou
        const routeStops = await index_1.db.select().from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, input.routeId));
        for (const stop of routeStops) {
            const ssStudents = await index_1.db.select({ studentId: schema_1.stopStudents.studentId }).from(schema_1.stopStudents).where((0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, stop.id));
            for (const ss of ssStudents) {
                const guardianList = await index_1.db.select({ userId: schema_1.guardians.userId }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.studentId, ss.studentId));
                for (const g of guardianList) {
                    await index_1.db.insert(schema_1.notifications).values({
                        userId: g.userId,
                        title: 'Viagem iniciada!',
                        body: 'O ônibus escolar iniciou a rota ' + route.name + '. Acompanhe em tempo real.',
                        type: 'trip_started',
                        tripId: trip.id,
                    });
                }
            }
        }
        // Emitir evento de viagem iniciada via Socket.IO
        (0, socketInstance_1.emitToMunicipality)(route.municipalityId, 'trip:started', {
            tripId: trip.id,
            routeId: input.routeId,
            routeName: route.name,
            municipalityId: route.municipalityId,
            time: new Date().toISOString(),
        });
        return { success: true, tripId: trip.id };
    }),
    arriveAtStop: protectedProcedure
        .input(zod_1.z.object({ tripId: zod_1.z.number(), stopId: zod_1.z.number(), latitude: zod_1.z.number(), longitude: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.insert(schema_1.tripStopLogs).values({
            tripId: input.tripId, stopId: input.stopId, arrivedAt: new Date(),
            latitude: input.latitude.toString(), longitude: input.longitude.toString(),
        });
        const [trip] = await index_1.db.select().from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        if (trip) {
            await index_1.db.update(schema_1.trips).set({ currentStopIndex: (trip.currentStopIndex ?? 0) + 1 }).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId));
        }
        const [stopInfo] = await index_1.db.select().from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.id, input.stopId)).limit(1);
        const stopStudentList = await index_1.db.select({ studentId: schema_1.stopStudents.studentId }).from(schema_1.stopStudents).where((0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, input.stopId));
        for (const ss of stopStudentList) {
            const guardianList = await index_1.db.select({ userId: schema_1.guardians.userId }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.studentId, ss.studentId));
            for (const g of guardianList) {
                await index_1.db.insert(schema_1.notifications).values({
                    userId: g.userId,
                    title: 'Ônibus chegou na parada!',
                    body: 'O ônibus chegou em: ' + (stopInfo?.name || 'parada'),
                    type: 'arrived',
                    tripId: input.tripId,
                    stopId: input.stopId,
                    studentId: ss.studentId,
                });
            }
        }
        // Emitir evento de chegada na parada via Socket.IO
        if (trip) {
            const [route] = await index_1.db.select({ municipalityId: schema_1.routes.municipalityId }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, trip.routeId)).limit(1);
            if (route) {
                (0, socketInstance_1.emitToMunicipality)(route.municipalityId, 'stop:arrived', {
                    tripId: input.tripId,
                    stopId: input.stopId,
                    stopName: stopInfo?.name || 'parada',
                    municipalityId: route.municipalityId,
                    time: new Date().toISOString(),
                });
            }
        }
        return { success: true };
    }),
    complete: protectedProcedure
        .input(zod_1.z.object({ tripId: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.trips).set({ status: 'completed', completedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId));
        const [trip] = await index_1.db.select().from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        if (trip) {
            const routeStops = await index_1.db.select().from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, trip.routeId));
            for (const stop of routeStops) {
                const ssStudents = await index_1.db.select({ studentId: schema_1.stopStudents.studentId }).from(schema_1.stopStudents).where((0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, stop.id));
                for (const ss of ssStudents) {
                    const guardianList = await index_1.db.select({ userId: schema_1.guardians.userId }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.studentId, ss.studentId));
                    for (const g of guardianList) {
                        await index_1.db.insert(schema_1.notifications).values({
                            userId: g.userId,
                            title: 'Viagem concluída',
                            body: 'A viagem foi concluída com sucesso.',
                            type: 'trip_completed',
                            tripId: input.tripId,
                            studentId: ss.studentId,
                        });
                    }
                }
            }
            // Emitir evento de viagem concluída via Socket.IO
            const [routeComplete] = await index_1.db.select({ municipalityId: schema_1.routes.municipalityId }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, trip.routeId)).limit(1);
            if (routeComplete) {
                (0, socketInstance_1.emitToMunicipality)(routeComplete.municipalityId, 'trip:completed', {
                    tripId: input.tripId,
                    municipalityId: routeComplete.municipalityId,
                    time: new Date().toISOString(),
                });
            }
        }
        return { success: true };
    }),
    updateLocation: protectedProcedure
        .input(zod_1.z.object({ tripId: zod_1.z.number(), driverId: zod_1.z.number(), latitude: zod_1.z.number(), longitude: zod_1.z.number(), speed: zod_1.z.number().optional(), heading: zod_1.z.number().optional() }))
        .mutation(async ({ input }) => {
        await index_1.db.insert(schema_1.locationHistory).values({
            tripId: input.tripId, driverId: input.driverId,
            latitude: input.latitude.toString(), longitude: input.longitude.toString(),
            speed: input.speed?.toString(), heading: input.heading,
        });
        await index_1.db.update(schema_1.drivers).set({
            currentLatitude: input.latitude.toString(),
            currentLongitude: input.longitude.toString(),
            lastLocationUpdate: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, input.driverId));
        // Emitir posição via Socket.IO para todos os clientes do município
        const [trip] = await index_1.db.select({ routeId: schema_1.trips.routeId }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        if (trip) {
            const [route] = await index_1.db.select({ municipalityId: schema_1.routes.municipalityId, name: schema_1.routes.name }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, trip.routeId)).limit(1);
            if (route) {
                (0, socketInstance_1.emitToMunicipality)(route.municipalityId, 'bus:location', {
                    tripId: input.tripId,
                    driverId: input.driverId,
                    latitude: input.latitude,
                    longitude: input.longitude,
                    lat: input.latitude,
                    lng: input.longitude,
                    speed: input.speed || 0,
                    heading: input.heading || 0,
                    routeName: route.name,
                    municipalityId: route.municipalityId,
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        return { success: true };
    }),
    history: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), startDate: zod_1.z.string().optional(), endDate: zod_1.z.string().optional(), limit: zod_1.z.number().default(50) }))
        .query(async ({ input }) => {
        return index_1.db.select({ trip: schema_1.trips, route: { id: schema_1.routes.id, name: schema_1.routes.name } })
            .from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .where((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trips.tripDate))
            .limit(input.limit);
    }),
});
// ============================================
// VEHICLES ROUTER
// ============================================
exports.vehiclesRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.municipalityId, input.municipalityId)).orderBy(schema_1.vehicles.nickname);
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), plate: zod_1.z.string(), nickname: zod_1.z.string().optional(),
        brand: zod_1.z.string().optional(), model: zod_1.z.string().optional(), year: zod_1.z.number().optional(), capacity: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const [vehicle] = await index_1.db.insert(schema_1.vehicles).values(input).$returningId();
        return { success: true, id: vehicle.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        plate: zod_1.z.string().optional(),
        nickname: zod_1.z.string().optional(),
        brand: zod_1.z.string().optional(),
        model: zod_1.z.string().optional(),
        year: zod_1.z.number().optional(),
        capacity: zod_1.z.number().optional(),
        status: zod_1.z.enum(['active', 'maintenance', 'inactive']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const ud = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            ud[k] = v; });
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.vehicles).set(ud).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, id));
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, input.id));
        return { success: true };
    }),
});
// ============================================
// DRIVERS ROUTER
// ============================================
exports.driversRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select({
            driver: schema_1.drivers,
            user: { id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email, phone: schema_1.users.phone },
        })
            .from(schema_1.drivers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.drivers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.drivers.municipalityId, input.municipalityId));
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), name: zod_1.z.string(), email: zod_1.z.string().email(),
        phone: zod_1.z.string().optional(), password: zod_1.z.string().min(6),
        cnhNumber: zod_1.z.string().optional(), cnhCategory: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const passwordHash = await (0, bcryptjs_1.hash)(input.password, 12);
        const [user] = await index_1.db.insert(schema_1.users).values({
            municipalityId: input.municipalityId, email: input.email, passwordHash,
            name: input.name, phone: input.phone, role: 'driver',
        }).$returningId();
        const [driver] = await index_1.db.insert(schema_1.drivers).values({
            userId: user.id, municipalityId: input.municipalityId,
            cnhNumber: input.cnhNumber, cnhCategory: input.cnhCategory,
        }).$returningId();
        return { success: true, driverId: driver.id, userId: user.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        cnhNumber: zod_1.z.string().optional(),
        cnhCategory: zod_1.z.string().optional(),
        vehicleId: zod_1.z.number().optional(),
        isAvailable: zod_1.z.boolean().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const ud = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            ud[k] = v; });
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.drivers).set(ud).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id));
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [driver] = await index_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, input.id)).limit(1);
        if (driver) {
            await index_1.db.delete(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, input.id));
            await index_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, driver.userId));
        }
        return { success: true };
    }),
});
// ============================================
// NOTIFICATIONS ROUTER
// ============================================
exports.notificationsRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ limit: zod_1.z.number().default(50) }))
        .query(async ({ ctx, input }) => {
        return index_1.db.select().from(schema_1.notifications)
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, ctx.userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))
            .limit(input.limit);
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
        const [result] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.notifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, ctx.userId), (0, drizzle_orm_1.eq)(schema_1.notifications.isRead, false)));
        return { count: result?.count || 0 };
    }),
    markAsRead: protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.notifications).set({ isRead: true, readAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.notifications.id, input.id));
        return { success: true };
    }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
        await index_1.db.update(schema_1.notifications).set({ isRead: true, readAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, ctx.userId));
        return { success: true };
    }),
});
// ============================================
// USERS ROUTER
// ============================================
exports.usersRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return await index_1.db.select({
            id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email, role: schema_1.users.role,
            municipalityId: schema_1.users.municipalityId, cpf: schema_1.users.cpf, phone: schema_1.users.phone,
            avatarUrl: schema_1.users.avatarUrl, isActive: schema_1.users.isActive, createdAt: schema_1.users.createdAt
        })
            .from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.municipalityId, input.municipalityId));
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        role: zod_1.z.enum(['super_admin', 'municipal_admin', 'secretary', 'school_admin', 'driver', 'monitor', 'parent']).default('secretary'),
        password: zod_1.z.string().min(6),
        cpf: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        username: zod_1.z.string().optional(),
        birthDate: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        validateOptionalCPF(input.cpf);
        const { password, username, birthDate, ...rest } = input;
        const passwordHash = await (0, bcryptjs_1.hash)(password, 10);
        try {
            const [result] = await index_1.db.insert(schema_1.users).values({ ...rest, passwordHash });
            return { id: result.insertId, success: true };
        }
        catch (err) {
            if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
                if (err.message.includes('users_email_unique')) {
                    throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este e-mail ja esta cadastrado no sistema.' });
                }
                if (err.message.includes('users_cpf_unique')) {
                    throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este CPF ja esta cadastrado no sistema.' });
                }
                throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Registro duplicado. Verifique e-mail e CPF.' });
            }
            throw err;
        }
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        role: zod_1.z.enum(['super_admin', 'municipal_admin', 'secretary', 'school_admin', 'driver', 'monitor', 'parent']).optional(),
        password: zod_1.z.string().min(6).optional(),
        cpf: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        municipalityId: zod_1.z.number().optional(),
        username: zod_1.z.string().optional(),
        birthDate: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        validateOptionalCPF(input.cpf);
        const { id, password, username, birthDate, ...data } = input;
        const updateData = { ...data };
        if (password) {
            updateData.passwordHash = await (0, bcryptjs_1.hash)(password, 10);
        }
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
        if (Object.keys(updateData).length > 0) {
            try {
                await index_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
            }
            catch (err) {
                if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
                    if (err.message.includes('users_email_unique')) {
                        throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este e-mail ja esta em uso por outro usuario.' });
                    }
                    if (err.message.includes('users_cpf_unique')) {
                        throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este CPF ja esta em uso por outro usuario.' });
                    }
                    throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Registro duplicado. Verifique e-mail e CPF.' });
                }
                throw err;
            }
        }
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, input.id));
        return { success: true };
    }),
});
exports.guardiansRouter = t.router({
    // Listar filhos/dependentes do responsável
    myStudents: protectedProcedure.query(async ({ ctx }) => {
        const guardianLinks = await index_1.db.select({
            guardianId: schema_1.guardians.id,
            studentId: schema_1.guardians.studentId,
            relationship: schema_1.guardians.relationship,
            isPrimary: schema_1.guardians.isPrimary,
        }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.userId, ctx.userId));
        if (guardianLinks.length === 0)
            return [];
        const studentIds = guardianLinks.map(g => g.studentId);
        const studentList = await index_1.db.select().from(schema_1.students).where((0, drizzle_orm_1.inArray)(schema_1.students.id, studentIds));
        const result = await Promise.all(studentList.map(async (student) => {
            const [school] = await index_1.db.select({ name: schema_1.schools.name }).from(schema_1.schools).where((0, drizzle_orm_1.eq)(schema_1.schools.id, student.schoolId)).limit(1);
            const link = guardianLinks.find(g => g.studentId === student.id);
            // Verificar se o aluno tem viagem ativa
            const studentStops = await index_1.db.select({ stopId: schema_1.stopStudents.stopId, routeId: schema_1.stops.routeId })
                .from(schema_1.stopStudents)
                .innerJoin(schema_1.stops, (0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, schema_1.stops.id))
                .where((0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, student.id));
            let activeTrip = null;
            if (studentStops.length > 0) {
                const routeIds = [...new Set(studentStops.map(s => s.routeId))];
                for (const routeId of routeIds) {
                    const [trip] = await index_1.db.select({ id: schema_1.trips.id, status: schema_1.trips.status, startedAt: schema_1.trips.startedAt, currentStopIndex: schema_1.trips.currentStopIndex })
                        .from(schema_1.trips).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.trips.routeId, routeId), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'started'))).limit(1);
                    if (trip) {
                        activeTrip = { tripId: trip.id, routeId, startedAt: trip.startedAt, currentStopIndex: trip.currentStopIndex };
                        break;
                    }
                }
            }
            return {
                ...student,
                schoolName: school?.name || '',
                relationship: link?.relationship || 'other',
                isPrimary: link?.isPrimary || false,
                activeTrip,
            };
        }));
        return result;
    }),
    // Obter viagem ativa do aluno com detalhes completos
    getStudentActiveTrip: protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        // Verificar que é responsável deste aluno
        const [guardianLink] = await index_1.db.select().from(schema_1.guardians)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.guardians.userId, ctx.userId), (0, drizzle_orm_1.eq)(schema_1.guardians.studentId, input.studentId))).limit(1);
        if (!guardianLink)
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        // Encontrar a rota do aluno
        const studentStops = await index_1.db.select({ stopId: schema_1.stopStudents.stopId, routeId: schema_1.stops.routeId })
            .from(schema_1.stopStudents)
            .innerJoin(schema_1.stops, (0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, schema_1.stops.id))
            .where((0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, input.studentId));
        if (studentStops.length === 0)
            return null;
        const routeIds = [...new Set(studentStops.map(s => s.routeId))];
        for (const routeId of routeIds) {
            const [trip] = await index_1.db.select().from(schema_1.trips)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.trips.routeId, routeId), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'started'))).limit(1);
            if (!trip)
                continue;
            const [route] = await index_1.db.select().from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, routeId)).limit(1);
            const [driver] = await index_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, trip.driverId)).limit(1);
            const [driverUser] = driver ? await index_1.db.select({ name: schema_1.users.name, phone: schema_1.users.phone }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, driver.userId)).limit(1) : [null];
            const [vehicle] = await index_1.db.select().from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, trip.vehicleId)).limit(1);
            const tripStops = await index_1.db.select().from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, routeId)).orderBy(schema_1.stops.orderIndex);
            const stopLogs = await index_1.db.select().from(schema_1.tripStopLogs).where((0, drizzle_orm_1.eq)(schema_1.tripStopLogs.tripId, trip.id));
            const studentStop = studentStops.find(s => s.routeId === routeId);
            return {
                trip,
                route,
                driverName: driverUser?.name || 'Motorista',
                driverPhone: driverUser?.phone || null,
                vehicle: vehicle ? { plate: vehicle.plate, nickname: vehicle.nickname } : null,
                driverLocation: driver ? { lat: parseFloat(driver.currentLatitude || '0'), lng: parseFloat(driver.currentLongitude || '0'), updatedAt: driver.lastLocationUpdate } : null,
                stops: tripStops.map(s => ({
                    ...s,
                    arrived: stopLogs.some(l => l.stopId === s.id),
                    arrivedAt: stopLogs.find(l => l.stopId === s.id)?.arrivedAt || null,
                    isStudentStop: s.id === studentStop?.stopId,
                })),
            };
        }
        return null;
    }),
    // Vincular outro filho
    addStudent: protectedProcedure
        .input(zod_1.z.object({
        studentEnrollment: zod_1.z.string().min(1),
        relationship: zod_1.z.enum(['father', 'mother', 'grandparent', 'uncle', 'other']).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const [student] = await index_1.db.select().from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.enrollment, input.studentEnrollment)).limit(1);
        if (!student)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });
        const existing = await index_1.db.select().from(schema_1.guardians)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.guardians.userId, ctx.userId), (0, drizzle_orm_1.eq)(schema_1.guardians.studentId, student.id))).limit(1);
        if (existing.length > 0)
            throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Aluno já vinculado' });
        await index_1.db.insert(schema_1.guardians).values({
            userId: ctx.userId,
            studentId: student.id,
            relationship: input.relationship || 'other',
            isPrimary: false,
            canPickup: true,
        });
        return { success: true, studentName: student.name };
    }),
    // Histórico de viagens do aluno
    studentTripHistory: protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number(), limit: zod_1.z.number().default(20) }))
        .query(async ({ ctx, input }) => {
        const [guardianLink] = await index_1.db.select().from(schema_1.guardians)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.guardians.userId, ctx.userId), (0, drizzle_orm_1.eq)(schema_1.guardians.studentId, input.studentId))).limit(1);
        if (!guardianLink)
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        const studentStops = await index_1.db.select({ routeId: schema_1.stops.routeId })
            .from(schema_1.stopStudents)
            .innerJoin(schema_1.stops, (0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, schema_1.stops.id))
            .where((0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, input.studentId));
        const routeIds = [...new Set(studentStops.map(s => s.routeId))];
        if (routeIds.length === 0)
            return [];
        const tripHistory = await index_1.db.select({ trip: schema_1.trips, route: { id: schema_1.routes.id, name: schema_1.routes.name } })
            .from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .where((0, drizzle_orm_1.inArray)(schema_1.trips.routeId, routeIds))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.trips.tripDate))
            .limit(input.limit);
        return tripHistory;
    }),
});
// ============================================
// MONITORS ROUTER (APP MONITORES)
// ============================================
exports.monitorsRouter = t.router({
    // Obter viagem ativa do monitor/motorista
    myActiveTrip: protectedProcedure.query(async ({ ctx }) => {
        // Buscar se é motorista
        const [driver] = await index_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.userId, ctx.userId)).limit(1);
        if (!driver)
            return null;
        const [activeTrip] = await index_1.db.select().from(schema_1.trips)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.trips.driverId, driver.id), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'started'))).limit(1);
        if (!activeTrip)
            return null;
        const [route] = await index_1.db.select().from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, activeTrip.routeId)).limit(1);
        const [vehicle] = await index_1.db.select().from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, activeTrip.vehicleId)).limit(1);
        const tripStops = await index_1.db.select().from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, activeTrip.routeId)).orderBy(schema_1.stops.orderIndex);
        const stopsWithStudents = await Promise.all(tripStops.map(async (stop) => {
            const stopStudentList = await index_1.db.select({
                id: schema_1.students.id, name: schema_1.students.name, photoUrl: schema_1.students.photoUrl,
                hasSpecialNeeds: schema_1.students.hasSpecialNeeds, grade: schema_1.students.grade,
            })
                .from(schema_1.stopStudents)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, stop.id));
            // Verificar quais alunos já embarcaram nesta viagem
            const boardedLogs = await index_1.db.select({ studentId: schema_1.tripStudentLogs.studentId, eventType: schema_1.tripStudentLogs.eventType })
                .from(schema_1.tripStudentLogs)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.tripId, activeTrip.id), (0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.stopId, stop.id)));
            const studentsWithStatus = stopStudentList.map(s => ({
                ...s,
                status: boardedLogs.find(l => l.studentId === s.id)?.eventType || 'pending',
            }));
            const stopLog = await index_1.db.select().from(schema_1.tripStopLogs)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tripStopLogs.tripId, activeTrip.id), (0, drizzle_orm_1.eq)(schema_1.tripStopLogs.stopId, stop.id))).limit(1);
            return { ...stop, students: studentsWithStatus, arrived: stopLog.length > 0, arrivedAt: stopLog[0]?.arrivedAt || null };
        }));
        const stopLogs = await index_1.db.select().from(schema_1.tripStopLogs).where((0, drizzle_orm_1.eq)(schema_1.tripStopLogs.tripId, activeTrip.id));
        return {
            trip: activeTrip,
            route,
            vehicle,
            driverId: driver.id,
            stops: stopsWithStudents,
            completedStops: stopLogs.length,
            totalStops: tripStops.length,
        };
    }),
    // Obter viagens disponíveis para iniciar
    availableTrips: protectedProcedure.query(async ({ ctx }) => {
        const [driver] = await index_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.userId, ctx.userId)).limit(1);
        if (!driver)
            return { driver: null, routes: [] };
        const assignedRoutes = await index_1.db.select().from(schema_1.routes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.defaultDriverId, driver.id), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true)));
        const [vehicle] = driver.vehicleId
            ? await index_1.db.select().from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, driver.vehicleId)).limit(1)
            : [null];
        return { driver: { id: driver.id, vehicleId: driver.vehicleId }, vehicle, routes: assignedRoutes };
    }),
    // Registrar embarque de aluno
    boardStudent: staffProcedure
        .input(zod_1.z.object({
        tripId: zod_1.z.number(),
        studentId: zod_1.z.number(),
        stopId: zod_1.z.number(),
    }))
        .mutation(async ({ ctx, input }) => {
        // Verificar se já foi registrado
        const existing = await index_1.db.select().from(schema_1.tripStudentLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.tripId, input.tripId), (0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.studentId, input.studentId), (0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.stopId, input.stopId), (0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.eventType, 'boarded'))).limit(1);
        if (existing.length > 0)
            throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Aluno já embarcado' });
        await index_1.db.insert(schema_1.tripStudentLogs).values({
            tripId: input.tripId,
            studentId: input.studentId,
            stopId: input.stopId,
            eventType: 'boarded',
            eventAt: new Date(),
            registeredByUserId: ctx.userId,
        });
        // Incrementar contador
        const [trip] = await index_1.db.select().from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        if (trip) {
            await index_1.db.update(schema_1.trips).set({ totalStudentsBoarded: (trip.totalStudentsBoarded ?? 0) + 1 }).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId));
        }
        // Notificar responsáveis
        const [student] = await index_1.db.select({ name: schema_1.students.name }).from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId)).limit(1);
        const guardianList = await index_1.db.select({ userId: schema_1.guardians.userId }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.studentId, input.studentId));
        for (const g of guardianList) {
            await index_1.db.insert(schema_1.notifications).values({
                userId: g.userId,
                title: 'Aluno embarcou!',
                body: (student?.name || 'Seu filho(a)') + ' embarcou no ônibus escolar.',
                type: 'student_boarded',
                tripId: input.tripId,
                stopId: input.stopId,
                studentId: input.studentId,
            });
        }
        // Emitir evento de embarque via Socket.IO
        const [tripInfo] = await index_1.db.select({ routeId: schema_1.trips.routeId }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        if (tripInfo) {
            const [routeInfo] = await index_1.db.select({ municipalityId: schema_1.routes.municipalityId }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, tripInfo.routeId)).limit(1);
            if (routeInfo) {
                (0, socketInstance_1.emitToMunicipality)(routeInfo.municipalityId, 'student:boarded', {
                    tripId: input.tripId,
                    stopId: input.stopId,
                    studentId: input.studentId,
                    studentName: student?.name,
                    municipalityId: routeInfo.municipalityId,
                    time: new Date().toISOString(),
                });
            }
        }
        return { success: true, studentName: student?.name };
    }),
    // Registrar desembarque de aluno
    dropStudent: staffProcedure
        .input(zod_1.z.object({
        tripId: zod_1.z.number(),
        studentId: zod_1.z.number(),
        stopId: zod_1.z.number(),
    }))
        .mutation(async ({ ctx, input }) => {
        await index_1.db.insert(schema_1.tripStudentLogs).values({
            tripId: input.tripId,
            studentId: input.studentId,
            stopId: input.stopId,
            eventType: 'dropped',
            eventAt: new Date(),
            registeredByUserId: ctx.userId,
        });
        const [student] = await index_1.db.select({ name: schema_1.students.name }).from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId)).limit(1);
        const guardianList = await index_1.db.select({ userId: schema_1.guardians.userId }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.studentId, input.studentId));
        for (const g of guardianList) {
            await index_1.db.insert(schema_1.notifications).values({
                userId: g.userId,
                title: 'Aluno desembarcou!',
                body: (student?.name || 'Seu filho(a)') + ' desembarcou do ônibus com segurança.',
                type: 'student_dropped',
                tripId: input.tripId,
                stopId: input.stopId,
                studentId: input.studentId,
            });
        }
        // Emitir evento de desembarque via Socket.IO
        const [tripDrop] = await index_1.db.select({ routeId: schema_1.trips.routeId }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        if (tripDrop) {
            const [routeDrop] = await index_1.db.select({ municipalityId: schema_1.routes.municipalityId }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, tripDrop.routeId)).limit(1);
            if (routeDrop) {
                (0, socketInstance_1.emitToMunicipality)(routeDrop.municipalityId, 'student:dropped', {
                    tripId: input.tripId,
                    stopId: input.stopId,
                    studentId: input.studentId,
                    studentName: student?.name,
                    municipalityId: routeDrop.municipalityId,
                    time: new Date().toISOString(),
                });
            }
        }
        return { success: true, studentName: student?.name };
    }),
    // Marcar aluno como ausente
    markAbsent: staffProcedure
        .input(zod_1.z.object({
        tripId: zod_1.z.number(),
        studentId: zod_1.z.number(),
        stopId: zod_1.z.number(),
        notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        await index_1.db.insert(schema_1.tripStudentLogs).values({
            tripId: input.tripId,
            studentId: input.studentId,
            stopId: input.stopId,
            eventType: 'absent',
            eventAt: new Date(),
            registeredByUserId: ctx.userId,
            notes: input.notes,
        });
        return { success: true };
    }),
    // Obter resumo da viagem para o monitor
    tripSummary: protectedProcedure
        .input(zod_1.z.object({ tripId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const logs = await index_1.db.select().from(schema_1.tripStudentLogs).where((0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.tripId, input.tripId));
        const boarded = logs.filter(l => l.eventType === 'boarded').length;
        const dropped = logs.filter(l => l.eventType === 'dropped').length;
        const absent = logs.filter(l => l.eventType === 'absent').length;
        const [trip] = await index_1.db.select().from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        return {
            totalExpected: trip?.totalStudentsExpected || 0,
            boarded,
            dropped,
            absent,
            pending: (trip?.totalStudentsExpected || 0) - boarded - absent,
        };
    }),
});
// ============================================
// MONITOR STAFF ROUTER (CRUD PESSOAL MONITORES)
// ============================================
exports.monitorStaffRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.monitorStaff)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.monitorStaff.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.monitorStaff.isActive, true)))
            .orderBy(schema_1.monitorStaff.name);
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string().min(2),
        cpf: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        birthDate: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening', 'full']).optional(),
        routeName: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(),
        photoUrl: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        validateOptionalCPF(input.cpf);
        const { password, birthDate, ...rest } = input;
        let userId;
        if (input.email && password && password.length >= 6) {
            const passwordHash = await (0, bcryptjs_1.hash)(password, 12);
            const [user] = await index_1.db.insert(schema_1.users).values({
                municipalityId: input.municipalityId,
                email: input.email,
                passwordHash,
                name: input.name,
                phone: input.phone,
                cpf: input.cpf,
                role: 'monitor',
            }).$returningId();
            userId = user.id;
        }
        const [monitor] = await index_1.db.insert(schema_1.monitorStaff).values({
            ...rest,
            userId,
            birthDate: birthDate ? new Date(birthDate) : undefined,
        }).$returningId();
        return { success: true, id: monitor.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        cpf: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening', 'full']).optional(),
        routeName: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(),
        photoUrl: zod_1.z.string().optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            updateData[k] = v; });
        if (Object.keys(updateData).length > 0) {
            await index_1.db.update(schema_1.monitorStaff).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.monitorStaff.id, id));
        }
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.monitorStaff).where((0, drizzle_orm_1.eq)(schema_1.monitorStaff.id, input.id));
        return { success: true };
    }),
});
// ============================================
// CONTRACTS ROUTER
// ============================================
exports.contractsRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.contracts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contracts.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.contracts.isActive, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.contracts.createdAt));
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        number: zod_1.z.string().min(1),
        type: zod_1.z.string().optional(),
        supplier: zod_1.z.string().min(1),
        cnpj: zod_1.z.string().optional(),
        object: zod_1.z.string().optional(),
        value: zod_1.z.number().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        responsibleName: zod_1.z.string().optional(),
        responsiblePhone: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        validateOptionalCNPJ(input.cnpj);
        // Usar municipalityId do contexto JWT se disponivel, senao usar o enviado
        const munId = ctx.municipalityId || input.municipalityId;
        const [mun] = await index_1.db.select({ id: schema_1.municipalities.id }).from(schema_1.municipalities).where((0, drizzle_orm_1.eq)(schema_1.municipalities.id, munId)).limit(1);
        if (!mun) {
            throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'Municipio nao encontrado. Faca logout e login novamente.' });
        }
        const { startDate, endDate, value, municipalityId: _, ...rest } = input;
        const [contract] = await index_1.db.insert(schema_1.contracts).values({
            ...rest,
            municipalityId: munId,
            value: value?.toString(),
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        }).$returningId();
        return { success: true, id: contract.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        number: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(),
        supplier: zod_1.z.string().optional(),
        cnpj: zod_1.z.string().optional(),
        object: zod_1.z.string().optional(),
        value: zod_1.z.number().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        responsibleName: zod_1.z.string().optional(),
        responsiblePhone: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.enum(['active', 'expired', 'pending', 'cancelled']).optional(),
    }))
        .mutation(async ({ input }) => {
        validateOptionalCNPJ(input.cnpj);
        const { id, startDate, endDate, value, ...rest } = input;
        const updateData = { ...rest };
        if (value !== undefined)
            updateData.value = value.toString();
        if (startDate !== undefined)
            updateData.startDate = new Date(startDate);
        if (endDate !== undefined)
            updateData.endDate = new Date(endDate);
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
        if (Object.keys(updateData).length > 0) {
            await index_1.db.update(schema_1.contracts).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.contracts.id, id));
        }
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.contracts).where((0, drizzle_orm_1.eq)(schema_1.contracts.id, input.id));
        return { success: true };
    }),
});
// ============================================
// MAINTENANCE RECORDS ROUTER
// ============================================
exports.maintenanceRouter = t.router({
    list: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), vehicleId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.maintenanceRecords.municipalityId, input.municipalityId),
            (0, drizzle_orm_1.eq)(schema_1.maintenanceRecords.isActive, true),
            ...(input.vehicleId ? [(0, drizzle_orm_1.eq)(schema_1.maintenanceRecords.vehicleId, input.vehicleId)] : []),
        ];
        return index_1.db.select().from(schema_1.maintenanceRecords)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.maintenanceRecords.createdAt));
    }),
    create: adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        vehicleId: zod_1.z.number(),
        componentName: zod_1.z.string().min(1),
        type: zod_1.z.enum(['preventive', 'corrective', 'predictive']).optional(),
        description: zod_1.z.string().optional(),
        cost: zod_1.z.number().optional(),
        kmAtMaintenance: zod_1.z.number().optional(),
        intervalKm: zod_1.z.number().optional(),
        performedAt: zod_1.z.string().optional(),
        nextDueAt: zod_1.z.string().optional(),
        nextDueKm: zod_1.z.number().optional(),
        supplier: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { performedAt, nextDueAt, cost, ...rest } = input;
        const [record] = await index_1.db.insert(schema_1.maintenanceRecords).values({
            ...rest,
            cost: cost?.toString(),
            performedAt: performedAt ? new Date(performedAt) : undefined,
            nextDueAt: nextDueAt ? new Date(nextDueAt) : undefined,
        }).$returningId();
        return { success: true, id: record.id };
    }),
    update: adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        componentName: zod_1.z.string().optional(),
        type: zod_1.z.enum(['preventive', 'corrective', 'predictive']).optional(),
        description: zod_1.z.string().optional(),
        cost: zod_1.z.number().optional(),
        kmAtMaintenance: zod_1.z.number().optional(),
        intervalKm: zod_1.z.number().optional(),
        performedAt: zod_1.z.string().optional(),
        nextDueAt: zod_1.z.string().optional(),
        nextDueKm: zod_1.z.number().optional(),
        supplier: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, performedAt, nextDueAt, cost, ...rest } = input;
        const updateData = { ...rest };
        if (cost !== undefined)
            updateData.cost = cost.toString();
        if (performedAt !== undefined)
            updateData.performedAt = new Date(performedAt);
        if (nextDueAt !== undefined)
            updateData.nextDueAt = new Date(nextDueAt);
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
        if (Object.keys(updateData).length > 0) {
            await index_1.db.update(schema_1.maintenanceRecords).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.maintenanceRecords.id, id));
        }
        return { success: true };
    }),
    delete: adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.maintenanceRecords).where((0, drizzle_orm_1.eq)(schema_1.maintenanceRecords.id, input.id));
        return { success: true };
    }),
});
// ============================================
// ROUTER: LOCATION (GPS TRACKING)
// ============================================
const locationRouter = t.router({
    getActiveVehicles: protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        // Get all active trips with their latest locations
        const activeTrips = await index_1.db.select({
            tripId: schema_1.trips.id,
            routeId: schema_1.trips.routeId,
            vehicleId: schema_1.trips.vehicleId,
            driverId: schema_1.trips.driverId,
            status: schema_1.trips.status,
        }).from(schema_1.trips)
            .where((0, drizzle_orm_1.eq)(schema_1.trips.status, 'started'));
        if (activeTrips.length === 0)
            return [];
        const result = [];
        for (const trip of activeTrips) {
            // Get latest location for this trip
            const [latestLoc] = await index_1.db.select()
                .from(schema_1.locationHistory)
                .where((0, drizzle_orm_1.eq)(schema_1.locationHistory.tripId, trip.tripId))
                .orderBy((0, drizzle_orm_1.desc)(schema_1.locationHistory.recordedAt))
                .limit(1);
            // Get vehicle info
            const [vehicle] = await index_1.db.select()
                .from(schema_1.vehicles)
                .where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, trip.vehicleId));
            // Get driver info
            const [driver] = await index_1.db.select({
                id: schema_1.drivers.id,
                userId: schema_1.drivers.userId,
            }).from(schema_1.drivers)
                .where((0, drizzle_orm_1.eq)(schema_1.drivers.id, trip.driverId));
            let driverName = 'N/A';
            if (driver) {
                const [driverUser] = await index_1.db.select({ name: schema_1.users.name })
                    .from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, driver.userId));
                if (driverUser)
                    driverName = driverUser.name;
            }
            // Get route info
            const [route] = await index_1.db.select({ name: schema_1.routes.name })
                .from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, trip.routeId));
            result.push({
                tripId: trip.tripId,
                vehicleId: trip.vehicleId,
                driverId: trip.driverId,
                plate: vehicle?.plate || 'N/A',
                model: vehicle?.model || '',
                driverName,
                routeName: route?.name || 'N/A',
                latitude: latestLoc?.latitude || null,
                longitude: latestLoc?.longitude || null,
                speed: latestLoc?.speed ? parseFloat(latestLoc.speed) : null,
                heading: latestLoc?.heading || null,
                updatedAt: latestLoc?.recordedAt || null,
            });
        }
        return result;
    }),
    getVehiclePosition: protectedProcedure
        .input(zod_1.z.object({ tripId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [loc] = await index_1.db.select()
            .from(schema_1.locationHistory)
            .where((0, drizzle_orm_1.eq)(schema_1.locationHistory.tripId, input.tripId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.locationHistory.recordedAt))
            .limit(1);
        return loc || null;
    }),
    getHistory: protectedProcedure
        .input(zod_1.z.object({ tripId: zod_1.z.number(), limit: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const locs = await index_1.db.select()
            .from(schema_1.locationHistory)
            .where((0, drizzle_orm_1.eq)(schema_1.locationHistory.tripId, input.tripId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.locationHistory.recordedAt))
            .limit(input.limit || 100);
        return locs;
    }),
});
// ============================================
// MAIN ROUTER
// ============================================
exports.appRouter = t.router({
    auth: exports.authRouter,
    municipalities: exports.municipalitiesRouter,
    schools: exports.schoolsRouter,
    routes: exports.routesRouter,
    stops: exports.stopsRouter,
    students: exports.studentsRouter,
    trips: exports.tripsRouter,
    vehicles: exports.vehiclesRouter,
    drivers: exports.driversRouter,
    notifications: exports.notificationsRouter,
    users: exports.usersRouter,
    guardians: exports.guardiansRouter,
    monitors: exports.monitorsRouter,
    monitorStaff: exports.monitorStaffRouter,
    contracts: exports.contractsRouter,
    maintenance: exports.maintenanceRouter,
    location: locationRouter,
    // TEMPORARY RESET ENDPOINT - DELETE AFTER USE
    resetData: t.router({
        execute: adminProcedure
            .input(zod_1.z.object({ confirmReset: zod_1.z.literal('RESET_ALL_DATA') }))
            .mutation(async ({ input, ctx }) => {
            if (ctx.role !== 'super_admin')
                throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Apenas super_admin' });
            await index_1.db.execute((0, drizzle_orm_1.sql) `SET FOREIGN_KEY_CHECKS = 0`);
            await index_1.db.delete(schema_1.tripStudentLogs);
            await index_1.db.delete(schema_1.tripStopLogs);
            await index_1.db.delete(schema_1.trips);
            await index_1.db.delete(schema_1.locationHistory);
            await index_1.db.delete(schema_1.notifications);
            await index_1.db.delete(schema_1.stopStudents);
            await index_1.db.delete(schema_1.stops);
            await index_1.db.delete(schema_1.routes);
            await index_1.db.delete(schema_1.students);
            await index_1.db.delete(schema_1.guardians);
            await index_1.db.delete(schema_1.drivers);
            await index_1.db.delete(schema_1.vehicles);
            await index_1.db.delete(schema_1.schools);
            await index_1.db.delete(schema_1.users).where((0, drizzle_orm_1.sql) `id != 1`);
            await index_1.db.delete(schema_1.municipalities);
            await index_1.db.execute((0, drizzle_orm_1.sql) `SET FOREIGN_KEY_CHECKS = 1`);
            return { success: true, message: 'Todos os dados foram resetados. Apenas o admin id=1 foi mantido.' };
        }),
    }),
});
