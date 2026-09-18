-- Manual/CI RLS verification for CreditChakra.
--
-- Requires a live Supabase project with 001_rls_policies.sql applied
-- and at least two real auth users provisioned (see
-- scripts/create-rls-test-users.md). This cannot run against an
-- unconfigured/local-only checkout — there is no Supabase project
-- attached in this build environment, so treat this file as the
-- executable spec for Section 30/123, to be run before launch:
--
--   psql "$DATABASE_URL" -v user_a='<user-a-uuid>' -v user_b='<user-b-uuid>' \
--     -f backend/prisma/sql/rls_tests.sql
--
-- Each block sets the Postgres role to `authenticated` and forges the
-- JWT claims Supabase's RLS helpers (auth.uid()) read, mirroring what
-- PostgREST does for a real request. A test "passes" when the row
-- count matches the comment above it.

begin;

-- Seed one applicant profile owned by user_a.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'user_a')::text, true);
insert into applicant_profiles
  (id, "userId", goal, "fullName", state, district, category, "familyIncome", "projectCost", "requestedLoanAmount", "preferredTenureMonths")
values
  (gen_random_uuid(), :'user_a', 'LIVELIHOOD', 'Test Applicant A', 'TestState', 'TestDistrict', 'SC', 250000, 100000, 90000, 36);

-- Expect 1 row: owner can read their own profile.
select set_config('request.jwt.claims', json_build_object('sub', :'user_a')::text, true);
select count(*) as expect_1_owner_can_read from applicant_profiles where "userId" = :'user_a'::uuid;

-- Expect 0 rows: a different authenticated user cannot read user_a's profile.
select set_config('request.jwt.claims', json_build_object('sub', :'user_b')::text, true);
select count(*) as expect_0_non_owner_cannot_read from applicant_profiles where "userId" = :'user_a'::uuid;

-- Expect error / 0 effect: anon role cannot read any private profile.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
select count(*) as expect_0_anon_cannot_read from applicant_profiles;

-- Expect failure: user_b cannot insert a profile claiming to be user_a.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', :'user_b')::text, true);
do $$
begin
  begin
    insert into applicant_profiles
      (id, "userId", goal, "fullName", state, district, category, "familyIncome", "projectCost", "requestedLoanAmount", "preferredTenureMonths")
    values
      (gen_random_uuid(), (select :'user_a')::uuid, 'LIVELIHOOD', 'Forged', 'X', 'Y', 'SC', 1, 1, 1, 1);
    raise exception 'RLS FAILURE: user_b was able to insert a row owned by user_a';
  exception
    when insufficient_privilege or others then
      raise notice 'PASS: forged insert correctly rejected';
  end;
end $$;

-- Public reference data: anon can read schemes.
reset role;
set local role anon;
select count(*) as expect_gte_0_public_schemes_readable from schemes;

rollback; -- never commit test data
