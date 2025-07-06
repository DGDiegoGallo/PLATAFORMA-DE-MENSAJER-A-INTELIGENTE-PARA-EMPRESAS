import { onCLS, onFID, onLCP, onINP, onTTFB, Metric } from 'web-vitals';
import API_URL from '../config/api';

interface MetricPayload {
  name: string;
  value: number;
  page: string;
  device: 'desktop' | 'mobile';
  timestamp: string;
}

const sendMetric = (metric: Metric) => {
  const payload: MetricPayload = {
    name: metric.name,
    value: metric.value,
    page: window.location.pathname,
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    timestamp: new Date().toISOString(),
  };

  // Strapi v4 espera { data: {...} }
  fetch(`${API_URL}/api/metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload }),
  }).catch(() => {
    /* Silence network errors en demo */
  });
};

export const initWebVitals = () => {
  onCLS(sendMetric);
  onFID(sendMetric); 
  onLCP(sendMetric);
  onINP(sendMetric);
  onTTFB(sendMetric);
};