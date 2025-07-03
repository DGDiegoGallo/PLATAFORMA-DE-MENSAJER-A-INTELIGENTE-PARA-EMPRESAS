import API_URL from '../../../config/api';

interface User {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
  documentoID?: string;
  company?: number | null;
  [key: string]: string | number | boolean | null | undefined;
}

export const userService = {
  /**
   * Actualiza el campo `rol` del usuario (colección users-permissions)
   * @param userId ID del usuario
   * @param newRole Nuevo rol ("company", "admin", etc.)
   */
  async updateRole(userId: number, newRole: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: newRole }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error actualizando rol: ${errText}`);
    }
  },
  /**
   * Obtiene el usuario por email (primera coincidencia)
   * @param email Correo electrónico del usuario
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = `filters[email][$eq]=${encodeURIComponent(email)}`;
      const res = await fetch(`${API_URL}/api/users?${query}`);
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error buscando usuario: ${err}`);
      }
      
      const json = await res.json();
      
      if (Array.isArray(json) && json.length) {
        return json[0] as User;
      }
      
      if (Array.isArray(json.data) && json.data.length) {
        const first = json.data[0];
        return { id: first.id, ...first.attributes } as User;
      }
      
      console.log(`No se encontró ningún usuario con email: ${email}`);
      return null;
    } catch (error) {
      console.error(`Error al buscar usuario por email ${email}:`, error);
      throw error;
    }
  },

  /**
   * Asigna (o cambia) la compañía a la que pertenece el usuario.
   * Funciona si la relación User → Company es many-to-one.
   * @param userId id numérico del usuario
   * @param companyId id numérico de la compañía
   */
  async assignCompany(userId: number, companyId: number): Promise<void> {
    console.log(`Asignando compañía ${companyId} al usuario ${userId}`);
    
    const res = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: companyId }),
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error en respuesta de asignación: ${errText}`);
      throw new Error(`Error asignando compañía: ${JSON.stringify({ data: null, error: { status: res.status, name: "Error", message: errText } })}`);
    }
    
    console.log(`Compañía ${companyId} asignada correctamente al usuario ${userId}`);
  },
};
