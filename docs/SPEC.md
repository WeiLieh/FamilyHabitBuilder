# SPEC: Family Habit App (Minimum Viable Product (MVP))

Every entry carries a date/time prefix (see CLAUDE.md). This file is `docs/SPEC.md`.

## Goal
- [2026-10-24 17:24 SGT] A gamified app that nudges parents to build small, regular habits that strengthen family bonds. The nudge "brain" follows Nir Eyal's Hooked model: Trigger, Action, Variable Reward, Investment.
- [2026-10-24 17:24 SGT] Two interfaces: a Telegram bot (thin layer, main place to receive nudges and log behaviour) and a web page (login, history, progress, rewards, experience points (XP)).
- [2026-10-24 17:24 SGT] This is also a learning project (AI-assisted development) and an experiment platform: test with friends which nudges, rewards and delivery work best.

## Users
- [2026-10-24 17:24 SGT] Parents with children aged 7 to 12. Two parents in one household are separate users in the MVP.
- [2026-10-24 17:24 SGT] Start with about 10 friends, capacity for 50 trial users, modular so it can scale later.

## Constraints
- [2026-10-24 17:24 SGT] **Modules:** Telegram bot; nudge engine ("brain" plus experiments); nudge repository (the 9 actions as data rows, never inside a prompt); photo check (AI vision model); variable rewards; datastore (history, targets, photos; fastest to build, least effort); web app; telemetry. The engine reads each parent's history from the datastore and decides rewards row 5 and experiment variants.
- [2026-10-24 17:24 SGT] **User-led, never pushy:** parents choose which behaviours to do more of, within guardrails set by the app. The app privately compares them against a hidden objective level that is never shown.
- [2026-10-24 17:24 SGT] **Actions (from Triple P (Positive Parenting Program)):**
  - Quick, 1 to 2 minutes: spending quality time, talking with children, showing affection, descriptive praise, giving attention. Parent picks every day or every 2 days. Hidden ideal 1 per day, floor 1 per 2 days.
  - Deliberate, more time: interesting activities, setting a good example, incidental teaching, ask-say-do. Parent sets 1 or 2 per week at most. Hidden ideal 1 per week, no floor.
- [2026-10-24 17:24 SGT] **Nudges:** maximum 3 per day, combined across all of a parent's behaviours, set by the engine (not the parent). Bot replies after a parent logs an action do not count toward the cap.
- [2026-10-24 17:24 SGT] **Verification:** photo evidence is checked automatically by an AI vision model; photos are stored in the datastore. Actions that cannot be photographed are self-reported. If the photo check fails, the bot asks for self-report and labels it as self-reported.
- [2026-10-24 17:24 SGT] **Variable rewards (5 types):** (1) encouraging phrases, (2) XP and leveling, (3) progress visualization including streaks (a streak stays alive across a 2-day gap), (4) "look how far you've come" snapshot of photos, numbers and trends, sent weekly and monthly as a bot preview with a one-tap sign-in link to the web app, (5) unpredictable discovery (surprise bonus on 20% of logged actions). Rows 1 to 4 fire on fixed rules. Every reward that fires is logged as an event.
- [2026-10-24 17:24 SGT] **Experiments:** the nudge engine can define experiments that serve different variants (nudges, rewards, surprise rate) to different parents and compare outcomes.
- [2026-10-24 17:24 SGT] **Telemetry:** activation rate, feature adoption rate, active users and stickiness, churn rate, drop-off rate.
- [2026-10-24 17:24 SGT] **All frequencies and the 20% rate are starting hypotheses** to be tested with the experiments feature. Channel is Telegram only.
- [2026-10-24 17:24 SGT] The app's own AI prompt (personality and rules only) lives in `docs/NUDGE-CONTEXT.md`.

## Out of scope
- [2026-10-24 17:24 SGT] Triple P "managing misbehaviour" strategies and any strategy not listed above; material rewards (dropped); other channels such as WhatsApp.
- [2026-10-24 17:24 SGT] Parked in `docs/PRODUCT-BACKLOG.md`: social validation (co-parent high-five, leaderboard of local families).
- [2026-10-24 17:24 SGT] Open, to decide before real families use the app: how long photos of children are kept (`docs/KNOWN-ISSUES.md`).

## Definition of done
- [2026-10-24 17:24 SGT] A parent can pick behaviours and frequency in Telegram, receives no more than 3 nudges a day, logs actions by photo or self-report, and gets rewards that are logged as events.
- [2026-10-24 17:24 SGT] The weekly and monthly snapshot arrives with a one-tap link to a web page showing history, progress, rewards and XP.
- [2026-10-24 17:24 SGT] The engine can run an experiment, telemetry shows the five metrics, and the system works for 50 trial users.

## Change notes
- [2026-10-24 17:24 SGT] Version 1, written from the architecture discussion.
