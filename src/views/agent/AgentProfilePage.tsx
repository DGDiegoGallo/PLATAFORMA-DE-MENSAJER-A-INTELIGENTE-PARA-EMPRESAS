import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { FaUser, FaPencilAlt } from 'react-icons/fa';
import AgentDashboardLayout from '../../components/layout/AgentDashboardLayout';
import { EditableProfileData } from '../../types/interfaces/profile.interfaces';
import './AgentProfilePage.css';

// Definición de la interfaz para las props del componente
interface AgentProfilePageProps {
  isEditMode?: boolean;
}

// Usando las interfaces importadas desde el archivo centralizado

const AgentProfilePage: React.FC<AgentProfilePageProps> = ({ isEditMode = false }) => {
  // Mock data for agent profile
  const [profileData, setProfileData] = useState<EditableProfileData>({
    username: { value: '@profileexample', isEditing: false },
    fullName: { value: 'Nombre y Apellido', isEditing: false },
    phone: { value: '+00 000 000 0000', isEditing: false },
    email: { value: 'profileexample@email.com', isEditing: false },
    idType: { value: 'DNI', isEditing: false },
    idNumber: { value: '0000000', isEditing: false },
    birthDate: { value: 'DD/MM/YYYY', isEditing: false },
    address: { value: 'Ciudad, Calle, Residencia, Habitación', isEditing: false },
    password: { value: '••••••••••', isEditing: false }
  });

  // Efecto para activar el modo de edición cuando isEditMode es true
  useEffect(() => {
    if (isEditMode) {
      // Activar el modo de edición para todos los campos
      setProfileData(prev => {
        const updatedData = { ...prev };
        
        Object.keys(updatedData).forEach(key => {
          updatedData[key] = {
            ...updatedData[key],
            isEditing: true
          };
        });
        
        return updatedData;
      });
    }
  }, [isEditMode]); // Eliminar profileData de las dependencias para evitar bucles

  // Function to handle edit button click
  const handleEdit = (field: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof prev],
        isEditing: true
      }
    }));
  };

  // Function to handle input change
  const handleChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof typeof prev],
        value
      }
    }));
  };

  // Function to save changes
  const handleSave = () => {
    // Here you would typically make an API call to save the changes
    // For now, we'll just turn off editing mode for all fields
    setProfileData(prev => {
      const updatedData = { ...prev };
      
      Object.keys(updatedData).forEach(key => {
        updatedData[key] = {
          ...updatedData[key],
          isEditing: false
        };
      });
      
      return updatedData;
    });
  };

  // Function to cancel changes
  const handleCancel = () => {
    // Reset editing mode for all fields without saving
    setProfileData(prev => {
      const updatedData = { ...prev };
      
      Object.keys(updatedData).forEach(key => {
        updatedData[key] = {
          ...updatedData[key],
          isEditing: false
        };
      });
      
      return updatedData;
    });
  };

  // Function to handle password change
  const handlePasswordChange = () => {
    // Implement password change functionality
    console.log('Change password clicked');
  };

  return (
    <AgentDashboardLayout companyName="YIELIT">
      <Container fluid>
        <Card className="agent-profile-card">
          <Card.Header className="agent-profile-header">
            <h2 style={{ color: '#000000', margin: 0 }}>Mi cuenta</h2>
          </Card.Header>
          <Card.Body className="agent-profile-body">
            <div className="agent-profile-avatar">
              <FaUser size={40} color="#FFFFFF" />
            </div>

            <Form>
              <Row className="form-row">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nombre de usuario</Form.Label>
                    <div className="d-flex">
                      {profileData.username.isEditing ? (
                        <Form.Control
                          type="text"
                          value={profileData.username.value}
                          onChange={(e) => handleChange('username', e.target.value)}
                        />
                      ) : (
                        <Form.Control
                          plaintext
                          readOnly
                          value={profileData.username.value}
                          className="form-control-plaintext"
                        />
                      )}
                      <Button 
                        className="edit-button ms-2" 
                        onClick={() => handleEdit('username')}
                      >
                        <FaPencilAlt />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Número de teléfono</Form.Label>
                    <div className="d-flex">
                      {profileData.phone.isEditing ? (
                        <Form.Control
                          type="tel"
                          value={profileData.phone.value}
                          onChange={(e) => handleChange('phone', e.target.value)}
                        />
                      ) : (
                        <Form.Control
                          plaintext
                          readOnly
                          value={profileData.phone.value}
                          className="form-control-plaintext"
                        />
                      )}
                      <Button 
                        className="edit-button ms-2" 
                        onClick={() => handleEdit('phone')}
                      >
                        <FaPencilAlt />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="form-row">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Nombre completo</Form.Label>
                    <div className="d-flex">
                      {profileData.fullName.isEditing ? (
                        <Form.Control
                          type="text"
                          value={profileData.fullName.value}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                        />
                      ) : (
                        <Form.Control
                          plaintext
                          readOnly
                          value={profileData.fullName.value}
                          className="form-control-plaintext"
                        />
                      )}
                      <Button 
                        className="edit-button ms-2" 
                        onClick={() => handleEdit('fullName')}
                      >
                        <FaPencilAlt />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Row>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Tipo</Form.Label>
                        <Form.Select 
                          value={profileData.idType.value}
                          onChange={(e) => handleChange('idType', e.target.value)}
                          disabled={!profileData.idType.isEditing}
                        >
                          <option value="DNI">DNI</option>
                          <option value="Pasaporte">Pasaporte</option>
                          <option value="Cédula">Cédula</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Número de identificación</Form.Label>
                        <div className="d-flex">
                          {profileData.idNumber.isEditing ? (
                            <Form.Control
                              type="text"
                              value={profileData.idNumber.value}
                              onChange={(e) => handleChange('idNumber', e.target.value)}
                            />
                          ) : (
                            <Form.Control
                              plaintext
                              readOnly
                              value={profileData.idNumber.value}
                              className="form-control-plaintext"
                            />
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>

              <Row className="form-row">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Correo</Form.Label>
                    <div className="d-flex">
                      {profileData.email.isEditing ? (
                        <Form.Control
                          type="email"
                          value={profileData.email.value}
                          onChange={(e) => handleChange('email', e.target.value)}
                        />
                      ) : (
                        <Form.Control
                          plaintext
                          readOnly
                          value={profileData.email.value}
                          className="form-control-plaintext"
                        />
                      )}
                      <Button 
                        className="edit-button ms-2" 
                        onClick={() => handleEdit('email')}
                      >
                        <FaPencilAlt />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fecha de nacimiento</Form.Label>
                    <div className="d-flex">
                      {profileData.birthDate.isEditing ? (
                        <Form.Control
                          type="text"
                          value={profileData.birthDate.value}
                          onChange={(e) => handleChange('birthDate', e.target.value)}
                        />
                      ) : (
                        <Form.Control
                          plaintext
                          readOnly
                          value={profileData.birthDate.value}
                          className="form-control-plaintext"
                        />
                      )}
                      <Button 
                        className="edit-button ms-2" 
                        onClick={() => handleEdit('birthDate')}
                      >
                        <FaPencilAlt />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="form-row">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      plaintext
                      readOnly
                      value={profileData.password.value}
                      className="form-control-plaintext"
                    />
                    <div className="mt-2">
                      <span 
                        className="password-change-link" 
                        onClick={handlePasswordChange}
                      >
                        Cambiar contraseña
                      </span>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Dirección</Form.Label>
                    <div className="d-flex">
                      {profileData.address.isEditing ? (
                        <Form.Control
                          type="text"
                          value={profileData.address.value}
                          onChange={(e) => handleChange('address', e.target.value)}
                        />
                      ) : (
                        <Form.Control
                          plaintext
                          readOnly
                          value={profileData.address.value}
                          className="form-control-plaintext"
                        />
                      )}
                      <Button 
                        className="edit-button ms-2" 
                        onClick={() => handleEdit('address')}
                      >
                        <FaPencilAlt />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-4">
                <Col className="d-flex justify-content-end gap-3">
                  <Button 
                    className="cancel-button" 
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="save-button" 
                    onClick={handleSave}
                  >
                    Guardar cambios
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </AgentDashboardLayout>
  );
};

export default AgentProfilePage;
