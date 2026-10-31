# Error Log

One entry per error: What broke / Cause / Fix / How to prevent it. Newest first.

## [2026-10-25 08:11 SGT] Our server's role had more than read-only access on the real Supabase
- **What broke:** [2026-10-25 08:11 SGT] The owner's permission check on the live project showed `service_role` with TRUNCATE, TRIGGER and REFERENCES on `nudges`, `examples` and the view, not just SELECT.
- **Cause:** [2026-10-25 08:11 SGT] Supabase's default permissions give `service_role` these on new tables. Our local test database has no such defaults, so the test passed locally while the real project differed.
- **Fix:** [2026-10-25 08:11 SGT] New migration `002_service_role_read_only.sql` removes all of `service_role`'s permissions on the three objects and grants back SELECT on the two tables only. The database test now copies Supabase's defaults first and checks TRUNCATE, TRIGGER and REFERENCES are absent (seen failing without 002, passing with it).
- **How to prevent it:** [2026-10-25 08:11 SGT] After running any migration on Supabase, run the read-only permission check query; make the local test start from Supabase-like defaults; always "revoke all" before "grant" for our roles.

## [2026-10-25 07:17 SGT] Database test expected the next ID to be 10, got 19
- **What broke:** [2026-10-25 07:17 SGT] A database test (my own, just written) failed: a new row got ID 19, not 10.
- **Cause:** [2026-10-25 07:17 SGT] Each refused insert earlier in the test still used up an ID number. Databases never hand back numbers from failed attempts, so IDs can skip. The test's assumption was wrong, not the table.
- **Fix:** [2026-10-25 07:17 SGT] The test now checks what matters: the new ID is above 9 and unique. Recorded in the test's comment.
- **How to prevent it:** [2026-10-25 07:17 SGT] Never assume generated IDs are consecutive; treat them as labels, not a count.

## [2026-10-25 07:17 SGT] Local test database would not start
- **What broke:** [2026-10-25 07:17 SGT] PostgreSQL refused to start in the scratchpad folder.
- **Cause:** [2026-10-25 07:17 SGT] The folder path was longer than the 107-character limit for its connection file, and the scratchpad is private to the root user.
- **Fix:** [2026-10-25 07:17 SGT] Started it with network-only connections in a short throwaway folder (`/var/tmp/fhb-pg`), deleted afterwards.
- **How to prevent it:** [2026-10-25 07:17 SGT] For local PostgreSQL, use a short folder path owned by the `postgres` user and connect via 127.0.0.1.

## [2026-10-24 21:19 SGT] Build failed: TypeScript asked for "rootDir"
- **What broke:** [2026-10-24 21:19 SGT] `npm run build` stopped with error TS5011: "The 'rootDir' setting must be explicitly set".
- **Cause:** [2026-10-24 21:19 SGT] TypeScript 7 no longer guesses which folder is the top of the code when it writes the compiled files. It wants it written down.
- **Fix:** [2026-10-24 21:19 SGT] Added `"rootDir": "."` to `tsconfig.build.json`. The check then passed.
- **How to prevent it:** [2026-10-24 21:19 SGT] When adding a new TypeScript settings file that writes output, always set `rootDir` and `outDir` together.

- [2026-10-24 17:39 SGT] No errors yet. SUPERSEDED [2026-10-24 21:19 SGT]
