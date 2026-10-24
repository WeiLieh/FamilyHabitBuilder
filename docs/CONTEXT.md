# Context: current state of the project

## Purpose
- [2026-10-24 17:39 SGT] Build the Family Habit App MVP (Minimum Viable Product) described in `docs/SPEC.md`: a Telegram bot plus a web page that nudge parents of children aged 7 to 12 to build habits that strengthen family bonds. Also a learning project for the product manager.

## How to run and test
- [2026-10-24 17:39 SGT] Not decided yet. The check command (type check, tests and build) is picked together with the technology stack.

## Architecture summary
- [2026-10-24 17:39 SGT] Not decided yet. Waiting for spec clarifications and the technology stack choice.

## Key decisions and why
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
- [2026-10-24 17:39 SGT] None yet. Package manager and lockfile to be chosen with the technology stack.

## UI decisions
<!-- Empty until the product manager supplies the look. -->

## Git and release workflow
- [2026-10-24 18:26 SGT] GitHub repository: https://github.com/weilieh/familyhabitbuilder (confirmed by the product manager).
- [2026-10-24 17:39 SGT] GitHub repository: https://github.com/weilieh/familyhabitbuilder (confirm with the product manager). SUPERSEDED [2026-10-24 18:26 SGT]
- [2026-10-24 17:39 SGT] Never work on `main`. One branch per task. Merge into `main` only through a pull request, after the product manager approves.
- [2026-10-24 17:39 SGT] Current working branch: `claude/festive-einstein-nf623s`.

## Glossary (terms and acronyms)
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
