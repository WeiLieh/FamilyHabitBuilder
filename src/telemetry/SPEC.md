# Telemetry: module spec

[2026-10-31 10:09 SGT] The **current rules** of the Telemetry module: recording events from every module and calculating the owner's 10 success metrics. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:09 SGT] Show whether the app works for families: are parents active, are habits forming, is the app "never pushy". Telemetry **listens to events from every module** (dotted lines in [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)); events are recorded from the Datastore step onwards, so no data is lost before the metric calculations are built (development order, step 6).

## Files in this folder
- [2026-10-31 10:09 SGT] `Family_Habit_App_Success_Metrics.xlsx`: the owner's **10 success metrics**: definitions, windows (e.g. activation within 3 days, churn after 14 days), targets and the success tests X, Y, Z. Telemetry must follow it.
- [2026-10-31 10:09 SGT] No code yet.

## Future work
- [2026-10-31 19:06 SGT] With the [Experiments](../experiments/SPEC.md) module: each of the 10 metrics must be split by variant, allowing for different group sizes, different join dates and parents in several experiments at once. Reward experiments are read against **metric 10** (weekly connection rating) as well as the usage metrics. Not before alpha (`docs/PRODUCT-BACKLOG.md`).

## Proposed rule changes (owner decision, design chat, 2026-11-03; awaiting owner approval)
- [2026-11-03 22:27 SGT] **Proposed change to rule 10.2**, from the Telegram onboarding design ([handoff](../../docs/handoffs/2026-11-03-telegram-onboarding-handoff.md); see [src/telegram-bot/SPEC.md](../telegram-bot/SPEC.md)). The current text stays in force until approved.
  - Old (shortened): "**'Weekly Wrap Up sent'** (rule 3.12) is recorded as **its own event**. Metrics 8 (nudge-to-action) and 9 (mute and stop rate) **never count it as a nudge message**."
  - New (draft): "'Weekly Wrap Up sent' and **'connection question sent on its own'** (the Sunday rhythm, proposed change to rule 3.4) are each recorded as their own event. Metrics 8 and 9 never count them as nudge messages." If Q3 is accepted, add a **'first action at sign-up'** event, also never counted in metric 8 (nudge-to-action).
  - The new event types need rows in `event_types` (a reviewed script by the owner, rule 8.4).

- [2026-11-08 23:51 SGT] **To add with the B1 build** (owner approved Undo, rule 5.8): a **'log undone'** event type, and every metric that counts logs excludes undone logs. A keyboard tap that answers a waiting nudge counts as answering that nudge (rule 5.1); how this fits the 4-hour definition of rule 5.2 is an open question (CATCH-UP section 4).

## Rules at a glance
5.2 what "unprompted" means · 10.1 the 10 metrics, and "Not today" as its own event · 10.2 the Weekly Wrap Up is not a nudge · 10.3 trial length · 10.4 flag children outside 7 to 12

## Rules
- **5.2** **Unprompted** = no nudge message in the 4 hours before (metric 7). Used by Variable rewards (rule 7.2). *(decided 28 Oct)* Not yet tested (nothing built).
- **10.1** The **10 metrics** in `Family_Habit_App_Success_Metrics.xlsx` (activation, adoption, stickiness, churn, drop-off, target-hit, unprompted, nudge-to-action, mute/stop, connection rating). "Not today" is its own event, not part of mute/stop. *(decided 24 Oct, 28 Oct)* Not yet tested (nothing built).
- **10.2** [2026-10-31 17:52 SGT] **"Weekly Wrap Up sent"** (rule 3.12) is recorded as **its own event**. Metrics 8 (nudge-to-action) and 9 (mute and stop rate) **never count it as a nudge message**. *(decided 31 Oct)* Not yet tested (nothing built).
- **10.3** [2026-10-31 19:06 SGT] **Trial length** (D9): **5 full weeks per parent**, counted from each parent's **first full Monday** (the joining week doesn't count, rule 7.6), so about 5 and a half calendar weeks; **about 12 parents** (the week-one friends group) to start; the app counts parents, not families. Alpha (50 to about 1,000) and beta (up to about 5,000) come later. This gives metric 6 its final 4 weeks and metric 7 its final 2. *(decided 31 Oct, changed 31 Oct)* Not yet tested (nothing built).
- SUPERSEDED [2026-10-31 19:06 SGT] **10.3** [2026-10-31 17:59 SGT] **Trial length** (D9): **5 full weeks per family**, counted from each family's **first full Monday** (the joining week doesn't count, rule 7.6), so about 5 and a half calendar weeks; **5 to 10 friends' families** to start. This gives metric 6 its final 4 weeks and metric 7 its final 2. *(decided 31 Oct)* Not yet tested (nothing built).
- **10.4** [2026-11-01 16:07 SGT] **Flag children outside 7 to 12.** A child aged 0 to 6 or 13 to 25 (from their birth year, rule 8.10) is accepted at sign-up and flagged in Telemetry, never refused. *(decided 1 Nov)* Tested by: tests/datastore-children.test.ts (the flag is worked out when a birth year is saved). Telemetry's use of the flag is not built yet.
