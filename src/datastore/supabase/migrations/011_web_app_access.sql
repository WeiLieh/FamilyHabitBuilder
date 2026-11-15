-- =============================================================================
-- src/datastore/supabase/migrations/011_web_app_access.sql: the Web app's way into the database
--
-- What it does: [2026-11-15 SGT] the database side of the Web app foundations
-- (src/web-app/SPEC.md rules 9.3, 9.6 and 9.8; src/datastore/SPEC.md,
-- "Approved: what the Web app pages need"; owner-approved tests of 15 Nov):
--   1. Sign-in: a one-time sign-in link that expires after 5 minutes, and a
--      sign-in that lasts 30 days (rule 9.3). The database keeps only a
--      fingerprint of each (a one-way scramble made by the app), never the
--      link or the cookie itself, so a copy of this table opens nothing.
--   2. Per-parent access (rule 9.8): the Web app never uses the master key.
--      For each request it sends a short "pass" for one parent; the
--      database's own rules (Row Level Security) then show that pass only
--      that parent's rows, and only the columns the pages need. No pass, no
--      rows.
--   3. The three reads: one week, older weeks four at a time, and the
--      connection history.
--   4. The narrow deletes (rule 8.4, edits 6 and 11 to 13): delete one photo
--      (with its small preview), wipe one log's line, remove one reflection,
--      remove one moment line. Each is all or nothing and writes an event
--      that holds no deleted text. No habit log is ever deleted here and no
--      words are ever edited.
--
-- Why it is built this way: like a hotel key card. The front desk (sign-in)
-- hands out a card that opens one room; the lock on every door (Row Level
-- Security) checks the card, so even a mistake in our code can't open
-- another family's room. The deletes run as their own small role
-- (web_page_writer) that can do exactly these four things, still behind the
-- same locks, so a parent's pass can't delete or change anything directly.
--
-- How to apply: Supabase > SQL Editor > a fresh tab > paste this file > Run,
-- once, AFTER migration 010, before the Web app goes live. After it has run on
-- the real project it is never edited (rule B1); a change is a new migration.
-- =============================================================================

begin;

-- ---- 1. Helpers --------------------------------------------------------------

-- Which parent the request's pass is for, or nothing. Supabase puts the pass's
-- contents (its "claims") in request.jwt.claims for each request; our server
-- writes the parent's number into it when it signs the pass (rule 9.8).
create function public.pass_parent_id() returns bigint
language sql stable security invoker set search_path = public, pg_temp as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'parent_id', '')::bigint
$$;
comment on function public.pass_parent_id() is 'The parent named in this request''s pass, or empty with no pass (rule 9.8).';

-- The Monday of a day's week (weeks run Monday to Sunday).
create function public.week_monday(p_day date) returns date
language sql immutable set search_path = public, pg_temp as $$
  select p_day - (extract(isodow from p_day)::int - 1)
$$;
comment on function public.week_monday(date) is 'The Monday of the week a day falls in.';

-- A tile's short text: the first p_chars characters, cut back to a whole word,
-- with "…" when anything was cut (Datastore, read 2).
create function public.cut_text(p_text text, p_chars integer) returns text
language plpgsql immutable set search_path = public, pg_temp as $$
declare s text;
begin
  if char_length(p_text) <= p_chars then return p_text; end if;
  s := left(p_text, p_chars);
  -- If the cut fell inside a word, drop that part-word (unless it is the only word).
  if substr(p_text, p_chars + 1, 1) !~ '\s' and s ~ '\s' then
    s := regexp_replace(s, '\s+\S*$', '');
  end if;
  return rtrim(s) || '…';
end $$;
comment on function public.cut_text(text, integer) is 'The first N characters of a text, cut at a word, with "…" (read 2).';

-- ---- 2. New event types (rule 10.2) and the photo's small preview -----------
insert into public.event_types (name, meaning, metric) values
  ('log_line_deleted',    'A parent wiped the line of one of their logs on My page; the log stays (rule 8.4, edit 11).', null),
  ('reflection_deleted',  'A parent removed one of their reflections on My page (rule 8.4, edit 12).',                  null),
  ('moment_line_deleted', 'A parent removed the line of one of their moments on My page (rule 8.4, edit 13).',          null);

alter table public.photos add column preview_path text check (preview_path is null or btrim(preview_path) <> '');
comment on column public.photos.preview_path is 'Where the photo''s small preview is in storage, if one was made (rule 9.6). Deleted with the photo. Personal: never shown to Telemetry.';

-- ---- 3. Sign-in tables (rule 9.3) --------------------------------------------
create table public.web_sign_in_links (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  link_fingerprint text not null unique check (link_fingerprint ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.web_sign_in_links is 'One "open My page" link the bot sent (rule 9.3). Works once, for 5 minutes. Only its fingerprint is kept.';
comment on column public.web_sign_in_links.id is 'A number the database makes up.';
comment on column public.web_sign_in_links.parent_id is 'Which parent the link signs in.';
comment on column public.web_sign_in_links.link_fingerprint is 'A SHA-256 fingerprint of the link''s secret part, made by the app; never the link itself.';
comment on column public.web_sign_in_links.expires_at is 'When it stops working (5 minutes after it was made; the number is in src/settings.ts).';
comment on column public.web_sign_in_links.used_at is 'When it was used; a used link never works again. Empty until then.';
comment on column public.web_sign_in_links.created_at is 'When the row was added.';

create table public.web_sign_ins (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  sign_in_fingerprint text not null unique check (sign_in_fingerprint ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.web_sign_ins is 'One signed-in browser (rule 9.3). Lasts 30 days; Sign out and "delete my data" end it. Only the cookie''s fingerprint is kept.';
comment on column public.web_sign_ins.id is 'A number the database makes up.';
comment on column public.web_sign_ins.parent_id is 'Which parent is signed in.';
comment on column public.web_sign_ins.sign_in_fingerprint is 'A SHA-256 fingerprint of the protected cookie''s value, made by the app; never the value itself.';
comment on column public.web_sign_ins.expires_at is 'When it ends by itself (30 days after sign-in; the number is in src/settings.ts).';
comment on column public.web_sign_ins.ended_at is 'When Sign out ended it; empty while it is active.';
comment on column public.web_sign_ins.created_at is 'When the row was added.';

-- ---- 4. Sign-in functions ------------------------------------------------------
-- The bot makes a link for /mypage (our server's role only). Old used or
-- expired links of the same parent are tidied away at the same time.
create function public.create_sign_in_link(p_parent bigint, p_link_fingerprint text, p_version bigint)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare until timestamptz := now() + make_interval(secs => setting_number(p_version, 'sign_in_link_seconds'));
begin
  if p_link_fingerprint is null or p_link_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'Only a fingerprint of the link is stored (rule 9.3).';
  end if;
  if not exists (select 1 from parents where id = p_parent) then raise exception 'No parent %', p_parent; end if;
  delete from web_sign_in_links where parent_id = p_parent and (used_at is not null or expires_at <= now());
  insert into web_sign_in_links (parent_id, link_fingerprint, expires_at) values (p_parent, p_link_fingerprint, until);
  return until;
end $$;

-- The one button press after opening the link: uses the link up and starts a
-- 30-day sign-in. A used, expired or unknown link gets the same answer, so it
-- tells a guesser nothing (rules 9.3, 1.3).
create function public.redeem_sign_in_link(p_link_fingerprint text, p_sign_in_fingerprint text, p_version bigint)
returns timestamptz language plpgsql security definer set search_path = public, pg_temp as $$
declare link record; until timestamptz;
begin
  if p_sign_in_fingerprint is null or p_sign_in_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'Only a fingerprint of the sign-in is stored (rule 9.3).';
  end if;
  select id, parent_id into link from web_sign_in_links
   where link_fingerprint = p_link_fingerprint and used_at is null and expires_at > now()
   for update;
  if not found then raise exception 'This link has expired.'; end if;
  update web_sign_in_links set used_at = now() where id = link.id;
  delete from web_sign_ins where parent_id = link.parent_id and (ended_at is not null or expires_at <= now());
  until := now() + make_interval(days => setting_number(p_version, 'sign_in_days')::int);
  insert into web_sign_ins (parent_id, sign_in_fingerprint, expires_at) values (link.parent_id, p_sign_in_fingerprint, until);
  return until;
end $$;

-- Who a signed-in browser belongs to, for our server to sign that parent's pass.
create function public.sign_in_parent(p_sign_in_fingerprint text)
returns bigint language plpgsql stable security definer set search_path = public, pg_temp as $$
declare who bigint;
begin
  select parent_id into who from web_sign_ins
   where sign_in_fingerprint = p_sign_in_fingerprint and ended_at is null and expires_at > now();
  if who is null then raise exception 'Not signed in.'; end if;
  return who;
end $$;

-- Sign out: ends that sign-in straight away. Signing out twice is fine.
create function public.end_sign_in(p_sign_in_fingerprint text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update web_sign_ins set ended_at = now() where sign_in_fingerprint = p_sign_in_fingerprint and ended_at is null;
end $$;

-- ---- 5. The three reads (run as the parent's pass: Row Level Security applies) --

-- Read 1, one week (Week so far and an older week's own page). Lists are oldest
-- first; the page puts this week newest first (rule 9.4). Photo paths are for
-- our server only, which swaps them for short-lived links (rule 9.6).
create function public.web_week(p_monday date)
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id(); result jsonb;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if extract(isodow from p_monday) <> 1 then raise exception 'A week starts on a Monday.'; end if;
  select jsonb_build_object(
    'parent_first_name', p.first_name,
    'children', coalesce((select jsonb_agg(c.first_name order by c.created_at, c.id) from children c
                           where c.parent_id = me and not exists (select 1 from children r where r.replaces_id = c.id)), '[]'::jsonb),
    'logs', coalesce((select jsonb_agg(jsonb_build_object(
                'log_id', l.id, 'habit', n.name, 'day', l.for_day, 'line', l.description,
                'photo', (select jsonb_build_object('photo_id', ph.id, 'path', ph.storage_path, 'preview_path', ph.preview_path)
                            from photos ph where ph.log_id = l.id))
              order by l.for_day, l.logged_at, l.id)
              from habit_logs l join nudges n on n.id = l.nudge_id
             where l.parent_id = me and l.undone_at is null and l.for_day between p_monday and p_monday + 6), '[]'::jsonb),
    'reflections', coalesce((select jsonb_agg(jsonb_build_object('reflection_id', r.id, 'day', r.for_day, 'text', r.text)
              order by r.for_day, r.created_at, r.id)
              from reflections r where r.parent_id = me and r.for_day between p_monday and p_monday + 6), '[]'::jsonb),
    'moment', (select case when ml.id is null and mp.id is null then null else jsonb_build_object(
                 'photo', case when mp.id is null then null else jsonb_build_object('photo_id', mp.id, 'path', mp.storage_path, 'preview_path', mp.preview_path) end,
                 'line',  case when ml.id is null then null else jsonb_build_object('moment_line_id', ml.id, 'text', ml.text) end) end
                 from (select 1) one
                 left join moment_lines ml on ml.parent_id = me and ml.week_starting = p_monday
                 left join photos mp on mp.parent_id = me and mp.moment_week = p_monday),
    -- How many weeks before this one since the parent joined: the older-weeks button's first label (rule 9.7).
    'older_weeks', greatest(0, (p_monday - week_monday(p.signed_up_on)) / 7)
  ) into result from parents p where p.id = me;
  if result is null then raise exception 'Not signed in (rule 9.8).'; end if;
  return result;
end $$;

-- Read 2, older weeks, a page at a time: the weeks before p_before (a Monday),
-- newest first, every calendar week since the parent joined (owner, 15 Nov),
-- each with its counts and its tiles (the moment first, then logs and
-- reflections in date order). No names, lines, big photos or reference numbers.
create function public.web_older_weeks(p_before date, p_version bigint)
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare
  me bigint := pass_parent_id();
  per_page int := setting_number(p_version, 'older_weeks_per_page')::int;
  chars int := setting_number(p_version, 'tile_text_chars')::int;
  joined date; total int; take int; remaining int; weeks jsonb := '[]'::jsonb; m date; i int;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if extract(isodow from p_before) <> 1 then raise exception 'A week starts on a Monday.'; end if;
  select week_monday(signed_up_on) into joined from parents where id = me;
  if joined is null then raise exception 'Not signed in (rule 9.8).'; end if;
  total := greatest(0, (p_before - joined) / 7);
  take := least(per_page, total);
  remaining := total - take;
  for i in 1 .. take loop
    m := p_before - 7 * i;
    weeks := weeks || jsonb_build_array(jsonb_build_object(
      'monday', m,
      'days_logged', (select count(distinct for_day) from habit_logs where parent_id = me and undone_at is null and for_day between m and m + 6),
      'habit_logs', (select count(*) from habit_logs where parent_id = me and undone_at is null and for_day between m and m + 6),
      'reflections', (select count(*) from reflections where parent_id = me and for_day between m and m + 6),
      'moment', exists (select 1 from moment_lines where parent_id = me and week_starting = m)
             or exists (select 1 from photos where parent_id = me and moment_week = m),
      'tiles', (
        select coalesce(jsonb_agg(tile order by sort_group, sort_day, sort_time, sort_id), '[]'::jsonb) from (
          -- The moment first: its small preview, or else its line cut short.
          select 0 as sort_group, m as sort_day, null::timestamptz as sort_time, 0::bigint as sort_id,
                 case when mp.preview_path is not null then jsonb_build_object('kind', 'moment', 'preview_path', mp.preview_path)
                      else jsonb_build_object('kind', 'moment', 'text', cut_text(ml.text, chars)) end as tile
            from (select 1) one
            left join moment_lines ml on ml.parent_id = me and ml.week_starting = m
            left join photos mp on mp.parent_id = me and mp.moment_week = m
           where ml.id is not null or mp.id is not null
          union all
          -- A log: its photo's small preview, or else the habit's name (the ✓ habit tile).
          select 1, l.for_day, l.logged_at, l.id,
                 case when ph.preview_path is not null then jsonb_build_object('kind', 'log', 'preview_path', ph.preview_path)
                      else jsonb_build_object('kind', 'log', 'habit', n.name) end
            from habit_logs l join nudges n on n.id = l.nudge_id left join photos ph on ph.log_id = l.id
           where l.parent_id = me and l.undone_at is null and l.for_day between m and m + 6
          union all
          -- A reflection: its first words.
          select 1, r.for_day, r.created_at, r.id, jsonb_build_object('kind', 'reflection', 'text', cut_text(r.text, chars))
            from reflections r where r.parent_id = me and r.for_day between m and m + 6
        ) tiles)
    ));
  end loop;
  return jsonb_build_object(
    'weeks', weeks,
    'weeks_remaining', remaining,
    -- The oldest Monday the next tap would load, for the button's label (rule 9.7).
    'next_oldest_monday', case when remaining > 0 then p_before - 7 * (take + least(per_page, remaining)) else null end);
end $$;

-- Read 3, connection history: the N weeks before p_monday, oldest first, each
-- with its rating or null ("–" on the card), plus p_monday's week once
-- answered. Weeks before the parent joined have no slot (rule 9.5).
create function public.web_connection_history(p_monday date, p_version bigint)
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare
  me bigint := pass_parent_id();
  n int := setting_number(p_version, 'connection_weeks')::int;
  joined date;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if extract(isodow from p_monday) <> 1 then raise exception 'A week starts on a Monday.'; end if;
  select week_monday(signed_up_on) into joined from parents where id = me;
  if joined is null then raise exception 'Not signed in (rule 9.8).'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('monday', w.monday, 'rating', a.score) order by w.monday)
      from (select (p_monday - 7 * k) as monday from generate_series(1, n) k) w
      left join connection_answers a on a.parent_id = me and a.week_starting = w.monday
     where w.monday >= joined), '[]'::jsonb)
    || coalesce((select jsonb_build_array(jsonb_build_object('monday', p_monday, 'rating', score))
                   from connection_answers where parent_id = me and week_starting = p_monday), '[]'::jsonb);
end $$;

-- ---- 6. The narrow deletes (rule 8.4, edits 6 and 11 to 13) -------------------
-- They run as web_page_writer, a role that can't sign in and has exactly these
-- rights; Row Level Security still checks the parent's pass on every row.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'web_page_writer') then
    create role web_page_writer nologin;
  end if;
end $$;
comment on role web_page_writer is 'Runs the Web app''s four narrow deletes (rule 8.4 edits 6, 11 to 13). Cannot sign in; still behind Row Level Security.';

-- Edit 11: wipe one log's line. The log stays and still counts (rule 9.6).
create function public.web_wipe_log_line(p_log bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  update habit_logs set description = null
   where id = p_log and parent_id = me and undone_at is null and description is not null;
  if not found then raise exception 'That line was not found.'; end if;
  perform write_event(me, 'log_line_deleted', p_version, p_variants);
end $$;

-- Edit 12: remove one reflection (the row goes, never blanked).
create function public.web_remove_reflection(p_reflection bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  delete from reflections where id = p_reflection and parent_id = me;
  if not found then raise exception 'That reflection was not found.'; end if;
  perform write_event(me, 'reflection_deleted', p_version, p_variants);
end $$;

-- Edit 13: remove one moment's line (its photo, if any, stays: one layer per tap).
create function public.web_remove_moment_line(p_moment_line bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  delete from moment_lines where id = p_moment_line and parent_id = me;
  if not found then raise exception 'That moment line was not found.'; end if;
  perform write_event(me, 'moment_line_deleted', p_version, p_variants);
end $$;

-- Edit 6 for the Web app: delete one photo's record (a log's or a moment's),
-- which holds both the photo and its small preview. Our server removes both
-- files from storage first (rule 8.5 order; paths from read 1).
create function public.web_delete_photo(p_photo bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  delete from photos where id = p_photo and parent_id = me;
  if not found then raise exception 'That photo was not found.'; end if;
  perform write_event(me, 'photo_deleted', p_version, p_variants);
end $$;

-- Hand the four functions to web_page_writer (it needs CREATE on the schema
-- only for this moment, so that right is taken back straight after).
grant web_page_writer to current_user;
grant usage, create on schema public to web_page_writer;
alter function public.web_wipe_log_line(bigint, bigint, jsonb) owner to web_page_writer;
alter function public.web_remove_reflection(bigint, bigint, jsonb) owner to web_page_writer;
alter function public.web_remove_moment_line(bigint, bigint, jsonb) owner to web_page_writer;
alter function public.web_delete_photo(bigint, bigint, jsonb) owner to web_page_writer;
revoke create on schema public from web_page_writer;

-- ---- 7. Locks: Row Level Security policies -----------------------------------
alter table public.web_sign_in_links enable row level security;
alter table public.web_sign_ins enable row level security;

-- A parent's pass reads only that parent's rows (rule 9.8).
create policy web_own_parent on public.parents for select to authenticated using (id = public.pass_parent_id());
create policy web_own_children on public.children for select to authenticated using (parent_id = public.pass_parent_id());
create policy web_own_logs on public.habit_logs for select to authenticated using (parent_id = public.pass_parent_id());
create policy web_own_photos on public.photos for select to authenticated using (parent_id = public.pass_parent_id());
create policy web_own_reflections on public.reflections for select to authenticated using (parent_id = public.pass_parent_id());
create policy web_own_moment_lines on public.moment_lines for select to authenticated using (parent_id = public.pass_parent_id());
create policy web_own_answers on public.connection_answers for select to authenticated using (parent_id = public.pass_parent_id());
-- The habit names are shared content, not personal: every pass may read them.
create policy web_habit_names on public.nudges for select to authenticated using (true);

-- The delete role sees and changes only the pass's parent's rows, and a line
-- can only be blanked, never rewritten.
create policy web_writer_logs_read on public.habit_logs for select to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_logs_wipe on public.habit_logs for update to web_page_writer
  using (parent_id = public.pass_parent_id()) with check (parent_id = public.pass_parent_id() and description is null);
create policy web_writer_photos_read on public.photos for select to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_photos_delete on public.photos for delete to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_reflections_read on public.reflections for select to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_reflections_delete on public.reflections for delete to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_moments_read on public.moment_lines for select to web_page_writer using (parent_id = public.pass_parent_id());
create policy web_writer_moments_delete on public.moment_lines for delete to web_page_writer using (parent_id = public.pass_parent_id());

-- ---- 8. Permissions ------------------------------------------------------------
-- New tables and functions start locked (Supabase grants broad access by default).
revoke all on public.web_sign_in_links, public.web_sign_ins from public, anon, authenticated, service_role;
revoke all on function public.pass_parent_id(), public.week_monday(date), public.cut_text(text, integer),
  public.create_sign_in_link(bigint, text, bigint), public.redeem_sign_in_link(text, text, bigint),
  public.sign_in_parent(text), public.end_sign_in(text),
  public.web_week(date), public.web_older_weeks(date, bigint), public.web_connection_history(date, bigint),
  public.web_wipe_log_line(bigint, bigint, jsonb), public.web_remove_reflection(bigint, bigint, jsonb),
  public.web_remove_moment_line(bigint, bigint, jsonb), public.web_delete_photo(bigint, bigint, jsonb)
  from public, anon, authenticated, service_role;
revoke all on all sequences in schema public from public, anon, authenticated;

-- Our server (the bot) makes sign-in links; nothing else here.
grant execute on function public.create_sign_in_link(bigint, text, bigint) to service_role;
-- A signed-out browser (the public key) can only use a link, check its own
-- sign-in and sign out, each by fingerprint.
grant execute on function public.redeem_sign_in_link(text, text, bigint), public.sign_in_parent(text), public.end_sign_in(text) to anon;
-- A parent's pass: only the columns the pages need (never Telegram IDs, birth
-- years, check results, how a log was made, nudge ideas or times, events).
grant select (id, first_name, signed_up_on) on public.parents to authenticated;
grant select (id, parent_id, first_name, replaces_id, created_at) on public.children to authenticated;
grant select (id, name) on public.nudges to authenticated;
grant select (id, parent_id, nudge_id, for_day, logged_at, description, undone_at) on public.habit_logs to authenticated;
grant select (id, parent_id, log_id, moment_week, storage_path, preview_path) on public.photos to authenticated;
grant select (id, parent_id, for_day, text, created_at) on public.reflections to authenticated;
grant select (id, parent_id, week_starting, text) on public.moment_lines to authenticated;
grant select (parent_id, week_starting, score) on public.connection_answers to authenticated;
grant execute on function public.pass_parent_id(), public.week_monday(date), public.cut_text(text, integer),
  public.setting_number(bigint, text),
  public.web_week(date), public.web_older_weeks(date, bigint), public.web_connection_history(date, bigint),
  public.web_wipe_log_line(bigint, bigint, jsonb), public.web_remove_reflection(bigint, bigint, jsonb),
  public.web_remove_moment_line(bigint, bigint, jsonb), public.web_delete_photo(bigint, bigint, jsonb)
  to authenticated;
-- The delete role: exactly what the four deletes need.
grant execute on function public.pass_parent_id(), public.write_event(bigint, text, bigint, jsonb, bigint) to web_page_writer;
grant select (id, parent_id, description, undone_at) on public.habit_logs to web_page_writer;
grant update (description) on public.habit_logs to web_page_writer;
grant select (id, parent_id) on public.photos, public.reflections, public.moment_lines to web_page_writer;
grant delete on public.photos, public.reflections, public.moment_lines to web_page_writer;

commit;
