import { useCompany } from "@/contexts/CompanyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function CompanySelector() {
  const { selectedCompany, setSelectedCompany, companies, isAdmin } = useCompany();

  // Si no es admin, no mostrar selector (solo su empresa)
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{selectedCompany?.name || 'No company'}</span>
      </div>
    );
  }

  // Si no hay empresas disponibles, mostrar mensaje
  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No companies available</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedCompany?.id || undefined}
      onValueChange={(value) => {
        console.log('CompanySelector: Selected value:', value);
        const company = companies.find((c) => c.id === value);
        console.log('CompanySelector: Found company:', company);
        if (company) {
          setSelectedCompany(company);
        }
      }}
    >
      <SelectTrigger className="w-[220px] bg-background">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select company">
            {selectedCompany?.name || 'Select company'}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex flex-col">
              <span className="font-medium">{company.name}</span>
              {company.industry && (
                <span className="text-xs text-muted-foreground">
                  {company.industry} • {company.plan}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
