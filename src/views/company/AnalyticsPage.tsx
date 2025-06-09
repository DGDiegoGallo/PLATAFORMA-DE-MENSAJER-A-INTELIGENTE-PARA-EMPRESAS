import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './AnalyticsPage.css'; // Importar estilos

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsPage: React.FC = () => {
  // Datos de ejemplo para los gráficos
  const barData1 = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(244, 65, 35, 0.6)', // Naranja con opacidad
        borderColor: 'rgba(244, 65, 35, 1)',
        borderWidth: 1,
      },
      {
        label: 'Dataset 2',
        data: [8, 12, 6, 9, 4, 7],
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Teal con opacidad
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Dataset 3',
        data: [15, 7, 10, 13, 9, 5],
        backgroundColor: 'rgba(153, 102, 255, 0.6)', // Morado con opacidad
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Serie A',
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: 'rgb(244, 65, 35)', // Naranja
        tension: 0.1,
      },
      {
        label: 'Serie B',
        data: [28, 48, 40, 19, 86, 27, 90],
        fill: false,
        borderColor: 'rgb(75, 192, 192)', // Teal
        tension: 0.1,
      },
    ],
  };

  const barData2 = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
    datasets: [
      {
        label: 'Métricas Clave',
        data: [30, 45, 60, 25, 50, 70, 40, 55],
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Azul con opacidad
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false, // Títulos de gráficos individuales se manejan con Card.Title
      },
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
  };

  return (
    <DashboardLayout companyName="Nombre de la empresa">
      <Container fluid>
        <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>Análisis y estadísticas</h2>
        
        <Row>
          <Col md={6}>
            <Card className="analytics-card">
              <Card.Title>Dato 1</Card.Title>
              <div className="chart-container">
                <Bar data={barData1} options={options} />
              </div>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="analytics-card">
              <Card.Title>Dato 2</Card.Title>
              <div className="chart-container">
                <Line data={lineData} options={options} />
              </div>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <Card className="analytics-card">
              <Card.Title>Estadística 1</Card.Title>
              <div className="chart-container">
                <Bar data={barData2} options={options} />
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
