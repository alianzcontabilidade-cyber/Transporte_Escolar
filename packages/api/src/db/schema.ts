import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ============================================
// TABELA: PREFEITURAS / SECRETARIAS
// ============================================
export const municipalities = mysqlTable("municipalities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Nome da Prefeitura
  state: varchar("state", { length: 2 }).notNull(), // UF (ex: SP, RJ)
  city: varchar("city", { length: 255 }).notNull(), // Cidade
  cnpj: varchar("cnpj", { length: 18 }).unique(), // CNPJ da prefeitura
  
  // Contato
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  
  // Logo e identidade visual
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#F5A623"),
  
  // Configurações
  maxRoutes: int("maxRoutes").default(50),
  maxDrivers: int("maxDrivers").default(100),
  maxStudents: int("maxStudents").default(5000),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "basic", "premium", "enterprise"]).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: ESCOLAS
// ============================================
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }), // Código INEP ou interno
  type: mysqlEnum("type", ["infantil", "fundamental", "medio", "tecnico", "especial"]).default("fundamental"),
  
  // Endereço
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Contato
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  directorName: varchar("directorName", { length: 255 }),
  
  // Horários de funcionamento
  morningStart: varchar("morningStart", { length: 5 }), // "07:00"
  morningEnd: varchar("morningEnd", { length: 5 }),     // "12:00"
  afternoonStart: varchar("afternoonStart", { length: 5 }),
  afternoonEnd: varchar("afternoonEnd", { length: 5 }),
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: USUÁRIOS
// ============================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  
  // Autenticação
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  openId: varchar("openId", { length: 64 }).unique(), // OAuth
  
  // Perfil
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  avatarUrl: text("avatarUrl"),
  
  // Tipo de usuário
  role: mysqlEnum("role", [
    "super_admin",      // Admin do sistema (Anthropic/Desenvolvedor)
    "municipal_admin",  // Admin da Prefeitura
    "secretary",        // Secretário de Educação
    "school_admin",     // Diretor/Admin da escola
    "driver",           // Motorista
    "monitor",          // Monitor do ônibus
    "parent",           // Responsável/Pai
  ]).default("parent").notNull(),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  emailVerified: boolean("emailVerified").default(false),
  lastLoginAt: timestamp("lastLoginAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: VEÍCULOS (ÔNIBUS)
// ============================================
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  
  // Identificação
  plate: varchar("plate", { length: 10 }).notNull(), // Placa
  nickname: varchar("nickname", { length: 100 }),   // "Amarelinho 01"
  
  // Especificações
  brand: varchar("brand", { length: 100 }),         // Marca
  model: varchar("model", { length: 100 }),         // Modelo
  year: int("year"),
  capacity: int("capacity").default(40),            // Capacidade de passageiros
  
  // Documentação
  renavam: varchar("renavam", { length: 20 }),
  chassi: varchar("chassi", { length: 20 }),
  color: varchar("color", { length: 50 }),                         // Cor
  fuelType: varchar("fuelType", { length: 50 }),                   // Tipo combustível

  // Seguro
  insuranceCompany: varchar("insuranceCompany", { length: 255 }), // Seguradora
  insurancePolicy: varchar("insurancePolicy", { length: 100 }),   // Número da apólice
  insuranceExpiry: timestamp("insuranceExpiry"),                    // Vencimento seguro

  // Documentação - Vencimentos
  crlvExpiry: timestamp("crlvExpiry"),                              // Vencimento CRLV
  ipvaExpiry: timestamp("ipvaExpiry"),                              // Vencimento IPVA
  inspectionExpiry: timestamp("inspectionExpiry"),                  // Vencimento vistoria técnica
  fireExtinguisherExpiry: timestamp("fireExtinguisherExpiry"),      // Vencimento extintor

  // Quilometragem
  currentKm: int("currentKm"),                                     // Quilometragem atual

  // Status
  status: mysqlEnum("status", ["active", "maintenance", "inactive"]).default("active").notNull(),
  lastMaintenanceAt: timestamp("lastMaintenanceAt"),
  nextMaintenanceAt: timestamp("nextMaintenanceAt"),
  
  // GPS Device
  gpsDeviceId: varchar("gpsDeviceId", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: MOTORISTAS (extensão de users)
// ============================================
export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  
  // CNH
  cnhNumber: varchar("cnhNumber", { length: 20 }),
  cnhCategory: varchar("cnhCategory", { length: 5 }), // D, E
  cnhExpiresAt: timestamp("cnhExpiresAt"),
  
  // Veículo atual atribuído
  vehicleId: int("vehicleId").references(() => vehicles.id),
  
  // Status
  isAvailable: boolean("isAvailable").default(true),
  currentLatitude: decimal("currentLatitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("currentLongitude", { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp("lastLocationUpdate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: ALUNOS
// ============================================
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").notNull().references(() => schools.id),
  
  // Dados do aluno
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birthDate"),
  grade: varchar("grade", { length: 50 }),          // "5º Ano", "1ª Série"
  classRoom: varchar("classRoom", { length: 50 }), // "Turma A"
  enrollment: varchar("enrollment", { length: 50 }), // Matrícula
  
  // Turno
  shift: mysqlEnum("shift", ["morning", "afternoon", "evening"]).default("morning"),
  
  // Foto para identificação
  photoUrl: text("photoUrl"),
  
  // Necessidades especiais
  hasSpecialNeeds: boolean("hasSpecialNeeds").default(false),
  specialNeedsNotes: text("specialNeedsNotes"),

  // Saúde
  bloodType: varchar("bloodType", { length: 5 }),              // Tipo sanguíneo (A+, A-, B+, B-, AB+, AB-, O+, O-)
  allergies: text("allergies"),                                 // Alergias
  medications: text("medications"),                             // Medicamentos em uso
  healthNotes: text("healthNotes"),                             // Observações de saúde

  // Contatos de emergência
  emergencyContact1Name: varchar("emergencyContact1Name", { length: 255 }),
  emergencyContact1Phone: varchar("emergencyContact1Phone", { length: 20 }),
  emergencyContact1Relation: varchar("emergencyContact1Relation", { length: 50 }),
  emergencyContact2Name: varchar("emergencyContact2Name", { length: 255 }),
  emergencyContact2Phone: varchar("emergencyContact2Phone", { length: 20 }),
  emergencyContact2Relation: varchar("emergencyContact2Relation", { length: 50 }),

  // Endereço de embarque
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: RESPONSÁVEIS DOS ALUNOS
// ============================================
export const guardians = mysqlTable("guardians", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  studentId: int("studentId").notNull().references(() => students.id),
  
  relationship: mysqlEnum("relationship", ["father", "mother", "grandparent", "uncle", "other"]).default("other"),
  isPrimary: boolean("isPrimary").default(false), // Responsável principal
  canPickup: boolean("canPickup").default(true),  // Autorizado a buscar
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// TABELA: ROTAS
// ============================================
export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  
  // Identificação
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),           // "RT-001"
  description: text("description"),
  
  // Configuração
  type: mysqlEnum("type", ["pickup", "dropoff", "both"]).default("both"), // Ida, Volta, Ambos
  shift: mysqlEnum("shift", ["morning", "afternoon", "evening"]).default("morning"),
  
  // Horários
  scheduledStartTime: varchar("scheduledStartTime", { length: 5 }), // "06:30"
  scheduledEndTime: varchar("scheduledEndTime", { length: 5 }),     // "07:30"
  estimatedDuration: int("estimatedDuration"),                       // Em minutos
  
  // Veículo e motorista padrão
  defaultVehicleId: int("defaultVehicleId").references(() => vehicles.id),
  defaultDriverId: int("defaultDriverId").references(() => drivers.id),
  
  // Dias de operação (bitmask: 1=Seg, 2=Ter, 4=Qua, 8=Qui, 16=Sex, 32=Sab, 64=Dom)
  operatingDays: int("operatingDays").default(31), // Seg-Sex
  
  // Distância total
  totalDistanceKm: decimal("totalDistanceKm", { precision: 10, scale: 2 }),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: PARADAS
// ============================================
export const stops = mysqlTable("stops", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull().references(() => routes.id),
  
  // Identificação
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  reference: text("reference"), // Ponto de referência
  
  // Localização
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  
  // Ordem na rota
  orderIndex: int("orderIndex").notNull(),
  
  // Tempo estimado
  estimatedArrivalMinutes: int("estimatedArrivalMinutes"), // Minutos após início
  waitTimeSeconds: int("waitTimeSeconds").default(60),     // Tempo de espera
  
  // Raio de chegada (em metros)
  arrivalRadiusMeters: int("arrivalRadiusMeters").default(50),
  
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: ALUNOS POR PARADA
// ============================================
export const stopStudents = mysqlTable("stop_students", {
  id: int("id").autoincrement().primaryKey(),
  stopId: int("stopId").notNull().references(() => stops.id),
  studentId: int("studentId").notNull().references(() => students.id),
  
  // Configuração
  boardingType: mysqlEnum("boardingType", ["pickup", "dropoff", "both"]).default("both"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// TABELA: VIAGENS (EXECUÇÕES DE ROTA)
// ============================================
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull().references(() => routes.id),
  driverId: int("driverId").notNull().references(() => drivers.id),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id),
  
  // Data e horários
  tripDate: timestamp("tripDate").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  // Status
  status: mysqlEnum("status", [
    "scheduled",   // Agendada
    "started",     // Em andamento
    "completed",   // Concluída
    "cancelled",   // Cancelada
    "interrupted", // Interrompida
  ]).default("scheduled").notNull(),
  
  // Progresso
  currentStopIndex: int("currentStopIndex").default(0),
  
  // Métricas
  totalStudentsExpected: int("totalStudentsExpected").default(0),
  totalStudentsBoarded: int("totalStudentsBoarded").default(0),
  totalDistanceKm: decimal("totalDistanceKm", { precision: 10, scale: 2 }),
  
  // Observações
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: LOG DE PARADAS (CHEGADAS)
// ============================================
export const tripStopLogs = mysqlTable("trip_stop_logs", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull().references(() => trips.id),
  stopId: int("stopId").notNull().references(() => stops.id),
  
  // Horários
  arrivedAt: timestamp("arrivedAt").notNull(),
  departedAt: timestamp("departedAt"),
  
  // Localização real
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Comparação com estimativa
  scheduledArrival: timestamp("scheduledArrival"),
  delayMinutes: int("delayMinutes").default(0),
  
  // Alunos
  studentsBoarded: int("studentsBoarded").default(0),
  studentsDropped: int("studentsDropped").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// TABELA: EMBARQUES/DESEMBARQUES DE ALUNOS
// ============================================
export const tripStudentLogs = mysqlTable("trip_student_logs", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull().references(() => trips.id),
  studentId: int("studentId").notNull().references(() => students.id),
  stopId: int("stopId").notNull().references(() => stops.id),
  
  // Tipo de evento
  eventType: mysqlEnum("eventType", ["boarded", "dropped", "absent", "cancelled"]).notNull(),
  
  // Horário
  eventAt: timestamp("eventAt").notNull(),
  
  // Quem registrou (motorista ou monitor)
  registeredByUserId: int("registeredByUserId").references(() => users.id),
  
  // Observações
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// TABELA: NOTIFICAÇÕES
// ============================================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Conteúdo
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  
  // Tipo
  type: mysqlEnum("type", [
    "trip_started",     // Viagem iniciada
    "approaching",      // Ônibus se aproximando
    "arrived",          // Ônibus chegou
    "student_boarded",  // Aluno embarcou
    "student_dropped",  // Aluno desembarcou
    "trip_completed",   // Viagem concluída
    "delay",            // Atraso
    "alert",            // Alerta geral
    "system",           // Sistema
  ]).default("system").notNull(),
  
  // Referências
  tripId: int("tripId").references(() => trips.id),
  stopId: int("stopId").references(() => stops.id),
  studentId: int("studentId").references(() => students.id),
  
  // Status
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  
  // Push notification
  pushSent: boolean("pushSent").default(false),
  pushSentAt: timestamp("pushSentAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// TABELA: HISTÓRICO DE LOCALIZAÇÃO GPS
// ============================================
export const locationHistory = mysqlTable("location_history", {
  id: int("id").autoincrement().primaryKey(),
  tripId: int("tripId").notNull().references(() => trips.id),
  driverId: int("driverId").notNull().references(() => drivers.id),
  
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }), // km/h
  heading: int("heading"), // Direção em graus (0-360)
  accuracy: int("accuracy"), // Precisão em metros
  
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

// ============================================
// TABELA: CONFIGURAÇÕES DO SISTEMA
// ============================================
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").references(() => municipalities.id),
  
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value"),
  description: text("description"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: LOGS DE AUDITORIA
// ============================================
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  municipalityId: int("municipalityId").references(() => municipalities.id),
  
  action: varchar("action", { length: 100 }).notNull(), // "create", "update", "delete"
  entityType: varchar("entityType", { length: 100 }).notNull(), // "route", "student", etc.
  entityId: int("entityId"),
  
  oldData: json("oldData"),
  newData: json("newData"),
  
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


// ============================================
// TABELA: MONITORES (PESSOAL)
// ============================================
export const monitorStaff = mysqlTable("monitor_staff", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  birthDate: timestamp("birthDate"),
  address: text("address"),
  city: varchar("city", { length: 255 }),
  shift: mysqlEnum("shift", ["morning", "afternoon", "evening", "full"]).default("morning"),
  routeName: varchar("routeName", { length: 255 }),
  observations: text("observations"),
  photoUrl: text("photoUrl"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: CONTRATOS
// ============================================
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  number: varchar("number", { length: 50 }).notNull(),
  type: varchar("type", { length: 100 }).default("Transporte Escolar"),
  supplier: varchar("supplier", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  object: text("object"),
  value: decimal("value", { precision: 12, scale: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  responsibleName: varchar("responsibleName", { length: 255 }),
  responsiblePhone: varchar("responsiblePhone", { length: 20 }),
  notes: text("notes"),
  status: mysqlEnum("contractStatus", ["active", "expired", "pending", "cancelled"]).default("active"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: REGISTROS DE MANUTENÇÃO
// ============================================
export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id),
  componentName: varchar("componentName", { length: 255 }).notNull(),
  type: mysqlEnum("maintenanceType", ["preventive", "corrective", "predictive"]).default("preventive"),
  description: text("description"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  kmAtMaintenance: int("kmAtMaintenance"),
  intervalKm: int("intervalKm"),
  performedAt: timestamp("performedAt"),
  nextDueAt: timestamp("nextDueAt"),
  nextDueKm: int("nextDueKm"),
  supplier: varchar("supplier", { length: 255 }),
  notes: text("notes"),
  status: mysqlEnum("maintenanceStatus", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const municipalitiesRelations = relations(municipalities, ({ many }) => ({
  schools: many(schools),
  users: many(users),
  vehicles: many(vehicles),
  drivers: many(drivers),
  students: many(students),
  routes: many(routes),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [schools.municipalityId],
    references: [municipalities.id],
  }),
  students: many(students),
  routes: many(routes),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [users.municipalityId],
    references: [municipalities.id],
  }),
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  driver: one(drivers),
  guardians: many(guardians),
  notifications: many(notifications),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  municipality: one(municipalities, {
    fields: [drivers.municipalityId],
    references: [municipalities.id],
  }),
  vehicle: one(vehicles, {
    fields: [drivers.vehicleId],
    references: [vehicles.id],
  }),
  trips: many(trips),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [students.municipalityId],
    references: [municipalities.id],
  }),
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  guardians: many(guardians),
  stopStudents: many(stopStudents),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  municipality: one(municipalities, {
    fields: [routes.municipalityId],
    references: [municipalities.id],
  }),
  school: one(schools, {
    fields: [routes.schoolId],
    references: [schools.id],
  }),
  defaultVehicle: one(vehicles, {
    fields: [routes.defaultVehicleId],
    references: [vehicles.id],
  }),
  defaultDriver: one(drivers, {
    fields: [routes.defaultDriverId],
    references: [drivers.id],
  }),
  stops: many(stops),
  trips: many(trips),
}));

export const stopsRelations = relations(stops, ({ one, many }) => ({
  route: one(routes, {
    fields: [stops.routeId],
    references: [routes.id],
  }),
  stopStudents: many(stopStudents),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  route: one(routes, {
    fields: [trips.routeId],
    references: [routes.id],
  }),
  driver: one(drivers, {
    fields: [trips.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  stopLogs: many(tripStopLogs),
  studentLogs: many(tripStudentLogs),
  locationHistory: many(locationHistory),
}));

// ============================================
// TYPES EXPORTADOS
// ============================================

export type Municipality = typeof municipalities.$inferSelect;
export type InsertMunicipality = typeof municipalities.$inferInsert;

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

export type Guardian = typeof guardians.$inferSelect;
export type InsertGuardian = typeof guardians.$inferInsert;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

export type Stop = typeof stops.$inferSelect;
export type InsertStop = typeof stops.$inferInsert;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

export type TripStopLog = typeof tripStopLogs.$inferSelect;
export type TripStudentLog = typeof tripStudentLogs.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type MonitorStaff = typeof monitorStaff.$inferSelect;
export type InsertMonitorStaff = typeof monitorStaff.$inferInsert;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

export type LocationHistory = typeof locationHistory.$inferSelect;
