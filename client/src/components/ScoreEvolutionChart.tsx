import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ScoreHistoryEntry {
  score: number;
  change: number;
  reason: string;
  timestamp: string;
  userId: number;
}

interface ScoreEvolutionChartProps {
  scoreHistory?: ScoreHistoryEntry[];
  currentScore: number;
}

export function ScoreEvolutionChart({ scoreHistory, currentScore }: ScoreEvolutionChartProps) {
  if (!scoreHistory || scoreHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Evolution</CardTitle>
          <CardDescription>No score history available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Score changes will appear here as interactions occur</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = scoreHistory.map((entry) => ({
    ...entry,
    date: new Date(entry.timestamp).toLocaleDateString(),
    time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  // Calculate stats
  const initialScore = scoreHistory[0]?.score - scoreHistory[0]?.change || 0;
  const scoreChange = currentScore - initialScore;
  const positiveChanges = scoreHistory.filter(e => e.change > 0).length;
  const negativeChanges = scoreHistory.filter(e => e.change < 0).length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.date} {data.time}</p>
          <p className="text-sm mt-1">
            <span className="font-medium">Score:</span> {data.score}
          </p>
          <p className="text-sm">
            <span className="font-medium">Change:</span>{' '}
            <span className={data.change > 0 ? 'text-green-600' : 'text-red-600'}>
              {data.change > 0 ? '+' : ''}{data.change}
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">{data.reason}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Evolution</CardTitle>
        <CardDescription>
          Track how this lead's qualification score has changed over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Initial Score</p>
            <p className="text-2xl font-bold">{initialScore}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Current Score</p>
            <p className="text-2xl font-bold">{currentScore}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Change</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${scoreChange > 0 ? 'text-green-600' : scoreChange < 0 ? 'text-red-600' : ''}`}>
                {scoreChange > 0 ? '+' : ''}{scoreChange}
              </p>
              {scoreChange > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : scoreChange < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : null}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Change Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-600" />
            <span className="text-sm text-muted-foreground">
              {positiveChanges} positive changes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-600" />
            <span className="text-sm text-muted-foreground">
              {negativeChanges} negative changes
            </span>
          </div>
        </div>

        {/* Recent Changes */}
        <div className="mt-6">
          <h4 className="font-semibold text-sm mb-3">Recent Changes</h4>
          <div className="space-y-2">
            {scoreHistory.slice(-5).reverse().map((entry, idx) => (
              <div key={idx} className="flex items-start justify-between text-sm border-l-2 pl-3 py-1"
                style={{ borderColor: entry.change > 0 ? '#10b981' : '#ef4444' }}>
                <div>
                  <p className="font-medium">{entry.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`font-semibold ${entry.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.change > 0 ? '+' : ''}{entry.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
