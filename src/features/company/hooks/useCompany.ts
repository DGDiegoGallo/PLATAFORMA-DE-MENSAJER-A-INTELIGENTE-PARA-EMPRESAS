import { useEffect, useState } from 'react';
import { CompanyResponse, companyService } from '../services/company.service';
import { useAuthContext } from '../../../contexts/AuthContext';
import API_URL from '../../../config/api';

interface UseCompanyReturn {
  company: CompanyResponse | null;
  loading: boolean;
  error: string | null;
}

// Define member interface
interface CompanyMember {
  id?: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Hook que recupera la compañía asociada al usuario autenticado.
 * Encapsula la lógica de llamada al servicio y caching simple.
 */
export const useCompany = (): UseCompanyReturn => {
  const { user } = useAuthContext();

  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.id) return; // sin usuario no buscamos

      // Si ya está cacheado en memoria evitamos nueva llamada
      if (company) return;

      setLoading(true);
      try {
        const result = await companyService.getCompanyByUser(user.id);
        setCompany(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error obteniendo compañía';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { company, loading, error };
};

/**
 * Hook que recupera la compañía asociada a un agente.
 * Busca la compañía relacionada al usuario agente en el campo company.
 */
export const useCompanyByAgent = (): UseCompanyReturn => {
  const { user } = useAuthContext();
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyForAgent = async () => {
      // Comprobar que el usuario esté autenticado y sea un agente
      if (!user?.id || !user?.email) return;
      
      // Verificar si es rol agente (puede estar en rol o role.name)
      const isAgent = user.rol === 'agente' || 
                     user.role?.name?.toLowerCase() === 'agente' ||
                     user.rol === 'empleado' || 
                     user.role?.name?.toLowerCase() === 'empleado';
                     
      if (!isAgent) return;

      setLoading(true);
      try {
        console.log('Buscando compañía para el agente/empleado:', user.email);
        
        // Intento directo utilizando la información almacenada en user.company
        if (user.company && typeof user.company !== 'undefined') {
          try {
            let url: string | null = null;
            let debugId: string = '';

            // user.company puede ser: (1) string con id, (2) string con documentId, (3) objeto completo de compañía
            if (typeof user.company === 'string') {
              // Siempre tratamos la string como documentId
              debugId = user.company;
              url = `${API_URL}/api/companies?filters[documentId][$eq]=${user.company}&populate=*`;
            } else if (typeof user.company === 'object') {
              const compObj = user.company as Record<string, unknown>;
              if (compObj.documentId) {
                debugId = compObj.documentId as string;
                url = `${API_URL}/api/companies?filters[documentId][$eq]=${compObj.documentId}&populate=*`;
              } else if (compObj.id) {
                // Fallback poco probable: convertir id numérico a string y usar como documentId
                debugId = String(compObj.id);
                url = `${API_URL}/api/companies?filters[documentId][$eq]=${compObj.id}&populate=*`;
              }
            }

            if (url) {
              console.log(`El usuario tiene una compañía asignada con identificador: ${debugId}`);
              const companyResponse = await fetch(url);
              if (companyResponse.ok) {
                const companyData = await companyResponse.json();
                // La respuesta puede ser single {data:{}} o colección {data:[...]}
                const raw = Array.isArray(companyData.data) ? companyData.data[0] : companyData.data;
                if (raw && (raw.attributes || raw.name)) {
                  const result = {
                    id: raw.id,
                    ...(raw.attributes || raw)
                  } as CompanyResponse;
                  console.log('Compañía encontrada por relación directa:', result.name);
                  setCompany(result);
                  return;
                } else {
                  console.log('No se encontró compañía con ese documentId');
                }
              }
            }
          } catch (err) {
            console.error('Error obteniendo compañía usando user.company:', err);
          }
        }
        
        // Si no encontramos por relación directa, buscamos dentro de los miembros de todas las compañías
        console.log("Buscando compañía por coincidencia en miembros...");
        const response = await fetch(`${API_URL}/api/companies?populate=*`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener compañías: ${response.statusText}`);
        }
        
        const data = await response.json();
        const companies = data.data || [];
        
        console.log(`Se encontraron ${companies.length} compañías para buscar`);
        
        // Buscar la compañía que tiene este usuario como miembro
        let found = false;
        for (const companyData of companies) {
          const companyAttrs = companyData.attributes || {};
          const members = companyAttrs.members || [];
          
          console.log(`Compañía: ${companyAttrs.name} - Miembros: ${members.length}`);

          const isMember = members.some((member: CompanyMember) => {
            const isMatch = member.email.toLowerCase() === user.email.toLowerCase() && 
                          (member.role.toLowerCase() === 'agente' || member.role.toLowerCase() === 'empleado');
            if (isMatch) {
              console.log('¡Se encontró el agente/empleado en la compañía!', member);
            }
            return isMatch;
          });

          if (isMember) {
            console.log(`El usuario pertenece a la compañía: ${companyAttrs.name}`);
            const result = {
              id: companyData.id,
              ...companyAttrs
            } as CompanyResponse;
            setCompany(result);
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.log('No se encontró una compañía para este usuario');
          setError('No se encontró la compañía asociada a este usuario');
        }
      } catch (err) {
        console.error('Error buscando compañía para agente/empleado:', err);
        const message = err instanceof Error ? err.message : 'Error obteniendo compañía';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyForAgent();
  }, [user?.id, user?.email, user?.rol, user?.company]);

  return { company, loading, error };
};

export default useCompany;
