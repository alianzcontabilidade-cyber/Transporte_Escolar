import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RoutesPage from './pages/RoutesPage';
import StudentsPage from './pages/StudentsPage';
import DriversPage from './pages/DriversPage';
import VehiclesPage from './pages/VehiclesPage';
import SchoolsPage from './pages/SchoolsPage';
import MonitorPage from './pages/MonitorPage';
import ReportsPage from './pages/ReportsPage';

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/cadastro" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="monitor" element={<MonitorPage />} />
        <Route path="rotas" element={<RoutesPage />} />
        <Route path="alunos" element={<StudentsPage />} />
        <Route path="motoristas" element={<DriversPage />} />
        <Route path="veiculos" element={<VehiclesPage />} />
        <Route path="escolas" element={<SchoolsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
