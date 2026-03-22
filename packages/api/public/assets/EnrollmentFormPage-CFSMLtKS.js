import{b as P,r as d,e as v,j as e,F as O,D as F,h as U,U as q,a as u}from"./index-BLCyvb7R.js";import{getMunicipalityReport as Y,buildTableReportHTML as H}from"./reportUtils-DxqUqdpo.js";import{P as E,R as G,E as Q,h as V}from"./reportTemplate-CKhtLdt1.js";import"./globe-BihWDgto.js";import"./check-BBEBa-nL.js";import"./chevron-up-CUAJcylQ.js";import"./chevron-down-BjI5_dDW.js";function te(){var j,S,$;const{user:f}=P(),n=(f==null?void 0:f.municipalityId)||0,[p,C]=d.useState(""),[l,b]=d.useState(null),[D,z]=d.useState(null),[i,k]=d.useState(null),[N,A]=d.useState([]);d.useEffect(()=>{n&&Y(n,u).then(z).catch(()=>{})},[n]);const{data:w}=v(()=>u.students.list({municipalityId:n}),[n]),{data:R}=v(()=>u.schools.list({municipalityId:n}),[n]),{data:T}=v(()=>u.municipalities.getById({id:n}),[n]),y=(w||[]).filter(t=>{var a;return!p||((a=t.name)==null?void 0:a.toLowerCase().includes(p.toLowerCase()))||(t.enrollment||"").includes(p)}),I=R||[],o=T,m=t=>I.find(a=>a.id===t),_=t=>{const a=t||{},c=m(a.schoolId),r=a.shift==="afternoon"?"Tarde":a.shift==="evening"?"Noite":a.shift?"Manhã":"________",x=h=>h?new Date(h).toLocaleDateString("pt-BR"):"____/____/________",s=(h,M,J)=>`<div class="field" style=""><div class="field-label">${h}</div><div class="field-value">${M||"_".repeat(40)}</div></div>`,L=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha de Matrícula - NetEscol</title>
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

    <div style="text-align:center;font-size:14px;font-weight:bold;color:#1B3A5C;margin:10px 0;text-transform:uppercase;letter-spacing:2px">FICHA DE MATRÍCULA</div>
    <div style="text-align:center;font-size:10px;color:#666;margin-bottom:15px">Ano Letivo: ${new Date().getFullYear()}</div>

    <div class="title">1. DADOS DO ALUNO</div>
    <div class="grid grid-2">
      ${s("Nome completo",a.name)}
      ${s("Data de nascimento",x(a.birthDate))}
    </div>
    <div class="grid grid-4" style="margin-top:6px">
      ${s("Matrícula",a.enrollment)}
      ${s("Série/Ano",a.grade)}
      ${s("Turma",a.classRoom||a.className)}
      ${s("Turno",r)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${s("Naturalidade","")}
      ${s("Nacionalidade","Brasileira")}
    </div>
    <div style="margin-top:6px;font-size:10px">
      <b>Sexo:</b> <span class="checkbox"><span class="checkbox-box"></span> Masculino</span> <span class="checkbox"><span class="checkbox-box"></span> Feminino</span>
      &nbsp;&nbsp;<b>Cor/Raça:</b> <span class="checkbox"><span class="checkbox-box"></span> Branca</span> <span class="checkbox"><span class="checkbox-box"></span> Parda</span> <span class="checkbox"><span class="checkbox-box"></span> Preta</span> <span class="checkbox"><span class="checkbox-box"></span> Amarela</span> <span class="checkbox"><span class="checkbox-box"></span> Indígena</span>
    </div>

    <div class="title">2. ENDEREÇO</div>
    <div class="grid grid-2">
      ${s("Endereço completo",a.address)}
      ${s("Bairro","")}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${s("Cidade",(o==null?void 0:o.city)||"")}
      ${s("Estado",(o==null?void 0:o.state)||"")}
      ${s("CEP","")}
    </div>

    <div class="title">3. FILIAÇÃO</div>
    <div class="grid grid-2">
      ${s("Nome da mãe","")}
      ${s("Nome do pai","")}
    </div>

    <div class="title">4. RESPONSÁVEL</div>
    <div class="grid grid-3">
      ${s("Nome",a.emergencyContact1Name)}
      ${s("Telefone",a.emergencyContact1Phone)}
      ${s("Parentesco",a.emergencyContact1Relation)}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${s("Nome (2º responsável)",a.emergencyContact2Name)}
      ${s("Telefone",a.emergencyContact2Phone)}
      ${s("Parentesco",a.emergencyContact2Relation)}
    </div>

    <div class="title">5. SAÚDE</div>
    <div class="grid grid-3">
      ${s("Tipo sanguíneo",a.bloodType)}
      ${s("Alergias",a.allergies)}
      ${s("Medicamentos",a.medications)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${s("Necessidades especiais",a.hasSpecialNeeds?"Sim - "+(a.specialNeedsNotes||""):"Não")}
      ${s("Observações de saúde",a.healthNotes)}
    </div>

    <div class="title">6. TRANSPORTE ESCOLAR</div>
    <div style="font-size:10px;margin:6px 0">
      <b>Utiliza transporte escolar?</b> <span class="checkbox"><span class="checkbox-box"></span> Sim</span> <span class="checkbox"><span class="checkbox-box"></span> Não</span>
    </div>

    <div class="title">7. DECLARAÇÃO</div>
    <div style="font-size:10px;text-align:justify;margin:6px 0;line-height:1.5">
      Declaro que as informações prestadas são verdadeiras e me responsabilizo por qualquer informação incorreta. Comprometo-me a comunicar à escola qualquer alteração nos dados acima. Autorizo a escola a utilizar a imagem do(a) aluno(a) em atividades pedagógicas e eventos escolares.
    </div>

    <div style="text-align:right;font-size:11px;margin:20px 0">${(o==null?void 0:o.city)||"_________"}, ______ de _________________ de ${new Date().getFullYear()}</div>

    <div class="signatures">
      <div class="sig">Responsável Legal</div>
      <div class="sig">Secretário(a) Escolar</div>
      <div class="sig">Diretor(a)</div>
    </div>

    <div class="footer">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`,g=window.open("","_blank");g&&(g.document.write(L),g.document.close(),setTimeout(()=>g.print(),500))},B=()=>{const t=y.map(r=>{var x;return{nome:r.name||"--",matricula:r.enrollment||"--",serie:r.grade||"--",turma:r.classRoom||"--",turno:r.shift==="afternoon"?"Tarde":r.shift==="evening"?"Noite":"Manha",escola:((x=m(r.schoolId))==null?void 0:x.name)||"--"}}),c=H("LISTA DE ALUNOS MATRICULADOS",t,["Nome","Matricula","Serie","Turma","Turno","Escola"],D,{orientation:"landscape",signatories:N});if(!c){alert("Nenhum dado para exportar");return}b({html:c,filename:"ficha_matricula"})};return e.jsxs("div",{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center",children:e.jsx(O,{size:20,className:"text-indigo-600"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Ficha de Matr\\u00edcula"}),e.jsx("p",{className:"text-gray-500",children:"Formul\\u00e1rio oficial para impress\\u00e3o"})]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:()=>_(),className:"btn-secondary flex items-center gap-2",children:[e.jsx(E,{size:16})," Imprimir em Branco"]}),i&&e.jsxs("button",{onClick:()=>_(i),className:"btn-primary flex items-center gap-2",children:[e.jsx(E,{size:16})," Imprimir Preenchida"]}),e.jsxs("button",{onClick:B,className:"btn-secondary flex items-center gap-2",children:[e.jsx(F,{size:16})," Exportar"]})]})]}),e.jsx(G,{selected:N,onChange:A}),e.jsxs("div",{className:"grid grid-cols-3 gap-6",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"relative mb-3",children:[e.jsx(U,{size:15,className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"}),e.jsx("input",{className:"input pl-9",placeholder:"Buscar aluno...",value:p,onChange:t=>C(t.target.value)})]}),e.jsx("div",{className:"space-y-1 max-h-[65vh] overflow-y-auto",children:y.slice(0,50).map(t=>{var a;return e.jsxs("button",{onClick:()=>k(t),className:`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${(i==null?void 0:i.id)===t.id?"bg-indigo-50 border border-indigo-200":"hover:bg-gray-50 border border-transparent"}`,children:[e.jsx("div",{className:"w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0",children:(a=t.name)==null?void 0:a[0]}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"text-sm font-medium truncate",children:t.name}),t.enrollment&&e.jsxs("p",{className:"text-xs text-gray-400",children:["Mat. ",t.enrollment]})]})]},t.id)})})]}),e.jsx("div",{className:"col-span-2",children:i?e.jsxs("div",{className:"card",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4 pb-4 border-b",children:[e.jsx("div",{className:"w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700",children:(j=i.name)==null?void 0:j[0]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-bold text-gray-900",children:i.name}),e.jsxs("p",{className:"text-sm text-gray-500",children:[i.enrollment?"Mat. "+i.enrollment:""," · ",i.grade||""," · ",((S=m(i.schoolId))==null?void 0:S.name)||""]})]})]}),e.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:["Clique em ",e.jsx("b",{children:'"Imprimir Preenchida"'})," para imprimir a ficha com os dados deste aluno, ou ",e.jsx("b",{children:'"Imprimir em Branco"'})," para um formul\\u00e1rio vazio. Use ",e.jsx("b",{children:'"Exportar"'})," para outros formatos."]}),e.jsx("div",{className:"grid grid-cols-2 gap-3",children:[["Nome",i.name],["Matrícula",i.enrollment||"--"],["Série",i.grade||"--"],["Turma",i.classRoom||"--"],["Nascimento",i.birthDate?new Date(i.birthDate).toLocaleDateString("pt-BR"):"--"],["Escola",(($=m(i.schoolId))==null?void 0:$.name)||"--"],["Contato 1",(i.emergencyContact1Name||"--")+" - "+(i.emergencyContact1Phone||"")],["Tipo Sanguíneo",i.bloodType||"--"]].map(([t,a])=>e.jsxs("div",{className:"p-3 bg-gray-50 rounded-lg",children:[e.jsx("p",{className:"text-xs text-gray-400",children:t}),e.jsx("p",{className:"text-sm font-medium",children:a})]},t))})]}):e.jsxs("div",{className:"card text-center py-20",children:[e.jsx(q,{size:48,className:"text-gray-200 mx-auto mb-3"}),e.jsx("p",{className:"text-gray-500",children:"Selecione um aluno ou imprima em branco"})]})})]}),e.jsx(Q,{open:!!l,onClose:()=>b(null),onExport:t=>{l!=null&&l.html&&V(t,[],l.html,l.filename),b(null)},title:l?"Exportar Relatorio":void 0})]})}export{te as default};
