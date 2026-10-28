# Experiments

The single place where experiments are defined. The nudge engine reads its experiment settings from this file (see `docs/SPEC.md`, Constraints, Experiments). There is no admin screen: to start, stop or change an experiment, edit this file.

## How experiments work
- [2026-10-24 18:26 SGT] Each experiment tests one thing (for example, a nudge wording, a reward or the surprise rate) by giving different **variants** to different parents.
- [2026-10-24 18:26 SGT] When a parent first meets an experiment, they are randomly assigned to one variant and stay in it for the life of the experiment (sticky assignment), so results are not mixed up.
- [2026-10-24 18:26 SGT] Outcomes are compared with the metrics in `docs/Family_Habit_App_Success_Metrics.xlsx` (for example, metric 8, nudge-to-action rate, split by variant).
- [2026-10-24 18:26 SGT] The exact format the code reads is agreed once the technology stack is chosen.

## Starting values (hypotheses, from `docs/SPEC.md`)
- [2026-10-28 22:23 SGT] Nudge slots: 30-minute blocks from 7:00am to 9:30pm (last start), up to 3 per schedule, at least 1 hour apart, at least 1 in total. Defaults: school days 7:00am, 7:00pm, 9:00pm; non-school days 9:00am, 12:30pm, 7:00pm.
- [2026-10-28 22:23 SGT] Deliberate behaviours are nudged on Friday (planning) and Sunday (only if still due). Possible future experiment: other patterns (e.g. a midweek nudge).
- [2026-10-28 22:23 SGT] A quick behaviour logged on each of the last 7 days is nudged only if it was not nudged yesterday.
- [2026-10-25 06:25 SGT] The code's copy of these values is `shared/settings.ts`. Change both together; a test checks the choice limits.
These apply to everyone who is not in an experiment that changes them.
- [2026-10-24 22:18 SGT] Choice limits: up to 2 quick and up to 1 deliberate behaviour at a time; at least 1 in total. Choosing more is an unlock (rule WIP).
- [2026-10-24 18:26 SGT] Maximum nudges per day: 3
- [2026-10-24 18:26 SGT] Surprise bonus rate: 20% of logged actions
- [2026-10-24 22:18 SGT] Quick nudges (4): parent picks every day or every 2 days for each. Hidden ideal 1 per day, floor 1 per 2 days. Deliberate nudges (5, including spending quality time): 1 or 2 per week in total. Hidden ideal 1 per week, no floor.
- [2026-10-24 18:26 SGT] SUPERSEDED [2026-10-24 22:18 SGT] Quick actions: parent picks every day or every 2 days. Hidden ideal 1 per day, floor 1 per 2 days.
- [2026-10-24 18:26 SGT] Deliberate actions: 1 or 2 per week in total. Hidden ideal 1 per week, no floor.
- [2026-10-24 18:26 SGT] Streak gap allowed (quick actions): up to 2 missed days in a row

## Active experiments
- [2026-10-24 18:26 SGT] None yet.

## Finished experiments
- [2026-10-24 18:26 SGT] None yet.
