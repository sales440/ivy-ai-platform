import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Bot,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Square,
  Upload,
  Download,
  Image as ImageIcon,
  FileText,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Calendar,
  Check,
  X,
  Edit,
  Eye,
  Sparkles,
} from "lucide-react";
import { APP_TITLE } from "@/const";
import { Streamdown } from "streamdown";

export default function RopaDashboard() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.ropa.getDashboardStats.useQuery(undefined, {
    refetchInterval: 5000,
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

  // Mock data for campaign proposals
  const campaignProposals = [
    {
      id: 1,
      name: "LinkedIn Outreach Q1 2025",
      channels: ["LinkedIn", "Email"],
      cadence: "5 touches over 14 days",
      kpi: "15% response rate, 30 meetings",
      budget: "$5,000",
      duration: "30 days",
      reasoning:
        "Based on your B2B SaaS profile and recent logo detection, this campaign targets decision-makers in tech companies.",
      status: "pending",
    },
    {
      id: 2,
      name: "Cold Email Sequence - Enterprise",
      channels: ["Email", "Phone"],
      cadence: "7 touches over 21 days",
      kpi: "10% response rate, 20 meetings",
      budget: "$3,500",
      duration: "45 days",
      reasoning:
        "Optimized for enterprise clients with longer sales cycles. Includes personalized follow-ups.",
      status: "pending",
    },
  ];

  // Mock data for recent files
  const recentFiles = [
    { name: "clients_data_Q4.csv", type: "CSV", size: "2.4 MB", date: "2025-12-30", status: "success" },
    { name: "company_logo.png", type: "Image", size: "145 KB", date: "2025-12-30", status: "success" },
    { name: "campaign_metrics.xlsx", type: "Excel", size: "890 KB", date: "2025-12-29", status: "success" },
  ];

  // Mock data for visual assets
  const visualAssets = [
    {
      id: 1,
      name: "Primary Logo",
      type: "logo",
      url: "/api/placeholder/200/200",
      colors: ["#2563EB", "#FFFFFF"],
      client: "Acme Corp",
    },
    {
      id: 2,
      name: "Marketing Banner",
      type: "banner",
      url: "/api/placeholder/400/200",
      colors: ["#10B981", "#FFFFFF"],
      client: "TechStart Inc",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-8 h-8 text-cyan-400" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  ROPA Dashboard
                </h1>
              </div>
              <p className="text-slate-400 text-sm">
                Sistema autónomo de IA gestionando {APP_TITLE} 24/7
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => stopMutation.mutate()}
                disabled={!status?.isRunning}
                className="bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
              <Button
                variant="outline"
                size="sm"
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
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-cyan-500/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-600">
              <Sparkles className="w-4 h-4 mr-2" />
              Campaign Proposals
            </TabsTrigger>
            <TabsTrigger value="data-hub" className="data-[state=active]:bg-cyan-600">
              <FileText className="w-4 h-4 mr-2" />
              Data Hub
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-cyan-600">
              <ImageIcon className="w-4 h-4 mr-2" />
              Visual Assets
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-cyan-600">
              <Bot className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-900/50 border-indigo-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status?.status)}`} />
                    <span className="text-lg font-semibold">
                      {status?.isRunning ? "Autonomous mode active" : "Idle"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-indigo-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Activity className={`w-5 h-5 ${getHealthColor(stats?.health)}`} />
                    <span className="text-lg font-semibold">{stats?.criticalIssues || 0} critical issues</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-indigo-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Active Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-lg font-semibold">12 running</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-indigo-900/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">Tasks Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <span className="text-lg font-semibold">{stats?.tasksCompleted || 0} today</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-slate-900/50 border-indigo-900/30">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest ROPA autonomous actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {tasks && tasks.length > 0 ? (
                      tasks.map((task: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                        >
                          <Clock className="w-4 h-4 text-indigo-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{task.description}</p>
                            <p className="text-xs text-slate-400 mt-1">{task.timestamp}</p>
                          </div>
                          <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                            {task.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-center py-8">No recent tasks</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Proposals Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Campaign Proposals</h2>
                <p className="text-slate-400 text-sm">Review and approve AI-generated campaign strategies</p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate New Proposal
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaignProposals.map((proposal) => (
                <Card key={proposal.id} className="bg-slate-900/50 border-indigo-900/30">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{proposal.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {proposal.channels.join(" + ")} • {proposal.duration}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Cadence</p>
                        <p className="font-medium">{proposal.cadence}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Budget</p>
                        <p className="font-medium">{proposal.budget}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Target KPIs</p>
                        <p className="font-medium">{proposal.kpi}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-900/30">
                      <p className="text-xs text-slate-400 mb-1">AI Reasoning</p>
                      <p className="text-sm">{proposal.reasoning}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button variant="outline" className="flex-1 border-red-500/50 hover:bg-red-500/10">
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button variant="outline" className="border-indigo-500/50 hover:bg-indigo-500/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Data Hub Tab */}
          <TabsContent value="data-hub" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Import Section */}
              <Card className="bg-slate-900/50 border-indigo-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-400" />
                    Import Data
                  </CardTitle>
                  <CardDescription>
                    Upload CSV, Excel, PDF, Word, TXT files or images to update client database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-indigo-900/50 rounded-lg p-8 text-center hover:border-indigo-700/50 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">Drag & drop files here</p>
                    <p className="text-xs text-slate-400">or click to browse</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Supports: CSV, XLSX, PDF, DOCX, TXT, JPG, PNG
                    </p>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export Section */}
              <Card className="bg-slate-900/50 border-indigo-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" />
                    Export Data
                  </CardTitle>
                  <CardDescription>Download client data, campaigns, and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Export Format</label>
                      <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm">
                        <option>CSV</option>
                        <option>Excel (.xlsx)</option>
                        <option>PDF</option>
                        <option>Word (.docx)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Data Type</label>
                      <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm">
                        <option>All Clients</option>
                        <option>Active Campaigns</option>
                        <option>Campaign Metrics</option>
                        <option>Visual Assets</option>
                      </select>
                    </div>

                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Files */}
            <Card className="bg-slate-900/50 border-indigo-900/30">
              <CardHeader>
                <CardTitle>Recent Files</CardTitle>
                <CardDescription>Latest uploaded and downloaded files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-slate-400">
                            {file.type} • {file.size} • {file.date}
                          </p>
                        </div>
                      </div>
                      <Badge variant={file.status === "success" ? "default" : "secondary"}>
                        {file.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Visual Assets</h2>
                <p className="text-slate-400 text-sm">
                  Analyze logos, banners, and branding for campaign optimization
                </p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Asset
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visualAssets.map((asset) => (
                <Card key={asset.id} className="bg-slate-900/50 border-indigo-900/30">
                  <CardHeader>
                    <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center mb-3">
                      <ImageIcon className="w-12 h-12 text-slate-600" />
                    </div>
                    <CardTitle className="text-base">{asset.name}</CardTitle>
                    <CardDescription>{asset.client}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Brand Colors</p>
                      <div className="flex gap-2">
                        {asset.colors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded border border-slate-700"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Analyze
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* OCR & Branding Analysis */}
            <Card className="bg-slate-900/50 border-indigo-900/30">
              <CardHeader>
                <CardTitle>Branding Analysis</CardTitle>
                <CardDescription>AI-powered insights from visual assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-950/30 rounded-lg border border-indigo-900/30">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-400 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Brand Style: Modern & Professional</p>
                        <p className="text-sm text-slate-400">
                          Detected color palette suggests tech/SaaS industry. Recommended campaign tone: professional,
                          data-driven, innovation-focused.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-slate-400 mb-1">Branding Score</p>
                      <p className="text-2xl font-bold text-green-500">92/100</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-slate-400 mb-1">Campaign Compatibility</p>
                      <p className="text-2xl font-bold text-indigo-400">High</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="bg-slate-900/50 border-indigo-900/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  Chat with ROPA
                </CardTitle>
                <CardDescription>Interact with the autonomous AI agent in natural language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  {chatHistory && chatHistory.length > 0 ? (
                    <div className="space-y-4">
                      {chatHistory.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === "user"
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 border border-slate-700"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <Streamdown>{msg.content}</Streamdown>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                        <p>No messages yet. Start a conversation with ROPA!</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask ROPA anything..."
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder:text-slate-500"
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting || !message.trim()}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t border-cyan-500/20 bg-black/50 backdrop-blur mt-8">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>ROPA v3.0 • 129 Tools • Auto-refresh: ON</p>
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
