# CATCH-UP sections 4 and 5, as they were before [2026-11-15 17:00 SGT]

Moved word for word from `docs/CATCH-UP.md` (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-15 11:41 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-15-session-18-end.md](archive/CATCH-UP-sections-4-5-to-2026-11-15-session-18-end.md), word for word.

**4a. Latest decisions (session 18, 14 and 15 Nov)**
- [2026-11-15 11:41 SGT] **Web app, Week so far:** rules 9.2 to 9.8 in [src/web-app/SPEC.md](../src/web-app/SPEC.md): four tabs; sign-in by a one-time, 5-minute link with one button press (30-day protected sign-in, ended by Sign out and delete my data); layout B2 (the strip, then every log newest first, every photo big); the connection card as the fixed question and 4 weekly bars ("–" without a rating); one dustbin, one layer per tap, "Are you sure?"; older weeks with a tile for every log and the moment first; **per-parent access (Row Level Security)**. Wireframes: `docs/handoffs/2026-11-14-web-app-wireframes-session-18/`.
- [2026-11-15 11:41 SGT] **Datastore:** the three minimal reads and rule 8.4 edits 6 and 11 to 13 approved ([src/datastore/SPEC.md](../src/datastore/SPEC.md)).
- [2026-11-15 11:41 SGT] **Telegram bot:** house style C (rule 5.15) and a random reaction on keyboard taps (rule 5.14), live since #50.

**4b. For Claude Chat (bring each back as a handoff file, habit H10)**
- [2026-11-15 11:41 SGT] (1) **My page, the rest:** tab 4 Settings, tab 2 "Habits so far" (steady weeks, Wrap Up counts, the monthly view, trends), tab 3 Rewards later; the empty states (a quiet week, no photo, a first-ever week, no older weeks); the ✓ habit tile; the look (rule 6), including three details to confirm (small tiles in the older-weeks list; zero parts left out of the count line; the Sunday-evening moment at the top).
- [2026-11-15 11:41 SGT] (2) **Words still to draft:** "✅ Saved to your album." ("album" is dropped, rule 7.7 note); the "View wrap up" label (it always opens Week so far); the B1 drafts marked "draft" in `words.ts`.

**4c. Questions for you (only if you have a moment; none block the next build)**
- [2026-11-14 10:38 SGT] Still open from onboarding: **Q5** rename the nine behaviours; **Q9** the bot's name and description; **Q12** when the birth year is collected.
- [2026-11-15 11:41 SGT] List order: this week newest first, an older week oldest first (you: leave it for now).

**4d. Still to design (daily loop)**
- [2026-11-14 10:38 SGT] How long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on Claude matching calls ([src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)).

**4e. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting (governance); the first alpha experiment (Claude Chat).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-15 11:41 SGT] **Merge #49** (the Web app decisions and this session's notes).
- [2026-11-15 11:41 SGT] **Before any real family:** fill in the **Terms & Conditions** page (`public/terms.html`; known issue).
- [2026-11-15 11:41 SGT] **UAT still to run:** the reminder's new style C layout at your next reminder; **U45** (tap the habit on the keyboard instead of ✅ Done) and **U33** (a different idea); another day **U35** and **U46** (😴 Not today, then a keyboard log); optional **U52**, **U53**. Not possible now: U34, U36, U37.
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice (7 days, and the one sign-up reminder); the 90-day record line (K1); photo consent wording and withdrawing photo consent; reflections that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before the Claude personality build: tone, and Claude's warm reply after ✅ Done (rule 7.5).
- [2026-11-14 10:38 SGT] Badge graphics and the look of every screen (Web app, setup).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates (until then every Monday to Friday is a school day).
