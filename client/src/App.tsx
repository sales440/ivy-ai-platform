import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GlobalSearch } from "./components/GlobalSearch";
import { OnboardingTour } from "./components/OnboardingTour";
import { CompanyProvider } from "./contexts/CompanyContext";
import Home from "./pages/Home";
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
import AgentManagement from "@/pages/AgentManagement";
import AgentTrends from "@/pages/AgentTrends";
import ABTestingDashboard from "@/pages/ABTestingDashboard";
import ChurnRiskDashboard from "@/pages/ChurnRiskDashboard";
import ExecutiveSummary from "@/pages/ExecutiveSummary";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/roi-calculator" component={ROICalculator} />
      <Route path="/whitepaper" component={WhitepaperDownload} />
      <Route path="/demo-request" component={DemoRequest} />
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
      <Route path="/admin/milestone-config" component={MilestoneConfig} />
      <Route path="/agents/manage" component={AgentManagement} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/ab-test-dashboard" component={ABTestDashboard} />
      <Route path="/lead-assignment" component={LeadAssignmentDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/leads"} component={Leads} />
      <Route path={"/tickets"} component={Tickets} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/admin/companies"} component={AdminCompanies} />
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
      <Route path="/scheduled-tasks" component={ScheduledTasksManagement} />
      <Route path={"/analytics/tasks"} component={TaskAnalytics} />
      <Route path={"/email-templates"} component={EmailTemplates} />
      <Route path={"/epm-dashboard"} component={EPMDashboard} />
      <Route path={"/workflows"} component={Workflows} />
        <Route path="/analytics/ml-scoring" component={MLScoringDashboard} />
      <Route path="/analytics/campaigns" component={CampaignMetrics} />
      <Route path="/analytics/roi" component={ROIDashboard} />
      <Route path={"/admin/import-leads"} component={ImportLeads} />
      <Route path={"/analytics/email-performance"} component={EmailPerformance} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <GlobalSearch />
          <OnboardingTour />
          <CompanyProvider>
            <Router />
          </CompanyProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
// Build timestamp: 1763941960
