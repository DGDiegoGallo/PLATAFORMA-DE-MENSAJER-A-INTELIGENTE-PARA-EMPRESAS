import API_URL from '../../../config/api';

export interface AdminCompanyResponse {
  id: number;
  attributes: {
    name: string;
    description: Record<string, unknown>;
    crypto_assets?: Record<string, unknown>;
    documentId?: string;
    members?: any[];
    createdAt: string;
    updatedAt: string;
    users_permissions_users?: {
      data: Array<{
        id: number;
        attributes: {
          username: string;
          email: string;
          // otros campos de usuario
        };
      }>;
    };
    // otras relaciones
    [key: string]: any;
  };
}

export interface AdminMessageResponse {
  id: number;
  attributes: {
    name: string;
    type: string;
    status_of_channel: string;
    documentId: string;
    content: any[] | string;
    group_member: any[];
    bot_interaction?: Record<string, { Prompt: string }>;
    createdAt: string;
    updatedAt: string;
    company?: {
      data: {
        id: number;
        attributes: {
          name: string;
          // otros campos de company
        };
      };
    };
    users_permissions_users?: {
      data: Array<{
        id: number;
        attributes: {
          username: string;
          email: string;
          // otros campos de usuario
        };
      }>;
    };
    // otras relaciones
    [key: string]: any;
  };
}

export interface AdminUserResponse {
  id: number;
  attributes: {
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    nombre?: string;
    apellido?: string;
    rol?: string;
    documentoID?: string;
    createdAt: string;
    updatedAt: string;
    company?: {
      data: {
        id: number;
        attributes: {
          name: string;
          // otros campos de company
        };
      };
    };
    messages?: {
      data: Array<{
        id: number;
        attributes: {
          name: string;
          // otros campos de message
        };
      }>;
    };
    // otras relaciones
    [key: string]: any;
  };
}

export const adminService = {
  /**
   * Obtiene todas las empresas con sus relaciones
   * @param page Número de página para paginación
   * @param pageSize Tamaño de página para paginación
   * @returns Lista de empresas con sus relaciones (sin paginación)
   */
  async getCompanies(): Promise<{
    data: AdminCompanyResponse[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }> {
    // Consulta con paginación y populate=* para incluir relaciones
    const res = await fetch(`${API_URL}/api/companies?populate=*`);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error obteniendo empresas: ${errText}`);
    }

    return await res.json();
  },

  /**
   * Obtiene todos los mensajes con sus relaciones
   * @returns Lista de mensajes con sus relaciones (sin paginación)
   */
  async getMessages(): Promise<{
    data: AdminMessageResponse[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }> {
    // Consulta con paginación y populate=* para incluir relaciones
    const res = await fetch(`${API_URL}/api/messages?populate=*`);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error obteniendo mensajes: ${errText}`);
    }

    return await res.json();
  },

  /**
   * Obtiene todos los usuarios con sus relaciones
   * @returns Lista de usuarios con sus relaciones (sin paginación)
   */
  async getUsers(): Promise<{
    data: AdminUserResponse[];
    meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
  }> {
    // Consulta con paginación y populate=* para incluir relaciones
    const res = await fetch(`${API_URL}/api/users?populate=*`);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error obteniendo usuarios: ${errText}`);
    }

    return await res.json();
  },

  /**
   * Obtiene una empresa específica por su ID con todas sus relaciones
   * @param id ID de la empresa
   * @returns Datos completos de la empresa con relaciones
   */
  async getCompanyById(id: number): Promise<{ data: AdminCompanyResponse }> {
    // Populate profundo para obtener todas las relaciones y sus datos
    const query = new URLSearchParams({
      'populate': 'deep,3' // Popula relaciones con profundidad 3
    });

    const res = await fetch(`${API_URL}/api/companies/${id}?${query.toString()}`);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error obteniendo empresa: ${errText}`);
    }

    return await res.json();
  },

  /**
   * Obtiene un mensaje específico por su ID con todas sus relaciones
   * @param id ID del mensaje
   * @returns Datos completos del mensaje con relaciones
   */
  async getMessageById(id: number): Promise<{ data: AdminMessageResponse }> {
    // Populate profundo para obtener todas las relaciones y sus datos
    const query = new URLSearchParams({
      'populate': 'deep,3' // Popula relaciones con profundidad 3
    });

    const res = await fetch(`${API_URL}/api/messages/${id}?${query.toString()}`);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error obteniendo mensaje: ${errText}`);
    }

    return await res.json();
  },

  /**
   * Obtiene un usuario específico por su ID con todas sus relaciones
   * @param id ID del usuario
   * @returns Datos completos del usuario con relaciones
   */
  async getUserById(id: number): Promise<{ data: AdminUserResponse }> {
    // Populate profundo para obtener todas las relaciones y sus datos
    const query = new URLSearchParams({
      'populate': 'deep,3' // Popula relaciones con profundidad 3
    });

    const res = await fetch(`${API_URL}/api/users/${id}?${query.toString()}`);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error obteniendo usuario: ${errText}`);
    }

    return await res.json();
  },

  async deleteUser(id: number): Promise<boolean> {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error eliminando usuario: ${errText}`);
    }
    return true;
  }
};

export default adminService; 