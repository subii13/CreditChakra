import { describe, expect, it } from "vitest";
import { assertOwnedBy } from "../src/middleware/ownership";
import { AppError } from "../src/lib/errors";

// Section 9/121: IDOR protection. A record ID is a lookup key, never a
// permission grant — ownership must always be re-derived from the
// authenticated user, not trusted from the URL/body.
describe("assertOwnedBy", () => {
  it("returns the record when userId matches the authenticated user", () => {
    const record = { id: "r1", userId: "user-a" };
    expect(assertOwnedBy(record, "user-a")).toBe(record);
  });

  it("throws NOT_FOUND (not FORBIDDEN) when the record belongs to a different user", () => {
    const record = { id: "r1", userId: "user-a" };
    try {
      assertOwnedBy(record, "user-b");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe("NOT_FOUND");
    }
  });

  it("throws NOT_FOUND when the record does not exist, without distinguishing from wrong-owner", () => {
    try {
      assertOwnedBy(null, "user-a");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect((err as AppError).code).toBe("NOT_FOUND");
    }
  });
});
