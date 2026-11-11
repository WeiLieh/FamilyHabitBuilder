# Catch-up page: read this first after time away

**Last updated: [2026-11-11 21:58 SGT]** (session 11: five answers, migrations 005 and 006 live, rule D4, **thin slice 1 built and live**, UAT U2 to U10 pass).

> [2026-11-11 21:58 SGT] **⏰ Next session, first:** (1) your remaining UAT results (U11 to U14, schedule below); (2) Claude fixes the sign-up gap (an honest reply if the "already signed up?" check fails), test-first; (3) group C (Settings on the Web app) in Claude Chat, or the next slice. The bot is live for you only: no real families until photo consent and "delete my data" are built.

> SUPERSEDED [2026-11-11 21:58 SGT] [2026-11-11 17:15 SGT] **⏰ Now:** the five answers are in (11 Nov). Next: migration 005 (the Datastore change, tests first), then group C (Settings on the Web app) in Claude Chat, then the thin-slice build.

> SUPERSEDED [2026-11-11 17:15 SGT] [2026-11-09 21:49 SGT] **⏰ Next, first:** (1) the yesterday-test question and the `/log` default below (4b); (2) question 12 and rule 10.2; (3) the Datastore proposal ([src/datastore/SPEC.md](../src/datastore/SPEC.md), "Proposed"); (4) go-ahead to change the texts of rules 5.6 and 7.7. Then group C (Settings on the Web app) and the thin-slice build.

> SUPERSEDED [2026-11-09 21:49 SGT] [2026-11-09 19:25 SGT] **⏰ Next, first:** design B2 group C (questions 9 to 11) in Claude Chat with the [brief](handoffs/2026-11-09-b2-answering-and-saving-brief-for-chat.md), and bring back a design handoff (habit H10). Then question 12 in Claude Code, then the rest of B1 and group C (Settings on the Web app).

> SUPERSEDED [2026-11-09 19:25 SGT] [2026-11-09 00:14 SGT] **⏰ Next session, first:** decide the 4 privacy-review findings in section 4e (what goes into `docs/KNOWN-ISSUES.md`), then design **B2 (Sunday rhythm)** in Claude Chat; the rest of B1 and group C come after. Group A and the core of B1 are recorded.

> SUPERSEDED [2026-11-09 00:14 SGT] [2026-11-08 22:34 SGT] **Where we are:** you answered Q1 to Q13 and approved 9 rule changes (section 4a). Next: design the daily loop (B1), the Sunday rhythm (B2) and Settings on the Web app (C) in Claude Chat, then the first small build. Claude updates this page at the end of every session and shows it at the start of the next. Unlike the other project files, this page is a **current snapshot**: it is rewritten each time, and older versions stay in Git history. The dated, never-deleted record of each decision is in `docs/SPEC.md` (Change notes).

Contents: 1. Module map · 2. Modules: purpose, files and tests · 3. Rules: where each one lives · 4. Questions to think about before next session · 5. Waiting on you

---

## 1. Module map

The modules from your architecture diagram, coloured by progress (9 since 31 Oct: Experiments added [2026-10-31 19:06 SGT]). Numbers match the table in section 2.

[2026-10-31 09:40 SGT] The module map now lives in one place: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** (also the source of each module's status, checked by the drift test).

**Colours:** [2026-11-11 17:48 SGT] green = built (status starts with "Built"); yellow = in design or partly built; grey = not started. The drift test checks each box's colour fits its status (rule D4).

[2026-11-11 21:58 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore ✅ **17 tables live, migrations up to 006** → (3) Telegram bot ⬅ **thin slice 1 built and live (11 Nov)**: sign-up with an invite, the 7:00 pm nudge, ✅ Done and 😴 Not today; groups A, B1 and B2 designed; group C (Settings on the Web app) still to design → (4) Variable rewards, then Nudge engine words (Claude's replies) → (5) Photo check → (6) Telemetry → (7) Web app.

SUPERSEDED [2026-11-11 21:58 SGT] **Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore with event log ✅ **tables live (1 Nov)** → (3) Telegram bot, first deploy ⬅ **design in progress** (group A onboarding designed 3 Nov; next B1 daily loop, B2 Sunday rhythm, C settings on the Web app with the photo store; then a thin-slice build) → (4) Variable rewards, then Nudge engine words → (5) Photo check → (6) Telemetry → (7) Web app.

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
- **4.1 to 4.6**: [Nudge repository](../src/nudge-repository/SPEC.md)
- **5.1, 5.3, 5.4, 5.6 to 5.9, 3.14**: [Telegram bot](../src/telegram-bot/SPEC.md) · **5.2, 10.1 to 10.4**: [Telemetry](../src/telemetry/SPEC.md) · **5.5, 8.1 to 8.13**: [Datastore](../src/datastore/SPEC.md) (the 17 tables are listed there, under "Tables")
- **6.1, 6.2**: [Photo check](../src/photo-check/SPEC.md)
- **7.1 to 7.8**: [Variable rewards](../src/variable-rewards/SPEC.md)
- **9.1**: [Web app](../src/web-app/SPEC.md) (plus two parked questions)
- **11.1 to 11.13**: [Experiments](../src/experiments/SPEC.md); the 31 values and their five kinds are in [EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md)
- Structure rules (S, R, D, B, P) and retired rule IDs: [docs/SPEC.md](SPEC.md), "Modules and structure"

---

## 4. Questions to think about before next session

[2026-11-08 22:34 SGT] Session 9 recorded your answers to the group A questions. Each changed rule keeps its old text, marked SUPERSEDED, in its spec; the dated summary is change note 1.14 in [docs/SPEC.md](SPEC.md).

**4a. Rule changes**
- [2026-11-09 21:49 SGT] **Recorded 9 Nov from the Chat handoffs:** 5.1 typed messages · 5.4 today only, unchosen = reflection, repeat celebrated · 3.12 any activity triggers the Wrap Up, two messages · 7.6 Monday receipt retired · 7.8 new summary, steady weeks and monthly view on My page. **Waiting for your go-ahead:** the texts of 5.6 (24 hours, "Answered: 4, quite connected") and 7.7 (24-hour window, consent buttons).
- [2026-11-09 18:16 SGT] **Approved 9 Nov (B2 group A):** 3.4 three kinds of bot message, the stand-alone connection question never counts · 3.12 one Pause switch stops everything, the Wrap Up's own switch removed · 5.6 connection question at the Wrap Up time, fixed words, not while paused · 7.8 a paused parent gets nothing on Sunday but sees everything in the Web app · 8.4 edit 1 without the switch. Still waiting: 10.2 (B2 question D12).
- [2026-11-08 23:08 SGT] **Screen edits, 8 Nov:** 3.14 now has one button (OK); 11.9 now has one button ("✅ I agree"). **Defaults confirmed by you [2026-11-08 23:09 SGT]:** screen 3 "What's your child's name?"; screen 10 uses the child's name, no pronoun; screen 11's receipt "✅ Saved: `<behaviour>` today." is fixed and "You're off to a great start." is Claude's reply.
- **Approved on 8 Nov (9):** 5.5 photo consent at the first photo · 11.9 one checkbox at the end of sign-up, recording only · 8.10 child's name, birth year later · 8.13 *(new)* unfinished sign-up keeps only the Telegram ID and last step · 2.5 *(new)* default frequencies: quick every 2 days, deliberate once a week · 3.14 screen 8 is one plan summary · 5.7 *(new)* the Menu, plain words work too · 9.1 My page is the dashboard, Settings lives inside it · 7.8 the connection question is item 6 of the Wrap Up.
- **Still waiting (3), on the parked questions in 4d:** 3.4 (a third kind of bot message), 5.6 (when the connection question is sent), 10.2 (new tracking events; also needs Q3).

**4b. Open questions, kept as work in progress (WIP)**
- [2026-11-09 21:49 SGT] **B2 group C answered in Chat** (24 hours, the week asked, no photo check on moments); **D12 open:** rule 10.2 events and a Sunday nudge in the same 30 minutes as the Wrap Up.
- [2026-11-09 21:49 SGT] **Default to confirm:** a `/log` tap on an unchosen habit thanks the parent and offers "Add how you felt"; the reflection is saved once a line is added.
- [2026-11-09 21:49 SGT] **Yesterday test:** replacing it means changing 3 more tests that also log yesterday (your approval covered one); see the question in the session.
- [2026-11-09 21:49 SGT] **Datastore proposal (draft):** Option 1 or 2; undo deletes a checked photo too; how long reflection text is kept.
- SUPERSEDED [2026-11-09 21:49 SGT] [2026-11-09 19:25 SGT] **B2 Sunday rhythm, groups C and D:** C9 to C11 (answering the connection question and saving a moment) go to **Claude Chat** with the [brief](handoffs/2026-11-09-b2-answering-and-saving-brief-for-chat.md); D12 (rule 10.2, a nudge in the same 30 minutes as the Wrap Up) stays in Claude Code. Groups A and B settled 9 Nov.
- SUPERSEDED [2026-11-09 19:25 SGT] [2026-11-09 18:26 SGT] **B2 Sunday rhythm, groups C and D (open, with recommendations):** C9 how long the question can be answered · C10 which week an answer counts for · C11 "Save a moment" and the photo check · D12 rule 10.2 and a nudge in the same 30 minutes as the Wrap Up. Group B settled 9 Nov (fixed template, "Your streak starts next week", monthly section for now; rule 7.8). Details: [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md), group B2.
- SUPERSEDED [2026-11-09 18:26 SGT] [2026-11-09 18:16 SGT] **B2 Sunday rhythm, groups B to D (open, with recommendations):** B6 Wrap Up words · B7 joining week · B8 monthly section · C9 how long the question can be answered · C10 which week an answer counts for · C11 "Save a moment" and the photo check · D12 rule 10.2 and a nudge in the same 30 minutes as the Wrap Up. Details: [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md), group B2.
- [2026-11-08 23:08 SGT] **Q3 (partly answered 8 Nov):** screen 10's draft wording is in, and "the scoreboard" means My page and the Weekly Wrap Up (the first action is logged). **Still open:** which behaviour when two were picked; the Not now reply; prompted or unprompted log (rule 5.2, metric 7); whether it counts toward the joining week (rule 7.6) and metric 8; whether it uses a slot or counts in the 3-a-day cap (rule 3.4); its telemetry event (rule 10.2).
- SUPERSEDED [2026-11-08 23:08 SGT] **Q3:** the "start right now" first action ("proven" is dropped): which behaviour, the Not now reply, not counted as a nudge, and whether it counts toward the joining week.
- [2026-11-09 17:44 SGT] **Q4 (partly answered 9 Nov):** the child's name is never sent to Claude; it is only shown in Telegram. Still open: nudges for families with 2 or more children.
- SUPERSEDED [2026-11-09 17:44 SGT] **Q4:** the child's name is for relevance; nudges for families with 2 or more children need a design discussion, including whether the name goes to Claude.
- **Q5** rename the nine behaviours · **Q7** flows behind the buttons · **Q8** agreement wording · **Q9** bot name and description · **Q10** invite code edge cases · **Q11** stopping halfway (what is kept is now rule 8.13).
- **Q12:** how and when the birth year is collected in the engagement journey.
- [2026-11-11 17:31 SGT] **B1 daily loop:** designed on 8 and 9 Nov (Undo, keyboard, Not today, photos as an add-on, repeat and today-only logs, the 280 limit, typed messages and reflections; [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)). Still to design: how long the bot waits for a photo after a log; what the parent sees if Claude fails to write a reply; withdrawing photo consent (group C); a daily cap on matching calls.
- SUPERSEDED [2026-11-11 17:31 SGT] [2026-11-09 00:08 SGT] **B1 daily loop:** answered on 8 and 9 Nov (Undo with 30 seconds, rule 5.8; a keyboard tap answers a waiting nudge; one-button keyboard fine; wordings confirmed; "unprompted" now means no nudge for that behaviour earlier the same day, rule 5.2, and metric 8 uses the same day). Still to design in B1: Not today, the first-photo consent question, photo check pass and fail, withdrawing photo consent, unchosen, yesterday and repeat logs, a line over 280 characters, the "week has closed" receipt, Claude failing, free-text logging. Details: [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md), group B1.
- SUPERSEDED [2026-11-09 00:08 SGT] [2026-11-08 23:51 SGT] **B1 daily loop:** answered on 8 Nov (Undo approved with 30 seconds, rule 5.8; a keyboard tap answers a waiting nudge; a one-button keyboard is fine; both wordings confirmed). **New small question:** rule 5.2 calls a log "unprompted" when no nudge was sent in the 4 hours before. A keyboard tap that answers a nudge sent earlier than that (say 7 am, tapped at 2 pm) is "answering the nudge" in the chat but "unprompted" for metric 7. Keep both as they are, or change rule 5.2? · Still to design in B1: Not today, the first-photo consent question, photo check pass and fail, withdrawing photo consent, unchosen, yesterday and repeat logs, a line over 280 characters, the "week has closed" receipt, Claude failing, free-text logging. Details: [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md), group B1.
- SUPERSEDED [2026-11-08 23:51 SGT] [2026-11-08 23:42 SGT] **B1 daily loop (recorded 8 Nov):** Q-B1-1 a keyboard tap while a nudge is waiting: prompted or unprompted? · Q-B1-2 Undo window (5 minutes proposed) · Q-B1-3 a one-button keyboard is fine? · approve proposed rule 5.8 (Undo) and the 8.4 edit · confirm the two default wordings ("How did it feel? Type a line…" and "✅ Added to today's log.") · still to design in B1: Not today, the first-photo consent question, photo check pass and fail, withdrawing photo consent, unchosen, yesterday and repeat logs, a line over 280 characters, the "week has closed" receipt, Claude failing, free-text logging. Details: [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md), group B1.
- **Rule 8.13 details:** how long before an unfinished sign-up's data is thrown away, and how the re-engagement message works.

**4e. Privacy-review findings from 9 Nov (you decide what goes into `docs/KNOWN-ISSUES.md`)**
- [2026-11-09 17:50 SGT] **DONE:** you decided all five on 9 Nov; they are in [docs/KNOWN-ISSUES.md](KNOWN-ISSUES.md) with your decisions. The 3 Nov findings also have your decisions (names out of Telemetry and exports, birth year shown as bands, name never sent to Claude).
- [2026-11-09 00:14 SGT] **Medium:** Undo (rule 8.4, edit 5) says it is enforced by the database, but nothing says the database itself checks the 30-second window and "keyboard logs only". If only the code checks them, a bug could quietly undo any old log and change streaks or metrics.
- [2026-11-09 00:14 SGT] **Medium:** "Add how you felt" is free text that may contain a child's name or health details and goes to Claude (rule 5.3). When a log is undone, the spec does not say what happens to its line or photo.
- [2026-11-09 00:14 SGT] **Medium:** "ignore this to skip" has no time limit, so a later, unrelated message could be saved as the log's description and sent to Claude.
- [2026-11-09 00:14 SGT] **Medium:** no spec mentions checking Telegram's webhook secret header, so a forged request could create or undo logs for any parent (to add when building the Telegram bot).
- [2026-11-09 00:14 SGT] **Low:** keyboard taps leave behaviour names in Telegram's chat history, outside Singapore and outside "delete my data" (mention in the PDPA note).

**4c. Needed before the build or group B:** where "Open my page" goes before the Web app exists, and how the parent is signed in; Claude's response time and slow first starts on Vercel, tested in the thin slice; create the Telegram bot (BotFather), the Vercel project and Upstash Redis before the thin slice. (Done: the screen 8 settings are the same as the Web app's, rule 3.14.)

**4d. Parked (you asked me not to raise these first):** [2026-11-09 18:16 SGT] (the stand-alone check-in's time, cap and paused behaviour: decided 9 Nov, B2 group A) "pause" versus "stop"; pausing before the Web app exists (you pause the week-one group by hand?); whether stopping is as easy as starting (governance); Web app sign-in; the two Web app questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md); the first alpha experiment (Claude Chat).

**Privacy-review findings (3 Nov):** you decided on 8 Nov. Finding 1 (data from parents who stop halfway) became rule 8.13; findings 2 to 6 are in [docs/KNOWN-ISSUES.md](KNOWN-ISSUES.md).

---

## 5. Waiting on you (not blocking the next steps)
- [2026-11-11 21:58 SGT] **UAT of thin slice 1** ([checklist](../src/telegram-bot/UAT-thin-slice-1.md)): U2 to U10 pass. Remaining, in the quickest order: **12 Nov before 7 pm** U13 (pause, Run, no message, un-pause), then leave the 7 pm nudge untapped; **13 Nov just after midnight** U12 (tap that nudge's ✅ Done: "Reminder has expired"); **13 Nov 7 pm** U11 (😴 Not today); **any time after an hour's quiet** U14 (reply speed).
- [2026-11-11 22:02 SGT] DONE: Vercel team checked: the owner is the only member (Owner role), so nobody else can see the project's secrets.
- SUPERSEDED [2026-11-11 22:02 SGT] [2026-11-11 21:58 SGT] Vercel: confirm you are the only member of the "Vibe Coding S…" team (others could see the project's secrets); if not, transfer the project to your personal account.
- [2026-11-11 21:58 SGT] Agreement wording (Q8) is still a draft in the live bot; photo consent wording and withdrawing consent go to your PDPA reviewer.
- [2026-11-11 17:38 SGT] DONE: migration 005 applied on Supabase (before query 0 logs; check query matched); fingerprint recorded.
- SUPERSEDED [2026-11-11 17:38 SGT] [2026-11-11 17:29 SGT] **After the pull request is merged:** run the "before" query, then `src/datastore/supabase/migrations/005_photos_reflections_moments.sql`, then the check query, in the Supabase SQL Editor (Claude gives both queries in the session), and paste the result back, so its fingerprint is recorded (rule B1).
- [2026-11-09 21:57 SGT] **Next session, first (5 answers):** the yesterday test (Option A or B); question 12 and rule 10.2; the `/log` default for an unchosen habit; go-ahead for the texts of rules 5.6 and 7.7; the Datastore proposal ([src/datastore/SPEC.md](../src/datastore/SPEC.md), "Proposed").
- [2026-11-09 21:57 SGT] Take to your PDPA reviewer: the photo consent wording (still a placeholder), withdrawing consent, and reflections that mention the child.
- [2026-11-09 18:23 SGT] DONE: migration 004 applied on Supabase (check query matched); fingerprint recorded.
- SUPERSEDED [2026-11-09 18:23 SGT] [2026-11-09 18:16 SGT] **After the pull request is merged:** run `src/datastore/supabase/migrations/004_remove_wrap_up_switch.sql` in the Supabase SQL Editor (removes the Wrap Up's own switch). Then tell Claude, so its fingerprint is recorded (rule B1).
- [2026-11-09 00:10 SGT] DONE: success metrics spreadsheet updated to version 2 (`src/telemetry/Family_Habit_App_Success_Metrics_v2.xlsx`); version 1 deprecated in `docs/archive/`.
- SUPERSEDED [2026-11-09 00:10 SGT] [2026-11-09 00:08 SGT] Update the success metrics spreadsheet (`src/telemetry/Family_Habit_App_Success_Metrics.xlsx`): metric 7 and metric 8 definitions, and the settings "Unprompted log window" (same behaviour, same day) and "Nudge-to-action window" (same behaviour, same day). Or ask Claude to do it.
- [2026-11-08 23:42 SGT] Answer the B1 questions (section 4b), then design B2 (Sunday rhythm) and C in Claude Chat.
- SUPERSEDED [2026-11-08 23:42 SGT] [2026-11-08 22:34 SGT] Design B1 (daily loop), B2 (Sunday rhythm) and C (Settings on the Web app, with the photo store) in Claude Chat; bring back the parked questions (4d) when ready.
- [2026-11-08 22:34 SGT] DONE: answered the proposed rule changes and Q1 to Q13 (8 Nov).
- SUPERSEDED [2026-11-08 22:34 SGT] [2026-11-03 22:42 SGT] **Next session, first:** answer the 8 proposed rule changes (section 4a) and Q1 to Q13 (section 4b).
- [2026-11-08 22:34 SGT] Take PDPA section 16 (withdrawing photo consent) to your PDPA reviewer (see docs/KNOWN-ISSUES.md).
- SUPERSEDED [2026-11-08 22:34 SGT] [2026-11-03 22:27 SGT] Take Q1 (mandatory photo consent) to your PDPA reviewer.
- [2026-11-03 22:27 SGT] Continue the Telegram design in Claude Chat: groups B1, B2, C.
- [2026-11-01 16:38 SGT] DONE: run migration 003 in Supabase (check query matched: 14, 14, 0, INSERT and SELECT, 13).
- [2026-11-01 16:38 SGT] When designing the Web app: the two parked questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md).
- [2026-10-31 16:47 SGT] DONE: Run the unlock script (section 4)
- [2026-10-31 18:04 SGT] DONE: all rewards decisions D1 to D11 answered (31 Oct).
- SUPERSEDED [2026-10-31 18:04 SGT] [2026-10-31 17:46 SGT] Rewards decisions D8 to D10 (section 4); D5 to D7 answered on 31 Oct.
- SUPERSEDED [2026-10-31 17:46 SGT] Rewards decisions D5 to D10 (section 4)
- Nudge personality ([src/nudge-engine/NUDGE-CONTEXT.md](../src/nudge-engine/NUDGE-CONTEXT.md)), which now also guides Claude's validation replies (rule 7.5); context collected from parents; how much free chat the bot supports
- Badge graphics and the look of every screen (Web app, setup)
- **Before launch:** upload MOE school holiday and Singapore public holiday dates
- [2026-10-31 19:18 SGT] First alpha experiment (plans in [src/experiments/EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md))
- SUPERSEDED [2026-10-31 19:18 SGT] Experiment mechanics (parked in `docs/EXPERIMENTS.md`)
