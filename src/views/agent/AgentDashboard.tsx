import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import AgentDashboardLayout from '../../components/layout/AgentDashboardLayout';
import BarChart from '../../components/agent/BarChart';
import LineChart from '../../components/agent/LineChart';
import './AgentDashboard.css';

const AgentDashboard: React.FC = () => {
  // Datos para los gráficos
  const barData1 = {
    labels: ['Categoría 1', 'Categoría 2', 'Categoría 3'],
    datasets: [
      {
        label: 'Datos 1',
        data: [30, 20, 25],
        backgroundColor: [
          '#F44123', // Naranja (color principal)
          '#36A2EB', // Azul
          '#A675F6'  // Morado
        ],
        borderColor: [
          '#F44123',
          '#36A2EB',
          '#A675F6'
        ],
        borderWidth: 1,
      }
    ],
  };

  const lineData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Serie 1',
        data: [65, 30, 80, 35, 60, 25, 70],
        borderColor: '#F44123', // Naranja (color principal)
        backgroundColor: 'rgba(244, 65, 35, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Serie 2',
        data: [30, 60, 25, 70, 40, 80, 35],
        borderColor: '#36A2EB', // Azul
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
      }
    ],
  };

  const barData2 = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Estadística 1',
        data: [40, 35, 45, 30, 35, 40, 45],
        backgroundColor: '#4BC0C0', // Color turquesa
        borderColor: '#4BC0C0',
        borderWidth: 1,
      }
    ],
  };

  return (
    <AgentDashboardLayout companyName="YIELIT">
      <Container fluid className="py-4">
        <h2 className="mb-4" style={{ color: '#000000' }}>Estadísticas generales</h2>
        
        {/* Primera fila de gráficos */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="analytics-card">
              <Card.Title>Dato 1</Card.Title>
              <div className="chart-container">
                <BarChart data={barData1} />
              </div>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="analytics-card">
              <Card.Title>Dato 2</Card.Title>
              <div className="chart-container">
                <LineChart data={lineData} />
              </div>
            </Card>
          </Col>
        </Row>
        
        {/* Segunda fila con gráfico grande */}
        <h3 className="mb-3" style={{ color: '#000000' }}>Estadística 1</h3>
        <Row>
          <Col md={12}>
            <Card className="analytics-card">
              <div className="chart-container">
                <BarChart data={barData2} />
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </AgentDashboardLayout>
  );
};

export default AgentDashboard;
