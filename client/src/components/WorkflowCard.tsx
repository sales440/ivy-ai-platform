import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, XCircle, Play, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface WorkflowCardProps {
  id: string;
  name: string;
  description: string;
  steps: string[];
  onExecute: (workflowId: string) => Promise<void>;
}

export function WorkflowCard({ id, name, description, steps, onExecute }: WorkflowCardProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [currentSteps, setCurrentSteps] = useState<WorkflowStep[]>(
    steps.map((step, idx) => ({
      id: `step-${idx}`,
      name: step,
      status: 'pending' as const,
    }))
  );
  const [progress, setProgress] = useState(0);

  const handleExecute = async () => {
    setStatus('running');
    setProgress(0);
    
    // Reset all steps to pending
    setCurrentSteps(steps.map((step, idx) => ({
      id: `step-${idx}`,
      name: step,
      status: 'pending' as const,
    })));

    try {
      // Simulate step-by-step execution
      for (let i = 0; i < steps.length; i++) {
        // Update current step to running
        setCurrentSteps(prev => prev.map((step, idx) => 
          idx === i ? { ...step, status: 'running' } : step
        ));

        // Simulate step execution time
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update current step to completed
        setCurrentSteps(prev => prev.map((step, idx) => 
          idx === i ? { ...step, status: 'completed' } : step
        ));

        // Update progress
        setProgress(((i + 1) / steps.length) * 100);
      }

      // Execute actual workflow
      await onExecute(id);
      
      setStatus('completed');
      toast.success('Workflow completed successfully!', {
        description: `${name} has finished execution.`,
      });
    } catch (error: any) {
      setStatus('failed');
      // Mark current step as failed
      const currentStepIndex = currentSteps.findIndex(s => s.status === 'running');
      if (currentStepIndex !== -1) {
        setCurrentSteps(prev => prev.map((step, idx) => 
          idx === currentStepIndex ? { ...step, status: 'failed' } : step
        ));
      }
      toast.error('Workflow execution failed', {
        description: error.message || 'An error occurred during execution.',
      });
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><Circle className="h-3 w-3 mr-1" />Idle</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
  };

  const getStepIcon = (stepStatus: WorkflowStep['status']) => {
    switch (stepStatus) {
      case 'pending':
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const completedSteps = currentSteps.filter(s => s.status === 'completed').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{name}</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button 
            onClick={handleExecute} 
            variant="outline" 
            size="sm"
            disabled={status === 'running'}
          >
            {status === 'running' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completedSteps} / {steps.length} steps</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2">
          {currentSteps.map((step, idx) => (
            <div 
              key={step.id} 
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                step.status === 'running' ? 'bg-blue-500/5' :
                step.status === 'completed' ? 'bg-green-500/5' :
                step.status === 'failed' ? 'bg-red-500/5' :
                'bg-muted/30'
              }`}
            >
              {getStepIcon(step.status)}
              <span className={`text-sm flex-1 ${
                step.status === 'completed' ? 'text-muted-foreground line-through' :
                step.status === 'running' ? 'font-medium' :
                'text-muted-foreground'
              }`}>
                {step.name}
              </span>
              {step.status === 'running' && (
                <Clock className="h-3 w-3 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
