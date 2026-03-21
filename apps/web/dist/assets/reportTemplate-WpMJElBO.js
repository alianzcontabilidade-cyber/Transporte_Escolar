import{c as f,r as b,P as z,F as T,af as A,D as E,j as n,X as S,f as B,b as D,a as h}from"./index-BsbF1GYG.js";import{G as L}from"./globe-TX123Zug.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=f("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=f("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=f("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=f("FileDown",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]),j=[{value:"print",label:"Impressao Direta",icon:z,desc:"Envia direto para a impressora",group:"visualizar"},{value:"pdf",label:"Abrir em PDF",icon:T,desc:"Abre o documento para visualizacao",group:"visualizar"},{value:"html",label:"Abrir em HTML",icon:L,desc:"Abre em nova aba no navegador",group:"visualizar"},{value:"pdf-download",label:"Download PDF (.pdf)",icon:k,desc:"Salvar arquivo PDF no computador",group:"download"},{value:"docx",label:"Download Word (.docx)",icon:k,desc:"Salvar como documento Word",group:"download"},{value:"csv",label:"Download CSV (.csv)",icon:A,desc:"Planilha compativel com Excel",group:"download"},{value:"html-download",label:"Download HTML (.html)",icon:E,desc:"Salvar pagina HTML",group:"download"}];function Y({open:t,onClose:e,onExport:a,title:r}){const[o,l]=b.useState("pdf");if(!t)return null;const c=j.filter(i=>i.group==="visualizar"),s=j.filter(i=>i.group==="download");return n.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:n.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md",children:[n.jsxs("div",{className:"flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700",children:[n.jsxs("h3",{className:"text-lg font-semibold flex items-center gap-2",children:[n.jsx(E,{size:18,className:"text-accent-500"}),r||"Exportar Relatorio"]}),n.jsx("button",{onClick:e,className:"p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400",children:n.jsx(S,{size:20})})]}),n.jsxs("div",{className:"p-5 max-h-[60vh] overflow-y-auto",children:[n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Visualizar"}),n.jsx("div",{className:"space-y-1.5 mb-4",children:c.map(i=>{const d=i.icon,p=o===i.value;return n.jsxs("button",{onClick:()=>l(i.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${p?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(d,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${p?"text-accent-700":"text-gray-800"}`,children:i.label}),n.jsx("p",{className:"text-xs text-gray-400",children:i.desc})]}),p&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(y,{size:12,className:"text-white"})})]},i.value)})}),n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Baixar Arquivo"}),n.jsx("div",{className:"space-y-1.5",children:s.map(i=>{const d=i.icon,p=o===i.value;return n.jsxs("button",{onClick:()=>l(i.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${p?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(d,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${p?"text-accent-700":"text-gray-800"}`,children:i.label}),n.jsx("p",{className:"text-xs text-gray-400",children:i.desc})]}),p&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(y,{size:12,className:"text-white"})})]},i.value)})})]}),n.jsxs("div",{className:"flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700",children:[n.jsx("button",{onClick:e,className:"btn-secondary flex-1",children:"Cancelar"}),n.jsxs("button",{onClick:()=>{a(o),e()},className:"btn-primary flex-1 flex items-center justify-center gap-2",children:[n.jsx(y,{size:16})," Confirmar"]})]})]})})}function R(t,e){if(!(t!=null&&t.length)){alert("Sem dados para exportar");return}const a=Object.keys(t[0]),r=[a.join(";"),...t.map(c=>a.map(s=>'"'+(c[s]??"")+'"').join(";"))].join(`
`),o=new Blob(["\uFEFF"+r],{type:"text/csv;charset=utf-8;"}),l=document.createElement("a");l.href=URL.createObjectURL(o),l.download=e.endsWith(".csv")?e:e+".csv",l.click()}function N(t,e,a=!1){if(a){const r=new Blob([t],{type:"text/html;charset=utf-8;"}),o=document.createElement("a");o.href=URL.createObjectURL(r),o.download=e.endsWith(".html")?e:e+".html",o.click()}else{const r=window.open("","_blank");r&&(r.document.write(t),r.document.close())}}function F(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),e.onload=()=>e.print())}function C(t,e,a=!1){const r=t.replace("</head>","<style>@media print{@page{margin:10mm;size:A4}body{margin:0;padding:15px}.no-print{display:none!important}}</style></head>");if(a){const o=window.open("","_blank");o&&(o.document.write(r),o.document.close(),setTimeout(()=>o.print(),500))}else{const o=new Blob([r],{type:"text/html;charset=utf-8"});window.open(URL.createObjectURL(o),"_blank")}}function O(t,e){const a='<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:15mm 20mm}body{font-family:Arial,sans-serif;font-size:12pt}table{border-collapse:collapse;width:100%}th{background-color:#1B3A5C;color:white;padding:8px;text-align:left;font-size:10pt}td{border:1px solid #ddd;padding:6px;font-size:10pt}tr:nth-child(even){background-color:#f8f9fa}h1{color:#1B3A5C;font-size:16pt;border-bottom:2px solid #2DB5B0;padding-bottom:5px}</style></head><body>'+t.replace(/<!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head>[\s\S]*?<\/head>/i,"").replace(/<\/?body[^>]*>/gi,"")+"</body></html>",r=new Blob(["\uFEFF"+a],{type:"application/msword"}),o=document.createElement("a");o.href=URL.createObjectURL(r),o.download=e.endsWith(".doc")?e:e+".doc",o.click()}async function Z(t,e,a,r){switch(t){case"print":F(a);break;case"pdf":C(a,r,!1);break;case"pdf-download":C(a,r,!0);break;case"docx":O(a,r);break;case"csv":R(e,r);break;case"html":N(a,r,!1);break;case"html-download":N(a,r,!0);break}}let g=null,w=null;function U(){const{user:t}=D(),e=(t==null?void 0:t.municipalityId)||0,[a,r]=b.useState([]),[o,l]=b.useState(!0);return b.useEffect(()=>{if(!e){l(!1);return}if(w===e&&g){r(g),l(!1);return}l(!0);const c=[];h.municipalities.getById({id:e}).then(async s=>{s&&(s.prefeitoName&&c.push({id:"prefeito",name:s.prefeitoName,role:s.prefeitoCargo||"Prefeito(a) Municipal",cpf:s.prefeitoCpf||"",source:"prefeito"}),s.secretarioName&&c.push({id:"secretario",name:s.secretarioName,role:s.secretarioCargo||"Secretário(a) de Educação",cpf:s.secretarioCpf||"",decree:s.secretarioDecreto||"",source:"secretario"}));try{const i=await h.municipalities.listResponsibles({municipalityId:e});Array.isArray(i)&&i.forEach(d=>{c.push({id:"resp_"+d.id,name:d.name,role:d.role,cpf:d.cpf||"",decree:d.decree||"",source:"responsavel"})})}catch{}try{const i=await h.schools.list({municipalityId:e});Array.isArray(i)&&i.forEach(d=>{d.directorName&&c.push({id:"dir_"+d.id,name:d.directorName,role:"Diretor(a) - "+d.name,source:"diretor"})})}catch{}g=c,w=e,r(c),l(!1)}).catch(()=>{g=c,w=e,r(c),l(!1)})},[e]),{signatories:a,loading:o}}const H={prefeito:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",secretario:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",responsavel:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",diretor:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"},I={prefeito:"Prefeitura",secretario:"Sec. Educacao",responsavel:"Responsavel",diretor:"Escola"};function J({selected:t,onChange:e,maxSignatories:a=5}){const{signatories:r,loading:o}=U(),[l,c]=b.useState(!1),s=i=>{t.find(p=>p.id===i.id)?e(t.filter(p=>p.id!==i.id)):t.length<a&&e([...t,i])};return o?null:r.length===0?n.jsxs("div",{className:"p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400",children:["Nenhum responsavel cadastrado. Cadastre no menu ",n.jsx("b",{children:"Cadastro da Prefeitura"})," para habilitar assinaturas nos relatorios."]}):n.jsxs("div",{className:"border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden",children:[n.jsxs("button",{type:"button",onClick:()=>c(!l),className:"w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",children:[n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(B,{size:16,className:"text-accent-500"}),n.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinaturas do Relatorio"}),t.length>0&&n.jsxs("span",{className:"text-xs bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-full",children:[t.length," selecionado(s)"]})]}),l?n.jsx(P,{size:16,className:"text-gray-400"}):n.jsx(M,{size:16,className:"text-gray-400"})]}),t.length>0&&!l&&n.jsx("div",{className:"px-4 py-2 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-1.5",children:t.map(i=>n.jsxs("span",{className:"text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-2 py-1 rounded-full",children:[i.name," ",n.jsxs("span",{className:"text-accent-400",children:["(",i.role,")"]})]},i.id))}),l&&n.jsx("div",{className:"p-3 border-t border-gray-100 dark:border-gray-600 space-y-1 max-h-64 overflow-y-auto",children:r.map(i=>{const d=t.some(p=>p.id===i.id);return n.jsxs("label",{className:`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${d?"bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700":"hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"}`,children:[n.jsx("input",{type:"checkbox",checked:d,onChange:()=>s(i),className:"rounded text-accent-500 focus:ring-accent-400"}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200 truncate",children:i.name}),n.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 truncate",children:i.role})]}),n.jsx("span",{className:`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${H[i.source]||""}`,children:I[i.source]||i.source})]},i.id)})})]})}function W(t){if(t.length===0)return"";const e=Math.min(t.length,3),a=t.length<=3?"display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px":`display:grid;grid-template-columns:repeat(${e},1fr);gap:20px`,r=t.map(o=>`
    <div style="text-align:center;min-width:180px;margin-top:50px">
      <div style="border-top:1px solid #333;padding-top:8px;margin:0 10px">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#333">${o.name}</p>
        <p style="font-size:10px;color:#666;margin:2px 0 0">${o.role}</p>
        ${o.cpf?'<p style="font-size:9px;color:#999;margin:1px 0 0">CPF: '+o.cpf+"</p>":""}
        ${o.decree?'<p style="font-size:9px;color:#999;margin:1px 0 0">'+o.decree+"</p>":""}
      </div>
    </div>
  `).join("");return`<div style="${a};margin-top:40px;page-break-inside:avoid">${r}</div>`}const _=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function G(){const t=new Date;return`${t.getDate()} de ${_[t.getMonth()]} de ${t.getFullYear()}`}async function X(t,e){const a={name:"",city:"",state:""},r={};try{const o=await e.municipalities.getById({id:t});o&&(a.name=o.name||"",a.city=o.city||"",a.state=o.state||"",a.phone=o.phone||"",a.email=o.email||"",a.logoUrl=o.logoUrl||"",a.cnpj=o.cnpj||"",o.logradouro?a.address=[o.logradouro,o.numero,o.bairro,o.city,o.state].filter(Boolean).join(", "):a.address=o.address||"",r.name=o.secretariaName||"",r.cnpj=o.secretariaCnpj||"",r.secretarioName=o.secretarioName||"",r.secretarioCargo=o.secretarioCargo||"Secretário(a) de Educação",r.phone=o.secretariaPhone||"",r.email=o.secretariaEmail||"",r.address=o.secretariaLogradouro||"")}catch{}return{municipality:a,secretaria:r}}function K(t,e){const a=e.find(o=>o.id===t);if(!a)return;let r="";try{r=JSON.parse(localStorage.getItem("netescol_school_extra_"+t)||"{}").logoUrl||""}catch{}return{name:a.name||"",code:a.code||"",address:a.address||"",phone:a.phone||"",directorName:a.directorName||"",logoUrl:r}}function Q(t){var v;const e=t.municipality,a=t.secretaria,r=t.school,o=t.fontFamily==="serif"?"'Times New Roman', 'Georgia', serif":"'Segoe UI', Arial, sans-serif",l=t.fontSize||12,c=t.orientation||"portrait",s=t.showDate!==!1,i=t.dateText||`${e.city||""}${e.state?"/"+e.state:""}, ${G()}.`,d=(v=t.signatories)!=null&&v.length?W(t.signatories):"",p={AC:"Acre",AL:"Alagoas",AP:"Amapa",AM:"Amazonas",BA:"Bahia",CE:"Ceara",DF:"Distrito Federal",ES:"Espirito Santo",GO:"Goias",MA:"Maranhao",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Para",PB:"Paraiba",PR:"Parana",PE:"Pernambuco",PI:"Piaui",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondonia",RR:"Roraima",SC:"Santa Catarina",SP:"Sao Paulo",SE:"Sergipe",TO:"Tocantins"},u=e.state?p[e.state.toUpperCase()]||e.state:"",$=`
    <div class="report-institutional-header">
      <table class="header-table">
        <tr>
          ${e.logoUrl?`<td class="logo-cell"><img src="${e.logoUrl}" class="inst-logo" alt="Brasao"/></td>`:""}
          <td class="info-cell">
            ${u?`<div class="estado-name">ESTADO ${u.toUpperCase().startsWith("D")?"DO ":"DE "}${u.toUpperCase()}</div>`:""}
            <div class="mun-name">${(e.name||"PREFEITURA MUNICIPAL").toUpperCase()}</div>
            ${e.cnpj?`<div class="mun-detail">CNPJ: ${e.cnpj}</div>`:""}
            ${a!=null&&a.name?`<div class="sec-name">${a.name.toUpperCase()}</div>`:""}
            ${a!=null&&a.cnpj?`<div class="mun-detail">CNPJ: ${a.cnpj}</div>`:""}
            ${a!=null&&a.secretarioName?`<div class="mun-detail">${a.secretarioCargo||"Secretario(a)"}: ${a.secretarioName}</div>`:""}
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
  `,x=[];if(e.name&&e.address?x.push(`${e.name} - ${e.address}`):e.name&&x.push(e.name),a!=null&&a.name){let m=a.name;a.address&&(m+=" - "+a.address),a.phone&&(m+=" | Fone: "+a.phone),x.push(m)}if(e.phone||e.email){const m=[];e.phone&&m.push("Fone: "+e.phone),e.email&&m.push(e.email),x.push(m.join(" | "))}return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.title} - NetEscol</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${c==="landscape"?"A4 landscape":"A4"};margin:15mm 20mm 15mm 20mm}
  html,body{height:100%;margin:0;padding:0}
  body{font-family:${o};font-size:${l}px;color:#1a1a1a;line-height:1.6;max-width:100%}

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
  .report-body{min-height:300px}
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

  /* PAGE LAYOUT TABLE - empurra rodape para o fundo da pagina */
  /* Funciona em: navegador, html2pdf, Word */
  .page-table{width:100%;border-collapse:collapse;border:none;height:100%}
  .page-table td{border:none!important;padding:0}
  .page-table .td-content{vertical-align:top}
  .page-table .td-footer{vertical-align:bottom;height:1px}

  /* FOOTER */
  .report-footer-bar{text-align:center;font-size:8px;color:#999;border-top:2px solid #d1d5db;padding:8px 0 0}
  .report-footer-bar .footer-line{margin:2px 0}
  .report-footer-bar .footer-brand{color:#2DB5B0;font-weight:bold;font-size:9px;margin-top:3px}

  /* TABLE SPECIFIC STYLES */
  .grade-table th{font-size:9px;padding:5px 4px}
  .grade-table td{padding:4px;font-size:11px}
  .grade-table .approved{color:#059669;font-weight:bold}
  .grade-table .failed{color:#dc2626;font-weight:bold}
  .grade-table .total-row{background:#f0f4f8!important;font-weight:bold}

  /* DECLARATION TEXT */
  .declaration-text{font-size:14px;line-height:2;text-align:justify;text-indent:50px;margin:20px 0}
  .declaration-text b{color:#1B3A5C}

  /* PRINT */
  @media print{
    body{padding:0;font-size:${l}px}
    .report-institutional-header{margin-bottom:15px}
    .no-print{display:none!important}
  }
  @media screen{
    body{max-width:900px;margin:20px auto;padding:20px 40px;background:#fff;box-shadow:0 0 20px rgba(0,0,0,0.1)}
  }
</style></head><body>
<table class="page-table"><tr><td class="td-content">
${$}
<div class="report-title">
  <h1>${t.title}</h1>
  ${t.subtitle?`<div class="subtitle">${t.subtitle}</div>`:""}
</div>
<div class="report-body">
  ${t.content}
</div>
${s?`<div class="report-date">${i}</div>`:""}
${d}
</td></tr><tr><td class="td-footer">
<div class="report-footer-bar">
  ${x.map(m=>`<div class="footer-line">${m}</div>`).join("")}
  <div class="footer-line footer-brand">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</div>
</td></tr></table>
</body></html>`}function ee(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),setTimeout(()=>e.print(),700))}async function te(t,e){const r=(e||"relatorio").replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,"_").replace(/_+/g,"_"),o=`
<script>
function downloadWord() {
  var bar = document.getElementById('report-action-bar');
  var barHTML = bar ? bar.outerHTML : '';
  var styleBar = document.getElementById('action-bar-style');
  var styleHTML = styleBar ? styleBar.outerHTML : '';
  var fullHTML = document.documentElement.outerHTML.replace(barHTML, '').replace(styleHTML, '');
  var wordWrap = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:2cm}body{font-family:Calibri,Arial,sans-serif}</style></head>' + fullHTML.substring(fullHTML.indexOf('<body'));
  var blob = new Blob(['\\uFEFF' + wordWrap], {type: 'application/msword'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '${r}.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function downloadPDF() {
  var btn = document.getElementById('btn-pdf');
  btn.innerHTML = 'Gerando PDF...';
  btn.disabled = true;
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  script.onload = function() {
    var bar = document.getElementById('report-action-bar');
    bar.style.display = 'none';
    var opt = {
      margin: [10, 10, 10, 10],
      filename: '${r}.pdf',
      image: {type: 'jpeg', quality: 0.95},
      html2canvas: {scale: 2, useCORS: true},
      jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'}
    };
    html2pdf().set(opt).from(document.body).save().then(function() {
      bar.style.display = 'flex';
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar PDF';
      btn.disabled = false;
    });
  };
  document.head.appendChild(script);
}
function imprimirDoc() {
  var bar = document.getElementById('report-action-bar');
  bar.style.display = 'none';
  setTimeout(function() {
    window.print();
    setTimeout(function() { bar.style.display = 'flex'; }, 500);
  }, 100);
}
<\/script>`,c=t.replace("</head>",o+"</head>").replace(/<body[^>]*>/i,"$&"+`
<style id="action-bar-style">
  #report-action-bar { position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1B3A5C,#264a6e);padding:10px 20px;display:flex;align-items:center;gap:8px;box-shadow:0 2px 12px rgba(0,0,0,0.4);font-family:Arial,sans-serif }
  #report-action-bar .bar-title { color:white;font-size:14px;font-weight:bold;flex:1 }
  #report-action-bar button { border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:opacity 0.2s }
  #report-action-bar button:hover { opacity:0.9 }
  #report-action-bar button:disabled { opacity:0.5;cursor:wait }
  .btn-pdf-dl { background:#e53e3e;color:white }
  .btn-print { background:#3182ce;color:white }
  .btn-word { background:#2B579A;color:white }
  body { padding-top: 56px !important }
  @media print { #report-action-bar, #action-bar-style + style { display:none!important } body { padding-top:0!important } }
</style>
<div id="report-action-bar">
  <span class="bar-title">NetEscol</span>
  <button id="btn-pdf" class="btn-pdf-dl" onclick="downloadPDF()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    Baixar PDF
  </button>
  <button class="btn-print" onclick="imprimirDoc()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    Imprimir
  </button>
  <button class="btn-word" onclick="downloadWord()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="2" fill="#fff" opacity="0.3"/><text x="12" y="15" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="Arial">W</text></svg>
    Word
  </button>
</div>`),s=window.open("","_blank");s&&(s.document.write(c),s.document.close())}export{Y as E,k as F,J as R,K as a,Q as g,Z as h,X as l,te as o,ee as p};
