import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, Mail, Phone, Search, Building2,
  BarChart3, Target, Zap, RefreshCw, AlertCircle,
  CheckCircle2, Clock, Send
} from "lucide-react";
import { toast } from "sonner";

interface CompanyROI {
  id: number;
  name: string;
  industry: string;
  sender_email: string;
  total_campaigns: number;
  total_drafts: number;
  emails_sent: number;
  emails_approved: number;
  emails_draft: number;
  last_activity: string;
}

function ROIMetricCard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="bg-[#0f1629] border-[#1e2d4a]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AISearchPanel() {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results, isLoading } = trpc.ropa.aiSearch.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const handleSearch = () => {
    if (query.trim().length > 2) setSearchQuery(query.trim());
  };

  return (
    <Card className="bg-[#0f1629] border-[#1e2d4a]">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Search className="w-4 h-4 text-cyan-400" />
          Búsqueda Semántica con IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Busca campañas, empresas, emails... ej: 'campañas activas de PET LIFE'"
            className="bg-[#1a2540] border-[#2a3a5c] text-white placeholder:text-gray-500"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {results && (
          <div className="space-y-2">
            {results.summary && (
              <p className="text-xs text-gray-400 mb-3 italic">{results.summary}</p>
            )}
            {results.results?.map((r: { type: string; name: string; description: string; relevance: number; action: string }, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#1a2540] rounded-lg border border-[#2a3a5c]">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  r.relevance > 0.8 ? 'bg-green-400' : r.relevance > 0.5 ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">{r.name}</span>
                    <Badge variant="outline" className="text-xs border-[#2a3a5c] text-gray-400">
                      {r.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{r.description}</p>
                  {r.action && (
                    <p className="text-xs text-cyan-400 mt-1">→ {r.action}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {Math.round(r.relevance * 100)}%
                </span>
              </div>
            ))}
            {results.results?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No se encontraron resultados para esa búsqueda.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VoiceAIPanel({ companies }: { companies: CompanyROI[] }) {
  const [selectedCompany, setSelectedCompany] = useState<CompanyROI | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");

  const generateScript = trpc.ropa.generateCallScript.useMutation({
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      toast.success("Script generado por ROPA");
    },
    onError: () => toast.error("Error al generar el script")
  });

  const initiateCall = trpc.ropa.initiateVoiceCall.useMutation({
    onSuccess: (data) => {
      if (data.method === "simulated") {
        toast.info("Script listo para llamada manual (Twilio no configurado)");
      } else {
        toast.success(`Llamada iniciada via ${data.method}`);
      }
    },
    onError: () => toast.error("Error al iniciar la llamada")
  });

  return (
    <Card className="bg-[#0f1629] border-[#1e2d4a]">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Phone className="w-4 h-4 text-green-400" />
          Voice AI — Llamadas Salientes
          <Badge className="bg-green-900 text-green-300 text-xs ml-auto">ROPA™</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-400">
          ROPA genera scripts personalizados con IA y puede iniciar llamadas automáticas via Twilio cuando un lead no responde a 2+ emails.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Empresa</label>
            <select
              className="w-full bg-[#1a2540] border border-[#2a3a5c] text-white text-sm rounded-md p-2"
              onChange={(e) => {
                const c = companies.find(c => c.id === parseInt(e.target.value));
                setSelectedCompany(c || null);
              }}
            >
              <option value="">Seleccionar empresa</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nombre del lead</label>
            <Input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Ej: María García"
              className="bg-[#1a2540] border-[#2a3a5c] text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Teléfono del lead</label>
          <Input
            value={leadPhone}
            onChange={(e) => setLeadPhone(e.target.value)}
            placeholder="+52 55 1234 5678"
            className="bg-[#1a2540] border-[#2a3a5c] text-white text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-[#2a3a5c] text-gray-300 hover:bg-[#1a2540]"
            disabled={!selectedCompany || !leadName || generateScript.isPending}
            onClick={() => {
              if (!selectedCompany || !leadName) return;
              generateScript.mutate({
                companyName: selectedCompany.name,
                industry: selectedCompany.industry || 'General',
                leadName,
                campaignName: `Campaña ${selectedCompany.name}`,
                emailsNotOpened: 2
              });
            }}
          >
            {generateScript.isPending ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
            Generar Script
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-700 hover:bg-green-600 text-white"
            disabled={!selectedCompany || !leadName || !leadPhone || initiateCall.isPending}
            onClick={() => {
              if (!selectedCompany || !leadName || !leadPhone) return;
              initiateCall.mutate({
                companyId: selectedCompany.id,
                companyName: selectedCompany.name,
                industry: selectedCompany.industry || 'General',
                leadName,
                leadPhone,
                campaignName: `Campaña ${selectedCompany.name}`,
                emailsNotOpened: 2
              });
            }}
          >
            {initiateCall.isPending ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
            Llamar
          </Button>
        </div>

        {generatedScript && (
          <div className="mt-3 p-3 bg-[#1a2540] rounded-lg border border-[#2a3a5c]">
            <p className="text-xs text-green-400 font-medium mb-2">Script generado por ROPA:</p>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedScript}</p>
          </div>
        )}

        <div className="flex items-center gap-2 p-2 bg-[#1a2540] rounded border border-[#2a3a5c]">
          <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-gray-400">
            Para llamadas automáticas, configura <code className="text-yellow-300">TWILIO_ACCOUNT_SID</code>, <code className="text-yellow-300">TWILIO_AUTH_TOKEN</code> y <code className="text-yellow-300">TWILIO_FROM_NUMBER</code> en los secretos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ROIDashboard() {
  const { data: roiData, isLoading, refetch } = trpc.ropa.getROIDashboard.useQuery({});

  const companies: CompanyROI[] = (roiData?.companies as CompanyROI[]) || [];
  const totals = roiData?.totals as Record<string, number> || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-[#080d1a] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            ROI Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Métricas reales de campañas por empresa — impulsado por ROPA™</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-[#2a3a5c] text-gray-300 hover:bg-[#1a2540]"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Global Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ROIMetricCard
          title="Campañas Totales"
          value={totals.totalCampaigns || 0}
          subtitle="en todas las empresas"
          icon={Target}
          color="text-cyan-400"
        />
        <ROIMetricCard
          title="Emails Enviados"
          value={totals.totalEmailsSent || 0}
          subtitle="emails reales enviados"
          icon={Send}
          color="text-green-400"
        />
        <ROIMetricCard
          title="Emails Aprobados"
          value={totals.totalEmailsApproved || 0}
          subtitle="listos para envío"
          icon={CheckCircle2}
          color="text-blue-400"
        />
        <ROIMetricCard
          title="Borradores"
          value={totals.totalDrafts || 0}
          subtitle="generados por ROPA"
          icon={Mail}
          color="text-purple-400"
        />
      </div>

      {/* Per Company Table */}
      <Card className="bg-[#0f1629] border-[#1e2d4a]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Métricas por Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No hay datos de empresas aún.</p>
              <p className="text-gray-500 text-sm">Crea empresas y campañas para ver métricas aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2d4a]">
                    <th className="text-left text-gray-400 pb-3 font-medium">Empresa</th>
                    <th className="text-center text-gray-400 pb-3 font-medium">Campañas</th>
                    <th className="text-center text-gray-400 pb-3 font-medium">Borradores</th>
                    <th className="text-center text-gray-400 pb-3 font-medium">Enviados</th>
                    <th className="text-center text-gray-400 pb-3 font-medium">Aprobados</th>
                    <th className="text-center text-gray-400 pb-3 font-medium">Estado</th>
                    <th className="text-right text-gray-400 pb-3 font-medium">Última actividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d4a]">
                  {companies.map((company) => {
                    const sentRate = company.total_drafts > 0
                      ? Math.round((company.emails_sent / company.total_drafts) * 100)
                      : 0;
                    return (
                      <tr key={company.id} className="hover:bg-[#1a2540] transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="text-white font-medium">{company.name}</p>
                            <p className="text-gray-500 text-xs">{company.sender_email || 'Sin email configurado'}</p>
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <span className="text-cyan-400 font-bold">{company.total_campaigns || 0}</span>
                        </td>
                        <td className="text-center py-3">
                          <span className="text-purple-400 font-bold">{company.total_drafts || 0}</span>
                        </td>
                        <td className="text-center py-3">
                          <span className="text-green-400 font-bold">{company.emails_sent || 0}</span>
                        </td>
                        <td className="text-center py-3">
                          <span className="text-blue-400 font-bold">{company.emails_approved || 0}</span>
                        </td>
                        <td className="text-center py-3">
                          <Badge className={
                            sentRate > 50 ? 'bg-green-900 text-green-300' :
                            sentRate > 0 ? 'bg-yellow-900 text-yellow-300' :
                            'bg-gray-800 text-gray-400'
                          }>
                            {sentRate > 50 ? 'Activa' : sentRate > 0 ? 'En progreso' : 'Pendiente'}
                          </Badge>
                        </td>
                        <td className="text-right py-3">
                          <span className="text-gray-400 text-xs flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {company.last_activity
                              ? new Date(company.last_activity).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                              : 'Sin actividad'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row: AI Search + Voice AI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AISearchPanel />
        <VoiceAIPanel companies={companies} />
      </div>
    </div>
  );
}
