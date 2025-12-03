/**
 * Communications Dashboard - Ivy-Call Management Interface
 * Displays all voice, SMS, and WhatsApp communications
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, MessageCircle, TrendingUp, DollarSign, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function CommunicationsDashboard() {
  const { selectedCompany } = useCompany();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.communication.getDashboardStats.useQuery(
    { companyId: selectedCompany?.id || 1 },
    { enabled: !!selectedCompany, refetchInterval: 30000 }
  );

  // Fetch Ivy-Call KPIs
  const { data: ivyCallKPIs } = trpc.communication.getIvyCallKPIs.useQuery(undefined, {
    refetchInterval: 30000
  });

  // Fetch costs
  const { data: costs } = trpc.communication.getCosts.useQuery(
    { companyId: selectedCompany?.id || 1 },
    { enabled: !!selectedCompany }
  );

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Communications Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona todas las comunicaciones multicanal de Ivy-Call
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.calls.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.calls.successRate.toFixed(1)}% tasa de éxito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SMS</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sms.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.sms.deliveryRate.toFixed(1)}% entregados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costs?.total.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ivy-Call Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={ivyCallKPIs?.status === 'active' ? 'default' : 'secondary'}>
                {ivyCallKPIs?.status || 'idle'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {ivyCallKPIs?.kpis.leads_contacted || 0} leads contactados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Costos</CardTitle>
          <CardDescription>Costos por canal de comunicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Voice</p>
                <p className="text-2xl font-bold">${costs?.voice.toFixed(2) || '0.00'}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SMS</p>
                <p className="text-2xl font-bold">${costs?.sms.toFixed(2) || '0.00'}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                <p className="text-2xl font-bold">${costs?.whatsapp.toFixed(2) || '0.00'}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different communication types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Llamadas</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas 10 comunicaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentCalls.slice(0, 5).map((call: any) => (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{call.to}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(call.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      call.status === 'completed' ? 'default' :
                      call.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {call.status}
                    </Badge>
                  </div>
                ))}
                {stats?.recentSMS.slice(0, 5).map((sms: any) => (
                  <div key={sms.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{sms.to}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sms.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      sms.status === 'delivered' ? 'default' :
                      sms.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {sms.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <CallsTab companyId={selectedCompany?.id || 1} />
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <SMSTab companyId={selectedCompany?.id || 1} />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppTab companyId={selectedCompany?.id || 1} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Calls Tab Component
 */
function CallsTab({ companyId }: { companyId: number }) {
  const { data: calls, isLoading } = trpc.communication.getCallHistory.useQuery(
    { companyId, limit: 50 },
    { refetchInterval: 30000 }
  );

  if (isLoading) {
    return <div>Cargando llamadas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Llamadas</CardTitle>
        <CardDescription>{calls?.length || 0} llamadas registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {calls?.map((call: any) => (
            <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <p className="font-medium">{call.to}</p>
                  <Badge variant="outline">{call.direction}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {call.duration ? `${call.duration}s` : 'No contestada'} • {new Date(call.createdAt).toLocaleString()}
                </p>
                {call.sentiment && (
                  <Badge variant="secondary" className="mt-2">
                    Sentimiento: {call.sentiment}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  call.status === 'completed' ? 'default' :
                  call.status === 'failed' ? 'destructive' : 'secondary'
                }>
                  {call.status}
                </Badge>
                {call.cost && (
                  <span className="text-sm text-muted-foreground">${call.cost}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SMS Tab Component
 */
function SMSTab({ companyId }: { companyId: number }) {
  const { data: messages, isLoading } = trpc.communication.getSMSHistory.useQuery(
    { companyId, limit: 50 },
    { refetchInterval: 30000 }
  );

  const sendSMS = trpc.communication.sendSMS.useMutation({
    onSuccess: () => {
      toast.success('SMS enviado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  if (isLoading) {
    return <div>Cargando mensajes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de SMS</CardTitle>
        <CardDescription>{messages?.length || 0} mensajes registrados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {messages?.map((sms: any) => (
            <div key={sms.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <p className="font-medium">{sms.to}</p>
                  <Badge variant="outline">{sms.direction}</Badge>
                </div>
                <p className="text-sm mt-2">{sms.body}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(sms.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  sms.status === 'delivered' ? 'default' :
                  sms.status === 'failed' ? 'destructive' : 'secondary'
                }>
                  {sms.status}
                </Badge>
                {sms.cost && (
                  <span className="text-sm text-muted-foreground">${sms.cost}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * WhatsApp Tab Component
 */
function WhatsAppTab({ companyId }: { companyId: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversaciones de WhatsApp</CardTitle>
        <CardDescription>Próximamente</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Las conversaciones de WhatsApp estarán disponibles próximamente.
        </p>
      </CardContent>
    </Card>
  );
}
