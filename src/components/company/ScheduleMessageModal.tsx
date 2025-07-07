import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface ScheduleMessageModalProps {
  show: boolean;
  onHide: () => void;
  onSchedule: (message: string, scheduledTime: Date) => void;
}

const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({ 
  show, 
  onHide,
  onSchedule 
}) => {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  
  // Obtener fecha de hoy formateada YYYY-MM-DD para el mínimo del input (fecha local)
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  
  const handleSubmit = () => {
    if (!date || !time || !message.trim()) return;
    
    // Crear objeto Date con la fecha y hora seleccionadas
    const scheduledTime = new Date(`${date}T${time}:00`);
    
    // Verificar que sea al menos 1 minuto en el futuro para dar tiempo al procesamiento
    const now = new Date();
    const minTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minuto en el futuro
    
    if (scheduledTime <= minTime) {
      alert('Por favor, selecciona una hora que sea al menos 1 minuto en el futuro.');
      return;
    }
    
    onSchedule(message, scheduledTime);
    setMessage('');
    setDate('');
    setTime('');
    onHide();
  };

  const handleCancel = () => {
    setMessage('');
    setDate('');
    setTime('');
    onHide();
  };
  
  return (
    <Modal show={show} onHide={handleCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Programar mensaje</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Mensaje</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              placeholder="Escribe tu mensaje aquí..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </Form.Group>
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
        <Button variant="secondary" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!message.trim() || !date || !time}>
          Programar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ScheduleMessageModal; 