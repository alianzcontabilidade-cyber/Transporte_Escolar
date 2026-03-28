import{r as f,j as n,g as w,b as $,a as u}from"./index-BiFFGhA3.js";import{C as k}from"./chevron-up-CQY8CEuM.js";import{C as N}from"./chevron-down-Lat8bQSk.js";let x=null,h=null;function S(){const{user:o}=$(),e=(o==null?void 0:o.municipalityId)||0,[t,r]=f.useState([]),[a,l]=f.useState(!0);return f.useEffect(()=>{if(!e){l(!1);return}if(h===e&&x){r(x),l(!1);return}l(!0);const c=[];u.municipalities.getById({id:e}).then(async s=>{s&&(s.prefeitoName&&c.push({id:"prefeito",name:s.prefeitoName,role:s.prefeitoCargo||"Prefeito(a) Municipal",cpf:s.prefeitoCpf||"",source:"prefeito"}),s.secretarioName&&c.push({id:"secretario",name:s.secretarioName,role:s.secretarioCargo||"Secretário(a) de Educação",cpf:s.secretarioCpf||"",decree:s.secretarioDecreto||"",source:"secretario"}));try{const i=await u.municipalities.listResponsibles({municipalityId:e});Array.isArray(i)&&i.forEach(d=>{c.push({id:"resp_"+d.id,name:d.name,role:d.role,cpf:d.cpf||"",decree:d.decree||"",source:"responsavel"})})}catch{}try{const i=await u.schools.list({municipalityId:e});Array.isArray(i)&&i.forEach(d=>{d.directorName&&c.push({id:"dir_"+d.id,name:d.directorName,role:"Diretor(a) - "+d.name,source:"diretor"})})}catch{}x=c,h=e,r(c),l(!1)}).catch(()=>{x=c,h=e,r(c),l(!1)})},[e]),{signatories:t,loading:a}}const C={prefeito:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",secretario:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",responsavel:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",diretor:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"},A={prefeito:"Prefeitura",secretario:"Sec. Educacao",responsavel:"Responsável",diretor:"Escola"};function O({selected:o,onChange:e,maxSignatories:t=5}){const{signatories:r,loading:a}=S(),[l,c]=f.useState(!1),s=i=>{o.find(m=>m.id===i.id)?e(o.filter(m=>m.id!==i.id)):o.length<t&&e([...o,i])};return a?null:r.length===0?n.jsxs("div",{className:"p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400",children:["Nenhum responsavel cadastrado. Cadastre no menu ",n.jsx("b",{children:"Cadastro da Prefeitura"})," para habilitar assinaturas nos relatorios."]}):n.jsxs("div",{className:"border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden",children:[n.jsxs("button",{type:"button",onClick:()=>c(!l),className:"w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",children:[n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(w,{size:16,className:"text-accent-500"}),n.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinaturas do Relatório"}),o.length>0&&n.jsxs("span",{className:"text-xs bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-full",children:[o.length," selecionado(s)"]})]}),l?n.jsx(k,{size:16,className:"text-gray-400"}):n.jsx(N,{size:16,className:"text-gray-400"})]}),o.length>0&&!l&&n.jsx("div",{className:"px-4 py-2 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-1.5",children:o.map(i=>n.jsxs("span",{className:"text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-2 py-1 rounded-full",children:[i.name," ",n.jsxs("span",{className:"text-accent-400",children:["(",i.role,")"]})]},i.id))}),l&&n.jsx("div",{className:"p-3 border-t border-gray-100 dark:border-gray-600 space-y-1 max-h-64 overflow-y-auto",children:r.map(i=>{const d=o.some(m=>m.id===i.id);return n.jsxs("label",{className:`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${d?"bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700":"hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"}`,children:[n.jsx("input",{type:"checkbox",checked:d,onChange:()=>s(i),className:"rounded text-accent-500 focus:ring-accent-400"}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200 truncate",children:i.name}),n.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 truncate",children:i.role})]}),n.jsx("span",{className:`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${C[i.source]||""}`,children:A[i.source]||i.source})]},i.id)})})]})}function j(o){if(o.length===0)return"";const e=Math.min(o.length,3),t=o.length<=3?"display:flex;justify-content:space-around;flex-wrap:wrap;gap:30px":`display:grid;grid-template-columns:repeat(${e},1fr);gap:30px`,r=o.map(a=>`
    <div style="text-align:center;min-width:200px;margin-top:60px">
      <div style="border-top:2px solid #333;padding-top:10px;margin:0 5px">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#1B3A5C">${a.name}</p>
        <p style="font-size:10px;color:#555;margin:3px 0 0">${a.role}</p>
        ${a.cpf?'<p style="font-size:9px;color:#888;margin:2px 0 0">CPF: '+a.cpf+"</p>":""}
        ${a.decree?'<p style="font-size:9px;color:#888;margin:1px 0 0">'+a.decree+"</p>":""}
      </div>
    </div>
  `).join("");return`<div style="${t};margin-top:40px;page-break-inside:avoid">${r}</div>`}const E=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function z(){const o=new Date;return`${o.getDate()} de ${E[o.getMonth()]} de ${o.getFullYear()}`}async function R(o,e){const t={name:"",city:"",state:""},r={};try{const a=await e.municipalities.getById({id:o});a&&(t.name=a.name||"",t.city=a.city||"",t.state=a.state||"",t.phone=a.phone||"",t.email=a.email||"",t.logoUrl=a.logoUrl||"",t.cnpj=a.cnpj||"",a.logradouro?t.address=[a.logradouro,a.numero,a.bairro,a.city,a.state].filter(Boolean).join(", "):t.address=a.address||"",r.name=a.secretariaName||"",r.cnpj=a.secretariaCnpj||"",r.secretarioName=a.secretarioName||"",r.secretarioCargo=a.secretarioCargo||"Secretário(a) de Educação",r.phone=a.secretariaPhone||"",r.email=a.secretariaEmail||"",r.address=a.secretariaLogradouro||"")}catch{}return{municipality:t,secretaria:r}}function P(o,e){const t=e.find(a=>a.id===o);if(!t)return;let r="";try{r=JSON.parse(localStorage.getItem("netescol_school_extra_"+o)||"{}").logoUrl||""}catch{}return{name:t.name||"",code:t.code||"",address:t.address||"",phone:t.phone||"",directorName:t.directorName||"",logoUrl:r}}function T(o){var y;const e=o.municipality,t=o.secretaria,r=o.school,a=o.fontFamily==="serif"?"'Times New Roman', 'Georgia', serif":"'Segoe UI', Arial, sans-serif",l=o.fontSize||12,c=o.orientation||"portrait",s=o.showDate!==!1,i=o.dateText||`${e.city||""}${e.state?"/"+e.state:""}, ${z()}.`,d=(y=o.signatories)!=null&&y.length?j(o.signatories):"",m={AC:"Acre",AL:"Alagoas",AP:"Amapa",AM:"Amazonas",BA:"Bahia",CE:"Ceara",DF:"Distrito Federal",ES:"Espirito Santo",GO:"Goias",MA:"Maranhao",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Para",PB:"Paraiba",PR:"Parana",PE:"Pernambuco",PI:"Piaui",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondonia",RR:"Roraima",SC:"Santa Catarina",SP:"Sao Paulo",SE:"Sergipe",TO:"Tocantins"},b=e.state?m[e.state.toUpperCase()]||e.state:"",v=`
    <div class="report-institutional-header">
      <table class="header-table">
        <tr>
          ${e.logoUrl?`<td class="logo-cell"><img src="${e.logoUrl}" class="inst-logo" alt="Brasao"/></td>`:""}
          <td class="info-cell">
            ${b?`<div class="estado-name">ESTADO ${b.toUpperCase().startsWith("D")?"DO ":"DE "}${b.toUpperCase()}</div>`:""}
            <div class="mun-name">${(e.name||"PREFEITURA MUNICIPAL").toUpperCase()}</div>
            ${e.cnpj?`<div class="mun-detail">CNPJ: ${e.cnpj}</div>`:""}
            ${t!=null&&t.name?`<div class="sec-name">${t.name.toUpperCase()}</div>`:""}
            ${t!=null&&t.cnpj?`<div class="mun-detail">CNPJ: ${t.cnpj}</div>`:""}
            ${t!=null&&t.secretarioName?`<div class="mun-detail">${t.secretarioCargo||"Secretario(a)"}: ${t.secretarioName}</div>`:""}
          </td>
          ${r?`
            <td class="school-cell">
              ${r.logoUrl?`<img src="${r.logoUrl}" class="school-logo" alt=""/>`:""}
              <div class="school-name">${r.name}</div>
              ${r.code?`<div class="school-detail">INEP: ${r.code}</div>`:""}
              ${r.address?`<div class="school-detail">${r.address}</div>`:""}
              ${r.phone?`<div class="school-detail">Fone: ${r.phone}</div>`:""}
            </td>
          `:""}
        </tr>
      </table>
      <div class="header-line"></div>
    </div>
  `,g=[];if(e.name&&e.address?g.push(`${e.name} - ${e.address}`):e.name&&g.push(e.name),t!=null&&t.name){let p=t.name;t.address&&(p+=" - "+t.address),t.phone&&(p+=" | Fone: "+t.phone),g.push(p)}if(e.phone||e.email){const p=[];e.phone&&p.push("Fone: "+e.phone),e.email&&p.push(e.email),g.push(p.join(" | "))}return`<!DOCTYPE html><html lang="pt-br"><head><meta charset="utf-8"><title>${o.title} - NetEscol</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${c==="landscape"?"A4 landscape":"A4"};margin:15mm 20mm}
  body{font-family:${a};font-size:${l}px;color:#1a1a1a;line-height:1.6;margin:0;padding:30px 40px;max-width:900px;margin:0 auto;background:#fff}
  @media print{body{padding:0;max-width:none;background:none}.no-print{display:none!important}}

  /* HEADER */
  .report-institutional-header{margin-bottom:20px}
  .header-table{width:100%;border-collapse:collapse}
  .header-table td{vertical-align:middle;padding:5px}
  .logo-cell{width:80px;text-align:center}
  .inst-logo{max-width:70px;max-height:70px;object-fit:contain}
  .info-cell{text-align:center}
  .estado-name{font-size:12px;font-weight:bold;color:#333;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px}
  .mun-name{font-size:16px;font-weight:bold;color:#1B3A5C;text-transform:uppercase;letter-spacing:1px}
  .mun-detail{font-size:10px;color:#666;margin-top:1px}
  .sec-name{font-size:13px;font-weight:600;color:#2DB5B0;margin-top:4px;text-transform:uppercase}
  .school-cell{text-align:center;width:200px}
  .school-logo{max-width:50px;max-height:50px;object-fit:contain;margin-bottom:3px}
  .school-name{font-size:12px;font-weight:bold;color:#333}
  .school-detail{font-size:9px;color:#888}
  .header-line{height:3px;background:linear-gradient(90deg,#1B3A5C,#2DB5B0);margin-top:10px;border-radius:2px}

  /* TITLE */
  .report-title{text-align:center;margin:25px 0 20px;padding:8px 0}
  .report-title h1{font-size:18px;font-weight:bold;color:#1B3A5C;text-transform:uppercase;letter-spacing:2px;border-bottom:2px solid #1B3A5C;display:inline-block;padding-bottom:4px}
  .report-title .subtitle{font-size:12px;color:#666;margin-top:5px}

  /* CONTENT */
  .report-body p{text-align:justify;text-indent:40px;margin-bottom:12px;line-height:1.8}
  .report-body table{width:100%;border-collapse:collapse;margin:15px 0;font-size:11px;page-break-inside:auto}
  .report-body thead{display:table-header-group}
  .report-body tr{page-break-inside:avoid}
  .report-body th{background:#1B3A5C;color:white;padding:6px 8px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;border:1px solid #15304d}
  .report-body td{padding:5px 8px;border:1px solid #d1d5db;text-align:center}
  .report-body tr:nth-child(even){background:#f8fafb}
  .report-body .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;margin:10px 0}
  .report-body .field-row{display:flex;gap:5px;padding:4px 0;border-bottom:1px dotted #ccc}
  .report-body .field-label{font-size:10px;color:#888;min-width:120px;font-weight:600;text-transform:uppercase}
  .report-body .field-value{font-size:12px;color:#333;flex:1}
  .report-body .section-title{font-size:13px;font-weight:bold;color:#1B3A5C;text-transform:uppercase;margin:20px 0 8px;padding:5px 10px;background:#f0f4f8;border-left:4px solid #2DB5B0;letter-spacing:0.5px}
  .report-body .highlight{background:#fffbeb;padding:8px 12px;border-radius:6px;border:1px solid #fde68a;font-weight:600;text-align:center;margin:15px 0}
  .report-body .student-info{background:#f8fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:20px}
  .report-body .student-info .si-name{font-size:14px;font-weight:bold;color:#1B3A5C}
  .report-body .student-info .si-detail{font-size:11px;color:#666;margin-top:2px}

  /* DATE */
  .report-date{text-align:right;margin:30px 0 10px;font-size:12px;color:#333}

  /* SIGNATURES + FOOTER */
  .report-bottom-block{margin-top:15px}
  .report-signatures{margin-top:10px}

  /* FOOTER */
  .report-footer-bar{text-align:center;font-size:8px;color:#999;border-top:1px solid #d1d5db;padding:5px 0 0;margin-top:10px}
  .report-footer-bar .footer-line{margin:2px 0}
  .report-footer-bar .footer-brand{color:#2DB5B0;font-weight:bold;font-size:9px;margin-top:3px}

  /* TABLE STYLES */
  .grade-table th{font-size:9px;padding:5px 4px}
  .grade-table td{padding:4px;font-size:11px}
  .grade-table .approved{color:#059669;font-weight:bold}
  .grade-table .failed{color:#dc2626;font-weight:bold}
  .grade-table .total-row{background:#f0f4f8!important;font-weight:bold}

  /* DECLARATION */
  .declaration-text{font-size:14px;line-height:2;text-align:justify;text-indent:50px;margin:20px 0}
  .declaration-text b{color:#1B3A5C}
</style></head><body>
${v}
<div class="report-title">
  <h1>${o.title}</h1>
  ${o.subtitle?`<div class="subtitle">${o.subtitle}</div>`:""}
</div>
<div class="report-body">
  ${o.content}
</div>
${s?`<div class="report-date">${i}</div>`:""}
<div class="report-bottom-block">
<div class="report-signatures">
${d}
</div>
<div class="report-footer-bar">
  ${g.map(p=>`<div class="footer-line">${p}</div>`).join("")}
  <div class="footer-line footer-brand">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</div>
</div>
</body></html>`}function B(o){const e=window.open("","_blank");e&&(e.document.write(o),e.document.close(),setTimeout(()=>e.print(),700))}async function D(o,e){const t=(e||"relatorio").replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,"_").replace(/_+/g,"_"),r=`<style id="ne-toolbar-css">
#ne-toolbar{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#1B3A5C,#264a6e);padding:8px 16px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.4);font-family:Arial,sans-serif}
#ne-toolbar .t{color:white;font-size:14px;font-weight:bold;margin-right:auto}
#ne-toolbar button{border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px;color:white}
#ne-toolbar button:hover{opacity:0.85}
.bp{background:#e53e3e}.bi{background:#3182ce}.bw{background:#2B579A}
body{padding-top:50px!important}
@media print{#ne-toolbar{display:none!important}body{padding-top:0!important}}
</style>`,a=`<div id="ne-toolbar">
<span class="t">NetEscol - ${t.replace(/_/g," ")}</span>
<button class="bp" onclick="nPdf()">Salvar PDF</button>
<button class="bi" onclick="nPri()">Imprimir</button>
<button class="bw" onclick="nDoc()">Word</button>
</div>`,l=`<script>
function nPri(){document.getElementById('ne-toolbar').style.display='none';setTimeout(function(){window.print();setTimeout(function(){document.getElementById('ne-toolbar').style.display='flex'},500)},100)}
function nPdf(){nPri()}
function nDoc(){var b=document.body.cloneNode(true);var tb=b.querySelector('#ne-toolbar');if(tb)tb.remove();var st=b.querySelector('#ne-toolbar-css');if(st)st.remove();var c=b.innerHTML;var h='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:2cm}body{font-family:Calibri,Arial,sans-serif}</style></head><body>'+c+'</body></html>';var bl=new Blob(['\\uFEFF'+h],{type:'application/msword'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='${t}.doc';document.body.appendChild(a);a.click();document.body.removeChild(a)}
<\/script>`,c=o.replace("</head>",r+"</head>").replace(/<body[^>]*>/i,"$&"+a).replace("</body>",l+"</body>"),s=window.open("","_blank");s&&(s.document.write(c),s.document.close())}const I=Object.freeze(Object.defineProperty({__proto__:null,generateReportHTML:T,loadMunicipalityData:R,loadSchoolData:P,openReportAsPDF:D,printReportHTML:B},Symbol.toStringTag,{value:"Module"}));export{O as R,P as a,T as g,R as l,B as p,I as r};
