import React, { useState, useMemo } from 'react';
import {
  Container,
  Card,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Table,
  Badge
} from 'react-bootstrap';
import { FaPlus, FaFilter, FaTimes } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ChannelsTable, { Channel, ChannelType, ChannelStatus } from '../../components/company/ChannelsTable';
import Pagination from '../../components/ui/Pagination';
import './MessagingChannelsPage.css';

const ITEMS_PER_PAGE = 7;

const MessagingChannelsPage: React.FC = () => {
  const initialChannels: Channel[] = [
    {
      id: '1',
      name: 'Soporte TI',
      type: 'Grupo',
      status: 'Activo',
      description: 'Chat de incidencias técnicas',
      creationDate: new Date(2023, 0, 15).toISOString(),
      members: [
        { id: 'm1', name: 'Ana Pérez', role: 'Admin' },
        { id: 'm2', name: 'Luis García', role: 'Miembro' },
      ],
    },
    {
      id: '2',
      name: 'Marketing 2025',
      type: 'Público',
      status: 'Inactivo',
      description: 'Canal para campaña 2025',
      creationDate: new Date(2023, 5, 10).toISOString(),
      members: [
        { id: 'm3', name: 'Carlos López', role: 'Admin' },
        { id: 'm4', name: 'Laura Díaz', role: 'Editor' },
        { id: 'm5', name: 'Pedro Martínez', role: 'Miembro' },
      ],
    },
    {
      id: '3',
      name: 'Ventas Región Norte',
      type: 'Privado',
      status: 'Activo',
      description: 'Chat con agentes de zona norte',
      creationDate: new Date(2024, 2, 1).toISOString(),
      members: [
        { id: 'm6', name: 'Sofía Hernández', role: 'Admin' },
      ],
    },
    // ... más canales para paginación
  ];

  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal de Crear/Editar Canal
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentChannel, setCurrentChannel] = useState<Partial<Channel>>({});

  // Modal de Detalles del Canal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChannelDetails, setSelectedChannelDetails] = useState<Channel | null>(null);
  
  // Filtros
  const [filterType, setFilterType] = useState<ChannelType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ChannelStatus | ''>('');
  const [filterName, setFilterName] = useState('');

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      return (
        (filterType === '' || channel.type === filterType) &&
        (filterStatus === '' || channel.status === filterStatus) &&
        (filterName === '' || channel.name.toLowerCase().includes(filterName.toLowerCase()))
      );
    });
  }, [channels, filterType, filterStatus, filterName]);

  const paginatedChannels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredChannels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredChannels, currentPage]);

  const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);

  const handleAddChannel = () => {
    setModalMode('add');
    setCurrentChannel({ name: '', type: 'Grupo', status: 'Activo', description: '' });
    setShowEditModal(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setModalMode('edit');
    setCurrentChannel(channel);
    setShowEditModal(true);
  };

  const handleDeleteChannel = (channelToDelete: Channel) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el canal "${channelToDelete.name}"?`)) {
      setChannels(channels.filter(c => c.id !== channelToDelete.id));
    }
  };

  const handleSaveChannel = () => {
    if (!currentChannel.name || !currentChannel.type || !currentChannel.status) {
      alert('Nombre, Tipo y Estado son obligatorios.');
      return;
    }
    if (modalMode === 'add') {
      const newChannel: Channel = {
        id: Date.now().toString(),
        name: currentChannel.name || 'Nuevo Canal',
        type: currentChannel.type || 'Grupo',
        status: currentChannel.status || 'Activo',
        description: currentChannel.description || '',
        creationDate: new Date().toISOString(),
        members: [], // Miembros se pueden añadir después
      };
      setChannels([newChannel, ...channels]);
    } else {
      setChannels(
        channels.map(c => (c.id === currentChannel.id ? { ...c, ...currentChannel } as Channel : c))
      );
    }
    setShowEditModal(false);
  };

  const handleViewDetails = (channel: Channel) => {
    setSelectedChannelDetails(channel);
    setShowDetailsModal(true);
  };
  
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset page on filter apply
    // La actualización de la tabla es automática por useMemo
  };

  const handleClearFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterName('');
    setCurrentPage(1);
  };

  return (
    <DashboardLayout companyName="Nombre de la empresa">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: 'var(--color-text-primary)' }}>Canales de Mensajería</h2>
          <Button className="add-channel-btn d-flex align-items-center gap-2" onClick={handleAddChannel}>
            <FaPlus size={14} />
            <span>Crear Canal</span>
          </Button>
        </div>

        <Card className="filters-card">
          <Form>
            <Row className="g-2 align-items-end">
              <Col md={3} sm={6}>
                <Form.Label>Tipo de Canal</Form.Label>
                <Form.Select value={filterType} onChange={e => setFilterType(e.target.value as ChannelType | '')}>
                  <option value="">Todos</option>
                  <option value="Grupo">Grupo</option>
                  <option value="Público">Público</option>
                  <option value="Privado">Privado</option>
                </Form.Select>
              </Col>
              <Col md={3} sm={6}>
                <Form.Label>Estado</Form.Label>
                <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value as ChannelStatus | '')}>
                  <option value="">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </Form.Select>
              </Col>
              <Col md={3} sm={6}>
                <Form.Label>Nombre del Canal</Form.Label>
                <Form.Control 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    value={filterName} 
                    onChange={e => setFilterName(e.target.value)} 
                />
              </Col>
              <Col md={3} sm={6} className="d-flex align-items-end">
                <Button variant="primary" onClick={handleApplyFilters} className="me-2">
                  <FaFilter className="me-1" /> Aplicar
                </Button>
                <Button variant="outline-secondary" onClick={handleClearFilters}>
                  <FaTimes className="me-1" /> Limpiar
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card className="messaging-card">
          <Card.Body className="p-0">
            <ChannelsTable
              channels={paginatedChannels}
              onViewDetails={handleViewDetails}
              onEdit={handleEditChannel}
              onDelete={handleDeleteChannel}
            />
          </Card.Body>
        </Card>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Container>

      {/* Modal Crear/Editar Canal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="channel-modal">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Crear Nuevo Canal' : 'Editar Canal'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Canal</Form.Label>
              <Form.Control
                type="text"
                value={currentChannel.name || ''}
                onChange={e => setCurrentChannel({ ...currentChannel, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Select
                value={currentChannel.type || 'Grupo'}
                onChange={e => setCurrentChannel({ ...currentChannel, type: e.target.value as ChannelType })}
              >
                <option value="Grupo">Grupo</option>
                <option value="Público">Público</option>
                <option value="Privado">Privado</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                value={currentChannel.status || 'Activo'}
                onChange={e => setCurrentChannel({ ...currentChannel, status: e.target.value as ChannelStatus })}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentChannel.description || ''}
                onChange={e => setCurrentChannel({ ...currentChannel, description: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveChannel}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Detalles del Canal */}
      {selectedChannelDetails && (
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered className="channel-details-modal">
          <Modal.Header closeButton>
            <Modal.Title>Detalles del Canal: {selectedChannelDetails.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Nombre:</strong> {selectedChannelDetails.name}</p>
            <p><strong>Tipo:</strong> {selectedChannelDetails.type}</p>
            <p><strong>Estado:</strong> 
                <Badge pill bg={selectedChannelDetails.status === 'Activo' ? 'success' : 'danger'} className="ms-2">
                    {selectedChannelDetails.status === 'Activo' ? <span style={{fontSize: '1.2em', verticalAlign: 'middle'}}>&#x1F7E2;</span> : <span style={{fontSize: '1.2em', verticalAlign: 'middle'}}>&#x1F534;</span>}
                    {' '}{selectedChannelDetails.status}
                </Badge>
            </p>
            <p><strong>Descripción:</strong> {selectedChannelDetails.description}</p>
            <p><strong>Fecha de Creación:</strong> {new Date(selectedChannelDetails.creationDate).toLocaleDateString()}</p>
            <h5 className="mt-4 mb-3">Miembros ({selectedChannelDetails.members.length})</h5>
            {selectedChannelDetails.members.length > 0 ? (
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedChannelDetails.members.map(member => (
                            <tr key={member.id}>
                                <td>{member.name}</td>
                                <td>{member.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                <p>No hay miembros en este canal.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Cerrar</Button>
          </Modal.Footer>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default MessagingChannelsPage;
