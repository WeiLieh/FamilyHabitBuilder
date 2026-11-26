# Context: current state of the project

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/CONTEXT-superseded.md](archive/CONTEXT-superseded.md) to keep this file short (owner approved).

## Purpose
- [2026-10-24 17:39 SGT] Build the Family Habit App MVP (Minimum Viable Product) described in `docs/SPEC.md`: a Telegram bot plus a web page that nudge parents of children aged 7 to 12 to build habits that strengthen family bonds. Also a learning project for the product manager.

## How to run and test
- [2026-11-24 23:40 SGT] **The Demo module waiting for the owner:** (1) run migration 015 in Supabase's SQL Editor after 014; (2) in Vercel > Settings > Environment Variables, add `DEMO_OWNER_TELEGRAM_IDS` with your own Telegram number (not a secret), then redeploy. Until both are done, `/demo` is just an unknown command. **Database tests now T1 to T130.**
- [2026-11-24 23:06 SGT] **Migration 014 applied on Supabase (owner, 24 Nov):** the Sunday Wrap Up and "Add a moment". #59 and #60 merged; the first live Wrap Up is Sunday 29 Nov.
- [2026-11-24 22:57 SGT] **Migration 014 (the Sunday Wrap Up and "Add a moment") waiting for the owner:** run it after 013, the same way, before Sunday 29 Nov. **Database tests now T1 to T126.**
- [2026-11-24 22:49 SGT] **Migrations 012 and 013 applied on Supabase (owner, 24 Nov evening):** the private `photos` store with its locks, and "Add how you felt". #58 (photos) merged.
- [2026-11-24 22:41 SGT] **Migration 013 ("Add how you felt") waiting for the owner:** run it after 012, the same way. Until it runs, tapping "Add how you felt" says it didn't work. **Database tests now T1 to T123.**
- [2026-11-24 22:35 SGT] **Migration 012 (photos) waiting for the owner:** Supabase > SQL Editor > paste `src/datastore/supabase/migrations/012_photos_unchecked_and_storage.sql` > Run, after 011. It makes the private `photos` store and its locks. Until it runs, saving a photo fails honestly ("didn't save"). **Database tests now T1 to T120** (`npm run test:db`; T119, T120 use a small stand-in for Supabase Storage, since a plain PostgreSQL has none).
- [2026-11-11 20:42 SGT] **Vercel serves only `public/`** (`vercel.json`, `outputDirectory`): a placeholder page, `public/index.html`. Without it the deploy fails (Vercel looks for `public` after the build) or, if the build were skipped, the whole repository would be published as web pages. The bot's web address in `api/` is unaffected. UAT case U0 checks the source files are not reachable.
- [2026-11-11 18:14 SGT] **Thin slice 1 (Telegram bot):** one web address, `api/telegram-bot.ts`: POST = Telegram's webhook (needs `TELEGRAM_WEBHOOK_SECRET`), GET = Vercel's daily alarm (needs `CRON_SECRET`). `vercel.json` now also holds `crons`: `/api/telegram-bot` at `0 11 * * *` (11:00 UTC = 7:00 pm Singapore). Secrets in Vercel only: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (names in `.env.example`). `@supabase/supabase-js` installed (approved 24 Oct). Setup and checks: `src/telegram-bot/UAT-thin-slice-1.md`.
- [2026-11-01 16:38 SGT] **Migration 003 applied on the real Supabase project (owner, 1 Nov):** the 14 Datastore tables are live. Check query: 14 tables, 14 locked, 0 public access, server INSERT and SELECT only, 13 event types.
- [2026-11-15 12:25 SGT] **Database tests now T1 to T116:** `npm run test:db` also runs `src/datastore/supabase/tests/web-app-access.test.sql` (migration 011, the Web app's sign-in, per-parent access, reads and deletes; T99 to T116). Same commands as below; in this cloud container the local PostgreSQL may already have a data folder in `/var/tmp/fhb-pg/data`: then only run the `pg_ctl ... start` step.
- [2026-11-11 17:28 SGT] **Database tests now T1 to T53** (migration 005 added). Same commands as below.
- [2026-11-09 18:16 SGT] **Database tests now T1 to T42:** `datastore-tables.test.sql` also runs migration 004 (Wrap Up switch removed). Same commands as below. In this cloud container the PostgreSQL programs are in `/usr/lib/postgresql/16/bin/` (not on the PATH) and must run as the postgres user.
- [2026-11-01 16:14 SGT] **Database tests now cover the 14 Datastore tables:** `npm run test:db` runs `nudge-repository.test.sql` then `datastore-tables.test.sql` (T1 to T41) on a throwaway local database. In a cloud container, start a local PostgreSQL first, for example as the postgres user: `initdb -D /var/tmp/fhb-pg/data -U postgres -A trust` then `pg_ctl -D /var/tmp/fhb-pg/data -o "-p 54329 -k /tmp" start`, then `PGHOST=127.0.0.1 PGPORT=54329 PGUSER=postgres npm run test:db`. Still not part of `npm run check` (docs/KNOWN-ISSUES.md).
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
  - [2026-10-25 06:59 SGT] Supabase `nudges` table columns (planned, used by the tests): `id` (generated automatically), `name`, `category`, `example_1` to `example_5`, `self_report_allowed`, `description_max_chars`, `photo_upload_allowed`, `photo_idea`, `active` (no = retired), `starts_unlocked`. `checkChoices` also takes the IDs a parent has unlocked, refuses retired nudges and refuses locked nudges the parent has not unlocked.
- [2026-10-24 21:34 SGT] **Official module names** (from the owner's diagram, `docs/architecture-diagram.png`). Use only these names in code, docs and conversation:
  1. **Telegram bot**: chat with the parent. Talks to the Nudge engine, sends photos to the Photo check, writes to the Datastore.
  2. SUPERSEDED [2026-10-31 19:09 SGT] (experiments are now their own module, item 9 below) **Nudge engine**: the brain plus experiments. Reads from the Nudge repository, reads and writes the Datastore, triggers Variable rewards.
  3. **Nudge repository**: the 9 actions as data rows.
  4. **Photo check**: the AI vision model. Writes results to the Datastore.
  5. **Variable rewards**: the 5 reward types.
  6. **Datastore**: history and targets (Supabase, plus Upstash Redis for short-term chat context).
  7. **Web app**: login, history, XP. Reads from the Datastore.
  8. **Telemetry**: listens to events from all modules.
  - [2026-10-31 19:06 SGT] 9. **Experiments**: which settings and variant each parent has, recorded from day one; owner-run experiments before alpha. Added by the owner on 31 Oct; the Nudge engine is no longer "brain plus experiments" but the brain only. The current list is the Module table in `docs/SPEC.md`.
- [2026-10-24 21:34 SGT] The Nudge engine has two halves: **decisions** (who to nudge, when, about what; guardrails, cap, moments, priority, surprise yes/no, experiment groups [2026-10-31 19:09 SGT: experiment groups moved to the Experiments module]) and **words** (AI-written nudge text, waiting on WIP decisions).
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

## Key decisions and why
- [2026-11-26 22:38 SGT] **How the owner's UAT is automated (owner, 26 Nov): option A, a Claude session on the owner's computer drives Telegram Web** with the runbook [docs/UAT-RUNBOOK.md](UAT-RUNBOOK.md), and the results come back here to be recorded. Why: it works tonight with no new library, no new secret and no new code; this cloud session can't reach the owner's browser. Trade-off: not repeatable by one command, and the owner must be present (sign-in, photo, My page taps). Option B, coded end-to-end tests with a second Telegram account, is in the backlog.
- [2026-11-24 21:58 SGT] **How the stylesheet is allowed past the page's security rule (owner, 24 Nov): option A.** The Content Security Policy (the header telling the browser what a page may load) allows only our one stylesheet, named by its fingerprint (a SHA-256 hash), as it already does for the open page's one script. Injected styling and one-off `style="…"` attributes stay blocked. Option B, allowing any styling written in the page (`'unsafe-inline'`), was simpler but weaker; a security reviewer would flag it.
- [2026-11-15 12:13 SGT] **How the per-parent pass is made (owner, 15 Nov): option A, a signed pass checked by the database** (rule 9.8). After sign-in, our server signs a short pass (about 10 minutes) for one parent with Supabase's signing secret, and Row Level Security checks every row against it. Analogy: a hotel key card that opens only your room, with the lock doing the checking. Alternative weighed: option B, each database function checks the sign-in itself (no signing secret on Vercel, but "this parent only" would live in each function's code, so one mistake could show another family's data). Cost: the signing secret sits in Vercel's settings (never in code or Git); a security reviewer will ask who can see it. No new library: Node's built-in tools sign the pass and handle the cookie.
- [2026-11-15 09:23 SGT] **The Web app reaches the database with per-parent access, never the master key (owner, 15 Nov: "let's default to security"; rule 9.8).** After sign-in, our server gets a short-lived pass for that one parent, and the database's own rules (Row Level Security) let it see only that parent's rows. Two guards instead of one: a bug in our code still cannot show one family another family's children or photos. Alternative weighed: the server with the master key, as the Telegram bot does (simpler, nothing new, but one bug or one leaked key exposes every family). Cost: about one extra build step, test-first, before Week so far. The Telegram bot keeps the master key (server only, no browser involved).
- [2026-11-12 23:20 SGT] **Scheduler confirmed (owner, 12 Nov): Supabase Cron**, for pull request 3 (the planner live). Free, in Singapore, no new vendor, and the same as the 24 Oct choice below. Alternatives weighed: Upstash QStash (retries and a dashboard, but a new vendor outside Singapore and signature checking), Vercel Pro (simplest, about US$20 a month), GitHub Actions (free but often late). Until then, the sign-up clean-up runs with Vercel's daily 7:00 pm job (temporary, decision D4).
- [2026-11-01 16:56 SGT] **Owner-only design copies and an end-of-session pull request (owner, 1 Nov):** visual design pages are kept as PDFs in a module's `design/` folder for the owner; Claude is blocked from reading them (`.claude/settings.json` deny rule, habit H8) because drafts go stale and the specs are the single source of truth. Every session ends with a small docs pull request so `main` matches the handoff (habit H9). Option considered: keep docs on the working branch until the next feature pull request; rejected because `main` then looks stale to the owner and to Claude Chat.
- [2026-10-31 19:06 SGT] **Experiments is its own module, built in stages** (owner, from a Claude Chat design). Option C: on paper now (spec, diagram, Datastore table design), live start and stop before alpha. Week one (about 12 parents) uses one set of values (`baseline`), because a split that small can't show a real difference; but every event records the settings version and variant **from day one**, because results can't be read later from data that was never recorded. Reward settings are a labelled list (JSON) inside each settings version, so new settings don't need table changes; code validates them. Numbers live once, in code (rule 1.4); `docs/EXPERIMENTS.md` describes. Rejected: keeping experiments inside the Nudge engine (it would mix the brain with record-keeping), and A/B groups in week one (too few parents). [2026-10-31 19:18 SGT] `docs/EXPERIMENTS.md` has since moved to `src/experiments/EXPERIMENTS.md`.
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
  - **Database changes:** written as SQL files in the repo; the owner runs them in the Supabase dashboard. No extra tool, and the owner sees every change.
  - **Spend limit:** the owner sets a monthly limit in the Anthropic Console (about US$10).
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
- [2026-11-14 00:16 SGT] Owner re-confirmed `@anthropic-ai/sdk` for the Claude personality build (rules 3.11, 7.5). It was already on this list (24 Oct); nothing else added.
- [2026-10-24 18:50 SGT] Approved by the owner (npm, one lockfile `package-lock.json`):
  - `@anthropic-ai/sdk`: talk to Claude.
  - `@supabase/supabase-js`: talk to Supabase (database and photo storage).
  - `zod`: check that data from outside (Claude, Telegram, Supabase) has the expected shape before we trust it.
  - Development only: `typescript`, `vitest`, `@types/node`.
  - Telegram and Upstash Redis are called with plain web requests (no library). Anything else needs the owner's approval first.

## UI decisions
<!-- Empty until the product manager supplies the look. -->
- [2026-11-26 22:52 SGT] **L14 Settings pop-up (owner, 26 Nov, "all as recommended"):** a box with 12px corners (L10) on a page dimmed with **black at 40%**; a tick in a circle in the accent green (L4); "Saved." in body text (L9); an **OK** pill (L10).
- [2026-11-26 22:52 SGT] **L15 greyed-out choices:** a choice that can't be picked shows at **40% strength** (for example the other quick behaviours once 2 are ticked).
- [2026-11-26 22:52 SGT] **L16 the pause switch slides** in **0.2 seconds**. Dustbins in Settings are the same thin outline dustbin as on Week so far (L12).
- [2026-11-24 21:57 SGT] **L13, the remaining sizes from the layout files (owner approved after the spec-compliance review, 24 Nov):** day circles 32px; bars 28px wide with 2px corners; tiles 56px with 8px corners; 13px for the bars' answer numbers and the older-week count line; 15px for the "Are you sure?" question; 20px for an older week's dates; a 40px tap area for the dustbin; buttons at least 44px tall; an up-chevron on the older-weeks button.
- [2026-11-24 21:57 SGT] **Claude Code's picks, option B (owner, 24 Nov):** the moment's line is 15px (the habit-name size, rule 9.4 "larger"); an empty day's ring is 1px (L6). Kept because the files have no equivalent: tile text 10px; a 104px space at the bottom of the page so the fixed tab bar never covers the last button. Option A (17px line, 1.5px ring) not chosen.
- [2026-11-24 21:58 SGT] **Source and scope (owner, 24 Nov):** the look is taken from the owner's Claude Chat layout files of 14 Nov ([docs/handoffs/2026-11-14-web-app-week-so-far-layouts/](handoffs/2026-11-14-web-app-week-so-far-layouts/)), **look only**: where things go still follows rules 9.4 to 9.7. It applies to My page: Week so far, "Are you sure?", Habits so far and Settings. The sign-in, expired-link, signed-out and error pages stay plain for now. One hand-written stylesheet, no styling library (rule 6); it lives in `src/web-app/style.ts`.
- [2026-11-24 21:58 SGT] **L1 font:** the phone's own system font (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`); nothing is downloaded.
- [2026-11-24 21:58 SGT] **L2 main text:** near-black `#1F2328`.
- [2026-11-24 21:58 SGT] **L3 secondary text** (dates, the day under a habit, labels): dark grey `#4F5660`.
- [2026-11-24 21:58 SGT] **L4 accent:** deep green `#1F6F5C` for ticks, the current tab and the "This week" bar.
- [2026-11-24 21:58 SGT] **L5 earlier weeks' bars:** pale green `#9CC7BC`.
- [2026-11-24 21:58 SGT] **L6 box borders and empty day circles:** light grey `#D5D9DE`, 1px.
- [2026-11-24 21:58 SGT] **L7 lines between log rows:** paler grey `#E6E9ED`.
- [2026-11-24 21:58 SGT] **L8 background:** white `#FFFFFF`; one column about 390px wide (phone width).
- [2026-11-24 21:58 SGT] **L9 sizes:** name 24px bold; section titles 20px bold; habit names 15px semi-bold; body 14px; small lines 12px; tab labels 11px.
- [2026-11-24 21:58 SGT] **L10 shapes:** boxes with 12px rounded corners; buttons as 20px-rounded "pills"; ticks in filled green circles.
- [2026-11-24 21:58 SGT] **L11 spacing:** 20px page margins, 16px inside boxes, 12px between rows.
- [2026-11-24 21:58 SGT] **L12 icons:** thin outline dustbin and tab icons in dark grey; Rewards greyed out.
- [2026-11-24 21:58 SGT] **Delete button: warning red `#B42318`** with white text (owner: "warning red"; the exact red is Claude Code's pick, easy to read with white text; the owner may change it). Only Delete on "Are you sure?" is red; **Cancel** is an outlined pill.
- [2026-11-24 21:58 SGT] **Dark mode: none.** The page stays white when the phone is in dark mode (owner, 24 Nov).
- [2026-11-24 21:58 SGT] **Defaults until designed (flagged to the owner, 24 Nov):** the ✓ habit tile in the older-weeks list uses the plain grey-bordered tile frame with ✓ and the habit's name (its look is still open, rule 9.7); the older-week cards have **no chevron** until they are links (an older week's own page is not built).

## Git and release workflow
- [2026-10-24 18:26 SGT] GitHub repository: https://github.com/weilieh/familyhabitbuilder (confirmed by the product manager).
- [2026-10-24 17:39 SGT] Never work on `main`. One branch per task. Merge into `main` only through a pull request, after the product manager approves.
- [2026-10-24 17:39 SGT] Current working branch: `claude/festive-einstein-nf623s`.

## Glossary (terms and acronyms)
- [2026-11-15 09:23 SGT] **Row Level Security (RLS):** the database's own rule about which rows a given pass may see or change (for example "only rows where parent = 3"). It checks every request, even if our code asks for the wrong rows.
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
