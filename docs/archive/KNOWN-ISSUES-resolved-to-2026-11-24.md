# Known issues: resolved entries, archived

[2026-11-24 23:13 SGT] Moved here word for word from `docs/KNOWN-ISSUES.md` to keep it short (owner approved, 24 Nov). Each entry keeps its own dates.

### [2026-11-15 09:03 SGT] The Web app's sign-in and deletes are rules only, nothing built
- **Issue:** [2026-11-15 09:03 SGT] Rules 9.3 and 9.6 now say how the sign-in link and deleting must work (a one-time link that expires in 5 minutes and stays out of logs; Sign out and delete my data end the sign-in; no copies or previews left after a delete). None of it is built or tested yet.
- **Impact:** [2026-11-15 09:03 SGT] A Web app built without these would show children's names and photos to anyone holding a forwarded link (privacy review, 14 Nov).
- **Workaround:** [2026-11-15 09:03 SGT] No real family uses the Web app until rules 9.3 and 9.6 are built and tested; the security reviewer checks them before go-live.
- **Update:** [2026-11-15 21:52 SGT] **Sign-in built, tested and live** (#51, #52, #53; UAT U56 to U62 pass, 15 Nov evening). Still open: deleting on My page (rule 9.6: dustbins, "Are you sure?", short-lived photo links, deleting files) comes with the pages; the security reviewer checks it before a real family uses the Web app.
- **Update:** [2026-11-15 12:13 SGT] Owner chose (15 Nov) **option A, a signed per-parent pass** checked by Row Level Security (key decision in `docs/CONTEXT.md`). Being built test-first: Datastore (migration 011) then the Web app sign-in.
- **Update:** [2026-11-15 09:17 SGT] Also open before go-live: how the Web app reaches the database (master key or per-parent access), and checking the "do not store" and short-lived-link rules on Vercel. Telegram's own copy of a photo stays in the chat (see "Telegram keeps the chat history outside Singapore").
- **Resolved:** [2026-11-24 23:13 SGT] Both are built and live: sign-in (#51 to #53) and deleting on My page, with "Are you sure?" (#55), and photo dustbins, short-lived photo links and deleting the files (#58).

### [2026-11-09 17:50 SGT] "Ignore this to skip" has no time limit
- **Status:** [2026-11-24 22:41 SGT] Fixed for "Add how you felt": the bot stops waiting after 10 minutes (value 55), tested by F5 and T122. Lines are not sent to Claude yet. (The moment's 24-hour window, the entry above, is separate and comes with the Wrap Up.)
- **Issue:** [2026-11-09 17:50 SGT] After a keyboard log the bot waits for a "how did it feel" line with no time limit, so a later, unrelated message could be saved as the log's description and sent to Claude (privacy review of the B1 daily loop design, 9 Nov; owner agreed to log it on 9 Nov).
- **Impact:** [2026-11-09 17:50 SGT] None yet (not built). Wrong or private text could be stored and sent to Claude.
- **Workaround:** [2026-11-09 17:50 SGT] Owner decided (9 Nov): the bot **stops waiting after a set time** (10 minutes suggested; the exact number is a Tuneable value decided in B1 design and kept in `src/settings.ts`), with a test.
- **Resolved:** [2026-11-24 23:13 SGT] The bot stops waiting for a "how you felt" line after 10 minutes (#59, tests F5 and T122). The moment's 24-hour window is its own entry.

### [2026-11-14 22:24 SGT] A logged day with a line but no photo has no tile in the older-weeks list
- **Issue:** [2026-11-14 22:24 SGT] In the older-weeks list (rule 9.7) each thing logged gets a tile: a photo tile or a reflection tile. A log with only a line has no tile in the design, so the tiles could show fewer things than the count line says.
- **Impact:** [2026-11-14 22:24 SGT] The list could look like it is missing days. Blocks building that part of rule 9.7.
- **Workaround:** [2026-11-14 22:24 SGT] Owner to decide; a text tile like the reflection tile is the obvious candidate.
- **Resolved:** [2026-11-15 09:03 SGT] Owner: every habit log gets a tile; a log without a photo shows a ✓ habit tile (rule 9.7; its look still to be designed).

### [2026-11-14 22:24 SGT] The connection card's "about the same" band is not chosen
- **Issue:** [2026-11-14 22:24 SGT] The Week so far connection card (rule 9.5) picks its title by comparing this week's answer with the average of the 3 weeks before. Nobody has chosen how close counts as "about the same" (proposed: half a point either way). The titles themselves are a default awaiting the owner's wording.
- **Impact:** [2026-11-14 22:24 SGT] The card can't be built until the owner chooses; the number will live in `src/settings.ts` (rule 1.4).
- **Workaround:** [2026-11-14 22:24 SGT] None needed yet (nothing built). Owner to decide (`docs/CATCH-UP.md`, section 4).
- **Resolved:** [2026-11-15 09:03 SGT] Not needed: the owner dropped the changing titles; the card shows the fixed question and bars only (rule 9.5).

- [2026-11-12 23:24 SGT] Every issue resolved up to 12 Nov 2026 (9 entries) was moved word for word to [docs/archive/KNOWN-ISSUES-resolved-to-2026-11-12.md](archive/KNOWN-ISSUES-resolved-to-2026-11-12.md) (owner approved). New resolved issues go here, newest first.
