import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  plan: "starter" | "professional" | "enterprise";
  logo?: string;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  company: Company | null; // Alias for backward compatibility
  setSelectedCompany: (company: Company) => void;
  companies: Company[];
  isAdmin: boolean; // Si el usuario puede ver todas las empresas
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Use companies.listActive which shows all active companies to all users
  const { data: companiesData, isLoading } = trpc.companies.listActive.useQuery();
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Determinar si el usuario es admin (puede ver todas las empresas)
  const isAdmin = user?.role === "admin";

  // Convertir companies de la DB al formato del contexto
  // listActive returns array directly, not wrapped in {companies: []}
  const companies: Company[] = (companiesData || []).map((c: any) => ({
    id: c.id.toString(),
    name: c.name,
    slug: c.slug,
    industry: c.industry || undefined,
    plan: c.plan,
    logo: c.logo || undefined,
  }));

  // Seleccionar empresa inicial cuando se cargan los datos
  useEffect(() => {
    if (!selectedCompany && companies.length > 0) {
      // Si el usuario tiene companyId asignado, seleccionar esa empresa
      if (user?.companyId) {
        const userCompany = companies.find(c => c.id === user.companyId?.toString());
        if (userCompany) {
          setSelectedCompany(userCompany);
          return;
        }
      }
      // Si no, seleccionar la primera empresa disponible
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany, user]);

  // Mostrar loading mientras se cargan las empresas
  if (isLoading) {
    return null;
  }

  return (
    <CompanyContext.Provider
      value={{
        selectedCompany,
        company: selectedCompany, // Alias for backward compatibility
        setSelectedCompany,
        companies,
        isAdmin,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

/**
 * Helper function to get companyId as number
 * Handles the conversion from string to number safely
 * Returns 0 if company is null or conversion fails
 */
export function getCompanyId(company: Company | null | undefined): number {
  if (!company || !company.id) return 0;
  const id = Number(company.id);
  return isNaN(id) ? 0 : id;
}
