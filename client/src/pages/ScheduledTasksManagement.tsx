import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Ban, RotateCcw, Loader2 } from "lucide-react";

export default function ScheduledTasksManagement() {
  const { company } = useCompany();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: tasks, isLoading, refetch } = trpc.scheduledTasks.list.useQuery(
    {
      companyId: company?.id || 0,
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      taskType: typeFilter !== "all" ? (typeFilter as any) : undefined,
      limit: 100,
    },
    { enabled: !!company }
  );

  const { data: stats } = trpc.scheduledTasks.stats.useQuery(
    { companyId: company?.id || 0 },
    { enabled: !!company }
  );

  const cancelMutation = trpc.scheduledTasks.cancel.useMutation({
    onSuccess: () => {
      toast.success("Task cancelled successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to cancel task: ${error.message}`);
    },
  });

  const retryMutation = trpc.scheduledTasks.retry.useMutation({
    onSuccess: () => {
      toast.success("Task scheduled for retry");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to retry task: ${error.message}`);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      processing: { variant: "default", icon: Loader2, label: "Processing" },
      completed: { variant: "default", icon: CheckCircle2, label: "Completed" },
      failed: { variant: "destructive", icon: XCircle, label: "Failed" },
      cancelled: { variant: "outline", icon: Ban, label: "Cancelled" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "send-email": "📧 Send Email",
      "update-lead-score": "📊 Update Score",
      "send-notification": "🔔 Send Notification",
      "custom": "⚙️ Custom Task",
    };
    return labels[type] || type;
  };

  if (!company) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Please select a company first.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scheduled Tasks</h1>
        <p className="text-muted-foreground">
          Manage automated tasks and workflows
        </p>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Waiting for execution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully executed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter tasks by status and type</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Task Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="send-email">Send Email</SelectItem>
                <SelectItem value="update-lead-score">Update Lead Score</SelectItem>
                <SelectItem value="send-notification">Send Notification</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks?.length || 0})</CardTitle>
          <CardDescription>All scheduled tasks for {company.name}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Scheduled For</th>
                    <th className="text-left p-3 font-medium">Retries</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{task.id}</td>
                      <td className="p-3">{getTaskTypeLabel(task.taskType)}</td>
                      <td className="p-3">{getStatusBadge(task.status)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(task.scheduledFor), "MMM d, yyyy HH:mm")}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {task.retryCount} / {task.maxRetries}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {task.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelMutation.mutate({ taskId: task.id })}
                              disabled={cancelMutation.isPending}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          {task.status === "failed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryMutation.mutate({ taskId: task.id })}
                              disabled={retryMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Retry
                            </Button>
                          )}
                          {task.error && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                toast.error(task.error || "Unknown error", {
                                  duration: 5000,
                                });
                              }}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found. Tasks will appear here once scheduled.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
