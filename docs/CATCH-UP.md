# Catch-up page: read this first after time away

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/CATCH-UP-superseded.md](archive/CATCH-UP-superseded.md) to keep this file short (owner approved).

**Last updated: [2026-11-15 00:04 SGT]** (session 18, paused for the night: the Web app handoff recorded (#49); tonight's decisions on sign-in, the connection card, tiles, deleting, the moment and the Week so far layout agreed but **not yet written into the rules**, see section 4a).

> [2026-11-15 00:04 SGT] **⏰ Next:** finish section 4a (three small answers and the database question), then Claude Code writes tonight's decisions into the rules and reruns the review agents on #49. **UAT:** U40 and U41 this morning, U45 at the next reminder (section 5).
>
> SUPERSEDED [2026-11-15 00:04 SGT] [2026-11-14 22:24 SGT] **⏰ Next:** **Review pull request #49** (the Week so far tab, recorded only) and answer the questions in section 4a: the connection card's titles and "about the same" band, the tile for a line-only day, and the six small questions. **UAT:** U40 and U41 tomorrow morning, U45 at the next reminder (section 5). **In Claude Chat:** tab 2 "Habits so far", Settings, the empty states, and the readable bot messages (section 4b). **Next Claude Code build:** the Week so far tab, once you approve the Datastore draft and choose how the Web app reaches the database.
>
> SUPERSEDED [2026-11-14 22:24 SGT] [2026-11-14 21:40 SGT] **⏰ Next:** **UAT:** U40 and U41 tomorrow morning, U45 at the next reminder (keyboard, not ✅ Done), U35 and U46 another day (section 5). **In Claude Chat:** (1) design the **Web app** (My Page, Settings); (2) make the **bot's messages easier to read**, including the B1 drafts (section 4b). **Next Claude Code build (your choice):** the Claude personality and warm reply (rules 3.11, 7.5; needs the nudge personality from you first), or the Web app once its design handoff arrives.
>
> SUPERSEDED [2026-11-14 21:40 SGT] [2026-11-14 13:48 SGT] **⏰ Today and next:** **In Claude Chat:** (1) design the **Web app** (My Page, Settings); (2) make the **bot's messages easier to read**. **Evenings:** U15 today 7:00 pm, U16 Sunday, U14 any time. **Next Claude Code session:** build **B1** from the **agreed test list** (keyboard, /log, Undo for 10 minutes, the Menu, the "Welcome back" fix, migration 010). **Sunday:** merge #45 and go live.
>
> SUPERSEDED [2026-11-14 13:48 SGT] [2026-11-14 10:38 SGT] **⏰ Today and next:** **In Claude Chat:** (1) design the **Web app** (My Page, Settings); (2) make the **bot's messages easier to read**. **Evenings:** U15 today 7:00 pm, U16 Sunday, U14 any time. **Next Claude Code session:** build **B1** (log any time: keyboard, /log, Undo) and the **"Welcome back" fix**, tests first. **Sunday:** merge #45 and go live.
>
> SUPERSEDED [2026-11-14 10:38 SGT] [2026-11-14 00:17 SGT] **⏰ Next session (Claude Code):** (1) UAT **U17 to U27** with your second Telegram account, then **migrations 008 and 009**; (2) build **B1: log any time (keyboard, /log, Undo)**, tests first, on a second branch. **In Claude Chat:** design the **Web app** (My Page, Settings). **Saturday 7:00 pm:** U15. **Sunday:** U16, merge #45, go live, then the Claude personality.
>
> SUPERSEDED [2026-11-14 00:17 SGT] [2026-11-12 23:20 SGT] **⏰ Next session (you asked to build first):** (1) quickly: your UAT results U12, U14, U15, U16, and the onboarding ones U17 to U28 if you ran them ([checklist](../src/telegram-bot/UAT-onboarding.md)); (2) have you run **migration 008**? (3) then Claude builds **pull request 3 of 3: the planner live on Supabase Cron**: the 30-minute alarm, your own behaviours and times instead of the fixed 7:00 pm "Showing affection", the 24-hour sign-up reminder, and removing the temporary 7:00 pm wording. Claude shows you the tests in plain English first. The bot is still for you only.

Contents: 1. Module map · 2. Modules: purpose, files and tests · 3. Rules: where each one lives · 4. Questions to think about before next session · 5. Waiting on you

---

## 1. Module map

The modules from your architecture diagram, coloured by progress (9 since 31 Oct: Experiments added [2026-10-31 19:06 SGT]). Numbers match the table in section 2.

[2026-10-31 09:40 SGT] The module map now lives in one place: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** (also the source of each module's status, checked by the drift test).

**Colours:** [2026-11-11 17:48 SGT] green = built (status starts with "Built"); yellow = in design or partly built; grey = not started. The drift test checks each box's colour fits its status (rule D4).

[2026-11-14 22:24 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **tables live, migrations up to 010 applied** → (3) Telegram bot ✅ **onboarding, the planner (#45) and B1 log any time (#47) all live** → (4) Web app ⬅ **Week so far tab designed and recorded (#49)**; tabs 2 to 4 and the readable messages still in Claude Chat → then Claude's words (the personality and warm reply)

SUPERSEDED [2026-11-14 22:24 SGT] [2026-11-14 21:40 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **tables live, migrations up to 010 applied** → (3) Telegram bot ✅ **onboarding, the planner (#45) and B1 log any time (#47) all live** → next: the Web app and message readability (Claude Chat), then Claude's words (the personality and warm reply)

SUPERSEDED [2026-11-14 21:40 SGT] [2026-11-14 10:38 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **tables live, migrations up to 009 applied** → (3) Telegram bot ⬅ **onboarding live and UAT passed (#40); the planner built (#44 merged, #45 waiting for U15 and U16)** → next: B1 keyboard and Undo, the Web app and message readability (Claude Chat), Claude's words

SUPERSEDED [2026-11-14 10:38 SGT] [2026-11-14 00:17 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **tables live, migrations up to 007** (008 and 009 written) → (3) Telegram bot ⬅ **onboarding live (#40); the planner built (#44 merged, #45 waiting for your UAT)** → next: B1 keyboard and Undo, the Web app, Claude's words

SUPERSEDED [2026-11-14 00:17 SGT] [2026-11-12 23:20 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **19 tables live, migrations up to 007** (008 written) → (3) Telegram bot ⬅ **onboarding built and merged 12 Nov (#40)**; next pull request 3, the planner live on Supabase Cron; group C (Settings on the Web app) still to design → (4) Variable rewards, then Nudge engine words (Claude's replies) → (5) Photo check → (6) Telemetry → (7) Web app.

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
- **2.1 to 2.5, 3.1 to 3.13, 3.15 to 3.17**: [Nudge engine](../src/nudge-engine/SPEC.md)
- **4.1 to 4.7**: [Nudge repository](../src/nudge-repository/SPEC.md)
- **5.1, 5.3, 5.4, 5.6 to 5.13, 3.14**: [Telegram bot](../src/telegram-bot/SPEC.md) (and the onboarding decisions of 12 Nov, section "Recorded: group A finished") · **5.2, 10.1 to 10.4**: [Telemetry](../src/telemetry/SPEC.md) · **5.5, 8.1 to 8.13**: [Datastore](../src/datastore/SPEC.md) (the 19 tables are listed there, under "Tables")
- **6.1, 6.2**: [Photo check](../src/photo-check/SPEC.md)
- **7.1 to 7.8**: [Variable rewards](../src/variable-rewards/SPEC.md)
- [2026-11-14 22:24 SGT] **9.1 to 9.7**: [Web app](../src/web-app/SPEC.md) (My page's four tabs, sign-in, Week so far, the connection card, deleting, older weeks; plus two parked questions)
- SUPERSEDED [2026-11-14 22:24 SGT] **9.1**: [Web app](../src/web-app/SPEC.md) (plus two parked questions)
- **11.1 to 11.13**: [Experiments](../src/experiments/SPEC.md); the values (38 in use) and their five kinds are in [EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md)
- Structure rules (S, R, D, B, P) and retired rule IDs: [docs/SPEC.md](SPEC.md), "Modules and structure"

---

## 4. Questions to think about before next session

[2026-11-14 22:24 SGT] Open items only (CLAUDE.md, H2 addition). The previous version is in [docs/archive/CATCH-UP-sections-4-5-to-2026-11-14-session-18.md](archive/CATCH-UP-sections-4-5-to-2026-11-14-session-18.md), word for word.

**4a. The Week so far tab: what's left** ([2026-11-15 00:04 SGT]; earlier version in [docs/archive/CATCH-UP-section-4a-to-2026-11-15-session-18-night.md](archive/CATCH-UP-section-4a-to-2026-11-15-session-18-night.md))
- [2026-11-15 00:04 SGT] **Decided tonight, not yet written into the rules:** the full list (P1 to P4, C1 to C6) is in the HANDOFF entry of [docs/PROGRESS.md](PROGRESS.md); wireframes in `docs/handoffs/2026-11-14-web-app-wireframes-session-18/`.
- [2026-11-15 00:04 SGT] **Still to answer:** (f) sizes from the layouts: record none now (recommended) or the 40 px dustbin tap area; does the older-weeks list keep small tiles?; write "wireframe by default" into `CLAUDE.md`?
- [2026-11-15 00:04 SGT] **Datastore draft ([src/datastore/SPEC.md](../src/datastore/SPEC.md)):** approve the three reads; first, the parked question: how the Web app reaches the database (server with the master key, or limited per-parent access). Deleting is now decided (P4, C3).

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
