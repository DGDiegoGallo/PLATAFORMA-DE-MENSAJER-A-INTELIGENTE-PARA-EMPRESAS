import React from 'react';
import { Message, User } from '../../views/company/ChatPage'; // Importar interfaces

interface MessageBubbleProps {
  message: Message;
  currentUser: User; // Para determinar si el mensaje es propio
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser }) => {
  const { sender, content, timestamp } = message;
  const isOwn = sender.id === currentUser.id;

  // Simulación: si no hay sender.name, podría ser un mensaje del sistema o un bot sin nombre explícito
  const senderName = sender.name || 'Sistema';

  return (
    <div className={`message-bubble-container ${isOwn ? 'own-message' : ''}`}>
      <div className={`message-bubble ${isOwn ? 'sent' : 'received'}`}>
        {!isOwn && (
          <div className="message-sender" style={{ color: sender.role === 'bot' ? 'var(--color-primary)' : 'inherit' }}>
            {senderName}
          </div>
        )}
        <div className="message-content">{content}</div>
        {timestamp && (
          <div className="message-timestamp">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
