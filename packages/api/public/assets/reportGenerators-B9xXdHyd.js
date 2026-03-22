import{g as v}from"./reportTemplate-3bRUqBaE.js";const M=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function O(a){if(!a)return"--";const o=typeof a=="string"?new Date(a):a;return isNaN(o.getTime())?String(a):`${o.getDate().toString().padStart(2,"0")}/${(o.getMonth()+1).toString().padStart(2,"0")}/${o.getFullYear()}`}function D(a){if(!a)return"--";const o=typeof a=="string"?new Date(a):a;return isNaN(o.getTime())?String(a):`${o.getDate()} de ${M[o.getMonth()]} de ${o.getFullYear()}`}function e(a,o){return`<div class="field-row"><span class="field-label">${a}</span><span class="field-value">${o||"--"}</span></div>`}function g(a){return a==="morning"?"MATUTINO":a==="afternoon"?"VESPERTINO":a==="evening"?"NOTURNO":a||"--"}function U(a,o,r,t,l){o!=null&&o.name;const s=`
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${a.name||"ALUNO(A)"}</b>,
      ${a.motherName?"filho(a) de <b>"+a.motherName+"</b>":""}
      ${a.fatherName?" e de <b>"+a.fatherName+"</b>":""},
      nascido(a) em <b>${D(a.birthDate)}</b>,
      ${a.naturalness?"natural de <b>"+a.naturalness+(a.naturalnessUf?" – "+a.naturalnessUf:"")+"</b>,":""}
      portador(a) do CPF nº <b>${a.cpf||"___.___.___-__"}</b>,
      encontra-se devidamente matriculado(a) neste Estabelecimento de Ensino, cursando o(a) <b>${a.grade||"--"}</b>,
      no turno <b>${g(a.shift)}</b>,
      no corrente ano letivo de <b>${new Date().getFullYear()}</b>,
      sob a Matrícula nº <b>${a.enrollment||"--"}</b>.
    </p>
    <p class="declaration-text">
      Declaramos, outrossim, que o(a) referido(a) aluno(a) encontra-se com a situação acadêmica
      regular perante esta instituição de ensino, nada constando em seus registros que o(a) desabone.
    </p>
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
    ${a.nis?`<div style="margin-top:20px;font-size:11px;color:#555"><b>NIS:</b> ${a.nis}</div>`:""}
    ${o!=null&&o.code?`<div style="font-size:11px;color:#555"><b>Código INEP:</b> ${o.code}</div>`:""}
  `;return v({municipality:r,secretaria:t,school:o,title:"DECLARAÇÃO DE ESCOLARIDADE",content:s,signatories:l,fontFamily:"serif",fontSize:13})}function P(a,o,r,t,l,s){const c=`
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${a.name||"ALUNO(A)"}</b>,
      nascido(a) em <b>${D(a.birthDate)}</b>,
      ${a.naturalness?"natural de <b>"+a.naturalness+(a.naturalnessUf?" – "+a.naturalnessUf:"")+"</b>,":""}
      ${a.motherName?"filho(a) de <b>"+a.motherName+"</b>":""}
      ${a.fatherName?" e de <b>"+a.fatherName+"</b>":""},
      esteve regularmente matriculado(a) neste Estabelecimento de Ensino durante o ano letivo de <b>${new Date().getFullYear()}</b>,
      cursando o(a) <b>${a.grade||"--"}</b>, no turno <b>${g(a.shift)}</b>,
      tendo obtido o seguinte resultado: <b>${a.studentStatus?a.studentStatus.toUpperCase():"APTO(A) PARA TRANSFERÊNCIA"}</b>.
    </p>
    <p class="declaration-text">
      O(A) aluno(a) acima qualificado(a) encontra-se em condições regulares para efetuar transferência
      para outra unidade de ensino, nada constando que impeça a referida movimentação escolar.
    </p>
    
    ${a.nis?`<div style="margin-top:20px;font-size:11px;color:#555"><b>NIS:</b> ${a.nis} &nbsp;&nbsp; <b>Matrícula:</b> ${a.enrollment||"--"}</div>`:""}
  `;return v({municipality:r,secretaria:t,school:o,title:"DECLARAÇÃO DE TRANSFERÊNCIA",content:c,signatories:l,fontFamily:"serif",fontSize:13})}function w(a,o,r,t,l,s){const c=`
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${a.name||"ALUNO(A)"}</b>,
      portador(a) da Matrícula nº <b>${a.enrollment||"--"}</b>,
      encontra-se devidamente matriculado(a) e frequentando regularmente as atividades escolares
      neste Estabelecimento de Ensino, no(a) <b>${a.grade||"--"}</b>,
      turno <b>${g(a.shift)}</b>,
      durante o corrente ano letivo de <b>${new Date().getFullYear()}</b>.
    </p>
    
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
  `;return v({municipality:r,secretaria:t,school:o,title:"DECLARAÇÃO DE FREQUÊNCIA",content:c,signatories:l,fontFamily:"serif",fontSize:13})}function z(a,o,r,t,l,s,c){const d=c||new Date().getFullYear();let h=`<div class="student-info">
    <div class="si-name">${a.name||"ALUNO(A)"}</div>
    <div class="si-detail">Matrícula: ${a.enrollment||"--"} | Série/Ano: ${a.grade||"--"} | Turma: ${a.classRoom||a.className||"--"} | Turno: ${g(a.shift)}</div>
    <div class="si-detail">Ano Letivo: ${d}${a.birthDate?" | Data de Nascimento: "+O(a.birthDate):""}</div>
  </div>`,m="",f=0,i=0;for(const n of o){const A=n.b1??n.bim1??"--",N=n.b2??n.bim2??"--",E=n.b3??n.bim3??"--",S=n.b4??n.bim4??"--",y=[A,N,E,S].map(b=>typeof b=="number"?b:parseFloat(b)).filter(b=>!isNaN(b)),p=y.length>0?y.reduce((b,x)=>b+x,0)/y.length:null,C=n.faltas??n.absences??"--",T=p!==null?p>=6?"Aprovado":p>=0?"Reprovado":"--":"--",F=T==="Aprovado"?"approved":T==="Reprovado"?"failed":"";p!==null&&(f+=p,i++),m+=`<tr>
      <td style="text-align:left;font-weight:500">${n.subject||n.disciplina||"--"}</td>
      <td>${typeof A=="number"?A.toFixed(1):A}</td>
      <td>${typeof N=="number"?N.toFixed(1):N}</td>
      <td>${typeof E=="number"?E.toFixed(1):E}</td>
      <td>${typeof S=="number"?S.toFixed(1):S}</td>
      <td style="font-weight:bold;background:#f0f4f8">${p!==null?p.toFixed(1):"--"}</td>
      <td>${C}</td>
      <td class="${F}">${T}</td>
    </tr>`}const $=i>0?(f/i).toFixed(1):"--",R=i>0&&f/i>=6?"APROVADO(A)":i>0?"REPROVADO(A)":"--",u=`
    <table class="grade-table">
      <thead><tr>
        <th style="text-align:left;min-width:160px">COMPONENTE CURRICULAR</th>
        <th>1º BIM</th><th>2º BIM</th><th>3º BIM</th><th>4º BIM</th>
        <th style="background:#15304d">MÉDIA</th>
        <th>FALTAS</th>
        <th>SITUAÇÃO</th>
      </tr></thead>
      <tbody>${m}</tbody>
      <tfoot><tr class="total-row">
        <td style="text-align:right" colspan="5"><b>MÉDIA GERAL</b></td>
        <td style="font-weight:bold;background:#e0f2fe">${$}</td>
        <td></td>
        <td style="font-weight:bold">${R}</td>
      </tr></tfoot>
    </table>
    <div style="margin-top:15px;font-size:10px;color:#888">
      <b>Legenda:</b> BIM = Bimestre | MÉDIA = Média Aritmética dos Bimestres | FALTAS = Total de faltas no ano letivo.<br>
      Conforme o Regimento Escolar, o(a) aluno(a) é considerado(a) <b>APROVADO(A)</b> quando obtiver média final igual ou superior a <b>6,0</b> (seis vírgula zero) e frequência mínima de <b>75%</b> (setenta e cinco por cento) das aulas ministradas.
    </div>
    <div style="margin-top:12px;font-size:11px;color:#555;font-style:italic;text-align:center;padding:8px;border-top:1px solid #e5e7eb">
      "A participação da família na vida escolar é fundamental para o desenvolvimento integral do educando e para a construção de uma educação de qualidade."
    </div>
  `;return v({municipality:t,secretaria:l,school:r,title:"BOLETIM ESCOLAR",subtitle:`Ano Letivo ${d}`,content:h+u,signatories:s,fontFamily:"sans-serif",fontSize:12})}function q(a,o,r,t,l,s){var m,f;const c=`
    <div class="section-title">DADOS DO ALUNO</div>
    <div class="field-grid">
      ${e("Nome",a.name)}
      ${e("Data de Nascimento",O(a.birthDate))}
      ${e("Sexo",a.sex==="M"?"Masculino":a.sex==="F"?"Feminino":"--")}
      ${e("Nacionalidade",a.nationality)}
      ${e("Naturalidade",(a.naturalness||"")+(a.naturalnessUf?" – "+a.naturalnessUf:""))}
      ${e("CPF",a.cpf)}
      ${e("RG / Órgão Emissor",a.rg?a.rg+(a.rgOrgao?" – "+a.rgOrgao+"/"+(a.rgUf||""):""):"--")}
      ${e("NIS",a.nis)}
    </div>
    <div class="section-title">FILIAÇÃO</div>
    <div class="field-grid">
      ${e("Pai",a.fatherName)}
      ${e("Mãe",a.motherName)}
    </div>
  `;let d="";for(const i of o){const $=(m=i.result)!=null&&m.toLowerCase().includes("aprov")?"approved":(f=i.result)!=null&&f.toLowerCase().includes("reprov")?"failed":"";d+=`<tr>
      <td>${i.year}</td>
      <td style="text-align:left">${i.grade}</td>
      <td style="text-align:left">${i.school}</td>
      <td class="${$}">${i.result||"--"}</td>
    </tr>`}const h=`
    <div class="section-title">HISTÓRICO DE ESCOLARIDADE</div>
    <table>
      <thead><tr><th>ANO</th><th style="text-align:left">SÉRIE/ANO</th><th style="text-align:left">ESTABELECIMENTO DE ENSINO</th><th>RESULTADO</th></tr></thead>
      <tbody>${d||'<tr><td colspan="4" style="color:#999">Nenhum registro encontrado</td></tr>'}</tbody>
    </table>
  `;return v({municipality:t,secretaria:l,school:r,title:"HISTÓRICO ESCOLAR",content:c+h,signatories:s,fontFamily:"sans-serif",fontSize:11})}function B(a,o,r,t,l){const s=`
    <div class="section-title">DADOS PESSOAIS DO ALUNO</div>
    <div class="field-grid">
      ${e("Nome Completo",a.name)}
      ${e("Nº de Matrícula",a.enrollment)}
      ${e("Data de Nascimento",O(a.birthDate))}
      ${e("Sexo",a.sex==="M"?"Masculino":a.sex==="F"?"Feminino":"--")}
      ${e("Cor/Raça",a.race)}
      ${e("Nacionalidade",a.nationality)}
      ${e("Naturalidade",(a.naturalness||"")+(a.naturalnessUf?" – "+a.naturalnessUf:""))}
      ${e("CPF",a.cpf)}
      ${e("RG / Órgão Emissor",a.rg?a.rg+" – "+(a.rgOrgao||"")+"/"+(a.rgUf||""):"--")}
      ${e("NIS (Número de Identificação Social)",a.nis)}
      ${e("Cartão Nacional de Saúde (SUS)",a.cartaoSus)}
    </div>

    <div class="section-title">CERTIDÃO DE NASCIMENTO</div>
    <div class="field-grid">
      ${e("Tipo",a.certidaoTipo)}
      ${e("Número",a.certidaoNumero)}
      ${e("Folha",a.certidaoFolha)}
      ${e("Livro",a.certidaoLivro)}
      ${e("Data de Emissão",a.certidaoData)}
      ${e("Cartório",a.certidaoCartorio)}
    </div>

    <div class="section-title">SITUAÇÃO ESCOLAR</div>
    <div class="field-grid">
      ${e("Unidade Escolar",(o==null?void 0:o.name)||"--")}
      ${e("Série/Ano",a.grade)}
      ${e("Turma",a.classRoom||a.className)}
      ${e("Turno",g(a.shift))}
      ${e("Tipo de Matrícula",a.enrollmentType==="novato"?"Novato (Primeira Matrícula)":a.enrollmentType==="renovacao"?"Renovação":a.enrollmentType==="transferencia"?"Transferência":"--")}
      ${e("Situação",a.studentStatus)}
    </div>

    <div class="section-title">ENDEREÇO RESIDENCIAL</div>
    <div class="field-grid">
      ${e("Logradouro",a.address)}
      ${e("Número",a.addressNumber)}
      ${e("Complemento",a.addressComplement)}
      ${e("Bairro",a.neighborhood)}
      ${e("CEP",a.cep)}
      ${e("Cidade/UF",(a.city||"")+(a.state?"/"+a.state:""))}
      ${e("Zona",a.zone==="rural"?"Rural":"Urbana")}
      ${e("Telefone Fixo",a.phone)}
      ${e("Telefone Celular",a.cellPhone)}
    </div>

    <div class="section-title">FILIAÇÃO – PAI</div>
    <div class="field-grid">
      ${e("Nome Completo",a.fatherName)}
      ${e("CPF",a.fatherCpf)}
      ${e("RG",a.fatherRg)}
      ${e("Telefone",a.fatherPhone)}
      ${e("Profissão",a.fatherProfession)}
      ${e("Local de Trabalho",a.fatherWorkplace)}
      ${e("Escolaridade",a.fatherEducation)}
      ${e("Naturalidade",(a.fatherNaturalness||"")+(a.fatherNaturalnessUf?" – "+a.fatherNaturalnessUf:""))}
    </div>

    <div class="section-title">FILIAÇÃO – MÃE</div>
    <div class="field-grid">
      ${e("Nome Completo",a.motherName)}
      ${e("CPF",a.motherCpf)}
      ${e("RG",a.motherRg)}
      ${e("Telefone",a.motherPhone)}
      ${e("Profissão",a.motherProfession)}
      ${e("Local de Trabalho",a.motherWorkplace)}
      ${e("Escolaridade",a.motherEducation)}
      ${e("Naturalidade",(a.motherNaturalness||"")+(a.motherNaturalnessUf?" – "+a.motherNaturalnessUf:""))}
    </div>

    <div class="section-title">INFORMAÇÕES COMPLEMENTARES</div>
    <div class="field-grid">
      ${e("Renda Familiar",a.familyIncome)}
      ${e("Tipo Sanguíneo",a.bloodType)}
      ${e("Alergias",a.allergies)}
      ${e("Medicamentos de Uso Contínuo",a.medications)}
      ${e("Transporte Escolar",a.needsTransport?"Sim – "+(a.transportType||"")+" "+(a.transportDistance?"("+a.transportDistance+" km)":""):"Não")}
      ${e("Bolsa Família",a.bolsaFamilia?"Sim":"Não")}
      ${e("BPC (Benefício de Prestação Continuada)",a.bpc?"Sim":"Não")}
      ${e("Pessoa com Deficiência",a.hasSpecialNeeds?a.deficiencyType||"Sim":"Não")}
    </div>

    <div class="section-title">PROCEDÊNCIA ESCOLAR</div>
    <div class="field-grid">
      ${e("Escola Anterior",a.previousSchool)}
      ${e("Rede",a.previousSchoolType)}
      ${e("Zona",a.previousSchoolZone)}
      ${e("Cidade/UF",(a.previousCity||"")+(a.previousState?"/"+a.previousState:""))}
    </div>
  `;return v({municipality:r,secretaria:t,school:o,title:"FICHA DE MATRÍCULA",subtitle:a.enrollmentType==="novato"?"NOVATO (PRIMEIRA MATRÍCULA)":a.enrollmentType==="renovacao"?"RENOVAÇÃO DE MATRÍCULA":"MATRÍCULA POR TRANSFERÊNCIA",content:s,signatories:l,fontFamily:"sans-serif",fontSize:11})}function _(a,o,r,t,l,s){const c=`<div class="student-info">
    <div class="si-name">Turma: ${o.grade} - ${o.className}</div>
    <div class="si-detail">Turno: ${g(o.shift)} | Ano Letivo: ${o.year} | Total: ${a.length} aluno(s)</div>
  </div>`;let d="",h=0,m=0;a.sort((i,$)=>(i.name||"").localeCompare($.name||"")),a.forEach((i,$)=>{i.sex==="M"?h++:i.sex==="F"&&m++,d+=`<tr>
      <td>${$+1}</td>
      <td style="text-align:left;font-weight:500">${i.name||"--"}</td>
      <td>${i.enrollment||"--"}</td>
      <td>${O(i.birthDate)}</td>
      <td>${i.sex||"--"}</td>
      <td>${i.studentStatus||"--"}</td>
    </tr>`});const f=`
    <table>
      <thead><tr><th style="width:40px">Nº</th><th style="text-align:left">NOME DO ALUNO(A)</th><th>MATRÍCULA</th><th>NASCIMENTO</th><th>SEXO</th><th>SITUAÇÃO</th></tr></thead>
      <tbody>${d}</tbody>
    </table>
    <div style="margin-top:15px;font-size:11px;display:flex;gap:30px">
      <span><b>Total:</b> ${a.length} aluno(s)</span>
      <span><b>Masculino:</b> ${h}</span>
      <span><b>Feminino:</b> ${m}</span>
    </div>
  `;return v({municipality:t,secretaria:l,school:r,title:"RELAÇÃO DE ALUNOS MATRICULADOS POR TURMA",subtitle:`${o.grade} - Turma ${o.className} - ${g(o.shift)} - ${o.year}`,content:c+f,signatories:s,fontFamily:"sans-serif",fontSize:11})}export{q as a,B as b,w as c,P as d,U as e,_ as f,z as g};
