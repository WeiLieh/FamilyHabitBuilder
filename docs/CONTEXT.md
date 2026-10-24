# Context: current state of the project

## Purpose
- [2026-10-24 17:39 SGT] Build the Family Habit App MVP (Minimum Viable Product) described in `docs/SPEC.md`: a Telegram bot plus a web page that nudge parents of children aged 7 to 12 to build habits that strengthen family bonds. Also a learning project for the product manager.

## How to run and test
- [2026-10-24 21:19 SGT] First time: `npm install`. Then `npm run check` runs, in order: `npm run typecheck` (TypeScript checks every file), `npm test` (Vitest runs everything in `tests/`) and `npm run build` (compiles `api/` and `shared/` into `dist/`, which Git ignores). Any failure stops the chain.
- [2026-10-24 21:19 SGT] GitHub Actions (`.github/workflows/check.yml`) runs `npm ci` and `npm run check` on Node.js 24 for every pull request and every push to `main`.
- [2026-10-24 21:19 SGT] Secrets: copy `.env.example` to `.env` for local use (Git ignores `.env`). Real values live in Vercel only.
- [2026-10-24 18:47 SGT] Package manager: npm, with `package-lock.json` as the only lockfile. Runtime: Node.js.
- [2026-10-24 18:47 SGT] Check command (run before every commit): `npm run check` = type check, then tests (Vitest), then build. Same as the SG Weather project. Exact scripts are written when the project skeleton is set up.
- [2026-10-24 17:39 SGT] Not decided yet. The check command (type check, tests and build) is picked together with the technology stack. SUPERSEDED [2026-10-24 18:47 SGT]

## Architecture summary
- [2026-10-24 21:19 SGT] Folder layout (same pattern as SG Weather):
  - `api/`: Vercel functions, one file per web address. Kept thin. Helpers go in `api/_...` folders (Vercel does not expose folders starting with `_`).
  - `shared/`: the brain and other logic, with no direct web calls, so it can be tested on its own.
  - `tests/`: Vitest tests.
  - `docs/`: project memory files.
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
  - **Regions:** Supabase in Singapore, so stored family data stays in Singapore. Vercel functions stay in Washington, D.C. (Vercel's default), the owner's choice. Trade-off: each database call travels Singapore to Washington and back, so bot replies may be slightly slower; data passes through the US while being processed (it also does when sent to Claude). Can be moved to Singapore later in Vercel settings.
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
