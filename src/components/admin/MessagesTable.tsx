import React, { useEffect, useState } from 'react';
import {
  adminService,
  AdminMessageResponse,
} from '../../features/admin/services/admin.service';
import { FaEye, FaComments } from 'react-icons/fa';

interface MessagesTableProps {
  onView?: (message: AdminMessageResponse) => void;
}

const MessagesTable: React.FC<MessagesTableProps> = ({ onView }) => {
  const [messages, setMessages] = useState<AdminMessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await adminService.getMessages();
        let raw: unknown[] = [];
        if (Array.isArray(response)) {
          raw = response;
        } else if (Array.isArray(response?.data)) {
          raw = response.data;
        } else {
          raw = [];
        }
        // Normaliza a { id, attributes: {...} }
        const normalized = raw.map(m => {
          if (typeof m === 'object' && m !== null && 'attributes' in m) return m as AdminMessageResponse;
          if (typeof m === 'object' && m !== null && 'id' in m) {
            const { id, ...rest } = m as Record<string, unknown>;
            return { id, attributes: { ...rest } } as AdminMessageResponse;
          }
          return null;
        }).filter((m): m is AdminMessageResponse => !!m && (typeof m === 'object') && ('id' in m));
        setMessages(normalized);
      } catch (err) {
        console.error(err);
        setError('Error al cargar los mensajes');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0 d-flex align-items-center">
          <FaComments className="me-2" /> Mensajes del Sistema
        </h5>
      </div>

      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando mensajes...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">No hay mensajes registrados.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Empresa</th>
                  <th>Fecha creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {messages.map((m) => {
                  const attr = m.attributes;
                  return (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td className="fw-medium">{attr.name ?? '–'}</td>
                      <td>{attr.type ?? '—'}</td>
                      <td>
                        <span
                          className={`badge ${
                            attr.status_of_channel === 'active'
                              ? 'bg-success'
                              : 'bg-secondary'
                          }`}
                        >
                          {attr.status_of_channel === 'active'
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const company = attr.company;
                          if (company && typeof company === 'object') {
                            if ('data' in company && company.data && typeof company.data === 'object' && 'attributes' in company.data && company.data.attributes && typeof company.data.attributes === 'object' && 'name' in company.data.attributes && typeof company.data.attributes.name === 'string') {
                              return company.data.attributes.name;
                            }
                            if ('name' in company && typeof company.name === 'string') return company.name;
                            if ('description' in company && company.description && typeof company.description === 'object') {
                              if ('name' in company.description && typeof company.description.name === 'string') return company.description.name;
                              if ('nombre' in company.description && typeof company.description.nombre === 'string') return company.description.nombre;
                            }
                          }
                          return 'N/A';
                        })()}
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
                              onClick={() => onView(m)}
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

export default MessagesTable;