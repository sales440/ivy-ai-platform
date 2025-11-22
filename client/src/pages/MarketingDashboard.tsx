import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Users, Target, DollarSign, Zap } from "lucide-react";

/**
 * Marketing Analytics Dashboard
 * Real-time metrics for lead generation, conversion, and ROI tracking
 */
export default function MarketingDashboard() {
  const { data: analytics, isLoading } = trpc.marketing.getAnalytics.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  const sourceLabels: Record<string, string> = {
    whitepaper: "Whitepaper",
    calculator: "ROI Calculator",
    "demo-request": "Demo Request",
    linkedin: "LinkedIn",
    seo: "SEO",
    referral: "Referral",
  };

  const stageLabels: Record<string, string> = {
    awareness: "Awareness",
    consideration: "Consideration",
    decision: "Decision",
    qualified: "Qualified",
    disqualified: "Disqualified",
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Marketing Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Real-time metrics for lead generation, conversion, and ROI tracking
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time lead captures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.qualifiedLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lead score ≥ 70
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads → Qualified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgLeadScore}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of 100
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Source</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(analytics.leadsBySource).sort((a, b) => b[1] - a[1])[0]?.[0] 
                  ? sourceLabels[Object.entries(analytics.leadsBySource).sort((a, b) => b[1] - a[1])[0][0]] 
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Object.entries(analytics.leadsBySource).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected ROI</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Math.round(analytics.qualifiedLeads * 50000).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on avg deal size
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Leads by Source</CardTitle>
            <CardDescription>Distribution of lead acquisition channels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.leadsBySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => {
                  const percentage = analytics.totalLeads > 0 
                    ? Math.round((count / analytics.totalLeads) * 100) 
                    : 0;
                  return (
                    <div key={source} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{sourceLabels[source] || source}</span>
                        <span className="text-muted-foreground">
                          {count} leads ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead progression through marketing stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["awareness", "consideration", "decision", "qualified"].map((stage) => {
                const count = analytics.leadsByStage[stage] || 0;
                const percentage = analytics.totalLeads > 0 
                  ? Math.round((count / analytics.totalLeads) * 100) 
                  : 0;
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{stageLabels[stage]}</span>
                      <span className="text-muted-foreground">
                        {count} leads ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
            <CardDescription>Automated recommendations based on your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.conversionRate < 20 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  ⚠️ Low Conversion Rate
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Your conversion rate is below industry average (25-30%). Consider improving lead quality 
                  by adding more qualification questions to your forms or targeting higher-intent keywords.
                </p>
              </div>
            )}

            {analytics.avgLeadScore < 40 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                  📊 Low Average Lead Score
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Most leads are in early awareness stage. Increase engagement by promoting the ROI calculator 
                  and case studies to move leads toward consideration.
                </p>
              </div>
            )}

            {analytics.totalLeads > 50 && analytics.qualifiedLeads < 10 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  🎯 Qualification Bottleneck
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  You have {analytics.totalLeads} leads but only {analytics.qualifiedLeads} qualified. 
                  Review your nurturing sequences and consider adding more touchpoints to move leads through the funnel.
                </p>
              </div>
            )}

            {analytics.conversionRate >= 30 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  ✅ Strong Performance
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your {analytics.conversionRate}% conversion rate is above industry average! 
                  Consider scaling your top-performing channels to maximize ROI.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
