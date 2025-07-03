export interface LoginCredentials {
  email: string;
  password?: string; // opcional para demo sin contraseña
  rememberMe?: boolean;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  role?: Role; // Strapi default role object (unused in demo)
  rol?: string; // Rol de texto personalizado (user, agent, company)
  phone?: string;
  fullName?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  birthDate?: string;
  documentoID?: string;
  nombre?: string;
  apellido?: string;
  company?: number | string | Record<string, unknown> | null;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
