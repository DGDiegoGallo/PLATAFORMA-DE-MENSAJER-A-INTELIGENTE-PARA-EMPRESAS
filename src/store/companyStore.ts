import { create } from 'zustand';

export interface CompanyState {
  companyName: string;
  setCompanyName: (name: string) => void;
  clearCompanyData: () => void;
}

// Global store for company information
const useCompanyStore = create<CompanyState>((set) => ({
  companyName: localStorage.getItem('companyName') ?? '',
  setCompanyName: (name: string) => {
    localStorage.setItem('companyName', name);
    set({ companyName: name });
  },
  clearCompanyData: () => {
    localStorage.removeItem('companyName');
    set({ companyName: '' });
  },
}));

export default useCompanyStore;
