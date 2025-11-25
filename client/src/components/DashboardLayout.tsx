import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { CompanySelector } from "@/components/CompanySelector";
import { LayoutDashboard, LogOut, PanelLeft, Users, Building2, Ticket, UserCircle, BarChart3, Terminal, Workflow, Settings, FileText, Plug, Shield, TrendingUp, GitBranch, Phone, Clock, Activity, Mail, Target, Upload, DollarSign, Zap, Bot, LineChart, FlaskConical, AlertTriangle, Briefcase } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: Ticket, label: "Tickets", path: "/tickets" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: TrendingUp, label: "Prospect Metrics", path: "/analytics/prospect-metrics" },
  { icon: GitBranch, label: "Pipeline Dashboard", path: "/analytics/pipeline" },
  { icon: Activity, label: "Task Analytics", path: "/analytics/tasks" },
  { icon: Target, label: "ML Scoring Dashboard", path: "/analytics/ml-scoring" },
  { icon: DollarSign, label: "ROI Dashboard", path: "/analytics/roi" },
  { icon: Mail, label: "Campaign Metrics", path: "/analytics/campaigns" },
  { icon: Mail, label: "Performance de Emails", path: "/analytics/email-performance" },
  { icon: Zap, label: "Multi-Channel Campaigns", path: "/multi-channel-campaigns" },
  { icon: Briefcase, label: "FAGOR Executive Summary", path: "/executive-summary" },
  { icon: Bot, label: "FAGOR Agents Dashboard", path: "/agents-dashboard" },
  { icon: LineChart, label: "FAGOR Agent Trends", path: "/agent-trends" },
  { icon: FlaskConical, label: "FAGOR A/B Testing", path: "/ab-testing" },
  { icon: AlertTriangle, label: "FAGOR Churn Risk", path: "/churn-risk" },
  { icon: Mail, label: "FAGOR Campaign Control", path: "/fagor-campaign" },
  { icon: Phone, label: "Call History", path: "/calls" },
  { icon: Clock, label: "Scheduled Tasks", path: "/scheduled-tasks" },
  { icon: Mail, label: "Email Templates", path: "/email-templates" },
  { icon: Terminal, label: "Console", path: "/console" },
  { icon: Workflow, label: "Workflows", path: "/workflows" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
  { icon: Building2, label: "Gestión de Empresas", path: "/admin/companies", adminOnly: true },
  { icon: Users, label: "Asignaciones Usuario-Empresa", path: "/admin/user-companies", adminOnly: true },
  { icon: Settings, label: "Configuración de Agentes", path: "/admin/agent-config", adminOnly: true },
  { icon: BarChart3, label: "Reportes Comparativos", path: "/admin/company-reports", adminOnly: true },
  { icon: FileText, label: "Auditoría de Cambios", path: "/admin/audit-log", adminOnly: true },
  { icon: Plug, label: "Integraciones CRM", path: "/admin/integrations", adminOnly: true },
  { icon: Shield, label: "Gestión de Permisos", path: "/admin/permissions", adminOnly: true },
  { icon: Upload, label: "Importar Leads", path: "/admin/import-leads", adminOnly: true },
  { icon: Settings, label: "Milestone Configuration", path: "/admin/milestone-config", adminOnly: true },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-auto py-4 justify-center">
            <div className="flex flex-col items-center gap-2 px-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src="/ivy-ai-logo.png"
                    className="h-8 w-8 object-contain"
                    alt="Ivy.AI Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-3 w-full">
                    <img
                      src="/ivy-ai-logo.png"
                      className="h-16 w-16 object-contain"
                      alt="Ivy.AI Logo"
                    />
                    <span className="font-semibold tracking-tight text-center text-lg">
                      Ivy.AI Platform
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.filter(item => !item.adminOnly || user?.role === 'admin').map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Header/Topbar - Always visible */}
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            <div className="flex items-center gap-3">
              <span className="tracking-tight text-foreground font-medium">
                {activeMenuItem?.label ?? APP_TITLE}
              </span>
            </div>
          </div>
          <CompanySelector />
        </div>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
