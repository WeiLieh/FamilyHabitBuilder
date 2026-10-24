-- =============================================================================
-- supabase/tests/nudges-table.test.sql: tests for the "nudges" table rules
--
-- What it checks: that supabase/migrations/001_create_nudges.sql builds a table
-- which (1) accepts the owner's 9 nudges from the first-load CSV and (2) refuses
-- each kind of bad row. Run on a throwaway local PostgreSQL database via
-- supabase/tests/run.sh, never on the real Supabase project.
--
-- How a "refuse" test works: we try a bad insert inside a small block. If the
-- database refuses it (raises an error), good. If it is accepted, we raise our
-- own error "SHOULD HAVE BEEN REFUSED", which stops the run and fails the test.
-- =============================================================================

\set ON_ERROR_STOP on
-- Show only our PASS/FAIL messages, not table printouts.
\pset tuples_only on
\o /dev/null

-- Supabase has these three built-in roles (kinds of user); a plain local
-- PostgreSQL doesn't, so create stand-ins for the test.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;

-- Build the table exactly as the owner will in Supabase.
\i supabase/migrations/001_create_nudges.sql

-- Load the owner's 9 nudges, the same way the dashboard's CSV import does.
\copy public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, description_max_chars, photo_upload_allowed, photo_idea, active, starts_unlocked) from 'supabase/seed/nudges-first-load.csv' with (format csv, header true)

-- Test: the first load gives 4 quick and 5 deliberate nudges, 6 unlocked,
-- with IDs 1 to 9 generated automatically.
do $$
begin
  assert (select count(*) from public.nudges) = 9, 'expected 9 nudges';
  assert (select count(*) from public.nudges where category = 'quick') = 4, 'expected 4 quick';
  assert (select count(*) from public.nudges where category = 'deliberate') = 5, 'expected 5 deliberate';
  assert (select count(*) from public.nudges where starts_unlocked) = 6, 'expected 6 unlocked at start';
  assert (select array_agg(id order by id) from public.nudges) = array[1,2,3,4,5,6,7,8,9]::bigint[], 'expected IDs 1 to 9';
  assert (select count(*) from public.nudges where photo_upload_allowed) = 5, 'expected 5 photo nudges';
  raise notice 'PASS: first load (9 nudges, 4 quick, 5 deliberate, 6 unlocked, IDs 1 to 9)';
end $$;

-- A helper that tries one SQL statement and expects the database to refuse it.
create function pg_temp.expect_refused(label text, statement text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    raise notice 'PASS: refused %', label;
    return;
  end;
  raise exception 'FAIL: % SHOULD HAVE BEEN REFUSED', label;
end $$;

-- A valid row to copy from, changing one thing at a time.
-- (columns: name, category, ex1..ex5, self_report, max_chars, photo, idea, active, starts_unlocked)
select pg_temp.expect_refused('a category other than quick or deliberate',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values ('New one', 'medium', 'a', 'b', 'c', 'd', 'e', true, false, true)$q$);

select pg_temp.expect_refused('a blank name',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values ('   ', 'quick', 'a', 'b', 'c', 'd', 'e', true, false, true)$q$);

select pg_temp.expect_refused('a blank example',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values ('New one', 'quick', 'a', '', 'c', 'd', 'e', true, false, true)$q$);

select pg_temp.expect_refused('a missing example',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values ('New one', 'quick', 'a', 'b', 'c', 'd', true, false, true)$q$);

select pg_temp.expect_refused('an empty yes/no (self-report allowed)',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values ('New one', 'quick', 'a', 'b', 'c', 'd', 'e', null, false, true)$q$);

select pg_temp.expect_refused('a description limit above 280',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, description_max_chars, photo_upload_allowed, starts_unlocked)
     values ('New one', 'quick', 'a', 'b', 'c', 'd', 'e', true, 281, false, true)$q$);

select pg_temp.expect_refused('photos allowed but no photo idea',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, photo_idea, starts_unlocked)
     values ('New one', 'deliberate', 'a', 'b', 'c', 'd', 'e', true, true, '  ', true)$q$);

select pg_temp.expect_refused('no way to log (no self-report, no photo)',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values ('New one', 'quick', 'a', 'b', 'c', 'd', 'e', false, false, true)$q$);

select pg_temp.expect_refused('a duplicate name (ignoring capitals and spaces)',
  $q$insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values ('  showing  AFFECTION ', 'quick', 'a', 'b', 'c', 'd', 'e', true, false, true)$q$);

select pg_temp.expect_refused('typing your own ID (IDs are generated)',
  $q$insert into public.nudges (id, name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
     values (42, 'New one', 'quick', 'a', 'b', 'c', 'd', 'e', true, false, true)$q$);

-- Test: a correct new row IS accepted, gets a new unique ID, and defaults to
-- active. Note: the ID may skip numbers (e.g. 19, not 10), because every
-- refused attempt above still used up a number. That is normal and harmless:
-- IDs stay unique; they are labels, not a count.
do $$
declare new_id bigint;
begin
  insert into public.nudges (name, category, example_1, example_2, example_3, example_4, example_5, self_report_allowed, photo_upload_allowed, starts_unlocked)
  values ('A brand new nudge', 'quick', 'a', 'b', 'c', 'd', 'e', true, false, false)
  returning id into new_id;
  assert new_id > 9, 'expected a new ID after the first 9';
  assert (select count(*) from public.nudges where id = new_id) = 1, 'expected the new ID to be unique';
  assert (select active from public.nudges where id = new_id), 'expected new rows to be active by default';
  raise notice 'PASS: a correct new row is accepted (new unique ID %, active by default)', new_id;
end $$;

-- Test: permissions. Our server (service_role) may read; the public web roles
-- (anon, authenticated) may not, and nobody may write through the Data API.
do $$
begin
  assert has_table_privilege('service_role', 'public.nudges', 'select'), 'service_role should read';
  assert not has_table_privilege('service_role', 'public.nudges', 'insert'), 'service_role should not insert';
  assert not has_table_privilege('service_role', 'public.nudges', 'delete'), 'service_role should not delete';
  assert not has_table_privilege('anon', 'public.nudges', 'select'), 'anon should not read';
  assert not has_table_privilege('authenticated', 'public.nudges', 'select'), 'authenticated should not read';
  assert (select relrowsecurity from pg_class where oid = 'public.nudges'::regclass), 'RLS should be on';
  raise notice 'PASS: permissions (server reads only; public roles locked out; RLS on)';
end $$;

\o
\echo 'ALL DATABASE TESTS PASSED'
