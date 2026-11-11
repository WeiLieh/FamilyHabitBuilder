-- =============================================================================
-- src/datastore/supabase/tests/datastore-tables.test.sql: tests for the 17 Datastore tables
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
--
-- [2026-11-11] Also runs migration 005 (photos, reflections, moment lines, Undo,
-- the connection question as its own message, today-only logs) and checks it in
-- T43 to T53. The old log and photo tests were rewritten for the new functions
-- (CLAUDE.md rule 12): the photo now lives in its own table, so "recorded as
-- photo-verified" is no longer stored and its refusal tests are gone.
-- =============================================================================

\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null

-- Copy a Supabase default: our server's role skips row level security, so
-- only its permissions limit it (as on the real project).
alter role service_role bypassrls;

\i src/datastore/supabase/migrations/003_create_datastore_tables.sql
\i src/datastore/supabase/migrations/004_remove_wrap_up_switch.sql
\i src/datastore/supabase/migrations/005_photos_reflections_moments.sql

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
-- One settings version, two parents, one invite. The version carries the two
-- windows the database checks (src/settings.ts, SETTINGS_KEYS_THE_DATABASE_READS).
select public.record_settings_version('Starting values', '{"max_nudges_per_day": 3, "undo_window_seconds": 30, "connection_answer_window_hours": 24}'::jsonb);
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
    'connection_answers','events','settings_versions','event_types','holiday_dates','invites','deletion_log',
    'photos','reflections','moment_lines'] loop
    assert not has_table_privilege('anon', 'public.' || t, 'select,insert,update,delete'), 'anon can touch ' || t;
    assert not has_table_privilege('authenticated', 'public.' || t, 'select,insert,update,delete'), 'authenticated can touch ' || t;
    assert (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass), 'row level security is off on ' || t;
  end loop;
  assert not has_function_privilege('anon', 'public.delete_my_data(bigint)', 'execute'), 'anon can run delete_my_data';
  raise notice 'PASS: T1 the public and signed-out visitors are locked out of all 17 tables and the functions';
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

-- T6: Telemetry's views show no first names, Telegram IDs, descriptions, typed text or photo storage paths (rule 8.11).
reset role;
do $$
begin
  assert (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name like 'telemetry\_%'
            and column_name in ('first_name', 'telegram_id', 'description', 'telegram_update_id', 'photo_path', 'storage_path', 'text')) = 0,
         'a telemetry view shows a personal column';
  assert (select count(*) from information_schema.views where table_schema = 'public' and table_name like 'telemetry\_%') >= 4,
         'expected the telemetry views';
  raise notice 'PASS: T6 the telemetry views hide names, Telegram IDs, descriptions, typed text and photo links';
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
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'keyboard', repeat('a', 281), 501, pg_temp.v(), '["baseline"]')$q$);

-- T21 [2026-11-11]: a log for any day but today is refused (rule 5.4, today only).
select pg_temp.expect_refused('T21 a log for yesterday',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today() - 1, null, 'keyboard', null, 502, pg_temp.v(), '["baseline"]')$q$, 'only be for today');
select pg_temp.expect_refused('T21 a log for tomorrow',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today() + 1, null, 'keyboard', null, 512, pg_temp.v(), '["baseline"]')$q$, 'only be for today');

-- T22: the same Telegram message saved twice creates only one log (and one event).
do $$
declare first bigint; second bigint;
begin
  first  := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'log_command', 'Chatted at dinner', 503, pg_temp.v(), '["baseline"]');
  second := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'log_command', 'Chatted at dinner', 503, pg_temp.v(), '["baseline"]');
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
  perform public.save_habit_log(pg_temp.ben(), pg_temp.twc(), pg_temp.today(), msg, 'done_button', null, 504, pg_temp.v(), '["baseline"]');
  raise notice 'PASS: T23 a log can point at the nudge message its Done tap came from';
end $$;
select pg_temp.expect_refused('T23 a log pointing at another parent''s nudge message',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), (select max(id) from public.messages_sent where parent_id = pg_temp.ben()), 'done_button', null, 505, pg_temp.v(), '["baseline"]')$q$, 'same parent');

-- T43 [2026-11-11]: every log says how it was made; a Done-button log names its nudge message.
select pg_temp.expect_refused('T43 a log made some other way',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'carrier_pigeon', null, 513, pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T43 a Done-button log with no nudge message',
  $q$select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'done_button', null, 514, pg_temp.v(), '["baseline"]')$q$);

-- Fix 2 (rule 5.5), rewritten [2026-11-11] for add_log_photo: a photo is refused
-- unless the parent's latest photo consent is "agreed". Ben never agreed.
select pg_temp.expect_refused('fix 2: a photo from a parent who has not agreed to photos',
  $q$select public.add_log_photo(pg_temp.ben(), (select id from public.habit_logs where telegram_update_id = 504), 'photos/ben/1.jpg', 'passed', pg_temp.v(), '["baseline"]')$q$, 'photo consent');
-- Ann agrees to photos, so her photos can be saved from here on.
insert into public.consents (parent_id, topic, answer, wording_version) values (pg_temp.ann(), 'photos', 'agreed', 'v1');

-- T24, rewritten [2026-11-11]: the photo is added to a log that is already saved
-- (an add-on, rules 6.1, 6.2). A photo that failed the check is kept, and the log
-- stays self-reported: only a passed photo makes a log photo-checked.
do $$
declare log bigint; pic bigint;
begin
  log := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'keyboard', null, 506, pg_temp.v(), '["baseline"]');
  pic := public.add_log_photo(pg_temp.ann(), log, 'photos/ann/1.jpg', 'failed', pg_temp.v(), '["baseline"]');
  assert (select storage_path = 'photos/ann/1.jpg' and check_result = 'failed' from public.photos where id = pic), 'photo not kept';
  assert not exists (select 1 from public.photos where log_id = log and check_result = 'passed'), 'log should stay self-reported';
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'photo_added' and e.parent_id = pg_temp.ann()) = 1, 'expected a photo_added event';
  raise notice 'PASS: T24 a photo added after the log is kept even if it failed the check; the log stays self-reported';
end $$;
-- Fix 3 (rule 1.3): "the check couldn't run" is its own value, error, never recorded as failed.
do $$
declare log bigint; pic bigint;
begin
  log := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'keyboard', null, 510, pg_temp.v(), '["baseline"]');
  pic := public.add_log_photo(pg_temp.ann(), log, 'photos/ann/3.jpg', 'error', pg_temp.v(), '["baseline"]');
  assert (select check_result = 'error' from public.photos where id = pic), 'error not recorded';
  raise notice 'PASS: fix 3 a photo check that could not run is recorded as error';
end $$;
-- T44 [2026-11-11]: one photo per log; never on another parent's log; a log photo is always checked.
select pg_temp.expect_refused('T44 a second photo on the same log',
  $q$select public.add_log_photo(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 506), 'photos/ann/1b.jpg', 'passed', pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T44 a photo on another parent''s log',
  $q$select public.add_log_photo(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 504), 'photos/ann/x.jpg', 'passed', pg_temp.v(), '["baseline"]')$q$, 'this parent');
select pg_temp.expect_refused('T44 a log photo marked as not checked',
  $q$select public.add_log_photo(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 503), 'photos/ann/y.jpg', 'not_checked', pg_temp.v(), '["baseline"]')$q$);
do $$
declare pic bigint;
begin
  pic := public.add_log_photo(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 503), 'photos/ann/2.jpg', 'passed', pg_temp.v(), '["baseline"]');
  assert (select check_result = 'passed' from public.photos where id = pic), 'passed photo not saved';
  raise notice 'PASS: T44 a passed photo makes its log photo-checked (worked out from the photo)';
end $$;

-- T25: if saving the log's event fails, the log isn't saved either (all or nothing).
do $$
declare before bigint := (select count(*) from public.habit_logs);
begin
  begin
    perform public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'keyboard', null, 508, 999, '["baseline"]');
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

-- T45 [2026-11-11]: the connection question is its own message (rule 5.6): it names no
-- nudge, goes out once a week per parent, and writes its own event (rule 10.2).
select pg_temp.expect_refused('T45 a connection question that names a nudge',
  $q$select public.record_message_sent(pg_temp.ann(), 'connection_question', pg_temp.twc(), null, pg_temp.today(), null, pg_temp.v(), '["baseline"]')$q$);
select public.record_message_sent(pg_temp.ann(), 'connection_question', null, null, pg_temp.today(), null, pg_temp.v(), '["baseline"]');
select pg_temp.expect_refused('T45 a second connection question in the same week',
  $q$select public.record_message_sent(pg_temp.ann(), 'connection_question', null, null, pg_temp.today(), null, pg_temp.v(), '["baseline"]')$q$);
do $$
begin
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'connection_question_sent' and e.parent_id = pg_temp.ann()) = 1, 'expected a connection_question_sent event';
  raise notice 'PASS: T45 the connection question is its own message, once a week, with its own event';
end $$;

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

-- T46 [2026-11-11]: an answer needs a question sent that week, and is refused after
-- 24 hours (rule 5.6; the window comes from the settings version, rule 1.4).
select pg_temp.expect_refused('T46 an answer when no question was sent',
  $q$select public.save_connection_answer(pg_temp.ben(), date_trunc('week', pg_temp.today())::date, 3, 604, pg_temp.v(), '["baseline"]')$q$, 'no connection question');
select public.record_message_sent(pg_temp.ben(), 'connection_question', null, null, pg_temp.today(), null, pg_temp.v(), '["baseline"]');
reset role;
update public.messages_sent set sent_at = now() - interval '25 hours' where parent_id = pg_temp.ben() and kind = 'connection_question';
set role service_role;
select pg_temp.expect_refused('T46 an answer 25 hours after the question was sent',
  $q$select public.save_connection_answer(pg_temp.ben(), date_trunc('week', pg_temp.today())::date, 3, 605, pg_temp.v(), '["baseline"]')$q$, 'closed');

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
  a := public.record_settings_version('Same again', '{"max_nudges_per_day": 3, "undo_window_seconds": 30, "connection_answer_window_hours": 24}'::jsonb);
  b := public.record_settings_version('Wrap Up moved', '{"max_nudges_per_day": 3, "undo_window_seconds": 30, "connection_answer_window_hours": 24, "wrap_up_minute": 1170}'::jsonb);
  c := public.record_settings_version('Wrap Up moved', '{"wrap_up_minute": 1170, "connection_answer_window_hours": 24, "undo_window_seconds": 30, "max_nudges_per_day": 3}'::jsonb);
  assert a = 1 and b = 2 and c = 2, format('expected versions 1, 2, 2 but got %s, %s, %s', a, b, c);
  raise notice 'PASS: T34 the same settings give the same version; new settings give a new one';
end $$;
select pg_temp.expect_refused('T34 editing a settings version',
  $q$update public.settings_versions set note = 'changed' where version = 1$q$, 'permission denied');

-- =============================================================================
-- [2026-11-11] Reflections, moments, Undo and deleting a photo (migration 005)
-- =============================================================================

-- T47: a reflection is saved with its event; a resent message is saved once; at most 280 characters.
do $$
declare first bigint; second bigint;
begin
  first  := public.save_reflection(pg_temp.ann(), null, 'typed', 'We baked banana bread together', 811, pg_temp.v(), '["baseline"]');
  second := public.save_reflection(pg_temp.ann(), null, 'typed', 'We baked banana bread together', 811, pg_temp.v(), '["baseline"]');
  assert first is not null and second is null, 'expected the repeat to be ignored';
  assert (select for_day = pg_temp.today() from public.reflections where id = first), 'a reflection is for today';
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'reflection_saved' and e.parent_id = pg_temp.ann()) = 1, 'expected one reflection_saved event';
  raise notice 'PASS: T47 a reflection is saved once, for today, with its event';
end $$;
select pg_temp.expect_refused('T47 a reflection of 281 characters',
  $q$select public.save_reflection(pg_temp.ann(), null, 'typed', repeat('a', 281), 812, pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T47 a reflection from an unknown source',
  $q$select public.save_reflection(pg_temp.ann(), null, 'guessed', 'Hello', 813, pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T47 an empty reflection',
  $q$select public.save_reflection(pg_temp.ann(), null, 'typed', '   ', 814, pg_temp.v(), '["baseline"]')$q$);

-- T48: a moment line or photo belongs to the week of the latest Wrap Up; one of each per week (rule 7.7).
do $$
declare monday date := date_trunc('week', pg_temp.today())::date; pic bigint;
begin
  perform public.save_moment_line(pg_temp.ann(), monday, 'Beach walk on Saturday', 821, pg_temp.v(), '["baseline"]');
  pic := public.add_moment_photo(pg_temp.ann(), monday, 'photos/ann/m1.jpg', pg_temp.v(), '["baseline"]');
  assert (select check_result = 'not_checked' and moment_week = monday from public.photos where id = pic), 'a moment photo is never checked';
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'moment_saved' and e.parent_id = pg_temp.ann()) = 2, 'expected two moment_saved events';
  raise notice 'PASS: T48 a moment line and a moment photo are saved for the Wrap Up week, the photo unchecked';
end $$;
select pg_temp.expect_refused('T48 a second moment line in the same week',
  $q$select public.save_moment_line(pg_temp.ann(), date_trunc('week', pg_temp.today())::date, 'Another one', 822, pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T48 a second moment photo in the same week',
  $q$select public.add_moment_photo(pg_temp.ann(), date_trunc('week', pg_temp.today())::date, 'photos/ann/m2.jpg', pg_temp.v(), '["baseline"]')$q$);
select pg_temp.expect_refused('T48 a moment for last week, after this week''s Wrap Up',
  $q$select public.save_moment_line(pg_temp.ann(), (date_trunc('week', pg_temp.today()) - interval '7 days')::date, 'Old', 823, pg_temp.v(), '["baseline"]')$q$, 'Wrap Up');
select pg_temp.expect_refused('T48 a moment from a parent who got no Wrap Up',
  $q$select public.save_moment_line(pg_temp.ben(), date_trunc('week', pg_temp.today())::date, 'Hi', 824, pg_temp.v(), '["baseline"]')$q$, 'Wrap Up');

-- T49: Undo (rule 5.8, edits 5 and 7 of rule 8.4): a keyboard log, within 30 seconds,
-- once; the log is kept and marked undone, its line is blanked and its photo deleted.
do $$
declare log bigint;
begin
  log := public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'keyboard', 'Hugged at bedtime', 831, pg_temp.v(), '["baseline"]');
  perform public.add_log_photo(pg_temp.ann(), log, 'photos/ann/u.jpg', 'passed', pg_temp.v(), '["baseline"]');
  perform public.undo_log(pg_temp.ann(), log, pg_temp.v(), '["baseline"]');
  assert (select undone_at is not null and description is null from public.habit_logs where id = log), 'log not marked undone, or line kept';
  assert not exists (select 1 from public.photos where log_id = log), 'photo of an undone log kept (owner, 11 Nov: even a checked one goes)';
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'log_undone' and e.parent_id = pg_temp.ann()) = 1, 'expected a log_undone event';
  raise notice 'PASS: T49 Undo keeps the log, marks it undone, blanks its line and deletes its photo';
end $$;
select pg_temp.expect_refused('T49 undoing the same log twice',
  $q$select public.undo_log(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 831), pg_temp.v(), '["baseline"]')$q$, 'already undone');
select pg_temp.expect_refused('T49 a photo on an undone log',
  $q$select public.add_log_photo(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 831), 'photos/ann/u2.jpg', 'passed', pg_temp.v(), '["baseline"]')$q$, 'undone');
select pg_temp.expect_refused('T49 undoing a log that did not come from the keyboard',
  $q$select public.undo_log(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 503), pg_temp.v(), '["baseline"]')$q$, 'keyboard');
select pg_temp.expect_refused('T49 undoing another parent''s log',
  $q$select public.undo_log(pg_temp.ben(), (select id from public.habit_logs where telegram_update_id = 506), pg_temp.v(), '["baseline"]')$q$, 'this parent');
select public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'keyboard', null, 832, pg_temp.v(), '["baseline"]');
reset role;
update public.habit_logs set logged_at = now() - interval '31 seconds' where telegram_update_id = 832;
set role service_role;
select pg_temp.expect_refused('T49 undoing a keyboard log after 31 seconds',
  $q$select public.undo_log(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 832), pg_temp.v(), '["baseline"]')$q$, 'Undo window');

-- T50: deleting a photo (edit 6 of rule 8.4) removes that parent's photo and writes an event; nothing else can delete one.
do $$
declare pic bigint := (select id from public.photos where storage_path = 'photos/ann/1.jpg');
begin
  perform public.delete_photo(pg_temp.ann(), pic, pg_temp.v(), '["baseline"]');
  assert not exists (select 1 from public.photos where id = pic), 'photo not deleted';
  assert (select count(*) from public.events e join public.event_types t on t.id = e.event_type_id
          where t.name = 'photo_deleted' and e.parent_id = pg_temp.ann()) = 1, 'expected a photo_deleted event';
  raise notice 'PASS: T50 a parent''s photo is deleted with an event';
end $$;
select pg_temp.expect_refused('T50 deleting another parent''s photo',
  $q$select public.delete_photo(pg_temp.ben(), (select id from public.photos where storage_path = 'photos/ann/2.jpg'), pg_temp.v(), '["baseline"]')$q$, 'this parent');
select pg_temp.expect_refused('T50 the server deleting a photo directly',
  $q$delete from public.photos where storage_path = 'photos/ann/2.jpg'$q$, 'permission denied');

-- T51: the server can read the new tables but never write them directly (only through the functions).
do $$
declare t text;
begin
  foreach t in array array['photos','reflections','moment_lines'] loop
    assert has_table_privilege('service_role', 'public.' || t, 'select'), 'server cannot read ' || t;
    assert not has_table_privilege('service_role', 'public.' || t, 'insert'), 'server can insert into ' || t || ' directly';
    assert not has_table_privilege('service_role', 'public.' || t, 'update'), 'server can update ' || t;
    assert not has_table_privilege('service_role', 'public.' || t, 'delete'), 'server can delete from ' || t;
  end loop;
  raise notice 'PASS: T51 the new tables are written only through their functions';
end $$;

-- T52: the new kinds of event exist (rule 10.2).
do $$
begin
  assert (select count(*) from public.event_types where name in ('connection_question_sent', 'connection_question_expired',
    'reflection_saved', 'moment_saved', 'self_report_confirmed', 'claude_matching_failed', 'photo_added', 'photo_deleted', 'log_undone')) = 9,
    'expected the 9 new event types';
  raise notice 'PASS: T52 the new kinds of event exist';
end $$;

-- T53: a window the database checks must be in the settings version, or the action is refused (rule 1.3, no guessing).
do $$
declare bare bigint;
begin
  bare := public.record_settings_version('No windows', '{"max_nudges_per_day": 3}'::jsonb);
  perform public.save_habit_log(pg_temp.ann(), pg_temp.twc(), pg_temp.today(), null, 'keyboard', null, 841, bare, '["baseline"]');
  begin
    perform public.undo_log(pg_temp.ann(), (select id from public.habit_logs where telegram_update_id = 841), bare, '["baseline"]');
    raise exception 'FAIL: T53 undo without the window in the settings version SHOULD HAVE BEEN REFUSED';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
    if sqlerrm !~* 'undo_window_seconds' then raise exception 'FAIL: T53 refused for the wrong reason: %', sqlerrm; end if;
  end;
  raise notice 'PASS: T53 an Undo is refused when its settings version has no undo window';
end $$;

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
  foreach t in array array['parents','children','consents','picks','slots','habit_logs','messages_sent','connection_answers','events',
                           'photos','reflections','moment_lines'] loop
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
          and c.relname not in ('nudges', 'examples')) = 17, 'expected 17 Datastore tables (rule 8.3; 3 added by migration 005)';
  raise notice 'PASS: rules 8.3 and 8.12 there are 17 Datastore tables, each with created_at and a comment on every column';
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
      or (column_name in ('for_day', 'signed_up_on', 'week_starting', 'on_day', 'day', 'moment_week') and data_type <> 'date')
      or (column_name in ('start_minute', 'slot_minute', 'wrap_up_minute') and data_type <> 'smallint'));
  assert bad is null, 'columns stored the wrong way: ' || bad;
  raise notice 'PASS: fix 7 every moment, day and minute column uses the agreed type';
end $$;

\echo ALL DATASTORE TABLE TESTS PASSED
