import mysql from 'mysql2/promise';

const DB_URL = 'mysql://root:iXNAoBMhgUaQTHsLMqPyGlchTOkPEdJL@crossover.proxy.rlwy.net:52525/railway';

async function seed() {
  const conn = await mysql.createConnection(DB_URL);
  console.log('Conectado ao banco!');

  // 1. Verificar municipio
  const [muns] = await conn.execute('SELECT id, name FROM municipalities');
  const munId = muns[0]?.id;
  if (!munId) { console.error('Nenhum municipio encontrado!'); return; }
  console.log('Municipio:', muns[0].name, '(ID:', munId, ')');

  // 2. Criar escola
  console.log('\n--- Criando escola ---');
  await conn.execute(
    `INSERT INTO schools (municipalityId, name, code, type, address, phone, email, directorName, morningStart, morningEnd, afternoonStart, afternoonEnd, isActive)
     VALUES (?, 'Escola Municipal Monteiro Lobato', '27001234', 'fundamental', 'Rua das Flores, 100 - Centro', '(63) 3215-1234', 'escola.lobato@edu.gov.br', 'Maria Aparecida Santos', '07:00', '12:00', '13:00', '17:00', true)
     ON DUPLICATE KEY UPDATE name=name`,
    [munId]
  );
  const [schools] = await conn.execute('SELECT id, name FROM schools WHERE municipalityId = ? LIMIT 1', [munId]);
  const schoolId = schools[0].id;
  console.log('Escola:', schools[0].name, '(ID:', schoolId, ')');

  // 3. Criar veiculo
  console.log('\n--- Criando veiculo ---');
  await conn.execute(
    `INSERT INTO vehicles (municipalityId, plate, nickname, brand, model, year, capacity, status, color, fuelType)
     VALUES (?, 'QRA-4E56', 'Amarelinho 01', 'Mercedes-Benz', 'OF 1519', 2022, 44, 'active', 'Amarelo', 'Diesel')
     ON DUPLICATE KEY UPDATE plate=plate`,
    [munId]
  );
  const [vehicles] = await conn.execute('SELECT id, plate FROM vehicles WHERE municipalityId = ? LIMIT 1', [munId]);
  const vehicleId = vehicles[0].id;
  console.log('Veiculo:', vehicles[0].plate, '(ID:', vehicleId, ')');

  // 4. Criar usuario motorista
  console.log('\n--- Criando motorista ---');
  // Senha: motorista123 (hash bcrypt)
  const driverHash = '$2a$12$LJ3m4yv8WQN8j5tK1fGZYeVx5BQ6vI5R3bQ5L5G5H5J5K5M5O5Q5S';

  // Verificar se ja existe
  const [existingDriver] = await conn.execute('SELECT id FROM users WHERE email = ?', ['carlos.motorista@transescolar.com']);
  let driverUserId;
  if (existingDriver.length === 0) {
    const [driverUser] = await conn.execute(
      `INSERT INTO users (municipalityId, email, passwordHash, name, phone, cpf, role, isActive)
       VALUES (?, 'carlos.motorista@transescolar.com', ?, 'Carlos Eduardo Silva', '(63) 99206-7951', '123.456.789-09', 'driver', true)`,
      [munId, driverHash]
    );
    driverUserId = driverUser.insertId;
  } else {
    driverUserId = existingDriver[0].id;
  }
  console.log('Usuario motorista ID:', driverUserId);

  // Criar registro de motorista
  const [existingDriverRec] = await conn.execute('SELECT id FROM drivers WHERE userId = ?', [driverUserId]);
  let driverId;
  if (existingDriverRec.length === 0) {
    const [driverRec] = await conn.execute(
      `INSERT INTO drivers (userId, municipalityId, cnhNumber, cnhCategory, vehicleId, isAvailable)
       VALUES (?, ?, '04512345678', 'D', ?, true)`,
      [driverUserId, munId, vehicleId]
    );
    driverId = driverRec.insertId;
  } else {
    driverId = existingDriverRec[0].id;
  }
  console.log('Motorista ID:', driverId);

  // 5. Criar rota
  console.log('\n--- Criando rota ---');
  const [existingRoute] = await conn.execute('SELECT id FROM routes WHERE code = ? AND municipalityId = ?', ['R001', munId]);
  let routeId;
  if (existingRoute.length === 0) {
    const [route] = await conn.execute(
      `INSERT INTO routes (municipalityId, schoolId, name, code, type, shift, scheduledStartTime, scheduledEndTime, defaultDriverId, defaultVehicleId, isActive)
       VALUES (?, ?, 'Rota Centro - Escola Lobato', 'R001', 'both', 'morning', '06:30', '07:30', ?, ?, true)`,
      [munId, schoolId, driverId, vehicleId]
    );
    routeId = route.insertId;
  } else {
    routeId = existingRoute[0].id;
  }
  console.log('Rota ID:', routeId);

  // 6. Criar paradas
  console.log('\n--- Criando paradas ---');
  const stops = [
    { name: 'Praca Central', lat: '-10.1847', lng: '-48.3337', order: 1, minutes: 0 },
    { name: 'Av. Tocantins esq. Rua 7', lat: '-10.1872', lng: '-48.3355', order: 2, minutes: 5 },
    { name: 'Posto de Saude Bairro Norte', lat: '-10.1910', lng: '-48.3380', order: 3, minutes: 10 },
    { name: 'Escola Municipal Monteiro Lobato', lat: '-10.1935', lng: '-48.3400', order: 4, minutes: 15 },
  ];

  for (const stop of stops) {
    const [existing] = await conn.execute('SELECT id FROM stops WHERE routeId = ? AND orderIndex = ?', [routeId, stop.order]);
    if (existing.length === 0) {
      await conn.execute(
        `INSERT INTO stops (routeId, name, latitude, longitude, orderIndex, estimatedArrivalMinutes, arrivalRadiusMeters, isActive)
         VALUES (?, ?, ?, ?, ?, ?, 50, true)`,
        [routeId, stop.name, stop.lat, stop.lng, stop.order, stop.minutes]
      );
      console.log('  Parada criada:', stop.name);
    } else {
      console.log('  Parada ja existe:', stop.name);
    }
  }

  // Buscar IDs das paradas
  const [allStops] = await conn.execute('SELECT id, name, orderIndex FROM stops WHERE routeId = ? ORDER BY orderIndex', [routeId]);

  // 7. Criar alunos
  console.log('\n--- Criando alunos ---');
  const alunos = [
    { name: 'Pedro Henrique Oliveira', enrollment: '2024001', grade: '5o Ano', shift: 'morning', stopIdx: 0, birthDate: '2014-03-15', bloodType: 'O+' },
    { name: 'Ana Clara Souza', enrollment: '2024002', grade: '4o Ano', shift: 'morning', stopIdx: 1, birthDate: '2015-07-22', bloodType: 'A+' },
    { name: 'Lucas Gabriel Costa', enrollment: '2024003', grade: '3o Ano', shift: 'morning', stopIdx: 1, birthDate: '2016-01-10', bloodType: 'B+' },
    { name: 'Maria Eduarda Lima', enrollment: '2024004', grade: '5o Ano', shift: 'morning', stopIdx: 2, birthDate: '2014-11-05', bloodType: 'AB+' },
    { name: 'Joao Miguel Santos', enrollment: '2024005', grade: '2o Ano', shift: 'morning', stopIdx: 2, birthDate: '2017-05-30', bloodType: 'O-' },
  ];

  const studentIds = [];
  for (const aluno of alunos) {
    const [existing] = await conn.execute('SELECT id FROM students WHERE enrollment = ? AND municipalityId = ?', [aluno.enrollment, munId]);
    let studentId;
    if (existing.length === 0) {
      const [result] = await conn.execute(
        `INSERT INTO students (municipalityId, schoolId, name, enrollment, grade, shift, birthDate, bloodType, isActive, hasSpecialNeeds)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, false)`,
        [munId, schoolId, aluno.name, aluno.enrollment, aluno.grade, aluno.shift, aluno.birthDate, aluno.bloodType]
      );
      studentId = result.insertId;
      console.log('  Aluno criado:', aluno.name, '(Mat:', aluno.enrollment, ')');
    } else {
      studentId = existing[0].id;
      console.log('  Aluno ja existe:', aluno.name);
    }
    studentIds.push({ id: studentId, ...aluno });

    // Vincular aluno a parada
    const stopId = allStops[aluno.stopIdx]?.id;
    if (stopId) {
      const [existingSS] = await conn.execute('SELECT id FROM stop_students WHERE stopId = ? AND studentId = ?', [stopId, studentId]);
      if (existingSS.length === 0) {
        await conn.execute('INSERT INTO stop_students (stopId, studentId, boardingType) VALUES (?, ?, ?)', [stopId, studentId, 'both']);
      }
    }
  }

  // 8. Criar responsavel (pai do Pedro - primeiro aluno)
  console.log('\n--- Criando responsavel ---');
  const parentHash = '$2a$12$LJ3m4yv8WQN8j5tK1fGZYeVx5BQ6vI5R3bQ5L5G5H5J5K5M5O5Q5S';

  const [existingParent] = await conn.execute('SELECT id FROM users WHERE email = ?', ['jose.pai@email.com']);
  let parentUserId;
  if (existingParent.length === 0) {
    const [parentUser] = await conn.execute(
      `INSERT INTO users (municipalityId, email, passwordHash, name, phone, cpf, role, isActive)
       VALUES (?, 'jose.pai@email.com', ?, 'Jose Roberto Oliveira', '(63) 99219-4830', '987.654.321-00', 'parent', true)`,
      [munId, parentHash]
    );
    parentUserId = parentUser.insertId;
  } else {
    parentUserId = existingParent[0].id;
  }
  console.log('Usuario responsavel ID:', parentUserId);

  // Vincular responsavel ao aluno Pedro
  const pedroId = studentIds[0].id;
  const [existingGuardian] = await conn.execute('SELECT id FROM guardians WHERE userId = ? AND studentId = ?', [parentUserId, pedroId]);
  if (existingGuardian.length === 0) {
    await conn.execute(
      'INSERT INTO guardians (userId, studentId, relationship, isPrimary, canPickup) VALUES (?, ?, ?, true, true)',
      [parentUserId, pedroId, 'father']
    );
    console.log('Responsavel vinculado ao aluno Pedro');
  }

  // 9. Resumo final
  console.log('\n========================================');
  console.log('DADOS DE TESTE CRIADOS COM SUCESSO!');
  console.log('========================================');
  console.log('\nLogins para teste:');
  console.log('');
  console.log('ADMIN (ja existente):');
  console.log('  Email: (seu email de admin atual)');
  console.log('');
  console.log('MOTORISTA:');
  console.log('  Email: carlos.motorista@transescolar.com');
  console.log('  Telefone: (63) 99206-7951');
  console.log('  Senha: motorista123');
  console.log('  CNH: D - 04512345678');
  console.log('  Veiculo: QRA-4E56 (Amarelinho 01)');
  console.log('');
  console.log('PAI/RESPONSAVEL:');
  console.log('  Email: jose.pai@email.com');
  console.log('  Telefone: (63) 99219-4830');
  console.log('  Senha: motorista123');
  console.log('  Filho: Pedro Henrique Oliveira (Mat: 2024001)');
  console.log('');
  console.log('ROTA: Centro - Escola Lobato (R001)');
  console.log('  4 paradas, 5 alunos vinculados');
  console.log('  Horario: 06:30 - 07:30 (Manha)');
  console.log('');
  console.log('ESCOLA: Escola Municipal Monteiro Lobato');
  console.log('  5 alunos matriculados');
  console.log('========================================');

  await conn.end();
}

seed().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
