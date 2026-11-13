# Catch-up page, sections 4 and 5 as they stood on 12 Nov 2026

[2026-11-14 00:17 SGT] Moved word for word from [docs/CATCH-UP.md](../CATCH-UP.md) when sections 4 and 5 were rewritten to open items only at the end of session 15 (CLAUDE.md, H2 addition). Nothing was reworded.

## 4. Questions to think about before next session

[2026-11-12 23:29 SGT] **Rewritten in session 14 to hold only what is still open.** The earlier version of this section (sessions 9 to 13, with questions since answered) is in [docs/archive/CATCH-UP-section-4-to-2026-11-12.md](archive/CATCH-UP-section-4-to-2026-11-12.md), word for word. The decisions themselves live in the specs and in the change notes of [docs/SPEC.md](SPEC.md).

**4a. Latest decisions (session 13, 12 Nov)**
- Scheduler for pull request 3: **Supabase Cron** (your 24 Oct choice, confirmed). PDPA wording stays a placeholder until you go live.
- Onboarding build decisions: D1 the true 7:00 pm time until pull request 3 (temporary); D2 no Skip on screen 5 without a quick pick; D3 screen 8 title "From what you chose, your reminders are:"; D4 the clean-up runs daily from now on. Placeholder pages My Page and Settings. Review fixes F1 to F5 done; known issues K1 to K5 recorded.

**4b. Questions for you (only if you have a moment; none block the build)**
- [2026-11-12 23:29 SGT] (1) K1: take the 90-day record line to your PDPA reviewer, together with **Q8** (agreement wording) and the 7-day line.
- [2026-11-12 23:29 SGT] (2) The draft wordings in `src/telegram-bot/words.ts` marked "draft" (for example "Picked: …", "Sorry, Start right now couldn't be shown. You're signed up.").
- [2026-11-12 23:29 SGT] (3) Still open from the onboarding design: **Q5** rename the nine behaviours; **Q9** the bot's name and description; **Q12** when the birth year is collected.

**4c. Still to design (daily loop)**
- [2026-11-12 23:29 SGT] How long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on Claude matching calls ([src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)).

**4d. Parked (you asked me not to raise these first)**
- [2026-11-12 23:29 SGT] "Pause" versus "stop"; pausing before the Web app exists; whether stopping is as easy as starting (governance); Web app sign-in; the two Web app questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md); the first alpha experiment (Claude Chat).

---

## 5. Waiting on you (not blocking the next steps)

[2026-11-12 23:31 SGT] **Rewritten in session 14 to hold only what is still waiting.** Finished items and asks already answered are in [docs/archive/CATCH-UP-section-5-to-2026-11-12.md](archive/CATCH-UP-section-5-to-2026-11-12.md), word for word.

- [2026-11-12 23:20 SGT] **UAT, onboarding** ([checklist](../src/telegram-bot/UAT-onboarding.md)): S1 (Vercel deploy) to S5 (migration 008), U17 to U28. Use a second Telegram account (S3a), or ask Claude for a removal script for your test parent (S3b).
- [2026-11-12 23:31 SGT] **UAT, thin slice 1, still to report:** U12, U14, U15, U16 ([checklist](../src/telegram-bot/UAT-thin-slice-1.md)).
- [2026-11-12 23:31 SGT] **PDPA reviewer, one combined list:** agreement wording (Q8) and the 7-day line at `/start`; the 90-day record line (K1); photo consent wording and withdrawing photo consent (PDPA section 16); reflections that mention the child.
- Nudge personality ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)), which now also guides Claude's validation replies (rule 7.5); context collected from parents; how much free chat the bot supports
- Badge graphics and the look of every screen (Web app, setup)
- **Before launch:** upload MOE school holiday and Singapore public holiday dates
- [2026-10-31 19:18 SGT] First alpha experiment (plans in [src/experiments/EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md))
