import{l as g,g as f}from"./reportTemplate-ChQY3Phw.js";import"./index-BYXro4c6.js";import"./globe-CB791xMu.js";import"./check-CVwn_gCa.js";import"./chevron-up-CVRu_v5Y.js";import"./chevron-down-DiGXCsBK.js";let r=null,c=null;async function y(i,t){return c===i&&r||(r=await g(i,t),c=i),r}function $(i,t,l,n,e){if(!(t!=null&&t.length))return"";const d=t.map(a=>"<tr>"+Object.values(a).map(m=>"<td>"+(m??"--")+"</td>").join("")+"</tr>").join(""),o=`
    <table>
      <thead>
        <tr>${l.map(a=>'<th style="text-align:left">'+a+"</th>").join("")}</tr>
      </thead>
      <tbody>${d}</tbody>
    </table>
    <p style="margin-top:12px;font-size:10px;color:#888">Total: ${t.length} registro(s)</p>
    ${e!=null&&e.summary?'<p style="margin-top:8px;font-size:11px;color:#555">'+e.summary+"</p>":""}
  `;return n?f({municipality:n.municipality,secretaria:n.secretaria,title:i.toUpperCase(),subtitle:(e==null?void 0:e.subtitle)||t.length+" registro(s)",content:o,signatories:e==null?void 0:e.signatories,orientation:(e==null?void 0:e.orientation)||(l.length>6?"landscape":"portrait"),fontSize:(e==null?void 0:e.fontSize)||11,fontFamily:"sans-serif"}):`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${i}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px;font-size:18px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f8f9fa}.footer{margin-top:30px;text-align:center;font-size:10px;color:#999}@media print{@page{margin:10mm;size:${(e==null?void 0:e.orientation)==="landscape"?"A4 landscape":"A4"}}}</style>
    </head><body><h1>${i}</h1>${o}<div class="footer">NetEscol - ${new Date().toLocaleDateString("pt-BR")}</div></body></html>`}export{$ as buildTableReportHTML,y as getMunicipalityReport};
