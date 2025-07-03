import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup } from 'react-bootstrap';
import { FaClock, FaTrash, FaRobot } from 'react-icons/fa';
import ScheduleMessageModal from './ScheduleMessageModal';
import ScheduledBotMessageModal from './ScheduledBotMessageModal';
import { BotInfo } from '../bot/BotSelectorModal';

export interface ScheduledMessage {
  id: string;
  content: string;
  scheduledTime: Date;
  conversationId: string;
  conversationName: string;
  withBot?: boolean;
  botInfo?: BotInfo;
}

interface ScheduledMessagesManagerProps {
  conversationId: string | undefined;
  conversationName: string | undefined;
  onScheduleMessage: (message: string, scheduledTime: Date) => void;
  onScheduleBotMessage?: (message: string, scheduledTime: Date, bot: BotInfo) => void;
  currentMessage: string;
  availableBots: BotInfo[];
}

const ScheduledMessagesManager: React.FC<ScheduledMessagesManagerProps> = ({
  conversationId,
  conversationName,
  onScheduleMessage,
  onScheduleBotMessage,
  currentMessage,
  availableBots = []
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBotScheduleModal, setShowBotScheduleModal] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  
  // Cargar mensajes programados del localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scheduledMessages');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convertir strings de fecha a objetos Date
        const messages = parsed.map((msg: Record<string, unknown>) => ({
          ...msg,
          scheduledTime: new Date(msg.scheduledTime as string)
        }));
        setScheduledMessages(messages);
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
    }
  }, []);
  
  // Guardar mensajes programados en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('scheduledMessages', JSON.stringify(scheduledMessages));
  }, [scheduledMessages]);
  
  const handleSchedule = (scheduledTime: Date) => {
    if (!currentMessage.trim() || !conversationId) return;
    
    const newScheduledMessage: ScheduledMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      scheduledTime,
      conversationId,
      conversationName: conversationName || 'Chat'
    };
    
    setScheduledMessages(prev => [...prev, newScheduledMessage]);
    onScheduleMessage(currentMessage, scheduledTime);
  };
  
  const handleBotSchedule = (message: string, scheduledTime: Date, botInfo: BotInfo) => {
    if (!message.trim() || !conversationId || !onScheduleBotMessage) return;
    
    const newScheduledMessage: ScheduledMessage = {
      id: Date.now().toString(),
      content: message,
      scheduledTime,
      conversationId,
      conversationName: conversationName || 'Chat',
      withBot: true,
      botInfo
    };
    
    setScheduledMessages(prev => [...prev, newScheduledMessage]);
    onScheduleBotMessage(message, scheduledTime, botInfo);
  };
  
  const handleDelete = (id: string) => {
    setScheduledMessages(prev => prev.filter(msg => msg.id !== id));
  };
  
  // Formatear fecha para mostrar
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Filtrar mensajes para esta conversación
  const conversationMessages = conversationId 
    ? scheduledMessages.filter(msg => msg.conversationId === conversationId)
    : [];
  
  return (
    <Card className="mt-3 mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <FaClock className="me-2" />
          Mensajes Programados
        </div>
        <div>
          <Button 
            size="sm" 
            variant="outline-primary"
            className="me-2"
            onClick={() => setShowBotScheduleModal(true)}
            disabled={!currentMessage.trim() || !conversationId || availableBots.length === 0}
            title={availableBots.length === 0 ? "No hay bots disponibles" : "Programar con respuesta de bot"}
          >
            <FaRobot className="me-1" /> Programar con bot
          </Button>
          <Button 
            size="sm" 
            variant="primary"
            onClick={() => setShowScheduleModal(true)}
            disabled={!currentMessage.trim() || !conversationId}
          >
            Programar mensaje
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {conversationMessages.length === 0 ? (
          <p className="text-muted text-center">No hay mensajes programados para esta conversación</p>
        ) : (
          <ListGroup>
            {conversationMessages.map(msg => (
              <ListGroup.Item 
                key={msg.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <div className="text-truncate" style={{ maxWidth: '250px' }}>
                    {msg.content}
                    {msg.withBot && (
                      <span className="ms-2 badge bg-info">
                        <FaRobot className="me-1" size={12} />
                        {msg.botInfo?.name || 'Bot'}
                      </span>
                    )}
                  </div>
                  <small className="text-muted">
                    <FaClock className="me-1" size={12} />
                    {formatDateTime(msg.scheduledTime)}
                  </small>
                </div>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => handleDelete(msg.id)}
                >
                  <FaTrash size={14} />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
      
      <ScheduleMessageModal
        show={showScheduleModal}
        onHide={() => setShowScheduleModal(false)}
        onSchedule={handleSchedule}
      />
      
      <ScheduledBotMessageModal
        show={showBotScheduleModal}
        onHide={() => setShowBotScheduleModal(false)}
        onSchedule={handleBotSchedule}
        bots={availableBots}
        currentMessage={currentMessage}
      />
    </Card>
  );
};

export default ScheduledMessagesManager; 