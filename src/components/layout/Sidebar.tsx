import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaBuilding, 
  FaUsers, 
  FaUserCog, 
  FaChartBar, 
  FaCommentDots, 
  FaGraduationCap, 
  FaComments, 
  FaSignOutAlt 
} from 'react-icons/fa';

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  isActive: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, to, isActive }) => {
  return (
    <Link 
      to={to} 
      className={`d-flex align-items-center py-3 px-3 text-decoration-none ${isActive ? 'fw-bold' : 'fw-normal'}`}
      style={{ 
        color: isActive ? '#000000' : '#767179',
        backgroundColor: isActive ? '#EBEBEB' : 'transparent',
        borderRadius: '4px',
        transition: 'all 0.2s ease'
      }}
    >
      <div className="me-3" style={{ color: isActive ? '#F44123' : '#484847' }}>
        {icon}
      </div>
      <span>{text}</span>
    </Link>
  );
};

interface SidebarProps {
  companyName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ companyName }) => {
  const location = useLocation();
  
  const sidebarItems = [
    { icon: <FaBuilding size={18} />, text: 'Datos Empresa', path: '/company/data' },
    { icon: <FaUsers size={18} />, text: 'Agentes', path: '/company/agents' },
    { icon: <FaUserCog size={18} />, text: 'Gestión de usuarios', path: '/company/users' },
    { icon: <FaChartBar size={18} />, text: 'Análisis y estadísticas', path: '/company/analytics' },
    { icon: <FaCommentDots size={18} />, text: 'Canal de mensajería', path: '/company/messaging' },
    { icon: <FaGraduationCap size={18} />, text: 'Capacitación', path: '/company/training' },
    { icon: <FaComments size={18} />, text: 'Chat', path: '/company/chat' },
  ];

  return (
    <div className="h-100 d-flex flex-column border-end" style={{ borderColor: '#EBC2BB', width: '220px', backgroundColor: '#FFFFFF' }}>
      {/* Company Profile Header */}
      <div className="p-3 border-bottom" style={{ borderColor: '#EBC2BB' }}>
        <div className="d-flex align-items-center">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#EBEBEB',
              color: '#484847'
            }}
          >
            <FaBuilding size={20} />
          </div>
          <div className="flex-grow-1">
            <div className="fw-medium" style={{ fontSize: '14px', color: '#000000' }}>{companyName}</div>
            <Link 
              to="/company/data" 
              className="text-decoration-none" 
              style={{ fontSize: '12px', color: '#F44123' }}
            >
              Editar
            </Link>
          </div>
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
          />
        ))}
      </div>
      
      {/* Logout */}
      <div className="p-3 border-top" style={{ borderColor: '#EBC2BB' }}>
        <Link 
          to="/auth/logout" 
          className="d-flex align-items-center text-decoration-none"
          style={{ color: '#767179' }}
        >
          <FaSignOutAlt size={18} className="me-3" />
          <span>Cerrar sesión</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
