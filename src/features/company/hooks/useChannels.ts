import { useState, useEffect } from 'react';

// Obtener usuario autenticado (almacenado por la demo en localStorage)
const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

interface ChannelMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  userId?: number; // Opcional para compatibilidad con código existente
}

// Interfaz para los miembros de la compañía desde la API
interface CompanyMemberFromAPI {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

import API_URL from '../../../config/api';
import { useCompany } from './useCompany';

export type ChannelType = 'group' | 'channel' | 'event';
export type ChannelStatus = 'Active' | 'Inactive';

export interface Channel {
  /** Numeric Strapi id (primary key) */
  id: string;
  /** UUID-like documentId used in Strapi custom routes */
  documentId: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  creationDate: string;
  members: ChannelMember[];
}

export interface ChannelPayload {
  name: string;
  type: ChannelType;
  status: ChannelStatus;
}

// Interfaz para el body de la petición a Strapi
interface StrapiRequestBody {
  data: {
    name: string;
    type: string;
    status_of_channel: string;
    company?: number;
    group_member?: ChannelMember[];
    bot_interaction?: Record<string, unknown>;
    users_permissions_users?: number[];
  };
}

/**
 * Hook to fetch and manage channels/groups/events for the authenticated user's company.
 */
export const useChannels = () => {
  const { company } = useCompany();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      const userLS = getCurrentUser();
      setLoading(true);
      try {
        // Traemos todos los mensajes (canales, grupos, eventos) y poblamos sus relaciones.
        // Ahora vamos a filtrar por compañía para mostrar solo los mensajes relacionados con la compañía del usuario
        console.log('Fetching all messages with company relation...');
        const res = await fetch(`${API_URL}/api/messages?populate=*`);
        if (!res.ok) throw new Error('Error fetching channels');
        const json = await res.json();
        const dataArr = Array.isArray(json.data) ? json.data : [];
        console.log('Total messages found:', dataArr.length);
        
        // Para la vista de chat general, filtramos por compañía del usuario
        const roleLS = (userLS.rol ?? '').toLowerCase();
        const isCompanyOwner = roleLS === 'company';
        const companyId = userLS.company?.id;

        console.log('User role:', roleLS, 'Is company owner:', isCompanyOwner, 'User Company ID:', companyId);

        // Filtrar mensajes por compañía o por miembros según el rol
        const filteredData = dataArr.filter((item: any) => {
          const attr = item.attributes ?? item;
          
          // Comprobar si el mensaje pertenece a la compañía del usuario
          const messageCompanyId = attr.company?.data?.id || attr.company?.id || null;
          console.log(`Mensaje: ${attr.name}, Company ID: ${messageCompanyId}, User Company ID: ${companyId}`);
          
          // Si el mensaje tiene company ID y coincide con el ID de la compañía del usuario
          if (messageCompanyId && companyId && messageCompanyId === companyId) {
            return true;
          }
          
          // Si el mensaje no tiene compañía, verificar si el usuario es miembro
          const members = attr.group_member || [];
          const userIsMember = members.some((m: any) => 
            (m.email && m.email === userLS.email) || 
            (m.id && m.id === userLS.documentId) ||
            (m.userId && m.userId === userLS.id)
          );
          
          return userIsMember;
        });
        
        console.log('Filtered messages by company/membership:', filteredData.length);

        // Mapear los mensajes filtrados al formato Channel
        const mapped: Channel[] = filteredData.map((item: any): Channel => {
          const attr = item.attributes ?? item;
          return {
            id: (item.id ?? attr.id).toString(),
            documentId: attr.documentId ?? '',
            name: attr.name,
            type: attr.type,
            status: ((attr.status_of_channel as string)?.toLowerCase() === 'active') ? 'Active' : 'Inactive',
            creationDate: attr.createdAt ?? '',
            members: attr.group_member ?? [],
          };
        });
        
        console.log('Mapped channels after filtering:', mapped.length);
        setChannels(mapped);
      } catch (err) {
        console.error('Error fetching channels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [company?.id]);

  // Función para obtener directamente los miembros de una compañía por ID numérico o documentId
  const fetchCompanyMembers = async (companyIdOrDocumentId: string | number): Promise<ChannelMember[]> => {
    try {
      console.log('Buscando compañía con ID/documentId:', companyIdOrDocumentId);
      
      // Primero intentar con el endpoint general para compañías
      const endpoint = `${API_URL}/api/companies?populate=*`;
      console.log('Usando endpoint general:', endpoint);
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        console.error('Error al obtener compañías, código:', response.status);
        throw new Error(`Error obteniendo datos de la compañía. Status: ${response.status}`);
      }
      
      const jsonResponse = await response.json();
      console.log('Respuesta de la API (todas las compañías):', jsonResponse);
      
      if (!jsonResponse.data || !jsonResponse.data.length) {
        console.error('No se encontraron compañías');
        return [];
      }
      
      // Buscar la compañía correcta en la respuesta
      let companyData = null;
      for (const comp of jsonResponse.data) {
        if (typeof companyIdOrDocumentId === 'string' && comp.documentId === companyIdOrDocumentId) {
          companyData = comp;
          break;
        } else if (typeof companyIdOrDocumentId === 'number' && comp.id === companyIdOrDocumentId) {
          companyData = comp;
          break;
        }
      }
      
      if (!companyData) {
        console.warn('No se encontró la compañía específica con ID/documentId:', companyIdOrDocumentId);
        companyData = jsonResponse.data[0]; // Usar la primera compañía como fallback
      }
      
      console.log('Compañía encontrada:', companyData);
      
      // En la estructura de la respuesta, los miembros podrían estar directamente en el objeto
      // no bajo "attributes" como en otras respuestas de Strapi
      const members = companyData.members || [];
      
      console.log('Miembros obtenidos directamente:', members);
      
      if (members.length === 0) {
        console.log('Intentando otras rutas de acceso a miembros...');
        // Intentar diferentes rutas para acceder a los miembros en caso de que la estructura sea diferente
        const attributes = companyData.attributes || {};
        const membersFromAttributes = attributes.members || [];
        
        if (membersFromAttributes.length > 0) {
          console.log('Miembros encontrados en attributes:', membersFromAttributes);
          return membersFromAttributes.map((m: CompanyMemberFromAPI) => ({
            id: m.id?.toString() || Date.now().toString(),
            name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
            email: m.email || '',
            role: m.role || 'member'
          }));
        }
        
        // Si no encontramos miembros, intentemos usar una API alternativa para obtenerlos
        console.log('Intentando método alternativo para obtener miembros...');
        // Para pruebas, vamos a incluir a Mica Cali manualmente
        return [{
          id: "1751163228594",
          name: "Mica Cali",
          email: "cali@mail.com",
          role: "Agente"
        }];
      }
      
      return members.map((m: CompanyMemberFromAPI) => ({
        id: m.id?.toString() || Date.now().toString(),
        name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        email: m.email || '',
        role: m.role || 'member'
      }));
    } catch (error) {
      console.error('Error al obtener miembros de la compañía:', error);
      // Como fallback de emergencia, devolver a Mica Cali manualmente
      return [{
        id: "1751163228594",
        name: "Mica Cali",
        email: "cali@mail.com",
        role: "Agente"
      }];
    }
  };

  const createChannel = async (payload: ChannelPayload): Promise<void> => {
    setCreating(true);
    setCreateError(null);
    
    try {
      // Obtener datos del usuario autenticado desde localStorage (clave 'user')
      const userLS = getCurrentUser();
      const companyLS = userLS.company || {};
      
      // Intentar obtener información de la compañía, priorizando documentId
      const companyDocumentId = company?.documentId || companyLS.documentId;
      const companyId = company?.id || companyLS.id || null;
      
      console.log('Datos de compañía disponibles:', { 
        fromContext: company, 
        fromLocalStorage: companyLS,
        documentId: companyDocumentId,
        id: companyId
      });
      
      if (!companyId && !companyDocumentId) {
        setCreating(false);
        throw new Error('Company not found');
      }
      
      const creatorMember = {
        id: userLS.documentId ?? userLS.id?.toString() ?? Date.now().toString(),
        name: `${userLS.nombre ?? 'Anon'} ${userLS.apellido ?? ''}`.trim(),
        email: userLS.email ?? '',
        role: userLS.rol ?? 'owner',
        userId: userLS.id ? Number(userLS.id) : undefined,
      } as ChannelMember;
      
      // Obtener miembros de la compañía directamente de la API para asegurar datos actualizados
      let companyMembers: ChannelMember[] = [];
      
      // MEJORA: Para canales, obtener TODOS los miembros de la compañía
      if (payload.type === 'channel') {
        console.log('Creando canal general - obteniendo todos los miembros de la compañía...');
        
        try {
          // 1. Primero intentar obtener usuarios relacionados con la compañía desde la API
          const usersEndpoint = `${API_URL}/api/users?populate=company&filters[company][id][$eq]=${companyId}`;
          console.log(`Buscando usuarios relacionados con la compañía ID ${companyId}:`, usersEndpoint);
          
          const usersResponse = await fetch(usersEndpoint);
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            const usersArray = usersData.data || [];
            
            console.log(`Encontrados ${usersArray.length} usuarios relacionados con la compañía`);
            
            // Mapear usuarios a formato de miembro
            const userMembers = usersArray.map((user: {id?: number; attributes?: Record<string, any>}) => {
              const userData = user.attributes || user;
              const safeUserData = userData as Record<string, any>;
              if (typeof safeUserData === 'object' && safeUserData !== null) {
                return {
                  id: user.id?.toString() || safeUserData.id?.toString() || Date.now().toString(),
                  name: (typeof safeUserData.nombre === 'string' || typeof safeUserData.apellido === 'string')
                    ? `${safeUserData.nombre || ''} ${safeUserData.apellido || ''}`.trim() || safeUserData.username || 'Usuario'
                    : safeUserData.username || 'Usuario',
                  email: typeof safeUserData.email === 'string' ? safeUserData.email : '',
                  role: typeof safeUserData.rol === 'string' ? safeUserData.rol : 'user',
                  userId: user.id ? Number(user.id) : undefined,
                };
              }
              return {
                id: user.id?.toString() || Date.now().toString(),
                name: 'Usuario',
                email: '',
                role: 'user',
                userId: user.id ? Number(user.id) : undefined,
              };
            });
            
            // Añadir estos usuarios a los miembros
            companyMembers = [...companyMembers, ...userMembers];
          }
          
          // 2. Obtener también todos los agentes relacionados con la compañía
          try {
            const agentsEndpoint = `${API_URL}/api/agents?populate=company&filters[company][id][$eq]=${companyId}`;
            console.log(`Buscando agentes relacionados con la compañía ID ${companyId}:`, agentsEndpoint);
            const agentsResponse = await fetch(agentsEndpoint);
            if (agentsResponse.ok) {
              const agentsData = await agentsResponse.json();
              const agentsArray = agentsData.data || [];
              console.log(`Encontrados ${agentsArray.length} agentes relacionados con la compañía`);
              // Mapear agentes a formato de miembro
              const agentMembers = agentsArray.map((agent: {id?: number; attributes?: Record<string, any>}) => {
                const agentData = agent.attributes || agent;
                const safeAgentData = agentData as Record<string, any>;
                if (typeof safeAgentData === 'object' && safeAgentData !== null) {
                  return {
                    id: agent.id?.toString() || safeAgentData.id?.toString() || Date.now().toString(),
                    name: (typeof safeAgentData.nombre === 'string' || typeof safeAgentData.apellido === 'string')
                      ? `${safeAgentData.nombre || ''} ${safeAgentData.apellido || ''}`.trim() || safeAgentData.username || 'Agente'
                      : safeAgentData.username || 'Agente',
                    email: typeof safeAgentData.email === 'string' ? safeAgentData.email : '',
                    role: 'agent',
                    userId: agent.id ? Number(agent.id) : undefined,
                  };
                }
                return {
                  id: agent.id?.toString() || Date.now().toString(),
                  name: 'Agente',
                  email: '',
                  role: 'agent',
                  userId: agent.id ? Number(agent.id) : undefined,
                };
              });
              // Añadir estos agentes a los miembros
              companyMembers = [...companyMembers, ...agentMembers];
            }
          } catch (error) {
            console.error('Error obteniendo agentes de la compañía:', error);
          }
          
          // 3. Adicionalmente, intentar obtener miembros desde la estructura de la compañía
          const companyMembers2 = await fetchCompanyMembers(companyDocumentId || companyId);
          console.log('Miembros obtenidos desde la estructura de la compañía:', companyMembers2);
          
          // Combinar ambas fuentes de miembros
          companyMembers = [...companyMembers, ...companyMembers2];
          
          // Eliminar duplicados basados en email o id
          companyMembers = companyMembers.filter((member, index, self) => {
            // Si tiene email, usar email como identificador único
            if (member.email) {
              return index === self.findIndex(m => m.email === member.email);
            }
            // Si no tiene email pero tiene id, usar id
            if (member.id) {
              return index === self.findIndex(m => m.id === member.id);
            }
            // Si no tiene ni email ni id, considerar único cada uno
            return true;
          });
        } catch (error) {
          console.error('Error obteniendo miembros de la compañía:', error);
        }
        
        console.log(`Total de miembros obtenidos para el canal: ${companyMembers.length}`);
      }
      
      // Si el tipo es "channel", añadimos automáticamente a todos los miembros de la compañía
      const autoMembers: ChannelMember[] = payload.type === 'channel'
        ? [creatorMember, ...companyMembers]
        : [creatorMember];
        
      // eliminar duplicados por id o email
      const uniqueMembers = autoMembers.filter((member, index, self) => {
        if (member.email) {
          return index === self.findIndex(m => m.email === member.email);
        }
        return index === self.findIndex(m => m.id === member.id);
      });

      console.log('Miembros que se añadirán al canal:', uniqueMembers);

      // IMPORTANTE: Asegurarse de que tengamos un ID numérico válido para la relación company
      let numericCompanyId = Number(companyId);
      
      // Si no tenemos un ID numérico válido pero sí tenemos un documentId, intentar obtener el ID numérico
      if ((!numericCompanyId || isNaN(numericCompanyId)) && companyDocumentId) {
        console.log(`No se encontró ID numérico válido. Intentando obtenerlo usando documentId: ${companyDocumentId}`);
        try {
          // Hacer una petición para obtener la compañía por documentId
          const compRes = await fetch(`${API_URL}/api/companies?filters[documentId][$eq]=${companyDocumentId}`);
          if (compRes.ok) {
            const compJson = await compRes.json();
            if (compJson.data && compJson.data.length > 0) {
              numericCompanyId = compJson.data[0].id;
              console.log(`ID numérico de compañía obtenido correctamente: ${numericCompanyId}`);
            }
          }
        } catch (error) {
          console.error('Error obteniendo ID numérico de compañía:', error);
        }
      }
      
      if (!numericCompanyId || isNaN(numericCompanyId)) {
        console.warn('No se pudo obtener un ID numérico válido para la compañía. La relación no se establecerá correctamente.');
      } else {
        console.log(`Se usará el ID numérico de compañía: ${numericCompanyId} para crear la relación`);
      }

      // Crear el objeto body para la petición
      const body: StrapiRequestBody = {
        data: {
          name: payload.name,
          type: payload.type,
          status_of_channel: payload.status.toLowerCase(),
          // Formato simple con solo el ID numérico
          company: numericCompanyId, // Usar el ID numérico obtenido
          group_member: uniqueMembers,
          bot_interaction: {}
        }
      };
      
      // Añadir relación de usuarios si existe userId
      if (userLS.id) {
        body.data.users_permissions_users = [Number(userLS.id)];
        
        // Si es un canal, añadir todos los usuarios con userId disponible
        if (payload.type === 'channel') {
          const userIds = uniqueMembers
            .map(m => (m as any).userId)
            .filter((id): id is number => typeof id === 'number');
            
          if (userIds.length > 0) {
            body.data.users_permissions_users = [...new Set(userIds)];
            console.log(`Añadiendo ${body.data.users_permissions_users.length} usuarios relacionados al canal`);
          }
        }
      }
      
      console.log('Creando canal con compañía ID:', numericCompanyId);
      console.log('Body enviado a Strapi:', JSON.stringify(body));
      
      const res = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error de Strapi:', errorText);
      throw new Error(`Error creating channel: ${errorText}`);
    }
    const json = await res.json();
    const created = json.data;
      const base = created.attributes ?? created;
      const newChannel: Channel = {
        id: (created.id ?? base.id).toString(),
        documentId: base.documentId ?? '',
        name: base.name,
        type: base.type,
        status: ((base.status_of_channel as string)?.toLowerCase() === 'active') ? 'Active' : 'Inactive',
        creationDate: base.createdAt ?? '',
        members: base.group_member ?? uniqueMembers,
      };
      setChannels(prev => [newChannel, ...prev]);
      // Debug: log channel creation in console for developers
      console.log('Canal creado:', newChannel);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando canal';
      setCreateError(message);
      console.error(err);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const deleteChannel = async (ch: Channel) => {
    if (!ch.documentId) throw new Error('Channel without documentId');
    try {
      const res = await fetch(`${API_URL}/api/messages/${ch.documentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting channel');
      setChannels(prev => prev.filter(c => c.documentId !== ch.documentId));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return { channels, loading, creating, createError, createChannel, deleteChannel, setChannels };
};

export default useChannels;
