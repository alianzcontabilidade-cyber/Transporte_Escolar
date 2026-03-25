import{c as w,r as u,F as P,D as E,j as n,X as T,s as D,_ as R,f as L,b as M,a as k}from"./index-_A_qTKj7.js";import{G as B}from"./globe-BMUVIvLG.js";import{C as j}from"./check-xjmJs5BW.js";import{C as F}from"./chevron-up-BO4KG4JA.js";import{C as U}from"./chevron-down-DcBWNnZ8.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=w("FileDown",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=w("FileSpreadsheet",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=w("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=w("Printer",[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]]),C=[{value:"print",label:"Impressão Direta",icon:O,desc:"Envia direto para a impressora",group:"visualizar"},{value:"pdf",label:"Abrir em PDF",icon:P,desc:"Abre o documento para visualização",group:"visualizar"},{value:"html",label:"Abrir em HTML",icon:B,desc:"Abre em nova aba no navegador",group:"visualizar"},{value:"pdf-download",label:"Download PDF (.pdf)",icon:S,desc:"Salvar arquivo PDF no computador",group:"download"},{value:"docx",label:"Download Word (.docx)",icon:S,desc:"Salvar como documento Word",group:"download"},{value:"csv",label:"Download CSV (.csv)",icon:_,desc:"Planilha compatível com Excel",group:"download"},{value:"html-download",label:"Download HTML (.html)",icon:E,desc:"Salvar página HTML",group:"download"}];function le({open:t,onClose:e,onExport:a,title:r,allowSign:o}){const[i,p]=u.useState("pdf"),[c,s]=u.useState(!1),[d,m]=u.useState("");if(!t)return null;const x=i==="pdf"||i==="pdf-download",f=C.filter(l=>l.group==="visualizar"),g=C.filter(l=>l.group==="download"),h=()=>{a(i,c&&x?{signAfterGenerate:!0,signerPassword:d}:void 0),s(!1),m(""),e()};return n.jsx("div",{className:"fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4",children:n.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md",children:[n.jsxs("div",{className:"flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700",children:[n.jsxs("h3",{className:"text-lg font-semibold flex items-center gap-2",children:[n.jsx(E,{size:18,className:"text-accent-500"}),r||"Exportar Relatorio"]}),n.jsx("button",{onClick:e,className:"p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400",children:n.jsx(T,{size:20})})]}),n.jsxs("div",{className:"p-5 max-h-[60vh] overflow-y-auto",children:[n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Visualizar"}),n.jsx("div",{className:"space-y-1.5 mb-4",children:f.map(l=>{const v=l.icon,b=i===l.value;return n.jsxs("button",{onClick:()=>p(l.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${b?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${b?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(v,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${b?"text-accent-700":"text-gray-800"}`,children:l.label}),n.jsx("p",{className:"text-xs text-gray-400",children:l.desc})]}),b&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(j,{size:12,className:"text-white"})})]},l.value)})}),n.jsx("p",{className:"text-xs font-bold text-gray-400 uppercase tracking-wide mb-2",children:"Baixar Arquivo"}),n.jsx("div",{className:"space-y-1.5",children:g.map(l=>{const v=l.icon,b=i===l.value;return n.jsxs("button",{onClick:()=>p(l.value),className:`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${b?"border-accent-500 bg-accent-50 dark:bg-accent-900/20":"border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50"}`,children:[n.jsx("div",{className:`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${b?"bg-accent-500 text-white":"bg-gray-100 text-gray-500"}`,children:n.jsx(v,{size:16})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:`text-sm font-medium ${b?"text-accent-700":"text-gray-800"}`,children:l.label}),n.jsx("p",{className:"text-xs text-gray-400",children:l.desc})]}),b&&n.jsx("div",{className:"w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0",children:n.jsx(j,{size:12,className:"text-white"})})]},l.value)})})]}),o&&x&&n.jsx("div",{className:"px-5 pb-2",children:n.jsxs("div",{className:"bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-600",children:[n.jsxs("label",{className:"flex items-center gap-2 cursor-pointer",children:[n.jsx("input",{type:"checkbox",checked:c,onChange:l=>s(l.target.checked),className:"w-4 h-4 rounded border-gray-300 text-accent-500 focus:ring-accent-500"}),n.jsx(I,{size:14,className:"text-accent-500"}),n.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinar ao gerar"})]}),c&&n.jsxs("div",{className:"mt-2",children:[n.jsx("input",{type:"password",value:d,onChange:l=>m(l.target.value),placeholder:"Digite sua senha para assinar",className:"input text-sm"}),n.jsx("p",{className:"text-xs text-gray-400 mt-1",children:"Sua assinatura eletronica sera registrada no documento."})]})]})}),n.jsxs("div",{className:"flex gap-3 p-5 border-t border-gray-100 dark:border-gray-700",children:[n.jsx("button",{onClick:e,className:"btn-secondary flex-1",children:"Cancelar"}),n.jsxs("button",{onClick:h,disabled:c&&x&&!d.trim(),className:"btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50",children:[n.jsx(j,{size:16})," Confirmar"]})]})]})})}function A(t,e){if(!(t!=null&&t.length)){D("Sem dados para exportar");return}const a=Object.keys(t[0]),r=[a.join(";"),...t.map(p=>a.map(c=>'"'+(p[c]??"")+'"').join(";"))].join(`
`),o=new Blob(["\uFEFF"+r],{type:"text/csv;charset=utf-8;"}),i=document.createElement("a");i.href=URL.createObjectURL(o),i.download=e.endsWith(".csv")?e:e+".csv",i.click()}function z(t,e,a=!1){if(a){const r=new Blob([t],{type:"text/html;charset=utf-8;"}),o=document.createElement("a");o.href=URL.createObjectURL(r),o.download=e.endsWith(".html")?e:e+".html",o.click()}else{const r=window.open("","_blank");r&&(r.document.write(t),r.document.close())}}function H(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),e.onload=()=>e.print())}async function $(t,e,a=!1,r){const o="https://transporteescolar-production.up.railway.app",i=localStorage.getItem("token"),p=(e||"documento").replace(/[^a-zA-Z0-9\u00C0-\u024F_-]/g,"_");if(i)try{const c={html:t,orientation:"portrait",filename:p,docType:p,docTitle:e};r!=null&&r.signAfterGenerate&&(r!=null&&r.signerPassword);const s=await fetch(`${o}/api/pdf/generate`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify(c)});if(s.ok){const d=s.headers.get("X-Document-Id")?parseInt(s.headers.get("X-Document-Id")):void 0,m=await s.blob();if(a){const x=document.createElement("a");x.href=URL.createObjectURL(m),x.download=p+".pdf",x.click(),URL.revokeObjectURL(x.href)}else window.open(URL.createObjectURL(m),"_blank");return{documentId:d}}console.warn("PDF server indisponível, usando fallback")}catch{console.warn("PDF server não acessível, usando fallback")}R(async()=>{const{openReportAsPDF:c}=await Promise.resolve().then(()=>re);return{openReportAsPDF:c}},void 0).then(({openReportAsPDF:c})=>{c(t,e)})}function q(t,e){const a='<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:15mm 20mm}body{font-family:Arial,sans-serif;font-size:12pt}table{border-collapse:collapse;width:100%}th{background-color:#1B3A5C;color:white;padding:8px;text-align:left;font-size:10pt}td{border:1px solid #ddd;padding:6px;font-size:10pt}tr:nth-child(even){background-color:#f8f9fa}h1{color:#1B3A5C;font-size:16pt;border-bottom:2px solid #2DB5B0;padding-bottom:5px}</style></head><body>'+t.replace(/<!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head>[\s\S]*?<\/head>/i,"").replace(/<\/?body[^>]*>/gi,"")+"</body></html>",r=new Blob(["\uFEFF"+a],{type:"application/msword"}),o=document.createElement("a");o.href=URL.createObjectURL(r),o.download=e.endsWith(".doc")?e:e+".doc",o.click()}function G(t){const r=new DOMParser().parseFromString(t,"text/html").querySelector("table");if(!r)return[];const o=[];if(r.querySelectorAll("thead th, tr:first-child th").forEach(s=>{var d;return o.push(((d=s.textContent)==null?void 0:d.trim())||"")}),o.length===0){const s=r.querySelector("tr");s==null||s.querySelectorAll("td, th").forEach(d=>{var m;return o.push(((m=d.textContent)==null?void 0:m.trim())||"")})}const i=[],p=r.querySelectorAll("tbody tr");return(p.length>0?p:r.querySelectorAll("tr")).forEach((s,d)=>{if(d===0&&o.length>0&&!r.querySelector("thead"))return;const m={};s.querySelectorAll("td").forEach((x,f)=>{var g;m[o[f]||`col${f}`]=((g=x.textContent)==null?void 0:g.trim())||""}),Object.keys(m).length>0&&i.push(m)}),i}async function de(t,e,a,r,o){switch(t){case"print":H(a);break;case"pdf":$(a,r,!1,o);break;case"pdf-download":$(a,r,!0,o);break;case"docx":q(a,r);break;case"csv":if(e!=null&&e.length)A(e,r);else if(a){const i=G(a);A(i,r)}else D("Sem dados para exportar");break;case"html":z(a,r,!1);break;case"html-download":z(a,r,!0);break}}let y=null,N=null;function W(){const{user:t}=M(),e=(t==null?void 0:t.municipalityId)||0,[a,r]=u.useState([]),[o,i]=u.useState(!0);return u.useEffect(()=>{if(!e){i(!1);return}if(N===e&&y){r(y),i(!1);return}i(!0);const p=[];k.municipalities.getById({id:e}).then(async c=>{c&&(c.prefeitoName&&p.push({id:"prefeito",name:c.prefeitoName,role:c.prefeitoCargo||"Prefeito(a) Municipal",cpf:c.prefeitoCpf||"",source:"prefeito"}),c.secretarioName&&p.push({id:"secretario",name:c.secretarioName,role:c.secretarioCargo||"Secretário(a) de Educação",cpf:c.secretarioCpf||"",decree:c.secretarioDecreto||"",source:"secretario"}));try{const s=await k.municipalities.listResponsibles({municipalityId:e});Array.isArray(s)&&s.forEach(d=>{p.push({id:"resp_"+d.id,name:d.name,role:d.role,cpf:d.cpf||"",decree:d.decree||"",source:"responsavel"})})}catch{}try{const s=await k.schools.list({municipalityId:e});Array.isArray(s)&&s.forEach(d=>{d.directorName&&p.push({id:"dir_"+d.id,name:d.directorName,role:"Diretor(a) - "+d.name,source:"diretor"})})}catch{}y=p,N=e,r(p),i(!1)}).catch(()=>{y=p,N=e,r(p),i(!1)})},[e]),{signatories:a,loading:o}}const V={prefeito:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",secretario:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",responsavel:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",diretor:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"},Z={prefeito:"Prefeitura",secretario:"Sec. Educacao",responsavel:"Responsavel",diretor:"Escola"};function pe({selected:t,onChange:e,maxSignatories:a=5}){const{signatories:r,loading:o}=W(),[i,p]=u.useState(!1),c=s=>{t.find(m=>m.id===s.id)?e(t.filter(m=>m.id!==s.id)):t.length<a&&e([...t,s])};return o?null:r.length===0?n.jsxs("div",{className:"p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400",children:["Nenhum responsavel cadastrado. Cadastre no menu ",n.jsx("b",{children:"Cadastro da Prefeitura"})," para habilitar assinaturas nos relatorios."]}):n.jsxs("div",{className:"border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden",children:[n.jsxs("button",{type:"button",onClick:()=>p(!i),className:"w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",children:[n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(L,{size:16,className:"text-accent-500"}),n.jsx("span",{className:"text-sm font-medium text-gray-700 dark:text-gray-300",children:"Assinaturas do Relatorio"}),t.length>0&&n.jsxs("span",{className:"text-xs bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-full",children:[t.length," selecionado(s)"]})]}),i?n.jsx(F,{size:16,className:"text-gray-400"}):n.jsx(U,{size:16,className:"text-gray-400"})]}),t.length>0&&!i&&n.jsx("div",{className:"px-4 py-2 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-1.5",children:t.map(s=>n.jsxs("span",{className:"text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-2 py-1 rounded-full",children:[s.name," ",n.jsxs("span",{className:"text-accent-400",children:["(",s.role,")"]})]},s.id))}),i&&n.jsx("div",{className:"p-3 border-t border-gray-100 dark:border-gray-600 space-y-1 max-h-64 overflow-y-auto",children:r.map(s=>{const d=t.some(m=>m.id===s.id);return n.jsxs("label",{className:`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${d?"bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700":"hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"}`,children:[n.jsx("input",{type:"checkbox",checked:d,onChange:()=>c(s),className:"rounded text-accent-500 focus:ring-accent-400"}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium text-gray-800 dark:text-gray-200 truncate",children:s.name}),n.jsx("p",{className:"text-xs text-gray-500 dark:text-gray-400 truncate",children:s.role})]}),n.jsx("span",{className:`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${V[s.source]||""}`,children:Z[s.source]||s.source})]},s.id)})})]})}function J(t){if(t.length===0)return"";const e=Math.min(t.length,3),a=t.length<=3?"display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px":`display:grid;grid-template-columns:repeat(${e},1fr);gap:20px`,r=t.map(o=>`
    <div style="text-align:center;min-width:180px;margin-top:50px">
      <div style="border-top:1px solid #333;padding-top:8px;margin:0 10px">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#333">${o.name}</p>
        <p style="font-size:10px;color:#666;margin:2px 0 0">${o.role}</p>
        ${o.cpf?'<p style="font-size:9px;color:#999;margin:1px 0 0">CPF: '+o.cpf+"</p>":""}
        ${o.decree?'<p style="font-size:9px;color:#999;margin:1px 0 0">'+o.decree+"</p>":""}
      </div>
    </div>
  `).join("");return`<div style="${a};margin-top:40px;page-break-inside:avoid">${r}</div>`}const Y=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];function X(){const t=new Date;return`${t.getDate()} de ${Y[t.getMonth()]} de ${t.getFullYear()}`}async function K(t,e){const a={name:"",city:"",state:""},r={};try{const o=await e.municipalities.getById({id:t});o&&(a.name=o.name||"",a.city=o.city||"",a.state=o.state||"",a.phone=o.phone||"",a.email=o.email||"",a.logoUrl=o.logoUrl||"",a.cnpj=o.cnpj||"",o.logradouro?a.address=[o.logradouro,o.numero,o.bairro,o.city,o.state].filter(Boolean).join(", "):a.address=o.address||"",r.name=o.secretariaName||"",r.cnpj=o.secretariaCnpj||"",r.secretarioName=o.secretarioName||"",r.secretarioCargo=o.secretarioCargo||"Secretário(a) de Educação",r.phone=o.secretariaPhone||"",r.email=o.secretariaEmail||"",r.address=o.secretariaLogradouro||"")}catch{}return{municipality:a,secretaria:r}}function Q(t,e){const a=e.find(o=>o.id===t);if(!a)return;let r="";try{r=JSON.parse(localStorage.getItem("netescol_school_extra_"+t)||"{}").logoUrl||""}catch{}return{name:a.name||"",code:a.code||"",address:a.address||"",phone:a.phone||"",directorName:a.directorName||"",logoUrl:r}}function ee(t){var h;const e=t.municipality,a=t.secretaria,r=t.school,o=t.fontFamily==="serif"?"'Times New Roman', 'Georgia', serif":"'Segoe UI', Arial, sans-serif",i=t.fontSize||12,p=t.orientation||"portrait",c=t.showDate!==!1,s=t.dateText||`${e.city||""}${e.state?"/"+e.state:""}, ${X()}.`,d=(h=t.signatories)!=null&&h.length?J(t.signatories):"",m={AC:"Acre",AL:"Alagoas",AP:"Amapa",AM:"Amazonas",BA:"Bahia",CE:"Ceara",DF:"Distrito Federal",ES:"Espirito Santo",GO:"Goias",MA:"Maranhao",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Para",PB:"Paraiba",PR:"Parana",PE:"Pernambuco",PI:"Piaui",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondonia",RR:"Roraima",SC:"Santa Catarina",SP:"Sao Paulo",SE:"Sergipe",TO:"Tocantins"},x=e.state?m[e.state.toUpperCase()]||e.state:"",f=`
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
  `,g=[];if(e.name&&e.address?g.push(`${e.name} - ${e.address}`):e.name&&g.push(e.name),a!=null&&a.name){let l=a.name;a.address&&(l+=" - "+a.address),a.phone&&(l+=" | Fone: "+a.phone),g.push(l)}if(e.phone||e.email){const l=[];e.phone&&l.push("Fone: "+e.phone),e.email&&l.push(e.email),g.push(l.join(" | "))}return`<!DOCTYPE html><html lang="pt-br"><head><meta charset="utf-8"><title>${t.title} - NetEscol</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${p==="landscape"?"A4 landscape":"A4"};margin:15mm 20mm}
  body{font-family:${o};font-size:${i}px;color:#1a1a1a;line-height:1.6;margin:0;padding:30px 40px;max-width:900px;margin:0 auto;background:#fff}
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
${c?`<div class="report-date">${s}</div>`:""}
<div class="report-bottom-block">
<div class="report-signatures">
${d}
</div>
<div class="report-footer-bar">
  ${g.map(l=>`<div class="footer-line">${l}</div>`).join("")}
  <div class="footer-line footer-brand">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString("pt-BR")}</div>
</div>
</div>
</body></html>`}function te(t){const e=window.open("","_blank");e&&(e.document.write(t),e.document.close(),setTimeout(()=>e.print(),700))}async function ae(t,e){const a=(e||"relatorio").replace(/[^a-zA-Z0-9\u00C0-\u024F]/g,"_").replace(/_+/g,"_"),r=`<style id="ne-toolbar-css">
#ne-toolbar{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#1B3A5C,#264a6e);padding:8px 16px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.4);font-family:Arial,sans-serif}
#ne-toolbar .t{color:white;font-size:14px;font-weight:bold;margin-right:auto}
#ne-toolbar button{border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px;color:white}
#ne-toolbar button:hover{opacity:0.85}
.bp{background:#e53e3e}.bi{background:#3182ce}.bw{background:#2B579A}
body{padding-top:50px!important}
@media print{#ne-toolbar{display:none!important}body{padding-top:0!important}}
</style>`,o=`<div id="ne-toolbar">
<span class="t">NetEscol - ${a.replace(/_/g," ")}</span>
<button class="bp" onclick="nPdf()">Salvar PDF</button>
<button class="bi" onclick="nPri()">Imprimir</button>
<button class="bw" onclick="nDoc()">Word</button>
</div>`,i=`<script>
function nPri(){document.getElementById('ne-toolbar').style.display='none';setTimeout(function(){window.print();setTimeout(function(){document.getElementById('ne-toolbar').style.display='flex'},500)},100)}
function nPdf(){nPri()}
function nDoc(){var b=document.body.cloneNode(true);var tb=b.querySelector('#ne-toolbar');if(tb)tb.remove();var st=b.querySelector('#ne-toolbar-css');if(st)st.remove();var c=b.innerHTML;var h='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:2cm}body{font-family:Calibri,Arial,sans-serif}</style></head><body>'+c+'</body></html>';var bl=new Blob(['\\uFEFF'+h],{type:'application/msword'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='${a}.doc';document.body.appendChild(a);a.click();document.body.removeChild(a)}
<\/script>`,p=t.replace("</head>",r+"</head>").replace(/<body[^>]*>/i,"$&"+o).replace("</body>",i+"</body>"),c=window.open("","_blank");c&&(c.document.write(p),c.document.close())}const re=Object.freeze(Object.defineProperty({__proto__:null,generateReportHTML:ee,loadMunicipalityData:K,loadSchoolData:Q,openReportAsPDF:ae,printReportHTML:te},Symbol.toStringTag,{value:"Module"}));export{le as E,S as F,I as L,O as P,pe as R,Q as a,_ as b,ee as g,de as h,K as l,te as p};
