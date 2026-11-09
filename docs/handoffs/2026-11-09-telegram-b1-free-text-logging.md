# Handoff to Claude Code: B1 part 3, free-text logging (9 Nov 2026)

Date: 2026-11-09, about 21:25 Singapore Time. Source: design chat in Claude Chat, Project "Family Habit App". Follows [2026-11-09-telegram-b1-not-today-photos-and-logs.md](2026-11-09-telegram-b1-not-today-photos-and-logs.md). Previews: private canvas "Onboarding: Telegram previews (low fidelity)", boards B1-12 to B1-16.

## 0. What to do
1. Record section 2 as **dated notes** in `src/telegram-bot/SPEC.md` (rule 5.1, "free text Claude understands, still to design", rules 5.3, 5.4, 7.8 side) and the Nudge engine or Telegram bot spec where the matching call lives, format `[YYYY-MM-DD HH:MM SGT]`. Keep replaced wording as `SUPERSEDED [timestamp]`.
2. Add a change note to `docs/SPEC.md` (link is in the document index already, habit H10) and update `docs/CATCH-UP.md`.
3. Do not build anything. Recording only.
4. "owner decided" = the owner's own answer on 9 Nov. "default confirmed" = my default, which the owner approved ("5 defaults OK", 9 Nov 21:22).

## 1. The screens (sample words are examples; Claude writes the real replies within `NUDGE-CONTEXT.md`)
| Board | What the parent sees | Status |
|---|---|---|
| B1-12 Matches a chosen habit | The parent types "We played cards after dinner and she laughed a lot". The bot asks "Did you do **Spending quality time**?" with **✅ Yes, log it** and **❌ No** | owner decided (ask first) |
| B1-13 After Yes | Receipt "✅ Saved: Spending quality time, today. Your words were added to today's log." then Claude's warm reply | owner decided |
| B1-14 Unchosen habit | "📝 Saved as a reflection. Thank you for sharing this, John. It won't count toward your targets." | owner decided |
| B1-15 Family moment, no habit | "📝 Saved as a reflection. What a moment, John. ... It shows under Feelings logged in your Wrap Up." | owner decided |
| B1-16 Gibberish or unrelated | "I couldn't find a match. Tap one on the keyboard to log today." | owner decided |

## 2. Decisions to record
### 2.1 When a typed message is treated as a log attempt
Only when no other prompt is waiting. A waiting "Add how you felt" or "Add a moment" prompt takes the text first (rule 5.3, B2 handoff D-e). Keyboard labels, commands and button taps are never matched. Claude is called to match the text to the parent's habits and the full list of 9.

### 2.2 Four outcomes (owner decided)
1. **Matches a chosen habit:** ask first. Nothing is logged until the parent taps Yes. On Yes the log is saved for today, and the typed text is **kept as the log's optional line** (up to 280 characters, rule 5.3; over 280, the bot asks to shorten it). Prompted or unprompted follows rule 5.2.
2. **Matches a habit the parent did not choose:** saved as a **reflection**, with thanks. Not a habit log, never counts toward targets (rule 5.4). Reflection only; it is not also logged as that habit (owner decided).
3. **Family-related but matches no habit:** saved as a reflection with a warm reply.
4. **Gibberish or unrelated:** nothing saved. Fixed message (B1-16).

A **reflection** is a saved line counted under **Feelings logged** in the Wrap Up (the B2 handoff definition: lines added plus lines saved as moments, now also reflections). It is stored like a moment's line, not as a log, and never counts toward days logged, targets, streaks or steady weeks. The owner's reason: encourage parents to write, so their words are not discarded.

### 2.3 Defaults confirmed
- Tapping **No** saves the words as a reflection instead ("No problem. Saved as a reflection instead.").
- If the call to Claude fails, the parent sees the same "I couldn't find a match" message and nothing is saved (rule 1.3, no fallbacks). The failure is recorded.
- The **child's name is never sent to Claude** (Q4): the bot removes it from the text before the match; the saved line keeps the original words.
- Text that says "yesterday" is not logged (today only, B1 part 2 handoff 2.4).
- If two habits match, the bot asks which one.

## 3. Not changed
Rules 3.4, 5.5 (consent at the first photo), 5.8 (Undo, 30 seconds, applies to keyboard logs) and 8.4 apply as they stand. A free-text log confirmed with Yes does not need Undo because the parent already confirmed.

## 4. Open questions after this handoff
- **Privacy review:** typed text goes to Claude (name removed). Rules for the Privacy and security reviewer: no other personal details in the call, how long the text is kept, and the PDPA reviewer's view on reflections that mention the child.
- **Rate limit:** a cap on matching calls per parent per day, to control cost and abuse (not designed; a starting number in `src/settings.ts`, rule 1.4).
- **Reflections database change:** where reflections are stored (datastore rule 8.x) and how the Wrap Up counts them. For Claude Code to propose.
- **Still to design in B1:** how long the bot waits for a photo on a log; what the parent sees if Claude fails to write a warm reply (default: receipt stands, failure recorded, nothing extra). Withdrawing photo consent goes to group C Settings.

## 4a. Answers to Claude Code's seven points (owner, 9 Nov 21:35)
Claude Code listed seven conflicts and gaps. The owner confirmed they are correct and answered:
1. **Steady weeks and the monthly section: decided.** Drop the "Your streak starts next week" line. Steady weeks and the monthly view live on **My page** (rule 9.1), not in the Wrap Up.
2. **Unchosen habit: decided, one rule for both.** An unchosen habit logged by `/log` or typed is saved as a **reflection**, never a habit log and never toward targets. **Rule 5.4 changes** from "accepted with thanks" to "saved as a reflection, with thanks". Detail for Claude Code to propose (my default, owner to confirm): a `/log` tap on an unchosen habit has no words yet, so the bot thanks the parent and offers "Add how you felt"; the reflection is saved once a line is added.
3. **Wrap Up for reflection-only parents: decided yes.** Anyone with any activity (a log, a reflection or a moment) gets the Wrap Up. **Rule 3.12 changes.**
4. **Retiring the yesterday test: approved.** Claude Code may remove the test "a log made on Monday for Sunday... the receipt says so" and replace it at build time with "a log for any day but today is refused". The minimum test count must still hold.
5. **Database (add-only blocks three designs): not yet answered by the owner.** Claude Code recommends one Datastore proposal (photo added to a saved log, reflections, moments, and the planned photo delete). Treat as recommended; owner to confirm.
6. **Privacy of typed text: not yet answered.** Claude Code recommends logging it as known issues for the privacy reviewer (nicknames, typos and a sibling's name get past the name removal; health details; the 24-hour moment window). I agree.
7. **B2 defaults: not yet confirmed.** "Saved to your album", "That photo wasn't saved...", the Add a moment button staying on the summary, and the "This question has closed." pop-up.

## 5. Where I got this
The owner's answers in Claude Chat on 9 Nov 2026, 21:15 to 21:22 SGT, and the specs. I did not edit any spec.
