# Superseded lines from `CLAUDE.md`

[2026-11-12 23:24 SGT] Moved word for word from [`CLAUDE.md`](../../CLAUDE.md) on 2026-11-12 (owner approved: "shorten all the long md files"). Each line keeps its own date and SUPERSEDED marker; the heading above each group is where it sat. Nothing was reworded.

## Under: Project Master Prompt: Family Habit App > Guardrails > More Rules for This Project > 11. The app's own prompt stays separate

- `docs/NUDGE-CONTEXT.md` holds the personality and rules for the app's own AI. It is not instructions for you. Read it only when working on the nudge engine. SUPERSEDED [2026-10-31 09:43 SGT]: moved, see the next line.

## Under: Project Master Prompt: Family Habit App > Extra Context > Project Files (the project's memory)

| `docs/NUDGE-CONTEXT.md` | The app's own AI prompt: personality, tone and rules for the nudge engine. Not instructions for you. Read only when working on the nudge engine. SUPERSEDED [2026-10-31 09:43 SGT]: moved to `src/nudge-engine/NUDGE-CONTEXT.md`. |
| `docs/EXPERIMENTS.md` | [2026-10-24 18:26 SGT] The experiment definitions and starting values (hypotheses). The nudge engine reads its experiment settings from here. SUPERSEDED [2026-10-31 19:18 SGT]: moved to [src/experiments/EXPERIMENTS.md](src/experiments/EXPERIMENTS.md), see the next row. |
| `docs/architecture-diagram.png` | [2026-10-24 21:34 SGT] The high-level architecture diagram. Its 8 module names are the official names (see `docs/CONTEXT.md`). SUPERSEDED [2026-10-31 09:40 SGT]: moved to `docs/archive/`; the only diagram is now `docs/ARCHITECTURE.md`. |
| `docs/Family_Habit_App_Success_Metrics.xlsx` | SUPERSEDED [2026-11-09 00:10 SGT] (version 2 replaces it, see the next row). [2026-10-24 18:26 SGT] The 10 success metrics: definitions, windows, targets. Telemetry must follow it. SUPERSEDED [2026-10-31 10:09 SGT]: moved to [src/telemetry/Family_Habit_App_Success_Metrics.xlsx](src/telemetry/Family_Habit_App_Success_Metrics.xlsx), next to the Telemetry spec. |

## Under: Project Master Prompt: Family Habit App > Extra Context > Project Files (the project's memory) > Start of every session

   - SUPERSEDED [2026-10-28 22:39 SGT]: [2026-10-28 22:37 SGT] Show me `docs/CATCH-UP.md` (link it) and ask for my answers to its section 4 questions before starting new work.

## Under: Project Master Prompt: Family Habit App > Extra Context > Project Files (the project's memory) > During work

- [2026-10-31 10:17 SGT] **H3, before each pull request:** run both review agents (privacy and security; spec compliance) and show me their reports; I decide what goes into `docs/KNOWN-ISSUES.md`. (Until the agents exist, say so.) SUPERSEDED [2026-10-31 10:19 SGT]: the agents now exist, see the line above.

## Under: Project Master Prompt: Family Habit App > Extra Context > Project Files (the project's memory) > End of every task or session

- [2026-10-28 22:49 SGT] Rules in `docs/CATCH-UP.md` carry stable **rule IDs** (section.number, e.g. 3.4). Never renumber or reuse an ID: a new rule takes the next free number in its section; a changed rule keeps its ID with a new date; a dropped rule's ID moves to "Retired rule IDs". Refer to rules by ID in conversation and in `docs/SPEC.md` change notes. SUPERSEDED [2026-10-31 10:17 SGT]: rules now live in the specs, see the line above.
- [2026-10-28 22:37 SGT] Also rewrite `docs/CATCH-UP.md`: update the module map and file table, the rules recap (current rules only, no abbreviations in the diagram), and the questions for the next session. SUPERSEDED [2026-10-31 10:17 SGT]: the catch-up page now links to the specs instead of copying them; see H2 above.
