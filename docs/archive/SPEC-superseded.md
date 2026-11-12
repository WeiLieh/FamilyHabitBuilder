# Superseded lines from `docs/SPEC.md`

[2026-11-12 23:24 SGT] Moved word for word from [`docs/SPEC.md`](../SPEC.md) on 2026-11-12 (owner approved: "shorten all the long md files"). Each line keeps its own date and SUPERSEDED marker; the heading above each group is where it sat. Nothing was reworded.

## Under: SPEC: Family Habit App (Minimum Viable Product (MVP)) > Constraints

- SUPERSEDED [2026-10-31 19:06 SGT] [2026-10-24 17:24 SGT] **Modules:** Telegram bot; nudge engine ("brain" plus experiments); nudge repository (the 9 actions as data rows, never inside a prompt); photo check (AI vision model); variable rewards; datastore (history, targets, photos; fastest to build, least effort); web app; telemetry. The engine reads each parent's history from the datastore and decides rewards row 5 and experiment variants.
- [2026-10-24 17:24 SGT] **Actions (from Triple P (Positive Parenting Program)):** SUPERSEDED [2026-10-24 22:09 SGT]
  - Quick, 1 to 2 minutes: spending quality time, talking with children, showing affection, descriptive praise, giving attention. Parent picks every day or every 2 days. Hidden ideal 1 per day, floor 1 per 2 days.
  - Deliberate, more time: interesting activities, setting a good example, incidental teaching, ask-say-do. Parent sets 1 or 2 per week at most. Hidden ideal 1 per week, no floor.
- SUPERSEDED [2026-10-31 19:06 SGT] [2026-10-24 18:26 SGT] **Experiments (update):** experiments are defined in `docs/EXPERIMENTS.md` (no admin screen). Each parent is randomly assigned to a variant once and stays in it.
- SUPERSEDED [2026-10-31 19:06 SGT] [2026-10-24 17:24 SGT] **Experiments:** the nudge engine can define experiments that serve different variants (nudges, rewards, surprise rate) to different parents and compare outcomes.
- SUPERSEDED [2026-11-09 00:14 SGT] [2026-10-24 18:26 SGT] **Telemetry:** the 10 metrics, definitions, windows and targets in `docs/Family_Habit_App_Success_Metrics.xlsx` (5 Usage metrics and 5 Habit formation metrics; success tests X, Y, Z at trial end).
- [2026-10-24 17:24 SGT] **Telemetry:** activation rate, feature adoption rate, active users and stickiness, churn rate, drop-off rate. SUPERSEDED [2026-10-24 18:26 SGT]

## Under: SPEC: Family Habit App (Minimum Viable Product (MVP)) > Out of scope

- [2026-10-24 17:24 SGT] Open, to decide before real families use the app: how long photos of children are kept (`docs/KNOWN-ISSUES.md`). SUPERSEDED [2026-10-24 18:26 SGT]

## Under: SPEC: Family Habit App (Minimum Viable Product (MVP)) > Definition of done

- SUPERSEDED [2026-11-09 00:14 SGT] [2026-10-31 19:06 SGT] Every event records the parent's **settings version and variant from day one**, the app **can run an experiment before alpha** (Experiments module), telemetry shows the 10 metrics in `src/telemetry/Family_Habit_App_Success_Metrics.xlsx`, and the system works for the **week-one trial (about 12 parents, rule 10.3)**. Whether the stack holds at 1,000 to 5,000 parents is checked before alpha (backlog).
- SUPERSEDED [2026-10-31 19:06 SGT] [2026-10-24 18:26 SGT] The engine can run an experiment (read from `docs/EXPERIMENTS.md`), telemetry shows the 10 metrics in `docs/Family_Habit_App_Success_Metrics.xlsx`, and the system works for 50 trial users.
- [2026-10-24 17:24 SGT] The engine can run an experiment, telemetry shows the five metrics, and the system works for 50 trial users. SUPERSEDED [2026-10-24 18:26 SGT]

## Under: SPEC: Family Habit App (Minimum Viable Product (MVP)) > Modules and structure > Cross-cutting rules

- SUPERSEDED [2026-11-12 21:11 SGT] **1.3** [2026-11-12 21:06 SGT] **No fallbacks:** a failure is shown as a failure, never filled with made-up values. Exception: if the photo check fails, the parent self-reports. *(decided 24 Oct)* Tested by: tests/nudge-repository.test.ts (broken rows are reported, never patched). Also, since thin slice 1 [2026-11-11 18:17 SGT]: tests/telegram-bot-done.test.ts and tests/telegram-bot-sign-up.test.ts (an honest "didn't save" or "didn't work", never a receipt), tests/telegram-bot-daily-nudge.test.ts (a failed send or record is counted as a failure, never as sent). Since 12 Nov [2026-11-12 21:06 SGT]: a database question that can't be answered ("already signed up?" at `/start`, "who is this?" on a button tap) gets an honest "didn't work", never silence; and once something is saved, a later Telegram failure is never reported as "didn't save" (tests/telegram-bot-sign-up.test.ts, tests/telegram-bot-done.test.ts).
- SUPERSEDED [2026-11-12 21:06 SGT] **1.3** **No fallbacks:** a failure is shown as a failure, never filled with made-up values. Exception: if the photo check fails, the parent self-reports. *(decided 24 Oct)* Tested by: tests/nudge-repository.test.ts (broken rows are reported, never patched). Also, since thin slice 1 [2026-11-11 18:17 SGT]: tests/telegram-bot-done.test.ts and tests/telegram-bot-sign-up.test.ts (an honest "didn't save" or "didn't work", never a receipt), tests/telegram-bot-daily-nudge.test.ts (a failed send or record is counted as a failure, never as sent).
- SUPERSEDED [2026-11-01 16:07 SGT] **1.4** [2026-10-31 19:09 SGT] **Every adjustable number lives once, in code** (`src/settings.ts` for now), labelled as a **guardrail** (a limit experiments may only make stricter, such as the 3-a-day cap, rule 11.4), a **tunable value** or a **trial-plan value**. `src/experiments/EXPERIMENTS.md` (moved from `docs/` [2026-10-31 19:18 SGT]) describes the experiments and the starting values in words; if the two ever differ, the code wins. *(decided 31 Oct)* Tested by: tests/nudge-engine-choices.test.ts (the choice limits only). "Lives once" and the labels are not yet tested (the labels are not in the code yet).

## Under: SPEC: Family Habit App (Minimum Viable Product (MVP)) > Modules and structure > Minimum test count

- SUPERSEDED [2026-11-12 23:16 SGT] [2026-11-12 23:07 SGT] Minimum test count: 208 (pull request 2, onboarding screens, 12 Nov).
- SUPERSEDED [2026-11-12 23:07 SGT] [2026-11-12 22:17 SGT] Minimum test count: 183 (migration 007's two sign-up windows, 12 Nov).
- SUPERSEDED [2026-11-12 22:17 SGT] - [2026-11-12 21:11 SGT] Minimum test count: 182 (sign-up gap review fixes, 12 Nov).
- SUPERSEDED [2026-11-12 21:11 SGT] - [2026-11-12 21:06 SGT] Minimum test count: 176 (the sign-up gap, 12 Nov).
- SUPERSEDED [2026-11-12 21:06 SGT] - [2026-11-12 20:59 SGT] Minimum test count: 172 (rule 5.10 review fixes, 12 Nov).
- SUPERSEDED [2026-11-12 20:59 SGT] - [2026-11-12 20:54 SGT] Minimum test count: 168 (rule 5.10, 12 Nov).
- SUPERSEDED [2026-11-12 20:54 SGT] - [2026-11-11 18:17 SGT] Minimum test count: 166 (review fixes on thin slice 1, 11 Nov).
- SUPERSEDED [2026-11-11 18:17 SGT] [2026-11-11 18:14 SGT] Minimum test count: 161 (thin slice 1: 18 bot tests, 11 Nov).
- SUPERSEDED [2026-11-11 18:14 SGT] [2026-11-11 17:44 SGT] Minimum test count: 143 (two drift tests for rule D4, 11 Nov).
- SUPERSEDED [2026-11-11 17:44 SGT] [2026-11-11 17:28 SGT] Minimum test count: 141 (two window tests added, 11 Nov).
- SUPERSEDED [2026-11-11 17:28 SGT] [2026-11-01 16:14 SGT] Minimum test count: 139
- SUPERSEDED [2026-11-01 16:14 SGT] [2026-10-31 17:53 SGT] Minimum test count: 129
- SUPERSEDED [2026-10-31 17:53 SGT] [2026-10-31 09:40 SGT] Minimum test count: 106

## Under: SPEC: Family Habit App (Minimum Viable Product (MVP)) > Change notes

  26. [2026-10-28 22:11 SGT] SUPERSEDED [2026-10-28 22:21 SGT] **Deliberate nudge messages: at most 2 a week, never on consecutive days, and one of them on Friday (the day before the weekend).** Working reading (to confirm with the Batch 2 test list): the first may go Monday to Wednesday, the second on Friday; none on Thursday (it would be next to Friday) or at the weekend.
  - SUPERSEDED [2026-10-28 21:26 SGT] Still open from the generalised design: minimum gap between slots (suggested 1 hour); any behaviour in any slot with Claude adding time context (would drop "deliberate only at dinner"); slot range (suggested 7:00am to 10:00pm); at least 1 slot in total; meaning of "custom"; non-school default slots; what the "too many nudges" button does.
  - Still open: minimum number of examples per nudge (suggested 3). SUPERSEDED [2026-10-25 07:48 SGT]
  - Still open: where the master copy of the Nudge repository lives (question 9). SUPERSEDED [2026-10-24 22:14 SGT]
