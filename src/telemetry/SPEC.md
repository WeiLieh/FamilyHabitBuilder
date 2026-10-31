# Telemetry: module spec

[2026-10-31 10:09 SGT] The **current rules** of the Telemetry module: recording events from every module and calculating the owner's 10 success metrics. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:09 SGT] Show whether the app works for families: are parents active, are habits forming, is the app "never pushy". Telemetry **listens to events from every module** (dotted lines in [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)); events are recorded from the Datastore step onwards, so no data is lost before the metric calculations are built (development order, step 6).

## Files in this folder
- [2026-10-31 10:09 SGT] `Family_Habit_App_Success_Metrics.xlsx`: the owner's **10 success metrics**: definitions, windows (e.g. activation within 3 days, churn after 14 days), targets and the success tests X, Y, Z. Telemetry must follow it.
- [2026-10-31 10:09 SGT] No code yet.

## Rules at a glance
5.2 what "unprompted" means · 10.1 the 10 metrics, and "Not today" as its own event

## Rules
- **5.2** **Unprompted** = no nudge message in the 4 hours before (metric 7). Used by Variable rewards (rule 7.2). *(decided 28 Oct)* Not yet tested (nothing built).
- **10.1** The **10 metrics** in `Family_Habit_App_Success_Metrics.xlsx` (activation, adoption, stickiness, churn, drop-off, target-hit, unprompted, nudge-to-action, mute/stop, connection rating). "Not today" is its own event, not part of mute/stop. *(decided 24 Oct, 28 Oct)* Not yet tested (nothing built).
