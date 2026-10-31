# Context: current state of the project

## Purpose
- [2026-10-24 17:39 SGT] Build the Family Habit App MVP (Minimum Viable Product) described in `docs/SPEC.md`: a Telegram bot plus a web page that nudge parents of children aged 7 to 12 to build habits that strengthen family bonds. Also a learning project for the product manager.

## How to run and test
- [2026-10-31 09:59 SGT] **Database files moved:** everything that was in `supabase/` is now in `src/datastore/supabase/` (Datastore module; spec `src/datastore/SPEC.md`). `npm run test:db` runs `src/datastore/supabase/tests/run.sh`. Older entries below keep the old paths as history.
- [2026-10-31 09:41 SGT] **Drift test:** `tests/docs-drift.test.ts` (checks in `tests/helpers/docs-drift.ts`) runs inside `npm run check`, so GitHub Actions runs it on every pull request. It checks the repo against the facts in `docs/SPEC.md`, section "Modules and structure", and the one diagram `docs/ARCHITECTURE.md`. Failures fail the check; "code changed after its spec" (R4) is printed as a DRIFT WARNING only.
- [2026-10-29 22:25 SGT] **Content script waiting for the owner:** `supabase/content/2026-10-29_unlock_all_nudges.sql` (unlocks SGE, ITE, ASD; expect 3 rows; verified on a local copy of the live data, safe to run twice).
- [2026-10-28 21:56 SGT] **Content script applied on live Supabase (owner):** `2026-10-28_time_agnostic_examples.sql` returned 10 rows (IDs 1, 2, 5, 6, 7, 9, 21, 22, 23, 30), each matching `supabase/seed/examples-first-load.csv` word for word. Live examples and the seed file now agree.
- [2026-10-28 21:16 SGT] **Content changes to live nudges:** one-off scripts in `supabase/content/` (dated). They update only rows whose text is still the original, so they never overwrite the owner's own edits, and are safe to run twice. Not migrations: they change data, not table structure.
- [2026-10-28 20:19 SGT] **Live Supabase data loaded and verified (owner):** `nudges` 9 rows (IDs 1 to 9, agreed codes, categories, photo and starts-unlocked flags as spec v1.5/v1.6), `examples` 45 rows (IDs 1 to 45, 5 active per code), `nudge_examples_view` 45 rows. Guard tested live: retiring 3 of TWC's 5 examples was refused with the agreed message (error code 23514), nothing changed. Note: the dashboard shows times in UTC (8 hours behind Singapore); the app must convert to SGT when showing times to parents.
- [2026-10-25 08:14 SGT] **Migrations run on the real Supabase project:** `001_create_nudge_repository.sql` and `002_service_role_read_only.sql` (both run by the owner). Permission check confirmed: only `service_role` with `SELECT` on `nudges` and `examples`.
- [2026-10-25 08:11 SGT] **Migrations run on the real Supabase project so far:** `001_create_nudge_repository.sql` (run by owner). Pending: `002_service_role_read_only.sql`. Once a migration has run on Supabase, never edit it; fix with a new numbered file.
- [2026-10-25 08:11 SGT] **Permission check (read-only, run after any migration):** in the SQL Editor, list `information_schema.role_table_grants` for `nudges`, `examples`, `nudge_examples_view` and the roles `anon`, `authenticated`, `service_role`. Expected: only `service_role` with `SELECT` on `nudges` and `examples`.
- [2026-10-25 07:51 SGT] **First load of the Nudge repository (owner, once, in this order):** (1) SQL Editor: run `supabase/migrations/001_create_nudge_repository.sql`; (2) Table Editor > `nudges` > Import data from CSV > `supabase/seed/nudges-first-load.csv`; (3) Table Editor > `examples` > Import data from CSV > `supabase/seed/examples-first-load.csv`. Neither CSV has an ID column; Supabase generates IDs. Examples must come second because their codes must already exist.
- [2026-10-25 07:51 SGT] **Adding examples later:** import a CSV with two columns, `nudge_code` and `example` (codes: TWC, SAF, DPR, GAT, SQT, IAC, SGE, ITE, ASD), or add rows in the Table Editor. To replace an example on a nudge with exactly 3, add the new one first, then retire the old one (set `active` to false).
- [2026-10-25 07:51 SGT] Database tests: `npm run test:db` now runs `supabase/tests/nudge-repository.test.sql` (25 checks).
- [2026-10-25 07:17 SGT] **Database tests:** `npm run test:db` runs `supabase/tests/run.sh` against a local PostgreSQL server (set `PGHOST`, `PGPORT`, `PGUSER`). It builds the table from `supabase/migrations/001_create_nudges.sql` in a throwaway database, imports the first-load CSV, checks 13 things, then deletes the database. Not part of `npm run check` or GitHub Actions yet (needs PostgreSQL running).
- [2026-10-25 07:17 SGT] **Applying a database change to Supabase (owner):** Supabase dashboard > SQL Editor > paste the migration file > Run. Files in `supabase/migrations/` are numbered and run once each, in order.
- [2026-10-25 07:17 SGT] **First load of the nudges (owner, once):** Table Editor > `nudges` > Insert > Import data from CSV > `supabase/seed/nudges-first-load.csv` (it has no ID column; Supabase generates IDs 1 to 9).
- [2026-10-24 21:19 SGT] First time: `npm install`. Then `npm run check` runs, in order: `npm run typecheck` (TypeScript checks every file), `npm test` (Vitest runs everything in `tests/`) and `npm run build` (compiles `api/` and `shared/` into `dist/`, which Git ignores). Any failure stops the chain.
- [2026-10-24 21:19 SGT] GitHub Actions (`.github/workflows/check.yml`) runs `npm ci` and `npm run check` on Node.js 24 for every pull request and every push to `main`.
- [2026-10-24 21:19 SGT] Secrets: copy `.env.example` to `.env` for local use (Git ignores `.env`). Real values live in Vercel only.
- [2026-10-24 18:47 SGT] Package manager: npm, with `package-lock.json` as the only lockfile. Runtime: Node.js.
- [2026-10-24 18:47 SGT] Check command (run before every commit): `npm run check` = type check, then tests (Vitest), then build. Same as the SG Weather project. Exact scripts are written when the project skeleton is set up.
- [2026-10-24 17:39 SGT] Not decided yet. The check command (type check, tests and build) is picked together with the technology stack. SUPERSEDED [2026-10-24 18:47 SGT]

## Architecture summary
- [2026-10-31 09:30 SGT] **`shared/` renamed to `src/`** (restructure PR 1; owner's decision). All app code now lives under `src/`: `src/nudge-engine/`, `src/nudge-repository.ts`, `src/settings.ts`, `src/sgt.ts`. Older entries below still say `shared/`; they are history and are not rewritten. Path-move map: `docs/SPEC.md`, change notes.
- [2026-10-28 22:23 SGT] **Batch 2 code (Nudge engine, decisions half, spec v1.7):**
  - `shared/sgt.ts`: Singapore time helpers (a moment <-> Singapore day and minutes after midnight; add days, weekday, Monday of the week).
  - `shared/nudge-engine/schedule.ts`: `dayTypeFor` (school / non-school day from weekday plus uploaded public and MOE school holidays), `checkSchedules` (0 to 3 slots per schedule, at least 1 in total, valid half-hour starts 7:00am to 9:30pm, at least 1 hour apart), `availableSlotStarts` (which times the setup screen greys out).
  - `shared/nudge-engine/due.ts`: `isDue` (every day / every 2 days / 1 or 2 times a week, Monday to Sunday).
  - `shared/nudge-engine/planner.ts`: `planNudge` decides, for one parent at one moment, "send nudge X in this slot" or "don't send" with a reason. "Now" is passed in (no clock inside), so every situation is testable. The sender (not built yet) must call it again immediately before sending.
  - Settings in `shared/settings.ts`: slot length, the 30 slot starts, 1-hour gap, 3 slots per schedule, 3 nudges a day, default slots, 7-day streak rule, deliberate days (Friday, Sunday).
- [2026-10-25 07:51 SGT] **Nudge repository, two tables (spec v1.6)** in `supabase/migrations/001_create_nudge_repository.sql` (replaces `001_create_nudges.sql`, which never ran anywhere):
  - `nudges`: `id` (generated), `code` (unique, 2 to 10 capital letters or digits), `name`, `category`, `self_report_allowed`, `description_max_chars`, `photo_upload_allowed`, `photo_idea`, `active`, `starts_unlocked`, `created_at`. Cannot be deleted while it has examples (retire instead).
  - `examples`: `id` (generated), `nudge_code` (must match a nudge's code; follows a code change automatically), `example`, `active`, `created_at`.
  - Guard (database trigger `examples_keep_minimum`): refuses deleting, retiring or moving an example if its nudge would be left with fewer than 3 active examples. The number 3 is also `MIN_EXAMPLES_PER_NUDGE` in `shared/settings.ts`.
  - `nudge_examples_view`: read-only, every example next to its nudge's code, name and category, for browsing.
  - Security: RLS on both tables; our server (service role) may only read; public roles have no access.
  - App side: `readNudgeRows(nudgeRows, exampleRows)` in `shared/nudge-repository.ts` returns `nudges` (each with its active examples, oldest first), `problems` (table, row, reasons) and `shortages` (nudges below 3 active examples; they keep working).
- [2026-10-25 07:51 SGT] SUPERSEDED: the single-table `nudges` design with `example_1` to `example_5` described in the entries below.
- [2026-10-25 07:17 SGT] **`supabase/` folder:** `migrations/001_create_nudges.sql` (creates the `nudges` table with the same rules as the app, auto IDs, unique names ignoring capitals and spaces, Row Level Security on, read-only access for our server's service role, no access for public roles); `seed/nudges-first-load.csv` (the owner's 9 nudges, made from `docs/Nudge_Repository.xlsx`; booleans as true/false; photo idea empty for quick nudges; starts_unlocked per spec v1.5); `tests/` (database tests). A Vitest test also checks the CSV passes the app's own rules, so database and app agree.
- [2026-10-25 06:25 SGT] **Batch 1 code (step 1 of the development order):**
  - `shared/nudge-repository.ts` (Nudge repository): `readNudgeRows` checks raw rows from the Supabase `nudges` table with `zod`. Valid rows become Nudge objects; broken rows are left out and returned as problems (row ID plus every reason). Duplicated names (ignoring capitals and spaces) or IDs: all rows involved are left out.
  - `shared/nudge-engine/choices.ts` (Nudge engine): `checkChoices` checks a parent's picks against the guardrails and returns targets or every reason, in words the bot can show.
  - `shared/settings.ts`: starting values (choice limits, 2 deliberate times a week in total), mirrored from `docs/EXPERIMENTS.md`.
  - [2026-10-25 06:59 SGT] Supabase `nudges` table columns (planned, used by the tests): `id` (generated automatically), `name`, `category`, `example_1` to `example_5`, `self_report_allowed`, `description_max_chars`, `photo_upload_allowed`, `photo_idea`, `active` (no = retired), `starts_unlocked`. `checkChoices` also takes the IDs a parent has unlocked, refuses retired nudges and refuses locked nudges the parent has not unlocked.
  - SUPERSEDED [2026-10-25 06:59 SGT] Supabase `nudges` table columns (planned, used by the tests): `id`, `name`, `category`, `example_1` to `example_5`, `self_report_allowed`, `description_max_chars`, `photo_upload_allowed`, `photo_idea`.
- [2026-10-24 21:34 SGT] **Official module names** (from the owner's diagram, `docs/architecture-diagram.png`). Use only these names in code, docs and conversation:
  1. **Telegram bot**: chat with the parent. Talks to the Nudge engine, sends photos to the Photo check, writes to the Datastore.
  2. **Nudge engine**: the brain plus experiments. Reads from the Nudge repository, reads and writes the Datastore, triggers Variable rewards.
  3. **Nudge repository**: the 9 actions as data rows.
  4. **Photo check**: the AI vision model. Writes results to the Datastore.
  5. **Variable rewards**: the 5 reward types.
  6. **Datastore**: history and targets (Supabase, plus Upstash Redis for short-term chat context).
  7. **Web app**: login, history, XP. Reads from the Datastore.
  8. **Telemetry**: listens to events from all modules.
- [2026-10-24 21:34 SGT] The Nudge engine has two halves: **decisions** (who to nudge, when, about what; guardrails, cap, moments, priority, surprise yes/no, experiment groups) and **words** (AI-written nudge text, waiting on WIP decisions).
- [2026-10-24 21:19 SGT] Folder layout (same pattern as SG Weather):
  - `api/`: Vercel functions, one file per web address. Kept thin. Helpers go in `api/_...` folders (Vercel does not expose folders starting with `_`).
  - `shared/`: the brain and other logic, with no direct web calls, so it can be tested on its own.
  - `tests/`: Vitest tests.
  - `docs/`: project memory files.
  - [2026-10-24 21:24 SGT] `vercel.json`: Vercel settings; currently only the function region (`sin1`, Singapore).
- [2026-10-24 21:19 SGT] First endpoint: `api/health.ts` (GET `/api/health` answers `{ ok: true, service: "family-habit-builder" }`; anything else gets 405). Uses Node's own request/response types, so the same file runs on Vercel and in tests.
- [2026-10-24 18:47 SGT] First outline (details come when we design each module):
  - **Telegram** sends each parent message to a Vercel function (a "webhook"). That function is a thin layer: it passes the message to the brain and sends the brain's reply back.
  - **The brain** (nudge engine, rewards, experiments) is plain TypeScript with no direct web calls, so it can be fully tested.
  - **Claude** writes nudges and checks photos.
  - **Supabase** stores parents, targets, logged actions, photos, reward events and telemetry. **Upstash Redis** holds short-term chat context.
  - **A scheduler** wakes the app at nudge moments (to be confirmed: see the pending items under "Key decisions").
  - **Web pages** are plain HTML served by Vercel functions, reached by a one-tap sign-in link from the bot.
- [2026-10-24 17:39 SGT] Not decided yet. Waiting for spec clarifications and the technology stack choice. SUPERSEDED [2026-10-24 18:47 SGT]

## Key decisions and why
- [2026-10-31 15:07 SGT] **Two handoff habits** (owner's decision): **H6** context handoff at about 50% of the context window (owner says "handoff"; Claude saves state to the project files, commits, pushes and says when it is safe; owner types `/clear`), because a cluttered context makes earlier decisions easier to lose and a restart from the files is cheap. **H7** at the end of every code session Claude sends `CLAUDE.md`, `docs/CATCH-UP.md` and `docs/SPEC.md` to the owner for Claude Chat, where design and thinking happen; the project files stay the single source of truth. Sub-agents stay per pull request (H3), not per session.
- [2026-10-31 10:19 SGT] **Two read-only review agents** in `.claude/agents/` (Step 2 of the restructure): `privacy-security-reviewer` (tools: Read, Grep only) and `spec-compliance-checker` (tools: Read, Grep, Glob). Each reads many files in its own context window and returns a report of at most 300 words, which keeps the main session's context small. Run both before every pull request (habit H3 in `CLAUDE.md`); the owner decides what goes into `docs/KNOWN-ISSUES.md`. Read-only tools mean they cannot change anything or run commands; the spec-compliance checker never claims tests passed.
- [2026-10-25 08:02 SGT] **Supabase project security settings (at creation):** Data API **on** (needed by `supabase-js`); "Automatically expose new tables" **off** (new tables start locked; access is granted explicitly in our SQL files, as Supabase recommends); "Enable automatic RLS" **on** (safety net: every new table gets Row Level Security even if a SQL file forgets). Project name `family-habit-builder`, region Singapore, Free plan.
- [2026-10-25 06:17 SGT] **Code is commented for a learner** (owner's request, now a rule in `CLAUDE.md`): each file starts with a header explaining what it does and why, and each meaningful step has a plain-English comment. Applied to all existing code and config files. `package.json` and `vercel.json` cannot hold comments, so: `package.json` lists the project name, Node.js version (24) and the four scripts (`typecheck`, `test`, `build`, `check`) plus the installed libraries; `vercel.json` sets the Vercel function region to Singapore (`sin1`).
- [2026-10-24 22:14 SGT] **Nudge repository master copy = a Supabase table**, edited by the owner in the Supabase dashboard (grid editing, or importing a CSV saved from an AI-generated Excel file). Chosen over "Excel in Git" because it is more direct and changes go live without a pull request. Trade-off accepted: content changes skip review, tests and Git history. Safety nets instead:
  - The table's structure (columns and rules) is still created by SQL files in Git, through pull requests.
  - Database rules refuse bad rows at save time (for example category must be quick or deliberate, no blank nudge name or examples, description limit 280).
  - The app checks every row it reads; a bad row is shown as a failure, never patched with made-up values (rule 9).
  - The owner exports a CSV backup before each big change.
  - The first load comes from the owner's spreadsheet (`Nudge_Repository.xlsx`), converted by Claude into a CSV for import.
- [2026-10-24 21:35 SGT] **Development order (agreed by the owner):**
  1. Nudge repository, then Nudge engine (decisions half)
  2. Datastore, including the event log (events recorded from day one for Telemetry)
  3. Telegram bot (basic version) and first deploy: the "walking skeleton"
  4. Variable rewards, then Nudge engine (words half)
  5. Photo check
  6. Telemetry (the 10 metrics)
  7. Web app
  Why: the brain comes first, but an end-to-end version that runs on the owner's phone comes early (step 3), so problems connecting Vercel, Telegram, Supabase and the scheduler show up early. Telemetry is split: events are recorded from step 2, because metrics can't be calculated later from data that was never recorded; the metric calculations come at step 6, when every module produces events. Steps 4 to 7 also leave time for the owner's WIP decisions (rewards, nudge context, UI look). The owner first proposed Engine, Telemetry, Repository/Rewards/Datastore, Photo check, Telegram bot/Web app; this order was adjusted after review.
- [2026-10-24 18:47 SGT] **Tech stack agreed by the owner (11 parts), and why:**
  1. **Claude (Anthropic)** as the brain: writes the nudges (AI-written from day one) and does the photo check. One AI provider for both, already used in Haze Uncle.
  2. **Telegram** as the chat interface: the spec's only channel. Reached with plain web requests.
  3. **Plain HTML** for the web app: the look comes later from the owner, so no framework or styling library for now.
  4. **TypeScript**: JavaScript with type checks that catch mistakes before the code runs. Same language as SG Weather and the owner's web learning.
  5. **GitHub**: holds the code; changes go through pull requests.
  6. **Vercel** (free Hobby plan): runs the bot and web pages, with a preview for every pull request. US$0 hosting. Chosen over Railway (option A, about US$5 a month) because the owner already uses Vercel. Free plan is for non-commercial use only, which suits a friends trial.
  7. **Supabase** (free plan): permanent database plus photo storage, with a Singapore data centre.
  8. **Node.js**: the engine that runs TypeScript on Vercel.
  9. **npm**: the package manager, one lockfile.
  10. **Vitest**: runs the tests.
  11. **Upstash Redis** (free plan): short-term bot conversation context.
- [2026-10-24 18:50 SGT] **Stack setup items, decided by the owner** (supersede the pending list below):
  - **Scheduler: Supabase Cron** wakes the app every few minutes; our code decides who is due a nudge. Because Vercel's free scheduler runs at most once a day.
  - **GitHub Actions** runs `npm run check` on every pull request, as a second check before merge.
  - [2026-10-24 21:24 SGT] **Regions (owner's update):** everything in Singapore for consistency: Supabase (Singapore), Upstash Redis (Singapore region, chosen when the owner creates it) and Vercel functions (region `sin1`, set in `vercel.json`). Stored and processed family data stays in Singapore, except what is sent to Claude.
  - **Regions:** SUPERSEDED [2026-10-24 21:24 SGT] Supabase in Singapore, so stored family data stays in Singapore. Vercel functions stay in Washington, D.C. (Vercel's default), the owner's choice. Trade-off: each database call travels Singapore to Washington and back, so bot replies may be slightly slower; data passes through the US while being processed (it also does when sent to Claude). Can be moved to Singapore later in Vercel settings.
  - **Database changes:** written as SQL files in the repo; the owner runs them in the Supabase dashboard. No extra tool, and the owner sees every change.
  - **Spend limit:** the owner sets a monthly limit in the Anthropic Console (about US$10).
- [2026-10-24 18:47 SGT] **Pending owner approval** (proposed with the stack, not yet agreed): SUPERSEDED [2026-10-24 18:50 SGT]
  - **Scheduler:** Supabase Cron, because Vercel's free scheduler runs at most once a day and nudges need 3 moments a day.
  - **GitHub Actions** to run `npm run check` automatically on every pull request (free).
  - **Singapore regions** for Vercel functions and Supabase, to keep family data in Singapore (a likely PDPA reviewer question).
  - **How database changes are applied:** SQL files kept in the repo and run by the owner in the Supabase dashboard (no extra tool), or the Supabase command-line tool.
  - **A monthly spend limit** set in the Anthropic Console, as in Haze Uncle.
- [2026-10-24 18:44 SGT] **Follow the proven patterns from the owner's SG Weather / Haze Uncle project (`WeiLieh/SGDataAPI`)**, because they already worked in production:
  - Talk to Telegram with plain web requests (no Telegram library), so there is one fewer library to approve and maintain.
  - Keep the bot's "brain" separate from the Telegram layer (the spec's "thin layer"), so the brain can be tested on its own and another channel could be added later without changing it.
  - Secret keys live only in Vercel (and a local file Git ignores), never in code, Git, logs or chat.
  - Each change goes through a pull request, a Vercel preview to test on, then a merge.
- [2026-10-24 18:44 SGT] **Upstash Redis keeps the Telegram bot's conversation context** (short-term memory), as in Haze Uncle, called with plain web requests. Supabase stays the permanent store (history, targets, photos, rewards, telemetry). "Delete my data" must clear both.
- [2026-10-24 18:26 SGT] Spec version 1.1 agreed (see Change notes in `docs/SPEC.md`). Experiments live in `docs/EXPERIMENTS.md`; metrics live in `docs/Family_Habit_App_Success_Metrics.xlsx`.
- [2026-10-24 18:26 SGT] Web pages are plain and unstyled for now, so we can get the data right before the product manager supplies the look.
- [2026-10-24 18:26 SGT] Invite-only access, because the trial is for friends and the app stores family photos.
- [2026-10-24 17:39 SGT] Project memory files created in `docs/` (plus `CLAUDE.md` at the root), so each new session can pick up where the last one stopped.

## Approved libraries
- [2026-10-24 18:50 SGT] Approved by the owner (npm, one lockfile `package-lock.json`):
  - `@anthropic-ai/sdk`: talk to Claude.
  - `@supabase/supabase-js`: talk to Supabase (database and photo storage).
  - `zod`: check that data from outside (Claude, Telegram, Supabase) has the expected shape before we trust it.
  - Development only: `typescript`, `vitest`, `@types/node`.
  - Telegram and Upstash Redis are called with plain web requests (no library). Anything else needs the owner's approval first.
- [2026-10-24 18:47 SGT] Package manager: npm (one lockfile, `package-lock.json`). Tools approved as part of the stack: TypeScript, Vitest. Exact library list still to be approved (see Key decisions, pending items). SUPERSEDED [2026-10-24 18:50 SGT]
- [2026-10-24 17:39 SGT] None yet. Package manager and lockfile to be chosen with the technology stack. SUPERSEDED [2026-10-24 18:47 SGT]

## UI decisions
<!-- Empty until the product manager supplies the look. -->

## Git and release workflow
- [2026-10-24 18:26 SGT] GitHub repository: https://github.com/weilieh/familyhabitbuilder (confirmed by the product manager).
- [2026-10-24 17:39 SGT] GitHub repository: https://github.com/weilieh/familyhabitbuilder (confirm with the product manager). SUPERSEDED [2026-10-24 18:26 SGT]
- [2026-10-24 17:39 SGT] Never work on `main`. One branch per task. Merge into `main` only through a pull request, after the product manager approves.
- [2026-10-24 17:39 SGT] Current working branch: `claude/festive-einstein-nf623s`.

## Glossary (terms and acronyms)
- [2026-10-31 17:53 SGT] **Weekly Wrap Up:** the once-a-week Sunday message (rule 3.12) with "this week so far" and an invitation to save a moment for the album. A different kind of message from a nudge message: no slot, not counted toward the 3-a-day cap.
- [2026-10-31 17:53 SGT] **Week closes:** a week (Monday to Sunday) is judged at midnight on Sunday, Singapore time (rule 7.6). A log made after that for Sunday is saved but no longer counts.
- [2026-10-24 22:09 SGT] **Nudge:** one of the 9 rows in the Nudge repository (for example "Descriptive praise"). Replaces the older word "action" for the rows.
- [2026-10-24 22:09 SGT] **Example:** one of the 5 ideas listed under a nudge.
- [2026-10-24 22:09 SGT] **Nudge message:** the actual message the bot sends a parent.
- [2026-10-24 22:09 SGT] **Photo idea:** a suggestion of what to photograph for a nudge that allows photos.
- [2026-10-24 22:09 SGT] **Optional description:** the parent's short note (max 280 characters) when logging; the Investment step of the Hooked model.
- [2026-10-24 22:09 SGT] **Moment:** an everyday time slot for nudge messages (weekday: to school, dinner, bedtime; weekend: to be defined).
- [2026-10-24 21:34 SGT] **Module names:** see "Official module names" under Architecture summary. "Habit rules" is not a module name; do not use it.
- [2026-10-24 21:19 SGT] **CI (Continuous Integration):** automatically running the checks on every proposed change. Ours is GitHub Actions.
- [2026-10-24 21:19 SGT] **Health check:** a tiny web address that only answers "I'm alive", used to confirm a deployment works.
- [2026-10-24 18:47 SGT] **Webhook:** Telegram "knocks" on our Vercel address each time a parent sends something, instead of our app constantly asking Telegram for news.
- [2026-10-24 18:47 SGT] **Serverless function:** code that Vercel runs only when a request arrives; nothing runs between requests.
- [2026-10-24 18:47 SGT] **Cron (scheduler):** an alarm clock that wakes the app at set times.
- [2026-10-24 18:47 SGT] **Redis:** a very fast, simple store for short-lived data (our sticky-note pad).
- [2026-10-24 18:26 SGT] **WIP (Work In Progress):** started or agreed in principle, but waiting on a decision before it can be finished.
- [2026-10-24 18:26 SGT] **PDPA (Personal Data Protection Act):** Singapore's personal data law.
- [2026-10-24 18:26 SGT] **WAU/MAU (Weekly Active Users ÷ Monthly Active Users):** our stickiness measure.
- [2026-10-24 18:26 SGT] **Unlock:** a feature (such as choosing more behaviours) that a parent earns rather than gets from the start.
- [2026-10-24 17:39 SGT] **MVP (Minimum Viable Product):** the smallest version that is good enough to test with real users.
- [2026-10-24 17:39 SGT] **XP (Experience Points):** points a parent earns for logged actions; they add up to levels.
- [2026-10-24 17:39 SGT] **Triple P (Positive Parenting Program):** the parenting programme the 9 actions come from.
- [2026-10-24 17:39 SGT] **Hooked model:** Nir Eyal's habit loop: Trigger, Action, Variable Reward, Investment.
- [2026-10-24 17:39 SGT] **SGT (Singapore Time):** UTC+08:00, used for all date/time prefixes.
- [2026-10-24 17:39 SGT] **PR (Pull Request):** a request to merge a branch into `main`, where changes are reviewed first.
- [2026-10-24 17:39 SGT] **TDD (Test-Driven Development):** writing the tests before the code.
