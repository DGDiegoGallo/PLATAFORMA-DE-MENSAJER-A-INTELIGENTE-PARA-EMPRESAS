import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { FaChartLine, FaUsers, FaCommentDots, FaRegCalendarAlt, FaPlusCircle, FaUserTie } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import useCompanyStore, { CompanyState } from '../../store/companyStore';

const CompanyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = (user?.rol || user?.role?.name || 'user').toLowerCase();
  const companyName = useCompanyStore((state: CompanyState) => state.companyName);
  const hasCompany = (companyName ?? '').trim() !== '';

  // If user is 'cliente', 'client' or 'user' and has no company, show special dashboard
  if ((userRole === 'cliente' || userRole === 'client' || userRole === 'user') && !hasCompany) {
    return (
      <div className="container-fluid py-4">
        <h2 className="mb-4">Bienvenido</h2>
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex flex-column align-items-center justify-content-center">
                <FaPlusCircle size={48} className="mb-3" style={{ color: '#F44123' }} />
                <h4 className="mb-3">Crear empresa</h4>
                <p className="text-muted mb-3 text-center">Crea una nueva empresa para comenzar a usar la plataforma y gestionar tus equipos.</p>
                <button className="btn" style={{ background: '#F44123', color: '#fff' }} onClick={() => navigate('/company/data')}>Crear empresa</button>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex flex-column align-items-center justify-content-center">
                <FaUserTie size={48} className="mb-3" style={{ color: '#F44123' }} />
                <h4 className="mb-3">¿Ya formas parte de una empresa?</h4>
                <p className="text-muted mb-3 text-center">Debes esperar a que un <b>empresario</b> te invite a una empresa existente. Recibirás una notificación o correo cuando seas agregado.</p>
                <span className="badge" style={{ background: '#F44123', color: '#fff', fontWeight: 600, fontSize: 14 }}>Esperando invitación</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Panel de Control</h2>
      
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-white p-3 rounded me-3 border">
                  <FaChartLine className="text-primary" size={24} />
                </div>
                <div>
                  <h6 className="mb-0">Análisis</h6>
                  <small className="text-muted">Estadísticas y datos</small>
                </div>
              </div>
              <p className="text-muted mb-3">Visualiza estadísticas de campañas, engagement y resultados.</p>
              <Button 
                variant="outline-primary" 
                className="mt-auto"
                onClick={() => navigate('/company/analytics')}
              >
                Ver Análisis
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                  <FaUsers className="text-success" size={24} />
                </div>
                <div>
                  <h6 className="mb-0">Agentes</h6>
                  <small className="text-muted">Gestión de usuarios</small>
                </div>
              </div>
              <p className="text-muted mb-3">Administra tu equipo de agentes, roles y permisos.</p>
              <Button 
                variant="outline-success" 
                className="mt-auto"
                onClick={() => navigate('/company/agents')}
              >
                Gestionar Agentes
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                  <FaCommentDots className="text-info" size={24} />
                </div>
                <div>
                  <h6 className="mb-0">Mensajería</h6>
                  <small className="text-muted">Canales y mensajes</small>
                </div>
              </div>
              <p className="text-muted mb-3">Configura y gestiona tus canales de mensajería.</p>
              <Button 
                variant="outline-info" 
                className="mt-auto"
                onClick={() => navigate('/company/messaging')}
              >
                Ver Mensajería
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                  <FaRegCalendarAlt className="text-warning" size={24} />
                </div>
                <div>
                  <h6 className="mb-0">Chat</h6>
                  <small className="text-muted">Mensajes y conversaciones</small>
                </div>
              </div>
              <p className="text-muted mb-3">Gestiona conversaciones en tiempo real con tus clientes.</p>
              <Button 
                variant="outline-warning" 
                className="mt-auto"
                onClick={() => navigate('/company/chat')}
              >
                Ir al Chat
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-4">Bienvenido a tu Panel de Control</h5>
              <p className="text-muted">
                Desde aquí podrás gestionar todos los aspectos de tu plataforma de mensajería inteligente.
                Navega entre las diferentes secciones para configurar canales, gestionar agentes, visualizar
                análisis y comunicarte con tus clientes.
              </p>
              <p className="text-muted mb-0">
                Si necesitas ayuda, consulta nuestra sección de <a href="/company/support">Soporte</a> o
                contáctanos directamente.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CompanyDashboard;
