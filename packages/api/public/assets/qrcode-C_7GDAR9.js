function i(t,a=200){return`https://api.qrserver.com/v1/create-qr-code/?size=${a}x${a}&data=${encodeURIComponent(t)}&format=svg`}function p(t,a){const d=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR Codes - NetEscol</title>
  <style>
    body{font-family:Arial,sans-serif;padding:20px;margin:0}
    .grid{display:flex;flex-wrap:wrap;gap:20px;justify-content:center}
    .qr-card{width:200px;text-align:center;padding:15px;border:1px solid #ddd;border-radius:12px;page-break-inside:avoid}
    .qr-card img{width:150px;height:150px;margin:10px auto}
    .qr-card h4{margin:5px 0;font-size:13px;color:#1B3A5C}
    .qr-card p{margin:2px 0;font-size:10px;color:#666}
    .header{text-align:center;margin-bottom:20px}
    .header h1{color:#1B3A5C;font-size:20px}
    @media print{.qr-card{border:1px solid #ccc}}
  </style></head><body>
  <div class="header"><h1>QR Codes dos Alunos - NetEscol</h1><p>Escaneie para registro de embarque/desembarque</p></div>
  <div class="grid">${t.map(e=>{const o=e.enrollment||String(e.id);return`<div class="qr-card"><img src="${i(o,150)}" alt="QR ${e.name}"/><h4>${e.name}</h4><p>Mat: ${e.enrollment||"—"}</p><p>${e.grade||""} ${e.classRoom||""}</p></div>`}).join("")}</div></body></html>`,r=window.open("","_blank");r&&(r.document.write(d),r.document.close(),setTimeout(()=>r.print(),1e3))}export{i as getQRCodeURL,p as printStudentQRCodes};
