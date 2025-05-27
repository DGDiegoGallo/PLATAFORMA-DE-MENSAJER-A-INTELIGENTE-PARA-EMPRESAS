import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ProfileForm from '../../components/user/ProfileForm';
import { FaUser } from 'react-icons/fa';

const UserProfilePage: React.FC = () => {
  // Mock data for the user profile
  const [userData, setUserData] = useState({
    username: '@profileexample',
    fullName: 'Nombre y Apellido',
    phone: '+00 000 000 0000',
    idType: 'DNI',
    idNumber: '0000000',
    email: 'profileexample@email.com',
    address: 'Ciudad, Calle, Residencia, Habitación',
    birthDate: 'DD/MM/YYYY',
  });

  interface UserData {
    username: string;
    fullName: string;
    phone: string;
    idType: string;
    idNumber: string;
    email: string;
    address: string;
    birthDate: string;
  }

  const handleSaveProfile = (updatedData: UserData) => {
    setUserData(updatedData);
    // Here you would typically make an API call to update the user data
    console.log('Saving profile data:', updatedData);
    // Show success message or handle errors
  };

  const handleCancel = () => {
    // Reset form or navigate away
    console.log('Cancelled profile edit');
  };

  return (
    <DashboardLayout companyName="Nombre de la empresa">
      <Container fluid>
        <h2 className="mb-4" style={{ color: '#000000' }}>Mi cuenta</h2>
        
        <Card 
          className="border-0 shadow-sm mb-4"
          style={{ borderRadius: '8px' }}
        >
          <Card.Body className="p-4">
            <Row className="mb-4">
              <Col xs={12} className="text-center">
                <div className="d-inline-flex justify-content-center align-items-center mb-3"
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#EBEBEB',
                    borderRadius: '50%'
                  }}
                >
                  <FaUser size={40} style={{ color: '#484847' }} />
                </div>
              </Col>
            </Row>
            
            <ProfileForm 
              initialData={userData}
              onSave={handleSaveProfile}
              onCancel={handleCancel}
            />
          </Card.Body>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default UserProfilePage;
