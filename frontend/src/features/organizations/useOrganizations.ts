import { useCallback, useEffect, useState } from "react";

import { listOrganizations, type Organization } from "./api";

type OrganizationState = {
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
};

export function useOrganizations(enabled: boolean) {
  const [state, setState] = useState<OrganizationState>({
    organizations: [],
    isLoading: enabled,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const organizations = await listOrganizations();
      setState({ organizations, isLoading: false, error: null });
    } catch {
      setState({
        organizations: [],
        isLoading: false,
        error: "We could not load organizations.",
      });
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
