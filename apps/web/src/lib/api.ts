// Detecta ambiente e retorna URL da API
// - Web no Railway: string vazia (mesmo domínio)
// - Capacitor (nativo/emulador): URL completa do Railway
// - Dev local (Vite): string vazia (proxy configurado)
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    const p = window.location.protocol;
    const port = window.location.port;
    // Dev local com Vite (porta 5173/5174/3000) → usa mesmo domínio
    if (h === 'localhost' && port.match(/^(5173|5174|3000)$/)) return '';
    // Railway produção → usa mesmo domínio
    if (h.includes('railway.app') || h.includes('up.railway.app')) return '';
    // Qualquer outro caso (Capacitor, file://, etc) → Railway direto
    return 'https://endearing-radiance-production-b08a.up.railway.app';
  }
  return '';
}
const API_URL = getApiUrl();

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
    const encodedInput = encodeURIComponent(JSON.stringify(input));
    url = `${API_URL}/api/trpc/${procedure}?input=${encodedInput}`;
    options = { method: 'GET', headers };
  } else {
    url = `${API_URL}/api/trpc/${procedure}`;
    options = {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    };
  }

  let res: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Tempo de espera esgotado. Verifique sua conexão.');
    }
    throw new Error(`Erro de conexão: ${err.message}`);
  }

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do servidor: ${text.substring(0, 200)}`);
  }

  // Handle error responses
  if (data?.error) {
    const errData = data.error;
    const msg = errData?.data?.message || errData?.message || 
      (errData?.data?.zodError?.fieldErrors ? 'Dados inválidos: verifique os campos' : JSON.stringify(errData));
    throw new Error(msg);
  }

  // Handle batch response format (array)
  if (Array.isArray(data)) {
    const item = data[0];
    if (item?.error) {
      const errData = item.error;
      const msg = errData?.data?.message || errData?.message || JSON.stringify(errData);
      throw new Error(msg);
    }
    if (item?.result?.data !== undefined) {
      const resultData = item.result.data;
      if (resultData?.json !== undefined) return resultData.json;
      return resultData;
    }
    return item?.result || item;
  }

  // Handle single response format
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
    lookupGuardianByCpf: (input: any) => call('auth.lookupGuardianByCpf', input, 'query'),
    requestPasswordReset: (input: any) => call('auth.requestPasswordReset', input, 'mutation'),
    resetPassword: (input: any) => call('auth.resetPassword', input, 'mutation'),
    changePassword: (input: any) => call('auth.changePassword', input, 'mutation'),
    me: () => call('auth.me', {}, 'query'),
  },
  municipalities: {
    list: () => call('municipalities.list', {}, 'query'),
    globalStats: () => call('municipalities.globalStats', {}, 'query'),
    create: (input: any) => call('municipalities.create', input, 'mutation'),
    toggleActive: (input: any) => call('municipalities.toggleActive', input, 'mutation'),
    getById: (input: any) => call('municipalities.getById', input, 'query'),
    update: (input: any) => call('municipalities.update', input, 'mutation'),
    getDashboardStats: (input: any) => call('municipalities.getDashboardStats', input, 'query'),
    listResponsibles: (input: any) => call('municipalities.listResponsibles', input, 'query'),
    addResponsible: (input: any) => call('municipalities.addResponsible', input, 'mutation'),
    updateResponsible: (input: any) => call('municipalities.updateResponsible', input, 'mutation'),
    removeResponsible: (input: any) => call('municipalities.removeResponsible', input, 'mutation'),
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
    delete: (input: any) => call('stops.delete', input, 'mutation'),
  },
  students: {
    listCartorios: (input: any) => call('students.listCartorios', input, 'query'),
    list: (input: any) => call('students.list', input, 'query'),
    create: (input: any) => call('students.create', input, 'mutation'),
    update: (input: any) => call('students.update', input, 'mutation'),
    delete: (input: any) => call('students.delete', input, 'mutation'),
    assignToStop: (input: any) => call('students.assignToStop', input, 'mutation'),
    bulkImport: (input: any) => call('students.bulkImport', input, 'mutation'),
  },
  studentHistory: {
    list: (input: any) => call('studentHistory.list', input, 'query'),
    create: (input: any) => call('studentHistory.create', input, 'mutation'),
    update: (input: any) => call('studentHistory.update', input, 'mutation'),
    delete: (input: any) => call('studentHistory.delete', input, 'mutation'),
  },
  drivers: {
    list: (input: any) => call('drivers.list', input, 'query'),
    create: (input: any) => call('drivers.create', input, 'mutation'),
    update: (input: any) => call('drivers.update', input, 'mutation'),
    delete: (input: any) => call('drivers.delete', input, 'mutation'),
  },
  vehicles: {
    list: (input: any) => call('vehicles.list', input, 'query'),
    create: (input: any) => call('vehicles.create', input, 'mutation'),
    update: (input: any) => call('vehicles.update', input, 'mutation'),
    delete: (input: any) => call('vehicles.delete', input, 'mutation'),
  },
  fuel: {
    list: (input: any) => call('fuel.list', input, 'query'),
    create: (input: any) => call('fuel.create', input, 'mutation'),
    delete: (input: any) => call('fuel.delete', input, 'mutation'),
  },
  trips: {
    completeAll: (input: any) => call('trips.completeAll', input, 'mutation'),
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
    updateProfile: (input: any) => call('users.updateProfile', input, 'mutation'),
    getProfile: () => call('users.getProfile', {}, 'query'),
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
    studentReportCard: (input: any) => call('guardians.studentReportCard', input, 'query'),
    studentEnrollmentInfo: (input: any) => call('guardians.studentEnrollmentInfo', input, 'query'),
    studentAttendance: (input: any) => call('guardians.studentAttendance', input, 'query'),
    studentParecer: (input: any) => call('guardians.studentParecer', input, 'query'),
    studentOccurrences: (input: any) => call('guardians.studentOccurrences', input, 'query'),
    schoolCalendar: (input: any) => call('guardians.schoolCalendar', input, 'query'),
    schoolMenu: (input: any) => call('guardians.schoolMenu', input, 'query'),
    myMessages: () => call('guardians.myMessages', {}, 'query'),
  },
  monitors: {
    myActiveTrip: () => call('monitors.myActiveTrip', {}, 'query'),
    availableTrips: () => call('monitors.availableTrips', {}, 'query'),
    boardStudent: (input: any) => call('monitors.boardStudent', input, 'mutation'),
    dropStudent: (input: any) => call('monitors.dropStudent', input, 'mutation'),
    markAbsent: (input: any) => call('monitors.markAbsent', input, 'mutation'),
    tripSummary: (input: any) => call('monitors.tripSummary', input, 'query'),
  },

  monitorStaff: {
    list: (input: any) => call('monitorStaff.list', input, 'query'),
    create: (input: any) => call('monitorStaff.create', input, 'mutation'),
    update: (input: any) => call('monitorStaff.update', input, 'mutation'),
    delete: (input: any) => call('monitorStaff.delete', input, 'mutation'),
  },
  contracts: {
    list: (input: any) => call('contracts.list', input, 'query'),
    create: (input: any) => call('contracts.create', input, 'mutation'),
    update: (input: any) => call('contracts.update', input, 'mutation'),
    delete: (input: any) => call('contracts.delete', input, 'mutation'),
  },
  maintenance: {
    list: (input: any) => call('maintenance.list', input, 'query'),
    create: (input: any) => call('maintenance.create', input, 'mutation'),
    update: (input: any) => call('maintenance.update', input, 'mutation'),
    delete: (input: any) => call('maintenance.delete', input, 'mutation'),
  },

      location: {
    getActiveVehicles: (input: any) => call('location.getActiveVehicles', input, 'query'),
    getVehiclePosition: (input: any) => call('location.getVehiclePosition', input, 'query'),
    getHistory: (input: any) => call('location.getHistory', input, 'query'),
  },

  academicYears: {
    list: (input: any) => call('academicYears.list', input, 'query'),
    create: (input: any) => call('academicYears.create', input, 'mutation'),
    update: (input: any) => call('academicYears.update', input, 'mutation'),
    delete: (input: any) => call('academicYears.delete', input, 'mutation'),
  },
  classGrades: {
    list: (input: any) => call('classGrades.list', input, 'query'),
    create: (input: any) => call('classGrades.create', input, 'mutation'),
    update: (input: any) => call('classGrades.update', input, 'mutation'),
    delete: (input: any) => call('classGrades.delete', input, 'mutation'),
  },
  subjects: {
    list: (input: any) => call('subjects.list', input, 'query'),
    create: (input: any) => call('subjects.create', input, 'mutation'),
    update: (input: any) => call('subjects.update', input, 'mutation'),
    delete: (input: any) => call('subjects.delete', input, 'mutation'),
  },
  classes: {
    list: (input: any) => call('classes.list', input, 'query'),
    create: (input: any) => call('classes.create', input, 'mutation'),
    update: (input: any) => call('classes.update', input, 'mutation'),
    delete: (input: any) => call('classes.delete', input, 'mutation'),
  },
  enrollments: {
    list: (input: any) => call('enrollments.list', input, 'query'),
    create: (input: any) => call('enrollments.create', input, 'mutation'),
    bulkCreate: (input: any) => call('enrollments.bulkCreate', input, 'mutation'),
    updateStatus: (input: any) => call('enrollments.updateStatus', input, 'mutation'),
    updateClass: (input: any) => call('enrollments.updateClass', input, 'mutation'),
    delete: (input: any) => call('enrollments.delete', input, 'mutation'),
  },
  teachers: {
    list: (input: any) => call('teachers.list', input, 'query'),
    create: (input: any) => call('teachers.create', input, 'mutation'),
    update: (input: any) => call('teachers.update', input, 'mutation'),
    delete: (input: any) => call('teachers.delete', input, 'mutation'),
  },
  classSubjects: {
    list: (input: any) => call('classSubjects.list', input, 'query'),
    assign: (input: any) => call('classSubjects.assign', input, 'mutation'),
    update: (input: any) => call('classSubjects.update', input, 'mutation'),
    remove: (input: any) => call('classSubjects.remove', input, 'mutation'),
  },
  diaryAttendance: {
    register: (input: any) => call('diaryAttendance.register', input, 'mutation'),
    listByClassDate: (input: any) => call('diaryAttendance.listByClassDate', input, 'query'),
    studentSummary: (input: any) => call('diaryAttendance.studentSummary', input, 'query'),
  },
  assessments: {
    list: (input: any) => call('assessments.list', input, 'query'),
    create: (input: any) => call('assessments.create', input, 'mutation'),
    update: (input: any) => call('assessments.update', input, 'mutation'),
    delete: (input: any) => call('assessments.delete', input, 'mutation'),
  },
  studentGrades: {
    listByAssessment: (input: any) => call('studentGrades.listByAssessment', input, 'query'),
    registerBatch: (input: any) => call('studentGrades.registerBatch', input, 'mutation'),
    reportCard: (input: any) => call('studentGrades.reportCard', input, 'query'),
  },
  lessonPlans: {
    list: (input: any) => call('lessonPlans.list', input, 'query'),
    create: (input: any) => call('lessonPlans.create', input, 'mutation'),
    update: (input: any) => call('lessonPlans.update', input, 'mutation'),
    delete: (input: any) => call('lessonPlans.delete', input, 'mutation'),
  },
  positions: {
    list: (input: any) => call('positions.list', input, 'query'),
    create: (input: any) => call('positions.create', input, 'mutation'),
    update: (input: any) => call('positions.update', input, 'mutation'),
    delete: (input: any) => call('positions.delete', input, 'mutation'),
  },
  departments: {
    list: (input: any) => call('departments.list', input, 'query'),
    create: (input: any) => call('departments.create', input, 'mutation'),
    update: (input: any) => call('departments.update', input, 'mutation'),
    delete: (input: any) => call('departments.delete', input, 'mutation'),
  },
  staffAllocations: {
    list: (input: any) => call('staffAllocations.list', input, 'query'),
    create: (input: any) => call('staffAllocations.create', input, 'mutation'),
    update: (input: any) => call('staffAllocations.update', input, 'mutation'),
    delete: (input: any) => call('staffAllocations.delete', input, 'mutation'),
  },
  staffEvaluations: {
    list: (input: any) => call('staffEvaluations.list', input, 'query'),
    create: (input: any) => call('staffEvaluations.create', input, 'mutation'),
    update: (input: any) => call('staffEvaluations.update', input, 'mutation'),
    delete: (input: any) => call('staffEvaluations.delete', input, 'mutation'),
  },
  financialAccounts: {
    list: (input: any) => call('financialAccounts.list', input, 'query'),
    create: (input: any) => call('financialAccounts.create', input, 'mutation'),
    update: (input: any) => call('financialAccounts.update', input, 'mutation'),
    delete: (input: any) => call('financialAccounts.delete', input, 'mutation'),
  },
  financialTransactions: {
    list: (input: any) => call('financialTransactions.list', input, 'query'),
    create: (input: any) => call('financialTransactions.create', input, 'mutation'),
    delete: (input: any) => call('financialTransactions.delete', input, 'mutation'),
  },
  mealMenus: {
    list: (input: any) => call('mealMenus.list', input, 'query'),
    create: (input: any) => call('mealMenus.create', input, 'mutation'),
    update: (input: any) => call('mealMenus.update', input, 'mutation'),
    delete: (input: any) => call('mealMenus.delete', input, 'mutation'),
  },
  libraryBooks: {
    list: (input: any) => call('libraryBooks.list', input, 'query'),
    create: (input: any) => call('libraryBooks.create', input, 'mutation'),
    update: (input: any) => call('libraryBooks.update', input, 'mutation'),
    delete: (input: any) => call('libraryBooks.delete', input, 'mutation'),
  },
  libraryLoans: {
    list: (input: any) => call('libraryLoans.list', input, 'query'),
    create: (input: any) => call('libraryLoans.create', input, 'mutation'),
    returnBook: (input: any) => call('libraryLoans.returnBook', input, 'mutation'),
  },
  assets: {
    list: (input: any) => call('assets.list', input, 'query'),
    create: (input: any) => call('assets.create', input, 'mutation'),
    update: (input: any) => call('assets.update', input, 'mutation'),
    delete: (input: any) => call('assets.delete', input, 'mutation'),
  },
  inventory: {
    list: (input: any) => call('inventory.list', input, 'query'),
    create: (input: any) => call('inventory.create', input, 'mutation'),
    update: (input: any) => call('inventory.update', input, 'mutation'),
    addMovement: (input: any) => call('inventory.addMovement', input, 'mutation'),
    delete: (input: any) => call('inventory.delete', input, 'mutation'),
  },
  educacenso: {
    summary: (input: any) => call('educacenso.summary', input, 'query'),
    exportSchools: (input: any) => call('educacenso.exportSchools', input, 'query'),
    exportStudents: (input: any) => call('educacenso.exportStudents', input, 'query'),
    exportTeachers: (input: any) => call('educacenso.exportTeachers', input, 'query'),
    exportClasses: (input: any) => call('educacenso.exportClasses', input, 'query'),
  },
  transparency: {
    listMunicipalities: () => call('transparency.listMunicipalities', {}, 'query'),
    publicData: (input: any) => call('transparency.publicData', input, 'query'),
  },
  descriptiveReports: {
    list: (input: any) => call('descriptiveReports.list', input, 'query'),
    save: (input: any) => call('descriptiveReports.save', input, 'mutation'),
  },
  schoolCalendar: {
    list: (input: any) => call('schoolCalendar.list', input, 'query'),
    create: (input: any) => call('schoolCalendar.create', input, 'mutation'),
    update: (input: any) => call('schoolCalendar.update', input, 'mutation'),
    delete: (input: any) => call('schoolCalendar.delete', input, 'mutation'),
    trackingStatus: (input: any) => call('schoolCalendar.trackingStatus', input, 'query'),
    weekStatus: (input: any) => call('schoolCalendar.weekStatus', input, 'query'),
    currentBimester: (input: any) => call('schoolCalendar.currentBimester', input, 'query'),
  },
  messages: {
    list: (input: any) => call('messages.list', input, 'query'),
    create: (input: any) => call('messages.create', input, 'mutation'),
    delete: (input: any) => call('messages.delete', input, 'mutation'),
  },
  waitingList: {
    list: (input: any) => call('waitingList.list', input, 'query'),
    create: (input: any) => call('waitingList.create', input, 'mutation'),
    updateStatus: (input: any) => call('waitingList.updateStatus', input, 'mutation'),
    delete: (input: any) => call('waitingList.delete', input, 'mutation'),
  },
  studentDocuments: {
    list: (input: any) => call('studentDocuments.list', input, 'query'),
    create: (input: any) => call('studentDocuments.create', input, 'mutation'),
    delete: (input: any) => call('studentDocuments.delete', input, 'mutation'),
  },
  formConfig: {
    list: (input: any) => call('formConfig.list', input, 'query'),
    save: (input: any) => call('formConfig.save', input, 'mutation'),
  },
  studentOccurrences: {
    list: (input: any) => call('studentOccurrences.list', input, 'query'),
    create: (input: any) => call('studentOccurrences.create', input, 'mutation'),
    update: (input: any) => call('studentOccurrences.update', input, 'mutation'),
    delete: (input: any) => call('studentOccurrences.delete', input, 'mutation'),
  },
  events: {
    list: (input: any) => call('events.list', input, 'query'),
    create: (input: any) => call('events.create', input, 'mutation'),
    update: (input: any) => call('events.update', input, 'mutation'),
    delete: (input: any) => call('events.delete', input, 'mutation'),
  },
  quotations: {
    list: (input: any) => call('quotations.list', input, 'query'),
    getById: (input: any) => call('quotations.getById', input, 'query'),
    create: (input: any) => call('quotations.create', input, 'mutation'),
    update: (input: any) => call('quotations.update', input, 'mutation'),
    delete: (input: any) => call('quotations.delete', input, 'mutation'),
  },
  quotationItems: {
    list: (input: any) => call('quotationItems.list', input, 'query'),
    create: (input: any) => call('quotationItems.create', input, 'mutation'),
    update: (input: any) => call('quotationItems.update', input, 'mutation'),
    delete: (input: any) => call('quotationItems.delete', input, 'mutation'),
  },
  classCouncil: {
    list: (input: any) => call('classCouncil.list', input, 'query'),
    save: (input: any) => call('classCouncil.save', input, 'mutation'),
  },
  vehicleInspections: {
    list: (input: any) => call('vehicleInspections.list', input, 'query'),
    listByVehicle: (input: any) => call('vehicleInspections.listByVehicle', input, 'query'),
    create: (input: any) => call('vehicleInspections.create', input, 'mutation'),
    delete: (input: any) => call('vehicleInspections.delete', input, 'mutation'),
  },
  documents: {
    list: (input: any) => call('documents.list', input, 'query'),
    revoke: (input: any) => call('documents.revoke', input, 'mutation'),
  },
  documentSignatures: {
    sign: (input: any) => call('documentSignatures.sign', input, 'mutation'),
    listByDocument: (input: any) => call('documentSignatures.listByDocument', input, 'query'),
    verifySignature: (input: any) => call('documentSignatures.verifySignature', input, 'query'),
  },

  ai: {
    analyzeRoutes: (input: any) => call('ai.analyzeRoutes', input, 'query'),
    optimizeRoute: (input: any) => call('ai.optimizeRoute', input, 'mutation'),
    suggestStops: (input: any) => call('ai.suggestStops', input, 'query'),
    studentRiskAnalysis: (input: any) => call('ai.studentRiskAnalysis', input, 'query'),
  },

  chat: {
    conversations: () => call('chat.conversations', {}, 'query'),
    history: (input: any) => call('chat.history', input, 'query'),
    send: (input: any) => call('chat.send', input, 'mutation'),
    unreadTotal: () => call('chat.unreadTotal', {}, 'query'),
    availableContacts: (input: any) => call('chat.availableContacts', input, 'query'),
    markRead: (input: any) => call('chat.markRead', input, 'mutation'),
  },

  classSchedules: {
    get: (input: any) => call('classSchedules.get', input, 'query'),
    save: (input: any) => call('classSchedules.save', input, 'mutation'),
  },

  bulletins: {
    list: (input: any) => call('bulletins.list', input, 'query'),
    create: (input: any) => call('bulletins.create', input, 'mutation'),
    togglePin: (input: any) => call('bulletins.togglePin', input, 'mutation'),
    delete: (input: any) => call('bulletins.delete', input, 'mutation'),
  },

  protocols: {
    list: (input: any) => call('protocols.list', input, 'query'),
    create: (input: any) => call('protocols.create', input, 'mutation'),
    updateStatus: (input: any) => call('protocols.updateStatus', input, 'mutation'),
    addResponse: (input: any) => call('protocols.addResponse', input, 'mutation'),
  },

  backup: {
    stats: (input: any) => call('backup.stats', input, 'query'),
    exportAll: (input: any) => call('backup.exportAll', input, 'mutation'),
  },

};
