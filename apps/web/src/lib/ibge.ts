import { useState, useEffect } from 'react';

// Lista fixa dos 26 estados + DF
export const ESTADOS_BR = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapa' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceara' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espirito Santo' },
  { uf: 'GO', nome: 'Goias' },
  { uf: 'MA', nome: 'Maranhao' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Para' },
  { uf: 'PB', nome: 'Paraiba' },
  { uf: 'PR', nome: 'Parana' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piaui' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondonia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'Sao Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

interface Municipio {
  id: number;
  nome: string;
}

// Cache de municipios por UF para nao buscar repetidamente
const cache: Record<string, Municipio[]> = {};

export function useMunicipios(uf: string) {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uf || uf.length !== 2) {
      setMunicipios([]);
      return;
    }

    const ufUpper = uf.toUpperCase();

    // Usar cache se disponivel
    if (cache[ufUpper]) {
      setMunicipios(cache[ufUpper]);
      return;
    }

    setLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufUpper}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((data: any[]) => {
        const lista = data.map(m => ({ id: m.id, nome: m.nome }));
        cache[ufUpper] = lista;
        setMunicipios(lista);
      })
      .catch(() => setMunicipios([]))
      .finally(() => setLoading(false));
  }, [uf]);

  return { municipios, loading };
}
