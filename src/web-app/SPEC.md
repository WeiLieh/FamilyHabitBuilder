# Web app: module spec

[2026-10-31 10:12 SGT] The **current rules** of the Web app module: plain web pages a parent opens from a one-tap link. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:12 SGT] Show a parent their history, progress, rewards and saved memories (the family memory album and snapshots, from [Variable rewards](../variable-rewards/SPEC.md)), read from the [Datastore](../datastore/SPEC.md). The look comes only from the owner (`CLAUDE.md` rule 6); thin page addresses will live in `api/` (rule S3).

## Code in this folder
- [2026-10-31 10:12 SGT] None yet (development order, step 7).

## Parked questions (decide when designing the Web app)
- [2026-11-01 16:07 SGT] How the Web app reaches the database: through the server with the master key, or with limited per-parent access (rule 11.7 already bars the master key for starting and stopping experiments).
- [2026-11-01 16:07 SGT] Parents' descriptions and Claude: whether descriptions are sent to Claude to write messages, and what sign-up tells parents about it.

## Rules at a glance
9.1 plain pages, the owner's look, "delete my data"

## Rules
- **9.1** Plain, unstyled pages that show the right data; **the look comes from the owner later**. "Delete my data" lives here (WIP until UI design). *(decided 24 Oct)* Not yet tested (nothing built).
