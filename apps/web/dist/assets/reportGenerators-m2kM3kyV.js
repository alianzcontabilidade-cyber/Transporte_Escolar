import{g as h}from"./reportTemplate-B5q6vbjZ.js";const L=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function y(a){if(!a)return"--";const i=typeof a=="string"?new Date(a):a;return isNaN(i.getTime())?String(a):`${i.getDate().toString().padStart(2,"0")}/${(i.getMonth()+1).toString().padStart(2,"0")}/${i.getFullYear()}`}function O(a){if(!a)return"--";const i=typeof a=="string"?new Date(a):a;return isNaN(i.getTime())?String(a):`${i.getDate()} de ${L[i.getMonth()]} de ${i.getFullYear()}`}function e(a,i){return`<div class="field-row"><span class="field-label">${a}</span><span class="field-value">${i||"--"}</span></div>`}function g(a){return a==="morning"?"MATUTINO":a==="afternoon"?"VESPERTINO":a==="evening"?"NOTURNO":a||"--"}function U(a,i,r,t,l){const s=`
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${a.name||"ALUNO"}</b>,
      ${a.motherName?"filho(a) de <b>"+a.motherName+"</b>":""}
      ${a.fatherName?" e de <b>"+a.fatherName+"</b>":""},
      nascido(a) em <b>${O(a.birthDate)}</b>,
      ${a.naturalness?"natural de <b>"+a.naturalness+(a.naturalnessUf?"/"+a.naturalnessUf:"")+"</b>,":""}
      e aluno(a) deste Estabelecimento de Ensino, esta cursando o(a) <b>${a.grade||"--"}</b>
      do turno <b>${g(a.shift)}</b>,
      no ano letivo de <b>${new Date().getFullYear()}</b>,
      com Matrícula N. <b>${a.enrollment||"--"}</b>.
    </p>
    <p class="declaration-text">
      Declaramos ainda que o(a) referido(a) aluno(a) encontra-se com a situação acadêmica regular
      nesta instituição de ensino, nada constando que o(a) desabone.
    </p>
    ${a.nis?`<div style="margin-top:20px;font-size:11px;color:#666"><b>NIS:</b> ${a.nis}</div>`:""}
    ${a.code||i!=null&&i.code?`<div style="font-size:11px;color:#666"><b>INEP:</b> ${(i==null?void 0:i.code)||""}</div>`:""}
  `;return h({municipality:r,secretaria:t,school:i,title:"DECLARAÇÃO DE ESCOLARIDADE",content:s,signatories:l,fontFamily:"serif",fontSize:13})}function P(a,i,r,t,l,s){const c=`
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${a.name||"ALUNO"}</b>,
      nascido(a) em <b>${O(a.birthDate)}</b>,
      ${a.naturalness?"em <b>"+a.naturalness+(a.naturalnessUf?"/"+a.naturalnessUf:"")+"</b>,":""}
      ${a.motherName?"filho(a) de <b>"+a.motherName+"</b>":""}
      ${a.fatherName?" e de <b>"+a.fatherName+"</b>":""},
      cursou neste Estabelecimento de Ensino, no ano letivo de <b>${new Date().getFullYear()}</b>,
      o(a) <b>${a.grade||"--"}</b>, no turno <b>${g(a.shift)}</b>,
      tendo sido considerado(a): <b>${a.studentStatus?a.studentStatus.toUpperCase():"APTO(A) PARA TRANSFERENCIA"}</b>.
    </p>
    
    ${a.nis?`<div style="margin-top:20px;font-size:11px;color:#666"><b>NIS:</b> ${a.nis} &nbsp;&nbsp; <b>Matricula:</b> ${a.enrollment||"--"}</div>`:""}
  `;return h({municipality:r,secretaria:t,school:i,title:"DECLARAÇÃO DE TRANSFERÊNCIA",content:c,signatories:l,fontFamily:"serif",fontSize:13})}function w(a,i,r,t,l,s){const c=`
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${a.name||"ALUNO"}</b>,
      matrícula <b>${a.enrollment||"--"}</b>,
      é aluno(a) regularmente matriculado(a) neste Estabelecimento de Ensino,
      no(a) <b>${a.grade||"--"}</b>, turno <b>${g(a.shift)}</b>,
      e que frequenta regularmente as aulas no corrente ano letivo de <b>${new Date().getFullYear()}</b>.
    </p>
    
  `;return h({municipality:r,secretaria:t,school:i,title:"DECLARAÇÃO DE FREQUÊNCIA",content:c,signatories:l,fontFamily:"serif",fontSize:13})}function z(a,i,r,t,l,s,c){const f=c||new Date().getFullYear();let v=`<div class="student-info">
    <div class="si-name">${a.name||"ALUNO"}</div>
    <div class="si-detail">Matricula: ${a.enrollment||"--"} | Serie: ${a.grade||"--"} | Turma: ${a.classRoom||a.className||"--"} | Turno: ${g(a.shift)}</div>
    <div class="si-detail">Ano Letivo: ${f}${a.birthDate?" | Nascimento: "+y(a.birthDate):""}</div>
  </div>`,m="",d=0,o=0;for(const n of i){const A=n.b1??n.bim1??"--",N=n.b2??n.bim2??"--",E=n.b3??n.bim3??"--",S=n.b4??n.bim4??"--",T=[A,N,E,S].map(p=>typeof p=="number"?p:parseFloat(p)).filter(p=>!isNaN(p)),b=T.length>0?T.reduce((p,I)=>p+I,0)/T.length:null,F=n.faltas??n.absences??"--",D=b!==null?b>=6?"Aprovado":b>=0?"Reprovado":"--":"--",M=D==="Aprovado"?"approved":D==="Reprovado"?"failed":"";b!==null&&(d+=b,o++),m+=`<tr>
      <td style="text-align:left;font-weight:500">${n.subject||n.disciplina||"--"}</td>
      <td>${typeof A=="number"?A.toFixed(1):A}</td>
      <td>${typeof N=="number"?N.toFixed(1):N}</td>
      <td>${typeof E=="number"?E.toFixed(1):E}</td>
      <td>${typeof S=="number"?S.toFixed(1):S}</td>
      <td style="font-weight:bold;background:#f0f4f8">${b!==null?b.toFixed(1):"--"}</td>
      <td>${F}</td>
      <td class="${M}">${D}</td>
    </tr>`}const $=o>0?(d/o).toFixed(1):"--",R=o>0&&d/o>=6?"APROVADO(A)":o>0?"REPROVADO(A)":"--",C=`
    <table class="grade-table">
      <thead><tr>
        <th style="text-align:left;min-width:160px">DISCIPLINAS / ATIVIDADES</th>
        <th>1 BIM</th><th>2 BIM</th><th>3 BIM</th><th>4 BIM</th>
        <th style="background:#15304d">MEDIA</th>
        <th>FALTAS</th>
        <th>SITUAÇÃO</th>
      </tr></thead>
      <tbody>${m}</tbody>
      <tfoot><tr class="total-row">
        <td style="text-align:right" colspan="5"><b>MEDIA GERAL</b></td>
        <td style="font-weight:bold;background:#e0f2fe">${$}</td>
        <td></td>
        <td style="font-weight:bold">${R}</td>
      </tr></tfoot>
    </table>
    <div style="margin-top:15px;font-size:10px;color:#888">
      <b>Legenda:</b> BIM = Bimestre | MEDIA = Media Aritmetica dos Bimestres | FALTAS = Total de faltas no ano<br>
      Aluno(a) considerado(a) <b>APROVADO(A)</b> quando a média final for igual ou superior a <b>6,0</b> (seis) e frequência mínima de <b>75%</b>.
    </div>
    <div style="margin-top:10px;font-size:11px;color:#555;font-style:italic;text-align:center">
      "Pais, a sua participação na escola é muito significativa, pois contribui para uma gestão democrática e qualidade no ensino."
    </div>
  `;return h({municipality:t,secretaria:l,school:r,title:"BOLETIM ESCOLAR",subtitle:`Ano Letivo ${f}`,content:v+C,signatories:s,fontFamily:"sans-serif",fontSize:12})}function B(a,i,r,t,l,s){var m,d;const c=`
    <div class="section-title">DADOS DO ALUNO</div>
    <div class="field-grid">
      ${e("Nome",a.name)}
      ${e("Data Nascimento",y(a.birthDate))}
      ${e("Sexo",a.sex==="M"?"Masculino":a.sex==="F"?"Feminino":"--")}
      ${e("Nacionalidade",a.nationality)}
      ${e("Naturalidade",(a.naturalness||"")+(a.naturalnessUf?"/"+a.naturalnessUf:""))}
      ${e("CPF",a.cpf)}
      ${e("RG",a.rg?a.rg+(a.rgOrgao?" - "+a.rgOrgao+"/"+(a.rgUf||""):""):"--")}
      ${e("NIS",a.nis)}
    </div>
    <div class="section-title">FILIAÇÃO</div>
    <div class="field-grid">
      ${e("Pai",a.fatherName)}
      ${e("Mae",a.motherName)}
    </div>
  `;let f="";for(const o of i){const $=(m=o.result)!=null&&m.toLowerCase().includes("aprov")?"approved":(d=o.result)!=null&&d.toLowerCase().includes("reprov")?"failed":"";f+=`<tr>
      <td>${o.year}</td>
      <td style="text-align:left">${o.grade}</td>
      <td style="text-align:left">${o.school}</td>
      <td class="${$}">${o.result||"--"}</td>
    </tr>`}const v=`
    <div class="section-title">HISTORICO DE ESCOLARIDADE</div>
    <table>
      <thead><tr><th>ANO</th><th style="text-align:left">SERIE/ANO</th><th style="text-align:left">ESTABELECIMENTO</th><th>RESULTADO</th></tr></thead>
      <tbody>${f||'<tr><td colspan="4" style="color:#999">Nenhum registro encontrado</td></tr>'}</tbody>
    </table>
  `;return h({municipality:t,secretaria:l,school:r,title:"HISTÓRICO ESCOLAR",content:c+v,signatories:s,fontFamily:"sans-serif",fontSize:11})}function q(a,i,r,t,l){const s=`
    <div class="section-title">DADOS PESSOAIS</div>
    <div class="field-grid">
      ${e("Nome",a.name)}
      ${e("Matricula",a.enrollment)}
      ${e("Data Nascimento",y(a.birthDate))}
      ${e("Sexo",a.sex==="M"?"Masculino":a.sex==="F"?"Feminino":"--")}
      ${e("Cor/Raca",a.race)}
      ${e("Nacionalidade",a.nationality)}
      ${e("Naturalidade",(a.naturalness||"")+(a.naturalnessUf?"/"+a.naturalnessUf:""))}
      ${e("CPF",a.cpf)}
      ${e("RG",a.rg?a.rg+" "+(a.rgOrgao||"")+"/"+(a.rgUf||""):"--")}
      ${e("NIS",a.nis)}
      ${e("Cartao SUS",a.cartaoSus)}
    </div>

    <div class="section-title">CERTIDÃO DE NASCIMENTO</div>
    <div class="field-grid">
      ${e("Tipo",a.certidaoTipo)}
      ${e("Numero",a.certidaoNumero)}
      ${e("Folha",a.certidaoFolha)}
      ${e("Livro",a.certidaoLivro)}
      ${e("Data Emissão",a.certidaoData)}
      ${e("Cartório",a.certidaoCartorio)}
    </div>

    <div class="section-title">SITUAÇÃO ESCOLAR</div>
    <div class="field-grid">
      ${e("Escola",(i==null?void 0:i.name)||"--")}
      ${e("Serie/Ano",a.grade)}
      ${e("Turma",a.classRoom||a.className)}
      ${e("Turno",g(a.shift))}
      ${e("Tipo Matricula",a.enrollmentType==="novato"?"Novato (Primeira Matrícula)":a.enrollmentType==="renovacao"?"Renovação":a.enrollmentType==="transferencia"?"Transferência":"--")}
      ${e("Situação",a.studentStatus)}
    </div>

    <div class="section-title">ENDERECO</div>
    <div class="field-grid">
      ${e("Logradouro",a.address)}
      ${e("Numero",a.addressNumber)}
      ${e("Complemento",a.addressComplement)}
      ${e("Bairro",a.neighborhood)}
      ${e("CEP",a.cep)}
      ${e("Cidade/UF",(a.city||"")+(a.state?"/"+a.state:""))}
      ${e("Zona",a.zone==="rural"?"Rural":"Urbana")}
      ${e("Telefone",a.phone)}
      ${e("Celular",a.cellPhone)}
    </div>

    <div class="section-title">FILIAÇÃO - PAI</div>
    <div class="field-grid">
      ${e("Nome",a.fatherName)}
      ${e("CPF",a.fatherCpf)}
      ${e("RG",a.fatherRg)}
      ${e("Telefone",a.fatherPhone)}
      ${e("Profissão",a.fatherProfession)}
      ${e("Local Trabalho",a.fatherWorkplace)}
      ${e("Escolaridade",a.fatherEducation)}
      ${e("Naturalidade",(a.fatherNaturalness||"")+(a.fatherNaturalnessUf?"/"+a.fatherNaturalnessUf:""))}
    </div>

    <div class="section-title">FILIAÇÃO - MAE</div>
    <div class="field-grid">
      ${e("Nome",a.motherName)}
      ${e("CPF",a.motherCpf)}
      ${e("RG",a.motherRg)}
      ${e("Telefone",a.motherPhone)}
      ${e("Profissão",a.motherProfession)}
      ${e("Local Trabalho",a.motherWorkplace)}
      ${e("Escolaridade",a.motherEducation)}
      ${e("Naturalidade",(a.motherNaturalness||"")+(a.motherNaturalnessUf?"/"+a.motherNaturalnessUf:""))}
    </div>

    <div class="section-title">INFORMAÇÕES COMPLEMENTARES</div>
    <div class="field-grid">
      ${e("Renda Familiar",a.familyIncome)}
      ${e("Tipo Sanguineo",a.bloodType)}
      ${e("Alergias",a.allergies)}
      ${e("Medicamentos",a.medications)}
      ${e("Transporte Escolar",a.needsTransport?"Sim - "+(a.transportType||"")+" "+(a.transportDistance?a.transportDistance+" km":""):"Nao")}
      ${e("Bolsa Familia",a.bolsaFamilia?"Sim":"Nao")}
      ${e("BPC",a.bpc?"Sim":"Nao")}
      ${e("Deficiência",a.hasSpecialNeeds?a.deficiencyType||"Sim":"Nao")}
    </div>

    <div class="section-title">PROCEDÊNCIA</div>
    <div class="field-grid">
      ${e("Escola Anterior",a.previousSchool)}
      ${e("Rede",a.previousSchoolType)}
      ${e("Zona",a.previousSchoolZone)}
      ${e("Cidade/UF",(a.previousCity||"")+(a.previousState?"/"+a.previousState:""))}
    </div>
  `;return h({municipality:r,secretaria:t,school:i,title:"FICHA DE MATRÍCULA",subtitle:a.enrollmentType==="novato"?"NOVATO (PRIMEIRA MATRÍCULA)":a.enrollmentType==="renovacao"?"RENOVAÇÃO DE MATRÍCULA":"MATRÍCULA POR TRANSFERÊNCIA",content:s,signatories:l,fontFamily:"sans-serif",fontSize:11})}function V(a,i,r,t,l,s){const c=`<div class="student-info">
    <div class="si-name">Turma: ${i.grade} - ${i.className}</div>
    <div class="si-detail">Turno: ${g(i.shift)} | Ano Letivo: ${i.year} | Total: ${a.length} aluno(s)</div>
  </div>`;let f="",v=0,m=0;a.sort((o,$)=>(o.name||"").localeCompare($.name||"")),a.forEach((o,$)=>{o.sex==="M"?v++:o.sex==="F"&&m++,f+=`<tr>
      <td>${$+1}</td>
      <td style="text-align:left;font-weight:500">${o.name||"--"}</td>
      <td>${o.enrollment||"--"}</td>
      <td>${y(o.birthDate)}</td>
      <td>${o.sex||"--"}</td>
      <td>${o.studentStatus||"--"}</td>
    </tr>`});const d=`
    <table>
      <thead><tr><th style="width:40px">N</th><th style="text-align:left">NOME DO ALUNO</th><th>MATRICULA</th><th>NASCIMENTO</th><th>SEXO</th><th>SITUAÇÃO</th></tr></thead>
      <tbody>${f}</tbody>
    </table>
    <div style="margin-top:15px;font-size:11px;display:flex;gap:30px">
      <span><b>Total:</b> ${a.length} aluno(s)</span>
      <span><b>Masculino:</b> ${v}</span>
      <span><b>Feminino:</b> ${m}</span>
    </div>
  `;return h({municipality:t,secretaria:l,school:r,title:"RELAÇÃO DE ALUNOS MATRICULADOS POR TURMA",subtitle:`${i.grade} - Turma ${i.className} - ${g(i.shift)} - ${i.year}`,content:c+d,signatories:s,fontFamily:"sans-serif",fontSize:11})}export{B as a,q as b,w as c,P as d,U as e,V as f,z as g};
