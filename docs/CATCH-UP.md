# Catch-up page: read this first after time away

**Last updated: [2026-10-29 22:40 SGT]** (end of session 4). Claude updates this page at the end of every session and shows it at the start of the next. Unlike the other project files, this page is a **current snapshot**: it is rewritten each time, and older versions stay in Git history. The dated, never-deleted record of each decision is in `docs/SPEC.md` (Change notes).

Contents: 1. Module map · 2. What each module does, and its files · 3. Rules recap (with rule IDs) · 4. Questions to think about before next session · 5. Waiting on you

---

## 1. Module map

The 8 modules from your architecture diagram, coloured by progress. Numbers match the table in section 2.

[2026-10-31 09:40 SGT] The module map now lives in one place: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** (also the source of each module's status, checked by the drift test).

**Colours:** green = built and tested; yellow = partly built; grey = not started.

**Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore with event log ⬅ **next after Batch 3** → (3) Telegram bot, first deploy → (4) Variable rewards, then Nudge engine words → (5) Photo check → (6) Telemetry → (7) Web app.

---

## 2. What each module does, and its files

A **module** is one box in the map. A **file** is a piece of code inside a module. Tests check that each file does what we agreed.

| # | Module | What it does (plain English) | Status | Files and what each one does | Tests |
|---|---|---|---|---|---|
| 1 | **Telegram bot** | The chat with the parent: sends nudge messages, receives logs, photos, ✅ Done and 😴 Not today | Not started | `api/health.ts`: an "I'm alive" web address, to check a deployment works | 2 |
| 2 | **Nudge engine** | The brain: checks what a parent picks, works out what is still to do, and decides when to nudge and about which behaviour. Later: Claude writes the words | Decisions half built | `src/nudge-engine/choices.ts`: checks a parent's picks (2 quick + 1 deliberate, unlocked, frequencies) | 16 |
| | | | | `src/nudge-engine/schedule.ts`: school day or non-school day; checks a parent's nudge times (slots); which times to grey out on screen | 8 |
| | | | | `src/nudge-engine/due.ts`: is a behaviour still to do, given the frequency the parent chose? | 7 |
| | | | | `src/nudge-engine/planner.ts`: the decision: "send a nudge about X now" or "don't send", with the reason | 22 |
| | | | | `src/settings.ts`: all the numbers in one place (3 a day, slot times, limits); mirrors `docs/EXPERIMENTS.md` | (used by all) |
| | | | | `src/sgt.ts`: Singapore time helpers (days, weekdays, time of day) | (used by all) |
| 3 | **Nudge repository** | The 9 nudges and their examples, which you edit in Supabase | Built and live | `src/nudge-repository/nudge-repository.ts`: checks every nudge and example row the app reads; leaves out broken ones and reports them | 23 |
| | | | | `src/datastore/supabase/seed/*.csv`: your 9 nudges and 45 examples (first load, done); tested by `tests/nudge-repository-first-load.test.ts` | 6 |
| | | | | `src/datastore/supabase/content/2026-10-28_time_agnostic_examples.sql`: the 10 example rewrites (applied live) | checked |
| | | | | `src/datastore/supabase/content/2026-10-29_unlock_all_nudges.sql`: unlocks SGE, ITE, ASD (rule 2.2). **Waiting for you to run it** | checked |
| 4 | **Photo check** | Claude looks at a photo and judges whether it fits the behaviour | Not started | (none yet) | |
| 5 | **Variable rewards** | Rewards after logging: validation reply (receipt + Claude), varied ideas, weekly streak and steady weeks, one-tap logging, family memory album with snapshots, 3 milestone badges | Design in progress (no code yet) | `docs/VARIABLE-REWARDS-SPEC.md`: the design (v0.2): universe of rewards, MVP scope, decisions D1 to D11 | (design only) |
| 6 | **Datastore** | Where everything is kept: Supabase (Singapore) for permanent records and photos, Upstash Redis for short-term chat memory | Nudge tables live | `src/datastore/supabase/migrations/001_create_nudge_repository.sql`: creates the nudges and examples tables, the 3-example guard and the browsing view | 25 database checks |
| | | | | `src/datastore/supabase/migrations/002_service_role_read_only.sql`: makes our server read-only on those tables | (in the 25) |
| 7 | **Web app** | Plain pages: history, progress, rewards, XP, "delete my data" | Not started | (none yet) | |
| 8 | **Telemetry** | Records events from every module and calculates your 10 success metrics | Not started | (none yet) | |

**Totals:** 106 app tests (84 + 22 drift tests) (`npm run check`) and 25 database checks (`npm run test:db`), all passing.

---

## 3. Rules recap (current rules only)

Each rule has a **rule ID** (e.g. **3.4**) so we can refer to it precisely. **IDs never change and are never reused:** a new rule gets the next free number in its section; a changed rule keeps its ID (with a new date); a dropped rule's ID is retired and listed at the end. Grouped by topic. The date in brackets after each rule, e.g. *(decided 24 Oct)*, is when you decided it (all dates 2026; two dates mean it was decided, then updated). The full history is in `docs/SPEC.md`.

### 1. Everyone and everything
- **1.1** Parents of children aged 7 to 12; each parent is a separate user. **Invite-only.** English only. Channel: Telegram. *(decided 24 Oct)*
- **1.2** All times and days are **Singapore time**, midnight to midnight. A week is **Monday to Sunday**. *(decided 24 Oct, 28 Oct)*
- **1.3** **No fallbacks:** a failure is shown as a failure, never filled with made-up values. Exception: if the photo check fails, the parent self-reports. *(decided 24 Oct)*

### 2. and 3. Nudge engine
[2026-10-31 09:43 SGT] Rules 2.1 to 2.4 (what a parent picks) and 3.1 to 3.11 (when and what to nudge) now live in one place: **[src/nudge-engine/SPEC.md](../src/nudge-engine/SPEC.md)** (with a "rules at a glance" list at the top).

### 4. Nudge repository
[2026-10-31 09:56 SGT] Rules 4.1 to 4.6 now live in one place: **[src/nudge-repository/SPEC.md](../src/nudge-repository/SPEC.md)**.

### 5. Logging (Telegram bot and Datastore)
- **5.1** Parents can log **any time**: tap ✅ Done on a nudge message, a "Log something" button, or free text Claude understands. *(decided 28 Oct)*
- **5.2** **Unprompted** = no nudge message in the 4 hours before (metric 7). *(decided 28 Oct)*
- **5.3** Optional **description** (up to 280 characters) = the Hooked "Investment". Over 280: the bot asks to shorten it. Shown in the web app and snapshot, and given to Claude for future nudges. *(decided 24 Oct)*
- **5.4** Logging a behaviour not chosen: **accepted with thanks**, doesn't count toward targets. Logging late: **back to yesterday only**. Twice in a day: counts once for targets and streaks, but **should still be celebrated (WIP)**. *(decided 28 Oct)*

### 6. Photo check
- **6.1** Claude judges the photo, using the nudge's photo idea **for now** (risk: too strict, logged). If the check fails, the parent self-reports and the log is labelled "self-reported". *(decided 24 Oct)*

### 7. Variable rewards
- **7.1** **MVP rewards** (from `docs/VARIABLE-REWARDS-SPEC.md`): 1 validation reply after each log, 2 varied ideas (surprise), 3 weekly streak, 4 one-tap logging, 6 family memory album **including weekly and monthly snapshots**, 10 three milestone badges. Unlocks are out of the MVP. Details under review (D1 to D11). *(decided 24 Oct, changed 29 Oct)*
- **7.2** **No XP or levels in the MVP** (D1). No random surprise bonus either. An **unprompted log** (rule 5.2) gets a **special validation reply** noticing the parent did it on their own. *(decided 24 Oct, changed 29 Oct)*
- **7.4** **Variable rewards need a full design session:** every reward category needs its rules, its content and its variety (parked in `docs/PRODUCT-BACKLOG.md`). *(decided 29 Oct)*
- **7.3** **Streaks are weekly** (D3): one unit for everyone, the week (Monday to Sunday). The headline is "days this week"; the streak counts **steady weeks** (rule 7.6), in total and in a row. A short week never gets a "broken streak" message. No repair pass in the MVP. Replaces the earlier per-behaviour streaks. *(decided 24 Oct, changed 29 Oct)*
- **7.5** **Validation reply after every log** (D2): first an honest **receipt** ("✅ Saved: Showing affection, today."), then a warm reply **written by Claude** naming what the parent did. If Claude fails, the receipt stands and the failure is recorded. Replies never count toward the 3-a-day cap. *(decided 29 Oct)*
- **7.6** **Steady week** (D4) = every behaviour the parent chose met its weekly bar, with some slack: every day = 6 of 7 days; every 2 days = 3 days; deliberate once a week = 1; twice a week = 2. The week a parent joins doesn't count against them (their streak starts with their first full week). Picks in place on Sunday are the ones judged. *(decided 29 Oct; bars are starting values, tune after the trial)*

### 8. Datastore
[2026-10-31 09:59 SGT] Rules 8.1, 8.2 and 5.5 (photo storage) now live in one place: **[src/datastore/SPEC.md](../src/datastore/SPEC.md)**.

### 9. Web app
- **9.1** Plain, unstyled pages that show the right data; **the look comes from you later**. "Delete my data" lives here (WIP until UI design). *(decided 24 Oct)*

### 10. Telemetry
- **10.1** The **10 metrics** in `docs/Family_Habit_App_Success_Metrics.xlsx` (activation, adoption, stickiness, churn, drop-off, target-hit, unprompted, nudge-to-action, mute/stop, connection rating). "Not today" is its own event, not part of mute/stop. *(decided 24 Oct, 28 Oct)*

### Retired rule IDs
- None yet.

---

## 4. Questions to think about before next session

[2026-10-29 22:40 SGT] Answer whenever you have a moment; each has a suggestion, so "agree" is enough. Full details are in section 1 of `docs/VARIABLE-REWARDS-SPEC.md`.

**First, one task:** run `src/datastore/supabase/content/2026-10-29_unlock_all_nudges.sql` in the Supabase SQL Editor (expect 3 rows: SGE, ITE, ASD unlocked).

**Variable rewards, parked decisions D5 to D10**
- **D5 Repair pass** (a free "missed day" pass): *suggestion:* not in the MVP; slack in steady weeks (rule 7.6) and logging up to yesterday (rule 5.4) cover forgetful days.
- **D6 Surprise ideas:** *suggestion:* each nudge message uses a fresh example (no repeats until all are used); your v0.1 cards become new example rows; add an **"Another idea"** button, once per message.
- **D7 Weekly album prompt:** *suggestion:* once a week, in your last Sunday slot, only if you logged that week; counts as one of that day's nudge messages.
- **D8 Album photos:** *suggestion:* the weekly prompt can take a photo or line about any moment, saved as an album entry (not a log).
- **D9 Trial:** *suggestion:* 5 weeks, 5 to 10 friends' families.
- **D10 Snapshot timing:** *suggestion:* weekly snapshot combined with the D7 album prompt (Sunday); monthly on the 1st, in the parent's first slot.

**After the rewards design:** the Datastore (step 2 of the development order), starting with table mock-ups for your agreement.

---

## 5. Waiting on you (not blocking the next steps)
- Run the unlock script (section 4)
- Rewards decisions D5 to D10 (section 4)
- Nudge personality ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)), which now also guides Claude's validation replies (rule 7.5); context collected from parents; how much free chat the bot supports
- Badge graphics and the look of every screen (Web app, setup)
- **Before launch:** upload MOE school holiday and Singapore public holiday dates
- Experiment mechanics (parked in `docs/EXPERIMENTS.md`)
