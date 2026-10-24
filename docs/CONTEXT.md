# Context: current state of the project

## Purpose
- [2026-10-24 17:39 SGT] Build the Family Habit App MVP (Minimum Viable Product) described in `docs/SPEC.md`: a Telegram bot plus a web page that nudge parents of children aged 7 to 12 to build habits that strengthen family bonds. Also a learning project for the product manager.

## How to run and test
- [2026-10-24 17:39 SGT] Not decided yet. The check command (type check, tests and build) is picked together with the technology stack.

## Architecture summary
- [2026-10-24 17:39 SGT] Not decided yet. Waiting for spec clarifications and the technology stack choice.

## Key decisions and why
- [2026-10-24 17:39 SGT] Project memory files created in `docs/` (plus `CLAUDE.md` at the root), so each new session can pick up where the last one stopped.

## Approved libraries
- [2026-10-24 17:39 SGT] None yet. Package manager and lockfile to be chosen with the technology stack.

## UI decisions
<!-- Empty until the product manager supplies the look. -->

## Git and release workflow
- [2026-10-24 17:39 SGT] GitHub repository: https://github.com/weilieh/familyhabitbuilder (confirm with the product manager).
- [2026-10-24 17:39 SGT] Never work on `main`. One branch per task. Merge into `main` only through a pull request, after the product manager approves.
- [2026-10-24 17:39 SGT] Current working branch: `claude/festive-einstein-nf623s`.

## Glossary (terms and acronyms)
- [2026-10-24 17:39 SGT] **MVP (Minimum Viable Product):** the smallest version that is good enough to test with real users.
- [2026-10-24 17:39 SGT] **XP (Experience Points):** points a parent earns for logged actions; they add up to levels.
- [2026-10-24 17:39 SGT] **Triple P (Positive Parenting Program):** the parenting programme the 9 actions come from.
- [2026-10-24 17:39 SGT] **Hooked model:** Nir Eyal's habit loop: Trigger, Action, Variable Reward, Investment.
- [2026-10-24 17:39 SGT] **SGT (Singapore Time):** UTC+08:00, used for all date/time prefixes.
- [2026-10-24 17:39 SGT] **PR (Pull Request):** a request to merge a branch into `main`, where changes are reviewed first.
- [2026-10-24 17:39 SGT] **TDD (Test-Driven Development):** writing the tests before the code.
