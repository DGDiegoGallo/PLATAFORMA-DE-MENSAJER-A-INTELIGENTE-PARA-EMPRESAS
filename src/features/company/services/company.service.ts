import API_URL from '../../../config/api';

// Set this env var to "true" to avoid hitting a real backend while styling
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface CompanyPayload {
  name?: string;
  description?: Record<string, unknown>;
  documentId?: string;
  members?: any[];
}

export interface CompanyResponse extends CompanyPayload {
  id: number;
  members?: any[];
  // extend according to your Strapi model
}


export const companyService = {
  /**
   * Creates a new company in Strapi. Optionally attaches the creating user.
   * @param payload  Company fields collected from the form
   * @param userId   Logged-in user id that should be linked with the company (optional)
   */
  async createCompany(payload: CompanyPayload, userId?: number): Promise<CompanyResponse> {
    if (IS_MOCK) {
      // return a fake company quickly for frontend work
      return await new Promise(resolve =>
        setTimeout(() => resolve({ id: Date.now(), ...payload }), 500)
      );
    }

    // Strapi v4+ expects { data: { name, description } }
    type StrapiBody = { data: Record<string, unknown> };
    const body: StrapiBody = { data: { name: payload.name, description: payload.description } };
    if (userId) {
      // Assuming you created a many-to-many relation called "users" in the Company collection
      body.data.users_permissions_users = [userId];
    }

    const res = await fetch(`${API_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error creando empresa: ${errText}`);
    }

    const json = await res.json();
    // In Strapi REST the created entity lives in json.data
    const created = Array.isArray(json) ? json[0] : json.data;
    return {
      id: created.id,
      ...(created.attributes ?? created),
    } as CompanyResponse;
  },

  /**
   * Retrieves the first company associated with the given user id (relation users_permissions_users)
   * Returns null if the user does not belong to any company.
   */
  async updateCompanyByDocumentId(documentId: string, payload: CompanyPayload): Promise<CompanyResponse> {
    if (IS_MOCK) {
      return await new Promise(resolve => setTimeout(() => resolve({ id: Date.now(), documentId, ...payload }), 300));
    }

    // IMPORTANTE: Obtener las relaciones con mensajes existentes antes de actualizar
    console.log(`Obteniendo mensajes relacionados con la empresa ${documentId} antes de actualizar`);
    let relatedMessages: number[] = [];
    try {
      const messagesRes = await fetch(`${API_URL}/api/messages?filters[company][documentId][$eq]=${documentId}&populate=company`);
      if (messagesRes.ok) {
        const messagesJson = await messagesRes.json();
        relatedMessages = (messagesJson.data || []).map((msg: any) => msg.id);
        console.log(`Preservando ${relatedMessages.length} mensajes relacionados:`, relatedMessages);
      } else {
        console.warn('No se pudieron obtener los mensajes relacionados en updateCompanyByDocumentId');
      }
    } catch (error) {
      console.warn('Error obteniendo mensajes relacionados en updateCompanyByDocumentId:', error);
    }

    type StrapiBody = { data: Record<string, unknown> };
    // Limpieza profunda para eliminar documentId de cualquier parte del payload
    const deepClean = (obj: unknown): Record<string, unknown> | unknown[] | string | number | boolean | null | undefined => {
      if (Array.isArray(obj)) return obj.map(deepClean);
      if (obj && typeof obj === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const key in obj as Record<string, unknown>) {
          if (key !== 'documentId') {
            cleaned[key] = deepClean((obj as Record<string, unknown>)[key]);
          }
        }
        return cleaned;
      }
      return obj as string | number | boolean | null | undefined;
    };
    const cleanedPayload = deepClean({
      name: payload.name,
      description: payload.description,
      members: payload.members,
      bots: (typeof payload === 'object' && payload && 'bots' in payload) ? (payload as Record<string, unknown>).bots : undefined,
      metrics: (typeof payload === 'object' && payload && 'metrics' in payload) ? (payload as Record<string, unknown>).metrics : undefined,
      users_permissions_users: (typeof payload === 'object' && payload && 'users_permissions_users' in payload) ? (payload as Record<string, unknown>).users_permissions_users : undefined,
      // CRÍTICO: Preservar las relaciones con mensajes
      messages: relatedMessages,
    });
    const body: StrapiBody = { data: cleanedPayload as Record<string, unknown> };

    const res = await fetch(`${API_URL}/api/companies/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error actualizando compañía: ${err}`);
    }

    const json = await res.json();
    const updated = Array.isArray(json) ? json[0] : json.data;
    return { id: updated.id ?? 0, ...(updated.attributes ?? updated) } as CompanyResponse;
  },

  async updateCompany(id: number, payload: CompanyPayload): Promise<CompanyResponse> {
    if (IS_MOCK) {
      return await new Promise(resolve => setTimeout(() => resolve({ id, ...payload }), 300));
    }

    type StrapiBody = { data: Record<string, unknown> };
    const body: StrapiBody = { data: { name: payload.name, description: payload.description } };

    const res = await fetch(`${API_URL}/api/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error actualizando compañía: ${errText}`);
    }

    const json = await res.json();
    const updated = Array.isArray(json) ? json[0] : json.data;
    return { id: updated.id, ...(updated.attributes ?? updated) } as CompanyResponse;
  },

  async getCompanyByUser(userId: number): Promise<CompanyResponse | null> {
    if (IS_MOCK) {
      return await new Promise(resolve => setTimeout(() => resolve(null), 300));
    }

    const query = `filters[users_permissions_users][id][$eq]=${userId}&populate=*`;
    const res = await fetch(`${API_URL}/api/companies?${query}`);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error obteniendo compañía: ${errText}`);
    }

    const json = await res.json();
    const dataArr = Array.isArray(json.data) ? json.data : [];
    if (!dataArr.length) return null;

    const first = dataArr[0];
    return {
      id: first.id,
      ...(first.attributes ?? first),
    } as CompanyResponse;
  },

  /**
   * Agrega un miembro (usuario) a la compañía.
   * 1. Crea el usuario en `/api/users`.
   * 2. Actualiza la compañía añadiendo el `userId` a la relación
   *    `users_permissions_users` y agregando los datos básicos al campo `members`.
   */
    /**
   * Añade un miembro solo al JSON `members` vía documentId.
   * No crea usuario; sirve para demo rápida.
   */
  async getCompanyByDocumentId(documentId: string): Promise<CompanyResponse | null> {
    console.log(`Fetching company with documentId: ${documentId}`);
    const res = await fetch(`${API_URL}/api/companies?filters[documentId][$eq]=${documentId}&populate=*`);
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error response: ${errText}`);
      throw new Error(errText);
    }
    
    const json = await res.json();
    console.log("API Response:", json);
    
    const dataArr = Array.isArray(json.data) ? json.data : [];
    if (!dataArr.length) {
      console.log("No company found with this documentId");
      return null;
    }
    
    const first = dataArr[0];
    const company = { 
      id: first.id, 
      ...(first.attributes ?? first) 
    } as CompanyResponse;
    
    console.log("Company data processed:", company);
    return company;
  },

  async updateMembersByDocumentId(
    documentId: string,
    members: any[]
  ): Promise<CompanyResponse> {
    console.log(`Updating members for company ${documentId}:`, members);
    // Obtener todos los datos actuales de la compañía CON POPULATE COMPLETO
    const currentCompany = await this.getCompanyByDocumentId(documentId);
    if (!currentCompany) throw new Error('No se pudo obtener la compañía actual');
    
    // IMPORTANTE: Obtener también las relaciones con mensajes existentes
    console.log(`Obteniendo mensajes relacionados con la empresa ${documentId}`);
    let relatedMessages: number[] = [];
    try {
      const messagesRes = await fetch(`${API_URL}/api/messages?filters[company][documentId][$eq]=${documentId}&populate=company`);
      if (messagesRes.ok) {
        const messagesJson = await messagesRes.json();
        relatedMessages = (messagesJson.data || []).map((msg: any) => msg.id);
        console.log(`Encontrados ${relatedMessages.length} mensajes relacionados:`, relatedMessages);
      } else {
        console.warn('No se pudieron obtener los mensajes relacionados, continuando sin ellos');
      }
    } catch (error) {
      console.warn('Error obteniendo mensajes relacionados:', error);
    }
    
    // Asegurarse de que todos los miembros tengan un ID único
    const membersWithUniqueIds = members.map(member => {
      if (!member.id) {
        return { ...member, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) };
      }
      return member;
    });
    
    // Construir el payload completo, INCLUYENDO las relaciones con mensajes
    const fullPayload: Record<string, any> = {
      name: currentCompany.name,
      description: currentCompany.description,
      members: membersWithUniqueIds,
      bots: (typeof currentCompany === 'object' && currentCompany && 'bots' in currentCompany) ? (currentCompany as Record<string, unknown>).bots : undefined,
      metrics: (typeof currentCompany === 'object' && currentCompany && 'metrics' in currentCompany) ? (currentCompany as Record<string, unknown>).metrics : undefined,
      users_permissions_users: (typeof currentCompany === 'object' && currentCompany && 'users_permissions_users' in currentCompany) ? (currentCompany as Record<string, unknown>).users_permissions_users : undefined,
      // CRÍTICO: Preservar las relaciones con mensajes
      messages: relatedMessages,
    };
    
    // Limpieza profunda de documentId
    const deepClean = (obj: unknown): Record<string, unknown> | unknown[] | string | number | boolean | null | undefined => {
      if (Array.isArray(obj)) return obj.map(deepClean);
      if (obj && typeof obj === 'object') {
        const cleaned: Record<string, unknown> = {};
        for (const key in obj as Record<string, unknown>) {
          if (key !== 'documentId') {
            cleaned[key] = deepClean((obj as Record<string, unknown>)[key]);
          }
        }
        return cleaned;
      }
      return obj as string | number | boolean | null | undefined;
    };
    
    const cleanedPayload = deepClean(fullPayload);
    const body = { data: cleanedPayload as Record<string, unknown> };
    console.log("Request body con mensajes preservados:", JSON.stringify(body, null, 2));
    
    const putRes = await fetch(`${API_URL}/api/companies/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error(`Error response: ${errText}`);
      throw new Error(errText);
    }
    
    const putJson = await putRes.json();
    console.log("Update response:", putJson);
    const updated = putJson.data ?? putJson;
    return { id: updated.id ?? 0, ...(updated.attributes ?? updated) } as CompanyResponse;
  },

  // Add a new direct function to get members by documentId
  async getMembersByDocumentId(documentId: string): Promise<any[]> {
    console.log(`Getting members directly for company ${documentId}`);
    
    const company = await this.getCompanyByDocumentId(documentId);
    if (!company) {
      throw new Error("Company not found");
    }
    
    const members = company.members || [];
    console.log("Retrieved members:", members);
    
    return members;
  },

  async addMemberByDocumentId(
    documentId: string,
    payload: { firstName: string; lastName: string; email: string; role: string }
  ): Promise<CompanyResponse> {
    const companyRes = await fetch(`${API_URL}/api/companies?filters[documentId][$eq]=${documentId}&populate=*`);
    if (!companyRes.ok) throw new Error(await companyRes.text());
    const compJson = await companyRes.json();
    const compData = compJson.data?.[0];
    if (!compData) throw new Error('Compañía no encontrada');
    const companyId = compData.id;
    const existingMembers = compData.attributes.members ?? [];
    
    // Crear un nuevo miembro con ID único
    const newMember = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: `${payload.firstName} ${payload.lastName}`,
      email: payload.email,
      role: payload.role,
    };
    
    // Agregar el nuevo miembro a la lista existente
    const updatedMembers = [...existingMembers, newMember];
    
    const body = { data: { members: updatedMembers } };
    const putRes = await fetch(`${API_URL}/api/companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!putRes.ok) throw new Error(await putRes.text());
    const putJson = await putRes.json();
    const updated = putJson.data ?? putJson;
    return { id: updated.id, ...(updated.attributes ?? updated) } as CompanyResponse;
  },

  async addMember(
    companyId: number,
    payload: { firstName: string; lastName: string; email: string; role: string }
  ): Promise<CompanyResponse> {
    if (IS_MOCK) {
      const fakeMember = { id: Date.now().toString(), ...payload };
      return await new Promise(resolve =>
        setTimeout(
          () => resolve({ id: companyId, members: [fakeMember] } as unknown as CompanyResponse),
          300
        )
      );
    }

    /* Paso 1: crear usuario */
    const userRes = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "username": payload.email,
        email: payload.email,
        password: `${Date.now()}Temp!`, // Contraseña temporal (el login no se usa en la demo)
        rol: payload.role.toLowerCase(),
        nombre: payload.firstName,
        apellido: payload.lastName,
        company: companyId,
      }),
    });
    if (!userRes.ok) {
      const text = await userRes.text();
      throw new Error(`Error creando usuario: ${text}`);
    }
    const createdUser = await userRes.json();
    const newUserId: number = createdUser.id ?? createdUser.data?.id;

    /* Paso 2: obtener datos actuales de la compañía */
    const companyRes = await fetch(`${API_URL}/api/companies/${companyId}?populate=*`);
    if (!companyRes.ok) {
      const txt = await companyRes.text();
      throw new Error(`Error leyendo compañía: ${txt}`);
    }
    const compJson = await companyRes.json();
    const compData = compJson.data;
    const existingMembers = compData.attributes.members ?? [];
    const existingUsers: number[] = (compData.attributes.users_permissions_users ?? []).map(
      (u: any) => u.id
    );

    /* Paso 3: actualizar la compañía con el nuevo miembro */
    const updatedMembers = [
      ...existingMembers,
      {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // ID local único, no es foreign key
        userId: newUserId, // Esto ayuda a mantener relación con el id real del usuario en la DB
        name: `${payload.firstName} ${payload.lastName}`,
        email: payload.email, // duplicamos el dato para facilitar búsquedas
        role: payload.role,
      },
    ];

    const updatedUsers = [...new Set([...existingUsers, newUserId])];
    const body = {
      data: {
        members: updatedMembers,
        users_permissions_users: updatedUsers,
      },
    };

    const putRes = await fetch(`${API_URL}/api/companies/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!putRes.ok) {
      const putErr = await putRes.text();
      throw new Error(`Error actualizando compañía: ${putErr}`);
    }

    const putJson = await putRes.json();
    const updated = putJson.data ?? putJson;

    /* Paso 4: devolvemos la compañía actualizada */
    return { id: companyId, ...(updated.attributes ?? updated) } as CompanyResponse;
  },
};
