import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, CheckCircle2, XCircle, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Permission matrix for display
const PERMISSION_MATRIX = {
  viewer: {
    leads: ["read"],
    tickets: ["read"],
    agents: ["read"],
    workflows: ["read"],
    config: [],
    users: [],
  },
  analyst: {
    leads: ["read"],
    tickets: ["read", "update"],
    agents: ["read"],
    workflows: ["read"],
    config: [],
    users: [],
  },
  member: {
    leads: ["create", "read", "update"],
    tickets: ["create", "read", "update"],
    agents: ["read"],
    workflows: ["read", "create"],
    config: [],
    users: [],
  },
  manager: {
    leads: ["create", "read", "update", "delete"],
    tickets: ["create", "read", "update", "delete"],
    agents: ["read", "update"],
    workflows: ["create", "read", "update", "delete"],
    config: ["read", "update"],
    users: ["read"],
  },
  admin: {
    leads: ["create", "read", "update", "delete"],
    tickets: ["create", "read", "update", "delete"],
    agents: ["create", "read", "update", "delete"],
    workflows: ["create", "read", "update", "delete"],
    config: ["create", "read", "update", "delete"],
    users: ["create", "read", "update", "delete"],
  },
};

const ROLE_COLORS = {
  viewer: "bg-gray-500",
  analyst: "bg-blue-500",
  member: "bg-green-500",
  manager: "bg-purple-500",
  admin: "bg-red-500",
};

const ROLE_DESCRIPTIONS = {
  viewer: "Can only view data, no modifications allowed",
  analyst: "Can view and update tickets for analysis",
  member: "Can create and manage leads, tickets, and workflows",
  manager: "Full access to operations, can manage team workflows",
  admin: "Complete system access including user and configuration management",
};

export default function Permissions() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [showMatrixDialog, setShowMatrixDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<keyof typeof PERMISSION_MATRIX | null>(null);

  // Fetch user's companies
  const { data: companiesData } = trpc.userCompanies.myCompanies.useQuery();
  const companies = companiesData?.companies || [];

  // Fetch users for selected company
  const { data: usersData, refetch: refetchUsers } = trpc.userCompanies.getUsers.useQuery(
    { companyId: selectedCompanyId! },
    { enabled: !!selectedCompanyId }
  );

  // Update user role mutation
  const updateRoleMutation = trpc.userCompanies.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    if (!selectedCompanyId) return;
    
    updateRoleMutation.mutate({
      userId,
      companyId: selectedCompanyId,
      role: newRole as "viewer" | "member" | "admin",
    });
  };

  const handleViewMatrix = (role: keyof typeof PERMISSION_MATRIX) => {
    setSelectedRole(role);
    setShowMatrixDialog(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Permissions Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions for your companies
          </p>
        </div>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
          <CardDescription>Choose a company to manage user permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCompanyId?.toString() || ""}
            onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a company..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company: any) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users Table */}
      {selectedCompanyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users & Roles
            </CardTitle>
            <CardDescription>
              Manage user roles to control their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersData?.users && usersData.users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Change Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.users.map((user: any) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.userName}</TableCell>
                      <TableCell>{user.userEmail}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleRoleChange(user.userId, newRole)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="analyst">Analyst</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMatrix(user.role)}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          View Permissions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No users found for this company
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
          <CardDescription>Understanding different permission levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <div key={role} className="flex items-start gap-3 p-3 rounded-lg border">
              <Badge className={ROLE_COLORS[role as keyof typeof ROLE_COLORS]}>
                {role}
              </Badge>
              <p className="text-sm text-muted-foreground flex-1">{description}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewMatrix(role as keyof typeof PERMISSION_MATRIX)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Permission Matrix Dialog */}
      <Dialog open={showMatrixDialog} onOpenChange={setShowMatrixDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permission Matrix: {selectedRole?.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Detailed permissions for the {selectedRole} role
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead className="text-center">Create</TableHead>
                    <TableHead className="text-center">Read</TableHead>
                    <TableHead className="text-center">Update</TableHead>
                    <TableHead className="text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(PERMISSION_MATRIX[selectedRole]).map(([resource, actions]) => (
                    <TableRow key={resource}>
                      <TableCell className="font-medium capitalize">{resource}</TableCell>
                      <TableCell className="text-center">
                        {actions.includes("create" as any) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {actions.includes("read" as any) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {actions.includes("update" as any) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {actions.includes("delete" as any) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
