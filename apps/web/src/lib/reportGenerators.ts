import { generateReportHTML, ReportMunicipality, ReportSecretaria, ReportSchool, printReportHTML, openReportAsPDF } from './reportTemplate';
import { Signatory } from '../components/ReportSignatureSelector';

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

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
  return s === 'morning' ? 'MATUTINO' : s === 'afternoon' ? 'VESPERTINO' : s === 'evening' ? 'NOTURNO' : s === 'full_time' ? 'INTEGRAL' : (s || '--');
}

// ==========================================
// DECLARAÇÃO DE ESCOLARIDADE
// ==========================================

function detectNivelEnsino(grade: string): string {
  if (!grade) return '';
  const g = grade.toLowerCase();
  if (g.includes('berçário') || g.includes('bercario') || g.includes('maternal') || g.includes('jardim') || g.includes('pré') || g.includes('pre') || g.includes('creche') || g.includes('infantil')) return 'EDUCAÇÃO INFANTIL';
  if (g.includes('6º') || g.includes('7º') || g.includes('8º') || g.includes('9º') || g.includes('6 ano') || g.includes('7 ano') || g.includes('8 ano') || g.includes('9 ano')) return 'ENSINO FUNDAMENTAL – 6º ao 9º Ano';
  if (g.includes('1º') || g.includes('2º') || g.includes('3º') || g.includes('4º') || g.includes('5º') || g.includes('1 ano') || g.includes('2 ano') || g.includes('3 ano') || g.includes('4 ano') || g.includes('5 ano')) return 'ENSINO FUNDAMENTAL – 1º ao 5º Ano';
  if (g.includes('médio') || g.includes('medio') || g.includes('1ª série') || g.includes('2ª série') || g.includes('3ª série')) return 'ENSINO MÉDIO';
  if (g.includes('eja') || g.includes('supletivo')) return 'EDUCAÇÃO DE JOVENS E ADULTOS (EJA)';
  return 'ENSINO FUNDAMENTAL';
}

export function generateDeclaracaoEscolaridade(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  const nivelEnsino = detectNivelEnsino(student.grade);
  const year = new Date().getFullYear();
  const sexo = student.sex === 'M' ? 'o' : student.sex === 'F' ? 'a' : 'o(a)';
  const filhoFilha = student.sex === 'M' ? 'filho' : student.sex === 'F' ? 'filha' : 'filho(a)';
  const nascido = student.sex === 'M' ? 'nascido' : student.sex === 'F' ? 'nascida' : 'nascido(a)';
  const naturalidade = student.naturalness
    ? `natural de <b>${student.naturalness}${student.naturalnessUf ? ' – ' + student.naturalnessUf : ''}</b>, `
    : '';

  const content = `
    <p class="declaration-text">
      Declaro para os devidos fins que <b>${student.name || 'ALUNO(A)'}</b>,
      ${filhoFilha} de <b>${student.motherName || 'NOME DA MÃE'}</b>
      ${student.fatherName ? ' e de <b>' + student.fatherName + '</b>' : ''},
      ${naturalidade}${nascido} aos <b>${formatDateFull(student.birthDate)}</b>,
      é alun${sexo} deste Estabelecimento de Ensino, está cursando
      <b>${student.grade || '--'} – ${nivelEnsino || 'ENSINO FUNDAMENTAL'}</b>,
      do turno <b>${shiftLabel(student.shift)}</b>
      no ano letivo de <b>${year}</b>
      Matrícula Nº <b>${student.enrollment || '--'}</b>.
    </p>
    <p class="declaration-text">
      Declaramos, outrossim, que ${sexo === 'o' ? 'o' : 'a'} referid${sexo} alun${sexo} encontra-se com a situação acadêmica
      regular perante esta instituição de ensino, nada constando em seus registros que ${sexo === 'o' ? 'o' : 'a'} desabone.
    </p>
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
    <div style="margin-top:15px;font-size:10px;color:#444;line-height:1.8;border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;background:#fafafa">
      <div style="font-weight:bold;color:#1B3A5C;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">DADOS DO ALUNO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 20px">
        <div><b>Nome:</b> ${student.name || '--'}</div>
        <div><b>Data de Nascimento:</b> ${formatDate(student.birthDate)}</div>
        <div><b>Mãe:</b> ${student.motherName || '--'}</div>
        <div><b>Pai:</b> ${student.fatherName || '--'}</div>
        <div><b>Naturalidade:</b> ${student.naturalness || '--'}${student.naturalnessUf ? '/' + student.naturalnessUf : ''}</div>
        <div><b>Nacionalidade:</b> ${student.nationality || 'Brasileira'}</div>
        <div><b>CPF:</b> ${student.cpf || '--'}</div>
        <div><b>RG:</b> ${student.rg || '--'}${student.rgOrgao ? ' – ' + student.rgOrgao + '/' + (student.rgUf || '') : ''}</div>
        <div><b>NIS:</b> ${student.nis || '--'}</div>
        <div><b>Matrícula:</b> ${student.enrollment || '--'}</div>
        <div><b>Série/Ano:</b> ${student.grade || '--'}</div>
        <div><b>Turno:</b> ${shiftLabel(student.shift)}</div>
      </div>
      ${school?.code ? `<div style="margin-top:4px"><b>ID Censo (INEP):</b> ${school.code}</div>` : ''}
    </div>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'DECLARAÇÃO DE ESCOLARIDADE',
    content, signatories: sigs, fontFamily: 'serif', fontSize: 13,
  });
}

// ==========================================
// DECLARAÇÃO DE TRANSFERÊNCIA
// ==========================================
export function generateDeclaracaoTransferencia(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[],
  destSchool?: string
) {
  const content = `
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${student.name || 'ALUNO(A)'}</b>,
      nascido(a) em <b>${formatDateFull(student.birthDate)}</b>,
      ${student.naturalness ? 'natural de <b>' + student.naturalness + (student.naturalnessUf ? ' – ' + student.naturalnessUf : '') + '</b>,' : ''}
      ${student.motherName ? 'filho(a) de <b>' + student.motherName + '</b>' : ''}
      ${student.fatherName ? ' e de <b>' + student.fatherName + '</b>' : ''},
      esteve regularmente matriculado(a) neste Estabelecimento de Ensino durante o ano letivo de <b>${new Date().getFullYear()}</b>,
      cursando o(a) <b>${student.grade || '--'}</b>, no turno <b>${shiftLabel(student.shift)}</b>,
      tendo obtido o seguinte resultado: <b>${student.studentStatus ? student.studentStatus.toUpperCase() : 'APTO(A) PARA TRANSFERÊNCIA'}</b>.
    </p>
    <p class="declaration-text">
      O(A) aluno(a) acima qualificado(a) encontra-se em condições regulares para efetuar transferência
      para outra unidade de ensino, nada constando que impeça a referida movimentação escolar.
    </p>
    ${destSchool ? `<p class="declaration-text" style="text-indent:0"><b>Escola de destino:</b> ${destSchool}</p>` : ''}
    ${student.nis ? `<div style="margin-top:20px;font-size:11px;color:#555"><b>NIS:</b> ${student.nis} &nbsp;&nbsp; <b>Matrícula:</b> ${student.enrollment || '--'}</div>` : ''}
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'DECLARAÇÃO DE TRANSFERÊNCIA',
    content, signatories: sigs, fontFamily: 'serif', fontSize: 13,
  });
}

// ==========================================
// DECLARAÇÃO DE FREQUÊNCIA
// ==========================================
export function generateDeclaracaoFrequencia(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[],
  percentual?: number
) {
  const content = `
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${student.name || 'ALUNO(A)'}</b>,
      portador(a) da Matrícula nº <b>${student.enrollment || '--'}</b>,
      encontra-se devidamente matriculado(a) e frequentando regularmente as atividades escolares
      neste Estabelecimento de Ensino, no(a) <b>${student.grade || '--'}</b>,
      turno <b>${shiftLabel(student.shift)}</b>,
      durante o corrente ano letivo de <b>${new Date().getFullYear()}</b>.
    </p>
    ${percentual !== undefined ? `<p class="declaration-text">O(A) referido(a) aluno(a) apresenta, até a presente data, o percentual de frequência de <b>${percentual.toFixed(1)}%</b> das aulas ministradas.</p>` : ''}
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'DECLARAÇÃO DE FREQUÊNCIA',
    content, signatories: sigs, fontFamily: 'serif', fontSize: 13,
  });
}

// ==========================================
// DECLARAÇÃO DE TRANSPORTE ESCOLAR
// ==========================================
export function generateDeclaracaoTransporte(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  const year = new Date().getFullYear();
  const sexo = student.sex === 'M' ? 'o' : student.sex === 'F' ? 'a' : 'o(a)';
  const matriculado = student.sex === 'M' ? 'matriculado' : student.sex === 'F' ? 'matriculada' : 'matriculado(a)';

  const content = `
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${student.name || 'ALUNO(A)'}</b>,
      inscrit${sexo} no CPF sob o nº <b>${student.cpf || '--'}</b>,
      ${matriculado}(a) sob o nº <b>${student.enrollment || '--'}</b>,
      no <b>${student.grade || '--'}</b>, turma <b>${student.classRoom || student.className || '--'}</b>,
      turno <b>${shiftLabel(student.shift)}</b>,
      da <b>${school?.name || 'ESCOLA'}</b>,
      residente no endereço <b>${student.address || '--'}</b>,
      utiliza o transporte escolar oferecido pelo Município de
      <b>${mun?.name || mun?.city || 'MUNICÍPIO'}</b>
      no ano letivo de <b>${year}</b>.
    </p>
    <p class="declaration-text">
      Por ser verdade, firmamos a presente declaração.
    </p>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'DECLARAÇÃO DE TRANSPORTE ESCOLAR',
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
    <div class="si-name">${student.name || 'ALUNO(A)'}</div>
    <div class="si-detail">Matrícula: ${student.enrollment || '--'} | Série/Ano: ${student.grade || '--'} | Turma: ${student.classRoom || student.className || '--'} | Turno: ${shiftLabel(student.shift)}</div>
    <div class="si-detail">Ano Letivo: ${year}${student.birthDate ? ' | Data de Nascimento: ' + formatDate(student.birthDate) : ''}</div>
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
        <th style="text-align:left;min-width:160px">COMPONENTE CURRICULAR</th>
        <th>1º BIM</th><th>2º BIM</th><th>3º BIM</th><th>4º BIM</th>
        <th style="background:#15304d">MÉDIA</th>
        <th>FALTAS</th>
        <th>SITUAÇÃO</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total-row">
        <td style="text-align:right" colspan="5"><b>MÉDIA GERAL</b></td>
        <td style="font-weight:bold;background:#e0f2fe">${mediaGeral}</td>
        <td></td>
        <td style="font-weight:bold">${resultadoFinal}</td>
      </tr></tfoot>
    </table>
    <div style="margin-top:15px;font-size:10px;color:#888">
      <b>Legenda:</b> BIM = Bimestre | MÉDIA = Média Aritmética dos Bimestres | FALTAS = Total de faltas no ano letivo.<br>
      Conforme o Regimento Escolar, o(a) aluno(a) é considerado(a) <b>APROVADO(A)</b> quando obtiver média final igual ou superior a <b>6,0</b> (seis vírgula zero) e frequência mínima de <b>75%</b> (setenta e cinco por cento) das aulas ministradas.
    </div>
    <div style="margin-top:12px;font-size:11px;color:#555;font-style:italic;text-align:center;padding:8px;border-top:1px solid #e5e7eb">
      "A participação da família na vida escolar é fundamental para o desenvolvimento integral do educando e para a construção de uma educação de qualidade."
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
// HISTÓRICO ESCOLAR
// ==========================================
export function generateHistoricoEscolar(
  student: any, history: { year: number; grade: string; school: string; result: string; grades?: any[] }[],
  school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  const nivelEnsino = detectNivelEnsino(student.grade);

  // Student data section - formato compacto como modelo oficial
  const studentData = `
    <div class="section-title">DADOS DO ALUNO</div>
    <div class="field-grid">
      ${field('Nome Completo', student.name)}
      ${field('Data de Nascimento', formatDate(student.birthDate))}
      ${field('Sexo', student.sex === 'M' ? 'Masculino' : student.sex === 'F' ? 'Feminino' : '--')}
      ${field('Nacionalidade', student.nationality || 'Brasileira')}
      ${field('Naturalidade', (student.naturalness || '') + (student.naturalnessUf ? ' – ' + student.naturalnessUf : ''))}
      ${field('CPF', student.cpf)}
      ${field('RG / Órgão Emissor', student.rg ? student.rg + (student.rgOrgao ? ' – ' + student.rgOrgao + '/' + (student.rgUf || '') : '') : '--')}
      ${field('NIS', student.nis)}
    </div>
    <div class="section-title">FILIAÇÃO</div>
    <div class="field-grid">
      ${field('Pai', student.fatherName)}
      ${field('Mãe', student.motherName)}
    </div>
  `;

  // History table - trajetória ano a ano
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
    <div class="section-title">HISTÓRICO DE ESCOLARIDADE</div>
    <table>
      <thead><tr><th style="width:60px">ANO</th><th style="text-align:left">SÉRIE/ANO</th><th style="text-align:left">ESTABELECIMENTO DE ENSINO</th><th style="width:100px">RESULTADO</th></tr></thead>
      <tbody>${historyRows || '<tr><td colspan="4" style="color:#999">Nenhum registro encontrado</td></tr>'}</tbody>
    </table>
  `;

  // Grades detail - tabela com disciplinas e notas (quando disponível)
  let gradesDetail = '';
  const yearsWithGrades = history.filter(h => h.grades && h.grades.length > 0);
  if (yearsWithGrades.length > 0) {
    for (const h of yearsWithGrades) {
      let gradeRows = '';
      let totalCH = 0;
      for (const g of (h.grades || [])) {
        const b1 = g.b1 ?? g.bim1 ?? '--';
        const b2 = g.b2 ?? g.bim2 ?? '--';
        const b3 = g.b3 ?? g.bim3 ?? '--';
        const b4 = g.b4 ?? g.bim4 ?? '--';
        const vals = [b1, b2, b3, b4].map((v: any) => typeof v === 'number' ? v : parseFloat(v));
        const valid = vals.filter((v: number) => !isNaN(v));
        const avg = valid.length > 0 ? valid.reduce((a: number, b: number) => a + b, 0) / valid.length : null;
        const ch = g.cargaHoraria || g.weeklyHours ? (g.weeklyHours || 0) * 40 : 80;
        totalCH += ch;
        const faltas = g.faltas ?? g.absences ?? '--';
        gradeRows += `<tr>
          <td style="text-align:left;font-size:9px">${g.subject || g.disciplina || '--'}</td>
          <td style="font-size:9px">${typeof b1 === 'number' ? b1.toFixed(1) : b1}</td>
          <td style="font-size:9px">${typeof b2 === 'number' ? b2.toFixed(1) : b2}</td>
          <td style="font-size:9px">${typeof b3 === 'number' ? b3.toFixed(1) : b3}</td>
          <td style="font-size:9px">${typeof b4 === 'number' ? b4.toFixed(1) : b4}</td>
          <td style="font-size:9px;font-weight:bold">${avg !== null ? avg.toFixed(1) : '--'}</td>
          <td style="font-size:9px">${ch}</td>
          <td style="font-size:9px">${faltas}</td>
        </tr>`;
      }

      gradesDetail += `
        <div class="section-title" style="font-size:11px">${h.grade} – ANO LETIVO ${h.year} – ${h.school}</div>
        <table style="font-size:9px">
          <thead><tr>
            <th style="text-align:left;min-width:120px">COMPONENTE CURRICULAR</th>
            <th style="width:40px">1º B</th><th style="width:40px">2º B</th><th style="width:40px">3º B</th><th style="width:40px">4º B</th>
            <th style="width:45px;background:#15304d">MF</th>
            <th style="width:35px">CH</th>
            <th style="width:40px">FT</th>
          </tr></thead>
          <tbody>${gradeRows}</tbody>
          <tfoot><tr style="background:#f0f4f8;font-weight:bold">
            <td style="text-align:right;font-size:9px" colspan="6">TOTAL CARGA HORÁRIA</td>
            <td style="font-size:9px">${totalCH}h</td>
            <td></td>
          </tr></tfoot>
        </table>
        <div style="font-size:8px;color:#888;margin-top:4px">
          <b>Legenda:</b> B = Bimestre | MF = Média Final | CH = Carga Horária | FT = Faltas |
          <b>Resultado:</b> ${h.result || '--'}
        </div>
      `;
    }
  }

  // Observações finais
  const obs = `
    <div style="margin-top:12px;font-size:9px;color:#555;border:1px solid #e5e7eb;border-radius:4px;padding:8px">
      <b>OBSERVAÇÕES:</b><br>
      • Aprovação com média final igual ou superior a 6,0 (seis) e frequência mínima de 75%.<br>
      • O presente Histórico Escolar tem validade em todo o território nacional conforme LDB 9.394/96.
      ${school?.code ? '<br>• Código INEP da Escola: ' + school.code : ''}
      ${student.nis ? '<br>• NIS do Aluno: ' + student.nis : ''}
    </div>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'HISTÓRICO ESCOLAR',
    subtitle: nivelEnsino || undefined,
    content: studentData + historyTable + gradesDetail + obs,
    signatories: sigs, fontFamily: 'sans-serif', fontSize: 11,
  });
}

// ==========================================
// FICHA DE MATRÍCULA
// ==========================================
export function generateFichaMatricula(
  student: any, school: ReportSchool | undefined,
  mun: ReportMunicipality, sec?: ReportSecretaria, sigs?: Signatory[]
) {
  const content = `
    <div class="section-title">DADOS PESSOAIS DO ALUNO</div>
    <div style="display:flex;gap:15px;align-items:flex-start;margin-bottom:10px">
      <div style="width:80px;height:100px;border:1px solid #ccc;border-radius:6px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f3f4f6">
        ${student.photoUrl ? '<img src="' + student.photoUrl + '" style="width:100%;height:100%;object-fit:cover"/>' : '<span style="font-size:32px;color:#999">' + (student.name?.[0] || '?') + '</span>'}
      </div>
      <div style="flex:1">
    <div class="field-grid">
      ${field('Nome Completo', student.name)}
      ${field('Nº de Matrícula', student.enrollment)}
      ${field('Data de Nascimento', formatDate(student.birthDate))}
      ${field('Sexo', student.sex === 'M' ? 'Masculino' : student.sex === 'F' ? 'Feminino' : '--')}
      ${field('Cor/Raça', student.race)}
      ${field('Nacionalidade', student.nationality)}
      ${field('Naturalidade', (student.naturalness || '') + (student.naturalnessUf ? ' – ' + student.naturalnessUf : ''))}
      ${field('CPF', student.cpf)}
      ${field('RG / Órgão Emissor', student.rg ? student.rg + ' – ' + (student.rgOrgao || '') + '/' + (student.rgUf || '') : '--')}
      ${field('NIS (Número de Identificação Social)', student.nis)}
      ${field('Cartão Nacional de Saúde (SUS)', student.cartaoSus)}
    </div>
    </div></div>

    <div class="section-title">CERTIDÃO DE NASCIMENTO</div>
    <div class="field-grid">
      ${field('Tipo', student.certidaoTipo)}
      ${field('Número', student.certidaoNumero)}
      ${field('Folha', student.certidaoFolha)}
      ${field('Livro', student.certidaoLivro)}
      ${field('Data de Emissão', student.certidaoData)}
      ${field('Cartório', student.certidaoCartorio)}
    </div>

    <div class="section-title">SITUAÇÃO ESCOLAR</div>
    <div class="field-grid">
      ${field('Unidade Escolar', school?.name || '--')}
      ${field('Série/Ano', student.grade)}
      ${field('Turma', student.classRoom || student.className)}
      ${field('Turno', shiftLabel(student.shift))}
      ${field('Tipo de Matrícula', student.enrollmentType === 'novato' ? 'Novato (Primeira Matrícula)' : student.enrollmentType === 'renovacao' ? 'Renovação' : student.enrollmentType === 'transferencia' ? 'Transferência' : '--')}
      ${field('Situação', student.studentStatus)}
    </div>

    <div class="section-title">ENDEREÇO RESIDENCIAL</div>
    <div class="field-grid">
      ${field('Logradouro', student.address)}
      ${field('Número', student.addressNumber)}
      ${field('Complemento', student.addressComplement)}
      ${field('Bairro', student.neighborhood)}
      ${field('CEP', student.cep)}
      ${field('Cidade/UF', (student.city || '') + (student.state ? '/' + student.state : ''))}
      ${field('Zona', student.zone === 'rural' ? 'Rural' : 'Urbana')}
      ${field('Telefone Fixo', student.phone)}
      ${field('Telefone Celular', student.cellPhone)}
    </div>

    <div class="section-title">FILIAÇÃO – PAI</div>
    <div class="field-grid">
      ${field('Nome Completo', student.fatherName)}
      ${field('CPF', student.fatherCpf)}
      ${field('RG', student.fatherRg)}
      ${field('Telefone', student.fatherPhone)}
      ${field('Profissão', student.fatherProfession)}
      ${field('Local de Trabalho', student.fatherWorkplace)}
      ${field('Escolaridade', student.fatherEducation)}
      ${field('Naturalidade', (student.fatherNaturalness || '') + (student.fatherNaturalnessUf ? ' – ' + student.fatherNaturalnessUf : ''))}
    </div>

    <div class="section-title">FILIAÇÃO – MÃE</div>
    <div class="field-grid">
      ${field('Nome Completo', student.motherName)}
      ${field('CPF', student.motherCpf)}
      ${field('RG', student.motherRg)}
      ${field('Telefone', student.motherPhone)}
      ${field('Profissão', student.motherProfession)}
      ${field('Local de Trabalho', student.motherWorkplace)}
      ${field('Escolaridade', student.motherEducation)}
      ${field('Naturalidade', (student.motherNaturalness || '') + (student.motherNaturalnessUf ? ' – ' + student.motherNaturalnessUf : ''))}
    </div>

    <div class="section-title">SAÚDE DO ALUNO</div>
    <div class="field-grid">
      ${field('Tipo Sanguíneo', student.bloodType)}
      ${field('Alergias', student.allergies)}
      ${field('Medicamentos de Uso Contínuo', student.medications)}
      ${field('Observações de Saúde', student.healthNotes)}
    </div>

    <div class="section-title">NECESSIDADES ESPECIAIS</div>
    <div class="field-grid">
      ${field('Pessoa com Deficiência', student.hasSpecialNeeds ? 'Sim' : 'Não')}
      ${student.hasSpecialNeeds ? field('Tipo de Deficiência', student.deficiencyType) : ''}
      ${student.hasSpecialNeeds ? field('TGD (Transtorno Global do Desenvolvimento)', student.tgd) : ''}
      ${student.hasSpecialNeeds ? field('Altas Habilidades/Superdotação', student.superdotacao ? 'Sim' : 'Não') : ''}
      ${student.hasSpecialNeeds ? field('Sala de Recursos Multifuncionais', student.salaRecursos ? 'Sim' : 'Não') : ''}
      ${student.hasSpecialNeeds ? field('Acompanhamento Especializado', student.acompanhamento) : ''}
      ${student.hasSpecialNeeds ? field('Encaminhamento', student.encaminhamento) : ''}
      ${student.hasSpecialNeeds ? field('Detalhes', student.specialNeedsNotes) : ''}
    </div>

    <div class="section-title">TRANSPORTE ESCOLAR</div>
    <div class="field-grid">
      ${field('Necessita Transporte Escolar', student.needsTransport ? 'Sim' : 'Não')}
      ${student.needsTransport ? field('Tipo de Transporte', student.transportType) : ''}
      ${student.needsTransport ? field('Distância Residência–Escola', student.transportDistance ? student.transportDistance + ' km' : '--') : ''}
      ${student.needsTransport ? field('Rota', student.routeName) : ''}
    </div>

    <div class="section-title">PROGRAMAS SOCIAIS</div>
    <div class="field-grid">
      ${field('Bolsa Família', student.bolsaFamilia ? 'Sim' : 'Não')}
      ${field('BPC (Benefício de Prestação Continuada)', student.bpc ? 'Sim' : 'Não')}
      ${field('PETI (Programa de Erradicação do Trabalho Infantil)', student.peti ? 'Sim' : 'Não')}
      ${field('Outros Programas', student.otherPrograms)}
      ${field('Renda Familiar Mensal', student.familyIncome ? 'R$ ' + student.familyIncome : '--')}
    </div>

    <div class="section-title">CONTATOS DE EMERGÊNCIA</div>
    <div class="field-grid">
      ${field('Contato 1 – Nome', student.emergencyContact1Name)}
      ${field('Contato 1 – Telefone', student.emergencyContact1Phone)}
      ${field('Contato 1 – Parentesco', student.emergencyContact1Relation)}
      ${field('Contato 2 – Nome', student.emergencyContact2Name)}
      ${field('Contato 2 – Telefone', student.emergencyContact2Phone)}
      ${field('Contato 2 – Parentesco', student.emergencyContact2Relation)}
    </div>

    <div class="section-title">PROCEDÊNCIA ESCOLAR</div>
    <div class="field-grid">
      ${field('Escola Anterior', student.previousSchool)}
      ${field('Rede', student.previousSchoolType === 'municipal' ? 'Municipal' : student.previousSchoolType === 'estadual' ? 'Estadual' : student.previousSchoolType === 'federal' ? 'Federal' : student.previousSchoolType === 'particular' ? 'Particular' : student.previousSchoolType)}
      ${field('Zona', student.previousSchoolZone === 'urbana' ? 'Urbana' : student.previousSchoolZone === 'rural' ? 'Rural' : student.previousSchoolZone)}
      ${field('Cidade/UF', (student.previousCity || '') + (student.previousState ? '/' + student.previousState : ''))}
    </div>

    ${student.observations ? `<div class="section-title">OBSERVAÇÕES</div><div class="field-grid"><div style="grid-column:1/-1;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:11px;min-height:40px">${student.observations}</div></div>` : ''}

    <div style="margin-top:25px;padding:15px;border:2px solid #1B3A5C;border-radius:8px;background:#f8f9fa;font-size:10px;line-height:1.6">
      <p style="font-weight:bold;text-align:center;margin-bottom:10px;font-size:11px;color:#1B3A5C">TERMO DE RESPONSABILIDADE</p>
      <p>Eu, pai/mãe ou responsável legal pelo(a) aluno(a) acima identificado(a), declaro que as informações prestadas nesta ficha de matrícula são verdadeiras e completas, e me comprometo a comunicar à escola qualquer alteração nos dados cadastrais.</p>
      <p>Declaro estar ciente das normas da instituição de ensino e do calendário escolar, comprometendo-me a zelar pela frequência e pontualidade do(a) aluno(a), bem como participar das reuniões escolares quando convocado(a).</p>
      <div style="display:flex;gap:40px;margin-top:25px">
        <div style="flex:1;text-align:center">
          <div style="border-top:1px solid #333;padding-top:5px;font-size:10px">Assinatura do Pai/Mãe ou Responsável Legal</div>
          <div style="font-size:9px;color:#666;margin-top:3px">CPF: ___.___.___-__</div>
        </div>
        <div style="flex:1;text-align:center">
          <div style="border-top:1px solid #333;padding-top:5px;font-size:10px">Data</div>
          <div style="font-size:9px;color:#666;margin-top:3px">____/____/________</div>
        </div>
      </div>
    </div>
  `;

  return generateReportHTML({
    municipality: mun, secretaria: sec, school,
    title: 'FICHA DE MATRÍCULA',
    subtitle: student.enrollmentType === 'novato' ? 'NOVATO (PRIMEIRA MATRÍCULA)' : student.enrollmentType === 'renovacao' ? 'RENOVAÇÃO DE MATRÍCULA' : 'MATRÍCULA POR TRANSFERÊNCIA',
    content, signatories: sigs, fontFamily: 'sans-serif', fontSize: 11,
  });
}

// ==========================================
// RELAÇÃO DE ALUNOS POR TURMA
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
      <thead><tr><th style="width:40px">Nº</th><th style="text-align:left">NOME DO ALUNO(A)</th><th>MATRÍCULA</th><th>NASCIMENTO</th><th>SEXO</th><th>SITUAÇÃO</th></tr></thead>
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
    title: 'RELAÇÃO DE ALUNOS MATRICULADOS POR TURMA',
    subtitle: `${classInfo.grade} - Turma ${classInfo.className} - ${shiftLabel(classInfo.shift)} - ${classInfo.year}`,
    content: info + table,
    signatories: sigs, fontFamily: 'sans-serif', fontSize: 11,
  });
}

// Reexport for convenience
export { printReportHTML, openReportAsPDF };
