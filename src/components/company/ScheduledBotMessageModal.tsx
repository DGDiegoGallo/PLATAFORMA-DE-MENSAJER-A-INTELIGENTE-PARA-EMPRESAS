import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';
import { BotInfo } from '../../components/bot/BotSelectorModal';

interface ScheduledBotMessageModalProps {
  show: boolean;
  onHide: () => void;
  onSchedule: (message: string, scheduledTime: Date, selectedBot: BotInfo) => void;
  bots: BotInfo[];
  currentMessage: string;
}

const ScheduledBotMessageModal: React.FC<ScheduledBotMessageModalProps> = ({
  show,
  onHide,
  onSchedule,
  bots,
  currentMessage
}) => {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [selectedBot, setSelectedBot] = useState<BotInfo | null>(null);
  
  // Obtener fecha de hoy formateada YYYY-MM-DD para el mínimo del input (fecha local)
  const today = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  
  // Inicializar el mensaje con el mensaje actual cuando se abre el modal
  useEffect(() => {
    if (show && currentMessage) {
      setMessage(currentMessage);
    }
  }, [show, currentMessage]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir la recarga de la página
    
    if (!date || !time || !message.trim() || !selectedBot) {
      alert('Por favor, completa todos los campos.');
      return;
    }
    
    // Crear objeto Date con la fecha y hora seleccionadas
    const scheduledTime = new Date(`${date}T${time}:00`);
    
    // Verificar que sea al menos 1 minuto en el futuro para dar tiempo al procesamiento
    const now = new Date();
    const minTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minuto en el futuro
    
    if (scheduledTime <= minTime) {
      alert('Por favor, selecciona una hora que sea al menos 1 minuto en el futuro.');
      return;
    }
      
    onSchedule(message, scheduledTime, selectedBot);
    handleClose();
  };
  
  const handleClose = () => {
    // Limpiar formulario
    setDate('');
    setTime('');
    setMessage('');
    setSelectedBot(null);
    onHide();
  };
  
  const handleSelectBot = (e: React.MouseEvent, bot: BotInfo) => {
    // Asegurarse de que no se envíe el formulario
    e.preventDefault();
    e.stopPropagation();
    setSelectedBot(bot);
  };
  
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Programar mensaje con respuesta de bot</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Mensaje</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
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
          
          <Form.Group className="mb-3">
            <Form.Label>Selecciona un bot</Form.Label>
            {bots.length === 0 ? (
              <p className="text-muted">No hay bots configurados para este canal.</p>
            ) : (
              <ListGroup className="mb-3">
                {bots.map((bot) => (
                  <ListGroup.Item
                    action
                    key={bot.name}
                    active={selectedBot?.name === bot.name}
                    onClick={(e) => handleSelectBot(e, bot)}
                    style={{ cursor: 'pointer' }}
                  >
                    {bot.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} type="button">
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!date || !time || !message.trim() || !selectedBot}
          >
            Programar
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ScheduledBotMessageModal; 