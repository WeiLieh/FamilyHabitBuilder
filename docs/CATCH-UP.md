# Catch-up page: read this first after time away

[2026-11-12 23:24 SGT] Older replaced (superseded) lines were moved word for word to [docs/archive/CATCH-UP-superseded.md](archive/CATCH-UP-superseded.md) to keep this file short (owner approved).

**Last updated: [2026-11-14 21:40 SGT]** (session 17: **B1 built and live** (keyboard, /log, 10-minute Undo, the Menu, Welcome back fix; #47); **the planner is live** (#45, alarm every 10 minutes); migration 010 applied; most UAT passed).

> [2026-11-14 21:40 SGT] **⏰ Next:** **UAT:** U40 and U41 tomorrow morning, U45 at the next reminder (keyboard, not ✅ Done), U35 and U46 another day (section 5). **In Claude Chat:** (1) design the **Web app** (My Page, Settings); (2) make the **bot's messages easier to read**, including the B1 drafts (section 4b). **Next Claude Code build (your choice):** the Claude personality and warm reply (rules 3.11, 7.5; needs the nudge personality from you first), or the Web app once its design handoff arrives.
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

[2026-11-14 21:40 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **tables live, migrations up to 010 applied** → (3) Telegram bot ✅ **onboarding, the planner (#45) and B1 log any time (#47) all live** → next: the Web app and message readability (Claude Chat), then Claude's words (the personality and warm reply)

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
- **9.1**: [Web app](../src/web-app/SPEC.md) (plus two parked questions)
- **11.1 to 11.13**: [Experiments](../src/experiments/SPEC.md); the values (38 in use) and their five kinds are in [EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md)
- Structure rules (S, R, D, B, P) and retired rule IDs: [docs/SPEC.md](SPEC.md), "Modules and structure"

---

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
