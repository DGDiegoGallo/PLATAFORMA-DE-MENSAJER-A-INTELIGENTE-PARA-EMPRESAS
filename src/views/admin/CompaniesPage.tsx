import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import CompaniesTable from '../../components/admin/CompaniesTable';
import { AdminCompanyResponse } from '../../features/admin/services/admin.service';

interface CompanyAttributes {
  name?: string;
  sector?: string;
  email?: string;
  country?: string;
  city?: string;
  description?: {
    sector?: string;
    email?: string;
    country?: string;
    city?: string;
    documentType?: string;
    documentNumber?: string;
    service?: string;
    hash?: string;
  };
}

const CompanyDetailModal: React.FC<{company: AdminCompanyResponse; onClose: () => void}> = ({ company, onClose }) => {
  const attr = ((company as any).attributes ?? company) as CompanyAttributes;
  const desc = attr.description ?? {};
  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Detalles de la Empresa</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row g-3">
          <div className="col-md-6">
            <strong>Nombre:</strong> {(attr.name as string | undefined) ?? '—'}
          </div>
          <div className="col-md-6">
            <strong>Sector:</strong> {(desc.sector as string | undefined) ?? (attr.sector as string | undefined) ?? '—'}
          </div>
          <div className="col-md-6">
            <strong>Email:</strong> {(desc.email as string | undefined) ?? (attr.email as string | undefined) ?? '—'}
          </div>
          <div className="col-md-6">
            <strong>País:</strong> {(desc.country as string | undefined) ?? (attr.country as string | undefined) ?? '—'}
          </div>
          <div className="col-md-6">
            <strong>Ciudad:</strong> {(desc.city as string | undefined) ?? '—'}
          </div>
          <div className="col-md-6">
            <strong>Documento:</strong> {(desc.documentType as string | undefined) ?? '—'} {(desc.documentNumber as string | undefined) ?? ''}
          </div>
          <div className="col-12">
            <strong>Servicio:</strong> {(desc.service as string | undefined) ?? '—'}
          </div>
          <div className="col-12">
            <strong>Hash:</strong> {(desc.hash as string | undefined) ?? '—'}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

const CompaniesPage: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyResponse | null>(null);

  const handleView = (company: AdminCompanyResponse) => {
    setSelectedCompany(company);
    // Aquí se podría mostrar un modal con detalles de la empresa
    console.log('Ver detalles de empresa:', company);
  };



  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold">Gestión de Empresas</h1>
          <p className="text-muted">
            Administre todas las empresas registradas en el sistema.
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <CompaniesTable onView={handleView} />
        </div>
      </div>
      {selectedCompany && (
        <CompanyDetailModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
};

export default CompaniesPage;