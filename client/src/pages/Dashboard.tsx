import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentCard } from '@/components/AgentCard';
import { CommandConsole } from '@/components/CommandConsole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Activity, 
  TrendingUp, 
  Users, 
  Briefcase,
  HeadphonesIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: agentsData, isLoading: agentsLoading, refetch: refetchAgents } = trpc.agents.list.useQuery();
  const { data: systemStatus, isLoading: statusLoading } = trpc.analytics.systemStatus.useQuery();
  const { data: kpisData } = trpc.agents.kpis.useQuery();

  const agents = agentsData?.agents || [];
  const totalAgents = agentsData?.total || 0;

  // Calculate system stats
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  // Group agents by department
  const agentsByDepartment = agents.reduce((acc, agent) => {
    if (!acc[agent.department]) {
      acc[agent.department] = [];
    }
    acc[agent.department].push(agent);
    return acc;
  }, {} as Record<string, typeof agents>);

  const handleExecuteAgent = (agentType: string) => {
    console.log('Execute agent:', agentType);
    // This would open a dialog or navigate to agent execution page
  };

  if (agentsLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Ivy.AI Platform</h1>
          <p className="text-muted-foreground mt-1">
            Intelligent Agent Orchestration System
          </p>
        </div>
        <Button onClick={() => refetchAgents()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeAgents}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently processing tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idle</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{idleAgents}</div>
            <p className="text-xs text-muted-foreground">
              Ready for tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus?.system_health === 'optimal' ? '100%' : '85%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {errorAgents > 0 ? `${errorAgents} errors detected` : 'All systems operational'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="console">Console</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Agents by Department */}
            {Object.entries(agentsByDepartment).map(([department, deptAgents]) => (
              <Card key={department}>
                <CardHeader>
                  <CardTitle className="capitalize">{department.replace(/_/g, ' ')}</CardTitle>
                  <CardDescription>
                    {deptAgents.length} agent{deptAgents.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deptAgents.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <Badge variant="outline" className={
                        agent.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                        agent.status === 'error' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                        'bg-muted text-muted-foreground'
                      }>
                        {agent.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onExecute={handleExecuteAgent}
              />
            ))}
          </div>
        </TabsContent>

        {/* Console Tab */}
        <TabsContent value="console" className="space-y-4">
          <div className="h-[600px]">
            <CommandConsole />
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Workflows</CardTitle>
              <CardDescription>
                Pre-configured automation workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <h4 className="font-medium">Automated Sales Process</h4>
                    <p className="text-sm text-muted-foreground">
                      Lead generation → Qualification → Outreach
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Execute
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <h4 className="font-medium">Support Ticket Resolution</h4>
                    <p className="text-sm text-muted-foreground">
                      Automated ticket analysis and resolution
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Execute
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
