-- =============================================================================
-- src/datastore/supabase/migrations/016_web_settings.sql: what the Settings tab of My page reads and changes
--
-- What it does: [2026-11-25 SGT] the owner approved Settings on 25 Nov (rule
-- 9.9 in src/web-app/SPEC.md, rule 8.4 edit 17 in src/datastore/SPEC.md;
-- tests T131 to T145). With a parent's pass (rule 9.8), the Web app can:
--   1. read that parent's settings in one go (web_settings): their name,
--      children, chosen behaviours and how often, reminder times, paused or
--      not, the Wrap Up time, the date they agreed to recording, and the
--      behaviours they could choose;
--   2. change them, one narrow function per row of the Settings list:
--      pause on or off, the Wrap Up time, their name, add or rename a child,
--      their behaviours (and how often), the times on one schedule;
--   3. list every photo file they have (web_photo_paths), so our server can
--      remove the files first, and then "delete my data" (web_delete_my_data,
--      rule 1.5, rule 8.5 order), which is refused unless it is told every
--      file was removed.
--
-- Why it is built this way:
--   * Like migration 011's deletes, every change runs as web_page_writer, a
--     role that can't sign in, with exactly the rights it needs, and Row
--     Level Security still checks the pass on every row. Think of a hotel
--     key card that opens only your own room's minibar, and only the minibar.
--   * Every change writes an event stamped with the settings version, so
--     Telemetry and experiments see it (rule 11.2). The text itself (names)
--     never goes into an event.
--   * Changing a behaviour or how often STOPS the old pick and starts a new
--     one (picks never change, migration 003's guard), so history stays true.
--   * Renaming a child adds a correction row that "replaces" the old one
--     (migration 003's design), so nothing is overwritten.
--   * Counts are checked here, as at sign-up (migration 015): 1 to 3 times a
--     schedule, up to 2 quick and 1 deliberate behaviour with at least 1, up
--     to 3 children. Which times and frequencies are allowed is checked by
--     the app against src/settings.ts, as at sign-up (rule 1.4: those values
--     live once, in code).
--   * Pausing or resuming returns the parent's Telegram chat number to our
--     server only, so the bot can tell them in Telegram and change their Menu
--     (owner, 25 Nov: "also send a short line in Telegram"). The pass lives
--     only on our server (the browser holds a sign-in cookie, never a pass),
--     and a page never shows the number. The pass still can't read it from
--     the table (T131); only this one function hands it back.
--   * Everything is one transaction: if any step fails, nothing changes.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once, AFTER
-- migration 015. After it has run on the real project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/web-app-access.test.sql (T131 to T145).
-- =============================================================================

begin;

-- ---- 1. New event types (no names or text in any event) ----------------------
insert into public.event_types (name, meaning, metric) values
  ('name_changed',  'A parent changed the name the bot calls them (Settings).', null),
  ('child_added',   'A parent added a child (Settings).',                       null),
  ('child_renamed', 'A parent corrected a child''s name (Settings).',          null);

-- ---- 2. Read: the whole Settings tab in one go -------------------------------
-- Runs with the pass's own rights ("security invoker"), so Row Level Security
-- decides what it sees: only the pass's parent.
create function public.web_settings()
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        p record;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  select first_name, paused, wrap_up_minute into p from parents where id = me;
  if not found then raise exception 'Not signed in (rule 9.8).'; end if;
  return jsonb_build_object(
    'first_name', p.first_name,
    'paused', p.paused,
    'wrap_up_minute', p.wrap_up_minute,
    -- Children still in use: a corrected name has been replaced by a newer row.
    'children', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'first_name', c.first_name) order by c.created_at, c.id)
        from children c
       where c.parent_id = me and not exists (select 1 from children r where r.replaces_id = c.id)), '[]'::jsonb),
    -- Behaviours chosen now (not stopped), with how often.
    'picks', coalesce((
      select jsonb_agg(jsonb_build_object('nudge_id', k.nudge_id, 'frequency', k.frequency) order by k.id)
        from picks k where k.parent_id = me and k.stopped_at is null), '[]'::jsonb),
    -- The behaviours a parent can choose: the same list as at sign-up.
    'behaviours', coalesce((
      select jsonb_agg(jsonb_build_object('id', n.id, 'name', n.name, 'category', n.category) order by n.id)
        from nudges n where n.active and n.starts_unlocked), '[]'::jsonb),
    'school_slots', coalesce((
      select jsonb_agg(s.start_minute order by s.start_minute) from slots s where s.parent_id = me and s.schedule = 'school'), '[]'::jsonb),
    'non_school_slots', coalesce((
      select jsonb_agg(s.start_minute order by s.start_minute) from slots s where s.parent_id = me and s.schedule = 'non_school'), '[]'::jsonb),
    -- When they agreed to recording at sign-up (the newest "agreed").
    'recording_agreed_at', (
      select max(c.created_at) from consents c where c.parent_id = me and c.topic = 'recording' and c.answer = 'agreed'));
end $$;

-- Every photo file of the pass's parent (each photo and its small preview),
-- so our server can remove them from storage BEFORE "delete my data" (rule 8.5).
create function public.web_photo_paths()
returns setof text language sql stable security invoker set search_path = public, pg_temp as $$
  select x from photos ph, unnest(array[ph.storage_path, ph.preview_path]) x
   where ph.parent_id = public.pass_parent_id() and x is not null
$$;

-- ---- 3. The narrow changes (rule 8.4 edit 17) ---------------------------------
-- Each one: no pass, no change; only the pass's parent's rows; one event.

-- Pause on or off. Returns the parent's Telegram chat number, for our server
-- to send the short Telegram line and change the Menu (owner, 25 Nov).
create function public.web_set_paused(p_paused boolean, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        chat bigint;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_paused is null then raise exception 'Paused must be on or off.'; end if;
  update parents set paused = p_paused where id = me returning telegram_id into chat;
  if not found then raise exception 'Not signed in (rule 9.8).'; end if;
  perform write_event(me, 'settings_changed', p_version, p_variants);
  return chat;
end $$;

-- The Weekly Wrap Up's Sunday time (rule 3.12: a time only, no switch). The
-- app checks it is one of the allowed 30-minute starts (src/settings.ts).
create function public.web_set_wrap_up_time(p_minute integer, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_minute is null or p_minute not between 0 and 1439 then raise exception 'That is not a time of day.'; end if;
  update parents set wrap_up_minute = p_minute where id = me;
  if not found then raise exception 'Not signed in (rule 9.8).'; end if;
  perform write_event(me, 'settings_changed', p_version, p_variants);
end $$;

-- The name the bot calls the parent. Never blank.
create function public.web_set_name(p_first_name text, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_first_name is null or btrim(p_first_name) = '' then raise exception 'A name can''t be blank.'; end if;
  update parents set first_name = btrim(p_first_name) where id = me;
  if not found then raise exception 'Not signed in (rule 9.8).'; end if;
  perform write_event(me, 'name_changed', p_version, p_variants);
end $$;

-- Add a child (the children limit of 3 is migration 007's guard).
create function public.web_add_child(p_first_name text, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_first_name is null or btrim(p_first_name) = '' then raise exception 'A child''s name can''t be blank.'; end if;
  insert into children (parent_id, first_name) values (me, btrim(p_first_name));
  perform write_event(me, 'child_added', p_version, p_variants);
end $$;

-- Correct a child's name: a new row replaces the old one (the old one stays
-- as history). Only a child still in use, of this parent.
create function public.web_rename_child(p_child bigint, p_first_name text, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        old record;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_first_name is null or btrim(p_first_name) = '' then raise exception 'A child''s name can''t be blank.'; end if;
  select id, first_name, birth_year into old from children c
   where c.id = p_child and c.parent_id = me and not exists (select 1 from children r where r.replaces_id = c.id);
  if not found then raise exception 'That child was not found.'; end if;
  if old.first_name = btrim(p_first_name) then return; end if;  -- nothing changed: no new row, no event
  insert into children (parent_id, first_name, birth_year, replaces_id) values (me, btrim(p_first_name), old.birth_year, old.id);
  perform write_event(me, 'child_renamed', p_version, p_variants);
end $$;

-- The chosen behaviours, as a list of {nudge_id, frequency}: up to 2 quick and
-- 1 deliberate, at least 1 (rule 2.1). A pick that is unchanged stays; a pick
-- dropped, or with a new frequency, is stopped; a new one is started.
create function public.web_set_behaviours(p_picks jsonb, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        quick int; deliberate int; total int; k record;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_picks is null or jsonb_typeof(p_picks) <> 'array' then raise exception 'Behaviours must be a list.'; end if;
  total := jsonb_array_length(p_picks);
  -- Count only behaviours a parent may choose (active and open at sign-up),
  -- each at most once, each with a frequency word.
  select count(distinct n.id) filter (where n.category = 'quick'), count(distinct n.id) filter (where n.category = 'deliberate')
    into quick, deliberate
    from jsonb_array_elements(p_picks) x
    join nudges n on n.id = (x ->> 'nudge_id')::bigint and n.active and n.starts_unlocked
   where coalesce(x ->> 'frequency', '') ~ '^[a-z_0-9]+$';
  if quick + deliberate < 1 or quick > 2 or deliberate > 1 or quick + deliberate <> total then
    raise exception 'Choose up to 2 quick and 1 deliberate behaviour, at least 1 (rule 2.1).';
  end if;
  -- Stop what is no longer chosen, or chosen with a new frequency.
  for k in select id from picks pk
            where pk.parent_id = me and pk.stopped_at is null
              and not exists (select 1 from jsonb_array_elements(p_picks) x
                               where (x ->> 'nudge_id')::bigint = pk.nudge_id and x ->> 'frequency' = pk.frequency) loop
    update picks set stopped_at = now() where id = k.id;
    perform write_event(me, 'pick_stopped', p_version, p_variants);
  end loop;
  -- Start what is new.
  for k in select (x ->> 'nudge_id')::bigint as nudge_id, x ->> 'frequency' as frequency from jsonb_array_elements(p_picks) x
            where not exists (select 1 from picks pk where pk.parent_id = me and pk.stopped_at is null
                                 and pk.nudge_id = (x ->> 'nudge_id')::bigint and pk.frequency = x ->> 'frequency') loop
    insert into picks (parent_id, nudge_id, frequency) values (me, k.nudge_id, k.frequency);
    perform write_event(me, 'pick_chosen', p_version, p_variants);
  end loop;
end $$;

-- The reminder times on one schedule: 1 to 3, each a time of day, no repeats
-- (rule 3.1). The app checks they are allowed starts at least 1 hour apart.
create function public.web_set_times(p_schedule text, p_minutes integer[], p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        n int := coalesce(cardinality(p_minutes), 0);
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_schedule not in ('school', 'non_school') then raise exception 'Unknown schedule.'; end if;
  if n < 1 or n > 3 then raise exception 'Each schedule needs 1 to 3 times (rule 3.1).'; end if;
  if exists (select 1 from unnest(p_minutes) m where m is null or m not between 0 and 1439) then
    raise exception 'That is not a time of day.';
  end if;
  if (select count(distinct m) from unnest(p_minutes) m) <> n then raise exception 'The same time is there twice.'; end if;
  delete from slots where parent_id = me and schedule = p_schedule;
  insert into slots (parent_id, schedule, start_minute) select me, p_schedule, m::smallint from unnest(p_minutes) m;
  perform write_event(me, 'slots_replaced', p_version, p_variants);
end $$;

-- "Delete my data" (rule 1.5) for the pass's parent. Our server must first
-- remove every photo file (rule 8.5) and then hand over the list it removed:
-- the delete is refused unless that list covers every file the database
-- still holds, so a photo can't be left in storage with no record of it
-- (privacy review, 25 Nov). Removing the parent removes every row about
-- them through the links, sign-ins and a running demo included, so the
-- cookie stops working; an unfinished demo sign-up goes too. One
-- deletion-log row with no name or ID is kept.
create function public.web_delete_my_data(p_removed_files text[])
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        chat bigint;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if exists (select 1 from photos ph, unnest(array[ph.storage_path, ph.preview_path]) x
              where ph.parent_id in (select id from parents where id = me or demo_of = me)
                and x is not null and x <> all (coalesce(p_removed_files, array[]::text[]))) then
    raise exception 'Remove every photo file first (rule 8.5).';
  end if;
  select telegram_id into chat from parents where id = me;
  if not found then raise exception 'Not signed in (rule 9.8).'; end if;
  delete from sign_up_drafts where telegram_id = -chat;  -- an unfinished demo sign-up (migration 015)
  delete from parents where id = me;
  insert into deletion_log (on_day, how_many) values (sgt_today(), 1);
end $$;

-- Hand the changes to web_page_writer (CREATE on the schema only for this
-- moment, taken back straight after, as in migration 011).
grant web_page_writer to current_user;
grant usage, create on schema public to web_page_writer;
alter function public.web_set_paused(boolean, bigint, jsonb) owner to web_page_writer;
alter function public.web_set_wrap_up_time(integer, bigint, jsonb) owner to web_page_writer;
alter function public.web_set_name(text, bigint, jsonb) owner to web_page_writer;
alter function public.web_add_child(text, bigint, jsonb) owner to web_page_writer;
alter function public.web_rename_child(bigint, text, bigint, jsonb) owner to web_page_writer;
alter function public.web_set_behaviours(jsonb, bigint, jsonb) owner to web_page_writer;
alter function public.web_set_times(text, integer[], bigint, jsonb) owner to web_page_writer;
alter function public.web_delete_my_data(text[]) owner to web_page_writer;
revoke create on schema public from web_page_writer;
revoke web_page_writer from current_user;
comment on role web_page_writer is 'Runs the Web app''s narrow deletes and Settings changes (rule 8.4 edits 6, 11 to 13, 17). Cannot sign in; still behind Row Level Security.';

-- ---- 4. Locks: Row Level Security policies -----------------------------------
-- A parent's pass reads only that parent's picks, times and consents.
-- (Row Level Security is already switched on for these tables, migration 003.)
create policy web_own_picks on public.picks for select to authenticated using (parent_id = public.pass_parent_id());
create policy web_own_slots on public.slots for select to authenticated using (parent_id = public.pass_parent_id());
create policy web_own_consents on public.consents for select to authenticated using (parent_id = public.pass_parent_id());

-- The writer role: only the pass's parent's rows, for each kind of change.
create policy web_writer_parent_read on public.parents for select to web_page_writer using (id = public.pass_parent_id());
create policy web_writer_parent_change on public.parents for update to web_page_writer
  using (id = public.pass_parent_id()) with check (id = public.pass_parent_id());
create policy web_writer_parent_delete on public.parents for delete to web_page_writer
  using (id = public.pass_parent_id());
create policy web_writer_children_read on public.children for select to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_children_add on public.children for insert to web_page_writer with check (parent_id = public.pass_parent_id());
create policy web_writer_picks_read on public.picks for select to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_picks_add on public.picks for insert to web_page_writer with check (parent_id = public.pass_parent_id());
create policy web_writer_picks_stop on public.picks for update to web_page_writer
  using (parent_id = public.pass_parent_id()) with check (parent_id = public.pass_parent_id());
create policy web_writer_slots_read on public.slots for select to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_slots_add on public.slots for insert to web_page_writer with check (parent_id = public.pass_parent_id());
create policy web_writer_slots_remove on public.slots for delete to web_page_writer using (parent_id = public.pass_parent_id());
-- The behaviours are shared content: the writer may read them, to count a choice.
create policy web_writer_habit_names on public.nudges for select to web_page_writer using (true);
-- An unfinished demo sign-up of the pass's parent (its number is the parent's made negative).
create policy web_writer_demo_draft_read on public.sign_up_drafts for select to web_page_writer
  using (telegram_id = -(select p.telegram_id from public.parents p where p.id = public.pass_parent_id()));
create policy web_writer_demo_draft_delete on public.sign_up_drafts for delete to web_page_writer
  using (telegram_id = -(select p.telegram_id from public.parents p where p.id = public.pass_parent_id()));
-- The writer reads the parent's demo row too, so the photo check covers the demo's photos.
create policy web_writer_demo_parent_read on public.parents for select to web_page_writer using (demo_of = public.pass_parent_id());
-- The deletion log holds no name or ID, so the writer may add a row to it, never read it.
create policy web_writer_deletion_log_add on public.deletion_log for insert to web_page_writer with check (true);

-- ---- 5. Permissions ------------------------------------------------------------
revoke all on function public.web_settings(), public.web_photo_paths(),
  public.web_set_paused(boolean, bigint, jsonb), public.web_set_wrap_up_time(integer, bigint, jsonb),
  public.web_set_name(text, bigint, jsonb), public.web_add_child(text, bigint, jsonb),
  public.web_rename_child(bigint, text, bigint, jsonb), public.web_set_behaviours(jsonb, bigint, jsonb),
  public.web_set_times(text, integer[], bigint, jsonb), public.web_delete_my_data(text[])
  from public, anon, authenticated, service_role;

-- A parent's pass: the extra columns the Settings tab shows (never Telegram
-- IDs from the table, cohorts, birth years or wording versions).
grant select (paused, wrap_up_minute) on public.parents to authenticated;
grant select (id, parent_id, nudge_id, frequency, stopped_at) on public.picks to authenticated;
grant select (id, parent_id, schedule, start_minute) on public.slots to authenticated;
grant select (id, parent_id, topic, answer, created_at) on public.consents to authenticated;
grant select (category, active, starts_unlocked) on public.nudges to authenticated;
grant execute on function public.web_settings(), public.web_photo_paths(),
  public.web_set_paused(boolean, bigint, jsonb), public.web_set_wrap_up_time(integer, bigint, jsonb),
  public.web_set_name(text, bigint, jsonb), public.web_add_child(text, bigint, jsonb),
  public.web_rename_child(bigint, text, bigint, jsonb), public.web_set_behaviours(jsonb, bigint, jsonb),
  public.web_set_times(text, integer[], bigint, jsonb), public.web_delete_my_data(text[])
  to authenticated;

-- The writer role: exactly what the changes above need (telegram_id: only for
-- the pause's Telegram line and the demo sign-up's number).
grant select (id, telegram_id, first_name, demo_of) on public.parents to web_page_writer;
grant select (id, parent_id, storage_path, preview_path) on public.photos to web_page_writer;
grant select (id, telegram_id) on public.sign_up_drafts to web_page_writer;
grant delete on public.sign_up_drafts to web_page_writer;
grant update (paused, wrap_up_minute, first_name) on public.parents to web_page_writer;
grant delete on public.parents to web_page_writer;
grant select (id, parent_id, first_name, birth_year, replaces_id, created_at) on public.children to web_page_writer;
grant insert (parent_id, first_name, birth_year, replaces_id) on public.children to web_page_writer;
grant select (id, category, active, starts_unlocked) on public.nudges to web_page_writer;
grant select (id, parent_id, nudge_id, frequency, stopped_at) on public.picks to web_page_writer;
grant insert (parent_id, nudge_id, frequency) on public.picks to web_page_writer;
grant update (stopped_at) on public.picks to web_page_writer;
grant select (id, parent_id, schedule, start_minute) on public.slots to web_page_writer;
grant insert (parent_id, schedule, start_minute) on public.slots to web_page_writer;
grant delete on public.slots to web_page_writer;
grant insert (on_day, how_many) on public.deletion_log to web_page_writer;
grant execute on function public.sgt_today() to web_page_writer;

commit;
