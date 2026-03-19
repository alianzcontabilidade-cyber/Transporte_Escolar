// CNPJ Lookup via BrasilAPI (free, no auth required)
export async function lookupCNPJ(cnpj: string): Promise<any> {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) throw new Error('CNPJ invalido');
  try {
    const res = await fetch('https://brasilapi.com.br/api/cnpj/v1/' + clean);
    if (!res.ok) throw new Error('CNPJ nao encontrado');
    const data = await res.json();
    return {
      razaoSocial: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || '',
      cnpj: data.cnpj || clean,
      logradouro: data.logradouro || data.descricao_tipo_de_logradouro ? (data.descricao_tipo_de_logradouro || '') + ' ' + (data.logradouro || '') : '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cep: data.cep ? data.cep.replace(/\D/g, '') : '',
      cidade: data.municipio || '',
      estado: data.uf || '',
      telefone: data.ddd_telefone_1 ? '(' + data.ddd_telefone_1.substring(0, 2) + ') ' + data.ddd_telefone_1.substring(2) : '',
      email: data.email || '',
      situacao: data.descricao_situacao_cadastral || '',
      atividadePrincipal: data.cnae_fiscal_descricao || '',
    };
  } catch (e: any) {
    throw new Error(e.message || 'Erro ao consultar CNPJ');
  }
}

// CEP Lookup via ViaCEP (free, no auth)
export async function lookupCEP(cep: string): Promise<any> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) throw new Error('CEP invalido');
  try {
    const res = await fetch('https://viacep.com.br/ws/' + clean + '/json/');
    if (!res.ok) throw new Error('CEP nao encontrado');
    const data = await res.json();
    if (data.erro) throw new Error('CEP nao encontrado');
    return {
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
      cep: clean,
    };
  } catch (e: any) {
    throw new Error(e.message || 'Erro ao consultar CEP');
  }
}

// CEP mask
export function maskCEP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + '-' + d.slice(5);
}

// National Holidays via BrasilAPI
export async function getHolidays(year: number): Promise<{ date: string; name: string; type: string }[]> {
  try {
    const res = await fetch('https://brasilapi.com.br/api/feriados/v1/' + year);
    if (!res.ok) throw new Error('Erro ao buscar feriados');
    const data = await res.json();
    return data.map((h: any) => ({ date: h.date, name: h.name, type: h.type || 'national' }));
  } catch (e: any) { throw new Error(e.message || 'Erro ao buscar feriados'); }
}

// ISBN Book Lookup via BrasilAPI
export async function lookupISBN(isbn: string): Promise<any> {
  const clean = isbn.replace(/\D/g, '');
  if (clean.length < 10) throw new Error('ISBN inválido');
  try {
    const res = await fetch('https://brasilapi.com.br/api/isbn/v1/' + clean);
    if (!res.ok) throw new Error('ISBN não encontrado');
    const data = await res.json();
    return {
      title: data.title || '',
      authors: data.authors ? data.authors.join(', ') : '',
      publisher: data.publisher || '',
      year: data.year || data.publish_date ? new Date(data.publish_date || '').getFullYear() : null,
      isbn: clean,
      pages: data.page_count || null,
      synopsis: data.synopsis || '',
      cover: data.cover_url || '',
      category: data.subjects ? data.subjects.join(', ') : '',
    };
  } catch (e: any) { throw new Error(e.message || 'Erro ao buscar ISBN'); }
}

// INEP School Lookup via SimCAQ API (UFPR - free, no auth)
export async function lookupINEP(code: string): Promise<any> {
  const clean = code.replace(/\D/g, '');
  if (clean.length < 7) throw new Error('Codigo INEP invalido (minimo 7 digitos)');
  try {
    const res = await fetch('https://simcaq.c3sl.ufpr.br/api/v1/school?filter=id:' + clean);
    if (!res.ok) throw new Error('Escola nao encontrada no INEP');
    const data = await res.json();
    if (!data.result || data.result.length === 0) throw new Error('Escola nao encontrada no INEP');
    // Get the most recent year entry
    const sorted = data.result.sort((a: any, b: any) => (b.year || 0) - (a.year || 0));
    const school = sorted[0];
    return {
      inepCode: String(school.id),
      name: school.name || '',
      stateId: school.state_id || null,
      cityId: school.city_id || null,
      year: school.year || null,
    };
  } catch (e: any) { throw new Error(e.message || 'Erro ao consultar INEP'); }
}

// Search schools by city (IBGE code) via SimCAQ API
export async function searchSchoolsByCity(cityIbgeCode: string | number): Promise<any[]> {
  try {
    const res = await fetch('https://simcaq.c3sl.ufpr.br/api/v1/school?filter=city:' + cityIbgeCode);
    if (!res.ok) throw new Error('Erro ao buscar escolas do municipio');
    const data = await res.json();
    if (!data.result || data.result.length === 0) return [];
    // Group by school id, keep most recent year
    const map = new Map<number, any>();
    for (const s of data.result) {
      const existing = map.get(s.id);
      if (!existing || (s.year || 0) > (existing.year || 0)) {
        map.set(s.id, s);
      }
    }
    return Array.from(map.values()).map(s => ({
      inepCode: String(s.id),
      name: s.name || '',
      stateId: s.state_id || null,
      cityId: s.city_id || null,
      year: s.year || null,
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (e: any) { throw new Error(e.message || 'Erro ao buscar escolas'); }
}

// Bank List via BrasilAPI
export async function getBanks(): Promise<{ code: number; name: string; fullName: string }[]> {
  try {
    const res = await fetch('https://brasilapi.com.br/api/banks/v1');
    if (!res.ok) throw new Error('Erro ao buscar bancos');
    const data = await res.json();
    return data.filter((b: any) => b.code && b.name).map((b: any) => ({
      code: b.code,
      name: b.name || b.fullName || '',
      fullName: b.fullName || b.name || '',
    })).sort((a: any, b: any) => a.code - b.code);
  } catch (e: any) { throw new Error(e.message || 'Erro ao buscar bancos'); }
}
