import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/profile"} component={Profile} />
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
      <Route path="/admin/permissions" component={Permissions} />
      <Route path="/analytics/prospect-metrics" component={ProspectMetrics} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <CompanyProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CompanyProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
