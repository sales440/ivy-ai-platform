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
  Eye,
  Code,
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

/**
 * Generate professional FAGOR-branded HTML email preview
 */
function generateFagorEmailPreview(subject: string, body: string, company: string): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #E31937 0%, #B71530 100%); padding: 28px 36px; text-align: center;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <img src="https://www.fagorautomation.com/images/logo-fagor-automation-white.svg" alt="FAGOR Automation" style="max-height: 40px; filter: brightness(10);" onerror="this.style.display='none'" />
        </div>
        <div style="color: rgba(255,255,255,0.8); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-top: 8px;">CNC Solutions &amp; Industrial Automation</div>
      </div>

      <!-- Subject Bar -->
      <div style="background: #1a1a2e; padding: 16px 36px; border-bottom: 3px solid #E31937;">
        <div style="color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Asunto</div>
        <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${subject}</div>
      </div>

      <!-- Body Content -->
      <div style="padding: 36px; color: #333333; line-height: 1.7; font-size: 15px;">
        ${body}
      </div>

      <!-- Divider -->
      <div style="margin: 0 36px;">
        <div style="height: 3px; background: linear-gradient(90deg, #E31937, #ff6b6b, #E31937); border-radius: 2px;"></div>
      </div>

      <!-- Signature -->
      <div style="padding: 24px 36px; color: #666; font-size: 13px;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #333;">FAGOR Automation USA</p>
        <p style="margin: 0; color: #999; line-height: 1.5;">
          4020 Winnetka Ave, Rolling Meadows, IL 60008<br/>
          Tel: +1 (847) 981-1500 | <a href="https://www.fagorautomation.us" style="color: #E31937; text-decoration: none;">www.fagorautomation.us</a>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #1a1a2e; padding: 24px 36px; color: #999; font-size: 11px; text-align: center;">
        <div style="margin-bottom: 12px;">
          <a href="https://www.linkedin.com/company/fagor-automation/" style="color: #E31937; text-decoration: none; margin: 0 8px;">LinkedIn</a>
          <a href="https://twitter.com/FAGORAutomation" style="color: #E31937; text-decoration: none; margin: 0 8px;">Twitter</a>
          <a href="https://www.youtube.com/c/FAGORAutomation" style="color: #E31937; text-decoration: none; margin: 0 8px;">YouTube</a>
        </div>
        <p style="margin: 0; color: #666;">&copy; ${new Date().getFullYear()} FAGOR Automation USA. All rights reserved.</p>
      </div>
    </div>
  `;
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
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  // Reset edit state when draft changes
  useEffect(() => {
    if (draft) {
      setEditedSubject(draft.subject);
      setEditedBody(draft.body);
      setIsEditing(false);
      setViewMode('preview');
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
    if (editedSubject !== draft.subject || editedBody !== draft.body) {
      onApprove(draft.id, editedSubject, editedBody);
    } else {
      onApprove(draft.id);
    }
  };

  const hasChanges = editedSubject !== draft.subject || editedBody !== draft.body;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[92vh] p-0 bg-slate-900 border-slate-700 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {getTypeIcon()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{getTypeLabel()}</h2>
                <p className="text-cyan-100 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {draft.company} — {draft.campaign}
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
              {/* View mode toggle for emails */}
              {draft.type === 'email' && !isEditing && (
                <div className="flex gap-1 bg-white/10 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('preview')}
                    className={`h-7 px-3 text-xs ${viewMode === 'preview' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('source')}
                    className={`h-7 px-3 text-xs ${viewMode === 'source' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  >
                    <Code className="w-3 h-3 mr-1" />
                    Source
                  </Button>
                </div>
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
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Estado</p>
              <p className="text-sm font-medium">{getStatusBadge()}</p>
            </div>
          </div>

          {isEditing ? (
            /* Edit Mode */
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Asunto</h3>
                </div>
                <Input
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="bg-slate-800 border-cyan-500/50 text-white focus:border-cyan-400"
                  placeholder="Escribe el asunto..."
                />
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Contenido</h3>
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="min-h-[350px] bg-slate-800 border-cyan-500/50 text-white focus:border-cyan-400 font-mono text-sm"
                  placeholder="Escribe el contenido HTML..."
                />
              </div>
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
            </>
          ) : (
            /* View Mode */
            <>
              {draft.type === 'email' && viewMode === 'preview' ? (
                /* Professional HTML Email Preview */
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      Vista Previa del Email (como lo verá el destinatario)
                    </h3>
                    {draft.status === 'pending' && (
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
                  <div className="bg-gray-100 rounded-xl p-6 border border-gray-300">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: generateFagorEmailPreview(editedSubject, editedBody, draft.company),
                      }}
                    />
                  </div>
                </div>
              ) : draft.type === 'email' && viewMode === 'source' ? (
                /* Source view */
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-4 h-4 text-cyan-400" />
                      Código Fuente HTML
                    </h3>
                    {draft.status === 'pending' && (
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
                  <div className="bg-slate-950 rounded-xl p-6 border border-slate-700">
                    <div className="mb-3 pb-3 border-b border-slate-800">
                      <span className="text-slate-500 text-xs">Asunto:</span>
                      <p className="text-white font-medium">{editedSubject}</p>
                    </div>
                    <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                      {editedBody}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Non-email content (call scripts, SMS) */
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        {draft.type === 'call' ? 'Script de Llamada' : 'Mensaje SMS'}
                      </h3>
                      {draft.status === 'pending' && (
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
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
                      <span className="text-slate-500 text-xs">Título:</span>
                      <p className="text-white font-medium">{editedSubject}</p>
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-slate-300">
                      <div className="border-b border-gray-200 pb-4 mb-4">
                        <h4 className="text-xl font-bold text-gray-900">{draft.company}</h4>
                        <p className="text-sm text-gray-500">Campaña: {draft.campaign}</p>
                      </div>
                      <div 
                        className="prose prose-sm max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: editedBody.replace(/\n/g, '<br/>') }}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-700 flex gap-3">
          {draft.status === 'pending' && (
            <>
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isEditing}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {hasChanges ? 'Aprobar con Cambios' : 'Aprobar Email'}
              </Button>
              <Button
                onClick={() => onReject(draft.id)}
                variant="destructive"
                className="flex-1"
                disabled={isEditing}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </>
          )}
          {draft.status === 'approved' && (
            <div className="flex-1 flex items-center justify-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Email aprobado — Listo para enviar desde Monitor</span>
            </div>
          )}
          {draft.status === 'sent' && (
            <div className="flex-1 flex items-center justify-center gap-2 text-blue-400">
              <Send className="w-5 h-5" />
              <span className="font-semibold">Email enviado exitosamente via Outlook</span>
            </div>
          )}
          {draft.status === 'rejected' && (
            <div className="flex-1 flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Email rechazado</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MonitorDraftPopup;
