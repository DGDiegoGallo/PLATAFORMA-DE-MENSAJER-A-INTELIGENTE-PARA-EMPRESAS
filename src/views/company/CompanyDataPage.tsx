import React, { useState } from 'react';
import { Container, Card } from 'react-bootstrap';
import DashboardLayout from '../../components/layout/DashboardLayout';
import CompanyForm from '../../components/company/CompanyForm';

const CompanyDataPage: React.FC = () => {
  // Mock data for the company
  const [companyData, setCompanyData] = useState({
    name: 'Nombre compañía',
    documentType: 'Rif',
    documentNumber: 'RIF',
    email: 'Correo',
    country: 'País',
    city: 'Ciudad',
    sector: 'Sector',
    service: 'Servicio/producto',
    password: '********'
  });

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

  const handleSaveCompany = (updatedData: CompanyData) => {
    setCompanyData(updatedData);
    // Here you would typically make an API call to update the company data
    console.log('Saving company data:', updatedData);
    // Show success message or handle errors
  };

  return (
    <DashboardLayout companyName="Nombre de la empresa">
      <Container fluid>
        <h2 className="mb-4" style={{ color: '#000000' }}>Datos de empresa</h2>
        
        <Card 
          className="border-0 shadow-sm mb-4"
          style={{ borderRadius: '8px' }}
        >
          <Card.Body className="p-4">
            <CompanyForm 
              initialData={companyData}
              onSave={handleSaveCompany}
            />
          </Card.Body>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default CompanyDataPage;
