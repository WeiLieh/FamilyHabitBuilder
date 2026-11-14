-- =============================================================================
-- src/datastore/supabase/migrations/010_telegram_message_numbers.sql: remembering Telegram's message numbers
--
-- What it does: [2026-11-14 SGT] the database side of B1, "log any time"
-- (src/telegram-bot/SPEC.md, "Build: B1", decisions B1-D7 and B1-D10):
--   1. Each nudge keeps the number Telegram gave its message
--      (messages_sent.telegram_message_id). When a keyboard or /log tap answers
--      a nudge that is still waiting, the bot can then take that nudge's
--      buttons away (rule 5.10). The number is saved in the same step that
--      records the nudge (the bot sends first, records after), and never
--      changes: our server can't edit sent messages.
--   2. A sign-up draft keeps the number of its latest screen
--      (sign_up_drafts.screen_message_id), so "Welcome back" and Continue can
--      take the earlier copy's buttons away (10e addition). It is replaced
--      when a newer screen is sent, cleared when the step changes, and cleared
--      when the clean-up cuts a quiet draft down (rule 8.13: a cut-down draft
--      keeps only its Telegram ID and last step). It sits under the existing
--      draft edit (rule 8.4, edit 8), owner's choice, 14 Nov (B1-D10).
--
-- Why it is built this way: like writing a parcel's tracking number on the
-- delivery note when it is posted, so it can be found later. Telegram's
-- number is not personal data (it only counts the messages in one chat).
-- The 10-minute Undo window (B1-D1) needs no change here: undo_log already
-- reads the window from the settings version (migration 005, rule 1.4).
--
-- How to apply: Supabase > SQL Editor > a fresh tab > paste this file > Run,
-- once, AFTER migration 009, before B1 goes live. After it has run on the real
-- project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T91 to T98).
-- =============================================================================

begin;

-- ---- 1. A nudge's Telegram message number ------------------------------------
alter table public.messages_sent add column telegram_message_id bigint check (telegram_message_id > 0);
comment on column public.messages_sent.telegram_message_id is
  'The number Telegram gave this message in the parent''s chat, so its buttons can be removed later (rule 5.10). Empty for messages recorded before migration 010. Never changed.';

-- The same function as migration 007, with Telegram's number as a last, optional
-- part. A function's parts can't be changed in place, so the old one is replaced.
drop function public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb);
create function public.record_message_sent(p_parent bigint, p_kind text, p_nudge bigint, p_example bigint, p_day date, p_slot integer,
                                           p_version bigint, p_variants jsonb, p_telegram_message bigint default null)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare m bigint;
begin
  insert into messages_sent (parent_id, kind, nudge_id, example_id, for_day, slot_minute, telegram_message_id)
  values (p_parent, p_kind, p_nudge, p_example, p_day, p_slot, p_telegram_message) returning id into m;
  perform write_event(p_parent, case p_kind when 'nudge' then 'nudge_sent' when 'wrap_up' then 'wrap_up_sent'
                                            when 'start_now' then 'start_now_shown' else 'connection_question_sent' end,
                      p_version, p_variants);
  return m;
end $$;
comment on function public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb, bigint) is
  'Record a message the bot started, with its event and, from migration 010, Telegram''s message number (rule 5.10).';

-- ---- 2. The sign-up draft's latest screen -------------------------------------
alter table public.sign_up_drafts add column screen_message_id bigint check (screen_message_id > 0);
-- A cut-down draft keeps only its Telegram ID and last step (rule 8.13).
alter table public.sign_up_drafts add constraint sign_up_drafts_cut_down_no_screen check (cut_down_at is null or screen_message_id is null);
comment on column public.sign_up_drafts.screen_message_id is
  'Telegram''s number for the latest sign-up screen with buttons, so "Welcome back" can remove the earlier copy''s buttons (10e addition, B1-D10). Cleared when the step changes or the draft is cut down.';

-- Remember the latest screen's number, for an active draft only.
create function public.record_sign_up_screen(p_telegram_id bigint, p_message_id bigint)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update sign_up_drafts set screen_message_id = p_message_id where telegram_id = p_telegram_id and cut_down_at is null;
  if not found then raise exception 'No sign-up in progress for this Telegram account.'; end if;
end $$;
comment on function public.record_sign_up_screen(bigint, bigint) is
  'Note Telegram''s number for the latest sign-up screen of an active draft (rule 8.4 edit 8, B1-D10).';

-- Same as migration 007, plus: a new step means a new screen, so the old number is cleared.
create or replace function public.save_sign_up_step(p_telegram_id bigint, p_step text, p_answers jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Only the four expected parts, and a size cap: before consent, the draft
  -- holds no more than sign-up needs (review finding, 12 Nov).
  if exists (select 1 from jsonb_object_keys(p_answers) k where k not in ('first_name', 'children', 'picks', 'slots')) then
    raise exception 'A sign-up draft holds only first_name, children, picks and slots.';
  end if;
  if octet_length(p_answers::text) > 4000 then
    raise exception 'These sign-up answers are too big (more than 4,000 bytes).';
  end if;
  update sign_up_drafts
  set screen_message_id = case when step = p_step then screen_message_id end,
      step = p_step, answers = p_answers, last_activity_at = now()
  where telegram_id = p_telegram_id and cut_down_at is null;
  if not found then raise exception 'No sign-up in progress for this Telegram account.'; end if;
end $$;

-- Same as migration 007, plus: cutting a draft down also clears its screen number.
create or replace function public.clean_up_sign_ups(p_version bigint)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare keep_days numeric := setting_number(p_version, 'sign_up_draft_keep_days');
        record_days numeric := setting_number(p_version, 'sign_up_stopped_keep_days');
begin
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

-- ---- 3. Permissions: locked, then only what our server needs (rules 8.2, 8.4) --
revoke all on function public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb, bigint),
  public.record_sign_up_screen(bigint, bigint)
  from public, anon, authenticated, service_role;
grant execute on function public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb, bigint),
  public.record_sign_up_screen(bigint, bigint)
  to service_role;

commit;
