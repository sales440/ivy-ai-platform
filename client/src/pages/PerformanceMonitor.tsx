import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Cpu, Database, HardDrive, RefreshCw, Server, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PerformanceMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: healthData, refetch: refetchHealth } = trpc.performance.getHealthStatus.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  });
  
  const { data: historyData } = trpc.performance.getHistory.useQuery(
    { limit: 50 },
    { refetchInterval: autoRefresh ? 10000 : false }
  );
  
  const collectNow = trpc.performance.collectNow.useMutation({
    onSuccess: () => {
      refetchHealth();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "healthy":
        return "Saludable";
      case "degraded":
        return "Degradado";
      case "critical":
        return "Crítico";
      default:
        return "Desconocido";
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Prepare chart data
  const chartData = historyData?.map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    cpu: Math.round(m.cpu.usage),
    memory: Math.round(m.memory.usagePercent),
    dbResponseTime: m.database.responseTime,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="w-8 h-8 text-cyan-400" />
              Monitor de Rendimiento
            </h1>
            <p className="text-gray-400 mt-1">
              Monitoreo en tiempo real del rendimiento del sistema
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-cyan-500/10 border-cyan-500" : ""}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => collectNow.mutate()}
              disabled={collectNow.isPending}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Recolectar Ahora
            </Button>
          </div>
        </div>

        {/* Status Overview */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Estado General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(healthData.status)}`} />
                  <span className="text-2xl font-bold">{getStatusText(healthData.status)}</span>
                </div>
                {healthData.anomalies.total > 0 && (
                  <p className="text-sm text-gray-400 mt-2">
                    {healthData.anomalies.critical > 0 && (
                      <Badge variant="destructive" className="mr-1">
                        {healthData.anomalies.critical} críticas
                      </Badge>
                    )}
                    {healthData.anomalies.warning > 0 && (
                      <Badge variant="secondary">
                        {healthData.anomalies.warning} advertencias
                      </Badge>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  CPU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.metrics.cpu.toFixed(1)}%</div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      healthData.metrics.cpu > 90 ? "bg-red-500" :
                      healthData.metrics.cpu > 70 ? "bg-yellow-500" : "bg-cyan-500"
                    }`}
                    style={{ width: `${Math.min(healthData.metrics.cpu, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Memoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.metrics.memory.toFixed(1)}%</div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      healthData.metrics.memory > 90 ? "bg-red-500" :
                      healthData.metrics.memory > 75 ? "bg-yellow-500" : "bg-cyan-500"
                    }`}
                    style={{ width: `${Math.min(healthData.metrics.memory, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Base de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.metrics.database}ms</div>
                <p className="text-xs text-gray-400 mt-1">Tiempo de respuesta</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(healthData.metrics.uptime)}</div>
                <p className="text-xs text-gray-400 mt-1">Tiempo activo</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>CPU & Memoria</CardTitle>
              <CardDescription>Últimos 50 puntos de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                    labelStyle={{ color: "#F3F4F6" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#06B6D4" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#8B5CF6" name="Memoria %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Tiempo de Respuesta DB</CardTitle>
              <CardDescription>Latencia de base de datos (ms)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                    labelStyle={{ color: "#F3F4F6" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="dbResponseTime" stroke="#10B981" name="Latencia (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
