import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Eye,
  Building2,
  Calendar,
  Send,
  XCircle,
  Loader2,
} from "lucide-react";
import { Draft, DraftType } from "./MonitorDraftPopup";

interface MonitorDraftListProps {
  drafts: Draft[];
  onDoubleClick: (draft: Draft) => void;
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  onConfirmSend?: (draftIds: string[]) => void;
  onCancelSend?: (draftIds: string[]) => void;
  isSending?: boolean;
  filterType?: DraftType | 'all';
  filterStatus?: 'pending' | 'approved' | 'rejected' | 'sent' | 'all';
}

export function MonitorDraftList({
  drafts,
  onDoubleClick,
  onApprove,
  onReject,
  onConfirmSend,
  onCancelSend,
  isSending = false,
  filterType = 'all',
  filterStatus = 'all',
}: MonitorDraftListProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [selectedForSend, setSelectedForSend] = useState<Set<string>>(new Set());

  const filteredDrafts = drafts.filter((draft) => {
    if (filterType !== 'all' && draft.type !== filterType) return false;
    if (filterStatus !== 'all' && draft.status !== filterStatus) return false;
    // Auto-hide rejected drafts unless user explicitly filters for them
    if (filterStatus === 'all' && draft.status === 'rejected') return false;
    return true;
  });

  const approvedDrafts = filteredDrafts.filter(d => d.status === 'approved');
  const hasApprovedDrafts = approvedDrafts.length > 0;

  const toggleSelectForSend = (draftId: string) => {
    setSelectedForSend(prev => {
      const next = new Set(prev);
      if (next.has(draftId)) {
        next.delete(draftId);
      } else {
        next.add(draftId);
      }
      return next;
    });
  };

  const selectAllApproved = () => {
    const allApprovedIds = approvedDrafts.map(d => d.id);
    setSelectedForSend(new Set(allApprovedIds));
  };

  const deselectAll = () => {
    setSelectedForSend(new Set());
  };

  const getTypeIcon = (type: DraftType) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-cyan-400" />;
      case 'call':
        return <Phone className="w-4 h-4 text-green-400" />;
      case 'sms':
        return <MessageCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: DraftType) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'call':
        return 'Llamada';
      case 'sms':
        return 'SMS';
    }
  };

  const getStatusBadge = (status: Draft['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
            <Send className="w-3 h-3 mr-1" />
            Enviado
          </Badge>
        );
    }
  };

  if (filteredDrafts.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
        <Eye className="w-12 h-12 mx-auto text-slate-600 mb-4" />
        <p className="text-lg font-medium text-white mb-2">No hay borradores</p>
        <p className="text-sm text-slate-400">
          {filterType !== 'all' || filterStatus !== 'all'
            ? 'No hay borradores que coincidan con los filtros seleccionados'
            : 'Pídele a ROPA que genere contenido para tus campañas'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Confirmar Envío Action Bar - only shows when there are approved drafts */}
      {hasApprovedDrafts && (
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-green-300 font-semibold text-sm">
                  {approvedDrafts.length} email{approvedDrafts.length > 1 ? 's' : ''} aprobado{approvedDrafts.length > 1 ? 's' : ''} listo{approvedDrafts.length > 1 ? 's' : ''} para enviar
                </p>
                <p className="text-green-400/60 text-xs">
                  {selectedForSend.size > 0 
                    ? `${selectedForSend.size} seleccionado${selectedForSend.size > 1 ? 's' : ''} para envío`
                    : 'Selecciona los emails que deseas enviar via Outlook'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedForSend.size === 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                  onClick={selectAllApproved}
                >
                  Seleccionar Todos
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-400 hover:bg-slate-800"
                    onClick={deselectAll}
                  >
                    Deseleccionar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    onClick={() => onCancelSend?.(Array.from(selectedForSend))}
                    disabled={isSending}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    onClick={() => onConfirmSend?.(Array.from(selectedForSend))}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1" />
                        Confirmar Envío ({selectedForSend.size})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              {hasApprovedDrafts && (
                <TableHead className="text-slate-400 w-[50px]">
                  <input
                    type="checkbox"
                    className="accent-green-500 w-4 h-4"
                    checked={selectedForSend.size === approvedDrafts.length && approvedDrafts.length > 0}
                    onChange={(e) => e.target.checked ? selectAllApproved() : deselectAll()}
                  />
                </TableHead>
              )}
              <TableHead className="text-slate-400 w-[80px]">Tipo</TableHead>
              <TableHead className="text-slate-400">Empresa</TableHead>
              <TableHead className="text-slate-400">Asunto / Título</TableHead>
              <TableHead className="text-slate-400">Campaña</TableHead>
              <TableHead className="text-slate-400 w-[120px]">Estado</TableHead>
              <TableHead className="text-slate-400 w-[100px]">Fecha</TableHead>
              <TableHead className="text-slate-400 w-[180px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrafts.map((draft) => (
              <TableRow
                key={draft.id}
                className={`border-slate-700/50 cursor-pointer transition-all ${
                  hoveredRow === draft.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : selectedForSend.has(draft.id)
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'hover:bg-slate-800/50'
                }`}
                onMouseEnter={() => setHoveredRow(draft.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onDoubleClick={() => onDoubleClick(draft)}
              >
                {hasApprovedDrafts && (
                  <TableCell>
                    {draft.status === 'approved' && (
                      <input
                        type="checkbox"
                        className="accent-green-500 w-4 h-4"
                        checked={selectedForSend.has(draft.id)}
                        onChange={() => toggleSelectForSend(draft.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(draft.type)}
                    <span className="text-xs text-slate-400">{getTypeLabel(draft.type)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-white font-medium">{draft.company}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-white truncate max-w-[250px]" title={draft.subject}>
                    {draft.subject}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="text-cyan-400 text-sm">{draft.campaign}</span>
                </TableCell>
                <TableCell>{getStatusBadge(draft.status)}</TableCell>
                <TableCell>
                  <span className="text-slate-400 text-sm">
                    {new Date(draft.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDoubleClick(draft);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    {draft.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(draft.id);
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReject(draft.id);
                          }}
                        >
                          <AlertCircle className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {draft.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForSend(prev => {
                            const next = new Set(prev);
                            next.add(draft.id);
                            return next;
                          });
                        }}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-slate-500 text-center mt-4 pb-2">
          💡 Haz doble clic en cualquier fila para ver el borrador en pantalla completa
        </p>
      </ScrollArea>
    </div>
  );
}

export default MonitorDraftList;
