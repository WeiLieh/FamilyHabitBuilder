# Variable rewards: module spec

[2026-10-31 10:05 SGT] The **current, agreed rules** of the Variable rewards module (what parents get after logging). Rule IDs are permanent. The working design, with the reasoning, the universe of rewards and the decisions still open (D5 to D10), is in [DESIGN.md](DESIGN.md). The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md). The owner's original v0.1 rewards spec is history: `docs/archive/variable-rewards-spec-v0.1-original.md`.

## Purpose
[2026-10-31 10:05 SGT] Make logging a bonding moment feel noticed and worthwhile without turning family time into points: rewards are **informational** ("here is what you did"), never **controlling** ("do this to earn points").

## Code in this folder
- [2026-10-31 10:05 SGT] None yet. Design in progress; building comes at step 4 of the development order.
- Will use: the [Nudge engine](../nudge-engine/SPEC.md) and the [Datastore](../datastore/SPEC.md) (log history), per the arrows in [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).

## Rules at a glance
7.1 MVP rewards · 7.2 no XP or levels; special reply for unprompted logs · 7.3 weekly streaks · 7.4 full design still needed · 7.5 receipt, then Claude's reply · 7.6 steady week

## Rules
- **7.1** **MVP rewards** (from [DESIGN.md](DESIGN.md)): 1 validation reply after each log, 2 varied ideas (surprise), 3 weekly streak, 4 one-tap logging, 6 family memory album **including weekly and monthly snapshots**, 10 three milestone badges. Unlocks are out of the MVP. Details under review (D5 to D10 open). *(decided 24 Oct, changed 29 Oct)* Not yet tested (nothing built).
- **7.2** **No XP or levels in the MVP** (D1). No random surprise bonus either. An **unprompted log** (rule 5.2) gets a **special validation reply** noticing the parent did it on their own. *(decided 24 Oct, changed 29 Oct)* Not yet tested (nothing built).
- **7.3** **Streaks are weekly** (D3): one unit for everyone, the week (Monday to Sunday). The headline is "days this week"; the streak counts **steady weeks** (rule 7.6), in total and in a row. A short week never gets a "broken streak" message. No repair pass in the MVP. Replaces the earlier per-behaviour streaks. *(decided 24 Oct, changed 29 Oct)* Not yet tested (nothing built).
- **7.4** **Variable rewards need a full design session:** every reward category needs its rules, its content and its variety (parked in docs/PRODUCT-BACKLOG.md; in progress in DESIGN.md). *(decided 29 Oct)* Not yet tested (a design task, not code).
- **7.5** **Validation reply after every log** (D2): first an honest **receipt** ("✅ Saved: Showing affection, today."), then a warm reply **written by Claude** naming what the parent did. If Claude fails, the receipt stands and the failure is recorded. Replies never count toward the 3-a-day cap. *(decided 29 Oct)* Not yet tested (nothing built; the cap part is covered by the Nudge engine's rule 3.4 tests).
- **7.6** **Steady week** (D4) = every behaviour the parent chose met its weekly bar, with some slack: every day = 6 of 7 days; every 2 days = 3 days; deliberate once a week = 1; twice a week = 2. The week a parent joins doesn't count against them (their streak starts with their first full week). Picks in place on Sunday are the ones judged. *(decided 29 Oct; bars are starting values, tune after the trial)* Not yet tested (nothing built).
