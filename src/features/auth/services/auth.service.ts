import { LoginCredentials, AuthResponse, User } from '../types/auth.types';
import { RegisterCredentials } from '../types/register.types';
import API_URL from '../../../config/api';

// URL base de la API de Strapi configurada globalmente
// Si quieres usar respuestas mock define VITE_USE_MOCK="true" en tu .env
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Servicio para manejar la autenticación con Strapi
 */
export const authService = {
  /**
   * Inicia sesión con las credenciales proporcionadas
   * @param credentials Credenciales de inicio de sesión
   * @returns Respuesta de autenticación con token y datos del usuario
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // En producción, esto se conectaría a la API real de Strapi
      // Por ahora, simulamos una respuesta exitosa para desarrollo frontend
      
      if (IS_MOCK) {
        // Simulación de respuesta para desarrollo
        return await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              jwt: 'mock-jwt-token-for-development',
              user: {
                id: 1,
                username: credentials.email.split('@')[0],
                email: credentials.email,
                provider: 'local',
                confirmed: true,
                blocked: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                role: {
                  id: 1,
                  name: 'Authenticated',
                  description: 'Default role for authenticated users',
                  type: 'authenticated'
                }
              }
            });
          }, 800); // Simular delay de red
        });
      }
      
      // --- DEMO LOGIN (sin contraseña) --- POR IDENTIFIER (correo/usuario) ---
      const identifier = credentials.email.trim();
      const encoded = encodeURIComponent(identifier);
      const res = await fetch(`${API_URL}/api/users?filters[$or][0][email][$eq]=${encoded}&filters[$or][1][username][$eq]=${encoded}&populate=*`);
      if (!res.ok) {
        throw new Error('No se pudo obtener el usuario');
      }
      const json = await res.json();
      let userData: any = null;
      if (Array.isArray(json) && json.length > 0) {
        userData = json[0];
      } else if (Array.isArray(json.data) && json.data.length > 0) {
        userData = { id: json.data[0].id, ...json.data[0].attributes };
      }
      if (!userData) throw new Error('Usuario no encontrado');
      return { jwt: '', user: userData } as AuthResponse;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): void {
    // Limpiar todo el localStorage y sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Eliminar todas las cookies del dominio
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    }

    // Disparar un evento personalizado para notificar otros componentes
    const logoutEvent = new Event('app:logout');
    window.dispatchEvent(logoutEvent);
  },

  /**
   * Guarda la información de autenticación en localStorage
   * @param token Token JWT
   * @param user Datos del usuario
   */
  saveAuth(token: string, user: User): void {
    // Limpiar datos específicos de autenticación antes de guardar nuevos datos
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('companyName');
    
    // Guardar los nuevos datos de autenticación
    // Si no hay token, guardar uno vacío para modo demo
    localStorage.setItem('token', token || '');
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Obtiene el token de autenticación almacenado
   * @returns Token JWT o null si no hay sesión
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  /**
   * Obtiene los datos del usuario almacenados
   * @returns Datos del usuario o null si no hay sesión
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns true si hay un token válido o un usuario válido en localStorage (modo demo)
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    
    // Si hay token, está autenticado
    if (token && token !== '') {
      return true;
    }
    
    // Si no hay token pero hay usuario válido (modo demo), también está autenticado
    if (user && user.id) {
      return true;
    }
    
    return false;
  },

  /**
   * Registra un nuevo usuario
   * @param credentials Datos de registro del usuario
   * @returns Respuesta de autenticación con token y datos del usuario
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // Limpiar localStorage y sessionStorage antes de registrar un nuevo usuario
      // para evitar que datos antiguos persistan
      localStorage.clear();
      sessionStorage.clear();
      
      // En producción, esto se conectaría a la API real de Strapi
      // Por ahora, simulamos una respuesta exitosa para desarrollo frontend
      
      if (IS_MOCK) {
        // Simulación de respuesta para desarrollo
        return await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              jwt: 'mock-jwt-token-for-development',
              user: {
                id: 1,
                username: credentials.username,
                email: credentials.email,
                phone: credentials.phone,
                fullName: credentials.fullName,
                idType: credentials.idType,
                idNumber: credentials.idNumber,
                address: credentials.address,
                birthDate: credentials.birthDate,
                provider: 'local',
                confirmed: true,
                blocked: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                role: {
                  id: 1,
                  name: 'Authenticated',
                  description: 'Default role for authenticated users',
                  type: 'authenticated'
                }
              }
            });
          }, 800); // Simular delay de red
        });
      }
      
      // Código para producción que se conectaría a Strapi
      const response = await fetch(`${API_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
          telefono: credentials.phone || '',
          rol: 'cliente',
          direccion: credentials.address || '',
          documentoID: credentials.idNumber || '',
          fechaNacimiento: credentials.birthDate || null,
          nombre: credentials.fullName.split(' ')[0] || credentials.fullName,
          apellido: credentials.fullName.split(' ').slice(1).join(' ') || ''
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || 'Error de registro');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }
};

export default authService;
