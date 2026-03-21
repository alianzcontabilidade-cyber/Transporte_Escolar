import{c as h,r as b,P as $,F as S,af as T,D as E,j as n,X as A,ag as D,f as B,b as P,a as u}from"./index-DoAfAW7o.js";import{G as R}from"./globe-JFv7z03w.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=h("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=h("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=h("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=h("FileDown",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]),j=[{value:"print",label:"Impressão Direta",icon:$,desc:"Envia direto para a impressora",group:"visualizar"},{value:"pdf",label:"Abrir em PDF",icon:S,desc:"Abre o documento para visualização",group:"visualizar"},{value:"html",label:"Abrir em HTML",icon:R,desc:"Abre em nova aba no navegador",group:"visualizar"},{value:"pdf-download",label:"Download PDF (.pdf)",icon:k,desc:"Salvar arquivo PDF no computador",group:"download"},{value:"docx",label:"Download Word (.docx)",icon:k,desc:"Salvar como documento Word",group:"download"},{value:"csv",label:"Download CSV (.csv)",icon:T,desc:"Planilha compatível com Excel",group:"download"},{value:"html-download",label:"Download HTML (.html)",icon:E,desc:"Salvar página HTML",group:"download"}];function te({open:t,onClose:e,onExport:o,title:a}){const[r,s]=b.useState("pdf");if(!t)return null;const l=j.filter(i=>i.group==="visualizar"),c=j.filter(i=>i.group==="download");return n.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:n.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md",children:[n.jsxs("div",{className:"flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700",children:[n.jsxs("h3",{className:"text-lg font-semibold flex items-center gap-2",children:[n.jsx(E,{size:18,className:"text-accent-500"}),a||"Exportar Relatorio"]}),n.jsx("button",{onClick:e,className:"p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400",children:n.jsx(A,{size:20})})]}),n.jsxs("div",{className:"p-5 max-h-[60vh] overflow-y-auto",children:[n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Visualizar"}),n.jsx("div",{className:"space-y-1.5 mb-4",children:l.map(i=>{const d=i.icon,p=r===i.value;return n.jsxs("button",{onClick:()=>s(i.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${p?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(d,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${p?"text-accent-700":"text-gray-800"}`,children:i.label}),n.jsx("p",{className:"text-xs text-gray-400",children:i.desc})]}),p&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(y,{size:12,className:"text-white"})})]},i.value)})}),n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Baixar Arquivo"}),n.jsx("div",{className:"space-y-1.5",children:c.map(i=>{const d=i.icon,p=r===i.value;return n.jsxs("button",{onClick:()=>s(i.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${p?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(d,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${p?"text-accent-700":"text-gray-800"}`,children:i.label}),n.jsx("p",{className:"text-xs text-gray-400",children:i.desc})]}),p&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(y,{size:12,className:"text-white"})})]},i.value)})})]}),n.jsxs("div",{className:"flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700",children:[n.jsx("button",{onClick:e,className:"btn-secondary flex-1",children:"Cancelar"}),n.jsxs("button",{onClick:()=>{o(r),e()},className:"btn-primary flex-1 flex items-center justify-center gap-2",children:[n.jsx(y,{size:16})," Confirmar"]})]})]})})}function _(t,e){if(!(t!=null&&t.length)){alert("Sem dados para exportar");return}const o=Object.keys(t[0]),a=[o.join(";"),...t.map(l=>o.map(c=>'"'+(l[c]??"")+'"').join(";"))].join(`
`),r=new Blob(["\uFEFF"+a],{type:"text/csv;charset=utf-8;"}),s=document.createElement("a");s.href=URL.createObjectURL(r),s.download=e.endsWith(".csv")?e:e+".csv",s.click()}function z(t,e,o=!1){if(o){const a=new Blob([t],{type:"text/html;charset=utf-8;"}),r=document.createElement("a");r.href=URL.createObjectURL(a),r.download=e.endsWith(".html")?e:e+".html",r.click()}else{const a=window.open("","_blank");a&&(a.document.write(t),a.document.close())}}function F(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),e.onload=()=>e.print())}function N(t,e,o=!1){D(async()=>{const{openReportAsPDF:a,printReportHTML:r}=await Promise.resolve().then(()=>K);return{openReportAsPDF:a,printReportHTML:r}},void 0).then(({openReportAsPDF:a,printReportHTML:r})=>{if(o){const s=t.replace("</head>","<style>@media print{@page{margin:10mm;size:A4}body{margin:0;padding:15px}.no-print{display:none!important}}</style></head>"),l=window.open("","_blank");l&&(l.document.write(s),l.document.close(),setTimeout(()=>l.print(),500))}else a(t,e)})}function O(t,e){const o='<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:15mm 20mm}body{font-family:Arial,sans-serif;font-size:12pt}table{border-collapse:collapse;width:100%}th{background-color:#1B3A5C;color:white;padding:8px;text-align:left;font-size:10pt}td{border:1px solid #ddd;padding:6px;font-size:10pt}tr:nth-child(even){background-color:#f8f9fa}h1{color:#1B3A5C;font-size:16pt;border-bottom:2px solid #2DB5B0;padding-bottom:5px}</style></head><body>'+t.replace(/<!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head>[\s\S]*?<\/head>/i,"").replace(/<\/?body[^>]*>/gi,"")+"</body></html>",a=new Blob(["\uFEFF"+o],{type:"application/msword"}),r=document.createElement("a");r.href=URL.createObjectURL(a),r.download=e.endsWith(".doc")?e:e+".doc",r.click()}async function oe(t,e,o,a){switch(t){case"print":F(o);break;case"pdf":N(o,a,!1);break;case"pdf-download":N(o,a,!0);break;case"docx":O(o,a);break;case"csv":_(e,a);break;case"html":z(o,a,!1);break;case"html-download":z(o,a,!0);break}}let f=null,w=null;function I(){const{user:t}=P(),e=(t==null?void 0:t.municipalityId)||0,[o,a]=b.useState([]),[r,s]=b.useState(!0);return b.useEffect(()=>{if(!e){s(!1);return}if(w===e&&f){a(f),s(!1);return}s(!0);const l=[];u.municipalities.getById({id:e}).then(async c=>{c&&(c.prefeitoName&&l.push({id:"prefeito",name:c.prefeitoName,role:c.prefeitoCargo||"Prefeito(a) Municipal",cpf:c.prefeitoCpf||"",source:"prefeito"}),c.secretarioName&&l.push({id:"secretario",name:c.secretarioName,role:c.secretarioCargo||"Secretário(a) de Educação",cpf:c.secretarioCpf||"",decree:c.secretarioDecreto||"",source:"secretario"}));try{const i=await u.municipalities.listResponsibles({municipalityId:e});Array.isArray(i)&&i.forEach(d=>{l.push({id:"resp_"+d.id,name:d.name,role:d.role,cpf:d.cpf||"",decree:d.decree||"",source:"responsavel"})})}catch{}try{const i=await u.schools.list({municipalityId:e});Array.isArray(i)&&i.forEach(d=>{d.directorName&&l.push({id:"dir_"+d.id,name:d.directorName,role:"Diretor(a) - "+d.name,source:"diretor"})})}catch{}f=l,w=e,a(l),s(!1)}).catch(()=>{f=l,w=e,a(l),s(!1)})},[e]),{signatories:o,loading:r}}const U={prefeito:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",secretario:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",responsavel:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",diretor:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"},H={prefeito:"Prefeitura",secretario:"Sec. Educacao",responsavel:"Responsavel",diretor:"Escola"};function ae({selected:t,onChange:e,maxSignatories:o=5}){const{signatories:a,loading:r}=I(),[s,l]=b.useState(!1),c=i=>{t.find(p=>p.id===i.id)?e(t.filter(p=>p.id!==i.id)):t.length<o&&e([...t,i])};return r?null:a.length===0?n.jsxs("div",{className:"p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400",children:["Nenhum responsavel cadastrado. Cadastre no menu ",n.jsx("b",{children:"Cadastro da Prefeitura"})," para habilitar assinaturas nos relatorios."]}):n.jsxs("div",{className:"border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden",children:[n.jsxs("button",{type:"button",onClick:()=>l(!s),className:"w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",children:[n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(B,{size:16,className:"text-accent-500"}),n.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinaturas do Relatorio"}),t.length>0&&n.jsxs("span",{className:"text-xs bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-full",children:[t.length," selecionado(s)"]})]}),s?n.jsx(L,{size:16,className:"text-gray-400"}):n.jsx(M,{size:16,className:"text-gray-400"})]}),t.length>0&&!s&&n.jsx("div",{className:"px-4 py-2 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-1.5",children:t.map(i=>n.jsxs("span",{className:"text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-2 py-1 rounded-full",children:[i.name," ",n.jsxs("span",{className:"text-accent-400",children:["(",i.role,")"]})]},i.id))}),s&&n.jsx("div",{className:"p-3 border-t border-gray-100 dark:border-gray-600 space-y-1 max-h-64 overflow-y-auto",children:a.map(i=>{const d=t.some(p=>p.id===i.id);return n.jsxs("label",{className:`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${d?"bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700":"hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"}`,children:[n.jsx("input",{type:"checkbox",checked:d,onChange:()=>c(i),className:"rounded text-accent-500 focus:ring-accent-400"}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200 truncate",children:i.name}),n.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 truncate",children:i.role})]}),n.jsx("span",{className:`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${U[i.source]||""}`,children:H[i.source]||i.source})]},i.id)})})]})}function W(t){if(t.length===0)return"";const e=Math.min(t.length,3),o=t.length<=3?"display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px":`display:grid;grid-template-columns:repeat(${e},1fr);gap:20px`,a=t.map(r=>`
    <div style="text-align:center;min-width:180px;margin-top:50px">
      <div style="border-top:1px solid #333;padding-top:8px;margin:0 10px">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#333">${r.name}</p>
        <p style="font-size:10px;color:#666;margin:2px 0 0">${r.role}</p>
        ${r.cpf?'<p style="font-size:9px;color:#999;margin:1px 0 0">CPF: '+r.cpf+"</p>":""}
        ${r.decree?'<p style="font-size:9px;color:#999;margin:1px 0 0">'+r.decree+"</p>":""}
      </div>
    </div>
  `).join("");return`<div style="${o};margin-top:40px;page-break-inside:avoid">${a}</div>`}const Z=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function G(){const t=new Date;return`${t.getDate()} de ${Z[t.getMonth()]} de ${t.getFullYear()}`}async function V(t,e){const o={name:"",city:"",state:""},a={};try{const r=await e.municipalities.getById({id:t});r&&(o.name=r.name||"",o.city=r.city||"",o.state=r.state||"",o.phone=r.phone||"",o.email=r.email||"",o.logoUrl=r.logoUrl||"",o.cnpj=r.cnpj||"",r.logradouro?o.address=[r.logradouro,r.numero,r.bairro,r.city,r.state].filter(Boolean).join(", "):o.address=r.address||"",a.name=r.secretariaName||"",a.cnpj=r.secretariaCnpj||"",a.secretarioName=r.secretarioName||"",a.secretarioCargo=r.secretarioCargo||"Secretário(a) de Educação",a.phone=r.secretariaPhone||"",a.email=r.secretariaEmail||"",a.address=r.secretariaLogradouro||"")}catch{}return{municipality:o,secretaria:a}}function Y(t,e){const o=e.find(r=>r.id===t);if(!o)return;let a="";try{a=JSON.parse(localStorage.getItem("netescol_school_extra_"+t)||"{}").logoUrl||""}catch{}return{name:o.name||"",code:o.code||"",address:o.address||"",phone:o.phone||"",directorName:o.directorName||"",logoUrl:a}}function q(t){var v;const e=t.municipality,o=t.secretaria,a=t.school,r=t.fontFamily==="serif"?"'Times New Roman', 'Georgia', serif":"'Segoe UI', Arial, sans-serif",s=t.fontSize||12,l=t.orientation||"portrait",c=t.showDate!==!1,i=t.dateText||`${e.city||""}${e.state?"/"+e.state:""}, ${G()}.`,d=(v=t.signatories)!=null&&v.length?W(t.signatories):"",p={AC:"Acre",AL:"Alagoas",AP:"Amapa",AM:"Amazonas",BA:"Bahia",CE:"Ceara",DF:"Distrito Federal",ES:"Espirito Santo",GO:"Goias",MA:"Maranhao",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Para",PB:"Paraiba",PR:"Parana",PE:"Pernambuco",PI:"Piaui",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondonia",RR:"Roraima",SC:"Santa Catarina",SP:"Sao Paulo",SE:"Sergipe",TO:"Tocantins"},g=e.state?p[e.state.toUpperCase()]||e.state:"",C=`
    <div class="report-institutional-header">
      <table class="header-table">
        <tr>
          ${e.logoUrl?`<td class="logo-cell"><img src="${e.logoUrl}" class="inst-logo" alt="Brasao"/></td>`:""}
          <td class="info-cell">
            ${g?`<div class="estado-name">ESTADO ${g.toUpperCase().startsWith("D")?"DO ":"DE "}${g.toUpperCase()}</div>`:""}
            <div class="mun-name">${(e.name||"PREFEITURA MUNICIPAL").toUpperCase()}</div>
            ${e.cnpj?`<div class="mun-detail">CNPJ: ${e.cnpj}</div>`:""}
            ${o!=null&&o.name?`<div class="sec-name">${o.name.toUpperCase()}</div>`:""}
            ${o!=null&&o.cnpj?`<div class="mun-detail">CNPJ: ${o.cnpj}</div>`:""}
            ${o!=null&&o.secretarioName?`<div class="mun-detail">${o.secretarioCargo||"Secretario(a)"}: ${o.secretarioName}</div>`:""}
          </td>
          ${a?`
            <td class="school-cell">
              ${a.logoUrl?`<img src="${a.logoUrl}" class="school-logo" alt=""/>`:""}
              <div class="school-name">${a.name}</div>
              ${a.code?`<div class="school-detail">INEP: ${a.code}</div>`:""}
              ${a.address?`<div class="school-detail">${a.address}</div>`:""}
              ${a.phone?`<div class="school-detail">Fone: ${a.phone}</div>`:""}
            </td>
          `:""}
        </tr>
      </table>
      <div class="header-line"></div>
    </div>
  `,x=[];if(e.name&&e.address?x.push(`${e.name} - ${e.address}`):e.name&&x.push(e.name),o!=null&&o.name){let m=o.name;o.address&&(m+=" - "+o.address),o.phone&&(m+=" | Fone: "+o.phone),x.push(m)}if(e.phone||e.email){const m=[];e.phone&&m.push("Fone: "+e.phone),e.email&&m.push(e.email),x.push(m.join(" | "))}return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.title} - NetEscol</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${l==="landscape"?"A4 landscape":"A4"};margin:15mm 20mm 15mm 20mm}
  html,body{height:100%;margin:0;padding:0}
  body{font-family:${r};font-size:${s}px;color:#1a1a1a;line-height:1.6;max-width:100%}

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
    body{padding:0;font-size:${s}px}
    .report-institutional-header{margin-bottom:15px}
    .no-print{display:none!important}
  }
  @media screen{
    body{max-width:900px;margin:20px auto;padding:20px 40px;background:#fff;box-shadow:0 0 20px rgba(0,0,0,0.1)}
  }
</style></head><body>
<table class="page-table"><tr><td class="td-content">
${C}
<div class="report-title">
  <h1>${t.title}</h1>
  ${t.subtitle?`<div class="subtitle">${t.subtitle}</div>`:""}
</div>
<div class="report-body">
  ${t.content}
</div>
${c?`<div class="report-date">${i}</div>`:""}
${d}
</td></tr><tr><td class="td-footer">
<div class="report-footer-bar">
  ${x.map(m=>`<div class="footer-line">${m}</div>`).join("")}
  <div class="footer-line footer-brand">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</div>
</td></tr></table>
</body></html>`}function J(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),setTimeout(()=>e.print(),700))}async function X(t,e){const a=(e||"relatorio").replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,"_").replace(/_+/g,"_"),r=t.match(/<body[^>]*>([\s\S]*?)<\/body>/i),s=t.match(/<style[^>]*>([\s\S]*?)<\/style>/gi),l=r?r[1]:t;let c="";if(s)for(const p of s){const g=p.replace(/<\/?style[^>]*>/gi,"");c+=g+`
`}c=c.replace(/@media\s+screen\s*\{[^{}]*\{[^}]*\}[^}]*\}/g,"").replace(/@media\s+screen\s*\{[^}]*\}/g,""),l.replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/\$/g,"\\$");const i=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${a} - NetEscol</title>
<style>
/* VIEWER STYLES */
*{margin:0;padding:0;box-sizing:border-box}
html{background:#525659!important}
body{background:#525659!important;font-family:Arial,sans-serif;overflow-x:hidden;margin:0;padding:0}
#ne-toolbar{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#1B3A5C,#264a6e);padding:8px 16px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.4)}
#ne-toolbar .ne-title{color:white;font-size:14px;font-weight:bold;margin-right:auto}
#ne-toolbar button{border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px}
#ne-toolbar button:hover{opacity:0.85}
#ne-toolbar button:disabled{opacity:0.5;cursor:wait}
.ne-bpdf{background:#e53e3e;color:white}
.ne-bprint{background:#3182ce;color:white}
.ne-bword{background:#2B579A;color:white}
.ne-bzoom{background:rgba(255,255,255,0.15);color:white;padding:7px 10px!important;min-width:32px;justify-content:center}
.ne-bzoom:hover{background:rgba(255,255,255,0.25)!important}
.ne-div{width:1px;height:24px;background:rgba(255,255,255,0.2);margin:0 4px}
#ne-zlabel{color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;min-width:40px;text-align:center}
#ne-viewer{padding-top:56px;padding-bottom:20px;display:flex;justify-content:center}
#ne-page{background:white;width:794px;min-height:500px;padding:30px 40px;box-shadow:0 2px 20px rgba(0,0,0,0.3);transform-origin:top center}
@media print{#ne-toolbar{display:none!important}body{background:white!important}#ne-viewer{padding:0!important}#ne-page{width:100%!important;box-shadow:none!important;transform:none!important;padding:0!important}}
</style>
<style>
/* REPORT STYLES */
${c}
</style>
</head><body>
<div id="ne-toolbar">
<span class="ne-title">NetEscol</span>
<button class="ne-bzoom" onclick="nZout()" title="Diminuir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
<span id="ne-zlabel">100%</span>
<button class="ne-bzoom" onclick="nZin()" title="Aumentar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
<button class="ne-bzoom" onclick="nZreset()">100%</button>
<button class="ne-bzoom" onclick="nZfit()" title="Ajustar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg></button>
<div class="ne-div"></div>
<button id="ne-btnpdf" class="ne-bpdf" onclick="nDpdf()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar PDF</button>
<button class="ne-bprint" onclick="nPrint()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Imprimir</button>
<button class="ne-bword" onclick="nWord()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="2" fill="#fff" opacity="0.3"/><text x="12" y="15" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="Arial">W</text></svg> Word</button>
</div>
<div id="ne-viewer"><div id="ne-page">${l}</div></div>
<script>
var _z=100;
function _sz(v){_z=Math.max(25,Math.min(300,v));document.getElementById('ne-page').style.transform='scale('+(_z/100)+')';document.getElementById('ne-zlabel').textContent=_z+'%';}
function nZin(){_sz(_z+10);}
function nZout(){_sz(_z-10);}
function nZreset(){_sz(100);}
function nZfit(){var w=window.innerWidth-80;_sz(Math.min(Math.floor(w/794*100),150));}
function nWord(){
var c=document.getElementById('ne-page').innerHTML;
var h='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:2cm}body{font-family:Calibri,Arial,sans-serif}</style></head><body>'+c+'</body></html>';
var b=new Blob(['\\uFEFF'+h],{type:'application/msword'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${a}.doc';document.body.appendChild(a);a.click();document.body.removeChild(a);
}
function nDpdf(){
var btn=document.getElementById('ne-btnpdf');btn.innerHTML='Gerando...';btn.disabled=true;
var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
s.onload=function(){
var pg=document.getElementById('ne-page');pg.style.transform='none';
document.getElementById('ne-toolbar').style.display='none';
html2pdf().set({margin:[10,10,10,10],filename:'${a}.pdf',image:{type:'jpeg',quality:0.95},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(pg).save().then(function(){
document.getElementById('ne-toolbar').style.display='flex';_sz(_z);
btn.innerHTML='Baixar PDF';btn.disabled=false;
});};document.head.appendChild(s);
}
function nPrint(){
var pg=document.getElementById('ne-page');pg.style.transform='none';
document.getElementById('ne-toolbar').style.display='none';
setTimeout(function(){window.print();setTimeout(function(){document.getElementById('ne-toolbar').style.display='flex';_sz(_z);},500);},100);
}
nZfit();
<\/script>
</body></html>`,d=window.open("","_blank");d&&(d.document.write(i),d.document.close())}const K=Object.freeze(Object.defineProperty({__proto__:null,generateReportHTML:q,loadMunicipalityData:V,loadSchoolData:Y,openReportAsPDF:X,printReportHTML:J},Symbol.toStringTag,{value:"Module"}));export{te as E,k as F,ae as R,Y as a,q as g,oe as h,V as l,J as p};
