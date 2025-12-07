import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Eye, MousePointerClick, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * A/B Test Results Dashboard
 * Compare performance of landing page variants
 */
export default function ABTestDashboard() {
  const [selectedTest, setSelectedTest] = useState("Whitepaper Headline Test");

  const { data: results, isLoading } = trpc.marketing.getABTestResults.useQuery({
    testName: selectedTest,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const controlVariant = results?.find((r: any) => r.isControl);
  const testVariants = results?.filter((r: any) => !r.isControl) || [];

  const calculateLift = (variantRate: number, controlRate: number) => {
    if (!controlRate) return 0;
    return ((variantRate - controlRate) / controlRate) * 100;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">A/B Test Results</h1>
          <p className="text-muted-foreground mt-2">
            Compare landing page variants and optimize conversion rates
          </p>
        </div>

        {/* Test Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedTest === "Whitepaper Headline Test" ? "default" : "outline"}
            onClick={() => setSelectedTest("Whitepaper Headline Test")}
          >
            Whitepaper Test
          </Button>
          <Button
            variant={selectedTest === "Demo CTA Test" ? "default" : "outline"}
            onClick={() => setSelectedTest("Demo CTA Test")}
          >
            Demo CTA Test
          </Button>
        </div>

        {/* Control Variant */}
        {controlVariant && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Control: {controlVariant.variantName}</span>
                <span className="text-sm font-normal text-muted-foreground">Baseline</span>
              </CardTitle>
              <CardDescription>Original version (baseline for comparison)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Views
                  </div>
                  <div className="text-2xl font-bold">{controlVariant.views || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MousePointerClick className="h-4 w-4" />
                    Clicks
                  </div>
                  <div className="text-2xl font-bold">{controlVariant.clicks || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Conversions
                  </div>
                  <div className="text-2xl font-bold">{controlVariant.conversions || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    CVR
                  </div>
                  <div className="text-2xl font-bold">{controlVariant.conversionRate || 0}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testVariants.map((variant: any) => {
            const lift = calculateLift(
              variant.conversionRate || 0,
              controlVariant?.conversionRate || 0
            );
            const isWinning = lift > 0;

            return (
              <Card key={variant.id} className={isWinning ? "border-green-500" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{variant.variantName}</span>
                    {isWinning && (
                      <span className="text-sm font-normal text-green-600 dark:text-green-400">
                        +{lift.toFixed(1)}% lift
                      </span>
                    )}
                    {!isWinning && lift !== 0 && (
                      <span className="text-sm font-normal text-red-600 dark:text-red-400">
                        {lift.toFixed(1)}% lift
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>Test variant</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Views
                      </div>
                      <div className="text-2xl font-bold">{variant.views || 0}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MousePointerClick className="h-4 w-4" />
                        Clicks
                      </div>
                      <div className="text-2xl font-bold">{variant.clicks || 0}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        Conversions
                      </div>
                      <div className="text-2xl font-bold">{variant.conversions || 0}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        CVR
                      </div>
                      <div className="text-2xl font-bold">{variant.conversionRate || 0}%</div>
                    </div>
                  </div>

                  {/* Performance Comparison */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CTR:</span>
                        <span className="font-medium">{variant.ctr || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">vs Control:</span>
                        <span
                          className={`font-medium ${
                            isWinning
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {lift > 0 ? "+" : ""}
                          {lift.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Test Insights</CardTitle>
            <CardDescription>AI-powered recommendations based on results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testVariants.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No test data yet. Variants will start collecting data as visitors land on the pages.
              </p>
            )}

            {testVariants.some((v: any) => {
              const lift = calculateLift(v.conversionRate || 0, controlVariant?.conversionRate || 0);
              return lift > 10;
            }) && (
              <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  🎉 Winning Variant Detected!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {
                    testVariants.find((v: any) => {
                      const lift = calculateLift(
                        v.conversionRate || 0,
                        controlVariant?.conversionRate || 0
                      );
                      return lift > 10;
                    })?.variantName
                  }{" "}
                  is significantly outperforming the control. Consider making this the new default.
                </p>
              </div>
            )}

            {controlVariant && controlVariant.views < 100 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                  ⏳ Collecting Data...
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Need at least 100-200 views per variant for statistical significance. Current: {controlVariant.views} views.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
