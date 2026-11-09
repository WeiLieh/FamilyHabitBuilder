# Handoff to Claude Code: B1 part 2, Not today, photos, repeat logs, today-only logging (9 Nov 2026)

Date: 2026-11-09, about 21:00 Singapore Time. Source: design chat in Claude Chat, Project "Family Habit App". Follows [2026-11-08-telegram-b1-daily-loop.md](2026-11-08-telegram-b1-daily-loop.md) and [2026-11-09-telegram-b2-answering-and-saving.md](2026-11-09-telegram-b2-answering-and-saving.md). Previews: private canvas "Onboarding: Telegram previews (low fidelity)", boards B1-6 to B1-11.

## 0. What to do
1. Record section 2 as **dated notes** in `src/telegram-bot/SPEC.md` (rules 3.5, 5.1, 5.3, 5.4, 5.5, 6.1, 6.2, 7.6) format `[YYYY-MM-DD HH:MM SGT]`. Keep replaced wording as `SUPERSEDED [timestamp]`.
2. Add a change note to `docs/SPEC.md` (link is in the document index already, habit H10) and update `docs/CATCH-UP.md`.
3. Do not build anything. Recording only.
4. "owner decided" = the owner's own answer on 9 Nov. "default chosen" = my default, for the owner to confirm.

## 1. The screens
| Board | What the parent sees | Status |
|---|---|---|
| B1-6 Not today | The nudge is edited into a comforting note: "😴 Not today. That's completely fine. No more reminders from us today. We'll be back tomorrow." | owner decided; wording mine |
| B1-7 Photo ask | After a Done on a behaviour that allows photos: "Send a photo of what you did." | default chosen |
| B1-8 Photo matches | "✅ Photo added to today's log." | default chosen |
| B1-9 Photo not clear | "Photo saved. I couldn't tell if it shows the idea. Did you do it?" with one button "✅ Yes, I did it"; after the tap: "Thanks. Noted as self-reported. It still counts." | owner chose the add-on approach; wording mine |
| B1-10 Repeat log | Receipt: "✅ Saved: Showing affection, again today. It counts once for your week." then a special congratulation, sample: "🎉 Twice in one day, John! That is going above and beyond. Mia is lucky to have these moments, and so are you." Undo still applies | owner decided; wording mine |
| B1-11 Line too long | "That line is 312 characters. Please shorten it to 280 or fewer and send it again." | default chosen |

## 2. Decisions to record
### 2.1 Not today (rule 3.5) - owner decided
No more nudges that day, back tomorrow, no penalty, no judging. The nudge message is edited into the comforting note. It does not count as a log and does not affect streaks or steady weeks.

### 2.2 Photo check is an add-on (rules 6.1, 6.2) - owner decided
The log is already saved and counts. The check only adds a label. Match: marked photo-checked. No match, or the check could not run: one tap "✅ Yes, I did it" and the log is labelled **self-reported**. Nothing is removed or blocked. Photo consent is asked at the first photo (rule 5.5, wording as in the B2 handoff). Rule 1.3 holds: no invented check results. Withdrawing consent belongs to Settings (group C), not designed yet.

### 2.3 Repeat log (rule 5.4) - owner decided
A second log of the same behaviour on the same day **counts once** and gets a special congratulatory message. Undo applies as for any log.

### 2.4 Logging is for TODAY ONLY (rule 5.4 changed) - owner decided, 9 Nov
There is **no yesterday option**: it added complexity and confusion. Consequences:
- Rule 5.4's "back to yesterday only" is replaced by "today only". `/log` only picks a behaviour, with no day question.
- The "Monday log for Sunday" receipt wording of rule 7.6 is retired (the week still closes at midnight Sunday). The 1 to 5 question is unaffected (24 hours, B2 handoff).
- A tap on an **old nudge's ✅ Done after midnight saves nothing**. Default chosen (owner to confirm): a pop-up, not a new message. **Owner confirmed the default and changed the words (9 Nov 21:05):** "Reminder has expired. Tap a behaviour on the keyboard to log today."
- Unchosen behaviours are still accepted with thanks (rule 5.4, unchanged).

### 2.5 Line over 280 characters (rule 5.3) - default chosen
Not saved; the bot asks the parent to shorten it and send again (B1-11).

### 2.6 Expired moment (changes the B2 handoff, section 2.4, D-e) - owner confirmed, 9 Nov 21:05
After 24 hours a late photo or line is not saved. The owner confirmed the default and changed the words to: "Moment has expired. Tap Add a moment from this week to try again." (replaces "That took too long..."). The other D-e defaults are confirmed: other prompts win over a waiting moment prompt; keyboard labels, commands and button taps are never saved as moments; moments are not sent to Claude ("OK for now"). **Open (asked 9 Nov 21:05):** whether this message carries its own "Add a moment from this week" button so the parent can retry in one tap. Until answered, the button stays only on the Wrap Up summary (D-a).

## 3. Not designed yet
- Free-text logging (Claude matches what the parent types).
- If Claude fails to write a reply: default is that the receipt stands, the failure is recorded, and the parent sees nothing extra (rules 7.5, 1.3).
- How long the bot waits for a photo after a log (not defined).
- Withdrawing photo consent (group C Settings).
- Undo window: the 8 Nov handoff proposed 5 minutes; the approved rule 5.8 says 30 seconds, and that stands.

## 4. Backlog idea
A short grace period after midnight (for example before 3 am still counts as the previous day).

## 5. Where I got this
The owner's answers in Claude Chat on 9 Nov 2026 (20:00 to 20:58 SGT) and the specs. I did not edit any spec.
