-- =============================================================================
-- src/datastore/supabase/tests/nudge-repository.test.sql: tests for the nudges and examples tables
--
-- What it checks: that src/datastore/supabase/migrations/001_create_nudge_repository.sql
-- (plus 002_service_role_read_only.sql) builds tables which (1) accept the owner's 9 nudges and 77 examples from the
-- first-load CSVs, (2) refuse each kind of bad row, (3) refuse edits that
-- would leave a nudge with fewer than 3 active examples, and (4) keep the
-- public locked out. Run on a throwaway local PostgreSQL database via
-- src/datastore/supabase/tests/run.sh, never on the real Supabase project.
--
-- How a "refuse" test works: we try a bad change inside a small block. If the
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

-- Copy Supabase's default: new tables give service_role extra permissions
-- (seen on the real project: TRUNCATE, TRIGGER, REFERENCES). Without this
-- line the local test would miss them, as it did before 002 existed.
alter default privileges in schema public grant all on tables to service_role;

-- Build the tables exactly as the owner did in Supabase, in order.
\i src/datastore/supabase/migrations/001_create_nudge_repository.sql
\i src/datastore/supabase/migrations/002_service_role_read_only.sql

-- Load the owner's data the way the dashboard's CSV import does: nudges first,
-- then examples (examples need their nudge codes to exist already).
\copy public.nudges (code, name, category, self_report_allowed, description_max_chars, photo_upload_allowed, photo_idea, active, starts_unlocked) from 'src/datastore/supabase/seed/nudges-first-load.csv' with (format csv, header true)
\copy public.examples (nudge_code, example) from 'src/datastore/supabase/seed/examples-first-load.csv' with (format csv, header true)

-- Test: the first load.
do $$
begin
  assert (select count(*) from public.nudges) = 9, 'expected 9 nudges';
  assert (select array_agg(id order by id) from public.nudges) = array[1,2,3,4,5,6,7,8,9]::bigint[], 'expected IDs 1 to 9';
  assert (select string_agg(code, ',' order by id) from public.nudges) = 'TWC,SAF,DPR,GAT,SQT,IAC,SGE,ITE,ASD', 'expected the agreed codes';
  assert (select count(*) from public.nudges where category = 'quick') = 4, 'expected 4 quick';
  assert (select count(*) from public.nudges where starts_unlocked) = 9, 'expected all 9 unlocked at start (rule 2.2)';
  -- [2026-10-31 17:43 SGT] 45 first examples plus 32 approved on 31 Oct (D6).
  assert (select count(*) from public.examples) = 77, 'expected 77 examples';
  assert (select string_agg(nudge_code || ':' || n, ',' order by nudge_code)
          from (select nudge_code, count(*) as n from public.examples group by nudge_code) c)
         = 'ASD:10,DPR:10,GAT:10,IAC:7,ITE:10,SAF:10,SGE:6,SQT:6,TWC:8', 'expected the agreed number of examples per nudge';
  assert (select count(*) from public.examples where active) = 77, 'expected examples to be active by default';
  assert (select count(*) from public.nudge_examples_view) = 77, 'expected the combined view to show 77 rows';
  raise notice 'PASS: first load (9 nudges with agreed codes, 77 examples, agreed count per nudge, view shows all 77)';
end $$;

-- Helper: try one SQL statement and expect the database to refuse it. If a
-- message pattern is given, the refusal message must match it too.
create function pg_temp.expect_refused(label text, statement text, message_pattern text default null) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if message_pattern is not null and sqlerrm !~* message_pattern then
      raise exception 'FAIL: % was refused, but with the wrong message: %', label, sqlerrm;
    end if;
    raise notice 'PASS: refused %', label;
    return;
  end;
  raise exception 'FAIL: % SHOULD HAVE BEEN REFUSED', label;
end $$;

-- ---- Bad nudge rows ----
-- (a valid new nudge would be: 'NEW', 'New one', 'quick', true, false, true)
select pg_temp.expect_refused('a category other than quick or deliberate',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('NEW', 'New one', 'medium', true, false, true)$q$);
select pg_temp.expect_refused('a blank name',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('NEW', '   ', 'quick', true, false, true)$q$);
select pg_temp.expect_refused('a lower-case code',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('new', 'New one', 'quick', true, false, true)$q$);
select pg_temp.expect_refused('a code with a space',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('NE W', 'New one', 'quick', true, false, true)$q$);
select pg_temp.expect_refused('a duplicate code',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('TWC', 'New one', 'quick', true, false, true)$q$);
select pg_temp.expect_refused('a duplicate name (ignoring capitals and spaces)',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('NEW', '  showing  AFFECTION ', 'quick', true, false, true)$q$);
select pg_temp.expect_refused('an empty yes/no (self-report allowed)',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('NEW', 'New one', 'quick', null, false, true)$q$);
select pg_temp.expect_refused('a description limit above 280',
  $q$insert into public.nudges (code, name, category, self_report_allowed, description_max_chars, photo_upload_allowed, starts_unlocked) values ('NEW', 'New one', 'quick', true, 281, false, true)$q$);
select pg_temp.expect_refused('photos allowed but no photo idea',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, photo_idea, starts_unlocked) values ('NEW', 'New one', 'deliberate', true, true, '  ', true)$q$);
select pg_temp.expect_refused('no way to log (no self-report, no photo)',
  $q$insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values ('NEW', 'New one', 'quick', false, false, true)$q$);
select pg_temp.expect_refused('typing your own nudge ID (IDs are generated)',
  $q$insert into public.nudges (id, code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked) values (42, 'NEW', 'New one', 'quick', true, false, true)$q$);
select pg_temp.expect_refused('deleting a nudge that still has examples (retire it instead)',
  $q$delete from public.nudges where code = 'TWC'$q$);

-- ---- Bad example rows ----
select pg_temp.expect_refused('an example whose code matches no nudge (typo TCW)',
  $q$insert into public.examples (nudge_code, example) values ('TCW', 'A new idea')$q$);
select pg_temp.expect_refused('a blank example',
  $q$insert into public.examples (nudge_code, example) values ('TWC', '   ')$q$);
select pg_temp.expect_refused('typing your own example ID (IDs are generated)',
  $q$insert into public.examples (id, nudge_code, example) values (999, 'TWC', 'A new idea')$q$);

-- ---- The 3-example guard (block) ----
-- TWC starts with 8 active examples (5 before 31 Oct). Retiring 5 leaves 3: allowed.
do $$
begin
  update public.examples set active = false
  where id in (select id from public.examples where nudge_code = 'TWC' order by id limit 5);
  assert (select count(*) from public.examples where nudge_code = 'TWC' and active) = 3, 'expected 3 left';
  raise notice 'PASS: retiring examples down to exactly 3 is allowed';
end $$;

-- Now TWC has exactly 3 active examples: any change that takes one away is refused.
select pg_temp.expect_refused('retiring an example that would leave TWC with 2',
  $q$update public.examples set active = false where id = (select max(id) from public.examples where nudge_code = 'TWC' and active)$q$,
  'TWC would have only 2 active example');
select pg_temp.expect_refused('deleting an example that would leave TWC with 2',
  $q$delete from public.examples where id = (select max(id) from public.examples where nudge_code = 'TWC' and active)$q$,
  'Add another example first');
select pg_temp.expect_refused('moving an example from TWC to SAF (TWC would have 2)',
  $q$update public.examples set nudge_code = 'SAF' where id = (select max(id) from public.examples where nudge_code = 'TWC' and active)$q$,
  'TWC would have only 2');
-- SAF starts with 10 (5 before 31 Oct): deleting 8 in one change would leave 2.
select pg_temp.expect_refused('deleting 8 of SAF''s 10 examples in one change',
  $q$delete from public.examples where id in (select id from public.examples where nudge_code = 'SAF' order by id limit 8)$q$,
  'SAF would have only 2');

do $$
begin
  -- Editing only the text of an example is always fine.
  update public.examples set example = example || ' (edited)'
  where id = (select max(id) from public.examples where nudge_code = 'TWC' and active);
  -- Add a 4th first, then retire one: allowed ("add another example first").
  insert into public.examples (nudge_code, example) values ('TWC', 'A fresh idea');
  update public.examples set active = false
  where id = (select min(id) from public.examples where nudge_code = 'TWC' and active);
  assert (select count(*) from public.examples where nudge_code = 'TWC' and active) = 3, 'expected 3 active';
  raise notice 'PASS: editing text, and adding one before retiring one, are allowed';
end $$;

-- A brand-new nudge may start with fewer than 3 examples (the app flags it).
do $$
begin
  insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked)
  values ('NEW', 'A brand new nudge', 'quick', true, false, false);
  insert into public.examples (nudge_code, example) values ('NEW', 'First idea');
  assert (select count(*) from public.examples where nudge_code = 'NEW') = 1, 'expected 1 example';
  assert (select active from public.nudges where code = 'NEW'), 'expected new nudges to be active by default';
  raise notice 'PASS: a new nudge can be added and filled in one example at a time';
end $$;

-- Changing a nudge's code: its examples follow automatically, nothing is lost.
do $$
begin
  update public.nudges set code = 'TWX' where code = 'TWC';
  assert (select count(*) from public.examples where nudge_code = 'TWX' and active) = 3, 'expected examples to follow the new code';
  assert not exists (select 1 from public.examples where nudge_code = 'TWC'), 'expected no examples left on the old code';
  raise notice 'PASS: changing a nudge''s code moves its examples with it';
end $$;

-- ---- Security ----
do $$
begin
  assert has_table_privilege('service_role', 'public.nudges', 'select'), 'service_role should read nudges';
  assert has_table_privilege('service_role', 'public.examples', 'select'), 'service_role should read examples';
  -- Read-only means nothing else at all (spec: least privilege).
  assert not has_table_privilege('service_role', 'public.examples', 'insert'), 'service_role should not insert';
  assert not has_table_privilege('service_role', 'public.nudges', 'delete'), 'service_role should not delete';
  assert not has_table_privilege('service_role', 'public.nudges', 'truncate'), 'service_role should not truncate nudges';
  assert not has_table_privilege('service_role', 'public.examples', 'truncate'), 'service_role should not truncate examples';
  assert not has_table_privilege('service_role', 'public.examples', 'trigger'), 'service_role should not add triggers';
  assert not has_table_privilege('service_role', 'public.nudges', 'references'), 'service_role should not add references';
  assert not has_table_privilege('service_role', 'public.nudge_examples_view', 'truncate'), 'service_role should have nothing on the view';
  assert not has_table_privilege('anon', 'public.nudges', 'select'), 'anon should not read nudges';
  assert not has_table_privilege('anon', 'public.examples', 'select'), 'anon should not read examples';
  assert not has_table_privilege('authenticated', 'public.examples', 'select'), 'authenticated should not read examples';
  assert not has_table_privilege('anon', 'public.nudge_examples_view', 'select'), 'anon should not read the view';
  assert not has_function_privilege('anon', 'public.examples_keep_minimum()', 'execute'), 'anon should not run the guard';
  assert (select relrowsecurity from pg_class where oid = 'public.nudges'::regclass), 'RLS should be on for nudges';
  assert (select relrowsecurity from pg_class where oid = 'public.examples'::regclass), 'RLS should be on for examples';
  raise notice 'PASS: permissions (server reads only; public roles locked out; RLS on)';
end $$;

\o
\echo 'ALL DATABASE TESTS PASSED'
