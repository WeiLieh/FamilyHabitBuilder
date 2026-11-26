# CATCH-UP sections 4 and 5, as they were before session 22's rewrite

[2026-11-26 23:03 SGT] Moved word for word from `docs/CATCH-UP.md` (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-25 23:18 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-25-session-21.md](archive/CATCH-UP-sections-4-5-to-2026-11-25-session-21.md), word for word.

**4a. Latest decisions (session 21, 25 Nov)**
- [2026-11-25 23:18 SGT] **Settings is live** (#64 to #66, rule 9.9 in [src/web-app/SPEC.md](../src/web-app/SPEC.md)): your wireframe's four groups; the Wrap Up has a time only (rule 3.12 won); pausing works both ways and Telegram says so (rule 5.7); /settings opens Settings; after a Behaviours save the bot sends the new habit buttons; delete my data removes the photo files first.
- [2026-11-25 23:18 SGT] **The Sunday Wrap Up counts any activity** (a log, a reflection or a moment, rule 3.12), in the Demo too.
- [2026-11-25 23:18 SGT] **Four known issues accepted:** the bot token in the Web app; a delete stopping halfway; the Menu after a delete; "Saved." on a shared phone.

**4b. For you to decide**
- [2026-11-25 23:18 SGT] **Automating the phone tests:** a desktop-app session with browser control driving Telegram Web (most Telegram and Settings tests), and/or Playwright tests for My page here (needs a fresh sign-in link each run). Phone-only and clock-based tests stay with you.
- [2026-11-25 23:18 SGT] **Step 2, the look:** the Settings switch and tick boxes (accent green?), row heights, the Back header, text boxes, the underlined Remove, the ✓ habit tile, the empty states (list in `docs/KNOWN-ISSUES.md`).
- [2026-11-25 23:18 SGT] **Step 3, Habits so far:** layout wireframes first (rule 9.2 says only "show me we're growing"), then a high-fidelity mock-up shown only to you.

**4c. Still for Claude Chat (bring each back as a handoff file, habit H10)**
- [2026-11-15 17:00 SGT] Tab 2 "Habits so far", tab 3 Rewards later; the empty states; the ✓ habit tile.
- [2026-11-24 23:10 SGT] Words still to draft (B1 drafts, Web app drafts, the photo-consent and "Saved." lines), and **the photo consent wording** for your PDPA reviewer.

**4d. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting; the first alpha experiment; the Terms & Conditions page; [2026-11-24 23:10 SGT] the photo check (backlog); [2026-11-14 10:38 SGT] Q12 when the birth year is collected; [2026-11-15 11:41 SGT] list order; how the bot records which child a log was with.

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-25 23:18 SGT] **The testing backlog, in order:** Settings U84 to U98 ([src/web-app/UAT-settings.md](../src/web-app/UAT-settings.md); U97 with a test account only); Week so far U63 to U72 ([src/web-app/UAT-week-so-far.md](../src/web-app/UAT-week-so-far.md)); photos and lines U73 to U78, then **Sunday 29 Nov** U79 to U82 and Monday U83 ([src/telegram-bot/UAT-session-20.md](../src/telegram-bot/UAT-session-20.md)); the Demo (add `DEMO_OWNER_TELEGRAM_IDS` in Vercel, then `/demo`, `/next`, `/demo stop`); older U45, U46, U53 ([src/telegram-bot/UAT-b1.md](../src/telegram-bot/UAT-b1.md)), U33, U35 ([src/telegram-bot/UAT-planner.md](../src/telegram-bot/UAT-planner.md)). Retired: U49, U52.
- [2026-11-25 23:18 SGT] **Merge the end-of-session notes pull request** (H9).
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice; the 90-day record line (K1); photo consent wording and withdrawing it ([2026-11-25 23:18 SGT] Settings now says "to withdraw it, delete your data"); reflections and lines that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before Claude's warm reply (rule 7.5).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates; fill in the Terms & Conditions page.
