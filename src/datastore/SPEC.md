# Datastore: module spec

[2026-10-31 09:59 SGT] The **current rules** of the Datastore module: where everything is kept. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 09:59 SGT] Store the app's data safely: **Supabase** (database and photo storage, Singapore) for permanent records, **Upstash Redis** (Singapore) for short-term chat memory. The Datastore owns **all SQL** (rule S6): table structure, first-load data, one-off content changes and database tests. Other modules own the **rules** for their own tables' content (for example the [Nudge repository](../nudge-repository/SPEC.md) owns the rules for `nudges` and `examples`).

## Files in this folder
- [2026-10-31 09:59 SGT] `supabase/migrations/`: table structure changes, numbered, run once each in order in the Supabase SQL Editor (owner). **Never edit one after it has run** (rule B1, checked by fingerprint below).
- [2026-10-31 09:59 SGT] `supabase/seed/`: first-load data (already imported).
- [2026-10-31 09:59 SGT] `supabase/content/`: one-off content changes to live data, named `YYYY-MM-DD_what.sql` (rule B2).
- [2026-10-31 09:59 SGT] `supabase/tests/`: database tests; run with `npm run test:db` against a local PostgreSQL (not part of `npm run check` yet; see docs/KNOWN-ISSUES.md).

## Planned for the Datastore build
- [2026-10-31 17:53 SGT] Two new values per parent for the Weekly Wrap Up (Nudge engine rule 3.12): **wrap-up time** (default 8:00pm) and **wrap-up on or off** (default on). Include them in the table mock-ups. A record of each Wrap Up sent is also needed ("never twice in a week", and Telemetry rule 10.2).

## Applied migrations (rule B1)
[2026-10-31 09:59 SGT] Migrations that have run on the real Supabase project, with a fingerprint (the first 12 characters of the SHA-256 code of the file's contents). The drift test recomputes each fingerprint on every pull request and fails if a file was edited. To change the database, add a new numbered migration instead.

| Migration | Fingerprint |
|---|---|
| 001_create_nudge_repository.sql | 61812ba8c145 |
| 002_service_role_read_only.sql | 99f8e46eec97 |

## Content scripts
- [2026-10-31 17:45 SGT] `2026-10-31_more_examples.sql`: adds the 32 examples approved on 31 Oct (D6). **Waiting for the owner to run it** in the Supabase SQL Editor (expect 32 rows; a second run adds 0).
- [2026-10-31 17:45 SGT] `2026-10-29_unlock_all_nudges.sql`: applied (the owner confirmed on 31 Oct that all 9 nudges are unlocked; the run showed 0 rows because it had already been applied).
- [2026-10-31 09:59 SGT] `2026-10-28_time_agnostic_examples.sql`: applied by the owner on 28 Oct (10 rows).
- SUPERSEDED [2026-10-31 17:45 SGT] [2026-10-31 09:59 SGT] `2026-10-29_unlock_all_nudges.sql`: **waiting for the owner to run it** in the Supabase SQL Editor (expect 3 rows: SGE, ITE, ASD).

## Rules at a glance
5.5 photos: optional, consent, kept until deleted · 8.1 everything in Singapore · 8.2 locked by default

## Rules
- **5.5** **Photos:** always optional; consent once at sign-up; kept until the parent deletes their data. *(decided 24 Oct)* Not yet tested (photo storage is not built yet; the retention risk is in docs/KNOWN-ISSUES.md).
- **8.1** Supabase in **Singapore**; Upstash Redis (Singapore) for chat memory; Vercel functions in Singapore. *(decided 24 Oct)* Not yet tested (dashboard settings, confirmed by the owner for Supabase; `vercel.json` sets the Vercel region `sin1`; Upstash not created yet).
- **8.2** New tables start **locked** (Row Level Security on, no public access); our server can only read the nudge tables. *(decided 25 Oct)* Tested by: src/datastore/supabase/tests/nudge-repository.test.sql (permissions and Row Level Security), confirmed on the live project by the owner's permission check.
