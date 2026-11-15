# Catch-up sections 4 and 5, as they stood before the session 18 end rewrite

[2026-11-15 11:41 SGT] Moved here word for word (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-14 22:24 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-14-session-18.md](archive/CATCH-UP-sections-4-5-to-2026-11-14-session-18.md), word for word.

**4a. The Week so far tab: what's left** ([2026-11-15 09:03 SGT]; earlier version in [docs/archive/CATCH-UP-section-4a-to-2026-11-15-session-18-morning.md](archive/CATCH-UP-section-4a-to-2026-11-15-session-18-morning.md))
- [2026-11-15 09:03 SGT] **All decisions are now in the rules** (9.3 to 9.7 in [src/web-app/SPEC.md](../src/web-app/SPEC.md); change note 1.26). No sizes recorded as UI decisions (your choice, 15 Nov).
- [2026-11-15 09:31 SGT] **Before the Week so far tab can be built: both answered (15 Nov).** Per-parent access (rule 9.8); the Datastore reads and deletes approved ([src/datastore/SPEC.md](../src/datastore/SPEC.md)). Next for the Web app: the build plan and its tests in plain English, when you ask for it.
- SUPERSEDED [2026-11-15 09:31 SGT] [2026-11-15 09:03 SGT] **Before the Week so far tab can be built:** (1) how the Web app reaches the database (server with the master key, or limited per-parent access); (2) approve the Datastore draft (three reads, rule 8.4 edits 11 to 13).
- [2026-11-15 09:20 SGT] **For the UI design work:** three details I filled in (small tiles in the older-weeks list; zero parts left out of the count line; the Sunday-evening moment at the top). "Wireframe by default" is now a standing rule in `CLAUDE.md` (rule 6).
- SUPERSEDED [2026-11-15 09:20 SGT] [2026-11-15 09:03 SGT] **Still open, not blocking:** the ✓ habit tile's look; list order (you: leave it for now); write "wireframe by default" into `CLAUDE.md`?

**4b. For Claude Chat (bring each back as a handoff file, habit H10)**
- [2026-11-14 22:24 SGT] (1) **My page, the rest:** tab 2 "Habits so far" (steady weeks, Wrap Up counts, the monthly view, trends), tab 4 Settings, tab 3 Rewards later; the empty states (a quiet week, no photo, a first-ever week, no older weeks); monthly grouping; "With us since"; the look (rule 6). Backlog entries added.
- [2026-11-14 10:38 SGT] (2) **Readable bot messages:** the words are right but dense. Decide the house style: line breaks, **bold** for the behaviour, emoji, short lines, where buttons go. The words live in `src/telegram-bot/words.ts`.
- [2026-11-14 21:40 SGT] (3) **Also for the readability work:** the B1 drafts marked "draft" in `words.ts` (the /log question, the link replies, "already paused/on", "back on", "stay paused", the Menu's five descriptions), the /help text (B1-D9), and "Sorry, we couldn't check when your next reminder is." Two notes from today's UAT: for a parent with no habits, /help still says "keyboard below"; "Undo expired." and "You can pick up to 2." are boxes with OK (a fading banner is a one-word change).
- [2026-11-14 22:24 SGT] (4) **New words for "✅ Saved to your album."** ("album" is dropped, rule 7.7 note).
- [2026-11-15 00:04 SGT] (5) **The "View wrap up" label:** it always opens Week so far, so on Monday it shows the new week; a label such as "Open My page" may fit better.

**4c. Questions for you (only if you have a moment; none block the next build)**
- [2026-11-14 10:38 SGT] Still open from onboarding: **Q5** rename the nine behaviours; **Q9** the bot's name and description; **Q12** when the birth year is collected.

**4d. Still to design (daily loop)**
- [2026-11-14 10:38 SGT] How long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on Claude matching calls ([src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)).

**4e. Parked (you asked me not to raise these first)**
- [2026-11-14 10:38 SGT] "Pause" versus "stop"; whether stopping is as easy as starting (governance); the first alpha experiment (Claude Chat).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-14 22:24 SGT] **Pull request #49** (the Week so far tab, recorded only): review; it is not merged.
- [2026-11-14 21:40 SGT] **UAT still to run** (full list: the four checklists in `src/telegram-bot/`): tomorrow morning **U40** and **U41** (/help, then the first keyboard log of the day, before logging anything); at the next reminder **U45** (tap the habit on the keyboard, not ✅ Done) and **U33** (a different idea); another day **U35** and **U46** (😴 Not today, then a keyboard log); any time **U14** (reply speed); optional **U52**, **U53** (pause yourself with one SQL line). Not possible now: U34 (needs 2+ children), U36, U37 (need a second Telegram account).
- [2026-11-14 10:38 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice (7 days, and the one sign-up reminder); the 90-day record line (K1); photo consent wording and withdrawing photo consent; reflections that mention the child.
- [2026-11-14 10:38 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before the Claude personality build: tone, and Claude's warm reply after ✅ Done (rule 7.5).
- [2026-11-14 10:38 SGT] Badge graphics and the look of every screen (Web app, setup).
- [2026-11-14 10:38 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates (until then every Monday to Friday is a school day).
