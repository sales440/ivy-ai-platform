import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, Users, TrendingDown, Zap, Mail, CheckCircle2, Clock, Target
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

interface ChurnPrediction {
  contactId: string;
  email: string;
  name: string;
  companyName: string;
  churnRiskScore: number;
  churnRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryReason: string;
  contributingFactors: string[];
  recommendedActions: string[];
  shouldTriggerReactivation: boolean;
}

const riskColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
};

const riskIcons = {
  critical: AlertTriangle,
  high: TrendingDown,
  medium: Clock,
  low: CheckCircle2,
};

export default function ChurnRiskDashboard() {
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());

  const { data: predictions, isLoading, refetch } = trpc.churnPrediction.getPredictions.useQuery();
  const { data: stats } = trpc.churnPrediction.getStatistics.useQuery();
  const triggerReactivation = trpc.churnPrediction.triggerReactivation.useMutation({
    onSuccess: () => {
      toast.success('Reactivation sequence triggered successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to trigger reactivation: ${error.message}`);
    },
  });

  const toggleContact = (contactId: string) => {
    const newExpanded = new Set(expandedContacts);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedContacts(newExpanded);
  };

  const handleTriggerReactivation = (contact: ChurnPrediction) => {
    triggerReactivation.mutate({
      contactId: contact.contactId,
      email: contact.email,
      name: contact.name,
      churnRiskScore: contact.churnRiskScore,
      churnRiskLevel: contact.churnRiskLevel,
      primaryReason: contact.primaryReason,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  const criticalContacts = predictions?.filter(p => p.churnRiskLevel === 'critical') || [];
  const highRiskContacts = predictions?.filter(p => p.churnRiskLevel === 'high') || [];
  const atRiskContacts = predictions?.filter(p => p.churnRiskLevel === 'high' || p.churnRiskLevel === 'critical') || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              Contact Churn Risk Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              ML-powered prediction of contacts at risk of disengaging
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <Target className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
              <p className="text-xs text-muted-foreground">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.atRiskContacts || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalContacts ? ((stats.atRiskContacts / stats.totalContacts) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.criticalRiskContacts || 0}</div>
              <p className="text-xs text-muted-foreground">Require immediate action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Reactivation Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.reactivationRate.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">Successfully re-engaged</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Risk Contacts */}
        {criticalContacts.length > 0 && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Risk Contacts ({criticalContacts.length})
              </CardTitle>
              <CardDescription className="text-red-700">
                These contacts require immediate reactivation action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criticalContacts.map(contact => {
                  const Icon = riskIcons[contact.churnRiskLevel];
                  const isExpanded = expandedContacts.has(contact.contactId);

                  return (
                    <div
                      key={contact.contactId}
                      className="border border-red-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-red-600" />
                            <h4 className="font-semibold">{contact.name}</h4>
                            <Badge className={riskColors[contact.churnRiskLevel]}>
                              {contact.churnRiskLevel.toUpperCase()} - {contact.churnRiskScore}/100
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                          <p className="text-sm text-muted-foreground">{contact.companyName}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleTriggerReactivation(contact)}
                          disabled={triggerReactivation.isPending}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Trigger Reactivation
                        </Button>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-red-800">
                          Primary Reason: {contact.primaryReason}
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t">
                          <div>
                            <h5 className="text-sm font-semibold mb-2">Contributing Factors:</h5>
                            <ul className="space-y-1">
                              {contact.contributingFactors.map((factor, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-red-600">•</span>
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="text-sm font-semibold mb-2">Recommended Actions:</h5>
                            <ol className="space-y-1">
                              {contact.recommendedActions.map((action, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="font-semibold text-red-600">{idx + 1}.</span>
                                  {action}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={() => toggleContact(contact.contactId)}
                      >
                        {isExpanded ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* High Risk Contacts */}
        {highRiskContacts.length > 0 && (
          <Card className="border-orange-300 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                High Risk Contacts ({highRiskContacts.length})
              </CardTitle>
              <CardDescription className="text-orange-700">
                These contacts show declining engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highRiskContacts.map(contact => {
                  const Icon = riskIcons[contact.churnRiskLevel];
                  const isExpanded = expandedContacts.has(contact.contactId);

                  return (
                    <div
                      key={contact.contactId}
                      className="border border-orange-200 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-orange-600" />
                            <h4 className="font-semibold">{contact.name}</h4>
                            <Badge className={riskColors[contact.churnRiskLevel]}>
                              {contact.churnRiskLevel.toUpperCase()} - {contact.churnRiskScore}/100
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                          <p className="text-sm text-muted-foreground">{contact.companyName}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTriggerReactivation(contact)}
                          disabled={triggerReactivation.isPending}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Reactivate
                        </Button>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-orange-800">
                          {contact.primaryReason}
                        </p>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t">
                          <div>
                            <h5 className="text-sm font-semibold mb-2">Contributing Factors:</h5>
                            <ul className="space-y-1">
                              {contact.contributingFactors.map((factor, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-orange-600">•</span>
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="text-sm font-semibold mb-2">Recommended Actions:</h5>
                            <ol className="space-y-1">
                              {contact.recommendedActions.map((action, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="font-semibold text-orange-600">{idx + 1}.</span>
                                  {action}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={() => toggleContact(contact.contactId)}
                      >
                        {isExpanded ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">How Churn Prediction Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-900">
              <p>
                <strong>ML-Powered Risk Scoring:</strong> Analyzes engagement patterns (opens, clicks, replies), 
                temporal trends, and historical performance to calculate a 0-100 churn risk score.
              </p>
              <p>
                <strong>Risk Levels:</strong> Critical (75-100), High (50-74), Medium (25-49), Low (0-24)
              </p>
              <p>
                <strong>Automated Reactivation:</strong> High and critical risk contacts automatically trigger 
                personalized reactivation sequences with optimal timing and content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
