import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';

interface UserProfileData {
  username: string;
  fullName: string;
  phone: string;
  idType: string;
  idNumber: string;
  email: string;
  address: string;
  birthDate: string;
}

interface ProfileFormProps {
  initialData: UserProfileData;
  onSave: (data: UserProfileData) => void;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<UserProfileData>(initialData);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    <Form onSubmit={handleSubmit}>
      <Row className="mb-4">
        <Col md={6}>
          <div className="mb-3">
            <Form.Label className="fw-medium" style={{ color: '#000000' }}>Nombre de usuario</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              />
              <Button 
                variant="light" 
                className="ms-2 d-flex align-items-center justify-content-center"
                style={{ 
                  borderColor: '#EBC2BB',
                  color: '#484847',
                  width: '40px'
                }}
              >
                <FaEdit />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <Form.Label className="fw-medium" style={{ color: '#000000' }}>Nombre completo</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              />
              <Button 
                variant="light" 
                className="ms-2 d-flex align-items-center justify-content-center"
                style={{ 
                  borderColor: '#EBC2BB',
                  color: '#484847',
                  width: '40px'
                }}
              >
                <FaEdit />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <Form.Label className="fw-medium" style={{ color: '#000000' }}>Correo</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              />
              <Button 
                variant="light" 
                className="ms-2 d-flex align-items-center justify-content-center"
                style={{ 
                  borderColor: '#EBC2BB',
                  color: '#484847',
                  width: '40px'
                }}
              >
                <FaEdit />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <Form.Label className="fw-medium" style={{ color: '#000000' }}>Contraseña</Form.Label>
            <div>
              <Form.Control
                type="password"
                value="************"
                disabled
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              />
              <div className="mt-1">
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
        </Col>
        
        <Col md={6}>
          <div className="mb-3">
            <Form.Label className="fw-medium" style={{ color: '#000000' }}>Número de teléfono</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              />
              <Button 
                variant="light" 
                className="ms-2 d-flex align-items-center justify-content-center"
                style={{ 
                  borderColor: '#EBC2BB',
                  color: '#484847',
                  width: '40px'
                }}
              >
                <FaEdit />
              </Button>
            </div>
          </div>
          
          <Row className="mb-3">
            <Col xs={4}>
              <Form.Label className="fw-medium" style={{ color: '#000000' }}>Tipo</Form.Label>
              <Form.Select 
                name="idType"
                value={formData.idType}
                onChange={handleSelectChange}
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              >
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Otro">Otro</option>
              </Form.Select>
            </Col>
            <Col xs={8}>
              <Form.Label className="fw-medium" style={{ color: '#000000' }}>Número de identificación</Form.Label>
              <Form.Control
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              />
            </Col>
          </Row>
          
          <div className="mb-3">
            <Form.Label className="fw-medium" style={{ color: '#000000' }}>Dirección</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                style={{ 
                  borderColor: '#EBC2BB',
                  borderRadius: '4px'
                }}
              />
              <Button 
                variant="light" 
                className="ms-2 d-flex align-items-center justify-content-center"
                style={{ 
                  borderColor: '#EBC2BB',
                  color: '#484847',
                  width: '40px'
                }}
              >
                <FaEdit />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <Form.Label className="fw-medium" style={{ color: '#000000' }}>Fecha de nacimiento</Form.Label>
            <Form.Control
              type="text"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              placeholder="DD/MM/YYYY"
              style={{ 
                borderColor: '#EBC2BB',
                borderRadius: '4px'
              }}
            />
          </div>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-end gap-2">
        <Button 
          variant="outline-secondary" 
          onClick={onCancel}
          style={{ 
            borderColor: '#767179',
            color: '#767179'
          }}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          style={{ 
            backgroundColor: '#F44123',
            borderColor: '#F44123'
          }}
        >
          Guardar cambios
        </Button>
      </div>
    </Form>
  );
};

export default ProfileForm;
