import React from 'react';
import { FaRobot } from 'react-icons/fa';

interface ChatbotButtonProps {
  onClick: () => void;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="position-fixed d-flex justify-content-center align-items-center"
      onClick={onClick}
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
    >
      <FaRobot size={24} />
    </button>
  );
};

export default ChatbotButton;
