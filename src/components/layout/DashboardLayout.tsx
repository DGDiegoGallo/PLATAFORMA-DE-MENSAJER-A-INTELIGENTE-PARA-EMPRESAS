import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotButton from '../chat/ChatbotButton';

interface DashboardLayoutProps {
  children: ReactNode;
  companyName: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, companyName }) => {
  const handleChatButtonClick = () => {
    // Simplemente registramos que se hizo clic en el botón
    console.log('Chat button clicked');
  };

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar companyName={companyName} />
        <div className="flex-grow-1 p-4 bg-white">
          {children}
        </div>
      </div>
      
      {/* Chatbot button - Abre el modal directamente */}
      <ChatbotButton onClick={handleChatButtonClick} />
    </div>
  );
};

export default DashboardLayout;
