import{b as Q,r as c,e as S,j as e,F as V,l as J,i as K,U as W,a as b,s as R}from"./index-DUgrOeaz.js";import{getMunicipalityReport as X,buildTableReportHTML as Z}from"./reportUtils-DkvHCBBk.js";import{P as I,R as ee,E as ae,h as se,a as te}from"./reportTemplate-B_Qa9Jbu.js";import{b as ie}from"./reportGenerators-Wb5A9mq2.js";import"./globe-DtIasi5y.js";import"./check-D965YHCN.js";import"./chevron-up-Jy0GhL-e.js";import"./chevron-down-D5VVG9tu.js";function ge(){var D,A,k;const{user:y}=Q(),n=(y==null?void 0:y.municipalityId)||0,[x,T]=c.useState(""),[m,B]=c.useState(""),[N,C]=c.useState(""),[d,g]=c.useState(null),[h,M]=c.useState(null),[t,L]=c.useState(null),[j,P]=c.useState([]);c.useEffect(()=>{n&&X(n,b).then(M).catch(()=>{})},[n]);const{data:U}=S(()=>b.students.list({municipalityId:n}),[n]),{data:F}=S(()=>b.schools.list({municipalityId:n}),[n]),{data:O}=S(()=>b.municipalities.getById({id:n}),[n]),$=U||[],q=[...new Set($.filter(a=>!m||String(a.schoolId)===m).map(a=>a.classRoom).filter(Boolean))].sort(),w=$.filter(a=>{var p;const s=!x||((p=a.name)==null?void 0:p.toLowerCase().includes(x.toLowerCase()))||(a.enrollment||"").includes(x),r=!m||String(a.schoolId)===m,l=!N||a.classRoom===N;return s&&r&&l}),_=F||[],o=O,f=a=>_.find(s=>s.id===a),E=a=>{var z;const s=a||{},r=f(s.schoolId),l=s.shift==="afternoon"?"Tarde":s.shift==="evening"?"Noite":s.shift?"Manhã":"________",p=v=>v?new Date(v).toLocaleDateString("pt-BR"):"____/____/________",i=(v,G,oe)=>`<div class="field" style=""><div class="field-label">${v}</div><div class="field-value">${G||"_".repeat(40)}</div></div>`,H=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha de Matrícula - NetEscol</title>
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
      <h1>${(r==null?void 0:r.name)||(o==null?void 0:o.name)||"UNIDADE ESCOLAR"}</h1>
      <h2>${(o==null?void 0:o.name)||""} - ${(o==null?void 0:o.city)||""}/${(o==null?void 0:o.state)||""}</h2>
    </div>

    <div style="text-align:center;font-size:14px;font-weight:bold;color:#1B3A5C;margin:10px 0;text-transform:uppercase;letter-spacing:2px">FICHA DE MATRICULA</div>
    <div style="text-align:center;font-size:10px;color:#666;margin-bottom:15px">Ano Letivo: ${new Date().getFullYear()}</div>

    <div class="title">1. DADOS DO ALUNO</div>
    <div style="display:flex;gap:12px;align-items:flex-start">
      <div style="width:70px;height:85px;border:1px solid #ccc;border-radius:6px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#f3f4f6">
        ${s.photoUrl?'<img src="'+s.photoUrl+'" style="width:100%;height:100%;object-fit:cover"/>':'<span style="font-size:28px;color:#999">'+(((z=s.name)==null?void 0:z[0])||"?")+"</span>"}
      </div>
      <div style="flex:1">
    <div class="grid grid-2">
      ${i("Nome completo",s.name)}
      ${i("Data de nascimento",p(s.birthDate))}
    </div>
    <div class="grid grid-4" style="margin-top:6px">
      ${i("Matricula",s.enrollment)}
      ${i("Serie/Ano",s.grade)}
      ${i("Turma",s.classRoom||s.className)}
      ${i("Turno",l)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${i("Naturalidade","")}
      ${i("Nacionalidade","Brasileira")}
    </div>
    <div style="margin-top:6px;font-size:10px">
      <b>Sexo:</b> <span class="checkbox"><span class="checkbox-box"></span> Masculino</span> <span class="checkbox"><span class="checkbox-box"></span> Feminino</span>
      &nbsp;&nbsp;<b>Cor/Raca:</b> <span class="checkbox"><span class="checkbox-box"></span> Branca</span> <span class="checkbox"><span class="checkbox-box"></span> Parda</span> <span class="checkbox"><span class="checkbox-box"></span> Preta</span> <span class="checkbox"><span class="checkbox-box"></span> Amarela</span> <span class="checkbox"><span class="checkbox-box"></span> Indigena</span>
    </div>
    </div></div>

    <div class="title">2. ENDERECO</div>
    <div class="grid grid-2">
      ${i("Endereco completo",s.address)}
      ${i("Bairro","")}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${i("Cidade",(o==null?void 0:o.city)||"")}
      ${i("Estado",(o==null?void 0:o.state)||"")}
      ${i("CEP","")}
    </div>

    <div class="title">3. FILIACAO</div>
    <div class="grid grid-2">
      ${i("Nome da mae","")}
      ${i("Nome do pai","")}
    </div>

    <div class="title">4. RESPONSAVEL</div>
    <div class="grid grid-3">
      ${i("Nome",s.emergencyContact1Name)}
      ${i("Telefone",s.emergencyContact1Phone)}
      ${i("Parentesco",s.emergencyContact1Relation)}
    </div>
    <div class="grid grid-3" style="margin-top:6px">
      ${i("Nome (2o responsavel)",s.emergencyContact2Name)}
      ${i("Telefone",s.emergencyContact2Phone)}
      ${i("Parentesco",s.emergencyContact2Relation)}
    </div>

    <div class="title">5. SAUDE</div>
    <div class="grid grid-3">
      ${i("Tipo sanguineo",s.bloodType)}
      ${i("Alergias",s.allergies)}
      ${i("Medicamentos",s.medications)}
    </div>
    <div class="grid grid-2" style="margin-top:6px">
      ${i("Necessidades especiais",s.hasSpecialNeeds?"Sim - "+(s.specialNeedsNotes||""):"Nao")}
      ${i("Observacoes de saude",s.healthNotes)}
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

    <div class="footer">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
    </body></html>`,u=window.open("","_blank");u&&(u.document.write(H),u.document.close(),setTimeout(()=>u.print(),500))},Y=()=>{if(t&&h){const a=te(t.schoolId,_),s=ie(t,a,h.municipality,h.secretaria,j);if(!s){R("Erro ao gerar ficha");return}g({html:s,filename:"ficha_matricula_"+(t.name||"").replace(/\s/g,"_")})}else{const a=w.map(l=>{var p;return{nome:l.name||"--",matrícula:l.enrollment||"--",serie:l.grade||"--",turma:l.classRoom||"--",turno:l.shift==="afternoon"?"Tarde":l.shift==="evening"?"Noite":l.shift==="full_time"?"Integral":"Manhã",escola:((p=f(l.schoolId))==null?void 0:p.name)||"--"}}),r=Z("LISTA DE ALUNOS MATRICULADOS",a,["Nome","Matricula","Serie","Turma","Turno","Escola"],h,{orientation:"landscape",signatories:j});if(!r){R("Nenhum dado para exportar");return}g({html:r,filename:"lista_alunos_matriculados"})}};return e.jsxs("div",{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-6",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center",children:e.jsx(V,{size:20,className:"text-indigo-600"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Ficha de Matrícula"}),e.jsx("p",{className:"text-gray-500",children:"Formulário oficial para impressão"})]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:()=>E(),className:"btn-secondary flex items-center gap-2",children:[e.jsx(I,{size:16})," Imprimir em Branco"]}),t&&e.jsxs("button",{onClick:()=>E(t),className:"btn-primary flex items-center gap-2",children:[e.jsx(I,{size:16})," Imprimir Preenchida"]}),e.jsxs("button",{onClick:Y,className:"btn-secondary flex items-center gap-2",children:[e.jsx(J,{size:16})," Exportar"]})]})]}),e.jsx(ee,{selected:j,onChange:P}),e.jsxs("div",{className:"grid grid-cols-3 gap-6",children:[e.jsxs("div",{children:[e.jsxs("select",{className:"input mb-2 text-sm",value:m,onChange:a=>{B(a.target.value),C("")},children:[e.jsx("option",{value:"",children:"Todas as escolas"}),_.map(a=>e.jsx("option",{value:a.id,children:a.name},a.id))]}),e.jsxs("select",{className:"input mb-2 text-sm",value:N,onChange:a=>C(a.target.value),children:[e.jsx("option",{value:"",children:"Todas as turmas"}),q.map(a=>e.jsx("option",{value:a,children:a},a))]}),e.jsxs("div",{className:"relative mb-3",children:[e.jsx(K,{size:15,className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"}),e.jsx("input",{className:"input pl-9",placeholder:"Buscar aluno...",value:x,onChange:a=>T(a.target.value)})]}),e.jsx("div",{className:"space-y-1 max-h-[65vh] overflow-y-auto",children:w.slice(0,50).map(a=>{var s;return e.jsxs("button",{onClick:()=>L(a),className:`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${(t==null?void 0:t.id)===a.id?"bg-indigo-50 border border-indigo-200":"hover:bg-gray-50 border border-transparent"}`,children:[e.jsx("div",{className:"w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 flex-shrink-0 overflow-hidden",children:a.photoUrl?e.jsx("img",{src:a.photoUrl,className:"w-full h-full object-cover"}):(s=a.name)==null?void 0:s[0]}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"text-sm font-medium truncate",children:a.name}),a.enrollment&&e.jsxs("p",{className:"text-xs text-gray-400",children:["Mat. ",a.enrollment]})]})]},a.id)})})]}),e.jsx("div",{className:"col-span-2",children:t?e.jsxs("div",{className:"card",children:[e.jsxs("div",{className:"flex items-center gap-4 mb-4 pb-4 border-b",children:[e.jsx("div",{className:"w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700 overflow-hidden",children:t.photoUrl?e.jsx("img",{src:t.photoUrl,className:"w-full h-full object-cover"}):(D=t.name)==null?void 0:D[0]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-bold text-gray-900",children:t.name}),e.jsxs("p",{className:"text-sm text-gray-500",children:[t.enrollment?"Mat. "+t.enrollment:""," · ",t.grade||""," · ",((A=f(t.schoolId))==null?void 0:A.name)||""]})]})]}),e.jsxs("p",{className:"text-sm text-gray-600 mb-4",children:["Clique em ",e.jsx("b",{children:'"Imprimir Preenchida"'})," para imprimir a ficha com os dados deste aluno, ou ",e.jsx("b",{children:'"Imprimir em Branco"'})," para um formulario vazio. Use ",e.jsx("b",{children:'"Exportar"'})," para outros formatos."]}),e.jsx("div",{className:"grid grid-cols-2 gap-3",children:[["Nome",t.name],["Matricula",t.enrollment||"--"],["Serie",t.grade||"--"],["Turma",t.classRoom||"--"],["Nascimento",t.birthDate?new Date(t.birthDate).toLocaleDateString("pt-BR"):"--"],["Escola",((k=f(t.schoolId))==null?void 0:k.name)||"--"],["Contato 1",(t.emergencyContact1Name||"--")+" - "+(t.emergencyContact1Phone||"")],["Tipo Sanguineo",t.bloodType||"--"]].map(([a,s])=>e.jsxs("div",{className:"p-3 bg-gray-50 rounded-lg",children:[e.jsx("p",{className:"text-xs text-gray-400",children:a}),e.jsx("p",{className:"text-sm font-medium",children:s})]},a))})]}):e.jsxs("div",{className:"card text-center py-20",children:[e.jsx(W,{size:48,className:"text-gray-200 mx-auto mb-3"}),e.jsx("p",{className:"text-gray-500",children:"Selecione um aluno ou imprima em branco"})]})})]}),e.jsx(ae,{allowSign:!0,open:!!d,onClose:()=>g(null),onExport:(a,s)=>{d!=null&&d.html&&se(a,[],d.html,d.filename,s),g(null)},title:d?"Exportar Relatório":void 0})]})}export{ge as default};
