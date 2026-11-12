# Superseded lines from `src/experiments/EXPERIMENTS.md`

[2026-11-12 23:24 SGT] Moved word for word from [`src/experiments/EXPERIMENTS.md`](../../src/experiments/EXPERIMENTS.md) on 2026-11-12 (owner approved: "shorten all the long md files"). Each line keeps its own date and SUPERSEDED marker; the heading above each group is where it sat. Nothing was reworded.

## Under: Experiments

SUPERSEDED [2026-10-31 19:09 SGT]: The single place where experiments are defined. The nudge engine reads its experiment settings from this file (see `docs/SPEC.md`, Constraints, Experiments). There is no admin screen: to start, stop or change an experiment, edit this file.

## Under: Experiments > How experiments work

- SUPERSEDED [2026-10-31 19:09 SGT] (now rule 11.6 in src/experiments/SPEC.md) [2026-10-24 18:26 SGT] When a parent first meets an experiment, they are randomly assigned to one variant and stay in it for the life of the experiment (sticky assignment), so results are not mixed up.
- SUPERSEDED [2026-11-09 00:10 SGT] [2026-10-31 19:09 SGT] Correction: the metrics file is now `src/telemetry/Family_Habit_App_Success_Metrics.xlsx`.
- SUPERSEDED [2026-10-31 19:20 SGT] (path corrected above) [2026-10-24 18:26 SGT] Outcomes are compared with the metrics in `docs/Family_Habit_App_Success_Metrics.xlsx` (for example, metric 8, nudge-to-action rate, split by variant).

## Under: Experiments > Starting values (hypotheses, from `docs/SPEC.md`)

- SUPERSEDED [2026-10-31 19:06 SGT] [2026-10-31 18:00 SGT] Trial length (D9, rule 10.3): 5 full weeks per family from its first full Monday; 5 to 10 friends' families.
- SUPERSEDED [2026-11-09 18:16 SGT] [2026-10-31 17:53 SGT] Weekly Wrap Up (rule 3.12): Sunday, default 8:00pm, on by default; the parent can change the time (any 30-minute block, 7:00am to 9:30pm) or turn it off. Not a nudge message: no slot, not counted toward the 3-a-day cap. In `src/settings.ts` (`WEEKLY_WRAP_UP_WEEKDAY`, `DEFAULT_WEEKLY_WRAP_UP`). Possible future experiment: another day or default time.
- SUPERSEDED [2026-10-31 19:09 SGT] (rule 1.4: the code holds the values, this file describes them) [2026-10-31 18:59 SGT] The code's copy of these values is `src/settings.ts` (moved from `shared/` on 31 Oct). Change both together; a test checks the choice limits.
- SUPERSEDED [2026-10-31 18:59 SGT] [2026-10-25 06:25 SGT] The code's copy of these values is `shared/settings.ts`. Change both together; a test checks the choice limits.
- [2026-10-24 18:26 SGT] SUPERSEDED [2026-10-29 20:58 SGT] (spec v1.8: no random surprise bonus) Surprise bonus rate: 20% of logged actions
- [2026-10-24 18:26 SGT] SUPERSEDED [2026-10-24 22:18 SGT] Quick actions: parent picks every day or every 2 days. Hidden ideal 1 per day, floor 1 per 2 days.

## Under: Experiments > Experiment variables (parked)

- SUPERSEDED [2026-10-31 18:59 SGT] Which nudges start unlocked (now 6 of 9), and how an unlock is earned
