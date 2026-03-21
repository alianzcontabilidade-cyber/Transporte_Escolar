import{r as w,j as t,p as x,_ as k,af as N,D as F}from"./index-CoPW3f4y.js";import{F as D,R as L,o as R,b as T}from"./reportTemplate-CpiN_Mep.js";function $(a,p,f,r){return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${a} - NetEscol</title>
  <style>
    *{box-sizing:border-box}
    @page{size:A4;margin:15mm}
    body{font-family:'Segoe UI',Arial,sans-serif;padding:25px 30px;color:#333;max-width:1000px;margin:0 auto;font-size:13px;line-height:1.5}
    .report-header{text-align:center;margin-bottom:25px;padding-bottom:15px;border-bottom:3px solid #2DB5B0}
    .report-header .logo{font-size:22px;font-weight:bold;color:#1B3A5C;letter-spacing:1px}
    .report-header .logo span{color:#2DB5B0}
    .report-header h1{color:#1B3A5C;font-size:18px;margin:8px 0 0;text-transform:uppercase;letter-spacing:0.5px}
    .report-header .subtitle{color:#666;font-size:12px;margin:4px 0 0}
    .report-header .meta{color:#999;font-size:10px;margin:8px 0 0}
    table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;page-break-inside:auto}
    thead{display:table-header-group}
    tr{page-break-inside:avoid}
    th{background:#1B3A5C;color:white;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.3px;white-space:nowrap}
    td{padding:7px 10px;border:1px solid #e5e7eb}
    tr:nth-child(even){background:#f8fafb}
    .card,.rounded-xl,.rounded-2xl,.rounded-lg{border:1px solid #eee;padding:10px;margin:8px 0;border-radius:6px}
    h2,h3{color:#1B3A5C;margin-top:20px}
    .grid{display:grid;gap:8px}
    .grid-cols-2{grid-template-columns:1fr 1fr}
    .grid-cols-3{grid-template-columns:1fr 1fr 1fr}
    .grid-cols-4{grid-template-columns:1fr 1fr 1fr 1fr}
    button,input[type=file],input[type=checkbox],select,.btn-primary,.btn-secondary,.btn-danger,
    .fixed,.sticky,[class*="hover:"],[class*="cursor-"],.animate-pulse,.animate-spin,.animate-bounce,
    [class*="z-50"],[class*="z-40"]{display:none!important}
    .report-footer{margin-top:30px;padding-top:10px;border-top:2px solid #eee;text-align:center;font-size:9px;color:#999}
    .report-footer p{margin:2px 0}
    @media print{
      body{padding:10px 15px;font-size:12px}
      .report-header{margin-bottom:15px;padding-bottom:10px}
      table{font-size:11px}
      th{padding:6px 8px}td{padding:5px 8px}
    }
  </style></head><body>
  <div class="report-header">
    <div class="logo">Net<span>Escol</span></div>
    ${r!=null&&r.municipality?'<div class="subtitle">'+r.municipality+"</div>":""}
    ${r!=null&&r.school?'<div class="subtitle">'+r.school+"</div>":""}
    <h1>${a}</h1>
    ${p?'<div class="subtitle">'+p+"</div>":""}
    <div class="meta">Emitido em ${new Date().toLocaleString("pt-BR")} | Sistema NetEscol v3.0</div>
  </div>
  ${f}
  ${(r==null?void 0:r.signaturesHTML)||""}
  <div class="report-footer">
    <p><b>NetEscol</b> - Sistema de Gestao Escolar Municipal Inteligente</p>
    <p>Documento gerado eletronicamente em ${new Date().toLocaleString("pt-BR")}</p>
  </div>
  </body></html>`}function M({size:a=14}){return t.jsxs("svg",{width:a,height:a,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[t.jsx("rect",{x:"3",y:"2",width:"18",height:"20",rx:"2",fill:"#2B579A"}),t.jsx("text",{x:"12",y:"15",textAnchor:"middle",fill:"white",fontSize:"9",fontWeight:"bold",fontFamily:"Arial",children:"W"})]})}function W({title:a,subtitle:p,children:f,fullData:r,fullDataColumns:h,municipality:v,school:j,hideSignatures:z}){const[s,c]=w.useState(""),[u,B]=w.useState([]),S=()=>{var e;const o=T(u),n=((e=document.getElementById("report-content"))==null?void 0:e.innerHTML)||"";return $(a,p,n,{municipality:v,school:j,signaturesHTML:o})},g=()=>a.replace(/[^a-zA-Z0-9]/g,"_")+"_"+new Date().toISOString().split("T")[0],m=o=>{c(o),setTimeout(async()=>{try{const n=S();if(o==="pdfreal"){await R(n,a),c("");return}if(o==="print"){const e=window.open("","_blank");e?(e.document.write(n),e.document.close(),setTimeout(()=>{e.print(),c("")},700)):c("");return}if(o==="excel"){let e="";if(r&&h)e=h.map(l=>'"'+l.label+'"').join(";")+`
`,r.forEach(l=>{e+=h.map(d=>{let i=l[d.key];return i==null&&(i=""),typeof i=="object"&&(i=JSON.stringify(i)),'"'+String(i).replace(/"/g,'""')+'"'}).join(";")+`
`});else{const l=document.getElementById("report-content"),d=l==null?void 0:l.querySelectorAll("table");d&&d.length>0?d.forEach(i=>{i.querySelectorAll("tr").forEach(A=>{const E=A.querySelectorAll("th, td");e+=Array.from(E).map(C=>'"'+(C.textContent||"").replace(/"/g,'""').trim()+'"').join(";")+`
`}),e+=`
`}):e=a+`
`+(p||"")+`
Sem dados tabulares
`}b(new Blob(["\uFEFF"+e],{type:"text/csv;charset=utf-8;"}),g()+".csv")}else if(o==="html")b(new Blob([n],{type:"text/html;charset=utf-8;"}),g()+".html");else if(o==="doc"){const e=y(n);b(new Blob(["\uFEFF"+e],{type:"application/msword;charset=utf-8;"}),g()+".doc")}else if(o==="docx"){const e=y(n);b(new Blob(["\uFEFF"+e],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}),g()+".docx")}c("")}catch(n){console.error(n),c("")}},100)};function b(o,n){const e=document.createElement("a");e.href=URL.createObjectURL(o),e.download=n,e.click(),URL.revokeObjectURL(e.href)}function y(o){var d,i;const n=((d=o.match(/<body[^>]*>([\s\S]*?)<\/body>/i))==null?void 0:d[1])||o;return`<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="NetEscol">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
  @page { size: A4; margin: 2cm 2cm 2.5cm 2cm; }
  body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 12pt; color: #333; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #999; padding: 5px 8px; }
  th { background-color: #1B3A5C; color: white; font-size: 9pt; }
  .header-line { height: 3px; background: #1B3A5C; margin-top: 10px; }
  .mun-name { font-size: 14pt; font-weight: bold; color: #1B3A5C; text-align: center; }
  .mun-detail { font-size: 8pt; color: #666; text-align: center; }
  .sec-name { font-size: 11pt; font-weight: bold; color: #2DB5B0; text-align: center; }
  .report-footer-bar { text-align: center; font-size: 7pt; color: #999; border-top: 2px solid #ddd; padding-top: 8px; margin-top: 30px; }
  .footer-brand { color: #2DB5B0; font-weight: bold; }
  ${(((i=o.match(/<style[^>]*>([\s\S]*?)<\/style>/i))==null?void 0:i[1])||"").replace(/@media\s+screen\{[^}]+\}/g,"").replace(/@media\s+print\{[^}]+\}/g,"").replace(/display:\s*flex[^;}]*/g,"").replace(/flex[^:]*:[^;}]*/g,"").replace(/gap:[^;}]*/g,"").replace(/border-radius:[^;}]*/g,"").replace(/box-shadow:[^;}]*/g,"").replace(/transition[^;}]*/g,"").replace(/background:\s*linear-gradient[^;}]*/g,"background:#1B3A5C")}
</style>
</head>
<body>
${n}
</body>
</html>`}return t.jsxs("div",{children:[t.jsxs("div",{className:"mb-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3",children:[t.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[t.jsx("span",{className:"text-sm font-medium text-gray-500 mr-1",children:"Gerar relatorio:"}),t.jsxs("button",{onClick:()=>m("pdfreal"),disabled:!!s,className:"flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 font-medium shadow-sm",children:[s==="pdfreal"?t.jsx(x,{size:14,className:"animate-spin"}):t.jsx(D,{size:14})," PDF"]}),t.jsxs("button",{onClick:()=>m("print"),disabled:!!s,className:"flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50",children:[s==="print"?t.jsx(x,{size:14,className:"animate-spin"}):t.jsx(k,{size:14})," Imprimir"]}),t.jsxs("button",{onClick:()=>m("doc"),disabled:!!s,className:"flex items-center gap-1.5 px-3 py-2 text-sm bg-[#2B579A]/10 text-[#2B579A] hover:bg-[#2B579A]/20 rounded-lg transition-colors disabled:opacity-50",children:[s==="doc"?t.jsx(x,{size:14,className:"animate-spin"}):t.jsx(M,{})," Word"]}),t.jsxs("button",{onClick:()=>m("excel"),disabled:!!s,className:"flex items-center gap-1.5 px-3 py-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50",children:[s==="excel"?t.jsx(x,{size:14,className:"animate-spin"}):t.jsx(N,{size:14})," Excel"]}),t.jsxs("button",{onClick:()=>m("html"),disabled:!!s,className:"flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50",children:[s==="html"?t.jsx(x,{size:14,className:"animate-spin"}):t.jsx(F,{size:14})," HTML"]})]}),!z&&t.jsx(L,{selected:u,onChange:B})]}),t.jsx("div",{id:"report-content",children:f})]})}export{W as R};
