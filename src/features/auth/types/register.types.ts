export interface RegisterCredentials {
  username: string;
  email: string;
  phone: string;
  fullName: string;
  idType: string;
  idNumber: string;
  address: string;
  birthDate: string; // ISO format (YYYY-MM-DD) or locale string
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}
