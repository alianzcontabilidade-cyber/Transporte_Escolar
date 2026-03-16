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

// Rota protegida com controle de perfil
function Guard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const ADMIN = ['super_admin', 'municipal_admin'];
const ADMIN_OP = ['super_admin', 'municipal_admin', 'operator'];
const ALL_STAFF = ['super_admin', 'municipal_admin', 'operator', 'driver'];

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/cadastro" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Guard roles={ADMIN_OP}><DashboardPage /></Guard>} />
        <Route path="monitor" element={<Guard roles={ALL_STAFF}><MonitorPage /></Guard>} />
        <Route path="rotas" element={<Guard roles={ALL_STAFF}><RoutesPage /></Guard>} />
        <Route path="alunos" element={<Guard roles={ADMIN_OP}><StudentsPage /></Guard>} />
        <Route path="motoristas" element={<Guard roles={ADMIN_OP}><DriversPage /></Guard>} />
        <Route path="monitores" element={<Guard roles={ADMIN_OP}><MonitoresPage /></Guard>} />
        <Route path="veiculos" element={<Guard roles={ADMIN}><VehiclesPage /></Guard>} />
        <Route path="escolas" element={<Guard roles={ADMIN_OP}><SchoolsPage /></Guard>} />
        <Route path="frequencia" element={<Guard roles={ALL_STAFF}><AttendancePage /></Guard>} />
        <Route path="relatorios" element={<Guard roles={ADMIN_OP}><ReportsPage /></Guard>} />
        <Route path="contratos" element={<Guard roles={ADMIN}><ContractsPage /></Guard>} />
        <Route path="portal-responsavel" element={<Guard roles={['super_admin','municipal_admin','guardian']}><GuardianPage /></Guard>} />
        <Route path="super-admin" element={<Guard roles={['super_admin']}><SuperAdminPage /></Guard>} />
        <Route path="ia-rotas" element={<Guard roles={ADMIN}><AIRoutesPage /></Guard>} />
        <Route path="manutencao-preditiva" element={<Guard roles={ADMIN}><PredictivePage /></Guard>} />
        <Route path="configuracoes" element={<Guard roles={ADMIN}><SettingsPage /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
      }
