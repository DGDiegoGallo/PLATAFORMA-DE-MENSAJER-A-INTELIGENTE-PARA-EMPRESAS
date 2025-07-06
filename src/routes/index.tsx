import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// Layouts
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import AgentDashboardLayout from '../components/layout/AgentDashboardLayout';
import AdminDashboardLayout from '../components/layout/AdminDashboardLayout';
import { useAuthContext } from '../contexts/AuthContext';

// Auth Pages
import LoginPage from '../views/auth/LoginPage';
import RegisterPage from '../views/auth/RegisterPage';
import LogoutPage from '../views/auth/LogoutPage';

// Company Pages
import CompanyDashboard from '../views/company/CompanyDashboard';
import CompanyDataPage from '../views/company/CompanyDataPage';
import AgentsPage from '../views/company/AgentsPage';
import UsersPage from '../views/company/UsersPage';
import AnalyticsPage from '../views/company/AnalyticsPage';
import MessagingChannelsPage from '../views/company/MessagingChannelsPage';
import ChatPage from '../views/company/ChatPage';
import SupportPage from '../views/company/SupportPage';
import CryptoWalletPage from '../views/company/CryptoWalletPage';

// Agent Pages
import AgentDashboard from '../views/agent/AgentDashboard';
import AgentProfilePage from '../views/agent/AgentProfilePage';

// Admin Pages
import AdminDashboard from '../views/admin/AdminDashboard';
import AdminCompaniesPage from '../views/admin/CompaniesPage';
import AdminMessagesPage from '../views/admin/MessagesPage';
import AdminUsersPage from '../views/admin/UsersPage';
import AdminDataPage from '../views/admin/AdminDataPage';

// Other Pages
import LandingPage from '../pages/LandingPage';
import NotFoundPage from '../pages/NotFoundPage';
import StylesShowcase from '../pages/StylesShowcase';

// Layout components para envolver las rutas
const CompanyLayout = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

const AgentLayout = () => (
  <AgentDashboardLayout companyName="Mi Empresa">
    <Outlet />
  </AgentDashboardLayout>
);

const AdminLayout = () => {
  const { user } = useAuthContext();
  const userRole = user?.rol || 'user';
  const isAdmin = ['admin', 'superadmin', 'administrator'].includes(userRole);

  if (!isAdmin) {
    return <Navigate to="/company/dashboard" replace />;
  }

  return (
    <AdminDashboardLayout>
      <Outlet />
    </AdminDashboardLayout>
  );
};

// Wrapper para Crypto Wallet que detecta el rol y usa el layout correcto
const CryptoWalletWrapper = () => {
  const { user } = useAuthContext();
  const userRole = user?.rol || 'user';
  
  // Determinar el layout según el rol
  if (['admin', 'superadmin', 'administrator'].includes(userRole)) {
    return (
      <AdminDashboardLayout>
        <CryptoWalletPage />
      </AdminDashboardLayout>
    );
  } else if (userRole === 'agent') {
    return (
      <AgentDashboardLayout companyName="Mi Empresa">
        <CryptoWalletPage />
      </AgentDashboardLayout>
    );
  } else {
    // Para company, cliente, user, etc.
    return (
      <DashboardLayout>
        <CryptoWalletPage />
      </DashboardLayout>
    );
  }
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/styles',
    element: <StylesShowcase />,
  },
  // Redirecciones rápidas
  { path: '/login', element: <Navigate to="/auth/login" replace /> },
  { path: '/register', element: <Navigate to="/auth/register" replace /> },

  /* ====================  AUTH  ==================== */
  {
    path: '/auth',
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', element: <AuthLayout><LoginPage /></AuthLayout> },
      { path: 'register', element: <AuthLayout><RegisterPage /></AuthLayout> },
      { path: 'logout', element: <LogoutPage /> },
    ],
  },

  /* ====================  COMPANY  ==================== */
  { path: '/dashboard', element: <Navigate to="/company/dashboard" replace /> },
  {
    path: '/company',
    element: <CompanyLayout />,
    children: [
      { index: true, element: <Navigate to="/company/dashboard" replace /> },
      { path: 'dashboard', element: <CompanyDashboard /> },
      { path: 'data', element: <CompanyDataPage /> },
      { path: 'agents', element: <AgentsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'messaging', element: <MessagingChannelsPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'support', element: <SupportPage /> },
    ],
  },

  /* ====================  CRYPTO  ==================== */
  { 
    path: '/crypto-wallet', 
    element: <CryptoWalletWrapper /> 
  },

  /* ====================  AGENT  ==================== */
  {
    path: '/agent',
    element: <AgentLayout />,
    children: [
      { index: true, element: <Navigate to="/agent/dashboard" replace /> },
      { path: 'dashboard', element: <AgentDashboard /> },
      { path: 'profile', element: <AgentProfilePage /> },
    ],
  },

  /* ====================  ADMIN  ==================== */
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'companies', element: <AdminCompaniesPage /> },
      { path: 'messages', element: <AdminMessagesPage /> },
      { path: 'statistics', element: <AnalyticsPage /> },
      { path: 'data', element: <AdminDataPage /> },      // <— aquí la nueva página
      { path: 'settings', element: <CompanyDataPage /> },
    ],
  },

  /* ====================  404  ==================== */
  { path: '*', element: <NotFoundPage /> },
]);

export default router;