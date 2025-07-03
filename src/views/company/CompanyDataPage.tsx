import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Spinner, Button } from 'react-bootstrap';
import { Container, Card } from 'react-bootstrap';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useCompany, useCompanyByAgent } from '../../features/company/hooks/useCompany';
import { companyService, CompanyPayload as BaseCompanyPayload } from '../../features/company/services/company.service';
import { userService } from '../../features/auth/services/user.service';
import CompanyForm from '../../components/company/CompanyForm';
import useCompanyStore, { CompanyState } from '../../store/companyStore';
import API_URL from '../../config/api';

// Extendemos el payload para permitir relaciones opcionales
type CompanyPayload = BaseCompanyPayload & {
  bots?: unknown;
  metrics?: unknown;
  users_permissions_users?: unknown;
};

const CompanyDataPage: React.FC = () => {
  const setCompanyName = useCompanyStore((state: CompanyState) => state.setCompanyName);
  const navigate = useNavigate();
  const { user, setUser } = useAuth() as ReturnType<typeof useAuth>; // setUser está expuesto desde el hook
  const userRole = user?.rol || user?.role?.name || 'user';
  const isEmployeeOrAgent = ['empleado', 'agente'].includes(userRole);
  const isAgent = userRole === 'agente';

  // Determine which hook to use based on user role
  const { company: companyFromHook, loading: companyLoading } = useCompany();
  const { company: agentCompanyData, loading: agentCompanyLoading } = useCompanyByAgent();

  // Use the appropriate data based on role
  const loadedCompany = isAgent ? agentCompanyData : companyFromHook;
  const loadingCompany = isAgent ? agentCompanyLoading : companyLoading;

  const defaultFields = {
    documentType: 'Rif',
    documentNumber: '',
    email: '',
    country: '',
    city: '',
    sector: '',
    service: '',
    hash: '',
  };
  const [companyFormData, setCompanyFormData] = useState<CompanyPayload | null>(null);
  const [resetHashStatus, setResetHashStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isEditing, setIsEditing] = useState(false);

  // Obtener el documentoID del usuario actual
  const userDocumentoID = user?.documentoID || '';

  // Mapear compañía cargada a estructura del formulario una sola vez
  useEffect(() => {
    if (loadedCompany && !companyFormData) {
      setCompanyName(loadedCompany.name || '');

      const { name, description } = loadedCompany;
      // description es un objeto con los campos del formulario
      setCompanyFormData({ name, description });
      
      // Si es empleado o agente, mostrar mensaje de confirmación
      if (isEmployeeOrAgent && name) {
        console.log(`Usuario ${userRole} accediendo a datos de la empresa: ${name}`);
      }
    }
  }, [loadedCompany, companyFormData, setCompanyName, isEmployeeOrAgent, userRole]);
  
  type Status = 'idle' | 'loading' | 'success';
  const [status, setStatus] = useState<Status>('idle');

  type FormData = {
  name: string;
  documentType: string;
  documentNumber: string;
  email: string;
  country: string;
  city: string;
  sector: string;
  service: string;
  hash?: string;
};

  const handleSaveCompany = async (data: FormData) => {
    setStatus('loading');
    try {
      if (!companyFormData) {
        const { name, hash, ...rest } = data;
        const payload: CompanyPayload = {
          name,
          description: rest,
        };
        if (hash) {
          payload.crypto_assets = { nft_hash: hash, usdt: 0 };
        }
        const created = await companyService.createCompany(payload, user?.id);
        setCompanyFormData(created);
        setCompanyName(created.name || '');
        console.log('Compañía creada:', created);

        // Actualizar rol a "company" en backend y frontend
        if (user?.id) {
          try {
            await userService.updateRole(user.id, 'company');
          } catch (e) {
            console.warn('No se pudo actualizar rol en backend (demo):', e);
          }
          // Refrescar completamente el localStorage con el usuario actualizado y todas sus relaciones (igual que login)
          try {
            const userStr = localStorage.getItem('user');
            const userEmail = userStr ? JSON.parse(userStr).email : user.email;
            const identifier = userEmail.trim();
            const encoded = encodeURIComponent(identifier);
            const res = await fetch(`${API_URL}/api/users?filters[$or][0][email][$eq]=${encoded}&filters[$or][1][username][$eq]=${encoded}&populate=*`);
            const json = await res.json();
            let userData = null;
            if (Array.isArray(json) && json.length > 0) {
              userData = json[0];
            } else if (Array.isArray(json.data) && json.data.length > 0) {
              userData = { id: json.data[0].id, ...json.data[0].attributes };
            }
            localStorage.clear();
            if (userData) {
              localStorage.setItem('user', JSON.stringify(userData));
              setUser(userData);
              console.log('localStorage actualizado:', userData);
            }
          } catch (e) {
            console.warn('No se pudo refrescar el usuario en localStorage:', e);
          }
        }
      
        // Mostrar feedback y redirigir al dashboard después de 2 s
        setTimeout(() => {
          setStatus('success');
          setTimeout(() => {
            setStatus('idle');
            navigate('/company'); // Ajusta la ruta si tu dashboard es diferente
          }, 1500);
        }, 2000);
      } else {
        // Actualizar compañía existente
        if (!loadedCompany?.crypto_assets?.nft_hash) {
          alert('Primero debes generar una llave contractual');
          setStatus('idle');
          return;
        }
        if (!data.hash || data.hash !== loadedCompany.crypto_assets.nft_hash) {
          alert('Debes generar una llave contractual antes de guardar los cambios');
          setStatus('idle');
          return;
        }
        // 1. Obtener datos actuales de la compañía
        if (!loadedCompany.documentId) throw new Error('documentId no disponible para actualizar');
        const currentCompany = await companyService.getCompanyByDocumentId(loadedCompany.documentId);
        if (!currentCompany) throw new Error('No se pudo obtener la compañía actual');
        // 2. Armar payload preservando relaciones
        const { name, ...rest } = data;
        const payload: CompanyPayload = {
          name,
          description: rest,
          crypto_assets: currentCompany.crypto_assets,
          members: currentCompany.members,
          bots: (currentCompany as { bots?: unknown }).bots,
          metrics: (currentCompany as { metrics?: unknown }).metrics,
          users_permissions_users: (currentCompany as { users_permissions_users?: unknown }).users_permissions_users
        };
        // 3. Limpiar documentId si existe
        if ('documentId' in payload) delete (payload as Partial<CompanyPayload>).documentId;
        // 4. Actualizar en backend
        const updated = await companyService.updateCompanyByDocumentId(loadedCompany.documentId, payload);
        setCompanyFormData({ name: updated.name, description: updated.description } as CompanyPayload);
        console.log('Compañía actualizada:', updated);
        setStatus('success');
        // Esperar 3 segundos, luego actualizar localStorage y estado global
        setTimeout(async () => {
          // Refrescar completamente el localStorage con el usuario actualizado y todas sus relaciones (igual que login)
          try {
            const userStr = localStorage.getItem('user');
            const userEmail = userStr ? JSON.parse(userStr).email : user.email;
            const identifier = userEmail.trim();
            const encoded = encodeURIComponent(identifier);
            const res = await fetch(`${API_URL}/api/users?filters[$or][0][email][$eq]=${encoded}&filters[$or][1][username][$eq]=${encoded}&populate=*`);
            const json = await res.json();
            let userData = null;
            if (Array.isArray(json) && json.length > 0) {
              userData = json[0];
            } else if (Array.isArray(json.data) && json.data.length > 0) {
              userData = { id: json.data[0].id, ...json.data[0].attributes };
            }
            localStorage.clear();
            if (userData) {
              localStorage.setItem('user', JSON.stringify(userData));
              setUser(userData);
              console.log('localStorage actualizado tras resetear hash:', userData);
            }
            // Obtener la empresa actualizada y refrescar el formulario
            const refreshedCompany = await companyService.getCompanyByDocumentId(loadedCompany.documentId);
            if (refreshedCompany) {
              setCompanyFormData(refreshedCompany);
            }
          } catch (e) {
            console.warn('No se pudo refrescar el usuario en localStorage tras resetear hash:', e);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error al guardar la compañía', error);
    } finally {
      if (status === 'loading') setStatus('idle');
    }
  };

  // Estado para mostrar el hash generado y modal de éxito
  const [showHashSuccessModal, setShowHashSuccessModal] = useState(false);
  const [newHashValue, setNewHashValue] = useState('');

  const handleResetHash = async (documentId: string, documentoID: string) => {
    setResetHashStatus('loading');
    try {
      if (!loadedCompany) {
        alert('No se encontró información de la empresa');
        setResetHashStatus('idle');
        return;
      }
      // Validar que el documentoID coincida con el del usuario actual
      if (documentoID !== userDocumentoID) {
        alert('El número de documento de identidad no coincide con el registrado');
        setResetHashStatus('idle');
        return;
      }
      // 1. Obtener datos actuales de la compañía con todas las relaciones
      if (!documentId) throw new Error('documentId no disponible para actualizar');
      const currentCompany = await companyService.getCompanyByDocumentId(documentId); // ya usa populate=*
      if (!currentCompany) throw new Error('No se pudo obtener la compañía actual');
      // 2. Generar nuevo hash
      const newHash = crypto.randomUUID().replace(/-/g, '');
      // 3. Armar payload preservando TODAS las relaciones
      const payload: CompanyPayload = {
        name: currentCompany.name,
        description: currentCompany.description,
        crypto_assets: { ...(currentCompany.crypto_assets || {}), nft_hash: newHash },
        members: currentCompany.members,
        bots: (currentCompany as { bots?: unknown }).bots,
        metrics: (currentCompany as { metrics?: unknown }).metrics,
        users_permissions_users: (currentCompany as { users_permissions_users?: unknown }).users_permissions_users
      };
      // 4. Limpiar documentId si existe
      if ('documentId' in payload) delete (payload as Partial<CompanyPayload>).documentId;
      // 5. Actualizar en backend
      const updated = await companyService.updateCompanyByDocumentId(documentId, payload);
      // Obtener la empresa actualizada y refrescar el formulario
      const refreshedCompany = await companyService.getCompanyByDocumentId(documentId);
      if (refreshedCompany) {
        setCompanyFormData(refreshedCompany);
      }
      setNewHashValue(newHash); // Guardar el nuevo hash para mostrarlo
      setShowHashSuccessModal(true); // Mostrar modal de éxito (llave)
      setResetHashStatus('success');
      // Refrescar localStorage y estado global del usuario tras resetear hash
      try {
        const userStr = localStorage.getItem('user');
        const userEmail = userStr ? JSON.parse(userStr).email : user.email;
        const identifier = userEmail.trim();
        const encoded = encodeURIComponent(identifier);
        const res = await fetch(`${API_URL}/api/users?filters[$or][0][email][$eq]=${encoded}&filters[$or][1][username][$eq]=${encoded}&populate=*`);
        const json = await res.json();
        let userData = null;
        if (Array.isArray(json) && json.length > 0) {
          userData = json[0];
        } else if (Array.isArray(json.data) && json.data.length > 0) {
          userData = { id: json.data[0].id, ...json.data[0].attributes };
        }
        localStorage.clear();
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          console.log('localStorage actualizado tras resetear hash:', userData);
        }
      } catch (e) {
        console.warn('No se pudo refrescar el usuario en localStorage tras resetear hash:', e);
      }
      // Cerrar modal de éxito (check verde) automáticamente después de 3 segundos
      setTimeout(() => setResetHashStatus('idle'), 3000);
    } catch (error) {
      console.error('Error al resetear la llave contractual:', error);
      alert('Ocurrió un error al resetear la llave contractual');
      setResetHashStatus('idle');
    }
  };

  // Detectar si el usuario no tiene empresa
  const isSinEmpresa = !loadedCompany;

  const memoizedInitialValues = useMemo(() => ({
    name: companyFormData?.name ?? '',
    documentType: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).documentType : undefined) ?? defaultFields.documentType,
    documentNumber: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).documentNumber : undefined) ?? defaultFields.documentNumber,
    email: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).email : undefined) ?? defaultFields.email,
    country: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).country : undefined) ?? defaultFields.country,
    city: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).city : undefined) ?? defaultFields.city,
    sector: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).sector : undefined) ?? defaultFields.sector,
    service: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).service : undefined) ?? defaultFields.service,
    hash: companyFormData?.crypto_assets?.nft_hash ?? ''
  }), [companyFormData]);

  return (
    <>
      <Modal show={status !== 'idle' || loadingCompany || resetHashStatus !== 'idle'} centered onHide={() => setStatus('idle')}>
        <Modal.Body className="text-center">
          {loadingCompany || status==='loading' || resetHashStatus === 'loading' ? (
            <>
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="mb-0">
                {loadingCompany 
                  ? isEmployeeOrAgent 
                    ? 'Cargando información de la empresa...' 
                    : 'Cargando datos de la empresa...' 
                  : resetHashStatus === 'loading'
                    ? 'Reseteando llave contractual...'
                    : 'Guardando datos de la empresa...'}
              </p>
            </>
          ) : (
            <>
              <div style={{fontSize:'3rem', color:'#28a745'}}>&#10003;</div>
              <p className="mb-0">
                {resetHashStatus === 'success' 
                  ? '¡Llave contractual reseteada!' 
                  : '¡Datos guardados!'}
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showHashSuccessModal} onHide={() => setShowHashSuccessModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Llave contractual generada</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <strong>Tu nueva llave contractual NFT es:</strong>
            <div className="mt-2 p-2 bg-light border rounded text-break" style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>{newHashValue}</div>
            <small className="text-muted">Cópiala y guárdala en un lugar seguro. No podrás volver a verla.</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => { setShowHashSuccessModal(false); }}>Aceptar</Button>
        </Modal.Footer>
      </Modal>

      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={{ color: '#000000' }}>
          {isEmployeeOrAgent
            ? `Datos de la empresa ${companyFormData?.name || ''}`
            : 'Datos de empresa'}
        </h2>
          {/* Botón Editar solo para rol company, si hay empresa y no es cliente sin empresa */}
          {userRole === 'company' && companyFormData && !isSinEmpresa && !isEditing && (
            <Button variant="warning" onClick={() => setIsEditing(true)} style={{ fontWeight: 600 }}>
              Editar
            </Button>
          )}
        </div>
        <Card 
          className="border-0 shadow-sm mb-4"
          style={{ borderRadius: '8px' }}
        >
          <Card.Body className="p-4">
            {console.log('CompanyDataPage companyFormData:', companyFormData)}
            {/* Dashboard inicial y formulario de creación solo si el usuario no tiene empresa */}
            {isSinEmpresa && (
              <>
                <h2 className="mb-4" style={{ color: '#000000' }}>¡Bienvenido!</h2>
                <div className="text-center mb-4">
                  <p>¿Ya formas parte de una empresa?</p>
                  <p>Puedes crear una nueva empresa y generar tu llave contractual NFT única.</p>
                </div>
                <CompanyForm
                  initialValues={{
                    name: '',
                    documentType: defaultFields.documentType,
                    documentNumber: '',
                    email: '',
                    country: '',
                    city: '',
                    sector: '',
                    service: '',
                    hash: ''
                  }}
                  onSave={async (data) => {
                    await handleSaveCompany(data);
                  }}
                  createMode={true}
                  allowCreateHash={true}
                  readOnly={false}
                  hideHash={false}
                />
              </>
            )}
            {/* Formulario de edición solo si hay empresa */}
            {!isSinEmpresa && companyFormData && (
              <CompanyForm 
                readOnly={isEmployeeOrAgent || (userRole === 'company' && !isEditing)}
                hideHash={isEmployeeOrAgent}
                allowCreateHash={!isEmployeeOrAgent && !loadedCompany?.crypto_assets?.nft_hash}
                documentId={loadedCompany?.documentId}
                documentoID={userDocumentoID}
                onResetHash={userRole === 'company' && companyFormData ? handleResetHash : undefined}
                initialValues={memoizedInitialValues}
                onSave={async (data) => {
                  await handleSaveCompany(data);
                  if (userRole === 'company') setIsEditing(false);
                }}
                createMode={false}
              />
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default CompanyDataPage;
