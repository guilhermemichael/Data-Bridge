import { Database } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renders metric value and detail", () => {
    render(
      <MetricCard
        metric={{
          label: "Active Datasets",
          value: "3",
          detail: "Connected to the workspace",
          tone: "info",
          icon: Database,
        }}
      />,
    );

    expect(screen.getByText("Active Datasets")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Connected to the workspace")).toBeInTheDocument();
  });
});
