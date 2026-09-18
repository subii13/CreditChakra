import { describe, expect, it } from "vitest";
import { demoPersonas } from "./demoPersonas";

// Section 89: persona presets are INPUT only. Guard against a future
// edit accidentally adding an outcome field (matchScore, decisionType,
// isVerified, ...) to a persona, which would defeat the "backend
// determines output" requirement.
describe("demoPersonas", () => {
  const forbiddenKeys = ["matchScore", "decisionType", "isVerified", "authorizationStatus"];

  it("contains at least the four required personas", () => {
    expect(demoPersonas.length).toBeGreaterThanOrEqual(4);
  });

  it("never encodes an outcome field on any persona's values", () => {
    for (const persona of demoPersonas) {
      for (const key of forbiddenKeys) {
        expect(Object.prototype.hasOwnProperty.call(persona.values, key)).toBe(false);
      }
    }
  });

  it("gives every persona a positive project cost and loan amount", () => {
    for (const persona of demoPersonas) {
      expect(persona.values.projectCost).toBeGreaterThan(0);
      expect(persona.values.requestedLoanAmount).toBeGreaterThan(0);
    }
  });
});
