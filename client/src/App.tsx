import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GlobalSearch } from "./components/GlobalSearch";
import { OnboardingTour } from "./components/OnboardingTour";
import { CompanyProvider } from "./contexts/CompanyContext";

// Platform Pages
// import Home from "./pages/Home"; // Removed: Replaced by Website Home
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Tickets from "./pages/Tickets";
import Analytics from "./pages/Analytics";
import AdminCompanies from "./pages/AdminCompanies";
import UserCompanies from "./pages/UserCompanies";
import AgentConfig from "./pages/AgentConfig";
import CompanyReports from "./pages/CompanyReports";
import AuditLog from "./pages/AuditLog";
import Integrations from "./pages/Integrations";
import Permissions from "./pages/Permissions";
import ProspectMetrics from "./pages/ProspectMetrics";
import PipelineDashboard from "@/pages/PipelineDashboard";
import CallHistory from "@/pages/CallHistory";
import ScheduledTasksManagement from "@/pages/ScheduledTasksManagement";
import TaskAnalytics from "@/pages/TaskAnalytics";
import EmailTemplates from "@/pages/EmailTemplates";
import Workflows from "@/pages/Workflows";
import EPMDashboard from "@/pages/EPMDashboard";
import APIConfig from "@/pages/APIConfig";
import MLScoringDashboard from "@/pages/MLScoringDashboard";
import CampaignMetrics from "@/pages/CampaignMetrics";
import ROIDashboard from "@/pages/ROIDashboard";
import ImportLeads from "@/pages/ImportLeads";
import EmailPerformance from "@/pages/EmailPerformance";
import ROICalculator from "./pages/ROICalculator";
import MarketingDashboard from "./pages/MarketingDashboard";
import LeadAssignmentDashboard from "./pages/LeadAssignmentDashboard";
import ABTestDashboard from "./pages/ABTestDashboard";
import WhitepaperDownload from "@/pages/WhitepaperDownload";
import DemoRequest from "@/pages/DemoRequest";
import AgentMonitoring from "@/pages/AgentMonitoring";
import LinkedInContentPanel from "@/pages/LinkedInContentPanel";
import CampaignControl from "@/pages/CampaignControl";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import MultiChannelCampaigns from "@/pages/MultiChannelCampaigns";
import FAGORCampaign from "@/pages/FAGORCampaign";
import AgentsDashboard from "@/pages/AgentsDashboard";
import MilestoneConfig from "@/pages/MilestoneConfig";
import MetaAgent from "@/pages/MetaAgent";
import AgentManagement from "@/pages/AgentManagement";
import AgentTraining from "@/pages/AgentTraining";
import AgentTrends from "@/pages/AgentTrends";
import ABTestingDashboard from "@/pages/ABTestingDashboard";
import ChurnRiskDashboard from "@/pages/ChurnRiskDashboard";
import ExecutiveSummary from "@/pages/ExecutiveSummary";
import CommunicationsDashboard from "@/pages/CommunicationsDashboard";
import MetaAgentDashboard from "@/pages/MetaAgentDashboard";
import CyberDashboard from "@/pages/CyberDashboard";
import CampaignsDashboard from "./pages/CampaignsDashboard";

// Website Pages
import WebsiteHome from "@/pages/website/Home";
import WebsiteAbout from "@/pages/website/About";
import WebsiteServices from "@/pages/website/Services";
import WebsiteTechnology from "@/pages/website/Technology";
import WebsitePricing from "@/pages/website/Pricing";
import WebsiteContact from "@/pages/website/Contact";

function WebsiteRouter() {
  return (
    <Switch>
      <Route path="/" component={WebsiteHome} />
      <Route path="/about" component={WebsiteAbout} />
      <Route path="/services" component={WebsiteServices} />
      <Route path="/technology" component={WebsiteTechnology} />
      <Route path="/pricing" component={WebsitePricing} />
      <Route path="/contact" component={WebsiteContact} />

      {/* Some marketing landing pages might be shared or public? */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/demo-request" component={DemoRequest} />
      <Route path="/whitepaper" component={WhitepaperDownload} />
      <Route path="/roi-calculator" component={ROICalculator} />

      {/* 404 for Website */}
      <Route component={NotFound} />
    </Switch>
  );
}

function PlatformApp() {
  return (
    <CompanyProvider>
      <GlobalSearch />
      <OnboardingTour />
      <Switch>
        <Route path="/profile" component={Profile} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/leads" component={Leads} />
        <Route path="/tickets" component={Tickets} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/admin/companies" component={AdminCompanies} />
        <Route path="/admin/user-companies" component={UserCompanies} />
        <Route path="/admin/agent-config" component={AgentConfig} />
        <Route path="/admin/company-reports" component={CompanyReports} />
        <Route path="/admin/audit-log" component={AuditLog} />
        <Route path="/admin/integrations" component={Integrations} />
        <Route path="/admin/api-config" component={APIConfig} />
        <Route path="/admin/permissions" component={Permissions} />
        <Route path="/analytics/prospect-metrics" component={ProspectMetrics} />
        <Route path="/analytics/pipeline" component={PipelineDashboard} />
        <Route path="/calls" component={CallHistory} />
        <Route path="/communications" component={CommunicationsDashboard} />
        <Route path="/scheduled-tasks" component={ScheduledTasksManagement} />
        <Route path="/analytics/tasks" component={TaskAnalytics} />
        <Route path="/email-templates" component={EmailTemplates} />
        <Route path="/epm-dashboard" component={EPMDashboard} />
        <Route path="/workflows" component={Workflows} />
        <Route path="/analytics/ml-scoring" component={MLScoringDashboard} />
        <Route path="/analytics/campaigns" component={CampaignMetrics} />
        <Route path="/analytics/roi" component={ROIDashboard} />
        <Route path="/admin/import-leads" component={ImportLeads} />
        <Route path="/analytics/email-performance" component={EmailPerformance} />

        <Route path="/marketing-dashboard" component={MarketingDashboard} />
        <Route path="/agent-monitoring" component={AgentMonitoring} />
        <Route path="/linkedin-content" component={LinkedInContentPanel} />
        <Route path="/campaign-control" component={CampaignControl} />
        <Route path="/multi-channel-campaigns" component={MultiChannelCampaigns} />
        <Route path="/fagor-campaign" component={FAGORCampaign} />
        <Route path="/agents-dashboard" component={AgentsDashboard} />
        <Route path="/agent-trends" component={AgentTrends} />
        <Route path="/ab-testing" component={ABTestingDashboard} />
        <Route path="/churn-risk" component={ChurnRiskDashboard} />
        <Route path="/executive-summary" component={ExecutiveSummary} />
        <Route path="/milestone-config" component={MilestoneConfig} />
        <Route path="/meta-agent" component={MetaAgent} />
        <Route path="/meta-agent-dashboard" component={MetaAgentDashboard} />
        <Route path="/campaigns-dashboard" component={CampaignsDashboard} />
        <Route path="/cyber-dashboard" component={CyberDashboard} />
        <Route path="/agents/manage" component={AgentManagement} />
        <Route path="/agents/training" component={AgentTraining} />
        <Route path="/ab-test-dashboard" component={ABTestDashboard} />
        <Route path="/lead-assignment" component={LeadAssignmentDashboard} />

        <Route path="/404" component={NotFound} />
        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </CompanyProvider>
  );
}

function App() {
  const [location] = useLocation();

  // Define public paths that should render the WebsiteRouter
  // We use strict matching or prefix matching
  const publicPaths = [
    "/",
    "/about",
    "/services",
    "/technology",
    "/pricing",
    "/contact",
    "/privacy-policy",
    "/demo-request",
    "/whitepaper",
    "/roi-calculator"
  ];

  const isPublic = publicPaths.includes(location) ||
    publicPaths.some(path => path !== "/" && location.startsWith(path + "/"));

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {isPublic ? <WebsiteRouter /> : <PlatformApp />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
// Build timestamp: 1763941960
