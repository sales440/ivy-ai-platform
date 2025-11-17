/**
 * Permissions System
 * Defines role-based access control for company resources
 */

export type Role = "viewer" | "analyst" | "member" | "manager" | "admin";
export type Resource = "leads" | "tickets" | "agents" | "workflows" | "config" | "users";
export type Action = "create" | "read" | "update" | "delete";

/**
 * Permission matrix defining what each role can do
 */
const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
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

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Record<Resource, Action[]> {
  return PERMISSIONS[role] || {};
}

/**
 * Check if a role can perform any action on a resource
 */
export function canAccessResource(role: Role, resource: Resource): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  return resourcePermissions && resourcePermissions.length > 0;
}
