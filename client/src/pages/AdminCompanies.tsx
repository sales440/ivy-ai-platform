import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface CompanyFormData {
  name: string;
  slug: string;
  industry: string;
  plan: "starter" | "professional" | "enterprise";
  logo?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
}

const emptyForm: CompanyFormData = {
  name: "",
  slug: "",
  industry: "",
  plan: "starter",
  logo: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  isActive: true,
};

export default function AdminCompanies() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [formData, setFormData] = useState<CompanyFormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: companies = [], isLoading } = trpc.companies.list.useQuery();

  const createMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Company created successfully");
      setIsCreateOpen(false);
      setFormData(emptyForm);
      utils.companies.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create company");
    },
  });

  const updateMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      toast.success("Company updated successfully");
      setIsEditOpen(false);
      setSelectedCompany(null);
      utils.companies.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update company");
    },
  });

  const deleteMutation = trpc.companies.delete.useMutation({
    onSuccess: () => {
      toast.success("Company deleted successfully");
      setIsDeleteOpen(false);
      setSelectedCompany(null);
      utils.companies.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete company");
    },
  });

  const handleCreate = () => {
    // Generate slug from name if empty
    const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    createMutation.mutate({ ...formData, slug });
  };

  const handleEdit = () => {
    if (!selectedCompany) return;
    updateMutation.mutate({ id: selectedCompany.id, ...formData });
  };

  const handleDelete = () => {
    if (!selectedCompany) return;
    deleteMutation.mutate({ id: selectedCompany.id });
  };

  const openEditDialog = (company: any) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      slug: company.slug,
      industry: company.industry || "",
      plan: company.plan,
      logo: company.logo || "",
      website: company.website || "",
      contactEmail: company.contactEmail || "",
      contactPhone: company.contactPhone || "",
      address: company.address || "",
      isActive: company.isActive,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (company: any) => {
    setSelectedCompany(company);
    setIsDeleteOpen(true);
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      starter: "outline",
      professional: "secondary",
      enterprise: "default",
    };
    return <Badge variant={variants[plan] || "outline"}>{plan}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Company Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage client companies and their subscriptions
            </p>
          </div>
          <Button onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No companies yet</p>
            <Button onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Company
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company: any) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">{company.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>{company.industry || "-"}</TableCell>
                    <TableCell>{getPlanBadge(company.plan)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {company.contactEmail && <div>{company.contactEmail}</div>}
                        {company.contactPhone && <div className="text-muted-foreground">{company.contactPhone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.isActive ? "default" : "secondary"}>
                        {company.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(company)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Create a new client company profile
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="acme-corp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan *</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value: any) => setFormData({ ...formData, plan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.name}>
                {createMutation.isPending ? "Creating..." : "Create Company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
              <DialogDescription>
                Update company information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Company Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug *</Label>
                  <Input
                    id="edit-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-industry">Industry</Label>
                  <Input
                    id="edit-industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-plan">Plan *</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value: any) => setFormData({ ...formData, plan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contactEmail">Contact Email</Label>
                  <Input
                    id="edit-contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                  <Input
                    id="edit-contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending || !formData.name}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Company</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedCompany?.name}</strong>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Company"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
