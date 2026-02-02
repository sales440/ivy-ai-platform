import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
}

export function MonitorDraftPopup({
  draft,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: MonitorDraftPopupProps) {
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
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              {draft.type === 'email' ? 'Asunto' : draft.type === 'call' ? 'Título del Script' : 'Mensaje'}
            </h3>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <p className="text-white font-medium">{draft.subject}</p>
            </div>
          </div>

          {/* Body Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              Contenido
            </h3>
            <div className="bg-white rounded-lg p-6 border border-slate-300">
              {/* Letterhead */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h4 className="text-xl font-bold text-gray-900">{draft.company}</h4>
                <p className="text-sm text-gray-500">Campaña: {draft.campaign}</p>
              </div>
              {/* Email Body */}
              <div 
                className="prose prose-sm max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: draft.body.replace(/\n/g, '<br/>') }}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-700 flex gap-3">
          <Button
            onClick={() => onApprove(draft.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={draft.status !== 'pending'}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Aprobar y Guardar en Carpeta del Cliente
          </Button>
          <Button
            onClick={() => onReject(draft.id)}
            variant="destructive"
            className="flex-1"
            disabled={draft.status !== 'pending'}
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
