-- CreditChakra Row Level Security policies.
--
-- Apply AFTER `prisma migrate deploy` has created the tables in
-- schema.prisma, against the SAME Supabase Postgres database:
--   psql "$DATABASE_URL" -f backend/prisma/sql/001_rls_policies.sql
--
-- Default posture: DENY. RLS is enabled on every table and no policy
-- grants access until explicitly created below. The Express API talks
-- to Postgres through Prisma using the service role (server-only) and
-- enforces ownership itself in application code (see
-- src/middleware/ownership.ts) — these policies are the second,
-- independent layer of defense in case a client ever gets a direct
-- Supabase connection (e.g. via supabase-js) using the anon key.

-- ---------------------------------------------------------------------
-- Private, user-owned tables
-- ---------------------------------------------------------------------

alter table applicant_profiles enable row level security;
alter table recommendations enable row level security;
alter table rule_evaluations enable row level security;
alter table simulations enable row level security;
alter table emi_calculations enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table application_checklists enable row level security;
alter table reports enable row level security;
alter table partner_interactions enable row level security;
alter table audit_events enable row level security;

alter table applicant_profiles force row level security;
alter table recommendations force row level security;
alter table rule_evaluations force row level security;
alter table simulations force row level security;
alter table emi_calculations force row level security;
alter table ai_conversations force row level security;
alter table ai_messages force row level security;
alter table application_checklists force row level security;
alter table reports force row level security;
alter table partner_interactions force row level security;
alter table audit_events force row level security;

-- applicant_profiles: owner-only, full CRUD
create policy applicant_profiles_select_own on applicant_profiles
  for select using (auth.uid() = "userId");
create policy applicant_profiles_insert_own on applicant_profiles
  for insert with check (auth.uid() = "userId");
create policy applicant_profiles_update_own on applicant_profiles
  for update using (auth.uid() = "userId") with check (auth.uid() = "userId");
create policy applicant_profiles_delete_own on applicant_profiles
  for delete using (auth.uid() = "userId");

-- recommendations: owner-only, read + server-generated insert (no
-- client update/delete — recommendations are immutable once computed)
create policy recommendations_select_own on recommendations
  for select using (auth.uid() = "userId");
create policy recommendations_insert_own on recommendations
  for insert with check (auth.uid() = "userId");

-- rule_evaluations: owner-only, read-only from the client's perspective
create policy rule_evaluations_select_own on rule_evaluations
  for select using (auth.uid() = "userId");
create policy rule_evaluations_insert_own on rule_evaluations
  for insert with check (auth.uid() = "userId");

-- simulations: owner-only
create policy simulations_select_own on simulations
  for select using (auth.uid() = "userId");
create policy simulations_insert_own on simulations
  for insert with check (auth.uid() = "userId");

-- emi_calculations: owner-only
create policy emi_calculations_select_own on emi_calculations
  for select using (auth.uid() = "userId");
create policy emi_calculations_insert_own on emi_calculations
  for insert with check (auth.uid() = "userId");

-- ai_conversations / ai_messages: owner-only
create policy ai_conversations_select_own on ai_conversations
  for select using (auth.uid() = "userId");
create policy ai_conversations_insert_own on ai_conversations
  for insert with check (auth.uid() = "userId");
create policy ai_conversations_update_own on ai_conversations
  for update using (auth.uid() = "userId") with check (auth.uid() = "userId");

create policy ai_messages_select_own on ai_messages
  for select using (auth.uid() = "userId");
create policy ai_messages_insert_own on ai_messages
  for insert with check (auth.uid() = "userId");

-- application_checklists: owner can read/update/insert (toggling item
-- completion), no delete needed
create policy application_checklists_select_own on application_checklists
  for select using (auth.uid() = "userId");
create policy application_checklists_insert_own on application_checklists
  for insert with check (auth.uid() = "userId");
create policy application_checklists_update_own on application_checklists
  for update using (auth.uid() = "userId") with check (auth.uid() = "userId");

-- reports: owner-only, read + insert (immutable once generated)
create policy reports_select_own on reports
  for select using (auth.uid() = "userId");
create policy reports_insert_own on reports
  for insert with check (auth.uid() = "userId");

-- partner_interactions: owner-only
create policy partner_interactions_select_own on partner_interactions
  for select using (auth.uid() = "userId");
create policy partner_interactions_insert_own on partner_interactions
  for insert with check (auth.uid() = "userId");

-- audit_events: no direct client access at all (server/service-role
-- writes only; not even the owning user can read via the anon/auth
-- roles — audit trails must not be client-tamperable or client-hidden
-- from the actual security team). Intentionally: zero policies here
-- beyond RLS being enabled, so anon/authenticated get nothing.

-- ---------------------------------------------------------------------
-- Public / low-sensitivity reference tables
-- ---------------------------------------------------------------------

alter table schemes enable row level security;
alter table eligibility_rules enable row level security;
alter table scheme_sources enable row level security;
alter table checklist_definitions enable row level security;
alter table partners enable row level security;
alter table partner_schemes enable row level security;

alter table schemes force row level security;
alter table eligibility_rules force row level security;
alter table scheme_sources force row level security;
alter table checklist_definitions force row level security;
alter table partners force row level security;
alter table partner_schemes force row level security;

-- Public reference data: readable by anyone (anon + authenticated),
-- writable by no one through the client (only via service role /
-- migrations / seed scripts, which bypass RLS entirely).
create policy schemes_public_read on schemes
  for select using (true);
create policy eligibility_rules_public_read on eligibility_rules
  for select using (true);
create policy scheme_sources_public_read on scheme_sources
  for select using (true);
create policy checklist_definitions_public_read on checklist_definitions
  for select using (true);
create policy partners_public_read on partners
  for select using (true);
create policy partner_schemes_public_read on partner_schemes
  for select using (true);

-- No insert/update/delete policies exist for any reference table above,
-- so anon and authenticated roles cannot mutate scheme rules, sources,
-- or partner authorization flags — only the service role (which
-- bypasses RLS) can, via seed/admin scripts.
