import{l as f,g as m}from"./reportTemplate-vhhNhg8a.js";import"./index-Ccw7u3kS.js";import"./chevron-up-Bt7ynNB4.js";import"./chevron-down-Ce7acOKQ.js";let n=null,d=null;async function u(r,e){return d===r&&n||(n=await f(r,e),d=r),n}function y(r,e,o,a,t){if(!(e!=null&&e.length))return"";const g=e.map(l=>"<tr>"+Object.values(l).map(h=>{const i=h??"--";return typeof i=="string"&&(i.startsWith("data:image")||i.startsWith("http"))?'<td style="text-align:center"><img src="'+i+'" style="width:35px;height:40px;object-fit:cover;border-radius:4px" /></td>':"<td>"+i+"</td>"}).join("")+"</tr>").join(""),c=`
    <table>
      <thead>
        <tr>${o.map(l=>'<th style="text-align:left">'+l+"</th>").join("")}</tr>
      </thead>
      <tbody>${g}</tbody>
    </table>
    <p style="margin-top:12px;font-size:10px;color:#888">Total: ${e.length} registro(s)</p>
    ${t!=null&&t.summary?'<p style="margin-top:8px;font-size:11px;color:#555">'+t.summary+"</p>":""}
  `;return a?m({municipality:a.municipality,secretaria:a.secretaria,title:r.toUpperCase(),subtitle:(t==null?void 0:t.subtitle)||e.length+" registro(s)",content:c,signatories:t==null?void 0:t.signatories,orientation:(t==null?void 0:t.orientation)||(o.length>6?"landscape":"portrait"),fontSize:(t==null?void 0:t.fontSize)||11,fontFamily:"sans-serif"}):`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${r}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px;font-size:18px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f8f9fa}.footer{margin-top:30px;text-align:center;font-size:10px;color:#999}@media print{@page{margin:10mm;size:${(t==null?void 0:t.orientation)==="landscape"?"A4 landscape":"A4"}}}</style>
    </head><body><h1>${r}</h1>${c}<div class="footer">NetEscol - ${new Date().toLocaleDateString("pt-BR")}</div></body></html>`}export{y as buildTableReportHTML,u as getMunicipalityReport};
