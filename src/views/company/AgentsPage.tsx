import React, { useState } from 'react';
import { Container, Card, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AgentsTable, { Agent } from '../../components/company/AgentsTable';
import Pagination from '../../components/ui/Pagination';
import './AgentsPage.css';

const AgentsPage: React.FC = () => {
  // Mock data for agents
  const [agents, setAgents] = useState<Agent[]>([
    { 
      id: '1', 
      name: 'Juan Pérez', 
      email: 'juan.perez@example.com', 
      phone: '+1 234 567 8901', 
      role: 'Admin' 
    },
    { 
      id: '2', 
      name: 'María López', 
      email: 'maria.lopez@example.com', 
      phone: '+1 234 567 8902', 
      role: 'Supervisor' 
    },
    { 
      id: '3', 
      name: 'Carlos Rodríguez', 
      email: 'carlos.rodriguez@example.com', 
      phone: '+1 234 567 8903', 
      role: 'Agente' 
    },
    { 
      id: '4', 
      name: 'Ana Martínez', 
      email: 'ana.martinez@example.com', 
      phone: '+1 234 567 8904', 
      role: 'Agente' 
    },
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // Mock total pages

  // Modal state for adding/editing agents
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentAgent, setCurrentAgent] = useState<Agent>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: 'Agente'
  });

  // Handle view agent details
  const handleViewAgent = (agent: Agent) => {
    console.log('View agent:', agent);
    // Implement view logic here
  };

  // Handle edit agent
  const handleEditAgent = (agent: Agent) => {
    setModalMode('edit');
    setCurrentAgent(agent);
    setShowModal(true);
  };

  // Handle delete agent
  const handleDeleteAgent = (agent: Agent) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${agent.name}?`)) {
      setAgents(agents.filter(a => a.id !== agent.id));
    }
  };

  // Handle add new agent
  const handleAddAgent = () => {
    setModalMode('add');
    setCurrentAgent({
      id: '',
      name: '',
      email: '',
      phone: '',
      role: 'Agente'
    });
    setShowModal(true);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentAgent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save agent
  const handleSaveAgent = () => {
    if (modalMode === 'add') {
      // Generate a new ID for the agent
      const newAgent = {
        ...currentAgent,
        id: Date.now().toString()
      };
      setAgents([...agents, newAgent]);
    } else {
      // Update existing agent
      setAgents(agents.map(agent => 
        agent.id === currentAgent.id ? currentAgent : agent
      ));
    }
    setShowModal(false);
  };

  return (
    <DashboardLayout companyName="Nombre de la empresa">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: '#000000' }}>Agentes</h2>
          <Button 
            variant="danger" 
            className="d-flex align-items-center gap-2 add-agent-btn"
            onClick={handleAddAgent}
          >
            <FaPlus size={14} />
            <span>Nuevo agente</span>
          </Button>
        </div>
        
        <Card 
          className="border-0 shadow-sm mb-4 agents-card"
        >
          <Card.Body className="p-0">
            <AgentsTable 
              agents={agents}
              onView={handleViewAgent}
              onEdit={handleEditAgent}
              onDelete={handleDeleteAgent}
            />
          </Card.Body>
        </Card>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Container>

      {/* Modal for adding/editing agents */}
      <Modal show={showModal} onHide={() => setShowModal(false)} className="agent-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? 'Agregar nuevo agente' : 'Editar agente'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre completo</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={currentAgent.name}
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
                value={currentAgent.email}
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
                value={currentAgent.phone}
                onChange={handleInputChange}
                placeholder="Ingrese número de teléfono"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Select 
                name="role"
                value={currentAgent.role}
                onChange={handleInputChange}
              >
                <option value="Admin">Admin</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Agente">Agente</option>
              </Form.Select>
            </Form.Group>

            <Row className="mb-3">
              <Col>
                <Form.Label>Permisos</Form.Label>
                <div className="border rounded p-3">
                  <Form.Check 
                    type="checkbox" 
                    id="perm-profile" 
                    label="Gestionar datos básicos y perfil" 
                    defaultChecked 
                  />
                  <Form.Check 
                    type="checkbox" 
                    id="perm-metrics" 
                    label="Consulta métricas y estadísticas" 
                    defaultChecked 
                  />
                  <Form.Check 
                    type="checkbox" 
                    id="perm-bots" 
                    label="Crea Bots (IA)" 
                    defaultChecked 
                  />
                  <Form.Check 
                    type="checkbox" 
                    id="perm-notifications" 
                    label="Notificaciones" 
                    defaultChecked 
                  />
                </div>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveAgent}
            className="save-agent-btn"
          >
            {modalMode === 'add' ? 'Agregar' : 'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default AgentsPage;
