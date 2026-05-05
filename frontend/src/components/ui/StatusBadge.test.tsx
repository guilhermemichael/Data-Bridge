import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the provided status label", () => {
    render(<StatusBadge label="COMPLETED" tone="success" />);

    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  });
});
