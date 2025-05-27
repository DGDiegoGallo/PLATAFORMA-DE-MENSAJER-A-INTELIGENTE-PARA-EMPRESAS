import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import DashboardLayout from '../../components/layout/DashboardLayout';

const CompanyDashboard: React.FC = () => {
  // Mock data for the dashboard
  const companyName = "YIELIT";
  
  return (
    <DashboardLayout companyName={companyName}>
      <Container fluid>
        <h2 className="mb-4" style={{ color: '#000000' }}>Dashboard Empresarial</h2>
        
        <Row className="mb-4">
          <Col md={8}>
            <Card 
              className="border-0 shadow-sm mb-4"
              style={{ borderRadius: '8px' }}
            >
              <Card.Header 
                className="bg-white py-3 px-4 border-0"
                style={{ borderBottom: '1px solid #EBC2BB' }}
              >
                <h5 className="mb-0" style={{ color: '#000000' }}>Resumen de Actividad</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <p className="text-center py-5" style={{ color: '#767179' }}>
                  Aquí se mostrará un gráfico con la actividad reciente
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card 
              className="border-0 shadow-sm mb-4"
              style={{ borderRadius: '8px' }}
            >
              <Card.Header 
                className="bg-white py-3 px-4 border-0"
                style={{ borderBottom: '1px solid #EBC2BB' }}
              >
                <h5 className="mb-0" style={{ color: '#000000' }}>Estadísticas</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: '#767179' }}>Mensajes enviados</span>
                  <span className="fw-bold" style={{ color: '#000000' }}>1,234</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: '#767179' }}>Conversaciones activas</span>
                  <span className="fw-bold" style={{ color: '#000000' }}>42</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: '#767179' }}>Usuarios registrados</span>
                  <span className="fw-bold" style={{ color: '#000000' }}>156</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ color: '#767179' }}>Agentes activos</span>
                  <span className="fw-bold" style={{ color: '#000000' }}>8</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Row>
          <Col md={6}>
            <Card 
              className="border-0 shadow-sm mb-4"
              style={{ borderRadius: '8px' }}
            >
              <Card.Header 
                className="bg-white py-3 px-4 border-0"
                style={{ borderBottom: '1px solid #EBC2BB' }}
              >
                <h5 className="mb-0" style={{ color: '#000000' }}>Mensajes Recientes</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #EBEBEB' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ color: '#000000' }}>Usuario 1</span>
                    <small style={{ color: '#767179' }}>10:30 AM</small>
                  </div>
                  <p className="mb-0" style={{ color: '#767179' }}>
                    Mensaje de ejemplo del usuario 1...
                  </p>
                </div>
                <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #EBEBEB' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ color: '#000000' }}>Usuario 2</span>
                    <small style={{ color: '#767179' }}>09:45 AM</small>
                  </div>
                  <p className="mb-0" style={{ color: '#767179' }}>
                    Mensaje de ejemplo del usuario 2...
                  </p>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ color: '#000000' }}>Usuario 3</span>
                    <small style={{ color: '#767179' }}>Ayer</small>
                  </div>
                  <p className="mb-0" style={{ color: '#767179' }}>
                    Mensaje de ejemplo del usuario 3...
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card 
              className="border-0 shadow-sm mb-4"
              style={{ borderRadius: '8px' }}
            >
              <Card.Header 
                className="bg-white py-3 px-4 border-0"
                style={{ borderBottom: '1px solid #EBC2BB' }}
              >
                <h5 className="mb-0" style={{ color: '#000000' }}>Actividad del Equipo</h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #EBEBEB' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ color: '#000000' }}>Agente 1</span>
                    <small style={{ color: '#767179' }}>Hace 5 min</small>
                  </div>
                  <p className="mb-0" style={{ color: '#767179' }}>
                    Respondió a 3 mensajes nuevos
                  </p>
                </div>
                <div className="mb-3 pb-3" style={{ borderBottom: '1px solid #EBEBEB' }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ color: '#000000' }}>Agente 2</span>
                    <small style={{ color: '#767179' }}>Hace 15 min</small>
                  </div>
                  <p className="mb-0" style={{ color: '#767179' }}>
                    Cerró 2 conversaciones
                  </p>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-medium" style={{ color: '#000000' }}>Agente 3</span>
                    <small style={{ color: '#767179' }}>Hace 30 min</small>
                  </div>
                  <p className="mb-0" style={{ color: '#767179' }}>
                    Inició 5 nuevas conversaciones
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
};

export default CompanyDashboard;
