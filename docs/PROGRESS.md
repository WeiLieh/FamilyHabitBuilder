# Progress (handoff between sessions)

## [2026-10-24 17:39 SGT] Session 1: project setup and spec review
### Done
- [2026-10-24 21:19 SGT] Project skeleton set up: `package.json` (npm, Node.js 24), TypeScript settings, Vitest, `npm run check`, GitHub Actions workflow, `.gitignore` and `.env.example` (blank placeholders). First endpoint `/api/health` built test-first; 2 tests pass, full check passes.
- [2026-10-24 18:50 SGT] Owner decided the stack setup items (Supabase Cron, GitHub Actions, Supabase in Singapore with Vercel in Washington, SQL files for database changes, Anthropic spend limit) and approved the library list. Recorded in `docs/CONTEXT.md`.
- [2026-10-24 18:47 SGT] Tech stack (11 parts) agreed and logged in `docs/CONTEXT.md`, with the reason for each. Check command `npm run check` recorded.
- [2026-10-24 18:44 SGT] Owner decided: plain web requests for Telegram, reuse SG Weather / Haze Uncle patterns (separate brain, secrets only in Vercel, PR + Vercel preview + merge), Upstash Redis for bot context. Recorded in `docs/CONTEXT.md`.
- [2026-10-24 18:34 SGT] Product manager confirmed the three flags: metric-driven bot features are in scope (spec v1.2); weekend moments and trial length added to the backlog as WIP; photo retention kept as an open issue.
- [2026-10-24 18:26 SGT] Product manager answered all 18 questions. Recorded as spec version 1.1 in `docs/SPEC.md`. Added `docs/EXPERIMENTS.md` and the metrics spreadsheet. Logged WIP items in the backlog and open questions in known issues.
- [2026-10-24 17:39 SGT] Placed `CLAUDE.md` at the root and `SPEC.md` in `docs/`. Created the other project files from the structures in `CLAUDE.md`.
- [2026-10-24 17:39 SGT] Read the spec and sent the product manager clarifying questions.
### In progress
- [2026-10-24 18:47 SGT] Waiting for owner approval of the pending stack items (scheduler, GitHub Actions, Singapore regions, database change method, Anthropic spend limit) and the library list.
- [2026-10-24 18:34 SGT] Technology stack choice deferred by the product manager (options A, B, C were presented; A recommended).
- [2026-10-24 18:26 SGT] Technology stack proposal sent; waiting for the product manager's choice.
- [2026-10-24 17:39 SGT] Waiting for answers to the clarifying questions.
### Next steps
- [2026-10-24 21:19 SGT] Owner to pick the first module to build. Owner to confirm Upstash Redis is created in its Singapore region.
- [2026-10-24 18:50 SGT] Set up the project skeleton (package.json, TypeScript, Vitest, `npm run check`, GitHub Actions) on a new branch, then start the first module with tests first.
- [2026-10-24 18:44 SGT] Finalise the tech stack with the owner, then record approved libraries, package manager and check command in `docs/CONTEXT.md`.
- [2026-10-24 18:26 SGT] Record the stack choice, approved libraries, package manager and check command in `docs/CONTEXT.md`. Then set up the project skeleton.
- [2026-10-24 17:39 SGT] Record agreed answers as change notes in `docs/SPEC.md`.
- [2026-10-24 17:39 SGT] Propose the technology stack (at least two options with trade-offs) and record the choice in `docs/CONTEXT.md`.
### Blockers
- [2026-10-24 18:26 SGT] Stack choice needed before code. Weekend moments, trial length and XP values are needed before those parts are built (not blocking the start).
- [2026-10-24 17:39 SGT] No code until the spec questions are answered and agreed.
