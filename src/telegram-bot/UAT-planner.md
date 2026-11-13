# UAT: the planner live (pull request 3c)

[2026-11-13 23:26 SGT] What it is: the owner's go-live steps and checks for the planner on the **live** bot. UAT means user acceptance testing: you try it yourself, as a parent would, and tick each case. Scope and rules: [src/telegram-bot/SPEC.md](SPEC.md), "Build: pull request 3" and rules 5.11 to 5.13.

**Before you start:** finish the thin-slice checks that need the old 7:00 pm nudge (U12, U13, U15, U16 in [UAT-thin-slice-1.md](UAT-thin-slice-1.md)) and the onboarding checks (U17 to U27 in [UAT-onboarding.md](UAT-onboarding.md)). Pull request 3c removes the 7:00 pm nudge.

**Never paste a secret** (cron secret, bot token, Supabase key) into chat, Git or a document.

## Go-live steps
- [ ] **G1.** Migrations 008 and 009 applied in Supabase (tell Claude Code each check result, so the fingerprints are recorded, rule B1).
- [ ] **G2.** Merge pull request 3c. Vercel deploys `main` by itself; wait until it shows "Ready". (From now on there is **no** 7:00 pm job in Vercel.)
- [ ] **G3.** Supabase > Database > Extensions: **pg_cron** and **pg_net** switched on.
- [ ] **G4.** SQL Editor > a fresh tab > paste `src/datastore/supabase/content/2026-11-13_alarm_every_10_minutes.sql`, replace `<YOUR-CRON-SECRET>` with the `CRON_SECRET` from Vercel's settings (typed in Supabase only), Run.
- [ ] **G5.** Check: `select jobname, schedule, active from cron.job;` shows `fhb-alarm`, `*/10 * * * *`, `true`.

## Test cases
Use the test account you signed up with in U17 to U27 (it has picks, times and a child's name). Your old thin-slice account has no picks or times, so it now gets **no** nudges: that is correct.

| ID | Do this | You should see | Where to check | Pass |
|---|---|---|---|---|
| U29 | About 10 minutes after G4 | Runs every 10 minutes, answered 200 (or 500 if a run had a failure: Vercel > Logs says why) | `select status_code, created from net._http_response order by created desc limit 3;` | [ ] |
| U30 | Wait for one of your test account's reminder times (for example 7:00 pm on a school day) | Within 10 minutes: "With <child>: <a behaviour you picked>", then "Idea: …", with **✅ Done** and **😴 Not today** | Telegram; `select for_day, slot_minute, nudge_id, example_id from messages_sent where kind = 'nudge' order by id desc limit 3;` | [ ] |
| U31 | Tap **✅ Done** | The nudge stays, its buttons go; below it "✅ Saved: <behaviour> today." | Telegram; `habit_logs` has today's row | [ ] |
| U32 | Wait for the next reminder time that day | Only a behaviour still due, or nothing at all (never the one you just logged); at most 3 nudges a day | Telegram | [ ] |
| U33 | Next day, a nudge about the same behaviour | A different idea from yesterday's | Telegram; `example_id` differs | [ ] |
| U34 | (If your test account has 2 or 3 children) watch a few nudges | The names take turns, in the order you typed them | Telegram | [ ] |
| U35 | Tap **😴 Not today** on a nudge | The note below it; no more nudges that day | Telegram | [ ] |
| U36 | With a fresh invite code and another account, start sign-up, stop on the children screen, and wait 24 hours (it comes between 7:00 am and 9:30 pm) | "You're almost there! Tap below to continue where you left off." with **Continue**, once only | Telegram; `select reminded_at from sign_up_drafts;` is filled | [ ] |
| U37 | Tap **Continue** | "Welcome back! Let's carry on." and the children screen again | Telegram | [ ] |
| U38 | The `/start` notice for a new sign-up | "…and may send you one reminder to finish…" | Telegram | [ ] |
| U39 | Finish a sign-up and look at screen 11 | "Your next reminder is …" with a real time from your reminder times (for example "on Friday at 7:00 am"), never a fixed 7:00 pm | Telegram | [ ] |
