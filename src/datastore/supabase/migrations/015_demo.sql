-- =============================================================================
-- Migration 015: the Demo module (rules 12.1 to 12.7, owner 24 Nov)
--
-- What it does, in plain English: [2026-11-24] lets the owner run a demo on
-- their own Telegram account with a fresh, separate demo parent (tests T127
-- to T130):
--   1. A demo parent is marked by demo_of: the real parent (the owner) it
--      belongs to; one demo parent per owner. It has no Telegram account of its
--      own, so its telegram_id is the owner's, made negative (the bot replies
--      in the owner's chat). Real parents keep positive numbers.
--   2. start_demo_sign_up: removes any earlier demo (its rows; the app removes
--      its photo files first, rule 8.5) and starts the real sign-up for the
--      demo, with no invite code (rule 12.2).
--   3. finish_sign_up, the same as migration 007 except: a demo sign-up needs
--      no invite and its parent is linked to the owner.
--   4. delete_demo and demo_photo_paths: "delete my data" for the demo parent
--      (rule 12.7): the app removes the photo files (paths from
--      demo_photo_paths), then delete_demo removes every row.
--   5. The Telemetry views leave demo parents out (rule 12.7).
--   6. claim_expired_questions, the same as migration 014 except a demo
--      parent's question is edited in the owner's chat.
--   7. clean_up_sign_ups, the same as migration 010 except an abandoned demo
--      sign-up (a negative number) is deleted outright, never counted as a
--      sign-up that stopped (it would reach the onboarding metrics; rule 12.7).
-- Run once in Supabase's SQL Editor after 014.
-- =============================================================================

-- ---- 1. The demo mark -------------------------------------------------------------
alter table public.parents add column demo_of bigint references public.parents (id) on delete cascade;
create unique index parents_one_demo_each on public.parents (demo_of) where demo_of is not null;
alter table public.parents add constraint parents_demo_telegram_id
  check ((demo_of is null and telegram_id > 0) or (demo_of is not null and telegram_id < 0));
comment on column public.parents.demo_of is
  'For a demo parent (rule 12.7): the real parent (the owner) it belongs to; empty for every real parent.';

-- ---- 2. Starting a demo -------------------------------------------------------------
create function public.start_demo_sign_up(p_owner_telegram_id bigint, p_first_name text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare owner bigint := (select id from parents where telegram_id = p_owner_telegram_id and demo_of is null);
begin
  if owner is null then raise exception 'Only a signed-up parent can start a demo.'; end if;
  delete from parents where demo_of = owner;  -- an earlier demo, with all its rows (rule 12.2)
  delete from sign_up_drafts where telegram_id = -p_owner_telegram_id;
  insert into sign_up_drafts (telegram_id, invite_id, step, answers)
  values (-p_owner_telegram_id, null, 'name', jsonb_build_object('first_name', p_first_name));
end $$;

-- ---- 3. "I agree", now also for a demo -----------------------------------------------
create or replace function public.finish_sign_up(p_telegram_id bigint, p_cohort text, p_wrap_up_minute integer, p_wording_version text,
                                                 p_update bigint, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare d record; p bigint; a jsonb; c jsonb; k jsonb; sched text; quick int; deliberate int; n int; owner bigint;
begin
  select * into d from sign_up_drafts where telegram_id = p_telegram_id and cut_down_at is null for update;
  if not found then raise exception 'No sign-up in progress for this Telegram account.'; end if;
  a := d.answers;
  -- A demo sign-up (a negative number): its owner must be a real parent (rule 12.2).
  if p_telegram_id < 0 then
    owner := (select id from parents where telegram_id = -p_telegram_id and demo_of is null);
    if owner is null then raise exception 'This demo has no owner.'; end if;
  end if;
  -- Children: 1 to 3, each with a name (Q7b, rule 8.10).
  n := coalesce(jsonb_array_length(a -> 'children'), 0);
  if n < 1 or n > 3 then raise exception 'A sign-up needs 1 to 3 children (Q7b).'; end if;
  -- Picks: up to 2 quick and 1 deliberate, at least 1 (rule 2.1).
  select count(*) filter (where nu.category = 'quick'), count(*) filter (where nu.category = 'deliberate')
    into quick, deliberate
  from jsonb_array_elements(coalesce(a -> 'picks', '[]'::jsonb)) x join nudges nu on nu.id = (x ->> 'nudge_id')::bigint;
  if quick + deliberate < 1 or quick > 2 or deliberate > 1
     or quick + deliberate <> coalesce(jsonb_array_length(a -> 'picks'), 0) then
    raise exception 'A sign-up needs up to 2 quick and 1 deliberate behaviour, at least 1 (rule 2.1).';
  end if;
  -- Times: 1 to 3 for each schedule (rule 3.1; the app also checks 1 hour apart).
  foreach sched in array array['school', 'non_school'] loop
    n := coalesce(jsonb_array_length(a -> 'slots' -> sched), 0);
    if n < 1 or n > 3 then raise exception 'Each schedule needs 1 to 3 times (rule 3.1).'; end if;
  end loop;

  insert into parents (telegram_id, first_name, cohort, wrap_up_minute, demo_of)
  values (p_telegram_id, a ->> 'first_name', p_cohort, p_wrap_up_minute, owner) returning id into p;
  for c in select * from jsonb_array_elements(a -> 'children') loop
    insert into children (parent_id, first_name) values (p, btrim(c #>> '{}'));
  end loop;
  for k in select * from jsonb_array_elements(a -> 'picks') loop
    insert into picks (parent_id, nudge_id, frequency) values (p, (k ->> 'nudge_id')::bigint, k ->> 'frequency');
    perform write_event(p, 'pick_chosen', p_version, p_variants);
  end loop;
  foreach sched in array array['school', 'non_school'] loop
    insert into slots (parent_id, schedule, start_minute)
    select p, sched, m::smallint from jsonb_array_elements_text(a -> 'slots' -> sched) m;
  end loop;
  insert into consents (parent_id, topic, answer, wording_version) values (p, 'recording', 'agreed', p_wording_version);
  if owner is null then
    update invites set used_by = p, used_at = now(), held_by_telegram_id = null, held_at = null where id = d.invite_id;
    if not found then raise exception 'The invite held for this sign-up is missing.'; end if;
  end if;
  perform write_event(p, 'signed_up', p_version, p_variants, p_update);
  delete from sign_up_drafts where id = d.id;
  return p;
end $$;

-- ---- 4. Ending a demo -----------------------------------------------------------------
-- The demo parent's photo files (and small previews), for the app to remove first (rule 8.5).
create function public.demo_photo_paths(p_owner_telegram_id bigint)
returns setof text language sql stable security definer set search_path = public, pg_temp as $$
  select unnest(array[ph.storage_path, ph.preview_path]) from photos ph join parents d on d.id = ph.parent_id
   join parents o on o.id = d.demo_of where o.telegram_id = p_owner_telegram_id
$$;
create function public.delete_demo(p_owner_telegram_id bigint)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from parents where demo_of = (select id from parents where telegram_id = p_owner_telegram_id and demo_of is null);
  delete from sign_up_drafts where telegram_id = -p_owner_telegram_id;
end $$;

-- ---- 5. Telemetry never sees a demo parent (rule 12.7) -----------------------------
create or replace view public.telemetry_parents with (security_invoker = true) as
  select id, signed_up_on, cohort, paused, wrap_up_minute, created_at from public.parents where demo_of is null;
create or replace view public.telemetry_children with (security_invoker = true) as
  select id, parent_id, birth_year, replaces_id, created_at from public.children
   where parent_id not in (select id from public.parents where demo_of is not null);
create or replace view public.telemetry_habit_logs with (security_invoker = true) as
  select id, parent_id, nudge_id, for_day, logged_at, from_message_id, logged_via, undone_at, created_at from public.habit_logs
   where parent_id not in (select id from public.parents where demo_of is not null);
create or replace view public.telemetry_events with (security_invoker = true) as
  select id, parent_id, event_type_id, occurred_at, settings_version, variants, created_at from public.events
   where parent_id is null or parent_id not in (select id from public.parents where demo_of is not null);
create or replace view public.telemetry_connection_answers with (security_invoker = true) as
  select id, parent_id, week_starting, score, created_at from public.connection_answers
   where parent_id not in (select id from public.parents where demo_of is not null);
create or replace view public.telemetry_photos with (security_invoker = true) as
  select id, parent_id, log_id, moment_week, check_result, created_at from public.photos
   where parent_id not in (select id from public.parents where demo_of is not null);
create or replace view public.telemetry_reflections with (security_invoker = true) as
  select id, parent_id, for_day, nudge_id, source, created_at from public.reflections
   where parent_id not in (select id from public.parents where demo_of is not null);
create or replace view public.telemetry_moment_lines with (security_invoker = true) as
  select id, parent_id, week_starting, created_at from public.moment_lines
   where parent_id not in (select id from public.parents where demo_of is not null);

-- ---- 6. A demo question expires in the owner's chat ------------------------------------
create or replace function public.claim_expired_questions(p_version bigint, p_variants jsonb)
returns table (parent_id bigint, telegram_id bigint, telegram_message_id bigint, week date)
language plpgsql security definer set search_path = public, pg_temp as $$
declare window_hours numeric := setting_number(p_version, 'connection_answer_window_hours'); q record;
begin
  for q in
    select m.parent_id, coalesce(o.telegram_id, p.telegram_id) as chat, m.telegram_message_id,
           date_trunc('week', m.for_day::timestamp)::date as week, m.sent_at
      from messages_sent m join parents p on p.id = m.parent_id left join parents o on o.id = p.demo_of
     where m.kind = 'connection_question'
       and m.sent_at < now() - make_interval(secs => window_hours * 3600)
       and m.sent_at > now() - interval '8 days'
       and not exists (select 1 from connection_answers a
                        where a.parent_id = m.parent_id and a.week_starting = date_trunc('week', m.for_day::timestamp)::date)
       and not exists (select 1 from events e join event_types t on t.id = e.event_type_id
                        where e.parent_id = m.parent_id and t.name = 'connection_question_expired' and e.occurred_at > m.sent_at)
  loop
    perform write_event(q.parent_id, 'connection_question_expired', p_version, p_variants);
    parent_id := q.parent_id; telegram_id := q.chat; telegram_message_id := q.telegram_message_id; week := q.week;
    return next;
  end loop;
end $$;

-- ---- 7. An abandoned demo sign-up never reaches the sign-up metrics (review, 24 Nov) ----
create or replace function public.clean_up_sign_ups(p_version bigint)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare keep_days numeric := setting_number(p_version, 'sign_up_draft_keep_days');
        record_days numeric := setting_number(p_version, 'sign_up_stopped_keep_days');
begin
  -- A demo sign-up left quiet for the same 7 days is simply deleted (rule 12.7).
  delete from sign_up_drafts where telegram_id < 0 and last_activity_at < now() - make_interval(days => keep_days::int);
  -- One statement, rows locked first: a step saved at the same moment waits,
  -- then finds the draft cut down (review finding, 12 Nov).
  with quiet as (
    select id, step, invite_id from sign_up_drafts
    where cut_down_at is null and last_activity_at < now() - make_interval(days => keep_days::int)
    for update
  ), counted as (
    insert into sign_up_stops (on_day, last_step) select sgt_today(), step from quiet
  ), released as (
    update invites set held_by_telegram_id = null, held_at = null where id in (select invite_id from quiet)
  )
  update sign_up_drafts set answers = '{}'::jsonb, invite_id = null, screen_message_id = null, cut_down_at = now()
  where id in (select id from quiet);
  delete from sign_up_drafts where last_activity_at < now() - make_interval(days => record_days::int);
end $$;

-- New functions start locked; only our server (the bot) may use them.
revoke all on function public.start_demo_sign_up(bigint, text), public.demo_photo_paths(bigint), public.delete_demo(bigint)
  from public, anon, authenticated, service_role;
grant execute on function public.start_demo_sign_up(bigint, text), public.demo_photo_paths(bigint), public.delete_demo(bigint) to service_role;
