import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatbotButton from '../chat/ChatbotButton';

interface DashboardLayoutProps {
  children: ReactNode;
  companyName: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, companyName }) => {
  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar companyName={companyName} />
        <div className="flex-grow-1 p-4 bg-white">
          {children}
        </div>
      </div>
      
      {/* Chatbot button */}
      <ChatbotButton onClick={() => console.log('Chatbot clicked')} />
    </div>
  );
};

export default DashboardLayout;
