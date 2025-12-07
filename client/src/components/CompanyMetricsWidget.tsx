import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { TrendingUp, Users, Ticket, Bot, Loader2 } from 'lucide-react';

interface CompanyMetricsWidgetProps {
  companyId: number;
  companyName: string;
}

export function CompanyMetricsWidget({ companyId, companyName }: CompanyMetricsWidgetProps) {
  const { data: metrics, isLoading } = trpc.analytics.companyMetrics.useQuery({ companyId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas de {companyName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Métricas de {companyName}
        </CardTitle>
        <CardDescription>
          Resumen ejecutivo de rendimiento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Leads Metrics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-purple-500" />
              Leads
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{metrics.leads.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Calificados</span>
                <span className="font-medium">{metrics.leads.qualified}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Convertidos</span>
                <span className="font-medium">{metrics.leads.converted}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Tasa de conversión</span>
                <Badge variant="secondary">
                  {metrics.leads.conversionRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score promedio</span>
                <Badge variant="outline">
                  {metrics.leads.avgQualificationScore}/100
                </Badge>
              </div>
            </div>
          </div>

          {/* Tickets Metrics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Ticket className="h-4 w-4 text-green-500" />
              Tickets
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{metrics.tickets.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Abiertos</span>
                <span className="font-medium">{metrics.tickets.open}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resueltos</span>
                <span className="font-medium">{metrics.tickets.resolved}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Tasa de resolución</span>
                <Badge variant="secondary">
                  {metrics.tickets.resolutionRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tiempo promedio</span>
                <Badge variant="outline">
                  {metrics.tickets.avgResolutionTime}h
                </Badge>
              </div>
            </div>
          </div>

          {/* Agents Metrics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-blue-500" />
              Agentes
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{metrics.agents.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Activos</span>
                <Badge variant="default">
                  {metrics.agents.active}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Inactivos</span>
                <span className="font-medium">
                  {metrics.agents.total - metrics.agents.active}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
