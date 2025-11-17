import { createContext, useContext, useState, ReactNode } from "react";

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  plan: "starter" | "professional" | "enterprise";
  logo?: string;
}

// Empresas demo hardcodeadas (Fase 1)
const DEMO_COMPANIES: Company[] = [
  {
    id: "demo-1",
    name: "Demo Company",
    slug: "demo-company",
    industry: "Technology",
    plan: "professional",
  },
  {
    id: "acme-corp",
    name: "Acme Corporation",
    slug: "acme-corp",
    industry: "Manufacturing",
    plan: "enterprise",
  },
  {
    id: "startup-inc",
    name: "Startup Inc",
    slug: "startup-inc",
    industry: "SaaS",
    plan: "starter",
  },
  {
    id: "global-services",
    name: "Global Services LLC",
    slug: "global-services",
    industry: "Consulting",
    plan: "professional",
  },
];

interface CompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company) => void;
  companies: Company[];
  isAdmin: boolean; // Si el usuario puede ver todas las empresas
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  // Por defecto seleccionar la primera empresa
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(
    DEMO_COMPANIES[0]
  );

  // TODO: En Fase 3, obtener isAdmin del contexto de auth
  const isAdmin = true; // Por ahora todos son admin

  return (
    <CompanyContext.Provider
      value={{
        selectedCompany,
        setSelectedCompany,
        companies: DEMO_COMPANIES,
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
