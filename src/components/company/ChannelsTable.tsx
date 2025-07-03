import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaEye, FaEdit, FaTrashAlt, FaUserPlus } from 'react-icons/fa';

export type ChannelType = 'group' | 'channel' | 'event';
export type ChannelStatus = 'Active' | 'Inactive';

export interface ChannelMember {
  id: string;
  name: string;
  role: string; // Ej: 'Admin', 'Miembro', 'Invitado'
}

export interface Channel {
  id: string;
  documentId: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  creationDate: string; // Formato ISO Date string
  members: ChannelMember[];
}

interface ChannelsTableProps {
  /** Si es false, sólo se permite ver detalles; no crear/editar/eliminar */
  canManage?: boolean;
  channels: Channel[];
  onViewDetails?: (channel: Channel) => void;
  onEdit?: (channel: Channel) => void;
  onDelete?: (channel: Channel) => void;
  onAddMembers?: (channel: Channel) => void;
}

const noop = () => {};

const ChannelsTable: React.FC<ChannelsTableProps> = ({
  channels,
  onViewDetails = noop,
  onEdit = noop,
  onDelete = noop,
  onAddMembers = noop,
  canManage = true,
}) => {
  const getStatusBadge = (status: ChannelStatus) => {
    switch (status) {
      case 'Active':
        return <Badge pill bg="success" className="me-2"><span style={{fontSize: '1.2em', verticalAlign: 'middle'}}>&#x1F7E2;</span> Activo</Badge>; // Green circle
      case 'Inactive':
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
          <th className="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {channels.length > 0 ? (
          channels.map(channel => (
            <tr key={channel.id}>
              <td>{channel.name}</td>
              <td>{channel.type === 'group' ? 'Grupo' : channel.type === 'channel' ? 'Canal' : 'Evento'}</td>
              <td>{getStatusBadge(channel.status)}</td>
              <td className="text-center">
                <Button variant="link" onClick={() => { console.log('View details clicked for', channel); onViewDetails(channel); }} className="p-1 me-1" title="Ver Detalles">
                  <FaEye size={18} style={{ color: 'var(--color-dark-icons)' }} />
                </Button>
                {canManage && (
                  <>
                    <Button variant="link" onClick={() => onEdit(channel)} className="p-1 me-1" title="Editar">
                      <FaEdit size={18} style={{ color: 'var(--color-dark-icons)' }} />
                    </Button>
                    <Button variant="link" onClick={() => onAddMembers(channel)} className="p-1 me-1" title="Añadir Miembros">
                      <FaUserPlus size={18} style={{ color: 'var(--color-dark-icons)' }} />
                    </Button>
                    <Button variant="link" onClick={() => onDelete(channel)} className="p-1" title="Eliminar">
                      <FaTrashAlt size={18} style={{ color: 'var(--color-primary)' }} />
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              No hay canales para mostrar.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export default ChannelsTable;
