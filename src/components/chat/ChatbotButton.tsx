import React, { useState } from 'react';
import { FaComments } from 'react-icons/fa';
import ChatFullModal from './ChatFullModal';
import './ChatFullModal.css';

interface ChatbotButtonProps {
  onClick: () => void;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ onClick }) => {
  const [showChatModal, setShowChatModal] = useState(false);

  const handleOpenChat = () => {
    setShowChatModal(true);
    onClick();
  };
  
  const handleCloseModal = () => {
    setShowChatModal(false);
  };
  return (
    <>
      <button 
        className="position-fixed d-flex justify-content-center align-items-center"
        onClick={handleOpenChat}
        style={{ 
          bottom: '20px', 
          right: '20px',
          width: '60px',
          height: '60px',
          backgroundColor: '#F44123',
          borderRadius: '50%',
          color: '#FFFFFF',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          zIndex: 1000,
          border: 'none',
          transition: 'all 0.3s ease'
        }}
        aria-label="Abrir chat"
      >
        <FaComments size={24} />
      </button>

      {/* Modal de chat a pantalla completa */}
      <ChatFullModal 
        show={showChatModal} 
        onHide={handleCloseModal} 
      />
    </>
  );
};

export default ChatbotButton;
