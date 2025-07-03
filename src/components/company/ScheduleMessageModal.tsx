import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface ScheduleMessageModalProps {
  show: boolean;
  onHide: () => void;
  onSchedule: (scheduledTime: Date) => void;
}

const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({ 
  show, 
  onHide,
  onSchedule 
}) => {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  
  // Obtener fecha de hoy formateada YYYY-MM-DD para el mínimo del input
  const today = new Date().toISOString().split('T')[0];
  
  const handleSubmit = () => {
    if (!date || !time) return;
    
    // Crear objeto Date con la fecha y hora seleccionadas
    const scheduledTime = new Date(`${date}T${time}:00`);
    
    // Verificar que sea una fecha futura
    if (scheduledTime <= new Date()) {
      alert('Por favor, selecciona una fecha y hora futura.');
      return;
    }
    
    onSchedule(scheduledTime);
    onHide();
  };
  
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Programar mensaje</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Fecha</Form.Label>
            <Form.Control 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Hora</Form.Label>
            <Form.Control 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Programar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScheduleMessageModal; 