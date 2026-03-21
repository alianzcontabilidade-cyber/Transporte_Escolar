import { generateReportHTML, loadMunicipalityData, ReportMunicipality, ReportSecretaria } from './reportTemplate';
import { Signatory } from '../components/ReportSignatureSelector';

/**
 * Cache de dados do municipio para evitar refetch
 */
let cachedMunData: { municipality: ReportMunicipality; secretaria: ReportSecretaria } | null = null;
let cachedMunId: number | null = null;

export async function getMunicipalityReport(municipalityId: number, api: any) {
  if (cachedMunId === municipalityId && cachedMunData) return cachedMunData;
  cachedMunData = await loadMunicipalityData(municipalityId, api);
  cachedMunId = municipalityId;
  return cachedMunData;
}

export function clearMunCache() {
  cachedMunData = null;
  cachedMunId = null;
}

/**
 * Gera HTML de relatorio com cabecalho institucional a partir de dados tabulares
 *
 * @param title - Titulo do relatorio (ex: "LISTA DE MOTORISTAS")
 * @param data - Array de objetos com os dados
 * @param cols - Array com nomes das colunas
 * @param munData - Dados do municipio (de getMunicipalityReport)
 * @param opts - Opcoes adicionais
 */
export function buildTableReportHTML(
  title: string,
  data: any[],
  cols: string[],
  munData: { municipality: ReportMunicipality; secretaria: ReportSecretaria } | null,
  opts?: {
    subtitle?: string;
    signatories?: Signatory[];
    orientation?: 'portrait' | 'landscape';
    fontSize?: number;
    summary?: string;
  }
): string {
  if (!data?.length) return '';

  const rows = data.map(row =>
    '<tr>' + Object.values(row).map(v => '<td>' + (v ?? '--') + '</td>').join('') + '</tr>'
  ).join('');

  const content = `
    <table>
      <thead>
        <tr>${cols.map(c => '<th style="text-align:left">' + c + '</th>').join('')}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:12px;font-size:10px;color:#888">Total: ${data.length} registro(s)</p>
    ${opts?.summary ? '<p style="margin-top:8px;font-size:11px;color:#555">' + opts.summary + '</p>' : ''}
  `;

  if (munData) {
    return generateReportHTML({
      municipality: munData.municipality,
      secretaria: munData.secretaria,
      title: title.toUpperCase(),
      subtitle: opts?.subtitle || data.length + ' registro(s)',
      content,
      signatories: opts?.signatories,
      orientation: opts?.orientation || (cols.length > 6 ? 'landscape' : 'portrait'),
      fontSize: opts?.fontSize || 11,
      fontFamily: 'sans-serif',
    });
  }

  // Fallback sem dados do municipio
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:30px;color:#333}h1{color:#1B3A5C;border-bottom:3px solid #2DB5B0;padding-bottom:10px;font-size:18px;text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}th{background:#1B3A5C;color:white;padding:8px 10px;text-align:left}td{padding:6px 10px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f8f9fa}.footer{margin-top:30px;text-align:center;font-size:10px;color:#999}@media print{@page{margin:10mm;size:${opts?.orientation === 'landscape' ? 'A4 landscape' : 'A4'}}}</style>
    </head><body><h1>${title}</h1>${content}<div class="footer">NetEscol - ${new Date().toLocaleDateString('pt-BR')}</div></body></html>`;
}
