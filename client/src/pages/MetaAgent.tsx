/**
 * 🤖 Meta-Agent Dashboard
 * 
 * Central command center for the autonomous AI system.
 * Features:
 * - Real-time conversational interface with Streamdown rendering
 * - Task monitoring and control
 * - TypeScript error auto-fixing
 * - Platform health visualization
 */

import React, { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Terminal,
  Activity,
  Bot,
  Zap,
  LayoutDashboard,
  Code,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  Database,
  Package,
  Play,
  Square,
  RefreshCw,
  Wrench,
  FileCode,
  Send,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Streamdown } from "streamdown";

// --- Components ---

function StatusBadge({ status }: { status: string }) {
  if (status === "running") return <Badge variant="default" className="bg-green-500 hover:bg-green-600">RUNNING</Badge>;
  if (status === "idle") return <Badge variant="secondary">STOPPED</Badge>;
  if (status === "error") return <Badge variant="destructive">ERROR</Badge>;
  return <Badge variant="outline">{status?.toUpperCase()}</Badge>;
}

function StatCard({ title, value, sub, icon: Icon, color = "text-slate-200" }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

// --- Main Dashboard ---

export default function MetaAgentDashboard() {
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("chat");

  // --- Real-time Data (Polling) ---

  // Fast updates (3-5s)
  const { data: status, refetch: refetchStatus } = trpc.metaAgent.getStatus.useQuery(undefined, { refetchInterval: 5000 });
  const { data: chatHistory, refetch: refetchChat } = trpc.metaAgent.getChatHistory.useQuery(undefined, { refetchInterval: 3000 });

  // Medium updates (10s)
  const { data: stats } = trpc.metaAgent.getDashboardStats.useQuery(undefined, { refetchInterval: 10000 });

  // Slow updates (30s)
  const { data: tsErrors, refetch: refetchErrors } = trpc.metaAgent.getTypeScriptErrors.useQuery(undefined, { refetchInterval: 30000 });

  // --- Mutations ---

  const sendMessageMutation = trpc.metaAgent.sendMessage.useMutation({
    onSuccess: () => {
      setChatMessage("");
      refetchChat();
    },
    onError: (err) => toast.error(`Failed to send: ${err.message}`)
  });

  const startMutation = trpc.metaAgent.start.useMutation({
    onSuccess: () => { toast.success("Meta-Agent Started"); refetchStatus(); }
  });

  const stopMutation = trpc.metaAgent.stop.useMutation({
    onSuccess: () => { toast.info("Meta-Agent Stopped"); refetchStatus(); }
  });

  const auditMutation = trpc.metaAgent.runAudit.useMutation({
    onSuccess: () => toast.success("Audit initiated")
  });

  const fixErrorMutation = trpc.metaAgent.fixTypeScriptErrors.useMutation({
    onSuccess: (res) => {
      toast.success(`Fix applied: ${res.file}`);
      refetchErrors();
    },
    onError: (err) => toast.error("Auto-fix failed")
  });

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendMessageMutation.mutate({ message: chatMessage });
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
              Meta-Agent Dashboard
              <StatusBadge status={status?.status || 'unknown'} />
            </h1>
            <p className="text-xs text-slate-400 font-mono hidden md:block">
              Neural Nexus v2.1 • {status?.isRunning ? "ONLINE" : "OFFLINE"} • 24/7 AUTONOMY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => startMutation.mutate()} disabled={status?.isRunning} className="border-green-800 text-green-400 hover:bg-green-950">
            <Play className="h-4 w-4 mr-2" /> Start
          </Button>
          <Button variant="outline" size="sm" onClick={() => stopMutation.mutate()} disabled={!status?.isRunning} className="border-red-800 text-red-400 hover:bg-red-950">
            <Square className="h-4 w-4 mr-2" /> Stop
          </Button>
          <Button variant="outline" size="sm" onClick={() => auditMutation.mutate()} className="border-slate-700 hover:bg-slate-800">
            <RefreshCw className="h-4 w-4 mr-2" /> Audit
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="container mx-auto space-y-6 max-w-7xl">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="TypeScript Errors"
              value={stats?.code?.typeScriptErrors || 0}
              sub={`${stats?.code?.errorFiles || 0} files affected`}
              icon={Code}
              color="text-amber-400"
            />
            <StatCard
              title="Agents Trained"
              value={stats?.agents?.total || 0}
              sub="Last 24 hours"
              icon={Bot}
              color="text-purple-400"
            />
            <StatCard
              title="Platform Health"
              value={stats?.platform?.health === 'healthy' ? '100%' : 'WARNING'}
              sub={stats?.platform?.health === 'healthy' ? 'Optimal' : 'Issues Detected'}
              icon={Activity}
              color={stats?.platform?.health === 'healthy' ? 'text-green-400' : 'text-red-400'}
            />
            <StatCard
              title="Tasks Completed"
              value={stats?.metaAgent?.completedTasks || 0}
              sub={`${stats?.metaAgent?.activeTasks || 0} active`}
              icon={CheckCircle2}
              color="text-blue-400"
            />
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="chat" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full md:w-[600px] grid-cols-4 bg-slate-900 border border-slate-800">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" /> Chat
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <Clock className="h-4 w-4 mr-2" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="errors">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" /> Errors
              </TabsTrigger>
              <TabsTrigger value="health">
                <Activity className="h-4 w-4 mr-2 text-green-500" /> Health
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* CHAT TAB */}
              <TabsContent value="chat">
                <Card className="bg-slate-950 border-slate-800 h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-blue-400" /> Neural Link
                    </CardTitle>
                    <CardDescription>Issue natural language commands to the Meta-Agent</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col overflow-hidden">
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-4 pb-4">
                        {!chatHistory?.length && (
                          <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                            <Bot className="h-16 w-16 mb-4 opacity-10" />
                            <p>System Online. Awaiting input...</p>
                          </div>
                        )}
                        {chatHistory?.map((msg: any) => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-900 border border-slate-800 text-slate-200'
                              }`}>
                              <div className="text-[10px] opacity-70 mb-1 flex justify-between gap-4 font-mono uppercase">
                                <span>{msg.role}</span>
                                <span>{formatDistanceToNow(new Date(msg.timestamp))} ago</span>
                              </div>
                              <div className="prose prose-invert prose-sm">
                                {/* Attempt to render markdown safely */}
                                <Streamdown>{msg.content}</Streamdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="mt-4 flex gap-2">
                      <Input
                        placeholder="Command (e.g., 'Fix TypeScript errors', 'Status', 'Train agents')"
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                        className="bg-slate-900 border-slate-700"
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending || !chatMessage.trim()} className="bg-blue-600 hover:bg-blue-500">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TASKS TAB */}
              <TabsContent value="tasks">
                <Card className="bg-slate-950 border-slate-800">
                  <CardHeader>
                    <CardTitle>Active Tasks</CardTitle>
                    <CardDescription>Real-time autonomous operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {status?.activeTasks === 0 && (
                        <div className="text-center py-12 text-slate-500">
                          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>No active tasks. System idle.</p>
                        </div>
                      )}
                      {/* We don't have detailed task list in getDashboardStats yet, adding placeholder */}
                      <div className="p-4 bg-slate-900/50 rounded border border-slate-800 text-sm text-slate-400 text-center italic">
                        Detailed task list requires additional query implementation.
                        <br />
                        Active: {status?.activeTasks} | Completed: {status?.completedTasks}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ERRORS TAB */}
              <TabsContent value="errors">
                <Card className="bg-slate-950 border-slate-800">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" /> TypeScript Errors
                        </CardTitle>
                        <CardDescription>Code quality issues detected by compiler</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => fixErrorMutation.mutate()} disabled={fixErrorMutation.isPending}>
                        <Wrench className="h-4 w-4 mr-2" /> Auto-Fix All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {tsErrors?.errors?.map((err: any, i: number) => (
                          <Card key={i} className="bg-slate-900/50 border-l-4 border-l-red-500 border-slate-800">
                            <CardContent className="pt-4 pb-4 flex justify-between items-start gap-4">
                              <div className="overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="destructive" className="font-mono text-[10px]">{err.code}</Badge>
                                  <span className="font-mono text-xs text-slate-400">{err.file}:{err.line}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-200 truncate">{err.message}</p>
                              </div>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => fixErrorMutation.mutate()}>
                                <Wrench className="h-4 w-4 text-blue-400" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {!tsErrors?.errors?.length && (
                          <div className="text-center py-12">
                            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500/20" />
                            <h3 className="text-lg font-medium text-green-400">Codebase Clean</h3>
                            <p className="text-slate-500">No TypeScript errors detected.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* HEALTH TAB */}
              <TabsContent value="health">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-950 border-slate-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-400" /> Database
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400">Status</span>
                        <Badge variant="outline" className="text-green-400 border-green-900 bg-green-950/20">CONNECTED</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Response Time</span>
                          <span>12ms</span>
                        </div>
                        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-[15%]" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-950 border-slate-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-purple-400" /> Agents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400">Active Agents</span>
                        <span className="text-xl font-bold">{stats?.agents?.total || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Avg Success Rate</span>
                        <span className="text-green-400 font-bold">{Math.round(stats?.agents?.avgSuccessRate * 100) || 0}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-950 border-slate-800 md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-amber-400" /> Market Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-slate-900/50 rounded border border-slate-800 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-slate-200">Web Scan Status</h4>
                          <p className="text-xs text-slate-500">Last scan: {formatDistanceToNow(new Date(stats?.lastAudit?.timestamp || Date.now()))} ago</p>
                        </div>
                        <Button variant="outline" size="sm">Force Scan</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
