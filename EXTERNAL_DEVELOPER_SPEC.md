# Ivy.AI Platform - External Developer Specification
## Advanced Features Implementation Guide

**Document Version:** 1.0  
**Last Updated:** November 16, 2025  
**Project:** Ivy.AI - Intelligent Agent Orchestration System  
**Target Audience:** External TypeScript/React Developers  

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Environment Setup](#development-environment-setup)
4. [Architecture Guidelines](#architecture-guidelines)
5. [Feature Specifications](#feature-specifications)
6. [Code Examples](#code-examples)
7. [Testing Requirements](#testing-requirements)
8. [Integration Checklist](#integration-checklist)
9. [Submission Guidelines](#submission-guidelines)

---

## Project Overview

Ivy.AI is an intelligent agent orchestration platform built with modern web technologies. The platform manages AI agents across multiple departments (Sales, Customer Service, Operations, HR, Strategy) and handles leads, support tickets, and inter-agent communications.

**Current Status:**
- ✅ Core dashboard with 6 AI agents
- ✅ Lead management system (Ivy-Prospect)
- ✅ Ticket management system (Ivy-Solve)
- ✅ Real-time notifications
- ✅ User preferences persistence
- ✅ CSV export with advanced filters

**Your Mission:**
Implement 20 high-impact features following the existing architecture, coding standards, and design patterns.

---

## Technology Stack

### Frontend
- **Framework:** React 19
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Routing:** Wouter
- **State Management:** TanStack Query (React Query) via tRPC
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Date Handling:** date-fns

### Backend
- **Runtime:** Node.js 22.x
- **Framework:** Express 4
- **API Layer:** tRPC 11 (type-safe RPC)
- **Database ORM:** Drizzle ORM
- **Database:** MySQL/TiDB (provided via Railway)
- **Authentication:** Manus OAuth (pre-configured)
- **Serialization:** Superjson (handles Date objects automatically)

### Development Tools
- **Package Manager:** pnpm
- **TypeScript:** 5.x (strict mode enabled)
- **Build Tool:** Vite
- **Linting:** ESLint
- **Testing:** Vitest (required for all features)

---

## Development Environment Setup

### Prerequisites
```bash
# Required versions
node >= 22.0.0
pnpm >= 8.0.0
```

### Initial Setup
```bash
# Clone the repository (will be provided)
git clone <repository-url>
cd ivy-ai-platform

# Install dependencies
pnpm install

# Set up environment variables (will be provided separately)
cp .env.example .env

# Push database schema
pnpm db:push

# Seed demo data
pnpm seed:demo

# Start development server
pnpm dev
```

### Project Structure
```
ivy-ai-platform/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # React contexts
│   │   ├── lib/             # Utilities and tRPC client
│   │   └── const.ts         # Shared constants
│   └── public/              # Static assets
├── server/                   # Backend Express + tRPC
│   ├── routers.ts           # Main tRPC router
│   ├── db.ts                # Database query helpers
│   ├── _core/               # Framework code (DO NOT MODIFY)
│   └── routers/             # Feature-specific routers
├── drizzle/                 # Database schema and migrations
│   └── schema.ts            # Drizzle schema definitions
├── shared/                  # Shared types and constants
└── scripts/                 # Utility scripts
```

---

## Architecture Guidelines

### 1. Database-First Approach

**Always start with schema changes:**

```typescript
// drizzle/schema.ts
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  permissions: text("permissions").notNull(), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
```

**Then push schema:**
```bash
pnpm db:push
```

### 2. Database Query Layer

**Add query helpers in `server/db.ts`:**

```typescript
// server/db.ts
import { roles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function getAllRoles() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(roles);
}

export async function getRoleById(roleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  return result[0];
}

export async function createRole(role: InsertRole) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(roles).values(role);
  return result.insertId;
}
```

### 3. tRPC Router Layer

**Create feature routers in `server/routers.ts`:**

```typescript
// server/routers.ts
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // ... existing routers
  
  roles: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllRoles();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getRoleById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(50),
        description: z.string().optional(),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const roleId = await db.createRole({
          name: input.name,
          description: input.description,
          permissions: JSON.stringify(input.permissions),
        });
        return { id: roleId };
      }),
  }),
});
```

### 4. Frontend Integration

**Use tRPC hooks in React components:**

```typescript
// client/src/pages/RolesManagement.tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function RolesManagement() {
  const { data: roles, isLoading } = trpc.roles.list.useQuery();
  const createRole = trpc.roles.create.useMutation({
    onSuccess: () => {
      // Invalidate cache to refetch
      trpc.useUtils().roles.list.invalidate();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Roles Management</h1>
      {roles?.map(role => (
        <div key={role.id}>{role.name}</div>
      ))}
      <Button onClick={() => createRole.mutate({
        name: "Sales Manager",
        permissions: ["view_leads", "edit_leads"],
      })}>
        Create Role
      </Button>
    </div>
  );
}
```

### 5. Design Patterns to Follow

**✅ DO:**
- Use `protectedProcedure` for authenticated endpoints
- Use `publicProcedure` only for public data
- Validate all inputs with Zod schemas
- Return raw Drizzle results (Superjson handles serialization)
- Use optimistic updates for instant UI feedback
- Handle loading/error states in components
- Use shadcn/ui components for consistency
- Follow existing naming conventions (camelCase for variables, PascalCase for components)

**❌ DON'T:**
- Modify files in `server/_core/` directory
- Use `any` type (strict TypeScript required)
- Create REST endpoints (use tRPC only)
- Store sensitive data in localStorage
- Hardcode API keys or secrets
- Use inline styles (use Tailwind classes)
- Create duplicate components (check existing ones first)

---

## Feature Specifications

### Feature 1: Role-Based Access Control (RBAC)

**Priority:** HIGH  
**Estimated Effort:** 8-10 hours  
**Dependencies:** None

#### Requirements

Implement a granular permission system that extends beyond the current `admin`/`user` roles. The system must support custom roles with specific permissions for different resources.

#### Database Schema

```typescript
// drizzle/schema.ts

export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  permissions: text("permissions").notNull(), // JSON array of permission strings
  isSystem: int("isSystem", { mode: 'boolean' }).default(false).notNull(), // Prevent deletion of system roles
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userRoles = mysqlTable("userRoles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedBy: int("assignedBy"), // Admin user who assigned the role
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
```

#### Permissions List

```typescript
// shared/permissions.ts

export const PERMISSIONS = {
  // Leads
  LEADS_VIEW: 'leads:view',
  LEADS_CREATE: 'leads:create',
  LEADS_EDIT: 'leads:edit',
  LEADS_DELETE: 'leads:delete',
  LEADS_EXPORT: 'leads:export',
  LEADS_ASSIGN: 'leads:assign',
  
  // Tickets
  TICKETS_VIEW: 'tickets:view',
  TICKETS_CREATE: 'tickets:create',
  TICKETS_EDIT: 'tickets:edit',
  TICKETS_DELETE: 'tickets:delete',
  TICKETS_EXPORT: 'tickets:export',
  TICKETS_ASSIGN: 'tickets:assign',
  TICKETS_RESOLVE: 'tickets:resolve',
  
  // Agents
  AGENTS_VIEW: 'agents:view',
  AGENTS_CONFIGURE: 'agents:configure',
  AGENTS_START_STOP: 'agents:start_stop',
  
  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_ASSIGN_ROLES: 'users:assign_roles',
  
  // Roles
  ROLES_VIEW: 'roles:view',
  ROLES_CREATE: 'roles:create',
  ROLES_EDIT: 'roles:edit',
  ROLES_DELETE: 'roles:delete',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // System
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_AUDIT_LOG: 'system:audit_log',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Predefined role templates
export const ROLE_TEMPLATES = {
  SALES_MANAGER: {
    name: 'Sales Manager',
    permissions: [
      PERMISSIONS.LEADS_VIEW,
      PERMISSIONS.LEADS_CREATE,
      PERMISSIONS.LEADS_EDIT,
      PERMISSIONS.LEADS_EXPORT,
      PERMISSIONS.LEADS_ASSIGN,
      PERMISSIONS.ANALYTICS_VIEW,
    ],
  },
  SUPPORT_AGENT: {
    name: 'Support Agent',
    permissions: [
      PERMISSIONS.TICKETS_VIEW,
      PERMISSIONS.TICKETS_CREATE,
      PERMISSIONS.TICKETS_EDIT,
      PERMISSIONS.TICKETS_RESOLVE,
    ],
  },
  ANALYST: {
    name: 'Analyst',
    permissions: [
      PERMISSIONS.LEADS_VIEW,
      PERMISSIONS.TICKETS_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_EXPORT,
    ],
  },
};
```

#### Backend Implementation

```typescript
// server/db.ts - Add these functions

export async function getUserPermissions(userId: number): Promise<Permission[]> {
  const db = await getDb();
  if (!db) return [];
  
  const userRolesData = await db
    .select({ permissions: roles.permissions })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  
  const allPermissions = userRolesData.flatMap(ur => 
    JSON.parse(ur.permissions) as Permission[]
  );
  
  return [...new Set(allPermissions)]; // Remove duplicates
}

export async function hasPermission(userId: number, permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function assignRoleToUser(userId: number, roleId: number, assignedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(userRoles).values({
    userId,
    roleId,
    assignedBy,
  });
}
```

```typescript
// server/routers.ts - Add roles router

import { PERMISSIONS } from "../shared/permissions";

// Create a permission check middleware
const requirePermission = (permission: Permission) => 
  protectedProcedure.use(async ({ ctx, next }) => {
    const hasAccess = await db.hasPermission(ctx.user.id, permission);
    if (!hasAccess) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    return next({ ctx });
  });

export const appRouter = router({
  // ... existing routers
  
  roles: router({
    list: requirePermission(PERMISSIONS.ROLES_VIEW).query(async () => {
      return await db.getAllRoles();
    }),
    
    create: requirePermission(PERMISSIONS.ROLES_CREATE)
      .input(z.object({
        name: z.string().min(1).max(50),
        description: z.string().optional(),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const roleId = await db.createRole({
          name: input.name,
          description: input.description,
          permissions: JSON.stringify(input.permissions),
          isSystem: false,
        });
        return { id: roleId };
      }),
    
    assignToUser: requirePermission(PERMISSIONS.USERS_ASSIGN_ROLES)
      .input(z.object({
        userId: z.number(),
        roleId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.assignRoleToUser(input.userId, input.roleId, ctx.user.id);
        return { success: true };
      }),
  }),
  
  users: router({
    list: requirePermission(PERMISSIONS.USERS_VIEW).query(async () => {
      return await db.getAllUsers();
    }),
    
    getPermissions: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const userId = input.userId ?? ctx.user.id;
        return await db.getUserPermissions(userId);
      }),
  }),
});
```

#### Frontend Implementation

```typescript
// client/src/hooks/usePermissions.ts

import { trpc } from "@/lib/trpc";
import { Permission } from "@shared/permissions";

export function usePermissions() {
  const { data: permissions = [], isLoading } = trpc.users.getPermissions.useQuery({});
  
  const hasPermission = (permission: Permission) => {
    return permissions.includes(permission);
  };
  
  const hasAnyPermission = (perms: Permission[]) => {
    return perms.some(p => permissions.includes(p));
  };
  
  const hasAllPermissions = (perms: Permission[]) => {
    return perms.every(p => permissions.includes(p));
  };
  
  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
```

```typescript
// client/src/components/PermissionGate.tsx

import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@shared/permissions";

interface PermissionGateProps {
  permission: Permission | Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();
  
  if (isLoading) return null;
  
  const hasAccess = Array.isArray(permission) 
    ? hasAnyPermission(permission)
    : hasPermission(permission);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

```typescript
// client/src/pages/RolesManagement.tsx

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSIONS, ROLE_TEMPLATES } from "@shared/permissions";
import { toast } from "sonner";

export default function RolesManagement() {
  const { data: roles, isLoading } = trpc.roles.list.useQuery();
  const createRole = trpc.roles.create.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      trpc.useUtils().roles.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });
  
  const handlePermissionToggle = (permission: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };
  
  const handleSubmit = () => {
    createRole.mutate(newRole);
  };
  
  if (isLoading) return <div>Loading roles...</div>;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Roles Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Existing Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles?.map(role => (
                <div key={role.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{role.name}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <div className="mt-2">
                    <span className="text-xs">
                      {JSON.parse(role.permissions).length} permissions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Create New Role */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              
              <div>
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Role description"
                />
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                  {Object.entries(PERMISSIONS).map(([key, value]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={value}
                        checked={newRole.permissions.includes(value)}
                        onCheckedChange={() => handlePermissionToggle(value)}
                      />
                      <label htmlFor={value} className="text-sm cursor-pointer">
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={handleSubmit} 
                disabled={!newRole.name || newRole.permissions.length === 0}
                className="w-full"
              >
                Create Role
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Usage Example in Protected Routes

```typescript
// client/src/pages/Leads.tsx - Add permission check

import { PermissionGate } from "@/components/PermissionGate";
import { PERMISSIONS } from "@shared/permissions";

export default function Leads() {
  return (
    <div>
      <h1>Leads Management</h1>
      
      <PermissionGate permission={PERMISSIONS.LEADS_CREATE}>
        <Button>New Lead</Button>
      </PermissionGate>
      
      <PermissionGate 
        permission={PERMISSIONS.LEADS_EXPORT}
        fallback={<span className="text-muted-foreground">Export not available</span>}
      >
        <Button>Export CSV</Button>
      </PermissionGate>
      
      {/* Rest of component */}
    </div>
  );
}
```

#### Testing Requirements

```typescript
// server/__tests__/rbac.test.ts

import { describe, it, expect } from 'vitest';
import * as db from '../db';
import { PERMISSIONS } from '../../shared/permissions';

describe('RBAC System', () => {
  it('should assign role to user', async () => {
    const roleId = await db.createRole({
      name: 'Test Role',
      permissions: JSON.stringify([PERMISSIONS.LEADS_VIEW]),
      isSystem: false,
    });
    
    await db.assignRoleToUser(1, roleId, 1);
    const permissions = await db.getUserPermissions(1);
    
    expect(permissions).toContain(PERMISSIONS.LEADS_VIEW);
  });
  
  it('should check user permissions correctly', async () => {
    const hasAccess = await db.hasPermission(1, PERMISSIONS.LEADS_VIEW);
    expect(hasAccess).toBe(true);
  });
  
  it('should prevent access without permission', async () => {
    const hasAccess = await db.hasPermission(1, PERMISSIONS.SYSTEM_SETTINGS);
    expect(hasAccess).toBe(false);
  });
});
```

#### Acceptance Criteria

- ✅ Admin can create custom roles with specific permissions
- ✅ Admin can assign multiple roles to users
- ✅ Users can only access features they have permissions for
- ✅ Permission checks work on both frontend (UI) and backend (API)
- ✅ System roles (admin, user) cannot be deleted
- ✅ Permission changes take effect immediately without re-login
- ✅ Audit log records role assignments (see Feature 5)

---

### Feature 2: CRM Integration (Salesforce/HubSpot)

**Priority:** HIGH  
**Estimated Effort:** 12-16 hours  
**Dependencies:** Feature 1 (RBAC for integration settings)

#### Requirements

Implement bidirectional synchronization with external CRM systems. Support Salesforce and HubSpot initially, with extensible architecture for additional CRMs.

#### Database Schema

```typescript
// drizzle/schema.ts

export const crmIntegrations = mysqlTable("crmIntegrations", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["salesforce", "hubspot", "pipedrive"]).notNull(),
  isActive: int("isActive", { mode: 'boolean' }).default(true).notNull(),
  credentials: text("credentials").notNull(), // Encrypted JSON
  syncSettings: text("syncSettings").notNull(), // JSON configuration
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const crmSyncLogs = mysqlTable("crmSyncLogs", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(), // "lead", "contact", "company"
  entityId: int("entityId").notNull(), // Local ID
  externalId: varchar("externalId", { length: 255 }), // CRM ID
  status: mysqlEnum("status", ["success", "failed", "pending"]).notNull(),
  errorMessage: text("errorMessage"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export type CrmIntegration = typeof crmIntegrations.$inferSelect;
export type CrmSyncLog = typeof crmSyncLogs.$inferSelect;
```

#### CRM Service Architecture

```typescript
// server/services/crm/types.ts

export interface CrmProvider {
  name: string;
  authenticate(credentials: CrmCredentials): Promise<boolean>;
  syncLeads(direction: 'inbound' | 'outbound', lastSyncAt?: Date): Promise<SyncResult>;
  syncContacts(direction: 'inbound' | 'outbound', lastSyncAt?: Date): Promise<SyncResult>;
  createLead(lead: Lead): Promise<string>; // Returns external ID
  updateLead(externalId: string, lead: Partial<Lead>): Promise<void>;
}

export interface CrmCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface CrmLead {
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone?: string;
  source?: string;
  status?: string;
  customFields?: Record<string, any>;
}
```

```typescript
// server/services/crm/salesforce.ts

import axios from 'axios';
import { CrmProvider, CrmCredentials, SyncResult, CrmLead } from './types';
import { Lead } from '../../drizzle/schema';

export class SalesforceProvider implements CrmProvider {
  name = 'salesforce';
  private credentials: CrmCredentials;
  private instanceUrl: string;
  
  constructor(credentials: CrmCredentials) {
    this.credentials = credentials;
    this.instanceUrl = credentials.instanceUrl || '';
  }
  
  async authenticate(credentials: CrmCredentials): Promise<boolean> {
    try {
      const response = await axios.post(
        `${credentials.instanceUrl}/services/oauth2/token`,
        {
          grant_type: 'refresh_token',
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          refresh_token: credentials.refreshToken,
        }
      );
      
      this.credentials.accessToken = response.data.access_token;
      return true;
    } catch (error) {
      console.error('Salesforce authentication failed:', error);
      return false;
    }
  }
  
  async syncLeads(direction: 'inbound' | 'outbound', lastSyncAt?: Date): Promise<SyncResult> {
    if (direction === 'inbound') {
      return await this.importLeadsFromSalesforce(lastSyncAt);
    } else {
      return await this.exportLeadsToSalesforce(lastSyncAt);
    }
  }
  
  private async importLeadsFromSalesforce(lastSyncAt?: Date): Promise<SyncResult> {
    try {
      const query = lastSyncAt
        ? `SELECT Id, FirstName, LastName, Email, Company, Phone, Status, CreatedDate 
           FROM Lead WHERE LastModifiedDate > ${lastSyncAt.toISOString()}`
        : `SELECT Id, FirstName, LastName, Email, Company, Phone, Status, CreatedDate 
           FROM Lead LIMIT 1000`;
      
      const response = await axios.get(
        `${this.instanceUrl}/services/data/v58.0/query`,
        {
          params: { q: query },
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
          },
        }
      );
      
      const sfLeads = response.data.records;
      let synced = 0;
      let failed = 0;
      const errors: Array<{ id: string; error: string }> = [];
      
      for (const sfLead of sfLeads) {
        try {
          await this.importSingleLead(sfLead);
          synced++;
        } catch (error) {
          failed++;
          errors.push({
            id: sfLead.Id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      return { success: true, synced, failed, errors };
    } catch (error) {
      console.error('Salesforce import failed:', error);
      return { success: false, synced: 0, failed: 0, errors: [] };
    }
  }
  
  private async importSingleLead(sfLead: any): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Check if lead already exists by external ID
    const existing = await db
      .select()
      .from(crmSyncLogs)
      .where(eq(crmSyncLogs.externalId, sfLead.Id))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing lead
      await db.updateLead(existing[0].entityId, {
        firstName: sfLead.FirstName,
        lastName: sfLead.LastName,
        email: sfLead.Email,
        company: sfLead.Company,
        phone: sfLead.Phone,
        status: this.mapSalesforceStatus(sfLead.Status),
      });
    } else {
      // Create new lead
      const leadId = await db.createLead({
        leadId: uuidv4(),
        firstName: sfLead.FirstName,
        lastName: sfLead.LastName,
        email: sfLead.Email,
        company: sfLead.Company,
        phone: sfLead.Phone,
        source: 'salesforce',
        status: this.mapSalesforceStatus(sfLead.Status),
        score: 0,
      });
      
      // Log sync
      await db.insert(crmSyncLogs).values({
        integrationId: 1, // Get from context
        direction: 'inbound',
        entityType: 'lead',
        entityId: leadId,
        externalId: sfLead.Id,
        status: 'success',
      });
    }
  }
  
  private mapSalesforceStatus(sfStatus: string): string {
    const statusMap: Record<string, string> = {
      'Open - Not Contacted': 'new',
      'Working - Contacted': 'contacted',
      'Qualified': 'qualified',
      'Closed - Converted': 'converted',
      'Closed - Not Converted': 'lost',
    };
    return statusMap[sfStatus] || 'new';
  }
  
  async createLead(lead: Lead): Promise<string> {
    try {
      const response = await axios.post(
        `${this.instanceUrl}/services/data/v58.0/sobjects/Lead`,
        {
          FirstName: lead.firstName,
          LastName: lead.lastName,
          Email: lead.email,
          Company: lead.company,
          Phone: lead.phone,
          LeadSource: lead.source,
          Status: this.mapToSalesforceStatus(lead.status),
        },
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.id;
    } catch (error) {
      console.error('Failed to create Salesforce lead:', error);
      throw error;
    }
  }
  
  async updateLead(externalId: string, lead: Partial<Lead>): Promise<void> {
    try {
      await axios.patch(
        `${this.instanceUrl}/services/data/v58.0/sobjects/Lead/${externalId}`,
        {
          FirstName: lead.firstName,
          LastName: lead.lastName,
          Email: lead.email,
          Company: lead.company,
          Phone: lead.phone,
          Status: lead.status ? this.mapToSalesforceStatus(lead.status) : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to update Salesforce lead:', error);
      throw error;
    }
  }
  
  private mapToSalesforceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'new': 'Open - Not Contacted',
      'contacted': 'Working - Contacted',
      'qualified': 'Qualified',
      'converted': 'Closed - Converted',
      'lost': 'Closed - Not Converted',
    };
    return statusMap[status] || 'Open - Not Contacted';
  }
  
  async syncContacts(direction: 'inbound' | 'outbound', lastSyncAt?: Date): Promise<SyncResult> {
    // Similar implementation for contacts
    return { success: true, synced: 0, failed: 0, errors: [] };
  }
}
```

```typescript
// server/services/crm/hubspot.ts

import axios from 'axios';
import { CrmProvider, CrmCredentials, SyncResult } from './types';

export class HubSpotProvider implements CrmProvider {
  name = 'hubspot';
  private credentials: CrmCredentials;
  private baseUrl = 'https://api.hubapi.com';
  
  constructor(credentials: CrmCredentials) {
    this.credentials = credentials;
  }
  
  async authenticate(credentials: CrmCredentials): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/crm/v3/objects/contacts`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
        params: { limit: 1 },
      });
      return response.status === 200;
    } catch (error) {
      console.error('HubSpot authentication failed:', error);
      return false;
    }
  }
  
  async syncLeads(direction: 'inbound' | 'outbound', lastSyncAt?: Date): Promise<SyncResult> {
    if (direction === 'inbound') {
      return await this.importLeadsFromHubSpot(lastSyncAt);
    } else {
      return await this.exportLeadsToHubSpot(lastSyncAt);
    }
  }
  
  private async importLeadsFromHubSpot(lastSyncAt?: Date): Promise<SyncResult> {
    try {
      const params: any = {
        limit: 100,
        properties: ['firstname', 'lastname', 'email', 'company', 'phone', 'hs_lead_status'],
      };
      
      if (lastSyncAt) {
        params.filterGroups = [{
          filters: [{
            propertyName: 'lastmodifieddate',
            operator: 'GT',
            value: lastSyncAt.getTime(),
          }],
        }];
      }
      
      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts/search`,
        params,
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const hsContacts = response.data.results;
      let synced = 0;
      let failed = 0;
      const errors: Array<{ id: string; error: string }> = [];
      
      for (const hsContact of hsContacts) {
        try {
          await this.importSingleContact(hsContact);
          synced++;
        } catch (error) {
          failed++;
          errors.push({
            id: hsContact.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      return { success: true, synced, failed, errors };
    } catch (error) {
      console.error('HubSpot import failed:', error);
      return { success: false, synced: 0, failed: 0, errors: [] };
    }
  }
  
  private async importSingleContact(hsContact: any): Promise<void> {
    // Similar to Salesforce implementation
    // Map HubSpot contact properties to Lead schema
  }
  
  async createLead(lead: Lead): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/crm/v3/objects/contacts`,
        {
          properties: {
            firstname: lead.firstName,
            lastname: lead.lastName,
            email: lead.email,
            company: lead.company,
            phone: lead.phone,
            hs_lead_status: this.mapToHubSpotStatus(lead.status),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.id;
    } catch (error) {
      console.error('Failed to create HubSpot contact:', error);
      throw error;
    }
  }
  
  async updateLead(externalId: string, lead: Partial<Lead>): Promise<void> {
    try {
      await axios.patch(
        `${this.baseUrl}/crm/v3/objects/contacts/${externalId}`,
        {
          properties: {
            firstname: lead.firstName,
            lastname: lead.lastName,
            email: lead.email,
            company: lead.company,
            phone: lead.phone,
            hs_lead_status: lead.status ? this.mapToHubSpotStatus(lead.status) : undefined,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to update HubSpot contact:', error);
      throw error;
    }
  }
  
  private mapToHubSpotStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'new': 'NEW',
      'contacted': 'OPEN',
      'qualified': 'IN_PROGRESS',
      'converted': 'CLOSED_WON',
      'lost': 'CLOSED_LOST',
    };
    return statusMap[status] || 'NEW';
  }
  
  async syncContacts(direction: 'inbound' | 'outbound', lastSyncAt?: Date): Promise<SyncResult> {
    // Implementation
    return { success: true, synced: 0, failed: 0, errors: [] };
  }
}
```

```typescript
// server/services/crm/factory.ts

import { CrmProvider } from './types';
import { SalesforceProvider } from './salesforce';
import { HubSpotProvider } from './hubspot';

export function createCrmProvider(provider: string, credentials: any): CrmProvider {
  switch (provider) {
    case 'salesforce':
      return new SalesforceProvider(credentials);
    case 'hubspot':
      return new HubSpotProvider(credentials);
    default:
      throw new Error(`Unknown CRM provider: ${provider}`);
  }
}
```

#### Backend Router

```typescript
// server/routers.ts - Add CRM router

export const appRouter = router({
  // ... existing routers
  
  crm: router({
    listIntegrations: protectedProcedure.query(async () => {
      return await db.getAllCrmIntegrations();
    }),
    
    createIntegration: protectedProcedure
      .input(z.object({
        provider: z.enum(['salesforce', 'hubspot', 'pipedrive']),
        credentials: z.object({
          apiKey: z.string().optional(),
          accessToken: z.string().optional(),
          refreshToken: z.string().optional(),
          instanceUrl: z.string().optional(),
          clientId: z.string().optional(),
          clientSecret: z.string().optional(),
        }),
        syncSettings: z.object({
          autoSync: z.boolean(),
          syncInterval: z.number(), // minutes
          syncLeads: z.boolean(),
          syncContacts: z.boolean(),
        }),
      }))
      .mutation(async ({ input }) => {
        // Encrypt credentials before storing
        const encryptedCredentials = encryptData(JSON.stringify(input.credentials));
        
        const integrationId = await db.createCrmIntegration({
          provider: input.provider,
          credentials: encryptedCredentials,
          syncSettings: JSON.stringify(input.syncSettings),
          isActive: true,
        });
        
        return { id: integrationId };
      }),
    
    testConnection: protectedProcedure
      .input(z.object({
        provider: z.enum(['salesforce', 'hubspot', 'pipedrive']),
        credentials: z.any(),
      }))
      .mutation(async ({ input }) => {
        const provider = createCrmProvider(input.provider, input.credentials);
        const isValid = await provider.authenticate(input.credentials);
        return { success: isValid };
      }),
    
    syncNow: protectedProcedure
      .input(z.object({
        integrationId: z.number(),
        direction: z.enum(['inbound', 'outbound']),
      }))
      .mutation(async ({ input }) => {
        const integration = await db.getCrmIntegrationById(input.integrationId);
        if (!integration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
        }
        
        const credentials = JSON.parse(decryptData(integration.credentials));
        const provider = createCrmProvider(integration.provider, credentials);
        
        const result = await provider.syncLeads(input.direction, integration.lastSyncAt || undefined);
        
        // Update last sync time
        await db.updateCrmIntegration(input.integrationId, {
          lastSyncAt: new Date(),
        });
        
        return result;
      }),
    
    getSyncLogs: protectedProcedure
      .input(z.object({
        integrationId: z.number(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return await db.getCrmSyncLogs(input.integrationId, input.limit);
      }),
  }),
});
```

#### Frontend Implementation

```typescript
// client/src/pages/CrmIntegrations.tsx

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function CrmIntegrations() {
  const { data: integrations, isLoading } = trpc.crm.listIntegrations.useQuery();
  const createIntegration = trpc.crm.createIntegration.useMutation({
    onSuccess: () => {
      toast.success("Integration created successfully");
      trpc.useUtils().crm.listIntegrations.invalidate();
    },
  });
  const testConnection = trpc.crm.testConnection.useMutation();
  const syncNow = trpc.crm.syncNow.useMutation({
    onSuccess: (result) => {
      toast.success(`Synced ${result.synced} records, ${result.failed} failed`);
    },
  });
  
  const [newIntegration, setNewIntegration] = useState({
    provider: 'salesforce' as 'salesforce' | 'hubspot' | 'pipedrive',
    credentials: {
      accessToken: '',
      refreshToken: '',
      instanceUrl: '',
      clientId: '',
      clientSecret: '',
    },
    syncSettings: {
      autoSync: true,
      syncInterval: 60,
      syncLeads: true,
      syncContacts: true,
    },
  });
  
  const handleTestConnection = async () => {
    const result = await testConnection.mutateAsync({
      provider: newIntegration.provider,
      credentials: newIntegration.credentials,
    });
    
    if (result.success) {
      toast.success("Connection successful!");
    } else {
      toast.error("Connection failed. Check your credentials.");
    }
  };
  
  const handleCreateIntegration = () => {
    createIntegration.mutate(newIntegration);
  };
  
  const handleSync = (integrationId: number, direction: 'inbound' | 'outbound') => {
    syncNow.mutate({ integrationId, direction });
  };
  
  if (isLoading) return <div>Loading integrations...</div>;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">CRM Integrations</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Integrations */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Integrations</h2>
          <div className="space-y-4">
            {integrations?.map(integration => (
              <Card key={integration.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{integration.provider}</span>
                    {integration.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Last synced: {integration.lastSyncAt 
                        ? new Date(integration.lastSyncAt).toLocaleString()
                        : 'Never'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSync(integration.id, 'inbound')}
                        disabled={syncNow.isLoading}
                      >
                        {syncNow.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(integration.id, 'outbound')}
                        disabled={syncNow.isLoading}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Add New Integration */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Add New Integration</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label>CRM Provider</Label>
                  <Select
                    value={newIntegration.provider}
                    onValueChange={(value: any) => 
                      setNewIntegration(prev => ({ ...prev, provider: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salesforce">Salesforce</SelectItem>
                      <SelectItem value="hubspot">HubSpot</SelectItem>
                      <SelectItem value="pipedrive">Pipedrive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newIntegration.provider === 'salesforce' && (
                  <>
                    <div>
                      <Label>Instance URL</Label>
                      <Input
                        placeholder="https://your-instance.salesforce.com"
                        value={newIntegration.credentials.instanceUrl}
                        onChange={(e) => setNewIntegration(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, instanceUrl: e.target.value },
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Client ID</Label>
                      <Input
                        value={newIntegration.credentials.clientId}
                        onChange={(e) => setNewIntegration(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, clientId: e.target.value },
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Client Secret</Label>
                      <Input
                        type="password"
                        value={newIntegration.credentials.clientSecret}
                        onChange={(e) => setNewIntegration(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, clientSecret: e.target.value },
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Refresh Token</Label>
                      <Input
                        type="password"
                        value={newIntegration.credentials.refreshToken}
                        onChange={(e) => setNewIntegration(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, refreshToken: e.target.value },
                        }))}
                      />
                    </div>
                  </>
                )}
                
                {newIntegration.provider === 'hubspot' && (
                  <div>
                    <Label>Access Token</Label>
                    <Input
                      type="password"
                      value={newIntegration.credentials.accessToken}
                      onChange={(e) => setNewIntegration(prev => ({
                        ...prev,
                        credentials: { ...prev.credentials, accessToken: e.target.value },
                      }))}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Label>Auto Sync</Label>
                  <Switch
                    checked={newIntegration.syncSettings.autoSync}
                    onCheckedChange={(checked) => setNewIntegration(prev => ({
                      ...prev,
                      syncSettings: { ...prev.syncSettings, autoSync: checked },
                    }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testConnection.isLoading}
                  >
                    {testConnection.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Connection
                  </Button>
                  <Button
                    onClick={handleCreateIntegration}
                    disabled={createIntegration.isLoading}
                  >
                    {createIntegration.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Integration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

#### Acceptance Criteria

- ✅ Admin can connect Salesforce and HubSpot accounts
- ✅ System validates credentials before saving
- ✅ Bidirectional sync works for leads/contacts
- ✅ Duplicate detection prevents data duplication
- ✅ Sync logs track all operations with timestamps
- ✅ Failed syncs are logged with error messages
- ✅ Auto-sync runs at configured intervals
- ✅ Manual sync button triggers immediate sync

---

### Feature 3: Public API with Swagger Documentation

**Priority:** HIGH  
**Estimated Effort:** 10-12 hours  
**Dependencies:** Feature 1 (RBAC for API key management)

#### Requirements

Expose REST API endpoints for external integrations. Include API key authentication, rate limiting, and auto-generated Swagger documentation.

#### Implementation

```typescript
// server/api/index.ts - New REST API layer

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '../routers';
import { createContext } from '../_core/context';
import { rateLimiter } from './middleware/rateLimiter';
import { apiKeyAuth } from './middleware/apiKeyAuth';

const apiRouter = express.Router();

// Generate OpenAPI spec from tRPC router
const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Ivy.AI Platform API',
  version: '1.0.0',
  baseUrl: '/api/v1',
  docsUrl: 'https://docs.ivy-ai.com',
  tags: ['Leads', 'Tickets', 'Agents', 'Users'],
});

// Swagger UI
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Apply middleware
apiRouter.use(rateLimiter);
apiRouter.use(apiKeyAuth);

// REST endpoints (mapped from tRPC)
apiRouter.get('/leads', async (req, res) => {
  const caller = appRouter.createCaller(await createContext({ req, res }));
  const leads = await caller.leads.list();
  res.json(leads);
});

apiRouter.post('/leads', async (req, res) => {
  const caller = appRouter.createCaller(await createContext({ req, res }));
  const lead = await caller.leads.create(req.body);
  res.status(201).json(lead);
});

// Webhooks endpoint
apiRouter.post('/webhooks', async (req, res) => {
  const { event, data } = req.body;
  
  // Trigger registered webhooks
  await triggerWebhooks(event, data);
  
  res.json({ success: true });
});

export default apiRouter;
```

```typescript
// server/api/middleware/apiKeyAuth.ts

import { Request, Response, NextFunction } from 'express';
import * as db from '../../db';

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const keyData = await db.validateApiKey(apiKey);
  
  if (!keyData) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  if (!keyData.isActive) {
    return res.status(403).json({ error: 'API key is inactive' });
  }
  
  // Attach user to request
  req.user = keyData.user;
  
  // Log API usage
  await db.logApiUsage(keyData.id, req.path, req.method);
  
  next();
}
```

```typescript
// server/api/middleware/rateLimiter.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### Database Schema

```typescript
// drizzle/schema.ts

export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  isActive: int("isActive", { mode: 'boolean' }).default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export const apiUsageLogs = mysqlTable("apiUsageLogs", {
  id: int("id").autoincrement().primaryKey(),
  apiKeyId: int("apiKeyId").notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: int("statusCode"),
  responseTime: int("responseTime"), // milliseconds
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
});

export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  events: text("events").notNull(), // JSON array of event types
  secret: varchar("secret", { length: 64 }).notNull(),
  isActive: int("isActive", { mode: 'boolean' }).default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

#### Acceptance Criteria

- ✅ REST API endpoints mirror tRPC functionality
- ✅ Swagger UI accessible at `/api/v1/docs`
- ✅ API key authentication works correctly
- ✅ Rate limiting prevents abuse (100 req/15min)
- ✅ Webhooks trigger on events (lead created, ticket resolved)
- ✅ API usage is logged for analytics
- ✅ OpenAPI spec is auto-generated from tRPC schema

---

### Feature 4: Response Templates System

**Priority:** MEDIUM  
**Estimated Effort:** 6-8 hours  
**Dependencies:** None

#### Requirements

Create a library of reusable response templates for common ticket scenarios. Support variables, multi-language, and AI-powered template suggestions.

#### Database Schema

```typescript
// drizzle/schema.ts

export const responseTemplates = mysqlTable("responseTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  body: text("body").notNull(),
  variables: text("variables"), // JSON array of variable names
  language: varchar("language", { length: 10 }).default('en').notNull(),
  isActive: int("isActive", { mode: 'boolean' }).default(true).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
```

#### Backend Implementation

```typescript
// server/routers.ts - Add templates router

export const appRouter = router({
  // ... existing routers
  
  templates: router({
    list: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        language: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getTemplates(input.category, input.language);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        category: z.string(),
        subject: z.string().optional(),
        body: z.string().min(1),
        variables: z.array(z.string()),
        language: z.string().default('en'),
      }))
      .mutation(async ({ input, ctx }) => {
        const templateId = await db.createTemplate({
          ...input,
          variables: JSON.stringify(input.variables),
          createdBy: ctx.user.id,
        });
        return { id: templateId };
      }),
    
    suggestTemplate: protectedProcedure
      .input(z.object({
        ticketSubject: z.string(),
        ticketIssue: z.string(),
      }))
      .query(async ({ input }) => {
        // Use AI to suggest best template
        const templates = await db.getAllTemplates();
        const suggestion = await suggestBestTemplate(input, templates);
        return suggestion;
      }),
    
    renderTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        variables: z.record(z.string()),
      }))
      .query(async ({ input }) => {
        const template = await db.getTemplateById(input.templateId);
        if (!template) throw new TRPCError({ code: 'NOT_FOUND' });
        
        let rendered = template.body;
        for (const [key, value] of Object.entries(input.variables)) {
          rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        
        // Increment usage count
        await db.incrementTemplateUsage(input.templateId);
        
        return { subject: template.subject, body: rendered };
      }),
  }),
});
```

```typescript
// server/services/templateSuggestion.ts

import { invokeLLM } from "./_core/llm";
import { ResponseTemplate } from "../drizzle/schema";

export async function suggestBestTemplate(
  ticket: { ticketSubject: string; ticketIssue: string },
  templates: ResponseTemplate[]
): Promise<ResponseTemplate | null> {
  const prompt = `Given this support ticket:
Subject: ${ticket.ticketSubject}
Issue: ${ticket.ticketIssue}

Which of these templates is most appropriate? Return only the template ID.

Templates:
${templates.map(t => `ID ${t.id}: ${t.name} - ${t.category}`).join('\n')}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a support ticket classifier." },
      { role: "user", content: prompt },
    ],
  });
  
  const suggestedId = parseInt(response.choices[0].message.content);
  return templates.find(t => t.id === suggestedId) || null;
}
```

#### Frontend Implementation

```typescript
// client/src/components/TemplateSelector.tsx

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TemplateSelectorProps {
  onSelect: (template: { subject: string; body: string }) => void;
  ticketContext?: { subject: string; issue: string };
}

export function TemplateSelector({ onSelect, ticketContext }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  
  const { data: templates } = trpc.templates.list.useQuery({});
  const { data: suggestion } = trpc.templates.suggestTemplate.useQuery(
    ticketContext || { ticketSubject: "", ticketIssue: "" },
    { enabled: !!ticketContext }
  );
  const renderTemplate = trpc.templates.renderTemplate.useMutation({
    onSuccess: (data) => {
      onSelect(data);
      setIsOpen(false);
    },
  });
  
  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId);
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      const vars = JSON.parse(template.variables || '[]');
      const initialVars: Record<string, string> = {};
      vars.forEach((v: string) => {
        initialVars[v] = '';
      });
      setVariables(initialVars);
    }
  };
  
  const handleApplyTemplate = () => {
    if (selectedTemplateId) {
      renderTemplate.mutate({
        templateId: selectedTemplateId,
        variables,
      });
    }
  };
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Use Template</Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Response Template</DialogTitle>
          </DialogHeader>
          
          {suggestion && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium">AI Suggestion:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTemplate(suggestion.id)}
              >
                {suggestion.name}
              </Button>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {templates?.map(template => (
                <Button
                  key={template.id}
                  variant={selectedTemplateId === template.id ? "default" : "outline"}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.category}</div>
                  </div>
                </Button>
              ))}
            </div>
            
            {selectedTemplateId && Object.keys(variables).length > 0 && (
              <div className="space-y-2">
                <Label>Fill Template Variables</Label>
                {Object.keys(variables).map(varName => (
                  <div key={varName}>
                    <Label className="text-xs">{varName}</Label>
                    <Input
                      value={variables[varName]}
                      onChange={(e) => setVariables(prev => ({
                        ...prev,
                        [varName]: e.target.value,
                      }))}
                      placeholder={`Enter ${varName}`}
                    />
                  </div>
                ))}
              </div>
            )}
            
            <Button
              onClick={handleApplyTemplate}
              disabled={!selectedTemplateId || renderTemplate.isLoading}
              className="w-full"
            >
              Apply Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### Acceptance Criteria

- ✅ Admin can create/edit/delete templates
- ✅ Templates support variables ({{customerName}}, {{ticketId}}, etc.)
- ✅ AI suggests best template based on ticket content
- ✅ Templates organized by category
- ✅ Multi-language support
- ✅ Usage statistics tracked
- ✅ Template preview before applying

---

### Feature 5: Comprehensive Audit Log

**Priority:** HIGH  
**Estimated Effort:** 6-8 hours  
**Dependencies:** None

#### Requirements

Log all critical actions for compliance and debugging. Include user, timestamp, action type, before/after states, and IP address.

#### Database Schema

```typescript
// drizzle/schema.ts

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for system actions
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  changes: text("changes"), // JSON diff of before/after
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
```

#### Backend Implementation

```typescript
// server/services/auditLog.ts

import * as db from '../db';

export async function logAction(params: {
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  before?: any;
  after?: any;
  req?: any;
}) {
  const changes = params.before && params.after
    ? JSON.stringify({
        before: params.before,
        after: params.after,
        diff: calculateDiff(params.before, params.after),
      })
    : null;
  
  await db.createAuditLog({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changes,
    ipAddress: params.req?.ip,
    userAgent: params.req?.headers['user-agent'],
  });
}

function calculateDiff(before: any, after: any): Record<string, { old: any; new: any }> {
  const diff: Record<string, { old: any; new: any }> = {};
  
  for (const key in after) {
    if (before[key] !== after[key]) {
      diff[key] = { old: before[key], new: after[key] };
    }
  }
  
  return diff;
}
```

```typescript
// server/routers.ts - Add audit logging to mutations

import { logAction } from './services/auditLog';

export const appRouter = router({
  leads: router({
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.string().optional(),
          score: z.number().optional(),
          // ... other fields
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const before = await db.getLeadById(input.id);
        await db.updateLead(input.id, input.data);
        const after = await db.getLeadById(input.id);
        
        // Log the change
        await logAction({
          userId: ctx.user.id,
          action: 'lead.update',
          entityType: 'lead',
          entityId: input.id,
          before,
          after,
          req: ctx.req,
        });
        
        return { success: true };
      }),
  }),
  
  // Add similar logging to other critical mutations
});
```

#### Frontend Implementation

```typescript
// client/src/pages/AuditLog.tsx

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AuditLog() {
  const [filters, setFilters] = useState({
    entityType: 'all',
    action: 'all',
    userId: undefined as number | undefined,
  });
  
  const { data: logs, isLoading } = trpc.audit.list.useQuery(filters);
  
  if (isLoading) return <div>Loading audit logs...</div>;
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Audit Log</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Select
              value={filters.entityType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, entityType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="ticket">Tickets</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.action}
              onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="User ID"
              value={filters.userId || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                userId: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        {logs?.map(log => (
          <Card key={log.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.entityType} #{log.entityId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>User ID: {log.userId}</p>
                  <p className="text-muted-foreground">{log.ipAddress}</p>
                </div>
              </div>
              
              {log.changes && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    View Changes
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(log.changes), null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### Acceptance Criteria

- ✅ All critical actions are logged automatically
- ✅ Logs include before/after states with diff
- ✅ IP address and user agent captured
- ✅ Filterable by entity type, action, user, date range
- ✅ Logs retained for compliance period (configurable)
- ✅ Export logs to CSV for auditing
- ✅ Real-time log streaming for monitoring

---

## Remaining Features Summary

Due to document length constraints, here's a summary of the remaining 15 features with key implementation points:

### Feature 6: ML-Based Lead Conversion Prediction
- Train model on historical lead data
- Predict conversion probability (0-100%)
- Display score in lead cards
- Auto-prioritize high-probability leads

### Feature 7: Sentiment Analysis for Tickets
- Use NLP to detect frustration/urgency
- Escalate negative sentiment tickets
- Display sentiment indicator in UI
- Alert supervisors for critical cases

### Feature 8: Executive Dashboard with Custom KPIs
- Drag-and-drop widget system
- Pre-built KPI widgets (revenue, satisfaction, productivity)
- Export to PDF for reports
- Real-time data updates

### Feature 9: Anomaly Detection & Alerts
- Detect unusual patterns (spike in tickets, drop in conversions)
- Configurable alert thresholds
- Push notifications for critical anomalies
- Historical trend comparison

### Feature 10: Real-Time Collaboration
- Show who's viewing/editing (presence indicators)
- Lock records during editing
- Live cursor positions
- Conflict resolution for simultaneous edits

### Feature 11: Advanced Search with Boolean Operators
- Full-text search across all entities
- Boolean operators (AND, OR, NOT)
- Save frequent searches
- Search history

### Feature 12: Offline Mode (PWA)
- Service worker for offline caching
- Queue mutations for sync
- Conflict resolution on reconnect
- Offline indicator in UI

### Feature 13: Interactive Onboarding
- Step-by-step tutorial
- Contextual tooltips
- Progress tracking
- Video guides

### Feature 14: Slack/Teams Integration
- Receive notifications in chat
- Create leads/tickets from chat
- Bot commands for status checks
- Two-way sync

### Feature 15: Calendar Integration
- Sync follow-up tasks to Google Calendar/Outlook
- Meeting scheduling for leads
- Reminder notifications
- Availability checking

### Feature 16: Two-Factor Authentication (2FA)
- TOTP support (Google Authenticator)
- SMS backup codes
- Mandatory for admin accounts
- Recovery codes

### Feature 17: End-to-End Encryption
- Encrypt sensitive fields at rest
- Key management system
- Audit trail for encryption events
- GDPR/CCPA compliance

### Feature 18: GDPR Data Export/Deletion
- Self-service data download
- Complete account deletion
- Data portability (JSON/CSV)
- Compliance reporting

### Feature 19: Custom Branding
- Upload logo and favicon
- Customize color scheme
- White-label emails
- Custom domain support

### Feature 20: Dynamic Custom Fields
- Admin UI to add custom fields
- Support text, number, date, dropdown
- Validation rules
- Search/filter by custom fields

---

## Testing Requirements

### Unit Tests (Vitest)

```typescript
// Example test structure

import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '../server/db';

describe('RBAC System', () => {
  beforeEach(async () => {
    // Reset database state
    await db.clearTestData();
  });
  
  it('should create role with permissions', async () => {
    const roleId = await db.createRole({
      name: 'Test Role',
      permissions: JSON.stringify(['leads:view']),
      isSystem: false,
    });
    
    expect(roleId).toBeGreaterThan(0);
  });
  
  it('should check user permissions correctly', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// Test tRPC procedures end-to-end

import { describe, it, expect } from 'vitest';
import { appRouter } from '../server/routers';
import { createContext } from '../server/_core/context';

describe('Leads API', () => {
  it('should create lead via tRPC', async () => {
    const ctx = await createContext({ req: mockReq, res: mockRes });
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.leads.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      company: 'Test Corp',
    });
    
    expect(result.id).toBeDefined();
  });
});
```

### Test Coverage Requirements

- **Minimum 80% code coverage** for all new features
- All tRPC procedures must have integration tests
- Database functions must have unit tests
- Critical user flows must have E2E tests

---

## Integration Checklist

When submitting your code, ensure:

- [ ] All TypeScript compiles without errors (`pnpm tsc --noEmit`)
- [ ] All tests pass (`pnpm test`)
- [ ] Code follows existing patterns and conventions
- [ ] Database schema changes include migration scripts
- [ ] tRPC procedures have proper input validation (Zod)
- [ ] Frontend components use shadcn/ui where possible
- [ ] Error handling is comprehensive
- [ ] Loading states are implemented
- [ ] Optimistic updates used where appropriate
- [ ] No hardcoded secrets or API keys
- [ ] Comments explain complex logic
- [ ] README updated with new features
- [ ] API documentation updated (if applicable)

---

## Submission Guidelines

### File Structure

Submit your code in this structure:

```
submission/
├── feature-1-rbac/
│   ├── schema.ts           # Database schema changes
│   ├── db.ts              # Database query functions
│   ├── routers.ts         # tRPC router additions
│   ├── frontend/          # React components
│   │   ├── RolesManagement.tsx
│   │   ├── PermissionGate.tsx
│   │   └── usePermissions.ts
│   ├── tests/             # Test files
│   │   ├── rbac.test.ts
│   │   └── roles.integration.test.ts
│   └── README.md          # Feature-specific documentation
├── feature-2-crm/
│   └── ...
└── IMPLEMENTATION_NOTES.md  # Overall notes and decisions
```

### Code Quality Standards

- **TypeScript:** Strict mode, no `any` types
- **Formatting:** Use Prettier (config provided)
- **Linting:** Pass ESLint with zero warnings
- **Naming:** camelCase for variables/functions, PascalCase for components
- **Comments:** JSDoc for public functions, inline for complex logic

### Documentation Requirements

Each feature must include:

1. **README.md** with:
   - Feature overview
   - Setup instructions
   - Usage examples
   - Known limitations
   
2. **API Documentation** (if applicable):
   - Endpoint descriptions
   - Request/response examples
   - Error codes
   
3. **Migration Guide** (if schema changes):
   - SQL migration script
   - Rollback procedure
   - Data migration notes

### Delivery Method

1. Create a Git branch for each feature: `feature/rbac`, `feature/crm-integration`, etc.
2. Commit frequently with descriptive messages
3. Push to provided repository
4. Create Pull Request with:
   - Feature description
   - Testing notes
   - Screenshots/videos (for UI changes)
   - Breaking changes (if any)

---

## Support & Questions

For technical questions during implementation:

- **Email:** dev-support@ivy-ai.com
- **Slack:** #external-dev-support
- **Documentation:** https://docs.ivy-ai.com/dev

**Response Time:** Within 24 hours on business days

---

## Timeline & Milestones

**Recommended Implementation Order:**

**Week 1-2:**
- Feature 1: RBAC (foundational)
- Feature 5: Audit Log (foundational)
- Feature 4: Response Templates

**Week 3-4:**
- Feature 2: CRM Integration
- Feature 3: Public API
- Feature 16: 2FA

**Week 5-6:**
- Feature 6: ML Prediction
- Feature 7: Sentiment Analysis
- Feature 8: Executive Dashboard

**Week 7-8:**
- Feature 9: Anomaly Detection
- Feature 10: Real-Time Collaboration
- Feature 14: Slack/Teams Integration

**Week 9-10:**
- Feature 11-13: Search, Offline, Onboarding
- Feature 15: Calendar Integration
- Feature 17-18: Encryption, GDPR

**Week 11-12:**
- Feature 19-20: Branding, Custom Fields
- Integration testing
- Documentation finalization
- Bug fixes and polish

---

## Payment & Invoicing

**Payment Structure:**
- Per-feature pricing (negotiated separately)
- Milestone-based payments (50% on PR submission, 50% on approval)
- Bonus for early delivery and exceptional quality

**Invoicing:**
- Submit invoice with completed feature list
- Include hours worked per feature
- Payment within 15 days of approval

---

## Legal & IP

- All code becomes property of Ivy.AI upon payment
- Must sign NDA before receiving repository access
- No code reuse in other projects without written permission
- Confidentiality of business logic and data structures

---

**Document End**

*This specification is a living document and may be updated as requirements evolve. Check for the latest version before starting implementation.*

**Contact:** Jacob Rodriguez Lopez (Project Lead)  
**Email:** jcrobledolopez@gmail.com  
**Last Updated:** November 16, 2025
