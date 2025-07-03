import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

import {
  FaUsers,
  FaBriefcase,
  FaChartBar,
  FaServer,
  FaCog,
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { adminService } from '../../features/admin/services/admin.service';
import { useAuthContext } from '../../contexts/AuthContext';

type SafeCompanyInfo = {
  name: string;
  members: { name: string; role?: string }[];
  description?: Record<string, string>;
};

type SafeUserInfo = { fullName: string; country?: string };

const AdminDashboard: React.FC = () => {
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [companiesCount, setCompaniesCount] = useState<number | null>(null);
  const [messagesCount, setMessagesCount] = useState<number | null>(null);

  const [messagesByType, setMessagesByType] = useState<Record<string, number>>(
    {}
  );
  const [companyInfos, setCompanyInfos] = useState<SafeCompanyInfo[]>([]);
  const [userInfos, setUserInfos] = useState<SafeUserInfo[]>([]);

  const { user } = useAuthContext();

  /* -------------------------------- DATA -------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, usersRes, messagesRes] = await Promise.all([
          adminService.getCompanies(),
          adminService.getUsers(),
          adminService.getMessages(),
        ]);

        const companiesArr = Array.isArray(companiesRes)
          ? companiesRes
          : companiesRes.data;
        const usersArr = Array.isArray(usersRes) ? usersRes : usersRes.data;
        const messagesArr = Array.isArray(messagesRes)
          ? messagesRes
          : messagesRes.data;

        setCompaniesCount(companiesArr.length);
        setUsersCount(usersArr.length);
        setMessagesCount(messagesArr.length);

        // Mensajes por tipo
        const typeCounts: Record<string, number> = {};
        messagesArr.forEach((m: any) => {
          const t = (m.attributes?.type ?? m.type ?? 'desconocido').toLowerCase();
          typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        setMessagesByType(typeCounts);

        // Información de empresas
        const compInfos: SafeCompanyInfo[] = companiesArr.map((c: any) => {
          const attr = c.attributes ?? c;
          const membersArr: any[] =
            attr.users_permissions_users?.data ?? attr.members ?? [];
          const mappedMembers = membersArr.map((m: any) => {
            const ma = m.attributes ?? m;
            return {
              name:
                ma.name ||
                ma.username ||
                `${ma.nombre ?? ''} ${ma.apellido ?? ''}`.trim() ||
                '—',
              role: ma.role || ma.rol,
            };
          });
          const { hash, usdt, nft_hash, ...restDesc } =
            (attr.description ?? {}) as Record<string, string>;
          return { name: attr.name, members: mappedMembers, description: restDesc };
        });
        setCompanyInfos(compInfos);

        // Información de usuarios
        const usrInfos: SafeUserInfo[] = usersArr.map((u: any) => {
          const attr = u.attributes ?? u;
          const fullName =
            `${attr.nombre ?? attr.firstName ?? ''} ${
              attr.apellido ?? attr.lastName ?? ''
            }`.trim() || attr.username || attr.email;
          return { fullName, country: attr.country ?? attr.pais ?? attr.location };
        });
        setUserInfos(usrInfos);

      } catch (err) {
        console.error('Error obteniendo datos', err);
      }
    };
    fetchData();
  }, []);

  /* ----------------------------- PDF REPORT ----------------------------- */
  const handleDownloadPdf = async () => {
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageHeight = doc.internal.pageSize.getHeight() - margin;
      let y = margin;

      // Título
      doc.setFontSize(18);
      doc.text('Informe del Sistema', margin, y);
      y += 30;

      // Métricas rápidas
      doc.setFontSize(12);
      const quickStats = [
        `Usuarios: ${usersCount ?? '-'}`,
        `Empresas: ${companiesCount ?? '-'}`,
        `Mensajes: ${messagesCount ?? '-'}`,
      ];
      quickStats.forEach((txt) => {
        doc.text(txt, margin, y);
        y += 18;
      });

      // Mensajes por tipo
      if (Object.keys(messagesByType).length) {
        doc.text('Mensajes por tipo:', margin, y);
        y += 14;
        Object.entries(messagesByType).forEach(([t, n]) => {
          doc.text(`• ${t}: ${n}`, margin + 12, y);
          y += 14;
        });
      }

      // Empresas y miembros
      if (companyInfos.length) {
        doc.text('Empresas y miembros:', margin, y);
        y += 14;
        for (const ci of companyInfos) {
          doc.text(`• ${ci.name}`, margin, y);
          y += 14;

          // Descripción
          if (ci.description) {
            for (const [k, v] of Object.entries(ci.description)) {
              if (!v) continue;
              doc.text(`   ${k}: ${v}`, margin + 12, y);
              y += 14;
              if (y > pageHeight) {
                doc.addPage();
                y = margin;
              }
            }
          }

          // Miembros
          for (const m of ci.members) {
            doc.text(
              `   - ${m.name}${m.role ? ` (${m.role})` : ''}`,
              margin + 12,
              y
            );
            y += 14;
            if (y > pageHeight) {
              doc.addPage();
              y = margin;
            }
          }
          y += 8;
          if (y > pageHeight) {
            doc.addPage();
            y = margin;
          }
        }
      }

      // Usuarios
      if (userInfos.length) {
        doc.text('Usuarios:', margin, y);
        y += 14;
        for (const ui of userInfos) {
          doc.text(
            `• ${ui.fullName}${ui.country ? ` - ${ui.country}` : ''}`,
            margin,
            y
          );
          y += 14;
          if (y > pageHeight) {
            doc.addPage();
            y = margin;
          }
        }
      }

      // Gráfico (nueva página)
      doc.addPage();
      y = margin;
      const chartEl = document.querySelector('#chartReport') as HTMLElement | null;
      if (chartEl) {
        const canvas = await html2canvas(chartEl);
        const imgData = canvas.toDataURL('image/png');
        const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', margin, y, pageWidth, imgHeight);
      }

      doc.save('informe_admin.pdf');
    } catch (e) {
      console.error('Error generando PDF:', e);
    }
  };

  /* -------------------------------- UI --------------------------------- */
  const adminCards = [
    {
      title: 'Usuarios',
      description: 'Gestión de usuarios',
      icon: <FaUsers size={32} />,
      count: usersCount ?? '…',
      link: '/admin/users',
      color: '#4A6FDC',
    },
    {
      title: 'Empresas',
      description: 'Empresas registradas',
      icon: <FaBriefcase size={32} />,
      count: companiesCount ?? '…',
      link: '/admin/companies',
      color: '#F44123',
    },
    {
      title: 'Estadísticas',
      description: 'Métricas del sistema',
      icon: <FaChartBar size={32} />,
      count: '',
      link: '/admin/statistics',
      color: '#2DA771',
    },
    {
      title: 'Datos',
      description: 'Gestión de datos',
      icon: <FaServer size={32} />,
      count: '',
      link: '/admin/data',
      color: '#E9B949',
    },
    {
      title: 'Configuración',
      description: 'Configuración global',
      icon: <FaCog size={32} />,
      count: '',
      link: '/admin/settings',
      color: '#6E6E6E',
    },
  ];

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold d-inline">Panel de Administración</h1>
          <button
            className="btn btn-outline-secondary btn-sm float-end"
            onClick={handleDownloadPdf}
          >
            Descargar PDF
          </button>
          <p className="text-muted">
            Bienvenido, {user?.nombre || user?.username || 'Administrador'}.
          </p>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="row g-4">
        {adminCards.map((card, idx) => (
          <div key={idx} className="col-md-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div
                    style={{
                      backgroundColor: `${card.color}20`,
                      color: card.color,
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h5 className="card-title mb-0">{card.title}</h5>
                    <p className="card-text text-muted small mb-0">
                      {card.description}
                    </p>
                  </div>
                </div>
                {card.count && <h3 className="mb-3 fw-bold">{card.count}</h3>}
                <a href={card.link} className="stretched-link"></a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de barras */}
      <div className="row mt-5">
        <div className="col-12 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">Resumen General</h5>
            </div>
            <div className="card-body">
              {usersCount !== null &&
              companiesCount !== null &&
              messagesCount !== null ? (
                <div id="chartReport">
                  <Bar
                    data={{
                      labels: ['Usuarios', 'Empresas', 'Mensajes'],
                      datasets: [
                        {
                          label: 'Totales',
                          data: [usersCount, companiesCount, messagesCount],
                          backgroundColor: ['#4A6FDC', '#F44123', '#2DA771'],
                        },
                      ],
                    }}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
              ) : (
                <p className="text-muted">Cargando métricas…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;