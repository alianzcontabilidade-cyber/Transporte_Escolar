const API_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return '';
})();

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
    const wrappedInput = JSON.stringify({ json: input });
    url = `${API_URL}/api/trpc/${procedure}?input=${encodeURIComponent(wrappedInput)}`;
    options = { method: 'GET', headers };
  } else {
    url = `${API_URL}/api/trpc/${procedure}`;
    options = { method: 'POST', headers, body: JSON.stringify({ json: input }) };
  }

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error(`Erro de conexão: ${err.message}`);
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do servidor: ${text.substring(0, 200)}`);
  }

  if (data?.error) {
    const msg = data.error?.data?.message || data.error?.message ||
      (data.error?.data?.zodError?.fieldErrors ? 'Dados inválidos: verifique os campos' : JSON.stringify(data.error));
    throw new Error(msg);
  }

  if (data?.result?.data !== undefined) {
    const resultData = data.result.data;
    if (resultData?.json !== undefined) return resultData.json;
    return resultData;
  }
  if (data?.result !== undefined) return data.result;
  return data;
}

export const api = {
  auth: {
    login: (input: any) => call('auth.login', input, 'mutation'),
    registerMunicipality: (input: any) => call('auth.registerMunicipality', input, 'mutation'),
    registerGuardian: (input: any) => call('auth.registerGuardian', input, 'mutation'),
    me: () => call('auth.me', {}, 'query'),
  },
  municipalities: {
    getById: (input: any) => call('municipalities.getById', input, 'query'),
    update: (input: any) => call('municipalities.update', input, 'mutation'),
    getDashboardStats: (input: any) => call('municipalities.getDashboardStats', input, 'query'),
  },
  schools: {
    list: (input: any) => call('schools.list', input, 'query'),
    create: (input: any) => call('schools.create', input, 'mutation'),
    update: (input: any) => call('schools.update', input, 'mutation'),
    delete: (input: any) => call('schools.delete', input, 'mutation'),
  },
  routes: {
    list: (input: any) => call('routes.list', input, 'query'),
    getById: (input: any) => call('routes.getById', input, 'query'),
    create: (input: any) => call('routes.create', input, 'mutation'),
    update: (input: any) => call('routes.update', input, 'mutation'),
    delete: (input: any) => call('routes.delete', input, 'mutation'),
  },
  stops: {
    listByRoute: (input: any) => call('stops.listByRoute', input, 'query'),
    create: (input: any) => call('stops.create', input, 'mutation'),
    update: (input: any) => call('stops.update', input, 'mutation'),
    reorder: (input: any) => call('stops.reorder', input, 'mutation'),
  },
  students: {
    list: (input: any) => call('students.list', input, 'query'),
    create: (input: any) => call('students.create', input, 'mutation'),
    assignToStop: (input: any) => call('students.assignToStop', input, 'mutation'),
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
    getById: (input: any) => call('trips.getById', input, 'query'),
    start: (input: any) => call('trips.start', input, 'mutation'),
    arriveAtStop: (input: any) => call('trips.arriveAtStop', input, 'mutation'),
    complete: (input: any) => call('trips.complete', input, 'mutation'),
    updateLocation: (input: any) => call('trips.updateLocation', input, 'mutation'),
    history: (input: any) => call('trips.history', input, 'query'),
  },
  users: {
    list: (input: any) => call('users.list', input, 'query'),
    create: (input: any) => call('users.create', input, 'mutation'),
    update: (input: any) => call('users.update', input, 'mutation'),
    delete: (input: any) => call('users.delete', input, 'mutation'),
  },
  notifications: {
    list: (input: any) => call('notifications.list', input, 'query'),
    unreadCount: () => call('notifications.unreadCount', {}, 'query'),
    markAsRead: (input: any) => call('notifications.markAsRead', input, 'mutation'),
    markAllAsRead: () => call('notifications.markAllAsRead', {}, 'mutation'),
  },
  guardians: {
    myStudents: () => call('guardians.myStudents', {}, 'query'),
    getStudentActiveTrip: (input: any) => call('guardians.getStudentActiveTrip', input, 'query'),
    addStudent: (input: any) => call('guardians.addStudent', input, 'mutation'),
    studentTripHistory: (input: any) => call('guardians.studentTripHistory', input, 'query'),
  },
  monitors: {
    myActiveTrip: () => call('monitors.myActiveTrip', {}, 'query'),
    availableTrips: () => call('monitors.availableTrips', {}, 'query'),
    boardStudent: (input: any) => call('monitors.boardStudent', input, 'mutation'),
    dropStudent: (input: any) => call('monitors.dropStudent', input, 'mutation'),
    markAbsent: (input: any) => call('monitors.markAbsent', input, 'mutation'),
    tripSummary: (input: any) => call('monitors.tripSummary', input, 'query'),
  },
};
