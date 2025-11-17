import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentCard } from '@/components/AgentCard';
import { CommandConsole } from '@/components/CommandConsole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import DashboardLayout from '@/components/DashboardLayout';
import { WorkflowCard } from '@/components/WorkflowCard';
import { NotificationBell } from '@/components/NotificationBell';
import { toast } from 'sonner';
import { 
  Bot, 
  Activity, 
  TrendingUp, 
  Users, 
  Briefcase,
  HeadphonesIcon,
  Loader2,
  RefreshCw,
  Database
} from 'lucide-react';

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: agentsData, isLoading: agentsLoading, refetch: refetchAgents } = trpc.agents.list.useQuery();
  const { data: systemStatus, isLoading: statusLoading } = trpc.analytics.systemStatus.useQuery();
  const { data: kpisData } = trpc.agents.kpis.useQuery();
  
  const seedData = trpc.seed.executeSeed.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Database seeded successfully!', {
          description: data.message,
          duration: 5000,
        });
        // Refetch data to show new entries
        refetchAgents();
      } else {
        toast.error('Failed to seed database', {
          description: data.message,
          duration: 5000,
        });
      }
    },
    onError: (error) => {
      toast.error('Error seeding database', {
        description: error.message,
        duration: 5000,
      });
    },
  });

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
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Ivy.AI Platform</h1>
          <p className="text-muted-foreground mt-1">
            Intelligent Agent Orchestration System
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <NotificationBell />
          <Button 
            onClick={() => seedData.mutate({ 
              includeLeads: true, 
              includeTickets: true, 
              includeKnowledgeBase: true 
            })} 
            variant="outline" 
            size="sm"
            disabled={seedData.isPending}
          >
            {seedData.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Seed Demo Data
          </Button>
          <Button onClick={() => refetchAgents()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
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
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            <WorkflowCard
              id="sales_pipeline"
              name="Sales Pipeline"
              description="Automated lead generation, scoring, and outreach workflow"
              steps={[
                'Find potential leads',
                'Score and qualify leads',
                'Generate personalized outreach',
                'Analyze deal potential',
                'Create proposal'
              ]}
              onExecute={async (id) => {
                console.log('Executing workflow:', id);
                // This would call the actual workflow execution
              }}
            />
            <WorkflowCard
              id="support_escalation"
              name="Support Escalation"
              description="Intelligent ticket routing and resolution workflow"
              steps={[
                'Search knowledge base',
                'Generate auto-response',
                'Analyze sentiment',
                'Escalate if needed',
                'Notify team'
              ]}
              onExecute={async (id) => {
                console.log('Executing workflow:', id);
              }}
            />
            <WorkflowCard
              id="employee_onboarding"
              name="Employee Onboarding"
              description="Automated recruitment and onboarding process"
              steps={[
                'Screen candidate',
                'Schedule interview',
                'Assess cultural fit',
                'Provision accounts',
                'Send orientation materials'
              ]}
              onExecute={async (id) => {
                console.log('Executing workflow:', id);
              }}
            />
            <WorkflowCard
              id="market_analysis"
              name="Market Analysis"
              description="Competitive intelligence and strategic planning"
              steps={[
                'Gather market data',
                'Analyze competitors',
                'Identify trends',
                'Generate insights',
                'Create strategy report'
              ]}
              onExecute={async (id) => {
                console.log('Executing workflow:', id);
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
