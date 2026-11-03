# Catch-up page: read this first after time away

**Last updated: [2026-11-03 22:42 SGT]** (session 8 ended: Telegram onboarding design recorded).

> [2026-11-03 22:42 SGT] **⏰ Reminder, first thing next session:** you said you'd answer the **8 proposed rule changes** (section 4a, table) and the open questions (section 4b). Claude asks for them before building anything. Claude updates this page at the end of every session and shows it at the start of the next. Unlike the other project files, this page is a **current snapshot**: it is rewritten each time, and older versions stay in Git history. The dated, never-deleted record of each decision is in `docs/SPEC.md` (Change notes).

Contents: 1. Module map · 2. Modules: purpose, files and tests · 3. Rules: where each one lives · 4. Questions to think about before next session · 5. Waiting on you

---

## 1. Module map

The modules from your architecture diagram, coloured by progress (9 since 31 Oct: Experiments added [2026-10-31 19:06 SGT]). Numbers match the table in section 2.

[2026-10-31 09:40 SGT] The module map now lives in one place: **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** (also the source of each module's status, checked by the drift test).

**Colours:** green = built and tested; yellow = partly built; grey = not started.

**Development order (agreed):** (1) Nudge repository, then Nudge engine decisions ✅ done → (2) Datastore with event log ✅ **tables live (1 Nov)** → (3) Telegram bot, first deploy ⬅ **design in progress** (group A onboarding designed 3 Nov; next B1 daily loop, B2 Sunday rhythm, C settings on the Web app with the photo store; then a thin-slice build) → (4) Variable rewards, then Nudge engine words → (5) Photo check → (6) Telemetry → (7) Web app.

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
- **2.1 to 2.4, 3.1 to 3.13**: [Nudge engine](../src/nudge-engine/SPEC.md)
- **4.1 to 4.6**: [Nudge repository](../src/nudge-repository/SPEC.md)
- **5.1, 5.3, 5.4, 5.6, 3.14**: [Telegram bot](../src/telegram-bot/SPEC.md) · **5.2, 10.1 to 10.4**: [Telemetry](../src/telemetry/SPEC.md) · **5.5, 8.1 to 8.12**: [Datastore](../src/datastore/SPEC.md) (the 14 tables are listed there, under "Tables")
- **6.1, 6.2**: [Photo check](../src/photo-check/SPEC.md)
- **7.1 to 7.8**: [Variable rewards](../src/variable-rewards/SPEC.md)
- **9.1**: [Web app](../src/web-app/SPEC.md) (plus two parked questions)
- **11.1 to 11.13**: [Experiments](../src/experiments/SPEC.md); the 31 values and their five kinds are in [EXPERIMENTS.md](../src/experiments/EXPERIMENTS.md)
- Structure rules (S, R, D, B, P) and retired rule IDs: [docs/SPEC.md](SPEC.md), "Modules and structure"

---

## 4. Questions to think about before next session

[2026-11-03 22:27 SGT] Session 8 recorded the **Telegram onboarding design (group A)** from Claude Chat into the specs, without building ([handoff](handoffs/2026-11-03-telegram-onboarding-handoff.md); the flow is in [src/telegram-bot/SPEC.md](../src/telegram-bot/SPEC.md)). Full detail of every question below is in the handoff, section 3.

**4a. Approve or change the 8 proposed rule changes** (nothing changes until you approve; full text in each spec, under "Proposed rule changes"). "Old" = what the rule says today and is still in force; "New" = Claude's draft from your design-chat decisions. Reply e.g. "approve 9.1 and 7.8". The two marked "Nothing" can be approved now; the rest need their question answered first.

| Section | The change | Spec | Old spec, what it says | New draft, what you propose | Waits on |
|---|---|---|---|---|---|
| **8.10** | Store the child's name | [Datastore](../src/datastore/SPEC.md) | "Optional: one row per child with a **birth year** only (**no name**, month or school)." | "One row per child with a **first name or nickname** (asked at sign-up, one or more children) and an optional birth year (no month or school)." | Q4, Q12 |
| **5.5** | Photo consent required to join | [Datastore](../src/datastore/SPEC.md) | "Photos: always optional; consent once at sign-up; kept until the parent deletes their data." | "Sending a photo is always optional. Photo consent is **required to join**, given once at sign-up in the same tap as the recording agreement. Photos are kept until the parent **deletes a photo** or their data." | **Q1 (PDPA)** |
| **11.9** | One checkbox, as the last step | [Experiments](../src/experiments/SPEC.md) | "The sign-up message says in one plain sentence what is recorded and why, **next to the photo consent**, and the parent's agreement is recorded." | "The **last sign-up step** ('Before we start') gives the recording sentence and the photo sentence. **One checkbox** agrees to both, then DONE. Each agreement is saved as its own record." | Q1, Q8 |
| **9.1** | Settings page and "delete a photo" | [Web app](../src/web-app/SPEC.md) | "Plain, unstyled pages that show the right data; the look comes from the owner later. 'Delete my data' lives here." | "...'Delete my data' and **'delete a photo'** live here, plus a **settings page** (behaviours, times, Weekly Wrap Up, **pause**). `/pause` and `/settings` in Telegram link here; resume stays in Telegram." | Nothing |
| **3.4** | A third kind of bot message | [Nudge engine](../src/nudge-engine/SPEC.md) | "**Two kinds** of bot message: a nudge message and the Weekly Wrap Up. At most 1 nudge message per slot and 3 a day. Replies and the Wrap Up never count." | "**Three kinds:** a nudge message, the Weekly Wrap Up (which then also carries the connection question), and the **connection question on its own**. Replies, the Wrap Up and [open: the stand-alone question] never count." | Parked questions (4d): time, cap, paused |
| **7.8** | Connection question inside the Wrap Up | [Variable rewards](../src/variable-rewards/SPEC.md) | "The Weekly Wrap Up shows **5 items**: days logged, steady weeks, photos and lines saved, a link to the Web app, 'Want to save one moment from this week?'" | "Add **item 6: the weekly connection question**, so a parent who logged gets one Sunday message. A parent who didn't log gets no Wrap Up, only the question on its own." | Nothing |
| **10.2** | New events for tracking | [Telemetry](../src/telemetry/SPEC.md) | "'Weekly Wrap Up sent' is recorded as its own event. Metrics 8 and 9 never count it as a nudge message." | "'Wrap Up sent' and **'connection question sent on its own'** are each their own event, never counted as nudges. If Q3 is accepted, also a **'first action at sign-up'** event." | Q3 |
| **5.6** | When the connection question is sent | [Telegram bot](../src/telegram-bot/SPEC.md) | "Weekly connection question (1 to 5). After the first tap, the buttons are removed..." **Says nothing about when it is sent.** | Add: "**Sent inside the Weekly Wrap Up** when the parent logged that week; **otherwise on its own.**" | Parked questions (4d) |

**4b. Open questions for group A** (you decide):
- **Q1 PDPA:** may photo consent be required to join? (Singapore's Personal Data Protection Act, section 14(2)(a).) You are taking it to your PDPA reviewer. Alternative: ask photo consent at the first photo.
- **Q2:** screen 8 is too long; how to shorten it (no suggestion yet).
- **Q3:** the "start right now" first action: wording ("proven" needs a source), which behaviour, Not now reply, not a slot and not counted in the cap or metric 8, and whether it counts toward the joining week.
- **Q4:** what the child's name is for, which name a nudge uses with 2 children, and whether it goes to Claude.
- **Q5:** rename the nine behaviours (parking lot).
- **Q6:** "at least 1 hour apart" left the note on screens 6 and 7: intentional? (Rule 3.1 still applies in the Change picker.)
- **Q7:** flows behind the buttons: Change name, Change times, Change Wrap Up time, continuing with zero behaviours.
- **Q8:** agreement wording on screen 9 (must include the rule 11.9 sentence).
- **Q9:** bot name and one-line description.
- **Q10:** invite code edge cases: invalid, already used, no code.
- **Q11:** a parent who stops halfway through sign-up.
- **Q12:** when to ask the child's birth year and the experiments opt-out; does birth year stay now that a name is collected?
- **Q13:** confirm the Menu commands; should plain "pause" or "resume" (no slash) also work? (Also: the Menu has no "log" command, rule 5.1.)

**4c. Needed before the build or group B:** the Wrap Up setting on screen 8 matches the Web app setting (rule 3.14); where "Open my page" goes before the Web app exists, and how the parent is signed in; Claude's response time and slow first starts on Vercel, tested in the thin slice. Still from session 7: create the Telegram bot (BotFather), the Vercel project and Upstash Redis before the thin slice.

**4d. Parked (you asked me not to raise these first):** the stand-alone check-in's time, cap and paused behaviour; "pause" versus "stop"; pausing before the Web app exists (you pause the week-one group by hand?); whether stopping is as easy as starting (governance); Web app sign-in; the two Web app questions in [src/web-app/SPEC.md](../src/web-app/SPEC.md); the first alpha experiment (Claude Chat).

[2026-11-03 22:27 SGT] Session 7's questions: 1 (sign-up wording) and 2 (buttons or designed screens) are now being designed in Claude Chat (above); 3 (accounts) moved to 4c; 4 (first alpha experiment) moved to 4d.

---

## 5. Waiting on you (not blocking the next steps)
- [2026-11-03 22:42 SGT] **Next session, first:** answer the 8 proposed rule changes (section 4a) and Q1 to Q13 (section 4b).
- [2026-11-03 22:27 SGT] Take Q1 (mandatory photo consent) to your PDPA reviewer.
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
