# Superseded lines from `docs/CONTEXT.md`

[2026-11-12 23:24 SGT] Moved word for word from [`docs/CONTEXT.md`](../CONTEXT.md) on 2026-11-12 (owner approved: "shorten all the long md files"). Each line keeps its own date and SUPERSEDED marker; the heading above each group is where it sat. Nothing was reworded.

## Under: Context: current state of the project > How to run and test

- [2026-10-24 17:39 SGT] Not decided yet. The check command (type check, tests and build) is picked together with the technology stack. SUPERSEDED [2026-10-24 18:47 SGT]

## Under: Context: current state of the project > Architecture summary

  - SUPERSEDED [2026-10-31 19:20 SGT] (numbers now live once in `src/settings.ts`, rule 1.4; nothing is mirrored) `shared/settings.ts`: starting values (choice limits, 2 deliberate times a week in total), mirrored from `docs/EXPERIMENTS.md`. [2026-10-31 18:59 SGT] Now `src/settings.ts` (moved 31 Oct).
  - SUPERSEDED [2026-10-25 06:59 SGT] Supabase `nudges` table columns (planned, used by the tests): `id`, `name`, `category`, `example_1` to `example_5`, `self_report_allowed`, `description_max_chars`, `photo_upload_allowed`, `photo_idea`.
- [2026-10-24 17:39 SGT] Not decided yet. Waiting for spec clarifications and the technology stack choice. SUPERSEDED [2026-10-24 18:47 SGT]

## Under: Context: current state of the project > Key decisions and why

  - **Regions:** SUPERSEDED [2026-10-24 21:24 SGT] Supabase in Singapore, so stored family data stays in Singapore. Vercel functions stay in Washington, D.C. (Vercel's default), the owner's choice. Trade-off: each database call travels Singapore to Washington and back, so bot replies may be slightly slower; data passes through the US while being processed (it also does when sent to Claude). Can be moved to Singapore later in Vercel settings.
- [2026-10-24 18:47 SGT] **Pending owner approval** (proposed with the stack, not yet agreed): SUPERSEDED [2026-10-24 18:50 SGT]
  - **Scheduler:** Supabase Cron, because Vercel's free scheduler runs at most once a day and nudges need 3 moments a day.
  - **GitHub Actions** to run `npm run check` automatically on every pull request (free).
  - **Singapore regions** for Vercel functions and Supabase, to keep family data in Singapore (a likely PDPA reviewer question).
  - **How database changes are applied:** SQL files kept in the repo and run by the owner in the Supabase dashboard (no extra tool), or the Supabase command-line tool.
  - **A monthly spend limit** set in the Anthropic Console, as in Haze Uncle.

## Under: Context: current state of the project > Approved libraries

- [2026-10-24 18:47 SGT] Package manager: npm (one lockfile, `package-lock.json`). Tools approved as part of the stack: TypeScript, Vitest. Exact library list still to be approved (see Key decisions, pending items). SUPERSEDED [2026-10-24 18:50 SGT]
- [2026-10-24 17:39 SGT] None yet. Package manager and lockfile to be chosen with the technology stack. SUPERSEDED [2026-10-24 18:47 SGT]

## Under: Context: current state of the project > Git and release workflow

- [2026-10-24 17:39 SGT] GitHub repository: https://github.com/weilieh/familyhabitbuilder (confirm with the product manager). SUPERSEDED [2026-10-24 18:26 SGT]
