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
   * Busca usuarios por nombre y apellido (para sugerencias)
   * @param firstName Nombre a buscar
   * @param lastName Apellido a buscar
   */
  async getUsersByName(firstName: string, lastName: string): Promise<User[]> {
    try {
      // Buscar usuarios que tengan nombres similares
      const res = await fetch(`${API_URL}/api/users?pagination[limit]=10`);
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error buscando usuarios: ${err}`);
      }
      
      const json = await res.json();
      let users: User[] = [];
      
      if (Array.isArray(json)) {
        users = json;
      } else if (Array.isArray(json.data)) {
        users = json.data.map((item: { id: number; attributes: Record<string, unknown> }) => ({ id: item.id, ...item.attributes }));
      }
      
      // Filtrar usuarios que tengan nombre y apellido definidos
      const filteredUsers = users.filter(user => 
        user.nombre && user.apellido && 
        user.nombre.trim() !== '' && user.apellido.trim() !== ''
      );
      
      // Calcular similitud y ordenar por relevancia
      const normalizeString = (str: string) => str.toLowerCase().trim();
      const targetFirstName = normalizeString(firstName);
      const targetLastName = normalizeString(lastName);
      
      const usersWithSimilarity = filteredUsers.map(user => {
        const userFirstName = normalizeString(user.nombre || '');
        const userLastName = normalizeString(user.apellido || '');
        
        // Calcular similitud usando distancia de Levenshtein simplificada
        const firstNameSimilarity = calculateSimilarity(targetFirstName, userFirstName);
        const lastNameSimilarity = calculateSimilarity(targetLastName, userLastName);
        const overallSimilarity = (firstNameSimilarity + lastNameSimilarity) / 2;
        
        return {
          user,
          similarity: overallSimilarity
        };
      });
      
      // Filtrar usuarios con similitud mayor a 0.2 (20%) y ordenar por similitud
      return usersWithSimilarity
        .filter(item => item.similarity > 0.2)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 4) // Máximo 4 sugerencias adicionales (ya que el email será la primera)
        .map(item => item.user); // Extraer solo el usuario
        
    } catch (error) {
      console.error(`Error al buscar usuarios por nombre ${firstName} ${lastName}:`, error);
      return [];
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

/**
 * Calcula la similitud entre dos strings usando una versión simplificada de Levenshtein
 * @param a Primer string
 * @param b Segundo string
 * @returns Número entre 0 y 1 indicando la similitud
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  // Coincidencia exacta al inicio
  if (a.startsWith(b) || b.startsWith(a)) return 0.9;
  
  // Contiene la otra palabra
  if (a.includes(b) || b.includes(a)) return 0.7;
  
  // Distancia de Levenshtein simplificada
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}
