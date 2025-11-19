import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  GraduationCap,
  Home,
  Hotel,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

/**
 * EPM Construcciones - Executive Dashboard
 * 
 * Personalized dashboard for EPM showing metrics by sector:
 * - Educational (schools, universities)
 * - Hotel (hotels, resorts)
 * - Residential (condos, apartments)
 */
export default function EPMDashboard() {
  const { user, loading } = useAuth();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [selectedSector, setSelectedSector] = useState<"all" | "educational" | "hotel" | "residential">("all");

  // Mock data - In production, this would come from tRPC queries
  const metrics = {
    educational: {
      leads: 45,
      qualified: 28,
      converted: 12,
      revenue: 540000,
      avgDeal: 45000,
      responseTime: "2.3h",
    },
    hotel: {
      leads: 18,
      qualified: 15,
      converted: 8,
      revenue: 640000,
      avgDeal: 80000,
      responseTime: "0.8h",
    },
    residential: {
      leads: 32,
      qualified: 20,
      converted: 15,
      revenue: 750000,
      avgDeal: 50000,
      responseTime: "3.1h",
    },
  };

  const totalMetrics = {
    leads: metrics.educational.leads + metrics.hotel.leads + metrics.residential.leads,
    qualified: metrics.educational.qualified + metrics.hotel.qualified + metrics.residential.qualified,
    converted: metrics.educational.converted + metrics.hotel.converted + metrics.residential.converted,
    revenue: metrics.educational.revenue + metrics.hotel.revenue + metrics.residential.revenue,
  };

  const conversionRate = ((totalMetrics.converted / totalMetrics.leads) * 100).toFixed(1);
  const qualificationRate = ((totalMetrics.qualified / totalMetrics.leads) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Ejecutivo EPM</h1>
            <p className="text-muted-foreground">
              Panel de control personalizado para EPM Construcciones SA de CV
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={selectedSector} onValueChange={(v: any) => setSelectedSector(v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sectores</SelectItem>
                <SelectItem value="educational">🎓 Educativo</SelectItem>
                <SelectItem value="hotel">🏨 Hotelero</SelectItem>
                <SelectItem value="residential">🏠 Residencial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rango de tiempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMetrics.leads}</div>
              <p className="text-xs text-muted-foreground">
                {totalMetrics.qualified} calificados ({qualificationRate}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalMetrics.converted} contratos cerrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalMetrics.revenue / 1000).toFixed(0)}K MXN
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio: ${(totalMetrics.revenue / totalMetrics.converted / 1000).toFixed(0)}K por contrato
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.1h</div>
              <p className="text-xs text-muted-foreground">
                Promedio ponderado por sector
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sector Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Educational Sector */}
          <Card className={selectedSector === "all" || selectedSector === "educational" ? "" : "opacity-50"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                <CardTitle>Sector Educativo</CardTitle>
              </div>
              <CardDescription>Escuelas, universidades, centros educativos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Leads</span>
                <span className="font-semibold">{metrics.educational.leads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Calificados</span>
                <span className="font-semibold">{metrics.educational.qualified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Convertidos</span>
                <span className="font-semibold text-green-600">{metrics.educational.converted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ingresos</span>
                <span className="font-semibold">${(metrics.educational.revenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ticket promedio</span>
                <span className="font-semibold">${(metrics.educational.avgDeal / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tiempo respuesta</span>
                <span className="font-semibold">{metrics.educational.responseTime}</span>
              </div>
              <div className="pt-2">
                <div className="text-xs text-muted-foreground mb-1">Tasa de conversión</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(metrics.educational.converted / metrics.educational.leads) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-right mt-1">
                  {((metrics.educational.converted / metrics.educational.leads) * 100).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hotel Sector */}
          <Card className={selectedSector === "all" || selectedSector === "hotel" ? "" : "opacity-50"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-purple-500" />
                <CardTitle>Sector Hotelero</CardTitle>
              </div>
              <CardDescription>Hoteles, resorts, moteles, casas de huéspedes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Leads</span>
                <span className="font-semibold">{metrics.hotel.leads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Calificados</span>
                <span className="font-semibold">{metrics.hotel.qualified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Convertidos</span>
                <span className="font-semibold text-green-600">{metrics.hotel.converted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ingresos</span>
                <span className="font-semibold">${(metrics.hotel.revenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ticket promedio</span>
                <span className="font-semibold">${(metrics.hotel.avgDeal / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tiempo respuesta</span>
                <span className="font-semibold">{metrics.hotel.responseTime}</span>
              </div>
              <div className="pt-2">
                <div className="text-xs text-muted-foreground mb-1">Tasa de conversión</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(metrics.hotel.converted / metrics.hotel.leads) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-right mt-1">
                  {((metrics.hotel.converted / metrics.hotel.leads) * 100).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Residential Sector */}
          <Card className={selectedSector === "all" || selectedSector === "residential" ? "" : "opacity-50"}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-green-500" />
                <CardTitle>Sector Residencial</CardTitle>
              </div>
              <CardDescription>Condominios, fraccionamientos, residencias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Leads</span>
                <span className="font-semibold">{metrics.residential.leads}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Calificados</span>
                <span className="font-semibold">{metrics.residential.qualified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Convertidos</span>
                <span className="font-semibold text-green-600">{metrics.residential.converted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ingresos</span>
                <span className="font-semibold">${(metrics.residential.revenue / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ticket promedio</span>
                <span className="font-semibold">${(metrics.residential.avgDeal / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tiempo respuesta</span>
                <span className="font-semibold">{metrics.residential.responseTime}</span>
              </div>
              <div className="pt-2">
                <div className="text-xs text-muted-foreground mb-1">Tasa de conversión</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(metrics.residential.converted / metrics.residential.leads) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-right mt-1">
                  {((metrics.residential.converted / metrics.residential.leads) * 100).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline por Sector</CardTitle>
            <CardDescription>Estado actual de oportunidades en cada sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Educational Pipeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Educativo</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics.educational.leads} leads → {metrics.educational.converted} contratos
                  </span>
                </div>
                <div className="flex gap-1 h-8">
                  <div className="bg-gray-200 flex-1 rounded-l flex items-center justify-center text-xs">
                    Nuevos<br/>{metrics.educational.leads - metrics.educational.qualified}
                  </div>
                  <div className="bg-blue-300 flex-1 flex items-center justify-center text-xs">
                    Calificados<br/>{metrics.educational.qualified}
                  </div>
                  <div className="bg-blue-500 text-white flex-1 rounded-r flex items-center justify-center text-xs">
                    Convertidos<br/>{metrics.educational.converted}
                  </div>
                </div>
              </div>

              {/* Hotel Pipeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Hotel className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Hotelero</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics.hotel.leads} leads → {metrics.hotel.converted} contratos
                  </span>
                </div>
                <div className="flex gap-1 h-8">
                  <div className="bg-gray-200 flex-1 rounded-l flex items-center justify-center text-xs">
                    Nuevos<br/>{metrics.hotel.leads - metrics.hotel.qualified}
                  </div>
                  <div className="bg-purple-300 flex-1 flex items-center justify-center text-xs">
                    Calificados<br/>{metrics.hotel.qualified}
                  </div>
                  <div className="bg-purple-500 text-white flex-1 rounded-r flex items-center justify-center text-xs">
                    Convertidos<br/>{metrics.hotel.converted}
                  </div>
                </div>
              </div>

              {/* Residential Pipeline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Residencial</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {metrics.residential.leads} leads → {metrics.residential.converted} contratos
                  </span>
                </div>
                <div className="flex gap-1 h-8">
                  <div className="bg-gray-200 flex-1 rounded-l flex items-center justify-center text-xs">
                    Nuevos<br/>{metrics.residential.leads - metrics.residential.qualified}
                  </div>
                  <div className="bg-green-300 flex-1 flex items-center justify-center text-xs">
                    Calificados<br/>{metrics.residential.qualified}
                  </div>
                  <div className="bg-green-500 text-white flex-1 rounded-r flex items-center justify-center text-xs">
                    Convertidos<br/>{metrics.residential.converted}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas para gestionar leads y servicios de EPM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                Ver Leads Activos
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Servicios Programados
              </Button>
              <Button variant="outline" className="justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reporte Mensual
              </Button>
              <Button variant="outline" className="justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Gestionar Clientes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
