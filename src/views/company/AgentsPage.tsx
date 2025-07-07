import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Modal, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';

import { FaPlus, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import useAuth from '../../features/auth/hooks/useAuth';
import { useCompany } from '../../features/company/hooks/useCompany';
import { userService } from '../../features/auth/services/user.service';
import { companyService } from '../../features/company/services/company.service';
import { messageService } from '../../features/company/services/message.service';
import AgentsTable, { Agent } from '../../components/company/AgentsTable';
import useChannels from '../../features/company/hooks/useChannels';
import './AgentsPage.css';

interface CompanyData {
  documentId?: string;
  members?: Agent[];
}

interface SuggestedUser {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
}

const AgentsPage: React.FC = () => {
  // Lista de agentes proveniente de la compañía
  const [agents, setAgents] = useState<Agent[]>([]);

  const { company, refreshCompany } = useCompany();
  const { channels, setChannels } = useChannels();
  const { user } = useAuth();
  const userRole = user?.rol || user?.role?.name || 'user';
  const readOnly = ['empleado', 'agente'].includes(userRole.toLowerCase());

  // Estado para modal de ver detalles
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);
  // Información adicional del usuario para mostrar en detalles
  const [detailedUserInfo, setDetailedUserInfo] = useState<any>(null);

  // Estado para modal de confirmación de borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  // Estado para notificaciones
  const [notification, setNotification] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' });

  // Modal state for adding/editing agents
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Estado para verificación de usuarios
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'not_found' | 'mismatch' | 'suggestions'>('idle');
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);

  interface NewAgentForm {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  }

  const [currentAgent, setCurrentAgent] = useState<NewAgentForm>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'Agente'
  });

  // Sincroniza los miembros con el estado local cuando llegue la compañía
  useEffect(() => {
    console.log("Company data received:", company);
    console.log("DocumentId:", (company as CompanyData)?.documentId);
    const members = Array.isArray((company as CompanyData)?.members) ? (company as CompanyData).members || [] : [];
    console.log("Members from company:", members);
    if (members) {
      setAgents(members);
    }
  }, [company]);

  // Log agents whenever they change
  useEffect(() => {
    console.log("Current agents state:", agents);
  }, [agents]);

  // Handle view agent details
  const handleViewAgent = async (agent: Agent) => {
    console.log('View agent:', agent);
    setViewingAgent(agent);
    
    // Intentar obtener información adicional del usuario desde la base de datos
    try {
      const userData = await userService.getUserByEmail(agent.email);
      console.log("Información detallada del usuario:", userData);
      setDetailedUserInfo(userData);
    } catch (error) {
      console.error("Error obteniendo detalles del usuario:", error);
      setDetailedUserInfo(null);
    }
    
    setShowViewModal(true);
  };

  // Handle edit agent
  const handleEditAgent = (agent: Agent) => {
    if (readOnly) return;
    setModalMode('edit');
    // dividir nombre en nombre y apellido simples (mejor esfuerzo)
    const [firstName, ...rest] = agent.name.split(' ');
    const lastName = rest.join(' ');
    setCurrentAgent({
      id: agent.id,
      firstName,
      lastName,
      email: agent.email,
      role: agent.role,
    });
    setShowModal(true);
  };

  // Handle delete agent (updates company members and channel relations)
  const handleDeleteAgent = (agent: Agent) => {
    if (readOnly) return;
    setAgentToDelete(agent);
    setShowDeleteModal(true);
  };

  const confirmDeleteAgent = async () => {
    if (!company || !agentToDelete) return;
    try {
      // 1. Eliminar el agente de la lista de miembros de la compañía
      const updatedMembers = agents.filter(a => a.id !== agentToDelete.id);
      await companyService.updateMembersByDocumentId((company as CompanyData).documentId!, updatedMembers);
      
      // 2. Eliminar el agente de todos los canales de mensajería
      const affected = channels.filter(ch => ch.members.some(m => m.id === agentToDelete.id));
      console.log(`Eliminando agente de ${affected.length} canales de mensajería`);
      
      for (const ch of affected) {
        try {
          // Obtener los datos actuales del canal
          const channelData = await messageService.getMessageByDocumentId(ch.documentId);
          const attr = channelData?.attributes ?? channelData ?? {};
          
          // Filtrar el miembro a eliminar
          const newMembers = (attr.group_member || []).filter((m: any) => m.id !== agentToDelete.id);
          
          // Obtener los IDs de usuario actualizados (excluyendo el usuario eliminado)
          const userIds = newMembers
            .filter((m: any) => m.userId && typeof m.userId === 'number')
            .map((m: any) => m.userId);
          
          // Actualizar el canal sin el miembro eliminado
          await messageService.updateGroupMembersByDocumentId(ch.documentId, newMembers, userIds);
          console.log(`Agente eliminado del canal ${ch.name}`);
          
          // Actualizar el estado local de los canales
          setChannels(prev => prev.map(c => c.documentId === ch.documentId ? {...c, members: newMembers} : c));
        } catch(error) {
          console.error(`Error eliminando agente del canal ${ch.name}:`, error);
        }
      }
      
      // 3. Eliminar la relación del usuario con la compañía en Strapi
      try {
        // Buscar el usuario por email
        const user = await userService.getUserByEmail(agentToDelete.email);
        if (user && user.id) {
          console.log(`Eliminando relación del usuario ${user.id} con la compañía`);
          // Establecer la compañía a null para eliminar la relación
          await userService.assignCompany(user.id, null as any);
          console.log(`Relación eliminada correctamente`);
        }
      } catch (error) {
        console.error('Error eliminando relación con la compañía:', error);
      }
      
      // 4. Actualizar el estado local
      setAgents(updatedMembers);
      // 5. Refrescar los datos de la compañía
      refreshCompany();
      setNotification({ show: true, message: 'Agente eliminado correctamente de la compañía y todos los canales', variant: 'success' });
    } catch(err) {
      setNotification({ show: true, message: 'Error eliminando miembro', variant: 'danger' });
      console.error(err);
    } finally {
      setShowDeleteModal(false);
      setAgentToDelete(null);
    }
  };

  // Función para verificar usuario en Strapi
  const verifyUserInStrapi = async () => {
    if (!currentAgent.email || !currentAgent.firstName || !currentAgent.lastName) {
      setVerificationStatus('idle');
      setVerificationMessage('Por favor complete todos los campos antes de verificar');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('checking');
    setVerificationMessage('Verificando usuario en la base de datos...');

    try {
      // Buscar usuario por email
      const foundUser = await userService.getUserByEmail(currentAgent.email);
      
      if (!foundUser) {
        setVerificationStatus('not_found');
        setVerificationMessage('No se encontró un usuario con este correo electrónico en el sistema');
        return;
      }

      // Comparar nombre y apellido (normalizar para comparación)
      const normalizeString = (str: string) => str.toLowerCase().trim();
      
      const foundFirstName = normalizeString(foundUser.nombre || '');
      const foundLastName = normalizeString(foundUser.apellido || '');
      const inputFirstName = normalizeString(currentAgent.firstName);
      const inputLastName = normalizeString(currentAgent.lastName);

      if (foundFirstName === inputFirstName && foundLastName === inputLastName) {
        setVerificationStatus('success');
        setVerificationMessage(`Usuario verificado correctamente: ${foundUser.nombre} ${foundUser.apellido}`);
        setSuggestedUsers([]);
      } else {
        // Buscar sugerencias de usuarios similares
        try {
          // Siempre incluir al usuario encontrado por email como primera sugerencia
          const emailUserSuggestion: SuggestedUser = {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
            nombre: foundUser.nombre,
            apellido: foundUser.apellido,
            rol: foundUser.rol
          };

          // Buscar otros usuarios similares por nombre
          const nameSuggestions = await userService.getUsersByName(currentAgent.firstName, currentAgent.lastName);
          
          // Combinar sugerencias: primero el usuario del email, luego otros similares
          const allSuggestions: SuggestedUser[] = [emailUserSuggestion];
          
          // Agregar otras sugerencias que no sean el mismo usuario del email
          nameSuggestions.forEach(user => {
            if (user.id !== foundUser.id) {
              allSuggestions.push(user);
            }
          });

          // Siempre mostrar sugerencias cuando no coincidan los datos
          setVerificationStatus('suggestions');
          setVerificationMessage(`Los datos no coinciden. En el sistema: "${foundUser.nombre} ${foundUser.apellido}" vs Ingresado: "${currentAgent.firstName} ${currentAgent.lastName}"`);
          setSuggestedUsers(allSuggestions);
          
        } catch (error) {
          console.error('Error buscando sugerencias:', error);
          // Aún así, mostrar al menos el usuario encontrado por email
          const emailUserSuggestion: SuggestedUser = {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
            nombre: foundUser.nombre,
            apellido: foundUser.apellido,
            rol: foundUser.rol
          };
          
          setVerificationStatus('suggestions');
          setVerificationMessage(`Los datos no coinciden. En el sistema: "${foundUser.nombre} ${foundUser.apellido}" vs Ingresado: "${currentAgent.firstName} ${currentAgent.lastName}"`);
          setSuggestedUsers([emailUserSuggestion]);
        }
      }
    } catch (error) {
      console.error('Error verificando usuario:', error);
      setVerificationStatus('not_found');
      setVerificationMessage('Error al verificar el usuario. Intente nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resetear verificación cuando cambien los datos
  useEffect(() => {
    if (modalMode === 'add') {
      setVerificationStatus('idle');
      setVerificationMessage('');
      setSuggestedUsers([]);
    }
  }, [currentAgent.email, currentAgent.firstName, currentAgent.lastName, modalMode]);

  // Función para seleccionar una sugerencia
  const handleSelectSuggestion = (suggestion: SuggestedUser) => {
    setCurrentAgent(prev => ({
      ...prev,
      firstName: suggestion.nombre || '',
      lastName: suggestion.apellido || '',
      email: suggestion.email
    }));
    setVerificationStatus('success');
    setVerificationMessage(`Usuario verificado correctamente: ${suggestion.nombre} ${suggestion.apellido}`);
    setSuggestedUsers([]);
  };

  // Handle add new agent
  const handleAddAgent = () => {
    if (readOnly) return;
    setModalMode('add');
    setCurrentAgent({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      role: 'Agente'
    });
    setVerificationStatus('idle');
    setVerificationMessage('');
    setSuggestedUsers([]);
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
  const handleSaveAgent = async () => {
    if (!company) return;
    
    if (modalMode === 'add') {
      // Verificar que la verificación sea exitosa antes de proceder
      if (verificationStatus !== 'success') {
        setNotification({ 
          show: true, 
          message: 'Debe verificar el usuario antes de agregarlo', 
          variant: 'danger' 
        });
        return;
      }

      // Llama al servicio para crear usuario y vincularlo
      try {
        if (!company) {
          throw new Error('Compañía no cargada');
        }

        const documentId = (company as CompanyData).documentId;
        if (!documentId) {
          alert('La compañía no tiene documentId');
          return;
        }

        const currentMembers: Agent[] = [...agents]; // Usar el estado local que siempre está sincronizado
        console.log("Current members before adding:", currentMembers);
        
        // Verificar si el usuario ya existe como miembro
        const userExists = currentMembers.some(
          (member: any) => member.email.toLowerCase() === currentAgent.email.toLowerCase()
        );

        if (userExists) {
          alert('Ya existe un agente con este correo electrónico');
          return;
        }
        
        // Buscar si existe un usuario con ese email en el sistema
        console.log(`Buscando usuario con email ${currentAgent.email}...`);
        const foundUser = await userService.getUserByEmail(currentAgent.email);
        console.log("Usuario encontrado:", foundUser);
        
        // Crear el nuevo miembro con ID único
        const newMember: Agent = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: `${currentAgent.firstName} ${currentAgent.lastName}`,
          email: currentAgent.email,
          role: currentAgent.role,
        } as Agent;
        
        // Agregar a los miembros de la compañía
        const updatedMembers = [...currentMembers, newMember];
        console.log("Updated members to send:", updatedMembers);

        // Primero, actualizar la compañía con los miembros
        const updatedCompany = await companyService.updateMembersByDocumentId(documentId, updatedMembers);
        console.log("Member added to company members array");
        
        // Si la compañía se actualizó correctamente y el usuario existe, relacionarlos
        if (updatedCompany && foundUser?.id) {
          try {
            // 1) Actualizar rol
            console.log(`Actualizando rol del usuario ${foundUser.id} a ${currentAgent.role}`);
            await userService.updateRole(foundUser.id, currentAgent.role);
            console.log("Rol actualizado correctamente");
            
            // 2) Reasignar la compañía después de actualizar el rol para evitar pérdida de relación
            // CORRECCIÓN: Obtenemos el ID correcto de la compañía
            try {
              console.log(`Obteniendo información actualizada de la compañía ${(company as CompanyData).documentId!}`);
              const refreshedCompany = await companyService.getCompanyByDocumentId((company as CompanyData).documentId!);
              
              if (refreshedCompany && refreshedCompany.id) {
                console.log(`Re-asignando compañía ID ${refreshedCompany.id} al usuario ${foundUser.id}`);
                await userService.assignCompany(foundUser.id, refreshedCompany.id);
                console.log("Relación con compañía preservada correctamente");
              } else {
                console.warn("No se pudo obtener el ID numérico de la compañía");
              }
            } catch (companyError) {
              console.error("Error al obtener información actualizada de la compañía:", companyError);
            }
          } catch (error) {
            console.error("Error al actualizar usuario:", error);
            // No alertamos al usuario aquí porque el miembro ya fue agregado
            // Solo registramos el error para depuración
          }
        } else {
          console.log("No se encontró usuario existente con ese correo o la compañía no tiene ID válido.");
          console.log("Información de compañía:", updatedCompany);
          console.log("Información de usuario:", foundUser);
        }

        // Actualizar estado local
        setAgents(updatedMembers);
        // Refrescar los datos de la compañía
        refreshCompany();
        setNotification({ show: true, message: 'Agente añadido correctamente', variant: 'success' });
        // Resetear verificación
        setVerificationStatus('idle');
        setVerificationMessage('');
      } catch (err) {
        console.error("Error añadiendo agente:", err);
        setNotification({ show: true, message: (err as Error).message, variant: 'danger' });
      }
    } else {
      // Update existing agent - sólo rol
      if (!company) return;
      try {
        const updatedMembers = agents.map(a => a.id === currentAgent.id ? { ...a, role: currentAgent.role } : a);
        console.log("Updating member role, new members array:", updatedMembers);
        await companyService.updateMembersByDocumentId((company as CompanyData).documentId!, updatedMembers);
        
        // Buscar si existe usuario con este email para actualizar su rol
        try {
          const foundUser = await userService.getUserByEmail(currentAgent.email);
          if (foundUser?.id) {
            console.log(`Actualizando rol del usuario ${foundUser.id} a ${currentAgent.role}`);
            await userService.updateRole(foundUser.id, currentAgent.role);
            console.log("Rol actualizado correctamente en el usuario");
            
            // SOLUCIÓN: Reasignar la compañía después de actualizar el rol para evitar pérdida de relación
            // CORRECCIÓN: Obtenemos el ID correcto de la compañía
            try {
              console.log(`Obteniendo información actualizada de la compañía ${(company as CompanyData).documentId!}`);
              const refreshedCompany = await companyService.getCompanyByDocumentId((company as CompanyData).documentId!);
              
              if (refreshedCompany && refreshedCompany.id) {
                console.log(`Re-asignando compañía ID ${refreshedCompany.id} al usuario ${foundUser.id}`);
                await userService.assignCompany(foundUser.id, refreshedCompany.id);
                console.log("Relación con compañía preservada correctamente");
              } else {
                console.warn("No se pudo obtener el ID numérico de la compañía");
              }
            } catch (companyError) {
              console.error("Error al obtener información actualizada de la compañía:", companyError);
            }
          }
        } catch (error) {
          console.error("Error actualizando rol del usuario:", error);
        }
        
        // Actualizar estado local
        setAgents(updatedMembers);
        // Refrescar los datos de la compañía
        refreshCompany();
        setNotification({ show: true, message: 'Agente actualizado correctamente', variant: 'success' });
      } catch(err){
        setNotification({ show: true, message: 'Error actualizando agente', variant: 'danger' });
        console.error(err);
      }
    }
    setShowModal(false);
  };

  const loading = !company;

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: '#000000' }}>Agentes</h2>
          <div>
            {!readOnly && (
              <Button 
                variant="danger" 
                className="d-flex align-items-center gap-2 add-agent-btn"
                onClick={handleAddAgent}
              >
                <FaPlus size={14} />
                <span>Nuevo agente</span>
              </Button>
            )}
          </div>
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
              readOnly={readOnly}
            />
          </Card.Body>
        </Card>
          </>
        )}
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
              <Form.Label>Nombre</Form.Label>
              <Form.Control 
                type="text" 
                name="firstName"
                value={currentAgent.firstName}
                onChange={handleInputChange}
                placeholder="Ingrese nombre"
                required
                disabled={modalMode==='edit'}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Apellido</Form.Label>
              <Form.Control 
                type="text" 
                name="lastName"
                value={currentAgent.lastName}
                onChange={handleInputChange}
                placeholder="Ingrese apellido"
                required
                disabled={modalMode==='edit'}
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
                disabled={modalMode==='edit'}
              />
            </Form.Group>

            {modalMode === 'add' && (
              <div className="mb-3">
                <Button 
                  variant="outline-primary" 
                  onClick={verifyUserInStrapi}
                  disabled={isVerifying || !currentAgent.email || !currentAgent.firstName || !currentAgent.lastName}
                  className="d-flex align-items-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <FaSearch />
                      <span>Verificar usuario</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {verificationStatus === 'success' && modalMode === 'add' && (
              <Alert variant="success" className="mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FaCheckCircle className="text-success" />
                  <span>{verificationMessage}</span>
                </div>
              </Alert>
            )}

            {verificationStatus === 'not_found' && modalMode === 'add' && (
              <Alert variant="warning" className="mb-3">
                <div className="d-flex align-items-center gap-2">
                  <FaTimesCircle className="text-warning" />
                  <span>{verificationMessage}</span>
                </div>
              </Alert>
            )}

            {verificationStatus === 'checking' && modalMode === 'add' && (
              <Alert variant="info" className="mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  <span>{verificationMessage}</span>
                </div>
              </Alert>
            )}

            {verificationStatus === 'suggestions' && suggestedUsers.length > 0 && modalMode === 'add' && (
              <div className="mb-3">
                <h6 className="mb-2">🔍 Quizás quisiste decir:</h6>
                <div className="d-flex flex-column gap-2">
                  {suggestedUsers.map((suggestion) => (
                    <Button
                      key={suggestion.id}
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span>
                        <strong>{suggestion.nombre} {suggestion.apellido}</strong>
                        <br />
                        <small className="text-muted">{suggestion.email}</small>
                      </span>
                      <FaSearch className="text-primary" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Rol</Form.Label>
              <Form.Control 
                as="select"
                name="role"
                value={currentAgent.role}
                onChange={handleInputChange}
              >
                <option value="agente">Agente</option>
                <option value="empleado">Empleado</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleSaveAgent}
            disabled={modalMode === 'add' && verificationStatus !== 'success'}
          >
            {modalMode === 'add' ? 'Agregar' : 'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal para ver detalles del agente */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} className="view-agent-modal">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Agente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingAgent && (
            <div>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Nombre:</Col>
                <Col>{viewingAgent.name}</Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Correo:</Col>
                <Col>{viewingAgent.email}</Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Rol:</Col>
                <Col>{viewingAgent.role}</Col>
              </Row>
              
              {detailedUserInfo && (
                <>
                  <h5 className="mt-4 mb-3">Información adicional</h5>
                  
                  {detailedUserInfo.username && (
                    <Row className="mb-2">
                      <Col xs={4} className="fw-bold">Usuario:</Col>
                      <Col>{detailedUserInfo.username}</Col>
                    </Row>
                  )}
                  
                  {detailedUserInfo.telefono && (
                    <Row className="mb-2">
                      <Col xs={4} className="fw-bold">Teléfono:</Col>
                      <Col>{detailedUserInfo.telefono}</Col>
                    </Row>
                  )}
                  
                  {detailedUserInfo.createdAt && (
                    <Row className="mb-2">
                      <Col xs={4} className="fw-bold">Fecha registro:</Col>
                      <Col>{new Date(detailedUserInfo.createdAt).toLocaleDateString()}</Col>
                    </Row>
                  )}
                  
                  {detailedUserInfo.direccion && (
                    <Row className="mb-2">
                      <Col xs={4} className="fw-bold">Dirección:</Col>
                      <Col>{detailedUserInfo.direccion}</Col>
                    </Row>
                  )}
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmación para eliminar agente */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar a <b>{agentToDelete?.name}</b>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDeleteAgent}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de notificación */}
      <Modal show={notification.show} onHide={() => setNotification({ ...notification, show: false })} centered>
        <Modal.Header closeButton>
          <Modal.Title>{notification.variant === 'success' ? 'Éxito' : 'Error'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notification.message}
        </Modal.Body>
        <Modal.Footer>
          <Button variant={notification.variant === 'success' ? 'success' : 'danger'} onClick={() => setNotification({ ...notification, show: false })}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AgentsPage;
