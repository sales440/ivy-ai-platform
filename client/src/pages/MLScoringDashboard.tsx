/**
 * ML Scoring Dashboard - Analytics and metrics for predictive lead scoring
 * Shows scoring distribution, sector performance, and top-scored leads
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useCompany } from "@/contexts/CompanyContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Target, Award, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function MLScoringDashboard() {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id ? Number(selectedCompany.id) : undefined;

  // Query company stats
  const { data: stats, isLoading, refetch } = trpc.mlScoring.getCompanyStats.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  const handleRefresh = () => {
    refetch();
    toast.success("Métricas actualizadas");
  };

  if (!companyId) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Selecciona una empresa</h2>
          <p className="text-muted-foreground">
            Por favor selecciona una empresa desde el selector en el header para ver las métricas de scoring.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats || stats.totalLeads === 0) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No hay datos de scoring</h2>
          <p className="text-muted-foreground mb-4">
            Aún no hay leads con scoring predictivo para esta empresa.
          </p>
          <Button onClick={() => window.location.href = "/leads"}>
            Ir a Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare data for charts
  const distributionData = [
    { name: "Crítico", value: stats.distribution.critical, color: "#ef4444" },
    { name: "Alto", value: stats.distribution.high, color: "#f97316" },
    { name: "Medio", value: stats.distribution.medium, color: "#eab308" },
    { name: "Bajo", value: stats.distribution.low, color: "#22c55e" }
  ];

  const sectorData = Object.entries(stats.sectorBreakdown).map(([sector, data]) => ({
    sector: sector.charAt(0).toUpperCase() + sector.slice(1),
    count: data.count,
    avgScore: data.avgScore
  }));

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Scoring ML</h1>
            <p className="text-muted-foreground">
              Métricas predictivas de scoring para {selectedCompany?.name}
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Leads con scoring predictivo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}</div>
              <p className="text-xs text-muted-foreground">
                De 100 puntos posibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.distribution.critical + stats.distribution.high}
              </div>
              <p className="text-xs text-muted-foreground">
                Leads críticos y altos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversión Esperada</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((stats.avgScore / 100) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Basado en score promedio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Prioridad</CardTitle>
              <CardDescription>
                Clasificación de leads por nivel de prioridad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sector Performance Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Sector</CardTitle>
              <CardDescription>
                Score promedio y cantidad de leads por sector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgScore" fill="#8884d8" name="Score Promedio" />
                  <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Cantidad Leads" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sector Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Desglose por Sector</CardTitle>
            <CardDescription>
              Métricas detalladas de scoring por sector de negocio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectorData.map((sector) => (
                <div key={sector.sector} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold">{sector.sector}</h3>
                      <p className="text-sm text-muted-foreground">
                        {sector.count} leads en este sector
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{sector.avgScore}</div>
                      <p className="text-xs text-muted-foreground">Score promedio</p>
                    </div>
                    <Badge variant={sector.avgScore >= 70 ? "default" : sector.avgScore >= 50 ? "secondary" : "outline"}>
                      {sector.avgScore >= 70 ? "Alto" : sector.avgScore >= 50 ? "Medio" : "Bajo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Acerca del Scoring Predictivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>El sistema de scoring ML</strong> utiliza 7 factores para predecir la probabilidad de cierre:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Sector de negocio (25% peso) - Basado en tasas históricas de conversión</li>
              <li>Tamaño de instalación (15% peso) - Mayor tamaño = mayor potencial</li>
              <li>Presupuesto disponible (20% peso) - Alineación con ticket promedio</li>
              <li>Autoridad del contacto (18% peso) - Seniority y poder de decisión</li>
              <li>Nivel de engagement (12% peso) - Interacción con emails y sitio web</li>
              <li>Indicadores de urgencia (5% peso) - Emergencias y estacionalidad</li>
              <li>Contexto histórico (5% peso) - Cliente previo o referido</li>
            </ul>
            <p className="pt-2">
              <strong>Datos históricos de EPM Construcciones:</strong> Educativo 26.7%, Hotelero 44.4%, Residencial 46.9%
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
