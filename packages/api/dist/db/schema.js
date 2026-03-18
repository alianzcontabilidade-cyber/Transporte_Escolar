"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripsRelations = exports.stopsRelations = exports.routesRelations = exports.studentsRelations = exports.driversRelations = exports.usersRelations = exports.schoolsRelations = exports.municipalitiesRelations = exports.maintenanceRecords = exports.contracts = exports.monitorStaff = exports.auditLogs = exports.systemSettings = exports.locationHistory = exports.notifications = exports.tripStudentLogs = exports.tripStopLogs = exports.trips = exports.stopStudents = exports.stops = exports.routes = exports.guardians = exports.students = exports.drivers = exports.vehicles = exports.users = exports.schools = exports.municipalities = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
// ============================================
// TABELA: PREFEITURAS / SECRETARIAS
// ============================================
exports.municipalities = (0, mysql_core_1.mysqlTable)("municipalities", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(), // Nome da Prefeitura
    state: (0, mysql_core_1.varchar)("state", { length: 2 }).notNull(), // UF (ex: SP, RJ)
    city: (0, mysql_core_1.varchar)("city", { length: 255 }).notNull(), // Cidade
    cnpj: (0, mysql_core_1.varchar)("cnpj", { length: 18 }).unique(), // CNPJ da prefeitura
    // Contato
    email: (0, mysql_core_1.varchar)("email", { length: 320 }).notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    address: (0, mysql_core_1.text)("address"),
    // Logo e identidade visual
    logoUrl: (0, mysql_core_1.text)("logoUrl"),
    primaryColor: (0, mysql_core_1.varchar)("primaryColor", { length: 7 }).default("#F5A623"),
    // Configurações
    maxRoutes: (0, mysql_core_1.int)("maxRoutes").default(50),
    maxDrivers: (0, mysql_core_1.int)("maxDrivers").default(100),
    maxStudents: (0, mysql_core_1.int)("maxStudents").default(5000),
    // Status
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    subscriptionPlan: (0, mysql_core_1.mysqlEnum)("subscriptionPlan", ["free", "basic", "premium", "enterprise"]).default("free").notNull(),
    subscriptionExpiresAt: (0, mysql_core_1.timestamp)("subscriptionExpiresAt"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: ESCOLAS
// ============================================
exports.schools = (0, mysql_core_1.mysqlTable)("schools", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    code: (0, mysql_core_1.varchar)("code", { length: 50 }), // Código INEP ou interno
    type: (0, mysql_core_1.mysqlEnum)("type", ["infantil", "fundamental", "medio", "tecnico", "especial"]).default("fundamental"),
    // Endereço
    address: (0, mysql_core_1.text)("address"),
    latitude: (0, mysql_core_1.decimal)("latitude", { precision: 10, scale: 8 }),
    longitude: (0, mysql_core_1.decimal)("longitude", { precision: 11, scale: 8 }),
    // Contato
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    email: (0, mysql_core_1.varchar)("email", { length: 320 }),
    directorName: (0, mysql_core_1.varchar)("directorName", { length: 255 }),
    // Horários de funcionamento
    morningStart: (0, mysql_core_1.varchar)("morningStart", { length: 5 }), // "07:00"
    morningEnd: (0, mysql_core_1.varchar)("morningEnd", { length: 5 }), // "12:00"
    afternoonStart: (0, mysql_core_1.varchar)("afternoonStart", { length: 5 }),
    afternoonEnd: (0, mysql_core_1.varchar)("afternoonEnd", { length: 5 }),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: USUÁRIOS
// ============================================
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    // Autenticação
    email: (0, mysql_core_1.varchar)("email", { length: 320 }).notNull().unique(),
    passwordHash: (0, mysql_core_1.varchar)("passwordHash", { length: 255 }),
    openId: (0, mysql_core_1.varchar)("openId", { length: 64 }).unique(), // OAuth
    // Perfil
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    cpf: (0, mysql_core_1.varchar)("cpf", { length: 14 }).unique(),
    avatarUrl: (0, mysql_core_1.text)("avatarUrl"),
    // Tipo de usuário
    role: (0, mysql_core_1.mysqlEnum)("role", [
        "super_admin", // Admin do sistema (Anthropic/Desenvolvedor)
        "municipal_admin", // Admin da Prefeitura
        "secretary", // Secretário de Educação
        "school_admin", // Diretor/Admin da escola
        "driver", // Motorista
        "monitor", // Monitor do ônibus
        "parent", // Responsável/Pai
    ]).default("parent").notNull(),
    // Status
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    emailVerified: (0, mysql_core_1.boolean)("emailVerified").default(false),
    lastLoginAt: (0, mysql_core_1.timestamp)("lastLoginAt"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: VEÍCULOS (ÔNIBUS)
// ============================================
exports.vehicles = (0, mysql_core_1.mysqlTable)("vehicles", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    // Identificação
    plate: (0, mysql_core_1.varchar)("plate", { length: 10 }).notNull(), // Placa
    nickname: (0, mysql_core_1.varchar)("nickname", { length: 100 }), // "Amarelinho 01"
    // Especificações
    brand: (0, mysql_core_1.varchar)("brand", { length: 100 }), // Marca
    model: (0, mysql_core_1.varchar)("model", { length: 100 }), // Modelo
    year: (0, mysql_core_1.int)("year"),
    capacity: (0, mysql_core_1.int)("capacity").default(40), // Capacidade de passageiros
    // Documentação
    renavam: (0, mysql_core_1.varchar)("renavam", { length: 20 }),
    chassi: (0, mysql_core_1.varchar)("chassi", { length: 20 }),
    // Status
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "maintenance", "inactive"]).default("active").notNull(),
    lastMaintenanceAt: (0, mysql_core_1.timestamp)("lastMaintenanceAt"),
    nextMaintenanceAt: (0, mysql_core_1.timestamp)("nextMaintenanceAt"),
    // GPS Device
    gpsDeviceId: (0, mysql_core_1.varchar)("gpsDeviceId", { length: 100 }),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: MOTORISTAS (extensão de users)
// ============================================
exports.drivers = (0, mysql_core_1.mysqlTable)("drivers", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)("userId").notNull().references(() => exports.users.id).unique(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    // CNH
    cnhNumber: (0, mysql_core_1.varchar)("cnhNumber", { length: 20 }),
    cnhCategory: (0, mysql_core_1.varchar)("cnhCategory", { length: 5 }), // D, E
    cnhExpiresAt: (0, mysql_core_1.timestamp)("cnhExpiresAt"),
    // Veículo atual atribuído
    vehicleId: (0, mysql_core_1.int)("vehicleId").references(() => exports.vehicles.id),
    // Status
    isAvailable: (0, mysql_core_1.boolean)("isAvailable").default(true),
    currentLatitude: (0, mysql_core_1.decimal)("currentLatitude", { precision: 10, scale: 8 }),
    currentLongitude: (0, mysql_core_1.decimal)("currentLongitude", { precision: 11, scale: 8 }),
    lastLocationUpdate: (0, mysql_core_1.timestamp)("lastLocationUpdate"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: ALUNOS
// ============================================
exports.students = (0, mysql_core_1.mysqlTable)("students", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").notNull().references(() => exports.schools.id),
    // Dados do aluno
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    birthDate: (0, mysql_core_1.timestamp)("birthDate"),
    grade: (0, mysql_core_1.varchar)("grade", { length: 50 }), // "5º Ano", "1ª Série"
    classRoom: (0, mysql_core_1.varchar)("classRoom", { length: 50 }), // "Turma A"
    enrollment: (0, mysql_core_1.varchar)("enrollment", { length: 50 }), // Matrícula
    // Turno
    shift: (0, mysql_core_1.mysqlEnum)("shift", ["morning", "afternoon", "evening"]).default("morning"),
    // Foto para identificação
    photoUrl: (0, mysql_core_1.text)("photoUrl"),
    // Necessidades especiais
    hasSpecialNeeds: (0, mysql_core_1.boolean)("hasSpecialNeeds").default(false),
    specialNeedsNotes: (0, mysql_core_1.text)("specialNeedsNotes"),
    // Endereço de embarque
    address: (0, mysql_core_1.text)("address"),
    latitude: (0, mysql_core_1.decimal)("latitude", { precision: 10, scale: 8 }),
    longitude: (0, mysql_core_1.decimal)("longitude", { precision: 11, scale: 8 }),
    // Status
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: RESPONSÁVEIS DOS ALUNOS
// ============================================
exports.guardians = (0, mysql_core_1.mysqlTable)("guardians", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)("userId").notNull().references(() => exports.users.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    relationship: (0, mysql_core_1.mysqlEnum)("relationship", ["father", "mother", "grandparent", "uncle", "other"]).default("other"),
    isPrimary: (0, mysql_core_1.boolean)("isPrimary").default(false), // Responsável principal
    canPickup: (0, mysql_core_1.boolean)("canPickup").default(true), // Autorizado a buscar
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// TABELA: ROTAS
// ============================================
exports.routes = (0, mysql_core_1.mysqlTable)("routes", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    // Identificação
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    code: (0, mysql_core_1.varchar)("code", { length: 50 }), // "RT-001"
    description: (0, mysql_core_1.text)("description"),
    // Configuração
    type: (0, mysql_core_1.mysqlEnum)("type", ["pickup", "dropoff", "both"]).default("both"), // Ida, Volta, Ambos
    shift: (0, mysql_core_1.mysqlEnum)("shift", ["morning", "afternoon", "evening"]).default("morning"),
    // Horários
    scheduledStartTime: (0, mysql_core_1.varchar)("scheduledStartTime", { length: 5 }), // "06:30"
    scheduledEndTime: (0, mysql_core_1.varchar)("scheduledEndTime", { length: 5 }), // "07:30"
    estimatedDuration: (0, mysql_core_1.int)("estimatedDuration"), // Em minutos
    // Veículo e motorista padrão
    defaultVehicleId: (0, mysql_core_1.int)("defaultVehicleId").references(() => exports.vehicles.id),
    defaultDriverId: (0, mysql_core_1.int)("defaultDriverId").references(() => exports.drivers.id),
    // Dias de operação (bitmask: 1=Seg, 2=Ter, 4=Qua, 8=Qui, 16=Sex, 32=Sab, 64=Dom)
    operatingDays: (0, mysql_core_1.int)("operatingDays").default(31), // Seg-Sex
    // Distância total
    totalDistanceKm: (0, mysql_core_1.decimal)("totalDistanceKm", { precision: 10, scale: 2 }),
    // Status
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: PARADAS
// ============================================
exports.stops = (0, mysql_core_1.mysqlTable)("stops", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    routeId: (0, mysql_core_1.int)("routeId").notNull().references(() => exports.routes.id),
    // Identificação
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    address: (0, mysql_core_1.text)("address"),
    reference: (0, mysql_core_1.text)("reference"), // Ponto de referência
    // Localização
    latitude: (0, mysql_core_1.decimal)("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: (0, mysql_core_1.decimal)("longitude", { precision: 11, scale: 8 }).notNull(),
    // Ordem na rota
    orderIndex: (0, mysql_core_1.int)("orderIndex").notNull(),
    // Tempo estimado
    estimatedArrivalMinutes: (0, mysql_core_1.int)("estimatedArrivalMinutes"), // Minutos após início
    waitTimeSeconds: (0, mysql_core_1.int)("waitTimeSeconds").default(60), // Tempo de espera
    // Raio de chegada (em metros)
    arrivalRadiusMeters: (0, mysql_core_1.int)("arrivalRadiusMeters").default(50),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: ALUNOS POR PARADA
// ============================================
exports.stopStudents = (0, mysql_core_1.mysqlTable)("stop_students", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    stopId: (0, mysql_core_1.int)("stopId").notNull().references(() => exports.stops.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    // Configuração
    boardingType: (0, mysql_core_1.mysqlEnum)("boardingType", ["pickup", "dropoff", "both"]).default("both"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// TABELA: VIAGENS (EXECUÇÕES DE ROTA)
// ============================================
exports.trips = (0, mysql_core_1.mysqlTable)("trips", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    routeId: (0, mysql_core_1.int)("routeId").notNull().references(() => exports.routes.id),
    driverId: (0, mysql_core_1.int)("driverId").notNull().references(() => exports.drivers.id),
    vehicleId: (0, mysql_core_1.int)("vehicleId").notNull().references(() => exports.vehicles.id),
    // Data e horários
    tripDate: (0, mysql_core_1.timestamp)("tripDate").notNull(),
    startedAt: (0, mysql_core_1.timestamp)("startedAt"),
    completedAt: (0, mysql_core_1.timestamp)("completedAt"),
    // Status
    status: (0, mysql_core_1.mysqlEnum)("status", [
        "scheduled", // Agendada
        "started", // Em andamento
        "completed", // Concluída
        "cancelled", // Cancelada
        "interrupted", // Interrompida
    ]).default("scheduled").notNull(),
    // Progresso
    currentStopIndex: (0, mysql_core_1.int)("currentStopIndex").default(0),
    // Métricas
    totalStudentsExpected: (0, mysql_core_1.int)("totalStudentsExpected").default(0),
    totalStudentsBoarded: (0, mysql_core_1.int)("totalStudentsBoarded").default(0),
    totalDistanceKm: (0, mysql_core_1.decimal)("totalDistanceKm", { precision: 10, scale: 2 }),
    // Observações
    notes: (0, mysql_core_1.text)("notes"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: LOG DE PARADAS (CHEGADAS)
// ============================================
exports.tripStopLogs = (0, mysql_core_1.mysqlTable)("trip_stop_logs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    tripId: (0, mysql_core_1.int)("tripId").notNull().references(() => exports.trips.id),
    stopId: (0, mysql_core_1.int)("stopId").notNull().references(() => exports.stops.id),
    // Horários
    arrivedAt: (0, mysql_core_1.timestamp)("arrivedAt").notNull(),
    departedAt: (0, mysql_core_1.timestamp)("departedAt"),
    // Localização real
    latitude: (0, mysql_core_1.decimal)("latitude", { precision: 10, scale: 8 }),
    longitude: (0, mysql_core_1.decimal)("longitude", { precision: 11, scale: 8 }),
    // Comparação com estimativa
    scheduledArrival: (0, mysql_core_1.timestamp)("scheduledArrival"),
    delayMinutes: (0, mysql_core_1.int)("delayMinutes").default(0),
    // Alunos
    studentsBoarded: (0, mysql_core_1.int)("studentsBoarded").default(0),
    studentsDropped: (0, mysql_core_1.int)("studentsDropped").default(0),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// TABELA: EMBARQUES/DESEMBARQUES DE ALUNOS
// ============================================
exports.tripStudentLogs = (0, mysql_core_1.mysqlTable)("trip_student_logs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    tripId: (0, mysql_core_1.int)("tripId").notNull().references(() => exports.trips.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    stopId: (0, mysql_core_1.int)("stopId").notNull().references(() => exports.stops.id),
    // Tipo de evento
    eventType: (0, mysql_core_1.mysqlEnum)("eventType", ["boarded", "dropped", "absent", "cancelled"]).notNull(),
    // Horário
    eventAt: (0, mysql_core_1.timestamp)("eventAt").notNull(),
    // Quem registrou (motorista ou monitor)
    registeredByUserId: (0, mysql_core_1.int)("registeredByUserId").references(() => exports.users.id),
    // Observações
    notes: (0, mysql_core_1.text)("notes"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// TABELA: NOTIFICAÇÕES
// ============================================
exports.notifications = (0, mysql_core_1.mysqlTable)("notifications", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)("userId").notNull().references(() => exports.users.id),
    // Conteúdo
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    body: (0, mysql_core_1.text)("body").notNull(),
    // Tipo
    type: (0, mysql_core_1.mysqlEnum)("type", [
        "trip_started", // Viagem iniciada
        "approaching", // Ônibus se aproximando
        "arrived", // Ônibus chegou
        "student_boarded", // Aluno embarcou
        "student_dropped", // Aluno desembarcou
        "trip_completed", // Viagem concluída
        "delay", // Atraso
        "alert", // Alerta geral
        "system", // Sistema
    ]).default("system").notNull(),
    // Referências
    tripId: (0, mysql_core_1.int)("tripId").references(() => exports.trips.id),
    stopId: (0, mysql_core_1.int)("stopId").references(() => exports.stops.id),
    studentId: (0, mysql_core_1.int)("studentId").references(() => exports.students.id),
    // Status
    isRead: (0, mysql_core_1.boolean)("isRead").default(false),
    readAt: (0, mysql_core_1.timestamp)("readAt"),
    // Push notification
    pushSent: (0, mysql_core_1.boolean)("pushSent").default(false),
    pushSentAt: (0, mysql_core_1.timestamp)("pushSentAt"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// TABELA: HISTÓRICO DE LOCALIZAÇÃO GPS
// ============================================
exports.locationHistory = (0, mysql_core_1.mysqlTable)("location_history", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    tripId: (0, mysql_core_1.int)("tripId").notNull().references(() => exports.trips.id),
    driverId: (0, mysql_core_1.int)("driverId").notNull().references(() => exports.drivers.id),
    latitude: (0, mysql_core_1.decimal)("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: (0, mysql_core_1.decimal)("longitude", { precision: 11, scale: 8 }).notNull(),
    speed: (0, mysql_core_1.decimal)("speed", { precision: 5, scale: 2 }), // km/h
    heading: (0, mysql_core_1.int)("heading"), // Direção em graus (0-360)
    accuracy: (0, mysql_core_1.int)("accuracy"), // Precisão em metros
    recordedAt: (0, mysql_core_1.timestamp)("recordedAt").defaultNow().notNull(),
});
// ============================================
// TABELA: CONFIGURAÇÕES DO SISTEMA
// ============================================
exports.systemSettings = (0, mysql_core_1.mysqlTable)("system_settings", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").references(() => exports.municipalities.id),
    key: (0, mysql_core_1.varchar)("key", { length: 100 }).notNull(),
    value: (0, mysql_core_1.text)("value"),
    description: (0, mysql_core_1.text)("description"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: LOGS DE AUDITORIA
// ============================================
exports.auditLogs = (0, mysql_core_1.mysqlTable)("audit_logs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)("userId").references(() => exports.users.id),
    municipalityId: (0, mysql_core_1.int)("municipalityId").references(() => exports.municipalities.id),
    action: (0, mysql_core_1.varchar)("action", { length: 100 }).notNull(), // "create", "update", "delete"
    entityType: (0, mysql_core_1.varchar)("entityType", { length: 100 }).notNull(), // "route", "student", etc.
    entityId: (0, mysql_core_1.int)("entityId"),
    oldData: (0, mysql_core_1.json)("oldData"),
    newData: (0, mysql_core_1.json)("newData"),
    ipAddress: (0, mysql_core_1.varchar)("ipAddress", { length: 45 }),
    userAgent: (0, mysql_core_1.text)("userAgent"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// TABELA: MONITORES (PESSOAL)
// ============================================
exports.monitorStaff = (0, mysql_core_1.mysqlTable)("monitor_staff", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    userId: (0, mysql_core_1.int)("userId").references(() => exports.users.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    cpf: (0, mysql_core_1.varchar)("cpf", { length: 14 }),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }),
    email: (0, mysql_core_1.varchar)("email", { length: 320 }),
    birthDate: (0, mysql_core_1.timestamp)("birthDate"),
    address: (0, mysql_core_1.text)("address"),
    city: (0, mysql_core_1.varchar)("city", { length: 255 }),
    shift: (0, mysql_core_1.mysqlEnum)("shift", ["morning", "afternoon", "evening", "full"]).default("morning"),
    routeName: (0, mysql_core_1.varchar)("routeName", { length: 255 }),
    observations: (0, mysql_core_1.text)("observations"),
    photoUrl: (0, mysql_core_1.text)("photoUrl"),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active").notNull(),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: CONTRATOS
// ============================================
exports.contracts = (0, mysql_core_1.mysqlTable)("contracts", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    number: (0, mysql_core_1.varchar)("number", { length: 50 }).notNull(),
    type: (0, mysql_core_1.varchar)("type", { length: 100 }).default("Transporte Escolar"),
    supplier: (0, mysql_core_1.varchar)("supplier", { length: 255 }).notNull(),
    cnpj: (0, mysql_core_1.varchar)("cnpj", { length: 18 }),
    object: (0, mysql_core_1.text)("object"),
    value: (0, mysql_core_1.decimal)("value", { precision: 12, scale: 2 }),
    startDate: (0, mysql_core_1.timestamp)("startDate"),
    endDate: (0, mysql_core_1.timestamp)("endDate"),
    responsibleName: (0, mysql_core_1.varchar)("responsibleName", { length: 255 }),
    responsiblePhone: (0, mysql_core_1.varchar)("responsiblePhone", { length: 20 }),
    notes: (0, mysql_core_1.text)("notes"),
    status: (0, mysql_core_1.mysqlEnum)("contractStatus", ["active", "expired", "pending", "cancelled"]).default("active"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: REGISTROS DE MANUTENÇÃO
// ============================================
exports.maintenanceRecords = (0, mysql_core_1.mysqlTable)("maintenance_records", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    vehicleId: (0, mysql_core_1.int)("vehicleId").notNull().references(() => exports.vehicles.id),
    componentName: (0, mysql_core_1.varchar)("componentName", { length: 255 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("maintenanceType", ["preventive", "corrective", "predictive"]).default("preventive"),
    description: (0, mysql_core_1.text)("description"),
    cost: (0, mysql_core_1.decimal)("cost", { precision: 10, scale: 2 }),
    kmAtMaintenance: (0, mysql_core_1.int)("kmAtMaintenance"),
    intervalKm: (0, mysql_core_1.int)("intervalKm"),
    performedAt: (0, mysql_core_1.timestamp)("performedAt"),
    nextDueAt: (0, mysql_core_1.timestamp)("nextDueAt"),
    nextDueKm: (0, mysql_core_1.int)("nextDueKm"),
    supplier: (0, mysql_core_1.varchar)("supplier", { length: 255 }),
    notes: (0, mysql_core_1.text)("notes"),
    status: (0, mysql_core_1.mysqlEnum)("maintenanceStatus", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// RELATIONS
// ============================================
exports.municipalitiesRelations = (0, drizzle_orm_1.relations)(exports.municipalities, ({ many }) => ({
    schools: many(exports.schools),
    users: many(exports.users),
    vehicles: many(exports.vehicles),
    drivers: many(exports.drivers),
    students: many(exports.students),
    routes: many(exports.routes),
}));
exports.schoolsRelations = (0, drizzle_orm_1.relations)(exports.schools, ({ one, many }) => ({
    municipality: one(exports.municipalities, {
        fields: [exports.schools.municipalityId],
        references: [exports.municipalities.id],
    }),
    students: many(exports.students),
    routes: many(exports.routes),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
    municipality: one(exports.municipalities, {
        fields: [exports.users.municipalityId],
        references: [exports.municipalities.id],
    }),
    school: one(exports.schools, {
        fields: [exports.users.schoolId],
        references: [exports.schools.id],
    }),
    driver: one(exports.drivers),
    guardians: many(exports.guardians),
    notifications: many(exports.notifications),
}));
exports.driversRelations = (0, drizzle_orm_1.relations)(exports.drivers, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.drivers.userId],
        references: [exports.users.id],
    }),
    municipality: one(exports.municipalities, {
        fields: [exports.drivers.municipalityId],
        references: [exports.municipalities.id],
    }),
    vehicle: one(exports.vehicles, {
        fields: [exports.drivers.vehicleId],
        references: [exports.vehicles.id],
    }),
    trips: many(exports.trips),
}));
exports.studentsRelations = (0, drizzle_orm_1.relations)(exports.students, ({ one, many }) => ({
    municipality: one(exports.municipalities, {
        fields: [exports.students.municipalityId],
        references: [exports.municipalities.id],
    }),
    school: one(exports.schools, {
        fields: [exports.students.schoolId],
        references: [exports.schools.id],
    }),
    guardians: many(exports.guardians),
    stopStudents: many(exports.stopStudents),
}));
exports.routesRelations = (0, drizzle_orm_1.relations)(exports.routes, ({ one, many }) => ({
    municipality: one(exports.municipalities, {
        fields: [exports.routes.municipalityId],
        references: [exports.municipalities.id],
    }),
    school: one(exports.schools, {
        fields: [exports.routes.schoolId],
        references: [exports.schools.id],
    }),
    defaultVehicle: one(exports.vehicles, {
        fields: [exports.routes.defaultVehicleId],
        references: [exports.vehicles.id],
    }),
    defaultDriver: one(exports.drivers, {
        fields: [exports.routes.defaultDriverId],
        references: [exports.drivers.id],
    }),
    stops: many(exports.stops),
    trips: many(exports.trips),
}));
exports.stopsRelations = (0, drizzle_orm_1.relations)(exports.stops, ({ one, many }) => ({
    route: one(exports.routes, {
        fields: [exports.stops.routeId],
        references: [exports.routes.id],
    }),
    stopStudents: many(exports.stopStudents),
}));
exports.tripsRelations = (0, drizzle_orm_1.relations)(exports.trips, ({ one, many }) => ({
    route: one(exports.routes, {
        fields: [exports.trips.routeId],
        references: [exports.routes.id],
    }),
    driver: one(exports.drivers, {
        fields: [exports.trips.driverId],
        references: [exports.drivers.id],
    }),
    vehicle: one(exports.vehicles, {
        fields: [exports.trips.vehicleId],
        references: [exports.vehicles.id],
    }),
    stopLogs: many(exports.tripStopLogs),
    studentLogs: many(exports.tripStudentLogs),
    locationHistory: many(exports.locationHistory),
}));
