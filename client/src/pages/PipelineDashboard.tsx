import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from "recharts";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompany } from "@/contexts/CompanyContext";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function PipelineDashboard() {
  const { selectedCompany } = useCompany();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Fetch companies for filter
  const { data: companies } = trpc.companies.listActive.useQuery();

  // Fetch pipeline metrics
  const { data: metrics, isLoading } = trpc.analytics.pipelineMetrics.useQuery(
    {
      companyId: selectedCompany?.id,
      startDate: dateRange?.from?.toISOString(),
      endDate: dateRange?.to?.toISOString(),
    },
    { enabled: !!selectedCompany }
  );

  // Transform data for funnel chart
  const funnelData = metrics?.stages.map((stage: any, index: number) => ({
    name: stage.stage,
    value: stage.count,
    fill: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Conversion Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track conversion rates and identify bottlenecks in your sales pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {!selectedCompany ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a company to view pipeline metrics
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading metrics...
          </CardContent>
        </Card>
      ) : !metrics ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No data available
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalConversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  New → Converted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Time to Convert</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgTimeToConvert} days</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all stages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bottleneck Stage</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.bottleneck ? `${metrics.bottleneck.rate}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.bottleneck ? `${metrics.bottleneck.from} → ${metrics.bottleneck.to}` : 'No bottleneck detected'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                Lead progression through pipeline stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel
                    dataKey="value"
                    data={funnelData}
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Rates Between Stages */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Conversion Rates</CardTitle>
              <CardDescription>
                Percentage of leads moving from one stage to the next
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.conversionRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="from" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fill="#8b5cf6" name="Conversion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Average Time by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Average Time per Stage</CardTitle>
              <CardDescription>
                Days spent in each pipeline stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.avgTimeByStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgDays" fill="#3b82f6" name="Average Days" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
