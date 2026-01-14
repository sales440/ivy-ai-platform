import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  FolderOpen,
  FileText,
  Trash2,
  RefreshCw,
  Database,
  FolderPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FOLDER_TYPES = [
  { value: "backups", label: "Backups de Base de Datos" },
  { value: "exports", label: "Exportaciones" },
  { value: "daily", label: "Reportes Diarios" },
  { value: "weekly", label: "Reportes Semanales" },
  { value: "monthly", label: "Reportes Mensuales" },
  { value: "emailTemplates", label: "Plantillas de Email" },
  { value: "callScripts", label: "Scripts de Llamadas" },
  { value: "smsTemplates", label: "Plantillas de SMS" },
  { value: "campaigns", label: "Campañas" },
  { value: "branding", label: "Logos & Branding" },
  { value: "clientLists", label: "Listas de Clientes" },
];

export default function GoogleDriveSettings() {
  const [selectedFolder, setSelectedFolder] = useState<string>("backups");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: connectionStatus, isLoading: isCheckingConnection, refetch: refetchConnection } = 
    trpc.googleDrive.isConnected.useQuery();

  const { data: authUrlData } = trpc.googleDrive.getAuthUrl.useQuery();

  const { data: filesData, isLoading: isLoadingFiles, refetch: refetchFiles } = 
    trpc.googleDrive.listFiles.useQuery(
      { folderType: selectedFolder as any },
      { enabled: connectionStatus?.connected || false }
    );

  const disconnectMutation = trpc.googleDrive.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Google Drive desconectado exitosamente");
      refetchConnection();
    },
    onError: (error) => {
      toast.error(`Error al desconectar: ${error.message}`);
    },
  });

  const deleteFileMutation = trpc.googleDrive.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("Archivo eliminado exitosamente");
      refetchFiles();
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error) => {
      toast.error(`Error al eliminar archivo: ${error.message}`);
    },
  });

  const initFoldersMutation = trpc.googleDrive.initializeFolders.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Error al crear carpetas');
      }
    },
    onError: (error) => {
      toast.error('Error al inicializar carpetas: ' + error.message);
    },
  });

  const triggerBackupMutation = trpc.googleDrive.triggerBackup.useMutation({
    onSuccess: (data) => {
      if (data.driveLink) {
        toast.success(`Backup creado y sincronizado a Google Drive`);
      } else {
        toast.success(`Backup creado exitosamente`);
      }
      // Refresh backups folder if currently viewing it
      if (selectedFolder === "backups") {
        refetchFiles();
      }
    },
    onError: (error) => {
      toast.error(`Error al crear backup: ${error.message}`);
    },
  });

  const handleConnect = () => {
    if (authUrlData?.authUrl) {
      window.location.href = authUrlData.authUrl;
    }
  };

  const handleDisconnect = () => {
    if (confirm("¿Estás seguro de que deseas desconectar Google Drive?")) {
      disconnectMutation.mutate();
    }
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setFileToDelete({ id: fileId, name: fileName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate({ fileId: fileToDelete.id });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isCheckingConnection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuración de Google Drive</h1>
        <p className="text-muted-foreground">
          Conecta tu cuenta de Google Drive para almacenamiento centralizado de archivos, reportes y backups
        </p>
      </div>

      {/* Connection Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado de Conexión</CardTitle>
              <CardDescription>
                {connectionStatus?.connected
                  ? "Tu cuenta de Google Drive está conectada"
                  : "Conecta tu cuenta de Google Drive para comenzar"}
              </CardDescription>
            </div>
            <div>
              {connectionStatus?.connected ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-4 h-4 mr-1" />
                  Desconectado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {connectionStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderOpen className="w-4 h-4" />
                <span>Cuenta: sales@ivybai.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>Carpeta raíz: Ivy.AI - FAGOR</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => initFoldersMutation.mutate()}
                  disabled={initFoldersMutation.isPending}
                  className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/50"
                >
                  {initFoldersMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FolderPlus className="w-4 h-4 mr-2" />
                  )}
                  Inicializar Carpetas
                </Button>
                <Button
                  variant="outline"
                  onClick={() => triggerBackupMutation.mutate()}
                  disabled={triggerBackupMutation.isPending}
                  className="bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/50"
                >
                  {triggerBackupMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Crear Backup Manual
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Desconectar Google Drive
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={handleConnect} className="bg-cyan-500 hover:bg-cyan-600">
              <ExternalLink className="w-4 h-4 mr-2" />
              Conectar Google Drive
            </Button>
          )}
        </CardContent>
      </Card>

      {/* File Browser Card */}
      {connectionStatus?.connected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Explorador de Archivos</CardTitle>
                <CardDescription>
                  Navega y gestiona tus archivos almacenados en Google Drive
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchFiles()}
                disabled={isLoadingFiles}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingFiles ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Folder Selector */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Carpeta:</label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOLDER_TYPES.map((folder) => (
                      <SelectItem key={folder.value} value={folder.value}>
                        {folder.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Files List */}
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              ) : filesData?.files && filesData.files.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium">Nombre</th>
                        <th className="text-left p-3 font-medium">Tipo</th>
                        <th className="text-left p-3 font-medium">Fecha</th>
                        <th className="text-right p-3 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filesData.files.map((file) => (
                        <tr key={file.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {file.mimeType.split("/").pop()}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {formatDate(file.createdTime)}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id, file.name)}
                              disabled={deleteFileMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay archivos en esta carpeta</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el archivo "{fileToDelete?.name}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteFileMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteFileMutation.isPending}
            >
              {deleteFileMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
