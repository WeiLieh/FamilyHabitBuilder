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
- [2026-10-24 18:26 SGT] **Verification (update):** sending a photo is always optional. Parents give consent to photo storage once, when they join. No guidance is given about what may appear in a photo.
- [2026-10-24 17:24 SGT] **Verification:** photo evidence is checked automatically by an AI vision model; photos are stored in the datastore. Actions that cannot be photographed are self-reported. If the photo check fails, the bot asks for self-report and labels it as self-reported.
- [2026-10-24 17:24 SGT] **Variable rewards (5 types):** (1) encouraging phrases, (2) XP and leveling, (3) progress visualization including streaks (a streak stays alive across a 2-day gap), (4) "look how far you've come" snapshot of photos, numbers and trends, sent weekly and monthly as a bot preview with a one-tap sign-in link to the web app, (5) unpredictable discovery (surprise bonus on 20% of logged actions). Rows 1 to 4 fire on fixed rules. Every reward that fires is logged as an event.
- [2026-10-24 18:26 SGT] **Experiments (update):** experiments are defined in `docs/EXPERIMENTS.md` (no admin screen). Each parent is randomly assigned to a variant once and stays in it.
- [2026-10-24 17:24 SGT] **Experiments:** the nudge engine can define experiments that serve different variants (nudges, rewards, surprise rate) to different parents and compare outcomes.
- [2026-10-24 18:26 SGT] **Telemetry:** the 10 metrics, definitions, windows and targets in `docs/Family_Habit_App_Success_Metrics.xlsx` (5 Usage metrics and 5 Habit formation metrics; success tests X, Y, Z at trial end).
- [2026-10-24 18:34 SGT] **Bot features needed by the metrics:** weekly optional connection question (1 to 5), mute/stop option, "too many nudges" button.
- [2026-10-24 17:24 SGT] **Telemetry:** activation rate, feature adoption rate, active users and stickiness, churn rate, drop-off rate. SUPERSEDED [2026-10-24 18:26 SGT]
- [2026-10-24 17:24 SGT] **All frequencies and the 20% rate are starting hypotheses** to be tested with the experiments feature. Channel is Telegram only.
- [2026-10-24 17:24 SGT] The app's own AI prompt (personality and rules only) lives in `docs/NUDGE-CONTEXT.md`.

## Out of scope
- [2026-10-24 17:24 SGT] Triple P "managing misbehaviour" strategies and any strategy not listed above; material rewards (dropped); other channels such as WhatsApp.
- [2026-10-24 17:24 SGT] Parked in `docs/PRODUCT-BACKLOG.md`: social validation (co-parent high-five, leaderboard of local families).
- [2026-10-24 18:26 SGT] Photos are kept until the parent deletes their data (no automatic deletion).
- [2026-10-24 17:24 SGT] Open, to decide before real families use the app: how long photos of children are kept (`docs/KNOWN-ISSUES.md`). SUPERSEDED [2026-10-24 18:26 SGT]

## Definition of done
- [2026-10-24 17:24 SGT] A parent can pick behaviours and frequency in Telegram, receives no more than 3 nudges a day, logs actions by photo or self-report, and gets rewards that are logged as events.
- [2026-10-24 17:24 SGT] The weekly and monthly snapshot arrives with a one-tap link to a web page showing history, progress, rewards and XP.
- [2026-10-24 18:26 SGT] The engine can run an experiment (read from `docs/EXPERIMENTS.md`), telemetry shows the 10 metrics in `docs/Family_Habit_App_Success_Metrics.xlsx`, and the system works for 50 trial users.
- [2026-10-24 17:24 SGT] The engine can run an experiment, telemetry shows the five metrics, and the system works for 50 trial users. SUPERSEDED [2026-10-24 18:26 SGT]

## Change notes
- [2026-10-24 18:34 SGT] Version 1.2, scope confirmed by the product manager: the metrics add three features to the MVP: (a) a weekly optional bot question, "How connected did you feel with your child?" (1 to 5, metric 10); (b) a mute/stop option for the bot (metric 9); (c) a "too many nudges" button (metric 9). Weekend nudge moments and trial length stay WIP (`docs/PRODUCT-BACKLOG.md`).
- [2026-10-24 18:26 SGT] Version 1.1, agreed answers to the session 1 clarifying questions (numbers match the questions):
  1. **Photos:** optional. Consent once at sign-up. No guidance about faces. Photos are kept (no 90-day deletion). A "delete my data" function lives on the web page. **WIP**, built when the UI is designed (`docs/PRODUCT-BACKLOG.md`).
  2. **Access:** invite-only. Only Telegram accounts the product manager approves can use the bot.
  3. **Web page:** built as plain, unstyled pages that show all the correct data. The look comes later from the product manager.
  4. **Repository:** https://github.com/weilieh/familyhabitbuilder.
  5. **Photographable actions:** the 4 deliberate actions plus "spending quality time". The other 4 quick actions are self-report only.
  6. **How many behaviours:** at most 2 quick and 1 deliberate to start. Choosing more is an **unlock** the parent earns. **WIP:** the unlock rule is defined together with rewards.
  7. **Deliberate limit:** "1 or 2 per week at most" is in total across all deliberate behaviours.
  8. **Hidden ideal and floor:** used by the engine to decide who gets nudged first. A parent below the floor in real life gets priority, and a parent at the ideal gets fewer nudges. Never shown to the parent.
  9. **Nudge timing:** framed around everyday moments, not clock times. Weekdays: to school (7 to 8am), dinner time (7 to 9pm), bedtime (8 to 10pm). Weekends: a separate set of moments, **not defined yet** (`docs/KNOWN-ISSUES.md`). A "day" is a Singapore calendar day.
  10. **Streaks:** for quick actions, a streak survives up to 2 missed days in a row. Deliberate actions have a weekly streak. Trial rule, can change.
  11. **XP and levels:** **WIP**, decided when the product manager defines the rewards.
  12. **Surprise bonus (reward 5):** double XP plus a special message.
  13. **Nudge text:** written by AI from day one, using context gathered from the parent. **WIP:** what context is collected is defined together with rewards. Nudge actions still live as data rows, never inside a prompt.
  14. **Experiments:** defined in `docs/EXPERIMENTS.md`, with random sticky assignment per parent.
  15. **Metrics:** replaced by the 10 metrics in `docs/Family_Habit_App_Success_Metrics.xlsx`.
  16. **Budget:** free tiers where possible, about US$10 to 20 a month for AI and hosting.
  17. **Language:** English only.
  18. **Basics added to the MVP:** change chosen behaviours, pause nudges, delete my data.
- [2026-10-24 17:24 SGT] Version 1, written from the architecture discussion.
