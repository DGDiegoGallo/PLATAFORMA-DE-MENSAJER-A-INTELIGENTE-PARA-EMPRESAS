import React, { useState, useEffect, ChangeEvent } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaDoorOpen, FaUser, FaEdit, FaCheck, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import API_URL from '../../config/api';
import './UserMenu.css';

const LOCAL_STORAGE_KEY = 'profileImage';

// Tipos para las modales
interface ModalState {
  show: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  onConfirm?: () => void;
}

const UserMenu: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [show, setShow] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    email: user?.email || ''
  });
  
  // Estado para manejar las modales de notificación
  const [modalState, setModalState] = useState<ModalState>({
    show: false,
    type: 'success',
    title: '',
    message: '',
  });

  const navigate = useNavigate();

  // Load image from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setProfileImage(stored);
    }
  }, []);

  // Función para mostrar modales
  const showModal = (type: 'success' | 'error' | 'warning', title: string, message: string, onConfirm?: () => void) => {
    setModalState({
      show: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  // Función para cerrar modal
  const closeModal = () => {
    setModalState(prev => ({ ...prev, show: false }));
    // Ejecutar callback si existe
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Store in LS & state
      localStorage.setItem(LOCAL_STORAGE_KEY, base64);
      setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    // Primero ejecutar logout del contexto para actualizar el estado
    logout();
    setShow(false);
    // Si el usuario es admin, redirige siempre a login
    const adminRoles = ['admin', 'administrator', 'superadmin'];
    if (adminRoles.includes((user?.rol || '').toLowerCase())) {
      navigate('/login', { replace: true });
    } else {
      // Si no es admin, mantén el comportamiento actual (redirige a login también, pero puedes cambiarlo si quieres)
      navigate('/login', { replace: true });
    }
  };

  // Traducción de roles
  const getRoleLabel = (rol: string) => {
    if (!rol) return '';
    if (rol.toLowerCase() === 'company') return 'Empresa';
    if (rol.toLowerCase() === 'admin') return 'Administrador';
    if (rol.toLowerCase() === 'agente') return 'Agente';
    if (rol.toLowerCase() === 'empleado') return 'Empleado';
    return rol;
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // PUT a Strapi (solo nombre, apellido, email)
      const userStr = localStorage.getItem('user');
      let userObj: Record<string, unknown> = user as unknown as Record<string, unknown>;
      if (userStr) userObj = JSON.parse(userStr);
      if (userObj && userObj.id) {
        const payload = {
          nombre: editData.nombre,
          apellido: editData.apellido,
          email: editData.email
        };
        await fetch(`${API_URL}/api/users/${userObj.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        // Actualizar localStorage
        userObj.nombre = editData.nombre;
        userObj.apellido = editData.apellido;
        userObj.email = editData.email;
        localStorage.setItem('user', JSON.stringify(userObj));
        
        showModal('success', '¡Éxito!', 'Datos actualizados correctamente', () => {
          setEditMode(false);
          window.location.reload();
        });
      }
    } catch {
      showModal('error', 'Error', 'Error al actualizar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !repeatPassword) {
      showModal('warning', 'Campos incompletos', 'Completa todos los campos de contraseña');
      return;
    }
    if (newPassword !== repeatPassword) {
      showModal('error', 'Error de validación', 'Las contraseñas nuevas no coinciden');
      return;
    }
    try {
      const userStr = localStorage.getItem('user');
      let userObj: Record<string, unknown> = user as unknown as Record<string, unknown>;
      if (userStr) userObj = JSON.parse(userStr);
      if (userObj && userObj.id) {
        await fetch(`${API_URL}/api/users/${userObj.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: oldPassword,
            password: newPassword,
            passwordConfirmation: repeatPassword
          })
        });
        
        showModal('success', '¡Éxito!', 'Contraseña actualizada correctamente', () => {
          setOldPassword('');
          setNewPassword('');
          setRepeatPassword('');
        });
      }
    } catch {
      showModal('error', 'Error', 'Error al actualizar la contraseña');
    }
  };

  return (
    <>
      {/* Botón para ver datos del usuario */}
      <button
        className="btn btn-link p-1 me-3 position-relative"
        style={{ color: 'var(--color-dark-icons)' }}
        onClick={() => setShow(true)}
        aria-label="Datos del usuario"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt="Avatar"
            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <FaUser size={20} />
        )}
      </button>

      {/* Botón de cerrar sesión */}
      <button
        className="btn btn-link p-1 me-3 position-relative"
        style={{ color: '#dc3545' }}
        onClick={handleLogout}
        aria-label="Cerrar sesión"
      >
        <FaDoorOpen size={20} />
      </button>

      {/* Modal principal del usuario */}
      <Modal 
        show={show} 
        onHide={() => setShow(false)} 
        centered 
        size="lg"
        backdrop="static"
        className="user-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            <FaUser className="text-primary" />
            Datos del usuario
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-3">
          {user ? (
            <>
              {/* Avatar */}
              <div className="d-flex flex-column align-items-center mb-4">
                <div className="position-relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Avatar"
                      style={{ 
                        width: 100, 
                        height: 100, 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '4px solid var(--bs-primary-bg-subtle)'
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex justify-content-center align-items-center bg-secondary text-white"
                      style={{ 
                        width: 100, 
                        height: 100, 
                        borderRadius: '50%',
                        border: '4px solid var(--bs-primary-bg-subtle)'
                      }}
                    >
                      <FaUser size={40} />
                    </div>
                  )}
                </div>
                {/* Upload */}
                <div className="mt-3 w-100" style={{ maxWidth: '300px' }}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-muted small">
                      <FaEdit className="me-1" />
                      Cambiar foto de perfil
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="form-control-sm"
                    />
                  </Form.Group>
                </div>
              </div>

              {!editMode ? (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 bg-light">
                      <label className="form-label fw-bold text-muted small mb-1">NOMBRE COMPLETO</label>
                      <div className="fw-semibold">
                        {`${user.nombre || ''} ${user.apellido || ''}`.trim() || user.fullName || user.username}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded-3 p-3 bg-light">
                      <label className="form-label fw-bold text-muted small mb-1">EMAIL</label>
                      <div className="fw-semibold">{user.email}</div>
                    </div>
                  </div>
                  {user.rol && (
                    <div className="col-md-6">
                      <div className="border rounded-3 p-3 bg-light">
                        <label className="form-label fw-bold text-muted small mb-1">ROL</label>
                        <div className="fw-semibold">{getRoleLabel(user.rol)}</div>
                      </div>
                    </div>
                  )}
                  {user.documentoID && (
                    <div className="col-md-6">
                      <div className="border rounded-3 p-3 bg-light">
                        <label className="form-label fw-bold text-muted small mb-1">DNI</label>
                        <div className="fw-semibold">{user.documentoID}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <FaEdit className="me-1 text-primary" />
                        Nombre
                      </Form.Label>
                      <Form.Control 
                        name="nombre" 
                        value={editData.nombre} 
                        onChange={handleEditChange}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <FaEdit className="me-1 text-primary" />
                        Apellido
                      </Form.Label>
                      <Form.Control 
                        name="apellido" 
                        value={editData.apellido} 
                        onChange={handleEditChange}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        <FaEdit className="me-1 text-primary" />
                        Email
                      </Form.Label>
                      <Form.Control 
                        name="email" 
                        value={editData.email} 
                        onChange={handleEditChange}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </div>
                </div>
              )}

              {/* Cambio de contraseña */}
              <div className="border-top pt-4">
                <h6 className="fw-bold mb-3 text-primary">
                  <FaCheckCircle className="me-2" />
                  Cambiar contraseña
                </h6>
                <div className="row g-3">
                  <div className="col-12">
                    <Form.Group>
                      <Form.Label className="fw-semibold">Contraseña actual</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Ingresa tu contraseña actual"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold">Nueva contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Ingresa nueva contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-semibold">Confirmar contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirma nueva contraseña"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="form-control-lg"
                      />
                    </Form.Group>
                  </div>
                  <div className="col-12">
                    <Button 
                      variant="primary" 
                      onClick={handlePasswordChange}
                      disabled={saving}
                      className="btn-lg"
                    >
                      <FaCheck className="me-2" />
                      {saving ? 'Guardando...' : 'Cambiar contraseña'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <FaExclamationTriangle className="text-warning mb-2" size={40} />
              <p className="text-muted">No hay usuario en sesión.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          {!editMode ? (
            <>
              <Button 
                variant="outline-primary" 
                onClick={() => setEditMode(true)}
                className="me-2"
              >
                <FaEdit className="me-2" />
                Editar datos
              </Button>
              <Button variant="secondary" onClick={() => setShow(false)}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="success" 
                onClick={handleSaveEdit} 
                disabled={saving}
                className="me-2"
              >
                <FaCheck className="me-2" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button variant="outline-secondary" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal de notificaciones */}
      <Modal 
        show={modalState.show} 
        onHide={closeModal}
        centered
        size="sm"
        backdrop="static"
        className="notification-modal"
      >
        <Modal.Body className="text-center p-4">
          <div className="mb-3">
            {modalState.type === 'success' && (
              <div className="text-success">
                <FaCheckCircle size={48} className="mb-2" />
              </div>
            )}
            {modalState.type === 'error' && (
              <div className="text-danger">
                <FaExclamationTriangle size={48} className="mb-2" />
              </div>
            )}
            {modalState.type === 'warning' && (
              <div className="text-warning">
                <FaExclamationTriangle size={48} className="mb-2" />
              </div>
            )}
          </div>
          <h5 className="modal-title fw-bold mb-2">{modalState.title}</h5>
          <p className="text-muted mb-3">{modalState.message}</p>
          <Button 
            variant={modalState.type === 'success' ? 'success' : modalState.type === 'error' ? 'danger' : 'warning'}
            onClick={closeModal}
            className="btn-lg px-4"
          >
            <FaCheck className="me-2" />
            Entendido
          </Button>
        </Modal.Body>
      </Modal>


    </>
  );
};

export default UserMenu;
