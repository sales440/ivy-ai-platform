import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, DollarSign, Target, AlertCircle, Bot, Mail, Users, 
  CheckCircle2, Clock, Zap, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RealtimeNotificationsPanel } from "@/components/RealtimeNotificationsPanel";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// Mock data for executive dashboard
const globalKPIs = {
  totalRevenue: 2847500,
  totalConversions: 1247,
  totalEmailsSent: 15420,
  totalAgents: 8,
  activeAgents: 6,
  avgConversionRate: 8.1,
  avgROI: 485,
  totalCampaigns: 12,
  activeCampaigns: 5,
};

const revenueProjection = {
  currentMonth: 2847500,
  projectedNextMonth: 3215000,
  projectedQuarter: 9450000,
  growthRate: 12.9,
};

const agentPerformance = [
  { name: 'Ivy-Prospect', conversions: 287, roi: 450, revenue: 645000, status: 'excellent' },
  { name: 'Ivy-Closer', conversions: 312, roi: 520, revenue: 780000, status: 'excellent' },
  { name: 'Ivy-Solve', conversions: 198, roi: 380, revenue: 425000, status: 'good' },
  { name: 'Ivy-Nurture', conversions: 156, roi: 420, revenue: 380000, status: 'good' },
  { name: 'Ivy-Qualify', conversions: 142, roi: 390, revenue: 325000, status: 'needs-improvement' },
  { name: 'Ivy-Engage', conversions: 152, roi: 410, revenue: 292500, status: 'good' },
];

const monthlyTrend = [
  { month: 'Jul', revenue: 1850000, conversions: 820 },
  { month: 'Aug', revenue: 2120000, conversions: 945 },
  { month: 'Sep', revenue: 2450000, conversions: 1089 },
  { month: 'Oct', revenue: 2680000, conversions: 1156 },
  { month: 'Nov', revenue: 2847500, conversions: 1247 },
];

const campaignBreakdown = [
  { name: 'CNC Training 2026', value: 35, conversions: 437 },
  { name: 'Warranty Extension', value: 28, conversions: 349 },
  { name: 'Equipment Repair', value: 18, conversions: 224 },
  { name: 'Maintenance Plans', value: 12, conversions: 150 },
  { name: 'Others', value: 7, conversions: 87 },
];

const criticalAlerts = [
  {
    id: 1,
    type: 'milestone',
    severity: 'success',
    title: 'Ivy-Closer reached 300 conversions',
    description: 'New milestone achieved in Warranty Extension campaign',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    type: 'performance',
    severity: 'warning',
    title: 'Ivy-Qualify conversion rate dropped 15%',
    description: 'Performance decline detected in last 7 days',
    timestamp: '5 hours ago',
  },
  {
    id: 3,
    type: 'churn',
    severity: 'critical',
    title: '42 contacts at critical churn risk',
    description: 'Immediate reactivation sequences recommended',
    timestamp: '1 day ago',
  },
  {
    id: 4,
    type: 'ab-test',
    severity: 'success',
    title: 'A/B test winner: Subject line optimization',
    description: 'Ivy-Solve test shows +86.7% conversion improvement',
    timestamp: '2 days ago',
  },
];

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function ExecutiveSummary() {
  const generatePdf = trpc.executiveSummaryPdf.generatePdf.useMutation({
    onSuccess: (data) => {
      toast.success(`PDF generated: ${data.pdf.filename}`);
      // In production, trigger download
      console.log('PDF ready for download:', data.pdf.url);
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });

  const handleExportPdf = () => {
    generatePdf.mutate({
      includeCharts: true,
      includeAlerts: true,
      dateRange: 'last_30_days',
    });
  };

  const getTrendIcon = (value: number) => {
    if (value > 5) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (value < -5) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-600">Warning</Badge>;
      case 'success':
        return <Badge className="bg-green-600">Success</Badge>;
      default:
        return <Badge>Info</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
            <p className="text-muted-foreground mt-1">
              Consolidated FAGOR platform performance and critical insights
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Last 30 Days
            </Button>
            <Button onClick={handleExportPdf} disabled={generatePdf.isPending}>
              {generatePdf.isPending ? 'Generating...' : 'Export Report'}
            </Button>
          </div>
        </div>

        {/* Real-Time Notifications */}
        <RealtimeNotificationsPanel />

        {/* Critical Alerts */}
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Zap className="h-6 w-6" />
              Critical Alerts & Notifications
            </CardTitle>
            <CardDescription className="text-purple-700">
              Real-time alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-4 bg-white rounded-lg border"
                >
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      {getAlertBadge(alert.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Global KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(globalKPIs.totalRevenue / 1000000).toFixed(2)}M
              </div>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(revenueProjection.growthRate)}
                <span className="text-xs text-green-600">
                  +{revenueProjection.growthRate}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalKPIs.totalConversions.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  {globalKPIs.avgConversionRate}% avg conversion rate
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{globalKPIs.avgROI}%</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  Across {globalKPIs.totalAgents} agents
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Emails Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalKPIs.totalEmailsSent.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-muted-foreground">
                  {globalKPIs.activeCampaigns} active campaigns
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Projections */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Projections</CardTitle>
            <CardDescription>Forecasted revenue based on current trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Next Month Projection</div>
                <div className="text-2xl font-bold text-purple-900">
                  ${(revenueProjection.projectedNextMonth / 1000000).toFixed(2)}M
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  +{((revenueProjection.projectedNextMonth - revenueProjection.currentMonth) / revenueProjection.currentMonth * 100).toFixed(1)}% growth
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Quarterly Projection</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${(revenueProjection.projectedQuarter / 1000000).toFixed(2)}M
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Next 3 months forecast
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Growth Rate</div>
                <div className="text-2xl font-bold text-green-900">
                  +{revenueProjection.growthRate}%
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Month-over-month average
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue & Conversions Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Conversions Trend</CardTitle>
              <CardDescription>Last 5 months performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Conversions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campaign Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Distribution</CardTitle>
              <CardDescription>Conversion share by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={campaignBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {campaignBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Agent Performance Summary
            </CardTitle>
            <CardDescription>Ranked by total revenue generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentPerformance.map((agent, idx) => (
                <div
                  key={agent.name}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-2xl font-bold text-muted-foreground w-8">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{agent.name}</h4>
                      <Badge
                        variant={
                          agent.status === 'excellent' ? 'default' :
                          agent.status === 'good' ? 'secondary' :
                          'outline'
                        }
                        className={
                          agent.status === 'excellent' ? 'bg-green-600' :
                          agent.status === 'good' ? 'bg-blue-600' :
                          'bg-yellow-600 text-white'
                        }
                      >
                        {agent.status === 'excellent' ? 'Excellent' :
                         agent.status === 'good' ? 'Good' :
                         'Needs Improvement'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Revenue: </span>
                        <span className="font-semibold">
                          ${(agent.revenue / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversions: </span>
                        <span className="font-semibold">{agent.conversions}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ROI: </span>
                        <span className="font-semibold text-green-600">{agent.roi}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
