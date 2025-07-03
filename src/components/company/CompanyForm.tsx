import React, { useState } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { Form as BootstrapForm, Button, Row, Col } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';

interface CompanyData {
  name: string;
  documentType: string;
  documentNumber: string;
  email: string;
  country: string;
  city: string;
  sector: string;
  service: string;
  hash?: string;
}

interface CompanyFormProps {
  initialValues: CompanyData;
  onSave: (data: CompanyData) => void;
  createMode?: boolean;
  allowCreateHash?: boolean; // show button when true (ignored if readOnly)
  onCreateHash?: (hash: string) => void; // callback to persist hash
  readOnly?: boolean; // deshabilita campos y botón guardar
  hideHash?: boolean; // oculta campo hash, útil para empleados/agentes
  onResetHash?: (documentId: string, documentoID: string) => void; // callback para resetear el hash
  documentId?: string; // ID del documento para resetear hash
  documentoID?: string; // Número de documento de identidad del usuario
}

const CompanyForm: React.FC<CompanyFormProps> = ({ 
  initialValues, 
  onSave, 
  createMode = false, 
  allowCreateHash = false, 
  onCreateHash, 
  readOnly = false, 
  hideHash = false,
  onResetHash,
  documentId,
  documentoID
}) => {
  // El hash siempre inicia vacío, aunque haya uno en initialValues
  const [formData, setFormData] = useState<CompanyData>({ ...initialValues, hash: '' });
  const [showHashModal, setShowHashModal] = useState(false);
  const [generatedHash, setGeneratedHash] = useState('');
  const [errors, setErrors] = useState<{hash?: string}>({});
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [userDocumentoID, setUserDocumentoID] = useState('');
  const [documentoIDError, setDocumentoIDError] = useState('');
  const [showHashErrorModal, setShowHashErrorModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Mantener sincronizado el formulario cuando cambian los datos iniciales (por ejemplo al cargar desde API)
  React.useEffect(() => {
    // Solo actualiza si algún valor realmente cambió
    const keys = Object.keys(initialValues);
    const changed = keys.some(key => formData[key as keyof typeof formData] !== initialValues[key as keyof typeof initialValues]);
    if (changed) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  

  
  const validateForm = (): boolean => {
    if (hideHash) {
      // Cuando el hash está oculto, no validamos
      return true;
    }
    const newErrors: {hash?: string} = {};
    
    // Validate hash is not empty
    if (!formData.hash || formData.hash.trim() === '') {
      newErrors.hash = 'La llave contractual es requerida';
    } 
    // Validate hash format (32 character hex string)
    else if (!/^[0-9a-fA-F]{32}$/.test(formData.hash)) {
      newErrors.hash = 'El formato de la llave contractual es incorrecto (debe ser una llave de 32 caracteres)';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return false;
    // Validar que el hash ingresado coincida con el de initialValues (si existe)
    if (initialValues.hash && formData.hash !== initialValues.hash) {
      setShowHashErrorModal(true);
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleResetHash = () => {
    // Validar que el documento de identidad ingresado coincida con el almacenado
    if (!userDocumentoID) {
      setDocumentoIDError('Debes ingresar tu número de documento de identidad');
      return;
    }

    console.log('Valor ingresado:', userDocumentoID);
    console.log('Valor esperado (documentoID):', documentoID);

    if (userDocumentoID !== documentoID) {
      setDocumentoIDError('El número de documento de identidad no coincide con el registrado');
      return;
    }

    if (onResetHash && documentId) {
      setShowResetConfirmModal(false);
      setUserDocumentoID('');
      setDocumentoIDError('');
      onResetHash(documentId, userDocumentoID);
    }
  };
  
  // Actualizar solo el localStorage con el hash si el hash es correcto
  React.useEffect(() => {
    if (!readOnly && formData.hash && initialValues.hash && formData.hash === initialValues.hash) {
      // Actualiza el hash en localStorage
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.company && user.company.crypto_assets) {
            user.company.crypto_assets.nft_hash = formData.hash;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      } catch { /* ignore */ }
    }
  }, [formData.hash, initialValues.hash, readOnly]);

  return (
    <>
      <BootstrapForm onSubmit={handleSubmit}>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 0 }}>
        {/* Modo creación: se omite la contraseña */}
        <div className="mb-4">
          <h3 className="mb-4">Cuenta empresa</h3>
          
          {readOnly && (
            <div className="alert alert-info mb-4">
              <small>Estás viendo la información de la empresa. No puedes realizar cambios.</small>
            </div>
          )}
          
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Nombre compañía</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nombre compañía"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Documento de identidad empresarial</BootstrapForm.Label>
            <Row>
              <Col xs={3}>
                <BootstrapForm.Select 
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleSelectChange}
                  style={{ 
                    borderColor: '#EBC2BB',
                    borderRadius: '4px'
                  }}
                >
                  <option value="Rif">Rif</option>
                  <option value="NIT">NIT</option>
                  <option value="RUT">RUT</option>
                  <option value="CUIT">CUIT</option>
                  <option value="RFC">RFC</option>
                </BootstrapForm.Select>
              </Col>
              <Col xs={9}>
                <BootstrapForm.Control
                  type="text"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleInputChange}
                  placeholder="RIF"
                  style={{ 
                    borderColor: '#EBC2BB',
                    borderRadius: '4px'
                  }}
                />
              </Col>
            </Row>
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Correo</BootstrapForm.Label>
            <BootstrapForm.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Correo"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>País</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="País"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Ciudad</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Ciudad"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Sector</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
              placeholder="Sector"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Servicio/producto</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              placeholder="Servicio/producto"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Hash */}
          {!hideHash && (
          <div className="mb-3">
            <BootstrapForm.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Llave contractual NFT</BootstrapForm.Label>
            <Row>
              <Col xs={9}>
                <BootstrapForm.Control
                  type="text"
                  name="hash"
                  value={formData.hash || ''}
                  onChange={handleInputChange}
                  placeholder="Coloca aquí tu llave contractual NFT"
                  style={{ 
                    borderColor: errors.hash ? '#dc3545' : '#EBC2BB', 
                    borderRadius: '4px' 
                  }}
                  className={errors.hash ? 'is-invalid' : ''}
                  autoComplete="off"
                />
                {errors.hash && (
                  <div className="invalid-feedback d-block">
                    {errors.hash}
                  </div>
                )}
              </Col>
              <Col xs={3} className="d-flex align-items-center">
                {allowCreateHash && !formData.hash && (
                  <Button
                    variant="secondary"
                    type="button"
                    className="w-100"
                    onClick={() => {
                      // Generar hash y mostrar modal
                      const randomHash = crypto.randomUUID().replace(/-/g, '');
                      setGeneratedHash(randomHash);
                      setFormData(prev => ({ ...prev, hash: randomHash }));
                      setShowHashModal(true);
                    }}
                  >
                    Generar llave
                  </Button>
                )}
                {/* Botón de resetear llave */}
                {/* Mostrar siempre si onResetHash y documentId existen, sin depender de initialValues.hash */}
                {!readOnly && onResetHash && documentId && (
                  <Button
                    variant="warning"
                    type="button"
                    className="ms-2"
                    onClick={() => setShowResetConfirmModal(true)}
                  >
                    <FaSync className="me-1" /> Resetear llave
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        )}
      </div>
      </fieldset>
      {/* Botón para crear empresa solo en modo creación y si no es solo lectura */}
      {createMode && !readOnly && (
        <div className="d-flex justify-content-end mt-4">
          <Button type="submit" style={{ background: '#F44123', border: 'none', fontWeight: 600 }}>
            Crear empresa
          </Button>
        </div>
      )}
      {/* Botón para guardar cambios solo en modo edición y si no es solo lectura */}
      {!createMode && !readOnly && (
        <div className="d-flex justify-content-end mt-4">
          <Button type="button" style={{ background: '#F44123', border: 'none', fontWeight: 600 }} onClick={() => setShowSaveModal(true)}>
            Guardar cambios
          </Button>
        </div>
      )}
      <Modal show={showHashModal} onHide={()=>{setShowHashModal(false); if(onCreateHash && generatedHash){onCreateHash(generatedHash);}}} centered>
        <Modal.Header closeButton>
          <Modal.Title>Llave contractual NFT generada</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Copia y guarda esta llave contractual, no volverá a mostrarse:</p>
          <code style={{userSelect:'all', wordBreak:'break-all'}}>{generatedHash}</code>
        </Modal.Body>
      </Modal>

      {/* Modal de confirmación para resetear hash */}
      <Modal show={showResetConfirmModal} onHide={() => {
        setShowResetConfirmModal(false);
        setUserDocumentoID('');
        setDocumentoIDError('');
      }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar reseteo de llave</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro que deseas resetear tu llave contractual NFT?</p>
          <p>Esta acción generará una nueva llave y la anterior dejará de funcionar.</p>
          
          <Form.Group className="mb-3">
            <Form.Label>Para confirmar, ingresa tu número de documento de identidad (DNI)</Form.Label>
            <Form.Control
              type="text"
              value={userDocumentoID}
              onChange={(e) => setUserDocumentoID(e.target.value)}
              placeholder="Ingresa tu DNI"
              isInvalid={!!documentoIDError}
            />
            {documentoIDError && (
              <Form.Control.Feedback type="invalid">
                {documentoIDError}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowResetConfirmModal(false);
            setUserDocumentoID('');
            setDocumentoIDError('');
          }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleResetHash}>
            Resetear llave
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal de confirmación para guardar cambios */}
      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar cambios</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas guardar los cambios en los datos de la empresa?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
            Cancelar
          </Button>
          <Button variant="warning" style={{ background: '#F44123', border: 'none', fontWeight: 600 }} onClick={() => { setShowSaveModal(false); handleSubmit(new Event('submit') as any); }}>
            Confirmar y guardar
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal de error de hash */}
      <Modal show={showHashErrorModal} onHide={() => setShowHashErrorModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Llave incorrecta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          La llave contractual ingresada no es correcta. Por favor, verifica e inténtalo de nuevo.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowHashErrorModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </BootstrapForm>
    </>
  );
};

export default CompanyForm;
