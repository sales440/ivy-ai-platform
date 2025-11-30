/**
 * Meta-Agent Dashboard
 * 
 * Main interface for interacting with the autonomous Meta-Agent
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  Play, 
  Square, 
  RefreshCw, 
  MessageSquare, 
  Send,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Code,
  Database,
  Wrench,
  Zap,
  TrendingUp,
  FileCode,
  Package,
  Table,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function MetaAgent() {
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: status, refetch: refetchStatus } = trpc.metaAgent.getStatus.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: dashboardStats, refetch: refetchStats } = trpc.metaAgent.getDashboardStats.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: chatHistory, refetch: refetchChat } = trpc.metaAgent.getChatHistory.useQuery(undefined, {
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const { data: tasks } = trpc.metaAgent.getTasks.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const { data: health } = trpc.metaAgent.getPlatformHealth.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const { data: tsErrors } = trpc.metaAgent.getTypeScriptErrors.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutations
  const startMutation = trpc.metaAgent.start.useMutation({
    onSuccess: () => {
      toast.success("Meta-Agent started successfully");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Failed to start: ${error.message}`);
    },
  });

  const stopMutation = trpc.metaAgent.stop.useMutation({
    onSuccess: () => {
      toast.success("Meta-Agent stopped");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Failed to stop: ${error.message}`);
    },
  });

  const auditMutation = trpc.metaAgent.runAudit.useMutation({
    onSuccess: () => {
      toast.success("Audit completed");
      refetchStatus();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Audit failed: ${error.message}`);
    },
  });

  const fixTsMutation = trpc.metaAgent.fixTypeScriptErrors.useMutation({
    onSuccess: (result) => {
      toast.success(`Fixed ${result.fixed} errors, ${result.failed} failed`);
      refetchStats();
    },
    onError: (error) => {
      toast.error(`Fix failed: ${error.message}`);
    },
  });

  const sendMessageMutation = trpc.metaAgent.sendChatMessage.useMutation({
    onSuccess: () => {
      refetchChat();
      setChatMessage("");
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendMessageMutation.mutate({ message: chatMessage });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "training":
        return "bg-blue-500";
      case "fixing":
        return "bg-yellow-500";
      case "auditing":
        return "bg-purple-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getHealthColor = (health?: string) => {
    switch (health) {
      case "healthy":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "critical":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8" />
            Meta-Agent
          </h1>
          <p className="text-muted-foreground mt-1">
            Autonomous AI system maintaining Ivy.AI platform 24/7
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status?.isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => auditMutation.mutate()}
            disabled={auditMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${auditMutation.isPending ? "animate-spin" : ""}`} />
            Run Audit
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(status?.status)} animate-pulse`} />
              <span className="text-2xl font-bold capitalize">{status?.status || "idle"}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {status?.isRunning ? "Running" : "Stopped"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${getHealthColor(dashboardStats?.platform.health)}`}>
              {dashboardStats?.platform.health || "unknown"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dashboardStats?.platform.criticalIssues || 0} critical issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code className="h-4 w-4" />
              TypeScript Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.code.typeScriptErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              in {dashboardStats?.code.errorFiles || 0} files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.activeTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {status?.completedTasks || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Clock className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Errors
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            Health
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversational Interface</CardTitle>
              <CardDescription>
                Talk to Meta-Agent naturally. Try commands like "status", "fix errors", "train agents", or just ask questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {chatHistory && chatHistory.length > 0 ? (
                      chatHistory.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div className="text-xs opacity-70 mb-1">
                              {msg.role === "user" ? "You" : "Meta-Agent"}
                            </div>
                            <Streamdown>{msg.content}</Streamdown>
                            <div className="text-xs opacity-50 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No messages yet. Start a conversation!
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message or command..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !chatMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <strong>Quick commands:</strong> status, fix, audit, train agents, show tasks, help
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Tasks executed by Meta-Agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {tasks && tasks.length > 0 ? (
                    tasks.map((task: any) => (
                      <Card key={task.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  task.status === "completed" ? "default" :
                                  task.status === "failed" ? "destructive" :
                                  task.status === "running" ? "secondary" :
                                  "outline"
                                }>
                                  {task.status}
                                </Badge>
                                <Badge variant="outline">{task.priority}</Badge>
                              </div>
                              <p className="font-medium">{task.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(task.createdAt).toLocaleString()}
                              </p>
                              {task.completedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Completed: {new Date(task.completedAt).toLocaleString()}
                                </p>
                              )}
                              {task.error && (
                                <p className="text-xs text-red-500">Error: {task.error}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No tasks yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>TypeScript Errors</span>
                <Button
                  size="sm"
                  onClick={() => fixTsMutation.mutate()}
                  disabled={fixTsMutation.isPending || !tsErrors?.stats.total}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Auto-Fix
                </Button>
              </CardTitle>
              <CardDescription>
                {tsErrors?.stats.total || 0} errors found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {tsErrors?.errors && tsErrors.errors.length > 0 ? (
                    tsErrors.errors.map((error: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">{error.code}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {error.file}:{error.line}:{error.column}
                              </span>
                            </div>
                            <p className="text-sm">{error.message}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      ✅ No TypeScript errors!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold capitalize ${getHealthColor(health?.components.database.status)}`}>
                  {health?.components.database.status || "unknown"}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Response Time: {health?.components.database.responseTime || 0}ms</p>
                  <p>Error Rate: {((health?.components.database.errorRate || 0) * 100).toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Server
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold capitalize ${getHealthColor(health?.components.server.status)}`}>
                  {health?.components.server.status || "unknown"}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Uptime: {(health?.components.server.uptime || 0).toFixed(1)}h</p>
                  <p>Memory: {health?.components.server.details?.memoryUsage?.percent || 0}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold capitalize ${getHealthColor(health?.components.agents.status)}`}>
                  {health?.components.agents.status || "unknown"}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Total: {health?.components.agents.details?.totalAgents || 0}</p>
                  <p>Error Rate: {((health?.components.agents.errorRate || 0) * 100).toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold capitalize ${getHealthColor(health?.components.campaigns.status)}`}>
                  {health?.components.campaigns.status || "unknown"}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <p>Active: {health?.components.campaigns.details?.activeCampaigns || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {health?.issues && health.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.issues.map((issue: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        issue.severity === "critical" ? "text-red-500" :
                        issue.severity === "error" ? "text-orange-500" :
                        issue.severity === "warning" ? "text-yellow-500" :
                        "text-blue-500"
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Component: {issue.component} • {issue.autoFixable ? "Auto-fixable" : "Manual fix required"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
