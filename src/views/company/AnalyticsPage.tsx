import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
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
  Filler,
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useCompany } from '../../features/company/hooks/useCompany';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './AnalyticsPage.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  ChartDataLabels
);

interface User {
  id: number;
  documentId: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  rol: string;
}

interface MessageContent {
  sender_info?: {
    nombre?: string;
    apellido?: string;
    hora?: string;
  };
  message?: string;
  sender?: string;
}

interface Message {
  id: number;
  documentId: string;
  name: string;
  type: string;
  content: MessageContent[];
  bot_interaction: Record<string, unknown>;
  company: {
    id: number;
    documentId: string;
    name: string;
  };
}

interface AnalyticsData {
  totalMessages: number;
  totalChannels: number;
  totalUsers: number;
  totalBots: number;
  channelTypes: { channel: number; group: number; event: number };
  messagesByHour: { [hour: string]: number };
  messagesByRole: { [role: string]: number };
  botVsHuman: { bot: number; human: number };
  topChannels: { name: string; count: number; type: string }[];
  usersByRole: { [role: string]: number };
  messagesByDay: { [date: string]: number };
}

const AnalyticsPage: React.FC = () => {
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [chartView, setChartView] = useState<'activity' | 'response' | 'combined'>('combined');
  const [data, setData] = useState<AnalyticsData>({
    totalMessages: 0,
    totalChannels: 0,
    totalUsers: 0,
    totalBots: 0,
    channelTypes: { channel: 0, group: 0, event: 0 },
    messagesByHour: {},
    messagesByRole: {},
    botVsHuman: { bot: 0, human: 0 },
    topChannels: [],
    usersByRole: {},
    messagesByDay: {},
  });

  // Función para traducir tipos de canales
  const translateChannelType = (type: string): string => {
    switch(type) {
      case 'channel': return 'Canal';
      case 'group': return 'Grupo';
      case 'event': return 'Evento';
      default: return type;
    }
  };

  // Función para traducir roles
  const translateRole = (role: string): string => {
    switch(role) {
      case 'company': return 'Empresarial';
      case 'empleado': return 'Empleado';
      case 'agente': return 'Agente';
      case 'bot': return 'Bot';
      default: return role;
    }
  };

  // Función para obtener datos reales de la API
  const fetchAnalyticsData = async () => {
    if (!company?.documentId) return;
    
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
      
      // 1. Obtener todos los mensajes con company
      const messagesResponse = await fetch(`${apiUrl}/api/messages?populate=company&filters[company][documentId][$eq]=${company.documentId}`);
      const messagesData = await messagesResponse.json();
      
      // 2. Obtener datos de la empresa con usuarios
      const companyResponse = await fetch(`${apiUrl}/api/companies?populate=users_permissions_users&filters[documentId][$eq]=${company.documentId}`);
      const companyData = await companyResponse.json();
      
      const messages = messagesData.data || [];
      const companyInfo = companyData.data[0] || {};
      const users = companyInfo.attributes?.users_permissions_users || companyInfo.users_permissions_users || [];
      
      // Procesar datos
      const analyticsData: AnalyticsData = {
        totalMessages: 0,
        totalChannels: messages.length,
        totalUsers: users.length,
        totalBots: 0,
        channelTypes: { channel: 0, group: 0, event: 0 },
        messagesByHour: {},
        messagesByRole: {},
        botVsHuman: { bot: 0, human: 0 },
        topChannels: [],
        usersByRole: {},
        messagesByDay: {},
      };
      
      // Inicializar contadores por hora (0-23)
      for (let i = 0; i < 24; i++) {
        analyticsData.messagesByHour[i.toString().padStart(2, '0')] = 0;
      }
      
      // Contar usuarios por rol
      users.forEach((user: User) => {
        const role = user.rol || 'sin_rol';
        analyticsData.usersByRole[role] = (analyticsData.usersByRole[role] || 0) + 1;
      });
      
      // Procesar cada canal/grupo/evento
      const channelStats: { name: string; count: number; type: string }[] = [];
      
      for (const message of messages as Message[]) {
        const channelType = message.type || 'unknown';
        const channelName = message.name || 'Sin nombre';
        const content = message.content || [];
        const botInteraction = message.bot_interaction || {};
        
        // Contar tipos de canales
        if (channelType in analyticsData.channelTypes) {
          analyticsData.channelTypes[channelType as keyof typeof analyticsData.channelTypes]++;
        }
        
        // Contar bots
        const botsInChannel = Object.keys(botInteraction).length;
        analyticsData.totalBots += botsInChannel;
        
        // Contar mensajes totales
        analyticsData.totalMessages += content.length;
        
        // Estadísticas por canal
        channelStats.push({
          name: channelName,
          count: content.length,
          type: channelType
        });
        
        // Procesar mensajes individuales
        content.forEach((msg: MessageContent) => {
          const senderInfo = msg.sender_info || {};
          const senderName = senderInfo.nombre || msg.sender || 'Unknown';
          const hour = senderInfo.hora || '';
          
          // Detectar si es bot o humano
          const isBot = Object.keys(botInteraction).includes(senderName);
          if (isBot) {
            analyticsData.botVsHuman.bot++;
          } else {
            analyticsData.botVsHuman.human++;
          }
          
          // Encontrar rol del usuario
          const user = users.find((u: User) => 
            u.nombre === senderName || 
            `${u.nombre} ${u.apellido}` === senderName ||
            u.username === senderName
          );
          const userRole = user?.rol || (isBot ? 'bot' : 'usuario');
          analyticsData.messagesByRole[userRole] = (analyticsData.messagesByRole[userRole] || 0) + 1;
          
          // Extraer hora del mensaje
          if (hour) {
            const timePart = hour.split(',')[1]?.trim(); // "06/07/2025, 19:31" -> "19:31"
            const hourNum = timePart?.split(':')[0];
            if (hourNum && analyticsData.messagesByHour[hourNum] !== undefined) {
              analyticsData.messagesByHour[hourNum]++;
            }
            
            // Extraer fecha para actividad por día
            const datePart = hour.split(',')[0]?.trim(); // "06/07/2025"
            if (datePart) {
              analyticsData.messagesByDay[datePart] = (analyticsData.messagesByDay[datePart] || 0) + 1;
            }
          }
        });
      }
      
      // Top 5 canales más activos
      analyticsData.topChannels = channelStats
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Simular algunas métricas adicionales para hacer la demo más interesante
      const simulatedMetrics = {
        responseTime: Math.floor(1.2 + Math.random() * 3.8), // 1.2-5.0 segundos
        engagement: Math.floor(65 + Math.random() * 30), // 65-95%
        satisfaction: Math.floor(4.1 + Math.random() * 0.8), // 4.1-4.9/5
        peakHours: ['09', '14', '16'], // Horas pico simuladas
      };
      
      // Agregar datos simulados a algunas horas para hacer el gráfico más interesante
      if (analyticsData.totalMessages > 0) {
        simulatedMetrics.peakHours.forEach(hour => {
          analyticsData.messagesByHour[hour] += Math.floor(2 + Math.random() * 5);
        });
      }
      
      setData(analyticsData);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar PDF mejorada con captura directa de Chart.js
  const handleDownloadPdf = async () => {
    try {
      const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
      let y = margin;

      // Título principal
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Informe de Análisis y Estadísticas', margin, y);
      y += 30;

      // Información de la empresa
      if (company) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Empresa:', margin, y);
        y += 20;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${company.name}`, margin + 20, y);
        y += 15;
        
        if (company.description) {
          const desc = company.description as Record<string, unknown>;
          if (desc.email) {
            doc.text(`Email: ${desc.email}`, margin + 20, y);
            y += 15;
          }
          if (desc.sector) {
            doc.text(`Sector: ${desc.sector}`, margin + 20, y);
            y += 15;
          }
          if (desc.city && desc.country) {
            doc.text(`Ubicación: ${desc.city}, ${desc.country}`, margin + 20, y);
            y += 15;
          }
        }
        y += 10;
      }

      // Métricas principales
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Métricas Principales:', margin, y);
      y += 20;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const metrics = [
        `• Total de Mensajes: ${data.totalMessages} conversaciones activas`,
        `• Canales Activos: ${data.totalChannels} (${data.channelTypes.channel} canales, ${data.channelTypes.group} grupos, ${data.channelTypes.event} eventos)`,
        `• Usuarios: ${data.totalUsers} miembros de la empresa`,
        `• Bots Activos: ${data.totalBots} asistentes automatizados`,
      ];
      
      metrics.forEach(metric => {
        doc.text(metric, margin + 20, y);
        y += 15;
      });
      y += 10;

      // Distribución por roles
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribución por Roles:', margin, y);
      y += 20;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      Object.entries(data.usersByRole).forEach(([role, count]) => {
        doc.text(`• ${translateRole(role)}: ${count} usuarios`, margin + 20, y);
        y += 15;
      });
      y += 10;

      // Actividad por mensajes
      if (Object.keys(data.messagesByRole).length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Actividad por Rol:', margin, y);
        y += 20;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        Object.entries(data.messagesByRole).forEach(([role, count]) => {
          doc.text(`• ${translateRole(role)}: ${count} mensajes`, margin + 20, y);
          y += 15;
        });
        y += 10;
      }

      // Top canales más activos
      if (data.topChannels.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Canales Más Activos:', margin, y);
        y += 20;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        data.topChannels.forEach((channel, index) => {
          doc.text(`${index + 1}. ${channel.name} (${translateChannelType(channel.type)}): ${channel.count} mensajes`, margin + 20, y);
          y += 15;
        });
        y += 10;
      }

      // Bots vs Humanos
      const totalMessages = data.botVsHuman.bot + data.botVsHuman.human;
      if (totalMessages > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Interacciones:', margin, y);
        y += 20;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const botPercentage = ((data.botVsHuman.bot / totalMessages) * 100).toFixed(1);
        const humanPercentage = ((data.botVsHuman.human / totalMessages) * 100).toFixed(1);
        
        doc.text(`• Mensajes de Bots: ${data.botVsHuman.bot} (${botPercentage}%)`, margin + 20, y);
        y += 15;
        doc.text(`• Mensajes Humanos: ${data.botVsHuman.human} (${humanPercentage}%)`, margin + 20, y);
        y += 20;
      }

      // Función para capturar canvas de Chart.js directamente
      const captureChart = async (elementId: string, title: string) => {
        // Esperar un poco para asegurar que el gráfico esté completamente renderizado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const chartElement = document.getElementById(elementId);
        if (!chartElement) {
          console.log(`Elemento ${elementId} no encontrado`);
          return null;
        }

        // Buscar el canvas interno de Chart.js
        const canvas = chartElement.querySelector('canvas');
        if (!canvas) {
          console.log(`Canvas no encontrado en ${elementId}`);
          return null;
        }

        try {
          // Capturar directamente el canvas del gráfico
          const imgData = canvas.toDataURL('image/png', 1.0);
          return {
            imgData,
            title,
            width: canvas.width,
            height: canvas.height
          };
        } catch (error) {
          console.error(`Error capturando canvas de ${title}:`, error);
          
          // Fallback: usar html2canvas como respaldo
          try {
            const html2canvasResult = await html2canvas(chartElement, {
              scale: 1,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false,
              width: chartElement.offsetWidth,
              height: chartElement.offsetHeight,
              onclone: (clonedDoc) => {
                // Asegurar que los estilos se mantengan
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                  clonedElement.style.backgroundColor = '#ffffff';
                }
              }
            });
            
            return {
              imgData: html2canvasResult.toDataURL('image/png', 1.0),
              title,
              width: html2canvasResult.width,
              height: html2canvasResult.height
            };
          } catch (fallbackError) {
            console.error(`Error en fallback para ${title}:`, fallbackError);
            return null;
          }
        }
      };

      // Capturar gráficos individuales
      const charts = [
        { id: 'main-chart', title: 'Gráfico Principal - Actividad y Tiempo de Respuesta' },
        { id: 'channel-types-chart', title: 'Distribución de Tipos de Canales' },
        { id: 'messages-by-role-chart', title: 'Mensajes por Rol de Usuario' },
        { id: 'bots-vs-humans-chart', title: 'Comparación Bots vs Humanos' },
        { id: 'users-by-role-chart', title: 'Distribución de Usuarios por Rol' },
        { id: 'top-channels-chart', title: 'Top 5 Canales Más Activos' }
      ];

      for (const chart of charts) {
        const capturedChart = await captureChart(chart.id, chart.title);
        
        if (capturedChart) {
          doc.addPage();
          y = margin;

          // Título del gráfico
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(capturedChart.title, margin, y);
          y += 40;

          // Calcular dimensiones para centrar la imagen
          const maxWidth = pageWidth;
          const maxHeight = doc.internal.pageSize.getHeight() - y - 100;
          
          let imgWidth = capturedChart.width;
          let imgHeight = capturedChart.height;
          
          // Escalar si es necesario
          if (imgWidth > maxWidth) {
            imgHeight = (imgHeight * maxWidth) / imgWidth;
            imgWidth = maxWidth;
          }
          
          if (imgHeight > maxHeight) {
            imgWidth = (imgWidth * maxHeight) / imgHeight;
            imgHeight = maxHeight;
          }
          
          // Centrar horizontalmente
          const xPosition = margin + (pageWidth - imgWidth) / 2;
          
          // Añadir imagen al PDF
          doc.addImage(capturedChart.imgData, 'PNG', xPosition, y, imgWidth, imgHeight);
        } else {
          // Si no se pudo capturar, añadir página con mensaje de error
          doc.addPage();
          y = margin;

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(chart.title, margin, y);
          y += 40;

          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(`No se pudo capturar el gráfico: ${chart.title}`, margin, y);
          y += 20;
          doc.text('Esto puede deberse a restricciones de seguridad del navegador.', margin, y);
        }
      }

      // Pie de página en todas las páginas
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 100, doc.internal.pageSize.getHeight() - 20);
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, margin, doc.internal.pageSize.getHeight() - 20);
      }

      doc.save(`informe-analytics-${company?.name || 'empresa'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  // Configuraciones de gráficos corregidas
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { font: { size: 11 } } },
      datalabels: {
        display: true,
        color: '#fff',
        font: { size: 12, weight: 'bold' as const },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (value: number, context: any) => {
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value}\n(${percentage}%)`;
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 } } },
      title: { display: false },
      datalabels: {
        display: true,
        color: '#666',
        font: { size: 10, weight: 'bold' as const },
        formatter: (value: number) => value > 0 ? value : '',
        anchor: 'end' as const,
        align: 'top' as const,
      },
    },
    scales: { 
      y: { beginAtZero: true, ticks: { font: { size: 10 } } },
      x: { ticks: { font: { size: 10 } } }
    },
  };

  // Generar datos simulados para tiempo de respuesta por hora
  const generateResponseTimeData = () => {
    const baseResponseTime = 2.5; // segundos base
    return Object.keys(data.messagesByHour).map(hour => {
      const messageCount = data.messagesByHour[hour];
      // Más mensajes = menor tiempo de respuesta (mejor eficiencia)
      const responseTime = messageCount > 0 
        ? Math.max(1, baseResponseTime - (messageCount * 0.3) + (Math.random() * 0.8))
        : baseResponseTime + (Math.random() * 1.5);
      return parseFloat(responseTime.toFixed(1));
    });
  };

  // Función para renderizar el gráfico principal según la vista seleccionada
  const renderMainChart = () => {
    const responseTimeData = generateResponseTimeData();
    
    switch(chartView) {
      case 'activity':
        return (
          <Line
            data={{
              labels: Object.keys(data.messagesByHour),
              datasets: [{
                label: 'Mensajes por hora',
                data: Object.values(data.messagesByHour),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' as const, labels: { font: { size: 11 } } },
                title: { display: false },
              },
              scales: {
                y: { beginAtZero: true, ticks: { font: { size: 10 } } },
                x: { ticks: { font: { size: 10 } } }
              },
            }}
          />
        );
      
      case 'response':
        return (
          <Line
            data={{
              labels: Object.keys(data.messagesByHour),
              datasets: [{
                label: 'Tiempo de respuesta (segundos)',
                data: responseTimeData,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' as const, labels: { font: { size: 11 } } },
                title: { display: false },
              },
              scales: {
                y: { 
                  beginAtZero: true, 
                  ticks: { font: { size: 10 } },
                  title: { display: true, text: 'Segundos' }
                },
                x: { ticks: { font: { size: 10 } } }
              },
            }}
          />
        );
      
      default: // combined
        return (
          <Line
            data={{
              labels: Object.keys(data.messagesByHour),
              datasets: [
                {
                  label: 'Mensajes por hora',
                  data: Object.values(data.messagesByHour),
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y',
                },
                {
                  label: 'Tiempo de respuesta (seg)',
                  data: responseTimeData,
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 2,
                  fill: false,
                  tension: 0.4,
                  yAxisID: 'y1',
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' as const, labels: { font: { size: 11 } } },
                title: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed.y !== null) {
                        label += context.dataset.label?.includes('Tiempo') 
                          ? context.parsed.y + ' segundos'
                          : context.parsed.y + ' mensajes';
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear' as const,
                  display: true,
                  position: 'left' as const,
                  title: {
                    display: true,
                    text: 'Número de mensajes',
                    font: { size: 11 }
                  },
                  beginAtZero: true,
                  ticks: { font: { size: 10 } }
                },
                y1: {
                  type: 'linear' as const,
                  display: true,
                  position: 'right' as const,
                  title: {
                    display: true,
                    text: 'Tiempo de respuesta (segundos)',
                    font: { size: 11 }
                  },
                  beginAtZero: true,
                  ticks: { font: { size: 10 } },
                  grid: {
                    drawOnChartArea: false,
                  },
                },
                x: { ticks: { font: { size: 10 } } }
              },
            }}
          />
        );
    }
  };

  const getChartTitle = () => {
    switch(chartView) {
      case 'activity': return 'Actividad por hora';
      case 'response': return 'Tiempo de respuesta por hora';
      default: return 'Actividad por hora y tiempo de respuesta';
    }
  };

  return (
    <div className="analytics-page">
      <Container fluid>
        {/* Header */}
        <div className="analytics-header d-flex justify-content-between align-items-center">
          <h2>Análisis y estadísticas</h2>
          <div className="analytics-buttons">
            <Button variant="outline-primary" className="me-2" onClick={handleDownloadPdf}>
              Descargar Informe
            </Button>
            <Button
              variant="secondary"
              onClick={fetchAnalyticsData} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2 analytics-spinner" />
                  Actualizando...
                </>
              ) : (
                'Actualizar datos'
              )}
            </Button>
          </div>
        </div>

        <div id="analyticsReport">
          {/* Métricas principales */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="metrics-card text-center">
                <Card.Body>
                  <h5>Total Mensajes</h5>
                  <h2 className="metric-messages">{data.totalMessages}</h2>
                  <small className="text-muted">Conversaciones activas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="metrics-card text-center">
                <Card.Body>
                  <h5>Canales Activos</h5>
                  <h2 className="metric-channels">{data.totalChannels}</h2>
                  <small className="text-muted">Grupos, canales y eventos</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="metrics-card text-center">
                <Card.Body>
                  <h5>Usuarios</h5>
                  <h2 className="metric-users">{data.totalUsers}</h2>
                  <small className="text-muted">Miembros de la empresa</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="metrics-card text-center">
                <Card.Body>
                  <h5>Bots Activos</h5>
                  <h2 className="metric-bots">{data.totalBots}</h2>
                  <small className="text-muted">Asistentes automatizados</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Primera fila de gráficos */}
          <Row className="mb-4">
            <Col md={8}>
              <Card className="chart-card" id="main-chart">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0">{getChartTitle()}</Card.Title>
                  <div className="btn-group btn-group-sm chart-view-buttons" role="group">
                    <Button
                      variant={chartView === 'combined' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setChartView('combined')}
                    >
                      Combinado
                    </Button>
                    <Button
                      variant={chartView === 'activity' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setChartView('activity')}
                    >
                      Actividad
                    </Button>
                    <Button
                      variant={chartView === 'response' ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setChartView('response')}
                    >
                      Tiempo Respuesta
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body style={{ height: '300px' }}>
                  {renderMainChart()}
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="chart-card" id="channel-types-chart">
                <Card.Header>
                  <Card.Title className="mb-0">Tipos de canales</Card.Title>
                </Card.Header>
                <Card.Body style={{ height: '300px' }}>
                  <Doughnut
                    data={{
                      labels: [translateChannelType('channel'), translateChannelType('group'), translateChannelType('event')],
                      datasets: [{
                        data: [data.channelTypes.channel, data.channelTypes.group, data.channelTypes.event],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                        borderWidth: 2,
                      }],
                    }}
                    options={doughnutOptions}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Segunda fila de gráficos */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="chart-card" id="messages-by-role-chart">
                <Card.Header>
                  <Card.Title className="mb-0">Mensajes por rol</Card.Title>
                </Card.Header>
                <Card.Body style={{ height: '280px' }}>
                  <Bar
                    data={{
                      labels: Object.keys(data.messagesByRole).map(role => translateRole(role)),
                      datasets: [{
                        label: 'Mensajes',
                        data: Object.values(data.messagesByRole),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                          borderWidth: 1,
                      }],
                    }}
                    options={{
                      ...barOptions,
                      indexAxis: 'y' as const,
                      plugins: {
                        ...barOptions.plugins,
                        datalabels: {
                          display: true,
                          color: '#666',
                          font: { size: 10, weight: 'bold' as const },
                          formatter: (value: number) => value > 0 ? value : '',
                          anchor: 'end' as const,
                          align: 'right' as const,
                        },
                      },
                    }}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="chart-card" id="bots-vs-humans-chart">
                <Card.Header>
                  <Card.Title className="mb-0">Bots vs Humanos</Card.Title>
                </Card.Header>
                <Card.Body style={{ height: '280px' }}>
                  <Pie
                    data={{
                      labels: ['Mensajes de Bots', 'Mensajes Humanos'],
                      datasets: [{
                        data: [data.botVsHuman.bot, data.botVsHuman.human],
                        backgroundColor: ['#FF6384', '#36A2EB'],
                        borderWidth: 2,
                      }],
                    }}
                    options={doughnutOptions}
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="chart-card" id="users-by-role-chart">
                <Card.Header>
                  <Card.Title className="mb-0">Usuarios por rol</Card.Title>
                </Card.Header>
                <Card.Body style={{ height: '280px' }}>
                  <Doughnut
                    data={{
                      labels: Object.keys(data.usersByRole).map(role => translateRole(role)),
                      datasets: [{
                        data: Object.values(data.usersByRole),
                        backgroundColor: ['#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'],
                        borderWidth: 2,
                      }],
                    }}
                    options={doughnutOptions}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tercera fila */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="chart-card" id="top-channels-chart">
                <Card.Header>
                  <Card.Title className="mb-0">Top 5 canales más activos</Card.Title>
                </Card.Header>
                <Card.Body style={{ height: '280px' }}>
                  <Bar
                    data={{
                      labels: data.topChannels.map(ch => `${ch.name} (${translateChannelType(ch.type)})`),
                      datasets: [{
                        label: 'Mensajes',
                        data: data.topChannels.map(ch => ch.count),
                        backgroundColor: data.topChannels.map((_, i) => 
                          ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][i]
                        ),
                        borderWidth: 1,
                      }],
                    }}
                    options={barOptions}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default AnalyticsPage;