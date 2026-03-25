"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const promise_1 = __importDefault(require("mysql2/promise"));
async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }
    const conn = await promise_1.default.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database for migration...');
    try {
        // Alter users role enum (safe - no truncate)
        try {
            await conn.execute(`ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','municipal_admin','secretary','school_admin','driver','monitor','parent','teacher','coordinator') NOT NULL DEFAULT 'parent'`);
        }
        catch { /* already up to date */ }
        // Municipality extra columns (v3.2 - dados prefeito, secretaria, responsaveis)
        const munCols = [
            "cep VARCHAR(9)", "logradouro VARCHAR(255)", "numero VARCHAR(10)",
            "complemento VARCHAR(100)", "bairro VARCHAR(100)", "fax VARCHAR(20)", "website VARCHAR(255)",
            "prefeitoName VARCHAR(255)", "prefeitoCpf VARCHAR(14)", "prefeitoCargo VARCHAR(100)",
            "secretariaName VARCHAR(255)", "secretariaCnpj VARCHAR(18)",
            "secretariaPhone VARCHAR(20)", "secretariaEmail VARCHAR(320)", "secretariaLogradouro VARCHAR(255)",
            "secretarioName VARCHAR(255)", "secretarioCpf VARCHAR(14)",
            "secretarioCargo VARCHAR(100)", "secretarioDecreto VARCHAR(100)",
        ];
        for (const col of munCols) {
            try {
                await conn.execute(`ALTER TABLE municipalities ADD COLUMN ${col}`);
            }
            catch { /* already exists */ }
        }
        // Responsibles table
        try {
            await conn.execute(`CREATE TABLE IF NOT EXISTS municipality_responsibles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        municipalityId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        cpf VARCHAR(14),
        decree VARCHAR(100),
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id)
      )`);
        }
        catch { /* already exists */ }
        // Create new tables if they don't exist
        const tables = [
            `CREATE TABLE IF NOT EXISTS academic_years (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, year INT NOT NULL, name VARCHAR(50) NOT NULL,
        startDate TIMESTAMP NOT NULL, endDate TIMESTAMP NOT NULL,
        academicYearStatus ENUM('planning','active','finished') NOT NULL DEFAULT 'planning',
        isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS class_grades (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, name VARCHAR(100) NOT NULL,
        gradeLevel ENUM('creche','pre_escola','fundamental_1','fundamental_2','medio','eja','tecnico') NOT NULL,
        orderIndex INT NOT NULL DEFAULT 0, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT NOT NULL,
        academicYearId INT NOT NULL, classGradeId INT NOT NULL, name VARCHAR(50) NOT NULL,
        fullName VARCHAR(100), classShift ENUM('morning','afternoon','evening','full_time') NOT NULL DEFAULT 'morning',
        maxStudents INT DEFAULT 30, roomNumber VARCHAR(20), teacherUserId INT,
        isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (schoolId) REFERENCES schools(id),
        FOREIGN KEY (academicYearId) REFERENCES academic_years(id), FOREIGN KEY (classGradeId) REFERENCES class_grades(id))`,
            `CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, name VARCHAR(100) NOT NULL,
        code VARCHAR(20), subjectCategory ENUM('base_nacional','parte_diversificada','eletiva') DEFAULT 'base_nacional',
        workloadHours INT, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS class_subjects (
        id INT AUTO_INCREMENT PRIMARY KEY, classId INT NOT NULL, subjectId INT NOT NULL,
        teacherUserId INT, weeklyHours INT DEFAULT 2, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (classId) REFERENCES classes(id), FOREIGN KEY (subjectId) REFERENCES subjects(id))`,
            `CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, studentId INT NOT NULL,
        classId INT NOT NULL, academicYearId INT NOT NULL, enrollmentNumber VARCHAR(50),
        enrollmentDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        enrollmentStatus ENUM('active','transferred','cancelled','graduated','retained','evaded') NOT NULL DEFAULT 'active',
        statusChangedAt TIMESTAMP NULL, statusNotes TEXT, transferredFromSchoolId INT, transferredToSchoolId INT,
        isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (studentId) REFERENCES students(id),
        FOREIGN KEY (classId) REFERENCES classes(id), FOREIGN KEY (academicYearId) REFERENCES academic_years(id))`,
            `CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL UNIQUE, municipalityId INT NOT NULL,
        registrationNumber VARCHAR(50), degree VARCHAR(100), specialization VARCHAR(255),
        hireDate TIMESTAMP NULL, teacherContractType ENUM('effective','temporary','substitute') DEFAULT 'effective',
        weeklyWorkload INT DEFAULT 40, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id), FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS daily_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY, classId INT NOT NULL, subjectId INT,
        studentId INT NOT NULL, date TIMESTAMP NOT NULL,
        attendanceStatus ENUM('present','absent','justified','late') NOT NULL DEFAULT 'present',
        notes TEXT, registeredByUserId INT, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (classId) REFERENCES classes(id), FOREIGN KEY (studentId) REFERENCES students(id))`,
            `CREATE TABLE IF NOT EXISTS assessments (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, classId INT NOT NULL, subjectId INT NOT NULL,
        name VARCHAR(255) NOT NULL, assessmentType ENUM('prova','trabalho','seminario','participacao','recuperacao') NOT NULL DEFAULT 'prova',
        maxScore DECIMAL(5,2) NOT NULL DEFAULT 10.00, weight DECIMAL(3,2) DEFAULT 1.00,
        date TIMESTAMP NULL, bimester ENUM('1','2','3','4') NOT NULL, description TEXT,
        isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (classId) REFERENCES classes(id))`,
            `CREATE TABLE IF NOT EXISTS student_grades (
        id INT AUTO_INCREMENT PRIMARY KEY, assessmentId INT NOT NULL, studentId INT NOT NULL,
        score DECIMAL(5,2), notes TEXT, registeredByUserId INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assessmentId) REFERENCES assessments(id), FOREIGN KEY (studentId) REFERENCES students(id))`,
            `CREATE TABLE IF NOT EXISTS lesson_plans (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, classId INT NOT NULL, subjectId INT NOT NULL,
        teacherUserId INT NOT NULL, date TIMESTAMP NOT NULL, topic VARCHAR(255) NOT NULL,
        content TEXT, methodology TEXT, resources TEXT, bnccCode VARCHAR(20),
        lessonBimester ENUM('1','2','3','4') NOT NULL, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (classId) REFERENCES classes(id))`,
            `CREATE TABLE IF NOT EXISTS positions (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, name VARCHAR(255) NOT NULL,
        positionCategory ENUM('docente','administrativo','operacional','gestao') NOT NULL DEFAULT 'administrativo',
        baseSalary DECIMAL(10,2), description TEXT, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, name VARCHAR(255) NOT NULL,
        headUserId INT, description TEXT, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS staff_allocations (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, userId INT NOT NULL,
        schoolId INT, departmentId INT, positionId INT, startDate TIMESTAMP NOT NULL,
        endDate TIMESTAMP NULL, workload INT DEFAULT 40,
        allocationStatus ENUM('active','transferred','ended') NOT NULL DEFAULT 'active',
        notes TEXT, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (userId) REFERENCES users(id))`,
            `CREATE TABLE IF NOT EXISTS staff_evaluations (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, userId INT NOT NULL,
        evaluatorUserId INT, period VARCHAR(50) NOT NULL, overallScore DECIMAL(4,2),
        punctuality INT, productivity INT, teamwork INT, initiative INT, communication INT,
        strengths TEXT, improvements TEXT, goals TEXT,
        evaluationStatus ENUM('draft','submitted','reviewed') NOT NULL DEFAULT 'draft',
        isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (userId) REFERENCES users(id))`,
            `CREATE TABLE IF NOT EXISTS financial_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT,
        name VARCHAR(255) NOT NULL, accountType ENUM('pdde','proprio','estadual','federal','outro') NOT NULL DEFAULT 'proprio',
        bankName VARCHAR(100), agency VARCHAR(20), accountNumber VARCHAR(30),
        balance DECIMAL(12,2) DEFAULT 0.00, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS financial_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, accountId INT NOT NULL,
        transactionType ENUM('receita','despesa') NOT NULL, category VARCHAR(100) NOT NULL,
        description TEXT, value DECIMAL(12,2) NOT NULL, date TIMESTAMP NOT NULL,
        documentNumber VARCHAR(50), supplier VARCHAR(255),
        transactionStatus ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
        registeredByUserId INT, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (accountId) REFERENCES financial_accounts(id))`,
            `CREATE TABLE IF NOT EXISTS meal_menus (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT,
        date TIMESTAMP NOT NULL, mealType ENUM('breakfast','lunch','snack','dinner') NOT NULL DEFAULT 'lunch',
        description TEXT NOT NULL, calories INT, servings INT, cost DECIMAL(8,2), notes TEXT,
        isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS library_books (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT,
        title VARCHAR(255) NOT NULL, author VARCHAR(255), isbn VARCHAR(20),
        category VARCHAR(100), publisher VARCHAR(255), year INT,
        quantity INT DEFAULT 1, available INT DEFAULT 1, location VARCHAR(100),
        isActive BOOLEAN NOT NULL DEFAULT TRUE, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS library_loans (
        id INT AUTO_INCREMENT PRIMARY KEY, bookId INT NOT NULL, userId INT NOT NULL,
        studentId INT, loanDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        dueDate TIMESTAMP NOT NULL, returnDate TIMESTAMP NULL,
        loanStatus ENUM('active','returned','overdue','lost') NOT NULL DEFAULT 'active',
        notes TEXT, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookId) REFERENCES library_books(id), FOREIGN KEY (userId) REFERENCES users(id))`,
            `CREATE TABLE IF NOT EXISTS assets (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT,
        name VARCHAR(255) NOT NULL, code VARCHAR(50),
        assetCategory ENUM('movel','imovel','equipamento','veiculo','tecnologia','outro') NOT NULL DEFAULT 'equipamento',
        acquisitionDate TIMESTAMP NULL, acquisitionValue DECIMAL(12,2), currentValue DECIMAL(12,2),
        location VARCHAR(255), assetCondition ENUM('otimo','bom','regular','ruim','inservivel') DEFAULT 'bom',
        responsibleUserId INT, notes TEXT, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS inventory_items (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT,
        name VARCHAR(255) NOT NULL, category VARCHAR(100), unit VARCHAR(20) DEFAULT 'un',
        currentStock INT DEFAULT 0, minStock INT DEFAULT 5, maxStock INT,
        unitCost DECIMAL(10,2), location VARCHAR(100), isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS inventory_movements (
        id INT AUTO_INCREMENT PRIMARY KEY, itemId INT NOT NULL,
        movementType ENUM('entrada','saida','ajuste') NOT NULL, quantity INT NOT NULL,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, documentNumber VARCHAR(50),
        supplier VARCHAR(255), notes TEXT, registeredByUserId INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (itemId) REFERENCES inventory_items(id))`,
            `CREATE TABLE IF NOT EXISTS descriptive_reports (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, studentId INT NOT NULL,
        classId INT NOT NULL, reportBimester ENUM('1','2','3','4') NOT NULL,
        content TEXT, teacherUserId INT,
        reportStatus ENUM('draft','published') NOT NULL DEFAULT 'draft',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (studentId) REFERENCES students(id))`,
            `CREATE TABLE IF NOT EXISTS school_calendar (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT,
        academicYearId INT, title VARCHAR(255) NOT NULL, description TEXT,
        startDate TIMESTAMP NOT NULL, endDate TIMESTAMP NULL,
        calendarEventType ENUM('aula','feriado','recesso','reuniao','conselho','prova','evento','outro') NOT NULL DEFAULT 'evento',
        color VARCHAR(7) DEFAULT '#2DB5B0', allDay BOOLEAN DEFAULT TRUE,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS student_documents (
        id INT AUTO_INCREMENT PRIMARY KEY, studentId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        documentType ENUM('certidao_nascimento','rg','cpf','comprovante_residencia','historico_escolar','laudo_medico','foto','outro') NOT NULL DEFAULT 'outro',
        fileUrl TEXT, fileSize INT, uploadedByUserId INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (studentId) REFERENCES students(id))`,
            `CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT,
        senderUserId INT NOT NULL, messageTargetType ENUM('all','school','class','student','staff') NOT NULL DEFAULT 'all',
        targetClassId INT, targetStudentId INT,
        title VARCHAR(255) NOT NULL, content TEXT NOT NULL,
        messagePriority ENUM('normal','important','urgent') NOT NULL DEFAULT 'normal',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (senderUserId) REFERENCES users(id))`,
            `CREATE TABLE IF NOT EXISTS form_field_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        municipalityId INT NOT NULL,
        formType VARCHAR(50) NOT NULL,
        fieldName VARCHAR(100) NOT NULL,
        isRequired BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS waiting_list (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL, schoolId INT NOT NULL,
        studentName VARCHAR(255) NOT NULL, birthDate TIMESTAMP NULL,
        guardianName VARCHAR(255), guardianPhone VARCHAR(20), guardianCpf VARCHAR(14),
        gradeRequested VARCHAR(100), waitingShift ENUM('morning','afternoon','evening') DEFAULT 'morning',
        position INT, waitingStatus ENUM('waiting','called','enrolled','cancelled') NOT NULL DEFAULT 'waiting',
        notes TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id), FOREIGN KEY (schoolId) REFERENCES schools(id))`,
        ];
        for (const sql of tables) {
            try {
                await conn.execute(sql);
            }
            catch { /* already exists */ }
        }
        // Student columns
        const newStudentCols = [
            "cpf VARCHAR(14)", "rg VARCHAR(20)", "rgOrgao VARCHAR(20)", "rgUf VARCHAR(2)", "rgDate VARCHAR(10)",
            "sex VARCHAR(1)", "race VARCHAR(20)", "nationality VARCHAR(50)", "naturalness VARCHAR(100)", "naturalnessUf VARCHAR(2)",
            "nis VARCHAR(15)", "cartaoSus VARCHAR(20)",
            "certidaoTipo VARCHAR(20)", "certidaoNumero VARCHAR(50)", "certidaoFolha VARCHAR(10)", "certidaoLivro VARCHAR(10)",
            "certidaoData VARCHAR(10)", "certidaoCartorio VARCHAR(255)",
            "addressNumber VARCHAR(10)", "addressComplement VARCHAR(100)", "neighborhood VARCHAR(100)",
            "cep VARCHAR(9)", "city VARCHAR(100)", "state VARCHAR(2)", "zone VARCHAR(10)",
            "phone VARCHAR(20)", "cellPhone VARCHAR(20)",
            "needsTransport BOOLEAN DEFAULT FALSE", "transportType VARCHAR(50)", "transportDistance VARCHAR(10)",
            "bolsaFamilia BOOLEAN DEFAULT FALSE", "bpc BOOLEAN DEFAULT FALSE", "peti BOOLEAN DEFAULT FALSE", "otherPrograms VARCHAR(255)",
            "deficiencyType VARCHAR(255)", "tgd VARCHAR(255)", "superdotacao BOOLEAN DEFAULT FALSE",
            "salaRecursos BOOLEAN DEFAULT FALSE", "acompanhamento VARCHAR(255)", "encaminhamento VARCHAR(255)",
            "fatherName VARCHAR(255)", "fatherCpf VARCHAR(14)", "fatherRg VARCHAR(20)", "fatherPhone VARCHAR(20)",
            "fatherProfession VARCHAR(100)", "fatherWorkplace VARCHAR(255)", "fatherEducation VARCHAR(50)",
            "fatherNaturalness VARCHAR(50)", "fatherNaturalnessUf VARCHAR(2)",
            "motherName VARCHAR(255)", "motherCpf VARCHAR(14)", "motherRg VARCHAR(20)", "motherPhone VARCHAR(20)",
            "motherProfession VARCHAR(100)", "motherWorkplace VARCHAR(255)", "motherEducation VARCHAR(50)",
            "motherNaturalness VARCHAR(50)", "motherNaturalnessUf VARCHAR(2)",
            "familyIncome VARCHAR(50)",
            "previousSchool VARCHAR(255)", "previousSchoolType VARCHAR(30)", "previousSchoolZone VARCHAR(10)",
            "previousCity VARCHAR(100)", "previousState VARCHAR(2)", "enrollmentType VARCHAR(20)",
            "studentStatus VARCHAR(30)",
        ];
        for (const col of newStudentCols) {
            try {
                await conn.execute(`ALTER TABLE students ADD COLUMN ${col}`);
            }
            catch { /* already exists */ }
        }
        // SETE (FNDE) - Fornecedores
        const seteTables = [
            `CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        supplierType ENUM('mecanica','posto_combustivel','seguradora','autopecas','borracharia','eletrica','funilaria','outro') NOT NULL DEFAULT 'outro',
        cnpj VARCHAR(18), cpf VARCHAR(14), contactName VARCHAR(255),
        phone VARCHAR(20), email VARCHAR(320), address TEXT,
        city VARCHAR(255), state VARCHAR(2), cep VARCHAR(9),
        specialties TEXT, rating INT, notes TEXT,
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
            `CREATE TABLE IF NOT EXISTS service_orders (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL,
        vehicleId INT NOT NULL, supplierId INT,
        number VARCHAR(20) NOT NULL,
        serviceType ENUM('preventiva','corretiva','preditiva','emergencial') NOT NULL DEFAULT 'corretiva',
        servicePriority ENUM('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
        description TEXT NOT NULL, diagnosis TEXT, solution TEXT,
        parts TEXT, laborCost DECIMAL(10,2) DEFAULT 0, partsCost DECIMAL(10,2) DEFAULT 0,
        totalCost DECIMAL(10,2) DEFAULT 0, kmAtService INT,
        openedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        startedAt TIMESTAMP NULL, completedAt TIMESTAMP NULL,
        estimatedCompletionAt TIMESTAMP NULL,
        requestedById INT, approvedById INT,
        invoiceNumber VARCHAR(50), notes TEXT,
        serviceOrderStatus ENUM('aberta','aprovada','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'aberta',
        isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id),
        FOREIGN KEY (vehicleId) REFERENCES vehicles(id))`,
            `CREATE TABLE IF NOT EXISTS garages (
        id INT AUTO_INCREMENT PRIMARY KEY, municipalityId INT NOT NULL,
        name VARCHAR(255) NOT NULL, address TEXT,
        city VARCHAR(255), state VARCHAR(2), cep VARCHAR(9),
        latitude DECIMAL(10,8), longitude DECIMAL(11,8),
        capacity INT DEFAULT 10, contactName VARCHAR(255),
        phone VARCHAR(20),
        garageType ENUM('propria','alugada','cedida','conveniada') NOT NULL DEFAULT 'propria',
        notes TEXT, isActive BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (municipalityId) REFERENCES municipalities(id))`,
        ];
        for (const sql of seteTables) {
            try {
                await conn.execute(sql);
            }
            catch { /* already exists */ }
        }
        // Add garageId to vehicles
        try {
            await conn.execute(`ALTER TABLE vehicles ADD COLUMN garageId INT`);
        }
        catch { /* already exists */ }
        console.log('Migration complete');
    }
    catch (err) {
        console.error('Migration error:', err.message);
    }
    finally {
        await conn.end();
    }
}
migrate();
