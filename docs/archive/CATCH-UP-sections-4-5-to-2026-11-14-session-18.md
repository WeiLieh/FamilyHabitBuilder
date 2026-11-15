# Catch-up sections 4 and 5, as they stood before session 18's rewrite

[2026-11-14 22:24 SGT] Moved here word for word (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-14 21:40 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-14-session-17.md](archive/CATCH-UP-sections-4-5-to-2026-11-14-session-17.md), word for word.

**4a. Latest decisions (session 17, 14 Nov)**
- [2026-11-14 21:40 SGT] **B1 built and live:** the keyboard, /log, Undo for 10 minutes, the Menu, /help, the "Welcome back" fix (pull request #47, merged; migration 010 applied). **B1-D10:** the sign-up draft keeps only its latest screen's number, replaced per screen. Review fixes: all four chosen (K8 "Already saved.", tests K9 and K10, the migration comment, a known issue).
- [2026-11-14 21:40 SGT] **The planner is live:** #45 merged, the alarm runs every 10 minutes (Supabase Cron, new cron secret). U15 and U16 replaced by U31 and U35. #46 closed (its notes came with #47).
- [2026-11-14 21:40 SGT] **Test accounts:** your old thin-slice record and Test Parent deleted; you signed up again (child "Riley"). Only your record is left. The bot's name stays "FamilyBuddy (Test)" (Q9 open).

**4b. For Claude Chat (bring each back as a handoff file, habit H10)**
- [2026-11-14 10:38 SGT] (1) **Web app:** what My Page shows (logs, the week, photos later) and what Settings changes (times, behaviours, frequency, children's names, pause, Wrap Up time, delete my data); the look (rule 6: "UI decisions" in `docs/CONTEXT.md` is still empty); the two Web app questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md); how a parent signs in.
- [2026-11-14 10:38 SGT] (2) **Readable bot messages:** the words are right but dense. Decide the house style: line breaks, **bold** for the behaviour, emoji, short lines, where buttons go. The words live in `src/telegram-bot/words.ts`.
- [2026-11-14 21:40 SGT] (3) **Also for the readability work:** the B1 drafts marked "draft" in `words.ts` (the /log question, the link replies, "already paused/on", "back on", "stay paused", the Menu's five descriptions), the /help text (B1-D9), and "Sorry, we couldn't check when your next reminder is." Two notes from today's UAT: for a parent with no habits, /help still says "keyboard below"; "Undo expired." and "You can pick up to 2." are boxes with OK (a fading banner is a one-word change).

**4c. Questions for you (only if you have a moment; none block the next build)**
- [2026-11-14 10:38 SGT] Still open from onboarding: **Q5** rename the nine behaviours; **Q9** the bot's name and description; **Q12** when the birth year is collected.

**4d. Still to design (daily loop)**
- [2026-11-14 10:38 SGT] How long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on Claude matching calls ([src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)).

**4e. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting (governance); the first alpha experiment (Claude Chat).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-14 21:40 SGT] **UAT still to run** (full list: the four checklists in `src/telegram-bot/`): tomorrow morning **U40** and **U41** (/help, then the first keyboard log of the day, before logging anything); at the next reminder **U45** (tap the habit on the keyboard, not ✅ Done) and **U33** (a different idea); another day **U35** and **U46** (😴 Not today, then a keyboard log); any time **U14** (reply speed); optional **U52**, **U53** (pause yourself with one SQL line). Not possible now: U34 (needs 2+ children), U36, U37 (need a second Telegram account).
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice (7 days, and the one sign-up reminder); the 90-day record line (K1); photo consent wording and withdrawing photo consent; reflections that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before the Claude personality build: tone, and Claude's warm reply after ✅ Done (rule 7.5).
- [2026-11-14 10:38 SGT] Badge graphics and the look of every screen (Web app, setup).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates (until then every Monday to Friday is a school day).
