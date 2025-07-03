import React, { useEffect, useState } from 'react';
import { Container, Card, Spinner } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);



const METRIC_OPTIONS = ['LCP', 'FID', 'CLS', 'INP', 'TTFB'] as const;

const AdminDataPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<(typeof METRIC_OPTIONS)[number]>('LCP');

  const buildChart = (data: any[]) => {
    const labels: string[] = [];
    const values: number[] = [];
    data.forEach((m) => {
      const { value, timestamp } = m;
      const label = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      labels.push(label);
      values.push(value);
    });

    setChartData({
      labels,
      datasets: [
        {
          label: selectedMetric,
          data: values,
          backgroundColor: 'rgba(244,65,35,0.2)',
          borderColor: 'rgba(244,65,35,1)',
          fill: true,
        },
      ],
    });
  };

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(
          'http://localhost:1337/api/metrics?sort=timestamp:asc&pagination[limit]=100'
        );
        const json = await res.json();
        const raw = (json.data ?? []) as any[];

        // Normalizar: Strapi a veces devuelve datos planos o dentro de attributes
        const normalized = raw.map((item) => (item.attributes ? item.attributes : item))
          .filter(
            (a: any) => a && typeof a.value === 'number' && a.timestamp && a.name
          );

        const selected = normalized.filter((m) => m.name === selectedMetric);
        buildChart(selected);
      } catch (e) {
        console.error('Error fetching metrics', e);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const id = setInterval(fetchMetrics, 10000); // refresh cada 10s
    return () => clearInterval(id);
  }, [selectedMetric]);
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container fluid>
      <h2 className="mb-4">Métricas de rendimiento (Web Vitals)</h2>
      <div className="mb-3" style={{ maxWidth: 200 }}>
        <select
          className="form-select"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as any)}
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <Card className="p-4">
        {chartData ? (
          <div style={{ height: 400 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' as const },
                },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        ) : (
          <p>No hay datos disponibles</p>
        )}
      </Card>

      <div className="mt-4">
        <h5>¿Qué significa cada métrica?</h5>
        <ul>
          <li><strong>LCP</strong> – <em>Largest Contentful Paint</em>: tiempo hasta que el elemento de mayor tamaño se renderiza.</li>
          <li><strong>FID</strong> – <em>First Input Delay</em>: retraso entre la primera interacción del usuario y la respuesta del navegador.</li>
          <li><strong>CLS</strong> – <em>Cumulative Layout Shift</em>: inestabilidad visual acumulada (cambios de layout inesperados).</li>
          <li><strong>INP</strong> – <em>Interaction to Next Paint</em>: latencia de interacción completa (sucesor de FID).</li>
          <li><strong>TTFB</strong> – <em>Time To First Byte</em>: tiempo hasta recibir el primer byte desde el servidor.</li>
        </ul>
      </div>
    </Container>
  );
};

export default AdminDataPage;
