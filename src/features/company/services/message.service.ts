import API_URL from '../../../config/api';

export interface ChannelMember {
  id: string;
  name: string;
  role?: string;
  email?: string;
  userId?: number; // id numérico del usuario en Strapi (opcional)
}

export interface MessageEntry {
  sender_info: {
    nombre: string;
    apellido: string;
    hora: string;
  };
  message: string;
  programmedMessage?: boolean; // Indica si es un mensaje programado
  scheduledFor?: string; // Timestamp ISO para cuando debe ejecutarse
  processed?: boolean; // Indica si ya fue procesado por el bot
  botInfo?: {
    name: string;
    prompt: string;
  };
}

export interface MessageResponse {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: any;
  // Para comodidad cuando Strapi ya devuelve los campos planos
  content?: MessageEntry[] | string | null;
}

export const messageService = {
  /**
   * Devuelve un message (canal) por documentId (uuid-like)
   */
  async getMessageByDocumentId(documentId: string): Promise<MessageResponse | null> {
    const res = await fetch(`${API_URL}/api/messages?filters[documentId][$eq]=${documentId}&populate=*`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    const dataArr = Array.isArray(json.data) ? json.data : [];
    if (!dataArr.length) return null;
    return dataArr[0] as MessageResponse;
  },

  /**
   * Actualiza la lista group_member enviando PUT al canal
   */
  async updateGroupMembersByDocumentId(
    documentId: string,
    members: ChannelMember[],
    userIds: number[] = []
  ): Promise<MessageResponse> {
    // IMPORTANTE: Obtener los datos completos del mensaje antes de actualizar
    console.log(`Obteniendo datos completos del mensaje ${documentId} antes de actualizar miembros`);
    const currentMessage = await this.getMessageByDocumentId(documentId);
    
    if (!currentMessage) {
      throw new Error(`No se encontró el mensaje con documentId: ${documentId}`);
    }
    
    const currentData = currentMessage.attributes ?? currentMessage;
    
    // DEBUG: Verificar si la empresa está presente antes de actualizar
    console.log('=== DEBUG ACTUALIZACIÓN MIEMBROS ===');
    console.log('currentData.company:', currentData.company);
    console.log('currentData completo:', currentData);
    console.log('=====================================');
    
    // Construir el payload completo preservando TODAS las relaciones existentes
    const fullPayload: Record<string, unknown> = {
      // Campos básicos del mensaje
      name: currentData.name,
      type: currentData.type,
      status_of_channel: currentData.status_of_channel,
      content: currentData.content,
      bot_interaction: currentData.bot_interaction,
      sender_info: currentData.sender_info,
      
      // Actualizar miembros del grupo
      group_member: members,
      users_permissions_users: userIds,
      
      // CRÍTICO: Preservar la relación con la empresa
      // Si company es un objeto, usar solo su ID para la relación
      company: currentData.company && typeof currentData.company === 'object' && currentData.company.id 
        ? currentData.company.id 
        : currentData.company,
    };
    
    // Función de limpieza para eliminar campos que Strapi no permite en PUT
    const cleanPayload = (obj: unknown): Record<string, unknown> | unknown[] | string | number | boolean | null | undefined => {
      if (Array.isArray(obj)) return obj.map(cleanPayload);
      if (obj && typeof obj === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const key in obj as Record<string, unknown>) {
          // Eliminar campos que Strapi no permite en el cuerpo de PUT
          if (!['documentId', 'id', 'createdAt', 'updatedAt', 'publishedAt'].includes(key)) {
            cleaned[key] = cleanPayload((obj as Record<string, unknown>)[key]);
          }
        }
        return cleaned;
      }
      return obj as string | number | boolean | null | undefined;
    };
    
    const cleanedPayload = cleanPayload(fullPayload);
    
    console.log(`Actualizando mensaje ${documentId} con datos limpios:`, cleanedPayload);
    
    const body = { data: cleanedPayload as Record<string, unknown> };
    const putRes = await fetch(`${API_URL}/api/messages/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error(`Error actualizando mensaje: ${errorText}`);
      throw new Error(errorText);
    }
    
    const putJson = await putRes.json();
    const updated = putJson.data ?? putJson;
    console.log(`Mensaje ${documentId} actualizado correctamente con relación empresa preservada`);
    return updated as MessageResponse;
  },

  /**
   * Actualiza campos básicos del canal (name, type, status_of_channel)
   */
  async updateChannelByDocumentId(
    documentId: string,
    data: { name: string; type: string; status: 'Active' | 'Inactive'; companyId?: number }
  ): Promise<MessageResponse> {
    const body: { data: Record<string, unknown> } = {
      data: {
        name: data.name,
        type: data.type,
        status_of_channel: data.status.toLowerCase(),
      }
    };
    
    // Si se proporciona el ID de la compañía, incluirlo en la actualización
    if (data.companyId && !isNaN(data.companyId)) {
      console.log(`Incluyendo compañía ID ${data.companyId} en actualización de canal ${documentId}`);
      body.data.company = data.companyId;
    }
    
    console.log(`Actualizando canal ${documentId} con datos:`, body);
    
    const res = await fetch(`${API_URL}/api/messages/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error actualizando canal: ${errorText}`);
      throw new Error(errorText);
    }
    
    const json = await res.json();
    console.log(`Canal ${documentId} actualizado correctamente`);
    return json.data ?? json;
  },

  async updateBotsByDocumentId(documentId: string, bot_interaction: Record<string, { Prompt: string }>): Promise<MessageResponse> {
    const body = { data: { bot_interaction } };
    const res = await fetch(`${API_URL}/api/messages/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.data ?? json;
  },

  async sendMessage(
    documentId: string,
    messageText: string,
    senderInfo: { nombre: string; apellido: string }
  ): Promise<MessageResponse> {
    // 1. Obtener el registro actual para traer el content existente
    const current = await this.getMessageByDocumentId(documentId);
    const existingContentRaw = current?.attributes?.content ?? current?.content ?? null;

    let contentArray: MessageEntry[] = [];
    try {
      if (existingContentRaw) {
        contentArray = typeof existingContentRaw === 'string' ? JSON.parse(existingContentRaw) : existingContentRaw;
        if (!Array.isArray(contentArray)) contentArray = [];
      }
    } catch (error) {
      console.error('Error parsing content:', error);
      contentArray = [];
    }

    // 2. Nueva entrada de mensaje
    const now = new Date();
    const timestampAR = now.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newEntry = {
      sender_info: {
        nombre: senderInfo.nombre,
        apellido: senderInfo.apellido,
        hora: timestampAR,
      },
      message: messageText,
    };

    contentArray.push(newEntry);

    const body = {
      data: {
        content: contentArray,
      },
    };

    const res = await fetch(`${API_URL}/api/messages/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.data ?? json;
  },

  /**
   * Envía un mensaje programado para ser mostrado en el futuro
   * La hora se establece en el objeto senderInfo
   */
  async sendScheduledMessage(
    documentId: string,
    messageText: string,
    senderInfo: { nombre: string; apellido: string; hora: string },
    scheduledTime: Date
  ): Promise<MessageResponse> {
    // 1. Obtener el registro actual para traer el content existente
    const current = await this.getMessageByDocumentId(documentId);
    const existingContentRaw = current?.attributes?.content ?? current?.content ?? null;

    let contentArray: MessageEntry[] = [];
    try {
      if (existingContentRaw) {
        contentArray = typeof existingContentRaw === 'string' ? JSON.parse(existingContentRaw) : existingContentRaw;
        if (!Array.isArray(contentArray)) contentArray = [];
      }
    } catch (error) {
      console.error('Error parsing content:', error);
      contentArray = [];
    }

    // 2. Crear mensaje programado simple - marcado para NO renderizar hasta su hora
    const scheduledEntry: MessageEntry = {
      sender_info: {
        nombre: senderInfo.nombre,
        apellido: senderInfo.apellido,
        hora: senderInfo.hora,
      },
      message: messageText,
      programmedMessage: true,
      scheduledFor: scheduledTime.toISOString(),
      processed: false
    };

    contentArray.push(scheduledEntry);

    const body = {
      data: {
        content: contentArray,
      },
    };

    const res = await fetch(`${API_URL}/api/messages/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.data ?? json;
  },

  /**
   * Asigna una compañía a un mensaje existente
   * @param messageId ID numérico o documentId del mensaje
   * @param companyId ID numérico de la compañía
   * @returns El mensaje actualizado
   */
  async assignCompanyToMessage(messageId: string | number, companyId: number): Promise<MessageResponse> {
    console.log(`Asignando compañía ID ${companyId} al mensaje ${messageId}`);
    
    const isDocumentId = typeof messageId === 'string' && messageId.length > 10;
    let endpoint = '';
    
    if (isDocumentId) {
      // Si es un documentId, lo usamos directamente en la ruta
      endpoint = `${API_URL}/api/messages/${messageId}`;
      console.log(`Usando endpoint con documentId: ${endpoint}`);
    } else {
      // Si es un ID numérico, lo convertimos
      endpoint = `${API_URL}/api/messages/${Number(messageId)}`;
      console.log(`Usando endpoint con ID numérico: ${endpoint}`);
    }
    
    const body = {
      data: {
        company: companyId
      }
    };
    
    console.log(`Enviando request para actualizar mensaje: ${JSON.stringify(body)}`);
    
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error asignando compañía al mensaje: ${errorText}`);
        throw new Error(`Error asignando compañía: Status ${res.status}`);
      }
      
      const json = await res.json();
      console.log(`Compañía asignada correctamente al mensaje ${messageId}`);
      return json.data ?? json;
    } catch (error) {
      console.error('Error en request de asignación de compañía:', error);
      throw error;
    }
  },

  /**
   * Envía un mensaje programado con bot - NO se renderiza hasta su hora programada
   */
  async sendScheduledBotMessage(
    documentId: string,
    messageText: string,
    scheduledTime: Date,
    botName: string,
    botPrompt: string,
    userInfo: { nombre: string; apellido: string }
  ): Promise<MessageResponse> {
    const current = await this.getMessageByDocumentId(documentId);
    const existingContentRaw = current?.attributes?.content ?? current?.content ?? null;

    let contentArray: MessageEntry[] = [];
    try {
      if (existingContentRaw) {
        contentArray = typeof existingContentRaw === 'string' ? JSON.parse(existingContentRaw) : existingContentRaw;
        if (!Array.isArray(contentArray)) contentArray = [];
      }
    } catch (error) {
      console.error('Error parsing content:', error);
      contentArray = [];
    }

    // Formatear la fecha para Argentina
    const scheduledTimeAR = scheduledTime.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Crear mensaje programado - marcado para NO renderizar hasta su hora
    const scheduledEntry: MessageEntry = {
      sender_info: {
        nombre: userInfo.nombre,
        apellido: userInfo.apellido,
        hora: scheduledTimeAR,
      },
      message: messageText,
      programmedMessage: true,
      scheduledFor: scheduledTime.toISOString(),
      processed: false
    };

    // Agregar metadata del bot para procesamiento futuro
    scheduledEntry.botInfo = {
      name: botName,
      prompt: botPrompt
    };

    contentArray.push(scheduledEntry);

    const body = {
      data: {
        content: contentArray,
      },
    };

    const res = await fetch(`${API_URL}/api/messages/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.data ?? json;
  },

  /**
   * Obtiene los mensajes programados de una conversación específica
   */
  async getScheduledMessagesForConversation(documentId: string): Promise<MessageEntry[]> {
    const current = await this.getMessageByDocumentId(documentId);
    const existingContentRaw = current?.attributes?.content ?? current?.content ?? null;

    let contentArray: MessageEntry[] = [];
    try {
      if (existingContentRaw) {
        contentArray = typeof existingContentRaw === 'string' ? JSON.parse(existingContentRaw) : existingContentRaw;
        if (!Array.isArray(contentArray)) contentArray = [];
      }
    } catch (error) {
      console.error('Error parsing content:', error);
      contentArray = [];
    }

    // Filtrar solo los mensajes programados que NO han sido procesados
    return contentArray.filter(entry => 
      entry.programmedMessage && 
      entry.scheduledFor && 
      !entry.processed
    );
  },

  /**
   * Busca todos los mensajes programados que deben ejecutarse ahora
   */
  async getScheduledMessagesReady(): Promise<{documentId: string, messageEntry: MessageEntry, channelType: string}[]> {
    const res = await fetch(`${API_URL}/api/messages?populate=*`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    const messages = Array.isArray(json.data) ? json.data : [];

    const readyMessages: {documentId: string, messageEntry: MessageEntry, channelType: string}[] = [];
    const now = new Date();

    for (const message of messages) {
      const contentRaw = message.attributes?.content ?? message.content ?? null;
      if (!contentRaw) continue;

      let contentArray: MessageEntry[] = [];
      try {
        contentArray = typeof contentRaw === 'string' ? JSON.parse(contentRaw) : contentRaw;
        if (!Array.isArray(contentArray)) continue;
      } catch (error) {
        console.error('Error parsing content:', error);
        continue;
      }

      // Buscar mensajes programados listos para ejecutar
      for (const entry of contentArray) {
        if (entry.programmedMessage && 
            entry.scheduledFor && 
            !entry.processed && 
            new Date(entry.scheduledFor) <= now) {
          readyMessages.push({
            documentId: message.documentId,
            messageEntry: entry,
            channelType: message.type
          });
        }
      }
    }

    return readyMessages;
  },

  /**
   * Procesa un mensaje programado - puede ser con bot o mensaje simple
   */
  async processScheduledMessage(
    documentId: string,
    messageEntry: MessageEntry,
    channelType: string
  ): Promise<void> {
    try {
      // 1. Obtener contenido actual y marcar mensaje como procesado
      const current = await this.getMessageByDocumentId(documentId);
      const existingContentRaw = current?.attributes?.content ?? current?.content ?? null;

      let contentArray: MessageEntry[] = [];
      try {
        if (existingContentRaw) {
          contentArray = typeof existingContentRaw === 'string' ? JSON.parse(existingContentRaw) : existingContentRaw;
          if (!Array.isArray(contentArray)) contentArray = [];
        }
      } catch (error) {
        console.error('Error parsing content:', error);
        contentArray = [];
      }

      // 2. Marcar mensaje original como procesado
      const messageIndex = contentArray.findIndex(entry => 
        entry.message === messageEntry.message && 
        entry.sender_info.nombre === messageEntry.sender_info.nombre &&
        entry.scheduledFor === messageEntry.scheduledFor
      );

      if (messageIndex !== -1) {
        contentArray[messageIndex].processed = true;
        // Hacer que el mensaje sea visible en el chat quitando la marca programmedMessage
        contentArray[messageIndex].programmedMessage = false;
      }

      // 3. Si tiene bot, procesarlo
      if (messageEntry.botInfo) {
        const botInfo = messageEntry.botInfo;
        
        // Llamar a la API del bot
        const userString = `Eres "${botInfo.name}" debes ${botInfo.prompt}. El usuario ${messageEntry.sender_info.nombre} ${messageEntry.sender_info.apellido} ${channelType === 'event' ? 'envía este anuncio' : 'pregunta'}: ${messageEntry.message}`;
        
        const payload = { user: userString };
        const res = await fetch(`${API_URL}/api/prompts/1/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          console.error('Error calling bot API:', await res.text());
          return;
        }

        const data = await res.json();
        const botAnswer = data.answer ?? '(Sin respuesta del bot)';

        // Añadir respuesta del bot
        const now = new Date();
        const timestampAR = now.toLocaleString('es-AR', {
          timeZone: 'America/Argentina/Buenos_Aires',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        const botResponse: MessageEntry = {
          sender_info: {
            nombre: botInfo.name,
            apellido: '',
            hora: timestampAR,
          },
          message: botAnswer,
          programmedMessage: false, // La respuesta del bot NO es programada
        };

        contentArray.push(botResponse);
      }

      // 4. Guardar cambios
      const body = {
        data: {
          content: contentArray,
        },
      };

      await fetch(`${API_URL}/api/messages/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log(`Mensaje programado procesado correctamente para ${documentId}`);
    } catch (error) {
      console.error('Error procesando mensaje programado:', error);
    }
  },
};
