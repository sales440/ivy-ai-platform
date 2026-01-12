import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Target,
  Mail,
  Phone,
  Share2,
  MessageCircle,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Settings,
  Home,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  ListTodo,
  Bell,
  HeartPulse,
  CalendarDays,
  Maximize2,
  Minimize2,
  GripHorizontal,
  Move,
} from "lucide-react";
import { APP_TITLE } from "@/const";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Color palette
const COLORS = {
  cyan: "#06b6d4",
  teal: "#14b8a6",
  orange: "#fb923c",
  purple: "#a855f7",
  pink: "#ec4899",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
};

const CHART_COLORS = [COLORS.cyan, COLORS.teal, COLORS.orange, COLORS.purple, COLORS.pink, COLORS.green];

// Mock data for companies and campaigns
const mockCompanies = [
  { id: 1, name: "FAGOR Automation", industry: "Manufacturing" },
  { id: 2, name: "EPM Construcciones", industry: "Construction" },
  { id: 3, name: "TechStart Inc", industry: "Technology" },
  { id: 4, name: "Global Services LLC", industry: "Services" },
];

const mockCampaignData = [
  { month: "Ene", FAGOR: 45, EPM: 32, TechStart: 28, Global: 15 },
  { month: "Feb", FAGOR: 52, EPM: 38, TechStart: 35, Global: 22 },
  { month: "Mar", FAGOR: 61, EPM: 45, TechStart: 42, Global: 28 },
  { month: "Abr", FAGOR: 58, EPM: 52, TechStart: 48, Global: 35 },
  { month: "May", FAGOR: 72, EPM: 58, TechStart: 55, Global: 42 },
  { month: "Jun", FAGOR: 85, EPM: 65, TechStart: 62, Global: 48 },
];

const mockCampaignsByType = [
  { name: "Email", value: 45, color: COLORS.cyan },
  { name: "Phone", value: 25, color: COLORS.teal },
  { name: "Social Media", value: 20, color: COLORS.orange },
  { name: "Multi-Channel", value: 10, color: COLORS.purple },
];

const mockConversionData = [
  { company: "FAGOR", leads: 120, converted: 45, rate: 37.5 },
  { company: "EPM", leads: 85, converted: 28, rate: 32.9 },
  { company: "TechStart", leads: 65, converted: 22, rate: 33.8 },
  { company: "Global", leads: 42, converted: 12, rate: 28.6 },
];

// Sidebar menu items
const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "campaigns", label: "Campañas", icon: Megaphone },
  { id: "tasks", label: "Tareas", icon: ListTodo },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "health", label: "Salud", icon: HeartPulse },
  { id: "calendar", label: "Calendario", icon: CalendarDays, isPage: true },
  { id: "settings", label: "Configuración", icon: Settings },
];

export default function RopaDashboardV2() {
  const [, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMaximized, setChatMaximized] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Drag state for chat window
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);

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

  const { data: campaigns } = trpc.campaigns.getCampaigns.useQuery();

  // Mutations
  const sendChatMutation = trpc.ropa.sendChatMessage.useMutation({
    onSuccess: (data) => {
      refetchChat();
      setMessage("");
      setIsSubmitting(false);
      // Text-to-speech for ROPA response
      if (voiceEnabled && data.response) {
        speakText(data.response);
      }
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  const stopMutation = trpc.ropa.stop.useMutation();
  const runAuditMutation = trpc.ropa.runAudit.useMutation();

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "es-ES";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    sendChatMutation.mutate({ message });
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.isPage && item.id === "calendar") {
      setLocation("/ropa/calendar");
    } else {
      setActiveSection(item.id);
    }
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

  // Drag handlers for chat window
  const handleDragStart = (e: React.MouseEvent) => {
    if (chatMaximized) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = chatWindowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || chatMaximized) return;
    e.preventDefault();
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep window within viewport bounds
    const maxX = window.innerWidth - (chatWindowRef.current?.offsetWidth || 400);
    const maxY = window.innerHeight - (chatWindowRef.current?.offsetHeight || 500);
    
    setChatPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Reset position when maximizing/minimizing
  const toggleMaximize = () => {
    if (!chatMaximized) {
      setChatPosition({ x: 0, y: 0 });
    }
    setChatMaximized(!chatMaximized);
    setChatMinimized(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || chatMaximized) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - (chatWindowRef.current?.offsetWidth || 400);
      const maxY = window.innerHeight - (chatWindowRef.current?.offsetHeight || 500);
      
      setChatPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, chatMaximized]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-900 text-white flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-black/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col transition-all duration-300 relative`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-lg">ROPA</h1>
                <p className="text-xs text-slate-400">Meta-Agent</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30"
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {item.id === "alerts" && alerts && alerts.length > 0 && (
                <Badge className="ml-auto bg-red-500 text-white text-xs">
                  {alerts.length}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Status Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status?.status)} animate-pulse`} />
            {!sidebarCollapsed && (
              <span className="text-xs text-slate-400">
                {status?.isRunning ? "Autónomo Activo" : "Detenido"}
              </span>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-black/30 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {activeSection === "dashboard" && "Panel de Control"}
                {activeSection === "campaigns" && "Gestión de Campañas"}
                {activeSection === "tasks" && "Tareas de ROPA"}
                {activeSection === "alerts" && "Alertas del Sistema"}
                {activeSection === "health" && "Salud de la Plataforma"}
                {activeSection === "settings" && "Configuración"}
              </h2>
              <p className="text-sm text-slate-400">
                Sistema autónomo de IA manteniendo {APP_TITLE} 24/7
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Company Filter */}
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-48 bg-slate-900/50 border-slate-700">
                  <Building2 className="w-4 h-4 mr-2 text-cyan-400" />
                  <SelectValue placeholder="Todas las empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las empresas</SelectItem>
                  {mockCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Control Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => stopMutation.mutate()}
                disabled={!status?.isRunning}
                className="bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
              >
                <Square className="w-4 h-4 mr-2" />
                Detener
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAuditMutation.mutate()}
                disabled={runAuditMutation.isPending}
                className="bg-cyan-500/10 border-cyan-500/50 hover:bg-cyan-500/20"
              >
                {runAuditMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                Auditoría
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {activeSection === "dashboard" && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Estado del Sistema</p>
                        <p className="text-2xl font-bold mt-1">
                          {status?.isRunning ? "ACTIVO" : "DETENIDO"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Modo autónomo</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl ${status?.isRunning ? "bg-green-500/20" : "bg-red-500/20"} flex items-center justify-center`}>
                        <Zap className={`w-6 h-6 ${status?.isRunning ? "text-green-400" : "text-red-400"}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Campañas Activas</p>
                        <p className="text-2xl font-bold mt-1">
                          {campaigns?.filter((c) => c.status === "active").length || 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {campaigns?.length || 0} totales
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Tareas Completadas</p>
                        <p className="text-2xl font-bold mt-1">{stats?.tasks.completed || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {stats?.tasks.running || 0} en progreso
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-teal-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Salud Plataforma</p>
                        <p className={`text-2xl font-bold mt-1 ${getHealthColor(stats?.platform.health)}`}>
                          {stats?.platform.health === "healthy" ? "ÓPTIMA" : stats?.platform.health?.toUpperCase() || "..."}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {stats?.platform.criticalIssues || 0} problemas críticos
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <HeartPulse className="w-6 h-6 text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Performance by Company */}
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      Rendimiento por Empresa
                    </CardTitle>
                    <CardDescription>Leads generados por mes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={mockCampaignData}>
                        <defs>
                          <linearGradient id="colorFagor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorEpm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="FAGOR"
                          stroke={COLORS.cyan}
                          fill="url(#colorFagor)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="EPM"
                          stroke={COLORS.teal}
                          fill="url(#colorEpm)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="TechStart"
                          stroke={COLORS.orange}
                          fill="url(#colorTech)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="Global"
                          stroke={COLORS.purple}
                          fill="url(#colorGlobal)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Campaign Types Distribution */}
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-teal-400" />
                      Distribución de Campañas
                    </CardTitle>
                    <CardDescription>Por tipo de canal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={mockCampaignsByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {mockCampaignsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Rates */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-400" />
                    Tasas de Conversión por Empresa
                  </CardTitle>
                  <CardDescription>Leads vs Conversiones</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockConversionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="company" type="category" stroke="#94a3b8" width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="leads" name="Leads" fill={COLORS.cyan} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="converted" name="Convertidos" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tasks */}
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      Tareas Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      {tasks && tasks.length > 0 ? (
                        <div className="space-y-3">
                          {tasks.slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800/50"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    task.status === "completed"
                                      ? "bg-green-500"
                                      : task.status === "running"
                                      ? "bg-yellow-500 animate-pulse"
                                      : "bg-slate-500"
                                  }`}
                                />
                                <span className="text-sm">{task.type}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  task.status === "completed"
                                    ? "border-green-500/50 text-green-400"
                                    : "border-slate-500/50"
                                }
                              >
                                {task.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-slate-500 py-8">No hay tareas recientes</p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Alerts */}
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      Alertas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[250px]">
                      {alerts && alerts.length > 0 ? (
                        <div className="space-y-3">
                          {alerts.map((alert, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border ${
                                alert.severity === "critical"
                                  ? "bg-red-500/10 border-red-500/30"
                                  : alert.severity === "warning"
                                  ? "bg-yellow-500/10 border-yellow-500/30"
                                  : "bg-slate-800/50 border-slate-700/50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  className={
                                    alert.severity === "critical"
                                      ? "bg-red-500"
                                      : alert.severity === "warning"
                                      ? "bg-yellow-500"
                                      : "bg-slate-500"
                                  }
                                >
                                  {alert.severity}
                                </Badge>
                                <span className="text-sm font-medium">{alert.title}</span>
                              </div>
                              <p className="text-xs text-slate-400">{alert.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-slate-500 py-8">
                          No hay alertas activas
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Other sections would go here */}
          {activeSection === "campaigns" && (
            <div className="text-center py-20">
              <Megaphone className="w-16 h-16 mx-auto text-cyan-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Gestión de Campañas</h3>
              <p className="text-slate-400">Usa el chat flotante para interactuar con ROPA sobre campañas</p>
            </div>
          )}

          {activeSection === "tasks" && (
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Todas las Tareas</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {tasks && tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{task.type}</span>
                            <Badge
                              variant={task.status === "completed" ? "default" : "outline"}
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            ID: {task.taskId}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">No hay tareas</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {activeSection === "alerts" && (
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Todas las Alertas</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {alerts && alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border ${
                            alert.severity === "critical"
                              ? "bg-red-500/10 border-red-500/30"
                              : alert.severity === "warning"
                              ? "bg-yellow-500/10 border-yellow-500/30"
                              : "bg-slate-800/50 border-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={
                                alert.severity === "critical"
                                  ? "bg-red-500"
                                  : alert.severity === "warning"
                                  ? "bg-yellow-500"
                                  : "bg-slate-500"
                              }
                            >
                              {alert.severity}
                            </Badge>
                            <span className="font-medium">{alert.title}</span>
                          </div>
                          <p className="text-sm text-slate-300">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">No hay alertas</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {activeSection === "health" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Estado General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>CPU</span>
                    <Progress value={35} className="w-1/2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Memoria</span>
                    <Progress value={52} className="w-1/2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Base de Datos</span>
                    <Progress value={28} className="w-1/2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API</span>
                    <Progress value={15} className="w-1/2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>Métricas de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                    <span>Tasa de Éxito</span>
                    <span className="text-green-400 font-bold">
                      {stats?.performance.successRate || 100}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                    <span>Tiempo de Respuesta</span>
                    <span className="text-cyan-400 font-bold">
                      {stats?.performance.avgResponseTime || 1.2}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                    <span>Errores Corregidos Hoy</span>
                    <span className="text-teal-400 font-bold">
                      {stats?.typescript.fixedToday || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "settings" && (
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Configuración de ROPA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">Configuración próximamente...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-14 right-6 w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full shadow-lg shadow-cyan-500/50 flex items-center justify-center hover:scale-110 transition-transform z-[9999] animate-pulse"
          style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.6)' }}
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Floating Chat Window - Draggable & Maximizable */}
      {chatOpen && (
        <div
          ref={chatWindowRef}
          className={`fixed z-[9999] transition-all ${isDragging ? 'cursor-grabbing' : ''} ${
            chatMaximized 
              ? 'inset-0 m-0' 
              : chatMinimized 
                ? '' 
                : ''
          }`}
          style={chatMaximized ? {} : {
            left: chatPosition.x || 'auto',
            top: chatPosition.y || 'auto',
            right: chatPosition.x === 0 && chatPosition.y === 0 ? '24px' : 'auto',
            bottom: chatPosition.x === 0 && chatPosition.y === 0 ? '56px' : 'auto',
          }}
        >
          <div
            className={`bg-slate-900/98 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden transition-all duration-300 ${
              chatMaximized 
                ? 'w-full h-full rounded-none' 
                : chatMinimized 
                  ? 'w-80 h-16 rounded-2xl' 
                  : 'w-[450px] h-[600px] rounded-2xl'
            }`}
          >
            {/* Chat Header - Draggable Area */}
            <div
              className={`flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500/30 to-teal-500/30 border-b border-cyan-500/30 ${
                chatMaximized ? '' : 'cursor-grab'
              } ${isDragging ? 'cursor-grabbing' : ''} select-none`}
              onMouseDown={handleDragStart}
            >
              <div className="flex items-center gap-3">
                {/* Drag Handle Icon */}
                {!chatMaximized && !chatMinimized && (
                  <div className="text-slate-500 hover:text-cyan-400 transition-colors">
                    <Move className="w-4 h-4" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">ROPA</h3>
                  {!chatMinimized && (
                    <p className="text-xs text-cyan-400">Meta-Agent Autónomo • Interacción por Voz</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Voice Toggle */}
                {!chatMinimized && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVoiceEnabled(!voiceEnabled);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      voiceEnabled 
                        ? "bg-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/20" 
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                    title={voiceEnabled ? "Desactivar voz" : "Activar voz"}
                  >
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                )}
                {/* Minimize Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatMinimized(!chatMinimized);
                    if (chatMaximized) setChatMaximized(false);
                  }}
                  className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all"
                  title={chatMinimized ? "Restaurar" : "Minimizar"}
                >
                  {chatMinimized ? <ChevronRight className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
                </button>
                {/* Maximize Button */}
                {!chatMinimized && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMaximize();
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      chatMaximized 
                        ? "bg-cyan-500/30 text-cyan-400" 
                        : "hover:bg-slate-700/50 text-slate-400 hover:text-white"
                    }`}
                    title={chatMaximized ? "Restaurar tamaño" : "Maximizar"}
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>
                )}
                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatOpen(false);
                    setChatMaximized(false);
                    setChatMinimized(false);
                  }}
                  className="p-2 rounded-lg hover:bg-red-500/30 text-slate-400 hover:text-red-400 transition-all"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!chatMinimized && (
              <>
                <ScrollArea className={`p-4 ${chatMaximized ? 'h-[calc(100vh-140px)]' : 'h-[440px]'}`}>
                  {chatHistory && chatHistory.length > 0 ? (
                    <div className="space-y-4">
                      {chatHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-2xl ${
                              msg.role === "user"
                                ? "bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20"
                                : "bg-slate-800/80 text-slate-100 border border-slate-700/50"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                        <Bot className="w-10 h-10 text-cyan-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">¡Hola! Soy ROPA</h4>
                      <p className="text-slate-400 text-sm mb-4">
                        Tu meta-agente autónomo de Ivy.AI
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 text-xs">
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">Campañas</span>
                        <span className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full">Tareas</span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full">Métricas</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-4">
                        Escribe o usa el micrófono para hablar conmigo
                      </p>
                    </div>
                  )}
                </ScrollArea>

                {/* Chat Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-slate-700/50 bg-slate-950/80"
                >
                  <div className="flex items-center gap-3">
                    {/* Voice Input Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={!recognitionRef.current}
                      className={`p-3 rounded-xl transition-all ${
                        isListening
                          ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                          : "bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 border border-slate-700"
                      }`}
                      title={isListening ? "Detener grabación" : "Hablar con ROPA"}
                    >
                      {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    {/* Text Input */}
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder:text-slate-500 text-base"
                      disabled={isSubmitting}
                    />
                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim()}
                      className="p-3 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl text-white disabled:opacity-50 hover:opacity-90 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                      title="Enviar mensaje"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Send className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                  {/* Voice Status Indicator */}
                  {isListening && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span>Escuchando... Habla ahora</span>
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-cyan-400 text-sm">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                      <span>ROPA está hablando...</span>
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer Status */}
      <div className="fixed bottom-0 left-0 right-0 h-8 bg-black/50 backdrop-blur border-t border-slate-800/50 flex items-center justify-center text-xs text-slate-500 z-40">
        <span>ROPA v2.0 • {TOTAL_TOOLS || "50+"}+ Tools • Auto-refresh: ON</span>
        <span className="mx-4">•</span>
        <span>
          Última actualización:{" "}
          {new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// Import TOTAL_TOOLS from ropa-tools if available
const TOTAL_TOOLS = 129;
