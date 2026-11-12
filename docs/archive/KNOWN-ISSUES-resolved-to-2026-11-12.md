# Known issues resolved up to 12 Nov 2026

[2026-11-12 23:24 SGT] Moved word for word from [docs/KNOWN-ISSUES.md](../KNOWN-ISSUES.md), section "Resolved" (owner approved: "shorten all the long md files"). Nothing was reworded.

## Resolved

### [2026-11-12 20:59 SGT] Two taps at the same instant can both be saved
- [2026-11-12 22:17 SGT] RESOLVED in migration 007 (once applied): the database refuses a second log for the same bot message and a second Not today on the same Singapore day (T74, T75). Note: in the rare race, the second tap now gets the bot's "didn't save" message instead of "Already saved."; the onboarding pull request maps that refusal to "Already saved.".
- **Issue:** [2026-11-12 20:59 SGT] The bot checks "already answered?" before saving, but two taps arriving at exactly the same moment can both pass the check. The database has no rule against a second log for the same nudge message (`habit_logs.from_message_id` is not unique), and a "not today" event is not linked to its nudge (privacy review of rule 5.10, findings P1 and P2; owner agreed to log it, 12 Nov).
- **Impact:** [2026-11-12 20:59 SGT] Low now (one tester). Two logs for one nudge, two "not today" events, or both for one nudge; streaks and metrics could count wrongly.
- **Workaround:** [2026-11-12 20:59 SGT] Fix in migration 007, test-first: one log per nudge message, and "not today" linked to its nudge and saved once. The bot's own check (rule 5.10, "Already answered.") already stops taps that arrive one after the other.
### [2026-11-12 20:59 SGT] The agreement can wrongly say "didn't save"
- [2026-11-12 21:06 SGT] RESOLVED: once "I agree" is saved, a Telegram failure is logged and "You're all set" is still sent; never "didn't save" (test in tests/telegram-bot-sign-up.test.ts). Also fixed in the same change: the sign-up gap (silence when the "already signed up?" or "who is this?" check fails).
- **Issue:** [2026-11-12 20:59 SGT] If Telegram fails after the "I agree" tap is saved, the parent is told "Sorry, that didn't save" (`src/telegram-bot/handle-update.ts`, the agree path), which is untrue (rule 1.3) (privacy review of rule 5.10, finding P4; owner agreed to log it, 12 Nov).
- **Impact:** [2026-11-12 20:59 SGT] Low: the parent taps again; the agreement is recorded twice (the latest answer counts, rule 11.13).
- **Workaround:** [2026-11-12 20:59 SGT] Fix it in the sign-up gap pull request (next), test-first, the same way as rule 5.10.
### [2026-11-09 17:50 SGT] No spec requires checking Telegram's webhook secret
- [2026-11-11 18:14 SGT] **RESOLVED:** rule 5.9 written and built in thin slice 1; tests/telegram-bot-webhook.test.ts checks a missing or wrong secret is refused and nothing is saved or sent.
- **Issue:** [2026-11-09 17:50 SGT] No spec says the bot checks Telegram's secret header on each incoming request (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (the bot is not built). A forged request could create or undo logs for any parent.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): a **must-have for the Telegram bot build**: requests without the right secret are refused, with a test. Add it as a Telegram bot rule at build time.

### [2026-11-08 22:34 SGT] "Delete a photo" needs a fifth narrow edit to the add-only rule
- [2026-11-11 17:28 SGT] **RESOLVED:** migration 005 adds edit 6 (`delete_photo`, rule 8.4), with database test T50; photos now live in their own table, so no link is left in the log. Removing the file from storage is built with the photo store (rule 8.5 order).
- [2026-11-09 17:44 SGT] Owner (9 Nov): workaround agreed. The goal: when a parent deletes a photo, **no copy of it is kept anywhere** (not in the photo store and not as a link in the log).
- [2026-11-09 00:14 SGT] Update: Undo (rule 5.8) became edit 5 of rule 8.4 on 8 Nov, so "delete a photo" would be **edit 6**.
- **Issue:** [2026-11-08 22:34 SGT] Rule 9.1 now promises "delete a photo", but rule 8.4 allows only four narrow edits and logs are add-only (privacy review of the Telegram onboarding design, 3 Nov; owner agreed to log it on 8 Nov).
- **Impact:** [2026-11-08 22:34 SGT] None yet (no photos are stored). Without it, the promise in the photo consent can't be kept.
- **Workaround:** [2026-11-08 22:34 SGT] When building the photo store: a new migration with a fifth narrow edit (remove one photo link from one parent's log), plus removing the file from storage, test-first, with an approved change to rule 8.4.

### [2026-11-09 17:50 SGT] An undone log's "how did it feel" line and photo are not cleaned up
- [2026-11-11 17:28 SGT] **RESOLVED:** migration 005's `undo_log` blanks the line and deletes the photo row in the same step (rule 8.4 edit 7, rule 5.8); database test T49. The app removes the photo file first (rule 8.5).
- **Issue:** [2026-11-09 17:50 SGT] The "Add how you felt" line is free text that may hold a child's name or health details, and it goes to Claude (rule 5.3). The spec does not say what happens to the line or photo when a log is undone (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (Undo is not built). Personal details could be kept for a log the parent cancelled.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): when a log is undone, **delete its line and any photo**. Write it into rules 5.8 and 8.4 (approved change, test-first) when building Undo.

### [2026-11-09 17:50 SGT] Undo's 30-second limit must be enforced by the database
- [2026-11-11 17:28 SGT] **RESOLVED:** migration 005's `undo_log` refuses an Undo after the window (read from the settings version) or on a non-keyboard log; database test T49 (and T53).
- **Issue:** [2026-11-09 17:50 SGT] Rule 8.4 edit 5 (Undo, rule 5.8) says it is enforced by the database, but nothing says the database itself checks the 30-second window and "keyboard logs only" (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (Undo is not built). If only the app code checked them, a bug could quietly undo any old log and change streaks and metrics.
- **Workaround:** [2026-11-09 17:50 SGT] When building Undo: the database function itself refuses an undo after 30 seconds or on a non-keyboard log, with database tests for both.

### [2026-10-24 18:26 SGT] Trial length not decided
- [2026-10-31 18:00 SGT] RESOLVED: 5 full weeks per family from its first full Monday, 5 to 10 families (D9, Telemetry rule 10.3). Moved to Resolved.
- **Issue:** [2026-10-24 18:26 SGT] Metrics 6 and 7 (target-hit rate, unprompted log rate) use "the final 4 weeks" and "the final 2 weeks", so they need a trial length of at least 4 weeks.
- **Impact:** [2026-10-24 18:26 SGT] Success tests Y and Z cannot be calculated without it.
- **Workaround:** [2026-10-24 18:26 SGT] None yet. Product manager to decide (see the Settings sheet of the metrics file).
- [2026-10-24 18:34 SGT] Kept as WIP, added to `docs/PRODUCT-BACKLOG.md`.

### [2026-10-25 07:17 SGT] The nudges SQL has not run on the real Supabase yet
- [2026-10-25 08:14 SGT] RESOLVED: `001` and `002` have run on Supabase; tables, columns and permissions confirmed by the owner's screenshots. (Moved to Resolved.)
- [2026-10-25 08:11 SGT] `001` has now run on Supabase (tables and columns confirmed by screenshot). The live permission check found extra `service_role` permissions; fixed by `002` (see `docs/ERROR-LOG.md`), waiting for the owner to run it.
- [2026-10-25 07:51 SGT] The file is now `supabase/migrations/001_create_nudge_repository.sql` (two tables, guard, view); 25 database checks pass locally. Still not run on Supabase.
- **Issue:** [2026-10-25 07:17 SGT] `001_create_nudges.sql` passed 13 tests on a local PostgreSQL 16, but Supabase may differ slightly (version, built-in roles, Data API grant rules).
- **Impact:** [2026-10-25 07:17 SGT] The first run in Supabase could show an error.
- **Workaround:** [2026-10-25 07:17 SGT] When the owner creates the Supabase project (step 3), run the file in the SQL Editor and report any error; Claude fixes it and logs it here.

### [2026-10-24 17:39 SGT] How long photos of children are kept
- [2026-10-24 18:26 SGT] **Resolved:** photos are kept until the parent deletes their data, with consent at sign-up (spec version 1.1). The remaining privacy risk is tracked above under "Photos kept with no time limit".
- **Issue:** [2026-10-24 17:39 SGT] The spec stores photos (which may show children) but does not say how long they are kept or how they are deleted.
- **Impact:** [2026-10-24 17:39 SGT] Must be decided before real families use the app. Personal data of children is sensitive (for example under Singapore's Personal Data Protection Act (PDPA)).
- **Workaround:** [2026-10-24 17:39 SGT] None yet. Do not onboard real families until decided.

