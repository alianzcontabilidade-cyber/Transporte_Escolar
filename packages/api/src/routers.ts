import { TRPCError } from '@trpc/server';
import { t, publicProcedure, protectedProcedure, adminProcedure, superAdminProcedure, staffProcedure, academicProcedure, validateOptionalCPF, validateOptionalCNPJ, JWT_SECRET } from './trpc';
import { z } from 'zod';
import { db } from './db/index';
import {
  municipalities, schools, users, vehicles, drivers, students,
  guardians, routes, stops, stopStudents, trips, tripStopLogs,
  tripStudentLogs, notifications, locationHistory,
  monitorStaff, contracts, maintenanceRecords,
  academicYears, classGrades, classes, subjects, classSubjects, enrollments, teachers,
  dailyAttendance, assessments, studentGrades, lessonPlans,
  positions, departments, staffAllocations, staffEvaluations,
  financialAccounts, financialTransactions,
  mealMenus, libraryBooks, libraryLoans, assets, inventoryItems, inventoryMovements,
  descriptiveReports, schoolCalendar, studentDocuments, messages, waitingList,
  municipalityResponsibles, formFieldConfigs, fuelRecords, studentHistory,
  studentOccurrences, events, quotations, quotationItems, classCouncilRecords, vehicleInspections,
  documents, documentSignatures,
  chatConversations, chatMessages,
  classSchedules, bulletins, protocols
} from './db/schema';
import { eq, and, or, desc, gte, lte, sql, inArray, like } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { createHash } from 'crypto';
import { emitToMunicipality, emitToUser } from './socketInstance';
import { haversineDistance, optimizeStopOrder, analyzeRoute, clusterStudents } from './services/routeOptimizer';
import { verifyGuardianAccess } from './helpers';

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
export const authRouter = t.router({
  registerMunicipality: publicProcedure
    .input(z.object({
      municipalityName: z.string().min(3),
      state: z.string().length(2),
      city: z.string().min(2),
      cnpj: z.string().optional(),
      adminName: z.string().min(3),
      adminEmail: z.string().email(),
      adminPassword: z.string().min(8),
      adminPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCNPJ(input.cnpj);
      const existingUser = await db.select().from(users).where(eq(users.email, input.adminEmail)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado' });
      }
      const [municipality] = await db.insert(municipalities).values({
        name: input.municipalityName,
        state: input.state,
        city: input.city,
        cnpj: input.cnpj,
        email: input.adminEmail,
      }).$returningId();

      const passwordHash = await hash(input.adminPassword, 12);
      const [user] = await db.insert(users).values({
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
  lookupGuardianByCpf: publicProcedure
    .input(z.object({ cpf: z.string() }))
    .query(async ({ input }) => {
      const cpfClean = input.cpf.replace(/\D/g, '');
      if (cpfClean.length !== 11) throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido' });

      // Format CPF variations for matching
      const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

      // Search in students table for fatherCpf or motherCpf
      const matchingStudents = await db.select({
        id: students.id,
        name: students.name,
        enrollment: students.enrollment,
        grade: students.grade,
        schoolId: students.schoolId,
        fatherName: students.fatherName,
        fatherCpf: students.fatherCpf,
        fatherPhone: students.fatherPhone,
        motherName: students.motherName,
        motherCpf: students.motherCpf,
        motherPhone: students.motherPhone,
      }).from(students)
        .where(or(
          eq(students.fatherCpf, cpfClean),
          eq(students.fatherCpf, cpfFormatted),
          eq(students.motherCpf, cpfClean),
          eq(students.motherCpf, cpfFormatted),
        ));

      if (matchingStudents.length === 0) {
        return { found: false as const, guardianName: null, guardianPhone: null, relationship: null, students: [] };
      }

      // Determine if father or mother
      const first = matchingStudents[0];
      const isFather = first.fatherCpf?.replace(/\D/g, '') === cpfClean;

      return {
        found: true as const,
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

  registerGuardian: publicProcedure
    .input(z.object({
      name: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
      cpf: z.string().optional(),
      studentEnrollment: z.string().min(1),
      relationship: z.enum(['father', 'mother', 'grandparent', 'uncle', 'other']).optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);

      // Find the student first
      const [student] = await db.select().from(students)
        .where(eq(students.enrollment, input.studentEnrollment)).limit(1);
      if (!student) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula do aluno não encontrada. Verifique com a escola.' });
      }

      let userId: number = 0;
      let isExistingUser = false;

      // Check if CPF already exists in users
      if (input.cpf) {
        const cpfClean = input.cpf.replace(/\D/g, '');
        const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        const existingByCpf = await db.select().from(users)
          .where(or(eq(users.cpf, cpfClean), eq(users.cpf, cpfFormatted), eq(users.cpf, input.cpf)))
          .limit(1);

        if (existingByCpf.length > 0) {
          // User already exists with this CPF - reuse the account
          userId = existingByCpf[0].id;
          isExistingUser = true;

          // Update municipalityId if not set (for guardian access)
          if (!existingByCpf[0].municipalityId) {
            await db.update(users).set({ municipalityId: student.municipalityId }).where(eq(users.id, userId));
          }
        }
      }

      if (!isExistingUser) {
        // Check if email already exists
        const existingByEmail = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existingByEmail.length > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado. Se você já tem conta no sistema, informe seu CPF para vincular o aluno ao seu perfil.' });
        }

        // Create new user
        const passwordHash = await hash(input.password, 12);
        const [user] = await db.insert(users).values({
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
      const existingGuardian = await db.select().from(guardians)
        .where(and(eq(guardians.userId, userId), eq(guardians.studentId, student.id)))
        .limit(1);

      if (existingGuardian.length === 0) {
        await db.insert(guardians).values({
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
        const allMatchingStudents = await db.select({ id: students.id, fatherCpf: students.fatherCpf }).from(students)
          .where(or(
            eq(students.fatherCpf, cpfClean),
            eq(students.fatherCpf, cpfFormatted),
            eq(students.motherCpf, cpfClean),
            eq(students.motherCpf, cpfFormatted),
          ));

        for (const ms of allMatchingStudents) {
          if (ms.id === student.id) continue; // already linked above
          const alreadyLinked = await db.select().from(guardians)
            .where(and(eq(guardians.userId, userId), eq(guardians.studentId, ms.id)))
            .limit(1);
          if (alreadyLinked.length === 0) {
            const isFather = ms.fatherCpf?.replace(/\D/g, '') === cpfClean;
            await db.insert(guardians).values({
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
  login: publicProcedure
    .input(z.object({
      identifier: z.string().min(1),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const id = input.identifier.trim();
      let userList: any[] = [];

      // Detectar formato do identificador
      const isEmail = id.includes('@');
      const isCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(id);

      if (isEmail) {
        userList = await db.select().from(users).where(eq(users.email, id)).limit(1);
      } else if (isCpf) {
        // Buscar tanto com formatação quanto sem
        const cpfClean = id.replace(/[^\d]/g, '');
        const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        userList = await db.select().from(users)
          .where(or(eq(users.cpf, cpfClean), eq(users.cpf, cpfFormatted), eq(users.cpf, id)))
          .limit(1);
      } else {
        // Buscar por email (caso não tenha @, pode ser username-style)
        userList = await db.select().from(users).where(eq(users.email, id)).limit(1);
        // Se não achou por email, tenta por nome exato
        if (userList.length === 0) {
          userList = await db.select().from(users).where(eq(users.name, id)).limit(1);
        }
      }

      const user = userList[0];
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas. Verifique seu email, CPF ou senha.' });
      }

      const validPassword = await compare(input.password, user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas. Verifique seu email, CPF ou senha.' });
      }

      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

      const token = sign(
        { userId: user.id, municipalityId: user.municipalityId, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, municipalityId: user.municipalityId }
      };
    }),

  // Solicitar recuperação de senha
  requestPasswordReset: publicProcedure
    .input(z.object({
      identifier: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const id = input.identifier.trim();
      let userList: any[] = [];

      const isEmail = id.includes('@');
      const isCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(id);

      if (isEmail) {
        userList = await db.select().from(users).where(eq(users.email, id)).limit(1);
      } else if (isCpf) {
        const cpfClean = id.replace(/[^\d]/g, '');
        const cpfFormatted = cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        userList = await db.select().from(users)
          .where(or(eq(users.cpf, cpfClean), eq(users.cpf, cpfFormatted), eq(users.cpf, id)))
          .limit(1);
      } else {
        userList = await db.select().from(users).where(eq(users.email, id)).limit(1);
      }

      const user = userList[0];
      if (!user) {
        // Não revelar se o usuário existe ou não (segurança)
        return { success: true, message: 'Se o usuário existir, um código de recuperação será gerado.' };
      }

      // Gerar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      // Gerar token JWT de curta duração (15 min) contendo userId e code
      const resetToken = sign(
        { userId: user.id, code, purpose: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Salvar notificação com o código (o admin pode ver)
      await db.insert(notifications).values({
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
    .input(z.object({
      resetToken: z.string(),
      code: z.string().length(6),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      let decoded: any;
      try {
        decoded = verify(input.resetToken, JWT_SECRET);
      } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token expirado ou inválido. Solicite um novo código.' });
      }

      if (decoded.purpose !== 'password_reset') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Token inválido.' });
      }

      if (decoded.code !== input.code) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Código incorreto.' });
      }

      const passwordHash = await hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, decoded.userId));

      return { success: true, message: 'Senha redefinida com sucesso! Faça login com a nova senha.' };
    }),

  // Alterar senha (logado)
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await db.select().from(users).where(eq(users.id, ctx.userId!)).limit(1);
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
      }

      const validPassword = await compare(input.currentPassword, user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha atual incorreta' });
      }

      const passwordHash = await hash(input.newPassword, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, ctx.userId!));

      return { success: true, message: 'Senha alterada com sucesso!' };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.userId!)).limit(1);
    if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
    return { id: user.id, name: user.name, email: user.email, role: user.role, municipalityId: user.municipalityId };
  }),

  // Resetar senha (admin)
  adminResetPassword: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let newPassword = '';
      for (let i = 0; i < 8; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      const passwordHash = await hash(newPassword, 12);
      await db.update(users).set({ passwordHash }).where(eq(users.id, input.userId));
      return { success: true, generatedPassword: newPassword };
    }),
});

// ============================================
// MUNICIPALITIES ROUTER
// ============================================
export const municipalitiesRouter = t.router({
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [municipality] = await db.select().from(municipalities).where(eq(municipalities.id, input.id)).limit(1);
      return municipality;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      cnpj: z.string().optional(),
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      fax: z.string().optional(),
      website: z.string().optional(),
      prefeitoName: z.string().optional(),
      prefeitoCpf: z.string().optional(),
      prefeitoCargo: z.string().optional(),
      secretariaName: z.string().optional(),
      secretariaCnpj: z.string().optional(),
      secretariaPhone: z.string().optional(),
      secretariaEmail: z.string().optional(),
      secretariaLogradouro: z.string().optional(),
      secretarioName: z.string().optional(),
      secretarioCpf: z.string().optional(),
      secretarioCargo: z.string().optional(),
      secretarioDecreto: z.string().optional(),
      customRoles: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      // Remove undefined values
      const cleanData: any = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) cleanData[k] = v;
      }
      if (Object.keys(cleanData).length > 0) {
        await db.update(municipalities).set(cleanData).where(eq(municipalities.id, id));
      }
      return { success: true };
    }),

  // Responsáveis do município
  listResponsibles: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(municipalityResponsibles)
        .where(eq(municipalityResponsibles.municipalityId, input.municipalityId))
        .orderBy(municipalityResponsibles.name);
    }),

  addResponsible: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string().min(2),
      role: z.string().min(2),
      cpf: z.string().optional(),
      decree: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [r] = await db.insert(municipalityResponsibles).values(input).$returningId();
      return { success: true, id: r.id };
    }),

  updateResponsible: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      role: z.string().optional(),
      cpf: z.string().optional(),
      decree: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const cleanData: any = {};
      for (const [k, v] of Object.entries(data)) { if (v !== undefined) cleanData[k] = v; }
      if (Object.keys(cleanData).length > 0) {
        await db.update(municipalityResponsibles).set(cleanData).where(eq(municipalityResponsibles.id, id));
      }
      return { success: true };
    }),

  removeResponsible: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(municipalityResponsibles).where(eq(municipalityResponsibles.id, input.id));
      return { success: true };
    }),

  // List all municipalities (super_admin only)
  list: superAdminProcedure
    .query(async () => {
      const allMuns = await db.select().from(municipalities).orderBy(municipalities.name);
      const results = await Promise.all(allMuns.map(async (m) => {
        const [schoolCount] = await db.select({ count: sql<number>`count(*)` }).from(schools).where(and(eq(schools.municipalityId, m.id), eq(schools.isActive, true)));
        const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(and(eq(students.municipalityId, m.id), eq(students.isActive, true)));
        const [routeCount] = await db.select({ count: sql<number>`count(*)` }).from(routes).where(and(eq(routes.municipalityId, m.id), eq(routes.isActive, true)));
        const [vehicleCount] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.municipalityId, m.id));
        const [driverCount] = await db.select({ count: sql<number>`count(*)` }).from(drivers).where(eq(drivers.municipalityId, m.id));
        const [tripCount] = await db.select({ count: sql<number>`count(*)` }).from(trips)
          .innerJoin(routes, eq(trips.routeId, routes.id))
          .where(and(eq(routes.municipalityId, m.id), eq(trips.status, 'started')));
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
  create: superAdminProcedure
    .input(z.object({
      name: z.string().min(3),
      state: z.string().length(2),
      city: z.string(),
      cnpj: z.string().optional(),
      email: z.string().email(),
      phone: z.string().optional(),
      subscriptionPlan: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
      adminName: z.string().min(3),
      adminEmail: z.string().email(),
      adminPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const { adminName, adminEmail, adminPassword, ...munData } = input;
      const [mun] = await db.insert(municipalities).values({
        ...munData,
        isActive: true,
      } as any).$returningId();
      const passwordHash = await hash(adminPassword, 10);
      await db.insert(users).values({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'municipal_admin',
        municipalityId: mun.id,
        isActive: true,
      } as any);
      return { success: true, id: mun.id };
    }),

  // Get global stats for super admin dashboard
  globalStats: superAdminProcedure
    .query(async () => {
      const [muns] = await db.select({ count: sql<number>`count(*)` }).from(municipalities).where(eq(municipalities.isActive, true));
      const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(eq(students.isActive, true));
      const [routeCount] = await db.select({ count: sql<number>`count(*)` }).from(routes).where(eq(routes.isActive, true));
      const [vehicleCount] = await db.select({ count: sql<number>`count(*)` }).from(vehicles);
      const [activeTrips] = await db.select({ count: sql<number>`count(*)` }).from(trips).where(eq(trips.status, 'started'));
      const [docCount] = await db.select({ count: sql<number>`count(*)` }).from(documents).where(eq(documents.status, 'valid'));
      return {
        municipalities: Number(muns?.count || 0),
        students: Number(studentCount?.count || 0),
        routes: Number(routeCount?.count || 0),
        vehicles: Number(vehicleCount?.count || 0),
        activeTrips: Number(activeTrips?.count || 0),
        documents: Number(docCount?.count || 0),
      };
    }),

  getDashboardStats: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const [schoolCount] = await db.select({ count: sql<number>`count(*)` })
        .from(schools).where(eq(schools.municipalityId, input.municipalityId));
      const [studentCount] = await db.select({ count: sql<number>`count(*)` })
        .from(students).where(eq(students.municipalityId, input.municipalityId));
      const [routeCount] = await db.select({ count: sql<number>`count(*)` })
        .from(routes).where(eq(routes.municipalityId, input.municipalityId));
      const [vehicleCount] = await db.select({ count: sql<number>`count(*)` })
        .from(vehicles).where(eq(vehicles.municipalityId, input.municipalityId));
      const [driverCount] = await db.select({ count: sql<number>`count(*)` })
        .from(drivers).where(eq(drivers.municipalityId, input.municipalityId));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [todayTrips] = await db.select({ count: sql<number>`count(*)` })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(and(eq(routes.municipalityId, input.municipalityId), gte(trips.tripDate, today)));
      const [activeTrips] = await db.select({ count: sql<number>`count(*)` })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(and(eq(routes.municipalityId, input.municipalityId), eq(trips.status, 'started')));

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
export const schoolsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(schools)
        .where(and(eq(schools.municipalityId, input.municipalityId), eq(schools.isActive, true)))
        .orderBy(schools.name);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string().min(3),
      code: z.string().optional(),
      type: z.enum(['infantil', 'fundamental', 'medio', 'tecnico', 'especial']).optional(),
      cnpj: z.string().optional(),
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      directorName: z.string().optional(),
      logoUrl: z.string().optional(),
      morningStart: z.string().optional(),
      morningEnd: z.string().optional(),
      afternoonStart: z.string().optional(),
      afternoonEnd: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [school] = await db.insert(schools).values({
        ...input,
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
      }).$returningId();
      return { success: true, id: school.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      municipalityId: z.number().optional(),
      name: z.string().optional(),
      code: z.string().optional(),
      type: z.enum(['infantil', 'fundamental', 'medio', 'tecnico', 'especial']).optional(),
      cnpj: z.string().optional(),
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      directorName: z.string().optional(),
      logoUrl: z.string().optional(),
      morningStart: z.string().optional(),
      morningEnd: z.string().optional(),
      afternoonStart: z.string().optional(),
      afternoonEnd: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, latitude, longitude, ...data } = input;
      const updateData: any = { ...data };
      if (latitude !== undefined) updateData.latitude = latitude.toString();
      if (longitude !== undefined) updateData.longitude = longitude.toString();
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
      if (Object.keys(updateData).length > 0) await db.update(schools).set(updateData).where(eq(schools.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasStudents] = await db.select({ c: sql`count(*)`.as('c') }).from(students).where(and(eq(students.schoolId, input.id), eq(students.isActive, true)));
      const [hasClasses] = await db.select({ c: sql`count(*)`.as('c') }).from(classes).where(and(eq(classes.schoolId, input.id), eq(classes.isActive, true)));
      const [hasRoutes] = await db.select({ c: sql`count(*)`.as('c') }).from(routes).where(and(eq(routes.schoolId, input.id), eq(routes.isActive, true)));
      const deps: string[] = [];
      if (Number(hasStudents.c) > 0) deps.push(`${hasStudents.c} aluno(s)`);
      if (Number(hasClasses.c) > 0) deps.push(`${hasClasses.c} turma(s)`);
      if (Number(hasRoutes.c) > 0) deps.push(`${hasRoutes.c} rota(s)`);
      if (deps.length > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Escola possui: ${deps.join(', ')}` });
      await db.update(schools).set({ isActive: false }).where(eq(schools.id, input.id));
      return { success: true };
    }),
});

// ============================================
// ROUTES ROUTER
// ============================================
export const routesRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const allRoutes = await db.select().from(routes)
        .where(and(eq(routes.municipalityId, input.municipalityId), eq(routes.isActive, true)))
        .orderBy(routes.name);
      const routesWithStops = await Promise.all(allRoutes.map(async (route) => {
        const routeStops = await db.select().from(stops)
          .where(eq(stops.routeId, route.id))
          .orderBy(stops.orderIndex);
        return { route, stops: routeStops };
      }));
      return routesWithStops;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [route] = await db.select().from(routes).where(eq(routes.id, input.id)).limit(1);
      if (!route) throw new TRPCError({ code: 'NOT_FOUND' });
      const routeStops = await db.select().from(stops)
        .where(eq(stops.routeId, input.id)).orderBy(stops.orderIndex);
      return { ...route, stops: routeStops };
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      schoolId: z.number().optional(),
      name: z.string().min(3),
      code: z.string().optional(),
      description: z.string().optional(),
      type: z.enum(['pickup', 'dropoff', 'both']).optional(),
      shift: z.enum(['morning', 'afternoon', 'evening']).optional(),
      scheduledStartTime: z.string().optional(),
      scheduledEndTime: z.string().optional(),
      defaultVehicleId: z.number().optional(),
      defaultDriverId: z.number().optional(),
      stops: z.array(z.object({
        name: z.string(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        order: z.number().optional(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const { stops: inputStops, ...routeData } = input;
      const [route] = await db.insert(routes).values(routeData).$returningId();

      // Insert stops if provided
      if (inputStops && inputStops.length > 0) {
        for (let i = 0; i < inputStops.length; i++) {
          const s = inputStops[i];
          const lat = s.lat || s.latitude || '0';
          const lng = s.lng || s.longitude || '0';
          await db.insert(stops).values({
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

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      type: z.enum(['pickup', 'dropoff', 'both']).optional(),
      shift: z.enum(['morning', 'afternoon', 'evening']).optional(),
      scheduledStartTime: z.string().optional(),
      scheduledEndTime: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(routes).set(data).where(eq(routes.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasStops] = await db.select({ c: sql`count(*)`.as('c') }).from(stops).where(eq(stops.routeId, input.id));
      const [hasTrips] = await db.select({ c: sql`count(*)`.as('c') }).from(trips).where(eq(trips.routeId, input.id));
      const deps: string[] = [];
      if (Number(hasStops.c) > 0) deps.push(`${hasStops.c} parada(s)`);
      if (Number(hasTrips.c) > 0) deps.push(`${hasTrips.c} viagem(ns)`);
      if (deps.length > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Rota possui: ${deps.join(', ')}` });
      await db.update(routes).set({ isActive: false }).where(eq(routes.id, input.id));
      return { success: true };
    }),
});

// ============================================
// STOPS ROUTER
// ============================================
export const stopsRouter = t.router({
  listByRoute: protectedProcedure
    .input(z.object({ routeId: z.number() }))
    .query(async ({ input }) => {
      const routeStops = await db.select().from(stops)
        .where(and(eq(stops.routeId, input.routeId), eq(stops.isActive, true)))
        .orderBy(stops.orderIndex);

      const stopsWithStudents = await Promise.all(routeStops.map(async (stop) => {
        const stopStudentList = await db.select({
          id: students.id, name: students.name, photoUrl: students.photoUrl,
        })
        .from(stopStudents)
        .innerJoin(students, eq(stopStudents.studentId, students.id))
        .where(eq(stopStudents.stopId, stop.id));
        return { ...stop, students: stopStudentList };
      }));
      return stopsWithStudents;
    }),

  create: adminProcedure
    .input(z.object({
      routeId: z.number(),
      name: z.string().min(2),
      address: z.string().optional(),
      reference: z.string().optional(),
      latitude: z.number(),
      longitude: z.number(),
      orderIndex: z.number(),
      estimatedArrivalMinutes: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [stop] = await db.insert(stops).values({
        ...input,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
      }).$returningId();
      return { success: true, id: stop.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      orderIndex: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, latitude, longitude, ...rest } = input;
      await db.update(stops).set({
        ...rest,
        ...(latitude !== undefined && { latitude: latitude.toString() }),
        ...(longitude !== undefined && { longitude: longitude.toString() }),
      }).where(eq(stops.id, id));
      return { success: true };
    }),

  reorder: adminProcedure
    .input(z.object({ routeId: z.number(), stopIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      for (let i = 0; i < input.stopIds.length; i++) {
        await db.update(stops).set({ orderIndex: i + 1 }).where(eq(stops.id, input.stopIds[i]));
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasStudents] = await db.select({ c: sql`count(*)`.as('c') }).from(stopStudents).where(eq(stopStudents.stopId, input.id));
      if (Number(hasStudents.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Parada possui ${hasStudents.c} aluno(s) vinculado(s)` });
      await db.update(stops).set({ isActive: false }).where(eq(stops.id, input.id));
      return { success: true };
    }),
});

// ============================================
// STUDENTS ROUTER
// ============================================
export const studentsRouter = t.router({
  // Lista cartórios distintos já cadastrados para autocomplete
  listCartorios: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const result = await db.selectDistinct({ cartorio: students.certidaoCartorio })
        .from(students)
        .where(and(
          eq(students.municipalityId, input.municipalityId),
          sql`${students.certidaoCartorio} IS NOT NULL AND ${students.certidaoCartorio} != ''`
        ))
        .orderBy(students.certidaoCartorio);
      return result.map(r => r.cartorio).filter(Boolean);
    }),

  list: protectedProcedure
    .input(z.object({ municipalityId: z.number(), schoolId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [
        eq(students.municipalityId, input.municipalityId),
        eq(students.isActive, true),
        ...(input.schoolId ? [eq(students.schoolId, input.schoolId)] : []),
      ];
      const result = await db.select({
        id: students.id,
        municipalityId: students.municipalityId,
        schoolId: students.schoolId,
        name: students.name,
        birthDate: students.birthDate,
        grade: students.grade,
        classRoom: students.classRoom,
        enrollment: students.enrollment,
        shift: students.shift,
        photoUrl: students.photoUrl,
        hasSpecialNeeds: students.hasSpecialNeeds,
        specialNeedsNotes: students.specialNeedsNotes,
        bloodType: students.bloodType,
        allergies: students.allergies,
        medications: students.medications,
        healthNotes: students.healthNotes,
        emergencyContact1Name: students.emergencyContact1Name,
        emergencyContact1Phone: students.emergencyContact1Phone,
        emergencyContact1Relation: students.emergencyContact1Relation,
        emergencyContact2Name: students.emergencyContact2Name,
        emergencyContact2Phone: students.emergencyContact2Phone,
        emergencyContact2Relation: students.emergencyContact2Relation,
        address: students.address,
        latitude: students.latitude,
        longitude: students.longitude,
        needsTransport: students.needsTransport,
        transportType: students.transportType,
        transportDistance: students.transportDistance,
        zone: students.zone,
        routeName: students.routeName,
        cpf: students.cpf,
        rg: students.rg,
        rgOrgao: students.rgOrgao,
        rgUf: students.rgUf,
        sex: students.sex,
        race: students.race,
        nationality: students.nationality,
        naturalness: students.naturalness,
        naturalnessUf: students.naturalnessUf,
        nis: students.nis,
        cartaoSus: students.cartaoSus,
        // Certidão
        certidaoTipo: students.certidaoTipo,
        certidaoNumero: students.certidaoNumero,
        certidaoFolha: students.certidaoFolha,
        certidaoLivro: students.certidaoLivro,
        certidaoData: students.certidaoData,
        certidaoCartorio: students.certidaoCartorio,
        // Endereço
        addressNumber: students.addressNumber,
        addressComplement: students.addressComplement,
        neighborhood: students.neighborhood,
        cep: students.cep,
        city: students.city,
        state: students.state,
        phone: students.phone,
        cellPhone: students.cellPhone,
        // Filiação
        fatherName: students.fatherName,
        fatherCpf: students.fatherCpf,
        fatherRg: students.fatherRg,
        fatherRgOrgao: students.fatherRgOrgao,
        fatherRgUf: students.fatherRgUf,
        fatherPhone: students.fatherPhone,
        fatherProfession: students.fatherProfession,
        fatherWorkplace: students.fatherWorkplace,
        fatherEducation: students.fatherEducation,
        fatherNaturalness: students.fatherNaturalness,
        fatherNaturalnessUf: students.fatherNaturalnessUf,
        motherName: students.motherName,
        motherCpf: students.motherCpf,
        motherRg: students.motherRg,
        motherRgOrgao: students.motherRgOrgao,
        motherRgUf: students.motherRgUf,
        motherPhone: students.motherPhone,
        motherProfession: students.motherProfession,
        motherWorkplace: students.motherWorkplace,
        motherEducation: students.motherEducation,
        motherNaturalness: students.motherNaturalness,
        motherNaturalnessUf: students.motherNaturalnessUf,
        familyIncome: students.familyIncome,
        // Programas
        bolsaFamilia: students.bolsaFamilia,
        bpc: students.bpc,
        // Deficiência
        deficiencyType: students.deficiencyType,
        // Procedência
        previousSchool: students.previousSchool,
        previousSchoolType: students.previousSchoolType,
        previousSchoolZone: students.previousSchoolZone,
        previousCity: students.previousCity,
        previousState: students.previousState,
        studentStatus: students.studentStatus,
        enrollmentType: students.enrollmentType,
        rgDate: students.rgDate,
        peti: students.peti,
        otherPrograms: students.otherPrograms,
        tgd: students.tgd,
        superdotacao: students.superdotacao,
        salaRecursos: students.salaRecursos,
        acompanhamento: students.acompanhamento,
        encaminhamento: students.encaminhamento,
        observations: students.observations,
        isActive: students.isActive,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        school: schools.name,
      })
      .from(students)
      .leftJoin(schools, eq(students.schoolId, schools.id))
      .where(and(...conditions))
      .orderBy(students.name);
      return result;
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      schoolId: z.number().optional(),
      name: z.string().min(2),
      birthDate: z.string().optional(),
      grade: z.string().optional(),
      classRoom: z.string().optional(),
      className: z.string().optional(),
      enrollment: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening']).optional(),
      // Dados pessoais
      cpf: z.string().optional(), rg: z.string().optional(), rgOrgao: z.string().optional(),
      rgUf: z.string().optional(), rgDate: z.string().optional(),
      sex: z.string().optional(), race: z.string().optional(),
      nationality: z.string().optional(), naturalness: z.string().optional(), naturalnessUf: z.string().optional(),
      nis: z.string().optional(), cartaoSus: z.string().optional(),
      // Certidao
      certidaoTipo: z.string().optional(), certidaoNumero: z.string().optional(),
      certidaoFolha: z.string().optional(), certidaoLivro: z.string().optional(),
      certidaoData: z.string().optional(), certidaoCartorio: z.string().optional(),
      // Endereco
      address: z.string().optional(), addressNumber: z.string().optional(),
      addressComplement: z.string().optional(), neighborhood: z.string().optional(),
      cep: z.string().optional(), city: z.string().optional(), state: z.string().optional(),
      zone: z.string().optional(), phone: z.string().optional(), cellPhone: z.string().optional(),
      latitude: z.number().optional(), longitude: z.number().optional(),
      // Transporte
      needsTransport: z.boolean().optional(), transportType: z.string().optional(), transportDistance: z.string().optional(),
      // Programas sociais
      bolsaFamilia: z.boolean().optional(), bpc: z.boolean().optional(), peti: z.boolean().optional(), otherPrograms: z.string().optional(),
      // Necessidades especiais
      photoUrl: z.string().optional(), photo: z.string().optional(),
      hasSpecialNeeds: z.boolean().optional(), specialNeedsNotes: z.string().optional(),
      deficiencyType: z.string().optional(), tgd: z.string().optional(),
      superdotacao: z.boolean().optional(), salaRecursos: z.boolean().optional(),
      acompanhamento: z.string().optional(), encaminhamento: z.string().optional(),
      // Saude
      bloodType: z.string().optional(), allergies: z.string().optional(),
      medications: z.string().optional(), healthNotes: z.string().optional(),
      // Contatos emergencia
      emergencyContact1Name: z.string().optional(), emergencyContact1Phone: z.string().optional(),
      emergencyContact1Relation: z.string().optional(),
      emergencyContact2Name: z.string().optional(), emergencyContact2Phone: z.string().optional(),
      emergencyContact2Relation: z.string().optional(),
      guardian1Name: z.string().optional(), guardian1Phone: z.string().optional(), guardian1Relation: z.string().optional(),
      guardian2Name: z.string().optional(), guardian2Phone: z.string().optional(), guardian2Relation: z.string().optional(),
      // Filiacao
      fatherName: z.string().optional(), fatherCpf: z.string().optional(), fatherRg: z.string().optional(),
      fatherRgOrgao: z.string().optional(), fatherRgUf: z.string().optional(),
      fatherPhone: z.string().optional(), fatherProfession: z.string().optional(), fatherWorkplace: z.string().optional(),
      fatherEducation: z.string().optional(), fatherNaturalness: z.string().optional(), fatherNaturalnessUf: z.string().optional(),
      motherName: z.string().optional(), motherCpf: z.string().optional(), motherRg: z.string().optional(),
      motherRgOrgao: z.string().optional(), motherRgUf: z.string().optional(),
      motherPhone: z.string().optional(), motherProfession: z.string().optional(), motherWorkplace: z.string().optional(),
      motherEducation: z.string().optional(), motherNaturalness: z.string().optional(), motherNaturalnessUf: z.string().optional(),
      familyIncome: z.string().optional(),
      // Procedencia
      previousSchool: z.string().optional(), previousSchoolType: z.string().optional(),
      previousSchoolZone: z.string().optional(), previousCity: z.string().optional(),
      previousState: z.string().optional(), enrollmentType: z.string().optional(),
      studentStatus: z.string().optional(),
      observations: z.string().optional(), routeId: z.number().optional(), school: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const finalSchoolId = input.schoolId || (input.school ? parseInt(input.school) : undefined);
      if (!finalSchoolId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Escola e obrigatoria.' });

      const { municipalityId, school: _s, photo, className, guardian1Name, guardian1Phone, guardian1Relation,
        guardian2Name, guardian2Phone, guardian2Relation, routeId, ...rest } = input;

      // Resolve routeId -> routeName
      let resolvedRouteName: string | undefined;
      if (routeId) {
        const [rt] = await db.select({ name: routes.name }).from(routes).where(eq(routes.id, routeId));
        resolvedRouteName = rt?.name || undefined;
      }

      const [student] = await db.insert(students).values({
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

  assignToStop: adminProcedure
    .input(z.object({
      studentId: z.number(),
      stopId: z.number(),
      boardingType: z.enum(['pickup', 'dropoff', 'both']).optional(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(stopStudents).values(input);
      return { success: true };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      municipalityId: z.number().optional(),
      schoolId: z.number().optional(),
      school: z.string().optional(),
      name: z.string().optional(),
      enrollment: z.string().optional(),
      birthDate: z.string().optional(),
      grade: z.string().optional(),
      classRoom: z.string().optional(),
      className: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening']).optional(),
      // Dados pessoais
      cpf: z.string().optional(), rg: z.string().optional(), rgOrgao: z.string().optional(),
      rgUf: z.string().optional(), rgDate: z.string().optional(),
      sex: z.string().optional(), race: z.string().optional(),
      nationality: z.string().optional(), naturalness: z.string().optional(), naturalnessUf: z.string().optional(),
      nis: z.string().optional(), cartaoSus: z.string().optional(),
      // Certidao
      certidaoTipo: z.string().optional(), certidaoNumero: z.string().optional(),
      certidaoFolha: z.string().optional(), certidaoLivro: z.string().optional(),
      certidaoData: z.string().optional(), certidaoCartorio: z.string().optional(),
      // Endereco
      address: z.string().optional(), addressNumber: z.string().optional(),
      addressComplement: z.string().optional(), neighborhood: z.string().optional(),
      cep: z.string().optional(), city: z.string().optional(), state: z.string().optional(),
      zone: z.string().optional(), phone: z.string().optional(), cellPhone: z.string().optional(),
      // Transporte
      needsTransport: z.boolean().optional(), transportType: z.string().optional(), transportDistance: z.string().optional(),
      // Programas sociais
      bolsaFamilia: z.boolean().optional(), bpc: z.boolean().optional(), peti: z.boolean().optional(), otherPrograms: z.string().optional(),
      // Necessidades especiais
      photoUrl: z.string().optional(), photo: z.string().optional(),
      hasSpecialNeeds: z.boolean().optional(), specialNeedsNotes: z.string().optional(),
      deficiencyType: z.string().optional(), tgd: z.string().optional(),
      superdotacao: z.boolean().optional(), salaRecursos: z.boolean().optional(),
      acompanhamento: z.string().optional(), encaminhamento: z.string().optional(),
      // Saude
      bloodType: z.string().optional(), allergies: z.string().optional(),
      medications: z.string().optional(), healthNotes: z.string().optional(),
      // Contatos emergencia
      emergencyContact1Name: z.string().optional(), emergencyContact1Phone: z.string().optional(),
      emergencyContact1Relation: z.string().optional(),
      emergencyContact2Name: z.string().optional(), emergencyContact2Phone: z.string().optional(),
      emergencyContact2Relation: z.string().optional(),
      guardian1Name: z.string().optional(), guardian1Phone: z.string().optional(), guardian1Relation: z.string().optional(),
      guardian2Name: z.string().optional(), guardian2Phone: z.string().optional(), guardian2Relation: z.string().optional(),
      // Filiacao
      fatherName: z.string().optional(), fatherCpf: z.string().optional(), fatherRg: z.string().optional(),
      fatherRgOrgao: z.string().optional(), fatherRgUf: z.string().optional(),
      fatherPhone: z.string().optional(), fatherProfession: z.string().optional(), fatherWorkplace: z.string().optional(),
      fatherEducation: z.string().optional(), fatherNaturalness: z.string().optional(), fatherNaturalnessUf: z.string().optional(),
      motherName: z.string().optional(), motherCpf: z.string().optional(), motherRg: z.string().optional(),
      motherRgOrgao: z.string().optional(), motherRgUf: z.string().optional(),
      motherPhone: z.string().optional(), motherProfession: z.string().optional(), motherWorkplace: z.string().optional(),
      motherEducation: z.string().optional(), motherNaturalness: z.string().optional(), motherNaturalnessUf: z.string().optional(),
      familyIncome: z.string().optional(),
      // Procedencia
      previousSchool: z.string().optional(), previousSchoolType: z.string().optional(),
      previousSchoolZone: z.string().optional(), previousCity: z.string().optional(),
      previousState: z.string().optional(), enrollmentType: z.string().optional(),
      studentStatus: z.string().optional(),
      observations: z.string().optional(), routeId: z.number().optional(),
      latitude: z.number().optional(), longitude: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, municipalityId, school, photo, className, guardian1Name, guardian1Phone, guardian1Relation,
        guardian2Name, guardian2Phone, guardian2Relation, observations, routeId, latitude, longitude, ...fields } = input;
      const ud: any = {};

      // Basic fields
      if (fields.name !== undefined) ud.name = fields.name;
      if (fields.enrollment !== undefined) ud.enrollment = fields.enrollment;
      if (fields.grade !== undefined) ud.grade = fields.grade;
      if (fields.classRoom || className) ud.classRoom = fields.classRoom || className;
      if (fields.shift !== undefined) ud.shift = fields.shift;
      if (fields.birthDate) ud.birthDate = new Date(fields.birthDate);
      if (fields.photoUrl || photo) ud.photoUrl = fields.photoUrl || photo;
      if (school) ud.schoolId = parseInt(school);
      if (fields.schoolId) ud.schoolId = fields.schoolId;
      if (latitude !== undefined) ud.latitude = latitude.toFixed(8);
      if (longitude !== undefined) ud.longitude = longitude.toFixed(8);
      if (observations !== undefined) ud.observations = observations;

      // Se routeId foi fornecido, buscar nome da rota e salvar
      if (routeId) {
        try {
          const [route] = await db.select({ name: routes.name }).from(routes).where(eq(routes.id, routeId)).limit(1);
          if (route) ud.routeName = route.name;
        } catch { /* ignore */ }
      }

      // All string/boolean fields - copy if defined
      const stringFields = [
        'cpf','rg','rgOrgao','rgUf','rgDate','sex','race','nationality','naturalness','naturalnessUf',
        'nis','cartaoSus','certidaoTipo','certidaoNumero','certidaoFolha','certidaoLivro','certidaoData','certidaoCartorio',
        'address','addressNumber','addressComplement','neighborhood','cep','city','state','zone','phone','cellPhone',
        'transportType','transportDistance','otherPrograms',
        'specialNeedsNotes','deficiencyType','tgd','acompanhamento','encaminhamento',
        'bloodType','allergies','medications','healthNotes',
        'fatherName','fatherCpf','fatherRg','fatherRgOrgao','fatherRgUf','fatherPhone','fatherProfession','fatherWorkplace','fatherEducation',
        'fatherNaturalness','fatherNaturalnessUf',
        'motherName','motherCpf','motherRg','motherRgOrgao','motherRgUf','motherPhone','motherProfession','motherWorkplace','motherEducation',
        'motherNaturalness','motherNaturalnessUf',
        'familyIncome','previousSchool','previousSchoolType','previousSchoolZone','previousCity','previousState',
        'enrollmentType','studentStatus',
      ];
      for (const f of stringFields) {
        if ((fields as any)[f] !== undefined) ud[f] = (fields as any)[f];
      }
      const boolFields = ['hasSpecialNeeds','needsTransport','bolsaFamilia','bpc','peti','superdotacao','salaRecursos'];
      for (const f of boolFields) {
        if ((fields as any)[f] !== undefined) ud[f] = (fields as any)[f];
      }

      // Emergency contacts / guardians
      const ec1Name = fields.emergencyContact1Name || guardian1Name;
      const ec1Phone = fields.emergencyContact1Phone || guardian1Phone;
      const ec1Rel = fields.emergencyContact1Relation || guardian1Relation;
      const ec2Name = fields.emergencyContact2Name || guardian2Name;
      const ec2Phone = fields.emergencyContact2Phone || guardian2Phone;
      const ec2Rel = fields.emergencyContact2Relation || guardian2Relation;
      if (ec1Name !== undefined) ud.emergencyContact1Name = ec1Name;
      if (ec1Phone !== undefined) ud.emergencyContact1Phone = ec1Phone;
      if (ec1Rel !== undefined) ud.emergencyContact1Relation = ec1Rel;
      if (ec2Name !== undefined) ud.emergencyContact2Name = ec2Name;
      if (ec2Phone !== undefined) ud.emergencyContact2Phone = ec2Phone;
      if (ec2Rel !== undefined) ud.emergencyContact2Relation = ec2Rel;

      // Remove undefined values
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(students).set(ud).where(eq(students.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasEnrollments] = await db.select({ c: sql`count(*)`.as('c') }).from(enrollments).where(and(eq(enrollments.studentId, input.id), eq(enrollments.status, 'active'), eq(enrollments.isActive, true)));
      if (Number(hasEnrollments.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Aluno possui ${hasEnrollments.c} matrícula(s) ativa(s). Altere o status da matrícula antes de excluir.` });

      // Desativar aluno
      await db.update(students).set({ isActive: false, studentStatus: 'inativo' }).where(eq(students.id, input.id));

      // Limpar vínculos com paradas de rota
      await db.delete(stopStudents).where(eq(stopStudents.studentId, input.id));

      // Desativar matrículas que não estão ativas
      await db.update(enrollments).set({ isActive: false }).where(and(eq(enrollments.studentId, input.id), eq(enrollments.isActive, true)));

      return { success: true };
    }),

  bulkImport: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      schoolId: z.number().optional(),
      students: z.array(z.object({
        name: z.string(),
        enrollment: z.string().optional(),
        grade: z.string().optional(),
        className: z.string().optional(),
        shift: z.string().optional(),
        birthDate: z.string().optional(),
        cpf: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        phone: z.string().optional(),
        fatherName: z.string().optional(),
        motherName: z.string().optional(),
        sex: z.string().optional(),
        race: z.string().optional(),
        nis: z.string().optional(),
        rg: z.string().optional(),
        cep: z.string().optional(),
        observations: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      let created = 0, skipped = 0, errors = 0;
      const errorDetails: string[] = [];
      for (const s of input.students) {
        try {
          // Check if enrollment already exists
          if (s.enrollment) {
            const existing = await db.select({ id: students.id }).from(students)
              .where(and(eq(students.municipalityId, input.municipalityId), eq(students.enrollment, s.enrollment), eq(students.isActive, true)))
              .limit(1);
            if (existing.length > 0) { skipped++; continue; }
          }
          // Parse shift
          const shiftVal = s.shift?.toLowerCase();
          const shift = shiftVal === 'tarde' || shiftVal === 'afternoon' ? 'afternoon'
            : shiftVal === 'noite' || shiftVal === 'evening' ? 'evening'
            : 'morning';
          // Parse birthDate
          let birthDate: Date | undefined;
          if (s.birthDate) {
            // Try dd/mm/yyyy format first
            const parts = s.birthDate.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
            if (parts) {
              birthDate = new Date(`${parts[3]}-${parts[2]}-${parts[1]}`);
            } else {
              birthDate = new Date(s.birthDate);
            }
            if (isNaN(birthDate.getTime())) birthDate = undefined;
          }
          await db.insert(students).values({
            municipalityId: input.municipalityId,
            schoolId: input.schoolId || undefined,
            name: s.name,
            enrollment: s.enrollment || undefined,
            grade: s.grade || undefined,
            classRoom: s.className || undefined,
            shift: shift as any,
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
        } catch (err: any) {
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
export const tripsRouter = t.router({
  // Finalizar todas as viagens ativas de um município
  completeAll: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .mutation(async ({ input }) => {
      // Finalizar TODAS as viagens que não estão completed/cancelled
      const activeTrips = await db.select({ tripId: trips.id, status: trips.status })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(and(
          or(eq(trips.status, 'started'), eq(trips.status, 'scheduled')),
          eq(routes.municipalityId, input.municipalityId)
        ));

      let count = 0;
      for (const t of activeTrips) {
        await db.update(trips).set({ status: 'completed', completedAt: new Date() }).where(eq(trips.id, t.tripId));
        count++;
      }
      return { success: true, finalized: count };
    }),

  listActive: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const activeTrips = await db.select({
        trip: trips, route: routes,
        driver: { id: drivers.id, userId: drivers.userId, currentLatitude: drivers.currentLatitude, currentLongitude: drivers.currentLongitude },
        vehicle: vehicles,
      })
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(drivers, eq(trips.driverId, drivers.id))
      .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .where(and(eq(routes.municipalityId, input.municipalityId), eq(trips.status, 'started')))
      .orderBy(desc(trips.startedAt));

      const tripsWithDriverName = await Promise.all(activeTrips.map(async (t) => {
        const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, t.driver.userId)).limit(1);
        return { ...t, driverName: user?.name };
      }));
      return tripsWithDriverName;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [trip] = await db.select({
        trip: trips, route: routes,
        driver: { id: drivers.id, userId: drivers.userId, currentLatitude: drivers.currentLatitude, currentLongitude: drivers.currentLongitude },
        vehicle: vehicles,
      })
      .from(trips)
      .innerJoin(routes, eq(trips.routeId, routes.id))
      .innerJoin(drivers, eq(trips.driverId, drivers.id))
      .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .where(eq(trips.id, input.id))
      .limit(1);
      if (!trip) throw new TRPCError({ code: 'NOT_FOUND', message: 'Viagem não encontrada' });

      const [driverUser] = await db.select({ name: users.name }).from(users).where(eq(users.id, trip.driver.userId)).limit(1);
      const tripStops = await db.select().from(stops).where(eq(stops.routeId, trip.route.id)).orderBy(stops.orderIndex);
      const stopLogs = await db.select().from(tripStopLogs).where(eq(tripStopLogs.tripId, input.id));

      return { ...trip, driverName: driverUser?.name, stops: tripStops, stopLogs };
    }),

  start: protectedProcedure
    .input(z.object({ routeId: z.number(), driverId: z.number(), vehicleId: z.number() }))
    .mutation(async ({ input }) => {
      const [route] = await db.select().from(routes).where(eq(routes.id, input.routeId)).limit(1);
      if (!route) throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota não encontrada' });

      const stopList = await db.select().from(stops).where(eq(stops.routeId, input.routeId));
      let totalStudents = 0;
      for (const stop of stopList) {
        const [count] = await db.select({ count: sql<number>`count(*)` }).from(stopStudents).where(eq(stopStudents.stopId, stop.id));
        totalStudents += count?.count || 0;
      }

      const [trip] = await db.insert(trips).values({
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
      const routeStops = await db.select().from(stops).where(eq(stops.routeId, input.routeId));
      for (const stop of routeStops) {
        const ssStudents = await db.select({ studentId: stopStudents.studentId }).from(stopStudents).where(eq(stopStudents.stopId, stop.id));
        for (const ss of ssStudents) {
          const guardianList = await db.select({ userId: guardians.userId }).from(guardians).where(eq(guardians.studentId, ss.studentId));
          for (const g of guardianList) {
            await db.insert(notifications).values({
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
      emitToMunicipality(route.municipalityId, 'trip:started', {
        tripId: trip.id,
        routeId: input.routeId,
        routeName: route.name,
        municipalityId: route.municipalityId,
        time: new Date().toISOString(),
      });

      return { success: true, tripId: trip.id };
    }),

  arriveAtStop: protectedProcedure
    .input(z.object({ tripId: z.number(), stopId: z.number(), latitude: z.number(), longitude: z.number() }))
    .mutation(async ({ input }) => {
      await db.insert(tripStopLogs).values({
        tripId: input.tripId, stopId: input.stopId, arrivedAt: new Date(),
        latitude: input.latitude.toString(), longitude: input.longitude.toString(),
      });

      const [trip] = await db.select().from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (trip) {
        await db.update(trips).set({ currentStopIndex: (trip.currentStopIndex ?? 0) + 1 }).where(eq(trips.id, input.tripId));
      }

      const [stopInfo] = await db.select().from(stops).where(eq(stops.id, input.stopId)).limit(1);
      const stopStudentList = await db.select({ studentId: stopStudents.studentId }).from(stopStudents).where(eq(stopStudents.stopId, input.stopId));
      for (const ss of stopStudentList) {
        const guardianList = await db.select({ userId: guardians.userId }).from(guardians).where(eq(guardians.studentId, ss.studentId));
        for (const g of guardianList) {
          await db.insert(notifications).values({
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
        const [route] = await db.select({ municipalityId: routes.municipalityId }).from(routes).where(eq(routes.id, trip.routeId)).limit(1);
        if (route) {
          emitToMunicipality(route.municipalityId, 'stop:arrived', {
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
    .input(z.object({ tripId: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(trips).set({ status: 'completed', completedAt: new Date() }).where(eq(trips.id, input.tripId));

      const [trip] = await db.select().from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (trip) {
        const routeStops = await db.select().from(stops).where(eq(stops.routeId, trip.routeId));
        for (const stop of routeStops) {
          const ssStudents = await db.select({ studentId: stopStudents.studentId }).from(stopStudents).where(eq(stopStudents.stopId, stop.id));
          for (const ss of ssStudents) {
            const guardianList = await db.select({ userId: guardians.userId }).from(guardians).where(eq(guardians.studentId, ss.studentId));
            for (const g of guardianList) {
              await db.insert(notifications).values({
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
        const [routeComplete] = await db.select({ municipalityId: routes.municipalityId }).from(routes).where(eq(routes.id, trip.routeId)).limit(1);
        if (routeComplete) {
          emitToMunicipality(routeComplete.municipalityId, 'trip:completed', {
            tripId: input.tripId,
            municipalityId: routeComplete.municipalityId,
            time: new Date().toISOString(),
          });
        }
      }
      return { success: true };
    }),

  updateLocation: protectedProcedure
    .input(z.object({ tripId: z.number(), driverId: z.number(), latitude: z.number(), longitude: z.number(), speed: z.number().optional(), heading: z.number().optional() }))
    .mutation(async ({ input }) => {
      await db.insert(locationHistory).values({
        tripId: input.tripId, driverId: input.driverId,
        latitude: input.latitude.toString(), longitude: input.longitude.toString(),
        speed: input.speed?.toString(), heading: input.heading,
      });
      await db.update(drivers).set({
        currentLatitude: input.latitude.toString(),
        currentLongitude: input.longitude.toString(),
        lastLocationUpdate: new Date(),
      }).where(eq(drivers.id, input.driverId));

      // Emitir posição via Socket.IO para todos os clientes do município
      const [trip] = await db.select({ routeId: trips.routeId }).from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (trip) {
        const [route] = await db.select({ municipalityId: routes.municipalityId, name: routes.name }).from(routes).where(eq(routes.id, trip.routeId)).limit(1);
        if (route) {
          emitToMunicipality(route.municipalityId, 'bus:location', {
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
    .input(z.object({ municipalityId: z.number(), startDate: z.string().optional(), endDate: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return db.select({ trip: trips, route: { id: routes.id, name: routes.name } })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(eq(routes.municipalityId, input.municipalityId))
        .orderBy(desc(trips.tripDate))
        .limit(input.limit);
    }),
});

// ============================================
// VEHICLES ROUTER
// ============================================
export const vehiclesRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(vehicles).where(eq(vehicles.municipalityId, input.municipalityId)).orderBy(vehicles.nickname);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), plate: z.string(), nickname: z.string().optional(),
      brand: z.string().optional(), model: z.string().optional(), year: z.number().optional(), capacity: z.number().optional(),
      color: z.string().optional(), fuel: z.string().optional(), chassis: z.string().optional(), renavam: z.string().optional(),
      crlvExpiry: z.string().optional(), ipvaExpiry: z.string().optional(), inspectionExpiry: z.string().optional(),
      insuranceCompany: z.string().optional(), insurancePolicy: z.string().optional(), insuranceExpiry: z.string().optional(),
      fireExtinguisherExpiry: z.string().optional(), currentKm: z.number().optional(),
      lastMaintenanceAt: z.string().optional(), nextMaintenanceAt: z.string().optional(),
      gpsDeviceId: z.string().optional(), gpsDeviceModel: z.string().optional(),
      observations: z.string().optional(),
      status: z.enum(['active', 'maintenance', 'inactive']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { crlvExpiry, ipvaExpiry, inspectionExpiry, insuranceExpiry, fireExtinguisherExpiry, fuel, chassis, lastMaintenanceAt, nextMaintenanceAt, ...rest } = input;
      const [vehicle] = await db.insert(vehicles).values({
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

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      plate: z.string().optional(), nickname: z.string().optional(),
      brand: z.string().optional(), model: z.string().optional(), year: z.number().optional(), capacity: z.number().optional(),
      color: z.string().optional(), fuel: z.string().optional(), chassis: z.string().optional(), renavam: z.string().optional(),
      status: z.enum(['active', 'maintenance', 'inactive']).optional(),
      crlvExpiry: z.string().optional(), ipvaExpiry: z.string().optional(), inspectionExpiry: z.string().optional(),
      insuranceCompany: z.string().optional(), insurancePolicy: z.string().optional(), insuranceExpiry: z.string().optional(),
      fireExtinguisherExpiry: z.string().optional(), currentKm: z.number().optional(),
      lastMaintenanceAt: z.string().optional(), nextMaintenanceAt: z.string().optional(),
      gpsDeviceId: z.string().optional(), gpsDeviceModel: z.string().optional(),
      observations: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, crlvExpiry, ipvaExpiry, inspectionExpiry, insuranceExpiry, fireExtinguisherExpiry, fuel, chassis, lastMaintenanceAt, nextMaintenanceAt, ...data } = input;
      const ud: any = { ...data };
      if (fuel !== undefined) ud.fuelType = fuel;
      if (chassis !== undefined) ud.chassi = chassis;
      if (crlvExpiry) ud.crlvExpiry = new Date(crlvExpiry);
      if (ipvaExpiry) ud.ipvaExpiry = new Date(ipvaExpiry);
      if (inspectionExpiry) ud.inspectionExpiry = new Date(inspectionExpiry);
      if (insuranceExpiry) ud.insuranceExpiry = new Date(insuranceExpiry);
      if (fireExtinguisherExpiry) ud.fireExtinguisherExpiry = new Date(fireExtinguisherExpiry);
      if (lastMaintenanceAt) ud.lastMaintenanceAt = new Date(lastMaintenanceAt);
      if (nextMaintenanceAt) ud.nextMaintenanceAt = new Date(nextMaintenanceAt);
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(vehicles).set(ud).where(eq(vehicles.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasTrips] = await db.select({ c: sql`count(*)`.as('c') }).from(trips).where(eq(trips.vehicleId, input.id));
      const [hasMaint] = await db.select({ c: sql`count(*)`.as('c') }).from(maintenanceRecords).where(eq(maintenanceRecords.vehicleId, input.id));
      const [hasFuel] = await db.select({ c: sql`count(*)`.as('c') }).from(fuelRecords).where(eq(fuelRecords.vehicleId, input.id));
      const deps: string[] = [];
      if (Number(hasTrips.c) > 0) deps.push(`${hasTrips.c} viagem(ns)`);
      if (Number(hasMaint.c) > 0) deps.push(`${hasMaint.c} manutenção(ões)`);
      if (Number(hasFuel.c) > 0) deps.push(`${hasFuel.c} abastecimento(s)`);
      if (deps.length > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Veículo possui: ${deps.join(', ')}` });
      await db.update(vehicles).set({ status: 'inactive' }).where(eq(vehicles.id, input.id));
      return { success: true };
    }),
});

// ============================================
// DRIVERS ROUTER
// ============================================
export const driversRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const driverList = await db.select({
        driver: drivers,
        user: { id: users.id, name: users.name, email: users.email, phone: users.phone, cpf: users.cpf },
      })
      .from(drivers)
      .innerJoin(users, eq(drivers.userId, users.id))
      .where(eq(drivers.municipalityId, input.municipalityId));

      // Find linked routes for each driver
      const enriched = await Promise.all(driverList.map(async (d) => {
        const [linkedRoute] = await db.select({ id: routes.id, name: routes.name, code: routes.code })
          .from(routes).where(and(eq(routes.defaultDriverId, d.driver.id), eq(routes.isActive, true))).limit(1);
        return { ...d, linkedRoute: linkedRoute || null };
      }));
      return enriched;
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      password: z.string().optional(),
      cpf: z.string().optional(),
      birthDate: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      cnhNumber: z.string().optional(),
      cnhCategory: z.string().optional(),
      cnhExpiry: z.string().optional(),
      experience: z.number().optional(),
      routeId: z.number().optional(),
      vehicleId: z.number().optional(),
      photo: z.string().optional(),
      observations: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);
      // Gerar email temporario se nao informado
      const email = input.email || (input.name.toLowerCase().replace(/\s+/g, '.') + '@motorista.netescol.local');
      // Gerar senha padrao se nao informada
      const pwd = input.password || 'Trans@' + Math.floor(1000 + Math.random() * 9000);
      const passwordHash = await hash(pwd, 12);

      try {
        const [user] = await db.insert(users).values({
          municipalityId: input.municipalityId, email, passwordHash,
          name: input.name, phone: input.phone, cpf: input.cpf, role: 'driver',
        }).$returningId();

        const [driver] = await db.insert(drivers).values({
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
          await db.update(routes).set({ defaultDriverId: driver.id }).where(eq(routes.id, input.routeId));
        }

        return { success: true, driverId: driver.id, userId: user.id, generatedPassword: input.password ? undefined : pwd };
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
          if (err.message.includes('email')) throw new TRPCError({ code: 'CONFLICT', message: 'Este e-mail ja esta cadastrado.' });
          if (err.message.includes('cpf')) throw new TRPCError({ code: 'CONFLICT', message: 'Este CPF ja esta cadastrado.' });
          throw new TRPCError({ code: 'CONFLICT', message: 'Registro duplicado. Verifique e-mail e CPF.' });
        }
        throw err;
      }
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      cpf: z.string().optional(),
      email: z.string().optional(),
      cnhNumber: z.string().optional(),
      cnhCategory: z.string().optional(),
      cnhExpiry: z.string().optional(),
      vehicleId: z.number().optional(),
      routeId: z.number().optional(),
      isAvailable: z.boolean().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      birthDate: z.string().optional(),
      experience: z.number().optional(),
      photo: z.string().optional(),
      observations: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);
      const { id, routeId, name, phone, cpf, email, cnhExpiry, birthDate, experience, photo, observations, address, city, state, ...driverData } = input;
      // Atualizar dados do driver
      const ud: any = { ...driverData };
      if (cnhExpiry) ud.cnhExpiresAt = new Date(cnhExpiry);
      if (address !== undefined) ud.address = address;
      if (city !== undefined) ud.city = city;
      if (state !== undefined) ud.state = state;
      if (birthDate) ud.birthDate = new Date(birthDate);
      if (experience !== undefined) ud.experience = experience;
      if (photo !== undefined) ud.photo = photo;
      if (observations !== undefined) ud.observations = observations;
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(drivers).set(ud).where(eq(drivers.id, id));
      // Atualizar dados do user vinculado
      const [driver] = await db.select({ userId: drivers.userId }).from(drivers).where(eq(drivers.id, id)).limit(1);
      if (driver) {
        const userData: any = {};
        if (name) userData.name = name;
        if (phone) userData.phone = phone;
        if (cpf) userData.cpf = cpf;
        if (email) userData.email = email;
        if (Object.keys(userData).length > 0) await db.update(users).set(userData).where(eq(users.id, driver.userId));
      }
      // Vincular rota se informada
      if (routeId) {
        await db.update(routes).set({ defaultDriverId: id }).where(eq(routes.id, routeId));
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasTrips] = await db.select({ c: sql`count(*)`.as('c') }).from(trips).where(eq(trips.driverId, input.id));
      if (Number(hasTrips.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Motorista possui ${hasTrips.c} viagem(ns) registrada(s)` });
      await db.update(drivers).set({ isAvailable: false }).where(eq(drivers.id, input.id));
      return { success: true };
    }),
});

// ============================================
// NOTIFICATIONS ROUTER
// ============================================
export const notificationsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return db.select().from(notifications)
        .where(eq(notifications.userId, ctx.userId!))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.userId!), eq(notifications.isRead, false)));
    return { count: result?.count || 0 };
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.id, input.id));
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.userId, ctx.userId!));
    return { success: true };
  }),
});

// ============================================
// USERS ROUTER
// ============================================
export const usersRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return await db.select({
        id: users.id, name: users.name, email: users.email, role: users.role,
        municipalityId: users.municipalityId, cpf: users.cpf, phone: users.phone,
        avatarUrl: users.avatarUrl, isActive: users.isActive, createdAt: users.createdAt
      })
        .from(users).where(eq(users.municipalityId, input.municipalityId));
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string(),
      email: z.string().email(),
      role: z.enum(['super_admin', 'municipal_admin', 'secretary', 'school_admin', 'driver', 'monitor', 'parent']).default('secretary'),
      password: z.string().min(6),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      username: z.string().optional(),
      birthDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);
      const { password, username, birthDate, ...rest } = input;
      const passwordHash = await hash(password, 10);
      try {
        const [result] = await db.insert(users).values({ ...rest, passwordHash });
        return { id: result.insertId, success: true };
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
          if (err.message.includes('users_email_unique')) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Este e-mail ja esta cadastrado no sistema.' });
          }
          if (err.message.includes('users_cpf_unique')) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Este CPF ja esta cadastrado no sistema.' });
          }
          throw new TRPCError({ code: 'CONFLICT', message: 'Registro duplicado. Verifique e-mail e CPF.' });
        }
        throw err;
      }
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.enum(['super_admin', 'municipal_admin', 'secretary', 'school_admin', 'driver', 'monitor', 'parent']).optional(),
      password: z.string().min(6).optional(),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      municipalityId: z.number().optional(),
      username: z.string().optional(),
      birthDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);
      const { id, password, username, birthDate, ...data } = input;
      const updateData: any = { ...data };
      if (password) {
        updateData.passwordHash = await hash(password, 10);
      }
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
      if (Object.keys(updateData).length > 0) {
        try {
          await db.update(users).set(updateData).where(eq(users.id, id));
        } catch (err: any) {
          if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
            if (err.message.includes('users_email_unique')) {
              throw new TRPCError({ code: 'CONFLICT', message: 'Este e-mail ja esta em uso por outro usuario.' });
            }
            if (err.message.includes('users_cpf_unique')) {
              throw new TRPCError({ code: 'CONFLICT', message: 'Este CPF ja esta em uso por outro usuario.' });
            }
            throw new TRPCError({ code: 'CONFLICT', message: 'Registro duplicado. Verifique e-mail e CPF.' });
          }
          throw err;
        }
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [isDriver] = await db.select({ c: sql`count(*)`.as('c') }).from(drivers).where(eq(drivers.userId, input.id));
      const [isTeacher] = await db.select({ c: sql`count(*)`.as('c') }).from(teachers).where(eq(teachers.userId, input.id));
      const [isGuardian] = await db.select({ c: sql`count(*)`.as('c') }).from(guardians).where(eq(guardians.userId, input.id));
      const deps: string[] = [];
      if (Number(isDriver.c) > 0) deps.push('motorista');
      if (Number(isTeacher.c) > 0) deps.push('professor');
      if (Number(isGuardian.c) > 0) deps.push('responsável de aluno');
      if (deps.length > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Usuário vinculado como: ${deps.join(', ')}` });
      await db.update(users).set({ isActive: false }).where(eq(users.id, input.id));
      return { success: true };
    }),
});

export const guardiansRouter = t.router({
  // Listar filhos/dependentes do responsável
  myStudents: protectedProcedure.query(async ({ ctx }) => {
    const guardianLinks = await db.select({
      guardianId: guardians.id,
      studentId: guardians.studentId,
      relationship: guardians.relationship,
      isPrimary: guardians.isPrimary,
    }).from(guardians).where(eq(guardians.userId, ctx.userId!));

    if (guardianLinks.length === 0) return [];

    const studentIds = guardianLinks.map(g => g.studentId);
    const studentList = await db.select().from(students).where(inArray(students.id, studentIds));

    const result = await Promise.all(studentList.map(async (student) => {
      const [school] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, student.schoolId)).limit(1);
      const link = guardianLinks.find(g => g.studentId === student.id);

      // Verificar se o aluno tem viagem ativa
      const studentStops = await db.select({ stopId: stopStudents.stopId, routeId: stops.routeId })
        .from(stopStudents)
        .innerJoin(stops, eq(stopStudents.stopId, stops.id))
        .where(eq(stopStudents.studentId, student.id));

      let activeTrip = null;
      if (studentStops.length > 0) {
        const routeIds = [...new Set(studentStops.map(s => s.routeId))];
        for (const routeId of routeIds) {
          const [trip] = await db.select({ id: trips.id, status: trips.status, startedAt: trips.startedAt, currentStopIndex: trips.currentStopIndex })
            .from(trips).where(and(eq(trips.routeId, routeId), eq(trips.status, 'started'))).limit(1);
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
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verificar que é responsável deste aluno
      const [guardianLink] = await db.select().from(guardians)
        .where(and(eq(guardians.userId, ctx.userId!), eq(guardians.studentId, input.studentId))).limit(1);
      if (!guardianLink) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      // Encontrar a rota do aluno
      const studentStops = await db.select({ stopId: stopStudents.stopId, routeId: stops.routeId })
        .from(stopStudents)
        .innerJoin(stops, eq(stopStudents.stopId, stops.id))
        .where(eq(stopStudents.studentId, input.studentId));

      if (studentStops.length === 0) return null;

      const routeIds = [...new Set(studentStops.map(s => s.routeId))];
      for (const routeId of routeIds) {
        const [trip] = await db.select().from(trips)
          .where(and(eq(trips.routeId, routeId), eq(trips.status, 'started'))).limit(1);
        if (!trip) continue;

        const [route] = await db.select().from(routes).where(eq(routes.id, routeId)).limit(1);
        const [driver] = await db.select().from(drivers).where(eq(drivers.id, trip.driverId)).limit(1);
        const [driverUser] = driver ? await db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, driver.userId)).limit(1) : [null];
        const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, trip.vehicleId)).limit(1);
        const tripStops = await db.select().from(stops).where(eq(stops.routeId, routeId)).orderBy(stops.orderIndex);
        const stopLogs = await db.select().from(tripStopLogs).where(eq(tripStopLogs.tripId, trip.id));
        const studentStop = studentStops.find(s => s.routeId === routeId);

        return {
          trip,
          route,
          driverName: driverUser?.name || 'Motorista',
          driverPhone: driverUser?.phone || null,
          vehicle: vehicle ? { plate: vehicle.plate, nickname: vehicle.nickname } : null,
          driverLocation: driver && driver.currentLatitude && driver.currentLongitude ? { lat: parseFloat(driver.currentLatitude as any), lng: parseFloat(driver.currentLongitude as any), updatedAt: driver.lastLocationUpdate } : null,
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
    .input(z.object({
      studentEnrollment: z.string().min(1),
      relationship: z.enum(['father', 'mother', 'grandparent', 'uncle', 'other']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [student] = await db.select().from(students).where(eq(students.enrollment, input.studentEnrollment)).limit(1);
      if (!student) throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });

      const existing = await db.select().from(guardians)
        .where(and(eq(guardians.userId, ctx.userId!), eq(guardians.studentId, student.id))).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: 'CONFLICT', message: 'Aluno já vinculado' });

      await db.insert(guardians).values({
        userId: ctx.userId!,
        studentId: student.id,
        relationship: input.relationship || 'other',
        isPrimary: false,
        canPickup: true,
      });
      return { success: true, studentName: student.name };
    }),

  // Histórico de viagens do aluno
  studentTripHistory: protectedProcedure
    .input(z.object({ studentId: z.number(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const [guardianLink] = await db.select().from(guardians)
        .where(and(eq(guardians.userId, ctx.userId!), eq(guardians.studentId, input.studentId))).limit(1);
      if (!guardianLink) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });

      const studentStops = await db.select({ routeId: stops.routeId })
        .from(stopStudents)
        .innerJoin(stops, eq(stopStudents.stopId, stops.id))
        .where(eq(stopStudents.studentId, input.studentId));

      const routeIds = [...new Set(studentStops.map(s => s.routeId))];
      if (routeIds.length === 0) return [];

      const tripHistory = await db.select({ trip: trips, route: { id: routes.id, name: routes.name } })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(inArray(trips.routeId, routeIds))
        .orderBy(desc(trips.tripDate))
        .limit(input.limit);

      return tripHistory;
    }),

  // ============================================
  // PORTAL DO RESPONSÁVEL - ENDPOINTS ACADÊMICOS
  // ============================================

  // 1. Boletim do aluno
  studentReportCard: protectedProcedure
    .input(z.object({ studentId: z.number(), classId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!await verifyGuardianAccess(ctx.userId!, input.studentId)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      // Buscar avaliações da turma
      const classAssessments = await db.select().from(assessments)
        .where(and(eq(assessments.classId, input.classId), eq(assessments.isActive, true)));

      if (classAssessments.length === 0) return { subjects: [], summary: { average: 0, totalAssessments: 0 } };

      const assessmentIds = classAssessments.map(a => a.id);

      // Buscar notas do aluno
      const grades = await db.select().from(studentGrades)
        .where(and(eq(studentGrades.studentId, input.studentId), inArray(studentGrades.assessmentId, assessmentIds)));

      // Buscar nomes das disciplinas
      const subjectIds = [...new Set(classAssessments.map(a => a.subjectId))];
      const subjectList = subjectIds.length > 0
        ? await db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(inArray(subjects.id, subjectIds))
        : [];

      // Agrupar por disciplina e bimestre
      const subjectMap: Record<number, { subjectName: string; bimesters: Record<string, { assessments: any[]; average: number }> }> = {};

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
  studentAttendance: protectedProcedure
    .input(z.object({ studentId: z.number(), classId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (!await verifyGuardianAccess(ctx.userId!, input.studentId)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      const conditions: any[] = [eq(dailyAttendance.studentId, input.studentId)];
      if (input.classId) conditions.push(eq(dailyAttendance.classId, input.classId));

      const records = await db.select().from(dailyAttendance).where(and(...conditions));

      const totalDays = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const justified = records.filter(r => r.status === 'justified').length;
      const late = records.filter(r => r.status === 'late').length;
      const percentPresent = totalDays > 0 ? Math.round(((present + late + justified) / totalDays) * 10000) / 100 : 0;

      // Breakdown mensal
      const monthlyMap: Record<string, { present: number; absent: number; justified: number; late: number; total: number }> = {};
      for (const r of records) {
        const month = r.date ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}` : 'unknown';
        if (!monthlyMap[month]) monthlyMap[month] = { present: 0, absent: 0, justified: 0, late: 0, total: 0 };
        monthlyMap[month].total++;
        if (r.status === 'present') monthlyMap[month].present++;
        else if (r.status === 'absent') monthlyMap[month].absent++;
        else if (r.status === 'justified') monthlyMap[month].justified++;
        else if (r.status === 'late') monthlyMap[month].late++;
      }

      const monthly = Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month));

      return { totalDays, present, absent, justified, late, percentPresent, monthly };
    }),

  // 3. Parecer descritivo
  studentParecer: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!await verifyGuardianAccess(ctx.userId!, input.studentId)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      const reports = await db.select({
        id: descriptiveReports.id,
        bimester: descriptiveReports.bimester,
        content: descriptiveReports.content,
        classId: descriptiveReports.classId,
        createdAt: descriptiveReports.createdAt,
      }).from(descriptiveReports)
        .where(and(
          eq(descriptiveReports.studentId, input.studentId),
          eq(descriptiveReports.status, 'published'),
          eq(descriptiveReports.isActive, true),
        ))
        .orderBy(descriptiveReports.bimester);

      // Enriquecer com nome da turma
      const result = await Promise.all(reports.map(async (r) => {
        const [cls] = await db.select({ name: classes.name }).from(classes).where(eq(classes.id, r.classId)).limit(1);
        return { ...r, className: cls?.name || '' };
      }));

      return result;
    }),

  // 4. Ocorrências do aluno
  studentOccurrences: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!await verifyGuardianAccess(ctx.userId!, input.studentId)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      const occurrences = await db.select().from(studentOccurrences)
        .where(eq(studentOccurrences.studentId, input.studentId))
        .orderBy(desc(studentOccurrences.date));

      return occurrences;
    }),

  // 5. Calendário escolar
  schoolCalendar: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!await verifyGuardianAccess(ctx.userId!, input.studentId)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      // Buscar escola e município do aluno
      const [student] = await db.select({ schoolId: students.schoolId, municipalityId: students.municipalityId })
        .from(students).where(eq(students.id, input.studentId)).limit(1);
      if (!student) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });

      const events = await db.select().from(schoolCalendar)
        .where(and(
          eq(schoolCalendar.municipalityId, student.municipalityId),
          eq(schoolCalendar.isActive, true),
          or(
            eq(schoolCalendar.schoolId, student.schoolId),
            sql`${schoolCalendar.schoolId} IS NULL`
          )
        ))
        .orderBy(schoolCalendar.startDate);

      return events;
    }),

  // 6. Cardápio da merenda
  schoolMenu: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!await verifyGuardianAccess(ctx.userId!, input.studentId)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      const [student] = await db.select({ municipalityId: students.municipalityId, schoolId: students.schoolId })
        .from(students).where(eq(students.id, input.studentId)).limit(1);
      if (!student) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });

      const menus = await db.select().from(mealMenus)
        .where(and(
          eq(mealMenus.municipalityId, student.municipalityId),
          eq(mealMenus.isActive, true),
          or(
            eq(mealMenus.schoolId, student.schoolId),
            sql`${mealMenus.schoolId} IS NULL`
          )
        ))
        .orderBy(desc(mealMenus.date))
        .limit(30);

      return menus;
    }),

  // 7. Mensagens para o responsável
  myMessages: protectedProcedure
    .query(async ({ ctx }) => {
      // Buscar todos os alunos vinculados a este responsável
      const guardianLinks = await db.select({
        studentId: guardians.studentId,
      }).from(guardians).where(eq(guardians.userId, ctx.userId!));

      if (guardianLinks.length === 0) return [];

      const studentIds = guardianLinks.map(g => g.studentId);

      // Buscar dados dos alunos (escola, município)
      const studentList = await db.select({
        id: students.id, schoolId: students.schoolId, municipalityId: students.municipalityId,
      }).from(students).where(inArray(students.id, studentIds));

      if (studentList.length === 0) return [];

      const municipalityIds = [...new Set(studentList.map(s => s.municipalityId))];
      const schoolIds = [...new Set(studentList.map(s => s.schoolId))];

      // Buscar matrículas ativas para saber as turmas
      const activeEnrollments = await db.select({
        studentId: enrollments.studentId, classId: enrollments.classId,
      }).from(enrollments)
        .where(and(inArray(enrollments.studentId, studentIds), eq(enrollments.status, 'active')));

      const classIds = [...new Set(activeEnrollments.map(e => e.classId))];

      // Buscar mensagens que se aplicam
      const allMessages = await db.select().from(messages)
        .where(and(
          inArray(messages.municipalityId, municipalityIds),
          eq(messages.isActive, true),
          or(
            eq(messages.targetType, 'all'),
            and(eq(messages.targetType, 'student'), inArray(messages.targetStudentId, studentIds)),
            ...(schoolIds.length > 0 ? [and(eq(messages.targetType, 'school'), inArray(messages.schoolId, schoolIds))] : []),
            ...(classIds.length > 0 ? [and(eq(messages.targetType, 'class'), inArray(messages.targetClassId, classIds))] : []),
          )
        ))
        .orderBy(desc(messages.createdAt))
        .limit(50);

      // Enriquecer com nome do remetente
      const result = await Promise.all(allMessages.map(async (msg) => {
        const [sender] = await db.select({ name: users.name }).from(users).where(eq(users.id, msg.senderUserId)).limit(1);
        return { ...msg, senderName: sender?.name || 'Sistema' };
      }));

      return result;
    }),

  // 8. Informações de matrícula do aluno
  studentEnrollmentInfo: protectedProcedure
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!await verifyGuardianAccess(ctx.userId!, input.studentId)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado a este aluno' });

      // Buscar matrícula ativa mais recente
      const enrollmentList = await db.select({
        enrollmentId: enrollments.id,
        classId: enrollments.classId,
        academicYearId: enrollments.academicYearId,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
      }).from(enrollments)
        .where(and(eq(enrollments.studentId, input.studentId), eq(enrollments.status, 'active')))
        .orderBy(desc(enrollments.enrollmentDate))
        .limit(1);

      if (enrollmentList.length === 0) return null;

      const enrollment = enrollmentList[0];

      // Buscar nome da turma
      const [cls] = await db.select({ name: classes.name, schoolId: classes.schoolId }).from(classes)
        .where(eq(classes.id, enrollment.classId)).limit(1);

      // Buscar nome da escola
      const [school] = cls ? await db.select({ name: schools.name }).from(schools)
        .where(eq(schools.id, cls.schoolId)).limit(1) : [null];

      // Buscar ano letivo
      const [year] = await db.select({ year: academicYears.year, name: academicYears.name }).from(academicYears)
        .where(eq(academicYears.id, enrollment.academicYearId)).limit(1);

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
export const monitorsRouter = t.router({
  // Obter viagem ativa do monitor/motorista
  myActiveTrip: protectedProcedure.query(async ({ ctx }) => {
    // Buscar se é motorista
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, ctx.userId!)).limit(1);
    if (!driver) return null;

    // Buscar TODAS as viagens ativas deste motorista (pode haver mais de uma presa)
    const allActive = await db.select().from(trips)
      .where(and(eq(trips.driverId, driver.id), eq(trips.status, 'started')));

    // Se não há viagens ativas, retornar null
    if (allActive.length === 0) return null;

    // Se há mais de uma, finalizar as extras (manter só a mais recente)
    if (allActive.length > 1) {
      const sorted = allActive.sort((a, b) => (b.id || 0) - (a.id || 0));
      for (let i = 1; i < sorted.length; i++) {
        await db.update(trips).set({ status: 'completed', completedAt: new Date() }).where(eq(trips.id, sorted[i].id));
      }
    }

    const activeTrip = allActive.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
    if (!activeTrip) return null;

    const [route] = await db.select().from(routes).where(eq(routes.id, activeTrip.routeId)).limit(1);
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, activeTrip.vehicleId)).limit(1);
    const tripStops = await db.select().from(stops).where(eq(stops.routeId, activeTrip.routeId)).orderBy(stops.orderIndex);

    const stopsWithStudents = await Promise.all(tripStops.map(async (stop) => {
      const stopStudentList = await db.select({
        id: students.id, name: students.name, photoUrl: students.photoUrl,
        hasSpecialNeeds: students.hasSpecialNeeds, grade: students.grade,
      })
      .from(stopStudents)
      .innerJoin(students, eq(stopStudents.studentId, students.id))
      .where(eq(stopStudents.stopId, stop.id));

      // Verificar quais alunos já embarcaram nesta viagem
      const boardedLogs = await db.select({ studentId: tripStudentLogs.studentId, eventType: tripStudentLogs.eventType })
        .from(tripStudentLogs)
        .where(and(eq(tripStudentLogs.tripId, activeTrip.id), eq(tripStudentLogs.stopId, stop.id)));

      const studentsWithStatus = stopStudentList.map(s => ({
        ...s,
        status: boardedLogs.find(l => l.studentId === s.id)?.eventType || 'pending',
      }));

      const stopLog = await db.select().from(tripStopLogs)
        .where(and(eq(tripStopLogs.tripId, activeTrip.id), eq(tripStopLogs.stopId, stop.id))).limit(1);

      return { ...stop, students: studentsWithStatus, arrived: stopLog.length > 0, arrivedAt: stopLog[0]?.arrivedAt || null };
    }));

    const stopLogs = await db.select().from(tripStopLogs).where(eq(tripStopLogs.tripId, activeTrip.id));

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
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, ctx.userId!)).limit(1);
    if (!driver) return { driver: null, routes: [] };

    const assignedRoutes = await db.select().from(routes)
      .where(and(eq(routes.defaultDriverId, driver.id), eq(routes.isActive, true)));

    const [vehicle] = driver.vehicleId
      ? await db.select().from(vehicles).where(eq(vehicles.id, driver.vehicleId)).limit(1)
      : [null];

    return { driver: { id: driver.id, vehicleId: driver.vehicleId }, vehicle, routes: assignedRoutes };
  }),

  // Registrar embarque de aluno
  boardStudent: staffProcedure
    .input(z.object({
      tripId: z.number(),
      studentId: z.number(),
      stopId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar se já foi registrado
      const existing = await db.select().from(tripStudentLogs)
        .where(and(
          eq(tripStudentLogs.tripId, input.tripId),
          eq(tripStudentLogs.studentId, input.studentId),
          eq(tripStudentLogs.stopId, input.stopId),
          eq(tripStudentLogs.eventType, 'boarded')
        )).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: 'CONFLICT', message: 'Aluno já embarcado' });

      await db.insert(tripStudentLogs).values({
        tripId: input.tripId,
        studentId: input.studentId,
        stopId: input.stopId,
        eventType: 'boarded',
        eventAt: new Date(),
        registeredByUserId: ctx.userId,
      });

      // Incrementar contador
      const [trip] = await db.select().from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (trip) {
        await db.update(trips).set({ totalStudentsBoarded: (trip.totalStudentsBoarded ?? 0) + 1 }).where(eq(trips.id, input.tripId));
      }

      // Notificar responsáveis
      const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, input.studentId)).limit(1);
      const guardianList = await db.select({ userId: guardians.userId }).from(guardians).where(eq(guardians.studentId, input.studentId));
      for (const g of guardianList) {
        await db.insert(notifications).values({
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
      const [tripInfo] = await db.select({ routeId: trips.routeId }).from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (tripInfo) {
        const [routeInfo] = await db.select({ municipalityId: routes.municipalityId }).from(routes).where(eq(routes.id, tripInfo.routeId)).limit(1);
        if (routeInfo) {
          emitToMunicipality(routeInfo.municipalityId, 'student:boarded', {
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
    .input(z.object({
      tripId: z.number(),
      studentId: z.number(),
      stopId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(tripStudentLogs).values({
        tripId: input.tripId,
        studentId: input.studentId,
        stopId: input.stopId,
        eventType: 'dropped',
        eventAt: new Date(),
        registeredByUserId: ctx.userId,
      });

      const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, input.studentId)).limit(1);
      const guardianList = await db.select({ userId: guardians.userId }).from(guardians).where(eq(guardians.studentId, input.studentId));
      for (const g of guardianList) {
        await db.insert(notifications).values({
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
      const [tripDrop] = await db.select({ routeId: trips.routeId }).from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (tripDrop) {
        const [routeDrop] = await db.select({ municipalityId: routes.municipalityId }).from(routes).where(eq(routes.id, tripDrop.routeId)).limit(1);
        if (routeDrop) {
          emitToMunicipality(routeDrop.municipalityId, 'student:dropped', {
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
    .input(z.object({
      tripId: z.number(),
      studentId: z.number(),
      stopId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(tripStudentLogs).values({
        tripId: input.tripId,
        studentId: input.studentId,
        stopId: input.stopId,
        eventType: 'absent',
        eventAt: new Date(),
        registeredByUserId: ctx.userId,
        notes: input.notes,
      });

      // Notificar responsáveis
      const [student] = await db.select({ name: students.name }).from(students).where(eq(students.id, input.studentId)).limit(1);
      const guardianList = await db.select({ userId: guardians.userId }).from(guardians).where(eq(guardians.studentId, input.studentId));
      for (const g of guardianList) {
        await db.insert(notifications).values({
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
      const [tripAbsent] = await db.select({ routeId: trips.routeId }).from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (tripAbsent) {
        const [routeAbsent] = await db.select({ municipalityId: routes.municipalityId }).from(routes).where(eq(routes.id, tripAbsent.routeId)).limit(1);
        if (routeAbsent) {
          emitToMunicipality(routeAbsent.municipalityId, 'student:absent', {
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
  tripSummary: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input }) => {
      const logs = await db.select().from(tripStudentLogs).where(eq(tripStudentLogs.tripId, input.tripId));
      const boarded = logs.filter(l => l.eventType === 'boarded').length;
      const dropped = logs.filter(l => l.eventType === 'dropped').length;
      const absent = logs.filter(l => l.eventType === 'absent').length;
      const [trip] = await db.select().from(trips).where(eq(trips.id, input.tripId)).limit(1);

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
export const monitorStaffRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(monitorStaff)
        .where(and(eq(monitorStaff.municipalityId, input.municipalityId), eq(monitorStaff.isActive, true)))
        .orderBy(monitorStaff.name);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string().min(2),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      birthDate: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening', 'full']).optional(),
      routeName: z.string().optional(),
      observations: z.string().optional(),
      photoUrl: z.string().optional(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);
      const { password, birthDate, ...rest } = input;
      let userId: number | undefined;
      if (input.email && password && password.length >= 6) {
        const passwordHash = await hash(password, 12);
        const [user] = await db.insert(users).values({
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
      const [monitor] = await db.insert(monitorStaff).values({
        ...rest,
        userId,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      }).$returningId();
      return { success: true, id: monitor.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      cpf: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening', 'full']).optional(),
      routeName: z.string().optional(),
      observations: z.string().optional(),
      photoUrl: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) updateData[k] = v; });
      if (Object.keys(updateData).length > 0) {
        await db.update(monitorStaff).set(updateData).where(eq(monitorStaff.id, id));
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(monitorStaff).where(eq(monitorStaff.id, input.id));
      return { success: true };
    }),
});

// ============================================
// CONTRACTS ROUTER
// ============================================
export const contractsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(contracts)
        .where(and(eq(contracts.municipalityId, input.municipalityId), eq(contracts.isActive, true)))
        .orderBy(desc(contracts.createdAt));
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      number: z.string().min(1),
      type: z.string().optional(),
      supplier: z.string().min(1),
      cnpj: z.string().optional(),
      object: z.string().optional(),
      value: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      responsibleName: z.string().optional(),
      responsiblePhone: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      validateOptionalCNPJ(input.cnpj);
      // Usar municipalityId do contexto JWT se disponivel, senao usar o enviado
      const munId = ctx.municipalityId || input.municipalityId;
      const [mun] = await db.select({ id: municipalities.id }).from(municipalities).where(eq(municipalities.id, munId)).limit(1);
      if (!mun) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Municipio nao encontrado. Faca logout e login novamente.' });
      }
      const { startDate, endDate, value, municipalityId: _, ...rest } = input;
      const [contract] = await db.insert(contracts).values({
        ...rest,
        municipalityId: munId,
        value: value?.toString(),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }).$returningId();
      return { success: true, id: contract.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      number: z.string().optional(),
      type: z.string().optional(),
      supplier: z.string().optional(),
      cnpj: z.string().optional(),
      object: z.string().optional(),
      value: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      responsibleName: z.string().optional(),
      responsiblePhone: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(['active', 'expired', 'pending', 'cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCNPJ(input.cnpj);
      const { id, startDate, endDate, value, ...rest } = input;
      const updateData: any = { ...rest };
      if (value !== undefined) updateData.value = value.toString();
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
      if (Object.keys(updateData).length > 0) {
        await db.update(contracts).set(updateData).where(eq(contracts.id, id));
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(contracts).where(eq(contracts.id, input.id));
      return { success: true };
    }),
});

// ============================================
// MAINTENANCE RECORDS ROUTER
// ============================================
export const maintenanceRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number(), vehicleId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [
        eq(maintenanceRecords.municipalityId, input.municipalityId),
        eq(maintenanceRecords.isActive, true),
        ...(input.vehicleId ? [eq(maintenanceRecords.vehicleId, input.vehicleId)] : []),
      ];
      return db.select().from(maintenanceRecords)
        .where(and(...conditions))
        .orderBy(desc(maintenanceRecords.createdAt));
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      vehicleId: z.number(),
      componentName: z.string().min(1),
      type: z.enum(['preventive', 'corrective', 'predictive']).optional(),
      description: z.string().optional(),
      cost: z.number().optional(),
      kmAtMaintenance: z.number().optional(),
      intervalKm: z.number().optional(),
      performedAt: z.string().optional(),
      nextDueAt: z.string().optional(),
      nextDueKm: z.number().optional(),
      supplier: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { performedAt, nextDueAt, cost, ...rest } = input;
      const [record] = await db.insert(maintenanceRecords).values({
        ...rest,
        cost: cost?.toString(),
        performedAt: performedAt ? new Date(performedAt) : undefined,
        nextDueAt: nextDueAt ? new Date(nextDueAt) : undefined,
      }).$returningId();
      return { success: true, id: record.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      componentName: z.string().optional(),
      type: z.enum(['preventive', 'corrective', 'predictive']).optional(),
      description: z.string().optional(),
      cost: z.number().optional(),
      kmAtMaintenance: z.number().optional(),
      intervalKm: z.number().optional(),
      performedAt: z.string().optional(),
      nextDueAt: z.string().optional(),
      nextDueKm: z.number().optional(),
      supplier: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, performedAt, nextDueAt, cost, ...rest } = input;
      const updateData: any = { ...rest };
      if (cost !== undefined) updateData.cost = cost.toString();
      if (performedAt !== undefined) updateData.performedAt = new Date(performedAt);
      if (nextDueAt !== undefined) updateData.nextDueAt = new Date(nextDueAt);
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
      if (Object.keys(updateData).length > 0) {
        await db.update(maintenanceRecords).set(updateData).where(eq(maintenanceRecords.id, id));
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, input.id));
      return { success: true };
    }),
});

// ============================================
// ROUTER: LOCATION (GPS TRACKING)
// ============================================
const locationRouter = t.router({
  getActiveVehicles: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      // Get all active trips filtered by municipality
      const activeTrips = await db.select({
        tripId: trips.id,
        routeId: trips.routeId,
        vehicleId: trips.vehicleId,
        driverId: trips.driverId,
        status: trips.status,
      }).from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(and(eq(trips.status, 'started'), eq(routes.municipalityId, input.municipalityId)));

      if (activeTrips.length === 0) return [];

      const result = [];
      for (const trip of activeTrips) {
        // Get latest location for this trip
        const [latestLoc] = await db.select()
          .from(locationHistory)
          .where(eq(locationHistory.tripId, trip.tripId))
          .orderBy(desc(locationHistory.recordedAt))
          .limit(1);

        // Get vehicle info
        const [vehicle] = await db.select()
          .from(vehicles)
          .where(eq(vehicles.id, trip.vehicleId));

        // Get driver info
        const [driver] = await db.select({
          id: drivers.id,
          userId: drivers.userId,
        }).from(drivers)
          .where(eq(drivers.id, trip.driverId));

        let driverName = 'N/A';
        if (driver) {
          const [driverUser] = await db.select({ name: users.name })
            .from(users).where(eq(users.id, driver.userId));
          if (driverUser) driverName = driverUser.name;
        }

        // Get route info
        const [route] = await db.select({ name: routes.name })
          .from(routes).where(eq(routes.id, trip.routeId));

        // Fallback: use driver's current position if no location history
        let lat = latestLoc?.latitude || null;
        let lng = latestLoc?.longitude || null;
        let spd = latestLoc?.speed ? parseFloat(latestLoc.speed as any) : null;
        if (!lat && driver) {
          const [driverPos] = await db.select({ lat: drivers.currentLatitude, lng: drivers.currentLongitude })
            .from(drivers).where(eq(drivers.id, driver.id)).limit(1);
          if (driverPos?.lat) { lat = driverPos.lat; lng = driverPos.lng; }
        }

        // Also get first stop of the route as fallback position
        if (!lat) {
          const [firstStop] = await db.select({ lat: stops.latitude, lng: stops.longitude })
            .from(stops).where(eq(stops.routeId, trip.routeId)).orderBy(stops.orderIndex).limit(1);
          if (firstStop?.lat) { lat = firstStop.lat; lng = firstStop.lng; }
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

  getVehiclePosition: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .query(async ({ input }) => {
      const [loc] = await db.select()
        .from(locationHistory)
        .where(eq(locationHistory.tripId, input.tripId))
        .orderBy(desc(locationHistory.recordedAt))
        .limit(1);
      return loc || null;
    }),

  getHistory: protectedProcedure
    .input(z.object({ tripId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const locs = await db.select()
        .from(locationHistory)
        .where(eq(locationHistory.tripId, input.tripId))
        .orderBy(desc(locationHistory.recordedAt))
        .limit(input.limit || 100);
      return locs;
    }),
});

// ============================================
// ACADEMIC ROUTER (MÓDULO ACADÊMICO)
// ============================================

// Anos Letivos
export const academicYearsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(academicYears)
        .where(and(eq(academicYears.municipalityId, input.municipalityId), eq(academicYears.isActive, true)))
        .orderBy(desc(academicYears.year));
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      year: z.number(),
      name: z.string().min(3),
      startDate: z.string(),
      endDate: z.string(),
      status: z.enum(['planning', 'active', 'finished']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { startDate, endDate, ...rest } = input;
      const [result] = await db.insert(academicYears).values({
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }).$returningId();
      return { success: true, id: result.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      year: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(['planning', 'active', 'finished']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, startDate, endDate, ...data } = input;
      const ud: any = { ...data };
      if (startDate) ud.startDate = new Date(startDate);
      if (endDate) ud.endDate = new Date(endDate);
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(academicYears).set(ud).where(eq(academicYears.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasClasses] = await db.select({ c: sql`count(*)`.as('c') }).from(classes).where(and(eq(classes.academicYearId, input.id), eq(classes.isActive, true)));
      const [hasEnrollments] = await db.select({ c: sql`count(*)`.as('c') }).from(enrollments).where(and(eq(enrollments.academicYearId, input.id), eq(enrollments.isActive, true)));
      const deps: string[] = [];
      if (Number(hasClasses.c) > 0) deps.push(`${hasClasses.c} turma(s)`);
      if (Number(hasEnrollments.c) > 0) deps.push(`${hasEnrollments.c} matrícula(s)`);
      if (deps.length > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Ano letivo possui: ${deps.join(', ')}` });
      await db.update(academicYears).set({ isActive: false }).where(eq(academicYears.id, input.id));
      return { success: true };
    }),
});

// Séries / Etapas
export const classGradesRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(classGrades)
        .where(and(eq(classGrades.municipalityId, input.municipalityId), eq(classGrades.isActive, true)))
        .orderBy(classGrades.orderIndex);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string().min(2),
      level: z.enum(['creche', 'pre_escola', 'fundamental_1', 'fundamental_2', 'medio', 'eja', 'tecnico']),
      orderIndex: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!input.orderIndex) {
        const [last] = await db.select({ max: sql<number>`COALESCE(MAX(orderIndex), 0)` }).from(classGrades).where(eq(classGrades.municipalityId, input.municipalityId));
        input.orderIndex = (last?.max || 0) + 1;
      }
      const [result] = await db.insert(classGrades).values(input).$returningId();
      return { success: true, id: result.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      level: z.enum(['creche', 'pre_escola', 'fundamental_1', 'fundamental_2', 'medio', 'eja', 'tecnico']).optional(),
      orderIndex: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; });
      if (Object.keys(ud).length > 0) await db.update(classGrades).set(ud).where(eq(classGrades.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasClasses] = await db.select({ c: sql`count(*)`.as('c') }).from(classes).where(and(eq(classes.classGradeId, input.id), eq(classes.isActive, true)));
      if (Number(hasClasses.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Série vinculada a ${hasClasses.c} turma(s)` });
      await db.update(classGrades).set({ isActive: false }).where(eq(classGrades.id, input.id));
      return { success: true };
    }),
});

// Disciplinas
export const subjectsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(subjects)
        .where(and(eq(subjects.municipalityId, input.municipalityId), eq(subjects.isActive, true)))
        .orderBy(subjects.name);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string().min(2),
      code: z.string().optional(),
      category: z.enum(['base_nacional', 'parte_diversificada', 'eletiva']).optional(),
      workloadHours: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [result] = await db.insert(subjects).values(input).$returningId();
      return { success: true, id: result.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      code: z.string().optional(),
      category: z.enum(['base_nacional', 'parte_diversificada', 'eletiva']).optional(),
      workloadHours: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; });
      if (Object.keys(ud).length > 0) await db.update(subjects).set(ud).where(eq(subjects.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasAssigned] = await db.select({ c: sql`count(*)`.as('c') }).from(classSubjects).where(eq(classSubjects.subjectId, input.id));
      if (Number(hasAssigned.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Disciplina vinculada a ${hasAssigned.c} turma(s)` });
      await db.update(subjects).set({ isActive: false }).where(eq(subjects.id, input.id));
      return { success: true };
    }),
});

// Turmas
export const classesRouter = t.router({
  list: academicProcedure
    .input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), academicYearId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [
        eq(classes.municipalityId, input.municipalityId),
        eq(classes.isActive, true),
        ...(input.schoolId ? [eq(classes.schoolId, input.schoolId)] : []),
        ...(input.academicYearId ? [eq(classes.academicYearId, input.academicYearId)] : []),
      ];
      const result = await db.select({
        id: classes.id,
        municipalityId: classes.municipalityId,
        schoolId: classes.schoolId,
        academicYearId: classes.academicYearId,
        classGradeId: classes.classGradeId,
        name: classes.name,
        fullName: classes.fullName,
        shift: classes.shift,
        maxStudents: classes.maxStudents,
        roomNumber: classes.roomNumber,
        teacherUserId: classes.teacherUserId,
        schoolName: schools.name,
        gradeName: classGrades.name,
        gradeLevel: classGrades.level,
      })
      .from(classes)
      .leftJoin(schools, eq(classes.schoolId, schools.id))
      .leftJoin(classGrades, eq(classes.classGradeId, classGrades.id))
      .where(and(...conditions))
      .orderBy(classes.name);

      // Count enrollments per class
      const enriched = await Promise.all(result.map(async (c) => {
        const [count] = await db.select({ count: sql<number>`count(*)` }).from(enrollments)
          .where(and(eq(enrollments.classId, c.id), eq(enrollments.status, 'active')));
        return { ...c, enrolledStudents: count?.count || 0 };
      }));
      return enriched;
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      schoolId: z.number(),
      academicYearId: z.number(),
      classGradeId: z.number(),
      name: z.string().min(1),
      fullName: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening', 'full_time']).optional(),
      maxStudents: z.number().optional(),
      roomNumber: z.string().optional(),
      teacherUserId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Generate fullName if not provided
      if (!input.fullName) {
        const [grade] = await db.select({ name: classGrades.name }).from(classGrades).where(eq(classGrades.id, input.classGradeId)).limit(1);
        input.fullName = `${grade?.name || ''} ${input.name}`.trim();
      }
      const [result] = await db.insert(classes).values(input).$returningId();
      return { success: true, id: result.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      fullName: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening', 'full_time']).optional(),
      maxStudents: z.number().optional(),
      roomNumber: z.string().optional(),
      teacherUserId: z.number().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined) ud[k] = v;
        if (k === 'teacherUserId' && v === null) ud[k] = null;
      });
      if (Object.keys(ud).length > 0) await db.update(classes).set(ud).where(eq(classes.id, id));

      // Sincronizar todos os alunos matriculados nesta turma
      const [cls] = await db.select({
        name: classes.name, fullName: classes.fullName,
        shift: classes.shift, schoolId: classes.schoolId,
        gradeId: classes.classGradeId,
      }).from(classes).where(eq(classes.id, id)).limit(1);

      if (cls) {
        let gradeName = '';
        if (cls.gradeId) {
          const [cg] = await db.select({ name: classGrades.name }).from(classGrades).where(eq(classGrades.id, cls.gradeId)).limit(1);
          if (cg) gradeName = cg.name;
        }
        const su: any = {};
        if (cls.name) su.classRoom = cls.name;
        if (gradeName) su.grade = gradeName;
        if (cls.shift) su.shift = cls.shift;
        if (cls.schoolId) su.schoolId = cls.schoolId;

        if (Object.keys(su).length > 0) {
          // Buscar todos os alunos matriculados nesta turma
          const activeEnrollments = await db.select({ studentId: enrollments.studentId })
            .from(enrollments)
            .where(and(eq(enrollments.classId, id), eq(enrollments.isActive, true)));
          for (const e of activeEnrollments) {
            await db.update(students).set(su).where(eq(students.id, e.studentId));
          }
        }
      }

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasEnrollments] = await db.select({ c: sql`count(*)`.as('c') }).from(enrollments).where(and(eq(enrollments.classId, input.id), eq(enrollments.isActive, true)));
      if (Number(hasEnrollments.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Turma possui ${hasEnrollments.c} matrícula(s) ativa(s)` });
      await db.update(classes).set({ isActive: false }).where(eq(classes.id, input.id));
      return { success: true };
    }),
});

// Matrículas
export const enrollmentsRouter = t.router({
  list: academicProcedure
    .input(z.object({ municipalityId: z.number(), classId: z.number().optional(), studentId: z.number().optional(), academicYearId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [
        eq(enrollments.municipalityId, input.municipalityId),
        eq(enrollments.isActive, true),
        ...(input.classId ? [eq(enrollments.classId, input.classId)] : []),
        ...(input.studentId ? [eq(enrollments.studentId, input.studentId)] : []),
        ...(input.academicYearId ? [eq(enrollments.academicYearId, input.academicYearId)] : []),
        ...(input.status ? [eq(enrollments.status, input.status as any)] : []),
      ];
      return db.select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        classId: enrollments.classId,
        academicYearId: enrollments.academicYearId,
        enrollmentNumber: enrollments.enrollmentNumber,
        enrollmentDate: enrollments.enrollmentDate,
        status: enrollments.status,
        statusNotes: enrollments.statusNotes,
        studentName: students.name,
        studentEnrollment: students.enrollment,
        studentGrade: students.grade,
        birthDate: students.birthDate,
        // Dados da turma
        className: classes.name,
        classFullName: classes.fullName,
        classShift: classes.shift,
        schoolId: classes.schoolId,
      })
      .from(enrollments)
      .leftJoin(students, eq(enrollments.studentId, students.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .where(and(...conditions))
      .orderBy(students.name);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      studentId: z.number(),
      classId: z.number(),
      academicYearId: z.number(),
      enrollmentNumber: z.string().optional(),
      enrollmentDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check if student already enrolled in this academic year
      const existing = await db.select().from(enrollments)
        .where(and(eq(enrollments.studentId, input.studentId), eq(enrollments.academicYearId, input.academicYearId), eq(enrollments.status, 'active')))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Aluno já matriculado neste ano letivo.' });
      }
      const { enrollmentDate, ...rest } = input;
      const [result] = await db.insert(enrollments).values({
        ...rest,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
      }).$returningId();

      // Sync student record with class data
      const [cls] = await db.select({
        name: classes.name, fullName: classes.fullName,
        shift: classes.shift, schoolId: classes.schoolId,
        gradeId: classes.classGradeId,
      }).from(classes).where(eq(classes.id, input.classId)).limit(1);

      if (cls) {
        let gradeName = '';
        if (cls.gradeId) {
          const [cg] = await db.select({ name: classGrades.name }).from(classGrades).where(eq(classGrades.id, cls.gradeId)).limit(1);
          if (cg) gradeName = cg.name;
        }
        const su: any = {};
        if (cls.name) su.classRoom = cls.name;
        if (gradeName) su.grade = gradeName;
        if (cls.shift) su.shift = cls.shift;
        if (cls.schoolId) su.schoolId = cls.schoolId;
        su.studentStatus = 'ativo';
        if (Object.keys(su).length > 0) {
          await db.update(students).set(su).where(eq(students.id, input.studentId));
        }
      }

      return { success: true, id: result.id };
    }),

  bulkCreate: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      classId: z.number(),
      academicYearId: z.number(),
      studentIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      let created = 0;
      let skipped = 0;
      const createdStudentIds: number[] = [];
      for (const studentId of input.studentIds) {
        const existing = await db.select().from(enrollments)
          .where(and(eq(enrollments.studentId, studentId), eq(enrollments.academicYearId, input.academicYearId), eq(enrollments.status, 'active')))
          .limit(1);
        if (existing.length > 0) { skipped++; continue; }
        await db.insert(enrollments).values({
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
          const [cls] = await db.select({
            name: classes.name, fullName: classes.fullName, shift: classes.shift, schoolId: classes.schoolId, gradeId: classes.classGradeId,
          }).from(classes).where(eq(classes.id, input.classId)).limit(1);
          if (cls) {
            let gradeName = '';
            if (cls.gradeId) {
              const [cg] = await db.select({ name: classGrades.name }).from(classGrades).where(eq(classGrades.id, cls.gradeId)).limit(1);
              if (cg) gradeName = cg.name;
            }
            const su: any = {};
            if (cls.name) su.classRoom = cls.name;
            if (gradeName) su.grade = gradeName;
            if (cls.shift) su.shift = cls.shift;
            if (cls.schoolId) su.schoolId = cls.schoolId;
            su.studentStatus = 'ativo';
            if (Object.keys(su).length > 0) {
              for (const sid of createdStudentIds) {
                try { await db.update(students).set(su).where(eq(students.id, sid)); } catch { /* skip */ }
              }
            }
          }
        } catch { /* sync best effort */ }
      }

      return { success: true, created, skipped };
    }),

  // Alterar turma da matrícula + sincronizar com aluno
  updateClass: adminProcedure
    .input(z.object({
      id: z.number(),
      classId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Buscar enrollment atual
      const [enr] = await db.select().from(enrollments).where(eq(enrollments.id, input.id)).limit(1);
      if (!enr) throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula não encontrada' });

      // Atualizar enrollment
      await db.update(enrollments).set({ classId: input.classId }).where(eq(enrollments.id, input.id));

      // Buscar dados da nova turma para sincronizar com aluno
      const [cls] = await db.select({
        name: classes.name,
        fullName: classes.fullName,
        shift: classes.shift,
        schoolId: classes.schoolId,
        gradeId: classes.classGradeId,
      }).from(classes).where(eq(classes.id, input.classId)).limit(1);

      if (cls) {
        // Buscar nome da série
        let gradeName = '';
        if (cls.gradeId) {
          const [cg] = await db.select({ name: classGrades.name }).from(classGrades).where(eq(classGrades.id, cls.gradeId)).limit(1);
          if (cg) gradeName = cg.name;
        }

        // Sincronizar: atualizar grade, classRoom, shift e schoolId no aluno
        const studentUpdate: any = {};
        if (cls.name) studentUpdate.classRoom = cls.name;
        if (gradeName) studentUpdate.grade = gradeName;
        if (cls.shift) studentUpdate.shift = cls.shift;
        if (cls.schoolId) studentUpdate.schoolId = cls.schoolId;

        if (Object.keys(studentUpdate).length > 0) {
          await db.update(students).set(studentUpdate).where(eq(students.id, enr.studentId));
        }
      }

      return { success: true };
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['active', 'transferred', 'cancelled', 'graduated', 'retained', 'evaded']),
      statusNotes: z.string().optional(),
      transferredToSchoolId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // Buscar a matrícula para saber o studentId
      const [enr] = await db.select({ studentId: enrollments.studentId }).from(enrollments).where(eq(enrollments.id, id)).limit(1);

      // Atualizar status da matrícula
      await db.update(enrollments).set({
        ...data,
        statusChangedAt: new Date(),
      }).where(eq(enrollments.id, id));

      // Sincronizar: atualizar studentStatus no cadastro do aluno
      if (enr) {
        const statusMap: Record<string, string> = {
          active: 'ativo', transferred: 'transferido', cancelled: 'cancelado',
          graduated: 'aprovado', retained: 'retido', evaded: 'evadido',
        };
        const studentStatus = statusMap[input.status] || input.status;
        await db.update(students).set({ studentStatus }).where(eq(students.id, enr.studentId));

        // Se aluno foi transferido, cancelado ou evadido: limpar vínculos com paradas e campos acadêmicos
        if (['transferred', 'cancelled', 'evaded'].includes(input.status)) {
          await db.delete(stopStudents).where(eq(stopStudents.studentId, enr.studentId));
          // Also clear academic fields
          await db.update(students).set({
            grade: null, classRoom: null
          }).where(eq(students.id, enr.studentId));
        }
      }

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // Fetch student before soft-deleting
      const [enr] = await db.select({ studentId: enrollments.studentId }).from(enrollments).where(eq(enrollments.id, input.id)).limit(1);

      await db.update(enrollments).set({ isActive: false }).where(eq(enrollments.id, input.id));

      // Check if student has other active enrollments
      if (enr) {
        const otherActive = await db.select({ id: enrollments.id }).from(enrollments)
          .where(and(eq(enrollments.studentId, enr.studentId), eq(enrollments.isActive, true), sql`${enrollments.id} != ${input.id}`))
          .limit(1);
        if (otherActive.length === 0) {
          // No other active enrollment - clear student fields
          await db.update(students).set({
            grade: null, classRoom: null, studentStatus: 'sem_matricula'
          }).where(eq(students.id, enr.studentId));
        }
      }

      return { success: true };
    }),
});

// Professores
export const teachersRouter = t.router({
  list: academicProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select({
        teacher: teachers,
        user: { id: users.id, name: users.name, email: users.email, phone: users.phone, cpf: users.cpf },
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(eq(teachers.municipalityId, input.municipalityId), eq(teachers.isActive, true)));
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string().min(3),
      email: z.string().optional(),
      phone: z.string().optional(),
      cpf: z.string().optional(),
      password: z.string().optional(),
      registrationNumber: z.string().optional(),
      degree: z.string().optional(),
      specialization: z.string().optional(),
      hireDate: z.string().optional(),
      contractType: z.enum(['effective', 'temporary', 'substitute']).optional(),
      weeklyWorkload: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);
      const email = input.email || (input.name.toLowerCase().replace(/\s+/g, '.') + '@professor.netescol.local');
      const pwd = input.password || 'Prof@' + Math.floor(1000 + Math.random() * 9000);
      const passwordHash = await hash(pwd, 12);

      try {
        const [user] = await db.insert(users).values({
          municipalityId: input.municipalityId, email, passwordHash,
          name: input.name, phone: input.phone, cpf: input.cpf, role: 'teacher' as any,
        }).$returningId();

        const [teacher] = await db.insert(teachers).values({
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
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY' || err?.message?.includes('Duplicate entry')) {
          if (err.message.includes('email')) throw new TRPCError({ code: 'CONFLICT', message: 'Este e-mail já está cadastrado.' });
          if (err.message.includes('cpf')) throw new TRPCError({ code: 'CONFLICT', message: 'Este CPF já está cadastrado.' });
          throw new TRPCError({ code: 'CONFLICT', message: 'Registro duplicado.' });
        }
        throw err;
      }
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      phone: z.string().optional(),
      cpf: z.string().optional(),
      email: z.string().optional(),
      registrationNumber: z.string().optional(),
      degree: z.string().optional(),
      specialization: z.string().optional(),
      hireDate: z.string().optional(),
      contractType: z.enum(['effective', 'temporary', 'substitute']).optional(),
      weeklyWorkload: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      validateOptionalCPF(input.cpf);
      const { id, name, phone, cpf, email, hireDate, ...teacherData } = input;
      const td: any = { ...teacherData };
      if (hireDate) td.hireDate = new Date(hireDate);
      Object.keys(td).forEach(k => td[k] === undefined && delete td[k]);
      if (Object.keys(td).length > 0) await db.update(teachers).set(td).where(eq(teachers.id, id));
      // Update user data
      const [teacher] = await db.select({ userId: teachers.userId }).from(teachers).where(eq(teachers.id, id)).limit(1);
      if (teacher) {
        const userData: any = {};
        if (name) userData.name = name;
        if (phone) userData.phone = phone;
        if (cpf) userData.cpf = cpf;
        if (email) userData.email = email;
        if (Object.keys(userData).length > 0) await db.update(users).set(userData).where(eq(users.id, teacher.userId));
      }
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [teacher] = await db.select().from(teachers).where(eq(teachers.id, input.id)).limit(1);
      if (teacher) {
        await db.update(teachers).set({ isActive: false }).where(eq(teachers.id, input.id));
      }
      return { success: true };
    }),
});

// Disciplinas por Turma
export const classSubjectsRouter = t.router({
  list: academicProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      return db.select({
        id: classSubjects.id,
        classId: classSubjects.classId,
        subjectId: classSubjects.subjectId,
        teacherUserId: classSubjects.teacherUserId,
        weeklyHours: classSubjects.weeklyHours,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        teacherName: users.name,
      })
      .from(classSubjects)
      .leftJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .leftJoin(users, eq(classSubjects.teacherUserId, users.id))
      .where(eq(classSubjects.classId, input.classId));
    }),

  assign: adminProcedure
    .input(z.object({
      classId: z.number(),
      subjectId: z.number(),
      teacherUserId: z.number().optional(),
      weeklyHours: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.select().from(classSubjects)
        .where(and(eq(classSubjects.classId, input.classId), eq(classSubjects.subjectId, input.subjectId))).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Disciplina já vinculada a esta turma.' });
      }
      const [result] = await db.insert(classSubjects).values(input).$returningId();
      return { success: true, id: result.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      teacherUserId: z.number().optional(),
      weeklyHours: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; });
      if (Object.keys(ud).length > 0) await db.update(classSubjects).set(ud).where(eq(classSubjects.id, id));
      return { success: true };
    }),

  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(classSubjects).where(eq(classSubjects.id, input.id));
      return { success: true };
    }),
});

// ============================================
// DIARY ROUTER (DIÁRIO ESCOLAR)
// ============================================

export const diaryAttendanceRouter = t.router({
  // Registrar frequência de uma turma inteira
  register: academicProcedure
    .input(z.object({
      classId: z.number(),
      subjectId: z.number().optional(),
      date: z.string(),
      records: z.array(z.object({
        studentId: z.number(),
        status: z.enum(['present', 'absent', 'justified', 'late']),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const dateObj = new Date(input.date);
      // Delete existing records for this class/date/subject to allow re-registration
      const conditions = [eq(dailyAttendance.classId, input.classId), eq(dailyAttendance.date, dateObj)];
      if (input.subjectId) conditions.push(eq(dailyAttendance.subjectId, input.subjectId));
      await db.delete(dailyAttendance).where(and(...conditions));

      for (const record of input.records) {
        await db.insert(dailyAttendance).values({
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
  listByClassDate: academicProcedure
    .input(z.object({ classId: z.number(), date: z.string(), subjectId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(dailyAttendance.classId, input.classId), eq(dailyAttendance.date, new Date(input.date))];
      if (input.subjectId) conditions.push(eq(dailyAttendance.subjectId, input.subjectId));
      return db.select({
        id: dailyAttendance.id,
        studentId: dailyAttendance.studentId,
        status: dailyAttendance.status,
        notes: dailyAttendance.notes,
        studentName: students.name,
      })
      .from(dailyAttendance)
      .leftJoin(students, eq(dailyAttendance.studentId, students.id))
      .where(and(...conditions));
    }),

  // Resumo de frequência por aluno em um período
  studentSummary: academicProcedure
    .input(z.object({ classId: z.number(), startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      const records = await db.select({
        studentId: dailyAttendance.studentId,
        status: dailyAttendance.status,
        studentName: students.name,
      })
      .from(dailyAttendance)
      .leftJoin(students, eq(dailyAttendance.studentId, students.id))
      .where(and(
        eq(dailyAttendance.classId, input.classId),
        gte(dailyAttendance.date, new Date(input.startDate)),
        lte(dailyAttendance.date, new Date(input.endDate)),
      ));

      const summary: any = {};
      records.forEach((r: any) => {
        if (!summary[r.studentId]) summary[r.studentId] = { studentId: r.studentId, studentName: r.studentName, present: 0, absent: 0, justified: 0, late: 0, total: 0 };
        summary[r.studentId][r.status]++;
        summary[r.studentId].total++;
      });
      return Object.values(summary);
    }),
});

export const assessmentsRouter = t.router({
  list: academicProcedure
    .input(z.object({ municipalityId: z.number(), classId: z.number().optional(), subjectId: z.number().optional(), bimester: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(assessments.municipalityId, input.municipalityId), eq(assessments.isActive, true)];
      if (input.classId) conditions.push(eq(assessments.classId, input.classId));
      if (input.subjectId) conditions.push(eq(assessments.subjectId, input.subjectId));
      if (input.bimester) conditions.push(eq(assessments.bimester, input.bimester as any));
      return db.select({
        id: assessments.id, classId: assessments.classId, subjectId: assessments.subjectId,
        name: assessments.name, type: assessments.type, maxScore: assessments.maxScore,
        weight: assessments.weight, date: assessments.date, bimester: assessments.bimester,
        description: assessments.description, subjectName: subjects.name,
      })
      .from(assessments)
      .leftJoin(subjects, eq(assessments.subjectId, subjects.id))
      .where(and(...conditions))
      .orderBy(desc(assessments.date));
    }),

  create: academicProcedure
    .input(z.object({
      municipalityId: z.number(), classId: z.number(), subjectId: z.number(),
      name: z.string().min(2), type: z.enum(['prova', 'trabalho', 'seminario', 'participacao', 'recuperacao']).optional(),
      maxScore: z.number().optional(), weight: z.number().optional(),
      date: z.string().optional(), bimester: z.enum(['1', '2', '3', '4']),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { date, maxScore, weight, ...rest } = input;
      const [result] = await db.insert(assessments).values({
        ...rest, date: date ? new Date(date) : undefined,
        maxScore: maxScore?.toString() || '10.00', weight: weight?.toString() || '1.00',
      }).$returningId();
      return { success: true, id: result.id };
    }),

  update: academicProcedure
    .input(z.object({
      id: z.number(), name: z.string().optional(), type: z.enum(['prova', 'trabalho', 'seminario', 'participacao', 'recuperacao']).optional(),
      maxScore: z.number().optional(), weight: z.number().optional(), date: z.string().optional(),
      bimester: z.enum(['1', '2', '3', '4']).optional(), description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, date, maxScore, weight, ...data } = input;
      const ud: any = { ...data };
      if (date) ud.date = new Date(date);
      if (maxScore !== undefined) ud.maxScore = maxScore.toString();
      if (weight !== undefined) ud.weight = weight.toString();
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(assessments).set(ud).where(eq(assessments.id, id));
      return { success: true };
    }),

  delete: academicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(assessments).set({ isActive: false }).where(eq(assessments.id, input.id));
      return { success: true };
    }),
});

export const studentGradesRouter = t.router({
  // Listar notas por avaliação
  listByAssessment: academicProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      return db.select({
        id: studentGrades.id, studentId: studentGrades.studentId,
        score: studentGrades.score, notes: studentGrades.notes,
        studentName: students.name,
      })
      .from(studentGrades)
      .leftJoin(students, eq(studentGrades.studentId, students.id))
      .where(eq(studentGrades.assessmentId, input.assessmentId));
    }),

  // Registrar/atualizar notas em lote
  registerBatch: academicProcedure
    .input(z.object({
      assessmentId: z.number(),
      grades: z.array(z.object({
        studentId: z.number(),
        score: z.number().nullable(),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      for (const grade of input.grades) {
        const existing = await db.select().from(studentGrades)
          .where(and(eq(studentGrades.assessmentId, input.assessmentId), eq(studentGrades.studentId, grade.studentId))).limit(1);
        if (existing.length > 0) {
          await db.update(studentGrades).set({ score: grade.score?.toString(), notes: grade.notes, registeredByUserId: ctx.userId })
            .where(eq(studentGrades.id, existing[0].id));
        } else {
          await db.insert(studentGrades).values({
            assessmentId: input.assessmentId, studentId: grade.studentId,
            score: grade.score?.toString(), notes: grade.notes, registeredByUserId: ctx.userId,
          });
        }
      }
      return { success: true };
    }),

  // Boletim: notas de um aluno em uma turma
  reportCard: academicProcedure
    .input(z.object({ classId: z.number(), studentId: z.number() }))
    .query(async ({ input }) => {
      const classAssessments = await db.select().from(assessments)
        .where(and(eq(assessments.classId, input.classId), eq(assessments.isActive, true)));

      const grades = await db.select().from(studentGrades)
        .where(and(
          inArray(studentGrades.assessmentId, classAssessments.map(a => a.id)),
          eq(studentGrades.studentId, input.studentId)
        ));

      // Group by subject and bimester
      const report: any = {};
      for (const assessment of classAssessments) {
        const subjectId = assessment.subjectId;
        if (!report[subjectId]) {
          const [subj] = await db.select({ name: subjects.name }).from(subjects).where(eq(subjects.id, subjectId)).limit(1);
          report[subjectId] = { subjectId, subjectName: subj?.name || '', bimesters: { '1': [], '2': [], '3': [], '4': [] } };
        }
        const grade = grades.find(g => g.assessmentId === assessment.id);
        report[subjectId].bimesters[assessment.bimester].push({
          assessmentName: assessment.name, type: assessment.type,
          maxScore: parseFloat(assessment.maxScore as any || '10'),
          weight: parseFloat(assessment.weight as any || '1'),
          score: grade ? parseFloat(grade.score as any || '0') : null,
        });
      }
      return Object.values(report);
    }),
});

export const lessonPlansRouter = t.router({
  list: academicProcedure
    .input(z.object({ municipalityId: z.number(), classId: z.number().optional(), subjectId: z.number().optional(), bimester: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(lessonPlans.municipalityId, input.municipalityId), eq(lessonPlans.isActive, true)];
      if (input.classId) conditions.push(eq(lessonPlans.classId, input.classId));
      if (input.subjectId) conditions.push(eq(lessonPlans.subjectId, input.subjectId));
      if (input.bimester) conditions.push(eq(lessonPlans.bimester, input.bimester as any));
      return db.select({
        id: lessonPlans.id, classId: lessonPlans.classId, subjectId: lessonPlans.subjectId,
        date: lessonPlans.date, topic: lessonPlans.topic, content: lessonPlans.content,
        methodology: lessonPlans.methodology, resources: lessonPlans.resources,
        bnccCode: lessonPlans.bnccCode, bimester: lessonPlans.bimester,
        subjectName: subjects.name, teacherName: users.name,
      })
      .from(lessonPlans)
      .leftJoin(subjects, eq(lessonPlans.subjectId, subjects.id))
      .leftJoin(users, eq(lessonPlans.teacherUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(lessonPlans.date));
    }),

  create: academicProcedure
    .input(z.object({
      municipalityId: z.number(), classId: z.number(), subjectId: z.number(),
      date: z.string(), topic: z.string().min(2),
      content: z.string().optional(), methodology: z.string().optional(),
      resources: z.string().optional(), bnccCode: z.string().optional(),
      bimester: z.enum(['1', '2', '3', '4']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { date, ...rest } = input;
      const [result] = await db.insert(lessonPlans).values({
        ...rest, date: new Date(date), teacherUserId: ctx.userId!,
      }).$returningId();
      return { success: true, id: result.id };
    }),

  update: academicProcedure
    .input(z.object({
      id: z.number(), topic: z.string().optional(), content: z.string().optional(),
      methodology: z.string().optional(), resources: z.string().optional(),
      bnccCode: z.string().optional(), date: z.string().optional(),
      bimester: z.enum(['1', '2', '3', '4']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, date, ...data } = input;
      const ud: any = { ...data };
      if (date) ud.date = new Date(date);
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(lessonPlans).set(ud).where(eq(lessonPlans.id, id));
      return { success: true };
    }),

  delete: academicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(lessonPlans).set({ isActive: false }).where(eq(lessonPlans.id, input.id));
      return { success: true };
    }),
});

// ============================================
// HR ROUTER (RECURSOS HUMANOS)
// ============================================

export const positionsRouter = t.router({
  list: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(positions)
        .where(and(eq(positions.municipalityId, input.municipalityId), eq(positions.isActive, true)))
        .orderBy(positions.name);
    }),
  create: adminProcedure
    .input(z.object({ municipalityId: z.number(), name: z.string().min(2), category: z.enum(['docente', 'administrativo', 'operacional', 'gestao']).optional(), baseSalary: z.number().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { baseSalary, ...rest } = input;
      const [result] = await db.insert(positions).values({ ...rest, baseSalary: baseSalary?.toString() }).$returningId();
      return { success: true, id: result.id };
    }),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), category: z.enum(['docente', 'administrativo', 'operacional', 'gestao']).optional(), baseSalary: z.number().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, baseSalary, ...data } = input;
      const ud: any = { ...data };
      if (baseSalary !== undefined) ud.baseSalary = baseSalary.toString();
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(positions).set(ud).where(eq(positions.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasStaff] = await db.select({ c: sql`count(*)`.as('c') }).from(staffAllocations).where(and(eq(staffAllocations.positionId, input.id), eq(staffAllocations.isActive, true)));
      if (Number(hasStaff.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Cargo vinculado a ${hasStaff.c} servidor(es)` });
      await db.update(positions).set({ isActive: false }).where(eq(positions.id, input.id)); return { success: true };
    }),
});

export const departmentsRouter = t.router({
  list: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select({ id: departments.id, municipalityId: departments.municipalityId, name: departments.name, headUserId: departments.headUserId, description: departments.description, headName: users.name })
        .from(departments)
        .leftJoin(users, eq(departments.headUserId, users.id))
        .where(and(eq(departments.municipalityId, input.municipalityId), eq(departments.isActive, true)))
        .orderBy(departments.name);
    }),
  create: adminProcedure
    .input(z.object({ municipalityId: z.number(), name: z.string().min(2), headUserId: z.number().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => { const [result] = await db.insert(departments).values(input).$returningId(); return { success: true, id: result.id }; }),
  update: adminProcedure
    .input(z.object({ id: z.number(), name: z.string().optional(), headUserId: z.number().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, ...data } = input; const ud: any = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; }); if (Object.keys(ud).length > 0) await db.update(departments).set(ud).where(eq(departments.id, id)); return { success: true }; }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [hasStaff] = await db.select({ c: sql`count(*)`.as('c') }).from(staffAllocations).where(and(eq(staffAllocations.departmentId, input.id), eq(staffAllocations.isActive, true)));
      if (Number(hasStaff.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Departamento vinculado a ${hasStaff.c} servidor(es)` });
      await db.update(departments).set({ isActive: false }).where(eq(departments.id, input.id)); return { success: true };
    }),
});

export const staffAllocationsRouter = t.router({
  list: adminProcedure
    .input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), departmentId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(staffAllocations.municipalityId, input.municipalityId), eq(staffAllocations.isActive, true)];
      if (input.schoolId) conditions.push(eq(staffAllocations.schoolId, input.schoolId));
      if (input.departmentId) conditions.push(eq(staffAllocations.departmentId, input.departmentId));
      return db.select({
        id: staffAllocations.id, userId: staffAllocations.userId, schoolId: staffAllocations.schoolId,
        departmentId: staffAllocations.departmentId, positionId: staffAllocations.positionId,
        startDate: staffAllocations.startDate, endDate: staffAllocations.endDate,
        workload: staffAllocations.workload, status: staffAllocations.status, notes: staffAllocations.notes,
        userName: users.name, schoolName: schools.name,
      })
      .from(staffAllocations)
      .leftJoin(users, eq(staffAllocations.userId, users.id))
      .leftJoin(schools, eq(staffAllocations.schoolId, schools.id))
      .where(and(...conditions))
      .orderBy(users.name);
    }),
  create: adminProcedure
    .input(z.object({ municipalityId: z.number(), userId: z.number(), schoolId: z.number().optional(), departmentId: z.number().optional(), positionId: z.number().optional(), startDate: z.string(), endDate: z.string().optional(), workload: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { startDate, endDate, ...rest } = input;
      const [result] = await db.insert(staffAllocations).values({ ...rest, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : undefined }).$returningId();
      return { success: true, id: result.id };
    }),
  update: adminProcedure
    .input(z.object({ id: z.number(), schoolId: z.number().optional(), departmentId: z.number().optional(), positionId: z.number().optional(), startDate: z.string().optional(), endDate: z.string().optional(), workload: z.number().optional(), status: z.enum(['active', 'transferred', 'ended']).optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, startDate, endDate, ...data } = input;
      const ud: any = { ...data };
      if (startDate) ud.startDate = new Date(startDate);
      if (endDate) ud.endDate = new Date(endDate);
      Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]);
      if (Object.keys(ud).length > 0) await db.update(staffAllocations).set(ud).where(eq(staffAllocations.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await db.update(staffAllocations).set({ isActive: false }).where(eq(staffAllocations.id, input.id)); return { success: true }; }),
});

export const staffEvaluationsRouter = t.router({
  list: adminProcedure
    .input(z.object({ municipalityId: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(staffEvaluations.municipalityId, input.municipalityId), eq(staffEvaluations.isActive, true)];
      if (input.userId) conditions.push(eq(staffEvaluations.userId, input.userId));
      const result = await db.select().from(staffEvaluations).where(and(...conditions)).orderBy(desc(staffEvaluations.createdAt));
      // Get user names
      const enriched = await Promise.all(result.map(async (e) => {
        const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, e.userId)).limit(1);
        const [ev] = e.evaluatorUserId ? await db.select({ name: users.name }).from(users).where(eq(users.id, e.evaluatorUserId)).limit(1) : [null];
        return { ...e, userName: u?.name || '', evaluatorName: ev?.name || '' };
      }));
      return enriched;
    }),
  create: adminProcedure
    .input(z.object({ municipalityId: z.number(), userId: z.number(), period: z.string(), punctuality: z.number().optional(), productivity: z.number().optional(), teamwork: z.number().optional(), initiative: z.number().optional(), communication: z.number().optional(), strengths: z.string().optional(), improvements: z.string().optional(), goals: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const scores = [input.punctuality, input.productivity, input.teamwork, input.initiative, input.communication].filter(Boolean) as number[];
      const overallScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toString() : undefined;
      const [result] = await db.insert(staffEvaluations).values({ ...input, evaluatorUserId: ctx.userId, overallScore, status: 'submitted' }).$returningId();
      return { success: true, id: result.id };
    }),
  update: adminProcedure
    .input(z.object({ id: z.number(), period: z.string().optional(), punctuality: z.number().optional(), productivity: z.number().optional(), teamwork: z.number().optional(), initiative: z.number().optional(), communication: z.number().optional(), strengths: z.string().optional(), improvements: z.string().optional(), goals: z.string().optional() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const scores = [data.punctuality, data.productivity, data.teamwork, data.initiative, data.communication].filter(v => v !== undefined && v !== null) as number[];
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; });
      if (scores.length > 0) ud.overallScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toString();
      if (Object.keys(ud).length > 0) await db.update(staffEvaluations).set(ud).where(eq(staffEvaluations.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await db.update(staffEvaluations).set({ isActive: false }).where(eq(staffEvaluations.id, input.id)); return { success: true }; }),
});

// ============================================
// FINANCIAL ROUTER
// ============================================
export const financialAccountsRouter = t.router({
  list: adminProcedure.input(z.object({ municipalityId: z.number() })).query(async ({ input }) => {
    return db.select().from(financialAccounts).where(and(eq(financialAccounts.municipalityId, input.municipalityId), eq(financialAccounts.isActive, true))).orderBy(financialAccounts.name);
  }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), name: z.string().min(2), type: z.enum(['pdde', 'proprio', 'estadual', 'federal', 'outro']).optional(), bankName: z.string().optional(), agency: z.string().optional(), accountNumber: z.string().optional(), balance: z.number().optional() }))
    .mutation(async ({ input }) => { const { balance, ...rest } = input; const [r] = await db.insert(financialAccounts).values({ ...rest, balance: balance?.toString() }).$returningId(); return { success: true, id: r.id }; }),
  update: adminProcedure.input(z.object({ id: z.number(), name: z.string().optional(), type: z.enum(['pdde', 'proprio', 'estadual', 'federal', 'outro']).optional(), bankName: z.string().optional(), agency: z.string().optional(), accountNumber: z.string().optional(), balance: z.number().optional() }))
    .mutation(async ({ input }) => { const { id, balance, ...data } = input; const ud: any = { ...data }; if (balance !== undefined) ud.balance = balance.toString(); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0) await db.update(financialAccounts).set(ud).where(eq(financialAccounts.id, id)); return { success: true }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [hasTx] = await db.select({ c: sql`count(*)`.as('c') }).from(financialTransactions).where(and(eq(financialTransactions.accountId, input.id), eq(financialTransactions.isActive, true)));
    if (Number(hasTx.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Conta possui ${hasTx.c} transação(ões)` });
    await db.update(financialAccounts).set({ isActive: false }).where(eq(financialAccounts.id, input.id)); return { success: true };
  }),
});

export const financialTransactionsRouter = t.router({
  list: adminProcedure.input(z.object({ municipalityId: z.number(), accountId: z.number().optional(), type: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(financialTransactions.municipalityId, input.municipalityId), eq(financialTransactions.isActive, true)];
      if (input.accountId) conditions.push(eq(financialTransactions.accountId, input.accountId));
      if (input.type) conditions.push(eq(financialTransactions.type, input.type as any));
      if (input.startDate) conditions.push(gte(financialTransactions.date, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(financialTransactions.date, new Date(input.endDate)));
      return db.select().from(financialTransactions).where(and(...conditions)).orderBy(desc(financialTransactions.date));
    }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), accountId: z.number(), type: z.enum(['receita', 'despesa']), category: z.string(), description: z.string().optional(), value: z.number(), date: z.string(), documentNumber: z.string().optional(), supplier: z.string().optional() }))
    .mutation(async ({ ctx, input }) => { const { date, value, ...rest } = input; const [r] = await db.insert(financialTransactions).values({ ...rest, date: new Date(date), value: value.toString(), registeredByUserId: ctx.userId }).$returningId(); return { success: true, id: r.id }; }),
  update: adminProcedure.input(z.object({ id: z.number(), accountId: z.number().optional(), type: z.enum(['receita', 'despesa']).optional(), category: z.string().optional(), description: z.string().optional(), value: z.number().optional(), date: z.string().optional(), documentNumber: z.string().optional(), supplier: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, date, value, ...data } = input; const ud: any = { ...data }; if (date) ud.date = new Date(date); if (value !== undefined) ud.value = value.toString(); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0) await db.update(financialTransactions).set(ud).where(eq(financialTransactions.id, id)); return { success: true }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.update(financialTransactions).set({ isActive: false }).where(eq(financialTransactions.id, input.id)); return { success: true }; }),
});

// ============================================
// OPERATIONAL ROUTERS
// ============================================
export const mealMenusRouter = t.router({
  list: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(mealMenus.municipalityId, input.municipalityId), eq(mealMenus.isActive, true)];
      if (input.schoolId) conditions.push(eq(mealMenus.schoolId, input.schoolId));
      if (input.startDate) conditions.push(gte(mealMenus.date, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(mealMenus.date, new Date(input.endDate)));
      return db.select().from(mealMenus).where(and(...conditions)).orderBy(desc(mealMenus.date));
    }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), date: z.string(), mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']).optional(), description: z.string(), calories: z.number().optional(), servings: z.number().optional(), cost: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => { const { date, cost, ...rest } = input; const [r] = await db.insert(mealMenus).values({ ...rest, date: new Date(date), cost: cost?.toString() }).$returningId(); return { success: true, id: r.id }; }),
  update: adminProcedure.input(z.object({ id: z.number(), date: z.string().optional(), mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']).optional(), description: z.string().optional(), calories: z.number().optional(), servings: z.number().optional(), cost: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, date, cost, ...data } = input; const ud: any = { ...data }; if (date) ud.date = new Date(date); if (cost !== undefined) ud.cost = cost.toString(); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0) await db.update(mealMenus).set(ud).where(eq(mealMenus.id, id)); return { success: true }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.update(mealMenus).set({ isActive: false }).where(eq(mealMenus.id, input.id)); return { success: true }; }),
});

export const libraryBooksRouter = t.router({
  list: protectedProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), search: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(libraryBooks.municipalityId, input.municipalityId), eq(libraryBooks.isActive, true)];
      if (input.schoolId) conditions.push(eq(libraryBooks.schoolId, input.schoolId));
      if (input.search) conditions.push(or(like(libraryBooks.title, `%${input.search}%`), like(libraryBooks.author, `%${input.search}%`))!);
      return db.select().from(libraryBooks).where(and(...conditions)).orderBy(libraryBooks.title);
    }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), title: z.string(), author: z.string().optional(), isbn: z.string().optional(), category: z.string().optional(), publisher: z.string().optional(), year: z.number().optional(), quantity: z.number().optional(), location: z.string().optional() }))
    .mutation(async ({ input }) => { const [r] = await db.insert(libraryBooks).values({ ...input, available: input.quantity || 1 }).$returningId(); return { success: true, id: r.id }; }),
  update: adminProcedure.input(z.object({ id: z.number(), title: z.string().optional(), author: z.string().optional(), isbn: z.string().optional(), category: z.string().optional(), publisher: z.string().optional(), year: z.number().optional(), quantity: z.number().optional(), location: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, ...data } = input; const ud: any = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; }); if (Object.keys(ud).length > 0) await db.update(libraryBooks).set(ud).where(eq(libraryBooks.id, id)); return { success: true }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [hasLoans] = await db.select({ c: sql`count(*)`.as('c') }).from(libraryLoans).where(eq(libraryLoans.bookId, input.id));
    if (Number(hasLoans.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Livro possui ${hasLoans.c} empréstimo(s)` });
    await db.update(libraryBooks).set({ isActive: false }).where(eq(libraryBooks.id, input.id)); return { success: true };
  }),
});

export const libraryLoansRouter = t.router({
  list: protectedProcedure.input(z.object({ municipalityId: z.number(), bookId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions: any[] = [eq(libraryBooks.municipalityId, input.municipalityId)];
      if (input.bookId) conditions.push(eq(libraryLoans.bookId, input.bookId));
      if (input.status) conditions.push(eq(libraryLoans.status, input.status as any));
      return db.select({ id: libraryLoans.id, bookId: libraryLoans.bookId, userId: libraryLoans.userId, studentId: libraryLoans.studentId, loanDate: libraryLoans.loanDate, dueDate: libraryLoans.dueDate, returnDate: libraryLoans.returnDate, status: libraryLoans.status, bookTitle: libraryBooks.title, userName: users.name })
        .from(libraryLoans).leftJoin(libraryBooks, eq(libraryLoans.bookId, libraryBooks.id)).leftJoin(users, eq(libraryLoans.userId, users.id))
        .where(and(...conditions)).orderBy(desc(libraryLoans.loanDate));
    }),
  create: protectedProcedure.input(z.object({ bookId: z.number(), userId: z.number().optional(), studentId: z.number().optional(), dueDate: z.string() }))
    .mutation(async ({ ctx, input }) => { const [r] = await db.insert(libraryLoans).values({ bookId: input.bookId, userId: input.userId || ctx.userId!, studentId: input.studentId, dueDate: new Date(input.dueDate) }).$returningId(); await db.update(libraryBooks).set({ available: sql`available - 1` }).where(eq(libraryBooks.id, input.bookId)); return { success: true, id: r.id }; }),
  returnBook: protectedProcedure.input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { const [loan] = await db.select().from(libraryLoans).where(eq(libraryLoans.id, input.id)).limit(1); if (loan) { await db.update(libraryLoans).set({ status: 'returned', returnDate: new Date() }).where(eq(libraryLoans.id, input.id)); await db.update(libraryBooks).set({ available: sql`available + 1` }).where(eq(libraryBooks.id, loan.bookId)); } return { success: true }; }),
});

export const assetsRouter = t.router({
  list: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), category: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(assets.municipalityId, input.municipalityId), eq(assets.isActive, true)];
      if (input.schoolId) conditions.push(eq(assets.schoolId, input.schoolId));
      if (input.category) conditions.push(eq(assets.category, input.category as any));
      return db.select().from(assets).where(and(...conditions)).orderBy(assets.name);
    }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), name: z.string(), code: z.string().optional(), category: z.enum(['movel', 'imovel', 'equipamento', 'veiculo', 'tecnologia', 'outro']).optional(), acquisitionDate: z.string().optional(), acquisitionValue: z.number().optional(), currentValue: z.number().optional(), location: z.string().optional(), condition: z.enum(['otimo', 'bom', 'regular', 'ruim', 'inservivel']).optional(), responsibleUserId: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => { const { acquisitionDate, acquisitionValue, currentValue, ...rest } = input; const [r] = await db.insert(assets).values({ ...rest, acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : undefined, acquisitionValue: acquisitionValue?.toString(), currentValue: currentValue?.toString() }).$returningId(); return { success: true, id: r.id }; }),
  update: adminProcedure.input(z.object({ id: z.number(), name: z.string().optional(), code: z.string().optional(), category: z.enum(['movel', 'imovel', 'equipamento', 'veiculo', 'tecnologia', 'outro']).optional(), location: z.string().optional(), condition: z.enum(['otimo', 'bom', 'regular', 'ruim', 'inservivel']).optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, ...data } = input; const ud: any = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; }); if (Object.keys(ud).length > 0) await db.update(assets).set(ud).where(eq(assets.id, id)); return { success: true }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.update(assets).set({ isActive: false }).where(eq(assets.id, input.id)); return { success: true }; }),
});

export const inventoryRouter = t.router({
  list: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(inventoryItems.municipalityId, input.municipalityId), eq(inventoryItems.isActive, true)];
      if (input.schoolId) conditions.push(eq(inventoryItems.schoolId, input.schoolId));
      return db.select().from(inventoryItems).where(and(...conditions)).orderBy(inventoryItems.name);
    }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), name: z.string(), category: z.string().optional(), unit: z.string().optional(), currentStock: z.number().optional(), minStock: z.number().optional(), maxStock: z.number().optional(), unitCost: z.number().optional(), location: z.string().optional() }))
    .mutation(async ({ input }) => { const { unitCost, ...rest } = input; const [r] = await db.insert(inventoryItems).values({ ...rest, unitCost: unitCost?.toString() }).$returningId(); return { success: true, id: r.id }; }),
  update: adminProcedure.input(z.object({ id: z.number(), name: z.string().optional(), category: z.string().optional(), unit: z.string().optional(), currentStock: z.number().optional(), minStock: z.number().optional(), location: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, ...data } = input; const ud: any = {}; Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; }); if (Object.keys(ud).length > 0) await db.update(inventoryItems).set(ud).where(eq(inventoryItems.id, id)); return { success: true }; }),
  addMovement: adminProcedure.input(z.object({ itemId: z.number(), type: z.enum(['entrada', 'saida', 'ajuste']), quantity: z.number(), documentNumber: z.string().optional(), supplier: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await db.insert(inventoryMovements).values({ ...input, registeredByUserId: ctx.userId });
      // Update stock
      const delta = input.type === 'entrada' ? input.quantity : input.type === 'saida' ? -input.quantity : 0;
      if (delta !== 0) await db.update(inventoryItems).set({ currentStock: sql`currentStock + ${delta}` }).where(eq(inventoryItems.id, input.itemId));
      return { success: true };
    }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const [hasMov] = await db.select({ c: sql`count(*)`.as('c') }).from(inventoryMovements).where(eq(inventoryMovements.itemId, input.id));
    if (Number(hasMov.c) > 0) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Não é possível excluir. Item possui ${hasMov.c} movimentação(ões)` });
    await db.update(inventoryItems).set({ isActive: false }).where(eq(inventoryItems.id, input.id)); return { success: true };
  }),
});

// ============================================
// EDUCACENSO ROUTER (EXPORTAÇÃO DE DADOS)
// ============================================
export const educacensoRouter = t.router({
  // Resumo dos dados para o Censo Escolar
  summary: adminProcedure
    .input(z.object({ municipalityId: z.number(), academicYearId: z.number().optional() }))
    .query(async ({ input }) => {
      const mid = input.municipalityId;
      const [schoolCount] = await db.select({ count: sql<number>`count(*)` }).from(schools).where(and(eq(schools.municipalityId, mid), eq(schools.isActive, true)));
      const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(and(eq(students.municipalityId, mid), eq(students.isActive, true)));
      const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teachers).where(and(eq(teachers.municipalityId, mid), eq(teachers.isActive, true)));
      const [classCount] = await db.select({ count: sql<number>`count(*)` }).from(classes).where(and(eq(classes.municipalityId, mid), eq(classes.isActive, true)));
      const [enrollmentCount] = await db.select({ count: sql<number>`count(*)` }).from(enrollments).where(and(eq(enrollments.municipalityId, mid), eq(enrollments.status, 'active')));

      // By school
      const schoolsList = await db.select().from(schools).where(and(eq(schools.municipalityId, mid), eq(schools.isActive, true)));
      const schoolsData = await Promise.all(schoolsList.map(async (s) => {
        const [sc] = await db.select({ count: sql<number>`count(*)` }).from(students).where(and(eq(students.schoolId, s.id), eq(students.isActive, true)));
        const [cc] = await db.select({ count: sql<number>`count(*)` }).from(classes).where(and(eq(classes.schoolId, s.id), eq(classes.isActive, true)));
        return { id: s.id, name: s.name, code: s.code, type: s.type, students: sc?.count || 0, classes: cc?.count || 0 };
      }));

      // By grade level
      const gradesList = await db.select().from(classGrades).where(and(eq(classGrades.municipalityId, mid), eq(classGrades.isActive, true)));

      return {
        totals: { schools: schoolCount?.count || 0, students: studentCount?.count || 0, teachers: teacherCount?.count || 0, classes: classCount?.count || 0, enrollments: enrollmentCount?.count || 0 },
        schools: schoolsData,
        grades: gradesList,
      };
    }),

  // Exportar dados de escolas para formato EDUCACENSO
  exportSchools: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(schools).where(and(eq(schools.municipalityId, input.municipalityId), eq(schools.isActive, true))).orderBy(schools.name);
    }),

  // Exportar dados de alunos
  exportStudents: adminProcedure
    .input(z.object({ municipalityId: z.number(), schoolId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(students.municipalityId, input.municipalityId), eq(students.isActive, true)];
      if (input.schoolId) conditions.push(eq(students.schoolId, input.schoolId));
      return db.select({ id: students.id, name: students.name, birthDate: students.birthDate, grade: students.grade, shift: students.shift, enrollment: students.enrollment, schoolId: students.schoolId, schoolName: schools.name, hasSpecialNeeds: students.hasSpecialNeeds })
        .from(students).leftJoin(schools, eq(students.schoolId, schools.id)).where(and(...conditions)).orderBy(students.name);
    }),

  // Exportar dados de professores
  exportTeachers: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select({ id: teachers.id, name: users.name, email: users.email, cpf: users.cpf, degree: teachers.degree, contractType: teachers.contractType, weeklyWorkload: teachers.weeklyWorkload })
        .from(teachers).innerJoin(users, eq(teachers.userId, users.id))
        .where(and(eq(teachers.municipalityId, input.municipalityId), eq(teachers.isActive, true)));
    }),

  // Exportar dados de turmas
  exportClasses: adminProcedure
    .input(z.object({ municipalityId: z.number(), academicYearId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(classes.municipalityId, input.municipalityId), eq(classes.isActive, true)];
      if (input.academicYearId) conditions.push(eq(classes.academicYearId, input.academicYearId));
      return db.select({ id: classes.id, name: classes.name, fullName: classes.fullName, shift: classes.shift, maxStudents: classes.maxStudents, schoolName: schools.name, gradeName: classGrades.name, gradeLevel: classGrades.level })
        .from(classes).leftJoin(schools, eq(classes.schoolId, schools.id)).leftJoin(classGrades, eq(classes.classGradeId, classGrades.id))
        .where(and(...conditions));
    }),
});

// ============================================
// TRANSPARENCY PORTAL (PORTAL DE TRANSPARÊNCIA - PÚBLICO)
// ============================================
export const transparencyRouter = t.router({
  // Lista de municípios para seleção pública
  listMunicipalities: publicProcedure
    .query(async () => {
      return db.select({
        id: municipalities.id,
        name: municipalities.name,
        city: municipalities.city,
        state: municipalities.state,
      }).from(municipalities).where(eq(municipalities.isActive, true)).orderBy(municipalities.name);
    }),

  // Dados públicos do município - sem autenticação
  publicData: publicProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const mid = input.municipalityId;
      const [mun] = await db.select({ name: municipalities.name, city: municipalities.city, state: municipalities.state }).from(municipalities).where(eq(municipalities.id, mid)).limit(1);
      if (!mun) return null;

      const [schoolCount] = await db.select({ count: sql<number>`count(*)` }).from(schools).where(and(eq(schools.municipalityId, mid), eq(schools.isActive, true)));
      const [studentCount] = await db.select({ count: sql<number>`count(*)` }).from(students).where(and(eq(students.municipalityId, mid), eq(students.isActive, true)));
      const [teacherCount] = await db.select({ count: sql<number>`count(*)` }).from(teachers).where(and(eq(teachers.municipalityId, mid), eq(teachers.isActive, true)));
      const [vehicleCount] = await db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.municipalityId, mid));
      const [routeCount] = await db.select({ count: sql<number>`count(*)` }).from(routes).where(and(eq(routes.municipalityId, mid), eq(routes.isActive, true)));
      const [contractCount] = await db.select({ count: sql<number>`count(*)` }).from(contracts).where(and(eq(contracts.municipalityId, mid), eq(contracts.isActive, true)));

      // Financial summary
      const txns = await db.select({ type: financialTransactions.type, value: financialTransactions.value })
        .from(financialTransactions).where(and(eq(financialTransactions.municipalityId, mid), eq(financialTransactions.isActive, true)));
      const totalReceita = txns.filter(t => t.type === 'receita').reduce((s, t) => s + (parseFloat(t.value as any) || 0), 0);
      const totalDespesa = txns.filter(t => t.type === 'despesa').reduce((s, t) => s + (parseFloat(t.value as any) || 0), 0);

      // Contracts list (public)
      const publicContracts = await db.select({ number: contracts.number, type: contracts.type, supplier: contracts.supplier, value: contracts.value, startDate: contracts.startDate, endDate: contracts.endDate })
        .from(contracts).where(and(eq(contracts.municipalityId, mid), eq(contracts.isActive, true))).orderBy(desc(contracts.createdAt)).limit(20);

      // Schools list (public)
      const publicSchools = await db.select({ name: schools.name, type: schools.type, address: schools.address, phone: schools.phone })
        .from(schools).where(and(eq(schools.municipalityId, mid), eq(schools.isActive, true))).orderBy(schools.name);

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
export const descriptiveReportsRouter = t.router({
  list: academicProcedure.input(z.object({ municipalityId: z.number(), classId: z.number(), bimester: z.string().optional() }))
    .query(async ({ input }) => {
      const [cls] = await db.select({ municipalityId: classes.municipalityId }).from(classes).where(and(eq(classes.id, input.classId), eq(classes.municipalityId, input.municipalityId))).limit(1);
      if (!cls) throw new TRPCError({ code: 'NOT_FOUND', message: 'Turma não encontrada' });
      const conditions = [eq(descriptiveReports.classId, input.classId), eq(descriptiveReports.isActive, true)];
      if (input.bimester) conditions.push(eq(descriptiveReports.bimester, input.bimester as any));
      return db.select({ id: descriptiveReports.id, studentId: descriptiveReports.studentId, bimester: descriptiveReports.bimester, content: descriptiveReports.content, status: descriptiveReports.status, studentName: students.name })
        .from(descriptiveReports).leftJoin(students, eq(descriptiveReports.studentId, students.id)).where(and(...conditions));
    }),
  save: academicProcedure.input(z.object({ municipalityId: z.number(), studentId: z.number(), classId: z.number(), bimester: z.enum(['1','2','3','4']), content: z.string(), status: z.enum(['draft','published']).optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select().from(descriptiveReports).where(and(eq(descriptiveReports.studentId, input.studentId), eq(descriptiveReports.classId, input.classId), eq(descriptiveReports.bimester, input.bimester))).limit(1);
      if (existing.length > 0) { await db.update(descriptiveReports).set({ content: input.content, status: input.status || 'draft', teacherUserId: ctx.userId }).where(eq(descriptiveReports.id, existing[0].id)); return { success: true, id: existing[0].id }; }
      const [r] = await db.insert(descriptiveReports).values({ ...input, teacherUserId: ctx.userId }).$returningId();
      return { success: true, id: r.id };
    }),
});

// Calendário Escolar
export const schoolCalendarRouter = t.router({
  list: protectedProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), month: z.number().optional(), year: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(schoolCalendar.municipalityId, input.municipalityId), eq(schoolCalendar.isActive, true)];
      if (input.schoolId) conditions.push(eq(schoolCalendar.schoolId, input.schoolId));
      return db.select().from(schoolCalendar).where(and(...conditions)).orderBy(schoolCalendar.startDate);
    }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), academicYearId: z.number().optional(), title: z.string(), description: z.string().optional(), startDate: z.string(), endDate: z.string().optional(), eventType: z.enum(['aula','feriado','recesso','reuniao','conselho','prova','evento','outro']).optional(), color: z.string().optional() }))
    .mutation(async ({ input }) => { const { startDate, endDate, ...rest } = input; const [r] = await db.insert(schoolCalendar).values({ ...rest, startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : undefined }).$returningId(); return { success: true, id: r.id }; }),
  update: adminProcedure.input(z.object({ id: z.number(), title: z.string().optional(), description: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(), eventType: z.enum(['aula','feriado','recesso','reuniao','conselho','prova','evento','outro']).optional(), color: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, startDate, endDate, ...data } = input; const ud: any = { ...data }; if (startDate) ud.startDate = new Date(startDate); if (endDate) ud.endDate = new Date(endDate); Object.keys(ud).forEach(k => ud[k] === undefined && delete ud[k]); if (Object.keys(ud).length > 0) await db.update(schoolCalendar).set(ud).where(eq(schoolCalendar.id, id)); return { success: true }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.update(schoolCalendar).set({ isActive: false }).where(eq(schoolCalendar.id, input.id)); return { success: true }; }),

  // Check if tracking should be active today
  trackingStatus: protectedProcedure
    .input(z.object({ municipalityId: z.number(), date: z.string().optional() }))
    .query(async ({ input }) => {
      const checkDate = input.date ? new Date(input.date) : new Date();
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay(); // 0=Sun, 6=Sat

      // Weekend check
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { isSchoolDay: false, reason: 'Fim de semana', trackingActive: false, events: [] };
      }

      // Check calendar events for this date
      const events = await db.select().from(schoolCalendar)
        .where(and(
          eq(schoolCalendar.municipalityId, input.municipalityId),
          eq(schoolCalendar.isActive, true),
          lte(schoolCalendar.startDate, checkDate),
        ));

      // Filter events that cover this date
      const activeEvents = events.filter(e => {
        const start = e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '';
        const end = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : start;
        return dateStr >= start && dateStr <= end;
      });

      // Check if any event blocks tracking (feriado, recesso)
      const blockingEvent = activeEvents.find(e =>
        e.eventType === 'feriado' || e.eventType === 'recesso'
      );

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
      const [activeYear] = await db.select().from(academicYears)
        .where(and(eq(academicYears.municipalityId, input.municipalityId), eq(academicYears.isActive, true)))
        .orderBy(desc(academicYears.year))
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
  weekStatus: protectedProcedure
    .input(z.object({ municipalityId: z.number(), startDate: z.string() }))
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

        const events = await db.select().from(schoolCalendar)
          .where(and(eq(schoolCalendar.municipalityId, input.municipalityId), eq(schoolCalendar.isActive, true)));

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
  currentBimester: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const [activeYear] = await db.select().from(academicYears)
        .where(and(eq(academicYears.municipalityId, input.municipalityId), eq(academicYears.status, 'active')))
        .limit(1);

      if (!activeYear) return { bimester: null, academicYear: null };

      const today = new Date();
      const start = new Date(activeYear.startDate);
      const end = new Date(activeYear.endDate);
      const totalDays = (end.getTime() - start.getTime()) / 86400000;
      const elapsed = (today.getTime() - start.getTime()) / 86400000;
      const progress = Math.max(0, Math.min(1, elapsed / totalDays));

      let bimester = '1';
      if (progress > 0.75) bimester = '4';
      else if (progress > 0.5) bimester = '3';
      else if (progress > 0.25) bimester = '2';

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
export const messagesRouter = t.router({
  list: protectedProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const conditions = [eq(messages.municipalityId, input.municipalityId), eq(messages.isActive, true)];
      if (input.schoolId) conditions.push(eq(messages.schoolId, input.schoolId));
      return db.select({ id: messages.id, title: messages.title, content: messages.content, targetType: messages.targetType, priority: messages.priority, createdAt: messages.createdAt, senderName: users.name })
        .from(messages).leftJoin(users, eq(messages.senderUserId, users.id)).where(and(...conditions)).orderBy(desc(messages.createdAt)).limit(input.limit);
    }),
  create: protectedProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), targetType: z.enum(['all','school','class','student','staff']).optional(), targetClassId: z.number().optional(), targetStudentId: z.number().optional(), title: z.string(), content: z.string(), priority: z.enum(['normal','important','urgent']).optional() }))
    .mutation(async ({ ctx, input }) => { const [r] = await db.insert(messages).values({ ...input, senderUserId: ctx.userId! }).$returningId(); return { success: true, id: r.id }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.update(messages).set({ isActive: false }).where(eq(messages.id, input.id)); return { success: true }; }),
});

// Lista de Espera
export const waitingListRouter = t.router({
  list: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(waitingList.municipalityId, input.municipalityId)];
      if (input.schoolId) conditions.push(eq(waitingList.schoolId, input.schoolId));
      if (input.status) conditions.push(eq(waitingList.status, input.status as any));
      return db.select().from(waitingList).where(and(...conditions)).orderBy(waitingList.position);
    }),
  create: adminProcedure.input(z.object({ municipalityId: z.number(), schoolId: z.number(), studentName: z.string(), birthDate: z.string().optional(), guardianName: z.string().optional(), guardianPhone: z.string().optional(), guardianCpf: z.string().optional(), gradeRequested: z.string().optional(), shift: z.enum(['morning','afternoon','evening']).optional(), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [last] = await db.select({ max: sql<number>`COALESCE(MAX(position), 0)` }).from(waitingList).where(and(eq(waitingList.schoolId, input.schoolId), eq(waitingList.status, 'waiting')));
      const { birthDate, ...rest } = input;
      const [r] = await db.insert(waitingList).values({ ...rest, birthDate: birthDate ? new Date(birthDate) : undefined, position: (last?.max || 0) + 1 }).$returningId();
      return { success: true, id: r.id };
    }),
  updateStatus: adminProcedure.input(z.object({ id: z.number(), status: z.enum(['waiting','called','enrolled','cancelled']), notes: z.string().optional() }))
    .mutation(async ({ input }) => { const { id, ...data } = input; await db.update(waitingList).set(data).where(eq(waitingList.id, id)); return { success: true }; }),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.delete(waitingList).where(eq(waitingList.id, input.id)); return { success: true }; }),
});

// Documentos do Aluno
export const studentDocumentsRouter = t.router({
  list: protectedProcedure.input(z.object({ municipalityId: z.number(), studentId: z.number() }))
    .query(async ({ input }) => {
      const [stu] = await db.select({ municipalityId: students.municipalityId }).from(students).where(and(eq(students.id, input.studentId), eq(students.municipalityId, input.municipalityId))).limit(1);
      if (!stu) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
      return db.select().from(studentDocuments).where(eq(studentDocuments.studentId, input.studentId)).orderBy(desc(studentDocuments.createdAt));
    }),
  create: adminProcedure.input(z.object({ studentId: z.number(), name: z.string(), type: z.enum(['certidao_nascimento','rg','cpf','comprovante_residencia','historico_escolar','laudo_medico','foto','outro']).optional(), fileUrl: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [r] = await db.insert(studentDocuments).values({ ...input, uploadedByUserId: ctx.userId }).$returningId();
      return { success: true, id: r.id };
    }),
  delete: adminProcedure.input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => { await db.delete(studentDocuments).where(eq(studentDocuments.id, input.id)); return { success: true }; }),
});

// ============================================
// FORM FIELD CONFIG ROUTER
// ============================================
export const formConfigRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number(), formType: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(formFieldConfigs.municipalityId, input.municipalityId)];
      if (input.formType) conditions.push(eq(formFieldConfigs.formType, input.formType));
      return db.select().from(formFieldConfigs).where(and(...conditions));
    }),

  save: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      formType: z.string(),
      fields: z.array(z.object({ fieldName: z.string(), isRequired: z.boolean() })),
    }))
    .mutation(async ({ input }) => {
      // Delete existing configs for this form type
      await db.delete(formFieldConfigs).where(
        and(eq(formFieldConfigs.municipalityId, input.municipalityId), eq(formFieldConfigs.formType, input.formType))
      );
      // Insert new configs (only required ones)
      const required = input.fields.filter(f => f.isRequired);
      if (required.length > 0) {
        await db.insert(formFieldConfigs).values(
          required.map(f => ({ municipalityId: input.municipalityId, formType: input.formType, fieldName: f.fieldName, isRequired: true }))
        );
      }
      return { success: true };
    }),
});

// ============================================
// FUEL RECORDS ROUTER
// ============================================
export const fuelRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number(), vehicleId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(fuelRecords.municipalityId, input.municipalityId)];
      if (input.vehicleId) conditions.push(eq(fuelRecords.vehicleId, input.vehicleId));
      return db.select({
        fuel: fuelRecords,
        vehicle: { id: vehicles.id, plate: vehicles.plate, nickname: vehicles.nickname },
      }).from(fuelRecords)
        .innerJoin(vehicles, eq(fuelRecords.vehicleId, vehicles.id))
        .where(and(...conditions))
        .orderBy(desc(fuelRecords.fuelDate));
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), vehicleId: z.number(), driverId: z.number().optional(),
      fuelDate: z.string(), fuelType: z.string().optional(),
      liters: z.number(), pricePerLiter: z.number().optional(), totalCost: z.number(),
      kmAtFueling: z.number().optional(), gasStation: z.string().optional(),
      invoiceNumber: z.string().optional(), notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [result] = await db.insert(fuelRecords).values({
        ...input, fuelDate: new Date(input.fuelDate),
        liters: String(input.liters), totalCost: String(input.totalCost),
        pricePerLiter: input.pricePerLiter ? String(input.pricePerLiter) : undefined,
      } as any);
      return { id: result.insertId };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(fuelRecords).where(eq(fuelRecords.id, input.id));
      return { success: true };
    }),
});

// ============================================
// STUDENT HISTORY ROUTER (Histórico Escolar Anterior)
// ============================================
export const studentHistoryRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number(), studentId: z.number() }))
    .query(async ({ input }) => {
      const [stu] = await db.select({ municipalityId: students.municipalityId }).from(students).where(and(eq(students.id, input.studentId), eq(students.municipalityId, input.municipalityId))).limit(1);
      if (!stu) throw new TRPCError({ code: 'NOT_FOUND', message: 'Aluno não encontrado' });
      return db.select().from(studentHistory)
        .where(eq(studentHistory.studentId, input.studentId))
        .orderBy(studentHistory.year);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      studentId: z.number(),
      year: z.number(),
      grade: z.string(),
      schoolName: z.string(),
      schoolCity: z.string().optional(),
      schoolState: z.string().optional(),
      schoolType: z.string().optional(),
      result: z.string(),
      observations: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [result] = await db.insert(studentHistory).values(input as any).$returningId();
      return { success: true, id: result.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      year: z.number().optional(),
      grade: z.string().optional(),
      schoolName: z.string().optional(),
      schoolCity: z.string().optional(),
      schoolState: z.string().optional(),
      schoolType: z.string().optional(),
      result: z.string().optional(),
      observations: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(studentHistory).set(data).where(eq(studentHistory.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(studentHistory).where(eq(studentHistory.id, input.id));
      return { success: true };
    }),
});

// ============================================
// STUDENT OCCURRENCES ROUTER
// ============================================
export const studentOccurrencesRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(studentOccurrences)
        .where(eq(studentOccurrences.municipalityId, input.municipalityId))
        .orderBy(desc(studentOccurrences.date));
    }),
  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), studentId: z.number(), studentName: z.string().optional(),
      date: z.string(), type: z.string(), description: z.string(), action: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [r] = await db.insert(studentOccurrences).values({ ...input, date: new Date(input.date), createdById: ctx.userId }).$returningId();
      return { success: true, id: r.id };
    }),
  update: adminProcedure
    .input(z.object({
      id: z.number(), date: z.string().optional(), type: z.string().optional(),
      description: z.string().optional(), action: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, date, ...data } = input;
      const ud: any = { ...data };
      if (date) ud.date = new Date(date);
      await db.update(studentOccurrences).set(ud).where(eq(studentOccurrences.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(studentOccurrences).where(eq(studentOccurrences.id, input.id));
      return { success: true };
    }),
});

// ============================================
// EVENTS ROUTER
// ============================================
export const eventsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(events)
        .where(eq(events.municipalityId, input.municipalityId))
        .orderBy(desc(events.date));
    }),
  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), title: z.string(), date: z.string(), endDate: z.string().optional(),
      type: z.string().optional(), location: z.string().optional(), description: z.string().optional(),
      responsible: z.string().optional(), estimatedParticipants: z.number().optional(), budget: z.number().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { date, endDate, budget, ...rest } = input;
      const values: any = { ...rest, date: new Date(date), createdById: ctx.userId };
      if (endDate) values.endDate = new Date(endDate);
      if (budget !== undefined) values.budget = String(budget);
      const [r] = await db.insert(events).values(values).$returningId();
      return { success: true, id: r.id };
    }),
  update: adminProcedure
    .input(z.object({
      id: z.number(), title: z.string().optional(), date: z.string().optional(), endDate: z.string().optional(),
      type: z.string().optional(), location: z.string().optional(), description: z.string().optional(),
      responsible: z.string().optional(), estimatedParticipants: z.number().optional(), budget: z.number().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, date, endDate, budget, ...data } = input;
      const ud: any = { ...data };
      if (date) ud.date = new Date(date);
      if (endDate) ud.endDate = new Date(endDate);
      if (budget !== undefined) ud.budget = String(budget);
      await db.update(events).set(ud).where(eq(events.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(events).where(eq(events.id, input.id));
      return { success: true };
    }),
});

// ============================================
// QUOTATIONS ROUTER
// ============================================
export const quotationsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(quotations)
        .where(eq(quotations.municipalityId, input.municipalityId))
        .orderBy(desc(quotations.createdAt));
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [q] = await db.select().from(quotations).where(eq(quotations.id, input.id)).limit(1);
      if (!q) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cotação não encontrada' });
      const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, input.id));
      return { ...q, items };
    }),
  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), title: z.string(),
      supplier1Name: z.string().optional(), supplier2Name: z.string().optional(), supplier3Name: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [r] = await db.insert(quotations).values({ ...input, createdById: ctx.userId } as any).$returningId();
      return { success: true, id: r.id };
    }),
  update: adminProcedure
    .input(z.object({
      id: z.number(), title: z.string().optional(),
      supplier1Name: z.string().optional(), supplier2Name: z.string().optional(), supplier3Name: z.string().optional(),
      winnerSupplier: z.string().optional(), status: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(quotations).set(data).where(eq(quotations.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(quotationItems).where(eq(quotationItems.quotationId, input.id));
      await db.delete(quotations).where(eq(quotations.id, input.id));
      return { success: true };
    }),
});

// ============================================
// QUOTATION ITEMS ROUTER
// ============================================
export const quotationItemsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ quotationId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(quotationItems).where(eq(quotationItems.quotationId, input.quotationId));
    }),
  create: adminProcedure
    .input(z.object({
      quotationId: z.number(), description: z.string(), unit: z.string().optional(),
      quantity: z.number().optional(), supplier1Price: z.number().optional(),
      supplier2Price: z.number().optional(), supplier3Price: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { supplier1Price, supplier2Price, supplier3Price, ...rest } = input;
      const values: any = { ...rest };
      if (supplier1Price !== undefined) values.supplier1Price = String(supplier1Price);
      if (supplier2Price !== undefined) values.supplier2Price = String(supplier2Price);
      if (supplier3Price !== undefined) values.supplier3Price = String(supplier3Price);
      const [r] = await db.insert(quotationItems).values(values).$returningId();
      return { success: true, id: r.id };
    }),
  update: adminProcedure
    .input(z.object({
      id: z.number(), description: z.string().optional(), unit: z.string().optional(),
      quantity: z.number().optional(), supplier1Price: z.number().optional(),
      supplier2Price: z.number().optional(), supplier3Price: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, supplier1Price, supplier2Price, supplier3Price, ...data } = input;
      const ud: any = { ...data };
      if (supplier1Price !== undefined) ud.supplier1Price = String(supplier1Price);
      if (supplier2Price !== undefined) ud.supplier2Price = String(supplier2Price);
      if (supplier3Price !== undefined) ud.supplier3Price = String(supplier3Price);
      await db.update(quotationItems).set(ud).where(eq(quotationItems.id, id));
      return { success: true };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(quotationItems).where(eq(quotationItems.id, input.id));
      return { success: true };
    }),
});

// ============================================
// CLASS COUNCIL ROUTER
// ============================================
export const classCouncilRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number(), classId: z.number(), bimester: z.number() }))
    .query(async ({ input }) => {
      const [cls] = await db.select({ municipalityId: classes.municipalityId }).from(classes).where(and(eq(classes.id, input.classId), eq(classes.municipalityId, input.municipalityId))).limit(1);
      if (!cls) throw new TRPCError({ code: 'NOT_FOUND', message: 'Turma não encontrada' });
      return db.select().from(classCouncilRecords)
        .where(and(
          eq(classCouncilRecords.classId, input.classId),
          eq(classCouncilRecords.bimester, input.bimester)
        ));
    }),
  save: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      classId: z.number(),
      bimester: z.number(),
      records: z.array(z.object({
        studentId: z.number(),
        decision: z.string().optional(),
        observations: z.string().optional(),
      })),
      generalNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      for (const record of input.records) {
        const existing = await db.select().from(classCouncilRecords)
          .where(and(
            eq(classCouncilRecords.classId, input.classId),
            eq(classCouncilRecords.bimester, input.bimester),
            eq(classCouncilRecords.studentId, record.studentId)
          )).limit(1);

        if (existing.length > 0) {
          await db.update(classCouncilRecords).set({
            decision: record.decision,
            observations: record.observations,
          }).where(eq(classCouncilRecords.id, existing[0].id));
        } else {
          await db.insert(classCouncilRecords).values({
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
        await db.update(classes).set({ generalNotes: input.generalNotes }).where(eq(classes.id, input.classId));
      }
      return { success: true };
    }),
});

// ============================================
// VEHICLE INSPECTIONS ROUTER
// ============================================
export const vehicleInspectionsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(vehicleInspections)
        .where(eq(vehicleInspections.municipalityId, input.municipalityId))
        .orderBy(desc(vehicleInspections.inspectionDate));
    }),
  listByVehicle: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(vehicleInspections)
        .where(eq(vehicleInspections.vehicleId, input.vehicleId))
        .orderBy(desc(vehicleInspections.inspectionDate))
        .limit(1);
    }),
  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), vehicleId: z.number(), inspectorName: z.string().optional(),
      inspectionDate: z.string(), checks: z.any().optional(), observations: z.string().optional(),
      approvedCount: z.number().optional(), rejectedCount: z.number().optional(), pendingCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { inspectionDate, ...rest } = input;
      const [r] = await db.insert(vehicleInspections).values({
        ...rest, inspectionDate: new Date(inspectionDate), createdById: ctx.userId,
      } as any).$returningId();
      return { success: true, id: r.id };
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(vehicleInspections).where(eq(vehicleInspections.id, input.id));
      return { success: true };
    }),
});

// ============================================
// DOCUMENTS ROUTER
// ============================================
export const documentsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const docs = await db.select({
        id: documents.id,
        verificationCode: documents.verificationCode,
        type: documents.type,
        title: documents.title,
        status: documents.status,
        generatedAt: documents.generatedAt,
        generatedById: documents.generatedById,
        pdfHash: documents.pdfHash,
        pdfSize: documents.pdfSize,
        revokedAt: documents.revokedAt,
        revokedReason: documents.revokedReason,
      }).from(documents)
        .where(eq(documents.municipalityId, input.municipalityId))
        .orderBy(desc(documents.generatedAt));

      // Get signature counts for each document
      const docIds = docs.map(d => d.id);
      let sigCounts: Record<number, number> = {};
      if (docIds.length > 0) {
        const counts = await db.select({
          documentId: documentSignatures.documentId,
          count: sql<number>`COUNT(*)`.as('count'),
        }).from(documentSignatures)
          .where(inArray(documentSignatures.documentId, docIds))
          .groupBy(documentSignatures.documentId);
        for (const c of counts) {
          sigCounts[c.documentId] = c.count;
        }
      }

      return docs.map(d => ({
        ...d,
        signatureCount: sigCounts[d.id] || 0,
      }));
    }),

  revoke: adminProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().min(3),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(documents)
        .set({
          status: 'revoked',
          revokedAt: new Date(),
          revokedById: ctx.userId!,
          revokedReason: input.reason,
        } as any)
        .where(eq(documents.id, input.id));
      return { success: true };
    }),
});

// ============================================
// DOCUMENT SIGNATURES ROUTER (SEI-style)
// ============================================
export const documentSignaturesRouter = t.router({
  // Sign a document (requires password verification)
  sign: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      password: z.string(),
      signerRole: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Get user by ctx.userId
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        cpf: users.cpf,
        passwordHash: users.passwordHash,
      }).from(users).where(eq(users.id, ctx.userId!)).limit(1);

      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });

      // 2. Verify password with bcrypt compare
      if (!user.passwordHash) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário sem senha definida' });
      const isValid = await compare(input.password, user.passwordHash);
      if (!isValid) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha incorreta. A assinatura requer sua senha de login.' });

      // 3. Get document to get its pdfHash
      const [doc] = await db.select({
        id: documents.id,
        pdfHash: documents.pdfHash,
        status: documents.status,
      }).from(documents).where(eq(documents.id, input.documentId)).limit(1);

      if (!doc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Documento não encontrado' });
      if (doc.status !== 'valid') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Documento revogado ou expirado não pode ser assinado' });

      // 4. Check if user already signed this document
      const [existing] = await db.select({ id: documentSignatures.id })
        .from(documentSignatures)
        .where(and(
          eq(documentSignatures.documentId, input.documentId),
          eq(documentSignatures.signerId, ctx.userId!),
        )).limit(1);

      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Você já assinou este documento' });

      // 5. Create signatureHash = SHA-256(pdfHash + signerId + timestamp)
      const now = new Date();
      const signatureHash = createHash('sha256')
        .update(`${doc.pdfHash}:${user.id}:${now.toISOString()}`)
        .digest('hex');

      // 6. Insert into documentSignatures
      const [result] = await db.insert(documentSignatures).values({
        documentId: input.documentId,
        signerId: user.id,
        signerName: user.name,
        signerRole: input.signerRole || null,
        signerCpf: user.cpf || null,
        signatureHash,
        ipAddress: null, // Will be filled from REST endpoint if needed
        signedAt: now,
      } as any).$returningId();

      return {
        success: true,
        id: result.id,
        signatureHash,
        signerName: user.name,
        signedAt: now.toISOString(),
      };
    }),

  // List signatures for a document
  listByDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(documentSignatures)
        .where(eq(documentSignatures.documentId, input.documentId))
        .orderBy(documentSignatures.signedAt);
    }),

  // Verify a signature (public)
  verifySignature: publicProcedure
    .input(z.object({ signatureId: z.number() }))
    .query(async ({ input }) => {
      const [sig] = await db.select().from(documentSignatures)
        .where(eq(documentSignatures.id, input.signatureId)).limit(1);

      if (!sig) return { valid: false, message: 'Assinatura não encontrada' };

      const [doc] = await db.select({
        id: documents.id,
        verificationCode: documents.verificationCode,
        type: documents.type,
        title: documents.title,
        status: documents.status,
        pdfHash: documents.pdfHash,
        generatedAt: documents.generatedAt,
      }).from(documents).where(eq(documents.id, sig.documentId)).limit(1);

      // Recompute hash to verify integrity
      const expectedHash = createHash('sha256')
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
export const aiRouter = t.router({
  // Analisar todas as rotas de um município
  analyzeRoutes: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const allRoutes = await db.select().from(routes)
        .where(and(eq(routes.municipalityId, input.municipalityId), eq(routes.isActive, true)));

      const results = [];
      for (const route of allRoutes) {
        const routeStops = await db.select({
          id: stops.id,
          name: stops.name,
          latitude: stops.latitude,
          longitude: stops.longitude,
          orderIndex: stops.orderIndex,
        }).from(stops)
          .where(and(eq(stops.routeId, route.id), eq(stops.isActive, true)))
          .orderBy(stops.orderIndex);

        // Buscar alunos associados às paradas desta rota
        const stopIds = routeStops.map(s => s.id);
        let routeStudents: { id: number; name: string; latitude: number; longitude: number }[] = [];
        if (stopIds.length > 0) {
          const studs = await db.select({
            id: students.id,
            name: students.name,
            latitude: students.latitude,
            longitude: students.longitude,
          }).from(stopStudents)
            .innerJoin(students, eq(stopStudents.studentId, students.id))
            .where(inArray(stopStudents.stopId, stopIds));
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

        const analysis = analyzeRoute(route, validStops, routeStudents);
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
  optimizeRoute: adminProcedure
    .input(z.object({ routeId: z.number() }))
    .mutation(async ({ input }) => {
      const routeStops = await db.select({
        id: stops.id,
        name: stops.name,
        latitude: stops.latitude,
        longitude: stops.longitude,
        orderIndex: stops.orderIndex,
      }).from(stops)
        .where(and(eq(stops.routeId, input.routeId), eq(stops.isActive, true)))
        .orderBy(stops.orderIndex);

      const validStops = routeStops
        .filter(s => s.latitude != null && s.longitude != null)
        .map(s => ({
          id: s.id,
          name: s.name,
          latitude: parseFloat(String(s.latitude)),
          longitude: parseFloat(String(s.longitude)),
        }));

      if (validStops.length < 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A rota precisa de pelo menos 2 paradas com coordenadas para otimizar.',
        });
      }

      const { optimizedStops, originalDistance, optimizedDistance, savingsPercent } =
        optimizeStopOrder(validStops);

      // Atualizar orderIndex de cada parada no banco
      for (let i = 0; i < optimizedStops.length; i++) {
        await db.update(stops)
          .set({ orderIndex: i })
          .where(eq(stops.id, optimizedStops[i].id));
      }

      // Atualizar distância total da rota
      await db.update(routes)
        .set({ totalDistanceKm: String(optimizedDistance) })
        .where(eq(routes.id, input.routeId));

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
  suggestStops: adminProcedure
    .input(z.object({ municipalityId: z.number(), numClusters: z.number().default(5) }))
    .query(async ({ input }) => {
      // Buscar alunos que precisam de transporte mas não têm parada atribuída
      const allStudents = await db.select({
        id: students.id,
        name: students.name,
        latitude: students.latitude,
        longitude: students.longitude,
        address: students.address,
        neighborhood: students.neighborhood,
      }).from(students)
        .where(and(
          eq(students.municipalityId, input.municipalityId),
          eq(students.needsTransport, true),
        ));

      // Filtrar alunos que já têm parada
      const assignedStudentIds = await db.select({ studentId: stopStudents.studentId })
        .from(stopStudents);
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

      const { clusters } = clusterStudents(
        unassigned.map(s => ({ id: s.id, name: s.name, latitude: s.latitude, longitude: s.longitude })),
        input.numClusters
      );

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
              distanceToCenter: Math.round(
                haversineDistance(s.latitude, s.longitude, c.center.latitude, c.center.longitude) * 1000
              ), // em metros
            };
          }),
          averageRadius: Math.round(
            c.students.reduce((sum, s) =>
              sum + haversineDistance(s.latitude, s.longitude, c.center.latitude, c.center.longitude), 0
            ) / c.students.length * 1000
          ), // raio médio em metros
        })),
      };
    }),

  // Análise de risco de evasão escolar
  studentRiskAnalysis: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      // Buscar todos os alunos do município
      const allStudents = await db.select({
        id: students.id,
        name: students.name,
        enrollment: students.enrollment,
        schoolId: students.schoolId,
        grade: students.grade,
      }).from(students)
        .where(eq(students.municipalityId, input.municipalityId));

      if (allStudents.length === 0) return [];

      const studentIds = allStudents.map(s => s.id);

      // Buscar contagem de ausências por aluno (trip_student_logs where eventType='absent')
      const absenceCounts = await db.select({
        studentId: tripStudentLogs.studentId,
        count: sql<number>`COUNT(*)`.as('count'),
      }).from(tripStudentLogs)
        .where(and(
          inArray(tripStudentLogs.studentId, studentIds),
          eq(tripStudentLogs.eventType, 'absent')
        ))
        .groupBy(tripStudentLogs.studentId);
      const absenceMap = new Map(absenceCounts.map(a => [a.studentId, Number(a.count)]));

      // Buscar médias de notas por aluno
      const gradeAvgs = await db.select({
        studentId: studentGrades.studentId,
        avg: sql<number>`AVG(${studentGrades.score})`.as('avg'),
      }).from(studentGrades)
        .where(inArray(studentGrades.studentId, studentIds))
        .groupBy(studentGrades.studentId);
      const gradeMap = new Map(gradeAvgs.map(g => [g.studentId, Number(g.avg)]));

      // Buscar contagem de ocorrências por aluno
      const occCounts = await db.select({
        studentId: studentOccurrences.studentId,
        count: sql<number>`COUNT(*)`.as('count'),
      }).from(studentOccurrences)
        .where(and(
          eq(studentOccurrences.municipalityId, input.municipalityId),
          inArray(studentOccurrences.studentId, studentIds)
        ))
        .groupBy(studentOccurrences.studentId);
      const occMap = new Map(occCounts.map(o => [o.studentId, Number(o.count)]));

      // Buscar status de matrícula (evadido/transferido = já em risco)
      const enrollmentStatuses = await db.select({
        studentId: enrollments.studentId,
        status: enrollments.status,
      }).from(enrollments)
        .where(and(
          eq(enrollments.municipalityId, input.municipalityId),
          inArray(enrollments.studentId, studentIds),
          inArray(enrollments.status, ['transferred', 'evaded'])
        ));
      const atRiskEnrollment = new Set(enrollmentStatuses.map(e => e.studentId));

      // Calcular score de risco para cada aluno
      const results = allStudents.map(student => {
        let riskScore = 0;
        const riskFactors: string[] = [];

        // Ausências
        const absences = absenceMap.get(student.id) || 0;
        if (absences > 10) {
          riskScore += 30;
          riskFactors.push(`${absences} ausências no transporte (crítico)`);
        } else if (absences > 5) {
          riskScore += 15;
          riskFactors.push(`${absences} ausências no transporte`);
        }

        // Notas
        const avgGrade = gradeMap.get(student.id);
        if (avgGrade !== undefined) {
          if (avgGrade < 5.0) {
            riskScore += 25;
            riskFactors.push(`Média ${avgGrade.toFixed(1)} (abaixo de 5.0 - crítico)`);
          } else if (avgGrade < 7.0) {
            riskScore += 10;
            riskFactors.push(`Média ${avgGrade.toFixed(1)} (abaixo de 7.0)`);
          }
        }

        // Ocorrências
        const occurrences = occMap.get(student.id) || 0;
        if (occurrences > 3) {
          riskScore += 20;
          riskFactors.push(`${occurrences} ocorrências registradas (crítico)`);
        } else if (occurrences > 1) {
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

        let riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico';
        if (riskScore >= 60) riskLevel = 'critico';
        else if (riskScore >= 40) riskLevel = 'alto';
        else if (riskScore >= 20) riskLevel = 'moderado';
        else riskLevel = 'baixo';

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
export const chatRouter = t.router({
  // Listar conversas do usuario
  conversations: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.userId!;
      const convos = await db.select({
        id: chatConversations.id,
        participant1Id: chatConversations.participant1Id,
        participant2Id: chatConversations.participant2Id,
        lastMessageAt: chatConversations.lastMessageAt,
        municipalityId: chatConversations.municipalityId,
      })
        .from(chatConversations)
        .where(or(
          eq(chatConversations.participant1Id, userId),
          eq(chatConversations.participant2Id, userId)
        ))
        .orderBy(desc(chatConversations.lastMessageAt));

      // Buscar dados dos outros participantes e ultima mensagem
      const results = [];
      for (const c of convos) {
        const otherUserId = c.participant1Id === userId ? c.participant2Id : c.participant1Id;
        const [otherUser] = await db.select({ id: users.id, name: users.name, role: users.role, avatarUrl: users.avatarUrl })
          .from(users).where(eq(users.id, otherUserId)).limit(1);
        const [lastMsg] = await db.select({ content: chatMessages.content, senderId: chatMessages.senderId, createdAt: chatMessages.createdAt })
          .from(chatMessages).where(eq(chatMessages.conversationId, c.id)).orderBy(desc(chatMessages.createdAt)).limit(1);
        const [unreadResult] = await db.select({ count: sql<number>`count(*)` })
          .from(chatMessages)
          .where(and(
            eq(chatMessages.conversationId, c.id),
            eq(chatMessages.isRead, false),
            sql`${chatMessages.senderId} != ${userId}`
          ));
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
  history: protectedProcedure
    .input(z.object({ conversationId: z.number(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId!;
      // Verificar que o usuario participa da conversa
      const [conv] = await db.select().from(chatConversations)
        .where(and(
          eq(chatConversations.id, input.conversationId),
          or(eq(chatConversations.participant1Id, userId), eq(chatConversations.participant2Id, userId))
        )).limit(1);
      if (!conv) throw new TRPCError({ code: 'FORBIDDEN', message: 'Voce nao participa desta conversa' });

      const msgs = await db.select({
        id: chatMessages.id,
        content: chatMessages.content,
        senderId: chatMessages.senderId,
        isRead: chatMessages.isRead,
        createdAt: chatMessages.createdAt,
      })
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, input.conversationId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(input.limit);

      // Marcar como lidas as mensagens do outro usuario
      await db.update(chatMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(chatMessages.conversationId, input.conversationId),
          eq(chatMessages.isRead, false),
          sql`${chatMessages.senderId} != ${userId}`
        ));

      return msgs.reverse();
    }),

  // Enviar mensagem
  send: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId!;
      const municipalityId = ctx.municipalityId || 1;

      // Buscar ou criar conversa
      let [conv] = await db.select().from(chatConversations)
        .where(or(
          and(eq(chatConversations.participant1Id, userId), eq(chatConversations.participant2Id, input.recipientId)),
          and(eq(chatConversations.participant1Id, input.recipientId), eq(chatConversations.participant2Id, userId))
        )).limit(1);

      if (!conv) {
        const [newConv] = await db.insert(chatConversations).values({
          municipalityId,
          participant1Id: userId,
          participant2Id: input.recipientId,
          lastMessageAt: new Date(),
        }).$returningId();
        [conv] = await db.select().from(chatConversations).where(eq(chatConversations.id, newConv.id)).limit(1);
      }

      // Inserir mensagem
      const [msg] = await db.insert(chatMessages).values({
        conversationId: conv.id,
        senderId: userId,
        content: input.content,
      }).$returningId();

      // Atualizar lastMessageAt da conversa
      await db.update(chatConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(chatConversations.id, conv.id));

      // Buscar nome do remetente para a notificacao
      const [sender] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);

      // Emitir via Socket.IO para o destinatario
      emitToUser(input.recipientId, 'chat:message', {
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
  unreadTotal: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.userId!;
      // Buscar conversas do usuario
      const convos = await db.select({ id: chatConversations.id })
        .from(chatConversations)
        .where(or(
          eq(chatConversations.participant1Id, userId),
          eq(chatConversations.participant2Id, userId)
        ));
      if (convos.length === 0) return { count: 0 };
      const convoIds = convos.map(c => c.id);
      const [result] = await db.select({ count: sql<number>`count(*)` })
        .from(chatMessages)
        .where(and(
          inArray(chatMessages.conversationId, convoIds),
          eq(chatMessages.isRead, false),
          sql`${chatMessages.senderId} != ${userId}`
        ));
      return { count: result?.count || 0 };
    }),

  // Buscar usuarios disponiveis para chat (staff da secretaria para pais, pais para staff)
  availableContacts: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId!;
      const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
      if (!currentUser) return [];

      // Pais veem staff (secretary, school_admin, municipal_admin)
      // Staff ve pais (parent)
      const targetRoles = currentUser.role === 'parent'
        ? ['secretary', 'school_admin', 'municipal_admin', 'super_admin']
        : ['parent'];

      const contacts = await db.select({
        id: users.id, name: users.name, role: users.role, avatarUrl: users.avatarUrl
      })
        .from(users)
        .where(and(
          eq(users.municipalityId, input.municipalityId),
          eq(users.isActive, true),
          inArray(users.role, targetRoles as any),
          sql`${users.id} != ${userId}`
        ))
        .orderBy(users.name)
        .limit(100);

      return contacts;
    }),

  // Marcar mensagens de uma conversa como lidas
  markRead: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId!;
      await db.update(chatMessages)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
          eq(chatMessages.conversationId, input.conversationId),
          eq(chatMessages.isRead, false),
          sql`${chatMessages.senderId} != ${userId}`
        ));
      return { success: true };
    }),
});

// ============================================
// GRADE HORÁRIA ROUTER
// ============================================
export const classSchedulesRouter = t.router({
  get: protectedProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input }) => {
      const [row] = await db.select().from(classSchedules)
        .where(eq(classSchedules.classId, input.classId))
        .limit(1);
      if (!row) return null;
      return { ...row, schedule: row.scheduleJson ? JSON.parse(row.scheduleJson) : {} };
    }),

  save: protectedProcedure
    .input(z.object({
      classId: z.number(),
      municipalityId: z.number(),
      schedule: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [existing] = await db.select().from(classSchedules)
        .where(eq(classSchedules.classId, input.classId))
        .limit(1);
      if (existing) {
        await db.update(classSchedules)
          .set({ scheduleJson: input.schedule })
          .where(eq(classSchedules.classId, input.classId));
      } else {
        await db.insert(classSchedules).values({
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
export const bulletinsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(bulletins)
        .where(eq(bulletins.municipalityId, input.municipalityId))
        .orderBy(desc(bulletins.pinned), desc(bulletins.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      municipalityId: z.number(),
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string().optional(),
      author: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [r] = await db.insert(bulletins).values(input).$returningId();
      return { success: true, id: r.id };
    }),

  togglePin: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [row] = await db.select().from(bulletins).where(eq(bulletins.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      await db.update(bulletins).set({ pinned: !row.pinned }).where(eq(bulletins.id, input.id));
      return { success: true, pinned: !row.pinned };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(bulletins).where(eq(bulletins.id, input.id));
      return { success: true };
    }),
});

// ============================================
// PROTOCOLOS ROUTER
// ============================================
export const protocolsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(protocols)
        .where(eq(protocols.municipalityId, input.municipalityId))
        .orderBy(desc(protocols.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      municipalityId: z.number(),
      requester: z.string().min(1),
      type: z.string().optional(),
      subject: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const year = new Date().getFullYear();
      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(protocols)
        .where(and(
          eq(protocols.municipalityId, input.municipalityId),
          gte(protocols.date, new Date(year, 0, 1)),
          lte(protocols.date, new Date(year, 11, 31, 23, 59, 59))
        ));
      const seq = Number(countResult?.count || 0) + 1;
      const number = String(seq).padStart(4, '0') + '/' + year;
      const [r] = await db.insert(protocols).values({ ...input, number }).$returningId();
      return { success: true, id: r.id, number };
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      await db.update(protocols).set({ status: input.status }).where(eq(protocols.id, input.id));
      return { success: true };
    }),

  addResponse: protectedProcedure
    .input(z.object({ id: z.number(), response: z.string() }))
    .mutation(async ({ input }) => {
      await db.update(protocols).set({ response: input.response, status: 'concluido' }).where(eq(protocols.id, input.id));
      return { success: true };
    }),
});

// ============================================
// BACKUP DE DADOS (JSON)
// ============================================
const backupRouter = t.router({
  // Estatísticas de registros por tabela
  stats: adminProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const mid = input.municipalityId;
      const countQuery = async (table: any) => {
        const result = await db.select({ count: sql<number>`count(*)` }).from(table).where(eq(table.municipalityId, mid));
        return Number(result[0]?.count || 0);
      };
      return {
        schools: await countQuery(schools),
        students: await countQuery(students),
        routes: await countQuery(routes),
        vehicles: await countQuery(vehicles),
        drivers: await countQuery(drivers),
        guardians: await db.select({ count: sql<number>`count(*)` }).from(guardians)
          .innerJoin(students, eq(guardians.studentId, students.id))
          .where(eq(students.municipalityId, mid))
          .then(r => Number(r[0]?.count || 0)),
        enrollments: await countQuery(enrollments),
        classes: await countQuery(classes),
        subjects: await countQuery(subjects),
        classGrades: await countQuery(classGrades),
        academicYears: await countQuery(academicYears),
        teachers: await countQuery(teachers),
        monitorStaff: await countQuery(monitorStaff),
        contracts: await countQuery(contracts),
        fuelRecords: await countQuery(fuelRecords),
        maintenanceRecords: await countQuery(maintenanceRecords),
        mealMenus: await countQuery(mealMenus),
        libraryBooks: await countQuery(libraryBooks),
        assets: await countQuery(assets),
        inventoryItems: await countQuery(inventoryItems),
        financialAccounts: await countQuery(financialAccounts),
        financialTransactions: await countQuery(financialTransactions),
        positions: await countQuery(positions),
        departments: await countQuery(departments),
        staffAllocations: await countQuery(staffAllocations),
        events: await countQuery(events),
        messages: await countQuery(messages),
        schoolCalendar: await countQuery(schoolCalendar),
        bulletins: await countQuery(bulletins),
        protocols: await countQuery(protocols),
        documents: await countQuery(documents),
        quotations: await countQuery(quotations),
        vehicleInspections: await countQuery(vehicleInspections),
      };
    }),

  // Exportar todos os dados do município como JSON
  exportAll: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      tables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const mid = input.municipalityId;
      const selectedTables = input.tables; // se undefined, exporta tudo

      const shouldExport = (name: string) => !selectedTables || selectedTables.includes(name);

      const q = async (table: any) => db.select().from(table).where(eq(table.municipalityId, mid));

      const data: Record<string, any> = {};

      // Município
      if (shouldExport('municipality')) {
        data.municipality = await db.select().from(municipalities).where(eq(municipalities.id, mid));
      }
      if (shouldExport('municipalityResponsibles')) {
        data.municipalityResponsibles = await db.select().from(municipalityResponsibles).where(eq(municipalityResponsibles.municipalityId, mid));
      }
      // Escolas e Ensino
      if (shouldExport('schools')) data.schools = await q(schools);
      if (shouldExport('students')) data.students = await q(students);
      // guardians não tem municipalityId - exportar via join com students
      if (shouldExport('guardians')) {
        data.guardians = await db.select().from(guardians)
          .innerJoin(students, eq(guardians.studentId, students.id))
          .where(eq(students.municipalityId, mid))
          .then(rows => rows.map(r => r.guardians));
      }
      if (shouldExport('enrollments')) data.enrollments = await q(enrollments);
      if (shouldExport('classes')) data.classes = await q(classes);
      if (shouldExport('classGrades')) data.classGrades = await q(classGrades);
      if (shouldExport('subjects')) data.subjects = await q(subjects);
      // classSubjects não tem municipalityId - exportar via join com classes
      if (shouldExport('classSubjects')) {
        data.classSubjects = await db.select().from(classSubjects)
          .innerJoin(classes, eq(classSubjects.classId, classes.id))
          .where(eq(classes.municipalityId, mid))
          .then(rows => rows.map(r => r.class_subjects));
      }
      if (shouldExport('academicYears')) data.academicYears = await q(academicYears);
      if (shouldExport('teachers')) data.teachers = await q(teachers);
      // dailyAttendance não tem municipalityId - via students
      if (shouldExport('dailyAttendance')) {
        data.dailyAttendance = await db.select().from(dailyAttendance)
          .innerJoin(students, eq(dailyAttendance.studentId, students.id))
          .where(eq(students.municipalityId, mid))
          .then(rows => rows.map(r => r.daily_attendance));
      }
      if (shouldExport('assessments')) data.assessments = await q(assessments);
      // studentGrades não tem municipalityId - via assessments
      if (shouldExport('studentGrades')) {
        data.studentGrades = await db.select().from(studentGrades)
          .innerJoin(assessments, eq(studentGrades.assessmentId, assessments.id))
          .where(eq(assessments.municipalityId, mid))
          .then(rows => rows.map(r => r.student_grades));
      }
      if (shouldExport('lessonPlans')) data.lessonPlans = await q(lessonPlans);
      if (shouldExport('descriptiveReports')) data.descriptiveReports = await q(descriptiveReports);
      if (shouldExport('classCouncilRecords')) data.classCouncilRecords = await q(classCouncilRecords);
      if (shouldExport('classSchedules')) data.classSchedules = await q(classSchedules);
      // Transporte
      if (shouldExport('routes')) data.routes = await q(routes);
      // stops não tem municipalityId - exportar via join com routes
      if (shouldExport('stops')) {
        data.stops = await db.select().from(stops)
          .innerJoin(routes, eq(stops.routeId, routes.id))
          .where(eq(routes.municipalityId, mid))
          .then(rows => rows.map(r => r.stops));
      }
      if (shouldExport('vehicles')) data.vehicles = await q(vehicles);
      if (shouldExport('drivers')) data.drivers = await q(drivers);
      if (shouldExport('monitorStaff')) data.monitorStaff = await q(monitorStaff);
      if (shouldExport('fuelRecords')) data.fuelRecords = await q(fuelRecords);
      if (shouldExport('maintenanceRecords')) data.maintenanceRecords = await q(maintenanceRecords);
      if (shouldExport('vehicleInspections')) data.vehicleInspections = await q(vehicleInspections);
      if (shouldExport('contracts')) data.contracts = await q(contracts);
      // RH
      if (shouldExport('positions')) data.positions = await q(positions);
      if (shouldExport('departments')) data.departments = await q(departments);
      if (shouldExport('staffAllocations')) data.staffAllocations = await q(staffAllocations);
      if (shouldExport('staffEvaluations')) data.staffEvaluations = await q(staffEvaluations);
      // Financeiro
      if (shouldExport('financialAccounts')) data.financialAccounts = await q(financialAccounts);
      if (shouldExport('financialTransactions')) data.financialTransactions = await q(financialTransactions);
      // Operacional
      if (shouldExport('mealMenus')) data.mealMenus = await q(mealMenus);
      if (shouldExport('libraryBooks')) data.libraryBooks = await q(libraryBooks);
      // libraryLoans não tem municipalityId - via libraryBooks
      if (shouldExport('libraryLoans')) {
        data.libraryLoans = await db.select().from(libraryLoans)
          .innerJoin(libraryBooks, eq(libraryLoans.bookId, libraryBooks.id))
          .where(eq(libraryBooks.municipalityId, mid))
          .then(rows => rows.map(r => r.library_loans));
      }
      if (shouldExport('assets')) data.assets = await q(assets);
      if (shouldExport('inventoryItems')) data.inventoryItems = await q(inventoryItems);
      // Comunicação e Documentos
      if (shouldExport('messages')) data.messages = await q(messages);
      if (shouldExport('events')) data.events = await q(events);
      if (shouldExport('documents')) data.documents = await q(documents);
      if (shouldExport('schoolCalendar')) data.schoolCalendar = await q(schoolCalendar);
      if (shouldExport('waitingList')) data.waitingList = await q(waitingList);
      // studentDocuments não tem municipalityId - via students
      if (shouldExport('studentDocuments')) {
        data.studentDocuments = await db.select().from(studentDocuments)
          .innerJoin(students, eq(studentDocuments.studentId, students.id))
          .where(eq(students.municipalityId, mid))
          .then(rows => rows.map(r => r.student_documents));
      }
      if (shouldExport('studentHistory')) data.studentHistory = await q(studentHistory);
      if (shouldExport('studentOccurrences')) data.studentOccurrences = await q(studentOccurrences);
      if (shouldExport('bulletins')) data.bulletins = await q(bulletins);
      if (shouldExport('protocols')) data.protocols = await q(protocols);
      if (shouldExport('quotations')) data.quotations = await q(quotations);
      // quotationItems não tem municipalityId - via quotations
      if (shouldExport('quotationItems')) {
        data.quotationItems = await db.select().from(quotationItems)
          .innerJoin(quotations, eq(quotationItems.quotationId, quotations.id))
          .where(eq(quotations.municipalityId, mid))
          .then(rows => rows.map(r => r.quotation_items));
      }
      if (shouldExport('formFieldConfigs')) data.formFieldConfigs = await q(formFieldConfigs);

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
export const appRouter = t.router({
  auth: authRouter,
  municipalities: municipalitiesRouter,
  schools: schoolsRouter,
  routes: routesRouter,
  stops: stopsRouter,
  students: studentsRouter,
  studentHistory: studentHistoryRouter,
  trips: tripsRouter,
  vehicles: vehiclesRouter,
  drivers: driversRouter,
  notifications: notificationsRouter,
  users: usersRouter,
  guardians: guardiansRouter,
  monitors: monitorsRouter,
  monitorStaff: monitorStaffRouter,
  contracts: contractsRouter,
  maintenance: maintenanceRouter,
  fuel: fuelRouter,
  location: locationRouter,

  // Módulo Acadêmico
  academicYears: academicYearsRouter,
  classGrades: classGradesRouter,
  subjects: subjectsRouter,
  classes: classesRouter,
  enrollments: enrollmentsRouter,
  teachers: teachersRouter,
  classSubjects: classSubjectsRouter,
  // Módulo Diário Escolar
  diaryAttendance: diaryAttendanceRouter,
  assessments: assessmentsRouter,
  studentGrades: studentGradesRouter,
  lessonPlans: lessonPlansRouter,
  // Módulo RH
  positions: positionsRouter,
  departments: departmentsRouter,
  staffAllocations: staffAllocationsRouter,
  staffEvaluations: staffEvaluationsRouter,
  // Módulo Financeiro
  financialAccounts: financialAccountsRouter,
  financialTransactions: financialTransactionsRouter,
  // Módulo Operacional
  mealMenus: mealMenusRouter,
  libraryBooks: libraryBooksRouter,
  libraryLoans: libraryLoansRouter,
  assets: assetsRouter,
  inventory: inventoryRouter,
  // Integrações (Fase 7)
  educacenso: educacensoRouter,
  transparency: transparencyRouter,
  // Funcionalidades Adicionais
  descriptiveReports: descriptiveReportsRouter,
  schoolCalendar: schoolCalendarRouter,
  messages: messagesRouter,
  waitingList: waitingListRouter,
  studentDocuments: studentDocumentsRouter,
  // Configuração de Formulários
  formConfig: formConfigRouter,
  // Novos Módulos
  studentOccurrences: studentOccurrencesRouter,
  events: eventsRouter,
  quotations: quotationsRouter,
  quotationItems: quotationItemsRouter,
  classCouncil: classCouncilRouter,
  vehicleInspections: vehicleInspectionsRouter,
  // Documentos e Assinaturas Eletrônicas
  documents: documentsRouter,
  documentSignatures: documentSignaturesRouter,
  // IA e Otimização
  ai: aiRouter,
  // Chat em tempo real
  chat: chatRouter,
  // Grade Horária, Mural e Protocolos
  classSchedules: classSchedulesRouter,
  bulletins: bulletinsRouter,
  protocols: protocolsRouter,
  // Backup de Dados
  backup: backupRouter,
});

export type AppRouter = typeof appRouter;
