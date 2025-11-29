import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Building2, TrendingUp, TrendingDown, Download, BarChart3, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompanyReports() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const { data: companies = [], isLoading: companiesLoading } = trpc.companies.list.useQuery();

  // Fetch metrics for all companies
  const companyMetrics = companies.map(company => {
    const { data } = trpc.analytics.companyMetrics.useQuery({
      companyId: company.id,
      startDate: dateFilterActive && startDate ? startDate : undefined,
      endDate: dateFilterActive && endDate ? endDate : undefined,
    });
    return { company, metrics: data };
  });

  const isLoading = companiesLoading || companyMetrics.some(cm => !cm.metrics);

  // Calculate totals
  const totals = companyMetrics.reduce((acc, cm) => {
    if (!cm.metrics) return acc;
    return {
      leads: acc.leads + cm.metrics.totalLeads,
      tickets: acc.tickets + cm.metrics.totalTickets,
      agents: acc.agents + cm.metrics.totalAgents,
      activeAgents: acc.activeAgents + cm.metrics.activeAgents,
    };
  }, { leads: 0, tickets: 0, agents: 0, activeAgents: 0 });

  const handleExportReport = () => {
    // Create CSV content
    const headers = ['Company', 'Industry', 'Plan', 'Total Leads', 'Qualified Leads', 'Converted Leads', 'Conversion Rate', 'Total Tickets', 'Open Tickets', 'Resolved Tickets', 'Resolution Rate', 'Total Agents', 'Active Agents'];
    const rows = companyMetrics
      .filter(cm => cm.metrics)
      .map(cm => [
        cm.company.name,
        cm.company.industry || 'N/A',
        cm.company.plan,
        cm.metrics!.totalLeads,
        cm.metrics!.qualifiedLeads,
        cm.metrics!.convertedLeads,
        `${cm.metrics!.conversionRate}%`,
        cm.metrics!.totalTickets,
        cm.metrics!.openTickets,
        cm.metrics!.resolvedTickets,
        `${cm.metrics!.resolutionRate}%`,
        cm.metrics!.totalAgents,
        cm.metrics!.activeAgents,
      ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `company-reports-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  const handleApplyFilters = () => {
    if (!startDate && !endDate) {
      toast.error('Please select at least one date');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }
    setDateFilterActive(true);
    toast.success('Date filters applied');
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setDateFilterActive(false);
    toast.success('Filters cleared');
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'professional': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'starter': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
            <h1 className="text-3xl font-bold">Company Reports</h1>
            <p className="text-muted-foreground mt-1">
              Comparative analytics across all companies
              {dateFilterActive && (
                <span className="ml-2 text-sm font-medium text-primary">
                  ({startDate || 'Start'} → {endDate || 'End'})
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Date Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
            <CardDescription>
              Filter metrics by date range to analyze trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                {dateFilterActive && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground">
                Active organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.leads}</div>
              <p className="text-xs text-muted-foreground">
                Across all companies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.tickets}</div>
              <p className="text-xs text-muted-foreground">
                Support requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.activeAgents}/{totals.agents}</div>
              <p className="text-xs text-muted-foreground">
                Operational agents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Comparative Table */}
        <Card>
          <CardHeader>
            <CardTitle>Company Performance Comparison</CardTitle>
            <CardDescription>
              Key metrics and KPIs across all companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Resolution</TableHead>
                    <TableHead className="text-right">Agents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyMetrics
                    .filter(cm => cm.metrics)
                    .sort((a, b) => b.metrics!.totalLeads - a.metrics!.totalLeads)
                    .map(({ company, metrics }) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">{company.industry || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPlanColor(company.plan)}>
                            {company.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">{metrics!.totalLeads}</div>
                            <div className="text-xs text-muted-foreground">
                              {metrics!.qualifiedLeads} qualified
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {metrics!.conversionRate > 50 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={metrics!.conversionRate > 50 ? 'text-green-600' : 'text-red-600'}>
                              {metrics!.conversionRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">{metrics!.totalTickets}</div>
                            <div className="text-xs text-muted-foreground">
                              {metrics!.openTickets} open
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {metrics!.resolutionRate > 70 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={metrics!.resolutionRate > 70 ? 'text-green-600' : 'text-red-600'}>
                              {metrics!.resolutionRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="font-medium">{metrics!.activeAgents}/{metrics!.totalAgents}</div>
                            <div className="text-xs text-muted-foreground">
                              {metrics!.inactiveAgents} idle
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top by Leads</CardTitle>
              <CardDescription>Companies with most leads generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companyMetrics
                  .filter(cm => cm.metrics)
                  .sort((a, b) => b.metrics!.totalLeads - a.metrics!.totalLeads)
                  .slice(0, 5)
                  .map(({ company, metrics }, index) => (
                    <div key={company.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-xs text-muted-foreground">{company.industry}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{metrics!.totalLeads}</div>
                        <div className="text-xs text-muted-foreground">{metrics!.conversionRate}% conv.</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top by Conversion</CardTitle>
              <CardDescription>Highest lead-to-customer conversion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companyMetrics
                  .filter(cm => cm.metrics && cm.metrics.totalLeads > 0)
                  .sort((a, b) => b.metrics!.conversionRate - a.metrics!.conversionRate)
                  .slice(0, 5)
                  .map(({ company, metrics }, index) => (
                    <div key={company.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-sm font-medium text-green-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-xs text-muted-foreground">{company.industry}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">{metrics!.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">{metrics!.convertedLeads} converted</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
