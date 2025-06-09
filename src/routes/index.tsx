import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import StylesShowcase from '../pages/StylesShowcase';
import NotFoundPage from '../pages/NotFoundPage';
import Layout from '../components/Layout';
import AuthLayout from '../components/layout/AuthLayout';
import LoginPage from '../views/auth/LoginPage';
import RegisterPage from '../views/auth/RegisterPage';
import CompanyDashboard from '../views/company/CompanyDashboard';
import UserProfilePage from '../views/company/UserProfilePage';
import CompanyDataPage from '../views/company/CompanyDataPage';
import AgentsPage from '../views/company/AgentsPage';
import UsersPage from '../views/company/UsersPage';
import AnalyticsPage from '../views/company/AnalyticsPage';
import MessagingChannelsPage from '../views/company/MessagingChannelsPage';
import ChatPage from '../views/company/ChatPage';
import AgentDashboard from '../views/agent/AgentDashboard';
import AgentProfilePage from '../views/agent/AgentProfilePage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><App /></Layout>,
  },
  {
    path: "/styles",
    element: <Layout><StylesShowcase /></Layout>,
  },
  // Rutas de autenticación
  {
    path: "/auth",
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "login",
        element: <AuthLayout><LoginPage /></AuthLayout>,
      },
      {
        path: "register",
        element: <AuthLayout><RegisterPage /></AuthLayout>,
      },
      {
        path: "forgot-password",
        element: <AuthLayout><div className="text-center p-5">Recuperar contraseña (próximamente)</div></AuthLayout>,
      },
    ],
  },
  // Redirección de /login a /auth/login para mayor comodidad
  {
    path: "/login",
    element: <Navigate to="/auth/login" replace />,
  },
  // Dashboard y otras rutas protegidas
  {
    path: "/dashboard",
    element: <Navigate to="/company/dashboard" replace />,
  },
  // Rutas de la empresa
  {
    path: "/company",
    children: [
      {
        index: true,
        element: <Navigate to="/company/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <CompanyDashboard />,
      },
      {
        path: "profile",
        element: <UserProfilePage />,
      },
      {
        path: "data",
        element: <CompanyDataPage />,
      },
      {
        path: "agents",
        element: <AgentsPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "messaging",
        element: <MessagingChannelsPage />,
      },
      {
        path: "chat",
        element: <ChatPage />,
      },
      {
        path: "chat-modal",
        element: <ChatPage isEmbedded={true} />,
      },
      {
        path: "training",
        element: <div className="p-5">Capacitación (próximamente)</div>,
      },
    ],
  },
  // Rutas del agente
  {
    path: "/agent",
    children: [
      {
        index: true,
        element: <Navigate to="/agent/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <AgentDashboard />,
      },
      {
        path: "statistics",
        element: <Navigate to="/agent/dashboard" replace />,
      },
      {
        path: "profile",
        element: <AgentProfilePage />,
      },
      {
        path: "profile/edit",
        element: <AgentProfilePage isEditMode={true} />,
      },
    ],
  },
  // Ruta 404 - debe ser la última
  {
    path: "*",
    element: <Layout><NotFoundPage /></Layout>,
  },
]);

export default router;
