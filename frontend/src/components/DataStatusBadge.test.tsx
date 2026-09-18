import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataStatusBadge } from "./DataStatusBadge";

// Section 87/136: every status must render a human-readable label so
// users always know whether a figure is verified, an estimate, demo
// data, or unverified — never silently treated as fact.
describe("DataStatusBadge", () => {
  it("renders a clear warning label for UNVERIFIED data", () => {
    render(<DataStatusBadge status="UNVERIFIED" />);
    expect(screen.getByText(/unverified/i)).toBeDefined();
  });

  it("renders a verified label for VERIFIED_OFFICIAL data", () => {
    render(<DataStatusBadge status="VERIFIED_OFFICIAL" />);
    expect(screen.getByText(/verified official data/i)).toBeDefined();
  });

  it("renders an estimate label for ESTIMATE data", () => {
    render(<DataStatusBadge status="ESTIMATE" />);
    expect(screen.getByText(/estimate/i)).toBeDefined();
  });

  it("falls back to the raw status string for an unknown status rather than throwing", () => {
    render(<DataStatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText("SOMETHING_NEW")).toBeDefined();
  });
});
