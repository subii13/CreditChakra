import { AppError } from "../lib/errors";

// IDs from the URL/body are lookup keys, never permission grants
// (Section 9/40). Every route that loads a user-owned record must
// pass it through this check before using it. Throws NOT_FOUND rather
// than FORBIDDEN so a non-owner cannot distinguish "doesn't exist"
// from "exists but isn't yours" (avoids leaking existence of other
// users' records).
export function assertOwnedBy<T extends { userId: string }>(record: T | null, userId: string): T {
  if (!record || record.userId !== userId) {
    throw new AppError("NOT_FOUND", "Resource not found.");
  }
  return record;
}
