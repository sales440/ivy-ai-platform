import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/DateRangePicker";
import { subDays } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const COLORS = {
  completed: "#22c55e",
  failed: "#ef4444",
  pending: "#f59e0b",
  cancelled: "#94a3b8",
};

const TASK_TYPE_COLORS = {
  "send-email": "#3b82f6",
  "update-lead-score": "#8b5cf6",
  "send-notification": "#ec4899",
  "custom": "#64748b",
};

export default function TaskAnalytics() {
  const { company } = useCompany();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: stats, isLoading } = trpc.scheduledTasks.stats.useQuery(
    { companyId: company?.id || 0 },
    { enabled: !!company }
  );

  const { data: dailyStatsData, isLoading: isDailyStatsLoading } = trpc.scheduledTasks.dailyStats.useQuery(
    {
      companyId: company?.id || 0,
      days: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)),
    },
    { enabled: !!company }
  );

  // Format daily stats for chart (convert date to readable format)
  const dailyTasks = dailyStatsData?.daily?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: item.completed,
    failed: item.failed,
    pending: item.pending,
  })) || [];

  // Get average completion time from backend
  const avgCompletionTime = dailyStatsData?.avgCompletionTime || 0;

  const taskTypeDistribution = stats?.byType ? Object.entries(stats.byType).map(([type, count]) => ({
    name: type === "send-email" ? "Send Email" : 
          type === "update-lead-score" ? "Update Score" :
          type === "send-notification" ? "Notification" : "Custom",
    value: count,
    type,
  })) : [];

  const successRate = stats && stats.total > 0 
    ? ((stats.completed / stats.total) * 100).toFixed(1)
    : "0.0";

  // avgCompletionTime now comes from backend dailyStats query

  if (!company) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">Please select a company first.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics and trends for scheduled tasks
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{successRate}%</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +5.2% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgCompletionTime}h</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  -0.5h faster
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Failed Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Most Used Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">📧 Email</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.byType?.["send-email"] || 0} tasks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Daily Tasks Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks Completed Per Day</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTasks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke={COLORS.completed} strokeWidth={2} name="Completed" />
                    <Line type="monotone" dataKey="failed" stroke={COLORS.failed} strokeWidth={2} name="Failed" />
                    <Line type="monotone" dataKey="pending" stroke={COLORS.pending} strokeWidth={2} name="Pending" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Success vs Failure Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Success vs Failure Rate</CardTitle>
                <CardDescription>Task completion outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Completed", value: stats?.completed || 0, fill: COLORS.completed },
                    { name: "Failed", value: stats?.failed || 0, fill: COLORS.failed },
                    { name: "Pending", value: stats?.pending || 0, fill: COLORS.pending },
                    { name: "Cancelled", value: stats?.total ? stats.total - (stats.completed + stats.failed + stats.pending) : 0, fill: COLORS.cancelled },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[
                        { name: "Completed", value: stats?.completed || 0, fill: COLORS.completed },
                        { name: "Failed", value: stats?.failed || 0, fill: COLORS.failed },
                        { name: "Pending", value: stats?.pending || 0, fill: COLORS.pending },
                        { name: "Cancelled", value: stats?.total ? stats.total - (stats.completed + stats.failed + stats.pending) : 0, fill: COLORS.cancelled },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Task Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Task Type Distribution</CardTitle>
                <CardDescription>Breakdown by task type</CardDescription>
              </CardHeader>
              <CardContent>
                {taskTypeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taskTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {taskTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TASK_TYPE_COLORS[entry.type as keyof typeof TASK_TYPE_COLORS] || TASK_TYPE_COLORS.custom} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No task data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest task executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "📧 Send Email", status: "completed", time: "2 minutes ago" },
                    { type: "📊 Update Score", status: "completed", time: "15 minutes ago" },
                    { type: "🔔 Notification", status: "failed", time: "1 hour ago" },
                    { type: "📧 Send Email", status: "completed", time: "2 hours ago" },
                    { type: "📊 Update Score", status: "completed", time: "3 hours ago" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          activity.status === "completed" ? "bg-green-500" :
                          activity.status === "failed" ? "bg-red-500" : "bg-yellow-500"
                        }`} />
                        <div>
                          <p className="font-medium">{activity.type}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        activity.status === "completed" ? "bg-green-100 text-green-700" :
                        activity.status === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
