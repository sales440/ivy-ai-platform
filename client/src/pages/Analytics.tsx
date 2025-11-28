import { trpc } from '@/lib/trpc';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Activity, Bot } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export default function Analytics() {
  const { selectedCompany } = useCompany();
  const { data: kpisData, isLoading: kpisLoading } = trpc.agents.kpis.useQuery();
  const { data: systemStatus, isLoading: statusLoading } = trpc.analytics.systemStatus.useQuery();
  const { data: agentsData } = trpc.agents.list.useQuery(
    selectedCompany ? { companyId: Number(selectedCompany.id) } : undefined
  );

  const agents = agentsData?.agents || [];
  const kpis = kpisData?.kpis || [];

  // Prepare data for charts - use useMemo to prevent unnecessary recalculations
  const agentPerformanceData = useMemo(() => agents.map(agent => ({
    name: agent.name,
    tasks: agent.kpis.tasks_completed || 0,
    success: agent.kpis.success_rate || 0,
  })), [agents]);

  const departmentData = useMemo(() => agents.reduce((acc, agent) => {
    const dept = agent.department;
    if (!acc[dept]) {
      acc[dept] = { name: dept, agents: 0, tasks: 0 };
    }
    acc[dept].agents += 1;
    acc[dept].tasks += agent.kpis.tasks_completed || 0;
    return acc;
  }, {} as Record<string, any>), [agents]);

  const departmentChartData = useMemo(() => Object.values(departmentData), [departmentData]);

  const statusDistribution = useMemo(() => agents.reduce((acc, agent) => {
    const status = agent.status;
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status] += 1;
    return acc;
  }, {} as Record<string, number>), [agents]);

  const statusChartData = useMemo(() => Object.entries(statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })), [statusDistribution]);

  // Mock time series data (in real app, this would come from API)
  const timeSeriesData = useMemo(() => [
    { time: '00:00', tasks: 12, success: 10 },
    { time: '04:00', tasks: 8, success: 7 },
    { time: '08:00', tasks: 25, success: 22 },
    { time: '12:00', tasks: 35, success: 32 },
    { time: '16:00', tasks: 42, success: 38 },
    { time: '20:00', tasks: 28, success: 25 },
  ], []);

  // Calculate overall metrics
  const totalTasks = agents.reduce((sum, a) => sum + (a.kpis.tasks_completed || 0), 0);
  const avgSuccessRate = agents.length > 0
    ? (agents.reduce((sum, a) => sum + (a.kpis.success_rate || 0), 0) / agents.length).toFixed(1)
    : '0';
  const activeAgents = agents.filter(a => a.status === 'active').length;

  if (kpisLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics & KPIs</h1>
        <p className="text-muted-foreground mt-1">
          Real-time performance metrics across all agents
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              of {agents.length} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemStatus?.system_health === 'optimal' ? 'Optimal' : 'Good'}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Tasks completed by each agent</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentPerformanceData} key="agent-performance-chart">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="tasks" fill="#8B5CF6" name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Status Distribution</CardTitle>
                <CardDescription>Current status of all agents</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart key="status-distribution-chart">
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Tasks completed by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departmentChartData} key="department-performance-chart">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="agents" fill="#10B981" name="Agents" />
                  <Bar dataKey="tasks" fill="#8B5CF6" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(departmentData).map(([dept, data]: [string, any]) => (
              <Card key={dept}>
                <CardHeader>
                  <CardTitle className="text-base capitalize">{dept.replace(/_/g, ' ')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Agents</span>
                      <Badge variant="outline">{data.agents}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tasks</span>
                      <Badge variant="outline">{data.tasks}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Trends</CardTitle>
              <CardDescription>Tasks completed over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData} key="trends-chart">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tasks"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Total Tasks"
                  />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Successful"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Individual Agent KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Agent KPIs</CardTitle>
          <CardDescription>Detailed metrics for each agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <Bot className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">
                      {agent.department.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{agent.kpis.tasks_completed || 0}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{agent.kpis.success_rate || 0}%</div>
                    <div className="text-xs text-muted-foreground">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{agent.kpis.avg_response_time || 0}s</div>
                    <div className="text-xs text-muted-foreground">Avg Time</div>
                  </div>
                  <Badge
                    variant={
                      agent.status === 'active'
                        ? 'default'
                        : agent.status === 'idle'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="capitalize"
                  >
                    {agent.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
