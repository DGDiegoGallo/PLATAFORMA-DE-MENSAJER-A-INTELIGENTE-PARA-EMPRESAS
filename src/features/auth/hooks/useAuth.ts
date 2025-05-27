import { useState } from 'react';
import { LoginCredentials, User } from '../types/auth.types';
import { RegisterCredentials } from '../types/register.types';
import authService from '../services/auth.service';

/**
 * Hook personalizado para manejar la autenticación
 */
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = authService.getUser();
    return storedUser;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  /**
   * Inicia sesión con las credenciales proporcionadas
   */
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      
      authService.saveAuth(
        response.jwt, 
        response.user, 
        credentials.rememberMe || false
      );
      
      setUser(response.user);
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
      const response = await authService.register(credentials);
      
      authService.saveAuth(
        response.jwt, 
        response.user, 
        false
      );
      
      setUser(response.user);
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
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register
  };
};

export default useAuth;
