import React from 'react';
import { FaThumbtack } from 'react-icons/fa'; // Usaremos FaThumbtack para el pin
import { Conversation } from '../../views/company/ChatPage'; // Importar la interfaz

interface ChatListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (conversation: Conversation) => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ conversation, isSelected, onSelect }) => {
  const { name, avatarUrl, lastMessage, timestamp, isPinned } = conversation;

  const getInitials = (nameString: string) => {
    if (!nameString) return '';
    const words = nameString.split(' ');
    if (words.length > 1) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return nameString.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      className={`chat-list-item ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(conversation)}
      title={name}
    >
      <div className="avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      <div className="chat-info">
        <div className="chat-name">{name}</div>
        {lastMessage && <div className="last-message">{lastMessage}</div>}
      </div>
      <div className="chat-meta">
        {timestamp && (
          <div className="timestamp">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {isPinned && (
          <FaThumbtack size={12} className={`pin-icon ${isPinned ? 'pinned' : ''}`} title="Fijado" style={{ marginTop: '4px' }}/>
        )}
      </div>
    </div>
  );
};

export default ChatListItem;
