import React, { useState, useEffect } from 'react';
import { Nav, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaComments, FaUsers, FaRobot, FaCalendarAlt, FaPaperPlane, FaPaperclip, FaEllipsisV } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import './ChatPage.css';
import ChatListItem from '../../components/company/ChatListItem';
import MessageBubble from '../../components/company/MessageBubble'; // Importar MessageBubble
import ChatFullModal from '../../components/chat/ChatFullModal';

// Interfaces básicas (se expandirán según sea necesario)
export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  timestamp: string; // ISO Date string
  isOwnMessage?: boolean; // Para determinar si el mensaje es del usuario actual
}

export interface Conversation {
  id: string;
  type: 'chat' | 'group' | 'bot' | 'event';
  name: string;
  avatarUrl?: string; // Para chats individuales o íconos de grupo/bot
  lastMessage?: string;
  timestamp?: string; // Última actividad
  unreadCount?: number;
  isPinned?: boolean;
  participants?: User[];
  messages?: Message[];
}

// Datos de ejemplo (se reemplazarán con datos reales o de API)
const currentUserMock: User = {
  id: 'user0',
  name: 'Usuario Actual',
};

const sampleConversations: Conversation[] = [
  {
    id: 'chat1',
    type: 'chat',
    name: 'Elena Rodríguez',
    avatarUrl: undefined, // Usará iniciales
    lastMessage: '¡Hola! ¿Cómo estás?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // Hace 5 minutos
    isPinned: true,
    messages: [
      { id: 'msg1', sender: { id: 'user1', name: 'Elena Rodríguez' }, content: '¡Hola! ¿Cómo estás?', timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString() },
      { id: 'msg2', sender: currentUserMock, content: '¡Hola Elena! Bien, ¿y tú?', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isOwnMessage: true },
    ]
  },
  {
    id: 'group1',
    type: 'group',
    name: 'Equipo de Marketing',
    lastMessage: 'Pedro: Revisen la nueva propuesta.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // Hace 30 minutos
    unreadCount: 3,
    messages: [
      { id: 'msg3', sender: { id: 'user2', name: 'Pedro' }, content: 'Revisen la nueva propuesta.', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    ]
  },
  {
    id: 'bot1',
    type: 'bot',
    name: 'Asistente Virtual',
    lastMessage: 'Entendido. Procesando tu solicitud...', 
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Hace 2 horas
    messages: [
      { id: 'msg4', sender: { id: 'botSystem', name: 'Asistente Virtual', role: 'bot' }, content: 'Entendido. Procesando tu solicitud...', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    ]
  },
  {
    id: 'event1',
    type: 'event',
    name: 'Lanzamiento Producto X',
    lastMessage: 'Recordatorio: Mañana a las 10 AM.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Hace 1 día
    isPinned: false,
  },
  {
    id: 'chat2',
    type: 'chat',
    name: 'Carlos Gómez',
    lastMessage: 'Perfecto, nos vemos entonces.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // Hace 5 horas
  },
];

type ActiveTab = 'chats' | 'grupos' | 'bots' | 'eventos';

interface ChatPageProps {
  isEmbedded?: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  
  // Si estamos en la ruta directa, mostramos el contenido directamente
  // Si estamos embebidos, mostramos el botón para abrir el modal
  useEffect(() => {
    if (!isEmbedded) {
      // Estamos en la ruta directa, no hacemos nada especial
    } else {
      // Estamos embebidos, mostramos el modal automáticamente
      setShowChatModal(true);
    }
  }, [isEmbedded]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // Aquí iría la lógica para enviar el mensaje a la API
    console.log('Enviando mensaje:', newMessage);
    
    // Por ahora, simulamos agregar el mensaje localmente
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: currentUserMock,
      content: newMessage,
      timestamp: new Date().toISOString(),
      isOwnMessage: true
    };
    
    // Actualizar la conversación seleccionada con el nuevo mensaje
    if (selectedConversation.messages) {
      selectedConversation.messages = [...selectedConversation.messages, newMsg];
    } else {
      selectedConversation.messages = [newMsg];
    }
    
    // Actualizar la última actividad
    selectedConversation.lastMessage = newMessage;
    selectedConversation.timestamp = new Date().toISOString();
    
    // Limpiar el campo de entrada
    setNewMessage('');
    
    // Forzar actualización del estado
    setSelectedConversation({...selectedConversation});
  };
  
  // Manejar tecla Enter para enviar mensaje
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  


  // Filtrar conversaciones según la pestaña activa y el término de búsqueda
  const filteredConversations = sampleConversations.filter(conv => {
    const matchesTab = 
      (activeTab === 'chats' && conv.type === 'chat') ||
      (activeTab === 'grupos' && conv.type === 'group') ||
      (activeTab === 'bots' && conv.type === 'bot') ||
      (activeTab === 'eventos' && conv.type === 'event');
    const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const renderContentForTab = () => {
    if (filteredConversations.length === 0) {
      return <p className="text-center text-muted mt-3">No hay elementos para mostrar.</p>;
    }
    return filteredConversations.map(conv => (
      <ChatListItem 
        key={conv.id} 
        conversation={conv} 
        isSelected={selectedConversation?.id === conv.id}
        onSelect={handleSelectConversation}
      />
    ));
  };

  // Si estamos embebidos, mostramos el modal
  if (isEmbedded) {
    return (
      <ChatFullModal 
        show={showChatModal} 
        onHide={() => navigate('/company/dashboard')} 
      />
    );
  }
  
  // Si estamos en la ruta directa, mostramos el contenido normal
  return (
    <DashboardLayout companyName="Nombre de la empresa">
      <div className="chat-page-container">
  
        {/* Barra lateral izquierda */}
        <div className="chat-sidebar">
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k as ActiveTab)} className="mb-2">
            <Nav.Item>
              <Nav.Link eventKey="chats"><FaComments className="me-1" /> Chats</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="grupos"><FaUsers className="me-1" /> Grupos</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="bots"><FaRobot className="me-1" /> Bots</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="eventos"><FaCalendarAlt className="me-1" /> Eventos</Nav.Link>
            </Nav.Item>
          </Nav>
          <div className="chat-list-search px-2">
            <InputGroup>
              <span className="chat-list-search-icon"><FaSearch /></span>
              <Form.Control 
                type="search" 
                placeholder="Buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="chat-list-area">
            {renderContentForTab()}
          </div>
        </div>

        {/* Área de contenido del chat (derecha) */}
        <div className="chat-content-area">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="user-info">
                  <div className="avatar-placeholder">
                    {selectedConversation.avatarUrl ? (
                        <img src={selectedConversation.avatarUrl} alt={selectedConversation.name} />
                    ) : (
                        <span>{selectedConversation.name.substring(0,1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="user-name">{selectedConversation.name}</div>
                    {/* <div className="user-role">Rol o estado</div> */}
                  </div>
                </div>
                <div className="actions">
                  <Button variant="link"><FaSearch /></Button>
                  <Button variant="link"><FaEllipsisV /></Button>
                </div>
              </div>
              <div className="chat-messages-area">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} currentUser={currentUserMock} />
                  ))
                ) : (
                  <p className="text-center text-muted p-3">No hay mensajes en esta conversación.</p>
                )}
              </div>
              <div className="chat-input-area">
                <InputGroup>
                  <Button variant="link" className="p-2"><FaPaperclip size={20}/></Button>
                  <Form.Control 
                    as="textarea" 
                    rows={1} 
                    placeholder="Escribe un mensaje..." 
                    style={{resize: 'none'}}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button 
                    variant="primary" 
                    className="p-2"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <FaPaperPlane size={18}/>
                  </Button>
                </InputGroup>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <FaComments />
              <p>Selecciona un chat para comenzar a chatear.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
