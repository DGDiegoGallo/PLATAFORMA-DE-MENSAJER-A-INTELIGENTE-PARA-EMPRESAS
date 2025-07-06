import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaUserCog, 
  FaUsers,
  FaBriefcase,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
  FaComments,
  FaDatabase,
  FaWallet
} from 'react-icons/fa';
import './Sidebar.css';
import useAuth from '../../features/auth/hooks/useAuth';

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  isActive: boolean;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, to, isActive, collapsed = false }) => {
  return (
    <Link 
      to={to} 
      className={`d-flex align-items-center py-3 ${collapsed ? 'justify-content-center px-2' : 'px-3'} text-decoration-none ${isActive ? 'fw-bold' : 'fw-normal'}`}
      style={{ 
        color: isActive ? '#000000' : '#767179',
        backgroundColor: isActive ? '#EBEBEB' : 'transparent',
        borderRadius: '4px',
        transition: 'all 0.2s ease'
      }}
      title={collapsed ? text : ''}
    >
      <div className={collapsed ? '' : 'me-3'} style={{ color: isActive ? '#F44123' : '#484847' }}>
        {icon}
      </div>
      {!collapsed && <span>{text}</span>}
    </Link>
  );
};

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  
  const adminSidebarItems = [
    { icon: <FaUserCog size={18} />, text: 'Panel de Administración', path: '/admin/dashboard' },
    { icon: <FaUsers size={18} />, text: 'Gestión de Usuarios', path: '/admin/users' },
    { icon: <FaBriefcase size={18} />, text: 'Gestión de Empresas', path: '/admin/companies' },
    { icon: <FaComments size={18} />, text: 'Gestión de Mensajes', path: '/admin/messages' },
    // { icon: <FaChartLine size={18} />, text: 'Estadísticas Globales', path: '/admin/statistics' },
    { icon: <FaDatabase size={18} />, text: 'Gestión de Datos', path: '/admin/data' },
    { icon: <FaWallet size={18} />, text: 'Crypto Wallet', path: '/crypto-wallet' },
    // { icon: <FaCog size={18} />, text: 'Configuración', path: '/admin/settings' },
  ];

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="h-100 d-flex flex-column border-end position-relative" style={{ 
      borderColor: '#EBC2BB', 
      width: collapsed ? '70px' : '220px', 
      backgroundColor: '#FFFFFF',
      transition: 'width 0.3s ease'
    }}>
      {/* Botón para contraer/expandir */}
      <button 
        className="sidebar-toggle-btn"
        onClick={toggleCollapse}
        aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        style={{
          left: collapsed ? '55px' : '205px'
        }}
      >
        {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
      </button>

      {/* Admin Header */}
      <div className="p-3 border-bottom" style={{ borderColor: '#EBC2BB' }}>
        <div className="d-flex align-items-center justify-content-center">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#EBEBEB',
              color: '#484847',
              marginRight: collapsed ? '0' : '12px'
            }}
          >
            <FaShieldAlt size={20} />
          </div>
          {!collapsed && (
            <div className="flex-grow-1">
              <div className="fw-medium" style={{ fontSize: '14px', color: '#000000' }}>Administrador</div>
              <div style={{ fontSize: '12px', color: '#767179' }}>Panel de Control</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-grow-1 d-flex flex-column p-2">
        {adminSidebarItems.map((item, index) => (
          <SidebarItem
            key={index}
            icon={item.icon}
            text={item.text}
            to={item.path}
            isActive={location.pathname === item.path}
            collapsed={collapsed}
          />
        ))}
      </div>
      
      {/* Logout */}
      <div className="p-3 border-top" style={{ borderColor: '#EBC2BB' }}>
        <button
          type="button"
          className="d-flex align-items-center text-decoration-none btn btn-link p-0 w-100"
          style={{ color: '#767179', textDecoration: 'none' }}
          title={collapsed ? 'Cerrar sesión' : ''}
          onClick={() => {
            logout();
            window.location.href = '/auth/login';
          }}
        >
          <FaSignOutAlt size={18} className={collapsed ? '' : 'me-3'} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;