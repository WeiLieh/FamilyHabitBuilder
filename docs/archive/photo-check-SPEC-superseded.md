# Superseded lines from `src/photo-check/SPEC.md`

[2026-11-12 23:24 SGT] Moved word for word from [`src/photo-check/SPEC.md`](../../src/photo-check/SPEC.md) on 2026-11-12 (owner approved: "shorten all the long md files"). Each line keeps its own date and SUPERSEDED marker; the heading above each group is where it sat. Nothing was reworded.

## Under: Photo check: module spec > Rules

- SUPERSEDED [2026-11-01 16:32 SGT] **6.2** [2026-11-01 16:07 SGT] **A photo that fails the check is kept.** It is stored and shown to the parent in the Web app (it is what they uploaded; we don't decide for them). The parent is asked to self-report, and the log is recorded as self-reported (rule 1.3). *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T24, the database side). Photo storage and showing it in the Web app are not built yet.
