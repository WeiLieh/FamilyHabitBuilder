# Catch-up sections 4 and 5, as they stood before session 16

[2026-11-14 10:38 SGT] Moved here word for word when sections 4 and 5 of [docs/CATCH-UP.md](../CATCH-UP.md) were rewritten to open items only (CLAUDE.md, H2 addition).

## 4. Questions to think about before next session

[2026-11-14 00:17 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-14.md](archive/CATCH-UP-sections-4-5-to-2026-11-14.md), word for word.

**4a. Latest decisions (session 15, 13 to 14 Nov)**
- Pull request 3 in three parts: alarm every **10 minutes** (D5); nudges read **"With Mia: Showing affection"**, then an idea you haven't seen, children taking turns (D6, W1); the one **24-hour sign-up reminder** only 7:00 am to 9:30 pm, with **Continue** (D7, W5); words W2 to W7. One sign-up reminder per person, ever.
- Review choices: option A for scale (small fix now; the design for 1,000 to 5,000 parents is in the backlog). Web app design in **Claude Chat**; B1 on a **second branch**; `@anthropic-ai/sdk` re-confirmed for the Claude personality build.

**4b. Questions for you (only if you have a moment; none block the build)**
- [2026-11-14 00:17 SGT] (1) **Web app (Claude Chat):** what My Page shows (logs, the week, photos later) and what Settings changes (times, behaviours, frequency, children's names, pause, Wrap Up time, delete my data); the look (rule 6). Also the two Web app questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md) and how a parent signs in.
- [2026-11-14 00:17 SGT] (2) Draft words still open: "Sorry, we couldn't check when your next reminder is." (screen 11, rule 1.3), and the earlier drafts in `src/telegram-bot/words.ts` marked "draft".
- [2026-11-14 00:17 SGT] (3) Still open from onboarding: **Q5** rename the nine behaviours; **Q9** the bot's name and description; **Q12** when the birth year is collected.

**4c. Still to design (daily loop)**
- [2026-11-14 00:17 SGT] How long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on Claude matching calls ([src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)).

**4d. Parked (you asked me not to raise these first)**
- [2026-11-14 00:17 SGT] "Pause" versus "stop"; whether stopping is as easy as starting (governance); the first alpha experiment (Claude Chat).

---

## 5. Waiting on you (not blocking the next steps)

- [2026-11-14 00:17 SGT] **UAT, next session in Claude Code:** U17 to U27 with your second Telegram account ([checklist](../src/telegram-bot/UAT-onboarding.md)), then **migration 008**, then **009**; send the check results so the fingerprints are recorded.
- [2026-11-14 00:17 SGT] **UAT, evenings:** **U15** Saturday 7:00 pm (✅ Done on that nudge); **U16** Sunday or later (😴 Not today); **U14** any time ([checklist](../src/telegram-bot/UAT-thin-slice-1.md)). Then merge pull request #45 and go live: G1 to G5 and U29 to U39 in [src/telegram-bot/UAT-planner.md](../src/telegram-bot/UAT-planner.md).
- [2026-11-14 00:17 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the `/start` notice (7 days, and now the one sign-up reminder); the 90-day record line (K1); photo consent wording and withdrawing photo consent; reflections that mention the child.
- [2026-11-14 00:17 SGT] **Nudge personality** ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) before Sunday's Claude personality build: tone, and Claude's warm reply after ✅ Done (rule 7.5).
- [2026-11-14 00:17 SGT] Badge graphics and the look of every screen (Web app, setup).
- [2026-11-14 00:17 SGT] **Before launch:** upload MOE school holiday and Singapore public holiday dates (until then every Monday to Friday is a school day).
