import React, { useState, useEffect, ChangeEvent } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaDoorOpen, FaUser, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import API_URL from '../../config/api';

const LOCAL_STORAGE_KEY = 'profileImage';

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
  const navigate = useNavigate();

  // Load image from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setProfileImage(stored);
    }
  }, []);

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
      let userObj: Record<string, unknown> = user as Record<string, unknown>;
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
        alert('Datos actualizados correctamente');
        setEditMode(false);
        window.location.reload();
      }
    } catch {
      alert('Error al actualizar los datos');
    } finally {
      setSaving(false);
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

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Datos del usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {user ? (
            <>
              {/* Avatar */}
              <div className="d-flex flex-column align-items-center mb-3">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Avatar"
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="d-flex justify-content-center align-items-center bg-secondary text-white"
                    style={{ width: 80, height: 80, borderRadius: '50%' }}
                  >
                    <FaUser size={36} />
                  </div>
                )}
                {/* Upload */}
                <input
                  type="file"
                  accept="image/*"
                  className="form-control mt-2"
                  onChange={handleImageUpload}
                />
              </div>

              {!editMode ? (
                <ul className="list-unstyled mb-3">
                  <li><strong>Nombre:</strong> {`${user.nombre || ''} ${user.apellido || ''}`.trim() || user.fullName || user.username}</li>
                  <li><strong>Email:</strong> {user.email}</li>
                  {user.rol && <li><strong>Rol:</strong> {getRoleLabel(user.rol)}</li>}
                  {user.documentoID && <li><strong>DNI:</strong> {user.documentoID}</li>}
                </ul>
              ) : (
                <Form className="mb-3">
                  <Form.Group className="mb-2 d-flex align-items-center">
                    <Form.Label className="me-2 mb-0">Nombre</Form.Label>
                    <Form.Control name="nombre" value={editData.nombre} onChange={handleEditChange} />
                    <FaEdit className="ms-2 text-secondary" />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Apellido</Form.Label>
                    <Form.Control name="apellido" value={editData.apellido} onChange={handleEditChange} />
                  </Form.Group>
                  <Form.Group className="mb-2 d-flex align-items-center">
                    <Form.Label className="me-2 mb-0">Email</Form.Label>
                    <Form.Control name="email" value={editData.email} onChange={handleEditChange} />
                    <FaEdit className="ms-2 text-secondary" />
                  </Form.Group>
                </Form>
              )}

              {/* Cambio de contraseña real (simulado PUT) */}
              <div className="mb-2">
                <label className="form-label fw-bold">Cambiar contraseña</label>
                <div className="d-flex flex-column gap-2">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Antigua contraseña"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repite la nueva contraseña"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                  <Button 
                    variant="outline-primary" 
                    className="mt-2 align-self-end" 
                    onClick={async () => {
                      if (!oldPassword || !newPassword || !repeatPassword) {
                        alert('Completa todos los campos de contraseña');
                        return;
                      }
                      if (newPassword !== repeatPassword) {
                        alert('Las contraseñas nuevas no coinciden');
                        return;
                      }
                      try {
                        const userStr = localStorage.getItem('user');
                        let userObj: Record<string, unknown> = user as Record<string, unknown>;
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
                          alert('Contraseña actualizada correctamente');
                          setOldPassword('');
                          setNewPassword('');
                          setRepeatPassword('');
                        }
                      } catch {
                        alert('Error al actualizar la contraseña');
                      }
                    }}
                    disabled={saving}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p>No hay usuario en sesión.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!editMode ? (
            <>
              <Button variant="outline-primary" onClick={() => setEditMode(true)}>
                Editar datos
              </Button>
              <Button variant="secondary" onClick={() => setShow(false)}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button variant="secondary" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserMenu;
