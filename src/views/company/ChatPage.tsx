import React, { useState, useEffect, useMemo, useRef } from 'react';
import ChatListItem from '../../components/company/ChatListItem';
import MessageBubble from '../../components/company/MessageBubble';



interface NotificationLS {
  sender: string;
  group: string;
  message?: string;
  timestamp?: string;
}
const NOTI_KEY = 'notifications';
import { Nav, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaComments, FaUsers, FaRobot, FaCalendarAlt, FaHashtag, FaPaperPlane, FaPaperclip, FaEllipsisV, FaPlus } from 'react-icons/fa';
import BotSelectorModal, { BotInfo } from '../../components/bot/BotSelectorModal';
import { useNavigate } from 'react-router-dom';
import './ChatPage.css';
import ChatFullModal from '../../components/chat/ChatFullModal';
import BotManager from '../../components/bot/BotManager';
import { messageService } from '../../features/company/services/message.service';
import useChannels from '../../features/company/hooks/useChannels';
import ScheduledMessagesManager, { ScheduledMessage } from '../../components/company/ScheduledMessagesManager';

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
  scheduled?: boolean; // Indica si es un mensaje programado
}

export interface Conversation {
  id: string;
  type: 'chat' | 'group' | 'channel' | 'bot' | 'event';
  name: string;
  avatarUrl?: string; // Para chats individuales o íconos de grupo/bot
  lastMessage?: string;
  timestamp?: string; // Última actividad
  unreadCount?: number;
  isPinned?: boolean;
  participants?: User[];
  messages?: Message[];
  status?: 'Active' | 'Inactive';
}

// Datos de ejemplo (se reemplazarán con datos reales o de API)
const currentUserMock: User = {
  id: 'user0',
  name: 'Usuario Actual',
};

type ActiveTab = 'chats' | 'grupos' | 'canales' | 'bots' | 'eventos';

// Tipo para mapear los tipos de canales de Strapi al tipo Conversation
type ConversationType = 'chat' | 'group' | 'channel' | 'bot' | 'event';

interface ChatPageProps {
  isEmbedded?: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loadingMessages,setLoadingMessages]=useState(false);
  const [messages,setMessages]=useState<Message[]>([]);
  // Usuario autenticado desde localStorage para comparación
  const localUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  // Verificar rol del usuario para determinar si puede escribir mensajes
  const isEmpleadoRole = localUser.rol?.toLowerCase() === 'empleado';
  // Verificar si es rol company para mostrar funcionalidades de programación
  const isCompanyRole = localUser.rol?.toLowerCase() === 'company';
  // Verificar si es rol agente
  const isAgentRole = localUser.rol?.toLowerCase() === 'agente';

  // Estado para los mensajes programados
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  
  // Cargar mensajes programados del localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scheduledMessages');
      if (saved) {
        const parsed = JSON.parse(saved);
        const messages = parsed.map((msg: Record<string, unknown>) => ({
          ...msg,
          scheduledTime: new Date(msg.scheduledTime as string)
        }));
        setScheduledMessages(messages);
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
    }
  }, []);

  // Verificar mensajes programados cada minuto
  useEffect(() => {
    // Función para verificar y enviar mensajes programados
    const checkScheduledMessages = async () => {
      const now = new Date();
      const messagesToSend = scheduledMessages.filter(msg => {
        const scheduledTime = new Date(msg.scheduledTime);
        return scheduledTime <= now;
      });

      if (messagesToSend.length > 0) {
        console.log('Enviando mensajes programados:', messagesToSend);
        
        for (const msg of messagesToSend) {
          try {
            // Obtener información del usuario
            const userLS = JSON.parse(localStorage.getItem('user') || '{}');
            const senderInfo = { nombre: userLS.nombre ?? 'Anon', apellido: userLS.apellido ?? '' };
            
            // Enviar mensaje programado a través del servicio
            await messageService.sendMessage(msg.conversationId, msg.content, senderInfo);
            
            // Si la conversación es la seleccionada actualmente, actualizar la interfaz
            if (selectedConversation?.id === msg.conversationId) {
              const newMsg: Message = {
                id: `msg-${Date.now()}`,
                sender: currentUserMock,
                content: msg.content,
                timestamp: new Date().toISOString(),
                isOwnMessage: true,
                scheduled: true
              };
              
              setMessages(prev => {
                const updated = [...prev, newMsg];
                updated.sort((a: Message, b: Message) => {
                  return toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime();
                });
                return updated;
              });
            }
          } catch (error) {
            console.error('Error sending scheduled message:', error);
          }
        }
        
        // Eliminar los mensajes enviados de la lista
        setScheduledMessages(prev => 
          prev.filter(msg => {
            const scheduledTime = new Date(msg.scheduledTime);
            return scheduledTime > now;
          })
        );
      }
    };

    // Ejecutar inmediatamente y luego cada minuto
    checkScheduledMessages();
    const interval = setInterval(checkScheduledMessages, 60000);
    
    return () => clearInterval(interval);
  }, [scheduledMessages, selectedConversation]);

  // Guardar mensajes programados en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('scheduledMessages', JSON.stringify(scheduledMessages));
  }, [scheduledMessages]);

  // Conversión robusta de cualquier string de fecha (ISO o "DD/MM/YYYY, HH:mm") a Date
  const toDateAny = (ts: string): Date => {
    // 1) prueba parseo directo
    const direct = new Date(ts);
    if (!Number.isNaN(direct.getTime())) return direct;

    // 2) formato "DD/MM/YYYY, HH:mm"
    if (ts.includes(',')) {
      const [dPart, tPart] = ts.split(',').map((p) => p.trim());
      if (dPart && tPart) {
        const [dd, mm, yy] = dPart.split('/').map(Number);
        const [hhS, miS] = tPart.split(':');
        const hh = Number(hhS);
        const mi = Number(miS);
        return new Date(yy, mm - 1, dd, hh, mi);
      }
    }

    // 3) formato sólo hora "HH:mm" con posible "a. m." | "p. m." (locale es-AR)
    const horaMatch = ts.match(/(\d{1,2}):(\d{2})/);
    if (horaMatch) {
      let hours = Number(horaMatch[1]);
      const minutes = Number(horaMatch[2]);
      const isPM = ts.toLowerCase().includes('p');
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      return today;
    }

    // fallback
    return new Date(0);
  };

  // Ref y efecto para hacer scroll al último mensaje
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // cargar mensajes reales
    try{
      setLoadingMessages(true);
      console.log(`Cargando conversación: ${conversation.name} (${conversation.type}) con ID: ${conversation.id}`);
      
      const res=await messageService.getMessageByDocumentId(String(conversation.id));
      console.log('Respuesta del servidor:', res);
      
      const raw=res?.attributes?.content ?? res?.content ?? [];
      let arr: Array<{ sender_info:{nombre:string;apellido:string;hora:string}; message:string }> = [];
      
      if(typeof raw==='string'){
        try{
          arr=JSON.parse(raw);
          console.log('Contenido parseado de string:', arr);
        } catch {
          console.error('Error al parsear contenido');
          arr=[];
        }
      } else if(Array.isArray(raw)){
        arr=raw;
        console.log('Contenido ya es un array:', arr);
      }
      
      const newNotis: NotificationLS[] = [];
      const msgs: Message[] = arr.map((entry: { sender_info: { nombre: string; apellido: string; hora: string }; message: string }, index: number) => {
        const isOwn = (entry.sender_info?.nombre === localUser.nombre) && (entry.sender_info?.apellido === localUser.apellido);
        
        // Comprobar si este mensaje está programado para el futuro
        const messageTime = toDateAny(entry.sender_info.hora);
        const now = new Date();
        const isScheduled = messageTime > now;
        
        // Solo incluir el mensaje si no está programado para el futuro o si el usuario es company
        if (!isScheduled || isCompanyRole) {
          // Guardar notificación si el mensaje no es propio
          if (!isOwn) {
            newNotis.push({
              sender: `${entry.sender_info.nombre} ${entry.sender_info.apellido}`.trim(),
              group: conversation.name,
              message: entry.message,
              timestamp: entry.sender_info.hora
            });
          }

          return {
            id: `srv-${index}`,
            sender: { id: `${entry.sender_info.nombre}-${entry.sender_info.apellido}`, name: `${entry.sender_info.nombre} ${entry.sender_info.apellido}` },
            content: entry.message,
            timestamp: entry.sender_info.hora,
            isOwnMessage: isOwn,
            scheduled: isScheduled
          };
        }
        return null;
      }).filter(Boolean) as Message[];
      
      // ordenar cronológicamente ascendente
      msgs.sort((a: Message, b: Message) => toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime());
      console.log(`Mensajes procesados (${msgs.length}):`, msgs);
      setMessages(msgs);
      // ---- Guardar notificaciones en localStorage ----
      if (newNotis.length) {
        try {
          const existing: NotificationLS[] = JSON.parse(localStorage.getItem(NOTI_KEY) || '[]');
          localStorage.setItem(NOTI_KEY, JSON.stringify([...existing, ...newNotis]));
          window.dispatchEvent(new Event('new-notification'));
        } catch {
          localStorage.setItem(NOTI_KEY, JSON.stringify(newNotis));
          window.dispatchEvent(new Event('new-notification'));
        }
      }
      
      // ----- Bots disponibles -----
      // Usamos type assertion para acceder a `bot_interaction` que puede no estar en el tipo
      const responseWithBot = res as unknown as { attributes?: { bot_interaction?: Record<string, { Prompt?: string }> }, bot_interaction?: Record<string, { Prompt?: string }> };
      const botInteraction = responseWithBot?.attributes?.bot_interaction || responseWithBot?.bot_interaction || {};
      const botsArr: BotInfo[] = Object.entries(botInteraction).map(([name, val]) => {
        return { name, prompt: val?.Prompt || '' };
      });
      setAvailableBots(botsArr);
      setSelectedConversation(conversation);
    }catch(e){
      console.error('Error al cargar mensajes:', e);
    }finally{
      setLoadingMessages(false);
    }
  };
  
  const handleSendMessage = async () => {
    // Permitir enviar mensajes si:
    // - No es rol empleado, o
    // - Es un grupo, o
    // - Es un canal
    const canSendMessage = !isEmpleadoRole || 
                          (activeTab === 'grupos' && selectedConversation?.type === 'group') ||
                          (activeTab === 'canales' && selectedConversation?.type === 'channel');
                          
    if (!newMessage.trim() || !selectedConversation || !canSendMessage) return;

    // Obtener info del usuario almacenada
    const userLS = JSON.parse(localStorage.getItem('user') || '{}');
    const senderInfo = { nombre: userLS.nombre ?? 'Anon', apellido: userLS.apellido ?? '' };
    
    // Guardar el mensaje que el usuario escribió
    const messageContent = newMessage.trim();
    
    // PRIMER PASO: Mostrar el mensaje del usuario en UI INMEDIATAMENTE
    // ---- Actualizar UI localmente con el mensaje del usuario ----
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: currentUserMock,
      content: messageContent,
      timestamp: new Date().toISOString(),
      isOwnMessage: true
    };
    
    // Actualizar lista local INMEDIATAMENTE con el mensaje del usuario
    setMessages(prev => {
      const updated = [...prev, newMsg];
      updated.sort((a: Message, b: Message) => {
        return toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime();
      });
      return updated;
    });
    
    // Actualizar la última actividad
    if (selectedConversation) {
      selectedConversation.lastMessage = messageContent;
      selectedConversation.timestamp = new Date().toISOString();
    }
    
    // Limpiar el campo de entrada INMEDIATAMENTE
    setNewMessage('');

    try {
      // SEGUNDO PASO: Enviar mensajes a backend y procesar respuesta del bot
      if (botMode && selectedBotPrompt) {
        // 1. Guardar el mensaje del usuario en Strapi
        await messageService.sendMessage(String(selectedConversation.id), messageContent, senderInfo);
        
        // 2. Enviar al Bot (IA) y esperar respuesta
        const userString = `Eres "${selectedBotName ?? 'Bot'}" debes ${selectedBotPrompt}. El usuario ${senderInfo.nombre} ${senderInfo.apellido} pregunta: ${messageContent}`;
        const payload = { user: userString };
        
        const res = await fetch('http://localhost:1337/api/prompts/1/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        const botAnswer = data.answer ?? '(Sin respuesta)';
        localStorage.setItem('botAnswer', botAnswer);
        console.log('Bot answer:', botAnswer);
        
        // 3. Persistir respuesta del bot en backend
        const botSender = { nombre: selectedBotName ?? 'Fran', apellido: '' };
        await messageService.sendMessage(String(selectedConversation.id), botAnswer, botSender);

        // 4. Añadir respuesta del bot a UI
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: { id: 'bot', name: selectedBotName ?? 'Fran', role: 'bot' },
          content: botAnswer,
          timestamp: new Date().toISOString(),
          isOwnMessage: false,
        };
        
        // Añadir respuesta del bot después de la del usuario
        setMessages(prev => {
          const arr = [...prev, botMsg];
          arr.sort((a: Message, b: Message) => toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime());
          return arr;
        });
      } else {
        // Enviar mensaje normal a Strapi sin esperar respuesta de bot
        await messageService.sendMessage(String(selectedConversation.id), messageContent, senderInfo);
      }
    } catch (err) {
      console.error('Error procesando mensaje', err);
      // No alertamos al usuario para no romper la experiencia
    }
  };

  // Manejar programación de mensajes
  const handleScheduleMessage = async (message: string, scheduledTime: Date) => {
    if (!message.trim() || !selectedConversation) return;

    // Formatear la fecha para Argentina (UTC-3)
    const scheduledTimeAR = scheduledTime.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Obtener info del usuario almacenada
    const userLS = JSON.parse(localStorage.getItem('user') || '{}');
    const senderInfo = { 
      nombre: userLS.nombre ?? 'Anon', 
      apellido: userLS.apellido ?? '',
      hora: scheduledTimeAR // Usar la hora programada
    };

    try {
      // Solo enviar mensaje programado a Strapi si no es un evento
      if (selectedConversation.type !== 'event') {
        await messageService.sendScheduledMessage(
          String(selectedConversation.id), 
          message, 
          senderInfo,
          scheduledTime
        );
      }

      // Añadir mensaje programado a la interfaz si es el usuario company
      if (isCompanyRole) {
        const newMsg: Message = {
          id: `scheduled-${Date.now()}`,
          sender: currentUserMock,
          content: message,
          timestamp: scheduledTimeAR,
          isOwnMessage: true,
          scheduled: true
        };
        
        setMessages(prev => {
          const updated = [...prev, newMsg];
          updated.sort((a: Message, b: Message) => {
            return toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime();
          });
          return updated;
        });
      }

      // Limpiar el campo de entrada
      setNewMessage('');
    } catch (err) {
      console.error('Error programando mensaje', err);
    }
  };
  
  const [botMode, setBotMode] = useState(false);
  const [selectedBotPrompt, setSelectedBotPrompt] = useState<string | null>(null);
  const [selectedBotName, setSelectedBotName] = useState<string | null>(null);
  const [showBotSelector, setShowBotSelector] = useState(false);
  const [availableBots, setAvailableBots] = useState<BotInfo[]>([]);

  // Manejar tecla Enter para enviar mensaje
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Permitir enviar mensajes si:
    // - No es rol empleado, o
    // - Es un grupo, o
    // - Es un canal
    const canSendMessage = !isEmpleadoRole || 
                          (activeTab === 'grupos' && selectedConversation?.type === 'group') ||
                          (activeTab === 'canales' && selectedConversation?.type === 'channel');
                          
    if (e.key === 'Enter' && !e.shiftKey && canSendMessage) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filtrar conversaciones según la pestaña activa y el término de búsqueda
  // Mapear canales de Strapi a conversaciones para el chat UI
  const { channels, loading: loadingChannels } = useChannels();

  // Log para depuración
  useEffect(() => {
    console.log('Canales disponibles:', channels);
  }, [channels]);

  // Convertir los canales a conversaciones para la UI
const conversations: Conversation[] = useMemo(() => channels.map(ch => ({
  id: ch.documentId || ch.id,
    type: ch.type as ConversationType,
  name: ch.name,
  lastMessage: '',
  timestamp: ch.creationDate,
  status: ch.status,
  messages: [],
})), [channels]);

  // Filtrar conversaciones según la pestaña activa y el término de búsqueda
  const filteredConversations = useMemo(() => conversations.filter(conv => {
    // Filtrar por tipo según la pestaña activa
    const matchesTab = 
      (activeTab === 'chats' && conv.type === 'chat') ||
      (activeTab === 'grupos' && conv.type === 'group') ||
      (activeTab === 'canales' && conv.type === 'channel') ||
      (activeTab === 'bots' && conv.type === 'bot') ||
      (activeTab === 'eventos' && conv.type === 'event');
    
    // Filtrar por término de búsqueda en el nombre
    const matchesSearch = conv.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  }), [activeTab, conversations, searchTerm]);

  // Resetear la conversación seleccionada cuando cambia la pestaña
  useEffect(() => {
    setSelectedConversation(null);
    setMessages([]);
  }, [activeTab]);

  const renderContentForTab = () => {
    if (loadingChannels) {
      return <p className="text-center text-muted mt-3">Cargando...</p>;
    }
    
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

  // Manejar programación de mensajes con bot
  const handleScheduleBotMessage = async (message: string, scheduledTime: Date, botInfo: BotInfo) => {
    if (!message.trim() || !selectedConversation) return;

    // Formatear la fecha para Argentina (UTC-3)
    const scheduledTimeAR = scheduledTime.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Obtener info del usuario almacenada
    const userLS = JSON.parse(localStorage.getItem('user') || '{}');
    const senderInfo = { 
      nombre: userLS.nombre ?? 'Anon', 
      apellido: userLS.apellido ?? '',
      hora: scheduledTimeAR // Usar la hora programada
    };

    try {
      // 1. Programar el mensaje del usuario - SOLO si NO es un evento (type !== 'event')
      // Si es un evento, no agregamos el mensaje del usuario, solo el del bot
      if (selectedConversation.type !== 'event') {
        await messageService.sendScheduledMessage(
          String(selectedConversation.id), 
          message, 
          senderInfo,
          scheduledTime
        );
      }

      // 2. Preparar la respuesta programada del bot (para cuando llegue la hora)
      // La respuesta del bot se genera cuando llegue el momento programado
      
      // Almacenar en localStorage los datos necesarios para generar la respuesta del bot cuando llegue la hora
      const pendingBotResponse = {
        userMessage: message,
        botName: botInfo.name,
        botPrompt: botInfo.prompt,
        conversationId: selectedConversation.id,
        channelType: selectedConversation.type, // Añadir tipo de canal para saber si es un evento
        scheduledTime: scheduledTime.toISOString(),
        senderInfo: {
          nombre: botInfo.name,
          apellido: ''
        }
      };
      
      // Guardar en localStorage
      const existingResponses = JSON.parse(localStorage.getItem('pendingBotResponses') || '[]');
      existingResponses.push(pendingBotResponse);
      localStorage.setItem('pendingBotResponses', JSON.stringify(existingResponses));

      // 3. Añadir mensaje programado a la interfaz si es el usuario company
      if (isCompanyRole) {
        // Solo para conversaciones que no sean eventos, mostrar el mensaje del usuario
        const messages: Message[] = [];
        
        if (selectedConversation.type !== 'event') {
          // Mensaje del usuario (solo si no es un evento)
          const userMsg: Message = {
            id: `scheduled-user-${Date.now()}`,
            sender: currentUserMock,
            content: message,
            timestamp: scheduledTimeAR,
            isOwnMessage: true,
            scheduled: true
          };
          messages.push(userMsg);
        }
        
        // Mensaje placeholder para la respuesta del bot (siempre)
        const botMsg: Message = {
          id: `scheduled-bot-${Date.now()}`,
          sender: { 
            id: 'bot', 
            name: botInfo.name, 
            role: 'bot' 
          },
          content: `[Respuesta programada del bot ${botInfo.name}]`,
          timestamp: scheduledTimeAR,
          isOwnMessage: false,
          scheduled: true
        };
        messages.push(botMsg);
        
        setMessages(prev => {
          const updated = [...prev, ...messages];
          updated.sort((a: Message, b: Message) => {
            return toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime();
          });
          return updated;
        });
      }

      // Limpiar el campo de entrada
      setNewMessage('');
    } catch (err) {
      console.error('Error programando mensaje con bot', err);
    }
  };

  // Agregar verificación de respuestas pendientes de bot a la verificación periódica de mensajes
  useEffect(() => {
    // Función para verificar y procesar respuestas pendientes de bot
    const checkPendingBotResponses = async () => {
      try {
        const now = new Date();
        const pendingResponses = JSON.parse(localStorage.getItem('pendingBotResponses') || '[]');
        
        // Tipado para las respuestas pendientes
        interface PendingBotResponse {
          userMessage: string;
          botName: string;
          botPrompt: string;
          conversationId: string;
          channelType?: string; // Tipo de canal (chat, group, event, etc.)
          scheduledTime: string;
          senderInfo: {
            nombre: string;
            apellido: string;
          };
        }
        
        const responsesToProcess = pendingResponses.filter((resp: PendingBotResponse) => 
          new Date(resp.scheduledTime) <= now
        );
        
        if (responsesToProcess.length > 0) {
          console.log('Procesando respuestas pendientes de bot:', responsesToProcess);
          
          const remainingResponses = pendingResponses.filter((resp: PendingBotResponse) => 
            new Date(resp.scheduledTime) > now
          );
          
          // Actualizar almacenamiento con las respuestas restantes
          localStorage.setItem('pendingBotResponses', JSON.stringify(remainingResponses));
          
          // Procesar cada respuesta pendiente
          for (const resp of responsesToProcess) {
            try {
              // Construir el string de prompt para el bot
              const userString = `Eres "${resp.botName}" debes ${resp.botPrompt}. El usuario ${resp.senderInfo.nombre} ${resp.senderInfo.apellido} pregunta: ${resp.userMessage}`;
              const payload = { user: userString };
              
              // Llamar a la API del bot
              const res = await fetch('http://localhost:1337/api/prompts/1/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              
              const data = await res.json();
              const botAnswer = data.answer ?? '(Sin respuesta)';
              
              // Guardar la respuesta en el servidor
              const botSenderInfo = { 
                nombre: resp.botName, 
                apellido: '' 
              };
              
              await messageService.sendMessage(String(resp.conversationId), botAnswer, botSenderInfo);
              
              // Actualizar UI si la conversación es la seleccionada actualmente
              if (selectedConversation?.id === resp.conversationId) {
                const botMsg: Message = {
                  id: `bot-${Date.now()}`,
                  sender: { id: 'bot', name: resp.botName, role: 'bot' },
                  content: botAnswer,
                  timestamp: new Date().toISOString(),
                  isOwnMessage: false,
                };
                
                setMessages(prev => {
                  const arr = [...prev, botMsg];
                  arr.sort((a: Message, b: Message) => toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime());
                  return arr;
                });
              }
            } catch (error) {
              console.error('Error procesando respuesta de bot:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error verificando respuestas pendientes de bot:', error);
      }
    };
    
    // Ejecutar inmediatamente y luego cada minuto
    checkPendingBotResponses();
    const interval = setInterval(checkPendingBotResponses, 60000);
    
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Polling para recargar mensajes cada 5 segundos si hay una conversación seleccionada
  useEffect(() => {
    if (!selectedConversation) return;
    let isMounted = true;
    let firstLoad = true;
    const fetchMessages = async () => {
      try {
        if (firstLoad) setLoadingMessages(true);
        const res = await messageService.getMessageByDocumentId(String(selectedConversation.id));
        const raw = res?.attributes?.content ?? res?.content ?? [];
        let arr = [];
        if (typeof raw === 'string') {
          try { arr = JSON.parse(raw); } catch { arr = []; }
        } else if (Array.isArray(raw)) {
          arr = raw;
        }
        const msgs = arr.map((entry: { sender_info: { nombre: string; apellido: string; hora: string }; message: string }, index: number) => {
          const isOwn = (entry.sender_info?.nombre === localUser.nombre) && (entry.sender_info?.apellido === localUser.apellido);
          const messageTime = toDateAny(entry.sender_info.hora);
          const now = new Date();
          const isScheduled = messageTime > now;
          if (!isScheduled || isCompanyRole) {
            return {
              id: `srv-${index}`,
              sender: { id: `${entry.sender_info.nombre}-${entry.sender_info.apellido}`, name: `${entry.sender_info.nombre} ${entry.sender_info.apellido}` },
              content: entry.message,
              timestamp: entry.sender_info.hora,
              isOwnMessage: isOwn,
              scheduled: isScheduled
            };
          }
          return null;
        }).filter(Boolean);
        msgs.sort((a: Message, b: Message) => toDateAny(a.timestamp).getTime() - toDateAny(b.timestamp).getTime());
        if (isMounted) setMessages(msgs);
      } catch (e) {
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setLoadingMessages(false);
        firstLoad = false;
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [selectedConversation]);

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
    <>
      <div className="chat-page-container">
  
        {/* Barra lateral izquierda */}
        <div className="chat-sidebar">
          <div className="d-flex justify-content-between align-items-center mb-2 px-2">
            <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k as ActiveTab)} className="mb-0 flex-grow-1">
             <Nav.Item>
               <Nav.Link eventKey="grupos"><FaUsers className="me-1" /> Grupos</Nav.Link>
             </Nav.Item>
             <Nav.Item>
               <Nav.Link eventKey="canales"><FaHashtag className="me-1" /> Canales</Nav.Link>
             </Nav.Item>
             <Nav.Item>
               <Nav.Link eventKey="bots"><FaRobot className="me-1" /> Bots</Nav.Link>
             </Nav.Item>
             <Nav.Item>
               <Nav.Link eventKey="eventos"><FaCalendarAlt className="me-1" /> Eventos</Nav.Link>
             </Nav.Item>
          </Nav>
            <Button 
              variant="primary" 
              size="sm" 
              className="ms-2 d-flex align-items-center" 
              onClick={() => navigate('/company/messaging')}
              title="Administrar canales"
            >
              <FaPlus size={14} />
            </Button>
          </div>
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

        {/* Área de contenido principal (derecha) */}
        <div className="chat-content-area">
          {activeTab === 'bots' ? (
            <BotManager />
          ) : selectedConversation ? (
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
                    <div className="user-role">{selectedConversation.type === 'group' ? 'Grupo' : selectedConversation.type === 'channel' ? 'Canal' : selectedConversation.type === 'event' ? 'Evento' : ''}</div>
                  </div>
                </div>
                <div className="actions">
                  <Button variant="link"><FaSearch /></Button>
                  <Button variant="link"><FaEllipsisV /></Button>
                </div>
              </div>

              {/* Panel de mensajes programados (solo visible para rol company o agente y tipo evento) */}
              {(isCompanyRole || isAgentRole) && selectedConversation.type === 'event' && (
                <ScheduledMessagesManager
                  conversationId={selectedConversation.id}
                  conversationName={selectedConversation.name}
                  onScheduleMessage={handleScheduleMessage}
                  onScheduleBotMessage={handleScheduleBotMessage}
                  currentMessage={selectedConversation.type === 'event' ? "Anuncio programado para evento" : newMessage}
                  availableBots={availableBots}
                />
              )}

              <div className={`chat-messages-area ${isCompanyRole ? 'company-role' : ''}`}>
                {loadingMessages ? (
                  <p className="text-center text-muted p-3">Cargando...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted p-3">No hay mensajes en esta conversación.</p>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        currentUser={currentUserMock} 
                      />
                    ))}
                    <div ref={bottomRef} style={{ height: '1px', width: '100%' }} />
                  </>
                )}
              </div>
              
              {/* Barra de entrada de mensajes - Se muestra si NO es rol empleado o si es un grupo o canal */}
              {(!isEmpleadoRole || 
                (activeTab === 'grupos' && selectedConversation?.type === 'group') || 
                (activeTab === 'canales' && selectedConversation?.type === 'channel')) && 
               selectedConversation?.type !== 'event' && (
              <div className="chat-input-area">
                <InputGroup>
                  <Button variant="link" className="p-2"><FaPaperclip size={20}/></Button>
                  <Button
                    variant={botMode ? "success" : "link"}
                    className="p-2"
                    onClick={() => setShowBotSelector(true)}
                  >
                    <FaRobot size={20}/>
                  </Button>
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
              )}
            </>
          ) : (
            <div className="no-chat-selected">
              <FaComments />
              <p>Selecciona un {activeTab === 'grupos' ? 'grupo' : activeTab === 'canales' ? 'canal' : activeTab === 'eventos' ? 'evento' : 'chat'} para comenzar.</p>
            </div>
          )}
        </div>
      </div>
      {/* Selector de Bots */}
      <BotSelectorModal
        show={showBotSelector}
        bots={availableBots}
        onHide={() => setShowBotSelector(false)}
        onSelect={(bot) => {
          setSelectedBotPrompt(bot.prompt);
          setSelectedBotName(bot.name);
          setBotMode(true);
          setShowBotSelector(false);
        }}
      />
    </>
  );
};

export default ChatPage;
