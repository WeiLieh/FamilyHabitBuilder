# Handoff to Claude Code: owner's edits to the Telegram onboarding screens (8 Nov 2026)

Date: 2026-11-08, about 23:10 Singapore Time. Source: design chat in Claude Chat, Project "Family Habit App". Follows the 3 Nov handoff ([2026-11-03-telegram-onboarding-handoff.md](2026-11-03-telegram-onboarding-handoff.md)) and your session 9 (commit `51e9625`, your 8 Nov approvals).

## 0. What to do

1. Record the changes in section 2 as **dated notes** in `src/telegram-bot/SPEC.md` (the flow table, the decisions list and rule 3.14) and in `src/experiments/SPEC.md` (rule 11.9). Use the format `[YYYY-MM-DD HH:MM SGT]` (run `TZ=Asia/Singapore date`). Mark replaced wording `SUPERSEDED [timestamp]` and keep the old line (never delete or rewrite old entries).
2. These are **owner decisions from the design chat on 8 Nov**. The owner answered four questions directly (marked "owner answered" below). Items marked "default chosen" are my defaults where the owner said "no preference"; show them to him for a quick confirmation.
3. Add a change note (next version number) to `docs/SPEC.md` and link this handoff from the document index (rule D1).
4. Update `docs/CATCH-UP.md`: Q3 is now partly answered (section 3 below).
5. Do not build anything. Recording only.

## 1. What changed on the preview screens since the 3 Nov flow table

The owner edited the preview canvas (private Claude artifact "Onboarding: Telegram previews (low fidelity)") after your session 9 recorded the table. Current copy of the screens that changed:

| Screen | Recorded in the spec now | Current on the preview |
|---|---|---|
| 6 School-day times | "For school days, we suggest reminders at these 3 times. Ok?" · buttons **Yes OK** · Change | "For school days, we'll suggest reminders at these 3 times." 7:00 am · 7:00 pm · 9:00 pm. "1 reminder each time. A maximum of 3 in total a day." Buttons **OK** · Change |
| 7 Weekend and holiday times | "For weekends and school holidays, we'll remind you at these times. Is that ok?" · **Yes OK** · Change | "For weekends and school holidays, we'll remind you at these times." 9:00 am · 12:30 pm · 7:00 pm. Same note. Buttons **OK** · Change |
| 8 Plan summary | Buttons **OK** · **Change in settings** (rule 3.14) | Same text, **one button: OK**. The "Change in settings" button is gone |
| 9 Before we start | One checkbox "✓ I agree", then **DONE** (rule 11.9) | Recording sentence (draft) and "You need to agree to join." **One button "✅ I agree". No DONE** |
| 10 Start right now | "Starting immediately is proven to make the habit easier to form." "Give Mia a hug now!" · ✅ Done · Not now | "Start right now, and get on the scoreboard immediately by showing Mia some affection." "Give her a hug !" · **✅ I've started!** · Not now |
| 11 All set | "✅ Saved: Showing affection, today." (then "You're all set, John..." and the My page link) | The separate "Give Mia a hug now!" bubble is gone. First bubble: "✅ Saved: Showing affection today. You're off to a great start." Then "You're all set, John. Your next reminder is today at 7:00 pm." Then "Your page is here whenever you want to look back. It's empty for now." with **Open my page ↗** |

Screens 1 to 5 and 12 are unchanged from your table, except screen 3 (see 2.5).

## 2. Decisions to record

### 2.1 Rule 3.14, screen 8 has one button (owner answered)
Sign-up screen 8 shows the plan as one summary with a single **OK** button. Remove "Change in settings" from the rule text and from the flow table. The line "Change these anytime in Settings" stays in the message. Rule 3.14's other content (defaults from rule 2.5; same settings as the Web app, rule 9.1) is unchanged. Keep the old wording as SUPERSEDED.

### 2.2 Rule 11.9, screen 9 has one button (owner answered)
The last sign-up step is the recording agreement with **one button, "✅ I agree"**. There is **no DONE button**: tapping it records the agreement and moves on. Update the 11.9 wording ("One checkbox agrees, then DONE") accordingly; the agreement is still recorded, still a condition of joining, and still recording only (photo consent stays at the first photo, rule 5.5). Wording of the sentence is still a draft (Q8).

### 2.3 Screens 6 and 7 wording (from the owner's edit)
Buttons are **OK** and **Change**. The question tags "Ok?" and "Is that ok?" are removed. Rule 3.1 (at least 1 hour apart) still applies in the Change picker; Q6 stays "intentional".

### 2.4 Screen 10, the first action (Q3, partly answered)
- **Wording (owner's draft):** "Start right now, and get on the scoreboard immediately by showing Mia some affection. Give her a hug !" with buttons **✅ I've started!** and **Not now**. Record it as the current draft.
- **Owner answered what "the scoreboard" means:** the first action **is logged**. It appears on **My page** (rule 9.1), the dashboard of everything the parent has logged, and in **the Weekly Wrap Up** (rule 3.12), which covers only the past 7 days. The Wrap Up is a subset of My page. There is no XP or level (decision D1), so "scoreboard" here is a figure of speech for those two views. Add a line to the spec saying so.
- **Pronoun (default chosen, owner had no preference):** the spec should say "Give `<child name>` a hug", with no pronoun, because the bot only knows the child's name. The preview screen still says "her"; the owner has not changed it yet, so mention this when you show him the change.
- **Still open (Q3):** which behaviour the first action uses when the parent picked two; the reply to **Not now**; whether the first action counts as a prompted or an unprompted log (rule 5.2, metric 7); whether it counts toward the joining week (rule 7.6) and toward metric 8; whether it uses a slot or counts in the 3-a-day cap (rule 3.4); the new event for telemetry (rule 10.2).

### 2.5 Screen 3 wording (default chosen, owner had no preference)
The preview says "What's your childs name ?". Record it as "What's your child's name?" (apostrophe added, no space before the question mark), and tell the owner you did.

### 2.6 Screen 11, the receipt (default chosen, owner had no preference)
Record the **fixed receipt** as "✅ Saved: `<behaviour>` today." The second sentence, "You're off to a great start.", is **an example of the warm reply Claude writes after the receipt** (rule 7.5), not fixed text. The separate "Give Mia a hug now!" bubble is removed from this screen.

## 3. Open questions after this handoff (CATCH-UP section 4)

- **Q3 (reduced):** see "Still open" in 2.4.
- **Q4, Q5, Q7, Q8, Q9, Q10, Q12** and rule 8.13 details: unchanged.
- **Parked (4d):** unchanged: the stand-alone check-in (rules 3.4, 5.6, 10.2), "pause" versus "stop", pausing before the Web app exists, governance, Web app sign-in, the two Web app questions.
- **New small points for the owner:** (a) the preview screen 10 still says "her" (see 2.4); (b) screen 9 now has no DONE, so check rule 11.9's other wording ("Each agreement is saved as its own record") still reads correctly with one button.

## 4. Where I got this

Compared the live preview canvas (version of 8 Nov, 23:02 SGT) against `src/telegram-bot/SPEC.md` at commit `51e9625` on branch `claude/festive-einstein-nf623s`. I did not edit any spec.
