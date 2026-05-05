export type Role = "OWNER" | "ADMIN" | "ANALYST" | "VIEWER";

export type Permission =
  | "organization:update"
  | "members:manage"
  | "datasets:create"
  | "datasets:update"
  | "datasets:delete"
  | "imports:create"
  | "reports:create"
  | "alerts:resolve"
  | "audit:read";

export const permissions: Record<Role, Permission[]> = {
  OWNER: [
    "organization:update",
    "members:manage",
    "datasets:create",
    "datasets:update",
    "datasets:delete",
    "imports:create",
    "reports:create",
    "alerts:resolve",
    "audit:read",
  ],
  ADMIN: [
    "organization:update",
    "members:manage",
    "datasets:create",
    "datasets:update",
    "datasets:delete",
    "imports:create",
    "reports:create",
    "alerts:resolve",
    "audit:read",
  ],
  ANALYST: [
    "datasets:create",
    "datasets:update",
    "imports:create",
    "reports:create",
    "alerts:resolve",
  ],
  VIEWER: ["audit:read"],
};

export function can(role: Role | null, permission: Permission) {
  if (!role) {
    return false;
  }
  return permissions[role].includes(permission);
}
