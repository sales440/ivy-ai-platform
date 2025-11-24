import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Play, Pause, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

/**
 * Multi-Channel Campaigns Page
 * Manage and orchestrate email + LinkedIn nurturing workflows
 */
export default function MultiChannelCampaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    targetAudience: "awareness" as "awareness" | "consideration" | "decision",
  });

  // Fetch campaigns
  const { data: campaigns, isLoading, refetch } = trpc.multiChannelCampaigns.list.useQuery();

  // Create campaign mutation
  const createCampaignMutation = trpc.multiChannelCampaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaña creada exitosamente");
      setIsCreateDialogOpen(false);
      setNewCampaign({ name: "", description: "", targetAudience: "awareness" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Error al crear campaña: ${error.message}`);
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.multiChannelCampaigns.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreateCampaign = () => {
    if (!newCampaign.name) {
      toast.error("El nombre de la campaña es requerido");
      return;
    }

    // Create campaign with predefined steps
    const steps = [
      {
        stepNumber: 1,
        delayDays: 0,
        channelType: "email" as const,
        actionType: "send_email",
        actionConfig: {
          emailSequenceId: 1, // Welcome sequence
        },
      },
      {
        stepNumber: 2,
        delayDays: 2,
        channelType: "linkedin" as const,
        actionType: "generate_linkedin_post",
        actionConfig: {
          linkedInPostType: "thought_leadership",
        },
      },
      {
        stepNumber: 3,
        delayDays: 3,
        channelType: "email" as const,
        actionType: "send_email",
        actionConfig: {
          emailSequenceId: 2, // Demo sequence
        },
      },
      {
        stepNumber: 4,
        delayDays: 5,
        channelType: "linkedin" as const,
        actionType: "generate_linkedin_post",
        actionConfig: {
          linkedInPostType: "case_study",
        },
      },
      {
        stepNumber: 5,
        delayDays: 7,
        channelType: "email" as const,
        actionType: "send_email",
        actionConfig: {
          emailSequenceId: 3, // Case study sequence
        },
      },
    ];

    createCampaignMutation.mutate({
      ...newCampaign,
      steps,
    });
  };

  const toggleCampaignStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Campañas Multi-Canal</h1>
            <p className="text-muted-foreground mt-1">
              Orquesta workflows automáticos que combinan email y LinkedIn
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Campaña
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Campaña Multi-Canal</DialogTitle>
                <DialogDescription>
                  Define una campaña que combine email y LinkedIn posts automáticamente
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Campaña</Label>
                  <Input
                    id="name"
                    value={newCampaign.name}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, name: e.target.value })
                    }
                    placeholder="Ej: Nurturing Q1 2025"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newCampaign.description}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, description: e.target.value })
                    }
                    placeholder="Describe el objetivo de esta campaña..."
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience">Audiencia Objetivo</Label>
                  <Select
                    value={newCampaign.targetAudience}
                    onValueChange={(value: any) =>
                      setNewCampaign({ ...newCampaign, targetAudience: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Awareness (Top of Funnel)</SelectItem>
                      <SelectItem value="consideration">Consideration (Middle of Funnel)</SelectItem>
                      <SelectItem value="decision">Decision (Bottom of Funnel)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">Flujo de la Campaña:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Día 0: Email de bienvenida</li>
                    <li>• Día 2: Post de LinkedIn (Thought Leadership)</li>
                    <li>• Día 3: Email de demo</li>
                    <li>• Día 5: Post de LinkedIn (Case Study)</li>
                    <li>• Día 7: Email de caso de estudio</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateCampaign} disabled={createCampaignMutation.isPending}>
                  {createCampaignMutation.isPending ? "Creando..." : "Crear Campaña"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaigns List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando campañas...</p>
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay campañas creadas</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera campaña multi-canal para automatizar nurturing
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Campaña
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onToggleStatus={toggleCampaignStatus}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Campaign Card Component
 */
function CampaignCard({
  campaign,
  onToggleStatus,
}: {
  campaign: any;
  onToggleStatus: (id: number, currentStatus: string) => void;
}) {
  const { data: stats } = trpc.multiChannelCampaigns.getStats.useQuery({
    campaignId: campaign.id,
  });

  const statusColors = {
    draft: "bg-gray-500",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
  };

  const statusIcons = {
    draft: AlertCircle,
    active: Play,
    paused: Pause,
    completed: CheckCircle2,
  };

  const StatusIcon = statusIcons[campaign.status as keyof typeof statusIcons] || AlertCircle;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {campaign.name}
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${
                  statusColors[campaign.status as keyof typeof statusColors]
                }`}
              >
                <StatusIcon className="h-3 w-3" />
                {campaign.status}
              </span>
            </CardTitle>
            <CardDescription>{campaign.description || "Sin descripción"}</CardDescription>
          </div>

          <div className="flex gap-2">
            {campaign.status === "draft" && (
              <Button
                size="sm"
                onClick={() => onToggleStatus(campaign.id, campaign.status)}
              >
                <Play className="mr-2 h-4 w-4" />
                Activar
              </Button>
            )}
            {campaign.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleStatus(campaign.id, campaign.status)}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button
                size="sm"
                onClick={() => onToggleStatus(campaign.id, campaign.status)}
              >
                <Play className="mr-2 h-4 w-4" />
                Reanudar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {stats && (
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-muted-foreground">En Progreso</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-xs text-muted-foreground">Fallidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Tasa de Éxito</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
