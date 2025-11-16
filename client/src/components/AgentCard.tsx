import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Activity, TrendingUp, Zap } from 'lucide-react';
import { AGENT_NAMES, AGENT_DESCRIPTIONS } from '@/const';

interface AgentCardProps {
  agent: {
    id: number | null;
    agentId: string;
    name: string;
    type: string;
    department: string;
    status: 'idle' | 'active' | 'training' | 'error';
    capabilities: string[];
    kpis: Record<string, number>;
  };
  onExecute?: (agentType: string) => void;
}

const statusColors = {
  idle: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  training: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
};

const statusIcons = {
  idle: Activity,
  active: Zap,
  training: TrendingUp,
  error: Activity
};

export function AgentCard({ agent, onExecute }: AgentCardProps) {
  const StatusIcon = statusIcons[agent.status];
  const description = AGENT_DESCRIPTIONS[agent.type as keyof typeof AGENT_DESCRIPTIONS] || agent.department;

  // Get top 3 KPIs
  const topKPIs = Object.entries(agent.kpis)
    .slice(0, 3)
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(2)) : value
    }));

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[agent.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {agent.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Capabilities */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Capabilities</p>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map((cap) => (
              <Badge key={cap} variant="secondary" className="text-xs">
                {cap.replace(/_/g, ' ')}
              </Badge>
            ))}
            {agent.capabilities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{agent.capabilities.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* KPIs */}
        {topKPIs.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Key Metrics</p>
            <div className="grid grid-cols-3 gap-2">
              {topKPIs.map((kpi) => (
                <div key={kpi.name} className="text-center">
                  <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{kpi.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {onExecute && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onExecute(agent.type)}
            disabled={agent.status === 'error'}
          >
            Execute Task
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
