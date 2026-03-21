import{c as b,r as g,P as S,F as E,af as A,D as C,j as i,X as T,f as D,b as R,a as u}from"./index-GCWGysrg.js";import{G as P}from"./globe-CHnSUdGW.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=b("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=b("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=b("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=b("FileDown",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]),k=[{value:"print",label:"Impressao Direta",icon:S,desc:"Envia direto para a impressora",group:"visualizar"},{value:"pdf",label:"Abrir em PDF",icon:E,desc:"Abre o documento para visualizacao",group:"visualizar"},{value:"html",label:"Abrir em HTML",icon:P,desc:"Abre em nova aba no navegador",group:"visualizar"},{value:"pdf-download",label:"Download PDF (.pdf)",icon:j,desc:"Salvar arquivo PDF no computador",group:"download"},{value:"docx",label:"Download Word (.docx)",icon:j,desc:"Salvar como documento Word",group:"download"},{value:"csv",label:"Download CSV (.csv)",icon:A,desc:"Planilha compativel com Excel",group:"download"},{value:"html-download",label:"Download HTML (.html)",icon:C,desc:"Salvar pagina HTML",group:"download"}];function Y({open:t,onClose:e,onExport:a,title:o}){const[r,s]=g.useState("pdf");if(!t)return null;const p=k.filter(n=>n.group==="visualizar"),d=k.filter(n=>n.group==="download");return i.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:i.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md",children:[i.jsxs("div",{className:"flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700",children:[i.jsxs("h3",{className:"text-lg font-semibold flex items-center gap-2",children:[i.jsx(C,{size:18,className:"text-accent-500"}),o||"Exportar Relatorio"]}),i.jsx("button",{onClick:e,className:"p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400",children:i.jsx(T,{size:20})})]}),i.jsxs("div",{className:"p-5 max-h-[60vh] overflow-y-auto",children:[i.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Visualizar"}),i.jsx("div",{className:"space-y-1.5 mb-4",children:p.map(n=>{const l=n.icon,c=r===n.value;return i.jsxs("button",{onClick:()=>s(n.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${c?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[i.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:i.jsx(l,{size:16})}),i.jsxs("div",{className:"flex-1 min-w-0",children:[i.jsx("p",{className:`text-sm font-medium ${c?"text-accent-700":"text-gray-800"}`,children:n.label}),i.jsx("p",{className:"text-xs text-gray-400",children:n.desc})]}),c&&i.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:i.jsx(y,{size:12,className:"text-white"})})]},n.value)})}),i.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Baixar Arquivo"}),i.jsx("div",{className:"space-y-1.5",children:d.map(n=>{const l=n.icon,c=r===n.value;return i.jsxs("button",{onClick:()=>s(n.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${c?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[i.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:i.jsx(l,{size:16})}),i.jsxs("div",{className:"flex-1 min-w-0",children:[i.jsx("p",{className:`text-sm font-medium ${c?"text-accent-700":"text-gray-800"}`,children:n.label}),i.jsx("p",{className:"text-xs text-gray-400",children:n.desc})]}),c&&i.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:i.jsx(y,{size:12,className:"text-white"})})]},n.value)})})]}),i.jsxs("div",{className:"flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700",children:[i.jsx("button",{onClick:e,className:"btn-secondary flex-1",children:"Cancelar"}),i.jsxs("button",{onClick:()=>{a(r),e()},className:"btn-primary flex-1 flex items-center justify-center gap-2",children:[i.jsx(y,{size:16})," Confirmar"]})]})]})})}function M(t,e){if(!(t!=null&&t.length)){alert("Sem dados para exportar");return}const a=Object.keys(t[0]),o=[a.join(";"),...t.map(p=>a.map(d=>'"'+(p[d]??"")+'"').join(";"))].join(`
`),r=new Blob(["\uFEFF"+o],{type:"text/csv;charset=utf-8;"}),s=document.createElement("a");s.href=URL.createObjectURL(r),s.download=e.endsWith(".csv")?e:e+".csv",s.click()}function N(t,e,a=!1){if(a){const o=new Blob([t],{type:"text/html;charset=utf-8;"}),r=document.createElement("a");r.href=URL.createObjectURL(o),r.download=e.endsWith(".html")?e:e+".html",r.click()}else{const o=window.open("","_blank");o&&(o.document.write(t),o.document.close())}}function O(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),e.onload=()=>e.print())}function $(t,e,a=!1){const o=t.replace("</head>","<style>@media print{@page{margin:10mm;size:A4}body{margin:0;padding:15px}.no-print{display:none!important}}</style></head>");if(a){const r=window.open("","_blank");r&&(r.document.write(o),r.document.close(),setTimeout(()=>r.print(),500))}else{const r=new Blob([o],{type:"text/html;charset=utf-8"});window.open(URL.createObjectURL(r),"_blank")}}function U(t,e){const a='<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:15mm 20mm}body{font-family:Arial,sans-serif;font-size:12pt}table{border-collapse:collapse;width:100%}th{background-color:#1B3A5C;color:white;padding:8px;text-align:left;font-size:10pt}td{border:1px solid #ddd;padding:6px;font-size:10pt}tr:nth-child(even){background-color:#f8f9fa}h1{color:#1B3A5C;font-size:16pt;border-bottom:2px solid #2DB5B0;padding-bottom:5px}</style></head><body>'+t.replace(/<!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head>[\s\S]*?<\/head>/i,"").replace(/<\/?body[^>]*>/gi,"")+"</body></html>",o=new Blob(["\uFEFF"+a],{type:"application/msword"}),r=document.createElement("a");r.href=URL.createObjectURL(o),r.download=e.endsWith(".doc")?e:e+".doc",r.click()}async function J(t,e,a,o){switch(t){case"print":O(a);break;case"pdf":$(a,o,!1);break;case"pdf-download":$(a,o,!0);break;case"docx":U(a,o);break;case"csv":M(e,o);break;case"html":N(a,o,!1);break;case"html-download":N(a,o,!0);break}}let f=null,v=null;function F(){const{user:t}=R(),e=(t==null?void 0:t.municipalityId)||0,[a,o]=g.useState([]),[r,s]=g.useState(!0);return g.useEffect(()=>{if(!e){s(!1);return}if(v===e&&f){o(f),s(!1);return}s(!0);const p=[];u.municipalities.getById({id:e}).then(async d=>{d&&(d.prefeitoName&&p.push({id:"prefeito",name:d.prefeitoName,role:d.prefeitoCargo||"Prefeito(a) Municipal",cpf:d.prefeitoCpf||"",source:"prefeito"}),d.secretarioName&&p.push({id:"secretario",name:d.secretarioName,role:d.secretarioCargo||"Secretário(a) de Educação",cpf:d.secretarioCpf||"",decree:d.secretarioDecreto||"",source:"secretario"}));try{const n=await u.municipalities.listResponsibles({municipalityId:e});Array.isArray(n)&&n.forEach(l=>{p.push({id:"resp_"+l.id,name:l.name,role:l.role,cpf:l.cpf||"",decree:l.decree||"",source:"responsavel"})})}catch{}try{const n=await u.schools.list({municipalityId:e});Array.isArray(n)&&n.forEach(l=>{l.directorName&&p.push({id:"dir_"+l.id,name:l.directorName,role:"Diretor(a) - "+l.name,source:"diretor"})})}catch{}f=p,v=e,o(p),s(!1)}).catch(()=>{f=p,v=e,o(p),s(!1)})},[e]),{signatories:a,loading:r}}const I={prefeito:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",secretario:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",responsavel:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",diretor:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"},H={prefeito:"Prefeitura",secretario:"Sec. Educacao",responsavel:"Responsavel",diretor:"Escola"};function X({selected:t,onChange:e,maxSignatories:a=5}){const{signatories:o,loading:r}=F(),[s,p]=g.useState(!1),d=n=>{t.find(c=>c.id===n.id)?e(t.filter(c=>c.id!==n.id)):t.length<a&&e([...t,n])};return r?null:o.length===0?i.jsxs("div",{className:"p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400",children:["Nenhum responsavel cadastrado. Cadastre no menu ",i.jsx("b",{children:"Cadastro da Prefeitura"})," para habilitar assinaturas nos relatorios."]}):i.jsxs("div",{className:"border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden",children:[i.jsxs("button",{type:"button",onClick:()=>p(!s),className:"w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",children:[i.jsxs("div",{className:"flex items-center gap-2",children:[i.jsx(D,{size:16,className:"text-accent-500"}),i.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinaturas do Relatorio"}),t.length>0&&i.jsxs("span",{className:"text-xs bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-full",children:[t.length," selecionado(s)"]})]}),s?i.jsx(L,{size:16,className:"text-gray-400"}):i.jsx(B,{size:16,className:"text-gray-400"})]}),t.length>0&&!s&&i.jsx("div",{className:"px-4 py-2 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-1.5",children:t.map(n=>i.jsxs("span",{className:"text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-2 py-1 rounded-full",children:[n.name," ",i.jsxs("span",{className:"text-accent-400",children:["(",n.role,")"]})]},n.id))}),s&&i.jsx("div",{className:"p-3 border-t border-gray-100 dark:border-gray-600 space-y-1 max-h-64 overflow-y-auto",children:o.map(n=>{const l=t.some(c=>c.id===n.id);return i.jsxs("label",{className:`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${l?"bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700":"hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"}`,children:[i.jsx("input",{type:"checkbox",checked:l,onChange:()=>d(n),className:"rounded text-accent-500 focus:ring-accent-400"}),i.jsxs("div",{className:"flex-1 min-w-0",children:[i.jsx("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200 truncate",children:n.name}),i.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 truncate",children:n.role})]}),i.jsx("span",{className:`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${I[n.source]||""}`,children:H[n.source]||n.source})]},n.id)})})]})}function G(t){if(t.length===0)return"";const e=Math.min(t.length,3),a=t.length<=3?"display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px":`display:grid;grid-template-columns:repeat(${e},1fr);gap:20px`,o=t.map(r=>`
    <div style="text-align:center;min-width:180px;margin-top:50px">
      <div style="border-top:1px solid #333;padding-top:8px;margin:0 10px">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#333">${r.name}</p>
        <p style="font-size:10px;color:#666;margin:2px 0 0">${r.role}</p>
        ${r.cpf?'<p style="font-size:9px;color:#999;margin:1px 0 0">CPF: '+r.cpf+"</p>":""}
        ${r.decree?'<p style="font-size:9px;color:#999;margin:1px 0 0">'+r.decree+"</p>":""}
      </div>
    </div>
  `).join("");return`<div style="${a};margin-top:40px;page-break-inside:avoid">${o}</div>`}const _=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function W(){const t=new Date;return`${t.getDate()} de ${_[t.getMonth()]} de ${t.getFullYear()}`}async function Z(t,e){const a={name:"",city:"",state:""},o={};try{const r=await e.municipalities.getById({id:t});r&&(a.name=r.name||"",a.city=r.city||"",a.state=r.state||"",a.phone=r.phone||"",a.email=r.email||"",a.logoUrl=r.logoUrl||"",a.cnpj=r.cnpj||"",r.logradouro?a.address=[r.logradouro,r.numero,r.bairro,r.city,r.state].filter(Boolean).join(", "):a.address=r.address||"",o.name=r.secretariaName||"",o.cnpj=r.secretariaCnpj||"",o.secretarioName=r.secretarioName||"",o.secretarioCargo=r.secretarioCargo||"Secretário(a) de Educação",o.phone=r.secretariaPhone||"",o.email=r.secretariaEmail||"",o.address=r.secretariaLogradouro||"")}catch{}return{municipality:a,secretaria:o}}function K(t,e){const a=e.find(r=>r.id===t);if(!a)return;let o="";try{o=JSON.parse(localStorage.getItem("netescol_school_extra_"+t)||"{}").logoUrl||""}catch{}return{name:a.name||"",code:a.code||"",address:a.address||"",phone:a.phone||"",directorName:a.directorName||"",logoUrl:o}}function Q(t){var w;const e=t.municipality,a=t.secretaria,o=t.school,r=t.fontFamily==="serif"?"'Times New Roman', 'Georgia', serif":"'Segoe UI', Arial, sans-serif",s=t.fontSize||12,p=t.orientation||"portrait",d=t.showDate!==!1,n=t.dateText||`${e.city||""}${e.state?"/"+e.state:""}, ${W()}.`,l=(w=t.signatories)!=null&&w.length?G(t.signatories):"",c={AC:"Acre",AL:"Alagoas",AP:"Amapa",AM:"Amazonas",BA:"Bahia",CE:"Ceara",DF:"Distrito Federal",ES:"Espirito Santo",GO:"Goias",MA:"Maranhao",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Para",PB:"Paraiba",PR:"Parana",PE:"Pernambuco",PI:"Piaui",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondonia",RR:"Roraima",SC:"Santa Catarina",SP:"Sao Paulo",SE:"Sergipe",TO:"Tocantins"},h=e.state?c[e.state.toUpperCase()]||e.state:"",z=`
    <div class="report-institutional-header">
      <table class="header-table">
        <tr>
          ${e.logoUrl?`<td class="logo-cell"><img src="${e.logoUrl}" class="inst-logo" alt="Brasao"/></td>`:""}
          <td class="info-cell">
            ${h?`<div class="estado-name">ESTADO ${h.toUpperCase().startsWith("D")?"DO ":"DE "}${h.toUpperCase()}</div>`:""}
            <div class="mun-name">${(e.name||"PREFEITURA MUNICIPAL").toUpperCase()}</div>
            ${e.cnpj?`<div class="mun-detail">CNPJ: ${e.cnpj}</div>`:""}
            ${a!=null&&a.name?`<div class="sec-name">${a.name.toUpperCase()}</div>`:""}
            ${a!=null&&a.cnpj?`<div class="mun-detail">CNPJ: ${a.cnpj}</div>`:""}
            ${a!=null&&a.secretarioName?`<div class="mun-detail">${a.secretarioCargo||"Secretario(a)"}: ${a.secretarioName}</div>`:""}
          </td>
          ${o?`
            <td class="school-cell">
              ${o.logoUrl?`<img src="${o.logoUrl}" class="school-logo" alt=""/>`:""}
              <div class="school-name">${o.name}</div>
              ${o.code?`<div class="school-detail">INEP: ${o.code}</div>`:""}
              ${o.address?`<div class="school-detail">${o.address}</div>`:""}
              ${o.phone?`<div class="school-detail">Fone: ${o.phone}</div>`:""}
            </td>
          `:""}
        </tr>
      </table>
      <div class="header-line"></div>
    </div>
  `,m=[];if(e.name&&e.address?m.push(`${e.name} - ${e.address}`):e.name&&m.push(e.name),a!=null&&a.name){let x=a.name;a.address&&(x+=" - "+a.address),a.phone&&(x+=" | Fone: "+a.phone),m.push(x)}if(e.phone||e.email){const x=[];e.phone&&x.push("Fone: "+e.phone),e.email&&x.push(e.email),m.push(x.join(" | "))}return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t.title} - NetEscol</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${p==="landscape"?"A4 landscape":"A4"};margin:15mm 20mm 15mm 20mm}
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
${z}
<div class="report-title">
  <h1>${t.title}</h1>
  ${t.subtitle?`<div class="subtitle">${t.subtitle}</div>`:""}
</div>
<div class="report-body">
  ${t.content}
</div>
${d?`<div class="report-date">${n}</div>`:""}
${l}
</td></tr><tr><td class="td-footer">
<div class="report-footer-bar">
  ${m.map(x=>`<div class="footer-line">${x}</div>`).join("")}
  <div class="footer-line footer-brand">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</div>
</td></tr></table>
</body></html>`}function ee(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),setTimeout(()=>e.print(),700))}export{Y as E,j as F,X as R,K as a,Q as g,J as h,Z as l,ee as p};
