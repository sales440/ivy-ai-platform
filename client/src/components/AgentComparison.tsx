import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Trophy, AlertCircle } from "lucide-react";

interface AgentMetrics {
  agentId: string;
  agentName: string;
  department: string;
  campaignName: string;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  openRate: number;
  clickRate: number;
  leadsGenerated: number;
  conversions: number;
  conversionRate: number;
  avgResponseTime: number;
  roi: number;
}

interface AgentComparisonProps {
  agents: AgentMetrics[];
}

export function AgentComparison({ agents }: AgentComparisonProps) {
  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Comparison</CardTitle>
          <CardDescription>No agents to compare</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Find best and worst performers
  const bestConversionAgent = agents.reduce((prev, current) => 
    current.conversionRate > prev.conversionRate ? current : prev
  );

  const bestROIAgent = agents.reduce((prev, current) => 
    current.roi > prev.roi ? current : prev
  );

  const worstConversionAgent = agents.reduce((prev, current) => 
    current.conversionRate < prev.conversionRate ? current : prev
  );

  // Prepare comparison data for charts
  const conversionComparisonData = agents.map(agent => ({
    name: agent.agentName,
    'Conversion Rate': agent.conversionRate,
    'Open Rate': agent.openRate,
  }));

  const roiComparisonData = agents.map(agent => ({
    name: agent.agentName,
    'ROI': agent.roi,
  }));

  const volumeComparisonData = agents.map(agent => ({
    name: agent.agentName,
    'Emails Sent': agent.emailsSent,
    'Conversions': agent.conversions,
  }));

  // Calculate percentage differences
  const calculateDifference = (value1: number, value2: number) => {
    if (value2 === 0) return 0;
    return ((value1 - value2) / value2) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-600" />
              Best Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-700">
                {bestConversionAgent.conversionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-green-600">{bestConversionAgent.agentName}</p>
              <Badge variant="secondary" className="text-xs">
                {bestConversionAgent.conversions} conversions
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-blue-600" />
              Best ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-blue-700">
                {bestROIAgent.roi.toFixed(0)}%
              </p>
              <p className="text-sm text-blue-600">{bestROIAgent.agentName}</p>
              <Badge variant="secondary" className="text-xs">
                {bestROIAgent.campaignName}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-orange-700">
                {worstConversionAgent.conversionRate.toFixed(1)}%
              </p>
              <p className="text-sm text-orange-600">{worstConversionAgent.agentName}</p>
              <Badge variant="secondary" className="text-xs">
                Focus area: Conversion
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion & Open Rate Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion & Open Rate Comparison</CardTitle>
          <CardDescription>Compare conversion and open rates across agents</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Conversion Rate" fill="#10b981" />
              <Bar dataKey="Open Rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ROI Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>ROI Comparison</CardTitle>
          <CardDescription>Compare return on investment across agents</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ROI" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Volume Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Volume Comparison</CardTitle>
          <CardDescription>Compare email volume and conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={volumeComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Emails Sent" fill="#06b6d4" />
              <Bar dataKey="Conversions" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics Comparison</CardTitle>
          <CardDescription>Side-by-side comparison of all metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Metric</th>
                  {agents.map(agent => (
                    <th key={agent.agentId} className="text-center p-2 font-medium">
                      {agent.agentName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Campaign</td>
                  {agents.map(agent => (
                    <td key={agent.agentId} className="text-center p-2">
                      <Badge variant="outline" className="text-xs">
                        {agent.campaignName}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Emails Sent</td>
                  {agents.map(agent => (
                    <td key={agent.agentId} className="text-center p-2">
                      {agent.emailsSent}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Open Rate</td>
                  {agents.map(agent => (
                    <td key={agent.agentId} className="text-center p-2">
                      {agent.openRate.toFixed(1)}%
                      {agent === bestConversionAgent && (
                        <TrendingUp className="inline h-3 w-3 ml-1 text-green-500" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Conversions</td>
                  {agents.map(agent => (
                    <td key={agent.agentId} className="text-center p-2 font-semibold">
                      {agent.conversions}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Conversion Rate</td>
                  {agents.map(agent => (
                    <td key={agent.agentId} className="text-center p-2">
                      <span className={agent === bestConversionAgent ? 'text-green-600 font-semibold' : ''}>
                        {agent.conversionRate.toFixed(1)}%
                      </span>
                      {agent === bestConversionAgent && (
                        <Trophy className="inline h-3 w-3 ml-1 text-green-500" />
                      )}
                      {agent === worstConversionAgent && (
                        <TrendingDown className="inline h-3 w-3 ml-1 text-orange-500" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">ROI</td>
                  {agents.map(agent => (
                    <td key={agent.agentId} className="text-center p-2">
                      <span className={agent === bestROIAgent ? 'text-blue-600 font-semibold' : ''}>
                        {agent.roi.toFixed(0)}%
                      </span>
                      {agent === bestROIAgent && (
                        <Trophy className="inline h-3 w-3 ml-1 text-blue-500" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 font-medium">Avg Response Time</td>
                  {agents.map(agent => (
                    <td key={agent.agentId} className="text-center p-2">
                      {agent.avgResponseTime.toFixed(1)}h
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-900">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-purple-900">
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 mt-0.5 text-purple-600" />
              <p>
                <strong>{bestConversionAgent.agentName}</strong> leads in conversion rate with{' '}
                <strong>{bestConversionAgent.conversionRate.toFixed(1)}%</strong>, which is{' '}
                <strong>
                  {calculateDifference(
                    bestConversionAgent.conversionRate,
                    worstConversionAgent.conversionRate
                  ).toFixed(0)}%
                </strong>{' '}
                higher than the lowest performer.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 mt-0.5 text-purple-600" />
              <p>
                <strong>{bestROIAgent.agentName}</strong> achieves the highest ROI at{' '}
                <strong>{bestROIAgent.roi.toFixed(0)}%</strong> in the {bestROIAgent.campaignName} campaign.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-purple-600" />
              <p>
                <strong>{worstConversionAgent.agentName}</strong> may benefit from reviewing email content,
                timing, or audience targeting to improve conversion rates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
