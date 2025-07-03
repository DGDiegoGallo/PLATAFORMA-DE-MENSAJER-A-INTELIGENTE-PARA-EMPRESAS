import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import UsersTable from '../../components/admin/UsersTable';
import { AdminUserResponse } from '../../features/admin/services/admin.service';
import { adminService } from '../../features/admin/services/admin.service';
import { toast } from 'react-toastify';

const UserDetailModal: React.FC<{user: AdminUserResponse; onClose: () => void}> = ({ user, onClose }) => {
  const attr: any = (user as any).attributes ?? user;
  const companyName = attr.company?.data?.attributes?.name ?? attr.company?.name ?? '—';
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalles del Usuario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ul className="list-unstyled">
          <li><strong>ID:</strong> {user.id}</li>
          <li><strong>Nombre:</strong> {attr.nombre ? `${attr.nombre} ${attr.apellido}` : attr.username ?? '—'}</li>
          <li><strong>Email:</strong> {attr.email ?? '—'}</li>
          <li><strong>Rol:</strong> {attr.rol ?? '—'}</li>
          <li><strong>Estado:</strong> {attr.blocked ? 'Bloqueado' : 'Activo'}</li>
          <li><strong>Empresa:</strong> {companyName}</li>
          <li><strong>Creado:</strong> {attr.createdAt ? new Date(attr.createdAt).toLocaleString() : '—'}</li>
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

const UsersPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const handleView = (user: AdminUserResponse) => {
    setSelectedUser(user);
  };

  const handleDelete = (user: AdminUserResponse) => {
    setDeleteUser(user);
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await adminService.deleteUser(deleteUser.id);
      toast.success('Usuario eliminado correctamente');
      setDeleteUser(null);
      setRefreshKey(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar usuario');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleBlock = (user: AdminUserResponse) => {
    console.log(user.attributes.blocked ? 'Desbloquear usuario:' : 'Bloquear usuario:', user);
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold">Gestión de Usuarios</h1>
          <p className="text-muted">
            Administre todos los usuarios registrados en el sistema.
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <UsersTable
            key={refreshKey}
            onView={handleView}
            onDelete={handleDelete}
            onToggleBlock={handleToggleBlock}
            roleBadgeClassName="bg-orange"
          />
        </div>
      </div>
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {deleteUser && (
        <Modal show onHide={() => setDeleteUser(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar eliminación</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            ¿Estás seguro de que deseas eliminar al usuario <b>{deleteUser.attributes.nombre} {deleteUser.attributes.apellido}</b>?
            Esta acción no se puede deshacer.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setDeleteUser(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;