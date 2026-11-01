# Datastore: module spec

[2026-10-31 09:59 SGT] The **current rules** of the Datastore module: where everything is kept. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 09:59 SGT] Store the app's data safely: **Supabase** (database and photo storage, Singapore) for permanent records, **Upstash Redis** (Singapore) for short-term chat memory. The Datastore owns **all SQL** (rule S6): table structure, first-load data, one-off content changes and database tests. Other modules own the **rules** for their own tables' content (for example the [Nudge repository](../nudge-repository/SPEC.md) owns the rules for `nudges` and `examples`).

## Files in this folder
- [2026-10-31 09:59 SGT] `supabase/migrations/`: table structure changes, numbered, run once each in order in the Supabase SQL Editor (owner). **Never edit one after it has run** (rule B1, checked by fingerprint below).
- [2026-10-31 09:59 SGT] `supabase/seed/`: first-load data (already imported).
- [2026-10-31 09:59 SGT] `supabase/content/`: one-off content changes to live data, named `YYYY-MM-DD_what.sql` (rule B2).
- [2026-11-01 16:14 SGT] `supabase/migrations/003_create_datastore_tables.sql`: the 14 Datastore tables, their all-or-nothing functions and Telemetry views (rules 8.3 to 8.12). **Not yet applied:** the owner runs it in the Supabase SQL Editor after the pull request is merged; then its fingerprint is added below.
- [2026-11-01 16:14 SGT] `children.ts`: checks a child's birth year before saving (rule 8.10). Tests: tests/datastore-children.test.ts.
- [2026-11-01 16:14 SGT] `consents.ts`: works out which consent answer counts, the latest per topic (rule 11.13). Tests: tests/datastore-consents.test.ts.
- [2026-11-01 16:14 SGT] `supabase/tests/datastore-tables.test.sql`: database tests T1 to T41 for migration 003 (run with `npm run test:db`).
- [2026-10-31 09:59 SGT] `supabase/tests/`: database tests; run with `npm run test:db` against a local PostgreSQL (not part of `npm run check` yet; see docs/KNOWN-ISSUES.md).

## Planned for the Datastore build
- SUPERSEDED [2026-11-01 16:07 SGT] (now rules 8.3 to 8.12 and "Tables" below) [2026-10-31 19:09 SGT] For the [Experiments](../experiments/SPEC.md) module, to show in the table mock-ups: **settings versions** (rules 11.1, 11.8), **experiment definitions** (rule 11.7), **parent assignments** (rules 11.3, 11.6), **stamps on every event** (rule 11.2), **sign-up date and cohort** on each parent (rule 11.11), the parent's **recorded agreement** and, before alpha, an **opt-out of experiments** (rule 11.9); "delete my data" must be able to remove all of a parent's rows (rule 11.12). "Delete my data" (rule 1.5) goes through **one narrow database function** that can remove only one parent's data and write the non-personal deletion log; apart from that, the server may only add rows to these tables. Every new table gets **only the access it needs**, spelled out per table in the mock-ups (for example: the server may add rows but never edit or delete them, except for "delete my data"), following migration 002's lock-down (`docs/KNOWN-ISSUES.md`).
- SUPERSEDED [2026-11-01 16:07 SGT] (now rules 8.3 to 8.12 and "Tables" below) [2026-10-31 17:53 SGT] Two new values per parent for the Weekly Wrap Up (Nudge engine rule 3.12): **wrap-up time** (default 8:00pm) and **wrap-up on or off** (default on). Include them in the table mock-ups. A record of each Wrap Up sent is also needed ("never twice in a week", and Telemetry rule 10.2).

## Tables (design agreed 2026-11-01)
[2026-11-01 16:07 SGT] Agreed with the owner on 1 Nov after three drafts and a schema review (rules 8.3 to 8.12). Every table also has `created_at` and a plain-English comment on each column (rule 8.12). "Server" = our app's server role. "Personal" = deleted with the parent (rule 8.5).

**About each parent** (personal)
- `parents`: id, telegram_id (unique), first_name, signed_up_on, cohort (neutral label, rule 11.11), paused, wrap_up_on, wrap_up_minute (minutes after midnight). No defaults in the database: the app gives them from src/settings.ts (on, 8:00pm; review fix 4, rule 8.8). Server: add; change only paused, wrap_up_on, wrap_up_minute (each change also writes an event).
- `children`: id, parent_id, birth_year, replaces_id (a correction points at the same parent's row it replaces; the latest counts). No name, month or school. Created now, empty in week one; asked from alpha (rule 8.10). Server: add only.
- `consents`: parent_id, topic (recording, photos, experiments), answer (agreed, opted out), wording_version. The latest answer per topic counts; opting out of experiments lives here (rule 11.13). Server: add only.
- `picks`: parent_id, nudge_id, frequency (a plain name such as every_day, checked in code), chosen_at, stopped_at. One current pick per parent per nudge. Server: add; fill in stopped_at once, through a function that checks the pick is that parent's (also writes an event).
- `slots`: parent_id, schedule (school, non_school), start_minute. No duplicate time per schedule. Server: replace a parent's slots (also writes an event).

**What happened** (personal, add-only)
- `habit_logs`: parent_id, nudge_id, for_day, logged_at, from_message_id (the nudge message the Done tap came from; empty = unprompted by a tap), description (up to 280), photo_path, photo_check (passed, failed, error = the check could not run, none), recorded_as (photo_verified, self_reported), telegram_update_id (unique). A photo is saved only if the parent's latest photo consent is agreed (rule 5.5). "Counts for which week" is not stored: `src/variable-rewards/week.ts` works it out (one copy of rule 7.6).
- `messages_sent`: parent_id, kind (nudge, wrap_up), nudge_id and example_id (required for a nudge message, empty for a Wrap Up), for_day, slot_minute, sent_at.
- `connection_answers`: parent_id, week_starting (a Monday), score (1 to 5), telegram_update_id (unique). One per parent per week; the first counts (rule 5.6).
- `events`: parent_id, event_type_id, occurred_at, settings_version, variants (structured; `baseline` in week one), telegram_update_id (unique when present).

**App look up settings** (nothing personal; kept when a parent is deleted)
- `settings_versions`: version, in_force_from, note, settings (labelled list, rule 11.1), fingerprint (unique). Server: add only.
- `event_types`: id, name, meaning, metric. Server: read only; the owner adds rows by reviewed script.
- `holiday_dates`: day (unique), kind (school holiday, public holiday), name. Server: read only; the owner uploads dates before launch.

**Housekeeping**
- `invites`: code (unique), used_by (cleared if that parent deletes their data), used_at. Each code works once. The owner creates codes; the server marks one used.
- `deletion_log`: on_day, how_many. No name or ID. Only the "delete my data" function writes here.

**Later:** `experiments`, `experiment_options`, `experiment_changes`, `assignments` (before alpha, designed with the owner's start and stop flow); `album_entries`, `badges_earned` (with Variable rewards).

## Applied migrations (rule B1)
[2026-10-31 09:59 SGT] Migrations that have run on the real Supabase project, with a fingerprint (the first 12 characters of the SHA-256 code of the file's contents). The drift test recomputes each fingerprint on every pull request and fails if a file was edited. To change the database, add a new numbered migration instead.

| Migration | Fingerprint |
|---|---|
| 001_create_nudge_repository.sql | 61812ba8c145 |
| 002_service_role_read_only.sql | 99f8e46eec97 |

## Content scripts
- [2026-10-31 18:12 SGT] `2026-10-31_more_examples.sql`: applied by the owner on 31 Oct (32 rows). Live Supabase now has 77 examples, matching the seed file.
- SUPERSEDED [2026-10-31 18:12 SGT] [2026-10-31 17:45 SGT] `2026-10-31_more_examples.sql`: adds the 32 examples approved on 31 Oct (D6). **Waiting for the owner to run it** in the Supabase SQL Editor (expect 32 rows; a second run adds 0).
- [2026-10-31 17:45 SGT] `2026-10-29_unlock_all_nudges.sql`: applied (the owner confirmed on 31 Oct that all 9 nudges are unlocked; the run showed 0 rows because it had already been applied).
- [2026-10-31 09:59 SGT] `2026-10-28_time_agnostic_examples.sql`: applied by the owner on 28 Oct (10 rows).
- SUPERSEDED [2026-10-31 17:45 SGT] [2026-10-31 09:59 SGT] `2026-10-29_unlock_all_nudges.sql`: **waiting for the owner to run it** in the Supabase SQL Editor (expect 3 rows: SGE, ITE, ASD).

## Rules at a glance
5.5 photos: optional, consent, kept until deleted · 8.1 everything in Singapore · 8.2 locked by default · 8.3 the tables · 8.4 add only, four narrow edits · 8.5 delete follows the parent · 8.6 no duplicates · 8.7 all or nothing · 8.8 structure only · 8.9 links by nudge ID · 8.10 children's birth year · 8.11 least access for Telemetry · 8.12 labelled and timed

## Rules
- **5.5** **Photos:** always optional; consent once at sign-up; kept until the parent deletes their data. *(decided 24 Oct)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (fix 2: no photo saved without photo consent). Photo storage is not built yet; the retention risk is in docs/KNOWN-ISSUES.md.
- **8.1** Supabase in **Singapore**; Upstash Redis (Singapore) for chat memory; Vercel functions in Singapore. *(decided 24 Oct)* Not yet tested (dashboard settings, confirmed by the owner for Supabase; `vercel.json` sets the Vercel region `sin1`; Upstash not created yet).
- **8.2** New tables start **locked** (Row Level Security on, no public access); our server can only read the nudge tables. *(decided 25 Oct)* Tested by: src/datastore/supabase/tests/nudge-repository.test.sql (permissions and Row Level Security), confirmed on the live project by the owner's permission check.
- **8.3** [2026-11-01 16:07 SGT] **The tables.** 14 tables are built now, in four groups: About each parent (`parents`, `children`, `consents`, `picks`, `slots`); What happened (`habit_logs`, `messages_sent`, `connection_answers`, `events`); App look up settings (`settings_versions`, `event_types`, `holiday_dates`); Housekeeping (`invites`, `deletion_log`). Six come later. Columns are listed under "Tables" above. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (14 tables, rule 8.12 check).
- **8.4** [2026-11-01 16:32 SGT] **Add only, with four narrow edits.** Our server may only add rows, except: (1) change a parent's paused, Wrap Up on or off, and Wrap Up time; (2) fill in a pick's "stopped at" once; (3) replace a parent's slots; (4) mark an invite as used. Edits 1 to 3 also write an event. Each edit checks it acts on the right parent's rows. Only "delete my data" removes a parent's rows. `event_types` and `holiday_dates` are read only. Enforced by database permissions, not just code. *(decided 1 Nov, changed 1 Nov after review)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T1 to T5, T16, T19, T34).
- SUPERSEDED [2026-11-01 16:32 SGT] **8.4** [2026-11-01 16:07 SGT] **Add only, with three narrow edits.** Our server may only add rows, except: (1) change a parent's paused, Wrap Up on or off, and Wrap Up time; (2) fill in a pick's "stopped at" once; (3) replace a parent's slots. Each edit also writes an event. Only "delete my data" removes a parent's rows. `event_types` and `holiday_dates` are read only. Enforced by database permissions, not just code. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T1 to T5, T16, T19, T34).
- **8.5** [2026-11-01 16:07 SGT] **Delete follows the parent.** Every personal table links to `parents`, so deleting a parent deletes all their rows; a test fails if a table with a parent link isn't covered. Order: photos, then chat memory, then rows, then one deletion-log row (rule 1.5). *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T37 to T41). Photos and chat memory are deleted by the app, not built yet.
- **8.6** [2026-11-01 16:07 SGT] **No duplicates.** A Telegram message is saved once only; one nudge message per parent, day and slot; one Weekly Wrap Up per parent per week; one connection answer per parent per week (the first counts); one current pick per parent per nudge; no duplicate slot; one settings version per set of values. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T7, T15, T18, T22, T27, T28, T30, T33 to T36).
- **8.7** [2026-11-01 16:07 SGT] **All or nothing.** Each action that touches more than one table (for example saving a log and its event) runs as one database step: it all happens, or none of it does. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T25).
- **8.8** [2026-11-01 16:07 SGT] **Structure only.** The database checks links, required fields, duplicates and Fixed limits (280 characters). Tuneable numbers such as "3 a day" are never repeated in the database (rule 1.4). *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T20, T24, T26, T29); tuneable numbers stay in src/settings.ts.
- **8.9** [2026-11-01 16:07 SGT] **Links use the nudge's ID number** (v1.6). A nudge that any parent has picked can't be deleted, only retired (v1.5 answer 2). *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T14, T17).
- **8.10** [2026-11-01 16:07 SGT] **Children.** Optional: one row per child with a **birth year** only (no name, month or school). A year in the future or more than 25 years ago is refused at sign-up and again in the saving code. Ages 0 to 6 and 13 to 25 are accepted and flagged (rule 10.4). Created now, empty in week one; parents are asked from alpha. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T8, T9), tests/datastore-children.test.ts (the 0 to 25 range and flags). The sign-up screen is not built yet.
- **8.11** [2026-11-01 16:07 SGT] **Least access for Telemetry.** Telemetry reads through views with no first names, Telegram IDs or descriptions. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T6).
- **8.12** [2026-11-01 16:07 SGT] **Labelled and timed.** Every table has a "created at" time and a plain-English comment on every column. A moment is stored as a time with time zone, a Singapore day as a date, a slot as minutes after midnight. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (column comments and created_at).
