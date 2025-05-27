import { LoginCredentials, AuthResponse, User } from '../types/auth.types';
import { RegisterCredentials } from '../types/register.types';

// URL base de la API de Strapi (se configurará más adelante)
const API_URL = import.meta.env.VITE_STRAPI_API_URL || 'http://localhost:1337';

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
      
      if (import.meta.env.DEV) {
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
      
      // Código para producción que se conectaría a Strapi
      const response = await fetch(`${API_URL}/api/auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: credentials.email,
          password: credentials.password,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || 'Error de autenticación');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario actual
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Guarda la información de autenticación en localStorage
   * @param token Token JWT
   * @param user Datos del usuario
   * @param rememberMe Si se debe recordar al usuario
   */
  saveAuth(token: string, user: User, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
  },

  /**
   * Obtiene el token de autenticación almacenado
   * @returns Token JWT o null si no hay sesión
   */
  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  /**
   * Obtiene los datos del usuario almacenados
   * @returns Datos del usuario o null si no hay sesión
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verifica si el usuario está autenticado
   * @returns true si hay un token válido
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Registra un nuevo usuario
   * @param credentials Datos de registro del usuario
   * @returns Respuesta de autenticación con token y datos del usuario
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      // En producción, esto se conectaría a la API real de Strapi
      // Por ahora, simulamos una respuesta exitosa para desarrollo frontend
      
      if (import.meta.env.DEV) {
        // Simulación de respuesta para desarrollo
        return await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              jwt: 'mock-jwt-token-for-development',
              user: {
                id: 1,
                username: credentials.username,
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
