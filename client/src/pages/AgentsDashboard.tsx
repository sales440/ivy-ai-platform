/**
 * Agents Dashboard - Neural Nexus
 * 
 * Detailed configuration and monitoring for all AI agents.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Bot, Settings, Activity, Power, MessageSquare, BrainCircuit } from "lucide-react";
import { useLocation } from "wouter";

export default function AgentsDashboard() {
  const [, setLocation] = useLocation();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Queries
  const { data: agents } = trpc.metaAgent.getAgentPerformance.useQuery();
  const { data: status } = trpc.metaAgent.getStatus.useQuery();

  // Mock data for display until real data is full
  const agentConfigs = [
    {
      id: "ivy-prospect",
      name: "Ivy-Prospect",
      role: "Lead Generation",
      description: "Scrapes LinkedIn and enriches lead data.",
      status: "active",
      efficiency: 98,
      tasks: 1240,
      color: "text-emerald-400",
      bg: "bg-emerald-950/30",
      border: "border-emerald-500/30"
    },
    {
      id: "ivy-closer",
      name: "Ivy-Closer",
      role: "Sales Negotiation",
      description: "Engages leads via email and books meetings.",
      status: "active",
      efficiency: 94,
      tasks: 850,
      color: "text-blue-400",
      bg: "bg-blue-950/30",
      border: "border-blue-500/30"
    },
    {
      id: "logic",
      name: "Logic",
      role: "Campaign Optimization",
      description: "Analyzes A/B tests and adjusts strategy.",
      status: "active",
      efficiency: 99,
      tasks: 3400,
      color: "text-amber-400",
      bg: "bg-amber-950/30",
      border: "border-amber-500/30"
    },
    {
      id: "insight",
      name: "Insight",
      role: "Market Intelligence",
      description: "Monitors news and trends 24/7.",
      status: "active",
      efficiency: 100,
      tasks: 5600,
      color: "text-purple-400",
      bg: "bg-purple-950/30",
      border: "border-purple-500/30"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/meta-agent")}>
            <LayoutDashboard className="h-5 w-5 text-slate-400" />
          </Button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-500" />
            Agent Command Center
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-900 text-green-400 bg-green-950/30">
            Corrective Training Active
          </Badge>
        </div>
      </header>

      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agentConfigs.map((agent) => (
            <Card
              key={agent.id}
              className={`bg-slate-950 border transition-all duration-300 hover:shadow-lg cursor-pointer ${agent.border} ${selectedAgent === agent.id ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className={`p-2 rounded-lg ${agent.bg}`}>
                    <Bot className={`h-6 w-6 ${agent.color}`} />
                  </div>
                  <Switch checked={agent.status === "active"} />
                </div>
                <CardTitle className="mt-4 flex flex-col">
                  <span className="text-lg font-bold text-slate-100">{agent.name}</span>
                  <span className="text-xs font-normal text-slate-500">{agent.role}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400 h-10">{agent.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Efficiency</span>
                    <span className={agent.color}>{agent.efficiency}%</span>
                  </div>
                  <Progress value={agent.efficiency} className="h-1 bg-slate-900" indicatorClassName={agent.color.replace('text-', 'bg-')} />
                </div>

                <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {agent.tasks} Ops
                  </div>
                  <div className="flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" />
                    v2.1
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Configuration Panel (conditionally rendered or always visible for selected) */}
        <Card className="bg-slate-950 border-slate-800">
          <Tabs defaultValue="config">
            <CardHeader className="border-b border-slate-800 pb-0">
              <div className="flex justify-between items-center mb-4">
                <CardTitle>Global Agent Configuration</CardTitle>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
              </div>
              <TabsList className="bg-slate-900">
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="memory">Shared Memory</TabsTrigger>
                <TabsTrigger value="logs">Training Logs</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-6">
              <TabsContent value="config" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300">Autonomy Levels</h3>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-200">Auto-Approval Mode</div>
                        <div className="text-xs text-slate-500">Allow agents to execute campaigns without human review</div>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-200">Budget Scaling</div>
                        <div className="text-xs text-slate-500">Automatically increase budget for high-performing campaigns</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300">Communication Style</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-950/20">Assertive</Button>
                      <Button variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-800">Balanced</Button>
                      <Button variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-800">Consultative</Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Current Prompt: "Act as a Senior Director. Be concise but empathetic..."
                    </p>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
