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
- [2026-10-24 22:09 SGT] **Nudges (the 9 rows of the Nudge repository, from Triple P (Positive Parenting Program)), aligned with the owner's Nudge Repository spreadsheet:**
  - **Quick** (1 to 2 minutes): talking with children, showing affection, descriptive praise, giving attention. Parent picks every day or every 2 days for each. Hidden ideal 1 per day, floor 1 per 2 days.
  - **Deliberate** (more time): spending quality time, interesting activities, setting a good example, incidental teaching, ask-say-do. Parent sets 1 or 2 per week in total. Hidden ideal 1 per week, no floor.
  - **Each nudge has:** a category (quick or deliberate); 5 **examples**; "self-report allowed" (yes or no); an optional description of up to 280 characters; "photo upload allowed" (yes or no); and a **photo idea** (for nudges that allow photos).
  - "Photo upload allowed" is its own yes or no for each nudge, not tied to the category. Today it happens to be yes for all 5 deliberate nudges and no for all 4 quick ones; all 9 allow self-report.
- [2026-10-24 17:24 SGT] **Actions (from Triple P (Positive Parenting Program)):** SUPERSEDED [2026-10-24 22:09 SGT]
  - Quick, 1 to 2 minutes: spending quality time, talking with children, showing affection, descriptive praise, giving attention. Parent picks every day or every 2 days. Hidden ideal 1 per day, floor 1 per 2 days.
  - Deliberate, more time: interesting activities, setting a good example, incidental teaching, ask-say-do. Parent sets 1 or 2 per week at most. Hidden ideal 1 per week, no floor.
- [2026-10-24 17:24 SGT] **Nudges:** maximum 3 per day, combined across all of a parent's behaviours, set by the engine (not the parent). Bot replies after a parent logs an action do not count toward the cap.
- [2026-10-24 22:09 SGT] **Optional description = the Investment step of the Hooked model:** when logging, the parent can add a short description (max 280 characters) of what they did. It is shown in the Web app history and the weekly snapshot, and given to Claude as context for that parent's future nudge messages, to make them more relevant. If it is longer than 280 characters, the bot asks the parent to shorten it (never cut it off silently).
- [2026-10-24 22:09 SGT] **Examples:** used both as inspiration for Claude when writing a nudge message, and shown to the parent ("for example…") when choosing behaviours. Each example will be tagged with the moment(s) it fits (to school, dinner, bedtime, weekend), so a nudge message at a given moment uses a fitting example (WIP: `docs/PRODUCT-BACKLOG.md`).
- [2026-10-24 22:09 SGT] **Photo idea:** shown to the parent when they are invited to send a photo, and used by the Photo check to judge whether the photo fits (for now; risk logged in `docs/KNOWN-ISSUES.md`).
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
- [2026-10-28 20:37 SGT] Version 1.7 (in progress), Batch 2 clarifications (owner):
  1. **Only nudge messages count toward the 3-a-day cap.** A nudge message is one the bot sends on its own initiative. Anything the bot says in reply to the parent (logging, questions, any back-and-forth) never counts.
  2. **Every nudge message has two buttons: ✅ Done and 😴 Not today.** "Not today" (button, or the same meaning in the parent's own words, recognised by Claude) stops nudge messages for the rest of that Singapore day; they resume automatically the next day. No penalty and no "why" question; a kind acknowledgement only.
  3. **"Not today" does not count toward metric 9 (mute/stop rate).** It is tracked as its own event, so Telemetry can show how often it is used and whether it rises before a parent mutes.
  5. [2026-10-28 20:53 SGT] **Deliberate nudge messages go only at the dinner moment** (and possibly weekend moments later). Quick nudge messages can go at any moment.
  6. [2026-10-28 20:53 SGT] **Fewer nudges at the hidden ideal:** if a quick behaviour was logged on all of the last 7 days, it is nudged only every other day (room for the habit to become automatic; metric 7).
  7. [2026-10-28 20:53 SGT] **A week = Monday to Sunday, Singapore time** (for deliberate behaviours).
  8. [2026-10-28 20:53 SGT] **School holidays:** for the MVP, the owner uploads the Ministry of Education (MOE) school holiday dates before launch; automatic updates (e.g. from the MOE website) are in the backlog. How the morning moment behaves on school holidays is still to be agreed.
  - Still open: owner-chosen 30-minute time blocks per moment (question 1 and 2 follow-ups).
  10. [2026-10-28 21:21 SGT] **Nudge slots replace fixed named moments.** A parent's nudge messages go out in time slots (30-minute blocks). To avoid drop-off at setup, the setup screen opens with **3 suggested slots already selected: 7:00am, 7:00pm and 9:00pm**, each with helper text ("morning / to school", "dinner", "bedtime"). The parent can keep them with one tap or change any of them; there is also a **"custom"** option (exact meaning still to be confirmed). The helper texts are labels only, not rules. (Supersedes the fixed moments in answers 1 and 2 of the Batch 2 questions.)
  11. [2026-10-28 21:21 SGT] **Two schedules: school days and non-school days.** School day = Monday to Friday, and not a public holiday, and not an MOE school holiday. Non-school day = Saturday, Sunday, a public holiday, or an MOE school holiday. Each schedule has its own slots. This replaces the separate "weekend moments" and "school holiday mornings" questions. Default slots for non-school days are still to be agreed.
  12. [2026-10-28 21:26 SGT] **No separate "custom" option:** the 3 pre-selected slots can each be changed to any other slot, which already covers custom times (supersedes the "custom" part of answer 10).
  13. [2026-10-28 21:26 SGT] **Non-school day default slots:** 9:00am ("morning"), 12:30pm ("lunch"), 7:00pm ("dinner").
  14. [2026-10-28 21:26 SGT] **Slots at least 1 hour apart** (start to start). Example: 7:00 to 7:30am and 8:00 to 8:30am is fine; 7:00 to 7:30am and 7:30 to 8:00am is not.
  15. [2026-10-28 21:26 SGT] **Any behaviour can be nudged in any slot;** Claude adds the time-of-day context when writing the nudge message. Supersedes answer 5 ("deliberate nudge messages only at dinner").
  16. [2026-10-28 21:26 SGT] **"Too many nudges" button:** opens the parent's slot settings so they can remove a slot (built with the Telegram bot).
  - SUPERSEDED [2026-10-28 21:26 SGT] Still open from the generalised design: minimum gap between slots (suggested 1 hour); any behaviour in any slot with Claude adding time context (would drop "deliberate only at dinner"); slot range (suggested 7:00am to 10:00pm); at least 1 slot in total; meaning of "custom"; non-school default slots; what the "too many nudges" button does.
  9. [2026-10-28 21:16 SGT] **Examples are time-agnostic** (owner): no time of day baked into example text ("at dinner", "before bedtime"...). Claude adds timing context when it writes a nudge message. 10 examples rewritten (IDs 1, 2, 5, 6, 7, 9, 21, 22, 23, 30); a test checks the seed file has no time-of-day words. Applied to Supabase with `supabase/content/2026-10-28_time_agnostic_examples.sql` (owner runs it). The owner's original spreadsheet `docs/Nudge_Repository.xlsx` is kept unchanged as history.
  4. **How much open conversation the bot supports** (e.g. "any ideas for a rainy day?") is WIP, decided with the nudge personality work (`docs/PRODUCT-BACKLOG.md`).
- [2026-10-25 07:51 SGT] Version 1.6 complete and built (two tables, codes, minimum 3 examples with block plus alert).
- [2026-10-25 07:42 SGT] Version 1.6 (in progress), Nudge repository becomes two tables (owner agreed after mock-ups):
  1. **`nudges`** (one row per nudge): ID number (generated; used by parents' choices, history and metrics), a unique short **code**, name, category and the other settings (self-report allowed, photo upload allowed, photo idea, description limit, active, starts unlocked), each written once.
  2. **`examples`** (one row per example, unlimited): ID number (generated, never changes), **nudge_code** (must match a code in `nudges`, so typos are refused) and the example text. Different nudges can have different numbers of examples.
  3. **Codes:** TWC Talking with children, SAF Showing affection, DPR Descriptive praise, GAT Giving attention, SQT Spending quality time, IAC Interesting activities, SGE Setting a good example, ITE Incidental teaching, ASD Ask-say-do. Codes do not change when a nudge is renamed.
  4. A read-only combined view shows code, name, category and example together for browsing.
  5. Replaces the 5 fixed example columns (`example_1` to `example_5`). Rejected alternatives: one table with settings repeated on every example row (rows could disagree, typos create new nudges); IDs with meaning built in such as `1_TWC` (unchecked, hand-numbered, must change on rename).
  - Still open: minimum number of examples per nudge (suggested 3). SUPERSEDED [2026-10-25 07:48 SGT]
  6. [2026-10-25 07:48 SGT] **Minimum 3 active examples per nudge.** Examples have their own **active** yes/no (retire instead of delete).
  7. [2026-10-25 07:48 SGT] **Block plus alert:** the database refuses, with a clear message, any edit that would leave a nudge with fewer than 3 active examples (deleting, retiring or moving an example to another code). A brand-new nudge cannot be blocked (its examples are added one by one), so the app also flags to the owner any nudge below 3.
  8. [2026-10-25 07:48 SGT] A nudge below the minimum **keeps working** with reduced variety; it is flagged, not hidden.
- [2026-10-25 06:59 SGT] Version 1.5, Nudge repository and unlocks (owner's answers):
  1. Nudge IDs are generated automatically by Supabase, so they are always unique (the app's duplicate-ID check stays as a backstop). CSV imports leave the ID column out.
  2. Rows can be added and edited, but not deleted while any parent has chosen them (enforced by the database once the Datastore holds parents' targets). A nudge is retired by setting a new **active** column to no: parents can't pick it, and its history stays.
  3. **Unlock = a bigger menu.** Each nudge has a **starts unlocked** yes/no. A parent can pick only nudges that start unlocked or that they have unlocked. An unlock never raises how many behaviours a parent picks (limits stay 2 quick, 1 deliberate).
  4. Starts unlocked: all 4 quick nudges, plus "spending quality time" and "interesting activities". Starts locked: "setting a good example", "incidental teaching", "ask-say-do". The per-nudge flag allows a future quick nudge to start locked.
  5. How a parent earns an unlock stays WIP (`docs/PRODUCT-BACKLOG.md`).
  6. Refusal messages no longer say "for now" about the limits.
  7. Batch 1 additions confirmed: duplicate IDs handled like duplicate names; description limit 1 to 280; all reasons reported at once; the 2-times-a-week deliberate total is kept "if an experiment ever allows 2 deliberate"; a test checks the limits match `docs/EXPERIMENTS.md`.
- [2026-10-25 06:59 SGT] SUPERSEDES the earlier "unlock" wording in v1.1 answer 6 ("choosing more is an unlock"): unlocks open more nudges, they do not allow choosing more at once.
- [2026-10-24 22:18 SGT] Version 1.4, Batch 1 rules agreed by the owner:
  1. If one nudge row in the Nudge repository is broken, the app leaves out only that nudge and alerts the owner; the other nudges keep working.
  2. A nudge that allows photos must have a photo idea. A nudge must allow at least one way to log (self-report or photo).
  3. A parent must choose at least 1 behaviour in total (any mix).
  4. The choice limits (2 quick, 1 deliberate) are starting values in `docs/EXPERIMENTS.md`, so they can be tested and raised by unlocks.
- [2026-10-24 22:09 SGT] Version 1.3, aligned with the owner's Nudge Repository spreadsheet (answers to the Batch 1a questions):
  1. "Photo upload allowed" stays a separate yes or no per nudge, even though it currently matches "deliberate", so a future quick nudge could allow photos.
  2. "Spending quality time" moves from quick to deliberate: 4 quick and 5 deliberate. Its frequency is now part of the weekly deliberate total (1 or 2 per week), hidden ideal 1 per week. The 1-deliberate limit now means 1 out of 5.
  3. The optional description is the Investment step: shown in Web app history and the weekly snapshot, and given to Claude as context for future nudge messages.
  4. Over 280 characters: the bot asks the parent to shorten it.
  5. Examples are used both by Claude (inspiration) and shown to the parent.
  6. Examples will be tagged by moment (WIP).
  7. The photo idea is shown to the parent and used by the Photo check (for now).
  8. Naming: **nudge** = one of the 9 rows; **example** = one of its 5 ideas; **nudge message** = what the bot actually sends. Replaces "action" for the rows.
  - Still open: where the master copy of the Nudge repository lives (question 9). SUPERSEDED [2026-10-24 22:14 SGT]
  - [2026-10-24 22:14 SGT] Question 9 answered: the master copy of the Nudge repository is a table in Supabase, edited by the owner in the Supabase dashboard (directly, or by importing an AI-generated CSV).
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
