import React, { useEffect, useState } from 'react';
import {
  adminService,
  AdminCompanyResponse,
} from '../../features/admin/services/admin.service';
import { FaEye, FaBuilding } from 'react-icons/fa';

interface CompaniesTableProps {
  onView?: (company: AdminCompanyResponse) => void;
}

const CompaniesTable: React.FC<CompaniesTableProps> = ({ onView }) => {
  const [companies, setCompanies] = useState<AdminCompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await adminService.getCompanies();
        let raw: any[] = [];
        if (Array.isArray(response)) {
          raw = response;
        } else if (Array.isArray(response?.data)) {
          raw = response.data;
        } else {
          raw = [];
        }
        // Normaliza a { id, attributes: {...} }
        const normalized = raw.map(c => {
          if (c.attributes) return c;
          const { id, ...rest } = c;
          return { id, attributes: { ...rest } };
        });
        setCompanies(normalized);
      } catch (err) {
        console.error(err);
        setError('Error al cargar las empresas');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0 d-flex align-items-center">
          <FaBuilding className="me-2" /> Empresas Registradas
        </h5>
      </div>

      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando empresas...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">No hay empresas registradas.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Sector</th>
                  <th>Email</th>
                  <th>País</th>
                  <th>Usuarios</th>
                  <th>Fecha creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {companies.map((c) => {
                  const attr = c.attributes || {};

                  return (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td className="fw-medium">{attr.name ?? 'Sin nombre'}</td>
                      <td>{attr.description?.sector as string ?? attr.sector ?? 'no disponible'}</td>
                      <td>{attr.description?.email as string ?? attr.email as string ?? 'no disponible'}</td>
                      <td>{attr.description?.country as string ?? attr.country as string ?? 'no disponible'}</td>
                      <td>
                        {(() => {
                          // Cuenta usuarios vinculados en distintos campos + creador
                          const fromUsersPermissions =
                            attr.users_permissions_users?.data?.length ?? 0;
                          const fromUsers = (attr.users as any)?.data?.length ?? (attr.users as any[])?.length ?? 0;
                          const fromMembers = (attr.members as any[])?.length ?? 0;
                          // Si existe un usuario creador/owner, súmalo (evita duplicar si ya está en otros grupos)
                          const creatorExists = attr.user || attr.owner || attr.createdBy || attr.created_by;
                          const creatorCount = creatorExists ? 1 : 0;
                          return fromUsersPermissions + fromUsers + fromMembers + creatorCount;
                        })()}{' '}usuarios
                      </td>
                      <td>
                        {attr.createdAt
                          ? new Date(attr.createdAt).toLocaleDateString('es-ES')
                          : '—'}
                      </td>
                      <td>
                        <div className="btn-group">
                          {onView && (
                            <button
                              onClick={() => onView(c)}
                              className="btn btn-sm btn-outline-secondary"
                              title="Ver detalles"
                            >
                              <FaEye />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesTable;