import puppeteer, { Browser } from 'puppeteer';
import { existsSync } from 'fs';

let browser: Browser | null = null;
let launching = false;

function findChromiumPath(): string | undefined {
  // Usar PUPPETEER_EXECUTABLE_PATH se definido
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  // Deixar Puppeteer usar o Chrome bundled (mais confiável)
  return undefined;
}

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) return browser;
  if (launching) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (browser && browser.connected) return browser;
  }

  launching = true;
  try {
    const execPath = findChromiumPath();
    console.log('🖨️ Puppeteer usando:', execPath || 'Chromium bundled');

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--single-process',
      ],
      executablePath: execPath,
    });

    browser.on('disconnected', () => {
      browser = null;
    });

    console.log('🖨️ Puppeteer browser iniciado');
    return browser;
  } finally {
    launching = false;
  }
}

export interface PDFOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'A4' | 'Letter';
  margins?: { top: string; bottom: string; left: string; right: string };
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
}

export async function generatePDF(html: string, options?: PDFOptions): Promise<Buffer> {
  const br = await getBrowser();
  const page = await br.newPage();

  try {
    // Set viewport to A4 width
    await page.setViewport({ width: 794, height: 1123 });

    // Set content with wait for images/fonts
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 15000,
    });

    // Emulate print media for @media print CSS
    await page.emulateMediaType('print');

    const isLandscape = options?.orientation === 'landscape';
    const margins = options?.margins || {
      top: '15mm',
      bottom: '15mm',
      left: '20mm',
      right: '20mm',
    };

    const pdfBuffer = await page.pdf({
      format: (options?.format || 'A4') as any,
      landscape: isLandscape,
      margin: margins,
      printBackground: true,
      displayHeaderFooter: options?.displayHeaderFooter || false,
      headerTemplate: options?.headerTemplate || '',
      footerTemplate: options?.footerTemplate || '',
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {});
  }
}

// Check if Puppeteer is available
export async function isPuppeteerAvailable(): Promise<{ available: boolean; error?: string }> {
  try {
    const br = await getBrowser();
    return { available: br.connected };
  } catch (e: any) {
    return { available: false, error: e.message };
  }
}

// ============================================
// QR CODE + DOCUMENT REGISTRATION
// ============================================
import QRCode from 'qrcode';
import { createHash, randomBytes } from 'crypto';

export function generateVerificationCode(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `NE-${year}-${rand}`;
}

export function computePdfHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function generateQRCodeDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 80,
    margin: 1,
    color: { dark: '#1B3A5C', light: '#ffffff' },
  });
}

export function injectQRCodeIntoHTML(html: string, qrDataURL: string, verificationCode: string, verifyUrl: string): string {
  const qrBlock = `
    <div style="page-break-inside:avoid;margin-top:20px;padding:10px 0;border-top:1px solid #ddd;display:flex;align-items:center;justify-content:space-between;gap:15px">
      <div style="flex:1;font-size:7px;color:#888;line-height:1.4">
        <div style="font-weight:bold;color:#1B3A5C;font-size:8px;margin-bottom:2px">VERIFICAÇÃO DE AUTENTICIDADE</div>
        Documento gerado eletronicamente pelo sistema NetEscol.<br>
        Código de verificação: <b style="color:#1B3A5C">${verificationCode}</b><br>
        Verifique em: <span style="color:#2DB5B0">${verifyUrl}</span><br>
        Conforme Lei nº 14.063/2020 (assinatura eletrônica).
      </div>
      <div style="text-align:center;flex-shrink:0">
        <img src="${qrDataURL}" style="width:70px;height:70px" alt="QR Code"/>
        <div style="font-size:6px;color:#999;margin-top:2px">${verificationCode}</div>
      </div>
    </div>`;

  // Injetar antes do fechamento do </body> ou antes do footer
  if (html.includes('report-footer-bar')) {
    return html.replace(/<div class="report-footer-bar"/, qrBlock + '<div class="report-footer-bar"');
  }
  return html.replace('</body>', qrBlock + '</body>');
}

// Graceful shutdown
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}
