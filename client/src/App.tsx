import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import RopaDashboard from "./pages/RopaDashboard";
import RopaDashboardV2 from "./pages/RopaDashboardV2";
import RopaCalendar from "./pages/RopaCalendar";
import ABTestingDashboard from "./pages/ABTestingDashboard";
import PredictiveInsights from "./pages/PredictiveInsights";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {/* Legacy ROPA Dashboard */}
      <Route path={"/ropa"} component={RopaDashboard} />
      <Route path={"/ropa-dashboard"} component={RopaDashboard} />
      {/* New ROPA Dashboard v2 */}
      <Route path={"/ropa-v2"} component={RopaDashboardV2} />
      <Route path={"/ropa/calendar"} component={RopaCalendar} />
      <Route path={"/ab-testing"} component={ABTestingDashboard} />
      <Route path={"/predictive-insights"} component={PredictiveInsights} />
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
