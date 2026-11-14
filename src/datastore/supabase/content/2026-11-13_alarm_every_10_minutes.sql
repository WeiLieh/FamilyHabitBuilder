-- =============================================================================
-- src/datastore/supabase/content/2026-11-13_alarm_every_10_minutes.sql: the bot's alarm clock
--
-- What it does: [2026-11-13] tells Supabase Cron (Supabase's built-in alarm
-- clock) to call the bot's web address every 10 minutes (owner's D5, pull
-- request 3c). Each call runs the sign-up clean-up, the one 24-hour sign-up
-- reminder and the planner's nudges (src/telegram-bot/scheduler.ts). It
-- replaces Vercel's once-a-day 7:00 pm alarm, which was removed from vercel.json.
--
-- Why a GET with "Authorization: Bearer <CRON_SECRET>": the bot refuses any
-- caller without our cron secret (rule 1.3; tests S1). The secret is the same
-- CRON_SECRET already in Vercel's settings.
--
-- How to run (owner, once, AFTER pull request 3c is live on Vercel):
--   1. Supabase > Database > Extensions: switch on pg_cron and pg_net (if not on).
--   2. SQL Editor > a fresh tab > paste this file.
--   3. Replace <YOUR-CRON-SECRET> with the CRON_SECRET from Vercel's settings
--      (Vercel > project > Settings > Environment Variables). Type it here only:
--      never save this file with the real secret, and never paste it in a chat.
--   4. Run. Then check: select jobname, schedule, active from cron.job;
--      should show fhb-alarm, */10 * * * *, true.
--   5. Ten minutes later: select status_code from net._http_response order by created desc limit 3;
--      should show 200 (or 500 if a run had a failure: Vercel > Logs says why).
-- To stop it: select cron.unschedule('fhb-alarm');
--
-- Known: the secret is stored in plain text in Supabase's cron table, readable
-- by anyone with database access (only the owner), as in Experiment 1.
-- =============================================================================

select cron.schedule(
  'fhb-alarm',          -- the job's name
  '*/10 * * * *',       -- every 10 minutes
  $$
  select net.http_get(
    url := 'https://family-habit-builder.vercel.app/api/telegram-bot',
    headers := jsonb_build_object('Authorization', 'Bearer <YOUR-CRON-SECRET>')
  );
  $$
);
