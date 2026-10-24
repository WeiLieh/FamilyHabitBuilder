# Progress (handoff between sessions)

## [2026-10-25 06:17 SGT] Session 2
### Done
- [2026-10-25 07:17 SGT] **Handoff step 2 done:** `supabase/migrations/001_create_nudges.sql`, `supabase/seed/nudges-first-load.csv` (from the owner's spreadsheet), database tests (`npm run test:db`, 13 passed on local PostgreSQL 16) and a Vitest test that the CSV passes the app's rules. `npm run check`: 38 tests pass.
- [2026-10-25 06:59 SGT] Spec v1.5 (auto IDs, active column, unlock = bigger menu, starts-unlocked flag, no "for now"). Tests updated first (6 failed), then code; all 34 tests pass, full check passes.
- [2026-10-25 06:25 SGT] **Batch 1 built test-first.** 26 new tests written first and seen failing (red), then code written until all passed (green). Full check passes: 28 tests (3 files). Files: `shared/nudge-repository.ts`, `shared/nudge-engine/choices.ts`, `shared/settings.ts`, `tests/nudge-repository.test.ts`, `tests/nudge-engine-choices.test.ts`, `tests/helpers/nudge-rows.ts`. Installed approved library `zod`.
- [2026-10-25 06:17 SGT] Owner asked for learner-friendly comments in all code. Added headers and step-by-step comments to `api/health.ts`, `tests/api-health.test.ts`, `tsconfig.json`, `tsconfig.build.json` and `.github/workflows/check.yml` (behaviour unchanged, check passes). Made it a standing rule in `CLAUDE.md`.
### In progress
- [2026-10-25 07:17 SGT] Next: Batch 2 tests in plain English (3-nudges-a-day cap, weekday moments, priority by hidden ideal and floor), then Batch 3.
- [2026-10-25 06:25 SGT] SUPERSEDED [2026-10-25 07:17 SGT] Next: handoff step 2 (Supabase table SQL file and first-load CSV), then Batch 2 tests in plain English.
- [2026-10-25 06:17 SGT] Next: Batch 1 (see the handoff below). SUPERSEDED [2026-10-25 06:25 SGT]
### Next steps
- [2026-10-25 06:17 SGT] Follow "Next steps (in order)" in the handoff below.
### Blockers
- [2026-10-25 06:17 SGT] None.

## [2026-10-24 22:18 SGT] HANDOFF FOR THE NEXT SESSION (read this first)
### Where we are
- [2026-10-24 22:18 SGT] Branch `claude/festive-einstein-nf623s` (not `main`); everything committed and pushed; no pull request opened yet.
- [2026-10-24 22:18 SGT] Spec is at version 1.4 (`docs/SPEC.md`, Change notes). Tech stack, approved libraries, regions (all Singapore) and development order are in `docs/CONTEXT.md`.
- [2026-10-24 22:18 SGT] Code so far: project skeleton only (`npm run check` passes; `/api/health` with 2 tests; GitHub Actions workflow). No module code yet.
- [2026-10-24 22:18 SGT] Official module names: Telegram bot, Nudge engine, Nudge repository, Photo check, Variable rewards, Datastore, Web app, Telemetry (`docs/architecture-diagram.png`). Words: nudge (one of 9 rows), example, nudge message.
### Next steps (in order)
1. [2026-10-24 22:18 SGT] **Write the agreed Batch 1 tests, watch them fail, then write the code until they pass** (step 1 of the development order). Tests agreed by the owner:
   - **1a. Nudge repository, what counts as a valid nudge:** (1) a complete, correct row is accepted; (2) category must be "quick" or "deliberate"; (3) name and all 5 examples must not be blank; (4) "self-report allowed" and "photo upload allowed" must each be yes or no; (5) a nudge that allows photos must have a photo idea; (6) a nudge must allow at least one way to log; (7) no two nudges share the same name; plus: a broken row is left out and reported (alert to owner) while the other nudges keep working.
   - **1b. Nudge engine, guardrails on a parent's choices:** (8) up to 2 of the 4 quick and up to 1 of the 5 deliberate; at least 1 in total; (9) more than allowed, a duplicate, or an unknown nudge is refused with a clear reason; (10) each quick nudge is every day or every 2 days, the deliberate nudge is 1 or 2 per week; (11) a valid choice is returned as the parent's targets. Limits come from the starting values in `docs/EXPERIMENTS.md`.
   - The nudge content lives in a Supabase table, so Batch 1 tests use test rows, not the real 9. The `zod` library is approved for checking rows (install it when first used).
2. [2026-10-24 22:18 SGT] Prepare the Supabase table structure as a SQL file (with database rules matching tests 2 to 7) and a template CSV made from the owner's `Nudge_Repository.xlsx` for the first import. The owner runs the SQL and imports the CSV in the dashboard. The spreadsheet is saved at `docs/Nudge_Repository.xlsx` as the source for the first load only; after the import, Supabase is the master copy.
3. [2026-10-24 22:18 SGT] Then Batch 2 (3-nudges-a-day cap, weekday moments, priority by hidden ideal and floor) and Batch 3 (surprise bonus yes or no at 20%, sticky experiment groups): show tests in plain English first.
### Waiting on the owner (not blocking step 1)
- [2026-10-24 22:18 SGT] WIP: weekend moments; trial length; XP values and levels; unlock rule; context collected for AI nudge messages; personality and tone in `docs/NUDGE-CONTEXT.md`; moment tags for examples; UI look (Web app). See `docs/PRODUCT-BACKLOG.md` and `docs/KNOWN-ISSUES.md`.
- [2026-10-24 22:18 SGT] Owner setup later (step 3, first deploy): create the Supabase project (Singapore), Upstash Redis (Singapore), the Vercel project, the Telegram bot in BotFather, and the Anthropic spend limit. Claude will guide each step.

## [2026-10-24 17:39 SGT] Session 1: project setup and spec review
### Done
- [2026-10-24 22:20 SGT] Created `docs/TIME-LOG.md` with session 1's time (about 5 h elapsed, about 2 h 30 min active), and added it to `CLAUDE.md` (file table and end-of-session steps).
- [2026-10-24 22:18 SGT] Owner agreed the Batch 1 rules (broken row handling, photo idea and logging-method rules, at least 1 behaviour, limits in `docs/EXPERIMENTS.md`). Spec v1.4. Session ended for the night; handoff written at the top of this file.
- [2026-10-24 22:14 SGT] Question 9 decided: the Nudge repository master copy is a Supabase table edited in the dashboard. Recorded in `docs/SPEC.md`, `docs/CONTEXT.md`, with the trade-off in `docs/KNOWN-ISSUES.md`.
- [2026-10-24 22:09 SGT] Read the owner's Nudge Repository spreadsheet and agreed answers 1 to 8. Spec v1.3 recorded (quality time now deliberate; per-nudge self-report and photo flags; optional description as Investment; examples, photo ideas and moment tags; naming: nudge, example, nudge message).
- [2026-10-24 21:35 SGT] Development order agreed and recorded in `docs/CONTEXT.md` (Key decisions).
- [2026-10-24 21:34 SGT] Saved the owner's architecture diagram as `docs/architecture-diagram.png` and recorded its 8 module names as the official vocabulary in `docs/CONTEXT.md`.
- [2026-10-24 21:24 SGT] Owner decided all regions are Singapore: Upstash Redis and Vercel functions as well as Supabase. Added `vercel.json` with region `sin1`.
- [2026-10-24 21:19 SGT] Project skeleton set up: `package.json` (npm, Node.js 24), TypeScript settings, Vitest, `npm run check`, GitHub Actions workflow, `.gitignore` and `.env.example` (blank placeholders). First endpoint `/api/health` built test-first; 2 tests pass, full check passes.
- [2026-10-24 18:50 SGT] Owner decided the stack setup items (Supabase Cron, GitHub Actions, Supabase in Singapore with Vercel in Washington, SQL files for database changes, Anthropic spend limit) and approved the library list. Recorded in `docs/CONTEXT.md`.
- [2026-10-24 18:47 SGT] Tech stack (11 parts) agreed and logged in `docs/CONTEXT.md`, with the reason for each. Check command `npm run check` recorded.
- [2026-10-24 18:44 SGT] Owner decided: plain web requests for Telegram, reuse SG Weather / Haze Uncle patterns (separate brain, secrets only in Vercel, PR + Vercel preview + merge), Upstash Redis for bot context. Recorded in `docs/CONTEXT.md`.
- [2026-10-24 18:34 SGT] Product manager confirmed the three flags: metric-driven bot features are in scope (spec v1.2); weekend moments and trial length added to the backlog as WIP; photo retention kept as an open issue.
- [2026-10-24 18:26 SGT] Product manager answered all 18 questions. Recorded as spec version 1.1 in `docs/SPEC.md`. Added `docs/EXPERIMENTS.md` and the metrics spreadsheet. Logged WIP items in the backlog and open questions in known issues.
- [2026-10-24 17:39 SGT] Placed `CLAUDE.md` at the root and `SPEC.md` in `docs/`. Created the other project files from the structures in `CLAUDE.md`.
- [2026-10-24 17:39 SGT] Read the spec and sent the product manager clarifying questions.
### In progress
- [2026-10-24 22:09 SGT] Question 9 open: where the master copy of the Nudge repository lives (spreadsheet, code data file, or Supabase table). Then update and show the Batch 1 tests.
- [2026-10-24 21:34 SGT] Agreeing the development order of the modules with the owner.
- [2026-10-24 18:47 SGT] Waiting for owner approval of the pending stack items (scheduler, GitHub Actions, Singapore regions, database change method, Anthropic spend limit) and the library list.
- [2026-10-24 18:34 SGT] Technology stack choice deferred by the product manager (options A, B, C were presented; A recommended).
- [2026-10-24 18:26 SGT] Technology stack proposal sent; waiting for the product manager's choice.
- [2026-10-24 17:39 SGT] Waiting for answers to the clarifying questions.
### Next steps
- [2026-10-24 22:14 SGT] Show the updated Batch 1 tests in plain English (Nudge repository rules and Nudge engine guardrails) for the owner to confirm.
- [2026-10-24 21:35 SGT] Step 1: Nudge repository, then Nudge engine (decisions half). Wait for the owner's extra context upload, then show tests in plain English before writing code.
- [2026-10-24 21:24 SGT] Owner is uploading more context for the first module. Wait for it before writing tests.
- [2026-10-24 21:19 SGT] Owner to pick the first module to build. Owner to confirm Upstash Redis is created in its Singapore region.
- [2026-10-24 18:50 SGT] Set up the project skeleton (package.json, TypeScript, Vitest, `npm run check`, GitHub Actions) on a new branch, then start the first module with tests first.
- [2026-10-24 18:44 SGT] Finalise the tech stack with the owner, then record approved libraries, package manager and check command in `docs/CONTEXT.md`.
- [2026-10-24 18:26 SGT] Record the stack choice, approved libraries, package manager and check command in `docs/CONTEXT.md`. Then set up the project skeleton.
- [2026-10-24 17:39 SGT] Record agreed answers as change notes in `docs/SPEC.md`.
- [2026-10-24 17:39 SGT] Propose the technology stack (at least two options with trade-offs) and record the choice in `docs/CONTEXT.md`.
### Blockers
- [2026-10-24 18:26 SGT] Stack choice needed before code. Weekend moments, trial length and XP values are needed before those parts are built (not blocking the start).
- [2026-10-24 17:39 SGT] No code until the spec questions are answered and agreed.
