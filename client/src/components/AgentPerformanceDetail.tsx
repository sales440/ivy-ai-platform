import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Mail, Target, DollarSign, MousePointerClick, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Agent {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'error';
  emailsSent: number;
  conversions: number;
  conversionRate: number;
  roi: number;
  openRate: number;
  clickRate: number;
}

interface AgentPerformanceDetailProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentPerformanceDetail({ agent, open, onOpenChange }: AgentPerformanceDetailProps) {
  if (!agent) return null;

  // Mock historical data
  const historicalData = [
    { date: 'Jan', conversions: 45, emails: 320, roi: 420 },
    { date: 'Feb', conversions: 52, emails: 380, roi: 465 },
    { date: 'Mar', conversions: 48, emails: 350, roi: 445 },
    { date: 'Apr', conversions: 61, emails: 420, roi: 510 },
    { date: 'May', conversions: 58, emails: 390, roi: 495 },
    { date: 'Jun', conversions: 67, emails: 450, roi: 545 },
  ];

  const campaignBreakdown = [
    { name: 'CNC Training', value: 35, color: '#3b82f6' },
    { name: 'Warranty Extension', value: 28, color: '#10b981' },
    { name: 'Equipment Repair', value: 22, color: '#f59e0b' },
    { name: 'Maintenance Plans', value: 15, color: '#ef4444' },
  ];

  const funnelData = [
    { stage: 'Emails Sent', value: 450, percentage: 100 },
    { stage: 'Opened', value: 315, percentage: 70 },
    { stage: 'Clicked', value: 135, percentage: 30 },
    { stage: 'Replied', value: 90, percentage: 20 },
    { stage: 'Converted', value: 67, percentage: 15 },
  ];

  const teamAverage = {
    conversionRate: 12.5,
    roi: 385,
    openRate: 28,
    clickRate: 8.5,
  };

  const getComparisonBadge = (value: number, average: number) => {
    const diff = ((value - average) / average) * 100;
    const isPositive = diff > 0;
    return (
      <Badge variant={isPositive ? "default" : "destructive"} className="ml-2">
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(diff).toFixed(1)}% vs avg
      </Badge>
    );
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting performance data for', agent.name);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{agent.name} Performance</DialogTitle>
              <DialogDescription>
                Detailed metrics and historical trends
              </DialogDescription>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Historical Trends</TabsTrigger>
            <TabsTrigger value="campaigns">Campaign Breakdown</TabsTrigger>
            <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{agent.conversionRate}%</div>
                  {getComparisonBadge(agent.conversionRate, teamAverage.conversionRate)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{agent.roi}%</div>
                  {getComparisonBadge(agent.roi, teamAverage.roi)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{agent.openRate}%</div>
                  {getComparisonBadge(agent.openRate, teamAverage.openRate)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{agent.clickRate}%</div>
                  {getComparisonBadge(agent.clickRate, teamAverage.clickRate)}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Strong Performance</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      This agent is performing {((agent.conversionRate / teamAverage.conversionRate - 1) * 100).toFixed(1)}% above team average
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Emails Sent</span>
                    <span className="font-medium">{agent.emailsSent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Conversions</span>
                    <span className="font-medium">{agent.conversions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estimated Revenue Impact</span>
                    <span className="font-medium text-green-600">${(agent.conversions * 15000).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Trend</CardTitle>
                <CardDescription>Monthly conversions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="conversions" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Trend</CardTitle>
                <CardDescription>Return on investment over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Breakdown Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Conversions by Campaign</CardTitle>
                  <CardDescription>Distribution across active campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={campaignBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {campaignBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Detailed metrics by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignBreakdown.map((campaign) => (
                      <div key={campaign.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{campaign.name}</span>
                          <span className="text-sm text-muted-foreground">{campaign.value} conversions</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(campaign.value / campaignBreakdown.reduce((sum, c) => sum + c.value, 0)) * 100}%`,
                              backgroundColor: campaign.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Funnel Tab */}
          <TabsContent value="funnel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Step-by-step engagement breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 space-y-3">
                  {funnelData.map((stage, idx) => (
                    <div key={stage.stage} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{stage.stage}</span>
                          <span className="text-sm text-muted-foreground">
                            {stage.value} ({stage.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${stage.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
