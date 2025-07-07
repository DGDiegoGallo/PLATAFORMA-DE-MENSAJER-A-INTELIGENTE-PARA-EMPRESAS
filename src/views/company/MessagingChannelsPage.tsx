import React, { useState, useMemo, useEffect } from 'react';
import { useCompany } from '../../features/company/hooks/useCompany';
import { messageService } from '../../features/company/services/message.service';
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
import { FaPlus, FaFilter, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast as toastify } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChannelsTable from '../../components/company/ChannelsTable';
import Pagination from '../../components/ui/Pagination';
import './MessagingChannelsPage.css';

const ITEMS_PER_PAGE = 7;

// Funciones auxiliares para traducir tipos y roles
const translateChannelType = (type: string): string => {
  switch (type) {
    case 'group': return 'Grupo';
    case 'channel': return 'Canal';
    case 'event': return 'Eventos';
    default: return type;
  }
};

const translateUserRole = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'company': return 'Empresario';
    case 'empleado': return 'Empleado';
    case 'agente': return 'Agente';
    case 'admin': return 'Administrador';
    default: return role || 'Sin rol';
  }
};

interface CompanyMember {
  id: number;
  documentId: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  blocked: boolean;
  confirmed: boolean;
}

const MessagingChannelsPage: React.FC = () => {
  // Permisos basados en rol guardado en localStorage (demo)
  const userRole = (() => {
    try {
      return (JSON.parse(localStorage.getItem('user') || '{}').rol || '').toLowerCase();
    } catch {
      return '';
    }
  })();
  const canManage = userRole === 'company' || userRole === 'agente';
  const { company } = useCompany();
  const { channels, creating, createError, createChannel, deleteChannel, setChannels } = useChannels();

  /* ---------------------------- estados locales --------------------------- */
  const [currentPage, setCurrentPage] = useState(1);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // modal crear / editar
  const [showEditModal, setShowEditModal] = useState(false);
  const notify = (msg: string, variant: 'success' | 'danger') => {
    if (variant === 'success') toastify.success(msg);
    else toastify.error(msg);
  };
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentChannel, setCurrentChannel] = useState<Partial<Channel>>({});
  const [originalMembers, setOriginalMembers] = useState<any[]>([]);
  const [editedMembers, setEditedMembers] = useState<any[]>([]);

  // modal añadir miembros
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedChannelForMembers, setSelectedChannelForMembers] = useState<Channel | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);

  // modal detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChannelDetails, setSelectedChannelDetails] = useState<Channel | null>(null);

  // filtros
  const [filterType, setFilterType] = useState<ChannelType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ChannelStatus | ''>('');
  const [filterName, setFilterName] = useState('');

  const loading = !channels || !Array.isArray(channels);

  // Función para obtener miembros de la empresa usando populate
  const fetchCompanyMembers = async () => {
    if (!company?.documentId) return;
    
    setLoadingMembers(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
      
      // Obtener los messages/channels con populate para acceder a los miembros de la empresa
      const response = await fetch(`${apiUrl}/api/messages?populate=company&filters[company][documentId][$eq]=${company.documentId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los miembros de la empresa');
      }
      
      const data = await response.json();
      console.log('API Response for company members:', data);
      
      // Buscar el primer mensaje que tenga company con members
      let companyMembers: any[] = [];
      if (data.data && data.data.length > 0) {
        for (const item of data.data) {
          if (item.company && item.company.members) {
            companyMembers = item.company.members;
            break;
          }
        }
      }
      
      // Si no encontramos miembros en los messages, intentar obtenerlos directamente de companies
      if (companyMembers.length === 0) {
        const companyResponse = await fetch(`${apiUrl}/api/companies?populate=users_permissions_users&filters[documentId][$eq]=${company.documentId}`);
        
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          console.log('Company data from API:', companyData);
          const companyItem = companyData.data[0];
          
          if (companyItem && companyItem.users_permissions_users) {
            companyMembers = companyItem.users_permissions_users.map((user: any) => ({
              id: user.id.toString(),
              name: `${user.nombre} ${user.apellido}`,
              email: user.email,
              role: user.rol,
              userId: user.id
            }));
          }
        }
      }
      
      // Convertir a formato esperado
      const members = companyMembers.map((member: any) => ({
        id: member.userId || member.id,
        documentId: member.documentId || '',
        username: member.username || '',
        email: member.email,
        nombre: member.name?.split(' ')[0] || member.nombre || '',
        apellido: member.name?.split(' ').slice(1).join(' ') || member.apellido || '',
        rol: member.role || member.rol || '',
        blocked: false,
        confirmed: true,
      }));
      
      console.log('Processed company members:', members);
      setCompanyMembers(members);
    } catch (error) {
      console.error('Error fetching company members:', error);
      notify('Error al cargar los miembros de la empresa', 'danger');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Cargar miembros cuando se monta el componente o cambia la empresa
  useEffect(() => {
    fetchCompanyMembers();
  }, [company?.documentId]);

  const handleAddMembers = (ch: Channel) => {
    setSelectedChannelForMembers(ch);
    setSelectedMemberIds([]);
    setShowMembersModal(true);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  // Filtrar miembros para excluir los que ya están en el canal seleccionado
  const membersList = useMemo(() => {
    if (!selectedChannelForMembers || !companyMembers.length) return companyMembers;
    
    const channelMemberIds = selectedChannelForMembers.members?.map(m => m.id?.toString()).filter(Boolean) || [];
    const channelMemberUserIds = selectedChannelForMembers.members?.map(m => m.userId?.toString()).filter(Boolean) || [];
    
    return companyMembers.filter(member => {
      const memberId = member.id?.toString();
      return memberId && 
             !channelMemberIds.includes(memberId) && 
             !channelMemberUserIds.includes(memberId);
    });
  }, [companyMembers, selectedChannelForMembers]);

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

  const handleEditChannel = async (ch: Channel) => {
    setModalMode('edit');
    
    try {
      // Obtener los datos completos del canal para asegurar que tenemos la información más actualizada
      const channelData = await messageService.getMessageByDocumentId(ch.documentId);
      const attr = channelData?.attributes ?? channelData ?? {};
      
      // Asegurarse de que tenemos los miembros del canal y normalizarlos
      const rawMembers = attr.group_member || [];
      const normalizedMembers = rawMembers.map((member: any) => ({
        // Usar userId como id, o crear uno si no existe
        id: member.id || member.userId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: member.name,
        email: member.email,
        role: member.role,
        userId: member.userId
      }));
      
      console.log('Miembros normalizados para edición:', normalizedMembers);
      
      // Actualizar el canal actual con los datos completos
      setCurrentChannel({
        ...ch,
        members: normalizedMembers
      });
      
      // Guardar los miembros originales y establecer los editados
      setOriginalMembers([...normalizedMembers]);
      setEditedMembers([...normalizedMembers]);
      
      setShowEditModal(true);
    } catch (error) {
      console.error('Error al cargar los datos del canal:', error);
      notify('Error al cargar los datos del canal', 'danger');
      
      // En caso de error, usar los datos que ya tenemos pero normalizarlos también
      const fallbackMembers = (ch.members || []).map((member: any) => ({
        id: member.id || member.userId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: member.name,
        email: member.email,
        role: member.role,
        userId: member.userId
      }));
      
      setCurrentChannel(ch);
      setOriginalMembers(fallbackMembers);
      setEditedMembers(fallbackMembers);
      setShowEditModal(true);
    }
  };

  const handleDeleteChannel = async (ch: Channel) => {
    console.log('Intentando eliminar canal', ch.documentId, ch);
    try {
      await deleteChannel(ch);
    } catch (error) {
      console.error(error);
      notify('Error eliminando canal', 'danger');
    }
  };

  // Función para eliminar miembro del estado local (sin persistir)
  const handleRemoveMemberFromEdit = (memberId: string) => {
    console.log('=== ELIMINANDO MIEMBRO ===');
    console.log('ID a eliminar:', memberId);
    console.log('Miembros actuales:', editedMembers);
    
    setEditedMembers(prev => {
      const filtered = prev.filter(m => {
        const keep = m.id !== memberId;
        console.log(`Miembro ${m.id} (${m.name}) - Mantener: ${keep}`);
        return keep;
      });
      
      console.log('Miembros después del filtro:', filtered);
      return filtered;
    });
  };

  // Función para cancelar edición y revertir cambios
  const handleCancelEdit = () => {
    setCurrentChannel(prev => ({ ...prev, members: originalMembers }));
    setEditedMembers([]);
    setOriginalMembers([]);
    setShowEditModal(false);
  };

  const [savingEdit,setSavingEdit]=useState(false);
  const handleSaveChannel = async () => {
    if (!currentChannel.name || !currentChannel.type || !currentChannel.status) {
      notify('Nombre, Tipo y Estado son obligatorios.', 'danger');
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
          
          // Usar los miembros editados en lugar de los originales
          const userIds = editedMembers
            .filter((m: any) => m.userId && typeof m.userId === 'number')
            .map((m: any) => m.userId);

          const body: Record<string, any> = {
            name: currentChannel.name,
            type: currentChannel.type,
            status_of_channel: currentChannel.status.toLowerCase(),
            // IMPORTANTE: Preservar la relación con company
            company: companyId,
            // Usar los miembros editados
            group_member: editedMembers,
            users_permissions_users: userIds,
            bot_interaction: attr.bot_interaction ?? {},
            content: attr.content ?? [],
          };

          // 3. PUT con el objeto completo - usar URL correcta
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:1337';
          const res = await fetch(`${apiUrl}/api/messages/${currentChannel.documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: body }),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            throw new Error(`Error ${res.status}: ${errorText}`);
          }
          
          const updated = await res.json();
          const updatedAttr = updated.data?.attributes ?? updated.data ?? updated;
          
          // Actualizar el estado local con los cambios guardados
          setChannels(prev=>prev.map(c=>c.documentId===currentChannel.documentId?{
            ...c,
            name: updatedAttr.name,
            type: updatedAttr.type,
            status: (updatedAttr.status_of_channel?.toLowerCase()==='active')?'Active':'Inactive',
            members: editedMembers
          }:c));
          
          notify('Canal actualizado correctamente','success');
        } catch(err){
          notify('Error actualizando canal','danger');
          console.error('Error en handleSaveChannel:', err);
        } finally {
          setSavingEdit(false);
        }
      }
      
      // Limpiar estados de edición
      setOriginalMembers([]);
      setEditedMembers([]);
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
                  <option value="event">Eventos</option>
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

      {/* Modal Crear/Editar Canal */}
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
                    <option value="event">Eventos</option>
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
            
            {modalMode === 'edit' && editedMembers && editedMembers.length > 0 && (
              <Form.Group className="mb-3">
                <Form.Label>Miembros del Canal</Form.Label>
                <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {editedMembers.map((member: any) => {
                    const isCompanyOwner = member.role?.toLowerCase() === 'company';
                    return (
                      <div key={member.id} className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <span>{member.name}</span>
                          <Badge bg="secondary" className="ms-2" style={{ color: 'black' }}>
                            {translateUserRole(member.role)}
                          </Badge>
                          {isCompanyOwner && (
                            <Badge bg="warning" className="ms-2" style={{ color: 'black' }}>
                              Propietario
                            </Badge>
                          )}
                        </div>
                        {!isCompanyOwner ? (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(`Eliminando miembro: ${member.id} - ${member.name}`);
                              handleRemoveMemberFromEdit(member.id);
                            }}
                          >
                            Eliminar
                          </Button>
                        ) : (
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            disabled
                            title="No se puede eliminar al propietario de la empresa"
                          >
                            Propietario
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {editedMembers.length === 0 && (
                  <div className="text-center text-muted mt-3">
                    <p>No hay miembros en este canal.</p>
                  </div>
                )}
              </Form.Group>
            )}
            
            {modalMode === 'edit' && (!editedMembers || editedMembers.length === 0) && (
              <Form.Group className="mb-3">
                <Form.Label>Miembros del Canal</Form.Label>
                <div className="border rounded p-2 text-center text-muted">
                  <p className="mb-0">No hay miembros en este canal.</p>
                </div>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelEdit}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveChannel} disabled={creating||savingEdit}>
            {(creating||savingEdit) && <Spinner animation="border" size="sm" className="me-2" />}
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Añadir Miembros */}
      <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)}>
          <Modal.Header closeButton>
          <Modal.Title>Añadir miembros a {selectedChannelForMembers?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          {loadingMembers ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100px' }}>
              <Spinner animation="border" variant="danger" role="status">
                <span className="visually-hidden">Cargando miembros...</span>
              </Spinner>
            </div>
          ) : membersList.length ? (
              <Form>
              {membersList.map((member: CompanyMember) => (
                  <Form.Check
                  key={member.id}
                    type="checkbox"
                  id={`member-${member.id}`}
                  label={`${member.nombre} ${member.apellido} (${translateUserRole(member.rol)})`}
                  checked={selectedMemberIds.includes(member.id.toString())}
                  onChange={() => toggleMember(member.id.toString())}
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
              const selectedObjs = membersList.filter(m => selectedMemberIds.includes(m.id.toString())).map(m => ({
                id: m.id.toString(),
                name: `${m.nombre} ${m.apellido}`,
                email: m.email,
                role: m.rol,
                userId: m.id
              }));
                const merged = [...existing, ...selectedObjs.filter(s => !existing.some(e => e.id === s.id))];
                // obtener ids de usuarios en Strapi
              const userIds: number[] = merged
                .filter(m => m.userId && typeof m.userId === 'number')
                  .map(m => m.userId!);
              
                await messageService.updateGroupMembersByDocumentId(selectedChannelForMembers.documentId, merged, userIds);
                // actualizar estado local
                setChannels(prev => prev.map(c => c.documentId === selectedChannelForMembers.documentId ? { ...c, members: merged } : c));
                setShowMembersModal(false);
              notify('Miembros añadidos correctamente', 'success');
              } catch (err) {
              console.error('Error añadiendo miembros:', err);
              notify('Error añadiendo miembros al canal', 'danger');
              } finally {
                setSavingMembers(false);
              }
            }}>
              {savingMembers ? <Spinner size="sm" animation="border" className="me-2" /> : null}
              Añadir ({selectedMemberIds.length})
            </Button>
          </Modal.Footer>
        </Modal>

      {/* Modal Detalles del Canal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
          <Modal.Header closeButton>
          <Modal.Title>Detalles: {selectedChannelDetails?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <p><strong>Tipo:</strong> {translateChannelType(selectedChannelDetails?.type || '')}</p>
            <p>
              <strong>Estado:</strong>{' '}
            <Badge bg={selectedChannelDetails?.status === 'Active' ? 'success' : 'danger'}>
              {selectedChannelDetails?.status === 'Active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </p>
          <p><strong>Creado:</strong> {selectedChannelDetails?.creationDate ? new Date(selectedChannelDetails.creationDate).toLocaleDateString() : 'N/A'}</p>
          <h5 className="mt-4">Miembros ({selectedChannelDetails?.members?.length || 0})</h5>
          {selectedChannelDetails?.members?.length ? (
              <ul>
              {selectedChannelDetails?.members.map(m => (
                <li key={m.id}>{m.name} — {translateUserRole(m.role)}</li>
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