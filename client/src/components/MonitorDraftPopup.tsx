import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  MessageCircle,
  Building2,
  Calendar,
  Send,
  Clock,
  User,
  FileText,
  Pencil,
  Save,
  RotateCcw,
} from "lucide-react";

export type DraftType = 'email' | 'call' | 'sms';

export interface Draft {
  id: string;
  draftId: string;
  type: DraftType;
  company: string;
  subject: string;
  body: string;
  campaign: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  createdAt: string;
  recipient?: string;
  phoneNumber?: string;
}

interface MonitorDraftPopupProps {
  draft: Draft | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (draftId: string, editedSubject?: string, editedBody?: string) => void;
  onReject: (draftId: string) => void;
  onSaveEdit?: (draftId: string, subject: string, body: string) => Promise<void>;
}

export function MonitorDraftPopup({
  draft,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onSaveEdit,
}: MonitorDraftPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset edit state when draft changes
  useEffect(() => {
    if (draft) {
      setEditedSubject(draft.subject);
      setEditedBody(draft.body);
      setIsEditing(false);
    }
  }, [draft]);

  if (!draft) return null;

  const getTypeIcon = () => {
    switch (draft.type) {
      case 'email':
        return <Mail className="w-6 h-6" />;
      case 'call':
        return <Phone className="w-6 h-6" />;
      case 'sms':
        return <MessageCircle className="w-6 h-6" />;
    }
  };

  const getTypeLabel = () => {
    switch (draft.type) {
      case 'email':
        return 'Email de Campaña';
      case 'call':
        return 'Script de Llamada';
      case 'sms':
        return 'Mensaje SMS';
    }
  };

  const getStatusBadge = () => {
    switch (draft.status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pendiente</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Rechazado</Badge>;
      case 'sent':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Enviado</Badge>;
    }
  };

  const handleSaveChanges = async () => {
    if (!onSaveEdit) return;
    
    setIsSaving(true);
    try {
      await onSaveEdit(draft.id, editedSubject, editedBody);
      setIsEditing(false);
      toast.success('Cambios guardados correctamente');
    } catch (error) {
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedSubject(draft.subject);
    setEditedBody(draft.body);
    setIsEditing(false);
  };

  const handleApprove = () => {
    // If edited, pass the edited content
    if (editedSubject !== draft.subject || editedBody !== draft.body) {
      onApprove(draft.id, editedSubject, editedBody);
    } else {
      onApprove(draft.id);
    }
  };

  const hasChanges = editedSubject !== draft.subject || editedBody !== draft.body;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-slate-900 border-slate-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {getTypeIcon()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{getTypeLabel()}</h2>
                <p className="text-cyan-100 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {draft.company}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {isEditing && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                  Editando
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {/* Meta Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Campaña</p>
              <p className="text-sm font-medium text-white">{draft.campaign}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Fecha de Creación</p>
              <p className="text-sm font-medium text-white">
                {new Date(draft.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {draft.recipient && (
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Destinatario</p>
                <p className="text-sm font-medium text-white">{draft.recipient}</p>
              </div>
            )}
            {draft.phoneNumber && (
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Teléfono</p>
                <p className="text-sm font-medium text-white">{draft.phoneNumber}</p>
              </div>
            )}
          </div>

          {/* Subject/Title */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                {draft.type === 'email' ? 'Asunto' : draft.type === 'call' ? 'Título del Script' : 'Mensaje'}
              </h3>
              {draft.status === 'pending' && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
            {isEditing ? (
              <Input
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="bg-slate-800 border-cyan-500/50 text-white focus:border-cyan-400"
                placeholder="Escribe el asunto..."
              />
            ) : (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="text-white font-medium">{editedSubject}</p>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              Contenido
            </h3>
            {isEditing ? (
              <Textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="min-h-[300px] bg-slate-800 border-cyan-500/50 text-white focus:border-cyan-400"
                placeholder="Escribe el contenido..."
              />
            ) : (
              <div className="bg-white rounded-lg p-6 border border-slate-300">
                {/* Letterhead */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h4 className="text-xl font-bold text-gray-900">{draft.company}</h4>
                  <p className="text-sm text-gray-500">Campaña: {draft.campaign}</p>
                </div>
                {/* Email Body */}
                <div 
                  className="prose prose-sm max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: editedBody.replace(/\n/g, '<br/>') }}
                />
              </div>
            )}
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex gap-3 mb-6">
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving || !hasChanges}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-700 flex gap-3">
          <Button
            onClick={handleApprove}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={draft.status !== 'pending' || isEditing}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {hasChanges ? 'Aprobar con Cambios' : 'Aprobar y Guardar en Carpeta del Cliente'}
          </Button>
          <Button
            onClick={() => onReject(draft.id)}
            variant="destructive"
            className="flex-1"
            disabled={draft.status !== 'pending' || isEditing}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Rechazar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MonitorDraftPopup;
