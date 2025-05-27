import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface CompanyData {
  name: string;
  documentType: string;
  documentNumber: string;
  email: string;
  country: string;
  city: string;
  sector: string;
  service: string;
  password: string;
}

interface CompanyFormProps {
  initialData: CompanyData;
  onSave: (data: CompanyData) => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ initialData, onSave }) => {
  const [formData, setFormData] = useState<CompanyData>(initialData);
  const [showPassword, setShowPassword] = useState(false);
  
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
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <Form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h3 className="mb-4">Cuenta empresa</h3>
        
        <div className="mb-3">
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Nombre compañía</Form.Label>
          <Form.Control
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
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Documento de identidad empresarial</Form.Label>
          <Row>
            <Col xs={3}>
              <Form.Select 
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
              </Form.Select>
            </Col>
            <Col xs={9}>
              <Form.Control
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
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Correo</Form.Label>
          <Form.Control
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
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>País</Form.Label>
          <Form.Control
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
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Ciudad</Form.Label>
          <Form.Control
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
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Sector</Form.Label>
          <Form.Control
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
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Servicio/producto</Form.Label>
          <Form.Control
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
        
        <div className="mb-3">
          <Form.Label style={{ color: '#767179', fontSize: '0.9rem' }}>Contraseña</Form.Label>
          <div className="d-flex">
            <Form.Control
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Contraseña"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px 0 0 4px'
              }}
            />
            <Button 
              type="button" 
              onClick={togglePasswordVisibility}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                padding: '0.375rem 0.5rem',
                fontSize: '1rem',
                fontWeight: '400',
                lineHeight: '1.4',
                color: '#767179',
                textAlign: 'center',
                backgroundColor: '#fff',
                border: '1px solid #EBC2BB',
                borderRadius: '0 0.25rem 0.25rem 0',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </Button>
          </div>
          <div className="d-flex justify-content-end mt-2">
            <Button 
              variant="link" 
              className="p-0"
              style={{ 
                color: '#F44123',
                textDecoration: 'none',
                fontSize: '0.875rem'
              }}
            >
              Cambiar contraseña
            </Button>
          </div>
        </div>
      </div>
      
      <div className="d-flex justify-content-center mt-4">
        <Button 
          type="submit" 
          style={{ 
            backgroundColor: '#F44123',
            borderColor: '#F44123',
            padding: '0.5rem 1.5rem'
          }}
        >
          Guardar cambios
        </Button>
      </div>
    </Form>
  );
};

export default CompanyForm;
