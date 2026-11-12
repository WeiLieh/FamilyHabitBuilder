# Photo check: module spec

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/photo-check-SPEC-superseded.md](../../docs/archive/photo-check-SPEC-superseded.md) to keep this file short (owner approved).

[2026-10-31 10:12 SGT] The **current rules** of the Photo check module: Claude looks at a photo a parent sends and judges whether it fits the behaviour. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:12 SGT] Photos are always optional. When a parent sends one (only for nudges that allow photos, rule 4.3 in the [Nudge repository](../nudge-repository/SPEC.md)), Claude checks it; photos are stored by the [Datastore](../datastore/SPEC.md) under rule 5.5 (optional, consent, kept until deleted). This is the one exception to "no fallbacks" (rule 1.3).

## Code in this folder
- [2026-10-31 10:12 SGT] None yet (development order, step 5).

## Design notes (owner, design chat, 2026-11-09)
- [2026-11-09 21:48 SGT] **The photo check is an add-on** ([B1 part 2 handoff](../../docs/handoffs/2026-11-09-telegram-b1-not-today-photos-and-logs.md)): the log is already saved and counts; the check only adds a label. Match: photo-checked. No match, or the check could not run: one tap "✅ Yes, I did it" and the log is self-reported. Nothing is removed or blocked; no invented results (rule 1.3). Rules 6.1 and 6.2 already say this in substance. Saving a photo onto a saved log needs a Datastore change (proposal in [src/datastore/SPEC.md](../datastore/SPEC.md)).
- [2026-11-09 21:48 SGT] **Saved moments are not checked** ([B2 handoff](../../docs/handoffs/2026-11-09-telegram-b2-answering-and-saving.md)): rules 6.1 and 6.2 apply to logs only.

## Rules at a glance
6.1 Claude judges the photo; if the check fails, the parent self-reports · 6.2 a photo that fails is kept

## Rules
- **6.1** Claude judges the photo, using the nudge's photo idea **for now** (risk: too strict, logged in docs/KNOWN-ISSUES.md). If the check fails, the parent self-reports and the log is labelled "self-reported". *(decided 24 Oct)* Not yet tested (nothing built).
- **6.2** [2026-11-01 16:32 SGT] **A photo that fails the check is kept.** It is stored and shown to the parent in the Web app (it is what they uploaded; we don't decide for them). The parent is asked to self-report, and the log is recorded as self-reported (rule 1.3). If the check **could not run** (an outage), the result is recorded as `error`, never as failed, and the log is also self-reported. *(decided 1 Nov, changed 1 Nov after review)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T24 and fix 3, the database side). Photo storage and showing it in the Web app are not built yet.
