import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Eye,
  Clock,
  Send,
  Building2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Streamdown } from "streamdown";

interface ContentItem {
  id: number;
  campaignId: number | null;
  companyId: number | null;
  companyName: string;
  companyLogo: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  contentType: "email" | "call_script" | "sms";
  subject: string | null;
  body: string;
  htmlContent: string | null;
  targetRecipients: string | null;
  status: "pending" | "approved" | "rejected" | "sent";
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  sentCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function CampaignMonitor() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState<"email" | "call_script" | "sms">("email");
  
  // Form state for generation
  const [genCompanyName, setGenCompanyName] = useState("");
  const [genCompanyLogo, setGenCompanyLogo] = useState("");
  const [genCompanyEmail, setGenCompanyEmail] = useState("");
  const [genCompanyPhone, setGenCompanyPhone] = useState("");
  const [genCompanyAddress, setGenCompanyAddress] = useState("");
  const [genCompanyWebsite, setGenCompanyWebsite] = useState("");
  const [genCampaignGoal, setGenCampaignGoal] = useState("");
  const [genTargetAudience, setGenTargetAudience] = useState("");
  const [genProductService, setGenProductService] = useState("");

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.campaignContent.getStats.useQuery();
  const { data: pendingContent, refetch: refetchPending } = trpc.campaignContent.list.useQuery({ status: "pending" });
  const { data: approvedContent, refetch: refetchApproved } = trpc.campaignContent.list.useQuery({ status: "approved" });
  const { data: rejectedContent, refetch: refetchRejected } = trpc.campaignContent.list.useQuery({ status: "rejected" });
  const { data: sentContent, refetch: refetchSent } = trpc.campaignContent.list.useQuery({ status: "sent" });

  // Mutations
  const approveMutation = trpc.campaignContent.approve.useMutation({
    onSuccess: () => {
      toast.success("Contenido aprobado exitosamente");
      refetchAll();
      setPreviewOpen(false);
    },
    onError: (error) => {
      toast.error(`Error al aprobar: ${error.message}`);
    }
  });

  const rejectMutation = trpc.campaignContent.reject.useMutation({
    onSuccess: () => {
      toast.success("Contenido rechazado");
      refetchAll();
      setRejectOpen(false);
      setRejectReason("");
    },
    onError: (error) => {
      toast.error(`Error al rechazar: ${error.message}`);
    }
  });

  const updateMutation = trpc.campaignContent.update.useMutation({
    onSuccess: () => {
      toast.success("Contenido actualizado");
      refetchAll();
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    }
  });

  const generateEmailMutation = trpc.campaignContent.generateCreativeEmail.useMutation({
    onSuccess: (data) => {
      toast.success("Email generado exitosamente");
      refetchAll();
      setGenerateOpen(false);
      resetGenerateForm();
    },
    onError: (error) => {
      toast.error(`Error al generar: ${error.message}`);
    }
  });

  const createContentMutation = trpc.campaignContent.create.useMutation({
    onSuccess: () => {
      toast.success("Contenido creado para validación");
      refetchAll();
      setGenerateOpen(false);
      resetGenerateForm();
    },
    onError: (error) => {
      toast.error(`Error al crear: ${error.message}`);
    }
  });

  const refetchAll = () => {
    refetchStats();
    refetchPending();
    refetchApproved();
    refetchRejected();
    refetchSent();
  };

  const resetGenerateForm = () => {
    setGenCompanyName("");
    setGenCompanyLogo("");
    setGenCompanyEmail("");
    setGenCompanyPhone("");
    setGenCompanyAddress("");
    setGenCompanyWebsite("");
    setGenCampaignGoal("");
    setGenTargetAudience("");
    setGenProductService("");
  };

  const handleApprove = (content: ContentItem) => {
    approveMutation.mutate({ id: content.id });
  };

  const handleReject = () => {
    if (selectedContent && rejectReason) {
      rejectMutation.mutate({ id: selectedContent.id, reason: rejectReason });
    }
  };

  const handleEdit = () => {
    if (selectedContent) {
      updateMutation.mutate({
        id: selectedContent.id,
        subject: editSubject,
        body: editBody,
      });
    }
  };

  const handleGenerate = async () => {
    if (generateType === "email") {
      await generateEmailMutation.mutateAsync({
        companyName: genCompanyName,
        companyLogo: genCompanyLogo || undefined,
        companyAddress: genCompanyAddress || undefined,
        companyPhone: genCompanyPhone || undefined,
        companyEmail: genCompanyEmail || undefined,
        companyWebsite: genCompanyWebsite || undefined,
        campaignGoal: genCampaignGoal,
        targetAudience: genTargetAudience,
        productService: genProductService,
        tone: "professional",
      });

      // Create content entry for validation
      const result = await generateEmailMutation.data;
      if (result) {
        await createContentMutation.mutateAsync({
          companyName: genCompanyName,
          companyLogo: genCompanyLogo || undefined,
          companyAddress: genCompanyAddress || undefined,
          companyPhone: genCompanyPhone || undefined,
          companyEmail: genCompanyEmail || undefined,
          companyWebsite: genCompanyWebsite || undefined,
          contentType: "email",
          subject: result.subject,
          body: result.body,
          htmlContent: result.htmlContent,
        });
      }
    }
  };

  const openPreview = (content: ContentItem) => {
    setSelectedContent(content);
    setPreviewOpen(true);
  };

  const openEdit = (content: ContentItem) => {
    setSelectedContent(content);
    setEditSubject(content.subject || "");
    setEditBody(content.body);
    setEditOpen(true);
  };

  const openReject = (content: ContentItem) => {
    setSelectedContent(content);
    setRejectOpen(true);
  };

  const getContentByTab = () => {
    switch (activeTab) {
      case "pending": return pendingContent || [];
      case "approved": return approvedContent || [];
      case "rejected": return rejectedContent || [];
      case "sent": return sentContent || [];
      default: return [];
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "call_script": return <Phone className="h-4 w-4" />;
      case "sms": return <MessageSquare className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "approved": return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>;
      case "sent": return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50"><Send className="h-3 w-3 mr-1" />Enviado</Badge>;
      default: return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Eye className="h-8 w-8 text-cyan-400" />
              Monitor de Campañas
            </h1>
            <p className="text-slate-400 mt-1">
              Valida y aprueba el contenido antes de enviarlo a los clientes
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={refetchAll}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
              onClick={() => setGenerateOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generar Contenido
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Aprobados</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Rechazados</p>
                  <p className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Enviados</p>
                  <p className="text-2xl font-bold text-blue-400">{stats?.sent || 0}</p>
                </div>
                <Send className="h-8 w-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              <Clock className="h-4 w-4 mr-2" />
              Pendientes ({stats?.pending || 0})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobados ({stats?.approved || 0})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <XCircle className="h-4 w-4 mr-2" />
              Rechazados ({stats?.rejected || 0})
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Send className="h-4 w-4 mr-2" />
              Enviados ({stats?.sent || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {getContentByTab().length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-12 text-center">
                  <Eye className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No hay contenido en esta categoría</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {getContentByTab().map((content: ContentItem) => (
                  <Card key={content.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-slate-800">
                              {getContentTypeIcon(content.contentType)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-slate-500" />
                                <span className="font-semibold text-white">{content.companyName}</span>
                              </div>
                              <p className="text-sm text-slate-400">
                                {content.contentType === "email" ? "Email" : 
                                 content.contentType === "call_script" ? "Script de Llamada" : "SMS"}
                              </p>
                            </div>
                            {getStatusBadge(content.status)}
                          </div>
                          
                          {content.subject && (
                            <p className="text-lg font-medium text-white mb-2">
                              {content.subject}
                            </p>
                          )}
                          
                          <p className="text-slate-400 line-clamp-2">
                            {content.body.substring(0, 200)}...
                          </p>
                          
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span>Creado: {new Date(content.createdAt).toLocaleDateString()}</span>
                            {content.sentCount && content.sentCount > 0 && (
                              <span>Enviados: {content.sentCount}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => openPreview(content)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {content.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                onClick={() => openEdit(content)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApprove(content)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openReject(content)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                {selectedContent && getContentTypeIcon(selectedContent.contentType)}
                Vista Previa - {selectedContent?.companyName}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedContent?.contentType === "email" ? "Email de Campaña" :
                 selectedContent?.contentType === "call_script" ? "Script de Llamada Telefónica" : "Mensaje SMS"}
              </DialogDescription>
            </DialogHeader>
            
            {selectedContent && (
              <div className="space-y-4">
                {/* Company Info */}
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Información de la Empresa</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Empresa:</span> <span className="text-white">{selectedContent.companyName}</span></div>
                    {selectedContent.companyEmail && <div><span className="text-slate-500">Email:</span> <span className="text-white">{selectedContent.companyEmail}</span></div>}
                    {selectedContent.companyPhone && <div><span className="text-slate-500">Teléfono:</span> <span className="text-white">{selectedContent.companyPhone}</span></div>}
                    {selectedContent.companyWebsite && <div><span className="text-slate-500">Web:</span> <span className="text-white">{selectedContent.companyWebsite}</span></div>}
                  </div>
                </div>

                {/* Content Preview */}
                {selectedContent.contentType === "email" && selectedContent.htmlContent ? (
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-800 p-3 border-b border-slate-700">
                      <p className="text-sm text-slate-400">Asunto: <span className="text-white">{selectedContent.subject}</span></p>
                    </div>
                    <div 
                      className="bg-white p-4"
                      dangerouslySetInnerHTML={{ __html: selectedContent.htmlContent }}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    {selectedContent.subject && (
                      <p className="text-lg font-medium text-white mb-4">{selectedContent.subject}</p>
                    )}
                    <div className="text-slate-300 whitespace-pre-wrap">
                      <Streamdown>{selectedContent.body}</Streamdown>
                    </div>
                  </div>
                )}

                {/* Rejection reason if rejected */}
                {selectedContent.status === "rejected" && selectedContent.rejectionReason && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <h4 className="text-sm font-medium text-red-400 mb-2">Razón del Rechazo</h4>
                    <p className="text-slate-300">{selectedContent.rejectionReason}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              {selectedContent?.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    className="border-slate-700"
                    onClick={() => {
                      setPreviewOpen(false);
                      openEdit(selectedContent);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setPreviewOpen(false);
                      openReject(selectedContent);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedContent)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Contenido</DialogTitle>
              <DialogDescription className="text-slate-400">
                Modifica el contenido antes de aprobarlo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedContent?.contentType === "email" && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Asunto</Label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-slate-300">Contenido</Label>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={10}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" className="border-slate-700" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} className="bg-cyan-600 hover:bg-cyan-700">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Rechazar Contenido</DialogTitle>
              <DialogDescription className="text-slate-400">
                Indica la razón del rechazo para que ROPA pueda mejorar el contenido
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Razón del Rechazo</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué rechazas este contenido..."
                rows={4}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" className="border-slate-700" onClick={() => setRejectOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
                Confirmar Rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Content Dialog */}
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                Generar Contenido con IA
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                ROPA generará contenido creativo y de alto enganche para tu campaña
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Content Type Selection */}
              <div className="flex gap-2">
                <Button
                  variant={generateType === "email" ? "default" : "outline"}
                  className={generateType === "email" ? "bg-cyan-600" : "border-slate-700"}
                  onClick={() => setGenerateType("email")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant={generateType === "call_script" ? "default" : "outline"}
                  className={generateType === "call_script" ? "bg-cyan-600" : "border-slate-700"}
                  onClick={() => setGenerateType("call_script")}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Llamada
                </Button>
                <Button
                  variant={generateType === "sms" ? "default" : "outline"}
                  className={generateType === "sms" ? "bg-cyan-600" : "border-slate-700"}
                  onClick={() => setGenerateType("sms")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>

              {/* Company Info */}
              <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Información de la Empresa (Membrete)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Nombre de la Empresa *</Label>
                    <Input
                      value={genCompanyName}
                      onChange={(e) => setGenCompanyName(e.target.value)}
                      placeholder="FAGOR Automation"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">URL del Logo</Label>
                    <Input
                      value={genCompanyLogo}
                      onChange={(e) => setGenCompanyLogo(e.target.value)}
                      placeholder="https://..."
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Email de Contacto</Label>
                    <Input
                      value={genCompanyEmail}
                      onChange={(e) => setGenCompanyEmail(e.target.value)}
                      placeholder="ventas@empresa.com"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Teléfono</Label>
                    <Input
                      value={genCompanyPhone}
                      onChange={(e) => setGenCompanyPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-slate-400">Dirección</Label>
                    <Input
                      value={genCompanyAddress}
                      onChange={(e) => setGenCompanyAddress(e.target.value)}
                      placeholder="123 Main St, City, Country"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-slate-400">Sitio Web</Label>
                    <Input
                      value={genCompanyWebsite}
                      onChange={(e) => setGenCompanyWebsite(e.target.value)}
                      placeholder="https://www.empresa.com"
                      className="bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Info */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-slate-300">Objetivo de la Campaña *</Label>
                  <Input
                    value={genCampaignGoal}
                    onChange={(e) => setGenCampaignGoal(e.target.value)}
                    placeholder="Generar leads para curso de capacitación CNC"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Audiencia Objetivo *</Label>
                  <Input
                    value={genTargetAudience}
                    onChange={(e) => setGenTargetAudience(e.target.value)}
                    placeholder="Gerentes de producción en empresas manufactureras"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Producto/Servicio *</Label>
                  <Input
                    value={genProductService}
                    onChange={(e) => setGenProductService(e.target.value)}
                    placeholder="Curso de capacitación en CNC FAGOR 8070"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" className="border-slate-700" onClick={() => setGenerateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate}
                disabled={!genCompanyName || !genCampaignGoal || !genTargetAudience || !genProductService || generateEmailMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-teal-500"
              >
                {generateEmailMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
