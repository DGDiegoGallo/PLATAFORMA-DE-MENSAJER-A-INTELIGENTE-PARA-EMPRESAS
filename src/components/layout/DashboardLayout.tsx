import React, { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import useCompanyStore, { CompanyState } from '../../store/companyStore';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCompany, useCompanyByAgent } from '../../features/company/hooks/useCompany';
import useAuth from '../../features/auth/hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const userRole = user?.rol || user?.role?.name || 'user';
  const isAdmin = ['admin', 'superadmin', 'administrator'].includes(userRole);
  const isAgent = userRole === 'agente';
  const setCompanyName = useCompanyStore((state: CompanyState) => state.setCompanyName);

  // Obtener la empresa según el rol
  const { company: companyFromHook } = useCompany();
  const { company: agentCompanyData } = useCompanyByAgent();
  const company = isAgent ? agentCompanyData : companyFromHook;

  // Sincronizar el nombre de la empresa en el store global
  useEffect(() => {
    if (company && company.name) {
      setCompanyName(company.name);
    }
  }, [company, setCompanyName]);

  // Redireccionar a administrador si el usuario tiene ese rol
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <div className="flex-grow-1 p-4 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
