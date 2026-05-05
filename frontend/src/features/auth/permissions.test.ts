import { describe, expect, it } from "vitest";

import { can } from "./permissions";

describe("permissions", () => {
  it("allows owners to manage sensitive workspace actions", () => {
    expect(can("OWNER", "organization:update")).toBe(true);
    expect(can("OWNER", "datasets:delete")).toBe(true);
    expect(can("OWNER", "audit:read")).toBe(true);
  });

  it("keeps viewers in read-oriented mode", () => {
    expect(can("VIEWER", "datasets:create")).toBe(false);
    expect(can("VIEWER", "imports:create")).toBe(false);
    expect(can("VIEWER", "reports:create")).toBe(false);
    expect(can("VIEWER", "audit:read")).toBe(true);
  });

  it("denies permissions when no role is known yet", () => {
    expect(can(null, "datasets:create")).toBe(false);
  });
});
