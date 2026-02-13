import { useState, useEffect, useRef } from "react";
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
  Maximize2,
  Minimize2,
  Download,
  Printer,
} from "lucide-react";

export type DraftType = 'email' | 'call' | 'sms';

export interface Draft {
  id: string;
  draftId: string;
  type: DraftType;
  company: string;
  subject: string;
  body: string;
  htmlContent?: string;
  campaign: string;
  status: 'pending' | 'approved' | 'rejected' | 'sent';
  createdAt: string;
  recipient?: string;
  phoneNumber?: string;
  ctaText?: string;
}

interface MonitorDraftPopupProps {
  draft: Draft | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (draftId: string, editedSubject?: string, editedBody?: string, editedCtaText?: string) => void;
  onReject: (draftId: string) => void;
  onSaveEdit?: (draftId: string, subject: string, body: string, ctaText?: string) => Promise<void>;
}

/**
 * Auto-suggest CTA text based on campaign name
 */
function suggestCtaText(campaign: string): string {
  const c = campaign.toLowerCase();
  if (c.includes('upgrade') || c.includes('cnc')) return 'Request CNC Demo';
  if (c.includes('training') || c.includes('formación')) return 'View Training Plan';
  if (c.includes('teleservice') || c.includes('remote')) return 'Start Teleservice';
  if (c.includes('service') || c.includes('servicio')) return 'Schedule Service';
  if (c.includes('repair') || c.includes('motor') || c.includes('drive')) return 'Request Repair Quote';
  if (c.includes('warranty') || c.includes('garantía')) return 'Extend Warranty';
  if (c.includes('digital') || c.includes('suite') || c.includes('software')) return 'Explore Digital Suite';
  if (c.includes('automation')) return 'Discover Automation Solutions';
  if (c.includes('pet') || c.includes('mascota')) return 'Descubrir Más';
  return 'Solicitar Información';
}

/**
 * Generate dynamic brand-aware HTML email for full-screen preview and PDF export.
 * If htmlContent from Brand Firewall is available, use it directly.
 * Otherwise, generate a dynamic template based on company name.
 */
function generateDynamicEmailPreview(subject: string, body: string, company: string, recipient?: string, ctaText?: string, htmlContent?: string): string {
  // If we have pre-generated HTML from Brand Firewall, use it directly
  if (htmlContent) {
    return htmlContent;
  }
  
  // Fallback: generate a neutral professional template (no hardcoded brand)
  const formattedBody = body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.8; color: #2d3748;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  // Use neutral blue/professional colors as fallback
  const primaryColor = '#2563EB';
  const secondaryColor = '#1E40AF';
  const headerBg = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
  </style>
</head>
<body>
<div style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 720px; margin: 0 auto; background: #ffffff;">
  
  <!-- Header: Dynamic Company -->
  <div style="position: relative; overflow: hidden;">
    <div style="background: ${headerBg}; padding: 40px 48px 36px;">
      <div style="position: absolute; top: -20px; right: -20px; width: 200px; height: 200px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td>
            <span style="color: #ffffff; font-weight: 700; font-size: 24px; letter-spacing: 0.5px;">${company}</span>
          </td>
        </tr>
      </table>
    </div>
    <div style="height: 4px; background: linear-gradient(90deg, ${primaryColor} 0%, #60a5fa 50%, ${primaryColor} 100%);"></div>
  </div>

  <!-- Subject Section -->
  <div style="background: #fafbfc; padding: 24px 48px; border-bottom: 1px solid #e8ecf0;">
    <div style="font-size: 10px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Asunto</div>
    <div style="font-size: 20px; font-weight: 600; color: #1a202c; line-height: 1.3;">${subject}</div>
  </div>

  ${recipient ? `
  <div style="padding: 16px 48px; background: #f7f8fa; border-bottom: 1px solid #e8ecf0;">
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-right: 24px;">
          <span style="font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Para</span>
          <div style="font-size: 14px; color: #4a5568; font-weight: 500; margin-top: 2px;">${recipient}</div>
        </td>
        <td>
          <span style="font-size: 10px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Empresa</span>
          <div style="font-size: 14px; color: #4a5568; font-weight: 500; margin-top: 2px;">${company}</div>
        </td>
      </tr>
    </table>
  </div>
  ` : ''}

  <!-- Email Body -->
  <div style="padding: 40px 48px 32px; font-size: 15px; color: #2d3748; line-height: 1.8;">
    ${formattedBody}
  </div>

  <!-- CTA -->
  <div style="padding: 0 48px 40px; text-align: center;">
    <div style="display: inline-block; background: ${headerBg}; border-radius: 8px; padding: 14px 36px; text-decoration: none;">
      <span style="color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">${ctaText || 'Solicitar Información'}</span>
    </div>
  </div>

  <!-- Divider -->
  <div style="padding: 0 48px;">
    <div style="height: 3px; background: linear-gradient(90deg, ${primaryColor}, #60a5fa, ${primaryColor}); border-radius: 2px;"></div>
  </div>

  <!-- Signature -->
  <div style="padding: 32px 48px;">
    <div style="border-left: 3px solid ${primaryColor}; padding-left: 20px;">
      <div style="font-size: 16px; font-weight: 700; color: #1a202c; margin-bottom: 2px;">${company}</div>
      <div style="font-size: 12px; color: #718096; line-height: 1.6; margin-top: 8px;">
        Email generado por Ivy.AI
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 28px 48px;">
    <div style="font-size: 11px; color: #64748b; line-height: 1.6;">
      &copy; ${new Date().getFullYear()} ${company}. Todos los derechos reservados.<br/>
      <span style="font-size: 9px; color: #475569; letter-spacing: 1px; text-transform: uppercase;">Powered by Ivy.AI</span>
    </div>
  </div>

</div>
</body>
</html>`;
}

/**
 * Simple preview for the popup (non-fullscreen).
 * Uses htmlContent from Brand Firewall if available, otherwise generates neutral template.
 */
function generateSimplePreview(subject: string, body: string, company: string, ctaText?: string, htmlContent?: string): string {
  // If we have pre-generated HTML from Brand Firewall, use it directly
  if (htmlContent) {
    return htmlContent;
  }
  
  // Fallback: neutral professional preview (no hardcoded brand)
  const primaryColor = '#2563EB';
  const headerBg = `linear-gradient(135deg, ${primaryColor} 0%, #1E40AF 100%)`;
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
      <div style="background: ${headerBg}; padding: 28px 36px; text-align: center;">
        <span style="color: #ffffff; font-weight: 700; font-size: 22px; letter-spacing: 0.5px;">${company}</span>
      </div>
      <div style="background: #1E293B; padding: 16px 36px; border-bottom: 3px solid ${primaryColor};">
        <div style="color: #999; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Asunto</div>
        <div style="color: #ffffff; font-size: 16px; font-weight: 600;">${subject}</div>
      </div>
      <div style="padding: 36px; color: #333333; line-height: 1.7; font-size: 15px;">
        ${body.replace(/\n/g, '<br/>')}
      </div>
      <div style="padding: 0 36px 24px; text-align: center;">
        <div style="display: inline-block; background: ${headerBg}; border-radius: 6px; padding: 12px 32px;">
          <span style="color: #ffffff; font-size: 13px; font-weight: 600;">${ctaText || 'Solicitar Información'}</span>
        </div>
      </div>
      <div style="margin: 0 36px;"><div style="height: 3px; background: linear-gradient(90deg, ${primaryColor}, #60a5fa, ${primaryColor}); border-radius: 2px;"></div></div>
      <div style="padding: 24px 36px; color: #666; font-size: 13px;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #333;">${company}</p>
        <p style="margin: 0; color: #999; line-height: 1.5;">Email generado por Ivy.AI</p>
      </div>
      <div style="background: #1E293B; padding: 24px 36px; color: #999; font-size: 11px; text-align: center;">
        <p style="margin: 0; color: #666;">&copy; ${new Date().getFullYear()} ${company}. Todos los derechos reservados.</p>
        <p style="margin: 4px 0 0; color: #475569; font-size: 9px; letter-spacing: 1px; text-transform: uppercase;">Powered by Ivy.AI</p>
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
  const [editedCtaText, setEditedCtaText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset edit state when draft changes
  useEffect(() => {
    if (draft) {
      setEditedSubject(draft.subject);
      setEditedBody(draft.body);
      setEditedCtaText(draft.ctaText || suggestCtaText(draft.campaign));
      setIsEditing(false);
      setViewMode('preview');
      setIsFullScreen(false);
    }
  }, [draft]);

  // Update iframe content when in fullscreen mode
  useEffect(() => {
    if (isFullScreen && iframeRef.current && draft) {
      const previewHtml = generateDynamicEmailPreview(editedSubject, editedBody, draft.company, draft.recipient, editedCtaText, draft.htmlContent);
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [isFullScreen, editedSubject, editedBody, draft]);

  if (!draft) return null;

  const getTypeIcon = () => {
    switch (draft.type) {
      case 'email': return <Mail className="w-6 h-6" />;
      case 'call': return <Phone className="w-6 h-6" />;
      case 'sms': return <MessageCircle className="w-6 h-6" />;
    }
  };

  const getTypeLabel = () => {
    switch (draft.type) {
      case 'email': return 'Email de Campaña';
      case 'call': return 'Script de Llamada';
      case 'sms': return 'Mensaje SMS';
    }
  };

  const getStatusBadge = () => {
    switch (draft.status) {
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pendiente</Badge>;
      case 'approved': return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Aprobado</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Rechazado</Badge>;
      case 'sent': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Enviado</Badge>;
    }
  };

  const handleSaveChanges = async () => {
    if (!onSaveEdit) return;
    setIsSaving(true);
    try {
      await onSaveEdit(draft.id, editedSubject, editedBody, editedCtaText);
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
    setEditedCtaText(draft.ctaText || suggestCtaText(draft.campaign));
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (editedSubject !== draft.subject || editedBody !== draft.body || editedCtaText !== (draft.ctaText || suggestCtaText(draft.campaign))) {
      onApprove(draft.id, editedSubject, editedBody, editedCtaText);
    } else {
      onApprove(draft.id, undefined, undefined, editedCtaText);
    }
  };

  const handlePrint = () => {
    if (!draft) return;
    const previewHtml = generateDynamicEmailPreview(editedSubject, editedBody, draft.company, draft.recipient, editedCtaText, draft.htmlContent);
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${editedSubject}</title>
          <style>
            @media print {
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
              body { margin: 0; padding: 0; }
              @page { margin: 0.5cm; size: A4; }
            }
          </style>
        </head>
        <body>
          ${previewHtml}
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }<\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const hasChanges = editedSubject !== draft.subject || editedBody !== draft.body || editedCtaText !== (draft.ctaText || suggestCtaText(draft.campaign));

  // ============ FULL SCREEN PREVIEW MODE ============
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
        {/* Full-screen header bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Vista Previa Premium</h2>
                <p className="text-slate-400 text-xs">{draft.company} — {draft.campaign}</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir / PDF
            </Button>
            
            {draft.status === 'pending' && (
              <>
                <Button
                  onClick={handleApprove}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 h-8"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Aprobar
                </Button>
                <Button
                  onClick={() => onReject(draft.id)}
                  variant="destructive"
                  size="sm"
                  className="h-8"
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                  Rechazar
                </Button>
              </>
            )}
            
            <div className="w-px h-6 bg-slate-700 mx-1" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullScreen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-700 h-8"
            >
              <Minimize2 className="w-3.5 h-3.5 mr-1.5" />
              Salir
            </Button>
          </div>
        </div>

        {/* Full-screen email preview in iframe */}
        <div className="flex-1 overflow-auto bg-gradient-to-b from-slate-100 to-slate-200 flex justify-center py-8 px-4">
          <div className="w-full max-w-[780px] bg-white rounded-xl shadow-2xl overflow-hidden" style={{ minHeight: '90%' }}>
            <iframe
              ref={iframeRef}
              className="w-full border-0"
              style={{ minHeight: '900px', height: '100%' }}
              title="Email Preview"
            />
          </div>
        </div>
      </div>
    );
  }

  // ============ NORMAL DIALOG MODE ============
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
                    onClick={() => setIsFullScreen(true)}
                    className="h-7 px-3 text-xs text-white/60 hover:text-white hover:bg-white/10"
                    title="Ver en pantalla completa"
                  >
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Full
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
              {draft.type === 'email' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Texto del Botón CTA</h3>
                    <span className="text-xs text-slate-500">Ej: "Request CNC Demo", "View Training Plan"</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={editedCtaText}
                      onChange={(e) => setEditedCtaText(e.target.value)}
                      className="bg-slate-800 border-amber-500/50 text-white focus:border-amber-400"
                      placeholder="Texto del botón de acción..."
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditedCtaText(suggestCtaText(draft.campaign))}
                      className="text-amber-400 border-amber-400/50 hover:bg-amber-400/10 whitespace-nowrap"
                      title="Auto-sugerir según campaña"
                    >
                      Auto
                    </Button>
                  </div>
                  <div className="mt-2 p-2 bg-slate-800/30 rounded border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded text-white text-xs font-semibold">
                        {editedCtaText || 'Solicitar Información'}
                      </div>
                      <span className="text-xs text-slate-500">← Preview del botón</span>
                    </div>
                  </div>
                </div>
              )}
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
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFullScreen(true)}
                        className="text-amber-400 border-amber-400/50 hover:bg-amber-400/10"
                      >
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Pantalla Completa
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-xl p-6 border border-gray-300">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: generateSimplePreview(editedSubject, editedBody, draft.company, editedCtaText, draft.htmlContent),
                      }}
                    />
                  </div>
                  {/* CTA Text Editor - always visible in preview mode */}
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Botón Call-to-Action</h4>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={editedCtaText}
                        onChange={(e) => setEditedCtaText(e.target.value)}
                        className="bg-slate-900 border-amber-500/30 text-white focus:border-amber-400 h-9 text-sm"
                        placeholder="Texto del botón CTA..."
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditedCtaText(suggestCtaText(draft.campaign))}
                        className="text-amber-400 border-amber-400/30 hover:bg-amber-400/10 h-9 text-xs whitespace-nowrap"
                      >
                        Auto-sugerir
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 rounded text-white text-xs font-semibold">
                        {editedCtaText || 'Solicitar Información'}
                      </div>
                      <span className="text-xs text-slate-500">← Así se verá en el email</span>
                    </div>
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
