import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaEye, FaEdit, FaTrashAlt } from 'react-icons/fa';

export type ChannelType = 'Grupo' | 'Público' | 'Privado';
export type ChannelStatus = 'Activo' | 'Inactivo';

export interface ChannelMember {
  id: string;
  name: string;
  role: string; // Ej: 'Admin', 'Miembro', 'Invitado'
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  description: string;
  creationDate: string; // Formato ISO Date string
  members: ChannelMember[];
}

interface ChannelsTableProps {
  channels: Channel[];
  onViewDetails: (channel: Channel) => void;
  onEdit: (channel: Channel) => void;
  onDelete: (channel: Channel) => void;
}

const ChannelsTable: React.FC<ChannelsTableProps> = ({ channels, onViewDetails, onEdit, onDelete }) => {
  const getStatusBadge = (status: ChannelStatus) => {
    switch (status) {
      case 'Activo':
        return <Badge pill bg="success" className="me-2"><span style={{fontSize: '1.2em', verticalAlign: 'middle'}}>&#x1F7E2;</span> Activo</Badge>; // Green circle
      case 'Inactivo':
        return <Badge pill bg="danger" className="me-2"><span style={{fontSize: '1.2em', verticalAlign: 'middle'}}>&#x1F534;</span> Inactivo</Badge>; // Red circle
      default:
        return <Badge pill bg="secondary">{status}</Badge>;
    }
  };

  return (
    <Table hover responsive className="align-middle">
      <thead style={{ backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }}>
        <tr>
          <th>Nombre del Canal</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Descripción</th>
          <th className="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {channels.length > 0 ? (
          channels.map(channel => (
            <tr key={channel.id}>
              <td>{channel.name}</td>
              <td>{channel.type}</td>
              <td>{getStatusBadge(channel.status)}</td>
              <td>{channel.description}</td>
              <td className="text-center">
                <Button variant="link" onClick={() => onViewDetails(channel)} className="p-1 me-1" title="Ver Detalles">
                  <FaEye size={18} style={{ color: 'var(--color-dark-icons)' }} />
                </Button>
                <Button variant="link" onClick={() => onEdit(channel)} className="p-1 me-1" title="Editar">
                  <FaEdit size={18} style={{ color: 'var(--color-dark-icons)' }} />
                </Button>
                <Button variant="link" onClick={() => onDelete(channel)} className="p-1" title="Eliminar">
                  <FaTrashAlt size={18} style={{ color: 'var(--color-primary)' }} />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No hay canales para mostrar.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export default ChannelsTable;
