// ============================================
// SCRIPT DE DADOS DE TESTE - NetEscol
// Insere disciplinas, avaliações e notas para testar relatórios
// Executar: node seed-test-data.js
// Para resetar: node seed-test-data.js --reset
// ============================================

const mysql = require('mysql2/promise');

const DB_URL = 'mysql://root:iXNAoBMhgUaQTHsLMqPyGlchTOkPEdJL@crossover.proxy.rlwy.net:52525/railway';

const DISCIPLINAS = [
  { name: 'Língua Portuguesa', code: 'PORT' },
  { name: 'Matemática', code: 'MAT' },
  { name: 'Ciências', code: 'CIE' },
  { name: 'História', code: 'HIS' },
  { name: 'Geografia', code: 'GEO' },
  { name: 'Educação Física', code: 'EDF' },
  { name: 'Artes', code: 'ART' },
  { name: 'Ensino Religioso', code: 'ER' },
  { name: 'Língua Inglesa', code: 'ING' },
];

// Gera nota aleatória entre min e max
function nota(min, max) {
  return +(min + Math.random() * (max - min)).toFixed(1);
}

async function seed() {
  const conn = await mysql.createConnection(DB_URL);
  const isReset = process.argv.includes('--reset');

  if (isReset) {
    console.log('🗑️  Resetando dados de teste...');
    await conn.execute("DELETE FROM student_grades WHERE notes = 'DADO_TESTE'");
    await conn.execute("DELETE FROM assessments WHERE description = 'DADO_TESTE'");
    await conn.execute("DELETE FROM class_subjects WHERE weeklyHours > 0 AND classId IN (SELECT id FROM classes WHERE isActive = 1)");
    // Não deletar disciplinas pois Matemática já existia
    console.log('✅ Dados de teste removidos!');
    await conn.end();
    return;
  }

  console.log('🌱 Inserindo dados de teste...\n');

  // 1. Buscar município
  const [muns] = await conn.execute('SELECT id FROM municipalities LIMIT 1');
  const munId = muns[0]?.id || 1;

  // 2. Inserir disciplinas (pular se já existem)
  console.log('📚 Inserindo disciplinas...');
  const subjectIds = {};
  for (const d of DISCIPLINAS) {
    const [existing] = await conn.execute('SELECT id FROM subjects WHERE name = ? AND municipalityId = ?', [d.name, munId]);
    if (existing.length > 0) {
      subjectIds[d.code] = existing[0].id;
      console.log(`   ✓ ${d.name} (já existe, id=${existing[0].id})`);
    } else {
      const [result] = await conn.execute('INSERT INTO subjects (municipalityId, name, code, isActive) VALUES (?, ?, ?, 1)', [munId, d.name, d.code]);
      subjectIds[d.code] = result.insertId;
      console.log(`   + ${d.name} (id=${result.insertId})`);
    }
  }

  // 3. Buscar turmas e alunos
  const [classes] = await conn.execute('SELECT id, name, fullName, schoolId FROM classes WHERE isActive = 1 AND municipalityId = ?', [munId]);
  const [students] = await conn.execute('SELECT id, name, schoolId FROM students WHERE isActive = 1 AND municipalityId = ?', [munId]);
  const [enrollments] = await conn.execute('SELECT id, studentId, classId FROM enrollments WHERE isActive = 1 AND municipalityId = ?', [munId]);

  console.log(`\n📋 ${classes.length} turma(s), ${students.length} aluno(s), ${enrollments.length} matrícula(s)`);

  if (classes.length === 0) {
    console.log('❌ Nenhuma turma encontrada. Crie turmas primeiro.');
    await conn.end();
    return;
  }

  // 4. Vincular disciplinas às turmas
  console.log('\n🔗 Vinculando disciplinas às turmas...');
  for (const cls of classes) {
    for (const d of DISCIPLINAS) {
      const sId = subjectIds[d.code];
      const [existing] = await conn.execute('SELECT id FROM class_subjects WHERE classId = ? AND subjectId = ?', [cls.id, sId]);
      if (existing.length === 0) {
        const hours = ['MAT', 'PORT'].includes(d.code) ? 5 : ['CIE', 'HIS', 'GEO'].includes(d.code) ? 3 : 2;
        await conn.execute('INSERT INTO class_subjects (classId, subjectId, weeklyHours, isActive) VALUES (?, ?, ?, 1)', [cls.id, sId, hours]);
      }
    }
    console.log(`   ✓ Turma ${cls.fullName || cls.name}: ${DISCIPLINAS.length} disciplinas`);
  }

  // 5. Criar avaliações e notas para cada turma/bimestre
  console.log('\n📝 Criando avaliações e notas...');
  let totalNotas = 0;

  for (const cls of classes) {
    // Alunos desta turma
    const alunosDaTurma = enrollments.filter(e => e.classId === cls.id).map(e => e.studentId);
    if (alunosDaTurma.length === 0) continue;

    for (const d of DISCIPLINAS) {
      const sId = subjectIds[d.code];

      for (const bim of ['1', '2', '3', '4']) {
        // Criar avaliação
        const [assResult] = await conn.execute(
          "INSERT INTO assessments (municipalityId, classId, subjectId, name, assessmentType, maxScore, weight, bimester, description, isActive) VALUES (?, ?, ?, ?, 'prova', 10.00, 1.00, ?, 'DADO_TESTE', 1)",
          [munId, cls.id, sId, `Avaliação ${bim}º Bim - ${d.name}`, bim]
        );
        const assId = assResult.insertId;

        // Inserir notas para cada aluno
        for (const stId of alunosDaTurma) {
          // Notas realistas: maioria entre 5 e 10, alguns abaixo
          const score = Math.random() < 0.15 ? nota(2, 5.5) : nota(5.5, 10);
          await conn.execute(
            "INSERT INTO student_grades (assessmentId, studentId, score, notes, registeredByUserId) VALUES (?, ?, ?, 'DADO_TESTE', 1)",
            [assId, stId, score]
          );
          totalNotas++;
        }
      }
    }
    console.log(`   ✓ Turma ${cls.fullName || cls.name}: ${alunosDaTurma.length} aluno(s) × ${DISCIPLINAS.length} disciplinas × 4 bimestres`);
  }

  // 6. Atualizar dados dos alunos para teste
  console.log('\n👤 Atualizando dados dos alunos...');
  const dadosTeste = [
    { id: 1, nationality: 'Brasileira', naturalness: 'Palmas', naturalnessUf: 'TO', sex: 'M', fatherName: 'Carlos Eduardo Oliveira', motherName: 'Maria José Oliveira', cpf: '529.982.247-25' },
    { id: 2, nationality: 'Brasileira', naturalness: 'Fátima', naturalnessUf: 'TO', sex: 'F', fatherName: 'José Roberto Souza', motherName: 'Ana Paula Souza', cpf: '123.456.789-09' },
    { id: 3, nationality: 'Brasileira', naturalness: 'Paraíso do Tocantins', naturalnessUf: 'TO', sex: 'M', fatherName: 'Fernando Costa', motherName: 'Claudia Costa' },
    { id: 4, nationality: 'Brasileira', naturalness: 'Gurupi', naturalnessUf: 'TO', sex: 'F', fatherName: 'Roberto Lima', motherName: 'Sandra Lima' },
    { id: 5, nationality: 'Brasileira', naturalness: 'Porto Nacional', naturalnessUf: 'TO', sex: 'M', fatherName: 'Marcos Santos', motherName: 'Luciana Santos' },
  ];
  for (const d of dadosTeste) {
    try {
      await conn.execute(
        'UPDATE students SET nationality = ?, naturalness = ?, naturalnessUf = ?, sex = ?, fatherName = ?, motherName = ? WHERE id = ?',
        [d.nationality, d.naturalness, d.naturalnessUf, d.sex, d.fatherName, d.motherName, d.id]
      );
      if (d.cpf) {
        await conn.execute('UPDATE students SET cpf = ? WHERE id = ?', [d.cpf, d.id]);
      }
    } catch {}
  }

  console.log(`\n✅ Dados de teste inseridos com sucesso!`);
  console.log(`   📚 ${Object.keys(subjectIds).length} disciplinas`);
  console.log(`   📝 ${totalNotas} notas lançadas`);
  console.log(`   👤 ${dadosTeste.length} alunos atualizados`);
  console.log(`\n💡 Para resetar: node seed-test-data.js --reset`);

  await conn.end();
}

seed().catch(e => { console.error('Erro:', e.message); process.exit(1); });
