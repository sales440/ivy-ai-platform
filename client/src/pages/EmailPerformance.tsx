/**
 * Email Performance Dashboard
 * Visualizes email campaign metrics for EPM Construcciones
 * - Open rates, click rates, response rates by sector
 * - Campaign performance over time
 * - Template effectiveness comparison
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCompany } from "@/contexts/CompanyContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, TrendingUp, MousePointer, MessageSquare, RefreshCw, AlertCircle, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailPerformance() {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

  const [refreshing, setRefreshing] = useState(false);

  // Fetch overall metrics
  const { data: overallMetrics, refetch: refetchOverall, isLoading: loadingOverall } = trpc.emailTracking.getOverallMetrics.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  // Fetch metrics by sector
  const { data: sectorMetrics, refetch: refetchSector, isLoading: loadingSector } = trpc.emailTracking.getMetricsBySector.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchOverall(), refetchSector()]);
    setRefreshing(false);
  };

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Selecciona una empresa</h2>
          <p className="text-muted-foreground">
            Por favor selecciona una empresa desde el selector en el header para ver métricas de email.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const loading = loadingOverall || loadingSector;

  // Calculate sector colors
  const sectorColors: Record<string, string> = {
    educativo: "bg-blue-500",
    hotelero: "bg-purple-500",
    residencial: "bg-green-500",
    otro: "bg-gray-500",
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Performance de Emails</h1>
            <p className="text-muted-foreground">
              Métricas de apertura, clicks y respuestas de campañas de email
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Overall Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : overallMetrics?.totalSent || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de emails enviados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${overallMetrics?.openRate.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {overallMetrics?.totalOpens || 0} emails abiertos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${overallMetrics?.clickRate.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {overallMetrics?.totalClicks || 0} clicks registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : `${overallMetrics?.responseRate.toFixed(1) || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {overallMetrics?.totalResponses || 0} respuestas recibidas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sector Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance por Sector
            </CardTitle>
            <CardDescription>
              Métricas de email desglosadas por sector (educativo, hotelero, residencial)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando métricas...</div>
            ) : !sectorMetrics || Object.keys(sectorMetrics).length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay datos de email disponibles. Envía tu primera campaña para ver métricas aquí.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Sector Metrics Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Sector</th>
                        <th className="text-right p-3 font-semibold">Enviados</th>
                        <th className="text-right p-3 font-semibold">Tasa Apertura</th>
                        <th className="text-right p-3 font-semibold">Tasa Clicks</th>
                        <th className="text-right p-3 font-semibold">Tasa Respuesta</th>
                        <th className="text-right p-3 font-semibold">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(sectorMetrics).map(([sector, metrics]) => {
                        const performance = 
                          metrics.openRate >= 30 ? 'Excelente' :
                          metrics.openRate >= 20 ? 'Bueno' :
                          metrics.openRate >= 10 ? 'Regular' : 'Bajo';
                        
                        const performanceColor =
                          performance === 'Excelente' ? 'bg-green-100 text-green-800' :
                          performance === 'Bueno' ? 'bg-blue-100 text-blue-800' :
                          performance === 'Regular' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800';

                        return (
                          <tr key={sector} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${sectorColors[sector] || sectorColors.otro}`} />
                                <span className="font-medium capitalize">{sector}</span>
                              </div>
                            </td>
                            <td className="text-right p-3">{metrics.totalSent}</td>
                            <td className="text-right p-3 font-semibold">{metrics.openRate.toFixed(1)}%</td>
                            <td className="text-right p-3 font-semibold">{metrics.clickRate.toFixed(1)}%</td>
                            <td className="text-right p-3 font-semibold">{metrics.responseRate.toFixed(1)}%</td>
                            <td className="text-right p-3">
                              <Badge className={performanceColor}>{performance}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Visual Bar Chart */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Comparación Visual de Tasas de Apertura</h4>
                  {Object.entries(sectorMetrics).map(([sector, metrics]) => (
                    <div key={sector} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{sector}</span>
                        <span className="text-muted-foreground">{metrics.openRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${sectorColors[sector] || sectorColors.otro} transition-all duration-500`}
                          style={{ width: `${Math.min(metrics.openRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Insights y Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900">
            <div>
              <strong>📊 Benchmarks de la Industria:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Tasa de apertura promedio: 20-25%</li>
                <li>Tasa de clicks promedio: 2-5%</li>
                <li>Tasa de respuesta promedio: 1-3%</li>
              </ul>
            </div>

            <div>
              <strong>🎯 Datos Históricos de EPM:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Educativo:</strong> 26.7% conversión, ticket $45K MXN, 21 días cierre</li>
                <li><strong>Hotelero:</strong> 44.4% conversión, ticket $80K MXN, 14 días cierre</li>
                <li><strong>Residencial:</strong> 46.9% conversión, ticket $50K MXN, 28 días cierre</li>
              </ul>
            </div>

            <div>
              <strong>✨ Recomendaciones:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Si tasa de apertura {'<'} 15%: Mejorar asuntos de email (más específicos, menos genéricos)</li>
                <li>Si tasa de clicks {'<'} 2%: Agregar CTAs más claros y links relevantes</li>
                <li>Si tasa de respuesta {'<'} 1%: Personalizar más el contenido por sector</li>
                <li>Mejor día para enviar: Martes-Jueves, 9-11am horario local</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Time to Open Metric */}
        {overallMetrics && overallMetrics.avgTimeToOpen > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>⏱️ Tiempo Promedio de Apertura</CardTitle>
              <CardDescription>
                Cuánto tiempo tardan los leads en abrir los emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center py-4">
                {overallMetrics.avgTimeToOpen} minutos
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Tiempo promedio desde envío hasta primera apertura
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
