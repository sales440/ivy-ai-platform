import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Lightbulb, TrendingUp, Clock, Target, Mail, Users, CheckCircle2, AlertCircle, Sparkles
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface Recommendation {
  category: 'subject_lines' | 'timing' | 'targeting' | 'content' | 'follow_up';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  actionSteps: string[];
}

interface AgentRecommendations {
  agentId: string;
  agentName: string;
  overallAssessment: string;
  recommendations: Recommendation[];
  generatedAt: Date;
}

const categoryIcons = {
  subject_lines: Mail,
  timing: Clock,
  targeting: Target,
  content: Lightbulb,
  follow_up: TrendingUp,
};

const categoryLabels = {
  subject_lines: 'Subject Lines',
  timing: 'Timing',
  targeting: 'Targeting',
  content: 'Content',
  follow_up: 'Follow-up',
};

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function AgentRecommendations() {
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());

  const { data: recommendations, isLoading, refetch } = trpc.agentRecommendations.getAllRecommendations.useQuery();

  const toggleRecommendation = (key: string) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRecommendations(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>No recommendations available at this time</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Sparkles className="h-6 w-6 text-purple-600" />
                AI-Powered Optimization Recommendations
              </CardTitle>
              <CardDescription className="text-purple-700 mt-2">
                Data-driven insights to improve agent performance and conversion rates
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Recommendations by Agent */}
      {recommendations.map((agentRec: AgentRecommendations) => (
        <Card key={agentRec.agentId} className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{agentRec.agentName}</CardTitle>
                <CardDescription className="mt-2 text-base">
                  {agentRec.overallAssessment}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {agentRec.recommendations.length} recommendations
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentRec.recommendations.map((rec, idx) => {
                const Icon = categoryIcons[rec.category];
                const key = `${agentRec.agentId}-${idx}`;
                const isExpanded = expandedRecommendations.has(key);

                return (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 transition-all ${
                      rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                      rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        rec.priority === 'high' ? 'bg-red-100' :
                        rec.priority === 'medium' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          rec.priority === 'high' ? 'text-red-600' :
                          rec.priority === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-base">{rec.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {categoryLabels[rec.category]}
                              </Badge>
                              <Badge className={`text-xs ${priorityColors[rec.priority]}`}>
                                {rec.priority.toUpperCase()} PRIORITY
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Expected Impact: {rec.expectedImpact}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 p-4 bg-white rounded-lg border">
                            <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Action Steps:
                            </h5>
                            <ol className="space-y-2">
                              {rec.actionSteps.map((step, stepIdx) => (
                                <li key={stepIdx} className="flex items-start gap-2 text-sm">
                                  <span className="font-semibold text-purple-600 min-w-[20px]">
                                    {stepIdx + 1}.
                                  </span>
                                  <span className="text-gray-700">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3"
                          onClick={() => toggleRecommendation(key)}
                        >
                          {isExpanded ? 'Hide' : 'Show'} Action Steps
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            About These Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-900">
            These recommendations are generated using AI analysis of agent performance data, industry benchmarks, 
            and best practices in B2B email marketing. Recommendations are prioritized based on potential impact 
            and current performance gaps. Implement high-priority recommendations first for maximum improvement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
