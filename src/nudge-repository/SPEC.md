# Nudge repository: module spec

[2026-10-31 09:56 SGT] The **current rules** of the Nudge repository module: the 9 nudges and their examples, which the owner edits in Supabase. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 09:56 SGT] Hold the nudges (one row each, with their settings) and their examples (unlimited, linked by a short code), and check every row the app reads, so a broken row edited by hand never reaches parents. The tables themselves are created and stored by the Datastore module (`supabase/migrations/001_create_nudge_repository.sql` and `002_service_role_read_only.sql`); this spec owns the **rules** for their content.

## Code in this folder
- [2026-10-31 09:56 SGT] `nudge-repository.ts`: `readNudgeRows` checks raw rows from the `nudges` and `examples` tables; returns valid nudges (each with its active examples, oldest first), problems (table, row, every reason) and shortages (nudges below 3 active examples, which keep working).
- Used by: the [Nudge engine](../nudge-engine/SPEC.md). Uses: the cross-cutting `src/settings.ts` (the minimum of 3 examples).
- Tests: `tests/nudge-repository.test.ts`, `tests/nudge-repository-first-load.test.ts`, helper `tests/helpers/nudge-repository-rows.ts`; database checks `supabase/tests/nudge-repository.test.sql` (run with `npm run test:db`).
- The owner's original spreadsheet is history: `docs/archive/Nudge_Repository.xlsx`. Supabase is the master copy.

## Rules at a glance
4.1 two tables and codes · 4.2 the 9 nudges · 4.3 settings per nudge · 4.4 at least 3 active examples · 4.5 time-agnostic examples · 4.6 retire, never delete; broken rows reported

## Rules
- **4.1** Two tables the owner edits in Supabase: **nudges** (9 rows, settings written once, short codes TWC, SAF, DPR, GAT, SQT, IAC, SGE, ITE, ASD) and **examples** (unlimited, linked by code). *(decided 25 Oct)* Tested by: tests/nudge-repository.test.ts (row checks, codes, linking), supabase/tests/nudge-repository.test.sql (database rules, codes, typo refused)
- **4.2** **4 quick:** Talking with children, Showing affection, Descriptive praise, Giving attention. **5 deliberate:** Spending quality time, Interesting activities, Setting a good example, Incidental teaching, Ask-say-do. *(decided 24 Oct)* Tested by: tests/nudge-repository-first-load.test.ts
- **4.3** Each nudge has these settings: self-report allowed (yes/no), photo upload allowed (yes/no, plus a photo idea), description limit (280), active (yes/no), and **starts unlocked (yes/no)**. Which nudges start unlocked is rule 2.2 (Nudge engine). *(decided 24 Oct, 25 Oct; reworded 29 Oct)* Tested by: tests/nudge-repository.test.ts, supabase/tests/nudge-repository.test.sql
- **4.4** At least **3 active examples** per nudge: the database blocks edits that go below 3; the app flags new nudges below 3 (the nudge keeps working). *(decided 25 Oct)* Tested by: supabase/tests/nudge-repository.test.sql (the block), tests/nudge-repository.test.ts (the flag). Delivering the alert to the owner is not built yet (see docs/KNOWN-ISSUES.md).
- **4.5** Examples are **time-agnostic** (no "at dinner", "before bedtime"). *(decided 28 Oct)* Tested by: tests/nudge-repository-first-load.test.ts (first-load examples). Examples added later in Supabase are not checked for time words.
- **4.6** Never delete: **retire** (active = no). A broken row is left out and reported; the rest keeps working. *(decided 25 Oct)* Tested by: tests/nudge-repository.test.ts (broken rows, retired nudges and examples), supabase/tests/nudge-repository.test.sql (deleting a nudge with examples is refused)
