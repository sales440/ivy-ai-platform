import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Mail, MousePointerClick, Reply, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Campaign Metrics Dashboard
 * Real-time metrics for email campaigns by sector
 */
export default function CampaignMetrics() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Get email performance metrics
  const { data: metrics, isLoading, refetch } = trpc.emailTracking.getSectorMetrics.useQuery(
    { companyId: user?.companyId || 1 },
    { enabled: !!user }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalSent = metrics?.reduce((sum, m) => sum + m.totalSent, 0) || 0;
  const totalOpens = metrics?.reduce((sum, m) => sum + m.totalOpens, 0) || 0;
  const totalClicks = metrics?.reduce((sum, m) => sum + m.totalClicks, 0) || 0;
  const totalResponses = metrics?.reduce((sum, m) => sum + m.totalResponses, 0) || 0;

  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0.0';
  const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0';
  const responseRate = totalSent > 0 ? ((totalResponses / totalSent) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Campaign Metrics</h1>
              <p className="text-muted-foreground">
                Real-time performance of email campaigns
              </p>
            </div>
          </div>
          <Button onClick={() => refetch()}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overall KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSent}</div>
              <p className="text-xs text-muted-foreground">
                Emails delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <Mail className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalOpens} opens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clickRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalClicks} clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <Reply className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalResponses} responses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance by Sector */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Sector</CardTitle>
            <CardDescription>
              Email engagement metrics segmented by industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics && metrics.length > 0 ? (
                metrics.map((sector) => {
                  const sectorOpenRate = sector.totalSent > 0 
                    ? ((sector.totalOpens / sector.totalSent) * 100).toFixed(1) 
                    : '0.0';
                  const sectorClickRate = sector.totalSent > 0 
                    ? ((sector.totalClicks / sector.totalSent) * 100).toFixed(1) 
                    : '0.0';
                  const sectorResponseRate = sector.totalSent > 0 
                    ? ((sector.totalResponses / sector.totalSent) * 100).toFixed(1) 
                    : '0.0';

                  return (
                    <div
                      key={sector.industry || 'unknown'}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold capitalize">
                          {sector.industry || 'Unknown Sector'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {sector.totalSent} emails sent
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-500">
                            {sectorOpenRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Opens</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-500">
                            {sectorClickRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Clicks</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-500">
                            {sectorResponseRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Responses</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No campaign data available yet. Start sending emails to see metrics.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              📊 Campaign Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              <strong>Open Rate:</strong> Percentage of recipients who opened your email
            </p>
            <p>
              <strong>Click Rate:</strong> Percentage who clicked links in your email
            </p>
            <p>
              <strong>Response Rate:</strong> Percentage who replied to your email
            </p>
            <p className="text-sm mt-4 text-blue-600 dark:text-blue-300">
              💡 Industry benchmarks: Open rate 20-25%, Click rate 2-5%, Response rate 1-3%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
