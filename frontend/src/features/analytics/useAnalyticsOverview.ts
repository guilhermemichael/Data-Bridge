import { useEffect, useState } from "react";

import { getAnalyticsOverview, type AnalyticsOverview } from "./api";

type OverviewState = {
  data: AnalyticsOverview | null;
  isLoading: boolean;
  error: string | null;
};

export function useAnalyticsOverview(enabled: boolean) {
  const [state, setState] = useState<OverviewState>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    void getAnalyticsOverview()
      .then((data) => {
        if (active) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            data: null,
            isLoading: false,
            error: "We could not load analytics overview.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return state;
}
