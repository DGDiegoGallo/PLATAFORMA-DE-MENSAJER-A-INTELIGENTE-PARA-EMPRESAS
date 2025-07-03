import React, { useState, useMemo } from 'react';
import { useCompany } from '../../features/company/hooks/useCompany';
import { messageService } from '../../features/company/services/message.service';
import { userService } from '../../features/auth/services/user.service';
import useChannels, { ChannelType, ChannelStatus, Channel } from '../../features/company/hooks/useChannels';
import {
  Container,
  Card,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Badge,
  Spinner,
} from 'react-bootstrap';
import { FaPlus, FaFilter, FaTimes, FaLink } from 'react-icons/fa';
import { ToastContainer, toast as toastify } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChannelsTable from '../../components/company/ChannelsTable';
import Pagination from '../../components/ui/Pagination';
import './MessagingChannelsPage.css';

const ITEMS_PER_PAGE = 7;

const MessagingChannelsPage: React.FC = () => {
  // Permisos basados en rol guardado en localStorage (demo)
  const userRole = (() => {
    try {
      return (JSON.parse(localStorage.getItem('user') || '{}').rol || '').toLowerCase();
    } catch {
      return '';
    }
  })();
  const canManage = userRole === 'company';
  const { company } = useCompany();
  const { channels, creating, createError, createChannel, deleteChannel, setChannels } = useChannels();

  /* ---------------------------- estados locales --------------------------- */
  const [currentPage, setCurrentPage] = useState(1);

  // modal crear / editar
  const [showEditModal, setShowEditModal] = useState(false);
  const notify = (msg: string, variant: 'success' | 'danger') => {
    if (variant === 'success') toastify.success(msg);
    else toastify.error(msg);
  };
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentChannel, setCurrentChannel] = useState<Partial<Channel>>({});

  // modal añadir miembros
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedChannelForMembers, setSelectedChannelForMembers] = useState<Channel | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  const handleAddMembers = (ch: Channel) => {
    setSelectedChannelForMembers(ch);
    setSelectedMemberIds([]);
    setShowMembersModal(true);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  interface CompanyMember { id: string; name: string; role: string; email?: string }
  const membersList: CompanyMember[] = Array.isArray((company as any)?.members) ? (company as any).members : [];

  // modal detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChannelDetails, setSelectedChannelDetails] = useState<Channel | null>(null);

  // filtros
  const [filterType, setFilterType] = useState<ChannelType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ChannelStatus | ''>('');
  const [filterName, setFilterName] = useState('');

  // Estado para el proceso de relacionar canales
  const [relatingChannels, setRelatingChannels] = useState(false);

  const loading = !channels || !Array.isArray(channels);

  /* ------------------------------ funciones ------------------------------- */
  const filteredChannels = useMemo(() => {
    return channels.filter(c =>
      (filterType === '' || c.type === filterType) &&
      (filterStatus === '' || c.status === filterStatus) &&
      (filterName === '' || c.name.toLowerCase().includes(filterName.toLowerCase()))
    );
  }, [channels, filterType, filterStatus, filterName]);

  const paginatedChannels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredChannels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredChannels, currentPage]);

  const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);

  const handleAddChannel = () => {
    setModalMode('add');
    setCurrentChannel({ name: '', type: 'group', status: 'Active' });
    setShowEditModal(true);
  };

  const handleEditChannel = (ch: Channel) => {
    setModalMode('edit');
    setCurrentChannel(ch);
    setShowEditModal(true);
  };

  const handleDeleteChannel = async (ch: Channel) => {
    console.log('Intentando eliminar canal', ch.documentId, ch);
    if (!window.confirm(`¿Eliminar canal "${ch.name}"?`)) return;
    try {
      await deleteChannel(ch);
    } catch (error) {
      console.error(error);
      alert('Error eliminando canal');
    }
  };

  const [savingEdit,setSavingEdit]=useState(false);
  const handleSaveChannel = async () => {
    if (!currentChannel.name || !currentChannel.type || !currentChannel.status) {
      alert('Nombre, Tipo y Estado son obligatorios.');
      return;
    }

    try {
      if (modalMode === 'add') {
        await createChannel({
          name: currentChannel.name,
          type: currentChannel.type,
          status: currentChannel.status,
        });
        notify('Canal creado correctamente','success');
      } else {
        if(!currentChannel.documentId){
          notify('documentId faltante','danger');
          return;
        }
        setSavingEdit(true);
        try {
          // 1. Obtener el canal actual completo
          const existing = await messageService.getMessageByDocumentId(currentChannel.documentId);
          const attr = existing?.attributes ?? existing ?? {};

          // 2. Construir el objeto completo para el PUT
          const companyId = company?.id;
          const body: Record<string, any> = {
            name: currentChannel.name,
            type: currentChannel.type,
            status_of_channel: currentChannel.status.toLowerCase(),
            company: companyId,
            // Preservar relaciones y campos existentes
            group_member: attr.group_member ?? [],
            users_permissions_users: Array.isArray(attr.users_permissions_users)
              ? attr.users_permissions_users.map((u: any) => (typeof u === 'object' && u !== null && 'id' in u ? u.id : u))
              : [],
            bot_interaction: attr.bot_interaction ?? {},
            content: attr.content ?? [],
          };

          // 3. PUT con el objeto completo
          const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/messages/${currentChannel.documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: body }),
          });
          if (!res.ok) throw new Error(await res.text());
          const updated = await res.json();
          const updatedAttr = updated.data?.attributes ?? updated.data ?? updated;
          setChannels(prev=>prev.map(c=>c.documentId===currentChannel.documentId?{
            ...c,
            name: updatedAttr.name,
            type: updatedAttr.type,
            status: (updatedAttr.status_of_channel?.toLowerCase()==='active')?'Active':'Inactive'
          }:c));
          notify('Canal actualizado','success');
        } catch(err){
          notify('Error actualizando canal','danger');
          console.error(err);
        } finally {
          setSavingEdit(false);
        }
      }
      setShowEditModal(false);
    } catch {
      notify(createError || 'Error creando canal','danger');
    }
  };

  const handleViewDetails = (ch: Channel) => {
    setSelectedChannelDetails(ch);
    setShowDetailsModal(true);
  };

  const handleApplyFilters = () => setCurrentPage(1);

  const handleClearFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterName('');
    setCurrentPage(1);
  };

  // Función para relacionar todos los canales con la compañía
  const handleRelateChannelsToCompany = async () => {
    if (!company || !company.id) {
      notify('No se encontró información de la compañía', 'danger');
      return;
    }

    setRelatingChannels(true);
    try {
      console.log('Iniciando proceso de relacionar canales con la compañía...');
      console.log(`Compañía seleccionada: ID=${company.id}, nombre=${company.name}`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Procesar cada canal
      for (const channel of channels) {
        try {
          console.log(`Procesando canal: ${channel.name} (${channel.documentId})`);
          await messageService.assignCompanyToMessage(channel.documentId, Number(company.id));
          successCount++;
        } catch (error) {
          console.error(`Error relacionando canal ${channel.name}:`, error);
          errorCount++;
        }
      }
      
      // Notificar resultado
      if (successCount > 0) {
        notify(`${successCount} canales relacionados correctamente con la compañía`, 'success');
      }
      
      if (errorCount > 0) {
        notify(`${errorCount} canales no pudieron ser relacionados`, 'danger');
      }
      
      // Recargar canales para reflejar los cambios
      // Esta parte dependería de cómo estés implementando la recarga de canales
    } catch (error) {
      console.error('Error general relacionando canales:', error);
      notify('Error procesando la operación', 'danger');
    } finally {
      setRelatingChannels(false);
    }
  };

  /* -------------------------------- render -------------------------------- */
  return (
    <>
      <Container fluid>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <Spinner animation="border" variant="danger" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </div>
        ) : (
          <>
        {/* header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: 'var(--color-text-primary)' }}>Canales de Mensajería</h2>
          <div className="d-flex gap-2">
            {canManage && (
              <>
                {/* <Button onClick={handleRelateChannelsToCompany} disabled={relatingChannels} variant="outline-primary" className="d-flex align-items-center gap-2">
                  {relatingChannels ? <Spinner size="sm" animation="border" /> : <FaLink size={14} />}
                  Relacionar con Compañía
                </Button> */}
                <Button
                  variant="danger"
                  className="d-flex align-items-center gap-2"
                  onClick={handleAddChannel}
                >
                  <FaPlus size={14} />
                  <span>Crear Canal</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* filtros */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-3">
            <Row>
              <Col md={3} sm={6} className="mb-3 mb-md-0">
                <Form.Group>
                <Form.Label>Tipo</Form.Label>
                  <Form.Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as ChannelType | '')}
                  >
                  <option value="">Todos</option>
                  <option value="group">Grupo</option>
                  <option value="channel">Canal</option>
                  <option value="event">Evento</option>
                </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} sm={6} className="mb-3 mb-md-0">
                <Form.Group>
                <Form.Label>Estado</Form.Label>
                  <Form.Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as ChannelStatus | '')}
                  >
                  <option value="">Todos</option>
                  <option value="Active">Activo</option>
                  <option value="Inactive">Inactivo</option>
                </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} sm={6} className="mb-3 mb-md-0">
                <Form.Group>
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                    placeholder="Buscar..."
                  value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                />
                </Form.Group>
              </Col>
              <Col md={3} sm={6} className="d-flex align-items-end">
                <div className="d-flex gap-2 w-100">
                  <Button
                    variant="primary"
                    className="flex-grow-1"
                    onClick={handleApplyFilters}
                  >
                  <FaFilter className="me-1" /> Aplicar
                </Button>
                  <Button
                    variant="secondary"
                    className="flex-grow-1"
                    onClick={handleClearFilters}
                  >
                  <FaTimes className="me-1" /> Limpiar
                </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* tabla */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-0">
            <ChannelsTable
               channels={paginatedChannels}
               onDelete={canManage ? handleDeleteChannel : undefined}
               onEdit={canManage ? handleEditChannel : undefined}
               onViewDetails={handleViewDetails}
               onAddMembers={canManage ? handleAddMembers : undefined}
             />
          </Card.Body>
          <Card.Footer className="bg-white border-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Card.Footer>
        </Card>
          </>
        )}
      </Container>

      {/* modals */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Crear Canal' : 'Editar Canal'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                value={currentChannel.name || ''}
                onChange={e => setCurrentChannel({ ...currentChannel, name: e.target.value })}
              />
            </Form.Group>

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Select
                    value={currentChannel.type || 'group'}
                    onChange={e => setCurrentChannel({ ...currentChannel, type: e.target.value as any })}
                  >
                    <option value="group">Grupo</option>
                    <option value="channel">Canal</option>
                    <option value="event">Evento</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    value={currentChannel.status || 'Active'}
                    onChange={e => setCurrentChannel({ ...currentChannel, status: e.target.value as any })}
                  >
                    <option value="Active">Activo</option>
                    <option value="Inactive">Inactivo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveChannel} disabled={creating||savingEdit}>
            {(creating||savingEdit) && <Spinner animation="border" size="sm" className="me-2" />}
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)}>
          <Modal.Header closeButton>
          <Modal.Title>Añadir miembros a {selectedChannelForMembers?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {membersList.length ? (
              <Form>
                {membersList.map((m: any) => (
                  <Form.Check
                    key={m.id}
                    type="checkbox"
                    id={`member-${m.id}`}
                    label={`${m.name} (${m.role ?? ''})`}
                    checked={selectedMemberIds.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                  />
                ))}
              </Form>
            ) : (
              <p>No hay miembros en la compañía.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMembersModal(false)}>Cerrar</Button>
            <Button variant="primary" disabled={!selectedMemberIds.length || savingMembers} onClick={async () => {
              if (!selectedChannelForMembers) return;
              setSavingMembers(true);
              try {
                // construir lista actualizada sin duplicados
                const existing = Array.isArray(selectedChannelForMembers.members) ? selectedChannelForMembers.members : [];
                const selectedObjs = membersList.filter(m => selectedMemberIds.includes(m.id));
                const merged = [...existing, ...selectedObjs.filter(s => !existing.some(e => e.id === s.id))];
                // obtener ids de usuarios en Strapi
                const userIds: number[] = [];
                for (const mem of merged) {
                  if ((mem as any).userId && typeof (mem as any).userId === 'number') {
                    userIds.push((mem as any).userId);
                  } else if (mem.email) {
                    try {
                      const u = await userService.getUserByEmail(mem.email);
                      if (u && u.id) {
                        (mem as any).userId = u.id;
                        userIds.push(u.id);
                      }
                    } catch (_) {/* ignore individual errors */}
                  }
                }
                await messageService.updateGroupMembersByDocumentId(selectedChannelForMembers.documentId, merged, userIds);
                // actualizar estado local
                setChannels(prev => prev.map(c => c.documentId === selectedChannelForMembers.documentId ? { ...c, members: merged } : c));
                setShowMembersModal(false);
              } catch (err) {
                alert((err as Error).message);
              } finally {
                setSavingMembers(false);
              }
            }}>
              {savingMembers ? <Spinner size="sm" animation="border" className="me-2" /> : null}
              Añadir ({selectedMemberIds.length})
            </Button>
          </Modal.Footer>
        </Modal>

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
          <Modal.Header closeButton>
          <Modal.Title>Detalles: {selectedChannelDetails?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <p><strong>Tipo:</strong> {selectedChannelDetails?.type}</p>
            <p>
              <strong>Estado:</strong>{' '}
            <Badge bg={selectedChannelDetails?.status === 'Active' ? 'success' : 'danger'}>
              {selectedChannelDetails?.status === 'Active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </p>
          <p><strong>Creado:</strong> {selectedChannelDetails?.creationDate ? new Date(selectedChannelDetails.creationDate).toLocaleDateString() : 'N/A'}</p>
          <h5 className="mt-4">Miembros ({selectedChannelDetails?.members.length})</h5>
          {selectedChannelDetails?.members.length ? (
              <ul>
              {selectedChannelDetails?.members.map(m => (
                  <li key={m.id}>{m.name} — {m.role}</li>
                ))}
              </ul>
            ) : (
              <p>Sin miembros.</p>
            )}
          </Modal.Body>
        </Modal>

      <ToastContainer position="bottom-right" />
    </>
  );
};

export default MessagingChannelsPage;