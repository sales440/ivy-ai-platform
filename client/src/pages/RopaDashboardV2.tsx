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
  Globe,
  Sparkles,
  Brain,
  Plug,
  Save,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  Pause,
  PlayCircle,
  StopCircle,
  Building,
  Briefcase,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";
import { MonitorDraftList } from "@/components/MonitorDraftList";
import { MonitorDraftPopup, Draft, DraftType } from "@/components/MonitorDraftPopup";
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
  { id: "files", label: "Archivos", icon: Upload },
  { id: "monitor", label: "Monitor", icon: Eye },
  { id: "tasks", label: "Tareas", icon: ListTodo },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "health", label: "Salud", icon: HeartPulse },
  { id: "calendar", label: "Calendario", icon: CalendarDays, isPage: true },
  { id: "settings", label: "Configuración", icon: Settings },
];

export default function RopaDashboardV2() {
  const [, navigate] = useLocation();
  const uploadFileMutation = trpc.fileUpload.upload.useMutation();
  const uploadToGoogleDriveMutation = trpc.googleDrive.uploadFile.useMutation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  
  // Company & Campaign Management state
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [showEditCompanyDialog, setShowEditCompanyDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [newCompany, setNewCompany] = useState({ name: "", industry: "", contactEmail: "", contactPhone: "" });
  const [newCampaign, setNewCampaign] = useState({ name: "", companyId: "", type: "email", description: "", targetLeads: 100 });
  const [localCompanies, setLocalCompanies] = useState<any[]>([]);
  const [localCampaigns, setLocalCampaigns] = useState<any[]>([]);
  
  // All drafts for Monitor section - now persisted in database
  const [allDrafts, setAllDrafts] = useState<Draft[]>([]);
  const [monitorTab, setMonitorTab] = useState<DraftType | 'all'>('all');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'sent' | 'all'>('all');
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  
  // Legacy emailDrafts for backward compatibility
  const emailDrafts = allDrafts.filter(d => d.type === 'email');
  const [selectedEmailDraft, setSelectedEmailDraft] = useState<string | null>(null);
  
  // Chat state - declared early for use in queries
  const [chatOpen, setChatOpen] = useState(false);
  
  // Google Drive connection state - Initialize from localStorage for persistence
  const [googleDriveConnected, setGoogleDriveConnected] = useState(() => {
    // Check localStorage first for immediate state restoration
    const saved = localStorage.getItem('googleDriveConnected');
    return saved === 'true';
  });
  const [connectingGoogleDrive, setConnectingGoogleDrive] = useState(() => {
    // If localStorage says connected, don't show loading
    const saved = localStorage.getItem('googleDriveConnected');
    return saved !== 'true';
  });
  const [checkingConnection, setCheckingConnection] = useState(() => {
    // If localStorage says connected, don't show checking
    const saved = localStorage.getItem('googleDriveConnected');
    return saved !== 'true';
  });
  
  // Check Google Drive connection status via API (background verification)
  const checkGoogleDriveConnection = async (silent: boolean = false) => {
    try {
      if (!silent) {
        console.log('[Google Drive] Checking connection...');
      }
      const response = await fetch('/api/trpc/googleDrive.isConnected');
      const data = await response.json();
      
      if (!silent) {
        console.log('[Google Drive] API Response:', JSON.stringify(data));
      }
      
      // tRPC returns { result: { data: { connected: boolean } } }
      let connected = false;
      if (data?.result?.data?.connected === true) {
        connected = true;
      } else if (data?.connected === true) {
        connected = true;
      }
      
      if (!silent) {
        console.log('[Google Drive] Connection status:', connected);
      }
      
      // Update state and localStorage
      setGoogleDriveConnected(connected);
      localStorage.setItem('googleDriveConnected', connected ? 'true' : 'false');
      
      // Also store the last verification timestamp
      if (connected) {
        localStorage.setItem('googleDriveLastVerified', Date.now().toString());
      }
      
      return connected;
    } catch (error) {
      console.error('[Google Drive] Error checking connection:', error);
      // On error, keep the current state from localStorage instead of disconnecting
      const savedState = localStorage.getItem('googleDriveConnected') === 'true';
      setGoogleDriveConnected(savedState);
      return savedState;
    } finally {
      setCheckingConnection(false);
      setConnectingGoogleDrive(false);
    }
  };
  
  // Check Google Drive connection status on mount and after OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle OAuth callback - trust the parameter from backend
    if (urlParams.get('google_drive_connected') === 'true') {
      console.log('[Google Drive] OAuth success detected in URL');
      toast.success('Google Drive conectado exitosamente');
      // Set connected immediately - backend already confirmed it
      setGoogleDriveConnected(true);
      setCheckingConnection(false);
      setConnectingGoogleDrive(false);
      localStorage.setItem('googleDriveConnected', 'true');
      localStorage.setItem('googleDriveLastVerified', Date.now().toString());
      setActiveSection('files'); // Navigate to files section
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('error') === 'google_auth_failed') {
      const message = urlParams.get('message') || 'Error desconocido';
      toast.error(`Error conectando Google Drive: ${message}`);
      localStorage.setItem('googleDriveConnected', 'false');
      setActiveSection('files');
      window.history.replaceState({}, '', window.location.pathname);
      setCheckingConnection(false);
      setConnectingGoogleDrive(false);
    } else {
      // Normal page load - check if we have a cached connection
      const cachedConnection = localStorage.getItem('googleDriveConnected') === 'true';
      const lastVerified = parseInt(localStorage.getItem('googleDriveLastVerified') || '0');
      const fiveMinutes = 5 * 60 * 1000;
      
      if (cachedConnection) {
        // Already connected from localStorage - keep state, verify silently in background
        console.log('[Google Drive] Using cached connection state: CONNECTED');
        setGoogleDriveConnected(true);
        setCheckingConnection(false);
        setConnectingGoogleDrive(false);
        
        // Only verify with API if last check was more than 5 minutes ago
        if (Date.now() - lastVerified > fiveMinutes) {
          console.log('[Google Drive] Background verification (last check > 5 min ago)');
          checkGoogleDriveConnection(true); // Silent check
        }
      } else {
        // Not connected - check API
        checkGoogleDriveConnection();
      }
    }
  }, []);
  
  // Load companies and campaigns from localStorage
  useEffect(() => {
    const savedCompanies = localStorage.getItem('ropaCompanies');
    const savedCampaigns = localStorage.getItem('ropaCampaigns');
    if (savedCompanies) {
      try { setLocalCompanies(JSON.parse(savedCompanies)); } catch (e) {}
    }
    if (savedCampaigns) {
      try { setLocalCampaigns(JSON.parse(savedCampaigns)); } catch (e) {}
    }
  }, []);
  
  // Load email drafts from database
  const { data: emailDraftsData, refetch: refetchEmailDrafts } = trpc.emailDrafts.getAll.useQuery(
    { limit: 100 },
    { refetchInterval: 30000, enabled: activeSection === 'monitor' } // Refresh every 30 seconds, only when on Monitor section
  );
  
  // Sync database drafts to local state
  useEffect(() => {
    if (emailDraftsData?.drafts) {
      const formattedDrafts: Draft[] = emailDraftsData.drafts.map((d: any) => ({
        id: d.draftId,
        draftId: d.draftId,
        type: (d.type || 'email') as DraftType,
        company: d.company,
        subject: d.subject,
        body: d.body,
        campaign: d.campaign || 'General',
        status: d.status as 'pending' | 'approved' | 'rejected' | 'sent',
        createdAt: d.createdAt,
        recipient: d.recipient,
        phoneNumber: d.phoneNumber,
      }));
      setAllDrafts(formattedDrafts);
    }
  }, [emailDraftsData]);
  
  // Create email draft mutation
  const createEmailDraftMutation = trpc.emailDrafts.create.useMutation({
    onSuccess: () => {
      refetchEmailDrafts();
    },
  });
  
  // Update email draft status mutation
  const updateEmailDraftStatusMutation = trpc.emailDrafts.updateStatus.useMutation({
    onSuccess: () => {
      refetchEmailDrafts();
    },
  });
  
  // ============ ROPA UI STATE SYNC ============
  // Sync UI state to backend so ROPA can see what's happening in real-time
  const updateUIStateMutation = trpc.ropa.updateUIState.useMutation();
  const { data: pendingCommands, refetch: refetchCommands } = trpc.ropa.getPendingCommands.useQuery(
    undefined,
    { refetchInterval: 15000, enabled: chatOpen } // Check for commands every 15 seconds, only when chat is open
  );
  const markCommandExecutedMutation = trpc.ropa.markCommandExecuted.useMutation();
  
  // Sync UI state to backend every 5 seconds
  useEffect(() => {
    const syncUIState = () => {
      const localStorageKeys = Object.keys(localStorage);
      updateUIStateMutation.mutate({
        activeSection,
        emailDrafts,
        googleDriveConnected,
        localStorageKeys,
        errors: [], // Could capture console.error here
        chatHistory: chatHistory || [],
        companies: localCompanies,
        campaigns: localCampaigns,
      });
    };
    
    // Initial sync
    syncUIState();
    
    // Periodic sync
    const interval = setInterval(syncUIState, 30000); // Reduced to 30 seconds
    return () => clearInterval(interval);
  }, [activeSection, emailDrafts, googleDriveConnected, localCompanies, localCampaigns]);
  
  // Process pending commands from ROPA
  useEffect(() => {
    if (!pendingCommands?.commands || pendingCommands.commands.length === 0) return;
    
    pendingCommands.commands.forEach(async (cmd: any) => {
      console.log('[ROPA Command] Executing:', cmd.command, cmd.params);
      
      try {
        switch (cmd.command) {
          case 'clearLocalStorage':
            if (cmd.params?.key) {
              localStorage.removeItem(cmd.params.key);
              toast.info(`ROPA limpió localStorage['${cmd.params.key}']`);
            }
            break;
            
          case 'resetEmailDrafts':
            setAllDrafts([]);
            localStorage.removeItem('ropaEmailDrafts');
            toast.info('ROPA reinició los borradores de email');
            break;
            
          case 'refreshGoogleDrive':
            await checkGoogleDriveConnection();
            toast.info('ROPA refrescó la conexión de Google Drive');
            break;
            
          case 'navigateToSection':
            if (cmd.params?.section) {
              setActiveSection(cmd.params.section);
              toast.info(`ROPA navegó a la sección: ${cmd.params.section}`);
            }
            break;
            
          case 'addEmailDraft':
            if (cmd.params?.company && cmd.params?.subject && cmd.params?.body) {
              addEmailDraft(
                cmd.params.company,
                cmd.params.subject,
                cmd.params.body,
                cmd.params.campaign || 'ROPA Test'
              );
              toast.info('ROPA añadió un borrador de email de prueba');
            }
            break;
            
          default:
            console.warn('[ROPA Command] Unknown command:', cmd.command);
        }
        
        // Mark command as executed
        await markCommandExecutedMutation.mutateAsync({ commandId: cmd.id });
        refetchCommands();
        
      } catch (error) {
        console.error('[ROPA Command] Error executing:', error);
      }
    });
  }, [pendingCommands]);
  
  // ============ END ROPA UI STATE SYNC ============
  
  // Function to add email draft from ROPA chat - now saves to database
  const addEmailDraft = async (company: string, subject: string, body: string, campaign: string) => {
    const draftId = `draft-${Date.now()}`;
    try {
      await createEmailDraftMutation.mutateAsync({
        draftId,
        company,
        subject,
        body,
        campaign,
        createdBy: 'ROPA',
      });
      toast.success(`Email draft guardado para ${company}`);
    } catch (error) {
      console.error('Error creating email draft:', error);
      toast.error('Error al guardar el borrador de email');
    }
  };
  
  // Function to approve/reject email draft - now updates database
  const updateEmailDraftStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // Find the draft to get company and campaign info
      const draft = allDrafts.find(d => d.id === id);
      
      await updateEmailDraftStatusMutation.mutateAsync({
        draftId: id,
        status,
      });
      
      // Show success message
      const typeLabel = draft?.type === 'email' ? 'Email' : draft?.type === 'call' ? 'Script' : 'SMS';
      if (status === 'approved') {
        toast.success(`${typeLabel} aprobado y guardado`);
      } else {
        toast.success('Borrador rechazado');
      }
    } catch (error) {
      console.error('Error updating email draft status:', error);
      toast.error('Error al actualizar el estado del borrador');
    }
  };
  
  // Chat state (chatOpen declared earlier for query dependencies)
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMaximized, setChatMaximized] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // ROPA Configuration state
  const [ropaConfig, setRopaConfig] = useState({
    operationMode: "autonomous" as "autonomous" | "guided" | "hybrid",
    language: "es",
    personality: "professional" as "professional" | "friendly" | "technical",
    maxEmailsPerDay: 100,
    maxCallsPerDay: 50,
    sendingHoursStart: "09:00",
    sendingHoursEnd: "18:00",
    notifications: {
      criticalAlerts: true,
      dailyReports: true,
      campaignMilestones: true,
      newLeads: false,
    },
  });
  
  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('ropaConfig');
    if (savedConfig) {
      try {
        setRopaConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error('Failed to parse saved config');
      }
    }
  }, []);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Drag state for chat window
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.ropa.getDashboardStats.useQuery(undefined, {
    refetchInterval: 60000, // Reduced to 60 seconds
  });

  const { data: status } = trpc.ropa.getStatus.useQuery(undefined, {
    refetchInterval: 30000, // Reduced to 30 seconds
  });

  const { data: tasks } = trpc.ropa.getTasks.useQuery(undefined, {
    refetchInterval: 60000, // Reduced to 60 seconds
  });

  const { data: chatHistory, refetch: refetchChat } = trpc.ropa.getChatHistory.useQuery();

  const { data: alerts } = trpc.ropa.getAlerts.useQuery(undefined, {
    refetchInterval: 60000, // Reduced to 60 seconds
  });

  const { data: campaigns } = trpc.campaigns.getCampaigns.useQuery();

  // Mutations
  const sendChatMutation = trpc.ropa.sendChatMessage.useMutation({
    onSuccess: (data) => {
      refetchChat();
      setMessage("");
      setIsSubmitting(false);
      // Play notification sound when ROPA responds
      playNotificationSound();
      // Increment unread badge if chat is minimized or closed
      if (!chatOpen || chatMinimized) {
        setUnreadMessages(prev => prev + 1);
      }
      // Text-to-speech for ROPA response
      if (voiceEnabled && data.response) {
        speakText(data.response);
      }
      // Parse email drafts from ROPA response and save to Monitor
      if (data.response) {
        const emailMatch = data.response.match(/\[EMAIL_DRAFT\]([^\[]+)\[\/EMAIL_DRAFT\]/g);
        if (emailMatch) {
          emailMatch.forEach((match: string) => {
            const content = match.replace('[EMAIL_DRAFT]', '').replace('[/EMAIL_DRAFT]', '');
            const parts = content.split('|');
            const emailData: Record<string, string> = {};
            parts.forEach(part => {
              const [key, ...valueParts] = part.split('=');
              if (key && valueParts.length) emailData[key.trim()] = valueParts.join('=').trim();
            });
            if (emailData.company && emailData.subject && emailData.body) {
              addEmailDraft(emailData.company, emailData.subject, emailData.body, emailData.campaign || 'General');
            }
          });
        }
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error('[ROPA Chat] Error sending message:', error);
      // Show error toast to user
      const errorMessage = error.message || 'Error al enviar mensaje';
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        toast.error('Error de conexión. Verifica tu internet y vuelve a intentar.');
      } else if (errorMessage.includes('timeout')) {
        toast.error('La respuesta tardó demasiado. Intenta con un mensaje más corto.');
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
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

  // Play notification sound when ROPA responds
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Keyboard shortcut: Ctrl+R to toggle chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        setChatOpen(prev => !prev);
        if (!chatOpen) {
          setChatMinimized(false);
          setUnreadMessages(0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatOpen]);

  // Clear unread messages when chat opens
  useEffect(() => {
    if (chatOpen && !chatMinimized) {
      setUnreadMessages(0);
    }
  }, [chatOpen, chatMinimized]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    // Include context about companies and campaigns in the message
    const contextData = {
      companies: localCompanies.map(c => ({ id: c.id, name: c.name, industry: c.industry })),
      campaigns: localCampaigns.map(c => ({ id: c.id, name: c.name, company: localCompanies.find(co => co.id === c.companyId)?.name, status: c.status, type: c.type })),
      pendingEmails: emailDrafts.filter(d => d.status === 'pending').length,
    };
    const enrichedMessage = `[CONTEXT: ${JSON.stringify(contextData)}] ${message}`;
    sendChatMutation.mutate({ message: enrichedMessage });
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.isPage && item.id === "calendar") {
      navigate("/ropa/calendar");
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
        {/* Logo - Double-click to open chat */}
        <div className="p-4 border-b border-slate-800/50">
          <div 
            className="flex items-center gap-3 cursor-pointer group relative"
            onDoubleClick={() => {
              setChatOpen(true);
              setChatMinimized(false);
              setUnreadMessages(0);
            }}
            title="Doble clic para abrir chat con ROPA (Ctrl+R)"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/50 group-hover:scale-110">
                <Bot className="w-6 h-6 text-white" />
              </div>
              {/* Unread messages badge */}
              {unreadMessages > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-bounce shadow-lg shadow-red-500/50">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">ROPA</h1>
                <p className="text-xs text-slate-400 group-hover:text-cyan-300 transition-colors">Ctrl+R o doble clic</p>
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
                {activeSection === "files" && "Archivos de Empresa"}
                {activeSection === "monitor" && "Monitor de Validación"}
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
                            backgroundColor: "#0f172a",
                            border: "1px solid #22d3ee",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          itemStyle={{
                            color: "#22d3ee",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                            fontWeight: "bold",
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
                            backgroundColor: "#0f172a",
                            border: "1px solid #22d3ee",
                            borderRadius: "8px",
                            color: "#ffffff",
                          }}
                          itemStyle={{
                            color: "#22d3ee",
                          }}
                          labelStyle={{
                            color: "#ffffff",
                            fontWeight: "bold",
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

          {/* Campaign Management Section */}
          {activeSection === "campaigns" && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowNewCompanyDialog(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Empresa
                </Button>
                <Button
                  onClick={() => setShowNewCampaignDialog(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  disabled={localCompanies.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Campaña
                </Button>
              </div>

              {/* Companies Grid */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-cyan-400" />
                    Empresas ({localCompanies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {localCompanies.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-400">No hay empresas registradas</p>
                      <p className="text-sm text-slate-500">Haz clic en "Nueva Empresa" para comenzar</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {localCompanies.map((company) => (
                        <div
                          key={company.id}
                          className="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-cyan-500/50 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{company.name}</h4>
                                <p className="text-xs text-slate-400">{company.industry}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingCompany(company);
                                  setNewCompany(company);
                                  setShowEditCompanyDialog(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const updated = localCompanies.filter(c => c.id !== company.id);
                                  setLocalCompanies(updated);
                                  localStorage.setItem('ropaCompanies', JSON.stringify(updated));
                                  // Also remove campaigns for this company
                                  const updatedCampaigns = localCampaigns.filter(c => c.companyId !== company.id);
                                  setLocalCampaigns(updatedCampaigns);
                                  localStorage.setItem('ropaCampaigns', JSON.stringify(updatedCampaigns));
                                  toast.success('Empresa eliminada');
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            {company.contactEmail && (
                              <div className="flex items-center gap-2 text-slate-400">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{company.contactEmail}</span>
                              </div>
                            )}
                            {company.contactPhone && (
                              <div className="flex items-center gap-2 text-slate-400">
                                <Phone className="w-3 h-3" />
                                <span>{company.contactPhone}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Campañas activas</span>
                              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                                {localCampaigns.filter(c => c.companyId === company.id && c.status === 'active').length}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaigns Table */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-purple-400" />
                    Campañas ({localCampaigns.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {localCampaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <Megaphone className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-400">No hay campañas creadas</p>
                      <p className="text-sm text-slate-500">Primero agrega una empresa, luego crea campañas</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Campaña</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Empresa</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Tipo</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Estado</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Leads</th>
                            <th className="text-left py-3 px-4 text-slate-400 font-medium">Progreso</th>
                            <th className="text-right py-3 px-4 text-slate-400 font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {localCampaigns.map((campaign) => {
                            const company = localCompanies.find(c => c.id === campaign.companyId);
                            return (
                              <tr key={campaign.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="py-3 px-4">
                                  <div className="font-medium text-white">{campaign.name}</div>
                                  <div className="text-xs text-slate-500 truncate max-w-[200px]">{campaign.description}</div>
                                </td>
                                <td className="py-3 px-4 text-slate-300">{company?.name || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={`${
                                    campaign.type === 'email' ? 'border-cyan-500/50 text-cyan-400' :
                                    campaign.type === 'phone' ? 'border-green-500/50 text-green-400' :
                                    campaign.type === 'social' ? 'border-purple-500/50 text-purple-400' :
                                    'border-orange-500/50 text-orange-400'
                                  }`}>
                                    {campaign.type === 'email' ? 'Email' :
                                     campaign.type === 'phone' ? 'Teléfono' :
                                     campaign.type === 'social' ? 'Social' : 'Multi-canal'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge className={`${
                                    campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                    campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                                    campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-slate-500/20 text-slate-400'
                                  }`}>
                                    {campaign.status === 'active' ? 'Activa' :
                                     campaign.status === 'paused' ? 'Pausada' :
                                     campaign.status === 'completed' ? 'Completada' : 'Borrador'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-white">{campaign.currentLeads || 0}</span>
                                  <span className="text-slate-500">/{campaign.targetLeads}</span>
                                </td>
                                <td className="py-3 px-4 w-32">
                                  <div className="flex items-center gap-2">
                                    <Progress 
                                      value={((campaign.currentLeads || 0) / campaign.targetLeads) * 100} 
                                      className="h-2 flex-1" 
                                    />
                                    <span className="text-xs text-slate-400">
                                      {Math.round(((campaign.currentLeads || 0) / campaign.targetLeads) * 100)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-end gap-1">
                                    {campaign.status === 'active' ? (
                                      <button
                                        onClick={() => {
                                          const updated = localCampaigns.map(c => 
                                            c.id === campaign.id ? { ...c, status: 'paused' } : c
                                          );
                                          setLocalCampaigns(updated);
                                          localStorage.setItem('ropaCampaigns', JSON.stringify(updated));
                                          toast.success('Campaña pausada');
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 transition-colors"
                                        title="Pausar"
                                      >
                                        <Pause className="w-4 h-4" />
                                      </button>
                                    ) : campaign.status !== 'completed' ? (
                                      <button
                                        onClick={() => {
                                          const updated = localCampaigns.map(c => 
                                            c.id === campaign.id ? { ...c, status: 'active' } : c
                                          );
                                          setLocalCampaigns(updated);
                                          localStorage.setItem('ropaCampaigns', JSON.stringify(updated));
                                          toast.success('Campaña activada');
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors"
                                        title="Activar"
                                      >
                                        <PlayCircle className="w-4 h-4" />
                                      </button>
                                    ) : null}
                                    <button
                                      onClick={() => {
                                        const updated = localCampaigns.filter(c => c.id !== campaign.id);
                                        setLocalCampaigns(updated);
                                        localStorage.setItem('ropaCampaigns', JSON.stringify(updated));
                                        toast.success('Campaña eliminada');
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Files Section */}
          {activeSection === "files" && (
            <div className="space-y-6">
              {/* Google Drive Connection Status */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${googleDriveConnected ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.01-.02-1.708-3.001-3.775-6.62l-3.76-6.574h-3.758zm-5.516 9.65L3.252 17.71c-.715 1.239-.718 1.24.724 1.24h6.744l2.257-3.254-2.509-4.415c-.2-.35-.381-.694-.542-1.026-.098.196-.201.4-.312.613l-2.63 4.576-.209.365h-.002l-.728 1.266h-2.257l3.479-6.058-.481-.837-.239-.415z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                          Google Drive
                          {googleDriveConnected && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Conectado</Badge>}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {googleDriveConnected 
                            ? 'Sincronización activa - Archivos guardándose automáticamente' 
                            : 'Almacenamiento centralizado para archivos de clientes'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkingConnection ? (
                        <Button disabled className="bg-slate-600/50 text-white">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verificando...
                        </Button>
                      ) : googleDriveConnected ? (
                        <>
                          <Button
                            onClick={() => checkGoogleDriveConnection()}
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Conectado
                          </Button>
                          <Button
                            onClick={() => {
                              setConnectingGoogleDrive(true);
                              window.location.href = '/api/google-drive/auth';
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                          >
                            Reconectar
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => {
                            setConnectingGoogleDrive(true);
                            window.location.href = '/api/google-drive/auth';
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plug className="w-4 h-4 mr-2" />
                          Conectar Google Drive
                        </Button>
                      )}
                    </div>
                  </div>
                  {googleDriveConnected && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        Sincronización activa
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upload Area */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-cyan-400" />
                    Subir Archivos
                  </CardTitle>
                  <CardDescription>
                    {googleDriveConnected 
                      ? 'Sube archivos directamente a Google Drive' 
                      : 'Conecta Google Drive primero para subir archivos'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!googleDriveConnected ? (
                    <div className="border-2 border-dashed border-red-600/50 rounded-xl p-8 text-center bg-red-900/10">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
                      <p className="text-lg font-medium text-red-400 mb-2">Google Drive no conectado</p>
                      <p className="text-sm text-slate-400 mb-4">Debes conectar Google Drive antes de subir archivos</p>
                      <Button
                        onClick={() => window.location.href = '/api/google-drive/auth'}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plug className="w-4 h-4 mr-2" />
                        Conectar Google Drive
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="border-2 border-dashed border-green-600/50 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer bg-green-900/10">
                        <input
                          type="file"
                          multiple
                          accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.svg"
                          className="hidden"
                          id="file-upload"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i];
                              const reader = new FileReader();
                              
                              reader.onload = async () => {
                                try {
                                  const base64 = (reader.result as string).split(',')[1];
                                  toast.loading(`Subiendo ${file.name}...`, { id: `upload-${file.name}` });
                                  
                                  // Upload to Google Drive via tRPC mutation
                                  const result = await uploadToGoogleDriveMutation.mutateAsync({
                                    fileName: file.name,
                                    fileBuffer: base64,
                                    mimeType: file.type,
                                    folderType: 'branding'
                                  });
                                  
                                  if (result.success) {
                                    toast.success(`${file.name} subido a Google Drive`, { id: `upload-${file.name}` });
                                    if (result.webViewLink) {
                                      window.open(result.webViewLink, '_blank');
                                    }
                                  } else {
                                    throw new Error('Error al subir archivo');
                                  }
                                } catch (error: any) {
                                  toast.error(`Error: ${error.message}`, { id: `upload-${file.name}` });
                                }
                              };
                              
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="w-12 h-12 mx-auto text-green-400 mb-4" />
                          <p className="text-lg font-medium text-white mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
                          <p className="text-sm text-green-400">Los archivos se guardarán en Google Drive</p>
                        </label>
                      </div>

                      {/* File Type Selector */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                          { type: "branding", label: "Logo/Branding", icon: Building2, accept: ".png,.jpg,.jpeg,.svg", folder: "branding" },
                          { type: "emailTemplates", label: "Email", icon: Mail, accept: ".html,.txt,.pdf", folder: "emailTemplates" },
                          { type: "campaigns", label: "Campañas", icon: Sparkles, accept: ".pdf,.doc,.docx", folder: "campaigns" },
                          { type: "exports", label: "Documento", icon: FileText, accept: ".pdf,.doc,.docx", folder: "exports" },
                          { type: "clientLists", label: "Clientes", icon: Users, accept: ".xlsx,.xls,.csv", folder: "clientLists" },
                          { type: "backups", label: "Backup", icon: Download, accept: "*", folder: "backups" },
                        ].map((item) => (
                          <label
                            key={item.type}
                            className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-center cursor-pointer"
                          >
                            <input
                              type="file"
                              accept={item.accept}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                const reader = new FileReader();
                                reader.onload = async () => {
                                  try {
                                    const base64 = (reader.result as string).split(',')[1];
                                    toast.loading(`Subiendo ${file.name}...`, { id: `upload-${file.name}` });
                                    
                                    // Upload to Google Drive via tRPC mutation
                                    const result = await uploadToGoogleDriveMutation.mutateAsync({
                                      fileName: file.name,
                                      fileBuffer: base64,
                                      mimeType: file.type,
                                      folderType: item.folder as any
                                    });
                                    
                                    if (result.success) {
                                      toast.success(`${file.name} subido a ${item.label}`, { id: `upload-${file.name}` });
                                      if (result.webViewLink) {
                                        window.open(result.webViewLink, '_blank');
                                      }
                                    } else {
                                      throw new Error('Error al subir archivo');
                                    }
                                  } catch (error: any) {
                                    toast.error(`Error: ${error.message}`, { id: `upload-${file.name}` });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                            <item.icon className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                            <span className="text-xs text-slate-300">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Company Files List */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-400" />
                    Archivos por Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {localCompanies.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400">No hay empresas registradas</p>
                      <p className="text-sm text-slate-500 mt-2">Crea una empresa en la sección de Campañas primero</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {localCompanies.map((company) => (
                        <div key={company.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{company.name}</h4>
                                <p className="text-xs text-slate-400">{company.industry}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="border-slate-700">
                              <Upload className="w-4 h-4 mr-2" />
                              Subir
                            </Button>
                          </div>
                          <div className="text-sm text-slate-500">Sin archivos subidos</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monitor Section */}
          {activeSection === "monitor" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-slate-900/50 border-slate-800 cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setMonitorStatusFilter('pending')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Pendientes</p>
                        <p className="text-2xl font-bold text-yellow-400">{allDrafts.filter(d => d.status === 'pending').length}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-400/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setMonitorStatusFilter('approved')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Aprobados</p>
                        <p className="text-2xl font-bold text-green-400">{allDrafts.filter(d => d.status === 'approved').length}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-400/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setMonitorStatusFilter('rejected')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Rechazados</p>
                        <p className="text-2xl font-bold text-red-400">{allDrafts.filter(d => d.status === 'rejected').length}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-400/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setMonitorStatusFilter('sent')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Enviados</p>
                        <p className="text-2xl font-bold text-blue-400">{allDrafts.filter(d => d.status === 'sent').length}</p>
                      </div>
                      <Send className="h-8 w-8 text-blue-400/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors" onClick={() => setMonitorStatusFilter('all')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total</p>
                        <p className="text-2xl font-bold text-cyan-400">{allDrafts.length}</p>
                      </div>
                      <FileText className="h-8 w-8 text-cyan-400/50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Content List */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-cyan-400" />
                        Monitor de Validación
                      </CardTitle>
                      <CardDescription>Revisa y aprueba emails, scripts de llamada y SMS antes de enviarlos. Doble clic para ver en pantalla completa.</CardDescription>
                    </div>
                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={monitorTab === 'all' ? "border-cyan-500 bg-cyan-500/20 text-cyan-400" : "border-slate-700"}
                        onClick={() => setMonitorTab('all')}
                      >
                        Todos ({allDrafts.length})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={monitorTab === 'email' ? "border-cyan-500 bg-cyan-500/20 text-cyan-400" : "border-slate-700"}
                        onClick={() => setMonitorTab('email')}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Emails ({allDrafts.filter(d => d.type === 'email').length})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={monitorTab === 'call' ? "border-green-500 bg-green-500/20 text-green-400" : "border-slate-700"}
                        onClick={() => setMonitorTab('call')}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Llamadas ({allDrafts.filter(d => d.type === 'call').length})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={monitorTab === 'sms' ? "border-purple-500 bg-purple-500/20 text-purple-400" : "border-slate-700"}
                        onClick={() => setMonitorTab('sms')}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        SMS ({allDrafts.filter(d => d.type === 'sms').length})
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Draft List Component */}
                  <MonitorDraftList
                    drafts={allDrafts}
                    filterType={monitorTab}
                    filterStatus={monitorStatusFilter}
                    onDoubleClick={(draft) => {
                      setSelectedDraft(draft);
                      setIsPopupOpen(true);
                    }}
                    onApprove={(draftId) => updateEmailDraftStatus(draftId, 'approved')}
                    onReject={(draftId) => updateEmailDraftStatus(draftId, 'rejected')}
                  />

                  {/* Instructions */}
                  <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                    <h4 className="text-sm font-medium text-cyan-400 mb-2">💡 Cómo usar el Monitor</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Pídele a ROPA: "Genera un email de campaña para FAGOR Automation"</li>
                      <li>• ROPA creará el contenido y lo mostrará aquí para tu aprobación</li>
                      <li>• Haz doble clic en cualquier borrador para verlo en pantalla completa</li>
                      <li>• Al aprobar, el contenido se guardará en la carpeta del cliente en Google Drive</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Full Screen Popup */}
              <MonitorDraftPopup
                draft={selectedDraft}
                isOpen={isPopupOpen}
                onClose={() => {
                  setIsPopupOpen(false);
                  setSelectedDraft(null);
                }}
                onApprove={async (draftId, editedSubject, editedBody) => {
                  // If content was edited, save it first via fetch API
                  if (editedSubject || editedBody) {
                    try {
                      const response = await fetch('/api/trpc/emailDrafts.updateContent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          draftId,
                          subject: editedSubject || selectedDraft?.subject || '',
                          body: editedBody || selectedDraft?.body || '',
                        }),
                      });
                      if (!response.ok) throw new Error('Failed to update');
                    } catch (error) {
                      console.error('Error saving edited content:', error);
                    }
                  }
                  updateEmailDraftStatus(draftId, 'approved');
                  setIsPopupOpen(false);
                  setSelectedDraft(null);
                }}
                onReject={(draftId) => {
                  updateEmailDraftStatus(draftId, 'rejected');
                  setIsPopupOpen(false);
                  setSelectedDraft(null);
                }}
                onSaveEdit={async (draftId, subject, body) => {
                  const response = await fetch('/api/trpc/emailDrafts.updateContent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ draftId, subject, body }),
                  });
                  if (!response.ok) throw new Error('Failed to update');
                  // Update local state
                  setAllDrafts(prev => prev.map(d => 
                    d.draftId === draftId ? { ...d, subject, body } : d
                  ));
                  if (selectedDraft?.draftId === draftId) {
                    setSelectedDraft({ ...selectedDraft, subject, body });
                  }
                }}
              />
            </div>
          )}

          {activeSection === "tasks" && (
            <div className="space-y-6">
              {/* Tareas Pendientes por Campaña */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-cyan-400" />
                    Tareas Pendientes por Campaña
                  </CardTitle>
                  <CardDescription>Acciones requeridas organizadas por empresa y campaña</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {mockCompanies.map((company) => {
                      const companyTasks = [
                        { id: 1, campaign: "Email Marketing Q1", task: "Revisar lista de contactos", priority: "high", dueDate: "2026-01-15" },
                        { id: 2, campaign: "Llamadas Frías", task: "Preparar script de ventas", priority: "medium", dueDate: "2026-01-16" },
                        { id: 3, campaign: "Social Media", task: "Aprobar contenido programado", priority: "low", dueDate: "2026-01-18" },
                      ];
                      return (
                        <div key={company.id} className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-4 h-4 text-cyan-400" />
                            <span className="font-semibold text-white">{company.name}</span>
                            <Badge variant="outline" className="ml-auto">{companyTasks.length} pendientes</Badge>
                          </div>
                          <div className="space-y-2 pl-6">
                            {companyTasks.map((task) => (
                              <div key={task.id} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-white">{task.task}</p>
                                  <p className="text-xs text-slate-400">{task.campaign} • Vence: {task.dueDate}</p>
                                </div>
                                <Badge className={task.priority === "high" ? "bg-red-500" : task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}>
                                  {task.priority}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Historial de Tareas Completadas */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Tareas Completadas Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tasks?.filter(t => t.status === "completed").slice(0, 5).map((task) => (
                      <div key={task.id} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{task.type}</p>
                          <p className="text-xs text-slate-400">ID: {task.taskId}</p>
                        </div>
                        <Badge className="bg-green-500">completada</Badge>
                      </div>
                    )) || <p className="text-slate-500 text-center py-4">Sin tareas completadas</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "alerts" && (
            <div className="space-y-6">
              {/* Tendencias de Industria por Sector */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    Tendencias de Industria por Sector
                  </CardTitle>
                  <CardDescription>Análisis de mercado y oportunidades detectadas por ROPA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { sector: "Manufactura CNC", trend: "Demanda creciente de retrofits", change: "+15%", recommendation: "Aumentar campañas de upgrade CNC", icon: "🏭" },
                      { sector: "Automatización Industrial", trend: "Adopción de Industry 4.0", change: "+22%", recommendation: "Promover soluciones IoT integradas", icon: "⚙️" },
                      { sector: "Capacitación Técnica", trend: "Escasez de operadores calificados", change: "+18%", recommendation: "Expandir cursos de formación FAGOR", icon: "📚" },
                      { sector: "Mantenimiento Predictivo", trend: "Reducción de tiempos muertos", change: "+12%", recommendation: "Ofrecer contratos de servicio preventivo", icon: "🔧" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="font-semibold text-white">{item.sector}</span>
                          </div>
                          <Badge className="bg-green-500">{item.change}</Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{item.trend}</p>
                        <div className="flex items-center gap-2 text-xs text-cyan-400">
                          <Sparkles className="w-3 h-3" />
                          <span>Recomendación ROPA: {item.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alertas del Sistema */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    Alertas del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts && alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.map((alert, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border ${alert.severity === "critical" ? "bg-red-500/10 border-red-500/30" : alert.severity === "warning" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-slate-800/50 border-slate-700/50"}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={alert.severity === "critical" ? "bg-red-500" : alert.severity === "warning" ? "bg-yellow-500" : "bg-slate-500"}>{alert.severity}</Badge>
                            <span className="font-medium">{alert.title}</span>
                          </div>
                          <p className="text-sm text-slate-300">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">No hay alertas activas</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "health" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estado General */}
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-400" />
                      Estado General
                    </CardTitle>
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

                {/* Métricas de Rendimiento */}
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                      Métricas de Rendimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                      <span>Tasa de Éxito</span>
                      <span className="text-green-400 font-bold">{stats?.performance.successRate || 100}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                      <span>Tiempo de Respuesta</span>
                      <span className="text-cyan-400 font-bold">{stats?.performance.avgResponseTime || 1.2}s</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg">
                      <span>Errores Corregidos Hoy</span>
                      <span className="text-teal-400 font-bold">{stats?.typescript.fixedToday || 241}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Consumo por Proceso */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Consumo por Proceso de ROPA
                  </CardTitle>
                  <CardDescription>Análisis de recursos utilizados por cada módulo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { process: "Generación de Contenido IA", cpu: 45, memory: 60, calls: 1250 },
                      { process: "Análisis de Leads", cpu: 25, memory: 35, calls: 890 },
                      { process: "Sincronización Google Drive", cpu: 15, memory: 20, calls: 450 },
                      { process: "Monitoreo de Campañas", cpu: 30, memory: 40, calls: 2100 },
                      { process: "Generación de Reportes", cpu: 20, memory: 25, calls: 320 },
                    ].map((proc, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{proc.process}</span>
                          <span className="text-xs text-slate-400">{proc.calls} llamadas/día</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-slate-400">CPU</span>
                            <Progress value={proc.cpu} className="h-2" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-400">Memoria</span>
                            <Progress value={proc.memory} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Acciones de Mantenimiento */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-400" />
                    Acciones de Mantenimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => toast.success("Memoria de ROPA reiniciada")}>
                      <Brain className="w-6 h-6 text-purple-400" />
                      <span className="text-xs">Reset Memoria</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => toast.success("Caché limpiado")}>
                      <Trash2 className="w-6 h-6 text-red-400" />
                      <span className="text-xs">Limpiar Caché</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => toast.success("Optimización iniciada")}>
                      <Zap className="w-6 h-6 text-yellow-400" />
                      <span className="text-xs">Optimizar</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => toast.success("Backup creado")}>
                      <Save className="w-6 h-6 text-green-400" />
                      <span className="text-xs">Crear Backup</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-6">
              {/* Operation Mode */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-cyan-400" />
                    Modo de Operación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "autonomous", name: "Autónomo", desc: "ROPA actúa de forma independiente", icon: Zap },
                      { id: "guided", name: "Guiado", desc: "Requiere aprobación humana", icon: Users },
                      { id: "hybrid", name: "Híbrido", desc: "Autónomo para tareas simples", icon: Settings }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setRopaConfig({ ...ropaConfig, operationMode: mode.id as any })}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          ropaConfig.operationMode === mode.id
                            ? "border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20"
                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        }`}
                      >
                        <mode.icon className={`w-6 h-6 mb-2 ${ropaConfig.operationMode === mode.id ? "text-cyan-400" : "text-slate-400"}`} />
                        <div className="font-medium text-white">{mode.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Language & Personality */}
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-teal-400" />
                      Idioma Preferido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { code: "es", name: "Español", flag: "🇪🇸" },
                        { code: "en", name: "English", flag: "🇺🇸" },
                        { code: "eu", name: "Euskera", flag: "🏴" },
                        { code: "it", name: "Italiano", flag: "🇮🇹" },
                        { code: "fr", name: "Français", flag: "🇫🇷" },
                        { code: "de", name: "Deutsch", flag: "🇩🇪" },
                        { code: "zh", name: "中文", flag: "🇨🇳" },
                        { code: "hi", name: "हिंदी", flag: "🇮🇳" },
                        { code: "ar", name: "العربية", flag: "🇸🇦" }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setRopaConfig({ ...ropaConfig, language: lang.code })}
                          className={`p-2 rounded-lg border text-sm transition-all ${
                            ropaConfig.language === lang.code
                              ? "border-teal-500 bg-teal-500/20"
                              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                          }`}
                        >
                          <span className="mr-1">{lang.flag}</span>
                          <span className="text-white">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Personalidad del Agente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { id: "professional", name: "Profesional", desc: "Formal y orientado a negocios" },
                      { id: "friendly", name: "Amigable", desc: "Cercano y conversacional" },
                      { id: "technical", name: "Técnico", desc: "Detallado y preciso" }
                    ].map((personality) => (
                      <button
                        key={personality.id}
                        onClick={() => setRopaConfig({ ...ropaConfig, personality: personality.id as any })}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          ropaConfig.personality === personality.id
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        }`}
                      >
                        <div className="font-medium text-white">{personality.name}</div>
                        <div className="text-xs text-slate-400">{personality.desc}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Limits */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-orange-400" />
                    Límites de Campañas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Emails máximos por día</label>
                      <input
                        type="number"
                        value={ropaConfig.maxEmailsPerDay}
                        onChange={(e) => setRopaConfig({ ...ropaConfig, maxEmailsPerDay: parseInt(e.target.value) || 100 })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Llamadas máximas por día</label>
                      <input
                        type="number"
                        value={ropaConfig.maxCallsPerDay}
                        onChange={(e) => setRopaConfig({ ...ropaConfig, maxCallsPerDay: parseInt(e.target.value) || 50 })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Hora de inicio (envíos)</label>
                      <input
                        type="time"
                        value={ropaConfig.sendingHoursStart}
                        onChange={(e) => setRopaConfig({ ...ropaConfig, sendingHoursStart: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400">Hora de fin (envíos)</label>
                      <input
                        type="time"
                        value={ropaConfig.sendingHoursEnd}
                        onChange={(e) => setRopaConfig({ ...ropaConfig, sendingHoursEnd: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Integrations Status */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plug className="w-5 h-5 text-green-400" />
                    Estado de Integraciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "SendGrid", desc: "Email Marketing", status: "connected", icon: Mail },
                      { name: "OpenAI", desc: "LLM Principal", status: "connected", icon: Brain },
                      { name: "Zapier", desc: "LinkedIn Automation", status: "pending", icon: Share2 },
                      { name: "Telnyx", desc: "Llamadas VoIP", status: "disconnected", icon: Phone },
                      { name: "HubSpot", desc: "CRM Sync", status: "disconnected", icon: Users },
                      { name: "Manus Forge", desc: "LLM Backup", status: "connected", icon: Sparkles }
                    ].map((integration) => (
                      <div
                        key={integration.name}
                        className="p-4 rounded-xl border border-slate-700 bg-slate-800/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <integration.icon className="w-5 h-5 text-slate-400" />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            integration.status === "connected" ? "bg-green-500/20 text-green-400" :
                            integration.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {integration.status === "connected" ? "Conectado" :
                             integration.status === "pending" ? "Pendiente" : "Desconectado"}
                          </span>
                        </div>
                        <div className="font-medium text-white">{integration.name}</div>
                        <div className="text-xs text-slate-400">{integration.desc}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    Preferencias de Notificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: "criticalAlerts", name: "Alertas Críticas", desc: "Errores y problemas urgentes" },
                      { id: "dailyReports", name: "Reportes Diarios", desc: "Resumen de actividad cada 24h" },
                      { id: "campaignMilestones", name: "Milestones de Campañas", desc: "Logros y objetivos alcanzados" },
                      { id: "newLeads", name: "Nuevos Leads", desc: "Notificar cuando se detecten leads" }
                    ].map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                      >
                        <div>
                          <div className="font-medium text-white">{notification.name}</div>
                          <div className="text-xs text-slate-400">{notification.desc}</div>
                        </div>
                        <button
                          onClick={() => setRopaConfig({
                            ...ropaConfig,
                            notifications: {
                              ...ropaConfig.notifications,
                              [notification.id]: !ropaConfig.notifications[notification.id as keyof typeof ropaConfig.notifications]
                            }
                          })}
                          className={`w-12 h-6 rounded-full transition-all ${
                            ropaConfig.notifications[notification.id as keyof typeof ropaConfig.notifications]
                              ? "bg-cyan-500"
                              : "bg-slate-600"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            ropaConfig.notifications[notification.id as keyof typeof ropaConfig.notifications]
                              ? "translate-x-6"
                              : "translate-x-0.5"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    // Save config to localStorage for now
                    localStorage.setItem('ropaConfig', JSON.stringify(ropaConfig));
                    toast.success("Configuración guardada exitosamente");
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-8"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
            </div>
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
                      const newVoiceEnabled = !voiceEnabled;
                      setVoiceEnabled(newVoiceEnabled);
                      // If disabling voice, immediately stop any ongoing speech
                      if (!newVoiceEnabled && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                        setIsSpeaking(false);
                      }
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

      {/* New Company Dialog */}
      <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Nueva Empresa
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Agrega una nueva empresa para gestionar sus campañas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa *</Label>
              <Input
                id="companyName"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Ej: FAGOR Automation"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industria</Label>
              <Select
                value={newCompany.industry}
                onValueChange={(value) => setNewCompany({ ...newCompany, industry: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecciona una industria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacturing">Manufactura</SelectItem>
                  <SelectItem value="Technology">Tecnología</SelectItem>
                  <SelectItem value="Construction">Construcción</SelectItem>
                  <SelectItem value="Services">Servicios</SelectItem>
                  <SelectItem value="Healthcare">Salud</SelectItem>
                  <SelectItem value="Finance">Finanzas</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de Contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                value={newCompany.contactEmail}
                onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                placeholder="contacto@empresa.com"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
              <Input
                id="contactPhone"
                value={newCompany.contactPhone}
                onChange={(e) => setNewCompany({ ...newCompany, contactPhone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCompanyDialog(false);
                setNewCompany({ name: "", industry: "", contactEmail: "", contactPhone: "" });
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newCompany.name.trim()) {
                  toast.error('El nombre de la empresa es requerido');
                  return;
                }
                const company = {
                  id: Date.now().toString(),
                  ...newCompany,
                  createdAt: new Date().toISOString(),
                };
                const updated = [...localCompanies, company];
                setLocalCompanies(updated);
                localStorage.setItem('ropaCompanies', JSON.stringify(updated));
                setShowNewCompanyDialog(false);
                setNewCompany({ name: "", industry: "", contactEmail: "", contactPhone: "" });
                toast.success('Empresa creada exitosamente');
              }}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              Crear Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={showEditCompanyDialog} onOpenChange={setShowEditCompanyDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-cyan-400" />
              Editar Empresa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCompanyName">Nombre de la Empresa *</Label>
              <Input
                id="editCompanyName"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editIndustry">Industria</Label>
              <Select
                value={newCompany.industry}
                onValueChange={(value) => setNewCompany({ ...newCompany, industry: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecciona una industria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacturing">Manufactura</SelectItem>
                  <SelectItem value="Technology">Tecnología</SelectItem>
                  <SelectItem value="Construction">Construcción</SelectItem>
                  <SelectItem value="Services">Servicios</SelectItem>
                  <SelectItem value="Healthcare">Salud</SelectItem>
                  <SelectItem value="Finance">Finanzas</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editContactEmail">Email de Contacto</Label>
              <Input
                id="editContactEmail"
                type="email"
                value={newCompany.contactEmail}
                onChange={(e) => setNewCompany({ ...newCompany, contactEmail: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editContactPhone">Teléfono de Contacto</Label>
              <Input
                id="editContactPhone"
                value={newCompany.contactPhone}
                onChange={(e) => setNewCompany({ ...newCompany, contactPhone: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditCompanyDialog(false);
                setEditingCompany(null);
                setNewCompany({ name: "", industry: "", contactEmail: "", contactPhone: "" });
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newCompany.name.trim()) {
                  toast.error('El nombre de la empresa es requerido');
                  return;
                }
                const updated = localCompanies.map(c => 
                  c.id === editingCompany?.id ? { ...c, ...newCompany } : c
                );
                setLocalCompanies(updated);
                localStorage.setItem('ropaCompanies', JSON.stringify(updated));
                setShowEditCompanyDialog(false);
                setEditingCompany(null);
                setNewCompany({ name: "", industry: "", contactEmail: "", contactPhone: "" });
                toast.success('Empresa actualizada');
              }}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-400" />
              Nueva Campaña
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Crea una nueva campaña de marketing para una empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Nombre de la Campaña *</Label>
              <Input
                id="campaignName"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="Ej: Lanzamiento Q1 2026"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignCompany">Empresa *</Label>
              <Select
                value={newCampaign.companyId}
                onValueChange={(value) => setNewCampaign({ ...newCampaign, companyId: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Selecciona una empresa" />
                </SelectTrigger>
                <SelectContent>
                  {localCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignType">Tipo de Campaña</Label>
              <Select
                value={newCampaign.type}
                onValueChange={(value) => setNewCampaign({ ...newCampaign, type: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="phone">Llamadas Telefónicas</SelectItem>
                  <SelectItem value="social">Redes Sociales</SelectItem>
                  <SelectItem value="multi">Multi-canal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignDescription">Descripción</Label>
              <Textarea
                id="campaignDescription"
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                placeholder="Describe el objetivo de la campaña..."
                className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetLeads">Leads Objetivo</Label>
              <Input
                id="targetLeads"
                type="number"
                value={newCampaign.targetLeads}
                onChange={(e) => setNewCampaign({ ...newCampaign, targetLeads: parseInt(e.target.value) || 100 })}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewCampaignDialog(false);
                setNewCampaign({ name: "", companyId: "", type: "email", description: "", targetLeads: 100 });
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newCampaign.name.trim()) {
                  toast.error('El nombre de la campaña es requerido');
                  return;
                }
                if (!newCampaign.companyId) {
                  toast.error('Selecciona una empresa');
                  return;
                }
                const campaign = {
                  id: Date.now().toString(),
                  ...newCampaign,
                  status: 'draft',
                  currentLeads: 0,
                  createdAt: new Date().toISOString(),
                };
                const updated = [...localCampaigns, campaign];
                setLocalCampaigns(updated);
                localStorage.setItem('ropaCampaigns', JSON.stringify(updated));
                setShowNewCampaignDialog(false);
                setNewCampaign({ name: "", companyId: "", type: "email", description: "", targetLeads: 100 });
                toast.success('Campaña creada exitosamente');
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Crear Campaña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import TOTAL_TOOLS from ropa-tools if available
const TOTAL_TOOLS = 129;
// Force Railway redeploy: 1768245782
