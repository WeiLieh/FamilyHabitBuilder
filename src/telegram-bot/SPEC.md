# Telegram bot: module spec

[2026-10-31 10:12 SGT] The **current rules** of the Telegram bot module: the chat with the parent. Rule IDs are permanent. The dated history of each decision is in the change notes of the master spec, [docs/SPEC.md](../../docs/SPEC.md).

## Purpose
[2026-10-31 10:12 SGT] The parent's main way in: receives nudge messages with ✅ Done and 😴 Not today (rule 3.5, owned by the [Nudge engine](../nudge-engine/SPEC.md)), lets the parent log any time, and passes photos to the [Photo check](../photo-check/SPEC.md). It is a **thin layer**: the decisions live in the Nudge engine, and the data in the [Datastore](../datastore/SPEC.md). Telegram is reached with plain web requests (no Telegram library), through a thin web address in `api/` (rule S3).

## Code in this folder
- [2026-10-31 10:12 SGT] None yet (development order, step 3).

## Design in progress: group A, onboarding (owner decision, design chat, 2026-11-03)
[2026-11-03 22:27 SGT] Recorded from the [design handoff of 3 Nov](../../docs/handoffs/2026-11-03-telegram-onboarding-handoff.md) (previews: the private Claude artifact "Onboarding: Telegram previews (low fidelity)"). **Recorded, not built.** Building starts after groups A, B1 (daily loop), B2 (Sunday rhythm) and C (settings on the Web app, with the photo store) are designed; then a thin slice (sign-up, one fixed nudge, ✅ Done, receipt). Changes to existing rules are listed under "Proposed rule changes" below and wait for the owner's approval. Open questions Q1 to Q13 are in [docs/CATCH-UP.md](../../docs/CATCH-UP.md), section 4.

**Design principles** (owner, adopted 2026-11-02, from Telegram's Bot Guidelines and Bot Features; for the chat bot, not a Mini App)
- [2026-11-03 22:27 SGT] (1) Progressive disclosure, minimise typing. (2) Commands for housekeeping only, never with parameters. (3) No free text for settings or yes/no questions: buttons. (4) Inline buttons for menus, settings and actions; edit the message in place. (5) Handle `/start` very well. (6) Respond fast.
- [2026-11-03 22:27 SGT] Design order: A onboarding → B1 daily loop → B2 Sunday rhythm → C settings on the Web app with the photo store → thin-slice build.

**The onboarding flow** (12 screens; sample parent "John", child "Mia")
- [2026-11-03 22:27 SGT] Order of data collection (owner's): invite code, first name, child name, quick behaviours, deliberate behaviour, times, plan details, **agreement last**, first action, confirmation.

| | 1 Invite link | 2 First name | 3 Child | 4 Quick behaviours | 5 Deliberate behaviour | 6 School-day times |
|---|---|---|---|---|---|---|
| **Bot says** | Bot profile card (name, one-line description). Personal link `t.me/<bot>?start=CODE` (code up to 64 characters) | "Thanks for joining, John!" (name from Telegram, no typing) | "What's your child's name? Type their first name, a nickname works too." Then "Mia. Any other children?" | "Nice to meet you, Mia's parent, John!" "These are quick behaviours. Pick up to 2 to work on." ✓ on selected, edited in place | "Now pick 1 deliberate behaviour. These take some planning. So we've made it optional." Tapping an option moves on (no Next, no ✓) | "For school days, we suggest reminders at these 3 times. Ok?" 7:00 am · 7:00 pm · 9:00 pm. "1 reminder each time. A maximum of 3 in total a day." |
| **Buttons** | START | Change name (one button) | + Add another child · That's all | the 4 quick behaviours · Next | the 5 deliberate behaviours · Skip for now (last) | Yes OK · Change |

| | 7 Weekend and holiday times | 8 Rest of the plan | 9 Before we start | 10 Start right now | 11 All set | 12 Menu button (proposed) |
|---|---|---|---|---|---|---|
| **Bot says** | "For weekends and school holidays, we'll remind you at these times. Is that ok?" 9:00 am · 12:30 pm · 7:00 pm. Same note | "Almost there. A few more things." How often for each quick pick (Every day / Every 2 days) and the deliberate pick (1 / 2 times a week); "Weekly Wrap Up: Sunday at 8:00 pm"; "We'll send at most 3 nudges a day. You can change all of this any time in Settings." **Too long (Q2)** | "Before we start." What we record [draft]; Photos [draft: kept for you, delete any time in Settings]. "You need to agree to join." **Wording draft (Q8)** | "Starting immediately is proven to make the habit easier to form." "Give Mia a hug now!" **Wording to change (Q3)** | Receipt "✅ Saved: Showing affection, today." Then "You're all set, John. Your next reminder is today at 7:00 pm." Then "Your page is here whenever you want to look back. It's empty for now." | `/mypage` Open your page · `/settings` Change your settings · `/pause` Pause reminders · `/resume` Restart reminders · `/help` How this works |
| **Buttons** | Yes OK · Change | Every day / Every 2 days; 1 / 2 times a week; Keep · Change time · Turn off | One checkbox "✓ I agree to both of the above", then DONE | ✅ Done · Not now | Open my page ↗; the Menu button appears next to the message box | n/a |

**Decisions**
- [2026-11-03 22:27 SGT] **First name comes from Telegram** (each Telegram message carries the sender's first name). One button, "Change name". Replaces the earlier two-button design.
- [2026-11-03 22:27 SGT] **Child's name or nickname is collected; more than one child allowed** (personalisation: "Mia's parent"). Needs a change to rule 8.10 (proposed in [src/datastore/SPEC.md](../datastore/SPEC.md)); what the name is used for is Q4.
- [2026-11-03 22:27 SGT] **Deliberate behaviour is optional**; at least 1 behaviour in total is still required (rule 2.1, no change).
- [2026-11-03 22:27 SGT] **Schedule follows the spec**, not the owner's earlier sketch ("max twice a day", times per behaviour): rules 2.3, 3.1 to 3.4 unchanged (see [src/nudge-engine/SPEC.md](../nudge-engine/SPEC.md)). Screens 6 and 7 show the rule 3.3 defaults.
- [2026-11-03 22:27 SGT] **Agreement is the last step before the first action:** one checkbox covers both lines (what we record; photos), then DONE. One tap writes two consent rows (recording, photos) in `consents`. Photo consent becomes a condition of joining: proposed change to rules 5.5 and 11.9 below, **pending Q1 (PDPA)**.
- [2026-11-03 22:27 SGT] **Confirmation** = receipt first, then "You're all set", then a link to the (empty) Web app page. Until the Web app exists, the link goes to a placeholder.
- [2026-11-03 22:27 SGT] **A permanent route to the Web app: the Menu button** with the five commands above (proposed; list to confirm, Q13). `/pause` and `/settings` reply with the Web app link. `/resume` asks for confirmation with buttons, then the bot flips the switch itself (rule 8.4 already lets the server change `paused`).
- [2026-11-03 22:27 SGT] **Pause and stop have a deliberate speed bump** (owner, 2026-11-02; like cancelling a subscription): the parent says pause or stop, the bot replies with a link to the Web app settings page, and the parent pauses there. **Resume is easy and stays in Telegram.** What "stop" means, and pausing before the Web app exists, are parked questions (CATCH-UP section 4).
- [2026-11-03 22:27 SGT] **Sunday rhythm** (owner, 2026-11-02): if the parent logged that week, the Weekly Wrap Up and the weekly connection question (rule 5.6) go in **one message**. If not, no Wrap Up, but the connection question goes out **on its own**, so metric 10 still gets its data point. Needs changes to rules 3.4, 7.8 and 10.2 (proposed in those specs); timing, cap and pause are parked questions.
- [2026-11-03 22:27 SGT] **Design once, reuse:** the "choose behaviours" and "choose times" conversations are designed once and reused by the Web app settings page.
- [2026-11-03 22:27 SGT] **Parking lot:** rework the names of the nine behaviours (not intuitive). Q5.

**Proposed rule changes** (awaiting owner approval; the rule's current text stays in force until then)
- [2026-11-03 22:27 SGT] **Proposed addition to rule 5.6** (Sunday rhythm): add "Sent inside the Weekly Wrap Up when the parent logged that week; otherwise as its own message." Today rule 5.6 does not say when the question is sent. Open before approval: its time, whether it counts toward the cap, and whether it is sent when paused or when the Wrap Up is off (parked questions 1 and 2).
- [2026-11-03 22:27 SGT] **Flag, rule 5.1** (log any time, including a "Log something" button): the proposed Menu (screen 12) has no "log" command. Not a conflict yet, since the daily loop (group B1) designs logging; noted so it isn't lost.

## Rules at a glance
5.1 log any time · 5.3 optional description (the Investment) · 5.4 unchosen, late and repeat logs · 3.14 Weekly Wrap Up on the setup screen · 5.6 weekly connection question: one tap

## Rules
- **5.1** Parents can log **any time**: tap ✅ Done on a nudge message, a "Log something" button, or free text Claude understands. *(decided 28 Oct)* Not yet tested (nothing built).
- **5.3** Optional **description** (up to 280 characters) = the Hooked "Investment". Over 280: the bot asks to shorten it. Shown in the web app and snapshot, and given to Claude for future nudges. *(decided 24 Oct)* Not yet tested (nothing built; the 280 limit per nudge is checked by the Nudge repository tests).
- **5.4** Logging a behaviour not chosen: **accepted with thanks**, doesn't count toward targets. Logging late: **back to yesterday only**. Twice in a day: counts once for targets and streaks, but **should still be celebrated (WIP)**. *(decided 28 Oct)* Tested by: tests/nudge-engine-due.test.ts and tests/nudge-engine-planner.test.ts (how such logs affect what is due). The bot side (accepting, thanking, refusing older dates) is not built yet.
- **3.14** [2026-10-31 17:52 SGT] The **setup screen** shows the Weekly Wrap Up as a visible setting: "Weekly Wrap Up: Sunday at [time] [change] [turn off]" (rule 3.12), so the parent stays in control (rule 2.1). *(decided 31 Oct)* Not yet tested (nothing built).
- **5.6** [2026-11-01 16:07 SGT] **Weekly connection question** ("How connected did you feel with your child?", 1 to 5, metric 10). After the first tap, the bot removes the buttons and shows "Thanks, you answered 4". Any extra tap that still arrives is ignored and the first answer counts (database backstop, rule 8.6). A parent can't change the answer that week. *(decided 1 Nov)* Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T30, the database backstop). Removing the buttons is not built yet (Telegram bot).
