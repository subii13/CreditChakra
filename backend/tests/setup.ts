// Vitest setup: provide dummy-but-valid values for every required env
// var so config/env.ts's schema validation doesn't block unit tests
// that never touch a real database or Supabase project. Never real
// secrets — these are throwaway test-only placeholders.
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.SUPABASE_URL ??= "https://test-project.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString("base64");
process.env.SESSION_SECRET ??= "test-session-secret";
