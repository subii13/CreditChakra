import { PrismaClient } from "@prisma/client";

// Single Prisma client for the process. The Express layer is the only
// thing that talks to Postgres directly; it authenticates the caller
// and enforces ownership itself (src/middleware/ownership.ts) before
// ever using this client, since Prisma connects with a privileged
// database role and does not go through Supabase's PostgREST/RLS path.
export const prisma = new PrismaClient();
