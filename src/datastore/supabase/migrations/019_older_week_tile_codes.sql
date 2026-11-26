-- =============================================================================
-- src/datastore/supabase/migrations/019_older_week_tile_codes.sql: each older-week habit tile names its habit's code
--
-- What it does: [2026-11-26 SGT] the owner's look of 25 Nov (docs/CONTEXT.md,
-- UI decision L22, owner "all as recommended", 26 Nov) gives a log without a
-- photo, in the older weeks list (rule 9.7), its own habit's colour and icon.
-- The owner's design says the colour belongs to the habit, not its wording
-- (the names may still change), so read 2 (web_older_weeks) now also sends
-- the habit's short code from the Nudge repository ("SAF", "TWC" and so on)
-- next to its name. Nothing else changes.
--
-- Why it is built this way:
--   * The function is replaced with the same text plus one field, so it keeps
--     its owner and its rights. It runs as the parent's pass (security
--     invoker), so the pass may now also read the nudges' "code" column: a
--     fixed label of the habit, never anything about a family.
--   * Earlier migrations have already run on the real project, so none is
--     edited (rule B1). Everything is one transaction: all or nothing.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once, AFTER
-- migration 018. The page works either side of it: a tile without a code is
-- drawn plain, with its habit's name. After it has run, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/web-app-access.test.sql (T151).
-- =============================================================================

begin;

-- ---- 1. A parent's pass may read each habit's code (not personal) ------------
grant select (code) on public.nudges to authenticated;

-- ---- 2. Read 2, older weeks, with the habit's code on a log tile ------------
-- Read 2, older weeks, a page at a time: the weeks before p_before (a Monday),
-- newest first, every calendar week since the parent joined (owner, 15 Nov),
-- each with its counts and its tiles (the moment first, then logs and
-- reflections in date order). No children's or parents' names, lines, big
-- photos or reference numbers; a log tile carries its habit's name and code
-- (the app's own content, not a family's; privacy review, 26 Nov).
create or replace function public.web_older_weeks(p_before date)
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare
  me bigint := pass_parent_id();
  per_page int := setting_number(current_settings_version(), 'older_weeks_per_page')::int;
  chars int := setting_number(current_settings_version(), 'tile_text_chars')::int;
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
          -- A log: its photo's small preview, or else the habit's name and code (its habit tile).
          select 1, l.for_day, l.logged_at, l.id,
                 case when ph.preview_path is not null then jsonb_build_object('kind', 'log', 'preview_path', ph.preview_path)
                      -- [2026-11-26] Also the habit's short code (e.g. "SAF"), so the
                      -- page can give the tile its habit's colour and icon (L22).
                      else jsonb_build_object('kind', 'log', 'habit', n.name, 'code', n.code) end
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

commit;
