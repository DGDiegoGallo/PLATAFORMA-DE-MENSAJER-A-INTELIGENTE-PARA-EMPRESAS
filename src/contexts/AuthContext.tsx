import React, { createContext, useContext } from 'react';
import useAuth from '../features/auth/hooks/useAuth';

// Import User type from auth types
import { User } from '../features/auth/types/auth.types';

// Define the shape of the context using the return type of useAuth
export type AuthContextType = ReturnType<typeof useAuth> & {
  user: User | null;
};

type ExtendedAuthContextType = AuthContextType & {
  isUser: boolean;
  isAgent: boolean;
  isCompany: boolean;
};

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const rol = auth.user?.rol ?? (auth.user?.role?.name === 'Authenticated' ? 'user' : auth.user?.role?.name ?? 'guest');
  const value: ExtendedAuthContextType = {
    ...auth,
    isUser: rol === 'user',
    isAgent: rol === 'agent',
    isCompany: rol === 'company'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
