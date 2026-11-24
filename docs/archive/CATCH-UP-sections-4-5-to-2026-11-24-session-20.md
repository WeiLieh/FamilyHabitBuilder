# CATCH-UP sections 4 and 5, as they stood before session 20's rewrite

[2026-11-24 23:10 SGT] Moved here word for word (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-15 17:00 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-15-session-19.md](archive/CATCH-UP-sections-4-5-to-2026-11-15-session-19.md), word for word.

**4a. Latest decisions (session 19, 15 Nov)**
- [2026-11-15 22:36 SGT] **Week so far built in plain HTML** (#55, deployed 15 Nov late evening; no look yet, rule 6): header, the moment, days logged with the M to S strip and logs newest first, reflections, the connection card (browser bars), older weeks list and button (at most a year per load), tab bar; dustbins with "Are you sure?" on its own page (**Cancel**, **Delete**; wireframe A). Photos and an older week's own page later (owner).
- [2026-11-15 21:53 SGT] **My page sign-in is live** (15 Nov evening): #51, #52 and the iPhone fix #53 merged, migration 011 applied, UAT U56 to U62 pass ([src/web-app/UAT-sign-in.md](../src/web-app/UAT-sign-in.md)). Supabase's legacy JWT secret must stay un-revoked (backlog: our own signing key).
- [2026-11-15 17:00 SGT] **Web app foundations built** in two pull requests: #51 (merged: migration 011, sign-in tables, per-parent access, the three reads, the four deletes) and #52 (open: `/mypage` link, one-button page, protected cookie, the 10-minute per-parent pass, Sign out). The pass is **option A**, a signed pass checked by Row Level Security ([docs/CONTEXT.md](CONTEXT.md)).
- [2026-11-15 17:00 SGT] While building: a log row shows **no child** for now (backlog item); the older-weeks list includes **every week since joining**.
- [2026-11-15 17:00 SGT] Daily loop: the bot waits **10 minutes** for a photo; if Claude fails, **the receipt only** (no fixed reply, rule 1.3 unchanged); withdrawing photo consent goes on **Settings**; at most **20 matching calls** per parent a day ([src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)).
- [2026-11-15 17:00 SGT] UAT for B1 and the planner **closed** by the owner; Q5 and Q9: keep the names.

**4b. For Claude Chat (bring each back as a handoff file, habit H10)**
- [2026-11-15 17:00 SGT] (1) **My page, the rest:** tab 4 Settings (now also **withdrawing photo consent**), tab 2 "Habits so far", tab 3 Rewards later; the empty states (a quiet week, no photo, a first-ever week, **an empty older week**, no older weeks); the ✓ habit tile; the look (rule 6).
- [2026-11-15 17:00 SGT] (2) **Words still to draft:** "View wrap up"; the B1 drafts in `src/telegram-bot/words.ts`; the sign-in pages' drafts in `src/web-app/words.ts` ("Tap the button to open your page.", "You're signed out." and the rest).

**4c. Questions for you (none block the next build)**
- [2026-11-14 10:38 SGT] Still open from onboarding: **Q12** when the birth year is collected.
- [2026-11-15 11:41 SGT] List order: this week newest first, an older week oldest first (you: leave it for now).

**4d. Still to design**
- [2026-11-15 17:00 SGT] How the bot records **which child** a log was with (backlog), so My page can show it.

**4e. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting (governance); the first alpha experiment (Claude Chat); [2026-11-15 17:00 SGT] the Terms & Conditions page (backlog).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-15 22:36 SGT] **Phone tests U63 to U69** for Week so far ([src/web-app/UAT-week-so-far.md](../src/web-app/UAT-week-so-far.md)): sign in with `/mypage`, look at your week, try 🗑 then Cancel, 🗑 then Delete on a line you don't mind losing, the older-weeks button, each tab.
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice (7 days, and the one sign-up reminder); the 90-day record line (K1); photo consent wording and withdrawing photo consent; reflections that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before the Claude personality build: tone, and Claude's warm reply after ✅ Done (rule 7.5).
- [2026-11-14 10:38 SGT] Badge graphics and the look of every screen (Web app, setup).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates (until then every Monday to Friday is a school day).
