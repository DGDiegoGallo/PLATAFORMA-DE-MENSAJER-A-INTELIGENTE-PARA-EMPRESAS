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
  const { user, setUser } = useAuth() as ReturnType<typeof useAuth>;
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
  };
  const [companyFormData, setCompanyFormData] = useState<CompanyPayload | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
  };

  const handleSaveCompany = async (data: FormData) => {
    setStatus('loading');
    try {
      if (!companyFormData) {
        // Crear nueva empresa
        const { name, ...rest } = data;
        const payload: CompanyPayload = {
          name,
          description: rest,
        };
        
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
          
          // Refrescar completamente el localStorage con el usuario actualizado
          try {
            const userStr = localStorage.getItem('user');
            const userEmail = userStr ? JSON.parse(userStr).email : user?.email || '';
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
            navigate('/company');
          }, 1500);
        }, 2000);
      } else {
        // Actualizar compañía existente
        if (!loadedCompany?.documentId) throw new Error('documentId no disponible para actualizar');
        
        // Obtener datos actuales de la compañía
        const currentCompany = await companyService.getCompanyByDocumentId(loadedCompany.documentId);
        if (!currentCompany) throw new Error('No se pudo obtener la compañía actual');
        
        // Armar payload preservando relaciones
        const { name, ...rest } = data;
        const payload: CompanyPayload = {
          name,
          description: rest,
          members: currentCompany.members,
          bots: (currentCompany as { bots?: unknown }).bots,
          metrics: (currentCompany as { metrics?: unknown }).metrics,
          users_permissions_users: (currentCompany as { users_permissions_users?: unknown }).users_permissions_users
        };
        
        // Limpiar documentId si existe
        if ('documentId' in payload) delete (payload as Partial<CompanyPayload>).documentId;
        
        // Actualizar en backend
        const updated = await companyService.updateCompanyByDocumentId(loadedCompany.documentId, payload);
        setCompanyFormData({ name: updated.name, description: updated.description } as CompanyPayload);
        console.log('Compañía actualizada:', updated);
        setStatus('success');
        
        // Esperar 3 segundos y actualizar localStorage
        setTimeout(async () => {
          try {
            const userStr = localStorage.getItem('user');
            const userEmail = userStr ? JSON.parse(userStr).email : user?.email || '';
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
            
            // Obtener la empresa actualizada y refrescar el formulario
            if (loadedCompany.documentId) {
              const refreshedCompany = await companyService.getCompanyByDocumentId(loadedCompany.documentId);
              if (refreshedCompany) {
                setCompanyFormData(refreshedCompany);
              }
            }
          } catch (e) {
            console.warn('No se pudo refrescar el usuario en localStorage:', e);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error al guardar la compañía', error);
    } finally {
      if (status === 'loading') setStatus('idle');
    }
  };

  // Detectar si el usuario no tiene empresa
  const isSinEmpresa = !loadedCompany;

  const memoizedInitialValues = useMemo(() => ({
    name: companyFormData?.name ?? '',
    documentType: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).documentType as string : undefined) ?? defaultFields.documentType,
    documentNumber: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).documentNumber as string : undefined) ?? defaultFields.documentNumber,
    email: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).email as string : undefined) ?? defaultFields.email,
    country: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).country as string : undefined) ?? defaultFields.country,
    city: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).city as string : undefined) ?? defaultFields.city,
    sector: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).sector as string : undefined) ?? defaultFields.sector,
    service: (companyFormData?.description && typeof companyFormData.description === 'object' ? (companyFormData.description as Record<string, unknown>).service as string : undefined) ?? defaultFields.service,
  }), [companyFormData]);

  return (
    <>
      <Modal show={status !== 'idle' || loadingCompany} centered onHide={() => setStatus('idle')}>
        <Modal.Body className="text-center">
          {loadingCompany || status === 'loading' ? (
            <>
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="mb-0">
                {loadingCompany 
                  ? isEmployeeOrAgent 
                    ? 'Cargando información de la empresa...' 
                    : 'Cargando datos de la empresa...' 
                  : 'Guardando datos de la empresa...'}
              </p>
            </>
          ) : (
            <>
              <div style={{fontSize:'3rem', color:'#28a745'}}>&#10003;</div>
              <p className="mb-0">¡Datos guardados!</p>
            </>
          )}
        </Modal.Body>
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
            {/* Dashboard inicial y formulario de creación solo si el usuario no tiene empresa */}
            {isSinEmpresa && (
              <>
                <h2 className="mb-4" style={{ color: '#000000' }}>¡Bienvenido!</h2>
                <div className="text-center mb-4">
                  <p>¿Ya formas parte de una empresa?</p>
                  <p>Puedes crear una nueva empresa fácilmente.</p>
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
                  }}
                  onSave={async (data) => {
                    await handleSaveCompany(data);
                  }}
                  createMode={true}
                  readOnly={false}
                />
              </>
            )}
            
            {/* Formulario de edición solo si hay empresa */}
            {!isSinEmpresa && companyFormData && (
              <CompanyForm 
                readOnly={isEmployeeOrAgent || (userRole === 'company' && !isEditing)}
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
