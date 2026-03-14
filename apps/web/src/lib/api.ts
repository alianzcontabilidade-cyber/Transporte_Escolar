const API_URL = 'https://transporteescolar-production.up.railway.app';

function getToken() {
  return localStorage.getItem('token');
}

async function call(procedure: string, input: any, type: 'query' | 'mutation' = 'query') {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url: string;
  let options: RequestInit;

  if (type === 'query') {
    const inputParam = encodeURIComponent(JSON.stringify({ '0': { json: input } }));
    url = `${API_URL}/api/trpc/${procedure}?batch=1&input=${inputParam}`;
    options = { method: 'GET', headers };
  } else {
    url = `${API_URL}/api/trpc/${procedure}?batch=1`;
    options = {
      method: 'POST',
      headers,
      body: JSON.stringify({ '0': { json: input } }),
    };
  }

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error('Não foi possível conectar à API. Verifique sua conexão.');
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida da API: ${text.substring(0, 100)}`);
  }

  // tRPC v11 batch response is an array
  const result = Array.isArray(data) ? data[0] : data;

  if (result?.error) {
    const msg =
      result.error?.json?.message ||
      result.error?.data?.message ||
      result.error?.message ||
      JSON.stringify(result.error);
    throw new Error(msg);
  }

  // Handle both tRPC v10 and v11 response formats
  if (result?.result?.data?.json !== undefined) return result.result.data.json;
  if (result?.result?.data !== undefined) return result.result.data;
  if (result?.result !== undefined) return result.result;
  return result;
}

export const api = {
  auth: {
    login: (input: any) => call('auth.login', input, 'mutation'),
    registerMunicipality: (input: any) => call('auth.registerMunicipality', input, 'mutation'),
    me: () => call('auth.me', {}, 'query'),
  },
  municipalities: {
    getDashboardStats: (input: any) => call('municipalities.getDashboardStats', input, 'query'),
  },
  schools: {
    list: (input: any) => call('schools.list', input, 'query'),
    create: (input: any) => call('schools.create', input, 'mutation'),
    delete: (input: any) => call('schools.delete', input, 'mutation'),
  },
  routes: {
    list: (input: any) => call('routes.list', input, 'query'),
    create: (input: any) => call('routes.create', input, 'mutation'),
    delete: (input: any) => call('routes.delete', input, 'mutation'),
  },
  students: {
    list: (input: any) => call('students.list', input, 'query'),
    create: (input: any) => call('students.create', input, 'mutation'),
  },
  drivers: {
    list: (input: any) => call('drivers.list', input, 'query'),
    create: (input: any) => call('drivers.create', input, 'mutation'),
  },
  vehicles: {
    list: (input: any) => call('vehicles.list', input, 'query'),
    create: (input: any) => call('vehicles.create', input, 'mutation'),
  },
  trips: {
    listActive: (input: any) => call('trips.listActive', input, 'query'),
    history: (input: any) => call('trips.history', input, 'query'),
  },
};
