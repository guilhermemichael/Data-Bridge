import { useCallback, useEffect, useState } from "react";

import { listOrganizationMembers, type OrganizationMember } from "./api";

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

  return { ...state, refresh };
}
