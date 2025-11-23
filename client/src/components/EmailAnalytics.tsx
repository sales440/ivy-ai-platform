import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, TrendingUp, MousePointerClick, AlertCircle } from "lucide-react";

/**
 * Email Analytics Component
 * Displays SendGrid email performance metrics
 */
export default function EmailAnalytics() {
  // Fetch recent email stats (last 30 days)
  const { data: statsData, isLoading } = trpc.emailAnalytics.getRecentStats.useQuery({
    days: 30,
  });

  const stats = statsData?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Analytics (30 días)</CardTitle>
          <CardDescription>Cargando métricas de SendGrid...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Analytics (30 días)</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Email Analytics (30 días)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Sent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDelivered.toLocaleString()} entregados ({stats.deliveryRate.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        {/* Open Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOpens.toLocaleString()} aperturas únicas
            </p>
          </CardContent>
        </Card>

        {/* Click Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Clics</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClicks.toLocaleString()} clics únicos
            </p>
          </CardContent>
        </Card>

        {/* Bounce Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Rebote</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBounces.toLocaleString()} rebotes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Performance</CardTitle>
          <CardDescription>Métricas clave de los últimos 30 días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Emails Enviados</span>
              <span className="font-medium">{stats.totalSent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Emails Entregados</span>
              <span className="font-medium">{stats.totalDelivered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Aperturas Únicas</span>
              <span className="font-medium">{stats.totalOpens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Clics Únicos</span>
              <span className="font-medium">{stats.totalClicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rebotes</span>
              <span className="font-medium text-red-600">{stats.totalBounces.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reportes de Spam</span>
              <span className="font-medium text-red-600">{stats.totalSpamReports.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
