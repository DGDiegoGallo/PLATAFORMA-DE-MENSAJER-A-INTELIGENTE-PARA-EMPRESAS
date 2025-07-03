import React, { useState } from 'react';
import useAuth from '../../features/auth/hooks/useAuth';
import './Sidebar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaBuilding, 
  FaUsers, 
  FaUserCog, 
  FaChartBar, 
  FaCommentDots, 
  FaGraduationCap, 
  FaComments, 
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaWallet
} from 'react-icons/fa';

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

import useCompanyStore, { CompanyState } from '../../store/companyStore';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const companyName = useCompanyStore((state: CompanyState) => state.companyName);
  const safeCompanyName = (companyName ?? '').trim();
  const { user, logout } = useAuth();
  const userRole = user?.rol || user?.role?.name || 'user';
  const hasCompany = safeCompanyName !== '' && userRole !== 'user';
  const isAdmin = ['admin', 'superadmin', 'administrator'].includes(userRole);
  // permitir edición solo para roles distintos de empleado o agente
  const canEditCompany = !['empleado', 'agente'].includes(userRole);

  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Determinar si es cliente sin empresa
  const isClienteSinEmpresa = userRole === 'cliente' && !safeCompanyName;

  // Sidebar items condicionales
  const sidebarItems = isClienteSinEmpresa
    ? [
        { icon: <FaBuilding size={18} />, text: 'Crear Empresa', path: '/company/data' }
      ]
    : [
        { icon: <FaBuilding size={18} />, text: hasCompany ? 'Datos Empresa' : 'Crear Empresa', path: '/company/data' },
        { icon: <FaUsers size={18} />, text: 'Agentes', path: '/company/agents' },
        ...(isAdmin ? [{ icon: <FaUserCog size={18} />, text: 'Gestión de usuarios', path: '/company/users' }] : []),
        { icon: <FaChartBar size={18} />, text: 'Análisis y estadísticas', path: '/company/analytics' },
        { icon: <FaCommentDots size={18} />, text: 'Canal de mensajería', path: '/company/messaging' },
        { icon: <FaGraduationCap size={18} />, text: 'Soporte', path: '/company/support' },
        { icon: <FaComments size={18} />, text: 'Chat', path: '/company/chat' },
        ...(userRole === 'company' ? [{ icon: <FaWallet size={18} />, text: 'Crypto Banking', path: '/crypto-banking' }] : []),
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

      {/* Company Profile Header */}
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
            <FaBuilding size={20} />
          </div>
          {!collapsed && (
            <div className="flex-grow-1">
              <div className="fw-medium" style={{ fontSize: '14px', color: '#000000' }}>{hasCompany ? companyName : 'Sin empresa'}</div>
              {canEditCompany && (
                <Link 
                  to="/company/data" 
                  className="text-decoration-none" 
                  style={{ fontSize: '12px', color: '#F44123' }}
                >
                  {hasCompany ? 'Editar' : 'Crear empresa'}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-grow-1 d-flex flex-column p-2">
        {sidebarItems.map((item, index) => (
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
            navigate('/login', { replace: true });
          }}
        >
          <FaSignOutAlt size={18} className={collapsed ? '' : 'me-3'} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
