import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup } from 'react-bootstrap';
import { FaClock, FaTrash, FaRobot } from 'react-icons/fa';
import ScheduleMessageModal from './ScheduleMessageModal';
import ScheduledBotMessageModal from './ScheduledBotMessageModal';
import { BotInfo } from '../bot/BotSelectorModal';
import { messageService, MessageEntry } from '../../features/company/services/message.service';

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
  currentMessage?: string;
  availableBots: BotInfo[];
}

const ScheduledMessagesManager: React.FC<ScheduledMessagesManagerProps> = ({
  conversationId,
  conversationName,
  onScheduleMessage,
  onScheduleBotMessage,
  currentMessage = '',
  availableBots = []
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBotScheduleModal, setShowBotScheduleModal] = useState(false);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Cargar mensajes programados del servidor
  const loadScheduledMessages = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const serverMessages = await messageService.getScheduledMessagesForConversation(conversationId);
      
      // Convertir MessageEntry a ScheduledMessage
      const convertedMessages: ScheduledMessage[] = serverMessages.map((entry: MessageEntry, index: number) => ({
        id: `${conversationId}-${index}-${entry.scheduledFor}`,
        content: entry.message,
        scheduledTime: new Date(entry.scheduledFor!),
        conversationId: conversationId,
        conversationName: conversationName || 'Chat',
        withBot: !!entry.botInfo,
        botInfo: entry.botInfo ? {
          name: entry.botInfo.name,
          prompt: entry.botInfo.prompt
        } : undefined
      }));
      
      setScheduledMessages(convertedMessages);
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar mensajes programados al iniciar y cuando cambie la conversación
  useEffect(() => {
    loadScheduledMessages();
  }, [conversationId]);
  
  const handleSchedule = async (message: string, scheduledTime: Date) => {
    if (!message.trim() || !conversationId) return;
    
    try {
      await onScheduleMessage(message, scheduledTime);
      // Recargar mensajes programados después de programar
      await loadScheduledMessages();
    } catch (error) {
      console.error('Error scheduling message:', error);
    }
  };
  
  const handleBotSchedule = async (message: string, scheduledTime: Date, botInfo: BotInfo) => {
    if (!message.trim() || !conversationId || !onScheduleBotMessage) return;
    
    try {
      await onScheduleBotMessage(message, scheduledTime, botInfo);
      // Recargar mensajes programados después de programar
      await loadScheduledMessages();
    } catch (error) {
      console.error('Error scheduling bot message:', error);
    }
  };
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = async (_id: string) => {
    // TODO: Implementar eliminación en el servidor
    // Por ahora, solo recargar para mostrar el estado actual
    await loadScheduledMessages();
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
            onClick={() => {
              console.log('Bots disponibles:', availableBots);
              setShowBotScheduleModal(true);
            }}
            disabled={!conversationId}
            title={availableBots.length === 0 ? "No hay bots disponibles - pero puedes crear uno en el modal" : "Programar con respuesta de bot"}
          >
            <FaRobot className="me-1" /> Programar con bot
          </Button>
          <Button 
            size="sm" 
            variant="primary"
            onClick={() => setShowScheduleModal(true)}
            disabled={!conversationId}
          >
            Programar mensaje
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <p className="text-center text-muted">Cargando mensajes programados...</p>
        ) : scheduledMessages.length === 0 ? (
          <p className="text-muted text-center">No hay mensajes programados para esta conversación</p>
        ) : (
          <ListGroup>
            {scheduledMessages.map(msg => (
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
                  title="Eliminar mensaje programado"
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