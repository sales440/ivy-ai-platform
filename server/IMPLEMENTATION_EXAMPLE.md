# Implementation Example: Protected Endpoints with Permissions

## Current State

The platform has:
- ✅ Permission matrix defined (`server/_core/permissions.ts`)
- ✅ `requirePermission` middleware (`server/_core/trpc.ts`)
- ✅ `getUserCompanyRole` function (`server/db.ts`)
- ✅ 5 roles with granular CRUD permissions

## Example: Protected Leads Endpoint

### Before (Current)
```typescript
leads: router({
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().optional(),
      company: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createLead(input);
    }),
}),
```

### After (With Permissions)
```typescript
import { requirePermission } from "./_core/trpc";

leads: router({
  create: protectedProcedure
    .use(requirePermission("leads", "create"))
    .input(z.object({
      companyId: z.number(), // REQUIRED for permission check
      name: z.string(),
      email: z.string().optional(),
      company: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // ctx.companyRole is now available (set by requirePermission middleware)
      // Only users with "create" permission on "leads" can reach here
      return await db.createLead({
        ...input,
        companyId: input.companyId,
      });
    }),
    
  delete: protectedProcedure
    .use(requirePermission("leads", "delete"))
    .input(z.object({
      companyId: z.number(),
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      // Only managers and admins can delete leads
      return await db.deleteLead(input.id);
    }),
    
  list: protectedProcedure
    .use(requirePermission("leads", "read"))
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input }) => {
      // All roles can read leads (see permissions matrix)
      return await db.getAllLeads(input.companyId);
    }),
}),
```

## Frontend Changes Required

### Before
```typescript
const createLead = trpc.leads.create.useMutation();

// Call without companyId
createLead.mutate({
  name: "John Doe",
  email: "john@example.com",
});
```

### After
```typescript
import { useCompany } from "@/contexts/CompanyContext";

function LeadsPage() {
  const { selectedCompany } = useCompany();
  const createLead = trpc.leads.create.useMutation();

  // Call with companyId
  createLead.mutate({
    companyId: selectedCompany!.id,
    name: "John Doe",
    email: "john@example.com",
  });
}
```

## Migration Steps

1. **Update endpoint input schemas** to require `companyId`
2. **Add `.use(requirePermission(...))` middleware** to each mutation/query
3. **Update frontend calls** to pass `companyId` from `useCompany` hook
4. **Update database functions** to filter by `companyId`
5. **Test with different roles** (viewer, analyst, member, manager, admin)

## Endpoints to Protect

### High Priority
- `leads.create` → requirePermission("leads", "create")
- `leads.delete` → requirePermission("leads", "delete")
- `tickets.create` → requirePermission("tickets", "create")
- `tickets.update` → requirePermission("tickets", "update")
- `agentConfig.upsert` → requirePermission("config", "update")

### Medium Priority
- `workflows.create` → requirePermission("workflows", "create")
- `workflows.delete` → requirePermission("workflows", "delete")
- `agents.update` → requirePermission("agents", "update")

### Low Priority (Read-only, all roles have access)
- `leads.list` → requirePermission("leads", "read")
- `tickets.list` → requirePermission("tickets", "read")
- `agents.list` → requirePermission("agents", "read")

## Testing Permissions

```typescript
// Test as viewer (read-only)
const viewerRole = await getUserCompanyRole(viewerUserId, companyId);
console.log(hasPermission(viewerRole, "leads", "create")); // false
console.log(hasPermission(viewerRole, "leads", "read")); // true

// Test as manager (full CRUD)
const managerRole = await getUserCompanyRole(managerUserId, companyId);
console.log(hasPermission(managerRole, "leads", "create")); // true
console.log(hasPermission(managerRole, "leads", "delete")); // true
```

## Next Steps

1. Start with leads router (highest business impact)
2. Apply to tickets router
3. Apply to agentConfig router
4. Update all frontend pages to pass companyId
5. Add permission-based UI hiding (show/hide buttons based on role)
