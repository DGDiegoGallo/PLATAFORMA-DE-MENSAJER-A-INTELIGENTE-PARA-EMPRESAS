import React from 'react';
import { Message, User } from '../../views/company/ChatPage'; // Importar interfaces
import { FaClock, FaRobot } from 'react-icons/fa';

interface MessageBubbleProps {
  message: Message;
  currentUser: User; // Para determinar si el mensaje es propio
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser }) => {
  const { sender, content, timestamp, isOwnMessage, scheduled } = message;

  // Manejar formato "DD/MM/YYYY, HH:mm" proveniente de Strapi
  const parseArgTimestamp = (ts: string): Date | null => {
    if (!ts) return null;
    // Si el constructor Date lo entiende, fin
    const direct = new Date(ts);
    if (!Number.isNaN(direct.getTime())) return direct;
    const [datePart, timePart] = ts.split(',').map((p) => p.trim());
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    if ([day, month, year, hour, minute].some((n) => Number.isNaN(n))) return null;
    return new Date(year, month - 1, day, hour, minute);
  };

  const dateObj = parseArgTimestamp(timestamp);
  const timeLabel = dateObj ? dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
  const isOwn = isOwnMessage ?? (sender.id === currentUser.id);
  const isBot = sender.role === 'bot';

  // Simulación: si no hay sender.name, podría ser un mensaje del sistema o un bot sin nombre explícito
  const senderName = sender.name || 'Sistema';

  return (
    <div className={`message-bubble-container ${isOwn ? 'own-message' : ''}`}>
      <div 
        className={`message-bubble ${isOwn ? 'sent' : 'received'} ${scheduled ? 'scheduled' : ''}`}
        data-bot={isBot ? 'true' : 'false'}
      >
        {!isOwn && (
          <div className="message-sender" style={{ color: isBot ? 'var(--color-primary)' : 'inherit' }}>
            {senderName}
            {isBot && <FaRobot className="ms-1" size={12} />}
          </div>
        )}
        <div className="message-content">
          {scheduled && (
            <div className={isBot ? 'bot-badge' : 'scheduled-badge'}>
              <FaClock size={12} style={{ marginRight: '4px' }} />
              <span>{isBot ? 'Bot programado' : 'Programado'}</span>
            </div>
          )}
          {content}
        </div>
        {timeLabel && (
          <div className="message-timestamp">
            {timeLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
