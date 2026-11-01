# Owner's reading only: Datastore design pages

[2026-11-01 16:56 SGT] **For the owner (product manager) to read. Claude must NEVER read the files in this folder.**

- `datastore-tables-draft-3.pdf`: the visual draft of the Datastore tables (1 Nov 2026): the 14 tables, the 29 values and their kinds, one experiment followed through, and the timeline of experiments. Live page: https://claude.ai/artifact/Hxg24abjeod6DXYxBYAyPD
- `datastore-spec-review.pdf`: the rules and the 41 plain-English tests the owner approved before the build. Live page: https://claude.ai/artifact/Nbz16hxGrLoSUtxJMguctC

**Why Claude must not read them:** they are snapshots of drafts, and some wording was changed later (for example "three narrow edits" became four). The current rules live only in [../SPEC.md](../SPEC.md). Claude Code is blocked from reading these PDFs by a deny rule in `.claude/settings.json`, and `CLAUDE.md` says why. If the owner asks Claude to read them, Claude reminds the owner of this rule instead.

GitHub shows PDFs in the browser: click a file to read it.
