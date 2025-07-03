import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import MessagesTable from '../../components/admin/MessagesTable';
import { AdminMessageResponse } from '../../features/admin/services/admin.service';

interface MessageAttributes {
  name?: string;
  type?: string;
  status_of_channel?: string;
  createdAt?: string;
  company?: {
    data?: {
      attributes?: {
        name?: string;
      }
    };
    name?: string;
  };
}

const MessageDetailModal: React.FC<{message: AdminMessageResponse; onClose: () => void}> = ({ message, onClose }) => {
  const attr = ((message as any).attributes ?? message) as MessageAttributes;
  const companyName = attr.company?.data?.attributes?.name ?? attr.company?.name ?? '—';
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalles del Mensaje</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ul className="list-unstyled">
          <li><strong>ID:</strong> {message.id}</li>
          <li><strong>Nombre:</strong> {(attr.name as string | undefined) ?? '—'}</li>
          <li><strong>Tipo:</strong> {(attr.type as string | undefined) ?? '—'}</li>
          <li><strong>Estado:</strong> {(attr.status_of_channel as string | undefined) === 'active' ? 'Activo' : 'Inactivo'}</li>
          <li><strong>Empresa:</strong> {companyName}</li>
          <li><strong>Creado:</strong> {(attr.createdAt as string | undefined) ? new Date(attr.createdAt as string).toLocaleString() : '—'}</li>
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

const MessagesPage: React.FC = () => {
  const [selectedMessage, setSelectedMessage] = useState<AdminMessageResponse | null>(null);

  const handleView = (message: AdminMessageResponse) => {
    // Aquí se podría mostrar un modal con detalles del mensaje
    setSelectedMessage(message);
  };



  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold">Gestión de Mensajes</h1>
          <p className="text-muted">
            Administre todos los mensajes y canales de comunicación del sistema.
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <MessagesTable onView={handleView} />
        </div>
      </div>
      {selectedMessage && (
        <MessageDetailModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />
      )}
    </div>
  );
};

export default MessagesPage;