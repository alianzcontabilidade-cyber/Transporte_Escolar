import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import FloatingChat from './components/FloatingChat';
import LoadingOverlay from './components/LoadingOverlay';
import { LoadingProvider } from './lib/loadingContext';

// Paginas criticas (carregamento imediato)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ModulesPage from './pages/ModulesPage';

// Lazy loading - carrega sob demanda quando o usuario navega
const RecoverPasswordPage = lazy(() => import('./pages/RecoverPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RoutesPage = lazy(() => import('./pages/RoutesPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const DriversPage = lazy(() => import('./pages/DriversPage'));
const MonitoresPage = lazy(() => import('./pages/MonitoresPage'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const SchoolsPage = lazy(() => import('./pages/SchoolsPage'));
const MonitorPage = lazy(() => import('./pages/MonitorPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const GuardianPage = lazy(() => import('./pages/GuardianPage'));
const GuardianPortalPage = lazy(() => import('./pages/GuardianPortalPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const AIRoutesPage = lazy(() => import('./pages/AIRoutesPage'));
const PredictivePage = lazy(() => import('./pages/PredictivePage'));
const TrackingPage = lazy(() => import('./pages/TrackingPage'));
const TrackMapPage = lazy(() => import('./pages/TrackMapPage'));
const AcademicYearsPage = lazy(() => import('./pages/AcademicYearsPage'));
const ClassGradesPage = lazy(() => import('./pages/ClassGradesPage'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const TeachersPage = lazy(() => import('./pages/TeachersPage'));
const EnrollmentsPage = lazy(() => import('./pages/EnrollmentsPage'));
const DiaryPage = lazy(() => import('./pages/DiaryPage'));
const HRPage = lazy(() => import('./pages/HRPage'));
const FinancialPage = lazy(() => import('./pages/FinancialPage'));
const MerendaPage = lazy(() => import('./pages/MerendaPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const AssetsPage = lazy(() => import('./pages/AssetsPage'));
const EducacensoPage = lazy(() => import('./pages/EducacensoPage'));
const TransparencyPage = lazy(() => import('./pages/TransparencyPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const WaitingListPage = lazy(() => import('./pages/WaitingListPage'));
const ReportCardPage = lazy(() => import('./pages/ReportCardPage'));
const DescriptiveReportPage = lazy(() => import('./pages/DescriptiveReportPage'));
const StudentTransferPage = lazy(() => import('./pages/StudentTransferPage'));
const StudentCardPage = lazy(() => import('./pages/StudentCardPage'));
const ATAResultsPage = lazy(() => import('./pages/ATAResultsPage'));
const GradeEntryPage = lazy(() => import('./pages/GradeEntryPage'));
const PromotionPage = lazy(() => import('./pages/PromotionPage'));
const AttendanceReportPage = lazy(() => import('./pages/AttendanceReportPage'));
const StudentHistoryPage = lazy(() => import('./pages/StudentHistoryPage'));
const TransportReportPage = lazy(() => import('./pages/TransportReportPage'));
const StudentCertificatesPage = lazy(() => import('./pages/StudentCertificatesPage'));
const UserActivityPage = lazy(() => import('./pages/UserActivityPage'));
const BulkNotifyPage = lazy(() => import('./pages/BulkNotifyPage'));
const PurchaseQuotationPage = lazy(() => import('./pages/PurchaseQuotationPage'));
const ClassSchedulePage = lazy(() => import('./pages/ClassSchedulePage'));
const SystemInfoPage = lazy(() => import('./pages/SystemInfoPage'));
const StudentReportPage = lazy(() => import('./pages/StudentReportPage'));
const SchoolReportPage = lazy(() => import('./pages/SchoolReportPage'));
const ClassRosterPage = lazy(() => import('./pages/ClassRosterPage'));
const DataBackupPage = lazy(() => import('./pages/DataBackupPage'));
const ClassCouncilPage = lazy(() => import('./pages/ClassCouncilPage'));
const StudentOccurrencePage = lazy(() => import('./pages/StudentOccurrencePage'));
const MealStockPage = lazy(() => import('./pages/MealStockPage'));
const VehicleInspectionPage = lazy(() => import('./pages/VehicleInspectionPage'));
const ProtocolPage = lazy(() => import('./pages/ProtocolPage'));
const EventManagementPage = lazy(() => import('./pages/EventManagementPage'));
const DailyBulletinPage = lazy(() => import('./pages/DailyBulletinPage'));
const ReportCenterPage = lazy(() => import('./pages/ReportCenterPage'));
const EnrollmentFormPage = lazy(() => import('./pages/EnrollmentFormPage'));
const MunicipalitySettingsPage = lazy(() => import('./pages/MunicipalitySettingsPage'));
const FormConfigPage = lazy(() => import('./pages/FormConfigPage'));
const IndividualReportPage = lazy(() => import('./pages/IndividualReportPage'));
const SchoolPerformancePage = lazy(() => import('./pages/SchoolPerformancePage'));
const FinalResultsPage = lazy(() => import('./pages/FinalResultsPage'));
const TransportedStudentsPage = lazy(() => import('./pages/TransportedStudentsPage'));
const LowPerformancePage = lazy(() => import('./pages/LowPerformancePage'));
const ClassDiaryReportPage = lazy(() => import('./pages/ClassDiaryReportPage'));
const MileageReportPage = lazy(() => import('./pages/MileageReportPage'));
const FuelReportPage = lazy(() => import('./pages/FuelReportPage'));
const CurriculumReportPage = lazy(() => import('./pages/CurriculumReportPage'));
const SubjectPerformancePage = lazy(() => import('./pages/SubjectPerformancePage'));
const MaintenanceReportPage = lazy(() => import('./pages/MaintenanceReportPage'));
const HRReportPage = lazy(() => import('./pages/HRReportPage'));
const AssetReportPage = lazy(() => import('./pages/AssetReportPage'));
const EducacensoReportPage = lazy(() => import('./pages/EducacensoReportPage'));
const DocumentVerifyPage = lazy(() => import('./pages/DocumentVerifyPage'));
const DocumentManagementPage = lazy(() => import('./pages/DocumentManagementPage'));
const StudentRiskPage = lazy(() => import('./pages/StudentRiskPage'));
const DriverPortalPage = lazy(() => import('./pages/DriverPortalPage'));
const MonitorPortalPage = lazy(() => import('./pages/MonitorPortalPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const ServiceOrdersPage = lazy(() => import('./pages/ServiceOrdersPage'));
const GaragesPage = lazy(() => import('./pages/GaragesPage'));

// Loading fallback
function PageLoader() {
  return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-500" /></div>;
}

function Guard({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const ADMIN = ['super_admin', 'municipal_admin'];
const ADMIN_SEC = ['super_admin', 'municipal_admin', 'secretary'];
const ALL_STAFF = ['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor'];
const DRIVER_MONITOR = ['super_admin', 'municipal_admin', 'driver', 'monitor'];
const ALL_USERS = ['super_admin', 'municipal_admin', 'secretary', 'driver', 'monitor', 'parent'];

// Componente de redirecionamento inteligente por perfil
function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'parent') return <Navigate to="/portal-responsavel" replace />;
  if (user.role === 'driver') return <Navigate to="/portal-motorista" replace />;
  if (user.role === 'monitor') return <Navigate to="/portal-monitor" replace />;
  return <ModulesPage />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <LoadingProvider>
    <>
    <LoadingOverlay />
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/cadastro" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/recuperar-senha" element={user ? <Navigate to="/" replace /> : <RecoverPasswordPage />} />
      <Route path="/transparencia" element={<TransparencyPage />} />
      <Route path="/verificar/:code" element={<Suspense fallback={<PageLoader />}><DocumentVerifyPage /></Suspense>} />

      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<HomeRedirect />} />

        {/* Admin / Secretaria */}
        <Route path="dashboard" element={<Guard roles={ADMIN_SEC}><DashboardPage /></Guard>} />
        <Route path="modulos" element={<Guard roles={ADMIN_SEC}><ModulesPage /></Guard>} />
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

        {/* Módulo Acadêmico */}
        <Route path="anos-letivos" element={<Guard roles={ADMIN_SEC}><AcademicYearsPage /></Guard>} />
        <Route path="series" element={<Guard roles={ADMIN_SEC}><ClassGradesPage /></Guard>} />
        <Route path="disciplinas" element={<Guard roles={ADMIN_SEC}><SubjectsPage /></Guard>} />
        <Route path="turmas" element={<Guard roles={ADMIN_SEC}><ClassesPage /></Guard>} />
        <Route path="professores" element={<Guard roles={ADMIN_SEC}><TeachersPage /></Guard>} />
        <Route path="matriculas" element={<Guard roles={ADMIN_SEC}><EnrollmentsPage /></Guard>} />

        {/* Diário Escolar */}
        <Route path="diario-escolar" element={<Guard roles={ADMIN_SEC}><DiaryPage /></Guard>} />
        {/* Recursos Humanos */}
        <Route path="recursos-humanos" element={<Guard roles={ADMIN}><HRPage /></Guard>} />
        {/* Financeiro */}
        <Route path="financeiro" element={<Guard roles={ADMIN}><FinancialPage /></Guard>} />
        {/* Operacional */}
        <Route path="merenda" element={<Guard roles={ADMIN_SEC}><MerendaPage /></Guard>} />
        <Route path="biblioteca" element={<Guard roles={ADMIN_SEC}><LibraryPage /></Guard>} />
        <Route path="patrimonio" element={<Guard roles={ADMIN}><AssetsPage /></Guard>} />
        <Route path="educacenso" element={<Guard roles={ADMIN}><EducacensoPage /></Guard>} />
        <Route path="calendario" element={<Guard roles={ADMIN_SEC}><CalendarPage /></Guard>} />
        <Route path="comunicacao" element={<Guard roles={ADMIN_SEC}><MessagesPage /></Guard>} />
        <Route path="lista-espera" element={<Guard roles={ADMIN_SEC}><WaitingListPage /></Guard>} />
        <Route path="boletim" element={<Guard roles={ADMIN_SEC}><ReportCardPage /></Guard>} />
        <Route path="parecer-descritivo" element={<Guard roles={ADMIN_SEC}><DescriptiveReportPage /></Guard>} />
        <Route path="remanejamento" element={<Guard roles={ADMIN_SEC}><StudentTransferPage /></Guard>} />
        <Route path="carteirinha" element={<Guard roles={ADMIN_SEC}><StudentCardPage /></Guard>} />
        <Route path="ata-resultados" element={<Guard roles={ADMIN_SEC}><ATAResultsPage /></Guard>} />
        <Route path="lancamento-notas" element={<Guard roles={ADMIN_SEC}><GradeEntryPage /></Guard>} />
        <Route path="promocao" element={<Guard roles={ADMIN_SEC}><PromotionPage /></Guard>} />
        <Route path="relatorio-frequencia" element={<Guard roles={ADMIN_SEC}><AttendanceReportPage /></Guard>} />
        <Route path="historico-escolar" element={<Guard roles={ADMIN_SEC}><StudentHistoryPage /></Guard>} />
        <Route path="relatorio-transporte" element={<Guard roles={ADMIN_SEC}><TransportReportPage /></Guard>} />
        <Route path="declaracoes" element={<Guard roles={ADMIN_SEC}><StudentCertificatesPage /></Guard>} />
        <Route path="atividade-usuarios" element={<Guard roles={ADMIN}><UserActivityPage /></Guard>} />
        <Route path="envio-massa" element={<Guard roles={ADMIN_SEC}><BulkNotifyPage /></Guard>} />
        <Route path="cotacao-compras" element={<Guard roles={ADMIN}><PurchaseQuotationPage /></Guard>} />
        <Route path="grade-horaria" element={<Guard roles={ADMIN_SEC}><ClassSchedulePage /></Guard>} />
        <Route path="ficha-aluno" element={<Guard roles={ADMIN_SEC}><StudentReportPage /></Guard>} />
        <Route path="relatorio-escola" element={<Guard roles={ADMIN_SEC}><SchoolReportPage /></Guard>} />
        <Route path="relacao-alunos-turma" element={<Guard roles={ADMIN_SEC}><ClassRosterPage /></Guard>} />
        <Route path="backup" element={<Guard roles={ADMIN}><DataBackupPage /></Guard>} />
        <Route path="conselho-classe" element={<Guard roles={ADMIN_SEC}><ClassCouncilPage /></Guard>} />
        <Route path="ocorrencias" element={<Guard roles={ADMIN_SEC}><StudentOccurrencePage /></Guard>} />
        <Route path="estoque-merenda" element={<Guard roles={ADMIN_SEC}><MealStockPage /></Guard>} />
        <Route path="vistoria-veiculos" element={<Guard roles={ADMIN_SEC}><VehicleInspectionPage /></Guard>} />
        <Route path="protocolo" element={<Guard roles={ADMIN_SEC}><ProtocolPage /></Guard>} />
        <Route path="eventos" element={<Guard roles={ADMIN_SEC}><EventManagementPage /></Guard>} />
        <Route path="mural" element={<Guard roles={ADMIN_SEC}><DailyBulletinPage /></Guard>} />
        <Route path="central-relatorios" element={<Guard roles={ADMIN_SEC}><ReportCenterPage /></Guard>} />
        <Route path="ficha-matricula" element={<Guard roles={ADMIN_SEC}><EnrollmentFormPage /></Guard>} />
        <Route path="relatorio-individual" element={<Guard roles={ADMIN_SEC}><IndividualReportPage /></Guard>} />
        <Route path="quadro-rendimento" element={<Guard roles={ADMIN_SEC}><SchoolPerformancePage /></Guard>} />
        <Route path="ata-resultados-finais" element={<Guard roles={ADMIN_SEC}><FinalResultsPage /></Guard>} />
        <Route path="alunos-transportados" element={<Guard roles={ADMIN_SEC}><TransportedStudentsPage /></Guard>} />
        <Route path="baixo-rendimento" element={<Guard roles={ADMIN_SEC}><LowPerformancePage /></Guard>} />
        <Route path="diario-classe" element={<Guard roles={ADMIN_SEC}><ClassDiaryReportPage /></Guard>} />
        <Route path="quilometragem" element={<Guard roles={ADMIN_SEC}><MileageReportPage /></Guard>} />
        <Route path="abastecimento" element={<Guard roles={ADMIN_SEC}><FuelReportPage /></Guard>} />
        <Route path="quadro-curricular" element={<Guard roles={ADMIN_SEC}><CurriculumReportPage /></Guard>} />
        <Route path="desempenho-disciplina" element={<Guard roles={ADMIN_SEC}><SubjectPerformancePage /></Guard>} />
        <Route path="relatorio-manutencoes" element={<Guard roles={ADMIN_SEC}><MaintenanceReportPage /></Guard>} />
        <Route path="relatorio-rh" element={<Guard roles={ADMIN_SEC}><HRReportPage /></Guard>} />
        <Route path="relatorio-patrimonio" element={<Guard roles={ADMIN_SEC}><AssetReportPage /></Guard>} />
        <Route path="relatorio-educacenso" element={<Guard roles={ADMIN_SEC}><EducacensoReportPage /></Guard>} />
        <Route path="cadastro-prefeitura" element={<Guard roles={ADMIN}><MunicipalitySettingsPage /></Guard>} />
        <Route path="config-formularios" element={<Guard roles={['super_admin']}><FormConfigPage /></Guard>} />
        <Route path="gestao-documentos" element={<Guard roles={ADMIN}><DocumentManagementPage /></Guard>} />
        <Route path="risco-evasao" element={<Guard roles={ADMIN_SEC}><StudentRiskPage /></Guard>} />
        <Route path="sobre" element={<Guard roles={ALL_USERS}><SystemInfoPage /></Guard>} />
        <Route path="perfil" element={<Guard roles={ALL_USERS}><ProfilePage /></Guard>} />
        <Route path="fornecedores" element={<Guard roles={ADMIN}><SuppliersPage /></Guard>} />
        <Route path="ordens-servico" element={<Guard roles={ADMIN}><ServiceOrdersPage /></Guard>} />
        <Route path="garagens" element={<Guard roles={ADMIN}><GaragesPage /></Guard>} />

        {/* GPS Tracking - Motoristas e Monitores */}
        <Route path="rastreamento" element={<Guard roles={DRIVER_MONITOR}><TrackingPage /></Guard>} />

        {/* Mapa em Tempo Real - Todos os usuarios */}
        <Route path="mapa-tempo-real" element={<Guard roles={ALL_USERS}><TrackMapPage /></Guard>} />

        {/* Portal do Responsavel */}
        <Route path="portal-responsavel" element={<Guard roles={ALL_USERS}><GuardianPortalPage /></Guard>} />
        <Route path="portal-responsavel-antigo" element={<Guard roles={ALL_USERS}><GuardianPage /></Guard>} />

        {/* Portal do Motorista */}
        <Route path="portal-motorista" element={<Guard roles={DRIVER_MONITOR}><DriverPortalPage /></Guard>} />

        {/* Portal do Monitor */}
        <Route path="portal-monitor" element={<Guard roles={DRIVER_MONITOR}><MonitorPortalPage /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    {user && <FloatingChat />}
  </>
  </LoadingProvider>
  );
        }
