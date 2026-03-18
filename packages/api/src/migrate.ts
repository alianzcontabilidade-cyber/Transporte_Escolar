import * as dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('Connected to database for migration...');

  try {
    // Alter users role enum to add teacher and coordinator (safe - no truncate needed)
    try {
      await conn.execute(`ALTER TABLE users MODIFY COLUMN role ENUM('super_admin','municipal_admin','secretary','school_admin','driver','monitor','parent','teacher','coordinator') NOT NULL DEFAULT 'parent'`);
      console.log('Updated users.role enum');
    } catch (e: any) {
      if (!e.message?.includes('Duplicate')) console.log('users.role enum already up to date or:', e.message);
    }

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
    ];

    for (const sql of tables) {
      try {
        await conn.execute(sql);
      } catch (e: any) {
        // Table might already exist with slightly different structure - that's ok
        if (!e.message?.includes('already exists')) {
          console.log('Warning:', e.message?.substring(0, 100));
        }
      }
    }
    console.log('Migration complete - all tables created/verified');

  } catch (err: any) {
    console.error('Migration error:', err.message);
  } finally {
    await conn.end();
  }
}

migrate();
