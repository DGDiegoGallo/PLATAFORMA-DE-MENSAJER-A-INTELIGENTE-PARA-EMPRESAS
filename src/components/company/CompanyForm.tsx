import React, { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Form as BootstrapForm, Button, Row, Col } from 'react-bootstrap';

interface CompanyData {
  name: string;
  documentType: string;
  documentNumber: string;
  email: string;
  country: string;
  city: string;
  sector: string;
  service: string;
}

interface CompanyFormProps {
  initialValues: CompanyData;
  onSave: (data: CompanyData) => void;
  createMode?: boolean;
  readOnly?: boolean; // deshabilita campos y botón guardar
}

const CompanyForm: React.FC<CompanyFormProps> = ({ 
  initialValues, 
  onSave, 
  createMode = false, 
  readOnly = false 
}) => {
  const [formData, setFormData] = useState<CompanyData>(initialValues);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Mantener sincronizado el formulario cuando cambian los datos iniciales
  React.useEffect(() => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleSave = () => {
    onSave(formData);
  };

  // Función para obtener estilos condicionales
  const getFieldStyle = (isReadOnly: boolean) => {
    if (isReadOnly) {
      return {
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        color: '#495057',
        cursor: 'default',
        opacity: 0.8
      };
    }
    return {
      borderColor: '#EBC2BB',
      borderRadius: '4px'
    };
  };

  // Función para obtener estilos de etiquetas
  const getLabelStyle = (isReadOnly: boolean) => {
    if (isReadOnly) {
      return {
        color: '#6c757d',
        fontSize: '0.9rem',
        fontWeight: 'bold' as const
      };
    }
    return {
      color: '#767179',
      fontSize: '0.9rem'
    };
  };

  return (
    <>
      <BootstrapForm onSubmit={handleSubmit}>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 0 }}>
        <div className="mb-4">
          <h3 className="mb-4">Cuenta empresa</h3>
          
          {readOnly && (
            <div className="alert alert-secondary mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
              <div className="d-flex align-items-center">
                <svg width="20" height="20" className="me-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.66.2 3.34.2 5 0 5.16-1 9-5.45 9-11V7l-10-5z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                <small><strong>Modo solo lectura:</strong> Los datos de la empresa se muestran para consulta únicamente.</small>
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <BootstrapForm.Label style={getLabelStyle(readOnly)}>Nombre compañía</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nombre compañía"
              style={getFieldStyle(readOnly)}
              readOnly={readOnly}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={getLabelStyle(readOnly)}>Documento de identidad empresarial</BootstrapForm.Label>
            <Row>
              <Col xs={3}>
                <BootstrapForm.Select 
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleSelectChange}
                  style={getFieldStyle(readOnly)}
                  disabled={readOnly}
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
                  style={getFieldStyle(readOnly)}
                  readOnly={readOnly}
                />
              </Col>
            </Row>
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={getLabelStyle(readOnly)}>Correo</BootstrapForm.Label>
            <BootstrapForm.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Correo"
              style={getFieldStyle(readOnly)}
              readOnly={readOnly}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={getLabelStyle(readOnly)}>País</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="País"
              style={getFieldStyle(readOnly)}
              readOnly={readOnly}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={getLabelStyle(readOnly)}>Ciudad</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Ciudad"
              style={getFieldStyle(readOnly)}
              readOnly={readOnly}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={getLabelStyle(readOnly)}>Sector</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
              placeholder="Sector"
              style={getFieldStyle(readOnly)}
              readOnly={readOnly}
            />
          </div>
          
          <div className="mb-3">
            <BootstrapForm.Label style={getLabelStyle(readOnly)}>Servicio/producto</BootstrapForm.Label>
            <BootstrapForm.Control
              type="text"
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              placeholder="Servicio/producto"
              style={getFieldStyle(readOnly)}
              readOnly={readOnly}
            />
          </div>
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
      </BootstrapForm>

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
          <Button variant="warning" style={{ background: '#F44123', border: 'none', fontWeight: 600 }} onClick={() => { setShowSaveModal(false); handleSave(); }}>
            Confirmar y guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CompanyForm;
