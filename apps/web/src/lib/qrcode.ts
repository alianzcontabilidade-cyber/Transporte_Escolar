// Simple QR Code generator using qrserver.com API (no library needed)
export function getQRCodeURL(data: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=svg`;
}

export function printStudentQRCodes(students: any[], appUrl: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>QR Codes - NetEscol</title>
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
  <div class="header"><h1>QR Codes dos Alunos - NetEscol</h1><p>Escaneie para registro de frequencia/embarque</p></div>
  <div class="grid">${students.map(s => {
    const qrData = JSON.stringify({ id: s.id, name: s.name, enrollment: s.enrollment || '' });
    const qrUrl = getQRCodeURL(qrData, 150);
    return `<div class="qr-card"><img src="${qrUrl}" alt="QR ${s.name}"/><h4>${s.name}</h4><p>Mat: ${s.enrollment || '\u2014'}</p><p>${s.grade || ''} ${s.classRoom || ''}</p></div>`;
  }).join('')}</div></body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 1000); }
}
