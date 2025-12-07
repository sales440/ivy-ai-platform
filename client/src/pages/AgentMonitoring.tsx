import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Activity, Mail, Linkedin, Calendar, Target, FileText, Play, Pause, RefreshCw } from "lucide-react";

/**
 * Agent Monitoring Dashboard
 * 
 * Real-time monitoring of Ivy.AI marketing agents executing self-marketing campaign
 * 
 * Features:
 * - Live agent status (idle, active, error)
 * - Real-time KPI tracking
 * - Workflow execution logs
 * - Performance metrics
 * - Agent health monitoring
 */

export default function AgentMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch agents data
  const { data: agentsData, refetch: refetchAgents } = trpc.agents.listMarketingAgents.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds if auto-refresh is on
  });

  // Fetch recent tasks
  const { data: recentTasks } = trpc.agents.getRecentTasks.useQuery(
    { limit: 20 },
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  // Fetch workflow stats
  const { data: workflowStats } = trpc.agents.getWorkflowStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const agents = agentsData || [];
  const tasks = recentTasks || [];
  const stats = workflowStats || {
    totalEmailsSent: 0,
    totalPostsPublished: 0,
    totalLeadsQualified: 0,
    totalDemosScheduled: 0,
    avgResponseTime: 0,
  };

  const getAgentIcon = (agentId: string) => {
    if (agentId.includes("linkedin")) return <Linkedin className="h-5 w-5" />;
    if (agentId.includes("nurture")) return <Mail className="h-5 w-5" />;
    if (agentId.includes("scheduler")) return <Calendar className="h-5 w-5" />;
    if (agentId.includes("qualifier")) return <Target className="h-5 w-5" />;
    if (agentId.includes("content")) return <FileText className="h-5 w-5" />;
    return <Activity className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "idle":
        return "bg-gray-400";
      case "training":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      idle: "bg-gray-100 text-gray-800",
      training: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.idle}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTaskStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-blue-100 text-blue-800",
      running: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Monitoring Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of Ivy.AI marketing agents executing self-marketing campaign
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {autoRefresh ? "Pause" : "Resume"} Auto-Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={() => refetchAgents()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmailsSent}</div>
            <p className="text-xs text-muted-foreground mt-1">By Ivy-Nurture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posts Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPostsPublished}</div>
            <p className="text-xs text-muted-foreground mt-1">By Ivy-LinkedIn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Qualified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeadsQualified}</div>
            <p className="text-xs text-muted-foreground mt-1">By Ivy-Qualifier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Demos Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDemosScheduled}</div>
            <p className="text-xs text-muted-foreground mt-1">By Ivy-Scheduler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}s</div>
            <p className="text-xs text-muted-foreground mt-1">Across all agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Agents Status</CardTitle>
          <CardDescription>5 specialized agents executing self-marketing campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent: any) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getAgentIcon(agent.agentId)}
                    </div>
                    <div
                      className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${getStatusColor(agent.status)} border-2 border-background`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{agent.name}</h3>
                      {getStatusBadge(agent.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {agent.department} • {agent.type}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Capabilities: {agent.capabilities?.length || 0}</span>
                      <span>•</span>
                      <span>Last updated: {new Date(agent.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  {Object.entries(agent.kpis || {}).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="min-w-[80px]">
                      <div className="text-2xl font-bold">{value as number}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workflow Executions</CardTitle>
          <CardDescription>Last 20 tasks executed by marketing agents</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks found. Agents will start executing workflows soon.
                  </div>
                ) : (
                  tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-sm font-mono text-muted-foreground">
                          #{task.id}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{task.type.replace(/_/g, " ")}</span>
                            {getTaskStatusBadge(task.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Agent: {agents.find((a: any) => a.id === task.agentId)?.name || "Unknown"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {task.executionTime ? `${task.executionTime}ms` : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(task.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <div className="space-y-2">
                {tasks.filter((t: any) => t.status === "completed").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No completed tasks yet.
                  </div>
                ) : (
                  tasks
                    .filter((t: any) => t.status === "completed")
                    .map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-medium">{task.type.replace(/_/g, " ")}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(task.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="running" className="mt-4">
              <div className="space-y-2">
                {tasks.filter((t: any) => t.status === "running").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No running tasks.
                  </div>
                ) : (
                  tasks
                    .filter((t: any) => t.status === "running")
                    .map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
                          <span className="font-medium">{task.type.replace(/_/g, " ")}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Started: {new Date(task.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="failed" className="mt-4">
              <div className="space-y-2">
                {tasks.filter((t: any) => t.status === "failed").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No failed tasks. All workflows executing successfully! 🎉
                  </div>
                ) : (
                  tasks
                    .filter((t: any) => t.status === "failed")
                    .map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-medium">{task.type.replace(/_/g, " ")}</span>
                          {task.error && (
                            <span className="text-sm text-red-600">{task.error}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(task.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
