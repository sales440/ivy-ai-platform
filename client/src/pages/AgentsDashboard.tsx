import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Bot, Mail, TrendingUp, DollarSign, Target, Clock, 
  RefreshCw, Calendar, Filter, Download 
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentComparison } from "@/components/AgentComparison";
import { AgentRecommendations } from "@/components/AgentRecommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentMetrics {
  agentId: string;
  agentName: string;
  department: string;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  leadsGenerated: number;
  conversions: number;
  conversionRate: number;
  openRate: number;
  clickRate: number;
  avgResponseTime: number; // hours
  roi: number;
  campaignName: string;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AgentsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Export to CSV function
  const handleExportCSV = () => {
    if (!metrics || !metrics.agents || metrics.agents.length === 0) {
      return;
    }

    // CSV headers
    const headers = [
      'Agent ID',
      'Agent Name',
      'Department',
      'Campaign',
      'Emails Sent',
      'Emails Opened',
      'Emails Clicked',
      'Open Rate (%)',
      'Click Rate (%)',
      'Leads Generated',
      'Conversions',
      'Conversion Rate (%)',
      'Avg Response Time (hours)',
      'ROI (%)'
    ];

    // CSV rows
    const rows = metrics.agents.map(agent => [
      agent.agentId,
      agent.agentName,
      agent.department,
      agent.campaignName,
      agent.emailsSent,
      agent.emailsOpened,
      agent.emailsClicked,
      agent.openRate.toFixed(1),
      agent.clickRate.toFixed(1),
      agent.leadsGenerated,
      agent.conversions,
      agent.conversionRate.toFixed(1),
      agent.avgResponseTime.toFixed(1),
      agent.roi.toFixed(0)
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fagor-agents-metrics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Query agent metrics
  const { data: metrics, isLoading, refetch } = trpc.fagor.getAgentMetrics.useQuery({
    dateRange,
    agentId: selectedAgent === 'all' ? undefined : selectedAgent,
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  const agents = metrics?.agents || [];
  const filteredAgents = agents; // All agents (filtering already done by query)
  const totalMetrics = metrics?.totals || {
    emailsSent: 0,
    emailsOpened: 0,
    emailsClicked: 0,
    leadsGenerated: 0,
    conversions: 0,
    avgConversionRate: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    totalROI: 0,
  };

  // Prepare chart data
  const conversionData = agents.map(agent => ({
    name: agent.agentName,
    rate: agent.conversionRate,
    conversions: agent.conversions,
  }));

  const emailPerformanceData = agents.map(agent => ({
    name: agent.agentName,
    opens: agent.openRate,
    clicks: agent.clickRate,
  }));

  const roiData = agents.map(agent => ({
    name: agent.agentName,
    roi: agent.roi,
  }));

  const campaignDistribution = agents.map(agent => ({
    name: agent.campaignName,
    value: agent.emailsSent,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agents Dashboard</h1>
            <p className="text-muted-foreground">
              Individual performance metrics for FAGOR AI agents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!metrics || metrics.agents.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.agentId} value={agent.agentId}>
                    {agent.agentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs for Overview and Comparison */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMetrics.emailsSent}</div>
              <p className="text-xs text-muted-foreground">
                {totalMetrics.emailsOpened} opened ({totalMetrics.avgOpenRate.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMetrics.conversions}</div>
              <p className="text-xs text-muted-foreground">
                {totalMetrics.avgConversionRate.toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMetrics.avgClickRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {totalMetrics.emailsClicked} total clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMetrics.totalROI.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Overview</CardTitle>
            <CardDescription>Detailed metrics for each AI agent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Agent</th>
                    <th className="text-left p-2">Campaign</th>
                    <th className="text-right p-2">Emails Sent</th>
                    <th className="text-right p-2">Open Rate</th>
                    <th className="text-right p-2">Click Rate</th>
                    <th className="text-right p-2">Conversions</th>
                    <th className="text-right p-2">Conv. Rate</th>
                    <th className="text-right p-2">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent, idx) => (
                    <tr key={agent.agentId} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{agent.agentName}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{agent.campaignName}</Badge>
                      </td>
                      <td className="text-right p-2">{agent.emailsSent}</td>
                      <td className="text-right p-2">
                        <span className={agent.openRate >= 25 ? 'text-green-600' : 'text-yellow-600'}>
                          {agent.openRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right p-2">
                        <span className={agent.clickRate >= 10 ? 'text-green-600' : 'text-yellow-600'}>
                          {agent.clickRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right p-2 font-medium">{agent.conversions}</td>
                      <td className="text-right p-2">
                        <span className={agent.conversionRate >= 15 ? 'text-green-600 font-bold' : ''}>
                          {agent.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right p-2">
                        <span className="text-green-600 font-bold">
                          {agent.roi.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Conversion Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate by Agent</CardTitle>
              <CardDescription>Percentage of leads converted to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" name="Conversion Rate (%)" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Email Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Email Performance</CardTitle>
              <CardDescription>Open and click rates by agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={emailPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opens" name="Open Rate (%)" fill="#06b6d4" />
                  <Bar dataKey="clicks" name="Click Rate (%)" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ROI Chart */}
          <Card>
            <CardHeader>
              <CardTitle>ROI by Agent</CardTitle>
              <CardDescription>Return on investment for each campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="roi" name="ROI (%)" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campaign Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Distribution</CardTitle>
              <CardDescription>Emails sent by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={campaignDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {campaignDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <AgentComparison agents={filteredAgents} />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <AgentRecommendations />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
