// INEP School Data - loaded from static JSON file
// Data source: Catálogo de Escolas - INEP/MEC Censo Escolar

interface INEPSchool {
  n: string;  // name
  c: string;  // INEP code
  m: string;  // municipality
  l: string;  // location: U=Urbana, R=Rural
  a: string;  // admin: M=Municipal, E=Estadual, F=Federal, P=Privada
  e: string;  // address
  t: string;  // phone
  la: string; // latitude
  lo: string; // longitude
}

let cachedData: INEPSchool[] | null = null;
let loading = false;
let loadPromise: Promise<INEPSchool[]> | null = null;

async function loadINEPData(): Promise<INEPSchool[]> {
  if (cachedData) return cachedData;
  if (loadPromise) return loadPromise;

  loading = true;
  loadPromise = fetch('/inep-to.json')
    .then(r => r.json())
    .then((data: INEPSchool[]) => {
      cachedData = data;
      loading = false;
      return data;
    })
    .catch(() => {
      loading = false;
      return [];
    });

  return loadPromise;
}

// Search schools by municipality name
export async function searchSchoolsByMunicipality(municipalityName: string): Promise<{
  inepCode: string;
  name: string;
  address: string;
  phone: string;
  admin: string;
  location: string;
  latitude: string;
  longitude: string;
}[]> {
  const data = await loadINEPData();
  const normalized = municipalityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return data
    .filter(s => {
      const mun = s.m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return mun === normalized;
    })
    .map(s => ({
      inepCode: s.c,
      name: s.n,
      address: s.e,
      phone: s.t,
      admin: s.a === 'M' ? 'Municipal' : s.a === 'E' ? 'Estadual' : s.a === 'F' ? 'Federal' : 'Privada',
      location: s.l === 'U' ? 'Urbana' : 'Rural',
      latitude: s.la,
      longitude: s.lo,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Search schools by name (partial match)
export async function searchSchoolsByName(query: string, limit = 20): Promise<{
  inepCode: string;
  name: string;
  municipality: string;
  admin: string;
}[]> {
  const data = await loadINEPData();
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return data
    .filter(s => {
      const name = s.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name.includes(q) || s.c.includes(query);
    })
    .slice(0, limit)
    .map(s => ({
      inepCode: s.c,
      name: s.n,
      municipality: s.m,
      admin: s.a === 'M' ? 'Municipal' : s.a === 'E' ? 'Estadual' : s.a === 'F' ? 'Federal' : 'Privada',
    }));
}

// Get school by INEP code
export async function getSchoolByINEP(code: string): Promise<{
  inepCode: string;
  name: string;
  municipality: string;
  address: string;
  phone: string;
  admin: string;
  location: string;
  latitude: string;
  longitude: string;
} | null> {
  const data = await loadINEPData();
  const school = data.find(s => s.c === code);
  if (!school) return null;

  return {
    inepCode: school.c,
    name: school.n,
    municipality: school.m,
    address: school.e,
    phone: school.t,
    admin: school.a === 'M' ? 'Municipal' : school.a === 'E' ? 'Estadual' : school.a === 'F' ? 'Federal' : 'Privada',
    location: school.l === 'U' ? 'Urbana' : 'Rural',
    latitude: school.la,
    longitude: school.lo,
  };
}

// List all unique municipalities
export async function listINEPMunicipalities(): Promise<string[]> {
  const data = await loadINEPData();
  return [...new Set(data.map(s => s.m))].sort();
}

// Check if data is loaded
export function isINEPDataLoaded(): boolean {
  return cachedData !== null;
}
