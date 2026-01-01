import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Bot, Activity, AlertCircle, CheckCircle2, Clock, Play, Square } from "lucide-react";
import { APP_TITLE } from "@/const";

export default function RopaDashboard() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.ropa.getDashboardStats.useQuery(undefined, {
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: status } = trpc.ropa.getStatus.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const { data: tasks } = trpc.ropa.getTasks.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: chatHistory, refetch: refetchChat } = trpc.ropa.getChatHistory.useQuery();

  const { data: alerts } = trpc.ropa.getAlerts.useQuery(undefined, {
    refetchInterval: 10000,
  });

  // Mutations
  const sendChatMutation = trpc.ropa.sendChatMessage.useMutation({
    onSuccess: () => {
      refetchChat();
      setMessage("");
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const startMutation = trpc.ropa.start.useMutation();
  const stopMutation = trpc.ropa.stop.useMutation();
  const runAuditMutation = trpc.ropa.runAudit.useMutation();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    sendChatMutation.mutate({ message });
  };

  const getStatusColor = (statusValue?: string) => {
    if (statusValue === "running") return "bg-green-500";
    if (statusValue === "idle") return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getHealthColor = (health?: string) => {
    if (health === "healthy") return "text-green-500";
    if (health === "degraded") return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bot className="w-10 h-10 text-indigo-400" />
              <h1 className="text-4xl font-bold">ROPA Dashboard</h1>
            </div>
            <p className="text-slate-400">Sistema autónomo de IA manteniendo {APP_TITLE} 24/7</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => stopMutation.mutate()}
              disabled={!status?.isRunning}
              className="bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => runAuditMutation.mutate()}
              disabled={runAuditMutation.isPending}
              className="bg-indigo-500/10 border-indigo-500/50 hover:bg-indigo-500/20"
            >
              {runAuditMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Run Audit
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status?.status)} animate-pulse`} />
              <div>
                <div className="text-2xl font-bold">{status?.isRunning ? "RUNNING" : "STOPPED"}</div>
                <div className="text-xs text-slate-400">Autonomous mode {status?.isRunning ? "active" : "inactive"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Activity className={`w-6 h-6 ${getHealthColor(stats?.platform.health)}`} />
              <div>
                <div className="text-2xl font-bold">{stats?.platform.health || "checking..."}</div>
                <div className="text-xs text-slate-400">
                  {stats?.platform.criticalIssues || 0} critical issues
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">TypeScript Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats?.typescript.errors || 0}</div>
                <div className="text-xs text-slate-400">{stats?.typescript.fixedToday || 0} fixed today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-400" />
              <div>
                <div className="text-2xl font-bold">{stats?.tasks.completed || 0}</div>
                <div className="text-xs text-slate-400">{stats?.tasks.running || 0} running now</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="bg-slate-900 border-slate-800">
            <TabsTrigger value="chat">💬 Chat</TabsTrigger>
            <TabsTrigger value="tasks">
              ⏰ Tasks ({stats?.tasks.running || 0})
            </TabsTrigger>
            <TabsTrigger value="alerts">
              ⚠️ Alerts ({alerts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="health">📊 Health</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Chat with ROPA</CardTitle>
                <CardDescription>Interact with the autonomous AI agent</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] mb-4 p-4 bg-slate-950 rounded-lg">
                  {chatHistory && chatHistory.length > 0 ? (
                    <div className="space-y-4">
                      {chatHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-100"
                            }`}
                          >
                            <div className="text-xs opacity-70 mb-1">
                              {msg.role === "user" ? "You" : "ROPA"}
                            </div>
                            <div className="whitespace-pre-wrap">{msg.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-20">
                      No messages yet. Start a conversation with ROPA!
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask ROPA anything..."
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting || !message.trim()}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Tasks executed by ROPA</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {tasks && tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{task.type}</span>
                            <Badge
                              variant={
                                task.status === "completed"
                                  ? "default"
                                  : task.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400">
                            {task.createdAt && new Date(task.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 py-20">No tasks yet</div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Active alerts and warnings</CardDescription>
              </CardHeader>
              <CardContent>
                {alerts && alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-start gap-3">
                          <AlertCircle
                            className={`w-5 h-5 ${
                              alert.severity === "critical"
                                ? "text-red-500"
                                : alert.severity === "error"
                                ? "text-orange-500"
                                : "text-yellow-500"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="font-medium mb-1">{alert.title}</div>
                            <div className="text-sm text-slate-400">{alert.message}</div>
                            <div className="text-xs text-slate-500 mt-2">
                              {alert.createdAt && new Date(alert.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-20">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <div>No active alerts - All systems operational</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>System Health Metrics</CardTitle>
                <CardDescription>Real-time platform health monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Success Rate</span>
                      <span className="text-2xl font-bold text-green-500">
                        {stats?.performance.successRate || 100}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${stats?.performance.successRate || 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Avg Response Time</span>
                      <span className="text-2xl font-bold text-indigo-400">
                        {stats?.performance.avgResponseTime || 0}ms
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Total Tasks</span>
                      <span className="text-2xl font-bold">{stats?.tasks.total || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-sm text-slate-500">
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
        <div className="mt-1">
          ROPA v2.0 • 50+ Tools • Auto-refresh: ON
        </div>
      </div>
    </div>
  );
}
