import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RoutesPage from './pages/RoutesPage';
import StudentsPage from './pages/StudentsPage';
import DriversPage from './pages/DriversPage';
import MonitoresPage from './pages/MonitoresPage';
import VehiclesPage from './pages/VehiclesPage';
import SchoolsPage from './pages/SchoolsPage';
import MonitorPage from './pages/MonitorPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ContractsPage from './pages/ContractsPage';
import AttendancePage from './pages/AttendancePage';
import GuardianPage from './pages/GuardianPage';
import SuperAdminPage from './pages/SuperAdminPage';
import AIRoutesPage from './pages/AIRoutesPage';
import PredictivePage from './pages/PredictivePage';

function Guard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const ADMIN = ['super_admin', 'municipal_admin'];
const ADMIN_SEC = ['super_admin', 'municipal_admin', 'secretary'];
const ALL_STAFF = ['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor'];
const PARENT = ['parent'];

// Componente de redirecionamento inteligente por perfil
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'parent') return <Navigate to="/portal-responsavel" replace />;
  if (user.role === 'driver' || user.role === 'monitor') return <Navigate to="/monitor" replace />;
  return <DashboardPage />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/cadastro" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />

      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<HomeRedirect />} />

        {/* Admin / Secretaria */}
        <Route path="dashboard" element={<Guard roles={ADMIN_SEC}><DashboardPage /></Guard>} />
        <Route path="monitor" element={<Guard roles={ALL_STAFF}><MonitorPage /></Guard>} />
        <Route path="rotas" element={<Guard roles={ALL_STAFF}><RoutesPage /></Guard>} />
        <Route path="alunos" element={<Guard roles={ADMIN_SEC}><StudentsPage /></Guard>} />
        <Route path="motoristas" element={<Guard roles={ADMIN_SEC}><DriversPage /></Guard>} />
        <Route path="monitores" element={<Guard roles={ADMIN_SEC}><MonitoresPage /></Guard>} />
        <Route path="veiculos" element={<Guard roles={ADMIN}><VehiclesPage /></Guard>} />
        <Route path="escolas" element={<Guard roles={ADMIN_SEC}><SchoolsPage /></Guard>} />
        <Route path="frequencia" element={<Guard roles={ALL_STAFF}><AttendancePage /></Guard>} />
        <Route path="relatorios" element={<Guard roles={ADMIN_SEC}><ReportsPage /></Guard>} />
        <Route path="contratos" element={<Guard roles={ADMIN}><ContractsPage /></Guard>} />
        <Route path="super-admin" element={<Guard roles={['super_admin']}><SuperAdminPage /></Guard>} />
        <Route path="ia-rotas" element={<Guard roles={ADMIN}><AIRoutesPage /></Guard>} />
        <Route path="manutencao-preditiva" element={<Guard roles={ADMIN}><PredictivePage /></Guard>} />
        <Route path="configuracoes" element={<Guard roles={ADMIN}><SettingsPage /></Guard>} />

        {/* Portal do Responsável — acessível para parent e admins */}
        <Route path="portal-responsavel" element={<Guard roles={['super_admin', 'municipal_admin', 'parent']}><GuardianPage /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
