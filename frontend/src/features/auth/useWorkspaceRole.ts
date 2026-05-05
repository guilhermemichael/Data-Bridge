import { useMemo } from "react";

import { useAuth } from "./AuthContext";
import { can, type Permission, type Role } from "./permissions";
import { useOrganizationMembers } from "../organizations/useOrganizationMembers";
import { useOrganizations } from "../organizations/useOrganizations";

export function useWorkspaceRole() {
  const { user, isAuthenticated } = useAuth();
  const { organizations } = useOrganizations(isAuthenticated);
  const organizationId = organizations[0]?.id ?? null;
  const { members, isLoading } = useOrganizationMembers(
    organizationId,
    isAuthenticated,
  );

  const role = useMemo<Role | null>(() => {
    const membership = members.find((member) => member.user_id === user?.id);
    return membership?.role ?? null;
  }, [members, user?.id]);

  function useCan(permission: Permission) {
    return can(role, permission);
  }

  return {
    organizationId,
    role,
    isLoading,
    can: useCan,
  };
}
