import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, FileText, Download, Filter, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';

export default function AuditLog() {
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
  });
  const [filtersActive, setFiltersActive] = useState(false);

  const { data, isLoading, refetch } = trpc.auditLog.list.useQuery(
    filtersActive ? filters : undefined
  );

  const logs = data?.logs || [];

  const handleApplyFilters = () => {
    if (!filters.action && !filters.entityType && !filters.startDate && !filters.endDate) {
      toast.error('Please select at least one filter');
      return;
    }
    setFiltersActive(true);
    refetch();
    toast.success('Filters applied');
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
    });
    setFiltersActive(false);
    refetch();
    toast.success('Filters cleared');
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.userName || 'Unknown',
      log.action,
      log.entityType,
      log.entityId || 'N/A',
      JSON.stringify(log.changes),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported successfully');
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'assign_user':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'remove_user':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'update_role':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'update_config':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground';
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
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-muted-foreground mt-1">
              Track all system changes and user actions
              {filtersActive && (
                <span className="ml-2 text-sm font-medium text-primary">
                  (Filtered)
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleExportCSV} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter audit logs by action, entity type, or date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select value={filters.action} onValueChange={(value) => setFilters({...filters, action: value === 'all' ? '' : value})}>
                  <SelectTrigger id="action">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="assign_user">Assign User</SelectItem>
                    <SelectItem value="remove_user">Remove User</SelectItem>
                    <SelectItem value="update_role">Update Role</SelectItem>
                    <SelectItem value="update_config">Update Config</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityType">Entity Type</Label>
                <Select value={filters.entityType} onValueChange={(value) => setFilters({...filters, entityType: value === 'all' ? '' : value})}>
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    <SelectItem value="user_company">User Company</SelectItem>
                    <SelectItem value="agent_config">Agent Config</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleApplyFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              {filtersActive && (
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Logs ({logs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.userName || 'Unknown'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.entityType}</div>
                            {log.entityId && (
                              <div className="text-muted-foreground">ID: {log.entityId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-primary hover:underline">
                              View changes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
