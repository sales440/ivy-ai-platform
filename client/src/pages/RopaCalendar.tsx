import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Mail,
  Phone,
  Share2,
  Target,
  GripVertical,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { APP_TITLE } from "@/const";

// Kanban column types
type KanbanColumn = "scheduled" | "in_progress" | "review" | "completed" | "paused";

interface KanbanCard {
  id: number;
  name: string;
  type: "email" | "phone" | "social_media" | "multi_channel";
  status: string;
  company: string;
  targetAudience: string;
  scheduledDate?: string;
  color: string;
}

// Column configuration
const columns: { id: KanbanColumn; title: string; color: string }[] = [
  { id: "scheduled", title: "Programadas", color: "bg-blue-500" },
  { id: "in_progress", title: "En Progreso", color: "bg-yellow-500" },
  { id: "review", title: "En Revisión", color: "bg-purple-500" },
  { id: "completed", title: "Completadas", color: "bg-green-500" },
  { id: "paused", title: "Pausadas", color: "bg-orange-500" },
];

// Mock companies
const mockCompanies = [
  { id: 1, name: "FAGOR Automation", color: "#06b6d4" },
  { id: 2, name: "EPM Construcciones", color: "#14b8a6" },
  { id: 3, name: "TechStart Inc", color: "#fb923c" },
  { id: 4, name: "Global Services LLC", color: "#a855f7" },
];

// Color palette for companies
const COMPANY_COLORS = ["#06b6d4", "#14b8a6", "#fb923c", "#a855f7", "#ec4899", "#22c55e", "#eab308", "#ef4444"];

// Map campaign status to kanban column
const statusToColumn = (status: string): KanbanColumn => {
  switch (status) {
    case "draft": return "scheduled";
    case "active": return "in_progress";
    case "paused": return "paused";
    case "completed": return "completed";
    default: return "scheduled";
  }
};

// Get color for company
const getCompanyColor = (companyName: string, companies: any[]): string => {
  const company = companies.find(c => c.name === companyName);
  if (company) {
    const index = companies.indexOf(company);
    return COMPANY_COLORS[index % COMPANY_COLORS.length];
  }
  return COMPANY_COLORS[0];
};

export default function RopaCalendar() {
  const [, setLocation] = useLocation();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [localCompanies, setLocalCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // January 2026
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "email" as "email" | "phone" | "social_media" | "multi_channel",
    company: "",
    targetAudience: "",
    scheduledDate: "",
    isNewCompany: false,
    newCompanyName: "",
  });

  // Get campaigns from API
  const { data: campaigns } = trpc.campaigns.getCampaigns.useQuery();

  // Load campaigns and companies from localStorage (synced with Dashboard)
  useEffect(() => {
    const loadFromLocalStorage = () => {
      // Load companies
      const savedCompanies = localStorage.getItem('ropaCompanies');
      let companies: any[] = [];
      if (savedCompanies) {
        try {
          companies = JSON.parse(savedCompanies);
          setLocalCompanies(companies);
        } catch (e) {
          console.error('Error parsing companies:', e);
        }
      }

      // Load campaigns and convert to KanbanCards
      const savedCampaigns = localStorage.getItem('ropaCampaigns');
      if (savedCampaigns) {
        try {
          const campaignsData = JSON.parse(savedCampaigns);
          const kanbanCards: KanbanCard[] = campaignsData.map((campaign: any) => {
            const companyName = companies.find((c: any) => c.id === campaign.companyId)?.name || 'Sin Empresa';
            return {
              id: campaign.id,
              name: campaign.name,
              type: campaign.type as "email" | "phone" | "social_media" | "multi_channel",
              status: statusToColumn(campaign.status),
              company: companyName,
              targetAudience: campaign.description || 'Sin descripción',
              scheduledDate: campaign.createdAt ? new Date(campaign.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              color: getCompanyColor(companyName, companies),
            };
          });
          setCards(kanbanCards);
        } catch (e) {
          console.error('Error parsing campaigns:', e);
        }
      }
    };

    loadFromLocalStorage();

    // Listen for storage changes from other tabs/components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ropaCampaigns' || e.key === 'ropaCompanies') {
        loadFromLocalStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes every 2 seconds (for same-tab updates)
    const interval = setInterval(loadFromLocalStorage, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Filter cards by company
  const filteredCards = selectedCompany === "all"
    ? cards
    : cards.filter((card) => card.company === selectedCompany);

  // Get cards for a specific column
  const getColumnCards = (columnId: KanbanColumn) => {
    return filteredCards.filter((card) => card.status === columnId);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, columnId: KanbanColumn) => {
    e.preventDefault();
    if (draggedCard) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === draggedCard.id ? { ...card, status: columnId } : card
        )
      );
      setDraggedCard(null);
    }
  };

  // Get campaign type icon
  const getCampaignIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "social_media":
        return <Share2 className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Format month name
  const monthName = currentMonth.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/50 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/ropa-v2")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al Dashboard
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Calendario de Campañas</h1>
                <p className="text-xs text-slate-400">Vista Kanban - Drag & Drop</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[140px] text-center capitalize">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-slate-800 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Company Filter */}
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-56 bg-slate-900/50 border-slate-700">
                <Filter className="w-4 h-4 mr-2 text-cyan-400" />
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {(localCompanies.length > 0 ? localCompanies : mockCompanies).map((company) => (
                  <SelectItem key={company.id} value={company.name}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: company.color }}
                      />
                      {company.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              onClick={() => setShowNewCampaignDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="p-6 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-5 gap-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getColumnCards(column.id).length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-slate-900/30 rounded-xl border border-slate-800/50 p-3 min-h-[600px]">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-3">
                    {getColumnCards(column.id).map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card)}
                        className={`bg-slate-900/80 rounded-xl border border-slate-700/50 p-4 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all duration-200 ${
                          draggedCard?.id === card.id ? "opacity-50 scale-95" : ""
                        }`}
                        style={{ borderLeftColor: card.color, borderLeftWidth: "4px" }}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${card.color}20` }}
                            >
                              {getCampaignIcon(card.type)}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm line-clamp-1">{card.name}</h4>
                              <p className="text-xs text-slate-400">{card.company}</p>
                            </div>
                          </div>
                          <GripVertical className="w-4 h-4 text-slate-600" />
                        </div>

                        {/* Card Content */}
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                          {card.targetAudience}
                        </p>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: `${card.color}50`,
                              color: card.color,
                            }}
                          >
                            {card.type === "email" && "Email"}
                            {card.type === "phone" && "Teléfono"}
                            {card.type === "social_media" && "Social"}
                            {card.type === "multi_channel" && "Multi-Canal"}
                          </Badge>
                          {card.scheduledDate && (
                            <span className="text-xs text-slate-500">
                              {new Date(card.scheduledDate).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty State */}
                    {getColumnCards(column.id).length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">Sin campañas</p>
                        <p className="text-xs mt-1">Arrastra aquí para mover</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <span className="text-xs text-slate-500">Empresas:</span>
          {(localCompanies.length > 0 ? localCompanies : mockCompanies).map((company, index) => (
            <div key={company.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: company.color || COMPANY_COLORS[index % COMPANY_COLORS.length] }}
              />
              <span className="text-xs text-slate-400">{company.name}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-black/50 backdrop-blur border-t border-slate-800/50 flex items-center justify-center text-xs text-slate-500">
        <span>ROPA Calendar • Drag & Drop para reorganizar campañas</span>
        <span className="mx-4">•</span>
        <span>{filteredCards.length} campañas visibles</span>
      </footer>

      {/* Nueva Campaña Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Nueva Campaña
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Crea una nueva campaña para una empresa existente o agrega un nuevo cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name" className="text-slate-300">Nombre de la Campaña</Label>
              <Input
                id="campaign-name"
                placeholder="Ej: Email Marketing Q1 2026"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>

            {/* Campaign Type */}
            <div className="space-y-2">
              <Label className="text-slate-300">Tipo de Campaña</Label>
              <Select
                value={newCampaign.type}
                onValueChange={(value: "email" | "phone" | "social_media" | "multi_channel") => 
                  setNewCampaign({ ...newCampaign, type: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="email"><Mail className="w-4 h-4 inline mr-2" />Email</SelectItem>
                  <SelectItem value="phone"><Phone className="w-4 h-4 inline mr-2" />Teléfono</SelectItem>
                  <SelectItem value="social_media"><Share2 className="w-4 h-4 inline mr-2" />Redes Sociales</SelectItem>
                  <SelectItem value="multi_channel"><Target className="w-4 h-4 inline mr-2" />Multi-Canal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Selection */}
            <div className="space-y-2">
              <Label className="text-slate-300">Empresa</Label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="new-company"
                  checked={newCampaign.isNewCompany}
                  onChange={(e) => setNewCampaign({ ...newCampaign, isNewCompany: e.target.checked, company: "" })}
                  className="rounded border-slate-600"
                />
                <Label htmlFor="new-company" className="text-sm text-slate-400 cursor-pointer">
                  Agregar nueva empresa (nuevo cliente)
                </Label>
              </div>
              
              {newCampaign.isNewCompany ? (
                <Input
                  placeholder="Nombre de la nueva empresa"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  value={newCampaign.newCompanyName}
                  onChange={(e) => setNewCampaign({ ...newCampaign, newCompanyName: e.target.value })}
                />
              ) : (
                <Select
                  value={newCampaign.company}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, company: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Selecciona una empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {(localCompanies.length > 0 ? localCompanies : mockCompanies).map((company) => (
                      <SelectItem key={company.id} value={company.name}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: company.color }} />
                          {company.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="target-audience" className="text-slate-300">Audiencia Objetivo</Label>
              <Input
                id="target-audience"
                placeholder="Ej: Directores de TI, CTOs"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                value={newCampaign.targetAudience}
                onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
              />
            </div>

            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label htmlFor="scheduled-date" className="text-slate-300">Fecha Programada</Label>
              <Input
                id="scheduled-date"
                type="date"
                className="bg-slate-800 border-slate-600 text-white"
                value={newCampaign.scheduledDate}
                onChange={(e) => setNewCampaign({ ...newCampaign, scheduledDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewCampaignDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              onClick={() => {
                const companyName = newCampaign.isNewCompany ? newCampaign.newCompanyName : newCampaign.company;
                if (!newCampaign.name || !companyName) {
                  toast.error("Por favor completa el nombre y la empresa");
                  return;
                }
                const newCard: KanbanCard = {
                  id: Date.now(),
                  name: newCampaign.name,
                  type: newCampaign.type,
                  status: "scheduled",
                  company: companyName,
                  targetAudience: newCampaign.targetAudience,
                  scheduledDate: newCampaign.scheduledDate,
                  color: newCampaign.isNewCompany ? "#22d3ee" : mockCompanies.find(c => c.name === companyName)?.color || "#22d3ee",
                };
                setCards([...cards, newCard]);
                setNewCampaign({ name: "", type: "email", company: "", targetAudience: "", scheduledDate: "", isNewCompany: false, newCompanyName: "" });
                setShowNewCampaignDialog(false);
                toast.success(`Campaña "${newCampaign.name}" creada exitosamente`);
              }}
            >
              Crear Campaña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
