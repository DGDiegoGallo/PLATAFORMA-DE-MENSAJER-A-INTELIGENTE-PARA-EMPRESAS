import React, { useState } from 'react';
import { Container, Card, Button, Modal, Form } from 'react-bootstrap'; // Row y Col eliminados
import { FaPlus } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import UsersTable, { User } from '../../components/company/UsersTable';
import Pagination from '../../components/ui/Pagination';
import './UsersPage.css'; // Importar el archivo CSS

const UsersPage: React.FC = () => {
  // Mock data for users
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      fullName: 'Laura Gómez',
      email: 'laura.gomez@example.com',
      phone: '+54 9 11 1234 5678',
      documentId: '30.123.456'
    },
    {
      id: '2',
      fullName: 'Martín Fernández',
      email: 'martin.fernandez@example.com',
      phone: '+54 9 11 8765 4321',
      documentId: '32.987.654'
    },
    {
      id: '3',
      fullName: 'Sofía Torres',
      email: 'sofia.torres@example.com',
      phone: '+54 9 11 5555 5555',
      documentId: '35.111.222'
    },
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2; // Mock total pages

  // Modal state for adding/editing users
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentUser, setCurrentUser] = useState<User>({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    documentId: ''
  });

  // Handle view user details (optional, if needed)
  const handleViewUser = (user: User) => {
    console.log('View user:', user);
    // Implement view logic here if a separate detail view is required
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setCurrentUser(user);
    setShowModal(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${user.fullName}?`)) {
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  // Handle add new user
  const handleAddUser = () => {
    setModalMode('add');
    setCurrentUser({
      id: '',
      fullName: '',
      email: '',
      phone: '',
      documentId: ''
    });
    setShowModal(true);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save user
  const handleSaveUser = () => {
    if (!currentUser.fullName || !currentUser.email) {
      // Basic validation, can be expanded
      alert('Nombre completo y correo electrónico son obligatorios.');
      return;
    }
    if (modalMode === 'add') {
      const newUser = {
        ...currentUser,
        id: Date.now().toString() // Simple ID generation
      };
      setUsers([...users, newUser]);
    } else {
      setUsers(users.map(user => 
        user.id === currentUser.id ? currentUser : user
      ));
    }
    setShowModal(false);
  };

  return (
    <DashboardLayout companyName="Nombre de la empresa">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: 'var(--color-text-primary)' }}>Usuarios</h2>
          <Button 
            variant="danger" 
            className="d-flex align-items-center gap-2 add-user-btn"
            onClick={handleAddUser}
          >
            <FaPlus size={14} />
            <span>Nuevo usuario</span>
          </Button>
        </div>
        
        <Card 
          className="shadow-sm mb-4 users-card" // Aplicar clase users-card
        >
          <Card.Body className="p-0">
            <UsersTable 
              users={users} // Pass a slice for pagination if implementing client-side pagination
              onView={handleViewUser} // Pass if you implement a view detail modal/page
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          </Card.Body>
        </Card>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Container>

      {/* Modal for adding/editing users */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="user-modal"> {/* Aplicar clase user-modal */}
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? 'Agregar Nuevo Usuario' : 'Editar Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre completo</Form.Label>
              <Form.Control 
                type="text" 
                name="fullName"
                value={currentUser.fullName}
                onChange={handleInputChange}
                placeholder="Ingrese nombre completo"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Correo electrónico</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                value={currentUser.email}
                onChange={handleInputChange}
                placeholder="Ingrese correo electrónico"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control 
                type="tel" 
                name="phone"
                value={currentUser.phone}
                onChange={handleInputChange}
                placeholder="Ingrese número de teléfono"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Documento de Identidad</Form.Label>
              <Form.Control 
                type="text" 
                name="documentId"
                value={currentUser.documentId}
                onChange={handleInputChange}
                placeholder="Ingrese documento de identidad"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveUser}>
            {modalMode === 'add' ? 'Guardar Usuario' : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default UsersPage;
