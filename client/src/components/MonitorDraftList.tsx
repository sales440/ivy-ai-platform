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
} from "lucide-react";
import { Draft, DraftType } from "./MonitorDraftPopup";

interface MonitorDraftListProps {
  drafts: Draft[];
  onDoubleClick: (draft: Draft) => void;
  onApprove: (draftId: string) => void;
  onReject: (draftId: string) => void;
  filterType?: DraftType | 'all';
  filterStatus?: 'pending' | 'approved' | 'rejected' | 'sent' | 'all';
}

export function MonitorDraftList({
  drafts,
  onDoubleClick,
  onApprove,
  onReject,
  filterType = 'all',
  filterStatus = 'all',
}: MonitorDraftListProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filteredDrafts = drafts.filter((draft) => {
    if (filterType !== 'all' && draft.type !== filterType) return false;
    if (filterStatus !== 'all' && draft.status !== filterStatus) return false;
    return true;
  });

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
            <CheckCircle2 className="w-3 h-3 mr-1" />
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
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
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
                  : 'hover:bg-slate-800/50'
              }`}
              onMouseEnter={() => setHoveredRow(draft.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onDoubleClick={() => onDoubleClick(draft)}
            >
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
  );
}

export default MonitorDraftList;
