# Error Log

One entry per error: What broke / Cause / Fix / How to prevent it. Newest first.

## [2026-10-24 21:19 SGT] Build failed: TypeScript asked for "rootDir"
- **What broke:** [2026-10-24 21:19 SGT] `npm run build` stopped with error TS5011: "The 'rootDir' setting must be explicitly set".
- **Cause:** [2026-10-24 21:19 SGT] TypeScript 7 no longer guesses which folder is the top of the code when it writes the compiled files. It wants it written down.
- **Fix:** [2026-10-24 21:19 SGT] Added `"rootDir": "."` to `tsconfig.build.json`. The check then passed.
- **How to prevent it:** [2026-10-24 21:19 SGT] When adding a new TypeScript settings file that writes output, always set `rootDir` and `outDir` together.

- [2026-10-24 17:39 SGT] No errors yet. SUPERSEDED [2026-10-24 21:19 SGT]
