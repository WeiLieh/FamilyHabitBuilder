-- =============================================================================
-- src/datastore/supabase/migrations/006_sign_up.sql: sign-up with an invite, in one step
--
-- What it does: [2026-11-11 SGT] adds the function sign_up for thin slice 1
-- (src/telegram-bot/SPEC.md, "Build: thin slice 1"). When a parent opens the
-- bot with an invite code (rule 1.1, invite-only), it creates the parent, marks
-- the invite as used and writes the signed_up event, all together.
--
-- Why it is built this way:
--   * All or nothing: if any part fails (an unknown or used code, a Telegram
--     account that already signed up), nothing is saved. Without this, a
--     failure halfway could leave a parent with no invite, or an invite used by
--     nobody. Like a ticket barrier: the gate opens and the ticket is stamped
--     in one movement, or neither happens.
--   * The cohort and Wrap Up time come from the app (src/settings.ts), never
--     from defaults here (rules 1.4, 8.8).
--   * Same lock-down as migrations 003 and 005: only our server can run it.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once, AFTER
-- migration 005. After it has run on the real project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T54 to T56).
-- =============================================================================

begin;

create function public.sign_up(p_telegram_id bigint, p_first_name text, p_code text, p_cohort text, p_wrap_up_minute integer,
                               p_update bigint, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare p bigint;
begin
  -- One parent per Telegram account (rule 8.6).
  if exists (select 1 from parents where telegram_id = p_telegram_id) then
    raise exception 'This Telegram account has already signed up.';
  end if;
  -- The invite must exist and be unused. "for update" holds the row, so two
  -- sign-ups at the same moment can't both use one code.
  perform 1 from invites where code = p_code and used_at is null for update;
  if not found then raise exception 'This invite code is unknown or already used.'; end if;
  insert into parents (telegram_id, first_name, cohort, wrap_up_minute)
  values (p_telegram_id, p_first_name, p_cohort, p_wrap_up_minute) returning id into p;
  update invites set used_by = p, used_at = now() where code = p_code;
  perform write_event(p, 'signed_up', p_version, p_variants, p_update);
  return p;
end $$;
comment on function public.sign_up(bigint, text, text, text, integer, bigint, bigint, jsonb) is
  'Sign up with an invite: create the parent, use the code and write the signed_up event, all or nothing (rules 1.1, 8.6).';

revoke all on function public.sign_up(bigint, text, text, text, integer, bigint, bigint, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.sign_up(bigint, text, text, text, integer, bigint, bigint, jsonb) to service_role;

commit;
