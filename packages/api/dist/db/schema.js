"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departments = exports.positions = exports.lessonPlans = exports.studentGrades = exports.assessments = exports.dailyAttendance = exports.teachersRelations = exports.enrollmentsRelations = exports.classSubjectsRelations = exports.subjectsRelations = exports.classesRelations = exports.classGradesRelations = exports.academicYearsRelations = exports.teachers = exports.enrollments = exports.classSubjects = exports.subjects = exports.classes = exports.classGrades = exports.academicYears = exports.tripsRelations = exports.stopsRelations = exports.routesRelations = exports.studentsRelations = exports.driversRelations = exports.usersRelations = exports.schoolsRelations = exports.municipalitiesRelations = exports.maintenanceRecords = exports.fuelRecords = exports.contracts = exports.monitorStaff = exports.auditLogs = exports.systemSettings = exports.locationHistory = exports.notifications = exports.tripStudentLogs = exports.tripStopLogs = exports.trips = exports.stopStudents = exports.stops = exports.routes = exports.guardians = exports.students = exports.drivers = exports.vehicles = exports.users = exports.schools = exports.municipalityResponsibles = exports.municipalities = void 0;
exports.formFieldConfigs = exports.documents = exports.studentHistory = exports.waitingList = exports.messages = exports.studentDocuments = exports.schoolCalendar = exports.descriptiveReports = exports.inventoryMovements = exports.inventoryItems = exports.assets = exports.libraryLoans = exports.libraryBooks = exports.mealMenus = exports.financialTransactions = exports.financialAccounts = exports.staffEvaluations = exports.staffAllocations = void 0;
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
    // Endereço completo
    cep: (0, mysql_core_1.varchar)("cep", { length: 9 }),
    logradouro: (0, mysql_core_1.varchar)("logradouro", { length: 255 }),
    numero: (0, mysql_core_1.varchar)("numero", { length: 10 }),
    complemento: (0, mysql_core_1.varchar)("complemento", { length: 100 }),
    bairro: (0, mysql_core_1.varchar)("bairro", { length: 100 }),
    fax: (0, mysql_core_1.varchar)("fax", { length: 20 }),
    website: (0, mysql_core_1.varchar)("website", { length: 255 }),
    // Prefeito(a)
    prefeitoName: (0, mysql_core_1.varchar)("prefeitoName", { length: 255 }),
    prefeitoCpf: (0, mysql_core_1.varchar)("prefeitoCpf", { length: 14 }),
    prefeitoCargo: (0, mysql_core_1.varchar)("prefeitoCargo", { length: 100 }),
    // Secretaria de Educação
    secretariaName: (0, mysql_core_1.varchar)("secretariaName", { length: 255 }),
    secretariaCnpj: (0, mysql_core_1.varchar)("secretariaCnpj", { length: 18 }),
    secretariaPhone: (0, mysql_core_1.varchar)("secretariaPhone", { length: 20 }),
    secretariaEmail: (0, mysql_core_1.varchar)("secretariaEmail", { length: 320 }),
    secretariaLogradouro: (0, mysql_core_1.varchar)("secretariaLogradouro", { length: 255 }),
    // Secretário(a) de Educação
    secretarioName: (0, mysql_core_1.varchar)("secretarioName", { length: 255 }),
    secretarioCpf: (0, mysql_core_1.varchar)("secretarioCpf", { length: 14 }),
    secretarioCargo: (0, mysql_core_1.varchar)("secretarioCargo", { length: 100 }),
    secretarioDecreto: (0, mysql_core_1.varchar)("secretarioDecreto", { length: 100 }),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: RESPONSÁVEIS DO MUNICÍPIO
// ============================================
exports.municipalityResponsibles = (0, mysql_core_1.mysqlTable)("municipality_responsibles", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    role: (0, mysql_core_1.varchar)("role", { length: 100 }).notNull(),
    cpf: (0, mysql_core_1.varchar)("cpf", { length: 14 }),
    decree: (0, mysql_core_1.varchar)("decree", { length: 100 }),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
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
        "teacher", // Professor
        "coordinator", // Coordenador pedagógico
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
    color: (0, mysql_core_1.varchar)("color", { length: 50 }), // Cor
    fuelType: (0, mysql_core_1.varchar)("fuelType", { length: 50 }), // Tipo combustível
    // Seguro
    insuranceCompany: (0, mysql_core_1.varchar)("insuranceCompany", { length: 255 }), // Seguradora
    insurancePolicy: (0, mysql_core_1.varchar)("insurancePolicy", { length: 100 }), // Número da apólice
    insuranceExpiry: (0, mysql_core_1.timestamp)("insuranceExpiry"), // Vencimento seguro
    // Documentação - Vencimentos
    crlvExpiry: (0, mysql_core_1.timestamp)("crlvExpiry"), // Vencimento CRLV
    ipvaExpiry: (0, mysql_core_1.timestamp)("ipvaExpiry"), // Vencimento IPVA
    inspectionExpiry: (0, mysql_core_1.timestamp)("inspectionExpiry"), // Vencimento vistoria técnica
    fireExtinguisherExpiry: (0, mysql_core_1.timestamp)("fireExtinguisherExpiry"), // Vencimento extintor
    // Quilometragem
    currentKm: (0, mysql_core_1.int)("currentKm"), // Quilometragem atual
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
    // Dados pessoais do aluno
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    birthDate: (0, mysql_core_1.timestamp)("birthDate"),
    cpf: (0, mysql_core_1.varchar)("cpf", { length: 14 }), // CPF do aluno
    rg: (0, mysql_core_1.varchar)("rg", { length: 20 }), // RG
    rgOrgao: (0, mysql_core_1.varchar)("rgOrgao", { length: 20 }), // Orgao Expedidor (SSP, etc)
    rgUf: (0, mysql_core_1.varchar)("rgUf", { length: 2 }), // UF do RG
    rgDate: (0, mysql_core_1.varchar)("rgDate", { length: 10 }), // Data expedicao
    sex: (0, mysql_core_1.varchar)("sex", { length: 1 }), // M ou F
    race: (0, mysql_core_1.varchar)("race", { length: 20 }), // Branca, Negra, Parda, Amarela, Indigena, Nao Declarada
    nationality: (0, mysql_core_1.varchar)("nationality", { length: 50 }), // Brasileira, etc
    naturalness: (0, mysql_core_1.varchar)("naturalness", { length: 100 }), // Cidade de nascimento
    naturalnessUf: (0, mysql_core_1.varchar)("naturalnessUf", { length: 2 }), // UF nascimento
    nis: (0, mysql_core_1.varchar)("nis", { length: 15 }), // NIS (Numero de Identificacao Social)
    cartaoSus: (0, mysql_core_1.varchar)("cartaoSus", { length: 20 }), // Cartao SUS
    // Certidao de Nascimento
    certidaoTipo: (0, mysql_core_1.varchar)("certidaoTipo", { length: 20 }), // nascimento, casamento
    certidaoNumero: (0, mysql_core_1.varchar)("certidaoNumero", { length: 50 }), // Numero
    certidaoFolha: (0, mysql_core_1.varchar)("certidaoFolha", { length: 10 }), // Folha
    certidaoLivro: (0, mysql_core_1.varchar)("certidaoLivro", { length: 10 }), // Livro
    certidaoData: (0, mysql_core_1.varchar)("certidaoData", { length: 10 }), // Data emissao
    certidaoCartorio: (0, mysql_core_1.varchar)("certidaoCartorio", { length: 255 }), // Cartorio
    // Academico
    grade: (0, mysql_core_1.varchar)("grade", { length: 50 }), // "5º Ano", "1ª Série"
    classRoom: (0, mysql_core_1.varchar)("classRoom", { length: 50 }), // "Turma A"
    enrollment: (0, mysql_core_1.varchar)("enrollment", { length: 50 }), // Numero de Matricula
    shift: (0, mysql_core_1.mysqlEnum)("shift", ["morning", "afternoon", "evening"]).default("morning"),
    // Foto
    photoUrl: (0, mysql_core_1.text)("photoUrl"),
    // Endereco completo
    address: (0, mysql_core_1.text)("address"), // Logradouro
    addressNumber: (0, mysql_core_1.varchar)("addressNumber", { length: 10 }), // Numero
    addressComplement: (0, mysql_core_1.varchar)("addressComplement", { length: 100 }),
    neighborhood: (0, mysql_core_1.varchar)("neighborhood", { length: 100 }), // Bairro
    cep: (0, mysql_core_1.varchar)("cep", { length: 9 }), // CEP
    city: (0, mysql_core_1.varchar)("city", { length: 100 }), // Cidade
    state: (0, mysql_core_1.varchar)("state", { length: 2 }), // UF
    zone: (0, mysql_core_1.varchar)("zone", { length: 10 }), // urbana, rural
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }), // Telefone residencial
    cellPhone: (0, mysql_core_1.varchar)("cellPhone", { length: 20 }), // Celular
    latitude: (0, mysql_core_1.decimal)("latitude", { precision: 10, scale: 8 }),
    longitude: (0, mysql_core_1.decimal)("longitude", { precision: 11, scale: 8 }),
    // Transporte escolar
    needsTransport: (0, mysql_core_1.boolean)("needsTransport").default(false),
    transportType: (0, mysql_core_1.varchar)("transportType", { length: 50 }), // Onibus, Van, Barco, etc
    transportDistance: (0, mysql_core_1.varchar)("transportDistance", { length: 10 }), // km
    // Programas sociais
    bolsaFamilia: (0, mysql_core_1.boolean)("bolsaFamilia").default(false),
    bpc: (0, mysql_core_1.boolean)("bpc").default(false), // Beneficio Prestacao Continuada
    peti: (0, mysql_core_1.boolean)("peti").default(false), // PETI
    otherPrograms: (0, mysql_core_1.varchar)("otherPrograms", { length: 255 }), // Outros programas
    // Necessidades especiais / Deficiencia
    hasSpecialNeeds: (0, mysql_core_1.boolean)("hasSpecialNeeds").default(false),
    specialNeedsNotes: (0, mysql_core_1.text)("specialNeedsNotes"),
    deficiencyType: (0, mysql_core_1.varchar)("deficiencyType", { length: 255 }), // Surdez, Auditiva, Mental, Fisica, Multipla, Cegueira, Baixa Visao
    tgd: (0, mysql_core_1.varchar)("tgd", { length: 255 }), // Psicose Infantil, Autismo, Asperger, Rett
    superdotacao: (0, mysql_core_1.boolean)("superdotacao").default(false), // Altas Habilidades/Superdotacao
    salaRecursos: (0, mysql_core_1.boolean)("salaRecursos").default(false), // Frequenta Sala de Recursos
    acompanhamento: (0, mysql_core_1.varchar)("acompanhamento", { length: 255 }), // Psicologia, Fono, Psicopedagogia, Fisioterapia
    encaminhamento: (0, mysql_core_1.varchar)("encaminhamento", { length: 255 }), // CAPS, CRAS, CREAS, etc
    // Saude
    bloodType: (0, mysql_core_1.varchar)("bloodType", { length: 5 }),
    allergies: (0, mysql_core_1.text)("allergies"),
    medications: (0, mysql_core_1.text)("medications"),
    healthNotes: (0, mysql_core_1.text)("healthNotes"),
    // Contatos de emergencia
    emergencyContact1Name: (0, mysql_core_1.varchar)("emergencyContact1Name", { length: 255 }),
    emergencyContact1Phone: (0, mysql_core_1.varchar)("emergencyContact1Phone", { length: 20 }),
    emergencyContact1Relation: (0, mysql_core_1.varchar)("emergencyContact1Relation", { length: 50 }),
    emergencyContact2Name: (0, mysql_core_1.varchar)("emergencyContact2Name", { length: 255 }),
    emergencyContact2Phone: (0, mysql_core_1.varchar)("emergencyContact2Phone", { length: 20 }),
    emergencyContact2Relation: (0, mysql_core_1.varchar)("emergencyContact2Relation", { length: 50 }),
    // Filiacao (dados diretos, sem precisar de users)
    fatherName: (0, mysql_core_1.varchar)("fatherName", { length: 255 }),
    fatherCpf: (0, mysql_core_1.varchar)("fatherCpf", { length: 14 }),
    fatherRg: (0, mysql_core_1.varchar)("fatherRg", { length: 20 }),
    fatherPhone: (0, mysql_core_1.varchar)("fatherPhone", { length: 20 }),
    fatherProfession: (0, mysql_core_1.varchar)("fatherProfession", { length: 100 }),
    fatherWorkplace: (0, mysql_core_1.varchar)("fatherWorkplace", { length: 255 }),
    fatherEducation: (0, mysql_core_1.varchar)("fatherEducation", { length: 50 }), // Escolaridade
    fatherNaturalness: (0, mysql_core_1.varchar)("fatherNaturalness", { length: 50 }),
    fatherNaturalnessUf: (0, mysql_core_1.varchar)("fatherNaturalnessUf", { length: 2 }),
    motherName: (0, mysql_core_1.varchar)("motherName", { length: 255 }),
    motherCpf: (0, mysql_core_1.varchar)("motherCpf", { length: 14 }),
    motherRg: (0, mysql_core_1.varchar)("motherRg", { length: 20 }),
    motherPhone: (0, mysql_core_1.varchar)("motherPhone", { length: 20 }),
    motherProfession: (0, mysql_core_1.varchar)("motherProfession", { length: 100 }),
    motherWorkplace: (0, mysql_core_1.varchar)("motherWorkplace", { length: 255 }),
    motherEducation: (0, mysql_core_1.varchar)("motherEducation", { length: 50 }),
    motherNaturalness: (0, mysql_core_1.varchar)("motherNaturalness", { length: 50 }),
    motherNaturalnessUf: (0, mysql_core_1.varchar)("motherNaturalnessUf", { length: 2 }),
    familyIncome: (0, mysql_core_1.varchar)("familyIncome", { length: 50 }), // Renda familiar
    // Procedencia / Situacao anterior
    previousSchool: (0, mysql_core_1.varchar)("previousSchool", { length: 255 }), // Escola anterior
    previousSchoolType: (0, mysql_core_1.varchar)("previousSchoolType", { length: 30 }), // municipal, estadual, particular, federal
    previousSchoolZone: (0, mysql_core_1.varchar)("previousSchoolZone", { length: 10 }), // urbana, rural
    previousCity: (0, mysql_core_1.varchar)("previousCity", { length: 100 }),
    previousState: (0, mysql_core_1.varchar)("previousState", { length: 2 }),
    enrollmentType: (0, mysql_core_1.varchar)("enrollmentType", { length: 20 }), // novato, renovacao, transferencia
    // Situacao do aluno na serie
    studentStatus: (0, mysql_core_1.varchar)("studentStatus", { length: 30 }), // aprovado, reprovado, remanejado, transferido, abandono
    // Rota e observações
    routeName: (0, mysql_core_1.varchar)("routeName", { length: 255 }), // Nome da rota vinculada
    observations: (0, mysql_core_1.text)("observations"), // Observações gerais
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
// TABELA: REGISTROS DE ABASTECIMENTO
// ============================================
exports.fuelRecords = (0, mysql_core_1.mysqlTable)("fuel_records", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    vehicleId: (0, mysql_core_1.int)("vehicleId").notNull().references(() => exports.vehicles.id),
    driverId: (0, mysql_core_1.int)("driverId").references(() => exports.drivers.id),
    // Dados do abastecimento
    fuelDate: (0, mysql_core_1.timestamp)("fuelDate").notNull(),
    fuelType: (0, mysql_core_1.varchar)("fuelType", { length: 50 }), // Diesel, Gasolina, Etanol, GNV
    liters: (0, mysql_core_1.decimal)("liters", { precision: 10, scale: 2 }).notNull(),
    pricePerLiter: (0, mysql_core_1.decimal)("pricePerLiter", { precision: 10, scale: 3 }),
    totalCost: (0, mysql_core_1.decimal)("totalCost", { precision: 10, scale: 2 }).notNull(),
    kmAtFueling: (0, mysql_core_1.int)("kmAtFueling"), // Km no momento do abastecimento
    gasStation: (0, mysql_core_1.varchar)("gasStation", { length: 255 }), // Posto
    invoiceNumber: (0, mysql_core_1.varchar)("invoiceNumber", { length: 50 }), // Nota fiscal
    notes: (0, mysql_core_1.text)("notes"),
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
// ============================================
// TABELA: ANOS LETIVOS
// ============================================
exports.academicYears = (0, mysql_core_1.mysqlTable)("academic_years", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    year: (0, mysql_core_1.int)("year").notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 50 }).notNull(),
    startDate: (0, mysql_core_1.timestamp)("startDate").notNull(),
    endDate: (0, mysql_core_1.timestamp)("endDate").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("academicYearStatus", ["planning", "active", "finished"]).default("planning").notNull(),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: SÉRIES / ETAPAS
// ============================================
exports.classGrades = (0, mysql_core_1.mysqlTable)("class_grades", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    level: (0, mysql_core_1.mysqlEnum)("gradeLevel", [
        "creche", "pre_escola", "fundamental_1", "fundamental_2", "medio", "eja", "tecnico"
    ]).notNull(),
    orderIndex: (0, mysql_core_1.int)("orderIndex").notNull().default(0),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: TURMAS
// ============================================
exports.classes = (0, mysql_core_1.mysqlTable)("classes", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").notNull().references(() => exports.schools.id),
    academicYearId: (0, mysql_core_1.int)("academicYearId").notNull().references(() => exports.academicYears.id),
    classGradeId: (0, mysql_core_1.int)("classGradeId").notNull().references(() => exports.classGrades.id),
    name: (0, mysql_core_1.varchar)("name", { length: 50 }).notNull(),
    fullName: (0, mysql_core_1.varchar)("fullName", { length: 100 }),
    shift: (0, mysql_core_1.mysqlEnum)("classShift", ["morning", "afternoon", "evening", "full_time"]).default("morning").notNull(),
    maxStudents: (0, mysql_core_1.int)("maxStudents").default(30),
    roomNumber: (0, mysql_core_1.varchar)("roomNumber", { length: 20 }),
    teacherUserId: (0, mysql_core_1.int)("teacherUserId").references(() => exports.users.id),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: DISCIPLINAS
// ============================================
exports.subjects = (0, mysql_core_1.mysqlTable)("subjects", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    code: (0, mysql_core_1.varchar)("code", { length: 20 }),
    category: (0, mysql_core_1.mysqlEnum)("subjectCategory", [
        "base_nacional", "parte_diversificada", "eletiva"
    ]).default("base_nacional"),
    workloadHours: (0, mysql_core_1.int)("workloadHours"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: DISCIPLINAS POR TURMA
// ============================================
exports.classSubjects = (0, mysql_core_1.mysqlTable)("class_subjects", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    classId: (0, mysql_core_1.int)("classId").notNull().references(() => exports.classes.id),
    subjectId: (0, mysql_core_1.int)("subjectId").notNull().references(() => exports.subjects.id),
    teacherUserId: (0, mysql_core_1.int)("teacherUserId").references(() => exports.users.id),
    weeklyHours: (0, mysql_core_1.int)("weeklyHours").default(2),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: MATRÍCULAS
// ============================================
exports.enrollments = (0, mysql_core_1.mysqlTable)("enrollments", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    classId: (0, mysql_core_1.int)("classId").notNull().references(() => exports.classes.id),
    academicYearId: (0, mysql_core_1.int)("academicYearId").notNull().references(() => exports.academicYears.id),
    enrollmentNumber: (0, mysql_core_1.varchar)("enrollmentNumber", { length: 50 }),
    enrollmentDate: (0, mysql_core_1.timestamp)("enrollmentDate").defaultNow().notNull(),
    status: (0, mysql_core_1.mysqlEnum)("enrollmentStatus", [
        "active", "transferred", "cancelled", "graduated", "retained", "evaded"
    ]).default("active").notNull(),
    statusChangedAt: (0, mysql_core_1.timestamp)("statusChangedAt"),
    statusNotes: (0, mysql_core_1.text)("statusNotes"),
    transferredFromSchoolId: (0, mysql_core_1.int)("transferredFromSchoolId").references(() => exports.schools.id),
    transferredToSchoolId: (0, mysql_core_1.int)("transferredToSchoolId").references(() => exports.schools.id),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: PROFESSORES (extensão de users)
// ============================================
exports.teachers = (0, mysql_core_1.mysqlTable)("teachers", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    userId: (0, mysql_core_1.int)("userId").notNull().references(() => exports.users.id).unique(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    registrationNumber: (0, mysql_core_1.varchar)("registrationNumber", { length: 50 }),
    degree: (0, mysql_core_1.varchar)("degree", { length: 100 }),
    specialization: (0, mysql_core_1.varchar)("specialization", { length: 255 }),
    hireDate: (0, mysql_core_1.timestamp)("hireDate"),
    contractType: (0, mysql_core_1.mysqlEnum)("teacherContractType", ["effective", "temporary", "substitute"]).default("effective"),
    weeklyWorkload: (0, mysql_core_1.int)("weeklyWorkload").default(40),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// ACADEMIC RELATIONS
// ============================================
exports.academicYearsRelations = (0, drizzle_orm_1.relations)(exports.academicYears, ({ many }) => ({
    classes: many(exports.classes),
    enrollments: many(exports.enrollments),
}));
exports.classGradesRelations = (0, drizzle_orm_1.relations)(exports.classGrades, ({ many }) => ({
    classes: many(exports.classes),
}));
exports.classesRelations = (0, drizzle_orm_1.relations)(exports.classes, ({ one, many }) => ({
    municipality: one(exports.municipalities, { fields: [exports.classes.municipalityId], references: [exports.municipalities.id] }),
    school: one(exports.schools, { fields: [exports.classes.schoolId], references: [exports.schools.id] }),
    academicYear: one(exports.academicYears, { fields: [exports.classes.academicYearId], references: [exports.academicYears.id] }),
    classGrade: one(exports.classGrades, { fields: [exports.classes.classGradeId], references: [exports.classGrades.id] }),
    teacher: one(exports.users, { fields: [exports.classes.teacherUserId], references: [exports.users.id] }),
    enrollments: many(exports.enrollments),
    classSubjects: many(exports.classSubjects),
}));
exports.subjectsRelations = (0, drizzle_orm_1.relations)(exports.subjects, ({ many }) => ({
    classSubjects: many(exports.classSubjects),
}));
exports.classSubjectsRelations = (0, drizzle_orm_1.relations)(exports.classSubjects, ({ one }) => ({
    class: one(exports.classes, { fields: [exports.classSubjects.classId], references: [exports.classes.id] }),
    subject: one(exports.subjects, { fields: [exports.classSubjects.subjectId], references: [exports.subjects.id] }),
    teacher: one(exports.users, { fields: [exports.classSubjects.teacherUserId], references: [exports.users.id] }),
}));
exports.enrollmentsRelations = (0, drizzle_orm_1.relations)(exports.enrollments, ({ one }) => ({
    municipality: one(exports.municipalities, { fields: [exports.enrollments.municipalityId], references: [exports.municipalities.id] }),
    student: one(exports.students, { fields: [exports.enrollments.studentId], references: [exports.students.id] }),
    class: one(exports.classes, { fields: [exports.enrollments.classId], references: [exports.classes.id] }),
    academicYear: one(exports.academicYears, { fields: [exports.enrollments.academicYearId], references: [exports.academicYears.id] }),
}));
exports.teachersRelations = (0, drizzle_orm_1.relations)(exports.teachers, ({ one }) => ({
    user: one(exports.users, { fields: [exports.teachers.userId], references: [exports.users.id] }),
    municipality: one(exports.municipalities, { fields: [exports.teachers.municipalityId], references: [exports.municipalities.id] }),
}));
// ============================================
// FASE 3: DIÁRIO ESCOLAR DIGITAL
// ============================================
// Frequência diária
exports.dailyAttendance = (0, mysql_core_1.mysqlTable)("daily_attendance", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    classId: (0, mysql_core_1.int)("classId").notNull().references(() => exports.classes.id),
    subjectId: (0, mysql_core_1.int)("subjectId").references(() => exports.subjects.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    date: (0, mysql_core_1.timestamp)("date").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("attendanceStatus", ["present", "absent", "justified", "late"]).default("present").notNull(),
    notes: (0, mysql_core_1.text)("notes"),
    registeredByUserId: (0, mysql_core_1.int)("registeredByUserId").references(() => exports.users.id),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// Avaliações / Provas
exports.assessments = (0, mysql_core_1.mysqlTable)("assessments", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    classId: (0, mysql_core_1.int)("classId").notNull().references(() => exports.classes.id),
    subjectId: (0, mysql_core_1.int)("subjectId").notNull().references(() => exports.subjects.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("assessmentType", ["prova", "trabalho", "seminario", "participacao", "recuperacao"]).default("prova").notNull(),
    maxScore: (0, mysql_core_1.decimal)("maxScore", { precision: 5, scale: 2 }).default("10.00").notNull(),
    weight: (0, mysql_core_1.decimal)("weight", { precision: 3, scale: 2 }).default("1.00"),
    date: (0, mysql_core_1.timestamp)("date"),
    bimester: (0, mysql_core_1.mysqlEnum)("bimester", ["1", "2", "3", "4"]).notNull(),
    description: (0, mysql_core_1.text)("description"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Notas dos alunos
exports.studentGrades = (0, mysql_core_1.mysqlTable)("student_grades", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    assessmentId: (0, mysql_core_1.int)("assessmentId").notNull().references(() => exports.assessments.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    score: (0, mysql_core_1.decimal)("score", { precision: 5, scale: 2 }),
    notes: (0, mysql_core_1.text)("notes"),
    registeredByUserId: (0, mysql_core_1.int)("registeredByUserId").references(() => exports.users.id),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Planejamento de aulas
exports.lessonPlans = (0, mysql_core_1.mysqlTable)("lesson_plans", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    classId: (0, mysql_core_1.int)("classId").notNull().references(() => exports.classes.id),
    subjectId: (0, mysql_core_1.int)("subjectId").notNull().references(() => exports.subjects.id),
    teacherUserId: (0, mysql_core_1.int)("teacherUserId").notNull().references(() => exports.users.id),
    date: (0, mysql_core_1.timestamp)("date").notNull(),
    topic: (0, mysql_core_1.varchar)("topic", { length: 255 }).notNull(),
    content: (0, mysql_core_1.text)("content"),
    methodology: (0, mysql_core_1.text)("methodology"),
    resources: (0, mysql_core_1.text)("resources"),
    bnccCode: (0, mysql_core_1.varchar)("bnccCode", { length: 20 }),
    bimester: (0, mysql_core_1.mysqlEnum)("lessonBimester", ["1", "2", "3", "4"]).notNull(),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// FASE 4: RECURSOS HUMANOS
// ============================================
// Cargos
exports.positions = (0, mysql_core_1.mysqlTable)("positions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    category: (0, mysql_core_1.mysqlEnum)("positionCategory", ["docente", "administrativo", "operacional", "gestao"]).default("administrativo").notNull(),
    baseSalary: (0, mysql_core_1.decimal)("baseSalary", { precision: 10, scale: 2 }),
    description: (0, mysql_core_1.text)("description"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Departamentos / Setores
exports.departments = (0, mysql_core_1.mysqlTable)("departments", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    headUserId: (0, mysql_core_1.int)("headUserId").references(() => exports.users.id),
    description: (0, mysql_core_1.text)("description"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Lotações (Staff Allocations)
exports.staffAllocations = (0, mysql_core_1.mysqlTable)("staff_allocations", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    userId: (0, mysql_core_1.int)("userId").notNull().references(() => exports.users.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    departmentId: (0, mysql_core_1.int)("departmentId").references(() => exports.departments.id),
    positionId: (0, mysql_core_1.int)("positionId").references(() => exports.positions.id),
    startDate: (0, mysql_core_1.timestamp)("startDate").notNull(),
    endDate: (0, mysql_core_1.timestamp)("endDate"),
    workload: (0, mysql_core_1.int)("workload").default(40),
    status: (0, mysql_core_1.mysqlEnum)("allocationStatus", ["active", "transferred", "ended"]).default("active").notNull(),
    notes: (0, mysql_core_1.text)("notes"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Avaliações de desempenho
exports.staffEvaluations = (0, mysql_core_1.mysqlTable)("staff_evaluations", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    userId: (0, mysql_core_1.int)("userId").notNull().references(() => exports.users.id),
    evaluatorUserId: (0, mysql_core_1.int)("evaluatorUserId").references(() => exports.users.id),
    period: (0, mysql_core_1.varchar)("period", { length: 50 }).notNull(),
    overallScore: (0, mysql_core_1.decimal)("overallScore", { precision: 4, scale: 2 }),
    punctuality: (0, mysql_core_1.int)("punctuality"),
    productivity: (0, mysql_core_1.int)("productivity"),
    teamwork: (0, mysql_core_1.int)("teamwork"),
    initiative: (0, mysql_core_1.int)("initiative"),
    communication: (0, mysql_core_1.int)("communication"),
    strengths: (0, mysql_core_1.text)("strengths"),
    improvements: (0, mysql_core_1.text)("improvements"),
    goals: (0, mysql_core_1.text)("goals"),
    status: (0, mysql_core_1.mysqlEnum)("evaluationStatus", ["draft", "submitted", "reviewed"]).default("draft").notNull(),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// FASE 5: FINANCEIRO
// ============================================
exports.financialAccounts = (0, mysql_core_1.mysqlTable)("financial_accounts", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("accountType", ["pdde", "proprio", "estadual", "federal", "outro"]).default("proprio").notNull(),
    bankName: (0, mysql_core_1.varchar)("bankName", { length: 100 }),
    agency: (0, mysql_core_1.varchar)("agency", { length: 20 }),
    accountNumber: (0, mysql_core_1.varchar)("accountNumber", { length: 30 }),
    balance: (0, mysql_core_1.decimal)("balance", { precision: 12, scale: 2 }).default("0.00"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
exports.financialTransactions = (0, mysql_core_1.mysqlTable)("financial_transactions", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    accountId: (0, mysql_core_1.int)("accountId").notNull().references(() => exports.financialAccounts.id),
    type: (0, mysql_core_1.mysqlEnum)("transactionType", ["receita", "despesa"]).notNull(),
    category: (0, mysql_core_1.varchar)("category", { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    value: (0, mysql_core_1.decimal)("value", { precision: 12, scale: 2 }).notNull(),
    date: (0, mysql_core_1.timestamp)("date").notNull(),
    documentNumber: (0, mysql_core_1.varchar)("documentNumber", { length: 50 }),
    supplier: (0, mysql_core_1.varchar)("supplier", { length: 255 }),
    status: (0, mysql_core_1.mysqlEnum)("transactionStatus", ["pending", "confirmed", "cancelled"]).default("confirmed").notNull(),
    registeredByUserId: (0, mysql_core_1.int)("registeredByUserId").references(() => exports.users.id),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// FASE 6: OPERACIONAL
// ============================================
// Merenda Escolar - Cardápios
exports.mealMenus = (0, mysql_core_1.mysqlTable)("meal_menus", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    date: (0, mysql_core_1.timestamp)("date").notNull(),
    mealType: (0, mysql_core_1.mysqlEnum)("mealType", ["breakfast", "lunch", "snack", "dinner"]).default("lunch").notNull(),
    description: (0, mysql_core_1.text)("description").notNull(),
    calories: (0, mysql_core_1.int)("calories"),
    servings: (0, mysql_core_1.int)("servings"),
    cost: (0, mysql_core_1.decimal)("cost", { precision: 8, scale: 2 }),
    notes: (0, mysql_core_1.text)("notes"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Biblioteca - Acervo
exports.libraryBooks = (0, mysql_core_1.mysqlTable)("library_books", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    author: (0, mysql_core_1.varchar)("author", { length: 255 }),
    isbn: (0, mysql_core_1.varchar)("isbn", { length: 20 }),
    category: (0, mysql_core_1.varchar)("category", { length: 100 }),
    publisher: (0, mysql_core_1.varchar)("publisher", { length: 255 }),
    year: (0, mysql_core_1.int)("year"),
    quantity: (0, mysql_core_1.int)("quantity").default(1),
    available: (0, mysql_core_1.int)("available").default(1),
    location: (0, mysql_core_1.varchar)("location", { length: 100 }),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Biblioteca - Empréstimos
exports.libraryLoans = (0, mysql_core_1.mysqlTable)("library_loans", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    bookId: (0, mysql_core_1.int)("bookId").notNull().references(() => exports.libraryBooks.id),
    userId: (0, mysql_core_1.int)("userId").notNull().references(() => exports.users.id),
    studentId: (0, mysql_core_1.int)("studentId").references(() => exports.students.id),
    loanDate: (0, mysql_core_1.timestamp)("loanDate").defaultNow().notNull(),
    dueDate: (0, mysql_core_1.timestamp)("dueDate").notNull(),
    returnDate: (0, mysql_core_1.timestamp)("returnDate"),
    status: (0, mysql_core_1.mysqlEnum)("loanStatus", ["active", "returned", "overdue", "lost"]).default("active").notNull(),
    notes: (0, mysql_core_1.text)("notes"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// Patrimônio
exports.assets = (0, mysql_core_1.mysqlTable)("assets", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    code: (0, mysql_core_1.varchar)("code", { length: 50 }),
    category: (0, mysql_core_1.mysqlEnum)("assetCategory", ["movel", "imovel", "equipamento", "veiculo", "tecnologia", "outro"]).default("equipamento").notNull(),
    acquisitionDate: (0, mysql_core_1.timestamp)("acquisitionDate"),
    acquisitionValue: (0, mysql_core_1.decimal)("acquisitionValue", { precision: 12, scale: 2 }),
    currentValue: (0, mysql_core_1.decimal)("currentValue", { precision: 12, scale: 2 }),
    location: (0, mysql_core_1.varchar)("location", { length: 255 }),
    condition: (0, mysql_core_1.mysqlEnum)("assetCondition", ["otimo", "bom", "regular", "ruim", "inservivel"]).default("bom"),
    responsibleUserId: (0, mysql_core_1.int)("responsibleUserId").references(() => exports.users.id),
    notes: (0, mysql_core_1.text)("notes"),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Estoque
exports.inventoryItems = (0, mysql_core_1.mysqlTable)("inventory_items", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    category: (0, mysql_core_1.varchar)("category", { length: 100 }),
    unit: (0, mysql_core_1.varchar)("unit", { length: 20 }).default("un"),
    currentStock: (0, mysql_core_1.int)("currentStock").default(0),
    minStock: (0, mysql_core_1.int)("minStock").default(5),
    maxStock: (0, mysql_core_1.int)("maxStock"),
    unitCost: (0, mysql_core_1.decimal)("unitCost", { precision: 10, scale: 2 }),
    location: (0, mysql_core_1.varchar)("location", { length: 100 }),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
exports.inventoryMovements = (0, mysql_core_1.mysqlTable)("inventory_movements", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    itemId: (0, mysql_core_1.int)("itemId").notNull().references(() => exports.inventoryItems.id),
    type: (0, mysql_core_1.mysqlEnum)("movementType", ["entrada", "saida", "ajuste"]).notNull(),
    quantity: (0, mysql_core_1.int)("quantity").notNull(),
    date: (0, mysql_core_1.timestamp)("date").defaultNow().notNull(),
    documentNumber: (0, mysql_core_1.varchar)("documentNumber", { length: 50 }),
    supplier: (0, mysql_core_1.varchar)("supplier", { length: 255 }),
    notes: (0, mysql_core_1.text)("notes"),
    registeredByUserId: (0, mysql_core_1.int)("registeredByUserId").references(() => exports.users.id),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// FUNCIONALIDADES ADICIONAIS (baseado no GEP)
// ============================================
// Parecer Descritivo (texto livre por aluno por bimestre)
exports.descriptiveReports = (0, mysql_core_1.mysqlTable)("descriptive_reports", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    classId: (0, mysql_core_1.int)("classId").notNull().references(() => exports.classes.id),
    bimester: (0, mysql_core_1.mysqlEnum)("reportBimester", ["1", "2", "3", "4"]).notNull(),
    content: (0, mysql_core_1.text)("content"),
    teacherUserId: (0, mysql_core_1.int)("teacherUserId").references(() => exports.users.id),
    status: (0, mysql_core_1.mysqlEnum)("reportStatus", ["draft", "published"]).default("draft").notNull(),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// Calendário Escolar (eventos, feriados, etc.)
exports.schoolCalendar = (0, mysql_core_1.mysqlTable)("school_calendar", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    academicYearId: (0, mysql_core_1.int)("academicYearId").references(() => exports.academicYears.id),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    startDate: (0, mysql_core_1.timestamp)("startDate").notNull(),
    endDate: (0, mysql_core_1.timestamp)("endDate"),
    eventType: (0, mysql_core_1.mysqlEnum)("calendarEventType", ["aula", "feriado", "recesso", "reuniao", "conselho", "prova", "evento", "outro"]).default("evento").notNull(),
    color: (0, mysql_core_1.varchar)("color", { length: 7 }).default("#2DB5B0"),
    allDay: (0, mysql_core_1.boolean)("allDay").default(true),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// Documentos do Aluno (anexos)
exports.studentDocuments = (0, mysql_core_1.mysqlTable)("student_documents", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("documentType", ["certidao_nascimento", "rg", "cpf", "comprovante_residencia", "historico_escolar", "laudo_medico", "foto", "outro"]).default("outro").notNull(),
    fileUrl: (0, mysql_core_1.text)("fileUrl"),
    fileSize: (0, mysql_core_1.int)("fileSize"),
    uploadedByUserId: (0, mysql_core_1.int)("uploadedByUserId").references(() => exports.users.id),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// Recados / Comunicação
exports.messages = (0, mysql_core_1.mysqlTable)("messages", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    senderUserId: (0, mysql_core_1.int)("senderUserId").notNull().references(() => exports.users.id),
    targetType: (0, mysql_core_1.mysqlEnum)("messageTargetType", ["all", "school", "class", "student", "staff"]).default("all").notNull(),
    targetClassId: (0, mysql_core_1.int)("targetClassId").references(() => exports.classes.id),
    targetStudentId: (0, mysql_core_1.int)("targetStudentId").references(() => exports.students.id),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, mysql_core_1.text)("content").notNull(),
    priority: (0, mysql_core_1.mysqlEnum)("messagePriority", ["normal", "important", "urgent"]).default("normal").notNull(),
    isActive: (0, mysql_core_1.boolean)("isActive").default(true).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// Lista de Espera
exports.waitingList = (0, mysql_core_1.mysqlTable)("waiting_list", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    schoolId: (0, mysql_core_1.int)("schoolId").notNull().references(() => exports.schools.id),
    studentName: (0, mysql_core_1.varchar)("studentName", { length: 255 }).notNull(),
    birthDate: (0, mysql_core_1.timestamp)("birthDate"),
    guardianName: (0, mysql_core_1.varchar)("guardianName", { length: 255 }),
    guardianPhone: (0, mysql_core_1.varchar)("guardianPhone", { length: 20 }),
    guardianCpf: (0, mysql_core_1.varchar)("guardianCpf", { length: 14 }),
    gradeRequested: (0, mysql_core_1.varchar)("gradeRequested", { length: 100 }),
    shift: (0, mysql_core_1.mysqlEnum)("waitingShift", ["morning", "afternoon", "evening"]).default("morning"),
    position: (0, mysql_core_1.int)("position"),
    status: (0, mysql_core_1.mysqlEnum)("waitingStatus", ["waiting", "called", "enrolled", "cancelled"]).default("waiting").notNull(),
    notes: (0, mysql_core_1.text)("notes"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: HISTÓRICO ESCOLAR ANTERIOR DO ALUNO
// ============================================
exports.studentHistory = (0, mysql_core_1.mysqlTable)("student_history", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    studentId: (0, mysql_core_1.int)("studentId").notNull().references(() => exports.students.id),
    year: (0, mysql_core_1.int)("year").notNull(),
    grade: (0, mysql_core_1.varchar)("grade", { length: 100 }).notNull(),
    schoolName: (0, mysql_core_1.varchar)("schoolName", { length: 255 }).notNull(),
    schoolCity: (0, mysql_core_1.varchar)("schoolCity", { length: 100 }),
    schoolState: (0, mysql_core_1.varchar)("schoolState", { length: 2 }),
    schoolType: (0, mysql_core_1.varchar)("schoolType", { length: 30 }),
    result: (0, mysql_core_1.varchar)("result", { length: 50 }).notNull(),
    observations: (0, mysql_core_1.text)("observations"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// ============================================
// TABELA: DOCUMENTOS GERADOS (Verificação + QR Code)
// ============================================
exports.documents = (0, mysql_core_1.mysqlTable)("documents", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    verificationCode: (0, mysql_core_1.varchar)("verificationCode", { length: 20 }).notNull().unique(),
    type: (0, mysql_core_1.varchar)("type", { length: 100 }).notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 500 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    studentId: (0, mysql_core_1.int)("studentId").references(() => exports.students.id),
    schoolId: (0, mysql_core_1.int)("schoolId").references(() => exports.schools.id),
    generatedById: (0, mysql_core_1.int)("generatedById").notNull().references(() => exports.users.id),
    generatedAt: (0, mysql_core_1.timestamp)("generatedAt").defaultNow().notNull(),
    pdfHash: (0, mysql_core_1.varchar)("pdfHash", { length: 64 }).notNull(),
    pdfSize: (0, mysql_core_1.int)("pdfSize"),
    status: (0, mysql_core_1.mysqlEnum)("docStatus", ["valid", "revoked", "expired"]).default("valid").notNull(),
    revokedAt: (0, mysql_core_1.timestamp)("revokedAt"),
    revokedById: (0, mysql_core_1.int)("revokedById"),
    revokedReason: (0, mysql_core_1.text)("revokedReason"),
    expiresAt: (0, mysql_core_1.timestamp)("expiresAt"),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// ============================================
// TABELA: CONFIGURAÇÃO DE CAMPOS OBRIGATÓRIOS
// ============================================
exports.formFieldConfigs = (0, mysql_core_1.mysqlTable)("form_field_configs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    municipalityId: (0, mysql_core_1.int)("municipalityId").notNull().references(() => exports.municipalities.id),
    formType: (0, mysql_core_1.varchar)("formType", { length: 50 }).notNull(), // student, school, driver, vehicle, route, teacher
    fieldName: (0, mysql_core_1.varchar)("fieldName", { length: 100 }).notNull(), // cpf, rg, fatherName, etc
    isRequired: (0, mysql_core_1.boolean)("isRequired").default(false).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
