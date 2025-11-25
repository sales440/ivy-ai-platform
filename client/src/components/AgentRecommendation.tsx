import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, TrendingUp, Target, CheckCircle2, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentRecommendationProps {
  campaignType: string;
  targetIndustry?: string;
  onSelectAgent?: (agentId: string) => void;
}

export function AgentRecommendation({ campaignType, targetIndustry, onSelectAgent }: AgentRecommendationProps) {
  const { data, isLoading } = trpc.campaignAgentMatcher.getRecommendations.useQuery({
    campaignType,
    targetIndustry,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>No recommendations available</AlertTitle>
        <AlertDescription>
          Unable to generate agent recommendations for this campaign type.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Recommended AI Agents
        </CardTitle>
        <CardDescription>
          Based on campaign type "{campaignType}" and performance data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.recommendations.map((rec, index) => (
          <Card key={rec.agentId} className={index === 0 ? "border-primary" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{rec.agentName}</h4>
                    {index === 0 && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Best Match
                      </Badge>
                    )}
                    <Badge variant="outline">{rec.agentType}</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{rec.reasoning}</p>

                  <div className="flex flex-wrap gap-4 mb-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{rec.score.toFixed(1)}</span>
                      <span className="text-muted-foreground">Match Score</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{rec.expectedConversionRate.toFixed(1)}%</span>
                      <span className="text-muted-foreground">Conv. Rate</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">{rec.expectedROI.toFixed(0)}%</span>
                      <span className="text-muted-foreground">ROI</span>
                    </div>
                  </div>

                  {rec.capabilities && rec.capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {rec.capabilities.slice(0, 4).map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {rec.capabilities.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{rec.capabilities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {onSelectAgent && (
                  <Button
                    onClick={() => onSelectAgent(rec.agentId)}
                    variant={index === 0 ? "default" : "outline"}
                    size="sm"
                    className="ml-4"
                  >
                    Select
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {data.insights && data.insights.length > 0 && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Insights</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {data.insights.map((insight, i) => (
                  <li key={i} className="text-sm">{insight}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
