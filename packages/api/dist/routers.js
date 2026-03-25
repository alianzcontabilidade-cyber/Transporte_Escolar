"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = exports.studentOccurrencesRouter = exports.studentHistoryRouter = exports.fuelRouter = exports.formConfigRouter = exports.studentDocumentsRouter = exports.waitingListRouter = exports.messagesRouter = exports.schoolCalendarRouter = exports.descriptiveReportsRouter = exports.transparencyRouter = exports.educacensoRouter = exports.inventoryRouter = exports.assetsRouter = exports.libraryLoansRouter = exports.libraryBooksRouter = exports.mealMenusRouter = exports.financialTransactionsRouter = exports.financialAccountsRouter = exports.staffEvaluationsRouter = exports.staffAllocationsRouter = exports.departmentsRouter = exports.positionsRouter = exports.lessonPlansRouter = exports.studentGradesRouter = exports.assessmentsRouter = exports.diaryAttendanceRouter = exports.classSubjectsRouter = exports.teachersRouter = exports.enrollmentsRouter = exports.classesRouter = exports.subjectsRouter = exports.classGradesRouter = exports.academicYearsRouter = exports.maintenanceRouter = exports.contractsRouter = exports.monitorStaffRouter = exports.monitorsRouter = exports.guardiansRouter = exports.usersRouter = exports.notificationsRouter = exports.driversRouter = exports.vehiclesRouter = exports.tripsRouter = exports.studentsRouter = exports.stopsRouter = exports.routesRouter = exports.schoolsRouter = exports.municipalitiesRouter = exports.authRouter = void 0;
exports.appRouter = exports.protocolsRouter = exports.bulletinsRouter = exports.classSchedulesRouter = exports.chatRouter = exports.aiRouter = exports.documentSignaturesRouter = exports.documentsRouter = exports.vehicleInspectionsRouter = exports.classCouncilRouter = exports.quotationItemsRouter = exports.quotationsRouter = void 0;
const server_1 = require("@trpc/server");
const trpc_1 = require("./trpc");
const zod_1 = require("zod");
const index_1 = require("./db/index");
const schema_1 = require("./db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const crypto_1 = require("crypto");
const socketInstance_1 = require("./socketInstance");
const routeOptimizer_1 = require("./services/routeOptimizer");
const helpers_1 = require("./helpers");
// ╔══════════════════════════════════════════════════════════════════╗
// ║                    ROUTERS - TABLE OF CONTENTS                  ║
// ╠══════════════════════════════════════════════════════════════════╣
// ║                                                                  ║
// ║  AUTENTICACAO                                                    ║
// ║    authRouter .......................... linha ~42               ║
// ║                                                                  ║
// ║  MUNICIPIO E ESCOLAS                                             ║
// ║    municipalitiesRouter ............... linha ~448               ║
// ║    schoolsRouter ...................... linha ~665               ║
// ║                                                                  ║
// ║  TRANSPORTE                                                      ║
// ║    routesRouter ....................... linha ~765               ║
// ║    stopsRouter ........................ linha ~869               ║
// ║    vehiclesRouter ..................... linha ~1672              ║
// ║    driversRouter ...................... linha ~1758              ║
// ║    tripsRouter ........................ linha ~1415              ║
// ║    locationRouter ..................... linha ~3029              ║
// ║    fuelRouter ......................... linha ~4779              ║
// ║    maintenanceRouter .................. linha ~2947              ║
// ║    vehicleInspectionsRouter ........... linha ~5165              ║
// ║                                                                  ║
// ║  ALUNOS E RESPONSAVEIS                                           ║
// ║    studentsRouter ..................... linha ~950               ║
// ║    guardiansRouter .................... linha ~2039              ║
// ║    studentHistoryRouter ............... linha ~4822              ║
// ║    studentOccurrencesRouter ........... linha ~4880              ║
// ║    studentDocumentsRouter ............. linha ~4726              ║
// ║    waitingListRouter .................. linha ~4705              ║
// ║                                                                  ║
// ║  MONITORES                                                       ║
// ║    monitorsRouter ..................... linha ~2503              ║
// ║    monitorStaffRouter ................. linha ~2777              ║
// ║                                                                  ║
// ║  MODULO ACADEMICO                                                ║
// ║    academicYearsRouter ................ linha ~3143              ║
// ║    classGradesRouter .................. linha ~3205              ║
// ║    classesRouter ...................... linha ~3305              ║
// ║    subjectsRouter ..................... linha ~3256              ║
// ║    classSubjectsRouter ................ linha ~3766              ║
// ║    enrollmentsRouter .................. linha ~3401              ║
// ║    teachersRouter ..................... linha ~3658              ║
// ║                                                                  ║
// ║  DIARIO ESCOLAR E NOTAS                                          ║
// ║    diaryAttendanceRouter .............. linha ~3829              ║
// ║    assessmentsRouter .................. linha ~3908              ║
// ║    studentGradesRouter ................ linha ~3970              ║
// ║    lessonPlansRouter .................. linha ~4045              ║
// ║    descriptiveReportsRouter ........... linha ~4512              ║
// ║                                                                  ║
// ║  RH                                                              ║
// ║    positionsRouter .................... linha ~4111              ║
// ║    departmentsRouter .................. linha ~4145              ║
// ║    staffAllocationsRouter ............. linha ~4170              ║
// ║    staffEvaluationsRouter ............. linha ~4213              ║
// ║                                                                  ║
// ║  FINANCEIRO E CONTRATOS                                          ║
// ║    financialAccountsRouter ............ linha ~4255              ║
// ║    financialTransactionsRouter ........ linha ~4270              ║
// ║    contractsRouter .................... linha ~2863              ║
// ║                                                                  ║
// ║  RECURSOS OPERACIONAIS                                           ║
// ║    mealMenusRouter .................... linha ~4290              ║
// ║    libraryBooksRouter ................. linha ~4306              ║
// ║    libraryLoansRouter ................. linha ~4325              ║
// ║    assetsRouter ....................... linha ~4341              ║
// ║    inventoryRouter .................... linha ~4356              ║
// ║                                                                  ║
// ║  DOCUMENTOS E ASSINATURAS                                        ║
// ║    documentsRouter .................... linha ~5165              ║
// ║    documentSignaturesRouter ........... linha ~5227              ║
// ║                                                                  ║
// ║  ADMINISTRACAO                                                   ║
// ║    usersRouter ........................ linha ~1938              ║
// ║    formConfigRouter ................... linha ~4745              ║
// ║    schoolCalendarRouter ............... linha ~4532              ║
// ║    messagesRouter ..................... linha ~4691              ║
// ║    notificationsRouter ................ linha ~1905              ║
// ║                                                                  ║
// ║  INTEGRACOES E TRANSPARENCIA                                     ║
// ║    educacensoRouter ................... linha ~4385              ║
// ║    transparencyRouter ................. linha ~4456              ║
// ║                                                                  ║
// ║  EVENTOS E OCORRENCIAS                                           ║
// ║    eventsRouter ....................... linha ~4920              ║
// ║    quotationsRouter ................... linha ~4970              ║
// ║    quotationItemsRouter ............... linha ~5018              ║
// ║    classCouncilRouter ................. linha ~5065              ║
// ║                                                                  ║
// ║  IA E OTIMIZACAO                                                 ║
// ║    aiRouter ........................... linha ~5355              ║
// ║                                                                  ║
// ║  BACKUP DE DADOS                                                  ║
// ║    backupRouter ....................... linha ~6240              ║
// ║                                                                  ║
// ║  APP ROUTER (composicao final) ........ linha ~6360              ║
// ╚══════════════════════════════════════════════════════════════════╝
// ============================================
// AUTH ROUTER
// ============================================
exports.authRouter = trpc_1.t.router({
    registerMunicipality: trpc_1.publicProcedure
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
        (0, trpc_1.validateOptionalCNPJ)(input.cnpj);
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
    // Buscar dados do responsável pelo CPF (público, para tela de cadastro)
    lookupGuardianByCpf: trpc_1.publicProcedure
        .input(zod_1.z.object({ cpf: zod_1.z.string() }))
        .query(async ({ input }) => {
        const cpfClean = input.cpf.replace(/\D/g, '');
        if (cpfClean.length !== 11)
            throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido' });
        // Format CPF variations for matching
        const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        // Search in students table for fatherCpf or motherCpf
        const matchingStudents = await index_1.db.select({
            id: schema_1.students.id,
            name: schema_1.students.name,
            enrollment: schema_1.students.enrollment,
            grade: schema_1.students.grade,
            schoolId: schema_1.students.schoolId,
            fatherName: schema_1.students.fatherName,
            fatherCpf: schema_1.students.fatherCpf,
            fatherPhone: schema_1.students.fatherPhone,
            motherName: schema_1.students.motherName,
            motherCpf: schema_1.students.motherCpf,
            motherPhone: schema_1.students.motherPhone,
        }).from(schema_1.students)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.students.fatherCpf, cpfClean), (0, drizzle_orm_1.eq)(schema_1.students.fatherCpf, cpfFormatted), (0, drizzle_orm_1.eq)(schema_1.students.motherCpf, cpfClean), (0, drizzle_orm_1.eq)(schema_1.students.motherCpf, cpfFormatted)));
        if (matchingStudents.length === 0) {
            return { found: false, guardianName: null, guardianPhone: null, relationship: null, students: [] };
        }
        // Determine if father or mother
        const first = matchingStudents[0];
        const isFather = first.fatherCpf?.replace(/\D/g, '') === cpfClean;
        return {
            found: true,
            guardianName: isFather ? first.fatherName : first.motherName,
            guardianPhone: isFather ? first.fatherPhone : first.motherPhone,
            relationship: isFather ? 'father' : 'mother',
            students: matchingStudents.map(s => ({
                id: s.id,
                name: s.name,
                enrollment: s.enrollment,
                grade: s.grade,
            })),
        };
    }),
    registerGuardian: trpc_1.publicProcedure
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
        (0, trpc_1.validateOptionalCPF)(input.cpf);
        // Find the student first
        const [student] = await index_1.db.select().from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.enrollment, input.studentEnrollment)).limit(1);
        if (!student) {
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Matrícula do aluno não encontrada. Verifique com a escola.' });
        }
        let userId = 0;
        let isExistingUser = false;
        // Check if CPF already exists in users
        if (input.cpf) {
            const cpfClean = input.cpf.replace(/\D/g, '');
            const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            const existingByCpf = await index_1.db.select().from(schema_1.users)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.cpf, cpfClean), (0, drizzle_orm_1.eq)(schema_1.users.cpf, cpfFormatted), (0, drizzle_orm_1.eq)(schema_1.users.cpf, input.cpf)))
                .limit(1);
            if (existingByCpf.length > 0) {
                // User already exists with this CPF - reuse the account
                userId = existingByCpf[0].id;
                isExistingUser = true;
                // Update municipalityId if not set (for guardian access)
                if (!existingByCpf[0].municipalityId) {
                    await index_1.db.update(schema_1.users).set({ municipalityId: student.municipalityId }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
                }
            }
        }
        if (!isExistingUser) {
            // Check if email already exists
            const existingByEmail = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, input.email)).limit(1);
            if (existingByEmail.length > 0) {
                throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado. Se você já tem conta no sistema, informe seu CPF para vincular o aluno ao seu perfil.' });
            }
            // Create new user
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
            userId = user.id;
        }
        // Create guardian link for the first student (by enrollment)
        const existingGuardian = await index_1.db.select().from(schema_1.guardians)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.guardians.userId, userId), (0, drizzle_orm_1.eq)(schema_1.guardians.studentId, student.id)))
            .limit(1);
        if (existingGuardian.length === 0) {
            await index_1.db.insert(schema_1.guardians).values({
                userId,
                studentId: student.id,
                relationship: input.relationship || 'other',
                isPrimary: true,
                canPickup: true,
            });
        }
        // Auto-link ALL other students that match the guardian's CPF
        let linkedCount = 1;
        if (input.cpf) {
            const cpfClean = input.cpf.replace(/\D/g, '');
            const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            const allMatchingStudents = await index_1.db.select({ id: schema_1.students.id, fatherCpf: schema_1.students.fatherCpf }).from(schema_1.students)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.students.fatherCpf, cpfClean), (0, drizzle_orm_1.eq)(schema_1.students.fatherCpf, cpfFormatted), (0, drizzle_orm_1.eq)(schema_1.students.motherCpf, cpfClean), (0, drizzle_orm_1.eq)(schema_1.students.motherCpf, cpfFormatted)));
            for (const ms of allMatchingStudents) {
                if (ms.id === student.id)
                    continue; // already linked above
                const alreadyLinked = await index_1.db.select().from(schema_1.guardians)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.guardians.userId, userId), (0, drizzle_orm_1.eq)(schema_1.guardians.studentId, ms.id)))
                    .limit(1);
                if (alreadyLinked.length === 0) {
                    const isFather = ms.fatherCpf?.replace(/\D/g, '') === cpfClean;
                    await index_1.db.insert(schema_1.guardians).values({
                        userId,
                        studentId: ms.id,
                        relationship: isFather ? 'father' : 'mother',
                        isPrimary: true,
                        canPickup: true,
                    });
                    linkedCount++;
                }
            }
        }
        const studentMsg = linkedCount > 1 ? `${linkedCount} alunos vinculados` : `Aluno ${student.name} vinculado`;
        return {
            success: true,
            userId,
            studentName: student.name,
            linkedCount,
            isExistingUser,
            message: isExistingUser
                ? `${studentMsg} ao seu perfil existente! Faça login com suas credenciais habituais.`
                : `Cadastro realizado! ${studentMsg}. Você já pode acompanhar o transporte.`
        };
    }),
    // Login flexível: email, CPF ou nome
    login: trpc_1.publicProcedure
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
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id, municipalityId: user.municipalityId, role: user.role }, trpc_1.JWT_SECRET, { expiresIn: '7d' });
        return {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, municipalityId: user.municipalityId }
        };
    }),
    // Solicitar recuperação de senha
    requestPasswordReset: trpc_1.publicProcedure
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
        const resetToken = (0, jsonwebtoken_1.sign)({ userId: user.id, code, purpose: 'password_reset' }, trpc_1.JWT_SECRET, { expiresIn: '15m' });
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
    resetPassword: trpc_1.publicProcedure
        .input(zod_1.z.object({
        resetToken: zod_1.z.string(),
        code: zod_1.z.string().length(6),
        newPassword: zod_1.z.string().min(6),
    }))
        .mutation(async ({ input }) => {
        let decoded;
        try {
            decoded = (0, jsonwebtoken_1.verify)(input.resetToken, trpc_1.JWT_SECRET);
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
    changePassword: trpc_1.protectedProcedure
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
    me: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        const [user] = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, ctx.userId)).limit(1);
        if (!user)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        return { id: user.id, name: user.name, email: user.email, role: user.role, municipalityId: user.municipalityId };
    }),
    // Resetar senha (admin)
    adminResetPassword: trpc_1.adminProcedure
        .input(zod_1.z.object({ userId: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [user] = await index_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, input.userId)).limit(1);
        if (!user)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let newPassword = '';
        for (let i = 0; i < 8; i++)
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        const passwordHash = await (0, bcryptjs_1.hash)(newPassword, 12);
        await index_1.db.update(schema_1.users).set({ passwordHash }).where((0, drizzle_orm_1.eq)(schema_1.users.id, input.userId));
        return { success: true, generatedPassword: newPassword };
    }),
});
// ============================================
// MUNICIPALITIES ROUTER
// ============================================
exports.municipalitiesRouter = trpc_1.t.router({
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [municipality] = await index_1.db.select().from(schema_1.municipalities).where((0, drizzle_orm_1.eq)(schema_1.municipalities.id, input.id)).limit(1);
        return municipality;
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        primaryColor: zod_1.z.string().optional(),
        cnpj: zod_1.z.string().optional(),
        cep: zod_1.z.string().optional(),
        logradouro: zod_1.z.string().optional(),
        numero: zod_1.z.string().optional(),
        complemento: zod_1.z.string().optional(),
        bairro: zod_1.z.string().optional(),
        fax: zod_1.z.string().optional(),
        website: zod_1.z.string().optional(),
        prefeitoName: zod_1.z.string().optional(),
        prefeitoCpf: zod_1.z.string().optional(),
        prefeitoCargo: zod_1.z.string().optional(),
        secretariaName: zod_1.z.string().optional(),
        secretariaCnpj: zod_1.z.string().optional(),
        secretariaPhone: zod_1.z.string().optional(),
        secretariaEmail: zod_1.z.string().optional(),
        secretariaLogradouro: zod_1.z.string().optional(),
        secretarioName: zod_1.z.string().optional(),
        secretarioCpf: zod_1.z.string().optional(),
        secretarioCargo: zod_1.z.string().optional(),
        secretarioDecreto: zod_1.z.string().optional(),
        customRoles: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Remove undefined values
        const cleanData = {};
        for (const [k, v] of Object.entries(data)) {
            if (v !== undefined)
                cleanData[k] = v;
        }
        if (Object.keys(cleanData).length > 0) {
            await index_1.db.update(schema_1.municipalities).set(cleanData).where((0, drizzle_orm_1.eq)(schema_1.municipalities.id, id));
        }
        return { success: true };
    }),
    // Responsáveis do município
    listResponsibles: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.municipalityResponsibles)
            .where((0, drizzle_orm_1.eq)(schema_1.municipalityResponsibles.municipalityId, input.municipalityId))
            .orderBy(schema_1.municipalityResponsibles.name);
    }),
    addResponsible: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string().min(2),
        role: zod_1.z.string().min(2),
        cpf: zod_1.z.string().optional(),
        decree: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [r] = await index_1.db.insert(schema_1.municipalityResponsibles).values(input).$returningId();
        return { success: true, id: r.id };
    }),
    updateResponsible: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        role: zod_1.z.string().optional(),
        cpf: zod_1.z.string().optional(),
        decree: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const cleanData = {};
        for (const [k, v] of Object.entries(data)) {
            if (v !== undefined)
                cleanData[k] = v;
        }
        if (Object.keys(cleanData).length > 0) {
            await index_1.db.update(schema_1.municipalityResponsibles).set(cleanData).where((0, drizzle_orm_1.eq)(schema_1.municipalityResponsibles.id, id));
        }
        return { success: true };
    }),
    removeResponsible: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.municipalityResponsibles).where((0, drizzle_orm_1.eq)(schema_1.municipalityResponsibles.id, input.id));
        return { success: true };
    }),
    // List all municipalities (super_admin only)
    list: trpc_1.superAdminProcedure
        .query(async () => {
        const allMuns = await index_1.db.select().from(schema_1.municipalities).orderBy(schema_1.municipalities.name);
        const results = await Promise.all(allMuns.map(async (m) => {
            const [schoolCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.schools).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, m.id), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true)));
            const [studentCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, m.id), (0, drizzle_orm_1.eq)(schema_1.students.isActive, true)));
            const [routeCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.routes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, m.id), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true)));
            const [vehicleCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.municipalityId, m.id));
            const [driverCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.municipalityId, m.id));
            const [tripCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.trips)
                .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, m.id), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'started')));
            return {
                ...m,
                schoolCount: Number(schoolCount?.count || 0),
                studentCount: Number(studentCount?.count || 0),
                routeCount: Number(routeCount?.count || 0),
                vehicleCount: Number(vehicleCount?.count || 0),
                driverCount: Number(driverCount?.count || 0),
                activeTrips: Number(tripCount?.count || 0),
            };
        }));
        return results;
    }),
    // Create new municipality with first admin user (super_admin only)
    create: trpc_1.superAdminProcedure
        .input(zod_1.z.object({
        name: zod_1.z.string().min(3),
        state: zod_1.z.string().length(2),
        city: zod_1.z.string(),
        cnpj: zod_1.z.string().optional(),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string().optional(),
        subscriptionPlan: zod_1.z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
        adminName: zod_1.z.string().min(3),
        adminEmail: zod_1.z.string().email(),
        adminPassword: zod_1.z.string().min(6),
    }))
        .mutation(async ({ input }) => {
        const { adminName, adminEmail, adminPassword, ...munData } = input;
        const [mun] = await index_1.db.insert(schema_1.municipalities).values({
            ...munData,
            isActive: true,
        }).$returningId();
        const passwordHash = await (0, bcryptjs_1.hash)(adminPassword, 10);
        await index_1.db.insert(schema_1.users).values({
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: 'municipal_admin',
            municipalityId: mun.id,
            isActive: true,
        });
        return { success: true, id: mun.id };
    }),
    // Get global stats for super admin dashboard
    globalStats: trpc_1.superAdminProcedure
        .query(async () => {
        const [muns] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.municipalities).where((0, drizzle_orm_1.eq)(schema_1.municipalities.isActive, true));
        const [studentCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.isActive, true));
        const [routeCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.isActive, true));
        const [vehicleCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.vehicles);
        const [activeTrips] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.status, 'started'));
        const [docCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.documents).where((0, drizzle_orm_1.eq)(schema_1.documents.status, 'valid'));
        return {
            municipalities: Number(muns?.count || 0),
            students: Number(studentCount?.count || 0),
            routes: Number(routeCount?.count || 0),
            vehicles: Number(vehicleCount?.count || 0),
            activeTrips: Number(activeTrips?.count || 0),
            documents: Number(docCount?.count || 0),
        };
    }),
    getDashboardStats: trpc_1.adminProcedure
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
exports.schoolsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.schools)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true)))
            .orderBy(schema_1.schools.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string().min(3),
        code: zod_1.z.string().optional(),
        type: zod_1.z.enum(['infantil', 'fundamental', 'medio', 'tecnico', 'especial']).optional(),
        cnpj: zod_1.z.string().optional(),
        cep: zod_1.z.string().optional(),
        logradouro: zod_1.z.string().optional(),
        numero: zod_1.z.string().optional(),
        complemento: zod_1.z.string().optional(),
        bairro: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        directorName: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        morningStart: zod_1.z.string().optional(),
        morningEnd: zod_1.z.string().optional(),
        afternoonStart: zod_1.z.string().optional(),
        afternoonEnd: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [school] = await index_1.db.insert(schema_1.schools).values({
            ...input,
            latitude: input.latitude?.toString(),
            longitude: input.longitude?.toString(),
        }).$returningId();
        return { success: true, id: school.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        municipalityId: zod_1.z.number().optional(),
        name: zod_1.z.string().optional(),
        code: zod_1.z.string().optional(),
        type: zod_1.z.enum(['infantil', 'fundamental', 'medio', 'tecnico', 'especial']).optional(),
        cnpj: zod_1.z.string().optional(),
        cep: zod_1.z.string().optional(),
        logradouro: zod_1.z.string().optional(),
        numero: zod_1.z.string().optional(),
        complemento: zod_1.z.string().optional(),
        bairro: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        directorName: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        morningStart: zod_1.z.string().optional(),
        morningEnd: zod_1.z.string().optional(),
        afternoonStart: zod_1.z.string().optional(),
        afternoonEnd: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, latitude, longitude, ...data } = input;
        const updateData = { ...data };
        if (latitude !== undefined)
            updateData.latitude = latitude.toString();
        if (longitude !== undefined)
            updateData.longitude = longitude.toString();
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
        if (Object.keys(updateData).length > 0)
            await index_1.db.update(schema_1.schools).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.schools.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasStudents] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.schoolId, input.id), (0, drizzle_orm_1.eq)(schema_1.students.isActive, true)));
        const [hasClasses] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.schoolId, input.id), (0, drizzle_orm_1.eq)(schema_1.classes.isActive, true)));
        const [hasRoutes] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.routes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.schoolId, input.id), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true)));
        const deps = [];
        if (Number(hasStudents.c) > 0)
            deps.push(`${hasStudents.c} aluno(s)`);
        if (Number(hasClasses.c) > 0)
            deps.push(`${hasClasses.c} turma(s)`);
        if (Number(hasRoutes.c) > 0)
            deps.push(`${hasRoutes.c} rota(s)`);
        if (deps.length > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Escola possui: ${deps.join(', ')}` });
        await index_1.db.update(schema_1.schools).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.schools.id, input.id));
        return { success: true };
    }),
});
// ============================================
// ROUTES ROUTER
// ============================================
exports.routesRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const allRoutes = await index_1.db.select().from(schema_1.routes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true)))
            .orderBy(schema_1.routes.name);
        const routesWithStops = await Promise.all(allRoutes.map(async (route) => {
            const routeStops = await index_1.db.select().from(schema_1.stops)
                .where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, route.id))
                .orderBy(schema_1.stops.orderIndex);
            return { route, stops: routeStops };
        }));
        return routesWithStops;
    }),
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [route] = await index_1.db.select().from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, input.id)).limit(1);
        if (!route)
            throw new server_1.TRPCError({ code: 'NOT_FOUND' });
        const routeStops = await index_1.db.select().from(schema_1.stops)
            .where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, input.id)).orderBy(schema_1.stops.orderIndex);
        return { ...route, stops: routeStops };
    }),
    create: trpc_1.adminProcedure
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
        // Condições da Estrada (SETE)
        hasGate: zod_1.z.boolean().optional(),
        hasCattleGuard: zod_1.z.boolean().optional(),
        hasLatch: zod_1.z.boolean().optional(),
        hasMudhole: zod_1.z.boolean().optional(),
        hasRusticBridge: zod_1.z.boolean().optional(),
        roadSurface: zod_1.z.string().optional(),
        // Custos mensais
        monthlyCostFuel: zod_1.z.string().optional(),
        monthlyCostMaintenance: zod_1.z.string().optional(),
        monthlyCostDriver: zod_1.z.string().optional(),
        monthlyCostMonitor: zod_1.z.string().optional(),
        monthlyCostInsurance: zod_1.z.string().optional(),
        costPerStudent: zod_1.z.string().optional(),
        stops: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            lat: zod_1.z.string().optional(),
            lng: zod_1.z.string().optional(),
            latitude: zod_1.z.string().optional(),
            longitude: zod_1.z.string().optional(),
            order: zod_1.z.number().optional(),
        })).optional(),
    }))
        .mutation(async ({ input }) => {
        const { stops: inputStops, ...routeData } = input;
        const [route] = await index_1.db.insert(schema_1.routes).values(routeData).$returningId();
        // Insert stops if provided
        if (inputStops && inputStops.length > 0) {
            for (let i = 0; i < inputStops.length; i++) {
                const s = inputStops[i];
                const lat = s.lat || s.latitude || '0';
                const lng = s.lng || s.longitude || '0';
                await index_1.db.insert(schema_1.stops).values({
                    routeId: route.id,
                    name: s.name,
                    latitude: lat,
                    longitude: lng,
                    orderIndex: s.order ?? i,
                });
            }
        }
        return { success: true, id: route.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        type: zod_1.z.enum(['pickup', 'dropoff', 'both']).optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        scheduledStartTime: zod_1.z.string().optional(),
        scheduledEndTime: zod_1.z.string().optional(),
        // Condições da Estrada (SETE)
        hasGate: zod_1.z.boolean().optional(),
        hasCattleGuard: zod_1.z.boolean().optional(),
        hasLatch: zod_1.z.boolean().optional(),
        hasMudhole: zod_1.z.boolean().optional(),
        hasRusticBridge: zod_1.z.boolean().optional(),
        roadSurface: zod_1.z.string().optional(),
        // Custos mensais
        monthlyCostFuel: zod_1.z.string().optional(),
        monthlyCostMaintenance: zod_1.z.string().optional(),
        monthlyCostDriver: zod_1.z.string().optional(),
        monthlyCostMonitor: zod_1.z.string().optional(),
        monthlyCostInsurance: zod_1.z.string().optional(),
        costPerStudent: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.routes).set(data).where((0, drizzle_orm_1.eq)(schema_1.routes.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasStops] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, input.id));
        const [hasTrips] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.routeId, input.id));
        const deps = [];
        if (Number(hasStops.c) > 0)
            deps.push(`${hasStops.c} parada(s)`);
        if (Number(hasTrips.c) > 0)
            deps.push(`${hasTrips.c} viagem(ns)`);
        if (deps.length > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Rota possui: ${deps.join(', ')}` });
        await index_1.db.update(schema_1.routes).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.routes.id, input.id));
        return { success: true };
    }),
});
// ============================================
// STOPS ROUTER
// ============================================
exports.stopsRouter = trpc_1.t.router({
    listByRoute: trpc_1.protectedProcedure
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
    create: trpc_1.adminProcedure
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
    update: trpc_1.adminProcedure
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
    reorder: trpc_1.adminProcedure
        .input(zod_1.z.object({ routeId: zod_1.z.number(), stopIds: zod_1.z.array(zod_1.z.number()) }))
        .mutation(async ({ input }) => {
        for (let i = 0; i < input.stopIds.length; i++) {
            await index_1.db.update(schema_1.stops).set({ orderIndex: i + 1 }).where((0, drizzle_orm_1.eq)(schema_1.stops.id, input.stopIds[i]));
        }
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasStudents] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.stopStudents).where((0, drizzle_orm_1.eq)(schema_1.stopStudents.stopId, input.id));
        if (Number(hasStudents.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Parada possui ${hasStudents.c} aluno(s) vinculado(s)` });
        await index_1.db.update(schema_1.stops).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.stops.id, input.id));
        return { success: true };
    }),
});
// ============================================
// STUDENTS ROUTER
// ============================================
exports.studentsRouter = trpc_1.t.router({
    // Lista cartórios distintos já cadastrados para autocomplete
    listCartorios: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const result = await index_1.db.selectDistinct({ cartorio: schema_1.students.certidaoCartorio })
            .from(schema_1.students)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId), (0, drizzle_orm_1.sql) `${schema_1.students.certidaoCartorio} IS NOT NULL AND ${schema_1.students.certidaoCartorio} != ''`))
            .orderBy(schema_1.students.certidaoCartorio);
        return result.map(r => r.cartorio).filter(Boolean);
    }),
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId),
            (0, drizzle_orm_1.eq)(schema_1.students.isActive, true),
            ...(input.schoolId ? [(0, drizzle_orm_1.eq)(schema_1.students.schoolId, input.schoolId)] : []),
        ];
        const result = await index_1.db.select({
            id: schema_1.students.id,
            municipalityId: schema_1.students.municipalityId,
            schoolId: schema_1.students.schoolId,
            name: schema_1.students.name,
            birthDate: schema_1.students.birthDate,
            grade: schema_1.students.grade,
            classRoom: schema_1.students.classRoom,
            enrollment: schema_1.students.enrollment,
            shift: schema_1.students.shift,
            photoUrl: schema_1.students.photoUrl,
            hasSpecialNeeds: schema_1.students.hasSpecialNeeds,
            specialNeedsNotes: schema_1.students.specialNeedsNotes,
            bloodType: schema_1.students.bloodType,
            allergies: schema_1.students.allergies,
            medications: schema_1.students.medications,
            healthNotes: schema_1.students.healthNotes,
            emergencyContact1Name: schema_1.students.emergencyContact1Name,
            emergencyContact1Phone: schema_1.students.emergencyContact1Phone,
            emergencyContact1Relation: schema_1.students.emergencyContact1Relation,
            emergencyContact2Name: schema_1.students.emergencyContact2Name,
            emergencyContact2Phone: schema_1.students.emergencyContact2Phone,
            emergencyContact2Relation: schema_1.students.emergencyContact2Relation,
            address: schema_1.students.address,
            latitude: schema_1.students.latitude,
            longitude: schema_1.students.longitude,
            needsTransport: schema_1.students.needsTransport,
            transportType: schema_1.students.transportType,
            transportDistance: schema_1.students.transportDistance,
            zone: schema_1.students.zone,
            routeName: schema_1.students.routeName,
            cpf: schema_1.students.cpf,
            rg: schema_1.students.rg,
            rgOrgao: schema_1.students.rgOrgao,
            rgUf: schema_1.students.rgUf,
            sex: schema_1.students.sex,
            race: schema_1.students.race,
            nationality: schema_1.students.nationality,
            naturalness: schema_1.students.naturalness,
            naturalnessUf: schema_1.students.naturalnessUf,
            nis: schema_1.students.nis,
            cartaoSus: schema_1.students.cartaoSus,
            // Certidão
            certidaoTipo: schema_1.students.certidaoTipo,
            certidaoNumero: schema_1.students.certidaoNumero,
            certidaoFolha: schema_1.students.certidaoFolha,
            certidaoLivro: schema_1.students.certidaoLivro,
            certidaoData: schema_1.students.certidaoData,
            certidaoCartorio: schema_1.students.certidaoCartorio,
            // Endereço
            addressNumber: schema_1.students.addressNumber,
            addressComplement: schema_1.students.addressComplement,
            neighborhood: schema_1.students.neighborhood,
            cep: schema_1.students.cep,
            city: schema_1.students.city,
            state: schema_1.students.state,
            phone: schema_1.students.phone,
            cellPhone: schema_1.students.cellPhone,
            // Filiação
            fatherName: schema_1.students.fatherName,
            fatherCpf: schema_1.students.fatherCpf,
            fatherRg: schema_1.students.fatherRg,
            fatherRgOrgao: schema_1.students.fatherRgOrgao,
            fatherRgUf: schema_1.students.fatherRgUf,
            fatherPhone: schema_1.students.fatherPhone,
            fatherProfession: schema_1.students.fatherProfession,
            fatherWorkplace: schema_1.students.fatherWorkplace,
            fatherEducation: schema_1.students.fatherEducation,
            fatherNaturalness: schema_1.students.fatherNaturalness,
            fatherNaturalnessUf: schema_1.students.fatherNaturalnessUf,
            motherName: schema_1.students.motherName,
            motherCpf: schema_1.students.motherCpf,
            motherRg: schema_1.students.motherRg,
            motherRgOrgao: schema_1.students.motherRgOrgao,
            motherRgUf: schema_1.students.motherRgUf,
            motherPhone: schema_1.students.motherPhone,
            motherProfession: schema_1.students.motherProfession,
            motherWorkplace: schema_1.students.motherWorkplace,
            motherEducation: schema_1.students.motherEducation,
            motherNaturalness: schema_1.students.motherNaturalness,
            motherNaturalnessUf: schema_1.students.motherNaturalnessUf,
            familyIncome: schema_1.students.familyIncome,
            // Programas
            bolsaFamilia: schema_1.students.bolsaFamilia,
            bpc: schema_1.students.bpc,
            // Deficiência
            deficiencyType: schema_1.students.deficiencyType,
            // Procedência
            previousSchool: schema_1.students.previousSchool,
            previousSchoolType: schema_1.students.previousSchoolType,
            previousSchoolZone: schema_1.students.previousSchoolZone,
            previousCity: schema_1.students.previousCity,
            previousState: schema_1.students.previousState,
            studentStatus: schema_1.students.studentStatus,
            enrollmentType: schema_1.students.enrollmentType,
            rgDate: schema_1.students.rgDate,
            peti: schema_1.students.peti,
            otherPrograms: schema_1.students.otherPrograms,
            tgd: schema_1.students.tgd,
            superdotacao: schema_1.students.superdotacao,
            salaRecursos: schema_1.students.salaRecursos,
            acompanhamento: schema_1.students.acompanhamento,
            encaminhamento: schema_1.students.encaminhamento,
            observations: schema_1.students.observations,
            isActive: schema_1.students.isActive,
            createdAt: schema_1.students.createdAt,
            updatedAt: schema_1.students.updatedAt,
            school: schema_1.schools.name,
        })
            .from(schema_1.students)
            .leftJoin(schema_1.schools, (0, drizzle_orm_1.eq)(schema_1.students.schoolId, schema_1.schools.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy(schema_1.students.name);
        return result;
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        schoolId: zod_1.z.number().optional(),
        name: zod_1.z.string().min(2),
        birthDate: zod_1.z.string().optional(),
        grade: zod_1.z.string().optional(),
        classRoom: zod_1.z.string().optional(),
        className: zod_1.z.string().optional(),
        enrollment: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        // Dados pessoais
        cpf: zod_1.z.string().optional(), rg: zod_1.z.string().optional(), rgOrgao: zod_1.z.string().optional(),
        rgUf: zod_1.z.string().optional(), rgDate: zod_1.z.string().optional(),
        sex: zod_1.z.string().optional(), race: zod_1.z.string().optional(),
        nationality: zod_1.z.string().optional(), naturalness: zod_1.z.string().optional(), naturalnessUf: zod_1.z.string().optional(),
        nis: zod_1.z.string().optional(), cartaoSus: zod_1.z.string().optional(),
        // Certidao
        certidaoTipo: zod_1.z.string().optional(), certidaoNumero: zod_1.z.string().optional(),
        certidaoFolha: zod_1.z.string().optional(), certidaoLivro: zod_1.z.string().optional(),
        certidaoData: zod_1.z.string().optional(), certidaoCartorio: zod_1.z.string().optional(),
        // Endereco
        address: zod_1.z.string().optional(), addressNumber: zod_1.z.string().optional(),
        addressComplement: zod_1.z.string().optional(), neighborhood: zod_1.z.string().optional(),
        cep: zod_1.z.string().optional(), city: zod_1.z.string().optional(), state: zod_1.z.string().optional(),
        zone: zod_1.z.string().optional(), phone: zod_1.z.string().optional(), cellPhone: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(), longitude: zod_1.z.number().optional(),
        // Transporte
        needsTransport: zod_1.z.boolean().optional(), transportType: zod_1.z.string().optional(), transportDistance: zod_1.z.string().optional(),
        // Programas sociais
        bolsaFamilia: zod_1.z.boolean().optional(), bpc: zod_1.z.boolean().optional(), peti: zod_1.z.boolean().optional(), otherPrograms: zod_1.z.string().optional(),
        // Necessidades especiais
        photoUrl: zod_1.z.string().optional(), photo: zod_1.z.string().optional(),
        hasSpecialNeeds: zod_1.z.boolean().optional(), specialNeedsNotes: zod_1.z.string().optional(),
        deficiencyType: zod_1.z.string().optional(), tgd: zod_1.z.string().optional(),
        superdotacao: zod_1.z.boolean().optional(), salaRecursos: zod_1.z.boolean().optional(),
        acompanhamento: zod_1.z.string().optional(), encaminhamento: zod_1.z.string().optional(),
        // Saude
        bloodType: zod_1.z.string().optional(), allergies: zod_1.z.string().optional(),
        medications: zod_1.z.string().optional(), healthNotes: zod_1.z.string().optional(),
        // Contatos emergencia
        emergencyContact1Name: zod_1.z.string().optional(), emergencyContact1Phone: zod_1.z.string().optional(),
        emergencyContact1Relation: zod_1.z.string().optional(),
        emergencyContact2Name: zod_1.z.string().optional(), emergencyContact2Phone: zod_1.z.string().optional(),
        emergencyContact2Relation: zod_1.z.string().optional(),
        guardian1Name: zod_1.z.string().optional(), guardian1Phone: zod_1.z.string().optional(), guardian1Relation: zod_1.z.string().optional(),
        guardian2Name: zod_1.z.string().optional(), guardian2Phone: zod_1.z.string().optional(), guardian2Relation: zod_1.z.string().optional(),
        // Filiacao
        fatherName: zod_1.z.string().optional(), fatherCpf: zod_1.z.string().optional(), fatherRg: zod_1.z.string().optional(),
        fatherRgOrgao: zod_1.z.string().optional(), fatherRgUf: zod_1.z.string().optional(),
        fatherPhone: zod_1.z.string().optional(), fatherProfession: zod_1.z.string().optional(), fatherWorkplace: zod_1.z.string().optional(),
        fatherEducation: zod_1.z.string().optional(), fatherNaturalness: zod_1.z.string().optional(), fatherNaturalnessUf: zod_1.z.string().optional(),
        motherName: zod_1.z.string().optional(), motherCpf: zod_1.z.string().optional(), motherRg: zod_1.z.string().optional(),
        motherRgOrgao: zod_1.z.string().optional(), motherRgUf: zod_1.z.string().optional(),
        motherPhone: zod_1.z.string().optional(), motherProfession: zod_1.z.string().optional(), motherWorkplace: zod_1.z.string().optional(),
        motherEducation: zod_1.z.string().optional(), motherNaturalness: zod_1.z.string().optional(), motherNaturalnessUf: zod_1.z.string().optional(),
        familyIncome: zod_1.z.string().optional(),
        // Procedencia
        previousSchool: zod_1.z.string().optional(), previousSchoolType: zod_1.z.string().optional(),
        previousSchoolZone: zod_1.z.string().optional(), previousCity: zod_1.z.string().optional(),
        previousState: zod_1.z.string().optional(), enrollmentType: zod_1.z.string().optional(),
        studentStatus: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(), routeId: zod_1.z.number().optional(), school: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const finalSchoolId = input.schoolId || (input.school ? parseInt(input.school) : undefined);
        if (!finalSchoolId)
            throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'Escola e obrigatoria.' });
        const { municipalityId, school: _s, photo, className, guardian1Name, guardian1Phone, guardian1Relation, guardian2Name, guardian2Phone, guardian2Relation, routeId, ...rest } = input;
        // Resolve routeId -> routeName
        let resolvedRouteName;
        if (routeId) {
            const [rt] = await index_1.db.select({ name: schema_1.routes.name }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, routeId));
            resolvedRouteName = rt?.name || undefined;
        }
        const [student] = await index_1.db.insert(schema_1.students).values({
            municipalityId,
            schoolId: finalSchoolId,
            name: rest.name,
            enrollment: rest.enrollment || undefined,
            grade: rest.grade || undefined,
            classRoom: rest.classRoom || className || undefined,
            shift: rest.shift || undefined,
            birthDate: rest.birthDate ? new Date(rest.birthDate) : undefined,
            photoUrl: rest.photoUrl || photo || undefined,
            address: rest.address || undefined,
            addressNumber: rest.addressNumber || undefined,
            addressComplement: rest.addressComplement || undefined,
            neighborhood: rest.neighborhood || undefined,
            cep: rest.cep || undefined,
            city: rest.city || undefined,
            state: rest.state || undefined,
            zone: rest.zone || undefined,
            phone: rest.phone || undefined,
            cellPhone: rest.cellPhone || undefined,
            // Dados pessoais
            cpf: rest.cpf || undefined, rg: rest.rg || undefined, rgOrgao: rest.rgOrgao || undefined,
            rgUf: rest.rgUf || undefined, rgDate: rest.rgDate || undefined,
            sex: rest.sex || undefined, race: rest.race || undefined,
            nationality: rest.nationality || undefined, naturalness: rest.naturalness || undefined,
            naturalnessUf: rest.naturalnessUf || undefined,
            nis: rest.nis || undefined, cartaoSus: rest.cartaoSus || undefined,
            // Certidao
            certidaoTipo: rest.certidaoTipo || undefined, certidaoNumero: rest.certidaoNumero || undefined,
            certidaoFolha: rest.certidaoFolha || undefined, certidaoLivro: rest.certidaoLivro || undefined,
            certidaoData: rest.certidaoData || undefined, certidaoCartorio: rest.certidaoCartorio || undefined,
            // Transporte
            needsTransport: rest.needsTransport || false, transportType: rest.transportType || undefined,
            transportDistance: rest.transportDistance || undefined,
            routeName: resolvedRouteName,
            // Programas sociais
            bolsaFamilia: rest.bolsaFamilia || false, bpc: rest.bpc || false,
            peti: rest.peti || false, otherPrograms: rest.otherPrograms || undefined,
            // Necessidades especiais
            hasSpecialNeeds: rest.hasSpecialNeeds || false, specialNeedsNotes: rest.specialNeedsNotes || undefined,
            deficiencyType: rest.deficiencyType || undefined, tgd: rest.tgd || undefined,
            superdotacao: rest.superdotacao || false, salaRecursos: rest.salaRecursos || false,
            acompanhamento: rest.acompanhamento || undefined, encaminhamento: rest.encaminhamento || undefined,
            // Saude
            bloodType: rest.bloodType || undefined, allergies: rest.allergies || undefined,
            medications: rest.medications || undefined, healthNotes: rest.healthNotes || undefined,
            // Contatos emergencia
            emergencyContact1Name: rest.emergencyContact1Name || guardian1Name || undefined,
            emergencyContact1Phone: rest.emergencyContact1Phone || guardian1Phone || undefined,
            emergencyContact1Relation: rest.emergencyContact1Relation || guardian1Relation || undefined,
            emergencyContact2Name: rest.emergencyContact2Name || guardian2Name || undefined,
            emergencyContact2Phone: rest.emergencyContact2Phone || guardian2Phone || undefined,
            emergencyContact2Relation: rest.emergencyContact2Relation || guardian2Relation || undefined,
            // Filiacao
            fatherName: rest.fatherName || undefined, fatherCpf: rest.fatherCpf || undefined,
            fatherRg: rest.fatherRg || undefined, fatherRgOrgao: rest.fatherRgOrgao || undefined, fatherRgUf: rest.fatherRgUf || undefined,
            fatherPhone: rest.fatherPhone || undefined,
            fatherProfession: rest.fatherProfession || undefined, fatherWorkplace: rest.fatherWorkplace || undefined,
            fatherEducation: rest.fatherEducation || undefined,
            fatherNaturalness: rest.fatherNaturalness || undefined, fatherNaturalnessUf: rest.fatherNaturalnessUf || undefined,
            motherName: rest.motherName || undefined, motherCpf: rest.motherCpf || undefined,
            motherRg: rest.motherRg || undefined, motherRgOrgao: rest.motherRgOrgao || undefined, motherRgUf: rest.motherRgUf || undefined,
            motherPhone: rest.motherPhone || undefined,
            motherProfession: rest.motherProfession || undefined, motherWorkplace: rest.motherWorkplace || undefined,
            motherEducation: rest.motherEducation || undefined,
            motherNaturalness: rest.motherNaturalness || undefined, motherNaturalnessUf: rest.motherNaturalnessUf || undefined,
            familyIncome: rest.familyIncome || undefined,
            // Procedencia
            previousSchool: rest.previousSchool || undefined, previousSchoolType: rest.previousSchoolType || undefined,
            previousSchoolZone: rest.previousSchoolZone || undefined,
            previousCity: rest.previousCity || undefined, previousState: rest.previousState || undefined,
            enrollmentType: rest.enrollmentType || undefined, studentStatus: rest.studentStatus || undefined,
            observations: rest.observations || undefined,
            ...(rest.latitude !== undefined && { latitude: rest.latitude.toFixed(8) }),
            ...(rest.longitude !== undefined && { longitude: rest.longitude.toFixed(8) }),
        }).$returningId();
        return { success: true, id: student.id };
    }),
    assignToStop: trpc_1.adminProcedure
        .input(zod_1.z.object({
        studentId: zod_1.z.number(),
        stopId: zod_1.z.number(),
        boardingType: zod_1.z.enum(['pickup', 'dropoff', 'both']).optional(),
    }))
        .mutation(async ({ input }) => {
        await index_1.db.insert(schema_1.stopStudents).values(input);
        return { success: true };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        municipalityId: zod_1.z.number().optional(),
        schoolId: zod_1.z.number().optional(),
        school: zod_1.z.string().optional(),
        name: zod_1.z.string().optional(),
        enrollment: zod_1.z.string().optional(),
        birthDate: zod_1.z.string().optional(),
        grade: zod_1.z.string().optional(),
        classRoom: zod_1.z.string().optional(),
        className: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        // Dados pessoais
        cpf: zod_1.z.string().optional(), rg: zod_1.z.string().optional(), rgOrgao: zod_1.z.string().optional(),
        rgUf: zod_1.z.string().optional(), rgDate: zod_1.z.string().optional(),
        sex: zod_1.z.string().optional(), race: zod_1.z.string().optional(),
        nationality: zod_1.z.string().optional(), naturalness: zod_1.z.string().optional(), naturalnessUf: zod_1.z.string().optional(),
        nis: zod_1.z.string().optional(), cartaoSus: zod_1.z.string().optional(),
        // Certidao
        certidaoTipo: zod_1.z.string().optional(), certidaoNumero: zod_1.z.string().optional(),
        certidaoFolha: zod_1.z.string().optional(), certidaoLivro: zod_1.z.string().optional(),
        certidaoData: zod_1.z.string().optional(), certidaoCartorio: zod_1.z.string().optional(),
        // Endereco
        address: zod_1.z.string().optional(), addressNumber: zod_1.z.string().optional(),
        addressComplement: zod_1.z.string().optional(), neighborhood: zod_1.z.string().optional(),
        cep: zod_1.z.string().optional(), city: zod_1.z.string().optional(), state: zod_1.z.string().optional(),
        zone: zod_1.z.string().optional(), phone: zod_1.z.string().optional(), cellPhone: zod_1.z.string().optional(),
        // Transporte
        needsTransport: zod_1.z.boolean().optional(), transportType: zod_1.z.string().optional(), transportDistance: zod_1.z.string().optional(),
        // Programas sociais
        bolsaFamilia: zod_1.z.boolean().optional(), bpc: zod_1.z.boolean().optional(), peti: zod_1.z.boolean().optional(), otherPrograms: zod_1.z.string().optional(),
        // Necessidades especiais
        photoUrl: zod_1.z.string().optional(), photo: zod_1.z.string().optional(),
        hasSpecialNeeds: zod_1.z.boolean().optional(), specialNeedsNotes: zod_1.z.string().optional(),
        deficiencyType: zod_1.z.string().optional(), tgd: zod_1.z.string().optional(),
        superdotacao: zod_1.z.boolean().optional(), salaRecursos: zod_1.z.boolean().optional(),
        acompanhamento: zod_1.z.string().optional(), encaminhamento: zod_1.z.string().optional(),
        // Saude
        bloodType: zod_1.z.string().optional(), allergies: zod_1.z.string().optional(),
        medications: zod_1.z.string().optional(), healthNotes: zod_1.z.string().optional(),
        // Contatos emergencia
        emergencyContact1Name: zod_1.z.string().optional(), emergencyContact1Phone: zod_1.z.string().optional(),
        emergencyContact1Relation: zod_1.z.string().optional(),
        emergencyContact2Name: zod_1.z.string().optional(), emergencyContact2Phone: zod_1.z.string().optional(),
        emergencyContact2Relation: zod_1.z.string().optional(),
        guardian1Name: zod_1.z.string().optional(), guardian1Phone: zod_1.z.string().optional(), guardian1Relation: zod_1.z.string().optional(),
        guardian2Name: zod_1.z.string().optional(), guardian2Phone: zod_1.z.string().optional(), guardian2Relation: zod_1.z.string().optional(),
        // Filiacao
        fatherName: zod_1.z.string().optional(), fatherCpf: zod_1.z.string().optional(), fatherRg: zod_1.z.string().optional(),
        fatherRgOrgao: zod_1.z.string().optional(), fatherRgUf: zod_1.z.string().optional(),
        fatherPhone: zod_1.z.string().optional(), fatherProfession: zod_1.z.string().optional(), fatherWorkplace: zod_1.z.string().optional(),
        fatherEducation: zod_1.z.string().optional(), fatherNaturalness: zod_1.z.string().optional(), fatherNaturalnessUf: zod_1.z.string().optional(),
        motherName: zod_1.z.string().optional(), motherCpf: zod_1.z.string().optional(), motherRg: zod_1.z.string().optional(),
        motherRgOrgao: zod_1.z.string().optional(), motherRgUf: zod_1.z.string().optional(),
        motherPhone: zod_1.z.string().optional(), motherProfession: zod_1.z.string().optional(), motherWorkplace: zod_1.z.string().optional(),
        motherEducation: zod_1.z.string().optional(), motherNaturalness: zod_1.z.string().optional(), motherNaturalnessUf: zod_1.z.string().optional(),
        familyIncome: zod_1.z.string().optional(),
        // Procedencia
        previousSchool: zod_1.z.string().optional(), previousSchoolType: zod_1.z.string().optional(),
        previousSchoolZone: zod_1.z.string().optional(), previousCity: zod_1.z.string().optional(),
        previousState: zod_1.z.string().optional(), enrollmentType: zod_1.z.string().optional(),
        studentStatus: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(), routeId: zod_1.z.number().optional(),
        latitude: zod_1.z.number().optional(), longitude: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, municipalityId, school, photo, className, guardian1Name, guardian1Phone, guardian1Relation, guardian2Name, guardian2Phone, guardian2Relation, observations, routeId, latitude, longitude, ...fields } = input;
        const ud = {};
        // Basic fields
        if (fields.name !== undefined)
            ud.name = fields.name;
        if (fields.enrollment !== undefined)
            ud.enrollment = fields.enrollment;
        if (fields.grade !== undefined)
            ud.grade = fields.grade;
        if (fields.classRoom || className)
            ud.classRoom = fields.classRoom || className;
        if (fields.shift !== undefined)
            ud.shift = fields.shift;
        if (fields.birthDate)
            ud.birthDate = new Date(fields.birthDate);
        if (fields.photoUrl || photo)
            ud.photoUrl = fields.photoUrl || photo;
        if (school)
            ud.schoolId = parseInt(school);
        if (fields.schoolId)
            ud.schoolId = fields.schoolId;
        if (latitude !== undefined)
            ud.latitude = latitude.toFixed(8);
        if (longitude !== undefined)
            ud.longitude = longitude.toFixed(8);
        if (observations !== undefined)
            ud.observations = observations;
        // Se routeId foi fornecido, buscar nome da rota e salvar
        if (routeId) {
            try {
                const [route] = await index_1.db.select({ name: schema_1.routes.name }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, routeId)).limit(1);
                if (route)
                    ud.routeName = route.name;
            }
            catch { /* ignore */ }
        }
        // All string/boolean fields - copy if defined
        const stringFields = [
            'cpf', 'rg', 'rgOrgao', 'rgUf', 'rgDate', 'sex', 'race', 'nationality', 'naturalness', 'naturalnessUf',
            'nis', 'cartaoSus', 'certidaoTipo', 'certidaoNumero', 'certidaoFolha', 'certidaoLivro', 'certidaoData', 'certidaoCartorio',
            'address', 'addressNumber', 'addressComplement', 'neighborhood', 'cep', 'city', 'state', 'zone', 'phone', 'cellPhone',
            'transportType', 'transportDistance', 'otherPrograms',
            'specialNeedsNotes', 'deficiencyType', 'tgd', 'acompanhamento', 'encaminhamento',
            'bloodType', 'allergies', 'medications', 'healthNotes',
            'fatherName', 'fatherCpf', 'fatherRg', 'fatherRgOrgao', 'fatherRgUf', 'fatherPhone', 'fatherProfession', 'fatherWorkplace', 'fatherEducation',
            'fatherNaturalness', 'fatherNaturalnessUf',
            'motherName', 'motherCpf', 'motherRg', 'motherRgOrgao', 'motherRgUf', 'motherPhone', 'motherProfession', 'motherWorkplace', 'motherEducation',
            'motherNaturalness', 'motherNaturalnessUf',
            'familyIncome', 'previousSchool', 'previousSchoolType', 'previousSchoolZone', 'previousCity', 'previousState',
            'enrollmentType', 'studentStatus',
        ];
        for (const f of stringFields) {
            if (fields[f] !== undefined)
                ud[f] = fields[f];
        }
        const boolFields = ['hasSpecialNeeds', 'needsTransport', 'bolsaFamilia', 'bpc', 'peti', 'superdotacao', 'salaRecursos'];
        for (const f of boolFields) {
            if (fields[f] !== undefined)
                ud[f] = fields[f];
        }
        // Emergency contacts / guardians
        const ec1Name = fields.emergencyContact1Name || guardian1Name;
        const ec1Phone = fields.emergencyContact1Phone || guardian1Phone;
        const ec1Rel = fields.emergencyContact1Relation || guardian1Relation;
        const ec2Name = fields.emergencyContact2Name || guardian2Name;
        const ec2Phone = fields.emergencyContact2Phone || guardian2Phone;
        const ec2Rel = fields.emergencyContact2Relation || guardian2Relation;
        if (ec1Name !== undefined)
            ud.emergencyContact1Name = ec1Name;
        if (ec1Phone !== undefined)
            ud.emergencyContact1Phone = ec1Phone;
        if (ec1Rel !== undefined)
            ud.emergencyContact1Relation = ec1Rel;
        if (ec2Name !== undefined)
            ud.emergencyContact2Name = ec2Name;
        if (ec2Phone !== undefined)
            ud.emergencyContact2Phone = ec2Phone;
        if (ec2Rel !== undefined)
            ud.emergencyContact2Relation = ec2Rel;
        // Remove undefined values
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.students).set(ud).where((0, drizzle_orm_1.eq)(schema_1.students.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasEnrollments] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.enrollments).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, input.id), (0, drizzle_orm_1.eq)(schema_1.enrollments.status, 'active'), (0, drizzle_orm_1.eq)(schema_1.enrollments.isActive, true)));
        if (Number(hasEnrollments.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Aluno possui ${hasEnrollments.c} matrícula(s) ativa(s). Altere o status da matrícula antes de excluir.` });
        // Desativar aluno
        await index_1.db.update(schema_1.students).set({ isActive: false, studentStatus: 'inativo' }).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.id));
        // Limpar vínculos com paradas de rota
        await index_1.db.delete(schema_1.stopStudents).where((0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, input.id));
        // Desativar matrículas que não estão ativas
        await index_1.db.update(schema_1.enrollments).set({ isActive: false }).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, input.id), (0, drizzle_orm_1.eq)(schema_1.enrollments.isActive, true)));
        return { success: true };
    }),
    bulkImport: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        schoolId: zod_1.z.number().optional(),
        students: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            enrollment: zod_1.z.string().optional(),
            grade: zod_1.z.string().optional(),
            className: zod_1.z.string().optional(),
            shift: zod_1.z.string().optional(),
            birthDate: zod_1.z.string().optional(),
            cpf: zod_1.z.string().optional(),
            address: zod_1.z.string().optional(),
            neighborhood: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional(),
            fatherName: zod_1.z.string().optional(),
            motherName: zod_1.z.string().optional(),
            sex: zod_1.z.string().optional(),
            race: zod_1.z.string().optional(),
            nis: zod_1.z.string().optional(),
            rg: zod_1.z.string().optional(),
            cep: zod_1.z.string().optional(),
            observations: zod_1.z.string().optional(),
        })),
    }))
        .mutation(async ({ input }) => {
        let created = 0, skipped = 0, errors = 0;
        const errorDetails = [];
        for (const s of input.students) {
            try {
                // Check if enrollment already exists
                if (s.enrollment) {
                    const existing = await index_1.db.select({ id: schema_1.students.id }).from(schema_1.students)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.students.enrollment, s.enrollment), (0, drizzle_orm_1.eq)(schema_1.students.isActive, true)))
                        .limit(1);
                    if (existing.length > 0) {
                        skipped++;
                        continue;
                    }
                }
                // Parse shift
                const shiftVal = s.shift?.toLowerCase();
                const shift = shiftVal === 'tarde' || shiftVal === 'afternoon' ? 'afternoon'
                    : shiftVal === 'noite' || shiftVal === 'evening' ? 'evening'
                        : 'morning';
                // Parse birthDate
                let birthDate;
                if (s.birthDate) {
                    // Try dd/mm/yyyy format first
                    const parts = s.birthDate.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
                    if (parts) {
                        birthDate = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
                    }
                    else {
                        birthDate = new Date(s.birthDate);
                    }
                    if (isNaN(birthDate.getTime()))
                        birthDate = undefined;
                }
                await index_1.db.insert(schema_1.students).values({
                    municipalityId: input.municipalityId,
                    schoolId: input.schoolId || 1,
                    name: s.name,
                    enrollment: s.enrollment || undefined,
                    grade: s.grade || undefined,
                    classRoom: s.className || undefined,
                    shift: shift,
                    birthDate,
                    cpf: s.cpf || undefined,
                    address: s.address || undefined,
                    neighborhood: s.neighborhood || undefined,
                    city: s.city || undefined,
                    state: s.state || undefined,
                    phone: s.phone || undefined,
                    fatherName: s.fatherName || undefined,
                    motherName: s.motherName || undefined,
                    sex: s.sex || undefined,
                    race: s.race || undefined,
                    nis: s.nis || undefined,
                    rg: s.rg || undefined,
                    cep: s.cep || undefined,
                    observations: s.observations || undefined,
                    isActive: true,
                });
                created++;
            }
            catch (err) {
                errors++;
                errorDetails.push(`${s.name}: ${err.message || 'erro desconhecido'}`);
            }
        }
        return { created, skipped, errors, total: input.students.length, errorDetails: errorDetails.slice(0, 10) };
    }),
});
// ============================================
// TRIPS ROUTER
// ============================================
exports.tripsRouter = trpc_1.t.router({
    // Finalizar todas as viagens ativas de um município
    completeAll: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        // Finalizar TODAS as viagens que não estão completed/cancelled
        const activeTrips = await index_1.db.select({ tripId: schema_1.trips.id, status: schema_1.trips.status })
            .from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.trips.status, 'started'), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'scheduled')), (0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId)));
        let count = 0;
        for (const t of activeTrips) {
            await index_1.db.update(schema_1.trips).set({ status: 'completed', completedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.trips.id, t.tripId));
            count++;
        }
        return { success: true, finalized: count };
    }),
    listActive: trpc_1.protectedProcedure
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
    getById: trpc_1.protectedProcedure
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
    start: trpc_1.protectedProcedure
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
    arriveAtStop: trpc_1.protectedProcedure
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
    complete: trpc_1.protectedProcedure
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
    updateLocation: trpc_1.protectedProcedure
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
    history: trpc_1.protectedProcedure
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
exports.vehiclesRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.municipalityId, input.municipalityId)).orderBy(schema_1.vehicles.nickname);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), plate: zod_1.z.string(), nickname: zod_1.z.string().optional(),
        brand: zod_1.z.string().optional(), model: zod_1.z.string().optional(), year: zod_1.z.number().optional(), capacity: zod_1.z.number().optional(),
        color: zod_1.z.string().optional(), fuel: zod_1.z.string().optional(), chassis: zod_1.z.string().optional(), renavam: zod_1.z.string().optional(),
        crlvExpiry: zod_1.z.string().optional(), ipvaExpiry: zod_1.z.string().optional(), inspectionExpiry: zod_1.z.string().optional(),
        insuranceCompany: zod_1.z.string().optional(), insurancePolicy: zod_1.z.string().optional(), insuranceExpiry: zod_1.z.string().optional(),
        fireExtinguisherExpiry: zod_1.z.string().optional(), currentKm: zod_1.z.number().optional(),
        lastMaintenanceAt: zod_1.z.string().optional(), nextMaintenanceAt: zod_1.z.string().optional(),
        gpsDeviceId: zod_1.z.string().optional(), gpsDeviceModel: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(),
        status: zod_1.z.enum(['active', 'maintenance', 'inactive']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { crlvExpiry, ipvaExpiry, inspectionExpiry, insuranceExpiry, fireExtinguisherExpiry, fuel, chassis, lastMaintenanceAt, nextMaintenanceAt, ...rest } = input;
        const [vehicle] = await index_1.db.insert(schema_1.vehicles).values({
            ...rest,
            fuelType: fuel, chassi: chassis,
            crlvExpiry: crlvExpiry ? new Date(crlvExpiry) : undefined,
            ipvaExpiry: ipvaExpiry ? new Date(ipvaExpiry) : undefined,
            inspectionExpiry: inspectionExpiry ? new Date(inspectionExpiry) : undefined,
            insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
            fireExtinguisherExpiry: fireExtinguisherExpiry ? new Date(fireExtinguisherExpiry) : undefined,
            lastMaintenanceAt: lastMaintenanceAt ? new Date(lastMaintenanceAt) : undefined,
            nextMaintenanceAt: nextMaintenanceAt ? new Date(nextMaintenanceAt) : undefined,
        }).$returningId();
        return { success: true, id: vehicle.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        plate: zod_1.z.string().optional(), nickname: zod_1.z.string().optional(),
        brand: zod_1.z.string().optional(), model: zod_1.z.string().optional(), year: zod_1.z.number().optional(), capacity: zod_1.z.number().optional(),
        color: zod_1.z.string().optional(), fuel: zod_1.z.string().optional(), chassis: zod_1.z.string().optional(), renavam: zod_1.z.string().optional(),
        status: zod_1.z.enum(['active', 'maintenance', 'inactive']).optional(),
        crlvExpiry: zod_1.z.string().optional(), ipvaExpiry: zod_1.z.string().optional(), inspectionExpiry: zod_1.z.string().optional(),
        insuranceCompany: zod_1.z.string().optional(), insurancePolicy: zod_1.z.string().optional(), insuranceExpiry: zod_1.z.string().optional(),
        fireExtinguisherExpiry: zod_1.z.string().optional(), currentKm: zod_1.z.number().optional(),
        lastMaintenanceAt: zod_1.z.string().optional(), nextMaintenanceAt: zod_1.z.string().optional(),
        gpsDeviceId: zod_1.z.string().optional(), gpsDeviceModel: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, crlvExpiry, ipvaExpiry, inspectionExpiry, insuranceExpiry, fireExtinguisherExpiry, fuel, chassis, lastMaintenanceAt, nextMaintenanceAt, ...data } = input;
        const ud = { ...data };
        if (fuel !== undefined)
            ud.fuelType = fuel;
        if (chassis !== undefined)
            ud.chassi = chassis;
        if (crlvExpiry)
            ud.crlvExpiry = new Date(crlvExpiry);
        if (ipvaExpiry)
            ud.ipvaExpiry = new Date(ipvaExpiry);
        if (inspectionExpiry)
            ud.inspectionExpiry = new Date(inspectionExpiry);
        if (insuranceExpiry)
            ud.insuranceExpiry = new Date(insuranceExpiry);
        if (fireExtinguisherExpiry)
            ud.fireExtinguisherExpiry = new Date(fireExtinguisherExpiry);
        if (lastMaintenanceAt)
            ud.lastMaintenanceAt = new Date(lastMaintenanceAt);
        if (nextMaintenanceAt)
            ud.nextMaintenanceAt = new Date(nextMaintenanceAt);
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.vehicles).set(ud).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasTrips] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.vehicleId, input.id));
        const [hasMaint] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.maintenanceRecords).where((0, drizzle_orm_1.eq)(schema_1.maintenanceRecords.vehicleId, input.id));
        const [hasFuel] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.fuelRecords).where((0, drizzle_orm_1.eq)(schema_1.fuelRecords.vehicleId, input.id));
        const deps = [];
        if (Number(hasTrips.c) > 0)
            deps.push(`${hasTrips.c} viagem(ns)`);
        if (Number(hasMaint.c) > 0)
            deps.push(`${hasMaint.c} manutenção(ões)`);
        if (Number(hasFuel.c) > 0)
            deps.push(`${hasFuel.c} abastecimento(s)`);
        if (deps.length > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Veículo possui: ${deps.join(', ')}` });
        await index_1.db.update(schema_1.vehicles).set({ status: 'inactive' }).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, input.id));
        return { success: true };
    }),
});
// ============================================
// DRIVERS ROUTER
// ============================================
exports.driversRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const driverList = await index_1.db.select({
            driver: schema_1.drivers,
            user: { id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email, phone: schema_1.users.phone, cpf: schema_1.users.cpf },
        })
            .from(schema_1.drivers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.drivers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.drivers.municipalityId, input.municipalityId));
        // Find linked routes for each driver
        const enriched = await Promise.all(driverList.map(async (d) => {
            const [linkedRoute] = await index_1.db.select({ id: schema_1.routes.id, name: schema_1.routes.name, code: schema_1.routes.code })
                .from(schema_1.routes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.defaultDriverId, d.driver.id), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true))).limit(1);
            return { ...d, linkedRoute: linkedRoute || null };
        }));
        return enriched;
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), name: zod_1.z.string(),
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
        cpf: zod_1.z.string().optional(),
        birthDate: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        cnhNumber: zod_1.z.string().optional(),
        cnhCategory: zod_1.z.string().optional(),
        cnhExpiry: zod_1.z.string().optional(),
        experience: zod_1.z.number().optional(),
        routeId: zod_1.z.number().optional(),
        vehicleId: zod_1.z.number().optional(),
        photo: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        (0, trpc_1.validateOptionalCPF)(input.cpf);
        // Gerar email temporario se nao informado
        const email = input.email || (input.name.toLowerCase().replace(/\s+/g, '.') + '@motorista.netescol.local');
        // Gerar senha padrao se nao informada
        const pwd = input.password || 'Trans@' + Math.floor(1000 + Math.random() * 9000);
        const passwordHash = await (0, bcryptjs_1.hash)(pwd, 12);
        try {
            const [user] = await index_1.db.insert(schema_1.users).values({
                municipalityId: input.municipalityId, email, passwordHash,
                name: input.name, phone: input.phone, cpf: input.cpf, role: 'driver',
            }).$returningId();
            const [driver] = await index_1.db.insert(schema_1.drivers).values({
                userId: user.id, municipalityId: input.municipalityId,
                cnhNumber: input.cnhNumber, cnhCategory: input.cnhCategory,
                cnhExpiresAt: input.cnhExpiry ? new Date(input.cnhExpiry) : undefined,
                vehicleId: input.vehicleId,
                address: input.address, city: input.city, state: input.state,
                birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
                experience: input.experience, photo: input.photo, observations: input.observations,
            }).$returningId();
            // Vincular rota se informada
            if (input.routeId) {
                await index_1.db.update(schema_1.routes).set({ defaultDriverId: driver.id }).where((0, drizzle_orm_1.eq)(schema_1.routes.id, input.routeId));
            }
            return { success: true, driverId: driver.id, userId: user.id, generatedPassword: input.password ? undefined : pwd };
        }
        catch (err) {
            if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
                if (err.message.includes('email'))
                    throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este e-mail ja esta cadastrado.' });
                if (err.message.includes('cpf'))
                    throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este CPF ja esta cadastrado.' });
                throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Registro duplicado. Verifique e-mail e CPF.' });
            }
            throw err;
        }
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        cpf: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        cnhNumber: zod_1.z.string().optional(),
        cnhCategory: zod_1.z.string().optional(),
        cnhExpiry: zod_1.z.string().optional(),
        vehicleId: zod_1.z.number().optional(),
        routeId: zod_1.z.number().optional(),
        isAvailable: zod_1.z.boolean().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        birthDate: zod_1.z.string().optional(),
        experience: zod_1.z.number().optional(),
        photo: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        (0, trpc_1.validateOptionalCPF)(input.cpf);
        const { id, routeId, name, phone, cpf, email, cnhExpiry, birthDate, experience, photo, observations, address, city, state, ...driverData } = input;
        // Atualizar dados do driver
        const ud = { ...driverData };
        if (cnhExpiry)
            ud.cnhExpiresAt = new Date(cnhExpiry);
        if (address !== undefined)
            ud.address = address;
        if (city !== undefined)
            ud.city = city;
        if (state !== undefined)
            ud.state = state;
        if (birthDate)
            ud.birthDate = new Date(birthDate);
        if (experience !== undefined)
            ud.experience = experience;
        if (photo !== undefined)
            ud.photo = photo;
        if (observations !== undefined)
            ud.observations = observations;
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.drivers).set(ud).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id));
        // Atualizar dados do user vinculado
        const [driver] = await index_1.db.select({ userId: schema_1.drivers.userId }).from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id)).limit(1);
        if (driver) {
            const userData = {};
            if (name)
                userData.name = name;
            if (phone)
                userData.phone = phone;
            if (cpf)
                userData.cpf = cpf;
            if (email)
                userData.email = email;
            if (Object.keys(userData).length > 0)
                await index_1.db.update(schema_1.users).set(userData).where((0, drizzle_orm_1.eq)(schema_1.users.id, driver.userId));
        }
        // Vincular rota se informada
        if (routeId) {
            await index_1.db.update(schema_1.routes).set({ defaultDriverId: id }).where((0, drizzle_orm_1.eq)(schema_1.routes.id, routeId));
        }
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasTrips] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.driverId, input.id));
        if (Number(hasTrips.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Motorista possui ${hasTrips.c} viagem(ns) registrada(s)` });
        await index_1.db.update(schema_1.drivers).set({ isAvailable: false }).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, input.id));
        return { success: true };
    }),
});
// ============================================
// NOTIFICATIONS ROUTER
// ============================================
exports.notificationsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ limit: zod_1.z.number().default(50) }))
        .query(async ({ ctx, input }) => {
        return index_1.db.select().from(schema_1.notifications)
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, ctx.userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.notifications.createdAt))
            .limit(input.limit);
    }),
    unreadCount: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        const [result] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.notifications)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notifications.userId, ctx.userId), (0, drizzle_orm_1.eq)(schema_1.notifications.isRead, false)));
        return { count: result?.count || 0 };
    }),
    markAsRead: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.notifications).set({ isRead: true, readAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.notifications.id, input.id));
        return { success: true };
    }),
    markAllAsRead: trpc_1.protectedProcedure.mutation(async ({ ctx }) => {
        await index_1.db.update(schema_1.notifications).set({ isRead: true, readAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, ctx.userId));
        return { success: true };
    }),
});
// ============================================
// USERS ROUTER
// ============================================
exports.usersRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return await index_1.db.select({
            id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email, role: schema_1.users.role,
            municipalityId: schema_1.users.municipalityId, cpf: schema_1.users.cpf, phone: schema_1.users.phone,
            avatarUrl: schema_1.users.avatarUrl, isActive: schema_1.users.isActive, createdAt: schema_1.users.createdAt
        })
            .from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.municipalityId, input.municipalityId));
    }),
    create: trpc_1.adminProcedure
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
        (0, trpc_1.validateOptionalCPF)(input.cpf);
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
    update: trpc_1.adminProcedure
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
        jobTitle: zod_1.z.string().optional(),
        registrationNumber: zod_1.z.string().optional(),
        decree: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        qualification: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        (0, trpc_1.validateOptionalCPF)(input.cpf);
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
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [isDriver] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.userId, input.id));
        const [isTeacher] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.teachers).where((0, drizzle_orm_1.eq)(schema_1.teachers.userId, input.id));
        const [isGuardian] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.userId, input.id));
        const deps = [];
        if (Number(isDriver.c) > 0)
            deps.push('motorista');
        if (Number(isTeacher.c) > 0)
            deps.push('professor');
        if (Number(isGuardian.c) > 0)
            deps.push('responsável de aluno');
        if (deps.length > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Usuário vinculado como: ${deps.join(', ')}` });
        await index_1.db.update(schema_1.users).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.users.id, input.id));
        return { success: true };
    }),
    updateProfile: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        jobTitle: zod_1.z.string().optional(),
        registrationNumber: zod_1.z.string().optional(),
        decree: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        qualification: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const updateData = { ...input };
        Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
        if (Object.keys(updateData).length > 0) {
            await index_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, ctx.userId));
        }
        return { success: true };
    }),
    getProfile: trpc_1.protectedProcedure
        .query(async ({ ctx }) => {
        const [user] = await index_1.db.select({
            id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email, phone: schema_1.users.phone,
            cpf: schema_1.users.cpf, role: schema_1.users.role,
            jobTitle: schema_1.users.jobTitle, registrationNumber: schema_1.users.registrationNumber,
            decree: schema_1.users.decree, department: schema_1.users.department, qualification: schema_1.users.qualification,
        }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, ctx.userId)).limit(1);
        return user || null;
    }),
});
exports.guardiansRouter = trpc_1.t.router({
    // Listar filhos/dependentes do responsável
    myStudents: trpc_1.protectedProcedure.query(async ({ ctx }) => {
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
    getStudentActiveTrip: trpc_1.protectedProcedure
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
                driverLocation: driver && driver.currentLatitude && driver.currentLongitude ? { lat: parseFloat(driver.currentLatitude), lng: parseFloat(driver.currentLongitude), updatedAt: driver.lastLocationUpdate } : null,
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
    addStudent: trpc_1.protectedProcedure
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
    studentTripHistory: trpc_1.protectedProcedure
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
    // ============================================
    // PORTAL DO RESPONSÁVEL - ENDPOINTS ACADÊMICOS
    // ============================================
    // 1. Boletim do aluno
    studentReportCard: trpc_1.protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number(), classId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        if (!await (0, helpers_1.verifyGuardianAccess)(ctx.userId, input.studentId))
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        // Buscar avaliações da turma
        const classAssessments = await index_1.db.select().from(schema_1.assessments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.assessments.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.assessments.isActive, true)));
        if (classAssessments.length === 0)
            return { subjects: [], summary: { average: 0, totalAssessments: 0 } };
        const assessmentIds = classAssessments.map(a => a.id);
        // Buscar notas do aluno
        const grades = await index_1.db.select().from(schema_1.studentGrades)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentGrades.studentId, input.studentId), (0, drizzle_orm_1.inArray)(schema_1.studentGrades.assessmentId, assessmentIds)));
        // Buscar nomes das disciplinas
        const subjectIds = [...new Set(classAssessments.map(a => a.subjectId))];
        const subjectList = subjectIds.length > 0
            ? await index_1.db.select({ id: schema_1.subjects.id, name: schema_1.subjects.name }).from(schema_1.subjects).where((0, drizzle_orm_1.inArray)(schema_1.subjects.id, subjectIds))
            : [];
        // Agrupar por disciplina e bimestre
        const subjectMap = {};
        for (const assessment of classAssessments) {
            if (!subjectMap[assessment.subjectId]) {
                const subj = subjectList.find(s => s.id === assessment.subjectId);
                subjectMap[assessment.subjectId] = { subjectName: subj?.name || 'Disciplina', bimesters: {} };
            }
            if (!subjectMap[assessment.subjectId].bimesters[assessment.bimester]) {
                subjectMap[assessment.subjectId].bimesters[assessment.bimester] = { assessments: [], average: 0 };
            }
            const grade = grades.find(g => g.assessmentId === assessment.id);
            subjectMap[assessment.subjectId].bimesters[assessment.bimester].assessments.push({
                assessmentName: assessment.name,
                type: assessment.type,
                maxScore: assessment.maxScore,
                weight: assessment.weight,
                score: grade?.score || null,
                date: assessment.date,
            });
        }
        // Calcular médias por bimestre
        for (const subjectId of Object.keys(subjectMap)) {
            for (const bim of Object.keys(subjectMap[Number(subjectId)].bimesters)) {
                const bimData = subjectMap[Number(subjectId)].bimesters[bim];
                const scored = bimData.assessments.filter(a => a.score !== null);
                if (scored.length > 0) {
                    const totalWeight = scored.reduce((s, a) => s + parseFloat(a.weight || '1'), 0);
                    const weightedSum = scored.reduce((s, a) => s + (parseFloat(a.score) / parseFloat(a.maxScore)) * 10 * parseFloat(a.weight || '1'), 0);
                    bimData.average = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
                }
            }
        }
        const subjectsResult = Object.entries(subjectMap).map(([id, data]) => ({
            subjectId: Number(id),
            subjectName: data.subjectName,
            bimesters: data.bimesters,
        }));
        // Média geral
        const allAverages = subjectsResult.flatMap(s => Object.values(s.bimesters).map(b => b.average)).filter(a => a > 0);
        const generalAverage = allAverages.length > 0 ? Math.round((allAverages.reduce((s, a) => s + a, 0) / allAverages.length) * 100) / 100 : 0;
        return { subjects: subjectsResult, summary: { average: generalAverage, totalAssessments: classAssessments.length } };
    }),
    // 2. Frequência do aluno
    studentAttendance: trpc_1.protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number(), classId: zod_1.z.number().optional() }))
        .query(async ({ ctx, input }) => {
        if (!await (0, helpers_1.verifyGuardianAccess)(ctx.userId, input.studentId))
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.dailyAttendance.studentId, input.studentId)];
        if (input.classId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.dailyAttendance.classId, input.classId));
        const records = await index_1.db.select().from(schema_1.dailyAttendance).where((0, drizzle_orm_1.and)(...conditions));
        const totalDays = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const justified = records.filter(r => r.status === 'justified').length;
        const late = records.filter(r => r.status === 'late').length;
        const percentPresent = totalDays > 0 ? Math.round(((present + late + justified) / totalDays) * 10000) / 100 : 0;
        // Breakdown mensal
        const monthlyMap = {};
        for (const r of records) {
            const month = r.date ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}` : 'unknown';
            if (!monthlyMap[month])
                monthlyMap[month] = { present: 0, absent: 0, justified: 0, late: 0, total: 0 };
            monthlyMap[month].total++;
            if (r.status === 'present')
                monthlyMap[month].present++;
            else if (r.status === 'absent')
                monthlyMap[month].absent++;
            else if (r.status === 'justified')
                monthlyMap[month].justified++;
            else if (r.status === 'late')
                monthlyMap[month].late++;
        }
        const monthly = Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));
        return { totalDays, present, absent, justified, late, percentPresent, monthly };
    }),
    // 3. Parecer descritivo
    studentParecer: trpc_1.protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        if (!await (0, helpers_1.verifyGuardianAccess)(ctx.userId, input.studentId))
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        const reports = await index_1.db.select({
            id: schema_1.descriptiveReports.id,
            bimester: schema_1.descriptiveReports.bimester,
            content: schema_1.descriptiveReports.content,
            classId: schema_1.descriptiveReports.classId,
            createdAt: schema_1.descriptiveReports.createdAt,
        }).from(schema_1.descriptiveReports)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.descriptiveReports.studentId, input.studentId), (0, drizzle_orm_1.eq)(schema_1.descriptiveReports.status, 'published'), (0, drizzle_orm_1.eq)(schema_1.descriptiveReports.isActive, true)))
            .orderBy(schema_1.descriptiveReports.bimester);
        // Enriquecer com nome da turma
        const result = await Promise.all(reports.map(async (r) => {
            const [cls] = await index_1.db.select({ name: schema_1.classes.name }).from(schema_1.classes).where((0, drizzle_orm_1.eq)(schema_1.classes.id, r.classId)).limit(1);
            return { ...r, className: cls?.name || '' };
        }));
        return result;
    }),
    // 4. Ocorrências do aluno
    studentOccurrences: trpc_1.protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        if (!await (0, helpers_1.verifyGuardianAccess)(ctx.userId, input.studentId))
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        const occurrences = await index_1.db.select().from(schema_1.studentOccurrences)
            .where((0, drizzle_orm_1.eq)(schema_1.studentOccurrences.studentId, input.studentId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.studentOccurrences.date));
        return occurrences;
    }),
    // 5. Calendário escolar
    schoolCalendar: trpc_1.protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        if (!await (0, helpers_1.verifyGuardianAccess)(ctx.userId, input.studentId))
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        // Buscar escola e município do aluno
        const [student] = await index_1.db.select({ schoolId: schema_1.students.schoolId, municipalityId: schema_1.students.municipalityId })
            .from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId)).limit(1);
        if (!student)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        const events = await index_1.db.select().from(schema_1.schoolCalendar)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schoolCalendar.municipalityId, student.municipalityId), (0, drizzle_orm_1.eq)(schema_1.schoolCalendar.isActive, true), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.schoolCalendar.schoolId, student.schoolId), (0, drizzle_orm_1.sql) `${schema_1.schoolCalendar.schoolId} IS NULL`)))
            .orderBy(schema_1.schoolCalendar.startDate);
        return events;
    }),
    // 6. Cardápio da merenda
    schoolMenu: trpc_1.protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        if (!await (0, helpers_1.verifyGuardianAccess)(ctx.userId, input.studentId))
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        const [student] = await index_1.db.select({ municipalityId: schema_1.students.municipalityId, schoolId: schema_1.students.schoolId })
            .from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId)).limit(1);
        if (!student)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        const menus = await index_1.db.select().from(schema_1.mealMenus)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.mealMenus.municipalityId, student.municipalityId), (0, drizzle_orm_1.eq)(schema_1.mealMenus.isActive, true), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.mealMenus.schoolId, student.schoolId), (0, drizzle_orm_1.sql) `${schema_1.mealMenus.schoolId} IS NULL`)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.mealMenus.date))
            .limit(30);
        return menus;
    }),
    // 7. Mensagens para o responsável
    myMessages: trpc_1.protectedProcedure
        .query(async ({ ctx }) => {
        // Buscar todos os alunos vinculados a este responsável
        const guardianLinks = await index_1.db.select({
            studentId: schema_1.guardians.studentId,
        }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.userId, ctx.userId));
        if (guardianLinks.length === 0)
            return [];
        const studentIds = guardianLinks.map(g => g.studentId);
        // Buscar dados dos alunos (escola, município)
        const studentList = await index_1.db.select({
            id: schema_1.students.id, schoolId: schema_1.students.schoolId, municipalityId: schema_1.students.municipalityId,
        }).from(schema_1.students).where((0, drizzle_orm_1.inArray)(schema_1.students.id, studentIds));
        if (studentList.length === 0)
            return [];
        const municipalityIds = [...new Set(studentList.map(s => s.municipalityId))];
        const schoolIds = [...new Set(studentList.map(s => s.schoolId))];
        // Buscar matrículas ativas para saber as turmas
        const activeEnrollments = await index_1.db.select({
            studentId: schema_1.enrollments.studentId, classId: schema_1.enrollments.classId,
        }).from(schema_1.enrollments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.enrollments.studentId, studentIds), (0, drizzle_orm_1.eq)(schema_1.enrollments.status, 'active')));
        const classIds = [...new Set(activeEnrollments.map(e => e.classId))];
        // Buscar mensagens que se aplicam
        const allMessages = await index_1.db.select().from(schema_1.messages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.messages.municipalityId, municipalityIds), (0, drizzle_orm_1.eq)(schema_1.messages.isActive, true), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.messages.targetType, 'all'), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.targetType, 'student'), (0, drizzle_orm_1.inArray)(schema_1.messages.targetStudentId, studentIds)), ...(schoolIds.length > 0 ? [(0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.targetType, 'school'), (0, drizzle_orm_1.inArray)(schema_1.messages.schoolId, schoolIds))] : []), ...(classIds.length > 0 ? [(0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.messages.targetType, 'class'), (0, drizzle_orm_1.inArray)(schema_1.messages.targetClassId, classIds))] : []))))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.messages.createdAt))
            .limit(50);
        // Enriquecer com nome do remetente
        const result = await Promise.all(allMessages.map(async (msg) => {
            const [sender] = await index_1.db.select({ name: schema_1.users.name }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, msg.senderUserId)).limit(1);
            return { ...msg, senderName: sender?.name || 'Sistema' };
        }));
        return result;
    }),
    // 8. Informações de matrícula do aluno
    studentEnrollmentInfo: trpc_1.protectedProcedure
        .input(zod_1.z.object({ studentId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        if (!await (0, helpers_1.verifyGuardianAccess)(ctx.userId, input.studentId))
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });
        // Buscar matrícula ativa mais recente
        const enrollmentList = await index_1.db.select({
            enrollmentId: schema_1.enrollments.id,
            classId: schema_1.enrollments.classId,
            academicYearId: schema_1.enrollments.academicYearId,
            enrollmentDate: schema_1.enrollments.enrollmentDate,
            status: schema_1.enrollments.status,
        }).from(schema_1.enrollments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, input.studentId), (0, drizzle_orm_1.eq)(schema_1.enrollments.status, 'active')))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.enrollments.enrollmentDate))
            .limit(1);
        if (enrollmentList.length === 0)
            return null;
        const enrollment = enrollmentList[0];
        // Buscar nome da turma
        const [cls] = await index_1.db.select({ name: schema_1.classes.name, schoolId: schema_1.classes.schoolId }).from(schema_1.classes)
            .where((0, drizzle_orm_1.eq)(schema_1.classes.id, enrollment.classId)).limit(1);
        // Buscar nome da escola
        const [school] = cls ? await index_1.db.select({ name: schema_1.schools.name }).from(schema_1.schools)
            .where((0, drizzle_orm_1.eq)(schema_1.schools.id, cls.schoolId)).limit(1) : [null];
        // Buscar ano letivo
        const [year] = await index_1.db.select({ year: schema_1.academicYears.year, name: schema_1.academicYears.name }).from(schema_1.academicYears)
            .where((0, drizzle_orm_1.eq)(schema_1.academicYears.id, enrollment.academicYearId)).limit(1);
        return {
            enrollmentId: enrollment.enrollmentId,
            classId: enrollment.classId,
            className: cls?.name || '',
            academicYear: year?.year || 0,
            academicYearName: year?.name || '',
            schoolName: school?.name || '',
            enrollmentDate: enrollment.enrollmentDate,
            status: enrollment.status,
        };
    }),
});
// Helper: verificar se responsável tem acesso ao aluno
// verifyGuardianAccess imported from ./helpers
// ============================================
// MONITORS ROUTER (APP MONITORES)
// ============================================
exports.monitorsRouter = trpc_1.t.router({
    // Obter viagem ativa do monitor/motorista
    myActiveTrip: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        // Buscar se é motorista
        const [driver] = await index_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.userId, ctx.userId)).limit(1);
        if (!driver)
            return null;
        // Buscar TODAS as viagens ativas deste motorista (pode haver mais de uma presa)
        const allActive = await index_1.db.select().from(schema_1.trips)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.trips.driverId, driver.id), (0, drizzle_orm_1.eq)(schema_1.trips.status, 'started')));
        // Se não há viagens ativas, retornar null
        if (allActive.length === 0)
            return null;
        // Se há mais de uma, finalizar as extras (manter só a mais recente)
        if (allActive.length > 1) {
            const sorted = allActive.sort((a, b) => (b.id || 0) - (a.id || 0));
            for (let i = 1; i < sorted.length; i++) {
                await index_1.db.update(schema_1.trips).set({ status: 'completed', completedAt: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.trips.id, sorted[i].id));
            }
        }
        const activeTrip = allActive.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
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
    availableTrips: trpc_1.protectedProcedure.query(async ({ ctx }) => {
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
    boardStudent: trpc_1.staffProcedure
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
    dropStudent: trpc_1.staffProcedure
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
    markAbsent: trpc_1.staffProcedure
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
        // Notificar responsáveis
        const [student] = await index_1.db.select({ name: schema_1.students.name }).from(schema_1.students).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId)).limit(1);
        const guardianList = await index_1.db.select({ userId: schema_1.guardians.userId }).from(schema_1.guardians).where((0, drizzle_orm_1.eq)(schema_1.guardians.studentId, input.studentId));
        for (const g of guardianList) {
            await index_1.db.insert(schema_1.notifications).values({
                userId: g.userId,
                title: 'Aluno ausente',
                body: (student?.name || 'Seu filho(a)') + ' foi registrado como ausente no transporte escolar.',
                type: 'student_absent',
                tripId: input.tripId,
                stopId: input.stopId,
                studentId: input.studentId,
            });
        }
        // Emitir evento de ausência via Socket.IO
        const [tripAbsent] = await index_1.db.select({ routeId: schema_1.trips.routeId }).from(schema_1.trips).where((0, drizzle_orm_1.eq)(schema_1.trips.id, input.tripId)).limit(1);
        if (tripAbsent) {
            const [routeAbsent] = await index_1.db.select({ municipalityId: schema_1.routes.municipalityId }).from(schema_1.routes).where((0, drizzle_orm_1.eq)(schema_1.routes.id, tripAbsent.routeId)).limit(1);
            if (routeAbsent) {
                (0, socketInstance_1.emitToMunicipality)(routeAbsent.municipalityId, 'student:absent', {
                    tripId: input.tripId,
                    stopId: input.stopId,
                    studentId: input.studentId,
                    studentName: student?.name,
                    municipalityId: routeAbsent.municipalityId,
                    time: new Date().toISOString(),
                });
            }
        }
        return { success: true, studentName: student?.name };
    }),
    // Obter resumo da viagem para o monitor
    tripSummary: trpc_1.protectedProcedure
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
exports.monitorStaffRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.monitorStaff)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.monitorStaff.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.monitorStaff.isActive, true)))
            .orderBy(schema_1.monitorStaff.name);
    }),
    create: trpc_1.adminProcedure
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
        (0, trpc_1.validateOptionalCPF)(input.cpf);
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
    update: trpc_1.adminProcedure
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
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.monitorStaff).where((0, drizzle_orm_1.eq)(schema_1.monitorStaff.id, input.id));
        return { success: true };
    }),
});
// ============================================
// CONTRACTS ROUTER
// ============================================
exports.contractsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.contracts)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contracts.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.contracts.isActive, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.contracts.createdAt));
    }),
    create: trpc_1.adminProcedure
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
        (0, trpc_1.validateOptionalCNPJ)(input.cnpj);
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
    update: trpc_1.adminProcedure
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
        (0, trpc_1.validateOptionalCNPJ)(input.cnpj);
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
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.contracts).where((0, drizzle_orm_1.eq)(schema_1.contracts.id, input.id));
        return { success: true };
    }),
});
// ============================================
// MAINTENANCE RECORDS ROUTER
// ============================================
exports.maintenanceRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
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
    create: trpc_1.adminProcedure
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
    update: trpc_1.adminProcedure
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
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.maintenanceRecords).where((0, drizzle_orm_1.eq)(schema_1.maintenanceRecords.id, input.id));
        return { success: true };
    }),
});
// ============================================
// ROUTER: LOCATION (GPS TRACKING)
// ============================================
const locationRouter = trpc_1.t.router({
    getActiveVehicles: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        // Get all active trips filtered by municipality
        const activeTrips = await index_1.db.select({
            tripId: schema_1.trips.id,
            routeId: schema_1.trips.routeId,
            vehicleId: schema_1.trips.vehicleId,
            driverId: schema_1.trips.driverId,
            status: schema_1.trips.status,
        }).from(schema_1.trips)
            .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.trips.routeId, schema_1.routes.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.trips.status, 'started'), (0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId)));
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
            // Fallback: use driver's current position if no location history
            let lat = latestLoc?.latitude || null;
            let lng = latestLoc?.longitude || null;
            let spd = latestLoc?.speed ? parseFloat(latestLoc.speed) : null;
            if (!lat && driver) {
                const [driverPos] = await index_1.db.select({ lat: schema_1.drivers.currentLatitude, lng: schema_1.drivers.currentLongitude })
                    .from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, driver.id)).limit(1);
                if (driverPos?.lat) {
                    lat = driverPos.lat;
                    lng = driverPos.lng;
                }
            }
            // Also get first stop of the route as fallback position
            if (!lat) {
                const [firstStop] = await index_1.db.select({ lat: schema_1.stops.latitude, lng: schema_1.stops.longitude })
                    .from(schema_1.stops).where((0, drizzle_orm_1.eq)(schema_1.stops.routeId, trip.routeId)).orderBy(schema_1.stops.orderIndex).limit(1);
                if (firstStop?.lat) {
                    lat = firstStop.lat;
                    lng = firstStop.lng;
                }
            }
            result.push({
                tripId: trip.tripId,
                routeId: trip.routeId,
                vehicleId: trip.vehicleId,
                driverId: trip.driverId,
                plate: vehicle?.plate || 'N/A',
                model: vehicle?.model || '',
                driverName,
                routeName: route?.name || 'N/A',
                latitude: lat,
                longitude: lng,
                speed: spd,
                heading: latestLoc?.heading || null,
                updatedAt: latestLoc?.recordedAt || null,
                hasGPS: !!latestLoc,
            });
        }
        return result;
    }),
    getVehiclePosition: trpc_1.protectedProcedure
        .input(zod_1.z.object({ tripId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [loc] = await index_1.db.select()
            .from(schema_1.locationHistory)
            .where((0, drizzle_orm_1.eq)(schema_1.locationHistory.tripId, input.tripId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.locationHistory.recordedAt))
            .limit(1);
        return loc || null;
    }),
    getHistory: trpc_1.protectedProcedure
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
// ACADEMIC ROUTER (MÓDULO ACADÊMICO)
// ============================================
// Anos Letivos
exports.academicYearsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.academicYears)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.academicYears.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.academicYears.isActive, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.academicYears.year));
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        year: zod_1.z.number(),
        name: zod_1.z.string().min(3),
        startDate: zod_1.z.string(),
        endDate: zod_1.z.string(),
        status: zod_1.z.enum(['planning', 'active', 'finished']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { startDate, endDate, ...rest } = input;
        const [result] = await index_1.db.insert(schema_1.academicYears).values({
            ...rest,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        }).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        year: zod_1.z.number().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        status: zod_1.z.enum(['planning', 'active', 'finished']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, startDate, endDate, ...data } = input;
        const ud = { ...data };
        if (startDate)
            ud.startDate = new Date(startDate);
        if (endDate)
            ud.endDate = new Date(endDate);
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.academicYears).set(ud).where((0, drizzle_orm_1.eq)(schema_1.academicYears.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasClasses] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.academicYearId, input.id), (0, drizzle_orm_1.eq)(schema_1.classes.isActive, true)));
        const [hasEnrollments] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.enrollments).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.academicYearId, input.id), (0, drizzle_orm_1.eq)(schema_1.enrollments.isActive, true)));
        const deps = [];
        if (Number(hasClasses.c) > 0)
            deps.push(`${hasClasses.c} turma(s)`);
        if (Number(hasEnrollments.c) > 0)
            deps.push(`${hasEnrollments.c} matrícula(s)`);
        if (deps.length > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Ano letivo possui: ${deps.join(', ')}` });
        await index_1.db.update(schema_1.academicYears).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.academicYears.id, input.id));
        return { success: true };
    }),
});
// Séries / Etapas
exports.classGradesRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.classGrades)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classGrades.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.classGrades.isActive, true)))
            .orderBy(schema_1.classGrades.orderIndex);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string().min(2),
        level: zod_1.z.enum(['creche', 'pre_escola', 'fundamental_1', 'fundamental_2', 'medio', 'eja', 'tecnico']),
        orderIndex: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        if (!input.orderIndex) {
            const [last] = await index_1.db.select({ max: (0, drizzle_orm_1.sql) `COALESCE(MAX(orderIndex), 0)` }).from(schema_1.classGrades).where((0, drizzle_orm_1.eq)(schema_1.classGrades.municipalityId, input.municipalityId));
            input.orderIndex = (last?.max || 0) + 1;
        }
        const [result] = await index_1.db.insert(schema_1.classGrades).values(input).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        level: zod_1.z.enum(['creche', 'pre_escola', 'fundamental_1', 'fundamental_2', 'medio', 'eja', 'tecnico']).optional(),
        orderIndex: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const ud = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            ud[k] = v; });
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.classGrades).set(ud).where((0, drizzle_orm_1.eq)(schema_1.classGrades.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasClasses] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.classGradeId, input.id), (0, drizzle_orm_1.eq)(schema_1.classes.isActive, true)));
        if (Number(hasClasses.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Série vinculada a ${hasClasses.c} turma(s)` });
        await index_1.db.update(schema_1.classGrades).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.classGrades.id, input.id));
        return { success: true };
    }),
});
// Disciplinas
exports.subjectsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.subjects)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.subjects.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.subjects.isActive, true)))
            .orderBy(schema_1.subjects.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string().min(2),
        code: zod_1.z.string().optional(),
        category: zod_1.z.enum(['base_nacional', 'parte_diversificada', 'eletiva']).optional(),
        workloadHours: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const [result] = await index_1.db.insert(schema_1.subjects).values(input).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        code: zod_1.z.string().optional(),
        category: zod_1.z.enum(['base_nacional', 'parte_diversificada', 'eletiva']).optional(),
        workloadHours: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const ud = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            ud[k] = v; });
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.subjects).set(ud).where((0, drizzle_orm_1.eq)(schema_1.subjects.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasAssigned] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.classSubjects).where((0, drizzle_orm_1.eq)(schema_1.classSubjects.subjectId, input.id));
        if (Number(hasAssigned.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Disciplina vinculada a ${hasAssigned.c} turma(s)` });
        await index_1.db.update(schema_1.subjects).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.subjects.id, input.id));
        return { success: true };
    }),
});
// Turmas
exports.classesRouter = trpc_1.t.router({
    list: trpc_1.academicProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), academicYearId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.classes.municipalityId, input.municipalityId),
            (0, drizzle_orm_1.eq)(schema_1.classes.isActive, true),
            ...(input.schoolId ? [(0, drizzle_orm_1.eq)(schema_1.classes.schoolId, input.schoolId)] : []),
            ...(input.academicYearId ? [(0, drizzle_orm_1.eq)(schema_1.classes.academicYearId, input.academicYearId)] : []),
        ];
        const result = await index_1.db.select({
            id: schema_1.classes.id,
            municipalityId: schema_1.classes.municipalityId,
            schoolId: schema_1.classes.schoolId,
            academicYearId: schema_1.classes.academicYearId,
            classGradeId: schema_1.classes.classGradeId,
            name: schema_1.classes.name,
            fullName: schema_1.classes.fullName,
            shift: schema_1.classes.shift,
            maxStudents: schema_1.classes.maxStudents,
            roomNumber: schema_1.classes.roomNumber,
            teacherUserId: schema_1.classes.teacherUserId,
            schoolName: schema_1.schools.name,
            gradeName: schema_1.classGrades.name,
            gradeLevel: schema_1.classGrades.level,
        })
            .from(schema_1.classes)
            .leftJoin(schema_1.schools, (0, drizzle_orm_1.eq)(schema_1.classes.schoolId, schema_1.schools.id))
            .leftJoin(schema_1.classGrades, (0, drizzle_orm_1.eq)(schema_1.classes.classGradeId, schema_1.classGrades.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy(schema_1.classes.name);
        // Count enrollments per class
        const enriched = await Promise.all(result.map(async (c) => {
            const [count] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.enrollments)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.classId, c.id), (0, drizzle_orm_1.eq)(schema_1.enrollments.status, 'active')));
            return { ...c, enrolledStudents: count?.count || 0 };
        }));
        return enriched;
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        schoolId: zod_1.z.number(),
        academicYearId: zod_1.z.number(),
        classGradeId: zod_1.z.number(),
        name: zod_1.z.string().min(1),
        fullName: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening', 'full_time']).optional(),
        maxStudents: zod_1.z.number().optional(),
        roomNumber: zod_1.z.string().optional(),
        teacherUserId: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        // Generate fullName if not provided
        if (!input.fullName) {
            const [grade] = await index_1.db.select({ name: schema_1.classGrades.name }).from(schema_1.classGrades).where((0, drizzle_orm_1.eq)(schema_1.classGrades.id, input.classGradeId)).limit(1);
            input.fullName = `${grade?.name || ''} ${input.name}`.trim();
        }
        const [result] = await index_1.db.insert(schema_1.classes).values(input).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        fullName: zod_1.z.string().optional(),
        shift: zod_1.z.enum(['morning', 'afternoon', 'evening', 'full_time']).optional(),
        maxStudents: zod_1.z.number().optional(),
        roomNumber: zod_1.z.string().optional(),
        teacherUserId: zod_1.z.number().nullable().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const ud = {};
        Object.entries(data).forEach(([k, v]) => {
            if (v !== undefined)
                ud[k] = v;
            if (k === 'teacherUserId' && v === null)
                ud[k] = null;
        });
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.classes).set(ud).where((0, drizzle_orm_1.eq)(schema_1.classes.id, id));
        // Sincronizar todos os alunos matriculados nesta turma
        const [cls] = await index_1.db.select({
            name: schema_1.classes.name, fullName: schema_1.classes.fullName,
            shift: schema_1.classes.shift, schoolId: schema_1.classes.schoolId,
            gradeId: schema_1.classes.classGradeId,
        }).from(schema_1.classes).where((0, drizzle_orm_1.eq)(schema_1.classes.id, id)).limit(1);
        if (cls) {
            let gradeName = '';
            if (cls.gradeId) {
                const [cg] = await index_1.db.select({ name: schema_1.classGrades.name }).from(schema_1.classGrades).where((0, drizzle_orm_1.eq)(schema_1.classGrades.id, cls.gradeId)).limit(1);
                if (cg)
                    gradeName = cg.name;
            }
            const su = {};
            if (cls.name)
                su.classRoom = cls.name;
            if (gradeName)
                su.grade = gradeName;
            if (cls.shift)
                su.shift = cls.shift;
            if (cls.schoolId)
                su.schoolId = cls.schoolId;
            if (Object.keys(su).length > 0) {
                // Buscar todos os alunos matriculados nesta turma
                const activeEnrollments = await index_1.db.select({ studentId: schema_1.enrollments.studentId })
                    .from(schema_1.enrollments)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.classId, id), (0, drizzle_orm_1.eq)(schema_1.enrollments.isActive, true)));
                for (const e of activeEnrollments) {
                    await index_1.db.update(schema_1.students).set(su).where((0, drizzle_orm_1.eq)(schema_1.students.id, e.studentId));
                }
            }
        }
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasEnrollments] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.enrollments).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.classId, input.id), (0, drizzle_orm_1.eq)(schema_1.enrollments.isActive, true)));
        if (Number(hasEnrollments.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Turma possui ${hasEnrollments.c} matrícula(s) ativa(s)` });
        await index_1.db.update(schema_1.classes).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.classes.id, input.id));
        return { success: true };
    }),
});
// Matrículas
exports.enrollmentsRouter = trpc_1.t.router({
    list: trpc_1.academicProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), classId: zod_1.z.number().optional(), studentId: zod_1.z.number().optional(), academicYearId: zod_1.z.number().optional(), status: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [
            (0, drizzle_orm_1.eq)(schema_1.enrollments.municipalityId, input.municipalityId),
            (0, drizzle_orm_1.eq)(schema_1.enrollments.isActive, true),
            ...(input.classId ? [(0, drizzle_orm_1.eq)(schema_1.enrollments.classId, input.classId)] : []),
            ...(input.studentId ? [(0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, input.studentId)] : []),
            ...(input.academicYearId ? [(0, drizzle_orm_1.eq)(schema_1.enrollments.academicYearId, input.academicYearId)] : []),
            ...(input.status ? [(0, drizzle_orm_1.eq)(schema_1.enrollments.status, input.status)] : []),
        ];
        return index_1.db.select({
            id: schema_1.enrollments.id,
            studentId: schema_1.enrollments.studentId,
            classId: schema_1.enrollments.classId,
            academicYearId: schema_1.enrollments.academicYearId,
            enrollmentNumber: schema_1.enrollments.enrollmentNumber,
            enrollmentDate: schema_1.enrollments.enrollmentDate,
            status: schema_1.enrollments.status,
            statusNotes: schema_1.enrollments.statusNotes,
            studentName: schema_1.students.name,
            studentEnrollment: schema_1.students.enrollment,
            studentGrade: schema_1.students.grade,
            birthDate: schema_1.students.birthDate,
            // Dados da turma
            className: schema_1.classes.name,
            classFullName: schema_1.classes.fullName,
            classShift: schema_1.classes.shift,
            schoolId: schema_1.classes.schoolId,
        })
            .from(schema_1.enrollments)
            .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, schema_1.students.id))
            .leftJoin(schema_1.classes, (0, drizzle_orm_1.eq)(schema_1.enrollments.classId, schema_1.classes.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy(schema_1.students.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        studentId: zod_1.z.number(),
        classId: zod_1.z.number(),
        academicYearId: zod_1.z.number(),
        enrollmentNumber: zod_1.z.string().optional(),
        enrollmentDate: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        // Check if student already enrolled in this academic year
        const existing = await index_1.db.select().from(schema_1.enrollments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, input.studentId), (0, drizzle_orm_1.eq)(schema_1.enrollments.academicYearId, input.academicYearId), (0, drizzle_orm_1.eq)(schema_1.enrollments.status, 'active')))
            .limit(1);
        if (existing.length > 0) {
            throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Aluno já matriculado neste ano letivo.' });
        }
        const { enrollmentDate, ...rest } = input;
        const [result] = await index_1.db.insert(schema_1.enrollments).values({
            ...rest,
            enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
        }).$returningId();
        // Sync student record with class data
        const [cls] = await index_1.db.select({
            name: schema_1.classes.name, fullName: schema_1.classes.fullName,
            shift: schema_1.classes.shift, schoolId: schema_1.classes.schoolId,
            gradeId: schema_1.classes.classGradeId,
        }).from(schema_1.classes).where((0, drizzle_orm_1.eq)(schema_1.classes.id, input.classId)).limit(1);
        if (cls) {
            let gradeName = '';
            if (cls.gradeId) {
                const [cg] = await index_1.db.select({ name: schema_1.classGrades.name }).from(schema_1.classGrades).where((0, drizzle_orm_1.eq)(schema_1.classGrades.id, cls.gradeId)).limit(1);
                if (cg)
                    gradeName = cg.name;
            }
            const su = {};
            if (cls.name)
                su.classRoom = cls.name;
            if (gradeName)
                su.grade = gradeName;
            if (cls.shift)
                su.shift = cls.shift;
            if (cls.schoolId)
                su.schoolId = cls.schoolId;
            su.studentStatus = 'ativo';
            if (Object.keys(su).length > 0) {
                await index_1.db.update(schema_1.students).set(su).where((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId));
            }
        }
        return { success: true, id: result.id };
    }),
    bulkCreate: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        classId: zod_1.z.number(),
        academicYearId: zod_1.z.number(),
        studentIds: zod_1.z.array(zod_1.z.number()),
    }))
        .mutation(async ({ input }) => {
        let created = 0;
        let skipped = 0;
        const createdStudentIds = [];
        for (const studentId of input.studentIds) {
            const existing = await index_1.db.select().from(schema_1.enrollments)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, studentId), (0, drizzle_orm_1.eq)(schema_1.enrollments.academicYearId, input.academicYearId), (0, drizzle_orm_1.eq)(schema_1.enrollments.status, 'active')))
                .limit(1);
            if (existing.length > 0) {
                skipped++;
                continue;
            }
            await index_1.db.insert(schema_1.enrollments).values({
                municipalityId: input.municipalityId,
                studentId,
                classId: input.classId,
                academicYearId: input.academicYearId,
            });
            created++;
            createdStudentIds.push(studentId);
        }
        // Sincronizar: atualizar grade, classRoom e shift APENAS nos alunos realmente matriculados
        if (created > 0) {
            try {
                const [cls] = await index_1.db.select({
                    name: schema_1.classes.name, fullName: schema_1.classes.fullName, shift: schema_1.classes.shift, schoolId: schema_1.classes.schoolId, gradeId: schema_1.classes.classGradeId,
                }).from(schema_1.classes).where((0, drizzle_orm_1.eq)(schema_1.classes.id, input.classId)).limit(1);
                if (cls) {
                    let gradeName = '';
                    if (cls.gradeId) {
                        const [cg] = await index_1.db.select({ name: schema_1.classGrades.name }).from(schema_1.classGrades).where((0, drizzle_orm_1.eq)(schema_1.classGrades.id, cls.gradeId)).limit(1);
                        if (cg)
                            gradeName = cg.name;
                    }
                    const su = {};
                    if (cls.name)
                        su.classRoom = cls.name;
                    if (gradeName)
                        su.grade = gradeName;
                    if (cls.shift)
                        su.shift = cls.shift;
                    if (cls.schoolId)
                        su.schoolId = cls.schoolId;
                    su.studentStatus = 'ativo';
                    if (Object.keys(su).length > 0) {
                        for (const sid of createdStudentIds) {
                            try {
                                await index_1.db.update(schema_1.students).set(su).where((0, drizzle_orm_1.eq)(schema_1.students.id, sid));
                            }
                            catch { /* skip */ }
                        }
                    }
                }
            }
            catch { /* sync best effort */ }
        }
        return { success: true, created, skipped };
    }),
    // Alterar turma da matrícula + sincronizar com aluno
    updateClass: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        classId: zod_1.z.number(),
    }))
        .mutation(async ({ input }) => {
        // Buscar enrollment atual
        const [enr] = await index_1.db.select().from(schema_1.enrollments).where((0, drizzle_orm_1.eq)(schema_1.enrollments.id, input.id)).limit(1);
        if (!enr)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });
        // Atualizar enrollment
        await index_1.db.update(schema_1.enrollments).set({ classId: input.classId }).where((0, drizzle_orm_1.eq)(schema_1.enrollments.id, input.id));
        // Buscar dados da nova turma para sincronizar com aluno
        const [cls] = await index_1.db.select({
            name: schema_1.classes.name,
            fullName: schema_1.classes.fullName,
            shift: schema_1.classes.shift,
            schoolId: schema_1.classes.schoolId,
            gradeId: schema_1.classes.classGradeId,
        }).from(schema_1.classes).where((0, drizzle_orm_1.eq)(schema_1.classes.id, input.classId)).limit(1);
        if (cls) {
            // Buscar nome da série
            let gradeName = '';
            if (cls.gradeId) {
                const [cg] = await index_1.db.select({ name: schema_1.classGrades.name }).from(schema_1.classGrades).where((0, drizzle_orm_1.eq)(schema_1.classGrades.id, cls.gradeId)).limit(1);
                if (cg)
                    gradeName = cg.name;
            }
            // Sincronizar: atualizar grade, classRoom, shift e schoolId no aluno
            const studentUpdate = {};
            if (cls.name)
                studentUpdate.classRoom = cls.name;
            if (gradeName)
                studentUpdate.grade = gradeName;
            if (cls.shift)
                studentUpdate.shift = cls.shift;
            if (cls.schoolId)
                studentUpdate.schoolId = cls.schoolId;
            if (Object.keys(studentUpdate).length > 0) {
                await index_1.db.update(schema_1.students).set(studentUpdate).where((0, drizzle_orm_1.eq)(schema_1.students.id, enr.studentId));
            }
        }
        return { success: true };
    }),
    updateStatus: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        status: zod_1.z.enum(['active', 'transferred', 'cancelled', 'graduated', 'retained', 'evaded']),
        statusNotes: zod_1.z.string().optional(),
        transferredToSchoolId: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Buscar a matrícula para saber o studentId
        const [enr] = await index_1.db.select({ studentId: schema_1.enrollments.studentId }).from(schema_1.enrollments).where((0, drizzle_orm_1.eq)(schema_1.enrollments.id, id)).limit(1);
        // Atualizar status da matrícula
        await index_1.db.update(schema_1.enrollments).set({
            ...data,
            statusChangedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(schema_1.enrollments.id, id));
        // Sincronizar: atualizar studentStatus no cadastro do aluno
        if (enr) {
            const statusMap = {
                active: 'ativo', transferred: 'transferido', cancelled: 'cancelado',
                graduated: 'aprovado', retained: 'retido', evaded: 'evadido',
            };
            const studentStatus = statusMap[input.status] || input.status;
            await index_1.db.update(schema_1.students).set({ studentStatus }).where((0, drizzle_orm_1.eq)(schema_1.students.id, enr.studentId));
            // Se aluno foi transferido, cancelado ou evadido: limpar vínculos com paradas e campos acadêmicos
            if (['transferred', 'cancelled', 'evaded'].includes(input.status)) {
                await index_1.db.delete(schema_1.stopStudents).where((0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, enr.studentId));
                // Also clear academic fields
                await index_1.db.update(schema_1.students).set({
                    grade: null, classRoom: null
                }).where((0, drizzle_orm_1.eq)(schema_1.students.id, enr.studentId));
            }
        }
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        // Fetch student before soft-deleting
        const [enr] = await index_1.db.select({ studentId: schema_1.enrollments.studentId }).from(schema_1.enrollments).where((0, drizzle_orm_1.eq)(schema_1.enrollments.id, input.id)).limit(1);
        await index_1.db.update(schema_1.enrollments).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.enrollments.id, input.id));
        // Check if student has other active enrollments
        if (enr) {
            const otherActive = await index_1.db.select({ id: schema_1.enrollments.id }).from(schema_1.enrollments)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.studentId, enr.studentId), (0, drizzle_orm_1.eq)(schema_1.enrollments.isActive, true), (0, drizzle_orm_1.sql) `${schema_1.enrollments.id} != ${input.id}`))
                .limit(1);
            if (otherActive.length === 0) {
                // No other active enrollment - clear student fields
                await index_1.db.update(schema_1.students).set({
                    grade: null, classRoom: null, studentStatus: 'sem_matricula'
                }).where((0, drizzle_orm_1.eq)(schema_1.students.id, enr.studentId));
            }
        }
        return { success: true };
    }),
});
// Professores
exports.teachersRouter = trpc_1.t.router({
    list: trpc_1.academicProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select({
            teacher: schema_1.teachers,
            user: { id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email, phone: schema_1.users.phone, cpf: schema_1.users.cpf },
        })
            .from(schema_1.teachers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.teachers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teachers.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.teachers.isActive, true)));
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        name: zod_1.z.string().min(3),
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        cpf: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
        registrationNumber: zod_1.z.string().optional(),
        degree: zod_1.z.string().optional(),
        specialization: zod_1.z.string().optional(),
        hireDate: zod_1.z.string().optional(),
        contractType: zod_1.z.enum(['effective', 'temporary', 'substitute']).optional(),
        weeklyWorkload: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        (0, trpc_1.validateOptionalCPF)(input.cpf);
        const email = input.email || (input.name.toLowerCase().replace(/\s+/g, '.') + '@professor.netescol.local');
        const pwd = input.password || 'Prof@' + Math.floor(1000 + Math.random() * 9000);
        const passwordHash = await (0, bcryptjs_1.hash)(pwd, 12);
        try {
            const [user] = await index_1.db.insert(schema_1.users).values({
                municipalityId: input.municipalityId, email, passwordHash,
                name: input.name, phone: input.phone, cpf: input.cpf, role: 'teacher',
            }).$returningId();
            const [teacher] = await index_1.db.insert(schema_1.teachers).values({
                userId: user.id,
                municipalityId: input.municipalityId,
                registrationNumber: input.registrationNumber,
                degree: input.degree,
                specialization: input.specialization,
                hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
                contractType: input.contractType,
                weeklyWorkload: input.weeklyWorkload,
            }).$returningId();
            return { success: true, teacherId: teacher.id, userId: user.id, generatedPassword: input.password ? undefined : pwd };
        }
        catch (err) {
            if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
                if (err.message.includes('email'))
                    throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este e-mail já está cadastrado.' });
                if (err.message.includes('cpf'))
                    throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Este CPF já está cadastrado.' });
                throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Registro duplicado.' });
            }
            throw err;
        }
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        name: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        cpf: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        registrationNumber: zod_1.z.string().optional(),
        degree: zod_1.z.string().optional(),
        specialization: zod_1.z.string().optional(),
        hireDate: zod_1.z.string().optional(),
        contractType: zod_1.z.enum(['effective', 'temporary', 'substitute']).optional(),
        weeklyWorkload: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        (0, trpc_1.validateOptionalCPF)(input.cpf);
        const { id, name, phone, cpf, email, hireDate, ...teacherData } = input;
        const td = { ...teacherData };
        if (hireDate)
            td.hireDate = new Date(hireDate);
        Object.keys(td).forEach(k => td[k] === undefined && delete td[k]);
        if (Object.keys(td).length > 0)
            await index_1.db.update(schema_1.teachers).set(td).where((0, drizzle_orm_1.eq)(schema_1.teachers.id, id));
        // Update user data
        const [teacher] = await index_1.db.select({ userId: schema_1.teachers.userId }).from(schema_1.teachers).where((0, drizzle_orm_1.eq)(schema_1.teachers.id, id)).limit(1);
        if (teacher) {
            const userData = {};
            if (name)
                userData.name = name;
            if (phone)
                userData.phone = phone;
            if (cpf)
                userData.cpf = cpf;
            if (email)
                userData.email = email;
            if (Object.keys(userData).length > 0)
                await index_1.db.update(schema_1.users).set(userData).where((0, drizzle_orm_1.eq)(schema_1.users.id, teacher.userId));
        }
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [teacher] = await index_1.db.select().from(schema_1.teachers).where((0, drizzle_orm_1.eq)(schema_1.teachers.id, input.id)).limit(1);
        if (teacher) {
            await index_1.db.update(schema_1.teachers).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.teachers.id, input.id));
        }
        return { success: true };
    }),
});
// Disciplinas por Turma
exports.classSubjectsRouter = trpc_1.t.router({
    list: trpc_1.academicProcedure
        .input(zod_1.z.object({ classId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select({
            id: schema_1.classSubjects.id,
            classId: schema_1.classSubjects.classId,
            subjectId: schema_1.classSubjects.subjectId,
            teacherUserId: schema_1.classSubjects.teacherUserId,
            weeklyHours: schema_1.classSubjects.weeklyHours,
            subjectName: schema_1.subjects.name,
            subjectCode: schema_1.subjects.code,
            teacherName: schema_1.users.name,
        })
            .from(schema_1.classSubjects)
            .leftJoin(schema_1.subjects, (0, drizzle_orm_1.eq)(schema_1.classSubjects.subjectId, schema_1.subjects.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.classSubjects.teacherUserId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.classSubjects.classId, input.classId));
    }),
    assign: trpc_1.adminProcedure
        .input(zod_1.z.object({
        classId: zod_1.z.number(),
        subjectId: zod_1.z.number(),
        teacherUserId: zod_1.z.number().optional(),
        weeklyHours: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const existing = await index_1.db.select().from(schema_1.classSubjects)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classSubjects.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.classSubjects.subjectId, input.subjectId))).limit(1);
        if (existing.length > 0) {
            throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Disciplina já vinculada a esta turma.' });
        }
        const [result] = await index_1.db.insert(schema_1.classSubjects).values(input).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        teacherUserId: zod_1.z.number().optional(),
        weeklyHours: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const ud = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            ud[k] = v; });
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.classSubjects).set(ud).where((0, drizzle_orm_1.eq)(schema_1.classSubjects.id, id));
        return { success: true };
    }),
    remove: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.classSubjects).where((0, drizzle_orm_1.eq)(schema_1.classSubjects.id, input.id));
        return { success: true };
    }),
});
// ============================================
// DIARY ROUTER (DIÁRIO ESCOLAR)
// ============================================
exports.diaryAttendanceRouter = trpc_1.t.router({
    // Registrar frequência de uma turma inteira
    register: trpc_1.academicProcedure
        .input(zod_1.z.object({
        classId: zod_1.z.number(),
        subjectId: zod_1.z.number().optional(),
        date: zod_1.z.string(),
        records: zod_1.z.array(zod_1.z.object({
            studentId: zod_1.z.number(),
            status: zod_1.z.enum(['present', 'absent', 'justified', 'late']),
            notes: zod_1.z.string().optional(),
        })),
    }))
        .mutation(async ({ ctx, input }) => {
        const dateObj = new Date(input.date);
        // Delete existing records for this class/date/subject to allow re-registration
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.dailyAttendance.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.dailyAttendance.date, dateObj)];
        if (input.subjectId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.dailyAttendance.subjectId, input.subjectId));
        await index_1.db.delete(schema_1.dailyAttendance).where((0, drizzle_orm_1.and)(...conditions));
        for (const record of input.records) {
            await index_1.db.insert(schema_1.dailyAttendance).values({
                classId: input.classId,
                subjectId: input.subjectId,
                studentId: record.studentId,
                date: dateObj,
                status: record.status,
                notes: record.notes,
                registeredByUserId: ctx.userId,
            });
        }
        return { success: true, count: input.records.length };
    }),
    // Listar frequência por turma e data
    listByClassDate: trpc_1.academicProcedure
        .input(zod_1.z.object({ classId: zod_1.z.number(), date: zod_1.z.string(), subjectId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.dailyAttendance.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.dailyAttendance.date, new Date(input.date))];
        if (input.subjectId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.dailyAttendance.subjectId, input.subjectId));
        return index_1.db.select({
            id: schema_1.dailyAttendance.id,
            studentId: schema_1.dailyAttendance.studentId,
            status: schema_1.dailyAttendance.status,
            notes: schema_1.dailyAttendance.notes,
            studentName: schema_1.students.name,
        })
            .from(schema_1.dailyAttendance)
            .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.dailyAttendance.studentId, schema_1.students.id))
            .where((0, drizzle_orm_1.and)(...conditions));
    }),
    // Resumo de frequência por aluno em um período
    studentSummary: trpc_1.academicProcedure
        .input(zod_1.z.object({ classId: zod_1.z.number(), startDate: zod_1.z.string(), endDate: zod_1.z.string() }))
        .query(async ({ input }) => {
        const records = await index_1.db.select({
            studentId: schema_1.dailyAttendance.studentId,
            status: schema_1.dailyAttendance.status,
            studentName: schema_1.students.name,
        })
            .from(schema_1.dailyAttendance)
            .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.dailyAttendance.studentId, schema_1.students.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.dailyAttendance.classId, input.classId), (0, drizzle_orm_1.gte)(schema_1.dailyAttendance.date, new Date(input.startDate)), (0, drizzle_orm_1.lte)(schema_1.dailyAttendance.date, new Date(input.endDate))));
        const summary = {};
        records.forEach((r) => {
            if (!summary[r.studentId])
                summary[r.studentId] = { studentId: r.studentId, studentName: r.studentName, present: 0, absent: 0, justified: 0, late: 0, total: 0 };
            summary[r.studentId][r.status]++;
            summary[r.studentId].total++;
        });
        return Object.values(summary);
    }),
});
exports.assessmentsRouter = trpc_1.t.router({
    list: trpc_1.academicProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), classId: zod_1.z.number().optional(), subjectId: zod_1.z.number().optional(), bimester: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.assessments.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.assessments.isActive, true)];
        if (input.classId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.assessments.classId, input.classId));
        if (input.subjectId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.assessments.subjectId, input.subjectId));
        if (input.bimester)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.assessments.bimester, input.bimester));
        return index_1.db.select({
            id: schema_1.assessments.id, classId: schema_1.assessments.classId, subjectId: schema_1.assessments.subjectId,
            name: schema_1.assessments.name, type: schema_1.assessments.type, maxScore: schema_1.assessments.maxScore,
            weight: schema_1.assessments.weight, date: schema_1.assessments.date, bimester: schema_1.assessments.bimester,
            description: schema_1.assessments.description, subjectName: schema_1.subjects.name,
        })
            .from(schema_1.assessments)
            .leftJoin(schema_1.subjects, (0, drizzle_orm_1.eq)(schema_1.assessments.subjectId, schema_1.subjects.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.assessments.date));
    }),
    create: trpc_1.academicProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), classId: zod_1.z.number(), subjectId: zod_1.z.number(),
        name: zod_1.z.string().min(2), type: zod_1.z.enum(['prova', 'trabalho', 'seminario', 'participacao', 'recuperacao']).optional(),
        maxScore: zod_1.z.number().optional(), weight: zod_1.z.number().optional(),
        date: zod_1.z.string().optional(), bimester: zod_1.z.enum(['1', '2', '3', '4']),
        description: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { date, maxScore, weight, ...rest } = input;
        const [result] = await index_1.db.insert(schema_1.assessments).values({
            ...rest, date: date ? new Date(date) : undefined,
            maxScore: maxScore?.toString() || '10.00', weight: weight?.toString() || '1.00',
        }).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.academicProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), name: zod_1.z.string().optional(), type: zod_1.z.enum(['prova', 'trabalho', 'seminario', 'participacao', 'recuperacao']).optional(),
        maxScore: zod_1.z.number().optional(), weight: zod_1.z.number().optional(), date: zod_1.z.string().optional(),
        bimester: zod_1.z.enum(['1', '2', '3', '4']).optional(), description: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, date, maxScore, weight, ...data } = input;
        const ud = { ...data };
        if (date)
            ud.date = new Date(date);
        if (maxScore !== undefined)
            ud.maxScore = maxScore.toString();
        if (weight !== undefined)
            ud.weight = weight.toString();
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.assessments).set(ud).where((0, drizzle_orm_1.eq)(schema_1.assessments.id, id));
        return { success: true };
    }),
    delete: trpc_1.academicProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.assessments).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.assessments.id, input.id));
        return { success: true };
    }),
});
exports.studentGradesRouter = trpc_1.t.router({
    // Listar notas por avaliação
    listByAssessment: trpc_1.academicProcedure
        .input(zod_1.z.object({ assessmentId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select({
            id: schema_1.studentGrades.id, studentId: schema_1.studentGrades.studentId,
            score: schema_1.studentGrades.score, notes: schema_1.studentGrades.notes,
            studentName: schema_1.students.name,
        })
            .from(schema_1.studentGrades)
            .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.studentGrades.studentId, schema_1.students.id))
            .where((0, drizzle_orm_1.eq)(schema_1.studentGrades.assessmentId, input.assessmentId));
    }),
    // Registrar/atualizar notas em lote
    registerBatch: trpc_1.academicProcedure
        .input(zod_1.z.object({
        assessmentId: zod_1.z.number(),
        grades: zod_1.z.array(zod_1.z.object({
            studentId: zod_1.z.number(),
            score: zod_1.z.number().nullable(),
            notes: zod_1.z.string().optional(),
        })),
    }))
        .mutation(async ({ ctx, input }) => {
        for (const grade of input.grades) {
            const existing = await index_1.db.select().from(schema_1.studentGrades)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentGrades.assessmentId, input.assessmentId), (0, drizzle_orm_1.eq)(schema_1.studentGrades.studentId, grade.studentId))).limit(1);
            if (existing.length > 0) {
                await index_1.db.update(schema_1.studentGrades).set({ score: grade.score?.toString(), notes: grade.notes, registeredByUserId: ctx.userId })
                    .where((0, drizzle_orm_1.eq)(schema_1.studentGrades.id, existing[0].id));
            }
            else {
                await index_1.db.insert(schema_1.studentGrades).values({
                    assessmentId: input.assessmentId, studentId: grade.studentId,
                    score: grade.score?.toString(), notes: grade.notes, registeredByUserId: ctx.userId,
                });
            }
        }
        return { success: true };
    }),
    // Boletim: notas de um aluno em uma turma
    reportCard: trpc_1.academicProcedure
        .input(zod_1.z.object({ classId: zod_1.z.number(), studentId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const classAssessments = await index_1.db.select().from(schema_1.assessments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.assessments.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.assessments.isActive, true)));
        const grades = await index_1.db.select().from(schema_1.studentGrades)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.studentGrades.assessmentId, classAssessments.map(a => a.id)), (0, drizzle_orm_1.eq)(schema_1.studentGrades.studentId, input.studentId)));
        // Group by subject and bimester
        const report = {};
        for (const assessment of classAssessments) {
            const subjectId = assessment.subjectId;
            if (!report[subjectId]) {
                const [subj] = await index_1.db.select({ name: schema_1.subjects.name }).from(schema_1.subjects).where((0, drizzle_orm_1.eq)(schema_1.subjects.id, subjectId)).limit(1);
                report[subjectId] = { subjectId, subjectName: subj?.name || '', bimesters: { '1': [], '2': [], '3': [], '4': [] } };
            }
            const grade = grades.find(g => g.assessmentId === assessment.id);
            report[subjectId].bimesters[assessment.bimester].push({
                assessmentName: assessment.name, type: assessment.type,
                maxScore: parseFloat(assessment.maxScore || '10'),
                weight: parseFloat(assessment.weight || '1'),
                score: grade ? parseFloat(grade.score || '0') : null,
            });
        }
        return Object.values(report);
    }),
});
exports.lessonPlansRouter = trpc_1.t.router({
    list: trpc_1.academicProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), classId: zod_1.z.number().optional(), subjectId: zod_1.z.number().optional(), bimester: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.lessonPlans.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.lessonPlans.isActive, true)];
        if (input.classId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.lessonPlans.classId, input.classId));
        if (input.subjectId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.lessonPlans.subjectId, input.subjectId));
        if (input.bimester)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.lessonPlans.bimester, input.bimester));
        return index_1.db.select({
            id: schema_1.lessonPlans.id, classId: schema_1.lessonPlans.classId, subjectId: schema_1.lessonPlans.subjectId,
            date: schema_1.lessonPlans.date, topic: schema_1.lessonPlans.topic, content: schema_1.lessonPlans.content,
            methodology: schema_1.lessonPlans.methodology, resources: schema_1.lessonPlans.resources,
            bnccCode: schema_1.lessonPlans.bnccCode, bimester: schema_1.lessonPlans.bimester,
            subjectName: schema_1.subjects.name, teacherName: schema_1.users.name,
        })
            .from(schema_1.lessonPlans)
            .leftJoin(schema_1.subjects, (0, drizzle_orm_1.eq)(schema_1.lessonPlans.subjectId, schema_1.subjects.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.lessonPlans.teacherUserId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.lessonPlans.date));
    }),
    create: trpc_1.academicProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), classId: zod_1.z.number(), subjectId: zod_1.z.number(),
        date: zod_1.z.string(), topic: zod_1.z.string().min(2),
        content: zod_1.z.string().optional(), methodology: zod_1.z.string().optional(),
        resources: zod_1.z.string().optional(), bnccCode: zod_1.z.string().optional(),
        bimester: zod_1.z.enum(['1', '2', '3', '4']),
    }))
        .mutation(async ({ ctx, input }) => {
        const { date, ...rest } = input;
        const [result] = await index_1.db.insert(schema_1.lessonPlans).values({
            ...rest, date: new Date(date), teacherUserId: ctx.userId,
        }).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.academicProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), topic: zod_1.z.string().optional(), content: zod_1.z.string().optional(),
        methodology: zod_1.z.string().optional(), resources: zod_1.z.string().optional(),
        bnccCode: zod_1.z.string().optional(), date: zod_1.z.string().optional(),
        bimester: zod_1.z.enum(['1', '2', '3', '4']).optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, date, ...data } = input;
        const ud = { ...data };
        if (date)
            ud.date = new Date(date);
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.lessonPlans).set(ud).where((0, drizzle_orm_1.eq)(schema_1.lessonPlans.id, id));
        return { success: true };
    }),
    delete: trpc_1.academicProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.lessonPlans).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.lessonPlans.id, input.id));
        return { success: true };
    }),
});
// ============================================
// HR ROUTER (RECURSOS HUMANOS)
// ============================================
exports.positionsRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.positions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.positions.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.positions.isActive, true)))
            .orderBy(schema_1.positions.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), name: zod_1.z.string().min(2), category: zod_1.z.enum(['docente', 'administrativo', 'operacional', 'gestao']).optional(), baseSalary: zod_1.z.number().optional(), description: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => {
        const { baseSalary, ...rest } = input;
        const [result] = await index_1.db.insert(schema_1.positions).values({ ...rest, baseSalary: baseSalary?.toString() }).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), name: zod_1.z.string().optional(), category: zod_1.z.enum(['docente', 'administrativo', 'operacional', 'gestao']).optional(), baseSalary: zod_1.z.number().optional(), description: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => {
        const { id, baseSalary, ...data } = input;
        const ud = { ...data };
        if (baseSalary !== undefined)
            ud.baseSalary = baseSalary.toString();
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.positions).set(ud).where((0, drizzle_orm_1.eq)(schema_1.positions.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasStaff] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.staffAllocations).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.staffAllocations.positionId, input.id), (0, drizzle_orm_1.eq)(schema_1.staffAllocations.isActive, true)));
        if (Number(hasStaff.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Cargo vinculado a ${hasStaff.c} servidor(es)` });
        await index_1.db.update(schema_1.positions).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.positions.id, input.id));
        return { success: true };
    }),
});
exports.departmentsRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select({ id: schema_1.departments.id, municipalityId: schema_1.departments.municipalityId, name: schema_1.departments.name, headUserId: schema_1.departments.headUserId, description: schema_1.departments.description, headName: schema_1.users.name })
            .from(schema_1.departments)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.departments.headUserId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.departments.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.departments.isActive, true)))
            .orderBy(schema_1.departments.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), name: zod_1.z.string().min(2), headUserId: zod_1.z.number().optional(), description: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const [result] = await index_1.db.insert(schema_1.departments).values(input).$returningId(); return { success: true, id: result.id }; }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), name: zod_1.z.string().optional(), headUserId: zod_1.z.number().optional(), description: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, ...data } = input; const ud = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
        ud[k] = v; }); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.departments).set(ud).where((0, drizzle_orm_1.eq)(schema_1.departments.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [hasStaff] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.staffAllocations).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.staffAllocations.departmentId, input.id), (0, drizzle_orm_1.eq)(schema_1.staffAllocations.isActive, true)));
        if (Number(hasStaff.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Departamento vinculado a ${hasStaff.c} servidor(es)` });
        await index_1.db.update(schema_1.departments).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.departments.id, input.id));
        return { success: true };
    }),
});
exports.staffAllocationsRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), departmentId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.staffAllocations.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.staffAllocations.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.staffAllocations.schoolId, input.schoolId));
        if (input.departmentId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.staffAllocations.departmentId, input.departmentId));
        return index_1.db.select({
            id: schema_1.staffAllocations.id, userId: schema_1.staffAllocations.userId, schoolId: schema_1.staffAllocations.schoolId,
            departmentId: schema_1.staffAllocations.departmentId, positionId: schema_1.staffAllocations.positionId,
            startDate: schema_1.staffAllocations.startDate, endDate: schema_1.staffAllocations.endDate,
            workload: schema_1.staffAllocations.workload, status: schema_1.staffAllocations.status, notes: schema_1.staffAllocations.notes,
            userName: schema_1.users.name, schoolName: schema_1.schools.name,
        })
            .from(schema_1.staffAllocations)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.staffAllocations.userId, schema_1.users.id))
            .leftJoin(schema_1.schools, (0, drizzle_orm_1.eq)(schema_1.staffAllocations.schoolId, schema_1.schools.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy(schema_1.users.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), userId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), departmentId: zod_1.z.number().optional(), positionId: zod_1.z.number().optional(), startDate: zod_1.z.string(), endDate: zod_1.z.string().optional(), workload: zod_1.z.number().optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => {
        const { startDate, endDate, ...rest } = input;
        const [result] = await index_1.db.insert(schema_1.staffAllocations).values({ ...rest, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : undefined }).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), schoolId: zod_1.z.number().optional(), departmentId: zod_1.z.number().optional(), positionId: zod_1.z.number().optional(), startDate: zod_1.z.string().optional(), endDate: zod_1.z.string().optional(), workload: zod_1.z.number().optional(), status: zod_1.z.enum(['active', 'transferred', 'ended']).optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => {
        const { id, startDate, endDate, ...data } = input;
        const ud = { ...data };
        if (startDate)
            ud.startDate = new Date(startDate);
        if (endDate)
            ud.endDate = new Date(endDate);
        Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.staffAllocations).set(ud).where((0, drizzle_orm_1.eq)(schema_1.staffAllocations.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => { await index_1.db.update(schema_1.staffAllocations).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.staffAllocations.id, input.id)); return { success: true }; }),
});
exports.staffEvaluationsRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), userId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.staffEvaluations.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.staffEvaluations.isActive, true)];
        if (input.userId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.staffEvaluations.userId, input.userId));
        const result = await index_1.db.select().from(schema_1.staffEvaluations).where((0, drizzle_orm_1.and)(...conditions)).orderBy((0, drizzle_orm_1.desc)(schema_1.staffEvaluations.createdAt));
        // Get user names
        const enriched = await Promise.all(result.map(async (e) => {
            const [u] = await index_1.db.select({ name: schema_1.users.name }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, e.userId)).limit(1);
            const [ev] = e.evaluatorUserId ? await index_1.db.select({ name: schema_1.users.name }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, e.evaluatorUserId)).limit(1) : [null];
            return { ...e, userName: u?.name || '', evaluatorName: ev?.name || '' };
        }));
        return enriched;
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), userId: zod_1.z.number(), period: zod_1.z.string(), punctuality: zod_1.z.number().optional(), productivity: zod_1.z.number().optional(), teamwork: zod_1.z.number().optional(), initiative: zod_1.z.number().optional(), communication: zod_1.z.number().optional(), strengths: zod_1.z.string().optional(), improvements: zod_1.z.string().optional(), goals: zod_1.z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const scores = [input.punctuality, input.productivity, input.teamwork, input.initiative, input.communication].filter(Boolean);
        const overallScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toString() : undefined;
        const [result] = await index_1.db.insert(schema_1.staffEvaluations).values({ ...input, evaluatorUserId: ctx.userId, overallScore, status: 'submitted' }).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), period: zod_1.z.string().optional(), punctuality: zod_1.z.number().optional(), productivity: zod_1.z.number().optional(), teamwork: zod_1.z.number().optional(), initiative: zod_1.z.number().optional(), communication: zod_1.z.number().optional(), strengths: zod_1.z.string().optional(), improvements: zod_1.z.string().optional(), goals: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const scores = [data.punctuality, data.productivity, data.teamwork, data.initiative, data.communication].filter(v => v !== undefined && v !== null);
        const ud = {};
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
            ud[k] = v; });
        if (scores.length > 0)
            ud.overallScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toString();
        if (Object.keys(ud).length > 0)
            await index_1.db.update(schema_1.staffEvaluations).set(ud).where((0, drizzle_orm_1.eq)(schema_1.staffEvaluations.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => { await index_1.db.update(schema_1.staffEvaluations).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.staffEvaluations.id, input.id)); return { success: true }; }),
});
// ============================================
// FINANCIAL ROUTER
// ============================================
exports.financialAccountsRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number() })).query(async ({ input }) => {
        return index_1.db.select().from(schema_1.financialAccounts).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.financialAccounts.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.financialAccounts.isActive, true))).orderBy(schema_1.financialAccounts.name);
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), name: zod_1.z.string().min(2), type: zod_1.z.enum(['pdde', 'proprio', 'estadual', 'federal', 'outro']).optional(), bankName: zod_1.z.string().optional(), agency: zod_1.z.string().optional(), accountNumber: zod_1.z.string().optional(), balance: zod_1.z.number().optional() }))
        .mutation(async ({ input }) => { const { balance, ...rest } = input; const [r] = await index_1.db.insert(schema_1.financialAccounts).values({ ...rest, balance: balance?.toString() }).$returningId(); return { success: true, id: r.id }; }),
    update: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), name: zod_1.z.string().optional(), type: zod_1.z.enum(['pdde', 'proprio', 'estadual', 'federal', 'outro']).optional(), bankName: zod_1.z.string().optional(), agency: zod_1.z.string().optional(), accountNumber: zod_1.z.string().optional(), balance: zod_1.z.number().optional() }))
        .mutation(async ({ input }) => { const { id, balance, ...data } = input; const ud = { ...data }; if (balance !== undefined)
        ud.balance = balance.toString(); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.financialAccounts).set(ud).where((0, drizzle_orm_1.eq)(schema_1.financialAccounts.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => {
        const [hasTx] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.financialTransactions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.financialTransactions.accountId, input.id), (0, drizzle_orm_1.eq)(schema_1.financialTransactions.isActive, true)));
        if (Number(hasTx.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Conta possui ${hasTx.c} transação(ões)` });
        await index_1.db.update(schema_1.financialAccounts).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.financialAccounts.id, input.id));
        return { success: true };
    }),
});
exports.financialTransactionsRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), accountId: zod_1.z.number().optional(), type: zod_1.z.string().optional(), startDate: zod_1.z.string().optional(), endDate: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.financialTransactions.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.financialTransactions.isActive, true)];
        if (input.accountId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.financialTransactions.accountId, input.accountId));
        if (input.type)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.financialTransactions.type, input.type));
        if (input.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.financialTransactions.date, new Date(input.startDate)));
        if (input.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.financialTransactions.date, new Date(input.endDate)));
        return index_1.db.select().from(schema_1.financialTransactions).where((0, drizzle_orm_1.and)(...conditions)).orderBy((0, drizzle_orm_1.desc)(schema_1.financialTransactions.date));
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), accountId: zod_1.z.number(), type: zod_1.z.enum(['receita', 'despesa']), category: zod_1.z.string(), description: zod_1.z.string().optional(), value: zod_1.z.number(), date: zod_1.z.string(), documentNumber: zod_1.z.string().optional(), supplier: zod_1.z.string().optional() }))
        .mutation(async ({ ctx, input }) => { const { date, value, ...rest } = input; const [r] = await index_1.db.insert(schema_1.financialTransactions).values({ ...rest, date: new Date(date), value: value.toString(), registeredByUserId: ctx.userId }).$returningId(); return { success: true, id: r.id }; }),
    update: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), accountId: zod_1.z.number().optional(), type: zod_1.z.enum(['receita', 'despesa']).optional(), category: zod_1.z.string().optional(), description: zod_1.z.string().optional(), value: zod_1.z.number().optional(), date: zod_1.z.string().optional(), documentNumber: zod_1.z.string().optional(), supplier: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, date, value, ...data } = input; const ud = { ...data }; if (date)
        ud.date = new Date(date); if (value !== undefined)
        ud.value = value.toString(); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.financialTransactions).set(ud).where((0, drizzle_orm_1.eq)(schema_1.financialTransactions.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => { await index_1.db.update(schema_1.financialTransactions).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.financialTransactions.id, input.id)); return { success: true }; }),
});
// ============================================
// OPERATIONAL ROUTERS
// ============================================
exports.mealMenusRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), startDate: zod_1.z.string().optional(), endDate: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.mealMenus.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.mealMenus.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.mealMenus.schoolId, input.schoolId));
        if (input.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.mealMenus.date, new Date(input.startDate)));
        if (input.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.mealMenus.date, new Date(input.endDate)));
        return index_1.db.select().from(schema_1.mealMenus).where((0, drizzle_orm_1.and)(...conditions)).orderBy((0, drizzle_orm_1.desc)(schema_1.mealMenus.date));
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), date: zod_1.z.string(), mealType: zod_1.z.enum(['breakfast', 'lunch', 'snack', 'dinner']).optional(), description: zod_1.z.string(), calories: zod_1.z.number().optional(), servings: zod_1.z.number().optional(), cost: zod_1.z.number().optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { date, cost, ...rest } = input; const [r] = await index_1.db.insert(schema_1.mealMenus).values({ ...rest, date: new Date(date), cost: cost?.toString() }).$returningId(); return { success: true, id: r.id }; }),
    update: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), date: zod_1.z.string().optional(), mealType: zod_1.z.enum(['breakfast', 'lunch', 'snack', 'dinner']).optional(), description: zod_1.z.string().optional(), calories: zod_1.z.number().optional(), servings: zod_1.z.number().optional(), cost: zod_1.z.number().optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, date, cost, ...data } = input; const ud = { ...data }; if (date)
        ud.date = new Date(date); if (cost !== undefined)
        ud.cost = cost.toString(); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.mealMenus).set(ud).where((0, drizzle_orm_1.eq)(schema_1.mealMenus.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => { await index_1.db.update(schema_1.mealMenus).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.mealMenus.id, input.id)); return { success: true }; }),
});
exports.libraryBooksRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), search: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.libraryBooks.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.libraryBooks.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.libraryBooks.schoolId, input.schoolId));
        if (input.search)
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.libraryBooks.title, `%${input.search}%`), (0, drizzle_orm_1.like)(schema_1.libraryBooks.author, `%${input.search}%`)));
        return index_1.db.select().from(schema_1.libraryBooks).where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.libraryBooks.title);
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), title: zod_1.z.string(), author: zod_1.z.string().optional(), isbn: zod_1.z.string().optional(), category: zod_1.z.string().optional(), publisher: zod_1.z.string().optional(), year: zod_1.z.number().optional(), quantity: zod_1.z.number().optional(), location: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const [r] = await index_1.db.insert(schema_1.libraryBooks).values({ ...input, available: input.quantity || 1 }).$returningId(); return { success: true, id: r.id }; }),
    update: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), title: zod_1.z.string().optional(), author: zod_1.z.string().optional(), isbn: zod_1.z.string().optional(), category: zod_1.z.string().optional(), publisher: zod_1.z.string().optional(), year: zod_1.z.number().optional(), quantity: zod_1.z.number().optional(), location: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, ...data } = input; const ud = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
        ud[k] = v; }); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.libraryBooks).set(ud).where((0, drizzle_orm_1.eq)(schema_1.libraryBooks.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => {
        const [hasLoans] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.libraryLoans).where((0, drizzle_orm_1.eq)(schema_1.libraryLoans.bookId, input.id));
        if (Number(hasLoans.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Livro possui ${hasLoans.c} empréstimo(s)` });
        await index_1.db.update(schema_1.libraryBooks).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.libraryBooks.id, input.id));
        return { success: true };
    }),
});
exports.libraryLoansRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), bookId: zod_1.z.number().optional(), status: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.libraryBooks.municipalityId, input.municipalityId)];
        if (input.bookId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.libraryLoans.bookId, input.bookId));
        if (input.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.libraryLoans.status, input.status));
        return index_1.db.select({ id: schema_1.libraryLoans.id, bookId: schema_1.libraryLoans.bookId, userId: schema_1.libraryLoans.userId, studentId: schema_1.libraryLoans.studentId, loanDate: schema_1.libraryLoans.loanDate, dueDate: schema_1.libraryLoans.dueDate, returnDate: schema_1.libraryLoans.returnDate, status: schema_1.libraryLoans.status, bookTitle: schema_1.libraryBooks.title, userName: schema_1.users.name })
            .from(schema_1.libraryLoans).leftJoin(schema_1.libraryBooks, (0, drizzle_orm_1.eq)(schema_1.libraryLoans.bookId, schema_1.libraryBooks.id)).leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.libraryLoans.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)(...conditions)).orderBy((0, drizzle_orm_1.desc)(schema_1.libraryLoans.loanDate));
    }),
    create: trpc_1.protectedProcedure.input(zod_1.z.object({ bookId: zod_1.z.number(), userId: zod_1.z.number().optional(), studentId: zod_1.z.number().optional(), dueDate: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => { const [r] = await index_1.db.insert(schema_1.libraryLoans).values({ bookId: input.bookId, userId: input.userId || ctx.userId, studentId: input.studentId, dueDate: new Date(input.dueDate) }).$returningId(); await index_1.db.update(schema_1.libraryBooks).set({ available: (0, drizzle_orm_1.sql) `available - 1` }).where((0, drizzle_orm_1.eq)(schema_1.libraryBooks.id, input.bookId)); return { success: true, id: r.id }; }),
    returnBook: trpc_1.protectedProcedure.input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => { const [loan] = await index_1.db.select().from(schema_1.libraryLoans).where((0, drizzle_orm_1.eq)(schema_1.libraryLoans.id, input.id)).limit(1); if (loan) {
        await index_1.db.update(schema_1.libraryLoans).set({ status: 'returned', returnDate: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.libraryLoans.id, input.id));
        await index_1.db.update(schema_1.libraryBooks).set({ available: (0, drizzle_orm_1.sql) `available + 1` }).where((0, drizzle_orm_1.eq)(schema_1.libraryBooks.id, loan.bookId));
    } return { success: true }; }),
});
exports.assetsRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), category: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.assets.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.assets.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.assets.schoolId, input.schoolId));
        if (input.category)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.assets.category, input.category));
        return index_1.db.select().from(schema_1.assets).where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.assets.name);
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), name: zod_1.z.string(), code: zod_1.z.string().optional(), category: zod_1.z.enum(['movel', 'imovel', 'equipamento', 'veiculo', 'tecnologia', 'outro']).optional(), acquisitionDate: zod_1.z.string().optional(), acquisitionValue: zod_1.z.number().optional(), currentValue: zod_1.z.number().optional(), location: zod_1.z.string().optional(), condition: zod_1.z.enum(['otimo', 'bom', 'regular', 'ruim', 'inservivel']).optional(), responsibleUserId: zod_1.z.number().optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { acquisitionDate, acquisitionValue, currentValue, ...rest } = input; const [r] = await index_1.db.insert(schema_1.assets).values({ ...rest, acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : undefined, acquisitionValue: acquisitionValue?.toString(), currentValue: currentValue?.toString() }).$returningId(); return { success: true, id: r.id }; }),
    update: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), name: zod_1.z.string().optional(), code: zod_1.z.string().optional(), category: zod_1.z.enum(['movel', 'imovel', 'equipamento', 'veiculo', 'tecnologia', 'outro']).optional(), location: zod_1.z.string().optional(), condition: zod_1.z.enum(['otimo', 'bom', 'regular', 'ruim', 'inservivel']).optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, ...data } = input; const ud = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
        ud[k] = v; }); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.assets).set(ud).where((0, drizzle_orm_1.eq)(schema_1.assets.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => { await index_1.db.update(schema_1.assets).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.assets.id, input.id)); return { success: true }; }),
});
exports.inventoryRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.inventoryItems.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.inventoryItems.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.inventoryItems.schoolId, input.schoolId));
        return index_1.db.select().from(schema_1.inventoryItems).where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.inventoryItems.name);
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), name: zod_1.z.string(), category: zod_1.z.string().optional(), unit: zod_1.z.string().optional(), currentStock: zod_1.z.number().optional(), minStock: zod_1.z.number().optional(), maxStock: zod_1.z.number().optional(), unitCost: zod_1.z.number().optional(), location: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { unitCost, ...rest } = input; const [r] = await index_1.db.insert(schema_1.inventoryItems).values({ ...rest, unitCost: unitCost?.toString() }).$returningId(); return { success: true, id: r.id }; }),
    update: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), name: zod_1.z.string().optional(), category: zod_1.z.string().optional(), unit: zod_1.z.string().optional(), currentStock: zod_1.z.number().optional(), minStock: zod_1.z.number().optional(), location: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, ...data } = input; const ud = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined)
        ud[k] = v; }); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.inventoryItems).set(ud).where((0, drizzle_orm_1.eq)(schema_1.inventoryItems.id, id)); return { success: true }; }),
    addMovement: trpc_1.adminProcedure.input(zod_1.z.object({ itemId: zod_1.z.number(), type: zod_1.z.enum(['entrada', 'saida', 'ajuste']), quantity: zod_1.z.number(), documentNumber: zod_1.z.string().optional(), supplier: zod_1.z.string().optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        await index_1.db.insert(schema_1.inventoryMovements).values({ ...input, registeredByUserId: ctx.userId });
        // Update stock
        const delta = input.type === 'entrada' ? input.quantity : input.type === 'saida' ? -input.quantity : 0;
        if (delta !== 0)
            await index_1.db.update(schema_1.inventoryItems).set({ currentStock: (0, drizzle_orm_1.sql) `currentStock + ${delta}` }).where((0, drizzle_orm_1.eq)(schema_1.inventoryItems.id, input.itemId));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => {
        const [hasMov] = await index_1.db.select({ c: (0, drizzle_orm_1.sql) `count(*)`.as('c') }).from(schema_1.inventoryMovements).where((0, drizzle_orm_1.eq)(schema_1.inventoryMovements.itemId, input.id));
        if (Number(hasMov.c) > 0)
            throw new server_1.TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Item possui ${hasMov.c} movimentação(ões)` });
        await index_1.db.update(schema_1.inventoryItems).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.inventoryItems.id, input.id));
        return { success: true };
    }),
});
// ============================================
// EDUCACENSO ROUTER (EXPORTAÇÃO DE DADOS)
// ============================================
exports.educacensoRouter = trpc_1.t.router({
    // Resumo dos dados para o Censo Escolar
    summary: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), academicYearId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const mid = input.municipalityId;
        const [schoolCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.schools).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true)));
        const [studentCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.students.isActive, true)));
        const [teacherCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.teachers).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teachers.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.teachers.isActive, true)));
        const [classCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.classes.isActive, true)));
        const [enrollmentCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.enrollments).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.enrollments.status, 'active')));
        // By school
        const schoolsList = await index_1.db.select().from(schema_1.schools).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true)));
        const schoolsData = await Promise.all(schoolsList.map(async (s) => {
            const [sc] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.schoolId, s.id), (0, drizzle_orm_1.eq)(schema_1.students.isActive, true)));
            const [cc] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.schoolId, s.id), (0, drizzle_orm_1.eq)(schema_1.classes.isActive, true)));
            return { id: s.id, name: s.name, code: s.code, type: s.type, students: sc?.count || 0, classes: cc?.count || 0 };
        }));
        // By grade level
        const gradesList = await index_1.db.select().from(schema_1.classGrades).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classGrades.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.classGrades.isActive, true)));
        return {
            totals: { schools: schoolCount?.count || 0, students: studentCount?.count || 0, teachers: teacherCount?.count || 0, classes: classCount?.count || 0, enrollments: enrollmentCount?.count || 0 },
            schools: schoolsData,
            grades: gradesList,
        };
    }),
    // Exportar dados de escolas para formato EDUCACENSO
    exportSchools: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.schools).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true))).orderBy(schema_1.schools.name);
    }),
    // Exportar dados de alunos
    exportStudents: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.students.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.students.schoolId, input.schoolId));
        return index_1.db.select({ id: schema_1.students.id, name: schema_1.students.name, birthDate: schema_1.students.birthDate, grade: schema_1.students.grade, shift: schema_1.students.shift, enrollment: schema_1.students.enrollment, schoolId: schema_1.students.schoolId, schoolName: schema_1.schools.name, hasSpecialNeeds: schema_1.students.hasSpecialNeeds })
            .from(schema_1.students).leftJoin(schema_1.schools, (0, drizzle_orm_1.eq)(schema_1.students.schoolId, schema_1.schools.id)).where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.students.name);
    }),
    // Exportar dados de professores
    exportTeachers: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select({ id: schema_1.teachers.id, name: schema_1.users.name, email: schema_1.users.email, cpf: schema_1.users.cpf, degree: schema_1.teachers.degree, contractType: schema_1.teachers.contractType, weeklyWorkload: schema_1.teachers.weeklyWorkload })
            .from(schema_1.teachers).innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.teachers.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teachers.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.teachers.isActive, true)));
    }),
    // Exportar dados de turmas
    exportClasses: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), academicYearId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.classes.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.classes.isActive, true)];
        if (input.academicYearId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.classes.academicYearId, input.academicYearId));
        return index_1.db.select({ id: schema_1.classes.id, name: schema_1.classes.name, fullName: schema_1.classes.fullName, shift: schema_1.classes.shift, maxStudents: schema_1.classes.maxStudents, schoolName: schema_1.schools.name, gradeName: schema_1.classGrades.name, gradeLevel: schema_1.classGrades.level })
            .from(schema_1.classes).leftJoin(schema_1.schools, (0, drizzle_orm_1.eq)(schema_1.classes.schoolId, schema_1.schools.id)).leftJoin(schema_1.classGrades, (0, drizzle_orm_1.eq)(schema_1.classes.classGradeId, schema_1.classGrades.id))
            .where((0, drizzle_orm_1.and)(...conditions));
    }),
});
// ============================================
// TRANSPARENCY PORTAL (PORTAL DE TRANSPARÊNCIA - PÚBLICO)
// ============================================
exports.transparencyRouter = trpc_1.t.router({
    // Lista de municípios para seleção pública
    listMunicipalities: trpc_1.publicProcedure
        .query(async () => {
        return index_1.db.select({
            id: schema_1.municipalities.id,
            name: schema_1.municipalities.name,
            city: schema_1.municipalities.city,
            state: schema_1.municipalities.state,
        }).from(schema_1.municipalities).where((0, drizzle_orm_1.eq)(schema_1.municipalities.isActive, true)).orderBy(schema_1.municipalities.name);
    }),
    // Dados públicos do município - sem autenticação
    publicData: trpc_1.publicProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const mid = input.municipalityId;
        const [mun] = await index_1.db.select({ name: schema_1.municipalities.name, city: schema_1.municipalities.city, state: schema_1.municipalities.state }).from(schema_1.municipalities).where((0, drizzle_orm_1.eq)(schema_1.municipalities.id, mid)).limit(1);
        if (!mun)
            return null;
        const [schoolCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.schools).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true)));
        const [studentCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.students.isActive, true)));
        const [teacherCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.teachers).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teachers.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.teachers.isActive, true)));
        const [vehicleCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.municipalityId, mid));
        const [routeCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.routes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true)));
        const [contractCount] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.contracts).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contracts.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.contracts.isActive, true)));
        // Financial summary
        const txns = await index_1.db.select({ type: schema_1.financialTransactions.type, value: schema_1.financialTransactions.value })
            .from(schema_1.financialTransactions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.financialTransactions.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.financialTransactions.isActive, true)));
        const totalReceita = txns.filter(t => t.type === 'receita').reduce((s, t) => s + (parseFloat(t.value) || 0), 0);
        const totalDespesa = txns.filter(t => t.type === 'despesa').reduce((s, t) => s + (parseFloat(t.value) || 0), 0);
        // Contracts list (public)
        const publicContracts = await index_1.db.select({ number: schema_1.contracts.number, type: schema_1.contracts.type, supplier: schema_1.contracts.supplier, value: schema_1.contracts.value, startDate: schema_1.contracts.startDate, endDate: schema_1.contracts.endDate })
            .from(schema_1.contracts).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.contracts.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.contracts.isActive, true))).orderBy((0, drizzle_orm_1.desc)(schema_1.contracts.createdAt)).limit(20);
        // Schools list (public)
        const publicSchools = await index_1.db.select({ name: schema_1.schools.name, type: schema_1.schools.type, address: schema_1.schools.address, phone: schema_1.schools.phone })
            .from(schema_1.schools).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schools.municipalityId, mid), (0, drizzle_orm_1.eq)(schema_1.schools.isActive, true))).orderBy(schema_1.schools.name);
        return {
            municipality: mun,
            stats: { schools: schoolCount?.count || 0, students: studentCount?.count || 0, teachers: teacherCount?.count || 0, vehicles: vehicleCount?.count || 0, routes: routeCount?.count || 0, contracts: contractCount?.count || 0 },
            financial: { receita: totalReceita, despesa: totalDespesa, saldo: totalReceita - totalDespesa },
            contracts: publicContracts,
            schools: publicSchools,
        };
    }),
});
// ============================================
// ADDITIONAL FEATURE ROUTERS
// ============================================
// Parecer Descritivo
exports.descriptiveReportsRouter = trpc_1.t.router({
    list: trpc_1.academicProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), classId: zod_1.z.number(), bimester: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const [cls] = await index_1.db.select({ municipalityId: schema_1.classes.municipalityId }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.id, input.classId), (0, drizzle_orm_1.eq)(schema_1.classes.municipalityId, input.municipalityId))).limit(1);
        if (!cls)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Turma não encontrada' });
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.descriptiveReports.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.descriptiveReports.isActive, true)];
        if (input.bimester)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.descriptiveReports.bimester, input.bimester));
        return index_1.db.select({ id: schema_1.descriptiveReports.id, studentId: schema_1.descriptiveReports.studentId, bimester: schema_1.descriptiveReports.bimester, content: schema_1.descriptiveReports.content, status: schema_1.descriptiveReports.status, studentName: schema_1.students.name })
            .from(schema_1.descriptiveReports).leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.descriptiveReports.studentId, schema_1.students.id)).where((0, drizzle_orm_1.and)(...conditions));
    }),
    save: trpc_1.academicProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), studentId: zod_1.z.number(), classId: zod_1.z.number(), bimester: zod_1.z.enum(['1', '2', '3', '4']), content: zod_1.z.string(), status: zod_1.z.enum(['draft', 'published']).optional() }))
        .mutation(async ({ ctx, input }) => {
        const existing = await index_1.db.select().from(schema_1.descriptiveReports).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.descriptiveReports.studentId, input.studentId), (0, drizzle_orm_1.eq)(schema_1.descriptiveReports.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.descriptiveReports.bimester, input.bimester))).limit(1);
        if (existing.length > 0) {
            await index_1.db.update(schema_1.descriptiveReports).set({ content: input.content, status: input.status || 'draft', teacherUserId: ctx.userId }).where((0, drizzle_orm_1.eq)(schema_1.descriptiveReports.id, existing[0].id));
            return { success: true, id: existing[0].id };
        }
        const [r] = await index_1.db.insert(schema_1.descriptiveReports).values({ ...input, teacherUserId: ctx.userId }).$returningId();
        return { success: true, id: r.id };
    }),
});
// Calendário Escolar
exports.schoolCalendarRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), month: zod_1.z.number().optional(), year: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.schoolCalendar.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.schoolCalendar.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.schoolCalendar.schoolId, input.schoolId));
        return index_1.db.select().from(schema_1.schoolCalendar).where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.schoolCalendar.startDate);
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), academicYearId: zod_1.z.number().optional(), title: zod_1.z.string(), description: zod_1.z.string().optional(), startDate: zod_1.z.string(), endDate: zod_1.z.string().optional(), eventType: zod_1.z.enum(['aula', 'feriado', 'recesso', 'reuniao', 'conselho', 'prova', 'evento', 'outro']).optional(), color: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { startDate, endDate, ...rest } = input; const [r] = await index_1.db.insert(schema_1.schoolCalendar).values({ ...rest, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : undefined }).$returningId(); return { success: true, id: r.id }; }),
    update: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), title: zod_1.z.string().optional(), description: zod_1.z.string().optional(), startDate: zod_1.z.string().optional(), endDate: zod_1.z.string().optional(), eventType: zod_1.z.enum(['aula', 'feriado', 'recesso', 'reuniao', 'conselho', 'prova', 'evento', 'outro']).optional(), color: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, startDate, endDate, ...data } = input; const ud = { ...data }; if (startDate)
        ud.startDate = new Date(startDate); if (endDate)
        ud.endDate = new Date(endDate); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0)
        await index_1.db.update(schema_1.schoolCalendar).set(ud).where((0, drizzle_orm_1.eq)(schema_1.schoolCalendar.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => { await index_1.db.update(schema_1.schoolCalendar).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.schoolCalendar.id, input.id)); return { success: true }; }),
    // Check if tracking should be active today
    trackingStatus: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), date: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const checkDate = input.date ? new Date(input.date) : new Date();
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayOfWeek = checkDate.getDay(); // 0=Sun, 6=Sat
        // Weekend check
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { isSchoolDay: false, reason: 'Fim de semana', trackingActive: false, events: [] };
        }
        // Check calendar events for this date
        const events = await index_1.db.select().from(schema_1.schoolCalendar)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schoolCalendar.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.schoolCalendar.isActive, true), (0, drizzle_orm_1.lte)(schema_1.schoolCalendar.startDate, checkDate)));
        // Filter events that cover this date
        const activeEvents = events.filter(e => {
            const start = e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '';
            const end = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : start;
            return dateStr >= start && dateStr <= end;
        });
        // Check if any event blocks tracking (feriado, recesso)
        const blockingEvent = activeEvents.find(e => e.eventType === 'feriado' || e.eventType === 'recesso');
        if (blockingEvent) {
            return {
                isSchoolDay: false,
                reason: blockingEvent.title,
                eventType: blockingEvent.eventType,
                trackingActive: false,
                events: activeEvents.map(e => ({ title: e.title, type: e.eventType, color: e.color })),
            };
        }
        // Check active academic year (accept active or planning)
        const [activeYear] = await index_1.db.select().from(schema_1.academicYears)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.academicYears.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.academicYears.isActive, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.academicYears.year))
            .limit(1);
        if (!activeYear) {
            // No academic year at all - still allow transport (it's independent)
            return {
                isSchoolDay: true,
                reason: 'Dia letivo (sem ano letivo configurado)',
                trackingActive: true,
                events: activeEvents.map(e => ({ title: e.title, type: e.eventType, color: e.color })),
            };
        }
        // Check if date is within academic year range (but don't block transport)
        const yearStart = new Date(activeYear.startDate).toISOString().split('T')[0];
        const yearEnd = new Date(activeYear.endDate).toISOString().split('T')[0];
        const inPeriod = dateStr >= yearStart && dateStr <= yearEnd;
        return {
            isSchoolDay: true,
            reason: inPeriod ? 'Dia letivo' : 'Fora do período letivo (transporte permitido)',
            trackingActive: true,
            academicYear: activeYear.name,
            events: activeEvents.map(e => ({ title: e.title, type: e.eventType, color: e.color })),
        };
    }),
    // Get tracking status for a week (for dashboard)
    weekStatus: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), startDate: zod_1.z.string() }))
        .query(async ({ input }) => {
        const start = new Date(input.startDate);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                days.push({ date: dateStr, dayOfWeek, isSchoolDay: false, reason: 'Fim de semana', events: [] });
                continue;
            }
            const events = await index_1.db.select().from(schema_1.schoolCalendar)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.schoolCalendar.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.schoolCalendar.isActive, true)));
            const activeEvents = events.filter(e => {
                const s = e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '';
                const ed = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : s;
                return dateStr >= s && dateStr <= ed;
            });
            const blocked = activeEvents.find(e => e.eventType === 'feriado' || e.eventType === 'recesso');
            days.push({
                date: dateStr,
                dayOfWeek,
                isSchoolDay: !blocked,
                reason: blocked ? blocked.title : 'Dia letivo',
                events: activeEvents.map(e => ({ title: e.title, type: e.eventType, color: e.color })),
            });
        }
        return days;
    }),
    // Get current bimester based on calendar
    currentBimester: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [activeYear] = await index_1.db.select().from(schema_1.academicYears)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.academicYears.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.academicYears.status, 'active')))
            .limit(1);
        if (!activeYear)
            return { bimester: null, academicYear: null };
        const today = new Date();
        const start = new Date(activeYear.startDate);
        const end = new Date(activeYear.endDate);
        const totalDays = (end.getTime() - start.getTime()) / 86400000;
        const elapsed = (today.getTime() - start.getTime()) / 86400000;
        const progress = Math.max(0, Math.min(1, elapsed / totalDays));
        let bimester = '1';
        if (progress > 0.75)
            bimester = '4';
        else if (progress > 0.5)
            bimester = '3';
        else if (progress > 0.25)
            bimester = '2';
        return {
            bimester,
            academicYear: activeYear.name,
            progress: Math.round(progress * 100),
            startDate: activeYear.startDate,
            endDate: activeYear.endDate,
        };
    }),
});
// Recados / Comunicação
exports.messagesRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), limit: zod_1.z.number().default(50) }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.messages.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.messages.isActive, true)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.messages.schoolId, input.schoolId));
        return index_1.db.select({ id: schema_1.messages.id, title: schema_1.messages.title, content: schema_1.messages.content, targetType: schema_1.messages.targetType, priority: schema_1.messages.priority, createdAt: schema_1.messages.createdAt, senderName: schema_1.users.name })
            .from(schema_1.messages).leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.messages.senderUserId, schema_1.users.id)).where((0, drizzle_orm_1.and)(...conditions)).orderBy((0, drizzle_orm_1.desc)(schema_1.messages.createdAt)).limit(input.limit);
    }),
    create: trpc_1.protectedProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), targetType: zod_1.z.enum(['all', 'school', 'class', 'student', 'staff']).optional(), targetClassId: zod_1.z.number().optional(), targetStudentId: zod_1.z.number().optional(), title: zod_1.z.string(), content: zod_1.z.string(), priority: zod_1.z.enum(['normal', 'important', 'urgent']).optional() }))
        .mutation(async ({ ctx, input }) => { const [r] = await index_1.db.insert(schema_1.messages).values({ ...input, senderUserId: ctx.userId }).$returningId(); return { success: true, id: r.id }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => { await index_1.db.update(schema_1.messages).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.messages.id, input.id)); return { success: true }; }),
});
// Lista de Espera
exports.waitingListRouter = trpc_1.t.router({
    list: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number().optional(), status: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.waitingList.municipalityId, input.municipalityId)];
        if (input.schoolId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.waitingList.schoolId, input.schoolId));
        if (input.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.waitingList.status, input.status));
        return index_1.db.select().from(schema_1.waitingList).where((0, drizzle_orm_1.and)(...conditions)).orderBy(schema_1.waitingList.position);
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), schoolId: zod_1.z.number(), studentName: zod_1.z.string(), birthDate: zod_1.z.string().optional(), guardianName: zod_1.z.string().optional(), guardianPhone: zod_1.z.string().optional(), guardianCpf: zod_1.z.string().optional(), gradeRequested: zod_1.z.string().optional(), shift: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => {
        const [last] = await index_1.db.select({ max: (0, drizzle_orm_1.sql) `COALESCE(MAX(position), 0)` }).from(schema_1.waitingList).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.waitingList.schoolId, input.schoolId), (0, drizzle_orm_1.eq)(schema_1.waitingList.status, 'waiting')));
        const { birthDate, ...rest } = input;
        const [r] = await index_1.db.insert(schema_1.waitingList).values({ ...rest, birthDate: birthDate ? new Date(birthDate) : undefined, position: (last?.max || 0) + 1 }).$returningId();
        return { success: true, id: r.id };
    }),
    updateStatus: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number(), status: zod_1.z.enum(['waiting', 'called', 'enrolled', 'cancelled']), notes: zod_1.z.string().optional() }))
        .mutation(async ({ input }) => { const { id, ...data } = input; await index_1.db.update(schema_1.waitingList).set(data).where((0, drizzle_orm_1.eq)(schema_1.waitingList.id, id)); return { success: true }; }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() })).mutation(async ({ input }) => { await index_1.db.delete(schema_1.waitingList).where((0, drizzle_orm_1.eq)(schema_1.waitingList.id, input.id)); return { success: true }; }),
});
// Documentos do Aluno
exports.studentDocumentsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure.input(zod_1.z.object({ municipalityId: zod_1.z.number(), studentId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [stu] = await index_1.db.select({ municipalityId: schema_1.students.municipalityId }).from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId), (0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId))).limit(1);
        if (!stu)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        return index_1.db.select().from(schema_1.studentDocuments).where((0, drizzle_orm_1.eq)(schema_1.studentDocuments.studentId, input.studentId)).orderBy((0, drizzle_orm_1.desc)(schema_1.studentDocuments.createdAt));
    }),
    create: trpc_1.adminProcedure.input(zod_1.z.object({ studentId: zod_1.z.number(), name: zod_1.z.string(), type: zod_1.z.enum(['certidao_nascimento', 'rg', 'cpf', 'comprovante_residencia', 'historico_escolar', 'laudo_medico', 'foto', 'outro']).optional(), fileUrl: zod_1.z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const [r] = await index_1.db.insert(schema_1.studentDocuments).values({ ...input, uploadedByUserId: ctx.userId }).$returningId();
        return { success: true, id: r.id };
    }),
    delete: trpc_1.adminProcedure.input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => { await index_1.db.delete(schema_1.studentDocuments).where((0, drizzle_orm_1.eq)(schema_1.studentDocuments.id, input.id)); return { success: true }; }),
});
// ============================================
// FORM FIELD CONFIG ROUTER
// ============================================
exports.formConfigRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), formType: zod_1.z.string().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.formFieldConfigs.municipalityId, input.municipalityId)];
        if (input.formType)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.formFieldConfigs.formType, input.formType));
        return index_1.db.select().from(schema_1.formFieldConfigs).where((0, drizzle_orm_1.and)(...conditions));
    }),
    save: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        formType: zod_1.z.string(),
        fields: zod_1.z.array(zod_1.z.object({ fieldName: zod_1.z.string(), isRequired: zod_1.z.boolean() })),
    }))
        .mutation(async ({ input }) => {
        // Delete existing configs for this form type
        await index_1.db.delete(schema_1.formFieldConfigs).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.formFieldConfigs.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.formFieldConfigs.formType, input.formType)));
        // Insert new configs (only required ones)
        const required = input.fields.filter(f => f.isRequired);
        if (required.length > 0) {
            await index_1.db.insert(schema_1.formFieldConfigs).values(required.map(f => ({ municipalityId: input.municipalityId, formType: input.formType, fieldName: f.fieldName, isRequired: true })));
        }
        return { success: true };
    }),
});
// ============================================
// FUEL RECORDS ROUTER
// ============================================
exports.fuelRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), vehicleId: zod_1.z.number().optional() }))
        .query(async ({ input }) => {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.fuelRecords.municipalityId, input.municipalityId)];
        if (input.vehicleId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.fuelRecords.vehicleId, input.vehicleId));
        return index_1.db.select({
            fuel: schema_1.fuelRecords,
            vehicle: { id: schema_1.vehicles.id, plate: schema_1.vehicles.plate, nickname: schema_1.vehicles.nickname },
        }).from(schema_1.fuelRecords)
            .innerJoin(schema_1.vehicles, (0, drizzle_orm_1.eq)(schema_1.fuelRecords.vehicleId, schema_1.vehicles.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.fuelRecords.fuelDate));
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), vehicleId: zod_1.z.number(), driverId: zod_1.z.number().optional(),
        fuelDate: zod_1.z.string(), fuelType: zod_1.z.string().optional(),
        liters: zod_1.z.number(), pricePerLiter: zod_1.z.number().optional(), totalCost: zod_1.z.number(),
        kmAtFueling: zod_1.z.number().optional(), gasStation: zod_1.z.string().optional(),
        invoiceNumber: zod_1.z.string().optional(), notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [result] = await index_1.db.insert(schema_1.fuelRecords).values({
            ...input, fuelDate: new Date(input.fuelDate),
            liters: String(input.liters), totalCost: String(input.totalCost),
            pricePerLiter: input.pricePerLiter ? String(input.pricePerLiter) : undefined,
        });
        return { id: result.insertId };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.fuelRecords).where((0, drizzle_orm_1.eq)(schema_1.fuelRecords.id, input.id));
        return { success: true };
    }),
});
// ============================================
// STUDENT HISTORY ROUTER (Histórico Escolar Anterior)
// ============================================
exports.studentHistoryRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), studentId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [stu] = await index_1.db.select({ municipalityId: schema_1.students.municipalityId }).from(schema_1.students).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.id, input.studentId), (0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId))).limit(1);
        if (!stu)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
        return index_1.db.select().from(schema_1.studentHistory)
            .where((0, drizzle_orm_1.eq)(schema_1.studentHistory.studentId, input.studentId))
            .orderBy(schema_1.studentHistory.year);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        studentId: zod_1.z.number(),
        year: zod_1.z.number(),
        grade: zod_1.z.string(),
        schoolName: zod_1.z.string(),
        schoolCity: zod_1.z.string().optional(),
        schoolState: zod_1.z.string().optional(),
        schoolType: zod_1.z.string().optional(),
        result: zod_1.z.string(),
        observations: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [result] = await index_1.db.insert(schema_1.studentHistory).values(input).$returningId();
        return { success: true, id: result.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        year: zod_1.z.number().optional(),
        grade: zod_1.z.string().optional(),
        schoolName: zod_1.z.string().optional(),
        schoolCity: zod_1.z.string().optional(),
        schoolState: zod_1.z.string().optional(),
        schoolType: zod_1.z.string().optional(),
        result: zod_1.z.string().optional(),
        observations: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.studentHistory).set(data).where((0, drizzle_orm_1.eq)(schema_1.studentHistory.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.studentHistory).where((0, drizzle_orm_1.eq)(schema_1.studentHistory.id, input.id));
        return { success: true };
    }),
});
// ============================================
// STUDENT OCCURRENCES ROUTER
// ============================================
exports.studentOccurrencesRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.studentOccurrences)
            .where((0, drizzle_orm_1.eq)(schema_1.studentOccurrences.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.studentOccurrences.date));
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), studentId: zod_1.z.number(), studentName: zod_1.z.string().optional(),
        date: zod_1.z.string(), type: zod_1.z.string(), description: zod_1.z.string(), action: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const [r] = await index_1.db.insert(schema_1.studentOccurrences).values({ ...input, date: new Date(input.date), createdById: ctx.userId }).$returningId();
        return { success: true, id: r.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), date: zod_1.z.string().optional(), type: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(), action: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, date, ...data } = input;
        const ud = { ...data };
        if (date)
            ud.date = new Date(date);
        await index_1.db.update(schema_1.studentOccurrences).set(ud).where((0, drizzle_orm_1.eq)(schema_1.studentOccurrences.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.studentOccurrences).where((0, drizzle_orm_1.eq)(schema_1.studentOccurrences.id, input.id));
        return { success: true };
    }),
});
// ============================================
// EVENTS ROUTER
// ============================================
exports.eventsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.events)
            .where((0, drizzle_orm_1.eq)(schema_1.events.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.events.date));
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), title: zod_1.z.string(), date: zod_1.z.string(), endDate: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(), location: zod_1.z.string().optional(), description: zod_1.z.string().optional(),
        responsible: zod_1.z.string().optional(), estimatedParticipants: zod_1.z.number().optional(), budget: zod_1.z.number().optional(),
        status: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { date, endDate, budget, ...rest } = input;
        const values = { ...rest, date: new Date(date), createdById: ctx.userId };
        if (endDate)
            values.endDate = new Date(endDate);
        if (budget !== undefined)
            values.budget = String(budget);
        const [r] = await index_1.db.insert(schema_1.events).values(values).$returningId();
        return { success: true, id: r.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), title: zod_1.z.string().optional(), date: zod_1.z.string().optional(), endDate: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(), location: zod_1.z.string().optional(), description: zod_1.z.string().optional(),
        responsible: zod_1.z.string().optional(), estimatedParticipants: zod_1.z.number().optional(), budget: zod_1.z.number().optional(),
        status: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, date, endDate, budget, ...data } = input;
        const ud = { ...data };
        if (date)
            ud.date = new Date(date);
        if (endDate)
            ud.endDate = new Date(endDate);
        if (budget !== undefined)
            ud.budget = String(budget);
        await index_1.db.update(schema_1.events).set(ud).where((0, drizzle_orm_1.eq)(schema_1.events.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.events).where((0, drizzle_orm_1.eq)(schema_1.events.id, input.id));
        return { success: true };
    }),
});
// ============================================
// QUOTATIONS ROUTER
// ============================================
exports.quotationsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.quotations)
            .where((0, drizzle_orm_1.eq)(schema_1.quotations.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.quotations.createdAt));
    }),
    getById: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [q] = await index_1.db.select().from(schema_1.quotations).where((0, drizzle_orm_1.eq)(schema_1.quotations.id, input.id)).limit(1);
        if (!q)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Cotação não encontrada' });
        const items = await index_1.db.select().from(schema_1.quotationItems).where((0, drizzle_orm_1.eq)(schema_1.quotationItems.quotationId, input.id));
        return { ...q, items };
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), title: zod_1.z.string(),
        supplier1Name: zod_1.z.string().optional(), supplier2Name: zod_1.z.string().optional(), supplier3Name: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const [r] = await index_1.db.insert(schema_1.quotations).values({ ...input, createdById: ctx.userId }).$returningId();
        return { success: true, id: r.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), title: zod_1.z.string().optional(),
        supplier1Name: zod_1.z.string().optional(), supplier2Name: zod_1.z.string().optional(), supplier3Name: zod_1.z.string().optional(),
        winnerSupplier: zod_1.z.string().optional(), status: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.quotations).set(data).where((0, drizzle_orm_1.eq)(schema_1.quotations.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.quotationItems).where((0, drizzle_orm_1.eq)(schema_1.quotationItems.quotationId, input.id));
        await index_1.db.delete(schema_1.quotations).where((0, drizzle_orm_1.eq)(schema_1.quotations.id, input.id));
        return { success: true };
    }),
});
// ============================================
// QUOTATION ITEMS ROUTER
// ============================================
exports.quotationItemsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ quotationId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.quotationItems).where((0, drizzle_orm_1.eq)(schema_1.quotationItems.quotationId, input.quotationId));
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        quotationId: zod_1.z.number(), description: zod_1.z.string(), unit: zod_1.z.string().optional(),
        quantity: zod_1.z.number().optional(), supplier1Price: zod_1.z.number().optional(),
        supplier2Price: zod_1.z.number().optional(), supplier3Price: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { supplier1Price, supplier2Price, supplier3Price, ...rest } = input;
        const values = { ...rest };
        if (supplier1Price !== undefined)
            values.supplier1Price = String(supplier1Price);
        if (supplier2Price !== undefined)
            values.supplier2Price = String(supplier2Price);
        if (supplier3Price !== undefined)
            values.supplier3Price = String(supplier3Price);
        const [r] = await index_1.db.insert(schema_1.quotationItems).values(values).$returningId();
        return { success: true, id: r.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), description: zod_1.z.string().optional(), unit: zod_1.z.string().optional(),
        quantity: zod_1.z.number().optional(), supplier1Price: zod_1.z.number().optional(),
        supplier2Price: zod_1.z.number().optional(), supplier3Price: zod_1.z.number().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, supplier1Price, supplier2Price, supplier3Price, ...data } = input;
        const ud = { ...data };
        if (supplier1Price !== undefined)
            ud.supplier1Price = String(supplier1Price);
        if (supplier2Price !== undefined)
            ud.supplier2Price = String(supplier2Price);
        if (supplier3Price !== undefined)
            ud.supplier3Price = String(supplier3Price);
        await index_1.db.update(schema_1.quotationItems).set(ud).where((0, drizzle_orm_1.eq)(schema_1.quotationItems.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.quotationItems).where((0, drizzle_orm_1.eq)(schema_1.quotationItems.id, input.id));
        return { success: true };
    }),
});
// ============================================
// CLASS COUNCIL ROUTER
// ============================================
exports.classCouncilRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), classId: zod_1.z.number(), bimester: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [cls] = await index_1.db.select({ municipalityId: schema_1.classes.municipalityId }).from(schema_1.classes).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classes.id, input.classId), (0, drizzle_orm_1.eq)(schema_1.classes.municipalityId, input.municipalityId))).limit(1);
        if (!cls)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Turma não encontrada' });
        return index_1.db.select().from(schema_1.classCouncilRecords)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classCouncilRecords.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.classCouncilRecords.bimester, input.bimester)));
    }),
    save: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        classId: zod_1.z.number(),
        bimester: zod_1.z.number(),
        records: zod_1.z.array(zod_1.z.object({
            studentId: zod_1.z.number(),
            decision: zod_1.z.string().optional(),
            observations: zod_1.z.string().optional(),
        })),
        generalNotes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        for (const record of input.records) {
            const existing = await index_1.db.select().from(schema_1.classCouncilRecords)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.classCouncilRecords.classId, input.classId), (0, drizzle_orm_1.eq)(schema_1.classCouncilRecords.bimester, input.bimester), (0, drizzle_orm_1.eq)(schema_1.classCouncilRecords.studentId, record.studentId))).limit(1);
            if (existing.length > 0) {
                await index_1.db.update(schema_1.classCouncilRecords).set({
                    decision: record.decision,
                    observations: record.observations,
                }).where((0, drizzle_orm_1.eq)(schema_1.classCouncilRecords.id, existing[0].id));
            }
            else {
                await index_1.db.insert(schema_1.classCouncilRecords).values({
                    municipalityId: input.municipalityId,
                    classId: input.classId,
                    bimester: input.bimester,
                    studentId: record.studentId,
                    decision: record.decision,
                    observations: record.observations,
                    createdById: ctx.userId,
                });
            }
        }
        if (input.generalNotes !== undefined) {
            await index_1.db.update(schema_1.classes).set({ generalNotes: input.generalNotes }).where((0, drizzle_orm_1.eq)(schema_1.classes.id, input.classId));
        }
        return { success: true };
    }),
});
// ============================================
// VEHICLE INSPECTIONS ROUTER
// ============================================
exports.vehicleInspectionsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.vehicleInspections)
            .where((0, drizzle_orm_1.eq)(schema_1.vehicleInspections.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.vehicleInspections.inspectionDate));
    }),
    listByVehicle: trpc_1.protectedProcedure
        .input(zod_1.z.object({ vehicleId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.vehicleInspections)
            .where((0, drizzle_orm_1.eq)(schema_1.vehicleInspections.vehicleId, input.vehicleId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.vehicleInspections.inspectionDate))
            .limit(1);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), vehicleId: zod_1.z.number(), inspectorName: zod_1.z.string().optional(),
        inspectionDate: zod_1.z.string(), checks: zod_1.z.any().optional(), observations: zod_1.z.string().optional(),
        approvedCount: zod_1.z.number().optional(), rejectedCount: zod_1.z.number().optional(), pendingCount: zod_1.z.number().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { inspectionDate, ...rest } = input;
        const [r] = await index_1.db.insert(schema_1.vehicleInspections).values({
            ...rest, inspectionDate: new Date(inspectionDate), createdById: ctx.userId,
        }).$returningId();
        return { success: true, id: r.id };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.vehicleInspections).where((0, drizzle_orm_1.eq)(schema_1.vehicleInspections.id, input.id));
        return { success: true };
    }),
});
// ============================================
// DOCUMENTS ROUTER
// ============================================
exports.documentsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const docs = await index_1.db.select({
            id: schema_1.documents.id,
            verificationCode: schema_1.documents.verificationCode,
            type: schema_1.documents.type,
            title: schema_1.documents.title,
            status: schema_1.documents.status,
            generatedAt: schema_1.documents.generatedAt,
            generatedById: schema_1.documents.generatedById,
            pdfHash: schema_1.documents.pdfHash,
            pdfSize: schema_1.documents.pdfSize,
            revokedAt: schema_1.documents.revokedAt,
            revokedReason: schema_1.documents.revokedReason,
        }).from(schema_1.documents)
            .where((0, drizzle_orm_1.eq)(schema_1.documents.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.documents.generatedAt));
        // Get signature counts for each document
        const docIds = docs.map(d => d.id);
        let sigCounts = {};
        if (docIds.length > 0) {
            const counts = await index_1.db.select({
                documentId: schema_1.documentSignatures.documentId,
                count: (0, drizzle_orm_1.sql) `COUNT(*)`.as('count'),
            }).from(schema_1.documentSignatures)
                .where((0, drizzle_orm_1.inArray)(schema_1.documentSignatures.documentId, docIds))
                .groupBy(schema_1.documentSignatures.documentId);
            for (const c of counts) {
                sigCounts[c.documentId] = c.count;
            }
        }
        return docs.map(d => ({
            ...d,
            signatureCount: sigCounts[d.id] || 0,
        }));
    }),
    revoke: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(),
        reason: zod_1.z.string().min(3),
    }))
        .mutation(async ({ ctx, input }) => {
        await index_1.db.update(schema_1.documents)
            .set({
            status: 'revoked',
            revokedAt: new Date(),
            revokedById: ctx.userId,
            revokedReason: input.reason,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.documents.id, input.id));
        return { success: true };
    }),
});
// ============================================
// DOCUMENT SIGNATURES ROUTER (SEI-style)
// ============================================
exports.documentSignaturesRouter = trpc_1.t.router({
    // Sign a document (requires password verification)
    sign: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        documentId: zod_1.z.number(),
        password: zod_1.z.string(),
        signerRole: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        // 1. Get user by ctx.userId
        const [user] = await index_1.db.select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            cpf: schema_1.users.cpf,
            passwordHash: schema_1.users.passwordHash,
        }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, ctx.userId)).limit(1);
        if (!user)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
        // 2. Verify password with bcrypt compare
        if (!user.passwordHash)
            throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário sem senha definida' });
        const isValid = await (0, bcryptjs_1.compare)(input.password, user.passwordHash);
        if (!isValid)
            throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta. A assinatura requer sua senha de login.' });
        // 3. Get document to get its pdfHash
        const [doc] = await index_1.db.select({
            id: schema_1.documents.id,
            pdfHash: schema_1.documents.pdfHash,
            status: schema_1.documents.status,
        }).from(schema_1.documents).where((0, drizzle_orm_1.eq)(schema_1.documents.id, input.documentId)).limit(1);
        if (!doc)
            throw new server_1.TRPCError({ code: 'NOT_FOUND', message: 'Documento não encontrado' });
        if (doc.status !== 'valid')
            throw new server_1.TRPCError({ code: 'BAD_REQUEST', message: 'Documento revogado ou expirado não pode ser assinado' });
        // 4. Check if user already signed this document
        const [existing] = await index_1.db.select({ id: schema_1.documentSignatures.id })
            .from(schema_1.documentSignatures)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.documentSignatures.documentId, input.documentId), (0, drizzle_orm_1.eq)(schema_1.documentSignatures.signerId, ctx.userId))).limit(1);
        if (existing)
            throw new server_1.TRPCError({ code: 'CONFLICT', message: 'Você já assinou este documento' });
        // 5. Create signatureHash = SHA-256(pdfHash + signerId + timestamp)
        const now = new Date();
        const signatureHash = (0, crypto_1.createHash)('sha256')
            .update(`${doc.pdfHash}:${user.id}:${now.toISOString()}`)
            .digest('hex');
        // 6. Insert into documentSignatures
        const [result] = await index_1.db.insert(schema_1.documentSignatures).values({
            documentId: input.documentId,
            signerId: user.id,
            signerName: user.name,
            signerRole: input.signerRole || null,
            signerCpf: user.cpf || null,
            signatureHash,
            ipAddress: null, // Will be filled from REST endpoint if needed
            signedAt: now,
        }).$returningId();
        return {
            success: true,
            id: result.id,
            signatureHash,
            signerName: user.name,
            signedAt: now.toISOString(),
        };
    }),
    // List signatures for a document
    listByDocument: trpc_1.protectedProcedure
        .input(zod_1.z.object({ documentId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.documentSignatures)
            .where((0, drizzle_orm_1.eq)(schema_1.documentSignatures.documentId, input.documentId))
            .orderBy(schema_1.documentSignatures.signedAt);
    }),
    // Verify a signature (public)
    verifySignature: trpc_1.publicProcedure
        .input(zod_1.z.object({ signatureId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [sig] = await index_1.db.select().from(schema_1.documentSignatures)
            .where((0, drizzle_orm_1.eq)(schema_1.documentSignatures.id, input.signatureId)).limit(1);
        if (!sig)
            return { valid: false, message: 'Assinatura não encontrada' };
        const [doc] = await index_1.db.select({
            id: schema_1.documents.id,
            verificationCode: schema_1.documents.verificationCode,
            type: schema_1.documents.type,
            title: schema_1.documents.title,
            status: schema_1.documents.status,
            pdfHash: schema_1.documents.pdfHash,
            generatedAt: schema_1.documents.generatedAt,
        }).from(schema_1.documents).where((0, drizzle_orm_1.eq)(schema_1.documents.id, sig.documentId)).limit(1);
        // Recompute hash to verify integrity
        const expectedHash = (0, crypto_1.createHash)('sha256')
            .update(`${doc?.pdfHash}:${sig.signerId}:${sig.signedAt instanceof Date ? sig.signedAt.toISOString() : sig.signedAt}`)
            .digest('hex');
        const hashValid = expectedHash === sig.signatureHash;
        return {
            valid: hashValid && doc?.status === 'valid',
            signatureHash: sig.signatureHash,
            signerName: sig.signerName,
            signerRole: sig.signerRole,
            signerCpf: sig.signerCpf ? sig.signerCpf.replace(/(\d{3})\d{6}(\d{2})/, '$1.***.**$2') : null,
            signedAt: sig.signedAt,
            document: doc ? {
                verificationCode: doc.verificationCode,
                title: doc.title,
                type: doc.type,
                status: doc.status,
                generatedAt: doc.generatedAt,
            } : null,
            hashIntegrity: hashValid ? 'Íntegro' : 'Hash divergente - documento pode ter sido alterado',
        };
    }),
});
// ============================================
// AI / OTIMIZAÇÃO ROUTER
// ============================================
exports.aiRouter = trpc_1.t.router({
    // Analisar todas as rotas de um município
    analyzeRoutes: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const allRoutes = await index_1.db.select().from(schema_1.routes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.routes.isActive, true)));
        const results = [];
        for (const route of allRoutes) {
            const routeStops = await index_1.db.select({
                id: schema_1.stops.id,
                name: schema_1.stops.name,
                latitude: schema_1.stops.latitude,
                longitude: schema_1.stops.longitude,
                orderIndex: schema_1.stops.orderIndex,
            }).from(schema_1.stops)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stops.routeId, route.id), (0, drizzle_orm_1.eq)(schema_1.stops.isActive, true)))
                .orderBy(schema_1.stops.orderIndex);
            // Buscar alunos associados às paradas desta rota
            const stopIds = routeStops.map(s => s.id);
            let routeStudents = [];
            if (stopIds.length > 0) {
                const studs = await index_1.db.select({
                    id: schema_1.students.id,
                    name: schema_1.students.name,
                    latitude: schema_1.students.latitude,
                    longitude: schema_1.students.longitude,
                }).from(schema_1.stopStudents)
                    .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.stopStudents.studentId, schema_1.students.id))
                    .where((0, drizzle_orm_1.inArray)(schema_1.stopStudents.stopId, stopIds));
                routeStudents = studs
                    .filter(s => s.latitude != null && s.longitude != null)
                    .map(s => ({
                    id: s.id,
                    name: s.name,
                    latitude: parseFloat(String(s.latitude)),
                    longitude: parseFloat(String(s.longitude)),
                }));
            }
            const validStops = routeStops
                .filter(s => s.latitude != null && s.longitude != null)
                .map(s => ({
                id: s.id,
                name: s.name,
                latitude: parseFloat(String(s.latitude)),
                longitude: parseFloat(String(s.longitude)),
            }));
            const analysis = (0, routeOptimizer_1.analyzeRoute)(route, validStops, routeStudents);
            results.push({
                routeId: route.id,
                routeName: route.name,
                stopCount: routeStops.length,
                studentCount: routeStudents.length,
                analysis,
            });
        }
        return results;
    }),
    // Otimizar a ordem das paradas de uma rota
    optimizeRoute: trpc_1.adminProcedure
        .input(zod_1.z.object({ routeId: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const routeStops = await index_1.db.select({
            id: schema_1.stops.id,
            name: schema_1.stops.name,
            latitude: schema_1.stops.latitude,
            longitude: schema_1.stops.longitude,
            orderIndex: schema_1.stops.orderIndex,
        }).from(schema_1.stops)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.stops.routeId, input.routeId), (0, drizzle_orm_1.eq)(schema_1.stops.isActive, true)))
            .orderBy(schema_1.stops.orderIndex);
        const validStops = routeStops
            .filter(s => s.latitude != null && s.longitude != null)
            .map(s => ({
            id: s.id,
            name: s.name,
            latitude: parseFloat(String(s.latitude)),
            longitude: parseFloat(String(s.longitude)),
        }));
        if (validStops.length < 2) {
            throw new server_1.TRPCError({
                code: 'BAD_REQUEST',
                message: 'A rota precisa de pelo menos 2 paradas com coordenadas para otimizar.',
            });
        }
        const { optimizedStops, originalDistance, optimizedDistance, savingsPercent } = (0, routeOptimizer_1.optimizeStopOrder)(validStops);
        // Atualizar orderIndex de cada parada no banco
        for (let i = 0; i < optimizedStops.length; i++) {
            await index_1.db.update(schema_1.stops)
                .set({ orderIndex: i })
                .where((0, drizzle_orm_1.eq)(schema_1.stops.id, optimizedStops[i].id));
        }
        // Atualizar distância total da rota
        await index_1.db.update(schema_1.routes)
            .set({ totalDistanceKm: String(optimizedDistance) })
            .where((0, drizzle_orm_1.eq)(schema_1.routes.id, input.routeId));
        return {
            routeId: input.routeId,
            originalDistance,
            optimizedDistance,
            savingsPercent,
            newOrder: optimizedStops.map((s, i) => ({
                stopId: s.id,
                stopName: s.name,
                newIndex: i,
            })),
        };
    }),
    // Sugerir paradas para alunos sem atribuição
    suggestStops: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number(), numClusters: zod_1.z.number().default(5) }))
        .query(async ({ input }) => {
        // Buscar alunos que precisam de transporte mas não têm parada atribuída
        const allStudents = await index_1.db.select({
            id: schema_1.students.id,
            name: schema_1.students.name,
            latitude: schema_1.students.latitude,
            longitude: schema_1.students.longitude,
            address: schema_1.students.address,
            neighborhood: schema_1.students.neighborhood,
        }).from(schema_1.students)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.students.needsTransport, true)));
        // Filtrar alunos que já têm parada
        const assignedStudentIds = await index_1.db.select({ studentId: schema_1.stopStudents.studentId })
            .from(schema_1.stopStudents);
        const assignedSet = new Set(assignedStudentIds.map(a => a.studentId));
        const unassigned = allStudents
            .filter(s => !assignedSet.has(s.id))
            .filter(s => s.latitude != null && s.longitude != null &&
            parseFloat(String(s.latitude)) !== 0 && parseFloat(String(s.longitude)) !== 0)
            .map(s => ({
            id: s.id,
            name: s.name,
            latitude: parseFloat(String(s.latitude)),
            longitude: parseFloat(String(s.longitude)),
            address: s.address,
            neighborhood: s.neighborhood,
        }));
        if (unassigned.length === 0) {
            return {
                totalUnassigned: allStudents.filter(s => !assignedSet.has(s.id)).length,
                withCoordinates: 0,
                clusters: [],
                message: 'Nenhum aluno sem parada com coordenadas GPS cadastradas.',
            };
        }
        const { clusters } = (0, routeOptimizer_1.clusterStudents)(unassigned.map(s => ({ id: s.id, name: s.name, latitude: s.latitude, longitude: s.longitude })), input.numClusters);
        return {
            totalUnassigned: allStudents.filter(s => !assignedSet.has(s.id)).length,
            withCoordinates: unassigned.length,
            clusters: clusters.map((c, idx) => ({
                clusterIndex: idx + 1,
                suggestedName: `Ponto Sugerido ${idx + 1}`,
                center: c.center,
                studentCount: c.students.length,
                students: c.students.map(s => {
                    const full = unassigned.find(u => u.id === s.id);
                    return {
                        id: s.id,
                        name: s.name,
                        address: full?.address || null,
                        neighborhood: full?.neighborhood || null,
                        distanceToCenter: Math.round((0, routeOptimizer_1.haversineDistance)(s.latitude, s.longitude, c.center.latitude, c.center.longitude) * 1000), // em metros
                    };
                }),
                averageRadius: Math.round(c.students.reduce((sum, s) => sum + (0, routeOptimizer_1.haversineDistance)(s.latitude, s.longitude, c.center.latitude, c.center.longitude), 0) / c.students.length * 1000), // raio médio em metros
            })),
        };
    }),
    // Análise de risco de evasão escolar
    studentRiskAnalysis: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        // Buscar todos os alunos do município
        const allStudents = await index_1.db.select({
            id: schema_1.students.id,
            name: schema_1.students.name,
            enrollment: schema_1.students.enrollment,
            schoolId: schema_1.students.schoolId,
            grade: schema_1.students.grade,
        }).from(schema_1.students)
            .where((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, input.municipalityId));
        if (allStudents.length === 0)
            return [];
        const studentIds = allStudents.map(s => s.id);
        // Buscar contagem de ausências por aluno (trip_student_logs where eventType='absent')
        const absenceCounts = await index_1.db.select({
            studentId: schema_1.tripStudentLogs.studentId,
            count: (0, drizzle_orm_1.sql) `COUNT(*)`.as('count'),
        }).from(schema_1.tripStudentLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.tripStudentLogs.studentId, studentIds), (0, drizzle_orm_1.eq)(schema_1.tripStudentLogs.eventType, 'absent')))
            .groupBy(schema_1.tripStudentLogs.studentId);
        const absenceMap = new Map(absenceCounts.map(a => [a.studentId, Number(a.count)]));
        // Buscar médias de notas por aluno
        const gradeAvgs = await index_1.db.select({
            studentId: schema_1.studentGrades.studentId,
            avg: (0, drizzle_orm_1.sql) `AVG(${schema_1.studentGrades.score})`.as('avg'),
        }).from(schema_1.studentGrades)
            .where((0, drizzle_orm_1.inArray)(schema_1.studentGrades.studentId, studentIds))
            .groupBy(schema_1.studentGrades.studentId);
        const gradeMap = new Map(gradeAvgs.map(g => [g.studentId, Number(g.avg)]));
        // Buscar contagem de ocorrências por aluno
        const occCounts = await index_1.db.select({
            studentId: schema_1.studentOccurrences.studentId,
            count: (0, drizzle_orm_1.sql) `COUNT(*)`.as('count'),
        }).from(schema_1.studentOccurrences)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.studentOccurrences.municipalityId, input.municipalityId), (0, drizzle_orm_1.inArray)(schema_1.studentOccurrences.studentId, studentIds)))
            .groupBy(schema_1.studentOccurrences.studentId);
        const occMap = new Map(occCounts.map(o => [o.studentId, Number(o.count)]));
        // Buscar status de matrícula (evadido/transferido = já em risco)
        const enrollmentStatuses = await index_1.db.select({
            studentId: schema_1.enrollments.studentId,
            status: schema_1.enrollments.status,
        }).from(schema_1.enrollments)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.enrollments.municipalityId, input.municipalityId), (0, drizzle_orm_1.inArray)(schema_1.enrollments.studentId, studentIds), (0, drizzle_orm_1.inArray)(schema_1.enrollments.status, ['transferred', 'evaded'])));
        const atRiskEnrollment = new Set(enrollmentStatuses.map(e => e.studentId));
        // Calcular score de risco para cada aluno
        const results = allStudents.map(student => {
            let riskScore = 0;
            const riskFactors = [];
            // Ausências
            const absences = absenceMap.get(student.id) || 0;
            if (absences > 10) {
                riskScore += 30;
                riskFactors.push(`${absences} ausências no transporte (crítico)`);
            }
            else if (absences > 5) {
                riskScore += 15;
                riskFactors.push(`${absences} ausências no transporte`);
            }
            // Notas
            const avgGrade = gradeMap.get(student.id);
            if (avgGrade !== undefined) {
                if (avgGrade < 5.0) {
                    riskScore += 25;
                    riskFactors.push(`Média ${avgGrade.toFixed(1)} (abaixo de 5.0 - crítico)`);
                }
                else if (avgGrade < 7.0) {
                    riskScore += 10;
                    riskFactors.push(`Média ${avgGrade.toFixed(1)} (abaixo de 7.0)`);
                }
            }
            // Ocorrências
            const occurrences = occMap.get(student.id) || 0;
            if (occurrences > 3) {
                riskScore += 20;
                riskFactors.push(`${occurrences} ocorrências registradas (crítico)`);
            }
            else if (occurrences > 1) {
                riskScore += 10;
                riskFactors.push(`${occurrences} ocorrências registradas`);
            }
            // Matrícula em risco (transferido/evadido)
            if (atRiskEnrollment.has(student.id)) {
                riskScore += 15;
                riskFactors.push('Matrícula transferida ou evadida');
            }
            // Frequência baixa no transporte (muitas ausências proporcionais)
            if (absences > 3 && absences <= 5) {
                riskScore += 5;
                riskFactors.push('Frequência irregular no transporte');
            }
            riskScore = Math.min(100, riskScore);
            let riskLevel;
            if (riskScore >= 60)
                riskLevel = 'critico';
            else if (riskScore >= 40)
                riskLevel = 'alto';
            else if (riskScore >= 20)
                riskLevel = 'moderado';
            else
                riskLevel = 'baixo';
            return {
                studentId: student.id,
                studentName: student.name,
                enrollment: student.enrollment,
                schoolId: student.schoolId,
                grade: student.grade,
                riskScore,
                riskLevel,
                riskFactors,
                absences,
                avgGrade: avgGrade !== undefined ? Math.round(avgGrade * 10) / 10 : null,
                occurrences,
            };
        });
        // Ordenar por risco (maior primeiro), filtrar apenas quem tem algum risco
        return results
            .filter(r => r.riskScore > 0)
            .sort((a, b) => b.riskScore - a.riskScore);
    }),
});
// ============================================
// CHAT ROUTER
// ============================================
exports.chatRouter = trpc_1.t.router({
    // Listar conversas do usuario
    conversations: trpc_1.protectedProcedure
        .query(async ({ ctx }) => {
        const userId = ctx.userId;
        const convos = await index_1.db.select({
            id: schema_1.chatConversations.id,
            participant1Id: schema_1.chatConversations.participant1Id,
            participant2Id: schema_1.chatConversations.participant2Id,
            lastMessageAt: schema_1.chatConversations.lastMessageAt,
            municipalityId: schema_1.chatConversations.municipalityId,
        })
            .from(schema_1.chatConversations)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.chatConversations.participant1Id, userId), (0, drizzle_orm_1.eq)(schema_1.chatConversations.participant2Id, userId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatConversations.lastMessageAt));
        // Buscar dados dos outros participantes e ultima mensagem
        const results = [];
        for (const c of convos) {
            const otherUserId = c.participant1Id === userId ? c.participant2Id : c.participant1Id;
            const [otherUser] = await index_1.db.select({ id: schema_1.users.id, name: schema_1.users.name, role: schema_1.users.role, avatarUrl: schema_1.users.avatarUrl })
                .from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, otherUserId)).limit(1);
            const [lastMsg] = await index_1.db.select({ content: schema_1.chatMessages.content, senderId: schema_1.chatMessages.senderId, createdAt: schema_1.chatMessages.createdAt })
                .from(schema_1.chatMessages).where((0, drizzle_orm_1.eq)(schema_1.chatMessages.conversationId, c.id)).orderBy((0, drizzle_orm_1.desc)(schema_1.chatMessages.createdAt)).limit(1);
            const [unreadResult] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
                .from(schema_1.chatMessages)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMessages.conversationId, c.id), (0, drizzle_orm_1.eq)(schema_1.chatMessages.isRead, false), (0, drizzle_orm_1.sql) `${schema_1.chatMessages.senderId} != ${userId}`));
            results.push({
                id: c.id,
                otherUser: otherUser || { id: otherUserId, name: 'Usuario', role: 'parent', avatarUrl: null },
                lastMessage: lastMsg || null,
                unreadCount: unreadResult?.count || 0,
                lastMessageAt: c.lastMessageAt,
            });
        }
        return results;
    }),
    // Historico de mensagens de uma conversa
    history: trpc_1.protectedProcedure
        .input(zod_1.z.object({ conversationId: zod_1.z.number(), limit: zod_1.z.number().default(50) }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.userId;
        // Verificar que o usuario participa da conversa
        const [conv] = await index_1.db.select().from(schema_1.chatConversations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatConversations.id, input.conversationId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.chatConversations.participant1Id, userId), (0, drizzle_orm_1.eq)(schema_1.chatConversations.participant2Id, userId)))).limit(1);
        if (!conv)
            throw new server_1.TRPCError({ code: 'FORBIDDEN', message: 'Voce nao participa desta conversa' });
        const msgs = await index_1.db.select({
            id: schema_1.chatMessages.id,
            content: schema_1.chatMessages.content,
            senderId: schema_1.chatMessages.senderId,
            isRead: schema_1.chatMessages.isRead,
            createdAt: schema_1.chatMessages.createdAt,
        })
            .from(schema_1.chatMessages)
            .where((0, drizzle_orm_1.eq)(schema_1.chatMessages.conversationId, input.conversationId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatMessages.createdAt))
            .limit(input.limit);
        // Marcar como lidas as mensagens do outro usuario
        await index_1.db.update(schema_1.chatMessages)
            .set({ isRead: true, readAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMessages.conversationId, input.conversationId), (0, drizzle_orm_1.eq)(schema_1.chatMessages.isRead, false), (0, drizzle_orm_1.sql) `${schema_1.chatMessages.senderId} != ${userId}`));
        return msgs.reverse();
    }),
    // Enviar mensagem
    send: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        recipientId: zod_1.z.number(),
        content: zod_1.z.string().min(1).max(2000),
    }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.userId;
        const municipalityId = ctx.municipalityId || 1;
        // Buscar ou criar conversa
        let [conv] = await index_1.db.select().from(schema_1.chatConversations)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatConversations.participant1Id, userId), (0, drizzle_orm_1.eq)(schema_1.chatConversations.participant2Id, input.recipientId)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatConversations.participant1Id, input.recipientId), (0, drizzle_orm_1.eq)(schema_1.chatConversations.participant2Id, userId)))).limit(1);
        if (!conv) {
            const [newConv] = await index_1.db.insert(schema_1.chatConversations).values({
                municipalityId,
                participant1Id: userId,
                participant2Id: input.recipientId,
                lastMessageAt: new Date(),
            }).$returningId();
            [conv] = await index_1.db.select().from(schema_1.chatConversations).where((0, drizzle_orm_1.eq)(schema_1.chatConversations.id, newConv.id)).limit(1);
        }
        // Inserir mensagem
        const [msg] = await index_1.db.insert(schema_1.chatMessages).values({
            conversationId: conv.id,
            senderId: userId,
            content: input.content,
        }).$returningId();
        // Atualizar lastMessageAt da conversa
        await index_1.db.update(schema_1.chatConversations)
            .set({ lastMessageAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chatConversations.id, conv.id));
        // Buscar nome do remetente para a notificacao
        const [sender] = await index_1.db.select({ name: schema_1.users.name }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        // Emitir via Socket.IO para o destinatario
        (0, socketInstance_1.emitToUser)(input.recipientId, 'chat:message', {
            conversationId: conv.id,
            messageId: msg.id,
            senderId: userId,
            senderName: sender?.name || 'Usuario',
            content: input.content,
            createdAt: new Date().toISOString(),
        });
        return { success: true, conversationId: conv.id, messageId: msg.id };
    }),
    // Contar mensagens nao lidas totais
    unreadTotal: trpc_1.protectedProcedure
        .query(async ({ ctx }) => {
        const userId = ctx.userId;
        // Buscar conversas do usuario
        const convos = await index_1.db.select({ id: schema_1.chatConversations.id })
            .from(schema_1.chatConversations)
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.chatConversations.participant1Id, userId), (0, drizzle_orm_1.eq)(schema_1.chatConversations.participant2Id, userId)));
        if (convos.length === 0)
            return { count: 0 };
        const convoIds = convos.map(c => c.id);
        const [result] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.chatMessages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.chatMessages.conversationId, convoIds), (0, drizzle_orm_1.eq)(schema_1.chatMessages.isRead, false), (0, drizzle_orm_1.sql) `${schema_1.chatMessages.senderId} != ${userId}`));
        return { count: result?.count || 0 };
    }),
    // Buscar usuarios disponiveis para chat (staff da secretaria para pais, pais para staff)
    availableContacts: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ ctx, input }) => {
        const userId = ctx.userId;
        const [currentUser] = await index_1.db.select({ role: schema_1.users.role }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId)).limit(1);
        if (!currentUser)
            return [];
        // Pais veem staff (secretary, school_admin, municipal_admin)
        // Staff ve pais (parent)
        const targetRoles = currentUser.role === 'parent'
            ? ['secretary', 'school_admin', 'municipal_admin', 'super_admin']
            : ['parent'];
        const contacts = await index_1.db.select({
            id: schema_1.users.id, name: schema_1.users.name, role: schema_1.users.role, avatarUrl: schema_1.users.avatarUrl
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.users.isActive, true), (0, drizzle_orm_1.inArray)(schema_1.users.role, targetRoles), (0, drizzle_orm_1.sql) `${schema_1.users.id} != ${userId}`))
            .orderBy(schema_1.users.name)
            .limit(100);
        return contacts;
    }),
    // Marcar mensagens de uma conversa como lidas
    markRead: trpc_1.protectedProcedure
        .input(zod_1.z.object({ conversationId: zod_1.z.number() }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.userId;
        await index_1.db.update(schema_1.chatMessages)
            .set({ isRead: true, readAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMessages.conversationId, input.conversationId), (0, drizzle_orm_1.eq)(schema_1.chatMessages.isRead, false), (0, drizzle_orm_1.sql) `${schema_1.chatMessages.senderId} != ${userId}`));
        return { success: true };
    }),
});
// ============================================
// GRADE HORÁRIA ROUTER
// ============================================
exports.classSchedulesRouter = trpc_1.t.router({
    get: trpc_1.protectedProcedure
        .input(zod_1.z.object({ classId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [row] = await index_1.db.select().from(schema_1.classSchedules)
            .where((0, drizzle_orm_1.eq)(schema_1.classSchedules.classId, input.classId))
            .limit(1);
        if (!row)
            return null;
        return { ...row, schedule: row.scheduleJson ? JSON.parse(row.scheduleJson) : {} };
    }),
    save: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        classId: zod_1.z.number(),
        municipalityId: zod_1.z.number(),
        schedule: zod_1.z.string(),
    }))
        .mutation(async ({ input }) => {
        const [existing] = await index_1.db.select().from(schema_1.classSchedules)
            .where((0, drizzle_orm_1.eq)(schema_1.classSchedules.classId, input.classId))
            .limit(1);
        if (existing) {
            await index_1.db.update(schema_1.classSchedules)
                .set({ scheduleJson: input.schedule })
                .where((0, drizzle_orm_1.eq)(schema_1.classSchedules.classId, input.classId));
        }
        else {
            await index_1.db.insert(schema_1.classSchedules).values({
                classId: input.classId,
                municipalityId: input.municipalityId,
                scheduleJson: input.schedule,
            });
        }
        return { success: true };
    }),
});
// ============================================
// MURAL INFORMATIVO ROUTER
// ============================================
exports.bulletinsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.bulletins)
            .where((0, drizzle_orm_1.eq)(schema_1.bulletins.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.bulletins.pinned), (0, drizzle_orm_1.desc)(schema_1.bulletins.createdAt));
    }),
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        title: zod_1.z.string().min(1),
        content: zod_1.z.string().min(1),
        category: zod_1.z.string().optional(),
        author: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [r] = await index_1.db.insert(schema_1.bulletins).values(input).$returningId();
        return { success: true, id: r.id };
    }),
    togglePin: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        const [row] = await index_1.db.select().from(schema_1.bulletins).where((0, drizzle_orm_1.eq)(schema_1.bulletins.id, input.id)).limit(1);
        if (!row)
            throw new server_1.TRPCError({ code: 'NOT_FOUND' });
        await index_1.db.update(schema_1.bulletins).set({ pinned: !row.pinned }).where((0, drizzle_orm_1.eq)(schema_1.bulletins.id, input.id));
        return { success: true, pinned: !row.pinned };
    }),
    delete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.delete(schema_1.bulletins).where((0, drizzle_orm_1.eq)(schema_1.bulletins.id, input.id));
        return { success: true };
    }),
});
// ============================================
// PROTOCOLOS ROUTER
// ============================================
exports.protocolsRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.protocols)
            .where((0, drizzle_orm_1.eq)(schema_1.protocols.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.protocols.createdAt));
    }),
    create: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        requester: zod_1.z.string().min(1),
        type: zod_1.z.string().optional(),
        subject: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const year = new Date().getFullYear();
        const [countResult] = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.protocols)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.protocols.municipalityId, input.municipalityId), (0, drizzle_orm_1.gte)(schema_1.protocols.date, new Date(year, 0, 1)), (0, drizzle_orm_1.lte)(schema_1.protocols.date, new Date(year, 11, 31, 23, 59, 59))));
        const seq = Number(countResult?.count || 0) + 1;
        const number = String(seq).padStart(4, '0') + '/' + year;
        const [r] = await index_1.db.insert(schema_1.protocols).values({ ...input, number }).$returningId();
        return { success: true, id: r.id, number };
    }),
    updateStatus: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), status: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.protocols).set({ status: input.status }).where((0, drizzle_orm_1.eq)(schema_1.protocols.id, input.id));
        return { success: true };
    }),
    addResponse: trpc_1.protectedProcedure
        .input(zod_1.z.object({ id: zod_1.z.number(), response: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.protocols).set({ response: input.response, status: 'concluido' }).where((0, drizzle_orm_1.eq)(schema_1.protocols.id, input.id));
        return { success: true };
    }),
});
// ============================================
// SETE (FNDE) - FORNECEDORES
// ============================================
const suppliersRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.suppliers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.suppliers.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.suppliers.isActive, true)))
            .orderBy(schema_1.suppliers.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), name: zod_1.z.string(), type: zod_1.z.string().optional(),
        cnpj: zod_1.z.string().optional(), cpf: zod_1.z.string().optional(),
        contactName: zod_1.z.string().optional(), phone: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(), address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(), state: zod_1.z.string().optional(), cep: zod_1.z.string().optional(),
        specialties: zod_1.z.string().optional(), rating: zod_1.z.number().optional(), notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [r] = await index_1.db.insert(schema_1.suppliers).values(input).$returningId();
        return { success: true, id: r.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), name: zod_1.z.string().optional(), type: zod_1.z.string().optional(),
        cnpj: zod_1.z.string().optional(), cpf: zod_1.z.string().optional(),
        contactName: zod_1.z.string().optional(), phone: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(), address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(), state: zod_1.z.string().optional(), cep: zod_1.z.string().optional(),
        specialties: zod_1.z.string().optional(), rating: zod_1.z.number().optional(), notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.suppliers).set(data).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.suppliers).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.suppliers.id, input.id));
        return { success: true };
    }),
});
// ============================================
// SETE (FNDE) - ORDENS DE SERVICO
// ============================================
const serviceOrdersRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.serviceOrders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.serviceOrders.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.serviceOrders.isActive, true)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.serviceOrders.openedAt));
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), vehicleId: zod_1.z.number(), supplierId: zod_1.z.number().optional(),
        number: zod_1.z.string(), type: zod_1.z.string().optional(), priority: zod_1.z.string().optional(),
        description: zod_1.z.string(), diagnosis: zod_1.z.string().optional(), solution: zod_1.z.string().optional(),
        parts: zod_1.z.string().optional(), laborCost: zod_1.z.string().optional(), partsCost: zod_1.z.string().optional(),
        totalCost: zod_1.z.string().optional(), kmAtService: zod_1.z.number().optional(),
        estimatedCompletionAt: zod_1.z.string().optional(), invoiceNumber: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { estimatedCompletionAt, ...rest } = input;
        const [r] = await index_1.db.insert(schema_1.serviceOrders).values({
            ...rest, requestedById: ctx.userId,
            estimatedCompletionAt: estimatedCompletionAt ? new Date(estimatedCompletionAt) : undefined,
        }).$returningId();
        return { success: true, id: r.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), supplierId: zod_1.z.number().optional(),
        type: zod_1.z.string().optional(), priority: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(), diagnosis: zod_1.z.string().optional(), solution: zod_1.z.string().optional(),
        parts: zod_1.z.string().optional(), laborCost: zod_1.z.string().optional(), partsCost: zod_1.z.string().optional(),
        totalCost: zod_1.z.string().optional(), kmAtService: zod_1.z.number().optional(),
        status: zod_1.z.string().optional(), invoiceNumber: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        startedAt: zod_1.z.string().optional(), completedAt: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, startedAt, completedAt, ...rest } = input;
        const data = { ...rest };
        if (startedAt)
            data.startedAt = new Date(startedAt);
        if (completedAt)
            data.completedAt = new Date(completedAt);
        if (input.status === 'aprovada')
            data.approvedById = ctx.userId;
        await index_1.db.update(schema_1.serviceOrders).set(data).where((0, drizzle_orm_1.eq)(schema_1.serviceOrders.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.serviceOrders).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.serviceOrders.id, input.id));
        return { success: true };
    }),
    nextNumber: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const [last] = await index_1.db.select({ number: schema_1.serviceOrders.number }).from(schema_1.serviceOrders)
            .where((0, drizzle_orm_1.eq)(schema_1.serviceOrders.municipalityId, input.municipalityId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.serviceOrders.id)).limit(1);
        if (!last)
            return 'OS-001';
        const num = parseInt(last.number.replace(/\D/g, '') || '0') + 1;
        return `OS-${String(num).padStart(3, '0')}`;
    }),
});
// ============================================
// SETE (FNDE) - GARAGENS
// ============================================
const garagesRouter = trpc_1.t.router({
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        return index_1.db.select().from(schema_1.garages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.garages.municipalityId, input.municipalityId), (0, drizzle_orm_1.eq)(schema_1.garages.isActive, true)))
            .orderBy(schema_1.garages.name);
    }),
    create: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(), name: zod_1.z.string(),
        address: zod_1.z.string().optional(), city: zod_1.z.string().optional(), state: zod_1.z.string().optional(),
        cep: zod_1.z.string().optional(), latitude: zod_1.z.string().optional(), longitude: zod_1.z.string().optional(),
        capacity: zod_1.z.number().optional(), contactName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(), type: zod_1.z.string().optional(), notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const [r] = await index_1.db.insert(schema_1.garages).values(input).$returningId();
        return { success: true, id: r.id };
    }),
    update: trpc_1.adminProcedure
        .input(zod_1.z.object({
        id: zod_1.z.number(), name: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(), city: zod_1.z.string().optional(), state: zod_1.z.string().optional(),
        cep: zod_1.z.string().optional(), latitude: zod_1.z.string().optional(), longitude: zod_1.z.string().optional(),
        capacity: zod_1.z.number().optional(), contactName: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(), type: zod_1.z.string().optional(), notes: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await index_1.db.update(schema_1.garages).set(data).where((0, drizzle_orm_1.eq)(schema_1.garages.id, id));
        return { success: true };
    }),
    delete: trpc_1.adminProcedure
        .input(zod_1.z.object({ id: zod_1.z.number() }))
        .mutation(async ({ input }) => {
        await index_1.db.update(schema_1.garages).set({ isActive: false }).where((0, drizzle_orm_1.eq)(schema_1.garages.id, input.id));
        return { success: true };
    }),
});
// ============================================
// BACKUP DE DADOS (JSON)
// ============================================
const backupRouter = trpc_1.t.router({
    // Estatísticas de registros por tabela
    stats: trpc_1.adminProcedure
        .input(zod_1.z.object({ municipalityId: zod_1.z.number() }))
        .query(async ({ input }) => {
        const mid = input.municipalityId;
        const countQuery = async (table) => {
            const result = await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(table).where((0, drizzle_orm_1.eq)(table.municipalityId, mid));
            return Number(result[0]?.count || 0);
        };
        return {
            schools: await countQuery(schema_1.schools),
            students: await countQuery(schema_1.students),
            routes: await countQuery(schema_1.routes),
            vehicles: await countQuery(schema_1.vehicles),
            drivers: await countQuery(schema_1.drivers),
            guardians: await index_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.guardians)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.guardians.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, mid))
                .then(r => Number(r[0]?.count || 0)),
            enrollments: await countQuery(schema_1.enrollments),
            classes: await countQuery(schema_1.classes),
            subjects: await countQuery(schema_1.subjects),
            classGrades: await countQuery(schema_1.classGrades),
            academicYears: await countQuery(schema_1.academicYears),
            teachers: await countQuery(schema_1.teachers),
            monitorStaff: await countQuery(schema_1.monitorStaff),
            contracts: await countQuery(schema_1.contracts),
            fuelRecords: await countQuery(schema_1.fuelRecords),
            maintenanceRecords: await countQuery(schema_1.maintenanceRecords),
            mealMenus: await countQuery(schema_1.mealMenus),
            libraryBooks: await countQuery(schema_1.libraryBooks),
            assets: await countQuery(schema_1.assets),
            inventoryItems: await countQuery(schema_1.inventoryItems),
            financialAccounts: await countQuery(schema_1.financialAccounts),
            financialTransactions: await countQuery(schema_1.financialTransactions),
            positions: await countQuery(schema_1.positions),
            departments: await countQuery(schema_1.departments),
            staffAllocations: await countQuery(schema_1.staffAllocations),
            events: await countQuery(schema_1.events),
            messages: await countQuery(schema_1.messages),
            schoolCalendar: await countQuery(schema_1.schoolCalendar),
            bulletins: await countQuery(schema_1.bulletins),
            protocols: await countQuery(schema_1.protocols),
            documents: await countQuery(schema_1.documents),
            quotations: await countQuery(schema_1.quotations),
            vehicleInspections: await countQuery(schema_1.vehicleInspections),
        };
    }),
    // Exportar todos os dados do município como JSON
    exportAll: trpc_1.adminProcedure
        .input(zod_1.z.object({
        municipalityId: zod_1.z.number(),
        tables: zod_1.z.array(zod_1.z.string()).optional(),
    }))
        .mutation(async ({ input }) => {
        const mid = input.municipalityId;
        const selectedTables = input.tables; // se undefined, exporta tudo
        const shouldExport = (name) => !selectedTables || selectedTables.includes(name);
        const q = async (table) => index_1.db.select().from(table).where((0, drizzle_orm_1.eq)(table.municipalityId, mid));
        const data = {};
        // Município
        if (shouldExport('municipality')) {
            data.municipality = await index_1.db.select().from(schema_1.municipalities).where((0, drizzle_orm_1.eq)(schema_1.municipalities.id, mid));
        }
        if (shouldExport('municipalityResponsibles')) {
            data.municipalityResponsibles = await index_1.db.select().from(schema_1.municipalityResponsibles).where((0, drizzle_orm_1.eq)(schema_1.municipalityResponsibles.municipalityId, mid));
        }
        // Escolas e Ensino
        if (shouldExport('schools'))
            data.schools = await q(schema_1.schools);
        if (shouldExport('students'))
            data.students = await q(schema_1.students);
        // guardians não tem municipalityId - exportar via join com students
        if (shouldExport('guardians')) {
            data.guardians = await index_1.db.select().from(schema_1.guardians)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.guardians.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, mid))
                .then(rows => rows.map(r => r.guardians));
        }
        if (shouldExport('enrollments'))
            data.enrollments = await q(schema_1.enrollments);
        if (shouldExport('classes'))
            data.classes = await q(schema_1.classes);
        if (shouldExport('classGrades'))
            data.classGrades = await q(schema_1.classGrades);
        if (shouldExport('subjects'))
            data.subjects = await q(schema_1.subjects);
        // classSubjects não tem municipalityId - exportar via join com classes
        if (shouldExport('classSubjects')) {
            data.classSubjects = await index_1.db.select().from(schema_1.classSubjects)
                .innerJoin(schema_1.classes, (0, drizzle_orm_1.eq)(schema_1.classSubjects.classId, schema_1.classes.id))
                .where((0, drizzle_orm_1.eq)(schema_1.classes.municipalityId, mid))
                .then(rows => rows.map(r => r.class_subjects));
        }
        if (shouldExport('academicYears'))
            data.academicYears = await q(schema_1.academicYears);
        if (shouldExport('teachers'))
            data.teachers = await q(schema_1.teachers);
        // dailyAttendance não tem municipalityId - via students
        if (shouldExport('dailyAttendance')) {
            data.dailyAttendance = await index_1.db.select().from(schema_1.dailyAttendance)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.dailyAttendance.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, mid))
                .then(rows => rows.map(r => r.daily_attendance));
        }
        if (shouldExport('assessments'))
            data.assessments = await q(schema_1.assessments);
        // studentGrades não tem municipalityId - via assessments
        if (shouldExport('studentGrades')) {
            data.studentGrades = await index_1.db.select().from(schema_1.studentGrades)
                .innerJoin(schema_1.assessments, (0, drizzle_orm_1.eq)(schema_1.studentGrades.assessmentId, schema_1.assessments.id))
                .where((0, drizzle_orm_1.eq)(schema_1.assessments.municipalityId, mid))
                .then(rows => rows.map(r => r.student_grades));
        }
        if (shouldExport('lessonPlans'))
            data.lessonPlans = await q(schema_1.lessonPlans);
        if (shouldExport('descriptiveReports'))
            data.descriptiveReports = await q(schema_1.descriptiveReports);
        if (shouldExport('classCouncilRecords'))
            data.classCouncilRecords = await q(schema_1.classCouncilRecords);
        if (shouldExport('classSchedules'))
            data.classSchedules = await q(schema_1.classSchedules);
        // Transporte
        if (shouldExport('routes'))
            data.routes = await q(schema_1.routes);
        // stops não tem municipalityId - exportar via join com routes
        if (shouldExport('stops')) {
            data.stops = await index_1.db.select().from(schema_1.stops)
                .innerJoin(schema_1.routes, (0, drizzle_orm_1.eq)(schema_1.stops.routeId, schema_1.routes.id))
                .where((0, drizzle_orm_1.eq)(schema_1.routes.municipalityId, mid))
                .then(rows => rows.map(r => r.stops));
        }
        if (shouldExport('vehicles'))
            data.vehicles = await q(schema_1.vehicles);
        if (shouldExport('drivers'))
            data.drivers = await q(schema_1.drivers);
        if (shouldExport('monitorStaff'))
            data.monitorStaff = await q(schema_1.monitorStaff);
        if (shouldExport('fuelRecords'))
            data.fuelRecords = await q(schema_1.fuelRecords);
        if (shouldExport('maintenanceRecords'))
            data.maintenanceRecords = await q(schema_1.maintenanceRecords);
        if (shouldExport('vehicleInspections'))
            data.vehicleInspections = await q(schema_1.vehicleInspections);
        if (shouldExport('contracts'))
            data.contracts = await q(schema_1.contracts);
        // RH
        if (shouldExport('positions'))
            data.positions = await q(schema_1.positions);
        if (shouldExport('departments'))
            data.departments = await q(schema_1.departments);
        if (shouldExport('staffAllocations'))
            data.staffAllocations = await q(schema_1.staffAllocations);
        if (shouldExport('staffEvaluations'))
            data.staffEvaluations = await q(schema_1.staffEvaluations);
        // Financeiro
        if (shouldExport('financialAccounts'))
            data.financialAccounts = await q(schema_1.financialAccounts);
        if (shouldExport('financialTransactions'))
            data.financialTransactions = await q(schema_1.financialTransactions);
        // Operacional
        if (shouldExport('mealMenus'))
            data.mealMenus = await q(schema_1.mealMenus);
        if (shouldExport('libraryBooks'))
            data.libraryBooks = await q(schema_1.libraryBooks);
        // libraryLoans não tem municipalityId - via libraryBooks
        if (shouldExport('libraryLoans')) {
            data.libraryLoans = await index_1.db.select().from(schema_1.libraryLoans)
                .innerJoin(schema_1.libraryBooks, (0, drizzle_orm_1.eq)(schema_1.libraryLoans.bookId, schema_1.libraryBooks.id))
                .where((0, drizzle_orm_1.eq)(schema_1.libraryBooks.municipalityId, mid))
                .then(rows => rows.map(r => r.library_loans));
        }
        if (shouldExport('assets'))
            data.assets = await q(schema_1.assets);
        if (shouldExport('inventoryItems'))
            data.inventoryItems = await q(schema_1.inventoryItems);
        // Comunicação e Documentos
        if (shouldExport('messages'))
            data.messages = await q(schema_1.messages);
        if (shouldExport('events'))
            data.events = await q(schema_1.events);
        if (shouldExport('documents'))
            data.documents = await q(schema_1.documents);
        if (shouldExport('schoolCalendar'))
            data.schoolCalendar = await q(schema_1.schoolCalendar);
        if (shouldExport('waitingList'))
            data.waitingList = await q(schema_1.waitingList);
        // studentDocuments não tem municipalityId - via students
        if (shouldExport('studentDocuments')) {
            data.studentDocuments = await index_1.db.select().from(schema_1.studentDocuments)
                .innerJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.studentDocuments.studentId, schema_1.students.id))
                .where((0, drizzle_orm_1.eq)(schema_1.students.municipalityId, mid))
                .then(rows => rows.map(r => r.student_documents));
        }
        if (shouldExport('studentHistory'))
            data.studentHistory = await q(schema_1.studentHistory);
        if (shouldExport('studentOccurrences'))
            data.studentOccurrences = await q(schema_1.studentOccurrences);
        if (shouldExport('bulletins'))
            data.bulletins = await q(schema_1.bulletins);
        if (shouldExport('protocols'))
            data.protocols = await q(schema_1.protocols);
        if (shouldExport('quotations'))
            data.quotations = await q(schema_1.quotations);
        // quotationItems não tem municipalityId - via quotations
        if (shouldExport('quotationItems')) {
            data.quotationItems = await index_1.db.select().from(schema_1.quotationItems)
                .innerJoin(schema_1.quotations, (0, drizzle_orm_1.eq)(schema_1.quotationItems.quotationId, schema_1.quotations.id))
                .where((0, drizzle_orm_1.eq)(schema_1.quotations.municipalityId, mid))
                .then(rows => rows.map(r => r.quotation_items));
        }
        if (shouldExport('formFieldConfigs'))
            data.formFieldConfigs = await q(schema_1.formFieldConfigs);
        // Metadados
        data._metadata = {
            exportedAt: new Date().toISOString(),
            version: '3.9.0',
            system: 'NetEscol',
            municipalityId: mid,
            tableCount: Object.keys(data).filter(k => k !== '_metadata').length,
            totalRecords: Object.entries(data).filter(([k]) => k !== '_metadata').reduce((sum, [, v]) => sum + (Array.isArray(v) ? v.length : 0), 0),
        };
        return data;
    }),
});
// ============================================
// MAIN ROUTER
// ============================================
exports.appRouter = trpc_1.t.router({
    auth: exports.authRouter,
    municipalities: exports.municipalitiesRouter,
    schools: exports.schoolsRouter,
    routes: exports.routesRouter,
    stops: exports.stopsRouter,
    students: exports.studentsRouter,
    studentHistory: exports.studentHistoryRouter,
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
    fuel: exports.fuelRouter,
    location: locationRouter,
    // Módulo Acadêmico
    academicYears: exports.academicYearsRouter,
    classGrades: exports.classGradesRouter,
    subjects: exports.subjectsRouter,
    classes: exports.classesRouter,
    enrollments: exports.enrollmentsRouter,
    teachers: exports.teachersRouter,
    classSubjects: exports.classSubjectsRouter,
    // Módulo Diário Escolar
    diaryAttendance: exports.diaryAttendanceRouter,
    assessments: exports.assessmentsRouter,
    studentGrades: exports.studentGradesRouter,
    lessonPlans: exports.lessonPlansRouter,
    // Módulo RH
    positions: exports.positionsRouter,
    departments: exports.departmentsRouter,
    staffAllocations: exports.staffAllocationsRouter,
    staffEvaluations: exports.staffEvaluationsRouter,
    // Módulo Financeiro
    financialAccounts: exports.financialAccountsRouter,
    financialTransactions: exports.financialTransactionsRouter,
    // Módulo Operacional
    mealMenus: exports.mealMenusRouter,
    libraryBooks: exports.libraryBooksRouter,
    libraryLoans: exports.libraryLoansRouter,
    assets: exports.assetsRouter,
    inventory: exports.inventoryRouter,
    // Integrações (Fase 7)
    educacenso: exports.educacensoRouter,
    transparency: exports.transparencyRouter,
    // Funcionalidades Adicionais
    descriptiveReports: exports.descriptiveReportsRouter,
    schoolCalendar: exports.schoolCalendarRouter,
    messages: exports.messagesRouter,
    waitingList: exports.waitingListRouter,
    studentDocuments: exports.studentDocumentsRouter,
    // Configuração de Formulários
    formConfig: exports.formConfigRouter,
    // Novos Módulos
    studentOccurrences: exports.studentOccurrencesRouter,
    events: exports.eventsRouter,
    quotations: exports.quotationsRouter,
    quotationItems: exports.quotationItemsRouter,
    classCouncil: exports.classCouncilRouter,
    vehicleInspections: exports.vehicleInspectionsRouter,
    // Documentos e Assinaturas Eletrônicas
    documents: exports.documentsRouter,
    documentSignatures: exports.documentSignaturesRouter,
    // IA e Otimização
    ai: exports.aiRouter,
    // Chat em tempo real
    chat: exports.chatRouter,
    // Grade Horária, Mural e Protocolos
    classSchedules: exports.classSchedulesRouter,
    bulletins: exports.bulletinsRouter,
    protocols: exports.protocolsRouter,
    // Backup de Dados
    backup: backupRouter,
    // SETE (FNDE) - Fornecedores, OS, Garagens
    suppliers: suppliersRouter,
    serviceOrders: serviceOrdersRouter,
    garages: garagesRouter,
});
