import{g as O}from"./reportTemplate-CscvrgtH.js";const P=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function R(e){if(!e)return"--";const a=typeof e=="string"?new Date(e):e;return isNaN(a.getTime())?String(e):`${a.getDate().toString().padStart(2,"0")}/${(a.getMonth()+1).toString().padStart(2,"0")}/${a.getFullYear()}`}function L(e){if(!e)return"--";const a=typeof e=="string"?new Date(e):e;return isNaN(a.getTime())?String(e):`${a.getDate()} de ${P[a.getMonth()]} de ${a.getFullYear()}`}function i(e,a){return`<div class="field-row"><span class="field-label">${e}</span><span class="field-value">${a||"--"}</span></div>`}function x(e){return e==="morning"?"MATUTINO":e==="afternoon"?"VESPERTINO":e==="evening"?"NOTURNO":e||"--"}function M(e){if(!e)return"";const a=e.toLowerCase();return a.includes("berçário")||a.includes("bercario")||a.includes("maternal")||a.includes("jardim")||a.includes("pré")||a.includes("pre")||a.includes("creche")||a.includes("infantil")?"EDUCAÇÃO INFANTIL":a.includes("6º")||a.includes("7º")||a.includes("8º")||a.includes("9º")||a.includes("6 ano")||a.includes("7 ano")||a.includes("8 ano")||a.includes("9 ano")?"ENSINO FUNDAMENTAL – 6º ao 9º Ano":a.includes("1º")||a.includes("2º")||a.includes("3º")||a.includes("4º")||a.includes("5º")||a.includes("1 ano")||a.includes("2 ano")||a.includes("3 ano")||a.includes("4 ano")||a.includes("5 ano")?"ENSINO FUNDAMENTAL – 1º ao 5º Ano":a.includes("médio")||a.includes("medio")||a.includes("1ª série")||a.includes("2ª série")||a.includes("3ª série")?"ENSINO MÉDIO":a.includes("eja")||a.includes("supletivo")?"EDUCAÇÃO DE JOVENS E ADULTOS (EJA)":"ENSINO FUNDAMENTAL"}function z(e,a,l,n,s){a!=null&&a.name;const d=M(e.grade),f=new Date().getFullYear(),p=`
    <p class="declaration-text">
      Declaro para os devidos fins que <b>${e.name||"ALUNO(A)"}</b>,
      ${e.motherName?"filho(a) de <b>"+e.motherName+"</b>":""}
      ${e.fatherName?" e de <b>"+e.fatherName+"</b>":""},
      ${e.naturalness?"natural de <b>"+e.naturalness+(e.naturalnessUf?" – "+e.naturalnessUf:"")+"</b>,":""}
      nascido(a) aos <b>${L(e.birthDate)}</b>,
      é aluno(a) deste Estabelecimento de Ensino, está cursando
      <b>${e.grade||"--"}${d?" – "+d:""}</b>,
      do turno <b>${x(e.shift)}</b>
      no ano letivo de <b>${f}</b>,
      Matrícula Nº <b>${e.enrollment||"--"}</b>.
    </p>
    <p class="declaration-text">
      Declaramos, outrossim, que o(a) referido(a) aluno(a) encontra-se com a situação acadêmica
      regular perante esta instituição de ensino, nada constando em seus registros que o(a) desabone.
    </p>
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
    <div style="margin-top:20px;font-size:10px;color:#555;line-height:1.6">
      ${e.nis?`<b>NIS:</b> ${e.nis}<br>`:""}
      ${a!=null&&a.code?`<b>ID Censo (INEP):</b> ${a.code}<br>`:""}
      ${e.cpf?`<b>CPF do Aluno:</b> ${e.cpf}`:""}
    </div>
  `;return O({municipality:l,secretaria:n,school:a,title:"DECLARAÇÃO DE ESCOLARIDADE",content:p,signatories:s,fontFamily:"serif",fontSize:13})}function B(e,a,l,n,s,d){const f=`
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${e.name||"ALUNO(A)"}</b>,
      nascido(a) em <b>${L(e.birthDate)}</b>,
      ${e.naturalness?"natural de <b>"+e.naturalness+(e.naturalnessUf?" – "+e.naturalnessUf:"")+"</b>,":""}
      ${e.motherName?"filho(a) de <b>"+e.motherName+"</b>":""}
      ${e.fatherName?" e de <b>"+e.fatherName+"</b>":""},
      esteve regularmente matriculado(a) neste Estabelecimento de Ensino durante o ano letivo de <b>${new Date().getFullYear()}</b>,
      cursando o(a) <b>${e.grade||"--"}</b>, no turno <b>${x(e.shift)}</b>,
      tendo obtido o seguinte resultado: <b>${e.studentStatus?e.studentStatus.toUpperCase():"APTO(A) PARA TRANSFERÊNCIA"}</b>.
    </p>
    <p class="declaration-text">
      O(A) aluno(a) acima qualificado(a) encontra-se em condições regulares para efetuar transferência
      para outra unidade de ensino, nada constando que impeça a referida movimentação escolar.
    </p>
    
    ${e.nis?`<div style="margin-top:20px;font-size:11px;color:#555"><b>NIS:</b> ${e.nis} &nbsp;&nbsp; <b>Matrícula:</b> ${e.enrollment||"--"}</div>`:""}
  `;return O({municipality:l,secretaria:n,school:a,title:"DECLARAÇÃO DE TRANSFERÊNCIA",content:f,signatories:s,fontFamily:"serif",fontSize:13})}function q(e,a,l,n,s,d){const f=`
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${e.name||"ALUNO(A)"}</b>,
      portador(a) da Matrícula nº <b>${e.enrollment||"--"}</b>,
      encontra-se devidamente matriculado(a) e frequentando regularmente as atividades escolares
      neste Estabelecimento de Ensino, no(a) <b>${e.grade||"--"}</b>,
      turno <b>${x(e.shift)}</b>,
      durante o corrente ano letivo de <b>${new Date().getFullYear()}</b>.
    </p>
    
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
  `;return O({municipality:l,secretaria:n,school:a,title:"DECLARAÇÃO DE FREQUÊNCIA",content:f,signatories:s,fontFamily:"serif",fontSize:13})}function H(e,a,l,n,s,d,f){const p=f||new Date().getFullYear();let v=`<div class="student-info">
    <div class="si-name">${e.name||"ALUNO(A)"}</div>
    <div class="si-detail">Matrícula: ${e.enrollment||"--"} | Série/Ano: ${e.grade||"--"} | Turma: ${e.classRoom||e.className||"--"} | Turno: ${x(e.shift)}</div>
    <div class="si-detail">Ano Letivo: ${p}${e.birthDate?" | Data de Nascimento: "+R(e.birthDate):""}</div>
  </div>`,A="",g=0,r=0;for(const t of a){const b=t.b1??t.bim1??"--",u=t.b2??t.bim2??"--",o=t.b3??t.bim3??"--",$=t.b4??t.bim4??"--",h=[b,u,o,$].map(m=>typeof m=="number"?m:parseFloat(m)).filter(m=>!isNaN(m)),c=h.length>0?h.reduce((m,F)=>m+F,0)/h.length:null,I=t.faltas??t.absences??"--",y=c!==null?c>=6?"Aprovado":c>=0?"Reprovado":"--":"--",C=y==="Aprovado"?"approved":y==="Reprovado"?"failed":"";c!==null&&(g+=c,r++),A+=`<tr>
      <td style="text-align:left;font-weight:500">${t.subject||t.disciplina||"--"}</td>
      <td>${typeof b=="number"?b.toFixed(1):b}</td>
      <td>${typeof u=="number"?u.toFixed(1):u}</td>
      <td>${typeof o=="number"?o.toFixed(1):o}</td>
      <td>${typeof $=="number"?$.toFixed(1):$}</td>
      <td style="font-weight:bold;background:#f0f4f8">${c!==null?c.toFixed(1):"--"}</td>
      <td>${I}</td>
      <td class="${C}">${y}</td>
    </tr>`}const N=r>0?(g/r).toFixed(1):"--",T=r>0&&g/r>=6?"APROVADO(A)":r>0?"REPROVADO(A)":"--",D=`
    <table class="grade-table">
      <thead><tr>
        <th style="text-align:left;min-width:160px">COMPONENTE CURRICULAR</th>
        <th>1º BIM</th><th>2º BIM</th><th>3º BIM</th><th>4º BIM</th>
        <th style="background:#15304d">MÉDIA</th>
        <th>FALTAS</th>
        <th>SITUAÇÃO</th>
      </tr></thead>
      <tbody>${A}</tbody>
      <tfoot><tr class="total-row">
        <td style="text-align:right" colspan="5"><b>MÉDIA GERAL</b></td>
        <td style="font-weight:bold;background:#e0f2fe">${N}</td>
        <td></td>
        <td style="font-weight:bold">${T}</td>
      </tr></tfoot>
    </table>
    <div style="margin-top:15px;font-size:10px;color:#888">
      <b>Legenda:</b> BIM = Bimestre | MÉDIA = Média Aritmética dos Bimestres | FALTAS = Total de faltas no ano letivo.<br>
      Conforme o Regimento Escolar, o(a) aluno(a) é considerado(a) <b>APROVADO(A)</b> quando obtiver média final igual ou superior a <b>6,0</b> (seis vírgula zero) e frequência mínima de <b>75%</b> (setenta e cinco por cento) das aulas ministradas.
    </div>
    <div style="margin-top:12px;font-size:11px;color:#555;font-style:italic;text-align:center;padding:8px;border-top:1px solid #e5e7eb">
      "A participação da família na vida escolar é fundamental para o desenvolvimento integral do educando e para a construção de uma educação de qualidade."
    </div>
  `;return O({municipality:n,secretaria:s,school:l,title:"BOLETIM ESCOLAR",subtitle:`Ano Letivo ${p}`,content:v+D,signatories:d,fontFamily:"sans-serif",fontSize:12})}function k(e,a,l,n,s,d){var T,D;const f=M(e.grade),p=`
    <div class="section-title">DADOS DO ALUNO</div>
    <div class="field-grid">
      ${i("Nome Completo",e.name)}
      ${i("Data de Nascimento",R(e.birthDate))}
      ${i("Sexo",e.sex==="M"?"Masculino":e.sex==="F"?"Feminino":"--")}
      ${i("Nacionalidade",e.nationality||"Brasileira")}
      ${i("Naturalidade",(e.naturalness||"")+(e.naturalnessUf?" – "+e.naturalnessUf:""))}
      ${i("CPF",e.cpf)}
      ${i("RG / Órgão Emissor",e.rg?e.rg+(e.rgOrgao?" – "+e.rgOrgao+"/"+(e.rgUf||""):""):"--")}
      ${i("NIS",e.nis)}
    </div>
    <div class="section-title">FILIAÇÃO</div>
    <div class="field-grid">
      ${i("Pai",e.fatherName)}
      ${i("Mãe",e.motherName)}
    </div>
  `;let v="";for(const t of a){const b=(T=t.result)!=null&&T.toLowerCase().includes("aprov")?"approved":(D=t.result)!=null&&D.toLowerCase().includes("reprov")?"failed":"";v+=`<tr>
      <td>${t.year}</td>
      <td style="text-align:left">${t.grade}</td>
      <td style="text-align:left">${t.school}</td>
      <td class="${b}">${t.result||"--"}</td>
    </tr>`}const A=`
    <div class="section-title">HISTÓRICO DE ESCOLARIDADE</div>
    <table>
      <thead><tr><th style="width:60px">ANO</th><th style="text-align:left">SÉRIE/ANO</th><th style="text-align:left">ESTABELECIMENTO DE ENSINO</th><th style="width:100px">RESULTADO</th></tr></thead>
      <tbody>${v||'<tr><td colspan="4" style="color:#999">Nenhum registro encontrado</td></tr>'}</tbody>
    </table>
  `;let g="";const r=a.filter(t=>t.grades&&t.grades.length>0);if(r.length>0)for(const t of r){let b="",u=0;for(const o of t.grades||[]){const $=o.b1??o.bim1??"--",S=o.b2??o.bim2??"--",h=o.b3??o.bim3??"--",c=o.b4??o.bim4??"--",y=[$,S,h,c].map(E=>typeof E=="number"?E:parseFloat(E)).filter(E=>!isNaN(E)),C=y.length>0?y.reduce((E,U)=>E+U,0)/y.length:null,m=o.cargaHoraria||o.weeklyHours?(o.weeklyHours||0)*40:80;u+=m;const F=o.faltas??o.absences??"--";b+=`<tr>
          <td style="text-align:left;font-size:9px">${o.subject||o.disciplina||"--"}</td>
          <td style="font-size:9px">${typeof $=="number"?$.toFixed(1):$}</td>
          <td style="font-size:9px">${typeof S=="number"?S.toFixed(1):S}</td>
          <td style="font-size:9px">${typeof h=="number"?h.toFixed(1):h}</td>
          <td style="font-size:9px">${typeof c=="number"?c.toFixed(1):c}</td>
          <td style="font-size:9px;font-weight:bold">${C!==null?C.toFixed(1):"--"}</td>
          <td style="font-size:9px">${m}</td>
          <td style="font-size:9px">${F}</td>
        </tr>`}g+=`
        <div class="section-title" style="font-size:11px">${t.grade} – ANO LETIVO ${t.year} – ${t.school}</div>
        <table style="font-size:9px">
          <thead><tr>
            <th style="text-align:left;min-width:120px">COMPONENTE CURRICULAR</th>
            <th style="width:40px">1º B</th><th style="width:40px">2º B</th><th style="width:40px">3º B</th><th style="width:40px">4º B</th>
            <th style="width:45px;background:#15304d">MF</th>
            <th style="width:35px">CH</th>
            <th style="width:40px">FT</th>
          </tr></thead>
          <tbody>${b}</tbody>
          <tfoot><tr style="background:#f0f4f8;font-weight:bold">
            <td style="text-align:right;font-size:9px" colspan="6">TOTAL CARGA HORÁRIA</td>
            <td style="font-size:9px">${u}h</td>
            <td></td>
          </tr></tfoot>
        </table>
        <div style="font-size:8px;color:#888;margin-top:4px">
          <b>Legenda:</b> B = Bimestre | MF = Média Final | CH = Carga Horária | FT = Faltas |
          <b>Resultado:</b> ${t.result||"--"}
        </div>
      `}const N=`
    <div style="margin-top:12px;font-size:9px;color:#555;border:1px solid #e5e7eb;border-radius:4px;padding:8px">
      <b>OBSERVAÇÕES:</b><br>
      • Aprovação com média final igual ou superior a 6,0 (seis) e frequência mínima de 75%.<br>
      • O presente Histórico Escolar tem validade em todo o território nacional conforme LDB 9.394/96.
      ${l!=null&&l.code?"<br>• Código INEP da Escola: "+l.code:""}
      ${e.nis?"<br>• NIS do Aluno: "+e.nis:""}
    </div>
  `;return O({municipality:n,secretaria:s,school:l,title:"HISTÓRICO ESCOLAR",subtitle:f||void 0,content:p+A+g+N,signatories:d,fontFamily:"sans-serif",fontSize:11})}function V(e,a,l,n,s){const d=`
    <div class="section-title">DADOS PESSOAIS DO ALUNO</div>
    <div class="field-grid">
      ${i("Nome Completo",e.name)}
      ${i("Nº de Matrícula",e.enrollment)}
      ${i("Data de Nascimento",R(e.birthDate))}
      ${i("Sexo",e.sex==="M"?"Masculino":e.sex==="F"?"Feminino":"--")}
      ${i("Cor/Raça",e.race)}
      ${i("Nacionalidade",e.nationality)}
      ${i("Naturalidade",(e.naturalness||"")+(e.naturalnessUf?" – "+e.naturalnessUf:""))}
      ${i("CPF",e.cpf)}
      ${i("RG / Órgão Emissor",e.rg?e.rg+" – "+(e.rgOrgao||"")+"/"+(e.rgUf||""):"--")}
      ${i("NIS (Número de Identificação Social)",e.nis)}
      ${i("Cartão Nacional de Saúde (SUS)",e.cartaoSus)}
    </div>

    <div class="section-title">CERTIDÃO DE NASCIMENTO</div>
    <div class="field-grid">
      ${i("Tipo",e.certidaoTipo)}
      ${i("Número",e.certidaoNumero)}
      ${i("Folha",e.certidaoFolha)}
      ${i("Livro",e.certidaoLivro)}
      ${i("Data de Emissão",e.certidaoData)}
      ${i("Cartório",e.certidaoCartorio)}
    </div>

    <div class="section-title">SITUAÇÃO ESCOLAR</div>
    <div class="field-grid">
      ${i("Unidade Escolar",(a==null?void 0:a.name)||"--")}
      ${i("Série/Ano",e.grade)}
      ${i("Turma",e.classRoom||e.className)}
      ${i("Turno",x(e.shift))}
      ${i("Tipo de Matrícula",e.enrollmentType==="novato"?"Novato (Primeira Matrícula)":e.enrollmentType==="renovacao"?"Renovação":e.enrollmentType==="transferencia"?"Transferência":"--")}
      ${i("Situação",e.studentStatus)}
    </div>

    <div class="section-title">ENDEREÇO RESIDENCIAL</div>
    <div class="field-grid">
      ${i("Logradouro",e.address)}
      ${i("Número",e.addressNumber)}
      ${i("Complemento",e.addressComplement)}
      ${i("Bairro",e.neighborhood)}
      ${i("CEP",e.cep)}
      ${i("Cidade/UF",(e.city||"")+(e.state?"/"+e.state:""))}
      ${i("Zona",e.zone==="rural"?"Rural":"Urbana")}
      ${i("Telefone Fixo",e.phone)}
      ${i("Telefone Celular",e.cellPhone)}
    </div>

    <div class="section-title">FILIAÇÃO – PAI</div>
    <div class="field-grid">
      ${i("Nome Completo",e.fatherName)}
      ${i("CPF",e.fatherCpf)}
      ${i("RG",e.fatherRg)}
      ${i("Telefone",e.fatherPhone)}
      ${i("Profissão",e.fatherProfession)}
      ${i("Local de Trabalho",e.fatherWorkplace)}
      ${i("Escolaridade",e.fatherEducation)}
      ${i("Naturalidade",(e.fatherNaturalness||"")+(e.fatherNaturalnessUf?" – "+e.fatherNaturalnessUf:""))}
    </div>

    <div class="section-title">FILIAÇÃO – MÃE</div>
    <div class="field-grid">
      ${i("Nome Completo",e.motherName)}
      ${i("CPF",e.motherCpf)}
      ${i("RG",e.motherRg)}
      ${i("Telefone",e.motherPhone)}
      ${i("Profissão",e.motherProfession)}
      ${i("Local de Trabalho",e.motherWorkplace)}
      ${i("Escolaridade",e.motherEducation)}
      ${i("Naturalidade",(e.motherNaturalness||"")+(e.motherNaturalnessUf?" – "+e.motherNaturalnessUf:""))}
    </div>

    <div class="section-title">INFORMAÇÕES COMPLEMENTARES</div>
    <div class="field-grid">
      ${i("Renda Familiar",e.familyIncome)}
      ${i("Tipo Sanguíneo",e.bloodType)}
      ${i("Alergias",e.allergies)}
      ${i("Medicamentos de Uso Contínuo",e.medications)}
      ${i("Transporte Escolar",e.needsTransport?"Sim – "+(e.transportType||"")+" "+(e.transportDistance?"("+e.transportDistance+" km)":""):"Não")}
      ${i("Bolsa Família",e.bolsaFamilia?"Sim":"Não")}
      ${i("BPC (Benefício de Prestação Continuada)",e.bpc?"Sim":"Não")}
      ${i("Pessoa com Deficiência",e.hasSpecialNeeds?e.deficiencyType||"Sim":"Não")}
    </div>

    <div class="section-title">PROCEDÊNCIA ESCOLAR</div>
    <div class="field-grid">
      ${i("Escola Anterior",e.previousSchool)}
      ${i("Rede",e.previousSchoolType)}
      ${i("Zona",e.previousSchoolZone)}
      ${i("Cidade/UF",(e.previousCity||"")+(e.previousState?"/"+e.previousState:""))}
    </div>
  `;return O({municipality:l,secretaria:n,school:a,title:"FICHA DE MATRÍCULA",subtitle:e.enrollmentType==="novato"?"NOVATO (PRIMEIRA MATRÍCULA)":e.enrollmentType==="renovacao"?"RENOVAÇÃO DE MATRÍCULA":"MATRÍCULA POR TRANSFERÊNCIA",content:d,signatories:s,fontFamily:"sans-serif",fontSize:11})}function G(e,a,l,n,s,d){const f=`<div class="student-info">
    <div class="si-name">Turma: ${a.grade} - ${a.className}</div>
    <div class="si-detail">Turno: ${x(a.shift)} | Ano Letivo: ${a.year} | Total: ${e.length} aluno(s)</div>
  </div>`;let p="",v=0,A=0;e.sort((r,N)=>(r.name||"").localeCompare(N.name||"")),e.forEach((r,N)=>{r.sex==="M"?v++:r.sex==="F"&&A++,p+=`<tr>
      <td>${N+1}</td>
      <td style="text-align:left;font-weight:500">${r.name||"--"}</td>
      <td>${r.enrollment||"--"}</td>
      <td>${R(r.birthDate)}</td>
      <td>${r.sex||"--"}</td>
      <td>${r.studentStatus||"--"}</td>
    </tr>`});const g=`
    <table>
      <thead><tr><th style="width:40px">Nº</th><th style="text-align:left">NOME DO ALUNO(A)</th><th>MATRÍCULA</th><th>NASCIMENTO</th><th>SEXO</th><th>SITUAÇÃO</th></tr></thead>
      <tbody>${p}</tbody>
    </table>
    <div style="margin-top:15px;font-size:11px;display:flex;gap:30px">
      <span><b>Total:</b> ${e.length} aluno(s)</span>
      <span><b>Masculino:</b> ${v}</span>
      <span><b>Feminino:</b> ${A}</span>
    </div>
  `;return O({municipality:n,secretaria:s,school:l,title:"RELAÇÃO DE ALUNOS MATRICULADOS POR TURMA",subtitle:`${a.grade} - Turma ${a.className} - ${x(a.shift)} - ${a.year}`,content:f+g,signatories:d,fontFamily:"sans-serif",fontSize:11})}export{k as a,V as b,q as c,B as d,z as e,G as f,H as g};
