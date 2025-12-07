import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, TrendingUp, Activity, Clock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lead Assignment Dashboard
 * Shows agent workload distribution and assignment history
 */
export default function LeadAssignmentDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch agent workloads
  const { data: workloads, isLoading: loadingWorkloads } = trpc.leadAssignment.getAgentWorkloads.useQuery(
    undefined,
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Fetch assignment history
  const { data: history, isLoading: loadingHistory } = trpc.leadAssignment.getAssignmentHistory.useQuery(
    { limit: 50 },
    { refetchInterval: 30000 }
  );

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Calculate stats
  const totalAgents = workloads?.length || 0;
  const totalAssignedLeads = workloads?.reduce((sum, w) => sum + w.totalLeads, 0) || 0;
  const avgLeadsPerAgent = totalAgents > 0 ? (totalAssignedLeads / totalAgents).toFixed(1) : "0";
  const busiestAgent = workloads?.[0];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Assignment Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor agent workload and lead distribution
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingWorkloads ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalAgents}</div>
                <p className="text-xs text-muted-foreground">Active sales agents</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingWorkloads ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalAssignedLeads}</div>
                <p className="text-xs text-muted-foreground">Across all agents</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Agent</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingWorkloads ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{avgLeadsPerAgent}</div>
                <p className="text-xs text-muted-foreground">Leads per agent</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busiest Agent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingWorkloads ? (
              <Skeleton className="h-8 w-24" />
            ) : busiestAgent ? (
              <>
                <div className="text-lg font-bold truncate">{busiestAgent.agentName}</div>
                <p className="text-xs text-muted-foreground">
                  {busiestAgent.totalLeads} active leads
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Workload Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Workload Distribution</CardTitle>
          <CardDescription>
            Current lead assignments and capacity for each agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWorkloads ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : workloads && workloads.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Total Leads</TableHead>
                    <TableHead className="text-center">Qualified</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workloads.map((agent) => {
                    const utilizationPercent = ((agent.totalLeads / 20) * 100).toFixed(0);
                    const isOverloaded = agent.totalLeads >= 20;
                    const isNearCapacity = agent.totalLeads >= 15;

                    return (
                      <TableRow key={agent.agentId}>
                        <TableCell className="font-medium">{agent.agentName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {agent.agentEmail || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{agent.totalLeads}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            {agent.qualifiedLeads}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              isOverloaded
                                ? "text-red-600 font-semibold"
                                : isNearCapacity
                                ? "text-orange-600 font-semibold"
                                : "text-green-600"
                            }
                          >
                            {agent.capacity}/20
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOverloaded ? (
                            <Badge variant="destructive">🔴 Overloaded</Badge>
                          ) : isNearCapacity ? (
                            <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                              ⚠️ Near Capacity
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              ✅ Available
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No agents found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
          <CardDescription>
            Latest lead assignments across all agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((assignment, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{assignment.leadName}</TableCell>
                      <TableCell>{assignment.company || "N/A"}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            (assignment.score || 0) >= 80
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : (assignment.score || 0) >= 50
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                          }
                        >
                          {assignment.score || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.agentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(assignment.assignedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No assignment history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
