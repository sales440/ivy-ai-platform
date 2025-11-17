import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Search, TrendingUp, Users, DollarSign, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState<{
    status?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [showExportFilters, setShowExportFilters] = useState(false);

  const { selectedCompany } = useCompany();
  const { data: leadsData, isLoading, refetch } = trpc.leads.list.useQuery(
    selectedCompany ? { companyId: selectedCompany.id } : undefined
  );
  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success('Lead created successfully');
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create lead: ${error.message}`);
    }
  });

  const exportLeads = trpc.export.leads.useQuery(
    exportFilters.status || exportFilters.startDate || exportFilters.endDate
      ? exportFilters as any
      : undefined,
    { enabled: false }
  );

  const handleExportCSV = async () => {
    try {
      const result = await exportLeads.refetch();
      if (result.data) {
        const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', result.data.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${result.data.count} leads to CSV`);
        setShowExportFilters(false);
      }
    } catch (error) {
      toast.error('Failed to export leads');
    }
  };
  
  const handleExportWithFilters = () => {
    setShowExportFilters(true);
  };

  // Qualify lead functionality (to be implemented)
  const handleQualifyLead = (leadId: number) => {
    toast.info('Qualify functionality coming soon');
  };

  const leads = leadsData?.leads || [];

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
  const avgScore = leads.length > 0 
    ? (leads.reduce((sum, l) => sum + (l.qualificationScore || 0), 0) / leads.length).toFixed(1)
    : '0';

  const handleCreateLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createLead.mutate({
      name: formData.get('contactName') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,

    });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'contacted': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'qualified': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'converted': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'lost': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <p className="text-muted-foreground mt-1">
            Powered by Ivy-Prospect
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showExportFilters} onOpenChange={setShowExportFilters}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Leads to CSV</DialogTitle>
                <DialogDescription>
                  Apply filters to export specific leads
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select
                    value={exportFilters.status || 'all'}
                    onValueChange={(value) =>
                      setExportFilters({ ...exportFilters, status: value === 'all' ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="nurture">Nurture</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={exportFilters.startDate || ''}
                    onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={exportFilters.endDate || ''}
                    onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportFilters(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExportCSV} disabled={exportLeads.isFetching}>
                  {exportLeads.isFetching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateLead}>
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription>
                  Add a new lead to the pipeline. Ivy-Prospect will automatically qualify it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input id="company" name="company" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input id="contactName" name="contactName" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select name="source" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createLead.isPending}>
                  {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              In pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Ready for sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground">
              Lead quality
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Manage and qualify your sales leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No leads found. Create your first lead to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.company}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(lead.qualificationScore || 0)}>{lead.qualificationScore || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {lead.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQualifyLead(lead.id!)}
                          >
                            Qualify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
