-- =============================================================================
-- Migration 014: the Sunday Wrap Up, the 1 to 5 question's expiry, and "Add a moment"
--
-- What it does, in plain English: [2026-11-24] the owner approved this
-- database change on 24 Nov (rule 8.4, new narrow edit 16; tests T124 to T126):
--   1. "Add a moment from this week" (rule 7.7): parents.moment_asked_at
--      notes when the parent tapped the button, so the bot knows its 24-hour
--      window. ask_for_moment is the only way to set it: only after a Wrap Up,
--      and it answers that Wrap Up's week (a moment belongs to it).
--   2. (One Wrap Up a week per parent is already locked by migration 003.)
--   3. The question's expiry (rule 5.6): claim_expired_questions finds every
--      connection question sent more than 24 hours ago, not answered and not
--      yet closed, writes its "expired" event (that event is the mark that it
--      was closed, so each is claimed once) and gives the bot what it needs
--      to edit the message: the Telegram chat and message numbers.
-- Run once in Supabase's SQL Editor after 013.
-- Tests: src/datastore/supabase/tests/web-app-access.test.sql (T124 to T126).
-- =============================================================================

-- ---- 1. "Add a moment from this week" --------------------------------------------
alter table public.parents add column moment_asked_at timestamptz;
comment on column public.parents.moment_asked_at is
  'When the parent last tapped "Add a moment from this week" (rule 7.7): the start of the 24-hour window. Empty if never.';

-- The tap. Gives the Monday of the parent's latest Wrap Up week, or refuses if
-- there has been no Wrap Up yet (a moment belongs to a Wrap Up's week).
create function public.ask_for_moment(p_parent bigint)
returns date language plpgsql security definer set search_path = public, pg_temp as $$
declare latest date := (select max(date_trunc('week', for_day::timestamp))::date
                        from messages_sent where parent_id = p_parent and kind = 'wrap_up');
begin
  if latest is null then raise exception 'No Wrap Up has been sent to this parent yet.'; end if;
  update parents set moment_asked_at = now() where id = p_parent;
  return latest;
end $$;

-- ---- 3. The question's expiry --------------------------------------------------------
create function public.claim_expired_questions(p_version bigint, p_variants jsonb)
returns table (parent_id bigint, telegram_id bigint, telegram_message_id bigint, week date)
language plpgsql security definer set search_path = public, pg_temp as $$
declare window_hours numeric := setting_number(p_version, 'connection_answer_window_hours'); q record;
begin
  for q in
    select m.parent_id, p.telegram_id, m.telegram_message_id, date_trunc('week', m.for_day::timestamp)::date as week, m.sent_at
      from messages_sent m join parents p on p.id = m.parent_id
     where m.kind = 'connection_question'
       and m.sent_at < now() - make_interval(secs => window_hours * 3600)
       and m.sent_at > now() - interval '8 days'
       and not exists (select 1 from connection_answers a
                        where a.parent_id = m.parent_id and a.week_starting = date_trunc('week', m.for_day::timestamp)::date)
       and not exists (select 1 from events e join event_types t on t.id = e.event_type_id
                        where e.parent_id = m.parent_id and t.name = 'connection_question_expired' and e.occurred_at > m.sent_at)
  loop
    perform write_event(q.parent_id, 'connection_question_expired', p_version, p_variants);
    parent_id := q.parent_id; telegram_id := q.telegram_id; telegram_message_id := q.telegram_message_id; week := q.week;
    return next;
  end loop;
end $$;

-- New functions start locked; only our server (the bot) may use them.
revoke all on function public.ask_for_moment(bigint), public.claim_expired_questions(bigint, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.ask_for_moment(bigint), public.claim_expired_questions(bigint, jsonb) to service_role;
