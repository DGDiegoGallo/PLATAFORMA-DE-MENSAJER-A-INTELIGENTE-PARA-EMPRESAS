/**
 * Interface para representar un campo editable en un formulario de perfil
 */
export interface EditableField {
  value: string;
  isEditing: boolean;
}

/**
 * Interface para los datos de perfil con campos editables
 */
export interface EditableProfileData {
  username: EditableField;
  fullName: EditableField;
  phone: EditableField;
  email: EditableField;
  idType: EditableField;
  idNumber: EditableField;
  birthDate: EditableField;
  address: EditableField;
  password: EditableField;
  [key: string]: EditableField;
}

/**
 * Interface para los datos básicos de perfil de usuario
 */
export interface UserProfileData {
  username: string;
  fullName: string;
  phone: string;
  idType: string;
  idNumber: string;
  email: string;
  address: string;
  birthDate: string;
}

/**
 * Interface para los datos específicos de perfil de agente
 */
export interface AgentProfileData extends UserProfileData {
  role: string;
  department?: string;
  skills?: string[];
  status?: 'active' | 'inactive' | 'away';
}

/**
 * Interface para los datos específicos de perfil de empresa
 */
export interface CompanyProfileData extends UserProfileData {
  companyName: string;
  industry: string;
  taxId: string;
  website?: string;
  employees?: number;
}

/**
 * Props para componentes de formulario de perfil
 */
export interface ProfileFormProps {
  initialData: UserProfileData;
  onSave: (data: UserProfileData) => void;
  onCancel: () => void;
}
