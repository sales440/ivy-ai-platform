import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Settings, Bot, Trash2, Plus, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const AGENT_TYPES = [
  { type: 'prospect', name: 'Ivy-Prospect', department: 'Sales', icon: '🎯' },
  { type: 'closer', name: 'Ivy-Closer', department: 'Sales', icon: '💼' },
  { type: 'solve', name: 'Ivy-Solve', department: 'Customer Service', icon: '🛠️' },
  { type: 'logic', name: 'Ivy-Logic', department: 'Operations', icon: '⚙️' },
  { type: 'talent', name: 'Ivy-Talent', department: 'HR', icon: '👥' },
  { type: 'insight', name: 'Ivy-Insight', department: 'Strategy', icon: '📊' },
] as const;

const CONFIG_PRESETS = {
  conservative: {
    name: 'Conservative',
    description: 'Focused and deterministic responses with minimal creativity',
    temperature: 20,
    maxTokens: 1000,
    icon: '🛡️',
  },
  balanced: {
    name: 'Balanced',
    description: 'Good balance between consistency and creativity',
    temperature: 50,
    maxTokens: 2000,
    icon: '⚖️',
  },
  creative: {
    name: 'Creative',
    description: 'Highly creative and exploratory responses',
    temperature: 85,
    maxTokens: 3000,
    icon: '🎨',
  },
} as const;

export default function AgentConfig() {
  const { selectedCompany } = useCompany();
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  const { data: configurationsData, isLoading, refetch } = trpc.agentConfig.listByCompany.useQuery(
    { companyId: Number(selectedCompany?.id) },
    { enabled: !!selectedCompany }
  );

  const upsertConfig = trpc.agentConfig.upsert.useMutation({
    onSuccess: () => {
      toast.success('Agent configuration saved successfully');
      setIsConfigDialogOpen(false);
      setEditingAgent(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save configuration: ${error.message}`);
    }
  });

  const deleteConfig = trpc.agentConfig.delete.useMutation({
    onSuccess: () => {
      toast.success('Configuration deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const exportConfigs = trpc.agentConfig.export.useQuery(
    { companyId: Number(selectedCompany?.id) },
    { enabled: false }
  );

  const importConfigs = trpc.agentConfig.import.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} configurations, skipped ${data.skipped}`);
      setImportDialogOpen(false);
      setImportData(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const configurations = configurationsData?.configurations || [];

  const getConfigForAgent = (agentType: string) => {
    return configurations.find(c => c.agentType === agentType);
  };

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCompany) return;

    const formData = new FormData(e.currentTarget);
    
    upsertConfig.mutate({
      companyId: Number(selectedCompany.id),
      agentType: formData.get('agentType') as any,
      temperature: Number(formData.get('temperature')),
      maxTokens: Number(formData.get('maxTokens')),
      systemPrompt: formData.get('systemPrompt') as string || undefined,
      customInstructions: formData.get('customInstructions') as string || undefined,
      isActive: formData.get('isActive') === 'true',
    });
  };

  const handleDeleteConfig = (agentType: string) => {
    if (!selectedCompany) return;
    if (confirm(`Delete custom configuration for ${AGENT_TYPES.find(a => a.type === agentType)?.name}? Agent will revert to default settings.`)) {
      deleteConfig.mutate({
        companyId: Number(selectedCompany.id),
        agentType: agentType as any,
      });
    }
  };

  const openConfigDialog = (agentType: string) => {
    const existingConfig = getConfigForAgent(agentType);
    setEditingAgent({
      type: agentType,
      ...AGENT_TYPES.find(a => a.type === agentType),
      config: existingConfig || {
        temperature: 70,
        maxTokens: 2000,
        systemPrompt: '',
        customInstructions: '',
        isActive: true,
      }
    });
    setIsConfigDialogOpen(true);
  };

  if (!selectedCompany) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-muted-foreground">Please select a company to configure agents</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Customize agent behavior for {selectedCompany.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const result = await exportConfigs.refetch();
                if (result.data) {
                  const blob = new Blob([JSON.stringify(result.data.exportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `agent-configs-${selectedCompany.name}-${new Date().toISOString().split('T')[0]}.json`;
                  link.click();
                  toast.success('Configurations exported successfully');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e: any) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const data = JSON.parse(event.target?.result as string);
                        setImportData(data);
                        setImportDialogOpen(true);
                      } catch (error) {
                        toast.error('Invalid JSON file');
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{AGENT_TYPES.length}</div>
              <p className="text-xs text-muted-foreground">
                Available agent types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configured</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{configurations.length}</div>
              <p className="text-xs text-muted-foreground">
                Custom configurations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Using Defaults</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{AGENT_TYPES.length - configurations.length}</div>
              <p className="text-xs text-muted-foreground">
                Default settings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {AGENT_TYPES.map((agent) => {
            const config = getConfigForAgent(agent.type);
            const isConfigured = !!config;

            return (
              <Card key={agent.type} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{agent.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription>{agent.department}</CardDescription>
                      </div>
                    </div>
                    {isConfigured && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Custom
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isConfigured ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature:</span>
                        <span className="font-medium">{config.temperature}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Tokens:</span>
                        <span className="font-medium">{config.maxTokens}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Using default configuration
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openConfigDialog(agent.type)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {isConfigured ? 'Edit' : 'Configure'}
                    </Button>
                    {isConfigured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConfig(agent.type)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Configuration Dialog */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {editingAgent && (
              <form onSubmit={handleSaveConfig}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-2xl">{editingAgent.icon}</span>
                    Configure {editingAgent.name}
                  </DialogTitle>
                  <DialogDescription>
                    Customize agent behavior and parameters for {selectedCompany.name}
                  </DialogDescription>
                </DialogHeader>
                
                <input type="hidden" name="agentType" value={editingAgent.type} />
                
                <div className="grid gap-6 py-4">
                  {/* Configuration Presets */}
                  <div className="grid gap-3">
                    <Label>Quick Presets</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(CONFIG_PRESETS).map(([key, preset]) => (
                        <Button
                          key={key}
                          type="button"
                          variant="outline"
                          className="flex flex-col items-center gap-2 h-auto py-3"
                          onClick={() => {
                            setEditingAgent({
                              ...editingAgent,
                              config: {
                                ...editingAgent.config,
                                temperature: preset.temperature,
                                maxTokens: preset.maxTokens,
                              }
                            });
                            toast.success(`Applied ${preset.name} preset`);
                          }}
                        >
                          <span className="text-2xl">{preset.icon}</span>
                          <div className="text-center">
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-muted-foreground">{preset.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature">Temperature: {editingAgent.config.temperature}%</Label>
                      <span className="text-xs text-muted-foreground">
                        {editingAgent.config.temperature < 30 ? 'Focused' : editingAgent.config.temperature > 70 ? 'Creative' : 'Balanced'}
                      </span>
                    </div>
                    <input type="hidden" name="temperature" value={editingAgent.config.temperature} />
                    <Slider
                      value={[editingAgent.config.temperature]}
                      onValueChange={([value]) => setEditingAgent({...editingAgent, config: {...editingAgent.config, temperature: value}})}
                      min={0}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness. Lower = more focused, Higher = more creative
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      name="maxTokens"
                      type="number"
                      min={100}
                      max={10000}
                      step={100}
                      value={editingAgent.config.maxTokens}
                      onChange={(e) => setEditingAgent({...editingAgent, config: {...editingAgent.config, maxTokens: Number(e.target.value)}})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum response length (100-10000)
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                    <Textarea
                      id="systemPrompt"
                      name="systemPrompt"
                      rows={4}
                      placeholder="Override the default system prompt..."
                      defaultValue={editingAgent.config.systemPrompt}
                    />
                    <p className="text-xs text-muted-foreground">
                      Custom instructions for how the agent should behave
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                    <Textarea
                      id="customInstructions"
                      name="customInstructions"
                      rows={3}
                      placeholder="Additional context or guidelines..."
                      defaultValue={editingAgent.config.customInstructions}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable or disable this configuration
                      </p>
                    </div>
                    <input type="hidden" name="isActive" value={editingAgent.config.isActive ? 'true' : 'false'} />
                    <Switch
                      id="isActive"
                      checked={editingAgent.config.isActive}
                      onCheckedChange={(checked) => setEditingAgent({...editingAgent, config: {...editingAgent.config, isActive: checked}})}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={upsertConfig.isPending}>
                    {upsertConfig.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Configuration
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Import Agent Configurations</DialogTitle>
              <DialogDescription>
                Preview and confirm the configurations to import
              </DialogDescription>
            </DialogHeader>
            
            {importData && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Source:</span> {importData.companyName || 'Unknown'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Exported:</span> {new Date(importData.exportedAt).toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Configurations:</span> {importData.configurations?.length || 0}
                  </div>
                </div>

                <div className="max-h-[300px] overflow-auto">
                  <div className="space-y-2">
                    {importData.configurations?.map((config: any) => (
                      <div key={config.agentType} className="border rounded-lg p-3">
                        <div className="font-medium capitalize">{config.agentType}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Temperature: {config.temperature}% • Max Tokens: {config.maxTokens}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="overwrite"
                    className="rounded border-input"
                  />
                  <Label htmlFor="overwrite" className="text-sm font-normal">
                    Overwrite existing configurations
                  </Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (importData && selectedCompany) {
                    const overwrite = (document.getElementById('overwrite') as HTMLInputElement)?.checked || false;
                    importConfigs.mutate({
                      companyId: Number(selectedCompany.id),
                      configurations: importData.configurations,
                      overwrite,
                    });
                  }
                }}
                disabled={importConfigs.isPending}
              >
                {importConfigs.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
