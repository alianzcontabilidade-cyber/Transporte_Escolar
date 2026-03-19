import { generateReportHTML, ReportMunicipality, ReportSecretaria, ReportSchool, printReportHTML, openReportAsPDF } from './reportTemplate';
import { Signatory } from '../components/ReportSignatureSelector';

const MONTHS = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function formatDate(d: string | Date | undefined): string {
  if (!d) return '--';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  return `${dt.getDate().toString().padStart(2,'0')}/${(dt.getMonth()+1).toString().padStart(2,'0')}/${dt.getFullYear()}`;
}

function formatDateFull(d: string | Date | undefined): string {
  if (!d) return '--';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dt.getTime())) return String(d);
  return `${dt.getDate()} de ${MONTHS[dt.getMonth()]} de ${dt.getFullYear()}`;
}

function field(label: string, value: string | undefined | null): string {
  return `<div class="field-row"><span class="field-label">${label}</span><span class="field-value">${value || '--'}</span></div>`;
}

function shiftLabel(s: string): string {
  return s === 'morning' ? 'MATUTINO' : s === 'afternoon' ? 'VESPERTINO' : s === 'evening' ? 'NOTURNO' : (s || '--');
}

// ==========================================
// DECLARACAO DE ESCOLARIDADE
// ==========================================
export function generateDeclaracaoEscolaridade(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  const content = `
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${student.name || 'ALUNO'}</b>,
      ${student.motherName ? 'filho(a) de <b>' + student.motherName + '</b>' : ''}
      ${student.fatherName ? ' e de <b>' + student.fatherName + '</b>' : ''},
      nascido(a) em <b>${formatDateFull(student.birthDate)}</b>,
      ${student.naturalness ? 'natural de <b>' + student.naturalness + (student.naturalnessUf ? '/' + student.naturalnessUf : '') + '</b>,' : ''}
      e aluno(a) deste Estabelecimento de Ensino, esta cursando o(a) <b>${student.grade || '--'}</b>
      do turno <b>${shiftLabel(student.shift)}</b>,
      no ano letivo de <b>${new Date().getFullYear()}</b>,
      com Matricula N. <b>${student.enrollment || '--'}</b>.
    </p>
    <p class="declaration-text">
      Declaramos ainda que o(a) referido(a) aluno(a) encontra-se com a situacao academica regular
      nesta instituicao de ensino, nada constando que o(a) desabone.
    </p>
    ${student.nis ? `<div style="margin-top:20px;font-size:11px;color:#666"><b>NIS:</b> ${student.nis}</div>` : ''}
    ${student.code || school?.code ? `<div style="font-size:11px;color:#666"><b>INEP:</b> ${school?.code || ''}</div>` : ''}
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'DECLARACAO DE ESCOLARIDADE',
    content, signatories: sigs, fontFamily: 'serif', fontSize: 13,
  });
}

// ==========================================
// DECLARACAO DE TRANSFERENCIA
// ==========================================
export function generateDeclaracaoTransferencia(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[],
  destSchool?: string
) {
  const content = `
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${student.name || 'ALUNO'}</b>,
      nascido(a) em <b>${formatDateFull(student.birthDate)}</b>,
      ${student.naturalness ? 'em <b>' + student.naturalness + (student.naturalnessUf ? '/' + student.naturalnessUf : '') + '</b>,' : ''}
      ${student.motherName ? 'filho(a) de <b>' + student.motherName + '</b>' : ''}
      ${student.fatherName ? ' e de <b>' + student.fatherName + '</b>' : ''},
      cursou neste Estabelecimento de Ensino, no ano letivo de <b>${new Date().getFullYear()}</b>,
      o(a) <b>${student.grade || '--'}</b>, no turno <b>${shiftLabel(student.shift)}</b>,
      tendo sido considerado(a): <b>${student.studentStatus ? student.studentStatus.toUpperCase() : 'APTO(A) PARA TRANSFERENCIA'}</b>.
    </p>
    ${destSchool ? `<p class="declaration-text" style="text-indent:0"><b>TRANSFERIR PARA:</b> ${destSchool}</p>` : ''}
    ${student.nis ? `<div style="margin-top:20px;font-size:11px;color:#666"><b>NIS:</b> ${student.nis} &nbsp;&nbsp; <b>Matricula:</b> ${student.enrollment || '--'}</div>` : ''}
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'DECLARACAO DE TRANSFERENCIA',
    content, signatories: sigs, fontFamily: 'serif', fontSize: 13,
  });
}

// ==========================================
// DECLARACAO DE FREQUENCIA
// ==========================================
export function generateDeclaracaoFrequencia(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[],
  percentual?: number
) {
  const content = `
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${student.name || 'ALUNO'}</b>,
      matricula <b>${student.enrollment || '--'}</b>,
      e aluno(a) regularmente matriculado(a) neste Estabelecimento de Ensino,
      no(a) <b>${student.grade || '--'}</b>, turno <b>${shiftLabel(student.shift)}</b>,
      e que frequenta regularmente as aulas no corrente ano letivo de <b>${new Date().getFullYear()}</b>.
    </p>
    ${percentual !== undefined ? `<p class="declaration-text">Percentual de frequencia: <b>${percentual.toFixed(1)}%</b>.</p>` : ''}
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'DECLARACAO DE FREQUENCIA',
    content, signatories: sigs, fontFamily: 'serif', fontSize: 13,
  });
}

// ==========================================
// BOLETIM ESCOLAR
// ==========================================
export function generateBoletimEscolar(
  student: any, grades: any[], school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[],
  anoLetivo?: number
) {
  const year = anoLetivo || new Date().getFullYear();

  // Student info box
  let info = `<div class="student-info">
    <div class="si-name">${student.name || 'ALUNO'}</div>
    <div class="si-detail">Matricula: ${student.enrollment || '--'} | Serie: ${student.grade || '--'} | Turma: ${student.classRoom || student.className || '--'} | Turno: ${shiftLabel(student.shift)}</div>
    <div class="si-detail">Ano Letivo: ${year}${student.birthDate ? ' | Nascimento: ' + formatDate(student.birthDate) : ''}</div>
  </div>`;

  // Grades table
  let rows = '';
  let sumMD = 0, countMD = 0;
  for (const g of grades) {
    const b1 = g.b1 ?? g.bim1 ?? '--';
    const b2 = g.b2 ?? g.bim2 ?? '--';
    const b3 = g.b3 ?? g.bim3 ?? '--';
    const b4 = g.b4 ?? g.bim4 ?? '--';
    const vals = [b1, b2, b3, b4].map(v => typeof v === 'number' ? v : parseFloat(v));
    const validVals = vals.filter(v => !isNaN(v));
    const md = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : null;
    const ft = g.faltas ?? g.absences ?? '--';
    const situacao = md !== null ? (md >= 6 ? 'Aprovado' : md >= 0 ? 'Reprovado' : '--') : '--';
    const sitClass = situacao === 'Aprovado' ? 'approved' : situacao === 'Reprovado' ? 'failed' : '';

    if (md !== null) { sumMD += md; countMD++; }

    rows += `<tr>
      <td style="text-align:left;font-weight:500">${g.subject || g.disciplina || '--'}</td>
      <td>${typeof b1 === 'number' ? b1.toFixed(1) : b1}</td>
      <td>${typeof b2 === 'number' ? b2.toFixed(1) : b2}</td>
      <td>${typeof b3 === 'number' ? b3.toFixed(1) : b3}</td>
      <td>${typeof b4 === 'number' ? b4.toFixed(1) : b4}</td>
      <td style="font-weight:bold;background:#f0f4f8">${md !== null ? md.toFixed(1) : '--'}</td>
      <td>${ft}</td>
      <td class="${sitClass}">${situacao}</td>
    </tr>`;
  }

  // Total row
  const mediaGeral = countMD > 0 ? (sumMD / countMD).toFixed(1) : '--';
  const resultadoFinal = countMD > 0 && (sumMD / countMD) >= 6 ? 'APROVADO(A)' : countMD > 0 ? 'REPROVADO(A)' : '--';

  const table = `
    <table class="grade-table">
      <thead><tr>
        <th style="text-align:left;min-width:160px">DISCIPLINAS / ATIVIDADES</th>
        <th>1 BIM</th><th>2 BIM</th><th>3 BIM</th><th>4 BIM</th>
        <th style="background:#15304d">MEDIA</th>
        <th>FALTAS</th>
        <th>SITUACAO</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total-row">
        <td style="text-align:right" colspan="5"><b>MEDIA GERAL</b></td>
        <td style="font-weight:bold;background:#e0f2fe">${mediaGeral}</td>
        <td></td>
        <td style="font-weight:bold">${resultadoFinal}</td>
      </tr></tfoot>
    </table>
    <div style="margin-top:15px;font-size:10px;color:#888">
      <b>Legenda:</b> BIM = Bimestre | MEDIA = Media Aritmetica dos Bimestres | FALTAS = Total de faltas no ano<br>
      Aluno(a) considerado(a) <b>APROVADO(A)</b> quando a media final for igual ou superior a <b>6,0</b> (seis) e frequencia minima de <b>75%</b>.
    </div>
    <div style="margin-top:10px;font-size:11px;color:#555;font-style:italic;text-align:center">
      "Pais, a sua participacao na escola e muito significativa, pois contribui para uma gestao democratica e qualidade no ensino."
    </div>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'BOLETIM ESCOLAR',
    subtitle: `Ano Letivo ${year}`,
    content: info + table,
    signatories: sigs, fontFamily: 'sans-serif', fontSize: 12,
  });
}

// ==========================================
// HISTORICO ESCOLAR
// ==========================================
export function generateHistoricoEscolar(
  student: any, history: { year: number; grade: string; school: string; result: string; grades?: any[] }[],
  school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  // Student data section
  const studentData = `
    <div class="section-title">DADOS DO ALUNO</div>
    <div class="field-grid">
      ${field('Nome', student.name)}
      ${field('Data Nascimento', formatDate(student.birthDate))}
      ${field('Sexo', student.sex === 'M' ? 'Masculino' : student.sex === 'F' ? 'Feminino' : '--')}
      ${field('Nacionalidade', student.nationality)}
      ${field('Naturalidade', (student.naturalness || '') + (student.naturalnessUf ? '/' + student.naturalnessUf : ''))}
      ${field('CPF', student.cpf)}
      ${field('RG', student.rg ? student.rg + (student.rgOrgao ? ' - ' + student.rgOrgao + '/' + (student.rgUf || '') : '') : '--')}
      ${field('NIS', student.nis)}
    </div>
    <div class="section-title">FILIACAO</div>
    <div class="field-grid">
      ${field('Pai', student.fatherName)}
      ${field('Mae', student.motherName)}
    </div>
  `;

  // History table
  let historyRows = '';
  for (const h of history) {
    const resultClass = h.result?.toLowerCase().includes('aprov') ? 'approved' :
                        h.result?.toLowerCase().includes('reprov') ? 'failed' : '';
    historyRows += `<tr>
      <td>${h.year}</td>
      <td style="text-align:left">${h.grade}</td>
      <td style="text-align:left">${h.school}</td>
      <td class="${resultClass}">${h.result || '--'}</td>
    </tr>`;
  }

  const historyTable = `
    <div class="section-title">HISTORICO DE ESCOLARIDADE</div>
    <table>
      <thead><tr><th>ANO</th><th style="text-align:left">SERIE/ANO</th><th style="text-align:left">ESTABELECIMENTO</th><th>RESULTADO</th></tr></thead>
      <tbody>${historyRows || '<tr><td colspan="4" style="color:#999">Nenhum registro encontrado</td></tr>'}</tbody>
    </table>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'HISTORICO ESCOLAR',
    content: studentData + historyTable,
    signatories: sigs, fontFamily: 'sans-serif', fontSize: 11,
  });
}

// ==========================================
// FICHA DE MATRICULA
// ==========================================
export function generateFichaMatricula(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  const content = `
    <div class="section-title">DADOS PESSOAIS</div>
    <div class="field-grid">
      ${field('Nome', student.name)}
      ${field('Matricula', student.enrollment)}
      ${field('Data Nascimento', formatDate(student.birthDate))}
      ${field('Sexo', student.sex === 'M' ? 'Masculino' : student.sex === 'F' ? 'Feminino' : '--')}
      ${field('Cor/Raca', student.race)}
      ${field('Nacionalidade', student.nationality)}
      ${field('Naturalidade', (student.naturalness || '') + (student.naturalnessUf ? '/' + student.naturalnessUf : ''))}
      ${field('CPF', student.cpf)}
      ${field('RG', student.rg ? student.rg + ' ' + (student.rgOrgao || '') + '/' + (student.rgUf || '') : '--')}
      ${field('NIS', student.nis)}
      ${field('Cartao SUS', student.cartaoSus)}
    </div>

    <div class="section-title">CERTIDAO DE NASCIMENTO</div>
    <div class="field-grid">
      ${field('Tipo', student.certidaoTipo)}
      ${field('Numero', student.certidaoNumero)}
      ${field('Folha', student.certidaoFolha)}
      ${field('Livro', student.certidaoLivro)}
      ${field('Data Emissao', student.certidaoData)}
      ${field('Cartorio', student.certidaoCartorio)}
    </div>

    <div class="section-title">SITUACAO ESCOLAR</div>
    <div class="field-grid">
      ${field('Escola', school?.name || '--')}
      ${field('Serie/Ano', student.grade)}
      ${field('Turma', student.classRoom || student.className)}
      ${field('Turno', shiftLabel(student.shift))}
      ${field('Tipo Matricula', student.enrollmentType === 'novato' ? 'Novato (Primeira Matricula)' : student.enrollmentType === 'renovacao' ? 'Renovacao' : student.enrollmentType === 'transferencia' ? 'Transferencia' : '--')}
      ${field('Situacao', student.studentStatus)}
    </div>

    <div class="section-title">ENDERECO</div>
    <div class="field-grid">
      ${field('Logradouro', student.address)}
      ${field('Numero', student.addressNumber)}
      ${field('Complemento', student.addressComplement)}
      ${field('Bairro', student.neighborhood)}
      ${field('CEP', student.cep)}
      ${field('Cidade/UF', (student.city || '') + (student.state ? '/' + student.state : ''))}
      ${field('Zona', student.zone === 'rural' ? 'Rural' : 'Urbana')}
      ${field('Telefone', student.phone)}
      ${field('Celular', student.cellPhone)}
    </div>

    <div class="section-title">FILIACAO - PAI</div>
    <div class="field-grid">
      ${field('Nome', student.fatherName)}
      ${field('CPF', student.fatherCpf)}
      ${field('RG', student.fatherRg)}
      ${field('Telefone', student.fatherPhone)}
      ${field('Profissao', student.fatherProfession)}
      ${field('Local Trabalho', student.fatherWorkplace)}
      ${field('Escolaridade', student.fatherEducation)}
      ${field('Naturalidade', (student.fatherNaturalness || '') + (student.fatherNaturalnessUf ? '/' + student.fatherNaturalnessUf : ''))}
    </div>

    <div class="section-title">FILIACAO - MAE</div>
    <div class="field-grid">
      ${field('Nome', student.motherName)}
      ${field('CPF', student.motherCpf)}
      ${field('RG', student.motherRg)}
      ${field('Telefone', student.motherPhone)}
      ${field('Profissao', student.motherProfession)}
      ${field('Local Trabalho', student.motherWorkplace)}
      ${field('Escolaridade', student.motherEducation)}
      ${field('Naturalidade', (student.motherNaturalness || '') + (student.motherNaturalnessUf ? '/' + student.motherNaturalnessUf : ''))}
    </div>

    <div class="section-title">INFORMACOES COMPLEMENTARES</div>
    <div class="field-grid">
      ${field('Renda Familiar', student.familyIncome)}
      ${field('Tipo Sanguineo', student.bloodType)}
      ${field('Alergias', student.allergies)}
      ${field('Medicamentos', student.medications)}
      ${field('Transporte Escolar', student.needsTransport ? 'Sim - ' + (student.transportType || '') + ' ' + (student.transportDistance ? student.transportDistance + ' km' : '') : 'Nao')}
      ${field('Bolsa Familia', student.bolsaFamilia ? 'Sim' : 'Nao')}
      ${field('BPC', student.bpc ? 'Sim' : 'Nao')}
      ${field('Deficiencia', student.hasSpecialNeeds ? (student.deficiencyType || 'Sim') : 'Nao')}
    </div>

    <div class="section-title">PROCEDENCIA</div>
    <div class="field-grid">
      ${field('Escola Anterior', student.previousSchool)}
      ${field('Rede', student.previousSchoolType)}
      ${field('Zona', student.previousSchoolZone)}
      ${field('Cidade/UF', (student.previousCity || '') + (student.previousState ? '/' + student.previousState : ''))}
    </div>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'FICHA DE MATRICULA',
    subtitle: student.enrollmentType === 'novato' ? 'NOVATO (PRIMEIRA MATRICULA)' : student.enrollmentType === 'renovacao' ? 'RENOVACAO DE MATRICULA' : 'MATRICULA POR TRANSFERENCIA',
    content, signatories: sigs, fontFamily: 'sans-serif', fontSize: 11,
  });
}

// ==========================================
// RELACAO DE ALUNOS POR TURMA
// ==========================================
export function generateRelacaoAlunosTurma(
  students: any[], classInfo: { grade: string; className: string; shift: string; year: number },
  school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  const info = `<div class="student-info">
    <div class="si-name">Turma: ${classInfo.grade} - ${classInfo.className}</div>
    <div class="si-detail">Turno: ${shiftLabel(classInfo.shift)} | Ano Letivo: ${classInfo.year} | Total: ${students.length} aluno(s)</div>
  </div>`;

  let rows = '';
  let totalM = 0, totalF = 0;
  students.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
  students.forEach((s: any, i: number) => {
    if (s.sex === 'M') totalM++; else if (s.sex === 'F') totalF++;
    rows += `<tr>
      <td>${i + 1}</td>
      <td style="text-align:left;font-weight:500">${s.name || '--'}</td>
      <td>${s.enrollment || '--'}</td>
      <td>${formatDate(s.birthDate)}</td>
      <td>${s.sex || '--'}</td>
      <td>${s.studentStatus || '--'}</td>
    </tr>`;
  });

  const table = `
    <table>
      <thead><tr><th style="width:40px">N</th><th style="text-align:left">NOME DO ALUNO</th><th>MATRICULA</th><th>NASCIMENTO</th><th>SEXO</th><th>SITUACAO</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:15px;font-size:11px;display:flex;gap:30px">
      <span><b>Total:</b> ${students.length} aluno(s)</span>
      <span><b>Masculino:</b> ${totalM}</span>
      <span><b>Feminino:</b> ${totalF}</span>
    </div>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'RELACAO DE ALUNOS MATRICULADOS POR TURMA',
    subtitle: `${classInfo.grade} - Turma ${classInfo.className} - ${shiftLabel(classInfo.shift)} - ${classInfo.year}`,
    content: info + table,
    signatories: sigs, fontFamily: 'sans-serif', fontSize: 11,
  });
}

// Reexport for convenience
export { printReportHTML, openReportAsPDF };
