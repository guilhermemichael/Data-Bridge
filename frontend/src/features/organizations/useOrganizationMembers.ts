import { useCallback, useEffect, useState } from "react";

import {
  addOrganizationMember,
  listOrganizationMembers,
  removeOrganizationMember,
  updateOrganizationMember,
  type OrganizationMember,
  type OrganizationRole,
} from "./api";

type MembersState = {
  members: OrganizationMember[];
  isLoading: boolean;
  error: string | null;
};

export function useOrganizationMembers(
  organizationId: string | null,
  enabled: boolean,
) {
  const [state, setState] = useState<MembersState>({
    members: [],
    isLoading: Boolean(enabled && organizationId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled || !organizationId) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const members = await listOrganizationMembers(organizationId);
      setState({ members, isLoading: false, error: null });
    } catch {
      setState({
        members: [],
        isLoading: false,
        error: "We could not load organization members.",
      });
    }
  }, [enabled, organizationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback(
    async (email: string, role: OrganizationRole) => {
      if (!enabled || !organizationId) {
        return null;
      }
      const member = await addOrganizationMember(organizationId, { email, role });
      await refresh();
      return member;
    },
    [enabled, organizationId, refresh],
  );

  const updateRole = useCallback(
    async (memberId: string, role: OrganizationRole) => {
      if (!enabled || !organizationId) {
        return null;
      }
      const member = await updateOrganizationMember(organizationId, memberId, {
        role,
      });
      await refresh();
      return member;
    },
    [enabled, organizationId, refresh],
  );

  const remove = useCallback(
    async (memberId: string) => {
      if (!enabled || !organizationId) {
        return;
      }
      await removeOrganizationMember(organizationId, memberId);
      await refresh();
    },
    [enabled, organizationId, refresh],
  );

  return { ...state, add, refresh, remove, updateRole };
}
