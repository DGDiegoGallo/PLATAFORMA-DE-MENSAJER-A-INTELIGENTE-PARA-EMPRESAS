import { useState, useEffect } from 'react';
import type { Role, User, LoginCredentials } from '../types/auth.types';
import type { RegisterCredentials } from '../types/register.types';
import authService from '../services/auth.service';

// User que puede venir directamente de Strapi
interface RawUser extends Omit<Partial<User>, 'role'> {
  role?: { name?: string } | Role | null;
  [key: string]: unknown;
}

/**
 * Sanitiza un usuario crudo de Strapi al formato esperado por la aplicación
 */
const sanitizeUser = (rawUser: RawUser | null): User | null => {
  if (!rawUser) return null;
  
  // Extraer propiedades relevantes del usuario crudo
  const { role, ...userData } = rawUser;
  
  // Crear un nuevo objeto usuario con los tipos correctos
  const user: Partial<User> = {
    ...userData,
    rol: rawUser.rol || (typeof role === 'object' && role?.name === 'Authenticated' ? 'user' : 'guest')
  };
  
  return user as User;
};

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedRaw = authService.getUser();
      return storedRaw ? sanitizeUser(storedRaw as RawUser) : null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  // Escuchar cambios en localStorage para sincronizar el estado
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user') {
        try {
          if (event.newValue) {
            // Si hay un nuevo valor, actualizar el estado del usuario
            const newUser = JSON.parse(event.newValue);
            setUser(sanitizeUser(newUser as RawUser));
            setIsAuthenticated(true);
          } else {
            // Si se eliminó el valor, limpiar el estado
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error parsing user from localStorage change:', error);
        }
      } else if (event.key === 'token') {
        setIsAuthenticated(!!event.newValue);
      }
    };

    // También verificamos periódicamente si los datos han cambiado
    // (útil cuando el cambio proviene de la misma ventana)
    const checkLocalStorage = () => {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getUser();
        
        // Comparar con el estado actual para evitar ciclos de renderizado
        const currentUserStr = user ? JSON.stringify(user) : null;
        const storedUserStr = storedUser ? JSON.stringify(storedUser) : null;
        
        if (!!storedToken !== isAuthenticated) {
          setIsAuthenticated(!!storedToken);
        }
        
        if (storedUserStr !== currentUserStr) {
          setUser(storedUser ? sanitizeUser(storedUser as RawUser) : null);
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    };

    // Configurar los listeners
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar cambios cada segundo
    const interval = setInterval(checkLocalStorage, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user, isAuthenticated]);

  /**
   * Inicia sesión con las credenciales proporcionadas
   */
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      const sanitized = sanitizeUser(response.user as RawUser);
      if (sanitized) {
        authService.saveAuth(response.jwt, sanitized as User);
        setUser(sanitized);
      }
      setIsAuthenticated(true);
      
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cierra la sesión del usuario actual
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Registra un nuevo usuario
   */
  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Importar el store de la compañía para limpiar los datos
      // Nota: Importación dinámica para evitar dependencias circulares
      const companyStore = (await import('../../../store/companyStore')).default;
      // Limpiar los datos de la compañía en el store
      companyStore.getState().clearCompanyData();
      
      const response = await authService.register(credentials);
      
      const sanitized = sanitizeUser(response.user as RawUser);
      if (sanitized) {
        authService.saveAuth(response.jwt, sanitized as User);
        setUser(sanitized);
      }
      setIsAuthenticated(true);
      
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register
  };
};

export default useAuth;
