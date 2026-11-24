-- =============================================================================
-- src/datastore/supabase/tests/web-app-access.test.sql: tests for the Web app's
-- way into the database (migration 011)
--
-- What it checks, in plain English (owner-approved test list of 15 Nov, D1 to
-- D17, numbered T99 to T116 here so database test numbers stay unique):
--   - the one-time sign-in link and the 30-day sign-in (rules 9.3, 1.3)
--   - per-parent access: a parent's pass shows that parent's rows and nothing
--     else, and no pass shows nothing (rule 9.8, Row Level Security)
--   - the three reads return only the agreed fields (Datastore, "Approved: what
--     the Web app pages need")
--   - the narrow deletes (rule 8.4 edits 6 and 11 to 13): one layer each, all
--     or nothing, an event with no deleted text, never a habit log
--
-- "A pass" here is what Supabase gives the database for each Web app request:
-- the role "authenticated" plus a small signed note (the JWT claims) that says
-- which parent it is for. The tests set both by hand, as Supabase would.
--
-- [2026-11-24] Also migration 012 (T119, T120): log photos without a check
-- and the private photo store, at the end of this file.
-- Runs after datastore-tables.test.sql on the same throwaway local database
-- (src/datastore/supabase/tests/run.sh), never on the real Supabase project.
-- =============================================================================

\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null

\i src/datastore/supabase/migrations/011_web_app_access.sql

-- Helper: try one statement and expect the database to refuse it (same idea as
-- in the other test files). It runs as whichever role is active.
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

-- Helper: act as the Web app holding one parent's pass (or no parent at all).
create or replace function pg_temp.pass_for(p_parent bigint) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', false);
  perform set_config('request.jwt.claims',
    case when p_parent is null then '' else json_build_object('role', 'authenticated', 'parent_id', p_parent::text)::text end, false);
end $$;
-- Helper: go back to the owner (the database's admin role) to set up or inspect.
create or replace function pg_temp.as_owner() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', false);
  perform set_config('role', 'none', false);
end $$;

-- ---- Test data, added as the owner ----
-- A settings version with the numbers the database reads (src/settings.ts,
-- SETTINGS_KEYS_THE_DATABASE_READS): 5-minute link, 30-day sign-in, 4 older
-- weeks per tap, 40-character tile text, 4 weeks of connection bars.
select public.record_settings_version('Web app values', '{"undo_window_seconds": 600, "connection_answer_window_hours": 24,
  "sign_in_link_seconds": 300, "sign_in_days": 30, "older_weeks_per_page": 4, "tile_text_chars": 40, "connection_weeks": 4}'::jsonb);
create function pg_temp.v() returns bigint language sql security definer as $$ select max(version) from public.settings_versions $$;

-- Two parents: Cara joined in the week of Monday 5 Oct 2026; Dev in the week of 2 Nov.
insert into public.parents (telegram_id, first_name, cohort, wrap_up_minute, signed_up_on)
values (2001, 'Cara', 'cohort-1', 1200, '2026-10-07'), (2002, 'Dev', 'cohort-1', 1200, '2026-11-03');
create function pg_temp.cara() returns bigint language sql security definer as $$ select id from public.parents where telegram_id = 2001 $$;
create function pg_temp.dev() returns bigint language sql security definer as $$ select id from public.parents where telegram_id = 2002 $$;
insert into public.children (parent_id, first_name, birth_year) values (pg_temp.cara(), 'Riley', 2017), (pg_temp.cara(), 'Sam', null), (pg_temp.dev(), 'Max', 2016);
create function pg_temp.n1() returns bigint language sql security definer as $$ select min(id) from public.nudges $$;
create function pg_temp.n2() returns bigint language sql security definer as $$ select min(id) from public.nudges where id > pg_temp.n1() $$;

-- Cara's week of Monday 9 Nov: a keyboard log with a line and a photo (Tue), a
-- Done log with nothing added (Wed), an undone log (Wed), two logs on Thursday,
-- a reflection, a moment line and a moment photo, and a connection answer.
insert into public.habit_logs (parent_id, nudge_id, for_day, logged_via, description, telegram_update_id) values
  (pg_temp.cara(), pg_temp.n1(), '2026-11-10', 'keyboard',    'We laughed a lot', 7001),
  (pg_temp.cara(), pg_temp.n2(), '2026-11-11', 'log_command', null,               7002),
  (pg_temp.cara(), pg_temp.n1(), '2026-11-11', 'keyboard',    'Undone line',      7003),
  (pg_temp.cara(), pg_temp.n1(), '2026-11-12', 'keyboard',    'Morning hug',      7004),
  (pg_temp.cara(), pg_temp.n2(), '2026-11-12', 'typed',       'Talked at dinner', 7005);
update public.habit_logs set undone_at = now(), description = null where telegram_update_id = 7003;
insert into public.photos (parent_id, log_id, storage_path, preview_path, check_result)
values (pg_temp.cara(), (select id from public.habit_logs where telegram_update_id = 7001), 'cara/log-7001.jpg', 'cara/log-7001-small.jpg', 'passed');
insert into public.reflections (parent_id, for_day, source, text, telegram_update_id)
values (pg_temp.cara(), '2026-11-13', 'typed', 'Riley asked me to read one more story tonight', 7006);
insert into public.moment_lines (parent_id, week_starting, text, telegram_update_id) values (pg_temp.cara(), '2026-11-09', 'Best week so far', 7007);
insert into public.photos (parent_id, moment_week, storage_path, preview_path, check_result)
values (pg_temp.cara(), '2026-11-09', 'cara/moment-1109.jpg', 'cara/moment-1109-small.jpg', 'not_checked');
-- Cara's older weeks: 26 Oct (a log and a long reflection), 19 Oct (nothing),
-- 12 Oct (a log), 5 Oct (her joining week, a log). Connection answers on 12 Oct,
-- 26 Oct and 2 Nov; 19 Oct has no answer.
insert into public.habit_logs (parent_id, nudge_id, for_day, logged_via, telegram_update_id) values
  (pg_temp.cara(), pg_temp.n1(), '2026-10-27', 'keyboard', 7010),
  (pg_temp.cara(), pg_temp.n2(), '2026-10-13', 'keyboard', 7011),
  (pg_temp.cara(), pg_temp.n1(), '2026-10-06', 'keyboard', 7012);
insert into public.reflections (parent_id, for_day, source, text, telegram_update_id)
values (pg_temp.cara(), '2026-10-29', 'typed', 'We built a cardboard castle together after school today', 7013);
insert into public.connection_answers (parent_id, week_starting, score) values
  (pg_temp.cara(), '2026-10-12', 3), (pg_temp.cara(), '2026-10-26', 4), (pg_temp.cara(), '2026-11-02', 5);
-- Dev's week of 9 Nov: one log with a line, a reflection, a photo.
insert into public.habit_logs (parent_id, nudge_id, for_day, logged_via, description, telegram_update_id)
values (pg_temp.dev(), pg_temp.n1(), '2026-11-10', 'keyboard', 'Dev private line', 7020);
insert into public.photos (parent_id, log_id, storage_path, preview_path, check_result)
values (pg_temp.dev(), (select id from public.habit_logs where telegram_update_id = 7020), 'dev/log-7020.jpg', 'dev/log-7020-small.jpg', 'passed');
insert into public.reflections (parent_id, for_day, source, text, telegram_update_id) values (pg_temp.dev(), '2026-11-10', 'typed', 'Dev private reflection', 7021);
insert into public.moment_lines (parent_id, week_starting, text, telegram_update_id) values (pg_temp.dev(), '2026-11-09', 'Dev private moment', 7022);

-- Secrets and fingerprints. The app makes a long random secret for each link
-- and each sign-in; the bot stores only the link's SHA-256 fingerprint, and
-- the browser's side hands in the secret, which the database fingerprints
-- itself. Here a secret is made from a word, padded to look random enough.
create function pg_temp.secret(word text) returns text language sql as $$ select word || '_' || repeat('A', 32) $$;
create function pg_temp.fp(word text) returns text language sql as $$ select encode(sha256(convert_to(pg_temp.secret(word), 'UTF8')), 'hex') $$;

-- =============================================================================
-- Sign-in (rule 9.3)
-- =============================================================================

-- T116: only our server (the Telegram bot's role) can make a sign-in link; a
-- signed-out visitor or a parent's pass can't.
set role anon;
select pg_temp.expect_refused('T116 a signed-out visitor making a sign-in link',
  $q$select public.create_sign_in_link(1, pg_temp.fp('x'), pg_temp.v())$q$, 'permission denied');
select pg_temp.as_owner();
select pg_temp.pass_for(pg_temp.cara());
select pg_temp.expect_refused('T116 a parent''s pass making a sign-in link',
  $q$select public.create_sign_in_link(pg_temp.cara(), pg_temp.fp('x'), pg_temp.v())$q$, 'permission denied');
select pg_temp.as_owner();

-- T101 (D3): the database keeps only a fingerprint of each link, never the link.
set role service_role;
select pg_temp.expect_refused('T101 storing a link that is not a fingerprint',
  $q$select public.create_sign_in_link(pg_temp.cara(), 'https://example.com/signin?token=abc', pg_temp.v())$q$, 'fingerprint');
do $$
begin
  perform public.create_sign_in_link(pg_temp.cara(), pg_temp.fp('link-1'), pg_temp.v());
  raise notice 'PASS: T101 a fingerprint is accepted';
end $$;
reset role;
do $$
begin
  assert (select count(*) from public.web_sign_in_links where parent_id = pg_temp.cara()) = 1, 'one link row expected';
  assert (select bool_and(link_fingerprint ~ '^[0-9a-f]{64}$') from public.web_sign_in_links), 'a link row holds something other than a fingerprint';
  assert (select expires_at between now() + interval '299 seconds' and now() + interval '301 seconds'
          from public.web_sign_in_links where parent_id = pg_temp.cara()), 'a link should expire 5 minutes (300 seconds, from the settings version) after it is made';
  raise notice 'PASS: T101 the link row is a fingerprint that expires after the settings version''s 300 seconds';
end $$;

-- T99 (D1): a link works once; the second use is refused.
set role anon;
do $$
declare until timestamptz;
begin
  until := public.redeem_sign_in_link(pg_temp.secret('link-1'), pg_temp.secret('sign-in-1'));
  assert until between now() + interval '29 days 23 hours' and now() + interval '30 days 1 hour', 'a sign-in should last 30 days';
  raise notice 'PASS: T99 the first use of a link signs in (T102: for 30 days)';
end $$;
select pg_temp.expect_refused('T99 the second use of the same link',
  $q$select public.redeem_sign_in_link(pg_temp.secret('link-1'), pg_temp.secret('sign-in-2'))$q$, 'expired');
select pg_temp.expect_refused('T99 a link that was never made',
  $q$select public.redeem_sign_in_link(pg_temp.secret('no-such-link'), pg_temp.secret('sign-in-3'))$q$, 'expired');
do $$
begin
  assert public.sign_in_parent(pg_temp.secret('sign-in-1')) = pg_temp.cara(), 'the sign-in should belong to Cara';
  raise notice 'PASS: T99 the sign-in names the parent the link was made for';
end $$;
reset role;

-- T100 (D2): a link more than 5 minutes old is refused, even if never used.
set role service_role;
select public.create_sign_in_link(pg_temp.cara(), pg_temp.fp('link-old'), pg_temp.v());
reset role;
update public.web_sign_in_links set expires_at = now() - interval '1 second' where link_fingerprint = pg_temp.fp('link-old');
set role anon;
select pg_temp.expect_refused('T100 an unused link older than 5 minutes',
  $q$select public.redeem_sign_in_link(pg_temp.secret('link-old'), pg_temp.secret('sign-in-old'))$q$, 'expired');
reset role;

-- T102 (D4): a sign-in older than 30 days is refused.
update public.web_sign_ins set expires_at = now() - interval '1 second' where sign_in_fingerprint = pg_temp.fp('sign-in-1');
set role anon;
select pg_temp.expect_refused('T102 a sign-in past its 30 days',
  $q$select public.sign_in_parent(pg_temp.secret('sign-in-1'))$q$, 'signed in');
reset role;

-- T103 (D5): Sign out ends the sign-in straight away.
set role service_role;
select public.create_sign_in_link(pg_temp.cara(), pg_temp.fp('link-2'), pg_temp.v());
reset role;
do $$
begin
  assert (select array_agg(link_fingerprint) from public.web_sign_in_links where parent_id = pg_temp.cara()) = array[pg_temp.fp('link-2')],
    'making a new link should tidy away Cara''s used and expired links';
  raise notice 'PASS: T103 a new link tidies away the parent''s used and expired links (rule 8.4, edit 14)';
end $$;
set role anon;
select public.redeem_sign_in_link(pg_temp.secret('link-2'), pg_temp.secret('sign-in-5'));
do $$
begin
  assert public.sign_in_parent(pg_temp.secret('sign-in-5')) = pg_temp.cara(), 'signed in before signing out';
  perform public.end_sign_in(pg_temp.secret('sign-in-5'));
  raise notice 'PASS: T103 sign out runs';
end $$;
select pg_temp.expect_refused('T103 using a sign-in after Sign out',
  $q$select public.sign_in_parent(pg_temp.secret('sign-in-5'))$q$, 'signed in');
reset role;

-- =============================================================================
-- Per-parent access (rule 9.8)
-- =============================================================================

-- T106 (D8): with no pass, nothing can be seen.
set role anon;
select pg_temp.expect_refused('T106 a signed-out visitor reading logs', $q$select * from public.habit_logs$q$, 'permission denied');
select pg_temp.expect_refused('T106 a signed-out visitor running the week read', $q$select public.web_week('2026-11-09')$q$, 'permission denied');
reset role;
select pg_temp.pass_for(null);
select pg_temp.expect_refused('T106 the Web app role without a parent''s pass, week read', $q$select public.web_week('2026-11-09')$q$, 'not signed in');
do $$
begin
  assert (select count(*) from public.habit_logs) = 0, 'no pass should see no logs';
  assert (select count(*) from public.reflections) = 0, 'no pass should see no reflections';
  assert (select count(*) from public.parents) = 0, 'no pass should see no parents';
  raise notice 'PASS: T106 without a parent''s pass, no rows can be seen';
end $$;
select pg_temp.as_owner();

-- T105 (D7): Cara's pass sees only Cara's rows, and can't delete Dev's.
select pg_temp.pass_for(pg_temp.cara());
do $$
begin
  assert (select count(*) from public.parents) = 1, 'Cara should see one parent, herself';
  assert not exists (select 1 from public.habit_logs where parent_id <> pg_temp.cara()), 'Cara sees another parent''s logs';
  assert not exists (select 1 from public.photos where parent_id <> pg_temp.cara()), 'Cara sees another parent''s photos';
  assert not exists (select 1 from public.reflections where parent_id <> pg_temp.cara()), 'Cara sees another parent''s reflections';
  assert not exists (select 1 from public.moment_lines where parent_id <> pg_temp.cara()), 'Cara sees another parent''s moment lines';
  assert not exists (select 1 from public.connection_answers where parent_id <> pg_temp.cara()), 'Cara sees another parent''s answers';
  assert not exists (select 1 from public.children where parent_id <> pg_temp.cara()), 'Cara sees another parent''s children';
  assert public.web_week('2026-11-09')::text !~ 'Dev private', 'the week read leaks Dev''s words';
  raise notice 'PASS: T105 a parent''s pass sees only that parent''s rows';
end $$;
select pg_temp.as_owner();
create temp table dev_rows as select
  (select id from public.habit_logs where telegram_update_id = 7020) as log_id,
  (select id from public.photos where parent_id = pg_temp.dev()) as photo_id,
  (select id from public.reflections where telegram_update_id = 7021) as reflection_id,
  (select id from public.moment_lines where telegram_update_id = 7022) as moment_line_id;
grant select on dev_rows to authenticated;
select pg_temp.pass_for(pg_temp.cara());
select pg_temp.expect_refused('T105 Cara wiping Dev''s log line',
  $q$select public.web_wipe_log_line((select log_id from dev_rows), pg_temp.v(), '["baseline"]')$q$, 'not found');
select pg_temp.expect_refused('T105 Cara removing Dev''s reflection',
  $q$select public.web_remove_reflection((select reflection_id from dev_rows), pg_temp.v(), '["baseline"]')$q$, 'not found');
select pg_temp.expect_refused('T105 Cara removing Dev''s moment line',
  $q$select public.web_remove_moment_line((select moment_line_id from dev_rows), pg_temp.v(), '["baseline"]')$q$, 'not found');
select pg_temp.expect_refused('T105 Cara deleting Dev''s photo',
  $q$select public.web_delete_photo((select photo_id from dev_rows), pg_temp.v(), '["baseline"]')$q$, 'not found');
select pg_temp.as_owner();
do $$
begin
  assert (select description from public.habit_logs where telegram_update_id = 7020) = 'Dev private line', 'Dev''s line was touched';
  assert exists (select 1 from public.reflections where telegram_update_id = 7021), 'Dev''s reflection was removed';
  assert exists (select 1 from public.moment_lines where telegram_update_id = 7022), 'Dev''s moment line was removed';
  assert exists (select 1 from public.photos where parent_id = pg_temp.dev()), 'Dev''s photo was deleted';
  raise notice 'PASS: T105 Dev''s rows are untouched';
end $$;

-- =============================================================================
-- The three reads (Datastore, "Approved: what the Web app pages need")
-- =============================================================================

-- T107 (D9): read 1, one week, returns only the agreed fields.
select pg_temp.pass_for(pg_temp.cara());
do $$
declare w jsonb := public.web_week('2026-11-09');
begin
  assert w ->> 'parent_first_name' = 'Cara', 'the parent''s first name';
  assert w -> 'children' = '["Riley", "Sam"]'::jsonb, 'all the parent''s children, by first name: ' || (w -> 'children')::text;
  assert jsonb_array_length(w -> 'logs') = 4, 'four logs (the undone one left out): ' || (w -> 'logs')::text;
  -- Oldest first: the page puts this week newest first (rule 9.4).
  assert (w -> 'logs' -> 0 ->> 'day') = '2026-11-10' and (w -> 'logs' -> 0 ->> 'line') = 'We laughed a lot', 'first log, its day and line';
  assert (w -> 'logs' -> 0 -> 'photo' ->> 'path') = 'cara/log-7001.jpg', 'the log''s photo, for the server to turn into a short-lived link';
  assert (w -> 'logs' -> 0 ->> 'habit') = (select name from public.nudges where id = pg_temp.n1()), 'the habit''s name';
  assert (w -> 'logs' -> 1 -> 'photo') = 'null'::jsonb and (w -> 'logs' -> 1 -> 'line') = 'null'::jsonb, 'a log with nothing added';
  assert jsonb_array_length(w -> 'reflections') = 1 and (w -> 'reflections' -> 0 ->> 'text') = 'Riley asked me to read one more story tonight', 'the reflection, word for word';
  assert (w -> 'moment' -> 'line' ->> 'text') = 'Best week so far' and (w -> 'moment' -> 'photo' ->> 'path') = 'cara/moment-1109.jpg', 'the moment';
  assert (w ->> 'older_weeks')::int = 5, 'five weeks before this one since Cara joined (2 Nov back to 5 Oct)';
  assert w::text !~ 'Undone line', 'an undone log is left out';
  assert w::text !~* 'telegram|birth|2017|check_result|passed|logged_via|keyboard|nudge_id|signed_up', 'something that is never returned: ' || w::text;
  assert w -> 'logs' -> 0 ? 'log_id' and w -> 'logs' -> 0 -> 'photo' ? 'photo_id' and w -> 'reflections' -> 0 ? 'reflection_id'
     and w -> 'moment' -> 'line' ? 'moment_line_id', 'reference numbers for the dustbins';
  raise notice 'PASS: T107 read 1 returns the agreed fields only, without the undone log';
end $$;
-- The pass can't read the columns that are never returned, even directly.
select pg_temp.expect_refused('T107 a parent''s pass reading Telegram IDs', $q$select telegram_id from public.parents$q$, 'permission denied');
select pg_temp.expect_refused('T107 a parent''s pass reading a birth year', $q$select birth_year from public.children$q$, 'permission denied');
select pg_temp.expect_refused('T107 a parent''s pass reading a photo check result', $q$select check_result from public.photos$q$, 'permission denied');
select pg_temp.expect_refused('T107 a parent''s pass reading how a log was made', $q$select logged_via from public.habit_logs$q$, 'permission denied');
select pg_temp.expect_refused('T107 a parent''s pass reading events', $q$select * from public.events$q$, 'permission denied');
select pg_temp.expect_refused('T107 a week read for a day that is not a Monday', $q$select public.web_week('2026-11-10')$q$, 'Monday');

-- T108 (D10): read 2, older weeks, 4 at a time.
do $$
declare o jsonb := public.web_older_weeks('2026-11-09');
begin
  assert jsonb_array_length(o -> 'weeks') = 4, '4 weeks per tap: ' || o::text;
  assert (o -> 'weeks' -> 0 ->> 'monday') = '2026-11-02' and (o -> 'weeks' -> 3 ->> 'monday') = '2026-10-12', 'newest first, 2 Nov to 12 Oct';
  -- The week of 26 Oct: 1 day logged, 1 habit log, 1 reflection, no moment;
  -- tiles in date order: the log (no photo: its habit name), then the reflection cut to 40 characters at a word.
  assert (o -> 'weeks' -> 1 ->> 'days_logged')::int = 1 and (o -> 'weeks' -> 1 ->> 'habit_logs')::int = 1
     and (o -> 'weeks' -> 1 ->> 'reflections')::int = 1 and (o -> 'weeks' -> 1 ->> 'moment')::boolean = false, 'counts for 26 Oct: ' || (o -> 'weeks' -> 1)::text;
  assert (o -> 'weeks' -> 1 -> 'tiles' -> 0 ->> 'kind') = 'log' and (o -> 'weeks' -> 1 -> 'tiles' -> 0 ->> 'habit') = (select name from public.nudges where id = pg_temp.n1()), 'the log tile first';
  assert (o -> 'weeks' -> 1 -> 'tiles' -> 1 ->> 'text') = 'We built a cardboard castle together…', 'the reflection cut at a word: ' || (o -> 'weeks' -> 1 -> 'tiles' -> 1 ->> 'text');
  -- The empty week of 19 Oct is still listed (owner, 15 Nov), with zero counts and no tiles.
  assert (o -> 'weeks' -> 2 ->> 'days_logged')::int = 0 and jsonb_array_length(o -> 'weeks' -> 2 -> 'tiles') = 0, 'the empty week';
  -- One week (5 Oct) remains; the next tap reaches it.
  assert (o ->> 'weeks_remaining')::int = 1 and (o ->> 'next_oldest_monday') = '2026-10-05', 'what the next tap loads: ' || o::text;
  assert o::text !~* 'Riley|Sam|"line"|"path"|log_id|reflection_id|moment_line_id|photo_id', 'read 2 returns no names, lines, big photos or reference numbers: ' || o::text;
  raise notice 'PASS: T108 read 2 returns 4 weeks with their counts and tiles, and what the next tap loads';
end $$;
do $$
declare o jsonb := public.web_older_weeks('2026-10-12');
begin
  assert jsonb_array_length(o -> 'weeks') = 1 and (o ->> 'weeks_remaining')::int = 0 and (o -> 'next_oldest_monday') = 'null'::jsonb, 'the last page: ' || o::text;
  raise notice 'PASS: T108 the last page says nothing remains';
end $$;
-- This week's moment comes first in its week's tiles once it is an older week, with its small preview.
do $$
declare o jsonb := public.web_older_weeks('2026-11-16');
begin
  assert (o -> 'weeks' -> 0 ->> 'monday') = '2026-11-09', 'the week of 9 Nov';
  assert (o -> 'weeks' -> 0 -> 'tiles' -> 0 ->> 'kind') = 'moment' and (o -> 'weeks' -> 0 -> 'tiles' -> 0 ->> 'preview_path') = 'cara/moment-1109-small.jpg', 'the moment first';
  assert (o -> 'weeks' -> 0 -> 'tiles' -> 1 ->> 'preview_path') = 'cara/log-7001-small.jpg', 'a log with a photo shows its small preview';
  assert (o -> 'weeks' -> 0 ->> 'days_logged')::int = 3 and (o -> 'weeks' -> 0 ->> 'habit_logs')::int = 4, 'days with a habit log (Tue, Wed, Thu) and 4 logs, the undone one left out';
  raise notice 'PASS: T108 the moment comes first; a reflection never counts as a logged day';
end $$;

-- T109 (D11): read 3, connection history.
do $$
declare c jsonb := public.web_connection_history('2026-11-09');
begin
  assert c = '[{"monday": "2026-10-12", "rating": 3}, {"monday": "2026-10-19", "rating": null}, {"monday": "2026-10-26", "rating": 4}, {"monday": "2026-11-02", "rating": 5}]'::jsonb,
    'the 4 weeks before 9 Nov, a week without a rating as null: ' || c::text;
  raise notice 'PASS: T109 read 3 returns the 4 weeks before, with "no rating" where there is none';
end $$;
select pg_temp.as_owner();
insert into public.connection_answers (parent_id, week_starting, score) values (pg_temp.cara(), '2026-11-09', 4);
select pg_temp.pass_for(pg_temp.cara());
do $$
declare c jsonb := public.web_connection_history('2026-11-09');
begin
  assert jsonb_array_length(c) = 5 and c -> 4 = '{"monday": "2026-11-09", "rating": 4}'::jsonb, 'this week joins once answered: ' || c::text;
  raise notice 'PASS: T109 this week joins once answered';
end $$;
select pg_temp.as_owner();
select pg_temp.pass_for(pg_temp.dev());
do $$
declare c jsonb := public.web_connection_history('2026-11-09');
begin
  assert c = '[{"monday": "2026-11-02", "rating": null}]'::jsonb, 'weeks before Dev joined have no slot: ' || c::text;
  raise notice 'PASS: T109 weeks before the parent joined are left out';
end $$;
select pg_temp.as_owner();

-- =============================================================================
-- The narrow deletes (rule 8.4 edits 6 and 11 to 13)
-- =============================================================================
create temp table cara_rows as select
  (select id from public.habit_logs where telegram_update_id = 7001) as log_with_photo,
  (select id from public.habit_logs where telegram_update_id = 7004) as log_with_line,
  (select id from public.habit_logs where telegram_update_id = 7002) as log_bare,
  (select id from public.photos where log_id = (select id from public.habit_logs where telegram_update_id = 7001)) as log_photo,
  (select id from public.reflections where telegram_update_id = 7006) as reflection,
  (select id from public.moment_lines where telegram_update_id = 7007) as moment_line;
grant select on cara_rows to authenticated, web_page_writer;
create function pg_temp.events_of(t text) returns bigint language sql security definer as $$
  select count(*) from public.events e join public.event_types et on et.id = e.event_type_id where et.name = t and e.parent_id = pg_temp.cara() $$;

-- T114 (D16): all or nothing: if the event can't be written (here, a settings
-- version that doesn't exist), nothing is deleted.
select pg_temp.pass_for(pg_temp.cara());
select pg_temp.expect_refused('T114 removing a reflection when its event can''t be written',
  $q$select public.web_remove_reflection((select reflection from cara_rows), 999999, '["baseline"]')$q$);
select pg_temp.as_owner();
do $$
begin
  assert exists (select 1 from public.reflections where telegram_update_id = 7006), 'the reflection went although its event failed';
  raise notice 'PASS: T114 a delete whose event fails deletes nothing';
end $$;

-- T110 (D12): wiping a log's line blanks the line; the log stays and still counts.
select pg_temp.pass_for(pg_temp.cara());
select public.web_wipe_log_line((select log_with_line from cara_rows), pg_temp.v(), '["baseline"]');
select pg_temp.expect_refused('T110 wiping a line that is already gone',
  $q$select public.web_wipe_log_line((select log_with_line from cara_rows), pg_temp.v(), '["baseline"]')$q$, 'not found');
select pg_temp.expect_refused('T110 wiping the line of a log that has none',
  $q$select public.web_wipe_log_line((select log_bare from cara_rows), pg_temp.v(), '["baseline"]')$q$, 'not found');
select pg_temp.as_owner();
do $$
begin
  assert (select description is null and undone_at is null from public.habit_logs where telegram_update_id = 7004), 'the line should be blank and the log still counting';
  assert pg_temp.events_of('log_line_deleted') = 1, 'one event';
  raise notice 'PASS: T110 the line is wiped, the log stays and counts, one event';
end $$;

-- T111 (D13): removing a reflection deletes it; its event holds no text.
select pg_temp.pass_for(pg_temp.cara());
select public.web_remove_reflection((select reflection from cara_rows), pg_temp.v(), '["baseline"]');
select pg_temp.as_owner();
do $$
begin
  assert not exists (select 1 from public.reflections where telegram_update_id = 7006), 'the reflection should be gone (removed, not blanked)';
  assert pg_temp.events_of('reflection_deleted') = 1, 'one event';
  assert not exists (select 1 from public.events e where e.parent_id = pg_temp.cara() and row_to_json(e)::text ~ 'story tonight'), 'an event holds the deleted words';
  raise notice 'PASS: T111 the reflection is removed; its event holds no text';
end $$;

-- T112 (D14): removing a moment line deletes it.
select pg_temp.pass_for(pg_temp.cara());
select public.web_remove_moment_line((select moment_line from cara_rows), pg_temp.v(), '["baseline"]');
select pg_temp.as_owner();
do $$
begin
  assert not exists (select 1 from public.moment_lines where telegram_update_id = 7007), 'the moment line should be gone';
  assert exists (select 1 from public.photos where parent_id = pg_temp.cara() and moment_week = '2026-11-09'), 'the moment''s photo stays (one layer per tap)';
  assert pg_temp.events_of('moment_line_deleted') = 1, 'one event';
  raise notice 'PASS: T112 the moment line is removed; the moment''s photo stays';
end $$;

-- T113 (D15): deleting a photo removes the record of the photo and of its small
-- preview (one row holds both; our server removes both files first, rule 8.5,
-- with the paths from read 1); the log and its line stay.
select pg_temp.pass_for(pg_temp.cara());
do $$
declare w jsonb := public.web_week('2026-11-09');
begin
  assert (w -> 'logs' -> 0 -> 'photo' ->> 'preview_path') = 'cara/log-7001-small.jpg', 'read 1 gives our server the preview''s path too';
  perform public.web_delete_photo((select log_photo from cara_rows), pg_temp.v(), '["baseline"]');
  raise notice 'PASS: T113 the photo delete runs';
end $$;
select pg_temp.as_owner();
do $$
begin
  assert not exists (select 1 from public.photos where log_id = (select log_with_photo from cara_rows)), 'the photo and its preview should be gone';
  assert (select description from public.habit_logs where telegram_update_id = 7001) = 'We laughed a lot', 'the log''s line stays';
  assert pg_temp.events_of('photo_deleted') = 1, 'one event';
  raise notice 'PASS: T113 the photo and its preview go; the log and its line stay';
end $$;

-- T115 (D17): no way to delete a habit log or edit anyone's words.
do $$
declare t text;
begin
  foreach t in array array['parents','children','consents','picks','slots','habit_logs','messages_sent','connection_answers','events',
    'photos','reflections','moment_lines','web_sign_in_links','web_sign_ins'] loop
    assert not has_table_privilege('authenticated', 'public.' || t, 'insert,update,delete,truncate'), 'a parent''s pass can change ' || t || ' directly';
    assert not has_table_privilege('anon', 'public.' || t, 'select,insert,update,delete,truncate'), 'a signed-out visitor can touch ' || t;
  end loop;
  assert not has_table_privilege('web_page_writer', 'public.habit_logs', 'delete'), 'the delete functions can delete a habit log';
  assert not has_column_privilege('web_page_writer', 'public.reflections', 'text', 'update'), 'the delete functions can edit a reflection';
  assert not has_column_privilege('web_page_writer', 'public.moment_lines', 'text', 'update'), 'the delete functions can edit a moment line';
  assert not has_column_privilege('web_page_writer', 'public.habit_logs', 'for_day', 'update'), 'the delete functions can change a log''s day';
  assert not pg_has_role('authenticated', 'web_page_writer', 'member'), 'a parent''s pass can act as the delete functions'' role';
  raise notice 'PASS: T115 no habit log can be deleted and no words edited; a parent''s pass changes nothing directly';
end $$;
-- A wipe can only blank a line, never write new words (the database's own check).
set role web_page_writer;
select set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'parent_id', pg_temp.cara()::text)::text, false);
select pg_temp.expect_refused('T115 writing new words into a log line',
  $q$update public.habit_logs set description = 'new words' where id = (select log_with_photo from cara_rows)$q$, 'row-level security');
select pg_temp.as_owner();

-- T104 (D6): "delete my data" ends every sign-in and removes every link.
set role service_role;
select public.create_sign_in_link(pg_temp.dev(), pg_temp.fp('dev-link-1'), pg_temp.v());
select public.create_sign_in_link(pg_temp.dev(), pg_temp.fp('dev-link-2'), pg_temp.v());
reset role;
set role anon;
select public.redeem_sign_in_link(pg_temp.secret('dev-link-1'), pg_temp.secret('dev-sign-in'));
reset role;
set role service_role;
select public.delete_my_data(pg_temp.dev());
reset role;
set role anon;
select pg_temp.expect_refused('T104 using a sign-in after delete my data', $q$select public.sign_in_parent(pg_temp.secret('dev-sign-in'))$q$, 'signed in');
select pg_temp.expect_refused('T104 using a link after delete my data',
  $q$select public.redeem_sign_in_link(pg_temp.secret('dev-link-2'), pg_temp.secret('dev-sign-in-2'))$q$, 'expired');
reset role;
do $$
begin
  assert not exists (select 1 from public.web_sign_in_links l left join public.parents p on p.id = l.parent_id where p.id is null), 'a link outlived its parent';
  assert not exists (select 1 from public.web_sign_ins s left join public.parents p on p.id = s.parent_id where p.id is null), 'a sign-in outlived its parent';
  raise notice 'PASS: T104 delete my data removes the parent''s links and sign-ins';
end $$;

-- T111 to T113, again: no event holds any deleted words.
do $$
begin
  assert not exists (select 1 from public.events e where row_to_json(e)::text ~ 'Morning hug|Best week so far|story tonight|log-7001'),
    'an event holds deleted words or a photo path';
  raise notice 'PASS: T111 to T113 no event holds the deleted line, reflection, moment line or photo path';
end $$;

-- T115 (rule 8.12): every column of the two new tables is labelled.
do $$
begin
  assert not exists (select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name in ('web_sign_in_links', 'web_sign_ins')
      and col_description(('public.' || c.table_name)::regclass, c.ordinal_position) is null), 'a sign-in column has no label';
  assert obj_description('public.web_sign_in_links'::regclass) is not null and obj_description('public.web_sign_ins'::regclass) is not null, 'a sign-in table has no label';
  raise notice 'PASS: T115 the two sign-in tables and every column are labelled (rule 8.12)';
end $$;

-- T117 (review, 15 Nov): a copy of the sign-in tables opens nothing. Handing
-- in a stored fingerprint as if it were the secret is refused, and so is a
-- short guess.
set role service_role;
select public.create_sign_in_link(pg_temp.cara(), pg_temp.fp('link-copy'), pg_temp.v());
reset role;
set role anon;
select pg_temp.expect_refused('T117 using a stored link fingerprint as the secret',
  $q$select public.redeem_sign_in_link(pg_temp.fp('link-copy'), pg_temp.secret('sign-in-copy'))$q$, 'expired');
select pg_temp.expect_refused('T117 a short guess at a secret',
  $q$select public.redeem_sign_in_link('abc', pg_temp.secret('sign-in-copy'))$q$, 'not a sign-in secret');
select public.redeem_sign_in_link(pg_temp.secret('link-copy'), pg_temp.secret('sign-in-copy'));
select pg_temp.expect_refused('T117 using a stored sign-in fingerprint as the cookie',
  $q$select public.sign_in_parent(pg_temp.fp('sign-in-copy'))$q$, 'signed in');
reset role;

-- T118 (review, 15 Nov): the sign-in's length comes from the settings version
-- the bot stamped on the link, never from the caller (who can't pass one),
-- even when a newer version says something else.
set role service_role;
select public.create_sign_in_link(pg_temp.cara(), pg_temp.fp('link-v'), pg_temp.v());
reset role;
select public.record_settings_version('A later edition', '{"undo_window_seconds": 600, "connection_answer_window_hours": 24,
  "sign_in_link_seconds": 300, "sign_in_days": 2, "older_weeks_per_page": 4, "tile_text_chars": 40, "connection_weeks": 4}'::jsonb);
set role anon;
do $$
declare until timestamptz := public.redeem_sign_in_link(pg_temp.secret('link-v'), pg_temp.secret('sign-in-v'));
begin
  assert until > now() + interval '29 days', 'the sign-in should follow the link''s own settings version (30 days)';
  raise notice 'PASS: T118 the sign-in length comes from the link''s settings version';
end $$;
reset role;
do $$
begin
  assert not exists (select 1 from pg_proc where proname = 'redeem_sign_in_link' and pronargs <> 2), 'redeem should take only the two secrets';
  assert not exists (select 1 from pg_proc where proname in ('web_older_weeks', 'web_connection_history') and pronargs <> 1), 'the reads should take no settings version';
  raise notice 'PASS: T118 no caller can choose a settings version for sign-in or the reads';
end $$;

-- =============================================================================
-- [2026-11-24] Migration 012: log photos without a check, and the private photo
-- store (owner-approved tests of 24 Nov, T119 and T120).
-- A plain PostgreSQL has no Supabase Storage, so a small stand-in is made here
-- with the same names Supabase uses (storage.buckets, storage.objects with Row
-- Level Security on, storage.foldername). It checks our locks, not Supabase's
-- own storage service.
-- =============================================================================
select pg_temp.as_owner();
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id bigint generated always as identity primary key, bucket_id text references storage.buckets (id), name text not null);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to authenticated, service_role;
grant select, delete on storage.objects to authenticated;
grant all on storage.objects to service_role;

\i src/datastore/supabase/migrations/012_photos_unchecked_and_storage.sql

-- T119: a log's photo can now be saved "not checked" (the photo check is
-- parked); a moment photo is still only ever "not checked".
insert into public.consents (parent_id, topic, answer, wording_version) values (pg_temp.cara(), 'photos', 'agreed', 'photos-draft-2026-11-24');
insert into public.habit_logs (parent_id, nudge_id, for_day, logged_via, telegram_update_id)
values (pg_temp.cara(), pg_temp.n1(), public.sgt_today(), 'keyboard', 7100);
set role service_role;
do $$
declare p bigint;
begin
  p := public.add_log_photo(pg_temp.cara(), (select id from public.habit_logs where telegram_update_id = 7100),
                            pg_temp.cara()::text || '/log-7100.jpg', 'not_checked', pg_temp.v(), '["baseline"]'::jsonb);
  assert (select check_result from public.photos where id = p) = 'not_checked', 'a log photo should be saved as not checked';
  raise notice 'PASS: T119 a log photo can be saved without a check';
end $$;
reset role;
select pg_temp.expect_refused('T119 a moment photo marked as checked',
  $q$insert into public.photos (parent_id, moment_week, storage_path, check_result) values (pg_temp.cara(), '2026-11-02', 'x/y.jpg', 'passed')$q$,
  'photos_moment_never_checked');
do $$
begin
  assert (select not public and file_size_limit = 10485760 and allowed_mime_types = array['image/jpeg'] from storage.buckets where id = 'photos'),
    'the photos bucket should be private, JPEG only, at most 10 MB';
  raise notice 'PASS: T119 the photos store is private, JPEG only, at most 10 MB';
end $$;

-- T120: a parent's pass reaches only its own folder in the photo store: it can
-- see and delete its own files, never another parent's; no pass sees nothing.
-- Another parent's folder is named by a number no pass here holds (Dev's row may be gone by now).
insert into storage.buckets (id, name) values ('other', 'other');
insert into storage.objects (bucket_id, name) values
  ('photos', pg_temp.cara()::text || '/a.jpg'), ('photos', '999999/b.jpg'), ('other', pg_temp.cara()::text || '/c.jpg');
select pg_temp.pass_for(pg_temp.cara());
do $$
begin
  assert (select count(*) from storage.objects) = 1, 'Cara''s pass should see exactly her one photo file';
  assert (select name from storage.objects) like '%/a.jpg', 'Cara''s pass should see only her own file';
  delete from storage.objects where name like '%/b.jpg';
  raise notice 'PASS: T120 a pass sees only its own parent''s photo files';
end $$;
select pg_temp.as_owner();
do $$
begin
  assert (select count(*) from storage.objects where name like '%/b.jpg') = 1, 'Dev''s file must survive Cara''s delete';
  raise notice 'PASS: T120 a pass can''t delete another parent''s photo file';
end $$;
select pg_temp.pass_for(pg_temp.cara());
delete from storage.objects where name like '%/a.jpg';
select pg_temp.as_owner();
do $$
begin
  assert not exists (select 1 from storage.objects where name like '%/a.jpg'), 'Cara should be able to delete her own file';
  raise notice 'PASS: T120 a pass can delete its own parent''s photo file';
end $$;
select pg_temp.pass_for(null);
do $$
begin
  assert (select count(*) from storage.objects) = 0, 'no pass should see no photo files';
  raise notice 'PASS: T120 no pass sees no photo files';
end $$;
select pg_temp.as_owner();

-- =============================================================================
-- [2026-11-24] Migration 013: "Add how you felt" (owner-approved tests of 24
-- Nov, T121 to T123): a line added once to the parent's own log, within the
-- 10-minute wait after tapping the button.
-- =============================================================================
select pg_temp.as_owner();
\i src/datastore/supabase/migrations/013_add_how_you_felt.sql
select public.record_settings_version('Line wait', '{"undo_window_seconds": 600, "connection_answer_window_hours": 24,
  "sign_in_link_seconds": 300, "sign_in_days": 30, "older_weeks_per_page": 4, "tile_text_chars": 40, "connection_weeks": 4,
  "line_wait_seconds": 600}'::jsonb);
insert into public.habit_logs (parent_id, nudge_id, for_day, logged_via, telegram_update_id) values
  (pg_temp.cara(), pg_temp.n1(), public.sgt_today(), 'keyboard', 7200),
  (pg_temp.cara(), pg_temp.n2(), public.sgt_today(), 'keyboard', 7201);
create function pg_temp.log(p_update bigint) returns bigint language sql security definer as $$ select id from public.habit_logs where telegram_update_id = p_update $$;

-- T121: the tap notes the time and saves no words; the typed line goes to that
-- log once; a resent message is saved once; another line isn't saved over it.
set role service_role;
do $$
begin
  assert public.ask_for_line(pg_temp.cara(), pg_temp.log(7200)) = 'asked', 'the tap should be noted';
  assert (select description from public.habit_logs where id = pg_temp.log(7200)) is null, 'the tap saves no words';
  assert public.add_log_line(pg_temp.cara(), 'We laughed at the park', 8001, pg_temp.v(), '["baseline"]') = 'saved', 'the line should be saved';
  assert (select description from public.habit_logs where id = pg_temp.log(7200)) = 'We laughed at the park', 'the line should be on the log';
  assert public.add_log_line(pg_temp.cara(), 'We laughed at the park', 8001, pg_temp.v(), '["baseline"]') = 'duplicate', 'a resent message is saved once';
  assert public.add_log_line(pg_temp.cara(), 'A second line', 8002, pg_temp.v(), '["baseline"]') = 'none', 'nothing waits once the line is saved';
  assert public.ask_for_line(pg_temp.cara(), pg_temp.log(7200)) = 'has_line', 'a log with a line says so';
  assert (select description from public.habit_logs where id = pg_temp.log(7200)) = 'We laughed at the park', 'the line is never rewritten';
  assert exists (select 1 from public.events e join public.event_types t on t.id = e.event_type_id where t.name = 'log_line_added'), 'an event is written';
  raise notice 'PASS: T121 a line is added once to the log that asked, a resent message once';
end $$;
reset role;

-- T122: only within the wait, at most 280 characters, never empty.
set role service_role;
select public.ask_for_line(pg_temp.cara(), pg_temp.log(7201));
reset role;
select pg_temp.expect_refused('T122 a line over 280 characters',
  $q$select public.add_log_line(pg_temp.cara(), repeat('a', 281), 8003, pg_temp.v(), '["baseline"]')$q$, 'description_check');
select pg_temp.expect_refused('T122 an empty line',
  $q$select public.add_log_line(pg_temp.cara(), '   ', 8004, pg_temp.v(), '["baseline"]')$q$, 'empty');
update public.habit_logs set line_asked_at = now() - interval '11 minutes' where id = pg_temp.log(7201);
do $$
begin
  assert public.add_log_line(pg_temp.cara(), 'Too late', 8005, pg_temp.v(), '["baseline"]') = 'none', 'after 10 minutes nothing waits';
  assert (select description from public.habit_logs where id = pg_temp.log(7201)) is null, 'the late line is not saved';
  raise notice 'PASS: T122 only within the 10-minute wait, at most 280 characters, never empty';
end $$;

-- T123: only the parent's own log, never an undone one; the functions are the
-- bot's only (a page's pass or a signed-out browser can't use them).
select pg_temp.expect_refused('T123 asking for a line on another parent''s log',
  $q$select public.ask_for_line(pg_temp.cara() + 1000, pg_temp.log(7201))$q$, 'does not belong');
update public.habit_logs set undone_at = now() where id = pg_temp.log(7201);
select pg_temp.expect_refused('T123 asking for a line on an undone log',
  $q$select public.ask_for_line(pg_temp.cara(), pg_temp.log(7201))$q$, 'undone');
update public.habit_logs set line_asked_at = now() where id = pg_temp.log(7201);
do $$
begin
  assert public.add_log_line(pg_temp.cara(), 'Undone line', 8006, pg_temp.v(), '["baseline"]') = 'none', 'an undone log takes no line';
  raise notice 'PASS: T123 an undone log takes no line';
end $$;
select pg_temp.pass_for(pg_temp.cara());
select pg_temp.expect_refused('T123 a page''s pass adding a line',
  $q$select public.add_log_line(pg_temp.cara(), 'x', 8007, 1, '["baseline"]')$q$, 'permission denied');
select pg_temp.as_owner();

\echo ALL WEB APP ACCESS TESTS PASSED
