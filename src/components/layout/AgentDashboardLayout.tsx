import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaChartBar, FaComments, FaUsers, FaRobot, FaLayerGroup, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';

interface AgentDashboardLayoutProps {
  children: React.ReactNode;
  companyName: string;
}

const AgentDashboardLayout: React.FC<AgentDashboardLayoutProps> = ({ children, companyName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    // Verificar si la ruta actual coincide con la ruta del enlace
    // Para /agent/profile/edit, solo debe coincidir con /agent/profile
    // Para /agent/statistics, solo debe coincidir con /agent/statistics
    const currentPath = location.pathname;
    
    // Si estamos en una subruta como /agent/profile/edit
    // y queremos verificar si /agent/profile está activo
    if (path.startsWith('/agent/') && currentPath.startsWith(path)) {
      // Verificar si es una coincidencia exacta o si es una subruta
      return currentPath === path || currentPath.startsWith(`${path}/`);
    }
    
    // Para otras rutas, verificar si la ruta actual es exactamente igual a la ruta del enlace
    return currentPath === path;
  };
  
  // Función para manejar la navegación de forma programática
  const handleNavigation = (path: string) => {
    // Prevenir la navegación predeterminada
    navigate(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <Navbar 
        style={{ 
          backgroundColor: '#EBEBEB', 
          borderBottom: '1px solid #EBC2BB',
          padding: '0.5rem 1rem'
        }}
      >
        <Container fluid>
          <Navbar.Brand 
            as={Link} 
            to="/agent/dashboard" 
            style={{ 
              color: '#484847', 
              fontWeight: 'bold', 
              fontSize: '1.5rem' 
            }}
          >
            {companyName}
          </Navbar.Brand>
          <div className="d-flex align-items-center gap-4">
            <Link 
              to="/agent/messages" 
              style={{ 
                color: '#484847', 
                fontSize: '1.25rem',
                position: 'relative'
              }}
            >
              <FaComments />
              <span 
                style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  backgroundColor: '#F44123', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '18px', 
                  height: '18px', 
                  fontSize: '0.7rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}
              >
                3
              </span>
            </Link>
            <Link 
              to="/agent/notifications" 
              style={{ 
                color: '#484847', 
                fontSize: '1.25rem',
                position: 'relative'
              }}
            >
              <span className="fa-stack">
                <i className="fa fa-bell"></i>
              </span>
              <span 
                style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  backgroundColor: '#F44123', 
                  color: 'white', 
                  borderRadius: '50%', 
                  width: '18px', 
                  height: '18px', 
                  fontSize: '0.7rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}
              >
                2
              </span>
            </Link>
            <Link 
              to="/agent/profile" 
              style={{ 
                color: '#484847', 
                fontSize: '1.25rem' 
              }}
            >
              <FaUser />
            </Link>
          </div>
        </Container>
      </Navbar>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Navigation */}
        <div 
          style={{ 
            width: '200px', 
            backgroundColor: '#FFFFFF', 
            borderRight: '1px solid #EBC2BB',
            padding: '1.5rem 0'
          }}
        >
          <div 
            style={{ 
              padding: '0 1rem 1.5rem', 
              borderBottom: '1px solid #EBEBEB',
              marginBottom: '1rem'
            }}
          >
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem' 
              }}
            >
              <div 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: '#484847', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  marginRight: '0.75rem' 
                }}
              >
                <FaUser style={{ color: '#FFFFFF' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#000000' }}>
                  Nombre del agente
                </div>
                <Link 
                  to="/agent/profile/edit" 
                  style={{ 
                    fontSize: '0.8rem', 
                    color: '#767179', 
                    textDecoration: 'none' 
                  }}
                >
                  Editar
                </Link>
              </div>
            </div>
          </div>

          <Nav className="flex-column">
            <div 
              onClick={() => handleNavigation('/agent/dashboard')}
              className="nav-link"
              style={{
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                color: isActive('/agent/dashboard') ? '#F44123' : '#767179',
                gap: '0.75rem',
                textDecoration: 'none',
                fontWeight: isActive('/agent/dashboard') ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              <FaChartBar />
              <span>Estadísticas</span>
            </div>
            <div 
              onClick={() => handleNavigation('/agent/chat')}
              className="nav-link"
              style={{ 
                color: isActive('/agent/chat') ? '#F44123' : '#767179', 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <FaComments />
              <span>Chat</span>
            </div>
            <div 
              onClick={() => handleNavigation('/agent/groups')}
              className="nav-link"
              style={{ 
                color: isActive('/agent/groups') ? '#F44123' : '#767179', 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <FaUsers />
              <span>Grupos</span>
            </div>
            <div 
              onClick={() => handleNavigation('/agent/bots')}
              className="nav-link"
              style={{ 
                color: isActive('/agent/bots') ? '#F44123' : '#767179', 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <FaRobot />
              <span>Bots</span>
            </div>
            <div 
              onClick={() => handleNavigation('/agent/channels')}
              className="nav-link"
              style={{ 
                color: isActive('/agent/channels') ? '#F44123' : '#767179', 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <FaLayerGroup />
              <span>Canales</span>
            </div>
            <div 
              onClick={() => handleNavigation('/agent/events')}
              className="nav-link"
              style={{ 
                color: isActive('/agent/events') ? '#F44123' : '#767179', 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <FaCalendarAlt />
              <span>Eventos</span>
            </div>
          </Nav>

          <div 
            style={{ 
              marginTop: 'auto', 
              padding: '1rem', 
              borderTop: '1px solid #EBEBEB',
              position: 'absolute',
              bottom: '0',
              width: '100%'
            }}
          >
            <div 
              onClick={() => handleNavigation('/logout')}
              className="nav-link"
              style={{ 
                color: '#767179', 
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <FaSignOutAlt />
              <span>Cerrar sesión</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboardLayout;
