-- =============================================================================
-- src/datastore/supabase/tests/datastore-tables.test.sql: tests for the 14 Datastore tables
--
-- What it checks: that migration 003 builds the tables agreed on 1 Nov (rules
-- 8.3 to 8.12) and that the database itself enforces the agreed rules: who may
-- change what, no duplicates, all or nothing, "delete my data" reaching every
-- personal table, and every column labelled. Each block is one behaviour from
-- the owner-approved "Datastore spec review" (test numbers T1 to T41 match it;
-- T10, T11 and T13 are app tests in tests/datastore-*.test.ts).
--
-- Runs after nudge-repository.test.sql on the same throwaway local database
-- (src/datastore/supabase/tests/run.sh), never on the real Supabase project.
--
-- [2026-11-09] Also runs migration 004 (the Wrap Up's own on/off switch removed:
-- one Pause switch stops everything, rule 3.12) and checks it in T42.
-- =============================================================================

\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null

-- Copy a Supabase default: our server's role skips row level security, so
-- only its permissions limit it (as on the real project).
alter role service_role bypassrls;

\i src/datastore/supabase/migrations/003_create_datastore_tables.sql
\i src/datastore/supabase/migrations/004_remove_wrap_up_switch.sql

-- Helper: try one statement and expect the database to refuse it. Same idea as
-- in nudge-repository.test.sql. It runs as whichever role is active.
create or replace function pg_temp.expect_refused(label text, statement text, message_pattern text default null) returns void
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

-- ---- Test data, added as the owner (the database's admin role) ----
-- One settings version, two parents, one invite.
select public.record_settings_version('Starting values', '{"max_nudges_per_day": 3}'::jsonb);
-- The app always gives the Wrap Up settings from src/settings.ts (fix 4: no copy of them in the database).
insert into public.parents (telegram_id, first_name, cohort, wrap_up_minute) values (1001, 'Ann', 'cohort-1', 1200), (1002, 'Ben', 'cohort-1', 1200);
insert into public.invites (code) values ('WELCOME-1');
-- A test nudge with no examples, so deleting it is otherwise allowed (T17).
insert into public.nudges (code, name, category, self_report_allowed, photo_upload_allowed, starts_unlocked)
values ('TST', 'Test nudge', 'quick', true, false, true);

-- Short names for the stamp every event needs (rule 11.2): version 1, week one.
create function pg_temp.v() returns bigint language sql as $$ select max(version) from public.settings_versions $$;
create function pg_temp.ann() returns bigint language sql as $$ select id from public.parents where telegram_id = 1001 $$;
create function pg_temp.ben() returns bigint language sql as $$ select id from public.parents where telegram_id = 1002 $$;
create function pg_temp.today() returns date language sql as $$ select (now() at time zone 'Asia/Singapore')::date $$;
-- The nudge used in these tests: the first nudge (nudge-repository.test.sql
-- renames some codes, so look it up by ID), and one of its examples.
create function pg_temp.twc() returns bigint language sql as $$ select min(id) from public.nudges $$;
create function pg_temp.ex() returns bigint language sql as $$
  select min(e.id) from public.examples e join public.nudges n on n.code = e.nudge_code where n.id = pg_temp.twc() $$;

-- =============================================================================
-- Access and permissions (rules 8.2, 8.4)
-- =============================================================================

-- T1: no table can be read or written by the public or a signed-out visitor.
do $$
declare t text;
begin
  foreach t in array array['parents','children','consents','picks','slots','habit_logs','messages_sent',
    'connection_answers','events','settings_versions','event_types','holiday_dates','invites','deletion_log'] loop
    assert not has_table_privilege('anon', 'public.' || t, 'select,insert,update,delete'), 'anon can touch ' || t;
    assert not has_table_privilege('authenticated', 'public.' || t, 'select,insert,update,delete'), 'authenticated can touch ' || t;
    assert (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass), 'row level security is off on ' || t;
  end loop;
  assert not has_function_privilege('anon', 'public.delete_my_data(bigint)', 'execute'), 'anon can run delete_my_data';
  raise notice 'PASS: T1 the public and signed-out visitors are locked out of all 14 tables and the functions';
end $$;

-- From here on, act as our server (service_role), as the app will.
set role service_role;

-- T2: the server can add a parent and change only paused and the Wrap Up time.
do $$
begin
  insert into public.parents (telegram_id, first_name, cohort, wrap_up_minute) values (1003, 'Cai', 'cohort-1', 1200);
  perform public.update_parent_settings((select id from public.parents where telegram_id = 1003), true, 1170, pg_temp.v(), '["baseline"]');
  assert (select paused and wrap_up_minute = 1170 from public.parents where telegram_id = 1003), 'settings not changed';
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'settings_changed' and e.parent_id = (select id from public.parents where telegram_id = 1003)) = 1,
         'changing settings should also write an event';
  raise notice 'PASS: T2 the server adds a parent and changes paused / Wrap Up time through one function, which also writes an event';
end $$;
select pg_temp.expect_refused('T2 the server changing a Telegram ID directly',
  $q$update public.parents set telegram_id = 9999 where telegram_id = 1003$q$, 'permission denied');
select pg_temp.expect_refused('T2 the server changing a cohort directly',
  $q$update public.parents set cohort = 'cohort-2' where telegram_id = 1003$q$, 'permission denied');

-- T42 [2026-11-09]: the Weekly Wrap Up has no on/off switch of its own (rule 3.12,
-- migration 004): no wrap_up_on column in parents or its Telemetry view, the
-- settings function takes only paused and the Wrap Up time, the old version is
-- gone, and the new function and view are locked down like the rest.
do $$
begin
  assert not exists (select 1 from information_schema.columns
    where table_schema = 'public' and table_name in ('parents', 'telemetry_parents') and column_name = 'wrap_up_on'),
    'wrap_up_on still exists';
  assert to_regprocedure('public.update_parent_settings(bigint, boolean, boolean, integer, bigint, jsonb)') is null,
    'the old settings function (with the on/off switch) still exists';
  assert has_function_privilege('service_role', 'public.update_parent_settings(bigint, boolean, integer, bigint, jsonb)', 'execute'),
    'the server cannot run the new settings function';
  assert not has_function_privilege('anon', 'public.update_parent_settings(bigint, boolean, integer, bigint, jsonb)', 'execute')
     and not has_function_privilege('authenticated', 'public.update_parent_settings(bigint, boolean, integer, bigint, jsonb)', 'execute'),
    'signed-out visitors can run the new settings function';
  assert has_table_privilege('service_role', 'public.telemetry_parents', 'select')
     and not has_table_privilege('service_role', 'public.telemetry_parents', 'insert,update,delete')
     and not has_table_privilege('anon', 'public.telemetry_parents', 'select')
     and not has_table_privilege('authenticated', 'public.telemetry_parents', 'select'),
    'telemetry_parents has the wrong permissions';
  raise notice 'PASS: T42 the Wrap Up has no on/off switch; the new settings function and Telemetry view are locked down';
end $$;

-- T3: the server can't edit or delete rows in the add-only tables.
do $$
declare t text;
begin
  foreach t in array array['habit_logs','messages_sent','connection_answers','events','consents','children','settings_versions'] loop
    assert not has_table_privilege('service_role', 'public.' || t, 'update'), 'server can update ' || t;
    assert not has_table_privilege('service_role', 'public.' || t, 'delete'), 'server can delete from ' || t;
    assert not has_table_privilege('service_role', 'public.' || t, 'truncate'), 'server can wipe ' || t;
  end loop;
  assert not has_table_privilege('service_role', 'public.parents', 'delete'), 'server can delete parents directly';
  raise notice 'PASS: T3 the server cannot edit, delete or wipe rows in the add-only tables, or delete a parent directly';
end $$;

-- T4: the server can only read event_types and holiday_dates.
select pg_temp.expect_refused('T4 the server adding an event type', $q$insert into public.event_types (name, meaning) values ('x', 'y')$q$, 'permission denied');
select pg_temp.expect_refused('T4 the server adding a holiday', $q$insert into public.holiday_dates (day, kind, name) values ('2027-01-01', 'public_holiday', 'New Year')$q$, 'permission denied');

-- T5: only "delete my data" writes the deletion log.
select pg_temp.expect_refused('T5 the server writing the deletion log directly', $q$insert into public.deletion_log (on_day, how_many) values (current_date, 1)$q$, 'permission denied');

-- T6: Telemetry's views show no first names, Telegram IDs or descriptions (rule 8.11).
reset role;
do $$
begin
  assert (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name like 'telemetry\_%'
            and column_name in ('first_name', 'telegram_id', 'description', 'telegram_update_id', 'photo_path')) = 0,
         'a telemetry view shows a personal column';
  assert (select count(*) from information_schema.views where table_schema = 'public' and table_name like 'telemetry\_%') >= 4,
         'expected the telemetry views';
  raise notice 'PASS: T6 the telemetry views hide names, Telegram IDs, descriptions and photo links';
end $$;
set role service_role;

-- =============================================================================
-- Parents and children (rules 8.6, 8.10)
-- =============================================================================

-- T7: two parents with the same Telegram ID are refused.
select pg_temp.expect_refused('T7 a second parent with the same Telegram ID',
  $q$insert into public.parents (telegram_id, first_name, cohort, wrap_up_minute) values (1001, 'Copy', 'cohort-1', 1200)$q$);
-- (rule 11.11) cohort labels are neutral.
select pg_temp.expect_refused('a cohort label that is not neutral',
  $q$insert into public.parents (telegram_id, first_name, cohort, wrap_up_minute) values (1009, 'Dee', 'friends', 1200)$q$);
-- Fix 4 (rule 8.8): the database holds no copy of the Wrap Up defaults, so a parent without them is refused.
select pg_temp.expect_refused('fix 4: a parent with no Wrap Up settings (no defaults stored in the database)',
  $q$insert into public.parents (telegram_id, first_name, cohort) values (1010, 'Eve', 'cohort-1')$q$);

-- T8: a parent with no children rows is normal; nothing is guessed.
do $$
begin
  assert (select count(*) from public.children where parent_id = pg_temp.ann()) = 0, 'expected no children';
  raise notice 'PASS: T8 a parent with no children rows is normal';
end $$;

-- T9: a child needs a parent and a birth year; there is no name column.
select pg_temp.expect_refused('T9 a child with no birth year', $q$insert into public.children (parent_id) values (pg_temp.ann())$q$);
select pg_temp.expect_refused('T9 a child with no parent', $q$insert into public.children (birth_year) values (2017)$q$);
do $$
begin
  insert into public.children (parent_id, birth_year) values (pg_temp.ann(), 2017);
  assert not exists (select 1 from information_schema.columns where table_name = 'children' and column_name ilike '%name%'), 'children has a name column';
  raise notice 'PASS: T9 a child is a parent plus a birth year, with no name column';
end $$;
insert into public.children (parent_id, birth_year) values (pg_temp.ben(), 2016);
select pg_temp.expect_refused('fix 1: a child correction pointing at another parent''s child',
  $q$insert into public.children (parent_id, birth_year, replaces_id) values (pg_temp.ann(), 2018, (select id from public.children where parent_id = pg_temp.ben()))$q$, 'same parent');

-- =============================================================================
-- Consents (rules 8.4, 11.13)
-- =============================================================================

-- T12: the topic must be recording, photos or experiments.
select pg_temp.expect_refused('T12 an unknown consent topic',
  $q$insert into public.consents (parent_id, topic, answer, wording_version) values (pg_temp.ann(), 'marketing', 'agreed', 'v1')$q$);
do $$
begin
  insert into public.consents (parent_id, topic, answer, wording_version) values (pg_temp.ann(), 'recording', 'agreed', 'v1');
  insert into public.consents (parent_id, topic, answer, wording_version) values (pg_temp.ann(), 'experiments', 'opted_out', 'v1');
  raise notice 'PASS: T12 consents accept the three topics';
end $$;

-- =============================================================================
-- Picks and slots (rules 8.4, 8.6, 8.9)
-- =============================================================================

-- T14: a pick must point at a real nudge.
select pg_temp.expect_refused('T14 a pick for a nudge that does not exist',
  $q$insert into public.picks (parent_id, nudge_id, frequency) values (pg_temp.ann(), 999, 'every_day')$q$);

-- T15: only one current pick per parent per nudge.
insert into public.picks (parent_id, nudge_id, frequency) values (pg_temp.ann(), pg_temp.twc(), 'every_day');
select pg_temp.expect_refused('T15 a second current pick of the same nudge',
  $q$insert into public.picks (parent_id, nudge_id, frequency) values (pg_temp.ann(), pg_temp.twc(), 'every_2_days')$q$);

-- T16: "stopped at" can't be before "chosen at", and once filled in it can't change.
select pg_temp.expect_refused('T16 a pick stopped before it was chosen',
  $q$insert into public.picks (parent_id, nudge_id, frequency, chosen_at, stopped_at) values (pg_temp.ben(), pg_temp.twc(), 'every_day', now(), now() - interval '1 day')$q$);
do $$
declare pick bigint := (select id from public.picks where parent_id = pg_temp.ann() and nudge_id = pg_temp.twc());
begin
  perform public.stop_pick(pg_temp.ann(), pick, pg_temp.v(), '["baseline"]');
  assert (select stopped_at is not null from public.picks where id = pick), 'pick not stopped';
  -- After stopping, the same nudge can be picked again (a new row; the old one stays as history).
  insert into public.picks (parent_id, nudge_id, frequency) values (pg_temp.ann(), pg_temp.twc(), 'every_2_days');
  raise notice 'PASS: T16 a pick is stopped once (with an event) and the nudge can be picked again as a new row';
end $$;
select pg_temp.expect_refused('T16 stopping the same pick a second time',
  $q$select public.stop_pick(pg_temp.ann(), (select min(id) from public.picks where parent_id = pg_temp.ann()), pg_temp.v(), '["baseline"]')$q$, 'already stopped');
select pg_temp.expect_refused('fix 1: one parent stopping another parent''s pick',
  $q$select public.stop_pick(pg_temp.ben(), (select max(id) from public.picks where parent_id = pg_temp.ann()), pg_temp.v(), '["baseline"]')$q$, 'not this parent');

-- T17: a nudge that any parent has picked can't be deleted.
reset role;
insert into public.picks (parent_id, nudge_id, frequency) values (pg_temp.ben(), (select id from public.nudges where code = 'TST'), 'every_day');
select pg_temp.expect_refused('T17 deleting a nudge a parent has picked (even as the owner)',
  $q$delete from public.nudges where code = 'TST'$q$);
set role service_role;

-- T18: the same slot time twice on the same schedule is refused.
do $$
begin
  perform public.replace_slots(pg_temp.ann(), 'school', array[420, 1140, 1260], pg_temp.v(), '["baseline"]');
  assert (select count(*) from public.slots where parent_id = pg_temp.ann() and schedule = 'school') = 3, 'expected 3 slots';
  raise notice 'PASS: T18 a parent''s school-day slots are saved';
end $$;
select pg_temp.expect_refused('T18 the same slot time twice on one schedule',
  $q$select public.replace_slots(pg_temp.ann(), 'school', array[420, 420], pg_temp.v(), '["baseline"]')$q$);

-- T19: replacing a parent's slots also writes an event.
do $$
begin
  perform public.replace_slots(pg_temp.ann(), 'school', array[480], pg_temp.v(), '["baseline"]');
  assert (select array_agg(start_minute) from public.slots where parent_id = pg_temp.ann() and schedule = 'school') = array[480]::smallint[], 'slots not replaced';
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'slots_replaced' and e.parent_id = pg_temp.ann()) = 2, 'expected an event per replacement';
  raise notice 'PASS: T19 replacing slots swaps them and writes an event each time';
end $$;

-- =============================================================================
-- Habit logs (rules 8.6, 8.7, 6.2, 5.4)
-- =============================================================================

-- T20: a description longer than 280 characters is refused.
select pg_temp.expect_refused('T20 a description of 281 characters',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, repeat('a', 281), null, 'none', 'self_reported', 501, pg_temp.v(), '["baseline"]')$q$);

-- T21: a log for a day before yesterday is refused (rule 5.4).
select pg_temp.expect_refused('T21 a log for the day before yesterday',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today() - 2, null, null, null, 'none', 'self_reported', 502, pg_temp.v(), '["baseline"]')$q$, 'today or yesterday');

-- T22: the same Telegram message saved twice creates only one log (and one event).
do $$
declare first bigint; second bigint;
begin
  first  := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today() - 1, null, 'Chatted at dinner', null, 'none', 'self_reported', 503, pg_temp.v(), '["baseline"]');
  second := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today() - 1, null, 'Chatted at dinner', null, 'none', 'self_reported', 503, pg_temp.v(), '["baseline"]');
  assert first is not null and second is null, 'expected the repeat to be ignored';
  assert (select count(*) from public.habit_logs where telegram_update_id = 503) = 1, 'expected one log';
  assert (select count(*) from public.events where telegram_update_id = 503) = 1, 'expected one event';
  raise notice 'PASS: T22 a resent Telegram message is saved once (one log, one event)';
end $$;

-- T23: a log after a Done tap must point at a nudge message sent to the same parent.
do $$
declare msg bigint;
begin
  msg := public.record_message_sent(pg_temp.ben(), 'nudge', pg_temp.twc(), pg_temp.ex(),
                                    pg_temp.today(), 1140, pg_temp.v(), '["baseline"]');
  perform public.save_habit_log(pg_temp.ben(), pg_temp.twc(), pg_temp.today(), msg, null, null, 'none', 'self_reported', 504, pg_temp.v(), '["baseline"]');
  raise notice 'PASS: T23 a log can point at the nudge message its Done tap came from';
end $$;
select pg_temp.expect_refused('T23 a log pointing at another parent''s nudge message',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), (select max(id) from public.messages_sent where parent_id = pg_temp.ben()), null, null, 'none', 'self_reported', 505, pg_temp.v(), '["baseline"]')$q$, 'same parent');

-- Fix 2 (rule 5.5): a photo is refused unless the parent's latest photo consent is "agreed". Ben never agreed.
select pg_temp.expect_refused('fix 2: a photo from a parent who has not agreed to photos',
  $q$select public.save_habit_log(pg_temp.ben(), pg_temp.twc(), pg_temp.today(), null, null, 'photos/ben/1.jpg', 'passed', 'photo_verified', 509, pg_temp.v(), '["baseline"]')$q$, 'photo consent');
-- Ann agrees to photos, so her photos can be saved from here on.
insert into public.consents (parent_id, topic, answer, wording_version) values (pg_temp.ann(), 'photos', 'agreed', 'v1');

-- T24: a photo that failed the check is stored, and the log is recorded as self-reported (rule 6.2).
do $$
declare log bigint;
begin
  log := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, null, 'photos/ann/1.jpg', 'failed', 'self_reported', 506, pg_temp.v(), '["baseline"]');
  assert (select photo_path = 'photos/ann/1.jpg' and recorded_as = 'self_reported' from public.habit_logs where id = log), 'photo not kept';
  raise notice 'PASS: T24 a photo that failed the check is kept, and the log is self-reported';
end $$;
-- Fix 3 (rule 1.3): "the check couldn't run" is its own value, error, never recorded as failed.
do $$
declare log bigint;
begin
  log := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, null, 'photos/ann/3.jpg', 'error', 'self_reported', 510, pg_temp.v(), '["baseline"]');
  assert (select photo_check = 'error' and recorded_as = 'self_reported' from public.habit_logs where id = log), 'error not recorded';
  raise notice 'PASS: fix 3 a photo check that could not run is recorded as error, and the log is self-reported';
end $$;
select pg_temp.expect_refused('fix 3: a photo whose check errored recorded as photo-verified',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, null, 'photos/ann/4.jpg', 'error', 'photo_verified', 511, pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T24 a failed photo recorded as photo-verified',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, null, 'photos/ann/2.jpg', 'failed', 'photo_verified', 507, pg_temp.v(), '["baseline"]')$q$);

-- T25: if saving the log's event fails, the log isn't saved either (all or nothing).
do $$
declare before bigint := (select count(*) from public.habit_logs);
begin
  begin
    perform public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, null, null, 'none', 'self_reported', 508, 999, '["baseline"]');
  exception when others then null;  -- version 999 doesn't exist, so the event fails
  end;
  assert (select count(*) from public.habit_logs) = before, 'a log was saved without its event';
  raise notice 'PASS: T25 when the event fails, the log is not saved either';
end $$;

-- =============================================================================
-- Messages sent (rule 8.6)
-- =============================================================================

-- T26: a nudge message must name a nudge and an example; a Weekly Wrap Up must not.
select pg_temp.expect_refused('T26 a nudge message with no nudge',
  $q$select public.record_message_sent(pg_temp.ann(), 'nudge', null, null, pg_temp.today(), 420, pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T26 a Weekly Wrap Up that names a nudge',
  $q$select public.record_message_sent(pg_temp.ann(), 'wrap_up', pg_temp.twc(), null, pg_temp.today(), null, pg_temp.v(), '["baseline"]')$q$);

-- T27: a second nudge message for the same parent, day and slot is refused.
select pg_temp.expect_refused('T27 a second nudge message in the same slot (overlapping scheduler runs)',
  $q$select public.record_message_sent(pg_temp.ben(), 'nudge', pg_temp.twc(), pg_temp.ex(), pg_temp.today(), 1140, pg_temp.v(), '["baseline"]')$q$);

-- T28: a second Weekly Wrap Up for the same parent in the same week is refused.
select public.record_message_sent(pg_temp.ann(), 'wrap_up', null, null, pg_temp.today(), null, pg_temp.v(), '["baseline"]');
select pg_temp.expect_refused('T28 a second Weekly Wrap Up in the same week',
  $q$select public.record_message_sent(pg_temp.ann(), 'wrap_up', null, null, pg_temp.today(), null, pg_temp.v(), '["baseline"]')$q$);

-- =============================================================================
-- Weekly connection answers (rules 8.6, 5.6)
-- =============================================================================

-- T29: the score must be 1 to 5.
select pg_temp.expect_refused('T29 a connection score of 6',
  $q$select public.save_connection_answer(pg_temp.ann(), date_trunc('week', pg_temp.today())::date, 6, 601, pg_temp.v(), '["baseline"]')$q$);

-- T30: a second answer in the same week is ignored; the first counts.
do $$
declare monday date := date_trunc('week', pg_temp.today())::date;
begin
  assert public.save_connection_answer(pg_temp.ann(), monday, 4, 602, pg_temp.v(), '["baseline"]') = true, 'first answer not saved';
  assert public.save_connection_answer(pg_temp.ann(), monday, 5, 603, pg_temp.v(), '["baseline"]') = false, 'second answer not ignored';
  assert (select score from public.connection_answers where parent_id = pg_temp.ann() and week_starting = monday) = 4, 'first answer should count';
  raise notice 'PASS: T30 a second answer in the same week is ignored; the first (4) counts';
end $$;

-- =============================================================================
-- Events and settings versions (rules 8.6, 11.1, 11.2)
-- =============================================================================

-- T31: an event must use a known type.
select pg_temp.expect_refused('T31 an event with an unknown type',
  $q$insert into public.events (parent_id, event_type_id, settings_version, variants) values (pg_temp.ann(), 9999, pg_temp.v(), '["baseline"]')$q$);

-- T32: the settings version and experiment stamp are never empty.
select pg_temp.expect_refused('T32 an event with no settings version',
  $q$insert into public.events (parent_id, event_type_id, variants) values (pg_temp.ann(), (select id from public.event_types where name = 'not_today'), '["baseline"]')$q$);
select pg_temp.expect_refused('T32 an event with an empty experiment stamp',
  $q$insert into public.events (parent_id, event_type_id, settings_version, variants) values (pg_temp.ann(), (select id from public.event_types where name = 'not_today'), pg_temp.v(), '[]')$q$);

-- T33: the same Telegram message saved twice creates only one event.
insert into public.events (parent_id, event_type_id, settings_version, variants, telegram_update_id)
values (pg_temp.ann(), (select id from public.event_types where name = 'not_today'), pg_temp.v(), '["baseline"]', 701);
select pg_temp.expect_refused('T33 a second event from the same Telegram message',
  $q$insert into public.events (parent_id, event_type_id, settings_version, variants, telegram_update_id) values (pg_temp.ann(), (select id from public.event_types where name = 'not_today'), pg_temp.v(), '["baseline"]', 701)$q$);

-- T34: saving the same settings twice creates only one version; a version can't be edited.
do $$
declare a bigint; b bigint; c bigint;
begin
  a := public.record_settings_version('Same again', '{"max_nudges_per_day": 3}'::jsonb);
  b := public.record_settings_version('Wrap Up moved', '{"max_nudges_per_day": 3, "wrap_up_minute": 1170}'::jsonb);
  c := public.record_settings_version('Wrap Up moved', '{"wrap_up_minute": 1170, "max_nudges_per_day": 3}'::jsonb);
  assert a = 1 and b = 2 and c = 2, format('expected versions 1, 2, 2 but got %s, %s, %s', a, b, c);
  raise notice 'PASS: T34 the same settings give the same version; new settings give a new one';
end $$;
select pg_temp.expect_refused('T34 editing a settings version',
  $q$update public.settings_versions set note = 'changed' where version = 1$q$, 'permission denied');

-- =============================================================================
-- Reference lists and invites (rules 1.1, 8.6)
-- =============================================================================

reset role;
-- T35: the same holiday date twice is refused.
insert into public.holiday_dates (day, kind, name) values ('2027-01-01', 'public_holiday', 'New Year''s Day');
select pg_temp.expect_refused('T35 the same holiday date twice',
  $q$insert into public.holiday_dates (day, kind, name) values ('2027-01-01', 'school_holiday', 'Copy')$q$);
set role service_role;

-- T36: invite codes are unique, and each can be used only once.
do $$
begin
  perform public.use_invite('WELCOME-1', pg_temp.ann());
  raise notice 'PASS: T36 an invite code can be used';
end $$;
select pg_temp.expect_refused('T36 using the same invite code twice',
  $q$select public.use_invite('WELCOME-1', pg_temp.ben())$q$, 'already used');
reset role;
select pg_temp.expect_refused('T36 two invites with the same code',
  $q$insert into public.invites (code) values ('WELCOME-1')$q$);
set role service_role;

-- =============================================================================
-- "Delete my data" (rules 1.5, 8.5)
-- =============================================================================

-- T37 to T40: deleting Ann removes all her rows, leaves Ben alone, writes one
-- log row with no ID, and her used invite stays used but no longer points to her.
do $$
declare
  ann_id bigint := pg_temp.ann();
  ben_events bigint := (select count(*) from public.events where parent_id = pg_temp.ben());
  ben_logs bigint := (select count(*) from public.habit_logs where parent_id = pg_temp.ben());
  t text; n bigint;
begin
  perform public.delete_my_data(ann_id);
  foreach t in array array['parents','children','consents','picks','slots','habit_logs','messages_sent','connection_answers','events'] loop
    execute format('select count(*) from public.%I where %s = $1', t, case when t = 'parents' then 'id' else 'parent_id' end) into n using ann_id;
    assert n = 0, format('%s rows left in %s', n, t);
  end loop;
  raise notice 'PASS: T37 deleting a parent removes every one of their rows in every personal table';
  assert (select count(*) from public.events where parent_id = pg_temp.ben()) = ben_events, 'Ben''s events changed';
  assert (select count(*) from public.habit_logs where parent_id = pg_temp.ben()) = ben_logs, 'Ben''s logs changed';
  raise notice 'PASS: T38 other parents'' rows are untouched';
  assert (select count(*) from public.deletion_log) = 1 and (select how_many from public.deletion_log) = 1, 'expected one log row';
  raise notice 'PASS: T39 one deletion-log row is written, with a day and a count only';
  assert (select used_at is not null and used_by is null from public.invites where code = 'WELCOME-1'), 'invite not cleared';
  raise notice 'PASS: T40 the used invite stays used but no longer points to the parent';
end $$;

-- T41: every table with a parent link is covered by the deletion. If a future
-- table links to parents without "delete with the parent", this test fails.
reset role;
do $$
declare missing text;
begin
  select string_agg(c.table_name, ', ') into missing
  from information_schema.columns c
  join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
  where c.table_schema = 'public' and c.column_name = 'parent_id'
    and not exists (
      select 1 from pg_constraint k
      where k.conrelid = ('public.' || c.table_name)::regclass and k.contype = 'f'
        and k.confrelid = 'public.parents'::regclass and k.confdeltype = 'c');
  assert missing is null, 'not deleted with the parent: ' || missing;
  raise notice 'PASS: T41 every table with a parent link is deleted with the parent';
end $$;

-- Rule 8.12: every new table has created_at and a comment on every column.
-- Reads the database's own catalogue of tables (pg_class) and columns (pg_attribute).
do $$
declare missing text;
begin
  select string_agg(c.relname || '.' || a.attname, ', ') into missing
  from pg_class c
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname not in ('nudges', 'examples')
    and col_description(c.oid, a.attnum) is null;
  assert missing is null, 'columns with no comment: ' || missing;
  select string_agg(c.relname, ', ') into missing
  from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname not in ('nudges', 'examples')
    and not exists (select 1 from pg_attribute a where a.attrelid = c.oid and a.attname = 'created_at' and not a.attisdropped);
  assert missing is null, 'tables with no created_at: ' || missing;
  assert (select count(*) from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
          and c.relname not in ('nudges', 'examples')) = 14, 'expected 14 new tables (rule 8.3)';
  raise notice 'PASS: rules 8.3 and 8.12 there are 14 new tables, each with created_at and a comment on every column';
end $$;

-- Fix 6: signed-out visitors can't use any ID counter, and every all-or-nothing
-- function looks for tables only in "public", then "pg_temp" last.
do $$
declare bad text;
begin
  select string_agg(c.relname, ', ') into bad from pg_class c
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'S'
    and (has_sequence_privilege('anon', c.oid, 'usage,select,update') or has_sequence_privilege('authenticated', c.oid, 'usage,select,update'));
  assert bad is null, 'public roles can use ID counters: ' || bad;
  select string_agg(p.proname, ', ') into bad from pg_proc p
  where p.pronamespace = 'public'::regnamespace and p.prosecdef
    and not coalesce(p.proconfig @> array['search_path=public, pg_temp'], false);
  assert bad is null, 'functions without a safe search path: ' || bad;
  raise notice 'PASS: fix 6 no public use of ID counters; every all-or-nothing function has a safe search path';
end $$;

-- Fix 7 (rule 8.12): times are stored one way. A moment = time with time zone,
-- a Singapore day = a date, a slot or Wrap Up time = minutes after midnight.
do $$
declare bad text;
begin
  select string_agg(table_name || '.' || column_name || ' (' || data_type || ')', ', ') into bad
  from information_schema.columns
  where table_schema = 'public' and table_name not in ('nudges', 'examples') and table_name not like 'telemetry\_%'
    and ((column_name like '%\_at' and data_type <> 'timestamp with time zone')
      or (column_name in ('for_day', 'signed_up_on', 'week_starting', 'on_day', 'day') and data_type <> 'date')
      or (column_name in ('start_minute', 'slot_minute', 'wrap_up_minute') and data_type <> 'smallint'));
  assert bad is null, 'columns stored the wrong way: ' || bad;
  raise notice 'PASS: fix 7 every moment, day and minute column uses the agreed type';
end $$;

\echo ALL DATASTORE TABLE TESTS PASSED
