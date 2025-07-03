import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
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
  Filler,
} from 'chart.js';
import useChannels from '../../features/company/hooks/useChannels';
import useCompany from '../../features/company/hooks/useCompany';
import { messageService } from '../../features/company/services/message.service';
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
  Filler
);

interface ChannelStat {
  name: string;
  type: string;
  members: string[];
  messageCount: number;
}

interface ActivityData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    fill: boolean;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const { channels } = useChannels();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [channelCounts, setChannelCounts] = useState({
    channel: 0,
    group: 0,
    event: 0,
  });
  const [activityData, setActivityData] = useState<ActivityData>({
    labels: Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')),
    datasets: [
      {
        label: 'Mensajes',
        data: Array(24).fill(0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        fill: true,
      },
    ],
  });
  const [avgResponse, setAvgResponse] = useState<number>(0);
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);
  const [quarterEvents, setQuarterEvents] = useState<number[]>([0, 0, 0, 0]);

  /****************************   PDF GENERATION   ****************************/
  const handleDownloadPdf = async () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageHeight = doc.internal.pageSize.getHeight() - margin;
      let y = margin;

      // Título
      doc.setFontSize(18);
      doc.text('Informe de Analítica', margin, y);
      y += 24;

      // Estadísticas rápidas
      doc.setFontSize(12);
      const quickStats = [
        `Canales: ${channelCounts.channel}`,
        `Grupos: ${channelCounts.group}`,
        `Eventos: ${channelCounts.event}`,
        `Tiempo de respuesta prom.: ${avgResponse}s`,
      ];
      quickStats.forEach((txt) => {
        doc.text(txt, margin, y);
        y += 16;
      });
      y += 8;

      /********** 1. Información pública de la compañía **********/
      if (company) {
        doc.text('Compañía:', margin, y);
        y += 14;
        doc.text(`• ${company.name}`, margin + 12, y);
        y += 14;

        const desc: Record<string, unknown> = company.description ?? {};
        const skip = ['hash', 'nft_hash', 'usdt', 'dinero', 'money'];
        Object.entries(desc).forEach(([k, v]) => {
          if (!v || skip.includes(k)) return;
          doc.text(`   ${k}: ${String(v)}`, margin + 12, y);
          y += 14;
          if (y > pageHeight) {
            doc.addPage();
            y = margin;
          }
        });
        y += 8;
      }

      /********** 2. Detalle de canales / grupos **********/
      if (channelStats.length) {
        doc.text('Canales y grupos:', margin, y);
        y += 14;
        for (const cs of channelStats) {
          doc.text(
            `• ${cs.name} (${cs.type})  - Mensajes: ${cs.messageCount}`,
            margin + 12,
            y
          );
          y += 14;

          if (cs.members.length) {
            doc.text('   Miembros:', margin + 12, y);
            y += 14;
            for (const m of cs.members) {
              doc.text(`     - ${m}`, margin + 24, y);
              y += 14;
              if (y > pageHeight) {
                doc.addPage();
                y = margin;
              }
            }
          }
          y += 8;
          if (y > pageHeight) {
            doc.addPage();
            y = margin;
          }
        }
      }

      /********** 3. Captura de gráficas **********/
      doc.addPage();
      y = margin;

      const reportEl = document.getElementById('analyticsReport');
      if (reportEl) {
        const canvas = await html2canvas(reportEl);
        const imgData = canvas.toDataURL('image/png');
        const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', margin, y, pageWidth, imgHeight);
      }

      doc.save('informe_analitica.pdf');
    } catch (e) {
      console.error('Error generando PDF:', e);
    }
  };

  /****************************   DATA FETCH   ****************************/
  const updateData = async () => {
    setLoading(true);
    try {
      /* 1. Conteo de tipos */
      const channel = channels.filter((c) => c.type === 'channel').length;
      const group = channels.filter((c) => c.type === 'group').length;
      const event = channels.filter((c) => c.type === 'event').length;
      setChannelCounts({ channel, group, event });

      /* 2. Actividad por hora + stats por canal */
      const hourCounts: Record<string, number> = {};
      for (let h = 0; h < 24; h++) hourCounts[h.toString().padStart(2, '0')] = 0;

      const statsArr: ChannelStat[] = [];

      await Promise.all(
        channels.map(async (c) => {
          try {
            const msg = await messageService.getMessageByDocumentId(
              c.documentId
            );
            const content: unknown[] =
              (msg as { content?: unknown[]; attributes?: { content?: unknown[] } })?.content ??
              (msg as { content?: unknown[]; attributes?: { content?: unknown[] } })?.attributes?.content ?? [];

            // Stat canal
            statsArr.push({
              name: c.name ?? '—',
              type: c.type ?? '—',
              members: Array.isArray(c.members)
                ? c.members.map(
                    (m: { fullName?: string; name?: string; email?: string }) => m?.fullName || m?.name || m?.email || '—'
                  )
                : [],
              messageCount: content.length,
            });

            // Conteo por hora
            (content as { sender_info?: { hora?: string } }[]).slice(0, 50).forEach((m) => {
              const horaStr: string | undefined = m?.sender_info?.hora;
              if (!horaStr) return;
              const timePart = horaStr.split(',')[1]?.trim();
              const hour = timePart?.split(':')[0];
              if (hour) hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
          } catch {
            /* ignore */
          }
        })
      );

      const sortedHours = Object.keys(hourCounts).sort();
      setActivityData({
        labels: sortedHours,
        datasets: [
          {
            label: 'Mensajes',
            data: sortedHours.map((h) => hourCounts[h]),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: true,
          },
        ],
      });

      /* 3. Otras métricas simuladas */
      setAvgResponse(Math.floor(2 + Math.random() * 6));
      setChannelStats(statsArr);
      setQuarterEvents([
        event + Math.round(Math.random() * 3),
        event + 1,
        event + 2,
        event,
      ]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (!channelsLoading) updateData();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [channelsLoading]);

  /****************************   CHART OPTIONS   ****************************/
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
    },
    scales: { y: { beginAtZero: true } },
  };

  /****************************   RENDER   ****************************/
  return (
    <>
      <Container fluid>
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2
            style={{ color: 'var(--color-text-primary)', marginBottom: 0 }}
          >
            Análisis y estadísticas
          </h2>
          <div>
            <Button
              variant="outline-primary"
              className="me-2"
              onClick={handleDownloadPdf}
            >
              Descargar informe
            </Button>
            <Button
              variant="secondary"
              onClick={updateData}
              disabled={loading}
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                'Actualizar datos'
              )}
            </Button>
          </div>
        </div>

        {/* Sección capturada en PDF */}
        <div id="analyticsReport">
          <Row>
            <Col md={6}>
              <Card className="analytics-card">
                <Card.Title>Actividad por hora</Card.Title>
                <div className="chart-container">
                  {activityData && (
                    <Line data={activityData} options={chartOptions} />
                  )}
                </div>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="analytics-card">
                <Card.Title>Tiempo de respuesta promedio (simulado)</Card.Title>
                <div className="chart-container">
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ height: 250 }}
                  >
                    <h1 style={{ fontSize: '4rem', color: '#f44123' }}>
                      {avgResponse}s
                    </h1>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Ejemplo de gráfico adicional */}
          <Row className="mt-4">
            <Col md={12}>
              <Card className="analytics-card">
                <Card.Title>Eventos por trimestre</Card.Title>
                <div className="chart-container">
                  <Bar
                    data={{
                      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                      datasets: [
                        {
                          label: 'Eventos',
                          data: quarterEvents,
                          backgroundColor: 'rgba(153, 102, 255, 0.6)',
                          borderColor: 'rgba(153, 102, 255, 1)',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    </>
  );
};

export default AnalyticsPage;