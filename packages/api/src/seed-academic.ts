import * as dotenv from 'dotenv';
dotenv.config();
import { db } from './db/index';
import { classes, subjects, classSubjects, enrollments, assessments, studentGrades, dailyAttendance } from './db/schema';
import { eq, and } from 'drizzle-orm';

async function seed() {
  console.log('Seeding academic data...');
  const MUN_ID = 1;
  const YEAR = 2026;

  // Alunos: 1=Pedro (school 2), 2=Ana Clara (school 3), 3=Lucas (school 2)
  const studentsData = [
    { id: 1, name: 'Pedro Henrique Oliveira', schoolId: 2, grade: '8º ANO' },
    { id: 2, name: 'Ana Clara Souza', schoolId: 3, grade: '8º ANO' },
    { id: 3, name: 'Lucas Gabriel Costa', schoolId: 2, grade: '8º ANO' },
  ];

  // Criar turmas
  const classesData = [
    { schoolId: 2, grade: '8º ANO', name: 'A', shift: 'morning', year: YEAR, municipalityId: MUN_ID },
    { schoolId: 3, grade: '8º ANO', name: 'A', shift: 'morning', year: YEAR, municipalityId: MUN_ID },
  ];

  for (const c of classesData) {
    try {
      const existing = await db.select().from(classes).where(and(eq(classes.schoolId, c.schoolId), eq(classes.grade, c.grade), eq(classes.year, c.year))).limit(1);
      if (existing.length === 0) {
        await db.insert(classes).values(c as any);
        console.log(`  Turma ${c.grade} ${c.name} criada (escola ${c.schoolId})`);
      }
    } catch (e: any) { console.log('  Skip turma:', e.message?.substring(0, 60)); }
  }

  // Buscar turmas criadas
  const allClasses = await db.select().from(classes).where(eq(classes.municipalityId, MUN_ID));
  console.log(`  ${allClasses.length} turma(s) encontrada(s)`);

  // Criar disciplinas
  const subjectNames = ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Inglês', 'Educação Física', 'Artes'];
  for (const name of subjectNames) {
    try {
      const existing = await db.select().from(subjects).where(and(eq(subjects.name, name), eq(subjects.municipalityId, MUN_ID))).limit(1);
      if (existing.length === 0) {
        await db.insert(subjects).values({ name, municipalityId: MUN_ID } as any);
        console.log(`  Disciplina ${name} criada`);
      }
    } catch (e: any) { console.log('  Skip disciplina:', e.message?.substring(0, 60)); }
  }

  const allSubjects = await db.select().from(subjects).where(eq(subjects.municipalityId, MUN_ID));
  console.log(`  ${allSubjects.length} disciplina(s)`);

  // Vincular disciplinas às turmas
  for (const cls of allClasses) {
    for (const subj of allSubjects) {
      try {
        const existing = await db.select().from(classSubjects).where(and(eq(classSubjects.classId, cls.id), eq(classSubjects.subjectId, subj.id))).limit(1);
        if (existing.length === 0) {
          await db.insert(classSubjects).values({ classId: cls.id, subjectId: subj.id } as any);
        }
      } catch {}
    }
  }
  console.log('  Disciplinas vinculadas às turmas');

  // Matricular alunos
  for (const s of studentsData) {
    const cls = allClasses.find(c => c.schoolId === s.schoolId && c.grade === s.grade);
    if (!cls) continue;
    try {
      const existing = await db.select().from(enrollments).where(and(eq(enrollments.studentId, s.id), eq(enrollments.classId, cls.id))).limit(1);
      if (existing.length === 0) {
        await db.insert(enrollments).values({ studentId: s.id, classId: cls.id, municipalityId: MUN_ID, schoolId: s.schoolId, year: YEAR, status: 'active' } as any);
        console.log(`  ${s.name} matriculado na turma ${cls.grade} ${cls.name}`);
      }
    } catch (e: any) { console.log('  Skip matrícula:', e.message?.substring(0, 60)); }
  }

  // Criar avaliações (4 bimestres, por disciplina)
  for (const cls of allClasses) {
    for (const subj of allSubjects) {
      for (let bim = 1; bim <= 4; bim++) {
        const assName = `Avaliação ${bim}º Bimestre`;
        try {
          const existing = await db.select().from(assessments).where(and(eq(assessments.classId, cls.id), eq(assessments.subjectId, subj.id), eq(assessments.bimester, bim))).limit(1);
          if (existing.length === 0) {
            await db.insert(assessments).values({
              classId: cls.id, subjectId: subj.id, name: assName, type: 'exam',
              bimester: bim, maxScore: 10, weight: 1, isActive: true, municipalityId: MUN_ID,
            } as any);
          }
        } catch {}
      }
    }
  }
  const allAssessments = await db.select().from(assessments).where(eq(assessments.municipalityId, MUN_ID));
  console.log(`  ${allAssessments.length} avaliação(ões) criada(s)`);

  // Inserir notas para os alunos
  for (const s of studentsData) {
    const cls = allClasses.find(c => c.schoolId === s.schoolId && c.grade === s.grade);
    if (!cls) continue;
    const classAssessments = allAssessments.filter(a => a.classId === cls.id);
    for (const ass of classAssessments) {
      try {
        const existing = await db.select().from(studentGrades).where(and(eq(studentGrades.studentId, s.id), eq(studentGrades.assessmentId, ass.id))).limit(1);
        if (existing.length === 0) {
          const score = Math.round((6 + Math.random() * 4) * 10) / 10; // 6.0 a 10.0
          await db.insert(studentGrades).values({ studentId: s.id, assessmentId: ass.id, score, municipalityId: MUN_ID } as any);
        }
      } catch {}
    }
    console.log(`  Notas de ${s.name}: ${classAssessments.length} avaliações`);
  }

  // Inserir frequência (últimos 30 dias letivos)
  for (const s of studentsData) {
    const cls = allClasses.find(c => c.schoolId === s.schoolId && c.grade === s.grade);
    if (!cls) continue;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue; // Pular finais de semana
      const dateStr = d.toISOString().split('T')[0];
      try {
        const existing = await db.select().from(dailyAttendance).where(and(eq(dailyAttendance.studentId, s.id), eq(dailyAttendance.date, dateStr as any))).limit(1);
        if (existing.length === 0) {
          const status = Math.random() > 0.1 ? 'present' : 'absent'; // 90% presença
          await db.insert(dailyAttendance).values({ studentId: s.id, classId: cls.id, municipalityId: MUN_ID, date: dateStr, status } as any);
        }
      } catch {}
    }
    console.log(`  Frequência de ${s.name}: 30 dias`);
  }

  console.log('Seed academic complete!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
