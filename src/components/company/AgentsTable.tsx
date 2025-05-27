import React from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import './AgentsTable.css';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface AgentsTableProps {
  agents: Agent[];
  onView: (agent: Agent) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}

const AgentsTable: React.FC<AgentsTableProps> = ({ agents, onView, onEdit, onDelete }) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'admin-role';
      case 'supervisor':
        return 'supervisor-role';
      case 'agente':
        return 'agent-role';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="table-responsive">
      <Table hover className="align-middle agents-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {agents.length > 0 ? (
            agents.map((agent) => (
              <tr key={agent.id}>
                <td>{agent.name}</td>
                <td>{agent.email}</td>
                <td>{agent.phone}</td>
                <td>
                  <Badge className={`role-badge ${getRoleBadgeColor(agent.role)} px-2 py-1`}>
                    {agent.role}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex justify-content-center gap-2">
                    <Button 
                      variant="light" 
                      size="sm" 
                      onClick={() => onView(agent)}
                      className="action-btn view-btn"
                    >
                      <FaEye />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm" 
                      onClick={() => onEdit(agent)}
                      className="action-btn edit-btn"
                    >
                      <FaEdit />
                    </Button>
                    <Button 
                      variant="light" 
                      size="sm" 
                      onClick={() => onDelete(agent)}
                      className="action-btn delete-btn"
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-4">
                No hay agentes registrados
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default AgentsTable;
