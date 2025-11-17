import { useState } from 'react';
import { trpc } from '@/lib/trpc';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Search, Building2, Users, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

export default function UserCompanies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  const { data: assignmentsData, isLoading, refetch } = trpc.userCompanies.listAll.useQuery();
  const { data: companiesData } = trpc.companies.list.useQuery();
  const { data: usersData } = trpc.userCompanies.allUsers.useQuery();

  const assignUser = trpc.userCompanies.assign.useMutation({
    onSuccess: () => {
      toast.success('User assigned to company successfully');
      setIsAssignDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to assign user: ${error.message}`);
    }
  });

  const updateRole = trpc.userCompanies.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated successfully');
      setEditingAssignment(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  const removeAssignment = trpc.userCompanies.remove.useMutation({
    onSuccess: () => {
      toast.success('Assignment removed successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove assignment: ${error.message}`);
    }
  });

  const assignments = assignmentsData?.assignments || [];
  const companies = companiesData?.companies || [];
  const users = usersData?.users || [];

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const user = users.find(u => u.id === assignment.userId);
    const company = companies.find(c => c.id === assignment.companyId);
    
    const matchesSearch = 
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === 'all' || assignment.companyId === Number(companyFilter);
    
    return matchesSearch && matchesCompany;
  });

  const handleAssignUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    assignUser.mutate({
      userId: Number(formData.get('userId')),
      companyId: Number(formData.get('companyId')),
      role: formData.get('role') as 'viewer' | 'member' | 'admin',
    });
  };

  const handleUpdateRole = (assignmentId: number, newRole: 'viewer' | 'member' | 'admin') => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    updateRole.mutate({
      userId: assignment.userId,
      companyId: assignment.companyId,
      role: newRole,
    });
  };

  const handleRemoveAssignment = (assignment: any) => {
    if (confirm(`Remove ${users.find(u => u.id === assignment.userId)?.name} from ${companies.find(c => c.id === assignment.companyId)?.name}?`)) {
      removeAssignment.mutate({
        userId: assignment.userId,
        companyId: assignment.companyId,
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'member': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'viewer': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
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
            <h1 className="text-3xl font-bold">User-Company Assignments</h1>
            <p className="text-muted-foreground mt-1">
              Manage which users have access to which companies
            </p>
          </div>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAssignUser}>
                <DialogHeader>
                  <DialogTitle>Assign User to Company</DialogTitle>
                  <DialogDescription>
                    Grant a user access to a specific company with a defined role
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userId">User *</Label>
                    <Select name="userId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="companyId">Company *</Label>
                    <Select name="companyId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select name="role" required defaultValue="member">
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                        <SelectItem value="member">Member - Full access</SelectItem>
                        <SelectItem value="admin">Admin - Full access + management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={assignUser.isPending}>
                    {assignUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Assign User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-xs text-muted-foreground">
                User-company relationships
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies.length}</div>
              <p className="text-xs text-muted-foreground">
                With assigned users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                In the system
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>
              View and manage user-company assignments and roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users or companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[200px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No assignments found. Assign users to companies to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssignments.map((assignment) => {
                      const user = users.find(u => u.id === assignment.userId);
                      const company = companies.find(c => c.id === assignment.companyId);
                      
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{user?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{company?.name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingAssignment?.id === assignment.id ? (
                              <Select
                                value={editingAssignment.role}
                                onValueChange={(value) => {
                                  handleUpdateRole(assignment.id, value as any);
                                }}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline" className={getRoleBadgeColor(assignment.role)}>
                                {assignment.role}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingAssignment(assignment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(assignment)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
