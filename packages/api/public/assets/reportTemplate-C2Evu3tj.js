import{c as v,r as h,ap as R,F as L,l as E,j as n,X as M,s as D,_ as F,g as B,b as U,a as j}from"./index-CODg8rPf.js";import{G as _}from"./globe-Kc3IcLF-.js";import{C as N}from"./check-CjwklMwu.js";import{C as I}from"./chevron-up-BV875jpf.js";import{C as O}from"./chevron-down-HusbnwgO.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=v("FileDown",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=v("FileSpreadsheet",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=v("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=v("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]),A=[{value:"print",label:"Impressão Direta",icon:q,desc:"Envia direto para a impressora",group:"visualizar"},{value:"pdf",label:"Abrir em PDF",icon:L,desc:"Abre o documento para visualização",group:"visualizar"},{value:"html",label:"Abrir em HTML",icon:_,desc:"Abre em nova aba no navegador",group:"visualizar"},{value:"pdf-download",label:"Download PDF (.pdf)",icon:C,desc:"Salvar arquivo PDF no computador",group:"download"},{value:"docx",label:"Download Word (.docx)",icon:C,desc:"Salvar como documento Word",group:"download"},{value:"csv",label:"Download CSV (.csv)",icon:G,desc:"Planilha compatível com Excel",group:"download"},{value:"html-download",label:"Download HTML (.html)",icon:E,desc:"Salvar página HTML",group:"download"}];function me({open:t,onClose:e,onExport:a,title:o,allowSign:r}){const[l,c]=h.useState("pdf"),[i,s]=h.useState(!1),[d,m]=h.useState(""),x=R();if(!t)return null;const f=l==="pdf"||l==="pdf-download",u=A.filter(p=>p.group==="visualizar"),y=A.filter(p=>p.group==="download"),g={print:"Preparando impressao...",pdf:"Gerando PDF...","pdf-download":"Gerando PDF para download...",docx:"Gerando documento Word...",csv:"Exportando planilha...",html:"Gerando HTML...","html-download":"Gerando HTML para download..."},T=async()=>{const p=i&&f?{signAfterGenerate:!0,signerPassword:d}:void 0;s(!1),m(""),e(),x.showLoading(g[l]||"Processando...");try{await Promise.resolve(a(l,p))}finally{setTimeout(()=>x.hideLoading(),600)}};return n.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:n.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md",children:[n.jsxs("div",{className:"flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700",children:[n.jsxs("h3",{className:"text-lg font-semibold flex items-center gap-2",children:[n.jsx(E,{size:18,className:"text-accent-500"}),o||"Exportar Relatório"]}),n.jsx("button",{onClick:e,className:"p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400",children:n.jsx(M,{size:20})})]}),n.jsxs("div",{className:"p-5 max-h-[60vh] overflow-y-auto",children:[n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Visualizar"}),n.jsx("div",{className:"space-y-1.5 mb-4",children:u.map(p=>{const k=p.icon,b=l===p.value;return n.jsxs("button",{onClick:()=>c(p.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${b?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${b?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(k,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${b?"text-accent-700":"text-gray-800"}`,children:p.label}),n.jsx("p",{className:"text-xs text-gray-400",children:p.desc})]}),b&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(N,{size:12,className:"text-white"})})]},p.value)})}),n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Baixar Arquivo"}),n.jsx("div",{className:"space-y-1.5",children:y.map(p=>{const k=p.icon,b=l===p.value;return n.jsxs("button",{onClick:()=>c(p.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${b?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${b?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(k,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${b?"text-accent-700":"text-gray-800"}`,children:p.label}),n.jsx("p",{className:"text-xs text-gray-400",children:p.desc})]}),b&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(N,{size:12,className:"text-white"})})]},p.value)})})]}),r&&f&&n.jsx("div",{className:"px-5 pb-2",children:n.jsxs("div",{className:"bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-600",children:[n.jsxs("label",{className:"flex items-center gap-2 cursor-pointer",children:[n.jsx("input",{type:"checkbox",checked:i,onChange:p=>s(p.target.checked),className:"w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500"}),n.jsx(H,{size:14,className:"text-accent-500"}),n.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinar ao gerar"})]}),i&&n.jsxs("div",{className:"mt-2",children:[n.jsx("input",{type:"password",value:d,onChange:p=>m(p.target.value),placeholder:"Digite sua senha para assinar",className:"input text-sm"}),n.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"Sua assinatura eletronica sera registrada no documento."})]})]})}),n.jsxs("div",{className:"flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700",children:[n.jsx("button",{onClick:e,className:"btn-secondary flex-1",children:"Cancelar"}),n.jsxs("button",{onClick:T,disabled:i&&f&&!d.trim(),className:"btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50",children:[n.jsx(N,{size:16})," Confirmar"]})]})]})})}function z(t,e){if(!(t!=null&&t.length)){D("Sem dados para exportar");return}const a=Object.keys(t[0]),o=[a.join(";"),...t.map(c=>a.map(i=>'"'+(c[i]??"")+'"').join(";"))].join(`
`),r=new Blob(["\uFEFF"+o],{type:"text/csv;charset=utf-8;"}),l=document.createElement("a");l.href=URL.createObjectURL(r),l.download=e.endsWith(".csv")?e:e+".csv",l.click()}function P(t,e,a=!1){if(a){const o=new Blob([t],{type:"text/html;charset=utf-8;"}),r=document.createElement("a");r.href=URL.createObjectURL(o),r.download=e.endsWith(".html")?e:e+".html",r.click()}else{const o=window.open("","_blank");o&&(o.document.write(t),o.document.close())}}function W(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),e.onload=()=>e.print())}async function $(t,e,a=!1,o){const r="https://transporteescolar-production.up.railway.app",l=localStorage.getItem("token"),c=(e||"documento").replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g,"_");if(l)try{const i={html:t,orientation:"portrait",filename:c,docType:c,docTitle:e};o!=null&&o.signAfterGenerate&&(o!=null&&o.signerPassword)&&(i.signAfterGenerate=!0,i.signerPassword=o.signerPassword);const s=await fetch(`${r}/api/pdf/generate`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${l}`},body:JSON.stringify(i)});if(s.ok){const d=s.headers.get("X-Document-Id")?parseInt(s.headers.get("X-Document-Id")):void 0,m=await s.blob();if(a){const x=document.createElement("a");x.href=URL.createObjectURL(m),x.download=c+".pdf",x.click(),URL.revokeObjectURL(x.href)}else window.open(URL.createObjectURL(m),"_blank");return{documentId:d}}console.warn("PDF server indisponível, usando fallback")}catch{console.warn("PDF server não acessível, usando fallback")}F(async()=>{const{openReportAsPDF:i}=await Promise.resolve().then(()=>se);return{openReportAsPDF:i}},void 0).then(({openReportAsPDF:i})=>{i(t,e)})}function V(t,e){const a='<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:15mm 20mm}body{font-family:Arial,sans-serif;font-size:12pt}table{border-collapse:collapse;width:100%}th{background-color:#1B3A5C;color:white;padding:8px;text-align:left;font-size:10pt}td{border:1px solid #ddd;padding:6px;font-size:10pt}tr:nth-child(even){background-color:#f8f9fa}h1{color:#1B3A5C;font-size:16pt;border-bottom:2px solid #2DB5B0;padding-bottom:5px}</style></head><body>'+t.replace(/<!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head>[\s\S]*?<\/head>/i,"").replace(/<\/?body[^>]*>/gi,"")+"</body></html>",o=new Blob(["\uFEFF"+a],{type:"application/msword"}),r=document.createElement("a");r.href=URL.createObjectURL(o),r.download=e.endsWith(".doc")?e:e+".doc",r.click()}function Z(t){const o=new DOMParser().parseFromString(t,"text/html").querySelector("table");if(!o)return[];const r=[];if(o.querySelectorAll("thead th, tr:first-child th").forEach(s=>{var d;return r.push(((d=s.textContent)==null?void 0:d.trim())||"")}),r.length===0){const s=o.querySelector("tr");s==null||s.querySelectorAll("td, th").forEach(d=>{var m;return r.push(((m=d.textContent)==null?void 0:m.trim())||"")})}const l=[],c=o.querySelectorAll("tbody tr");return(c.length>0?c:o.querySelectorAll("tr")).forEach((s,d)=>{if(d===0&&r.length>0&&!o.querySelector("thead"))return;const m={};s.querySelectorAll("td").forEach((x,f)=>{var u;m[r[f]||`col${f}`]=((u=x.textContent)==null?void 0:u.trim())||""}),Object.keys(m).length>0&&l.push(m)}),l}async function xe(t,e,a,o,r,l){try{switch(t){case"print":W(a);break;case"pdf":await $(a,o,!1,r);break;case"pdf-download":await $(a,o,!0,r);break;case"docx":V(a,o);break;case"csv":if(e!=null&&e.length)z(e,o);else if(a){const c=Z(a);z(c,o)}else D("Sem dados para exportar");break;case"html":P(a,o,!1);break;case"html-download":P(a,o,!0);break}}finally{}}let w=null,S=null;function J(){const{user:t}=U(),e=(t==null?void 0:t.municipalityId)||0,[a,o]=h.useState([]),[r,l]=h.useState(!0);return h.useEffect(()=>{if(!e){l(!1);return}if(S===e&&w){o(w),l(!1);return}l(!0);const c=[];j.municipalities.getById({id:e}).then(async i=>{i&&(i.prefeitoName&&c.push({id:"prefeito",name:i.prefeitoName,role:i.prefeitoCargo||"Prefeito(a) Municipal",cpf:i.prefeitoCpf||"",source:"prefeito"}),i.secretarioName&&c.push({id:"secretario",name:i.secretarioName,role:i.secretarioCargo||"Secretário(a) de Educação",cpf:i.secretarioCpf||"",decree:i.secretarioDecreto||"",source:"secretario"}));try{const s=await j.municipalities.listResponsibles({municipalityId:e});Array.isArray(s)&&s.forEach(d=>{c.push({id:"resp_"+d.id,name:d.name,role:d.role,cpf:d.cpf||"",decree:d.decree||"",source:"responsavel"})})}catch{}try{const s=await j.schools.list({municipalityId:e});Array.isArray(s)&&s.forEach(d=>{d.directorName&&c.push({id:"dir_"+d.id,name:d.directorName,role:"Diretor(a) - "+d.name,source:"diretor"})})}catch{}w=c,S=e,o(c),l(!1)}).catch(()=>{w=c,S=e,o(c),l(!1)})},[e]),{signatories:a,loading:r}}const Y={prefeito:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",secretario:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",responsavel:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",diretor:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"},X={prefeito:"Prefeitura",secretario:"Sec. Educacao",responsavel:"Responsável",diretor:"Escola"};function ge({selected:t,onChange:e,maxSignatories:a=5}){const{signatories:o,loading:r}=J(),[l,c]=h.useState(!1),i=s=>{t.find(m=>m.id===s.id)?e(t.filter(m=>m.id!==s.id)):t.length<a&&e([...t,s])};return r?null:o.length===0?n.jsxs("div",{className:"p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400",children:["Nenhum responsavel cadastrado. Cadastre no menu ",n.jsx("b",{children:"Cadastro da Prefeitura"})," para habilitar assinaturas nos relatorios."]}):n.jsxs("div",{className:"border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden",children:[n.jsxs("button",{type:"button",onClick:()=>c(!l),className:"w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",children:[n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(B,{size:16,className:"text-accent-500"}),n.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinaturas do Relatório"}),t.length>0&&n.jsxs("span",{className:"text-xs bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-full",children:[t.length," selecionado(s)"]})]}),l?n.jsx(I,{size:16,className:"text-gray-400"}):n.jsx(O,{size:16,className:"text-gray-400"})]}),t.length>0&&!l&&n.jsx("div",{className:"px-4 py-2 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-1.5",children:t.map(s=>n.jsxs("span",{className:"text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-2 py-1 rounded-full",children:[s.name," ",n.jsxs("span",{className:"text-accent-400",children:["(",s.role,")"]})]},s.id))}),l&&n.jsx("div",{className:"p-3 border-t border-gray-100 dark:border-gray-600 space-y-1 max-h-64 overflow-y-auto",children:o.map(s=>{const d=t.some(m=>m.id===s.id);return n.jsxs("label",{className:`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${d?"bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700":"hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"}`,children:[n.jsx("input",{type:"checkbox",checked:d,onChange:()=>i(s),className:"rounded text-accent-500 focus:ring-accent-400"}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200 truncate",children:s.name}),n.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 truncate",children:s.role})]}),n.jsx("span",{className:`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${Y[s.source]||""}`,children:X[s.source]||s.source})]},s.id)})})]})}function K(t){if(t.length===0)return"";const e=Math.min(t.length,3),a=t.length<=3?"display:flex;justify-content:space-around;flex-wrap:wrap;gap:30px":`display:grid;grid-template-columns:repeat(${e},1fr);gap:30px`,o=t.map(r=>`
    <div style="text-align:center;min-width:200px;margin-top:60px">
      <div style="border-top:2px solid #333;padding-top:10px;margin:0 5px">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#1B3A5C">${r.name}</p>
        <p style="font-size:10px;color:#555;margin:3px 0 0">${r.role}</p>
        ${r.cpf?'<p style="font-size:9px;color:#888;margin:2px 0 0">CPF: '+r.cpf+"</p>":""}
        ${r.decree?'<p style="font-size:9px;color:#888;margin:1px 0 0">'+r.decree+"</p>":""}
      </div>
    </div>
  `).join("");return`<div style="${a};margin-top:40px;page-break-inside:avoid">${o}</div>`}const Q=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function ee(){const t=new Date;return`${t.getDate()} de ${Q[t.getMonth()]} de ${t.getFullYear()}`}async function te(t,e){const a={name:"",city:"",state:""},o={};try{const r=await e.municipalities.getById({id:t});r&&(a.name=r.name||"",a.city=r.city||"",a.state=r.state||"",a.phone=r.phone||"",a.email=r.email||"",a.logoUrl=r.logoUrl||"",a.cnpj=r.cnpj||"",r.logradouro?a.address=[r.logradouro,r.numero,r.bairro,r.city,r.state].filter(Boolean).join(", "):a.address=r.address||"",o.name=r.secretariaName||"",o.cnpj=r.secretariaCnpj||"",o.secretarioName=r.secretarioName||"",o.secretarioCargo=r.secretarioCargo||"Secretário(a) de Educação",o.phone=r.secretariaPhone||"",o.email=r.secretariaEmail||"",o.address=r.secretariaLogradouro||"")}catch{}return{municipality:a,secretaria:o}}function ae(t,e){const a=e.find(r=>r.id===t);if(!a)return;let o="";try{o=JSON.parse(localStorage.getItem("netescol_school_extra_"+t)||"{}").logoUrl||""}catch{}return{name:a.name||"",code:a.code||"",address:a.address||"",phone:a.phone||"",directorName:a.directorName||"",logoUrl:o}}function oe(t){var y;const e=t.municipality,a=t.secretaria,o=t.school,r=t.fontFamily==="serif"?"'Times New Roman', 'Georgia', serif":"'Segoe UI', Arial, sans-serif",l=t.fontSize||12,c=t.orientation||"portrait",i=t.showDate!==!1,s=t.dateText||`${e.city||""}${e.state?"/"+e.state:""}, ${ee()}.`,d=(y=t.signatories)!=null&&y.length?K(t.signatories):"",m={AC:"Acre",AL:"Alagoas",AP:"Amapa",AM:"Amazonas",BA:"Bahia",CE:"Ceara",DF:"Distrito Federal",ES:"Espirito Santo",GO:"Goias",MA:"Maranhao",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Para",PB:"Paraiba",PR:"Parana",PE:"Pernambuco",PI:"Piaui",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondonia",RR:"Roraima",SC:"Santa Catarina",SP:"Sao Paulo",SE:"Sergipe",TO:"Tocantins"},x=e.state?m[e.state.toUpperCase()]||e.state:"",f=`
    <div class="report-institutional-header">
      <table class="header-table">
        <tr>
          ${e.logoUrl?`<td class="logo-cell"><img src="${e.logoUrl}" class="inst-logo" alt="Brasao"/></td>`:""}
          <td class="info-cell">
            ${x?`<div class="estado-name">ESTADO ${x.toUpperCase().startsWith("D")?"DO ":"DE "}${x.toUpperCase()}</div>`:""}
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
  `,u=[];if(e.name&&e.address?u.push(`${e.name} - ${e.address}`):e.name&&u.push(e.name),a!=null&&a.name){let g=a.name;a.address&&(g+=" - "+a.address),a.phone&&(g+=" | Fone: "+a.phone),u.push(g)}if(e.phone||e.email){const g=[];e.phone&&g.push("Fone: "+e.phone),e.email&&g.push(e.email),u.push(g.join(" | "))}return`<!DOCTYPE html><html lang="pt-br"><head><meta charset="utf-8"><title>${t.title} - NetEscol</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${c==="landscape"?"A4 landscape":"A4"};margin:15mm 20mm}
  body{font-family:${r};font-size:${l}px;color:#1a1a1a;line-height:1.6;margin:0;padding:30px 40px;max-width:900px;margin:0 auto;background:#fff}
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
${f}
<div class="report-title">
  <h1>${t.title}</h1>
  ${t.subtitle?`<div class="subtitle">${t.subtitle}</div>`:""}
</div>
<div class="report-body">
  ${t.content}
</div>
${i?`<div class="report-date">${s}</div>`:""}
<div class="report-bottom-block">
<div class="report-signatures">
${d}
</div>
<div class="report-footer-bar">
  ${u.map(g=>`<div class="footer-line">${g}</div>`).join("")}
  <div class="footer-line footer-brand">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</div>
</div>
</body></html>`}function re(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),setTimeout(()=>e.print(),700))}async function ne(t,e){const a=(e||"relatorio").replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,"_").replace(/_+/g,"_"),o=`<style id="ne-toolbar-css">
#ne-toolbar{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#1B3A5C,#264a6e);padding:8px 16px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.4);font-family:Arial,sans-serif}
#ne-toolbar .t{color:white;font-size:14px;font-weight:bold;margin-right:auto}
#ne-toolbar button{border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px;color:white}
#ne-toolbar button:hover{opacity:0.85}
.bp{background:#e53e3e}.bi{background:#3182ce}.bw{background:#2B579A}
body{padding-top:50px!important}
@media print{#ne-toolbar{display:none!important}body{padding-top:0!important}}
</style>`,r=`<div id="ne-toolbar">
<span class="t">NetEscol - ${a.replace(/_/g," ")}</span>
<button class="bp" onclick="nPdf()">Salvar PDF</button>
<button class="bi" onclick="nPri()">Imprimir</button>
<button class="bw" onclick="nDoc()">Word</button>
</div>`,l=`<script>
function nPri(){document.getElementById('ne-toolbar').style.display='none';setTimeout(function(){window.print();setTimeout(function(){document.getElementById('ne-toolbar').style.display='flex'},500)},100)}
function nPdf(){nPri()}
function nDoc(){var b=document.body.cloneNode(true);var tb=b.querySelector('#ne-toolbar');if(tb)tb.remove();var st=b.querySelector('#ne-toolbar-css');if(st)st.remove();var c=b.innerHTML;var h='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:2cm}body{font-family:Calibri,Arial,sans-serif}</style></head><body>'+c+'</body></html>';var bl=new Blob(['\\uFEFF'+h],{type:'application/msword'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='${a}.doc';document.body.appendChild(a);a.click();document.body.removeChild(a)}
<\/script>`,c=t.replace("</head>",o+"</head>").replace(/<body[^>]*>/i,"$&"+r).replace("</body>",l+"</body>"),i=window.open("","_blank");i&&(i.document.write(c),i.document.close())}const se=Object.freeze(Object.defineProperty({__proto__:null,generateReportHTML:oe,loadMunicipalityData:te,loadSchoolData:ae,openReportAsPDF:ne,printReportHTML:re},Symbol.toStringTag,{value:"Module"}));export{me as E,C as F,H as L,q as P,ge as R,ae as a,G as b,oe as g,xe as h,te as l,re as p};
