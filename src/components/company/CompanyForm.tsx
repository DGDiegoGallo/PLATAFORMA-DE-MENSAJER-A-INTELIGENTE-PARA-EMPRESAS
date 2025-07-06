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
    onSave(formData);
  };

  return (
    <>
      <BootstrapForm onSubmit={handleSubmit}>
        <fieldset disabled={readOnly} style={{ border: 0, padding: 0 }}>
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
          <Button variant="warning" style={{ background: '#F44123', border: 'none', fontWeight: 600 }} onClick={() => { setShowSaveModal(false); handleSubmit({} as React.FormEvent); }}>
            Confirmar y guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CompanyForm;
