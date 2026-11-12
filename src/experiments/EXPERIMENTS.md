# Experiments

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/experiments-EXPERIMENTS-superseded.md](../../docs/archive/experiments-EXPERIMENTS-superseded.md) to keep this file short (owner approved).

[2026-10-31 19:18 SGT] **Moved** from `docs/EXPERIMENTS.md` to this folder, next to the module's rules ([SPEC.md](SPEC.md)), on the owner's decision.

[2026-10-31 19:06 SGT] **What this file is now:** a plain-English description of the experiments we might run and the starting values, for the owner. The **numbers live once, in code** (`src/settings.ts`, rule 1.4), and the rules for running experiments are in the Experiments module, [src/experiments/SPEC.md](SPEC.md). The paragraph below is history (marked SUPERSEDED).

## How experiments work
- [2026-10-24 18:26 SGT] Each experiment tests one thing (for example, a nudge wording, a reward or the surprise rate) by giving different **variants** to different parents.
- [2026-11-09 00:10 SGT] Correction: the metrics file is now `src/telemetry/Family_Habit_App_Success_Metrics_v2.xlsx` (version 1 deprecated, in `docs/archive/`).
- [2026-10-24 18:26 SGT] The exact format the code reads is agreed once the technology stack is chosen.

## The 31 values (agreed 1 Nov)
- [2026-11-12 23:07 SGT] Values 40 and 41 added (onboarding screens, pull request 2), so **40 values are in use**.
- [2026-11-12 22:17 SGT] Values 37 to 39 added (onboarding, migration 007), so **38 values are in use**.
- [2026-11-11 18:14 SGT] Values 35 and 36 added (thin slice 1), so **35 values are in use**.
- [2026-11-11 17:28 SGT] Values 32 to 34 added (the three time windows), so **33 values are in use** (value 30 is retired).
- [2026-11-09 18:16 SGT] Value 30 retired on 9 Nov (the Wrap Up's own switch removed), so **30 values are in use**; numbers are never reused.
- [2026-11-01 16:07 SGT] Every value in the app an experiment could touch, with its **kind** (rule 1.4): **Tuneable** (a number that can be tested higher or lower), **Named style** (a choice between reviewed wordings or tones), **Named rule** (a choice between reviewed behaviours), **Guardrail** (a safety limit an experiment may only make stricter), **Fixed** (never changes, rule 11.4). An experiment gives Control (Option A, the everyday value) and Test options (B, C…) approved in code (rule 11.10). Rows 1 to 29 come from the owner's side chat, checked against the code on 1 Nov; rows 30 and 31 were added by decision J. Trial-plan values (such as the 5-week trial) are deliberately left out (decision I). Rows 8 and 9 move into `src/settings.ts` in the Datastore pull request (decision L).

| # | Kind | Value: what it means | Values it can take (today) | In the code today |
|---|---|---|---|---|
| 1 | Tuneable | Default slot times: the nudge times a new parent starts with. Parents can always change their own. | Any 30-minute start from 7:00am to 9:30pm. Today: 7:00am, 7:00pm and 9:00pm on school days; 9:00am, 12:30pm and 7:00pm on other days | settings.ts |
| 2 | Tuneable | Behaviours a parent may pick: how many habits a parent works on at once. | Numbers for quick, deliberate and the minimum in total. Today: up to 2 quick, up to 1 deliberate, at least 1 | settings.ts |
| 3 | Tuneable | Weekly Wrap Up default time: when the Sunday summary is sent unless the parent changes it. | Any 30-minute start from 7:00am to 9:30pm. Today: 8:00pm | settings.ts |
| 4 | Tuneable | Slots per schedule: how many nudge times a parent can set for each kind of day. | A number, at least 1. Today: up to 3 | settings.ts |
| 5 | Tuneable | Slot length and range: how long each nudge window lasts, and the earliest and latest start times. | Minutes and times. Today: 30 minutes, 7:00am to 9:30pm | settings.ts |
| 6 | Tuneable | Times a week for deliberate behaviours: how many reminders a week for the bigger family activities. | A number. Today: 2 | settings.ts |
| 7 | Tuneable | Examples in a message: how many ideas a nudge includes. | 0, 1 or 2. Added when the message words are built (rule 3.13 says 1 for now) | Not built yet |
| 8 | Tuneable | Frequencies offered: the choices parents see for how often to do a habit. | Sets of choices. Today: every day or every 2 days (quick); 1 or 2 times a week (deliberate) | choices.ts |
| 9 | Tuneable | Hidden ideal and floor: the behind-the-scenes target, and the minimum before the app nudges that habit first. | Numbers. Floor today: a quick habit not logged today or yesterday is nudged first; deliberate habits have no floor. Ideal: not used in the code yet (written only in EXPERIMENTS.md) | planner.ts (floor) |
| 10 | Tuneable | Reward numbers: points per log, the bonus for logging without a nudge, and how many points each level needs. | Numbers. Added when Variable rewards is built (the 2x bonus is in the spec, not the code) | Not built yet |
| 11 | Named style | Message style: the tone of nudge messages. | Named styles, for example warm or playful. Added when the message words are built | Not built yet |
| 12 | Named style | Framing: whether messages ask the parent to plan ahead or act now. | plan ahead / do now. Added when the message words are built | Not built yet |
| 13 | Named style | Message length and emoji: how long messages are and whether they use emoji. | Named styles. Added when the message words are built | Not built yet |
| 14 | Named style | Button wording: the words on the reply buttons. | Named sets. Added when the Telegram bot is built ("Done" and "Not today" are agreed in rule 3.5) | Not built yet |
| 15 | Named style | Thank-you style: how the bot thanks the parent after a log. | Named styles. Added when Variable rewards is built | Not built yet |
| 16 | Named rule | Days deliberate behaviours are nudged: which days the bot reminds about bigger activities. | Named patterns. Today: Friday and Sunday | settings.ts |
| 17 | Named rule | Rest after a streak: after a quick habit is done several days in a row, the bot nudges about it less often. | Named rules. Today: after 7 days in a row, not nudged two days running | settings.ts (7) + planner.ts |
| 18 | Named rule | Defaults pre-selected or not: whether new parents start with suggested times or pick their own. | pre-selected / pick from scratch. Added when the setup screen is built (agreed: pre-selected) | Not built yet |
| 19 | Named rule | Priority order: which habit gets nudged first when slots are limited. | Named orders. Today: quick habits below the floor first (the one not logged for longest goes first), then other quick, then deliberate; a tie goes to the habit picked first | planner.ts |
| 20 | Named rule | Timing within a slot: when, inside the 30-minute window, the nudge arrives. | at the start / a random minute. Added when the message sender is built | Not built yet |
| 21 | Named rule | Use of the parent's own context: whether messages mention the parent's past notes or their child's interests. | on / off. Added when the message words are built | Not built yet |
| 22 | Named rule | Photo or description prompt: what the bot asks for after a log. | photo / description / both / neither. Added when the Telegram bot is built | Not built yet |
| 23 | Named rule | Claude model used: which AI model writes the messages, a trade-off between cost and quality. | Named models. Added when the message words are built | Not built yet |
| 24 | Named rule | Badges and streak rules: how badges are earned and how many missed days a streak survives. | Named rules. Added when Variable rewards is built (spec: a streak survives 2 missed days) | Not built yet |
| 25 | Guardrail | Nudge messages per day: the most nudge messages a parent can get in one day. Replies and the Weekly Wrap Up don't count. | A number, 3 or fewer (stricter = fewer). Today: 3 | settings.ts |
| 26 | Guardrail | Gap between slots: the shortest time allowed between two nudge times on the same kind of day. | 1 hour or longer (stricter = longer). Today: 1 hour | settings.ts |
| 27 | Fixed | Note length limit: the longest description a parent can write when logging. | Always 280 characters | database (nudges table) |
| 28 | Fixed | Time zone: every day, week and time in the app follows Singapore time. | Always Singapore time, midnight to midnight, Monday to Sunday weeks | sgt.ts |
| 29 | Fixed | At least 1 slot: every parent must have at least one nudge time. | Always at least 1 | schedule.ts |
| 30 | RETIRED [2026-11-09 18:16 SGT] | ~~Weekly Wrap Up on by default.~~ The Wrap Up's own on/off switch was removed (owner, 9 Nov, rule 3.12): one Pause switch stops everything. Number 30 is not reused. | n/a | n/a |
| 31 | Named rule | Wrap Up day: the day the Weekly Wrap Up is sent. | A day of the week. Today: Sunday | settings.ts |
| 32 | Tuneable | [2026-11-11 17:28 SGT] Undo window: how long a keyboard log can be undone (rule 5.8). | Seconds. Today: 30 | settings.ts |
| 33 | Tuneable | [2026-11-11 17:28 SGT] Connection question window: how long the weekly question can be answered (rule 5.6). | Hours. Today: 24 | settings.ts |
| 34 | Tuneable | [2026-11-11 17:28 SGT] Moment window: how long the bot waits for a moment's photo or line after the button (rule 7.7). | Hours. Today: 24 | settings.ts |
| 35 | Named rule | [2026-11-11 18:13 SGT] Week-one cohort: the label every parent joins with in week one (rule 11.11). | A neutral label. Today: cohort-1 | settings.ts |
| 36 | Fixed | [2026-11-11 18:13 SGT] Thin slice 1 nudge: the one behaviour and time everyone gets until choosing is built (temporary). | Today: Showing affection at 7:00 pm | settings.ts |
| 37 | Tuneable | [2026-11-12 22:17 SGT] Sign-up draft window: how long an unfinished sign-up keeps its answers before it is cut down and its invite released (rule 8.13, Q11a). | Days. Today: 7 | settings.ts |
| 38 | Tuneable | [2026-11-12 22:17 SGT] Stopped sign-up record: how long the cut-down record (Telegram ID and last step) is kept before it is deleted (Q11d). | Days. Today: 90 | settings.ts |
| 39 | Fixed | [2026-11-12 22:17 SGT] Children per parent: the most children a parent can add (Q7b). | Always up to 3 | database (children table) |
| 40 | Tuneable | [2026-11-12 23:07 SGT] Name length: the longest first name or child's name sign-up accepts (Q7a). | Characters. Today: 40 | settings.ts |
| 41 | Tuneable | [2026-11-12 23:07 SGT] Default frequencies at sign-up (rule 2.5). | Today: quick every 2 days, deliberate once a week | settings.ts |

## Starting values (hypotheses, from `docs/SPEC.md`)
- [2026-10-31 19:09 SGT] **This list describes the starting values in words. The values in force are in `src/settings.ts`; if the two ever differ, the code wins (rule 1.4).** Update this list in the same pull request as the code.
- [2026-10-31 19:06 SGT] Trial length (D9, rule 10.3): 5 full weeks per parent from their first full Monday; the week-one friends group, about 12 parents.
- [2026-11-09 18:16 SGT] Weekly Wrap Up (rule 3.12): Sunday, default 8:00pm; the parent can change the time (any 30-minute block, 7:00am to 9:30pm). No on/off switch of its own: the one Pause switch stops it. Not a nudge message: no slot, not counted toward the 3-a-day cap. In `src/settings.ts` (`WEEKLY_WRAP_UP_WEEKDAY`, `DEFAULT_WEEKLY_WRAP_UP`).
- [2026-10-28 22:23 SGT] Nudge slots: 30-minute blocks from 7:00am to 9:30pm (last start), up to 3 per schedule, at least 1 hour apart, at least 1 in total. Defaults: school days 7:00am, 7:00pm, 9:00pm; non-school days 9:00am, 12:30pm, 7:00pm.
- [2026-10-28 22:23 SGT] Deliberate behaviours are nudged on Friday (planning) and Sunday (only if still due). Possible future experiment: other patterns (e.g. a midweek nudge).
- [2026-10-28 22:23 SGT] A quick behaviour logged on each of the last 7 days is nudged only if it was not nudged yesterday.
These apply to everyone who is not in an experiment that changes them.
- [2026-10-24 22:18 SGT] Choice limits: up to 2 quick and up to 1 deliberate behaviour at a time; at least 1 in total. Choosing more is an unlock (rule WIP).
- [2026-10-24 18:26 SGT] Maximum nudges per day: 3
- [2026-10-24 22:18 SGT] Quick nudges (4): parent picks every day or every 2 days for each. Hidden ideal 1 per day, floor 1 per 2 days. Deliberate nudges (5, including spending quality time): 1 or 2 per week in total. Hidden ideal 1 per week, no floor.
- [2026-10-24 18:26 SGT] Deliberate actions: 1 or 2 per week in total. Hidden ideal 1 per week, no floor.
- [2026-10-24 18:26 SGT] Streak gap allowed (quick actions): up to 2 missed days in a row

## Experiment variables (parked)
- [2026-10-29 22:37 SGT] Added: steady-week bars (every day 6 of 7; every 2 days 3; deliberate as chosen), rule 7.6.
[2026-10-31 18:59 SGT] Correction: the code's values are now in `src/settings.ts` (was `shared/settings.ts`).
[2026-10-31 19:09 SGT] The experiment module has now been designed: [src/experiments/SPEC.md](SPEC.md).

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
- [2026-10-31 18:59 SGT] Which nudges start unlocked (now all 9, rule 2.2 changed 29 Oct; unlocks are out of the MVP), and how an unlock is earned
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
- [2026-10-31 19:09 SGT] ANSWERED on 31 Oct (Experiments module): settings in code, recorded per parent in the Datastore (rules 1.4, 11.1); week one is `baseline` only, a random split starts when the owner decides, and a parent's variant never changes (rules 11.3, 11.6); the first experiment is chosen before alpha (backlog). The three questions below are kept as history.
- Where experiment settings live: a code file changed by pull request, or a Supabase table the owner edits
- When parents are assigned to a group (when an experiment starts? at sign-up?) and whether they stay in it
- How many groups per experiment, and the first experiment to run (suggested: none at launch, start after 2 weeks of data)

## Active experiments
- [2026-10-24 18:26 SGT] None yet.

## Finished experiments
- [2026-10-24 18:26 SGT] None yet.
