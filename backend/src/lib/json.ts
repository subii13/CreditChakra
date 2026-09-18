import type { Prisma } from "@prisma/client";

// Prisma's Json input type doesn't structurally match our domain
// interfaces (they lack index signatures) even though the runtime
// shape is fine — this is the one narrow, intentional cast point for
// storing typed engine output into Json columns.
export function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
