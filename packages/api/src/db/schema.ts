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

  // Endereço completo
  cep: varchar("cep", { length: 9 }),
  logradouro: varchar("logradouro", { length: 255 }),
  numero: varchar("numero", { length: 10 }),
  complemento: varchar("complemento", { length: 100 }),
  bairro: varchar("bairro", { length: 100 }),
  fax: varchar("fax", { length: 20 }),
  website: varchar("website", { length: 255 }),

  // Prefeito(a)
  prefeitoName: varchar("prefeitoName", { length: 255 }),
  prefeitoCpf: varchar("prefeitoCpf", { length: 14 }),
  prefeitoCargo: varchar("prefeitoCargo", { length: 100 }),

  // Secretaria de Educação
  secretariaName: varchar("secretariaName", { length: 255 }),
  secretariaCnpj: varchar("secretariaCnpj", { length: 18 }),
  secretariaPhone: varchar("secretariaPhone", { length: 20 }),
  secretariaEmail: varchar("secretariaEmail", { length: 320 }),
  secretariaLogradouro: varchar("secretariaLogradouro", { length: 255 }),

  // Secretário(a) de Educação
  secretarioName: varchar("secretarioName", { length: 255 }),
  secretarioCpf: varchar("secretarioCpf", { length: 14 }),
  secretarioCargo: varchar("secretarioCargo", { length: 100 }),
  secretarioDecreto: varchar("secretarioDecreto", { length: 100 }),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: RESPONSÁVEIS DO MUNICÍPIO
// ============================================
export const municipalityResponsibles = mysqlTable("municipality_responsibles", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  decree: varchar("decree", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  
  // Documento
  cnpj: varchar("cnpj", { length: 18 }),

  // Endereço completo
  cep: varchar("cep", { length: 9 }),
  logradouro: varchar("logradouro", { length: 255 }),
  numero: varchar("numero", { length: 10 }),
  complemento: varchar("complemento", { length: 100 }),
  bairro: varchar("bairro", { length: 100 }),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 2 }),
  address: text("address"), // Endereço concatenado (legado)
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  // Contato
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  directorName: varchar("directorName", { length: 255 }),
  logoUrl: text("logoUrl"),

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
    "teacher",          // Professor
    "coordinator",      // Coordenador pedagógico
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
  gpsDeviceModel: varchar("gpsDeviceModel", { length: 100 }),

  observations: text("observations"),

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

  // Dados pessoais adicionais
  address: text("address"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 2 }),
  birthDate: timestamp("birthDate"),
  experience: int("experience"), // Anos de experiencia
  photo: text("photo"),
  observations: text("observations"),

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

  // Dados pessoais do aluno
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birthDate"),
  cpf: varchar("cpf", { length: 14 }),                          // CPF do aluno
  rg: varchar("rg", { length: 20 }),                            // RG
  rgOrgao: varchar("rgOrgao", { length: 20 }),                  // Orgao Expedidor (SSP, etc)
  rgUf: varchar("rgUf", { length: 2 }),                         // UF do RG
  rgDate: varchar("rgDate", { length: 10 }),                    // Data expedicao
  sex: varchar("sex", { length: 1 }),                           // M ou F
  race: varchar("race", { length: 20 }),                        // Branca, Negra, Parda, Amarela, Indigena, Nao Declarada
  nationality: varchar("nationality", { length: 50 }),          // Brasileira, etc
  naturalness: varchar("naturalness", { length: 100 }),         // Cidade de nascimento
  naturalnessUf: varchar("naturalnessUf", { length: 2 }),       // UF nascimento
  nis: varchar("nis", { length: 15 }),                          // NIS (Numero de Identificacao Social)
  cartaoSus: varchar("cartaoSus", { length: 20 }),              // Cartao SUS

  // Certidao de Nascimento
  certidaoTipo: varchar("certidaoTipo", { length: 20 }),        // nascimento, casamento
  certidaoNumero: varchar("certidaoNumero", { length: 50 }),    // Numero
  certidaoFolha: varchar("certidaoFolha", { length: 10 }),      // Folha
  certidaoLivro: varchar("certidaoLivro", { length: 10 }),      // Livro
  certidaoData: varchar("certidaoData", { length: 10 }),        // Data emissao
  certidaoCartorio: varchar("certidaoCartorio", { length: 255 }), // Cartorio

  // Academico
  grade: varchar("grade", { length: 50 }),          // "5º Ano", "1ª Série"
  classRoom: varchar("classRoom", { length: 50 }), // "Turma A"
  enrollment: varchar("enrollment", { length: 50 }), // Numero de Matricula
  shift: mysqlEnum("shift", ["morning", "afternoon", "evening"]).default("morning"),

  // Foto
  photoUrl: text("photoUrl"),

  // Endereco completo
  address: text("address"),                                      // Logradouro
  addressNumber: varchar("addressNumber", { length: 10 }),       // Numero
  addressComplement: varchar("addressComplement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),        // Bairro
  cep: varchar("cep", { length: 9 }),                            // CEP
  city: varchar("city", { length: 100 }),                        // Cidade
  state: varchar("state", { length: 2 }),                        // UF
  zone: varchar("zone", { length: 10 }),                         // urbana, rural
  phone: varchar("phone", { length: 20 }),                       // Telefone residencial
  cellPhone: varchar("cellPhone", { length: 20 }),               // Celular
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  // Transporte escolar
  needsTransport: boolean("needsTransport").default(false),
  transportType: varchar("transportType", { length: 50 }),       // Onibus, Van, Barco, etc
  transportDistance: varchar("transportDistance", { length: 10 }), // km

  // Programas sociais
  bolsaFamilia: boolean("bolsaFamilia").default(false),
  bpc: boolean("bpc").default(false),                             // Beneficio Prestacao Continuada
  peti: boolean("peti").default(false),                           // PETI
  otherPrograms: varchar("otherPrograms", { length: 255 }),       // Outros programas

  // Necessidades especiais / Deficiencia
  hasSpecialNeeds: boolean("hasSpecialNeeds").default(false),
  specialNeedsNotes: text("specialNeedsNotes"),
  deficiencyType: varchar("deficiencyType", { length: 255 }),    // Surdez, Auditiva, Mental, Fisica, Multipla, Cegueira, Baixa Visao
  tgd: varchar("tgd", { length: 255 }),                          // Psicose Infantil, Autismo, Asperger, Rett
  superdotacao: boolean("superdotacao").default(false),           // Altas Habilidades/Superdotacao
  salaRecursos: boolean("salaRecursos").default(false),           // Frequenta Sala de Recursos
  acompanhamento: varchar("acompanhamento", { length: 255 }),    // Psicologia, Fono, Psicopedagogia, Fisioterapia
  encaminhamento: varchar("encaminhamento", { length: 255 }),    // CAPS, CRAS, CREAS, etc

  // Saude
  bloodType: varchar("bloodType", { length: 5 }),
  allergies: text("allergies"),
  medications: text("medications"),
  healthNotes: text("healthNotes"),

  // Contatos de emergencia
  emergencyContact1Name: varchar("emergencyContact1Name", { length: 255 }),
  emergencyContact1Phone: varchar("emergencyContact1Phone", { length: 20 }),
  emergencyContact1Relation: varchar("emergencyContact1Relation", { length: 50 }),
  emergencyContact2Name: varchar("emergencyContact2Name", { length: 255 }),
  emergencyContact2Phone: varchar("emergencyContact2Phone", { length: 20 }),
  emergencyContact2Relation: varchar("emergencyContact2Relation", { length: 50 }),

  // Filiacao (dados diretos, sem precisar de users)
  fatherName: varchar("fatherName", { length: 255 }),
  fatherCpf: varchar("fatherCpf", { length: 14 }),
  fatherRg: varchar("fatherRg", { length: 20 }),
  fatherRgOrgao: varchar("fatherRgOrgao", { length: 20 }),
  fatherRgUf: varchar("fatherRgUf", { length: 2 }),
  fatherPhone: varchar("fatherPhone", { length: 20 }),
  fatherProfession: varchar("fatherProfession", { length: 100 }),
  fatherWorkplace: varchar("fatherWorkplace", { length: 255 }),
  fatherEducation: varchar("fatherEducation", { length: 50 }),   // Escolaridade
  fatherNaturalness: varchar("fatherNaturalness", { length: 50 }),
  fatherNaturalnessUf: varchar("fatherNaturalnessUf", { length: 2 }),

  motherName: varchar("motherName", { length: 255 }),
  motherCpf: varchar("motherCpf", { length: 14 }),
  motherRg: varchar("motherRg", { length: 20 }),
  motherRgOrgao: varchar("motherRgOrgao", { length: 20 }),
  motherRgUf: varchar("motherRgUf", { length: 2 }),
  motherPhone: varchar("motherPhone", { length: 20 }),
  motherProfession: varchar("motherProfession", { length: 100 }),
  motherWorkplace: varchar("motherWorkplace", { length: 255 }),
  motherEducation: varchar("motherEducation", { length: 50 }),
  motherNaturalness: varchar("motherNaturalness", { length: 50 }),
  motherNaturalnessUf: varchar("motherNaturalnessUf", { length: 2 }),

  familyIncome: varchar("familyIncome", { length: 50 }),          // Renda familiar

  // Procedencia / Situacao anterior
  previousSchool: varchar("previousSchool", { length: 255 }),     // Escola anterior
  previousSchoolType: varchar("previousSchoolType", { length: 30 }), // municipal, estadual, particular, federal
  previousSchoolZone: varchar("previousSchoolZone", { length: 10 }), // urbana, rural
  previousCity: varchar("previousCity", { length: 100 }),
  previousState: varchar("previousState", { length: 2 }),
  enrollmentType: varchar("enrollmentType", { length: 20 }),      // novato, renovacao, transferencia

  // Situacao do aluno na serie
  studentStatus: varchar("studentStatus", { length: 30 }),        // aprovado, reprovado, remanejado, transferido, abandono

  // Rota e observações
  routeName: varchar("routeName", { length: 255 }),               // Nome da rota vinculada
  observations: text("observations"),                              // Observações gerais

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
    "student_absent",   // Aluno ausente
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
// TABELA: REGISTROS DE ABASTECIMENTO
// ============================================
export const fuelRecords = mysqlTable("fuel_records", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id),
  driverId: int("driverId").references(() => drivers.id),

  // Dados do abastecimento
  fuelDate: timestamp("fuelDate").notNull(),
  fuelType: varchar("fuelType", { length: 50 }),          // Diesel, Gasolina, Etanol, GNV
  liters: decimal("liters", { precision: 10, scale: 2 }).notNull(),
  pricePerLiter: decimal("pricePerLiter", { precision: 10, scale: 3 }),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  kmAtFueling: int("kmAtFueling"),                        // Km no momento do abastecimento
  gasStation: varchar("gasStation", { length: 255 }),      // Posto
  invoiceNumber: varchar("invoiceNumber", { length: 50 }), // Nota fiscal
  notes: text("notes"),

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
// TABELA: ANOS LETIVOS
// ============================================
export const academicYears = mysqlTable("academic_years", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  year: int("year").notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("academicYearStatus", ["planning", "active", "finished"]).default("planning").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: SÉRIES / ETAPAS
// ============================================
export const classGrades = mysqlTable("class_grades", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  name: varchar("name", { length: 100 }).notNull(),
  level: mysqlEnum("gradeLevel", [
    "creche", "pre_escola", "fundamental_1", "fundamental_2", "medio", "eja", "tecnico"
  ]).notNull(),
  orderIndex: int("orderIndex").notNull().default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: TURMAS
// ============================================
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").notNull().references(() => schools.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  classGradeId: int("classGradeId").notNull().references(() => classGrades.id),
  name: varchar("name", { length: 50 }).notNull(),
  fullName: varchar("fullName", { length: 100 }),
  shift: mysqlEnum("classShift", ["morning", "afternoon", "evening", "full_time"]).default("morning").notNull(),
  maxStudents: int("maxStudents").default(30),
  roomNumber: varchar("roomNumber", { length: 20 }),
  teacherUserId: int("teacherUserId").references(() => users.id),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: DISCIPLINAS
// ============================================
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }),
  category: mysqlEnum("subjectCategory", [
    "base_nacional", "parte_diversificada", "eletiva"
  ]).default("base_nacional"),
  workloadHours: int("workloadHours"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: DISCIPLINAS POR TURMA
// ============================================
export const classSubjects = mysqlTable("class_subjects", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull().references(() => classes.id),
  subjectId: int("subjectId").notNull().references(() => subjects.id),
  teacherUserId: int("teacherUserId").references(() => users.id),
  weeklyHours: int("weeklyHours").default(2),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: MATRÍCULAS
// ============================================
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  studentId: int("studentId").notNull().references(() => students.id),
  classId: int("classId").notNull().references(() => classes.id),
  academicYearId: int("academicYearId").notNull().references(() => academicYears.id),
  enrollmentNumber: varchar("enrollmentNumber", { length: 50 }),
  enrollmentDate: timestamp("enrollmentDate").defaultNow().notNull(),
  status: mysqlEnum("enrollmentStatus", [
    "active", "transferred", "cancelled", "graduated", "retained", "evaded"
  ]).default("active").notNull(),
  statusChangedAt: timestamp("statusChangedAt"),
  statusNotes: text("statusNotes"),
  transferredFromSchoolId: int("transferredFromSchoolId").references(() => schools.id),
  transferredToSchoolId: int("transferredToSchoolId").references(() => schools.id),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: PROFESSORES (extensão de users)
// ============================================
export const teachers = mysqlTable("teachers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  registrationNumber: varchar("registrationNumber", { length: 50 }),
  degree: varchar("degree", { length: 100 }),
  specialization: varchar("specialization", { length: 255 }),
  hireDate: timestamp("hireDate"),
  contractType: mysqlEnum("teacherContractType", ["effective", "temporary", "substitute"]).default("effective"),
  weeklyWorkload: int("weeklyWorkload").default(40),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// ACADEMIC RELATIONS
// ============================================
export const academicYearsRelations = relations(academicYears, ({ many }) => ({
  classes: many(classes),
  enrollments: many(enrollments),
}));

export const classGradesRelations = relations(classGrades, ({ many }) => ({
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  municipality: one(municipalities, { fields: [classes.municipalityId], references: [municipalities.id] }),
  school: one(schools, { fields: [classes.schoolId], references: [schools.id] }),
  academicYear: one(academicYears, { fields: [classes.academicYearId], references: [academicYears.id] }),
  classGrade: one(classGrades, { fields: [classes.classGradeId], references: [classGrades.id] }),
  teacher: one(users, { fields: [classes.teacherUserId], references: [users.id] }),
  enrollments: many(enrollments),
  classSubjects: many(classSubjects),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  classSubjects: many(classSubjects),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, { fields: [classSubjects.classId], references: [classes.id] }),
  subject: one(subjects, { fields: [classSubjects.subjectId], references: [subjects.id] }),
  teacher: one(users, { fields: [classSubjects.teacherUserId], references: [users.id] }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  municipality: one(municipalities, { fields: [enrollments.municipalityId], references: [municipalities.id] }),
  student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
  class: one(classes, { fields: [enrollments.classId], references: [classes.id] }),
  academicYear: one(academicYears, { fields: [enrollments.academicYearId], references: [academicYears.id] }),
}));

export const teachersRelations = relations(teachers, ({ one }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  municipality: one(municipalities, { fields: [teachers.municipalityId], references: [municipalities.id] }),
}));

// ============================================
// FASE 3: DIÁRIO ESCOLAR DIGITAL
// ============================================

// Frequência diária
export const dailyAttendance = mysqlTable("daily_attendance", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull().references(() => classes.id),
  subjectId: int("subjectId").references(() => subjects.id),
  studentId: int("studentId").notNull().references(() => students.id),
  date: timestamp("date").notNull(),
  status: mysqlEnum("attendanceStatus", ["present", "absent", "justified", "late"]).default("present").notNull(),
  notes: text("notes"),
  registeredByUserId: int("registeredByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Avaliações / Provas
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  classId: int("classId").notNull().references(() => classes.id),
  subjectId: int("subjectId").notNull().references(() => subjects.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("assessmentType", ["prova", "trabalho", "seminario", "participacao", "recuperacao"]).default("prova").notNull(),
  maxScore: decimal("maxScore", { precision: 5, scale: 2 }).default("10.00").notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.00"),
  date: timestamp("date"),
  bimester: mysqlEnum("bimester", ["1", "2", "3", "4"]).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Notas dos alunos
export const studentGrades = mysqlTable("student_grades", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => assessments.id),
  studentId: int("studentId").notNull().references(() => students.id),
  score: decimal("score", { precision: 5, scale: 2 }),
  notes: text("notes"),
  registeredByUserId: int("registeredByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Planejamento de aulas
export const lessonPlans = mysqlTable("lesson_plans", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  classId: int("classId").notNull().references(() => classes.id),
  subjectId: int("subjectId").notNull().references(() => subjects.id),
  teacherUserId: int("teacherUserId").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  content: text("content"),
  methodology: text("methodology"),
  resources: text("resources"),
  bnccCode: varchar("bnccCode", { length: 20 }),
  bimester: mysqlEnum("lessonBimester", ["1", "2", "3", "4"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// FASE 4: RECURSOS HUMANOS
// ============================================

// Cargos
export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("positionCategory", ["docente", "administrativo", "operacional", "gestao"]).default("administrativo").notNull(),
  baseSalary: decimal("baseSalary", { precision: 10, scale: 2 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Departamentos / Setores
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  name: varchar("name", { length: 255 }).notNull(),
  headUserId: int("headUserId").references(() => users.id),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Lotações (Staff Allocations)
export const staffAllocations = mysqlTable("staff_allocations", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  userId: int("userId").notNull().references(() => users.id),
  schoolId: int("schoolId").references(() => schools.id),
  departmentId: int("departmentId").references(() => departments.id),
  positionId: int("positionId").references(() => positions.id),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  workload: int("workload").default(40),
  status: mysqlEnum("allocationStatus", ["active", "transferred", "ended"]).default("active").notNull(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Avaliações de desempenho
export const staffEvaluations = mysqlTable("staff_evaluations", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  userId: int("userId").notNull().references(() => users.id),
  evaluatorUserId: int("evaluatorUserId").references(() => users.id),
  period: varchar("period", { length: 50 }).notNull(),
  overallScore: decimal("overallScore", { precision: 4, scale: 2 }),
  punctuality: int("punctuality"),
  productivity: int("productivity"),
  teamwork: int("teamwork"),
  initiative: int("initiative"),
  communication: int("communication"),
  strengths: text("strengths"),
  improvements: text("improvements"),
  goals: text("goals"),
  status: mysqlEnum("evaluationStatus", ["draft", "submitted", "reviewed"]).default("draft").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// FASE 5: FINANCEIRO
// ============================================

export const financialAccounts = mysqlTable("financial_accounts", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("accountType", ["pdde", "proprio", "estadual", "federal", "outro"]).default("proprio").notNull(),
  bankName: varchar("bankName", { length: 100 }),
  agency: varchar("agency", { length: 20 }),
  accountNumber: varchar("accountNumber", { length: 30 }),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0.00"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const financialTransactions = mysqlTable("financial_transactions", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  accountId: int("accountId").notNull().references(() => financialAccounts.id),
  type: mysqlEnum("transactionType", ["receita", "despesa"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  documentNumber: varchar("documentNumber", { length: 50 }),
  supplier: varchar("supplier", { length: 255 }),
  status: mysqlEnum("transactionStatus", ["pending", "confirmed", "cancelled"]).default("confirmed").notNull(),
  registeredByUserId: int("registeredByUserId").references(() => users.id),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// FASE 6: OPERACIONAL
// ============================================

// Merenda Escolar - Cardápios
export const mealMenus = mysqlTable("meal_menus", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  date: timestamp("date").notNull(),
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "snack", "dinner"]).default("lunch").notNull(),
  description: text("description").notNull(),
  calories: int("calories"),
  servings: int("servings"),
  cost: decimal("cost", { precision: 8, scale: 2 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Biblioteca - Acervo
export const libraryBooks = mysqlTable("library_books", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }),
  isbn: varchar("isbn", { length: 20 }),
  category: varchar("category", { length: 100 }),
  publisher: varchar("publisher", { length: 255 }),
  year: int("year"),
  quantity: int("quantity").default(1),
  available: int("available").default(1),
  location: varchar("location", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Biblioteca - Empréstimos
export const libraryLoans = mysqlTable("library_loans", {
  id: int("id").autoincrement().primaryKey(),
  bookId: int("bookId").notNull().references(() => libraryBooks.id),
  userId: int("userId").notNull().references(() => users.id),
  studentId: int("studentId").references(() => students.id),
  loanDate: timestamp("loanDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate").notNull(),
  returnDate: timestamp("returnDate"),
  status: mysqlEnum("loanStatus", ["active", "returned", "overdue", "lost"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Patrimônio
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  category: mysqlEnum("assetCategory", ["movel", "imovel", "equipamento", "veiculo", "tecnologia", "outro"]).default("equipamento").notNull(),
  acquisitionDate: timestamp("acquisitionDate"),
  acquisitionValue: decimal("acquisitionValue", { precision: 12, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 12, scale: 2 }),
  location: varchar("location", { length: 255 }),
  condition: mysqlEnum("assetCondition", ["otimo", "bom", "regular", "ruim", "inservivel"]).default("bom"),
  responsibleUserId: int("responsibleUserId").references(() => users.id),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Estoque
export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 20 }).default("un"),
  currentStock: int("currentStock").default(0),
  minStock: int("minStock").default(5),
  maxStock: int("maxStock"),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  location: varchar("location", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inventoryMovements = mysqlTable("inventory_movements", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull().references(() => inventoryItems.id),
  type: mysqlEnum("movementType", ["entrada", "saida", "ajuste"]).notNull(),
  quantity: int("quantity").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  documentNumber: varchar("documentNumber", { length: 50 }),
  supplier: varchar("supplier", { length: 255 }),
  notes: text("notes"),
  registeredByUserId: int("registeredByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// FUNCIONALIDADES ADICIONAIS (baseado no GEP)
// ============================================

// Parecer Descritivo (texto livre por aluno por bimestre)
export const descriptiveReports = mysqlTable("descriptive_reports", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  studentId: int("studentId").notNull().references(() => students.id),
  classId: int("classId").notNull().references(() => classes.id),
  bimester: mysqlEnum("reportBimester", ["1", "2", "3", "4"]).notNull(),
  content: text("content"),
  teacherUserId: int("teacherUserId").references(() => users.id),
  status: mysqlEnum("reportStatus", ["draft", "published"]).default("draft").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Calendário Escolar (eventos, feriados, etc.)
export const schoolCalendar = mysqlTable("school_calendar", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  academicYearId: int("academicYearId").references(() => academicYears.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  eventType: mysqlEnum("calendarEventType", ["aula", "feriado", "recesso", "reuniao", "conselho", "prova", "evento", "outro"]).default("evento").notNull(),
  color: varchar("color", { length: 7 }).default("#2DB5B0"),
  allDay: boolean("allDay").default(true),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Documentos do Aluno (anexos)
export const studentDocuments = mysqlTable("student_documents", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("documentType", ["certidao_nascimento", "rg", "cpf", "comprovante_residencia", "historico_escolar", "laudo_medico", "foto", "outro"]).default("outro").notNull(),
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"),
  uploadedByUserId: int("uploadedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Recados / Comunicação
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").references(() => schools.id),
  senderUserId: int("senderUserId").notNull().references(() => users.id),
  targetType: mysqlEnum("messageTargetType", ["all", "school", "class", "student", "staff"]).default("all").notNull(),
  targetClassId: int("targetClassId").references(() => classes.id),
  targetStudentId: int("targetStudentId").references(() => students.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  priority: mysqlEnum("messagePriority", ["normal", "important", "urgent"]).default("normal").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Lista de Espera
export const waitingList = mysqlTable("waiting_list", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  schoolId: int("schoolId").notNull().references(() => schools.id),
  studentName: varchar("studentName", { length: 255 }).notNull(),
  birthDate: timestamp("birthDate"),
  guardianName: varchar("guardianName", { length: 255 }),
  guardianPhone: varchar("guardianPhone", { length: 20 }),
  guardianCpf: varchar("guardianCpf", { length: 14 }),
  gradeRequested: varchar("gradeRequested", { length: 100 }),
  shift: mysqlEnum("waitingShift", ["morning", "afternoon", "evening"]).default("morning"),
  position: int("position"),
  status: mysqlEnum("waitingStatus", ["waiting", "called", "enrolled", "cancelled"]).default("waiting").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

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

export type AcademicYear = typeof academicYears.$inferSelect;
export type ClassGrade = typeof classGrades.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type DailyAttendance = typeof dailyAttendance.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type StudentGrade = typeof studentGrades.$inferSelect;
export type LessonPlan = typeof lessonPlans.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type StaffAllocation = typeof staffAllocations.$inferSelect;
export type StaffEvaluation = typeof staffEvaluations.$inferSelect;
export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type MealMenu = typeof mealMenus.$inferSelect;
export type LibraryBook = typeof libraryBooks.$inferSelect;
export type LibraryLoan = typeof libraryLoans.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type DescriptiveReport = typeof descriptiveReports.$inferSelect;
export type SchoolCalendarEvent = typeof schoolCalendar.$inferSelect;
export type StudentDocument = typeof studentDocuments.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type WaitingListEntry = typeof waitingList.$inferSelect;

// ============================================
// TABELA: HISTÓRICO ESCOLAR ANTERIOR DO ALUNO
// ============================================
export const studentHistory = mysqlTable("student_history", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  studentId: int("studentId").notNull().references(() => students.id),
  year: int("year").notNull(),
  grade: varchar("grade", { length: 100 }).notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  schoolCity: varchar("schoolCity", { length: 100 }),
  schoolState: varchar("schoolState", { length: 2 }),
  schoolType: varchar("schoolType", { length: 30 }),
  result: varchar("result", { length: 50 }).notNull(),
  observations: text("observations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================
// TABELA: DOCUMENTOS GERADOS (Verificação + QR Code)
// ============================================
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  verificationCode: varchar("verificationCode", { length: 20 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  studentId: int("studentId").references(() => students.id),
  schoolId: int("schoolId").references(() => schools.id),
  generatedById: int("generatedById").notNull().references(() => users.id),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  pdfHash: varchar("pdfHash", { length: 64 }).notNull(),
  pdfSize: int("pdfSize"),
  status: mysqlEnum("docStatus", ["valid", "revoked", "expired"]).default("valid").notNull(),
  revokedAt: timestamp("revokedAt"),
  revokedById: int("revokedById"),
  revokedReason: text("revokedReason"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================
// TABELA: CONFIGURAÇÃO DE CAMPOS OBRIGATÓRIOS
// ============================================
export const formFieldConfigs = mysqlTable("form_field_configs", {
  id: int("id").autoincrement().primaryKey(),
  municipalityId: int("municipalityId").notNull().references(() => municipalities.id),
  formType: varchar("formType", { length: 50 }).notNull(), // student, school, driver, vehicle, route, teacher
  fieldName: varchar("fieldName", { length: 100 }).notNull(), // cpf, rg, fatherName, etc
  isRequired: boolean("isRequired").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormFieldConfig = typeof formFieldConfigs.$inferSelect;
