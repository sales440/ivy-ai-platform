import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Plus, Play, Pause, Copy, Trash2, Edit, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Agent {
  id: number;
  agentId: string;
  name: string;
  type: 'prospect' | 'closer' | 'solve' | 'logic' | 'talent' | 'insight';
  department: 'sales' | 'marketing' | 'customer_service' | 'operations' | 'hr' | 'strategy';
  status: 'idle' | 'active' | 'training' | 'error';
  capabilities: string[];
  kpis: Record<string, number>;
  configuration: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const agentTypeColors: Record<string, string> = {
  prospect: 'bg-blue-500',
  closer: 'bg-green-500',
  solve: 'bg-purple-500',
  logic: 'bg-orange-500',
  talent: 'bg-pink-500',
  insight: 'bg-cyan-500',
};

const statusColors: Record<string, string> = {
  idle: 'bg-gray-400',
  active: 'bg-green-500',
  training: 'bg-yellow-500',
  error: 'bg-red-500',
};

export default function AgentManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'prospect' as Agent['type'],
    department: 'sales' as Agent['department'],
    capabilities: [] as string[],
  });

  // Queries
  const { data, isLoading, refetch } = trpc.agentManagement.listAgents.useQuery({});
  const utils = trpc.useUtils();

  // Mutations
  const createMutation = trpc.agentManagement.createAgent.useMutation({
    onSuccess: () => {
      toast.success('Agent created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });

  const updateMutation = trpc.agentManagement.updateAgent.useMutation({
    onSuccess: () => {
      toast.success('Agent updated successfully');
      setIsEditDialogOpen(false);
      setSelectedAgent(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });

  const toggleStatusMutation = trpc.agentManagement.toggleAgentStatus.useMutation({
    onSuccess: (result) => {
      toast.success(`Agent ${result.newStatus === 'active' ? 'activated' : 'paused'}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to toggle agent status: ${error.message}`);
    },
  });

  const deleteMutation = trpc.agentManagement.deleteAgent.useMutation({
    onSuccess: () => {
      toast.success('Agent deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedAgent(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete agent: ${error.message}`);
    },
  });

  const cloneMutation = trpc.agentManagement.cloneAgent.useMutation({
    onSuccess: () => {
      toast.success('Agent cloned successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to clone agent: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'prospect',
      department: 'sales',
      capabilities: [],
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Agent name is required');
      return;
    }

    createMutation.mutate({
      agentId: `ivy-${formData.type}-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      department: formData.department,
      capabilities: formData.capabilities,
    });
  };

  const handleEdit = () => {
    if (!selectedAgent) return;

    updateMutation.mutate({
      id: selectedAgent.id,
      name: formData.name,
      type: formData.type,
      department: formData.department,
      capabilities: formData.capabilities,
    });
  };

  const handleToggleStatus = (agent: Agent) => {
    toggleStatusMutation.mutate({ id: agent.id });
  };

  const handleDelete = () => {
    if (!selectedAgent) return;
    deleteMutation.mutate({ id: selectedAgent.id });
  };

  const handleClone = (agent: Agent) => {
    const newName = prompt(`Enter name for cloned agent (original: ${agent.name}):`, `${agent.name} (Copy)`);
    if (!newName) return;

    cloneMutation.mutate({
      id: agent.id,
      newName,
    });
  };

  const openEditDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      type: agent.type,
      department: agent.department,
      capabilities: agent.capabilities,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const agents = data?.agents || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Management</h1>
            <p className="text-muted-foreground mt-2">
              Create, configure, and manage your Ivy.AI agents
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
                <DialogDescription>
                  Configure a new Ivy.AI agent for your organization
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Ivy-Prospect-Manufacturing"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Agent Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Agent['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Ivy-Prospect (Prospecting)</SelectItem>
                      <SelectItem value="closer">Ivy-Closer (Deal Closing)</SelectItem>
                      <SelectItem value="solve">Ivy-Solve (Problem Solving)</SelectItem>
                      <SelectItem value="logic">Ivy-Logic (Operations)</SelectItem>
                      <SelectItem value="talent">Ivy-Talent (HR)</SelectItem>
                      <SelectItem value="insight">Ivy-Insight (Strategy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value as Agent['department'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="customer_service">Customer Service</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="strategy">Strategy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Agent'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Idle</CardTitle>
              <Pause className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.status === 'idle').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.status === 'error').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${agentTypeColors[agent.type]}`} />
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {agent.department.replace('_', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={statusColors[agent.status]}>
                    {agent.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.slice(0, 3).map((cap, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{agent.capabilities.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(agent)}
                    disabled={toggleStatusMutation.isPending}
                  >
                    {agent.status === 'active' ? (
                      <><Pause className="h-3 w-3 mr-1" /> Pause</>
                    ) : (
                      <><Play className="h-3 w-3 mr-1" /> Activate</>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(agent)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClone(agent)}
                    disabled={cloneMutation.isPending}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDeleteDialog(agent)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update agent configuration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Agent Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Agent Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as Agent['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Ivy-Prospect</SelectItem>
                    <SelectItem value="closer">Ivy-Closer</SelectItem>
                    <SelectItem value="solve">Ivy-Solve</SelectItem>
                    <SelectItem value="logic">Ivy-Logic</SelectItem>
                    <SelectItem value="talent">Ivy-Talent</SelectItem>
                    <SelectItem value="insight">Ivy-Insight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as Agent['department'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Agent</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedAgent?.name}</strong>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Agent'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
