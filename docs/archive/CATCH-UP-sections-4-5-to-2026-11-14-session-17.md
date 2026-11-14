# Catch-up sections 4 and 5, as they stood before session 17's rewrite

[2026-11-14 21:40 SGT] Moved here word for word (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-14 10:38 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-14-session-16.md](archive/CATCH-UP-sections-4-5-to-2026-11-14-session-16.md), word for word.

**4a. Latest decisions (session 16, 14 Nov)**
- [2026-11-14 13:48 SGT] **B1 agreed:** Undo for 10 minutes, a late tap removes the button with "Undo expired." (no sweep); /log has no Undo and shows only chosen behaviours; migration 010 so old buttons can be removed; the Menu shows /pause or /resume, whichever applies; "Resume your reminders?"; the /help draft. Tests agreed (Telegram bot spec, "Build: B1").
- [2026-11-14 10:38 SGT] Onboarding UAT U17 to U27 passed; U28 skipped. **Fix:** when a screen is sent again ("Welcome back", Continue), remove the old copy's buttons. **Keep:** the "pick up to 2" pop-up box. Migrations 008 and 009 applied. Today: Web app and message readability in Claude Chat; B1 in Claude Code.

**4b. For Claude Chat today (bring each back as a handoff file, habit H10)**
- [2026-11-14 10:38 SGT] (1) **Web app:** what My Page shows (logs, the week, photos later) and what Settings changes (times, behaviours, frequency, children's names, pause, Wrap Up time, delete my data); the look (rule 6: "UI decisions" in `docs/CONTEXT.md` is still empty); the two Web app questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md); how a parent signs in.
- [2026-11-14 10:38 SGT] (2) **Readable bot messages:** the words are right but dense. Decide the house style: line breaks, **bold** for the behaviour, emoji, short lines, where buttons go. Today's screenshots (screens 1 to 11) are a good starting point. The words live in `src/telegram-bot/words.ts`.
- [2026-11-14 12:12 SGT] (3) **Reminder:** when you refine the messages, also go over the **/help** text Claude drafts in the B1 build (B1-D2).

**4c. Questions for you (only if you have a moment; none block the build)**
- [2026-11-14 10:38 SGT] (1) Draft words still open: "Sorry, we couldn't check when your next reminder is." (screen 11, rule 1.3), and the earlier drafts in `src/telegram-bot/words.ts` marked "draft" (could be settled with item 4b (2)).
- [2026-11-14 10:38 SGT] (2) Still open from onboarding: **Q5** rename the nine behaviours; **Q9** the bot's name and description; **Q12** when the birth year is collected.

**4d. Still to design (daily loop)**
- [2026-11-14 10:38 SGT] How long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on Claude matching calls ([src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)).

**4e. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting (governance); the first alpha experiment (Claude Chat).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-14 10:38 SGT] **UAT, today and Sunday:** **U15** today 7:00 pm (✅ Done on your own account's nudge); **U16** Sunday or later (😴 Not today); **U14** any time ([checklist](../src/telegram-bot/UAT-thin-slice-1.md)). Then merge pull request #45 and go live: G1 to G5 and U29 to U39 in [src/telegram-bot/UAT-planner.md](../src/telegram-bot/UAT-planner.md).
- [2026-11-14 10:38 SGT] **Test account:** log out of the second Telegram account on your phone when you're done (its owner agreed to the test); Claude can write a removal script for the Test Parent record later, shown to you first.
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice (7 days, and the one sign-up reminder); the 90-day record line (K1); photo consent wording and withdrawing photo consent; reflections that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before Sunday's Claude personality build: tone, and Claude's warm reply after ✅ Done (rule 7.5).
- [2026-11-14 10:38 SGT] Badge graphics and the look of every screen (Web app, setup).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates (until then every Monday to Friday is a school day).
