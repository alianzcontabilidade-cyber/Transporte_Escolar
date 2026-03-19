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
