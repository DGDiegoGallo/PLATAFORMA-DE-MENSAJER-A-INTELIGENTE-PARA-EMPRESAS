import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import MessageBubble from '../../components/company/MessageBubble';
import { FaPaperPlane } from 'react-icons/fa';

interface User {
  id: string;
  name: string;
  role?: string;
}

interface Message {
  id: string;
  sender: User;
  content: string;
  timestamp: string;
  isOwnMessage?: boolean;
}

const currentUser: User = {
  id: 'user-current',
  name: 'Tú'
};

const supportBot: User = {
  id: 'support-bot',
  name: 'Soporte',
  role: 'bot'
};

const SupportPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: supportBot,
      content: '¡Hola! Bienvenido al soporte de Yielit, la plataforma de mensajería inteligente para empresas. ¿En qué podemos ayudarte hoy?',
      timestamp: new Date().toISOString(),
      isOwnMessage: false
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    // Add user message locally
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: currentUser,
      content: trimmed,
      timestamp: new Date().toISOString(),
      isOwnMessage: true
    };

    setMessages(prev => [...prev, userMsg]);
    setNewMessage('');

    try {
      const payload = { user: `Eres "Soporte" debes ayudar al usuario. El usuario pregunta: ${trimmed}` };
      const res = await fetch('http://localhost:1337/api/prompts/1/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const botAnswer = data.answer ?? 'Lo siento, no puedo responder en este momento.';

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: supportBot,
        content: botAnswer,
        timestamp: new Date().toISOString(),
        isOwnMessage: false
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: supportBot,
        content: 'Lo siento, ocurrió un error al procesar tu solicitud.',
        timestamp: new Date().toISOString(),
        isOwnMessage: false
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="d-flex flex-column h-100" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <h4 className="mb-3">Soporte en línea</h4>
        <div className="flex-grow-1 overflow-auto p-3" style={{ background: '#F8F8F8', borderRadius: '8px' }}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} currentUser={currentUser} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <InputGroup className="mt-3">
          <Form.Control
            placeholder="Escribe tu mensaje..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <Button variant="primary" onClick={handleSend} disabled={!newMessage.trim()}>
            <FaPaperPlane />
          </Button>
        </InputGroup>
      </div>
    </>
  );
};

export default SupportPage;
