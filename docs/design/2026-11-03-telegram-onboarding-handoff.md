# Handoff to Claude Code: Telegram bot design, group A (onboarding)

Date: 2026-11-03 (Singapore Time). Owner: Wei Lieh (product manager, non-developer).
Source: design chat in claude.ai, Project "Family Habit App". Previews: private Claude artifact "Onboarding: Telegram previews (low fidelity)", https://claude.ai/artifact/V3vzRY3r939zLMmJnMFCBu (12 screens, includes the owner's own edits made on 2026-11-03).
Companion log (same content, newest first): Project doc `claude/telegram-bot-design-decisions.md`.

## 0. What I want you to do in this session

1. Read `CLAUDE.md`, `docs/SPEC.md`, `docs/CATCH-UP.md`, `src/telegram-bot/SPEC.md`, `src/nudge-engine/SPEC.md`, `src/datastore/SPEC.md`, `src/web-app/SPEC.md`, `src/telemetry/SPEC.md`.
2. **Record, do not implement.** Write the decisions in section 2 as **dated notes** in the specs named in section 5. Mark each as "owner decision, design chat, 2026-11-03". Where a decision conflicts with an existing rule, do not silently overwrite the rule: show the old text, the new text, and flag it for the owner to approve (the spec is the source of truth; rule 1.3 says no fallbacks).
3. Put the open questions in section 3 into the repo as an "Open questions" list (suggested home: `docs/CATCH-UP.md` or `docs/KNOWN-ISSUES.md`, your call, tell me which) so they are not lost.
4. Update `docs/CATCH-UP.md` and `docs/PROGRESS.md` with where design stands (section 6).
5. Do not start building. Build happens after all of groups A, B1, B2 and C are designed (section 6).
6. Explain things to me in plain English with analogies, spell out every acronym on first use, and put attributes as rows and items as columns in any comparison table.

## 1. Design principles (adopted by the owner, 2026-11-02)

From Telegram's own [Bot Guidelines](https://core.telegram.org/bots/guidelines) and [Bot Features](https://core.telegram.org/bots/features). They apply to the **chat bot**, not to a Mini App (theme parameters and haptic feedback are Mini App only).

1. Progressive disclosure and minimise text entry.
2. Commands for housekeeping only (`/start`, `/help`, `/cancel`, and the menu commands below), never with parameters.
3. No free text for settings or yes/no questions. Use buttons.
4. Inline keyboards for menus, settings and actions that change an existing message. Edit in place.
5. Handle `/start` very well.
6. The bot must respond fast.

Design order (agreed): A onboarding, then B1 daily loop (nudge, logging, reply), then B2 Sunday rhythm (Weekly Wrap Up, weekly connection check-in), then C settings on the Web app together with the photo store. Then build a thin slice (sign-up, one fixed nudge, ✅ Done, receipt) so Vercel, Telegram, Supabase and scheduler problems show up early.

## 2. Decisions to record (owner-approved in chat)

### 2.1 The onboarding flow (12 screens, current copy)

Sample names: parent "John", child "Mia".

| No | Screen | Bot says | Buttons |
|---|---|---|---|
| 1 | Invite link opens the bot | Bot profile card: name, one-line description, START. Personal invite link `t.me/<bot>?start=CODE` (code up to 64 characters). | START |
| 2 | First name | "Thanks for joining, John!" (name taken from Telegram, no typing) | **Change name** (one button only) |
| 3 | Child | "What's your child's name? Type their first name, a nickname works too." Parent types it. Then "Mia. Any other children?" | + Add another child, That's all |
| 4 | Quick behaviours | "Nice to meet you, Mia's parent, John!" then "These are quick behaviours. Pick up to 2 to work on." Toggle buttons, ✓ on selected, message edited in place. | Talking with children, Showing affection, Descriptive praise, Giving attention, Next |
| 5 | Deliberate behaviour (optional) | "Now pick 1 deliberate behaviour. These take some planning. So we've made it optional." **Tapping any option moves on. No Next button, no ✓ state.** | Spending quality time, Interesting activities, Setting a good example, Incidental teaching, Ask-say-do, **Skip for now (last)** |
| 6 | School-day times | "For school days, we suggest reminders at these 3 times. Ok?" 7:00 am · 7:00 pm · 9:00 pm. "1 reminder each time. A maximum of 3 in total a day." | Yes OK, Change |
| 7 | Weekend and holiday times (new) | "For weekends and school holidays, we'll remind you at these times. Is that ok?" 9:00 am · 12:30 pm · 7:00 pm. Same note. | Yes OK, Change |
| 8 | Rest of the plan (**too long, see Q2**) | "Almost there. A few more things." "How often for Showing affection?" (Every day / Every 2 days). "How often for Spending quality time?" (1 time a week / 2 times a week). "Weekly Wrap Up: Sunday at 8:00 pm" (Keep / Change time / Turn off). "We'll send at most 3 nudges a day. You can change all of this any time in Settings." | as listed |
| 9 | Before we start | "Before we start. **What we record.** [draft sentence] **Photos.** [draft: photos you share are kept for you, and you can delete them any time in Settings.] You need to agree to join." | **One** checkbox button "✓ I agree to both of the above", then **DONE** |
| 10 | Start right now | "Starting immediately is proven to make the habit easier to form." (**wording to change, see Q3**) "Give Mia a hug now!" | ✅ Done, Not now |
| 11 | All set | Receipt "✅ Saved: Showing affection, today." Then "You're all set, John. Your next reminder is today at 7:00 pm." Then "Your page is here whenever you want to look back. It's empty for now." | Open my page ↗ ; **Menu** button appears next to the message box |
| 12 | Menu button (proposed) | Command list: `/mypage` Open your page, `/settings` Change your settings, `/pause` Pause reminders, `/resume` Restart reminders, `/help` How this works. | n/a |

Order of data collection is the owner's: invite code, first name, child name, quick behaviours, deliberate behaviour, times, plan details, **agreement last**, first action, confirmation.

### 2.2 Decisions

1. **Child's name or nickname is collected, more than one child allowed.** Reason: personalisation ("Mia's parent"). **Conflicts with rule 8.10** (children table stores birth year only, no name). Needs a spec change: add a name field to `children` (see Q4 about its purpose).
2. **First name comes from Telegram** (the Telegram update carries the sender's first name). One button, Change name. Replaces the earlier two-button design.
3. **Per-spec schedule is chosen over the owner's earlier sketch.** The sketch said "max twice a day" and asked times per behaviour. The spec stands: up to 3 times per schedule, shared by all behaviours (rules 3.1, 3.4), school-day and non-school-day schedules (3.2) with defaults (3.3), frequency asked per behaviour (2.3). Rules 2.3, 3.1, 3.4 therefore need **no change**.
4. **Consent is the last step before the first action**, under "Before we start". One checkbox covers both lines (what we record; photos), then DONE. **Photo consent is mandatory to join**; wording says the parent can **delete photos any time in Settings**. This changes rules 5.5 and 11.9 and adds a Web app feature "delete a photo" (rule 9.1 today only has "delete my data"). The database can still store two consent answers (one tap writes both). **See Q1: Personal Data Protection Act (PDPA) risk.**
5. **Deliberate behaviour is optional**, and at least 1 behaviour in total is still required (rules 2.1, 2.2).
6. **Confirmation** = receipt first, then "You're all set", then a link to the (empty) Web app page. Until the Web app exists the link goes to a placeholder.
7. **A permanent route to the Web app inside Telegram: the Menu button** with the five commands above (proposed). `/pause` and `/settings` reply with the Web app link (the pause "speed bump", 2026-11-02). `/resume` asks for confirmation **with buttons** and the bot flips the switch itself (rule 8.4 already lets the server change `paused`).
8. **Sunday rhythm (decided 2026-11-02):** if the parent logged that week, the Weekly Wrap Up and the weekly connection check-in are **bundled into one message**. If the parent did not log, no Wrap Up is sent, but the check-in goes out **as a separate stand-alone message** so the data point (rule 5.6) is still collected.
9. **Pause and stop have a deliberate speed bump** (like subscription services): the parent says pause or stop, the bot replies with a link to the Web app settings page, the parent pauses there. **Resume is easy and stays in Telegram** (confirm with buttons, bot flips the switch).
10. **Parking lot: rework the names of the nine behaviours, they are not intuitive.** (Names today: Talking with children, Showing affection, Descriptive praise, Giving attention, Spending quality time, Interesting activities, Setting a good example, Incidental teaching, Ask-say-do.)
11. **Conversations 2 and 3 of the original list (choose behaviours, choose times) are designed once and reused** by the Web app settings page.

## 3. Consolidated open questions

Priority: **A = blocks recording or building group A**, **B = needed before group B/C or build**, **C = parked, do not raise first (owner's request)**.

### 3A. Group A design questions (owner decides)

| Q | Question | Detail and options | Rules touched |
|---|---|---|---|
| Q1 | **Is mandatory photo consent allowed under the PDPA?** | PDPA 2012 s 14(2)(a): must not require consent beyond what is reasonable to provide the service as a condition of it; s 14(3): such consent "is not validly given". Photos are optional to send (rules 5.5, 6.1), so a reviewer will ask why consent is required to join. Owner takes this to his PDPA reviewer. Alternative offered: one checkbox now for "what we record", and ask photo consent at the first photo. Also confirm "mandatory" means mandatory *consent* only, sending photos stays optional. Sources: [PDPC advisory guidelines](https://pdpc.gov.sg/-/media/files/pdpc/pdf-files/press-room/2015/advisoryguidelinesonrequiringconsentformarketing8may2015.pdf), [s 14 text](https://lawplayer.com/sg/act/PDPA2012/14) (re-check Singapore Statutes Online for current wording). | 5.5, 11.9 |
| Q2 | **Screen 8 is too long. How to shorten?** | Owner: "No suggestion yet", so do not redesign. Neutral facts for later: the weekend block already moved to screen 7; the screen has 2 frequency questions, the Wrap Up and a closing note. | 2.3, 3.12, 3.14 |
| Q3 | **First action on screen 10.** | Pending recommendation (not yet accepted): (1) one tap, about 10 seconds, no set-up, from the parent's first quick pick, with one reviewed "do it now" line per quick behaviour; (2) keep it last, after consent, because a log is personal data; (3) **drop "proven"** unless a citable source is found (suggest "The easiest time to start is right now."); (4) Done / Not now, with a no-guilt reply to Not now; (5) if only a deliberate behaviour was picked, skip the action; (6) receipt plus Claude's warm reply straight away (rule 7.5); (7) not a slot, not counted toward the 3-a-day cap or metric 8 (nudge-to-action). Open inside it: how it counts toward the joining week (rule 7.6). | 3.4, 7.5, 7.6, 10.2 |
| Q4 | **Second child: what is the name for?** | Owner's understanding: only to refer to the child in nudges, logic otherwise per spec. Open: which child's name a nudge uses when there are 2 (alternate, ask when logging, or something else); whether the child name goes to Claude when generating nudge words; the name field itself is a spec change (decision 2.2.1). | 8.10, 3.13 |
| Q5 | **Behaviour names** (parking lot). | Rework the nine names so they are intuitive. Remind the owner. | `nudges` seed CSV |
| Q6 | **"At least 1 hour apart" disappeared from screens 6 and 7.** | The owner's edit shortened the note to "1 reminder each time. A maximum of 3 in total a day." Rule 3.1 still requires at least 1 hour apart. Confirm it is intentional (the rule is enforced inside the Change picker, not stated in the note). | 3.1 |
| Q7 | **Flows behind the buttons are not designed:** Change name, Change times (30-minute blocks 7:00 am to 9:30 pm, up to 3, at least 1 hour apart, greyed-out invalid times), Change Wrap Up time, validation when the parent tries to continue with zero behaviours. | Design as part of the "design once, reuse in Web app" decision. | 2.1, 3.1, 3.14 |
| Q8 | **Agreement wording is still draft** on screen 9: one plain sentence on what we record and why, and the photo sentence. | Must state the recording sentence (rule 11.9); agreement is stored. | 11.9, 5.5 |
| Q9 | **Bot name and bot description** are placeholders on screen 1. | One line on what it does and who it is for. | n/a |
| Q10 | **Invite code edge cases:** invalid code, already-used code, bot opened directly with no code. | Spec has the code rules (8.6, 11.11); design the messages. | 8.6, 11.11 |
| Q11 | **Dropped halfway:** what happens if the parent stops before screen 11 (suggestion: no nudges until at least one behaviour and one time slot; a gentle resume). | Not decided. | 2.1, 3.1 |
| Q12 | **Not in the flow yet:** child's birth year (rule 8.10, asked from alpha) and the experiments opt-out (rule 11.9, offered before alpha). Does birth year stay now that a name is collected? | Decide when. | 8.10, 11.9 |
| Q13 | **Menu commands: confirm the list.** Also: should typing the word "pause" or "resume" (no slash) work as well as the commands, given principle 3? | Proposed list in 2.1. | 3.5, 9.1 |

### 3B. Needed before build or group B

- Wrap Up is a visible setting (rule 3.14); check that screen 8 offering it in onboarding matches the Web app setting.
- "Open my page" link: until the Web app exists, where does it go, and how is the parent signed in (see C-list below)?
- Claude's response time and serverless cold starts against principle 6, to test in the thin slice.

### 3C. Parked questions (owner asked not to raise first)

1. **Stand-alone weekly check-in:** what time on Sunday (same as the Wrap Up, or its own)? Does it count toward the 3-a-day cap (rule 3.4)? It is a third kind of bot-initiated message: rule 3.4 and telemetry rule 10.2 (own event, never counted as a nudge) need updating.
2. **Paused, or Wrap Up turned off:** is the stand-alone check-in still sent? Rule 3.12 says paused means muted, so sending it would break the mute.
3. **"Pause" versus "stop":** one switch (paused = muted), or does "stop" mean leaving the service and deleting data?
4. **Pause path before the Web app exists:** the Web app is build step 7, so the thin slice has no settings page. Interim idea: the owner pauses people by hand for the week-one friends group.
5. **Governance angle:** a reviewer (for example a Change Advisory Board (CAB) or privacy reviewer) may ask whether stopping is as easy as starting. Mitigation to consider: plain wording, never guilt-trip, and a parent can always mute or block the chat in Telegram itself.
6. **Web app sign-in for the pause and page links:** one-tap, tied to that parent. Unverified idea: Mini Apps identify the parent automatically; check at group C.
7. **Two parked Web app questions (answered when we reach group C):** how the Web app reaches the database, and whether parents' descriptions are sent to Claude (`src/web-app/SPEC.md`).

## 4. Facts you can rely on (from the repo, verified in design chat)

- Spec rules cited: 2.1 to 2.4 (behaviour counts and frequency), 3.1 to 3.5 (slots, two schedules, defaults, 3 a day, ✅ Done and 😴 Not today), 3.12 to 3.14 (Wrap Up, fresh example per nudge), 5.1 to 5.6 (logging, photos, weekly question), 6.1 and 6.2 (photo check), 7.5 and 7.6 (receipt then warm reply; steady week), 8.4, 8.6, 8.10 (datastore), 9.1 (Web app), 11.9 and 11.11 (consent, cohort label), 1.2 (Singapore time), 1.3 (no fallbacks).
- Stack: TypeScript, Vercel (Singapore region), Supabase (Singapore), Upstash Redis, Claude for nudge words and the photo check, plain web requests to Telegram (no Telegram library).
- `src/nudge-engine/NUDGE-CONTEXT.md` is still empty ("To be written").

## 5. Where to record each decision (suggested)

| Decision or question | Record in |
|---|---|
| Flow, copy, buttons, deliberate optional, first name from Telegram, Menu button | `src/telegram-bot/SPEC.md` (dated note) |
| Child name field (8.10); consent fields for what-we-record and photos | `src/datastore/SPEC.md` |
| Mandatory photo consent, agreement last, delete a photo | `docs/SPEC.md` rules 5.5, 11.9; `src/web-app/SPEC.md` rule 9.1 |
| Schedule confirmed per spec; first action not a slot, not counted in the cap | `src/nudge-engine/SPEC.md` rules 3.4, 3.5 |
| Stand-alone check-in as a third message kind; first-action event | `src/telemetry/SPEC.md` rule 10.2 |
| Sunday bundling and pause/resume flows | `src/telegram-bot/SPEC.md`, `src/variable-rewards/SPEC.md` if rule 7.x touched |
| Open questions (section 3) | `docs/CATCH-UP.md` or `docs/KNOWN-ISSUES.md` |

## 6. State of the work and what comes next

- Group A: designed except the open questions in 3A.
- Next design groups: B1 daily loop (nudge message, logging, reply), B2 Sunday rhythm (Wrap Up and check-in), C settings on the Web app with the photo store.
- Then: thin-slice build (sign-up, one fixed nudge, ✅ Done, receipt).
- Working method: the owner designs and decides in claude.ai chat; you record decisions in the repo and later build. Claude in chat has read-only access to the repo and cannot push.
