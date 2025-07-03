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
    // El backend demo acepta PUT usando documentId directamente (cadena)
    const body = { data: { group_member: members, users_permissions_users: userIds } };
    const putRes = await fetch(`${API_URL}/api/messages/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!putRes.ok) throw new Error(await putRes.text());
    const putJson = await putRes.json();
    const updated = putJson.data ?? putJson;
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _scheduledTime: Date // No usado directamente, pero mantenido para compatibilidad de API
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

    // 2. Nueva entrada de mensaje programado (la hora ya viene en senderInfo)
    const newEntry = {
      sender_info: {
        nombre: senderInfo.nombre,
        apellido: senderInfo.apellido,
        hora: senderInfo.hora, // Hora programada en formato Argentina
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
};
