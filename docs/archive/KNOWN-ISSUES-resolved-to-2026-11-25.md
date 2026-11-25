# Known issues resolved on 25 Nov 2026

[2026-11-25 23:20 SGT] Moved word for word from docs/KNOWN-ISSUES.md, each with its dated resolution line (owner approved: "yes move to archive").

### [2026-11-08 22:34 SGT] Withdrawing photo consent has no flow yet
- [2026-11-15 12:13 SGT] Owner (15 Nov): it goes on **Settings** (tab 4 of My page); raise it when the Settings designs arrive from Claude Chat.
- [2026-11-09 17:44 SGT] Owner (9 Nov): agreed, design it with group C.
- **Issue:** [2026-11-08 22:34 SGT] Photo consent is now asked at the first photo (rule 5.5), so it can be withdrawn on its own, without leaving the app. There is no design for withdrawing it (stop asking for photos; keep or delete the photos already sent). Singapore's Personal Data Protection Act (PDPA) section 16 (withdrawing consent) applies (privacy review of the Telegram onboarding design, 3 Nov; owner agreed to log it on 8 Nov).
- **Impact:** [2026-11-08 22:34 SGT] None yet (no photos). Needed before real families send photos.
- **Workaround:** [2026-11-08 22:34 SGT] Design it with group C (Settings on the Web app, with the photo store); take PDPA section 16 to the owner's PDPA reviewer.
- [2026-11-25 23:20 SGT] **Resolved** (owner, 25 Nov): Settings, What we record (rule 9.9) says photos are part of how the service works, so to withdraw consent the parent deletes their data, which Settings now offers. The wording itself stays with the PDPA reviewer ("The photo consent wording is a draft", still open).

### [2026-11-01 16:32 SGT] "Delete my data" doesn't yet remove photos and chat memory
- **Update:** [2026-11-24 23:43 SGT] When "delete my data" is built, it must also remove the owner's **demo parent's photo files** first (Demo module): the database deletes a demo parent's rows with its owner (migration 015), but not its files (privacy review of the Demo module).
- **Issue:** [2026-11-01 16:32 SGT] Rule 8.5 order is photos, then chat memory, then rows, then the log. The database function only does the rows and the log; the photo store and chat memory are not built yet (both reviews).
- **Impact:** [2026-11-01 16:32 SGT] None yet (no photos or chat memory exist). If the rows were deleted first, photos would be left with no owner.
- **Workaround:** [2026-11-01 16:32 SGT] Build the photo and chat-memory steps with the Photo check and Telegram bot, before any real photos (already in the backlog: "delete my data" built once).
- [2026-11-25 23:20 SGT] **Resolved** (25 Nov): Settings' "Delete my data" removes every photo file first and the database refuses the delete otherwise (migration 016, tests T142, T143, SE10). Chat memory (Upstash Redis) is not built, so nothing of it exists to remove; rule 1.5 says so.

### [2026-10-31 14:47 SGT] No real families may send photos until consent and "delete my data" are built
- **Issue:** [2026-10-31 14:47 SGT] Photo consent at sign-up and the "delete my data" function exist only as specs, not as code (found by the privacy and security review of PR #11; owner agreed to log it).
- **Impact:** [2026-10-31 14:47 SGT] Photos may show children. Collecting them without recorded consent or a working way to delete them would break the agreed privacy rules and the Singapore Personal Data Protection Act (PDPA) expectations.
- **Workaround:** [2026-10-31 14:47 SGT] Do not onboard real families or accept real photos until both are built and tested. Testing with the owner's own sample photos is fine.
- [2026-11-25 23:20 SGT] **Resolved** (25 Nov): photo consent (at the first photo, #58) and "delete my data" with photo files (Settings, #64) are both built. Other gates before real families stay open as their own entries: the Terms & Conditions page and the PDPA reviewer's wording.
