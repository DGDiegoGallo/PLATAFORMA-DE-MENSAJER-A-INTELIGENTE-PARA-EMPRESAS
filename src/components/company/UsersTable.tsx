import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  documentId: string;
}

interface UsersTableProps {
  users: User[];
  onView?: (user: User) => void; // Optional: if view details functionality is needed
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, onView, onEdit, onDelete }) => {
  return (
    <Table hover responsive className="align-middle">
      <thead style={{ backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }}>
        <tr>
          <th>Nombre y Apellido</th>
          <th>Correo Electrónico</th>
          <th>Teléfono</th>
          <th>Documento</th>
          <th className="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.length > 0 ? (
          users.map(user => (
            <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>{user.documentId}</td>
              <td className="text-center">
                {onView && (
                  <Button variant="link" onClick={() => onView(user)} className="p-1 me-2" title="Ver">
                    <FaEye size={18} style={{ color: 'var(--color-dark-icons)' }} />
                  </Button>
                )}
                <Button variant="link" onClick={() => onEdit(user)} className="p-1 me-2" title="Editar">
                  <FaEdit size={18} style={{ color: 'var(--color-dark-icons)' }} />
                </Button>
                <Button variant="link" onClick={() => onDelete(user)} className="p-1" title="Eliminar">
                  <FaTrash size={18} style={{ color: 'var(--color-primary)' }} />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No hay usuarios para mostrar.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export default UsersTable;
