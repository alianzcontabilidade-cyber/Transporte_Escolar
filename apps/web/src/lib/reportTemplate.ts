import { Signatory, generateSignaturesHTML } from '../components/ReportSignatureSelector';

export interface ReportMunicipality {
  name: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
}

export interface ReportSecretaria {
  name?: string;
  cnpj?: string;
  secretarioName?: string;
  secretarioCargo?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ReportSchool {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  directorName?: string;
  logoUrl?: string;
}

export interface ReportTemplateOptions {
  municipality: ReportMunicipality;
  secretaria?: ReportSecretaria;
  school?: ReportSchool;
  title: string;
  subtitle?: string;
  content: string;
  signatories?: Signatory[];
  orientation?: 'portrait' | 'landscape';
  fontSize?: number;
  showDate?: boolean;
  dateText?: string;
  fontFamily?: 'serif' | 'sans-serif';
}

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function formatDateBR(): string {
  const d = new Date();
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

// Load municipality + secretaria data from DATABASE
export async function loadMunicipalityData(mid: number, api: any): Promise<{ municipality: ReportMunicipality; secretaria: ReportSecretaria }> {
  const municipality: ReportMunicipality = { name: '', city: '', state: '' };
  const secretaria: ReportSecretaria = {};

  try {
    const m = await api.municipalities.getById({ id: mid });
    if (m) {
      municipality.name = m.name || '';
      municipality.city = m.city || '';
      municipality.state = m.state || '';
      municipality.phone = m.phone || '';
      municipality.email = m.email || '';
      municipality.logoUrl = m.logoUrl || '';
      municipality.cnpj = m.cnpj || '';

      // Address from structured fields (DB) or legacy address field
      if (m.logradouro) {
        municipality.address = [m.logradouro, m.numero, m.bairro, m.city, m.state].filter(Boolean).join(', ');
      } else {
        municipality.address = m.address || '';
      }

      // Secretaria data from DB
      secretaria.name = m.secretariaName || '';
      secretaria.cnpj = m.secretariaCnpj || '';
      secretaria.secretarioName = m.secretarioName || '';
      secretaria.secretarioCargo = m.secretarioCargo || 'Secretário(a) de Educação';
      secretaria.phone = m.secretariaPhone || '';
      secretaria.email = m.secretariaEmail || '';
      secretaria.address = m.secretariaLogradouro || '';
    }
  } catch {}

  return { municipality, secretaria };
}

export function loadSchoolData(schoolId: number, schools: any[]): ReportSchool | undefined {
  const s = schools.find((sc: any) => sc.id === schoolId);
  if (!s) return undefined;
  // Try loading logo from localStorage
  let logoUrl = '';
  try {
    const extra = JSON.parse(localStorage.getItem('netescol_school_extra_' + schoolId) || '{}');
    logoUrl = extra.logoUrl || '';
  } catch {}
  return {
    name: s.name || '',
    code: s.code || '',
    address: s.address || '',
    phone: s.phone || '',
    directorName: s.directorName || '',
    logoUrl,
  };
}

export function generateReportHTML(opts: ReportTemplateOptions): string {
  const m = opts.municipality;
  const sec = opts.secretaria;
  const sch = opts.school;
  const font = opts.fontFamily === 'serif' ? "'Times New Roman', 'Georgia', serif" : "'Segoe UI', Arial, sans-serif";
  const fontSize = opts.fontSize || 12;
  const orientation = opts.orientation || 'portrait';
  const showDate = opts.showDate !== false;
  const dateText = opts.dateText || `${m.city || ''}${m.state ? '/' + m.state : ''}, ${formatDateBR()}.`;

  const sigHTML = opts.signatories?.length ? generateSignaturesHTML(opts.signatories) : '';

  // Estado por extenso
  const estadoNomes: Record<string, string> = {
    AC:'Acre',AL:'Alagoas',AP:'Amapa',AM:'Amazonas',BA:'Bahia',CE:'Ceara',DF:'Distrito Federal',
    ES:'Espirito Santo',GO:'Goias',MA:'Maranhao',MT:'Mato Grosso',MS:'Mato Grosso do Sul',
    MG:'Minas Gerais',PA:'Para',PB:'Paraiba',PR:'Parana',PE:'Pernambuco',PI:'Piaui',
    RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondonia',
    RR:'Roraima',SC:'Santa Catarina',SP:'Sao Paulo',SE:'Sergipe',TO:'Tocantins'
  };
  const estadoNome = m.state ? (estadoNomes[m.state.toUpperCase()] || m.state) : '';

  // Header: brasao | estado + municipio + secretaria | escola
  const headerHTML = `
    <div class="report-institutional-header">
      <table class="header-table">
        <tr>
          ${m.logoUrl ? `<td class="logo-cell"><img src="${m.logoUrl}" class="inst-logo" alt="Brasao"/></td>` : ''}
          <td class="info-cell">
            ${estadoNome ? `<div class="estado-name">ESTADO ${estadoNome.toUpperCase().startsWith('D') ? 'DO ' : 'DE '}${estadoNome.toUpperCase()}</div>` : ''}
            <div class="mun-name">${(m.name || 'PREFEITURA MUNICIPAL').toUpperCase()}</div>
            ${m.cnpj ? `<div class="mun-detail">CNPJ: ${m.cnpj}</div>` : ''}
            ${sec?.name ? `<div class="sec-name">${sec.name.toUpperCase()}</div>` : ''}
            ${sec?.cnpj ? `<div class="mun-detail">CNPJ: ${sec.cnpj}</div>` : ''}
            ${sec?.secretarioName ? `<div class="mun-detail">${sec.secretarioCargo || 'Secretario(a)'}: ${sec.secretarioName}</div>` : ''}
          </td>
          ${sch ? `
            <td class="school-cell">
              ${sch.logoUrl ? `<img src="${sch.logoUrl}" class="school-logo" alt=""/>` : ''}
              <div class="school-name">${sch.name}</div>
              ${sch.code ? `<div class="school-detail">INEP: ${sch.code}</div>` : ''}
              ${sch.address ? `<div class="school-detail">${sch.address}</div>` : ''}
              ${sch.phone ? `<div class="school-detail">Fone: ${sch.phone}</div>` : ''}
            </td>
          ` : ''}
        </tr>
      </table>
      <div class="header-line"></div>
    </div>
  `;

  // Footer
  const footerParts: string[] = [];
  if (m.name && m.address) footerParts.push(`${m.name} - ${m.address}`);
  else if (m.name) footerParts.push(m.name);
  if (sec?.name) {
    let secLine = sec.name;
    if (sec.address) secLine += ' - ' + sec.address;
    if (sec.phone) secLine += ' | Fone: ' + sec.phone;
    footerParts.push(secLine);
  }
  if (m.phone || m.email) {
    const contactParts = [];
    if (m.phone) contactParts.push('Fone: ' + m.phone);
    if (m.email) contactParts.push(m.email);
    footerParts.push(contactParts.join(' | '));
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${opts.title} - NetEscol</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:${orientation === 'landscape' ? 'A4 landscape' : 'A4'};margin:15mm 20mm 15mm 20mm}
  html,body{height:100%;margin:0;padding:0}
  body{font-family:${font};font-size:${fontSize}px;color:#1a1a1a;line-height:1.6;max-width:100%}

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
    body{padding:0;font-size:${fontSize}px}
    .report-institutional-header{margin-bottom:15px}
    .no-print{display:none!important}
  }
  @media screen{
    body{max-width:900px;margin:20px auto;padding:20px 40px;background:#fff;box-shadow:0 0 20px rgba(0,0,0,0.1)}
  }
</style></head><body>
<table class="page-table"><tr><td class="td-content">
${headerHTML}
<div class="report-title">
  <h1>${opts.title}</h1>
  ${opts.subtitle ? `<div class="subtitle">${opts.subtitle}</div>` : ''}
</div>
<div class="report-body">
  ${opts.content}
</div>
${showDate ? `<div class="report-date">${dateText}</div>` : ''}
${sigHTML}
</td></tr><tr><td class="td-footer">
<div class="report-footer-bar">
  ${footerParts.map(l => `<div class="footer-line">${l}</div>`).join('')}
  <div class="footer-line footer-brand">NetEscol - Sistema de Gestão Escolar Municipal | Documento gerado em ${new Date().toLocaleString('pt-BR')}</div>
</div>
</td></tr></table>
</body></html>`;
}

export function printReportHTML(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 700);
  }
}

// Open report in new tab with action toolbar + zoom controls
export async function openReportAsPDF(html: string, filename?: string) {
  const safeName = (filename || 'relatorio').replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_');
  const safeNameClean = safeName.replace(/_+/g, '_');

  // Build a standalone viewer page that embeds the report HTML inside an iframe-like container
  const viewerHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeNameClean} - NetEscol</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:#525659;font-family:Arial,sans-serif;overflow-x:hidden}
#toolbar{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(135deg,#1B3A5C,#264a6e);padding:8px 16px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 12px rgba(0,0,0,0.4)}
#toolbar .title{color:white;font-size:14px;font-weight:bold;margin-right:auto}
#toolbar button{border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px;transition:all 0.15s}
#toolbar button:hover{opacity:0.9}
#toolbar button:disabled{opacity:0.5;cursor:wait}
.b-pdf{background:#e53e3e;color:white}
.b-print{background:#3182ce;color:white}
.b-word{background:#2B579A;color:white}
.b-zoom{background:rgba(255,255,255,0.15);color:white;padding:7px 10px!important;min-width:32px;justify-content:center}
.b-zoom:hover{background:rgba(255,255,255,0.25)!important}
.divider{width:1px;height:24px;background:rgba(255,255,255,0.2);margin:0 4px}
#zlabel{color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;min-width:40px;text-align:center}
#viewer{padding:56px 0 20px;display:flex;justify-content:center}
#page{background:white;width:794px;padding:30px 40px;box-shadow:0 2px 20px rgba(0,0,0,0.3);transform-origin:top center;transition:transform 0.1s ease}
@media print{#toolbar{display:none!important}#viewer{padding:0!important}#page{width:auto!important;max-width:none!important;box-shadow:none!important;transform:none!important;padding:0!important;margin:0!important}}
</style></head><body>
<div id="toolbar">
<span class="title">NetEscol</span>
<button class="b-zoom" onclick="zoomOut()" title="Diminuir">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
</button>
<span id="zlabel">100%</span>
<button class="b-zoom" onclick="zoomIn()" title="Aumentar">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
</button>
<button class="b-zoom" onclick="zoomReset()">100%</button>
<button class="b-zoom" onclick="zoomFit()" title="Ajustar">
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
</button>
<div class="divider"></div>
<button id="btn-pdf" class="b-pdf" onclick="downloadPDF()">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
Baixar PDF</button>
<button class="b-print" onclick="imprimirDoc()">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
Imprimir</button>
<button class="b-word" onclick="downloadWord()">
<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="2" fill="#fff" opacity="0.3"/><text x="12" y="15" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="Arial">W</text></svg>
Word</button>
</div>
<div id="viewer"><div id="page"></div></div>
<script>
var zoom=100;
var reportHTML='';
function setZoom(v){zoom=Math.max(25,Math.min(300,v));document.getElementById('page').style.transform='scale('+(zoom/100)+')';document.getElementById('zlabel').textContent=zoom+'%'}
function zoomIn(){setZoom(zoom+10)}
function zoomOut(){setZoom(zoom-10)}
function zoomReset(){setZoom(100)}
function zoomFit(){var w=window.innerWidth-80;setZoom(Math.min(Math.floor(w/794*100),150))}
function getCleanHTML(){return reportHTML}
function downloadWord(){
var h=getCleanHTML();
var wrap='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="ProgId" content="Word.Document"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:2cm}body{font-family:Calibri,Arial,sans-serif}</style></head><body>'+h+'</body></html>';
var b=new Blob(['\\uFEFF'+wrap],{type:'application/msword'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${safeNameClean}.doc';document.body.appendChild(a);a.click();document.body.removeChild(a)}
function downloadPDF(){
var btn=document.getElementById('btn-pdf');btn.innerHTML='Gerando...';btn.disabled=true;
var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
s.onload=function(){
var pg=document.getElementById('page');pg.style.transform='none';
document.getElementById('toolbar').style.display='none';
html2pdf().set({margin:[10,10,10,10],filename:'${safeNameClean}.pdf',image:{type:'jpeg',quality:0.95},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(pg).save().then(function(){
document.getElementById('toolbar').style.display='flex';setZoom(zoom);
btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar PDF';btn.disabled=false})};
document.head.appendChild(s)}
function imprimirDoc(){
var pg=document.getElementById('page');pg.style.transform='none';
document.getElementById('toolbar').style.display='none';
setTimeout(function(){window.print();setTimeout(function(){document.getElementById('toolbar').style.display='flex';setZoom(zoom)},500)},100)}
window.addEventListener('load',function(){zoomFit()});
</script></body></html>`;

  // Extract just the body content and styles from the report HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const reportCSS = styleMatch ? styleMatch[1] : '';

  // Clean the CSS: remove @media screen rules that would conflict
  const cleanCSS = reportCSS
    .replace(/@media\s+screen\s*\{[\s\S]*?\}\s*\}/g, '')
    .replace(/body\s*\{[^}]*max-width[^}]*\}/g, '');

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(viewerHTML);
    w.document.close();
    // Inject the report content + styles into the #page div after the viewer loads
    const page = w.document.getElementById('page');
    if (page) {
      // Add report styles
      const styleEl = w.document.createElement('style');
      styleEl.textContent = cleanCSS;
      w.document.head.appendChild(styleEl);
      // Set content
      page.innerHTML = bodyContent;
      // Store for Word export
      (w as any).reportHTML = bodyContent;
      // Override getCleanHTML
      const script = w.document.createElement('script');
      script.textContent = 'reportHTML = document.getElementById("page").innerHTML;';
      w.document.body.appendChild(script);
    }
  }
}
