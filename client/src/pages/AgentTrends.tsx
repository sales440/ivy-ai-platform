import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Calendar, RefreshCw, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrendData {
  date: string;
  conversionRate: number;
  roi: number;
  openRate: number;
  emailsSent: number;
}

interface AgentTrendMetrics {
  agentId: string;
  agentName: string;
  trends: TrendData[];
  summary: {
    conversionRateChange: number;
    roiChange: number;
    openRateChange: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export default function AgentTrends() {
  const [dateRange, setDateRange] = useState<'30d' | '60d' | '90d'>('30d');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');

  // Mock data for demonstration - in production, this would come from tRPC
  const mockTrends: AgentTrendMetrics[] = [
    {
      agentId: 'ivy-prospect',
      agentName: 'Ivy-Prospect',
      trends: generateMockTrendData(30, 18, 450, 28),
      summary: {
        conversionRateChange: 12.5,
        roiChange: 8.3,
        openRateChange: -2.1,
        trend: 'up',
      },
    },
    {
      agentId: 'ivy-closer',
      agentName: 'Ivy-Closer',
      trends: generateMockTrendData(30, 22, 520, 32),
      summary: {
        conversionRateChange: 5.2,
        roiChange: 15.7,
        openRateChange: 3.4,
        trend: 'up',
      },
    },
    {
      agentId: 'ivy-solve',
      agentName: 'Ivy-Solve',
      trends: generateMockTrendData(30, 16, 380, 25),
      summary: {
        conversionRateChange: -8.3,
        roiChange: -5.1,
        openRateChange: -4.2,
        trend: 'down',
      },
    },
  ];

  const filteredAgents = selectedAgent === 'all' 
    ? mockTrends 
    : mockTrends.filter(a => a.agentId === selectedAgent);

  // Calculate days based on date range
  const days = dateRange === '30d' ? 30 : dateRange === '60d' ? 60 : 90;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Agent Performance Trends
            </h1>
            <p className="text-muted-foreground mt-1">
              Historical analysis of agent metrics over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
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
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="60d">Last 60 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {mockTrends.map(agent => (
                <SelectItem key={agent.agentId} value={agent.agentId}>
                  {agent.agentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {filteredAgents.map(agent => (
            <Card key={agent.agentId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{agent.agentName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Conversion Rate</span>
                    <div className="flex items-center gap-1">
                      {agent.summary.conversionRateChange > 0 ? (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      ) : agent.summary.conversionRateChange < 0 ? (
                        <ArrowDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        agent.summary.conversionRateChange > 0 ? 'text-green-600' :
                        agent.summary.conversionRateChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(agent.summary.conversionRateChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ROI</span>
                    <div className="flex items-center gap-1">
                      {agent.summary.roiChange > 0 ? (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      ) : agent.summary.roiChange < 0 ? (
                        <ArrowDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        agent.summary.roiChange > 0 ? 'text-green-600' :
                        agent.summary.roiChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(agent.summary.roiChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Open Rate</span>
                    <div className="flex items-center gap-1">
                      {agent.summary.openRateChange > 0 ? (
                        <ArrowUp className="h-3 w-3 text-green-500" />
                      ) : agent.summary.openRateChange < 0 ? (
                        <ArrowDown className="h-3 w-3 text-red-500" />
                      ) : (
                        <Minus className="h-3 w-3 text-gray-500" />
                      )}
                      <span className={`text-xs font-medium ${
                        agent.summary.openRateChange > 0 ? 'text-green-600' :
                        agent.summary.openRateChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(agent.summary.openRateChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={agent.summary.trend === 'up' ? 'default' : agent.summary.trend === 'down' ? 'destructive' : 'secondary'}
                    className="w-full justify-center mt-2"
                  >
                    {agent.summary.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {agent.summary.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {agent.summary.trend.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Conversion Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate Trend</CardTitle>
            <CardDescription>Percentage of leads converted over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  type="category"
                  allowDuplicatedCategory={false}
                />
                <YAxis label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {filteredAgents.map((agent, index) => (
                  <Line
                    key={agent.agentId}
                    data={agent.trends}
                    type="monotone"
                    dataKey="conversionRate"
                    name={agent.agentName}
                    stroke={getChartColor(index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ROI Trend */}
        <Card>
          <CardHeader>
            <CardTitle>ROI Trend</CardTitle>
            <CardDescription>Return on investment over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  type="category"
                  allowDuplicatedCategory={false}
                />
                <YAxis label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {filteredAgents.map((agent, index) => (
                  <Line
                    key={agent.agentId}
                    data={agent.trends}
                    type="monotone"
                    dataKey="roi"
                    name={agent.agentName}
                    stroke={getChartColor(index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Open Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Open Rate Trend</CardTitle>
            <CardDescription>Email open rate over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  type="category"
                  allowDuplicatedCategory={false}
                />
                <YAxis label={{ value: 'Open Rate (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {filteredAgents.map((agent, index) => (
                  <Line
                    key={agent.agentId}
                    data={agent.trends}
                    type="monotone"
                    dataKey="openRate"
                    name={agent.agentName}
                    stroke={getChartColor(index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Email Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Email Volume Trend</CardTitle>
            <CardDescription>Number of emails sent over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  type="category"
                  allowDuplicatedCategory={false}
                />
                <YAxis label={{ value: 'Emails Sent', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                {filteredAgents.map((agent, index) => (
                  <Line
                    key={agent.agentId}
                    data={agent.trends}
                    type="monotone"
                    dataKey="emailsSent"
                    name={agent.agentName}
                    stroke={getChartColor(index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Trend Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-blue-900">
              {filteredAgents.map(agent => (
                <div key={agent.agentId} className="flex items-start gap-2">
                  {agent.summary.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 mt-0.5 text-green-600" />
                  ) : agent.summary.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 mt-0.5 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 mt-0.5 text-gray-600" />
                  )}
                  <p>
                    <strong>{agent.agentName}</strong> shows a{' '}
                    <strong className={agent.summary.trend === 'up' ? 'text-green-700' : 'text-red-700'}>
                      {agent.summary.trend}ward trend
                    </strong>{' '}
                    with conversion rate {agent.summary.conversionRateChange > 0 ? 'increasing' : 'decreasing'} by{' '}
                    <strong>{Math.abs(agent.summary.conversionRateChange).toFixed(1)}%</strong> over the selected period.
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Helper function to generate mock trend data
function generateMockTrendData(
  days: number,
  baseConversionRate: number,
  baseROI: number,
  baseOpenRate: number
): TrendData[] {
  const data: TrendData[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some variance to make it look realistic
    const variance = (Math.random() - 0.5) * 4;
    const trend = (days - i) / days; // Gradual trend over time

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      conversionRate: Math.max(0, baseConversionRate + variance + trend * 2),
      roi: Math.max(0, baseROI + variance * 10 + trend * 20),
      openRate: Math.max(0, baseOpenRate + variance + trend),
      emailsSent: Math.floor(Math.random() * 20) + 10,
    });
  }

  return data;
}

// Helper function to get chart colors
function getChartColor(index: number): string {
  const colors = [
    '#8b5cf6', // purple
    '#10b981', // green
    '#3b82f6', // blue
    '#f59e0b', // orange
    '#ef4444', // red
    '#06b6d4', // cyan
  ];
  return colors[index % colors.length];
}
