# Permissions System Guide

## Overview

The platform includes a granular permissions system with 5 roles:
- **viewer**: Read-only access to leads, tickets, agents, workflows
- **analyst**: Can update tickets, read everything else
- **member**: Can create/update leads, tickets, workflows
- **manager**: Full CRUD on leads, tickets, workflows; can update agents and config
- **admin**: Full CRUD on all resources

## Permission Matrix

See `server/_core/permissions.ts` for the complete matrix.

## How to Apply Permissions

### Option 1: Use requirePermission Middleware

```typescript
import { requirePermission } from "./_core/trpc";

// Example: Protect create lead endpoint
leads: router({
  create: protectedProcedure
    .use(requirePermission("leads", "create"))
    .input(z.object({
      companyId: z.number(),
      name: z.string(),
      // ... other fields
    }))
    .mutation(async ({ input }) => {
      // Only users with "create" permission on "leads" can execute this
      return await db.createLead(input);
    }),
    
  delete: protectedProcedure
    .use(requirePermission("leads", "delete"))
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .mutation(async ({ input }) => {
      // Only managers and admins can delete leads
      return await db.deleteLead(input.id);
    }),
}),
```

### Option 2: Manual Permission Check

```typescript
import { hasPermission } from "./_core/permissions";
import { getUserCompanyRole } from "./db";

// Inside a procedure
const userRole = await getUserCompanyRole(ctx.user.id, input.companyId);
if (!hasPermission(userRole, "leads", "update")) {
  throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
}
```

## Frontend Permission Checks

```typescript
import { useAuth } from "@/_core/hooks/useAuth";
import { useCompany } from "@/contexts/CompanyContext";

function LeadsPage() {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  
  // Get user's role in selected company
  const { data: userCompany } = trpc.userCompanies.myCompanies.useQuery();
  const role = userCompany?.companies.find(c => c.id === selectedCompany?.id)?.role;
  
  // Show/hide UI based on permissions
  const canCreateLeads = role && ["member", "manager", "admin"].includes(role);
  const canDeleteLeads = role && ["manager", "admin"].includes(role);
  
  return (
    <div>
      {canCreateLeads && <Button onClick={handleCreate}>Create Lead</Button>}
      {canDeleteLeads && <Button onClick={handleDelete}>Delete</Button>}
    </div>
  );
}
```

## Next Steps

1. Update all endpoints in `server/routers.ts` to use `requirePermission`
2. Add permission checks in frontend components
3. Create `/admin/roles` page to visualize and manage permissions
