import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from './db/index';
import {
  municipalities, schools, users, vehicles, drivers, students,
  guardians, routes, stops, stopStudents, trips, tripStopLogs,
  tripStudentLogs, notifications, locationHistory,
    monitorStaff, contracts, maintenanceRecords
} from './db/schema';
import { eq, and, or, desc, gte, lte, sql, inArray, like } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { emitToMunicipality } from './socketInstance';

// ============================================
// VALIDAÇÃO DE CPF E CNPJ
// ============================================
function validateCPF(cpf: string): boolean {
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

function validateCNPJ(cnpj: string): boolean {
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

function validateOptionalCPF(cpf?: string): void {
  if (!cpf) return;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length > 0 && digits.length !== 11) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF incompleto.' });
  }
  if (digits.length === 11 && !validateCPF(digits)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CPF inválido.' });
  }
}

function validateOptionalCNPJ(cnpj?: string): void {
  if (!cnpj) return;
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length > 0 && digits.length !== 14) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CNPJ incompleto.' });
  }
  if (digits.length === 14 && !validateCNPJ(digits)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'CNPJ inválido.' });
  }
}

const t = initTRPC.context<{ userId?: number; municipalityId?: number; role?: string }>().create();

const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Não autenticado' });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['super_admin', 'municipal_admin', 'secretary'].includes(ctx.role || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão de administrador' });
  }
  return next({ ctx });
});

const staffProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor'].includes(ctx.role || '')) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão' });
  }
  return next({ ctx });
});

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
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado' });
      }
      const [student] = await db.select().from(students)
        .where(eq(students.enrollment, input.studentEnrollment)).limit(1);
      if (!student) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Matrícula do aluno não encontrada. Verifique com a escola.' });
      }
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

      await db.insert(guardians).values({
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
        process.env.JWT_SECRET || 'transescolar-secret-2024',
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
        process.env.JWT_SECRET || 'transescolar-secret-2024',
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
        decoded = verify(input.resetToken, process.env.JWT_SECRET || 'transescolar-secret-2024');
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
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(municipalities).set(data).where(eq(municipalities.id, id));
      return { success: true };
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
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      directorName: z.string().optional(),
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
      name: z.string().optional(),
      code: z.string().optional(),
      type: z.enum(['infantil', 'fundamental', 'medio', 'tecnico', 'especial']).optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      directorName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.update(schools).set(data).where(eq(schools.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
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
      return db.select().from(routes)
        .where(and(eq(routes.municipalityId, input.municipalityId), eq(routes.isActive, true)))
        .orderBy(routes.name);
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
    }))
    .mutation(async ({ input }) => {
      const [route] = await db.insert(routes).values(input).$returningId();
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
});

// ============================================
// STUDENTS ROUTER
// ============================================
export const studentsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number(), schoolId: z.number().optional() }))
    .query(async ({ input }) => {
      const conditions = [
        eq(students.municipalityId, input.municipalityId),
        eq(students.isActive, true),
        ...(input.schoolId ? [eq(students.schoolId, input.schoolId)] : []),
      ];
      return db.select().from(students).where(and(...conditions)).orderBy(students.name);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      schoolId: z.number(),
      name: z.string().min(2),
      birthDate: z.string().optional(),
      grade: z.string().optional(),
      classRoom: z.string().optional(),
      enrollment: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening']).optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      hasSpecialNeeds: z.boolean().optional(),
      specialNeedsNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { latitude, longitude, birthDate, ...rest } = input;
      const [student] = await db.insert(students).values({
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        ...(latitude !== undefined && { latitude: latitude.toString() }),
        ...(longitude !== undefined && { longitude: longitude.toString() }),
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
      name: z.string().optional(),
      grade: z.string().optional(),
      classRoom: z.string().optional(),
      shift: z.enum(['morning', 'afternoon', 'evening']).optional(),
      address: z.string().optional(),
      hasSpecialNeeds: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; });
      if (Object.keys(ud).length > 0) await db.update(students).set(ud).where(eq(students.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(students).set({ isActive: false }).where(eq(students.id, input.id));
      return { success: true };
    }),
});

// ============================================
// TRIPS ROUTER
// ============================================
export const tripsRouter = t.router({
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
    }))
    .mutation(async ({ input }) => {
      const [vehicle] = await db.insert(vehicles).values(input).$returningId();
      return { success: true, id: vehicle.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      plate: z.string().optional(),
      nickname: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      capacity: z.number().optional(),
      status: z.enum(['active', 'maintenance', 'inactive']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; });
      if (Object.keys(ud).length > 0) await db.update(vehicles).set(ud).where(eq(vehicles.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(vehicles).where(eq(vehicles.id, input.id));
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
      return db.select({
        driver: drivers,
        user: { id: users.id, name: users.name, email: users.email, phone: users.phone },
      })
      .from(drivers)
      .innerJoin(users, eq(drivers.userId, users.id))
      .where(eq(drivers.municipalityId, input.municipalityId));
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(), name: z.string(), email: z.string().email(),
      phone: z.string().optional(), password: z.string().min(6),
      cnhNumber: z.string().optional(), cnhCategory: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const passwordHash = await hash(input.password, 12);
      const [user] = await db.insert(users).values({
        municipalityId: input.municipalityId, email: input.email, passwordHash,
        name: input.name, phone: input.phone, role: 'driver',
      }).$returningId();

      const [driver] = await db.insert(drivers).values({
        userId: user.id, municipalityId: input.municipalityId,
        cnhNumber: input.cnhNumber, cnhCategory: input.cnhCategory,
      }).$returningId();
      return { success: true, driverId: driver.id, userId: user.id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      cnhNumber: z.string().optional(),
      cnhCategory: z.string().optional(),
      vehicleId: z.number().optional(),
      isAvailable: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const ud: any = {};
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) ud[k] = v; });
      if (Object.keys(ud).length > 0) await db.update(drivers).set(ud).where(eq(drivers.id, id));
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [driver] = await db.select().from(drivers).where(eq(drivers.id, input.id)).limit(1);
      if (driver) {
        await db.delete(drivers).where(eq(drivers.id, input.id));
        await db.delete(users).where(eq(users.id, driver.userId));
      }
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
      await db.delete(users).where(eq(users.id, input.id));
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
          driverLocation: driver ? { lat: parseFloat(driver.currentLatitude as any || '0'), lng: parseFloat(driver.currentLongitude as any || '0'), updatedAt: driver.lastLocationUpdate } : null,
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
});

// ============================================
// MONITORS ROUTER (APP MONITORES)
// ============================================
export const monitorsRouter = t.router({
  // Obter viagem ativa do monitor/motorista
  myActiveTrip: protectedProcedure.query(async ({ ctx }) => {
    // Buscar se é motorista
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, ctx.userId!)).limit(1);
    if (!driver) return null;

    const [activeTrip] = await db.select().from(trips)
      .where(and(eq(trips.driverId, driver.id), eq(trips.status, 'started'))).limit(1);
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
      return { success: true };
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
      // Get all active trips with their latest locations
      const activeTrips = await db.select({
        tripId: trips.id,
        routeId: trips.routeId,
        vehicleId: trips.vehicleId,
        driverId: trips.driverId,
        status: trips.status,
      }).from(trips)
        .where(eq(trips.status, 'started'));

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
// MAIN ROUTER
// ============================================
export const appRouter = t.router({
  auth: authRouter,
  municipalities: municipalitiesRouter,
  schools: schoolsRouter,
  routes: routesRouter,
  stops: stopsRouter,
  students: studentsRouter,
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
    location: locationRouter,

    // TEMPORARY RESET ENDPOINT - DELETE AFTER USE
    resetData: t.router({
          execute: adminProcedure
            .input(z.object({ confirmReset: z.literal('RESET_ALL_DATA') }))
            .mutation(async ({ input, ctx }) => {
                      if (ctx.role !== 'super_admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas super_admin' });
                      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
                      await db.delete(tripStudentLogs);
                      await db.delete(tripStopLogs);
                      await db.delete(trips);
                      await db.delete(locationHistory);
                      await db.delete(notifications);
                      await db.delete(stopStudents);
                      await db.delete(stops);
                      await db.delete(routes);
                      await db.delete(students);
                      await db.delete(guardians);
                      await db.delete(drivers);
                      await db.delete(vehicles);
                      await db.delete(schools);
                      await db.delete(users).where(sql`id != 1`);
                      await db.delete(municipalities);
                      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
                      return { success: true, message: 'Todos os dados foram resetados. Apenas o admin id=1 foi mantido.' };
            }),
    }),
});

export type AppRouter = typeof appRouter;
