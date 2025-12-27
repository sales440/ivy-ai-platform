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
  Plus,
  TrendingUp
} from "lucide-react";
// import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { AudienceManager } from "@/components/meta-agent/AudienceManager";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";

// --- Components ---

/**
 * Mission Control Dashboard
 */
function MissionControl({ status, stats, health, isLoading, isError, error, onRetry }: any) {
  if (isError) {
    return (
      <ErrorState
        title="Mission Control Offline"
        message={error?.message || "Failed to establish connection with Meta-Agent Core."}
        onRetry={onRetry}
        className="h-[400px]"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-950 border-slate-800">
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24 bg-slate-800" /></CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-slate-800 mb-2" />
              <Skeleton className="h-3 w-32 bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Active Campaigns", value: stats?.campaigns?.active || 0, color: "text-blue-400", sub: "+2 from last 24h", icon: Zap, subColor: "text-green-400" },
          { title: "Leads Generated", value: stats?.metrics?.totalLeads || 0, color: "text-emerald-400", sub: "+12.5% vs avg", icon: Activity, subColor: "text-emerald-500" },
          { title: "Conversion Rate", value: stats?.metrics?.conversionRate || "0%", color: "text-purple-400", sub: "+0.8% efficiency", icon: Target, subColor: "text-purple-500" },
          { title: "System Load", value: (Math.round(health?.components?.server?.details?.memoryUsage?.percent || 0)) + "%", color: "text-amber-400", sub: "Optimal Performance", icon: Cpu, subColor: "text-amber-500" }
        ].map((kpi, i) => (
          <Card key={i} className="bg-slate-900/40 border-slate-800/60 backdrop-blur-sm hover:border-purple-500/30 hover:bg-slate-900/60 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={`text-4xl font-extrabold ${kpi.color} tracking-tight drop-shadow-sm`}>{kpi.value}</div>
              <p className={`text-xs ${kpi.subColor} mt-2 flex items-center font-medium`}>
                <kpi.icon className="h-3 w-3 mr-1" /> {kpi.sub}
              </p>
            </CardContent>
          </Card>
        ))}
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
                <Progress value={90 - (i * 5)} className="h-1.5 bg-slate-800/50 rounded-full" indicatorClassName="bg-gradient-to-r from-emerald-600 to-emerald-400" />
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
              { title: "Robo al transporte de carga en México repunta 15% en 2025", source: "El Economista", time: "10 mins ago", impact: "High", action: "Ivy-Prospect script updated: Emphasize 'Risk Mitigation'" },
              { title: "Aseguradoras suben primas 22% por siniestralidad en rutas del Norte", source: "Revista Logistec", time: "1 hour ago", impact: "High", action: "Ivy-Closer objection handling: Pivot to 'ROI via Prevention'" },
              { title: "Nuevos protocolos de seguridad en aduanas vigentes hoy", source: "T21 Noticias", time: "3 hours ago", impact: "Medium", action: "Campaign Manager: Rescheduling logistics sector outreach" }
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
 * Command Center (Chat Interface + Strategy Hub)
 * Refactored to be embeddable
 */
function CommandCenter({ embedded = false }: { embedded?: boolean }) {
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Local state for chat to show immediate responses from ROPA
  const [messages, setMessages] = useState<any[]>([]);

  // Poll for historical chat (optional, if we were saving it)
  const { data: chatHistory } = trpc.metaAgent.getChatHistory.useQuery(undefined, {
    refetchInterval: false, // Disable polling to avoid overwriting local state for now
  });

  // Effect to load initial history
  useEffect(() => {
    if (chatHistory && messages.length === 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  const sendMessageMutation = trpc.ivyCloud.askRopa.useMutation({
    onSuccess: (data) => {
      // Append ROPA's response to the local chat
      const ropaMessage = {
        id: Date.now(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, ropaMessage]);
    },
    onError: (error) => {
      toast.error(`Failed to reach ROPA: ${error.message}`);
    },
  });

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message immediately
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: chatMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // Trigger ROPA
    sendMessageMutation.mutate({ message: chatMessage });
    setChatMessage("");
  };

  // Helper to pre-fill prompt
  const prefillPrompt = (text: string) => {
    setChatMessage(text);
  };

  return (
    <div className={`flex flex-col animate-in fade-in duration-500 ${embedded ? "h-full" : "h-[calc(100vh-140px)]"}`}>
      <Card className={`flex-1 bg-slate-950 border-slate-800 flex flex-col overflow-hidden ${embedded ? "border-0 shadow-none" : ""}`}>
        <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900/50">
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <Terminal className="h-5 w-5" />
            {embedded ? "Strategic Command Center" : "Direct Neural Link"}
          </CardTitle>
          <CardDescription>
            {embedded
              ? "Interact with the Commercial Strategist to build & optimize campaigns"
              : "Issue natural language commands to the Meta-Agent"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Welcome / Suggestion Chips */}
              {(!messages || messages.length === 0) && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button variant="outline" className="h-auto py-2 px-3 justify-start text-xs border-slate-800 hover:bg-slate-900 hover:text-blue-400 text-slate-500"
                    onClick={() => prefillPrompt("Generate a campaign for getting 15 demos of our CRM software in companies of 50-200 employees in Mexico")}>
                    <Plus className="h-3 w-3 mr-2" />
                    New Campaign Strategy...
                  </Button>
                  <Button variant="outline" className="h-auto py-2 px-3 justify-start text-xs border-slate-800 hover:bg-slate-900 hover:text-purple-400 text-slate-500"
                    onClick={() => prefillPrompt("Analyze the last 24h performance of the Fintech Outreach campaign and suggest improvements")}>
                    <TrendingUp className="h-3 w-3 mr-2" />
                    Optimize Performance...
                  </Button>
                </div>
              )}

              {messages && messages.length > 0 ? (
                messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-lg p-4 ${msg.role === "user"
                      ? "bg-blue-600/90 text-white backdrop-blur-sm"
                      : "bg-slate-900/80 text-slate-200 border border-slate-800"
                      }`}>
                      <div className="flex items-center gap-2 mb-2 opacity-70 text-[10px] uppercase tracking-wider font-bold">
                        {msg.role === "user" ? <span className="flex items-center gap-1"><Users className="h-3 w-3" /> COMMAND</span> : <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> STRATEGIST</span>}
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="prose prose-invert prose-sm leading-relaxed text-sm">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                  <Bot className="h-12 w-12 mb-4 opacity-10" />
                  <p className="text-sm">Link established. Awaiting strategic input...</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

          </ScrollArea>

          <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-2">
            <div className="relative flex-1">
              {sendMessageMutation.isPending && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
              <Terminal className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Generate a campaign for..."
                className="pl-9 bg-black/50 border-slate-700/50 focus:border-blue-500 text-slate-200 font-mono text-sm"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
              disabled={sendMessageMutation.isPending || !chatMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

/**
 * CampaignsView (Split Screen: List + Chat)
 */
function CampaignsView() {
  const { data: campaigns, isLoading, isError, error, refetch } = trpc.campaigns.getAll.useQuery();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: Campaigns List */}
      <div className="xl:col-span-7 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="h-6 w-6 text-green-400" />
              Campaigns
            </h2>
            <p className="text-slate-400 text-sm">Manage & Monitor Active Operations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-slate-800 text-slate-400">
              Filter
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {isError ? (
              <ErrorState
                title="Failed to load campaigns"
                message={error?.message}
                onRetry={refetch}
              />
            ) : isLoading ? (
              // Loading Skeletons
              [1, 2, 3].map((i) => (
                <Card key={i} className="bg-slate-950 border-slate-800">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex gap-2 items-center">
                        <Skeleton className="h-2 w-2 rounded-full bg-slate-800" />
                        <Skeleton className="h-6 w-48 bg-slate-800" />
                      </div>
                      <Skeleton className="h-5 w-16 bg-slate-800" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div><Skeleton className="h-8 w-12 bg-slate-800 mb-1" /><Skeleton className="h-3 w-10 bg-slate-800" /></div>
                      <div className="text-right flex flex-col items-end"><Skeleton className="h-8 w-12 bg-slate-800 mb-1" /><Skeleton className="h-3 w-24 bg-slate-800" /></div>
                    </div>
                    <Skeleton className="h-1 w-full bg-slate-800/50" />
                  </CardContent>
                </Card>
              ))
            ) : !campaigns || campaigns.length === 0 ? (
              // Empty State (Refactored)
              <Empty className="bg-slate-950/50 border-slate-800/50">
                <EmptyMedia>
                  <Target className="h-12 w-12 text-slate-600" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle className="text-slate-400">No Active Campaigns</EmptyTitle>
                  <EmptyDescription className="text-slate-600">
                    Launch a new campaign using the Command Center or create one manually.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" className="border-blue-900/50 text-blue-400 hover:bg-blue-950" onClick={() => window.location.href = '#command-center'}>
                    <Plus className="h-4 w-4 mr-2" /> Create Campaign
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              // Real Data List
              campaigns.map((camp: any) => (
                <Card key={camp.id} className="bg-slate-950/50 border-slate-800 backdrop-blur-sm hover:border-slate-600/50 hover:bg-slate-900/40 transition-all duration-300 group shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${camp.status === 'active' ? 'bg-green-500 animate-pulse' :
                            camp.status === 'completed' ? 'bg-blue-500' : 'bg-amber-500'
                            }`} />
                          <CardTitle className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                            {camp.name}
                          </CardTitle>
                        </div>
                        <div className="flex gap-2 text-[10px] text-slate-500 font-mono uppercase">
                          {camp.tags?.map((tag: string, i: number) => (
                            <span key={i}>{tag} {i < camp.tags.length - 1 && "•"}</span>
                          ))}
                        </div>
                      </div>
                      <Badge variant="outline" className={`uppercase text-[10px] tracking-widest ${camp.status === 'active' ? 'text-green-400 border-green-900 bg-green-950/30' :
                        camp.status === 'completed' ? 'text-blue-400 border-blue-900 bg-blue-950/30' : 'text-amber-400 border-amber-900 bg-amber-950/30'
                        }`}>
                        {camp.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <div className="text-3xl font-bold text-white">{camp.leads || 0}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Leads</div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">{camp.progress || 0}%</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Progress</div>
                        <div className="text-[10px] text-slate-600 mt-1">Updated {camp.updatedAt ? new Date(camp.updatedAt).toLocaleDateString() : 'Just now'}</div>
                      </div>
                    </div>
                    <Progress value={camp.progress || 0} className="h-1.5 bg-slate-900 rounded-full overflow-hidden"
                      indicatorClassName={camp.status === 'active' ? 'bg-gradient-to-r from-green-600 to-green-400' : camp.status === 'completed' ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'}
                    />

                    {/* Action Buttons (Hover Only) */}
                    <div className="mt-4 pt-4 border-t border-slate-900 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-400 hover:text-white">
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-green-900/50 text-green-400 hover:bg-green-950"
                        onClick={() => {
                          // Mock sending to campaign leads
                          const mockRecipients = ["+15550001", "+15550002"];
                          toast.promise(trpc.communications.sendBulkTemplate.mutate({
                            recipients: mockRecipients,
                            templateSid: "promo_intro_v1",
                            variables: { campaign: camp.name }
                          }), {
                            loading: 'Launching campaign...',
                            success: (data) => `Campaign launched! Sent ${data.total} messages.`,
                            error: 'Failed to launch campaign'
                          });
                        }}
                      >
                        <Send className="h-3 w-3 mr-1" /> Launch
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-purple-900/50 text-purple-400 hover:bg-purple-950">
                        <Zap className="h-3 w-3 mr-1" /> Optimize
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column: Strategic Command Center */}
      <div className="xl:col-span-5 border-l border-slate-800 pl-6 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" /> Command Center
          </h3>
          <p className="text-xs text-slate-600">Direct link to Meta Agent</p>
        </div>
        <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950/50">
          <CommandCenter embedded={true} />
        </div>

        {/* Agent Status Minimized */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Agent Status</h3>
          <div className="space-y-2">
            {[
              { name: "Ivy-Prospect", action: "Scraping LinkedIn profiles...", eff: 98, color: "text-emerald-400" },
              { name: "Ivy-Closer", action: "Negotiating contracts...", eff: 94, color: "text-emerald-400" },
              { name: "Logic", action: "Analyzing campaign metrics...", eff: 99, color: "text-amber-400" }
            ].map((agent, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/50">
                <div className="flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${agent.color.replace('text', 'bg')}`} />
                  <div>
                    <div className="text-xs font-bold text-slate-300">{agent.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{agent.action}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${agent.color}`}>{agent.eff}%</div>
                  <div className="text-[8px] text-slate-600">EFF</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
  const {
    data: dashboardStats,
    refetch: refetchStats,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: errorStats
  } = trpc.metaAgent.getDashboardStats.useQuery(undefined, { refetchInterval: 10000 });
  const { data: health } = trpc.metaAgent.getPlatformHealth.useQuery(undefined, { refetchInterval: 10000 });

  // Navigation Items
  const navItems = [
    { id: "mission-control", label: "Mission Control", icon: LayoutDashboard },
    { id: "campaigns", label: "Campaigns", icon: Target }, // Removed external redirect to use inline view
    { id: "command-center", label: "Command Center", icon: Terminal }, // Kept for legacy/direct access if needed
    { id: "audience", label: "Audience", icon: Users },
    { id: "agents", label: "Agents", icon: Bot, action: () => setLocation("/agents-dashboard") },
    { id: "intelligence", label: "Intelligence", icon: BrainCircuit },
    { id: "system-health", label: "System Health", icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans">

      {/* Sidebar - Neural Nexus Style */}
      <aside className={`bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 z-50 transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"} flex flex-col relative`}>
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-purple-900/20 blur-[60px] pointer-events-none" />
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-2 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <Bot className="h-6 w-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div>
              <h1 className="font-bold text-lg tracking-wider text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">META AGENT</h1>
              <p className="text-[10px] text-blue-400/80 tracking-widest font-mono">Ivy.AI Neural Nexus v2.0</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group
                    ${activeView === item.id
                  ? "bg-purple-900/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)] backdrop-blur-sm relative overflow-hidden"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                }`}
            >
              {activeView === item.id && <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-50" />}
              <item.icon className={`h-5 w-5 relative z-10 ${activeView === item.id ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300 transition-colors"}`} />
              {isSidebarOpen && <span className="font-medium text-sm relative z-10">{item.label}</span>}
              {isSidebarOpen && activeView === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_currentColor] animate-pulse" />}
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
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
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
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-400/20"
              onClick={() => setLocation("/campaigns-dashboard")}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-[1600px] mx-auto">
            {activeView === "mission-control" && (
              <MissionControl
                status={status}
                stats={dashboardStats}
                health={health}
                isLoading={isLoadingStats}
                isError={isErrorStats}
                error={errorStats}
                onRetry={() => { refetchStatus(); refetchStats(); }}
              />
            )}
            {activeView === "campaigns" && (
              <CampaignsView />
            )}
            {activeView === "command-center" && (
              <div className="max-w-4xl mx-auto">
                <CommandCenter />
              </div>
            )}
            {activeView === "intelligence" && (
              <IntelligenceHub />
            )}
            {activeView === "audience" && (
              <AudienceManager />
            )}
            {/* Add other views as needed */}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
