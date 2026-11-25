# CATCH-UP sections 4 and 5, as they stood before session 21's rewrite

[2026-11-25 23:18 SGT] Moved word for word from docs/CATCH-UP.md (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-24 23:10 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-24-session-20.md](archive/CATCH-UP-sections-4-5-to-2026-11-24-session-20.md), word for word.

**4a. Latest decisions (session 20, 24 Nov)**
- [2026-11-24 23:56 SGT] **The Demo module** (#63, rules 12.1 to 12.7 in [src/demo/SPEC.md](../src/demo/SPEC.md)): `/demo` (you only) starts a fresh demo parent and the real sign-up without an invite; while it runs your account belongs to the demo and your real reminders pause; `/next` sends each chosen habit's reminder once, then the Wrap Up and the 1 to 5 question; `/demo stop` deletes it, photos first. Waits for migration 015 and the Vercel setting.
- [2026-11-24 23:10 SGT] **My page has your look** (#57): UI decisions L1 to L13 in [docs/CONTEXT.md](CONTEXT.md), Delete in warning red, no dark mode; the stylesheet is allowed by its fingerprint (option A).
- [2026-11-24 23:10 SGT] **Photos are live** (#58, migration 012) with **no photo check** (parked to the backlog) and no "Did you do it?"; consent at the first photo uses a draft wording (known issue).
- [2026-11-24 23:10 SGT] **"Add how you felt" is live** (#59, migration 013; rule 8.4 edit 15): 10 minutes to type the line, once.
- [2026-11-24 23:10 SGT] **The Sunday Wrap Up, the 1 to 5 question and Add a moment are live** (#60, migration 014; rule 8.4 edit 16): first real run **Sunday 29 Nov**; moment receipt "✅ Saved as this week's moment."; View wrap up sends a fresh link.

**4b. For Claude Chat (bring each back as a handoff file, habit H10)**
- [2026-11-15 17:00 SGT] (1) **My page, the rest:** tab 4 Settings (also **withdrawing photo consent**), tab 2 "Habits so far", tab 3 Rewards later; the empty states; the ✓ habit tile (it has a plain frame for now).
- [2026-11-15 17:00 SGT] (2) **Words still to draft:** the B1 drafts in `src/telegram-bot/words.ts`; the Web app drafts in `src/web-app/words.ts`; [2026-11-24 23:10 SGT] the new drafts (photo consent, "no log for this photo", "already has a line", "This photo couldn't be loaded.").
- [2026-11-24 23:10 SGT] (3) **The photo consent wording** for your PDPA reviewer (known issue), with withdrawing consent.

**4c. Questions for you (none block the next build)**
- [2026-11-14 10:38 SGT] **Q12** when the birth year is collected (parked).
- [2026-11-15 11:41 SGT] List order: this week newest first, an older week oldest first (parked).
- [2026-11-24 23:10 SGT] **Next build (your choice):** an older week's own page (rule 9.7); Settings, once designed (with withdrawing photo consent and "delete my data" removing photo files, both needed before real families); or Claude's words (the warm reply, rules 3.11 and 7.5) once the nudge personality is ready.

**4d. Still to design**
- [2026-11-15 17:00 SGT] How the bot records **which child** a log was with (backlog).

**4e. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting; the first alpha experiment; the Terms & Conditions page; [2026-11-24 23:10 SGT] the photo check (backlog).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-24 23:56 SGT] **Switch on the demo:** run migration 015 (the final copy, sent after the reviews); in Vercel add `DEMO_OWNER_TELEGRAM_IDS` = your Telegram user ID (from @userinfobot, not your mobile number), then redeploy; try `/demo`, `/next`, `/demo stop`.
- [2026-11-24 23:10 SGT] **Phone tests:** U63 to U72 ([src/web-app/UAT-week-so-far.md](../src/web-app/UAT-week-so-far.md)), then U73 to U83 ([src/telegram-bot/UAT-session-20.md](../src/telegram-bot/UAT-session-20.md)); U79 to U83 on **Sunday 29 Nov** and Monday.
- [2026-11-24 23:10 SGT] **Merge the end-of-session notes pull request** (H9).
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice; the 90-day record line (K1); **photo consent wording** and withdrawing photo consent; reflections and lines that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before Claude's warm reply (rule 7.5).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates; fill in the Terms & Conditions page.
