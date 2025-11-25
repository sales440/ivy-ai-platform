import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FlaskConical, TrendingUp, CheckCircle2, XCircle, Clock, ArrowRight, Zap
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface ABTest {
  testId: string;
  agentName: string;
  recommendationTitle: string;
  recommendationCategory: string;
  status: 'running' | 'completed' | 'failed';
  startDate: Date;
  endDate?: Date;
  controlMetrics: {
    emailsSent: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  testMetrics: {
    emailsSent: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  improvement: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  isSignificant: boolean;
  pValue: number;
  winner?: 'control' | 'test';
}

// Mock data
const mockTests: ABTest[] = [
  {
    testId: 'ab-ivy-prospect-1',
    agentName: 'Ivy-Prospect',
    recommendationTitle: 'Optimize Subject Lines for Higher Open Rates',
    recommendationCategory: 'subject_lines',
    status: 'running',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    controlMetrics: {
      emailsSent: 400,
      openRate: 28.0,
      clickRate: 11.25,
      conversionRate: 4.5,
    },
    testMetrics: {
      emailsSent: 100,
      openRate: 35.0,
      clickRate: 15.0,
      conversionRate: 7.0,
    },
    improvement: {
      openRate: 25.0,
      clickRate: 33.3,
      conversionRate: 55.6,
    },
    isSignificant: false,
    pValue: 0.08,
  },
  {
    testId: 'ab-ivy-closer-1',
    agentName: 'Ivy-Closer',
    recommendationTitle: 'Optimize Send Times for B2B Audience',
    recommendationCategory: 'timing',
    status: 'running',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    controlMetrics: {
      emailsSent: 320,
      openRate: 31.9,
      clickRate: 12.8,
      conversionRate: 5.9,
    },
    testMetrics: {
      emailsSent: 80,
      openRate: 35.0,
      clickRate: 15.0,
      conversionRate: 7.5,
    },
    improvement: {
      openRate: 9.7,
      clickRate: 17.2,
      conversionRate: 27.1,
    },
    isSignificant: false,
    pValue: 0.15,
  },
  {
    testId: 'ab-ivy-solve-1',
    agentName: 'Ivy-Solve',
    recommendationTitle: 'Enhance Email Content Personalization',
    recommendationCategory: 'content',
    status: 'completed',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    controlMetrics: {
      emailsSent: 500,
      openRate: 22.0,
      clickRate: 7.6,
      conversionRate: 3.0,
    },
    testMetrics: {
      emailsSent: 125,
      openRate: 28.0,
      clickRate: 11.2,
      conversionRate: 5.6,
    },
    improvement: {
      openRate: 27.3,
      clickRate: 47.4,
      conversionRate: 86.7,
    },
    isSignificant: true,
    pValue: 0.02,
    winner: 'test',
  },
];

export default function ABTestingDashboard() {
  const runningTests = mockTests.filter(t => t.status === 'running');
  const completedTests = mockTests.filter(t => t.status === 'completed');
  const winningTests = completedTests.filter(t => t.winner === 'test');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FlaskConical className="h-8 w-8" />
              A/B Testing Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Automated testing of AI recommendations with statistical significance
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningTests.length}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTests.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Winning Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{winningTests.length}</div>
              <p className="text-xs text-muted-foreground">Recommendations scaled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{winningTests.length > 0 
                  ? (winningTests.reduce((sum, t) => sum + t.improvement.conversionRate, 0) / winningTests.length).toFixed(1)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Conversion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Running Tests */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Running Tests
          </h2>
          <div className="space-y-4">
            {runningTests.map(test => (
              <Card key={test.testId} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{test.recommendationTitle}</CardTitle>
                      <CardDescription className="mt-1">
                        {test.agentName} • Started {Math.floor((Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {test.recommendationCategory.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Sample Size Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {test.testMetrics.emailsSent + test.controlMetrics.emailsSent} / 500 emails
                        </span>
                      </div>
                      <Progress 
                        value={((test.testMetrics.emailsSent + test.controlMetrics.emailsSent) / 500) * 100} 
                      />
                    </div>

                    {/* Metrics Comparison */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Open Rate</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            Control: {test.controlMetrics.openRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-blue-600">
                            Test: {test.testMetrics.openRate.toFixed(1)}%
                          </div>
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">
                            +{test.improvement.openRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Click Rate</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            Control: {test.controlMetrics.clickRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-blue-600">
                            Test: {test.testMetrics.clickRate.toFixed(1)}%
                          </div>
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">
                            +{test.improvement.clickRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Conversion Rate</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            Control: {test.controlMetrics.conversionRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-blue-600">
                            Test: {test.testMetrics.conversionRate.toFixed(1)}%
                          </div>
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">
                            +{test.improvement.conversionRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Statistical Significance */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Statistical Significance:</span>
                        <Badge variant={test.isSignificant ? 'default' : 'secondary'}>
                          {test.isSignificant ? 'Significant' : 'Not Yet Significant'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          (p = {test.pValue.toFixed(3)})
                        </span>
                      </div>
                      {!test.isSignificant && (
                        <span className="text-xs text-muted-foreground">
                          Need ~{500 - (test.testMetrics.emailsSent + test.controlMetrics.emailsSent)} more emails
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Tests */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Completed Tests
          </h2>
          <div className="space-y-4">
            {completedTests.map(test => (
              <Card key={test.testId} className={`border-l-4 ${
                test.winner === 'test' ? 'border-l-green-500' : 'border-l-gray-400'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {test.recommendationTitle}
                        {test.winner === 'test' && (
                          <Badge className="bg-green-600">
                            <Zap className="h-3 w-3 mr-1" />
                            Winner - Scaled to 100%
                          </Badge>
                        )}
                        {test.winner === 'control' && (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            No Improvement
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {test.agentName} • Completed {Math.floor((Date.now() - (test.endDate?.getTime() || 0)) / (1000 * 60 * 60 * 24))} days ago
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Open Rate</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{test.improvement.openRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.controlMetrics.openRate.toFixed(1)}% → {test.testMetrics.openRate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Click Rate</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{test.improvement.clickRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.controlMetrics.clickRate.toFixed(1)}% → {test.testMetrics.clickRate.toFixed(1)}%
                      </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Conversion Rate</div>
                      <div className="text-2xl font-bold text-green-600">
                        +{test.improvement.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {test.controlMetrics.conversionRate.toFixed(1)}% → {test.testMetrics.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-900">How A/B Testing Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-purple-900">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5" />
                <p>
                  <strong>80/20 Split:</strong> 80% of contacts receive the current (control) approach, 20% receive the AI recommendation (test variant)
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5" />
                <p>
                  <strong>Statistical Significance:</strong> Tests require minimum sample size (100 test, 400 control) and p-value &lt; 0.05 for 95% confidence
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-0.5" />
                <p>
                  <strong>Auto-Scaling:</strong> When test variant wins with statistical significance, the recommendation is automatically scaled to 100% of traffic
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
