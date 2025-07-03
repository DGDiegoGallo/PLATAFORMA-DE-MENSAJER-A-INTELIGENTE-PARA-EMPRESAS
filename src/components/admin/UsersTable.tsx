import React, { useEffect, useState } from 'react';
import {
  adminService,
  AdminUserResponse,
} from '../../features/admin/services/admin.service';
import {
  FaUsers,
  FaLock,
  FaLockOpen,
  FaEye,
  FaTrash,
} from 'react-icons/fa';

interface UsersTableProps {
  onView?: (user: AdminUserResponse) => void;
  onDelete?: (user: AdminUserResponse) => void;
  onToggleBlock?: (user: AdminUserResponse) => void;
  roleBadgeClassName?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({
  onView,
  onDelete,
  onToggleBlock,
  roleBadgeClassName = '',
}) => {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getUsers();
        let raw: unknown[] = [];
        if (Array.isArray(response)) {
          raw = response;
        } else if (Array.isArray(response?.data)) {
          raw = response.data;
        } else {
          raw = [];
        }
        const normalized = raw.map(u => {
          if (typeof u === 'object' && u !== null && 'attributes' in u) return u as AdminUserResponse;
          if (typeof u === 'object' && u !== null && 'id' in u) {
            const { id, ...rest } = u as Record<string, unknown>;
            return { id, attributes: { ...rest } } as AdminUserResponse;
          }
          return null;
        }).filter((u): u is AdminUserResponse => !!u && (typeof u === 'object') && ('id' in u));
        console.log('Usuarios normalizados:', normalized);
        setUsers(normalized);
      } catch (e) {
        console.error(e);
        setError('Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0 d-flex align-items-center">
          <FaUsers className="me-2" /> Usuarios del Sistema
        </h5>
      </div>

      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">No hay usuarios registrados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Empresa</th>
                  <th>Fecha registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const attr = u.attributes;
                  return (
                    <tr key={u.id}>
                      <td>{u.id}</td>

                      <td className="fw-medium">
                        {attr.nombre && attr.apellido
                          ? `${attr.nombre} ${attr.apellido}`
                          : attr.username || 'No disponible'}
                      </td>

                      <td>{attr.email || 'No disponible'}</td>

                      <td>
                        <span
                          className={`badge ${roleBadgeClassName}`.trim()}
                          style={{ background: roleBadgeClassName ? undefined : '#F44123', color: '#fff', fontWeight: 600, fontSize: 14 }}
                        >
                          {(attr.rol || attr.role?.name) ? (attr.rol || attr.role?.name) : 'No disponible'}
                        </span>
                      </td>

                      <td>
                        {attr.blocked ? (
                          <span className="badge bg-danger">Bloqueado</span>
                        ) : (
                          <span className="badge bg-success">Activo</span>
                        )}
                      </td>

                      <td>
                        {(() => {
                          const company = attr.company;
                          if (company?.data?.attributes?.name) return company.data.attributes.name;
                          if (company?.name && typeof company.name === 'string') return company.name;
                          if (company?.description && typeof company.description === 'object') {
                            if ('name' in company.description && typeof company.description.name === 'string') return company.description.name;
                            if ('nombre' in company.description && typeof company.description.nombre === 'string') return company.description.nombre;
                          }
                          return 'No disponible';
                        })()}
                      </td>

                      <td>
                        {attr.createdAt
                          ? new Date(attr.createdAt).toLocaleDateString('es-ES')
                          : 'No disponible'}
                      </td>

                      <td>
                        <div className="btn-group">
                          {onView && (
                            <button
                              onClick={() => onView(u)}
                              className="btn btn-sm btn-outline-secondary"
                              title="Ver detalles"
                            >
                              <FaEye />
                            </button>
                          )}
                          {onToggleBlock && (
                            <button
                              onClick={() => onToggleBlock(u)}
                              className={`btn btn-sm ${attr.blocked ? 'btn-outline-success' : 'btn-outline-warning'}`}
                              title={attr.blocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
                            >
                              {attr.blocked ? <FaLockOpen /> : <FaLock />}
                            </button>
                          )}

                          {onDelete && (
                            <button
                              onClick={() => onDelete(u)}
                              className="btn btn-sm btn-outline-danger"
                              title="Eliminar"
                            >
                              <FaTrash />
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

export default UsersTable;