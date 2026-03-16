import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from './db/index';
import { 
  municipalities, schools, users, vehicles, drivers, students, 
  guardians, routes, stops, stopStudents, trips, tripStopLogs,
  tripStudentLogs, notifications, locationHistory
} from './db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

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
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão' });
  }
  return next({ ctx });
});

// ============================================
// AUTH ROUTER
// ============================================
export const authRouter = t.router({
  // Registro de nova prefeitura
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
      // Verificar se email já existe
      const existingUser = await db.select().from(users).where(eq(users.email, input.adminEmail)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado' });
      }

      // Criar prefeitura
      const [municipality] = await db.insert(municipalities).values({
        name: input.municipalityName,
        state: input.state,
        city: input.city,
        cnpj: input.cnpj,
        email: input.adminEmail,
      }).$returningId();

      // Criar usuário admin
      const passwordHash = await hash(input.adminPassword, 12);
      const [user] = await db.insert(users).values({
        municipalityId: municipality.id,
        email: input.adminEmail,
        passwordHash,
        name: input.adminName,
        phone: input.adminPhone,
        role: 'municipal_admin',
      }).$returningId();

      return { 
        success: true, 
        municipalityId: municipality.id,
        userId: user.id,
        message: 'Prefeitura cadastrada com sucesso!' 
      };
    }),

  // Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas' });
      }

      const validPassword = await compare(input.password, user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas' });
      }

      // Atualizar último login
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

      // Gerar token JWT
      const token = sign(
        { userId: user.id, municipalityId: user.municipalityId, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          municipalityId: user.municipalityId,
        }
      };
    }),

  // Verificar token
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.userId!)).limit(1);
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' });
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      municipalityId: user.municipalityId,
    };
  }),
});

// ============================================
// MUNICIPALITIES ROUTER
// ============================================
export const municipalitiesRouter = t.router({
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
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

  // Dashboard stats
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

      // Viagens de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [todayTrips] = await db.select({ count: sql<number>`count(*)` })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(and(
          eq(routes.municipalityId, input.municipalityId),
          gte(trips.tripDate, today)
        ));

      // Viagens ativas agora
      const [activeTrips] = await db.select({ count: sql<number>`count(*)` })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(and(
          eq(routes.municipalityId, input.municipalityId),
          eq(trips.status, 'started')
        ));

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
        .where(eq(stops.routeId, input.id))
        .orderBy(stops.orderIndex);
      
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
      
      // Buscar alunos de cada parada
      const stopsWithStudents = await Promise.all(routeStops.map(async (stop) => {
        const stopStudentList = await db.select({
          id: students.id,
          name: students.name,
          photoUrl: students.photoUrl,
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
    .input(z.object({
      routeId: z.number(),
      stopIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      for (let i = 0; i < input.stopIds.length; i++) {
        await db.update(stops)
          .set({ orderIndex: i + 1 })
          .where(eq(stops.id, input.stopIds[i]));
      }
      return { success: true };
    }),
});

// ============================================
// STUDENTS ROUTER
// ============================================
export const studentsRouter = t.router({
  list: protectedProcedure
    .input(z.object({ 
      municipalityId: z.number(),
      schoolId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [
        eq(students.municipalityId, input.municipalityId),
        eq(students.isActive, true),
        ...(input.schoolId ? [eq(students.schoolId, input.schoolId)] : []),
      ];
      return db.select().from(students)
        .where(and(...conditions))
        .orderBy(students.name);
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
});

// ============================================
// TRIPS ROUTER (VIAGENS)
// ============================================
export const tripsRouter = t.router({
  // Listar viagens ativas (para dashboard do secretário)
  listActive: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      const activeTrips = await db.select({
        trip: trips,
        route: routes,
        driver: {
          id: drivers.id,
          userId: drivers.userId,
          currentLatitude: drivers.currentLatitude,
          currentLongitude: drivers.currentLongitude,
        },
        vehicle: vehicles,
      })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .innerJoin(drivers, eq(trips.driverId, drivers.id))
        .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
        .where(and(
          eq(routes.municipalityId, input.municipalityId),
          eq(trips.status, 'started')
        ))
        .orderBy(desc(trips.startedAt));

      // Buscar nome do motorista
      const tripsWithDriverName = await Promise.all(activeTrips.map(async (t) => {
        const [user] = await db.select({ name: users.name })
          .from(users).where(eq(users.id, t.driver.userId)).limit(1);
        return { ...t, driverName: user?.name };
      }));

      return tripsWithDriverName;
    }),

  // Iniciar viagem (motorista)
  start: protectedProcedure
    .input(z.object({
      routeId: z.number(),
      driverId: z.number(),
      vehicleId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const [route] = await db.select().from(routes).where(eq(routes.id, input.routeId)).limit(1);
      if (!route) throw new TRPCError({ code: 'NOT_FOUND', message: 'Rota não encontrada' });

      // Contar alunos esperados
      const stopList = await db.select().from(stops).where(eq(stops.routeId, input.routeId));
      let totalStudents = 0;
      for (const stop of stopList) {
        const [count] = await db.select({ count: sql<number>`count(*)` })
          .from(stopStudents).where(eq(stopStudents.stopId, stop.id));
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

      return { success: true, tripId: trip.id };
    }),

  // Marcar chegada em parada
  arriveAtStop: protectedProcedure
    .input(z.object({
      tripId: z.number(),
      stopId: z.number(),
      latitude: z.number(),
      longitude: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Registrar chegada
      await db.insert(tripStopLogs).values({
        tripId: input.tripId,
        stopId: input.stopId,
        arrivedAt: new Date(),
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
      });

      // Atualizar índice da parada atual
      const [trip] = await db.select().from(trips).where(eq(trips.id, input.tripId)).limit(1);
      if (trip) {
        await db.update(trips)
          .set({ currentStopIndex: (trip.currentStopIndex ?? 0) + 1 })
          .where(eq(trips.id, input.tripId));
      }

      // Enviar notificações para responsáveis
      const stopStudentList = await db.select({ studentId: stopStudents.studentId })
        .from(stopStudents).where(eq(stopStudents.stopId, input.stopId));
      
      for (const ss of stopStudentList) {
        const guardianList = await db.select({ userId: guardians.userId })
          .from(guardians).where(eq(guardians.studentId, ss.studentId));
        
        for (const g of guardianList) {
          await db.insert(notifications).values({
            userId: g.userId,
            title: 'Ônibus chegou!',
            body: 'O ônibus escolar chegou à parada.',
            type: 'arrived',
            tripId: input.tripId,
            stopId: input.stopId,
            studentId: ss.studentId,
          });
        }
      }

      return { success: true };
    }),

  // Finalizar viagem
  complete: protectedProcedure
    .input(z.object({ tripId: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(trips)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(trips.id, input.tripId));
      return { success: true };
    }),

  // Atualizar localização GPS
  updateLocation: protectedProcedure
    .input(z.object({
      tripId: z.number(),
      driverId: z.number(),
      latitude: z.number(),
      longitude: z.number(),
      speed: z.number().optional(),
      heading: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Salvar histórico
      await db.insert(locationHistory).values({
        tripId: input.tripId,
        driverId: input.driverId,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        speed: input.speed?.toString(),
        heading: input.heading,
      });

      // Atualizar posição atual do motorista
      await db.update(drivers)
        .set({
          currentLatitude: input.latitude.toString(),
          currentLongitude: input.longitude.toString(),
          lastLocationUpdate: new Date(),
        })
        .where(eq(drivers.id, input.driverId));

      return { success: true };
    }),

  // Histórico de viagens
  history: protectedProcedure
    .input(z.object({
      municipalityId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      let query = db.select({
        trip: trips,
        route: { id: routes.id, name: routes.name },
      })
        .from(trips)
        .innerJoin(routes, eq(trips.routeId, routes.id))
        .where(eq(routes.municipalityId, input.municipalityId))
        .orderBy(desc(trips.tripDate))
        .limit(input.limit);

      return query;
    }),
});

// ============================================
// VEHICLES ROUTER
// ============================================
export const vehiclesRouter = t.router({
  list: protectedProcedure
    .input(z.object({ municipalityId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(vehicles)
        .where(eq(vehicles.municipalityId, input.municipalityId))
        .orderBy(vehicles.nickname);
    }),

  create: adminProcedure
    .input(z.object({
      municipalityId: z.number(),
      plate: z.string(),
      nickname: z.string().optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      capacity: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [vehicle] = await db.insert(vehicles).values(input).$returningId();
      return { success: true, id: vehicle.id };
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
      municipalityId: z.number(),
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z.string().min(6),
      cnhNumber: z.string().optional(),
      cnhCategory: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Criar usuário
      const passwordHash = await hash(input.password, 12);
      const [user] = await db.insert(users).values({
        municipalityId: input.municipalityId,
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        role: 'driver',
      }).$returningId();

      // Criar motorista
      const [driver] = await db.insert(drivers).values({
        userId: user.id,
        municipalityId: input.municipalityId,
        cnhNumber: input.cnhNumber,
        cnhCategory: input.cnhCategory,
      }).$returningId();

      return { success: true, driverId: driver.id, userId: user.id };
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

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, input.id));
      return { success: true };
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.userId, ctx.userId!));
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
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        municipalityId: users.municipalityId,
        createdAt: users.createdAt,
      }).from(users)
        .where(eq(users.municipalityId, input.municipalityId));
    }),
  create: protectedProcedure
    .input(z.object({
      municipalityId: z.number(),
      name: z.string(),
      email: z.string().email(),
      role: z.string().default('operator'),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const [newUser] = await db.insert(users).values({
        municipalityId: input.municipalityId,
        name: input.name,
        email: input.email,
        role: input.role,
        password: hashedPassword,
      });
      return { success: true, id: newUser.insertId };
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      role: z.string().optional(),
      password: z.string().min(6).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, password, ...rest } = input;
      const updateData: any = { ...rest };
      if (password) {
        const bcrypt = await import('bcryptjs');
        updateData.password = await bcrypt.hash(password, 10);
      }
      await db.update(users).set(updateData).where(eq(users.id, id));
      return { success: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
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
});

  
