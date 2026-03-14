const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

async function call(procedure: string, input: any, type: 'query' | 'mutation' = 'query') {
  const token = getToken();
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url = `${API_URL}/api/trpc/${procedure}`;
  let options: RequestInit = { headers };

  if (type === 'query') {
    url += `?input=${encodeURIComponent(JSON.stringify(input))}`;
    options.method = 'GET';
  } else {
    options.method = 'POST';
    options.body = JSON.stringify({ json: input });
  }

  const res = await fetch(url, options);
  const data = await res.json();

  if (data?.error) {
    throw new Error(data.error.json?.message || 'Erro na requisição');
  }

  return data?.result?.data?.json ?? data?.result?.data;
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
