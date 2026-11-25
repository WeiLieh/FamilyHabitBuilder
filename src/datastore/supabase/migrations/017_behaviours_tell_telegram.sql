-- =============================================================================
-- src/datastore/supabase/migrations/017_behaviours_tell_telegram.sql: a Behaviours save hands back the Telegram chat
--
-- What it does: [2026-11-25 SGT] the owner found on 25 Nov that after changing
-- behaviours in Settings, Telegram still showed the old habit buttons: the
-- button row only changes when the bot sends a new one. The owner approved
-- the fix: after a Behaviours save, the bot sends "✅ Your habits are
-- updated." with the new buttons (rule 9.9). For that our server needs the
-- parent's Telegram chat, so web_set_behaviours now returns it, exactly as
-- web_set_pause does (migration 016). Nothing else changes: same checks, same
-- picks, same events.
--
-- Why it is built this way:
--   * Migration 016 has already run on the real project, so it is never
--     edited (rule B1); this new file replaces the one function.
--   * PostgreSQL can't change what a function returns in place, so it is
--     dropped and made again, then handed back to web_page_writer with the
--     same rights as before. All in one transaction: all or nothing.
--   * The number goes to our server only; a page never shows it (rule 9.8).
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once, AFTER
-- migration 016. After it has run on the real project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/web-app-access.test.sql (T146).
-- =============================================================================

begin;

drop function public.web_set_behaviours(jsonb, bigint, jsonb);

-- The chosen behaviours, as a list of {nudge_id, frequency}: up to 2 quick and
-- 1 deliberate, at least 1 (rule 2.1). A pick that is unchanged stays; a pick
-- dropped, or with a new frequency, is stopped; a new one is started.
-- Returns the parent's Telegram chat, for the bot's new habit buttons.
create function public.web_set_behaviours(p_picks jsonb, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare me bigint := pass_parent_id();
        quick int; deliberate int; total int; k record; chat bigint;
begin
  if me is null then raise exception 'Not signed in (rule 9.8).'; end if;
  if p_picks is null or jsonb_typeof(p_picks) <> 'array' then raise exception 'Behaviours must be a list.'; end if;
  total := jsonb_array_length(p_picks);
  select count(distinct n.id) filter (where n.category = 'quick'), count(distinct n.id) filter (where n.category = 'deliberate')
    into quick, deliberate
    from jsonb_array_elements(p_picks) x
    join nudges n on n.id = (x ->> 'nudge_id')::bigint and n.active and n.starts_unlocked
   where coalesce(x ->> 'frequency', '') ~ '^[a-z_0-9]+$';
  if quick + deliberate < 1 or quick > 2 or deliberate > 1 or quick + deliberate <> total then
    raise exception 'Choose up to 2 quick and 1 deliberate behaviour, at least 1 (rule 2.1).';
  end if;
  select telegram_id into chat from parents where id = me;
  if not found then raise exception 'Not signed in (rule 9.8).'; end if;
  for k in select id from picks pk
            where pk.parent_id = me and pk.stopped_at is null
              and not exists (select 1 from jsonb_array_elements(p_picks) x
                               where (x ->> 'nudge_id')::bigint = pk.nudge_id and x ->> 'frequency' = pk.frequency) loop
    update picks set stopped_at = now() where id = k.id;
    perform write_event(me, 'pick_stopped', p_version, p_variants);
  end loop;
  for k in select (x ->> 'nudge_id')::bigint as nudge_id, x ->> 'frequency' as frequency from jsonb_array_elements(p_picks) x
            where not exists (select 1 from picks pk where pk.parent_id = me and pk.stopped_at is null
                                 and pk.nudge_id = (x ->> 'nudge_id')::bigint and pk.frequency = x ->> 'frequency') loop
    insert into picks (parent_id, nudge_id, frequency) values (me, k.nudge_id, k.frequency);
    perform write_event(me, 'pick_chosen', p_version, p_variants);
  end loop;
  return chat;
end $$;

-- Back to web_page_writer, as in migration 016.
grant web_page_writer to current_user;
grant usage, create on schema public to web_page_writer;
alter function public.web_set_behaviours(jsonb, bigint, jsonb) owner to web_page_writer;
revoke create on schema public from web_page_writer;
revoke web_page_writer from current_user;

revoke all on function public.web_set_behaviours(jsonb, bigint, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.web_set_behaviours(jsonb, bigint, jsonb) to authenticated;

commit;
