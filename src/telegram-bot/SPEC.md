# Telegram bot: module spec

[2026-10-31 10:12 SGT] The **current rules** of the Telegram bot module: the chat with the parent. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:12 SGT] The parent's main way in: receives nudge messages with ✅ Done and 😴 Not today (rule 3.5, owned by the [Nudge engine](../nudge-engine/SPEC.md)), lets the parent log any time, and passes photos to the [Photo check](../photo-check/SPEC.md). It is a **thin layer**: the decisions live in the Nudge engine, and the data in the [Datastore](../datastore/SPEC.md). Telegram is reached with plain web requests (no Telegram library), through a thin web address in `api/` (rule S3).

## Code in this folder
- [2026-10-31 10:12 SGT] None yet (development order, step 3).

## Rules at a glance
5.1 log any time · 5.3 optional description (the Investment) · 5.4 unchosen, late and repeat logs · 3.14 Weekly Wrap Up on the setup screen

## Rules
- **5.1** Parents can log **any time**: tap ✅ Done on a nudge message, a "Log something" button, or free text Claude understands. *(decided 28 Oct)* Not yet tested (nothing built).
- **5.3** Optional **description** (up to 280 characters) = the Hooked "Investment". Over 280: the bot asks to shorten it. Shown in the web app and snapshot, and given to Claude for future nudges. *(decided 24 Oct)* Not yet tested (nothing built; the 280 limit per nudge is checked by the Nudge repository tests).
- **5.4** Logging a behaviour not chosen: **accepted with thanks**, doesn't count toward targets. Logging late: **back to yesterday only**. Twice in a day: counts once for targets and streaks, but **should still be celebrated (WIP)**. *(decided 28 Oct)* Tested by: tests/nudge-engine-due.test.ts and tests/nudge-engine-planner.test.ts (how such logs affect what is due). The bot side (accepting, thanking, refusing older dates) is not built yet.
- **3.14** [2026-10-31 17:52 SGT] The **setup screen** shows the Weekly Wrap Up as a visible setting: "Weekly Wrap Up: Sunday at [time] [change] [turn off]" (rule 3.12), so the parent stays in control (rule 2.1). *(decided 31 Oct)* Not yet tested (nothing built).
