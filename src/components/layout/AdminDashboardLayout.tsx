import React, { ReactNode } from 'react';
// import Navbar from './Navbar'; // Eliminado porque ya no se usa
import AdminSidebar from './AdminSidebar';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
  return (
    <div className="d-flex flex-column vh-100">
      {/* <Navbar /> Eliminada la navbar para admin */}
      <div className="d-flex flex-grow-1">
        <AdminSidebar />
        <div className="flex-grow-1 p-4 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardLayout; 