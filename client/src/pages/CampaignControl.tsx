import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Settings,
  Mail,
  Linkedin,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Campaign Control Panel
 * Central dashboard for activating/pausing workflows and adjusting parameters
 */
export default function CampaignControl() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Fetch workflow stats
  const { data: workflowStats, refetch: refetchWorkflowStats } =
    trpc.workflows.getStats.useQuery();

  // Fetch email workflow stats
  const { data: emailStats, refetch: refetchEmailStats } =
    trpc.emailWorkflows.getStats.useQuery();

  // Fetch LinkedIn post stats
  const { data: linkedInStats, refetch: refetchLinkedInStats } =
    trpc.linkedInPosts.getStats.useQuery();

  // Fetch email sequences
  const { data: emailSequences } = trpc.emailWorkflows.listSequences.useQuery();

  // Trigger workflow mutation
  const triggerWorkflow = trpc.workflows.trigger.useMutation({
    onSuccess: () => {
      toast.success("Workflow ejecutado exitosamente");
      refetchWorkflowStats();
    },
    onError: (error) => {
      toast.error(`Error al ejecutar workflow: ${error.message}`);
    },
  });

  // Test email workflow mutation
  const testEmailWorkflow = trpc.emailWorkflows.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
        refetchEmailStats();
        setTestDialogOpen(false);
        setTestEmail("");
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Generate LinkedIn post mutation
  const generateLinkedInPost = trpc.linkedInPosts.generate.useMutation({
    onSuccess: () => {
      toast.success("Post de LinkedIn generado");
      refetchLinkedInStats();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleTriggerWorkflow = (workflowType: string) => {
    triggerWorkflow.mutate({
      workflowType: workflowType as any,
      params: {},
    });
  };

  const handleTestEmailWorkflow = () => {
    if (!testEmail) {
      toast.error("Por favor ingresa un email");
      return;
    }

    testEmailWorkflow.mutate({ leadEmail: testEmail });
  };

  const handleGenerateLinkedInPost = (
    postType: "thought_leadership" | "case_study" | "product_update" | "industry_insight" | "customer_success"
  ) => {
    generateLinkedInPost.mutate({
      postType,
      tone: "professional",
    });
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Campaign Control Center</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona y monitorea todos los workflows de marketing automatizados
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Workflows Totales
              </CardDescription>
              <CardTitle className="text-3xl">
                {(workflowStats?.total || 0) + (emailStats?.activeSequences || 0)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Completados (7d)
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {workflowStats?.completed || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                En Ejecución
              </CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {workflowStats?.running || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Fallidos (7d)
              </CardDescription>
              <CardTitle className="text-3xl text-red-600">
                {workflowStats?.failed || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email Nurturing
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn Content
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Email Nurturing Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Nurturing Campaigns</CardTitle>
                <CardDescription>
                  Gestiona secuencias automatizadas de email marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Emails Enviados (30d)</span>
                    <span className="text-2xl font-bold">{emailStats?.totalSent || 0}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Tasa de Éxito</span>
                    <span className="text-2xl font-bold text-green-600">
                      {emailStats?.successRate || "0.0"}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Leads Únicos</span>
                    <span className="text-2xl font-bold">{emailStats?.uniqueLeads || 0}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Secuencias Disponibles</h3>
                  {emailSequences && emailSequences.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {emailSequences.map((sequence) => (
                        <Card key={sequence.name}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{sequence.name}</CardTitle>
                              <Badge variant="outline">{sequence.stage}</Badge>
                            </div>
                            <CardDescription>{sequence.totalEmails} emails</CardDescription>
                          </CardHeader>
                          <CardFooter className="pt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTriggerWorkflow("email_nurturing")}
                              disabled={triggerWorkflow.isPending}
                            >
                              <Play className="h-3 w-3 mr-2" />
                              Ejecutar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay secuencias configuradas
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button onClick={() => setTestDialogOpen(true)} variant="secondary">
                  <Mail className="h-4 w-4 mr-2" />
                  Probar Secuencia
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* LinkedIn Content Tab */}
          <TabsContent value="linkedin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>LinkedIn Content Generation</CardTitle>
                <CardDescription>
                  Genera y programa posts para Juan Carlos Robledo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Total Posts</span>
                    <span className="text-2xl font-bold">{linkedInStats?.total || 0}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Pendientes</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {linkedInStats?.pending || 0}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Programados</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {linkedInStats?.scheduled || 0}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted-foreground">Publicados</span>
                    <span className="text-2xl font-bold text-green-600">
                      {linkedInStats?.published || 0}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Generar Nuevo Post</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { type: "thought_leadership" as const, label: "Liderazgo", icon: "💡" },
                      { type: "case_study" as const, label: "Caso de Estudio", icon: "📊" },
                      { type: "product_update" as const, label: "Producto", icon: "🚀" },
                      { type: "industry_insight" as const, label: "Insights", icon: "📈" },
                      { type: "customer_success" as const, label: "Éxito", icon: "🎉" },
                    ].map((postType) => (
                      <Button
                        key={postType.type}
                        variant="outline"
                        className="h-auto flex-col py-4"
                        onClick={() => handleGenerateLinkedInPost(postType.type)}
                        disabled={generateLinkedInPost.isPending}
                      >
                        <span className="text-2xl mb-2">{postType.icon}</span>
                        <span className="text-sm">{postType.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance</CardTitle>
                  <CardDescription>Últimos 30 días</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Emails Enviados</span>
                      <span className="font-bold">{emailStats?.totalSent || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Exitosos</span>
                      <span className="font-bold text-green-600">
                        {emailStats?.successful || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Fallidos</span>
                      <span className="font-bold text-red-600">{emailStats?.failed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tasa de Éxito</span>
                      <span className="font-bold">{emailStats?.successRate || "0.0"}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>LinkedIn Content</CardTitle>
                  <CardDescription>Estado actual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Posts</span>
                      <span className="font-bold">{linkedInStats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pendientes de Revisión</span>
                      <span className="font-bold text-yellow-600">
                        {linkedInStats?.pending || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Programados</span>
                      <span className="font-bold text-blue-600">
                        {linkedInStats?.scheduled || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Publicados</span>
                      <span className="font-bold text-green-600">
                        {linkedInStats?.published || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Test Email Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Probar Secuencia de Email</DialogTitle>
              <DialogDescription>
                Envía el primer email de la secuencia "awareness" a un lead específico
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email del Lead</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  El lead debe existir en la base de datos
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleTestEmailWorkflow}
                disabled={testEmailWorkflow.isPending || !testEmail}
              >
                {testEmailWorkflow.isPending ? "Enviando..." : "Enviar Email de Prueba"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
