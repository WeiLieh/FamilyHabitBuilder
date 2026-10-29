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
- [2026-10-24 18:26 SGT] SUPERSEDED [2026-10-29 20:58 SGT] (spec v1.8: no random surprise bonus) Surprise bonus rate: 20% of logged actions
- [2026-10-24 22:18 SGT] Quick nudges (4): parent picks every day or every 2 days for each. Hidden ideal 1 per day, floor 1 per 2 days. Deliberate nudges (5, including spending quality time): 1 or 2 per week in total. Hidden ideal 1 per week, no floor.
- [2026-10-24 18:26 SGT] SUPERSEDED [2026-10-24 22:18 SGT] Quick actions: parent picks every day or every 2 days. Hidden ideal 1 per day, floor 1 per 2 days.
- [2026-10-24 18:26 SGT] Deliberate actions: 1 or 2 per week in total. Hidden ideal 1 per week, no floor.
- [2026-10-24 18:26 SGT] Streak gap allowed (quick actions): up to 2 missed days in a row

## Experiment variables (parked)
- [2026-10-29 22:37 SGT] Added: steady-week bars (every day 6 of 7; every 2 days 3; deliberate as chosen), rule 7.6.
[2026-10-29 20:58 SGT] Everything in the app that an experiment could change, so we remember them when we design the experiment module. Nothing here is decided; current values are in "Starting values" above and `shared/settings.ts`.

**Nudge timing (Nudge engine)**
- Number of slots per schedule (now up to 3) and the default slot times (now 7:00am, 7:00pm, 9:00pm; 9:00am, 12:30pm, 7:00pm)
- Whether defaults are pre-selected at setup, or the parent picks from scratch
- Slot length (30 min), minimum gap between slots (1 hour), slot range (7:00am to 9:30pm)
- Daily cap on nudge messages (3)
- Which days deliberate behaviours are nudged (Friday and Sunday), and how many times a week (2)
- Rest rule after a streak (7 days in a row, then every other day)
- Priority order (below the floor first, then quick, then deliberate)
- Timing within a slot (at the start, or a random minute inside it)

**Nudge message (Nudge engine, words half)**
- Personality and tone (warm, playful, coach-like...), length, use of emoji
- Whether the message includes an example, one example or a choice of two
- Whether it uses the parent's own context (their past descriptions, child's interests)
- Framing: plan ahead ("this evening, try...") vs do now ("right now, try...")
- The Claude model used to write it (cost vs quality)

**What a parent picks**
- Limits: how many quick and deliberate behaviours (now 2 + 1)
- Which nudges start unlocked (now 6 of 9), and how an unlock is earned
- Frequencies offered (every day / every 2 days; 1 or 2 times a week)
- Hidden ideal and floor values

**Rewards (Variable rewards, not yet designed)**
- XP per log (quick vs deliberate), and the unprompted multiplier (now 2x)
- Level thresholds
- Badge types and criteria
- Encouraging phrase sets and how often they appear
- Progress bar style and criteria
- Streak rules (now: quick streak survives up to 2 missed days)
- Snapshot timing (weekly and monthly: which day, which time)
- Any random element (the 20% surprise was dropped; it could return as an experiment)

**Logging and buttons (Telegram bot)**
- Button wording ("Done" / "Not today")
- Whether to prompt for a photo, a description, both or neither
- How the bot thanks the parent after a log

**Experiment mechanics: open questions (parked, Batch 3 questions 3 to 5)**
- Where experiment settings live: a code file changed by pull request, or a Supabase table the owner edits
- When parents are assigned to a group (when an experiment starts? at sign-up?) and whether they stay in it
- How many groups per experiment, and the first experiment to run (suggested: none at launch, start after 2 weeks of data)

## Active experiments
- [2026-10-24 18:26 SGT] None yet.

## Finished experiments
- [2026-10-24 18:26 SGT] None yet.
