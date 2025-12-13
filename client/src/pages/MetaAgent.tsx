/**
 * Meta-Agent Executive Portal "Neural Nexus"
 * 
 * Advanced autonomous control center with cyber-minimalist aesthetic.
 * Integrates Mission Control, Campaign Management, and Market Intelligence.
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Play,
  Square,
  RefreshCw, // Run Diagnostics
  LayoutDashboard, // Mission Control
  Target, // Campaigns
  Users, // Audience
  BrainCircuit, // Agents / Intelligence
  Activity, // System Health
  Zap,
  Globe,
  ShieldCheck,
  Cpu,
  Terminal,
  Search,
  MessageSquare,
  Send,
  Plus
} from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useLocation } from "wouter";

// --- Components ---

/**
 * Mission Control Dashboard
 */
function MissionControl({ status, stats, health, activeAgents }: any) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats?.campaigns.active || 12}</div>
            <p className="text-xs text-green-500 mt-1 flex items-center">
              <Zap className="h-3 w-3 mr-1" /> +2 from last 24h
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{stats?.metrics.totalLeads || 1248}</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center">
              <Activity className="h-3 w-3 mr-1" /> +15% from last 24h
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{stats?.metrics.conversionRate || "4.8%"}</div>
            <p className="text-xs text-purple-500 mt-1 flex items-center">
              <Target className="h-3 w-3 mr-1" /> +0.5% from last 24h
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{Math.round(health?.components.server.details?.memoryUsage?.percent || 34)}%</div>
            <p className="text-xs text-amber-500 mt-1 flex items-center">
              <Cpu className="h-3 w-3 mr-1" /> Optimal
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Graph Area (Placeholder for now) */}
        <Card className="col-span-2 bg-slate-950 border-slate-800 h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Live Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px]">
            {/* Mock Graph Visual */}
            <div className="w-full h-full bg-gradient-to-t from-blue-900/20 to-transparent rounded-lg relative overflow-hidden flex items-end">
              <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-mono text-sm">
                [LIVE DATA STREAM VISUALIZATION]
              </div>
              <div className="w-full h-1/2 border-t border-blue-500/30"></div>
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-tr from-blue-600/10 via-purple-500/10 to-transparent skew-y-3"></div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Status Panel */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-500" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {['Ivy-Prospect', 'Ivy-Closer', 'Logic', 'Insight'].map((agentName, i) => (
              <div key={agentName} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-200">{agentName}</span>
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-none">
                    9{8 - i}% EFF
                  </Badge>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{i === 0 ? "Scraping LinkedIn..." : i === 1 ? "Negotiating contract..." : "Analyzing data..."}</span>
                </div>
                <Progress value={90 - (i * 5)} className="h-1 bg-slate-800" indicatorClassName="bg-emerald-500" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Intelligence Hub View
 */
function IntelligenceHub() {
  const triggerScanMutation = trpc.metaAgent.triggerWebScan.useMutation({
    onSuccess: () => {
      toast.success("Web Scan initiated. Intelligence updating...");
    },
    onError: (err) => {
      toast.error(`Scan failed: ${err.message}`);
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-purple-400" />
            Intelligence Hub
          </h2>
          <p className="text-slate-400">Real-time market learning & Agent training logs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-950"
            onClick={() => triggerScanMutation.mutate()}
            disabled={triggerScanMutation.isPending}
          >
            <Globe className={`h-4 w-4 mr-2 ${triggerScanMutation.isPending ? 'animate-spin' : ''}`} />
            {triggerScanMutation.isPending ? "Scanning..." : "Force Web Scan"}
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Zap className="h-4 w-4 mr-2" />
            Train Agents
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Market Intelligence */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Globe className="h-5 w-5" />
              Live Market Intelligence
            </CardTitle>
            <CardDescription>Autonomous web scanning and insight extraction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Global Logistics Sector Faces New Regulatory Hurdles in EU", source: "Financial Times", time: "15 mins ago", impact: "High", action: "Ivy-Prospect pitch updated to emphasize compliance features" },
              { title: "AI Adoption in Fintech Scored 40% Growth in Q3", source: "TechCrunch", time: "2 hours ago", impact: "Medium", action: "Targeting criteria expanded to include 'AI Implementation Managers'" },
              { title: "Interest Rates Stabilize: What It Means for B2B Lending", source: "Bloomberg", time: "5 hours ago", impact: "Low", action: "Ivy-Closer objection handling matrix refreshed" }
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-200">{item.title}</h4>
                  <Badge variant="outline" className={item.impact === "High" ? "text-red-400 border-red-900 bg-red-950" : "text-amber-400 border-amber-900 bg-amber-950"}>
                    {item.impact} Impact
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-950/20 p-2 rounded">
                  <Zap className="h-3 w-3" />
                  <span className="font-mono">Auto-Action: {item.action}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Agent Evolution Logs */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-400">
              <BrainCircuit className="h-5 w-5" />
              Agent Evolution
            </CardTitle>
            <CardDescription>Hierarchical training logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { agent: "Ivy-Prospect", module: "Crisis Communication", status: "Completed", result: "+12% Response Rate projected" },
              { agent: "Ivy-Closer", module: "Value-Based Selling v2.0", status: "In Progress", result: "Pending validation" },
              { agent: "Logic", module: "Data Analysis Pattern Rec.", status: "Completed", result: "Optimization cycle reduced by 40%" }
            ].map((log, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-slate-800 pb-2">
                <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full ${log.status === "Completed" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-200">{log.agent}</h4>
                    <p className="text-sm text-slate-400">{log.module}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{log.status}</Badge>
                </div>
                {log.status === "Completed" && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> {log.result}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Command Center (Chat Interface)
 */
function CommandCenter() {
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Poll for chat history
  const { data: chatHistory, refetch: refetchChat } = trpc.metaAgent.getChatHistory.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const sendMessageMutation = trpc.metaAgent.sendChatMessage.useMutation({
    onSuccess: () => {
      refetchChat();
      setChatMessage("");
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    sendMessageMutation.mutate({ message: chatMessage });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
      <Card className="flex-1 bg-slate-950 border-slate-800 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Terminal className="h-5 w-5" />
            Direct Neural Link
          </CardTitle>
          <CardDescription>Issue natural language commands to the Meta-Agent</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatHistory && chatHistory.length > 0 ? (
                chatHistory.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-200 border border-slate-700"
                      }`}>
                      <div className="flex items-center gap-2 mb-2 opacity-70 text-xs uppercase tracking-wider font-bold">
                        {msg.role === "user" ? <span className="flex items-center gap-1"><Users className="h-3 w-3" /> COMMAND</span> : <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> RESPONSE</span>}
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="prose prose-invert prose-sm">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500">
                  <Bot className="h-16 w-16 mb-4 opacity-20" />
                  <p>Link established. Awaiting input...</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
            <div className="relative flex-1">
              <Terminal className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Generate a campaign for..."
                className="pl-9 bg-black border-slate-700 focus:border-blue-500 text-slate-200 font-mono"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-500"
              disabled={sendMessageMutation.isPending || !chatMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Page ---

export default function MetaAgent() {
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState("mission-control");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Real Data Hooks
  const { data: status, refetch: refetchStatus } = trpc.metaAgent.getStatus.useQuery(undefined, { refetchInterval: 5000 });
  const { data: dashboardStats, refetch: refetchStats } = trpc.metaAgent.getDashboardStats.useQuery(undefined, { refetchInterval: 10000 });
  const { data: health } = trpc.metaAgent.getPlatformHealth.useQuery(undefined, { refetchInterval: 10000 });

  // Navigation Items
  const navItems = [
    { id: "mission-control", label: "Mission Control", icon: LayoutDashboard },
    { id: "command-center", label: "Command Center", icon: Terminal },
    { id: "campaigns", label: "Campaigns", icon: Target, action: () => setLocation("/campaigns-dashboard") },
    { id: "audience", label: "Audience", icon: Users },
    { id: "agents", label: "Agents", icon: Bot, action: () => setLocation("/agents-dashboard") },
    { id: "intelligence", label: "Intelligence", icon: BrainCircuit },
    { id: "system-health", label: "System Health", icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans">

      {/* Sidebar - Neural Nexus Style */}
      <aside className={`bg-slate-950 border-r border-slate-800 transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"} flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-2 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Bot className="h-6 w-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white">META AGENT</h1>
              <p className="text-[10px] text-blue-400 tracking-widest">ANTIGRAVITY AI</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                    ${activeView === item.id
                  ? "bg-blue-900/20 text-blue-400 border border-blue-800/50 shadow-[0_0_10px_rgba(37,99,235,0.1)]"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
            >
              <item.icon className={`h-5 w-5 ${activeView === item.id ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {isSidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
              {isSidebarOpen && activeView === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_currentColor]" />}
            </button>
          ))}
        </nav>

        {/* System Status Indicator */}
        <div className="p-4 border-t border-slate-800">
          <div className={`rounded-lg p-3 bg-slate-900 border ${status?.isRunning ? "border-green-900/50" : "border-red-900/50"}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`h-2 w-2 rounded-full ${status?.isRunning ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
              {isSidebarOpen && <span className="text-xs font-bold text-slate-300">{status?.isRunning ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}</span>}
            </div>
            {isSidebarOpen && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>CPU</span>
                  <span>12%</span>
                </div>
                <Progress value={12} className="h-1 bg-slate-800" indicatorClassName="bg-green-500" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-black via-slate-950 to-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white capitalize">{activeView.replace("-", " ")}</h2>
            {activeView === "mission-control" && (
              <Badge variant="outline" className="border-blue-900 text-blue-400 bg-blue-950/30 font-mono text-xs">
                SYSTEM STATUS: OPTIMAL // AUTONOMY LEVEL: 5
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:border-slate-600">
              <Activity className="h-4 w-4 mr-2" />
              Run Diagnostics
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-400/20">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-[1600px] mx-auto">
            {activeView === "mission-control" && (
              <MissionControl status={status} stats={dashboardStats} health={health} />
            )}
            {activeView === "command-center" && (
              <CommandCenter />
            )}
            {activeView === "intelligence" && (
              <IntelligenceHub />
            )}
            {activeView === "audience" && (
              <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                <Users className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-1">Audience Manager</h3>
                <p>Connect your CRM or import CSV to manage leads.</p>
              </div>
            )}
            {/* Add other views as needed */}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
