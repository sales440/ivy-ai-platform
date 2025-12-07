import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  Workflow as WorkflowIcon,
  Users,
  Headphones,
  UserPlus,
  TrendingUp
} from "lucide-react";

/**
 * Workflows Page
 * Display and execute predefined workflows between agents
 */
export default function Workflows() {
  const { selectedCompany } = useCompany();
  const [executingWorkflow, setExecutingWorkflow] = useState<string | null>(null);

  const executeWorkflowMutation = trpc.workflows.execute.useMutation({
    onSuccess: (data) => {
      toast.success(`Workflow "${data.workflowName}" executed successfully`, {
        description: `Completed ${data.stepsCompleted} steps in ${data.duration}ms`
      });
      setExecutingWorkflow(null);
    },
    onError: (error) => {
      toast.error("Workflow execution failed", {
        description: error.message
      });
      setExecutingWorkflow(null);
    }
  });

  const handleExecuteWorkflow = (workflowName: string) => {
    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }

    setExecutingWorkflow(workflowName);
    executeWorkflowMutation.mutate({
      workflowName,
      companyId: selectedCompany.id,
      input: {}
    });
  };

  // Predefined workflows
  const workflows = [
    {
      id: "sales-pipeline",
      name: "Sales Pipeline",
      description: "Automated lead qualification and follow-up process",
      icon: TrendingUp,
      color: "text-green-500",
      steps: [
        { agent: "Ivy-Prospect", action: "Qualify leads with scoring" },
        { agent: "Ivy-Prospect", action: "Generate personalized outreach emails" },
        { agent: "Ivy-Closer", action: "Schedule follow-up calls" },
        { agent: "Ivy-Closer", action: "Track conversion metrics" }
      ],
      estimatedTime: "5-10 minutes",
      category: "Sales"
    },
    {
      id: "support-escalation",
      name: "Support Escalation",
      description: "Multi-level ticket resolution with automatic escalation",
      icon: Headphones,
      color: "text-blue-500",
      steps: [
        { agent: "Ivy-Solve", action: "Analyze ticket and search knowledge base" },
        { agent: "Ivy-Solve", action: "Generate automated response" },
        { agent: "Ivy-Solve", action: "Escalate to L2 if unresolved" },
        { agent: "Human Agent", action: "Manual intervention if needed" }
      ],
      estimatedTime: "2-5 minutes",
      category: "Support"
    },
    {
      id: "employee-onboarding",
      name: "Employee Onboarding",
      description: "Streamlined new hire setup and documentation",
      icon: UserPlus,
      color: "text-purple-500",
      steps: [
        { agent: "Ivy-Talent", action: "Create employee profile" },
        { agent: "Ivy-Logic", action: "Provision equipment and access" },
        { agent: "Ivy-Talent", action: "Send welcome email and training materials" },
        { agent: "Ivy-Insight", action: "Track onboarding progress" }
      ],
      estimatedTime: "10-15 minutes",
      category: "HR"
    },
    {
      id: "market-analysis",
      name: "Market Analysis",
      description: "Competitive intelligence and opportunity identification",
      icon: WorkflowIcon,
      color: "text-orange-500",
      steps: [
        { agent: "Ivy-Insight", action: "Gather market data and trends" },
        { agent: "Ivy-Insight", action: "Analyze competitor positioning" },
        { agent: "Ivy-Prospect", action: "Identify high-value prospects" },
        { agent: "Ivy-Closer", action: "Create targeted campaigns" }
      ],
      estimatedTime: "15-20 minutes",
      category: "Strategy"
    }
  ];

  if (!selectedCompany) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Please select a company first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Automated multi-agent processes for common business scenarios
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Workflows</CardTitle>
              <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows.length}</div>
              <p className="text-xs text-muted-foreground">Ready to execute</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8 min</div>
              <p className="text-xs text-muted-foreground">Across all workflows</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Workflows Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            const isExecuting = executingWorkflow === workflow.id;

            return (
              <Card key={workflow.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${workflow.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{workflow.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {workflow.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{workflow.category}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Steps */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Workflow Steps:</p>
                    <div className="space-y-2">
                      {workflow.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium">{step.agent}:</span>{" "}
                              <span className="text-muted-foreground">{step.action}</span>
                            </div>
                          </div>
                          {index < workflow.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{workflow.estimatedTime}</span>
                    </div>

                    <Button
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                      disabled={isExecuting || executeWorkflowMutation.isPending}
                      size="sm"
                    >
                      {isExecuting ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Execute Workflow
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <WorkflowIcon className="h-5 w-5 text-blue-600" />
              About Workflows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Workflows are predefined sequences of actions executed by multiple AI agents working together.
              Each workflow is optimized for specific business processes and can be triggered manually or automatically.
            </p>
            <p className="font-medium text-foreground">
              Custom workflows coming soon! You'll be able to create your own multi-agent processes with a visual builder.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
