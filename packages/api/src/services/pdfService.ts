import puppeteer, { Browser } from 'puppeteer';
import { existsSync } from 'fs';

let browser: Browser | null = null;
let launching = false;

function findChromiumPath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const paths = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
  for (const p of paths) { if (existsSync(p)) return p; }
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

// Graceful shutdown
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}
