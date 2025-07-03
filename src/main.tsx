import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles/main.css';
import router from './routes';
import { initWebVitals } from './utils/analytics';
import { AuthProvider } from './contexts/AuthContext';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);


root.render(
  <React.StrictMode>
    <AuthProvider>
    <RouterProvider router={router} />
      </AuthProvider>
  </React.StrictMode>
);

// Iniciar medición Web Vitals
initWebVitals();
