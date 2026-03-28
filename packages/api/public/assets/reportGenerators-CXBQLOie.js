import{g as x}from"./reportTemplate-j2yUlUrQ.js";const P=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function D(e){if(!e)return"--";const i=typeof e=="string"?new Date(e):e;return isNaN(i.getTime())?String(e):`${i.getDate().toString().padStart(2,"0")}/${(i.getMonth()+1).toString().padStart(2,"0")}/${i.getFullYear()}`}function I(e){if(!e)return"--";const i=typeof e=="string"?new Date(e):e;return isNaN(i.getTime())?String(e):`${i.getDate()} de ${P[i.getMonth()]} de ${i.getFullYear()}`}function a(e,i){return`<div class="field-row"><span class="field-label">${e}</span><span class="field-value">${i||"--"}</span></div>`}function N(e){return e==="morning"?"MATUTINO":e==="afternoon"?"VESPERTINO":e==="evening"?"NOTURNO":e==="full_time"?"INTEGRAL":e||"--"}function L(e){if(!e)return"";const i=e.toLowerCase();return i.includes("berçário")||i.includes("bercario")||i.includes("maternal")||i.includes("jardim")||i.includes("pré")||i.includes("pre")||i.includes("creche")||i.includes("infantil")?"EDUCAÇÃO INFANTIL":i.includes("6º")||i.includes("7º")||i.includes("8º")||i.includes("9º")||i.includes("6 ano")||i.includes("7 ano")||i.includes("8 ano")||i.includes("9 ano")?"ENSINO FUNDAMENTAL – 6º ao 9º Ano":i.includes("1º")||i.includes("2º")||i.includes("3º")||i.includes("4º")||i.includes("5º")||i.includes("1 ano")||i.includes("2 ano")||i.includes("3 ano")||i.includes("4 ano")||i.includes("5 ano")?"ENSINO FUNDAMENTAL – 1º ao 5º Ano":i.includes("médio")||i.includes("medio")||i.includes("1ª série")||i.includes("2ª série")||i.includes("3ª série")?"ENSINO MÉDIO":i.includes("eja")||i.includes("supletivo")?"EDUCAÇÃO DE JOVENS E ADULTOS (EJA)":"ENSINO FUNDAMENTAL"}function w(e,i,r,n,d){const c=L(e.grade),s=new Date().getFullYear(),p=e.sex==="M"?"o":e.sex==="F"?"a":"o(a)",m=e.sex==="M"?"filho":e.sex==="F"?"filha":"filho(a)",v=e.sex==="M"?"nascido":e.sex==="F"?"nascida":"nascido(a)",b=e.naturalness?`natural de <b>${e.naturalness}${e.naturalnessUf?" – "+e.naturalnessUf:""}</b>, `:"",t=`
    <p class="declaration-text">
      Declaro para os devidos fins que <b>${e.name||"ALUNO(A)"}</b>,
      ${m} de <b>${e.motherName||"NOME DA MÃE"}</b>
      ${e.fatherName?" e de <b>"+e.fatherName+"</b>":""},
      ${b}${v} aos <b>${I(e.birthDate)}</b>,
      é alun${p} deste Estabelecimento de Ensino, está cursando
      <b>${e.grade||"--"} – ${c||"ENSINO FUNDAMENTAL"}</b>,
      do turno <b>${N(e.shift)}</b>
      no ano letivo de <b>${s}</b>
      Matrícula Nº <b>${e.enrollment||"--"}</b>.
    </p>
    <p class="declaration-text">
      Declaramos, outrossim, que ${p==="o"?"o":"a"} referid${p} alun${p} encontra-se com a situação acadêmica
      regular perante esta instituição de ensino, nada constando em seus registros que ${p==="o"?"o":"a"} desabone.
    </p>
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
    <div style="margin-top:15px;font-size:10px;color:#444;line-height:1.8;border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;background:#fafafa">
      <div style="font-weight:bold;color:#1B3A5C;font-size:11px;margin-bottom:4px;border-bottom:1px solid #e5e7eb;padding-bottom:4px">DADOS DO ALUNO</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 20px">
        <div><b>Nome:</b> ${e.name||"--"}</div>
        <div><b>Data de Nascimento:</b> ${D(e.birthDate)}</div>
        <div><b>Mãe:</b> ${e.motherName||"--"}</div>
        <div><b>Pai:</b> ${e.fatherName||"--"}</div>
        <div><b>Naturalidade:</b> ${e.naturalness||"--"}${e.naturalnessUf?"/"+e.naturalnessUf:""}</div>
        <div><b>Nacionalidade:</b> ${e.nationality||"Brasileira"}</div>
        <div><b>CPF:</b> ${e.cpf||"--"}</div>
        <div><b>RG:</b> ${e.rg||"--"}${e.rgOrgao?" – "+e.rgOrgao+"/"+(e.rgUf||""):""}</div>
        <div><b>NIS:</b> ${e.nis||"--"}</div>
        <div><b>Matrícula:</b> ${e.enrollment||"--"}</div>
        <div><b>Série/Ano:</b> ${e.grade||"--"}</div>
        <div><b>Turno:</b> ${N(e.shift)}</div>
      </div>
      ${i!=null&&i.code?`<div style="margin-top:4px"><b>ID Censo (INEP):</b> ${i.code}</div>`:""}
    </div>
  `;return x({municipality:r,secretaria:n,school:i,title:"DECLARAÇÃO DE ESCOLARIDADE",content:t,signatories:d,fontFamily:"serif",fontSize:13})}function B(e,i,r,n,d,c){const s=`
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${e.name||"ALUNO(A)"}</b>,
      nascido(a) em <b>${I(e.birthDate)}</b>,
      ${e.naturalness?"natural de <b>"+e.naturalness+(e.naturalnessUf?" – "+e.naturalnessUf:"")+"</b>,":""}
      ${e.motherName?"filho(a) de <b>"+e.motherName+"</b>":""}
      ${e.fatherName?" e de <b>"+e.fatherName+"</b>":""},
      esteve regularmente matriculado(a) neste Estabelecimento de Ensino durante o ano letivo de <b>${new Date().getFullYear()}</b>,
      cursando o(a) <b>${e.grade||"--"}</b>, no turno <b>${N(e.shift)}</b>,
      tendo obtido o seguinte resultado: <b>${e.studentStatus?e.studentStatus.toUpperCase():"APTO(A) PARA TRANSFERÊNCIA"}</b>.
    </p>
    <p class="declaration-text">
      O(A) aluno(a) acima qualificado(a) encontra-se em condições regulares para efetuar transferência
      para outra unidade de ensino, nada constando que impeça a referida movimentação escolar.
    </p>
    ${c?`<p class="declaration-text" style="text-indent:0"><b>Escola de destino:</b> ${c}</p>`:""}
    ${e.nis?`<div style="margin-top:20px;font-size:11px;color:#555"><b>NIS:</b> ${e.nis} &nbsp;&nbsp; <b>Matrícula:</b> ${e.enrollment||"--"}</div>`:""}
  `;return x({municipality:r,secretaria:n,school:i,title:"DECLARAÇÃO DE TRANSFERÊNCIA",content:s,signatories:d,fontFamily:"serif",fontSize:13})}function _(e,i,r,n,d,c){const s=`
    <p class="declaration-text">
      Declaramos, para os devidos fins e efeitos legais, que <b>${e.name||"ALUNO(A)"}</b>,
      portador(a) da Matrícula nº <b>${e.enrollment||"--"}</b>,
      encontra-se devidamente matriculado(a) e frequentando regularmente as atividades escolares
      neste Estabelecimento de Ensino, no(a) <b>${e.grade||"--"}</b>,
      turno <b>${N(e.shift)}</b>,
      durante o corrente ano letivo de <b>${new Date().getFullYear()}</b>.
    </p>
    
    <p class="declaration-text">
      Por ser expressão da verdade, firmamos a presente declaração para que produza os efeitos legais que se fizerem necessários.
    </p>
  `;return x({municipality:r,secretaria:n,school:i,title:"DECLARAÇÃO DE FREQUÊNCIA",content:s,signatories:d,fontFamily:"serif",fontSize:13})}function q(e,i,r,n,d){const c=new Date().getFullYear(),s=e.sex==="M"?"o":e.sex==="F"?"a":"o(a)",p=e.sex==="M"?"matriculado":e.sex==="F"?"matriculada":"matriculado(a)",m=`
    <p class="declaration-text">
      Declaramos, para os devidos fins, que <b>${e.name||"ALUNO(A)"}</b>,
      inscrit${s} no CPF sob o nº <b>${e.cpf||"--"}</b>,
      ${p}(a) sob o nº <b>${e.enrollment||"--"}</b>,
      no <b>${e.grade||"--"}</b>, turma <b>${e.classRoom||e.className||"--"}</b>,
      turno <b>${N(e.shift)}</b>,
      da <b>${(i==null?void 0:i.name)||"ESCOLA"}</b>,
      residente no endereço <b>${e.address||"--"}</b>,
      utiliza o transporte escolar oferecido pelo Município de
      <b>${(r==null?void 0:r.name)||(r==null?void 0:r.city)||"MUNICÍPIO"}</b>
      no ano letivo de <b>${c}</b>.
    </p>
    <p class="declaration-text">
      Por ser verdade, firmamos a presente declaração.
    </p>
  `;return x({municipality:r,secretaria:n,school:i,title:"DECLARAÇÃO DE TRANSPORTE ESCOLAR",content:m,signatories:d,fontFamily:"serif",fontSize:13})}function H(e,i,r,n,d,c,s){const p=s||new Date().getFullYear();let m=`<div class="student-info">
    <div class="si-name">${e.name||"ALUNO(A)"}</div>
    <div class="si-detail">Matrícula: ${e.enrollment||"--"} | Série/Ano: ${e.grade||"--"} | Turma: ${e.classRoom||e.className||"--"} | Turno: ${N(e.shift)}</div>
    <div class="si-detail">Ano Letivo: ${p}${e.birthDate?" | Data de Nascimento: "+D(e.birthDate):""}</div>
  </div>`,v="",b=0,t=0;for(const o of i){const g=o.b1??o.bim1??"--",E=o.b2??o.bim2??"--",l=o.b3??o.bim3??"--",h=o.b4??o.bim4??"--",A=[g,E,l,h].map($=>typeof $=="number"?$:parseFloat($)).filter($=>!isNaN($)),f=A.length>0?A.reduce(($,F)=>$+F,0)/A.length:null,M=o.faltas??o.absences??"--",S=f!==null?f>=6?"Aprovado":f>=0?"Reprovado":"--":"--",R=S==="Aprovado"?"approved":S==="Reprovado"?"failed":"";f!==null&&(b+=f,t++),v+=`<tr>
      <td style="text-align:left;font-weight:500">${o.subject||o.disciplina||"--"}</td>
      <td>${typeof g=="number"?g.toFixed(1):g}</td>
      <td>${typeof E=="number"?E.toFixed(1):E}</td>
      <td>${typeof l=="number"?l.toFixed(1):l}</td>
      <td>${typeof h=="number"?h.toFixed(1):h}</td>
      <td style="font-weight:bold;background:#f0f4f8">${f!==null?f.toFixed(1):"--"}</td>
      <td>${M}</td>
      <td class="${R}">${S}</td>
    </tr>`}const y=t>0?(b/t).toFixed(1):"--",T=t>0&&b/t>=6?"APROVADO(A)":t>0?"REPROVADO(A)":"--",C=`
    <table class="grade-table">
      <thead><tr>
        <th style="text-align:left;min-width:160px">COMPONENTE CURRICULAR</th>
        <th>1º BIM</th><th>2º BIM</th><th>3º BIM</th><th>4º BIM</th>
        <th style="background:#15304d">MÉDIA</th>
        <th>FALTAS</th>
        <th>SITUAÇÃO</th>
      </tr></thead>
      <tbody>${v}</tbody>
      <tfoot><tr class="total-row">
        <td style="text-align:right" colspan="5"><b>MÉDIA GERAL</b></td>
        <td style="font-weight:bold;background:#e0f2fe">${y}</td>
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
  `;return x({municipality:n,secretaria:d,school:r,title:"BOLETIM ESCOLAR",subtitle:`Ano Letivo ${p}`,content:m+C,signatories:c,fontFamily:"sans-serif",fontSize:12})}function k(e,i,r,n,d,c){var T,C;const s=L(e.grade),p=`
    <div class="section-title">DADOS DO ALUNO</div>
    <div class="field-grid">
      ${a("Nome Completo",e.name)}
      ${a("Data de Nascimento",D(e.birthDate))}
      ${a("Sexo",e.sex==="M"?"Masculino":e.sex==="F"?"Feminino":"--")}
      ${a("Nacionalidade",e.nationality||"Brasileira")}
      ${a("Naturalidade",(e.naturalness||"")+(e.naturalnessUf?" – "+e.naturalnessUf:""))}
      ${a("CPF",e.cpf)}
      ${a("RG / Órgão Emissor",e.rg?e.rg+(e.rgOrgao?" – "+e.rgOrgao+"/"+(e.rgUf||""):""):"--")}
      ${a("NIS",e.nis)}
    </div>
    <div class="section-title">FILIAÇÃO</div>
    <div class="field-grid">
      ${a("Pai",e.fatherName)}
      ${a("Mãe",e.motherName)}
    </div>
  `;let m="";for(const o of i){const g=(T=o.result)!=null&&T.toLowerCase().includes("aprov")?"approved":(C=o.result)!=null&&C.toLowerCase().includes("reprov")?"failed":"";m+=`<tr>
      <td>${o.year}</td>
      <td style="text-align:left">${o.grade}</td>
      <td style="text-align:left">${o.school}</td>
      <td class="${g}">${o.result||"--"}</td>
    </tr>`}const v=`
    <div class="section-title">HISTÓRICO DE ESCOLARIDADE</div>
    <table>
      <thead><tr><th style="width:60px">ANO</th><th style="text-align:left">SÉRIE/ANO</th><th style="text-align:left">ESTABELECIMENTO DE ENSINO</th><th style="width:100px">RESULTADO</th></tr></thead>
      <tbody>${m||'<tr><td colspan="4" style="color:#999">Nenhum registro encontrado</td></tr>'}</tbody>
    </table>
  `;let b="";const t=i.filter(o=>o.grades&&o.grades.length>0);if(t.length>0)for(const o of t){let g="",E=0;for(const l of o.grades||[]){const h=l.b1??l.bim1??"--",O=l.b2??l.bim2??"--",A=l.b3??l.bim3??"--",f=l.b4??l.bim4??"--",S=[h,O,A,f].map(u=>typeof u=="number"?u:parseFloat(u)).filter(u=>!isNaN(u)),R=S.length>0?S.reduce((u,U)=>u+U,0)/S.length:null,$=l.cargaHoraria||l.weeklyHours?(l.weeklyHours||0)*40:80;E+=$;const F=l.faltas??l.absences??"--";g+=`<tr>
          <td style="text-align:left;font-size:9px">${l.subject||l.disciplina||"--"}</td>
          <td style="font-size:9px">${typeof h=="number"?h.toFixed(1):h}</td>
          <td style="font-size:9px">${typeof O=="number"?O.toFixed(1):O}</td>
          <td style="font-size:9px">${typeof A=="number"?A.toFixed(1):A}</td>
          <td style="font-size:9px">${typeof f=="number"?f.toFixed(1):f}</td>
          <td style="font-size:9px;font-weight:bold">${R!==null?R.toFixed(1):"--"}</td>
          <td style="font-size:9px">${$}</td>
          <td style="font-size:9px">${F}</td>
        </tr>`}b+=`
        <div class="section-title" style="font-size:11px">${o.grade} – ANO LETIVO ${o.year} – ${o.school}</div>
        <table style="font-size:9px">
          <thead><tr>
            <th style="text-align:left;min-width:120px">COMPONENTE CURRICULAR</th>
            <th style="width:40px">1º B</th><th style="width:40px">2º B</th><th style="width:40px">3º B</th><th style="width:40px">4º B</th>
            <th style="width:45px;background:#15304d">MF</th>
            <th style="width:35px">CH</th>
            <th style="width:40px">FT</th>
          </tr></thead>
          <tbody>${g}</tbody>
          <tfoot><tr style="background:#f0f4f8;font-weight:bold">
            <td style="text-align:right;font-size:9px" colspan="6">TOTAL CARGA HORÁRIA</td>
            <td style="font-size:9px">${E}h</td>
            <td></td>
          </tr></tfoot>
        </table>
        <div style="font-size:8px;color:#888;margin-top:4px">
          <b>Legenda:</b> B = Bimestre | MF = Média Final | CH = Carga Horária | FT = Faltas |
          <b>Resultado:</b> ${o.result||"--"}
        </div>
      `}const y=`
    <div style="margin-top:12px;font-size:9px;color:#555;border:1px solid #e5e7eb;border-radius:4px;padding:8px">
      <b>OBSERVAÇÕES:</b><br>
      • Aprovação com média final igual ou superior a 6,0 (seis) e frequência mínima de 75%.<br>
      • O presente Histórico Escolar tem validade em todo o território nacional conforme LDB 9.394/96.
      ${r!=null&&r.code?"<br>• Código INEP da Escola: "+r.code:""}
      ${e.nis?"<br>• NIS do Aluno: "+e.nis:""}
    </div>
  `;return x({municipality:n,secretaria:d,school:r,title:"HISTÓRICO ESCOLAR",subtitle:s||void 0,content:p+v+b+y,signatories:c,fontFamily:"sans-serif",fontSize:11})}function G(e,i,r,n,d){var s;const c=`
    <div class="section-title">DADOS PESSOAIS DO ALUNO</div>
    <div style="display:flex;gap:15px;align-items:flex-start;margin-bottom:10px">
      <div style="width:80px;height:100px;border:1px solid #ccc;border-radius:6px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f3f4f6">
        ${e.photoUrl?'<img src="'+e.photoUrl+'" style="width:100%;height:100%;object-fit:cover"/>':'<span style="font-size:32px;color:#999">'+(((s=e.name)==null?void 0:s[0])||"?")+"</span>"}
      </div>
      <div style="flex:1">
    <div class="field-grid">
      ${a("Nome Completo",e.name)}
      ${a("Nº de Matrícula",e.enrollment)}
      ${a("Data de Nascimento",D(e.birthDate))}
      ${a("Sexo",e.sex==="M"?"Masculino":e.sex==="F"?"Feminino":"--")}
      ${a("Cor/Raça",e.race)}
      ${a("Nacionalidade",e.nationality)}
      ${a("Naturalidade",(e.naturalness||"")+(e.naturalnessUf?" – "+e.naturalnessUf:""))}
      ${a("CPF",e.cpf)}
      ${a("RG / Órgão Emissor",e.rg?e.rg+" – "+(e.rgOrgao||"")+"/"+(e.rgUf||""):"--")}
      ${a("NIS (Número de Identificação Social)",e.nis)}
      ${a("Cartão Nacional de Saúde (SUS)",e.cartaoSus)}
    </div>
    </div></div>

    <div class="section-title">CERTIDÃO DE NASCIMENTO</div>
    <div class="field-grid">
      ${a("Tipo",e.certidaoTipo)}
      ${a("Número",e.certidaoNumero)}
      ${a("Folha",e.certidaoFolha)}
      ${a("Livro",e.certidaoLivro)}
      ${a("Data de Emissão",e.certidaoData)}
      ${a("Cartório",e.certidaoCartorio)}
    </div>

    <div class="section-title">SITUAÇÃO ESCOLAR</div>
    <div class="field-grid">
      ${a("Unidade Escolar",(i==null?void 0:i.name)||"--")}
      ${a("Série/Ano",e.grade)}
      ${a("Turma",e.classRoom||e.className)}
      ${a("Turno",N(e.shift))}
      ${a("Tipo de Matrícula",e.enrollmentType==="novato"?"Novato (Primeira Matrícula)":e.enrollmentType==="renovacao"?"Renovação":e.enrollmentType==="transferencia"?"Transferência":"--")}
      ${a("Situação",e.studentStatus)}
    </div>

    <div class="section-title">ENDEREÇO RESIDENCIAL</div>
    <div class="field-grid">
      ${a("Logradouro",e.address)}
      ${a("Número",e.addressNumber)}
      ${a("Complemento",e.addressComplement)}
      ${a("Bairro",e.neighborhood)}
      ${a("CEP",e.cep)}
      ${a("Cidade/UF",(e.city||"")+(e.state?"/"+e.state:""))}
      ${a("Zona",e.zone==="rural"?"Rural":"Urbana")}
      ${a("Telefone Fixo",e.phone)}
      ${a("Telefone Celular",e.cellPhone)}
    </div>

    <div class="section-title">FILIAÇÃO – PAI</div>
    <div class="field-grid">
      ${a("Nome Completo",e.fatherName)}
      ${a("CPF",e.fatherCpf)}
      ${a("RG",e.fatherRg)}
      ${a("Telefone",e.fatherPhone)}
      ${a("Profissão",e.fatherProfession)}
      ${a("Local de Trabalho",e.fatherWorkplace)}
      ${a("Escolaridade",e.fatherEducation)}
      ${a("Naturalidade",(e.fatherNaturalness||"")+(e.fatherNaturalnessUf?" – "+e.fatherNaturalnessUf:""))}
    </div>

    <div class="section-title">FILIAÇÃO – MÃE</div>
    <div class="field-grid">
      ${a("Nome Completo",e.motherName)}
      ${a("CPF",e.motherCpf)}
      ${a("RG",e.motherRg)}
      ${a("Telefone",e.motherPhone)}
      ${a("Profissão",e.motherProfession)}
      ${a("Local de Trabalho",e.motherWorkplace)}
      ${a("Escolaridade",e.motherEducation)}
      ${a("Naturalidade",(e.motherNaturalness||"")+(e.motherNaturalnessUf?" – "+e.motherNaturalnessUf:""))}
    </div>

    <div class="section-title">SAÚDE DO ALUNO</div>
    <div class="field-grid">
      ${a("Tipo Sanguíneo",e.bloodType)}
      ${a("Alergias",e.allergies)}
      ${a("Medicamentos de Uso Contínuo",e.medications)}
      ${a("Observações de Saúde",e.healthNotes)}
    </div>

    <div class="section-title">NECESSIDADES ESPECIAIS</div>
    <div class="field-grid">
      ${a("Pessoa com Deficiência",e.hasSpecialNeeds?"Sim":"Não")}
      ${e.hasSpecialNeeds?a("Tipo de Deficiência",e.deficiencyType):""}
      ${e.hasSpecialNeeds?a("TGD (Transtorno Global do Desenvolvimento)",e.tgd):""}
      ${e.hasSpecialNeeds?a("Altas Habilidades/Superdotação",e.superdotacao?"Sim":"Não"):""}
      ${e.hasSpecialNeeds?a("Sala de Recursos Multifuncionais",e.salaRecursos?"Sim":"Não"):""}
      ${e.hasSpecialNeeds?a("Acompanhamento Especializado",e.acompanhamento):""}
      ${e.hasSpecialNeeds?a("Encaminhamento",e.encaminhamento):""}
      ${e.hasSpecialNeeds?a("Detalhes",e.specialNeedsNotes):""}
    </div>

    <div class="section-title">TRANSPORTE ESCOLAR</div>
    <div class="field-grid">
      ${a("Necessita Transporte Escolar",e.needsTransport?"Sim":"Não")}
      ${e.needsTransport?a("Tipo de Transporte",e.transportType):""}
      ${e.needsTransport?a("Distância Residência–Escola",e.transportDistance?e.transportDistance+" km":"--"):""}
      ${e.needsTransport?a("Rota",e.routeName):""}
    </div>

    <div class="section-title">PROGRAMAS SOCIAIS</div>
    <div class="field-grid">
      ${a("Bolsa Família",e.bolsaFamilia?"Sim":"Não")}
      ${a("BPC (Benefício de Prestação Continuada)",e.bpc?"Sim":"Não")}
      ${a("PETI (Programa de Erradicação do Trabalho Infantil)",e.peti?"Sim":"Não")}
      ${a("Outros Programas",e.otherPrograms)}
      ${a("Renda Familiar Mensal",e.familyIncome?"R$ "+e.familyIncome:"--")}
    </div>

    <div class="section-title">CONTATOS DE EMERGÊNCIA</div>
    <div class="field-grid">
      ${a("Contato 1 – Nome",e.emergencyContact1Name)}
      ${a("Contato 1 – Telefone",e.emergencyContact1Phone)}
      ${a("Contato 1 – Parentesco",e.emergencyContact1Relation)}
      ${a("Contato 2 – Nome",e.emergencyContact2Name)}
      ${a("Contato 2 – Telefone",e.emergencyContact2Phone)}
      ${a("Contato 2 – Parentesco",e.emergencyContact2Relation)}
    </div>

    <div class="section-title">PROCEDÊNCIA ESCOLAR</div>
    <div class="field-grid">
      ${a("Escola Anterior",e.previousSchool)}
      ${a("Rede",e.previousSchoolType==="municipal"?"Municipal":e.previousSchoolType==="estadual"?"Estadual":e.previousSchoolType==="federal"?"Federal":e.previousSchoolType==="particular"?"Particular":e.previousSchoolType)}
      ${a("Zona",e.previousSchoolZone==="urbana"?"Urbana":e.previousSchoolZone==="rural"?"Rural":e.previousSchoolZone)}
      ${a("Cidade/UF",(e.previousCity||"")+(e.previousState?"/"+e.previousState:""))}
    </div>

    ${e.observations?`<div class="section-title">OBSERVAÇÕES</div><div class="field-grid"><div style="grid-column:1/-1;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:11px;min-height:40px">${e.observations}</div></div>`:""}

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
  `;return x({municipality:r,secretaria:n,school:i,title:"FICHA DE MATRÍCULA",subtitle:e.enrollmentType==="novato"?"NOVATO (PRIMEIRA MATRÍCULA)":e.enrollmentType==="renovacao"?"RENOVAÇÃO DE MATRÍCULA":"MATRÍCULA POR TRANSFERÊNCIA",content:c,signatories:d,fontFamily:"sans-serif",fontSize:11})}function V(e,i,r,n,d,c){const s=`<div class="student-info">
    <div class="si-name">Turma: ${i.grade} - ${i.className}</div>
    <div class="si-detail">Turno: ${N(i.shift)} | Ano Letivo: ${i.year} | Total: ${e.length} aluno(s)</div>
  </div>`;let p="",m=0,v=0;e.sort((t,y)=>(t.name||"").localeCompare(y.name||"")),e.forEach((t,y)=>{t.sex==="M"?m++:t.sex==="F"&&v++,p+=`<tr>
      <td>${y+1}</td>
      <td style="text-align:left;font-weight:500">${t.name||"--"}</td>
      <td>${t.enrollment||"--"}</td>
      <td>${D(t.birthDate)}</td>
      <td>${t.sex||"--"}</td>
      <td>${t.studentStatus||"--"}</td>
    </tr>`});const b=`
    <table>
      <thead><tr><th style="width:40px">Nº</th><th style="text-align:left">NOME DO ALUNO(A)</th><th>MATRÍCULA</th><th>NASCIMENTO</th><th>SEXO</th><th>SITUAÇÃO</th></tr></thead>
      <tbody>${p}</tbody>
    </table>
    <div style="margin-top:15px;font-size:11px;display:flex;gap:30px">
      <span><b>Total:</b> ${e.length} aluno(s)</span>
      <span><b>Masculino:</b> ${m}</span>
      <span><b>Feminino:</b> ${v}</span>
    </div>
  `;return x({municipality:n,secretaria:d,school:r,title:"RELAÇÃO DE ALUNOS MATRICULADOS POR TURMA",subtitle:`${i.grade} - Turma ${i.className} - ${N(i.shift)} - ${i.year}`,content:s+b,signatories:c,fontFamily:"sans-serif",fontSize:11})}export{_ as a,B as b,G as c,q as d,H as e,k as f,w as g,V as h};
