# Photo check: module spec

[2026-10-31 10:12 SGT] The **current rules** of the Photo check module: Claude looks at a photo a parent sends and judges whether it fits the behaviour. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:12 SGT] Photos are always optional. When a parent sends one (only for nudges that allow photos, rule 4.3 in the [Nudge repository](../nudge-repository/SPEC.md)), Claude checks it; photos are stored by the [Datastore](../datastore/SPEC.md) under rule 5.5 (optional, consent, kept until deleted). This is the one exception to "no fallbacks" (rule 1.3).

## Code in this folder
- [2026-10-31 10:12 SGT] None yet (development order, step 5).

## Rules at a glance
6.1 Claude judges the photo; if the check fails, the parent self-reports

## Rules
- **6.1** Claude judges the photo, using the nudge's photo idea **for now** (risk: too strict, logged in docs/KNOWN-ISSUES.md). If the check fails, the parent self-reports and the log is labelled "self-reported". *(decided 24 Oct)* Not yet tested (nothing built).
