# Nudge engine: module spec

[2026-10-31 09:43 SGT] The **current rules** of the Nudge engine module (the "brain": what a parent picks, and when and what to nudge). Each rule keeps its permanent rule ID; IDs are never renumbered or reused. The dated history of how each rule was decided is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md). Cross-cutting rules 1.1 to 1.3 (users, Singapore time, no fallbacks) live in the master spec.

## Purpose
[2026-10-31 09:43 SGT] Decide, for each parent and moment, whether to send a nudge message and about which of their chosen behaviours, within the guardrails below. Two halves:
- **Decisions** (built): picks, slots and schedules, what is due, priority.
- **Words** (not built yet): Claude writes the nudge message, guided by [NUDGE-CONTEXT.md](NUDGE-CONTEXT.md) (the app's own AI personality; not instructions for Claude Code).

## Code in this folder
- [2026-10-31 09:43 SGT] `choices.ts`: checks a parent's picks (rules 2.1 to 2.3).
- [2026-10-31 09:43 SGT] `schedule.ts`: school or non-school day; checks slots; which times the setup screen greys out (rules 3.1 to 3.3).
- [2026-10-31 09:43 SGT] `due.ts`: is a behaviour still to do (rules 2.4, 3.7).
- [2026-10-31 09:43 SGT] `planner.ts`: the decision "send a nudge about X now" or "don't send", with the reason (rules 3.4 to 3.11).
- Uses: the [Nudge repository](../nudge-repository/SPEC.md) (nudge rows), and the cross-cutting files `src/settings.ts` (numbers, mirrored in [docs/EXPERIMENTS.md](../../docs/EXPERIMENTS.md)) and `src/sgt.ts` (Singapore time).

## Rules at a glance
2.1 limits · 2.2 active and unlocked · 2.3 frequencies · 2.4 nudge only while due · 3.1 slots · 3.2 two schedules · 3.3 defaults · 3.4 caps · 3.5 Done / Not today · 3.6 when nothing is sent · 3.7 due · 3.8 priority · 3.9 rest after 7 days · 3.10 deliberate on Friday and Sunday · 3.11 any slot, Claude adds context

## Rules: what a parent picks
- **2.1** Up to **2 quick and 1 deliberate** behaviour, at least 1 in total. *(decided 25 Oct)* Tested by: tests/nudge-engine-choices.test.ts
- **2.2** Only **active** and **unlocked** nudges can be picked. **In the MVP all 9 start unlocked** (unlocks are out of the MVP); the "starts unlocked" setting stays on each nudge for later. *(decided 25 Oct, changed 29 Oct)* Tested by: tests/nudge-engine-choices.test.ts (locked and retired nudges), tests/nudge-repository-first-load.test.ts (all 9 unlocked)
- **2.3** Quick: **every day** or **every 2 days**. Deliberate: **1 or 2 times a week**, at most 2 in total. *(decided 24 Oct)* Tested by: tests/nudge-engine-choices.test.ts
- **2.4** The frequency is how often the parent wants to **do** it. We only nudge while it is still undone ("due"). *(decided 28 Oct)* Tested by: tests/nudge-engine-due.test.ts, tests/nudge-engine-planner.test.ts

## Rules: when and what to nudge
- **3.1** **Nudge slots:** 30-minute blocks the parent picks, from 7:00am to the last one at 9:30pm. Up to **3 per schedule**, at least **1 hour apart**, at least **1 in total**. Slots are shared by all the parent's behaviours. *(decided 28 Oct)* Tested by: tests/nudge-engine-schedule.test.ts, tests/nudge-engine-planner.test.ts (sharing)
- **3.2** **Two schedules:** school days (Monday to Friday, not a public or MOE school holiday) and non-school days (everything else). *(decided 28 Oct)* Tested by: tests/nudge-engine-schedule.test.ts, tests/nudge-engine-planner.test.ts (public holiday)
- **3.3** **Defaults** (pre-selected, one tap to keep): school days **7:00am, 7:00pm, 9:00pm**; non-school days **9:00am, 12:30pm, 7:00pm**. *(decided 28 Oct)* Tested by: tests/nudge-engine-schedule.test.ts
- **3.4** At most **1 nudge message per slot** and **3 a day**. Replies never count. *(decided 28 Oct)* Tested by: tests/nudge-engine-planner.test.ts
- **3.5** Every nudge message has **✅ Done** and **😴 Not today**. Not today = no more that day, back tomorrow, no penalty; tracked as its own event. *(decided 28 Oct)* Tested by: tests/nudge-engine-planner.test.ts (the "Not today" effect). The buttons themselves and the event are not built yet (Telegram bot, Telemetry).
- **3.6** Nothing is sent when: paused, Not today, nothing due, or the behaviour was just logged (re-checked right before sending). *(decided 28 Oct)* Tested by: tests/nudge-engine-planner.test.ts. The sender that re-checks is not built yet.
- **3.7** **Due:** every day = not logged today; every 2 days = not logged today or yesterday; deliberate = fewer logs this week than chosen. *(decided 28 Oct)* Tested by: tests/nudge-engine-due.test.ts
- **3.8** **Priority:** quick behaviours not logged for 2+ days first (longest first), then other quick, then deliberate; ties go to the one picked first. Each behaviour at most once a day. *(decided 28 Oct)* Tested by: tests/nudge-engine-planner.test.ts
- **3.9** A quick behaviour logged **7 days in a row** is nudged only every other day. *(decided 28 Oct)* Tested by: tests/nudge-engine-planner.test.ts
- **3.10** **Deliberate** behaviours are nudged on **Friday** (planning for the weekend) and **Sunday** (only if still due). *(decided 28 Oct)* Tested by: tests/nudge-engine-planner.test.ts
- **3.11** Any behaviour can go in any slot; **Claude adds the time-of-day context** to the words. *(decided 28 Oct)* Tested by: tests/nudge-engine-planner.test.ts (any slot). The words half is not built yet.
