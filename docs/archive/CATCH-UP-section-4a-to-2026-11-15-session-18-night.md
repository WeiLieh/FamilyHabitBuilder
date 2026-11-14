# Catch-up section 4a, as it stood before the session 18 night rewrite

[2026-11-15 00:04 SGT] Moved here word for word (CLAUDE.md, H2 addition).

**4a. The Week so far tab (session 18, 14 Nov; recorded in [src/web-app/SPEC.md](../src/web-app/SPEC.md), pull request #49)**
- [2026-11-14 22:24 SGT] **Recorded as rules (your decisions):** 9.2 four tabs (Rewards greyed out), 9.3 sign-in by a one-tap link from Telegram, 9.4 the Week so far page, 9.5 the connection card, 9.6 deleting leaves the log, 9.7 older weeks (4 at a time; each week's own page with only Back). The three layout files are treated as layout, not a look: nothing went into "UI decisions".
- [2026-11-14 22:24 SGT] **To decide (blocks parts of the build):** (1) the card's **titles** ("A closer week", "A steady week", "A week to lean in", "Your starting point", "Sunday's question lands here"): keep or reword? (2) the **"about the same" band** (proposed half a point either way); (3) the **tile for a day with a line but no photo** (a text tile?). Logged in `docs/KNOWN-ISSUES.md`.
- [2026-11-14 22:24 SGT] **Small questions found while recording:** (a) the card's question has a space before "?" and no "(1 = not much, 5 = very)"; is that right, and should Telegram's words change too (rule 5.6)? (b) a log row with a photo **and** a line has one dustbin: does it delete only the photo? (c) a moment that is only a line: what tops the page? (d) with fewer than 3 earlier answers, average what there is? (e) does "View wrap up" open the Week so far tab? (f) should the sizes you chose (20 px titles, 40 px dustbin, 72 px thumbnails) become UI decisions now, or wait for your look?
- [2026-11-14 22:24 SGT] **Datastore draft ([src/datastore/SPEC.md](../src/datastore/SPEC.md), "what the Web app pages need"):** approve the three reads and the narrow deletes; for a deleted reflection or moment line, remove the row or blank its text?; is "delete one moment" one button? And first, the parked question: how the Web app reaches the database (server with the master key, or limited per-parent access).
- [2026-11-14 22:24 SGT] **Leave for now (you said so):** this week newest first, an older week oldest first.

