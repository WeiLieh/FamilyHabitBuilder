# Catch-up page: read this first after time away

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/CATCH-UP-superseded.md](archive/CATCH-UP-superseded.md) to keep this file short (owner approved).

**Last updated: [2026-11-12 23:29 SGT]** (session 14: long files shortened, sections 4 and 5 rewritten to open items only. Session 13: **the full onboarding is built and merged** (#40), scheduler chosen: Supabase Cron; next session is a **build** session).

> [2026-11-12 23:20 SGT] **⏰ Next session (you asked to build first):** (1) quickly: your UAT results U12, U14, U15, U16, and the onboarding ones U17 to U28 if you ran them ([checklist](../src/telegram-bot/UAT-onboarding.md)); (2) have you run **migration 008**? (3) then Claude builds **pull request 3 of 3: the planner live on Supabase Cron**: the 30-minute alarm, your own behaviours and times instead of the fixed 7:00 pm "Showing affection", the 24-hour sign-up reminder, and removing the temporary 7:00 pm wording. Claude shows you the tests in plain English first. The bot is still for you only.

Contents: 1. Module map · 2. Modules: purpose, files and tests · 3. Rules: where each one lives · 4. Questions to think about before next session · 5. Waiting on you

---

## 1. Module map

The modules from your architecture diagram, coloured by progress (9 since 31 Oct: Experiments added [2026-10-31 19:06 SGT]). Numbers match the table in section 2.

[2026-10-31 09:40 SGT] The module map now lives in one place: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** (also the source of each module's status, checked by the drift test).

**Colours:** [2026-11-11 17:48 SGT] green = built (status starts with "Built"); yellow = in design or partly built; grey = not started. The drift test checks each box's colour fits its status (rule D4).

[2026-11-12 23:20 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **19 tables live, migrations up to 007** (008 written) → (3) Telegram bot ⬅ **onboarding built and merged 12 Nov (#40)**; next pull request 3, the planner live on Supabase Cron; group C (Settings on the Web app) still to design → (4) Variable rewards, then Nudge engine words (Claude's replies) → (5) Photo check → (6) Telemetry → (7) Web app.

---

## 2. Modules: purpose, files and tests

[2026-10-31 10:17 SGT] Each module's purpose, its files and what each one does, and which tests check it are in the module's own spec, next to its code. Status is in the diagram ([docs/ARCHITECTURE.md](ARCHITECTURE.md)).

| Module | Spec |
|---|---|
| Telegram bot | [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md) |
| Nudge engine | [src/nudge-engine/SPEC.md](../src/nudge-engine/SPEC.md) (and its AI personality, [NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)) |
| Nudge repository | [src/nudge-repository/SPEC.md](../src/nudge-repository/SPEC.md) |
| Photo check | [src/photo-check/SPEC.md](../src/photo-check/SPEC.md) |
| Variable rewards | [src/variable-rewards/SPEC.md](../src/variable-rewards/SPEC.md) (and its working design, [DESIGN.md](../src/variable-rewards/DESIGN.md)) |
| Datastore | [src/datastore/SPEC.md](../src/datastore/SPEC.md) |
| Web app | [src/web-app/SPEC.md](../src/web-app/SPEC.md) |
| Telemetry | [src/telemetry/SPEC.md](../src/telemetry/SPEC.md) |
| Experiments | [src/experiments/SPEC.md](../src/experiments/SPEC.md) (added 31 Oct) and its plain-English plans, [EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md) |

Cross-cutting files (`src/settings.ts`, `src/sgt.ts`, `api/health.ts` and the test helpers) are listed in [docs/SPEC.md](SPEC.md), section "Modules and structure".

---

## 3. Rules: where each one lives

[2026-11-01 16:38 SGT] Every rule is written **once**, with its permanent ID, and each module spec starts with a "rules at a glance" list.
- **1.1 to 1.5** (users, Singapore time, no fallbacks, numbers live once in code with five kinds, "delete my data" reaches every store): [docs/SPEC.md](SPEC.md), "Cross-cutting rules"
- **2.1 to 2.5, 3.1 to 3.13**: [Nudge engine](../src/nudge-engine/SPEC.md)
- **4.1 to 4.7**: [Nudge repository](../src/nudge-repository/SPEC.md)
- **5.1, 5.3, 5.4, 5.6 to 5.10, 3.14**: [Telegram bot](../src/telegram-bot/SPEC.md) (and the onboarding decisions of 12 Nov, section "Recorded: group A finished") · **5.2, 10.1 to 10.4**: [Telemetry](../src/telemetry/SPEC.md) · **5.5, 8.1 to 8.13**: [Datastore](../src/datastore/SPEC.md) (the 19 tables are listed there, under "Tables")
- **6.1, 6.2**: [Photo check](../src/photo-check/SPEC.md)
- **7.1 to 7.8**: [Variable rewards](../src/variable-rewards/SPEC.md)
- **9.1**: [Web app](../src/web-app/SPEC.md) (plus two parked questions)
- **11.1 to 11.13**: [Experiments](../src/experiments/SPEC.md); the values (38 in use) and their five kinds are in [EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md)
- Structure rules (S, R, D, B, P) and retired rule IDs: [docs/SPEC.md](SPEC.md), "Modules and structure"

---

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
