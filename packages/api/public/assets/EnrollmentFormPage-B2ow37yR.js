import{b as O,r as d,e as N,j as e,F,l as U,h as q,U as Y,a as b,s as D}from"./index-DoGLOjPf.js";import{getMunicipalityReport as H,buildTableReportHTML as G}from"./reportUtils-CklveqV1.js";import{P as A,R as Q,E as V,h as J,a as K}from"./reportTemplate-ko08xXS5.js";import{b as W}from"./reportGenerators-C54eh0tV.js";import"./globe-wK8YvWPY.js";import"./check-9j57dJf4.js";import"./chevron-up-DeKpRbAh.js";import"./chevron-down-DvkacMSa.js";function le(){var C,$,E;const{user:v}=O(),l=(v==null?void 0:v.municipalityId)||0,[p,z]=d.useState(""),[r,m]=d.useState(null),[x,k]=d.useState(null),[s,w]=d.useState(null),[y,R]=d.useState([]);d.useEffect(()=>{l&&H(l,b).then(k).catch(()=>{})},[l]);const{data:I}=N(()=>b.students.list({municipalityId:l}),[l]),{data:T}=N(()=>b.schools.list({municipalityId:l}),[l]),{data:M}=N(()=>b.municipalities.getById({id:l}),[l]),_=(I||[]).filter(i=>{var a;return!p||((a=i.name)==null?void 0:a.toLowerCase().includes(p.toLowerCase()))||(i.enrollment||"").includes(p)}),j=T||[],o=M,g=i=>j.find(a=>a.id===i),S=i=>{const a=i||{},c=g(a.schoolId),n=a.shift==="afternoon"?"Tarde":a.shift==="evening"?"Noite":a.shift?"Manhã":"________",h=u=>u?new Date(u).toLocaleDateString("pt-BR"):"____/____/________",t=(u,P,X)=>`<div class="field" style=""><div class="field-label">${u}</div><div class="field-value">${P||"_".repeat(40)}</div></div>`,L=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha de Matrícula - NetEscol</title>
    <style>
      @page{size:A4;margin:12mm}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:20px 25px;color:#333;font-size:12px;line-height:1.4}
      .header{text-align:center;border-bottom:3px solid #2DB5B0;padding-bottom:12px;margin-bottom:15px}
      .header h1{color:#1B3A5C;font-size:14px;margin:0}
      .header h2{font-size:11px;color:#666;margin:3px 0 0}
      .header .logo{font-size:18px;font-weight:bold;color:#1B3A5C;margin-bottom:3px}
      .header .logo span{color:#2DB5B0}
      .title{background:#1B3A5C;color:white;padding:5px 12px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:15px 0 8px;border-radius:3px}
      .grid{display:grid;gap:6px}
      .grid-2{grid-template-columns:1fr 1fr}
      .grid-3{grid-template-columns:1fr 1fr 1fr}
      .grid-4{grid-template-columns:1fr 1fr 1fr 1fr}
      .field{padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;min-height:32px}
      .field-label{font-size:8px;color:#999;text-transform:uppercase;letter-spacing:0.5px}
      .field-value{font-size:11px;font-weight:500;margin-top:1px;min-height:14px}
      .checkbox{display:inline-flex;align-items:center;gap:4px;font-size:10px;margin-right:12px}
      .checkbox-box{width:12px;height:12px;border:1px solid #999;display:inline-block;text-align:center;font-size:9px;line-height:12px}
      .section-note{font-size:9px;color:#999;font-style:italic;margin:4px 0}
      .signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:40px}
      .sig{text-align:center;border-top:1px solid #333;padding-top:4px;font-size:10px;color:#666}
      .footer{margin-top:20px;text-align:center;font-size:8px;color:#bbb;border-top:1px solid #eee;padding-top:5px}
      @media print{body{padding:10px 15px}}
    </style></head><body>
    <div class="header">
      <div class="logo">Net<span>Escol</span></div>
      <h1>${(c==null?void 0:c.name)||(o==null?void 0:o.name)||"UNIDADE ESCOLAR"}</h1>
      <h2>${(o==null?void 0:o.name)||""} - ${(o==null?void 0:o.city)||""}/${(o==null?void 0:o.state)||""}</h2>
    </div>

    <div style="text-align:center;font-size:14px;font-weight:bold;color:#1B3A5C;margin:10px 0;text-transform:uppercase;letter-spacing:2px">FICHA DE MATRICULA</div>
    <div style="text-align:center;font-size:10px;color:#666;margin-bottom:15px">Ano Letivo: ${new Date().getFullYear()}</div>

    <div class="title">1. DADOS DO ALUNO</div>
    <div class="grid grid-2">
      ${t("Nome completo",a.name)}
      ${t("Data de nascimento",h(a.birthDate))}
    </div>
    <div class="grid grid-4" style="margin-top:6px">
      ${t("Matricula",a.enrollment)}
      ${t("Serie/Ano",a.grade)}
      ${t("Turma",a.classRoom||a.className)}
      ${t("Turno",n)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${t("Naturalidade","")}
      ${t("Nacionalidade","Brasileira")}
    </div>
    <div style="margin-top:6px;font-size:10px">
      <b>Sexo:</b> <span class="checkbox"><span class="checkbox-box"></span> Masculino</span> <span class="checkbox"><span class="checkbox-box"></span> Feminino</span>
      &nbsp;&nbsp;<b>Cor/Raca:</b> <span class="checkbox"><span class="checkbox-box"></span> Branca</span> <span class="checkbox"><span class="checkbox-box"></span> Parda</span> <span class="checkbox"><span class="checkbox-box"></span> Preta</span> <span class="checkbox"><span class="checkbox-box"></span> Amarela</span> <span class="checkbox"><span class="checkbox-box"></span> Indigena</span>
    </div>

    <div class="title">2. ENDERECO</div>
    <div class="grid grid-2">
      ${t("Endereco completo",a.address)}
      ${t("Bairro","")}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${t("Cidade",(o==null?void 0:o.city)||"")}
      ${t("Estado",(o==null?void 0:o.state)||"")}
      ${t("CEP","")}
    </div>

    <div class="title">3. FILIACAO</div>
    <div class="grid grid-2">
      ${t("Nome da mae","")}
      ${t("Nome do pai","")}
    </div>

    <div class="title">4. RESPONSAVEL</div>
    <div class="grid grid-3">
      ${t("Nome",a.emergencyContact1Name)}
      ${t("Telefone",a.emergencyContact1Phone)}
      ${t("Parentesco",a.emergencyContact1Relation)}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${t("Nome (2o responsavel)",a.emergencyContact2Name)}
      ${t("Telefone",a.emergencyContact2Phone)}
      ${t("Parentesco",a.emergencyContact2Relation)}
    </div>

    <div class="title">5. SAUDE</div>
    <div class="grid grid-3">
      ${t("Tipo sanguineo",a.bloodType)}
      ${t("Alergias",a.allergies)}
      ${t("Medicamentos",a.medications)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${t("Necessidades especiais",a.hasSpecialNeeds?"Sim - "+(a.specialNeedsNotes||""):"Nao")}
      ${t("Observacoes de saude",a.healthNotes)}
    </div>

    <div class="title">6. TRANSPORTE ESCOLAR</div>
    <div style="font-size:10px;margin:6px 0">
      <b>Utiliza transporte escolar?</b> <span class="checkbox"><span class="checkbox-box"></span> Sim</span> <span class="checkbox"><span class="checkbox-box"></span> Nao</span>
    </div>

    <div class="title">7. DECLARACAO</div>
    <div style="font-size:10px;text-align:justify;margin:6px 0;line-height:1.5">
      Declaro que as informações prestadas sao verdadeiras e me responsabilizo por qualquer informacao incorreta. Comprometo-me a comunicar a escola qualquer alteracao nos dados acima. Autorizo a escola a utilizar a imagem do(a) aluno(a) em atividades pedagogicas e eventos escolares.
    </div>

    <div style="text-align:right;font-size:11px;margin:20px 0">${(o==null?void 0:o.city)||"_________"}, ______ de _________________ de ${new Date().getFullYear()}</div>

    <div class="signatures">
      <div class="sig">Responsável Legal</div>
      <div class="sig">Secretario(a) Escolar</div>
      <div class="sig">Diretor(a)</div>
    </div>

    <div class="footer">NetEscol - Sistema de Gestao Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`,f=window.open("","_blank");f&&(f.document.write(L),f.document.close(),setTimeout(()=>f.print(),500))},B=()=>{if(s&&x){const i=K(s.schoolId,j),a=W(s,i,x.municipality,x.secretaria,y);if(!a){D("Erro ao gerar ficha");return}m({html:a,filename:"ficha_matricula_"+(s.name||"").replace(/\s/g,"_")})}else{const i=_.map(n=>{var h;return{nome:n.name||"--",matrícula:n.enrollment||"--",serie:n.grade||"--",turma:n.classRoom||"--",turno:n.shift==="afternoon"?"Tarde":n.shift==="evening"?"Noite":n.shift==="full_time"?"Integral":"Manhã",escola:((h=g(n.schoolId))==null?void 0:h.name)||"--"}}),c=G("LISTA DE ALUNOS MATRICULADOS",i,["Nome","Matricula","Serie","Turma","Turno","Escola"],x,{orientation:"landscape",signatories:y});if(!c){D("Nenhum dado para exportar");return}m({html:c,filename:"lista_alunos_matriculados"})}};return e.jsxs("div",{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center",children:e.jsx(F,{size:20,className:"text-indigo-600"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Ficha de Matrícula"}),e.jsx("p",{className:"text-gray-500",children:"Formulário oficial para impressão"})]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:()=>S(),className:"btn-secondary flex items-center gap-2",children:[e.jsx(A,{size:16})," Imprimir em Branco"]}),s&&e.jsxs("button",{onClick:()=>S(s),className:"btn-primary flex items-center gap-2",children:[e.jsx(A,{size:16})," Imprimir Preenchida"]}),e.jsxs("button",{onClick:B,className:"btn-secondary flex items-center gap-2",children:[e.jsx(U,{size:16})," Exportar"]})]})]}),e.jsx(Q,{selected:y,onChange:R}),e.jsxs("div",{className:"grid grid-cols-3 gap-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"relative mb-3",children:[e.jsx(q,{size:15,className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"}),e.jsx("input",{className:"input pl-9",placeholder:"Buscar aluno...",value:p,onChange:i=>z(i.target.value)})]}),e.jsx("div",{className:"space-y-1 max-h-[65vh] overflow-y-auto",children:_.slice(0,50).map(i=>{var a;return e.jsxs("button",{onClick:()=>w(i),className:`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${(s==null?void 0:s.id)===i.id?"bg-indigo-50 border border-indigo-200":"hover:bg-gray-50 border border-transparent"}`,children:[e.jsx("div",{className:"w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0",children:(a=i.name)==null?void 0:a[0]}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"text-sm font-medium truncate",children:i.name}),i.enrollment&&e.jsxs("p",{className:"text-xs text-gray-400",children:["Mat. ",i.enrollment]})]})]},i.id)})})]}),e.jsx("div",{className:"col-span-2",children:s?e.jsxs("div",{className:"card",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4 pb-4 border-b",children:[e.jsx("div",{className:"w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700",children:(C=s.name)==null?void 0:C[0]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-bold text-gray-900",children:s.name}),e.jsxs("p",{className:"text-sm text-gray-500",children:[s.enrollment?"Mat. "+s.enrollment:""," · ",s.grade||""," · ",(($=g(s.schoolId))==null?void 0:$.name)||""]})]})]}),e.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:["Clique em ",e.jsx("b",{children:'"Imprimir Preenchida"'})," para imprimir a ficha com os dados deste aluno, ou ",e.jsx("b",{children:'"Imprimir em Branco"'})," para um formulario vazio. Use ",e.jsx("b",{children:'"Exportar"'})," para outros formatos."]}),e.jsx("div",{className:"grid grid-cols-2 gap-3",children:[["Nome",s.name],["Matricula",s.enrollment||"--"],["Serie",s.grade||"--"],["Turma",s.classRoom||"--"],["Nascimento",s.birthDate?new Date(s.birthDate).toLocaleDateString("pt-BR"):"--"],["Escola",((E=g(s.schoolId))==null?void 0:E.name)||"--"],["Contato 1",(s.emergencyContact1Name||"--")+" - "+(s.emergencyContact1Phone||"")],["Tipo Sanguineo",s.bloodType||"--"]].map(([i,a])=>e.jsxs("div",{className:"p-3 bg-gray-50 rounded-lg",children:[e.jsx("p",{className:"text-xs text-gray-400",children:i}),e.jsx("p",{className:"text-sm font-medium",children:a})]},i))})]}):e.jsxs("div",{className:"card text-center py-20",children:[e.jsx(Y,{size:48,className:"text-gray-200 mx-auto mb-3"}),e.jsx("p",{className:"text-gray-500",children:"Selecione um aluno ou imprima em branco"})]})})]}),e.jsx(V,{allowSign:!0,open:!!r,onClose:()=>m(null),onExport:(i,a)=>{r!=null&&r.html&&J(i,[],r.html,r.filename,a),m(null)},title:r?"Exportar Relatório":void 0})]})}export{le as default};
